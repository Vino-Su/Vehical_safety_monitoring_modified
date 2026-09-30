import { chromium } from 'playwright';

const base = 'http://127.0.0.1:9188/03-%E9%AB%98%E4%BF%9D%E7%9C%9F%E9%A1%B5%E9%9D%A2/monitor/';
const cases = [
  { name: 'road-test', path: 'access-apply/road-test.html', category: 'rt' },
  { name: 'demo-apply', path: 'access-apply/demo-apply.html', category: 'da' },
  { name: 'demo-operate', path: 'access-apply/demo-operate.html', category: 'do' },
  { name: 'approve', path: 'access-approve/approve.html', category: 'rt' },
  { name: 'approve-da', path: 'access-approve/approve.html', category: 'da' },
  { name: 'approve-do', path: 'access-approve/approve.html', category: 'do' }
];
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const results = [];
for (const item of cases) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + item.path, { waitUntil: 'domcontentloaded' });
  const types = ['initial', 'change', 'renewal'];
  for (const subtype of types) {
    const target = await page.evaluate(({ category, subtype, itemName }) => {
      const record = appData.find(row => (!category || row.category == null || row.category === category) && (row.subType || row.type) === subtype);
      const detail = record && itemName !== 'approve' && itemName !== 'approve-da' && itemName !== 'approve-do' ? getDetailData(record.id) : record;
      const details = typeof roadFullData === 'undefined' ? {} : roadFullData;
      return detail ? { id: record.id, roadName: detail.roads?.[0]?.name, level: (details[detail.roads?.[0]?.name] || {}).level } : null;
    }, { category: item.category, subtype, itemName: item.name });
    if (!target) throw new Error(`${item.name}: no ${subtype} record`);
    await page.evaluate(id => openDetail(id), target.id);
    await page.waitForTimeout(250);
    const detail = await page.locator('#modal-mask .ant-modal-body').evaluate((body, name) => {
      const tables = Array.from(body.querySelectorAll('table'));
      const table = tables.find(table => Array.from(table.querySelectorAll('tbody tr')).some(row => row.textContent.includes(name)));
      if (!table) return null;
      const headings = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      const row = Array.from(table.querySelectorAll('tbody tr')).find(row => row.textContent.includes(name));
      return { headings, cells: Array.from(row.cells).map(cell => cell.textContent.trim()), text: body.textContent };
    }, target.roadName);
    results.push({ page: item.name, subtype, id: target.id, expectedLevel: target.level, headings: detail?.headings, level: detail?.cells?.[detail.headings.indexOf('道路等级')], errors: errors.filter(message => !message.includes('tailwind is not defined')) });
    if (subtype === 'initial') await page.screenshot({ path: `07-bugs/${item.name}_道路等级回显_20260930.png` });
    await page.evaluate(() => closeModal());
  }
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
if (results.some(result => (result.subtype !== 'renewal' || result.headings) && (!result.headings?.includes('路段名称') || !result.headings?.includes('道路等级') || !result.level || result.level === '城市道路' || (result.expectedLevel && result.level !== result.expectedLevel)) || result.errors.length)) process.exitCode = 1;
