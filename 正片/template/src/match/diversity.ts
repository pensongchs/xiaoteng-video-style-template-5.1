import {POOL_LAYOUTS,NEW_LAYOUTS,ESTATE_LAYOUTS,IMAGE_BIG_LAYOUTS,RETIRED_LAYOUTS,IMAGE_LAYOUTS,isImageLed,canonicalLayout} from '../style/layouts.ts';
export const IMAGE_RHYTHM={minShare:1/3,maxPureCardRun:2} as const;
const isImg=(s:string)=>(IMAGE_LAYOUTS as readonly string[]).includes(s);
/** 5.1.5 图文节奏：以图为主的镜头 ≥ 1/3（不含片尾），连续纯卡镜头（无图的小卡/图表/裸标签）≤ 2。 */
export const imageRhythmFaults=(raw:{layout:string}[])=>{
 const names=raw.map(s=>canonicalLayout(s.layout)).filter(s=>!s.startsWith('outro')),out:string[]=[];if(!names.length)return out;
 const img=names.filter(isImageLed).length,need=Math.ceil(names.length*IMAGE_RHYTHM.minShare);
 if(img<need)out.push(`以图为主的镜头 ${img}/${names.length} < 1/3（需 ≥${need}）：把部分小卡镜换成图片组件（imageFrame3D/imageSwap/imageGrid/imageCutout）或图框版式`);
 let run=0;names.forEach((n,i)=>{run=isImageLed(n)?0:run+1;if(run===IMAGE_RHYTHM.maxPureCardRun+1)out.push(`镜${i-IMAGE_RHYTHM.maxPureCardRun+1}–${i+1}: 连续 ${run} 镜都是纯卡片（无图），中间插一镜图片组件`);});
 return out;
};
export const STRUCTURES:Record<string,string>={
 titleFloat:'图文',bareNumber:'数字',mediaRows:'清单',quoteStack:'清单',ringFeature:'数据',triadSoft:'数字',outroHost:'片尾',
 splitVs:'对比决策',waitVs:'对比决策',decisionFork:'对比决策',slashCompare:'对比决策',balance:'数据',
 timeline:'流程',loanCurve:'流程',hexSteps:'流程',floorLadder:'楼体',paymentSplit:'预算',paymentCup:'预算',priceStep:'预算',loanDial:'数据',
 amenityOrbit:'空间配套',amenityPins:'空间配套',districtTags:'空间配套',parkingLines:'空间配套',
 pitfallBoard:'清单',layerReveal:'清单',ticketStub:'票据',indexTabs:'标签',archLight:'采光',contractNote:'合同',planSplit:'户型',buildingSection:'楼体',pitfallLens:'透镜',inspectTags:'标签',familyPlan:'家庭',policyNotes:'便笺',qaBubbles:'问答',
 lineReveal:'数据',barGlow:'数据',rankBars:'数据',waffle:'数据',yearRing:'数据',formulaCalc:'计算',
 dataCluster:'数据',comparePair:'对比决策',stepRail:'流程',riskGroup:'清单',noteGroup:'便笺',
 imageFrame3D:'图文',imageSwap:'图集',imageGrid:'图集',imageCutout:'图文'};
export const CHARTS=new Set(['lineReveal','barGlow','rankBars','waffle','balance','yearRing','formulaCalc']);
export const NEEDS_EVIDENCE=new Set([...CHARTS,'bareNumber','splitVs','waitVs','ringFeature','triadSoft','paymentSplit','priceStep','loanDial','districtTags','layerReveal']);
export const diversityTargets=(n:number)=>({kinds:n<8?n:Math.min(POOL_LAYOUTS.length,Math.max(7,Math.ceil(n*.7))),newKinds:n<8?0:Math.min(NEW_LAYOUTS.length,Math.max(2,Math.ceil(n*.25))),estateKinds:n<8?0:Math.min(ESTATE_LAYOUTS.length,Math.max(2,Math.ceil(n*.15))),structures:n<8?Math.min(n,3):5});
export const diversityFaults=(raw:{layout:string}[])=>{
 const names=raw.map(s=>canonicalLayout(s.layout)),n=names.length,target=diversityTargets(n),faults:string[]=[];
 const counts:Record<string,number>={},last:Record<string,number>={};
 names.forEach((name,i)=>{
  if((RETIRED_LAYOUTS as readonly string[]).includes(name))faults.push(`镜${i+1}:${name} 已退役（大卡只塞文字），改用小卡组合或图框版式`);
  else if(!POOL_LAYOUTS.includes(name as any))faults.push(`镜${i+1}:非正式选卡池 ${name}`);
  counts[name]=(counts[name]??0)+1;
  if(last[name]!=null&&i-last[name]<3)faults.push(`镜${i+1}: ${name} 中间不足2镜`);
  last[name]=i;
  const max=name==='outroHost'||NEW_LAYOUTS.includes(name as any)||CHARTS.has(name)?1:2; // 图片组件每款 ≤2
  if(counts[name]>max)faults.push(`${name} 使用${counts[name]}次，上限${max}`);
  if(i>1&&STRUCTURES[name]===STRUCTURES[names[i-1]]&&STRUCTURES[name]===STRUCTURES[names[i-2]])faults.push(`镜${i-1}–${i+1}: 连续3镜同结构 ${STRUCTURES[name]}`);
  if(i&&CHARTS.has(name)&&CHARTS.has(names[i-1]))faults.push(`镜${i}–${i+1}:图表相邻`);
 });
 const kinds=[...new Set(names)],news=kinds.filter(s=>NEW_LAYOUTS.includes(s as any)||isImg(s)),estate=kinds.filter(s=>ESTATE_LAYOUTS.includes(s as any)),structures=new Set(kinds.map(s=>STRUCTURES[s]));
 const bigImg=names.filter(s=>IMAGE_BIG_LAYOUTS.includes(s));
 if(bigImg.length>3)faults.push(`图框大卡版式 ${bigImg.length} 镜 > 3：大卡只放图，其余镜头改用小卡组合`);
 if(kinds.length<target.kinds)faults.push(`不同版式${kinds.length} < ${target.kinds}`);
 if(news.length<target.newKinds)faults.push(`不同扩展MG ${news.length} < ${target.newKinds}`);
 if(estate.length<target.estateKinds)faults.push(`不同房产MG ${estate.length} < ${target.estateKinds}`);
 if(structures.size<target.structures)faults.push(`信息结构${structures.size} < ${target.structures}`);
 if(names.filter(s=>CHARTS.has(s)).length>3)faults.push('数据图表合计超过3镜');
 faults.push(...imageRhythmFaults(raw));
 return faults;
};
