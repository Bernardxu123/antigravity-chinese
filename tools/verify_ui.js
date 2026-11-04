/**
 * 端到端验证：通过 Electron CDP 连接运行中的 Antigravity 窗口，
 * 读取实际渲染的 DOM 文本，确认汉化是否生效（无需截图，无需人工确认）。
 *
 * 用法：node tools/verify_ui.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

function readPort() {
  const portFile = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'antigravity', 'DevToolsActivePort');
  if (!fs.existsSync(portFile)) { console.error('未找到 DevToolsActivePort，Antigravity 可能未运行'); process.exit(1); }
  return Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0].trim());
}

function httpGet(port, p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: p }, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function main() {
  const port = readPort();
  console.log('CDP 端口:', port);
  const list = JSON.parse(await httpGet(port, '/json/list'));
  // 找标题为 Antigravity 的页面目标
  const page = list.find(t => t.type === 'page' && /antigravity/i.test(t.title || ''))
    || list.find(t => t.type === 'page' && (t.url || '').startsWith('https://127.0.0.1'))
    || list.find(t => t.type === 'page');
  if (!page) { console.error('未找到页面目标:', JSON.stringify(list.map(t => ({ type: t.type, title: t.title })), null, 2)); process.exit(1); }
  console.log('目标页面:', page.title, '|', page.url.slice(0, 60));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  const expr = `(() => {
    const text = document.body ? document.body.innerText : '';
    const zh = (text.match(/[\\u4e00-\\u9fff]/g) || []).length;
    const en = (text.match(/[a-zA-Z]/g) || []).length;
    return JSON.stringify({ length: text.length, zhChars: zh, enChars: en, sample: text.slice(0, 600) });
  })()`;
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  const result = JSON.parse(r.result.result.value);

  console.log('\n===== 渲染 DOM 文本分析 =====');
  console.log('文本总长度:', result.length, '| 中文字符数:', result.zhChars, '| 英文字符数:', result.enChars);
  console.log('\n===== 界面文本样例（前 600 字符）=====');
  console.log(result.sample);

  // 关键文案检查
  const checks = ['新建会话', '会话历史记录', '自动化任务', '设置', '项目', '输入任意内容'];
  const missing = checks.filter(c => !result.sample.includes(c));
  console.log('\n===== 关键文案检查 =====');
  console.log(checks.map(c => `${result.sample.includes(c) ? '[OK]' : '[未出现]'} ${c}`).join('\n'));
  if (missing.length) console.log('（部分文案未在当前视图出现属正常，可在对应界面查看）');
  ws.close();
}

main().catch(e => { console.error('验证失败:', e.message); process.exit(1); });
