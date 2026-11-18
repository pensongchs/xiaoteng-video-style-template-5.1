import {resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia} from '@remotion/renderer';
const out=resolve(process.argv[2]);const palette=process.argv[3]||'inkBlue';const inputProps={palette};
const serveUrl=await bundle({entryPoint:'src/index.ts'});
const composition=await selectComposition({serveUrl,id:'Cards51Preview',inputProps});
let last=0;
await renderMedia({serveUrl,composition,inputProps,codec:'h264',crf:18,outputLocation:out,chromiumOptions:{gl:'angle'},concurrency:4,timeoutInMilliseconds:180000,
 onProgress:({progress})=>{if(progress-last>0.1){last=progress;console.log('progress',progress.toFixed(2))}}});
console.log('done',out);
