// Captures a fixed set of screenshots for visual regression comparison.
//
// Usage: node scripts/visual-capture.mjs <outputDir>
//
// The script drives headless Chrome over CDP, visits both locales in both
// themes and captures each section. Two runs (before/after a change) can be
// compared pixel by pixel.

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3999';
const OUT = process.argv[2] || 'C:/Users/User/AppData/Local/Temp/visual';

const SHOTS = [
  { name: 'ru-dark-hero', url: '/ru', theme: 'dark', scroll: 0 },
  { name: 'ru-dark-about', url: '/ru', theme: 'dark', scroll: 'about' },
  { name: 'ru-dark-stack', url: '/ru', theme: 'dark', scroll: 'stack' },
  { name: 'ru-dark-contact', url: '/ru', theme: 'dark', scroll: 'contact' },
  { name: 'ru-light-hero', url: '/ru', theme: 'light', scroll: 0 },
  { name: 'ru-light-about', url: '/ru', theme: 'light', scroll: 'about' },
  { name: 'ru-light-stack', url: '/ru', theme: 'light', scroll: 'stack' },
  { name: 'ru-light-contact', url: '/ru', theme: 'light', scroll: 'contact' },
  { name: 'en-dark-hero', url: '/en', theme: 'dark', scroll: 0 },
  { name: 'en-light-about', url: '/en', theme: 'light', scroll: 'about' },
];

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'dsh-visual-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  '--window-size=1280,800',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch { /* not ready */ }
    await sleep(250);
  }
  throw new Error('DevTools endpoint unavailable');
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', reject);
  });
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 30000);
    });
  }
}

async function main() {
  const ws = await connect(await getWsUrl());
  const cdp = new CDP(ws);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    }, sessionId);
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
    return res.result.value;
  };

  const results = [];

  for (const shot of SHOTS) {
    // Seed the theme before the page loads so the very first paint matches.
    await cdp.send('Page.navigate', { url: `${BASE}/blank-theme` }, sessionId).catch(() => {});
    await sleep(300);
    await evaluate(`localStorage.setItem('theme', ${JSON.stringify(shot.theme)})`);

    await cdp.send('Page.navigate', { url: BASE + shot.url }, sessionId);
    await sleep(3500);

    // Make the capture deterministic:
    //  - hide the WebGL canvases, whose content depends on the exact frame
    //    they were captured at (a 3D scene rotating by a random amount);
    //  - pin the entrance animations to their final state, so the reveal
    //    transitions do not land on a different frame in each run;
    //  - pause the shiny-text gradient sweep at a fixed offset, so the
    //    headline renders the same in every run.
    // What remains is the static design: colours, spacing, typography, layout.
    await evaluate(`
      (() => {
        const style = document.createElement('style');
        style.id = 'deterministic-capture';
        style.textContent = [
          'canvas{visibility:hidden !important;}',
          '.animate-hero-fade-in,.animate-hero-rise{animation:none !important;opacity:1 !important;transform:none !important;}',
          '.animate-pulse{animation:none !important;}',
          '.shiny-text{animation-play-state:paused !important;animation-delay:-2.5s !important;}'
        ].join('');
        document.head.appendChild(style);
      })()
    `);

    if (shot.scroll === 0) {
      await evaluate('window.scrollTo(0, 0)');
    } else {
      await evaluate(`document.querySelector('#${shot.scroll}')?.scrollIntoView({block:'start'})`);
    }
    // Wait for the smooth scroll (Lenis) and the reveal transitions to settle,
    // then confirm the scroll position stopped moving.
    let last = -1;
    for (let i = 0; i < 20; i++) {
      await sleep(250);
      const y = await evaluate('Math.round(window.scrollY)');
      if (y === last) break;
      last = y;
    }
    await sleep(1200);

    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const file = join(OUT, `${shot.name}.png`);
    writeFileSync(file, Buffer.from(data, 'base64'));

    const theme = await evaluate(`document.documentElement.className`);
    results.push({ name: shot.name, file, theme });
    console.log(`captured ${shot.name} (html class: ${theme})`);
  }

  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(results, null, 2));
  ws.close();
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(0);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(1);
});
