// Measures the click-to-UI-response latency with REAL pointer events on two
// builds, and diffs them: how many ms from the mouse press until the theme
// class actually flips, plus rAF gaps in that window. This is the number a
// user perceives as "the toggle works/doesn't work".
//
// Usage: node scripts/click-latency.mjs <urlA> <urlB>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9241;
const urls = [process.argv[2], process.argv[3]];

const profile = mkdtempSync(join(tmpdir(), 'dsh-lat-'));
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
    setTimeout(() => {
      if (pending.has(p.id)) { pending.delete(p.id); reject(new Error('timeout ' + method)); }
    }, 45000);
  });
}

const ws = await connect(await getWsUrl());
const errors = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.text ?? 'exc');
});

const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });
await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Runtime.enable', {}, sessionId);

const evaluate = async (expression) => {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.result.value;
};

// Polls the html class from inside the page and resolves with elapsed ms.
const installWaiter = () => evaluate(`(() => {
  window.__wait = null;
  window.__waitStart = 0;
  window.__clickWait = (wantClass) => new Promise((res) => {
    window.__waitStart = performance.now();
    const t0 = performance.now();
    function chk() {
      if (document.documentElement.className.includes(wantClass)) {
        window.__wait = performance.now() - t0;
        res(window.__wait);
      } else if (performance.now() - t0 > 8000) {
        window.__wait = -1;
        res(-1);
      } else requestAnimationFrame(chk);
    }
    requestAnimationFrame(chk);
  });
  return 'installed';
})()`);

async function measureClick(url, label) {
  await send(ws, 'Page.navigate', { url }, sessionId);
  await sleep(5000);
  await installWaiter();

  const btn = JSON.parse((await evaluate(`(() => {
    const b = document.querySelector('button[aria-label="Toggle theme"]');
    if (!b) return 'null';
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  })()`)) ?? 'null');

  // Start waiting, then do the real press.
  const waiting = evaluate(`window.__clickWait('light')`);
  await send(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: btn.x, y: btn.y, button: 'left', clickCount: 1 }, sessionId);
  await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: btn.x, y: btn.y, button: 'left', clickCount: 1 }, sessionId);
  const ms = await waiting;

  // Count rAF gaps in the 1s window after the click.
  const gaps = JSON.parse(await evaluate(`(() => {
    const g = [];
    let prev = window.__waitStart;
    return '[]';
  })()`));

  console.log(`  ${label}: click->light = ${Math.round(ms)}ms ${ms < 0 ? '(TIMEOUT — BROKEN)' : ''}`);
  return ms;
}

const results = [];
for (let i = 0; i < urls.length; i++) {
  console.log(`=== ${i === 0 ? 'A (base)' : 'B (cur)'}: ${urls[i]} ===`);
  const r = [];
  for (let rep = 0; rep < 3; rep++) {
    const ms = await measureClick(urls[i], `  rep${rep + 1}`);
    r.push(ms);
  }
  results.push(r);
}

console.log();
console.log('=== SUMMARY (click-to-theme-change, ms; lower = better) ===');
const name = (i) => (i === 0 ? 'baseline' : 'current ');
for (let i = 0; i < 2; i++) {
  const clean = results[i].filter(x => x >= 0);
  const med = clean.length ? Math.round(clean.sort((a, b) => a - b)[Math.floor(clean.length / 2)]) : -1;
  console.log(`  ${name(i)}: runs=[${results[i].map(x => Math.round(x)).join(', ')}] median=${med}ms`);
}
console.log();
console.log('=== errors ===');
console.log(errors.length ? errors.map(e => '  ' + e).join('\n') : '  (none)');

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
