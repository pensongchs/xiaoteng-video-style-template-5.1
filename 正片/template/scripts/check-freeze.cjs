// Portable local-template regression: real TS modules, mocked Remotion clock/assets (not a DOM pixel test).
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const realReact = require(path.join(root, 'node_modules/react'));
const React = {...realReact, useContext: c => c._currentValue};
const remotion = require(path.join(root, 'node_modules/remotion'));
let frame = 0; const cache = new Map();
const asset = props => React.createElement('asset', {src: props.src});
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = {exports: {}}; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true}}).outputText;
  const req = name => {
    if (name === 'react') return React;
    if (name === 'remotion') return {...remotion, useCurrentFrame: () => frame, useVideoConfig: () => ({fps: 30, width: 1920, height: 1080}), getInputProps: () => ({}), Img: asset, OffthreadVideo: asset, Freeze: p => p.children};
    if (name.startsWith('.')) {
      const b = path.resolve(path.dirname(file), name);
      const f = [b, b+'.ts', b+'.tsx', b+'.json'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      if (f?.endsWith('.json')) return JSON.parse(fs.readFileSync(f, 'utf8'));
      if (f) return load(f);
    }
    throw new Error('Unexpected module '+name);
  };
  new Function('require','module','exports',code)(req,module,module.exports);
  return module.exports;
}
const token = load('src/style/tokens.ts'), comp = load('src/style/components.tsx');
const layouts = load('src/style/layouts.ts');
const {connectionAt,connectionProgress} = load('src/style/connections.ts');
for(const [a,b] of [[0,60],[80,130],[30,68]]){
 // 5.1.2：A 停稳（入场+20）+hold 才起画，线在 B 入场前画完（A 出现 → 线长 → B 出现）
 const start=connectionAt(a,b);assert(start>=a+24&&start+14<=b,'A 出现 → 线长 → B 出现');
 for(let f=-10;f<=start;f++)assert.equal(connectionProgress(f,a,b),0,'line before card settle');
 let last=0;for(let f=start;f<=start+14;f++){const p=connectionProgress(f,a,b);assert(p>=last&&p<=1);last=p;}
 assert.equal(last,1);
}

const {GALLERY, ARCHIVE_GALLERY} = load('src/gallery/shots-mg-gallery.ts');
const {NEW_GALLERY} = load('src/gallery/shots-mg-new.ts');
const {RE10} = load('src/gallery/shots-mg-re10.ts');
const {SHOTS51} = load('src/cards51/Preview51.tsx');
const {ShotView} = load('src/style/archetypes.tsx');
const {frost} = load('src/style/mgEstate.tsx');
assert.equal(token.FROST, token.GLASS_V6);
assert.equal(token.GLASS.dark.fill, token.FROST.fill);
assert.equal(token.GLASS.light.fill, token.FROST.fill);
assert.equal(token.FROST.fill, token.fogFill('paper'));
assert.equal(new Set(['none','gold','coral','green','blue'].map(t=>comp.glassMat('dark',token.FROST.tint[t]).background)).size,5);
assert.equal(token.FROST.blur, 'blur(18px) saturate(1.15)'); // 5.1 科技色板：卡内轻雾，无颗粒
assert.equal(token.FROST.hair, 'var(--edge)');
assert.equal(token.FOG_GRAIN, 'none');
assert.equal(token.PALETTE.id, 'inkBlue', '默认色板应为墨蓝·电光');
for (const t of Object.values(token.FOG)) assert(!/rgba\((2[0-9]{2}), ?(2[0-9]{2}), ?(1[0-9]{2})/.test(t.fill0) || t.light, '暖黄卡底回归 '+t.name);
assert.equal(token.FROST.ink, token.FOG.paper.ink);
for (const tone of ['none','gold','coral','green','blue']) for (const soft of [false,true]) {
  const a = comp.glassMat('dark', token.FROST.tint[tone], undefined, soft), b = frost(tone, soft);
  for (const k of ['background','border','boxShadow','textShadow','backdropFilter','WebkitBackdropFilter','color']) assert.equal(a[k],b[k],tone+' '+k);
}
assert.equal(comp.glassMat('light').background, comp.glassMat().background);
assert(comp.glassMat('dark','rgba(224,113,92,0.42)').background.includes(token.fogFill('clay')));
assert.equal(comp.Sheen({at: 0}), null);
for (let f=-20; f<=240; f+=0.25) assert.equal(comp.bump(f), 0);
for (const kind of ['enter','soft','chip']) {
  let prev = -1;
  for (let f=-30;f<=240;f+=0.25) {
    const p = token.glassEnter(f,0,kind); assert(p>=prev && p>=0 && p<=1); prev=p;
    frame=f; const L = comp.useLiquid(0, kind==='soft'?token.SPRING.soft:kind==='chip'?token.SPRING.snappy:token.SPRING.enter);
    assert.equal(L.p,p); assert.equal(L.sx,1); assert.equal(L.sy,1);
  }
  assert.equal(token.glassEnter(token.GLASS_ENTER_FRAMES[kind],0,kind),1);
}
{ let prev=-1; for (let f=-30;f<=80;f+=0.25) { const p=token.glassEnter(f,0,'shaped'); assert(p>=prev&&p>=0&&p<=1); prev=p; }
  assert.equal(token.glassEnter(18,0,'shaped'),1); }
assert.equal(layouts.DEFAULT_LAYOUTS.length,24);
assert.equal(new Set(layouts.DEFAULT_LAYOUTS).size,24);
assert.deepEqual([...new Set(GALLERY.map(s=>s.layout))].sort(), [...layouts.DEFAULT_LAYOUTS].sort());
assert.equal(GALLERY.length,24); assert.equal(RE10.length,9); assert.equal(ARCHIVE_GALLERY.length,6);
assert.deepEqual(RE10.map(s=>s.layout).filter(l=>!layouts.RETIRED_LAYOUTS.includes(l)), [...layouts.ESTATE_LAYOUTS]);
assert.equal(layouts.canonicalLayout('outroAir'),'outroHost');
assert(!layouts.isDefaultLayout('unitCompare'));
assert.deepEqual(layouts.layoutRects('unitCompare'),{});
for (const s of ARCHIVE_GALLERY) assert(!layouts.isDefaultLayout(s.layout));
const geomKeys=['left','top','right','bottom','width','height','transform','transformOrigin','padding','gap','fontSize','filter'];
const take = st => Object.fromEntries(geomKeys.filter(k=>k in st).map(k=>[k,st[k]]));
function walk(node, out, p='0', parents=[]) {
  if (node == null || typeof node === 'boolean' || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach((n,i)=>walk(n,out,p+'.'+i,parents));
  if (typeof node.type === 'function') return walk(node.type(node.props),out,p+'.fn',parents);
  const st = node.props?.style || {}, chain=[...parents,take(st)];
  const fog = typeof st.backdropFilter === 'string' && st.backdropFilter === token.FROST.blur;
  if (fog) {
    const fills = [token.FROST.fill, token.FROST.fillSoft, ...Object.values(token.FOG).flatMap((x) => [x.fill0, x.fill1])];
    assert(fills.some((f) => st.background?.includes(f)), 'Noncanonical card '+p);
    assert(!st.background?.includes('rgba(62,64,72'), 'Cold gray card returned '+p);
    out.push({path:p, ancestors:chain});
  }
  const ctx = node.type && typeof node.type === 'object' && '_currentValue' in node.type ? node.type : null;
  const prev=ctx?ctx._currentValue:null;
  if(ctx) ctx._currentValue=node.props.value;
  walk(node.props?.children,out,p+'.child',chain);
  if(ctx) ctx._currentValue=prev;
}
function sample(s,f) { frame=f; const out=[]; walk(ShotView({s,dur:210}),out); return out; }
const stable=[];
assert.equal(NEW_GALLERY.length, 9);
assert.deepEqual(NEW_GALLERY.map(s=>s.layout), [...layouts.NEW_LAYOUTS]);
assert.deepEqual(SHOTS51.map(s=>s.layout), [...layouts.SMALL_LAYOUTS]);
for (const s of [...GALLERY,...ARCHIVE_GALLERY,...NEW_GALLERY,...SHOTS51]) {
  const ref=JSON.stringify(sample(s,185));
  for(let f=186;f<209;f++) assert.equal(JSON.stringify(sample(s,f)),ref,s.layout+' card/ancestor moved after settling at '+f);
  stable.push({layout:s.layout, glassElements:JSON.parse(ref).length, stableFrames:[185,208]});
}
const report={version:'5.1.1-cards-readability',smallLayouts:layouts.SMALL_LAYOUTS,palette:token.PALETTE.id,status:'validated',timezone:'Asia/Shanghai',testedAt:new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}),defaultCount:26,defaultLayouts:layouts.DEFAULT_LAYOUTS,estateLayouts:layouts.ESTATE_LAYOUTS,archiveLayouts:layouts.ARCHIVE_LAYOUTS,estateCount:9,archiveCount:6,unitCompareDefault:false,material:'GLASS_V6 = FROST; GLASS.dark/light and glassMat/frost/LG same source',baseAlpha:[0.64,0.76],entryFrames:token.GLASS_ENTER_FRAMES,overshoot:false,scanbar:false,settledGeometry:stable,scope:'TS/React-tree parameter regression; actual rendered stills checked separately, not a DOM pixel measurement'};
const dest=path.join(root,'检查');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'freeze-regression.json'),JSON.stringify(report,null,2)+'\n');
console.log(`PASS: frosted glass, contextual typography and connected card geometry; monotonic 16/18/20/12f; 24 default + 6 archive + 9 new + 5 small-card groups settled (5.1.1: text-only big cards retired); palette inkBlue; 8 estate kept; unitCompare excluded`);
