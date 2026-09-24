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
page.on('pageerror', error => errors.push('exception: ' + error.message));
page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/03-高保真页面/cockpit/index.html`);
  await page.locator('#cockpit-map').waitFor();
  await page.waitForTimeout(1500);

  const legendItems = await page.evaluate(() => {
    const legend = document.getElementById('map-legend');
    return [...legend.querySelectorAll('span')].map(span => {
      const icon = span.querySelector('i');
      const svg = icon.querySelector('svg');
      const ir = icon.getBoundingClientRect();
      const sr = svg ? svg.getBoundingClientRect() : null;
      const range = document.createRange();
      range.selectNodeContents(span.lastChild);
      return {
        label: span.textContent.trim(),
        iconClass: icon.className,
        hasSvg: !!svg,
        iconSize: [Math.round(ir.width), Math.round(ir.height)],
        svgSize: sr ? [Math.round(sr.width), Math.round(sr.height)] : null,
        color: getComputedStyle(icon).color,
        fill: svg ? getComputedStyle(svg).fill : null,
        viewBox: svg ? svg.getAttribute('viewBox') : null,
        pathCount: svg ? svg.querySelectorAll('path').length : 0,
        firstPathHead: svg ? svg.querySelector('path').getAttribute('d').slice(0, 40) : null,
        textLeft: Math.round(range.getBoundingClientRect().left)
      };
    });
  });

  // 放大地图到车图标级别（zoom >= 15），取地图上真实车辆图标 svg 作对比
  const mapBox = await page.locator('#cockpit-map').boundingBox();
  await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
  for (let i = 0; i < 6; i += 1) {
    await page.mouse.wheel(0, -240);
    await page.waitForTimeout(320);
  }
  await page.waitForTimeout(1200);
  const mapVehicle = await page.evaluate(() => {
    const marker = document.querySelector('.vehicle-car');
    if (!marker) return { found: false, zoomHint: document.querySelectorAll('.vehicle-dot').length };
    const svg = marker.querySelector('svg');
    const r = svg.getBoundingClientRect();
    return {
      found: true,
      markerClass: marker.className,
      svgSize: [Math.round(r.width), Math.round(r.height)],
      fill: getComputedStyle(svg).fill,
      viewBox: svg.getAttribute('viewBox'),
      firstPathHead: svg.querySelector('path').getAttribute('d').slice(0, 40)
    };
  });
  const dotCount = await page.locator('.vehicle-dot').count();
  const carCount = await page.locator('.vehicle-car').count();
  await page.screenshot({ path: path.join(out, 'cockpit_legend_vehicle_icon_map.png'), fullPage: false });

  const legendSvgMatches = mapVehicle.found && legendItems.length >= 3
    && legendItems.slice(0, 3).every(item => item.hasSvg && item.firstPathHead === mapVehicle.firstPathHead);

  console.log(JSON.stringify({
    legendItems,
    mapVehicle: { ...mapVehicle, dotCount, carCount },
    legendSvgMatchesMap: legendSvgMatches,
    errors
  }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ verdict: 'fail', errors: [...errors, 'EXCEPTION: ' + error.message] }, null, 2));
  process.exitCode = 2;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
