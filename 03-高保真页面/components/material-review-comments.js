(function (window, document) {
  'use strict';

  var STORAGE_KEY = 'access-approval-material-comments-v1';
  var MAX_LENGTH = 2000;
  var DEMO_HISTORY = {
    RT202604003: [{ round: 1, items: [{ materialId: '材料2', materialName: '道路测试车辆自动驾驶功能等级声明', content: '声明中的自动驾驶等级与申请车辆配置不一致，请更正后重新提交。' }] }],
    DA202604003: [{ round: 1, items: [{ materialId: '材料2', materialName: '变更理由及必要性说明', content: '请补充变更路段与测试人员调整的必要性说明。' }] }],
    DO202604003: [{ round: 1, items: [{ materialId: '材料2', materialName: '变更理由及必要性说明', content: '请补充商业化试点项目负责人变更后的授权证明。' }] }]
  };

  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function js(value) { return String(value === undefined || value === null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function key(value) { return String(value || '').trim(); }
  function readStore() {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeStore(store) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (e) { /* prototype fallback */ }
  }
  function cloneItems(items) {
    return (items || []).map(function (item) {
      return { materialId: key(item.materialId || item.id), materialName: item.materialName || item.name || '-', content: item.content || '' };
    }).filter(function (item) { return item.materialId && item.content; });
  }
  function recordData(record) {
    record = record || {};
    var appId = key(record.id || record.applicationId);
    var store = readStore()[appId] || {};
    var current = cloneItems(record.materialComments || store.current || []);
    var history = Array.isArray(record.materialCommentHistory) ? record.materialCommentHistory : (store.history || []);
    if (!history.length && DEMO_HISTORY[appId]) history = DEMO_HISTORY[appId];
    return { appId: appId, current: current, history: history.slice() };
  }
  function currentItem(record, materialId) {
    var id = key(materialId);
    return recordData(record).current.filter(function (item) { return item.materialId === id; })[0] || null;
  }
  function latestHistory(record) {
    var history = recordData(record).history;
    return history.length ? history[history.length - 1] : null;
  }
  function persist(record, current, history) {
    var appId = key(record && (record.id || record.applicationId));
    if (!appId) return;
    var store = readStore();
    store[appId] = { current: cloneItems(current), history: history || [] };
    writeStore(store);
    if (record) {
      record.materialComments = cloneItems(current);
      record.materialCommentHistory = (history || []).slice();
    }
  }
  function isThirdPartyReview(node) { return node === 'pending_review' || node === 'third_party_review'; }
  function notify(message, type) {
    if (typeof window.showToast === 'function') { window.showToast(message, type || 'info'); return; }
    if (typeof window.showToastMsg === 'function') { window.showToastMsg(message); return; }
    window.alert(message);
  }
  function save(record, materialId, materialName, content) {
    var value = String(content || '').trim();
    if (!value) { notify('请填写批注内容', 'warning'); return false; }
    if (value.length > MAX_LENGTH) { notify('批注内容不能超过2000字', 'warning'); return false; }
    var data = recordData(record);
    var item = { materialId: key(materialId), materialName: materialName || '-', content: value };
    var found = false;
    data.current = data.current.map(function (candidate) { if (candidate.materialId === item.materialId) { found = true; return item; } return candidate; });
    if (!found) data.current.push(item);
    persist(record, data.current, data.history);
    return true;
  }
  function remove(record, materialId) {
    var data = recordData(record);
    data.current = data.current.filter(function (item) { return item.materialId !== key(materialId); });
    persist(record, data.current, data.history);
  }
  function archiveCurrent(record) {
    var data = recordData(record);
    if (!data.current.length) return [];
    var history = data.history;
    history.push({ round: history.length + 1, items: cloneItems(data.current) });
    persist(record, [], history);
    return history;
  }
  function clearCurrent(record) {
    var data = recordData(record);
    persist(record, [], data.history);
  }
  function issueListHtml(record, title) {
    var latest = latestHistory(record);
    var items = latest ? cloneItems(latest.items) : [];
    if (!items.length) return '';
    return '<div class="material-review-log-list"><div class="material-review-log-title">' + esc(title || '问题清单') + '</div>' + items.map(function (item) { return '<div class="material-review-log-row"><span>' + esc(item.materialId) + '：' + esc(item.materialName) + '</span><span>' + esc(item.content) + '</span></div>'; }).join('') + '</div>';
  }
  function historyHtml(record, materialId, materialName) {
    var item = null;
    var history = recordData(record).history;
    for (var i = history.length - 1; i >= 0 && !item; i--) {
      item = cloneItems(history[i].items).filter(function (candidate) { return candidate.materialId === key(materialId); })[0] || null;
    }
    if (!item) return '<div class="material-review-empty">暂无历史批注</div>';
    return '<div class="material-review-history"><div class="material-review-history-title">' + esc(materialName || item.materialName) + '</div><div class="material-review-history-content">' + esc(item.content) + '</div></div>';
  }
  function openHistory(record, materialId, materialName) {
    window.openModal('历史批注', historyHtml(record, materialId, materialName), { width: 520, footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
  }
  function historyItems(record, materialId) {
    var id = key(materialId), result = [];
    recordData(record).history.forEach(function (round) {
      cloneItems(round.items).forEach(function (item) {
        if (item.materialId === id) result.push({ round: round.round || result.length + 1, content: item.content });
      });
    });
    return result;
  }
  function reviewHtml(record, materialId, materialName) {
    var current = currentItem(record, materialId), history = historyItems(record, materialId), h = '<div class="material-review-review"><div class="material-review-material">' + esc(materialId) + '：' + esc(materialName || '-') + '</div>';
    if (current) h += '<section class="material-review-section"><div class="material-review-section-title">本轮批注</div><div class="material-review-content">' + esc(current.content) + '</div></section>';
    if (history.length) h += '<section class="material-review-section"><div class="material-review-section-title">历史批注</div>' + history.slice().reverse().map(function (item) { return '<div class="material-review-history-item"><span>第' + esc(item.round) + '轮</span><p>' + esc(item.content) + '</p></div>'; }).join('') + '</section>';
    if (!current && !history.length) h += '<div class="material-review-empty">暂无批注</div>';
    return h + '</div>';
  }
  function openReview(record, materialId, materialName, editable) {
    var current = currentItem(record, materialId), footer = '<button class="ant-btn" onclick="closeModal()">关闭</button>';
    if (editable && current) footer = '<button class="ant-btn ant-btn-danger" onclick="MaterialReviewComments.deleteFromReview(\'' + js(record.id) + '\',\'' + js(materialId) + '\')">删除</button><button class="ant-btn ant-btn-primary" onclick="MaterialReviewComments.editFromReview(\'' + js(record.id) + '\',\'' + js(materialId) + '\',\'' + js(materialName) + '\')">编辑批注</button>' + footer;
    window.openModal(current ? '材料批注' : '历史批注', reviewHtml(record, materialId, materialName), { width: 560, footer: footer });
  }
  function openEditor(record, materialId, materialName, onSaved) {
    var existing = currentItem(record, materialId);
    var body = '<div class="material-review-editor"><div class="material-review-material">' + esc(materialId) + '：' + esc(materialName || '-') + '</div><label class="material-review-label" for="materialReviewComment">问题说明 <span class="text-[#ff4d4f]">*</span></label><textarea id="materialReviewComment" class="ant-input" rows="5" maxlength="2000" placeholder="请输入该材料存在的问题">' + esc(existing ? existing.content : '') + '</textarea><div class="material-review-count"><span>仅填写需要申请主体修改的问题</span><span id="materialReviewCount">' + (existing ? existing.content.length : 0) + '/2000</span></div></div>';
    window.openModal(existing ? '编辑批注' : '材料批注', body, { width: 560, footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" id="materialReviewSave">保存批注</button>', onOpen: function () {
      var textarea = document.getElementById('materialReviewComment');
      var counter = document.getElementById('materialReviewCount');
      if (textarea) textarea.addEventListener('input', function () { if (counter) counter.textContent = textarea.value.length + '/2000'; });
      var button = document.getElementById('materialReviewSave');
      if (button) button.onclick = function () {
        if (!save(record, materialId, materialName, textarea && textarea.value)) return;
        window.closeModal();
        if (typeof onSaved === 'function') onSaved();
        notify('批注已保存', 'success');
      };
    } });
  }
  function controls(item, record, options) {
    options = options || {};
    var materialId = key(item.materialId || item.id || item.label);
    var materialName = item.materialName || item.name || item.label || '-';
    var current = currentItem(record, materialId);
    var history = latestHistory(record);
    var hasHistory = history && cloneItems(history.items).some(function (candidate) { return candidate.materialId === materialId; });
    var h = '<span class="material-review-actions">';
    if (isThirdPartyReview(record && record.node) && options.editable !== false) {
      if (current) h += '<button type="button" class="ant-btn-link ant-btn-sm material-review-entry is-commented" onclick="MaterialReviewComments.showReview(\'' + js(record.id) + '\',\'' + js(materialId) + '\',\'' + js(materialName) + '\',true)">已批注</button>';
      else if (hasHistory) h += '<button type="button" class="ant-btn-link ant-btn-sm material-review-entry" onclick="MaterialReviewComments.showReview(\'' + js(record.id) + '\',\'' + js(materialId) + '\',\'' + js(materialName) + '\',true)">历史批注</button>';
      else h += '<button type="button" class="ant-btn-link ant-btn-sm material-review-entry" onclick="MaterialReviewComments.editCurrent(\'' + js(record.id) + '\',\'' + js(materialId) + '\',\'' + js(materialName) + '\')">批注</button>';
    }
    h += '</span>';
    return h;
  }
  function getRecordById(id) { return window.currentApproveData && key(window.currentApproveData.id) === key(id) ? window.currentApproveData : (window.appData || []).filter(function (item) { return key(item.id) === key(id); })[0] || { id: id }; }
  function refreshApproval(container, record) {
    if (!container) return;
    container.querySelectorAll('[data-material-review-row]').forEach(function (row) {
      var actions = row.querySelector('.material-review-actions-slot');
      if (!actions) return;
      actions.innerHTML = controls({ materialId: row.dataset.materialId, materialName: row.dataset.materialName }, record, { editable: true });
    });
    var summary = container.querySelector('.approval-comment-summary') || document.querySelector('#modal-mask .approval-comment-summary');
    if (summary) summary.textContent = '已标注问题：' + recordData(record).current.length + ' 项';
  }
  function decorateApplicant(container, record) {
    if (!container || !record) return;
    var latest = latestHistory(record);
    container.querySelectorAll('.attachment-row').forEach(function (row, index) {
      if (row.querySelector('.material-review-history-link')) return;
      var materialId = row.dataset.materialId || row.querySelector('.attachment-index,.attachment-no') && row.querySelector('.attachment-index,.attachment-no').textContent.replace(/[：:]/g, '').trim() || '材料' + (index + 1);
      var nameNode = row.querySelector('.attachment-name');
      var materialName = row.dataset.materialName || (nameNode ? nameNode.textContent.replace(/^材料\d+：?/, '').trim() : '申请材料');
      var has = latest && cloneItems(latest.items).some(function (item) { return item.materialId === materialId || item.materialName === materialName; });
      if (!has) return;
      var target = row.querySelector('.attachment-actions,.attachment-file-actions') || row;
      target.insertAdjacentHTML('beforeend', '<button type="button" class="ant-btn-link ant-btn-sm material-review-history-link" onclick="MaterialReviewComments.showHistory(\'' + js(record.id) + '\',\'' + js(materialId) + '\',\'' + js(materialName) + '\')">历史批注</button>');
    });
  }
  window.MaterialReviewComments = {
    maxLength: MAX_LENGTH,
    isThirdPartyReview: isThirdPartyReview,
    getCurrent: function (record) { return recordData(record).current; },
    getHistory: function (record) { return recordData(record).history; },
    renderControls: controls,
    editCurrent: function (id, materialId, materialName) { var record = getRecordById(id); openEditor(record, materialId, materialName, function () { refreshApproval(document.querySelector('#modal-mask .ant-modal-body'), record); }); },
    deleteCurrent: function (id, materialId) { var record = getRecordById(id); if (!window.confirm('确认删除该材料批注？')) return; remove(record, materialId); refreshApproval(document.querySelector('#modal-mask .ant-modal-body'), record); notify('批注已删除', 'success'); },
    showHistory: function (id, materialId, materialName) { openHistory(getRecordById(id), materialId, materialName); },
    showReview: function (id, materialId, materialName, editable) { openReview(getRecordById(id), materialId, materialName, editable === true); },
    editFromReview: function (id, materialId, materialName) { window.closeModal(); window.setTimeout(function () { api.editCurrent(id, materialId, materialName); }, 30); },
    deleteFromReview: function (id, materialId) { window.closeModal(); window.setTimeout(function () { api.deleteCurrent(id, materialId); }, 30); },
    archiveCurrent: archiveCurrent,
    clearCurrent: clearCurrent,
    renderIssueList: issueListHtml,
    refreshApproval: refreshApproval,
    decorateApplicant: decorateApplicant,
    hasCurrent: function (record) { return recordData(record).current.length > 0; }
  };
})(window, document);
