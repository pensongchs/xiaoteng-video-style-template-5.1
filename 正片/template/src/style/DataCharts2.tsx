// 第二组数据/MG 样式：排名条 / 方块格 / 天平 / 年份进度环 / 月供算式
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {CHART_INK, COLOR, FONT, FROST, MOTION} from './tokens';
import {glassMat} from './components';
import {PropertyArt} from './illustrations';
import type {Rect} from './grid';
const E = Easing.bezier(0.33, 0, 0.2, 1);
const P = (f: number, a: number, d: number = MOTION.enter) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E});
const abs = (r: Rect): React.CSSProperties => ({position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h});
const GOLD_BAR = 'linear-gradient(90deg, rgba(91,155,255,0.35), rgba(91,155,255,0.8) 60%, rgba(91,155,255,0.95))';
const WARM_BAR = 'linear-gradient(90deg, rgba(236,242,250,0.06), rgba(236,242,250,0.3))';
const num = (size: number, gold?: boolean): React.CSSProperties => ({fontFamily: FONT.num, fontWeight: 700, fontSize: size, color: gold ? COLOR.goldHi : COLOR.warm});
const lab = (size = 34, dim?: boolean): React.CSSProperties => ({fontFamily: FONT.body, fontWeight: 700, fontSize: size, color: dim ? COLOR.sub : COLOR.warm});

/** 2 方块格 10×10 */
export const Waffle: React.FC<{r: Rect; start: number; on: number; value: string; unit: string; caption: string}> = ({r, start, on, value, unit, caption}) => {
  const f = useCurrentFrame(); const size = r.h; const cell = size / 10; const sq = cell - 10;
  const lit = interpolate(f, [start + 10, start + 55], [0, on], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E});
  const tp = P(f, start + 50);
  return <div className="txs" style={abs(r)}>
    {Array.from({length: 100}).map((_, i) => { const c = i % 10, row = Math.floor(i / 10); const a = P(f, start + (c + row) * 1.2, 12); const isOn = i < lit;
      return <div key={i} style={{position: 'absolute', left: c * cell, top: row * cell, width: sq, height: sq, borderRadius: 8, opacity: a,
        background: isOn ? `linear-gradient(160deg,${CHART_INK.key},${CHART_INK.keyDeep})` : 'rgba(236,242,250,0.14)',
        boxShadow: isOn ? '0 0 14px rgba(91,155,255,0.4)' : 'none', border: isOn ? 'none' : '1px solid rgba(236,242,250,0.34)'}} />; })}
    <div style={{position: 'absolute', left: size + 96, top: size * 0.22, width: r.w - size - 96, opacity: tp, transform: `translateY(${(1 - tp) * 24}px)`}}>
      <div style={{whiteSpace: 'nowrap'}}><span style={num(150, true)}>{Math.round(lit)}</span><span style={{...lab(44), marginLeft: 12}}>{unit}</span></div>
      <div style={{...lab(38), marginTop: 24, lineHeight: 1.4, whiteSpace: 'pre-line'}}>{caption}</div>
      <div style={{...lab(28, true), marginTop: 20}}>{value}</div>
    </div>
  </div>;
};

/** 3 天平 */
export const Balance: React.FC<{r: Rect; start: number; L: {k: string; v: string; s: string}; R: {k: string; v: string; s: string}; tilt: number}> = ({r, start, L, R, tilt}) => {
  const f = useCurrentFrame(); const cx = r.w / 2, beamY = 186, arm = 480; // 横梁下移，倾斜后不进标题区
  const t = P(f, start + 24, 40) * tilt; const rad = (t * Math.PI) / 180; const ap = P(f, start);
  const end = (side: -1 | 1) => ({x: cx + side * arm * Math.cos(rad), y: beamY + side * arm * Math.sin(rad)});
  const pan = (side: -1 | 1, d: typeof L, heavy: boolean) => { const e = end(side); const p = P(f, start + 8 + (side > 0 ? 6 : 0));
    return <div style={{position: 'absolute', left: e.x - 200, top: e.y, width: 400, textAlign: 'center', opacity: p}}>
      <div style={{width: 2, height: 60, background: 'rgba(236,242,250,0.4)', margin: '0 auto'}} />
      <div style={{width: 300, height: 14, margin: '0 auto', borderRadius: 7, background: heavy ? GOLD_BAR : 'rgba(236,242,250,0.35)'}} />
      <div style={{...lab(36, !heavy), marginTop: 28}}>{d.k}</div>
      <div style={{whiteSpace: 'nowrap', marginTop: 8}}><span style={num(84, heavy)}>{d.v}</span></div>
      <div style={{...lab(28, true), marginTop: 6}}>{d.s}</div>
    </div>; };
  return <div className="txs" style={abs(r)}>
    <div style={{position: 'absolute', left: cx - 3, top: beamY, width: 6, height: r.h - beamY - 60, background: 'rgba(236,242,250,0.35)', opacity: ap}} />
    <div style={{position: 'absolute', left: cx - 120, top: r.h - 64, width: 240, height: 10, borderRadius: 5, background: 'rgba(236,242,250,0.35)', opacity: ap}} />
    <div style={{position: 'absolute', left: cx - arm, top: beamY - 4, width: arm * 2, height: 8, borderRadius: 4, background: 'rgba(236,242,250,0.75)',
      transform: `rotate(${t}deg)`, opacity: ap}} />
    <div style={{position: 'absolute', left: cx - 16, top: beamY - 16, width: 32, height: 32, borderRadius: 16, background: COLOR.warm, opacity: ap}} />
    {pan(-1, L, tilt < 0)}{pan(1, R, tilt > 0)}
  </div>;
};

/** 4 年份进度环（分段刻度 + 年份标点） */
export const YearRing: React.FC<{r: Rect; start: number; years: number; key1: number; title: string; sub: string; side: {k: string; v: string}[]}> = ({r, start, years, key1, title, sub, side}) => {
  const f = useCurrentFrame(); const D = r.h, R0 = D / 2 - 62, cx = D / 2, cy = D / 2;
  const p = interpolate(f, [start + 10, start + 50], [0, key1 / years], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E});
  const cur = p * years; const hit = P(f, start + 50, 14);
  const pt = (y: number, rr: number) => { const a = (y / years) * 2 * Math.PI - Math.PI / 2; return {x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a)}; };
  return <div className="txs" style={abs(r)}>
    <svg width={D} height={D} style={{position: 'absolute', overflow: 'visible', opacity: P(f, start)}}>
      {Array.from({length: years}).map((_, y) => { const a = pt(y + 0.08, R0), b = pt(y + 0.92, R0); const done = y + 1 <= cur + 0.001;
        const partial = !done && y < cur; const m = partial ? pt(cur, R0) : b;
        return <g key={y}><path d={`M${a.x},${a.y} A${R0},${R0} 0 0 1 ${b.x},${b.y}`} stroke="rgba(236,242,250,0.16)" strokeWidth={34} fill="none" />
          {(done || partial) && <path d={`M${a.x},${a.y} A${R0},${R0} 0 0 1 ${m.x},${m.y}`} strokeWidth={34} fill="none" style={{stroke: COLOR.gold}} />}</g>; })}
      {[0, 10, 20].map((y) => { const q = pt(y, R0 + 52); return <text key={y} x={q.x} y={q.y + 10} textAnchor="middle" style={{fontFamily: FONT.num, fontSize: 28, fill: COLOR.sub}}>{y === 0 ? '30/0' : y}</text>; })}
      {hit > 0 && (() => { const q = pt(key1, R0); return <><circle cx={q.x} cy={q.y} r={22 + 14 * hit} fill="none" strokeWidth={3} opacity={0.7} style={{stroke: COLOR.goldHi}} />
        <circle cx={q.x} cy={q.y} r={14} style={{fill: COLOR.goldHi}} /></>; })()}
    </svg>
    <div style={{position: 'absolute', left: 0, top: cy - 100, width: D, textAlign: 'center'}}>
      <div style={lab(30, true)}>第</div>
      <div style={{whiteSpace: 'nowrap'}}><span style={num(120, true)}>{Math.max(1, Math.ceil(cur))}</span><span style={{...lab(40), marginLeft: 8}}>年</span></div>
    </div>
    <div style={{position: 'absolute', left: D + 120, top: 60, width: r.w - D - 120, opacity: hit, transform: `translateX(${(1 - hit) * 30}px)`}}>
      <div style={{...lab(44), lineHeight: 1.35, whiteSpace: 'pre-line'}}>{title}</div>
      <div style={{...lab(30, true), marginTop: 16, lineHeight: 1.4}}>{sub}</div>
      {side.map((s, i) => <div key={i} style={{marginTop: i ? 24 : 56, opacity: P(f, start + 58 + i * 6)}}>
        <div style={lab(28, true)}>{s.k}</div><div style={num(56)}>{s.v}</div></div>)}
    </div>
  </div>;
};

/** 5 月供算式 */
export const FormulaCalc: React.FC<{r: Rect; start: number; terms: {v: string; k: string}[]; ops: string[]; result: number; unit: string; note: string; resultLabel?: string; noteSize?: number; termStarts?: number[]; resultStart?: number}> = ({r,start,terms,ops,result,unit,note,resultLabel='计算结果',termStarts,resultStart}) => {
 const f=useCurrentFrame(),resultAt=resultStart??start+terms.length*10+14,rp=P(f,resultAt,16),shown=Math.round(result*rp).toLocaleString('en-US');
 const RW=380,gap=56,leftW=r.w-RW-100,cw=(leftW-gap*(terms.length-1))/terms.length,resultX=leftW+100,resultW=RW,TH=340,RH=280,ty=(r.h-TH)/2,ry=(r.h-RH)/2;
 return <div style={abs(r)}>
  {terms.map((t,i)=>{const p=P(f,termStarts?.[i]??start+i*10),x=i*(cw+gap);return <React.Fragment key={i}>
   <div style={{position:'absolute',left:x,top:ty,width:cw,height:TH,...glassMat('dark'),borderRadius:36,opacity:p,transform:`translateY(${(1-p)*28}px)`}}>
    <div style={{position:'absolute',left:cw/2-52,top:22,width:104,height:80}}><PropertyArt kind={/天|小时/.test(t.k)?'clock':'calendar'} /></div>
    <div style={{position:'absolute',left:10,top:116,width:cw-20,textAlign:'center',whiteSpace:'nowrap',fontFamily:FONT.num,fontWeight:700,fontSize:terms.length>2?64:80,lineHeight:1.15,color:FROST.ink}}>{t.v}</div>
    <div data-role="body" style={{position:'absolute',left:10,top:236,width:cw-20,textAlign:'center',whiteSpace:'nowrap',fontFamily:FONT.body,fontWeight:700,fontSize:34,lineHeight:1.35,color:FROST.sub}}>{t.k}</div>
   </div>
   {i<ops.length&&<div style={{position:'absolute',left:x+cw,top:ty+TH/2-40,width:gap,textAlign:'center',fontFamily:FONT.num,fontSize:56,color:COLOR.pearlInk,textShadow:'0 3px 6px rgba(6,16,32,.7)',opacity:P(f,termStarts?.[i+1]??start+i*10+6)}}>{ops[i]}</div>}
  </React.Fragment>;})}
  <div style={{position:'absolute',left:leftW,top:ty+TH/2-40,width:100,textAlign:'center',fontFamily:FONT.num,fontSize:56,color:COLOR.pearlInk,textShadow:'0 3px 6px rgba(6,16,32,.7)',opacity:rp}}>=</div>
  <div style={{position:'absolute',left:resultX,top:ry,width:resultW,height:RH,...glassMat('dark',FROST.tint.gold),borderRadius:40,opacity:rp,transform:`translateY(${(1-rp)*28}px)`}}>
   <div style={{position:'absolute',left:28,top:12,width:resultW-56,fontFamily:FONT.body,fontWeight:700,fontSize:34,lineHeight:1.3,color:FROST.ink}}>{resultLabel.replace(/[≈=]\s*$/,'')}</div>
   <div style={{position:'absolute',left:20,top:56,width:resultW-40,textAlign:'center',whiteSpace:'nowrap',fontFamily:FONT.num,fontWeight:700,fontSize:96,lineHeight:1.1,color:'var(--faint)'}}>{shown}<span style={{fontFamily:FONT.body,fontSize:40,marginLeft:8,color:FROST.ink}}>{unit}</span></div>
   <div data-deco style={{position:'absolute',left:28,right:28,top:170,height:1,background:'rgba(236,242,250,.28)'}}/>
   <div data-role="body" style={{position:'absolute',left:16,top:178,width:resultW-32,textAlign:'center',fontFamily:FONT.body,fontWeight:700,fontSize:34,lineHeight:1.3,color:FROST.ink}}>{note}</div>
  </div>
 </div>;
};
