// 5.1.5 片头：按《小滕片头风格模板》（pensongchs/xiaoteng-opening-style-template）——
//   039 蓝青渐变 ASCII 字符底 + 自然冷调透明住宅抠像 + 冰蓝银（普通重点）/ 暖金（判断/矛盾，只在片头）衬线标题 + 图文左右接力。
// 片头 = 口播第 1 句：时长、拍点全部来自 openingConfig（vo / timingMs），说完即切正片。
// 一拍一个焦点：看房（文字左、住宅右）→ 越多（住宅接力加到 3 栋）→ 反而越容易（文字走上弧换到右侧、住宅走下方换到左侧）→ 买错（暖金重点）。
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {openingConfig as config} from './openingConfig';
import AsciiGradientBackground from './AsciiGradientBackground';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ease = Easing.bezier(.2, .7, .2, 1);
const useFonts = () => {
  const [handle] = useState(() => delayRender('加载片头字体'));
  useEffect(() => {
    Promise.all([
      new FontFace('Headline', `url(${staticFile('fonts/JiangChengLvDongSong.ttf')})`, {weight: '400'}).load(),
      new FontFace('Support', `url(${staticFile('fonts/AlibabaHealth-Bold.ttf')})`, {weight: '700'}).load(),
      new FontFace('Text', `url(${staticFile('fonts/AlibabaHealth-Regular.ttf')})`, {weight: '400'}).load(),
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

    <div data-layer="看房越多" style={{position: 'absolute', left: tX, top: tY, transform: `scale(${tS})`, transformOrigin: '0 0'}}>
      <Display name={tx.prefix} size={220} warm={warm('prefix')} style={{left: 0, top: 0, opacity: .35 + .65 * enter(0, 200)}}>{tx.prefix}</Display>
      <Display name={tx.focus} size={220} warm={warm('focus')} style={{left: 0, top: 250, opacity: enter(t.focus, 160), transform: `translateY(${18 * (1 - enter(t.focus, 220))}px)`}}>{tx.focus}</Display>
    </div>
    <div data-layer="反而越容易" style={{position: 'absolute', left: 1040, top: 420, opacity: enter(t.turn + 200, 200), transform: `translateX(${40 * (1 - enter(t.turn + 200, 300))}px)`}}>
      <Display name={tx.turn} size={128} warm={warm('turn')} style={{left: 0, top: 0}}>{tx.turn}</Display>
    </div>
    <div data-layer="买错" style={{position: 'absolute', left: 1030, top: 580, opacity: verdict, transform: `scale(${1.06 - .06 * enter(t.verdict, 260)})`, transformOrigin: '0 50%'}}>
      <Display name={tx.verdict} size={248} warm={warm('verdict')} style={{left: 0, top: 0}}>{tx.verdict}</Display>
    </div>

    <div style={{position: 'absolute', right: 108, top: 40, fontFamily: 'Text', fontSize: 30, letterSpacing: 1, color: '#cbd9e2', textShadow: '0 2px 8px #000', display: 'flex', alignItems: 'center', gap: 15}}>
      <span style={{width: 25, height: 3, background: '#94adbd'}} /><span>{config.identity}</span></div>
  </AbsoluteFill>;
};
