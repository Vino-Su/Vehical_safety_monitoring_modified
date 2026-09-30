const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {}, URLSearchParams, location: { search: '' }, localStorage: { getItem: () => null } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../03-高保真页面/components/access-flow-model.js'), 'utf8'), context);
const flow = context.window.AccessFlowModel;

for (const type of ['initial', 'add_vehicle']) {
  for (const stage of ['committee_review', 'expert_review', 'meeting_review']) {
    const record = { type, processStatus: 'processing', currentStage: stage, flowLogs: [] };
    assert.equal(flow.returnTarget(record), 'third_party_review');
    flow.reject(record, '重新核查');
    assert.equal(record.processStatus, 'returning');
    assert.equal(record.currentStage, 'third_party_review');
    assert.equal(record.flowLogs.at(-1).returnToStage, 'third_party_review');
    flow.pass(record, '重新初审通过');
    assert.equal(record.processStatus, 'processing');
    assert.equal(record.currentStage, 'committee_review');
    assert.equal(record.flowLogs.find(log => log.eventType === 'stage_returned').closed, true);
    flow.pass(record, '专班通过');
    assert.equal(record.currentStage, 'expert_review');
    flow.pass(record, '专家通过');
    assert.equal(record.currentStage, 'meeting_review');
  }
}

for (const type of ['renewal', 'change']) {
  const record = { type, processStatus: 'processing', currentStage: 'committee_confirm', flowLogs: [] };
  flow.reject(record, '重新核查');
  assert.equal(record.currentStage, 'third_party_review');
  flow.pass(record, '重新初审通过');
  assert.equal(record.currentStage, 'committee_confirm');
}

const initialReview = { type: 'initial', processStatus: 'processing', currentStage: 'third_party_review', flowLogs: [] };
flow.reject(initialReview, '补正');
assert.equal(initialReview.currentStage, 'applicant_correction');

const plateReview = { type: 'initial', processStatus: 'approved', currentStage: 'plate_confirmation', flowLogs: [] };
flow.reject(plateReview, '修改');
assert.equal(plateReview.currentStage, 'plate_correction');

console.log('Approval return routing: 10 cases passed');
