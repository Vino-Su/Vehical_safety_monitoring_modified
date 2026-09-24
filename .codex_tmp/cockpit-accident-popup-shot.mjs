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
await new Promise(r => server.listen(9195, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const fireClick = (selector, index = 0) => page.evaluate(([sel, i]) => {
  const target = document.querySelectorAll(sel)[i];
  if (!target) return false;
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return true;
}, [selector, index]);

await page.goto('http://127.0.0.1:9195/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);
await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
await page.locator('.accident-list-table tbody tr').first().locator('[data-accident-locate]').click();
await page.waitForTimeout(2400);

const dotTotal = await page.locator('.accident-dot').count();
let found = false;
for (let i = 0; i < Math.min(dotTotal, 12) && !found; i++) {
  await fireClick('.accident-dot', i);
  await page.waitForTimeout(320);
  found = (await page.locator('.leaflet-popup .accident-popup .accident-popup-photo-thumb').count()) > 1;
}
console.log('found two-photo popup:', found);
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(OUT, '驾驶舱_事故弹窗_含现场照片_1920x1080_20260924.png') });
await page.locator('.leaflet-popup').last().screenshot({ path: path.join(OUT, '驾驶舱_事故弹窗_照片明细_20260924.png') });
await fireClick('.accident-popup-photo-thumb', 0);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, '驾驶舱_事故现场照片_示意图放大_1920x1080_20260924.png') });

await browser.close();
server.close();
