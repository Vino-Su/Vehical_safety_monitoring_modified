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
  if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return res.writeHead(req.url === '/favicon.ico' ? 204 : 404).end();
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const checks = [];
const check = (name, ok, detail = '') => { checks.push({ name, ok, detail }); if (!ok) throw new Error(`${name}: ${detail}`); };
try {
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 3840, height: 1080 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/03-高保真页面/cockpit/index.html`);
    await page.locator('.map-cluster-icon').first().click();
    await page.locator('.vehicle-dot').first().click();
    await page.locator('.cockpit-vehicle-popup').waitFor();
    await page.locator('.cockpit-popup-action').nth(1).click();
    await page.locator('#cockpit-video-panel.is-open').waitFor();
    check(`${viewport.width} header removes realtime label`, !(await page.locator('#cockpit-video-panel').innerText()).includes('实时视频'));
    check(`${viewport.width} vehicle status`, ['在线', '离线'].includes((await page.locator('#cockpit-video-status').innerText()).trim()));
    const style = await page.locator('#cockpit-video-pane .vw-vehicle-select').evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
    check(`${viewport.width} cockpit select style`, style.bg === 'rgb(16, 38, 58)' && style.color === 'rgb(242, 246, 249)', JSON.stringify(style));
    await page.locator('#cockpit-video-pane .vw-thumb').nth(1).click();
    check(`${viewport.width} camera switch`, await page.locator('#cockpit-video-pane .vw-thumb.active').count() === 1);
    await page.locator('#cockpit-video-pane .vw-tool-actions button').filter({ hasText: '历史回放' }).click();
    check(`${viewport.width} playback controls`, await page.locator('#cockpit-video-pane .vw-playback').count() === 1);
    check(`${viewport.width} no browser errors`, errors.length === 0, errors.join('; '));
    await page.screenshot({ path: path.join(out, `驾驶舱_车辆视频面板优化_${viewport.width}x1080.png`), fullPage: false });
    await page.close();
  }
  console.log(JSON.stringify({ verdict: 'ok', checks }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
