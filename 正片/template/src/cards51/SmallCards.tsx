// 5.1.5 小卡：一个主词/主数 + 最多一行副句（小Lin说式单层级）；卡按文字实测反推尺寸（specs.ts fitCard）。
// 入场走 style/motion.ts 词表（飞入/擦出/虚实/景深/翻入/数字滚动），方向跟阅读顺序；不透明度单调，过冲只在位移上，20 帧精确落位后不再动。
// 颜色按语义：navy=数据 / tea=决策 / clay=风险 / champ=重点 / paper=中性；饰线 = 由圆角推出的同心内光缝（CardOrnament）。
import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {toneMat} from '../style/components';
import {PropertyArt} from '../style/illustrations';
import {CardOrnament, roleOfTone} from '../style/CardOrnament';
import {LightTrail, pathFromPts} from '../style/LightTrail';
import {CARD_TYPE, FONT, IMG_FRAME, layerEnter, type CardSize, type FogTone} from '../style/tokens';
import {motionStyle, countUp, type Dir, type MotionVariant} from '../style/motion.ts';
import {linkProgress} from '../style/sequence.ts';
import {CARD_TEXT_RULE, type CardSpec} from './specs.ts';

type From = Dir;
/** 小卡尺寸档位（S/M/L，见 tokens.ts CARD_TYPE）。 */
export const CardSizeCtx = React.createContext<CardSize>('M');
export const CardEnterCtx = React.createContext<{at: number; motion?: MotionVariant}>({at: 0});
export const useCardType = () => CARD_TYPE[React.useContext(CardSizeCtx)];
const useLayer = (layer: 'ornament' | 'icon' | 'title' | 'sub') => {
  const f = useCurrentFrame(); const {at} = React.useContext(CardEnterCtx);
  return layerEnter(f, at, layer);
};
export const Tile: React.FC<{x: number; y: number; w: number; h: number; tone: FogTone; at: number; size: CardSize; from?: From; off?: number; r?: number; pad?: number | string;
  active?: number; circle?: boolean; motion?: MotionVariant; children?: React.ReactNode; style?: React.CSSProperties; id?: string}> = ({x, y, w, h, tone, at, size, from = 'up', r, pad, active, circle, motion = 'fly', children, style, id}) => {
  const f = useCurrentFrame();
  const m = motionStyle(motion, f, at, from);
  const mat = toneMat(tone);
  const T = CARD_TYPE[size];
  const radius = r ?? (circle ? 9999 : T.radius);
  const op = layerEnter(f, at, 'ornament');
  return <CardEnterCtx.Provider value={{at, motion}}><CardSizeCtx.Provider value={size}><div data-card={size} data-card-key={id} data-motion={motion} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, boxSizing: 'border-box', padding: pad ?? `${T.padY}px ${T.padX}px`,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', ...mat, opacity: m.opacity, transform: m.transform, filter: m.filter, clipPath: m.clipPath, transformOrigin: m.transformOrigin ?? '50% 50%',
    ...(active != null ? {boxShadow: `${mat.boxShadow}, 0 0 0 ${1.5 * active}px color-mix(in srgb, var(--acc-raw) ${Math.round(80 * active)}%, transparent), 0 0 ${26 * active}px color-mix(in srgb, var(--acc-raw) ${Math.round(34 * active)}%, transparent)`} : {}),
    ...style}}><CardOrnament p={op} circle={!!circle} radius={typeof radius === 'number' ? radius : T.radius} role={roleOfTone(tone)} />{children}</div></CardSizeCtx.Provider></CardEnterCtx.Provider>;
};
const TT: React.CSSProperties = {fontFamily: FONT.title, fontWeight: 900, color: 'var(--ink)', whiteSpace: 'nowrap'};
const B: React.CSSProperties = {fontFamily: FONT.body, fontWeight: 700, color: 'var(--sub)', whiteSpace: 'nowrap'};
const N: React.CSSProperties = {fontFamily: FONT.num, fontWeight: 700, lineHeight: CARD_TEXT_RULE.numLh, color: 'var(--acc-hi)', letterSpacing: -1, whiteSpace: 'nowrap'};
const layerStyle = (lp: number, dy = 8): React.CSSProperties => ({opacity: lp, transform: `translateY(${(1 - lp) * dy}px)`});
/** 标签（灰蓝小字）— 5.1.5 起小卡默认不用；片尾等旧件保留 */
export const Label: React.FC<{children: React.ReactNode; dot?: boolean}> = ({children}) => { const t = useCardType(); const lp = useLayer('sub');
  return <div style={{...B, fontSize: t.label, lineHeight: t.lh, color: 'var(--faint)', letterSpacing: 1, ...layerStyle(lp, 6)}}>{children}</div>; };
export const Big: React.FC<{v: string; unit?: string; count?: boolean}> = ({v, unit, count}) => { const t = useCardType(); const lp = useLayer('title'); const f = useCurrentFrame(); const {at} = React.useContext(CardEnterCtx);
  return <div style={{display: 'flex', alignItems: 'baseline', gap: 8, ...layerStyle(lp, 10)}}><span style={{...N, fontSize: t.value}}>{count ? countUp(v, f, at + 2, 30, 18) : v}</span>{unit && <span style={{...B, fontSize: t.caption, lineHeight: t.lh, color: 'var(--ink)'}}>{unit}</span>}</div>; };
export const Title: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => { const t = useCardType(); const lp = useLayer('title');
  return <div style={{...TT, fontSize: t.title, lineHeight: CARD_TEXT_RULE.lh, ...layerStyle(lp, 8), ...style}}>{children}</div>; };
export const Body: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => { const t = useCardType(); const lp = useLayer('sub');
  return <div style={{...B, fontSize: t.caption, lineHeight: CARD_TEXT_RULE.lh, ...layerStyle(lp, 6), ...style}}>{children}</div>; };
export const Val: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => { const t = useCardType(); const lp = useLayer('title');
  return <div style={{fontFamily: 'ArialB, Health', fontWeight: 700, color: 'var(--ink)', fontSize: t.value, lineHeight: t.lh, whiteSpace: 'nowrap', ...layerStyle(lp, 8), ...style}}>{children}</div>; };
export const Icon: React.FC<{kind: string; size?: number}> = ({kind, size}) => { const t = useCardType(); const z = size ?? t.icon; const lp = useLayer('icon');
  return <div style={{width: z, height: z, borderRadius: Math.round(z * 0.26), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'color-mix(in srgb, var(--acc-raw) 18%, transparent)', border: '1px solid color-mix(in srgb, var(--acc-raw) 40%, transparent)', ...layerStyle(lp, 6)}}>
    <div style={{width: z * 0.78, height: z * 0.6}}><PropertyArt kind={kind} color="var(--acc-hi)" /></div></div>; };

/** 按 CardSpec 渲染一张小卡：主词（数字用 Arial 冰蓝，可数字滚动）+ 最多一行副句；有图时图在上、字在下。 */
export const SpecCard: React.FC<{c: CardSpec; at: number; active?: number}> = ({c, at, active}) => {
  const [m, s] = [c.texts.find((t) => t.role === 'main'), c.texts.find((t) => t.role === 'sub')];
  const pad = c.img ? `0 0 ${c.padY}px` : `${c.padY}px ${c.padX}px`;
  return <Tile id={c.key} x={c.x} y={c.y} w={c.w} h={c.h} tone={c.tone} at={at} size={c.size} from={c.dir} motion={c.motion} r={c.radius} pad={pad} active={active}
    style={{alignItems: 'center', textAlign: 'center', ...(c.img ? {justifyContent: 'flex-end'} : {})}}>
    {c.img && <div data-media style={{position: 'absolute', left: 0, top: 0, right: 0, height: c.imgH, overflow: 'hidden', borderRadius: `${c.radius}px ${c.radius}px 0 0`}}>
      <Img src={staticFile(c.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 55%, ${IMG_FRAME.capFade})`}} /></div>}
    {m && (m.font === 'num' ? <Big v={m.text} unit={m.unit} count={c.motion === 'depth' || c.motion === 'count'} /> : <Title>{m.text}</Title>)}
    {s && <div data-role="label" style={{marginTop: Math.round((m?.px ?? 40) * CARD_TEXT_RULE.gap)}}><Body>{s.text}</Body></div>}
  </Tile>;
};
/** 胶囊结论（兼容旧调用；5.1.5 起无圆点图标） */
export const Pill: React.FC<{x: number; y: number; tone: FogTone; at: number; children: React.ReactNode; icon?: string; from?: From; inline?: boolean}> = ({x, y, tone, at, children, from = 'left', inline}) => {
  const f = useCurrentFrame(); const m = motionStyle('wipe', f, at, from); const t = CARD_TYPE.S;
  return <CardEnterCtx.Provider value={{at}}><div data-card="S" style={{position: inline ? 'relative' : 'absolute', left: x, top: y, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', padding: `${Math.round(t.title * CARD_TEXT_RULE.padY)}px ${Math.round(t.title * CARD_TEXT_RULE.padX)}px`,
    borderRadius: 999, overflow: 'hidden', ...toneMat(tone), opacity: m.opacity, transform: m.transform, clipPath: m.clipPath}}>
    <span style={{...B, fontSize: t.title, lineHeight: CARD_TEXT_RULE.lh, color: 'var(--ink)'}}>{children}</span></div></CardEnterCtx.Provider>;
};
/** 光影连线：源卡（a）停稳后从源向目标画出，画完目标卡才出现（时刻见 style/sequence.ts；进度走 linkProgress）。 */
export const Link: React.FC<{pts: [number, number][]; a: number; b: number; id?: string; from?: number | 'hub'; to?: number | 'hub'; dur?: number; fromKey?: string; toKey?: string;
  fromBox?: {x: number; y: number; w: number; h: number}; toBox?: {x: number; y: number; w: number; h: number}; color?: string}> =
  ({pts, a, b, id, from, to, dur, fromKey, toKey, fromBox, toBox}) => {
  const f = useCurrentFrame(); const p = linkProgress(f, a, b, {id, from, to, dur, fromKey, toKey, pts, fromBox, toBox});
  return <LightTrail d={pathFromPts(pts)} p={p} id={id} tipAt={pts[pts.length - 1]} />;
};
