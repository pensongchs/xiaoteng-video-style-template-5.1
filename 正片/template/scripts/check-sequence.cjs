// 5.1 顺序与连线检查（npm run check:sequence，已并入 npm run verify）
// 用真实组件 + 模拟时钟渲染每个版式，读取 style/sequence.ts 的探针记录，强制：
//   1) 流程项（r0/r1…、s0…、c0…、w0…等）按序号严格递增入场，相邻 ≥ SEQ.minStagger 帧；无锚点兜底间隔 ≥ 12 帧（不许一起出现）
//   2) 连线 i→i+1 在两端都停稳（入场+20）之后才开始，且在镜内画完
//   3) 连线从源卡画向目标卡（pts 起点贴源卡、终点贴目标卡；from < to）
//   4) 同组连线按目标序号依次开始，不许整组同时画
//   5) 本期 SHOTS：流程类版式每一项都要有口播锚点，且按口播顺序递增（不许交换、缺项）
//   6) 静态：src 里所有 strokeDashoffset 画线必须走 connectionProgress/linkProgress（或登记的装饰）
const fs = require('node:fs'), path = require('node:path');
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
      const f = [b, b + '.ts', b + '.tsx', b + '.json'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      if (f?.endsWith('.json')) return JSON.parse(fs.readFileSync(f, 'utf8'));
      if (f) return load(f);
    }
    if (name.startsWith('@remotion/')) return require(path.join(root, 'node_modules', name));
    throw new Error('Unexpected module ' + name);
  };
  new Function('require', 'module', 'exports', code)(req, module, module.exports);
  return module.exports;
}
let dashEls = [];
function walk(node) {
  if (node == null || typeof node === 'boolean' || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(walk);
  if (typeof node.type === 'function') return walk(node.type(node.props));
  if (node.props && node.props.strokeDashoffset != null) dashEls.push({type: node.type, link: node.props['data-link']});
  const ctx = node.type && typeof node.type === 'object' && '_currentValue' in node.type ? node.type : null;
  const prev = ctx ? ctx._currentValue : null;
  if (ctx) ctx._currentValue = node.props.value;
  walk(node.props?.children);
  if (ctx) ctx._currentValue = prev;
}

const seq = load('src/style/sequence.ts'), {SEQ} = seq;
const {ShotView} = load('src/style/archetypes.tsx');
const {GALLERY, ARCHIVE_GALLERY} = load('src/gallery/shots-mg-gallery.ts');
const {NEW_GALLERY} = load('src/gallery/shots-mg-new.ts');
const {RE10} = load('src/gallery/shots-mg-re10.ts');
const {SHOTS51} = load('src/cards51/Preview51.tsx');
const {SEQUENTIAL_LAYOUTS, FALLBACK_MIN_GAP, requiredSeqKeys} = load('src/style/sequence-spec.ts');
const {sceneOf, isNewLayout} = (() => { const m = load('src/style/scenes.ts'); return {sceneOf: m.sceneOf, isNewLayout: l => { try { return !!m.sceneOf(l); } catch { return false; } }}; })();
const specKeys = s => requiredSeqKeys(s.layout, s.data ?? {}, isNewLayout(s.layout) ? sceneOf(s.layout, s.data).cards.length : 0);

const errors = [], report = [];
const err = (ctx, msg) => errors.push(`${ctx}: ${msg}`);
const boxDist = (p, b) => { const dx = Math.max(b.x - p[0], 0, p[0] - (b.x + b.w)), dy = Math.max(b.y - p[1], 0, p[1] - (b.y + b.h)); return Math.hypot(dx, dy); };

function probe(s, dur, anchors) {
  const runs = [];
  for (const f of [0, Math.floor(dur / 2), dur - 1]) {
    frame = f; seq.startSeqProbe(); dashEls = [];
    walk(ShotView({s, dur, anchors}));
    const p = seq.stopSeqProbe(); p.dash = dashEls;
    runs.push(p);
  }
  return runs;
}
function checkShot(ctx, s, dur, anchors, opts = {}) {
  const runs = probe(s, dur, anchors), p = runs[runs.length - 1];
  // 时刻必须与当前帧无关（否则「越播越变」）
  const sig = r => JSON.stringify({i: r.items.map(x => [x.key, x.start]), l: r.links.map(x => [x.id, x.start])});
  if (sig(runs[0]) !== sig(p) || sig(runs[1]) !== sig(p)) err(ctx, '入场/连线时刻随播放帧变化');
  const groups = {};
  for (const it of p.items) (groups[it.prefix] ??= []).push(it);
  for (const [pre, arr] of Object.entries(groups)) {
    arr.sort((a, b) => a.idx - b.idx);
    arr.forEach((it, k) => {
      if (!Number.isFinite(it.start)) err(ctx, `${it.key} 同一项算出了两种入场时刻`);
      if (k === 0) return;
      const prev = arr[k - 1], gap = it.start - prev.start;
      if (!(gap >= SEQ.minStagger)) err(ctx, `${it.key}(${it.start}f) 没有晚于 ${prev.key}(${prev.start}f) 至少 ${SEQ.minStagger} 帧（顺序错或同时出现）`);
      else if (!it.anchored && !prev.anchored && SEQUENTIAL_LAYOUTS.has(s.layout) && gap < FALLBACK_MIN_GAP) err(ctx, `${prev.key}→${it.key} 兜底间隔 ${gap}f < ${FALLBACK_MIN_GAP}f（流程项几乎同时出现）`);
    });
  }
  // 画出来的每一条线（strokeDashoffset）都必须对应一条走统一时刻的连线记录（data-link=id），或标明 diagram/lead 装饰
  const ids = new Set(p.links.map(l => l.id));
  for (const d of runs.flatMap(r => r.dash)) {
    if (d.link == null) { err(ctx, `有一条 <${d.type}> 线没有 data-link，无法确认它走统一连线时刻`); continue; }
    if (d.link !== 'diagram' && d.link !== 'lead' && !ids.has(d.link)) err(ctx, `线 ${d.link} 自己算起画时刻（没有经过 connectionProgress/linkProgress）`);
  }
  const seen = new Map();
  for (const l of p.links) {
    if (seen.has(l.id) && seen.get(l.id) !== l.start) err(ctx, `连线 ${l.id} 有两种起画时刻`);
    seen.set(l.id, l.start);
    const settled = Math.max(seq.settleAt(l.aStart), seq.settleAt(l.bStart));
    if (l.start < settled) err(ctx, `连线 ${l.id} 在 ${l.start}f 起画，早于两端停稳 ${settled}f`);
    if (l.start + l.draw > dur) err(ctx, `连线 ${l.id} 镜内画不完（${l.start}+${l.draw} > 镜长 ${dur}）——把最后一项的口播锚点提前，或给组件传 dur`);
    if (typeof l.from === 'number' && typeof l.to === 'number' && !(l.from < l.to)) err(ctx, `连线 ${l.id} 方向 ${l.from}→${l.to}：应从先出现的卡画向后出现的卡`);
    const itemOf = k => p.items.find(x => x.key === k);
    if (l.toKey && itemOf(l.toKey) && l.bStart < itemOf(l.toKey).start) err(ctx, `连线 ${l.id} 用了早于目标卡 ${l.toKey} 真实入场(${itemOf(l.toKey).start}f)的时刻 ${l.bStart}f（线会先于卡出现）`);
    if (l.fromKey && itemOf(l.fromKey) && l.aStart < itemOf(l.fromKey).start - 14) err(ctx, `连线 ${l.id} 用了早于源卡 ${l.fromKey} 真实入场(${itemOf(l.fromKey).start}f)的时刻 ${l.aStart}f`);
    if (typeof l.to === 'number' && typeof l.from === 'number' && l.aStart > l.bStart) err(ctx, `连线 ${l.id} 源卡入场(${l.aStart}f)晚于目标卡(${l.bStart}f)`);
    if (l.pts && l.fromBox && l.toBox && l.pts.length >= 2) {
      const a = l.pts[0], b = l.pts[l.pts.length - 1];
      if (boxDist(a, l.fromBox) > boxDist(a, l.toBox) + 0.5 || boxDist(b, l.toBox) > boxDist(b, l.fromBox) + 0.5) err(ctx, `连线 ${l.id} 反向生长：路径应从源卡一端画到目标卡一端`);
    }
  }
  // 同组连线按目标依次开始
  const fam = {};
  for (const l of p.links) if (typeof l.to === 'number') (fam[l.id.replace(/\d+$/, '')] ??= []).push(l);
  for (const [k, arr] of Object.entries(fam)) {
    const uniq = [...new Map(arr.map(l => [l.id, l])).values()].sort((a, b) => a.to - b.to);
    for (let i = 1; i < uniq.length; i++) if (uniq[i].bStart > uniq[i - 1].bStart && !(uniq[i].start > uniq[i - 1].start)) err(ctx, `连线 ${uniq[i].id} 与 ${uniq[i - 1].id} 同时起画（应按口播依次）`);
  }
  report.push({ctx, layout: s.layout, dur, items: p.items.map(x => `${x.key}@${x.start}${x.anchored ? '*' : ''}`).join(' '), links: [...new Map(p.links.map(l => [l.id, `${l.id}:${l.from}→${l.to}@${l.start}`])).values()].join(' ')});
  return p;
}

// A. 全部登记版式：无锚点（兜底）、短镜、以及按口播锚点三种情况
const all = [...GALLERY, ...ARCHIVE_GALLERY, ...NEW_GALLERY, ...RE10, ...SHOTS51];
for (const s of all) {
  checkShot(`样例/${s.layout}`, s, 210);
  checkShot(`样例/${s.layout}@短镜120f`, s, 120);
  // 用一组模拟口播锚点（每项晚 28 帧）再跑一遍
  const keys = [...new Set(probe(s, 210)[2].items.map(x => x.key))].sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
  const anchors = {}; const byPre = {};
  for (const k of keys) { const m = seq.SEQ_KEY.exec(k); (byPre[m[1]] ??= []).push(Number(m[2])); }
  for (const [pre, idxs] of Object.entries(byPre)) idxs.sort((a, b) => a - b).forEach((i, k) => { anchors[pre + i] = 10 + k * 28; });
  checkShot(`样例/${s.layout}+口播锚点`, s, 240, anchors);
  if (SEQUENTIAL_LAYOUTS.has(s.layout)) {
    const spec = specKeys(s), pre = new Set(spec.map(k => seq.SEQ_KEY.exec(k)[1]));
    const used = keys.filter(k => pre.has(seq.SEQ_KEY.exec(k)[1]));
    if (!spec.length || JSON.stringify(spec) !== JSON.stringify(used)) err(`样例/${s.layout}`, `sequence-spec 必填锚点 [${spec}] 与组件实际逐项入场 [${used}] 不一致`);
  }
}

// B. 本期 SHOTS：真实时间轴 + 口播锚点必填且有序
const shotsFile = path.join(root, 'src/demo/shots.ts');
if (fs.existsSync(shotsFile)) {
  const {SHOTS} = load('src/demo/shots.ts');
  const {buildTimeline} = load('src/sync/timeline.ts');
  const EP = JSON.parse(fs.readFileSync(path.join(root, 'src/demo/episode.json'), 'utf8'));
  const tl = buildTimeline(SHOTS, EP);
  for (const e of tl.errors) err('本期', e);
  for (const it of tl.items) {
    const ctx = `本期/${it.s.id}/${it.s.layout}`;
    if (SEQUENTIAL_LAYOUTS.has(it.s.layout)) {
      const spec = specKeys(it.s);
      const miss = spec.filter(k => it.s.anchors?.[k] == null);
      if (miss.length) err(ctx, `流程类版式缺口播锚点：${miss.join('、')}（每一项都要绑定口播里说到它的词）`);
      for (let k = 1; k < spec.length; k++) {
        const a = it.anchors[spec[k - 1]], b = it.anchors[spec[k]];
        if (a != null && b != null && !(b > a)) err(ctx, `口播锚点顺序错：${spec[k]}「${it.s.anchors[spec[k]]}」(${b}f) 不晚于 ${spec[k - 1]}「${it.s.anchors[spec[k - 1]]}」(${a}f)`);
      }
    }
    checkShot(ctx, it.s, it.d, it.anchors);
  }
}

// C. 静态：画线（strokeDashoffset）必须走统一连线时刻
const DECOR = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'sequence-decor.json'), 'utf8')).allow);
const srcFiles = []; (function rd(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) rd(p); else if (/\.tsx?$/.test(n)) srcFiles.push(p); } })(path.join(root, 'src'));
for (const f of srcFiles) {
  const rel = path.relative(root, f).split(path.sep).join('/'), t = fs.readFileSync(f, 'utf8');
  if (!t.includes('strokeDashoffset')) continue;
  if (/connectionProgress|linkProgress/.test(t) || DECOR.has(rel)) continue;
  err('静态', `${rel} 自己画线（strokeDashoffset）但没有走 connectionProgress/linkProgress`);
}
// 不许组件自造「连线时刻」常量
for (const f of srcFiles) {
  const rel = path.relative(root, f).split(path.sep).join('/'), t = fs.readFileSync(f, 'utf8');
  if (rel !== 'src/style/sequence.ts' && /SEQ\s*\.\s*(hold|settle|draw)\s*=/.test(t)) err('静态', `${rel} 改写了 SEQ 时刻常量`);
}

const dest = path.join(root, '检查'); fs.mkdirSync(dest, {recursive: true});
fs.writeFileSync(path.join(dest, 'sequence-report.json'), JSON.stringify({status: errors.length ? 'failed' : 'passed', rule: SEQ, errors, shots: report}, null, 2) + '\n');
if (errors.length) {
  console.error(`✗ 顺序与连线检查失败（${errors.length} 处）：`);
  for (const e of errors.slice(0, 80)) console.error('  - ' + e);
  if (errors.length > 80) console.error(`  …另有 ${errors.length - 80} 处，见 检查/sequence-report.json`);
  process.exit(1);
}
console.log(`PASS: 顺序与连线 — ${report.length} 次版式渲染；流程项按序号递增入场，连线在两端停稳+${SEQ.hold}f 后从源到目标依次长出`);
