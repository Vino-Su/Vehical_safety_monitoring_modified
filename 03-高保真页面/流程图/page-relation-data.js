(function () {
  'use strict';
  window.PAGE_RELATION_DATA = {
    stages: [
      { id: 'profile', label: '基础档案', caption: '对象登记与准入准备', tone: 'blue' },
      { id: 'road', label: '道路资源', caption: '开放目录与评估', tone: 'green' },
      { id: 'access', label: '准入申请与审批', caption: '申请、审核与牌照', tone: 'indigo' },
      { id: 'monitor', label: '运行监管', caption: '实时监测与事件处置', tone: 'orange' },
      { id: 'analysis', label: '分析与评价', caption: '统计、研判与反馈', tone: 'violet' }
    ],
    nodes: [
      { id:'company', label:'企业信息登记', module:'monitor', stage:'profile', type:'form', roles:['enterprise','admin','third-party','workgroup'], path:'../monitor/access-info/company.html', desc:'维护申请主体的企业档案，营业执照等信息供准入申请读取。', upstream:'企业基础资料', downstream:'准入申请', object:'企业' },
      { id:'person', label:'人员信息登记', module:'monitor', stage:'profile', type:'form', roles:['enterprise','admin','third-party','workgroup'], path:'../monitor/access-info/person.html', desc:'维护驾驶员、安全员等人员档案，申请时按清单选择并固化快照。', upstream:'人员档案', downstream:'准入申请', object:'人员' },
      { id:'vehicle', label:'车辆信息登记', module:'monitor', stage:'profile', type:'form', roles:['enterprise','admin','third-party','workgroup'], path:'../monitor/access-info/vehicle.html', desc:'维护车辆、VIN 和自动驾驶等级，申请及分析查询共用车辆主数据。', upstream:'车辆档案', downstream:'准入申请、运行监管', object:'车辆' },
      { id:'filing', label:'道路信息建档', module:'road', stage:'road', type:'form', roles:['admin','third-party','workgroup'], path:'../road/catalog/filing.html', desc:'维护道路基础标识、适用应用场景和开放管控信息。', upstream:'道路资料', downstream:'准入申请、地图、评估', object:'道路' },
      { id:'control', label:'道路动态管控', module:'road', stage:'road', type:'list', roles:['admin','third-party','workgroup'], path:'../road/catalog/control.html', desc:'调整道路开放状态与准入配置，状态变化可级联影响关联申请。', upstream:'道路档案', downstream:'资格终止、申请流程', object:'道路状态' },
      { id:'road-map', label:'道路地图可视化', module:'road', stage:'road', type:'map', roles:['admin','third-party','workgroup'], path:'../road/visualization/map.html', desc:'在地图上查看道路、电子围栏及适用业务类型。', upstream:'道路档案、围栏', downstream:'用户定位查看', object:'道路' },
      { id:'eval', label:'开放道路评估', module:'road', stage:'road', type:'list', roles:['admin','third-party','workgroup'], path:'../road/evaluation/result.html', desc:'查看评估结果；道路变更或恢复开放后触发评估联动。', upstream:'道路档案、监测数据', downstream:'道路动态管控', object:'评估结果' },
      { id:'road-test', label:'道路测试准入申请', module:'monitor', stage:'access', type:'form', roles:['enterprise','admin'], path:'../monitor/access-apply/road-test.html', desc:'企业提交道路测试申请，读取企业、人员、车辆和道路信息。', upstream:'企业/人员/车辆/道路', downstream:'审批管理、申请记录', object:'准入申请' },
      { id:'demo-apply', label:'示范应用准入申请', module:'monitor', stage:'access', type:'form', roles:['enterprise','admin'], path:'../monitor/access-apply/demo-apply.html', desc:'提交示范应用申请，并按应用场景校验所选道路。', upstream:'企业/人员/车辆/道路', downstream:'审批管理、申请记录', object:'准入申请' },
      { id:'demo-operate', label:'商业化试点申请', module:'monitor', stage:'access', type:'form', roles:['enterprise','admin'], path:'../monitor/access-apply/demo-operate.html', desc:'提交商业化试点申请，执行不同业务场景的前置条件校验。', upstream:'企业/人员/车辆/道路', downstream:'审批管理、申请记录', object:'准入申请' },
      { id:'records', label:'业务申请记录', module:'monitor', stage:'access', type:'list', roles:['enterprise','admin'], path:'../monitor/access-apply/apply-records.html', desc:'查看申请谱系、审批状态、延期、变更和新增车辆申请。', upstream:'准入申请', downstream:'详情、派生申请', object:'申请谱系' },
      { id:'approve', label:'准入审批管理', module:'monitor', stage:'access', type:'list', roles:['admin','third-party','workgroup'], path:'../monitor/access-approve/approve.html', desc:'按第三方初审、专班审核、专家评审等节点推进审批。', upstream:'申请与材料', downstream:'牌照登记、资格终止', object:'审批流程' },
      { id:'plate', label:'临时牌照登记', module:'monitor', stage:'access', type:'form', roles:['enterprise','admin'], path:'../monitor/access-apply/apply-records.html', desc:'审批通过后按车辆登记牌照号、有效期和牌照照片。', upstream:'审批结果、车辆', downstream:'已生效车辆', object:'临时牌照' },
      { id:'terminate', label:'资格终止管理', module:'monitor', stage:'access', type:'list', roles:['admin','third-party','workgroup'], path:'../monitor/access-approve/terminate.html', desc:'终止申请主体或测试车辆资格，并联动进行中的派生申请。', upstream:'道路状态、监管事件', downstream:'申请状态', object:'资格' },
      { id:'monitor-map', label:'监控一张图', module:'monitor', stage:'monitor', type:'map', roles:['admin','enterprise','third-party','workgroup','traffic'], path:'../monitor/vehicle-monitor/monitor-map.html', desc:'统一查看车辆位置、行政区聚合、异常事件、轨迹和视频回放。', upstream:'车辆运行数据、道路、围栏', downstream:'运行监控、异常事件、回放', object:'车辆状态' },
      { id:'running', label:'车辆运行监控', module:'monitor', stage:'monitor', type:'detail', roles:['admin','enterprise','third-party','workgroup','traffic'], path:'../monitor/vehicle-monitor/running.html', desc:'查看单车实时状态和运行明细，可由地图带入车辆条件。', upstream:'车辆、实时数据', downstream:'数据查询', object:'运行数据' },
      { id:'alarm', label:'异常状态事件', module:'monitor', stage:'monitor', type:'list', roles:['admin','third-party','workgroup','traffic'], path:'../monitor/vehicle-monitor/alarm.html', desc:'监管侧查看七类异常事件、命中规则和处理状态。', upstream:'监控数据、规则配置', downstream:'企业处置、分析', object:'异常事件' },
      { id:'alarm-handle', label:'企业异常事件处置', module:'monitor', stage:'monitor', type:'form', roles:['admin','enterprise'], path:'../monitor/vehicle-monitor/alarm-handle.html', desc:'企业填写处置结论、说明和附件，提交第三方审核。', upstream:'异常事件', downstream:'异常事件审核', object:'处置记录' },
      { id:'accident', label:'事故数据上报', module:'monitor', stage:'monitor', type:'form', roles:['admin','enterprise'], path:'../monitor/vehicle-monitor/accident.html', desc:'企业上报事故基本信息、报告与佐证材料。', upstream:'车辆、事故现场', downstream:'事故审核、解析', object:'事故' },
      { id:'accident-review', label:'事故审核', module:'monitor', stage:'monitor', type:'list', roles:['admin','third-party','workgroup','traffic'], path:'../monitor/vehicle-monitor/accident-review.html', desc:'审核事故信息和分析报告，推进事故上报状态机。', upstream:'事故上报', downstream:'事故分析', object:'事故' },
      { id:'violation', label:'交通违法信息', module:'monitor', stage:'monitor', type:'list', roles:['admin','enterprise','third-party','workgroup','traffic'], path:'../monitor/vehicle-monitor/violation.html', desc:'维护和导入交通违法记录，为风险评估和统计提供来源。', upstream:'交管数据', downstream:'评估、违法事故统计', object:'交通违法' },
      { id:'overview', label:'测试数据总览', module:'analysis', stage:'analysis', type:'analysis', roles:['admin','third-party','workgroup'], path:'../data-analysis/analysis/overview.html', desc:'汇总展示测试规模、运行、告警和事故等核心指标。', upstream:'监管数据、道路数据', downstream:'下钻查询', object:'指标' },
      { id:'queries', label:'数据查询检索', module:'analysis', stage:'analysis', type:'list', roles:['admin','enterprise','third-party','workgroup'], path:'../data-analysis/query/vehicle-query.html', desc:'按企业、人员、车辆、设备、故障等维度查询明细。', upstream:'业务档案、运行数据', downstream:'导出、详情', object:'明细数据' },
      { id:'acc-analysis', label:'事故数据分析', module:'analysis', stage:'analysis', type:'analysis', roles:['admin','third-party','workgroup','traffic'], path:'../data-analysis/accident/accident-parse.html', desc:'完成事故解析、成因、特征和研判，形成结构化结论。', upstream:'事故审核、事故报告', downstream:'评价与研判', object:'事故分析' },
      { id:'special-analysis', label:'测试示范专题分析', module:'analysis', stage:'analysis', type:'analysis', roles:['admin','third-party','workgroup'], path:'../data-analysis/demo/road-test-analysis.html', desc:'按道路测试、示范应用和商业化试点输出专题分析。', upstream:'申请、运行、里程数据', downstream:'管理决策', object:'专题报告' },
      { id:'evaluation', label:'测试评价管理', module:'monitor', stage:'analysis', type:'list', roles:['admin','third-party','workgroup'], path:'../monitor/service/evaluation.html', desc:'沉淀测试过程和结果评价，反哺准入与道路资源管理。', upstream:'运行数据、事故、违法', downstream:'道路评估、准入决策', object:'评价结果' }
    ],
    edges: [
      {source:'company',target:'road-test',type:'data',label:'主体信息'}, {source:'person',target:'road-test',type:'data',label:'人员清单'}, {source:'vehicle',target:'road-test',type:'data',label:'车辆清单'}, {source:'filing',target:'road-test',type:'data',label:'道路选择依据'},
      {source:'company',target:'demo-apply',type:'data',label:'主体信息'}, {source:'person',target:'demo-apply',type:'data',label:'人员清单'}, {source:'vehicle',target:'demo-apply',type:'data',label:'车辆清单'}, {source:'filing',target:'demo-apply',type:'data',label:'场景匹配'},
      {source:'road-test',target:'records',type:'navigation',label:'提交后查看'}, {source:'demo-apply',target:'records',type:'navigation',label:'提交后查看'}, {source:'demo-operate',target:'records',type:'navigation',label:'提交后查看'}, {source:'records',target:'approve',type:'process',label:'进入审批'}, {source:'approve',target:'plate',type:'process',label:'审批通过'},
      {source:'control',target:'terminate',type:'state',label:'暂停/关闭道路'}, {source:'terminate',target:'records',type:'state',label:'资格终止'}, {source:'filing',target:'eval',type:'data',label:'道路变更触发'}, {source:'eval',target:'control',type:'state',label:'评估结果反哺'},
      {source:'plate',target:'monitor-map',type:'data',label:'生效车辆'}, {source:'vehicle',target:'monitor-map',type:'data',label:'车辆档案'}, {source:'road-map',target:'monitor-map',type:'data',label:'道路图层'}, {source:'monitor-map',target:'running',type:'navigation',label:'查看单车'}, {source:'monitor-map',target:'alarm',type:'navigation',label:'异常事件'}, {source:'monitor-map',target:'accident',type:'navigation',label:'关联事故'},
      {source:'alarm',target:'alarm-handle',type:'process',label:'企业处置'}, {source:'accident',target:'accident-review',type:'process',label:'提交审核'}, {source:'accident-review',target:'acc-analysis',type:'analysis',label:'分析来源'}, {source:'violation',target:'overview',type:'analysis',label:'统计来源'}, {source:'running',target:'overview',type:'analysis',label:'运行指标'}, {source:'alarm',target:'overview',type:'analysis',label:'告警指标'}, {source:'overview',target:'queries',type:'navigation',label:'下钻明细'}, {source:'acc-analysis',target:'evaluation',type:'analysis',label:'评价依据'}, {source:'evaluation',target:'eval',type:'state',label:'结果反哺道路'}, {source:'special-analysis',target:'evaluation',type:'analysis',label:'专题评价'}
    ],
    support: [
      {label:'权限管理', detail:'用户、组织、角色、资源和数据权限', path:'../platform/user/index.html'},
      {label:'数据字典', detail:'区域、车辆、告警、业务类型等枚举标准', path:'../platform/dict/index.html'},
      {label:'操作日志', detail:'关键新增、审批、导出和状态变更审计', path:'../platform/log/index.html'}
    ],
    relationTypes: { navigation:'页面跳转', data:'数据引用', state:'状态联动', process:'流程上下游', analysis:'分析消费' },
    roles: { all:'全部角色', enterprise:'企业用户', 'third-party':'第三方机构', workgroup:'市工作专班', traffic:'交通管理部门', admin:'系统管理员' }
  };
})();
