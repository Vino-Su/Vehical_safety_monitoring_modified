(function () {
  'use strict';

  var registry = window.__plateRegistrationRegistry = window.__plateRegistrationRegistry || {};

  function rawRecord(id) {
    return (window.appData || []).find(function (item) { return item.id === id; }) || null;
  }

  function detailRecord(id) {
    return typeof window.getDetailData === 'function' ? window.getDetailData(id) : rawRecord(id);
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function registrationVehicles(record) {
    var raw = rawRecord(record.id) || {};
    var detail = detailRecord(record.id) || record;
    var vehicles;
    if (record.type === 'initial') vehicles = detail.vehicles || raw.vehicles || [];
    if (record.type === 'add_vehicle') vehicles = raw.addVehicles || detail.addVehicles || raw.vehicles || [];
    if (record.type === 'change') {
      vehicles = (raw.vehicles || detail.vehicles || []).filter(function (vehicle) {
        return vehicle.changeStatus === 'added' || vehicle.source === 'change';
      });
    }
    return (vehicles || []).filter(function (vehicle) { return vehicle && vehicle.vin; });
  }

  function canRegister(record) {
    return !!record && record.status === 'pending_plate' && ['initial', 'change', 'add_vehicle'].indexOf(record.type) > -1 && registrationVehicles(record).length > 0;
  }

  function storedPlate(applicationId, vehicle) {
    return ((registry[applicationId] || {})[vehicle.vin]) || {
      plate: vehicle.plate && vehicle.plate !== '-' ? vehicle.plate : '',
      plateExpiry: vehicle.plateExpiry && vehicle.plateExpiry !== '-' ? vehicle.plateExpiry : ''
    };
  }

  function normalizePlate(value) {
    return String(value || '').replace(/\s/g, '').toUpperCase();
  }

  function isPlateFormatValid(value) {
    return /^[\u4e00-\u9fa5][A-Z][.·]?[A-Z0-9]{4,6}$/.test(value);
  }

  function notify(message) {
    if (typeof window.showToastMsg === 'function') return window.showToastMsg(message);
    if (typeof window.showToast === 'function') return window.showToast(message);
    window.alert(message);
  }

  function syncDetail(applicationId) {
    var body = document.querySelector('#modal-mask .ant-modal-body');
    var raw = rawRecord(applicationId);
    if (!body || !raw) return;

    var values = registry[applicationId] || {};
    Array.prototype.slice.call(body.querySelectorAll('table')).forEach(function (table) {
      var headers = Array.prototype.slice.call(table.querySelectorAll('thead th')).map(function (header) { return header.textContent.trim(); });
      var plateIndex = headers.findIndex(function (header) { return header === '临牌号' || header === '临时牌照号'; });
      var expiryIndex = headers.findIndex(function (header) { return header === '临牌有效期' || header === '牌照有效期' || header === '有效期至' || header === '牌号有效期'; });
      if (plateIndex < 0 || expiryIndex < 0) return;
      Array.prototype.slice.call(table.querySelectorAll('tbody tr')).forEach(function (row) {
        var cells = row.querySelectorAll('td');
        var vin = Array.prototype.slice.call(cells).map(function (cell) { return cell.textContent.trim(); }).find(function (text) { return values[text]; });
        if (!vin) return;
        cells[plateIndex].textContent = values[vin].plate;
        cells[expiryIndex].textContent = values[vin].plateExpiry;
      });
    });

    Array.prototype.slice.call(body.querySelectorAll('button')).forEach(function (button) {
      if (button.textContent.trim() === '更新牌照') button.remove();
    });
    if (raw.status !== 'pending_plate') {
      Array.prototype.slice.call(body.querySelectorAll('.plate-registration-entry')).forEach(function (button) { button.remove(); });
    }
  }

  function addDetailEntry(applicationId) {
    var record = detailRecord(applicationId);
    var body = document.querySelector('#modal-mask .ant-modal-body');
    if (!body) return;
    syncDetail(applicationId);
    if (!canRegister(record) || body.querySelector('.plate-registration-entry')) return;
    var heading = Array.prototype.slice.call(body.querySelectorAll('h4')).find(function (item) {
      return /车辆/.test(item.textContent) && !/申请材料|新增车辆申请材料/.test(item.textContent);
    });
    if (!heading) return;
    var text = heading.textContent;
    heading.classList.add('flex', 'items-center', 'justify-between', 'gap-2');
    heading.innerHTML = '<span>' + escapeHTML(text) + '</span><button type="button" class="ant-btn ant-btn-primary ant-btn-sm plate-registration-entry" onclick="openPlateRegistrationModal(\'' + escapeHTML(applicationId) + '\')">登记临时牌照</button>';
  }

  window.openPlateRegistrationModal = function (applicationId) {
    var record = detailRecord(applicationId);
    var vehicles = registrationVehicles(record || {});
    if (!canRegister(record)) {
      notify('当前申请无需登记临时牌照');
      return;
    }
    var rows = vehicles.map(function (vehicle, index) {
      var saved = storedPlate(applicationId, vehicle);
      return '<tr><td class="col-code">' + (index + 1) + '</td><td class="text-xs col-code">' + escapeHTML(vehicle.vin) + '</td><td>' + escapeHTML(vehicle.manufacturer || vehicle.brand || '-') + '</td><td>' + escapeHTML(vehicle.model || '-') + '</td><td><input class="ant-input plate-registration-number" data-vin="' + escapeHTML(vehicle.vin) + '" value="' + escapeHTML(saved.plate) + '" placeholder="如：鄂F·A001" style="width:140px"></td><td><input type="date" class="ant-input plate-registration-expiry" data-vin="' + escapeHTML(vehicle.vin) + '" value="' + escapeHTML(saved.plateExpiry) + '" style="width:150px"></td></tr>';
    }).join('');
    var html = '<div class="bg-[#fff7e6] border border-[#ffd591] rounded-md px-3 py-2 mb-4 text-sm text-[#000000d9]">请填写本次申请的 ' + vehicles.length + ' 辆车辆临时牌照号和有效期。全部填写并确认后，申请自动生效。</div><div style="overflow-x:auto"><table class="ant-table" style="width:100%;font-size:13px"><thead><tr><th class="col-code">序号</th><th class="col-code">VIN码</th><th>生产企业/品牌</th><th>车辆型号</th><th>临时牌照号</th><th class="col-code">有效期至</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    window.openModal('登记临时牌照 - ' + applicationId, html, {
      wide: true,
      footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmPlateRegistration(\'' + escapeHTML(applicationId) + '\')">确认登记</button>'
    });
  };

  window.confirmPlateRegistration = function (applicationId) {
    var record = detailRecord(applicationId);
    var vehicles = registrationVehicles(record || {});
    var numbers = document.querySelectorAll('.plate-registration-number');
    var expiries = document.querySelectorAll('.plate-registration-expiry');
    var seen = {};
    var next = {};
    for (var index = 0; index < vehicles.length; index += 1) {
      var number = normalizePlate(numbers[index] && numbers[index].value);
      var expiry = expiries[index] && expiries[index].value;
      if (!number || !expiry) {
        notify('请完整填写所有车辆的临时牌照号和有效期');
        return;
      }
      if (!isPlateFormatValid(number)) {
        notify('临时牌照号格式不正确，请按“鄂F·A001”格式填写');
        return;
      }
      if (seen[number]) {
        notify('同一申请内的临时牌照号不能重复');
        return;
      }
      seen[number] = true;
      next[vehicles[index].vin] = { plate: number, plateExpiry: expiry };
    }

    registry[applicationId] = next;
    var raw = rawRecord(applicationId);
    if (raw) {
      raw.status = 'active';
      if (raw.type === 'change' && raw.origId) {
        var source = rawRecord(raw.origId);
        if (source) source.status = 'changed';
      }
    }
    window.closeModal();
    if (typeof window.renderTable === 'function') window.renderTable();
    window.setTimeout(function () { syncDetail(applicationId); }, 0);
    notify('临时牌照登记成功，申请已生效');
  };

  var originalGetOps = window.getOps;
  if (typeof originalGetOps === 'function') {
    window.getOps = function (record) {
      var operations = originalGetOps(record);
      operations = operations.replace(/<button[^>]*>上传牌照<\/button>/g, '');
      if (canRegister(record)) operations += '<button class="ant-btn-link whitespace-nowrap" onclick="openPlateRegistrationModal(\'' + escapeHTML(record.id) + '\')">登记临时牌照</button>';
      return operations;
    };
  }

  var originalOpenDetail = window.openDetail;
  if (typeof originalOpenDetail === 'function') {
    window.openDetail = function (applicationId) {
      var result = originalOpenDetail.apply(this, arguments);
      window.setTimeout(function () { addDetailEntry(applicationId); }, 100);
      return result;
    };
  }
})();
