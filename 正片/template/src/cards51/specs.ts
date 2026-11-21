// 5.1.5 小卡几何（纯数据 + 纯函数，无 React）：视图渲染与 plan:check 文字适配检查共用同一份。
// 小Lin说式信息层级：每张卡只有「一个主词/主数 + 最多一行短副句」；不放眉标、标签胶囊、编号圆、装饰图标、「数据为示例」。
// 卡片尺寸按实测文字反推（fitCard）：内边距随主字号缩放 —— 小卡不会塞大字，大卡不会只剩小字。
import {layoutRects} from '../style/layouts.ts';
import {CARD_TYPE, type CardSize, type FogTone} from '../style/tokens.ts';
import {estWidth} from '../style/content-guard.ts';
import {MOTION_BY_LAYOUT, type Dir, type MotionVariant} from '../style/motion.ts';

export type TextRole = 'main' | 'sub';
export type TextSpec = {role: TextRole; text: string; px: number; font: 'title' | 'num' | 'body'; unit?: string; unitPx?: number};
export type CardSpec = {key: string; x: number; y: number; w: number; h: number; size: CardSize; tone: FogTone; dir: Dir; motion: MotionVariant;
  texts: TextSpec[]; img?: string; imgH?: number; pill?: boolean; radius: number; padX: number; padY: number};
/** 文字适配规则（plan:check 读这里）。 */
export const CARD_TEXT_RULE = {maxItems: 2, padX: 0.56, padY: 0.3, gap: 0.22, fillMin: 0.5, mainChars: 9, subChars: 12, lh: 1.28, numLh: 1.05} as const;

const lineH = (t: TextSpec) => t.px * (t.font === 'num' ? CARD_TEXT_RULE.numLh : CARD_TEXT_RULE.lh);
export const textW = (t: TextSpec) => estWidth(t.text, t.px) + (t.unit ? 8 + estWidth(t.unit, t.unitPx ?? t.px * 0.4) : 0);
/** 按文字反推卡尺寸：内边距 = 主字号 × 系数。 */
export const fitCard = (texts: TextSpec[], extraH = 0) => {
  const main = texts.find((t) => t.role === 'main') ?? texts[0];
  const padX = Math.round(main.px * CARD_TEXT_RULE.padX), padY = Math.round(main.px * CARD_TEXT_RULE.padY);
  const gap = texts.length > 1 ? Math.round(main.px * CARD_TEXT_RULE.gap) : 0;
  const w = Math.ceil(Math.max(...texts.map(textW)) + padX * 2);
  const h = Math.ceil(texts.reduce((a, t) => a + lineH(t), 0) + gap + padY * 2 + extraH);
  return {w, h, padX, padY, gap};
};
const T = CARD_TYPE;
const main = (text: string, size: CardSize, font: 'title' | 'num' = 'title', unit?: string): TextSpec => ({role: 'main', text: String(text ?? ''), px: font === 'num' ? T[size].value : T[size].title, font, unit, unitPx: unit ? T[size].caption : undefined});
const sub = (text: string | undefined, size: CardSize): TextSpec[] => text ? [{role: 'sub', text: String(text), px: T[size].caption, font: 'body'}] : [];
const card = (key: string, size: CardSize, tone: FogTone, dir: Dir, motion: MotionVariant, texts: TextSpec[], at: {x: number; y: number}, w?: number, h?: number, extra: Partial<CardSpec> = {}): CardSpec => {
  const f = fitCard(texts, extra.imgH ?? 0);
  return {key, size, tone, dir, motion, texts, x: Math.round(at.x), y: Math.round(at.y), w: Math.max(w ?? 0, f.w), h: Math.max(h ?? 0, f.h), radius: T[size].radius, padX: f.padX, padY: f.padY, ...extra};
};
/** 同一列卡等宽（取最长），竖向在 [y0, y0+H] 内居中排布。 */
const column = (cs: CardSpec[], y0: number, H: number, gap: number) => {
  const w = Math.max(...cs.map((c) => c.w)), hh = Math.max(...cs.map((c) => c.h)); cs.forEach((c) => c.h = hh); const total = cs.reduce((a, c) => a + c.h, 0) + gap * (cs.length - 1);
  let y = y0 + Math.max(0, (H - total) / 2); for (const c of cs) { c.w = w; c.y = Math.round(y); y += c.h + gap; } return cs;
};
const centerY = (c: CardSpec, mid: number) => { c.y = Math.round(mid - c.h / 2); return c; };
const pillOf = (t: string | undefined, tone: FogTone, at: {x: number; y: number}, motion: MotionVariant): CardSpec[] =>
  t ? [card('pill', 'S', tone, 'left', motion, [main(t, 'S')], at, 0, 0, {pill: true, radius: 999})] : [];

/** 小卡组合 5 款的卡几何。key：hero/item0…、L/R/rowL0…、step0…、head/item0…、quote/note0…、pill/verdict。 */
export const cards51Specs = (layout: string, d: any = {}): CardSpec[] => centerGroup(layout, rawSpecs(layout, d));
/** 整组在内容区（x 96–1632，y 248–880）里居中：组合不再挤在左上角。 */
const centerGroup = (layout: string, cs: CardSpec[]) => {
  if (!cs.length) return cs;
  const x0 = Math.min(...cs.map((c) => c.x)), x1 = Math.max(...cs.map((c) => c.x + c.w)), y0 = Math.min(...cs.map((c) => c.y)), y1 = Math.max(...cs.map((c) => c.y + c.h));
  const dx = layout === 'stepRail' || layout === 'comparePair' ? 0 : Math.round((96 + 1632) / 2 - (x0 + x1) / 2), dy = Math.round(Math.min(880 - 24 - y1, Math.max(248 + 16 - y0, (248 + 880) / 2 - (y0 + y1) / 2)));
  return cs.map((c) => ({...c, x: c.x + dx, y: c.y + dy}));
};
const rawSpecs = (layout: string, d: any = {}): CardSpec[] => {
  const M = MOTION_BY_LAYOUT[layout] ?? {};
  switch (layout) {
    case 'dataCluster': {
      const R = layoutRects('dataCluster'); const items = (d.items ?? []).slice(0, 3);
      const iz: CardSize = 'M';
      const hero = card('hero', 'L', 'navy', 'left', M.hero, [main(d.hero?.v, 'L', 'num', d.hero?.unit), ...sub(d.hero?.sub ?? d.hero?.label, 'L')], {x: R.hero.x, y: 0});
      const its = column(items.map((it: any, i: number) => card(`item${i}`, iz, (it.tone ?? ['paper', 'tea', 'champ'][i]) as FogTone, 'right', M.item, [main(it.v, iz, /\d/.test(String(it.v)) ? 'num' : 'title'), ...sub(it.k, iz)], {x: R.items.x, y: 0})), R.items.y, R.items.h, 22);
      const mid = its.length ? (its[0].y + its[its.length - 1].y + its[its.length - 1].h) / 2 : R.hero.y + R.hero.h / 2;
      centerY(hero, d.pill ? mid - 46 : mid);
      return [hero, ...its, ...pillOf(d.pill?.t, d.pill?.tone ?? 'clay', {x: R.hero.x, y: hero.y + hero.h + 28}, M.pill)];
    }
    case 'comparePair': {
      const R = layoutRects('comparePair'); const rows = (k: 'L' | 'R') => (d[k]?.rows ?? []).slice(0, 2);
      const imgH = 188;
      const side = (k: 'L' | 'R', tone: FogTone, dir: Dir) => card(k, 'L', tone, dir, M.side, [main(d[k]?.name, 'L')], {x: R[k].x, y: R[k].y}, R[k].w, 0, {img: d[k]?.img, imgH: d[k]?.img ? imgH : 0});
      const L = side('L', d.L?.tone ?? 'paper', 'left'), Rr = side('R', d.R?.tone ?? 'navy', 'right'); const hh = Math.max(L.h, Rr.h); L.h = Rr.h = hh;
      const chips = (k: 'L' | 'R', base: CardSpec) => { const rs = rows(k); const cs = rs.map(([kk, v]: [string, string], i: number) => card(`row${k}${i}`, 'S', base.tone, base.dir, M.row, [main(v, 'S'), ...sub(kk, 'S')], {x: 0, y: base.y + base.h + 24}));
        const w = Math.max(0, ...cs.map((c: CardSpec) => c.w)), h = Math.max(0, ...cs.map((c: CardSpec) => c.h)), span = cs.length * w + 20 * (cs.length - 1), x0 = base.x + (base.w - span) / 2;
        cs.forEach((c: CardSpec, i: number) => { c.w = w; c.h = h; c.x = Math.round(x0 + i * (w + 20)); }); return cs; };
      const cl = chips('L', L), cr = chips('R', Rr); const bottom = Math.max(L.y + L.h, ...[...cl, ...cr].map((c) => c.y + c.h));
      const v = d.verdict?.t ? [card('verdict', 'S', d.verdict?.tone ?? 'tea', 'up', M.verdict, [main(d.verdict.t, 'S')], {x: 0, y: bottom + 34}, 0, 0, {pill: true, radius: 999})] : [];
      v.forEach((c) => { c.x = Math.round(R.verdict.x + (R.verdict.w - c.w) / 2); });
      return [L, ...cl, Rr, ...cr, ...v];
    }
    case 'stepRail': {
      const R = layoutRects('stepRail').rail; const steps = (d.steps ?? []).slice(0, 4); const n = steps.length;
      const cs = steps.map((it: any, i: number) => card(`step${i}`, 'M', (it.tone ?? ['paper', 'navy', 'champ', 'tea'][i]) as FogTone, i % 2 ? 'down' : 'up', M.step, [main(it.k, 'M'), ...sub(it.s, 'M')], {x: 0, y: 0}));
      const w = Math.max(...cs.map((c: CardSpec) => c.w)), h = Math.max(...cs.map((c: CardSpec) => c.h)), gap = Math.min(80, (R.w - n * w) / Math.max(1, n - 1));
      const span = n * w + (n - 1) * gap, x0 = R.x + (R.w - span) / 2, midY = R.y + R.h / 2;
      cs.forEach((c: CardSpec, i: number) => { c.w = w; c.h = h; c.x = Math.round(x0 + i * (w + gap)); c.y = Math.round(i % 2 ? midY + 22 : midY - 22 - h); });
      return cs;
    }
    case 'riskGroup': {
      const R = layoutRects('riskGroup'); const items = (d.items ?? []).slice(0, 3);
      const head = card('head', 'L', 'clay', 'left', M.head, [main(d.head?.n, 'L', 'num', d.head?.unit ?? '个坑'), ...sub(d.head?.t, 'L')], {x: R.head.x, y: 0});
      const its = column(items.map(([k, v]: [string, string], i: number) => card(`item${i}`, 'M', i === items.length - 1 ? 'clay' : 'paper', 'right', M.item, [main(k, 'M'), ...sub(v, 'M')], {x: R.list.x + i * 36, y: 0})), R.list.y, R.list.h, 24);
      const mid = (its[0]?.y ?? R.head.y) + ((its.length ? its[its.length - 1].y + its[its.length - 1].h : R.head.y + R.head.h) - (its[0]?.y ?? R.head.y)) / 2;
      centerY(head, mid);
      const lastB = Math.max(head.y + head.h, ...its.map((c) => c.y + c.h));
      return [head, ...its, ...pillOf(d.pill?.t, d.pill?.tone ?? 'tea', {x: R.list.x, y: lastB + 30}, M.pill)];
    }
    case 'noteGroup': {
      const R = layoutRects('noteGroup'); const notes = (d.notes ?? []).slice(0, 3);
      const q = card('quote', 'L', 'champ', 'left', M.quote, [main(d.quote?.t, 'L'), ...sub(d.quote?.s, 'L')], {x: R.quote.x, y: 0});
      const ns = column(notes.map(([k, v]: [string, string], i: number) => card(`note${i}`, 'M', (['paper', 'navy', 'tea'][i]) as FogTone, 'right', M.note, [main(k, 'M'), ...sub(v, 'M')], {x: R.notes.x + (i % 2) * 56, y: 0})), R.notes.y, R.notes.h, 26);
      centerY(q, ns.length ? (ns[0].y + ns[ns.length - 1].y + ns[ns.length - 1].h) / 2 : R.quote.y + R.quote.h / 2);
      return [q, ...ns];
    }
    default: return [];
  }
};
/** 文字适配 + 信息层级检查（plan:check / check:cards）。返回中文失败原因。 */
export const cardTextFaults = (layout: string, d: any, id = layout): string[] => {
  const out: string[] = [];
  for (const c of cards51Specs(layout, d)) {
    const w = `${id}/${c.key}`;
    if (c.texts.length > CARD_TEXT_RULE.maxItems) out.push(`${w}: 卡内文字 ${c.texts.length} 层 > ${CARD_TEXT_RULE.maxItems}（只留主词 + 一行副句）`);
    if (!c.texts.some((t) => t.role === 'main' && t.text.trim())) out.push(`${w}: 没有主词/主数`);
    for (const t of c.texts) {
      const n = [...t.text.replace(/\s/g, '')].length, max = t.role === 'main' ? CARD_TEXT_RULE.mainChars : CARD_TEXT_RULE.subChars;
      if (n > max) out.push(`${w}: ${t.role === 'main' ? '主词' : '副句'}「${t.text}」${n} 字 > ${max}（拆卡或缩短）`);
    }
    const inner = c.w - c.padX * 2, widest = Math.max(...c.texts.map(textW));
    if (widest > inner + 1) out.push(`${w}: 文字 ${Math.round(widest)}px 放不进卡内宽 ${Math.round(inner)}px`);
    if (!c.img && !c.pill && widest / inner < CARD_TEXT_RULE.fillMin) out.push(`${w}: 文字只占卡宽 ${Math.round(100 * widest / inner)}%（< ${CARD_TEXT_RULE.fillMin * 100}%），大卡里字太小`);
    const mainPx = c.texts.find((t) => t.role === 'main')?.px ?? 0;
    if (mainPx > CARD_TYPE[c.size].value) out.push(`${w}: 主字号 ${mainPx} 超过 ${c.size} 档上限`);
    if (c.x < 96 || c.x + c.w > 1632 + 1 || c.y < 248 || c.y + c.h > 880 + 1) out.push(`${w}: 卡 (${c.x},${c.y},${c.w}×${c.h}) 超出内容安全区`);
  }
  return out;
};
