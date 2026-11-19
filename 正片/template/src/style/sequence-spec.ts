/** 5.1 顺序与连线 · 镜头表约束（check-episode 与 check-sequence 共用）
 *  流程类版式：每一项都必须在 SHOTS[i].anchors 里绑定「口播里说到它的那个词」，并按口播先后递增。
 *  缺任一项、或两项锚点顺序颠倒，npm run verify 直接失败。 */
export const SEQUENTIAL_LAYOUTS = new Set<string>([
  'timeline', 'stepRail', 'hexSteps', 'indexTabs', 'floorLadder', 'priceStep', 'paymentSplit', 'decisionFork',
  'dataCluster', 'noteGroup', 'riskGroup', 'pitfallBoard', 'mediaRows', 'quoteStack', 'triadSoft', 'formulaCalc',
]);
/** 无锚点兜底时流程项之间的最小间隔（帧）——低于它看起来就是「一起出现」 */
export const FALLBACK_MIN_GAP = 12;

const keys = (prefix: string, n: number) => Array.from({length: Math.max(0, n)}, (_, i) => `${prefix}${i}`);
const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
/** 某个流程类镜头必须提供的锚点键（顺序即口播顺序）。非流程类返回 []。
 *  sceneCards：新版式（hexSteps/indexTabs）的场景卡片数，由调用方用 sceneOf(layout, data).cards.length 传入。 */
export const requiredSeqKeys = (layout: string, data: any = {}, sceneCards = 0): string[] => {
  switch (layout) {
    case 'timeline': return keys('s', len(data.steps));
    case 'triadSoft': return keys('c', len(data.cols));
    case 'formulaCalc': return keys('term', len(data.terms));
    case 'mediaRows': case 'quoteStack': return keys('r', len(data.rows));
    case 'floorLadder': return keys('r', len(data.floors));
    case 'paymentSplit': return keys('r', len(data.parts));
    case 'pitfallBoard': return keys('r', len(data.items));
    case 'priceStep': return keys('r', len(data.steps));
    case 'decisionFork': return keys('r', 3); // 问题 → 是 → 否
    case 'hexSteps': case 'indexTabs': return keys('r', sceneCards);
    case 'stepRail': return keys('r', Math.min(4, len(data.steps)));
    case 'dataCluster': return keys('r', 1 + Math.min(3, len(data.items)));
    case 'riskGroup': return keys('r', 1 + Math.min(3, len(data.items)));
    case 'noteGroup': return keys('r', 1 + Math.min(3, len(data.notes)));
    default: return [];
  }
};

/** 画连线的版式及其时序模式（check-sequence 核对：凡是实际画了连线的版式必须登记在此）。
 *  chain：A→B→C 相邻项 ≥ LINK_GAP（源卡停稳 → 线长 → 目标卡出现）；
 *  fork：r0 连出 r1.. 多张，r1.. 各 ≥ r0+LINK_GAP；hub：枢纽卡（总卡/中心卡/底图）提前 LINK_GAP 出现（hubAt）。 */
export const LINK_MODE: Record<string, 'chain' | 'fork' | 'hub'> = {
  stepRail: 'chain', hexSteps: 'chain', floorLadder: 'chain', timeline: 'chain', qaBubbles: 'chain',
  decisionFork: 'fork', amenityPins: 'fork', pitfallLens: 'fork', dataCluster: 'fork', noteGroup: 'fork', riskGroup: 'fork', comparePair: 'fork',
  paymentSplit: 'hub', amenityOrbit: 'hub', loanCurve: 'hub', inspectTags: 'hub', splitVs: 'chain', waitVs: 'chain',
};
export const LINKED_LAYOUTS = new Set<string>(Object.keys(LINK_MODE));
