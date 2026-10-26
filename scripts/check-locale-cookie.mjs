// Verifies the locale-cookie behaviour in a REAL browser against a URL:
// loads the page, lets it settle, then reports the resulting `locale`
// cookie. The bug being checked: a pageview of /ru used to leave the
// visitor with locale=en (because of the router's background prefetch),
// silently switching their language.
//
// Usage: node scripts/check-locale-cookie.mjs <url>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9236;
const url = process.argv[2] ?? 'https://wwew.tech/ru';

const profile = mkdtempSync(join(tmpdir(), 'dsh-cookie-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
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
    setTimeout(() => pending.has(p.id) && (pending.delete(p.id), reject(new Error('timeout ' + method))), 40000);
  });
}

const ws = await connect(await getWsUrl());
const setCookies = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
  if (m.method === 'Network.responseReceived') {
    const sc = m.params.response.headers['set-cookie'] ?? m.params.response.headers['Set-Cookie'];
    if (sc && sc.includes('locale=')) {
      setCookies.push({ url: m.params.response.url.slice(-40), cookie: sc.split(';')[0] });
    }
  }
});

const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });
await send(ws, 'Page.enable', {}, sessionId);
await send(ws, 'Network.enable', {}, sessionId);
await send(ws, 'Runtime.enable', {}, sessionId);

await send(ws, 'Page.navigate', { url }, sessionId);
await sleep(9000);

const r = await send(ws, 'Runtime.evaluate', {
  expression: 'document.cookie',
  returnByValue: true,
}, sessionId);
const finalCookie = r.result.value;

console.log(JSON.stringify({
  page: url,
  setCookieHeadersSeen: setCookies,
  finalDocumentCookie: finalCookie,
  bugPresent: finalCookie.includes('locale=en') && url.includes('/ru'),
}, null, 2));

chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
