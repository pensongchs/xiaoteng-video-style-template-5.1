import React from 'react';
import {AbsoluteFill, Freeze, Img, staticFile, useCurrentFrame, useVideoConfig, getInputProps} from 'remotion';
import {GlassSceneCtx, ReadabilityCtx, TextVeil, bump,
  ArrowConnector, Backdrop, BareNumber, CamCtx, Chip, ExampleMark, FloatLabel, GoldText, Headline, HighlightBar,
  IconRow, Kicker, MediaFrame, ProgressRing, QuoteBlock, SoftCallout, SplitType, StatPill, Timeline, UnderlineDraw, prog, glassMat,
  LiveFrameCtx,
} from './components';
import {layoutRects, titleRect, usesTitle, NEW_LAYOUTS_ALL} from './layouts.ts';
import {CARDS51_VIEWS} from '../cards51/views';
import {IMAGE_VIEWS} from '../images51/ImageViews';
import {GRID, splitRows, type Rect} from './grid.ts';
import {COLOR, FONT, MOTION, SPRING, TYPE, FROST, glassEnter, steadySpring as spring} from './tokens';
import type {Shot, TimelineWindow} from './types';
import {entranceAt} from '../sync/timeline.ts';
import {SEQ, LINK_GAP, SEQ_KEY, recordSeqItem, normalizeSeqAnchors, actIndex} from './sequence.ts';
import {LINK_MODE, FALLBACK_MIN_GAP} from './sequence-spec.ts';
import {DomCheck} from './domcheck';
import {cards51Specs} from '../cards51/specs.ts';
import {imageSpecs} from '../images51/specs.ts';
import {SMALL_LAYOUTS, IMAGE_LAYOUTS} from './layouts.ts';
import {LineChartReveal, BarGlow, RankBars, ChartPanel} from './DataCharts';
import {Waffle, Balance, YearRing, FormulaCalc} from './DataCharts2';
import {KeywordCascade, ChecklistFill, VsScore, TipStack, NumberedReveal, KpiGrid} from './mgCards';
import {FloorLadder, PaymentSplit, AmenityOrbit, PitfallBoard, PriceStep, DecisionFork, DistrictTags, LoanDial, LayerReveal} from './mgEstate';
import {NewCardView} from './mgNew';
import {SpatialMotion} from './SpatialMotion';
import {RedStamp} from './RedStamp';
import {OutroScene} from './OutroScene';
import {estimateLuma, textTreatment} from './readability';
import {bgWithLuma} from './measured-luma';

/** 对应短句起点提前两帧起动，口播开始时已能看到入场。未设锚点时使用版式默认值。 */
export const AnchorCtx = React.createContext<Record<string, number>>({});
const useAt = () => {
  const anchors = React.useContext(AnchorCtx);
  // 5.1 顺序：序号键（r0/s0/c0…）按序号严格递增。锚点已在 ShotView 规整；未锚定的尾项不早于最后锚定项 + 间隔。
  const done: Record<string, number> = {}; // 本次渲染已算出的入场帧：未锚定的后续项按「连线时序」顺延
  return (key: string, fallback: number) => {
    const m = SEQ_KEY.exec(key);
    if (!m) return entranceAt(anchors[key], fallback);
    const idx = Number(m[2]); let v: number;
    if (anchors[key] != null) v = entranceAt(anchors[key], fallback);
    else {
      const ug = Math.max(anchors.__gap ?? SEQ.minStagger, FALLBACK_MIN_GAP); // 无锚点时更保守：不许一起出现
      let j = idx - 1; while (j >= 0 && anchors[`${m[1]}${j}`] == null) j--;
      v = j >= 0 ? Math.max(fallback, entranceAt(anchors[`${m[1]}${j}`], 0) + ug * (idx - j)) : fallback;
      const prev = done[`${m[1]}${idx - 1}`]; if (prev != null) v = Math.max(v, prev + ug);
      const r0 = done.r0; if (m[1] === 'r' && idx >= 1 && r0 != null && anchors.__fork) v = Math.max(v, r0 + anchors.__fork);
    }
    done[key] = v;
    recordSeqItem(key, v, anchors[key] != null);
    return v;
  };
};


const TitleFloat: React.FC<{s: Shot}> = ({s}) => {
 const R=layoutRects('titleFloat'),d=s.data,at=useAt(),f=useCurrentFrame(),hook=!!d.hookRhythm,l1=at('l1',4),l2=at('l2',l1+7);
 const turn=at('turn',151),tp=prog(f,turn,8);
 const titleBody={...R.title,y:R.title.y+(hook?46:80),h:R.title.h-(hook?46:80)};
 const M=hook?{x:R.media.x,y:R.media.y,w:R.media.w,h:374}:R.media;
 const swaps=[at('media',65),100,124,151,174,195],types=[0,1,2,0,2,1];
 return <>
  {hook&&<AbsoluteFill data-deco style={{pointerEvents:'none',background:'linear-gradient(90deg,rgba(12,20,30,.54),rgba(12,20,30,.18) 40%,transparent 64%)'}}/>}
  <div style={{position:'absolute',left:R.title.x,top:R.title.y,display:'flex',gap:20}}>{d.chips?.map((c:any,i:number)=><Chip key={i} start={at(`chip${i}`,l1+4+i*14)} tone={c.tone}>{c.t}</Chip>)}</div>
  <SplitType r={titleBody} start={l1} line1={d.line1} line2={d.line2} line2Start={l2} sub={d.sub} rhythm={hook?{focus:'几十套'}:undefined}/>
  {hook?<div data-hook-photo style={{position:'absolute',left:M.x,top:M.y,width:M.w,height:M.h,borderRadius:24,overflow:'hidden',background:'#F2F5F8',border:'1px solid rgba(255,255,255,.84)',boxSizing:'border-box',boxShadow:`0 22px 36px -18px rgba(14,26,40,.36),0 0 24px ${tp>.5?'rgba(255,107,94,.12)':'rgba(91,155,255,.10)'}`}}>
   {swaps.map((st,i)=>{const next=swaps[i+1]??1e6,p=prog(f,st,6),fade=1-prog(f,next,6);if(f<st||fade<=0)return null;return <Img key={i} data-deco src={staticFile(d.hookImages[types[i]])} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:p*fade,transform:`translateX(${24*(1-p)-18*(1-fade)}px) scale(${1+.018*prog(f,st,next-st)})`,transformOrigin:'50% 50%'}}/>;})}
  </div>:<MediaFrame r={M} start={at('media',34)} {...d.media} from="right" soft/>}
  {hook&&d.hypothesis&&<RedStamp r={{x:M.x+(M.w-530)/2,y:720,w:530,h:112}} text={d.hypothesis} start={at('choice',128)} end={turn}/>}
  {d.callout&&<SoftCallout r={R.callout} start={at('callout',l1+28)} text={d.callout} icon={d.icon??'▲'}/>}
 </>;
};

const BareNumView: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('bareNumber'); const d = s.data; const at = useAt(); const c0 = at('count', 10); const f = useCurrentFrame(); const N = R.number;
  return <>
    <div style={{position: 'absolute', left: N.x, top: N.y, width: N.w, height: N.h, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 48}}>
      <Chip start={6} tone="gold">{d.chip}</Chip>
      <BareNumber r={{x: 0, y: 0, w: N.w, h: 260}} start={c0} value={d.value} unit={d.unit} dec={d.dec} label={d.label} size={d.size ?? 220} instant={d.instant} flow />
      <div style={{position: 'relative'}}>
        <UnderlineDraw x={0} y={0} w={360} start={c0 + 18} />
        <div style={{paddingTop: 28, fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, opacity: prog(f, at('formula', c0 + 22), 14)}} data-role="body">
          <GoldText text={d.formula} />
        </div>
      </div>
      <div style={{display: 'flex', gap: 24}}>{d.chips?.map((c: any, i: number) => <Chip key={i} start={c0 + 30 + i * 6} tone={c.tone}>{c.t}</Chip>)}</div>
    </div>
    <MediaFrame r={R.media} start={at('media', c0 + 26)} {...d.media} from="right" soft />
  </>;
};

const SplitVs: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('splitVs'); const d = s.data; const A = R.connArrow; const at = useAt(); const l0 = at('L', 28), r0 = Math.max(at('R', Math.max(36, l0 + 8)), l0 + LINK_GAP); // 左卡停稳 → 箭头长 → 右卡出现
  return <>
    <MediaFrame r={R.mediaL} start={at('mediaL', l0 + 8)} {...d.L.media} from="left" soft />
    <ArrowConnector x={A.x + 48} y={A.y + 18} w={A.w - 96} a={l0} b={r0} />
    <MediaFrame r={R.mediaR} start={at('mediaR', Math.max(l0 + 30, r0))} {...d.R.media} from="right" soft />
    <BareNumber r={R.dataL} start={l0} value={d.L.value} unit={d.L.unit} dec={d.L.dec} label={d.L.label} gold={d.winner === 'L'} size={110}>
      {d.L.chip && <Chip start={l0 + 16} tone={d.L.chip.tone}>{d.L.chip.t}</Chip>}
    </BareNumber>
    <BareNumber r={R.dataR} start={r0} value={d.R.value} unit={d.R.unit} dec={d.R.dec} label={d.R.label} gold={d.winner === 'R'} size={110}>
      {d.R.chip && <Chip start={r0 + 12} tone={d.R.chip.tone}>{d.R.chip.t}</Chip>}
    </BareNumber>
  </>;
};

const TimelineWindows: React.FC<{r: Rect; cards: TimelineWindow[]; starts: number[]}> = ({r, cards, starts}) => {
  const f = useCurrentFrame();
  const width = (r.w - GRID.gutter * (cards.length - 1)) / cards.length;
  const current = starts.reduce((latest, start, i) => f >= start ? i : latest, -1);
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h}}>
    {cards.map(({label, src}, i) => {
      const p = glassEnter(f, starts[i]);
      const lit = current === i;
      return <div key={src} data-window={i} style={{
        position: 'absolute', left: i * (width + GRID.gutter), top: 0, width, height: '100%',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
        borderRadius: 18, overflow: 'hidden', border: `1px solid ${lit ? 'var(--acc)' : 'rgba(240,244,255,.25)'}`,
        background: '#191e27', boxShadow: '0 10px 30px rgba(7,13,24,.45)',
        opacity: p, transform: `translateY(${16 * (1 - p)}px)`,
      }}>
        <Img src={staticFile(src)} style={{width: '100%', height: 0, flex: '1 1 auto', objectFit: 'cover'}} />
        <div style={{
          display: 'grid', placeItems: 'center', minHeight: 67,
          background: 'linear-gradient(180deg,#303642,#202631)', fontFamily: FONT.title,
          fontSize: TYPE.rowTitle, letterSpacing: 2, lineHeight: 1.25, color: lit ? 'var(--acc)' : COLOR.warm,
        }}>{label}</div>
      </div>;
    })}
  </div>;
};

const TimelineView: React.FC<{s: Shot; dur: number}> = ({s, dur}) => {
  const f = useCurrentFrame(); const d = s.data;
  const windows = d.windows?.length ? d.windows as TimelineWindow[] : undefined;
  const R = layoutRects('timeline', d.steps.length, {windows: !!windows});
  const at = useAt(); const sts = d.steps.map((_: any, i: number) => at(`s${i}`, 8 + i * Math.max(14, Math.min(40, (dur - 58) / Math.max(1, d.steps.length))))); const act = Math.max(0, actIndex(f, sts));
  const next = d.note?.next && f >= at('noteNext', dur);
  return <>
    <Timeline r={R.steps} start={8} steps={d.steps} active={act} starts={sts} dur={dur} />
    {windows ? <TimelineWindows r={R.windows} cards={windows} starts={windows.map((_, i) => at(`w${i}`, dur))} />
      : d.note && <SoftCallout key={next ? 'next' : 'first'} r={R.note} start={next ? at('noteNext', dur) : at('note', dur - 56)}
        text={next ? d.note.next : d.note.t} tone={d.note.tone} icon={d.note.icon} />}
  </>;
};

const rowRects = (r: Rect, n: number) => splitRows(r.y, r.h, Array(n).fill(1), 24).map((y) => ({x: r.x, w: r.w, ...y}));

/** 逐项节拍（5.0 默认）：每行在其锚点词说出时入场；当前项高亮、前项变暗；卡片到位停稳；焦点仅改变颜色/亮度 */
const useRowBeats = (n: number, fb: (i: number) => number) => {
  const f = useCurrentFrame(); const at = useAt(); const a = React.useContext(AnchorCtx);
  const starts = Array.from({length: n}, (_, i) => at(`r${i}`, fb(i)));
  const act = Math.max(0, actIndex(f, starts)); void a;
  const sp = (st: number) => Math.min(1, spring({frame: Math.max(0, f - st), fps: 30, config: SPRING.soft}));
  const dim = (i: number) => (i < act ? sp(starts[i + 1] + 4) : 0);
  const nudge = (_i: number) => 0;
  const cam: React.CSSProperties = {}; // v6：关闭前景整体漂移与焦点推近
  return {starts, act, dim, nudge, cam};
};

const MediaRows: React.FC<{s: Shot; dur: number}> = ({s}) => {
  const d = s.data; const n = d.rows.length; const R = layoutRects('mediaRows', n); const rows = rowRects(R.rows, n);
  const B = useRowBeats(n, (i) => 14 + i * 40); const at = useAt();
  return <>
    <MediaFrame r={R.media} start={at('media', 20)} {...d.media} from="left" soft />
    <AbsoluteFill style={B.cam}>
    {d.rows.map((row: any, i: number) =>
      <IconRow key={i} r={rows[i]} start={B.starts[i]} activeAt={B.starts[i]} offAt={B.starts[i + 1]} dim={B.dim(i)} nudge={B.nudge(i)} idx={`0${i + 1}`} title={row.t} sub={row.s} subStart={at(`rsub${i}`, B.starts[i] - 8)} tip={row.k} active={i === B.act} />)}
    </AbsoluteFill>
  </>;
};

const QuoteStack: React.FC<{s: Shot; dur: number}> = ({s, dur}) => {
  const f = useCurrentFrame(); const d = s.data; const n = d.rows.length; const R = layoutRects('quoteStack', n); const rows = rowRects(R.rows, n);
  const at = useAt(); const B = useRowBeats(n, (i) => 16 + i * 40);
  const nl = String(d.quote).split('\n').length; const ns = d.sub ? String(d.sub).split(/(?<=，)/).length : 0;
  const lineAt = Array.from({length: nl}, (_, i) => at(`q${i}`, 4 + i * 14));
  const subAt = Array.from({length: ns}, (_, i) => at(`sub${i}`, 30 + i * 14));
  // 焦点交接：第一行卡片进来后，引文退后变暗
  const focus = Math.min(1, spring({frame: Math.max(0, f - B.starts[0]), fps: 30, config: SPRING.soft}));
  const warnAt = at('warn', dur - 56);
  const settle = Math.min(1, spring({frame: Math.max(0, f - warnAt), fps: 30, config: SPRING.soft}));
  return <>
    <QuoteBlock r={R.quote} start={lineAt[0]} text={d.quote} sub={d.sub} lineAt={lineAt} subAt={subAt} focus={focus * (1 - 0.5 * settle)} visual={d.visual} cutout={d.cutout} />
    <AbsoluteFill style={B.cam}>
    {d.rows.map((row: any, i: number) =>
      <IconRow key={i} r={rows[i]} start={B.starts[i]} activeAt={B.starts[i]} offAt={B.starts[i + 1]} dim={B.dim(i) * (1 - 0.6 * settle)} nudge={B.nudge(i)} idx={`0${i + 1}`} title={row.t} sub={row.s} subStart={at(`rsub${i}`, B.starts[i] - 8)} tip={row.k} active={i === B.act} />)}
    </AbsoluteFill>
    {d.warn && <SoftCallout r={R.warn} start={warnAt} text={d.warn} tone="coral" />}
  </>;
};

const RingFeature: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('ringFeature'); const d = s.data; const ring = R.ring; const at = useAt();
  const size = ring.h - 70;
  return <>
    <MediaFrame r={R.media} start={at('media', 20)} {...d.media} from="left" soft />
    <div data-viz style={{position: 'absolute', left: ring.x, top: ring.y, width: ring.w, height: ring.h, ...glassMat('dark'), borderRadius: 36, opacity: prog(useCurrentFrame(), at('ring', 18) - 8, 14)}} />
    <ProgressRing cx={ring.x + 40 + size / 2} cy={ring.y + ring.h / 2} size={size} start={at('ring', 18)} ratio={d.ring.ratio} label={d.ring.label} value={d.ring.value} />
    {d.ring.note && <div data-role="body" style={{position: 'absolute', left: ring.x + size + 96, top: ring.y, width: ring.w - size - 140, height: ring.h, display: 'flex', alignItems: 'center',
      fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, whiteSpace: 'pre-line'}}><GoldText text={d.ring.note} /></div>}
    <StatPill r={R.a} start={at('a', Math.max(28, at('ring', 18) + 10))} {...d.a} hi />
  </>;
};

const WaitVs: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('waitVs'); const d = s.data; const A = R.connArrow; const at = useAt(); const l0 = at('L', 26), r0 = Math.max(at('R', Math.max(36, l0 + 8)), l0 + LINK_GAP); // 左卡停稳 → 箭头长 → 右卡出现
  return <>
    <MediaFrame r={R.mediaL} start={at('mediaL', l0 + 8)} {...d.L.media} from="left" soft />
    <MediaFrame r={R.mediaR} start={at('mediaR', Math.max(l0 + 30, r0 + 10))} {...d.R.media} from="right" soft />
    <HighlightBar x={R.numL.x} y={R.numL.y + 8} h={R.numL.h - 16} start={l0 - 2} />
    <BareNumber r={{...R.numL, x: R.numL.x + 40, w: R.numL.w - 40}} start={l0} value={d.L.value} unit={d.L.unit} label={d.L.label} gold={false} size={110}>
      {d.L.chip && <Chip start={l0 + 18} tone={d.L.chip.tone}>{d.L.chip.t}</Chip>}
    </BareNumber>
    <ArrowConnector x={A.x + 48} y={A.y + 16} w={A.w - 96} a={l0} b={r0} />
    <BareNumber r={R.numR} start={r0} value={d.R.value} unit={d.R.unit} label={d.R.label} gold size={110}>
      {d.R.chip && <Chip start={r0 + 12} tone={d.R.chip.tone}>{d.R.chip.t}</Chip>}
    </BareNumber>
  </>;
};

const TriadSoft: React.FC<{s: Shot; dur: number}> = ({s, dur}) => {
  const d = s.data; const R = layoutRects('triadSoft'); const at = useAt();
  return <>
    {d.cols.map((c: any, i: number) => <StatPill key={i} r={R[`c${i}`]} start={at(`c${i}`, 8 + i * 14)} {...c} hi={i === 1} />)}
    <SoftCallout r={R.note} start={at('note', dur - 56)} text={d.note.t} />
  </>;
};

/** 片尾 outroHost（默认）/ outroAir：小滕卡通 + 片尾文案分层排版。
 *  屏幕文字只来自当期片尾文案；模板不自动加任何「点赞/关注/收藏/转发」类引导语，也没有按钮式 CTA。 */
const OUTRO_BAN = /点赞|关注|收藏|转发|三连|评论区|订阅/;
const clean = (t?: string) => (t && !OUTRO_BAN.test(t) ? t : undefined);
const OutroHost: React.FC<{s:Shot}>=({s})=>{
 const d=s.data,ch:string|false=d.character===false?false:(d.character??'media/character/xiaoteng_outro.png'),at=useAt();
 const R=layoutRects('outroHost',0,{character:!!ch});
 const pts:string[]=(d.points??[]).map((x:string)=>clean(x)).filter(Boolean) as string[];
 const lineAt=at('line',14),pointAt=pts.map((_,i)=>at(`r${i}`,lineAt+20+i*16)),noteAt=at('note',(pointAt.at(-1)??lineAt)+20),accountAt=at('account',noteAt+22);
 return <OutroScene data={{...d,line:clean(d.line)??'',points:pts,note:clean(d.note),bubble:clean(d.bubble),eyebrow:clean(d.eyebrow)}} R={R} ch={ch} lineAt={lineAt} pointAt={pointAt} noteAt={noteAt} accountAt={accountAt}/>;
};

const dv = (name: any, C: any, fb = 16) => (({s}: {s: Shot}) => { const at = useAt();
  const items: any[] | undefined = s.data.bars ?? s.data.rows ?? s.data.pts; const base = at('draw', fb);
  // 柱/行/折线点：跟口播锚点 r0/r1…依次生长（无锚点按 18 帧间隔兜底）
  const itemStarts = items && name !== 'formulaCalc' ? items.map((_: any, i: number) => at(`r${i}`, base + 8 + i * (items.length > 5 ? 12 : 18))) : undefined;
  // 水环/方块格/天平没有自带底板：补一块深色玻璃 data-viz 面板，内容内缩，保证对比度
  const R0 = layoutRects(name).chart, pad = name === 'waffle' || name === 'balance' || name === 'yearRing';
  const R = pad ? {x: R0.x + 40, y: R0.y + 32, w: R0.w - 80, h: R0.h - 64} : R0;
  return <>{pad && <ChartPanel r={R0} kind={name} start={base}>{null}</ChartPanel>}<C r={R} start={base} itemStarts={itemStarts} {...s.data} {...(name === 'formulaCalc' ? {termStarts: s.data.terms.map((_: any, i: number) => at(`term${i}`, fb + i * 14)), resultStart: at('result', fb + 14 * s.data.terms.length + 6)} : {})} /></>; }) as React.FC<{s: Shot; dur: number}>;
const DATA_VIEWS = {
  lineReveal: dv('lineReveal', LineChartReveal, 20), barGlow: dv('barGlow', BarGlow, 18), rankBars: dv('rankBars', RankBars),
  waffle: dv('waffle', Waffle, 14), balance: dv('balance', Balance, 14), yearRing: dv('yearRing', YearRing, 12), formulaCalc: dv('formulaCalc', FormulaCalc, 14),
};
/* ===== 5.0 MG 卡片扩展 View：每项锚点 r0/r1…（说到该词入场），无锚点按 fb+i*gap 兜底；有 media 时右侧配图/视频 ===== */
const mv = (name: any, C: any, key: string, listKey: string, gap = 26) => (({s, dur}: {s: Shot; dur: number}) => {
  const at = useAt(); const R = layoutRects(name); const d = s.data; const n = (d[listKey] ?? []).length;
  const g = Math.min(gap, Math.max(12, (dur - 60) / Math.max(1, n)));
  const st = (i: number) => at(`r${i}`, 14 + i * g);
  return <>
    <C r={R[key]} st={st} {...d} />
    {R.media && d.media && <MediaFrame r={R.media} start={at('media', 20)} {...d.media} from="right" soft />}
  </>;
}) as React.FC<{s: Shot; dur: number}>;
const MG_VIEWS = {
  keywordCascade: mv('keywordCascade', KeywordCascade, 'cards', 'words'),
  checklistFill: mv('checklistFill', ChecklistFill, 'list', 'items'),
  vsScore: mv('vsScore', VsScore, 'board', 'rows', 30),
  tipStack: mv('tipStack', TipStack, 'stack', 'tips', 34),
  numberedReveal: mv('numberedReveal', NumberedReveal, 'cards', 'cards', 30),
  kpiGrid: mv('kpiGrid', KpiGrid, 'grid', 'kpis', 14),
};
/* ===== 5.0 房产科普 MG（已定 9 种，mgEstate.tsx）：锚点 r0/r1…；n = 节拍数；R 传整组矩形 ===== */
const ev = (name: any, C: any, beats: (d: any) => number, gap = 24, one?: string) => (({s, dur}: {s: Shot; dur: number}) => {
  const at = useAt(); const R = layoutRects(name); const d = s.data; const n = Math.max(1, beats(d));
  const g = Math.min(Math.max(gap, 14), Math.max(14, (dur - 70) / n)); const st = (i: number) => at(`r${i}`, 16 + i * g);
  return <C {...(one ? {r: R[one]} : {R})} st={st} dur={dur} {...d} />;
}) as React.FC<{s: Shot; dur: number}>;
const ESTATE_VIEWS = {
  floorLadder: ev('floorLadder', FloorLadder, (d) => d.floors.length, 18, 'ladder'),
  paymentSplit: ev('paymentSplit', PaymentSplit, (d) => d.parts.length, 18),
  amenityOrbit: ev('amenityOrbit', AmenityOrbit, (d) => d.tags.length, 10, 'orbit'),
  pitfallBoard: ev('pitfallBoard', PitfallBoard, (d) => d.items.length, 16),
  priceStep: ev('priceStep', PriceStep, (d) => d.steps.length, 20, 'steps'),
  decisionFork: ev('decisionFork', DecisionFork, () => 3, 20),
  districtTags: ev('districtTags', DistrictTags, (d) => d.tags.length, 7),
  loanDial: ev('loanDial', LoanDial, (d) => d.stats.length + 1, 14),
  layerReveal: ev('layerReveal', LayerReveal, (d) => d.layers.length, 18),
};
const NEW_VIEWS = Object.fromEntries(NEW_LAYOUTS_ALL.map((name) => [name, (({s, dur}: {s: Shot; dur: number}) => {
  const at = useAt();
  const st = (i: number) => at(`r${i}`, 12 + i * Math.min(16, Math.max(14, (dur - 48) / 6)));
  return <NewCardView layout={name} st={st} data={s.data} textAt={(key) => at(key, 0)} dur={dur} />;
}) as React.FC<{s: Shot; dur: number}>]));
const SMALL_VIEWS = Object.fromEntries(Object.entries({...CARDS51_VIEWS, ...IMAGE_VIEWS}).map(([name, C]) => [name, (({s, dur}: {s: Shot; dur: number}) => { const at = useAt(); return <C s={s} dur={dur} at={at} />; }) as React.FC<{s: Shot; dur: number}>]));
const VIEWS: Record<string, React.FC<{s: Shot; dur: number}>> = {
  ...SMALL_VIEWS,
  ...NEW_VIEWS,
  ...ESTATE_VIEWS,
  ...MG_VIEWS,
  ...DATA_VIEWS,
  titleFloat: ({s}) => <TitleFloat s={s} />,
  bareNumber: ({s}) => <BareNumView s={s} />,
  splitVs: ({s}) => <SplitVs s={s} />,
  timeline: ({s, dur}) => <TimelineView s={s} dur={dur} />,
  mediaRows: ({s, dur}) => <MediaRows s={s} dur={dur} />,
  quoteStack: ({s, dur}) => <QuoteStack s={s} dur={dur} />,
  ringFeature: ({s}) => <RingFeature s={s} />,
  waitVs: ({s}) => <WaitVs s={s} />,
  triadSoft: ({s, dur}) => <TriadSoft s={s} dur={dur} />,
  outroAir: ({s}) => <OutroHost s={s} />,
  outroHost: ({s}) => <OutroHost s={s} />,
};

/** 栏目行：city 可选，填了才显示为前缀 */
export const kickerText = (s: Shot) => (s.kicker ? (s.city ? `${s.city} · ${s.kicker}` : s.kicker) : undefined);

/** 按版式选运镜方向：与内容逻辑一致（对比→横移、流程→轻横移、标题→推近、片尾→稳住） */
const camFor = (layout: string): {dirX: number; dirY: number; zoom: number} => {
  if (layout === 'splitVs' || layout === 'waitVs') return {dirX: 1, dirY: 0, zoom: 1};
  if (layout === 'timeline') return {dirX: 0.55, dirY: 0, zoom: 1};
  if (layout === 'mediaRows') return {dirX: -0.7, dirY: 0.15, zoom: 1};
  if (layout === 'quoteStack') return {dirX: 0.25, dirY: -0.35, zoom: 1.05};
  if (layout === 'titleFloat' || layout === 'bareNumber' || layout === 'ringFeature') return {dirX: 0, dirY: -0.25, zoom: 1.2};
  if (String(layout).startsWith('outro')) return {dirX: 0, dirY: 0, zoom: 0.55};
  return {dirX: 0.4, dirY: -0.15, zoom: 1};
};

export const ShotView: React.FC<{s: Shot; dur: number; exampleData?: boolean; anchors?: Record<string, number>}> = ({s, dur, exampleData, anchors: rawAnchors = {}}) => {
  const f = useCurrentFrame();
  const anchors = normalizeSeqAnchors(rawAnchors, LINK_MODE[s.layout]);
  const View = VIEWS[s.layout];
  const kt = kickerText(s);
  const bg = bgWithLuma(s.bg);
  const treat = textTreatment(bg.luma ?? estimateLuma(bg.dark), bg.p90 ?? bg.luma ?? estimateLuma(bg.dark));
  const fx = (s as any).fx as number | undefined; // 可选：本期加强运镜 + 口播节拍动效
  const cam = {...camFor(s.layout), move: fx ?? 1};
  // v6：所有 MG 前景到位即停，背景自然运镜保留（含旧版式与 fx 路径）。
  const fgTX = 0, fgTY = 0, fgScale = 1;
  const body = <GlassSceneCtx.Provider value={{bg,cam}}><ReadabilityCtx.Provider value={{bright:(bg.luma ?? .45)>.48}}><AbsoluteFill style={{'--glass-lift':(bg.luma ?? .45)<.3?.35:0, color: COLOR.pearlInk} as React.CSSProperties}>
    <CamCtx.Provider value={cam}>
      <Backdrop src={bg.src} video={bg.video} blur={bg.blur} dark={bg.dark} trimStart={bg.trim} neutral={!!s.data.hookRhythm} />
    </CamCtx.Provider>
    <AbsoluteFill style={{transform: `translate(${fgTX}px, ${fgTY}px) scale(${fgScale})`, transformOrigin: '50% 45%'}}>
      {/* 5.1.5 去杂：栏目眉标与「数据为示例」默认不显示（小Lin说式单层级）；确需时 shot.showKicker / shot.exampleMark = true */}
      {kt && (s as any).showKicker === true && <Kicker text={kt} plate={treat === 'bar'} />}
      {exampleData && (s as any).exampleMark === true && <ExampleMark />}
      {usesTitle(s.layout) && s.title && <Headline text={s.title} start={entranceAt(anchors.title, 2)} plate={treat === 'bar'} />}
      {View ? <SpatialMotion duration={dur}><View s={s} dur={dur} /></SpatialMotion> : null}
      {fx ? <Beats s={s} /> : null}
    </AbsoluteFill>
  </AbsoluteFill></ReadabilityCtx.Provider></GlassSceneCtx.Provider>;
  // 音画同步：不再提前 1 秒定格（会和口播错位），只在退场转场期间冻结前景
  const freezeAt = dur - 1;
  const check = !!(getInputProps() as any)?.check && f >= freezeAt;
  const zones: Record<string, Rect> = {...layoutRects(s.layout, s.data?.steps?.length ?? s.data?.rows?.length ?? 3, {character: /^outro/.test(s.layout) ? s.data?.character !== false : !!s.data?.character, windows: !!s.data?.windows?.length}),
    _kicker: {x: 96, y: 56, w: 1240, h: 36}, _example: {x: 1400, y: 56, w: 232, h: 36}};
  if (usesTitle(s.layout)) zones._title = titleRect();
  // 5.1.5：小卡/图片组件的卡位由 specs 自动适配并整组居中，DOM 区 = 各卡实际 spec 矩形
  if ((SMALL_LAYOUTS as readonly string[]).includes(s.layout)) cards51Specs(s.layout, s.data).forEach((c) => { zones['_c_' + c.key] = c; });
  if ((IMAGE_LAYOUTS as readonly string[]).includes(s.layout)) { const g = imageSpecs(s.layout, s.data); [...g.frames, ...g.cards].forEach((c) => { zones['_i_' + c.key] = c; }); }
  return <>
    <AnchorCtx.Provider value={anchors}><LiveFrameCtx.Provider value={f}>{f >= freezeAt ? <Freeze frame={freezeAt}>{body}</Freeze> : body}</LiveFrameCtx.Provider></AnchorCtx.Provider>
    {check && <DomCheck id={s.id} zones={zones} />}
  </>;
};

/* ===== 可选（shot.fx）：口播节拍动效。beats = 说到某词时弹出的小标签/图标；无扫光/整体浮动 ===== */
type Beat = {k: string; t: string; x: number; y: number; tone?: 'gold' | 'green' | 'coral' | 'glass'; icon?: string};
const TONE: Record<string, [string, string]> = {gold: ['rgba(91,155,255,.34)', 'var(--acc)'], green: ['rgba(45,212,191,.36)', 'var(--c-green)'], coral: ['rgba(255,107,94,.36)', '#FFC2B4'], glass: ['rgba(255,255,255,.16)', '#FFFFFF']};
const Beats: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const a = React.useContext(AnchorCtx);
  const beats = ((s as any).beats ?? []) as Beat[];
  return <>{beats.map((b, i) => {
    const st = entranceAt(a[b.k], Infinity); if (f < st) return null;
    const p = spring({frame: f - st, fps, config: SPRING.snappy});
    const ring = Math.min(1, (f - st) / 22);
    const [bg, fg] = TONE[b.tone ?? 'glass'];
    const bob = 0;
    return <div key={i} style={{position: 'absolute', left: b.x, top: b.y + bob, transform: `translate(-50%,-50%) scale(${0.3 + 0.7 * p})`, opacity: Math.min(1, p * 1.8)}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 140, height: 140, marginLeft: -70, marginTop: -70, borderRadius: '50%', border: `3px solid ${fg}`, opacity: (1 - ring) * 0.8, transform: `scale(${0.4 + ring * 1.6})`}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', padding: '12px 28px', borderRadius: 999, ...glassMat('dark', bg),
        fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: FROST.ink}}>
        {b.icon && <span style={{display: 'inline-flex', width: 40, height: 40, borderRadius: '50%', alignItems: 'center', justifyContent: 'center', background: fg, color: COLOR.pearlInk, fontSize: 28}}>{b.icon}</span>}
        {b.t}
      </div>
    </div>;
  })}</>;
};
