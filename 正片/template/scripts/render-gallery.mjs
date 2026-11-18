import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {GALLERY} from '../src/gallery/shots-mg-gallery.ts';
import {NEW_GALLERY} from '../src/gallery/shots-mg-new.ts';
const out=resolve(process.argv[2]||'预览/MG');mkdirSync(out,{recursive:true});
const browser=process.env.REMOTION_BROWSER_EXECUTABLE||(existsSync('.runtime/browser.json')?JSON.parse(readFileSync('.runtime/browser.json','utf8')).path:undefined);
const serveUrl=await bundle({entryPoint:'src/index.ts'}),manifest=[];
for(const [id,shots] of [['MgGallery',GALLERY],['MgGalleryNew',NEW_GALLERY]]){
 const composition=await selectComposition({serveUrl,id,browserExecutable:browser});
 for(let i=0;i<shots.length;i++){
  const file=shots[i].layout+'.jpg',frame=i*150+140;
  if(!process.env.LAYOUTS||process.env.LAYOUTS.split(',').includes(shots[i].layout))await renderStill({serveUrl,composition,frame,output:resolve(out,file),imageFormat:'jpeg',jpegQuality:82,scale:.5,browserExecutable:browser,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000});
  manifest.push({layout:shots[i].layout,file,frame,width:960,height:540});console.log('已验证 '+shots[i].layout);
 }
}
writeFileSync(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
