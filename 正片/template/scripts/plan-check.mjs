// 5.1.2 播前计划检查：只读镜头表（episode-plan.json）+ 口播时间码（src/demo/episode.json），纯静态、几秒出结果、不渲染。
//   npm run plan:check [-- episode-plan.json]
// 把「画面怎么跟口播」的规则放在选版式/写锚点这一步就拦住，而不是渲染完再返工。npm run render / verify 都会先跑它，不通过直接拒绝。
// 检查项：
//   1 计划结构（check-episode：版式登记、sceneText 完整、必填锚点、证据、锚点顺序与口播一致）
//   2 口播起点入场：每张卡的锚点 = 对应口播分句的起点（提前 ANCHOR_LEAD 帧）；卡数/版式要放得下
//   3 连线时序：A 出现 → 线长 → B 出现。该版式要求相邻卡间隔 ≥ LINK_GAP 帧；口播给的间隔不够、被迫推迟 >6 帧、或镜头放不下 → 失败，要求改镜头/拆分句/减卡/换版式
//   4 卡面文字出处：无占位字；卡面关键词必须取自本镜口播（见 provenance.ts）
//   5 片头节拍：每个口播关键词一拍，相邻拍 ≤1.5s，不许静止（opening/openingBeats.ts）
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
  for (const e of openingFaults(openingConfig, {phraseMs: openingConfig.enabled ? phraseMs : undefined})) errors.push(`片头: ${e}`);
}
// 6 自检
for (const e of selfTest()) errors.push(e);

if (warns.length && !quiet) { console.log(`ℹ 安装样例口播与卡面无出处关系（样例模式，仅提示 ${warns.length} 条；正式本期按口播出处硬检查）`); }
if (errors.length) {
  console.error(`✗ 播前计划检查失败（${errors.length} 处）：`);
  for (const e of errors.slice(0, 60)) console.error('  - ' + e);
  if (errors.length > 60) console.error(`  …另有 ${errors.length - 60} 处`);
  process.exit(1);
}
console.log(`✓ 播前计划检查通过：${shots.length} 镜；口播起点入场（提前 ${ANCHOR_LEAD}f）、连线时序「A 出现 → 线长(${SEQ.draw}f) → B 出现」（相邻 ≥${LINK_GAP}f）、卡面文字出处${sample ? '（样例模式：仅占位字硬拦）' : ''}、片头节拍（≤1.5s 一拍）；自检 OK`);
