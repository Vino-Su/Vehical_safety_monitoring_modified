import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');

const ROOT = 'D:/claude_code_coding/智能网联汽车安全监测平台';
const OUT = 'D:/claude_code_coding/智能网联汽车安全监测平台/07-bugs';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const filePath = path.join(ROOT, urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.statusCode = 404; res.end('not found'); return; }
  res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  res.end(fs.readFileSync(filePath));
});
await new Promise(r => server.listen(9196, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const results = {};
const fireClick = (selector, index = 0) => page.evaluate(([sel, i]) => {
  const target = document.querySelectorAll(sel)[i];
  if (!target) return false;
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return true;
}, [selector, index]);

await page.goto('http://127.0.0.1:9196/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);
await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
await page.locator('.accident-list-table tbody tr').first().locator('[data-accident-locate]').click();
await page.waitForTimeout(2400);

for (const [w, h, tag] of [[1366, 768, '1366x768'], [1920, 1080, '1920x1080'], [3840, 1080, '3840x1080']]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(900);
  const dotTotal = await page.locator('.accident-dot').count();
  let found = false;
  for (let i = 0; i < Math.min(dotTotal, 12) && !found; i++) {
    await fireClick('.accident-dot', i);
    await page.waitForTimeout(300);
    found = (await page.locator('.leaflet-popup .accident-popup .accident-popup-photo-thumb').count()) > 0;
  }
  const box = await page.locator('.leaflet-popup').last().boundingBox();
  results['photos_' + tag] = await page.locator('.leaflet-popup .accident-popup-photo-thumb').count();
  results['box_' + tag] = box ? { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) } : null;
  results['inViewport_' + tag] = box ? (box.x >= 0 && box.y >= 0 && box.x + box.width <= w && box.y + box.height <= h) : false;
  if (tag === '1366x768') await page.screenshot({ path: path.join(OUT, '驾驶舱_事故弹窗_含照片_1366x768_20260924.png') });
  if (tag === '3840x1080') await page.screenshot({ path: path.join(OUT, '驾驶舱_事故弹窗_含照片_3840x1080_20260924.png') });
}
results.errors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
server.close();
