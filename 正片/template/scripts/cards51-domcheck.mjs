// 5.1 小卡组合：逐镜在定格帧做 DOM 检查（区块越界/重叠/溢出/字号）+ 字幕 DOM
import {mkdirSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
mkdirSync('out/dom51',{recursive:true});
const serveUrl=await bundle({entryPoint:'src/index.ts'});let bad=0;
for(const i of [0,1,2,3,4]){const inputProps={check:true,only:i,palette:'inkBlue'};
 const composition=await selectComposition({serveUrl,id:'Cards51Scene',inputProps});
 const fr=composition.durationInFrames-1;let got=null,sub=null;
 await renderStill({serveUrl,composition,frame:fr,inputProps,output:`out/dom51/S${i+1}.png`,chromiumOptions:{gl:'angle'},
  onBrowserLog:(l)=>{const m=l.text.match(/CHECK\|([^|]+)\|(\[.*\])/);if(m&&!l.text.startsWith('SUB'))got={id:m[1],e:JSON.parse(m[2])};const s=l.text.match(/SUBCHECK\|\d+\|(.*)/);if(s)sub=s[1];}});
 if(!got){console.log(`S${i+1}: 未拿到 DOM 检查结果`);bad++;continue;}
 console.log(`S${i+1} ${got.id} DOM ${got.e.length?'✗ '+got.e.join('; '):'✓'}`);bad+=got.e.length;
 for(const mf of [40,95]){let s=null;await renderStill({serveUrl,composition,frame:mf,inputProps,output:`out/dom51/S${i+1}_sub${mf}.png`,chromiumOptions:{gl:'angle'},
  onBrowserLog:(l)=>{const m=l.text.match(/SUBCHECK\|\d+\|(.*)/);if(m)s=m[1]==='null'?null:JSON.parse(m[1]);}});
  if(!s){console.log(`  字幕@${mf}: 未渲染`);bad++;continue;}const cx=s.x+s.w/2,e=[];
  if(s.x<96||s.x+s.w>1824)e.push('横向越界');if(Math.abs(cx-960)>2)e.push('未居中 '+cx.toFixed(1));if(s.y<900||s.y+s.h>1080)e.push('纵向越界');if(s.fs<38||s.fs>46)e.push('字号 '+s.fs);if(s.over)e.push('行内溢出');
  console.log(`  字幕@${mf} ${e.length?'✗ '+e.join('; '):'✓'} 中心 ${Math.round(cx)} y ${Math.round(s.y)}–${Math.round(s.y+s.h)} 宽 ${Math.round(s.w)} 字号 ${s.fs}`);bad+=e.length;}}
process.exit(bad?1:0);
