// Full regression comparison between two running builds (baseline vs
// current). Drives a real browser through every user-facing scenario and
// reports both builds side by side, so any behavioural difference shows up
// as a diff in the table.
//
// Usage: node scripts/compare-behaviour.mjs <baseUrlA> <baseUrlB>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9240;
const [urlA, urlB] = [process.argv[2], process.argv[3]];

const profile = mkdtempSync(join(tmpdir(), 'dsh-cmp-'));
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

const click = (label) => evaluate(`(() => {
  const b = document.querySelector('button[aria-label="${label}"], a[aria-label="${label}"]');
  if (!b) return 'NO_EL';
  b.click();
  return 'OK';
})()`);

async function runScenario(url) {
  const out = { url, checks: {} };
  await send(ws, 'Page.navigate', { url }, sessionId);
  await sleep(5000);

  // Initial state
  out.checks.initial = await evaluate(`(() => {
    try {
      return JSON.stringify({
        title: document.title.slice(0, 40),
        h1: document.querySelector('h1')?.textContent?.slice(0, 40) ?? 'NO_H1',
        canvases: document.querySelectorAll('canvas').length,
        htmlClass: document.documentElement.className,
        sections: ['about','stack','contact'].map(id => !!document.getElementById(id)),
      });
    } catch (e) { return 'ERR ' + e.message; }
  })()`);

  // Theme toggle x2
  await click('Toggle theme');
  await sleep(600);
  out.checks.themeAfter1 = await evaluate('document.documentElement.className');
  await click('Toggle theme');
  await sleep(600);
  out.checks.themeAfter2 = await evaluate('document.documentElement.className');

  // Fluid cursor toggle x2
  await click('Toggle fluid cursor');
  await sleep(1000);
  out.checks.fluidOn = await evaluate(`(() => {
    const pressed = document.querySelector('button[aria-label="Toggle fluid cursor"]')?.getAttribute('aria-pressed');
    const canvases = document.querySelectorAll('canvas').length;
    return JSON.stringify({ pressed, canvases });
  })()`);
  await click('Toggle fluid cursor');
  await sleep(800);
  out.checks.fluidOff = await evaluate('document.querySelector(\'button[aria-label="Toggle fluid cursor"]\')?.getAttribute(\'aria-pressed\')');

  // Language switch
  out.checks.langSwitch = await evaluate(`(() => {
    const link = document.querySelector('a[aria-label*="switch language"], a[aria-label*="сменить язык"]');
    return link ? link.getAttribute('href') : 'NO_LANG_LINK';
  })()`);

  // Anchor navigation
  await evaluate(`document.querySelector('#about')?.scrollIntoView()`);
  await sleep(1200);
  out.checks.scrolledToAbout = await evaluate('Math.round(window.scrollY) > 500');

  // 3D scene loads on scroll?
  await sleep(2000);
  out.checks.sceneAfterScroll = await evaluate(`document.querySelectorAll('canvas').length`);

  return out;
}

console.log('=== SCENARIO: baseline ===');
const A = await runScenario(urlA);
for (const [k, v] of Object.entries(A.checks)) console.log(`  ${k}: ${v}`);
console.log();

console.log('=== SCENARIO: current ===');
const B = await runScenario(urlB);
for (const [k, v] of Object.entries(B.checks)) console.log(`  ${k}: ${v}`);

console.log();
console.log('=== DIFF ===');
const keys = new Set([...Object.keys(A.checks), ...Object.keys(B.checks)]);
let same = true;
for (const k of keys) {
  if (A.checks[k] !== B.checks[k]) {
    same = false;
    console.log(`  ${k}:`);
    console.log(`    A(base): ${A.checks[k]}`);
    console.log(`    B(curr): ${B.checks[k]}`);
  }
}
if (same) console.log('  (no differences)');

console.log();
console.log('=== JS errors across both runs ===');
console.log(errors.length ? errors.map(e => '  ' + e).join('\n') : '  (none)');

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
