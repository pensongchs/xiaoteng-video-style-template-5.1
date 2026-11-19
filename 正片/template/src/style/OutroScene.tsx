// 片尾（5.1.1 重做）：小滕在右侧——开场挥手 → 说到要点时转为「指向左边」→ 收尾再挥手；头顶对话气泡给一句反应；
// 左侧标题字 + 小卡按口播逐条弹出（无大文字卡、无回弹）；收尾处飘几枚纯图标（无文字，不是 CTA）。
// 屏幕文字只来自当期片尾文案；模板不加「点赞/关注/收藏/转发」类引导语，也没有按钮式 CTA。
import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Chip, GoldText, ReadabilityCtx, TextVeil, useOutsideText} from './components';
import {Tile, Title} from '../cards51/SmallCards';
import {CARD_TYPE, FONT, glassEnter, toneVars} from './tokens';
import {toneMat} from './components';
import type {Rect} from './grid';
import {estWidth} from './content-guard.ts';

const WAVE = 'media/character/xiaoteng_outro.png', POINT = 'media/character/xiaoteng_point.png';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const xfade = (f: number, a: number, b: number, d = 8) => interpolate(f, [a, a + d, b, b + d], [0, 1, 1, 0], clamp);

const Sparkle: React.FC<{x: number; y: number; at: number; kind: 'star' | 'house' | 'check'}> = ({x, y, at, kind}) => {
  const f = useCurrentFrame(); const p = glassEnter(f, at, 'chip'); const rise = interpolate(f, [at, at + 36], [0, -38], clamp);
  return <div data-deco style={{position: 'absolute', left: x, top: y, width: 72, height: 72, borderRadius: 24, opacity: p * interpolate(f, [at + 24, at + 40], [1, 0.0], clamp) + 0, transform: `translateY(${rise}px) scale(${0.8 + 0.2 * p})`, ...toneMat('navy'), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{stroke: 'var(--acc-hi)'}}>
      {kind === 'star' && <path d="M20 4l4.6 10 10.8 1.2-8 7.4 2.2 10.6L20 27.6 10.4 33.2l2.2-10.6-8-7.4L15.4 14z" />}
      {kind === 'house' && <path d="M6 20L20 7l14 13M10 17v16h20V17M17 33v-9h6v9" />}
      {kind === 'check' && <><circle cx="20" cy="20" r="14" /><path d="M13 20.5l5 5 9-10.5" /></>}
    </svg></div>;
};

export const OutroScene: React.FC<{data: any; R: Record<string, Rect>; ch: string | false; lineAt: number; pointAt: number[]; noteAt: number; accountAt: number}> = ({data, R, ch, lineAt, pointAt, noteAt, accountAt}) => {
  const f = useCurrentFrame(), t = R.text, outside = useOutsideText();
  const lp = glassEnter(f, lineAt, 'soft'), cp = glassEnter(f, 0, 'soft'), bp = glassEnter(f, noteAt, 'enter');
  const points: string[] = data.points ?? [];
  const twoPose = ch === WAVE; // 自带自定义角色图时只用一张姿势
  const lastPoint = pointAt.length ? pointAt[pointAt.length - 1] : lineAt;
  const pointOn = xfade(f, lineAt + 2, Math.max(lineAt + 20, accountAt - 6)); // 中段：指向左边
  const byeOn = interpolate(f, [accountAt - 6, accountAt + 2], [0, 1], clamp);
  const waveOn = twoPose ? Math.max(0, 1 - pointOn) : 1;
  const bob = Math.sin(Math.max(0, f - 20) / 26) * 2.2, tilt = Math.sin(f / 7) * 1.1 * (waveOn > 0.5 ? 1 : 0);
  const [brand, detail] = (data.account ?? '').split('·').map((x: string) => x.trim());
  const accountText = [brand, detail].filter(Boolean).join(' · ');
  const bubbleText: string | undefined = data.bubble ?? data.note;
  // 5.1.2：要点小卡宽度按内容定（原来撑满 886px，内容只占 40%）；各条等宽，取最长一条。
  const cardW = Math.min(t.w, Math.max(480, Math.ceil((CARD_TYPE.S.padX * 2 + 48 + 20 + Math.max(0, ...points.map((p) => estWidth(p, CARD_TYPE.S.title)))) / 0.65 / 4) * 4)), rowH = 100, gap = 18;
  const head = {x: t.x, y: t.y + 8};
  const hasPoints = points.length > 0;
  const listY = head.y + (data.line?.includes('\n') ? 236 : 168) + 32;
  const React_ = ch && data.reactions !== false;
  const c = R.character;
  return <ReadabilityCtx.Provider value={{bright: true}}>
    {ch && <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, opacity: cp, transform: `translate(${60 * (1 - cp)}px,${24 * (1 - cp)}px) scale(${.96 + .04 * cp})`, transformOrigin: '50% 100%'}}>
      <div data-deco style={{position: 'absolute', left: '10%', right: '10%', bottom: 18, height: 80, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(80,140,255,.42),transparent 70%)', filter: 'blur(20px)'}} />
      {[{src: ch, o: waveOn}, ...(twoPose ? [{src: POINT, o: pointOn}] : [])].map((o, i) => o.o > 0.001 && <Img key={i} src={staticFile(o.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center', opacity: o.o,
        filter: 'drop-shadow(0 18px 24px rgba(4,10,24,.42))', transform: `translateY(${bob}px) rotate(${i === 0 ? tilt : 0}deg)`, transformOrigin: '50% 100%', WebkitMaskImage: 'linear-gradient(#000 86%,transparent 100%)'}} />)}
      {twoPose && byeOn > 0.001 && <Img src={staticFile(WAVE)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center', opacity: byeOn, filter: 'drop-shadow(0 18px 24px rgba(4,10,24,.42))', transform: `translateY(${bob}px) rotate(${Math.sin(f / 7) * 1.1}deg)`, transformOrigin: '50% 100%', WebkitMaskImage: 'linear-gradient(#000 86%,transparent 100%)'}} />}
    </div>}
    {ch && R.bubble && bubbleText && <div data-card="S" style={{...(toneVars('navy') as any), position: 'absolute', left: R.bubble.x, top: R.bubble.y, width: R.bubble.w, height: R.bubble.h, boxSizing: 'border-box', padding: `${CARD_TYPE.S.padY}px ${CARD_TYPE.S.padX + 6}px`,
      borderRadius: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bp, transform: `translateY(${(1 - bp) * 22}px) scale(${0.94 + 0.06 * bp})`, transformOrigin: '70% 100%', ...toneMat('navy')}}>
      <div style={{fontFamily: FONT.title, fontWeight: 900, fontSize: CARD_TYPE.S.title, lineHeight: CARD_TYPE.S.lh, color: 'var(--ink)', textAlign: 'center'}}>{bubbleText}</div>
      <div data-deco style={{position: 'absolute', left: '62%', bottom: -16, width: 34, height: 34, transform: 'rotate(45deg)', borderRadius: 6, background: 'inherit', borderRight: '1px solid var(--edge)', borderBottom: '1px solid var(--edge)', ...{backdropFilter: 'none'}}} />
    </div>}
    {data.eyebrow && <div style={{position: 'absolute', left: head.x, top: head.y - 4}}><Chip start={Math.max(0, lineAt - 8)}>{data.eyebrow}</Chip></div>}
    <div style={{position: 'absolute', left: head.x, top: head.y + 64, width: t.w, opacity: lp, transform: `translateY(${(1 - lp) * 24}px)`}}>
      <TextVeil r={{x: 0, y: 0, w: t.w, h: 160}} />
      <div style={{fontFamily: FONT.title, fontSize: 84, lineHeight: 1.3, whiteSpace: 'pre-line', ...outside}}><GoldText text={data.line} /></div>
    </div>
    {hasPoints && points.map((txt, i) => <Tile key={i} x={t.x} y={listY + i * (rowH + gap)} w={cardW} h={rowH} tone={i === points.length - 1 ? 'champ' : 'navy'} at={pointAt[i] ?? lineAt + 14 + i * 16} size="S" from="right" off={150}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <span data-deco style={{width: 48, height: 48, borderRadius: 14, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--acc-raw) 24%, transparent)', border: '1.5px solid var(--acc-raw)'}}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{stroke: 'var(--acc-hi)'}}><path d="M5 13.5l5.5 5.5L21 7.5" /></svg></span>
        <Title>{txt}</Title></div>
    </Tile>)}
    {data.account && <Tile x={t.x} y={hasPoints ? listY + points.length * (rowH + gap) : listY} w={Math.min(Math.max(cardW, 480), 640)} h={84} tone="paper" at={accountAt} size="S" from="up" off={20} pad="0 28px">
      <Title style={{whiteSpace: 'nowrap'}}>{accountText}</Title></Tile>}
    {React_ && <>
      <Sparkle x={c.x + 20} y={c.y + 360} at={lastPoint + 6} kind="star" />
      <Sparkle x={c.x + c.w - 70} y={c.y + 330} at={lastPoint + 14} kind="check" />
      <Sparkle x={c.x + 6} y={c.y + 520} at={accountAt - 2} kind="house" />
    </>}
  </ReadabilityCtx.Provider>;
};
