import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
/** 玻璃卡片彩色光影（暖色磨砂）：背后柔光 bloom / 暖银-香槟-陶金流转描边 / 边缘色散高光 / 漂移彩色反光。克制不过饱和 */
export const GlassBloom:React.FC<{width:number;height:number;opacity:number;translateX?:number;scale?:number}>=({width,height,opacity,translateX=0,scale=1})=>{
 const fr=useCurrentFrame(),{fps}=useVideoConfig();const s=fr/fps;
 const b=.85+.15*Math.sin(s*1.3);
 return <div aria-hidden data-layer="卡片柔光" style={{position:'absolute',width,height,opacity:opacity*b,transform:`translateX(${translateX}px) scale(${scale})`,transformOrigin:'50% 65%',pointerEvents:'none'}}>
  <div style={{position:'absolute',inset:-70,borderRadius:80,filter:'blur(46px)',background:`
   radial-gradient(ellipse at ${22+6*Math.sin(s*.7)}% 18%,rgba(244,226,190,.20) 0%,transparent 48%),
   radial-gradient(ellipse at ${82+5*Math.cos(s*.6)}% 82%,rgba(206,167,111,.16) 0%,transparent 50%),
   radial-gradient(ellipse at 50% 104%,rgba(255,218,160,.14) 0%,transparent 46%)`}}/>
 </div>;
};
export const GlassLightFx:React.FC<{radius?:number}>=({radius=36})=>{
 const fr=useCurrentFrame(),{fps}=useVideoConfig();const s=fr/fps;
 const ang=(s*38)%360;
 const ring:React.CSSProperties={position:'absolute',inset:0,borderRadius:radius,padding:1.6,pointerEvents:'none',
  WebkitMask:'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',WebkitMaskComposite:'xor',maskComposite:'exclude' as any};
 const p1=(s*.23)%1,p2=(s*.17+.5)%1;
 return <>
  {/* 流转彩色描边：暖银 → 香槟 → 陶金 */}
  <div data-layer="彩色描边" style={{...ring,background:`conic-gradient(from ${ang}deg,rgba(250,236,205,.72) 0deg,rgba(250,236,205,0) 70deg,rgba(222,191,146,.56) 150deg,rgba(222,191,146,0) 210deg,rgba(240,199,139,.55) 270deg,rgba(240,199,139,0) 320deg,rgba(250,236,205,.72) 360deg)`}}/>
  {/* 边缘色散高光：暖银与淡琥珀 1px 错位 */}
  <div data-layer="色散高光" style={{position:'absolute',inset:0,borderRadius:radius,pointerEvents:'none',
   boxShadow:'inset 1.5px 0 0 rgba(246,231,200,.35), inset -1.5px 0 0 rgba(224,184,128,.20), inset 0 1.5px 0 rgba(255,246,226,.22), inset 0 -1px 0 rgba(255,200,140,.14), 0 0 26px rgba(229,200,151,.10)'}}/>
  {/* 漂移彩色反光：沿上边/右边缓慢扫过 */}
  <div data-layer="漂移反光" style={{position:'absolute',inset:0,borderRadius:radius,overflow:'hidden',pointerEvents:'none',mixBlendMode:'screen'}}>
   <div style={{position:'absolute',top:-60,left:`${-30+130*p1}%`,width:'38%',height:140,borderRadius:'50%',filter:'blur(30px)',background:'linear-gradient(90deg,rgba(247,230,194,.0),rgba(247,230,194,.32),rgba(224,190,143,.26),rgba(224,190,143,0))'}}/>
   <div style={{position:'absolute',right:-70,top:`${-30+130*p2}%`,width:150,height:'34%',borderRadius:'50%',filter:'blur(32px)',background:'linear-gradient(180deg,rgba(255,190,120,0),rgba(255,190,120,.24),rgba(218,181,126,.22),rgba(218,181,126,0))'}}/>
   <div style={{position:'absolute',left:-80,bottom:-80,width:'45%',height:'40%',borderRadius:'50%',filter:'blur(40px)',background:'radial-gradient(ellipse,rgba(243,221,182,.14),transparent 70%)'}}/>
  </div>
 </>;
};
