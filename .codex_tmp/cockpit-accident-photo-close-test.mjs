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
await new Promise(r => server.listen(9194, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.location().url + ' :: ' + m.text()); });

const results = {};
const check = (n, v) => { results[n] = v; };
const fireClick = (selector, index = 0) => page.evaluate(([sel, i]) => {
  const target = document.querySelectorAll(sel)[i];
  if (!target) return false;
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return true;
}, [selector, index]);

await page.goto('http://127.0.0.1:9194/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);

// 先通过列表定位拉近地图，使事故点位可渲染
await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
await page.locator('.accident-list-table tbody tr').first().locator('[data-accident-locate]').click();
await page.waitForTimeout(2400);
check('dotsAfterLocate', await page.locator('.accident-dot').count());

// 找到带现场照片的点位并打开
const dotTotal = await page.locator('.accident-dot').count();
let found = false;
for (let i = 0; i < Math.min(dotTotal, 12) && !found; i++) {
  await fireClick('.accident-dot', i);
  await page.waitForTimeout(320);
  found = (await page.locator('.leaflet-popup .accident-popup .accident-popup-photo-thumb').count()) > 0;
}
check('photoPopupFound', found);

// ---------- ESC 关闭 ----------
await fireClick('.accident-popup-photo-thumb', 0);
await page.waitForTimeout(450);
check('viewerOpened', await page.locator('.accident-photo-viewer.is-open').count());
await page.keyboard.press('Escape');
await page.waitForTimeout(450);
check('viewerClosedByEsc', await page.locator('.accident-photo-viewer.is-open').count());
check('viewerHiddenAttr', await page.locator('.accident-photo-viewer').getAttribute('hidden'));

// ---------- 遮罩关闭 ----------
await fireClick('.accident-popup-photo-thumb', 0);
await page.waitForTimeout(450);
check('viewerOpened2', await page.locator('.accident-photo-viewer.is-open').count());
await fireClick('.accident-photo-viewer', 0);
await page.waitForTimeout(450);
check('viewerClosedByShade', await page.locator('.accident-photo-viewer.is-open').count());
check('popupAliveAfterShade', await page.locator('.leaflet-popup .accident-popup').count());
check('viewerEmptyAfterClose', (await page.locator('.accident-photo-viewer').innerHTML().catch(() => '')).length);

// ---------- 点击命中诊断 ----------
check('hitTest', await page.evaluate(() => {
  const button = document.getElementById('accident-list-trigger');
  const rect = button.getBoundingClientRect();
  const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
  const viewer = document.querySelector('.accident-photo-viewer');
  const popup = document.querySelector('.leaflet-popup');
  return {
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    hit: hit ? hit.tagName + '.' + hit.className : null,
    viewerDisplay: viewer ? getComputedStyle(viewer).display : 'no-viewer',
    popupRect: popup ? (r => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }))(popup.getBoundingClientRect()) : null
  };
}));
try {
  await page.locator('#accident-list-trigger').click({ timeout: 4000 });
  check('listTriggerClickWithPopupOpen', 'ok');
  await page.waitForTimeout(500);
  await page.locator('#modal-action').click({ timeout: 4000 });
  check('modalClose', 'ok');
} catch (e) {
  check('listTriggerClickWithPopupOpen', String(e.message).split('\n').slice(0, 6).join(' | '));
}

check('errors', errors);
console.log(JSON.stringify(results, null, 2));
await browser.close();
server.close();
