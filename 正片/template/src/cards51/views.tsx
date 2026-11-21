// 5.1.5 小卡组合 5 款的正式 View。几何全部来自 specs.ts（与 plan:check 文字适配检查同一份）；锚点 r0/r1…（说到该项时入场），无锚点按节拍兜底。
// 每张卡：主词/主数 + 最多一行副句；无眉标/标签胶囊/编号圆/装饰图标。语义色：主数=navy、风险=clay、决策/结论=tea、重点句=champ、中性=paper。
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {CARD_TYPE, TRAIL, glassEnter, toneVars} from '../style/tokens';
import {SEQ, fallbackGap, linkStartAt, linkProgress, settleAt} from '../style/sequence.ts';
import {TrailStrokes} from '../style/LightTrail';
import type {Shot} from '../style/types.ts';
import {Link, SpecCard} from './SmallCards';
import {cards51Specs, type CardSpec} from './specs.ts';

type At = (key: string, fb: number) => number;
type V = React.FC<{s: Shot; dur: number; at: At}>;
const box = (c: CardSpec) => ({x: c.x, y: c.y, w: c.w, h: c.h});
const hi = (f: number, a: number, b: number) => glassEnter(f, a, 'soft') * (1 - glassEnter(f, b, 'soft'));
const pick = (cs: CardSpec[], re: RegExp) => cs.filter((c) => re.test(c.key));
/** 枢纽 → 右列：从源卡右缘中点出发，走折线到目标卡左缘中点。 */
const hubPts = (a: CardSpec, b: CardSpec): [number, number][] => { const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, mx = Math.round((x1 + x2) / 2);
  return [[x1, y1], [mx, y1], [mx, y2], [x2, y2]]; };

/** dataCluster：{hero:{v,unit?,sub?}, items:[{k,v}]×2–3, pill?:{t}} */
const DataCluster: V = ({s, at, dur}) => {
  const cs = cards51Specs('dataCluster', s.data), hero = cs[0], items = pick(cs, /^item/), pill = cs.find((c) => c.key === 'pill');
  const heroAt = at('r0', 8), g = fallbackGap(dur, items.length + 1, 8), itemAt = (i: number) => at(`r${i + 1}`, heroAt + g * (i + 1));
  return <>
    <SpecCard c={hero} at={heroAt} />
    {items.map((c, i) => <React.Fragment key={c.key}>
      <Link pts={hubPts(hero, c)} a={heroAt} b={itemAt(i)} dur={dur} id={`hero>item${i}`} from="hub" to={i} fromKey="r0" toKey={`r${i + 1}`} fromBox={box(hero)} toBox={box(c)} />
      <SpecCard c={c} at={itemAt(i)} /></React.Fragment>)}
    {pill && <SpecCard c={pill} at={Math.max(at('pill', 0), items.length ? linkStartAt(heroAt, itemAt(items.length - 1), dur) + SEQ.draw : settleAt(heroAt))} />}
  </>;
};

/** comparePair：{L:{name,img?,rows:[[k,v]]×≤2}, R:{…}, verdict:{t}} */
const ComparePair: V = ({s, at, dur}) => {
  const f = useCurrentFrame(), cs = cards51Specs('comparePair', s.data);
  const L = cs.find((c) => c.key === 'L')!, R = cs.find((c) => c.key === 'R')!, verdict = cs.find((c) => c.key === 'verdict');
  const l0 = at('r0', 8), r0 = at('r1', l0 + fallbackGap(dur, 3, 8)), vs = glassEnter(f, linkStartAt(l0, r0, dur), 'chip');
  const rowAt = (base: number, i: number) => settleAt(base) - 8 + i * 6;
  const cx = (L.x + L.w + R.x) / 2, cy = L.y + L.h / 2;
  return <>
    <SpecCard c={L} at={l0} />{pick(cs, /^rowL/).map((c, i) => <SpecCard key={c.key} c={c} at={rowAt(l0, i)} />)}
    <SpecCard c={R} at={r0} />{pick(cs, /^rowR/).map((c, i) => <SpecCard key={c.key} c={c} at={rowAt(r0, i)} />)}
    <div style={{position: 'absolute', left: cx - 40, top: cy - 40, width: 80, height: 80, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: vs, transform: `scale(${0.7 + 0.3 * vs})`, ...(toneVars('navy') as any), fontFamily: 'ArialB, Arial', fontWeight: 700, fontSize: CARD_TYPE.M.caption, color: 'var(--ink)',
      background: 'radial-gradient(circle at 35% 30%, rgba(91,155,255,0.42), rgba(26,34,52,0.86) 70%)', border: '1px solid rgba(188,214,255,0.45)', boxShadow: '0 0 24px rgba(91,155,255,0.35)'}}>VS</div>
    {verdict && <SpecCard c={verdict} at={Math.max(at('verdict', 0), linkStartAt(l0, r0, dur) + 12)} />}
  </>;
};

/** stepRail：{steps:[{k,s}]×3–4}；当前步只换描边光，不移动。 */
const RailSeg: React.FC<{i: number; x1: number; x2: number; y: number; a: number; b: number; dur: number; fromBox: any; toBox: any}> = ({i, x1, x2, y, a, b, dur, fromBox, toBox}) => {
  const f = useCurrentFrame(); const p = linkProgress(f, a, b, {id: 'rail' + i, from: i, to: i + 1, fromKey: `r${i}`, toKey: `r${i + 1}`, dur, pts: [[x1 + 12, y], [x2 - 12, y]], fromBox, toBox});
  return <TrailStrokes d={`M${x1 + 12} ${y} L${x2 - 12} ${y}`} p={p} id={'rail' + i} tipAt={[x2 - 12, y]} />;
};
const StepRail: V = ({s, at, dur}) => {
  const f = useCurrentFrame(), cs = cards51Specs('stepRail', s.data), n = cs.length;
  const midY = cs.length > 1 ? (cs[0].y + cs[0].h + cs[1].y) / 2 : 450;
  const g = fallbackGap(dur, n, 12), st = (i: number) => at(`r${i}`, 12 + i * g), lead = glassEnter(f, st(0), 'soft');
  const act = (i: number) => hi(f, settleAt(st(i)), i < n - 1 ? settleAt(st(i + 1)) : dur + 99);
  const cxOf = (i: number) => cs[i].x + cs[i].w / 2;
  return <>
    <svg data-deco style={{position: 'absolute', inset: 0, width: 1920, height: 1080, overflow: 'visible'}}>
      <TrailStrokes d={`M${cs[0].x - 60} ${midY} L${cxOf(0)} ${midY}`} p={lead} id="lead" tip={false} />
      {cs.slice(0, -1).map((c, i) => <RailSeg key={'seg' + i} i={i} x1={cxOf(i)} x2={cxOf(i + 1)} y={midY} a={st(i)} b={st(i + 1)} dur={dur} fromBox={box(c)} toBox={box(cs[i + 1])} />)}
      {cs.map((c, i) => <g key={i} opacity={glassEnter(f, st(i), 'chip')}>
        <line x1={cxOf(i)} x2={cxOf(i)} y1={midY} y2={i % 2 ? c.y : c.y + c.h} strokeWidth={1.5} style={{stroke: TRAIL.mid}} />
        <circle cx={cxOf(i)} cy={midY} r={9} strokeWidth={2} style={{fill: f >= settleAt(st(i)) ? TRAIL.tip : TRAIL.mid, stroke: TRAIL.core}} /></g>)}
    </svg>
    {cs.map((c, i) => <SpecCard key={c.key} c={c} at={st(i)} active={act(i)} />)}
  </>;
};

/** riskGroup：{head:{t,n,unit?}, items:[[k,v]]×2–3, pill?:{t}} */
const RiskGroup: V = ({s, at, dur}) => {
  const cs = cards51Specs('riskGroup', s.data), head = cs[0], items = pick(cs, /^item/), pill = cs.find((c) => c.key === 'pill');
  const h0 = at('r0', 8), g = fallbackGap(dur, items.length + 1, 8), itemAt = (i: number) => at(`r${i + 1}`, h0 + g * (i + 1));
  return <>
    <SpecCard c={head} at={h0} />
    {items.map((c, i) => <SpecCard key={c.key} c={c} at={itemAt(i)} />)}
    {pill && <SpecCard c={pill} at={Math.max(at('pill', 0), settleAt(items.length ? itemAt(items.length - 1) : h0))} />}
  </>;
};

/** noteGroup：{quote:{t,s?}, notes:[[k,v]]×2–3} */
const NoteGroup: V = ({s, at, dur}) => {
  const cs = cards51Specs('noteGroup', s.data), q = cs[0], notes = pick(cs, /^note/);
  const q0 = at('r0', 8), g = fallbackGap(dur, notes.length + 1, 8);
  return <>
    <SpecCard c={q} at={q0} />
    {notes.map((c, i) => { const st = at(`r${i + 1}`, q0 + g * (i + 1));
      return <React.Fragment key={c.key}>
        <Link pts={hubPts(q, c)} a={q0} b={st} dur={dur} id={`quote>note${i}`} from="hub" to={i} fromKey="r0" toKey={`r${i + 1}`} fromBox={box(q)} toBox={box(c)} />
        <SpecCard c={c} at={st} /></React.Fragment>; })}
  </>;
};

const wrap = (C: V) => (({s, dur, at}: {s: Shot; dur: number; at: At}) => <C s={s} dur={dur} at={at} />) as V;
export const CARDS51_VIEWS: Record<string, V> = {dataCluster: wrap(DataCluster), comparePair: wrap(ComparePair), stepRail: wrap(StepRail), riskGroup: wrap(RiskGroup), noteGroup: wrap(NoteGroup)};
