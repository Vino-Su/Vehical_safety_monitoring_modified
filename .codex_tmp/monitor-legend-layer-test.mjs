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
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const checks = [];
const check = (name, ok, detail = '') => { checks.push({ name, ok, detail }); if (!ok) throw new Error(`${name}: ${detail}`); };

// 读取图例面板可见状态：面板是否可见 + 可见图例项文本
const legendState = () => page.evaluate(() => {
  const panel = document.getElementById('legendPanel');
  if (!panel) return null;
  const items = [...panel.querySelectorAll('[data-legend-layer]')];
  const visible = items.filter(el => getComputedStyle(el).display !== 'none');
  return {
    total: items.length,
    panelVisible: getComputedStyle(panel).display !== 'none',
    visibleCount: visible.length,
    visibleTexts: visible.map(el => el.textContent.trim()),
    groups: visible.map(el => el.dataset.legendLayer)
  };
});

// 切换图层面板中的某个开关（按行文本定位；input 被 CSS 隐藏，需点击其滑动条 label）
const toggleLayerSwitch = async (labelText) => {
  const row = page.locator('#layerPanel .layer-row').filter({ hasText: labelText }).first();
  await row.locator('.layer-slider').click();
  await page.waitForTimeout(150);
};

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/03-高保真页面/monitor/vehicle-monitor/monitor-map.html`);
  await page.waitForTimeout(2500);

  // 1. 首屏：图例共 19 项，仅默认开启的图层项可见（车辆4 + 事件2 + 道路3 = 9）
  // 注意：图层开关所在的 #layerPanel 默认收起，先展开（其 input 被 CSS 隐藏，点击其滑动条）
  let s = await legendState();
  check('legend panel initial visible', s && s.panelVisible === true, JSON.stringify(s));
  check('legend total items = 19', s.total === 19, `total=${s.total}`);
  check('initial visible items = 9', s.visibleCount === 9, `visible=${s.visibleCount} [${s.visibleTexts}]`);
  const expectInitial = ['自动驾驶模式', '人工驾驶模式', '测试中车辆', '离线车辆', '预警事件车辆', '告警事件车辆', '开放道路', '暂停道路', '关闭道路'];
  check('initial items match default layers', expectInitial.every(t => s.visibleTexts.includes(t)), JSON.stringify(s.visibleTexts));
  check('closed-layer items hidden initially', !s.visibleTexts.some(t => ['事故点位', '行驶轨迹', '电子围栏', '充电桩', '历史事故'].some(k => t.includes(k))), JSON.stringify(s.visibleTexts));

  // 展开图层面板（后续所有开关操作都在面板内）
  await page.locator('[aria-label="图层控制"]').click();
  await page.waitForTimeout(300);

  // 2. 关闭「开放道路」→ 3 项道路图例同步隐藏
  await toggleLayerSwitch('开放道路');
  s = await legendState();
  check('roads off hides 3 road items', s.visibleCount === 6 && !s.visibleTexts.includes('开放道路') && !s.visibleTexts.includes('暂停道路') && !s.visibleTexts.includes('关闭道路'), JSON.stringify(s.visibleTexts));
  await toggleLayerSwitch('开放道路');
  s = await legendState();
  check('roads on restores 3 road items', s.visibleCount === 9, JSON.stringify(s.visibleTexts));

  // 3. 开启「电子围栏」→ 4 项围栏图例同步显示
  await toggleLayerSwitch('电子围栏');
  s = await legendState();
  check('fences on shows 4 fence items', s.visibleCount === 13 && ['允许区域-开放', '允许区域-暂停', '允许区域-关闭', '禁止通行区域'].every(t => s.visibleTexts.includes(t)), JSON.stringify(s.visibleTexts));

  // 4. 开启「设施设备」→ 3 项设施图例同步显示
  await toggleLayerSwitch('设施设备');
  s = await legendState();
  check('facilities on shows 3 facility items', s.visibleCount === 16 && ['充电桩', '交通信号灯', '路侧传感器'].every(t => s.visibleTexts.some(v => v.includes(t))), JSON.stringify(s.visibleTexts));

  // 5. 开启「事故点位」「历史事故」
  await toggleLayerSwitch('事故点位');
  await toggleLayerSwitch('历史事故');
  s = await legendState();
  check('accidents + history items shown', s.visibleCount === 18 && s.visibleTexts.some(v => v.includes('事故点位')) && s.visibleTexts.some(v => v.includes('历史事故')), JSON.stringify(s.visibleTexts));

  // 6. 轨迹回放链路：showTrajectory 直写 layerVisibility.trajectory=true 也要联动图例
  await page.evaluate(() => window.showTrajectory('V001'));
  await page.waitForTimeout(1200);
  s = await legendState();
  check('trajectory replay shows trajectory item', s.visibleTexts.includes('行驶轨迹'), JSON.stringify(s.visibleTexts));
  check('trajectory item belongs to trajectory layer', s.groups[s.visibleTexts.indexOf('行驶轨迹')] === 'trajectory', JSON.stringify(s.groups));
  await page.evaluate(() => {
    const btn = document.querySelector('.traj-close');
    if (btn) btn.click();
    if (typeof clearTrajectoryLayers === 'function') clearTrajectoryLayers();
  });
  await page.waitForTimeout(300);

  // 7. 逐个关闭全部业务图层 → 图例面板整体自动隐藏
  for (const label of ['车辆实时位置', '异常事件标识', '事故点位', '行驶轨迹', '电子围栏', '开放道路', '设施设备', '历史事故']) {
    await toggleLayerSwitch(label);
  }
  s = await legendState();
  check('panel auto-hidden when no layer visible', s.panelVisible === false && s.visibleCount === 0, JSON.stringify(s));

  // 8. 重新开启任一图层 → 面板恢复且只含该图层项
  await toggleLayerSwitch('车辆实时位置');
  s = await legendState();
  check('panel restores with only vehicles items', s.panelVisible === true && s.visibleCount === 4 && s.visibleTexts.every(t => ['自动驾驶模式', '人工驾驶模式', '测试中车辆', '离线车辆'].includes(t)), JSON.stringify(s.visibleTexts));

  // 9. 图例总开关：关闭隐藏、再开启按当前图层状态恢复
  await toggleLayerSwitch('图例');
  s = await legendState();
  check('legend master switch off hides panel', s.panelVisible === false, JSON.stringify(s));
  await toggleLayerSwitch('图例');
  s = await legendState();
  check('legend master switch on restores current state', s.panelVisible === true && s.visibleCount === 4, JSON.stringify(s.visibleTexts));

  // 10. 全图层开启后图例 19 项全显，且面板不越界、不遮挡图层面板
  for (const label of ['异常事件标识', '事故点位', '行驶轨迹', '电子围栏', '开放道路', '设施设备', '历史事故']) {
    await toggleLayerSwitch(label);
  }
  s = await legendState();
  check('all 19 items visible when all layers on', s.visibleCount === 19, `visible=${s.visibleCount}`);
  const layout = await page.evaluate(() => {
    const panel = document.getElementById('legendPanel').getBoundingClientRect();
    const layerPanel = document.getElementById('layerPanel').getBoundingClientRect();
    return {
      legend: { top: panel.top, bottom: panel.bottom, left: panel.left, right: panel.right },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      overlapsLayerPanel: panel.right > layerPanel.left && panel.left < layerPanel.right && panel.bottom > layerPanel.top && panel.top < layerPanel.bottom
    };
  });
  check('legend within viewport', layout.legend.top >= 0 && layout.legend.left >= 0 && layout.legend.bottom <= layout.viewport.h, JSON.stringify(layout.legend));
  check('legend does not overlap layer panel', layout.overlapsLayerPanel === false, JSON.stringify(layout));

  await page.screenshot({ path: path.join(out, `监控一张图_图例图层联动_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.png`), fullPage: false });
  check('no js errors', errors.length === 0, errors.join(' | '));
  console.log(JSON.stringify({ verdict: 'ok', checks, errors }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ verdict: 'fail', checks, errors: [...errors, 'EXCEPTION: ' + error.message] }, null, 2));
  process.exitCode = 2;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
