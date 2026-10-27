// Records the hero Prism background as a looping video for both themes.
//
// Drives a real Chrome over CDP, hides everything except the Prism canvas
// (via CSS injection so the shader keeps running untouched), captures the
// region as raw frames through Page.startScreencast, then assembles them
// into a webm with ffmpeg.
//
// Usage: node scripts/record-hero.mjs <url> <outPrefix> [seconds]

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9247;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';
const outPrefix = process.argv[3] ?? 'hero';
const seconds = Number(process.argv[4] ?? '8');

const outDir = mkdtempSync(join(tmpdir(), 'dsh-rec-'));
const framesDir = join(outDir, 'frames');
mkdirSync(framesDir, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(outDir, 'profile')}`,
  '--window-size=1280,720',
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
    setTimeout(() => { if (pending.has(p.id)) { pending.delete(p.id); reject(new Error('timeout ' + method)); } }, 60000);
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

// Isolate the Prism canvas: hide every sibling so the capture is exactly the
// shader output. The Prism component itself stays untouched.
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    (function () {
      const style = document.createElement('style');
      style.textContent = [
        '*, *::before, *::after { animation: none !important; transition: none !important; }',
        'body > div > nav, main, footer { display: none !important; }',
        '#home section > div:not([style*="mask"]) { display: none !important; }',
        '#home h1, #home p, #home a, #home div.flex { display: none !important; }',
        'section { min-height: 0 !important; }',
        '#home { position: fixed; inset: 0; overflow: hidden; height: 100vh; }',
      ].join('');
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    })();
  `,
}, sessionId);

// Screencast frames arrive as events.
const frames = [];
let frameNo = 0;
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Page.screencastFrame' && m.sessionId === sessionId) {
    frames.push(m.params.data);
    writeFileSync(join(framesDir, `f${String(frameNo++).padStart(5, '0')}.jpg`), Buffer.from(m.params.data, 'base64'));
    send(ws, 'Page.screencastFrameAck', { sessionId: m.params.sessionId }, sessionId).catch(() => {});
  }
});

for (const [theme, name] of [['dark', 'dark'], ['light', 'light']]) {
  frames.length = 0;
  frameNo = 0;

  await send(ws, 'Page.navigate', { url }, sessionId);
  await sleep(2000);
  await evaluate(`localStorage.setItem('theme', ${JSON.stringify(theme)})`);
  await send(ws, 'Page.reload', {}, sessionId);
  await sleep(5000); // let Prism init on its idle+fallback schedule

  await send(ws, 'Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    maxWidth: 1280,
    maxHeight: 720,
    everyNthFrame: 1,
  }, sessionId);

  await sleep(seconds * 1000);
  await send(ws, 'Page.stopScreencast', {}, sessionId);
  await sleep(500);

  const webm = `${outPrefix}-${name}.webm`;
  // Assemble: jpeg sequence -> webm loop.
  const ff = spawn('ffmpeg', [
    '-y',
    '-framerate', '30',
    '-i', join(framesDir, 'f%05d.jpg'),
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuv420p',
    '-b:v', '1.2M',
    '-an',
    webm,
  ], { stdio: 'inherit' });
  await new Promise((res) => ff.on('close', res));

  console.log(`captured ${frames.length} frames -> ${webm}`);
}

chrome.kill();
try { rmSync(outDir, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
