import React from 'react';
import {SEAM} from './tokens';

/** 5.1.5 饰线：同心内光缝（不再贴固定角括号）。
 *  - 几何只由卡自己的圆角推出：内缝 inset 随圆角缩放，内缝圆角 = 卡圆角 − inset（ornamentSpec），与玻璃边同心；
 *  - 一条渐变细描边（左上亮 → 右下几乎透明）= 玻璃内侧的光缝，跟着圆角矩形走一圈（mask 镂空，不是盒子）；
 *  - 按语义角色只多一段同心语义色光弧（data=左上、risk=左下、key=左上+右下、decision=右下、neutral=无）——一套系统，只换位置；
 *  - 每张卡最多 1 条光缝 + 2 段光弧，不加文字、不加额外字盒。 */
import {ORNAMENT, ornamentSpec, ORN_ARCS, roleOfTone, type OrnRole} from './ornament.ts';
export {ORNAMENT, ornamentSpec, ORN_ARCS, roleOfTone, type OrnRole};
type Corner = 'tl' | 'tr' | 'br' | 'bl';
const MASK = {WebkitMask: `linear-gradient(${SEAM.maskOn} 0 0) content-box, linear-gradient(${SEAM.maskOn} 0 0)`, WebkitMaskComposite: 'xor', maskComposite: 'exclude'} as React.CSSProperties;

export const CardOrnament: React.FC<{p?: number; radius: number; circle?: boolean; role?: OrnRole}> = ({p = 1, radius, circle = false, role = 'neutral'}) => {
  const o = Math.max(0, Math.min(1, p));
  const R = circle ? 9999 : radius;
  const {inset, r, tail} = ornamentSpec(circle ? 60 : radius);
  const ir = circle ? 9999 : r;
  const box: React.CSSProperties = {position: 'absolute', inset, borderRadius: ir, pointerEvents: 'none'};
  const arcSize = (circle ? 40 : r) + tail;
  const arc = (c: Corner): React.CSSProperties => {
    const top = c === 'tl' || c === 'tr', left = c === 'tl' || c === 'bl';
    const fade = `${top ? 'to bottom' : 'to top'}`, fade2 = `${left ? 'to right' : 'to left'}`;
    return {position: 'absolute', [top ? 'top' : 'bottom']: inset, [left ? 'left' : 'right']: inset, width: arcSize, height: arcSize, boxSizing: 'border-box',
      borderStyle: 'solid', borderColor: `color-mix(in srgb, var(--acc-hi, ${SEAM.arc}) 85%, transparent)`, borderWidth: 0,
      [top ? 'borderTopWidth' : 'borderBottomWidth']: ORNAMENT.arc, [left ? 'borderLeftWidth' : 'borderRightWidth']: ORNAMENT.arc,
      [`border${top ? 'Top' : 'Bottom'}${left ? 'Left' : 'Right'}Radius`]: circle ? arcSize : r,
      WebkitMaskImage: `linear-gradient(${fade}, ${SEAM.maskOff} ${Math.round(100 * r / arcSize)}%, transparent), linear-gradient(${fade2}, ${SEAM.maskOff} ${Math.round(100 * r / arcSize)}%, transparent)`,
      WebkitMaskComposite: 'source-over', filter: `drop-shadow(0 0 3px color-mix(in srgb, var(--acc-raw, ${SEAM.glow}) 70%, transparent))`} as React.CSSProperties;
  };
  return <div data-deco data-orn-r={circle ? 'circle' : r} data-orn-inset={inset} data-orn-card-r={R} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: o}}>
    <div style={{...box, padding: ORNAMENT.seam, background: `linear-gradient(135deg, ${SEAM.hi}, ${SEAM.mid} 32%, ${SEAM.lo} 66%, ${SEAM.tail})`, ...MASK}} />
    {!circle && ORN_ARCS[role].map((c) => <div key={c} style={arc(c)} />)}
  </div>;
};
