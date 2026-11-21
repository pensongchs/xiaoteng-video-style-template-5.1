// 5.1.5 图片动效组件（纯数据 + 纯函数）：几何、锚点键、文字与生图提示词规则。视图在 ImageViews.tsx。
// 图来自文案关键词：每张图都写 {src, kw, prompt}——kw 取自本镜口播，prompt 必须含 kw（生图钩子 scripts/image-prompts.mjs 据此出清单）。
import {CARD_TYPE, type CardSize, type FogTone} from '../style/tokens.ts';
import {fitCard, CARD_TEXT_RULE, type CardSpec, type TextSpec} from '../cards51/specs.ts';
import {MOTION_BY_LAYOUT, type Dir} from '../style/motion.ts';

import {IMAGE_LAYOUTS} from '../style/layouts.ts';
export {IMAGE_LAYOUTS};
export type ImageLayout = typeof IMAGE_LAYOUTS[number];
export type ImgRef = {src: string; kw: string; prompt: string; cap?: string; sub?: string};
/** 规划规则（plan:check 读这里）。 */
export const IMAGE_RULE = {minShare: 1 / 3, maxPureCardRun: 2, maxPerEpisode: 2} as const;
export const R_FRAME = 30; // 图框圆角

const main = (t: string, size: CardSize): TextSpec => ({role: 'main', text: String(t ?? ''), px: CARD_TYPE[size].title, font: 'title'});
const sub = (t: string | undefined, size: CardSize): TextSpec[] => t ? [{role: 'sub', text: String(t), px: CARD_TYPE[size].caption, font: 'body'}] : [];
export const caption = (key: string, cap: string, s: string | undefined, x: number, y: number, tone: FogTone, dir: Dir, size: CardSize = 'M', motion = 'fly' as any): CardSpec => {
  const texts = [main(cap, size), ...sub(s, size)]; const f = fitCard(texts);
  return {key, x: Math.round(x), y: Math.round(y), w: f.w, h: f.h, size, tone, dir, motion, texts, radius: CARD_TYPE[size].radius, padX: f.padX, padY: f.padY};
};
export type Frame = {key: string; x: number; y: number; w: number; h: number; yaw: number; img: ImgRef};
/** 每个图片版式的图框 + 说明小卡几何。 */
export const imageSpecs = (layout: string, d: any = {}): {frames: Frame[]; cards: CardSpec[]} => {
  const M = MOTION_BY_LAYOUT[layout] ?? {};
  switch (layout) {
    case 'imageFrame3D': {
      const fr: ImgRef[] = (d.frames ?? []).slice(0, 2);
      if (fr.length < 2) {
        const F = {key: 'f0', x: 96, y: 276, w: 940, h: 560, yaw: 8, img: fr[0]};
        const c = caption('cap0', fr[0]?.cap ?? '', fr[0]?.sub, 0, 0, 'navy', 'right', 'L', M.caption); c.x = 1036 + 80; c.y = Math.round(F.y + F.h / 2 - c.h / 2);
        return {frames: [F], cards: [c]};
      }
      const w = 720, h = 500, y = 286;
      const frames = fr.map((img, i) => ({key: `f${i}`, x: i ? 1632 - w : 96, y, w, h, yaw: i ? -9 : 9, img}));
      const cards = fr.map((img, i) => { const c = caption(`cap${i}`, img.cap ?? '', img.sub, 0, 0, i ? 'champ' : 'navy', i ? 'right' : 'left', 'M', M.caption);
        c.x = i ? frames[i].x + frames[i].w - c.w - 40 : frames[i].x + 40; c.y = frames[i].y + frames[i].h - Math.round(c.h * 0.45); return c; });
      return {frames, cards};
    }
    case 'imageSwap': {
      const im: ImgRef[] = (d.images ?? []).slice(0, 4);
      const F = {key: 'f', x: 96, y: 268, w: 886, h: 600, yaw: 6, img: im[0]};
      const cs = im.map((img, i) => caption(`cap${i}`, img.cap ?? '', img.sub, 1136, 0, (['navy', 'tea', 'champ', 'paper'][i]) as FogTone, 'right', 'M', M.caption));
      const w = Math.max(...cs.map((c) => c.w)), hh = Math.max(...cs.map((c) => c.h)), gap = 22, total = cs.length * hh + gap * (cs.length - 1);
      cs.forEach((c, i) => { c.w = w; c.h = hh; c.y = Math.round(F.y + (F.h - total) / 2 + i * (hh + gap)); });
      return {frames: im.map((img, i) => ({...F, key: `f${i}`, img})), cards: cs};
    }
    case 'imageGrid': {
      const cells: ImgRef[] = (d.cells ?? []).slice(0, 4); const n = Math.max(1, cells.length), gap = 32;
      const w = Math.floor((1536 - gap * (n - 1)) / n), h = n > 3 ? 450 : 470, y = 272;
      const frames = cells.map((img, i) => ({key: `f${i}`, x: 96 + i * (w + gap), y, w, h, yaw: 0, img}));
      const cards = cells.map((img, i) => { const c = caption(`cap${i}`, img.cap ?? '', img.sub, 0, y + h + 22, (['paper', 'navy', 'tea', 'champ'][i]) as FogTone, 'up', 'M', M.caption); c.x = Math.round(frames[i].x + (w - c.w) / 2); return c; });
      return {frames, cards};
    }
    case 'imageCutout': {
      const photo: ImgRef = d.photo, cut: ImgRef = d.cutout;
      const P = {key: 'photo', x: 470, y: 280, w: 700, h: 470, yaw: 7, img: photo}, C = {key: 'cutout', x: 96, y: 410, w: 880, h: 460, yaw: 0, img: cut};
      const c = caption('cap0', d.cap?.t ?? '', d.cap?.s, 1236, 0, 'navy', 'right', 'L', M.caption); c.y = Math.round(P.y + P.h / 2 - c.h / 2 - 40);
      const chips = (d.chips ?? []).slice(0, 2).map((t: string, i: number) => { const k = caption(`chip${i}`, t, undefined, 1236, c.y + c.h + 24 + i * 92, i ? 'tea' : 'paper', 'right', 'S', 'wipe'); k.radius = 999; k.pill = true; return k; });
      return {frames: [P, C], cards: [c, ...chips]};
    }
    default: return {frames: [], cards: []};
  }
};
/** 锚点键（口播顺序）。 */
export const imageSeqKeys = (layout: string, d: any = {}) => {
  const n = layout === 'imageFrame3D' ? Math.min(2, (d.frames ?? []).length) : layout === 'imageSwap' ? Math.min(4, (d.images ?? []).length) : layout === 'imageGrid' ? Math.min(4, (d.cells ?? []).length) : layout === 'imageCutout' ? 1 + Math.min(2, (d.chips ?? []).length) : 0;
  return Array.from({length: n}, (_, i) => `r${i}`);
};
export const imageRefsOf = (layout: string, d: any = {}): ImgRef[] =>
  layout === 'imageFrame3D' ? (d.frames ?? []) : layout === 'imageSwap' ? (d.images ?? []) : layout === 'imageGrid' ? (d.cells ?? []) : layout === 'imageCutout' ? [d.photo, d.cutout].filter(Boolean) : [];
const norm = (t: string) => String(t ?? '').replace(/[\s·，。！？；：、,.!?;:…—「」“”"'*]/g, '');
/** 生图提示词 + 文字规则。vo = 本镜口播（有就核对 kw 出处）。 */
export const imageFaults = (layout: string, d: any, vo?: string, id = layout): string[] => {
  const out: string[] = []; const refs = imageRefsOf(layout, d);
  if (!refs.length) out.push(`${id}: 图片版式没有图`);
  refs.forEach((r, i) => {
    const w = `${id}/图${i + 1}`;
    if (!r?.src) out.push(`${w}: 缺 src`);
    if (!r?.kw?.trim()) out.push(`${w}: 缺关键词 kw（图必须按本镜口播关键词生成/选取）`);
    else {
      if (!r.prompt || !norm(r.prompt).includes(norm(r.kw))) out.push(`${w}: 生图提示词 prompt 没有包含关键词「${r.kw}」`);
      if (vo != null && !norm(vo).includes(norm(r.kw))) out.push(`${w}: 关键词「${r.kw}」不在本镜口播里`);
    }
  });
  for (const c of imageSpecs(layout, d).cards) {
    if (c.texts.length > CARD_TEXT_RULE.maxItems) out.push(`${id}/${c.key}: 说明卡文字 ${c.texts.length} 层 > ${CARD_TEXT_RULE.maxItems}`);
    for (const t of c.texts) { const n = [...t.text.replace(/\s/g, '')].length, max = t.role === 'main' ? CARD_TEXT_RULE.mainChars : CARD_TEXT_RULE.subChars; if (n > max) out.push(`${id}/${c.key}: 「${t.text}」${n} 字 > ${max}`); }
    if (!c.texts.some((t) => t.role === 'main' && t.text.trim())) out.push(`${id}/${c.key}: 说明卡没有主词`);
    if (c.x + c.w > 1632 + 1 || c.y + c.h > 880 + 1) out.push(`${id}/${c.key}: 说明卡超出内容安全区`);
  }
  return out;
};
