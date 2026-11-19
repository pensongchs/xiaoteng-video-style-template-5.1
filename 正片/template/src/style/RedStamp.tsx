import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {Rect} from './grid';
/** 印章在独立留白内落下；动画最外沿也与照片留出净距。 */
export const RedStamp:React.FC<{r:Rect;text:string;start:number;end:number}> = ({r,text,start,end}) => {
 const f=useCurrentFrame(),t=Math.max(0,Math.min(1,(f-start)/8)),p=1-Math.pow(1-t,3),fade=Math.max(0,Math.min(1,(end+5-f)/5));
 if(f<start||fade<=0)return null;
 return <div data-hook-stamp style={{position:'absolute',left:r.x,top:r.y,width:r.w,height:r.h,opacity:Math.min(1,t*4)*fade,transform:`translateY(${-22*(1-p)}px) scale(${1.22-.22*p}) rotate(${-4-2*(1-p)}deg)`,transformOrigin:'50% 50%',boxSizing:'border-box',border:'4px solid rgba(176,45,43,.94)',borderRadius:7,background:'rgba(255,255,255,.88)',boxShadow:`0 ${2+12*(1-p)}px ${5+20*(1-p)}px rgba(78,31,30,${.10+.08*(1-p)})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
  <div data-deco style={{position:'absolute',inset:7,border:'1.5px solid rgba(176,45,43,.70)',borderRadius:2,pointerEvents:'none'}}/>
  <div style={{fontFamily:'PuHui',fontWeight:900,fontSize:44,lineHeight:1.3,letterSpacing:1,color:'#FF8277',whiteSpace:'nowrap'}}>{text}</div>
 </div>;
};
