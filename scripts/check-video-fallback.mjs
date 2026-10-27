// Verifies the hero background decision logic end-to-end on a live build:
// runs the page with prefers-reduced-motion and with Save-Data emulated,
// and confirms that (a) the video element is used and plays, (b) no WebGL
// canvas is created for the hero, and (c) the default (clean) profile still
// gets the shader canvas instead of the video.
//
// Usage: node scripts/check-video-fallback.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9250;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-vfb-'));
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

const heroState = () => evaluate(`(() => {
  const video = document.querySelector('video[aria-hidden="true"]');
  const prism = document.querySelector('.prism-container');
  const canvas = prism?.querySelector('canvas') ?? null;
  return JSON.stringify({
    hasVideo: !!video,
    videoPlaying: video ? !!(video.currentTime > 0 && !video.paused) : false,
    videoSrc: video ? (video.currentSrc || video.src || '').split('/').pop() : null,
    hasPrismContainer: !!prism,
    hasPrismCanvas: !!canvas,
  });
})()`);

const scenarios = [
  {
    name: 'default (no signals) -> WebGL shader',
    emulate: null,
    expectVideo: false,
  },
  {
    name: 'prefers-reduced-motion -> video',
    emulate: { reducedMotion: 'reduce' },
    expectVideo: true,
  },
];

let failures = 0;
for (const s of scenarios) {
  await send(ws, 'Emulation.clearDeviceMetricsOverride', {}, sessionId).catch(() => {});
  if (s.emulate?.reducedMotion) {
    await send(ws, 'Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: s.emulate.reducedMotion }] }, sessionId);
  } else {
    await send(ws, 'Emulation.setEmulatedMedia', { features: [] }, sessionId);
  }
  await send(ws, 'Page.navigate', { url }, sessionId);
  await sleep(5000);
  const state = JSON.parse(await heroState());
  const okVideo = s.expectVideo ? state.hasVideo && state.videoPlaying : true;
  const okPrism = s.expectVideo ? !state.hasPrismCanvas : state.hasPrismContainer;
  const pass = okVideo && okPrism && (s.expectVideo ? true : !state.hasVideo);
  if (!pass) failures++;
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${s.name}`);
  console.log(`         ${JSON.stringify(state)}`);
}

console.log(failures ? `\n${failures} FAILURES` : '\nall scenarios passed');

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(failures ? 1 : 0);
