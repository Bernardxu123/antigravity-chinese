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
  const breakdownsMatch = normalizedText.match(/^Show\s+(\d+)\s+breakdowns$/i);
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
  'Google Chrome',
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
  'Antigravity',
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
  'Close Architecture Overview'
];

let hit = 0, miss = 0;
for (const c of cases) {
  const r = translateText(c);
  if (r === null) { miss++; console.log(`[未命中] ${JSON.stringify(c)}`); }
  else { hit++; console.log(`[OK] ${JSON.stringify(c)} -> ${JSON.stringify(r)}`); }
}
console.log(`\n命中 ${hit} / ${cases.length}，未命中 ${miss}`);

// 确保不应被翻译的字符串不受影响
const shouldNotTranslate = ['Antigravity', 'Google Chrome', '/browser', 'main.js'];
for (const c of shouldNotTranslate) {
  const r = translateText(c);
  if (r !== null) console.log(`[警告] 不应翻译却被翻译: ${c} -> ${r}`);
}
