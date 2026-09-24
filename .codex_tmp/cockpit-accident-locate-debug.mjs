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
await new Promise(r => server.listen(9194, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const logs = [];
page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
page.on('console', m => logs.push('[' + m.type() + '] ' + m.text()));

await page.goto('http://127.0.0.1:9194/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);

const snapshot = async (label) => ({
  label,
  layerCheckbox: await page.evaluate(() => {
    const cb = document.querySelector('#map-layer-popover [data-layer="accident"]');
    return cb ? cb.checked : 'MISSING';
  }),
  accidentPressed: await page.locator('#accident-module').getAttribute('aria-pressed'),
  dots: await page.locator('.accident-dot').count(),
  clusters: await page.locator('.accident-cluster-icon').count(),
  popups: await page.locator('.leaflet-popup').count(),
  vehicleDots: await page.locator('.vehicle-dot, .vehicle-car').count()
});

const snapshots = [];
snapshots.push(await snapshot('初始'));

await page.locator('#accident-list-trigger').click();
await page.waitForTimeout(600);
snapshots.push(await snapshot('列表已打开'));

await page.locator('.accident-list-table tbody tr').first().locator('[data-accident-locate]').click();
for (const ms of [200, 500, 900, 1500, 2500, 3500]) {
  await page.waitForTimeout(ms === 200 ? 200 : 300);
  snapshots.push(await snapshot('点击定位后+' + ms + 'ms'));
}

// 手动再点一次事故模块标题，观察图层是否恢复
await page.locator('#accident-module .module-heading h2').first().click();
await page.waitForTimeout(1200);
snapshots.push(await snapshot('手动切换模块选中后'));

console.log(JSON.stringify({ snapshots, logs: logs.filter(l => !/favicon/.test(l)) }, null, 2));
await browser.close();
server.close();
