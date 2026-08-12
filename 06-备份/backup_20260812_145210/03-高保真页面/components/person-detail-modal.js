(function () {
  var personArchiveData = {
    '刘建国': { company: 'A公司', regTime: '2026-03-15 10:30', licenseType: 'A1', drivingYears: '18年', firstLicenseDate: '2008-06-12', trainingHours: '96', remoteHours: '168' },
    '孙丽华': { company: 'B公司', regTime: '2026-03-18 14:20', licenseType: 'C1', drivingYears: '16年', firstLicenseDate: '2010-09-08', trainingHours: '72', remoteHours: '126' },
    '周明': { company: 'D公司', regTime: '2026-03-22 16:45', licenseType: 'A2', drivingYears: '22年', firstLicenseDate: '2004-05-20', trainingHours: '108', remoteHours: '184' },
    '吴芳': { company: '上海E公司', regTime: '2026-03-25 11:00', licenseType: 'C1', drivingYears: '17年', firstLicenseDate: '2009-03-15', trainingHours: '80', remoteHours: '142' },
    '郑伟': { company: 'C公司', regTime: '2026-03-28 09:30', licenseType: 'B1', drivingYears: '19年', firstLicenseDate: '2007-07-22', trainingHours: '88', remoteHours: '156' }
  };

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escapeJs(value) {
    return String(value === undefined || value === null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function descriptionRow(labelA, valueA, labelB, valueB) {
    return '<div class="ant-descriptions-row"><div class="ant-descriptions-label">' + labelA + '</div><div class="ant-descriptions-value">' + valueA + '</div><div class="ant-descriptions-label">' + labelB + '</div><div class="ant-descriptions-value">' + valueB + '</div></div>';
  }

  function section(title) {
    return '<h4 class="text-sm font-semibold text-[#000000d9] mb-3 mt-4 pb-2 border-b border-[#f0f0f0]">' + title + '</h4>';
  }

  function archiveFile(fileName) {
    return '<button type="button" class="ant-btn-link ant-btn-sm" onclick="return personArchivePreview(\'' + escapeJs(fileName) + '\')">' + escapeHtml(fileName) + '</button>';
  }

  function personTypeTags(personType) {
    var types = String(personType || '测试人员').split(/[、,，/]/).map(function (type) { return type.trim(); }).filter(Boolean);
    if (!types.length) types = ['测试人员'];
    return types.map(function (type) { return '<span class="ant-tag ant-tag-default text-[10px] mr-1">' + escapeHtml(type) + '</span>'; }).join('');
  }

  window.personArchivePreview = function (fileName) {
    if (typeof window.openModal !== 'function') return false;
    var safeName = escapeHtml(fileName);
    window.openModal('档案附件 - ' + safeName, '<div class="py-8 text-center text-sm text-[#00000073]"><div class="text-[#000000d9] mb-1">' + safeName + '</div><div>此处展示人员档案附件预览内容</div></div>', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
    return false;
  };

  window.openPersonInformation = function (name, gender, age, idNo, personType) {
    if (typeof window.openModal !== 'function') return;
    var archive = personArchiveData[name] || {};
    var safeName = escapeHtml(name);
    var safeGender = escapeHtml(gender || '—');
    var safeAge = escapeHtml(age || '—');
    var safeIdNo = escapeHtml(idNo || '—');
    var typeText = String(personType || '测试人员');
    var hasSafetyInfo = /安全员|远程操控员/.test(typeText);
    var company = escapeHtml(archive.company || '—');
    var html = '<div class="ant-descriptions">';

    html += '<h4 class="text-sm font-semibold text-[#000000d9] mb-3 pb-2 border-b border-[#f0f0f0]">基本信息</h4>';
    html += descriptionRow('姓名', safeName, '性别', safeGender);
    html += descriptionRow('身份证号', '<span class="font-mono text-xs">' + safeIdNo + '</span>', '年龄', safeAge + '岁');
    html += descriptionRow('身份证附件', archiveFile('身份证-' + name + '.pdf'), '所属企业', company);
    html += descriptionRow('登记时间', escapeHtml(archive.regTime || '—'), '', '');

    html += section('驾驶资质信息');
    html += descriptionRow('驾照类型', escapeHtml(archive.licenseType || '—'), '驾龄', escapeHtml(archive.drivingYears || '—'));
    html += descriptionRow('初次领证日期', escapeHtml(archive.firstLicenseDate || '—'), '机动车驾驶证附件', archiveFile('驾驶证-' + name + '.pdf'));
    html += descriptionRow('安全驾驶证明', archiveFile('安全驾驶证明-' + name + '.pdf'), '', '');

    html += section('人员类型信息');
    html += descriptionRow('人员类型', personTypeTags(typeText), '', '');

    html += section('交通违法与事故记录');
    html += descriptionRow('最近1年内严重交通违法行为', '无', '严重交通违法行为类型', '—（无记录）');
    html += descriptionRow('有无酒驾/醉驾/精神药品记录', '无', '连续3个记分周期未记满12分承诺', '是');
    html += descriptionRow('记分周期合规承诺书', archiveFile('记分周期承诺书-' + name + '.pdf'), '交管记分查询证明', archiveFile('交管记分查询证明-' + name + '.pdf'));
    html += descriptionRow('有无交通事故记录', '无', '致人死亡或重伤交通事故记录', '无');

    html += section('培训与资质信息');
    html += descriptionRow('是否熟悉自动驾驶测试评价规程', '是', '是否掌握道路测试操作方法', '是');
    html += descriptionRow('是否具备应急处理能力', '是', '劳动合同或劳务合同', archiveFile('劳动合同-' + name + '.pdf'));
    html += descriptionRow('培训记录', archiveFile('培训记录-' + name + '.pdf'), '', '');

    if (hasSafetyInfo) {
      html += section('自动驾驶安全员/远程操控员额外信息');
      html += descriptionRow('专业技能培训时长（小时）', escapeHtml(archive.trainingHours || '—'), '远程操控操作时长（小时）', escapeHtml(archive.remoteHours || '—'));
      html += descriptionRow('专业技能培训证明', archiveFile('专业技能培训证明-' + name + '.pdf'), '远程操控操作证明', archiveFile('远程操控操作证明-' + name + '.pdf'));
    }

    html += '</div>';
    window.openModal('人员详情 - ' + safeName, html, { wide: true, width: 900, maxHeight: '85vh', maskClosable: false, footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
  };
})();
