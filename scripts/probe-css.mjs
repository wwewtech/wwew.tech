// Probes a live page for runtime CSS state: which stylesheets loaded, whether
// a given rule is present in any of them, and the computed style of a
// selector.
//
// Usage: node scripts/probe-css.mjs <url> <selector>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9227;

const url = process.argv[2] ?? 'https://wwew.tech/ru';
const selector = process.argv[3] ?? '.prism-container';

const profile = mkdtempSync(join(tmpdir(), 'dsh-probe-'));
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
  await cdp.send('Network.enable', {}, sessionId);

  const requested = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('.css')) {
      requested.push(m.params.request.url);
    }
  });

  const evaluate = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  await cdp.send('Page.navigate', { url }, sessionId);
  await sleep(6000);

  const result = await evaluate(`
    (() => {
      const out = { sheets: document.styleSheets.length, ruleFound: false, ruleIn: null, computed: null, links: [] };
      for (const s of document.styleSheets) {
        let rules;
        try { rules = s.cssRules; } catch (e) { continue; }
        for (const rule of rules) {
          if (rule.selectorText && rule.selectorText.indexOf('prism-container') !== -1) {
            out.ruleFound = true;
            out.ruleIn = s.href || 'inline';
          }
        }
      }
      out.links = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href);
      const el = document.querySelector(${JSON.stringify(selector)});
      if (el) {
        const cs = getComputedStyle(el);
        out.computed = { position: cs.position, width: cs.width, height: cs.height };
        out.elementFound = true;
      } else {
        out.elementFound = false;
      }
      return JSON.stringify(out);
    })()
  `);

  console.log(JSON.stringify({
    page: url,
    selector,
    dom: JSON.parse(result),
    cssRequests: requested,
  }, null, 2));

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
