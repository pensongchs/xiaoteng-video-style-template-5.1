// 数据画面（5.1.1 重做）：柱状 / 折线 / 排名条都放在深色玻璃面板（data-viz）里，直接标数值，
// 只留基线 + 纵轴 + 至多 1–2 条淡网格线；重点柱/点用冰蓝；各项按口播锚点（r0/r1…）依次生长。
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION, CHART_TYPE as CT, CHART_INK as CI, toneVars} from './tokens';
import {toneMat, GlassUnderlay, GlassEdge} from './components';
import type {Rect} from './grid';

const E = Easing.bezier(0.33, 0, 0.2, 1);
export const P = (f: number, a: number, d: number) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E});

/** 图表底板：深色玻璃（navy 色调），所有图表数字都落在它上面，保证对比度。children 用面板内坐标。 */
export const ChartPanel: React.FC<{r: Rect; kind: string; start: number; children: React.ReactNode}> = ({r, kind, start, children}) => {
  const f = useCurrentFrame(); const p = P(f, start - 14, MOTION.enter);
  return <div data-viz={kind} style={{...(toneVars('navy') as any), position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 32, opacity: p,
    boxShadow: '0 20px 50px rgba(6,10,18,0.38)', transform: `translateY(${(1 - p) * 18}px)`}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: 32, overflow: 'hidden'}}><GlassUnderlay r={r} /><div style={{position: 'absolute', inset: 0, ...toneMat('navy'), borderRadius: 32}} /></div>
    <GlassEdge radius={32} />
    {children}
  </div>;
};
const num = (size: number, key?: boolean): React.CSSProperties => ({fontFamily: FONT.num, fontWeight: 700, fontSize: size, lineHeight: 1.1, color: key ? CI.key : COLOR.pearlInk});
const txt = (size: number, dim?: boolean, key?: boolean): React.CSSProperties => ({fontFamily: FONT.body, fontWeight: 700, fontSize: size, lineHeight: 1.3, color: key ? CI.key : dim ? 'rgba(226,234,246,0.86)' : COLOR.pearlInk});
const fmt = (v: number, shown: number) => Number.isInteger(v) ? String(Math.round(shown)) : shown.toFixed(1);

/** 折线：逐点依次描出（跟口播 r0/r1…），每个点直接标数值，峰值用冰蓝放大；左轴 + 基线 + 中/顶两条淡网格。 */
export const LineChartReveal: React.FC<{r: Rect; start: number; pts: {x: string; v: number}[]; peak: number; unit: string; drawDur?: number; vMin: number; vMax: number; itemStarts?: number[]}> =
({r, start, pts, peak, unit, drawDur = 45, vMin, vMax, itemStarts}) => {
  const f = useCurrentFrame();
  const n = pts.length, padL = 150, padR = 70, padT = 150, padB = 100;
  const W = r.w - padL - padR, H = r.h - padT - padB, inX = 70;
  const xy = pts.map((p, i) => ({x: padL + inX + ((W - inX * 2) * i) / (n - 1), y: padT + H * (1 - (p.v - vMin) / (vMax - vMin))}));
  const seg = drawDur / (n - 1);
  const st = (i: number) => itemStarts?.[i] ?? start + seg * i;
  const g = (i: number) => (i === 0 ? P(f, st(0), 10) : P(f, st(i) - 8, 16));
  const shown: {x: number; y: number}[] = [xy[0]];
  for (let i = 1; i < n; i++) { const t = g(i); if (t <= 0) break; shown.push({x: xy[i - 1].x + (xy[i].x - xy[i - 1].x) * t, y: xy[i - 1].y + (xy[i].y - xy[i - 1].y) * t}); }
  const d = shown.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const area = shown.length > 1 ? `${d} L${shown[shown.length - 1].x},${padT + H} L${shown[0].x},${padT + H} Z` : '';
  const base = P(f, start - 10, MOTION.enter);
  const ticks = [vMin, (vMin + vMax) / 2, vMax]; const ty = (v: number) => padT + H * (1 - (v - vMin) / (vMax - vMin));
  const pk = P(f, st(peak) - 2, 16);
  return <ChartPanel r={r} kind="line" start={start}>
    <svg width={r.w} height={r.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs><linearGradient id="lcA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopOpacity="0.30" style={{stopColor: CI.line}} /><stop offset="1" stopOpacity="0" style={{stopColor: CI.line}} /></linearGradient></defs>
      {[ticks[1], ticks[2]].map((v, i) => <line key={i} x1={padL} x2={padL + W * base} y1={ty(v)} y2={ty(v)} strokeWidth={1.5} strokeDasharray="4 10" style={{stroke: CI.grid}} />)}
      <line x1={padL} x2={padL} y1={padT - 20} y2={padT + H} strokeWidth={3} opacity={base} style={{stroke: CI.axis}} />
      <line x1={padL} x2={padL + W * base + 20} y1={padT + H} y2={padT + H} strokeWidth={3} style={{stroke: CI.axis}} />
      {area && <path d={area} fill="url(#lcA)" />}
      <path d={d} fill="none" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" style={{stroke: CI.line}} />
      {xy.map((p, i) => { const t = P(f, st(i) - 2, 12); return t > 0 && i !== peak && <circle key={i} cx={p.x} cy={p.y} r={10 * t} strokeWidth={4} style={{fill: '#12233F', stroke: COLOR.pearlInk}} />; })}
      {pk > 0 && <><circle cx={xy[peak].x} cy={xy[peak].y} r={16 + 20 * (1 - pk)} fill="none" strokeWidth={4} opacity={0.5 + 0.5 * pk} style={{stroke: CI.key}} />
        <circle cx={xy[peak].x} cy={xy[peak].y} r={14 * pk} style={{fill: CI.key}} /></>}
    </svg>
    {ticks.map((v, i) => <div key={i} style={{position: 'absolute', left: 0, width: padL - 22, top: ty(v) - 20, textAlign: 'right', ...num(CT.tick), color: 'rgba(226,234,246,0.86)', opacity: base}}>{v.toFixed(2)}</div>)}
    <div style={{position: 'absolute', left: 28, top: 30, ...txt(CT.unit, true), opacity: base}}>单位：{unit}</div>
    {pts.map((p, i) => { const t = P(f, st(i) - 2, 14); const key = i === peak;
      return <React.Fragment key={i}>
        <div style={{position: 'absolute', left: xy[i].x - 70, width: 140, top: padT + H + 22, textAlign: 'center', ...txt(CT.unit, !key, key), opacity: t}}>{p.x}</div>
        {!key && <div style={{position: 'absolute', left: xy[i].x - 70, width: 140, top: xy[i].y - 62, textAlign: 'center', ...num(40), opacity: t, transform: `translateY(${(1 - t) * 10}px)`}}>{p.v.toFixed(2)}</div>}
        {key && <div style={{position: 'absolute', left: xy[i].x - 180, width: 360, top: xy[i].y - 118, textAlign: 'center', whiteSpace: 'nowrap', opacity: pk, transform: `translateY(${(1 - pk) * 16}px)`}}>
          <span style={num(CT.valueKey, true)}>{p.v.toFixed(2)}</span><span style={{...txt(CT.unit, true), marginLeft: 8}}>{unit}</span></div>}
      </React.Fragment>; })}
  </ChartPanel>;
};

/** 柱状：左轴 + 基线 + 1 条淡网格；每根柱按口播锚点依次长出，数值直接标在柱顶；重点柱冰蓝。 */
export const BarGlow: React.FC<{r: Rect; start: number; bars: {k: string; v: number; hi?: boolean}[]; unit: string; vMax: number; barW?: number; itemStarts?: number[]}> =
({r, start, bars, unit, vMax, barW = 200, itemStarts}) => {
  const f = useCurrentFrame();
  const padL = 70, padR = 60, padT = 150, padB = 104;
  const H = r.h - padT - padB, W = r.w - padL - padR, slot = W / bars.length, bw = Math.min(barW, slot * 0.58);
  const base = P(f, start - 10, MOTION.enter), floor = padT + H;
  return <ChartPanel r={r} kind="bar" start={start}>
    <div style={{position: 'absolute', left: padL, top: padT, width: W * base, borderTop: `2px dashed ${CI.grid}`}} />
    <div style={{position: 'absolute', left: padL, top: padT - 24, width: 3, height: H + 24, background: CI.axis, opacity: base}} />
    <div style={{position: 'absolute', left: padL, top: floor, width: (W + 20) * base, height: 3, background: CI.axis}} />
    <div style={{position: 'absolute', left: 28, top: 28, ...txt(CT.unit, true), opacity: base}}>单位：{unit}</div>
    {bars.map((b, i) => {
      const s = itemStarts?.[i] ?? start + i * MOTION.stagger * 2; const g = P(f, s, 30); const h = H * (b.v / vMax) * g; const cx = padL + slot * i + slot / 2;
      const fill = b.hi ? 'linear-gradient(180deg, #CFE2FF, #7DB0FF 55%, #4F8CF0)' : 'linear-gradient(180deg, rgba(214,226,244,0.80), rgba(168,188,218,0.50))';
      return <React.Fragment key={i}>
        <div style={{position: 'absolute', left: cx - bw / 2, width: bw, top: floor - h, height: h, borderRadius: '14px 14px 0 0', background: fill,
          boxShadow: b.hi ? '0 0 36px rgba(125,176,255,0.40)' : 'none'}} />
        <div style={{position: 'absolute', left: cx - 190, width: 380, top: floor - h - (b.hi ? 112 : 92), textAlign: 'center', whiteSpace: 'nowrap', opacity: P(f, s + 6, 16)}}>
          <span style={num(b.hi ? CT.valueKey : CT.value, b.hi)}>{fmt(b.v, b.v * g)}</span><span style={{...txt(CT.unit, true, b.hi), marginLeft: 8}}>{unit}</span>
        </div>
        <div style={{position: 'absolute', left: cx - slot / 2, width: slot, top: floor + 22, textAlign: 'center', ...txt(CT.label, !b.hi, b.hi), opacity: P(f, s - 4, MOTION.enter)}}>{b.k}</div>
      </React.Fragment>;
    })}
  </ChartPanel>;
};

/** 横向排名条：纵轴线 + 每行类目/条/数值，首行（最大项）冰蓝，其余冰灰；逐行按口播长出。 */
export const RankBars: React.FC<{r: Rect; start: number; rows: {k: string; v: number}[]; unit: string; vMax: number; itemStarts?: number[]}> = ({r, start, rows, unit, vMax, itemStarts}) => {
  const f = useCurrentFrame(); const padL = 330, padR = 250, padT = 40, padB = 36; const barMax = r.w - padL - padR;
  const pitch = (r.h - padT - padB) / rows.length, bh = Math.min(48, pitch * 0.56), base = P(f, start - 10, MOTION.enter);
  return <ChartPanel r={r} kind="rank" start={start}>
    <div style={{position: 'absolute', left: padL, top: padT - 8, width: 3, height: (r.h - padT - padB + 16) * base, background: CI.axis}} />
    {rows.map((o, i) => {
      const s = itemStarts?.[i] ?? start + i * MOTION.stagger * 2; const g = P(f, s + 4, 30); const hi = i === 0; const cy = padT + pitch * i + pitch / 2;
      return <React.Fragment key={i}>
        <div style={{position: 'absolute', left: 36, width: padL - 36 - 24, top: cy - 26, textAlign: 'right', whiteSpace: 'nowrap', ...txt(CT.label, !hi, hi), opacity: P(f, s, MOTION.enter)}}>{o.k}</div>
        <div style={{position: 'absolute', left: padL, top: cy - bh / 2, width: barMax * (o.v / vMax) * g, height: bh, borderRadius: '0 14px 14px 0',
          background: hi ? 'linear-gradient(90deg, #4F8CF0, #8DB8FF 60%, #CFE2FF)' : 'linear-gradient(90deg, rgba(168,188,218,0.50), rgba(214,226,244,0.80))', boxShadow: hi ? '0 0 30px rgba(125,176,255,0.35)' : 'none'}} />
        <div style={{position: 'absolute', left: padL + barMax * (o.v / vMax) * g + 22, top: cy - 34, whiteSpace: 'nowrap', opacity: P(f, s + 6, 14)}}>
          <span style={num(hi ? CT.rowValueKey : CT.rowValue, hi)}>{(o.v * g).toFixed(1)}</span><span style={{...txt(CT.unit, true, hi), marginLeft: 8}}>{unit}</span></div>
      </React.Fragment>;
    })}
  </ChartPanel>;
};
