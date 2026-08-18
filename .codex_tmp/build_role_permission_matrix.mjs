import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "04-交付文档/outputs/20260817_role_page_permission_matrix";
const outputFile = `${outputDir}/智能网联汽车安全监测平台_角色与页面权限矩阵.xlsx`;

const roles = [
  ["R01", "政府监管人员", "admin", "政府监管部门（经信/交通/公安）", "监管、审批、道路资源与测试服务管理", "全局业务数据", "测试示范监管模块PRD 1.2；开放道路管理模块PRD 1.2；common.js ROLE_CONFIG"],
  ["R02", "企业用户", "enterprise", "产业运营主体（主机厂/运营企业）", "登记本企业准入信息、提交申请/报告、上报事故、查看本企业数据", "仅本企业数据", "测试示范监管模块PRD 1.2；监测数据分析模块PRD 1.2、4.5；common.js ROLE_CONFIG"],
  ["R03", "第三方专业管理机构", "third-party", "第三方服务机构 / 专业管理机构", "初审申请材料、技术评估、事故报告初审、道路技术支持", "全局业务数据（受委托范围）", "测试示范监管模块PRD 1.2、4.8；开放道路管理模块PRD 1.2、4.7；common.js ROLE_CONFIG"],
  ["R04", "市工作专班", "workgroup", "市工作专班", "专班审核确认、资格终止、事故分析终审", "全局审批与监管数据", "测试示范监管模块PRD 1.2、4.8；common.js ROLE_CONFIG"],
  ["R05", "系统管理员", "未独立配置", "系统管理员", "维护数据字典、操作日志审计与清理", "平台级元数据与全局日志", "平台管理模块PRD 1.2、3.1、3.2"],
  ["R06", "安全审计员", "未独立配置", "安全审计员", "独立开展日志查询和合规检查", "全局日志，只读", "平台管理模块PRD 1.2、3.2"],
  ["R07", "公众访客", "public", "公众用户", "查看公开信息、提交和跟踪在线反馈", "公开信息与本人反馈", "不同人员页面.md；测试示范监管模块PRD F11；common.js ROLE_CONFIG"],
];

const none = "无权限";
const rows = [];
function add(module, group, pageId, pageName, route, gov, enterprise, third, workgroup, sysadmin, auditor, publicUser, dataScope, source, status = "已配置") {
  rows.push([module, group, pageId, pageName, route, gov, enterprise, third, workgroup, sysadmin, auditor, publicUser, dataScope, source, status]);
}

add("工作台", "首页", "home", "平台工作台", "03-高保真页面/layout.html", "查看全局待办与导航", "查看本企业待办与导航", "查看受委托待办与导航", "查看专班待办与导航", none, none, "仅公开页跳转", "按角色展示对应待办、导航与模块入口", "不同人员页面.md；layout.html；common.js", "已配置");

// 开放道路资源管理
add("开放道路资源管理", "城市道路开放目录", "filing", "道路信息建档", "03-高保真页面/road/catalog/filing.html", "查看/新增/编辑/删除/导出", none, "查看/新增/编辑/删除/导出", none, none, none, none, "政府与第三方可维护全市道路台账", "开放道路管理模块PRD 4.7；common.js", "第三方入口待补齐");
add("开放道路资源管理", "城市道路开放目录", "control", "道路资源动态管控", "03-高保真页面/road/catalog/control.html", "查看/状态变更/准入配置/导出", none, "查看/状态变更/准入配置/导出", none, none, none, none, "道路状态变更联动终止相关测试任务", "开放道路管理模块PRD 4.7；common.js", "第三方入口待补齐");
add("开放道路资源管理", "道路资源可视化", "road-map", "地图可视化展示", "03-高保真页面/road/visualization/map.html", "查看/导出", "查看", "查看/导出", none, none, none, none, "可见已开放道路及空间图层", "开放道路管理模块PRD 4.7；common.js", "企业/第三方入口待补齐");
add("开放道路资源管理", "开放道路评估管理", "eval-result", "评估结果管理", "03-高保真页面/road/evaluation/result.html", "查看/导出/触发重新评估", "查看/导出", "查看/导出/触发重新评估", none, none, none, none, "道路评估结果与历史记录", "开放道路管理模块PRD 4.7；common.js", "企业/第三方入口待补齐");
add("开放道路资源管理", "开放道路评估管理", "eval-config", "评估指标配置", "03-高保真页面/road/evaluation/config.html", "查看/编辑/保存", none, "查看/编辑/保存", none, none, none, none, "评估模型及指标参数", "开放道路管理模块PRD 4.7；common.js", "第三方入口待补齐");
add("开放道路资源管理", "开放道路评估管理", "eval-log", "评估日志管理", "03-高保真页面/road/evaluation/log.html", "查看/导出", none, "查看/导出", none, none, none, none, "评估执行与变更日志", "开放道路管理模块PRD 4.7；common.js", "第三方入口待补齐");
add("开放道路资源管理", "区域统计查询", "stats", "区域统计查询", "03-高保真页面/road/statistics/index.html", "查看/导出", "查看/导出", "查看/导出", none, none, none, none, "道路资源统计数据", "开放道路管理模块PRD 4.7；common.js", "企业/第三方入口待补齐");

// 测试示范监管 - 准入信息
for (const [id, name, file, subject] of [
  ["company", "企业信息登记", "company.html", "企业"],
  ["vehicle", "车辆信息登记", "vehicle.html", "车辆"],
  ["person", "人员信息登记", "person.html", "人员"],
]) add("测试示范监管", "准入信息管理", id, name, `03-高保真页面/monitor/access-info/${file}`, "查看全量/登记/编辑", "查看本企业/登记/编辑", none, none, none, none, none, `企业仅可见自身新建的${subject}信息；监管方可见全量`, "测试示范监管模块PRD 1.2、数据权限规则；common.js", "已配置");

for (const [id, name, file] of [
  ["road-test", "道路测试准入申请", "road-test.html"],
  ["demo-apply", "示范应用准入申请", "demo-apply.html"],
  ["demo-operate", "商业化试点准入申请", "demo-operate.html"],
  ["business", "业务申请（扩展页）", "business.html"],
]) add("测试示范监管", "准入申请", id, name, `03-高保真页面/monitor/access-apply/${file}`, "查看全量/辅助处理", "新建/编辑/提交/撤回/查看本企业", none, none, none, none, none, "企业仅可见本企业申请；监管查看全量", "测试示范监管模块PRD 1.2；common.js", id === "business" ? "非导航页，需确认保留" : "已配置");
add("测试示范监管", "准入申请", "apply-records", "业务申请记录", "03-高保真页面/monitor/access-apply/apply-records.html", "查看全量", "查看本企业/撤回符合条件的申请", none, none, none, none, none, "申请流程、状态和材料记录", "测试示范监管模块PRD 1.2；common.js", "已配置");
add("测试示范监管", "准入申请", "report-submission", "报告提交管理", "03-高保真页面/monitor/access-apply/report-submission.html", "查看全量/催报", "新建/提交/查看本企业报告", none, none, none, none, none, "企业报告及报送进度", "测试示范监管模块PRD 1.2；common.js", "已配置");

// 审批与配置
add("测试示范监管", "准入审批管理", "approve", "审批管理", "03-高保真页面/monitor/access-approve/approve.html", "查看/主管部门审批流转", none, "第三方初审（规格）", "专班审核/终审（规格）", none, none, none, "全量申请与审批材料；按节点限制操作", "测试示范监管模块PRD 4.8；common.js", "第三方/专班入口待补齐");
add("测试示范监管", "准入审批管理", "terminate", "资格终止管理", "03-高保真页面/monitor/access-approve/terminate.html", "查看/主管部门协办", none, none, "发起/审核/终止（规格）", none, none, none, "全量资格与终止处理记录", "测试示范监管模块PRD 4.8；common.js", "专班入口待补齐");
add("测试示范监管", "准入审批管理", "report", "报告管理（政府端）", "03-高保真页面/monitor/access-approve/report.html", "查询/向上级报送/归档", none, none, none, none, none, none, "全量报告与归档材料", "测试示范监管模块PRD 4.8；common.js", "已配置");
for (const [id, name, file] of [
  ["approval-config", "测试示范审批配置", "approval-config.html"],
  ["approve-config", "材料目录配置", "config.html"],
  ["abnormal-rule-config", "异常事件规则配置", "abnormal-rule-config.html"],
]) add("测试示范监管", "自定义配置", id, name, `03-高保真页面/monitor/approve-config/${file}`, "查看/新增/编辑/启停/发布", none, none, none, none, none, none, "审批类型、材料目录与异常规则配置", "测试示范监管模块PRD F12；common.js", "已配置");

// 车辆监控
for (const [id, name, file] of [
  ["monitor-map", "监控一张图", "monitor-map.html"],
  ["running", "车辆运行监控", "running.html"],
  ["alarm", "异常状态事件", "alarm.html"],
  ["violation", "交通违法信息", "violation.html"],
]) add("测试示范监管", "车辆状态监控", id, name, `03-高保真页面/monitor/vehicle-monitor/${file}`, "查看全量/筛选/导出", "查看本企业/筛选/导出", none, none, none, none, none, "监管可见全量；企业仅本企业车辆、事件与轨迹", "测试示范监管模块PRD 1.2；common.js", "已配置");
add("测试示范监管", "车辆状态监控", "accident", "事故数据上报", "03-高保真页面/monitor/vehicle-monitor/accident.html", "查看全量/督办", "新建/上报/补充/查看本企业", none, none, none, none, none, "企业事故信息、交通事故报告和分析报告", "测试示范监管模块PRD 1.2、F16；common.js", "已配置");
add("测试示范监管", "车辆状态监控", "accident-review", "事故审核", "03-高保真页面/monitor/vehicle-monitor/accident-review.html", "查看/监管督办", none, "交通事故报告审核/事故分析初审", "事故分析终审", none, none, none, "全量事故材料，按审核节点控制", "测试示范监管模块PRD 4.8；common.js", "已配置");

for (const [id, name, file, action] of [
  ["notice", "信息发布管理", "notice.html", "新建/编辑/审核/发布/下架"],
  ["feedback-manage", "在线反馈管理", "feedback-manage.html", "受理/回复/跟踪/导出"],
  ["fence", "电子围栏管理", "fence.html", "新建/属性编辑/图形绘制/删除"],
  ["evaluation", "测试评价管理", "evaluation.html", "查看/评价/导出"],
]) add("测试示范监管", "测试服务管理", id, name, `03-高保真页面/monitor/service/${file}`, action, none, none, none, none, none, none, "全量监管服务数据", "测试示范监管模块PRD F11、F18、F19；common.js", "已配置");
add("测试示范监管", "信息公开与在线反馈", "info", "信息公开", "03-高保真页面/monitor/public/info.html", "查看", "查看", none, none, none, none, "查看公开信息", "公开信息", "不同人员页面.md；common.js", "已配置");
add("测试示范监管", "信息公开与在线反馈", "feedback", "在线反馈", "03-高保真页面/monitor/public/feedback.html", "查看/提交/跟踪", "查看/提交/跟踪", none, none, none, none, "提交/跟踪本人反馈", "本人反馈与公开处理进度", "不同人员页面.md；测试示范监管模块PRD F11；common.js", "已配置");

// 监测数据分析
const analysisPages = [
  ["overview", "测试数据总览", "analysis/overview.html"], ["alarm-stats", "异常告警统计", "analysis/alarm-stats.html"], ["violation-stats", "违法事故统计", "analysis/violation-stats.html"], ["running-analysis", "运行状态分析", "analysis/running-analysis.html"], ["warning-analysis", "预警事件分析", "analysis/warning-analysis.html"], ["mileage-analysis", "测试里程分析", "analysis/mileage-analysis.html"], ["industry-analysis", "产业发展分析", "analysis/industry-analysis.html"],
];
for (const [id, name, suffix] of analysisPages) add("监测数据分析", "测试数据分析", id, name, `03-高保真页面/data-analysis/${suffix}`, "查看全局/筛选/下钻/导出", "查看本企业/筛选/下钻/导出", none, none, "查看全局/审计", none, none, "政府与系统管理员可见全局；企业仅可见本企业", "监测数据分析模块PRD 1.2、4.5；common.js", "企业/系统管理员入口待补齐");
for (const [id, name, file] of [
  ["company-query", "企业数据查询", "company-query.html"], ["safety-driver-query", "安全员数据查询", "safety-driver-query.html"], ["vehicle-query", "车辆数据查询", "vehicle-query.html"], ["device-query", "设备数据查询", "device-query.html"], ["fault-query", "车辆故障查询", "fault-query.html"],
]) add("监测数据分析", "数据查询检索", id, name, `03-高保真页面/data-analysis/query/${file}`, "查看全局/筛选/详情/导出", "查看本企业/筛选/详情/导出", none, none, "查看全局/审计", none, none, "按企业边界限制企业用户可见数据", "监测数据分析模块PRD 1.2、4.5；common.js", "企业/系统管理员入口待补齐");
for (const [id, name, file] of [
  ["accident-parse", "事故数据解析", "accident-parse.html"], ["accident-cause", "事故成因分析", "accident-cause.html"], ["accident-feature", "事故特征分析", "accident-feature.html"], ["accident-judge", "事故分析研判", "accident-judge.html"],
]) add("监测数据分析", "事故数据分析", id, name, `03-高保真页面/data-analysis/accident/${file}`, "查看全局/分析/导出", "查看本企业/分析/导出", none, none, "查看全局/审计", none, none, "政府与系统管理员可见全局；企业仅本企业事故数据", "监测数据分析模块PRD 1.2、4.5；common.js", "企业/系统管理员入口待补齐");
for (const [id, name, file] of [
  ["road-test-analysis", "道路测试分析", "road-test-analysis.html"], ["demo-apply-analysis", "示范应用分析", "demo-apply-analysis.html"], ["demo-operate-analysis", "商业化试点分析", "demo-operate-analysis.html"],
]) add("监测数据分析", "测试示范分析", id, name, `03-高保真页面/data-analysis/demo/${file}`, "查看全局/筛选/下钻/导出", "查看本企业/筛选/下钻/导出", none, none, "查看全局/审计", none, none, "按企业边界限制企业用户可见数据", "监测数据分析模块PRD 1.2、4.5；common.js", "企业/系统管理员入口待补齐");

// 平台管理
add("平台管理", "数据字典管理", "dict-manage", "字典项管理", "03-高保真页面/platform/dict/index.html", none, none, none, none, "查询/新增/编辑/启用/停用/导出", none, none, "全平台业务元数据", "平台管理模块PRD 1.2、3.1；common.js", "系统管理员角色入口待补齐");
add("平台管理", "操作日志管理", "log-manage", "日志查询", "03-高保真页面/platform/log/index.html", none, none, none, none, "查询/详情/删除/清空", "查询/详情（只读）", none, "全平台用户操作日志", "平台管理模块PRD 1.2、3.2；common.js", "系统管理员/审计员角色入口待补齐");

if (rows.length !== 56) throw new Error(`Expected 56 page rows, got ${rows.length}`);

const workbook = Workbook.create();
const roleSheet = workbook.worksheets.add("角色定义");
const matrixSheet = workbook.worksheets.add("页面权限矩阵");
const gapSheet = workbook.worksheets.add("依据与差异");

const colors = { navy: "#17365D", blue: "#1F4E78", lightBlue: "#D9EAF7", gray: "#F3F6F9", line: "#D9E2F3", green: "#E2F0D9", amber: "#FFF2CC", red: "#FCE4D6", white: "#FFFFFF" };
function title(sheet, range, text) {
  sheet.getRange(range).merge();
  sheet.getRange(range.split(":")[0]).values = [[text]];
  sheet.getRange(range).format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 16 }, horizontalAlignment: "left", verticalAlignment: "center" };
  sheet.getRange(range).format.rowHeight = 28;
}
function section(sheet, range, text) {
  sheet.getRange(range).merge();
  sheet.getRange(range.split(":")[0]).values = [[text]];
  sheet.getRange(range).format = { fill: colors.lightBlue, font: { bold: true, color: colors.navy }, verticalAlignment: "center" };
  sheet.getRange(range).format.rowHeight = 22;
}
function header(sheet, range) {
  sheet.getRange(range).format = { fill: colors.blue, font: { bold: true, color: colors.white }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: colors.line } };
  sheet.getRange(range).format.rowHeight = 34;
}
function grid(sheet, range) {
  sheet.getRange(range).format = { verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: colors.line } };
}

// 角色定义
roleSheet.showGridLines = false;
title(roleSheet, "A1:G1", "智能网联汽车安全监测平台 - 角色定义");
roleSheet.getRange("A3:G3").values = [["角色代码", "角色名称", "原型角色编码", "文档角色/映射", "核心职责", "数据范围", "主要依据"]];
header(roleSheet, "A3:G3");
roleSheet.getRange(`A4:G${roles.length + 3}`).values = roles;
grid(roleSheet, `A4:G${roles.length + 3}`);
roleSheet.getRange(`A4:A${roles.length + 3}`).format.font = { bold: true, color: colors.navy };
section(roleSheet, "A13:G13", "口径说明");
roleSheet.getRange("A14:G17").values = [
  ["1", "“政府监管人员”对应当前原型的 admin；该编码同时承载部分平台管理入口，生产环境建议按业务监管岗与系统管理员分离授权。", null, null, null, null, null],
  ["2", "“第三方专业管理机构”和“市工作专班”已在原型角色配置存在，但审批页的直接入口仍只配置给 admin。", null, null, null, null, null],
  ["3", "页面权限以 PRD 为目标口径，页面可见性以 common.js 为当前原型口径；主表“实现状态”标记需要补齐的差异。", null, null, null, null, null],
  ["4", "无权限表示不应展示菜单、页面及操作入口；页面与接口均应执行角色和数据范围校验。", null, null, null, null, null],
];
roleSheet.getRange("B14:G17").merge(true);
grid(roleSheet, "A14:G17");
roleSheet.getRange("A14:A17").format = { fill: colors.gray, font: { bold: true, color: colors.navy }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
roleSheet.getRange("B14:G17").format = { fill: "#FAFCFE", wrapText: true, verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
roleSheet.getRange("A14:G17").format.rowHeight = 32;
for (const [col, width] of [["A:A", 11], ["B:B", 18], ["C:C", 15], ["D:D", 32], ["E:E", 42], ["F:F", 27], ["G:G", 45]]) roleSheet.getRange(col).format.columnWidth = width;
roleSheet.freezePanes.freezeRows(3);

// 页面权限矩阵
matrixSheet.showGridLines = false;
title(matrixSheet, "A1:O1", "智能网联汽车安全监测平台 - 页面权限矩阵");
matrixSheet.getRange("A2:O4").merge();
matrixSheet.getRange("A2").values = [["权限说明：单元格内容为该角色在页面中的目标页面级权限。无权限 = 页面、菜单和接口均不可访问；“本企业”表示后端需按企业主体强制过滤数据。原型与 PRD 不一致时，见“实现状态”和“依据与差异”工作表。"]];
matrixSheet.getRange("A2:O4").format = { fill: "#F7FBFF", font: { color: colors.navy }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: colors.line } };
matrixSheet.getRange("A6:O6").values = [["一级模块", "二级分组", "页面ID", "页面名称", "页面路径", "政府监管人员", "企业用户", "第三方专业管理机构", "市工作专班", "系统管理员", "安全审计员", "公众访客", "数据范围 / 页面操作说明", "主要依据", "实现状态"]];
header(matrixSheet, "A6:O6");
matrixSheet.getRange(`A7:O${rows.length + 6}`).values = rows;
grid(matrixSheet, `A7:O${rows.length + 6}`);
matrixSheet.getRange(`A7:E${rows.length + 6}`).format.fill = "#FAFCFE";
matrixSheet.getRange(`F7:L${rows.length + 6}`).format.horizontalAlignment = "center";
matrixSheet.getRange(`M7:O${rows.length + 6}`).format.fill = "#FAFCFE";
matrixSheet.getRange(`O7:O${rows.length + 6}`).conditionalFormats.add("containsText", { text: "已配置", format: { fill: colors.green, font: { color: "#375623" } } });
matrixSheet.getRange(`O7:O${rows.length + 6}`).conditionalFormats.add("containsText", { text: "待补齐", format: { fill: colors.amber, font: { color: "#7F6000" } } });
matrixSheet.getRange(`O7:O${rows.length + 6}`).conditionalFormats.add("containsText", { text: "需确认", format: { fill: colors.red, font: { color: "#9C0006" } } });
matrixSheet.getRange(`F7:L${rows.length + 6}`).conditionalFormats.add("containsText", { text: "无权限", format: { fill: colors.gray, font: { color: "#7F7F7F" } } });
for (const [col, width] of [["A:A", 16], ["B:B", 18], ["C:C", 17], ["D:D", 19], ["E:E", 42], ["F:L", 19], ["M:M", 38], ["N:N", 42], ["O:O", 22]]) matrixSheet.getRange(col).format.columnWidth = width;
matrixSheet.getRange(`A7:O${rows.length + 6}`).format.rowHeight = 36;
matrixSheet.getRange(`A7:E${rows.length + 6}`).format.verticalAlignment = "center";
matrixSheet.freezePanes.freezeRows(6);
matrixSheet.freezePanes.freezeColumns(5);
matrixSheet.tables.add(`A6:O${rows.length + 6}`, true, "PagePermissionMatrix");

// 依据与差异
gapSheet.showGridLines = false;
title(gapSheet, "A1:F1", "权限依据与原型差异清单");
gapSheet.getRange("A3:F3").values = [["范围", "PRD / 文档口径", "当前原型页面配置", "差异", "落地建议", "优先级"]];
header(gapSheet, "A3:F3");
const gaps = [
  ["角色编码", "政府监管人员、系统管理员、安全审计员职责分别定义", "原型仅提供 admin，且 admin 同时承载监管及平台管理入口", "职责与权限边界重叠", "拆分监管人员、系统管理员、安全审计员的独立角色编码和菜单策略", "高"],
  ["开放道路资源管理", "企业与第三方可查看地图、评估结果、统计；第三方可维护道路/评估配置", "road 一级模块及全部页面仅 admin 可访问", "7 个页面的企业/第三方页面入口缺失", "按开放道路 PRD 4.7 为 enterprise、third-party 补齐菜单与页面访问规则", "高"],
  ["审批管理", "第三方执行初审；市工作专班执行专班审核、资格终止和事故终审", "approve、terminate 页面仅 admin 可访问", "第三方/专班无法通过原型直接进入职责页面", "将相应页配置给 third-party / workgroup，并按审批节点限制按钮和接口", "高"],
  ["监测数据分析", "企业用户可查看本企业分析和查询数据；系统管理员可查看全局数据与审计", "全部 19 个分析/查询页仅 admin 可访问", "企业与系统管理员入口缺失", "为 enterprise 开放页面并在接口按企业过滤；为系统管理员授予全局只读/审计范围", "高"],
  ["平台管理", "系统管理员管理数据字典和日志；安全审计员只读查询日志", "平台页面仅 admin 可访问，未定义系统管理员/审计员编码", "专用角色与操作权限未在原型体现", "新增 system-admin / auditor 角色；日志删除、清空仅 system-admin", "高"],
  ["扩展页面", "业务申请 business.html、材料目录 config.html 已存在于页面目录", "业务申请未出现在 layout 导航；材料目录存在于 common.js 但 layout 入口缺失", "页面与导航覆盖不一致", "确认 business.html 是否保留；统一 layout.html 与 common.js 菜单配置", "中"],
  ["公共服务", "公众可查看信息公开并提交/跟踪反馈", "public 已配置 info、feedback 两页", "无明显差异", "保持公开页独立导航，并限制访问本人反馈数据", "低"],
];
gapSheet.getRange(`A4:F${gaps.length + 3}`).values = gaps;
grid(gapSheet, `A4:F${gaps.length + 3}`);
gapSheet.getRange(`F4:F${gaps.length + 3}`).format.horizontalAlignment = "center";
gapSheet.getRange(`F4:F${gaps.length + 3}`).conditionalFormats.add("containsText", { text: "高", format: { fill: colors.red, font: { bold: true, color: "#9C0006" } } });
gapSheet.getRange(`F4:F${gaps.length + 3}`).conditionalFormats.add("containsText", { text: "中", format: { fill: colors.amber, font: { bold: true, color: "#7F6000" } } });
gapSheet.getRange(`F4:F${gaps.length + 3}`).conditionalFormats.add("containsText", { text: "低", format: { fill: colors.green, font: { bold: true, color: "#375623" } } });
section(gapSheet, "A13:F13", "实施原则");
gapSheet.getRange("A14:F16").values = [
  ["页面授权", "前端导航过滤 + 页面路由守卫 + 后端接口鉴权三层一致；仅隐藏按钮不构成权限控制。", null, null, null, null],
  ["数据授权", "企业用户所有查询、详情、导出均必须由服务端强制追加所属企业边界；不得接受前端传入的企业范围作为唯一依据。", null, null, null, null],
  ["审批授权", "同一页面内按流程节点和当前待办对象授权，第三方初审、专班审核、主管部门报送不可互相越权。", null, null, null, null],
];
gapSheet.getRange("B14:F16").merge(true);
grid(gapSheet, "A14:F16");
gapSheet.getRange("A14:A16").format = { fill: colors.gray, font: { bold: true, color: colors.navy }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
gapSheet.getRange("B14:F16").format = { fill: "#FAFCFE", wrapText: true, verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
gapSheet.getRange("A14:F16").format.rowHeight = 36;
for (const [col, width] of [["A:A", 20], ["B:B", 42], ["C:C", 36], ["D:D", 34], ["E:E", 44], ["F:F", 12]]) gapSheet.getRange(col).format.columnWidth = width;
gapSheet.freezePanes.freezeRows(3);

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputFile);
console.log(outputFile);
