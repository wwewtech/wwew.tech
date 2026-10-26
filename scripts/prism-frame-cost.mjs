// Measures the actual per-frame cost of the Prism shader at several DPR
// levels, on the weakest render path available (SwiftShader = CPU), to model
// a low-end laptop GPU. Prints ms/frame for dpr 1.0 / 1.25 / 1.5 / 2.0 so the
// cap can be chosen with data instead of guesswork.
//
// Usage: node scripts/prism-frame-cost.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9242;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-cost-'));
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

// Runs the Prism draw N times with a forced renderer DPR and reports ms/frame.
const runAtDpr = (dpr) => evaluate(`(async () => {
  const container = document.querySelector('.prism-container');
  if (!container || !container.__prismMesh) return 'NO_PRISM';
  const mesh = container.__prismMesh;
  const gl = mesh.gl || mesh.program.gl;
  const canvas = gl.canvas;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * ${dpr});
  canvas.height = Math.round(h * ${dpr});
  gl.viewport(0, 0, canvas.width, canvas.height);
  mesh.program.uniforms.iResolution.value[0] = canvas.width;
  mesh.program.uniforms.iResolution.value[1] = canvas.height;
  // warmup
  for (let i = 0; i < 5; i++) mesh.program.uniforms.iTime.value = i, gl.drawElements && 0;
  const renderer = container.__prismRenderer;
  const draws = 30;
  const t0 = performance.now();
  for (let i = 0; i < draws; i++) {
    mesh.program.uniforms.iTime.value = i * 0.016;
    renderer.render({ scene: mesh });
  }
  const perFrame = (performance.now() - t0) / draws;
  return JSON.stringify({ dpr: ${dpr}, w: canvas.width, h: canvas.height, perFrameMs: Math.round(perFrame * 10) / 10, fps: Math.round(1000 / perFrame) });
})()`);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(6000);

console.log('Prism per-frame draw cost (SwiftShader = weak-GPU proxy):');
for (const dpr of [1.0, 1.25, 1.5, 2.0]) {
  const r = await runAtDpr(dpr);
  const o = typeof r === 'string' ? JSON.parse(r) : r;
  console.log(`  dpr=${o.dpr}: ${o.w}x${o.h} -> ${o.perFrameMs}ms/frame (${o.fps}fps theoretical)`);
}

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
