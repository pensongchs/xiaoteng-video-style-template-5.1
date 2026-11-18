import React from 'react';
import {Img,staticFile} from 'remotion';
import {PropertyArt} from './illustrations';
export const PhotoCutout:React.FC<{src?:string;kind?:string;color?:string;style?:React.CSSProperties}> = ({src,kind,color,style}) => src
 ? <Img data-deco src={staticFile(src)} style={{width:'100%',height:'100%',objectFit:'contain',filter:'saturate(.9) contrast(1.03) drop-shadow(0 9px 12px rgba(68,43,20,.22))',...style}}/>
 : <PropertyArt kind={kind} color={color} style={style}/>;
