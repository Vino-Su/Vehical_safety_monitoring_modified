# Handoff：视频/轨迹/数据统一时间轴改造方案

> **文档性质**：设计决策记录 + 改造交接文档
> **生成日期**：2026-08-04
> **涉及页面**：`03-高保真页面/monitor/vehicle-monitor/monitor-map.html`（监控一张图）、`03-高保真页面/monitor/vehicle-monitor/running.html`（车辆运行监测）
> **状态**：方案已确认并部分实施完成；实施进行中（见末尾"当前进度"）

---

## 1 一、背景与核心命题

### 1.1 起因
用户提出 `running.html` 视频监控 tab 的产品设计意见——需要满足"查看实时视频和历史视频"。讨论从 `running.html` 单页扩展到与 `monitor-map.html` 的实时视频/历史录像/轨迹回放三者的统一。

### 1.2 核心洞察（整个方案的地基）
**实时视频、历史视频、轨迹回放，本质是同一套「车辆 × 摄像头 × 时间」数据的三种视图：**

```
车辆(VIN) × 摄像头(cam_id) × 时间戳(timestamp)  →  一帧画面/一个轨迹点
```

- **实时视频** = 时间戳固定在 `now`，画面持续刷新
- **历史视频** = 时间戳在录像区间内任意拖动
- **轨迹回放** = 同一时间戳，但输出"地图上的位置点"而非"摄像头画面"

三者共享同一套底层数据，只是时间指针 T 的取值不同。

### 1.3 关键认知纠偏（避免踩坑）

1. **"统一时间轴"不是"统一频率"**
   - 视频流 25/30fps，轨迹 1~10Hz，数据 10Hz——频率差几百倍
   - **不是伪命题**：同步靠"绝对时间戳索引"，不是"下标对齐"
   - 每路各自做 `T → 本路数据` 的映射，互不依赖对方频率（类比电影：画面24fps + 音轨44100Hz + 字幕，靠各自时间戳对齐到同一条时间轴）

2. **"统一"的是时间轴引擎，不是"强制三同屏展示"**
   - 不同场景注意力焦点不同（实时盯防看视频、合规核查看轨迹、数据排查看数据）
   - 任何时候都三同步会牺牲每个场景的体验
   - → **数据层统一 + 视图分级展示**（默认单焦点，按需联动）

3. **进度条要"贴着主视图"，不是固定在底部**
   - 控制器要靠近被控对象（播放器常识）
   - 视频在右侧面板 → 进度条在视频画面正下方
   - 轨迹在地图 → 进度条在地图底部
   - 两个位置的进度条背后驱动**同一个 T**

4. **实时与回放共用同一视频面板，仅 T 来源不同**
   - 实时：T = `now`（无进度条）
   - 回放：T = 进度条驱动
   - 切换时面板不切换、不弹窗，仅切换 T 来源

---

## 2 二、确认的设计方案

### 2.1 三种布局形态（按需切换，不强制三同步）
| 形态 | 说明 | 适用场景 |
|---|---|---|
| 默认无视频 | 只轨迹+数据（或只异常事件） | 合规核查、日常监控 |
| 右侧面板单路 | 视频在右侧390px面板，单路主画面 | 实时盯防、核验 |
| 全屏多路 | 视频撑满视口，1/4/9宫格 | 事故复盘、多路精看 |

### 2.2 右侧面板：异常事件 / 视频 双态切换
- 右侧 `context-panel`（390px）顶部加模式切换条：「异常事件」「视频」
- **默认异常事件态**：全车队态势感知（不丢失）
- **视频态**：挂载公共视频组件（单路）
- 两态共存共享同一物理空间，不互相消灭

### 2.3 全屏承载多路同看
- 右侧面板放单路够（390px → 单路16:9约358×201）
- 多路放不下 → 全屏撑满视口承载
- 全屏 = 公共视频组件的另一种尺寸态（T/数据/摄像头配置共用）
- 取代了早期"分屏布局"方案

### 2.4 两个页面差异（公共组件需兼容）
| 维度 | monitor-map（地图页） | running（运行监测页） |
|---|---|---|
| 选车入口 | 多元（marker/drawer/异常列表） | **左侧车辆列表为主入口**（280px） |
| 视频承载区 | 右侧面板390px → 单路 | 主区域大 → 默认多路 |
| 时间联动 | 有地图轨迹，T与轨迹回放条联动 | 无地图，T独立（组件自带进度条） |
| layout 参数 | `single` | `multi`（gridCount=4） |

### 2.5 跨页面复用公共组件
- 抽公共 `video-workbench.js` + `video-workbench.css` + 统一数据 `vehicle-data.js` + 时间引擎 `time-clock.js`
- 两页引入同一份，消除重复硬编码
- 组件接口参数化（container / vehicleId / layout / timeSource / onSelectVehicle）

### 2.6 回放时车辆列表让位（地图页）
- 进入轨迹/视频回放 → 底部 `.vehicle-drawer` 自动收起（`.collapsed`，46px）
- 回放结束 → 自动展开恢复
- 复用现有 `.collapsed` 态 + `syncFloatingOverlayPosition()` 机制

### 2.7 不纳入本次范围
- **告警事件联动**（告警详情→查看视频入口）——用户明确暂不纳入
- 仅改造 monitor-map 和 running 两个页面

---

## 3 三、技术实现要点

### 3.1 时间戳驱动内核（最关键改造）
**原代码（下标驱动，伪同步）**：
```
seekTrajectory(idx) → currentIndex → 轨迹点[idx] → marker + metrics
```
轨迹和数据能对齐，仅因 `buildTrajectoryData` 同一次循环生成、硬塞在一起。视频挂不上（帧数≠点数）。

**改造后（时间戳驱动，真同步）**：
```
seekToTime(T) → currentTime = T
            ├─ 轨迹: 找 ≤T 的最近点(或线性插值) → marker
            ├─ 数据: 取 T 时刻快照 → metrics
            └─ 视频: 定位到录像 T 对应位置 → 画面
```

### 3.2 TimeClock 广播机制
```javascript
var TimeClock={
  currentTime:null, source:null, _listeners:[],
  set:function(t,src){ /* 广播 T 给所有监听者，src标识发起方避免循环 */ },
  on:function(fn){ /* 视图注册监听 */ },
  off:function(fn){ /* 注销 */ }
};
```
- `source` 标识发起方（'trajectory'|'video'），监听者据此跳过自身回写
- 视频进度条拖动 → `TimeClock.set(t,'video')` → 轨迹监听者收到 T → `seekToTime`
- 轨迹条拖动 → `TimeClock.set(t,'trajectory')` → 视频监听者收到 T → 跟随

### 3.3 公共组件接口
```javascript
VideoWorkbench.mount({
  container,              // 挂载点
  vehicleId,              // 当前车
  layout: 'single'|'multi',
  gridCount: 4,           // 多路宫格数(1/4/9)
  mode: 'live'|'playback',
  timeSource: 'now'|'external',  // T来源:实时 / 外部轨迹条驱动
  onSelectVehicle: fn
});
// 能力：摄像头切换/截图/本地录像/全屏/多路宫格/进度条/T广播
```

---

## 4 四、改造任务清单与进度

| # | 任务 | 状态 |
|---|---|---|
| 1 | B1: seekTrajectory 时间戳驱动改造 | ✅ 完成 |
| 2 | A1: 统一车辆+摄像头数据（vehicle-data.js） | ✅ 完成 |
| 3 | B2: 时间戳T广播机制（time-clock.js） | ✅ 完成 |
| 4 | A2: 公共视频组件JS核心（video-workbench.js） | ✅ 完成 |
| 5 | A3: 公共视频组件CSS（video-workbench.css） | ✅ 完成 |
| 6 | C1+C2: 地图页右侧面板双态+视频接入 | ✅ 完成 |
| 7 | C3+C4: 地图页全屏与实时/回放T兼容 | ✅ 完成 |
| 8 | C5: 清理地图页旧视频弹窗代码 | ✅ 完成 |
| 9 | D1+D4: 运行监控页tab接入+清理旧代码 | ✅ 完成 |
| 10 | D2+D3: 运行监控页车辆列表驱动+回放改造 | ✅ 完成 |
| 11 | E: 自测与备份 | ⏳ 进行中 |

---

## 5 五、当前进度与遗留问题（交接重点）

### 5.1 已完成
- **公共文件**（4个，均在 `03-高保真页面/common/`）：
  - `vehicle-data.js`：统一15辆车辆 + 6路摄像头配置（VEHICLE_CAMERAS）
  - `time-clock.js`：TimeClock 引擎 + timeToMinutes
  - `video-workbench.js`：组件核心（mount/全屏/多路/进度条/T驱动/截图录像）
  - `video-workbench.css`：组件样式
- **monitor-map.html**：
  - 引入4个公共文件
  - 删除内联 vehicleData
  - seekTrajectory 增加 `TimeClock.set` 广播
  - 右侧面板双态切换（switchContextMode）
  - openVideoPlayer 重写为"切视频态+选车"（非弹窗）
  - 删除旧 openVideoHistory/selectCamera
  - 轨迹回放打开收起车辆列表、关闭恢复
- **running.html**：
  - 引入4个公共文件
  - 视频tab九宫格 → `runningVideoPane` 容器 + 公共组件
  - selectVideoVehicle 重写为驱动组件选车
  - openVideoHistory 改为进入组件回放态（非弹窗）
  - 删除旧 openVideoHistory 弹窗 + playRecord

### 5.2 ⚠️ 遗留问题（下一步必看）

**问题：running.html 视频区初始化时序问题**
- 现象：截图显示右侧视频区空白；Chrome `--dump-dom` 确认 `<div id="runningVideoPane">` 为空
- 已做的修复尝试：
  1. `initRunningVideo` 加诊断输出（VideoWorkbench未定义/挂载错误）
  2. 末尾 script 从 `readyState/DOMContentLoaded` 判断改为直接调用 `initRunningVideo()`
- **dump 文件为 0 字节**：说明 `--dump-dom` 未捕获到 JS 动态渲染后的 DOM（headless dump 对动态 innerHTML 可能时序不对）
- **未最终验证**：修改后未再截图确认视频区是否有内容

**下一步建议**：
1. 重新对 running.html 截图（用 page-screenshot 而非 --dump-dom），确认视频区是否渲染出多路画面
2. 若仍空白，检查 `initRunningVideo` 是否在 `common.js`（定义 openModal 等）之前执行导致依赖缺失
3. 用浏览器 F12 控制台看实际报错（dump-dom 看不到运行时错误）
4. 验证 monitor-map.html 的视频面板态（点"视频"tab）和轨迹回放联动是否正常

### 5.3 备份
- 开工备份：`06-备份/backup_20260804_162718`（含原 03-高保真页面 + 02-产品文档 + index.html）
- 完成后备份：**待 #11 完成时再做一次**

---

## 6 六、关键文件索引

### 6.1 公共文件（新增）
- `03-高保真页面/common/vehicle-data.js` — 车辆+摄像头数据
- `03-高保真页面/common/time-clock.js` — 时间引擎
- `03-高保真页面/common/video-workbench.js` — 视频组件核心
- `03-高保真页面/common/video-workbench.css` — 视频组件样式

### 6.2 改造页面
- `03-高保真页面/monitor/vehicle-monitor/monitor-map.html`
  - 右侧面板双态：`switchContextMode(mode)`
  - 视频挂载：`vwVideoPane` 容器
  - 时间广播：`seekTrajectory` 内 `TimeClock.set(p.timeStr,'trajectory')`
  - `seekToTime(timeStr)` — 按时间定位轨迹点
- `03-高保真页面/monitor/vehicle-monitor/running.html`
  - 视频容器：`runningVideoPane`
  - 初始化：`initRunningVideo()`
  - 选车驱动：`selectVideoVehicle(el,plate)`
  - 回放入口：`openVideoHistory()` → `VideoWorkbench.enterPlayback`

### 6.3 自测截图
- `07-bugs/monitor_map_timeref_2026-08-04_083326.png` — 地基验证（通过）
- `07-bugs/monitor_map_video_panel_2026-08-04_084731.png` — 地图页视频面板（默认异常事件态）
- `07-bugs/running_video_workbench_2026-08-04_085433.png` — running页（视频区空白）
- `07-bugs/running_diag_2026-08-04_090406.png` — running页诊断版（仍空白）

---

## 7 七、设计决策备忘（供后续接手者理解"为什么"）

1. **为何不底部统一进度条**：进度条和被控对象分居两处反直觉；改为主视图在哪进度条贴哪
2. **为何不强制三同步**：各场景焦点不同，强三同步牺牲体验；改为数据统一+视图分级
3. **为何视频放右侧面板**：390px够放单路16:9；多路走全屏不硬塞
4. **为何抽公共组件**：两页视频功能本质同源，各写一遍会漂移
5. **为何下标改时间戳**：下标对齐是伪同步，视频帧数≠轨迹点数挂不上；时间戳索引才是真同步
6. **为何回放收起车辆列表**：底部空间冲突；回放专注某车历史，列表让位合理；复用现有 .collapsed 机制
7. **为何告警联动暂不做**：用户明确本次只改两页面，告警入口后续再纳

good job！
