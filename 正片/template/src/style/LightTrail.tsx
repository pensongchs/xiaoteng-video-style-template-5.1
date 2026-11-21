import React from 'react';
import {TRAIL} from './tokens';

/** 由点列生成 SVG 路径。进度 p 必须由调用方用 linkProgress / connectionProgress 算好再传入，本组件不自算时刻。 */
export const pathFromPts = (pts: [number, number][]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');

const lastPoint = (d: string, tipAt?: [number, number]): [number, number] | null => {
  if (tipAt) return tipAt;
  const ms = [...d.matchAll(/([ML])\s*(-?[\d.]+)\s*[, ]\s*(-?[\d.]+)/gi)];
  if (ms.length) return [Number(ms[ms.length - 1][2]), Number(ms[ms.length - 1][3])];
  const hs = [...d.matchAll(/H\s*(-?[\d.]+)/gi)], vs = [...d.matchAll(/V\s*(-?[\d.]+)/gi)];
  if (ms.length === 0 && (hs.length || vs.length)) {
    const nums = [...d.matchAll(/-?[\d.]+/g)].map(Number);
    if (nums.length >= 2) return [nums[nums.length - 2] ?? nums[0], nums[nums.length - 1]];
  }
  return null;
};

type StrokeProps = {d: string; p: number; id?: string; tip?: boolean; tipAt?: [number, number]; coreW?: number};

/** 可嵌进已有 <svg> 的光影描边（芯 + 辉光 + bloom）。data-link 打在每一层，供 check-sequence 核对。 */
export const TrailStrokes: React.FC<StrokeProps> = ({d, p, id, tip = true, tipAt, coreW = TRAIL.coreW}) => {
  const q = Math.max(0, Math.min(1, p));
  const k = coreW / TRAIL.coreW;
  const dash = {pathLength: 1 as const, strokeDasharray: '1 1', strokeDashoffset: 1 - q, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const};
  const uid = `lt-${String(id ?? 'x').replace(/[^A-Za-z0-9_-]/g, '')}`;
  const end = tip ? lastPoint(d, tipAt) : null;
  const tipO = Math.max(0, Math.min(1, (q - 0.72) / 0.28));
  return <g data-deco>
    <defs>
      <filter id={uid} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={2.8 * k} />
      </filter>
    </defs>
    <path d={d} {...dash} stroke={TRAIL.bloom} strokeWidth={TRAIL.bloomW * k} filter={`url(#${uid})`} data-link={id} opacity={0.8 * q} />
    <path d={d} {...dash} stroke={TRAIL.mid} strokeWidth={TRAIL.glowW * k} data-link={id} opacity={0.88 * q} />
    <path d={d} {...dash} stroke={TRAIL.core} strokeWidth={coreW} data-link={id} opacity={0.25 + 0.75 * q} />
    {end && <g opacity={tipO}>
      <circle cx={end[0]} cy={end[1]} r={7 * k} fill={TRAIL.bloom} filter={`url(#${uid})`} />
      <circle cx={end[0]} cy={end[1]} r={3.6 * k} fill={TRAIL.tip} stroke={TRAIL.tipRing} strokeWidth={1.2} />
    </g>}
  </g>;
};

/** 独立铺在镜头上的光影线（默认 1920×1080）。 */
export const LightTrail: React.FC<StrokeProps & {x?: number; y?: number; w?: number; h?: number}> =
({x = 0, y = 0, w = 1920, h = 1080, ...rest}) => (
  <svg data-deco style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'visible', pointerEvents: 'none'}}>
    <TrailStrokes {...rest} />
  </svg>
);
