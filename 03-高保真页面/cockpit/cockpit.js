(function () {
  'use strict';

  var app = document.querySelector('.cockpit-root');
  if (!app) return;

  var ROAD_EXPAND_ZOOM = 13;
  var VEHICLE_EXPAND_ZOOM = 13;
  var state = { selectedArea: null, modalOpen: false, modalType: null, map: null, mapLayers: {}, roadMode: false, roadFilter: 'all', roadViewMode: null, roadData: [], vehicleMode: true, vehicleFilter: 'all', vehicleViewMode: null, vehicleData: [] };
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
      });
    });
  }

  function bindRangeTabs() {
    document.querySelectorAll('.range-tabs').forEach(function (group) {
      group.querySelectorAll('button').forEach(function (button) {
        button.addEventListener('click', function () {
          group.querySelectorAll('button').forEach(function (other) { other.classList.remove('is-active'); });
          button.classList.add('is-active');
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
    overlay.querySelector('.detail-modal').classList.remove('is-road-list');
    kicker.textContent = '区域下钻'; action.textContent = '查看车辆清单';
    title.textContent = area + ' · 车辆分布';
    body.innerHTML = '<div class="modal-summary"><div class="summary-cell"><span>车辆总数</span><strong>' + count + '</strong></div><div class="summary-cell"><span>在线车辆</span><strong>' + Math.max(1, count - 1) + '</strong></div><div class="summary-cell"><span>异常事件</span><strong>' + (area === '襄州区' ? 2 : 1) + '</strong></div></div><p class="modal-note">当前已切换至' + area + '下钻视图。车辆状态、异常事件与实时轨迹将按区域筛选；返回驾驶舱后保留全市视角。</p>';
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    var close = overlay.querySelector('[data-overlay-close]'); if (close) close.focus();
  }
  function roadListRows() {
    return state.roadData.reduce(function (rows, area) {
      return rows.concat((area.segments || []).map(function (segment) {
        return { name: segment.name, area: area.name, level: segment.lanes >= 6 ? '主干道' : '次干道', lanes: segment.lanes, length: segment.length, status: segment.status, period: '08:00-18:00', scenes: '道路测试 / 示范应用' };
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
  function renderRoadListModal(filter) {
    var body = document.getElementById('modal-body');
    if (!body) return;
    var rows = roadListRows().filter(function (row) { return filter === 'all' || row.status === filter; });
    var totals = state.roadData.reduce(function (result, area) { result.all += area.roadCount; result.open += area.openCount; result.paused += area.pausedCount; return result; }, { all: 0, open: 0, paused: 0 });
    var summary = [['all', '路段总数', totals.all], ['open', '开放道路', totals.open], ['paused', '暂停道路', totals.paused]];
    body.innerHTML = '<div class="road-modal-summary" role="tablist" aria-label="道路状态筛选">' + summary.map(function (item) {
      var active = item[0] === filter ? ' is-selected' : '';
      return '<button type="button" class="road-summary-filter' + active + ' ' + item[0] + '" data-modal-road-filter="' + item[0] + '" role="tab" aria-selected="' + (item[0] === filter) + '"><span>' + item[1] + '</span><strong>' + item[2] + '</strong><small>点击筛选</small></button>';
    }).join('') + '</div><div class="road-list-meta"><span>道路列表</span><b>当前显示 ' + rows.length + ' 条</b></div><div class="road-table-wrap"><table class="road-list-table"><thead><tr><th>道路名称</th><th>所属区域</th><th>道路等级</th><th class="number-cell">车道数</th><th>开放状态</th><th>开放时段</th><th>适用业务场景</th></tr></thead><tbody>' + (rows.length ? rows.map(function (row) {
      return '<tr><td title="' + row.name + '">' + row.name + '</td><td>' + row.area + '</td><td>' + row.level + '</td><td class="number-cell">' + row.lanes + '</td><td><span class="road-status ' + row.status + '"><i></i>' + roadStatusLabel(row.status) + '</span></td><td>' + row.period + '</td><td>' + row.scenes + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="road-list-empty">当前筛选条件下暂无道路</td></tr>') + '</tbody></table></div>';
  }
  function openRoadListModal() {
    state.modalOpen = true; state.modalType = 'road';
    var overlay = document.getElementById('overlay-root'); var modal = overlay.querySelector('.detail-modal');
    document.getElementById('modal-kicker').textContent = '道路资源';
    document.getElementById('modal-title').textContent = '道路列表';
    document.getElementById('modal-action').textContent = '关闭列表';
    modal.classList.add('is-road-list');
    renderRoadListModal('all');
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    var close = overlay.querySelector('[data-overlay-close]'); if (close) close.focus();
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
      state.vehicleMode = false;
      var vehicleModule = document.getElementById('vehicle-monitor-module');
      if (vehicleModule) { vehicleModule.classList.remove('is-selected'); vehicleModule.setAttribute('aria-pressed', 'false'); }
    }
    module.classList.toggle('is-selected', selected);
    module.setAttribute('aria-pressed', String(selected));
    updateRoadLegend();
    if (state.map) {
      if (selected) {
        if (state.mapLayers.vehicle) state.map.removeLayer(state.mapLayers.vehicle);
        if (state.mapLayers.route) state.map.removeLayer(state.mapLayers.route);
        if (state.mapLayers.road) state.mapLayers.road.addTo(state.map);
      } else {
        if (state.mapLayers.road) state.map.removeLayer(state.mapLayers.road);
        if (state.vehicleMode && state.mapLayers.vehicle) state.mapLayers.vehicle.addTo(state.map);
        if (state.mapLayers.route) state.mapLayers.route.addTo(state.map);
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
    var routeLayer = L.layerGroup();
    var roadLayer = L.layerGroup();
    var districtData = [
      { name: '樊城区', center: [32.064, 112.122], polygon: [[32.105,112.055],[32.108,112.16],[32.065,112.19],[32.02,112.15],[32.03,112.07]], count: 34, online: 34, mileageCount: 8, vehicles: [
        { plate: '鄂F·A001', status: 'manual', mileage: 486, position: [32.082,112.095] }, { plate: '鄂F·A002', status: 'auto', mileage: 728, position: [32.078,112.16] }, { plate: '鄂F·A007', status: 'offline', mileage: 120, position: [32.06,112.13] }
      ] },
      { name: '高新区', center: [32.10, 112.24], polygon: [[32.14,112.18],[32.15,112.29],[32.095,112.31],[32.065,112.25],[32.09,112.18]], count: 22, online: 21, mileageCount: 6, vehicles: [
        { plate: '鄂F·A003', status: 'auto', mileage: 912, position: [32.116,112.24] }, { plate: '鄂F·A008', status: 'manual', mileage: 268, position: [32.1,112.27] }
      ] },
      { name: '襄州区', center: [32.04, 112.29], polygon: [[32.065,112.24],[32.09,112.36],[32.02,112.42],[31.96,112.31],[31.99,112.24]], count: 31, online: 29, mileageCount: 7, vehicles: [
        { plate: '鄂F·A004', status: 'auto', mileage: 642, position: [32.039,112.30] }, { plate: '鄂F·A009', status: 'manual', mileage: 354, position: [32.045,112.34] }, { plate: '鄂F·A010', status: 'offline', mileage: 188, position: [32.02,112.28] }
      ] },
      { name: '襄城区', center: [31.99, 112.13], polygon: [[32.02,112.08],[32.03,112.17],[31.98,112.22],[31.93,112.16],[31.94,112.08]], count: 18, online: 18, mileageCount: 5, vehicles: [
        { plate: '鄂F·A005', status: 'manual', mileage: 516, position: [31.987,112.12] }, { plate: '鄂F·A011', status: 'auto', mileage: 404, position: [31.98,112.17] }
      ] },
      { name: '东津新区', center: [31.98, 112.27], polygon: [[32.01,112.2],[32.03,112.32],[31.96,112.36],[31.91,112.27],[31.94,112.2]], count: 23, online: 23, mileageCount: 4, vehicles: [
        { plate: '鄂F·A006', status: 'auto', mileage: 846, position: [31.969,112.27] }, { plate: '鄂F·A012', status: 'offline', mileage: 95, position: [31.98,112.31] }
      ] }
    ];
    state.vehicleData = districtData;
    state.roadData = [
      { name: '樊城区', center: [32.064, 112.122], roadCount: 34, openCount: 33, pausedCount: 1, segments: [
        { name: '长虹路（人民路—春园路）', status: 'open', length: '4.8', lanes: 6, path: [[32.055,112.085],[32.062,112.12],[32.068,112.16]] },
        { name: '大庆西路（长虹路—前进路）', status: 'open', length: '3.6', lanes: 4, path: [[32.083,112.085],[32.078,112.12],[32.072,112.15]] },
        { name: '春园西路（汉江路—长虹路）', status: 'paused', length: '2.1', lanes: 4, path: [[32.096,112.075],[32.089,112.11],[32.081,112.145]] },
        { name: '人民路（长虹路—立业路）', status: 'open', length: '3.2', lanes: 4, path: [[32.043,112.09],[32.052,112.12],[32.06,112.15]] }
      ] },
      { name: '高新区', center: [32.10, 112.24], roadCount: 26, openCount: 26, pausedCount: 0, segments: [
        { name: '追日路（邓城大道—中原路）', status: 'open', length: '5.5', lanes: 6, path: [[32.12,112.19],[32.105,112.235],[32.09,112.28]] },
        { name: '邓城大道（长虹路—东风汽车大道）', status: 'open', length: '7.1', lanes: 8, path: [[32.145,112.18],[32.135,112.23],[32.12,112.29]] },
        { name: '卧龙大道（台子湾路—追日路）', status: 'open', length: '4.2', lanes: 6, path: [[32.08,112.21],[32.1,112.24],[32.13,112.27]] }
      ] },
      { name: '襄州区', center: [32.04, 112.29], roadCount: 28, openCount: 27, pausedCount: 1, segments: [
        { name: '东津大道（鹿门大道—汉江路）', status: 'open', length: '6.4', lanes: 6, path: [[32.08,112.29],[32.04,112.32],[31.99,112.34]] },
        { name: '鹿门大道（东津大道—唐白河路）', status: 'open', length: '5.1', lanes: 4, path: [[32.1,112.27],[32.06,112.28],[32.01,112.29]] },
        { name: '航空路（交通路—园林路）', status: 'paused', length: '2.8', lanes: 4, path: [[32.02,112.25],[32.04,112.29],[32.06,112.34]] },
        { name: '钻石大道（车城南路—襄阳大道）', status: 'open', length: '4.9', lanes: 6, path: [[31.99,112.21],[32.01,112.27],[32.04,112.36]] }
      ] },
      { name: '襄城区', center: [31.99, 112.13], roadCount: 22, openCount: 22, pausedCount: 0, segments: [
        { name: '檀溪路（滨江大道—卧龙南路）', status: 'open', length: '4.5', lanes: 4, path: [[31.98,112.08],[32.0,112.13],[32.02,112.18]] },
        { name: '胜利街（庞公路—环城南路）', status: 'open', length: '3.2', lanes: 4, path: [[31.94,112.11],[31.97,112.14],[32.0,112.17]] },
        { name: '内环路（铁佛寺路—南街）', status: 'open', length: '2.7', lanes: 2, path: [[31.96,112.08],[31.98,112.12],[32.01,112.16]] }
      ] },
      { name: '东津新区', center: [31.98, 112.27], roadCount: 18, openCount: 17, pausedCount: 1, segments: [
        { name: '汉江东路（东津大道—鹿门大道）', status: 'open', length: '5.3', lanes: 6, path: [[31.99,112.23],[31.98,112.28],[31.96,112.33]] },
        { name: '东津大道（汉江东路—唐白河路）', status: 'paused', length: '2.4', lanes: 4, path: [[32.02,112.25],[31.99,112.28],[31.95,112.3]] },
        { name: '科技大道（东津大道—鹿门大道）', status: 'open', length: '3.8', lanes: 4, path: [[31.96,112.21],[31.98,112.27],[32.0,112.32]] }
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
    state.map = map; state.mapLayers = { district: districtLayer, vehicle: vehicleLayer, route: routeLayer, road: roadLayer };
    updateVehicleView(true);
    map.on('zoomend', function () { updateRoadView(); updateVehicleView(); });
    window.setTimeout(function () { map.invalidateSize(); }, 80);
    if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize({ animate: false }); }).observe(mapEl);

    document.querySelectorAll('#map-layer-popover input[data-layer]').forEach(function (input) {
      input.addEventListener('change', function () {
        var layerGroup = state.mapLayers[input.dataset.layer];
        if (!layerGroup) return;
        if (input.dataset.layer === 'road' && !state.roadMode) return;
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
    document.getElementById('modal-body').addEventListener('click', function (event) {
      var filterButton = event.target.closest('[data-modal-road-filter]');
      if (!filterButton || state.modalType !== 'road') return;
      var filter = filterButton.dataset.modalRoadFilter || 'all';
      setRoadFilterSelection(filter);
      renderRoadListModal(filter);
    });
  }

  setDonut('application', 'road-test'); setDonut('vehicle', 'all'); setDonut('incident', 'total');
  bindMetricTiles(); bindRangeTabs(); bindRoadResource(); bindVehicleResource(); renderEvents(); bindMap(); bindOverlay(); updateRoadLegend(); updateClock();
  window.setInterval(updateClock, 1000);
}());
