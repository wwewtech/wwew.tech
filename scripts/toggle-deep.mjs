// ToggleDeep: exercises the three navbar controls the way a user does and
// dumps the FULL DOM state of the control bar after every action - aria
// states, icons, titles, cookie - so two builds can be diffed property by
// property, not just by pass/fail.
//
// Usage: node scripts/toggle-deep.mjs <url> [label]

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9248;
const url = process.argv[2];
const label = process.argv[3] ?? url;

const profile = mkdtempSync(join(tmpdir(), 'dsh-tgd-'));
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

// The bar state the user quoted in their complaint, expanded.
const barState = () => evaluate(`(() => {
  const read = (el) => el ? ({
    tag: el.tagName,
    ariaLabel: el.getAttribute('aria-label'),
    ariaPressed: el.getAttribute('aria-pressed'),
    title: el.getAttribute('title'),
    href: el.getAttribute('href'),
    icon: (el.querySelector('svg')?.getAttribute('class') || '').match(/lucide-([a-z-]+)/)?.[1] ?? null,
    text: el.textContent?.trim().slice(0, 12) ?? null,
  }) : 'MISSING';
  return JSON.stringify({
    fluid: read(document.querySelector('button[aria-label="Toggle fluid cursor"]')),
    lang: read(document.querySelector('a[aria-label*="сменить язык"], a[aria-label*="switch language"]')),
    theme: read(document.querySelector('button[aria-label="Toggle theme"]')),
    htmlClass: document.documentElement.className,
    themeLS: localStorage.getItem('theme'),
    fluidLS: localStorage.getItem('fluidCursor'),
    canvases: document.querySelectorAll('canvas').length,
  });
})()`);

const clickSel = (sel) => evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return 'MISSING';
  el.click();
  return 'OK';
})()`);

console.log(`### ${label}`);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(4500);
console.log('  initial:        ' + await barState());

await clickSel('button[aria-label="Toggle fluid cursor"]');
await sleep(900);
console.log('  fluid ON:      ' + await barState());

// After enabling, move the mouse so the effect has a chance to paint.
await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 300 }, sessionId);
await sleep(400);
console.log('  fluid ON+move: ' + await barState());

await clickSel('button[aria-label="Toggle fluid cursor"]');
await sleep(900);
console.log('  fluid OFF:     ' + await barState());

await clickSel('button[aria-label="Toggle theme"]');
await sleep(900);
console.log('  theme 1:       ' + await barState());

await clickSel('button[aria-label="Toggle theme"]');
await sleep(900);
console.log('  theme 2:       ' + await barState());

await clickSel('button[aria-label="Toggle theme"]');
await sleep(900);
console.log('  theme 3:       ' + await barState());

console.log('  errors: ' + (errors.length ? JSON.stringify(errors) : 'none'));

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
