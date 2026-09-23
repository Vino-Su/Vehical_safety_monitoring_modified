import { createRequire } from 'node:module';

const require = createRequire('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  if (!ok) throw new Error(`${name}: ${detail}`);
};

try {
  for (const width of [1920, 3840]) {
    const page = await browser.newPage({ viewport: { width, height: 1080 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:9188/03-高保真页面/cockpit/index.html');
    await page.locator('.map-cluster-icon').first().click();
    await page.locator('.vehicle-dot').first().click();
    const popup = page.locator('.cockpit-vehicle-popup:visible').last();
    await popup.waitFor();
    check(`${width} default tab`, await popup.locator('[data-popup-tab="realtime"]').getAttribute('aria-selected') === 'true');
    check(`${width} summary`, (await popup.locator('.cockpit-popup-events').textContent()).includes('预警 1 · 告警 1'));
    await popup.locator('[data-popup-tab="events"]').click();
    check(`${width} event count`, await popup.locator('.cockpit-popup-event').count() === 2);
    check(`${width} event details`, (await popup.locator('[data-popup-pane="events"]').textContent()).includes('触发规则：') && (await popup.locator('[data-popup-pane="events"]').textContent()).includes('状态：'));
    check(`${width} tab state`, await popup.locator('[data-popup-pane="realtime"]').isHidden() && await popup.locator('[data-popup-pane="events"]').isVisible());
    await page.waitForTimeout(500);
    const popupBounds = await popup.boundingBox();
    const mapBounds = await page.locator('#cockpit-map').boundingBox();
    check(`${width} popup visible`, popupBounds.y >= mapBounds.y && popupBounds.y + popupBounds.height <= mapBounds.y + mapBounds.height, JSON.stringify({ popupBounds, mapBounds }));
    await page.screenshot({ path: `07-bugs/驾驶舱_车辆详情异常事件_${width}x1080_20260923.png` });
    await popup.locator('[data-popup-tab="events"]').press('ArrowLeft');
    check(`${width} keyboard tab`, await popup.locator('[data-popup-tab="realtime"]').getAttribute('aria-selected') === 'true');
    await popup.locator('[data-popup-action="video"]').click();
    check(`${width} video action`, await page.locator('#cockpit-video-panel').getAttribute('aria-hidden') === 'false');
    await page.locator('#cockpit-video-close').click();

    await page.locator('#incident-module .module-heading h2').first().click();
    await page.locator('.incident-vehicle-marker').first().click();
    await popup.waitFor();
    const badge = Number(await page.locator('.incident-vehicle-marker b').first().textContent());
    await popup.locator('[data-popup-tab="events"]').click();
    check(`${width} incident marker count`, await popup.locator('.cockpit-popup-event').count() === badge, String(badge));

    await page.locator('#vehicle-list-trigger').click();
    await page.locator('[data-vehicle-search]').fill('鄂F·A001');
    await page.locator('[data-vehicle-locate="鄂F·A001"]').click();
    await popup.waitFor();
    check(`${width} list locate detail`, await popup.locator('[data-popup-tab="events"]').count() === 1);

    await page.locator('#vehicle-list-trigger').click();
    await page.locator('[data-vehicle-search]').fill('DA202605004');
    await page.locator('[data-vehicle-locate="DA202605004"]').click();
    await page.locator('.cockpit-vehicle-popup .cockpit-popup-head strong', { hasText: 'DA202605004' }).waitFor();
    await popup.locator('[data-popup-tab="events"]').click();
    check(`${width} unmapped empty`, await popup.locator('.cockpit-popup-empty').isVisible());
    check(`${width} unmapped actions`, await popup.locator('[data-popup-action]:disabled').count() === 2);
    check(`${width} no script errors`, errors.length === 0, errors.join('; '));
    await page.close();
  }
  console.log(JSON.stringify({ verdict: 'ok', checks }, null, 2));
} finally {
  await browser.close();
}
