// 5.1.2 播前计划检查：只读镜头表（episode-plan.json）+ 口播时间码（src/demo/episode.json），纯静态、几秒出结果、不渲染。
//   npm run plan:check [-- episode-plan.json]
// 把「画面怎么跟口播」的规则放在选版式/写锚点这一步就拦住，而不是渲染完再返工。npm run render / verify 都会先跑它，不通过直接拒绝。
// 检查项：
//   1 计划结构（check-episode：版式登记、sceneText 完整、必填锚点、证据、锚点顺序与口播一致）
//   2 口播起点入场：每张卡的锚点 = 对应口播分句的起点（提前 ANCHOR_LEAD 帧）；卡数/版式要放得下
//   3 连线时序：A 出现 → 线长 → B 出现。该版式要求相邻卡间隔 ≥ LINK_GAP 帧；口播给的间隔不够、被迫推迟 >6 帧、或镜头放不下 → 失败，要求改镜头/拆分句/减卡/换版式
//   4 卡面文字出处：无占位字；卡面关键词必须取自本镜口播（见 provenance.ts）
//   5 片头节拍：片头 = 口播第 1 句（只这一句，时长 = 第 1 句时长）；每个口播关键词一拍，相邻拍 ≤1.5s，不许静止（opening/openingBeats.ts）
//   7 5.1.5 卡面文字适配：每张小卡 ≤2 层字（主词 + 一行副句）、主词 ≤9 字、副句 ≤12 字、字放得进卡且不小于卡宽一半（cards51/specs.ts）
//   8 5.1.5 图片组件：每张图 {src, kw, prompt}，kw 取自本镜口播、prompt 含 kw（images51/specs.ts）
//   9 5.1.5 图文节奏：以图为主的镜头 ≥1/3、连续纯卡 ≤2 镜（match/diversity.ts）
//  10 5.1.5 饰线由卡圆角推出（同心，style/ornament.ts）；入场动效词表全部单调落位（style/motion.ts）
//   11 字幕单行：每组 1 行、渲染宽度 ≤ 单行上限（subtitle-tokens.ts 的 SUB_TEXT_MAX_PX）
//   6 自检：用故意写坏的镜头证明上面每条都真的会拦
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {SHOTS} from '../src/demo/shots.ts';
import {NEW_LAYOUTS} from '../src/style/layouts.ts';
import {sceneOf} from '../src/style/scenes.ts';
import {SEQ_KEY, normalizeSeqAnchors, LINK_GAP, SEQ} from '../src/style/sequence.ts';
import {LINK_MODE, SEQUENTIAL_LAYOUTS, requiredSeqKeys} from '../src/style/sequence-spec.ts';
import {buildTimeline, findPhrase, F, ANCHOR_LEAD} from '../src/sync/timeline.ts';
import {provenanceFaults} from '../src/style/provenance.ts';
import {openingFaults, durationMsOf} from '../src/opening/openingBeats.ts';
import {openingConfig} from '../src/opening/openingConfig.ts';
import {firstSentenceOf} from '../src/opening/openingBeats.ts';
import {SMALL_LAYOUTS, IMAGE_LAYOUTS} from '../src/style/layouts.ts';
import {cardTextFaults} from '../src/cards51/specs.ts';
import {imageFaults, R_FRAME} from '../src/images51/specs.ts';
import {imageRhythmFaults} from '../src/match/diversity.ts';
import {ornamentFaults, ornamentSourceFaults} from '../src/style/ornament.ts';
import {SUB_TEXT_MAX_PX, SUB_MAX_CHARS, subTextPx} from '../src/style/subtitle-tokens.ts';
/** 11 字幕单行（5.1.5，t144u/t145u）：每组 1 行，文字渲染宽度 ≤ 单行上限；纯数据估算，不渲染。 */
export const subLineFaults = (subs = []) => { const out = [];
  subs.forEach((g, i) => { const t = (g.lines ?? []).flat().map((x) => x.t).join('').trim(); const px = Math.round(subTextPx(t));
    if ((g.lines ?? []).length > 1) out.push(`第 ${i + 1} 组「${t}」是 ${g.lines.length} 行：字幕强制单行，按台词停顿拆成多组`);
    if (px > SUB_TEXT_MAX_PX) out.push(`第 ${i + 1} 组「${t}」单行宽 ${px}px > ${SUB_TEXT_MAX_PX}px（约 ${SUB_MAX_CHARS} 字）：在停顿/标点处再拆一组`); });
  return out; };
import {motionFaults} from '../src/style/motion.ts';
import {CARD_TYPE, RADIUS} from '../src/style/tokens.ts';
import {readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

export const LATE_TOL = 6; // 帧：卡片因连线时序被推迟超过它，就等于没有在口播开口时出现
const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--')) || 'episode-plan.json';
const quiet = argv.includes('--quiet');

/** 单镜审计：anchors 为相对镜头起点的口播帧；d 为镜长（帧）；vo 为本镜口播原文。 */
export const auditShot = (shot, anchors, d, vo, opts = {}) => {
  const errs = []; const id = `${shot.id ?? '?'}/${shot.layout}`;
  const mode = LINK_MODE[shot.layout];
  // 2/3 口播起点入场 + 连线时序
  const norm = normalizeSeqAnchors(anchors, mode);
  let last = 0;
  for (const k of Object.keys(anchors)) {
    if (!SEQ_KEY.test(k)) continue;
    const late = norm[k] - anchors[k];
    if (late > LATE_TOL) errs.push(`${id}: 卡 ${k}「${shot.anchors?.[k]}」口播开口在 ${anchors[k]}f，但该版式要求「A 出现 → 线长 → B 出现」相邻卡间隔 ≥ ${LINK_GAP}f，被迫推迟 ${late}f（>${LATE_TOL}f，卡片就不再跟口播同时出现）：把这几张卡对应的口播分句拉开、减少卡数、拆成两镜或换无连线版式`);
    last = Math.max(last, norm[k]);
  }
  if ((shot.layout === 'splitVs' || shot.layout === 'waitVs') && anchors.L != null && anchors.R != null) {
    const late = anchors.L + LINK_GAP - anchors.R; last = Math.max(last, anchors.L + LINK_GAP, anchors.R);
    if (late > LATE_TOL) errs.push(`${id}: 右卡 R 比左卡 L 只晚 ${anchors.R - anchors.L}f，箭头长不完（需 ≥ ${LINK_GAP}f）`);
  }
  if (mode && last > d - SEQ.settle) errs.push(`${id}: 最后一张卡要到 ${Math.round(last)}f 才入场，镜头只有 ${d}f，放不下「出现 → 连线 → 下一张」：加长镜头或减卡`);
  // 场景版式：每一张可见卡都要绑定口播锚点（不允许落回默认时刻）
  if (NEW_LAYOUTS.includes(shot.layout) && !opts.skipCards) {
    let n = 0; try { n = sceneOf(shot.layout, shot.data).cards.filter((c) => c.texts.some((t) => String(t.text ?? '').trim())).length; } catch { /* check-episode 已报 */ }
    const miss = Array.from({length: n}, (_, i) => `r${i}`).filter((k) => shot.anchors?.[k] == null);
    if (miss.length) errs.push(`${id}: 每张卡都要绑定「口播里说到它的那句话」，缺锚点 ${miss.join('、')}（不绑就会落回默认时刻，不跟口播）`);
  }
  if (SEQUENTIAL_LAYOUTS.has(shot.layout)) {
    const miss = requiredSeqKeys(shot.layout, shot.data ?? {}, NEW_LAYOUTS.includes(shot.layout) ? sceneOf(shot.layout, shot.data).cards.length : 0).filter((k) => shot.anchors?.[k] == null);
    if (miss.length) errs.push(`${id}: 流程类版式缺口播锚点 ${miss.join('、')}`);
  }
  // 7 卡面文字适配 / 8 图片组件
  if (SMALL_LAYOUTS.includes(shot.layout)) for (const e of cardTextFaults(shot.layout, shot.data ?? {}, id)) errs.push(`文字适配 ${e}`);
  if (IMAGE_LAYOUTS.includes(shot.layout)) for (const e of imageFaults(shot.layout, shot.data ?? {}, vo, id)) errs.push(`图片 ${e}`);
  // 4 卡面文字出处
  for (const f of provenanceFaults(shot, vo, {strictSource: opts.strictSource})) errs.push(`${id}: 卡面文字 ${f.path}「${f.text}」${f.why}`);
  return errs;
};

const loadJson = (p) => JSON.parse(readFileSync(resolve(p), 'utf8'));
const voOf = (ep, fromMs, toMs) => ep.cues.filter((c) => c.startMs >= fromMs - 1 && c.startMs < toMs).map((c) => c.text).join('');

/** 自检：故意写坏的镜头必须被拦，原样的好镜头必须通过。 */
const selfTest = () => {
  const fails = []; const must = (name, errs, re) => { if (!errs.some((e) => re.test(e))) fails.push(`自检失效：${name} 没被拦住`); };
  const clean = (name, errs) => { if (errs.length) fails.push(`自检失效：${name} 被误拦：${errs[0]}`); };
  const vo = '交付实力怎么看，先看资金保障，再看工程进度，最后看过往交付质量，三项看清再下手';
  const good = {id: 'T', layout: 'pitfallLens', anchors: {r0: 'x', r1: 'x', r2: 'x', r3: 'x'}, data: {sceneText: {lens: ['交付实力', '三项看清'], c0: ['资金保障', '先看资金保障'], c1: ['工程进度', '再看工程进度'], c2: ['过往交付质量', '最后看过往交付质量']}}};
  clean('好镜头', auditShot(good, {r0: 5, r1: 60, r2: 100, r3: 140}, 220, vo));
  must('连线时序挤在一起', auditShot(good, {r0: 5, r1: 20, r2: 30, r3: 40}, 220, vo), /被迫推迟/);
  must('镜头太短', auditShot(good, {r0: 5, r1: 60, r2: 100, r3: 140}, 150, vo), /放不下/);
  must('占位字「示意」', auditShot({...good, data: {sceneText: {...good.data.sceneText, lens: ['示意']}}}, {r0: 5, r1: 60, r2: 100, r3: 140}, 220, vo), /占位字/);
  must('关键词不在口播里', auditShot({...good, data: {sceneText: {...good.data.sceneText, c0: ['资金池', '政府担保']}}}, {r0: 5, r1: 60, r2: 100, r3: 140}, 220, vo), /不在本镜口播|来自口播/);
  must('卡没绑口播锚点', auditShot({...good, anchors: {r0: 'x'}}, {r0: 5}, 220, vo), /缺锚点/);
  const op = JSON.parse(JSON.stringify(openingConfig)); op.extra = [{ms: 2300, kw: '先看三件事', src: 'a.png'}]; op.durationInFrames = 400;
  if (!openingFaults(op).some((e) => /静止过久|画面会停住/.test(e))) fails.push('自检失效：片头静止过久没被拦住');
  const op2 = JSON.parse(JSON.stringify(openingConfig)); op2.extra = [{ms: 2000, kw: '示意', src: 'a.png'}]; op2.durationInFrames = 150;
  if (!openingFaults(op2).some((e) => /占位/.test(e))) fails.push('自检失效：片头占位字没被拦住');
  if (openingFaults(openingConfig).length) fails.push('自检失效：默认片头被误拦');
  const op3 = JSON.parse(JSON.stringify(openingConfig)); op3.vo.text = '看房越多，反而越容易买错？其实先看三件事。';
  if (!openingFaults(op3).some((e) => /不止一句/.test(e))) fails.push('自检失效：片头吃进第 2 句没被拦住');
  const op4 = JSON.parse(JSON.stringify(openingConfig)); op4.durationInFrames += 40;
  if (!openingFaults(op4).some((e) => /第 1 句口播/.test(e))) fails.push('自检失效：片头时长 ≠ 第 1 句没被拦住');
  if (!openingFaults(openingConfig, {firstSentence: '买房先看三件事'}).some((e) => /≠ 本期口播第 1 句/.test(e))) fails.push('自检失效：片头不是口播第 1 句没被拦住');
  const dc = {hero: {v: '8.6', unit: '万', sub: '首付之外'}, items: [{k: '契税', v: '1%–3%'}, {k: '中介费', v: '1%–2%'}]};
  clean('小卡文字适配', cardTextFaults('dataCluster', dc));
  must('主词太长', cardTextFaults('noteGroup', {quote: {t: '购房资格一律以当地政策为准', s: '政策常调'}, notes: [['限购', '看社保']]}), /主词/);
  const img = {cells: [{src: 'a.jpg', kw: '窗边', prompt: '窗边：窗框特写', cap: '窗边'}, {src: 'b.jpg', kw: '墙角', prompt: '墙面特写', cap: '墙角'}]};
  must('提示词没含关键词', imageFaults('imageGrid', img, '先看窗边 再看墙角'), /prompt 没有包含/);
  must('图片关键词不在口播', imageFaults('imageGrid', img, '先看地漏'), /不在本镜口播/);
  must('连续纯卡 >2', imageRhythmFaults([{layout: 'titleFloat'}, {layout: 'dataCluster'}, {layout: 'riskGroup'}, {layout: 'noteGroup'}]), /连续 3 镜/);
  must('图片镜头 <1/3', imageRhythmFaults([{layout: 'dataCluster'}, {layout: 'riskGroup'}, {layout: 'imageGrid'}, {layout: 'noteGroup'}, {layout: 'stepRail'}, {layout: 'imageSwap'}, {layout: 'comparePair'}]), /1\/3/);
  must('饰线没传卡圆角', ornamentSourceFaults([{path: 'x.tsx', text: '<CardOrnament p={1} />'}]), /没传卡圆角/);
  must('饰线不同心', ornamentFaults([4]), /inset/);
  const tk = (t) => [...t].map((c) => ({t: c, s: null, e: null}));
  must('字幕两行', subLineFaults([{lines: [tk('首付之外'), tk('还要留多少')]}]), /强制单行/);
  must('字幕超宽', subLineFaults([{lines: [tk('这一句台词特别特别长长到一行根本放不下必须在停顿处拆开才行')]}]), /单行宽/);
  clean('单行字幕', subLineFaults([{lines: [tk('首付之外 还要留多少')]}]));
  return fails;
};

const errors = []; const warns = [];
if (!existsSync(resolve(file))) { console.error(`✗ 找不到镜头表 ${file}`); process.exit(1); }
const plan = loadJson(file); const shots = Array.isArray(plan) ? plan : plan.shots;
const sample = String(plan?.purpose ?? '').includes('安装样例');
const ep = loadJson('src/demo/episode.json');
// 1 结构（沿用 check-episode）
{
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', 'scripts/check-episode.mjs', file], {encoding: 'utf8'});
  try { const j = JSON.parse(r.stdout); for (const e of j.errors) errors.push(`计划: ${e}`); } catch { errors.push(`计划: check-episode 无法运行：${(r.stderr || r.stdout).slice(0, 200)}`); }
}
// 2–4 逐镜
const tl = buildTimeline(SHOTS, ep);
for (const it of tl.items) {
  const vo = voOf(ep, it.startMs, it.startMs + it.d * 1000 / 30);
  const errs = auditShot(it.s, it.anchors, it.d, vo, {strictSource: !sample});
  for (const e of errs) ((sample && /卡面文字 .*(口播|来自)/.test(e) && !/占位字/.test(e)) ? warns : errors).push(e);
}
// 5 片头
{
  const phraseMs = ep.hasWords ? (a) => findPhrase(ep, a, 0, durationMsOf(openingConfig))?.ms ?? null : undefined;
  const c0 = ep.cues?.[0];
  const first = openingConfig.enabled && c0 ? {firstSentence: firstSentenceOf(c0.text), firstSentenceMs: {startMs: c0.startMs, endMs: c0.endMs}} : {};
  for (const e of openingFaults(openingConfig, {phraseMs: openingConfig.enabled ? phraseMs : undefined, ...first})) errors.push(`片头: ${e}`);
}
// 9 图文节奏
for (const e of imageRhythmFaults(SHOTS)) if (!errors.some((x) => x.includes(e))) errors.push(`节奏: ${e}`);
// 10 饰线同心 + 动效词表
{
  const radii = [...Object.values(CARD_TYPE).map((t) => t.radius), RADIUS.card, RADIUS.frame, R_FRAME, 36, 28, 42];
  for (const e of ornamentFaults(radii)) errors.push(`饰线: ${e}`);
  const files = []; const walkDir = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walkDir(p); else if (/\.tsx$/.test(n)) files.push({path: p, text: readFileSync(p, 'utf8')}); } };
  walkDir(resolve('src'));
  for (const e of ornamentSourceFaults(files)) errors.push(`饰线: ${e}`);
  for (const e of motionFaults()) errors.push(`动效: ${e}`);
}
// 11 字幕单行
for (const e of subLineFaults(ep.subs)) errors.push(`字幕: ${e}`);
// 6 自检
for (const e of selfTest()) errors.push(e);

if (warns.length && !quiet) { console.log(`ℹ 安装样例口播与卡面无出处关系（样例模式，仅提示 ${warns.length} 条；正式本期按口播出处硬检查）`); }
if (errors.length) {
  console.error(`✗ 播前计划检查失败（${errors.length} 处）：`);
  for (const e of errors.slice(0, 60)) console.error('  - ' + e);
  if (errors.length > 60) console.error(`  …另有 ${errors.length - 60} 处`);
  process.exit(1);
}
console.log(`✓ 播前计划检查通过：${shots.length} 镜；口播起点入场（提前 ${ANCHOR_LEAD}f）、连线时序「A 出现 → 线长(${SEQ.draw}f) → B 出现」（相邻 ≥${LINK_GAP}f）、卡面文字出处${sample ? '（样例模式：仅占位字硬拦）' : ''}、片头 = 口播第 1 句（≤1.5s 一拍）、卡面文字适配（≤2 层字）、图片组件（kw 出自口播/提示词含 kw）、图文节奏（图 ≥1/3、纯卡连续 ≤2）、饰线同心、动效落位、字幕单行（每组 ≤${SUB_TEXT_MAX_PX}px ≈ ${SUB_MAX_CHARS} 字，${ep.subs.length} 组）；自检 OK`);
