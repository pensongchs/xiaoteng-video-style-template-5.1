// 禁止在令牌文件之外手写新颜色。已出现的颜色按 color-allowlist.json 冻结。
// 用法：
//   node scripts/check-colors.mjs
//   node scripts/check-colors.mjs --write-allowlist   （仅维护者在用户批准改风格后重签）
import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {SUB} from '../src/style/subtitle-tokens.ts';
import {HILITE, PALETTES} from '../src/style/tokens.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const lockPath = join(root, 'scripts/color-allowlist.json');
const TOKEN_FILES = new Set(['src/style/tokens.ts', 'src/style/subtitle-tokens.ts']);
const STRICT = new Set(['src/cards51/SmallCards.tsx', 'src/cards51/views.tsx', 'src/style/subtitles.tsx']);
const HEX = /#(?:[0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;
const RGBA = /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/g;
const FORBIDDEN = [
  '#F3D79E', '#F1D39D', '#F4EEE4', '#FFDF51', '#F1C932', '#F7D544', '#FFE77A',
  '#EBD282', '#C4A15A', '#E6C48A', '#C9A227', '#B48A4E', '#6B4C26', '#816846', '#EBD5A9',
  '#F5E6C8', '#D4A017', '#C9A36B', '#E8D5B5', '#F7F1E6', '#FFF8F0',
];
const FORBIDDEN_RGB = [
  'rgba(255,248,240', 'rgba(247,241,230', 'rgba(243,215,158', 'rgba(201,162,39',
];

const norm = (c) => c.replace(/\s+/g, '').toLowerCase();
const forbiddenSet = new Set(FORBIDDEN.map((c) => c.toLowerCase()));

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'out') continue;
      walk(p, acc);
    } else if (['.ts', '.tsx', '.css'].includes(extname(name))) acc.push(p);
  }
  return acc;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function colorsIn(src) {
  const t = stripComments(src);
  return [...new Set([...(t.match(HEX) || []), ...(t.match(RGBA) || [])])];
}

function collect() {
  const files = {};
  for (const abs of walk(join(root, 'src'))) {
    const rel = relative(root, abs).replaceAll('\\', '/');
    const found = colorsIn(readFileSync(abs, 'utf8'));
    if (found.length) files[rel] = found.sort();
  }
  return files;
}

const write = process.argv.includes('--write-allowlist');
const current = collect();
if (write) {
  writeFileSync(lockPath, JSON.stringify({
    revision: '5.1-2026-11-17',
    note: '令牌文件之外的现存颜色冻结。新增颜色必须改用 tokens.ts / CSS 变量，不得手写。禁止把暖金、暖白、土黄、棕粉填回正片卡片和字幕。',
    files: current,
  }, null, 2) + '\n');
  console.log('已重写 color-allowlist.json');
  process.exit(0);
}

const errs = [];
// 锁定出片令牌
if (SUB.size !== 40 || SUB.color !== '#F5F8FC' || SUB.hi !== '#9CC4FF' || SUB.dim !== 0.86 || SUB.bottom !== 44) {
  errs.push(`字幕令牌偏离 5.1 v2：size=${SUB.size} color=${SUB.color} hi=${SUB.hi} dim=${SUB.dim} bottom=${SUB.bottom}`);
}
if (!String(SUB.pill).includes('rgba(20,30,50,0.68)') || !String(SUB.pill).includes('rgba(12,20,36,0.74)')) {
  errs.push('字幕胶囊必须是墨蓝半透明渐变 rgba(20,30,50,0.68)→rgba(12,20,36,0.74)');
}
if (HILITE.dark !== '#BCD6FF' || HILITE.bright !== '#1F56C4') {
  errs.push(`标题强调必须是冰蓝 HILITE ${HILITE.dark}/${HILITE.bright}，不得改回金色`);
}
if (!PALETTES.inkBlue) errs.push('缺少默认色板 inkBlue');

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
for (const [file, found] of Object.entries(current)) {
  const allowed = new Set((lock.files[file] || []).map(norm));
  for (const c of found) {
    const n = norm(c);
    const isForbidden = forbiddenSet.has(n) || FORBIDDEN_RGB.some((p) => n.startsWith(norm(p)));
    if (TOKEN_FILES.has(file)) {
      // SUB_V50 允许保留 5.0 对照色；主 SUB / 色板不得是禁用色（由上面的精确断言保证）
      continue;
    }
    if (STRICT.has(file) && isForbidden) {
      errs.push(`${file} 使用了禁用色 ${c}（正片小卡/字幕禁止暖金、暖白、土黄、棕粉）`);
      continue;
    }
    if (!allowed.has(n)) {
      errs.push(`${file} 出现未登记颜色 ${c}。请改用 tokens.ts 的 CSS 变量或语义色，禁止手写 CSS 颜色。`);
    }
  }
  if (STRICT.has(file)) {
    for (const c of found) {
      if (forbiddenSet.has(norm(c)) || FORBIDDEN_RGB.some((p) => norm(c).startsWith(norm(p)))) {
        // already pushed
      }
    }
  }
}

// 文件被删颜色没关系；新文件必须零手写色，或先经过用户批准并更新 allowlist
for (const file of Object.keys(current)) {
  if (!lock.files[file] && !TOKEN_FILES.has(file) && current[file].length) {
    const news = current[file].filter((c) => !(lock.files[file] || []).map(norm).includes(norm(c)));
    if (!lock.files[file]) errs.push(`${file} 是新文件且含手写颜色 ${current[file].join(', ')}。共用风格文件必须走令牌，不能手写色值。`);
  }
}

if (errs.length) {
  console.error('✗ 颜色约束未通过：\n' + errs.join('\n'));
  process.exit(1);
}
console.log('✓ 颜色约束通过：出片令牌锁定，令牌外颜色无新增，小卡/字幕无禁用色');
