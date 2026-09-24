import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');

const ROOT = 'D:/claude_code_coding/智能网联汽车安全监测平台';
const OUT = 'D:/claude_code_coding/智能网联汽车安全监测平台/07-bugs';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const filePath = path.join(ROOT, urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.statusCode = 404; res.end('not found'); return; }
  res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  res.end(fs.readFileSync(filePath));
});
await new Promise(r => server.listen(9193, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const errors = [];
const missing = [];
page.on('response', r => { if (r.status() === 404) missing.push(r.url()); });
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });

const results = {};
const check = (name, value) => { results[name] = value; };
const norm = text => (text || '').replace(/\s+/g, ' ').trim();
const fireClick = (selector, index = 0) => page.evaluate(([sel, i]) => {
  const target = document.querySelectorAll(sel)[i];
  if (!target) return false;
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return true;
}, [selector, index]);
async function run(name, fn) {
  try { await fn(); } catch (e) { results[name + '_ERROR'] = String(e.message || e).split('\n')[0]; }
}

await page.goto('http://127.0.0.1:9193/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);

// ---------- 用例 1：事故列表新增伤亡情况列 ----------
await run('case1', async () => {
  await page.locator('#accident-list-trigger').click();
  await page.waitForTimeout(600);
  check('listHeaders', await page.locator('.accident-list-table thead th').allTextContents());
  check('firstRowCellCount', await page.locator('.accident-list-table tbody tr').first().locator('td').count());
  check('firstRowCasualty', norm(await page.locator('.accident-list-table tbody tr').first().locator('td').nth(6).innerText()));
  check('firstRowAction', norm(await page.locator('.accident-list-table tbody tr').first().locator('td').nth(7).innerText()));
  const casualtyCells = await page.locator('.accident-list-table tbody .accident-casualty').allTextContents();
  check('casualtyCellCount', casualtyCells.length);
  check('casualtySamples', Array.from(new Set(casualtyCells.map(norm))).slice(0, 6));
  await page.screenshot({ path: path.join(OUT, '驾驶舱_事故列表_伤亡情况列_1920x1080_20260924.png') });
});

// ---------- 用例 2：列表定位打开事故详情浮层字段 ----------
await run('case2', async () => {
  const firstRow = page.locator('.accident-list-table tbody tr').first();
  const targetId = norm(await firstRow.locator('.accident-code').innerText());
  await firstRow.locator('[data-accident-locate]').click();
  await page.waitForTimeout(2400);
  check('targetId', targetId);
  check('popupCount', await page.locator('.leaflet-popup .accident-popup').count());
  check('popupHead', norm(await page.locator('.leaflet-popup .accident-popup .cockpit-popup-head').last().innerText()));
  check('gridLabels', await page.locator('.leaflet-popup .accident-popup .accident-popup-grid span').allTextContents());
  check('photoTitle', norm(await page.locator('.leaflet-popup .accident-popup .accident-popup-photos-title').last().innerText()));
  check('thumbCount', await page.locator('.leaflet-popup .accident-popup .accident-popup-photo-thumb').count());
  check('popupText', norm(await page.locator('.leaflet-popup .accident-popup').last().innerText()));
  await page.screenshot({ path: path.join(OUT, '驾驶舱_事故弹窗_字段改造_1920x1080_20260924.png') });
});

// ---------- 用例 3：现场照片放大查看与关闭 ----------
await run('case3', async () => {
  const dotTotal = await page.locator('.accident-dot').count();
  let found = false;
  for (let i = 0; i < Math.min(dotTotal, 12) && !found; i++) {
    await fireClick('.accident-dot', i);
    await page.waitForTimeout(320);
    found = (await page.locator('.leaflet-popup .accident-popup .accident-popup-photo-thumb').count()) > 0;
  }
  check('photoPopupFound', found);
  const thumb = page.locator('.leaflet-popup .accident-popup .accident-popup-photo-thumb').first();
  check('thumbAvailable', await thumb.count());
  if (!found) return;
  await thumb.click();
  await page.waitForTimeout(500);
  check('viewerOpen', await page.locator('.accident-photo-viewer.is-open').count());
  check('viewerPanelVisible', await page.locator('.accident-photo-viewer-panel').isVisible());
  check('viewerSceneSvg', await page.locator('.accident-photo-viewer-stage .accident-scene-svg').count());
  check('viewerHead', norm(await page.locator('.accident-photo-viewer-head').innerText()));
  check('viewerHint', norm(await page.locator('.accident-photo-viewer-hint').innerText()));
  await page.screenshot({ path: path.join(OUT, '驾驶舱_事故现场照片_放大查看_1920x1080_20260924.png') });
  await page.locator('.accident-photo-viewer-close').click();
  await page.waitForTimeout(400);
  check('viewerClosedByButton', await page.locator('.accident-photo-viewer.is-open').count());
  check('popupAliveAfterClose', await page.locator('.leaflet-popup .accident-popup').count());
  await thumb.click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('viewerClosedByEsc', await page.locator('.accident-photo-viewer.is-open').count());
  check('viewerHiddenBox', (await page.locator('.accident-photo-viewer').boundingBox()) === null);
  await thumb.click();
  await page.waitForTimeout(400);
  await page.mouse.click(12, 12);
  await page.waitForTimeout(400);
  check('viewerClosedByShade', await page.locator('.accident-photo-viewer.is-open').count());
  check('popupAliveAfterShade', await page.locator('.leaflet-popup .accident-popup').count());
});

// ---------- 用例 4：地图事故点位弹窗逐点抽检 ----------
await run('case4', async () => {
  const dotCount = await page.locator('.accident-dot').count();
  check('accidentDots', dotCount);
  const labelUnion = new Set();
  const casualtyUnion = new Set();
  const popupTexts = [];
  let emptyPhotoSeen = 0;
  const limit = Math.min(dotCount, 12);
  for (let i = 0; i < limit; i++) {
    await fireClick('.accident-dot', i);
    await page.waitForTimeout(320);
    if (!(await page.locator('.leaflet-popup .accident-popup').count())) continue;
    (await page.locator('.leaflet-popup .accident-popup .accident-popup-grid span').allTextContents()).forEach(t => labelUnion.add(norm(t)));
    const casualty = await page.locator('.leaflet-popup .accident-popup .accident-casualty').last().innerText().catch(() => '');
    if (casualty) casualtyUnion.add(norm(casualty));
    if (await page.locator('.leaflet-popup .accident-popup .accident-popup-photo-empty').count()) emptyPhotoSeen++;
    if (popupTexts.length < 3) popupTexts.push(norm(await page.locator('.leaflet-popup .accident-popup').last().innerText()));
  }
  check('dotPopupLabelsUnion', Array.from(labelUnion));
  check('dotPopupCasualtyUnion', Array.from(casualtyUnion));
  check('dotPopupSample', popupTexts);
  check('dotPopupWithEmptyPhoto', emptyPhotoSeen);
});

// ---------- 用例 5：列表空结果 colspan ----------
await run('case5', async () => {
  await page.locator('#accident-list-trigger').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('#overlay-root input[type="date"]');
    if (inputs[0]) { inputs[0].value = '2099-01-01'; inputs[0].dispatchEvent(new Event('change', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '2099-12-31'; inputs[1].dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(800);
  check('emptyColspan', await page.locator('.accident-list-table .road-list-empty').getAttribute('colspan'));
  check('emptyText', norm(await page.locator('.accident-list-table .road-list-empty').innerText()));
  await page.screenshot({ path: path.join(OUT, '驾驶舱_事故列表_空状态_20260924.png') });
  await page.locator('#modal-action').click();
  await page.waitForTimeout(500);
});

// ---------- 用例 6：多分辨率弹窗不越界 ----------
await run('case6', async () => {
  for (const [w, h, tag] of [[1366, 768, '1366x768'], [3840, 1080, '3840x1080']]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(1000);
    await page.locator('#accident-list-trigger').click();
    await page.waitForTimeout(600);
    await page.locator('.accident-list-table tbody tr').first().locator('[data-accident-locate]').click();
    await page.waitForTimeout(2400);
    const popupBox = await page.locator('.leaflet-popup').last().boundingBox();
    check('popupBox_' + tag, popupBox ? { x: Math.round(popupBox.x), y: Math.round(popupBox.y), w: Math.round(popupBox.width), h: Math.round(popupBox.height) } : null);
    check('popupInViewport_' + tag, popupBox ? (popupBox.x >= 0 && popupBox.y >= 0 && popupBox.x + popupBox.width <= w && popupBox.y + popupBox.height <= h) : false);
    check('gridLabels_' + tag, await page.locator('.leaflet-popup .accident-popup .accident-popup-grid span').allTextContents());
    check('casualtyVisible_' + tag, await page.locator('.leaflet-popup .accident-popup .accident-casualty').isVisible().catch(() => false));
    await page.screenshot({ path: path.join(OUT, `驾驶舱_事故弹窗_${tag}_20260924.png`) });
  }
});

check('errors', errors);
check('missingResources', missing);
console.log(JSON.stringify(results, null, 2));
await browser.close();
server.close();
