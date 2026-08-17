// ============================================================
// 公共车辆与摄像头数据（monitor-map / running 两页共用）
// 单一数据源：消除两页面各自硬编码车辆与摄像头配置的重复
// ============================================================

// 统一摄像头配置（6路），id 全局唯一，name/icon/color 供视频组件渲染
var VEHICLE_CAMERAS=[
  {id:'cam_front',name:'前视摄像头',icon:'⬆',color:'#1677ff'},
  {id:'cam_rear',name:'后视摄像头',icon:'⬇',color:'#52c41a'},
  {id:'cam_left',name:'左侧摄像头',icon:'◀',color:'#722ed1'},
  {id:'cam_right',name:'右侧摄像头',icon:'▶',color:'#faad14'},
  {id:'cam_in',name:'车内摄像头',icon:'◉',color:'#ff4d4f'},
  {id:'cam_round',name:'环视摄像头',icon:'◎',color:'#13c2c2'}
];

// 车辆主数据：VIN 为唯一主键；含位置/状态/告警等字段，供地图、列表、视频、轨迹共用
var vehicleData=[
  {id:'V001',plate:'鄂F·A001',company:'A公司',applyType:'road-test',mode:'auto',speed:45,acceleration:0.3,level:'L3',status:'online',lon:112.153,lat:32.070,vin:'LSVAA4189N2000001',heading:128,gear:'D',lastTime:'2026-05-11 14:32:15',alarms:0},
  {id:'V002',plate:'鄂F·A002',company:'A公司',applyType:'road-test',mode:'auto',speed:28,acceleration:-0.2,level:'L3',status:'online',lon:112.112,lat:32.079,vin:'LSVAA4189N2000002',heading:85,gear:'D',lastTime:'2026-05-11 14:32:10',alarms:0},
  {id:'V003',plate:'鄂F·B003',company:'B公司',applyType:'road-test',mode:'auto',speed:32,acceleration:0.1,level:'L4',status:'online',lon:112.166,lat:32.061,vin:'LSVAA4189N2000003',heading:210,gear:'D',lastTime:'2026-05-11 14:32:08',alarms:0},
  {id:'V004',plate:'鄂F·C007',company:'D公司',applyType:'demo',mode:'manual',speed:58,acceleration:0.5,level:'L3',status:'online',lon:112.141,lat:32.011,vin:'LSVAA4189N2000004',heading:320,gear:'D',lastTime:'2026-05-11 14:31:55',alarms:0},
  {id:'V005',plate:'鄂F·D010',company:'C公司',applyType:'demo',mode:'auto',speed:15,acceleration:-0.8,level:'L4',status:'alarm',lon:112.148,lat:32.079,vin:'LSVAA4189N2000005',heading:45,gear:'D',lastTime:'2026-05-11 14:32:20',alarms:2,alarmList:['车载终端通信中断(P0700) 13:45','车辆运行异常：SOC低于阈值(12%) 14:28'],eventCategories:['预警','预警'],alarmTypes:['车载终端异常预警','车辆运行异常预警']},
  {id:'V006',plate:'鄂F·E005',company:'A公司',applyType:'road-test',mode:'manual',speed:0,acceleration:0,level:'L3',status:'offline',lon:112.126,lat:32.018,vin:'LSVAA4189N2000006',heading:0,gear:'P',lastTime:'2026-05-11 10:15:00',alarms:0},
  {id:'V007',plate:'鄂F·B002',company:'B公司',applyType:'demo',mode:'manual',speed:0,acceleration:0,level:'L4',status:'offline',lon:112.219,lat:32.102,vin:'LSVAA4189N2000007',heading:0,gear:'P',lastTime:'2026-05-11 09:30:00',alarms:0},
  {id:'V008',plate:'鄂F·F012',company:'J公司',applyType:'operate',mode:'auto',speed:52,acceleration:0.2,level:'L4',status:'online',lon:112.119,lat:32.072,vin:'LSVAA4189N2000008',heading:170,gear:'D',lastTime:'2026-05-11 14:32:18',alarms:0},
  {id:'V009',plate:'鄂F·G023',company:'C公司',applyType:'operate',mode:'auto',speed:38,acceleration:0.4,level:'L3',status:'online',lon:112.151,lat:32.004,vin:'LSVAA4189N2000009',heading:260,gear:'D',lastTime:'2026-05-11 14:32:05',alarms:0},
  {id:'V010',plate:'鄂F·H034',company:'D公司',applyType:'demo',mode:'manual',speed:42,acceleration:0.1,level:'L3',status:'online',lon:112.101,lat:32.089,vin:'LSVAA4189N2000010',heading:90,gear:'D',lastTime:'2026-05-11 14:31:50',alarms:0},
  {id:'V011',plate:'鄂F·I045',company:'A公司',applyType:'operate',mode:'auto',speed:55,acceleration:0.6,level:'L4',status:'online',lon:112.208,lat:32.089,vin:'LSVAA4189N2000011',heading:180,gear:'D',lastTime:'2026-05-11 14:32:12',alarms:0},
  {id:'V012',plate:'鄂F·J056',company:'B公司',applyType:'road-test',mode:'auto',speed:22,acceleration:-0.3,level:'L3',status:'alarm',lon:112.171,lat:32.068,vin:'LSVAA4189N2000012',heading:350,gear:'D',lastTime:'2026-05-11 14:32:01',alarms:1,alarmList:['电子围栏越界告警 14:10'],eventCategories:['告警'],alarmTypes:['电子围栏越界告警']},
  {id:'V013',plate:'鄂F·K067',company:'J公司',applyType:'operate',mode:'auto',speed:48,acceleration:0.2,level:'L4',status:'online',lon:112.125,lat:32.093,vin:'LSVAA4189N2000013',heading:120,gear:'D',lastTime:'2026-05-11 14:32:16',alarms:0},
  {id:'V014',plate:'鄂F·L078',company:'C公司',applyType:'demo',mode:'manual',speed:0,acceleration:0,level:'L3',status:'offline',lon:112.132,lat:31.996,vin:'LSVAA4189N2000014',heading:0,gear:'P',lastTime:'2026-05-11 08:00:00',alarms:0},
  {id:'V015',plate:'鄂F·M089',company:'D公司',applyType:'operate',mode:'auto',speed:35,acceleration:0.3,level:'L3',status:'online',lon:112.231,lat:32.081,vin:'LSVAA4189N2000015',heading:55,gear:'D',lastTime:'2026-05-11 14:31:45',alarms:0}
];
