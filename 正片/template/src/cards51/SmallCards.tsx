// 5.1 小卡动态组合：把「大卡+少量字」拆成 2–4 张小卡，错峰入场后停稳（无回弹、无扫光、无呼吸）。
// 颜色按语义：navy=数据 / tea=决策 / clay=风险 / champ=重点 / paper=中性。材质沿用薄玻璃，换成科技色板。
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {toneMat} from '../style/components';
import {PropertyArt} from '../style/illustrations';
import {CARD_TYPE, FONT, glassEnter, type CardSize, type FogTone} from '../style/tokens';
import {linkProgress} from '../style/sequence.ts';

type From = 'up' | 'left' | 'right' | 'down';
const OFF = 28;
const shift = (from: From, p: number, off = OFF) => {
  const d = (1 - p) * off;
  return from === 'left' ? `translateX(${-d}px)` : from === 'right' ? `translateX(${d}px)` : from === 'down' ? `translateY(${-d}px)` : `translateY(${d}px)`;
};
/** 小卡尺寸档位（S/M/L，见 tokens.ts CARD_TYPE）。Tile 通过 context 下发给卡内 Title/Big/Label/Body，字号、内边距、行高全部来自字阶表。 */
export const CardSizeCtx = React.createContext<CardSize>('M');
export const useCardType = () => CARD_TYPE[React.useContext(CardSizeCtx)];
export const Tile: React.FC<{x: number; y: number; w: number; h: number; tone: FogTone; at: number; size: CardSize; from?: From; off?: number; r?: number; pad?: number | string;
  active?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, tone, at, size, from = 'up', off, r, pad, active, children, style}) => {
  const f = useCurrentFrame();
  const p = glassEnter(f, at, 'enter');
  const mat = toneMat(tone);
  const T = CARD_TYPE[size];
  return <CardSizeCtx.Provider value={size}><div data-card={size} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r ?? T.radius, boxSizing: 'border-box', padding: pad ?? `${T.padY}px ${T.padX}px`,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', opacity: p, transform: shift(from, p, off), ...mat,
    ...(active != null ? {boxShadow: `${mat.boxShadow}, 0 0 0 ${1.5 * active}px color-mix(in srgb, var(--acc-raw) ${Math.round(80 * active)}%, transparent), 0 0 ${26 * active}px color-mix(in srgb, var(--acc-raw) ${Math.round(34 * active)}%, transparent)`} : {}),
    ...style}}>{children}</div></CardSizeCtx.Provider>;
};
const T: React.CSSProperties = {fontFamily: FONT.title, fontWeight: 900, color: 'var(--ink)'};
const B: React.CSSProperties = {fontFamily: FONT.body, fontWeight: 700, color: 'var(--sub)'};
const N: React.CSSProperties = {fontFamily: FONT.num, fontWeight: 700, lineHeight: 1.05, color: 'var(--acc-hi)', letterSpacing: -1};
/** 标签（灰蓝小字，永远 label 档） */
export const Label: React.FC<{children: React.ReactNode; dot?: boolean}> = ({children, dot = true}) => { const t = useCardType();
  return <div style={{...B, fontSize: t.label, lineHeight: t.lh, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: 1}}>
    {dot && <span style={{width: 8, height: 8, borderRadius: 2, background: 'var(--acc-raw)'}} />}{children}</div>; };
/** 数值（value 档，数字色 = 冰蓝高亮）；unit 用 caption 档 */
export const Big: React.FC<{v: string; unit?: string}> = ({v, unit}) => { const t = useCardType();
  return <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}><span style={{...N, fontSize: t.value}}>{v}</span>{unit && <span style={{...B, fontSize: t.caption, lineHeight: t.lh, color: 'var(--ink)'}}>{unit}</span>}</div>; };
/** 卡标题（title 档） */
export const Title: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => { const t = useCardType();
  return <div style={{...T, fontSize: t.title, lineHeight: t.lh, ...style}}>{children}</div>; };
/** 说明（caption 档） */
export const Body: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => { const t = useCardType();
  return <div style={{...B, fontSize: t.caption, lineHeight: t.lh, ...style}}>{children}</div>; };
/** 带数值的行文（Arial 数字，value 档） */
export const Val: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => { const t = useCardType();
  return <div style={{fontFamily: 'ArialB, Health', fontWeight: 700, color: 'var(--ink)', fontSize: t.value, lineHeight: t.lh, whiteSpace: 'nowrap', ...style}}>{children}</div>; };
export const Icon: React.FC<{kind: string; size?: number}> = ({kind, size}) => { const t = useCardType(); const z = size ?? t.icon;
  return <div style={{width: z, height: z, borderRadius: Math.round(z * 0.26), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'color-mix(in srgb, var(--acc-raw) 18%, transparent)', border: '1px solid color-mix(in srgb, var(--acc-raw) 40%, transparent)'}}>
    <div style={{width: z * 0.78, height: z * 0.6}}><PropertyArt kind={kind} color="var(--acc-hi)" /></div></div>; };
/** 胶囊小卡（结论/标签）：S 档字阶，圆点里的符号用冰蓝字（不用黑字） */
export const Pill: React.FC<{x: number; y: number; tone: FogTone; at: number; children: React.ReactNode; icon?: string; from?: From; inline?: boolean}> = ({x, y, tone, at, children, icon, from = 'up', inline}) => {
  const f = useCurrentFrame(); const p = glassEnter(f, at, 'chip'); const t = CARD_TYPE.S;
  return <div data-card="S" style={{position: inline ? 'relative' : 'absolute', left: x, top: y, display: 'inline-flex', alignItems: 'center', gap: 14, whiteSpace: 'nowrap', padding: `10px ${t.padX}px 10px 14px`,
    borderRadius: 999, opacity: p, transform: shift(from, p), ...toneMat(tone)}}>
    <span data-deco style={{width: 40, height: 40, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--acc-raw) 30%, transparent)',
      border: '1.5px solid var(--acc-raw)', color: 'var(--acc-hi)', fontFamily: FONT.num, fontWeight: 700, fontSize: t.label, lineHeight: 1}}>{icon ?? '✓'}</span>
    <span style={{...B, fontSize: t.title, lineHeight: t.lh, color: 'var(--ink)', whiteSpace: 'nowrap'}}>{children}</span></div>;
};
/** 细连线：源卡（a）与目标卡（b）都停稳后，从源向目标画出，画完即停（时刻见 style/sequence.ts）。 */
export const Link: React.FC<{pts: [number, number][]; a: number; b: number; id?: string; from?: number | 'hub'; to?: number | 'hub'; dur?: number; fromKey?: string; toKey?: string;
  fromBox?: {x: number; y: number; w: number; h: number}; toBox?: {x: number; y: number; w: number; h: number}; color?: string}> =
  ({pts, a, b, id, from, to, dur, fromKey, toKey, fromBox, toBox, color = 'rgba(200,214,236,0.55)'}) => {
  const f = useCurrentFrame(); const p = linkProgress(f, a, b, {id, from, to, dur, fromKey, toKey, pts, fromBox, toBox});
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');
  const e = pts[pts.length - 1];
  return <svg data-deco style={{position: 'absolute', inset: 0, width: 1920, height: 1080, overflow: 'visible', pointerEvents: 'none'}}>
    <path d={d} fill="none" strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" data-link={id} strokeDashoffset={1 - p} style={{stroke: color}} />
    {p > 0.98 && <circle cx={e[0]} cy={e[1]} r={4.5} style={{fill: color}} />}
  </svg>;
};
