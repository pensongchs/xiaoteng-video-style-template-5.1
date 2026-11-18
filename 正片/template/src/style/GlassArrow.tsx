import React from 'react';
/** 连贯的玻璃金属箭头：有线身、收尖、边缘反光与完整的路径生长。 */
export const GlassArrow:React.FC<{x:number;y:number;w:number;progress:number}> = ({x,y,w,progress}) => {
 if(progress<=0)return null;
 const head=Math.min(30,w*.22),shaft=5,mid=26,id=`ga-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}`;
 const d=`M7 ${mid-shaft} H${w-head} V${mid-17} Q${w-head} ${mid-20} ${w-head+4} ${mid-17} L${w-2} ${mid-2} Q${w+1} ${mid} ${w-2} ${mid+2} L${w-head+4} ${mid+17} Q${w-head} ${mid+20} ${w-head} ${mid+17} V${mid+shaft} H7 Q1 ${mid+shaft} 1 ${mid} Q1 ${mid-shaft} 7 ${mid-shaft}Z`;
 return <svg data-deco style={{position:'absolute',left:x,top:y-mid,width:w+4,height:56,overflow:'visible',pointerEvents:'none'}} viewBox={`0 0 ${w+4} 56`}>
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EEF3FA" stopOpacity=".96"/><stop offset=".43" stopOpacity=".92" style={{stopColor: 'var(--acc)'}} /><stop offset="1" stopOpacity=".86" style={{stopColor: 'var(--acc)'}} /></linearGradient><clipPath id={id+'-clip'}><rect x="-8" y="-8" width={(w+20)*progress} height="76"/></clipPath></defs>
  <g clipPath={`url(#${id}-clip)`}>
   <path d={d} transform="translate(0,3)" fill="rgba(10,18,32,.23)"/>
   <path d={d} fill={`url(#${id})`} stroke="rgba(236,242,250,.72)" strokeWidth="1.5" strokeLinejoin="round"/>
   <path d={`M9 ${mid-3} H${w-head-5}`} fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="1.2" strokeLinecap="round"/>
  </g>
 </svg>;
};
