import {CANVAS} from './grid.ts';
// 字幕设计令牌（纯 TS，check-layout 也会读取）
/** 字幕设计参数（check-layout 会检查字号范围 38–46、单行 ≤18 字、水平居中） */
export const SUB = {
  size: 40, maxChars: 18, bottom: 44, centerX: CANVAS.w / 2, // 画面水平中心（字号保持 40，不回 42）
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
