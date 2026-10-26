// Reproduces the fps-scroll burst against a URL and reports, per phase, the
// rAF gaps plus which canvases exist - so the 700ms scroll spike can be tied
// to whichever canvas appeared at that moment (Prism vs the lazy 3D scene).
//
// Usage: node scripts/spike-source.mjs <url> [--enable-unsafe-swiftshader]

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9245;
const url = process.argv[2];
const extra = process.argv.slice(3);

const profile = mkdtempSync(join(tmpdir(), 'dsh-spk-'));
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

// Frame recorder that also snapshots DOM state when a big gap is about to be
// reported: after each frame, if the gap exceeded 100ms, record what changed.
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__rec = { frames: [], phase: 'none', events: [] };
    (function () {
      let prev = performance.now();
      let beforeCanvases = document.querySelectorAll('canvas').length;
      function tick(t) {
        const gap = t - prev;
        if (gap > 100) {
          window.__rec.events.push({
            at: Math.round(t),
            gap: Math.round(gap),
            canvasesBefore: beforeCanvases,
            canvasesAfter: document.querySelectorAll('canvas').length,
            scrollY: Math.round(window.scrollY),
          });
        }
        beforeCanvases = document.querySelectorAll('canvas').length;
        window.__rec.frames.push({ d: t - prev, p: window.__rec.phase, t });
        prev = t;
        if (window.__rec.frames.length > 3000) window.__rec.frames.shift();
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();
  `,
}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(5000);
console.log('  initial: ' + await evaluate('JSON.stringify({ canvases: document.querySelectorAll("canvas").length, scrollY: Math.round(window.scrollY) })'));

await evaluate(`window.__rec.phase = 'scrolling'`);
const WHEELS = Number(process.env.WHEELS ?? '40');
for (let i = 0; i < WHEELS; i++) {
  await send(ws, 'Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: 120,
  }, sessionId);
  await sleep(50);
}
await sleep(800);
console.log('  after scroll: ' + await evaluate('JSON.stringify({ canvases: document.querySelectorAll("canvas").length, scrollY: Math.round(window.scrollY), maxScroll: document.documentElement.scrollHeight - window.innerHeight })'));

console.log('  gaps > 100ms during scroll (what changed at each):');
const ev = JSON.parse(await evaluate('JSON.stringify(window.__rec.events)'));
if (!ev.length) console.log('    (none)');
for (const e of ev) {
  console.log(`    gap=${e.gap}ms at t=${e.at}  canvas ${e.canvasesBefore}->${e.canvasesAfter}  scrollY=${e.scrollY}`);
}

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
