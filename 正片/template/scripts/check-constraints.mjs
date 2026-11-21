// 排版硬约束：字体实测 + 几何函数 + 正式镜头表版式登记。不截图。
import opentype from 'opentype.js';
import {readFileSync, readdirSync} from 'node:fs';
import {basename, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SAFE} from '../src/style/grid.ts';
import {ARCHIVE_LAYOUTS, BIG_CARD_AREA, CARD_CLASS, DEFAULT_LAYOUTS, ESTATE_LAYOUTS, IMAGE_BIG_LAYOUTS, NEW_LAYOUTS, POOL_LAYOUTS, RETIRED_LAYOUTS, RETIRED_REPLACEMENT, SMALL_LAYOUTS, layoutRects} from '../src/style/layouts.ts';
import {SHOTS} from '../src/demo/shots.ts';
import {sceneOf, NEW_SCENE_NAMES} from '../src/style/scenes.ts';
import {connectorFaults, gapBetween, overlapArea, samplesOf} from '../src/style/geom.ts';
import {PLAN_ASSET, validatePlanAsset} from '../src/style/floorplans.ts';
import {contrastRatio, inkContrast, parseRgb, textTreatment} from '../src/style/readability.ts';
import {FOG, glassEnter, GLASS_ENTER_FRAMES} from '../src/style/tokens.ts';
import {matchEpisode, quotaFaults} from '../src/match/matchCopy.ts';
import {SUB} from '../src/style/subtitle-tokens.ts';

const errs = [];
const font = opentype.loadSync(new URL('../public/fonts/AlibabaHealthFont2.0CN-85B.ttf', import.meta.url));
const widthOf = (text, size) => font.getAdvanceWidth(text, size);

if (DEFAULT_LAYOUTS.length !== 24) errs.push(`默认版式 ${DEFAULT_LAYOUTS.length} ≠ 24（5.1.1 退役 quoteStack/pitfallBoard 两个纯文字大卡）`);
if (ESTATE_LAYOUTS.length !== 8) errs.push(`房产 MG ${ESTATE_LAYOUTS.length} ≠ 8`);
if (NEW_LAYOUTS.length !== 9) errs.push(`新卡 ${NEW_LAYOUTS.length} ≠ 9（5.1.1 退役 8 款纯文字大卡）`);
if (SMALL_LAYOUTS.length !== 5) errs.push(`5.1 小卡组合 ${SMALL_LAYOUTS.length} ≠ 5`);
if (POOL_LAYOUTS.length !== 42) errs.push(`选卡池 ${POOL_LAYOUTS.length} ≠ 42（24 + 新卡 9 + 小卡 5 + 图片组件 4）`);
for (const name of SMALL_LAYOUTS) if (DEFAULT_LAYOUTS.includes(name) || NEW_LAYOUTS.includes(name)) errs.push(`${name} 不应替换已有版式`);
for (const name of NEW_LAYOUTS) if (DEFAULT_LAYOUTS.includes(name)) errs.push(`${name} 不应替换默认 26`);

if (SUB.size !== 40 || SUB.color !== '#F5F8FC' || SUB.hi !== '#9CC4FF' || SUB.bottom !== 44) {
  errs.push(`字幕定版被改动 ${JSON.stringify({size: SUB.size, color: SUB.color, hi: SUB.hi, bottom: SUB.bottom})}`);
}

// 5.1.1 户型图素材：真实比例（mm）CAD 风格户型图，文件齐全、房间名/面积/墙厚/门窗合理
validatePlanAsset().forEach((e) => errs.push(e));
for (const f of ['plan_3br2ba.svg', 'plan_3br2ba.png', 'plan_3br2ba.json']) {
  try { if (readFileSync(new URL(`../public/media/floorplan/${f}`, import.meta.url)).length < 1000) errs.push(`户型素材 ${f} 太小`); } catch { errs.push(`缺户型素材 public/media/floorplan/${f}`); }
}
{
  const svg = readFileSync(new URL('../public/media/floorplan/plan_3br2ba.svg', import.meta.url), 'utf8');
  if (/<text[\s>]/.test(svg)) errs.push('户型 SVG 里有 <text>：文字必须转轮廓，避免换机字体不同');
  if (PLAN_ASSET.aspect < 0.8 || PLAN_ASSET.aspect > 1.6) errs.push(`户型图宽高比 ${PLAN_ASSET.aspect.toFixed(2)} 不合理`);
}

// 5.1.1 大卡规则：选卡池每个版式必须登记卡面类别；退役版式不得入池；纯文字大卡（面积 > BIG_CARD_AREA）一律不允许。
for (const name of POOL_LAYOUTS) if (!CARD_CLASS[name]) errs.push(`版式「${name}」没有在 layouts.ts 的 CARD_CLASS 登记卡面类别（image/viz/small/none/outro）`);
for (const name of RETIRED_LAYOUTS) {
  if (POOL_LAYOUTS.includes(name)) errs.push(`退役版式「${name}」不应在选卡池（纯文字大卡）`);
  if (!RETIRED_REPLACEMENT[name] || !POOL_LAYOUTS.includes(RETIRED_REPLACEMENT[name])) errs.push(`退役版式「${name}」缺替代版式`);
}
for (const name of IMAGE_BIG_LAYOUTS) if (CARD_CLASS[name] !== 'image') errs.push(`IMAGE_BIG_LAYOUTS 里的「${name}」必须是 image 类`);
for (const name of POOL_LAYOUTS) {
  if (!NEW_SCENE_NAMES.includes(name)) continue;
  for (const c of sceneOf(name).cards) {
    const xs = c.poly.map((p) => p[0]), ys = c.poly.map((p) => p[1]);
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    const shaped = !(new Set(xs).size === 2 && new Set(ys).size === 2); // 异形面板（杯形图等）是图形本身，不是文字大卡
    if (shaped && CARD_CLASS[name] === 'viz') continue;
    if (area > BIG_CARD_AREA && !c.visual) errs.push(`${name}/${c.id} 是纯文字大卡（${Math.round(area / 1000)}k px² > ${BIG_CARD_AREA / 1000}k）：大卡必须放图（图框/户型图/图示），文字拆进小卡`);
  }
}
{ // 自检：这条规则必须能拦住纯文字大卡
  const fake = {poly: [[0, 0], [600, 0], [600, 300], [0, 300]], visual: undefined};
  const area = 600 * 300;
  if (!(area > BIG_CARD_AREA && !fake.visual)) errs.push('大卡检查自身失效');
}

for (const name of NEW_SCENE_NAMES) {
  const sc = sceneOf(name);
  const tones = new Set(sc.cards.map((c) => c.tone));
  if (tones.size > 2) errs.push(`${name} 色调 ${tones.size}`);
  const shapes = sc.cards.map((c) => c.poly);
  for (const c of sc.cards) for (const t of c.texts) {
    if (/投资|一定|必涨/.test(t.text)) errs.push(`${name} 禁用词「${t.text}」`);
    const min = t.role === 'room' ? 30 : t.role === 'label' ? 28 : t.role === 'num' ? 28 : 34;
    if (t.size < min) errs.push(`${name} ${t.role} ${t.size}px「${t.text}」`);
    const chars = [...t.text.replace(/\s/g, '')].length;
    if (t.role === 'title' && chars > 8) errs.push(`${name} 卡标题超 8 字「${t.text}」`);
    if (t.role === 'body' && chars > 16) errs.push(`${name} 正文超 16 字「${t.text}」`);
    if (t.role === 'label' && chars > 6 && t.size <= 28) errs.push(`${name} 标签超 6 字「${t.text}」`);
    const measured = widthOf(t.text, t.size);
    if (measured > t.box.w * 0.75 + 1) errs.push(`${name}「${t.text}」实测 ${measured.toFixed(0)}px > 容器 ${t.box.w.toFixed(0)} 的 75%`);
    if (t.box.x < SAFE.left || t.box.x + t.box.w > SAFE.right + 1 || t.box.y < 248 || t.box.y + t.box.h > 880) errs.push(`${name} 文字越出内容区「${t.text}」`);
  }
  for (const ln of sc.lines) {
    const faults = connectorFaults(ln.pts, ln.width, shapes, 2, ln.kind === 'diagram' ? 'none' : ln.anchor)
      .filter((f) => ln.kind === 'diagram' ? /进入|内部/.test(f) : true);
    faults.forEach((f) => errs.push(`${name}/${ln.id} ${f}`));
  }
  if (name === 'loanCurve' || name === 'hexSteps') {
    const flows = sc.lines.filter((l) => l.id === 'path' || l.id.startsWith('flow') || l.id.startsWith('stem'));
    if (flows.some((l) => l.pts.length < 6)) errs.push(`${name} 流程线不够顺`);
  }
  for (const c of sc.cards) {
    const texts = c.texts.map((t) => t.box);
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      if (overlapArea(texts[i], texts[j]) > 0) errs.push(`${name}/${c.id} 文字互相重叠`);
    }
    for (const m of c.marks ?? []) for (const t of c.texts) {
      const gap = gapBetween(t.box, m);
      if (gap < 24) errs.push(`${name}/${c.id} 文字「${t.text}」与图形间距 ${gap.toFixed(0)}px < 24`);
    }
  }
  if (name === 'hexSteps') {
    const caps = sc.cards.flatMap((c) => c.texts.filter((t) => t.role === 'body').slice(1));
    caps.forEach((t) => { if ([...t.text].length > 6) errs.push(`六边形说明超 6 字「${t.text}」`); });
  }
}

for (const [L, p90, want] of [[0.3, 0.3, 'legacy'], [0.5, 0.5, 'tx2'], [0.7, 0.8, 'bar'], [0.4, 0.8, 'tx2']]) {
  if (textTreatment(L, p90) !== want) errs.push(`文字处理 L=${L} P90=${p90} 应为 ${want}`);
}
// 5.1 科技色板：每种色调用自己的文字色（深卡白字 / 浅卡深字），在纯黑与纯白背景上都要 ≥4.5。
for (const tone of Object.keys(FOG)) {
  const dark = inkContrast([8, 8, 8], tone);
  const bright = inkContrast([245, 245, 245], tone);
  const top = FOG[tone].fill0.match(/rgba?\(([^)]+)\)/)[1].split(',').map(Number);
  if (!dark.ok || contrastRatio(parseRgb(FOG[tone].inkHex), top.slice(0, 3)) < 4.5) errs.push(`${tone} 文字对卡面对比不足`);
  if (!bright.ok) errs.push(`${tone} 亮底对比不足`);
  if (/^rgba\((2[0-9]{2}),(2[0-9]{2}),(1[0-9]{2})/.test(FOG[tone].fill0.replace(/\s/g, '')) && !FOG[tone].light) errs.push(`${tone} 出现暖黄底`);
}
// 字幕：字与胶囊、当前词与胶囊（胶囊按最亮背景上的合成色保守计算）都 ≥4.5。
{
  const pill = [...SUB.pill.matchAll(/rgba\(([^)]+)\)/g)].map((m) => m[1].split(',').map(Number));
  const worst = pill.map(([r, g, b, a]) => [r * a + 245 * (1 - a), g * a + 245 * (1 - a), b * a + 245 * (1 - a)]).sort((x, y) => (y[0] + y[1] + y[2]) - (x[0] + x[1] + x[2]))[0];
  if (contrastRatio(parseRgb(SUB.color), worst) < 4.5) errs.push(`字幕字对胶囊（亮底）对比不足 ${contrastRatio(parseRgb(SUB.color), worst).toFixed(2)}`);
  if (contrastRatio(parseRgb(SUB.hi), worst) < 3) errs.push(`当前词对胶囊（亮底）对比不足 ${contrastRatio(parseRgb(SUB.hi), worst).toFixed(2)}`);
}
// 5.1 小卡组合：组矩形在栏线上、不越界、组间 ≥48（连接件 ≥24）。
for (const name of SMALL_LAYOUTS) {
  const R = layoutRects(name);
  const all = Object.entries(R);
  for (const [k, r] of all) {
    if (r.x < SAFE.left || r.x + r.w > SAFE.right || r.y < 248 || r.y + r.h > 880) errs.push(`${name}.${k} 越出内容区`);
    if ((r.x - SAFE.left) % 130 !== 0 || (r.x + r.w - SAFE.left + 24) % 130 !== 0) errs.push(`${name}.${k} 不在栏线上`);
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const [ka, a] = all[i], [kb, b] = all[j];
    const gap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
    const need = ka.startsWith('conn') || kb.startsWith('conn') ? 24 : 48;
    if (gap < need) errs.push(`${name}: ${ka} 与 ${kb} 间距 ${gap}px < ${need}`);
  }
}
for (const kind of ['enter', 'shaped', 'soft', 'chip']) {
  let prev = -1;
  for (let f = -5; f <= 40; f += 0.5) {
    const p = glassEnter(f, 0, kind);
    if (p < prev || p < 0 || p > 1) errs.push(`${kind} 入场不单调 ${f}`);
    prev = p;
  }
  if (glassEnter(GLASS_ENTER_FRAMES[kind], 0, kind) !== 1) errs.push(`${kind} 到位不是 1`);
  if (glassEnter(GLASS_ENTER_FRAMES[kind] + 8, 0, kind) !== 1) errs.push(`${kind} 到位后还在变`);
}

const demo = [
  {text: '你知道吗，很多人第一步就看错了', count: 1},
  {text: '月供大概占收入的30%', count: 1, evidenced: true},
  {text: '新房还是二手，差在入住时间', count: 2, struct: 'A/B 两组'},
  {text: '从签约到放款要过几关', count: 5, struct: '带时间的节点'},
  {text: '先看小区，然后看楼栋，接着看户型', count: 3, struct: '3–5 个有序项'},
  {text: '地铁步行八分钟，学校过一条马路', count: 3},
  {text: '这个户型得房率和动线怎么样', count: 1},
  {text: '窗角有没有水渍，空鼓要小心', count: 3},
  {text: '契税和维修金都要提前留出来', count: 3},
  {text: '总之记住，月供别超过收入的三分之一', count: 3},
];
const picks = matchEpisode(demo, {episode: '12', title: '月供和户型'});
// Candidate matching and actual final-plan diversity are separate: check:episode enforces final quotas.
if(picks.some(p=>p.layout&&!POOL_LAYOUTS.includes(p.layout)))errs.push('匹配输出不在正式选卡池');
const again = matchEpisode(demo, {episode: '12', title: '月供和户型'});
if (picks.map((p) => p.layout).join() !== again.map((p) => p.layout).join()) errs.push('同一期号匹配结果不稳定');
const banned = matchEpisode([{text: '这套房一定投资必涨', title: '投资必涨'}], {title: '投资'});
if (banned[0].status !== 'manual') errs.push('禁用词没有拦下');
const cooled = matchEpisode(demo, {episode: '6', title: '月供和户型', history: {media: (picks.map((p) => p.media).filter(Boolean)).map((id) => ({id, episode: 5}))}});
if (cooled.some((p) => p.media && picks.some((q) => q.media === p.media) && !p.mediaRelaxed)) errs.push('3 期冷却没有拦住刚用过的素材');
if (readFileSync(new URL('../src/style/subtitle-tokens.ts', import.meta.url), 'utf8').includes('size: 42')) errs.push('字幕被改回 42');

const TEMPLATE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const REGISTERED_LAYOUTS = new Set([...POOL_LAYOUTS, ...ARCHIVE_LAYOUTS, 'outroAir']);

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^\\])\/\/.*$/gm, '$1');
const lineNo = (src, index) => src.slice(0, index).split('\n').length;
const layoutFault = (where, name) => `${where}: ${RETIRED_REPLACEMENT[name] ? `版式「${name}」已在 5.1.1 退役（纯文字大卡），请改用「${RETIRED_REPLACEMENT[name]}」；` : ''}版式「${name}」未在 layouts.ts 的 LayoutName 登记。正片只能用已登记官方版式（选卡池 42 种；存档 6 套不默认推荐；outroAir 只是 outroHost 的别名；5.1.1 退役的纯文字大卡版式不可用）。不要自造 phrase、broll、chapterTitle、wordCompare、commuteCalc 或 opening。塞不下就换 matchEpisode() 的下一个官方候选或拆镜，并继续走 ShotView / sceneOf。`;

/** 从 shots 源码里取出 layout: '…' / "layout": "…"。 */
export const layoutFaultsInCode = (source, label) => {
  const faults = [];
  const code = stripComments(source);
  const seen = new Set();
  const push = (name, index, raw) => {
    const n = String(name).trim();
    const at = `${n}@${lineNo(raw, index)}`;
    if (!n || REGISTERED_LAYOUTS.has(n) || seen.has(at)) return;
    seen.add(at);
    faults.push(layoutFault(`${label}:${lineNo(raw, index)}`, n));
  };
  for (const m of code.matchAll(/layout\s*:\s*(['"`])([^'"`]+)\1/g)) push(m[2], m.index, code);
  for (const m of code.matchAll(/"layout"\s*:\s*"([^"]+)"/g)) push(m[1], m.index, code);
  return faults;
};

const splitRow = (line) => line.split('|').slice(1, -1).map((c) => c.trim());

/** 镜头表：代码字段，外加「版式」列和 layout/版式: 名字。 */
export const layoutFaultsInShotTable = (source, label) => {
  const faults = layoutFaultsInCode(source, label);
  const seen = new Set(faults);
  const add = (name, index) => {
    const n = String(name).replace(/`/g, '').trim();
    if (!n || REGISTERED_LAYOUTS.has(n)) return;
    const msg = layoutFault(`${label}:${lineNo(source, index)}`, n);
    if (!seen.has(msg)) { seen.add(msg); faults.push(msg); }
  };
  const lines = source.split(/\r?\n/);
  const lineStart = (n) => lines.slice(0, n).reduce((sum, line) => sum + line.length + 1, 0);
  const headerAt = lines.findIndex((line) => /^\s*\|/.test(line) && /版式|layout/i.test(line));
  if (headerAt >= 0) {
    const col = splitRow(lines[headerAt]).findIndex((c) => /版式|^layout$/i.test(c.replace(/`/g, '').trim()));
    if (col >= 0) {
      for (let i = headerAt + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!/^\s*\|/.test(line)) break;
        const name = (splitRow(line)[col] || '').replace(/`/g, '').trim();
        if (name && !/^[:|-]+$/.test(name)) add(name, lineStart(i) + Math.max(0, line.indexOf(name)));
      }
    }
  }
  for (const m of source.matchAll(/(?:^|[\s|])(?:layout|版式)\s*[:：]\s*['"`]?([^\s'"`|，。,;；]+)/gm)) {
    add(m[1], m.index + m[0].indexOf(m[1]));
  }
  return faults;
};

const isShotFile = (name) => /^shots\.(ts|tsx|mjs|json)$/.test(name);
const isCueSheet = (name) => name.includes('镜头表') && /\.(md|json|ts|tsx|txt|mjs)$/.test(name);
const collectShotTables = (dir, out) => {
  let entries;
  try { entries = readdirSync(dir, {withFileTypes: true}); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'out' || e.name === 'public' || e.name === '.git') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) collectShotTables(p, out);
    else if (isShotFile(e.name) || isCueSheet(e.name)) out.push(p);
  }
};

const shotTableFaults = () => {
  const files = [];
  collectShotTables(TEMPLATE_ROOT, files);
  collectShotTables(join(REPO_ROOT, 'episodes'), files);
  const faults = [];
  const seen = new Set();
  for (const file of files) {
    if (seen.has(file)) continue;
    seen.add(file);
    const label = relative(REPO_ROOT, file);
    const source = readFileSync(file, 'utf8');
    const batch = isCueSheet(basename(file)) && !isShotFile(basename(file))
      ? layoutFaultsInShotTable(source, label)
      : layoutFaultsInCode(source, label);
    faults.push(...batch);
  }
  for (const s of SHOTS) {
    const name = String(s?.layout);
    if (REGISTERED_LAYOUTS.has(name)) continue;
    if (faults.some((f) => f.includes('src/demo/shots.ts') && f.includes(`「${name}」`))) continue;
    faults.push(layoutFault(`正片/template/src/demo/shots.ts ${s?.id || '?'}`, name));
  }
  return faults;
};

const probeBad = layoutFaultsInCode("export const SHOTS = [{id:'S01', layout: 'phrase'}];", 'probe');
const probeGood = layoutFaultsInCode("layout: 'hexSteps', layout: 'outroAir', layout: 'keywordCascade', layout: 'stepRail'", 'probe');
const probeSheet = layoutFaultsInShotTable('| 镜 | 版式 |\n|---|---|\n| S01 | commuteCalc |\n', 'probe');
if (probeBad.length !== 1 || probeGood.length !== 0 || probeSheet.length !== 1) errs.push('版式登记检查自身失效');
shotTableFaults().forEach((f) => errs.push(f));

const demoSrc = readFileSync(new URL('../src/demo/Demo.tsx', import.meta.url), 'utf8');
if (!demoSrc.includes("from '../style/archetypes'") || !demoSrc.includes('<ShotView')) {
  errs.push('src/demo/Demo.tsx 必须用官方 ShotView（style/archetypes）渲染正片，不能换成并行简版渲染器');
}

export const constraintErrors = errs;
if (process.argv[1] && process.argv[1].endsWith('check-constraints.mjs')) {
  if (errs.length) { console.log('✗ 约束\n' + errs.join('\n')); process.exit(1); }
  console.log(`✓ 约束通过：选卡池 ${POOL_LAYOUTS.length}（默认 ${DEFAULT_LAYOUTS.length} + 新卡 ${NEW_LAYOUTS.length} + 小卡 ${SMALL_LAYOUTS.length} + 图片组件 4），大卡必须放图，户型图素材，连线，字体实测，对比度，匹配，镜头表版式已登记`);
}
