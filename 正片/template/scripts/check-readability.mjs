// 5.1.1 可读性与字阶检查（静态部分；DOM 部分在 src/style/domcheck.tsx，随 verify --dom 运行）：
//  1) 卡面/正文文字不得用近黑色（相对亮度 < NEAR_BLACK_L）；色调表必须全是深底浅字
//  2) 小卡组合（views.tsx / SmallCards.tsx）不得手写数字字号，只能取 tokens.ts 的 CARD_TYPE 字阶
//  3) 图表字阶（CHART_TYPE）不低于下限；图表必须放在 data-viz 面板里
//  4) 小卡字阶表本身要自洽（S<M<L，标签/说明 ≥28）
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CARD_TYPE, CHART_TYPE, FOG, NEAR_BLACK_L} from '../src/style/tokens.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const errs = [];
export const lum = (c) => {
  const hex = c.match(/^#([0-9a-f]{3,8})$/i);
  let r, g, b;
  if (hex) { let h = hex[1]; if (h.length < 6) h = [...h.slice(0, 3)].map((x) => x + x).join(''); [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  else { const v = c.match(/rgba?\(([^)]*)\)/)[1].split(',').map(Number); [r, g, b] = v; }
  const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
const walk = (dir, acc = []) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n); const st = statSync(p);
    if (st.isDirectory()) { if (n !== 'node_modules' && n !== 'out') walk(p, acc); } else if (['.ts', '.tsx'].includes(extname(n))) acc.push(p);
  }
  return acc;
};
/** 近黑文字色扫描：只看 color 属性（不含 background / border / textShadow / stopColor）。 */
export const nearBlackTextFaults = (src, label) => {
  const out = []; const t = strip(src);
  // 取 color: 之后到下一个属性/换行/} 之前的整段表达式，里面的每个颜色字面量都要过亮度（含三元表达式里的）
  for (const m of t.matchAll(/(?:^|[^\w-])color\s*[:=]\s*\{?([^\n}]*?)(?=,\s*[A-Za-z]+\s*:|[;}]|\n|$)/g)) {
    const seg = m[1];
    for (const c of seg.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)) {
      if (lum(c[0]) < NEAR_BLACK_L) out.push(`${label}:${t.slice(0, m.index).split('\n').length} 近黑文字色 ${c[0]}（相对亮度 ${lum(c[0]).toFixed(2)} < ${NEAR_BLACK_L}）：卡面文字一律用 #F5F8FC / 色调高亮`);
    }
  }
  for (const m of t.matchAll(/(?:^|[^\w-])color\s*:\s*\{?\s*COLOR\.(ink|graphite)\b/g)) out.push(`${label}:${t.slice(0, m.index).split('\n').length} 文字色用了 COLOR.${m[1]}（近黑令牌，只能当背景）`);
  return out;
};
/** 小卡文件里的手写数字字号。 */
export const rawFontSizeFaults = (src, label) => {
  const out = []; const t = strip(src);
  for (const m of t.matchAll(/fontSize\s*:\s*(\d+(?:\.\d+)?)\b(?!\s*[*+\-/])/g)) out.push(`${label}:${t.slice(0, m.index).split('\n').length} 手写字号 ${m[1]}px：小卡内只能用 CARD_TYPE 字阶（title/value/label/caption）`);
  return out;
};

const SCOPES = ['src/style', 'src/cards51', 'src/gallery', 'src/demo'];
for (const sc of SCOPES) for (const abs of walk(join(root, sc))) {
  const rel = relative(root, abs).replaceAll('\\', '/');
  if (rel === 'src/style/tokens.ts') continue;
  nearBlackTextFaults(readFileSync(abs, 'utf8'), rel).forEach((e) => errs.push(e));
}
for (const f of ['src/cards51/views.tsx', 'src/cards51/SmallCards.tsx']) rawFontSizeFaults(readFileSync(join(root, f), 'utf8'), f).forEach((e) => errs.push(e));

// 色调表：深底浅字
for (const [tone, t] of Object.entries(FOG)) {
  if (t.light) errs.push(`色调 ${tone} 是浅底（light=true）：5.1.1 起全部深底浅字`);
  if (lum(t.inkHex) < 0.6) errs.push(`色调 ${tone} 的文字色 ${t.inkHex} 太暗（相对亮度 < 0.6）`);
}
// 字阶表
{
  const keys = ['title', 'value', 'label', 'caption'];
  for (const s of ['S', 'M', 'L']) {
    if (CARD_TYPE[s].label < 28 || CARD_TYPE[s].caption < 28) errs.push(`${s} 卡标签/说明 < 28px`);
    if (CARD_TYPE[s].title < 36) errs.push(`${s} 卡标题 < 36px`);
  }
  for (const k of keys) if (!(CARD_TYPE.S[k] <= CARD_TYPE.M[k] && CARD_TYPE.M[k] <= CARD_TYPE.L[k])) errs.push(`字阶 ${k} 不满足 S ≤ M ≤ L`);
  if (CHART_TYPE.label < 36 || CHART_TYPE.unit < 30 || CHART_TYPE.tick < 28 || CHART_TYPE.value < 64 || CHART_TYPE.valueKey <= CHART_TYPE.value) errs.push(`图表字阶过小 ${JSON.stringify(CHART_TYPE)}`);
}
// 图表：必须在 data-viz 面板里，且不手写低于下限的字号
{
  const src = strip(readFileSync(join(root, 'src/style/DataCharts.tsx'), 'utf8'));
  for (const k of ['line', 'bar', 'rank']) if (!src.includes(`kind="${k}"`)) errs.push(`DataCharts.tsx 缺 ${k} 图表面板（data-viz）`);
  if (!src.includes('data-viz')) errs.push('DataCharts.tsx 的 ChartPanel 缺 data-viz 标记');
  for (const m of src.matchAll(/\bnum\((\d+)/g)) if (Number(m[1]) < 40) errs.push(`DataCharts.tsx num(${m[1]}) 数值标签 < 40px`);
  for (const m of src.matchAll(/fontSize\s*:\s*(\d+)/g)) if (Number(m[1]) < 28) errs.push(`DataCharts.tsx 字号 ${m[1]} < 28`);
}
if (process.argv[1]?.endsWith('check-readability.mjs')) {
  if (errs.length) { console.error('✗ 可读性/字阶未通过：\n' + errs.join('\n')); process.exit(1); }
  console.log('✓ 可读性/字阶通过：无近黑文字，色调全深底浅字，小卡无手写字号，图表字阶与 data-viz 面板齐全');
}
export const readabilityErrors = errs;
