// Compares the computed styles of every element on two pages.
//
// This is the deterministic counterpart to a pixel diff: if the computed
// style of every element matches, the design is identical and any pixel
// difference comes from animation phase (e.g. a gradient sweep), not from
// the markup or the CSS.
//
// Usage: node scripts/compare-styles.mjs <urlA> <urlB>

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9228;

const urlA = process.argv[2];
const urlB = process.argv[3];

const PROPS = [
  'color', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontWeight',
  'fontFamily', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'borderTopWidth', 'borderTopColor', 'borderBottomWidth', 'borderBottomColor',
  'borderLeftWidth', 'borderRightWidth', 'borderRadius',
  'width', 'height', 'display', 'position', 'flexDirection',
  'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns',
  'opacity', 'transform', 'boxShadow', 'backdropFilter', 'zIndex',
  'overflow', 'objectFit',
];

if (!urlA || !urlB) {
  console.error('Usage: node scripts/compare-styles.mjs <urlA> <urlB>');
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), 'dsh-styles-'));
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
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)); } }, 45000);
    });
  }
}

const PROPS_JSON = JSON.stringify(PROPS);

const SNAPSHOT = `(() => {
  const props = ${PROPS_JSON};
  const out = [];
  const walk = (el, path) => {
    if (out.length > 4000) return;
    const cs = getComputedStyle(el);
    const style = {};
    for (const p of props) style[p] = cs[p];
    out.push({ path, tag: el.tagName, cls: el.className && el.className.toString().slice(0, 120), style });
    let i = 0;
    for (const child of el.children) walk(child, path + '/' + (i++));
  };
  walk(document.body, '');
  return JSON.stringify(out);
})()`;

async function snapshot(cdp, sessionId, url) {
  await cdp.send('Page.navigate', { url }, sessionId);
  await sleep(6000);
  // Sections with `content-visibility: auto` are not laid out while they are
  // off-screen, which makes their computed widths depend on scroll position.
  // Scroll the whole page first so every section has been rendered, then
  // return to the top and let the layout settle.
  await cdp.send('Runtime.evaluate', {
    expression: `(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y <= h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 800));
      return true;
    })()`,
    returnByValue: true, awaitPromise: true,
  }, sessionId);
  await sleep(1500);
  // Force every reveal transition to its end state, so the measurement sees
  // the settled design rather than an arbitrary animation frame.
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const s = document.createElement('style');
      s.textContent = '*,*::before,*::after{transition-duration:0s !important;transition-delay:0s !important;animation-duration:0s !important;animation-delay:0s !important;}';
      document.head.appendChild(s);
      return true;
    })()`,
    returnByValue: true,
  }, sessionId);
  await sleep(1200);
  const r = await cdp.send('Runtime.evaluate', {
    expression: SNAPSHOT, returnByValue: true, awaitPromise: true,
  }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return JSON.parse(r.result.value);
}

async function main() {
  const ws = await connect(await getWsUrl());
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  const a = await snapshot(cdp, sessionId, urlA);
  const b = await snapshot(cdp, sessionId, urlB);

  console.log(`A: ${urlA}  -> ${a.length} elements`);
  console.log(`B: ${urlB}  -> ${b.length} elements`);

  if (a.length !== b.length) {
    console.log('RESULT: DIFFERENT element count');
    process.exitCode = 1;
  } else {
    let diffs = 0;
    const examples = [];
    for (let i = 0; i < a.length; i++) {
      for (const p of PROPS) {
        if (a[i].style[p] !== b[i].style[p]) {
          diffs++;
          if (examples.length < 15) {
            examples.push(`  <${a[i].tag} class="${(a[i].cls || '').slice(0, 60)}"> ${p}: "${a[i].style[p]}" vs "${b[i].style[p]}"`);
          }
        }
      }
    }
    console.log(`\ncompared ${a.length} elements x ${PROPS.length} properties`);
    console.log(`differing values: ${diffs}`);
    if (diffs) {
      console.log('\nexamples:');
      examples.forEach((e) => console.log(e));
    } else {
      console.log('\nRESULT: every computed style matches exactly.');
    }
  }

  ws.close();
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(process.exitCode || 0);
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(1);
});
