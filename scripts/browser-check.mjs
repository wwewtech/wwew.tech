// Minimal Chrome DevTools Protocol driver used to verify browser behaviour
// (WebGL theme switching, 404 rendering) without adding a dependency.
//
// Usage: node scripts/browser-check.mjs <url> <mode>
//   mode "theme"  -> loads the page, screenshots dark, toggles the theme,
//                    screenshots light, reports whether the 3D canvas changed
//   mode "404"    -> loads the URL, reports the rendered 404 text
//
// The script is a verification tool, not part of the shipped application.

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;

const url = process.argv[2] ?? 'http://127.0.0.1:3999/ru';
const mode = process.argv[3] ?? 'theme';

const profile = mkdtempSync(join(tmpdir(), 'dsh-chrome-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--window-size=1280,900',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {
      /* not ready yet */
    }
    await sleep(250);
  }
  throw new Error('Chrome DevTools endpoint did not become available');
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
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

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', reject);
  });
}

async function main() {
  const wsUrl = await getWsUrl();
  const ws = await connect(wsUrl);
  const cdp = new CDP(ws);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);

  const errors = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails?.text ?? 'exception');
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(msg.params.entry.text);
    }
  });

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, sessionId);
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description ?? ''));
    }
    return res.result.value;
  };

  const shot = async (file) => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  };

  await cdp.send('Page.navigate', { url }, sessionId);
  await sleep(4000);

  if (mode === '404') {
    const text = await evaluate('document.body.innerText');
    const title = await evaluate('document.title');
    const hasCanvas = await evaluate(`!!document.querySelector('canvas')`);
    const file = await shot('C:/Users/User/AppData/Local/Temp/shot-404.png');
    console.log(JSON.stringify({ text: text.slice(0, 400), title, hasCanvas, shot: file }, null, 2));
  } else if (mode === 'theme') {
    // Scroll the 3D section into view so the scene actually renders.
    await evaluate(`document.querySelector('#about')?.scrollIntoView()`);
    await sleep(3000);

    const before = await shot('C:/Users/User/AppData/Local/Temp/shot-dark.png');

    // Report the WebGL context count and canvas presence.
    const info1 = await evaluate(`JSON.stringify({
      canvases: document.querySelectorAll('canvas').length,
      webgl2: !!document.querySelector('canvas')?.getContext('webgl2'),
      htmlClass: document.documentElement.className,
      themeLS: localStorage.getItem('theme')
    })`);

    // Click the theme toggle (the button with aria-label "Toggle theme").
    await evaluate(`(() => {
      const btn = document.querySelector('button[aria-label="Toggle theme"]');
      if (!btn) return 'NO_BUTTON';
      btn.click();
      return 'CLICKED';
    })()`);
    await sleep(3000);

    const after = await shot('C:/Users/User/AppData/Local/Temp/shot-light.png');

    const info2 = await evaluate(`JSON.stringify({
      htmlClass: document.documentElement.className,
      themeLS: localStorage.getItem('theme')
    })`);

    console.log(JSON.stringify({
      before: JSON.parse(info1),
      after: JSON.parse(info2),
      beforeShot: before,
      afterShot: after,
      errors: errors.slice(0, 10),
    }, null, 2));
  }

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
