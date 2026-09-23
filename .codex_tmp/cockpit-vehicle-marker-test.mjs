import { createRequire } from 'node:module';

const require = createRequire('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  if (!ok) throw new Error(`${name}: ${detail}`);
};

try {
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 3840, height: 1080 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:9188/03-高保真页面/cockpit/index.html');
    await page.locator('.map-cluster-icon').first().click();
    await page.locator('.vehicle-dot').first().waitFor();
    check(`${viewport.width} dot layer`, await page.locator('.vehicle-car').count() === 0 && await page.locator('.vehicle-dot').count() > 0);
    await page.locator('.vehicle-dot').first().click();
    const popup = page.locator('.cockpit-vehicle-popup');
    await popup.waitFor();
    check(`${viewport.width} popup fields`, JSON.stringify(await popup.locator('.cockpit-popup-grid span').allTextContents()) === JSON.stringify(['车辆状态', '驾驶模式', '实时速度', '加速度', '档位', '最后上报时间']));
    check(`${viewport.width} title`, /^鄂F·A001-.+/.test(await popup.locator('.cockpit-popup-head strong').textContent()));
    check(`${viewport.width} data`, (await popup.locator('.cockpit-popup-grid').textContent()).includes('km/h') && (await popup.locator('.cockpit-popup-grid').textContent()).includes('m/s²'));
    check(`${viewport.width} actions`, await popup.locator('.cockpit-popup-action').count() === 2);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `07-bugs/驾驶舱_车辆信息弹窗_${viewport.width}x1080.png` });
    for (let step = 0; step < 4 && await page.locator('.vehicle-car').count() === 0; step++) {
      await page.locator('.leaflet-control-zoom-in').click();
      await page.waitForTimeout(500);
    }
    await page.locator('.vehicle-car .vehicle-car-svg').first().waitFor();
    check(`${viewport.width} svg layer`, await page.locator('.vehicle-dot').count() === 0 && await page.locator('.vehicle-car-svg path').count() > 0);
    await page.screenshot({ path: `07-bugs/驾驶舱_车辆车形图标_${viewport.width}x1080.png` });
    const visibleCar = await page.locator('.vehicle-car').evaluateAll(markers => {
      const map = document.querySelector('#cockpit-map').getBoundingClientRect();
      return markers.findIndex(marker => {
        const rect = marker.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return x > map.left && x < map.right && y > map.top && y < map.bottom && marker === document.elementFromPoint(x, y)?.closest('.vehicle-car');
      });
    });
    check(`${viewport.width} visible car`, visibleCar >= 0, String(visibleCar));
    await page.locator('.vehicle-car').nth(visibleCar).click();
    await page.locator('.cockpit-vehicle-popup').waitFor();
    await page.locator('.leaflet-control-zoom-out').click();
    await page.locator('.vehicle-dot').first().waitFor();
    check(`${viewport.width} reversible`, await page.locator('.vehicle-car').count() === 0);
    check(`${viewport.width} no script errors`, errors.length === 0, errors.join('; '));
    await page.close();
  }
  console.log(JSON.stringify({ verdict: 'ok', checks }, null, 2));
} finally {
  await browser.close();
}
