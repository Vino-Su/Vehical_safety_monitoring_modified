import fs from 'node:fs';

const root = '03-高保真页面/monitor/access-apply/';
function edit(file, changes) {
  let source = fs.readFileSync(file, 'utf8');
  for (const [from, to, minimum = 1] of changes) {
    const found = source.split(from).length - 1;
    if (found < minimum) throw new Error(`${file}: expected ${minimum} occurrences of ${from}, found ${found}`);
    source = source.replaceAll(from, to);
    process.stdout.write(`${file}: ${found} x ${from.slice(0, 45)}\n`);
  }
  fs.writeFileSync(file, source);
}

if (false) edit(root + 'road-test.html', [
  ['/* 准入申请统一列表列：道路/区域名称、类型、状态、操作；车辆固定列。 */', '/* 准入申请道路列表统一展示路段名称、道路等级、状态和操作。 */'],
  ["buildChangeTag('测试路段或区域'", "buildChangeTag('测试路段'"],
  ['>测试路段或区域（', '>测试路段（', 2],
  ['<th>道路/区域名称</th><th>类型</th>', '<th>路段名称</th><th>道路等级</th>'],
  ['<th>路段名称</th><th>类型</th>', '<th>路段名称</th><th>道路等级</th>'],
  ["<td>道路·'+r.type+'", "<td>'+((roadFullData[r.name]||{}).level||r.level||'-')+'"],
  ["<td>区域·'+a.type+'", "<td>'+(a.level||'-')+'"],
  ["var name=accessEscape(r.name),type=accessEscape(r.type),status=accessEscape(r.status)", "var name=accessEscape(r.name),type=accessEscape(r.type),grade=accessEscape((roadFullData[r.name]||{}).level||r.level||'-'),status=accessEscape(r.status)"],
  ["name+'</td><td>'+type+'", "name+'</td><td>'+grade+'"],
  ["/路段或区域/.test(h.textContent)", "/测试路段/.test(h.textContent)"],
  ["accessEscape(item.type) + '</td><td><span class=", "accessEscape((roadFullData[item.name]||{}).level||item.level||'-') + '</td><td><span class="],
  ["accessEscape(item.type) + '</td><td>' + accessEscape(item.status)", "accessEscape((roadFullData[item.name]||{}).level||item.level||'-') + '</td><td>' + accessEscape(item.status)"],
  ["{ label: '道路测试路段或区域'", "{ label: '道路测试路段'"]
]);

if (false) edit(root + 'demo-apply.html', [
  ['<th>路段类型</th>', '<th>道路等级</th>'],
  ['<th>路段名称</th><th>类型</th>', '<th>路段名称</th><th>道路等级</th>'],
  ["r.name+'</td><td>'+r.type+", "r.name+'</td><td>'+((roadFullData[r.name]||{}).level||r.level||'-')+"],
  ["demoAccessEscape(r.type)+'</td><td>", "demoAccessEscape((roadFullData[r.name]||{}).level||r.level||'-')+'</td><td>"],
  ["demoAccessEscape(item.type)+'</td><td>", "demoAccessEscape((roadFullData[item.name]||{}).level||item.level||'-')+'</td><td>"]
]);

if (false) edit(root + 'demo-operate.html', [
  ['<th>路段类型</th>', '<th>道路等级</th>'],
  ['<th>路段名称</th><th>类型</th>', '<th>路段名称</th><th>道路等级</th>'],
  ["r.name+'</td><td>'+r.type+", "r.name+'</td><td>'+((roadFullData[r.name]||{}).level||r.level||'-')+"],
  ["operateAccessEscape(r.type)+'</td><td>", "operateAccessEscape((roadFullData[r.name]||{}).level||r.level||'-')+'</td><td>"],
  ["operateAccessEscape(item.type)+'</td><td>", "operateAccessEscape((roadFullData[item.name]||{}).level||item.level||'-')+'</td><td>"]
]);

if (false) edit('03-高保真页面/monitor/access-approve/approve.html', [
  ["subLabel:'测试路段或区域'", "subLabel:'测试路段'"],
  ["subLabel:'示范应用路段或区域'", "subLabel:'示范应用路段'"],
  ["subLabel:'商业化试点路段或区域'", "subLabel:'商业化试点路段'"],
  ["?'测试路段或区域'", "?'测试路段'"],
  ["?'示范应用路段或区域'", "?'示范应用路段'"],
  ["'商业化试点路段或区域';}", "'商业化试点路段';}"],
  ['<th>道路/区域名称</th><th>类型</th>', '<th>路段名称</th><th>道路等级</th>'],
  ["esc(r.name)+'</td><td>'+esc(r.type)", "esc(r.name)+'</td><td>'+esc((roadFullData[r.name]||{}).level||r.level||'-')"],
  ["(d.level||type||r.direction||'-')", "(d.level||'-')"]
]);

if (false) edit(root + 'demo-apply.html', [['<th>路段状态</th>', '<th>状态</th>']]);
if (false) edit(root + 'demo-operate.html', [['<th>路段状态</th>', '<th>状态</th>']]);
if (false) edit('03-高保真页面/monitor/access-approve/approve.html', [
  ['<th>路段类型</th>', '<th>道路等级</th>'],
  ['<th>路段状态</th>', '<th>状态</th>'],
  ["r.name+'</td><td>'+r.type+", "r.name+'</td><td>'+((roadFullData[r.name]||{}).level||r.level||'-')+"]
]);

edit('03-高保真页面/monitor/access-approve/approve.html', [
  ["r.name+'</td><td>'+((roadFullData[r.name]||{}).level||r.level||'-')+", "r.name+'</td><td>'+(r.level||'-')+"]
]);
