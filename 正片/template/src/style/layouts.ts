import {FULL, rect, splitRows, ROWS, CONTENT_H, type Rect} from './grid.ts';

export type LayoutName =
  | 'titleFloat' | 'bareNumber' | 'splitVs' | 'timeline'
  | 'mediaRows' | 'quoteStack' | 'ringFeature' | 'waitVs'
  | 'triadSoft' | 'outroAir' | 'outroHost'
  // 5.0 数据版式
  | 'lineReveal' | 'barGlow' | 'rankBars' | 'waffle' | 'balance' | 'yearRing' | 'formulaCalc'
  // 5.0 旧6套存档（兼容，不默认推荐）
  | 'keywordCascade' | 'checklistFill' | 'vsScore' | 'tipStack' | 'numberedReveal' | 'kpiGrid'
  // 5.0 房产科普 MG（已定 9 种，mgEstate.tsx）
  | 'floorLadder' | 'paymentSplit' | 'amenityOrbit' | 'pitfallBoard'
  | 'priceStep' | 'decisionFork' | 'districtTags' | 'loanDial' | 'layerReveal'
  // 暖雾磨砂新增 17 款（5 + 12），进入选卡池，不替换上面的 26 款
  | 'ticketStub' | 'indexTabs' | 'amenityPins' | 'slashCompare' | 'archLight'
  | 'paymentCup' | 'loanCurve' | 'contractNote' | 'planSplit' | 'buildingSection'
  | 'pitfallLens' | 'parkingLines' | 'hexSteps' | 'inspectTags' | 'familyPlan'
  | 'policyNotes' | 'qaBubbles'
  // 5.1 小卡动态组合（5 款，src/cards51）：大卡拆成 2–4 张小卡错峰入场后停稳
  | 'dataCluster' | 'comparePair' | 'stepRail' | 'riskGroup' | 'noteGroup';

/** 5.0 新定版（玻璃v6 + 房产MG）：推荐/预览的唯一机器可读清单。 */
export const CORE_LAYOUTS = ['titleFloat','bareNumber','splitVs','timeline','mediaRows','ringFeature','waitVs','triadSoft','outroHost'] as const;
export const DATA_LAYOUTS = ['lineReveal','barGlow','rankBars','waffle','balance','yearRing','formulaCalc'] as const;
export const ESTATE_LAYOUTS = ['floorLadder','paymentSplit','amenityOrbit','priceStep','decisionFork','districtTags','loanDial','layerReveal'] as const;
export const ARCHIVE_LAYOUTS = ['keywordCascade','checklistFill','vsScore','tipStack','numberedReveal','kpiGrid'] as const;
export const DEFAULT_LAYOUTS: readonly LayoutName[] = [...CORE_LAYOUTS, ...DATA_LAYOUTS, ...ESTATE_LAYOUTS];
export const NEW_LAYOUTS = ['amenityPins','paymentCup','loanCurve','planSplit','pitfallLens','hexSteps','inspectTags','policyNotes','qaBubbles'] as const;
/** 5.1.1 退役：大卡里只塞文字、留白多、比例怪的版式。代码保留以便老仓库回看，但不进选卡池，镜头表里出现即 verify 失败。
 *  替代：想要「一张大卡」→ 用图框版式（mediaRows/ringFeature/splitVs/waitVs/bareNumber/planSplit）；想要「一组文字」→ 5.1 小卡组合（dataCluster/comparePair/stepRail/riskGroup/noteGroup）。 */
export const RETIRED_LAYOUTS = ['quoteStack','pitfallBoard','ticketStub','indexTabs','slashCompare','archLight','contractNote','buildingSection','parkingLines','familyPlan'] as const;
export const RETIRED_REPLACEMENT: Record<string, string> = {quoteStack: 'noteGroup', pitfallBoard: 'riskGroup', ticketStub: 'dataCluster', indexTabs: 'stepRail', slashCompare: 'comparePair',
  archLight: 'dataCluster', contractNote: 'riskGroup', buildingSection: 'floorLadder', parkingLines: 'noteGroup', familyPlan: 'dataCluster'};
/** 渲染用的旧新卡全集（含退役），只给 archetypes 的视图表用，不是选卡池。 */
export const NEW_LAYOUTS_ALL = ['ticketStub','indexTabs','amenityPins','slashCompare','archLight','paymentCup','loanCurve','contractNote','planSplit','buildingSection','pitfallLens','parkingLines','hexSteps','inspectTags','familyPlan','policyNotes','qaBubbles'] as const;
export const SMALL_LAYOUTS = ['dataCluster','comparePair','stepRail','riskGroup','noteGroup'] as const;
export const POOL_LAYOUTS: readonly LayoutName[] = [...DEFAULT_LAYOUTS, ...NEW_LAYOUTS, ...SMALL_LAYOUTS];
/** 5.1.1 卡面分类（每个选卡池版式必须登记）：
 *  image = 大卡里放图（图框/户型图/视频），文字只在小卡、标题条里；viz = 图表/仪表（大面板里是图形，不是整块文字）；
 *  small = 只有小卡（单卡面积 ≤ 12 万 px²）；none = 无卡面（裸数字/标签）；outro = 片尾。
 *  大卡 = 毛玻璃面板面积 > BIG_CARD_AREA。大卡必须是 image 或 viz 且内含图/图形，纯文字大卡 verify 直接失败。 */
export type CardClass = 'image' | 'viz' | 'small' | 'none' | 'outro';
export const BIG_CARD_AREA = 120000;
export const CARD_CLASS: Record<string, CardClass> = {
  titleFloat: 'image', bareNumber: 'image', splitVs: 'image', timeline: 'small', mediaRows: 'image', ringFeature: 'image', waitVs: 'image', triadSoft: 'small', outroHost: 'outro',
  lineReveal: 'viz', barGlow: 'viz', rankBars: 'viz', waffle: 'viz', balance: 'viz', yearRing: 'viz', formulaCalc: 'viz',
  floorLadder: 'small', paymentSplit: 'small', amenityOrbit: 'none', priceStep: 'small', decisionFork: 'small', districtTags: 'small', loanDial: 'viz', layerReveal: 'small',
  amenityPins: 'small', paymentCup: 'viz', loanCurve: 'small', planSplit: 'image', pitfallLens: 'small', hexSteps: 'small', inspectTags: 'small', policyNotes: 'small', qaBubbles: 'small',
  dataCluster: 'small', comparePair: 'small', stepRail: 'small', riskGroup: 'small', noteGroup: 'small',
};
/** 图框大卡版式：一期里最多用 3 次，其余镜头走小卡。 */
export const IMAGE_BIG_LAYOUTS: readonly string[] = Object.entries(CARD_CLASS).filter(([k, v]) => v === 'image' && k !== 'titleFloat' && k !== 'bareNumber').map(([k]) => k);
export const canonicalLayout = (name: string) => name === 'outroAir' ? 'outroHost' : name;
export const isDefaultLayout = (name: string) => DEFAULT_LAYOUTS.includes(canonicalLayout(name) as LayoutName);

/**
 * 各版式「独立 MG 组」矩形。规则：
 *  - 只用 rect/cols/splitRows，禁止手写坐标；
 *  - 独立组之间 ≥48px：左右相邻的组之间空出一整栏（≥154px），上下用 splitRows 默认 48；
 *  - 以 conn 开头的是连接件（箭头），只需 ≥24。
 */
export const layoutRects = (name: LayoutName, n = 3, opt: {character?: boolean; windows?: boolean} = {}): Record<string, Rect> => {
  switch (name) {
    case 'titleFloat': {
      const [mediaR, callR] = splitRows(ROWS.contentTop, CONTENT_H, [66, 34]);
      return {title: rect(0, 6, FULL), media: rect(7, 5, mediaR), callout: rect(7, 5, callR)};
    }
    case 'bareNumber':
      return {number: rect(0, 6, FULL), media: rect(7, 5, FULL)};
    case 'splitVs': {
      const [top, bot] = splitRows(ROWS.contentTop, CONTENT_H, [54, 46]);
      return {mediaL: rect(0, 5, top), mediaR: rect(7, 5, top), dataL: rect(0, 5, bot), dataR: rect(7, 5, bot),
        connArrow: rect(5, 2, {y: top.y + top.h / 2 - 20, h: 40})};
    }
    case 'timeline': {
      const [steps, lower] = splitRows(ROWS.contentTop, CONTENT_H, opt.windows ? [35, 65] : [70, 30]);
      return {steps: rect(0, 12, steps), [opt.windows ? 'windows' : 'note']: rect(0, 12, lower)};
    }
    case 'mediaRows':
      // 5.1.1：左图大卡（6 栏）+ 右侧 5 栏小行（每行 ≤172 高，面积 < 12 万）
      return {media: rect(0, 6, FULL), rows: rect(7, 5, {y: ROWS.contentTop + (CONTENT_H - Math.min(CONTENT_H, n * 172 + (n - 1) * 24)) / 2, h: Math.min(CONTENT_H, n * 172 + (n - 1) * 24)})};
    case 'quoteStack': {
      const [rows, warn] = splitRows(ROWS.contentTop, CONTENT_H, [74, 26]);
      return {quote: rect(0, 5, FULL), rows: rect(6, 6, rows), warn: rect(6, 6, warn)};
    }
    case 'ringFeature': {
      // 5.1.1：左图大卡 + 右侧环（viz）与一张 4 栏小卡
      return {media: rect(0, 6, FULL), ring: rect(7, 5, {y: ROWS.contentTop + 20, h: 300}), a: rect(7, 4, {y: ROWS.contentTop + 20 + 300 + 40, h: 215})};
    }
    case 'waitVs': {
      const [img, num] = splitRows(ROWS.contentTop, CONTENT_H, [50, 50]);
      return {mediaL: rect(0, 5, img), mediaR: rect(7, 5, img), numL: rect(0, 5, num), numR: rect(7, 5, num),
        connArrow: rect(5, 2, {y: num.y + 70, h: 40})};
    }
    case 'triadSoft': {
      // 5.1.1：三张 4 栏等宽小卡，高 210（面积 < 12 万），下面一条结论
      const top = {y: ROWS.contentTop + 80, h: 210}; const note = {y: ROWS.contentTop + 80 + 210 + 70, h: 110};
      return {c0: rect(0, 4, top), c1: rect(4, 4, top), c2: rect(8, 4, top), note: rect(0, 12, note)};
    }
    case 'outroAir':
    case 'outroHost': {
      // 片尾（5.1.1）：小滕在右侧安全区内（x≤1632，不压抖音按钮），头顶是对话气泡；文案在左 7 栏：标题字 + 小卡逐条弹出。character:false 时文案居中、无气泡
      const band = {y: ROWS.contentTop - 40, h: CONTENT_H + 40};
      return opt.character
        ? {character: {x: 1000, y: 250, w: 632, h: 830}, bubble: {x: 980, y: 92, w: 652, h: 132}, text: rect(0, 7, band)}
        : {text: rect(2, 8, band)};
    }
    // ===== 5.0 数据版式（尺寸「协调合理」：内容约占矩形 55–75%，不用空卡片）=====
    case 'lineReveal': return {chart: rect(0, 10, FULL)};
    case 'barGlow': return {chart: rect(1, 9, FULL)};
    case 'rankBars': return {chart: rect(0, 11, {y: ROWS.contentTop + 52, h: 520})};
    case 'waffle': return {chart: rect(0, 11, {y: ROWS.contentTop + 20, h: 580})};
    case 'balance': return {chart: rect(0, 12, FULL)};
    case 'yearRing': return {chart: rect(0, 12, {y: ROWS.contentTop + 12, h: 600})};
    case 'formulaCalc': return {chart: rect(1, 10, {y: ROWS.contentTop + 52, h: 560})};
    // ===== 5.0 MG 卡片扩展 =====
    case 'keywordCascade': return {cards: rect(0, 7, FULL), media: rect(8, 4, FULL)};
    case 'checklistFill': return {list: rect(0, 7, FULL), media: rect(8, 4, FULL)};
    case 'vsScore': return {board: rect(0, 12, FULL)};
    case 'tipStack': return {stack: rect(0, 7, FULL), media: rect(8, 4, FULL)};
    case 'numberedReveal': return {cards: rect(0, 12, FULL)};
    case 'kpiGrid': return {grid: rect(0, 8, FULL), media: rect(9, 3, FULL)};
    // ===== 5.0 房产科普 MG（已定 9 种）=====
    case 'floorLadder': return {ladder: rect(0, 12, FULL)};
    case 'paymentSplit': {
      // 5.1.1：总价小卡 + 占比条（viz），三张分项卡压到 224 高（面积 < 12 万），不留空
      return {total: rect(0, 12, {y: ROWS.contentTop + 30, h: 150}), parts: rect(0, 12, {y: ROWS.contentTop + 30 + 150 + 130, h: 224})};
    }
    case 'amenityOrbit': return {orbit: rect(0, 12, FULL)};
    case 'pitfallBoard': return {head: rect(0, 4, FULL), list: rect(5, 7, FULL)};
    case 'priceStep': return {steps: rect(0, 12, {y: ROWS.contentTop + 80, h: 400})};
    case 'decisionFork': {
      const q = {y: ROWS.contentTop + 10, h: 130}; const conn = {y: q.y + q.h + 24, h: 90}; const out = {y: conn.y + conn.h + 24, h: ROWS.contentBottom - (conn.y + conn.h + 24)};
      return {q: rect(3, 6, q), connFork: rect(0, 12, conn), L: rect(0, 5, out), R: rect(7, 5, out)};
    }
    case 'districtTags': return {cloud: rect(0, 9, FULL), legend: rect(10, 2, FULL)};
    case 'loanDial': return {dial: rect(0, 7, FULL), stats: rect(8, 4, FULL)};
    case 'layerReveal': return {layers: rect(0, 7, FULL), score: rect(8, 4, FULL)};
    case 'ticketStub': return {ticket: rect(1, 10, {y: ROWS.contentTop + 36, h: CONTENT_H - 72})};
    case 'indexTabs': {
      const [tabs, body] = splitRows(ROWS.contentTop, CONTENT_H, [22, 78]);
      return {tabs: rect(0, 12, tabs), body: rect(0, 12, body)};
    }
    case 'amenityPins': return {map: rect(0, 12, FULL)};
    case 'slashCompare': return {left: rect(0, 5, FULL), right: rect(7, 5, FULL), connBadge: rect(5, 2, {y: ROWS.contentTop + 236, h: 160})};
    case 'archLight': return {arch: rect(0, 7, FULL), notes: rect(8, 4, FULL)};
    case 'paymentCup': return {cup: rect(0, 5, FULL), stats: rect(6, 6, FULL)};
    case 'loanCurve': {
      const [path, cards] = splitRows(ROWS.contentTop, CONTENT_H, [34, 66], 56);
      return {path: rect(0, 12, path), cards: rect(0, 12, cards)};
    }
    case 'contractNote': return {doc: rect(0, 7, FULL), notes: rect(8, 4, FULL)};
    case 'planSplit': return {plan: rect(0, 7, FULL), stats: rect(8, 4, FULL)};
    case 'buildingSection': return {section: rect(0, 7, FULL), tags: rect(8, 4, FULL)};
    case 'pitfallLens': return {stage: rect(0, 12, FULL)};
    case 'parkingLines': return {lot: rect(0, 8, FULL), notes: rect(9, 3, FULL)};
    case 'hexSteps': return {board: rect(0, 12, FULL)};
    case 'inspectTags': return {rail: rect(0, 12, FULL)};
    case 'familyPlan': return {people: rect(0, 5, FULL), unit: rect(6, 6, FULL)};
    case 'policyNotes': return {wall: rect(1, 10, FULL)};
    // 5.1 小卡组合：每个矩形是一组小卡的落点；组间 ≥48，连接件 ≥24。
    case 'dataCluster': return {hero: rect(0, 3, {y: 268, h: 320}), connLink: rect(3, 1, {y: 268, h: 420}), items: rect(4, 6, {y: 268, h: 420}), pill: rect(0, 3, {y: 640, h: 72})};
    case 'comparePair': return {L: rect(1, 4, {y: 256, h: 368}), connVs: rect(5, 2, {y: 404, h: 72}), R: rect(7, 4, {y: 256, h: 368}), verdict: rect(3, 6, {y: 672, h: 72})};
    case 'stepRail': return {rail: rect(0, 12, {y: 280, h: 340})};
    case 'riskGroup': return {head: rect(0, 3, {y: 268, h: 320}), list: rect(4, 7, {y: 268, h: 360}), pill: rect(4, 5, {y: 676, h: 72})};
    case 'noteGroup': return {quote: rect(0, 4, {y: 268, h: 240}), connLink: rect(4, 1, {y: 268, h: 420}), notes: rect(5, 6, {y: 256, h: 432})};
    case 'qaBubbles': return {q: rect(0, 5, {y: ROWS.contentTop + 8, h: 280}), a: rect(6, 6, {y: ROWS.contentTop + 336, h: 280})};
    default:
      return {};
  }
};

export const titleRect = (): Rect => ({x: 96, y: ROWS.titleY, w: 1536, h: ROWS.titleH});
export const usesTitle = (name: LayoutName) =>
  name !== 'titleFloat' && name !== 'outroAir' && name !== 'outroHost' && name !== 'quoteStack';
