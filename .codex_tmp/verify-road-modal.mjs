import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = path.resolve(root, '.' + (requestPath === '/' ? '/03-高保真页面/cockpit/index.html' : requestPath));
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(`http://127.0.0.1:${port}/03-高保真页面/cockpit/index.html`, { waitUntil: 'networkidle' });
await page.locator('#road-list-trigger').click();
await page.waitForTimeout(350);
await page.screenshot({ path: path.join(root, '07-bugs', '开放道路资源_道路列表弹窗_1366x768_2026-09-22.png'), fullPage: false });
const opened = await page.locator('#overlay-root.is-open').count();
const title = await page.locator('#modal-title').textContent();
const initialRows = await page.locator('.road-list-table tbody tr').count();
await page.locator('[data-modal-road-filter="paused"]').click();
const pausedSelected = await page.locator('[data-modal-road-filter="paused"].is-selected').count();
const pausedRows = await page.locator('.road-list-table tbody tr').count();
const pausedText = await page.locator('.road-list-table tbody').innerText();
await page.locator('#modal-action').click();
const closed = await page.locator('#overlay-root.is-open').count() === 0;
await page.locator('[data-road-filter="paused"]').click();
await page.locator('#road-list-trigger').click();
const inheritedPaused = await page.locator('[data-modal-road-filter="paused"].is-selected').count();
const inheritedRows = await page.locator('.road-list-table tbody tr').count();
await page.locator('#modal-action').click();
console.log(JSON.stringify({ opened, title, initialRows, pausedSelected, pausedRows, pausedText, closed, inheritedPaused, inheritedRows, errors }, null, 2));
await browser.close();
server.close();
