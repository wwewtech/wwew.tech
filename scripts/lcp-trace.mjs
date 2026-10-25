// Reports which element is the LCP candidate and the timeline of every LCP
// candidate, by hooking PerformanceObserver before the page loads.
//
// Usage: node scripts/lcp-trace.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9233;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-lcp-'));
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

// Install the observer via addScriptToEvaluateOnNewDocument so it runs before
// any page code.
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__lcpCandidates = [];
    (function () {
      try {
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            window.__lcpCandidates.push({
              size: e.size,
              startTime: Math.round(e.startTime),
              renderTime: Math.round(e.renderTime || e.startTime),
              url: (e.url || '').slice(-60),
              element: e.element ? (e.element.tagName + '.' + String(e.element.className).slice(0, 40)) : null,
              id: e.id || null,
            });
          }
        });
        po.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {}
    })();
  `,
}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(7000);

const r = await send(ws, 'Runtime.evaluate', {
  expression: 'JSON.stringify(window.__lcpCandidates || [])',
  returnByValue: true,
}, sessionId);

console.log('LCP candidates (in observation order):');
for (const c of JSON.parse(r.result.value)) {
  console.log(`  t=${String(c.startTime).padStart(5)}ms  size=${String(c.size).padStart(7)}  ${c.element ?? c.url}`);
}
console.log('Final LCP = the last entry.');

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
