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
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/03-高保真页面/cockpit/index.html`);
  await page.locator('#cockpit-map').waitFor();
  await page.waitForTimeout(1200);

  // 全图层打开，让图例达到最多 11 项
  await page.locator('#map-layer-btn svg').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('#map-layer-popover input[data-layer]').forEach(input => { if (!input.checked) input.click(); }));
  await page.mouse.click(960, 1060);
  await page.waitForTimeout(600);

  const markerCount = await page.locator('[class*="vehicle-"].leaflet-marker-icon').count();
  const vehicleId = await page.evaluate(() => {
    const vehicle = (window.vehicleData || [])[0];
    return vehicle ? vehicle.id : null;
  });

  let traj = null;
  if (vehicleId) {
    await page.evaluate(id => window.openCockpitTrajectory(id), vehicleId);
    await page.waitForTimeout(900);
    traj = await page.evaluate(() => {
      const panel = document.getElementById('cockpit-trajectory-panel');
      const legend = document.getElementById('map-legend');
      const pr = panel.getBoundingClientRect();
      const lr = legend.getBoundingClientRect();
      const overlapTop = Math.max(pr.top, lr.top);
      const overlapBottom = Math.min(pr.bottom, lr.bottom);
      return {
        open: panel.classList.contains('is-open'),
        panelBox: { top: Math.round(pr.top), bottom: Math.round(pr.bottom), h: Math.round(pr.height) },
        legendBox: { top: Math.round(lr.top), bottom: Math.round(lr.bottom), h: Math.round(lr.height) },
        overlapPx: Math.max(0, Math.round(overlapBottom - overlapTop)),
        legendOpacity: getComputedStyle(legend).opacity,
        legendZ: getComputedStyle(legend).zIndex,
        panelZ: getComputedStyle(panel).zIndex
      };
    });
    await page.screenshot({ path: path.join(out, 'cockpit_legend_trajectory_overlap.png'), fullPage: false });
    await page.evaluate(() => window.closeCockpitTrajectory());
    await page.waitForTimeout(500);
    const afterClose = await page.evaluate(() => ({
      open: document.getElementById('cockpit-trajectory-panel').classList.contains('is-open'),
      legendOpacity: getComputedStyle(document.getElementById('map-legend')).opacity
    }));
    await page.screenshot({ path: path.join(out, 'cockpit_legend_after_close.png'), fullPage: false });
    console.log(JSON.stringify({ afterClose }));
  }

  console.log(JSON.stringify({ markerCount, vehicleId, traj, errors }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ verdict: 'fail', errors: [...errors, 'EXCEPTION: ' + error.message] }, null, 2));
  process.exitCode = 2;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
