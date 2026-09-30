import { chromium } from 'playwright';

const base = 'http://127.0.0.1:9188/03-%E9%AB%98%E4%BF%9D%E7%9C%9F%E9%A1%B5%E9%9D%A2/monitor/access-apply/';
const cases = [
  { name: 'road-test', title: '选择测试路段', checkbox: '.road-sel-cb' },
  { name: 'demo-apply', title: '选择示范应用路段', checkbox: '.road-cb' },
  { name: 'demo-operate', title: '选择商业化试点路段', checkbox: '.road-cb' }
];
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const results = [];

for (const item of cases) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(base + item.name + '.html', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /新增申请/ }).first().click();
  await page.locator('#modal-mask #applyScene, #modal-mask #demoApplyScene, #modal-mask #operateScene').first().selectOption('无人物流');
  await page.locator('#modal-mask button[onclick="openRoadSelectModal()"]').first().click();
  const modal = page.locator('#modal-mask');
  const heading = await modal.locator('.ant-modal-header h3').first().innerText();
  const columns = await modal.locator('thead th').allInnerTexts();
  const firstRoad = await modal.locator('tbody tr').first().locator('td').nth(1).innerText();
  const hasAreaTab = await modal.locator('#areaTabBtn').count() > 0;
  const hasAreaOption = /测试区域|示范应用区域|试点区域/.test(await modal.locator('#roadSelectBody').innerText());
  const roadRows = await modal.locator('#roadSelectBody tr').count();
  const allRowsOpen = await modal.locator('#roadSelectBody tr').evaluateAll((rows) => rows.every((row) => window.roadData[Number(row.querySelector('input').dataset.idx)].status === '开放'));
  const checkbox = modal.locator(item.checkbox).first();
  await checkbox.check();
  await page.screenshot({ path: `07-bugs/${item.name}_路段选择_20260930.png` });
  await modal.getByRole('button', { name: '确认选择' }).click();
  const selectedText = await page.locator('#roadTableBody').innerText();
  const selectedLevel = await page.locator('#roadTableBody tr:first-child td:nth-child(2)').innerText();
  const expectedLevel = await page.evaluate(name => roadFullData[name].level, firstRoad);
  const state = await page.evaluate(() => ({ roads: selectedRoads.length, areas: typeof selectedAreas === 'undefined' ? null : selectedAreas.length }));
  await page.locator('#modal-mask #applyScene, #modal-mask #demoApplyScene, #modal-mask #operateScene').first().selectOption('');
  await page.locator('#modal-mask button[onclick="openRoadSelectModal()"]').first().click();
  await page.locator('#roadSelectBody tr').first().waitFor();
  const openRoadCount = await page.locator('#roadSelectBody tr').count();
  const expectedOpenRoadCount = await page.evaluate(() => roadData.filter(road => road.status === '开放' && /^RD/.test((roadFullData[road.name] || {}).code || '')).length);
  const completeFields = await page.locator('#roadSelectBody tr').evaluateAll(rows => rows.every(row => Array.from(row.cells).slice(1).every(cell => cell.textContent.trim() && cell.textContent.trim() !== '—')));
  const preservedSelection = await page.locator(item.checkbox + '[data-idx="0"]').isChecked();
  await page.locator('#roadSearchInput').fill('不存在的道路');
  const emptySearch = await page.locator('#roadSelectEmpty').isVisible();
  await page.locator('#roadSearchInput').fill(firstRoad);
  const matchingSearch = await page.locator('#roadSelectBody tr:visible').count() === 1;
  const result = {
    page: item.name,
    heading,
    columns,
    firstRoad,
    roadRows,
    allRowsOpen,
    openRoadCount,
    expectedOpenRoadCount,
    completeFields,
    preservedSelection,
    emptySearch,
    matchingSearch,
    hasAreaTab,
    hasAreaOption,
    selected: selectedText.includes(firstRoad),
    selectedLevel,
    expectedLevel,
    ...state,
    pageErrors: pageErrors.filter(message => !message.includes('tailwind is not defined'))
  };
  results.push(result);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
const expectedColumns = ['', '道路名称', '道路等级', '开放时段', '适用应用场景', '适用业务类型'];
if (results.some(result => result.heading !== cases.find(item => item.name === result.page).title || JSON.stringify(result.columns) !== JSON.stringify(expectedColumns) || !result.roadRows || !result.allRowsOpen || result.openRoadCount !== result.expectedOpenRoadCount || !result.completeFields || !result.preservedSelection || !result.emptySearch || !result.matchingSearch || result.hasAreaTab || result.hasAreaOption || !result.selected || result.selectedLevel !== result.expectedLevel || result.roads !== 1 || (result.areas !== null && result.areas !== 0) || result.pageErrors.length)) process.exitCode = 1;
