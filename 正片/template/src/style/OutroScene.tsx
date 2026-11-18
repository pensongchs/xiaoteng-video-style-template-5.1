import React from 'react';
import {Img,staticFile,useCurrentFrame} from 'remotion';
import {glassMat,GlassUnderlay,GlassEdge,ReadabilityCtx} from './components';
import {FONT,FOG,glassEnter} from './tokens';
import {PhotoCutout} from './PhotoCutout';
import type {Rect} from './grid';
export const OutroScene:React.FC<{data:any;R:Record<string,Rect>;ch:string|false;lineAt:number;noteAt:number;accountAt:number}> = ({data,R,ch,lineAt,noteAt,accountAt}) => {
 const f=useCurrentFrame(),t=R.text,p=glassEnter(f,lineAt,'soft'),np=glassEnter(f,noteAt,'soft'),ap=glassEnter(f,accountAt,'soft'),cp=glassEnter(f,0,'soft');
 const board={x:t.x,y:t.y+30,w:t.w,h:430},footer={x:t.x+18,y:t.y+488,w:t.w-18,h:150};
 const [brand,detail]=(data.account??'').split('·').map((x:string)=>x.trim());
 return <ReadabilityCtx.Provider value={{bright:true}}>
  {ch&&<div style={{position:'absolute',...{left:R.character.x,top:R.character.y,width:R.character.w,height:R.character.h},opacity:cp,transform:`translate(${-70*(1-cp)}px,${24*(1-cp)}px) scale(${.96+.04*cp})`,transformOrigin:'50% 100%'}}>
   <div data-deco style={{position:'absolute',left:'13%',right:'8%',bottom:18,height:80,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(224,184,119,.44),transparent 70%)',filter:'blur(18px)'}}/>
   <Img src={staticFile(ch)} style={{width:'100%',height:'100%',objectFit:'contain',objectPosition:'bottom center',filter:'drop-shadow(0 18px 24px rgba(65,43,23,.32))',transform:`translateY(${Math.sin(Math.max(0,f-32)/27)*2}px)`,WebkitMaskImage:'linear-gradient(#000 84%,transparent 100%)'}}/>
  </div>}
  <div data-deco style={{position:'absolute',left:board.x+24,top:board.y-18,width:board.w-36,height:board.h,...glassMat('dark'),borderRadius:40,opacity:p*.52,transform:`translate(${14*(1-p)}px,${16*(1-p)}px)`}}/>
  {data.cutout&&<div style={{position:'absolute',left:board.x-90,top:board.y+288,width:210,height:180,opacity:p,transform:`translateY(${24*(1-p)}px)`}}><PhotoCutout src={data.cutout}/></div>}
  <div style={{position:'absolute',left:board.x,top:board.y,width:board.w,height:board.h,overflow:'hidden',borderRadius:40,boxShadow:'0 24px 44px -16px rgba(67,44,20,.32)',opacity:p,transform:`translate(${34*(1-p)}px,${18*(1-p)}px) scale(${.97+.03*p})`,transformOrigin:'0 50%'}}>
   <GlassUnderlay r={board}/><div data-deco style={{position:'absolute',inset:0,...glassMat('dark'),borderRadius:40}}/><GlassEdge radius={40}/>
   <div data-deco style={{position:'absolute',left:46,top:48,width:58,height:4,borderRadius:2,background:'linear-gradient(90deg,#B48A4E,#EBD5A9)'}}/>
   <div style={{position:'absolute',left:46,top:84,width:board.w-92,fontFamily:FONT.title,fontSize:72,lineHeight:1.3,color:FOG.paper.ink}}>{data.line}</div>
   {data.note&&<div style={{position:'absolute',left:38,top:238,width:board.w-76,height:128,padding:'25px 28px',boxSizing:'border-box',borderRadius:26,background:'linear-gradient(130deg,rgba(239,215,171,.42),rgba(255,244,219,.22))',border:'1px solid rgba(255,247,226,.64)',opacity:np,transform:`translateY(${30*(1-np)}px)`}}>
    <div style={{fontFamily:FONT.title,fontSize:56,lineHeight:1.3,color:'#6B4C26'}}>{data.note}</div>
   </div>}
  </div>
  {data.account&&<div style={{position:'absolute',left:footer.x,top:footer.y,width:footer.w,height:footer.h,...glassMat('dark'),borderRadius:32,padding:'22px 34px',boxSizing:'border-box',opacity:ap,transform:`translateY(${28*(1-ap)}px)`}}>
    <div style={{fontFamily:FONT.title,fontSize:46,lineHeight:1.3,color:FOG.paper.ink}}>{brand}</div>
    {detail&&<div style={{fontFamily:FONT.body,fontWeight:700,fontSize:32,lineHeight:1.3,marginTop:8,color:'#816846'}}>{detail}</div>}
  </div>}
 </ReadabilityCtx.Provider>;
};
