const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Determine paths
const userHome = os.homedir();
const defaultInstallDir = path.join(userHome, 'AppData', 'Local', 'Programs', 'antigravity');
const installDir = process.env.ANTIGRAVITY_INSTALL_DIR || defaultInstallDir;
const resourcesDir = path.join(installDir, 'resources');
const appAsarPath = path.join(resourcesDir, 'app.asar');
const appAsarBakPath = path.join(resourcesDir, 'app.asar.bak');
const appAsarUnpackedDir = path.join(resourcesDir, 'app.asar.unpacked');

const tempRoot = path.join(__dirname, 'temp');
// 每次运行使用独立子目录（temp/run_<时间戳>）：
// 1. 上次运行被中断时，残留的 temp/app.asar 可能被进程占用（文件锁），导致本次运行失败；
// 2. 不同版本解包内容不会互相污染。
// 运行结束后尽力清理本次目录；历史 run_* 目录也会被尽力清理，失败不影响补丁本身。
const runId = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const tempDir = path.join(tempRoot, 'run_' + runId);
const extractedDir = path.join(tempDir, 'extracted');
const tempAsarPath = path.join(tempDir, 'app.asar');
const tempAsarUnpackedDir = path.join(tempDir, 'app.asar.unpacked');
const dictionaryPath = path.join(__dirname, 'dictionary.json');

// 尽力清理：失败（如文件被占用）只警告，不中断补丁流程
function cleanupFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return;
  try {
    fs.rmSync(folderPath, { recursive: true, force: true });
  } catch (err) {
    console.warn(`警告: 清理 ${folderPath} 失败（可能有文件被占用），可稍后手动删除。原因: ${err.message}`);
  }
}

// 清理历史运行目录（temp/run_* 及旧版遗留的 extracted/app.asar），失败静默跳过
function cleanupStaleRuns() {
  try {
    if (!fs.existsSync(tempRoot)) return;
    for (const name of fs.readdirSync(tempRoot)) {
      if (name === 'run_' + runId) continue;
      if (/^run_/.test(name) || name === 'extracted' || name === 'extracted_2230' || name === 'check_dist' || name === 'app.asar' || name === 'app.asar.unpacked') {
        try {
          fs.rmSync(path.join(tempRoot, name), { recursive: true, force: true });
        } catch (err) {
          // 单个目录清理失败不影响其他
        }
      }
    }
  } catch (err) {
    // 忽略
  }
}

// Revert function
function revert() {
  console.log('--- 正在执行恢复英文原版操作 ---');
  
  if (!fs.existsSync(appAsarBakPath)) {
    console.error('错误: 未找到备份文件 (app.asar.bak)，无法恢复。');
    process.exit(1);
  }

  // 1. 关闭 Antigravity
  killAntigravity();

  // 2. 还原备份
  try {
    fs.copyFileSync(appAsarBakPath, appAsarPath);
    console.log('成功: 已将备份还原为 app.asar');
  } catch (err) {
    console.error('错误: 还原文件失败:', err.message);
    process.exit(1);
  }

  // 3. 重启 Antigravity
  startAntigravity();
  console.log('--- 还原操作已完成！ ---');
}

// Close Antigravity.exe
function killAntigravity() {
  console.log('正在检查并关闭运行中的 Antigravity 进程...');
  try {
    // taskkill will exit with 128 if process not found, which is fine
    execSync('taskkill /F /IM Antigravity.exe', { stdio: 'ignore' });
    console.log('已关闭 Antigravity 进程。');
    // Wait a brief moment for locks to release
    execSync('powershell -Command "Start-Sleep -m 500"');
  } catch (err) {
    // Process might not be running, ignore
  }
}

// Start Antigravity.exe
function startAntigravity() {
  console.log('正在重新启动 Antigravity...');
  const appPath = path.join(installDir, 'Antigravity.exe');
  if (fs.existsSync(appPath)) {
    try {
      const { spawn } = require('child_process');
      // 优先用 explorer.exe 启动（与资源管理器双击行为一致，最稳定；
      // 某些环境下直接 spawn 的 GUI 子进程会被父进程的作业对象一起回收）。
      try {
        const explorer = spawn('explorer.exe', [appPath], { detached: true, stdio: 'ignore' });
        explorer.unref();
      } catch (e) {
        const child = spawn(appPath, [], { detached: true, stdio: 'ignore' });
        child.unref();
      }
      console.log('Antigravity 已在后台启动。');
    } catch (err) {
      console.error('启动 Antigravity 失败，请手动双击启动。', err.message);
    }
  } else {
    console.warn(`未找到可执行文件: ${appPath}，请手动启动。`);
  }
}

// 判断 asar 文件中是否包含汉化补丁标记（preload 注入代码）
const PATCH_MARKER = 'ANTIGRAVITY CHINESE LOCALIZATION PATCH';

function asarContainsMarker(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return buf.includes(PATCH_MARKER);
  } catch (err) {
    return false;
  }
}

function filesDiffer(a, b) {
  try {
    const sa = fs.statSync(a).size;
    const sb = fs.statSync(b).size;
    if (sa !== sb) return true;
    return !fs.readFileSync(a).equals(fs.readFileSync(b));
  } catch (err) {
    return true;
  }
}

// Patch function
async function patch(options = {}) {
  console.log('--- 开始进行 Antigravity 2.x 中文汉化 ---');
  
  if (!fs.existsSync(appAsarPath)) {
    console.error(`错误: 未能在路径找到 app.asar: ${appAsarPath}`);
    console.error('请确认 Antigravity 是否已正确安装，或通过环境变量 ANTIGRAVITY_INSTALL_DIR 指定安装目录。');
    process.exit(1);
  }

  // 1. 加载 asar 依赖
  let asar;
  try {
    asar = require('@electron/asar');
  } catch (err) {
    console.error('错误: 未能加载 @electron/asar 模块，请先运行 "npm install"。');
    process.exit(1);
  }

  // 2. 加载汉化词典
  if (!fs.existsSync(dictionaryPath)) {
    console.error(`错误: 未找到词典文件: ${dictionaryPath}`);
    process.exit(1);
  }
  const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  console.log(`已成功加载词典，共包含 ${Object.keys(dictionary).length} 个词条。`);

  // 3. 关闭运行中的进程（如指定 --no-kill 则跳过）
  if (!options.noKill) {
    killAntigravity();
  } else {
    console.log('检测到 --no-kill 选项，跳过终止 Antigravity 进程。');
  }

  // 4. 创建备份（关键：Antigravity 升级后 app.asar 会被官方覆盖为未打补丁的新版本，
  //    此时必须刷新备份，否则 --revert 会把旧版本还原回去）
  if (!fs.existsSync(appAsarBakPath)) {
    console.log('正在创建原始 app.asar 的备份...');
    try {
      fs.copyFileSync(appAsarPath, appAsarBakPath);
      console.log(`备份已成功保存到: ${appAsarBakPath}`);
    } catch (err) {
      console.error('创建备份失败，请检查写入权限:', err.message);
      process.exit(1);
    }
  } else if (!asarContainsMarker(appAsarPath)) {
    // 当前 app.asar 不含补丁标记 = 官方原版（新安装或已升级）
    if (filesDiffer(appAsarPath, appAsarBakPath)) {
      console.log('检测到 Antigravity 已更新（当前 app.asar 为未打补丁的新版本），正在刷新备份...');
      try {
        fs.copyFileSync(appAsarPath, appAsarBakPath);
        console.log('备份已刷新为新版本的原始 app.asar。');
      } catch (err) {
        console.error('刷新备份失败，请检查写入权限:', err.message);
        process.exit(1);
      }
    } else {
      console.log('备份与当前 app.asar 一致，跳过备份。');
    }
  } else {
    console.log('当前 app.asar 已包含汉化补丁，保留原有备份，跳过备份。');
  }

  // 5. 准备临时工作区（独立子目录 + 尽力清理历史残留）
  console.log('正在准备临时工作区...');
  cleanupStaleRuns();
  fs.mkdirSync(tempDir, { recursive: true });

  // 6. 复制 app.asar 和 app.asar.unpacked 到临时工作区
  try {
    fs.copyFileSync(appAsarPath, tempAsarPath);
    if (fs.existsSync(appAsarUnpackedDir)) {
      // Copy unpacked directory
      console.log('检测到 app.asar.unpacked，正在同步复制...');
      copyFolderSync(appAsarUnpackedDir, tempAsarUnpackedDir);
    }
  } catch (err) {
    console.error('复制代码到临时区失败:', err.message);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 7. 解包 app.asar
  console.log('正在解包 app.asar...');
  try {
    asar.extractAll(tempAsarPath, extractedDir);
    console.log('解包成功。');
  } catch (err) {
    console.error('解包失败:', err.message);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 8. 注入汉化代码
  console.log('正在注入汉化补丁...');

  // A. 注入 preload.js
  const preloadPath = path.join(extractedDir, 'dist', 'preload.js');
  if (fs.existsSync(preloadPath)) {
    console.log('正在注入 preload.js...');
    const injectCode = buildInjectScript(dictionary);
    // 先剥离之前注入的汉化代码块，避免重复打补丁时不断堆积
    let preloadContent = fs.readFileSync(preloadPath, 'utf8');
    const injectBlockRe = /\/\/ ==================== ANTIGRAVITY CHINESE LOCALIZATION PATCH ====================[\s\S]*?\/\/ ==================== END OF ANTIGRAVITY CHINESE LOCALIZATION PATCH ====================/g;
    const stripped = preloadContent.replace(injectBlockRe, '');
    if (stripped !== preloadContent) {
      preloadContent = stripped;
      console.log('检测到旧版汉化注入代码，已先移除（防止重复堆积）。');
    }
    fs.writeFileSync(preloadPath, preloadContent.replace(/\s+$/, '\n'), 'utf8');
    fs.appendFileSync(preloadPath, '\n\n' + injectCode);
  } else {
    console.warn('警告: 未找到 dist/preload.js');
  }

  // B. 修改 main.js 中的弹窗和托盘
  const mainPath = path.join(extractedDir, 'dist', 'main.js');
  if (fs.existsSync(mainPath)) {
    console.log('正在汉化 main.js (弹窗与托盘默认项)...');
    let mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Replace quit confirmation strings with regex to match varying whitespace/formatting
    mainContent = mainContent.replace(/buttons:\s*\[\s*'Cancel'\s*,\s*'Quit'\s*\]/g, "buttons: ['取消', '退出']");
    mainContent = mainContent.replace(/title:\s*'Confirm Quit'/g, "title: '确认退出'");
    mainContent = mainContent.replace(/message:\s*'Are you sure you want to quit\?'/g, "message: '您确定要退出吗？'");
    mainContent = mainContent.replace(/detail:\s*'There may be agents or background tasks running\.'/g, "detail: '可能还有智能体或后台任务正在运行。'");
    
    // Replace default tray options
    mainContent = mainContent.replace(/label:\s*'No agents running'/g, "label: '没有运行中的智能体'");
    mainContent = mainContent.replace(/label:\s*`Open \${electron_1\.app\.getName\(\)}`/g, "label: `打开 ${electron_1.app.getName()}`");
    mainContent = mainContent.replace(/label:\s*'Quit'/g, "label: '退出'");

    // Replace WSL-related dialogs (2.23.0 新增)
    mainContent = mainContent.replace(/title:\s*'WSL distro not found'/g, "title: '未找到 WSL 发行版'");
    mainContent = mainContent.replace(/message:\s*`The WSL distro "\$\{WSL_DISTRO\}" is no longer installed\.`/g, 'message: `WSL 发行版“${WSL_DISTRO}”已不再安装。`');
    mainContent = mainContent.replace(/detail:\s*'Antigravity opened on Windows instead\.'/g, "detail: 'Antigravity 已在 Windows 中打开。'");

    // Replace error box titles
    mainContent = mainContent.replace(/showErrorBox\('Binary not found'/g, "showErrorBox('未找到二进制文件'");
    mainContent = mainContent.replace(/showErrorBox\('WSL setup failed'/g, "showErrorBox('WSL 设置失败'");
    mainContent = mainContent.replace(/showErrorBox\('Startup failed'/g, "showErrorBox('启动失败'");
    
    fs.writeFileSync(mainPath, mainContent, 'utf8');
  }

  // C. 修改 menu.js 中的窗口菜单 + Electron 原生角色菜单汉化
  const menuPath = path.join(extractedDir, 'dist', 'menu.js');
  if (fs.existsSync(menuPath)) {
    console.log('正在汉化 menu.js (应用窗口菜单)...');
    let menuContent = fs.readFileSync(menuPath, 'utf8');
    menuContent = menuContent.replace(/label:\s*'New Window'/g, "label: '新建窗口'");
    menuContent = menuContent.replace(/label:\s*'Docs'/g, "label: '文档'");
    // WSL 菜单项（2.23.0 新增，经 new MenuItem 直接构建，不走 buildFromTemplate）
    menuContent = menuContent.replace(/label:\s*'Connect to WSL'/g, "label: '连接到 WSL'");
    menuContent = menuContent.replace(/label:\s*'Reopen Locally'/g, "label: '重新在本地打开'");
    // 缩放菜单项（2.31.2 新增）
    menuContent = menuContent.replace(/label:\s*item\.label\s*\|\|\s*'Actual Size'/g, "label: item.label || '实际大小'");
    fs.writeFileSync(menuPath, menuContent, 'utf8');
  }
  // C2. 注入 Electron 原生菜单角色中文化（文件/编辑/视图/窗口等 + Reset Zoom/Zoom In/Out）
  // 需在 main.js 的 BrowserWindow 创建后拦截 Menu.buildFromTemplate / setApplicationMenu，或直接覆写 utils.js 的 hideDevTools 之后注入翻译
  // 采用在 main.js 末尾追加一个菜单翻译补丁的方式：劫持 Electron.Menu.buildFromTemplate
  const menuPatchTarget = path.join(extractedDir, 'dist', 'utils.js');
  // 备用：若 utils.js 存在，尝试注入菜单翻译钩子
  if (fs.existsSync(path.join(extractedDir, 'dist', 'main.js'))) {
    const mainPatchPath = path.join(extractedDir, 'dist', 'main.js');
    let mainPatchContent = fs.readFileSync(mainPatchPath, 'utf8');
    if (!mainPatchContent.includes('ANTIGRAVITY_MENU_I18N_PATCH')) {
      const menuI18nInject = `
/* ANTIGRAVITY_MENU_I18N_PATCH */
try {
  const _electron = require('electron');
  const _roleLabelMap = {
    'undo': '撤销', 'redo': '重做', 'cut': '剪切', 'copy': '复制', 'paste': '粘贴',
    'pasteAndMatchStyle': '粘贴并匹配样式', 'delete': '删除', 'selectAll': '全选',
    'reload': '重新加载', 'forceReload': '强制重新加载', 'toggleDevTools': '切换开发者工具',
    'resetZoom': '重置缩放', 'zoomIn': '放大', 'zoomOut': '缩小',
    'togglefullscreen': '切换全屏', 'window': '窗口', 'minimize': '最小化', 'close': '关闭',
    'help': '帮助', 'about': '关于', 'services': '服务', 'hide': '隐藏', 'hideOthers': '隐藏其他',
    'unhide': '显示全部', 'quit': '退出', 'fileMenu': '文件', 'editMenu': '编辑', 'viewMenu': '视图'
  };
  const _labelMap = {
    'Bring All to Front': '前置全部窗口',
    'New Window': '新建窗口', 'Docs': '文档', 'Check for Updates': '检查更新',
    'Checking for Updates...': '正在检查更新...', 'Downloading Update...': '正在下载更新...', 'Restart to Update': '重启以完成更新',
    'Connect to WSL': '连接到 WSL', 'Reopen Locally': '重新在本地打开', 'Actual Size': '实际大小'
  };
  function _translateMenuItem(item) {
    if (!item) return;
    if (item.role) {
      const key = String(item.role).toLowerCase();
      if (_roleLabelMap[key]) item.label = _roleLabelMap[key];
    }
    if (item.label && _labelMap[item.label]) item.label = _labelMap[item.label];
    // Electron 原生菜单中 Zoom 相关无固定 role 时 label 为 Reset Zoom 等
    if (item.label === 'Reset Zoom') item.label = '重置缩放';
    if (item.label === 'Zoom In') item.label = '放大';
    if (item.label === 'Zoom Out') item.label = '缩小';
    if (item.submenu && item.submenu.items) {
      for (const sub of item.submenu.items) _translateMenuItem(sub);
    } else if (Array.isArray(item.submenu)) {
      for (const sub of item.submenu) _translateMenuItem(sub);
    }
  }
  function _translateMenu(menu) {
    if (!menu || !menu.items) return;
    for (const item of menu.items) _translateMenuItem(item);
  }
  const _origBuildFromTemplate = _electron.Menu.buildFromTemplate;
  _electron.Menu.buildFromTemplate = function(template) {
    // 先翻译 template 中的 role/label
    function translateTemplate(items) {
      if (!Array.isArray(items)) return;
      for (const it of items) {
        if (it.role) {
          const k = String(it.role).toLowerCase();
          if (_roleLabelMap[k] && !it.label) it.label = _roleLabelMap[k];
          if (it.role === 'resetZoom' || it.role === 'resetzoom') it.label = '重置缩放';
          if (it.role === 'zoomIn' || it.role === 'zoomin') it.label = '放大';
          if (it.role === 'zoomOut' || it.role === 'zoomout') it.label = '缩小';
        }
        if (it.label && _labelMap[it.label]) it.label = _labelMap[it.label];
        if (it.label === 'Reset Zoom') it.label = '重置缩放';
        if (it.label === 'Zoom In') it.label = '放大';
        if (it.label === 'Zoom Out') it.label = '缩小';
        if (it.submenu) translateTemplate(Array.isArray(it.submenu) ? it.submenu : (it.submenu.items || []));
      }
    }
    translateTemplate(template);
    const menu = _origBuildFromTemplate.call(this, template);
    _translateMenu(menu);
    return menu;
  };
  const _origSetAppMenu = _electron.Menu.setApplicationMenu;
  _electron.Menu.setApplicationMenu = function(menu) {
    if (menu) _translateMenu(menu);
    return _origSetAppMenu.call(this, menu);
  };
} catch(e) { console.error('[i18n-menu] patch failed', e && e.message); }
`;
      mainPatchContent += '\n' + menuI18nInject;
      fs.writeFileSync(mainPatchPath, mainPatchContent, 'utf8');
      console.log('已注入 Electron 原生菜单中文化补丁 (Reset Zoom 等)');
    }
  }

  // D. 修改 tray.js 中的托盘动态状态
  const trayPath = path.join(extractedDir, 'dist', 'tray.js');
  if (fs.existsSync(trayPath)) {
    console.log('正在汉化 tray.js (系统托盘动态状态)...');
    let trayContent = fs.readFileSync(trayPath, 'utf8');
    
    // Use regex to robustly match dynamic string concat regardless of indentation and newlines
    const trayRegex = /\(count\s*>\s*0\s*\?\s*`\$\{count\}`\s*:\s*'No'\)\s*\+\s*' agent'\s*\+\s*\(count\s*===\s*1\s*\?\s*''\s*:\s*'s'\)\s*\+\s*' running'/g;
    trayContent = trayContent.replace(trayRegex, "(count > 0 ? `${count} 个智能体正在运行` : '没有运行中的智能体')");
    
    fs.writeFileSync(trayPath, trayContent, 'utf8');
  }

  
  // E. 修改 updater.js 中的更新菜单与弹窗 (2.11 新增完整汉化)
  const updaterPath = path.join(extractedDir, 'dist', 'updater.js');
  if (fs.existsSync(updaterPath)) {
    console.log('正在汉化 updater.js (更新菜单与弹窗)...');
    let updaterContent = fs.readFileSync(updaterPath, 'utf8');
    // MenuUpdateStep 四态
    updaterContent = updaterContent.replace(/MenuUpdateStep\["CheckForUpdates"\]\s*=\s*"Check for Updates"/g, 'MenuUpdateStep["CheckForUpdates"] = "检查更新"');
    updaterContent = updaterContent.replace(/MenuUpdateStep\["CheckingForUpdates"\]\s*=\s*"Checking for Updates\.\.\."/g, 'MenuUpdateStep["CheckingForUpdates"] = "正在检查更新..."');
    updaterContent = updaterContent.replace(/MenuUpdateStep\["DownloadingUpdate"\]\s*=\s*"Downloading Update\.\.\."/g, 'MenuUpdateStep["DownloadingUpdate"] = "正在下载更新..."');
    updaterContent = updaterContent.replace(/MenuUpdateStep\["RestartToUpdate"\]\s*=\s*"Restart to Update"/g, 'MenuUpdateStep["RestartToUpdate"] = "重启以完成更新"');
    // 弹窗 title/message/buttons
    updaterContent = updaterContent.replace(/title:\s*'Check for Updates'/g, "title: '检查更新'");
    updaterContent = updaterContent.replace(/message:\s*'No updates available'/g, "message: '暂无可用更新'");
    updaterContent = updaterContent.replace(/buttons:\s*\[\s*'OK'\s*\]/g, "buttons: ['确定']");
    fs.writeFileSync(updaterPath, updaterContent, 'utf8');
  }

  // F. 修改 provisionSplash.js 中的 WSL 设置提示（2.23.0 新增）
  const splashPath = path.join(extractedDir, 'dist', 'provisionSplash.js');
  if (fs.existsSync(splashPath)) {
    console.log('正在汉化 provisionSplash.js (WSL 设置提示)...');
    let splashContent = fs.readFileSync(splashPath, 'utf8');
    splashContent = splashContent.replace(/Setting up WSL: \$\{escapeHtml\(distro\)\}/g, '正在设置 WSL：${escapeHtml(distro)}');
    fs.writeFileSync(splashPath, splashContent, 'utf8');
  }

  // G. 修改 ipcHandlers.js 中的文件对话框标题
  const ipcPath = path.join(extractedDir, 'dist', 'ipcHandlers.js');
  if (fs.existsSync(ipcPath)) {
    console.log('正在汉化 ipcHandlers.js (文件对话框)...');
    let ipcContent = fs.readFileSync(ipcPath, 'utf8');
    ipcContent = ipcContent.replace(/title:\s*'Open workspace'/g, "title: '打开工作空间'");
    ipcContent = ipcContent.replace(/title:\s*'Open workspaces'/g, "title: '打开工作空间'");
    // 2.23.0 新增：WSL 路径相关对话框
    ipcContent = ipcContent.replace(/showErrorBox\('Cannot open folder'/g, "showErrorBox('无法打开文件夹'");
    ipcContent = ipcContent.replace(/message:\s*'Folder is on the Windows filesystem'/g, "message: '文件夹位于 Windows 文件系统中'");
    // 2.31.2 新增：下载目录选择对话框
    ipcContent = ipcContent.replace(/title:\s*'Select Download Folder'/g, "title: '选择下载文件夹'");
    fs.writeFileSync(ipcPath, ipcContent, 'utf8');
  }

  // 9. 重新打包 app.asar
  console.log('正在重新打包 app.asar...');
  try {
    // Delete the old asar in temp so we pack into a clean target
    fs.unlinkSync(tempAsarPath);
    await asar.createPackage(extractedDir, tempAsarPath);
    console.log('打包成功。');
  } catch (err) {
    console.error('打包失败:', err.message);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 10. 覆盖回原安装目录
  console.log('正在应用修改后的 app.asar...');
  try {
    fs.copyFileSync(tempAsarPath, appAsarPath);
    console.log('汉化程序已成功替换！');
  } catch (err) {
    console.error('覆盖 app.asar 失败，请确认程序已完全退出且拥有写入权限:', err.message);
    console.log(`您可以手动复制此文件到目标目录: ${tempAsarPath} -> ${appAsarPath}`);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 11. 清理临时目录
  console.log('正在清理临时文件...');
  cleanupFolder(tempDir);

  // 12. 重新启动（如指定 --no-kill 则跳过）
  if (!options.noKill) {
    startAntigravity();
  } else {
    console.log('检测到 --no-kill 选项，跳过重启 Antigravity。已应用到 app.asar。');
  }
  
  console.log('--- 汉化补丁应用成功！享受中文界面吧！ ---');
}

// Copy directory helper
function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

// Generate the script to inject into preload.js
function buildInjectScript(dict) {
  return `
// ==================== ANTIGRAVITY CHINESE LOCALIZATION PATCH ====================
(function() {
  const dictionary = ${JSON.stringify(dict, null, 2)};

  // Pre-normalize dictionary keys for whitespace robustness
  const normalizedDict = {};
  for (const key in dictionary) {
    normalizedDict[key.replace(/\\s+/g, ' ').trim()] = dictionary[key];
  }

  // Regions whose text content must never be translated (user code, editable input).
  const EXCLUDE_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
  const EXCLUDE_SELECTOR = '.monaco-editor, .cm-editor, [contenteditable]:not([contenteditable="false"])';

  // Debug log file helper
  function logDebug(msg) {
    try {
      const fs = require('fs');
      const logPath = require('os').homedir() + '/.gemini/antigravity/scratch/preload_debug.log';
      fs.appendFileSync(logPath, \`[\${new Date().toISOString()}] \${msg}\\n\`);
    } catch (e) {
      // Ignore log write errors
    }
  }

  logDebug('Preload script executed in window: ' + window.location.href);

  function isExcludedElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (EXCLUDE_TAGS.has(el.tagName)) return true;
    return typeof el.matches === 'function' && el.matches(EXCLUDE_SELECTOR);
  }

  function isInExcludedZone(node) {
    let el = node && node.nodeType === Node.ELEMENT_NODE ? node : (node ? node.parentElement : null);
    while (el) {
      if (isExcludedElement(el)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function translateText(text) {
    if (!text) return null;
    const normalizedText = text.replace(/\\s+/g, ' ').trim();
    if (!normalizedText) return null;
    
    // 1. Exact match in normalized dictionary
    if (normalizedDict[normalizedText]) {
      return normalizedDict[normalizedText];
    }
    
    // 2. Handle trailing ellipsis (...) or truncated text for long descriptions
    let cleanText = normalizedText;
    if (normalizedText.endsWith('...')) {
      cleanText = normalizedText.slice(0, -3).trim();
    } else if (normalizedText.endsWith('…')) {
      cleanText = normalizedText.slice(0, -1).trim();
    }
    
    if (cleanText.length > 20) {
      for (const key in normalizedDict) {
        if (key.startsWith(cleanText)) {
          return normalizedDict[key];
        }
      }
    }

    // 3. Dynamic Regex translation for Token Usage percentage
    const budgetMatch = normalizedText.match(/^([\\d.]+)%\\s+of\\s+the\\s+customization\\s+budget\\s+is\\s+available\\.$/i);
    if (budgetMatch) {
      return \`可用自定义额度为 \${budgetMatch[1]}%。\`;
    }
    
    // 4. Dynamic Regex translation for breakdowns link
    const breakdownsMatch = normalizedText.match(/^Show\\s+(\\d+)\\s+breakdowns$/i);
    if (breakdownsMatch) {
      return \`查看 \${breakdownsMatch[1]} 项使用细分\`;
    }
    
    // 5. Dynamic Regex translation for Skills counts
    const skillsMatch = normalizedText.match(/^Skills\\s*\\((\\d+)\\)$/i);
    if (skillsMatch) {
      return \`已启用智能体技能 (\${skillsMatch[1]})\`;
    }

    // 6. Dynamic Regex translation for Skills percent/tokens
    const skillsPctMatch = normalizedText.match(/^Skills\\s*\\(([\\d.]+)%\\)\\s*([\\d,]+)$/i);
    if (skillsPctMatch) {
      return \`技能 (\${skillsPctMatch[1]}%) \${skillsPctMatch[2]} Token\`;
    }

    // 7. Dynamic Regex translation for "See all (14)"
    const seeAllMatch = normalizedText.match(/^See\\s+all\\s+\\((\\d+)\\)$/i);
    if (seeAllMatch) {
      return \`查看全部 (\${seeAllMatch[1]})\`;
    }

    // 8. Dynamic Regex translation for "Learn more about xxx"
    const learnMoreMatch = normalizedText.match(/^Learn\\s+more\\s+about\\s+(.+)$/i);
    if (learnMoreMatch) {
      return \`了解更多关于 \${learnMoreMatch[1]}\`;
    }

    // 9. Dynamic Regex translation for "N project(s)"（"Modified in 4 projects" 的计数节点）
    const projectsMatch = normalizedText.match(/^(\\d+)\\s+projects?$/i);
    if (projectsMatch) {
      return \`\${projectsMatch[1]} 个项目\`;
    }

    // 10. Dynamic Regex translation for "Worked for 5m 23s"（任务耗时）
    const workedForMatch = normalizedText.match(/^Worked\\s+for\\s+(.+)$/i);
    if (workedForMatch) {
      return \`工作时长 \${workedForMatch[1]}\`;
    }

    // 11. Dynamic Regex translation for "Show more (N)"
    const showMoreMatch = normalizedText.match(/^Show\\s+more\\s+\\((\\d+)\\)$/i);
    if (showMoreMatch) {
      return \`显示更多（\${showMoreMatch[1]}）\`;
    }

    // 12. Dynamic Regex translation for "Start Best-of-N"
    const bestOfMatch = normalizedText.match(/^Start\\s+Best-of-(\\d+)$/i);
    if (bestOfMatch) {
      return \`启动 Best-of-\${bestOfMatch[1]}\`;
    }

    // 13. Dynamic Regex translation for "Available for N project(s)"
    const availMatch = normalizedText.match(/^Available\\s+for\\s+(\\d+)\\s+projects?$/i);
    if (availMatch) {
      return \`可用于 \${availMatch[1]} 个项目\`;
    }

    // 14. Dynamic Regex translation for "Thought for 3s"（模型深度思考耗时）
    const thoughtForMatch = normalizedText.match(/^Thought\\s+for\\s+(.+)$/i);
    if (thoughtForMatch) {
      return \`思考时长 \${thoughtForMatch[1]}\`;
    }

    // 15. Dynamic Regex translation for "No more older messages, showing 115 of 115"
    const olderMsgsMatch = normalizedText.match(/^No\\s+more\\s+older\s+messages,\s*showing\s+(\\d+)\s+of\s+(\\d+)$/i);
    if (olderMsgsMatch) {
      return \`没有更早的消息，显示第 \${olderMsgsMatch[1]} / \${olderMsgsMatch[2]} 条\`;
    }

    // 16. Dynamic Regex translation for "Select model, current: ..."
    const selectModelMatch = normalizedText.match(/^Select\\s+model,\s*current:\s*(.+)$/i);
    if (selectModelMatch) {
      return \`选择模型，当前：\${selectModelMatch[1]}\`;
    }

    // 17. Dynamic Regex translation for "Agent permissions preset selector, current: ..."
    const presetSelectorMatch = normalizedText.match(/^Agent\\s+permissions\\s+preset\\s+selector,\s*current:\s*(.+)$/i);
    if (presetSelectorMatch) {
      return \`智能体权限预设选择器，当前：\${presetSelectorMatch[1]}\`;
    }

    // 18. Dynamic Regex translation for "Show submitted (N)"
    const showSubmittedMatch = normalizedText.match(/^Show\\s+submitted\\s+\\((\\d+)\\)$/i);
    if (showSubmittedMatch) {
      return \`显示已提交（\${showSubmittedMatch[1]}）\`;
    }

    // 19. Dynamic Regex translation for "Load older messages, showing N of M"
    const loadOlderMsgsMatch = normalizedText.match(/^Load\\s+older\\s+messages,\\s*showing\\s+(\\d+)\\s+of\\s+(\\d+)$/i);
    if (loadOlderMsgsMatch) {
      return \`加载更早的消息，显示第 \${loadOlderMsgsMatch[1]} / \${loadOlderMsgsMatch[2]} 条\`;
    }

    // 20. Dynamic Regex translation for "Turn N of M"（对话轮次）
    const turnMatch = normalizedText.match(/^Turn\\s+(\\d+)\\s+of\\s+(\\d+)$/i);
    if (turnMatch) {
      return \`第 \${turnMatch[1]} / \${turnMatch[2]} 轮对话\`;
    }

    // 21. Dynamic Regex translation for "Show N earlier step(s)"
    const earlierStepsMatch = normalizedText.match(/^Show\\s+(\\d+)\\s+earlier\\s+steps?$/i);
    if (earlierStepsMatch) {
      return \`显示前 \${earlierStepsMatch[1]} 个步骤\`;
    }

    // 22. Dynamic Regex translation for "Updated <Date/Time>"
    const updatedMatch = normalizedText.match(/^Updated\\s+(.+)$/i);
    if (updatedMatch) {
      return \`更新于 \${updatedMatch[1]}\`;
    }

    // 23. Dynamic Regex translation for relative time (e.g. "5m ago", "2h ago")
    const agoMatch = normalizedText.match(/^(\\d+)\\s*(s|m|h|d|mo|y)\\s+ago$/i);
    if (agoMatch) {
      const unitMap = { s: '秒', m: '分钟', h: '小时', d: '天', mo: '个月', y: '年' };
      return \`\${agoMatch[1]} \${unitMap[agoMatch[2].toLowerCase()] || agoMatch[2]}前\`;
    }

    // 24. Dynamic Regex translation for tab close tooltip: "Close <Tab Title>"
    const closeTabMatch = normalizedText.match(/^Close\\s+(.+)$/i);
    if (closeTabMatch && closeTabMatch[1].length > 3) {
      return \`关闭 \${closeTabMatch[1]}\`;
    }

    return null;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const translated = translateText(node.textContent);
      if (translated !== null) {
        node.textContent = translated;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Never descend into code editors / editable regions (avoid corrupting user code).
      if (isExcludedElement(node)) {
        return;
      }
      // Input placeholders
      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        const placeholder = node.getAttribute('placeholder');
        const translated = translateText(placeholder);
        if (translated !== null) {
          node.setAttribute('placeholder', translated);
        }
      }
      // Tooltips and titles
      if (node.hasAttribute('title')) {
        const title = node.getAttribute('title');
        const translated = translateText(title);
        if (translated !== null) {
          node.setAttribute('title', translated);
        }
      }
      // ARIA labels (commonly used by icon-only buttons)
      if (node.hasAttribute('aria-label')) {
        const ariaLabel = node.getAttribute('aria-label');
        const translated = translateText(ariaLabel);
        if (translated !== null) {
          node.setAttribute('aria-label', translated);
        }
      }
      // Translate buttons/inputs with values
      if (node.tagName === 'INPUT' && (node.type === 'button' || node.type === 'submit')) {
        const val = node.value;
        const translated = translateText(val);
        if (translated !== null) {
          node.value = translated;
        }
      }
      // Check children
      for (let child of node.childNodes) {
        translateNode(child);
      }
    }
  }

  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          for (let node of mutation.addedNodes) {
            if (!isInExcludedZone(node)) {
              translateNode(node);
            }
          }
        } else if (mutation.type === 'characterData') {
          if (!isInExcludedZone(mutation.target)) {
            translateNode(mutation.target);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Initial translation
    translateNode(document.body);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDOM);
  } else {
    observeDOM();
  }

  // Translate document title
  const originalTitle = document.title;
  const translatedTitle = translateText(originalTitle);
  if (translatedTitle !== null) {
    document.title = translatedTitle;
  }
  
  // Observe title changes
  const titleObserver = new MutationObserver(() => {
    const title = document.title;
    const translated = translateText(title);
    if (translated !== null && title !== translated) {
      document.title = translated;
    }
  });
  
  const titleEl = document.querySelector('title');
  if (titleEl) {
    titleObserver.observe(titleEl, { childList: true, characterData: true });
  }
})();
// ==================== END OF ANTIGRAVITY CHINESE LOCALIZATION PATCH ====================
`;
}

// Run Main
const args = process.argv.slice(2);
if (args.includes('--revert')) {
  revert();
} else {
  patch({ noKill: args.includes('--no-kill') });
}
