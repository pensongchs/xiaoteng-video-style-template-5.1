import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
const out=resolve(process.argv[2]);mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:'src/index.ts'});
for(let i=0;i<4;i++)for(const legacy of [true,false]){const inputProps={i,legacy,palette:'inkBlue'};
 const composition=await selectComposition({serveUrl,id:'Cards51SubCompare',inputProps});
 await renderStill({serveUrl,composition,frame:40,inputProps,output:resolve(out,`sub_${i}_${legacy?'v50':'v51'}.jpg`),imageFormat:'jpeg',jpegQuality:92,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000});}
console.log('done');
