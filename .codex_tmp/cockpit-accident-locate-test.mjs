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
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });

const results = {};
const check = (name, value) => { results[name] = value; };

await page.goto('http://127.0.0.1:9193/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);

// ---------- 用例 1：列表结构 ----------
await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
check('headers', await page.locator('.accident-list-table thead th').allTextContents());
check('rowCount', await page.locator('.accident-list-table tbody tr').count());
check('locateButtons', await page.locator('.accident-list-table [data-accident-locate]').count());
check('emptyColspan', await page.locator('.accident-list-table .road-list-empty').count()); // 应为 0（有数据）
const actionCellText = await page.locator('.accident-list-table tbody tr').first().locator('td').last().innerText();
check('firstRowActionCell', actionCellText.replace(/\s+/g, ' ').trim());
await page.screenshot({ path: path.join(OUT, '驾驶舱_事故列表定位列_1920x1080_20260923.png') });

// ---------- 用例 2：点击定位（范围内记录） ----------
const firstRow = page.locator('.accident-list-table tbody tr').first();
const targetId = (await firstRow.locator('.accident-code').innerText()).trim();
const targetLocation = (await firstRow.locator('td').nth(5).innerText()).trim();
check('targetId', targetId);

await firstRow.locator('[data-accident-locate]').click();
await page.waitForTimeout(2200);

check('modalClosedAfterLocate', await page.locator('#overlay-root').getAttribute('aria-hidden'));
check('accidentModuleSelected', await page.locator('#accident-module').getAttribute('aria-pressed'));
check('accidentDotsRendered', await page.locator('.accident-dot').count());
const popupText = (await page.locator('.leaflet-popup .accident-popup').last().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
check('popupText', popupText);
check('popupMatchesTarget', popupText.includes(targetId));
check('focusMarkerFallbackUsed', await page.locator('.vehicle-focus-marker').count());
check('targetLocation', targetLocation);
await page.screenshot({ path: path.join(OUT, '驾驶舱_事故列表定位结果_1920x1080_20260923.png') });

// ---------- 用例 3：连续定位第二条 ----------
await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
const secondRow = page.locator('.accident-list-table tbody tr').nth(1);
const secondId = (await secondRow.locator('.accident-code').innerText()).trim();
await secondRow.locator('[data-accident-locate]').click();
await page.waitForTimeout(2200);
const popup2 = (await page.locator('.leaflet-popup .accident-popup').last().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
check('secondTargetId', secondId);
check('secondPopupText', popup2);
check('secondPopupMatches', popup2.includes(secondId));

// ---------- 用例 4：跨范围兜底（模块选本月 + 定位去年记录） ----------
// 先把事故模块时间范围切到"本月"，再打开列表定位一条范围外（去年）记录
await page.locator('#accident-module .range-tabs button').filter({ hasText: '本月' }).first().click();
await page.waitForTimeout(800);
check('rangeSwitchedTo', (await page.locator('#accident-module .range-tabs button.is-active').innerText()).trim());
await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
const lastRow = page.locator('.accident-list-table tbody tr').last();
const outOfRangeId = (await lastRow.locator('.accident-code').innerText()).trim();
const outOfRangeDate = (await lastRow.locator('td').nth(1).innerText()).trim();
await lastRow.locator('[data-accident-locate]').click();
await page.waitForTimeout(2200);
const popup3 = (await page.locator('.leaflet-popup .accident-popup').last().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
check('outOfRangeId', outOfRangeId);
check('outOfRangeDate', outOfRangeDate);
check('outOfRangePopupText', popup3);
check('outOfRangePopupMatches', popup3.includes(outOfRangeId));
check('outOfRangeFallbackMarker', await page.locator('.vehicle-focus-marker').count());
await page.screenshot({ path: path.join(OUT, '驾驶舱_事故列表定位_跨范围兜底_1920x1080_20260923.png') });

// ---------- 用例 5：键盘操作 ----------
await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
const kbRow = page.locator('.accident-list-table tbody tr').nth(2);
const kbId = (await kbRow.locator('.accident-code').innerText()).trim();
await kbRow.locator('[data-accident-locate]').focus();
const focusedLabel = await page.evaluate(() => document.activeElement.getAttribute('aria-label'));
await page.keyboard.press('Enter');
await page.waitForTimeout(2200);
const popup4 = (await page.locator('.leaflet-popup .accident-popup').last().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
check('keyboardFocusedLabel', focusedLabel);
check('keyboardTargetId', kbId);
check('keyboardPopupMatches', popup4.includes(kbId));

check('errors', errors);
console.log(JSON.stringify(results, null, 2));
await browser.close();
server.close();
