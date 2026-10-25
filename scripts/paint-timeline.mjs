// Measures paint timings directly: FCP, LCP candidates with their render
// times, and what the main thread is doing between FCP and the final LCP.
//
// Usage: node scripts/paint-timeline.mjs <url> [cpuThrottle]

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9234;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';
const throttle = Number(process.argv[3] ?? 4);

const profile = mkdtempSync(join(tmpdir(), 'dsh-paint-'));
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

const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });
await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Runtime.enable', {}, sessionId);

// Lighthouse-style CPU throttling. setCPUThrottlingRate needs no separate
// Emulation.enable call in current Chrome.
await send(ws, 'Emulation.setCPUThrottlingRate', { rate: throttle }, sessionId);

await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__tl = { fcp: null, lcp: [], paints: [] };
    new Promise(r => {
      const po = new PerformanceObserver(l => {
        for (const e of l.getEntries()) window.__tl.fcp = Math.round(e.startTime);
        r();
      });
      po.observe({ type: 'paint', buffered: true });
    });
    try {
      const po2 = new PerformanceObserver(l => {
        for (const e of l.getEntries()) {
          window.__tl.lcp.push({
            t: Math.round(e.renderTime || e.startTime),
            size: e.size,
            el: e.element ? e.element.tagName + '.' + String(e.element.className).split(' ').slice(0,2).join('.') : null,
          });
        }
      });
      po2.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
  `,
}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(9000);

const r = await send(ws, 'Runtime.evaluate', {
  expression: 'JSON.stringify(window.__tl)',
  returnByValue: true,
}, sessionId);
const tl = JSON.parse(r.result.value);

console.log(`CPU throttle: x${throttle}`);
console.log(`  FCP: ${tl.fcp}ms`);
console.log(`  LCP candidates:`);
for (const c of tl.lcp) {
  console.log(`    t=${c.t}ms  size=${c.size}  ${c.el}`);
}
if (tl.lcp.length) {
  const last = tl.lcp[tl.lcp.length - 1];
  console.log(`  final LCP = ${last.t}ms  (gap after FCP: ${last.t - tl.fcp}ms)`);
}

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
