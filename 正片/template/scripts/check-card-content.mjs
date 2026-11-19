// 5.1.2 卡面内容守卫（静态部分；DOM 实测在 src/style/domcheck.tsx，随 verify --dom 运行）：
//  1) 色板：每个色调的填充色必须是墨蓝·电光玻璃色（半透明、不发棕、不是无蓝调纯灰、色相落在语义区间）
//  2) 版式几何：选卡池里每个「卡面几何版式」逐卡检查——占位字 / 大圆大卡只有一两个字 / 长条卡内容太少 / 卡太宽太空
//  3) 镜头数据：demo 镜头、官方画廊、样镜里所有文字不得是占位字；带 sceneText 的镜头按真实文字重算几何后再过一遍第 2 条
//  4) 自检：把「交付实力」截图里的错误情形（大圆「示意」+ 三张只有标题的宽条卡 + 棕/灰实色）喂给守卫，必须被拦下；修好的样镜必须通过
// 阈值与说明见 src/style/content-guard.ts（CARD_GUARD）与 AGENTS.md「卡面内容守卫」一节。
import opentype from 'opentype.js';
import {BIG_CARD_AREA, POOL_LAYOUTS} from '../src/style/layouts.ts';
import {sceneOf, NEW_SCENE_NAMES} from '../src/style/scenes.ts';
import {PALETTES} from '../src/style/tokens.ts';
import {CARD_GUARD, cardContentFaults, fillFault, isCirclePoly, isPlaceholderText, parseRgba} from '../src/style/content-guard.ts';
import {GALLERY} from '../src/gallery/shots-mg-gallery.ts';
import {NEW_GALLERY, OUTRO_INTERACT} from '../src/gallery/shots-mg-new.ts';
import {RE10} from '../src/gallery/shots-mg-re10.ts';
import {DELIVERY_SHOT} from '../src/gallery/shots-delivery.ts';
import {SHOTS} from '../src/demo/shots.ts';

const errs = [];
const font = opentype.loadSync(new URL('../public/fonts/AlibabaHealthFont2.0CN-85B.ttf', import.meta.url));
const wOf = (t, size) => font.getAdvanceWidth(t, size);

/** scene 里的卡 → 守卫输入（实测字宽；contentW = 文字与图标的并集宽）。 */
const guardCards = (scene) => scene.cards.map((c) => {
  const xs = c.poly.map((p) => p[0]), ys = c.poly.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const spans = [];
  for (const t of c.texts) {
    if (!t.text.trim()) continue;
    const w = wOf(t.text, t.size);
    const l = t.align === 'center' ? t.box.x + (t.box.w - w) / 2 : t.box.x;
    spans.push([l, l + w]);
  }
  if (c.visual) spans.push([c.visual.box.x, c.visual.box.x + c.visual.box.w]);
  const contentW = spans.length ? Math.max(...spans.map((q) => q[1])) - Math.min(...spans.map((q) => q[0])) : 0;
  return {id: c.id, w: x1 - x0, h: y1 - y0, circle: isCirclePoly(c.poly), texts: c.texts.map((t) => t.text), hasVisual: !!c.visual, contentW};
});
export const sceneFaults = (name, scene, label = name) => guardCards(scene).flatMap((g) => cardContentFaults(g, BIG_CARD_AREA, `${label}/${g.id}`));

// 1) 色板
for (const [pid, p] of Object.entries(PALETTES)) for (const [tone, t] of Object.entries(p.tones)) for (const k of ['fill0', 'fill1']) {
  const c = parseRgba(t[k]); const f = c ? fillFault(c, tone) : `无法解析填充色 ${t[k]}`;
  if (f) errs.push(`色板 ${pid}.${tone}.${k}：${f}`);
}

// 2) 版式几何（选卡池里有卡面几何的版式）
const poolScenes = NEW_SCENE_NAMES.filter((n) => POOL_LAYOUTS.includes(n));
for (const name of poolScenes) {
  try { sceneFaults(name, sceneOf(name, {})).forEach((e) => errs.push(e)); } catch (e) { errs.push(`${name}：${e.message}`); }
}

// 3) 镜头数据
const SKIP_KEYS = new Set(['src', 'tone', 'kind', 'id', 'layout', 'icon', 'video', 'palette', 'motion', 'trim', 'mark', 'align']);
const placeholderIn = (v, path, out) => {
  if (typeof v === 'string') { if (isPlaceholderText(v)) out.push(`${path}=「${v}」`); return; }
  if (Array.isArray(v)) return v.forEach((x, i) => placeholderIn(x, `${path}[${i}]`, out));
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k)) placeholderIn(x, `${path}.${k}`, out);
};
const allShots = [['demo', SHOTS], ['gallery', GALLERY], ['new', NEW_GALLERY], ['outro', OUTRO_INTERACT], ['re10', RE10], ['delivery', [DELIVERY_SHOT]]];
for (const [src, list] of allShots) for (const s of list) {
  const hits = []; placeholderIn({kicker: s.kicker, title: s.title, data: s.data}, `${src}:${s.id ?? s.layout}`, hits);
  hits.forEach((h) => errs.push(`镜头数据含占位文字 ${h}：写真实内容（标题 + 补充说明）`));
  if (poolScenes.includes(s.layout) && s.data && Object.keys(s.data).length) {
    try { sceneFaults(s.layout, sceneOf(s.layout, s.data), `${src}:${s.id}(${s.layout})`).forEach((e) => errs.push(e)); } catch (e) { errs.push(`${src}:${s.id}(${s.layout})：${e.message}`); }
  }
}

// 4) 自检：截图里的错误必须被拦住
{
  const must = (cond, msg) => { if (!cond) errs.push(`守卫自身失效：${msg}`); };
  const circle = (r) => Array.from({length: 36}, (_, i) => [Math.cos(i / 36 * Math.PI * 2) * r, Math.sin(i / 36 * Math.PI * 2) * r]);
  must(isCirclePoly(circle(178)), '圆形识别');
  const hub = {id: 'hub', w: 356, h: 356, circle: true, texts: ['示意'], hasVisual: false};
  const hubF = cardContentFaults(hub, BIG_CARD_AREA);
  must(hubF.some((f) => /占位/.test(f)), '大圆「示意」没被判占位');
  must(hubF.some((f) => /大圆/.test(f)), '大圆只有两个字没被拦');
  const strip = {id: 'strip', w: 544, h: 170, texts: ['资金保障'], hasVisual: false, contentW: wOf('资金保障', 44)};
  const sF = cardContentFaults(strip, BIG_CARD_AREA);
  must(sF.some((f) => /长条卡/.test(f)), '只有标题的长条卡没被拦');
  must(sF.some((f) => /太宽太空/.test(f)), '太宽太空没被拦');
  must(cardContentFaults({id: 'big', w: 700, h: 300, texts: ['文字'], hasVisual: false}, BIG_CARD_AREA).length >= 2, '大卡只有「文字」没被拦');
  for (const w of ['示意', '占位', '标题', '文字', 'xxx', 'TODO', 'lorem ipsum', '示例', 'XXXX', '待补充']) must(isPlaceholderText(w), `「${w}」没被判占位`);
  for (const w of ['资金保障', '示例户型', '* 数据为示例', '工程进度']) must(!isPlaceholderText(w), `「${w}」被误判占位`);
  must(fillFault(parseRgba('rgba(74,48,46,0.92)')) !== null, '棕色实色卡面没被拦');
  must(fillFault(parseRgba('rgba(58,58,60,0.95)')) !== null, '深灰实色卡面没被拦');
  must(fillFault(parseRgba('rgba(86,52,60,0.70)'), 'clay') !== null, '5.1.1 旧 clay（发棕的暗枫）没被拦');
  try { sceneOf('pitfallLens', {sceneText: {lens: ['示意']}}); must(false, 'sceneOf 没拒绝「示意」'); } catch (e) { must(/占位/.test(e.message), 'sceneOf 拒绝信息不对'); }
  try { sceneOf('noSuchLayout', {}); must(false, 'sceneOf 对未知版式没报错（静默回退）'); } catch (e) { must(/未知版式/.test(e.message), '未知版式报错信息不对'); }
  try { sceneOf('pitfallLens', {sceneText: {hub: ['交付实力', '三项']}}); must(false, 'sceneOf 没拒绝不存在的卡 id'); } catch (e) { must(/没有卡/.test(e.message), '错误卡 id 报错信息不对'); }
  const fixed = sceneFaults('pitfallLens', sceneOf('pitfallLens', DELIVERY_SHOT.data));
  must(fixed.length === 0, `修好的「交付实力」样镜被误拦：${fixed.join('；')}`);
}

if (errs.length) { console.error('✗ 卡面内容守卫未通过：\n' + errs.map((e) => '  ' + e).join('\n')); process.exit(1); }
console.log(`✓ 卡面内容守卫通过：色板 ${Object.keys(PALETTES).length} 套×5 色调为墨蓝玻璃色；${poolScenes.length} 个卡面几何版式与 ${allShots.reduce((n, [, l]) => n + l.length, 0)} 个样镜无占位字、无空大圆/大卡、无稀疏长条卡；自检 OK（阈值：大圆≥${CARD_GUARD.bigCircleD}px、长条宽≥${CARD_GUARD.stripW}px 或 ≥${CARD_GUARD.stripAspect}:1、内容填充≥${CARD_GUARD.fillMin * 100}%）`);
