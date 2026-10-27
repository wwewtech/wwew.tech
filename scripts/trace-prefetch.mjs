// Traces every _rsc (RSC prefetch) request the page makes, with timing, so
// duplicate prefetches can be told apart from viewport/intent prefetch pairs.
//
// Usage: node scripts/trace-prefetch.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9235;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-pf-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
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
    setTimeout(() => pending.has(p.id) && (pending.delete(p.id), reject(new Error('timeout ' + method))), 30000);
  });
}

const ws = await connect(await getWsUrl());
const requests = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
  if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('_rsc')) {
    requests.push({ t: Date.now(), url: m.params.request.url, headers: m.params.request.headers });
  }
});

const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });
await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Network.enable', {}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
const t0 = Date.now();
await sleep(8000);

console.log(`_rsc prefetch requests for ${url}:`);
if (!requests.length) console.log('  (none)');
for (const r of requests) {
  const purpose = r.headers['Next-Router-Prefetch'] ?? r.headers['next-router-prefetch'] ?? '?';
  const kind = r.headers['RSC'] ?? r.headers['rsc'] ?? '';
  console.log(`  +${String(r.t - t0).padStart(5)}ms  prefetch=${purpose} rsc=${kind}  ${r.url.slice(0, 70)}`);
}

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
