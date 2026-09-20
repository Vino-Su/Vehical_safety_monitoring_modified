(function () {
  var files = [];

  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function body() {
    return document.querySelector('#modal-mask .ant-modal-body');
  }

  function input(id) {
    var modalBody = body();
    return modalBody && modalBody.querySelector('#' + id);
  }

  function selectedType() {
    var modalBody = body();
    var selected = modalBody && modalBody.querySelector('input[name="accessReportType"]:checked');
    return selected ? selected.value : 'stage';
  }

  function renderFiles() {
    var list = input('accessReportFileList');
    if (!list) return;
    list.innerHTML = files.map(function (file, index) {
      return '<div class="access-report-file-item"><svg viewBox="0 0 24 24" width="14" height="14" fill="#1677ff"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg><span class="access-report-file-name">' + esc(file.name) + '</span><span class="access-report-file-size">' + esc(file.size) + '</span><button type="button" class="access-report-file-remove" onclick="AccessReportModal.removeFile(' + index + ')" aria-label="移除文件">×</button></div>';
    }).join('');
  }

  function updatePeriod() {
    var period = input('accessReportPeriod');
    if (period) period.style.display = selectedType() === 'stage' ? 'flex' : 'none';
  }

  function updateCount() {
    var remark = input('accessReportRemark');
    var count = input('accessReportRemarkCount');
    if (remark && count) count.textContent = remark.value.length;
  }

  function notify(message) {
    if (typeof window.showToastMsg === 'function') window.showToastMsg(message);
    else if (typeof window.showToast === 'function') window.showToast(message, 'error');
    else window.alert(message);
  }

  function submit() {
    var title = input('accessReportTitle');
    var start = input('accessReportPeriodStart');
    var end = input('accessReportPeriodEnd');
    if (!title || !title.value.trim()) return notify('请输入报告标题');
    if (selectedType() === 'stage') {
      if (!start.value || !end.value) return notify('阶段性报告必须填写报告周期');
      if (start.value > end.value) return notify('报告周期起始日期不能晚于截止日期');
    }
    if (!files.length) return notify('请上传报告文件');
    if (typeof window.closeModal === 'function') window.closeModal();
    notify('报告提交成功');
  }

  function markup(id, type) {
    var stageChecked = type !== 'summary' ? ' checked' : '';
    var summaryChecked = type === 'summary' ? ' checked' : '';
    return '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>申请编号</div><div class="ant-form-control"><input class="ant-input" id="accessReportApplicationId" readonly value="' + esc(id) + '" style="background:#f5f5f5;color:#00000073"></div></div>' +
      '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>报告类型</div><div class="ant-form-control"><div class="access-report-radios"><label><input type="radio" name="accessReportType" value="stage"' + stageChecked + ' onchange="AccessReportModal.updatePeriod()"><span>阶段性报告</span></label><label><input type="radio" name="accessReportType" value="summary"' + summaryChecked + ' onchange="AccessReportModal.updatePeriod()"><span>总结性报告</span></label></div></div></div>' +
      '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>报告标题</div><div class="ant-form-control"><input class="ant-input" id="accessReportTitle" placeholder="请输入报告标题"></div></div>' +
      '<div class="ant-form-item access-report-period" id="accessReportPeriod"><div class="ant-form-label"><span class="required">*</span>报告周期</div><div class="ant-form-control"><div class="access-report-period-inputs"><input class="ant-input" type="date" id="accessReportPeriodStart"><span>~</span><input class="ant-input" type="date" id="accessReportPeriodEnd"></div></div></div>' +
      '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>报告文件</div><div class="ant-form-control"><button type="button" class="access-report-upload" onclick="AccessReportModal.chooseFile()"><svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg><span>点击或拖拽文件至此区域上传（支持 pdf/doc/docx，≤20MB）</span></button><input type="file" id="accessReportFileInput" accept=".pdf,.doc,.docx" style="display:none" onchange="AccessReportModal.selectFile(this)"><div id="accessReportFileList" class="access-report-file-list"></div></div></div>' +
      '<div class="ant-form-item"><div class="ant-form-label">备注</div><div class="ant-form-control"><textarea class="ant-input" id="accessReportRemark" style="height:72px;padding:8px 12px;resize:vertical" placeholder="请输入补充说明（最多 200 字）" maxlength="200" oninput="AccessReportModal.updateCount()"></textarea><div class="access-report-count"><span id="accessReportRemarkCount">0</span> / 200</div></div></div>';
  }

  function addStyles() {
    if (document.getElementById('access-report-modal-styles')) return;
    var style = document.createElement('style');
    style.id = 'access-report-modal-styles';
    style.textContent = '.access-report-radios{display:flex;gap:24px;padding-top:6px}.access-report-radios label{display:flex;align-items:center;cursor:pointer;font-size:14px}.access-report-radios span{margin-left:6px}.access-report-period{display:flex}.access-report-period-inputs{display:flex;gap:4px;align-items:center}.access-report-period-inputs .ant-input{width:50%}.access-report-period-inputs span{color:#00000040}.access-report-upload{width:100%;min-height:96px;border:1px dashed #d9d9d9;background:#fafafa;color:#00000073;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-size:13px;cursor:pointer;transition:border-color .2s,color .2s}.access-report-upload:hover{border-color:#1677ff;color:#1677ff}.access-report-file-list{margin-top:8px}.access-report-file-item{display:flex;align-items:center;gap:8px;min-height:28px;font-size:13px}.access-report-file-name{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#000000d9}.access-report-file-size{color:#00000073;font-size:12px}.access-report-file-remove{margin-left:auto;border:0;background:transparent;color:#ff4d4f;font-size:18px;line-height:1;cursor:pointer}.access-report-count{text-align:right;font-size:12px;color:#00000073;margin-top:4px}';
    document.head.appendChild(style);
  }

  window.AccessReportModal = {
    open: function (id, type) {
      if (typeof window.openModal !== 'function') return;
      files = [];
      addStyles();
      window.openModal('提交报告', markup(id, type), {
        width: 600,
        footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="AccessReportModal.submit()">提交</button>',
        onOpen: updatePeriod
      });
    },
    chooseFile: function () {
      var fileInput = input('accessReportFileInput');
      if (fileInput) fileInput.click();
    },
    selectFile: function (fileInput) {
      if (!fileInput || !fileInput.files || !fileInput.files.length) return;
      Array.prototype.forEach.call(fileInput.files, function (file) {
        files.push({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' });
      });
      fileInput.value = '';
      renderFiles();
    },
    removeFile: function (index) {
      files.splice(index, 1);
      renderFiles();
    },
    updatePeriod: updatePeriod,
    updateCount: updateCount,
    submit: submit
  };

  window.openReportSubmitPage = function (id, type) {
    window.AccessReportModal.open(id, type);
  };
})();
