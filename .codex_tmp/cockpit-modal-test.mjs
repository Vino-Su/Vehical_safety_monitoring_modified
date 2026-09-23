import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const root = path.resolve('03-高保真页面');
const out = path.resolve('07-bugs');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : (req.url === '/' ? path.join(root, 'index.html') : null);
  if (!file) { res.writeHead(req.url === '/favicon.ico' ? 204 : 404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text() + ' ' + message.location().url); });
const checks = [];
const check = (name, ok, detail = '') => { checks.push({ name, ok, detail }); if (!ok) throw new Error(`${name}: ${detail}`); };
const open = async (selector, title) => {
  await page.locator(selector).click();
  await page.locator('.cockpit-overlay.is-open').waitFor();
  check(title + ' opens', await page.locator('#modal-title').textContent() === title);
  const bounds = await page.locator('.detail-modal').boundingBox();
  const viewport = page.viewportSize();
  check(title + ' fits viewport', bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width && bounds.y + bounds.height <= viewport.height, JSON.stringify(bounds));
};
const close = async () => { await page.locator('.modal-close').click(); check('closes', await page.locator('.cockpit-overlay.is-open').count() === 0); };
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/cockpit/index.html`);
  await open('#application-list-trigger', '申请列表');
  check('application summary first', await page.locator('.application-modal-summary').count() === 1);
  check('application filter below summary', await page.locator('.application-modal-summary + .modal-filter-row').count() === 1);
  await page.locator('[data-application-page="next"]').click();
  check('application pagination', await page.locator('[data-application-page="2"]').getAttribute('aria-current') === 'page');
  await page.locator('[data-application-filter="road-test"]').click();
  check('application category filters', await page.locator('[data-application-filter="road-test"]').getAttribute('aria-selected') === 'true');
  await page.locator('#application-date-from').fill('2027-01-01');
  await page.locator('#application-date-from').dispatchEvent('change');
  check('application empty state', await page.locator('.road-list-empty').count() === 1);
  await page.screenshot({ path: path.join(out, '驾驶舱_申请弹窗_统一样式_1920x1080.png') });
  await close();

  await open('#road-list-trigger', '道路列表');
  check('road filter below summary', await page.locator('.road-modal-summary + .road-list-meta').count() === 1);
  await page.locator('[data-modal-road-filter="all"]').click();
  await page.locator('[data-road-area]').selectOption('all');
  await page.locator('[data-road-page="next"]').click();
  check('road pagination', await page.locator('[data-road-page="2"]').getAttribute('aria-current') === 'page');
  await page.locator('[data-modal-road-filter="paused"]').click();
  check('road status filters', await page.locator('[data-modal-road-filter="paused"]').getAttribute('aria-selected') === 'true');
  await page.locator('[data-road-area]').selectOption({ index: 1 });
  check('road area filters', await page.locator('[data-road-area]').inputValue() !== 'all');
  await page.screenshot({ path: path.join(out, '驾驶舱_道路弹窗_统一样式_1920x1080.png') });
  await close();

  await open('#vehicle-list-trigger', '车辆列表');
  check('vehicle summary visually before filter', await page.locator('.vehicle-modal-summary').evaluate(el => el.getBoundingClientRect().top < document.querySelector('.vehicle-list-toolbar').getBoundingClientRect().top));
  await page.locator('[data-vehicle-search]').fill('A001');
  check('vehicle search filters', await page.locator('.vehicle-list-table tbody tr').count() === 1);
  await page.screenshot({ path: path.join(out, '驾驶舱_车辆弹窗_统一样式_1920x1080.png') });
  await close();

  await open('#incident-list-trigger', '异常事件列表');
  check('incident filter below summary', await page.locator('.incident-modal-summary + .modal-filter-row').count() === 1);
  await page.locator('[data-incident-page="next"]').click();
  check('incident pagination', await page.locator('[data-incident-page="2"]').getAttribute('aria-current') === 'page');
  await page.locator('[data-incident-filter="alarm"]').click();
  check('incident category filters', await page.locator('[data-incident-filter="alarm"]').getAttribute('aria-selected') === 'true');
  await page.locator('#incident-date-from').fill('2027-01-01');
  await page.locator('#incident-date-from').dispatchEvent('change');
  check('incident empty state', await page.locator('.road-list-empty').count() === 1);
  await page.screenshot({ path: path.join(out, '驾驶舱_异常事件弹窗_统一样式_1920x1080.png') });
  await close();

  await open('#accident-list-trigger', '交通事故列表');
  check('accident filter in content', await page.locator('.modal-body > .modal-filter-row').count() === 1);
  await page.locator('[data-accident-page="next"]').click();
  check('accident pagination', await page.locator('[data-accident-page="2"]').getAttribute('aria-current') === 'page');
  await page.locator('#accident-date-from').fill('2027-01-01');
  await page.locator('#accident-date-from').dispatchEvent('change');
  check('accident empty state', await page.locator('.road-list-empty').count() === 1);
  await page.screenshot({ path: path.join(out, '驾驶舱_事故弹窗_统一样式_1920x1080.png') });
  await close();

  await page.setViewportSize({ width: 3840, height: 1080 });
  await open('#application-list-trigger', '申请列表');
  await page.screenshot({ path: path.join(out, '驾驶舱_申请弹窗_统一样式_3840x1080.png') });
  await close();
  await page.setViewportSize({ width: 1366, height: 768 });
  for (const [trigger, title] of [
    ['#application-list-trigger', '申请列表'], ['#road-list-trigger', '道路列表'],
    ['#vehicle-list-trigger', '车辆列表'], ['#incident-list-trigger', '异常事件列表'],
    ['#accident-list-trigger', '交通事故列表']
  ]) {
    await open(trigger, title);
    check(title + ' has scrollable table', await page.locator('.road-table-wrap').evaluate(el => getComputedStyle(el).overflowX === 'auto'));
    await close();
  }
  check('no browser errors', errors.length === 0, errors.join('; '));
  console.log(JSON.stringify({ verdict: 'ok', checks }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
