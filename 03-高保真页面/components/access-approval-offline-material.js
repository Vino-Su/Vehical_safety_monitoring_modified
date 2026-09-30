(function () {
  'use strict';
  var F = window.AccessFlowModel;
  if (!F || !Array.isArray(window.appData)) return;

  var upload = 'offline_material_upload';
  var review = 'offline_material_review';
  var correction = 'offline_material_correction';
  var oldStages = { plate_upload: upload, plate_confirmation: review, plate_correction: correction };
  var historyRows = [];
  var photoRows = [];
  [upload, review, correction].forEach(function (stage) {
    F.stageMap[stage] = { label: '线下材料回传', role: stage === review ? 'third-party' : 'enterprise' };
  });
  var style = document.createElement('style');
  style.textContent = '[data-approval-offline-material]{margin-top:16px;font-size:14px;color:#000000d9}' +
    '[data-approval-offline-material] h4{margin:0 0 8px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600}' +
    '[data-approval-offline-material] h4:not(:first-child){margin-top:16px}' +
    '.approval-offline-note{margin-bottom:8px;color:#00000073;font-size:12px}' +
    '.approval-offline-fields{display:grid;gap:8px}' +
    '.approval-offline-field{display:flex;align-items:center;flex-wrap:wrap;gap:8px}' +
    '.approval-offline-label{min-width:88px;color:#00000073;font-size:12px}' +
    '.approval-offline-file{color:#1677ff;overflow-wrap:anywhere}';
  document.head.appendChild(style);

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function business(record) {
    return record.category === 'rt' ? '道路测试' : record.category === 'da' ? '示范应用' : '商业化试点';
  }
  function material(record) {
    return record.offlineMaterial || {};
  }
  function vehicles(record) {
    return (record.vehicles || []).filter(function (vehicle) {
      return vehicle && vehicle.vin && vehicle.changeStatus !== 'removed' && vehicle.changeStatus !== 'deleted';
    });
  }
  function plate(record, vehicle) {
    var saved = (material(record).plates || {})[vehicle.vin] || {};
    return {
      plate: saved.plate || (vehicle.plate !== '-' ? vehicle.plate : '') || '',
      validFrom: saved.plateValidFrom || vehicle.plateValidFrom || '',
      validTo: saved.plateExpiry || (vehicle.plateExpiry !== '-' ? vehicle.plateExpiry : '') || '',
      photoFile: saved.photoFile || vehicle.platePhotoFile || '',
      photoUrl: saved.photoUrl || vehicle.platePhotoUrl || ''
    };
  }
  function needsMaterial(record) { return F.needsPlate(record); }
  function statusText(record) {
    if (record.currentStage === review) return '待第三方审核';
    if (record.currentStage === correction) return '待补正';
    if (record.currentStage === 'completed') return '已审核通过';
    return '待回传';
  }
  function photoCell(item) {
    if (!item.photoFile && !item.photoUrl) return '<span class="text-xs text-[#00000073]">未留存图片</span>';
    var index = photoRows.push(item) - 1;
    return '<button type="button" class="ant-btn-link ant-btn-sm" onclick="openApprovalPlatePhotoPreview(' + index + ')">查看图片</button>';
  }
  window.approvalPlatePhotoCell = function (record, vehicle) { return photoCell(plate(record, vehicle)); };
  function panel(record) {
    if (!needsMaterial(record)) return '';
    var saved = material(record), list = vehicles(record), count = list.filter(function (vehicle) { return !!plate(record, vehicle).plate; }).length;
    var stamped = saved.stampedDeclarationFile || (record.currentStage === 'completed' ? '盖章版' + business(record) + '安全性自我声明_' + record.id + '.pdf' : '');
    var status = statusText(record);
    var html = '<section data-approval-offline-material><h4>线下材料回传</h4>';
    html += '<div class="approval-offline-note">盖章版声明基于申请时提交的安全性自我声明，仅展示本次回传版本。</div>';
    html += '<div class="approval-offline-fields"><div class="approval-offline-field"><span class="approval-offline-label">盖章版声明</span>';
    html += stamped ? '<span class="approval-offline-file">' + esc(stamped) + '</span><span class="ant-tag ant-tag-success">' + status + '</span>' : '<span class="text-[#ff4d4f]">未回传</span>';
    html += '</div><div class="approval-offline-field"><span class="approval-offline-label">临时牌照材料</span><span>' + count + ' / ' + list.length + ' 辆已登记</span><span class="ant-tag ' + (count === list.length ? 'ant-tag-success' : 'ant-tag-warning') + '">' + status + '</span></div></div>';
    if (record.currentStage === review) {
      html += '<h4>本次回传车辆材料</h4><div style="overflow-x:auto"><table class="ant-table" style="width:100%;font-size:13px"><thead><tr><th>VIN码</th><th>型号</th><th>临时牌照号</th><th>有效期起</th><th>有效期止</th><th>牌照图片</th></tr></thead><tbody>';
      list.forEach(function (vehicle) {
        var item = plate(record, vehicle);
        html += '<tr><td class="col-code text-xs">' + esc(vehicle.vin) + '</td><td>' + esc(vehicle.model || '-') + '</td><td class="col-code">' + esc(item.plate || '-') + '</td><td class="col-code">' + esc(item.validFrom || '-') + '</td><td class="col-code">' + esc(item.validTo || '-') + '</td><td>' + photoCell(item) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    return html + '</section>';
  }
  function history(vin) {
    var rows = [], seen = {};
    var selected = window.currentApproveData || {};
    var selectedVehicle = vehicles(selected).find(function (item) { return item.vin === vin; });
    var selectedPlate = selectedVehicle ? plate(selected, selectedVehicle).plate : '';
    window.appData.forEach(function (record) {
      if (selected.category && record.category !== selected.category) return;
      var stored = record.plateHistory && record.plateHistory[vin];
      if (Array.isArray(stored)) stored.forEach(function (item) {
        var key = [item.plate, item.validFrom, item.validTo].join('|');
        if (!seen[key]) { seen[key] = true; rows.push(item); }
      });
      var vehicle = vehicles(record).find(function (item) { return item.vin === vin; });
      if (!vehicle) return;
      var current = plate(record, vehicle);
      if (!current.plate) return;
      var key = [current.plate, current.validFrom, current.validTo].join('|');
      if (!seen[key]) {
        seen[key] = true;
        rows.push({ plate: current.plate, validFrom: current.validFrom, validTo: current.validTo, status: current.plate === selectedPlate ? statusText(selected) : '历史记录', photoFile: current.photoFile, photoUrl: current.photoUrl, submittedAt: material(record).submittedAt });
      }
    });
    rows.forEach(function (item) {
      if (item.plate === selectedPlate && !item.status) item.status = statusText(selected);
    });
    return rows;
  }
  window.openApprovalPlatePhotoPreview = function (index) {
    var item = photoRows[index] || {}, image = item.photoUrl
      ? '<img src="' + esc(item.photoUrl) + '" alt="牌照照片" style="max-width:100%;max-height:260px;object-fit:contain;border:1px solid #f0f0f0;border-radius:4px">'
      : '<div class="flex items-center justify-center" style="height:180px;background:#fafafa;border:1px dashed #d9d9d9;border-radius:4px;color:#00000073">当前原型未留存图片实体</div>';
    window.openModal('牌照照片 - ' + esc(item.plate || ''), '<div class="text-center">' + image + '<div class="text-xs text-[#00000073] mt-3">' + esc(item.photoFile || '未留存图片') + '</div></div>', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
  };
  window.openApprovalPlateHistory = function (vin) {
    historyRows = history(vin);
    var html = '<div style="overflow-x:auto"><table class="ant-table" style="width:100%;font-size:13px"><thead><tr><th>序号</th><th>临时牌照号</th><th>有效期起</th><th>有效期止</th><th>状态</th><th>牌照图片</th></tr></thead><tbody>';
    if (!historyRows.length) html += '<tr><td colspan="6" class="text-center text-[#00000073]">暂无历史牌照记录</td></tr>';
    historyRows.forEach(function (item, index) {
      var image = item.photoFile || item.photoUrl ? '<button type="button" class="ant-btn-link ant-btn-sm" onclick="openApprovalPlatePhotoPreviewFromHistory(' + index + ')">查看图片</button>' : '<span class="text-xs text-[#00000073]">未留存图片</span>';
      html += '<tr><td>' + (index + 1) + '</td><td class="text-xs">' + esc(item.plate || '-') + '</td><td>' + esc(item.validFrom || '-') + '</td><td>' + esc(item.validTo || '-') + '</td><td><span class="ant-tag ' + (item.status === '当前有效' || item.status === '已审核通过' ? 'ant-tag-success' : 'ant-tag-default') + '">' + esc(item.status || '历史记录') + '</span></td><td>' + image + '</td></tr>';
    });
    window.openModal('牌照历史记录 - ' + esc(vin), html + '</tbody></table></div>', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
  };
  window.openApprovalPlatePhotoPreviewFromHistory = function (index) {
    photoRows.push(historyRows[index]);
    window.openApprovalPlatePhotoPreview(photoRows.length - 1);
  };

  window.appData.forEach(function (record) {
    F.ensureRecord(record);
    var stage = oldStages[record.currentStage];
    if (!stage) return;
    record.currentStage = stage;
    record.processStatus = stage === correction ? 'returning' : 'approved';
    record.status = stage === correction ? 'offline_material_correction' : stage === review ? 'pending_offline_material_review' : 'pending_offline_material';
    record.offlineMaterial = record.offlineMaterial || {};
    if (stage === review && !record.offlineMaterial.stampedDeclarationFile) record.offlineMaterial.stampedDeclarationFile = '盖章版' + business(record) + '安全性自我声明_' + record.id + '.pdf';
  });

  var basePass = F.pass, baseReject = F.reject, baseProgress = F.progress, baseCanHandle = F.canHandle, baseLogs = F.displayLogs;
  F.pass = function (record, opinion) {
    if (record.currentStage === review) {
      record.flowLogs.push({ eventId: 'offline_pass_' + Date.now(), eventType: 'stage_passed', stage: review, result: 'passed', handler: '第三方专业管理机构', handledAt: new Date().toLocaleString('sv-SE'), opinion: opinion });
      record.currentStage = 'completed'; record.processStatus = 'active'; record.status = 'active'; record.node = 'done';
      return record;
    }
    var result = basePass(record, opinion);
    if (record.currentStage === 'plate_upload') {
      record.currentStage = upload; record.processStatus = 'approved'; record.status = 'pending_offline_material';
      record.offlineMaterial = record.offlineMaterial || {};
    }
    return result;
  };
  F.reject = function (record, opinion) {
    if (record.currentStage !== review) return baseReject(record, opinion);
    record.flowLogs.push({ eventId: 'offline_return_' + Date.now(), eventType: 'stage_returned', stage: review, result: 'returned', handler: '第三方专业管理机构', handledAt: new Date().toLocaleString('sv-SE'), opinion: opinion, returnToStage: correction, closed: false });
    record.returnReason = opinion; record.currentStage = correction; record.processStatus = 'returning'; record.status = 'offline_material_correction';
    return record;
  };
  F.progress = function (record) {
    var steps = baseProgress(record).filter(function (item) { return !/^牌照(上传|确认|修改)$/.test(item.label); });
    if (!needsMaterial(record)) return steps;
    var active = [upload, review, correction].indexOf(record.currentStage) > -1;
    if (active) steps.forEach(function (item) { item.done = true; item.current = false; item.error = false; });
    steps.push({ label: '线下材料回传', done: record.currentStage === 'completed', current: active, error: record.currentStage === correction });
    return steps;
  };
  F.canHandle = function (record, role) {
    if ([upload, correction].indexOf(record.currentStage) > -1) return false;
    if (record.currentStage === review) return ['admin', 'third-party'].indexOf(role || F.currentRole()) > -1;
    return baseCanHandle(record, role);
  };
  F.displayLogs = function (record) {
    return baseLogs(record).map(function (item) {
      if (/^牌照(上传|确认|修改)$/.test(item.title)) item.title = '线下材料回传';
      if (item.status === '处理中' && [upload, review, correction].indexOf(record.currentStage) > -1) item.handler = record.currentStage === review ? '第三方专业管理机构' : record.company || '申请主体';
      return item;
    });
  };

  var baseDetail = window.buildApprovalDetail;
  window.buildApprovalDetail = function (record) {
    var html = baseDetail(record);
    return html.replace(/(<h4[^>]*>审批流程进度<\/h4>)/, panel(record) + '$1');
  };
  var baseOpenApprove = window.openApprove;
  window.openApprove = function (id) {
    var record = window.appData.find(function (item) { return item.id === id; });
    if (!record || record.currentStage !== review) return baseOpenApprove.apply(this, arguments);
    if (!F.canHandle(record)) return window.openDetail(id);
    window.currentApproveData = record;
    var body = window.buildApprovalDetail(record);
    var footer = '<div class="approval-footer-content"><div class="approval-context"><span>当前节点：<strong class="current-node">线下材料审核</strong></span><span class="text-[#d9d9d9]">|</span><span>审批人：<strong>第三方专业管理机构</strong></span></div><div class="approval-opinion"><label for="approveOpinion">审核意见 <span class="text-[#ff4d4f]">*</span></label><textarea id="approveOpinion" class="ant-input text-sm" placeholder="请填写线下材料审核意见（通过/退回均必填）"></textarea></div><div class="approval-actions"><button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-danger" onclick="approveAction(\'reject\')">退回</button><button class="ant-btn ant-btn-primary" onclick="approveAction(\'pass\')">通过</button></div></div>';
    window.openModal('线下材料审核 - ' + esc(id), body, { wide: true, fullscreen: true, footer: footer, footerClass: 'approval-footer', onOpen: function () {
      Array.prototype.forEach.call(document.querySelectorAll('#modal-mask .aaf-version-title-btn'), function (button) { button.remove(); });
      if (typeof window.attachApproveVersionButton === 'function') window.attachApproveVersionButton(id);
    } });
    var detail = document.querySelector('#modal-mask .ant-modal-body');
    if (detail) detail.insertAdjacentHTML('afterbegin', '<div class="access-flow-summary"><span class="access-flow-summary-label">流程状态</span><span class="ant-tag ant-tag-success">已通过</span><span class="access-flow-summary-label">当前环节</span><span class="ant-tag ant-tag-processing">线下材料回传</span><span class="access-flow-summary-owner">当前处理方：<strong>第三方专业管理机构</strong></span></div>');
  };

  function syncFilters() {
    var stageFilter = document.getElementById('flowStageFilter');
    if (stageFilter) {
      Array.prototype.forEach.call(stageFilter.options, function (option) { if (/^plate_|^offline_material_/.test(option.value)) option.remove(); });
      stageFilter.add(new Option('线下材料回传', upload));
      stageFilter.add(new Option('线下材料审核', review));
      stageFilter.add(new Option('线下材料补正', correction));
    }
    if (typeof window.renderTable === 'function') window.renderTable();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncFilters); else syncFilters();
})();
