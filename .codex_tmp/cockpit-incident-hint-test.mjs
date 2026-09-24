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
await new Promise(r => server.listen(9189, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const result = {};

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', e => errors.push({ msg: e.message, stack: (e.stack || '').split('\n').slice(0, 4).join(' | ') }));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push({ msg: '[console] ' + m.text(), stack: m.location() ? m.location().url + ':' + m.location().lineNumber : '' }); });

  await page.goto('http://127.0.0.1:9189/03-高保真页面/cockpit/index.html');
  await page.waitForTimeout(2500);

  const tag = viewport.width + 'x' + viewport.height;
  const bodyText = await page.locator('#incident-module').textContent();

  // 1) 提示节点已彻底移除
  const hintCount = await page.locator('#incident-selection-hint').count();
  const noHintText = !bodyText.includes('点击模块查看区域异常事件聚合') && !bodyText.includes('地图已按异常事件聚合');

  // 2) 选中模块前后布局
  const gridBefore = await page.locator('#incident-module .metric-grid').boundingBox();
  const donutBefore = await page.locator('.incident-donut-wrap').boundingBox();

  await page.locator('#incident-module .module-heading h2').first().click();
  await page.waitForTimeout(700);
  const donutAfter = await page.locator('.incident-donut-wrap').boundingBox();
  const hintCountAfter = await page.locator('#incident-selection-hint').count();
  const bodyTextAfter = await page.locator('#incident-module').textContent();
  const noHintTextAfter = !bodyTextAfter.includes('点击模块查看区域异常事件聚合') && !bodyTextAfter.includes('地图已按异常事件聚合');
  await page.screenshot({ path: path.join(OUT, `驾驶舱_异常事件提示移除_选中_${tag}_20260923.png`) });

  await page.locator('#incident-module .module-heading h2').first().click();
  await page.waitForTimeout(700);
  const bodyTextDeselect = await page.locator('#incident-module').textContent();
  const noHintTextDeselect = !bodyTextDeselect.includes('点击模块查看区域异常事件聚合') && !bodyTextDeselect.includes('地图已按异常事件聚合');
  await page.screenshot({ path: path.join(OUT, `驾驶舱_异常事件提示移除_未选中_${tag}_20260923.png`) });

  // 3) 模块内其他内容未受影响
  const donutHole = (await page.locator('#incident-total').textContent()).trim();
  const legendCount = await page.locator('#incident-legend span').count();
  const eventRows = await page.locator('#event-list .event-row').count();

  result[tag] = {
    hintCount, noHintText,
    hintCountAfter, noHintTextAfter, noHintTextDeselect,
    gapBefore: Math.round(donutBefore.y - (gridBefore.y + gridBefore.height)),
    gapAfter: Math.round(donutAfter.y - (gridBefore.y + gridBefore.height)),
    donutShiftOnSelect: Math.round(donutAfter.y - donutBefore.y),
    donutHole, legendCount, eventRows,
    errors
  };
  await page.close();
}

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
