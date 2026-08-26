
const PAGE_ID='road-map';

// ==================== 道路数据 ====================
const roadData = [
    { id: 'R001', name: '长虹北路', district: '樊城区', level: '主干道', lanes: 6, length: 3200,
        scenes: ['城区道路', '物流配送道路'], facilities: ['RSU', '激光雷达', '摄像头'], status: '开放',
        openHours: '06:00-22:00', adLevels: ['L2', 'L3', 'L4'], applicationScenes: ['无人物流', '无人环卫'], complexity: 72,
        risk: 35, sceneFit: '载人', openLevel: '完全开放',
        points: [{ lat: 32.030, lng: 112.130 }, { lat: 32.068, lng: 112.130 }] },
    { id: 'R002', name: '汉江路', district: '樊城区', level: '次干道', lanes: 4, length: 2800, scenes: ['城区道路',
            '环卫作业道路'
        ], facilities: ['RSU', '摄像头'], status: '开放', openHours: '08:00-20:00', adLevels: ['L3', 'L4'],
        applicationScenes: ['无人环卫', '无人公交'], complexity: 55, risk: 28, sceneFit: '环卫', openLevel: '完全开放',
        points: [{ lat: 32.030, lng: 112.140 }, { lat: 32.068, lng: 112.140 }] },
    { id: 'R003', name: '中原路', district: '高新区', level: '主干道', lanes: 8, length: 4500, scenes: ['城区道路'],
        facilities: ['RSU', '激光雷达', '摄像头'], status: '开放', openHours: '06:00-23:00', adLevels: ['L2',
            'L3', 'L4'
        ], applicationScenes: ['无人物流', '无人环卫'], complexity: 85, risk: 62, sceneFit: '载人', openLevel: '条件开放',
        points: [{ lat: 32.048, lng: 112.118 }, { lat: 32.048, lng: 112.165 }] },
    { id: 'R004', name: '春园路', district: '樊城区', level: '次干道', lanes: 4, length: 2600, scenes: ['城区道路',
            '园区道路'
        ], facilities: ['摄像头'], status: '暂停', openHours: '08:00-18:00', adLevels: ['L3'], applicationScenes: ['无人物流'],
        complexity: 48, risk: 45, sceneFit: '载人', openLevel: '条件开放',
        points: [{ lat: 32.040, lng: 112.118 }, { lat: 32.040, lng: 112.165 }] },
    { id: 'R005', name: '前进路', district: '高新区', level: '支路', lanes: 2, length: 1800, scenes: ['园区道路',
            '物流配送道路'
        ], facilities: ['RSU'], status: '开放', openHours: '07:00-21:00', adLevels: ['L4'], applicationScenes: ['无人公交'], complexity: 30, risk: 18, sceneFit: '物流', openLevel: '完全开放',
        points: [{ lat: 32.035, lng: 112.135 }, { lat: 32.060, lng: 112.135 }] },
    { id: 'R006', name: '大庆东路', district: '襄城区', level: '主干道', lanes: 6, length: 3800, scenes: ['城区道路'],
        facilities: ['RSU', '激光雷达'], status: '关闭', openHours: '06:00-20:00', adLevels: ['L2', 'L3'],
        applicationScenes: ['无人物流'], complexity: 78, risk: 80, sceneFit: '载人', openLevel: '禁止开放',
        points: [{ lat: 32.055, lng: 112.118 }, { lat: 32.055, lng: 112.165 }] },
    { id: 'R007', name: '人民路', district: '樊城区', level: '主干道', lanes: 6, length: 3500, scenes: ['城区道路',
            '环卫作业道路'
        ], facilities: ['RSU', '摄像头'], status: '开放', openHours: '06:00-22:00', adLevels: ['L3', 'L4'],
        applicationScenes: ['无人环卫', '无人公交'], complexity: 68, risk: 40, sceneFit: '环卫', openLevel: '完全开放',
        points: [{ lat: 32.043, lng: 112.118 }, { lat: 32.043, lng: 112.165 }] },
    { id: 'R008', name: '襄阳大道', district: '高新区', level: '快速路', lanes: 8, length: 5200, scenes: ['城区道路',
            '物流配送道路'
        ], facilities: ['RSU', '激光雷达', '摄像头'], status: '开放', openHours: '00:00-24:00', adLevels: ['L2',
            'L3', 'L4'
        ], applicationScenes: ['无人物流', '无人环卫', '无人公交'], complexity: 90, risk: 55, sceneFit: '载货', openLevel: '条件开放',
        points: [{ lat: 32.058, lng: 112.128 }, { lat: 32.058, lng: 112.170 }] },
    { id: 'R009', name: '建设路', district: '东津新区', level: '次干道', lanes: 4, length: 2100, scenes: ['园区道路'],
        facilities: ['摄像头'], status: '开放', openHours: '08:00-18:00', adLevels: ['L4'], applicationScenes: ['无人环卫'],
        complexity: 42, risk: 22, sceneFit: '载人', openLevel: '完全开放',
        points: [{ lat: 32.025, lng: 112.145 }, { lat: 32.045, lng: 112.145 }] },
    { id: 'R010', name: '航天路', district: '高新区', level: '支路', lanes: 2, length: 1500, scenes: ['园区道路',
            '物流配送道路'
        ], facilities: [], status: '开放', openHours: '07:00-19:00', adLevels: ['L4'], applicationScenes: ['无人公交'],
        complexity: 25, risk: 10, sceneFit: '物流', openLevel: '完全开放',
        points: [{ lat: 32.052, lng: 112.150 }, { lat: 32.065, lng: 112.150 }] },
    { id: 'R011', name: '环城南路', district: '襄城区', level: '快速路', lanes: 8, length: 6000, scenes: ['城区道路'],
        facilities: ['RSU', '激光雷达', '摄像头'], status: '暂停', openHours: '06:00-21:00', adLevels: ['L2',
            'L3'], applicationScenes: ['无人物流', '无人环卫'], complexity: 88, risk: 70, sceneFit: '载人', openLevel: '限制开放',
        points: [{ lat: 32.050, lng: 112.110 }, { lat: 32.050, lng: 112.175 }] },
    { id: 'R012', name: '邓城大道', district: '樊城区', level: '主干道', lanes: 6, length: 4000, scenes: ['城区道路',
            '环卫作业道路', '物流配送道路'
        ], facilities: ['RSU', '激光雷达', '摄像头'], status: '开放', openHours: '05:00-23:00', adLevels: ['L2',
            'L3', 'L4'
        ], applicationScenes: ['无人物流', '无人环卫', '无人公交'], complexity: 80, risk: 48, sceneFit: '载货', openLevel: '完全开放',
        points: [{ lat: 32.062, lng: 112.122 }, { lat: 32.062, lng: 112.168 }] }
];

// 道路详情和资源卡片展示的业务类型，按道路准入范围维护。
const businessTypeByRoad = {
    R001: ['道路测试', '示范应用'],
    R002: ['示范应用', '商业化试点'],
    R003: ['道路测试', '示范应用'],
    R004: ['道路测试'],
    R005: ['示范应用', '商业化试点'],
    R006: ['道路测试'],
    R007: ['示范应用'],
    R008: ['道路测试', '示范应用', '商业化试点'],
    R009: ['示范应用'],
    R010: ['道路测试', '示范应用'],
    R011: ['道路测试'],
    R012: ['道路测试', '示范应用', '商业化试点']
};
roadData.forEach(road => { road.businessTypes = businessTypeByRoad[road.id] || []; });

// ==================== 电子围栏数据 ====================
const fenceData = [
    { id:'F001', name:'樊城区-高新区测试路段', district:'樊城区', fenceType:'允许通行区域', status:'开放', length:'18.6 km', speedLimitEnabled:true, speedLimit:60, supportApply:true, ruleConfig:['车辆越界报警','已停用车辆自动移除'], points:[
        {lat:32.046,lng:112.140},{lat:32.046,lng:112.150},{lat:32.040,lng:112.150},{lat:32.040,lng:112.140}
    ] },
    { id:'F002', name:'襄城环线路段', district:'襄城区', fenceType:'允许通行区域', status:'暂停', length:'9.2 km', speedLimitEnabled:true, speedLimit:80, supportApply:true, ruleConfig:['车辆越界报警','已停用车辆自动移除'], points:[
        {lat:32.034,lng:112.130},{lat:32.034,lng:112.142},{lat:32.028,lng:112.142},{lat:32.028,lng:112.130}
    ] },
    { id:'F003', name:'襄州区老城区禁止驶入区域', district:'东津新区', fenceType:'禁止通行区域', status:'关闭', length:'6.8 km', speedLimitEnabled:false, speedLimit:null, supportApply:false, ruleConfig:['车辆越界报警','已停用车辆自动移除'], points:[
        {lat:32.058,lng:112.155},{lat:32.058,lng:112.168},{lat:32.050,lng:112.168},{lat:32.050,lng:112.155}
    ] },
    { id:'F004', name:'高新区限速区域', district:'高新区', fenceType:'允许通行区域', status:'开放', length:'7.5 km', speedLimitEnabled:true, speedLimit:40, supportApply:true, ruleConfig:['车辆越界报警','已停用车辆自动移除'], points:[
        {lat:32.052,lng:112.146},{lat:32.052,lng:112.156},{lat:32.046,lng:112.156},{lat:32.046,lng:112.146}
    ] },
    { id:'F005', name:'人民广场核心禁区（重大活动）', district:'樊城区', fenceType:'禁止通行区域', status:'待配置矢量', length:'—', speedLimitEnabled:false, speedLimit:null, supportApply:false, ruleConfig:['车辆越界报警'], points:[] }
];

// ==================== 状态管理 ====================
let activeLayer = 'base';
let activeResourceTab = 'road';
let fenceVisible = true;
let selectedRoadId = null;
let selectedFenceId = null;
let filters = {
    district: 'all', bizType: ['all'], facility: ['all'], status: ['all'], roadType: ['all'], adLevel: ['all']
};
let fenceFilters = { status:'all', fenceType:'all' };

// ==================== DOM引用 ====================
const mapArea = document.getElementById('mapArea');
const mapContainer = document.getElementById('map');
const mapTooltip = document.getElementById('mapTooltip');
const tooltipContent = document.getElementById('tooltipContent');
const emptyHint = document.getElementById('emptyHint');
const roadList = document.getElementById('roadList');
const resourceTitle = document.getElementById('resourceTitle');
const resourceCount = document.getElementById('resourceCount');
const roadTabCount = document.getElementById('roadTabCount');
const fenceTabCount = document.getElementById('fenceTabCount');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const legendTitle = document.getElementById('legendTitle');
const legendContent = document.getElementById('legendContent');

// ==================== Leaflet地图初始化 ====================
const map = L.map('map', {
    center: [32.045, 112.145],
    zoom: 13,
    zoomControl: false,
    attributionControl: false
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 10
}).addTo(map);

// ==================== 道路图层管理 ====================
let roadLayers = {};       // { roadId: L.polyline }
let roadLayerGroup = L.layerGroup().addTo(map);
let fenceLayers = {};      // { fenceId: L.polygon }
let fenceLayerGroup = L.layerGroup().addTo(map);
let selectedLayer = null;  // 选中高亮图层 (L.circleMarker)
let facilityMarkers = [];  // 设施图标标记

function getLayerColor(road) {
    switch (activeLayer) {
        case 'base':
            return road.status === '开放' ? '#52c41a' : road.status === '暂停' ? '#fa8c16' : '#ff4d4f';
        case 'complexity':
            if (road.complexity >= 80) return '#ff4d4f';
            if (road.complexity >= 50) return '#fa8c16';
            return '#52c41a';
        case 'risk':
            if (road.risk >= 70) return '#ff4d4f';
            if (road.risk >= 35) return '#fa8c16';
            return '#52c41a';
        case 'scene':
            if (road.sceneFit === '载人') return '#1677ff';
            if (road.sceneFit === '载货') return '#722ed1';
            if (road.sceneFit === '环卫') return '#52c41a';
            if (road.sceneFit === '物流') return '#fa8c16';
            return '#666';
        case 'level':
            if (road.openLevel === '完全开放') return '#52c41a';
            if (road.openLevel === '条件开放') return '#fa8c16';
            if (road.openLevel === '限制开放') return '#ff7a45';
            if (road.openLevel === '禁止开放') return '#ff4d4f';
            return '#999';
        default:
            return '#52c41a';
    }
}

function buildRoadPolylines() {
    const filtered = getFilteredRoads();
    roadLayers = {};
    roadLayerGroup.clearLayers();

    if (filtered.length === 0) {
        emptyHint.classList.add('show');
        return;
    }
    emptyHint.classList.remove('show');

    filtered.forEach(road => {
        const color = getLayerColor(road);
        const latlngs = road.points.map(p => [p.lat, p.lng]);
        const isSelected = road.id === selectedRoadId;

        const polyline = L.polyline(latlngs, {
            color: color,
            weight: isSelected ? 7 : 4,
            opacity: 0.85,
            smoothFactor: 1
        }).addTo(roadLayerGroup);

        polyline.on('click', function(e) {
            selectRoad(road.id);
            L.DomEvent.stopPropagation(e);
        });

        polyline.on('mouseover', function() {
            if (selectedRoadId !== road.id) {
                this.setStyle({ weight: 6, opacity: 1 });
                this.getElement().style.cursor = 'pointer';
            }
        });

        polyline.on('mouseout', function() {
            if (selectedRoadId !== road.id) {
                this.setStyle({ weight: 4, opacity: 0.85 });
            }
        });

        roadLayers[road.id] = polyline;

        // 端点标记
        road.points.forEach(p => {
            L.circleMarker([p.lat, p.lng], {
                radius: 4,
                color: color,
                fillColor: color,
                fillOpacity: 1,
                weight: 1,
                interactive: false
            }).addTo(roadLayerGroup);
        });

        // 道路名称标签
        const midLat = (road.points[0].lat + road.points[1].lat) / 2;
        const midLng = (road.points[0].lng + road.points[1].lng) / 2;
        L.marker([midLat, midLng], {
            icon: L.divIcon({
                className: 'road-label',
                html: `<span style="font-size:12px;font-weight:500;color:#1f1f1f;text-shadow:0 0 4px #fff,0 0 4px #fff;white-space:nowrap;pointer-events:none">${road.name}</span>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            }),
            interactive: false
        }).addTo(roadLayerGroup);
    });

    // 选中道路高亮发光效果
    if (selectedRoadId && roadLayers[selectedRoadId]) {
        const road = roadData.find(r => r.id === selectedRoadId);
        const latlngs = road.points.map(p => [p.lat, p.lng]);
        selectedLayer = L.polyline(latlngs, {
            color: 'rgba(22,119,255,0.25)',
            weight: 16,
            smoothFactor: 1,
            interactive: false
        }).addTo(roadLayerGroup);

        // 确保选中的线在最上层
        roadLayers[selectedRoadId].setStyle({ weight: 7, opacity: 1 });
        roadLayers[selectedRoadId].bringToFront();
    }

    // 设施图标（基础信息图层）
    if (activeLayer === 'base') {
        facilityMarkers.forEach(m => map.removeLayer(m));
        facilityMarkers = [];
        filtered.forEach(road => {
            if (road.facilities.length > 0) {
                const midLat = (road.points[0].lat + road.points[1].lat) / 2;
                const midLng = (road.points[0].lng + road.points[1].lng) / 2;
                const icons = [];
                if (road.facilities.includes('RSU')) icons.push('📡');
                if (road.facilities.includes('激光雷达')) icons.push('🔴');
                if (road.facilities.includes('摄像头')) icons.push('📷');
                icons.forEach((icon, i) => {
                    const marker = L.marker([midLat + i * 0.002, midLng + 0.003], {
                        icon: L.divIcon({
                            className: 'facility-icon',
                            html: `<span style="font-size:14px;pointer-events:none">${icon}</span>`,
                            iconSize: [0, 0],
                            iconAnchor: [0, 0]
                        }),
                        interactive: false
                    }).addTo(map);
                    facilityMarkers.push(marker);
                });
            }
        });
    } else {
        facilityMarkers.forEach(m => map.removeLayer(m));
        facilityMarkers = [];
    }
}

function getFenceColor(fence) {
    if (fence.status === '开放') return '#52c41a';
    if (fence.status === '暂停') return '#faad14';
    if (fence.status === '关闭') return '#ff4d4f';
    return '#1677ff';
}

function getFenceDash(fence) {
    if (fence.status === '暂停') return '8 4';
    if (fence.status === '关闭') return '4 4';
    if (fence.status === '待配置矢量') return '2 4';
    return null;
}

function getFilteredFences() {
    return fenceData.filter(f => {
        if (fenceFilters.status !== 'all' && f.status !== fenceFilters.status) return false;
        if (fenceFilters.fenceType !== 'all' && f.fenceType !== fenceFilters.fenceType) return false;
        return true;
    });
}

function buildFencePolygons() {
    fenceLayers = {};
    fenceLayerGroup.clearLayers();
    if (!fenceVisible) return;
    getFilteredFences().filter(f => f.points && f.points.length >= 3).forEach(fence => {
        const color = getFenceColor(fence);
        const polygon = L.polygon(fence.points.map(p => [p.lat, p.lng]), {
            color: color,
            weight: fence.fenceType === '禁止通行区域' ? 3 : 2,
            dashArray: getFenceDash(fence),
            fillColor: color,
            fillOpacity: fence.fenceType === '禁止通行区域' ? 0.2 : 0.12,
            interactive: true
        }).addTo(fenceLayerGroup);
        polygon.on('click', function(e) {
            selectFence(fence.id);
            L.DomEvent.stopPropagation(e);
        });
        polygon.on('mouseover', function() {
            if (selectedFenceId !== fence.id) this.setStyle({ weight: 3, fillOpacity: 0.2 });
        });
        polygon.on('mouseout', function() {
            if (selectedFenceId !== fence.id) this.setStyle({ weight: fence.fenceType === '禁止通行区域' ? 3 : 2, fillOpacity: fence.fenceType === '禁止通行区域' ? 0.2 : 0.12 });
        });
        fenceLayers[fence.id] = polygon;
        const center = polygon.getBounds().getCenter();
        L.marker(center, {
            icon: L.divIcon({
                className: 'fence-label',
                html: `<span style="font-size:11px;font-weight:500;color:${color};text-shadow:0 0 4px #fff,0 0 4px #fff;white-space:nowrap;pointer-events:none">${fence.name}</span>`,
                iconSize: [0, 0], iconAnchor: [0, 0]
            }),
            interactive: false
        }).addTo(fenceLayerGroup);
    });
    if (selectedFenceId && fenceLayers[selectedFenceId]) {
        fenceLayers[selectedFenceId].setStyle({ weight: 4, fillOpacity: 0.25 });
        fenceLayers[selectedFenceId].bringToFront();
    }
}

function selectFence(id) {
    const fence = fenceData.find(f => f.id === id);
    if (!fence) return;
    selectedFenceId = id;
    if (fence.points.length >= 3) {
        const bounds = L.latLngBounds(fence.points.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
        showFenceTooltip(fence);
    } else {
        closeTooltip();
         tooltipContent.innerHTML = buildFenceTooltipContent(fence);
        mapTooltip.classList.add('visible');
        mapTooltip.style.left = '24px';
        mapTooltip.style.top = '110px';
    }
    buildFencePolygons();
    renderResourceList();
}

function showFenceTooltip(fence) {
    tooltipContent.innerHTML = buildFenceTooltipContent(fence);
    mapTooltip.classList.add('visible');
    const center = L.latLngBounds(fence.points.map(p => [p.lat, p.lng])).getCenter();
    const point = map.latLngToContainerPoint(center);
    mapTooltip.style.left = Math.min(point.x + 20, mapArea.clientWidth - 300) + 'px';
    mapTooltip.style.top = Math.max(10, point.y - 120) + 'px';
}

function buildFenceTooltipContent(fence) {
    const statusClass = fence.status === '开放' ? 'open' : fence.status === '暂停' ? 'suspended' : fence.status === '关闭' ? 'closed' : 'pending';
    const speedText = fence.fenceType === '允许通行区域' && fence.speedLimitEnabled && fence.speedLimit ? `限速 ${fence.speedLimit} km/h` : '不限速';
    const rules = (fence.ruleConfig || []).slice();
    if (fence.fenceType === '允许通行区域' && fence.supportApply) rules.push('支持申请主体申请该区域');
    return `<div class="tt-header"><span class="tt-name">${fence.name}</span><span class="tt-status ${statusClass}">${fence.status}</span></div><div class="tt-row"><span>围栏类型</span><span>${fence.fenceType}</span></div><div class="tt-row"><span>限速配置</span><span>${speedText}</span></div><div class="tt-row"><span>规则配置</span><span>${rules.length ? rules.join('、') : '—'}</span></div>`;
}

// ==================== 筛选逻辑 ====================
function getFilteredRoads() {
    return roadData.filter(r => {
        if (filters.district !== 'all' && r.district !== filters.district) return false;
        if (!filters.bizType.includes('all') && !filters.bizType.some(v => r.applicationScenes.includes(v))) return false;
        if (!filters.facility.includes('all') && !filters.facility.some(v => r.facilities.includes(v))) return false;
        if (!filters.status.includes('all') && !filters.status.includes(r.status)) return false;
        if (!filters.roadType.includes('all') && !filters.roadType.includes(r.level)) return false;
        if (!filters.adLevel.includes('all') && !filters.adLevel.some(v => r.adLevels.includes(v))) return false;
        return true;
    });
}

function getLayerLegend() {
    let roadLegend = '';
    switch (activeLayer) {
        case 'base':
            legendTitle.textContent = '基础信息';
            roadLegend = `
                <div class="legend-item"><span class="legend-color" style="background:#52c41a;"></span><span class="legend-label">开放道路</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#fa8c16;"></span><span class="legend-label">暂停道路</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#ff4d4f;"></span><span class="legend-label">关闭道路</span></div>`;
            break;
        case 'complexity':
            legendTitle.textContent = '道路复杂度';
            roadLegend = `
                <div class="legend-item"><span class="legend-color" style="background:#52c41a;"></span><span class="legend-label">低复杂度</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#fa8c16;"></span><span class="legend-label">中复杂度</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#ff4d4f;"></span><span class="legend-label">高复杂度</span></div>`;
            break;
        case 'risk':
            legendTitle.textContent = '风险评估';
            roadLegend = `
                <div class="legend-item"><span class="legend-color" style="background:#52c41a;"></span><span class="legend-label">低风险</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#fa8c16;"></span><span class="legend-label">中风险</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#ff4d4f;"></span><span class="legend-label">高风险</span></div>`;
            break;
        case 'scene':
            legendTitle.textContent = '场景适配';
            roadLegend = `
                <div class="legend-item"><span class="legend-color" style="background:#1677ff;"></span><span class="legend-label">载人</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#722ed1;"></span><span class="legend-label">载货</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#52c41a;"></span><span class="legend-label">环卫</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#fa8c16;"></span><span class="legend-label">物流</span></div>`;
            break;
        case 'level':
            legendTitle.textContent = '建议开放等级';
            roadLegend = `
                <div class="legend-item"><span class="legend-color" style="background:#52c41a;"></span><span class="legend-label">完全开放</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#fa8c16;"></span><span class="legend-label">条件开放</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#ff7a45;"></span><span class="legend-label">限制开放</span></div>
                <div class="legend-item"><span class="legend-color" style="background:#ff4d4f;"></span><span class="legend-label">禁止开放</span></div>`;
            break;
    }
    legendContent.innerHTML = roadLegend + (fenceVisible ? `<div class="legend-title" style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0">电子围栏</div><div class="legend-item"><span class="legend-color" style="background:#52c41a"></span><span class="legend-label">开放围栏</span></div><div class="legend-item"><span class="legend-color" style="background:#faad14;border-top:2px dashed #faad14"></span><span class="legend-label">暂停围栏</span></div><div class="legend-item"><span class="legend-color" style="background:#ff4d4f;border-top:2px dashed #ff4d4f"></span><span class="legend-label">关闭围栏</span></div>` : '');
}

// ==================== 道路列表渲染 ====================
function renderRoadList() {
    const filtered = getFilteredRoads();
    resourceCount.textContent = `共 ${filtered.length} 条`;
    roadTabCount.textContent = filtered.length;
    let html = '';
    if (filtered.length === 0) {
        html = '<div style="text-align:center;padding:30px;color:#999;">暂无匹配道路</div>';
    }
    filtered.forEach(r => {
        const isSelected = r.id === selectedRoadId;
        const color = getLayerColor(r);
        let statusTag = '';
        if (r.status === '开放') statusTag = '<span class="road-tag tag-open">开放</span>';
        else if (r.status === '暂停') statusTag = '<span class="road-tag tag-suspended">暂停</span>';
        else statusTag = '<span class="road-tag tag-closed">关闭</span>';
        html += `
        <div class="road-item${isSelected ? ' selected' : ''}" onclick="selectRoad('${r.id}')">
            <span class="road-color-dot" style="background:${color};"></span>
            <div class="road-info">
                <div class="road-name">${r.name}</div>
                <div class="road-meta">${r.district} - ${r.applicationScenes.join(' / ')} - ${r.businessTypes.join(' / ')}</div>
            </div>
            ${statusTag}
        </div>`;
    });
    roadList.innerHTML = html;
}

function renderFenceList() {
    const filtered = getFilteredFences();
    resourceTitle.textContent = '电子围栏列表';
    resourceCount.textContent = `共 ${filtered.length} 条`;
    fenceTabCount.textContent = filtered.length;
    let html = '';
    if (filtered.length === 0) html = '<div style="text-align:center;padding:30px;color:#999;">暂无匹配电子围栏</div>';
    filtered.forEach(f => {
        const color = getFenceColor(f);
        const tagClass = f.status === '开放' ? 'tag-open' : f.status === '暂停' ? 'tag-suspended' : f.status === '关闭' ? 'tag-closed' : 'tag-pending';
        html += `<div class="fence-item${f.id === selectedFenceId ? ' selected' : ''}" onclick="selectFence('${f.id}')"><span class="fence-color-dot" style="background:${color}"></span><div class="fence-info"><div class="fence-name">${f.name}</div><div class="fence-meta">${f.fenceType}</div></div><span class="fence-tag ${tagClass}">${f.status}</span></div>`;
    });
    roadList.innerHTML = html;
}

function renderResourceList() {
    if (activeResourceTab === 'fence') renderFenceList();
    else {
        resourceTitle.textContent = '道路列表';
        renderRoadList();
    }
}

// ==================== 道路选中与提示 ====================
function selectRoad(id) {
    if (activeResourceTab !== 'road') switchResourceTab('road');
    selectedRoadId = id;
    selectedFenceId = null;
    const road = roadData.find(r => r.id === id);
    if (road) {
        const midLat = (road.points[0].lat + road.points[1].lat) / 2;
        const midLng = (road.points[0].lng + road.points[1].lng) / 2;
        map.setView([midLat, midLng], map.getZoom(), { animate: true });
        showTooltip(road);
    }
    buildRoadPolylines();
    renderResourceList();
}

function showTooltip(road) {
    const color = getLayerColor(road);
    let statusClass = road.status === '开放' ? 'open' : road.status === '暂停' ? 'suspended' : 'closed';
    tooltipContent.innerHTML = `
        <div class="tt-header">
            <span class="tt-name">${road.name}</span>
            <span class="tt-status ${statusClass}">${road.status}</span>
        </div>
        <div class="tt-row"><span>道路编号</span><span>${road.id}</span></div>
        <div class="tt-row"><span>所属区域</span><span>${road.district}</span></div>
        <div class="tt-row"><span>道路等级</span><span>${road.level}</span></div>
        <div class="tt-row"><span>车道数</span><span>${road.lanes} 车道</span></div>
        <div class="tt-row"><span>路段长度</span><span>${road.length} 米</span></div>
        <div class="tt-row"><span>开放时间</span><span>${road.openHours}</span></div>
        <div class="tt-row"><span>适用自动驾驶等级</span><span>${road.adLevels.join(' / ')}</span></div>
        <div class="tt-row"><span>适用应用场景</span><span>${road.applicationScenes.join(' / ')}</span></div>
        <div class="tt-row"><span>适用业务类型</span><span>${road.businessTypes.join(' / ') || '—'}</span></div>
        ${activeLayer==='complexity' ? `<div class="tt-row"><span>复杂度得分</span><span style="color:${color}">${road.complexity}</span></div>` : ''}
        ${activeLayer==='risk' ? `<div class="tt-row"><span>风险得分</span><span style="color:${color}">${road.risk}</span></div>` : ''}
        ${activeLayer==='scene' ? `<div class="tt-row"><span>场景适配</span><span style="color:${color}">${road.sceneFit}</span></div>` : ''}
        ${activeLayer==='level' ? `<div class="tt-row"><span>建议开放等级</span><span style="color:${color}">${road.openLevel}</span></div>` : ''}
        ${road.facilities.length > 0 ? `<div class="tt-tags" aria-label="感知设备类型">
            ${road.facilities.map(f=>`<span class="tt-tag" style="background:#fff7e6;color:#fa8c16;">${f}</span>`).join('')}
        </div>` : ''}
    `;
    mapTooltip.classList.add('visible');

    const midLat = (road.points[0].lat + road.points[1].lat) / 2;
    const midLng = (road.points[0].lng + road.points[1].lng) / 2;
    const point = map.latLngToContainerPoint([midLat, midLng]);
    const tipX = Math.min(point.x + 20, mapArea.clientWidth - 300);
    const tipY = Math.max(10, point.y - 120);
    mapTooltip.style.left = tipX + 'px';
    mapTooltip.style.top = tipY + 'px';
}

function closeTooltip() {
    mapTooltip.classList.remove('visible');
    selectedRoadId = null;
    selectedFenceId = null;
    buildRoadPolylines();
    buildFencePolygons();
    renderResourceList();
}

function switchResourceTab(tab) {
    activeResourceTab = tab;
    selectedRoadId = null;
    selectedFenceId = null;
    mapTooltip.classList.remove('visible');
    document.getElementById('roadTab').classList.toggle('active', tab === 'road');
    document.getElementById('fenceTab').classList.toggle('active', tab === 'fence');
    document.getElementById('roadTab').setAttribute('aria-selected', tab === 'road');
    document.getElementById('fenceTab').setAttribute('aria-selected', tab === 'fence');
    document.getElementById('districtFilterSection').style.display = tab === 'road' ? 'block' : 'none';
    document.getElementById('roadFilterFields').style.display = tab === 'road' ? 'block' : 'none';
    document.getElementById('fenceFilterFields').style.display = tab === 'fence' ? 'block' : 'none';
    document.getElementById('filterToggle').textContent = '展开筛选 ▾';
    document.getElementById('filterCollapse').style.display = 'none';
    searchInput.placeholder = tab === 'road' ? '搜索道路名称 / 编号...' : '搜索围栏名称 / 编号...';
    getLayerLegend();
    buildRoadPolylines();
    buildFencePolygons();
    renderResourceList();
}

function toggleFenceVisibility(e) {
    if (e) e.stopPropagation();
    fenceVisible = !fenceVisible;
    document.getElementById('fenceToggle').classList.toggle('active', fenceVisible);
    buildFencePolygons();
    getLayerLegend();
}

function applyFenceFilters() {
    fenceFilters.status = document.getElementById('filterFenceStatus').value;
    fenceFilters.fenceType = document.getElementById('filterFenceType').value;
    selectedFenceId = null;
    mapTooltip.classList.remove('visible');
    buildFencePolygons();
    renderResourceList();
}

function resetFenceFilters() {
    fenceFilters = { status:'all', fenceType:'all' };
    document.getElementById('filterFenceStatus').value = 'all';
    document.getElementById('filterFenceType').value = 'all';
    selectedFenceId = null;
    mapTooltip.classList.remove('visible');
    buildFencePolygons();
    renderResourceList();
}

// ==================== 筛选交互（下拉多选） ====================
function toggleMultiSelect(trigger) {
    const ms = trigger.parentElement;
    const dropdown = ms.querySelector('.ms-dropdown');
    const isOpen = dropdown.classList.contains('show');
    document.querySelectorAll('.ms-dropdown.show').forEach(d => {
        d.classList.remove('show');
        d.parentElement.querySelector('.ms-trigger').classList.remove('open');
    });
    if (!isOpen) {
        dropdown.classList.add('show');
        trigger.classList.add('open');
    }
}

function onMultiSelectChange(checkbox) {
    const ms = checkbox.closest('.multi-select');
    const filterType = ms.dataset.filter;
    const allCheckbox = ms.querySelector('input[value="all"]');
    const value = checkbox.value;
    const arr = filters[filterType];

    if (value === 'all') {
        if (checkbox.checked) {
            ms.querySelectorAll('input:not([value="all"])').forEach(c => c.checked = false);
            filters[filterType] = ['all'];
        } else {
            checkbox.checked = true;
            return;
        }
    } else {
        if (checkbox.checked) {
            const allIdx = arr.indexOf('all');
            if (allIdx >= 0) { arr.splice(allIdx, 1); allCheckbox.checked = false; }
            if (!arr.includes(value)) arr.push(value);
        } else {
            const idx = arr.indexOf(value);
            if (idx >= 0) arr.splice(idx, 1);
            if (arr.length === 0) { arr.push('all'); allCheckbox.checked = true; }
        }
    }
    updateMsTriggerText(ms);
    applyFilters();
}

function updateMsTriggerText(ms) {
    const arr = filters[ms.dataset.filter];
    ms.querySelector('.ms-text').textContent = arr.includes('all') ? '全部' : arr.join('、');
}

function applyFilters() {
    filters.district = document.getElementById('filterDistrict').value;
    selectedRoadId = null;
    selectedFenceId = null;
    mapTooltip.classList.remove('visible');
    buildRoadPolylines();
    buildFencePolygons();
    renderResourceList();
}

function resetAllFilters() {
    filters = { district: 'all', bizType: ['all'], facility: ['all'], status: ['all'], roadType: ['all'], adLevel: ['all'] };
    document.getElementById('filterDistrict').value = 'all';
    document.querySelectorAll('.multi-select').forEach(ms => {
        ms.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        const allCb = ms.querySelector('input[value="all"]');
        if (allCb) allCb.checked = true;
        ms.querySelector('.ms-text').textContent = '全部';
    });
    selectedRoadId = null;
    selectedFenceId = null;
    mapTooltip.classList.remove('visible');
    searchInput.value = '';
    searchResults.classList.remove('show');
    buildRoadPolylines();
    buildFencePolygons();
    renderResourceList();
}

function toggleFilters() {
    var collapse = document.getElementById('filterCollapse');
    var toggle = document.getElementById('filterToggle');
    var isHidden = collapse.style.display === 'none';
    if (isHidden) {
        collapse.style.display = 'block';
        toggle.textContent = '收起筛选 ▴';
    } else {
        collapse.style.display = 'none';
        toggle.textContent = '展开筛选 ▾';
    }
}

// ==================== 搜索 ====================
function handleSearchInput(val) {
    if (!val || val.trim() === '') {
        searchResults.classList.remove('show');
        return;
    }
    const q = val.toLowerCase().trim();
    const matched = activeResourceTab === 'road' ? roadData.filter(r => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) : fenceData.filter(f => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q));
    if (matched.length > 0) {
        let html = '';
        matched.forEach(r => {
            const isFence = activeResourceTab === 'fence';
            html += `<div class="search-result-item" onclick="${isFence ? `searchSelectFence('${r.id}')` : `searchSelectRoad('${r.id}')`}"><div class="name">${r.name}</div><div class="detail">${r.id} · ${r.district} · ${isFence ? r.fenceType : r.level}</div></div>`;
        });
        searchResults.innerHTML = html;
        searchResults.classList.add('show');
    } else {
        searchResults.innerHTML =
            `<div style="padding:10px 14px;font-size:12px;color:#999;">未找到匹配${activeResourceTab === 'fence' ? '电子围栏' : '道路'}</div>`;
        searchResults.classList.add('show');
    }
}

function searchSelectRoad(id) {
    searchResults.classList.remove('show');
    searchInput.value = roadData.find(r => r.id === id)?.name || '';
    selectRoad(id);
}

function searchSelectFence(id) {
    searchResults.classList.remove('show');
    searchInput.value = fenceData.find(f => f.id === id)?.name || '';
    selectFence(id);
}

// ==================== 图层切换 ====================
document.getElementById('layerTabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('layer-tab')) {
        document.querySelectorAll('.layer-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        activeLayer = e.target.dataset.layer;
        selectedRoadId = null;
        mapTooltip.classList.remove('visible');
        getLayerLegend();
        buildRoadPolylines();
        buildFencePolygons();
        renderResourceList();
    }
});

// ==================== 地图空白区域点击取消选中 ====================
map.on('click', function() {
    closeTooltip();
});

// ==================== 外部点击关闭搜索与下拉 ====================
document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.classList.remove('show');
    }
    if (!e.target.closest('.multi-select')) {
        document.querySelectorAll('.ms-dropdown.show').forEach(d => {
            d.classList.remove('show');
            d.parentElement.querySelector('.ms-trigger').classList.remove('open');
        });
    }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTooltip(); });

// ==================== 窗口resize ====================
window.addEventListener('resize', function() {
    map.invalidateSize();
});

// ==================== 初始化 ====================
function init() {
    getLayerLegend();
    buildRoadPolylines();
    buildFencePolygons();
    roadTabCount.textContent = roadData.length;
    fenceTabCount.textContent = fenceData.length;
    renderResourceList();
}

init();

console.log('🗺️ 道路与电子围栏资源可视化已就绪 | Leaflet + OpenStreetMap | 道路: ' + roadData.length + ' 条 | 围栏: ' + fenceData.length + ' 条');

