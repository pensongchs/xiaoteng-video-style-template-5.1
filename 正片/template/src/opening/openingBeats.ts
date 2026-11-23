/** 片头节拍（纯函数，播前 plan:check / 片头 check:beats 共用，不渲染）。
 *  5.1.5：片头 = 口播第 1 句，只这一句。口播每说到一个关键词就换一拍——关键词文字 + 画面（抠像接力/换位）一起换。
 *  规则（OPENING_RULE）：
 *   0) 片头口播 vo.text 只能是一句（句中不许再有 。！？）；有本期口播时必须等于口播第 1 句；
 *      时长 = 第 1 句口播时长（vo.endMs − vo.startMs，误差 ≤ 1 帧）；不许拉长成静帧、不许吃进第 2 句；
 *   1) 第 1 拍在 0ms；拍点严格递增；
 *   2) 相邻两拍间隔 ≤ maxHoldMs（1500ms），最后一拍到片头结束也 ≤ maxHoldMs：不许一帧不变地停住；
 *   3) 每拍都有关键词（kw），且取自片头口播原文（vo.text）；不许占位字；
 *   4) 追加拍（extra）每一拍必须换画面：src（抠像）与上一拍不同；
 *   5) 有真实逐字时间码时，每拍拍点 ≈ 对应口播短语的起点（≤ 3 帧@50fps）。 */
import {isPlaceholderText} from '../style/placeholder.ts';
export const STAMP = {maxChars: 9, maxWidth: 732, padding: 34} as const;
export const OPENING_RULE = {maxHoldMs: 1500, syncTolMs: 60, frameTolMs: 20};
export type Beat = {ms: number; kw: string; role: 'prefix' | 'focus' | 'turn' | 'verdict' | 'lead' | 'extra'; anchor?: string; src?: string; sub?: string};
export type OpeningLike = {
  fps: number; durationInFrames: number;
  timingMs: {focus: number; turn: number; verdict: number};
  text: {prefix: string; focus: string; turn: string; verdict: string};
  stamp?: {lead?: {text: string; ms: number; anchor?: string}};
  cards: readonly {src: string; at?: number}[];
  vo?: {text: string; startMs?: number; endMs?: number; anchors?: Partial<Record<'focus' | 'turn' | 'verdict', string>>};
  extra?: readonly {ms: number; kw: string; sub?: string; anchor?: string; src: string}[];
};
export const durationMsOf = (c: Pick<OpeningLike, 'fps' | 'durationInFrames'>) => Math.round((c.durationInFrames / c.fps) * 1000);
export const beatsOf = (c: OpeningLike): Beat[] => {
  const a = c.vo?.anchors ?? {};
  const base: Beat[] = [
    {ms: 0, kw: c.text.prefix, role: 'prefix', src: c.cards[0]?.src},
    {ms: c.timingMs.focus, kw: c.text.focus, role: 'focus', anchor: a.focus, src: c.cards[1]?.src ?? c.cards[0]?.src},
    {ms: c.timingMs.turn, kw: c.text.turn, role: 'turn', anchor: a.turn, src: c.cards[2]?.src ?? c.cards[1]?.src},
    ...(c.stamp?.lead ? [{ms:c.stamp.lead.ms, kw:c.stamp.lead.text, role:'lead' as const, anchor:c.stamp.lead.anchor, src:c.cards[2]?.src}] : []),
    {ms: c.timingMs.verdict, kw: c.text.verdict, role: 'verdict', anchor: a.verdict, src: c.cards[2]?.src},
  ];
  return [...base, ...(c.extra ?? []).map((e): Beat => ({ms: e.ms, kw: e.kw, role: 'extra', anchor: e.anchor, src: e.src, sub: e.sub}))];
};
const norm = (t: string) => t.replace(/[\s·，。！？；：、,.!?;:…—「」“”"'*]/g, '');
/** 文案第 1 句（按 。！？!? 断句）。 */
export const firstSentenceOf = (copy: string) => (String(copy ?? '').match(/^[^。！？!?]*[。！？!?]?/)?.[0] ?? '').trim();
/** phraseMs：给定口播短语，返回它在片头口播里的起点毫秒；firstSentence：本期口播第 1 句原文（有就核对）。 */
export const openingFaults = (c: OpeningLike, opts: {phraseMs?: (anchor: string) => number | null; firstSentence?: string; firstSentenceMs?: {startMs: number; endMs: number}} = {}): string[] => {
  const errs: string[] = []; const beats = beatsOf(c); const end = durationMsOf(c); const R = OPENING_RULE;
  // 0 片头 = 第 1 句
  const vo = c.vo?.text ?? '';
  if (!vo.trim()) errs.push('片头没有写口播第 1 句（vo.text）');
  else {
    if (/[。！？!?]/.test(vo.replace(/[。！？!?…]+\s*$/, ''))) errs.push(`片头口播「${vo}」不止一句：片头只用口播第 1 句，后面的句子交给正片`);
    if (opts.firstSentence != null && norm(vo) !== norm(opts.firstSentence)) errs.push(`片头口播「${vo}」≠ 本期口播第 1 句「${opts.firstSentence}」`);
  }
  if (c.stamp && [...c.text.verdict].length > STAMP.maxChars) errs.push(`红色收句印章最多容纳 ${STAMP.maxChars} 个字符，请保留最关键的短语`);
  if (c.stamp && opts.phraseMs && !c.vo?.anchors?.verdict) errs.push('红色收句印章须绑定最后一句的重点词起音');
  const span = opts.firstSentenceMs ?? (c.vo?.endMs != null ? {startMs: c.vo.startMs ?? 0, endMs: c.vo.endMs} : null);
  if (!span) errs.push('片头没有登记第 1 句的起止（vo.startMs / vo.endMs）：时长必须 = 第 1 句口播时长');
  else if (Math.abs((span.endMs - span.startMs) - end) > R.frameTolMs) errs.push(`片头时长 ${end}ms ≠ 第 1 句口播 ${span.endMs - span.startMs}ms：片头只覆盖第 1 句，说完就切正片（不拉长静帧、不吃进第 2 句）`);
  if (beats[0].ms !== 0) errs.push('片头第 1 拍必须在 0ms');
  beats.forEach((b, i) => {
    const w = `第 ${i + 1} 拍「${b.kw}」`;
    if (!b.kw?.trim()) errs.push(`${w}：没有关键词`);
    else if (isPlaceholderText(b.kw)) errs.push(`${w}：占位字，片头关键词必须取自口播`);
    if (i && !(b.ms > beats[i - 1].ms)) errs.push(`${w}：拍点 ${b.ms}ms 没有晚于上一拍 ${beats[i - 1].ms}ms`);
    if (i && b.ms - beats[i - 1].ms > R.maxHoldMs) errs.push(`${w}：与上一拍间隔 ${b.ms - beats[i - 1].ms}ms > ${R.maxHoldMs}ms，画面会停住不动——第 1 句中间的关键词也要上一拍（关键词 + 换抠像/换位）`);
    if (b.ms >= end) errs.push(`${w}：拍点 ${b.ms}ms 超出片头时长 ${end}ms`);
    if (b.role === 'extra') { if (!b.src) errs.push(`${w}：追加拍没有 src（必须换抠像画面）`); else if (b.src === beats[i - 1].src) errs.push(`${w}：画面与上一拍相同（src 没换），不算换拍`); }
  });
  const tail = end - beats[beats.length - 1].ms; if (tail > R.maxHoldMs) errs.push(`最后一拍「${beats[beats.length - 1].kw}」到片头结束 ${tail}ms > ${R.maxHoldMs}ms：静止过久，补一拍或缩短片头`);
  if (vo) {
    const v = norm(vo);
    beats.forEach((b, i) => { if (!isPlaceholderText(b.kw) && !v.includes(norm(b.kw))) errs.push(`第 ${i + 1} 拍「${b.kw}」不在片头口播（第 1 句）里`); });
    const joined = norm([c.text.prefix, c.text.focus, c.text.turn, c.stamp?.lead?.text ?? '', c.text.verdict].join(''));
    if (!v.includes(joined)) errs.push(`片头主文案「${joined}」与口播第 1 句「${v}」不一致：片头文字必须逐字取自第 1 句`);
    if (opts.phraseMs) for (const b of beats) if (b.anchor) {
      const t = opts.phraseMs(b.anchor);
      if (t == null) errs.push(`拍「${b.kw}」的口播短语「${b.anchor}」在第 1 句里找不到`);
      else if (Math.abs(t - b.ms) > R.syncTolMs) errs.push(`拍「${b.kw}」拍点 ${b.ms}ms ≠ 口播短语「${b.anchor}」起点 ${t}ms（容差 ${R.syncTolMs}ms）`);
    }
  }
  return errs;
};
/** 当前拍下标（渲染与检查共用） */
export const beatIndexAt = (c: OpeningLike, ms: number) => { const b = beatsOf(c); let k = 0; b.forEach((x, i) => { if (ms >= x.ms) k = i; }); return k; };
