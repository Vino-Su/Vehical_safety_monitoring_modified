(function (window, document) {
  'use strict';

  var state = { config: null, record: null, flowRecord: null, files: {}, selected: {}, structured: {}, add: null, mode: '', correction: false };
  var DEFAULT_ATTACHMENTS = [
    { key: 'latestDeclaration', label: '最新安全性自我声明', note: '上传最新版本安全性自我声明文件' },
    { key: 'reasonNecessity', label: '变更理由及必要性说明', note: '说明本次变更的理由和必要性' },
    { key: 'supportingMaterials', label: '相应证明材料', note: '上传能够证明变更事项的文件' }
  ];

  function attachmentItems() {
    return (state.config && state.config.changeAttachments && state.config.changeAttachments.length)
      ? state.config.changeAttachments
      : DEFAULT_ATTACHMENTS;
  }

  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function js(value) { return String(value === undefined || value === null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function byKey(items, key) { return (items || []).filter(function (item) { return item.key === key; })[0]; }
  function fieldValue(record, field) {
    if (typeof field.getValue === 'function') return field.getValue(record);
    var source = record && record.changeSource ? record.changeSource : record || {};
    return source[field.key] || field.value || '-';
  }
  function fieldDisplayValue(field, value) {
    if (typeof field.formatValue === 'function') return field.formatValue(value, state.record);
    if (field.inputType === 'select') {
      var selected = (field.options || []).filter(function (option) { return String(typeof option === 'string' ? option : option.value) === String(value); })[0];
      if (selected) return typeof selected === 'string' ? selected : selected.label;
    }
    return value;
  }
  function fieldInputValue(field, value) {
    if (field.inputType !== 'select') return value;
    var matched = (field.options || []).filter(function (option) {
      var item = typeof option === 'string' ? { value: option, label: option } : option;
      return String(item.value) === String(value) || String(item.label) === String(value);
    })[0];
    return matched && typeof matched !== 'string' ? matched.value : (matched || value);
  }
  function fieldAdapter(field) { return field && (field.structured || field.adapter); }
  function isStructuredField(field) { return !!fieldAdapter(field); }
  function structuredValue(field) {
    var adapter = fieldAdapter(field);
    return adapter && typeof adapter.getValue === 'function' ? adapter.getValue(state.record, state) : '';
  }
  function structuredInput(field) {
    var adapter = fieldAdapter(field) || {};
    var shell = typeof adapter.renderShell === 'function' ? adapter.renderShell(field, state.record, state) : '';
    var addLabel = adapter.addLabel || '添加';
    var note = adapter.note || '通过选择列表新增，可标记删除或恢复';
    return '<div class="aaf-structured-editor"><div class="aaf-structured-toolbar"><button type="button" class="ant-btn ant-btn-sm ant-btn-primary" onclick="AccessApplyFramework.openStructured(\'' + js(field.key) + '\')">+ ' + esc(addLabel) + '</button><span class="aaf-structured-note">' + esc(note) + '</span><span class="aaf-row-legend"><span><i class="aaf-row-dot is-retained"></i>保留</span><span><i class="aaf-row-dot is-added"></i>新增</span><span><i class="aaf-row-dot is-deleted"></i>拟删除</span></span></div><div class="aaf-structured-table">' + shell + '</div></div>';
  }
  function fieldInput(field, value) {
    if (isStructuredField(field)) return structuredInput(field);
    if (typeof field.renderInput === 'function') return field.renderInput(value, field, state.record);
    var inputType = field.inputType || 'text';
    if (inputType === 'textarea') return '<textarea class="ant-input aaf-field-input" data-aaf-field="' + esc(field.key) + '" rows="3" placeholder="请输入变更后的' + esc(field.label) + '" style="resize:vertical">' + esc(value === '-' ? '' : value) + '</textarea>';
    if (inputType === 'date-range') {
      var pair = String(value || '').split(/\s*(?:至|~|—)\s*/);
      return '<div style="display:flex;align-items:center;gap:8px;white-space:nowrap"><input class="ant-input aaf-field-input" data-aaf-field="' + esc(field.key) + '" data-aaf-range="start" type="date" value="' + esc(pair[0] || '') + '" style="width:120px!important;min-width:120px;flex:0 0 120px"><span>至</span><input class="ant-input aaf-field-input" data-aaf-field="' + esc(field.key) + '" data-aaf-range="end" type="date" value="' + esc(pair[1] || '') + '" style="width:120px!important;min-width:120px;flex:0 0 120px"></div>';
    }
    if (inputType === 'select') {
      var options = (field.options || []).map(function (option) { var item = typeof option === 'string' ? { value: option, label: option } : option; return '<option value="' + esc(item.value) + '"' + (String(value) === String(item.value) ? ' selected' : '') + '>' + esc(item.label) + '</option>'; }).join('');
      return '<select class="ant-input aaf-field-input" data-aaf-field="' + esc(field.key) + '"><option value="">请选择</option>' + options + '</select>';
    }
    return '<input class="ant-input aaf-field-input" data-aaf-field="' + esc(field.key) + '" value="' + esc(value === '-' ? '' : value) + '" placeholder="请输入变更后的' + esc(field.label) + '">';
  }
  function fieldMarkup(field) {
    var value = fieldValue(state.record, field);
    var displayValue = fieldDisplayValue(field, value);
    var saved = state.correction && state.record.changeFields && state.record.changeFields[field.key];
    var selected = !!saved;
    var inputValue = fieldInputValue(field, saved && saved.newValue !== undefined ? saved.newValue : value);
    state.selected[field.key] = selected;
    return '<div class="aaf-change-field' + (selected ? ' is-selected' : '') + '" data-aaf-change="' + esc(field.key) + '"><label class="aaf-change-head"><input type="checkbox" data-aaf-toggle="' + esc(field.key) + '"' + (selected ? ' checked' : '') + '><span class="aaf-change-name">' + esc(field.label) + '</span><span class="aaf-change-prompt">勾选以变更</span></label><div class="aaf-change-current">当前值：' + esc(saved && saved.oldValue !== undefined ? saved.oldValue : displayValue) + '</div><div class="aaf-change-editor">' + fieldInput(field, inputValue) + '<div class="aaf-error" data-aaf-field-error="' + esc(field.key) + '">请补充变更后的' + esc(field.label) + '</div></div></div>';
  }
  function materialInfo(item) {
    var text = item && (item.original || item.full || item.name);
    return text ? '<span class="material-info"><button type="button" class="material-info-btn" aria-label="查看材料原文">i</button><span class="material-tooltip" role="tooltip">' + esc(text) + '</span></span>' : '';
  }
  function originalFileName(item, record) {
    if (item.file || item.fileName) return item.file || item.fileName;
    if (item.source === 'company') return '主体营业执照.pdf';
    if (item.source === 'person' || item.source === 'detail-person') return '关联驾驶员（安全员）档案';
    return (item.name || item.label || '原申请材料') + '.pdf';
  }
  function originalGroups(record) {
    var groups = typeof state.config.getOriginalAttachmentGroups === 'function' ? state.config.getOriginalAttachmentGroups(record) : record.originalAttachmentGroups;
    if (groups && groups.length) return groups;
    var files = record.originalAttachments || [];
    return files.length ? [{ title: '原申请附件', items: files.map(function (file, index) { return { label: '附件' + (index + 1), name: file, file: file }; }) }] : [];
  }
  function linkedActions(item, record) {
    var file = originalFileName(item, record);
    return '<button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.preview(\'' + js(file) + '\')">预览</button><button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.download(\'' + js(file) + '\')">下载</button>';
  }
  function linkedSource(item, record) {
    if (item.source === 'company') return '关联企业档案';
    if (item.source === 'person' || item.source === 'detail-person') return '关联驾驶员（安全员）档案';
    return originalFileName(item, record);
  }
  function attachmentMarkup(item, index) {
    var file = state.files[item.key] || '';
    var actions = '<input class="aaf-file-input" id="aaf-upload-' + esc(item.key) + '" data-aaf-upload="' + esc(item.key) + '" type="file"><button type="button" class="ant-btn ant-btn-sm" onclick="document.getElementById(\'aaf-upload-' + js(item.key) + '\').click()">' + (file ? '替换' : '上传文件') + '</button><span class="text-xs ' + (file ? 'text-[#52c41a]' : 'text-[#ff4d4f]') + '">' + (file ? '已上传：' + esc(file) : '未上传文件') + '</span>' + (file ? '<button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.preview(\'' + js(file) + '\')">预览</button><button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.download(\'' + js(file) + '\')">下载</button>' : '');
    return '<div class="aaf-attachment-item" data-aaf-attachment="' + esc(item.key) + '"><div class="attachment-row"><div class="attachment-name"><span class="required">*</span><span class="attachment-no">材料' + (index + 1) + '：</span><span>' + esc(item.label) + '</span></div><div class="attachment-file-actions">' + actions + '</div></div><div class="aaf-error" data-aaf-attachment-error="' + esc(item.key) + '">请上传' + esc(item.label) + '</div></div>';
  }
  function originalFormGroup(group, record) {
    return '<section class="attachment-group"><div class="attachment-group-title">' + esc(group.title) + '</div>' + (group.items || []).map(function (item) {
      return '<div class="attachment-row aaf-origin-form-row"><div class="attachment-name"><span class="attachment-no">' + esc(item.label || '附件') + '：</span><span>' + esc(item.name || '-') + '</span>' + materialInfo(item) + '</div><div class="attachment-file-actions"><span class="text-[#52c41a]">✓</span><span class="text-sm text-[#1677ff]">' + esc(linkedSource(item, record)) + '</span>' + linkedActions(item, record) + '</div></div>';
    }).join('') + '</section>';
  }
  function originalDetailGroup(group, record) {
    return '<section class="attachment-group"><div class="attachment-group-title">' + esc(group.title) + '</div>' + (group.items || []).map(function (item) {
      return '<div class="attachment-row"><span class="attachment-index">' + esc(item.label || '附件') + '</span><span class="attachment-name">' + esc(item.name || '-') + materialInfo(item) + '</span><span class="attachment-source">' + esc(linkedSource(item, record)) + '</span><span class="attachment-actions">' + linkedActions(item, record) + '</span></div>';
    }).join('') + '</section>';
  }
  function changeHtml() {
    var config = state.config;
    var record = state.record;
    state.files = {};
    attachmentItems().forEach(function (item) { state.files[item.key] = (record.attachments || {})[item.key] || ''; });
    var source = originalSource(record);
    var correctionLogs = state.correction
      ? detailSection('审批流程日志', typeof window.buildFlowLog === 'function' ? window.buildFlowLog(state.flowRecord || record) : logsHtml(state.flowRecord || record))
      : '';
    return formBanner('变更申请', record, source) +
      '<section class="aaf-section"><h4 class="aaf-section-title">申请信息</h4><div class="aaf-subsection"><h5 class="aaf-subsection-title">变更内容<span class="aaf-section-note">未勾选字段将保留原值</span></h5>' + (config.fields || []).map(fieldMarkup).join('') + '</div><div class="ant-form-item" style="margin-bottom:0"><div class="ant-form-label"><span class="required">*</span>变更原因</div><div class="ant-form-control"><textarea id="aaf-change-reason" class="ant-input" rows="3" placeholder="请输入变更原因" style="resize:vertical">' + esc(record.changeReason || '') + '</textarea><div class="aaf-error" data-aaf-reason-error>请输入变更原因</div></div></div></section>' +
      '<section class="aaf-section"><h4 class="aaf-section-title">申请材料</h4><div class="aaf-attachment-form"><section class="attachment-group"><div class="attachment-group-title">本次申请文件</div>' + attachmentItems().map(attachmentMarkup).join('') + '</section></div></section>' + formOriginalContentHtml(source) + correctionLogs;
  }
  function originalAttachmentHtml(record, detail) {
    var groups = originalGroups(record);
    if (!groups.length) return '';
    if (detail) return '<div class="detail-attachment-panel operate-detail-group aaf-detail-attachments aaf-original-attachment-panel">' + groups.map(function (group) { return originalDetailGroup(group, record); }).join('') + '</div>';
    return '<details class="orig-mats aaf-original-files aaf-attachment-directory"><summary><span>原申请附件（只读关联）</span><span class="aaf-original-hint">- 点击展开查看</span></summary><div class="aaf-original-files-inner">' + groups.map(function (group) { return originalDetailGroup(group, record); }).join('') + '</div></details>';
  }
  function attachEvents() {
    var modal = document.getElementById('modal-mask');
    if (!modal) return;
    modal.querySelectorAll('[data-aaf-toggle]').forEach(function (input) {
      input.addEventListener('change', function () {
        var container = input.closest('.aaf-change-field');
        container.classList.toggle('is-selected', input.checked);
        state.selected[input.dataset.aafToggle] = input.checked;
      });
    });
    modal.querySelectorAll('[data-aaf-upload]').forEach(function (input) {
      input.addEventListener('change', function () {
        var key = input.dataset.aafUpload;
        var file = input.files && input.files[0];
        if (!file) return;
        state.files[key] = file.name;
        refreshAttachment(key);
      });
    });
  }
  function prepareStructuredFields() {
    (state.config.fields || []).forEach(function (field) {
      var adapter = fieldAdapter(field);
      if (adapter && typeof adapter.prepare === 'function') adapter.prepare(state.record, state);
    });
  }
  function renderStructuredFields() {
    (state.config.fields || []).forEach(function (field) {
      var adapter = fieldAdapter(field);
      if (adapter && typeof adapter.render === 'function') adapter.render(state.record, state);
    });
  }
  function refreshAttachment(key) {
    var modal = document.getElementById('modal-mask');
    if (!modal) return;
    var item = byKey(attachmentItems(), key);
    var row = modal.querySelector('[data-aaf-attachment="' + key + '"]');
    if (!row) return;
    var index = attachmentItems().map(function (candidate) { return candidate.key; }).indexOf(key);
    row.outerHTML = attachmentMarkup(item, index);
    var newInput = modal.querySelector('[data-aaf-upload="' + key + '"]');
    if (newInput) newInput.addEventListener('change', function () { var selected = newInput.files && newInput.files[0]; if (selected) { state.files[key] = selected.name; refreshAttachment(key); } });
  }
  function setError(selector, visible) { var el = document.querySelector(selector); if (el) el.classList.toggle('is-visible', visible); }
  function selectedValue(field) {
    if (isStructuredField(field)) return structuredValue(field);
    var nodes = document.querySelectorAll('.aaf-field-input[data-aaf-field="' + field.key + '"]');
    if (field.inputType === 'date-range') return Array.prototype.map.call(nodes, function (node) { return node.value; }).filter(Boolean).join(' 至 ');
    return nodes[0] ? nodes[0].value.trim() : '';
  }
  function validate() {
    var valid = true;
    var reason = document.getElementById('aaf-change-reason');
    var missingReason = !reason || !reason.value.trim();
    setError('[data-aaf-reason-error]', missingReason);
    valid = valid && !missingReason;
    var hasSelection = false;
    (state.config.fields || []).forEach(function (field) {
      if (!state.selected[field.key]) return;
      hasSelection = true;
      var adapter = fieldAdapter(field);
      var missing = adapter && typeof adapter.isValid === 'function' ? !adapter.isValid(state.record, state) : !selectedValue(field);
      setError('[data-aaf-field-error="' + field.key + '"]', missing);
      valid = valid && !missing;
    });
    if (!hasSelection) { toast('请至少勾选一个需要变更的字段'); valid = false; }
    attachmentItems().forEach(function (item) {
      var missing = !state.files[item.key];
      setError('[data-aaf-attachment-error="' + item.key + '"]', missing);
      valid = valid && !missing;
    });
    return valid;
  }
  function changePayload() {
    var fields = {};
    (state.config.fields || []).forEach(function (field) {
      if (!state.selected[field.key]) return;
      var adapter = fieldAdapter(field);
      var change = { oldValue: fieldDisplayValue(field, fieldValue(state.record, field)), newValue: fieldDisplayValue(field, selectedValue(field)), label: field.label };
      if (adapter && typeof adapter.getItems === 'function') change.items = adapter.getItems(state.record, state);
      fields[field.key] = change;
    });
    return { originalApplicationId: state.record.originalApplicationId || state.record.id, changeReason: document.getElementById('aaf-change-reason').value.trim(), changeFields: fields, attachments: Object.assign({}, state.files) };
  }
  function statusLabel(record) { if (window.AccessFlowModel) return window.AccessFlowModel.processInfo(record).label + ' · ' + window.AccessFlowModel.stageInfo(record).label; return record.statusLabel || (state.config.statusMap && state.config.statusMap[record.status] && state.config.statusMap[record.status].label) || record.status || '-'; }
  function formatChanges(record) {
    var fields = record.changeFields || {};
    var keys = Object.keys(fields);
    if (!keys.length) return '<div class="aaf-detail-change"><div class="aaf-detail-change-name">暂未记录字段变更</div><div class="aaf-detail-old">本原型仅展示变更详情布局。</div></div>';
    return keys.map(function (key) {
      var change = fields[key];
      var field = byKey(state.config && state.config.fields, key);
      var adapter = fieldAdapter(field);
      var detailTable = adapter && typeof adapter.renderDetailTable === 'function' && Array.isArray(change.items) ? adapter.renderDetailTable(change.items, change, state.record) : '';
      var itemSummary = adapter && typeof adapter.summary === 'function' && Array.isArray(change.items) ? adapter.summary(change.items) : '';
      if (detailTable) {
        return '<div class="aaf-detail-change aaf-detail-change-structured"><div class="aaf-detail-change-name">' + esc(change.label || key) + '</div><div class="aaf-detail-structured"><div class="aaf-detail-structured-head"><span>对象变更明细</span><span class="aaf-row-legend"><span><i class="aaf-row-dot is-retained"></i>保留</span><span><i class="aaf-row-dot is-added"></i>新增</span><span><i class="aaf-row-dot is-deleted"></i>拟删除</span></span><span>' + esc(itemSummary) + '</span></div>' + detailTable + '</div></div>';
      }
      return '<div class="aaf-detail-change"><div class="aaf-detail-change-name">' + esc(change.label || key) + '</div><div class="aaf-detail-pair"><span>原值</span><span class="aaf-detail-old">' + esc(change.oldValue || '-') + '</span></div><div class="aaf-detail-pair"><span>变更后</span><span class="aaf-detail-new">' + esc(change.newValue || '-') + '</span></div></div>';
    }).join('');
  }
  function detailFiles(record) {
    var files = record.attachments || {};
    var current = attachmentItems().map(function (item, index) {
      var file = files[item.key] || '未上传';
      var source = file === '未上传' ? '未上传文件' : file;
      var actions = file === '未上传' ? '-' : '<button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.preview(\'' + js(file) + '\')">预览</button><button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.download(\'' + js(file) + '\')">下载</button>';
      return '<div class="attachment-row"><span class="attachment-index">材料' + (index + 1) + '</span><span class="attachment-name">' + esc(item.label) + '</span><span class="attachment-source">' + esc(source) + '</span><span class="attachment-actions">' + actions + '</span></div>';
    }).join('');
    return '<div class="detail-attachment-panel operate-detail-group aaf-detail-attachments"><section class="attachment-group"><div class="attachment-group-title">本次申请文件</div>' + current + '</section></div>';
  }
  function flowHtml(record) {
    if (window.AccessFlowModel) {
      return '<div class="aaf-flow">' + window.AccessFlowModel.progress(record).map(function (item, index) {
        var dotClass = item.error ? 'is-error' : item.done ? 'is-done' : item.current ? 'is-current' : '';
        return '<div class="aaf-flow-step ' + dotClass + '"><div class="aaf-flow-dot">' + (item.error ? '×' : item.done ? '✓' : index + 1) + '</div><div><div class="aaf-flow-title">' + esc(item.label) + (item.current ? '（当前）' : '') + '</div></div></div>';
      }).join('') + '</div>';
    }
    var steps = record.flowSteps || ['提交申请', '初审', '专班审核', '审批完成'];
    var current = -1;
    var plainSteps = steps.every(function (step) { return typeof step === 'string'; });
    if (plainSteps) {
      if (record.status === 'pending_review') current = Math.min(1, steps.length - 1);
      else if (record.status === 'pending_committee_confirm' || record.status === 'rejected') current = Math.min(2, steps.length - 1);
    }
    steps.forEach(function (step, index) { if (typeof step === 'object' && step.current && current < 0) current = index; });
    if (current < 0) current = steps.findIndex ? steps.findIndex(function (step) { return typeof step === 'object' && !step.done && !step.error; }) : -1;
    var completed = current < 0;
    if (current < 0) current = steps.length - 1;
    return '<div class="aaf-flow">' + steps.map(function (step, index) {
      var item = typeof step === 'string' ? { title: step, done: completed || index < current, error: record.status === 'rejected' && index === current } : step;
      var isCurrent = index === current && !item.error;
      var dotClass = item.error ? 'is-error' : (item.done ? 'is-done' : (isCurrent ? 'is-current' : ''));
      var dot = item.error ? '×' : (item.done ? '✓' : (index + 1));
      return '<div class="aaf-flow-step ' + dotClass + '"><div class="aaf-flow-dot">' + dot + '</div><div><div class="aaf-flow-title">' + esc(item.title) + '</div>' + (item.time ? '<div class="aaf-flow-time">' + esc(item.time) + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';
  }
  function detailLogs(record) {
    if (window.AccessFlowModel) return window.AccessFlowModel.displayLogs(record).map(function (log) { return { title: log.title, handler: log.handler, time: log.time, opinion: log.opinion, status: log.status, tone: log.status === '已退回' ? 'error' : log.status === '处理中' || log.status === '退回处理中' ? 'current' : 'done' }; });
    if (state.config && typeof state.config.getFlowLogs === 'function') return state.config.getFlowLogs(record) || [];
    if (Array.isArray(record.flowLogs) && record.flowLogs.length) return record.flowLogs;
    var pendingReview = record.status === 'pending_review';
    var pendingCommittee = record.status === 'pending_committee_confirm';
    return [
      { title: '提交申请', handler: record.company || '-', time: record.time || '-', opinion: '提交' + (record.typeLabel || '派生申请'), status: '已处理', tone: 'done' },
      { title: '第三方初审', handler: '第三方专业管理机构', time: pendingReview ? '审批中' : '已处理', opinion: pendingReview ? '' : '审核结论：通过', status: pendingReview ? '处理中' : '已处理', tone: pendingReview ? 'current' : 'done' },
      { title: '市工作专班审核确认', handler: '市工作专班', time: record.status === 'rejected' ? '已退回' : (pendingCommittee ? '审批中' : (pendingReview ? '待处理' : '已处理')), opinion: record.status === 'rejected' ? '审核结论：退回\n审核意见：材料不完整' : '', status: record.status === 'rejected' ? '已退回' : (pendingCommittee ? '处理中' : (pendingReview ? '待处理' : '已处理')), tone: record.status === 'rejected' ? 'error' : (pendingCommittee ? 'current' : (pendingReview ? 'waiting' : 'done')) }
    ];
  }
  function logsHtml(record) {
    var logs = detailLogs(record);
    return '<div class="aaf-log-list">' + (logs.length ? logs.map(function (log) {
      var tone = log.tone || (log.status === '已退回' ? 'error' : log.status === '处理中' ? 'current' : 'done');
      var issueList = log.title === '第三方初审' && record.status === 'rejected' && window.MaterialReviewComments ? window.MaterialReviewComments.renderIssueList(record, '第三方初审问题清单') : '';
      return '<article class="aaf-log-item ' + tone + '"><div class="aaf-log-marker">' + (tone === 'error' ? '×' : tone === 'done' ? '✓' : '●') + '</div><div class="aaf-log-content"><div class="aaf-log-head"><strong>' + esc(log.title || '-') + '</strong><span>' + esc(log.status || '-') + '</span></div><div class="aaf-log-meta">处理人：' + esc(log.handler || '-') + '　时间：' + esc(log.time || '-') + '</div>' + (log.opinion ? '<div class="aaf-log-opinion">' + esc(log.opinion).replace(/\n/g, '<br>') + '</div>' : '') + issueList + '</div></article>';
    }).join('') : '<div class="aaf-empty-cell">暂无流程日志</div>') + '</div>';
  }
  function originalSource(record) {
    if (record && record.sourceRecord) return record.sourceRecord;
    var originalId = record && (record.originalApplicationId || record.origId);
    if (originalId && state.config && typeof state.config.getRecord === 'function') return state.config.getRecord(originalId) || record;
    return record;
  }
  function originalTable(title, headers, rows) {
    if (!rows.length) return '';
    return '<section class="aaf-original-table-section"><h5 class="aaf-subsection-title">' + esc(title) + '</h5><div style="overflow-x:auto"><table class="ant-table aaf-original-table"><thead><tr>' + headers.map(function (header) { return '<th>' + esc(header) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div></section>';
  }
  function originalEntityTablesHtml(source) {
    var roads = (source.roads || []).concat(source.areas || []);
    var vehicles = source.vehicles || [];
    var persons = source.persons || [];
    var labels = ({
      road_test: { roads: '道路测试路段或区域', vehicles: '道路测试车辆', persons: '道路测试驾驶员（安全员）' },
      demo_apply: { roads: '示范应用路段', vehicles: '示范应用车辆', persons: '示范应用测试人员' },
      demo_operate: { roads: '商业化试点路段', vehicles: '商业化试点车辆', persons: '商业化试点驾驶人（安全员）' }
    })[(state.config || {}).originalContentDomain] || { roads: '道路/区域', vehicles: '车辆', persons: '人员' };
    var roadRows = roads.map(function (item, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + esc(item.name || '-') + '</td><td>' + esc(item.type || '-') + '</td><td><span class="ant-tag ' + (item.status === '开放' ? 'ant-tag-success' : 'ant-tag-default') + '">' + esc(item.status || '-') + '</span></td></tr>';
    });
    var hasOperationMetrics = vehicles.some(function (item) { return item.mileage !== undefined || item.violations !== undefined || item.accidents !== undefined; });
    var vehicleHeaders = hasOperationMetrics ? ['VIN码', '里程及小时', '违法次数', '事故次数', '临牌号', '牌照有效期'] : ['VIN码', '生产企业/品牌', '型号', '自动驾驶级别', '临牌号', '临牌有效期'];
    var vehicleRows = vehicles.map(function (item) {
      var cells = hasOperationMetrics ? [item.vin, item.mileage, item.violations, item.accidents, item.plate, item.plateExpiry] : [item.vin, item.manufacturer || item.brand, item.model, item.level, item.plate, item.plateExpiry];
      return '<tr>' + cells.map(function (cell) { return '<td>' + esc(cell === undefined || cell === null || cell === '' ? '-' : cell) + '</td>'; }).join('') + '</tr>';
    });
    var personRows = persons.map(function (item) {
      return '<tr><td>' + esc(item.name || '-') + '</td><td>' + esc(item.gender || '-') + '</td><td>' + esc(item.age === undefined ? '-' : item.age) + '</td><td>' + esc(item.unit || '-') + '</td><td>' + esc(item.idType || '-') + '</td><td>' + esc(item.idNo || '-') + '</td></tr>';
    });
    return originalTable(labels.roads + '（' + roads.length + '条）', ['序号', '道路/区域名称', '类型', '状态'], roadRows) +
      originalTable(labels.vehicles + '（' + vehicles.length + '辆）', vehicleHeaders, vehicleRows) +
      originalTable(labels.persons + '（' + persons.length + '人）', ['姓名', '性别', '年龄', '工作单位', '证件类型', '证件号码'], personRows);
  }
  function originalContextHtml(source) {
    var items = [
      { label: '申请编号', value: source.id || '-' },
      { label: '申请类型', value: source.typeLabel || source.type || '-' },
      { label: '申请主体', value: source.company || source.subject || '-' },
      { label: '申请时间', value: source.time || '-' },
      { label: '有效期', value: source.validFrom && source.validFrom !== '-' ? source.validFrom + ' 至 ' + (source.validTo || '-') : (source.applicationTime || '-') }
    ];
    if (source.project) items.push({ label: '项目', value: source.project });
    return '<div class="aaf-original-context">' + items.map(function (item) { return '<div class="aaf-original-context-item"><span>' + esc(item.label) + '</span><strong>' + esc(item.value) + '</strong></div>'; }).join('') + '</div>' + originalEntityTablesHtml(source);
  }
  function originalContentHtml(record, source) {
    return '<details class="aaf-original-content"><summary>原申请内容<span>默认收起，点击展开查看</span></summary><div class="aaf-original-content-body">' + originalContextHtml(source) + originalAttachmentHtml(source, true) + '</div></details>';
  }
  function detailBanner(record, source) {
    var typeLabel = record.typeLabel || record.type || '派生申请';
    return '<div class="aaf-banner"><b>申请类型：' + esc(typeLabel) + '</b><span>关联申请：<strong>' + esc(source.id || record.originalApplicationId || record.origId || '-') + '</strong></span><span>申请主体：' + esc(record.company || source.company || '-') + '</span><span>申请时间：' + esc(record.time || '-') + '</span></div>';
  }
  function formBanner(typeLabel, record, source) {
    return '<div class="aaf-banner"><b>申请类型：' + esc(typeLabel) + '</b><span>关联申请：<strong>' + esc(source.id || record.originalApplicationId || record.origId || '-') + '</strong></span><span>申请主体：' + esc(record.company || source.company || '-') + '</span><span class="aaf-banner-meta">申请时间：提交后生成</span></div>';
  }
  function formOriginalContentHtml(source) {
    return '<details class="aaf-original-content aaf-form-original-content"><summary>原申请内容<span>只读关联，默认收起，点击展开查看</span></summary><div class="aaf-original-content-body">' + originalContextHtml(source) + originalAttachmentHtml(source, true) + '</div></details>';
  }
  function detailSection(title, content) { return '<section class="aaf-section"><h4 class="aaf-section-title">' + esc(title) + '</h4>' + content + '</section>'; }
  function statusTagClass(record) { return window.AccessFlowModel ? window.AccessFlowModel.processInfo(record).cls : record.statusCls || (state.config && state.config.statusMap && state.config.statusMap[record.status] && state.config.statusMap[record.status].cls) || 'ant-tag-default'; }
  function detailModalTitle(label, record) { return label + ' - ' + esc(record.id || '') + '<span class="ant-tag aaf-title-status ' + esc(statusTagClass(record)) + '">' + esc(statusLabel(record)) + '</span>'; }
  function derivedDetailHtml(title, record, source, sections) {
    return '<div class="aaf-detail-layout"><div>' + detailBanner(record, source) + sections.join('') + originalContentHtml(record, source) + detailSection('审批流程进度', flowHtml(record)) + detailSection('流程日志', logsHtml(record)) + '</div></div>';
  }
  function detailHtml(record) {
    var source = originalSource(record);
    return derivedDetailHtml('变更申请', record, source, [detailSection('申请信息', formatChanges(record) + '<div class="aaf-readonly"><div class="aaf-readonly-label">变更原因</div><div class="aaf-readonly-value">' + esc(record.changeReason || '-') + '</div></div>'), detailSection('申请材料', detailFiles(record))]);
  }
  function attachTitleVersionButton(recordId) {
    var right = document.querySelector('#modal-mask .ant-modal-header-right');
    if (!right || !recordId) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ant-btn ant-btn-sm aaf-version-title-btn';
    btn.textContent = '版本演进';
    btn.onclick = function () { api.openVersions(recordId); };
    right.insertBefore(btn, right.querySelector('.ant-modal-close') || null);
  }
  function versions(config, id) {
    var records = typeof config.getVersions === 'function' ? config.getVersions(id) : (config.records || []).filter(function (item) { return item.id === id || item.originalApplicationId === id || item.origId === id; });
    if (!records.length && state.record) records = [state.record];
    return records.slice().sort(function (a, b) { return String(a.time || '').localeCompare(String(b.time || '')); });
  }
  function toast(message) { var old = document.querySelector('.aaf-toast'); if (old) old.remove(); var el = document.createElement('div'); el.className = 'aaf-toast'; el.textContent = message; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200); }
  function getRecord(config, id) { return typeof config.getRecord === 'function' ? config.getRecord(id) : (config.records || []).filter(function (item) { return item.id === id; })[0]; }
  function verifyModalSupport() { return typeof window.openModal === 'function' && typeof window.closeModal === 'function'; }

  function addAttachmentItems() {
    return (state.config && state.config.addVehicleAttachments && state.config.addVehicleAttachments.length)
      ? state.config.addVehicleAttachments
      : [
        { key: 'latestDeclaration', label: '最新安全性自我声明' },
        { key: 'necessity', label: '新增相同配置车辆必要性说明' }
      ];
  }
  function addSource(record) {
    if (state.config && typeof state.config.getSourceRecord === 'function') return state.config.getSourceRecord(record) || record;
    return record;
  }
  function addVehicleKey(vehicle, index) {
    if (state.config && typeof state.config.vehicleKey === 'function') return String(state.config.vehicleKey(vehicle, index));
    return String((vehicle && (vehicle.vin || vehicle.id || vehicle.code)) || index);
  }
  function addVehicleDisplay(vehicle) {
    if (state.config && typeof state.config.formatVehicle === 'function') return state.config.formatVehicle(vehicle) || {};
    return {
      vin: vehicle && vehicle.vin,
      brand: vehicle && (vehicle.brand || vehicle.manufacturer),
      model: vehicle && vehicle.model,
      level: vehicle && vehicle.level
    };
  }
  function addCandidates() {
    var source = state.add && state.add.source;
    var catalogue = state.config && typeof state.config.getVehicleCandidates === 'function' ? state.config.getVehicleCandidates(source, state.record) : [];
    var used = (source && source.vehicles) || [];
    return (catalogue || []).filter(function (vehicle, index) {
      var alreadyInSource = used.some(function (item) { return item && vehicle && item.vin && vehicle.vin && item.vin === vehicle.vin; });
      return !alreadyInSource && (!state.config || typeof state.config.isSameConfiguration !== 'function' || state.config.isSameConfiguration(source, vehicle, index));
    });
  }
  function addVehicleTable() {
    var items = (state.add && state.add.vehicles) || [];
    if (!items.length) return '<tr><td colspan="6" class="aaf-empty-cell">暂未选择新增车辆</td></tr>';
    return items.map(function (vehicle, index) {
      var item = addVehicleDisplay(vehicle);
      return '<tr><td>' + (index + 1) + '</td><td class="text-xs">' + esc(item.vin || '-') + '</td><td>' + esc(item.brand || '-') + '</td><td>' + esc(item.model || '-') + '</td><td>' + esc(item.level || '-') + '</td><td class="col-action"><button type="button" class="ant-btn-link ant-btn-sm danger" onclick="AccessApplyFramework.removeAddVehicle(\'' + js(addVehicleKey(vehicle, index)) + '\')">移除</button></td></tr>';
    }).join('');
  }
  function renderAddVehicleTable() {
    var body = document.getElementById('aaf-add-vehicle-body');
    if (body) body.innerHTML = addVehicleTable();
  }
  function addAttachmentMarkup(item, index) {
    var file = (state.add && state.add.files[item.key]) || '';
    var actions = '<input class="aaf-file-input" id="aaf-add-upload-' + esc(item.key) + '" data-aaf-add-upload="' + esc(item.key) + '" type="file"><button type="button" class="ant-btn ant-btn-sm" onclick="document.getElementById(\'aaf-add-upload-' + js(item.key) + '\').click()">' + (file ? '替换' : '上传文件') + '</button><span class="text-xs ' + (file ? 'text-[#52c41a]' : 'text-[#ff4d4f]') + '">' + (file ? '已上传：' + esc(file) : '未上传文件') + '</span>' + (file ? '<button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.preview(\'' + js(file) + '\')">预览</button><button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.download(\'' + js(file) + '\')">下载</button>' : '');
    return '<div class="aaf-attachment-item" data-aaf-add-attachment="' + esc(item.key) + '"><div class="attachment-row"><div class="attachment-name"><span class="required">*</span><span class="attachment-no">材料' + (index + 1) + '：</span><span>' + esc(item.label) + '</span></div><div class="attachment-file-actions">' + actions + '</div></div><div class="aaf-error" data-aaf-add-attachment-error="' + esc(item.key) + '">请上传' + esc(item.label) + '</div></div>';
  }
  function refreshAddAttachment(key) {
    var modal = document.getElementById('modal-mask');
    var item = byKey(addAttachmentItems(), key);
    var row = modal && modal.querySelector('[data-aaf-add-attachment="' + key + '"]');
    if (!item || !row) return;
    var index = addAttachmentItems().map(function (candidate) { return candidate.key; }).indexOf(key);
    row.outerHTML = addAttachmentMarkup(item, index);
    var input = modal.querySelector('[data-aaf-add-upload="' + key + '"]');
    if (input) input.addEventListener('change', addUploadEvent);
  }
  function addUploadEvent(event) {
    var input = event.target;
    var file = input.files && input.files[0];
    if (!file || !state.add) return;
    state.add.files[input.dataset.aafAddUpload] = file.name;
    refreshAddAttachment(input.dataset.aafAddUpload);
  }
  function addAttachmentEvents() {
    var modal = document.getElementById('modal-mask');
    if (!modal) return;
    modal.querySelectorAll('[data-aaf-add-upload]').forEach(function (input) { input.addEventListener('change', addUploadEvent); });
  }
  function addOriginalInfo(source) {
    var summary = state.config && typeof state.config.getAddVehicleContext === 'function' ? state.config.getAddVehicleContext(source, state.record) : [];
    var rows = (summary || []).map(function (item) {
      return '<div class="aaf-add-context-item"><span>' + esc(item.label) + '</span><strong>' + esc(item.value || '-') + '</strong></div>';
    }).join('');
    return rows ? '<section class="aaf-section"><h4 class="aaf-section-title">原申请信息</h4><div class="aaf-add-context">' + rows + '</div></section>' : '';
  }
  function addVehicleHtml() {
    var source = state.add.source;
    var title = (state.config && state.config.addVehicleTitle) || '新增相同配置车辆';
    return formBanner(title, state.record, source) +
      '<section class="aaf-section"><h4 class="aaf-section-title">申请信息</h4><div class="aaf-subsection"><h5 class="aaf-subsection-title">新增车辆</h5><div class="ant-form-item" style="margin-bottom:0"><div class="ant-form-label"><span class="required">*</span>选择车辆</div><div class="ant-form-control"><div class="aaf-add-vehicle-actions"><button type="button" class="ant-btn ant-btn-sm ant-btn-primary" onclick="AccessApplyFramework.openAddVehicleSelector()">+ 添加车辆</button><span class="aaf-inline-note">候选车辆已按原申请配置筛选</span></div><div class="aaf-table-scroll"><table class="ant-table aaf-add-vehicle-table"><thead><tr><th>序号</th><th>VIN码</th><th>品牌</th><th>型号</th><th>自动驾驶级别</th><th class="col-action">操作</th></tr></thead><tbody id="aaf-add-vehicle-body">' + addVehicleTable() + '</tbody></table></div><div class="aaf-error" data-aaf-add-vehicle-error>请至少选择一辆新增车辆</div></div></div></div><div class="ant-form-item" style="margin-bottom:0"><div class="ant-form-label"><span class="required">*</span>新增车辆数量及必要性说明</div><div class="ant-form-control"><textarea id="aaf-add-reason" class="ant-input" rows="3" placeholder="请输入新增车辆数量及业务必要性说明" style="resize:vertical">' + esc(state.add.reason || '') + '</textarea><div class="aaf-error" data-aaf-add-reason-error>请输入新增车辆数量及必要性说明</div></div></div></section>' +
      '<section class="aaf-section"><h4 class="aaf-section-title">申请材料</h4><div class="aaf-attachment-form"><section class="attachment-group"><div class="attachment-group-title">本次申请文件</div>' + addAttachmentItems().map(addAttachmentMarkup).join('') + '</section></div></section>' + formOriginalContentHtml(source);
  }
  function addVehiclePayload() {
    return {
      originalApplicationId: state.add.source.id || state.record.id,
      vehicles: state.add.vehicles.slice(),
      reason: (document.getElementById('aaf-add-reason') || {}).value ? document.getElementById('aaf-add-reason').value.trim() : '',
      attachments: Object.assign({}, state.add.files)
    };
  }
  function validateAddVehicle() {
    var valid = true;
    var reason = document.getElementById('aaf-add-reason');
    var missingReason = !reason || !reason.value.trim();
    setError('[data-aaf-add-reason-error]', missingReason);
    setError('[data-aaf-add-vehicle-error]', !state.add.vehicles.length);
    valid = valid && !missingReason && !!state.add.vehicles.length;
    addAttachmentItems().forEach(function (item) {
      var missing = !state.add.files[item.key];
      setError('[data-aaf-add-attachment-error="' + item.key + '"]', missing);
      valid = valid && !missing;
    });
    return valid;
  }
  function addDetailAttachmentRows(record) {
    var files = record.attachments || {};
    return addAttachmentItems().map(function (item, index) {
      var file = files[item.key] || '未上传文件';
      var actions = file === '未上传文件' ? '-' : '<button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.preview(\'' + js(file) + '\')">预览</button><button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.download(\'' + js(file) + '\')">下载</button>';
      return '<div class="attachment-row"><span class="attachment-index">材料' + (index + 1) + '</span><span class="attachment-name">' + esc(item.label) + '</span><span class="attachment-source">' + esc(file) + '</span><span class="attachment-actions">' + actions + '</span></div>';
    }).join('');
  }
  function addDetailVehicleTable(record, source) {
    var vehicles = record.addVehicles || record.vehicles || [];
    var originalVehicles = source.vehicles || [];
    var reference = originalVehicles.map(function (vehicle) { var item = addVehicleDisplay(vehicle); return [item.brand, item.model, item.level].filter(Boolean).join(' '); }).filter(Boolean).join('、') || '-';
    var rows = vehicles.length ? vehicles.map(function (vehicle, index) {
      var item = addVehicleDisplay(vehicle);
      return '<tr><td>' + (index + 1) + '</td><td class="text-xs">' + esc(item.vin || '-') + '</td><td>' + esc(item.brand || '-') + '</td><td>' + esc(item.model || '-') + '</td><td>' + esc(item.level || '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="5" class="aaf-empty-cell">暂无新增车辆信息</td></tr>';
    return '<div class="aaf-detail-reference">原申请车辆配置：' + esc(reference) + '</div><div class="aaf-table-scroll"><table class="ant-table aaf-add-vehicle-table"><thead><tr><th>序号</th><th>VIN码</th><th>品牌</th><th>型号</th><th>自动驾驶级别</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function addDetailHtml(record) {
    var source = addSource(record);
    var title = (state.config && state.config.addVehicleTitle) || '新增相同配置车辆';
    return derivedDetailHtml(title, record, source, [detailSection('申请信息', '<section class="aaf-subsection"><h5 class="aaf-subsection-title">新增车辆</h5>' + addDetailVehicleTable(record, source) + '</section><div class="aaf-readonly"><div class="aaf-readonly-label">新增车辆数量及必要性说明</div><div class="aaf-readonly-value">' + esc(record.addReason || record.reason || '-') + '</div></div>'), detailSection('申请材料', '<div class="detail-attachment-panel operate-detail-group aaf-detail-attachments"><section class="attachment-group"><div class="attachment-group-title">本次申请文件</div>' + addDetailAttachmentRows(record) + '</section></div>')]);
  }

  function renewalAttachmentItems() {
    return (state.config && state.config.renewalAttachments && state.config.renewalAttachments.length)
      ? state.config.renewalAttachments
      : [
        { key: 'latestDeclaration', label: '最新安全性自我声明' },
        { key: 'renewalApplication', label: '延期申请书' },
        { key: 'evaluationReport', label: '前期总结评估报告' },
        { key: 'necessity', label: '延期必要性说明' }
      ];
  }
  function renewalSource(record) {
    if (state.config && typeof state.config.getRenewalSource === 'function') return state.config.getRenewalSource(record) || record;
    return record.sourceRecord || record;
  }
  function renewalPeriod(source, record) {
    if (state.config && typeof state.config.getRenewalPeriod === 'function') return state.config.getRenewalPeriod(source, record) || {};
    return { start: source.validFrom || '-', end: source.validTo || '-' };
  }
  function nextDay(value) {
    var date = new Date(String(value || '') + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + 1);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function renewalOriginalInfo(source) {
    var summary = state.config && typeof state.config.getRenewalContext === 'function' ? state.config.getRenewalContext(source, state.record) : [];
    var rows = (summary || []).map(function (item) {
      return '<div class="aaf-add-context-item"><span>' + esc(item.label) + '</span><strong>' + esc(item.value || '-') + '</strong></div>';
    }).join('');
    return rows ? '<section class="aaf-section"><h4 class="aaf-section-title">原申请信息</h4><div class="aaf-add-context">' + rows + '</div></section>' : '';
  }
  function renewalHtml() {
    var source = renewalSource(state.record);
    var period = renewalPeriod(source, state.record);
    var start = nextDay(period.end);
    var title = (state.config && state.config.renewalTitle) || '延期申请';
    var periodLabel = (state.config && state.config.renewalPeriodLabel) || '延期时间段';
    var rule = (state.config && state.config.renewalRuleText) || '须在原申请有效期结束前 3 个月内提出，延期时长一次不超过 6 个月；新结束日期须晚于原截止日期。';
    return formBanner(title, state.record, source) +
      '<section class="aaf-section"><h4 class="aaf-section-title">申请信息</h4><div class="aaf-readonly"><div class="aaf-readonly-label">原申请时间段</div><div class="aaf-readonly-value">' + esc(period.start || '-') + ' 至 ' + esc(period.end || '-') + '</div></div><div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>' + esc(periodLabel) + '</div><div class="ant-form-control"><div class="flex gap-2 items-center"><input id="aaf-renewal-start" class="ant-input" type="date" value="' + esc(start) + '" disabled style="width:120px"><span>至</span><input id="aaf-renewal-end" class="ant-input" type="date" value="' + esc(state.record.renewalEnd || '') + '" style="width:120px"></div><div class="text-xs text-[#00000073] mt-1">' + esc(rule) + '</div><div class="aaf-error" data-aaf-renewal-period-error>请选择符合规则的延期结束日期</div></div></div><div class="ant-form-item" style="margin-bottom:0"><div class="ant-form-label"><span class="required">*</span>延期原因</div><div class="ant-form-control"><input id="aaf-renewal-reason" class="ant-input" value="' + esc(state.record.renewalReason || state.record.reason || '') + '" placeholder="请输入延期原因" style="width:100%"><div class="aaf-error" data-aaf-renewal-reason-error>请输入延期原因</div></div></div></section>' +
      '<section class="aaf-section"><h4 class="aaf-section-title">申请材料</h4><div class="aaf-attachment-form"><section class="attachment-group"><div class="attachment-group-title">本次申请文件</div>' + renewalAttachmentItems().map(attachmentMarkup).join('') + '</section></div></section>' + formOriginalContentHtml(source);
  }
  function renewalPayload() {
    var source = renewalSource(state.record);
    return {
      originalApplicationId: source.id || state.record.originalApplicationId || state.record.id,
      validFrom: (document.getElementById('aaf-renewal-start') || {}).value || '',
      validTo: (document.getElementById('aaf-renewal-end') || {}).value || '',
      renewalReason: (document.getElementById('aaf-renewal-reason') || {}).value ? document.getElementById('aaf-renewal-reason').value.trim() : '',
      attachments: Object.assign({}, state.files)
    };
  }
  function validateRenewal() {
    var source = renewalSource(state.record);
    var period = renewalPeriod(source, state.record);
    var end = document.getElementById('aaf-renewal-end');
    var reason = document.getElementById('aaf-renewal-reason');
    var invalidPeriod = !end || !end.value;
    if (!invalidPeriod) {
      var originalEnd = new Date(String(period.end || '') + 'T00:00:00');
      var requestedEnd = new Date(end.value + 'T00:00:00');
      var maximumEnd = new Date(originalEnd);
      var applicationWindow = new Date(originalEnd);
      var today = state.config && typeof state.config.getRenewalToday === 'function' ? state.config.getRenewalToday(source, state.record) : new Date();
      maximumEnd.setMonth(maximumEnd.getMonth() + 6);
      applicationWindow.setMonth(applicationWindow.getMonth() - 3);
      invalidPeriod = isNaN(originalEnd.getTime()) || requestedEnd <= originalEnd || requestedEnd > maximumEnd || new Date(today) < applicationWindow;
    }
    var missingReason = !reason || !reason.value.trim();
    setError('[data-aaf-renewal-period-error]', invalidPeriod);
    setError('[data-aaf-renewal-reason-error]', missingReason);
    var valid = !invalidPeriod && !missingReason;
    renewalAttachmentItems().forEach(function (item) {
      var missing = !state.files[item.key];
      setError('[data-aaf-attachment-error="' + item.key + '"]', missing);
      valid = valid && !missing;
    });
    return valid;
  }
  function renewalDetailFiles(record, source) {
    var files = record.attachments || {};
    var current = renewalAttachmentItems().map(function (item, index) {
      var file = files[item.key] || '未上传文件';
      var actions = file === '未上传文件' ? '-' : '<button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.preview(\'' + js(file) + '\')">预览</button><button type="button" class="ant-btn-link ant-btn-sm" onclick="AccessApplyFramework.download(\'' + js(file) + '\')">下载</button>';
      return '<div class="attachment-row"><span class="attachment-index">材料' + (index + 1) + '</span><span class="attachment-name">' + esc(item.label) + '</span><span class="attachment-source">' + esc(file) + '</span><span class="attachment-actions">' + actions + '</span></div>';
    }).join('');
    return '<div class="detail-attachment-panel operate-detail-group aaf-detail-attachments"><section class="attachment-group"><div class="attachment-group-title">本次申请文件</div>' + current + '</section></div>';
  }
  function renewalDetailHtml(record) {
    var source = renewalSource(record);
    var sourcePeriod = renewalPeriod(source, record);
    var title = (state.config && state.config.renewalTitle) || '延期申请';
    return derivedDetailHtml(title, record, source, [detailSection('申请信息', '<div class="aaf-readonly"><div class="aaf-readonly-label">原申请时间段</div><div class="aaf-readonly-value">' + esc(sourcePeriod.start || '-') + ' 至 ' + esc(sourcePeriod.end || '-') + '</div></div><div class="aaf-readonly"><div class="aaf-readonly-label">延期时间段</div><div class="aaf-readonly-value">' + esc(record.validFrom || nextDay(sourcePeriod.end) || '-') + ' 至 ' + esc(record.validTo || '-') + '</div></div><div class="aaf-readonly"><div class="aaf-readonly-label">延期原因</div><div class="aaf-readonly-value">' + esc(record.renewalReason || record.reason || '-') + '</div></div>'), detailSection('申请材料', renewalDetailFiles(record, source))]);
  }

  var api = {
    openChange: function (config, recordOrId) {
      if (!verifyModalSupport()) { console.error('AccessApplyFramework requires common.js openModal/closeModal.'); return; }
      state.config = config || {}; state.record = typeof recordOrId === 'object' ? recordOrId : getRecord(state.config, recordOrId); state.selected = {}; state.structured = {}; state.mode = 'change';
      if (!state.record) return;
      state.flowRecord = (state.config.records || []).filter(function (item) { return item.id === state.record.id; })[0] || state.record;
      if (window.AccessFlowModel) window.AccessFlowModel.ensureRecord(state.flowRecord);
      state.correction = !!(window.AccessFlowModel && state.flowRecord.processStatus === 'returning' && state.flowRecord.currentStage === 'applicant_correction');
      prepareStructuredFields();
      window.openModal((state.correction ? '编辑变更申请 - ' : '变更申请 - ') + esc(state.record.id || state.record.originalApplicationId || ''), changeHtml(), { wide: true, fullscreen: true, footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="AccessApplyFramework.submit()">' + (state.correction ? '提交申请' : '提交变更申请') + '</button>', onOpen: function () { attachEvents(); renderStructuredFields(); } });
    },
    openAddVehicle: function (config, recordOrId) {
      if (!verifyModalSupport()) return;
      state.config = config || {}; state.mode = 'add_vehicle';
      state.record = typeof recordOrId === 'object' ? recordOrId : getRecord(state.config, recordOrId);
      if (!state.record) return;
      var source = addSource(state.record);
      state.add = { source: source, vehicles: [], reason: '', files: {} };
      addAttachmentItems().forEach(function (item) { state.add.files[item.key] = ''; });
      window.openModal(((state.config && state.config.addVehicleTitle) || '新增相同配置车辆') + ' - ' + esc(source.id || state.record.id || ''), addVehicleHtml(), { wide: true, fullscreen: true, footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="AccessApplyFramework.submitAddVehicle()">提交申请</button>', onOpen: function () { addAttachmentEvents(); renderAddVehicleTable(); } });
    },
    openRenewal: function (config, recordOrId) {
      if (!verifyModalSupport()) return;
      state.config = config || {}; state.mode = 'renewal';
      state.record = typeof recordOrId === 'object' ? recordOrId : (typeof state.config.getRenewalRecord === 'function' ? state.config.getRenewalRecord(recordOrId) : getRecord(state.config, recordOrId));
      if (!state.record) return;
      state.files = Object.assign({}, state.record.renewalDraftAttachments || {});
      var source = renewalSource(state.record);
      var title = (state.config && state.config.renewalTitle) || '延期申请';
      window.openModal(title + ' - ' + esc(source.id || state.record.id || ''), renewalHtml(), { wide: true, fullscreen: true, footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="AccessApplyFramework.submitRenewal()">提交延期申请</button>', onOpen: attachEvents });
    },
    openAddVehicleSelector: function () {
      if (!state.add || !verifyModalSupport()) return;
      var current = {};
      state.add.vehicles.forEach(function (vehicle, index) { current[addVehicleKey(vehicle, index)] = true; });
      var candidates = addCandidates();
      var rows = candidates.length ? candidates.map(function (vehicle, index) {
        var item = addVehicleDisplay(vehicle);
        var key = addVehicleKey(vehicle, index);
        return '<tr><td><input type="checkbox" class="ant-checkbox" data-aaf-add-candidate="' + esc(key) + '"' + (current[key] ? ' checked' : '') + '></td><td class="text-xs">' + esc(item.vin || '-') + '</td><td>' + esc(item.brand || '-') + '</td><td>' + esc(item.model || '-') + '</td><td>' + esc(item.level || '-') + '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="aaf-empty-cell">暂无与原申请配置一致的候选车辆</td></tr>';
      window.openModal('选择新增车辆', '<div class="aaf-selector-note">仅展示与原申请车辆配置一致且可新增的车辆。</div><div class="aaf-table-scroll"><table class="ant-table"><thead><tr><th><input type="checkbox" class="ant-checkbox" onclick="AccessApplyFramework.toggleAllAddVehicles(this)"></th><th>VIN码</th><th>品牌</th><th>型号</th><th>自动驾驶级别</th></tr></thead><tbody>' + rows + '</tbody></table></div>', { wide: true, footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="AccessApplyFramework.confirmAddVehicleSelection()">确认选择</button>' });
    },
    toggleAllAddVehicles: function (input) { document.querySelectorAll('[data-aaf-add-candidate]').forEach(function (item) { item.checked = input.checked; }); },
    confirmAddVehicleSelection: function () {
      if (!state.add) return;
      var selected = {};
      document.querySelectorAll('[data-aaf-add-candidate]').forEach(function (input) { if (input.checked) selected[input.dataset.aafAddCandidate] = true; });
      state.add.vehicles = addCandidates().filter(function (vehicle, index) { return !!selected[addVehicleKey(vehicle, index)]; });
      window.closeModal();
      renderAddVehicleTable();
    },
    removeAddVehicle: function (key) {
      if (!state.add) return;
      state.add.vehicles = state.add.vehicles.filter(function (vehicle, index) { return addVehicleKey(vehicle, index) !== String(key); });
      renderAddVehicleTable();
    },
    submitAddVehicle: function () {
      if (!state.add || !validateAddVehicle()) return false;
      var payload = addVehiclePayload();
      if (typeof state.config.onSubmitAddVehicle === 'function') { var result = state.config.onSubmitAddVehicle(payload, state.record, state.add.source); if (result === false) return false; }
      toast('新增相同配置车辆申请已提交');
      window.closeModal();
      return true;
    },
    submitRenewal: function () {
      if (!validateRenewal()) return false;
      var payload = renewalPayload();
      if (typeof state.config.onSubmitRenewal === 'function') { var result = state.config.onSubmitRenewal(payload, state.record, renewalSource(state.record)); if (result === false) return false; }
      toast('延期申请已提交'); window.closeModal(); return true;
    },
    openStructured: function (key) {
      var field = byKey(state.config && state.config.fields, key);
      var adapter = fieldAdapter(field);
      if (adapter && typeof adapter.openSelection === 'function') adapter.openSelection(state.record, state);
    },
    getStructuredState: function (key) {
      if (!state.structured[key]) state.structured[key] = {};
      return state.structured[key];
    },
    isStructuredEditing: function (key) {
      return !!document.querySelector('.aaf-structured-editor [onclick*="openStructured(\'' + String(key || '') + '\')"]');
    },
    submit: function () {
      if (!validate()) return false;
      var payload = changePayload();
      if (state.correction) {
        var target = state.flowRecord || state.record;
        target.changeFields = payload.changeFields;
        target.changeReason = payload.changeReason;
        target.attachments = payload.attachments;
        if (typeof state.config.onCorrectionSubmit === 'function') {
          var correctionResult = state.config.onCorrectionSubmit(payload, state.record, target);
          if (correctionResult === false) return false;
        }
        if (window.AccessFlowModel) window.AccessFlowModel.resubmit(target);
        if (typeof window.renderTable === 'function') window.renderTable();
        toast('补正申请已提交，流程已返回' + (window.AccessFlowModel ? window.AccessFlowModel.stageInfo(target).label : '审批环节'));
        window.closeModal();
        return true;
      }
      if (typeof state.config.onSubmit === 'function') { var result = state.config.onSubmit(payload, state.record); if (result === false) return false; }
      toast('变更申请已提交'); window.closeModal(); return true;
    },
    openDetail: function (config, recordOrId) {
      if (!verifyModalSupport()) return;
      state.config = config || {}; state.record = typeof recordOrId === 'object' ? recordOrId : getRecord(state.config, recordOrId); state.mode = 'change';
      if (!state.record) return;
      state.files = Object.assign({}, state.record.attachments || {});
      var detailRecordId = state.record.id;
      window.openModal(detailModalTitle('申请详情', state.record), detailHtml(state.record), { wide: true, fullscreen: true, footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>', onOpen: function () { attachTitleVersionButton(detailRecordId); if (window.MaterialReviewComments) window.MaterialReviewComments.decorateApplicant(document.querySelector('#modal-mask .ant-modal-body'), state.record); } });
    },
    openAddVehicleDetail: function (config, recordOrId) {
      if (!verifyModalSupport()) return;
      state.config = config || {}; state.mode = 'add_vehicle';
      state.record = typeof recordOrId === 'object' ? recordOrId : getRecord(state.config, recordOrId);
      if (!state.record) return;
      var detailRecordId = state.record.id;
      window.openModal(detailModalTitle('申请详情', state.record), addDetailHtml(state.record), { wide: true, fullscreen: true, footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>', onOpen: function () { attachTitleVersionButton(detailRecordId); if (window.MaterialReviewComments) window.MaterialReviewComments.decorateApplicant(document.querySelector('#modal-mask .ant-modal-body'), state.record); } });
    },
    openRenewalDetail: function (config, recordOrId) {
      if (!verifyModalSupport()) return;
      state.config = config || {}; state.mode = 'renewal';
      state.record = typeof recordOrId === 'object' ? recordOrId : getRecord(state.config, recordOrId);
      if (!state.record) return;
      var detailRecordId = state.record.id;
      var title = (state.config && state.config.renewalTitle) || '延期申请';
      window.openModal(detailModalTitle('申请详情', state.record), renewalDetailHtml(state.record), { wide: true, fullscreen: true, footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>', onOpen: function () { attachTitleVersionButton(detailRecordId); if (window.MaterialReviewComments) window.MaterialReviewComments.decorateApplicant(document.querySelector('#modal-mask .ant-modal-body'), state.record); } });
    },
    openVersions: function (id) {
      if (!state.config || !verifyModalSupport()) return;
      var nodes = versions(state.config, id);
      var html = nodes.length ? '<div class="aaf-version-list">' + nodes.map(function (node) { var current = node.id === id; return '<div class="aaf-version-node' + (current ? ' is-current' : '') + '"><div class="aaf-version-head"><button type="button" class="ant-btn-link aaf-version-id" onclick="AccessApplyFramework.openVersionDetail(\'' + js(node.id) + '\')">' + esc(node.id || '-') + '</button><span class="aaf-version-time">' + esc(node.time || '-') + '</span></div><div class="aaf-version-meta">' + esc(node.typeLabel || node.type || '申请') + ' · ' + esc(node.company || node.subject || '-') + ' · ' + esc(statusLabel(node)) + '</div>' + ((node.originalApplicationId || node.origId) ? '<div class="aaf-version-relation">关联原申请：' + esc(node.originalApplicationId || node.origId) + '</div>' : '') + '</div>'; }).join('') + '</div>' : '<div class="aaf-version-empty">暂无版本演进记录</div>';
      window.openModal('版本演进 - ' + esc(id), html, { width: 640, footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
    },
    openVersion: function (config, recordOrId) {
      state.config = config || state.config || {};
      var record = typeof recordOrId === 'object' ? recordOrId : getRecord(state.config, recordOrId);
      api.openVersions(record ? record.id : recordOrId);
    },
    openVersionDetail: function (id) {
      var record = getRecord(state.config, id);
      if (!record) return;
      window.closeModal();
      if (typeof state.config.openVersionDetail === 'function') { state.config.openVersionDetail(id); return; }
      if (state.mode === 'add_vehicle') { api.openAddVehicleDetail(state.config, record); return; }
      api.openDetail(state.config, record);
    },
    preview: function (file) { if (!file) return; window.openModal('附件预览', '<div style="padding:32px 8px;text-align:center;color:#00000073;font-size:14px"><div style="margin-bottom:8px;color:#000000d9">' + esc(file) + '</div><div>此处展示附件预览内容</div></div>', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button><button class="ant-btn ant-btn-primary" onclick="AccessApplyFramework.download(\'' + js(file) + '\')">下载</button>' }); },
    download: function (file) { if (file) toast('已开始下载：' + file); },
    getPayload: changePayload,
    attachmentSchema: DEFAULT_ATTACHMENTS.slice()
  };
  window.AccessApplyFramework = api;
})(window, document);
