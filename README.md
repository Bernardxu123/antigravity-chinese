# Google Antigravity 桌面端中文汉化补丁 (2.x 全版本)

[![Version](https://img.shields.io/badge/Antigravity-v2.32.1-blue.svg)](https://github.com/Bernardxu123/antigravity-chinese)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/Bernardxu123/antigravity-chinese)
[![Dictionary](https://img.shields.io/badge/dictionary-2880%2B%20entries-orange.svg)](dictionary.json)

本项目为 Google 官方出品的下一代 AI 编程智能体工具 **Google Antigravity 桌面端** 提供高品质、无损、深度集成的界面中文汉化补丁。

持续跟进官方发布动态，当前已深度适配 **v2.32.1（2026年11月最新版）**，同时向下兼容 2.x 全系版本。

---

## ✨ 核心特性

- 🎯 **深度全量覆盖**：包含应用菜单、系统托盘、自动更新弹窗、WSL 集成、新建/设置/自动化任务向导、侧边栏、协调员体系（Coordinators）、旁支提问（Side Questions）、跨设备接续与二维码（Remote Handoff）、SSH 远程连接、连接器（Connectors）、模型与权限预设选择器等全量界面。
- 🛡️ **代码与业务无损**：严格隔离代码编辑器（Monaco / CodeMirror / ContentEditable 区域）、终端命令行交互、产物生成及文件正文，**绝不触碰任何代码逻辑与通信协议**。
- ⚡ **动态文本智能匹配**：内置 28 组高精正则替换规则，精准汉化如“思考时长 3s”、“第 2 / 6 轮对话”、“将在 3 天 4 小时 后重置”、“您的计划：Google AI Pro”、“查看 1 项使用细分”等动态拼装文本。
- 🔄 **自动备份与安全还原**：首次应用自动备份官方原始 `app.asar` 到 `app.asar.bak`。后续 Antigravity 自动更新后，脚本会自动检测并刷新备份，随时可通过 `--revert` 一键无缝回退官方原版。
- 🚀 **在线免重启热生效**：支持 `--no-kill` 热修补模式，不中断当前运行中的智能体任务与会话连接。
- 🛠️ **完整演进工具链**：内置开箱即用的 Bundle 提取器、主进程 AST/正则校验器、离线翻译仿真套件及 CDP 端到端 DOM 验证工具，版本升级持续维护更轻松。

---

## 📋 版本兼容性矩阵

| Antigravity 版本 | 汉化支持状态 | 词典词条数 | 重点更新内容 |
| :--- | :---: | :---: | :--- |
| **v2.32.1**（最新） | 🌟 完美支持 | **2,881** | 跨设备会话接续 (二维码/链接)、评论草稿断点恢复、提示词上一条/下一条快捷跳转、SSH 远程开发与主机连接、组织 MCP 允许名单等 |
| **v2.31.2** | ✅ 完美支持 | 2,819 | 协调员体系 (Coordinators)、旁支提问 (Side Questions)、知识工作/软件工程布局、语音音色与预览、浏览器/模型配额设置全量汉化 |
| **v2.29.0** | ✅ 完美支持 | 2,702 | 自动化 When/Where/What 交互重构、连接器 (Connectors)、回车发送与聊天宽度、屏幕阅读器模式、下载管理器 |
| **v2.28.2** | ✅ 完美支持 | 2,560 | 云端工作区、CitC 工作区、快捷键管理、实时语音 (Jetski)、模型深度思考耗时、权限预设选择器 |
| **v2.23.0** | ✅ 完美支持 | 2,230 | 权限微调、WSL 子系统菜单、Best-of-N 分叉、参谋长画布 |
| **v2.11.x ~ v2.12.x** | ✅ 完美支持 | 1,800+ | 语言服务器本地 UI 架构、自动更新器多态弹窗 |
| **v2.0.x ~ v2.10.x** | ✅ 基础支持 | 1,200+ | 基础导航、设置项与会话管理 |

---

## 🚀 快速使用

### 前提条件
- 已安装 [Node.js](https://nodejs.org/) (建议 Node.js >= 16)
- 已安装 Google Antigravity 桌面版

### 方法一：一键自动安装（推荐）

双击运行仓库根目录下的 **`双击汉化.bat`**：
1. 脚本会自动检查环境依赖并补齐 `@electron/asar`；
2. 自动备份官方原版 `app.asar`；
3. 完成主进程与渲染层注入重打包；
4. 自动重启应用进入中文界面。

### 方法二：命令行执行

```bash
# 1. 安装解包依赖
npm install

# 2. 应用汉化补丁（会优雅重启 Antigravity）
node patch.js

# 或者：免重启热补丁模式（不终止运行中的进程，下次启动时生效）
node patch.js --no-kill
```

### 方法三：恢复官方英文原版

随时可通过以下命令瞬间还原，无需重新安装客户端：

```bash
node patch.js --revert
```
*(或运行 `run_patch.bat`，根据提示输入还原选项)*

---

## 📂 仓库结构

```text
antigravity-chinese-patch/
├── patch.js               # 补丁主引擎（解包、正则修补、preload 注入、重打包）
├── dictionary.json        # 汉化主词典（2,700+ 精校词条，精确匹配与空白归一化）
├── 双击汉化.bat           # Windows 一键执行入口
├── run_patch.bat          # 备用 CLI 交互入口
├── package.json           # 项目配置与自动化脚本
├── README.md              # 项目说明文档
├── CHANGELOG.md           # 版本更新履历
└── tools/                 # 持续更新与维护工具套件
    ├── fetch_ui_strings.js    # 自动探测 UI 端口并提取最新 bundle 中未翻译词条
    ├── check_main_process.js  # 自动解包 app.asar 校验主进程各正则命中状态
    ├── test_translation.js   # 离线翻译逻辑仿真，验证词条与动态规则有效性
    ├── verify_ui.js           # 通过 Electron CDP 读取实时 DOM 文本做端到端验证
    ├── apply_live_cdp.js      # 通过 CDP 向当前正在运行的窗口实时热注入汉化脚本
    ├── merge_entries.js       # 将分批词条 (entries_*.json) 合并至 dictionary.json
    ├── entries_a_settings.json
    ├── entries_b_registry.json
    ├── entries_c_ui.json
    ├── entries_d_misc.json
    ├── entries_e_general.json
    ├── entries_f_2230.json    # 2.23.0 补充词条
    ├── entries_g_2282.json    # 2.28.2 补充词条
    ├── entries_h_2290.json    # 2.29.0 补充词条
    ├── entries_i_2312.json    # 2.31.2 核心特性词条
    ├── entries_j_2312_settings.json # 2.31.2 设置与深度交互词条
    └── entries_k_2321.json    # 2.32.1 补充词条
```

---

## 🛠️ 后续版本持续更新指南

当 Google Antigravity 发布新版本后，界面可能会引入新的未翻译英文。只需按以下标准化 5 步流程进行扩充：

### 1. 抓取新版前端文案
启动新版 Antigravity，运行：
```bash
node tools/fetch_ui_strings.js
```
*(脚本会自动扫描并连接语言服务器端口，抓取前端最新 JS Bundle，候选文案将输出至 `tools/out/report.json` 与 `tools/out/raw.txt`)*

### 2. 校验主进程代码变动
```bash
node tools/check_main_process.js
```
*(自动解包当前已安装的 `app.asar`，测试 `patch.js` 中 32 组主进程正则匹配模式是否全部命中。若官方调整了代码写法，根据提示同步微调 `patch.js`)*

### 3. 补充新词条并合并
在 `tools/` 目录下新建对应版本的词条文件（如 `entries_i_2300.json`），完成翻译后执行：
```bash
node tools/merge_entries.js
```
*(会自动合并入 `dictionary.json` 并进行去重和规范化)*

### 4. 离线仿真测试
```bash
npm test
# 等同于: node tools/test_translation.js
```
*(离线验证高频用例与动态正则规则命中情况，确保无误)*

### 5. 应用并进行端到端验证
```bash
node patch.js --no-kill
node tools/verify_ui.js
```
*(经 Chrome DevTools Protocol 直连运行中的 Electron 窗口，输出 DOM 实际渲染文本及中英文字符统计)*

---

## ⚠️ 隐私安全与声明

- **零隐私泄露**：本仓库完全剔除任何个人用户名、文件路径、会话内容与账号令牌。
- **纯开源透明**：所有注入脚本均以明文形式保留在 `patch.js` 与 `dictionary.json` 中，用户可随时查验代码逻辑。
- **保留专有名词**：产品名（如 Antigravity、Gemini 3.8 Flash、Google Chrome）、官方标志符与代码语法保持英文原文，不进行生硬翻译。

---

## 📄 授权许可

本项目基于 [MIT License](LICENSE) 协议开源。欢迎提交 Issue 与 Pull Request 共同维护！
