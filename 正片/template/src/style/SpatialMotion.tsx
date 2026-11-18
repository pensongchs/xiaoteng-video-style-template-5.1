import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
/** 先分层进入，再缓慢前移落位。连线和卡片共用空间，文字不持续晃动。 */
export const SpatialMotion:React.FC<{children:React.ReactNode;duration:number}> = ({children,duration}) => {
 const f=useCurrentFrame(),end=Math.min(84,Math.max(40,duration-18)),t=Math.max(0,Math.min(1,(f-10)/(end-10))),p=1-Math.pow(1-t,3);
 return <AbsoluteFill style={{transform:`translate(${(1-p)*-10}px,${(1-p)*14}px) scale(${.966+.034*p})`,transformOrigin:'45% 58%'}}>{children}</AbsoluteFill>;
};
