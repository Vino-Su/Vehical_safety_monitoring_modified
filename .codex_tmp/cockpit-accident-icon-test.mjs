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
await new Promise(r => server.listen(9191, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });

await page.goto('http://127.0.0.1:9191/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);

const out = {};
await page.locator('#accident-module .module-heading h2').first().click();
await page.waitForTimeout(700);
out.clusterCount = await page.locator('.accident-cluster-icon').count();
out.accidentDotsBeforeZoom = await page.locator('.accident-dot').count();

if (out.clusterCount) {
  await page.locator('.accident-cluster-icon').first().click();
  await page.waitForTimeout(1800);
}
out.accidentDotsAfterZoom = await page.locator('.accident-dot').count();

// 图标自身渲染信息：尺寸 / 填充色 / SVG 是否挂载
out.iconInfo = await page.evaluate(() => {
  const dot = document.querySelector('.accident-dot');
  if (!dot) return null;
  const svg = dot.querySelector('svg');
  const cs = getComputedStyle(dot);
  const svgCs = svg ? getComputedStyle(svg) : null;
  return {
    hasSvg: !!svg,
    svgClass: svg ? svg.getAttribute('class') : null,
    viewBox: svg ? svg.getAttribute('viewBox') : null,
    pathCount: svg ? svg.querySelectorAll('path').length : 0,
    dotSize: { w: Math.round(dot.getBoundingClientRect().width), h: Math.round(dot.getBoundingClientRect().height) },
    color: cs.color,
    filter: cs.filter,
    svgSize: svgCs ? { w: svgCs.width, h: svgCs.height } : null,
    svgFill: svgCs ? svgCs.fill : null,
    anchor: (() => { const s = dot.getAttribute('style') || ''; return s; })()
  };
});

// 整图截图
await page.locator('#cockpit-map').screenshot({ path: path.join(OUT, '驾驶舱_事故图标替换_地图_1920x1080_20260923.png') });

// 单个图标放大裁剪（便于查看形状）
const boxes = [];
for (let i = 0; i < Math.min(out.accidentDotsAfterZoom, 4); i++) {
  const b = await page.locator('.accident-dot').nth(i).boundingBox();
  if (b) boxes.push(b);
}
if (boxes.length) {
  const x = Math.max(0, Math.min(...boxes.map(b => b.x)) - 20);
  const y = Math.max(0, Math.min(...boxes.map(b => b.y)) - 20);
  const right = Math.max(...boxes.map(b => b.x + b.width)) + 20;
  const bottom = Math.max(...boxes.map(b => b.y + b.height)) + 20;
  await page.screenshot({ path: path.join(OUT, '驾驶舱_事故图标替换_特写_20260923.png'), clip: { x, y, width: Math.min(right - x, 900), height: Math.min(bottom - y, 700) } });
  out.clipBoxCount = boxes.length;
}

// tooltip / popup 位置校验
if (out.accidentDotsAfterZoom) {
  const dot = page.locator('.accident-dot').first();
  await dot.hover();
  await page.waitForTimeout(500);
  out.tooltipVisible = await page.locator('.leaflet-tooltip').first().isVisible();
  const tipBox = await page.locator('.leaflet-tooltip').first().boundingBox();
  const dotBox = await dot.boundingBox();
  out.tooltipAboveIcon = tipBox && dotBox ? Math.round(dotBox.y - (tipBox.y + tipBox.height)) : null;
  await dot.click();
  await page.waitForTimeout(600);
  out.popupVisible = await page.locator('.leaflet-popup .vehicle-popup').first().isVisible();
}

out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
