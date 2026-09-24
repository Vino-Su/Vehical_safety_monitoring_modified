import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');

const ROOT = 'D:/claude_code_coding/智能网联汽车安全监测平台';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const filePath = path.join(ROOT, urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.statusCode = 404; res.end('not found'); return; }
  res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  res.end(fs.readFileSync(filePath));
});
await new Promise(r => server.listen(9190, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://127.0.0.1:9190/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2000);

const readState = () => page.evaluate(() => {
  const list = document.getElementById('event-list');
  const track = list && list.firstElementChild;
  if (!track) return null;
  const shift = getComputedStyle(track).getPropertyValue('--event-step').trim();
  const firstPlate = list.querySelector('.event-list-row .plate');
  return { step: Number(shift || 0), firstPlate: firstPlate ? firstPlate.textContent : null, rowCount: list.querySelectorAll('.event-list-row').length };
});

const start = Date.now();
let lastStep = null;
const changes = [];
let firstSeen = null;
const TOTAL = 15000;
while (Date.now() - start < TOTAL) {
  const state = await readState();
  if (state) {
    if (firstSeen === null) firstSeen = state;
    if (state.step !== lastStep) {
      changes.push({ step: state.step, t: Date.now() - start, topPlate: state.firstPlate });
      lastStep = state.step;
    }
  }
  await page.waitForTimeout(100);
}

const intervals = [];
for (let i = 1; i < changes.length; i++) intervals.push(changes[i].t - changes[i - 1].t);
const visibleRows = await page.evaluate(() => {
  const list = document.getElementById('event-list');
  const vp = list.getBoundingClientRect();
  return Array.from(list.querySelectorAll('.event-list-row')).filter(r => {
    const b = r.getBoundingClientRect();
    return b.top >= vp.top - 1 && b.bottom <= vp.bottom + 1;
  }).map(r => r.querySelector('.plate').textContent + ' / ' + r.querySelector('.event-kind').textContent.trim());
});

console.log(JSON.stringify({
  configuredRows: firstSeen ? firstSeen.rowCount : null,
  visibleRowCount: visibleRows.length,
  visibleRows,
  stepChanges: changes,
  intervalsMs: intervals,
  avgIntervalMs: intervals.length ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : null,
  errors
}, null, 2));

await browser.close();
server.close();
