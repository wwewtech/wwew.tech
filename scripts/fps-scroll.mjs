// Measures hero FPS during ACTIVE scrolling (Lenis smooth-wheel + Prism
// rendering together), which is the scenario reported as laggy on a laptop:
// the hero stutters while it is being scrolled past, not when idle.
//
// Usage: node scripts/fps-scroll.mjs <url> [--enable-unsafe-swiftshader]

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9243;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';
const extra = process.argv.slice(3);

const profile = mkdtempSync(join(tmpdir(), 'dsh-scr-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--window-size=1280,800',
  'about:blank',
  ...extra,
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
    setTimeout(() => { if (pending.has(p.id)) { pending.delete(p.id); reject(new Error('timeout ' + method)); } }, 45000);
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

// rAF frame-time recorder with phase tagging.
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__fps = { frames: [], phase: 'none' };
    (function () {
      let prev = performance.now();
      function tick(t) {
        window.__fps.frames.push({ d: t - prev, p: window.__fps.phase, t });
        prev = t;
        if (window.__fps.frames.length > 2000) window.__fps.frames.shift();
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();
  `,
}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(5000);

// How many window scroll events actually fire during the wheel burst? If
// Lenis drives scrollTop they must fire; if it doesn't, a scroll-pause in
// Prism listening on 'scroll' would never trigger (which is what happened
// when a pause attempt showed no effect).
await evaluate(`window.__scrollEvents = 0; window.addEventListener('scroll', () => window.__scrollEvents++, { passive: true })`);

const report = (label) => evaluate(`(function () {
  const f = window.__fps.frames.filter(x => x.p === '${label}');
  if (!f.length) return JSON.stringify({ label: '${label}', note: 'no frames' });
  const recent = f.slice(-150);
  const avg = recent.reduce((a, b) => a + b.d, 0) / recent.length;
  const worstIdx = recent.reduce((mi, x, i) => x.d > recent[mi].d ? i : mi, 0);
  const worst = recent[worstIdx];
  const sorted = [...recent].sort((a, b) => a.d - b.d);
  const p95 = sorted[Math.floor(sorted.length * 0.95)].d;
  return JSON.stringify({ label: '${label}', avgFps: Math.round(1000 / avg), avgMs: Math.round(avg * 10) / 10, p95Ms: Math.round(p95), worstMs: Math.round(worst.d), worstAtMs: Math.round(worst.t), firstFrameT: Math.round(recent[0].t), frames: recent.length });
})()`);

// Phase 1: idle in hero
await evaluate(`window.__fps.phase = 'idle'`);
await sleep(2000);
console.log('  ' + await report('idle'));

// Phase 2: scroll DOWN through the page with many wheel events (Lenis path)
await evaluate(`window.__fps.phase = 'scrolling'`);
for (let i = 0; i < 40; i++) {
  await send(ws, 'Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: 120,
  }, sessionId);
  await sleep(50);
}
console.log('  ' + await report('scrolling'));
console.log('  scroll events during burst: ' + await evaluate('window.__scrollEvents'));

// Phase 2b: scroll back UP and DOWN again — is the spike one-time (init) or
// does it repeat on every scroll burst?
await evaluate(`window.__fps.phase = 'scrolling2'`);
await evaluate(`window.scrollTo(0, 0)`);
await sleep(800);
for (let i = 0; i < 40; i++) {
  await send(ws, 'Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: 120,
  }, sessionId);
  await sleep(50);
}
console.log('  ' + await report('scrolling2'));

// Phase 3: idle again (below hero)
await evaluate(`window.__fps.phase = 'idle2'`);
await sleep(1500);
console.log('  ' + await report('idle2'));

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
