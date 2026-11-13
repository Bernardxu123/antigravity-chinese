# 更新日志 (CHANGELOG)

本项目遵循语义化版本规范，持续追踪 Google Antigravity 官方桌面端更新。

---

## [v2.31.2] - 2026-11-13

### 🌟 新特性与多智能体系统适配
- **多智能体协调员体系 (Coordinators)**：
  - 全面汉化多智能体协调管理模块（`Coordinators`、`New Coordinator`、`Coordinator settings`、`No coordinators`）；
  - 汉化协调员目标设定引导（`What should this coordinator accomplish?` 等）。
- **旁支提问系统 (Side Questions)**：
  - 汉化会话内分支问答机制（`Side Question`、`Side Questions`、`New Side Question`、`Delete Side Question`）；
  - 汉化分支删除与确认、失败提示（`Failed to delete side question` 等）。
- **浏览器下载与安全控制 (Browser Downloads & Link Settings)**：
  - 汉化浏览器子智能体文件下载权限策略（`Browser downloads`、`Allow/deny agent browser file downloads from specific sites` 等）；
  - 汉化链接安全与 Cookie 管理提示（`Link Settings`、`Cookies and site data`、`Connection is secure` 等）；
  - 主进程对话框汉化：`Select Download Folder` $\rightarrow$ `选择下载文件夹`。
- **聊天布局与编辑器设置 (Chat Layout & Editor Settings)**：
  - 汉化界面与聊天布局配置（`Chat Layout`、`Interface Layout` 等）；
  - 汉化代码/聊天自动换行切换提示（`Toggle Word Wrap (Alt+Z)`）。
- **右键上下文菜单与操作反馈 (Context Actions & Feedback)**：
  - 汉化代码引用与跳转（`Find References`、`Quote`、`Comment`）；
  - 汉化模型回复评价（`Good Response`、`Bad Response`）；
  - 汉化推荐计划引导（`Google One Referral`）与实验模型标识（`Gemini Flash Next`）。
- **主进程与原生菜单**：
  - `menu.js` 新增原生菜单项 `Actual Size` $\rightarrow$ `实际大小`；
  - `ipcHandlers.js` 新增 `Select Download Folder` 对话框标题汉化；
  - 32 组主进程匹配模式全部 100% 验证通过。
- **词典扩充与优化**：
  - 新增词条源文件 `entries_i_2312.json`（共 72 个新词条）；
  - 词典词条总数扩充至 **2,774 条**。

---

## [v2.29.0] - 2026-11-04

### 🌟 界面重构与新特性适配
- **自动化工作流重构 (When / Where / What)**：
  - 适配全新自动化任务向导（`When` 触发时机、`Where` 运行环境、`What should it do?` 执行目标）；
  - 新增定时运行（`On a schedule`）与事件触发（`When something happens`）；
  - 新增周期设置（`Every hour`、`Every day`、`Every week`、`Every weekday`）及示例引导文案。
- **连接器生态 (Connectors)**：
  - 全面支持官方原“第三方集成/插件”升级而来的“连接器”体系；
  - 汉化 GitHub、Google Drive、Google Chat 接入指引与搜索筛选。
- **聊天输入与界面个性化**：
  - 适配回车键直接发送开关（`Enter to Send`）与行为说明；
  - 适配聊天宽度设置（`Chat Width`）、字体偏好（`Font`）；
  - 适配上下文与配额指示器（`Context and Quota Indicator`）；
  - 适配屏幕阅读器无障碍优化模式（`Screen Reader Mode`）。
- **侧边栏与下载管理**：
  - 适配侧边栏多标签切换与最大化（`Toggle Maximize Side Panel`、`Close Tabs to the Left` 等）；
  - 适配新版下载管理器（`Downloads`、`Download Location` 等）；
  - 适配产物标签关闭提示与更新状态。
- **录音与语音模式**：
  - 适配语音静音控制与麦克风切换；
  - 适配录音存档列表与批量删除确认。
- **新增动态正则替换规则**：
  - 历史消息翻页：`Load older messages, showing 5 of 43` $\rightarrow$ `加载更早的消息，显示第 5 / 43 条`；
  - 对话轮次指示：`Turn 2 of 6` $\rightarrow$ `第 2 / 6 轮对话`；
  - 步骤折叠展开：`Show 1 earlier step` $\rightarrow$ `显示前 1 个步骤`；
  - 相对时间：`5m ago` / `2h ago` $\rightarrow$ `5 分钟前` / `2 小时前`；
  - 产物关闭按钮：`Close <Tab Title>` $\rightarrow$ `关闭 <标签名>`；
  - 产物更新时间戳：`Updated <Date/Time>` $\rightarrow$ `更新于 <日期时间>`。
- **词典扩充**：
  - 新增词条源文件 `entries_h_2290.json`（共 143 条新词）；
  - 词典词条总数扩充至 **2,702 条**。

---

## [v2.28.2] - 2026-11-01

### 🚀 新特性与界面覆盖
- **云端与 CitC 工作空间**：
  - 支持远程智能体数据清理、云端沙箱文件挂载说明及 CitC 工作空间管理。
- **快捷键系统与标签控制**：
  - 支持快捷键查看、增删、搜索及重置；
  - 支持关闭其他/右侧标签页、新标签页打开等。
- **实时语音与 Jetski 引擎**：
  - 支持输入设备设置、Jetski 发音音色、参谋长画布与实时语音中继。
- **动态正则规则**：
  - 新增深度思考耗时指示：`Thought for 3s` $\rightarrow$ `思考时长 3s`；
  - 新增模型切换器：`Select model, current: ...` $\rightarrow$ `选择模型，当前：...`；
  - 新增权限预设选择器：`Agent permissions preset selector, current: ...` $\rightarrow$ `智能体权限预设选择器，当前：...`。
- **工程改进**：
  - `patch.js` 新增 `--no-kill` 免重启热修补模式。
- **词典扩充**：
  - 新增源文件 `entries_g_2282.json`（共 329 条）；
  - 词典词条总数达到 **2,560 条**。

---

## [v2.23.0] - 2026-10-14

### 🚀 新特性
- 支持 WSL 发行版未找到/回退提示与菜单；
- 支持 Best-of-N 分叉机制与参谋长画布；
- 新增 `entries_f_2230.json`，词典扩充至 2,230 条。

---

## [v2.11.0] - 2026-09-06

### 🚀 初始架构
- 基于 Electron Preload 注入 + DOM 动态监听的实时词典替换架构；
- 主进程 AST 与正则原生修改系统托盘、退出确认与窗口菜单；
- 建立 `check_main_process.js`、`fetch_ui_strings.js` 等全套维护工具链。
