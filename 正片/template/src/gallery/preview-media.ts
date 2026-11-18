import type {Shot} from '../style/types.ts';
/** 仅画廊样例使用统一实景，确保安装后无需下载几十段演示视频。正式ShotView不调用此函数。 */
export const previewShot=(s:Shot):Shot=>{
 const walk=(v:any):any=>{if(!v||typeof v!=='object')return v;if(Array.isArray(v))return v.map(walk);const out:any={};for(const [k,x]of Object.entries(v))out[k]=walk(x);if(typeof out.src==='string'){out.src='media/preview-house.jpg';out.video=false;out.trim=0;}return out;};
 return {...s,bg:{src:'media/preview-city.jpg',dark:.46,blur:0},data:s.layout==='outroHost'?{line:'不选优点最多的',note:'选缺点也能接受的',account:'极限小滕 · 房产知识科普'}:walk(s.data)};
};
