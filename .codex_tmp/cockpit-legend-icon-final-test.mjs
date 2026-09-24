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

  // 打开异常车辆、事故点位、道路、围栏图层，让图例项达到完整集合
  await page.locator('#map-layer-btn svg').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('#map-layer-popover input[data-layer]').forEach(input => { if (!input.checked) input.click(); }));
  await page.mouse.click(960, 1060);
  await page.waitForTimeout(700);

  const legend = await page.evaluate(() => {
    const box = document.getElementById('map-legend');
    const br = box.getBoundingClientRect();
    return {
      legendBox: { top: Math.round(br.top), bottom: Math.round(br.bottom), left: Math.round(br.left), w: Math.round(br.width), h: Math.round(br.height) },
      items: [...box.querySelectorAll('span')].map(span => {
        const icon = span.querySelector('i');
        const ir = icon.getBoundingClientRect();
        const svg = icon.querySelector('svg');
        const range = document.createRange();
        range.selectNodeContents(span.lastChild);
        return {
          label: span.textContent.trim(),
          iconClass: icon.className,
          text: icon.textContent,
          isSvg: !!svg,
          size: [Math.round(ir.width), Math.round(ir.height)],
          bg: getComputedStyle(icon).backgroundColor,
          fg: getComputedStyle(icon).color,
          border: getComputedStyle(icon).borderTopColor + ' ' + getComputedStyle(icon).borderTopWidth,
          textLeft: Math.round(range.getBoundingClientRect().left)
        };
      })
    };
  });

  await page.screenshot({ path: path.join(out, 'cockpit_legend_icons_full.png'), fullPage: false });
  await page.locator('#map-legend').screenshot({ path: path.join(out, 'cockpit_legend_icons_crop.png') });

  const textLefts = [...new Set(legend.items.map(item => item.textLeft))];
  console.log(JSON.stringify({ ...legend, alignedTextLefts: textLefts, errors }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ verdict: 'fail', errors: [...errors, 'EXCEPTION: ' + error.message] }, null, 2));
  process.exitCode = 2;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
