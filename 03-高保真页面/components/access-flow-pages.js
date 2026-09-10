(function () {
  'use strict';
  var F = window.AccessFlowModel;
  if (!F || !Array.isArray(window.appData)) return;

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function tag(info) { return '<span class="ant-tag ' + info.cls + '">' + esc(info.label) + '</span>'; }
  function optionHtml(map) { return '<option value="all">全部</option>' + Object.keys(map).map(function (key) { return '<option value="' + key + '">' + esc(map[key].label) + '</option>'; }).join(''); }
  function notify(message, type) {
    if (typeof window.showToast === 'function') return window.showToast(message, type || 'success');
    if (typeof window.showToastMsg === 'function') return window.showToastMsg(message);
    if (typeof window.showWorkflowToast === 'function') return window.showWorkflowToast(message);
  }
  function recordById(id) { return window.appData.find(function (record) { return record.id === id; }); }
  function addSharedStyle() {
    if (document.getElementById('accessFlowSharedStyle')) return;
    var style = document.createElement('style');
    style.id = 'accessFlowSharedStyle';
    style.textContent = '.access-flow-summary{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 16px;margin-bottom:16px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;font-size:14px}.access-flow-summary-label{color:#00000073;margin-right:6px}.access-flow-hint{color:#d46b08;font-size:12px}.access-flow-stage-cell{min-width:136px}.access-flow-stage-cell small{display:block;margin-top:3px;color:#d46b08;line-height:18px}.access-flow-progress{display:flex;align-items:flex-start;gap:0;flex-wrap:wrap}.access-flow-progress-item{display:flex;align-items:center}.access-flow-progress-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;background:#d9d9d9}.access-flow-progress-item.is-done .access-flow-progress-dot{background:#52c41a}.access-flow-progress-item.is-current .access-flow-progress-dot{background:#1677ff;box-shadow:0 0 0 3px #e6f4ff}.access-flow-progress-item.is-returned .access-flow-progress-dot{background:#ff4d4f}.access-flow-progress-label{margin-left:5px;font-size:12px;color:#000000d9;white-space:nowrap}.access-flow-progress-line{width:24px;height:2px;background:#d9d9d9;margin:11px 7px 0}.access-flow-progress-line.is-done{background:#52c41a}.access-flow-table.access-flow-wide{min-width:1360px}.access-flow-wide th:nth-last-child(3),.access-flow-wide td:nth-last-child(3){min-width:190px;white-space:nowrap}.access-flow-wide th:nth-last-child(2),.access-flow-wide td:nth-last-child(2){min-width:170px;white-space:nowrap}#mainTbody td:last-child{min-width:112px;white-space:nowrap}#mainTbody td:last-child .ant-btn-link{white-space:nowrap}';
    document.head.appendChild(style);
  }
  function summaryHtml(record) {
    var hint = F.returnHint(record);
    return '<div class="access-flow-summary"><div><span class="access-flow-summary-label">流程状态</span>' + tag(F.processInfo(record)) + '</div><div><span class="access-flow-summary-label">当前环节</span>' + tag({ label: F.stageInfo(record).label, cls: record.processStatus === 'returning' ? 'ant-tag-warning' : 'ant-tag-processing' }) + '</div>' + (hint ? '<span class="access-flow-hint">' + esc(hint) + '</span>' : '') + '</div>';
  }
  function decorateDetail(id) {
    var record = recordById(id); if (!record) return;
    var body = document.querySelector('#modal-mask .ant-modal-body'); if (!body) return;
    var old = body.querySelector('.access-flow-summary'); if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', summaryHtml(record));
    Array.prototype.forEach.call(body.querySelectorAll('.ant-descriptions-label'), function (label) {
      var text = label.textContent.trim();
      if (text !== '申请状态' && text !== '审批状态' && text !== '当前节点') return;
      if (text === '当前节点') { label.textContent = '当前环节'; label.nextElementSibling.innerHTML = tag({ label: F.stageInfo(record).label, cls: 'ant-tag-processing' }); }
      else { label.textContent = '流程状态'; label.nextElementSibling.innerHTML = tag(F.processInfo(record)); }
    });
  }
  function renderProgress(record) {
    var steps = F.progress(record), html = '<div class="access-flow-progress">';
    steps.forEach(function (step, index) {
      var cls = step.error ? ' is-returned' : step.current ? ' is-current' : step.done ? ' is-done' : '';
      var icon = step.error ? '×' : step.done ? '✓' : (index + 1);
      html += '<div class="access-flow-progress-item' + cls + '"><span class="access-flow-progress-dot">' + icon + '</span><span class="access-flow-progress-label">' + esc(step.label) + (step.current ? '（当前）' : '') + '</span></div>';
      if (index < steps.length - 1) html += '<span class="access-flow-progress-line' + (step.done ? ' is-done' : '') + '"></span>';
    });
    return html + '</div>';
  }
  function renderLogHtml(record) {
    var logs = F.displayLogs(record);
    if (typeof window.renderFLH === 'function') return window.renderFLH(logs);
    return logs.map(function (log) { return '<div>' + esc(log.title) + ' ' + esc(log.status) + '</div>'; }).join('');
  }
  function openVersion(id) {
    var current = recordById(id); if (!current || !window.ApplicationLineage) return;
    window.ApplicationLineage.open({
      id: id, records: window.appData,
      getId: function (r) { return r.id; },
      getParent: function (r) { return r.origId && r.origId !== '-' ? r.origId : ''; },
      getType: function (r) { return r.type || r.subType || 'initial'; },
      getTypeLabel: function (r) { var map = window.typeMap || window.subTypeMap || {}; return (map[r.type || r.subType] || {}).label || ''; },
      getTime: function (r) { return r.time || ''; },
      getStatus: function (r) { return r.processStatus; },
      getStatusLabel: function (r) { return F.processInfo(r).label + ' · ' + F.stageInfo(r).label; },
      getStatusClass: function (r) { return F.processInfo(r).cls; },
      getEffect: function (r, parent) { var type = r.type || r.subType; return type === 'renewal' ? '接续 ' + parent : type === 'change' ? '替代 ' + parent : type === 'add_vehicle' ? '挂接 ' + parent + '；按四级审批办理' : ''; },
      getPeriod: function (r) { return r.validFrom && r.validFrom !== '-' ? r.validFrom + ' 至 ' + (r.validTo || '-') : ''; },
      onView: function (r) { window.openDetail(r.id); }
    });
  }
  function replaceFilter() {
    var labels = document.querySelectorAll('.filter-item > label'), target = null;
    Array.prototype.some.call(labels, function (label) { if (label.textContent.trim() === '申请状态') { target = label.parentElement; return true; } return false; });
    if (!target || target.dataset.flowFilter) return;
    target.dataset.flowFilter = 'true';
    target.innerHTML = '<label>流程状态</label><select class="ant-input" id="flowProcessFilter" style="width:140px">' + optionHtml(F.processStatusMap) + '</select>';
    var stage = document.createElement('div'); stage.className = 'filter-item'; stage.dataset.flowStageFilter = 'true';
    stage.innerHTML = '<label>当前环节</label><select class="ant-input" id="flowStageFilter" style="width:160px">' + optionHtml(F.stageMap) + '</select>';
    var path = String(location.pathname || '').replace(/\\/g, '/');
    var extra = target.closest('.filter-bar') && target.closest('.filter-bar').querySelector('.filter-row.filter-extra');
    if (extra && !/apply-records\.html$/.test(path)) extra.insertBefore(stage, extra.firstChild);
    else target.parentNode.insertBefore(stage, target.nextSibling);
  }
  function ensureListHeaders() {
    var row = document.querySelector('#mainTbody'); row = row && row.closest('table').querySelector('thead tr'); if (!row) return;
    var headers = Array.prototype.slice.call(row.children), table = row.closest('table'), existingStage = headers.find(function (th) { return ['当前节点', '当前环节'].indexOf(th.textContent.trim()) > -1; }), status = headers.find(function (th) { return ['申请状态', '审批状态', '流程状态'].indexOf(th.textContent.trim()) > -1; });
    if (table) { table.classList.add('access-flow-table'); if (headers.length >= 9) table.classList.add('access-flow-wide'); }
    if (!status) return; status.textContent = '流程状态';
    if (existingStage) { existingStage.textContent = '当前环节'; return; }
    var next = status.nextElementSibling;
    if (!next || next.textContent.trim() !== '当前环节') { var th = document.createElement('th'); th.textContent = '当前环节'; status.parentNode.insertBefore(th, next); }
  }
  function postprocessRows() {
    var table = document.getElementById('mainTbody'); if (!table) return;
    var headers = Array.prototype.slice.call(table.closest('table').querySelectorAll('thead th')).map(function (th) { return th.textContent.trim(); });
    var processIndex = headers.indexOf('流程状态'), stageIndex = headers.indexOf('当前环节');
    Array.prototype.forEach.call(table.querySelectorAll('tr'), function (row) {
      var id = row.cells[0] && row.cells[0].textContent.trim(), record = recordById(id); if (!record) return;
      if (row.cells.length < headers.length && stageIndex > -1) row.insertCell(stageIndex);
      if (processIndex > -1 && row.cells[processIndex]) row.cells[processIndex].innerHTML = tag(F.processInfo(record));
      if (stageIndex > -1) {
        var current = row.cells[stageIndex];
        var hint = F.returnHint(record);
        current.className = 'access-flow-stage-cell'; current.innerHTML = esc(F.stageInfo(record).label) + (hint ? '<small>' + esc(hint) + '</small>' : '');
      }
    });
  }
  function filterRecords(records) {
    var process = document.getElementById('flowProcessFilter'), stage = document.getElementById('flowStageFilter');
    return records.filter(function (record) { return (!process || process.value === 'all' || record.processStatus === process.value) && (!stage || stage.value === 'all' || record.currentStage === stage.value); });
  }
  function installApplicant() {
    replaceFilter(); ensureListHeaders();
    var originalRender = window.renderTable;
    if (typeof originalRender === 'function') window.renderTable = function () {
      var all = window.appData, filtered = filterRecords(all); window.appData = filtered;
      try { originalRender.apply(this, arguments); } finally { window.appData = all; }
      postprocessRows();
    };
    var originalReset = window.resetFilter;
    window.resetFilter = function () {
      ['flowProcessFilter', 'flowStageFilter'].forEach(function (id) { var item = document.getElementById(id); if (item) item.value = 'all'; });
      var statusLabel = document.getElementById('msStatusLabel'); if (statusLabel) statusLabel.textContent = '全部';
      if (typeof originalReset === 'function') { try { originalReset.apply(this, arguments); } catch (error) { window.renderTable(); } }
      else window.renderTable();
    };
    var originalOps = window.getOps;
    if (typeof originalOps === 'function') window.getOps = function (record) {
      F.ensureRecord(record); var html = originalOps(record);
      html = html.replace(/<button[^>]*>重新提交<\/button>/g, '').replace(/<button[^>]*>撤回<\/button>/g, record.processStatus === 'processing' && record.currentStage === 'third_party_review' ? '$&' : '');
      if (record.processStatus === 'returning' && record.currentStage === 'applicant_correction') html += '<button class="ant-btn-link whitespace-nowrap" onclick="AccessFlowPages.resubmit(\'' + esc(record.id) + '\')">补正</button>';
      return html;
    };
    var originalDetailData = window.getDetailData;
    if (typeof originalDetailData === 'function') window.getDetailData = function (id) {
      var detail = originalDetailData.apply(this, arguments), record = recordById(id); if (!detail || !record) return detail;
      F.ensureRecord(record); detail.processStatus = record.processStatus; detail.currentStage = record.currentStage; detail.flowLogs = record.flowLogs;
      detail.processStatusLabel = F.processInfo(record).label; detail.currentStageLabel = F.stageInfo(record).label; return detail;
    };
    window.getFlowSteps = function () { var record = window.__accessFlowCurrentRecord || window.appData[0]; return F.progress(record).map(function (step) { return { label: step.label, done: step.done, error: step.error, current: step.current }; }); };
    var originalOpen = window.openDetail;
    if (typeof originalOpen === 'function') window.openDetail = function (id) { window.__accessFlowCurrentRecord = recordById(id); var result = originalOpen.apply(this, arguments); setTimeout(function () { decorateDetail(id); }, 80); return result; };
    window.buildFlowLog = function (value) { var record = typeof value === 'object' ? value : recordById(value); return record ? renderLogHtml(record) : ''; };
    window.buildFlowProgress = function (record) { return '<h4 class="text-sm font-semibold text-[#000000d9] mb-3 mt-4 pb-2 border-b border-[#f0f0f0]">审批流程进度</h4>' + renderProgress(record); };
    window.openVersionModal = openVersion;
  }
  function approvalFilter(records) {
    var tab = window.currentTab || 'todo', role = F.currentRole();
    return records.filter(function (record) {
      if (tab === 'all') return true;
      if (tab === 'processing') return record.processStatus === 'processing';
      if (tab === 'returning' || tab === 'rejected') return record.processStatus === 'returning';
      if (tab === 'passed') return record.processStatus === 'approved' || record.processStatus === 'active';
      return F.canHandle(record, role) && ['processing', 'returning', 'approved'].indexOf(record.processStatus) > -1;
    });
  }
  function installApproval() {
    Array.prototype.forEach.call(document.querySelectorAll('.ant-tabs .ant-tab'), function (tab) { if (tab.textContent.trim() === '已退回') { tab.textContent = '退回处理中'; tab.setAttribute('onclick', "switchTab(this,'returning')"); } });
    ensureListHeaders();
    var originalRender = window.renderTable;
    window.renderTable = function () {
      var all = window.appData, filtered = approvalFilter(all); window.appData = filtered;
      var oldTab = window.currentTab; window.currentTab = 'all';
      try { originalRender.apply(this, arguments); } finally { window.currentTab = oldTab; window.appData = all; }
      postprocessRows();
      Array.prototype.forEach.call(document.querySelectorAll('#mainTbody tr'), function (row) {
        var record = recordById(row.cells[0] && row.cells[0].textContent.trim()), cell = row.cells[row.cells.length - 1]; if (!record || !cell) return;
        cell.innerHTML = F.canHandle(record) ? '<button class="ant-btn-link" onclick="openApprove(\'' + esc(record.id) + '\')">处理</button><button class="ant-btn-link" onclick="openDetail(\'' + esc(record.id) + '\')">查看</button>' : '<button class="ant-btn-link" onclick="openDetail(\'' + esc(record.id) + '\')">查看</button>';
      });
    };
    var originalOpen = window.openApprove;
    if (typeof originalOpen === 'function') window.openApprove = function (id) { var record = recordById(id); if (!record || !F.canHandle(record)) { notify('当前角色不是该环节责任方，仅可查看', 'warning'); return window.openDetail(id); } window.__accessFlowCurrentRecord = record; var result = originalOpen.apply(this, arguments); setTimeout(function () { decorateDetail(id); var node = document.querySelector('.approval-context .current-node'); if (node) node.textContent = F.stageInfo(record).label; }, 80); return result; };
    window.approveAction = function (action) {
      var record = window.currentApproveData; if (!record) return;
      var textarea = document.getElementById('approveOpinion'), opinion = textarea ? textarea.value.trim() : '';
      if (!opinion) { alert(record.currentStage === 'third_party_review' || record.currentStage === 'expert_review' ? '请填写备注' : '请填写审批意见'); if (textarea) textarea.focus(); return; }
      var count = window.MaterialReviewComments ? window.MaterialReviewComments.getCurrent(record).length : 0;
      if (action === 'reject' && record.currentStage === 'third_party_review' && !count) { alert('请至少为一个有问题的材料添加批注'); return; }
      if (action === 'reject') {
        var path = F.approvalPath(record), index = path.indexOf(record.currentStage), target = record.currentStage === 'plate_confirmation' ? '牌照修改' : index <= 0 ? '申请主体补正' : F.stageMap[path[index - 1]].label;
        if (!window.confirm('确认退回至“' + target + '”？退回后流程继续办理。')) return;
        if (window.MaterialReviewComments) window.MaterialReviewComments.archiveCurrent(record); F.reject(record, opinion); notify('已退回至' + target, 'warning');
      } else { if (window.MaterialReviewComments && record.currentStage === 'third_party_review') window.MaterialReviewComments.clearCurrent(record); F.pass(record, opinion); notify('审批通过，已流转至' + F.stageInfo(record).label, 'success'); }
      window.closeModal(); window.renderTable();
    };
    window.approvePlateReviewAction = function (action) { window.approveAction(action === 'reject' ? 'reject' : 'pass'); };
    window.buildFlowLog = function (record) { return renderLogHtml(record); };
    window.buildFlowProgress = function (record) { return '<h4 class="text-sm font-semibold text-[#000000d9] mb-3 mt-4 pb-2 border-b border-[#f0f0f0]">审批流程进度</h4>' + renderProgress(record); };
    window.openVersionModal = openVersion;
  }
  function installRecords() {
    replaceFilter(); ensureListHeaders();
    var originalRender = window.renderTable;
    window.renderTable = function () {
      var all = window.appData, filtered = filterRecords(all); window.appData = filtered;
      var old = window.currentStatusFilter; window.currentStatusFilter = 'all';
      try { originalRender.apply(this, arguments); } finally { window.currentStatusFilter = old; window.appData = all; }
      postprocessRows();
    };
    var originalReset = window.resetFilter;
    window.resetFilter = function () { ['flowProcessFilter', 'flowStageFilter'].forEach(function (id) { var item = document.getElementById(id); if (item) item.value = 'all'; }); if (typeof originalReset === 'function') originalReset.apply(this, arguments); };
  }
  function install() {
    addSharedStyle(); F.ensureAll(window.appData);
    var path = String(location.pathname || '').replace(/\\/g, '/');
    if (/access-approve\/approve\.html$/.test(path)) installApproval();
    else if (/access-apply\/apply-records\.html$/.test(path)) installRecords();
    else if (/access-apply\/(road-test|demo-apply|demo-operate)\.html$/.test(path)) installApplicant();
    if (typeof window.renderTable === 'function') window.renderTable();
    ['flowProcessFilter', 'flowStageFilter'].forEach(function (id) { var item = document.getElementById(id); if (item) item.addEventListener('change', function () { if (window.pager && window.pager.reset) window.pager.reset(); window.renderTable(); }); });
  }
  window.AccessFlowPages = { install: install, resubmit: function (id) {
    var record = recordById(id); if (!record) return;
    F.ensureRecord(record);
    if (record.processStatus !== 'returning' || record.currentStage !== 'applicant_correction') { notify('当前申请不处于申请主体补正环节', 'warning'); return; }
    if (record.type === 'change' && typeof window.openChangePage === 'function') { window.openChangePage(id); return; }
    notify('当前申请类型暂不支持在线补正，请联系管理员', 'warning');
  }, decorateDetail: decorateDetail };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
