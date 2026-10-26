// Measures the real frame rate of the Prism canvas in the hero section:
// while it is in the viewport, and after scrolling away. Reports the rAF
// rate and the per-frame render time of the canvas.
//
// Usage: node scripts/fps-prism.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9237;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-fps-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--window-size=1280,800',
  'about:blank',
  // Real GPU, no swiftshader: we want the same render path a user has.
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
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};

// Instrument rAF in the page before load.
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__fps = { frames: [], lastSample: 'none' };
    (function () {
      let prev = performance.now();
      function tick(t) {
        window.__fps.frames.push(t - prev);
        prev = t;
        if (window.__fps.frames.length > 600) window.__fps.frames.shift();
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();
  `,
}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(5000);

const sample = (label) => evaluate(`(function () {
  const f = window.__fps.frames.slice(-120);
  const avg = f.reduce((a, b) => a + b, 0) / (f.length || 1);
  window.__fps.lastSample = '${label}';
  return JSON.stringify({ label: '${label}', avgFrameMs: Math.round(avg * 10) / 10, fps: Math.round(1000 / avg), frames: f.length });
})()`);

console.log('=== FASE 1: hero in viewport ===');
console.log(await sample('hero-in-view'));

await evaluate(`window.scrollTo(0, 1200)`);
await sleep(2500);
console.log('=== FASE 2: scrolled away (below hero) ===');
console.log(await sample('scrolled-away'));

await evaluate(`window.scrollTo(0, 0)`);
await sleep(1500);
console.log('=== FASE 3: back to hero ===');
console.log(await sample('back-to-hero'));

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
