import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const root = path.resolve('.');
const out = path.resolve('07-bugs');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(req.url === '/favicon.ico' ? 204 : 404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(5000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const checks = [];
const check = (name, ok, detail = '') => { checks.push({ name, ok, detail }); if (!ok) throw new Error(`${name}: ${detail}`); };
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/03-高保真页面/cockpit/index.html`);
  await page.locator('#cockpit-map').waitFor();
  check('map rendered', await page.locator('.leaflet-container').count() === 1);
  await page.locator('.map-cluster-icon').first().click();
  await page.waitForTimeout(1200);
  const mapState = await page.locator('#cockpit-map').evaluate(el => ({ markers: el.querySelectorAll('.vehicle-dot').length, clusters: el.querySelectorAll('.map-cluster-icon').length, zoom: el.querySelector('.leaflet-map-pane')?.style.transform || '' }));
  check('vehicle points rendered', mapState.markers > 0, JSON.stringify(mapState));
  await page.locator('.vehicle-dot').first().click();
  await page.locator('.cockpit-vehicle-popup').waitFor();
  check('vehicle detail popup', await page.locator('.cockpit-vehicle-popup').count() === 1);
  check('vehicle actions', await page.locator('.cockpit-popup-action').count() === 2);
  await page.locator('.cockpit-popup-action.primary').click();
  await page.locator('#cockpit-trajectory-panel.is-open').waitFor();
  check('trajectory panel', await page.locator('#cockpit-trajectory-panel.is-open').count() === 1);
  check('trajectory marker', await page.locator('.cockpit-trajectory-marker').count() === 1);
  await page.locator('[data-traj-slider]').evaluate((input) => { input.value = Math.floor(Number(input.max) / 2); input.dispatchEvent(new Event('input', { bubbles: true })); });
  check('trajectory time updated', await page.locator('[data-traj-current-time]').textContent() !== '08:00:00');
  await page.locator('[data-traj-play]').click();
  await page.waitForTimeout(120);
  check('trajectory play state', (await page.locator('[data-traj-play]').textContent()).includes('暂停'));
  await page.locator('[data-traj-play]').click();
  await page.locator('[data-traj-play]').waitFor();
  await page.locator('[aria-label="关闭轨迹面板"]').click();
  await page.locator('.cockpit-vehicle-popup').waitFor();
  await page.locator('.cockpit-popup-action').nth(1).click();
  await page.locator('#cockpit-video-panel.is-open').waitFor();
  check('video panel', await page.locator('.cockpit-video-panel.is-open').count() === 1);
  check('video workbench mounted', await page.locator('#cockpit-video-pane .vw-workbench').count() === 1);
  check('live video mode', await page.locator('#cockpit-video-pane .vw-main-stage').count() === 1);
  await page.locator('#cockpit-video-close').click();
  check('video panel closes', await page.locator('#cockpit-video-panel.is-open').count() === 0);
  check('no browser errors', errors.length === 0, errors.join('; '));
  await page.screenshot({ path: path.join(out, '驾驶舱_车辆视频轨迹入口_1920x1080.png'), fullPage: false });
  console.log(JSON.stringify({ verdict: 'ok', checks, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
