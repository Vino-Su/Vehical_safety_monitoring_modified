(function () {
  'use strict';

  var app = document.querySelector('.cockpit-root');
  if (!app) return;

  var ROAD_EXPAND_ZOOM = 13;
  var VEHICLE_EXPAND_ZOOM = 13;
  var ROAD_PAGE_SIZE = 10;
  var APPLICATION_PAGE_SIZE = 8;
  var INCIDENT_PAGE_SIZE = 8;
  var ACCIDENT_PAGE_SIZE = 8;
  var ACCIDENT_YEAR = new Date().getFullYear();
  var state = { selectedArea: null, selectedVehicleId: null, modalOpen: false, modalType: null, map: null, mapLayers: {}, roadMode: false, roadFilter: 'all', roadArea: 'all', roadPage: 1, roadViewMode: null, roadData: [], applicationFilter: 'all', applicationPage: 1, applicationDateFrom: '', applicationDateTo: '', vehicleMode: true, vehicleFilter: 'all', vehicleViewMode: null, vehicleData: [], vehicleSearch: '', incidentMode: false, incidentFilter: 'total', incidentRange: '本年', incidentViewMode: null, incidentListFilter: 'total', incidentListPage: 1, incidentDateFrom: '', incidentDateTo: '', accidentMode: false, accidentRange: '本年', accidentViewMode: null, accidentData: [], accidentPage: 1, accidentDateFrom: '', accidentDateTo: '' };
  var trajectoryState = { vehicleId: null, points: [], currentIndex: 0, currentTime: null, playing: false, speed: 1, timer: null, playbackDate: '', startTime: '08:00:00', endTime: '14:32:00', line: null, passedLine: null, marker: null };
  var cockpitVehicleIndex = {};
  var palette = ['#00cfe8', '#1677ff', '#fa8c16', '#9254de', '#ff6b9b'];
  var vehiclePalette = ['#00cfe8', '#1677ff', '#748390'];
  var chartData = {
    application: {
      labels: ['初次申请', '延期申请', '变更申请', '续期同车型申请'], values: [40, 35, 20, 16], total: 131,
      selected: { 'road-test': ['道路测试', 125], 'demo-apply': ['示范应用', 3], commercial: ['商业化试点', 3] }
    },
    vehicle: {
      labels: ['人工驾驶', '自动驾驶', '离线'], values: [42, 83, 3], total: 128,
      selected: { all: ['车辆总数', 128], online: ['在线车辆', 125], mileage: ['累计里程', 3] }
    },
    incident: {
      labels: ['临牌有效期', '电子围栏越界', '测试时段合规性'], values: [16, 24, 14], total: 54,
      selected: { total: ['事件总数', 54], warning: ['预警事件', 45], alarm: ['告警事件', 9] }
    }
  };
  var incidentRangeData = {
    '本月': { total: 54, warning: 45, alarm: 9 },
    '本年': { total: 128, warning: 101, alarm: 27 },
    '全部': { total: 246, warning: 188, alarm: 58 }
  };
  var applicationCategories = [
    { key: 'all', label: '申请总数', count: 128 },
    { key: 'road-test', label: '道路测试', count: 100 },
    { key: 'demo-apply', label: '示范应用', count: 14 },
    { key: 'commercial', label: '商业化试点', count: 14 }
  ];
  var applicationRows = [{ id: 'DA202605004', category: 'demo-apply', type: '初次申请', vehicles: 4, status: '审批中', stage: '第三方初审', date: '2026-05-09' }];
  applicationCategories.slice(1).forEach(function (category) {
    var prefix = category.key === 'road-test' ? 'RT' : (category.key === 'demo-apply' ? 'DA' : 'DO');
    var start = category.key === 'demo-apply' ? 2 : 1;
    for (var index = start; index <= category.count; index++) {
      var day = String(index % 28 + 1).padStart(2, '0');
      var month = String(index % 4 + 3).padStart(2, '0');
      applicationRows.push({ id: prefix + '2026' + month + String(index).padStart(3, '0'), category: category.key,
        type: ['初次申请', '延期申请', '变更申请'][index % 3], vehicles: index % 5 + 1,
        status: ['审批中', '已生效', '退回处理中'][index % 3],
        stage: ['第三方初审', '流程完成', '申请主体补正'][index % 3], date: '2026-' + month + '-' + day });
    }
  });
  applicationRows.sort(function (a, b) { return b.date.localeCompare(a.date) || b.id.localeCompare(a.id); });
  var vehicleListRows = [
    { plate: 'DA202605004', company: '道路测试', application: '初次申请', mode: '自动驾驶', speed: 29, status: 'online', lastReport: '09-21 18:23:38' },
    { plate: '鄂F·A001', company: '襄阳智行科技', application: '道路测试', mode: '人工驾驶', speed: 42, status: 'online', lastReport: '09-21 18:23:21' },
    { plate: '鄂F·A002', company: '襄阳智行科技', application: '道路测试', mode: '自动驾驶', speed: 36, status: 'online', lastReport: '09-21 18:23:16' },
    { plate: '鄂F·A003', company: '汉江智能出行', application: '示范应用', mode: '自动驾驶', speed: 18, status: 'online', lastReport: '09-21 18:22:57' },
    { plate: '鄂F·A004', company: '襄阳智行科技', application: '道路测试', mode: '自动驾驶', speed: 51, status: 'online', lastReport: '09-21 18:22:41' },
    { plate: '鄂F·A005', company: '汉江智能出行', application: '示范应用', mode: '人工驾驶', speed: 27, status: 'online', lastReport: '09-21 18:22:32' },
    { plate: '鄂F·A006', company: '东津无人配送', application: '商业化试点', mode: '自动驾驶', speed: 12, status: 'online', lastReport: '09-21 18:22:10' },
    { plate: '鄂F·A007', company: '东津无人配送', application: '商业化试点', mode: '自动驾驶', speed: 0, status: 'offline', lastReport: '09-21 18:18:44' },
    { plate: '鄂F·A008', company: '汉江智能出行', application: '示范应用', mode: '人工驾驶', speed: 33, status: 'online', lastReport: '09-21 18:21:58' },
    { plate: '鄂F·A009', company: '襄阳智行科技', application: '道路测试', mode: '自动驾驶', speed: 24, status: 'online', lastReport: '09-21 18:21:39' }
  ];
  var incidentRows = [];
  var incidentTypes = ['车速超限', '通信中断', '电子围栏越界', '临牌有效期', '非规定时段测试', '路径规划异常'];
  var incidentDescriptions = ['车辆运行速度超过当前道路限速', '车载终端连续未上报有效数据', '车辆驶入限制区域', '临时牌照已超过有效期限', '车辆在非规定测试时段运行', '自动驾驶路径规划出现异常'];
  var incidentVehicles = [
    ['鄂F·A001', '襄阳智行科技'], ['鄂F·A002', '襄阳智行科技'], ['鄂F·A003', '汉江智能出行'],
    ['鄂F·A004', '襄阳智行科技'], ['鄂F·A005', '汉江智能出行'], ['鄂F·A006', '东津无人配送'],
    ['鄂F·A007', '东津无人配送'], ['鄂F·A008', '汉江智能出行'], ['鄂F·A009', '襄阳智行科技']
  ];
  for (var incidentIndex = 0; incidentIndex < 36; incidentIndex++) {
    var incidentDate = new Date(2026, 8 - (incidentIndex % 9), 1 + (incidentIndex * 3) % 26, 8 + (incidentIndex % 10), 12 + (incidentIndex * 7) % 48, 10 + (incidentIndex * 11) % 48);
    var incidentCategory = incidentIndex % 3 === 0 ? 'alarm' : 'warning';
    var incidentVehicle = incidentVehicles[incidentIndex % incidentVehicles.length];
    var incidentTypeIndex = incidentIndex % incidentTypes.length;
    incidentRows.push({
      id: 'EW01-' + incidentDate.getFullYear() + String(incidentDate.getMonth() + 1).padStart(2, '0') + '-' + String(incidentIndex + 1).padStart(3, '0'),
      category: incidentCategory, plate: incidentVehicle[0], company: incidentVehicle[1], type: incidentTypes[incidentTypeIndex],
      description: incidentDescriptions[incidentTypeIndex], date: incidentDate.toISOString().slice(0, 10),
      time: [String(incidentDate.getHours()).padStart(2, '0'), String(incidentDate.getMinutes()).padStart(2, '0'), String(incidentDate.getSeconds()).padStart(2, '0')].join(':'),
      status: incidentIndex % 4 === 0 ? '待处理' : (incidentIndex % 4 === 1 ? '处理中' : '已完成')
    });
  }
  incidentRows.sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });

  function setDonut(type, key) {
    var data = chartData[type];
    var total = data.total;
    var selected = data.selected[key] || data.selected[Object.keys(data.selected)[0]];
    var chart = document.getElementById(type + '-donut');
    var totalEl = document.getElementById(type + '-total');
    var labelEl = document.getElementById(type + '-total-label');
    var legend = document.getElementById(type + '-legend');
    if (!chart || !totalEl || !legend) return;
    var values = data.values.slice();
    var ratio = Math.max(0.16, Math.min(1, selected[1] / total));
    if (key !== Object.keys(data.selected)[0]) {
      values = values.map(function (value, index) { return index === 0 ? Math.round(value * ratio) : value; });
    }
    var sum = values.reduce(function (a, b) { return a + b; }, 0);
    var colors = type === 'vehicle' ? vehiclePalette : palette;
    var cursor = 0;
    var stops = values.map(function (value, index) {
      var start = (cursor / sum) * 100; cursor += value; var end = (cursor / sum) * 100;
      return colors[index] + ' ' + start.toFixed(2) + '% ' + end.toFixed(2) + '%';
    }).join(', ');
    chart.style.setProperty('--donut', 'conic-gradient(' + stops + ')');
    totalEl.textContent = selected[1].toLocaleString('zh-CN');
    labelEl.textContent = selected[0];
    legend.innerHTML = data.labels.map(function (label, index) {
      var value = values[index]; var percent = ((value / sum) * 100).toFixed(1);
      return '<div class="legend-item"><i style="background:' + colors[index] + '"></i><span>' + label + '</span><b>' + percent + '%</b></div>';
    }).join('');
  }

  function bindMetricTiles() {
    document.querySelectorAll('.metric-tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        var group = tile.closest('[data-metric-group]');
        if (!group) return;
        group.querySelectorAll('.metric-tile').forEach(function (other) { other.classList.remove('is-selected'); other.setAttribute('aria-pressed', 'false'); });
        tile.classList.add('is-selected'); tile.setAttribute('aria-pressed', 'true');
        var chartType = tile.dataset.chart; if (chartType) setDonut(chartType, tile.dataset.key);
        if (chartType === 'vehicle') {
          state.vehicleFilter = tile.dataset.key || 'all';
          if (!state.vehicleMode) setVehicleModuleSelected(true); else updateVehicleView(true);
        }
        if (chartType === 'incident') {
          state.incidentFilter = tile.dataset.key || 'total';
          if (!state.incidentMode) setIncidentModuleSelected(true); else updateIncidentView(true);
        }
      });
    });
  }

  function bindRangeTabs() {
    document.querySelectorAll('.range-tabs').forEach(function (group) {
      group.querySelectorAll('button').forEach(function (button) {
        button.addEventListener('click', function () {
          group.querySelectorAll('button').forEach(function (other) { other.classList.remove('is-active'); });
          button.classList.add('is-active');
          if (group.dataset.range === 'incident') setIncidentRange(button.textContent.trim());
          if (group.dataset.range === 'accident') setAccidentRange(button.textContent.trim());
        });
      });
    });
  }

  function renderEvents() {
    var list = document.getElementById('event-list'); if (!list) return;
    var events = [
      ['XY001', '车速超限', '05-11 14:28:30', 'kind-alarm'],
      ['XY001', '通信中断', '05-11 14:28:30', 'kind-warning'],
      ['XY003', '临牌已过期上路', '05-11 14:27:18', 'kind-alarm'],
      ['XY005', '电子围栏越界', '05-11 14:25:04', 'kind-warning'],
      ['XY006', '非规定时段测试作业', '05-11 14:22:47', 'kind-warning'],
      ['XY007', '车速超限', '05-11 14:18:36', 'kind-alarm']
    ];
    var rows = events.map(function (event) {
      return '<div class="event-row event-list-row" role="row"><span class="plate">' + event[0] + '</span><span class="event-kind ' + event[3] + '"><i></i>' + event[1] + '</span><span class="event-time">' + event[2] + '</span></div>';
    }).join('');
    var duplicateRows = events.slice(0, 5).map(function (event) {
      return '<div class="event-row event-list-row" aria-hidden="true"><span class="plate">' + event[0] + '</span><span class="event-kind ' + event[3] + '"><i></i>' + event[1] + '</span><span class="event-time">' + event[2] + '</span></div>';
    }).join('');
    list.innerHTML = '<div class="event-list-track">' + rows + duplicateRows + '</div>';
    var track = list.firstElementChild;
    var step = 0;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    track.addEventListener('transitionend', function (event) {
      if (event.propertyName !== 'transform' || step !== events.length) return;
      track.style.transition = 'none';
      step = 0;
      track.style.setProperty('--event-step', step);
      track.offsetHeight;
      track.style.transition = '';
    });
    window.setInterval(function () {
      if (events.length <= 5 || reducedMotion.matches || document.hidden || state.modalOpen || list.matches(':hover, :focus-within')) return;
      step++;
      track.style.setProperty('--event-step', step);
    }, 8000);
  }

  function updateClock() {
    var now = new Date();
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(function (v) { return String(v).padStart(2, '0'); }).join(':');
    var timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.textContent = time;
  }

  function openAreaModal(area, count) {
    state.selectedArea = area; state.modalOpen = true; state.modalType = 'area';
    var overlay = document.getElementById('overlay-root'); var title = document.getElementById('modal-title'); var body = document.getElementById('modal-body'); var kicker = document.getElementById('modal-kicker'); var action = document.getElementById('modal-action');
    overlay.querySelector('.detail-modal').classList.remove('is-road-list', 'is-application-list', 'is-vehicle-list', 'is-incident-list');
    kicker.hidden = false; kicker.textContent = '区域下钻'; action.textContent = '查看车辆清单';
    var ghost = overlay.querySelector('.ghost-button'); if (ghost) ghost.hidden = false;
    title.textContent = area + ' · 车辆分布';
    body.innerHTML = '<div class="modal-summary"><div class="summary-cell"><span>车辆总数</span><strong>' + count + '</strong></div><div class="summary-cell"><span>在线车辆</span><strong>' + Math.max(1, count - 1) + '</strong></div><div class="summary-cell"><span>异常事件</span><strong>' + (area === '襄州区' ? 2 : 1) + '</strong></div></div><p class="modal-note">当前已切换至' + area + '下钻视图。车辆状态、异常事件与实时轨迹将按区域筛选；返回驾驶舱后保留全市视角。</p>';
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    var close = overlay.querySelector('[data-overlay-close]'); if (close) close.focus();
  }
  function roadListRows() {
    return state.roadData.reduce(function (rows, area) {
      return rows.concat((area.segments || []).map(function (segment) {
        return { name: segment.name, area: area.name, level: segment.lanes >= 6 ? '主干道' : '次干道', lanes: segment.lanes, length: segment.length, status: segment.status, period: '08:00-18:00', scenes: (segment.scenes || []).join(' / ') };
      }));
    }, []);
  }
  function setRoadFilterSelection(filter) {
    state.roadFilter = filter;
    var module = document.getElementById('road-resource-module');
    if (module) module.querySelectorAll('.road-filter').forEach(function (tile) {
      var selected = tile.dataset.roadFilter === filter;
      tile.classList.toggle('is-selected', selected); tile.setAttribute('aria-pressed', String(selected));
    });
    if (state.roadMode) updateRoadView(true);
  }
  function roadListFilteredRows() {
    return roadListRows().filter(function (row) {
      var statusMatch = state.roadFilter === 'all' || row.status === state.roadFilter;
      var areaMatch = state.roadArea === 'all' || row.area === state.roadArea;
      return statusMatch && areaMatch;
    });
  }
  function renderRoadListModal() {
    var body = document.getElementById('modal-body');
    if (!body) return;
    var filter = state.roadFilter || 'all';
    var rows = roadListFilteredRows();
    var totalPages = Math.max(1, Math.ceil(rows.length / ROAD_PAGE_SIZE));
    state.roadPage = Math.min(Math.max(1, state.roadPage || 1), totalPages);
    var pageRows = rows.slice((state.roadPage - 1) * ROAD_PAGE_SIZE, state.roadPage * ROAD_PAGE_SIZE);
    var totals = state.roadData.reduce(function (result, area) { result.all += area.roadCount; result.open += area.openCount; result.paused += area.pausedCount; return result; }, { all: 0, open: 0, paused: 0 });
    var summary = [['all', '路段总数', totals.all], ['open', '开放道路', totals.open], ['paused', '暂停道路', totals.paused]];
    var areaOptions = '<option value="all"' + (state.roadArea === 'all' ? ' selected' : '') + '>全部区域</option>' + state.roadData.map(function (area) {
      return '<option value="' + area.name + '"' + (state.roadArea === area.name ? ' selected' : '') + '>' + area.name + '</option>';
    }).join('');
    var pageButtons = '';
    for (var page = 1; page <= totalPages; page++) {
      pageButtons += '<button type="button" class="road-page-btn' + (page === state.roadPage ? ' is-active' : '') + '" data-road-page="' + page + '" aria-label="第 ' + page + ' 页"' + (page === state.roadPage ? ' aria-current="page"' : '') + '>' + page + '</button>';
    }
    body.innerHTML = '<div class="road-modal-summary" role="tablist" aria-label="道路状态筛选">' + summary.map(function (item) {
      var active = item[0] === filter ? ' is-selected' : '';
      return '<button type="button" class="road-summary-filter' + active + ' ' + item[0] + '" data-modal-road-filter="' + item[0] + '" role="tab" aria-selected="' + (item[0] === filter) + '"><span>' + item[1] + '</span><strong>' + item[2] + '</strong></button>';
    }).join('') + '</div><div class="road-list-meta"><label class="road-area-filter"><span>所属区域</span><select data-road-area aria-label="按所属区域筛选道路">' + areaOptions + '</select></label></div><div class="road-table-wrap"><table class="road-list-table"><thead><tr><th>道路名称</th><th>所属区域</th><th>道路等级</th><th class="number-cell">车道数</th><th>开放状态</th><th>开放时段</th><th>适用业务场景</th></tr></thead><tbody>' + (pageRows.length ? pageRows.map(function (row) {
      return '<tr><td title="' + row.name + '">' + row.name + '</td><td>' + row.area + '</td><td>' + row.level + '</td><td class="number-cell">' + row.lanes + '</td><td><span class="road-status ' + row.status + '"><i></i>' + roadStatusLabel(row.status) + '</span></td><td>' + row.period + '</td><td title="' + row.scenes + '">' + row.scenes + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="road-list-empty">当前筛选条件下暂无道路</td></tr>') + '</tbody></table></div><div class="road-pagination"><span class="road-page-total">共 <b>' + rows.length + '</b> 条</span><div class="road-page-controls"><button type="button" class="road-page-btn road-page-arrow" data-road-page="prev" aria-label="上一页"' + (state.roadPage <= 1 ? ' disabled' : '') + '>‹</button>' + pageButtons + '<button type="button" class="road-page-btn road-page-arrow" data-road-page="next" aria-label="下一页"' + (state.roadPage >= totalPages ? ' disabled' : '') + '>›</button></div></div>';
  }
  function openRoadListModal() {
    state.modalOpen = true; state.modalType = 'road';
    var overlay = document.getElementById('overlay-root'); var modal = overlay.querySelector('.detail-modal');
    var kicker = document.getElementById('modal-kicker');
    modal.classList.remove('is-application-list', 'is-vehicle-list', 'is-incident-list');
    kicker.textContent = ''; kicker.hidden = true;
    document.getElementById('modal-title').textContent = '道路列表';
    document.getElementById('modal-action').textContent = '关闭';
    var ghost = overlay.querySelector('.ghost-button'); if (ghost) ghost.hidden = true;
    modal.classList.add('is-road-list');
    state.roadPage = 1;
    renderRoadListModal();
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    var close = overlay.querySelector('[data-overlay-close]'); if (close) close.focus();
  }
  function applicationFilteredRows() {
    return applicationRows.filter(function (row) {
      return (state.applicationFilter === 'all' || row.category === state.applicationFilter) &&
        (!state.applicationDateFrom || row.date >= state.applicationDateFrom) &&
        (!state.applicationDateTo || row.date <= state.applicationDateTo);
    });
  }
  function modalDateFilter(type, label, from, to) {
    return '<div class="modal-filter-row"><div class="application-date-range" aria-label="' + label + '筛选">' +
      '<label><span>开始时间</span><input type="date" id="' + type + '-date-from" aria-label="' + label + '开始时间" value="' + from + '"></label>' +
      '<span aria-hidden="true">→</span><label><span>结束时间</span><input type="date" id="' + type + '-date-to" aria-label="' + label + '结束时间" value="' + to + '"></label></div></div>';
  }
  function renderApplicationListModal() {
    var body = document.getElementById('modal-body');
    var rows = applicationFilteredRows();
    var pages = Math.max(1, Math.ceil(rows.length / APPLICATION_PAGE_SIZE));
    state.applicationPage = Math.min(Math.max(1, state.applicationPage), pages);
    var visible = rows.slice((state.applicationPage - 1) * APPLICATION_PAGE_SIZE, state.applicationPage * APPLICATION_PAGE_SIZE);
    var buttons = '';
    for (var page = 1; page <= pages; page++) {
      if (pages > 7 && Math.abs(page - state.applicationPage) > 2 && page !== 1 && page !== pages) {
        if (page === 2 || page === pages - 1) buttons += '<span class="application-page-ellipsis">…</span>';
        continue;
      }
      buttons += '<button type="button" class="road-page-btn' + (page === state.applicationPage ? ' is-active' : '') + '" data-application-page="' + page + '" aria-label="第 ' + page + ' 页"' + (page === state.applicationPage ? ' aria-current="page"' : '') + '>' + page + '</button>';
    }
    body.innerHTML = '<div class="application-modal-summary" role="tablist" aria-label="申请业务类型筛选">' + applicationCategories.map(function (item) {
      var selected = item.key === state.applicationFilter;
      return '<button type="button" class="road-summary-filter application-summary-filter' + (selected ? ' is-selected' : '') + '" data-application-filter="' + item.key + '" role="tab" aria-selected="' + selected + '"><span>' + item.label + '</span><strong>' + item.count + '</strong></button>';
    }).join('') + '</div>' + modalDateFilter('application', '申请', state.applicationDateFrom, state.applicationDateTo) + '<div class="road-table-wrap"><table class="road-list-table application-list-table"><thead><tr><th>申请编号</th><th>业务类型</th><th>申请类型</th><th class="number-cell">车辆数</th><th>流程状态</th><th>当前环节</th><th>申请时间</th></tr></thead><tbody>' + (visible.length ? visible.map(function (row) {
      var category = applicationCategories.filter(function (item) { return item.key === row.category; })[0];
      return '<tr><td class="application-code">' + row.id + '</td><td>' + category.label + '</td><td>' + row.type + '</td><td class="number-cell">' + row.vehicles + '</td><td>' + row.status + '</td><td>' + row.stage + '</td><td>' + row.date + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="road-list-empty">当前筛选条件下暂无申请</td></tr>') + '</tbody></table></div><div class="road-pagination"><span class="road-page-total">共 <b>' + rows.length + '</b> 条</span><div class="road-page-controls"><button type="button" class="road-page-btn" data-application-page="prev" aria-label="上一页"' + (state.applicationPage === 1 ? ' disabled' : '') + '>‹</button>' + buttons + '<button type="button" class="road-page-btn" data-application-page="next" aria-label="下一页"' + (state.applicationPage === pages ? ' disabled' : '') + '>›</button></div></div>';
  }
  function openApplicationListModal() {
    state.modalOpen = true; state.modalType = 'application';
    state.applicationFilter = 'all'; state.applicationPage = 1; state.applicationDateFrom = ''; state.applicationDateTo = '';
    var overlay = document.getElementById('overlay-root');
    var modal = overlay.querySelector('.detail-modal');
    modal.classList.remove('is-road-list', 'is-vehicle-list', 'is-incident-list'); modal.classList.add('is-application-list');
    document.getElementById('modal-kicker').hidden = true;
    document.getElementById('modal-title').textContent = '申请列表';
    document.getElementById('modal-action').textContent = '关闭';
    overlay.querySelector('.ghost-button').hidden = true;
    renderApplicationListModal();
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    overlay.querySelector('.modal-close').focus();
  }
  function closeModal() { var overlay = document.getElementById('overlay-root'); overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true'); overlay.querySelector('.detail-modal').classList.remove('is-accident-list'); state.modalOpen = false; state.modalType = null; }

  function vehicleListStatusLabel(status) { return status === 'online' ? '在线' : '离线'; }
  function vehicleListFilteredRows() {
    var query = (state.vehicleSearch || '').trim().toLowerCase();
    if (!query) return vehicleListRows;
    return vehicleListRows.filter(function (row) { return row.plate.toLowerCase().indexOf(query) > -1; });
  }
  function vehicleListEscape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]; }); }
  function renderVehicleListModal() {
    var body = document.getElementById('modal-body');
    if (!body) return;
    var rows = vehicleListFilteredRows();
    body.innerHTML = '<div class="vehicle-list-toolbar"><label class="vehicle-search" aria-label="按车牌号搜索车辆"><span class="vehicle-search-icon" aria-hidden="true">⌕</span><input type="search" data-vehicle-search placeholder="车牌号" value="' + vehicleListEscape(state.vehicleSearch) + '" autocomplete="off"></label><span class="vehicle-list-hint">展示车辆实时状态，数据每 5 秒更新</span></div><div class="vehicle-modal-summary" role="group" aria-label="车辆状态汇总"><div class="vehicle-summary-card"><span>车辆总数</span><strong>128</strong><small>辆</small></div><div class="vehicle-summary-card online"><span>在线车辆</span><strong>125</strong><small>辆</small></div><div class="vehicle-summary-card offline"><span>离线车辆</span><strong>3</strong><small>辆</small></div></div><div class="road-table-wrap vehicle-table-wrap"><table class="road-list-table vehicle-list-table"><thead><tr><th>车牌号</th><th>所属企业</th><th>申请类型</th><th>驾驶模式</th><th class="number-cell">速度(km/h)</th><th>在线状态</th><th>最后上报</th></tr></thead><tbody>' + (rows.length ? rows.map(function (row) { return '<tr><td class="vehicle-plate">' + row.plate + '</td><td>' + row.company + '</td><td>' + row.application + '</td><td>' + row.mode + '</td><td class="number-cell">' + row.speed + '</td><td><span class="vehicle-status ' + row.status + '"><i></i>' + vehicleListStatusLabel(row.status) + '</span></td><td class="vehicle-report-time">' + row.lastReport + '</td></tr>'; }).join('') : '<tr><td colspan="7" class="road-list-empty">当前车牌号下暂无车辆</td></tr>') + '</tbody></table></div><div class="vehicle-list-footer"><span>共 <b>' + rows.length + '</b> 条匹配记录</span><span>更新时间：2026-09-21 18:23:38</span></div>';
  }
  function openVehicleListModal() {
    state.modalOpen = true; state.modalType = 'vehicle'; state.vehicleSearch = '';
    var overlay = document.getElementById('overlay-root');
    var modal = overlay.querySelector('.detail-modal');
    modal.classList.remove('is-road-list', 'is-application-list', 'is-incident-list'); modal.classList.add('is-vehicle-list');
    document.getElementById('modal-kicker').hidden = true;
    document.getElementById('modal-title').textContent = '车辆列表';
    document.getElementById('modal-action').textContent = '关闭';
    overlay.querySelector('.ghost-button').hidden = true;
    renderVehicleListModal();
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    var search = overlay.querySelector('[data-vehicle-search]');
    if (search) search.focus();
  }

  function incidentCategoryLabel(category) { return category === 'alarm' ? '告警' : '预警'; }
  function incidentStatusClass(status) { return status === '已完成' ? 'finished' : (status === '处理中' ? 'processing' : 'pending'); }
  function incidentListFilteredRows() {
    return incidentRows.filter(function (row) {
      return (state.incidentListFilter === 'total' || row.category === state.incidentListFilter) &&
        (!state.incidentDateFrom || row.date >= state.incidentDateFrom) &&
        (!state.incidentDateTo || row.date <= state.incidentDateTo);
    });
  }
  function incidentListSummary() {
    return incidentRows.filter(function (row) {
      return (!state.incidentDateFrom || row.date >= state.incidentDateFrom) && (!state.incidentDateTo || row.date <= state.incidentDateTo);
    }).reduce(function (summary, row) {
      summary.total += 1; summary[row.category] += 1; return summary;
    }, { total: 0, warning: 0, alarm: 0 });
  }
  function renderIncidentListModal() {
    var body = document.getElementById('modal-body');
    if (!body) return;
    var rows = incidentListFilteredRows();
    var summary = incidentListSummary();
    var pages = Math.max(1, Math.ceil(rows.length / INCIDENT_PAGE_SIZE));
    state.incidentListPage = Math.min(Math.max(1, state.incidentListPage), pages);
    var visible = rows.slice((state.incidentListPage - 1) * INCIDENT_PAGE_SIZE, state.incidentListPage * INCIDENT_PAGE_SIZE);
    var buttons = '';
    for (var page = 1; page <= pages; page++) {
      if (pages > 7 && Math.abs(page - state.incidentListPage) > 2 && page !== 1 && page !== pages) {
        if (page === 2 || page === pages - 1) buttons += '<span class="application-page-ellipsis">…</span>';
        continue;
      }
      buttons += '<button type="button" class="road-page-btn' + (page === state.incidentListPage ? ' is-active' : '') + '" data-incident-page="' + page + '" aria-label="第 ' + page + ' 页"' + (page === state.incidentListPage ? ' aria-current="page"' : '') + '>' + page + '</button>';
    }
    var filters = [['total', '事件总数', summary.total], ['warning', '预警事件', summary.warning], ['alarm', '告警事件', summary.alarm]];
    body.innerHTML = '<div class="incident-modal-summary" role="tablist" aria-label="异常事件分类筛选">' + filters.map(function (item) {
      var selected = item[0] === state.incidentListFilter;
      return '<button type="button" class="road-summary-filter incident-summary-filter ' + item[0] + (selected ? ' is-selected' : '') + '" data-incident-filter="' + item[0] + '" role="tab" aria-selected="' + selected + '"><span>' + item[1] + '</span><strong>' + item[2] + '</strong><small>起</small></button>';
    }).join('') + '</div>' + modalDateFilter('incident', '异常事件', state.incidentDateFrom, state.incidentDateTo) + '<div class="road-table-wrap incident-table-wrap"><table class="road-list-table incident-list-table"><thead><tr><th>事件编号</th><th>事件分类</th><th>车牌号</th><th>企业</th><th>事件类型</th><th>事件描述</th><th>发生时间</th><th>处理状态</th></tr></thead><tbody>' + (visible.length ? visible.map(function (row) {
      return '<tr><td class="incident-code">' + row.id + '</td><td><span class="incident-category ' + row.category + '"><i></i>' + incidentCategoryLabel(row.category) + '</span></td><td class="incident-plate">' + row.plate + '</td><td>' + row.company + '</td><td>' + row.type + '</td><td title="' + row.description + '">' + row.description + '</td><td class="incident-time">' + row.date + ' ' + row.time + '</td><td><span class="incident-process ' + incidentStatusClass(row.status) + '">' + row.status + '</span></td></tr>';
    }).join('') : '<tr><td colspan="8" class="road-list-empty">当前筛选条件下暂无异常事件</td></tr>') + '</tbody></table></div><div class="road-pagination"><span class="road-page-total">共 <b>' + rows.length + '</b> 条</span><div class="road-page-controls"><button type="button" class="road-page-btn" data-incident-page="prev" aria-label="上一页"' + (state.incidentListPage === 1 ? ' disabled' : '') + '>‹</button>' + buttons + '<button type="button" class="road-page-btn" data-incident-page="next" aria-label="下一页"' + (state.incidentListPage === pages ? ' disabled' : '') + '>›</button></div></div>';
  }
  function openIncidentListModal() {
    state.modalOpen = true; state.modalType = 'incident'; state.incidentListFilter = 'total'; state.incidentListPage = 1; state.incidentDateFrom = ''; state.incidentDateTo = '';
    var overlay = document.getElementById('overlay-root'); var modal = overlay.querySelector('.detail-modal');
    modal.classList.remove('is-road-list', 'is-application-list', 'is-vehicle-list'); modal.classList.add('is-incident-list');
    document.getElementById('modal-kicker').hidden = true;
    document.getElementById('modal-title').textContent = '异常事件列表';
    document.getElementById('modal-action').textContent = '关闭';
    overlay.querySelector('.ghost-button').hidden = true;
    renderIncidentListModal();
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    overlay.querySelector('.modal-close').focus();
  }

  function roadStatusLabel(status) { return status === 'open' ? '开放' : '暂停'; }
  function roadStatusColor(status) { return status === 'open' ? '#52c41a' : '#fadb14'; }
  function roadSegmentsForFilter(area) {
    return (area.segments || []).filter(function (segment) { return state.roadFilter === 'all' || segment.status === state.roadFilter; });
  }
  function vehicleStatusLabel(status) {
    return status === 'manual' ? '人工驾驶' : (status === 'auto' ? '自动驾驶' : '离线');
  }
  function vehicleMatches(vehicle) {
    if (state.vehicleFilter === 'online') return vehicle.status !== 'offline';
    if (state.vehicleFilter === 'mileage') return vehicle.mileage > 0;
    return true;
  }
  function vehicleCountForArea(area) {
    if (state.vehicleFilter === 'online') return area.online;
    if (state.vehicleFilter === 'mileage') return area.mileageCount;
    return area.count;
  }
  function vehicleFilterLabel() {
    return state.vehicleFilter === 'online' ? '在线车辆' : (state.vehicleFilter === 'mileage' ? '里程车辆' : '车辆总数');
  }

  function cockpitModeKey(label) { return label === '人工驾驶' ? 'manual' : 'auto'; }
  function cockpitVehicleStatus(vehicle) {
    if (vehicle.status === 'offline') return 'offline';
    return vehicleIncidentStatus(vehicle) === 'unfinished' ? 'alarm' : 'online';
  }
  function ensureCockpitVehicleData(areas) {
    cockpitVehicleIndex = {};
    (areas || []).forEach(function (area) {
      (area.vehicles || []).forEach(function (vehicle) {
        var row = vehicleListRows.find(function (item) { return item.plate === vehicle.plate; }) || {};
        var normalized = typeof vehicleData !== 'undefined' && vehicleData.find(function (item) { return item.plate === vehicle.plate; });
        if (!normalized) {
          normalized = { id: 'CP-' + vehicle.plate.replace(/[^A-Za-z0-9]/g, ''), plate: vehicle.plate, company: row.company || area.name, applyType: row.application === '示范应用' ? 'demo' : (row.application === '商业化试点' ? 'operate' : 'road-test'), mode: vehicle.status === 'manual' ? 'manual' : 'auto', speed: row.speed == null ? 0 : row.speed, acceleration: 0, level: 'L3', status: cockpitVehicleStatus(vehicle), lon: vehicle.position[1], lat: vehicle.position[0], vin: 'COCKPIT-' + vehicle.plate.replace(/[^A-Za-z0-9]/g, ''), heading: 0, gear: vehicle.status === 'offline' ? 'P' : 'D', lastTime: row.lastReport || '--', alarms: (vehicle.events || []).filter(function (event) { return event.category === 'alarm'; }).length };
          if (typeof vehicleData !== 'undefined') vehicleData.push(normalized);
        } else {
          normalized.company = row.company || normalized.company || area.name;
          normalized.mode = vehicle.status === 'manual' ? 'manual' : normalized.mode;
          normalized.speed = row.speed == null ? normalized.speed : row.speed;
          normalized.status = cockpitVehicleStatus(vehicle);
          normalized.lon = vehicle.position[1]; normalized.lat = vehicle.position[0];
          normalized.lastTime = row.lastReport || normalized.lastTime;
        }
        normalized.cockpitArea = area.name;
        normalized.cockpitMileage = vehicle.mileage;
        normalized.cockpitEvents = vehicle.events || [];
        vehicle.vehicleId = normalized.id;
        vehicle.areaName = area.name;
        cockpitVehicleIndex[normalized.id] = { raw: vehicle, area: area, normalized: normalized };
      });
    });
  }
  function cockpitVehicleById(id) {
    var entry = cockpitVehicleIndex[id];
    if (entry) return entry;
    if (typeof vehicleData !== 'undefined') {
      var normalized = vehicleData.find(function (item) { return item.id === id || item.plate === id; });
      if (normalized) return cockpitVehicleIndex[normalized.id] || { raw: null, area: null, normalized: normalized };
    }
    return null;
  }
  function cockpitEventSummary(events) {
    var list = events || [];
    var alarms = list.filter(function (event) { return event.category === 'alarm'; }).length;
    var warnings = list.filter(function (event) { return event.category !== 'alarm'; }).length;
    return { alarms: alarms, warnings: warnings, total: list.length };
  }
  function cockpitVehiclePopup(area, vehicle) {
    var entry = cockpitVehicleById(vehicle.vehicleId);
    var v = entry ? entry.normalized : vehicle;
    var summary = cockpitEventSummary(vehicle.events);
    var status = vehicleStatusLabel(vehicle.status);
    var eventText = summary.total ? '预警 ' + summary.warnings + ' · 告警 ' + summary.alarms : '暂无异常事件';
    var id = vehicle.vehicleId;
    return '<div class="cockpit-vehicle-popup" data-vehicle-id="' + id + '">' +
      '<div class="cockpit-popup-head"><div><span class="cockpit-popup-kicker">车辆实时状态</span><strong>' + v.plate + '</strong></div><span class="cockpit-popup-status ' + vehicle.status + '"><i></i>' + status + '</span></div>' +
      '<div class="cockpit-popup-grid"><div><span>所属区域</span><b>' + area.name + '</b></div><div><span>驾驶模式</span><b>' + vehicleStatusLabel(vehicle.status) + '</b></div><div><span>实时速度</span><b>' + (v.speed == null ? '--' : v.speed) + ' km/h</b></div><div><span>累计里程</span><b>' + vehicle.mileage + ' km</b></div></div>' +
      '<div class="cockpit-popup-events"><span>当前异常</span><b>' + eventText + '</b></div>' +
      '<div class="cockpit-popup-actions"><button type="button" class="cockpit-popup-action primary" onclick="openCockpitTrajectory(\'' + id + '\')">轨迹</button><button type="button" class="cockpit-popup-action" onclick="openCockpitVideo(\'' + id + '\')">视频</button></div>' +
      '</div>';
  }
  function incidentPeriodRank(period) { return period === '本月' ? 1 : (period === '本年' ? 2 : 3); }
  function incidentEventMatches(event) {
    var rangeRank = incidentPeriodRank(state.incidentRange);
    return incidentPeriodRank(event.period || '全部') <= rangeRank && (state.incidentFilter === 'total' || event.category === state.incidentFilter);
  }
  function vehicleIncidentEvents(vehicle) { return (vehicle.events || []).filter(incidentEventMatches); }
  function vehicleIncidentStatus(vehicle) {
    var events = vehicleIncidentEvents(vehicle);
    if (!events.length) return 'none';
    return events.some(function (event) { return event.status !== '已完成'; }) ? 'unfinished' : 'finished';
  }
  function areaIncidentEvents(area) {
    return (area.vehicles || []).reduce(function (events, vehicle) { return events.concat(vehicleIncidentEvents(vehicle)); }, []);
  }
  function updateIncidentTiles() {
    var summary = incidentRangeData[state.incidentRange] || incidentRangeData['本年'];
    var module = document.getElementById('incident-module');
    if (!module) return;
    var values = { total: summary.total, warning: summary.warning, alarm: summary.alarm };
    module.querySelectorAll('.metric-tile[data-chart="incident"]').forEach(function (tile) {
      var key = tile.dataset.key || 'total';
      var strong = tile.querySelector('strong');
      if (strong) strong.textContent = values[key];
      tile.dataset.value = values[key];
    });
    chartData.incident.total = summary.total;
    chartData.incident.selected = { total: ['事件总数', summary.total], warning: ['预警事件', summary.warning], alarm: ['告警事件', summary.alarm] };
    setDonut('incident', state.incidentFilter);
  }
  function setIncidentRange(range) {
    state.incidentRange = range || '本年';
    updateIncidentTiles();
    if (state.incidentMode) updateIncidentView(true);
  }
  function buildAccidentData(areas) {
    var records = [];
    var months = [20, 30, 15, 15, 10, 30];
    function addYear(year, counts) {
      counts.forEach(function (count, monthIndex) {
        for (var index = 0; index < count; index++) {
          var area = areas[(index + monthIndex * 2) % areas.length];
          var sequence = records.length + 1;
          records.push({
            id: 'SG' + String(sequence).padStart(4, '0'), area: area.name,
            plate: '鄂F·' + String(16000 + sequence), company: ['襄阳智行科技', '汉江智能出行', '东津无人配送'][sequence % 3],
            type: ['碰撞', '追尾', '剐蹭', '单车事故'][sequence % 4],
            location: area.name + '测试路段' + (index % 6 + 1) + '号路口',
            time: String(8 + index % 10).padStart(2, '0') + ':' + String((index * 7) % 60).padStart(2, '0') + ':33',
            position: [area.center[0] + (((index * 7 + monthIndex * 3) % 17) - 8) * .0015, area.center[1] + (((index * 11 + monthIndex * 5) % 19) - 9) * .002],
            date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String((index % 28) + 1).padStart(2, '0')
          });
        }
      });
    }
    addYear(ACCIDENT_YEAR - 1, [4, 5, 6, 4, 5, 6]);
    addYear(ACCIDENT_YEAR, months);
    var sample = records.filter(function (record) { return record.date === ACCIDENT_YEAR + '-05-01'; })[0];
    if (sample) Object.assign(sample, { id: 'DA' + ACCIDENT_YEAR + '05004', date: ACCIDENT_YEAR + '-05-08', time: '15:35:33', plate: '鄂F·16789', company: 'C公司', type: '碰撞', location: '长虹路与建华路交叉口' });
    return records;
  }
  function accidentListRows() {
    return state.accidentData.filter(function (record) {
      return (!state.accidentDateFrom || record.date >= state.accidentDateFrom) &&
        (!state.accidentDateTo || record.date <= state.accidentDateTo);
    }).sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time) || b.id.localeCompare(a.id); });
  }
  function renderAccidentListModal() {
    var rows = accidentListRows();
    var pages = Math.max(1, Math.ceil(rows.length / ACCIDENT_PAGE_SIZE));
    state.accidentPage = Math.min(Math.max(1, state.accidentPage), pages);
    var visible = rows.slice((state.accidentPage - 1) * ACCIDENT_PAGE_SIZE, state.accidentPage * ACCIDENT_PAGE_SIZE);
    var buttons = '';
    for (var page = 1; page <= pages; page++) {
      if (pages > 7 && Math.abs(page - state.accidentPage) > 2 && page !== 1 && page !== pages) {
        if (page === 2 || page === pages - 1) buttons += '<span class="application-page-ellipsis">…</span>';
        continue;
      }
      buttons += '<button type="button" class="road-page-btn' + (page === state.accidentPage ? ' is-active' : '') + '" data-accident-page="' + page + '" aria-label="第 ' + page + ' 页"' + (page === state.accidentPage ? ' aria-current="page"' : '') + '>' + page + '</button>';
    }
    document.getElementById('modal-body').innerHTML = modalDateFilter('accident', '事故', state.accidentDateFrom, state.accidentDateTo) + '<div class="road-table-wrap"><table class="road-list-table accident-list-table"><thead><tr><th>事故编号</th><th>发生时间</th><th>车牌号</th><th>企业</th><th>事故类型</th><th>地点</th></tr></thead><tbody>' + (visible.length ? visible.map(function (row) {
      return '<tr><td class="accident-code">' + row.id + '</td><td>' + row.date + ' ' + row.time + '</td><td>' + row.plate + '</td><td>' + row.company + '</td><td>' + row.type + '</td><td title="' + row.location + '">' + row.location + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="road-list-empty">当前筛选条件下暂无事故</td></tr>') + '</tbody></table></div><div class="road-pagination"><span class="road-page-total">共 <b>' + rows.length + '</b> 条</span><div class="road-page-controls"><button type="button" class="road-page-btn" data-accident-page="prev" aria-label="上一页"' + (state.accidentPage === 1 ? ' disabled' : '') + '>‹</button>' + buttons + '<button type="button" class="road-page-btn" data-accident-page="next" aria-label="下一页"' + (state.accidentPage === pages ? ' disabled' : '') + '>›</button></div></div>';
  }
  function openAccidentListModal(event) {
    event.stopPropagation();
    state.modalOpen = true; state.modalType = 'accident'; state.accidentPage = 1; state.accidentDateFrom = ''; state.accidentDateTo = '';
    var overlay = document.getElementById('overlay-root'); var modal = overlay.querySelector('.detail-modal');
    modal.classList.remove('is-road-list', 'is-application-list', 'is-vehicle-list', 'is-incident-list'); modal.classList.add('is-accident-list');
    document.getElementById('modal-kicker').hidden = true;
    document.getElementById('modal-title').textContent = '交通事故列表';
    document.getElementById('modal-action').textContent = '关闭';
    overlay.querySelector('.ghost-button').hidden = true;
    renderAccidentListModal();
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    overlay.querySelector('.modal-close').focus();
  }
  function accidentRecords() {
    var month = String(new Date().getMonth() + 1).padStart(2, '0');
    return state.accidentData.filter(function (record) {
      return state.accidentRange === '全部' || (Number(record.date.slice(0, 4)) === ACCIDENT_YEAR &&
        (state.accidentRange !== '本月' || record.date.slice(5, 7) === month));
    });
  }
  function renderAccidentChart() {
    var chart = document.getElementById('accident-chart');
    if (!chart) return;
    var records = accidentRecords();
    var daysInMonth = new Date(ACCIDENT_YEAR, new Date().getMonth() + 1, 0).getDate();
    var labels = state.accidentRange === '全部' ? [(ACCIDENT_YEAR - 1) + '年', ACCIDENT_YEAR + '年'] :
      (state.accidentRange === '本月' ? ['1日', '6日', '11日', '16日', '21日', '26日'] :
        Array.from({ length: 12 }, function (_, index) { return (index + 1) + '月'; }));
    var counts = labels.map(function (label, index) {
      return records.filter(function (record) {
        if (state.accidentRange === '全部') return record.date.slice(0, 4) === label.slice(0, 4);
        if (state.accidentRange === '本月') {
          var day = Number(record.date.slice(8, 10));
          return day >= index * 5 + 1 && day <= Math.min((index + 1) * 5, daysInMonth) || (index === 5 && day > 30);
        }
        return Number(record.date.slice(5, 7)) === index + 1;
      }).length;
    });
    var max = Math.max.apply(null, counts.concat([1]));
    var points = counts.map(function (count, index) { return { x: 42 + index * 450 / (counts.length - 1), y: 168 - count / max * 120, count: count }; });
    var path = points.map(function (point, index) { return (index ? 'L' : 'M') + point.x + ' ' + point.y; }).join(' ');
    chart.setAttribute('aria-label', state.accidentRange + '事故趋势图，共' + records.length + '起');
    chart.innerHTML = '<svg viewBox="0 0 520 208" preserveAspectRatio="none" aria-hidden="true"><g class="chart-grid"><path d="M42 20H500 M42 62H500 M42 104H500 M42 146H500 M42 188H500"/></g><path class="chart-area" d="' + path + ' L492 188 L42 188Z"/><path class="chart-line" d="' + path + '"/><g class="chart-points">' + points.map(function (point) { return '<circle cx="' + point.x + '" cy="' + point.y + '" r="4"/>'; }).join('') + '</g><g class="chart-values">' + points.map(function (point) { return '<text x="' + point.x + '" y="' + (point.y - 11) + '">' + point.count + '</text>'; }).join('') + '</g><g class="chart-labels">' + points.map(function (point, index) { return '<text x="' + point.x + '" y="204">' + labels[index] + '</text>'; }).join('') + '</g></svg>';
  }

  function cockpitDateText(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function clearCockpitTrajectoryLayers() {
    [trajectoryState.line, trajectoryState.passedLine, trajectoryState.marker].forEach(function (layer) { if (layer && state.map) state.map.removeLayer(layer); });
    trajectoryState.line = null; trajectoryState.passedLine = null; trajectoryState.marker = null;
    if (trajectoryState.timer) { clearInterval(trajectoryState.timer); trajectoryState.timer = null; }
    trajectoryState.playing = false;
  }
  function buildCockpitTrajectory(v, date, startTime, endTime) {
    var from = timeToSeconds(startTime || '08:00:00');
    var to = timeToSeconds(endTime || '14:32:00');
    var duration = Math.max(60, to - from);
    var count = Math.max(2, Math.ceil(duration / 30) + 1);
    var baseLon = Number(v.lon) || 112.15;
    var baseLat = Number(v.lat) || 32.07;
    var seed = String(v.id || '').split('').reduce(function (total, char) { return total + char.charCodeAt(0); }, 0);
    return Array.from({ length: count }, function (_, index) {
      var ratio = index / (count - 1);
      var angle = (seed % 13) * 0.2 + ratio * Math.PI * 1.5;
      var seconds = Math.round(from + duration * ratio);
      return { timeStr: secToTime(seconds), lon: baseLon - .008 + ratio * .016 + Math.sin(angle) * .0015, lat: baseLat - .004 + ratio * .008 + Math.cos(angle) * .0011, speed: Math.max(0, Math.round((Number(v.speed) || 30) + Math.sin(angle * 1.7) * 8)), driveMode: v.mode === 'manual' ? '人工驾驶' : '自动驾驶' };
    });
  }
  function cockpitTrajectoryMetrics(point) {
    var panel = document.getElementById('cockpit-trajectory-panel');
    if (!panel || !point) return;
    var time = panel.querySelector('[data-traj-current-time]');
    var speed = panel.querySelector('[data-traj-current-speed]');
    var mode = panel.querySelector('[data-traj-current-mode]');
    if (time) time.textContent = point.timeStr;
    if (speed) speed.textContent = point.speed + ' km/h';
    if (mode) mode.textContent = point.driveMode;
    var slider = panel.querySelector('[data-traj-slider]');
    if (slider) slider.value = trajectoryState.currentIndex;
    var fill = panel.querySelector('[data-traj-progress]');
    if (fill) fill.style.width = (trajectoryState.points.length > 1 ? trajectoryState.currentIndex / (trajectoryState.points.length - 1) * 100 : 0) + '%';
  }
  function seekCockpitTrajectory(index, source) {
    if (!trajectoryState.points.length) return;
    trajectoryState.currentIndex = Math.max(0, Math.min(trajectoryState.points.length - 1, Number(index) || 0));
    var point = trajectoryState.points[trajectoryState.currentIndex];
    var path = trajectoryState.points.slice(0, trajectoryState.currentIndex + 1).map(function (item) { return [item.lat, item.lon]; });
    if (trajectoryState.passedLine) trajectoryState.passedLine.setLatLngs(path);
    if (trajectoryState.marker) trajectoryState.marker.setLatLng([point.lat, point.lon]);
    trajectoryState.currentTime = point.timeStr;
    cockpitTrajectoryMetrics(point);
    if (source !== 'video') TimeClock.set(point.timeStr, 'trajectory');
  }
  function createCockpitTrajectoryLayers(v) {
    if (!state.map || !trajectoryState.points.length) return;
    var path = trajectoryState.points.map(function (point) { return [point.lat, point.lon]; });
    trajectoryState.line = L.polyline(path, { color: '#00cfe8', weight: 4, opacity: .5, dashArray: '8 6', lineJoin: 'round', lineCap: 'round' }).addTo(state.map);
    trajectoryState.passedLine = L.polyline([path[0]], { color: '#1677ff', weight: 5, opacity: .95, lineJoin: 'round', lineCap: 'round' }).addTo(state.map);
    trajectoryState.marker = L.marker(path[0], { icon: L.divIcon({ className: 'cockpit-trajectory-marker', html: '<span>' + v.plate.slice(-2) + '</span>', iconSize: [32, 32], iconAnchor: [16, 16] }), zIndexOffset: 600 }).addTo(state.map);
    state.map.fitBounds(trajectoryState.line.getBounds(), { padding: [80, 80], maxZoom: 14 });
  }
  function renderCockpitTrajectoryPanel(v) {
    var panel = document.getElementById('cockpit-trajectory-panel');
    if (!panel) return;
    var point = trajectoryState.points[trajectoryState.currentIndex];
    panel.innerHTML = '<div class="cockpit-traj-head"><div><span class="cockpit-panel-kicker">轨迹回放</span><strong>' + v.plate + '</strong><small>' + (v.cockpitArea || v.cockpitArea === '' ? v.cockpitArea : '车辆') + '</small></div><div class="cockpit-traj-metrics"><span><em>当前时间</em><b data-traj-current-time>' + point.timeStr + '</b></span><span><em>速度</em><b data-traj-current-speed>' + point.speed + ' km/h</b></span><span><em>驾驶模式</em><b data-traj-current-mode>' + point.driveMode + '</b></span><button type="button" class="cockpit-panel-close" onclick="closeCockpitTrajectory()" aria-label="关闭轨迹面板" title="关闭轨迹面板">×</button></div></div>' +
      '<div class="cockpit-traj-query"><label>日期<input type="date" data-traj-date value="' + trajectoryState.playbackDate + '"></label><label>开始<input type="time" step="1" data-traj-start value="' + trajectoryState.startTime + '"></label><span>至</span><label>结束<input type="time" step="1" data-traj-end value="' + trajectoryState.endTime + '"></label><button type="button" class="cockpit-control-button" onclick="reloadCockpitTrajectory()">查询</button><button type="button" class="cockpit-control-button" onclick="openCockpitTrajectoryVideo()">视频回看</button></div>' +
      '<div class="cockpit-traj-controls"><button type="button" class="cockpit-control-button primary" data-traj-play onclick="toggleCockpitTrajectory()">▶ 播放</button><select data-traj-speed aria-label="轨迹播放速度" onchange="changeCockpitTrajectorySpeed(this.value)"><option value="1">1x</option><option value="2">2x</option><option value="4">4x</option><option value="8">8x</option></select><span class="cockpit-traj-time">' + trajectoryState.startTime + '</span><div class="cockpit-traj-slider"><div data-traj-progress></div><input type="range" data-traj-slider min="0" max="' + (trajectoryState.points.length - 1) + '" value="' + trajectoryState.currentIndex + '" oninput="seekCockpitTrajectory(this.value)"></div><span class="cockpit-traj-time">' + trajectoryState.endTime + '</span></div>';
    panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false');
    cockpitTrajectoryMetrics(point);
  }
  function showCockpitTrajectory(id, options) {
    var entry = cockpitVehicleById(id);
    if (!entry || !entry.normalized) return;
    var v = entry.normalized;
    var now = new Date();
    var opts = options || {};
    var date = opts.playbackDate || cockpitDateText(now);
    var startTime = opts.startTime || '08:00:00';
    var endTime = opts.endTime || '14:32:00';
    clearCockpitTrajectoryLayers();
    state.selectedVehicleId = v.id;
    trajectoryState.vehicleId = v.id; trajectoryState.playbackDate = date; trajectoryState.startTime = startTime; trajectoryState.endTime = endTime;
    trajectoryState.points = buildCockpitTrajectory(v, date, startTime, endTime);
    trajectoryState.currentIndex = 0;
    if (opts.currentTime) {
      var target = timeToSeconds(opts.currentTime);
      trajectoryState.currentIndex = trajectoryState.points.reduce(function (best, point, index) { return Math.abs(timeToSeconds(point.timeStr) - target) < Math.abs(timeToSeconds(trajectoryState.points[best].timeStr) - target) ? index : best; }, 0);
    }
    createCockpitTrajectoryLayers(v);
    renderCockpitTrajectoryPanel(v);
    seekCockpitTrajectory(trajectoryState.currentIndex);
  }
  function reloadCockpitTrajectory() {
    var panel = document.getElementById('cockpit-trajectory-panel');
    if (!panel || !trajectoryState.vehicleId) return;
    var start = panel.querySelector('[data-traj-start]').value;
    var end = panel.querySelector('[data-traj-end]').value;
    if (timeToSeconds(end) <= timeToSeconds(start)) return;
    showCockpitTrajectory(trajectoryState.vehicleId, { playbackDate: panel.querySelector('[data-traj-date]').value, startTime: start, endTime: end });
  }
  function toggleCockpitTrajectory() {
    if (!trajectoryState.points.length) return;
    trajectoryState.playing = !trajectoryState.playing;
    var button = document.querySelector('[data-traj-play]');
    if (button) button.textContent = trajectoryState.playing ? '⏸ 暂停' : '▶ 播放';
    if (trajectoryState.playing) {
      if (trajectoryState.currentIndex >= trajectoryState.points.length - 1) seekCockpitTrajectory(0);
      trajectoryState.timer = setInterval(function () {
        if (trajectoryState.currentIndex >= trajectoryState.points.length - 1) { toggleCockpitTrajectory(); return; }
        seekCockpitTrajectory(trajectoryState.currentIndex + 1);
      }, 900 / trajectoryState.speed);
    } else if (trajectoryState.timer) { clearInterval(trajectoryState.timer); trajectoryState.timer = null; }
  }
  function changeCockpitTrajectorySpeed(speed) {
    trajectoryState.speed = Number(speed) || 1;
    if (trajectoryState.playing) { toggleCockpitTrajectory(); toggleCockpitTrajectory(); }
  }
  function closeCockpitTrajectory() {
    var panel = document.getElementById('cockpit-trajectory-panel');
    clearCockpitTrajectoryLayers();
    trajectoryState.vehicleId = null; trajectoryState.points = [];
    if (panel) { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); }
    var instance = typeof VideoWorkbench !== 'undefined' && VideoWorkbench.getInstance('cockpit-video-pane');
    if (instance && instance.mode === 'playback') VideoWorkbench.backToLive('cockpit-video-pane');
  }
  function openCockpitVideo(id, playback) {
    var entry = cockpitVehicleById(id);
    if (!entry || !entry.normalized) return;
    var v = entry.normalized;
    state.selectedVehicleId = v.id;
    var panel = document.getElementById('cockpit-video-panel');
    var title = document.getElementById('cockpit-video-title');
    var pane = document.getElementById('cockpit-video-pane');
    if (!panel || !pane || typeof VideoWorkbench === 'undefined') return;
    if (title) title.textContent = v.plate + ' · ' + (v.company || '');
    panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false');
    if (!VideoWorkbench.getInstance('cockpit-video-pane')) {
      VideoWorkbench.mount({ container: pane, vehicleId: v.id, layout: 'single', mode: playback ? 'playback' : 'live', timeSource: playback ? 'external' : 'now', onSelectVehicle: selectCockpitVideoVehicle });
    } else {
      VideoWorkbench.selectVehicle('cockpit-video-pane', v.id);
    }
    if (playback) VideoWorkbench.enterPlayback('cockpit-video-pane', playback);
  }
  function selectCockpitVideoVehicle(id) {
    var entry = cockpitVehicleById(id);
    if (!entry || !entry.normalized) return;
    state.selectedVehicleId = entry.normalized.id;
    var title = document.getElementById('cockpit-video-title');
    if (title) title.textContent = entry.normalized.plate + ' · ' + (entry.normalized.company || '');
    if (state.map && entry.raw) state.map.flyTo(entry.raw.position, 14, { duration: .35 });
  }
  function closeCockpitVideo() {
    var panel = document.getElementById('cockpit-video-panel');
    if (panel) { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); }
    var instance = typeof VideoWorkbench !== 'undefined' && VideoWorkbench.getInstance('cockpit-video-pane');
    if (instance && instance.mode === 'playback') VideoWorkbench.backToLive('cockpit-video-pane');
  }
  function openCockpitTrajectoryVideo() {
    if (!trajectoryState.vehicleId || !trajectoryState.points.length) return;
    openCockpitVideo(trajectoryState.vehicleId, { timeSource: 'external', playbackDate: trajectoryState.playbackDate, startTime: trajectoryState.startTime, endTime: trajectoryState.endTime, currentTime: trajectoryState.currentTime });
  }
  function setAccidentRange(range) {
    state.accidentRange = range;
    renderAccidentChart();
    if (state.accidentMode) updateAccidentView(true);
  }
  function updateAccidentView(force) {
    var map = state.map;
    var layer = state.mapLayers.accident;
    if (!map || !layer) return;
    var mode = !state.accidentMode ? 'idle' : (map.getZoom() >= VEHICLE_EXPAND_ZOOM ? 'points' : 'cluster');
    if (!force && state.accidentViewMode === mode) return;
    state.accidentViewMode = mode;
    layer.clearLayers();
    if (mode === 'cluster') {
      state.vehicleData.forEach(function (area) {
        var count = accidentRecords().filter(function (record) { return record.area === area.name; }).length;
        if (!count) return;
        var html = '<div class="accident-cluster-icon" role="button" tabindex="0" aria-label="' + area.name + '，' + count + '起事故"><span>' + area.name + '</span><strong>' + count + '</strong><small>事故</small></div>';
        var marker = L.marker(area.center, { icon: L.divIcon({ className: '', html: html, iconSize: [104, 104], iconAnchor: [52, 52] }), title: area.name, keyboard: true });
        function focus() { map.flyTo(area.center, Math.max(map.getZoom(), VEHICLE_EXPAND_ZOOM), { duration: .45 }); }
        marker.on('click', focus);
        marker.on('keypress', function (event) { if (event.originalEvent && (event.originalEvent.key === 'Enter' || event.originalEvent.key === ' ')) { event.originalEvent.preventDefault(); focus(); } });
        marker.addTo(layer);
      });
    } else if (mode === 'points') {
      accidentRecords().forEach(function (record) {
        var label = record.area + ' · ' + record.date + ' · 事故点位';
        L.marker(record.position, { icon: L.divIcon({ className: 'accident-dot', html: '', iconSize: [12, 12], iconAnchor: [6, 6] }), title: label, keyboard: true })
          .bindTooltip(label, { direction: 'top', offset: [0, -6] })
          .bindPopup('<div class="vehicle-popup"><strong>事故 ' + record.id + '</strong><span>' + record.area + '</span><small>发生日期 ' + record.date + '</small></div>', { closeButton: true, offset: [0, -5] }).addTo(layer);
      });
    }
  }
  function setAccidentModuleSelected(selected) {
    var module = document.getElementById('accident-module');
    if (!module) return;
    state.accidentMode = selected;
    module.classList.toggle('is-selected', selected);
    module.setAttribute('aria-pressed', String(selected));
    if (selected) {
      state.roadMode = false; state.vehicleMode = false; state.incidentMode = false;
      ['road-resource-module', 'vehicle-monitor-module', 'incident-module'].forEach(function (id) {
        var other = document.getElementById(id);
        if (other) { other.classList.remove('is-selected'); other.setAttribute('aria-pressed', 'false'); }
      });
      document.getElementById('map-legend').innerHTML = '<span><i class="legend-accident"></i>事故点位</span>';
    } else {
      document.getElementById('map-legend').innerHTML = '<span><i class="legend-online"></i>在线车辆</span><span><i class="legend-warning"></i>预警车辆</span><span><i class="legend-alarm"></i>告警车辆</span>';
    }
    if (state.map) {
      ['road', 'vehicle', 'incident', 'route', 'accident'].forEach(function (key) {
        var layer = state.mapLayers[key];
        if (layer) state.map.removeLayer(layer);
      });
      if (selected && document.querySelector('#map-layer-popover [data-layer="accident"]').checked) state.mapLayers.accident.addTo(state.map);
    }
    updateAccidentView(true);
  }
  function bindAccidentModule() {
    var module = document.getElementById('accident-module');
    if (!module) return;
    module.addEventListener('click', function (event) {
      if (event.target.closest('.range-tabs')) return;
      setAccidentModuleSelected(!state.accidentMode);
    });
    module.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === module) { event.preventDefault(); setAccidentModuleSelected(!state.accidentMode); }
    });
  }
  function updateIncidentLegend() {
    var legend = document.getElementById('map-legend');
    if (!legend || !state.incidentMode) return;
    legend.innerHTML = '<span><i class="legend-incident-unfinished"></i>未完成事件车辆</span><span><i class="legend-incident-finished"></i>已完成事件车辆</span>';
  }
  function incidentCountForArea(area) { return areaIncidentEvents(area).length; }
  function incidentVehicleMatches(vehicle) { return vehicleIncidentEvents(vehicle).length > 0; }
  function updateIncidentView(force) {
    var map = state.map;
    var layer = state.mapLayers.incident;
    if (!map || !layer) return;
    var mode = !state.incidentMode ? 'idle' : (map.getZoom() >= VEHICLE_EXPAND_ZOOM ? 'points' : 'cluster');
    if (!force && state.incidentViewMode === mode) return;
    state.incidentViewMode = mode;
    layer.clearLayers();
    if (mode === 'cluster') renderIncidentClusters();
    if (mode === 'points') renderIncidentPoints();
  }
  function focusIncidentArea(area) {
    if (!state.map || !state.incidentMode) return;
    state.map.flyTo(area.center, Math.max(state.map.getZoom(), VEHICLE_EXPAND_ZOOM), { duration: .45 });
  }
  function renderIncidentClusters() {
    var layer = state.mapLayers.incident;
    if (!layer) return;
    state.vehicleData.forEach(function (area) {
      var count = incidentCountForArea(area);
      if (!count) return;
      var html = '<div class="incident-cluster-icon" role="button" tabindex="0" aria-label="' + area.name + '，' + count + '起异常事件"><span>' + area.name + '</span><strong>' + count + '</strong><small>异常事件</small></div>';
      var marker = L.marker(area.center, { icon: L.divIcon({ className: '', html: html, iconSize: [104, 104], iconAnchor: [52, 52] }), title: area.name, keyboard: true });
      marker.on('click', function () { focusIncidentArea(area); });
      marker.on('keypress', function (event) { if (event.originalEvent && (event.originalEvent.key === 'Enter' || event.originalEvent.key === ' ')) { event.originalEvent.preventDefault(); focusIncidentArea(area); } });
      marker.addTo(layer);
    });
  }
  function renderIncidentPoints() {
    var layer = state.mapLayers.incident;
    if (!layer) return;
    state.vehicleData.forEach(function (area) {
      (area.vehicles || []).filter(incidentVehicleMatches).forEach(function (vehicle) {
        var events = vehicleIncidentEvents(vehicle);
        var completion = vehicleIncidentStatus(vehicle);
        var label = area.name + ' · ' + vehicle.plate + ' · ' + events.length + ' 起异常事件';
        var html = '<div class="incident-vehicle-marker ' + completion + '"><span class="incident-vehicle-glyph">◆</span><b>' + events.length + '</b></div>';
        var marker = L.marker(vehicle.position, { icon: L.divIcon({ className: '', html: html, iconSize: [34, 30], iconAnchor: [17, 15] }), title: label, keyboard: true });
        marker.bindTooltip(label, { direction: 'top', offset: [0, -10] });
        marker.bindPopup('<div class="vehicle-popup incident-popup"><strong>' + vehicle.plate + '</strong><span>' + area.name + '</span><span class="incident-status ' + completion + '"><i></i>' + (completion === 'unfinished' ? '未完成' : '已完成') + ' · ' + events.length + ' 起</span><small>' + events.map(function (event) { return event.category === 'alarm' ? '告警' : '预警'; }).join(' / ') + '</small></div>', { closeButton: true, offset: [0, -8] });
        marker.addTo(layer);
      });
    });
  }
  function setIncidentModuleSelected(selected) {
    var module = document.getElementById('incident-module');
    if (!module) return;
    state.incidentMode = selected;
    module.classList.toggle('is-selected', selected);
    module.setAttribute('aria-pressed', String(selected));
    var hint = document.getElementById('incident-selection-hint');
    if (hint) hint.textContent = selected ? '地图已按异常事件聚合 · 点击聚合圈或放大查看车辆' : '点击模块查看区域异常事件聚合';
    if (selected) {
      if (state.accidentMode) setAccidentModuleSelected(false);
      state.vehicleMode = false; state.roadMode = false;
      var vehicleModule = document.getElementById('vehicle-monitor-module');
      var roadModule = document.getElementById('road-resource-module');
      if (vehicleModule) { vehicleModule.classList.remove('is-selected'); vehicleModule.setAttribute('aria-pressed', 'false'); }
      if (roadModule) { roadModule.classList.remove('is-selected'); roadModule.setAttribute('aria-pressed', 'false'); }
    }
    if (selected) {
      updateIncidentLegend();
    } else {
      var legend = document.getElementById('map-legend');
      if (legend) legend.innerHTML = '<span><i class="legend-online"></i>在线车辆</span><span><i class="legend-warning"></i>预警车辆</span><span><i class="legend-alarm"></i>告警车辆</span>';
    }
    if (state.map) {
      if (selected) {
        if (state.mapLayers.vehicle) state.map.removeLayer(state.mapLayers.vehicle);
        if (state.mapLayers.road) state.map.removeLayer(state.mapLayers.road);
        if (state.mapLayers.route) state.map.removeLayer(state.mapLayers.route);
        if (state.mapLayers.incident) state.mapLayers.incident.addTo(state.map);
      } else if (state.mapLayers.incident) {
        state.map.removeLayer(state.mapLayers.incident);
      }
    }
    updateIncidentView(true);
  }
  function bindIncidentModule() {
    var module = document.getElementById('incident-module');
    if (!module) return;
    module.addEventListener('click', function (event) {
      if (event.target.closest('.metric-tile') || event.target.closest('.range-tabs') || event.target.closest('#incident-list-trigger') || event.target.closest('.event-list-viewport')) return;
      setIncidentModuleSelected(!state.incidentMode);
    });
    module.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === module) { event.preventDefault(); setIncidentModuleSelected(!state.incidentMode); }
    });
  }
  function updateVehicleLegend() {
    var legend = document.getElementById('map-legend');
    if (!legend || state.roadMode) return;
    legend.innerHTML = '<span><i class="legend-manual"></i>人工驾驶</span><span><i class="legend-auto"></i>自动驾驶</span><span><i class="legend-offline"></i>离线</span>';
  }
  function updateVehicleView(force) {
    var map = state.map;
    var layer = state.mapLayers.vehicle;
    if (!map || !layer) return;
    var mode = !state.vehicleMode ? 'idle' : (map.getZoom() >= VEHICLE_EXPAND_ZOOM ? 'points' : 'cluster');
    if (!force && state.vehicleViewMode === mode) return;
    state.vehicleViewMode = mode;
    layer.clearLayers();
    if (mode === 'cluster') renderVehicleClusters();
    if (mode === 'points') renderVehiclePoints();
  }
  function focusVehicleArea(area) {
    if (!state.map || !state.vehicleMode) return;
    state.map.flyTo(area.center, Math.max(state.map.getZoom(), VEHICLE_EXPAND_ZOOM), { duration: .45 });
  }
  function renderVehicleClusters() {
    var layer = state.mapLayers.vehicle;
    if (!layer) return;
    state.vehicleData.forEach(function (area) {
      var count = vehicleCountForArea(area);
      var html = '<div class="map-cluster-icon" role="button" tabindex="0" aria-label="' + area.name + '，' + count + '辆' + vehicleFilterLabel() + '"><span>' + area.name + '</span><strong>' + count + '</strong><small>' + vehicleFilterLabel() + '</small></div>';
      var marker = L.marker(area.center, { icon: L.divIcon({ className: '', html: html, iconSize: [104, 104], iconAnchor: [52, 52] }), title: area.name, keyboard: true });
      marker.on('click', function () { focusVehicleArea(area); });
      marker.on('keypress', function (event) {
        if (event.originalEvent && (event.originalEvent.key === 'Enter' || event.originalEvent.key === ' ')) { event.originalEvent.preventDefault(); focusVehicleArea(area); }
      });
      marker.addTo(layer);
    });
  }
  function renderVehiclePoints() {
    var layer = state.mapLayers.vehicle;
    if (!layer) return;
    state.vehicleData.forEach(function (area) {
      (area.vehicles || []).filter(vehicleMatches).forEach(function (vehicle) {
        var label = area.name + ' · ' + vehicle.plate + ' · ' + vehicleStatusLabel(vehicle.status);
        var marker = L.marker(vehicle.position, { icon: L.divIcon({ className: 'vehicle-dot ' + vehicle.status, html: '', iconSize: [12, 12], iconAnchor: [6, 6] }), title: label, keyboard: true });
        marker.bindTooltip(label + ' · ' + vehicle.mileage + ' km', { direction: 'top', offset: [0, -6] });
        marker.bindPopup(cockpitVehiclePopup(area, vehicle), { closeButton: true, offset: [0, -8], maxWidth: 340, className: 'cockpit-vehicle-leaflet-popup' });
        marker.on('click', function () { state.selectedVehicleId = vehicle.vehicleId; });
        marker.addTo(layer);
      });
    });
  }
  function setVehicleModuleSelected(selected) {
    var module = document.getElementById('vehicle-monitor-module');
    if (!module) return;
    state.vehicleMode = selected;
    if (selected && state.accidentMode) setAccidentModuleSelected(false);
    if (selected) state.incidentMode = false;
    var incidentModule = document.getElementById('incident-module');
    if (selected && incidentModule) { incidentModule.classList.remove('is-selected'); incidentModule.setAttribute('aria-pressed', 'false'); }
    module.classList.toggle('is-selected', selected);
    module.setAttribute('aria-pressed', String(selected));
    if (selected && state.roadMode) setRoadModuleSelected(false);
    updateVehicleLegend();
    if (state.map) {
      if (selected) {
        if (state.mapLayers.road) state.map.removeLayer(state.mapLayers.road);
        if (state.mapLayers.vehicle) state.mapLayers.vehicle.addTo(state.map);
        if (state.mapLayers.route) state.mapLayers.route.addTo(state.map);
      } else if (state.mapLayers.vehicle) {
        state.map.removeLayer(state.mapLayers.vehicle);
      }
      if (state.mapLayers.incident) state.map.removeLayer(state.mapLayers.incident);
    }
    updateVehicleView(true);
  }
  function bindVehicleResource() {
    var module = document.getElementById('vehicle-monitor-module');
    if (!module) return;
    module.addEventListener('click', function (event) {
      if (event.target.closest('.vehicle-list-trigger')) { event.stopPropagation(); openVehicleListModal(); return; }
      if (event.target.closest('.metric-tile')) return;
      setVehicleModuleSelected(!state.vehicleMode);
    });
    module.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === module) { event.preventDefault(); setVehicleModuleSelected(!state.vehicleMode); }
    });
  }
  function updateRoadLegend() {
    var legend = document.getElementById('map-legend');
    if (!legend) return;
    if (!state.roadMode) {
      updateVehicleLegend();
      return;
    }
    legend.innerHTML = '<span><i class="legend-road-open"></i>开放路段</span><span><i class="legend-road-paused"></i>暂停路段</span>';
  }
  function setRoadModuleSelected(selected) {
    var module = document.getElementById('road-resource-module');
    if (!module) return;
    state.roadMode = selected;
    if (selected) {
      if (state.accidentMode) setAccidentModuleSelected(false);
      state.vehicleMode = false;
      state.incidentMode = false;
      var vehicleModule = document.getElementById('vehicle-monitor-module');
      var incidentModule = document.getElementById('incident-module');
      if (vehicleModule) { vehicleModule.classList.remove('is-selected'); vehicleModule.setAttribute('aria-pressed', 'false'); }
      if (incidentModule) { incidentModule.classList.remove('is-selected'); incidentModule.setAttribute('aria-pressed', 'false'); }
    }
    module.classList.toggle('is-selected', selected);
    module.setAttribute('aria-pressed', String(selected));
    updateRoadLegend();
    if (state.map) {
      if (selected) {
        if (state.mapLayers.vehicle) state.map.removeLayer(state.mapLayers.vehicle);
        if (state.mapLayers.route) state.map.removeLayer(state.mapLayers.route);
        if (state.mapLayers.road) state.mapLayers.road.addTo(state.map);
        if (state.mapLayers.incident) state.map.removeLayer(state.mapLayers.incident);
      } else {
        if (state.mapLayers.road) state.map.removeLayer(state.mapLayers.road);
        if (state.vehicleMode && state.mapLayers.vehicle) state.mapLayers.vehicle.addTo(state.map);
        if (state.mapLayers.route) state.mapLayers.route.addTo(state.map);
        if (state.mapLayers.incident) state.map.removeLayer(state.mapLayers.incident);
      }
    }
    updateRoadView();
    updateVehicleView(true);
  }
  function updateRoadView(force) {
    var map = state.map;
    var layer = state.mapLayers.road;
    if (!map || !layer) return;
    var mode = !state.roadMode ? 'idle' : (map.getZoom() >= ROAD_EXPAND_ZOOM ? 'segment' : 'cluster');
    if (!force && state.roadViewMode === mode) return;
    state.roadViewMode = mode;
    layer.clearLayers();
    if (mode === 'segment') renderRoadSegments(); else if (mode === 'cluster') renderRoadClusters();
  }
  function focusRoadArea(area) {
    var map = state.map;
    if (!map || !state.roadMode) return;
    map.flyTo(area.center, Math.max(map.getZoom(), ROAD_EXPAND_ZOOM), { duration: .45 });
  }
  function renderRoadClusters() {
    var layer = state.mapLayers.road;
    if (!layer) return;
    state.roadData.forEach(function (area) {
      var matching = roadSegmentsForFilter(area);
      var allCount = area.roadCount;
      var filterCount = state.roadFilter === 'all' ? allCount : (state.roadFilter === 'open' ? area.openCount : area.pausedCount);
      var filterLabel = state.roadFilter === 'all' ? '路段总数' : roadStatusLabel(state.roadFilter) + '路段';
      var clusterClass = state.roadFilter === 'paused' ? ' is-paused' : '';
      var html = '<div class="road-cluster-icon' + clusterClass + '" role="button" tabindex="0" aria-label="' + area.name + '，' + filterCount + '段' + filterLabel + '"><span>' + area.name + '</span><strong>' + filterCount + '</strong><small>' + filterLabel + '</small></div>';
      var marker = L.marker(area.center, { icon: L.divIcon({ className: '', html: html, iconSize: [104, 104], iconAnchor: [52, 52] }), title: area.name, keyboard: true });
      marker.on('click', function () { focusRoadArea(area); });
      marker.on('keypress', function (event) { if (event.originalEvent && (event.originalEvent.key === 'Enter' || event.originalEvent.key === ' ')) { event.originalEvent.preventDefault(); focusRoadArea(area); } });
      marker.addTo(layer);
      if (!matching.length && state.roadFilter !== 'all') marker.setOpacity(.38);
    });
  }
  function renderRoadSegments() {
    var layer = state.mapLayers.road;
    if (!layer) return;
    state.roadData.forEach(function (area) {
      roadSegmentsForFilter(area).forEach(function (segment) {
        var color = roadStatusColor(segment.status);
        var line = L.polyline(segment.path, { color: color, weight: 5, opacity: .92, lineCap: 'round', lineJoin: 'round', className: 'road-segment ' + segment.status });
        line.bindPopup('<div class="road-popup"><strong>' + segment.name + '</strong><span class="road-popup-status ' + segment.status + '"><i></i>' + roadStatusLabel(segment.status) + '</span><small>' + area.name + ' · ' + segment.length + ' km · ' + segment.lanes + ' 车道</small></div>', { closeButton: true, offset: [0, -4] });
        line.addTo(layer);
      });
    });
  }
  function bindRoadResource() {
    var module = document.getElementById('road-resource-module');
    if (!module) return;
    module.addEventListener('click', function (event) {
      if (event.target.closest('.road-list-trigger')) { event.stopPropagation(); openRoadListModal(); return; }
      if (event.target.closest('.road-filter')) return;
      setRoadModuleSelected(!state.roadMode);
    });
    module.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === module) { event.preventDefault(); setRoadModuleSelected(!state.roadMode); }
    });
    module.querySelectorAll('.road-filter').forEach(function (tile) {
      tile.addEventListener('click', function (event) {
        event.stopPropagation();
        module.querySelectorAll('.road-filter').forEach(function (other) { other.classList.remove('is-selected'); other.setAttribute('aria-pressed', 'false'); });
        tile.classList.add('is-selected'); tile.setAttribute('aria-pressed', 'true');
        state.roadFilter = tile.dataset.roadFilter || 'all';
        if (!state.roadMode) setRoadModuleSelected(true); else updateRoadView(true);
      });
    });
  }

  function initLeafletMap() {
    var mapEl = document.getElementById('cockpit-map');
    if (!mapEl || !window.L) return;

    var isUltrawide = window.matchMedia && window.matchMedia('(min-aspect-ratio: 12/5)').matches;
    var map = L.map(mapEl, { center: [32.045, 112.145], zoom: isUltrawide ? 12 : 11, zoomControl: true, attributionControl: true, preferCanvas: true, minZoom: 9, maxZoom: 16 });
    var baseLayer = L.layerGroup();
    L.rectangle([[-80, -179], [80, 179]], { stroke: false, fillColor: '#0b2733', fillOpacity: 1, interactive: false }).addTo(baseLayer);
    var roadStyle = { color: '#38627a', weight: 2, opacity: .56, interactive: false };
    [
      [[32.00,111.94],[32.02,112.08],[32.06,112.22],[32.12,112.45]],
      [[31.91,112.16],[31.99,112.17],[32.07,112.17],[32.20,112.16]],
      [[31.93,112.28],[32.00,112.28],[32.09,112.28],[32.20,112.29]],
      [[31.91,112.04],[31.98,112.13],[32.08,112.24],[32.18,112.37]],
      [[32.14,112.00],[32.10,112.12],[32.08,112.24],[32.03,112.41]]
    ].forEach(function (line) { L.polyline(line, roadStyle).addTo(baseLayer); });
    L.polyline([[31.88,112.00],[31.93,112.10],[31.98,112.18],[32.04,112.28],[32.12,112.48]], { color: '#17bdd0', weight: 10, opacity: .25, interactive: false }).addTo(baseLayer);
    L.polyline([[31.88,112.00],[31.93,112.10],[31.98,112.18],[32.04,112.28],[32.12,112.48]], { color: '#4e8793', weight: 2, opacity: .6, interactive: false }).addTo(baseLayer);
    baseLayer.addTo(map);

    var districtLayer = L.layerGroup();
    var vehicleLayer = L.layerGroup();
    var incidentLayer = L.layerGroup();
    var accidentLayer = L.layerGroup();
    var routeLayer = L.layerGroup();
    var roadLayer = L.layerGroup();
    var districtData = [
      { name: '樊城区', center: [32.064, 112.122], polygon: [[32.105,112.055],[32.108,112.16],[32.065,112.19],[32.02,112.15],[32.03,112.07]], count: 34, online: 34, mileageCount: 8, vehicles: [
        { plate: '鄂F·A001', status: 'manual', mileage: 486, position: [32.082,112.095], events: [{ type: '车速超限', category: 'alarm', status: '待处理', period: '本月' }, { type: '通信中断', category: 'warning', status: '已完成', period: '本年' }] }, { plate: '鄂F·A002', status: 'auto', mileage: 728, position: [32.078,112.16], events: [{ type: '路径规划异常', category: 'warning', status: '待审核', period: '本月' }] }, { plate: '鄂F·A007', status: 'offline', mileage: 120, position: [32.06,112.13], events: [{ type: '车载终端异常', category: 'warning', status: '已完成', period: '全部' }] }
      ] },
      { name: '高新区', center: [32.10, 112.24], polygon: [[32.14,112.18],[32.15,112.29],[32.095,112.31],[32.065,112.25],[32.09,112.18]], count: 22, online: 21, mileageCount: 6, vehicles: [
        { plate: '鄂F·A003', status: 'auto', mileage: 912, position: [32.116,112.24], events: [{ type: '电子围栏越界', category: 'warning', status: '已完成', period: '本月' }, { type: '时段合规异常', category: 'alarm', status: '已完成', period: '本年' }] }, { plate: '鄂F·A008', status: 'manual', mileage: 268, position: [32.1,112.27], events: [{ type: '临牌有效期', category: 'alarm', status: '已退回', period: '本月' }] }
      ] },
      { name: '襄州区', center: [32.04, 112.29], polygon: [[32.065,112.24],[32.09,112.36],[32.02,112.42],[31.96,112.31],[31.99,112.24]], count: 31, online: 29, mileageCount: 7, vehicles: [
        { plate: '鄂F·A004', status: 'auto', mileage: 642, position: [32.039,112.30], events: [{ type: '车速超限', category: 'alarm', status: '待处理', period: '本月' }, { type: '电子围栏越界', category: 'warning', status: '待审核', period: '本月' }] }, { plate: '鄂F·A009', status: 'manual', mileage: 354, position: [32.045,112.34], events: [{ type: '非规定时段测试', category: 'warning', status: '已完成', period: '本月' }] }, { plate: '鄂F·A010', status: 'offline', mileage: 188, position: [32.02,112.28], events: [{ type: '车载终端异常', category: 'warning', status: '已完成', period: '全部' }] }
      ] },
      { name: '襄城区', center: [31.99, 112.13], polygon: [[32.02,112.08],[32.03,112.17],[31.98,112.22],[31.93,112.16],[31.94,112.08]], count: 18, online: 18, mileageCount: 5, vehicles: [
        { plate: '鄂F·A005', status: 'manual', mileage: 516, position: [31.987,112.12], events: [{ type: '通信中断', category: 'warning', status: '已完成', period: '本月' }] }, { plate: '鄂F·A011', status: 'auto', mileage: 404, position: [31.98,112.17], events: [{ type: '临牌有效期', category: 'alarm', status: '待审核', period: '本年' }] }
      ] },
      { name: '东津新区', center: [31.98, 112.27], polygon: [[32.01,112.2],[32.03,112.32],[31.96,112.36],[31.91,112.27],[31.94,112.2]], count: 23, online: 23, mileageCount: 4, vehicles: [
        { plate: '鄂F·A006', status: 'auto', mileage: 846, position: [31.969,112.27], events: [{ type: '电子围栏越界', category: 'warning', status: '已完成', period: '本月' }, { type: '车速超限', category: 'alarm', status: '已完成', period: '全部' }] }, { plate: '鄂F·A012', status: 'offline', mileage: 95, position: [31.98,112.31], events: [{ type: '时段合规异常', category: 'alarm', status: '待处理', period: '本月' }] }
      ] }
    ];
    state.vehicleData = districtData;
    ensureCockpitVehicleData(districtData);
    state.accidentData = buildAccidentData(districtData);
    renderAccidentChart();
    state.roadData = [
      { name: '樊城区', center: [32.064, 112.122], roadCount: 34, openCount: 33, pausedCount: 1, segments: [
        { name: '长虹路（人民路—春园路）', status: 'open', length: '4.8', lanes: 6, path: [[32.055,112.085],[32.062,112.12],[32.068,112.16]], scenes: ['无人物流','无人出行'] },
        { name: '大庆西路（长虹路—前进路）', status: 'open', length: '3.6', lanes: 4, path: [[32.083,112.085],[32.078,112.12],[32.072,112.15]], scenes: ['无人出行'] },
        { name: '春园西路（汉江路—长虹路）', status: 'paused', length: '2.1', lanes: 4, path: [[32.096,112.075],[32.089,112.11],[32.081,112.145]], scenes: ['无人环卫'] },
        { name: '人民路（长虹路—立业路）', status: 'open', length: '3.2', lanes: 4, path: [[32.043,112.09],[32.052,112.12],[32.06,112.15]], scenes: ['无人环卫','无人物流'] }
      ] },
      { name: '高新区', center: [32.10, 112.24], roadCount: 26, openCount: 26, pausedCount: 0, segments: [
        { name: '追日路（邓城大道—中原路）', status: 'open', length: '5.5', lanes: 6, path: [[32.12,112.19],[32.105,112.235],[32.09,112.28]], scenes: ['无人物流','无人出行'] },
        { name: '邓城大道（长虹路—东风汽车大道）', status: 'open', length: '7.1', lanes: 8, path: [[32.145,112.18],[32.135,112.23],[32.12,112.29]], scenes: ['无人物流','无人出行','无人公交'] },
        { name: '卧龙大道（台子湾路—追日路）', status: 'open', length: '4.2', lanes: 6, path: [[32.08,112.21],[32.1,112.24],[32.13,112.27]], scenes: ['无人环卫','无人物流'] }
      ] },
      { name: '襄州区', center: [32.04, 112.29], roadCount: 28, openCount: 27, pausedCount: 1, segments: [
        { name: '东津大道（鹿门大道—汉江路）', status: 'open', length: '6.4', lanes: 6, path: [[32.08,112.29],[32.04,112.32],[31.99,112.34]], scenes: ['无人出行','无人公交'] },
        { name: '鹿门大道（东津大道—唐白河路）', status: 'open', length: '5.1', lanes: 4, path: [[32.1,112.27],[32.06,112.28],[32.01,112.29]], scenes: ['无人出行'] },
        { name: '航空路（交通路—园林路）', status: 'paused', length: '2.8', lanes: 4, path: [[32.02,112.25],[32.04,112.29],[32.06,112.34]], scenes: ['无人环卫'] },
        { name: '钻石大道（车城南路—襄阳大道）', status: 'open', length: '4.9', lanes: 6, path: [[31.99,112.21],[32.01,112.27],[32.04,112.36]], scenes: ['无人物流','无人公交'] }
      ] },
      { name: '襄城区', center: [31.99, 112.13], roadCount: 22, openCount: 22, pausedCount: 0, segments: [
        { name: '檀溪路（滨江大道—卧龙南路）', status: 'open', length: '4.5', lanes: 4, path: [[31.98,112.08],[32.0,112.13],[32.02,112.18]], scenes: ['无人出行','无人公交'] },
        { name: '胜利街（庞公路—环城南路）', status: 'open', length: '3.2', lanes: 4, path: [[31.94,112.11],[31.97,112.14],[32.0,112.17]], scenes: ['无人环卫'] },
        { name: '内环路（铁佛寺路—南街）', status: 'open', length: '2.7', lanes: 2, path: [[31.96,112.08],[31.98,112.12],[32.01,112.16]], scenes: ['无人环卫','无人出行'] }
      ] },
      { name: '东津新区', center: [31.98, 112.27], roadCount: 18, openCount: 17, pausedCount: 1, segments: [
        { name: '汉江东路（东津大道—鹿门大道）', status: 'open', length: '5.3', lanes: 6, path: [[31.99,112.23],[31.98,112.28],[31.96,112.33]], scenes: ['无人物流','无人出行'] },
        { name: '东津大道（汉江东路—唐白河路）', status: 'paused', length: '2.4', lanes: 4, path: [[32.02,112.25],[31.99,112.28],[31.95,112.3]], scenes: ['无人公交'] },
        { name: '科技大道（东津大道—鹿门大道）', status: 'open', length: '3.8', lanes: 4, path: [[31.96,112.21],[31.98,112.27],[32.0,112.32]], scenes: ['无人环卫','无人物流'] }
      ] }
    ];
    districtData.forEach(function (item) {
      L.polygon(item.polygon, { color: '#13c8f5', weight: 1, opacity: .5, fillColor: '#123a43', fillOpacity: .23, className: 'district-boundary' }).addTo(districtLayer);
      L.marker(item.center, { icon: L.divIcon({ className: 'district-label', html: item.name, iconSize: [80, 18], iconAnchor: [40, 9] }), interactive: false }).addTo(districtLayer);
    });

    L.polyline([[31.97,112.08],[32.00,112.14],[32.04,112.19],[32.08,112.24],[32.11,112.31]], { color: '#00cfe8', weight: 3, opacity: .78, dashArray: '8 8', className: 'live-route' }).addTo(routeLayer);
    L.circleMarker([31.97,112.08], { radius: 4, color: '#00cfe8', weight: 2, fillColor: '#00cfe8', fillOpacity: 1 }).addTo(routeLayer);
    L.circleMarker([32.11,112.31], { radius: 4, color: '#00cfe8', weight: 2, fillColor: '#00cfe8', fillOpacity: 1 }).addTo(routeLayer);

    districtLayer.addTo(map); vehicleLayer.addTo(map); routeLayer.addTo(map);
    state.map = map; state.mapLayers = { district: districtLayer, vehicle: vehicleLayer, incident: incidentLayer, accident: accidentLayer, route: routeLayer, road: roadLayer, trajectory: null };
    updateVehicleView(true);
    map.on('zoomend', function () { updateRoadView(); updateVehicleView(); updateIncidentView(); updateAccidentView(); });
    window.setTimeout(function () { map.invalidateSize(); }, 80);
    if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize({ animate: false }); }).observe(mapEl);

    document.querySelectorAll('#map-layer-popover input[data-layer]').forEach(function (input) {
      input.addEventListener('change', function () {
        var layerGroup = state.mapLayers[input.dataset.layer];
        if (!layerGroup) return;
        if (input.dataset.layer === 'road' && !state.roadMode) return;
        if (input.dataset.layer === 'incident' && !state.incidentMode) return;
        if (input.dataset.layer === 'accident' && !state.accidentMode) return;
        if (input.checked) layerGroup.addTo(map); else map.removeLayer(layerGroup);
      });
    });
  }

  function bindMap() {
    initLeafletMap();
    var layerBtn = document.getElementById('map-layer-btn'); var layer = document.getElementById('map-layer-popover');
    if (!layerBtn || !layer) return;
    layerBtn.addEventListener('click', function () { var open = layer.classList.toggle('is-open'); layer.setAttribute('aria-hidden', String(!open)); });
    document.addEventListener('click', function (event) { if (!layer.contains(event.target) && event.target !== layerBtn) { layer.classList.remove('is-open'); layer.setAttribute('aria-hidden', 'true'); } });
    var videoClose = document.getElementById('cockpit-video-close');
    if (videoClose) videoClose.addEventListener('click', closeCockpitVideo);
  }

  function bindOverlay() {
    document.querySelectorAll('[data-overlay-close]').forEach(function (element) { element.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && state.modalOpen) closeModal(); });
    document.getElementById('modal-action').addEventListener('click', function () { closeModal(); });
    document.getElementById('application-list-trigger').addEventListener('click', openApplicationListModal);
    document.getElementById('incident-list-trigger').addEventListener('click', openIncidentListModal);
    document.getElementById('accident-list-trigger').addEventListener('click', openAccidentListModal);
    var body = document.getElementById('modal-body');
    body.addEventListener('click', function (event) {
      if (state.modalType === 'accident') {
        var accidentPage = event.target.closest('[data-accident-page]');
        if (!accidentPage || accidentPage.disabled) return;
        var accidentTargetPage = accidentPage.dataset.accidentPage;
        if (accidentTargetPage === 'prev') state.accidentPage--;
        else if (accidentTargetPage === 'next') state.accidentPage++;
        else state.accidentPage = parseInt(accidentTargetPage, 10) || 1;
        renderAccidentListModal();
        return;
      }
      if (state.modalType === 'application') {
        var applicationFilter = event.target.closest('[data-application-filter]');
        if (applicationFilter) {
          state.applicationFilter = applicationFilter.dataset.applicationFilter;
          state.applicationPage = 1;
          renderApplicationListModal();
          return;
        }
        var applicationPage = event.target.closest('[data-application-page]');
        if (!applicationPage || applicationPage.disabled) return;
        var targetPage = applicationPage.dataset.applicationPage;
        if (targetPage === 'prev') state.applicationPage--;
        else if (targetPage === 'next') state.applicationPage++;
        else state.applicationPage = parseInt(targetPage, 10) || 1;
        renderApplicationListModal();
        return;
      }
      if (state.modalType === 'incident') {
        var incidentFilter = event.target.closest('[data-incident-filter]');
        if (incidentFilter) {
          state.incidentListFilter = incidentFilter.dataset.incidentFilter || 'total';
          state.incidentListPage = 1;
          renderIncidentListModal();
          return;
        }
        var incidentPage = event.target.closest('[data-incident-page]');
        if (!incidentPage || incidentPage.disabled) return;
        var incidentTargetPage = incidentPage.dataset.incidentPage;
        if (incidentTargetPage === 'prev') state.incidentListPage--;
        else if (incidentTargetPage === 'next') state.incidentListPage++;
        else state.incidentListPage = parseInt(incidentTargetPage, 10) || 1;
        renderIncidentListModal();
        return;
      }
      if (state.modalType === 'vehicle') return;
      if (state.modalType !== 'road') return;
      var filterButton = event.target.closest('[data-modal-road-filter]');
      if (filterButton) {
        setRoadFilterSelection(filterButton.dataset.modalRoadFilter || 'all');
        state.roadPage = 1;
        renderRoadListModal();
        return;
      }
      var pageButton = event.target.closest('[data-road-page]');
      if (!pageButton || pageButton.disabled) return;
      var target = pageButton.dataset.roadPage;
      if (target === 'prev') state.roadPage = Math.max(1, state.roadPage - 1);
      else if (target === 'next') state.roadPage = state.roadPage + 1;
      else state.roadPage = parseInt(target, 10) || 1;
      renderRoadListModal();
    });
    body.addEventListener('change', function (event) {
      var dateInput = event.target.closest('.application-date-range input');
      if (dateInput && ['application', 'incident', 'accident'].indexOf(state.modalType) !== -1) {
        var type = state.modalType;
        var dateFrom = body.querySelector('#' + type + '-date-from').value;
        var dateTo = body.querySelector('#' + type + '-date-to').value;
        if (type === 'application') {
          state.applicationDateFrom = dateFrom; state.applicationDateTo = dateTo; state.applicationPage = 1;
          renderApplicationListModal();
        } else if (type === 'incident') {
          state.incidentDateFrom = dateFrom; state.incidentDateTo = dateTo; state.incidentListPage = 1;
          renderIncidentListModal();
        } else {
          state.accidentDateFrom = dateFrom; state.accidentDateTo = dateTo; state.accidentPage = 1;
          renderAccidentListModal();
        }
        return;
      }
      var select = event.target.closest('[data-road-area]');
      if (!select || state.modalType !== 'road') return;
      state.roadArea = select.value || 'all';
      state.roadPage = 1;
      renderRoadListModal();
    });
    body.addEventListener('input', function (event) {
      var input = event.target.closest('[data-vehicle-search]');
      if (!input || state.modalType !== 'vehicle') return;
      state.vehicleSearch = input.value || '';
      renderVehicleListModal();
      var nextInput = document.querySelector('[data-vehicle-search]');
      if (nextInput) { nextInput.focus(); nextInput.setSelectionRange(state.vehicleSearch.length, state.vehicleSearch.length); }
    });
  }

  if (typeof TimeClock !== 'undefined') {
    TimeClock.on(function (timeStr, source) {
      if (source === 'video' && trajectoryState.points.length) {
        var target = timeToSeconds(timeStr);
        var nearest = trajectoryState.points.reduce(function (best, point, index) { return Math.abs(timeToSeconds(point.timeStr) - target) < Math.abs(timeToSeconds(trajectoryState.points[best].timeStr) - target) ? index : best; }, 0);
        seekCockpitTrajectory(nearest, 'video');
      }
    });
  }

  window.openCockpitVideo = openCockpitVideo;
  window.openCockpitTrajectory = showCockpitTrajectory;
  window.openCockpitTrajectoryVideo = openCockpitTrajectoryVideo;
  window.closeCockpitTrajectory = closeCockpitTrajectory;
  window.toggleCockpitTrajectory = toggleCockpitTrajectory;
  window.changeCockpitTrajectorySpeed = changeCockpitTrajectorySpeed;
  window.seekCockpitTrajectory = seekCockpitTrajectory;
  window.reloadCockpitTrajectory = reloadCockpitTrajectory;

  setDonut('application', 'road-test'); setDonut('vehicle', 'all'); setDonut('incident', 'total'); updateIncidentTiles();
  bindMetricTiles(); bindRangeTabs(); bindRoadResource(); bindVehicleResource(); bindIncidentModule(); bindAccidentModule(); renderEvents(); bindMap(); bindOverlay(); updateRoadLegend(); updateClock();
  window.setInterval(updateClock, 1000);
}());
