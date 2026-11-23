import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {openingConfig as config} from './openingConfig';
import {STAMP, type OpeningLike} from './openingBeats';
import AsciiGradientBackground from './AsciiGradientBackground';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ease = Easing.bezier(.2, .7, .2, 1);
const useFonts = () => {
  const [handle] = useState(() => delayRender('加载片头字体'));
  useEffect(() => {
    Promise.all([
      new FontFace('Headline', `url(${staticFile('fonts/JiangChengLvDongSong.ttf')})`, {weight: '400'}).load(),
      new FontFace('Support', `url(${staticFile('fonts/AlibabaHealth-Bold.ttf')})`, {weight: '700'}).load(),
    ]).then((fonts) => { fonts.forEach((font) => document.fonts.add(font)); continueRender(handle); }).catch(cancelRender);
  }, [handle]);
};
/** 标题材质（同母工程 Display）：冰蓝银 / 暖金渐变 + 轻微暗色下层位移与柔阴影；不描边、不扫光。 */
const Display: React.FC<{children: React.ReactNode; size: number; warm?: boolean; style?: React.CSSProperties; name?: string}> = ({children, size, warm = false, style, name}) =>
  <div data-title={name} style={{position: 'absolute', fontFamily: 'Headline', fontWeight: 400, fontSize: size, lineHeight: 1.12, letterSpacing: -4, whiteSpace: 'nowrap', ...style}}>
    <div aria-hidden style={{position: 'absolute', inset: 0, color: warm ? '#71421d' : '#112b46', transform: 'translate(3px,6px)', textShadow: '0 13px 24px rgba(0,0,0,.6)'}}>{children}</div>
    <div style={{position: 'relative', color: 'transparent', background: warm ? 'linear-gradient(180deg,#fff0b8 0%,#ffd27c 27%,#e9a536 58%,#bb711f 100%)' : 'linear-gradient(180deg,#f7fcff 0%,#e5f3ff 34%,#b8daf1 65%,#4d79a2 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text'}}>{children}</div>
  </div>;
/** 冷色统一 + 细节增强，保留透明通道（母工程第 3 节）。 */
const COOL = 'saturate(1.12) contrast(1.10) brightness(1.03)';
const fit = (text: string, width: number, maxSize: number) =>
  Math.min(maxSize, Math.floor(width / Math.max(1, [...text].reduce((n, char) => n + (/^[\x00-\x7f]$/.test(char) ? 0.62 : 1), 0))));
const shadow = 'drop-shadow(0 22px 17px rgba(0,0,0,.34))';

export const Opening: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame(), {fps, durationInFrames} = useVideoConfig(), t = config.timingMs, tx = config.text;
  const f = (ms: number) => Math.round(ms * fps / 1000);
  const tween = (start: number, duration: number, easing = ease) => interpolate(frame, [f(start), f(start + duration)], [0, 1], {...clamp, easing});
  const enter = (start: number, duration = 160) => tween(start, duration);
  const warm = (k: string) => (config.warm as readonly string[]).includes(k);
  // 换位：一次连续动作 ≈580ms；文字走上弧、住宅走下方，互不交叉
  const swap = tween(t.turn, 580, Easing.bezier(.42, 0, .18, 1)), arc = Math.sin(Math.PI * swap);
  // 全程轻推（不停住）：住宅组缓慢放大 3%
  const drift = interpolate(frame, [0, durationInFrames], [0, 1], clamp);
  const [A, B, C] = config.cards;
  const a = .45 + .55 * enter(0, 300), b = enter(t.focus, 320), c = enter(t.turn + 120, 360);
  const verdict = enter(t.verdict, 180);
  const stamp = (config as OpeningLike).stamp;
  const recede = 1 - tween(t.turn, Math.min(400, t.verdict - t.turn));
  const stampSettle = tween(t.verdict, 180);
  const stampFont = fit(tx.verdict, STAMP.maxWidth - 2 * STAMP.padding, 120);
  const stampWidth = Math.min(STAMP.maxWidth, Math.max(270, [...tx.verdict].length * stampFont + 2 * STAMP.padding));
  // 住宅组：右 → 左（下方路径）
  const houseX = 1010 - 930 * swap, houseY = 150 + 40 * swap + 70 * arc, houseS = (1 - .14 * arc) * (1 + .03 * drift);
  // 文字组「看房 / 越多」：左 → 右上（上弧），换位后缩成主题锚点
  const tX = 150 + 930 * swap, tY = 230 - 110 * swap - 90 * arc, tS = 1 - .5 * swap;
  return <AbsoluteFill style={{background: config.colors.background, overflow: 'hidden'}}>
    <AsciiGradientBackground renderTime={frame / fps} colors={['#123e83', '#bce7ff', '#4aa2d4', '#117f9e']} shape="horizon" characters=" =+xX0S8#@" cellSize={18} density={.8}
      glyphOpacity={.62} glow={.15} depthOfField={0} flicker={.2} softness={.5} scale={1} flow={.5} speed={1} gradientOpacity={.93} grain={.08} variation={0}
      intro={false} mouseInteraction={false} clickEffect="none" dpr={1} style={{position: 'absolute', inset: 0, opacity: .76}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 52%,rgba(12,23,35,.08) 5%,rgba(9,19,30,.38) 100%)'}} />

    <div data-layer="住宅接力" style={{position: 'absolute', left: houseX, top: houseY, width: 820, height: 860, transform: `scale(${houseS})`, transformOrigin: '50% 70%', filter: `brightness(${1 - .1 * verdict})`}}>
      {C && <Img data-subject="住宅组团" src={staticFile(C.src)} style={{position: 'absolute', left: -40, top: 150, width: 640, height: 430, objectFit: 'contain', opacity: c * .92,
        transform: `translateX(${-90 * (1 - c)}px) scale(${.9 + .1 * c})`, transformOrigin: '50% 100%', filter: `${COOL} ${shadow}`}} />}
      {A && <Img data-subject="现代住宅" src={staticFile(A.src)} style={{position: 'absolute', left: 230, top: 0, width: 480, height: 720, objectFit: 'contain', opacity: a,
        transform: `translateX(${120 * (1 - a)}px) scale(${.94 + .06 * a - .06 * b})`, transformOrigin: '50% 100%', filter: `${COOL} ${shadow}`}} />}
      {B && <Img data-subject="成熟社区住宅" src={staticFile(B.src)} style={{position: 'absolute', left: 150, top: 420, width: 700, height: 350, objectFit: 'contain', opacity: b,
        transform: `translateX(${150 * (1 - b)}px) scale(${.92 + .08 * b})`, transformOrigin: '50% 100%', filter: `${COOL} ${shadow}`}} />}
    </div>

    <div data-layer="片头主题" style={{position: 'absolute', left: tX, top: tY, transform: `scale(${tS})`, transformOrigin: '0 0', opacity: recede}}>
      <Display name={tx.prefix} size={fit(tx.prefix, 790, 220)} style={{left: 0, top: 0}}>{tx.prefix}</Display>
      <Display name={tx.focus} size={fit(tx.focus, 790, 220)} style={{left: 0, top: 242, opacity: enter(t.focus, 160), transform: `translateY(${18 * (1 - enter(t.focus, 220))}px)`}}>{tx.focus}</Display>
    </div>
    <Display name={tx.turn} size={fit(tx.turn, 732, 122)} style={{left: 1020, top: stamp?.lead ? 340 : 386,
      opacity: enter(t.turn, 160), transform: `translateX(${30 * (1 - enter(t.turn, 240))}px)`}}>{tx.turn}</Display>
    {stamp?.lead && <Display name={stamp.lead.text} size={fit(stamp.lead.text, 732, 88)} style={{
      left: 1020, top: 475, opacity: enter(stamp.lead.ms, 150),
    }}>{stamp.lead.text}</Display>}
    {stamp ? (frame >= f(t.verdict) && <div data-opening-stamp style={{
      position: 'absolute', left: 1018, top: stamp.lead ? 609 : 547, width: stampWidth, height: 164,
      opacity: Math.min(1, verdict * 3.2), transformOrigin: '12% 50%',
      transform: `translateY(${-30 * (1 - stampSettle)}px) scale(${1.08 - .08 * stampSettle}) rotate(${-3 - 3 * (1 - stampSettle)}deg)`,
      display: 'grid', placeItems: 'center', boxSizing: 'border-box', background: 'linear-gradient(165deg, #AD2739, #89192B)',
      border: '4px solid #E46E76', borderRadius: 6, boxShadow: '0 8px 20px rgba(16,18,30,.45)',
    }}>
      <div aria-hidden style={{position: 'absolute', inset: 7, border: '1px solid #F1A099', borderRadius: 2}} />
      <span style={{fontFamily: 'Support', fontWeight: 700, fontSize: stampFont, lineHeight: 1, color: '#FFF1E9', whiteSpace: 'nowrap'}}>
        {tx.verdict}
      </span>
    </div>) : <Display name={tx.verdict} size={fit(tx.verdict, 732, 220)} warm={warm('verdict')}
      style={{left: 1020, top: 540, opacity: verdict}}>{tx.verdict}</Display>}
    {(config as {identity?: string}).identity && <div style={{position: 'absolute', right: 108, top: 40,
      fontFamily: 'Support', fontWeight: 700, fontSize: 30, letterSpacing: 1, color: '#cbd9e2', textShadow: '0 2px 8px #000'}}>
      {config.identity}
    </div>}
  </AbsoluteFill>;
};
