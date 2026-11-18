import {POOL_LAYOUTS,NEW_LAYOUTS,ESTATE_LAYOUTS,canonicalLayout} from '../style/layouts.ts';
export const STRUCTURES:Record<string,string>={
 titleFloat:'图文',bareNumber:'数字',mediaRows:'清单',quoteStack:'清单',ringFeature:'数据',triadSoft:'数字',outroHost:'片尾',
 splitVs:'对比决策',waitVs:'对比决策',decisionFork:'对比决策',slashCompare:'对比决策',balance:'数据',
 timeline:'流程',loanCurve:'流程',hexSteps:'流程',floorLadder:'楼体',paymentSplit:'预算',paymentCup:'预算',priceStep:'预算',loanDial:'数据',
 amenityOrbit:'空间配套',amenityPins:'空间配套',districtTags:'空间配套',parkingLines:'空间配套',
 pitfallBoard:'清单',layerReveal:'清单',ticketStub:'票据',indexTabs:'标签',archLight:'采光',contractNote:'合同',planSplit:'户型',buildingSection:'楼体',pitfallLens:'透镜',inspectTags:'标签',familyPlan:'家庭',policyNotes:'便笺',qaBubbles:'问答',
 lineReveal:'数据',barGlow:'数据',rankBars:'数据',waffle:'数据',yearRing:'数据',formulaCalc:'计算',
 dataCluster:'数据',comparePair:'对比决策',stepRail:'流程',riskGroup:'清单',noteGroup:'便笺'};
export const CHARTS=new Set(['lineReveal','barGlow','rankBars','waffle','balance','yearRing','formulaCalc']);
export const NEEDS_EVIDENCE=new Set([...CHARTS,'bareNumber','splitVs','waitVs','ringFeature','triadSoft','paymentSplit','priceStep','loanDial','districtTags','layerReveal']);
export const diversityTargets=(n:number)=>({kinds:n<8?n:Math.min(48,Math.max(7,Math.ceil(n*.7))),newKinds:n<8?0:Math.min(17,Math.max(2,Math.ceil(n*.25))),estateKinds:n<8?0:Math.min(9,Math.max(2,Math.ceil(n*.15))),structures:n<8?Math.min(n,3):5});
export const diversityFaults=(raw:{layout:string}[])=>{
 const names=raw.map(s=>canonicalLayout(s.layout)),n=names.length,target=diversityTargets(n),faults:string[]=[];
 const counts:Record<string,number>={},last:Record<string,number>={};
 names.forEach((name,i)=>{
  if(!POOL_LAYOUTS.includes(name as any))faults.push(`镜${i+1}:非正式选卡池 ${name}`);
  counts[name]=(counts[name]??0)+1;
  if(last[name]!=null&&i-last[name]<3)faults.push(`镜${i+1}: ${name} 中间不足2镜`);
  last[name]=i;
  const max=name==='outroHost'||NEW_LAYOUTS.includes(name as any)||CHARTS.has(name)?1:2;
  if(counts[name]>max)faults.push(`${name} 使用${counts[name]}次，上限${max}`);
  if(i>1&&STRUCTURES[name]===STRUCTURES[names[i-1]]&&STRUCTURES[name]===STRUCTURES[names[i-2]])faults.push(`镜${i-1}–${i+1}: 连续3镜同结构 ${STRUCTURES[name]}`);
  if(i&&CHARTS.has(name)&&CHARTS.has(names[i-1]))faults.push(`镜${i}–${i+1}:图表相邻`);
 });
 const kinds=[...new Set(names)],news=kinds.filter(s=>NEW_LAYOUTS.includes(s as any)),estate=kinds.filter(s=>ESTATE_LAYOUTS.includes(s as any)),structures=new Set(kinds.map(s=>STRUCTURES[s]));
 if(kinds.length<target.kinds)faults.push(`不同版式${kinds.length} < ${target.kinds}`);
 if(news.length<target.newKinds)faults.push(`不同扩展MG ${news.length} < ${target.newKinds}`);
 if(estate.length<target.estateKinds)faults.push(`不同房产MG ${estate.length} < ${target.estateKinds}`);
 if(structures.size<target.structures)faults.push(`信息结构${structures.size} < ${target.structures}`);
 if(names.filter(s=>CHARTS.has(s)).length>3)faults.push('数据图表合计超过3镜');
 return faults;
};
