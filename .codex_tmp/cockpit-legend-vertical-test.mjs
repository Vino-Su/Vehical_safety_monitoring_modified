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
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/03-高保真页面/cockpit/index.html`);
  await page.locator('#cockpit-map').waitFor();

  const measure = async () => page.evaluate(() => {
    const legend = document.getElementById('map-legend');
    const stage = document.getElementById('map-stage');
    const lr = legend.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const items = [...legend.querySelectorAll('span')].map(span => {
      const r = span.getBoundingClientRect();
      const dot = span.querySelector('i').getBoundingClientRect();
      const text = span.lastChild;
      const range = document.createRange();
      range.selectNodeContents(text);
      const tr = range.getBoundingClientRect();
      return { label: span.textContent.trim(), spanTop: Math.round(r.top), spanLeft: Math.round(r.left), textLeft: Math.round(tr.left), textTop: Math.round(tr.top), dotLeft: Math.round(dot.left), dotW: Math.round(dot.width) };
    });
    return {
      direction: getComputedStyle(legend).flexDirection,
      count: items.length,
      legendBox: { x: Math.round(lr.x), y: Math.round(lr.y), w: Math.round(lr.width), h: Math.round(lr.height) },
      stageBox: { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height) },
      insideStage: lr.top >= sr.top && lr.left >= sr.left && lr.bottom <= sr.bottom && lr.right <= sr.right,
      items
    };
  });

  const initial = await measure();

  // 打开图层弹层并勾选全部业务图层，验证图例项最多时的表现
  await page.locator('#map-layer-btn svg').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.querySelectorAll('#map-layer-popover input[data-layer]').forEach(input => {
      if (!input.checked) input.click();
    });
  });
  await page.mouse.click(960, 1050);
  await page.waitForTimeout(600);
  const full = await measure();
  await page.screenshot({ path: path.join(out, 'cockpit_legend_vertical_full.png'), fullPage: false });
  await page.locator('#cockpit-map').screenshot({ path: path.join(out, 'cockpit_legend_vertical_map.png') });

  console.log(JSON.stringify({ verdict: 'ok', initial, full, errors }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ verdict: 'fail', errors: [...errors, 'EXCEPTION: ' + error.message] }, null, 2));
  process.exitCode = 2;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
