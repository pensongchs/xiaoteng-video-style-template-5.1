import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
/** 整组共用一个透视平面缓慢前移落位。入场带轻微空间深度，落位后共面，避免连线与卡边错开。文字不持续晃动。 */
export const SpatialMotion:React.FC<{children:React.ReactNode;duration:number}> = ({children,duration}) => {
 const f=useCurrentFrame(),end=Math.min(84,Math.max(40,duration-18)),t=Math.max(0,Math.min(1,(f-10)/(end-10))),p=1-Math.pow(1-t,3);
 return <AbsoluteFill style={{perspective:2400,perspectiveOrigin:'46% 52%'}}>
  <AbsoluteFill style={{transform:`translate3d(${(1-p)*-12}px,${(1-p)*16}px,${(1-p)*-36}px) rotateY(${(1-p)*-2.4}deg) scale(${.962+.038*p})`,transformOrigin:'45% 58%',transformStyle:'preserve-3d'}}>{children}</AbsoluteFill>
 </AbsoluteFill>;
};
