/**
 * 将 tools/entries_*.json 中的新词条合并进 dictionary.json。
 * 已存在的键会被跳过（以 dictionary.json 为准），合并后按 UTF-8 写回。
 *
 * 用法：node tools/merge_entries.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dictPath = path.join(ROOT, 'dictionary.json');
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const files = fs.readdirSync(__dirname).filter(f => /^entries_.*\.json$/.test(f)).sort();
let added = 0, skipped = 0, total = 0;

for (const f of files) {
  const entries = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
  for (const [en, zh] of Object.entries(entries)) {
    total++;
    if (Object.prototype.hasOwnProperty.call(dict, en)) { skipped++; continue; }
    if (!zh || !zh.trim()) { console.warn(`[跳过-译文为空] ${f}: ${en}`); continue; }
    dict[en] = zh;
    added++;
  }
}

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + '\n', 'utf8');
console.log(`处理 ${files.length} 个词条文件，共 ${total} 条：新增 ${added} 条，已存在跳过 ${skipped} 条。`);
console.log(`dictionary.json 现有词条总数：${Object.keys(dict).length}`);
