import React from 'react';
import {AbsoluteFill,OffthreadVideo,staticFile} from 'remotion';
/** 低对比天际线在远景，暖色空气光在中景；标题侧保留稳定的深色明度区。 */
export const WarmSkyline:React.FC<{src?:string;progress:number;sweep:number;titleSide?:'left'|'right'}> = ({src,progress,sweep,titleSide='left'}) => <>
 <AbsoluteFill data-layer="城市天际线" style={{background:'linear-gradient(160deg,#28313C,#1C2836)',transform:`scale(${1.045+.015*progress}) translateX(${-12*progress}px)`,filter:'saturate(.94) brightness(.88)'}}>
  {src&&<OffthreadVideo src={staticFile(src)} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
 </AbsoluteFill>
 <AbsoluteFill data-layer="标题明暗保护" style={{background:`linear-gradient(${titleSide==='left'?90:270}deg,rgba(17,24,33,.72) 0%,rgba(19,27,36,.54) 37%,rgba(20,28,37,.10) 68%,rgba(20,28,37,.10) 100%)`}}/>
 <AbsoluteFill data-layer="暖色环境光" style={{pointerEvents:'none',background:`radial-gradient(ellipse at 81% 28%,rgba(233,243,255,${.035+.025*progress}),transparent 48%),linear-gradient(0deg,rgba(17,25,34,.38),transparent 42%)`}}/>
 <AbsoluteFill data-layer="斜高光扫" style={{pointerEvents:'none',overflow:'hidden',mixBlendMode:'screen'}}>
  <div style={{position:'absolute',left:`${-30+145*sweep}%`,top:'-20%',width:160,height:'140%',background:'linear-gradient(90deg,transparent,rgba(245,231,200,.10),rgba(255,244,220,.17),transparent)',transform:'skewX(-18deg)',opacity:Math.sin(Math.PI*sweep)*.6,filter:'blur(3px)'}}/>
 </AbsoluteFill>
 <AbsoluteFill data-layer="暗角" style={{background:'radial-gradient(ellipse at 53% 46%,transparent 46%,rgba(17,25,34,.22) 100%)',pointerEvents:'none'}}/>
</>;
