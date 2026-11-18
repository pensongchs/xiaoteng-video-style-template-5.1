import React from 'react';
import {AbsoluteFill, delayRender,continueRender,cancelRender,Easing, Freeze, interpolateColors, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Rect} from './grid.ts';
import {PropertyArt, inferVisual} from './illustrations';
import {PhotoCutout} from './PhotoCutout';
import {GlassArrow} from './GlassArrow';
import {connectionProgress} from './connections';
import {COLOR, FONT, FROST, GLASS, glassEnter, steadySpring as spring, MIN_FONT, FOG, fogFill, type FogTone, MOTION, RADIUS, SPRING, TYPE, toneVars, ROOT_VARS, HILITE} from './tokens';

/** 5.1 科技玻璃入口：tone 决定底色渐变、文字变量与一条语义色顶描边。旧 tint/rgba 调用按色相映射到 tone。 */
export const toneOf = (tint?: string): FogTone => {
  if (!tint) return 'paper';
  if (tint.startsWith('tone:')) return tint.slice(5) as FogTone;
  const m=tint.match(/rgba?\(([^)]+)\)/);if(!m)return 'paper';const [r,g,b]=m[1].split(',').map(Number);
  return b>r*1.08?'navy':g>r*1.08?'tea':r>g*1.22&&g>b*1.25?'champ':r>g*1.12?'clay':'paper';
};
export const toneMat = (tone: FogTone = 'paper', soft = false): React.CSSProperties => {
  const t = FOG[tone];
  return {...(toneVars(tone) as any), color: 'var(--ink)', textShadow: 'none',
    background: t.light ? `${FROST.surfaceHighlight}, linear-gradient(rgba(255,255,255,var(--glass-lift,0)),rgba(255,255,255,var(--glass-lift,0))), ${fogFill(tone)}` : `${FROST.surfaceHighlight}, ${fogFill(tone)}`,
    backdropFilter: FROST.blur, WebkitBackdropFilter: FROST.blur,
    border: '1px solid var(--edge)',
    boxShadow: `inset 0 2px 0 -0.5px color-mix(in srgb, ${t.acc} ${t.light ? 70 : 62}%, transparent), inset 0 1px 0 var(--top), inset 0 -1px 0 rgba(8,12,20,${t.light ? '.06' : '.20'}), ${FROST.shadow}`};
};
export const glassMat = (_mode: 'dark' | 'light' = 'dark', tint?: string, _edge?: string, soft = false): React.CSSProperties => toneMat(toneOf(tint), soft);
export const GlassEdge:React.FC<{radius?:number}> = ({radius=36}) => <div data-deco style={{position:'absolute',inset:0,borderRadius:radius,padding:1,pointerEvents:'none',background:'linear-gradient(128deg,var(--top),var(--edge) 30%,rgba(255,255,255,.06) 55%,color-mix(in srgb, var(--acc-raw) 45%, transparent))',WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',WebkitMaskComposite:'xor'}}/>;
export const GlassSceneCtx=React.createContext<{bg:{src:string;video?:boolean;trim?:number;dark?:number};cam:{dirX:number;dirY:number;zoom:number;move?:number}}|null>(null);
export const GlassUnderlay:React.FC<{r:Rect}> = ({r}) => {
 const scene=React.useContext(GlassSceneCtx);if(!scene)return null;
 return <div data-deco style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
  <div style={{position:'absolute',left:-r.x,top:-r.y,width:1920,height:1080,filter:'blur(34px)',transform:'scale(1.012)',transformOrigin:`${r.x+r.w/2}px ${r.y+r.h/2}px`}}>
   <CamCtx.Provider value={scene.cam}><Backdrop src={scene.bg.src} video={scene.bg.video} dark={scene.bg.dark} trimStart={scene.bg.trim}/></CamCtx.Provider>
  </div>
 </div>;
};
export const ReadabilityCtx=React.createContext({bright:false});
export const useOutsideText=():React.CSSProperties => React.useContext(ReadabilityCtx).bright
 ? {color:'#18394C',textShadow:'0 1px 0 rgba(255,255,255,.7),0 3px 9px rgba(239,249,255,.42)',WebkitTextStroke:'.6px rgba(239,249,255,.45)',paintOrder:'stroke fill'}
 : {color:'#EEF3FA',textShadow:'0 2px 4px rgba(15,38,54,.65),0 5px 16px rgba(15,38,54,.3)',WebkitTextStroke:'1px rgba(15,38,54,.4)',paintOrder:'stroke fill'};
export const TextVeil:React.FC<{r:Rect}> = ({r}) => {
 const {bright}=React.useContext(ReadabilityCtx);
 return <div data-deco style={{position:'absolute',left:r.x-48,top:r.y-36,width:r.w+96,height:r.h+72,zIndex:-1,pointerEvents:'none',filter:'blur(20px)',background:bright
  ?'radial-gradient(ellipse at 42% 50%,rgba(235,247,253,.65) 0%,rgba(235,247,253,.42) 48%,transparent 100%)'
  :'radial-gradient(ellipse at 42% 50%,rgba(18,45,63,.42) 0%,rgba(18,45,63,.20) 50%,transparent 100%)'}}/>;
};
/** 兼容旧 useLiquid，现为单调入场；不拉伸、不压扁。 */
export const useLiquid = (start: number, config: typeof SPRING.enter = SPRING.enter) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return {p: spring({frame: f - start, fps, config}), sx: 1, sy: 1};
};
/** 兼容 API：新定版关闭邻居让位与到位后反弹。 */
export const bump = (_t: number) => 0;
/** 兼容 API：新定版没有移动扫光条；面光已固定在 glassMat 内。 */
export const Sheen: React.FC<{at: number; dur?: number; strength?: number}> = () => null;

export const Fonts:React.FC=()=>{
 const [h]=React.useState(()=>delayRender('加载5.0定版字体'));
 React.useEffect(()=>{Promise.all([
  new FontFace('PuHui',`url(${staticFile('fonts/AlibabaPuHuiTi-Black.woff2')})`,{weight:'900'}).load(),
  new FontFace('Health',`url(${staticFile('fonts/AlibabaHealthFont2.0CN-85B.ttf')})`,{weight:'700'}).load(),
  new FontFace('Health',`url(${staticFile('fonts/AlibabaHealthFont2.0CN-45R.ttf')})`,{weight:'400'}).load(),
  new FontFace('ArialB',`url(${staticFile('fonts/Style40-Arial-Bold.ttf')})`,{weight:'700'}).load(),
 ]).then(fonts=>{fonts.forEach(font=>document.fonts.add(font));continueRender(h)}).catch(cancelRender)},[h]);
 return <style>{`
    @font-face{font-family:'PuHui';src:url('${staticFile('fonts/AlibabaPuHuiTi-Black.woff2')}') format('woff2');font-weight:900}
    @font-face{font-family:'Health';src:url('${staticFile('fonts/AlibabaHealthFont2.0CN-85B.ttf')}') format('truetype');font-weight:700}
    @font-face{font-family:'Health';src:url('${staticFile('fonts/AlibabaHealthFont2.0CN-45R.ttf')}') format('truetype');font-weight:400}
    .txs,.txs *{text-shadow:0 0 12px rgba(10,22,44,0.42),0 1px 2px rgba(6,14,30,0.35)}
    .tx2,.tx2 *{-webkit-text-stroke:4px rgba(12,24,46,0.40);paint-order:stroke fill;text-shadow:0 0 12px rgba(10,22,44,0.50),0 0 28px rgba(10,22,44,0.30)}
    .txs .gt,.tx2 .gt{text-shadow:none;-webkit-text-stroke:0;filter:drop-shadow(0 2px 4px rgba(6,14,30,0.55))}
    @font-face{font-family:'ArialB';src:local('Arial Bold'),local('Arial-BoldMT'),local('Liberation Sans Bold'),local('Noto Sans Bold'),url('${staticFile('fonts/Style40-Arial-Bold.ttf')}') format('truetype');font-weight:700}
  `}</style>;
};

/** 线性 0→1（兼容旧调用：进度条、计数插值等） */
export const prog = (f: number, start: number, dur: number = MOTION.enter) =>
  interpolate(f, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const ease = (p: number) => 1 - Math.pow(1 - p, 3);

/** 旧 hook 名兼容；现在使用16/20/12帧有限时长单调入场。 */
export const useSpringP = (start: number, config: typeof SPRING.enter = SPRING.enter) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return spring({frame: Math.max(0, f - start), fps, config});
};

export type Tone = 'dark' | 'pearl' | 'gold' | 'coral' | 'ghost';
export type Enter = 'up' | 'left' | 'right' | 'scale' | 'fade' | 'blur' | 'none';

/** 单调入场，进度钳制0–1，到位后固定。 */
const enterStyle = (from: Enter, p: number): React.CSSProperties => {
  const o = Math.min(1, Math.max(0, p));
  const t = o; // 禁止过冲
  const sh = MOTION.maxShift;
  switch (from) {
    case 'up': return {opacity: o, transform: `translateY(${(1 - t) * sh}px) scale(${0.96 + 0.04 * Math.min(t, 1.15)})`};
    case 'left': return {opacity: o, transform: `translateX(${(1 - t) * -sh}px) scale(${0.97 + 0.03 * Math.min(t, 1.12)})`};
    case 'right': return {opacity: o, transform: `translateX(${(1 - t) * sh}px) scale(${0.97 + 0.03 * Math.min(t, 1.12)})`};
    case 'scale': return {opacity: o, transform: `scale(${0.97 + 0.03 * t})`};
    case 'blur': return {opacity: o, filter: `blur(${Math.max(0, (1 - Math.min(t, 1)) * 8)}px)`, transform: `translateY(${(1 - t) * 16}px) scale(${0.97 + 0.03 * Math.min(t, 1.1)})`};
    case 'fade': return {opacity: o, transform: `scale(${0.985 + 0.015 * Math.min(t, 1.08)})`};
    default: return {opacity: 1};
  }
};

const toneBg: Record<Tone, React.CSSProperties> = {
  dark: glassMat(), pearl: glassMat('light'),
  gold: glassMat('dark', FROST.tint.gold), coral: glassMat('dark', FROST.tint.coral),
  ghost: glassMat('dark', undefined, undefined, true),
};

/** 玻璃卡（少用；全屏不要堆满） */
export const GlassCard: React.FC<{r: Rect; start: number; tone?: Tone; from?: Enter; dim?: number; radius?: number; pad?: number | string; children: React.ReactNode; style?: React.CSSProperties}> =
({r, start, tone = 'dark', from = 'up', dim = 1, radius = RADIUS.card, pad = 36, children, style}) => {
  const p = useSpringP(start, SPRING.enter);
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: radius, padding: pad, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    opacity: dim, ...toneBg[tone], ...enterStyle(from, p), ...style}}>{children}</div>;
};

/** 真实帧上下文：镜头末尾定格时，前景冻结，但视频（背景/媒体框）继续播放，避免「顿一下」 */
export const LiveFrameCtx = React.createContext<number | null>(null);
/** 素材比镜头短时的慢放倍率（0.75–1），由 Demo 按镜头时长与素材时长计算 */
export const ClipRateCtx = React.createContext<Record<string, number>>({});
export const LiveVideo: React.FC<{src: string; style: React.CSSProperties; trimStart?: number}> = ({src, style, trimStart = 0}) => {
  const live = React.useContext(LiveFrameCtx); const rate = React.useContext(ClipRateCtx)[src] ?? 1;
  const v = <OffthreadVideo src={staticFile(src)} style={style} muted playbackRate={rate} startFrom={Math.round(trimStart * 30)} />;
  return live == null ? v : <Freeze frame={live}>{v}</Freeze>;
};

/** 媒体框：描边在内侧 */
export const MediaFrame: React.FC<{r: Rect; start: number; src: string; video?: boolean; label?: string; tag?: string; trimStart?: number; from?: Enter; fit?: 'cover' | 'contain'; soft?: boolean}> =
({r, start, src, video, label, tag, trimStart = 0, from = 'scale', fit = 'cover', soft}) => {
  const p = useSpringP(start, SPRING.enter); const B = soft ? 0 : 8;
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: RADIUS.frame, overflow: 'hidden',
    border: soft ? 'none' : '1px solid rgba(255,255,255,0.22)', boxShadow: soft ? '0 20px 50px rgba(0,0,0,0.4)' : 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.4)',
    ...enterStyle(from, p)}}>
    <div style={{position: 'absolute', inset: B, borderRadius: RADIUS.frame - 4, overflow: 'hidden'}}>
      {video
        ? <LiveVideo src={src} style={{width: '100%', height: '100%', objectFit: fit}} trimStart={trimStart} />
        : <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: fit}} />}
    </div>
    {tag && <div data-fit="tag" style={{position: 'absolute', top: 20, right: 20, padding: '8px 30px', borderRadius: 999, fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.chip,
      ...glassMat('dark', FROST.tint.gold), color: FROST.gold}}>{tag}</div>}
    {label && <div style={{position: 'absolute', left: 24, bottom: 22, display: 'flex', alignItems: 'center', gap: 12}}>
      <div style={{width: 4, height: 28, background: COLOR.goldHi, borderRadius: 2}} />
      <span style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: COLOR.warm, textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>{label}</span>
    </div>}
  </div>;
};

export type ChipTone = 'gold' | 'glass' | 'coral' | 'green';
export const Chip: React.FC<{children: React.ReactNode; start: number; tone?: ChipTone; size?: number; hi?: number}> = ({children, start, tone = 'glass', size = TYPE.chip, hi}) => {
  const p = useSpringP(start, SPRING.snappy);
  const o = Math.min(1, Math.max(0, p));
  const st: Record<ChipTone, React.CSSProperties> = {
    gold: {...glassMat('dark', FROST.tint.gold), color: FROST.ink},
    glass: {...glassMat('dark'), color: FROST.ink, textShadow: 'none'},
    coral: {...glassMat('dark', 'rgba(255,107,94,0.42)', 'rgba(255,107,94,0.6)'), color: FROST.ink, textShadow: 'none'},
    green: {...glassMat('dark', 'rgba(45,212,191,0.40)', 'rgba(45,212,191,0.6)'), color: FROST.ink, textShadow: 'none'},
  };
  return <div data-fit="chip" style={{display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', flexShrink: 0, whiteSpace: 'nowrap', padding: `${Math.round(size * 0.42)}px ${Math.round(size * 1.3)}px`, borderRadius: 999,
    fontFamily: FONT.body, fontWeight: 700, fontSize: size, opacity: o, transform: `translateY(${(1 - p) * 10}px) scale(${0.97 + 0.03 * Math.min(p, 1)})`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 18px rgba(0,0,0,0.3)', ...st[tone],
    ...(hi != null ? {position: 'relative', overflow: 'hidden', color: FROST.ink, textShadow: 'none'} : {})}}>
    {hi != null && hi > 0.001 && <div style={{position: 'absolute', inset: 0, borderRadius: 999, opacity: hi, background: FROST.tintFill.gold}} />}
    {hi != null ? <span style={{position: 'relative'}}>{children}</span> : children}</div>;
};

export const Badge: React.FC<{children: React.ReactNode; size?: number; active?: boolean}> = ({children, size = 72, active = true}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT.num, fontSize: size * 0.38, color: active ? '#0B1424' : COLOR.warm,
    background: active ? 'radial-gradient(circle at 30% 25%, var(--acc), var(--acc) 55%, var(--acc))' : 'rgba(255,255,255,0.12)',
    boxShadow: active ? '0 0 22px rgba(91,155,255,0.55)' : 'none'}}>{children}</div>
);

export const Kicker: React.FC<{text: string; plate?: boolean}> = ({text, plate}) => {
  const p = useSpringP(0, SPRING.soft); const o = Math.min(1, Math.max(0, p));
  return <div className="tx2" style={{position: 'absolute', left: 96, top: 56, height: 36, display: 'flex', alignItems: 'center', gap: 14, opacity: o, transform: `translateX(${(1 - p) * -16}px)`}}>
    {plate && <div style={{position: 'absolute', left: -12, right: 80, top: -4, bottom: -4, borderRadius: 10, zIndex: -1,
      background: 'linear-gradient(90deg, rgba(236,242,250,0.46), rgba(236,242,250,0.12) 72%, rgba(236,242,250,0))', backdropFilter: 'blur(8px)'}} />}
    <div style={{width: 28 * o, height: 2, background: COLOR.goldHi}} />
    <span style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.kicker, color: '#EEF3FA', letterSpacing: 2}}>{text}</span>
  </div>;
};

export const GoldText: React.FC<{text: string}> = ({text}) => {
 const {bright}=React.useContext(ReadabilityCtx);
 return <>{text.split(/(\{[^}]+\})/).map((s,i)=>s.startsWith('{')?<span key={i} className="gt" style={{color:bright?HILITE.bright:HILITE.dark}}>{s.slice(1,-1)}</span>:<span key={i}>{s}</span>)}</>;
};

export const Headline: React.FC<{text: string; start?: number; plate?: boolean}> = ({text, start = 2}) => {
  const p=useSpringP(start,SPRING.enter),outside=useOutsideText(),{bright}=React.useContext(ReadabilityCtx);
  return <div style={{position:'absolute',left:96,top:100,width:1536,height:100,display:'flex',alignItems:'center',opacity:p,transform:`translateY(${(1-p)*22}px)`}}>
    <div style={{display:'inline-flex',alignItems:'center',height:100,padding:'0 24px',borderRadius:24,background:bright?'linear-gradient(110deg,rgba(235,247,253,.52),rgba(235,247,253,.24))':'linear-gradient(110deg,rgba(23,53,72,.35),rgba(23,53,72,.12))',border:'1px solid rgba(227,246,255,.32)',boxShadow:'0 7px 20px -12px rgba(20,45,60,.28),inset 0 1px 0 rgba(255,255,255,.22)',backdropFilter:'blur(16px)'}}>
      <div style={{fontFamily:FONT.title,fontSize:74,...outside,lineHeight:1.2,whiteSpace:'pre-line'}}><GoldText text={text}/></div>
    </div>
  </div>;
};

export const Count: React.FC<{to: number; start: number; dec?: number; sep?: boolean; instant?: boolean}> = ({to, start, dec = 0, sep, instant}) => {
  const f = useCurrentFrame(); const p = prog(f, start, MOTION.count); const v = instant ? to : to * ease(p);
  const raw = dec > 0 ? v.toFixed(dec) : Math.round(v).toString();
  const shown = sep ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : raw;
  return <>{shown}</>;
};

export const Bar: React.FC<{ratio: number; start: number; hi?: boolean}> = ({ratio, start, hi}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 22);
  return <div style={{height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginTop: 12}}>
    <div style={{height: '100%', width: `${ratio * 100 * ease(p)}%`, borderRadius: 3, background: hi ? 'linear-gradient(90deg,var(--acc),var(--acc))' : 'rgba(255,255,255,0.45)'}} />
  </div>;
};

export const ExampleMark: React.FC = () => (
  <div style={{position: 'absolute', left: 1400, top: 56, width: 232, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    fontFamily: FONT.body, fontSize: MIN_FONT.any, color: 'rgba(236,242,250,0.45)'}}>* 数据为示例</div>
);

/** 背景：整体提亮（亮度 ×1.1、压暗降约 0.15），文字可读性靠左上/底部的渐变压暗而非整屏压黑 */
/** 背景保持清晰。blur 只为兼容旧数据，不再作用到画面；5.0 仍比 4.5 提亮一档。 */
/** 镜头内运镜方向：由 ShotView 注入，背景视差慢于前景 */
export const CamCtx = React.createContext<{dirX: number; dirY: number; zoom: number; move?: number}>({dirX: 1, dirY: 0, zoom: 1});

export const Backdrop: React.FC<{src: string; video?: boolean; blur?: number; dark?: number; trimStart?: number;neutral?:boolean}> = ({src, video, blur: _blur = 0, dark = 0.45, trimStart = 0,neutral=false}) => {
  // 背景保留自然色与局部文字保护；开场 neutral 模式不叠暖色罩染。
  const k = neutral?Math.max(.06,dark-.32):Math.max(0.13,dark-.26);
  // 镜头内缓慢运镜（视频+静图）：轻推近 + 沿 CamCtx 方向漂移，制造空间感
  const cur = useCurrentFrame(); const live = React.useContext(LiveFrameCtx) ?? cur;
  const cam = React.useContext(CamCtx);
  const t = live / 30; // 秒
  const mv = cam.move ?? 1; // 可选：本期加强运镜（默认 1 = 定版行为）
  const scale = 1.04 + t * 0.008 * cam.zoom * mv; // ~0.8%/s 推近
  const tx = cam.dirX * t * 6 * mv + (mv > 1 ? Math.sin(t * 0.55) * 10 : 0);  // 约 6px/s
  const ty = cam.dirY * t * 4 * mv + (mv > 1 ? Math.cos(t * 0.42) * 6 : 0);
  const filter = neutral?'brightness(1.08) saturate(.94)':'brightness(1.2) saturate(1.06)';
  const mediaStyle: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', filter, transform: `scale(${scale}) translate(${tx}px, ${ty}px)`, transformOrigin: '50% 45%'};
  return <AbsoluteFill>
    {video
      ? <LiveVideo src={src} style={mediaStyle} trimStart={trimStart} />
      : <Img src={staticFile(src)} style={mediaStyle} />}
    <AbsoluteFill style={{background: `rgba(${neutral?'16,22,30':'12,11,10'},${k})`}} />
    {/* 5.0：渐变只留文字一侧（左上标题区）和底部字幕区，中部通透 */}
    <AbsoluteFill style={{background: neutral?'radial-gradient(ellipse 70% 42% at 18% 10%,rgba(15,22,30,.22),transparent)':'radial-gradient(ellipse 70% 42% at 18% 10%, rgba(12,11,10,0.42) 0%, rgba(12,11,10,0) 100%)'}} />
    <AbsoluteFill style={{background: neutral?'linear-gradient(180deg,transparent 78%,rgba(15,22,30,.26))':'linear-gradient(180deg, rgba(12,11,10,0) 74%, rgba(12,11,10,0.36) 100%)'}} />
  </AbsoluteFill>;
};

/* ========== 新增 MG 元素（不全是卡片） ========== */

/** 下划线描画 */
export const UnderlineDraw: React.FC<{x: number; y: number; w: number; start: number; color?: string}> = ({x, y, w, start, color = COLOR.goldHi}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 18);
  return <div style={{position: 'absolute', left: x, top: y, width: w * ease(p), height: 3, borderRadius: 2, background: `linear-gradient(90deg,${color},rgba(91,155,255,0))`}} />;
};

/** 无卡底的大数字 */
export const BareNumber: React.FC<{r: Rect; start: number; value: number; unit: string; dec?: number; sep?: boolean; label?: string; gold?: boolean; from?: Enter; size?: number; children?: React.ReactNode; flow?: boolean; instant?: boolean}> =
({r, start, value, unit, dec, sep, label, gold = true, from = 'up', size, children, flow, instant}) => {
  const fs = size ?? Math.min(TYPE.number, Math.round(r.h * 0.42)); const outside=useOutsideText(),{bright}=React.useContext(ReadabilityCtx);
  const p = useSpringP(start, SPRING.enter);
  const pos: React.CSSProperties = flow ? {position: 'relative'} : {position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h};
  return <div style={{...pos, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...enterStyle(from, p)}}><TextVeil r={{x:-12,y:0,w:r.w,h:flow?260:r.h}}/>
    {label && <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, color: COLOR.sub, marginBottom: 16}}>{label}</div>}
    <div style={{fontFamily: FONT.num, fontSize: fs, lineHeight: 1.05, whiteSpace: 'nowrap',
      ...(gold ? {...outside,color:bright?'var(--acc)':'var(--acc)'} : {color: COLOR.warm})}}>
      <Count to={value} start={start + 4} dec={dec} sep={sep} instant={instant} />
      <span style={{fontFamily: FONT.title, fontSize: Math.max(TYPE.body, Math.round(fs * 0.36)), marginLeft: 14, color: gold ? COLOR.goldHi : COLOR.warm}}>{unit}</span>
    </div>
    {children && <div style={{marginTop: 32, display: 'flex', gap: 20}}>{children}</div>}
  </div>;
};

/** 浮动标签（轻量，无大卡） */
export const FloatLabel: React.FC<{r: Rect; start: number; text: string; tone?: ChipTone | 'plain'; from?: Enter}> = ({r, start, text, tone = 'glass', from = 'fade'}) => {
  const f = useCurrentFrame(); const p = prog(f, start, MOTION.chip);
  const bob = 0; // v6：标签到位即停
  if (tone === 'plain') return <div style={{position: 'absolute', left: r.x, top: r.y + bob, width: r.w, height: r.h, display: 'flex', alignItems: 'center',
    fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, color: COLOR.warm, ...enterStyle(from, p)}}>{text}</div>;
  return <div style={{position: 'absolute', left: r.x, top: r.y + bob * 0.4, ...enterStyle(from, p)}}><Chip start={start} tone={tone as ChipTone}>{text}</Chip></div>;
};

/** 时间轴节点 */
export const Timeline: React.FC<{r: Rect; start: number; steps: {t: string; s: string; chip?: string}[]; active: number; starts?: number[]; dur?: number}> = ({r, start, steps, active, starts, dur}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const n = steps.length; const gap = 48;
  const cw = (r.w - gap * (n - 1)) / n;
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h}}>
    {steps.slice(0,-1).map((_,i)=>{const x1=i*(cw+gap)+cw/2,x2=(i+1)*(cw+gap)+cw/2;const p=connectionProgress(f,starts?.[i]??start+i*MOTION.stagger,starts?.[i+1]??start+(i+1)*MOTION.stagger,{id:'tl'+i,from:i,to:i+1,fromKey:'s'+i,toKey:'s'+(i+1),dur,pts:[[r.x+x1+18,r.y+36],[r.x+x2-18,r.y+36]],fromBox:{x:r.x+i*(cw+gap),y:r.y,w:cw,h:r.h},toBox:{x:r.x+(i+1)*(cw+gap),y:r.y,w:cw,h:r.h}});
      return <svg data-deco key={'link'+i} style={{position:'absolute',left:0,top:0,width:r.w,height:70,overflow:'visible'}}><path d={`M${x1+18} 36 H${x2-18}`} fill="none" stroke="rgba(236,242,250,.94)" strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray="1 1" data-link={'tl'+i} strokeDashoffset={1-p} opacity={p}/></svg>;
    })}
    {steps.map((st, i) => {
      const st0 = starts?.[i] ?? start + i * MOTION.stagger;
      const sp = glassEnter(f, st0);
      const o = Math.min(1, Math.max(0, sp)); const on = i === active; const done = i < active;
      const hs = (x?: number) => (x == null ? 0 : spring({frame: Math.max(0, f - x), fps, config: SPRING.snappy}));
      const hi = starts ? Math.max(0, Math.min(1, hs(starts[i]) - hs(starts[i + 1]))) : (on ? 1 : 0);
      const dn = starts ? Math.min(1, hs(starts[i + 1])) : (done ? 1 : 0);
      const x = i * (cw + gap);
      return <div key={i} style={{position: 'absolute', left: x, top: 0, width: cw, height: r.h, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o,
        transform: `translateY(${(1 - sp) * 28}px) scale(${0.97 + 0.03 * sp})`, transformOrigin: '50% 100%'}}>
        <div style={{width: 28, height: 28, borderRadius: 14, marginTop: 22, background: hi + dn > 0.5 ? 'radial-gradient(circle at 30% 25%,var(--acc),var(--acc))' : 'rgba(255,255,255,0.2)',
          boxShadow: `0 0 22px rgba(91,155,255,${0.7 * hi})`, border: `2px solid rgba(255,255,255,${hi})`}} />
        <div style={{position: 'relative', marginTop: 24, padding: '20px 26px 24px', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box',
          ...glassMat('dark')}}>
        <div data-deco style={{position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none', opacity: hi, background: 'linear-gradient(165deg, rgba(91,155,255,0.10), rgba(0,0,0,0) 140%)', boxShadow: 'none'}} />
        <div style={{fontFamily: FONT.title, position: 'relative', fontSize: 40, lineHeight: 1.3, color: FROST.ink, textAlign: 'center'}}>{st.t}</div>
        {st.s && <div data-role="body" style={{position: 'relative', marginTop: 14, fontFamily: FONT.body, fontSize: TYPE.body, color: FROST.sub, textAlign: 'center', lineHeight: 1.4}}>{st.s}</div>}
        {st.chip && <div style={{position: 'relative', marginTop: 22}}><Chip start={(starts?.[i] ?? start + i * 6) + 10} tone="glass" hi={hi}>{st.chip}</Chip></div>}
        <div style={{position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden', pointerEvents: 'none'}}><Sheen at={st0 + 6} />{on && starts && <Sheen at={st0 + 8} strength={0.26} />}</div>
        </div>
      </div>;
    })}
  </div>;
};

/** 图标+文字细行 */
export const IconRow: React.FC<{r: Rect; start: number; idx: string; title: string; sub: string; tip?: string; active?: boolean; from?: Enter; glass?: boolean; activeAt?: number; offAt?: number; dim?: number; nudge?: number; subStart?: number; icon?:string}> =
({r,start,idx,title,sub,tip,from='right',glass=true,subStart,icon}) => {
 const f=useCurrentFrame(),p=useSpringP(start,SPRING.enter),es=enterStyle(from,p),tone=Number(idx)%2===0?'blue':'none';
 return <div style={{position:'absolute',left:r.x,top:r.y+7,width:r.w,height:r.h-14,...glassMat('dark',FROST.tint[tone]),borderRadius:36,display:'flex',alignItems:'center',gap:28,padding:'20px 34px',boxSizing:'border-box',...es}}>
   <div data-deco style={{width:104,height:96,flexShrink:0,borderRadius:24,background:'rgba(255,255,255,.26)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.55)'}}><PropertyArt kind={icon||inferVisual(title)} color={tone==='blue'?'var(--acc)':'var(--acc)'}/></div>
   <div style={{flex:1,minWidth:0}}><div style={{fontFamily:FONT.title,fontSize:title.length>8?44:52,lineHeight:1.3,color:FROST.ink}}>{title}</div>
   {sub&&<div data-role="body" style={{fontFamily:FONT.body,fontWeight:700,fontSize:34,lineHeight:1.35,color:FROST.sub,marginTop:10,opacity:subStart==null?1:glassEnter(f,subStart)}}>{sub}</div>}</div>
   <div style={{alignSelf:'flex-start',fontFamily:FONT.num,fontSize:28,color:'rgba(26,45,56,.58)',paddingTop:6}}>{idx}</div>
   {tip&&<Chip start={start+8}>{tip}</Chip>}
 </div>;
};
const useSpringPOnce = (f: number, start: number) => spring({frame: Math.max(0, f - start), fps: 30, config: SPRING.snappy});

/** 引用号 + 引文 */
export const QuoteBlock: React.FC<{r: Rect; start: number; text: string; sub?: string; lineAt?: number[]; subAt?: number[]; focus?: number; visual?:string;cutout?:string}> = ({r,start,text,sub,lineAt,visual,cutout}) => {
 const f=useCurrentFrame(),p=useSpringP(start,SPRING.enter),lines=text.split('\n');
 const textH=lines.length*82+(sub?100:0),artH=Math.min(292,Math.max(120,r.h-textH-132));
 return <div style={{position:'absolute',left:r.x,top:r.y,width:r.w,height:r.h,...glassMat('dark',FROST.tint.blue),borderRadius:40,padding:42,boxSizing:'border-box',opacity:p}}>
  <div data-deco style={{fontFamily:FONT.num,fontSize:96,lineHeight:.8,color:'rgba(16,40,58,.23)'}}>“</div>
  <div style={{fontFamily:FONT.title,fontSize:60,lineHeight:1.35,color:FOG.navy.ink,marginTop:12}}>{lines.map((line,i)=><div key={i} style={{opacity:glassEnter(f,lineAt?.[i]??start+i*10)}}><GoldText text={line}/></div>)}</div>
  {sub&&<div data-role="body" style={{fontFamily:FONT.body,fontWeight:700,fontSize:34,lineHeight:1.35,marginTop:24,color:FOG.navy.ink}}>{sub}</div>}
  <div style={{position:'absolute',left:58,right:58,bottom:32,height:artH}}><PhotoCutout src={cutout} kind={visual||inferVisual(text)} color="var(--acc)"/></div>
 </div>;
};

/** 软发光提示条（比玻璃卡更轻） */
export const SoftCallout: React.FC<{r: Rect; start: number; text: string; tone?: 'gold' | 'coral'; icon?: string; h?: number}> = ({r, start, text, tone = 'gold', icon, h = 112}) => {
  const p = useSpringP(start, SPRING.snappy); const H = Math.min(h, r.h);
  // 宽度随文字收缩（左边贴栏线），内边距 56；文字宽 ≤ 容器 75%
  return <div data-fit="callout" style={{position: 'absolute', left: r.x, top: r.y + (r.h - H) / 2, maxWidth: r.w, height: H, display: 'inline-flex', alignItems: 'center', gap: 24, padding: '0 56px', boxSizing: 'border-box', whiteSpace: 'nowrap',
    borderRadius: 18, ...glassMat('dark', tone === 'coral' ? 'rgba(255,107,94,0.30)' : 'rgba(91,155,255,0.10)', tone === 'coral' ? 'rgba(255,107,94,0.55)' : 'rgba(91,155,255,0.5)'), ...enterStyle('scale', p)}}>
    <div style={{width: 52, height: 52, borderRadius: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.num, fontSize: 28,
      color: tone === 'coral' ? '#fff' : '#0B1424', background: tone === 'coral' ? COLOR.coral : 'radial-gradient(circle at 30% 25%,var(--acc),var(--acc))'}}>{icon ?? (tone === 'coral' ? '!' : '✓')}</div>
    <span data-fit-text style={{fontFamily: FONT.title, fontSize: 38, color: FROST.ink}}><GoldText text={text} /></span>
  </div>;
};

/** 进度环 */
export const ProgressRing: React.FC<{cx: number; cy: number; size: number; start: number; ratio: number; label: string; value: string}> =
({cx, cy, size, start, ratio, label, value}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 28); const r = (size - 10) / 2; const c = 2 * Math.PI * r; const dash = c * ratio * ease(p);
  return <div style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity: ease(prog(f, start, 14))}}>
    <svg width={size} height={size} style={{transform: 'rotate(-90deg)'}}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${dash} ${c}`} style={{stroke: 'var(--acc)'}} />
    </svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(0)'}}>
      <div style={{fontFamily: FONT.num, fontSize: TYPE.ringValue, color: COLOR.goldHi, lineHeight: 1.2}}>{value}</div>
      <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: COLOR.sub, marginTop: 8}}>{label}</div>
    </div>
  </div>;
};

/** 箭头连接 */
/** 左→右箭头：左右两张卡（a=左入场，b=右入场）都停稳后，从左向右长出。 */
export const ArrowConnector:React.FC<{x:number;y:number;w:number;a:number;b:number;dur?:number}> = ({x,y,w,a,b,dur}) => {
 const f=useCurrentFrame();return <GlassArrow x={x} y={y} w={w} progress={connectionProgress(f,a,b,{id:'arrowLR',from:0,to:1,dur,pts:[[x,y],[x+w,y]],fromBox:{x:x-200,y:y-40,w:200,h:80},toBox:{x:x+w,y:y-40,w:200,h:80}})}/>;
};

/** 高亮竖条 / 焦点条 */
export const HighlightBar: React.FC<{x: number; y: number; h: number; start: number}> = ({x, y, h, start}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 14);
  return <div style={{position: 'absolute', left: x, top: y, width: 4, height: h * ease(p), borderRadius: 2, background: 'linear-gradient(180deg,var(--acc),var(--acc))', boxShadow: '0 0 16px rgba(91,155,255,0.5)'}} />;
};

/** 分裂大标题（一行主标题 + 一行副） */
const SplitTypeStandard: React.FC<{r: Rect; start: number; line1: string; line2: string; line2Start?: number; sub?: string}> = ({r, start, line1, line2, line2Start = start + 7, sub}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const outside=useOutsideText(),{bright}=React.useContext(ReadabilityCtx);
  const p1 = spring({frame: Math.max(0, f - start), fps, config: SPRING.enter});
  const p2 = spring({frame: Math.max(0, f - line2Start), fps, config: SPRING.enter});
  const o1 = Math.min(1, Math.max(0, p1)), o2 = Math.min(1, Math.max(0, p2));
  return <><TextVeil r={{...r,y:r.y+r.h*.18,h:r.h*.64}}/><div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
    <div style={{fontFamily: FONT.title, fontSize: TYPE.heroTitle, ...outside, lineHeight: 1.3, opacity: o1, transform: `translateY(${(1 - p1) * 28}px) scale(${0.96 + 0.04 * Math.min(p1, 1.12)})`}}>{line1}</div>
    <div style={{fontFamily: FONT.title, fontSize: TYPE.heroTitle, lineHeight: 1.3, marginTop: 0, opacity: o2, transform: `translateY(${(1 - p2) * 28}px) scale(${0.96 + 0.04 * Math.min(p2, 1.12)})`,
      ...outside, color:bright?'var(--acc)':'var(--acc)'}}>{line2}</div>
    <div style={{position: 'relative', marginTop: 28, height: 3}}>
      <UnderlineDraw x={0} y={0} w={Math.min(420, r.w * 0.55)} start={line2Start + 13} />
    </div>
    {sub && <div data-role="body" style={{fontFamily: FONT.body, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, marginTop: 48, opacity: ease(prog(f, line2Start + 19, 14))}}>{sub}</div>}
  </div></>;
};
const RhythmSplitType: React.FC<{r: Rect; start: number; line1: string; line2: string; line2Start?: number; sub?: string; rhythm?:{focus:string}}> = ({r,start,line1,line2,line2Start=start+7,sub,rhythm}) => {
 const f=useCurrentFrame(),{fps}=useVideoConfig(),outside=useOutsideText(),{bright}=React.useContext(ReadabilityCtx);
 const p1=glassEnter(f,start),p2=glassEnter(f,line2Start,rhythm?'chip':'enter');
 const focus=rhythm?.focus,parts=focus?line1.split(focus):[];
 return <><TextVeil r={{...r,y:r.y+r.h*.18,h:r.h*.64}}/><div style={{position:'absolute',left:r.x,top:r.y,width:r.w,height:r.h,display:'flex',flexDirection:'column',justifyContent:'center'}}>
  <div style={{fontFamily:FONT.title,fontSize:TYPE.heroTitle,...outside,...(rhythm?{color:'#EEF3FA',textShadow:'0 4px 14px rgba(20,24,23,.32)'}:{}),lineHeight:1.3,opacity:p1,transform:`translateX(${rhythm?-42*(1-p1):0}px) translateY(${(1-p1)*28}px)`}}>{rhythm&&focus&&parts.length>1?<>{parts[0]}<span style={{color:'#FFDF51'}}>{focus}</span>{parts.slice(1).join(focus)}</>:line1}</div>
  <div style={{fontFamily:FONT.title,fontSize:TYPE.heroTitle,lineHeight:1.3,marginTop:rhythm?18:0,alignSelf:'flex-start',opacity:p2,transform:`translateY(${(1-p2)*36}px) scale(${rhythm?1.12-.12*p2:.96+.04*p2})`,transformOrigin:'0 50%',...outside,color:rhythm?'#EEF3FA':bright?HILITE.bright:HILITE.dark,...(rhythm?{padding:'6px 18px 12px',marginLeft:-18,borderRadius:22,background:'linear-gradient(120deg,var(--c-coral),var(--c-coral))',boxShadow:'0 14px 28px rgba(255,107,94,.22)',textShadow:'0 3px 9px rgba(255,107,94,.18)'}:{})}}>{line2}</div>
  {sub&&<div style={{fontFamily:FONT.body,fontSize:TYPE.body,lineHeight:1.35,marginTop:24,...outside,opacity:p2}}>{sub}</div>}
 </div></>;
};
export const SplitType:React.FC<React.ComponentProps<typeof RhythmSplitType>> = props => props.rhythm?<RhythmSplitType {...props}/>:<SplitTypeStandard {...props}/>;

/** 紧凑统计胶囊（小元素） */
export const StatPill: React.FC<{r: Rect; start: number; k: string; value: number; unit: string; dec?: number; sep?: boolean; s?: string; hi?: boolean}> =
({r, start, k, value, unit, dec, sep, s, hi}) => {
  const p = useSpringP(start, SPRING.enter);
  return <div data-fit="pill" style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 22, padding: '40px 44px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    ...glassMat('dark', hi ? 'rgba(91,155,255,0.45)' : undefined, hi ? 'rgba(91,155,255,0.5)' : undefined), ...enterStyle('up', p)}}>
    <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: FROST.gold, letterSpacing: 2}}>{k}</div>
    <div style={{fontFamily: FONT.num, fontSize: 68, color: FROST.ink, marginTop: 18, lineHeight: 1.1, whiteSpace: 'nowrap'}}>
      <Count to={value} start={start + 6} dec={dec} sep={sep} /><span style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, marginLeft: 10}}>{unit}</span>
    </div>
    {s && <div data-role="body" style={{fontFamily: FONT.body, fontSize: TYPE.body, lineHeight: 1.35, color: FROST.sub, marginTop: 20}}>{s}</div>}
  </div>;
};
