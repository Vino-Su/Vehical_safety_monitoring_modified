(function () {
  'use strict';

  var processStatusMap = {
    draft: { label: '草稿', cls: 'ant-tag-default' },
    processing: { label: '审批中', cls: 'ant-tag-processing' },
    returning: { label: '退回处理中', cls: 'ant-tag-warning' },
    approved: { label: '已通过', cls: 'ant-tag-success' },
    active: { label: '已生效', cls: 'ant-tag-success' },
    withdrawn: { label: '已撤回', cls: 'ant-tag-default' },
    expired: { label: '已过期', cls: 'ant-tag-default' },
    changed: { label: '已变更', cls: 'ant-tag-blue' },
    terminated: { label: '已终止', cls: 'ant-tag-error' }
  };
  var stageMap = {
    draft_edit: { label: '草稿编辑', role: 'enterprise' },
    applicant_correction: { label: '申请主体补正', role: 'enterprise' },
    third_party_review: { label: '第三方初审', role: 'third-party' },
    committee_review: { label: '专班办公室审核', role: 'workgroup' },
    expert_review: { label: '专家评审', role: 'expert' },
    meeting_review: { label: '专题会审议', role: 'workgroup' },
    committee_confirm: { label: '专班审核确认', role: 'workgroup' },
    plate_upload: { label: '牌照上传', role: 'enterprise' },
    plate_confirmation: { label: '牌照确认', role: 'third-party' },
    plate_correction: { label: '牌照修改', role: 'enterprise' },
    completed: { label: '流程完成', role: '' }
  };
  var legacyStageMap = {
    pending_review: 'third_party_review',
    pending_committee: 'committee_review',
    pending_expert: 'expert_review',
    pending_meeting: 'meeting_review',
    pending_committee_confirm: 'committee_confirm',
    pending_plate: 'plate_upload',
    pending_plate_review: 'plate_confirmation',
    plate_rejected: 'plate_correction',
    done: 'completed'
  };
  var stageLegacyMap = {
    draft_edit: 'draft',
    applicant_correction: 'rejected',
    third_party_review: 'pending_review',
    committee_review: 'pending_committee',
    expert_review: 'pending_expert',
    meeting_review: 'pending_meeting',
    committee_confirm: 'pending_committee_confirm',
    plate_upload: 'pending_plate',
    plate_confirmation: 'pending_plate_review',
    plate_correction: 'plate_rejected',
    completed: 'done'
  };
  var handlers = {
    draft_edit: '申请主体', applicant_correction: '申请主体', third_party_review: '第三方服务机构',
    committee_review: '专班办公室', expert_review: '专家评审组', meeting_review: '市工作专班',
    committee_confirm: '市工作专班', plate_upload: '申请主体', plate_confirmation: '第三方服务机构',
    plate_correction: '申请主体', completed: '-'
  };

  function typeOf(record) { return record.type || record.subType || 'initial'; }
  function isFullApproval(record) { var type = typeOf(record); return type === 'initial' || type === 'add_vehicle'; }
  function approvalPath(record) {
    return isFullApproval(record)
      ? ['third_party_review', 'committee_review', 'expert_review', 'meeting_review']
      : ['third_party_review', 'committee_confirm'];
  }
  function needsPlate(record) {
    if (record.requiresPlate !== undefined) return !!record.requiresPlate;
    var type = typeOf(record);
    var changeFields = record.changeFields || [];
    var changesVehicles = Array.isArray(changeFields) ? changeFields.indexOf('vehicles') > -1 : !!changeFields.vehicles;
    return type === 'initial' || type === 'add_vehicle' || (type === 'change' && changesVehicles);
  }
  function legacyProcess(record, stage) {
    var status = record.status;
    if (status === 'draft') return 'draft';
    if (status === 'rejected' || status === 'plate_rejected') return 'returning';
    if (status === 'pending_plate' || status === 'pending_plate_review') return 'approved';
    if (status === 'processing' || String(status || '').indexOf('pending_') === 0) return 'processing';
    if (status === 'passed') return stage === 'plate_upload' || stage === 'plate_confirmation' ? 'approved' : 'active';
    return processStatusMap[status] ? status : 'processing';
  }
  function inferStage(record) {
    var stage = legacyStageMap[record.node] || legacyStageMap[record.status];
    if (!stage && record.status === 'draft') stage = 'draft_edit';
    if (!stage && record.status === 'rejected') stage = 'applicant_correction';
    if (!stage && ['active', 'expired', 'changed', 'terminated', 'withdrawn', 'passed'].indexOf(record.status) > -1) stage = 'completed';
    if (!stage) stage = 'third_party_review';
    if (typeOf(record) === 'add_vehicle' && stage === 'committee_confirm') stage = 'committee_review';
    if ((typeOf(record) === 'renewal' || typeOf(record) === 'change') && ['committee_review', 'expert_review', 'meeting_review'].indexOf(stage) > -1) stage = 'committee_confirm';
    return stage;
  }
  function makeId(prefix) { return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000); }
  function latestReturn(record) {
    var logs = record.flowLogs || [];
    for (var i = logs.length - 1; i >= 0; i--) {
      if (logs[i].eventType === 'stage_returned' && !logs[i].closed) return logs[i];
    }
    return null;
  }
  function ensureDefaultLogs(record) {
    if (Array.isArray(record.flowLogs) && record.flowLogs.length) return;
    var path = approvalPath(record), stage = record.currentStage, currentIndex = path.indexOf(stage), logs = [];
    if (record.processStatus !== 'draft') logs.push({ eventId: makeId('submitted'), eventType: 'submitted', stage: 'draft_edit', result: 'submitted', handler: record.company || '申请主体', handledAt: record.time || '-', opinion: '提交申请' });
    for (var i = 0; i < path.length; i++) {
      if (currentIndex > i || ['approved', 'active', 'expired', 'changed', 'terminated'].indexOf(record.processStatus) > -1) {
        logs.push({ eventId: makeId('passed'), eventType: 'stage_passed', stageInstanceId: path[i] + '_round_1', stage: path[i], round: 1, result: 'passed', handler: handlers[path[i]], handledAt: record.time || '-', opinion: '审核结论：通过' });
      }
    }
    if (record.processStatus === 'returning') {
      var from = record.returnedFromStage || (stage === 'plate_correction' ? 'plate_confirmation' : 'third_party_review');
      logs.push({ eventId: makeId('returned'), eventType: 'stage_returned', returnCycleId: makeId('return_cycle'), stageInstanceId: from + '_round_1', stage: from, round: 1, result: 'returned', handler: handlers[from], handledAt: record.time || '-', opinion: record.returnReason || record.plateReviewReason || '请根据退回意见补充完善后重新提交。', returnToStage: stage, closed: false });
    }
    record.flowLogs = logs;
  }
  function ensureRecord(record) {
    if (!record) return record;
    var stage = record.currentStage || inferStage(record);
    record.currentStage = stage;
    record.processStatus = record.processStatus || legacyProcess(record, stage);
    ensureDefaultLogs(record);
    return record;
  }
  function ensureAll(records) { (records || []).forEach(ensureRecord); return records || []; }
  function info(map, key) { return map[key] || { label: key || '-', cls: 'ant-tag-default', role: '' }; }
  function processInfo(record) { ensureRecord(record); return info(processStatusMap, record.processStatus); }
  function stageInfo(record) { ensureRecord(record); return info(stageMap, record.currentStage); }
  function returnHint(record) {
    ensureRecord(record); var log = latestReturn(record);
    if (record.processStatus === 'returning' && log) return '由' + info(stageMap, log.stage).label + '退回';
    return (record.flowLogs || []).some(function (item) { return item.eventType === 'stage_returned'; }) ? '曾退回' : '';
  }
  function closeReturn(record, destination) {
    var log = latestReturn(record);
    if (!log) return;
    log.closed = true;
    record.flowLogs.push({ eventId: makeId('return_closed'), eventType: 'return_cycle_closed', returnCycleId: log.returnCycleId, stage: record.currentStage, result: 'resubmitted', handler: handlers[record.currentStage], handledAt: '2026-09-10 15:30:00', opinion: '补正或重新审核完成，已提交至' + info(stageMap, destination).label });
  }
  function syncLegacy(record) {
    record.node = stageLegacyMap[record.currentStage] || 'done';
    if (record.processStatus === 'draft') record.status = 'draft';
    else if (record.processStatus === 'returning') record.status = record.currentStage === 'plate_correction' ? 'plate_rejected' : 'rejected';
    else if (record.processStatus === 'approved') record.status = record.currentStage === 'plate_confirmation' ? 'pending_plate_review' : 'pending_plate';
    else if (record.processStatus === 'processing') record.status = record.node;
    else if (record.processStatus === 'active') record.status = 'active';
    else record.status = record.processStatus;
  }
  function pass(record, opinion) {
    ensureRecord(record);
    var openReturn = latestReturn(record), destination;
    record.flowLogs.push({ eventId: makeId('passed'), eventType: 'stage_passed', stageInstanceId: record.currentStage + '_round_' + ((record.flowLogs || []).filter(function (l) { return l.stage === record.currentStage; }).length + 1), stage: record.currentStage, result: 'passed', handler: handlers[record.currentStage], handledAt: '2026-09-10 15:30:00', opinion: opinion || '审核结论：通过' });
    if (openReturn && openReturn.stage !== record.currentStage) destination = openReturn.stage;
    else {
      var path = approvalPath(record), index = path.indexOf(record.currentStage);
      destination = index > -1 && index < path.length - 1 ? path[index + 1] : '';
    }
    if (destination) { closeReturn(record, destination); record.processStatus = 'processing'; record.currentStage = destination; }
    else if (record.currentStage === 'plate_confirmation') { record.processStatus = 'active'; record.currentStage = 'completed'; }
    else if (needsPlate(record)) { record.processStatus = 'approved'; record.currentStage = 'plate_upload'; }
    else { record.processStatus = 'active'; record.currentStage = 'completed'; }
    syncLegacy(record); return record;
  }
  function reject(record, opinion) {
    ensureRecord(record);
    var path = approvalPath(record), index = path.indexOf(record.currentStage), target;
    if (record.currentStage === 'plate_confirmation') target = 'plate_correction';
    else target = index <= 0 ? 'applicant_correction' : path[index - 1];
    record.flowLogs.push({ eventId: makeId('returned'), eventType: 'stage_returned', returnCycleId: makeId('return_cycle'), stageInstanceId: record.currentStage + '_round_' + ((record.flowLogs || []).filter(function (l) { return l.stage === record.currentStage; }).length + 1), stage: record.currentStage, round: 1, result: 'returned', handler: handlers[record.currentStage], handledAt: '2026-09-10 15:30:00', opinion: opinion || '请补充完善后重新提交。', returnToStage: target, closed: false });
    record.processStatus = 'returning'; record.returnedFromStage = record.currentStage; record.currentStage = target; syncLegacy(record); return record;
  }
  function resubmit(record) {
    ensureRecord(record); var log = latestReturn(record);
    var destination = log ? log.stage : (record.currentStage === 'plate_correction' ? 'plate_confirmation' : 'third_party_review');
    closeReturn(record, destination); record.processStatus = destination === 'plate_confirmation' ? 'approved' : 'processing'; record.currentStage = destination; syncLegacy(record); return record;
  }
  function stages(record) {
    ensureRecord(record); var result = approvalPath(record).slice();
    if (needsPlate(record) || ['plate_upload', 'plate_confirmation', 'plate_correction'].indexOf(record.currentStage) > -1) result.push('plate_upload', 'plate_confirmation');
    return result;
  }
  function progress(record) {
    ensureRecord(record); var list = stages(record), current = record.currentStage, openReturn = latestReturn(record);
    var currentIndex = list.indexOf(current), completed = record.currentStage === 'completed';
    return list.map(function (stage, index) {
      var returned = openReturn && openReturn.stage === stage;
      return { label: info(stageMap, stage).label, done: completed || (currentIndex > index && !returned), current: stage === current, error: !!returned };
    });
  }
  function displayLogs(record) {
    ensureRecord(record); var logs = (record.flowLogs || []).map(function (item) {
      var returned = item.eventType === 'stage_returned', closed = item.eventType === 'return_cycle_closed', submitted = item.eventType === 'submitted';
      return { title: submitted ? '提交申请' : closed ? '退回闭环' : info(stageMap, item.stage).label, handler: item.handler || handlers[item.stage] || '-', time: item.handledAt || '-', opinion: item.opinion || '', status: returned ? '已退回' : closed ? '已闭环' : '已处理', color: returned ? '#ff4d4f' : '#52c41a', dot: returned ? '×' : '✓', tagCls: returned ? 'ant-tag-error' : 'ant-tag-success', attach: item.attachment || '' };
    });
    if (record.currentStage !== 'completed') logs.push({ title: info(stageMap, record.currentStage).label, handler: handlers[record.currentStage] || '-', time: '待处理', opinion: returnHint(record), status: record.processStatus === 'returning' ? '退回处理中' : '处理中', color: record.processStatus === 'returning' ? '#fa8c16' : '#1677ff', dot: '●', tagCls: record.processStatus === 'returning' ? 'ant-tag-warning' : 'ant-tag-processing' });
    return logs;
  }
  function currentRole() {
    var role = new URLSearchParams(location.search).get('role') || localStorage.getItem('platform_role') || 'admin';
    if (role === 'third_party' || role === 'third_auditor') role = 'third-party';
    return role;
  }
  function canHandle(record, role) {
    ensureRecord(record); role = role || currentRole();
    if (role === 'admin') return ['applicant_correction', 'plate_upload', 'plate_correction', 'completed'].indexOf(record.currentStage) === -1;
    return info(stageMap, record.currentStage).role === role;
  }

  window.AccessFlowModel = {
    processStatusMap: processStatusMap, stageMap: stageMap, ensureRecord: ensureRecord, ensureAll: ensureAll,
    processInfo: processInfo, stageInfo: stageInfo, returnHint: returnHint, latestReturn: latestReturn,
    isFullApproval: isFullApproval, approvalPath: approvalPath, needsPlate: needsPlate, pass: pass, reject: reject,
    resubmit: resubmit, progress: progress, displayLogs: displayLogs, syncLegacy: syncLegacy, currentRole: currentRole,
    canHandle: canHandle
  };
})();
