/**
 * 主进程汉化校验工具（版本升级后使用）
 *
 * 功能一：校验 patch.js 中对主进程 dist 文件的正则替换是否仍能命中当前已安装版本的代码。
 *         Antigravity 升级后官方代码写法可能变化，导致替换静默失效（界面退回英文），
 *         应用补丁前应先跑本工具确认。
 * 功能二：扫描主进程各 dist 文件，列出词典与补丁均未覆盖的"疑似用户可见英文文案"，
 *         供人工判断是否需要补充。
 *
 * 用法：
 *   node tools/check_main_process.js            # 自动从已安装的 app.asar 解包检查
 *   node tools/check_main_process.js <dist目录> # 直接检查已解包的 dist 目录
 *
 * 退出码：0 = 全部模式命中；1 = 存在未命中模式或无法定位 app.asar。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const dict = require(path.join(ROOT, 'dictionary.json'));

// 与 patch.js 中各替换保持同步的模式清单（[文件, 正则, 说明]）
const PATTERNS = [
  ['main.js', /buttons:\s*\[\s*'Cancel'\s*,\s*'Quit'\s*\]/g, '退出确认按钮'],
  ['main.js', /title:\s*'Confirm Quit'/g, '退出确认标题'],
  ['main.js', /message:\s*'Are you sure you want to quit\?'/g, '退出确认消息'],
  ['main.js', /detail:\s*'There may be agents or background tasks running\.'/g, '退出确认详情'],
  ['main.js', /label:\s*'No agents running'/g, '托盘-无智能体'],
  ['main.js', /label:\s*`Open \$\{electron_1\.app\.getName\(\)\}`/g, '托盘-打开'],
  ['main.js', /label:\s*'Quit'/g, '托盘-退出'],
  ['main.js', /title:\s*'WSL distro not found'/g, 'WSL 发行版未找到'],
  ['main.js', /message:\s*`The WSL distro "\$\{WSL_DISTRO\}" is no longer installed\.`/g, 'WSL 发行版已卸载'],
  ['main.js', /detail:\s*'Antigravity opened on Windows instead\.'/g, 'WSL 回退提示'],
  ['main.js', /showErrorBox\('Binary not found'/g, '二进制未找到'],
  ['main.js', /showErrorBox\('WSL setup failed'/g, 'WSL 设置失败'],
  ['main.js', /showErrorBox\('Startup failed'/g, '启动失败'],
  ['menu.js', /label:\s*'New Window'/g, '菜单-新建窗口'],
  ['menu.js', /label:\s*'Docs'/g, '菜单-文档'],
  ['menu.js', /label:\s*'Connect to WSL'/g, '菜单-连接到 WSL'],
  ['menu.js', /label:\s*'Reopen Locally'/g, '菜单-重新在本地打开'],
  ['tray.js', /\(count\s*>\s*0\s*\?\s*`\$\{count\}`\s*:\s*'No'\)\s*\+\s*' agent'\s*\+\s*\(count\s*===\s*1\s*\?\s*''\s*:\s*'s'\)\s*\+\s*' running'/g, '托盘-智能体计数'],
  ['updater.js', /MenuUpdateStep\["CheckForUpdates"\]\s*=\s*"Check for Updates"/g, '更新-检查更新'],
  ['updater.js', /MenuUpdateStep\["CheckingForUpdates"\]\s*=\s*"Checking for Updates\.\.\."/g, '更新-正在检查'],
  ['updater.js', /MenuUpdateStep\["DownloadingUpdate"\]\s*=\s*"Downloading Update\.\.\."/g, '更新-正在下载'],
  ['updater.js', /MenuUpdateStep\["RestartToUpdate"\]\s*=\s*"Restart to Update"/g, '更新-重启完成'],
  ['updater.js', /title:\s*'Check for Updates'/g, '更新弹窗标题'],
  ['updater.js', /message:\s*'No updates available'/g, '更新弹窗消息'],
  ['updater.js', /buttons:\s*\[\s*'OK'\s*\]/g, '更新弹窗按钮'],
  ['ipcHandlers.js', /title:\s*'Open workspace'/g, '对话框-打开工作空间'],
  ['ipcHandlers.js', /title:\s*'Open workspaces'/g, '对话框-打开工作空间(复数)'],
  ['ipcHandlers.js', /showErrorBox\('Cannot open folder'/g, '对话框-无法打开文件夹'],
  ['ipcHandlers.js', /message:\s*'Folder is on the Windows filesystem'/g, '对话框-文件夹在 Windows'],
  ['provisionSplash.js', /Setting up WSL: \$\{escapeHtml\(distro\)\}/g, 'WSL 设置进度'],
];

// 主进程中对用户可见的文件（用于文案扫描）
const SCAN_FILES = ['main.js', 'menu.js', 'tray.js', 'updater.js', 'ipcHandlers.js', 'utils.js', 'loadingOverlay.js', 'provisionSplash.js', 'keybindings.js'];

function isUiText(t) {
  if (!t || t.length < 3 || t.length > 200) return false;
  if (!/[a-z]/.test(t)) return false;
  if (/\n|\r/.test(t)) return false;
  if (/[a-z][A-Z]/.test(t)) return false;            // camelCase
  if (/[_{}<>=;:|*#$\\]/.test(t)) return false;       // 代码/CSS
  if (/\.(js|ts|json|css|html|md|pb|exe|sh|bat|png|svg|map|log)$/i.test(t)) return false;
  if (/^(https?:|\/|\.{1,2}\/|~\/)/.test(t)) return false; // URL/路径
  if (/^[a-z0-9_.-]+$/.test(t)) return false;         // 标识符
  const words = t.split(/\s+/);
  return words.length >= 2 && words.every(w => /^[A-Za-z0-9'(),.:!?%&/-]+$/.test(w));
}

function checkPatterns(dist) {
  let pass = 0, fail = 0;
  console.log('===== 一、patch.js 替换模式命中检查 =====');
  for (const [f, re, desc] of PATTERNS) {
    const p = path.join(dist, f);
    if (!fs.existsSync(p)) {
      fail++;
      console.log(`[文件缺失] ${f}  (${desc})`);
      continue;
    }
    const c = fs.readFileSync(p, 'utf8');
    if (re.test(c)) { pass++; console.log(`[命中] ${f}  ${desc}`); }
    else { fail++; console.log(`[未命中] ${f}  ${desc}  <- 需检查新版代码写法并更新 patch.js`); }
  }
  console.log(`\n共 ${PATTERNS.length} 条模式：命中 ${pass}，未命中 ${fail}`);
  return fail;
}

function scanStrings(dist) {
  console.log('\n===== 二、主进程未覆盖的用户可见文案扫描 =====');
  const found = new Map();
  for (const f of SCAN_FILES) {
    const p = path.join(dist, f);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const re = /"((?:[^"\\\n]|\\.){2,200})"|'((?:[^'\\\n]|\\.){2,200})'/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const raw = (m[1] !== undefined ? m[1] : m[2]).replace(/\\'/g, "'").replace(/\\"/g, '"');
      if (isUiText(raw) && dict[raw] === undefined) {
        if (!found.has(raw)) found.set(raw, new Set());
        found.get(raw).add(f);
      }
    }
  }
  const sorted = [...found.keys()].sort();
  console.log(`可疑文案 ${sorted.length} 条（含 patch.js 已覆盖的，需人工筛选）：\n`);
  for (const t of sorted) console.log(JSON.stringify(t) + '   <- ' + [...found.get(t)].join(','));
}

function main() {
  const argDist = process.argv[2];
  let dist = argDist;
  if (!dist) {
    // 自动从已安装的 app.asar 解包（若当前已汉化则优先使用原始备份 app.asar.bak）
    const installDir = process.env.ANTIGRAVITY_INSTALL_DIR || path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'antigravity');
    const asarPath = path.join(installDir, 'resources', 'app.asar');
    const asarBakPath = path.join(installDir, 'resources', 'app.asar.bak');
    if (!fs.existsSync(asarPath)) {
      console.error(`未找到 app.asar: ${asarPath}`);
      console.error('请确认 Antigravity 已安装，或设置 ANTIGRAVITY_INSTALL_DIR，或直接传入已解包的 dist 目录。');
      process.exit(1);
    }
    let targetAsar = asarPath;
    if (fs.existsSync(asarBakPath)) {
      try {
        const buf = fs.readFileSync(asarPath);
        if (buf.includes('ANTIGRAVITY CHINESE LOCALIZATION PATCH')) {
          console.log('检测到当前 app.asar 已包含汉化补丁，自动改用官方备份 app.asar.bak 进行模式命中校验...');
          targetAsar = asarBakPath;
        }
      } catch (e) {}
    }
    const extractDir = path.join(ROOT, 'temp', 'check_dist');
    const extractDist = path.join(extractDir, 'dist');
    console.log(`正在从 ${targetAsar} 提取主进程文件 -> ${extractDist} ...`);
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDist, { recursive: true });
    const asar = require('@electron/asar');
    for (const f of SCAN_FILES) {
      try {
        const content = asar.extractFile(targetAsar, 'dist/' + f);
        fs.writeFileSync(path.join(extractDist, f), content);
      } catch (e) {
        // 部分可选文件在某些版本中可能不存在
      }
    }
    console.log('提取完成。\n');
    dist = extractDist;
  }
  const fail = checkPatterns(dist);
  scanStrings(dist);
  process.exit(fail > 0 ? 1 : 0);
}

main();
