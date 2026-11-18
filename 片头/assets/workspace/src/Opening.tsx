import {GlassBloom,GlassLightFx} from './GlassLight';
import React,{useEffect,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Easing,Img,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {WarmSkyline} from './WarmSkyline';
import {openingConfig as config} from './openingConfig';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const ease=Easing.bezier(.2,.7,.2,1);
const useFonts=()=>{
 const [handle]=useState(()=>delayRender('加载片头字体'));
 useEffect(()=>{Promise.all([
  new FontFace('Headline',`url(${staticFile('fonts/JiangChengLvDongSong.ttf')})`,{weight:'400'}).load(),
  new FontFace('Support',`url(${staticFile('fonts/AlibabaHealth-Bold.ttf')})`,{weight:'700'}).load(),
  new FontFace('Text',`url(${staticFile('fonts/AlibabaHealth-Regular.ttf')})`,{weight:'400'}).load(),
 ]).then(fonts=>{fonts.forEach(font=>document.fonts.add(font));continueRender(handle);}).catch(cancelRender);},[handle]);
};

/** 暖银与香槟标题，明度稳定，保留柔和立体投影。 */
const Display:React.FC<{children:React.ReactNode;size:number;warm?:boolean;style?:React.CSSProperties;name?:string}>=({children,size,warm=false,style,name})=><div data-title={name} style={{position:'absolute',fontFamily:'Headline',fontWeight:400,fontSize:size,lineHeight:1.12,letterSpacing:-4,whiteSpace:'nowrap',...style}}>
 <div aria-hidden style={{position:'absolute',inset:0,color:warm?'#51422e':'#3b3830',transform:'translate(3px,6px)',textShadow:'0 14px 28px rgba(0,0,0,.55)'}}>{children}</div>
 <div style={{position:'relative',color:'transparent',background:warm?'linear-gradient(180deg,#fff4d9 0%,#f3dcad 42%,#d8b77c 100%)':'linear-gradient(180deg,#fffdf5 0%,#f2eddf 42%,#ccc5b4 100%)',backgroundClip:'text',WebkitBackgroundClip:'text'}}>{children}</div>
</div>;

/** 规整磨砂玻璃，背景柔化、暖银边缘折光与接触阴影。 */
const GlassCard:React.FC<{
 children:React.ReactNode;width:number;height:number;opacity:number;
 translateX?:number;scale?:number;
}>=({children,width,height,opacity,translateX=0,scale=1})=>(<>
 <GlassBloom width={width} height={height} opacity={opacity} translateX={translateX} scale={scale}/>
 <div style={{
  position:'absolute',width,height,opacity,
  transform:`translateX(${translateX}px) scale(${scale})`,
  transformOrigin:'50% 65%',
  borderRadius:36,
  background:'linear-gradient(145deg,rgba(240,246,250,.30) 0%,rgba(224,235,242,.18) 50%,rgba(202,217,228,.18) 100%)',
  border:'1px solid rgba(248,232,198,.42)',
  boxShadow:'0 28px 64px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.04) inset, 0 1px 0 rgba(255,255,255,.12) inset',
  boxSizing:'border-box',
  padding:14,
  overflow:'hidden',
  backdropFilter:'blur(32px)',
  WebkitBackdropFilter:'blur(32px)',
 }}>
  <div style={{
   position:'relative',width:'100%',height:'100%',borderRadius:26,overflow:'hidden',
   background:'radial-gradient(ellipse at 50% 30%,rgba(245,249,252,.08) 0%,rgba(22,31,42,.10) 100%)',
  }}>
   {children}
  </div>
  <GlassLightFx/>
 </div>
</>);

export const Opening:React.FC=()=>{
 useFonts();
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),ms=frame/fps*1000;
 const tween=(start:number,duration:number)=>interpolate(ms,[start,start+duration],[0,1],{...clamp,easing:ease});
 const turn=tween(config.timingMs.turn,160),wrong=tween(config.timingMs.verdict,170),push=tween(0,400);
 const cards=config.cards;
 return <AbsoluteFill style={{background:config.colors.background,overflow:'hidden'}}>
  <div style={{position:'absolute',inset:0,transform:`scale(${1.06-.06*push})`,transformOrigin:'62% 52%'}}><WarmSkyline src={config.skyline} progress={push} sweep={tween(config.timingMs.turn,420)}/></div>
  <div data-deco style={{position:'absolute',left:1000,top:180,width:650,height:730,background:`radial-gradient(ellipse,rgba(${wrong>.5?'246,96,72':'246,207,62'},${.10+.08*turn}),transparent 66%)`,pointerEvents:'none'}}/>
  <div data-deco style={{position:'absolute',left:1068,top:176,width:492,height:650,borderRadius:52,border:`2px solid ${wrong>.5?'rgba(255,128,95,.45)':'rgba(251,218,85,.42)'}`,transform:`translateX(${24*(1-turn)}px)`,opacity:turn}}/>
  {cards.map((c,i)=>{const p=tween(c.at,250);return <div key={i} data-layer="房源卡接力" style={{position:'absolute',left:c.x,top:c.y,width:c.w,height:c.h,opacity:i===0?.65+.35*p:p,transform:`perspective(2400px) translate(${110*(1-p)+wrong*(i-1)*10}px,${-90*(1-p)+wrong*(i-1)*12}px) scale(${.84+.16*p}) rotateY(5.5deg)`,transformOrigin:'50% 55%'}}>
   <GlassCard width={c.w} height={c.h} opacity={1}>
    <Img data-deco src={staticFile(c.src)} style={{position:'absolute',left:'-7%',top:'4%',width:'114%',height:'90%',objectFit:'contain',filter:'saturate(.96) contrast(1.05) drop-shadow(0 18px 18px rgba(35,24,14,.28))'}}/>
    {i===2&&<svg data-deco width={c.w-28} height={c.h-28} style={{position:'absolute',inset:0,pointerEvents:'none'}} viewBox="0 0 472 552"><path d="M24 90 V44 Q24 24 44 24 H90 M382 24 H428 Q448 24 448 44 V90 M448 462 V508 Q448 528 428 528 H382 M90 528 H44 Q24 528 24 508 V462" fill="none" stroke={wrong>.5?'#FF8B6C':'#F7D544'} strokeWidth={5} strokeLinecap="round" opacity={.5+.5*wrong}/></svg>}
   </GlassCard>
  </div>})}
  <div style={{position:'absolute',left:106,top:252,width:780,height:190,transform:`translateY(${-10*turn}px)`}}>
   <Display size={132} style={{left:0,top:18}}>{config.text.prefix}</Display>
   <div data-deco style={{position:'absolute',left:285,top:0,width:390,height:184,borderRadius:25,background:'linear-gradient(130deg,#FFE77A,#F1C932)',boxShadow:'0 14px 30px rgba(218,171,30,.16),inset 0 1px 0 rgba(255,255,255,.55)',transform:`scaleX(${.86+.14*tween(config.timingMs.focus,140)})`,transformOrigin:'0 50%'}}/>
   <div style={{position:'absolute',left:305,top:5,fontFamily:'Headline',fontSize:160,lineHeight:1.12,letterSpacing:-4,color:'#28291E'}}>{config.text.focus}</div>
  </div>
  <Display size={98} style={{left:116,top:474,opacity:turn,transform:`translateX(${-44*(1-turn)}px)`}}>{config.text.turn}</Display>
  <div style={{position:'absolute',left:100,top:618,width:790,height:236,opacity:wrong,transform:`translateY(${30*(1-wrong)}px) scale(${1.14-.14*wrong})`,transformOrigin:'15% 50%'}}>
   <div data-deco style={{position:'absolute',left:12,top:14,width:612,height:204,borderRadius:28,background:'linear-gradient(120deg,#F87355,#DB4B3D)',boxShadow:'0 14px 34px rgba(199,67,46,.24),inset 0 1.5px 0 rgba(255,214,184,.7)'}}/>
   <div style={{position:'absolute',left:36,top:18,fontFamily:'Headline',fontSize:174,lineHeight:1.08,letterSpacing:-4,color:'#FFF8EB',textShadow:'0 5px 12px rgba(102,36,24,.18)'}}>{config.text.verdict}</div>
  </div>
  <div data-brand data-layer="身份条" style={{position:'absolute',right:34,top:28,display:'flex',alignItems:'center',gap:11,padding:'8px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,.16)',background:'rgba(18,26,35,.20)',backdropFilter:'blur(12px)',boxShadow:'0 4px 12px rgba(10,20,30,.08)',color:'#F7F8F9'}}>
   <span data-deco style={{width:3,height:20,borderRadius:2,background:wrong>.5?'#F18A76':'#EBD282'}}/>
   <span style={{fontFamily:'Text',fontSize:26,letterSpacing:1}}>极限小滕</span>
   <span data-deco style={{width:1,height:17,background:'rgba(255,255,255,.30)'}}/>
   <span style={{fontFamily:'Text',fontSize:22,letterSpacing:1,color:'rgba(242,246,250,.84)'}}>房产科普</span>
  </div>
 </AbsoluteFill>;
};
