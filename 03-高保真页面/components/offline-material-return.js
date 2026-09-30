(function () {
  'use strict';
  var F = window.AccessFlowModel;
  if (!F || !Array.isArray(window.appData)) return;
  var type = document.body.dataset.offlineMaterialType || '';
  if (!type) return;
  var labels = { 'demo-apply': '示范应用', 'demo-operate': '商业化试点' };
  var business = labels[type] || '道路测试';
  var registry = window.__offlineMaterialRegistry = window.__offlineMaterialRegistry || {};
  var upload = 'offline_material_upload', review = 'offline_material_review', correction = 'offline_material_correction';
  [upload, review, correction].forEach(function (stage) { F.stageMap[stage] = { label: '线下材料回传', role: stage === review ? 'third-party' : 'enterprise' }; });
  var statuses = window.statusMap || {};
  statuses.pending_offline_material = { label: '待线下材料回传', cls: 'ant-tag-warning' };
  statuses.pending_offline_material_review = { label: '待线下材料审核', cls: 'ant-tag-processing' };
  statuses.offline_material_correction = { label: '线下材料待补正', cls: 'ant-tag-warning' };

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function notify(message) { if (typeof window.showToast === 'function') window.showToast(message); else if (typeof window.showToastMsg === 'function') window.showToastMsg(message); else window.alert(message); }
  function record(id) { return window.appData.find(function (item) { return item.id === id; }); }
  function vehicles(id) {
    var raw = record(id) || {}, detail = typeof window.getDetailData === 'function' ? window.getDetailData(id) || {} : {};
    var list = raw.type === 'add_vehicle' ? raw.addVehicles || detail.addVehicles || detail.vehicles || [] : detail.vehicles || raw.vehicles || [];
    return list.filter(function (item) { return item && item.vin && item.changeStatus !== 'removed' && item.changeStatus !== 'deleted'; });
  }
  function needsMaterial(raw) { return !!raw && F.needsPlate(raw); }
  function declaration(raw) { return raw.originalDeclarationFile || business + '安全性自我声明_' + raw.id + '.pdf'; }
  function state(id) { var raw = record(id); return registry[id] || (raw && raw.offlineMaterial) || {}; }
  function plate(id, vehicle) {
    var saved = (state(id).plates || {})[vehicle.vin] || {};
    return { number: saved.plate || (vehicle.plate !== '-' ? vehicle.plate : '') || '', start: saved.plateValidFrom || vehicle.plateValidFrom || '', end: saved.plateExpiry || (vehicle.plateExpiry !== '-' ? vehicle.plateExpiry : '') || '', photo: !!saved.photo, photoName: saved.photoFile || '', photoUrl: saved.photoUrl || '' };
  }
  window.appData.forEach(function (raw) {
    if (!needsMaterial(raw)) return;
    var old = { pending_plate: upload, pending_plate_review: review, plate_rejected: correction, plate_upload: upload, plate_confirmation: review, plate_correction: correction };
    var stage = old[raw.currentStage] || old[raw.status];
    if (stage) {
      raw.currentStage = stage;
      raw.processStatus = stage === correction ? 'returning' : 'approved';
      raw.status = stage === correction ? 'offline_material_correction' : stage === review ? 'pending_offline_material_review' : 'pending_offline_material';
      raw.offlineMaterial = raw.offlineMaterial || {};
    }
  });
  var basePass = F.pass, baseReject = F.reject, baseResubmit = F.resubmit, baseProgress = F.progress, baseCanHandle = F.canHandle;
  F.pass = function (raw, opinion) {
    F.ensureRecord(raw);
    if (raw.currentStage === review) {
      raw.flowLogs.push({ eventId: 'offline_pass_' + Date.now(), eventType: 'stage_passed', stage: review, result: 'passed', handler: '第三方专业管理机构', handledAt: new Date().toLocaleString('sv-SE'), opinion: opinion || '线下材料审核通过' });
      raw.processStatus = 'active'; raw.currentStage = 'completed'; raw.status = 'active'; raw.node = 'done'; return raw;
    }
    var result = basePass(raw, opinion);
    if (raw.currentStage === 'plate_upload') { raw.currentStage = upload; raw.processStatus = 'approved'; raw.status = 'pending_offline_material'; }
    return result;
  };
  F.reject = function (raw, opinion) {
    F.ensureRecord(raw);
    if (raw.currentStage !== review) return baseReject(raw, opinion);
    raw.flowLogs.push({ eventId: 'offline_return_' + Date.now(), eventType: 'stage_returned', stage: review, result: 'returned', handler: '第三方专业管理机构', handledAt: new Date().toLocaleString('sv-SE'), opinion: opinion || '请补充线下材料', returnToStage: correction, closed: false });
    raw.returnReason = opinion || '请补充线下材料'; raw.processStatus = 'returning'; raw.currentStage = correction; raw.status = 'offline_material_correction'; return raw;
  };
  F.resubmit = function (raw) {
    F.ensureRecord(raw);
    if (raw.currentStage !== correction) return baseResubmit(raw);
    raw.flowLogs.push({ eventId: 'offline_resubmit_' + Date.now(), eventType: 'return_cycle_closed', stage: correction, result: 'resubmitted', handler: raw.company || '申请主体', handledAt: new Date().toLocaleString('sv-SE'), opinion: '线下材料补正后重新提交' });
    raw.processStatus = 'approved'; raw.currentStage = review; raw.status = 'pending_offline_material_review'; return raw;
  };
  F.progress = function (raw) {
    var steps = baseProgress(raw).filter(function (item) { return !/^牌照(上传|确认|修改)$/.test(item.label); });
    var atMaterial = [upload, review, correction].indexOf(raw.currentStage) > -1;
    if (atMaterial) steps.forEach(function (item) { item.done = true; item.current = false; item.error = false; });
    if (needsMaterial(raw)) steps.push({ label: '线下材料回传', done: raw.currentStage === 'completed', current: atMaterial, error: raw.currentStage === correction });
    return steps;
  };
  F.canHandle = function (raw, role) { if (raw && [upload, correction].indexOf(raw.currentStage) > -1 && (role || F.currentRole()) === 'admin') return false; return baseCanHandle(raw, role); };
  var baseDisplayLogs = F.displayLogs;
  F.displayLogs = function (raw) {
    var logs = baseDisplayLogs(raw);
    if ([upload, review, correction].indexOf(raw.currentStage) > -1 && logs.length) logs[logs.length - 1].handler = raw.currentStage === review ? '第三方专业管理机构' : raw.company || '申请主体';
    return logs;
  };

  function panel(raw) {
    if (!needsMaterial(raw)) return '';
    var saved = state(raw.id), list = vehicles(raw.id), count = list.filter(function (item) { return !!plate(raw.id, item).number; }).length;
    var stamped = saved.stampedDeclarationFile || (raw.currentStage === 'completed' ? '盖章版' + business + '安全性自我声明_' + raw.id + '.pdf' : '');
    var status = raw.currentStage === review ? '待第三方审核' : raw.currentStage === correction ? '待补正' : raw.currentStage === 'completed' ? '已审核通过' : '待回传';
    return '<section data-offline-material-panel class="mt-4"><h4 class="text-sm font-semibold text-[#000000d9] mb-2 pb-2 border-b border-[#f0f0f0]">线下材料回传</h4><div class="text-xs text-[#00000073] mb-2">盖章版声明基于申请时提交的安全性自我声明，仅展示本次回传版本。</div><div class="space-y-2 text-sm"><div class="flex items-center gap-2"><span class="text-xs text-[#00000040]">盖章版声明</span>' + (stamped ? '<span class="text-[#1677ff]">' + esc(stamped) + '</span><span class="ant-tag ant-tag-success">' + status + '</span>' : '<span class="text-[#ff4d4f]">未回传</span>') + '</div><div class="flex items-center gap-2"><span class="text-xs text-[#00000040]">临时牌照材料</span><span>' + count + ' / ' + list.length + ' 辆已登记</span><span class="ant-tag ' + (count === list.length ? 'ant-tag-success' : 'ant-tag-warning') + '">' + status + '</span></div></div></section>';
  }
  function historyForVin(vin) {
    var rows = [];
    window.appData.forEach(function (raw) {
      var history = raw.plateHistory && raw.plateHistory[vin];
      if (Array.isArray(history)) rows = rows.concat(history);
      var current = raw.offlineMaterial && raw.offlineMaterial.plates && raw.offlineMaterial.plates[vin];
      if (current && !rows.some(function (item) { return item.plate === current.plate && item.submittedAt === raw.offlineMaterial.submittedAt; })) {
        rows.push({ plate: current.plate, validFrom: current.plateValidFrom, validTo: current.plateExpiry, status: '当前有效', photoFile: current.photoFile, photoUrl: current.photoUrl, submittedAt: raw.offlineMaterial.submittedAt });
      }
    });
    return rows.length ? rows : [
      { plate: '鄂F·A001', validFrom: '2026-03-15', validTo: '2026-04-30', status: '已过期' },
      { plate: '鄂F·A005', validFrom: '2026-05-01', validTo: '2026-10-20', status: '当前有效' }
    ];
  }
  function photoForVin(id, vin) {
    var raw = record(id) || {}, history = raw.plateHistory && raw.plateHistory[vin];
    if (Array.isArray(history) && history.length) return history[history.length - 1];
    return (state(id).plates || {})[vin] || {};
  }
  function previewPhoto(photo) {
    var image = photo && photo.photoUrl ? '<img src="' + esc(photo.photoUrl) + '" alt="牌照照片" style="max-width:100%;max-height:260px;object-fit:contain;border:1px solid #f0f0f0;border-radius:4px">' : '<div class="flex items-center justify-center" style="height:180px;background:#fafafa;border:1px dashed #d9d9d9;border-radius:4px;color:#00000073">当前原型未留存图片实体</div>';
    window.openModal('牌照照片 - ' + esc(photo && photo.plate || ''), '<div class="text-center">' + image + '<div class="text-xs text-[#00000073] mt-3">' + esc(photo && photo.photoFile || '未留存图片') + '</div></div>', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
  }
  window.__offlineHistoryRows = [];
  window.__offlineDetailPhotos = {};
  window.openPlatePhotoPreview = previewPhoto;
  window.openPlateHistoryModal = function (vin) {
    var rows = historyForVin(vin);
    var html = '<div style="overflow-x:auto"><table class="ant-table" style="width:100%;font-size:13px"><thead><tr><th>序号</th><th>临时牌照号</th><th>有效期起</th><th>有效期止</th><th>状态</th><th>牌照图片</th></tr></thead><tbody>';
    rows.forEach(function (item, index) {
      var photo = item.photoFile || item.photoUrl ? '<button type="button" class="ant-btn-link ant-btn-sm" onclick="openPlatePhotoPreview(window.__offlineHistoryRows[' + index + '])">查看图片</button>' : '<span class="text-xs text-[#00000073]">未留存图片</span>';
      html += '<tr><td>' + (index + 1) + '</td><td class="text-xs">' + esc(item.plate) + '</td><td>' + esc(item.validFrom) + '</td><td>' + esc(item.validTo) + '</td><td><span class="ant-tag ' + (item.status === '当前有效' ? 'ant-tag-success' : 'ant-tag-default') + '">' + esc(item.status) + '</span></td><td>' + photo + '</td></tr>';
    });
    window.__offlineHistoryRows = rows;
    window.openModal('牌照历史记录 - ' + esc(vin), html + '</tbody></table></div>', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
  };
  function decorate(id) {
    var raw = record(id), body = document.querySelector('#modal-mask .ant-modal-body');
    if (!raw || !body) return;
    Array.prototype.forEach.call(body.querySelectorAll('button'), function (button) {
      if (button.textContent.trim() === '更新牌照') button.remove();
    });
    if (body.querySelector('[data-offline-material-panel]')) return;
    var progress = Array.prototype.slice.call(body.querySelectorAll('h4, .aaf-section-title')).find(function (item) { return item.textContent.trim() === '审批流程进度'; });
    if (progress) progress.insertAdjacentHTML('beforebegin', panel(raw)); else body.insertAdjacentHTML('beforeend', panel(raw));
    var vehicleHeading = Array.prototype.slice.call(body.querySelectorAll('h4')).find(function (item) { return /(?:示范应用|商业化试点)车辆/.test(item.textContent); });
    var vehicleTable = vehicleHeading && vehicleHeading.nextElementSibling && vehicleHeading.nextElementSibling.querySelector('table');
    if (vehicleTable && !vehicleTable.querySelector('[data-plate-photo-column]')) {
      var header = vehicleTable.querySelector('thead tr'), action = header && Array.prototype.slice.call(header.cells).find(function (cell) { return cell.textContent.trim() === '操作'; });
      if (header) {
        var actionIndex = action ? action.cellIndex : -1;
        var photoHeader = document.createElement('th'); photoHeader.dataset.platePhotoColumn = 'true'; photoHeader.textContent = '牌照图片';
        header.insertBefore(photoHeader, action || null);
        Array.prototype.forEach.call(vehicleTable.querySelectorAll('tbody tr'), function (row) {
          var vin = row.cells[0] && row.cells[0].textContent.trim(), photo = photoForVin(id, vin);
          var cell = document.createElement('td'); cell.dataset.platePhotoColumn = 'true';
          cell.innerHTML = photo.photoFile || photo.photoUrl ? '<button type="button" class="ant-btn-link ant-btn-sm" onclick="openPlatePhotoPreview(window.__offlineDetailPhotos[' + JSON.stringify(vin) + '])">查看图片</button>' : '<span class="text-xs text-[#00000073]">未留存图片</span>';
          window.__offlineDetailPhotos[vin] = photo;
          row.insertBefore(cell, actionIndex >= 0 ? row.cells[actionIndex] : null);
        });
      }
    }
    if ([upload, correction].indexOf(raw.currentStage) > -1) {
      var heading = Array.prototype.slice.call(body.querySelectorAll('h4')).find(function (item) { return /车辆/.test(item.textContent); });
      if (heading) { heading.classList.add('flex', 'items-center', 'justify-between', 'gap-2'); heading.insertAdjacentHTML('beforeend', '<button type="button" class="ant-btn ant-btn-primary ant-btn-sm" onclick="openOfflineMaterialUploadModal(\'' + esc(id) + '\')">线下材料回传</button>'); }
    }
  }
  function open(id) {
    var raw = record(id), list = vehicles(id), saved = state(id);
    if (!raw || !list.length || [upload, correction].indexOf(raw.currentStage) < 0) return notify('当前申请暂无待回传车辆材料');
    registry[id] = saved;
    var notice = raw.currentStage === correction ? '<div class="bg-[#fff1f0] border border-[#ffa39e] rounded-md px-3 py-2 mb-4 text-sm"><strong>线下材料补正：</strong>' + esc(raw.returnReason || '请根据审核意见补充或更换材料。') + '</div>' : '<div class="bg-[#fff7e6] border border-[#ffd591] rounded-md px-3 py-2 mb-4 text-sm">请一次提交盖章版安全性自我声明和本申请全部车辆的临时牌照信息，提交后由第三方统一审核。</div>';
    var original = '<div class="ant-form-item"><div class="ant-form-label">原始安全性自我声明</div><div class="ant-form-control text-sm text-[#1677ff]">' + esc(declaration(raw)) + ' <span class="text-xs text-[#00000073]">申请时提交，只读保留</span></div></div>';
    var declarationInput = '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>盖章版安全性自我声明</div><div class="ant-form-control"><button type="button" class="ant-btn ant-btn-sm" onclick="document.getElementById(\'offline-declaration\').click()">上传盖章版文件</button><input id="offline-declaration" type="file" class="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onchange="OfflineMaterialReturn.declarationFile(this)"><span id="offline-declaration-name" class="ml-2 text-sm text-[#1677ff]">' + esc(saved.stampedDeclarationFile || '未上传盖章版声明') + '</span><div class="text-xs text-[#00000073] mt-1">须与原始声明内容一致，仅补充盖章信息；原始声明不会被覆盖。</div></div></div>';
    var rows = list.map(function (item, index) { var p = plate(id, item); return '<tr class="offline-material-row" data-vin="' + esc(item.vin) + '"><td class="col-code text-xs">' + esc(item.vin) + '</td><td>' + esc(item.model || '-') + '</td><td><input class="ant-input offline-number" value="' + esc(p.number) + '" placeholder="如：鄂F·A001" style="width:140px"></td><td><input class="ant-input offline-start" type="date" value="' + esc(p.start) + '" style="width:125px"> 至 <input class="ant-input offline-end" type="date" value="' + esc(p.end) + '" style="width:125px"></td><td><button type="button" class="ant-btn-link ant-btn-sm" onclick="document.getElementById(\'offline-photo-' + index + '\').click()">上传</button><input id="offline-photo-' + index + '" type="file" class="hidden" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onchange="OfflineMaterialReturn.photoFile(this)"><span class="offline-photo-name text-xs text-[#1677ff]" data-uploaded="' + (p.photo ? 'true' : 'false') + '">' + esc(p.photoName || (p.photo ? '已上传' : '未上传')) + '</span></td></tr>'; }).join('');
    var table = '<h4 class="text-sm font-semibold text-[#000000d9] mb-3 mt-5 pb-2 border-b border-[#f0f0f0]">临时牌照材料</h4><div style="overflow-x:auto"><table class="ant-table" style="width:100%;font-size:13px"><thead><tr><th class="col-code">VIN码</th><th>车辆型号</th><th>临时牌照号</th><th class="col-code">有效期</th><th>牌照照片</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    window.openModal('线下材料回传 - ' + id, notice + original + declarationInput + table, { wide: true, footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="OfflineMaterialReturn.submit(\'' + esc(id) + '\')">提交第三方审核</button>' });
  }
  function submit(id) {
    var raw = record(id), saved = state(id), declarationFile = saved.stampedDeclarationFile;
    if (!raw || !declarationFile) return notify('请上传盖章版安全性自我声明');
    var rows = Array.prototype.slice.call(document.querySelectorAll('.offline-material-row')), plates = {}, seen = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i], vin = row.dataset.vin, number = row.querySelector('.offline-number').value.trim(), start = row.querySelector('.offline-start').value, end = row.querySelector('.offline-end').value;
      var photo = row.querySelector('.offline-photo-name').dataset.uploaded === 'true', old = (saved.plates || {})[vin] || {};
      if (!number || !start || !end || !photo) return notify('请完整填写全部车辆牌照信息并上传牌照照片');
      if (start >= end) return notify('有效期起须早于有效期止');
      if (!/^[\u4e00-\u9fa5][A-Z][·.][A-Z0-9]{4,6}$/.test(number)) return notify('临时牌照号格式不正确，请按“鄂F·A001”格式填写');
      if (seen[number]) return notify('同一申请内的临时牌照号不能重复');
      if (window.appData.some(function (other) { return other.id !== id && Object.keys((other.offlineMaterial || {}).plates || {}).some(function (key) { return other.offlineMaterial.plates[key].plate === number; }); })) return notify('临牌号已存在，请更换后再提交');
      seen[number] = true; plates[vin] = { plate: number, plateValidFrom: start, plateExpiry: end, photo: true, photoFile: row.querySelector('.offline-photo-name').textContent, photoUrl: old.photoUrl || '' };
    }
    raw.offlineMaterial = { originalDeclarationFile: declaration(raw), stampedDeclarationFile: declarationFile, submittedAt: new Date().toLocaleString('sv-SE'), submittedBy: raw.company || '申请主体', plates: plates };
    registry[id] = raw.offlineMaterial;
    raw.plateHistory = raw.plateHistory || {};
    Object.keys(plates).forEach(function (vin) {
      var current = plates[vin], history = raw.plateHistory[vin] = raw.plateHistory[vin] || [];
      history.forEach(function (item) { if (item.status === '当前有效') item.status = '已过期'; });
      history.push({ plate: current.plate, validFrom: current.plateValidFrom, validTo: current.plateExpiry, status: '当前有效', photoFile: current.photoFile, photoUrl: current.photoUrl, source: '线下材料回传', submittedAt: raw.offlineMaterial.submittedAt });
    });
    raw.processStatus = 'approved'; raw.currentStage = review; raw.status = 'pending_offline_material_review';
    raw.flowLogs = raw.flowLogs || []; raw.flowLogs.push({ eventId: 'offline_submit_' + Date.now(), eventType: 'offline_material_submitted', stage: upload, result: 'submitted', handler: raw.company || '申请主体', handledAt: raw.offlineMaterial.submittedAt, opinion: '盖章版声明及临时牌照材料已提交，等待第三方审核', attachment: declarationFile });
    window.closeModal(); if (typeof window.renderTable === 'function') window.renderTable(); notify('线下材料已提交，等待第三方审核');
  }
  window.OfflineMaterialReturn = {
    declarationFile: function (input) { var file = input.files && input.files[0], id = window.__offlineCurrentId; if (!file || !id) return; registry[id] = registry[id] || {}; registry[id].stampedDeclarationFile = file.name; document.getElementById('offline-declaration-name').textContent = file.name; },
    photoFile: function (input) { var file = input.files && input.files[0]; if (!file) return; if (!/\.(jpe?g|png)$/i.test(file.name)) { input.value = ''; return notify('牌照照片仅支持 JPG/PNG 格式'); } var name = input.nextElementSibling; name.textContent = file.name; name.dataset.uploaded = 'true'; var id = window.__offlineCurrentId, vin = input.closest('tr').dataset.vin; registry[id] = registry[id] || {}; registry[id].plates = registry[id].plates || {}; registry[id].plates[vin] = Object.assign({}, registry[id].plates[vin] || {}, { photo: true, photoFile: file.name, photoUrl: URL.createObjectURL(file) }); },
    submit: submit,
    preview: function (id, vin) { var file = ((state(id).plates || {})[vin] || {}); if (!file.photoUrl) return notify('存量图片未留存'); window.openModal('牌照照片 - ' + vin, '<img src="' + esc(file.photoUrl) + '" alt="牌照照片" style="max-width:100%;display:block;margin:auto">', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' }); }
  };
  window.openOfflineMaterialUploadModal = function (id) { window.__offlineCurrentId = id; open(id); };
  var oldOps = window.getOps;
  window.getOps = function (raw) { var html = oldOps(raw).replace(/<button[^>]*>(登记临时牌照|修改牌照|上传牌照)<\/button>/g, ''); if ([upload, correction].indexOf(raw.currentStage) > -1) html += '<button class="ant-btn-link whitespace-nowrap" onclick="openOfflineMaterialUploadModal(\'' + esc(raw.id) + '\')">线下材料回传</button>'; return html; };
  var oldDetail = window.openDetail;
  window.openDetail = function (id) { var result = oldDetail.apply(this, arguments); window.setTimeout(function () { decorate(id); }, 150); return result; };
  var oldPreview = window.updateFlowPreview;
  if (typeof oldPreview === 'function') window.updateFlowPreview = function () { oldPreview.apply(this, arguments); var target = document.getElementById('flowPreview'); if (target) target.innerHTML = target.innerHTML.replace(/上传临时牌照/g, '线下材料回传'); };
  function syncFilters() {
    var filter = document.getElementById('flowStageFilter');
    if (filter) {
      Array.prototype.slice.call(filter.options).forEach(function (option) { if (/^plate_|^offline_material_/.test(option.value)) option.remove(); });
      filter.add(new Option('线下材料回传', upload));
      filter.add(new Option('线下材料审核', review));
      filter.add(new Option('线下材料补正', correction));
    }
    var statusPanel = document.getElementById('msStatusPanel');
    if (statusPanel && !statusPanel.querySelector('input[value="pending_offline_material"]')) {
      Array.prototype.slice.call(statusPanel.querySelectorAll('input[value="pending_plate"],input[value="pending_plate_review"],input[value="plate_rejected"]')).forEach(function (input) { input.parentElement.remove(); });
      statusPanel.insertAdjacentHTML('beforeend', '<label><input type="checkbox" value="pending_offline_material">待线下材料回传</label><label><input type="checkbox" value="pending_offline_material_review">待线下材料审核</label><label><input type="checkbox" value="offline_material_correction">线下材料待补正</label>');
    }
    if (typeof window.renderTable === 'function') window.renderTable();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncFilters); else syncFilters();
})();
