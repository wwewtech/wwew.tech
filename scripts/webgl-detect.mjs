// Detects what the GPU/WebGL situation is under headless Chrome and what
// Lighthouse would see: real GPU, SwiftShader, or none.
//
// Usage: node scripts/webgl-detect.mjs [chromeFlags...]

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9231;
const extraFlags = process.argv.slice(2);

const profile = mkdtempSync(join(tmpdir(), 'dsh-gpu-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  ...extraFlags,
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
    setTimeout(() => pending.has(p.id) && (pending.delete(p.id), reject(new Error('timeout ' + method))), 20000);
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
await send(ws, 'Runtime.enable', {}, sessionId);

const PROBE = `(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (!gl) return JSON.stringify({ webgl: false });
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';
  // rough per-frame cost of a small shader
  const t0 = performance.now();
  for (let i = 0; i < 60; i++) gl.clear(gl.COLOR_BUFFER_BIT);
  const perFrame = (performance.now() - t0) / 60;
  return JSON.stringify({ webgl: true, renderer, clearMs: perFrame.toFixed(3) });
})()`;

const r = await send(ws, 'Runtime.evaluate', { expression: PROBE, returnByValue: true }, sessionId);
console.log(JSON.stringify({ flags: extraFlags.length ? extraFlags : ['(defaults: swiftshader is NOT auto-enabled)'], probe: JSON.parse(r.result.value) }, null, 2));

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
