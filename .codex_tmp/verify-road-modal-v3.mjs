import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('D:/claude_code_coding/智能网联汽车安全监测平台');
const serverHits = [];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = path.resolve(root, '.' + requestPath);
  serverHits.push(requestPath);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { serverHits.push('404:' + requestPath); res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const failed = [];
page.on('response', res => { if (res.status() >= 400) failed.push(res.status() + ' ' + decodeURIComponent(res.url())); });
await page.goto(`http://127.0.0.1:${port}/03-高保真页面/cockpit/index.html`, { waitUntil: 'networkidle' });
await page.locator('#road-list-trigger').click();
await page.waitForTimeout(300);

const out = {};
out.failedResponses = failed;

const tile = page.locator('.road-summary-filter').first();
const labelBox = await tile.locator('span').boundingBox();
const numBox = await tile.locator('strong').boundingBox();
out.labelBox = labelBox;
out.numBox = numBox;
out.sameRow = Math.abs((labelBox.y + labelBox.height / 2) - (numBox.y + numBox.height / 2)) < 8;
out.numRightOfLabel = numBox.x > labelBox.x;

const footer = await page.locator('.detail-modal footer').boundingBox();
const btn = await page.locator('#modal-action').boundingBox();
out.footerRightAligned = Math.abs((footer.x + footer.width) - (btn.x + btn.width)) < 40;
out.footerBtnVisibleCount = await page.locator('.detail-modal footer button:visible').count();

out.selectOptions = await page.locator('[data-road-area] option').allInnerTexts();
const selectBox = await page.locator('[data-road-area]').boundingBox();
out.selectBox = selectBox;

const paginationOk = await page.locator('.road-pagination').count();
out.paginationExists = paginationOk === 1;
out.serverHits = serverHits;

console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
