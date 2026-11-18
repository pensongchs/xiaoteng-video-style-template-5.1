// 5.1 卡片色板验证：按 palette 渲染 43 款代表帧（不改原 render-gallery）。
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {GALLERY} from '../src/gallery/shots-mg-gallery.ts';
import {NEW_GALLERY} from '../src/gallery/shots-mg-new.ts';
const out=resolve(process.argv[2]);const palette=process.argv[3]||'inkBlue';mkdirSync(out,{recursive:true});
const only=process.env.LAYOUTS?process.env.LAYOUTS.split(','):null;
const serveUrl=await bundle({entryPoint:'src/index.ts'});
for(const [id,shots] of [['MgGallery',GALLERY],['MgGalleryNew',NEW_GALLERY]]){
 const composition=await selectComposition({serveUrl,id,inputProps:{palette}});
 for(let i=0;i<shots.length;i++){
  if(only&&!only.includes(shots[i].layout))continue;
  await renderStill({serveUrl,composition,frame:i*150+140,inputProps:{palette},output:resolve(out,shots[i].layout+'.jpg'),imageFormat:'jpeg',jpegQuality:85,scale:.5,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000});
 }
}
console.log('done',palette);
