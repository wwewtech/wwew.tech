// Profiles the initial load of a page and reports the heaviest call stacks,
// so a long task attributed only to "Unattributable" can be traced to its
// real source (hydration, WebGL init, a library, ...).
//
// Usage: node scripts/profile-load.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9232;

const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-prof-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  url,
  '--remote-allow-origins=*',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await res.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch { /* not ready */ }
    await sleep(250);
  }
  throw new Error('DevTools unavailable');
}

function connect(u) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(u);
    ws.addEventListener('open', () => res(ws));
    ws.addEventListener('error', rej);
  });
}

let id = 0;
const pending = new Map();
function send(ws, method, params = {}, sessionId) {
  const p = { id: ++id, method, params };
  if (sessionId) p.sessionId = sessionId;
  ws.send(JSON.stringify(p));
  return new Promise((resolve, reject) => {
    pending.set(p.id, { resolve, reject });
    setTimeout(() => pending.has(p.id) && (pending.delete(p.id), reject(new Error('timeout ' + method))), 60000);
  });
}

const ws = await connect(await getWsUrl());
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});

const targets = await send(ws, 'Target.getTargets');
const page = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('127.0.0.1') || t.url.includes('wwew'));
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId: page.targetId, flatten: true });

await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Runtime.enable', {}, sessionId);

// Profile the reload: CPU profile over the first ~6 seconds.
await send(ws, 'Profiler.enable', {}, sessionId);
await send(ws, 'Profiler.setSamplingInterval', { interval: 1000 }, sessionId);
await send(ws, 'Profiler.start', {}, sessionId);
await send(ws, 'Page.reload', { ignoreCache: true }, sessionId);
await sleep(6000);
const { profile: cpuProfile } = await send(ws, 'Profiler.stop', {}, sessionId);

// Aggregate self-time per function.
const nodes = new Map();
for (const n of cpuProfile.nodes) nodes.set(n.id, n);

const selfTime = new Map();
const totalTime = new Map();
const timeDeltas = cpuProfile.timeDeltas ?? [];
const samples = cpuProfile.samples ?? [];
let t = 0;
for (let i = 0; i < samples.length; i++) {
  t += timeDeltas[i] ?? 0;
  const n = nodes.get(samples[i]);
  if (!n) continue;
  const f = n.callFrame;
  const key = `${f.functionName || '(anonymous)'} @ ${(f.url || '').split('/').pop()}:${f.lineNumber}`;
  selfTime.set(key, (selfTime.get(key) ?? 0) + (timeDeltas[i] ?? 0));
}

const sorted = [...selfTime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('Top self-time functions:');
for (const [k, v] of sorted) console.log(`  ${Math.round(v / 1000)} ms  ${k}`);

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
