# 更新日志 (CHANGELOG)

本项目遵循语义化版本规范，持续追踪 Google Antigravity 官方桌面端更新。

---

## [v2.34.0] - 2026-11-24

### 🌟 新特性与通用设置/编排模型/右键快捷菜单深度适配
- **全新编排模型与执行模型架构 (Orchestrator & Executor Models)**：
  - 汉化编排模型与执行模型全套概念（`Orchestrator` $\rightarrow$ `编排模型`、`Orchestrator Settings` $\rightarrow$ `编排模型设置`、`Orchestrator Model` $\rightarrow$ `编排模型`、`Executor Model` $\rightarrow$ `执行模型`）；
  - 汉化双模型协作说明（`Choose the models Orchestrator uses. A larger, smarter orchestrator model with a faster, cheaper executor gives high quality for fewer tokens.` $\rightarrow$ `选择编排器使用的模型。使用更大、更智能的编排模型配合更快、更低成本的执行模型，能以更少的 Token 获得高质量效果。`）；
  - 汉化工作规划与顶级模型建议（`Plans the work, makes design decisions, and reviews the result. Pick a top-tier model. You can also pick one per conversation from the Orchestrator row in the model menu.` $\rightarrow$ `规划工作、制定设计决策并审查结果。请选择顶级模型。您也可以在模型菜单的编排模型一栏为每个会话单独挑选。`）。
- **通用设置与输入框交互 (General Settings & Input Box)**：
  - 汉化通用设置“输入框”分区主标题（`Input Box` $\rightarrow$ `输入框`）；
  - 汉化后续排队消息策略（`Queued messages` $\rightarrow$ `排队消息`）；
  - 汉化回车发送快捷键说明（`Choose which key sends a message in the chat composer.` $\rightarrow$ `选择在聊天输入框中按哪个键发送消息。`、`Enter to send` $\rightarrow$ `按回车键发送`）；
  - 汉化侧边栏底部反馈入口（`Give Feedback` / `Provide Feedback` $\rightarrow$ `提供反馈`）。
- **权限预设与工具/网络/沙箱规则 (Permission Preset & Sandbox Details)**：
  - 汉化全局权限预设标签（`Permission preset` $\rightarrow$ `权限预设`、`Security preset` $\rightarrow$ `安全预设`）；
  - 汉化权限详情入口标题（`Tool permissions` $\rightarrow$ `工具权限`、`Network access rules` $\rightarrow$ `网络访问规则`、`File access rules` $\rightarrow$ `文件访问规则`）；
  - 汉化终端命令与沙箱控制文案（`File reads` $\rightarrow$ `文件读取`、`File writes` $\rightarrow$ `文件写入`、`Terminal commands` $\rightarrow$ `终端命令`、`Terminal command auto execution` $\rightarrow$ `终端命令自动执行`、`Enable sandbox mode` $\rightarrow$ `启用沙箱模式`、`Enable terminal sandbox` $\rightarrow$ `启用终端沙箱`、`Commands outside sandbox` $\rightarrow$ `沙箱外部命令`）。
- **项目/工作空间快捷菜单与动态名称复制 (Context Menu & Copy Name)**：
  - 汉化右键菜单项（`Copy Project Name` $\rightarrow$ `复制项目名称`、`Copy Workspace Name` $\rightarrow$ `复制工作空间名称`、`Copy Worktree Name` $\rightarrow$ `复制工作树名称`）；
  - 汉化项目/工作空间置顶与归档（`Pin Project` $\rightarrow$ `置顶项目`、`Unpin Project` $\rightarrow$ `取消置顶项目`、`Pin Workspace` $\rightarrow$ `置顶工作空间`、`Unpin Workspace` $\rightarrow$ `取消置顶工作空间`、`Pin Worktree` $\rightarrow$ `置顶工作树`、`Unpin Worktree` $\rightarrow$ `取消置顶工作树`、`Archive Project` $\rightarrow$ `归档项目`、`Archive Worktree` $\rightarrow$ `归档工作树`、`Worktree Settings` $\rightarrow$ `工作树设置`、`Delete Workspace` $\rightarrow$ `删除工作空间`、`Delete Worktree` $\rightarrow$ `删除工作树`）；
  - 新增动态正则规则 `Copy (.+?) Name` $\rightarrow$ `复制$1名称`，为未来新实体名称复制提供自适应匹配能力。
- **侧边栏自定义管理增强 (Customize Sidebar)**：
  - 汉化侧边栏管理向导（`Customize Sidebar` $\rightarrow$ `自定义侧边栏`、`Show in Sidebar` $\rightarrow$ `在侧边栏中显示`、`New conversation button` $\rightarrow$ `新建会话按钮`、`Show Automation Conversations` $\rightarrow$ `显示自动化任务会话`、`Show Plugin Conversations` $\rightarrow$ `显示插件会话`）；
  - 汉化侧边栏分区与排序操作（`Filters` $\rightarrow$ `筛选条件`、`Last Activity` $\rightarrow$ `最近活动`、`Pinned` $\rightarrow$ `已置顶`、`Unread` $\rightarrow$ `未读`、`Needs Input` $\rightarrow$ `等待输入`、`Idle Conversations` $\rightarrow$ `空闲会话`、`Unsent draft` $\rightarrow$ `未发送草稿`、`Manual Order` $\rightarrow$ `手动排序`、`Move Up` $\rightarrow$ `上移`、`Move Down` $\rightarrow$ `下移`、`Hide` $\rightarrow$ `隐藏`、`Show 5` $\rightarrow$ `显示 5 条`、`Show 10` $\rightarrow$ `显示 10 条`）；
  - 新增快捷键动态正则规则 `Select Sidebar Item (\d+)` $\rightarrow$ `选择侧边栏项目 $1`。

### 🛡️ 稳固防御机制 (Defensive Architecture Safeguards)
- **严格遵循防死循环假死安全红线**：
  - [patch.js](file:///D:/AI/杂/antigravity-chinese-patch/patch.js) 维持所有 DOM 写操作 `current !== translated` 严格前置校验；
  - [tools/merge_entries.js](file:///D:/AI/杂/antigravity-chinese-patch/tools/merge_entries.js) 熔断拦截所有恒等词条；
  - 词典恒等词条数严格保持为 0，专有名词（`Google Drive`、`Cookie`、`Gemini` 诸型号）全量受 `shouldNotTranslate` 测试保护。
- **词典扩充**：
  - 新增词条源文件 `entries_n_2340.json`（共 62 个新词条）；
  - 词典词条总数扩充至 **3,039 条**（通过 306 / 306 项仿真测试）。

---

## [v2.33.0] - 2026-11-19

### 🌟 新特性与侧边栏高级筛选深度适配
- **侧边栏多维筛选与视图选项 (Sidebar Filter & View Options)**：
  - 汉化项目/工作空间排序菜单（`Sort Projects` $\rightarrow$ `项目排序`、`Sort Workspaces` $\rightarrow$ `工作空间排序`）；
  - 汉化自动置顶与归档筛选（`Auto Pin` $\rightarrow$ `自动置顶`、`Archived Only` $\rightarrow$ `仅已归档`）；
  - 汉化侧边栏定时任务筛选（`Scheduled` $\rightarrow$ `定时任务`）；
  - 汉化空置顶状态文案（`No pinned conversations` $\rightarrow$ `无置顶会话`）；
  - 汉化副标题与徽章修饰菜单（`Subtitles` $\rightarrow$ `副标题`、`Decorations` $\rightarrow$ `修饰标签`、`Display Options` $\rightarrow$ `显示选项`）。
- **会话与标签页置顶/快速操作 (Pinning & Quick Actions)**：
  - 汉化会话右键菜单置顶/取消置顶（`Pin` $\rightarrow$ `置顶`、`Unpin` $\rightarrow$ `取消置顶`）；
  - 汉化标签页右键菜单置顶/取消置顶（`Pin Tab` $\rightarrow$ `固定标签页`、`Unpin Tab` $\rightarrow$ `取消固定标签页`）。
- **地址栏/快速打开与新标签页搜索 (Quick Open & Search Navigation)**：
  - 汉化新建标签页/地址栏输入框引导文案（`Search or enter a URL` $\rightarrow$ `搜索或输入网址`、`Enter a URL (e.g. http://localhost:8080)` $\rightarrow$ `输入网址（例如 http://localhost:8080）`）；
  - 汉化通用搜索栏占位符与无障碍说明（`Search tabs, files and more` $\rightarrow$ `搜索标签页、文件及更多内容`、`Search for content to open` $\rightarrow$ `搜索要打开的内容`、`Address bar suggestions` $\rightarrow$ `地址栏建议`）。
- **浏览器数据清理与快捷键方案管理 (Browsing Data & Keybinding Scheme)**：
  - 汉化浏览器数据清理确认弹窗与说明（`Clear Browsing Data?` $\rightarrow$ `清除浏览数据？`、`Clear history, cookies and site data from the built-in browser, or manage cookies for each site.` $\rightarrow$ `清除内置浏览器的历史记录、Cookie 和网站数据，或管理各个网站的 Cookie。`、`Browsing Data` $\rightarrow$ `浏览数据`、`Sites with cookies` $\rightarrow$ `包含 Cookie 的网站`、`Cookies by Site` $\rightarrow$ `按网站划分的 Cookie`）；
  - 汉化快捷键方案选择交互（`Keybinding Scheme` $\rightarrow$ `快捷键方案`、`Choose between non-colliding VS Code defaults or standalone Antigravity chords.` $\rightarrow$ `在无冲突的 VS Code 默认快捷键或独立的 Antigravity 组合键之间进行选择。`、`All active Antigravity shortcuts and user keybinding overrides are managed directly by VS Code.` $\rightarrow$ `所有处于活跃状态的 Antigravity 快捷键和用户自定义快捷键覆盖均由 VS Code 直接管理。`、`Manage your keybinding scheme and customize shortcuts in VS Code.` $\rightarrow$ `管理您的快捷键方案并在 VS Code 中自定义快捷键。`、`Customize Shortcuts` $\rightarrow$ `自定义快捷键`、`Antigravity (AGY) Style` $\rightarrow$ `Antigravity (AGY) 风格`、`VS Code Default` $\rightarrow$ `VS Code 默认`）。
- **智能体控制与功能包/旁支提问细节增强 (Agent Controls, Bundles & Side Questions)**：
  - 汉化语音听写状态（`Voice dictation unavailable` $\rightarrow$ `语音听写不可用`）；
  - 汉化智能体中断与单独安装提示（`Interrupt Agent` $\rightarrow$ `中断智能体`、`Installed separately` $\rightarrow$ `单独安装`、`No longer available` $\rightarrow$ `不再可用`）；
  - 汉化功能包审查与添加（`Review bundle before adding` $\rightarrow$ `添加前审查功能包`、`Bundles` $\rightarrow$ `功能包`、`Add bundle` $\rightarrow$ `添加功能包`）；
  - 汉化旁支提问状态与无障碍交互（`This side question isn't available in this conversation.` $\rightarrow$ `此旁支提问在当前会话中不可用。`、`The main conversation's input isn't available right now.` $\rightarrow$ `主会话输入框当前不可用。`、`Insert into main conversation` $\rightarrow$ `插入到主会话`、`Promote to conversation` $\rightarrow$ `提升为独立会话` 等）。

### 🛡️ 稳固防御机制 (Defensive Architecture Safeguards)
- **恒等词条防死循环熔断保障**：
  - 延续并加固 v2.32.2 修复的防假死机制：所有 DOM 写入路径坚守 `current !== translated` 变更前置校验，坚决不触发同值写操作以避免 Chromium 派发 `characterData` 导致 MutationObserver 死循环；
  - 在 `tools/merge_entries.js` 中新增恒等词条自动化熔断过滤（`if (en === zh) continue`），从源头上杜绝任何等值占位词条（如品牌名、型号名）混入 `dictionary.json`；
  - `tools/test_translation.js` 扩展 `shouldNotTranslate` 校验清单（涵盖 Google Drive、Cookie、Gemini Flash Next 及各多模态型号），确保专有名词绝不被误翻译或误映射。
- **词典扩充**：
  - 新增词条源文件 `entries_m_2330.json`（新增 57 个新词条）；
  - 词典词条总数扩充至 **2,977 条**（0 恒等词条，100% 纯有效中文映射）。

---

## [v2.32.2] - 2026-11-18

### 🐛 关键缺陷修复 (Critical Bug Fix)
- **彻底修复点击“自定义配置”界面卡死 (Customizations Hang / Freeze Fix)**：
  - **根本原因定位**：Chromium 在重新赋值 `textNode.textContent = value` 时，即便新旧内容完全相同亦会派发 `characterData` 类型的 MutationRecord（已通过 DevTools 协议在真实渲染进程实测确认，连脱离文档的 Text 节点同值赋值也会派发）；而应用商店中的卡片（如品牌名 `Google Drive` 等）在旧词典中存在等值映射（`"Google Drive": "Google Drive"`），导致 `MutationObserver` 陷入死循环递归派发微任务，进而导致整个渲染进程 UI 线程 100% 占满假死；
  - **防御性修复机制**：
    1. 在 `translateNode` 中对 TextNode、placeholder、title、aria-label、button value 均增加 `current !== translated` 变更前置校验，内容一致时坚决不触发 DOM 写操作；
    2. 清理词典中无效的恒等词条，避免无意义的查找与比对；
    3. 支持原生 `<button>` 子节点为多 TextNode 时的聚合匹配与翻译，彻底解决类似 `Delete Project` 渲染为 `删除Project` 的多节点拼接翻译问题。

### 🌟 新特性与界面汉化覆盖扩充
- **欢迎页个性化问候与快捷建议卡片 (Home Greetings & Suggestions)**：
  - 新增动态问候语正则匹配，完美适配带用户名问候（如 `Welcome back, 徐小设. Where should we pick up?` $\rightarrow$ `欢迎回来，徐小设。我们要从哪里继续？`、`Hey <name>, what should we build today?` $\rightarrow$ `嗨 <name>，今天我们要做点什么？`、`Good to see you, <name>. What's next?` $\rightarrow$ `很高兴见到你，<name>。接下来做什么？`）；
  - 全量汉化欢迎页官方预设建议卡片（`Build a page from my Figma design` $\rightarrow$ `根据我的 Figma 设计构建页面`、`Turn a screenshot into a web page` $\rightarrow$ `将屏幕截图转换为网页`、`Write a design brief from my research` $\rightarrow$ `根据我的研究撰写设计简报` 等各大专业角色卡片）。
- **设置与权限详情文案 (Settings & Tool Permissions)**：
  - 汉化语音模式音量说明（`How loud Antigravity's voice is.` $\rightarrow$ `Antigravity 语音的音量大小。`）；
  - 汉化文件与终端工具权限说明（`Modify permissions for file and terminal tools.` $\rightarrow$ `修改文件与终端工具的权限。`）。
- **Swarm 与项目危险操作区域 (Swarm & Danger Zone)**：
  - 汉化项目设置与权限说明（`Manage project folders, agent settings, and permissions.` $\rightarrow$ `管理项目文件夹、智能体设置和权限。`）；
  - 汉化 Swarm 自动化任务托管项目删除警告（`This project is managed by the Swarm automation and can only be deleted by deleting that automation.` $\rightarrow$ `此项目由 Swarm 自动化任务管理，只能通过删除该自动化任务来删除。`）；
  - 修复删除按钮多文本节点拼接翻译（`Delete Project` $\rightarrow$ `删除项目`）。
- **词典扩充**：
- 新增词条源文件 `entries_l_2322.json`（共 45 个新词条）；
- 词典词条总数扩充至 **2,920 条**（已同步剔除 `Google Drive`、`Cookie`、`Gemini Flash Next`、`Gemini 2.5/3 Pro/3.1 Flash Image` 共 6 条恒等占位词条及 entries 源文件中的同款，防止未来重新合并时复活）。

---

## [v2.32.1] - 2026-11-14

### 🌟 新特性与远程工作流适配
- **跨设备会话接续 (Remote Handoff & QR Code)**：
  - 汉化在其他设备打开会话对话框（`Open on another device` $\rightarrow$ `在其他设备上打开`）；
  - 汉化移动端/浏览器扫码无缝接续提示（`Pick up this remote conversation on your phone or in any browser. Scan the QR code or open the link below.` $\rightarrow$ `在手机或任何浏览器中继续此远程会话。扫描二维码或打开下方链接。`）；
  - 汉化 `Remote Control link`、`Conversation link` 等辅助标签。
- **评论草稿与审查交互 (Comment Drafts)**：
  - 汉化未发送评论草稿恢复与放弃（`Resume comment draft` / `Discard comment draft`）；
  - 汉化单份评论草稿提示（`Resume 1 comment draft` $\rightarrow$ `恢复 1 份评论草稿`、`1 Draft` $\rightarrow$ `1 份草稿`）。
- **提示词导航与消息管理 (Prompt Navigation & Turns)**：
  - 汉化上一条/下一条提示词快速跳转（`Jump to Previous Prompt` $\rightarrow$ `跳转至上一条提示词`、`Jump to Next Prompt` $\rightarrow$ `跳转至下一条提示词`）；
  - 汉化回车发送备选快捷键（`Submit Prompt (Alternate to Enter)` $\rightarrow$ `提交提示词（回车键的备选快捷键）`、`Enter always submits. This adds a second shortcut.`）；
  - 汉化会话全部标记已读/未读（`Mark All as Read`、`Mark This Conversation as Read/Unread`）。
- **SSH 远程开发与主机连接 (SSH Remote & Hosts)**：
  - 汉化 SSH 主机连接向导（`Connect to SSH Host…` $\rightarrow$ `连接到 SSH 主机…`、`Stop SSH Server…` $\rightarrow$ `停止 SSH 服务器…`）；
  - 汉化工作空间快速切回本机（`Switch to This Computer` $\rightarrow$ `切换至此电脑`）；
  - 汉化 SSH 配置列表与主机管理（`SSH Host`、`SSH Config`、`Local Checkout` $\rightarrow$ `本地检出`）。
- **组织管控与诊断提示 (Organization Policy & Errors)**：
  - 汉化组织只读 MCP 规则提示（`Organization MCP Allowlist (Read-Only)`）；
  - 汉化本地克隆与解档失败对话框（`Failed to clone project locally`、`Failed to unarchive local project`）；
  - 汉化智能体暂停/停止交互与状态提示（`Resume this agent where it paused`、`Stop this agent`、`Stopped`）。
- **词典扩充**：
  - 新增词条源文件 `entries_k_2321.json`（共 62 个新词条）；
  - 词典词条总数扩充至 **2,881 条**。

---

## [v2.31.2] - 2026-11-13

### 🔧 细节增强与设置页全景汉化（2026-11-14 深度适配）
- **界面布局模式卡片 (Interface Layout)**：
  - 汉化 `Knowledge Work` $\rightarrow$ `知识工作` 与 `Simplified interface for research, writing, and everyday tasks.` $\rightarrow$ `适用于研究、写作和日常任务的简化界面。`；
  - 汉化 `Software Engineering` $\rightarrow$ `软件工程` 与 `Full interface for coding, developer tools, and managing agents.` $\rightarrow$ `适用于编码、开发工具和智能体管理的完整界面。`。
- **语音设置与音色预览 (Voice Mode & Settings)**：
  - 汉化语音模式配置说明、音色未设置提示（`Not set` $\rightarrow$ `未设置`）；
  - 汉化音色选择器对话框全流程（`Choose Antigravity's Voice`、`Clear and friendly` 等音质音色属性、`Use <Voice>` 动态按钮等）；
  - 汉化录音管理与一键删除对话框。
- **浏览器服务完整交互 (Browser Services)**：
  - 汉化内置浏览器（`Built-in Browser`）与外部浏览器（`External Browser`）切换；
  - 汉化下载保存目录说明与更改路径按钮（`Change...` / `Change…`）；
  - 汉化浏览历史清理与浏览器子智能体操作规则详细配置文案。
- **会话管理与自定义配置细分 (Customizations Breakdown)**：
  - 汉化项目外部独立会话配置说明、Token 预算策略警告说明；
  - 汉化 `Mcp Tools` 规范名称；
  - 增强使用细分动态正则，全面支持单复数匹配（如 `Show 1 breakdown` $\rightarrow$ `查看 1 项使用细分`）。
- **模型与用量及限额倒计时 (Models & Usage)**：
  - 汉化 `Models & Usage` 主标题及刷新状态；
  - 动态正则增强适配用户计划名称（`Your Plan: Google AI Pro` $\rightarrow$ `您的计划：Google AI Pro`）；
  - 汉化 AI 积分超额使用机制说明；
  - 汉化 `Gemini Models`、`Claude and GPT models` 类别标题；
  - 汉化配额周期（`Weekly Limit Remaining` $\rightarrow$ `每周剩余配额`、`Five Hour Limit Remaining` $\rightarrow$ `5 小时剩余配额`）；
  - 新增配额重置动态倒计时正则（如 `Resets in 3d 4h` $\rightarrow$ `将在 3 天 4 小时 后重置`、`Resets in <1m` $\rightarrow$ `将在 1 分钟内重置`）。
- **词典扩充**：
  - 新增词条源文件 `entries_j_2312_settings.json`（新增 45 个词条）；
  - 词典词条总数扩充至 **2,819 条**。

### 🌟 新特性与多智能体系统适配（2026-11-13 初版）
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
