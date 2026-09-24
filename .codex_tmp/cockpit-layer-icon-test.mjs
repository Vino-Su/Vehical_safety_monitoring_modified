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
const KNOWN = 'SyntaxError: Unexpected token \'<\'';
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/03-高保真页面/cockpit/index.html`);
  await page.locator('#cockpit-map').waitFor();

  const btn = page.locator('#map-layer-btn');
  const svg = page.locator('#map-layer-btn svg');
  check('layer button exists', await btn.count() === 1);
  check('svg icon rendered', await svg.count() === 1, `count=${await svg.count()}`);
  check('no text residue', (await btn.textContent()).trim() === '', `text="${(await btn.textContent()).trim()}"`);

  const box = await svg.evaluate(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { w: r.width, h: r.height, cw: cs.width, fill: getComputedStyle(el.querySelector('path')).fill }; });
  check('icon box 16x16 centered', box.w === 16 && box.h === 16, JSON.stringify(box));
  check('icon color follows button', box.fill === 'rgb(167, 186, 200)', box.fill);

  await btn.hover();
  await page.waitForTimeout(300);
  const hoverFill = await svg.evaluate(el => getComputedStyle(el.querySelector('path')).fill);
  check('icon hover turns cyan', hoverFill === 'rgb(0, 207, 232)', hoverFill);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);

  // 点击图标本体（事件 target 是 svg/path，而非 button）
  await svg.click();
  await page.waitForTimeout(200);
  const popover = page.locator('#map-layer-popover');
  check('popover opens on icon click', await popover.evaluate(el => el.classList.contains('is-open')), 'not open');
  check('popover aria-hidden false', await popover.getAttribute('aria-hidden') === 'false');
  check('layer checkbox count', await popover.locator('input[type=checkbox]').count() === 6, String(await popover.locator('input[type=checkbox]').count()));

  // 点击弹层内部不应关闭
  await popover.locator('label').first().click();
  await page.waitForTimeout(200);
  check('popover stays open after inner click', await popover.evaluate(el => el.classList.contains('is-open')), 'closed by inner click');

  // 点击外部应关闭
  await page.mouse.click(960, 1050);
  await page.waitForTimeout(250);
  check('popover closes on outside click', !(await popover.evaluate(el => el.classList.contains('is-open'))), 'still open');

  // 再次点击图标应重新打开并保持
  await svg.click();
  await page.waitForTimeout(300);
  check('popover reopens and persists', await popover.evaluate(el => el.classList.contains('is-open')), 'closed right after reopen');

  const unexpected = errors.filter(e => e !== KNOWN);
  check('no unexpected js errors', unexpected.length === 0, unexpected.join(' | '));
  await page.screenshot({ path: path.join(out, `驾驶舱_图层按钮图标_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.png`), fullPage: false });
  console.log(JSON.stringify({ verdict: 'ok', checks, knownErrors: errors.filter(e => e === KNOWN) }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ verdict: 'fail', checks, errors: [...errors, 'EXCEPTION: ' + error.message] }, null, 2));
  process.exitCode = 2;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
