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
      plateValidFrom: vehicle.plateValidFrom && vehicle.plateValidFrom !== '-' ? vehicle.plateValidFrom : '',
      plateExpiry: vehicle.plateExpiry && vehicle.plateExpiry !== '-' ? vehicle.plateExpiry : '',
      photo: !!vehicle.platePhoto
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
        cells[expiryIndex].textContent = values[vin].plateValidFrom ? values[vin].plateValidFrom + ' 至 ' + values[vin].plateExpiry : values[vin].plateExpiry;
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

  function platePhotoSvg(plateText) {
    var text = String(plateText || '鄂F·A0001');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="140">'
      + '<rect width="440" height="140" rx="10" fill="#1677ff"/>'
      + '<rect x="8" y="8" width="424" height="124" rx="6" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>'
      + '<text x="220" y="52" text-anchor="middle" font-size="20" fill="rgba(255,255,255,.85)" font-family="sans-serif">临 时 行 驶 车 牌 照</text>'
      + '<text x="220" y="106" text-anchor="middle" font-size="44" font-weight="bold" fill="#ffffff" font-family="sans-serif">' + text + '</text>'
      + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  window.markPlateRegistrationPhoto = function (vin) {
    var numberInput = document.querySelector('.plate-registration-number[data-vin="' + vin + '"]');
    var plate = numberInput ? String(numberInput.value || '').trim() : '';
    if (!plate) plate = '鄂F·A0001';
    var cell = document.querySelector('.plate-registration-photo[data-vin="' + vin + '"]');
    if (cell) {
      cell.dataset.uploaded = 'true';
      cell.dataset.plate = plate;
      cell.innerHTML = '<img src="' + platePhotoSvg(plate) + '" alt="牌照照片" title="点击查看大图" style="width:56px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #f0f0f0;cursor:zoom-in;display:inline-block" onclick="previewPlatePhoto(\'' + escapeHTML(vin) + '\')">';
    }
  };

  window.previewPlatePhoto = function (vin) {
    var cell = document.querySelector('.plate-registration-photo[data-vin="' + vin + '"]');
    var plate = cell && cell.dataset.plate ? cell.dataset.plate : '鄂F·A0001';
    window.openModal('牌照照片 - ' + vin, '<div style="text-align:center"><img src="' + platePhotoSvg(plate) + '" alt="牌照照片" style="max-width:100%;border-radius:8px;border:1px solid #f0f0f0"><div style="margin-top:8px;font-size:12px;color:#00000073">牌照照片预览（演示图，实际以上传文件为准）</div></div>', { footer: '<button class="ant-btn" onclick="closeModal()">关闭</button>' });
  };

  window.openPlateRegistrationModal = function (applicationId) {
    var record = detailRecord(applicationId);
    var vehicles = registrationVehicles(record || {});
    if (!canRegister(record)) {
      notify('当前申请无需登记临时牌照');
      return;
    }
    var rows = vehicles.map(function (vehicle, index) {
      var saved = storedPlate(applicationId, vehicle);
      var photoCell = saved.photo
        ? '<img src="' + platePhotoSvg(saved.plate || '鄂F·A0001') + '" alt="牌照照片" title="点击查看大图" style="width:56px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #f0f0f0;cursor:zoom-in;display:inline-block" onclick="previewPlatePhoto(\'' + escapeHTML(vehicle.vin) + '\')">'
        : '<span class="text-xs text-[#ff4d4f]">未上传</span> <button type="button" class="ant-btn-link ant-btn-sm" onclick="markPlateRegistrationPhoto(\'' + escapeHTML(vehicle.vin) + '\')">上传</button>';
      return '<tr><td class="col-code">' + (index + 1) + '</td><td class="text-xs col-code">' + escapeHTML(vehicle.vin) + '</td><td>' + escapeHTML(vehicle.model || '-') + '</td><td><input class="ant-input plate-registration-number" data-vin="' + escapeHTML(vehicle.vin) + '" value="' + escapeHTML(saved.plate) + '" placeholder="如：鄂F·A001" style="width:140px"></td><td><input type="date" class="ant-input plate-registration-start" data-vin="' + escapeHTML(vehicle.vin) + '" value="' + escapeHTML(saved.plateValidFrom) + '" style="width:125px"> <span class="text-[#00000073]">至</span> <input type="date" class="ant-input plate-registration-end" data-vin="' + escapeHTML(vehicle.vin) + '" value="' + escapeHTML(saved.plateExpiry) + '" style="width:125px"></td><td><span class="plate-registration-photo" data-vin="' + escapeHTML(vehicle.vin) + '" data-uploaded="' + (saved.photo ? 'true' : 'false') + '" data-plate="' + escapeHTML(saved.plate || '') + '">' + photoCell + '</span></td></tr>';
    }).join('');
    var html = '<div class="bg-[#fff7e6] border border-[#ffd591] rounded-md px-3 py-2 mb-4 text-sm text-[#000000d9]">请填写本次申请的 ' + vehicles.length + ' 辆车辆临时牌照号、有效期（起止日期）并上传牌照照片。全部完成并确认后，申请自动生效。</div><div style="overflow-x:auto"><table class="ant-table" style="width:100%;font-size:13px"><thead><tr><th class="col-code">序号</th><th class="col-code">VIN码</th><th>车辆型号</th><th>临时牌照号</th><th class="col-code">有效期</th><th class="col-code">牌照照片</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    window.openModal('登记临时牌照 - ' + applicationId, html, {
      wide: true,
      footer: '<button class="ant-btn" onclick="closeModal()">取消</button><button class="ant-btn ant-btn-primary" onclick="confirmPlateRegistration(\'' + escapeHTML(applicationId) + '\')">确认登记</button>'
    });
  };

  window.confirmPlateRegistration = function (applicationId) {
    var record = detailRecord(applicationId);
    var vehicles = registrationVehicles(record || {});
    var numbers = document.querySelectorAll('.plate-registration-number');
    var starts = document.querySelectorAll('.plate-registration-start');
    var ends = document.querySelectorAll('.plate-registration-end');
    var photos = document.querySelectorAll('.plate-registration-photo');
    var seen = {};
    var next = {};
    for (var index = 0; index < vehicles.length; index += 1) {
      var number = normalizePlate(numbers[index] && numbers[index].value);
      var start = starts[index] && starts[index].value;
      var end = ends[index] && ends[index].value;
      var photoUploaded = photos[index] && photos[index].dataset.uploaded === 'true';
      if (!number || !start || !end) {
        notify('请完整填写所有车辆的临时牌照号和有效期起止日期');
        return;
      }
      if (start >= end) {
        notify('有效期起须早于有效期止');
        return;
      }
      if (!photoUploaded) {
        notify('请上传所有车辆的牌照照片（JPG/PNG）');
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
      next[vehicles[index].vin] = { plate: number, plateValidFrom: start, plateExpiry: end, photo: true };
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
