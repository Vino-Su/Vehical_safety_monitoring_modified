import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "04-交付文档/outputs/20260818_button_permission_matrix";
const outputFile = `${outputDir}/智能网联汽车安全监测平台_按钮级权限矩阵.xlsx`;
const yes = "允许";
const conditional = "条件允许";
const no = "无权限";
const rows = [];

function add(module, group, page, route, area, action, gov = no, enterprise = no, third = no, workgroup = no, sysadmin = no, auditor = no, publicUser = no, condition = "按页面数据范围控制", source = "PRD / 原型页面", status = "已配置") {
  rows.push([module, group, page, route, area, action, gov, enterprise, third, workgroup, sysadmin, auditor, publicUser, condition, source, status]);
}
function actionSet(module, group, page, route, entries) {
  for (const item of entries) add(module, group, page, route, ...item);
}
function commonSearch(module, group, page, route, roles, condition, source, status = "已配置") {
  const [g, e, t, w, s, a, p] = roles;
  add(module, group, page, route, "查询区", "查询", g, e, t, w, s, a, p, condition, source, status);
  add(module, group, page, route, "查询区", "重置", g, e, t, w, s, a, p, condition, source, status);
}

// 开放道路资源管理
const road = "开放道路资源管理";
commonSearch(road, "城市道路开放目录", "道路信息建档", "road/catalog/filing.html", [yes, yes, yes, no, no, no, no], "仅可访问本页面的角色；企业仅查看", "开放道路管理模块PRD 3.1；common.js", "企业/第三方入口待补齐");
actionSet(road, "城市道路开放目录", "道路信息建档", "road/catalog/filing.html", [
  ["工具栏", "新建道路", yes, no, yes, no, no, no, no, "创建全市道路台账", "filing.html；开放道路管理模块PRD 4.7", "第三方入口待补齐"],
  ["工具栏", "批量导入", yes, no, yes, no, no, no, no, "导入道路基础数据并记录操作日志", "filing.html；开放道路管理模块PRD 4.7", "第三方入口待补齐"],
  ["工具栏", "导出", yes, no, yes, no, no, no, no, "按筛选或勾选记录导出", "filing.html；开放道路管理模块PRD 4.7", "第三方入口待补齐"],
  ["操作列", "查看详情", yes, yes, yes, no, no, no, no, "只读道路完整字段", "开放道路管理模块PRD 3.1.3", "企业/第三方入口待补齐"],
  ["操作列", "编辑", yes, no, yes, no, no, no, no, "编辑前回填，保存后记变更日志", "开放道路管理模块PRD 3.1.3、4.7", "第三方入口待补齐"],
  ["操作列", "删除", yes, no, yes, no, no, no, no, "二次确认后逻辑删除", "开放道路管理模块PRD 3.1.3、4.7", "第三方入口待补齐"],
]);
commonSearch(road, "城市道路开放目录", "道路资源动态管控", "road/catalog/control.html", [yes, yes, yes, no, no, no, no], "企业仅查看；道路状态变更影响关联测试任务", "开放道路管理模块PRD 3.2；common.js", "企业/第三方入口待补齐");
actionSet(road, "城市道路开放目录", "道路资源动态管控", "road/catalog/control.html", [
  ["操作列", "查看详情", yes, yes, yes, no, no, no, no, "始终显示，只读", "开放道路管理模块PRD 3.2.3", "企业/第三方入口待补齐"],
  ["操作列", "暂停", conditional, no, conditional, no, no, no, no, "仅道路状态为开放时显示；确认后触发状态变更", "开放道路管理模块PRD 3.2.3", "第三方入口待补齐"],
  ["操作列", "关闭", conditional, no, conditional, no, no, no, no, "仅道路状态为开放或暂停时显示；危险操作", "开放道路管理模块PRD 3.2.3", "第三方入口待补齐"],
  ["操作列", "恢复", conditional, no, conditional, no, no, no, no, "仅道路状态为暂停或关闭时显示", "开放道路管理模块PRD 3.2.3", "第三方入口待补齐"],
  ["操作列", "准入配置", yes, no, yes, no, no, no, no, "维护差异化准入要求", "开放道路管理模块PRD 3.2.3、4.7", "第三方入口待补齐"],
  ["操作列", "变更记录", yes, no, yes, no, no, no, no, "查看道路状态和配置变更历史", "开放道路管理模块PRD 3.2.3", "第三方入口待补齐"],
]);
commonSearch(road, "道路资源可视化", "地图可视化展示", "road/visualization/map.html", [yes, yes, yes, no, no, no, no], "仅查看已开放道路及空间图层", "开放道路管理模块PRD 4.7；common.js", "企业/第三方入口待补齐");
add(road, "道路资源可视化", "地图可视化展示", "road/visualization/map.html", "地图/列表", "道路详情", yes, yes, yes, no, no, no, no, "只读地图点位、道路属性和评估摘要", "map.html；开放道路管理模块PRD 4.7", "企业/第三方入口待补齐");
commonSearch(road, "开放道路评估管理", "评估结果管理", "road/evaluation/result.html", [yes, yes, yes, no, no, no, no], "评估结果按授权道路范围展示", "开放道路管理模块PRD 3.5、4.7；common.js", "企业/第三方入口待补齐");
actionSet(road, "开放道路评估管理", "评估结果管理", "road/evaluation/result.html", [
  ["操作列", "查看详情", yes, yes, yes, no, no, no, no, "含评估详情 5 个页签", "开放道路管理模块PRD 3.5.3", "企业/第三方入口待补齐"],
  ["操作列", "评估记录", yes, yes, yes, no, no, no, no, "查看评估记录对比", "开放道路管理模块PRD 3.5.3", "企业/第三方入口待补齐"],
  ["操作列", "重新评估", yes, no, yes, no, no, no, no, "触发指定道路重新评估", "开放道路管理模块PRD 3.5.3、4.7", "第三方入口待补齐"],
  ["工具栏", "导出", yes, yes, yes, no, no, no, no, "导出当前筛选结果", "开放道路管理模块PRD 4.7", "企业/第三方入口待补齐"],
]);
commonSearch(road, "开放道路评估管理", "评估指标配置", "road/evaluation/config.html", [yes, no, yes, no, no, no, no], "仅管理评估指标与参数", "开放道路管理模块PRD 4.7；common.js", "第三方入口待补齐");
actionSet(road, "开放道路评估管理", "评估指标配置", "road/evaluation/config.html", [
  ["工具栏/操作列", "新增/编辑指标", yes, no, yes, no, no, no, no, "变更评估模型参数，需记录变更日志", "开放道路管理模块PRD 4.7、4.9", "第三方入口待补齐"],
  ["弹窗", "保存配置", yes, no, yes, no, no, no, no, "校验通过后生效", "config.html；开放道路管理模块PRD 4.7", "第三方入口待补齐"],
]);
commonSearch(road, "开放道路评估管理", "评估日志管理", "road/evaluation/log.html", [yes, no, yes, no, no, no, no], "查看评估执行记录", "开放道路管理模块PRD 4.7；common.js", "第三方入口待补齐");
add(road, "开放道路评估管理", "评估日志管理", "road/evaluation/log.html", "工具栏", "导出", yes, no, yes, no, no, no, no, "导出当前筛选日志", "开放道路管理模块PRD 4.7", "第三方入口待补齐");
commonSearch(road, "区域统计查询", "区域统计查询", "road/statistics/index.html", [yes, yes, yes, no, no, no, no], "按行政区域和道路等级统计", "开放道路管理模块PRD 4.7；common.js", "企业/第三方入口待补齐");
add(road, "区域统计查询", "区域统计查询", "road/statistics/index.html", "工具栏", "导出", yes, yes, yes, no, no, no, no, "导出当前统计结果", "开放道路管理模块PRD 4.7", "企业/第三方入口待补齐");

// 准入信息管理
const monitor = "测试示范监管";
for (const [page, route, subject, exportRoles] of [
  ["企业信息登记", "monitor/access-info/company.html", "企业", [yes, no, yes]],
  ["车辆信息登记", "monitor/access-info/vehicle.html", "车辆", [yes, yes, yes]],
  ["人员信息登记", "monitor/access-info/person.html", "人员", [yes, yes, no]],
]) {
  commonSearch(monitor, "准入信息管理", page, route, [yes, yes, yes, no, no, no, no], "企业仅可见本企业登记数据；监管/第三方可见全量", "测试示范监管模块PRD 3.1-3.3", "第三方入口待补齐");
  add(monitor, "准入信息管理", page, route, "工具栏", `新增${subject}信息`, no, yes, no, no, no, no, no, "仅测试主体/企业用户创建本主体信息", "测试示范监管模块PRD 3.1-3.3", "已配置");
  add(monitor, "准入信息管理", page, route, "工具栏", "导出", exportRoles[0], exportRoles[1], exportRoles[2], no, no, no, no, "按筛选条件导出；企业仅导出本企业数据", "测试示范监管模块PRD 3.1-3.3", exportRoles[2] === yes ? "第三方入口待补齐" : "已配置");
  add(monitor, "准入信息管理", page, route, "操作列", "查看详情", yes, yes, yes, no, no, no, no, "企业仅查看自身记录", "测试示范监管模块PRD 3.1-3.3", "第三方入口待补齐");
  add(monitor, "准入信息管理", page, route, "操作列", "编辑", no, yes, no, no, no, no, no, "仅可编辑本企业创建的记录", "测试示范监管模块PRD 3.1-3.3", "已配置");
  add(monitor, "准入信息管理", page, route, "操作列", "删除", no, yes, no, no, no, no, no, "二次确认后逻辑删除本企业记录", "测试示范监管模块PRD 3.1-3.3", "已配置");
}

// 准入申请与报告
for (const [page, route] of [["道路测试准入申请", "monitor/access-apply/road-test.html"], ["示范应用准入申请", "monitor/access-apply/demo-apply.html"], ["商业化试点准入申请", "monitor/access-apply/demo-operate.html"]]) {
  commonSearch(monitor, "准入申请", page, route, [yes, yes, no, no, no, no, no], "监管查看全量；企业仅本企业申请", "测试示范监管模块PRD 1.2；common.js");
  add(monitor, "准入申请", page, route, "工具栏", "新增申请", no, yes, no, no, no, no, no, "仅企业新建本企业申请", "测试示范监管模块PRD 3.4-3.6", "已配置");
  add(monitor, "准入申请", page, route, "表单", "保存草稿", no, conditional, no, no, no, no, no, "仅草稿或被退回申请可保存", "页面实现；测试示范监管模块PRD 申请流程", "已配置");
  add(monitor, "准入申请", page, route, "表单", "提交申请", no, conditional, no, no, no, no, no, "仅校验通过的草稿或退回申请可提交", "测试示范监管模块PRD 申请流程", "已配置");
  add(monitor, "准入申请", page, route, "操作列", "查看申请详情/流程", yes, yes, no, no, no, no, no, "企业仅可查看本企业申请", "测试示范监管模块PRD 1.2；common.js", "已配置");
  add(monitor, "准入申请", page, route, "操作列", "撤回申请", no, conditional, no, no, no, no, no, "仅处于允许撤回状态且属于本企业的申请", "测试示范监管模块PRD 申请流程", "已配置");
}
commonSearch(monitor, "准入申请", "业务申请记录", "monitor/access-apply/apply-records.html", [yes, yes, no, no, no, no, no], "企业仅本企业记录", "测试示范监管模块PRD 1.2；common.js");
add(monitor, "准入申请", "业务申请记录", "monitor/access-apply/apply-records.html", "操作列", "查看详情/流程日志", yes, yes, no, no, no, no, no, "企业仅可查看本企业记录", "apply-records.html；测试示范监管模块PRD", "已配置");
add(monitor, "准入申请", "业务申请记录", "monitor/access-apply/apply-records.html", "操作列", "撤回", no, conditional, no, no, no, no, no, "仅申请状态允许且属于本企业", "apply-records.html；测试示范监管模块PRD", "已配置");
commonSearch(monitor, "准入申请", "报告提交管理", "monitor/access-apply/report-submission.html", [yes, yes, no, no, no, no, no], "企业仅查看、提交本企业报告", "report-submission.html；测试示范监管模块PRD 1.2");
actionSet(monitor, "准入申请", "报告提交管理", "monitor/access-apply/report-submission.html", [
  ["工具栏", "提交报告", no, yes, no, no, no, no, no, "仅企业提交本企业周期报告", "report-submission.html；测试示范监管模块PRD 1.2", "已配置"],
  ["弹窗", "保存草稿", no, conditional, no, no, no, no, no, "草稿状态可编辑", "report-submission.html", "已配置"],
  ["弹窗", "确认提交", no, conditional, no, no, no, no, no, "必填材料校验通过后提交", "report-submission.html", "已配置"],
  ["操作列", "下载附件", yes, yes, no, no, no, no, no, "企业仅本企业材料", "report-submission.html", "已配置"],
]);

// 审批与配置
commonSearch(monitor, "准入审批管理", "审批管理", "monitor/access-approve/approve.html", [yes, no, yes, yes, no, no, no], "按审批节点与当前待办对象过滤", "测试示范监管模块PRD 4.8；common.js", "第三方/专班入口待补齐");
actionSet(monitor, "准入审批管理", "审批管理", "monitor/access-approve/approve.html", [
  ["操作列", "查看申请详情/材料", yes, no, yes, yes, no, no, no, "审批范围内的全量申请材料", "测试示范监管模块PRD 4.8", "第三方/专班入口待补齐"],
  ["审批面板", "第三方初审通过/退回", no, no, yes, no, no, no, no, "仅待第三方初审节点", "测试示范监管模块PRD 4.8", "第三方入口待补齐"],
  ["审批面板", "专班审核通过/退回", no, no, no, yes, no, no, no, "仅待专班审核节点", "测试示范监管模块PRD 4.8", "专班入口待补齐"],
  ["审批面板", "专题会审议确认", no, no, no, conditional, no, no, no, "仅专题会审议成员且处于对应节点", "测试示范监管模块PRD 4.8", "专班入口待补齐"],
]);
commonSearch(monitor, "准入审批管理", "资格终止管理", "monitor/access-approve/terminate.html", [yes, no, no, yes, no, no, no], "按职责范围查看终止记录", "测试示范监管模块PRD 4.8；terminate.html", "专班入口待补齐");
actionSet(monitor, "准入审批管理", "资格终止管理", "monitor/access-approve/terminate.html", [
  ["工具栏", "发起资格终止", no, no, no, yes, no, no, no, "仅市工作专班发起", "测试示范监管模块PRD 4.8", "专班入口待补齐"],
  ["弹窗", "确认终止", no, no, no, conditional, no, no, no, "材料完整、确认对象后提交", "terminate.html；测试示范监管模块PRD 4.8", "专班入口待补齐"],
  ["操作列", "查看详情/附件预览下载", yes, no, no, yes, no, no, no, "仅职责范围内记录", "terminate.html；测试示范监管模块PRD 4.8", "专班入口待补齐"],
]);
commonSearch(monitor, "准入审批管理", "报告管理（政府端）", "monitor/access-approve/report.html", [yes, no, no, no, no, no, no], "主管部门查看全量报告", "测试示范监管模块PRD 4.8；common.js");
actionSet(monitor, "准入审批管理", "报告管理（政府端）", "monitor/access-approve/report.html", [
  ["工具栏", "向上级报送", yes, no, no, no, no, no, no, "仅主管部门，无需审批", "测试示范监管模块PRD 4.8", "已配置"],
  ["操作列", "材料归档", yes, no, no, no, no, no, no, "仅主管部门", "测试示范监管模块PRD 4.8", "已配置"],
  ["操作列", "查看/下载", yes, no, no, no, no, no, no, "查看全量报告和附件", "report.html；测试示范监管模块PRD 4.8", "已配置"],
]);
for (const [page, route, actions] of [
  ["测试示范审批配置", "monitor/approve-config/approval-config.html", "新增主体/对象/类型、编辑、启用/停用、删除、保存"],
  ["材料目录配置", "monitor/approve-config/config.html", "新增材料、编辑、启用/停用、删除、保存、发布版本、版本对比、复制新版本"],
  ["异常事件规则配置", "monitor/approve-config/abnormal-rule-config.html", "新增规则、编辑、启用/停用、删除、保存"],
]) {
  commonSearch(monitor, "自定义配置", page, route, [yes, no, no, no, no, no, no], "仅监管人员维护平台审批与规则配置", "测试示范监管模块PRD F12；common.js");
  for (const action of actions.split("、")) add(monitor, "自定义配置", page, route, "工具栏/操作列/弹窗", action, yes, no, no, no, no, no, no, "配置修改应记录变更日志；发布类操作需校验版本", `${route}；测试示范监管模块PRD F12`, "已配置");
}

// 车辆监控、事故与服务
for (const [page, route] of [["监控一张图", "monitor/vehicle-monitor/monitor-map.html"], ["车辆运行监控", "monitor/vehicle-monitor/running.html"], ["异常状态事件", "monitor/vehicle-monitor/alarm.html"], ["交通违法信息", "monitor/vehicle-monitor/violation.html"]]) {
  commonSearch(monitor, "车辆状态监控", page, route, [yes, yes, no, no, no, no, no], "监管查看全量；企业仅本企业车辆、事件和轨迹", "测试示范监管模块PRD F13-F15；common.js");
  add(monitor, "车辆状态监控", page, route, "操作列/地图", "查看详情/轨迹", yes, yes, no, no, no, no, no, "企业仅查看本企业对象", `${route}；测试示范监管模块PRD F13-F15`, "已配置");
  add(monitor, "车辆状态监控", page, route, "工具栏", "导出", yes, conditional, no, no, no, no, no, "企业导出范围限制为本企业；违法信息页面原型仅 admin 显示", `${route}；监测数据分析模块PRD 4.4`, page === "交通违法信息" ? "企业导出入口待确认" : "按数据范围控制");
}
commonSearch(monitor, "车辆状态监控", "事故数据上报", "monitor/vehicle-monitor/accident.html", [yes, yes, no, no, no, no, no], "监管查看全量；企业仅本企业事故", "测试示范监管模块PRD F16；common.js");
actionSet(monitor, "车辆状态监控", "事故数据上报", "monitor/vehicle-monitor/accident.html", [
  ["工具栏", "新增事故上报", no, yes, no, no, no, no, no, "仅企业发起本企业事故上报", "测试示范监管模块PRD F16", "已配置"],
  ["表单", "提交事故信息", no, conditional, no, no, no, no, no, "必填事故信息和佐证材料校验通过", "accident.html；测试示范监管模块PRD F16", "已配置"],
  ["操作列", "提交交通事故报告", no, conditional, no, no, no, no, no, "仅进入报告待提交状态且属于本企业", "测试示范监管模块PRD F16", "已配置"],
  ["操作列", "提交事故分析报告", no, conditional, no, no, no, no, no, "仅进入分析报告待提交状态且属于本企业", "测试示范监管模块PRD F16", "已配置"],
  ["操作列", "查看详情/流程", yes, yes, no, no, no, no, no, "企业仅本企业事故", "accident.html；测试示范监管模块PRD F16", "已配置"],
]);
commonSearch(monitor, "车辆状态监控", "事故审核", "monitor/vehicle-monitor/accident-review.html", [yes, no, yes, yes, no, no, no], "按事故流程节点和审核职责过滤", "测试示范监管模块PRD 4.8；common.js");
actionSet(monitor, "车辆状态监控", "事故审核", "monitor/vehicle-monitor/accident-review.html", [
  ["操作列", "查看事故详情/材料", yes, no, yes, yes, no, no, no, "仅职责范围内事故", "测试示范监管模块PRD 4.8", "已配置"],
  ["审核面板", "交通事故报告审核", no, no, yes, no, no, no, no, "仅第三方专业管理机构", "测试示范监管模块PRD 4.8", "已配置"],
  ["审核面板", "事故分析初审", no, no, yes, no, no, no, no, "仅第三方专业管理机构", "测试示范监管模块PRD 4.8", "已配置"],
  ["审核面板", "事故分析终审", no, no, no, yes, no, no, no, "仅市工作专班", "测试示范监管模块PRD 4.8", "已配置"],
]);
for (const [page, route, actions] of [
  ["信息发布管理", "monitor/service/notice.html", "查询、重置、新建信息发布申请、保存草稿、提交审核、查看、编辑、删除、审核、撤回、下架"],
  ["在线反馈管理", "monitor/service/feedback-manage.html", "查询、重置、导出、查看详情、受理回复、继续回复、关闭"],
  ["电子围栏管理", "monitor/service/fence.html", "查询、重置、新建电子围栏、属性编辑、图形绘制、图形编辑、删除"],
  ["测试评价管理", "monitor/service/evaluation.html", "查询、重置、导出、查看详情、发起评价"],
]) {
  for (const action of actions.split("、")) add(monitor, "测试服务管理", page, route, "查询区/工具栏/操作列", action, action === "受理回复" || action === "继续回复" || action === "关闭" ? conditional : yes, no, no, no, no, no, no, action === "受理回复" ? "仅待处理反馈" : action === "继续回复" ? "仅处理中反馈" : action === "关闭" ? "仅待处理或处理中反馈" : "仅监管人员管理全量服务数据", `${route}；测试示范监管模块PRD F11、F18-F19`, "已配置");
}
commonSearch(monitor, "信息公开与在线反馈", "信息公开", "monitor/public/info.html", [yes, yes, no, no, no, no, yes], "公开信息范围", "不同人员页面.md；common.js");
add(monitor, "信息公开与在线反馈", "信息公开", "monitor/public/info.html", "列表/详情", "查看公开信息详情", yes, yes, no, no, no, no, yes, "公开发布的信息", "info.html；不同人员页面.md", "已配置");
commonSearch(monitor, "信息公开与在线反馈", "在线反馈", "monitor/public/feedback.html", [no, yes, no, no, no, no, yes], "企业仅本企业反馈；公众仅本人反馈", "测试示范监管模块PRD 3.11.1；common.js");
actionSet(monitor, "信息公开与在线反馈", "在线反馈", "monitor/public/feedback.html", [
  ["工具栏", "新建反馈", no, yes, no, no, no, no, yes, "企业/公众提交本人或本企业反馈", "测试示范监管模块PRD 3.11.1", "已配置"],
  ["表单", "提交反馈", no, conditional, no, no, no, no, conditional, "表单校验通过后提交", "feedback.html；测试示范监管模块PRD 3.11.1", "已配置"],
  ["操作列", "查看反馈详情", no, yes, no, no, no, no, yes, "企业仅本企业；公众仅本人", "测试示范监管模块PRD 3.11.1", "已配置"],
]);

// 监测数据分析：19 个页面以统一的查询、导出、下钻动作控制数据边界
const analysisPages = [
  ["测试数据分析", "测试数据总览", "data-analysis/analysis/overview.html"], ["测试数据分析", "异常告警统计", "data-analysis/analysis/alarm-stats.html"], ["测试数据分析", "违法事故统计", "data-analysis/analysis/violation-stats.html"], ["测试数据分析", "运行状态分析", "data-analysis/analysis/running-analysis.html"], ["测试数据分析", "预警事件分析", "data-analysis/analysis/warning-analysis.html"], ["测试数据分析", "测试里程分析", "data-analysis/analysis/mileage-analysis.html"], ["测试数据分析", "产业发展分析", "data-analysis/analysis/industry-analysis.html"],
  ["数据查询检索", "企业数据查询", "data-analysis/query/company-query.html"], ["数据查询检索", "安全员数据查询", "data-analysis/query/safety-driver-query.html"], ["数据查询检索", "车辆数据查询", "data-analysis/query/vehicle-query.html"], ["数据查询检索", "设备数据查询", "data-analysis/query/device-query.html"], ["数据查询检索", "车辆故障查询", "data-analysis/query/fault-query.html"],
  ["事故数据分析", "事故数据解析", "data-analysis/accident/accident-parse.html"], ["事故数据分析", "事故成因分析", "data-analysis/accident/accident-cause.html"], ["事故数据分析", "事故特征分析", "data-analysis/accident/accident-feature.html"], ["事故数据分析", "事故分析研判", "data-analysis/accident/accident-judge.html"],
  ["测试示范分析", "道路测试分析", "data-analysis/demo/road-test-analysis.html"], ["测试示范分析", "示范应用分析", "data-analysis/demo/demo-apply-analysis.html"], ["测试示范分析", "商业化试点分析", "data-analysis/demo/demo-operate-analysis.html"],
];
for (const [group, page, route] of analysisPages) {
  commonSearch("监测数据分析", group, page, route, [yes, yes, no, no, yes, no, no], "政府/系统管理员全局数据；企业仅本企业数据", "监测数据分析模块PRD 1.2、4.4、4.5；common.js", "企业/系统管理员入口待补齐");
  add("监测数据分析", group, page, route, "工具栏", "导出", yes, yes, no, no, yes, no, no, "按当前筛选条件导出；企业仅本企业数据；上限 10 万条", "监测数据分析模块PRD 4.4、4.5", "企业/系统管理员入口待补齐");
  add("监测数据分析", group, page, route, "图表/操作列", "查看详情/数据下钻", yes, yes, no, no, yes, no, no, "企业不得下钻至其他企业明细", "监测数据分析模块PRD 1.2、4.5", "企业/系统管理员入口待补齐");
}

// 平台管理
commonSearch("平台管理", "数据字典管理", "字典项管理", "platform/dict/index.html", [no, no, no, no, yes, no, no], "系统管理员管理全平台元数据", "平台管理模块PRD 3.1、4.7；common.js", "系统管理员入口待补齐");
for (const action of ["导出", "新增字典项", "查看详情", "编辑", "停用", "启用"]) add("平台管理", "数据字典管理", "字典项管理", "platform/dict/index.html", "工具栏/操作列", action, no, no, no, no, yes, no, no, action === "停用" ? "仅当前状态为已启用" : action === "启用" ? "仅当前状态为已停用" : "系统管理员操作", "平台管理模块PRD 3.1、4.7", "系统管理员入口待补齐");
commonSearch("平台管理", "操作日志管理", "日志查询", "platform/log/index.html", [no, no, no, no, yes, yes, no], "全平台操作日志；安全审计员只读", "平台管理模块PRD 3.2、4.7；common.js", "系统管理员/审计员入口待补齐");
actionSet("平台管理", "操作日志管理", "日志查询", "platform/log/index.html", [
  ["操作列", "查看详情", no, no, no, no, yes, yes, no, "系统管理员与安全审计员只读查看详情", "平台管理模块PRD 3.2、4.7", "系统管理员/审计员入口待补齐"],
  ["操作列", "删除", no, no, no, no, yes, no, no, "物理删除，二次确认，不可恢复", "平台管理模块PRD 3.2、4.7", "系统管理员入口待补齐"],
  ["工具栏", "清空日志", no, no, no, no, yes, no, no, "需选择范围并输入管理员密码二次确认", "平台管理模块PRD 3.2、4.7", "系统管理员入口待补齐"],
]);

const workbook = Workbook.create();
const matrix = workbook.worksheets.add("按钮权限矩阵");
const legend = workbook.worksheets.add("权限标识与判定规则");
const summary = workbook.worksheets.add("覆盖与待补齐");
const colors = { navy: "#17365D", blue: "#1F4E78", pale: "#D9EAF7", gray: "#F3F6F9", line: "#D9E2F3", green: "#E2F0D9", amber: "#FFF2CC", red: "#FCE4D6", white: "#FFFFFF" };
function title(sheet, range, text) { sheet.getRange(range).merge(); sheet.getRange(range.split(":")[0]).values = [[text]]; sheet.getRange(range).format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 16 }, verticalAlignment: "center" }; sheet.getRange(range).format.rowHeight = 28; }
function header(sheet, range) { sheet.getRange(range).format = { fill: colors.blue, font: { bold: true, color: colors.white }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: colors.line } }; sheet.getRange(range).format.rowHeight = 38; }
function grid(sheet, range) { sheet.getRange(range).format = { verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: colors.line } }; }

matrix.showGridLines = false;
title(matrix, "A1:P1", "智能网联汽车安全监测平台 - 按钮级权限矩阵");
matrix.getRange("A2:P4").merge();
matrix.getRange("A2").values = [["使用方式：每行对应一个页面内的可执行操作。角色列表示目标权限口径，数据范围与条件列规定按钮显示和接口执行的限制。对于原型页面与 PRD 角色配置不一致的条目，已在“实现状态”中明确标记。"]];
matrix.getRange("A2:P4").format = { fill: "#F7FBFF", font: { color: colors.navy }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: colors.line } };
matrix.getRange("A6:P6").values = [["一级模块", "二级分组", "页面名称", "页面路径", "操作区域", "按钮 / 操作", "政府监管人员", "企业用户", "第三方专业管理机构", "市工作专班", "系统管理员", "安全审计员", "公众访客", "数据范围 / 按钮显示条件", "主要依据", "实现状态"]];
header(matrix, "A6:P6");
matrix.getRange(`A7:P${rows.length + 6}`).values = rows;
grid(matrix, `A7:P${rows.length + 6}`);
matrix.getRange(`A7:F${rows.length + 6}`).format.fill = "#FAFCFE";
matrix.getRange(`G7:M${rows.length + 6}`).format.horizontalAlignment = "center";
matrix.getRange(`N7:P${rows.length + 6}`).format.fill = "#FAFCFE";
matrix.getRange(`G7:M${rows.length + 6}`).conditionalFormats.add("containsText", { text: yes, format: { fill: colors.green, font: { color: "#375623" } } });
matrix.getRange(`G7:M${rows.length + 6}`).conditionalFormats.add("containsText", { text: conditional, format: { fill: colors.amber, font: { color: "#7F6000" } } });
matrix.getRange(`G7:M${rows.length + 6}`).conditionalFormats.add("containsText", { text: no, format: { fill: colors.gray, font: { color: "#7F7F7F" } } });
matrix.getRange(`P7:P${rows.length + 6}`).conditionalFormats.add("containsText", { text: "待补齐", format: { fill: colors.amber, font: { color: "#7F6000" } } });
matrix.getRange(`P7:P${rows.length + 6}`).conditionalFormats.add("containsText", { text: "已配置", format: { fill: colors.green, font: { color: "#375623" } } });
matrix.getRange(`P7:P${rows.length + 6}`).conditionalFormats.add("containsText", { text: "待确认", format: { fill: colors.red, font: { color: "#9C0006" } } });
for (const [col, width] of [["A:A", 16], ["B:B", 18], ["C:C", 20], ["D:D", 39], ["E:E", 18], ["F:F", 23], ["G:M", 16], ["N:N", 44], ["O:O", 42], ["P:P", 25]]) matrix.getRange(col).format.columnWidth = width;
matrix.getRange(`A7:P${rows.length + 6}`).format.rowHeight = 34;
matrix.freezePanes.freezeRows(6);
matrix.freezePanes.freezeColumns(6);
matrix.tables.add(`A6:P${rows.length + 6}`, true, "ButtonPermissionMatrix");

legend.showGridLines = false;
title(legend, "A1:E1", "权限标识与判定规则");
legend.getRange("A3:E3").values = [["项目", "说明", "前端要求", "后端要求", "依据"]];
header(legend, "A3:E3");
const rules = [
  ["允许", "该角色可见并可触发该按钮/操作。", "展示操作入口。", "接口校验角色授权。", "页面及按钮权限基本原则"],
  ["条件允许", "需同时满足行内状态、审批节点、记录归属或材料校验条件。", "不满足时隐藏或禁用，并说明原因。", "再次校验记录状态、节点、归属和材料完整性。", "PRD 中的状态机、审批节点和数据权限规则"],
  ["无权限", "该角色不应看到也不能访问按钮、页面或接口。", "隐藏菜单、页面入口和按钮。", "拒绝接口调用，返回无权限结果并记录审计日志。", "开放道路管理模块PRD 4.7；各模块权限规则"],
  ["企业数据边界", "企业只能操作或查询所属企业的数据。", "前端不得提供跨企业筛选或跳转入口。", "服务端按登录主体强制追加企业条件，禁止仅信任前端参数。", "测试示范监管模块PRD 数据权限；监测数据分析模块PRD 4.5"],
  ["审批节点边界", "第三方初审、专班审核、专题会审议、报告报送必须按节点授权。", "只展示当前待办且当前角色可执行的操作。", "事务内校验状态机、待办归属和幂等性。", "测试示范监管模块PRD 4.8"],
  ["高风险操作", "删除、停用、关闭、资格终止、清空日志等不可逆或影响范围广的操作。", "二次确认，标明影响范围。", "执行前校验权限、状态与必要凭证；全量记录审计日志。", "开放道路管理模块PRD；平台管理模块PRD 3.2、4.7"],
];
legend.getRange(`A4:E${rules.length + 3}`).values = rules;
grid(legend, `A4:E${rules.length + 3}`);
legend.getRange("A4:A6").format = { fill: colors.gray, font: { bold: true, color: colors.navy }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.line } };
for (const [col, width] of [["A:A", 18], ["B:B", 34], ["C:C", 35], ["D:D", 42], ["E:E", 42]]) legend.getRange(col).format.columnWidth = width;
legend.getRange(`A4:E${rules.length + 3}`).format.rowHeight = 46;
legend.freezePanes.freezeRows(3);

summary.showGridLines = false;
title(summary, "A1:F1", "覆盖范围与原型补齐项");
summary.getRange("A3:F3").values = [["范围", "按钮级覆盖", "目标权限口径", "当前原型差异", "建议处理", "优先级"]];
header(summary, "A3:F3");
const gaps = [
  ["开放道路资源管理", "道路建档、动态管控、地图、评估、统计的查询及操作按钮", "企业/第三方按 PRD 获得查看、导出或编辑权限", "当前 common.js 仅 admin 可进入全部道路页面", "补齐 enterprise / third-party 菜单、页面与接口授权；保持操作按钮按角色过滤", "高"],
  ["审批管理", "第三方初审、专班审核、终止、事故审核按钮", "第三方仅初审；专班仅审核、终止、终审", "approve、terminate 原型入口仅 admin", "按节点为 third-party / workgroup 配置页面入口、待办和接口权限", "高"],
  ["监测数据分析", "查询、导出、详情/下钻按钮", "企业仅本企业；系统管理员全局和审计", "原型 19 个页面仅 admin", "补齐企业/系统管理员访问，并在导出和下钻接口强制数据边界", "高"],
  ["平台管理", "字典新增、编辑、启停、日志删除、清空按钮", "系统管理员操作；审计员仅查阅日志", "原型仅 admin，未定义 system-admin / auditor", "新增独立角色编码，删除/清空需密码和审计", "高"],
  ["公共反馈", "反馈提交、查看、管理侧受理/回复/关闭按钮", "公众和企业仅本人的提交/查看；监管管理侧处理", "原型角色和页面基本一致", "保持本人/本企业数据范围和状态条件校验", "低"],
];
summary.getRange(`A4:F${gaps.length + 3}`).values = gaps;
grid(summary, `A4:F${gaps.length + 3}`);
summary.getRange(`F4:F${gaps.length + 3}`).format.horizontalAlignment = "center";
summary.getRange(`F4:F${gaps.length + 3}`).conditionalFormats.add("containsText", { text: "高", format: { fill: colors.red, font: { bold: true, color: "#9C0006" } } });
summary.getRange(`F4:F${gaps.length + 3}`).conditionalFormats.add("containsText", { text: "低", format: { fill: colors.green, font: { bold: true, color: "#375623" } } });
for (const [col, width] of [["A:A", 20], ["B:B", 32], ["C:C", 35], ["D:D", 36], ["E:E", 43], ["F:F", 12]]) summary.getRange(col).format.columnWidth = width;
summary.getRange(`A4:F${gaps.length + 3}`).format.rowHeight = 56;
summary.freezePanes.freezeRows(3);

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputFile);
console.log(JSON.stringify({ outputFile, buttonRows: rows.length }));
