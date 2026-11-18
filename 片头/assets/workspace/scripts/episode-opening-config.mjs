import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const file=process.argv[2];if(!file)throw Error('传入本期opening-config.json（文案、cards、timingMs、skyline、fps、durationInFrames）');
const c=JSON.parse(readFileSync(file,'utf8'));
for(const key of ['text','cards','timingMs','skyline','fps','durationInFrames'])if(c[key]==null)throw Error('缺字段 '+key);
for(const key of ['prefix','focus','turn','verdict'])if(typeof c.text[key]!=='string')throw Error('缺片头文字 '+key);
if(c.cards.length<2||c.cards.length>3)throw Error('片头主题卡为2–3张');
if(c.fps!==50||!Number.isInteger(c.durationInFrames)||c.durationInFrames<1)throw Error('片头规格无效');
writeFileSync(fileURLToPath(new URL('../src/openingConfig.ts',import.meta.url)),'export const openingConfig='+JSON.stringify(c,null,2)+' as const;\n');
