/** 5.1 顺序与连线（共用）：流程类卡片按口播逐项入场；连线在两端卡片都停稳后，从源卡向目标卡依次长出。
 *  组件只通过这里计算入场与连线时刻；check-sequence 读取同一份探针记录做强制检查。 */
export const SEQ = {
  /** 卡片入场到完全停稳的帧数（取 enter/shaped/soft 的最长 20 帧，保守） */
  settle: 20,
  /** 两端都停稳后再等待的帧数，再开始画线 */
  hold: 18,
  /** 线从源到目标的生长帧数 */
  draw: 14,
  /** 相邻两项入场最小间隔（防止「一起出现」） */
  minStagger: 6,
  /** 镜尾留给画线完成的余量 */
  tailPad: 2,
};
/** 需要严格按序号入场的锚点前缀：r0/r1…（通用）、s0…（timeline）、c0…（triadSoft）、w0…（图片窗）、chip0…、term0…、q0…、sub0… */
export const SEQ_KEY = /^(r|s|c|w|chip|term|q|sub)(\d+)$/;

export type SeqItemRec = {key: string; prefix: string; idx: number; start: number; anchored: boolean};
export type SeqLinkRec = {id: string; from: number | 'hub'; to: number | 'hub'; aStart: number; bStart: number; start: number; draw: number; dur?: number; fromKey?: string; toKey?: string;
  pts?: [number, number][]; fromBox?: {x: number; y: number; w: number; h: number}; toBox?: {x: number; y: number; w: number; h: number}};
type Probe = {items: SeqItemRec[]; links: SeqLinkRec[]};
const G = globalThis as any;
export const seqProbe = (): Probe | undefined => G.__XT_SEQ_PROBE__;
export const startSeqProbe = () => { G.__XT_SEQ_PROBE__ = {items: [], links: []}; return G.__XT_SEQ_PROBE__ as Probe; };
export const stopSeqProbe = () => { const p = G.__XT_SEQ_PROBE__ as Probe | undefined; G.__XT_SEQ_PROBE__ = undefined; return p; };

export const settleAt = (start: number) => start + SEQ.settle;
/** 连线起点 = max(两端停稳) + hold；镜尾不足时提前到「刚停稳」，但绝不早于停稳。 */
export const linkStartAt = (aStart: number, bStart: number, dur?: number) => {
  const settled = Math.max(settleAt(aStart), settleAt(bStart));
  let t = settled + SEQ.hold;
  if (dur != null && Number.isFinite(dur)) t = Math.min(t, Math.max(settled, dur - SEQ.draw - SEQ.tailPad));
  return t;
};
const ease = (p: number) => 1 - Math.pow(1 - p, 3);
export type LinkOpt = {id?: string; from?: number | 'hub'; to?: number | 'hub'; dur?: number; draw?: number;
  /** 端点卡的锚点键（如 'r2'）：检查会核对传入的入场帧不早于该卡真实入场 */
  fromKey?: string; toKey?: string;
  pts?: [number, number][]; fromBox?: SeqLinkRec['fromBox']; toBox?: SeqLinkRec['toBox']};
/** 连线生长 0→1。路径须从源卡画向目标卡（pts[0] 在源卡一侧）。 */
export const linkProgress = (frame: number, aStart: number, bStart: number, opt: LinkOpt = {}) => {
  const start = linkStartAt(aStart, bStart, opt.dur), draw = opt.draw ?? SEQ.draw;
  const pr = seqProbe();
  if (pr) pr.links.push({id: opt.id ?? `link${pr.links.length}`, from: opt.from ?? 'hub', to: opt.to ?? 'hub', aStart, bStart, start, draw, dur: opt.dur, fromKey: opt.fromKey, toKey: opt.toKey, pts: opt.pts, fromBox: opt.fromBox, toBox: opt.toBox});
  return ease(Math.max(0, Math.min(1, (frame - start) / draw)));
};

/** 把一组锚点（帧）规整为严格递增：缺的中间项插值，前导缺项向前推，后续项至少间隔 minStagger。 */
export const normalizeSeqAnchors = (anchors: Record<string, number>): Record<string, number> => {
  const out = {...anchors}; const groups: Record<string, number[]> = {};
  for (const k of Object.keys(anchors)) { const m = SEQ_KEY.exec(k); if (m && anchors[k] != null) (groups[m[1]] ??= []).push(Number(m[2])); }
  for (const [p, idxs] of Object.entries(groups)) {
    const max = Math.max(...idxs); let prev = -Infinity;
    // 先找每个缺口两侧的已锚定项，插值；再强制递增
    const known = (i: number) => anchors[`${p}${i}`];
    for (let i = 0; i <= max; i++) {
      let v = known(i);
      if (v == null) {
        let j = i + 1; while (j <= max && known(j) == null) j++;
        const next = known(j);
        v = Number.isFinite(prev) ? (next != null ? prev + (next - prev) / (j - i + 1) : prev + SEQ.minStagger) : next - SEQ.minStagger * (j - i);
      }
      if (Number.isFinite(prev) && v < prev + SEQ.minStagger) v = prev + SEQ.minStagger;
      out[`${p}${i}`] = Math.max(0, Math.round(v)); prev = out[`${p}${i}`];
    }
  }
  return out;
};

/** 记录一项入场（供检查）。 */
export const recordSeqItem = (key: string, start: number, anchored: boolean) => {
  const pr = seqProbe(); const m = SEQ_KEY.exec(key); if (!pr || !m) return;
  const prev = pr.items.find((x) => x.key === key);
  if (prev) { if (prev.start !== start) prev.start = Number.NaN; return; } // 同一项算出两种时刻 → 检查报错
  pr.items.push({key, prefix: m[1], idx: Number(m[2]), start, anchored});
};
/** 当前项：最后一个已入场的下标（单调，随口播前进） */
export const actIndex = (f: number, starts: number[]) => { let k = -1; starts.forEach((s, i) => { if (f >= s) k = i; }); return k; };
/** 无锚点兜底：按序号均匀错峰，间隔取 14–36 帧（随镜长），保证「一项一项」而不是同时出现。 */
export const fallbackGap = (dur: number, n: number, first = 12) => Math.max(14, Math.min(36, (dur - first - 50) / Math.max(1, n)));
