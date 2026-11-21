import {CANVAS, SAFE} from './grid.ts';
/**
 * 5.1.5 字幕强制单行（老板 t144u「不要是两行，一行就行了」）。
 * 单行上限按画面算：字幕胶囊以画面中心 960 为轴，左右都不能越出内容安全区（左 96 / 右 1632，右侧 288px 留给抖音按钮），
 * 再各留 48px 不贴边 → 胶囊最宽 2 × (min(960−96, 1632−960) − 48) = 1248px；
 * 去掉胶囊左右内边距 28×2 与描边 1×2 → 文字最宽 1190px；
 * 字号 40、字距 1.5 → 每个汉字 41.5px → 每组最多 floor(1190 / 41.5) = 28 字（半角按 0.55 字）。
 */
export const SUB_LINE = {size: 40, letterSpacing: 1.5, padX: 28, border: 1, edgeGap: 48, halfW: 0.55} as const;
export const SUB_PILL_MAX_PX = 2 * (Math.min(CANVAS.w / 2 - SAFE.left, SAFE.right - CANVAS.w / 2) - SUB_LINE.edgeGap);
export const SUB_TEXT_MAX_PX = SUB_PILL_MAX_PX - 2 * SUB_LINE.padX - 2 * SUB_LINE.border;
export const SUB_MAX_CHARS = Math.floor(SUB_TEXT_MAX_PX / (SUB_LINE.size + SUB_LINE.letterSpacing));
/** 单行字幕文字的渲染宽度（px）：汉字 = 字号，半角 = 0.55 字号，每字加字距。纯数据估算，plan:check 用它在几秒内拦超宽。 */
export const subTextPx = (t: string) => [...t].reduce((a, c) => a + (/[\x00-\xff]/.test(c) ? SUB_LINE.halfW : 1) * SUB_LINE.size + SUB_LINE.letterSpacing, 0);
// 字幕设计令牌（纯 TS，check-layout 也会读取）
/** 字幕设计参数（check-layout / plan:check 检查字号 38–46、强制单行、每组 ≤ SUB_MAX_CHARS 字、水平居中） */
export const SUB = {
  size: 40, maxChars: SUB_MAX_CHARS, lines: 1, bottom: 44, centerX: CANVAS.w / 2, // 画面水平中心（字号保持 40，不回 42）
  // 5.1：冷白字 + 冰蓝当前词；墨蓝半透明胶囊 + 轻外影，比 5.0 暖深底更清楚但不抢画面。
  color: '#F5F8FC', dim: 0.86, hi: '#9CC4FF',
  pill: 'linear-gradient(180deg, rgba(20,30,50,0.68), rgba(12,20,36,0.74))', border: 'rgba(168,198,255,0.18)',
  shadow: '0 6px 20px rgba(4,8,18,0.30), inset 0 1px 0 rgba(255,255,255,0.07)', blur: 'blur(10px) saturate(1.1)',
  textShadow: '0 1px 2px rgba(4,10,22,0.60), 0 0 10px rgba(4,10,22,0.22)',
  fadeIn: 5, rise: 8, fadeOut: 4, holdGapMs: 600,
};
/** 5.0 原样（仅供对比渲染，不用于出片）。 */
export const SUB_V50 = {
  ...SUB, color: '#F4EEE4', dim: 0.72, hi: '#F3D79E', pill: 'rgba(18,17,16,0.38)', border: 'rgba(243,215,158,0.14)',
  shadow: '0 8px 24px rgba(0,0,0,0.18)', blur: 'none', textShadow: '0 2px 10px rgba(0,0,0,0.45)',
};
