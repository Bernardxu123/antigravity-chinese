/**
 * 离线验证：用与 patch.js 注入脚本一致的 translateText 逻辑，
 * 对截图/新 bundle 中的关键字符串做翻译仿真，无需重启 Antigravity。
 *
 * 用法：node tools/test_translation.js
 */
const path = require('path');
const dictionary = require(path.join(__dirname, '..', 'dictionary.json'));

// 与 patch.js buildInjectScript 保持一致的归一化与匹配逻辑
const normalizedDict = {};
for (const key in dictionary) {
  normalizedDict[key.replace(/\s+/g, ' ').trim()] = dictionary[key];
}

function translateText(text) {
  if (!text) return null;
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) return null;
  if (normalizedDict[normalizedText]) return normalizedDict[normalizedText];

  let cleanText = normalizedText;
  if (normalizedText.endsWith('...')) cleanText = normalizedText.slice(0, -3).trim();
  else if (normalizedText.endsWith('…')) cleanText = normalizedText.slice(0, -1).trim();

  if (cleanText.length > 20) {
    for (const key in normalizedDict) {
      if (key.startsWith(cleanText)) return normalizedDict[key];
    }
  }

  const budgetMatch = normalizedText.match(/^([\d.]+)%\s+of\s+the\s+customization\s+budget\s+is\s+available\.$/i);
  if (budgetMatch) return `可用自定义额度为 ${budgetMatch[1]}%。`;
  const breakdownsMatch = normalizedText.match(/^Show\s+(\d+)\s+breakdowns?$/i);
  if (breakdownsMatch) return `查看 ${breakdownsMatch[1]} 项使用细分`;
  const skillsMatch = normalizedText.match(/^Skills\s*\((\d+)\)$/i);
  if (skillsMatch) return `已启用智能体技能 (${skillsMatch[1]})`;
  const skillsPctMatch = normalizedText.match(/^Skills\s*\(([\d.]+)%\)\s*([\d,]+)$/i);
  if (skillsPctMatch) return `技能 (${skillsPctMatch[1]}%) ${skillsPctMatch[2]} Token`;
  const seeAllMatch = normalizedText.match(/^See\s+all\s+\((\d+)\)$/i);
  if (seeAllMatch) return `查看全部 (${seeAllMatch[1]})`;
  const learnMoreMatch = normalizedText.match(/^Learn\s+more\s+about\s+(.+)$/i);
  if (learnMoreMatch) return `了解更多关于 ${learnMoreMatch[1]}`;
  const projectsMatch = normalizedText.match(/^(\d+)\s+projects?$/i);
  if (projectsMatch) return `${projectsMatch[1]} 个项目`;
  const workedForMatch = normalizedText.match(/^Worked\s+for\s+(.+)$/i);
  if (workedForMatch) return `工作时长 ${workedForMatch[1]}`;
  const showMoreMatch = normalizedText.match(/^Show\s+more\s+\((\d+)\)$/i);
  if (showMoreMatch) return `显示更多（${showMoreMatch[1]}）`;
  const bestOfMatch = normalizedText.match(/^Start\s+Best-of-(\d+)$/i);
  if (bestOfMatch) return `启动 Best-of-${bestOfMatch[1]}`;
  const availMatch = normalizedText.match(/^Available\s+for\s+(\d+)\s+projects?$/i);
  if (availMatch) return `可用于 ${availMatch[1]} 个项目`;
  const thoughtForMatch = normalizedText.match(/^Thought\s+for\s+(.+)$/i);
  if (thoughtForMatch) return `思考时长 ${thoughtForMatch[1]}`;
  const olderMsgsMatch = normalizedText.match(/^No\s+more\s+older\s+messages,\s*showing\s+(\d+)\s+of\s+(\d+)$/i);
  if (olderMsgsMatch) return `没有更早的消息，显示第 ${olderMsgsMatch[1]} / ${olderMsgsMatch[2]} 条`;
  const selectModelMatch = normalizedText.match(/^Select\s+model,\s*current:\s*(.+)$/i);
  if (selectModelMatch) return `选择模型，当前：${selectModelMatch[1]}`;
  const presetSelectorMatch = normalizedText.match(/^Agent\s+permissions\s+preset\s+selector,\s*current:\s*(.+)$/i);
  if (presetSelectorMatch) return `智能体权限预设选择器，当前：${presetSelectorMatch[1]}`;
  const showSubmittedMatch = normalizedText.match(/^Show\s+submitted\s+\((\d+)\)$/i);
  if (showSubmittedMatch) return `显示已提交（${showSubmittedMatch[1]}）`;
  const loadOlderMsgsMatch = normalizedText.match(/^Load\s+older\s+messages,\s*showing\s+(\d+)\s+of\s+(\d+)$/i);
  if (loadOlderMsgsMatch) return `加载更早的消息，显示第 ${loadOlderMsgsMatch[1]} / ${loadOlderMsgsMatch[2]} 条`;
  const turnMatch = normalizedText.match(/^Turn\s+(\d+)\s+of\s+(\d+)$/i);
  if (turnMatch) return `第 ${turnMatch[1]} / ${turnMatch[2]} 轮对话`;
  const earlierStepsMatch = normalizedText.match(/^Show\s+(\d+)\s+earlier\s+steps?$/i);
  if (earlierStepsMatch) return `显示前 ${earlierStepsMatch[1]} 个步骤`;
  const updatedMatch = normalizedText.match(/^Updated\s+(.+)$/i);
  if (updatedMatch) return `更新于 ${updatedMatch[1]}`;
  const agoMatch = normalizedText.match(/^(\d+)\s*(s|m|h|d|mo|y)\s+ago$/i);
  if (agoMatch) {
    const unitMap = { s: '秒', m: '分钟', h: '小时', d: '天', mo: '个月', y: '年' };
    return `${agoMatch[1]} ${unitMap[agoMatch[2].toLowerCase()] || agoMatch[2]}前`;
  }
  const closeTabMatch = normalizedText.match(/^Close\s+(.+)$/i);
  if (closeTabMatch && closeTabMatch[1].length > 3) {
    return `关闭 ${closeTabMatch[1]}`;
  }

  // 25. Dynamic Regex translation for "Your Plan: ..."
  const yourPlanMatch = normalizedText.match(/^Your\s+Plan:\s*(.+)$/i);
  if (yourPlanMatch) {
    return `您的计划：${yourPlanMatch[1]}`;
  }

  // 26. Dynamic Regex translation for "Resets in ..."
  const resetsInMatch = normalizedText.match(/^Resets\s+in\s+(.+)$/i);
  if (resetsInMatch) {
    let t = resetsInMatch[1].trim();
    if (t === '<1m') return '将在 1 分钟内重置';
    t = t.replace(/\s+/g, ' ')
         .replace(/(\d+)\s*d/g, '$1 天 ')
         .replace(/(\d+)\s*h/g, '$1 小时 ')
         .replace(/(\d+)\s*m/g, '$1 分钟')
         .replace(/\s+/g, ' ')
         .trim();
    return `将在 ${t} 后重置`;
  }

  // 27. Dynamic Regex translation for "Use <Voice>"
  const useVoiceMatch = normalizedText.match(/^Use\s+(Fola|Arlo|Cleo|Finn|Gero|Lora|Neno|Olin|Tari)$/i);
  if (useVoiceMatch) {
    return `使用 ${useVoiceMatch[1]}`;
  }

  // 28. Dynamic Regex translation for "N h/d/m limit"
  const nLimitMatch = normalizedText.match(/^(\d+)\s*(s|m|h|d)\s+limit$/i);
  if (nLimitMatch) {
    const unitMap = { s: '秒', m: '分钟', h: '小时', d: '天' };
    return `${nLimitMatch[1]} ${unitMap[nLimitMatch[2].toLowerCase()] || nLimitMatch[2]}限额`;
  }

  // 29. Dynamic Regex translation for Welcome greetings (Screenshot 1)
  const welcomeMatch = normalizedText.match(/^Welcome\s+back,\s*(.+?)\.\s*Where\s+should\s+we\s+pick\s+up\?$/i);
  if (welcomeMatch) {
    return `欢迎回来，${welcomeMatch[1]}。我们要从哪里继续？`;
  }
  const heyMatch = normalizedText.match(/^Hey\s+(.+?),\s*what\s+should\s+we\s+build\s+today\?$/i);
  if (heyMatch) {
    return `嗨 ${heyMatch[1]}，今天我们要做点什么？`;
  }
  const goodToSeeMatch = normalizedText.match(/^Good\s+to\s+see\s+you,\s*(.+?)\.\s*What's\s+next\?$/i);
  if (goodToSeeMatch) {
    return `很高兴见到你，${goodToSeeMatch[1]}。接下来做什么？`;
  }
  const existsMatch = normalizedText.match(/^A\s+(.+?)\s+with\s+this\s+name\s+already\s+exists\.$/i);
  if (existsMatch) {
    return `已存在同名的 ${existsMatch[1]}。`;
  }
  const editNameMatch = normalizedText.match(/^Edit\s+(.+?)\s+name$/i);
  if (editNameMatch) {
    return `编辑 ${editNameMatch[1]} 名称`;
  }
  const copyNameMatch = normalizedText.match(/^Copy\s+(.+?)\s+Name$/i);
  if (copyNameMatch) {
    const target = copyNameMatch[1].toLowerCase();
    const label = target === 'project' ? '项目' : target === 'workspace' ? '工作空间' : target === 'worktree' ? '工作树' : copyNameMatch[1];
    return `复制${label}名称`;
  }
  const sidebarItemMatch = normalizedText.match(/^Select\s+Sidebar\s+Item\s+(\d+)$/i);
  if (sidebarItemMatch) {
    return `选择侧边栏项目 ${sidebarItemMatch[1]}`;
  }

  // 32-38. 多文本节点空状态、缺失列表与主题对比度警告
  const emptyNounMap = {
    automation: '自动化任务', automations: '自动化任务',
    plugin: '插件', plugins: '插件',
    agent: '智能体', agents: '智能体',
    coordinator: '协调员', coordinators: '协调员',
    run: '运行记录', runs: '运行记录',
    event: '事件', events: '事件',
    host: '主机', hosts: '主机',
    skill: '技能', skills: '技能',
    rule: '规则', rules: '规则',
    hook: '钩子', hooks: '钩子',
    server: '服务器', servers: '服务器',
    workspace: '工作空间', workspaces: '工作空间',
    project: '项目', projects: '项目'
  };
  const noYetMatch = normalizedText.match(/^No\s+(automations?|plugins?|agents?|coordinators?|runs?|events?|hosts?|skills?|rules?|hooks?|servers?|workspaces?|projects?)\s+yet$/i);
  if (noYetMatch) {
    const noun = emptyNounMap[noYetMatch[1].toLowerCase()] || noYetMatch[1];
    return `暂无${noun}`;
  }
  const noMatchQuery = normalizedText.match(/^No\s+(automations?|plugins?|agents?|coordinators?|runs?|events?|hosts?|skills?|rules?|hooks?|servers?|workspaces?|projects?)\s+match\s+[“"](.+?)[”"]\.?$/i);
  if (noMatchQuery) {
    const noun = emptyNounMap[noMatchQuery[1].toLowerCase()] || noMatchQuery[1];
    return `没有匹配“${noMatchQuery[2]}”的${noun}。`;
  }
  const noMatching = normalizedText.match(/^No\s+matching\s+(.+)$/i);
  if (noMatching) {
    return `没有匹配的 ${noMatching[1]}`;
  }
  const noHandlers = normalizedText.match(/^No\s+handlers\s+configured\s+for\s+(.+?)\.?$/i);
  if (noHandlers) {
    return `尚未为 ${noHandlers[1]} 配置处理程序。`;
  }
  const noHosts = normalizedText.match(/^No\s+hosts\s+in\s+(.+?)\s+yet\.\s*Type\s+one\s+above\.?$/i);
  if (noHosts) {
    return `${noHosts[1]} 中尚无主机，请在上方输入添加。`;
  }
  const dupIdMatch = normalizedText.match(/^An\s+(automation|plugin|agent|sidecar)\s+with\s+the\s+ID\s+[“"](.+?)[”"]\s+already\s+exists\.?$/i);
  if (dupIdMatch) {
    const noun = emptyNounMap[dupIdMatch[1].toLowerCase()] || dupIdMatch[1];
    return `已存在 ID 为“${dupIdMatch[2]}”的${noun}。`;
  }
  const lowContrastMatch = normalizedText.match(/^Low\s+contrast\s+ratio\s+\(([\d.]+:1)\)\.\s*Text\s+may\s+be\s+hard\s+to\s+read\.?$/i);
  if (lowContrastMatch) {
    return `对比度较低（${lowContrastMatch[1]}），文本可能难以辨认。`;
  }

  return null;
}

// 截图中出现 + 设置页核心字符串（按节点拆分，与真实 DOM 文本节点一致）
const cases = [
  // 截图1：智能体设置
  'Controls the actions the agent can take.',
  'Modified in',
  '4 projects',
  ' projects',
  'Tool Permissions',
  'Modify permissions for file, terminal, and MCP tools.',
  'Whether the agent asks you to review its documents.',
  'Learn more about',
  'Configure the browser subagent. It requires',
  'to be installed.',
  'The browser subagent can be invoked by typing /browser in the conversation input box.',
  // 截图2：浏览器 JS 执行策略下拉
  'Request Review',
  'Block all browser JavaScript execution.',
  'Prompt for approval before running browser scripts.',
  'Allow full browser script execution without prompting.',
  'Disabled',
  'Always Proceed',
  'Always Ask',
  // 安全预设
  'Turbo mode',
  'Full machine',
  'Machine',
  'Turbo',
  'Disables all safety barriers for maximal iteration velocity.',
  // 其他新词条抽查
  'Untitled project',
  // ===== 2.23.0 截图（主界面）=====
  'New Conversation',
  'Conversation History',
  'Automations',
  'Customizations',
  'Settings',
  'Projects',
  'Ask anything, @ to mention, / for actions',
  'Local',
  'No conversations yet',
  // 命令执行模式下拉（截图中的五个模式及描述）
  'Request Review',
  'Every command requires approval.',
  'Default',
  'Ask before sensitive operations.',
  'Turbo',
  'Run all commands without restrictions.',
  'Automatically decide if commands run.',
  'Security agent decides if commands run.',
  // 2.23.0 新增 UI 标签抽查
  'MCP Servers',
  'See all',
  'More',
  'Preview',
  'Errors',
  'Conversation',
  'Fork',
  'Archive This Conversation',
  'Pin This Conversation',
  'Close tab',
  'New Tab',
  'Upload Files',
  'Telemetry',
  'Console logs',
  'Zoom in (+)',
  'Zoom out (-)',
  'Search for conversations...',
  'Search tabs, files, plugins, subagents, artifacts, tasks...',
  'Failed to start conversation',
  'New models have been enabled for you!',
  'Setup required',
  'Skills & Rules',
  'Modified Files',
  // ===== 2.28.2 新增核心词条与动态文本抽查 =====
  'Sidebar',
  'Customize Sections',
  'Cloud',
  'This Computer',
  'New Remote Project',
  'Delete All Remote Agents Data',
  'Add Shortcut',
  'Edit Shortcut',
  'Remove Shortcut',
  'Close Other Tabs',
  'Close Tabs to the Right',
  'Reopen Closed Tab',
  'Open Conversation in New Tab',
  'Open in External Browser',
  'Voice',
  'Voice engine',
  'Microphone',
  'Mute Live Chat Mic',
  'Start Live Chat',
  'Enable New Themes',
  'Google Sans',
  'Accounts',
  'Go to Accounts',
  'Unauthenticated',
  'Plugin update required',
  'Browse the Marketplace',
  'Cancel Generation',
  'Fork in New Workspace',
  'Fork in Shared Workspace',
  'Thought for 3s',
  'No more older messages, showing 115 of 115',
  'Select model, current: Gemini 3.8 Flash High',
  'Agent permissions preset selector, current: Turbo',
  'Show submitted (2)',
  'Ran',
  'Analyzed',
  'Created',
  'Checked task',
  'Killed task',
  'User message',
  'Agent response',
  'Scroll to Bottom',
  'Undo to this point',
  'Add context',
  'Pinned Actions',
  'Active Skills',
  'Connection is secure',
  'Your connection to this site is not secure',
  // ===== 2.29.0 新版界面改动抽查 =====
  'When',
  'Where',
  'What should it do?',
  'Where it runs',
  'On a schedule',
  'When something happens',
  'Every hour',
  'Every day',
  'Every week',
  'Every weekday',
  'Change schedule',
  'Change model',
  'Instructions and tools',
  'Connectors',
  'Search connectors',
  'Chat',
  'Chat Input',
  'Chat Width',
  'Enter to Send',
  'Screen Reader Mode',
  'Toggle Side Panel',
  'Toggle Maximize Side Panel',
  'Toggle sidebar',
  'Close Tabs to the Left',
  'Downloads',
  'Download Location',
  'Artifact Viewer header',
  'Artifact updated by agent',
  'Dismiss artifact update notice',
  'Mute Voice Mic',
  'Mute Voice Speaker',
  'Start Voice mode',
  'Save audio recordings',
  'Remote agents are busy',
  'Too many environments running',
  'Daily conversation limit reached',
  'Load older messages',
  'Load older messages, showing 5 of 43',
  'Conversation turns',
  'Turn 2 of 6',
  'Show 1 earlier step',
  'Hide earlier steps',
  'Updated 10月8日, 10:39',
  '5m ago',
  'Close Architecture Overview',
  // ===== 2.31.2 新版特性抽查 =====
  'Coordinators',
  'New Coordinator',
  'Coordinator settings',
  'Side Question',
  'Side Questions',
  'Browser downloads',
  'Link Settings',
  'Cookies and site data',
  'Select Download Folder',
  'Actual Size',
  'Chat Layout',
  'Interface Layout',
  'Toggle Word Wrap (Alt+Z)',
  'Find References',
  'Quote',
  'Comment',
  'Good Response',
  'Bad Response',
  'Google One Referral',
  // ===== 2.31.2 用户反馈未汉化部分专项测试 =====
  // 1. 界面布局 (Image 1)
  'Knowledge Work',
  'Simplified interface for research, writing, and everyday tasks.',
  'Software Engineering',
  'Full interface for coding, developer tools, and managing agents.',
  // 2. 语音模式 (Image 2)
  'Voice mode',
  'The voice used in Voice mode. Powered by Gemini Live.',
  'Not set',
  'Change',
  'Use Fola',
  // 3. 浏览器服务 (Image 3)
  'Built-in Browser',
  'External Browser',
  'Folder where files downloaded in the built-in browser are saved.',
  'Change...',
  'Browsing History',
  'Clear visited URLs and autocomplete suggestions from the built-in browser.',
  'Configure allowed and denied URLs for the browser subagent. It runs in the built-in browser, so no separate browser install is needed.',
  // 4. 会话管理与自定义配置 (Image 4)
  'Settings for conversations outside of projects.',
  'The breakdown below shows token usage from customizations like rules, skills, and MCP. If a budget is exceeded, large rules are demoted to path pointers and large customizations are excluded automatically.',
  'Other Customizations',
  'Show 1 breakdown',
  'Mcp Tools',
  // 5. 模型与用量 (Image 5)
  'Models & Usage',
  'Your Plan: Google AI Pro',
  'When toggled on, Antigravity will use your AI credits to fulfill model requests once you\'re out of model quota. Antigravity will always use your model quota first before using AI credits.',
  'Gemini Models',
  'Claude and GPT models',
  'Weekly Limit Remaining',
  'Five Hour Limit Remaining',
  'Resets in 3d 4h',
  'Resets in <1m',
  // ===== 2.32.1 新版特性抽查 =====
  'Toggle Word Wrap',
  'Open in Cider',
  'Jump to Previous Prompt',
  'Jump to Next Prompt',
  'Connect to SSH Host…',
  'Stop SSH Server…',
  'Switch to This Computer',
  'Submit Prompt (Alternate to Enter)',
  'Enter always submits. This adds a second shortcut.',
  'Open on another device',
  'Pick up this remote conversation on your phone or in any browser. Scan the QR code or open the link below.',
  'Discard comment draft',
  'Resume comment draft',
  'Pin / Unpin Conversation',
  'Back 5s (←)',
  'Forward 5s (→)',
  'Playback speed (< / >)',
  '1. Accessibility',
  '2. Screen Recording',
  'CitC Workspace',
  'SSH Host',
  'SSH Config',
  'Local Checkout',
  'Starting the conversation…',
  'Resolving link…',
  'Uploading to Google Drive…',
  'This site can’t be reached',
  'This page isn’t working',
  'MCP server error',
  'Failed to clone project locally',
  'Failed to unarchive local project',
  'Resume this agent where it paused',
  'Stop this agent',
  'Stopped',
  'Not signed in',
  'Organization MCP Allowlist (Read-Only)',
  // ===== 2.32.2 新版特性与缺陷修复抽查 =====
  'Welcome back, 徐小设. Where should we pick up?',
  'Hey 徐小设, what should we build today?',
  'Good to see you, 徐小设. What\'s next?',
  'Where should we pick up?',
  'Build a page from my Figma design',
  'Turn a screenshot into a web page',
  'Write a design brief from my research',
  'How loud Antigravity\'s voice is.',
  'How loud Jetski\'s voice is.',
  'Modify permissions for file and terminal tools.',
  'Modify permissions for file, terminal, and MCP tools.',
  'Manage project folders, agent settings, and permissions.',
  'This project is managed by the Swarm automation and can only be deleted by deleting that automation.',
  'A project with this name already exists.',
  'Edit project name',
  'Project',
  'Browser Use',
  // ===== 2.33.0 新版特性与侧边栏/置顶/快速搜索抽查 =====
  'Pin',
  'Unpin',
  'Pin Tab',
  'Unpin Tab',
  'Auto Pin',
  'Archived Only',
  'Sort Projects',
  'Sort Workspaces',
  'No pinned conversations',
  'Scheduled',
  'Subtitles',
  'Decorations',
  'Display Options',
  'Search or enter a URL',
  'Search tabs, files and more',
  'Search for content to open',
  'Clear Browsing Data?',
  'Keybinding Scheme',
  'Voice dictation unavailable',
  'Clear history, cookies and site data from the built-in browser, or manage cookies for each site.',
  // ===== 2.34.0 新版特性与通用设置/编排模型/右键复制抽查 =====
  'Copy Project Name',
  'Copy Workspace Name',
  'Permission preset',
  'Input Box',
  'Queued messages',
  'Choose which key sends a message in the chat composer.',
  'Tool permissions',
  'Network access rules',
  'Give Feedback',
  'Provide Feedback',
  'Orchestrator',
  'Orchestrator Settings',
  'Orchestrator Model',
  'Executor Model',
  'Customize Sidebar',
  'File access rules',
  'File reads',
  'File writes',
  'Terminal commands',
  'Terminal command auto execution',
  'Enable sandbox mode',
  'Enable terminal sandbox',
  'Commands outside sandbox',
  'Security preset',
  'Enter to send',
  'Select Sidebar Item 3',
  'Tell the agent what to do instead...',
  // ===== 2.35.1 新版特性、句子大小写回归与截图修复抽查 =====
  'Prevent sleep',
  'Keep in menu bar',
  'Notification settings',
  'Automatic check for updates',
  'No automations yet',
  "Run a prompt on a schedule, like a morning summary of yesterday's changes. Runs show up here.",
  'Enable notifications for agent',
  'Enable sounds for agent',
  'Strong',
  'Fill',
  'Font size',
  'Default Light',
  'Default Dark',
  'Background',
  'Foreground',
  'Conversation width',
  'Screen reader mode',
  'Conversation steps',
  'Custom context menus',
  'Terminal placement',
  'Bottom Panel',
  'Side Panel',
  'Markdown artifact width',
  'Context and quota indicator',
  'Code Preview',
  'New automation',
  'Create automation',
  'Execution Identity',
  'Personal agent running as you',
  'Shared agent for your team',
  'Plugin permissions',
  'Manage hooks',
  'Model selection',
  'Browser actuation rules',
  'Delete all Remote Agents data',
  'Clone from Remote',
  'Clone from This Computer',
  'Auto-Resolve',
  'Working Section',
  'Remote',
  'Auto',
  'No plugins yet',
  'No automations match “daily”.',
  'No matching environments',
  'No handlers configured for GitHub.',
  'No hosts in ~/.ssh/config yet. Type one above.',
  'An automation with the ID “morning” already exists.',
  'Low contrast ratio (2.1:1). Text may be hard to read.'
];

let hit = 0, miss = 0;
for (const c of cases) {
  const r = translateText(c);
  if (r === null) { miss++; console.log(`[未命中] ${JSON.stringify(c)}`); }
  else { hit++; console.log(`[OK] ${JSON.stringify(c)} -> ${JSON.stringify(r)}`); }
}
console.log(`\n命中 ${hit} / ${cases.length}，未命中 ${miss}`);

// 校验主题颜色标签修复（避免 "后台" / "前台" 误译）及零恒等词条约束
const colorAssertions = [
  ['Background', '背景色'],
  ['Foreground', '前景色']
];
let assertFailures = 0;
for (const [k, expected] of colorAssertions) {
  const actual = translateText(k);
  if (actual !== expected) {
    assertFailures++;
    console.log(`[断言失败] ${k} 期望 ${expected}，实际 ${actual}`);
  }
}
const identityEntries = Object.entries(dictionary).filter(([k, v]) => k === v);
if (identityEntries.length > 0) {
  assertFailures++;
  console.log(`[断言失败] 发现 ${identityEntries.length} 条恒等词条:`, identityEntries.map(([k]) => k));
}

// 确保不应被翻译的字符串不受影响
// （品牌名 / 型号名刻意保留英文：恒等词条已在 v2.32.2 清理，配合写入防护彻底杜绝同值写死循环）
const shouldNotTranslate = [
  'Antigravity',
  'Google Chrome',
  'Google Drive',
  'GitHub',
  'Cookie',
  'Gemini Flash Next',
  'Gemini 2.5 Flash Image',
  'Gemini 3 Pro Image',
  'Gemini 3.1 Flash Image',
  'New',
  '/browser',
  'main.js'
];
for (const c of shouldNotTranslate) {
  const r = translateText(c);
  if (r !== null) {
    assertFailures++;
    console.log(`[警告] 不应翻译却被翻译: ${c} -> ${r}`);
  }
}

if (miss > 0 || assertFailures > 0) {
  process.exitCode = 1;
}
