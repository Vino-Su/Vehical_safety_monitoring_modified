const fs = require('fs');
const path = require('path');

function readFile(relPath) {
  return fs.readFileSync(path.join(__dirname, relPath), 'utf8');
}

function writeFile(relPath, content) {
  fs.writeFileSync(path.join(__dirname, relPath), content, 'utf8');
  console.log('OK:', relPath);
}

// Use the same path prefix for both read and write
const P = '03-高保真页面';

// ============ R10: control.html ============
let c1 = readFile(P + '/road/catalog/control.html');

// R10: Fix warning logic - check actual process count
c1 = c1.replace(
  "var hasTasks=action==='暂停'||action==='关闭';",
  "var hasTasks=(action==='暂停'||action==='关闭')&&(typeof processCount!=='undefined'?processCount>0:false);"
);

// R10: Update openStatusModal signature
c1 = c1.replace(
  'function openStatusModal(action){',
  'function openStatusModal(action, processCount){'
);

// R09: Update openAccessConfig signature
c1 = c1.replace(
  'function openAccessConfig(){',
  'function openAccessConfig(roadName){'
);

// R09: Add road name to dialog title
c1 = c1.replace(
  "openModal('差异化准入配置',",
  "openModal('差异化准入配置' + (roadName ? ' - ' + roadName : ''),"
);

writeFile(P + '/road/catalog/control.html', c1);

// ============ R11+R12: result.html ============
let r1 = readFile(P + '/road/evaluation/result.html');

// R11: Custom tag colors
r1 = r1.replace(
  "'条件开放':'ant-tag-warning','限制开放':'ant-tag-error'",
  "'条件开放':'ant-tag-custom-warning','限制开放':'ant-tag-custom-danger'"
);

// R11: Add custom CSS for new tag colors
const css = '\n    .ant-tag-custom-warning{color:#fa8c16 !important;background:#fff7e6 !important;border-color:#ffd591 !important}\n    .ant-tag-custom-danger{color:#ff7a45 !important;background:#fff2e8 !important;border-color:#ffbb96 !important}';
if (!r1.includes('ant-tag-custom-warning')) {
  r1 = r1.replace('</style>', css + '\n</style>');
}

// R12: Add onclick to button
r1 = r1.replace(
  '<button class="ant-btn ant-btn-primary">+ 手动发起评估</button>',
  '<button class="ant-btn ant-btn-primary" onclick="showToast(\'已发起评估请求，评估完成后将自动刷新列表\')">+ 手动发起评估</button>'
);

writeFile(P + '/road/evaluation/result.html', r1);

// ============ R14+R15: log.html ============
let l1 = readFile(P + '/road/evaluation/log.html');

// R14: Fix detail modal score color
l1 = l1.replace(
  "l.score >= 85 ? '#52c41a' : l.score >= 70 ? '#fa8c16' : '#ff4d4f'",
  "l.score >= 85 ? '#52c41a' : l.score >= 70 ? '#fa8c16' : l.score >= 50 ? '#1677ff' : '#ff4d4f'"
);

// R15: Change detail modal width
l1 = l1.replace(
  "{ wide: true, footer: '<button class=\"ant-btn\" onclick=\"closeModal()\">关闭</button>' });",
  "{ width:700, footer: '<button class=\"ant-btn\" onclick=\"closeModal()\">关闭</button>' });"
);

writeFile(P + '/road/evaluation/log.html', l1);

console.log('All fixes applied!');
