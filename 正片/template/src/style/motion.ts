// 5.1.5 入场动效词表（纯函数，无 React）：方向跟版式阅读顺序走，透视 + 错峰 + 缓出轻过冲后精确落位。
// 规则：
//  1) 不透明度永远单调 0→1（= glassEnter），过冲只作用在位移/缩放/旋转上，到 FLY.frames 帧精确回到 0 偏移 —— 落位后不再动；
//  2) 方向 = 阅读顺序：左栏从左、右栏从右、上排从上、下排从下；同组按序号错峰（stagger）；
//  3) 每个版式只登记 1–2 种变体（MOTION_BY_LAYOUT），一期里变体轮换，不每张卡都花样。
import {GLASS_ENTER_FRAMES, glassEnter} from './tokens.ts';

export type Dir = 'up' | 'down' | 'left' | 'right';
export type MotionVariant = 'fly' | 'wipe' | 'blur' | 'depth' | 'flip' | 'count';
export const MOTION_VARIANTS: readonly MotionVariant[] = ['fly', 'wipe', 'blur', 'depth', 'flip', 'count'];
/** 过冲量（按位移/缩放的比例）与总时长（帧@30fps）。过冲只在 [peakAt, 1] 区间内回落。 */
export const FLY = {frames: 20, overshoot: 0.06, dist: 64, depth: 220, yaw: 16, flip: 62, blur: 14} as const;
export const FLY_SETTLE = FLY.frames; // 帧：到这里所有变换精确为 0（静态检查用）

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/** 缓出带轻过冲：t∈[0,1] → 0…(1+overshoot)…1；t=1 精确为 1。 */
export const backOut = (t: number, o: number = FLY.overshoot) => {
  t = clamp01(t); if (t === 1) return 1;
  const s = 1.70158 * (o / 0.1); // overshoot 0.1 ≈ 标准 backOut
  const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u;
};
const rawT = (frame: number, start: number, fps = 30) => clamp01((frame - start) / (FLY.frames * fps / 30));

export type MotionStyle = {opacity: number; transform: string; filter?: string; clipPath?: string; transformOrigin?: string};
/** 单张卡的入场样式。opacity 单调；transform 在 FLY.frames 时精确为 identity。 */
export const motionStyle = (variant: MotionVariant, frame: number, start: number, dir: Dir = 'up', fps = 30): MotionStyle => {
  const op = glassEnter(frame, start, variant === 'wipe' ? 'chip' : 'enter', fps);
  const t = rawT(frame, start, fps); const q = backOut(t); const r = 1 - q; // r：剩余偏移（可短暂为负 = 过冲）
  const sx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0, sy = dir === 'up' ? 1 : dir === 'down' ? -1 : 0;
  const settled = t >= 1;
  const P = 'perspective(1600px) ';
  if (settled) return {opacity: 1, transform: 'none'};
  switch (variant) {
    case 'wipe': {
      // 遮罩擦出：沿阅读方向揭开，卡本身只轻移 1/4 距离
      const e = 1 - glassEnter(frame, start, 'shaped', fps);
      const inset = dir === 'left' ? `0 ${e * 100}% 0 0` : dir === 'right' ? `0 0 0 ${e * 100}%` : dir === 'down' ? `0 0 ${e * 100}% 0` : `${e * 100}% 0 0 0`;
      return {opacity: op, clipPath: `inset(${inset} round 24px)`, transform: `translate3d(${sx * r * FLY.dist * 0.25}px,${sy * r * FLY.dist * 0.25}px,0)`};
    }
    case 'blur': {
      // 横移 + 由虚到实
      const b = Math.max(0, (1 - glassEnter(frame, start, 'soft', fps)) * FLY.blur);
      return {opacity: op, filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined, transform: `translate3d(${sx * r * FLY.dist * 1.4}px,${sy * r * FLY.dist}px,0)`};
    }
    case 'depth': {
      // 从景深里推出：Z 由远到近 + 缩放回 1（过冲时略大于 1 再回落）
      return {opacity: op, transform: `${P}translate3d(0,${sy * r * 18}px,${-r * FLY.depth}px) scale(${1 - 0.12 * r})`};
    }
    case 'flip': {
      // 翻入：绕卡的入场边翻正（上排绕顶边、下排绕底边）
      const ax = dir === 'left' || dir === 'right' ? 'Y' : 'X';
      const sign = dir === 'left' || dir === 'down' ? 1 : -1;
      const origin = dir === 'left' ? '0% 50%' : dir === 'right' ? '100% 50%' : dir === 'down' ? '50% 100%' : '50% 0%';
      return {opacity: op, transformOrigin: origin, transform: `${P}rotate${ax}(${sign * r * FLY.flip}deg) translate3d(${sx * r * 14}px,${sy * r * 14}px,0)`};
    }
    case 'count':
    case 'fly':
    default: {
      // 透视飞入：沿阅读方向 + 侧转 + 景深，轻过冲后落位共面
      const yaw = sx * FLY.yaw, pitch = sy * FLY.yaw * 0.45;
      return {opacity: op, transform: `${P}translate3d(${sx * r * FLY.dist}px,${sy * r * FLY.dist * 0.7}px,${-r * FLY.depth * 0.45}px) rotateY(${yaw * r}deg) rotateX(${pitch * r}deg)`};
    }
  }
};
/** 数字滚动：按入场进度把数字从 0 数到目标，保留原字面格式（小数位、千分位、% 等）。到位精确等于原文。 */
export const countUp = (v: string, frame: number, start: number, fps = 30, frames = 26) => {
  const m = String(v).match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/); if (!m) return v;
  const t = clamp01((frame - start) / (frames * fps / 30)); if (t >= 1) return v;
  const target = Number(m[2]); const dec = (m[2].split('.')[1] ?? '').length; const e = 1 - Math.pow(1 - t, 3);
  const n = (target * e).toFixed(dec); return `${m[1]}${dec ? n : String(Math.round(Number(n))).padStart(m[2].length > 1 && m[2].startsWith('0') ? m[2].length : 1, '0')}${m[3]}`;
};
/** 每个小卡版式的变体（角色 → 变体）。方向在视图里按位置给。 */
export const MOTION_BY_LAYOUT: Record<string, Record<string, MotionVariant>> = {
  dataCluster: {hero: 'depth', item: 'fly', pill: 'wipe'},
  comparePair: {side: 'fly', row: 'wipe', verdict: 'depth'},
  stepRail: {step: 'flip'},
  riskGroup: {head: 'depth', item: 'blur', pill: 'wipe'},
  noteGroup: {quote: 'wipe', note: 'fly'},
  imageFrame3D: {frame: 'depth', caption: 'fly'},
  imageSwap: {frame: 'blur', caption: 'wipe'},
  imageGrid: {cell: 'flip', caption: 'wipe'},
  imageCutout: {cutout: 'depth', caption: 'fly'},
};
/** 静态自检：所有变体在 FLY.frames 帧精确落位、不透明度单调。返回失败原因。 */
export const motionFaults = (): string[] => {
  const out: string[] = [];
  for (const v of MOTION_VARIANTS) for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
    let prev = -1;
    for (let f = 0; f <= FLY.frames + 4; f++) {
      const s = motionStyle(v, f, 0, d); if (s.opacity < prev - 1e-9) out.push(`${v}/${d} 第${f}帧不透明度回落`); prev = s.opacity;
      if (f >= FLY_SETTLE && (s.transform !== 'none' || s.opacity !== 1 || s.filter || s.clipPath)) out.push(`${v}/${d} 第${f}帧还没落位`);
    }
  }
  if (Math.max(...Array.from({length: 41}, (_, i) => backOut(i / 40))) > 1 + FLY.overshoot * 1.6) out.push('过冲幅度超标');
  if (countUp('8.6', 999, 0) !== '8.6' || countUp('02', 999, 0) !== '02') out.push('数字滚动落位与原文不一致');
  if (Object.keys(GLASS_ENTER_FRAMES).length < 4) out.push('入场时长表缺项');
  return out;
};
