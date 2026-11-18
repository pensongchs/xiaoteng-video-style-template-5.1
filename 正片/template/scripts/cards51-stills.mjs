import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
const out=resolve(process.argv[2]);const palette=process.argv[3]||'inkBlue';const frames=(process.argv[4]||'120').split(',').map(Number);
const scenes=(process.argv[5]||'0,1,2,3,4').split(',').map(Number);mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:'src/index.ts'});
for(const i of scenes){const inputProps={palette,only:i};
 const composition=await selectComposition({serveUrl,id:'Cards51Scene',inputProps});
 for(const fr of frames) await renderStill({serveUrl,composition,frame:fr,inputProps,output:resolve(out,`S${i+1}_${palette}_f${fr}.jpg`),imageFormat:'jpeg',jpegQuality:90,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000});
}
console.log('done');
