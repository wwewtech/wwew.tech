// Exercises the three hero-section toggles the way a user does - on a live
// page, without reloads - and reports what actually happens after each click:
// the theme (html class), the fluid-cursor canvas state, and any JS errors.
//
// Usage: node scripts/check-toggles.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9238;
const url = process.argv[2] ?? 'http://127.0.0.1:4010/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-tg-'));
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
    setTimeout(() => pending.has(p.id) && (pending.delete(p.id), reject(new Error('timeout ' + method))), 45000);
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
  if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails?.text ?? 'exception');
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errors.push('console: ' + m.params.args?.map(a => a.value ?? a.description).join(' ').slice(0, 120));
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

const clickToggle = (label) => evaluate(`(() => {
  const btn = document.querySelector('button[aria-label="${label}"]');
  if (!btn) return 'NO_BUTTON';
  btn.click();
  return 'CLICKED';
})()`);

const snapshot = async (label) => {
  const s = await evaluate(`(() => {
    try {
      return JSON.stringify({
        htmlClass: document.documentElement.className,
        themeLS: localStorage.getItem('theme'),
        fluidLS: localStorage.getItem('fluidCursor'),
        fluidPressed: (document.querySelector('button[aria-label="Toggle fluid cursor"]') || {}).getAttribute ? document.querySelector('button[aria-label="Toggle fluid cursor"]').getAttribute('aria-pressed') : null,
        canvasCount: document.querySelectorAll('canvas').length,
      });
    } catch (e) {
      return 'SNAPSHOT_ERR: ' + e.message;
    }
  })()`);
  console.log(`  [${label}] ` + s);
};

console.log('=== INITIAL ===');
await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(5000);
await snapshot('initial');

console.log('=== THEME toggle x2 (no reload) ===');
await clickToggle('Toggle theme');
await sleep(800);
await snapshot('after theme click 1');
await clickToggle('Toggle theme');
await sleep(800);
await snapshot('after theme click 2');

console.log('=== FLUID CURSOR toggle x2 (no reload) ===');
await clickToggle('Toggle fluid cursor');
await sleep(1200);
await snapshot('after fluid click 1');
await clickToggle('Toggle fluid cursor');
await sleep(1200);
await snapshot('after fluid click 2');

console.log('=== ERRORS ===');
console.log(errors.length ? errors.map(e => '  ' + e).join('\n') : '  (none)');

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
