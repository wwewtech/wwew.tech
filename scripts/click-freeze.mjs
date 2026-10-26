// Reproduces the user's exact scenario: real mouse clicks on the toggles
// (pointerdown + click), with the network and main thread traced, so a UI
// freeze at the first interaction can be caught and attributed.
//
// Usage: node scripts/click-freeze.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9239;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-frz-'));
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
    setTimeout(() => pending.has(p.id) && (pending.delete(p.id), reject(new Error('timeout ' + method))), 45000);
  });
}

const ws = await connect(await getWsUrl());
const errors = [];
const requests = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.text ?? 'exc');
  if (m.method === 'Network.requestWillBeSent') {
    const u = m.params.request.url;
    if (u.includes('tag.js') || u.includes('yandex') || u.includes('watch')) {
      requests.push({ t: Date.now(), url: u.slice(0, 60) });
    }
  }
});

const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });
await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Runtime.enable', {}, sessionId);
await send(ws, 'Network.enable', {}, sessionId);

const evaluate = async (expression) => {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.result.value;
};

// rAF-based freeze detector, installed before load.
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__freeze = { gaps: [] };
    (function () {
      let prev = performance.now();
      function tick(t) {
        const gap = t - prev;
        if (gap > 60) window.__freeze.gaps.push({ at: Math.round(t), ms: Math.round(gap) });
        prev = t;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();
  `,
}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(5000);

// Locate the theme toggle and do a REAL pointer click at its coordinates.
const getBtn = async (label) => evaluate(`(() => {
  const b = document.querySelector('button[aria-label="${label}"]');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
})()`);

const btn = JSON.parse((await getBtn('Toggle theme')) ?? 'null');
if (btn) {
  console.log(`theme button at (${Math.round(btn.x)}, ${Math.round(btn.y)}); dispatching real pointer events`);
  await send(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: btn.x, y: btn.y, button: 'left', clickCount: 1 }, sessionId);
  await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: btn.x, y: btn.y, button: 'left', clickCount: 1 }, sessionId);
} else {
  console.log('theme button NOT FOUND');
}

await sleep(3000);

const freeze = await evaluate('JSON.stringify(window.__freeze.gaps)');
console.log('=== rAF gaps > 60ms (UI freezes) after the click ===');
const gaps = JSON.parse(freeze);
if (!gaps.length) console.log('  (none — no freeze in this environment)');
for (const g of gaps) console.log(`  gap ${g.ms}ms at t=${g.at}ms`);

console.log('=== yandex requests triggered by the click ===');
if (!requests.length) console.log('  (none)');
for (const r of requests) console.log(`  ${r.url}`);

console.log('=== errors ===');
console.log(errors.length ? errors.map(e => '  ' + e).join('\n') : '  (none)');

console.log('=== final state ===');
console.log('  ' + await evaluate('JSON.stringify({ htmlClass: document.documentElement.className, themeLS: localStorage.getItem("theme") })'));

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
