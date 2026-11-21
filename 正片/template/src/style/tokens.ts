import {getInputProps} from 'remotion';
export const COLOR = {
  ink: '#0E1420', graphite: '#1A2130', warm: '#F3F6FB', sub: 'rgba(226,233,243,0.80)',
  gold: '#5B9BFF', goldHi: '#9CC2FF', goldDeep: '#2F6BFF', coral: '#FF6B5E', green: '#2DD4BF', pearlInk: '#F5F8FC',
};
export const FONT = {title: 'PuHui', body: 'Health', num: "ArialB, Arial, 'Helvetica Neue', Helvetica, sans-serif"};
/** 字号 px @1920×1080。正文/说明 ≥34，标签/胶囊/序号/面积 ≥28，房间名 ≥30 */
export const TYPE = {
  kicker: 30, title: 80, heroTitle: 92, number: 150, quote: 60, rowTitle: 40, body: 34, label: 28, chip: 28, ringValue: 52, room: 30,
};
export const MIN_FONT = {any: 28, body: 34, label: 28, room: 30};
/** 排版规则（检查脚本强制） */
export const RULE = {
  mgGap: 48,        // 独立 MG 组之间最小间距
  innerGap: 24,     // 组内元素
  pad: 32,          // 卡片内边距 / 文字到卡边
  fillMax: 0.75,    // 文字宽 / 容器宽 上限
  lineHeight: 1.3,  // 多行文字最小行高倍数
  titleChars: 14,
  cardTitleChars: 8,
  bodyChars: 16,
  bodyLines: 2,
  chipChars: 6,
};
export const RADIUS = {card: 36, frame: 32, chip: 999, badge: 0.3};
/** 中景卡片的透视。整组共用一个平面，避免连线和卡边错开。 */
export const DEPTH = {perspective: 2400, rotateY: 5.5, rotateX: 1.5, cardYaw: 0, origin: '50% 56%'};
/** 5.0 新定版：遗留 spring 配置只作兼容，所有正片卡片使用下方有限单调入场。 */
export const SPRING = {
  enter: {damping: 26, stiffness: 150, mass: 0.78, overshootClamping: true},
  soft: {damping: 26, stiffness: 110, mass: 0.95, overshootClamping: true},
  snappy: {damping: 26, stiffness: 190, mass: 0.7, overshootClamping: true},
  cam: {damping: 26, stiffness: 90, mass: 1.1, overshootClamping: true},
};
export const MOTION = {enter: 16, stagger: 5, chip: 12, count: 32, focus: 12, freeze: 30, maxShift: 48};
export const GLASS_ENTER_FRAMES = {enter: 16, shaped: 18, soft: 20, chip: 12};
export type GlassEnterKind = keyof typeof GLASS_ENTER_FRAMES;
/** 有限时长 ease-out；范围严格 [0,1]，到位精确等于1，无过冲/回弹。异形卡用 quint，其余 cubic。 */
export const glassEnter = (frame: number, start = 0, kind: GlassEnterKind = 'enter', fps = 30) => {
  const t = Math.max(0, Math.min(1, (frame - start) / (GLASS_ENTER_FRAMES[kind] * fps / 30)));
  if (t === 1) return 1;
  const exp = kind === 'shaped' ? 5 : 3;
  return 1 - Math.pow(1 - t, exp);
};
/** 旧组件 spring 调用的稳定适配器；保留参数接口，不再调用物理弹簧。 */
export const steadySpring = ({frame, fps = 30, config = SPRING.enter}: {frame: number; fps?: number; config?: typeof SPRING.enter}) =>
  glassEnter(frame, 0, config === SPRING.soft ? 'soft' : config === SPRING.snappy ? 'chip' : 'enter', fps);

/** 5.1 卡片色板（科技简约）。三套可切换：inputProps.palette = inkBlue | graphiteIce | glacier。
 *  语义五色：paper=中性信息、navy=数据、tea=决策/可选、clay=风险、champ=重点结论。
 *  卡片文字颜色通过 CSS 变量下发（--ink/--sub/--acc…），同一子组件放进深卡或浅卡都自动可读。
 *  无颗粒、无扫光；层次来自微渐变 + 一条语义色描边，不用平涂色块。 */
export type FogTone = 'champ' | 'paper' | 'navy' | 'tea' | 'clay';
type ToneDef = {name: string; fill0: string; fill1: string; light: boolean; acc: string; accHi: string};
type PaletteDef = {id: string; name: string; tones: Record<FogTone, ToneDef>; primary: string};
const D = (name: string, fill0: string, fill1: string, acc: string, accHi: string): ToneDef => ({name, fill0, fill1, light: false, acc, accHi});
export const PALETTES: Record<string, PaletteDef> = {
  // A 墨蓝·电光：全部中深透明玻璃，冷静、统一；语义色只在描边/数字/图标上出现。
  inkBlue: {id: 'inkBlue', name: '墨蓝·电光', primary: '#5B9BFF', tones: {
    paper: D('石墨灰', 'rgba(72,80,98,0.70)', 'rgba(38,44,58,0.78)', '#B8C4D6', '#E2E8F1'),
    navy:  D('墨蓝·数据', 'rgba(44,70,120,0.72)', 'rgba(20,34,66,0.80)', '#5B9BFF', '#9CC2FF'),
    tea:   D('深青·决策', 'rgba(26,86,92,0.70)', 'rgba(14,46,56,0.80)', '#2DD4BF', '#8DEBDD'),
    clay:  D('酒红·风险', 'rgba(122,42,70,0.70)', 'rgba(62,22,46,0.80)', '#FF6B5E', '#FFA79C'),
    champ: D('暮紫·重点', 'rgba(66,58,116,0.72)', 'rgba(32,30,68,0.80)', '#9D8CFF', '#CBC1FF'),
  }},
  // B 石墨·冰灰：整套深色玻璃（5.1.1 起不再有浅色卡面，卡内一律浅色字），中性用冰灰石墨，其余沿用 A 的语义色。
  graphiteIce: {id: 'graphiteIce', name: '石墨·冰灰', primary: '#3B82F6', tones: {
    paper: D('冰灰石墨', 'rgba(92,102,122,0.72)', 'rgba(52,60,76,0.80)', '#C7D2E3', '#EAF0F8'),
    navy:  D('石墨·数据', 'rgba(56,62,76,0.78)', 'rgba(26,30,40,0.84)', '#5B9BFF', '#9CC2FF'),
    tea:   D('深青·决策', 'rgba(24,80,86,0.76)', 'rgba(12,42,50,0.84)', '#2DD4BF', '#8DEBDD'),
    clay:  D('酒红·风险', 'rgba(124,46,72,0.72)', 'rgba(64,26,48,0.80)', '#FF6B5E', '#FFA79C'),
    champ: D('靛紫·重点', 'rgba(58,52,108,0.78)', 'rgba(28,26,62,0.84)', '#9D8CFF', '#CBC1FF'),
  }},
  // C 冰川·钛蓝：偏亮的深色玻璃，适合偏暗的夜景/室内背景；同样只用浅色字。
  glacier: {id: 'glacier', name: '冰川·钛蓝', primary: '#2F6BFF', tones: {
    paper: D('冰钛', 'rgba(78,98,126,0.74)', 'rgba(44,58,80,0.82)', '#B8C8DE', '#E4ECF7'),
    navy:  D('冰蓝·数据', 'rgba(48,92,164,0.74)', 'rgba(26,52,104,0.82)', '#5B9BFF', '#9CC2FF'),
    tea:   D('冰青·决策', 'rgba(30,112,118,0.72)', 'rgba(18,66,78,0.82)', '#2DD4BF', '#8DEBDD'),
    clay:  D('雾红·风险', 'rgba(132,52,80,0.72)', 'rgba(70,30,56,0.82)', '#FF6B5E', '#FFA79C'),
    champ: D('薰衣·重点', 'rgba(82,74,150,0.74)', 'rgba(44,40,100,0.82)', '#9D8CFF', '#CBC1FF'),
  }},
};
const pickPalette = (): PaletteDef => {
  let id = 'inkBlue';
  try { const ip = (typeof window === 'undefined' ? {} : getInputProps()) as any; if (ip?.palette && PALETTES[ip.palette]) id = ip.palette; } catch {}
  return PALETTES[id];
};
export const PALETTE = pickPalette();
/** 表面明暗决定文字/线条色；语义色在深底用亮版、浅底用深版。 */
const SURF = {
  dark: {ink: '#F3F6FB', sub: 'rgba(230,237,247,0.92)', faint: 'rgba(214,226,242,0.78)', line: 'rgba(255,255,255,0.14)', track: 'rgba(255,255,255,0.14)', tick: 'rgba(226,233,243,0.5)', well: 'rgba(255,255,255,0.06)',
    blue: '#7FB2FF', teal: '#4FE0CC', red: '#FF8A7E', violet: '#B7A9FF', plat: '#D5DEEA', edge: 'rgba(214,228,255,0.26)', top: 'rgba(255,255,255,0.20)', hl: 'rgba(255,255,255,0.10)'},
};
/** 卡片 CSS 变量：子元素用 var(--ink) 等即可随卡片明暗切换。--c-gold 是「主强调」（原暖金的角色，现为本卡语义色）。 */
export const toneVars = (tone: FogTone): Record<string, string> => {
  const t = PALETTE.tones[tone], s = SURF.dark;
  const keyAcc = t.light ? t.accHi : t.accHi;
  return {'--ink': s.ink, '--sub': s.sub, '--faint': s.faint, '--line': s.line, '--track': s.track, '--tick': s.tick, '--well': s.well,
    '--acc': t.light ? t.accHi : t.acc, '--acc-hi': keyAcc, '--acc-raw': t.acc,
    '--c-gold': t.light ? t.accHi : t.accHi, '--c-blue': s.blue, '--c-green': s.teal, '--c-coral': s.red, '--c-violet': s.violet, '--c-plat': s.plat,
    '--edge': s.edge, '--top': s.top, '--hl': s.hl};
};
export const FOG = Object.fromEntries((Object.keys(PALETTE.tones) as FogTone[]).map((k) => {
  const t = PALETTE.tones[k];
  return [k, {name: t.name, fill0: t.fill0, fill1: t.fill1, ink: 'var(--ink)', inkHex: SURF.dark.ink, accent: 'var(--acc)', light: false, acc: t.acc}];
})) as Record<FogTone, {name: string; fill0: string; fill1: string; ink: string; inkHex: string; accent: string; light: boolean; acc: string}>;

export const FOG_GRAIN = 'none';
export const fogFill = (tone: FogTone = 'paper', lift = false) => {
  const p = FOG[tone];
  const bump = (rgba: string) => lift ? rgba.replace(/0\.\d+\)$/, (a) => `${Math.min(0.96, Number(a.slice(0, -1)) + 0.08)})`) : rgba;
  return `linear-gradient(160deg, ${bump(p.fill0)}, ${bump(p.fill1)})`;
};
/** 根默认（卡外元素、没有 tone 的旧调用）= 中性色调。 */
export const ROOT_VARS: Record<string, string> = (() => { const s = SURF.dark, a = PALETTE.primary;
  return {'--ink': s.ink, '--sub': s.sub, '--faint': s.faint, '--line': s.line, '--track': s.track, '--tick': s.tick, '--well': s.well,
    '--acc': a, '--acc-hi': '#9CC2FF', '--acc-raw': a, '--c-gold': '#9CC2FF', '--c-blue': s.blue, '--c-green': s.teal, '--c-coral': s.red, '--c-violet': s.violet, '--c-plat': s.plat,
    '--edge': s.edge, '--top': s.top, '--hl': s.hl}; })();
export const GLASS_V6 = {
  blur: 'blur(18px) saturate(1.15)',
  fill: fogFill('paper'),
  fillSoft: fogFill('paper'),
  surfaceHighlight: 'linear-gradient(150deg, var(--hl) 0%, rgba(255,255,255,0) 46%)',
  grain: 'none',
  hair: 'var(--edge)', rim: 'var(--edge)', mist: 'rgba(0,0,0,0)',
  top: 'var(--top)', bottom: 'rgba(8,12,20,0.16)',
  shadow: '0 10px 24px -8px rgba(6,10,18,0.32), 0 2px 6px rgba(6,10,18,0.14)',
  textShadow: 'none',
  ink: 'var(--ink)', sub: 'var(--sub)', faint: 'var(--faint)',
  gold: 'var(--c-gold)', goldFill: 'linear-gradient(90deg, var(--acc-hi), var(--acc-raw))', coral: 'var(--c-coral)', green: 'var(--c-green)', blue: 'var(--c-blue)',
  badge: {gold: 'var(--acc-raw)', coral: '#E5484D', green: '#0E9F94', blue: '#2F6BFF', none: '#475569'},
  line: 'var(--line)', track: 'var(--track)', tick: 'var(--tick)', well: 'var(--well)',
  // tint 仍作为「语义选择键」传给 glassMat，再映射到 tone。
  tint: {gold: 'tone:champ', coral: 'tone:clay', green: 'tone:tea', blue: 'tone:navy', none: 'tone:paper'},
  /** 语义浅染（用于高亮条、胶囊底），随卡片明暗自动取色。 */
  tintFill: {gold: 'color-mix(in srgb, var(--c-gold) 20%, transparent)', coral: 'color-mix(in srgb, var(--c-coral) 20%, transparent)', green: 'color-mix(in srgb, var(--c-green) 20%, transparent)', blue: 'color-mix(in srgb, var(--c-blue) 20%, transparent)', none: 'rgba(0,0,0,0)'},
  lift: 0.08,
};

/** FROST 是新默认；GLASS 仅为旧调用的兼容视图，dark/light 不再分成两套质感。 */
export const FROST = GLASS_V6;
const classic = {fill: GLASS_V6.fill, hair: GLASS_V6.hair, top: GLASS_V6.top};
export const GLASS = {
  ...GLASS_V6, sheen: GLASS_V6.surfaceHighlight, dark: classic, light: classic,
};

/** 5.1 标题/字幕强调色（替代原暖金）：冰银蓝。深底用浅冰蓝，亮底用沉稳钴蓝。不发光、不霓虹。 */
export const HILITE = {dark: '#BCD6FF', bright: '#1F56C4'}; // bright 仅作历史令牌保留；5.1.1 起正片文字一律用 dark（冰蓝），不再有深色字

/** 5.1.4 小卡统一字阶（px @1920×1080）。按卡高分 S/M/L，由 Tile 的 size 下发。
 *  标题/数值/标签/说明只能取本表；字与玻璃更贴合（略收边距、略抬标题），保持可读（标签/说明 ≥28，行高 ≥1.25）。禁止手写其他字号。 */
export const CARD_SIZE = {S: {maxH: 116}, M: {maxH: 200}, L: {maxH: 380}} as const;
export type CardSize = keyof typeof CARD_SIZE;
export const CARD_TYPE: Record<CardSize, {title: number; value: number; label: number; caption: number; padX: number; padY: number; gap: number; lh: number; icon: number; radius: number}> = {
  S: {title: 38, value: 48, label: 28, caption: 28, padX: 20, padY: 12, gap: 6, lh: 1.28, icon: 44, radius: 18},
  M: {title: 44, value: 68, label: 28, caption: 30, padX: 24, padY: 16, gap: 8, lh: 1.28, icon: 52, radius: 22},
  L: {title: 54, value: 112, label: 30, caption: 34, padX: 30, padY: 22, gap: 10, lh: 1.25, icon: 64, radius: 26},
};
/** 字阶里所有允许的字号（DOM 检查：小卡内文字 font-size 必须落在所属档位的取值里）。 */
export const CARD_TYPE_SIZES = (s: CardSize) => [...new Set(Object.values(CARD_TYPE[s]).slice(0, 4))];
/** 禁止出现在卡面/正文上的「近黑」文字色：相对亮度 < 0.18 视为近黑。检查脚本据此扫源码与 DOM。 */
export const NEAR_BLACK_L = 0.18;

/** 5.1.4 图表字阶（px @1920×1080）：数值标签 / 重点数值 / 类目标签 / 刻度 / 单位。图表一律放在深色玻璃面板（data-viz）内，直接标数值。 */
export const CHART_TYPE = {value: 80, valueKey: 104, label: 40, tick: 28, unit: 34, rowValue: 56, rowValueKey: 72};
/** 图表配色（深色面板上）：普通柱/点用中性冰灰，重点用冰蓝 HILITE。 */
export const CHART_INK = {bar: 'rgba(196,212,236,0.62)', barTop: 'rgba(236,242,250,0.9)', axis: 'rgba(236,242,250,0.78)', grid: 'rgba(236,242,250,0.14)', key: '#BCD6FF', keyDeep: '#6FA2F5', line: '#8DB8FF'};

/** 5.1.4 卡片连线：冰蓝/银芯 + 柔光bloom 的光影线，略粗于旧白线，但不是霓虹管。颜色只在本令牌定义。 */
export const TRAIL = {
  coreW: 4.5, glowW: 13, bloomW: 26,
  core: 'rgba(236,244,255,0.96)', mid: 'rgba(157,196,255,0.62)', bloom: 'rgba(91,155,255,0.28)',
  tip: '#9CC2FF', tipRing: 'rgba(156,194,255,0.85)',
};
/** 5.1.4 分层入场：玻璃 → 饰线 → 图标 → 标题 → 说明，相对卡入场起点的帧延迟。全部单调 0→1，禁止先降后升。 */
export const LAYER = {glass: 0, ornament: 3, icon: 5, title: 7, sub: 10} as const;
export type LayerName = keyof typeof LAYER;
export const layerEnter = (frame: number, start: number, layer: LayerName, kind: GlassEnterKind = 'chip') =>
  glassEnter(frame, start + LAYER[layer], kind);
/** 5.1.5 饰线（同心内光缝）色：左上亮 → 右下几乎透明；光弧 = 冰蓝高亮。mask 用纯白/纯黑只作遮罩，不上屏。 */
export const SEAM = {hi: 'rgba(236,244,255,0.58)', mid: 'rgba(214,228,255,0.16)', lo: 'rgba(214,228,255,0.04)', tail: 'rgba(157,196,255,0.20)', arc: '#BCD6FF', glow: '#5B9BFF', maskOn: '#fff', maskOff: '#000'};
/** 5.1.5 图片组件图框：深底、细冰边、景深投影、底部压暗渐变（保护说明卡可读）。 */
export const IMG_FRAME = {bg: '#0c1220', edge: 'rgba(214,228,255,.22)', shadow: 'rgba(4,10,22,.55)', cutShadow: 'rgba(4,10,22,.5)', fade0: 'rgba(8,14,28,0)', fade1: 'rgba(8,14,28,.42)', capFade: 'rgba(14,20,34,0.55)'};
