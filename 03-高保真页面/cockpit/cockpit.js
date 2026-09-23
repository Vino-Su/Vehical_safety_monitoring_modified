(function () {
  'use strict';

  var app = document.querySelector('.cockpit-root');
  if (!app) return;

  var ROAD_EXPAND_ZOOM = 13;
  var VEHICLE_EXPAND_ZOOM = 13;
  var ROAD_PAGE_SIZE = 10;
  var APPLICATION_PAGE_SIZE = 8;
  var ACCIDENT_YEAR = new Date().getFullYear();
  var state = { selectedArea: null, modalOpen: false, modalType: null, map: null, mapLayers: {}, roadMode: false, roadFilter: 'all', roadArea: 'all', roadPage: 1, roadViewMode: null, roadData: [], applicationFilter: 'all', applicationPage: 1, applicationDateFrom: '', applicationDateTo: '', vehicleMode: true, vehicleFilter: 'all', vehicleViewMode: null, vehicleData: [], incidentMode: false, incidentFilter: 'total', incidentRange: '本月', incidentViewMode: null, accidentMode: false, accidentRange: '今年', accidentViewMode: null, accidentData: [] };
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
    list.innerHTML = events.map(function (event) {
      return '<div class="event-row event-list-row" role="row"><span class="plate">' + event[0] + '</span><span class="event-kind ' + event[3] + '"><i></i>' + event[1] + '</span><span class="event-time">' + event[2] + '</span></div>';
    }).join('');
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
    overlay.querySelector('.detail-modal').classList.remove('is-road-list', 'is-application-list');
    document.getElementById('application-date-range').hidden = true;
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
    modal.classList.remove('is-application-list');
    document.getElementById('application-date-range').hidden = true;
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
    }).join('') + '</div><div class="road-table-wrap"><table class="road-list-table application-list-table"><thead><tr><th>申请编号</th><th>业务类型</th><th>申请类型</th><th class="number-cell">车辆数</th><th>流程状态</th><th>当前环节</th><th>申请时间</th></tr></thead><tbody>' + (visible.length ? visible.map(function (row) {
      var category = applicationCategories.filter(function (item) { return item.key === row.category; })[0];
      return '<tr><td class="application-code">' + row.id + '</td><td>' + category.label + '</td><td>' + row.type + '</td><td class="number-cell">' + row.vehicles + '</td><td>' + row.status + '</td><td>' + row.stage + '</td><td>' + row.date + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="road-list-empty">当前筛选条件下暂无申请</td></tr>') + '</tbody></table></div><div class="road-pagination"><span class="road-page-total">共 <b>' + rows.length + '</b> 条</span><div class="road-page-controls"><button type="button" class="road-page-btn" data-application-page="prev" aria-label="上一页"' + (state.applicationPage === 1 ? ' disabled' : '') + '>‹</button>' + buttons + '<button type="button" class="road-page-btn" data-application-page="next" aria-label="下一页"' + (state.applicationPage === pages ? ' disabled' : '') + '>›</button></div></div>';
  }
  function openApplicationListModal() {
    state.modalOpen = true; state.modalType = 'application';
    state.applicationFilter = 'all'; state.applicationPage = 1; state.applicationDateFrom = ''; state.applicationDateTo = '';
    var overlay = document.getElementById('overlay-root');
    var modal = overlay.querySelector('.detail-modal');
    modal.classList.remove('is-road-list'); modal.classList.add('is-application-list');
    document.getElementById('modal-kicker').hidden = true;
    document.getElementById('modal-title').textContent = '申请列表';
    document.getElementById('modal-action').textContent = '关闭';
    overlay.querySelector('.ghost-button').hidden = true;
    document.getElementById('application-date-range').hidden = false;
    document.getElementById('application-date-from').value = '';
    document.getElementById('application-date-to').value = '';
    renderApplicationListModal();
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    overlay.querySelector('.modal-close').focus();
  }
  function closeModal() { var overlay = document.getElementById('overlay-root'); overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true'); state.modalOpen = false; state.modalType = null; }

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
    var summary = incidentRangeData[state.incidentRange] || incidentRangeData['本月'];
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
    state.incidentRange = range || '本月';
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
            position: [area.center[0] + (((index * 7 + monthIndex * 3) % 17) - 8) * .0015, area.center[1] + (((index * 11 + monthIndex * 5) % 19) - 9) * .002],
            date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String((index % 28) + 1).padStart(2, '0')
          });
        }
      });
    }
    addYear(ACCIDENT_YEAR - 1, [4, 5, 6, 4, 5, 6]);
    addYear(ACCIDENT_YEAR, months);
    return records;
  }
  function accidentRecords() {
    return state.accidentData.filter(function (record) { return state.accidentRange === '全部' || Number(record.date.slice(0, 4)) === ACCIDENT_YEAR; });
  }
  function renderAccidentChart() {
    var chart = document.getElementById('accident-chart');
    if (!chart) return;
    var records = accidentRecords();
    var labels = state.accidentRange === '全部' ? [(ACCIDENT_YEAR - 1) + '年', ACCIDENT_YEAR + '年'] : ['1月', '2月', '3月', '4月', '5月', '6月'];
    var counts = labels.map(function (label, index) {
      return records.filter(function (record) { return state.accidentRange === '全部' ? record.date.slice(0, 4) === label.slice(0, 4) : Number(record.date.slice(5, 7)) === index + 1; }).length;
    });
    var max = Math.max.apply(null, counts.concat([1]));
    var points = counts.map(function (count, index) { return { x: 42 + index * 450 / (counts.length - 1), y: 168 - count / max * 120, count: count }; });
    var path = points.map(function (point, index) { return (index ? 'L' : 'M') + point.x + ' ' + point.y; }).join(' ');
    chart.setAttribute('aria-label', state.accidentRange + '事故趋势图，共' + records.length + '起');
    chart.innerHTML = '<svg viewBox="0 0 520 208" preserveAspectRatio="none" aria-hidden="true"><g class="chart-grid"><path d="M42 20H500 M42 62H500 M42 104H500 M42 146H500 M42 188H500"/></g><path class="chart-area" d="' + path + ' L492 188 L42 188Z"/><path class="chart-line" d="' + path + '"/><g class="chart-points">' + points.map(function (point) { return '<circle cx="' + point.x + '" cy="' + point.y + '" r="4"/>'; }).join('') + '</g><g class="chart-values">' + points.map(function (point) { return '<text x="' + point.x + '" y="' + (point.y - 11) + '">' + point.count + '</text>'; }).join('') + '</g><g class="chart-labels">' + points.map(function (point, index) { return '<text x="' + point.x + '" y="204">' + labels[index] + '</text>'; }).join('') + '</g></svg>';
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
      if (event.target.closest('.metric-tile') || event.target.closest('.range-tabs') || event.target.closest('#event-more')) return;
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
        marker.bindPopup('<div class="vehicle-popup"><strong>' + vehicle.plate + '</strong><span>' + area.name + '</span><span class="vehicle-popup-status ' + vehicle.status + '"><i></i>' + vehicleStatusLabel(vehicle.status) + '</span><small>累计里程 ' + vehicle.mileage + ' km</small></div>', { closeButton: true, offset: [0, -5] });
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
    state.map = map; state.mapLayers = { district: districtLayer, vehicle: vehicleLayer, incident: incidentLayer, accident: accidentLayer, route: routeLayer, road: roadLayer };
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
  }

  function bindOverlay() {
    document.querySelectorAll('[data-overlay-close]').forEach(function (element) { element.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && state.modalOpen) closeModal(); });
    document.getElementById('modal-action').addEventListener('click', function () { closeModal(); });
    document.getElementById('application-list-trigger').addEventListener('click', openApplicationListModal);
    ['application-date-from', 'application-date-to'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        state.applicationDateFrom = document.getElementById('application-date-from').value;
        state.applicationDateTo = document.getElementById('application-date-to').value;
        state.applicationPage = 1;
        renderApplicationListModal();
      });
    });
    var body = document.getElementById('modal-body');
    body.addEventListener('click', function (event) {
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
      var select = event.target.closest('[data-road-area]');
      if (!select || state.modalType !== 'road') return;
      state.roadArea = select.value || 'all';
      state.roadPage = 1;
      renderRoadListModal();
    });
  }

  setDonut('application', 'road-test'); setDonut('vehicle', 'all'); setDonut('incident', 'total'); updateIncidentTiles();
  bindMetricTiles(); bindRangeTabs(); bindRoadResource(); bindVehicleResource(); bindIncidentModule(); bindAccidentModule(); renderEvents(); bindMap(); bindOverlay(); updateRoadLegend(); updateClock();
  window.setInterval(updateClock, 1000);
}());
