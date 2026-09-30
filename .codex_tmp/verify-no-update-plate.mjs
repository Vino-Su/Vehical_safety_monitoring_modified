import { chromium } from 'playwright';

const root = 'http://127.0.0.1:8766/03-%E9%AB%98%E4%BF%9D%E7%9C%9F%E9%A1%B5%E9%9D%A2/monitor/access-apply/';
const cases = [
  ['demo-apply.html', 'DA202604007', '示范应用'],
  ['demo-operate.html', 'DO202604007', '商业化试点']
];
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const results = [];
for (const [file, id, label] of cases) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(root + file, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.locator(`button[onclick*="openDetail('${id}')"]`).first().click();
  await page.waitForTimeout(400);
  const body = page.locator('#modal-mask .ant-modal-body');
  const result = {
    label,
    detailOpen: await body.count() === 1,
    updatePlateButtons: await body.getByRole('button', { name: '更新牌照', exact: true }).count(),
    historyButtons: await body.getByRole('button', { name: /历史牌照|查看历史/ }).count(),
    platePhotoColumn: await body.locator('[data-plate-photo-column]').count() > 0
  };
  await page.screenshot({ path: `07-bugs/${file.replace('.html', '')}-no-update-plate-2026-09-30.png` });
  results.push(result);
  await page.close();
}
console.log(JSON.stringify(results, null, 2));
await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 3000))]);
process.exit(results.every((item) => item.detailOpen && item.updatePlateButtons === 0 && item.historyButtons > 0 && item.platePhotoColumn) ? 0 : 1);
