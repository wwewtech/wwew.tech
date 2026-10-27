// Captures the 3D scene and the fluid cursor, so their rendering can be
// compared between two builds.
//
// Both effects are simulations, so a pixel diff is meaningless: the knot
// rotates and the fluid responds to the pointer. What is stable is the
// palette, so this reports a colour histogram of the effect region.
//
// Usage: node scripts/capture-effects.mjs <url> <outDir>

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;

const url = process.argv[2] ?? 'http://127.0.0.1:4004/ru';
const outDir = process.argv[3] ?? 'C:/Users/User/AppData/Local/Temp/effects';

mkdirSync(outDir, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'dsh-fx-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check',
  '--disable-gpu', '--enable-unsafe-swiftshader',
  '--window-size=1280,800', 'about:blank',
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

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const p = { id, method, params };
    if (sessionId) p.sessionId = sessionId;
    this.ws.send(JSON.stringify(p));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)); } }, 30000);
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

  const evaluate = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  const errors = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.text ?? 'exception');
  });

  const shot = async (name) => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const file = join(outDir, `${name}.png`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  };

  for (const theme of ['dark', 'light']) {
    await cdp.send('Page.navigate', { url }, sessionId);
    await sleep(3000);
    await evaluate(`localStorage.setItem('theme', ${JSON.stringify(theme)})`);
    await cdp.send('Page.reload', {}, sessionId);
    await sleep(3500);

    // 3D scene
    await evaluate(`document.querySelector('#about')?.scrollIntoView({block:'center'})`);
    await sleep(4000);
    await shot(`scene-${theme}`);

    // Fluid cursor
    await evaluate(`window.scrollTo(0, 0)`);
    await sleep(1000);
    await evaluate(`
      (() => {
        const btn = document.querySelector('button[aria-label="Toggle fluid cursor"]');
        if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
        return true;
      })()
    `);
    await sleep(2000);
    for (let i = 0; i <= 20; i++) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved', x: 200 + i * 40, y: 400 + Math.sin(i / 2) * 120,
      }, sessionId);
      await sleep(60);
    }
    await sleep(1500);
    await shot(`fluid-${theme}`);
  }

  console.log(JSON.stringify({ outDir, errors }));
  ws.close();
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(0);
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(1);
});
