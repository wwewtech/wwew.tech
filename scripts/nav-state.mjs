// Cross-navigation state test: set theme + cursor on one locale, follow the
// language link, and check the state survived the navigation - the exact
// user flow of "toggled something, switched language, is it still set?".
//
// Usage: node scripts/nav-state.mjs <urlA> <urlB>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9251;
const urls = [process.argv[2], process.argv[3]];

const profile = mkdtempSync(join(tmpdir(), 'dsh-nav-'));
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
const errors = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.text ?? 'exc');
});

const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });
await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Runtime.enable', {}, sessionId);

const evaluate = async (expression) => {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.result.value;
};
const click = (sel) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 'MISSING'; el.click(); return 'OK'; })()`);
const state = () => evaluate(`JSON.stringify({
  path: location.pathname,
  htmlClass: document.documentElement.className,
  themeLS: localStorage.getItem('theme'),
  fluidLS: localStorage.getItem('fluidCursor'),
})`);

for (const [idx, url] of urls.entries()) {
  const name = idx === 0 ? 'REF ' : 'HEAD';
  console.log(`=== ${name} ${url} ===`);
  await send(ws, 'Page.navigate', { url }, sessionId);
  await sleep(4000);
  console.log('  start:           ' + await state());
  await click('button[aria-label="Toggle theme"]');
  await sleep(700);
  await click('button[aria-label="Toggle fluid cursor"]');
  await sleep(700);
  console.log('  after toggles:   ' + await state());
  // Language link click = client navigation in HEAD, full nav in REF.
  const langSel = 'a[aria-label="Toggle language"], a[aria-label*="сменить язык"]';
  console.log('  lang click:      ' + await click(langSel));
  await sleep(2500);
  console.log('  after lang nav:  ' + await state());
  // Toggle theme once more on the new locale to prove controls work there.
  await click('button[aria-label="Toggle theme"]');
  await sleep(700);
  console.log('  toggle on /en:   ' + await state());
  console.log('  errors: ' + (errors.length ? errors.join('; ') : 'none'));
  errors.length = 0;
}

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
