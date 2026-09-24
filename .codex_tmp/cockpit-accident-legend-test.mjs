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
await new Promise(r => server.listen(9192, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 3 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });

await page.goto('http://127.0.0.1:9192/03-高保真页面/cockpit/index.html');
await page.waitForTimeout(2500);

const out = {};

// 默认（车辆）模式图例回归
out.defaultLegend = await page.locator('#map-legend').innerText();
out.defaultDotCount = await page.locator('#map-legend i').count();

// 进入事故模式
await page.locator('#accident-module .module-heading h2').first().click();
await page.waitForTimeout(700);

out.accidentLegendText = (await page.locator('#map-legend').innerText()).replace(/\s+/g, ' ').trim();
out.accidentIcon = await page.evaluate(() => {
  const icon = document.querySelector('#map-legend .legend-accident-icon');
  if (!icon) return null;
  const svg = icon.querySelector('svg');
  const ib = icon.getBoundingClientRect();
  const sb = svg ? svg.getBoundingClientRect() : null;
  const label = icon.parentElement;
  const textNode = Array.from(label.childNodes).find(n => n.nodeType === 3);
  const range = document.createRange();
  if (textNode) range.selectNodeContents(textNode);
  const tb = textNode ? range.getBoundingClientRect() : null;
  const cs = getComputedStyle(icon);
  return {
    hasSvg: !!svg,
    iconSize: { w: Math.round(ib.width), h: Math.round(ib.height) },
    svgSize: sb ? { w: Math.round(sb.width), h: Math.round(sb.height) } : null,
    color: cs.color,
    fill: svg ? getComputedStyle(svg).fill : null,
    borderRadius: cs.borderRadius,
    iconCenterY: Math.round(ib.y + ib.height / 2),
    textCenterY: tb ? Math.round(tb.y + tb.height / 2) : null,
    alignDeltaY: tb ? Math.round((ib.y + ib.height / 2) - (tb.y + tb.height / 2)) : null,
    isVisible: ib.width > 0 && ib.height > 0
  };
});
out.legendBox = await page.locator('#map-legend').boundingBox();

const lb = out.legendBox;
await page.screenshot({
  path: path.join(OUT, '驾驶舱_事故图例图标_特写_20260923.png'),
  clip: { x: Math.max(0, lb.x - 8), y: Math.max(0, lb.y - 8), width: lb.width + 16, height: lb.height + 16 }
});
await page.screenshot({ path: path.join(OUT, '驾驶舱_事故图例图标_全屏_1920x1080_20260923.png') });

// 切回车辆模块，确认图例恢复且无残留图标
await page.locator('#vehicle-monitor-module .module-heading h2').first().click();
await page.waitForTimeout(600);
out.afterBackToVehicle = (await page.locator('#map-legend').innerText()).replace(/\s+/g, ' ').trim();
out.afterBackToVehicleIconCount = await page.locator('#map-legend .legend-accident-icon').count();

out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
