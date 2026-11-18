// 5.1 小卡组合 5 款的正式 View。数据驱动；锚点 r0/r1…（说到该项时入场），无锚点按节拍兜底。
// 语义色固定：主数=navy、风险=clay、决策/结论=tea、重点句=champ、中性=paper。
import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {layoutRects} from '../style/layouts.ts';
import {glassEnter, type FogTone} from '../style/tokens';
import {SEQ, fallbackGap, linkStartAt, linkProgress, settleAt} from '../style/sequence.ts';
import type {Shot} from '../style/types.ts';
import {Tile, Pill, Link, Label, Big, Title, Body, Icon} from './SmallCards';

type At = (key: string, fb: number) => number;
type V = React.FC<{s: Shot; dur: number; at: At}>;
const ROT: FogTone[] = ['champ', 'paper', 'tea', 'navy'];
const txt = (size: number, color = 'var(--ink)', family = 'Health'): React.CSSProperties => ({fontFamily: family, fontWeight: family === 'PuHui' ? 900 : 700, fontSize: size, color, lineHeight: 1.3, whiteSpace: 'nowrap'});
const hi = (f: number, a: number, b: number) => glassEnter(f, a, 'soft') * (1 - glassEnter(f, b, 'soft'));

/** dataCluster：{hero:{label,v,unit?,sub?}, items:[{k,v,icon?}]×2–3, pill?:{t,icon?}} */
const DataCluster: V = ({s, at, dur}) => {
  const d = s.data, R = layoutRects('dataCluster'), items = (d.items ?? []).slice(0, 3);
  const n = items.length, gap = 24, h = Math.min(124, (R.items.h - gap * (n - 1)) / n), y0 = R.items.y;
  const heroAt = at('r0', 8), g = fallbackGap(dur, n + 1, 8), hero = {x: R.hero.x, y: R.hero.y, w: R.hero.w, h: R.hero.h};
  const itemAt = (i: number) => at(`r${i + 1}`, heroAt + g * (i + 1));
  return <>
    <Tile x={R.hero.x} y={R.hero.y} w={R.hero.w} h={R.hero.h} tone="navy" at={heroAt} from="left" pad="30px 36px">
      <div data-role="label"><Label>{d.hero.label}</Label></div>
      <div style={{marginTop: 10}}><Big v={d.hero.v} unit={d.hero.unit} size={124} /></div>
      {d.hero.sub && <div data-role="body"><Body style={{marginTop: 8}}>{d.hero.sub}</Body></div>}
    </Tile>
    {items.map((it: any, i: number) => {
      const st = itemAt(i), cy = y0 + i * (h + gap) + h / 2;
      return <React.Fragment key={i}>
        <Link pts={[[R.hero.x + R.hero.w, R.hero.y + R.hero.h / 2], [R.connLink.x + R.connLink.w / 2, R.hero.y + R.hero.h / 2], [R.connLink.x + R.connLink.w / 2, cy], [R.items.x, cy]]} a={heroAt} b={st} dur={dur} id={`hero>item${i}`} from="hub" to={i} fromKey="r0" toKey={`r${i + 1}`} fromBox={hero} toBox={{x: R.items.x, y: y0 + i * (h + gap), w: R.items.w, h}} />
        <Tile x={R.items.x} y={y0 + i * (h + gap)} w={R.items.w} h={h} tone={(it.tone ?? ROT[i]) as FogTone} at={st} from="right" pad="0 26px">
          <div style={{display: 'flex', alignItems: 'center', gap: 20}}><Icon kind={it.icon ?? 'tag'} size={60} />
            <div><div data-role="label" style={txt(28, 'var(--faint)')}>{it.k}</div><div style={{...txt(40), fontFamily: 'ArialB, Health'}}>{it.v}</div></div></div>
        </Tile></React.Fragment>;
    })}
    {d.pill && <Pill x={R.pill.x} y={R.pill.y + 4} tone={d.pill.tone ?? 'clay'} at={Math.max(at('pill', 0), n ? linkStartAt(heroAt, itemAt(n - 1), dur) + SEQ.draw : settleAt(heroAt))} icon={d.pill.icon ?? '!'}>{d.pill.t}</Pill>}
  </>;
};

/** comparePair：{L:{name,tag?,img?,rows:[[k,v]]}, R:{…}, verdict:{t,icon?}} */
const ComparePair: V = ({s, at, dur}) => {
  const f = useCurrentFrame(), d = s.data, R = layoutRects('comparePair');
  const side = (r: any, c: any, tone: FogTone, st: number, from: 'left' | 'right') =>
    <Tile x={r.x} y={r.y} w={r.w} h={r.h} tone={tone} at={st} from={from} pad="0">
      {c.img && <div data-deco style={{position: 'absolute', left: 22, top: 22, width: 120, height: 90, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--edge)'}}>
        <Img src={staticFile(c.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div>}
      <div style={{position: 'absolute', left: c.img ? 162 : 28, top: 26}}>{c.tag && <div data-role="label"><Label>{c.tag}</Label></div>}<Title size={48}>{c.name}</Title></div>
      <div style={{position: 'absolute', left: 22, right: 22, top: 136, display: 'flex', flexDirection: 'column', gap: 10}}>
        {(c.rows ?? []).slice(0, 3).map(([k, v]: [string, string], i: number) => <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px', borderRadius: 14,
          background: 'var(--well)', border: '1px solid var(--line)', opacity: glassEnter(f, st + 10 + i * 5, 'chip')}}>
          <span data-role="label" style={txt(30, 'var(--sub)')}>{k}</span><span style={txt(32, 'var(--acc-hi)')}>{v}</span></div>)}
      </div>
    </Tile>;
  const l0 = at('r0', 8), r0 = at('r1', l0 + fallbackGap(dur, 3, 8)), vs = glassEnter(f, linkStartAt(l0, r0, dur), 'chip');
  return <>
    {side(R.L, d.L, d.L.tone ?? 'paper', l0, 'left')}
    {side(R.R, d.R, d.R.tone ?? 'navy', r0, 'right')}
    <div style={{position: 'absolute', left: R.connVs.x + R.connVs.w / 2 - 36, top: R.connVs.y, width: 72, height: 72, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: vs, ...txt(28, '#F3F6FB', 'ArialB, Arial'), background: 'rgba(26,34,52,0.82)', border: '1px solid rgba(214,228,255,0.3)'}}>VS</div>
    {d.verdict && <div style={{position: 'absolute', left: R.verdict.x, top: R.verdict.y, width: R.verdict.w, height: R.verdict.h, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'relative'}}><Pill x={0} y={0} tone={d.verdict.tone ?? 'tea'} at={Math.max(at('verdict', 0), linkStartAt(l0, r0, dur) + 12)} icon={d.verdict.icon ?? '→'} inline>{d.verdict.t}</Pill></div></div>}
  </>;
};

/** stepRail：{steps:[{k,s,icon?}]×3–4}；当前步只换描边光，不移动。 */
const RailSeg: React.FC<{i: number; x1: number; x2: number; y: number; a: number; b: number; dur: number; fromBox: any; toBox: any}> = ({i, x1, x2, y, a, b, dur, fromBox, toBox}) => {
  const f = useCurrentFrame(); const p = linkProgress(f, a, b, {id: 'rail' + i, from: i, to: i + 1, fromKey: `r${i}`, toKey: `r${i + 1}`, dur, pts: [[x1 + 12, y], [x2 - 12, y]], fromBox, toBox});
  return <path d={`M${x1 + 12} ${y} L${x2 - 12} ${y}`} pathLength={1} strokeDasharray="1 1" data-link={'rail' + i} strokeDashoffset={1 - p} strokeWidth={2.5} strokeLinecap="round" style={{stroke: 'rgba(200,214,236,0.6)'}} />;
};
const StepRail: V = ({s, at, dur}) => {
  const f = useCurrentFrame(), steps = (s.data.steps ?? []).slice(0, 4), R = layoutRects('stepRail').rail, n = steps.length;
  const gap = 40, w = Math.min(340, (R.w - gap * (n - 1)) / n), span = n * w + (n - 1) * gap, x0 = R.x + (R.w - span) / 2, h = 124;
  const midY = R.y + R.h / 2, X = (i: number) => x0 + i * (w + gap), Y = (i: number) => i % 2 ? midY + 16 : midY - 16 - h;
  const g = fallbackGap(dur, n, 12), st = (i: number) => at(`r${i}`, 12 + i * g), lead = glassEnter(f, st(0), 'soft');
  const act = (i: number) => hi(f, settleAt(st(i)), i < n - 1 ? settleAt(st(i + 1)) : dur + 99);
  const cxOf = (i: number) => X(i) + w / 2;
  return <>
    <svg data-deco style={{position: 'absolute', inset: 0, width: 1920, height: 1080, overflow: 'visible'}}>
      {/* 轨道只在第一步入场时露出起点，其余逐段：第 i 段在第 i、i+1 步都停稳后从左向右长出 */}
      <path d={`M${R.x} ${midY} L${cxOf(0)} ${midY}`} pathLength={1} strokeDasharray="1 1" data-link="lead" strokeDashoffset={1 - lead} strokeWidth={2} style={{stroke: 'rgba(200,214,236,0.5)'}} />
      {steps.slice(0, -1).map((_: any, i: number) => <RailSeg key={'seg' + i} i={i} x1={cxOf(i)} x2={cxOf(i + 1)} y={midY} a={st(i)} b={st(i + 1)} dur={dur}
        fromBox={{x: X(i), y: Y(i), w, h}} toBox={{x: X(i + 1), y: Y(i + 1), w, h}} />)}
      {steps.map((_: any, i: number) => <circle key={i} cx={cxOf(i)} cy={midY} r={9} strokeWidth={2} opacity={glassEnter(f, st(i), 'chip')} style={{fill: f >= settleAt(st(i)) ? '#5B9BFF' : 'rgba(200,214,236,0.6)', stroke: 'rgba(255,255,255,0.6)'}} />)}
    </svg>
    {steps.map((it: any, i: number) => <Tile key={i} x={X(i)} y={Y(i)} w={w} h={h} tone={(it.tone ?? ['paper', 'navy', 'champ', 'tea'][i]) as FogTone} at={st(i)} from={i % 2 ? 'down' : 'up'} pad="0 22px" active={act(i)}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{...txt(28, 'var(--acc-hi)', 'ArialB, Arial'), width: 40}}>{String(i + 1).padStart(2, '0')}</div>
        <div><Title size={38}>{it.k}</Title>{it.s && <div data-role="label" style={txt(28, 'var(--faint)')}>{it.s}</div>}</div>
        {it.icon !== false && <div style={{marginLeft: 'auto'}}><Icon kind={it.icon ?? 'search'} size={52} /></div>}</div>
    </Tile>)}
  </>;
};

/** riskGroup：{head:{t,n,unit?}, items:[[k,v]]×2–3, pill?:{t}} */
const RiskGroup: V = ({s, at, dur}) => {
  const d = s.data, R = layoutRects('riskGroup'), items = (d.items ?? []).slice(0, 3), h0 = at('r0', 8), g = fallbackGap(dur, items.length + 1, 8);
  const itemAt = (i: number) => at(`r${i + 1}`, h0 + g * (i + 1));
  const rowH = 92, gap = (R.list.h - items.length * rowH) / Math.max(1, items.length - 1);
  return <>
    <Tile x={R.head.x} y={R.head.y} w={R.head.w} h={R.head.h} tone="clay" at={h0} from="left" pad="30px 32px">
      <div data-deco style={{width: 64, height: 56}}><svg viewBox="0 0 64 56" style={{width: 64, height: 56}}><path d="M32 4 L60 52 L4 52 Z" strokeWidth={4} strokeLinejoin="round" style={{fill: 'color-mix(in srgb, var(--acc-raw) 22%, transparent)', stroke: 'var(--acc-hi)'}} /><path d="M32 22 V36 M32 43 V45" strokeWidth={5} strokeLinecap="round" style={{stroke: 'var(--acc-hi)'}} /></svg></div>
      <Title size={44} style={{marginTop: 16}}>{d.head.t}</Title>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6}}><Big v={d.head.n} size={84} /><span style={txt(30, 'var(--faint)')}>{d.head.unit ?? '个坑'}</span></div>
    </Tile>
    {items.map(([k, v]: [string, string], i: number) => <Tile key={i} x={R.list.x + i * 36} y={R.list.y + i * (rowH + gap)} w={R.list.w - 72} h={rowH} tone={i === items.length - 1 ? 'clay' : 'paper'} at={itemAt(i)} from="right" r={20} pad="0 24px">
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <span style={{width: 34, height: 34, borderRadius: 999, background: 'color-mix(in srgb, var(--c-coral) 85%, transparent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...txt(28, '#fff', 'ArialB, Arial')}}>{i + 1}</span>
        <span style={txt(34, 'var(--ink)', 'PuHui')}>{k}</span>
        <span data-role="label" style={{marginLeft: 'auto', ...txt(28, 'var(--faint)')}}>{v}</span></div>
    </Tile>)}
    {d.pill && <Pill x={R.pill.x} y={R.pill.y + 4} tone={d.pill.tone ?? 'tea'} at={Math.max(at('pill', 0), settleAt(items.length ? itemAt(items.length - 1) : h0))} icon={d.pill.icon ?? '✓'}>{d.pill.t}</Pill>}
  </>;
};

/** noteGroup：{quote:{label?,t,s?}, notes:[[k,v]]×2–3} */
const NoteGroup: V = ({s, at, dur}) => {
  const d = s.data, R = layoutRects('noteGroup'), notes = (d.notes ?? []).slice(0, 3), q0 = at('r0', 8), g = fallbackGap(dur, notes.length + 1, 8);
  const nh = 110, ng = (R.notes.h - notes.length * nh) / Math.max(1, notes.length - 1), cx = R.connLink.x + R.connLink.w / 2;
  return <>
    <Tile x={R.quote.x} y={R.quote.y} w={R.quote.w} h={R.quote.h} tone="champ" at={q0} from="left" pad="30px 36px">
      {d.quote.label && <div data-role="label"><Label>{d.quote.label}</Label></div>}
      <Title size={56} style={{marginTop: 12}}>{d.quote.t}</Title>
      {d.quote.s && <div data-role="body"><Body style={{marginTop: 8}}>{d.quote.s}</Body></div>}
    </Tile>
    {notes.map(([k, v]: [string, string], i: number) => {
      const y = R.notes.y + i * (nh + ng), x = R.notes.x + (i % 2) * 70, st = at(`r${i + 1}`, q0 + g * (i + 1));
      return <React.Fragment key={i}>
        <Link pts={[[R.quote.x + R.quote.w, R.quote.y + R.quote.h / 2], [cx, R.quote.y + R.quote.h / 2], [cx, y + nh / 2], [x, y + nh / 2]]} a={q0} b={st} dur={dur} id={`quote>note${i}`} from="hub" to={i} fromKey="r0" toKey={`r${i + 1}`} fromBox={{x: R.quote.x, y: R.quote.y, w: R.quote.w, h: R.quote.h}} toBox={{x, y, w: R.notes.w - 70, h: nh}} />
        <Tile x={x} y={y} w={R.notes.w - 70} h={nh} tone={(['paper', 'navy', 'tea'][i]) as FogTone} at={st} from="right" r={20} pad="0 26px">
          <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}><Title size={38}>{k}</Title><span data-role="label" style={txt(30, 'var(--sub)')}>{v}</span></div>
        </Tile></React.Fragment>;
    })}
  </>;
};

const wrap = (C: V) => (({s, dur, at}: {s: Shot; dur: number; at: At}) => <C s={s} dur={dur} at={at} />) as V;
export const CARDS51_VIEWS: Record<string, V> = {dataCluster: wrap(DataCluster), comparePair: wrap(ComparePair), stepRail: wrap(StepRail), riskGroup: wrap(RiskGroup), noteGroup: wrap(NoteGroup)};
