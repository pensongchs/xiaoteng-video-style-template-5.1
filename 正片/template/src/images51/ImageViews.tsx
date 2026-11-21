// 5.1.5 图片动效组件 4 款：图片按本镜口播关键词生成/选取（specs.ts 的 {src, kw, prompt}），跟口播节拍切换/揭示。
//  imageFrame3D：1–2 张 3D 空间图框（轻侧转 + 视差：图框层、图内层、说明卡层三层不同速度）+ 图内 ken-burns 推近 + 说明小卡
//  imageSwap   ：大图框按口播节拍换图（新图由虚到实横入 + 景深推近，旧图留在下层不闪）+ 右侧说明卡逐条点亮
//  imageGrid   ：一排图框按口播顺序翻入揭示，当前格描边点亮，其余不降透明度
//  imageCutout ：照片面板在后、透明抠像在前探出面板上沿（分层视差）+ 说明卡 + ≤2 个结论胶囊
import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {Shot} from '../style/types.ts';
import {motionStyle, type Dir, type MotionVariant} from '../style/motion.ts';
import {MOTION_BY_LAYOUT} from '../style/motion.ts';
import {IMG_FRAME, TRAIL, glassEnter} from '../style/tokens';
import {fallbackGap, settleAt} from '../style/sequence.ts';
import {CardOrnament} from '../style/CardOrnament';
import {SpecCard} from '../cards51/SmallCards';
import {imageSpecs, R_FRAME, type Frame} from './specs.ts';

type At = (key: string, fb: number) => number;
type V = React.FC<{s: Shot; dur: number; at: At}>;
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
/** 视差漂移只在前 PAR_SETTLE 帧内缓出完成，之后图框/说明卡定格（守「停稳后不动」）；持续运动只留给图内 ken-burns。 */
export const PAR_SETTLE = 96;
const parallax = (f: number) => 1 - Math.pow(1 - interpolate(f, [0, PAR_SETTLE], [0, 1], clamp), 3);
const hi = (f: number, a: number, b: number) => glassEnter(f, a, 'soft') * (1 - glassEnter(f, b, 'soft'));

/** 3D 图框：外层 = 静态侧转 + 视差漂移；内层 = 入场变体；图 = ken-burns 推近。 */
const Frame3D: React.FC<{fr: Frame; at: number; dur: number; variant: MotionVariant; dir: Dir; drift?: number; focus?: number; z?: number; cutout?: boolean}> = ({fr, at, dur, variant, dir, drift = -14, focus, z = 1, cutout}) => {
  const f = useCurrentFrame(); const m = motionStyle(variant, f, at, dir);
  const kb = interpolate(f, [at, Math.max(at + 1, dur)], [0, 1], clamp), par = parallax(f);
  const ring = focus ?? 0;
  return <div data-image-frame={fr.key} style={{position: 'absolute', left: fr.x, top: fr.y, width: fr.w, height: fr.h, zIndex: z,
    transform: `perspective(2200px) rotateY(${fr.yaw}deg) translate3d(${drift * par}px, ${drift * 0.25 * par}px, 0)`, transformOrigin: fr.yaw > 0 ? '0% 50%' : '100% 50%'}}>
    <div style={{position: 'absolute', inset: 0, opacity: m.opacity, transform: m.transform, filter: m.filter, clipPath: m.clipPath, transformOrigin: m.transformOrigin ?? '50% 50%'}}>
      {cutout
        ? <Img data-media src={staticFile(fr.img.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${1 + 0.04 * kb})`, transformOrigin: '50% 100%',
            filter: `saturate(1.08) contrast(1.06) drop-shadow(0 26px 22px ${IMG_FRAME.cutShadow})`}} />
        : <div data-media style={{position: 'absolute', inset: 0, borderRadius: R_FRAME, overflow: 'hidden', background: IMG_FRAME.bg,
            boxShadow: `0 30px 60px ${IMG_FRAME.shadow}, 0 0 0 1px ${IMG_FRAME.edge}${ring > 0.02 ? `, 0 0 0 ${(2.5 * ring).toFixed(2)}px ${TRAIL.tipRing}, 0 0 ${Math.round(32 * ring)}px ${TRAIL.bloom}` : ''}`}}>
            <Img src={staticFile(fr.img.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.05 + 0.08 * kb}) translate(${-10 * kb}px, ${-6 * kb}px)`}} />
            <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${IMG_FRAME.fade0} 55%, ${IMG_FRAME.fade1})`}} />
            <CardOrnament p={glassEnter(f, at + 3, 'chip')} radius={R_FRAME} role="neutral" />
          </div>}
    </div>
  </div>;
};
const CapLayer: React.FC<{children: React.ReactNode; dur: number; drift?: number}> = ({children, dur, drift = 10}) => {
  const f = useCurrentFrame(); const par = parallax(f);
  return <div style={{position: 'absolute', inset: 0, transform: `translate3d(${drift * par}px, 0, 0)`, zIndex: 10}}>{children}</div>;
};

const ImageFrame3D: V = ({s, at, dur}) => {
  const {frames, cards} = imageSpecs('imageFrame3D', s.data); const M = MOTION_BY_LAYOUT.imageFrame3D;
  const g = fallbackGap(dur, frames.length, 12), st = (i: number) => at(`r${i}`, 10 + i * g);
  return <>
    {frames.map((fr, i) => <Frame3D key={fr.key} fr={fr} at={st(i)} dur={dur} variant={M.frame} dir={i ? 'right' : 'left'} drift={i ? 12 : -12} />)}
    <CapLayer dur={dur}>{cards.map((c, i) => <SpecCard key={c.key} c={c} at={settleAt(st(i)) - 6} />)}</CapLayer>
  </>;
};
const ImageSwap: V = ({s, at, dur}) => {
  const f = useCurrentFrame(); const {frames, cards} = imageSpecs('imageSwap', s.data); const M = MOTION_BY_LAYOUT.imageSwap; const n = frames.length;
  const g = fallbackGap(dur, n, 14), st = (i: number) => at(`r${i}`, 10 + i * g);
  return <>
    {frames.map((fr, i) => <Frame3D key={fr.key} fr={fr} at={st(i)} dur={dur} variant={i ? M.frame : 'depth'} dir="right" z={1 + i} drift={-10} />)}
    <CapLayer dur={dur}>{cards.map((c, i) => <SpecCard key={c.key} c={c} at={st(i) + 4} active={hi(f, settleAt(st(i)), i < n - 1 ? st(i + 1) : dur + 99)} />)}</CapLayer>
  </>;
};
const ImageGrid: V = ({s, at, dur}) => {
  const f = useCurrentFrame(); const {frames, cards} = imageSpecs('imageGrid', s.data); const M = MOTION_BY_LAYOUT.imageGrid; const n = frames.length;
  const g = fallbackGap(dur, n, 12), st = (i: number) => at(`r${i}`, 10 + i * g);
  const focus = (i: number) => hi(f, settleAt(st(i)), i < n - 1 ? settleAt(st(i + 1)) : dur + 99);
  return <>
    {frames.map((fr, i) => <Frame3D key={fr.key} fr={fr} at={st(i)} dur={dur} variant={M.cell} dir="up" drift={-6} focus={focus(i)} />)}
    <CapLayer dur={dur} drift={6}>{cards.map((c, i) => <SpecCard key={c.key} c={c} at={st(i) + 8} />)}</CapLayer>
  </>;
};
const ImageCutout: V = ({s, at, dur}) => {
  const {frames, cards} = imageSpecs('imageCutout', s.data); const M = MOTION_BY_LAYOUT.imageCutout; const [P, C] = frames;
  const a0 = at('r0', 10), g = fallbackGap(dur, cards.length, 14), st = (i: number) => at(`r${i}`, a0 + i * g);
  return <>
    {P && <Frame3D fr={P} at={a0} dur={dur} variant="depth" dir="up" drift={-8} z={1} />}
    {C && <Frame3D fr={C} at={a0 + 8} dur={dur} variant={M.cutout} dir="up" drift={16} z={3} cutout />}
    <CapLayer dur={dur}>{cards.map((c, i) => <SpecCard key={c.key} c={c} at={i ? st(i) : settleAt(a0) - 4} />)}</CapLayer>
  </>;
};
const wrap = (C: V) => (({s, dur, at}: {s: Shot; dur: number; at: At}) => <C s={s} dur={dur} at={at} />) as V;
export const IMAGE_VIEWS: Record<string, V> = {imageFrame3D: wrap(ImageFrame3D), imageSwap: wrap(ImageSwap), imageGrid: wrap(ImageGrid), imageCutout: wrap(ImageCutout)};
