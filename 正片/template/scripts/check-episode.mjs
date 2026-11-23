import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {SHOTS} from '../src/demo/shots.ts';
import {diversityFaults,diversityTargets,NEEDS_EVIDENCE} from '../src/match/diversity.ts';
import {NEW_LAYOUTS} from '../src/style/layouts.ts';
import {sceneOf} from '../src/style/scenes.ts';
import {SEQUENTIAL_LAYOUTS,requiredSeqKeys} from '../src/style/sequence-spec.ts';
import {buildTimeline} from '../src/sync/timeline.ts';
const file=process.argv.slice(2).find(a=>!a.startsWith('--'))||'episode-plan.json';if(!file)throw Error('用法 npm run check:episode -- episode-plan.json');
const plan=JSON.parse(readFileSync(resolve(file),'utf8')),shots=Array.isArray(plan)?plan:plan.shots;
if(!Array.isArray(shots)||!shots.length)throw Error('shots必须为实际镜头数组');
const errors=diversityFaults(shots);
if(shots.length!==SHOTS.length)errors.push('计划与实际SHOTS镜数不一致');
shots.forEach((s,i)=>{for(const k of ['id','layout','anchors','data','visuals'])if(!isDeepStrictEqual(s[k],SHOTS[i]?.[k]))errors.push(`镜${i+1}:计划与实际SHOTS的${k}不一致`);});
for(const [i,s] of shots.entries()){
 if(NEEDS_EVIDENCE.has(s.layout)&&(!s.evidence?.source||!['真实','口播假设'].includes(s.evidence?.kind)))errors.push(`镜${i+1}: ${s.layout} 缺数据来源与口径（真实/口播假设）`);
 if(s.evidence?.kind==='口播假设'&&!s.evidence?.label)errors.push(`镜${i+1}:假设缺屏显说明`);
 if(!s.text?.trim())errors.push(`镜${i+1}:缺对应真实口播`);
 if(NEW_LAYOUTS.includes(s.layout)){
  const base=sceneOf(s.layout),texts=s.data?.sceneText;
  for(const c of base.cards){if(!texts?.[c.id]||texts[c.id].length!==c.texts.length)errors.push(`镜${i+1}/${c.id}:sceneText须完整覆盖${c.texts.length}项，可用空串隐藏未使用项`);}
  try{sceneOf(s.layout,s.data);}catch(e){errors.push(`镜${i+1}:`+e.message);}
 }
 if(!s.anchors||!Object.keys(s.anchors).length)errors.push(`镜${i+1}:缺口播动作锚点`);
 // 顺序与连线：流程类版式每一项都必须有口播锚点
 if(SEQUENTIAL_LAYOUTS.has(s.layout)){
  let n=0;try{n=NEW_LAYOUTS.includes(s.layout)?sceneOf(s.layout,s.data).cards.length:0;}catch{}
  const miss=requiredSeqKeys(s.layout,s.data??{},n).filter(k=>s.anchors?.[k]==null);
  if(miss.length)errors.push(`镜${i+1}/${s.layout}: 流程类版式必须逐项绑定口播锚点，缺 ${miss.join('、')}`);
 }
}
// 锚点必须按口播先后递增（用真实字幕时间换算）
{
 const ep=JSON.parse(readFileSync(resolve('src/demo/episode.json'),'utf8'));
 const tl=buildTimeline(SHOTS,ep);
 for(const e of tl.errors)errors.push('时间轴: '+e);
 for(const it of tl.items){
  if(!SEQUENTIAL_LAYOUTS.has(it.s.layout))continue;
  let n=0;try{n=NEW_LAYOUTS.includes(it.s.layout)?sceneOf(it.s.layout,it.s.data).cards.length:0;}catch{}
  const ks=requiredSeqKeys(it.s.layout,it.s.data??{},n);
  for(let k=1;k<ks.length;k++){const a=it.anchors[ks[k-1]],b=it.anchors[ks[k]];
   if(a!=null&&b!=null&&!(b>a))errors.push(`${it.s.id}/${it.s.layout}: 锚点顺序与口播不符——${ks[k]}「${it.s.anchors[ks[k]]}」不晚于 ${ks[k-1]}「${it.s.anchors[ks[k-1]]}」`);}
 }
}
const result={status:errors.length?'failed':'passed',shots:shots.length,targets:diversityTargets(shots.length),errors};
console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;
