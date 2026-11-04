/**
 * Antigravity 汉化 - UI 字符串提取工具
 *
 * 用途：Antigravity 更新版本后，从其前端 bundle 中提取尚未翻译的英文 UI 字符串，
 *       生成候选清单供补充 dictionary.json。
 *
 * 用法：
 *   1. 启动 Antigravity（确保界面已加载）。
 *   2. node tools/fetch_ui_strings.js [端口]
 *      省略端口时自动查找：先读 %APPDATA%/antigravity/DevToolsActivePort 并探测验证
 *      （注意：2.23.0 起该文件记录的是 Electron CDP 调试端口，不一定是 UI 端口），
 *      验证失败则扫描 127.0.0.1 上的监听端口，找到返回 Antigravity UI HTML 的服务。
 *
 * 输出（写入 tools/out/ 目录）：
 *   - report.json    按 label/description/title/placeholder 分类、过滤掉已翻译词条后的候选
 *   - raw.txt        全部"疑似 UI 文案"的原始候选（人工筛查用）
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const dict = require(path.join(ROOT, 'dictionary.json'));
const dictKeys = new Set(Object.keys(dict));

function fetchPath(port, p, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = https.get({ host: '127.0.0.1', port, path: p, rejectAuthorized: false, rejectUnauthorized: false, agent: false }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve(data));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

// 探测某端口返回的页面是否为语言服务器的 UI（带 __APP_CONFIG__ 或 <script src="/..."> 的 HTML）
function isUiHtml(html) {
  return !!html && (html.includes('__APP_CONFIG__') || /src="\/[^"]+\.js"/.test(html));
}

// 扫描 127.0.0.1 上的监听端口，找到提供 Antigravity UI 的那个
async function scanUiPort() {
  let out = '';
  try {
    out = execSync('netstat -ano', { encoding: 'utf8' });
  } catch (e) {
    console.error('netstat 执行失败:', e.message);
    return null;
  }
  const ports = new Set();
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/TCP\s+127\.0\.0\.1:(\d+)\s+\S+\s+LISTENING/i);
    if (m) ports.add(Number(m[1]));
  }
  console.log(`扫描到 ${ports.size} 个本机监听端口，逐个探测 UI 服务...`);
  for (const port of ports) {
    try {
      const html = await fetchPath(port, '/', 2000);
      if (isUiHtml(html)) {
        console.log(`找到 UI 服务端口: ${port}`);
        return port;
      }
    } catch (e) {
      // 连接失败 / 非 HTTPS / 非 UI 服务，继续下一个
    }
  }
  return null;
}

// 确定 UI 端口：显式参数 > DevToolsActivePort（需探测验证）> 本机端口扫描
async function resolveUiPort() {
  const argPort = process.argv[2];
  if (argPort) return Number(argPort);
  const portFile = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'antigravity', 'DevToolsActivePort');
  if (fs.existsSync(portFile)) {
    const first = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0].trim();
    const n = Number(first);
    if (n > 0) {
      try {
        const html = await fetchPath(n, '/', 2000);
        if (isUiHtml(html)) return n;
        console.log(`DevToolsActivePort 中的端口 ${n} 不是 UI 服务端口（2.23.0 起为 Electron CDP 调试端口），改为扫描本机监听端口...`);
      } catch (e) {
        console.log(`DevToolsActivePort 中的端口 ${n} 无法连接，改为扫描本机监听端口...`);
      }
    }
  }
  const found = await scanUiPort();
  if (found) return found;
  console.error('未找到提供 UI 的端口，请确认 Antigravity 正在运行且界面已加载，或手动传入端口参数。');
  process.exit(1);
}

// 通用 UI 文案启发式判断
function isUiText(t) {
  if (!t || t.length < 2) return false;
  if (!/[a-z]/.test(t)) return false;           // 必须含小写字母（排除常量/缩写）
  if (/\\n|\n/.test(t)) return false;
  if (/[a-z][A-Z]/.test(t)) return false;       // 排除 camelCase
  if (/[_{}<>=;:|*#$\\]/.test(t)) return false; // 排除代码/CSS
  if (/\.(js|ts|json|css|html|md|pb|exe|sh|bat|png|svg|map)$/i.test(t)) return false;
  return true;
}

function isWorthAdding(t) {
  if (dictKeys.has(t)) return false;
  if (!isUiText(t)) return false;
  return true;
}

// 从字符串字面量集合中提取
function extractLiterals(src) {
  const set = new Set();
  const re = /"((?:[^"\\]|\\.){2,400})"|'((?:[^'\\]|\\.){2,400})'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const raw = m[1] !== undefined ? m[1] : m[2];
    set.add(raw.replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  return set;
}

// 属性值提取（label/description/title/placeholder）
function extractProps(src, prop) {
  const set = new Set();
  const re = new RegExp(prop + ':"((?:[^"\\\\]|\\\\.){1,400})"', 'g');
  let m;
  while ((m = re.exec(src)) !== null) set.add(m[1].replace(/\\"/g, '"'));
  return set;
}

async function main() {
  const port = await resolveUiPort();
  console.log('语言服务器端口:', port);

  const index = await fetchPath(port, '/');
  const bundleMatch = index.match(/src="\/([^"]+\.js)"/g) || [];
  const files = bundleMatch.map(s => s.match(/\/(.+)/)[1].replace(/"$/, ''));
  console.log('发现 bundle:', files.join(', '));

  fs.mkdirSync(OUT, { recursive: true });

  let src = '';
  for (const f of files) {
    const js = await fetchPath(port, '/' + f);
    fs.writeFileSync(path.join(OUT, f), js);
    src += '\n' + js;
    console.log(`  ${f}: ${(js.length / 1024 / 1024).toFixed(1)} MB`);
  }

  const report = {};
  for (const prop of ['label', 'description', 'title', 'placeholder', 'subtitle', 'displayName', 'shortDescription', 'longDescription']) {
    report[prop] = [...extractProps(src, prop)].filter(isWorthAdding).sort();
  }

  // 全量候选（人工筛查）
  const literals = [...extractLiterals(src)];
  const raw = literals.filter(t => {
    if (dictKeys.has(t)) return false;
    if (!isUiText(t)) return false;
    const words = t.replace(/[^A-Za-z' ]/g, ' ').trim().split(/\s+/).filter(Boolean);
    return words.length >= 2;
  });
  fs.writeFileSync(path.join(OUT, 'raw.txt'), raw.sort().join('\n'));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  console.log('---- 候选统计 ----');
  for (const k of Object.keys(report)) console.log(`${k}: ${report[k].length}`);
  console.log('raw: ' + raw.length);
  console.log('已写入 tools/out/（report.json 为按属性分类的候选，raw.txt 为全量候选）');
}

main().catch(e => { console.error(e); process.exit(1); });
