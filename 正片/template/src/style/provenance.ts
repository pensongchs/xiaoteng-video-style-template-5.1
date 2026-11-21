/** 5.1.2 卡面文字出处（纯函数，播前 plan:check 与自检共用，不渲染）。
 *  规则：每一条卡面文字都必须来自本镜口播（或本镜登记的 evidence.label）；不许默认占位字、不许凭空写关键词。
 *  - 占位字（示意/示例/标题/文字/XXX…）一律失败
 *  - 去标点后 ≤4 个汉字的卡面词：必须原样出现在本镜口播里
 *  - 更长的卡面文字：≥60% 的汉字要落在口播里连续 ≥2 字的片段中
 *  - 纯数字/符号/单位、图片路径、色调/图标等非文字字段不检查 */
import {isPlaceholderText} from './placeholder.ts';

export const PROV = {shortMax: 4, longCover: 0.6};
const SKIP_KEYS = new Set(['src', 'prompt', 'image', 'img', 'icon', 'tone', 'mark', 'video', 'trim', 'bg', 'palette', 'kind', 'visual', 'cutout', 'poster', 'hookImages', 'color', 'id', 'size', 'x', 'y', 'w', 'h']);
const PUNCT = /[\s·•，。！？；：、,.!?;:…—\-–~|/()（）「」“”"'‘’*＊→←↑↓✓✕▲▼<>《》\[\]【】{}+＋=%％]/g;
export const normText = (t: string) => t.replace(PUNCT, '');
const cjk = (t: string) => [...t].filter((c) => /[\u4e00-\u9fff]/.test(c)).length;

export type CardText = {path: string; text: string};
const looksLikeAsset = (t: string) => /\.(png|jpe?g|webp|mp4|mov|svg)$/i.test(t) || /^(media|stock|episode)\//.test(t);
/** 取出一个镜头里所有会显示在卡面上的文字（含 sceneText、标题、data 里的字符串）。 */
export const collectCardTexts = (shot: any): CardText[] => {
  const out: CardText[] = [];
  const walk = (v: any, path: string, key = '') => {
    if (v == null || SKIP_KEYS.has(key)) return;
    if (typeof v === 'string') { if (!looksLikeAsset(v)) out.push({path, text: v}); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`, key)); return; }
    if (typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k, k);
  };
  walk(shot.data, 'data');
  if (typeof shot.title === 'string') out.push({path: 'title', text: shot.title});
  return out;
};
const coverage = (text: string, corpus: string) => {
  const n = text.length; let covered = 0, i = 0;
  while (i < n) { let L = Math.min(n - i, 12); for (; L >= 2; L--) if (corpus.includes(text.slice(i, i + L))) break; if (L >= 2) { covered += L; i += L; } else i++; }
  return covered / Math.max(1, n);
};
export type ProvFault = {path: string; text: string; why: string};
/** corpus：本镜口播原文（+ evidence.label）。返回违规列表。 */
export const provenanceFaults = (shot: any, vo: string, opts: {strictSource?: boolean} = {}): ProvFault[] => {
  const faults: ProvFault[] = []; const corpus = normText(`${vo}${shot.evidence?.label ?? ''}`);
  for (const c of collectCardTexts(shot)) {
    if (!c.text.trim()) continue;
    if (isPlaceholderText(c.text)) { faults.push({...c, why: '占位字：卡面必须写真实内容，来自本镜口播'}); continue; }
    if (opts.strictSource === false) continue;
    const t = normText(c.text), n = cjk(t); if (n < 2) continue;
    const cn = [...t].filter((ch) => /[\u4e00-\u9fff]/.test(ch)).join('');
    if (n <= PROV.shortMax) { if (!corpus.includes(cn) && !corpus.includes(t)) faults.push({...c, why: `关键词「${cn}」不在本镜口播里：卡面关键词必须取自口播原文`}); }
    else { const cv = coverage(cn, corpus); if (cv < PROV.longCover) faults.push({...c, why: `只有 ${Math.round(cv * 100)}% 的字来自口播（要求 ≥${Math.round(PROV.longCover * 100)}%）：补充说明也要用口播里的话`}); }
  }
  return faults;
};
