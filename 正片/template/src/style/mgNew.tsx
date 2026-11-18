// 磨砂玻璃扩展17款。停稳坐标来自 scenes.ts；入场用 18 帧 quint，到位后不再移动。
// 整组放在同一个透视平面上，连线和卡边一起侧转，避免线头和卡片错开。
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {glassMat, toneMat, GlassUnderlay, GlassEdge} from './components';
import {DEPTH, FONT, FOG, FROST, fogFill, glassEnter, toneVars, type FogTone} from './tokens';
import {layoutRects} from './layouts.ts';
import {sceneOf, type CardGeom, type TextRun, type Scene} from './scenes.ts';
import {layoutPlan, planById, type Plan} from './floorplans.ts';
import type {Pt} from './geom.ts';
import type {Rect} from './grid.ts';
import {PropertyArt} from './illustrations';
import {PhotoCutout} from './PhotoCutout';
import {GlassArrow} from './GlassArrow';
import {connectionProgress} from './connections';

export type Starts = (i: number) => number;
const fogStyle = (tone: FogTone): React.CSSProperties => toneMat(tone);
const FIG = ['var(--c-blue)', 'var(--acc)', 'var(--c-green)', 'var(--c-coral)'];
const axisRect = (poly: Pt[]) => {
  if (poly.length !== 4) return false;
  const xs = [...new Set(poly.map((p) => p[0]))], ys = [...new Set(poly.map((p) => p[1]))];
  return xs.length === 2 && ys.length === 2;
};
const softRadius = (w: number, h: number) => Math.round(Math.min(42, Math.max(28, Math.min(w, h) * 0.22)));
const liftOf = (id: string, i: number) => id === 'house' ? 26 : id === 'people' ? 12 : id === 'vs' ? 40 : 10 + (i % 4) * 6;
const isStep = (t: TextRun) => t.role === 'label' && /^\d{2}$/.test(t.text);

const Figure: React.FC<{x: number; y: number; w: number; h: number; color: string}> = ({x, y, w, h, color}) => {
  const child = h < 170;
  const head = Math.min(w * (child ? 0.78 : 0.56), h * (child ? 0.4 : 0.28));
  const bodyW = w * (child ? 0.7 : 0.62);
  const bodyTop = head + Math.max(6, h * 0.045);
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
    <div style={{position: 'absolute', left: '50%', top: 0, width: head, height: head, marginLeft: -head / 2, borderRadius: '50%', background: color,
      boxShadow: 'inset 0 -5px 8px rgba(10,18,32,0.14)'}} />
    <div style={{position: 'absolute', left: '50%', top: bodyTop, bottom: 0, width: bodyW, marginLeft: -bodyW / 2, borderRadius: bodyW * 0.48, background: color,
      boxShadow: 'inset 0 -12px 14px rgba(10,18,32,0.1)'}} />
  </div>;
};

const CardFace: React.FC<{card: CardGeom; p: number; i: number; yaw: number; starts?: number[]}> = ({card, p, i, yaw, starts}) => {
  const frame = useCurrentFrame();
  const xs = card.poly.map((pt) => pt[0]), ys = card.poly.map((pt) => pt[1]);
  const left = Math.min(...xs), top = Math.min(...ys);
  const width = Math.max(...xs) - left, height = Math.max(...ys) - top;
  const rect = axisRect(card.poly);
  const clip = `polygon(${card.poly.map((pt) => `${((pt[0] - left) / width) * 100}% ${((pt[1] - top) / height) * 100}%`).join(',')})`;
  const local = card.poly.map((pt) => `${pt[0] - left},${pt[1] - top}`).join(' ');
  const face: React.CSSProperties = rect
    ? {borderRadius: softRadius(width, height), overflow: 'hidden'}
    : {clipPath: clip, border: 'none', boxShadow: `inset 0 1.5px 0 ${FROST.top}, inset 0 -14px 20px ${FROST.bottom}`,
      filter: 'drop-shadow(0 12px 12px rgba(16,43,60,0.28))'};
  const ink = FOG[card.tone].ink;
  return <div data-mg-card={card.id} style={{...(toneVars(card.tone) as any), position: 'absolute', left, top, width, height, overflow: 'visible', borderRadius:36, boxShadow:FROST.shadow, opacity: Math.min(1, p), zIndex: 2 + i,
    transform: `translateY(${(1 - p) * 26}px) translateZ(${liftOf(card.id, i)}px) rotateY(${yaw}deg)`, transformOrigin: '50% 58%', transformStyle: 'preserve-3d'}}>
    <div style={{position: 'absolute', left: width * 0.1, top: height - 8, width: width * 0.8, height: 34, borderRadius: '50%', pointerEvents: 'none',
      background: 'radial-gradient(ellipse at center, rgba(12,39,57,0.30), rgba(12,39,57,0) 70%)', filter: 'blur(6px)'}} />
    <div style={{position: 'absolute', inset: 0, ...face}}><GlassUnderlay r={{x:left,y:top,w:width,h:height}}/><div style={{position:'absolute',inset:0,...fogStyle(card.tone),borderRadius:'inherit'}}/><GlassEdge radius={36}/>
      {card.id === 'people' && card.marks?.map((m, k) => <Figure key={k} x={m.x - left} y={m.y - top} w={m.w} h={m.h} color={FIG[k % 4]} />)}
    </div>
    {card.id==='doc'&&<svg data-deco style={{position:'absolute',left:36,top:110,width:width*.48,height:height-150}} viewBox="0 0 300 380">
      {[0,1,2,3,4,5].map(i=><g key={i}><rect x="0" y={20+i*44} width={i%2?195:250} height="7" rx="3.5" opacity=".30" style={{fill: 'var(--faint)'}} />{i===2&&<rect x="-8" y={12+i*44} width="270" height="24" rx="7" opacity=".30" style={{fill: 'var(--acc)'}} />}</g>)}
      <path d="M20 330 Q55 300 65 330 T120 324" strokeWidth="3" fill="none" style={{stroke: 'var(--faint)'}} /><rect x="160" y="302" width="74" height="54" rx="5" fill="none" strokeWidth="3" opacity=".65" style={{stroke: 'var(--c-coral)'}} />
    </svg>}
    {!rect && <svg style={{position: 'absolute', inset: 0, width, height, overflow: 'visible', pointerEvents: 'none'}}>
      <polygon points={local} fill="none" stroke="rgba(150,176,186,0.45)" strokeWidth={3} />
      <polygon points={local} fill="none" stroke="rgba(236,242,250,0.9)" strokeWidth={1.5} />
    </svg>}
    {card.visual && <div style={{position:'absolute',left:card.visual.box.x-left,top:card.visual.box.y-top,width:card.visual.box.w,height:card.visual.box.h,opacity:p}}><PhotoCutout src={card.visual.src} kind={card.visual.kind} color={FOG[card.tone].accent}/></div>}
    {card.texts.map((t, k) => {
      const step = isStep(t);
      const room = t.role === 'room';
      return <div key={k} data-role={t.role === 'body' ? 'body' : t.role === 'room' ? 'room' : 'label'} data-fit="card" style={{
        position: 'absolute', left: t.box.x - left, top: t.box.y - top, width: t.box.w, height: t.box.h,
        opacity: starts?.[k] == null ? 1 : glassEnter(frame, starts[k], 'chip'),
        display: 'flex', alignItems: 'center', justifyContent: t.align === 'center' || step || room ? 'center' : 'flex-start',
        boxSizing: 'border-box', whiteSpace: 'nowrap', lineHeight: 1.3,
        fontFamily: t.role === 'num' ? FONT.num : FONT.body, fontWeight: 700, fontSize: t.size,
        letterSpacing: t.role === 'num' ? -1 : step ? 0.5 : 0,
        color: step ? '#0B1424' : ink,
        transform: step ? 'translateZ(34px)' : undefined,
        borderRadius: step ? 999 : room ? 18 : 0,
        background: step ? 'linear-gradient(180deg, color-mix(in srgb, var(--acc-raw) 55%, white), var(--acc-raw))' : room ? 'rgba(236,242,250,0.46)' : 'transparent',
        border: room ? '1px solid rgba(10,18,32,0.14)' : 'none',
        boxShadow: step ? '0 8px 14px rgba(6,22,36,0.28), inset 0 1.5px 0 rgba(236,242,250,0.9)' : room ? 'inset 0 1px 0 rgba(236,242,250,0.7)' : 'none',
      }}>{t.text}</div>;
    })}
  </div>;
};

const bboxOf=(poly:[number,number][])=>{const xs=poly.map(q=>q[0]),ys=poly.map(q=>q[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};};
const Lines: React.FC<{scene:Scene;st:Starts;dur?:number}> = ({scene,st,dur}) => {
 const f=useCurrentFrame();
 return <svg data-deco style={{position:'absolute',left:0,top:0,width:1920,height:1080,overflow:'visible',pointerEvents:'none'}}>
  {scene.lines.map(ln=>{
   // 端点：优先用 fromCard/toCard；未登记时按几何就近推断——终点贴哪张卡就连到哪张卡，起点不贴卡则视为底图（随第 0 张卡出现）
   const boxes=scene.cards.map(c=>bboxOf(c.poly as [number,number][])),near=(q:[number,number],skip=-1)=>{let k=-1,best=Infinity;boxes.forEach((b,i)=>{if(i===skip)return;const dd=Math.hypot(Math.max(b.x-q[0],0,q[0]-b.x-b.w),Math.max(b.y-q[1],0,q[1]-b.y-b.h));if(dd<best){best=dd;k=i;}});return {k,dd:best};};
   const P0=ln.pts[0] as [number,number],P1=ln.pts.at(-1) as [number,number];
   const ti=ln.toCard?scene.cards.findIndex(c=>c.id===ln.toCard):ln.beat!=null?Math.min(scene.cards.length-1,ln.beat):near(P1).k;
   const nf=near(P0,ti),fi:number|'hub'=ln.fromCard?scene.cards.findIndex(c=>c.id===ln.fromCard):ln.beat!=null?Math.max(0,ln.beat-1):nf.dd<=40?nf.k:'hub';
   const aS=fi==='hub'?st(0):st(Math.max(0,fi)),bS=st(Math.max(0,ti));
   const p=ln.kind==='diagram'?glassEnter(f,st(0),'shaped'):connectionProgress(f,aS,bS,{id:ln.id,from:fi,to:Math.max(0,ti),fromKey:fi==='hub'?undefined:`r${Math.max(0,fi)}`,toKey:`r${Math.max(0,ti)}`,dur,pts:ln.pts as [number,number][],fromBox:fi==='hub'?{x:P0[0]-1,y:P0[1]-1,w:2,h:2}:boxes[Math.max(0,fi)],toBox:boxes[Math.max(0,ti)]}),path=ln.d??ln.pts.map((pt,i)=>`${i?'L':'M'}${pt[0]},${pt[1]}`).join(' '),end=ln.pts.at(-1)!,road=ln.width>=12;
   return <g key={ln.id} opacity={p}>
    <path d={path} fill="none" stroke="rgba(10,18,32,.20)" strokeWidth={ln.width+3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" data-link={ln.kind==='diagram'?'diagram':ln.id} strokeDashoffset={1-p}/>
    <path d={path} fill="none" stroke={road?'#C9D8EA':'rgba(236,242,250,.94)'} strokeWidth={ln.width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" data-link={ln.kind==='diagram'?'diagram':ln.id} strokeDashoffset={1-p}/>
    {road&&<path d={path} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={ln.width*.35} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" data-link={ln.kind==='diagram'?'diagram':ln.id} strokeDashoffset={1-p}/>}
    {ln.dot&&p>.98&&<circle cx={end[0]} cy={end[1]} r={3.5} stroke="rgba(91,155,255,.7)" strokeWidth={1.5} style={{fill: 'var(--acc)'}} />}
   </g>;
  })}
 </svg>;
};

const depthFor = (layout: string) => layout === 'planSplit'
  ? {y: 4, x: 2, yaw: 8, origin: '50% 58%'}
  : {y: DEPTH.rotateY, x: DEPTH.rotateX, yaw: DEPTH.cardYaw, origin: DEPTH.origin};
const Stage: React.FC<{layout: string; children: React.ReactNode}> = ({layout, children}) => {
  const d = depthFor(layout);
  return (
  <div style={{position: 'absolute', inset: 0, perspective: DEPTH.perspective, perspectiveOrigin: '48% 44%'}}>
    <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: d.origin, transform: `rotateY(${d.y}deg) rotateX(${d.x}deg)`}}>
      <div style={{position: 'absolute', left: 80, top: 260, width: 1500, height: 640, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 46%, rgba(236,242,250,0.2), rgba(236,242,250,0) 70%)', mixBlendMode: 'soft-light'}} />
      {children}
    </div>
  </div>
  );
};

const FloorFig: React.FC<{plan: Plan; rect: Rect; p: number}> = ({plan, rect, p}) => {
  const {X, Y, scale} = layoutPlan(plan, rect);
  const flow = plan.flow.map((pt) => `${X(pt[0])},${Y(pt[1])}`).join(' ');
  const ext = plan.walls.filter((w) => w.kind === 'exterior');
  const minX = Math.min(...ext.map((w) => w.x)), maxX = Math.max(...ext.map((w) => w.x + w.w));
  const top = Math.min(...ext.map((w) => w.y));
  const dimY = Y(top) - 22;
  return <svg style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'visible'}}>
    <defs>
      <pattern id="wallHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" strokeWidth="1" style={{stroke: 'var(--acc)'}} />
      </pattern>
    </defs>
    {plan.walls.map((w, i) => {
      const x = X(w.x), y = Y(w.y), ww = Math.max(2, w.w * scale), hh = Math.max(2, w.h * scale);
      return <g key={i} opacity={p}>
        <rect x={x} y={y} width={ww} height={hh} fill="url(#wallHatch)" />
        <rect x={x} y={y} width={ww} height={hh} fill="none" strokeWidth={w.kind === 'exterior' ? 2.2 : 1.5} style={{stroke: 'var(--ink)'}} />
      </g>;
    })}
    {plan.openings.map((o, i) => {
      const horiz = o.w >= o.h;
      const x = X(o.x), y = Y(o.y), w = Math.max(2, o.w * scale), h = Math.max(2, o.h * scale);
      if (o.type === 'window') {
        return <g key={i} opacity={p}>
          <rect x={x} y={y} width={w} height={h} fill="#EEF3FA" />
          {horiz ? [0.2, 0.5, 0.8].map((t) => <line key={t} x1={x - 3} x2={x + w + 3} y1={y + h * t} y2={y + h * t} strokeWidth={t === 0.5 ? 1.6 : 1.1} style={{stroke: 'var(--ink)'}} />)
            : [0.2, 0.5, 0.8].map((t) => <line key={t} y1={y - 3} y2={y + h + 3} x1={x + w * t} x2={x + w * t} strokeWidth={t === 0.5 ? 1.6 : 1.1} style={{stroke: 'var(--ink)'}} />)}
        </g>;
      }
      if (o.type === 'slider') {
        return <g key={i} opacity={p} strokeWidth={1.3} style={{stroke: 'var(--ink)'}}>
          <line x1={x} x2={x + w} y1={y + h * 0.35} y2={y + h * 0.35} />
          <line x1={x} x2={x + w} y1={y + h * 0.65} y2={y + h * 0.65} />
        </g>;
      }
      if (!o.leaf.length) return null;
      const [hinge, tip] = o.leaf;
      const len = Math.hypot(tip[0] - hinge[0], tip[1] - hinge[1]);
      const closed: [number, number] = horiz ? [hinge[0] + (o.w >= o.h ? o.w : 0), hinge[1]] : [hinge[0], hinge[1] + o.h];
      const r = Math.max(8, len * scale);
      return <g key={i} opacity={p} fill="none" strokeWidth={1.6} style={{stroke: 'var(--ink)'}}>
        <line x1={X(hinge[0])} y1={Y(hinge[1])} x2={X(tip[0])} y2={Y(tip[1])} />
        <path d={`M ${X(tip[0])} ${Y(tip[1])} A ${r} ${r} 0 0 1 ${X(closed[0])} ${Y(closed[1])}`} strokeDasharray="5 3" />
      </g>;
    })}
    <polyline points={flow} fill="none" strokeWidth={2.5} strokeDasharray="7 5" opacity={p} style={{stroke: 'var(--acc)'}} />
    {plan.flow[0] && <polygon points={`${X(plan.flow[0][0])},${Y(plan.flow[0][1]) - 11} ${X(plan.flow[0][0]) - 7},${Y(plan.flow[0][1]) + 7} ${X(plan.flow[0][0]) + 7},${Y(plan.flow[0][1]) + 7}`} opacity={p} style={{fill: 'var(--acc)'}} />}
    {plan.flow.at(-1) && <circle cx={X(plan.flow.at(-1)![0])} cy={Y(plan.flow.at(-1)![1])} r={5} opacity={p} style={{fill: 'var(--acc)'}} />}
    {plan.rooms.map((r) => <g key={r.name} opacity={p}>
      <text x={X(r.x + r.w / 2)} y={Y(r.y + r.h / 2) - 2} textAnchor="middle" fontFamily="Health" fontWeight={700} fontSize={30} style={{fill: 'var(--ink)'}}>{r.name}</text>
      <text x={X(r.x + r.w / 2)} y={Y(r.y + r.h / 2) + 28} textAnchor="middle" fontFamily="Health" fontWeight={700} fontSize={28} style={{fill: 'var(--faint)'}}>{(r.w * r.h / 1e6).toFixed(1)}㎡</text>
    </g>)}
    <g opacity={p} style={{stroke: 'var(--ink)', fill: 'var(--ink)'}}>
      <line x1={X(minX)} x2={X(maxX)} y1={dimY} y2={dimY} strokeWidth={1.4} />
      <line x1={X(minX)} x2={X(minX)} y1={dimY - 6} y2={dimY + 6} strokeWidth={1.4} />
      <line x1={X(maxX)} x2={X(maxX)} y1={dimY - 6} y2={dimY + 6} strokeWidth={1.4} />
      <text x={(X(minX) + X(maxX)) / 2} y={dimY - 8} textAnchor="middle" fontFamily="Health" fontSize={28} fontWeight={700}>{plan.dimension.mm}</text>
    </g>
    <g opacity={p} transform={`translate(${rect.x + rect.w - 56}, ${rect.y + 28})`}>
      <polygon points="0,-16 6,4 -6,4" style={{fill: 'var(--ink)'}} />
      <text y={22} textAnchor="middle" fontFamily="Health" fontSize={28} fontWeight={700} style={{fill: 'var(--ink)'}}>北</text>
    </g>
  </svg>;
};

const CupFig: React.FC<{p: number}> = ({p}) => {
  const cup = sceneOf('paymentCup').cards.find((c) => c.id === 'cup')!;
  const [a, b, c, d] = cup.poly;
  const bands = [0.32, 0.43, 0.25];
  const fills = ['color-mix(in srgb, var(--c-blue) 58%, rgba(18,28,48,0.6))', 'color-mix(in srgb, var(--c-violet) 52%, rgba(18,28,48,0.6))', 'color-mix(in srgb, var(--c-green) 48%, rgba(18,28,48,0.6))'];
  const yAt = (t: number) => a[1] + (d[1] - a[1]) * t;
  const xL = (t: number) => a[0] + (d[0] - a[0]) * t;
  const xR = (t: number) => b[0] + (c[0] - b[0]) * t;
  let acc = 0;
  const slices = bands.map((share, i) => {
    const t0 = acc; acc += share; const t1 = acc;
    return `${xL(t0)},${yAt(t0)} ${xR(t0)},${yAt(t0)} ${xR(t1)},${yAt(t1)} ${xL(t1)},${yAt(t1)}`;
  });
  const refT = 0.67;
  const label = cup.texts[0];
  return <svg style={{...(toneVars('navy') as any), position: 'absolute', inset: 0, width: 1920, height: 1080, overflow: 'visible', opacity: p}}>
    <defs>
      <linearGradient id="cupFog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style={{stopColor: 'rgba(70,84,112,0.62)'}} />
        <stop offset="100%" style={{stopColor: 'rgba(30,40,62,0.72)'}} />
      </linearGradient>
      <filter id="cupShade"><feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="var(--faint)" floodOpacity="0.28" /></filter>
    </defs>
    <polygon points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]} ${d[0]},${d[1]}`} fill="url(#cupFog)" filter="url(#cupShade)" />
    <polygon points={slices[2]} style={{fill: fills[2]}} />
    <polygon points={slices[1]} style={{fill: fills[1]}} />
    <polygon points={slices[0]} style={{fill: fills[0]}} />
    <polygon points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]} ${d[0]},${d[1]}`} fill="none" stroke="rgba(214,228,255,0.45)" strokeWidth={1.4} />
    <line x1={xL(refT) + 10} x2={xR(refT) - 86} y1={yAt(refT)} y2={yAt(refT)} strokeWidth={2.4} strokeDasharray="7 4" style={{stroke: 'var(--acc)'}} />
    <text x={label.box.x} y={label.box.y + 26} fontFamily="Health" fontWeight={700} fontSize={28} style={{fill: 'var(--ink)'}}>{label.text}</text>
  </svg>;
};

const SectionFig: React.FC<{p: number}> = ({p}) => {
  const R = layoutRects('buildingSection');
  const tower = {x: R.section.x + 36, y: R.section.y + 16, w: 720, h: R.section.h - 32};
  const floors = 12;
  const slab = 8;
  const gap = (tower.h - slab * (floors + 1)) / floors;
  const coreW = 92;
  return <svg style={{...(toneVars('navy') as any), position: 'absolute', inset: 0, width: 1920, height: 1080, overflow: 'visible', opacity: p}}>
    <rect x={tower.x} y={tower.y} width={tower.w} height={tower.h} rx={6} fill="rgba(30,44,72,0.62)" strokeWidth={1.5} style={{stroke: 'var(--edge)'}} />
    {Array.from({length: floors + 1}, (_, i) => {
      const y = tower.y + i * (gap + slab);
      return <rect key={i} x={tower.x} y={y} width={tower.w} height={slab} strokeWidth={0} style={{fill: 'rgba(168,190,226,0.55)'}} />;
    })}
    <rect x={tower.x + 10} y={tower.y + slab} width={coreW} height={tower.h - slab * 2} fill="rgba(70,90,130,0.5)" strokeWidth={1} style={{stroke: 'var(--line)'}} />
    {Array.from({length: floors}, (_, i) => {
      const y = tower.y + slab + i * (gap + slab) + 4;
      const x0 = tower.x + 18;
      return <polyline key={i} points={`${x0},${y + gap - 10} ${x0 + 28},${y + 6} ${x0 + 56},${y + gap - 10}`} fill="none" strokeWidth={1.2} style={{stroke: 'var(--faint)'}} />;
    })}
    {Array.from({length: floors}, (_, i) => {
      const y = tower.y + slab + i * (gap + slab);
      const x = tower.x + 16 + coreW;
      const uw = tower.w - coreW - 28;
      const wash = i < 3 ? 'rgba(91,155,255,0.20)' : i < 8 ? 'rgba(45,212,191,0.16)' : 'rgba(157,140,255,0.20)';
      return <g key={'u' + i}>
        <rect x={x} y={y + 2} width={uw} height={gap - 4} rx={3} strokeWidth={1} style={{fill: wash, stroke: 'var(--line)'}} />
        <rect x={x + uw - 54} y={y + 4} width={46} height={Math.max(8, gap - 8)} fill="none" strokeWidth={1} style={{stroke: 'var(--faint)'}} />
        <line x1={x + uw - 54} x2={x + uw - 8} y1={y + 4 + (gap - 8) / 2} y2={y + 4 + (gap - 8) / 2} strokeWidth={0.8} style={{stroke: 'var(--faint)'}} />
      </g>;
    })}
    <rect x={tower.x - 10} y={tower.y + slab + 3 * (gap + slab) - 6} width={tower.w + 20}
      height={5 * (gap + slab) + 8} rx={18} fill="none" strokeWidth={3.5} style={{stroke: 'var(--acc)'}} />
  </svg>;
};

const ParkingFig:React.FC<{p:number}>=({p})=>{const r=layoutRects('parkingLines').lot;return <div data-deco style={{position:'absolute',left:r.x+16,top:r.y+40,width:r.w-32,height:r.h-80,...glassMat(),borderRadius:36,opacity:p}}><svg viewBox="0 0 1000 540" style={{width:'100%',height:'100%'}}><path d="M40 60H780M40 440H780" strokeWidth="3" style={{stroke: 'var(--acc)'}} />{[0,1,2].map(i=><g key={i} transform={`translate(${90+i*210},145)`}><rect x="0" y="0" width="118" height="210" rx="42" strokeWidth="2" style={{fill: i===1?'var(--acc)':'var(--c-green)', stroke: 'var(--faint)'}} /><rect x="14" y="44" width="90" height="96" rx="20" fill="#EEF3FA" opacity=".70"/><path d="M6 30H112M6 176H112" stroke="#EEF3FA" strokeWidth="3"/></g>)}</svg></div>};

export const NewCardView: React.FC<{layout: string; st: Starts; data?: any; textAt?: (key: string) => number; dur?: number}> = ({layout, st, data, textAt, dur}) => {
  const f = useCurrentFrame();
  const scene = sceneOf(layout, data);
  const p0 = glassEnter(f, st(0), 'shaped');
  const depth = depthFor(layout);
  return <Stage layout={layout}>
    {layout==='parkingLines'&&<ParkingFig p={p0}/>}
    {layout === 'buildingSection' && <SectionFig p={p0} />}
    {layout === 'paymentCup' && <CupFig p={p0} />}
    <Lines scene={scene} st={st} dur={dur} />
    {scene.planId && (() => { const pr = layoutRects('planSplit').plan; return <div data-deco style={{position: 'absolute', left: pr.x - 28, top: pr.y - 36, width: pr.w + 56, height: pr.h + 64, borderRadius: 36, opacity: p0, ...toneMat('navy')}} />; })()}
    {scene.planId && <div style={{...(toneVars('navy') as any)}}><FloorFig plan={planById(scene.planId)} rect={layoutRects('planSplit').plan} p={p0} /></div>}
    {scene.cards.filter((c) => c.id !== 'cup').map((c) => {
      const i = scene.cards.indexOf(c);
      return <CardFace key={c.id} card={c} p={glassEnter(f, st(i), 'shaped')} i={i} yaw={depth.yaw} starts={data?.textAnchors?.[c.id]?.map((key: string) => textAt?.(key) ?? 0)} />;
    })}
    {layout === 'slashCompare' && <GlassArrow x={layoutRects('slashCompare').left.x+layoutRects('slashCompare').left.w+8} y={layoutRects('slashCompare').left.y+layoutRects('slashCompare').left.h/2} w={layoutRects('slashCompare').right.x-layoutRects('slashCompare').left.x-layoutRects('slashCompare').left.w-16} progress={connectionProgress(f,st(0),st(1),{id:'slash',from:0,to:1,dur,pts:[[layoutRects('slashCompare').left.x+layoutRects('slashCompare').left.w+8,0],[layoutRects('slashCompare').right.x-8,0]],fromBox:{...layoutRects('slashCompare').left,y:0,h:1},toBox:{...layoutRects('slashCompare').right,y:0,h:1}})}/>}
    {layout === 'archLight' && <Sun p={p0} />}
  </Stage>;
};

const Sun: React.FC<{p: number}> = ({p}) => {
  const a = layoutRects('archLight').arch;
  const cx = a.x + a.w / 2, rad = (a.w - 48) / 2, cy = a.y + 36 + rad;
  const ang = Math.PI * (0.15 + 0.7 * p);
  const x = cx + Math.cos(Math.PI - ang) * (rad * 0.72);
  const y = cy - Math.sin(ang) * (rad * 0.42);
  return <div style={{position: 'absolute', left: x - 16, top: y - 16, width: 32, height: 32, borderRadius: 16, background: 'var(--acc)', opacity: p}} />;
};
