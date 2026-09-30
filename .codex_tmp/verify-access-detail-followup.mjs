import { chromium } from 'playwright';

const pages = [
  ['demo-apply', 'http://127.0.0.1:8766/03-%E9%AB%98%E4%BF%9D%E7%9C%9F%E9%A1%B5%E9%9D%A2/monitor/access-apply/demo-apply.html', 'DA202604001'],
  ['demo-operate', 'http://127.0.0.1:8766/03-%E9%AB%98%E4%BF%9D%E7%9C%9F%E9%A1%B5%E9%9D%A2/monitor/access-apply/demo-operate.html', 'DO202604001']
];
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const results = {};
for (const [name, url, id] of pages) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.evaluate((applicationId) => {
    const record = window.appData.find((item) => item.id === applicationId);
    const vin = window.getDetailData(applicationId).vehicles.find((item) => item.plate !== '-').vin;
    record.plateHistory = { [vin]: [{ plate: '鄂F·A008', validFrom: '2026-05-01', validTo: '2026-10-15', status: '当前有效', photoFile: 'plate.png', photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==' }] };
  }, id);
  await page.locator(`button[onclick*="openDetail('${id}')"]`).first().click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `07-bugs/${name}-detail-offline-2026-09-30.png` });
  const body = page.locator('#modal-mask .ant-modal-body');
  const text = await body.innerText();
  const detailHeadings = await body.locator('h4').allInnerTexts();
  const detailTableHeaders = await body.locator('table').evaluateAll((tables) => tables.map((table) => Array.from(table.querySelectorAll('th')).map((th) => th.textContent.trim())));
  const detailHasPlatePhotoColumn = await body.locator('[data-plate-photo-column]').count() > 0;
  const history = body.locator('button[onclick*="PlateHistory(\'LSVAU2180N2012347\')"]').first();
  const historyCount = await history.count();
  if (historyCount) {
    await history.click();
    await page.waitForTimeout(100);
  }
  const historyBody = page.locator('#modal-mask .ant-modal-body');
  const historyText = await historyBody.innerText();
  await page.screenshot({ path: `07-bugs/${name}-plate-history-2026-09-30.png` });
  const historyHasPhotoColumn = /牌照图片/.test(historyText);
  const historyHasPhotoAction = /查看图片/.test(historyText);
  const photoButton = historyBody.getByRole('button', { name: '查看图片' }).first();
  const photoButtonCount = await photoButton.count();
  if (photoButtonCount) await photoButton.click();
  const photoPreviewOpened = photoButtonCount > 0 && (await page.locator('#modal-mask .ant-modal-body').innerText()).includes('plate.png');
  const panel = page.locator('[data-offline-material-panel]');
  results[name] = {
    detailHasOfflinePanel: await panel.count() === 1,
    historyButtonCount: historyCount,
    detailHasOriginalDeclarationRow: /原始声明/.test(text),
    detailHasPlateMaterialTable: /临时牌照材料/.test(text) && /牌照照片/.test(text),
    detailHasPlatePhotoColumn,
    historyHasPhotoColumn,
    historyHasPhotoAction,
    photoPreviewOpened,
    offlinePanelText: await panel.innerText().catch(() => ''),
    headings: detailHeadings,
    tableHeaders: detailTableHeaders
  };
  await page.close();
}
console.log(JSON.stringify(results, null, 2));
await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 3000))]);
process.exit(0);
