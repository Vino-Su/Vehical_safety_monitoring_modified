import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('D:/claude_code_coding/智能网联汽车安全监测平台');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = path.resolve(root, '.' + requestPath);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
const failed = [];
page.on('response', res => { if (res.status() >= 400) failed.push(res.status() + ' ' + decodeURIComponent(res.url())); });
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${port}/03-高保真页面/cockpit/index.html`, { waitUntil: 'networkidle' });

const out = {};
await page.locator('#road-list-trigger').click();
await page.waitForTimeout(400);
out.title = (await page.locator('#modal-title').textContent() || '').trim();
out.kickerHidden = await page.locator('#modal-kicker').isHidden();
out.footerBtns = await page.locator('.detail-modal footer button:visible').allInnerTexts();
out.summaryTexts = await page.locator('.road-summary-filter').allInnerTexts();
out.total = (await page.locator('.road-page-total').innerText()).replace(/\s+/g, ' ').trim();
out.pageBtns = await page.locator('.road-page-controls .road-page-btn').allInnerTexts();
out.page1Rows = await page.locator('.road-list-table tbody tr').count();
out.scenes = await page.locator('.road-list-table tbody tr td:nth-child(7)').allInnerTexts();
await page.screenshot({ path: path.join(root, '07-bugs', '道路列表弹窗_分页与筛选_1920x1080.png') });

await page.locator('.road-page-btn[data-road-page="2"]').click();
await page.waitForTimeout(200);
out.page2Rows = await page.locator('.road-list-table tbody tr').count();
out.page2Active = (await page.locator('.road-page-btn.is-active').innerText()).trim();

await page.locator('[data-road-area]').selectOption('樊城区');
await page.waitForTimeout(200);
out.areaRows = await page.locator('.road-list-table tbody tr').count();
out.areaPageActive = (await page.locator('.road-page-btn.is-active').innerText()).trim();
out.areaFirstRow = (await page.locator('.road-list-table tbody tr').first().innerText()).replace(/\s+/g, ' ');

await page.locator('[data-modal-road-filter="paused"]').click();
await page.waitForTimeout(200);
out.pausedInFancheng = await page.locator('.road-list-table tbody tr').count();
out.pausedText = (await page.locator('.road-list-table tbody').innerText()).replace(/\s+/g, ' ');

await page.locator('[data-road-area]').selectOption('高新区');
await page.waitForTimeout(200);
out.emptyText = (await page.locator('.road-list-table tbody').innerText()).replace(/\s+/g, ' ');
await page.screenshot({ path: path.join(root, '07-bugs', '道路列表弹窗_空状态_1920x1080.png') });

await page.locator('#modal-action').click();
await page.waitForTimeout(300);
out.closed = (await page.locator('#overlay-root.is-open').count()) === 0;

await page.locator('#road-list-trigger').click();
await page.waitForTimeout(300);
out.reopenFilterKept = await page.locator('[data-modal-road-filter="paused"].is-selected').count();
out.reopenAreaValue = await page.locator('[data-road-area]').inputValue();
out.reopenPageActive = (await page.locator('.road-page-btn.is-active').innerText()).trim();
await page.locator('#modal-action').click();

out.errors = errors;
out.failedResponses = failed;
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
