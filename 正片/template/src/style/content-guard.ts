// 5.1.2 卡面内容守卫（纯数据 + 纯函数，无 React 依赖：渲染期 sceneOf、静态检查脚本、DOM 检查共用同一份规则与阈值）。
// 起因：5.1.1 pitfallLens「交付实力怎么看」出现过——大圆里只有占位字「示意」、三张长条卡各一行短标题、卡面发棕发灰。
// 规则一句话：卡面里不许有占位字；大卡/大圆不许只有一两个字；长条卡要按内容定宽、带图标或补充行；卡面只用墨蓝·电光玻璃色。
import type {Pt} from './geom.ts';

/** 阈值（px @1920×1080）。检查脚本、DOM 检查、文档都引用这里，改数要同步 AGENTS.md 等文档的「卡面内容守卫」一节。 */
export const CARD_GUARD = {
  /** 大圆：外接框短边 ≥ 此值视为「大圆/枢纽圆」，必须带图标/图，或至少两行字（标题 + 补充行）。 */
  bigCircleD: 240,
  /** 大卡/大圆里只有 ≤ 此字数且没有图/图标/图表 → 失败（「示意」两个字就是典型）。 */
  bigShapeMinChars: 3,
  /** 长条卡：宽 ≥ stripW 或 宽高比 ≥ stripAspect。 */
  stripW: 600,
  stripAspect: 3,
  /** 长条卡内容太少：没有图标/图 且 只有一行 且 字数 < stripMinChars。 */
  stripMinChars: 8,
  /** 宽卡「太空」：宽 ≥ wideW 且 宽高比 ≥ wideAspect 时，内容（文字 + 图标）实占宽度 / 卡宽 必须 ≥ fillMin。 */
  wideW: 360,
  wideAspect: 2.4,
  fillMin: 0.40,
  /** 卡面填充 alpha 上限（再高就是实心块，不是玻璃）。 */
  solidAlpha: 0.9,
  /** 红色（风险）色相区间的最低 HSL 饱和度：低于它就发棕/发灰。 */
  clayMinSat: 0.35,
  /** 任何卡面填充的最低 HSL 饱和度：低于它是无蓝调的纯灰/炭黑实色块。 */
  grayMinSat: 0.12,
} as const;

import {isPlaceholderText} from './placeholder.ts';
export {isPlaceholderText};
const chars = (s: string) => [...String(s ?? '').replace(/\s/g, '')].length;
/** 近似字宽：CJK 全宽 1em，ASCII/数字 0.58em（只供布局估算；静态检查另有 opentype 实测）。 */
export const estWidth = (text: string, size: number) => [...String(text ?? '')].reduce((w, ch) => w + (/[\u2E80-\uFFFF]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.58), 0) * size;

export type GuardCard = {id: string; w: number; h: number; circle?: boolean; texts: string[]; hasVisual: boolean; /** 内容（文字+图标）的实占宽度，缺省则按 texts 估算 */ contentW?: number; viz?: boolean};

/** 单张卡的内容守卫。返回中文失败原因（空数组 = 通过）。静态（scene 几何）与 DOM（实测）共用。 */
export const cardContentFaults = (c: GuardCard, bigArea: number, label = c.id): string[] => {
  const out: string[] = [];
  const runs = c.texts.map((t) => t.trim()).filter(Boolean);
  const nChars = runs.reduce((n, t) => n + chars(t), 0);
  const area = c.w * c.h;
  for (const t of runs) if (isPlaceholderText(t)) out.push(`${label} 含占位文字「${t}」：卡面必须写真实内容（标题 + 补充说明），不能留「示意/占位/标题/文字/示例/XXX/TODO/lorem」`);
  if (c.viz) return out;
  const bigShape = area > bigArea || (c.circle && Math.min(c.w, c.h) >= CARD_GUARD.bigCircleD);
  if (bigShape && nChars < CARD_GUARD.bigShapeMinChars && !c.hasVisual) out.push(`${label} 是${c.circle ? '大圆' : '大卡'}（${Math.round(c.w)}×${Math.round(c.h)}）却只有 ${nChars} 个字且没有图/图标：大卡大圆要放图或图表，或缩成小节点`);
  if (c.circle && Math.min(c.w, c.h) >= CARD_GUARD.bigCircleD && !c.hasVisual && runs.length < 2) out.push(`${label} 大圆（直径 ${Math.round(Math.min(c.w, c.h))}）里只有一行字、没有图标：枢纽圆要放图标/图，或写成「标题 + 补充行」`);
  const strip = c.w >= CARD_GUARD.stripW || c.w / c.h >= CARD_GUARD.stripAspect;
  if (!c.circle && strip && !c.hasVisual && runs.length <= 1 && nChars < CARD_GUARD.stripMinChars) out.push(`${label} 长条卡（${Math.round(c.w)}×${Math.round(c.h)}，宽高比 ${(c.w / c.h).toFixed(1)}）只有一行短字「${runs[0] ?? ''}」且无图标/补充行：长条卡要带图标或补充行，宽度按内容定`);
  if (!c.circle && c.w >= CARD_GUARD.wideW && c.w / c.h >= CARD_GUARD.wideAspect) {
    const content = c.contentW ?? 0;
    if (content > 0 && content / c.w < CARD_GUARD.fillMin) out.push(`${label} 卡片太宽太空：内容实占 ${(content / c.w * 100).toFixed(0)}% 宽 < ${CARD_GUARD.fillMin * 100}%（${Math.round(c.w)}×${Math.round(c.h)}）：按内容收窄卡宽`);
  }
  return out;
};

export const isCirclePoly = (poly: Pt[]): boolean => {
  if (poly.length < 16) return false;
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const rs = poly.map((p) => Math.hypot(p[0] - cx, p[1] - cy)); const m = rs.reduce((a, b) => a + b, 0) / rs.length;
  return rs.every((r) => Math.abs(r - m) / m < 0.03);
};

/* ============ 墨蓝·电光玻璃色（卡面填充）守卫 ============ */
export type RGBA = {r: number; g: number; b: number; a: number};
export const parseRgba = (s: string): RGBA | null => {
  const m = String(s).match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)/);
  if (!m) return null;
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return {r: +m[1], g: +m[2], b: +m[3], a};
};
export const hsl = ({r, g, b}: RGBA) => {
  const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return {h: (h * 60 + 360) % 360, s, l};
};
/** 语义色相区间（度）。paper=蓝灰、navy=墨蓝、tea=深青、clay=酒红、champ=暮紫。 */
export const TONE_HUE: Record<string, [number, number]> = {paper: [195, 255], navy: [205, 240], tea: [170, 200], clay: [320, 360], champ: [235, 285]};
/** 一条卡面填充色是否合格（用于色板表与 DOM 实测）。返回中文原因。 */
export const fillFault = (c: RGBA, tone?: string): string | null => {
  if (c.a > CARD_GUARD.solidAlpha) return `卡面填充 alpha ${c.a} > ${CARD_GUARD.solidAlpha}：是实心块，不是玻璃`;
  const {h, s, l} = hsl(c);
  if (s < CARD_GUARD.grayMinSat) return `卡面填充 rgb(${c.r},${c.g},${c.b}) 饱和度 ${(s * 100).toFixed(0)}% < ${CARD_GUARD.grayMinSat * 100}%：无蓝调的纯灰/炭黑块，卡面要用墨蓝·电光玻璃色（灰中性也要带蓝调）`;
  if (h >= 10 && h <= 58 && s >= 0.12 && l < 0.55) return `卡面填充 rgb(${c.r},${c.g},${c.b}) 发棕（色相 ${h.toFixed(0)}°）：禁止棕色卡面`;
  const reddish = h >= 320 || h <= 10;
  if (reddish && s < CARD_GUARD.clayMinSat) return `红色卡面 rgb(${c.r},${c.g},${c.b}) 饱和度 ${(s * 100).toFixed(0)}% < ${CARD_GUARD.clayMinSat * 100}%：发棕发灰，风险红要用酒红`;
  if (tone && TONE_HUE[tone]) { const [a, b] = TONE_HUE[tone]; if (h < a || h > b) return `${tone} 填充色相 ${h.toFixed(0)}° 不在 ${a}–${b}°（墨蓝·电光语义色）`; }
  return null;
};
