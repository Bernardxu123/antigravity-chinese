const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

function readPort() {
  const portFile = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'antigravity', 'DevToolsActivePort');
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
  const list = JSON.parse(await httpGet(port, '/json/list'));
  const page = list.find(t => t.type === 'page' && /antigravity/i.test(t.title || ''))
    || list.find(t => t.type === 'page' && (t.url || '').startsWith('https://127.0.0.1'))
    || list.find(t => t.type === 'page');

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

  const dict = require(path.join(__dirname, '..', 'dictionary.json'));
  
  const code = `
  (() => {
    const dictionary = ${JSON.stringify(dict)};
    const normalizedDict = {};
    for (const key in dictionary) {
      normalizedDict[key.replace(/\\s+/g, ' ').trim()] = dictionary[key];
    }

    const EXCLUDE_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
    const EXCLUDE_SELECTOR = '.monaco-editor, .cm-editor, [contenteditable]:not([contenteditable="false"])';

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
      if (normalizedDict[normalizedText]) return normalizedDict[normalizedText];

      let cleanText = normalizedText;
      if (normalizedText.endsWith('...')) cleanText = normalizedText.slice(0, -3).trim();
      else if (normalizedText.endsWith('…')) cleanText = normalizedText.slice(0, -1).trim();

      if (cleanText.length > 20) {
        for (const key in normalizedDict) {
          if (key.startsWith(cleanText)) return normalizedDict[key];
        }
      }

      const budgetMatch = normalizedText.match(/^([\\d.]+)%\\s+of\\s+the\\s+customization\\s+budget\\s+is\\s+available\\.$/i);
      if (budgetMatch) return \`可用自定义额度为 \${budgetMatch[1]}%。\`;
      const breakdownsMatch = normalizedText.match(/^Show\\s+(\\d+)\\s+breakdowns?$/i);
      if (breakdownsMatch) return \`查看 \${breakdownsMatch[1]} 项使用细分\`;
      const skillsMatch = normalizedText.match(/^Skills\\s*\\((\\d+)\\)$/i);
      if (skillsMatch) return \`已启用智能体技能 (\${skillsMatch[1]})\`;
      const skillsPctMatch = normalizedText.match(/^Skills\\s*\\(([\\d.]+)%\\)\\s*([\\d,]+)$/i);
      if (skillsPctMatch) return \`技能 (\${skillsPctMatch[1]}%) \${skillsPctMatch[2]} Token\`;
      const seeAllMatch = normalizedText.match(/^See\\s+all\\s+\\((\\d+)\\)$/i);
      if (seeAllMatch) return \`查看全部 (\${seeAllMatch[1]})\`;
      const learnMoreMatch = normalizedText.match(/^Learn\\s+more\\s+about\\s+(.+)$/i);
      if (learnMoreMatch) return \`了解更多关于 \${learnMoreMatch[1]}\`;
      const projectsMatch = normalizedText.match(/^(\\d+)\\s+projects?$/i);
      if (projectsMatch) return \`\${projectsMatch[1]} 个项目\`;
      const workedForMatch = normalizedText.match(/^Worked\\s+for\\s+(.+)$/i);
      if (workedForMatch) return \`工作时长 \${workedForMatch[1]}\`;
      const showMoreMatch = normalizedText.match(/^Show\\s+more\\s+\\((\\d+)\\)$/i);
      if (showMoreMatch) return \`显示更多（\${showMoreMatch[1]}）\`;
      const bestOfMatch = normalizedText.match(/^Start\\s+Best-of-(\\d+)$/i);
      if (bestOfMatch) return \`启动 Best-of-\${bestOfMatch[1]}\`;
      const availMatch = normalizedText.match(/^Available\\s+for\\s+(\\d+)\\s+projects?$/i);
      if (availMatch) return \`可用于 \${availMatch[1]} 个项目\`;
      const thoughtForMatch = normalizedText.match(/^Thought\\s+for\\s+(.+)$/i);
      if (thoughtForMatch) return \`思考时长 \${thoughtForMatch[1]}\`;
      const olderMsgsMatch = normalizedText.match(/^No\\s+more\\s+older\\s+messages,\s*showing\s+(\\d+)\\s+of\s+(\\d+)$/i);
      if (olderMsgsMatch) return \`没有更早的消息，显示第 \${olderMsgsMatch[1]} / \${olderMsgsMatch[2]} 条\`;
      const selectModelMatch = normalizedText.match(/^Select\\s+model,\s*current:\s*(.+)$/i);
      if (selectModelMatch) return \`选择模型，当前：\${selectModelMatch[1]}\`;
      const presetSelectorMatch = normalizedText.match(/^Agent\\s+permissions\s+preset\s+selector,\s*current:\s*(.+)$/i);
      if (presetSelectorMatch) return \`智能体权限预设选择器，当前：\${presetSelectorMatch[1]}\`;
      const showSubmittedMatch = normalizedText.match(/^Show\\s+submitted\\s+\\((\\d+)\\)$/i);
      if (showSubmittedMatch) return \`显示已提交（\${showSubmittedMatch[1]}）\`;
      const loadOlderMsgsMatch = normalizedText.match(/^Load\\s+older\\s+messages,\\s*showing\\s+(\\d+)\\s+of\\s+(\\d+)$/i);
      if (loadOlderMsgsMatch) return \`加载更早的消息，显示第 \${loadOlderMsgsMatch[1]} / \${loadOlderMsgsMatch[2]} 条\`;
      const turnMatch = normalizedText.match(/^Turn\\s+(\\d+)\\s+of\\s+(\\d+)$/i);
      if (turnMatch) return \`第 \${turnMatch[1]} / \${turnMatch[2]} 轮对话\`;
      const earlierStepsMatch = normalizedText.match(/^Show\\s+(\\d+)\\s+earlier\\s+steps?$/i);
      if (earlierStepsMatch) return \`显示前 \${earlierStepsMatch[1]} 个步骤\`;
      const updatedMatch = normalizedText.match(/^Updated\\s+(.+)$/i);
      if (updatedMatch) return \`更新于 \${updatedMatch[1]}\`;
      const agoMatch = normalizedText.match(/^(\\d+)\\s*(s|m|h|d|mo|y)\\s+ago$/i);
      if (agoMatch) {
        const unitMap = { s: '秒', m: '分钟', h: '小时', d: '天', mo: '个月', y: '年' };
        return \`\${agoMatch[1]} \${unitMap[agoMatch[2].toLowerCase()] || agoMatch[2]}前\`;
      }
      const closeTabMatch = normalizedText.match(/^Close\\s+(.+)$/i);
      if (closeTabMatch && closeTabMatch[1].length > 3) {
        return \`关闭 \${closeTabMatch[1]}\`;
      }

      // 25. Dynamic Regex translation for "Your Plan: ..."
      const yourPlanMatch = normalizedText.match(/^Your\\s+Plan:\\s*(.+)$/i);
      if (yourPlanMatch) {
        return \`您的计划：\${yourPlanMatch[1]}\`;
      }

      // 26. Dynamic Regex translation for "Resets in ..."
      const resetsInMatch = normalizedText.match(/^Resets\\s+in\\s+(.+)$/i);
      if (resetsInMatch) {
        let t = resetsInMatch[1].trim();
        if (t === '<1m') return '将在 1 分钟内重置';
        t = t.replace(/\\s+/g, ' ')
             .replace(/(\\d+)\\s*d/g, '$1 天 ')
             .replace(/(\\d+)\\s*h/g, '$1 小时 ')
             .replace(/(\\d+)\\s*m/g, '$1 分钟')
             .replace(/\\s+/g, ' ')
             .trim();
        return \`将在 \${t} 后重置\`;
      }

      // 27. Dynamic Regex translation for "Use <Voice>"
      const useVoiceMatch = normalizedText.match(/^Use\\s+(Fola|Arlo|Cleo|Finn|Gero|Lora|Neno|Olin|Tari)$/i);
      if (useVoiceMatch) {
        return \`使用 \${useVoiceMatch[1]}\`;
      }

      // 28. Dynamic Regex translation for "N h/d/m limit"
      const nLimitMatch = normalizedText.match(/^(\\d+)\\s*(s|m|h|d)\\s+limit$/i);
      if (nLimitMatch) {
        const unitMap = { s: '秒', m: '分钟', h: '小时', d: '天' };
        return \`\${nLimitMatch[1]} \${unitMap[nLimitMatch[2].toLowerCase()] || nLimitMatch[2]}限额\`;
      }

      return null;
    }

    function translateNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const translated = translateText(node.textContent);
        if (translated !== null) node.textContent = translated;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (isExcludedElement(node)) return;
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
          const ph = node.getAttribute('placeholder');
          const t = translateText(ph);
          if (t !== null) node.setAttribute('placeholder', t);
        }
        if (node.hasAttribute('title')) {
          const val = node.getAttribute('title');
          const t = translateText(val);
          if (t !== null) node.setAttribute('title', t);
        }
        if (node.hasAttribute('aria-label')) {
          const val = node.getAttribute('aria-label');
          const t = translateText(val);
          if (t !== null) node.setAttribute('aria-label', t);
        }
        if (node.tagName === 'INPUT' && (node.type === 'button' || node.type === 'submit')) {
          const val = node.value;
          const t = translateText(val);
          if (t !== null) node.value = t;
        }
        for (let child of node.childNodes) {
          translateNode(child);
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          for (let node of mutation.addedNodes) {
            if (!isInExcludedZone(node)) translateNode(node);
          }
        } else if (mutation.type === 'characterData') {
          if (!isInExcludedZone(mutation.target)) translateNode(mutation.target);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    translateNode(document.body);
    return 'LIVE_INJECTED_SUCCESS';
  })()
  `;

  const r = await send('Runtime.evaluate', { expression: code, returnByValue: true });
  console.log('Live injection result:', r.result.result.value);

  ws.close();
}

main().catch(console.error);
