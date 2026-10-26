// Correlates the ~700ms bottom-of-page rAF gap with what the main thread
// was doing during it: samples the CPU profile, then reports the heaviest
// functions inside the gap window specifically (not the whole page).
//
// Usage: node scripts/gap-profile.mjs <url> [WHEELS=100]

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9246;
const url = process.argv[2];
const WHEELS = Number(process.argv[3] ?? '100');

const profile = mkdtempSync(join(tmpdir(), 'dsh-gap-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--window-size=1280,800',
  'about:blank',
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
    setTimeout(() => { if (pending.has(p.id)) { pending.delete(p.id); reject(new Error('timeout ' + method)); } }, 60000);
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

const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });
await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Runtime.enable', {}, sessionId);

const evaluate = async (expression) => {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.result.value;
};

// rAF gap detector that records the exact window of the biggest gap.
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__gap = { biggest: null };
    (function () {
      let prev = performance.now();
      function tick(t) {
        const d = t - prev;
        if (d > 100 && (!window.__gap.biggest || d > window.__gap.biggest.d)) {
          window.__gap.biggest = { start: prev, end: t, d: Math.round(d), scrollY: Math.round(window.scrollY) };
        }
        prev = t;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();
  `,
}, sessionId);

// CPU profile over the whole run.
await send(ws, 'Profiler.enable', {}, sessionId);
await send(ws, 'Profiler.setSamplingInterval', { interval: 500 }, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(5000);

await send(ws, 'Profiler.start', {}, sessionId);
for (let i = 0; i < WHEELS; i++) {
  await send(ws, 'Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: 120,
  }, sessionId);
  await sleep(50);
}
await sleep(1000);
const { profile: cpuProfile } = await send(ws, 'Profiler.stop', {}, sessionId);

const biggest = JSON.parse(await evaluate('JSON.stringify(window.__gap.biggest)'));
console.log('biggest gap: ' + JSON.stringify(biggest));

// Build a time-per-function map from the profile, filtered to the gap window.
const nodes = new Map();
for (const n of cpuProfile.nodes) nodes.set(n.id, n);
const deltas = cpuProfile.timeDeltas ?? [];
const samples = cpuProfile.samples ?? [];
let t = (cpuProfile.startTime ?? 0);

const selfTime = new Map();
for (let i = 0; i < samples.length; i++) {
  t += deltas[i] ?? 0;
  const n = nodes.get(samples[i]);
  if (!n) continue;
  const inGap = t >= biggest.start && t <= biggest.end;
  if (!inGap) continue;
  const f = n.callFrame;
  const key = `${f.functionName || '(anon)'} @ ${(f.url || '').split('/').pop()}:${f.lineNumber}`;
  selfTime.set(key, (selfTime.get(key) ?? 0) + (deltas[i] ?? 0));
}

const sorted = [...selfTime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log('top functions INSIDE the gap window:');
let total = 0;
for (const [k, v] of sorted) {
  total += v;
  console.log(`  ${Math.round(v / 1000)}ms  ${k}`);
}
console.log(`  (profiled total in gap: ${Math.round(total / 1000)}ms)`);

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
