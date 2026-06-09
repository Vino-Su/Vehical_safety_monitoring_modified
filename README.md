# 智能网联汽车安全监测平台 — 前端高保真原型

## 项目简介

本项目是**智能网联汽车安全监测平台**的前端高保真原型，面向襄阳市智能网联汽车道路测试与示范应用的监管场景，用于产品评审、需求落地与开发参考。

原型覆盖**事前准入、事中监控、事后评价**全流程，包含 4 大业务模块、50 个功能页面，所有页面严格复刻 Ant Design 企业级后台视觉规范。当前为纯前端静态原型，无后端接口，数据均为模拟数据。

## 快速开始

### 环境要求

- 现代浏览器（Chrome / Edge / Firefox 最新版）
- 无需 Node.js、无需构建工具、无需安装任何依赖

### 运行方式

**方式一：直接打开**

双击项目根目录下的 `index.html`，浏览器会自动跳转到首页工作台。

**方式二：本地 HTTP 服务（推荐）**

部分功能（如 Leaflet 地图、ECharts 图表）通过 CDN 加载资源，使用 HTTP 服务可避免跨域问题：

```bash
# Python 3
python -m http.server 8080

# Node.js（需先安装 serve）
npx serve .

# PowerShell
php -S localhost:8080
```

然后访问 `http://localhost:8080`。

**方式三：VS Code Live Server**

在 VS Code 中安装 Live Server 扩展，右键 `index.html` → Open with Live Server。

**方式四：GitHub Pages**

本项目已适配 GitHub Pages 部署，推送至 GitHub 仓库后启用 Pages 即可通过公开链接访问。

## 技术架构

### 技术栈

| 层面 | 技术 | 说明 |
|------|------|------|
| 标记语言 | HTML5 | 语义化结构，每个功能页面独立 HTML 文件 |
| 样式框架 | Tailwind CSS v3（CDN） | 原子化 CSS，配合自定义 Ant Design 色值 |
| 交互逻辑 | 原生 JavaScript（ES5） | 无框架依赖，所有逻辑直接写在页面 `<script>` 中 |
| 图表库 | ECharts 5.4.3（CDN） | 统计分析、趋势折线、饼图、柱状图等 |
| 地图库 | Leaflet 1.9.4（CDN） | 道路可视化、监控一张图等地图页面 |
| 图标库 | Font Awesome 6（CDN） | 部分页面引入 |

### 整体架构

```
index.html                          ← 入口，自动跳转
03-高保真页面/
├── layout.html                     ← 首页工作台（统计卡片 + 图表 + 待办 + 导航）
├── common.js                       ← 全局公共模块（侧边栏 / 顶栏 / 样式 / 弹窗 / 下拉框）
├── components/
│   └── pagination-component.js     ← 可复用分页组件
├── road/                           ← 开放道路资源管理（7 页）
├── monitor/                        ← 测试示范监管（20 页）
├── data-analysis/                  ← 监测数据分析（21 页）
└── platform/                       ← 平台管理（2 页）
```

### 页面骨架

每个功能页面遵循统一结构：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- 按需引入 ECharts / Leaflet / Font Awesome -->
  <script>tailwind.config = { theme: { extend: { colors: { primary: { DEFAULT: '#1677ff' } } } } }</script>
</head>
<body>
<div id="app" class="flex h-screen overflow-hidden">
  <aside id="sidebar"></aside>            ← common.js 自动渲染侧边导航
  <div class="flex-1 flex flex-col overflow-hidden">
    <header id="topnav"></header>         ← common.js 自动渲染顶栏 + 面包屑
    <main class="flex-1 overflow-auto bg-[#f0f2f5] p-6">
      <!-- 页面主体内容 -->
    </main>
  </div>
</div>
<script>
var PAGE_ID = 'xxx';   // 当前页面标识，common.js 据此高亮菜单、生成面包屑
// 页面专属逻辑...
</script>
<script src="./common.js"></script>       ← 必须在页面脚本之后引入
</body>
</html>
```

### 核心公共模块：common.js

`common.js` 是整个平台的骨架，在 `DOMContentLoaded` 时自动执行以下工作：

| 职责 | 说明 |
|------|------|
| **侧边导航栏** | 根据 `MENU_DATA` 配置渲染三级树形菜单，224px 宽，深色背景（#001529），支持展开/收起、高亮当前页 |
| **顶部导航栏** | 64px 高，包含面包屑导航、通知图标、用户信息 |
| **全局 CSS 注入** | 注入 Ant Design 风格的按钮、表格、标签、弹窗、分页、表单、筛选栏等组件样式 |
| **弹窗系统** | 提供 `openModal(title, bodyHTML, options)` / `closeModal()` 全局方法，支持嵌套弹窗栈、自定义宽度、点击遮罩关闭 |
| **下拉框自动转换** | 扫描页面中 `.ant-select` 占位元素，根据 `SELECT_OPTIONS_MAP` 映射表自动替换为真实 `<select>` 元素并填充选项 |
| **面包屑生成** | 根据 `PAGE_ID` 在 `MENU_DATA` 中查找路径，自动生成多级面包屑 |

**关键全局变量**：

- `PAGE_ID`：每个页面必须定义，用于菜单高亮和面包屑生成
- `MENU_DATA`：侧边栏菜单配置（三级树形结构，含 key / label / path / icon）
- `SELECT_OPTIONS_MAP`：下拉框选项映射表（键名为筛选标签文本，值为选项数组）
- `openModal()` / `closeModal()`：弹窗方法

### 分页组件：pagination-component.js

提供可复用的 `Pagination` 类，使用方式：

```javascript
var pager = new Pagination({
  container: 'paginationBar',     // 容器元素 ID
  pageSize: 10,                   // 每页条数（默认 10）
  pageSizeOptions: [10, 20, 50],  // 可切换选项
  onPageChange: function(page, size) {
    renderMyList(page, size);     // 页码变化回调
  }
});
pager.setTotal(100);              // 设置总条数，自动刷新分页栏
pager.reset();                    // 重置到第一页
```

## 业务模块说明

### 模块总览

| 模块 | 菜单 Key | 目录 | 页面数 | PRD 文档 |
|------|----------|------|--------|----------|
| 开放道路资源管理 | `road` | `03-高保真页面/road/` | 7 | `02-产品文档/开放道路管理模块PRD.md` |
| 测试示范监管 | `monitor` | `03-高保真页面/monitor/` | 20 | `02-产品文档/测试示范监管模块PRD.md` |
| 监测数据分析 | `analysis` | `03-高保真页面/data-analysis/` | 21 | `02-产品文档/监测数据分析模块PRD.md` |
| 平台管理 | `platform` | `03-高保真页面/platform/` | 2 | `02-产品文档/平台管理模块PRD.md` |

### 开放道路资源管理（7 页）

| 子模块 | 页面 | PAGE_ID |
|--------|------|---------|
| 城市道路开放目录 | 道路信息建档 | `filing` |
| | 道路资源动态管控 | `control` |
| 道路资源可视化 | 地图可视化展示 | `road-map` |
| 开放道路评估管理 | 评估结果管理 | `eval-result` |
| | 评估指标配置 | `eval-config` |
| | 评估日志管理 | `eval-log` |
| 区域统计查询 | 区域统计查询 | `stats` |

### 测试示范监管（20 页）

| 子模块 | 页面 | PAGE_ID |
|--------|------|---------|
| 准入信息管理 | 企业信息登记 | `company` |
| | 车辆信息登记 | `vehicle` |
| | 人员信息登记 | `person` |
| 准入申请 | 道路测试准入申请 | `road-test` |
| | 示范应用准入申请 | `demo-apply` |
| | 商业化试点准入申请 | `demo-operate` |
| | 业务申请管理 | `business` |
| 准入审批管理 | 审批管理 | `approve` |
| | 资格终止管理 | `terminate` |
| | 报告管理 | `report` |
| 审批配置 | 审批配置 | `approve-config` |
| 车辆状态监控 | 监控一张图 | `monitor-map` |
| | 车辆运行监控 | `running` |
| | 异常状态告警 | `alarm` |
| | 事故数据上报 | `accident` |
| | 事故审核 | `accident-review` |
| 测试服务管理 | 信息发布管理 | `notice` |
| | 电子围栏管理 | `fence` |
| | 测试评价管理 | `evaluation` |
| 信息公开与在线反馈 | 信息公开 | `info` |
| | 在线反馈 | `feedback` |

### 监测数据分析（21 页）

| 子模块 | 页面 | PAGE_ID |
|--------|------|---------|
| 测试数据分析 | 测试数据总览 | `overview` |
| | 异常告警统计 | `alarm-stats` |
| | 违法事故统计 | `violation-stats` |
| | 运行状态分析 | `running-analysis` |
| | 预警事件分析 | `warning-analysis` |
| | 测试里程分析 | `mileage-analysis` |
| | 产业发展分析 | `industry-analysis` |
| 数据查询检索 | 企业数据查询 | `company-query` |
| | 安全员数据查询 | `safety-driver-query` |
| | 车辆数据查询 | `vehicle-query` |
| | 设备数据查询 | `device-query` |
| | 车辆故障查询 | `fault-query` |
| 事故数据分析 | 事故数据解析 | `accident-parse` |
| | 事故成因分析 | `accident-cause` |
| | 事故特征分析 | `accident-feature` |
| | 事故分析研判 | `accident-judge` |
| 测试示范分析 | 道路测试分析 | `road-test-analysis` |
| | 示范应用分析 | `demo-apply-analysis` |
| | 商业化试点分析 | `demo-operate-analysis` |

### 平台管理（2 页）

| 子模块 | 页面 | PAGE_ID |
|--------|------|---------|
| 数据字典管理 | 字典项管理 | `dict-manage` |
| 操作日志管理 | 日志查询 | `log-manage` |

## 角色与页面权限

| 角色 | 可访问页面范围 |
|------|----------------|
| 监管主体 | 全部页面 |
| 企业用户 | 准入信息管理、准入申请、车辆状态监控（不含事故审核）、信息公开与在线反馈 |
| 公众用户 | 信息公开与在线反馈 |

> 详见 `02-产品文档/不同人员页面.md`

## 如何修改

### 新增页面

1. 在 `03-高保真页面/` 下对应模块目录中创建新 HTML 文件
2. 复制任意现有页面作为模板，修改 `<title>` 和页面主体内容
3. 在页面 `<script>` 中定义 `var PAGE_ID = 'xxx'`
4. 在 `common.js` 的 `MENU_DATA` 中添加菜单项（含 key / label / path）
5. 如有新的筛选下拉选项，在 `common.js` 的 `SELECT_OPTIONS_MAP` 中添加映射
6. 如需分页，引入 `pagination-component.js` 并初始化 `Pagination` 实例

### 修改现有页面

1. 直接编辑对应 HTML 文件中的页面主体区域（`<main>` 标签内）
2. 侧边栏、顶栏、面包屑由 `common.js` 自动渲染，无需手动修改
3. 弹窗内容通过 `openModal(title, bodyHTML)` 调用，修改对应函数中的 `bodyHTML` 即可

### 修改导航菜单

编辑 `common.js` 中的 `MENU_DATA` 数组，结构为三级树形：

```javascript
{
  key: 'unique-key',        // 唯一标识，与 PAGE_ID 对应
  label: '菜单显示名称',
  icon: '<svg>...</svg>',   // 仅一级菜单需要
  children: [               // 子菜单
    {
      key: 'sub-key',
      label: '二级菜单',
      children: [
        { key: 'leaf-key', label: '三级菜单', path: '模块/子目录/页面.html' }
      ]
    }
  ]
}
```

### 修改全局样式

- **组件级样式**（按钮、表格、标签等）：编辑 `common.js` 中 `injectStyles()` 函数内的 `cssText` 数组
- **设计规范**（颜色、字体、间距）：参照 `.claude/UI_design.md` 中的规范定义
- **页面局部样式**：在页面 `<style>` 标签中编写，注意避免与全局样式冲突

### 修改下拉框选项

编辑 `common.js` 中的 `SELECT_OPTIONS_MAP` 对象，键名为筛选标签文本（如 `'所属区域'`），值为选项数组：

```javascript
'所属区域': ['全部', '樊城区', '襄城区', '襄州区', ...],
```

### 使用分页组件

```html
<!-- HTML 中放置容器 -->
<div id="paginationBar"></div>

<!-- 引入组件脚本 -->
<script src="../../components/pagination-component.js"></script>

<!-- 初始化 -->
<script>
var pager = new Pagination({
  container: 'paginationBar',
  pageSize: 10,
  onPageChange: function(page, size) {
    // 根据 page 和 size 过滤/切片数据，重新渲染表格
  }
});
pager.setTotal(data.length);
</script>
```

### 使用弹窗

```javascript
// 基本弹窗
openModal('标题', '<p>内容HTML</p>');

// 宽弹窗（800px）
openModal('标题', '<p>内容</p>', { wide: true });

// 自定义宽度
openModal('标题', '<p>内容</p>', { width: 720 });

// 自定义底部按钮
openModal('标题', '<p>内容</p>', {
  footer: '<button class="ant-btn" onclick="closeModal()">取消</button>' +
          '<button class="ant-btn ant-btn-primary" onclick="doSomething()">确认</button>'
});

// 弹窗打开后回调（用于初始化弹窗内组件）
openModal('标题', '<div id="chartInModal"></div>', {
  wide: true,
  onOpen: function() {
    // 初始化 ECharts 图表等
  }
});
```

## UI 设计规范

所有页面严格遵循 `.claude/UI_design.md` 中定义的 Ant Design 企业级后台规范，核心要点：

| 项目 | 规范 |
|------|------|
| 主色 | `#1677ff`（标准蓝），hover `#4096ff`，禁用 `#85a5cc` |
| 中性色 | 文字 `#000000d9` / `#00000073` / `#00000040`，背景 `#f0f2f5`，分割线 `#f0f0f0` |
| 字体 | `"Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| 字号 | 页面标题 20px，模块标题 16px，正文 14px，辅助 12px |
| 侧边栏 | 224px 宽，深色背景 #001529 |
| 顶栏 | 64px 高，白底，含面包屑 + 通知 + 用户信息 |
| 表格 | 表头行高 48px，数据行高 48px，单元格内边距 16px |
| 弹窗 | 表单弹窗 600px，详情弹窗 800px，最大 90vw |
| 输入框 | 高 32px，圆角 6px，内边距 0 12px |
| 按钮 | 常规 32px 高，小按钮 24px 高，圆角 6px |

## 项目目录结构

```
智能网联汽车安全监测平台/
├── index.html                          ← 入口文件，跳转至 03-高保真页面/layout.html
├── README.md                           ← 本文件
├── .gitignore
├── .gitattributes
│
├── .claude/                            ← Claude Code 工作区配置
│   ├── CLAUDE.md                       ← 项目工作规范
│   ├── UI_design.md                    ← UI 设计规范
│   ├── commands/opsx/                  ← 自定义命令
│   └── skills/                         ← 自定义技能
│
├── 01-需求文档/                         ← 需求文档（开发的核心依据）
│   ├── 开放道路管理模块.md
│   ├── 测试示范监管模块.md
│   ├── 监测数据分析模块.md
│   └── 平台管理模块.md
│
├── 02-产品文档/                         ← PRD 产品需求文档
│   ├── 开放道路管理模块PRD.md           ← V1.1
│   ├── 测试示范监管模块PRD.md           ← V1.7
│   ├── 监测数据分析模块PRD.md           ← V1.1
│   ├── 平台管理模块PRD.md              ← V1.1（已确认）
│   └── 不同人员页面.md                 ← 角色页面权限说明
│
├── 03-高保真页面/                       ← 前端原型源码（核心目录）
│   ├── layout.html                     ← 首页工作台
│   ├── common.js                       ← 全局公共模块
│   ├── components/
│   │   └── pagination-component.js     ← 分页组件
│   ├── road/                           ← 开放道路资源管理
│   │   ├── catalog/                    ← 城市道路开放目录
│   │   ├── visualization/              ← 道路资源可视化
│   │   ├── evaluation/                 ← 开放道路评估管理
│   │   └── statistics/                 ← 区域统计查询
│   ├── monitor/                        ← 测试示范监管
│   │   ├── access-info/                ← 准入信息管理
│   │   ├── access-apply/               ← 准入申请
│   │   ├── access-approve/             ← 准入审批管理
│   │   ├── approve-config/             ← 审批配置
│   │   ├── vehicle-monitor/            ← 车辆状态监控
│   │   ├── service/                    ← 测试服务管理
│   │   └── public/                     ← 信息公开与在线反馈
│   ├── data-analysis/                  ← 监测数据分析
│   │   ├── analysis/                   ← 测试数据分析
│   │   ├── query/                      ← 数据查询检索
│   │   ├── accident/                   ← 事故数据分析
│   │   └── demo/                       ← 测试示范分析
│   └── platform/                       ← 平台管理
│       ├── dict/                       ← 数据字典管理
│       └── log/                        ← 操作日志管理
│
├── 05-参考文件/                         ← 参考文件与申报规程
│   ├── 附则1：襄阳市智能网联车辆道路测试与示范应用申报规程.docx
│   ├── 附则1-2：重点应用场景进阶流程图.pptx
│   ├── 襄阳市智能网联车辆道路测试与示范应用申报规程.md
│   ├── 道路测试_示范应用_商业化试点申请对比分析.md
│   ├── 三类申请材料汇总与对比.md
│   └── PRD与参考文件差异对比清单.md
│
├── 06-备份/                             ← 最近一次任务执行前的备份
│   ├── 01-需求文档/
│   ├── 02-产品文档/
│   └── 03-高保真页面/
│
└── 07-bugs/                            ← 自测截图（待创建）
```

## 关键交互模式

| 场景 | 实现方式 |
|------|----------|
| 列表页 | 筛选栏（`.filter-bar`）+ 表格（`.ant-table`）+ 分页（`Pagination`）+ 导出按钮 |
| 弹窗 | `openModal()` 全局方法，支持嵌套栈、自定义宽度、底部按钮 |
| 状态标签 | `.ant-tag-success` / `.ant-tag-warning` / `.ant-tag-error` / `.ant-tag-processing` / `.ant-tag-default` |
| 审批流程 | 时间线组件，串联审批节点：第三方初审 → 市工作专班审核 → 专家评审 → 专班专题会审议 |
| 图表页面 | ECharts 渲染，支持时间筛选（快捷按钮 + 日期范围）、维度切换 |
| 地图页面 | Leaflet / Canvas 渲染，支持图层切换、搜索定位、信息窗弹窗 |
| 下拉框 | 页面中写 `.ant-select` 占位元素 + 显示文本，`common.js` 自动转换为 `<select>` 并填充选项 |

## 开发注意事项

1. **CDN 依赖**：Tailwind CSS、ECharts、Leaflet、Font Awesome 均通过 CDN 加载，开发时需联网
2. **PAGE_ID 必须定义**：每个页面必须定义 `var PAGE_ID`，且其值必须与 `MENU_DATA` 中某个叶子节点的 `key` 一致，否则侧边栏无法高亮、面包屑无法生成
3. **common.js 引入顺序**：必须在页面 `<script>` 之后引入，确保 `PAGE_ID` 先于 `common.js` 执行
4. **路径计算**：`common.js` 通过 `getBasePath()` 自动计算相对路径深度，页面在子目录下任意层级均可正确导航
5. **弹窗嵌套**：`openModal()` 支持多层嵌套，内层弹窗打开时外层自动隐藏，关闭内层后外层自动恢复
6. **分页默认**：所有列表页默认每页 10 条，支持分页
7. **备份机制**：修改超过 3 个文件或生成新版本时，自动备份至 `06-备份/` 目录，保留最近 3 次
8. **需求对齐**：所有页面需与 `01-需求文档/` 和 `02-产品文档/` 中的文档保持一致，不得遗漏功能点
9. **UI 规范**：所有页面需遵从 `.claude/UI_design.md` 中的设计规范，包括颜色、字体、图标等
10. **二级页面与弹窗**：页面中逻辑上应存在的二级页面、弹窗等也需绘制，即使需求文档未明确要求
11. **术语对齐**：示范运营已统一为"商业化试点"，第三方服务机构已统一为"第三方专业管理机构"，联席工作小组已统一为"市工作专班"

## 文档索引

### 需求文档

| 文档 | 路径 | 内容概要 |
|------|------|----------|
| 开放道路管理模块 | `01-需求文档/开放道路管理模块.md` | 道路建档字段清单、动态管控状态变更校验、地图可视化图层、评估模型配置、区域统计 |
| 测试示范监管模块 | `01-需求文档/测试示范监管模块.md` | 准入信息登记字段、三类准入申请流程与材料清单、串联审批流程、监控一张图、电子围栏、测试评价 |
| 监测数据分析模块 | `01-需求文档/监测数据分析模块.md` | 测试数据总览、告警统计5Tab架构、数据查询检索、事故解析/成因/特征/研判、测试示范专题分析 |
| 平台管理模块 | `01-需求文档/平台管理模块.md` | 数据字典CRUD与版本管理、操作日志查询与审计、日志详情弹窗字段 |

### PRD 文档

| 文档 | 路径 | 版本 | 状态 |
|------|------|------|------|
| 开放道路管理模块PRD | `02-产品文档/开放道路管理模块PRD.md` | V1.1 | 待确认 |
| 测试示范监管模块PRD | `02-产品文档/测试示范监管模块PRD.md` | V1.7 | 待确认 |
| 监测数据分析模块PRD | `02-产品文档/监测数据分析模块PRD.md` | V1.1 | 待确认 |
| 平台管理模块PRD | `02-产品文档/平台管理模块PRD.md` | V1.1 | 已确认 |
| 角色页面权限 | `02-产品文档/不同人员页面.md` | — | — |
