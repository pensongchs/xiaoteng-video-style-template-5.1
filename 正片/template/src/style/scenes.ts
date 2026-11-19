/** 17 款新卡的停稳几何。组件和检查读同一份坐标。 */
import {layoutRects, type LayoutName} from './layouts.ts';
import {cubic, rectPoly, roundPoly, type Box, type Pt} from './geom.ts';
import type {FogTone} from './tokens.ts';
import {PLAN_ASSET} from './floorplans.ts';

export type TextRun = {text: string; size: number; role: 'title' | 'body' | 'label' | 'room' | 'num'; box: Box; align?: 'left' | 'center'};
export type CardGeom = {id: string; poly: Pt[]; tone: FogTone; texts: TextRun[]; marks?: Box[]; visual?: {kind: string; box: Box; src?:string}};
export type LineGeom = {id: string; pts: Pt[]; width: number; anchor: 'both' | 'start' | 'end' | 'none'; kind: 'connector' | 'diagram'; color?: string; dot?: boolean; d?: string; beat?:number; fromCard?:string; toCard?:string};
export type Scene = {cards: CardGeom[]; lines: LineGeom[]; planAsset?: string};

const box = (x: number, y: number, w: number, h: number): Box => ({x, y, w, h});
const card = (id: string, b: Box, tone: FogTone, texts: TextRun[]): CardGeom => ({id, poly: rectPoly(b), tone, texts});
const T = (text: string, size: number, role: TextRun['role'], b: Box, align: TextRun['align'] = 'left'): TextRun => ({text, size, role, box: b, align});
const inset = (b: Box, p = 32): Box => ({x: b.x + p, y: b.y + p, w: b.w - p * 2, h: b.h - p * 2});

const hexPoly = (b: Box): Pt[] => {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, rx = b.w / 2, ry = b.h / 2;
  return [[cx - rx * 0.5, cy - ry], [cx + rx * 0.5, cy - ry], [cx + rx, cy], [cx + rx * 0.5, cy + ry], [cx - rx * 0.5, cy + ry], [cx - rx, cy]];
};
const circlePoly = (cx: number, cy: number, r: number, n = 28): Pt[] =>
  Array.from({length: n}, (_, i) => {
    const a = (Math.PI * 2 * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
const archPoly = (b: Box): Pt[] => {
  const pts: Pt[] = [[b.x, b.y + b.h], [b.x + b.w, b.y + b.h]];
  const cx = b.x + b.w / 2, rad = b.w / 2, top = b.y + rad;
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * i / 16;
    pts.push([cx + Math.cos(a) * rad, top - Math.sin(a) * rad]);
  }
  return pts;
};
const slashPoly = (b: Box, side: 'left' | 'right'): Pt[] => {
  const cut = b.w * 0.14;
  return side === 'left'
    ? [[b.x, b.y], [b.x + b.w - cut, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]]
    : [[b.x + cut, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
};

const along = (b: Box, n: number, gap: number, vertical = false): Box[] => {
  if (vertical) {
    const h = (b.h - gap * (n - 1)) / n;
    return Array.from({length: n}, (_, i) => box(b.x, b.y + i * (h + gap), b.w, h));
  }
  const w = (b.w - gap * (n - 1)) / n;
  return Array.from({length: n}, (_, i) => box(b.x + i * (w + gap), b.y, w, b.h));
};

export const HEX_STEPS = [
  {k: '查额度', a: '看缴存基数', b: '和缴存年限'},
  {k: '选方式', a: '纯公积金', b: '或组合贷'},
  {k: '交材料', a: '身份证明', b: '收入证明'},
  {k: '等审批', a: '审批通过', b: '银行放款'},
];
export const CURVE_STEPS = [
  {k: '网签', s: '签合同'}, {k: '面签', s: '银行见面'}, {k: '批贷', s: '等审批'}, {k: '抵押登记', s: '办手续'}, {k: '放款', s: '钱到卖方'},
];

const scenes: Record<string, () => Scene> = {
  ticketStub: () => {
    const r = layoutRects('ticketStub').ticket;
    const stubW = 420;
    const main = box(r.x, r.y, r.w - stubW - 28, r.h);
    const stub = box(main.x + main.w + 28, r.y, stubW, r.h);
    const inner = inset(main);
    return {cards: [
      card('main', main, 'champ', [
        T('购房杂费', 40, 'title', box(inner.x, inner.y, inner.w, 52)),
        T('契税 1%–3%', 34, 'body', box(inner.x, inner.y + 80, inner.w, 46)),
        T('中介费 看合同', 34, 'body', box(inner.x, inner.y + 136, inner.w, 46)),
        T('维修金 按面积', 34, 'body', box(inner.x, inner.y + 192, inner.w, 46)),
      ]),
      card('stub', stub, 'clay', [
        T('合计', 28, 'label', box(stub.x + 32, stub.y + 48, stub.w - 64, 36)),
        T('3–5%', 72, 'num', box(stub.x + 24, stub.y + 110, stub.w - 48, 90)),
        T('示例', 28, 'label', box(stub.x + 32, stub.y + stub.h - 80, stub.w - 64, 36)),
      ]),
    ], lines: []};
  },
  indexTabs: () => {
    const R = layoutRects('indexTabs');
    const tabs = along(R.tabs, 3, 36);
    const body = R.body;
    const inner = inset(body);
    return {cards: [
      ...tabs.map((b, i) => card('tab' + i, b, i === 2 ? 'champ' : 'paper', [T(['看小区', '看楼栋', '看户型'][i], 34, 'body', inset(b, 16))])),
      card('body', body, 'paper', [
        T('南北通透', 34, 'body', box(inner.x, inner.y, inner.w, 48)),
        T('动静分区', 34, 'body', box(inner.x, inner.y + 64, inner.w, 48)),
        T('方正实用', 34, 'body', box(inner.x, inner.y + 128, inner.w, 48)),
        T('3/3', 28, 'label', box(inner.x + inner.w - 120, inner.y + 200, 88, 36)),
      ]),
    ], lines: []};
  },
  amenityPins: () => {
    const map = layoutRects('amenityPins').map;
    const ring = box(map.x + 24, map.y + 36, 360, 292);
    const labels = [box(980, 300, 540, 130), box(860, 490, 540, 130), box(1080, 680, 540, 130)];
    const names = ['地铁站 步行8分', '小学 过马路', '公园 300米'];
    const root:Pt=[ring.x+ring.w+6,ring.y+ring.h/2],spineX=760;
    const centers=labels.map(b=>b.y+b.h/2);
    const lines:LineGeom[]=labels.map((b,i)=>{const target:Pt=[b.x-6,centers[i]],dy=centers[i]-root[1],sign=dy>=0?1:-1,r=16;
      const d=Math.abs(dy)<32?`M${root[0]},${root[1]} H${target[0]}`:`M${root[0]},${root[1]} H${spineX-r} Q${spineX},${root[1]} ${spineX},${root[1]+sign*r} V${target[1]-sign*r} Q${spineX},${target[1]} ${spineX+r},${target[1]} H${target[0]}`;
      return {id:'pin'+i,kind:'connector',width:3,anchor:'both',pts:[[...root],[spineX,root[1]],[spineX,target[1]],[...target]],d,fromCard:'ring',toCard:'lab'+i,dot:true};
    });
    return {cards: [
      card('ring', ring, 'tea', [T('15分钟', 72, 'num', box(ring.x + 20, ring.y + 50, ring.w - 40, 100)), T('步行可达', 28, 'label', box(ring.x + 32, ring.y + 164, ring.w - 64, 40))]),
      ...labels.map((b, i) => card('lab' + i, b, 'tea', [T(names[i], 34, 'body', inset(b, 28))])),
    ], lines};
  },
  slashCompare: () => {
    const R = layoutRects('slashCompare');
    const left = rectPoly(R.left), right = rectPoly(R.right);
    const safeL = box(R.left.x + 36, R.left.y + 48, R.left.w * 0.72, R.left.h - 96);
    const safeR = box(R.right.x + R.right.w * 0.2, R.right.y + 48, R.right.w * 0.72, R.right.h - 96);
    const badge = box(R.connBadge.x + 48, R.connBadge.y + 20, R.connBadge.w - 96, R.connBadge.h - 40);
    return {cards: [
      {id: 'L', poly: left, tone: 'navy', texts: [T('新房', 40, 'title', box(safeL.x, safeL.y, safeL.w, 52)), T('多数等交付', 34, 'body', box(safeL.x, safeL.y + 80, safeL.w, 48)), T('看样板间', 34, 'body', box(safeL.x, safeL.y + 140, safeL.w, 48))]},
      {id: 'R', poly: right, tone: 'clay', texts: [T('二手房', 40, 'title', box(safeR.x, safeR.y, safeR.w, 52)), T('过户后入住', 34, 'body', box(safeR.x, safeR.y + 80, safeR.w, 48)), T('看实房实景', 34, 'body', box(safeR.x, safeR.y + 140, safeR.w, 48))]},
    ], lines: []};
  },
  archLight: () => {
    const R = layoutRects('archLight');
    const a = R.arch;
    const arcTop = a.y + 36;
    const rad = (a.w - 48) / 2;
    const notes = along(inset(R.notes, 8), 3, 24, true);
    const labels = ['朝南优先', '西晒遮阳', '楼距靠前'];
    return {cards: [
      {id: 'arch', poly: archPoly(box(a.x + 24, arcTop, a.w - 48, a.h - 48)), tone: 'champ', texts: [
        T('5.0小时', 72, 'num', box(a.x + 80, a.y + a.h - 160, a.w - 160, 80)),
        T('冬至示例', 28, 'label', box(a.x + 80, a.y + a.h - 70, a.w - 160, 36)),
      ]},
      ...notes.map((b, i) => card('n' + i, b, 'tea', [T(labels[i], 34, 'body', inset(b, 20))])),
    ], lines: []};
  },
  paymentCup: () => {
    const R = layoutRects('paymentCup');
    const c = R.cup;
    const topW = c.w * 0.78, botW = c.w * 0.5;
    const topY = c.y + 28, botY = c.y + c.h - 28;
    const cx = c.x + c.w / 2;
    const poly: Pt[] = [[cx - topW / 2, topY], [cx + topW / 2, topY], [cx + botW / 2, botY], [cx - botW / 2, botY]];
    const rowH = 150, rowGap = 28, y0 = R.stats.y + (R.stats.h - (rowH * 3 + rowGap * 2)) / 2;
    const rows = [0, 1, 2].map((i) => box(R.stats.x + 24, y0 + i * (rowH + rowGap), 700, rowH));
    const items = [{k: '月供', v: '32%'}, {k: '日常开销', v: '43%'}, {k: '存下来', v: '25%'}];
    const tickY = topY + (botY - topY) * 0.67;
    const tick = box(cx - 70, tickY - 3, 120, 8);
    return {cards: [
      {id: 'cup', poly, tone: 'tea', marks: [tick], texts: [T('1/3 参考', 28, 'label', box(tick.x + tick.w + 24, tickY - 16, 150, 34))]},
      ...rows.map((b, i) => {
        const inn = inset(b, 28);
        return card('row' + i, b, i === 1 ? 'tea' : 'champ', [
          T(items[i].k, 34, 'body', box(inn.x, inn.y + 20, inn.w * 0.46, 48)),
          T(items[i].v, 72, 'num', box(inn.x + inn.w * 0.5, inn.y - 6, inn.w * 0.46, 100)),
        ]);
      }),
    ], lines: []};
  },
  loanCurve: () => {
    // 弯道作主线，卡片交替落在路的上湾 / 下湾，短弧引线接到近边。不要改回五卡一排的长引线。
    const below = [true, false, true, false, true];
    const nodes: Pt[] = [[236, 620], [550, 480], [864, 610], [1178, 488], [1492, 600]];
    const cw = 280, ch = 200, lead = 32;
    const cardsB = nodes.map((n, i) => below[i]
      ? box(n[0] - cw / 2, n[1] + lead, cw, ch)
      : box(n[0] - cw / 2, n[1] - lead - ch, cw, ch));
    const roadPts: Pt[] = [];
    let roadD = `M ${nodes[0][0]} ${nodes[0][1]}`;
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const c1: Pt = [a[0] + (b[0] - a[0]) * 0.45, a[1]];
      const c2: Pt = [b[0] - (b[0] - a[0]) * 0.45, b[1]];
      roadD += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${b[0]} ${b[1]}`;
      const seg = cubic(a, c1, c2, b, 5);
      roadPts.push(...(i ? seg.slice(1) : seg));
    }
    const leaders: LineGeom[] = cardsB.map((b, i) => {
      const n = nodes[i];
      const edgeY = below[i] ? b.y - 4 : b.y + b.h + 4;
      const end: Pt = [n[0], edgeY];
      const bow = below[i] ? 20 : -20;
      const c1: Pt = [n[0] + bow, n[1] + (end[1] - n[1]) * 0.42];
      const c2: Pt = [n[0] + bow * 0.35, end[1] - Math.sign(end[1] - n[1]) * 8];
      return {id: 'stem' + i, kind: 'connector' as const, width: 4, anchor: 'end' as const, color: '#8DB8FF', dot: false,
        pts: cubic(n, c1, c2, end, 4), d: `M ${n[0]} ${n[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${end[0]} ${end[1]}`};
    });
    return {cards: cardsB.map((b, i) => {
      const inn = inset(b, 26);
      return card('c' + i, b, i % 2 ? 'tea' : 'paper', [
        T(String(i + 1).padStart(2, '0'), 32, 'label', box(b.x + (b.w - 76) / 2, inn.y, 76, 40), 'center'),
        T(CURVE_STEPS[i].k, 40, 'title', box(inn.x, inn.y + 50, inn.w, 52), 'center'),
        T(CURVE_STEPS[i].s, 34, 'body', box(inn.x, inn.y + 112, inn.w, 46), 'center'),
      ]);
    }), lines: [
      {id: 'path', kind: 'diagram', width: 16, anchor: 'none', color: '#6FA2F5', dot: false, pts: roadPts, d: roadD},
      ...leaders,
    ]};
  },
  contractNote: () => {
    const R = layoutRects('contractNote');
    const doc = inset(R.doc, 8);
    const notes = along(inset(R.notes, 4), 3, 28, true);
    const labels = ['交房日期', '违约责任', '贷款条款'];
    return {cards: [
      card('doc', doc, 'paper', [T('合同里先看这三处', 34, 'body', box(doc.x + 32, doc.y + 36, doc.w - 64, 80))]),
      ...notes.map((b, i) => card('n' + i, b, 'navy', [T(labels[i], 34, 'body', inset(b, 24))])),
    ], lines: notes.map((b, i) => ({id: 'c' + i, kind: 'connector' as const, width: 4, anchor: 'both' as const, pts: [[doc.x + doc.w + 3, b.y + b.h / 2], [b.x - 3, b.y + b.h / 2]] as Pt[]}))};
  },
  planSplit: () => {
    // 5.1.1：大卡 = 户型图素材（图框，见 mgNew.PlanFrame）；文字全部在右侧三张小卡里。
    const slot = layoutRects('planSplit').stats, h = 140, gap = 24;
    const rows: [string, string, FogTone][] = [['套内面积', `约 ${PLAN_ASSET.netM2}㎡`, 'navy'], ['南北通透', '采光通风好', 'tea'], ['入户动线', '直通客厅', 'navy']];
    return {planAsset: PLAN_ASSET.src, cards: rows.map(([k, v, tone], i) => {
      const b = box(slot.x, slot.y + 24 + i * (h + gap), slot.w, h), s = inset(b, 24);
      return card('s' + i, b, tone, [T(k, 28, 'label', box(s.x, s.y - 6, s.w, 36)), T(v, 40, 'title', box(s.x, s.y + 34, s.w, 52))]);
    }), lines: []};
  },
  buildingSection: () => {
    const R = layoutRects('buildingSection');
    const tags = along(inset(R.tags, 4), 3, 36, true);
    const names = [
      {k: '顶部几层', s: '晒得多要隔热'},
      {k: '中间几层', s: '光线和安静均衡'},
      {k: '底部几层', s: '离车流近看遮挡'},
    ];
    const tower = box(R.section.x + 36, R.section.y + 16, 720, R.section.h - 32);
    return {cards: tags.map((b, i) => {
      const inn = inset(b, 24);
      return card('f' + i, b, i === 2 ? 'tea' : 'paper', [
        T(names[i].k, 34, 'body', box(inn.x, inn.y + 8, inn.w, 44)),
        T(names[i].s, 34, 'body', box(inn.x, inn.y + 56, inn.w, 44)),
      ]);
    }), lines: tags.map((b, i) => ({
      id: 'f' + i, kind: 'connector' as const, width: 4, anchor: 'end' as const,
      pts: [[tower.x + tower.w + 4, b.y + b.h / 2], [b.x - 3, b.y + b.h / 2]] as Pt[],
    }))};
  },
  pitfallLens: () => {
    const stage = layoutRects('pitfallLens').stage;
    const cx = stage.x + 460, cy = stage.y + stage.h / 2, rad = 150;
    const calls = [box(980, 300, 480, 140), box(980, 480, 480, 140), box(980, 660, 480, 140)];
    const words = ['窗角水渍', '空鼓轻敲', '下水试水'];
    const poly = circlePoly(cx, cy, rad);
    return {cards: [
      {id: 'lens', poly, tone: 'clay', texts: [T('放大看', 34, 'body', box(cx - 70, cy - 24, 140, 48))]},
      ...calls.map((b, i) => card('c' + i, b, 'paper', [T(words[i], 34, 'body', inset(b, 28))])),
    ], lines: calls.map((b, i) => {
      const ty = b.y + b.h / 2;
      const ang = Math.atan2(ty - cy, (b.x - 3) - cx);
      return {id: 'l' + i, kind: 'connector' as const, width: 4, anchor: 'both' as const, pts: [[cx + Math.cos(ang) * (rad + 3), cy + Math.sin(ang) * (rad + 3)], [b.x - 3, ty]] as Pt[]};
    })};
  },
  parkingLines: () => {
    const R = layoutRects('parkingLines');
    const lot = inset(R.lot, 16);
    const notes = along(inset(R.notes, 6), 3, 24, true);
    const words = ['车位 1:0.8', '先看归属', '再问租金'];
    const bays: LineGeom[] = [0, 1, 2, 3].map((i) => ({
      id: 'bay' + i, kind: 'diagram', width: 4, anchor: 'none',
      pts: [[lot.x + 40 + i * 150, lot.y + 80], [lot.x + 40 + i * 150, lot.y + lot.h - 80]] as Pt[],
    }));
    return {cards: notes.map((b, i) => card('n' + i, b, 'tea', [T(words[i], 34, 'body', inset(b, 16))])), lines: bays};
  },
  hexSteps: () => {
    const cells=[0,1,2,3].map(i=>box(108+i*388,366,330,314));
    const lines:LineGeom[]=cells.slice(0,3).map((a,i)=>{
      const b=cells[i+1],y=a.y+a.h/2,from:Pt=[a.x+a.w+6,y],to:Pt=[b.x-6,y];
      return {id:'flow'+i,kind:'connector',width:3,anchor:'both',beat:i+1,fromCard:'hex'+i,toCard:'hex'+(i+1),pts:cubic(from,[from[0]+8,y],[to[0]-8,y],to,2),dot:true};
    });
    return {cards:cells.map((b,i)=>card('hex'+i,b,i%2?'navy':'paper',[
      T(String(i+1).padStart(2,'0'),32,'label',box(b.x+b.w/2-40,b.y-42,80,40),'center'),
      T(HEX_STEPS[i].k,44,'title',box(b.x+44,b.y+62,b.w-88,58),'center'),
      T(HEX_STEPS[i].a,34,'body',box(b.x+44,b.y+144,b.w-88,46),'center'),
      T(HEX_STEPS[i].b,34,'body',box(b.x+44,b.y+208,b.w-88,46),'center'),
    ])),lines};
  },
  inspectTags: () => {
    const rail = layoutRects('inspectTags').rail;
    const tags = along(box(rail.x, rail.y + 150, rail.w, 300), 4, 40);
    const words = ['窗边', '墙角', '地漏', '插座'];
    const subs = ['看水渍', '看空鼓', '放水试', '逐个试'];
    return {cards: tags.map((b, i) => card('tag' + i, b, 'clay', [
      T(words[i], 40, 'title', box(b.x + 28, b.y + 36, b.w - 56, 52)),
      T(subs[i], 34, 'body', box(b.x + 28, b.y + 110, b.w - 56, 48)),
    ])), lines: tags.map((b, i) => ({id: 'str' + i, kind: 'connector' as const, width: 3, anchor: 'end' as const, pts: [[b.x + b.w / 2, rail.y + 36], [b.x + b.w / 2, b.y - 3]] as Pt[]}))};
  },
  familyPlan: () => {
    const people = box(108, 340, 600, 440);
    const adult = {w: 116, h: 200}, child = {w: 84, h: 136}, gap = 24;
    const rowW = adult.w * 3 + child.w + gap * 3;
    const figX = people.x + (people.w - rowW) / 2;
    const feet = 654;
    const marks = [
      box(figX, feet - adult.h, adult.w, adult.h),
      box(figX + adult.w + gap, feet - adult.h, adult.w, adult.h),
      box(figX + (adult.w + gap) * 2, feet - child.h, child.w, child.h),
      box(figX + (adult.w + gap) * 2 + child.w + gap, feet - adult.h, adult.w, adult.h),
    ];
    const peak: Pt = [1265, 318];
    const housePoly: Pt[] = [peak, [1590, 426], [1590, 808], [940, 808], [940, 426]];
    const chips = [0, 1, 2].map((i) => box(1024 + i * 176, 458, 156, 56));
    const rooms = ['主卧', '儿童房', '老人房'];
    const from: Pt = [712, 560];
    const to: Pt = [936, 588];
    const c1: Pt = [790, 536];
    const c2: Pt = [860, 608];
    return {cards: [
      {id: 'people', poly: rectPoly(people), tone: 'champ', marks, texts: [
        T('家里常住', 40, 'title', box(148, 372, 520, 54), 'center'),
        T('2大1小+1位老人', 34, 'body', box(148, 682, 520, 48), 'center'),
      ]},
      {id: 'house', poly: roundPoly(housePoly, 28, 4), tone: 'tea', texts: [
        ...chips.map((b, i) => T(rooms[i], 32, 'room', b, 'center')),
        T('3', 96, 'num', box(1088, 548, 120, 112), 'center'),
        T('室起步', 44, 'title', box(1220, 598, 220, 58), 'center'),
        T('老人房尽量靠近卫生间', 34, 'body', box(985, 694, 560, 48), 'center'),
      ]},
    ], lines: [{id: 'toHouse', kind: 'connector', width: 4, anchor: 'both', color: '#8DB8FF', dot: false,
      pts: cubic(from, c1, c2, to, 4), d: `M ${from[0]} ${from[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${to[0]} ${to[1]}`}]};
  },
  policyNotes: () => {
    const wall = layoutRects('policyNotes').wall;
    const notes = [box(wall.x, wall.y + 48, 500, 150), box(wall.x + 534, wall.y + 112, 500, 150), box(wall.x + 180, wall.y + 340, 540, 150)];
    const words = ['认定看材料', '限购先问清', '资格以当地为准'];
    return {cards: notes.map((b, i) => card('note' + i, b, i === 2 ? 'navy' : 'paper', [
      T(words[i], 40, 'title', box(b.x + 36, b.y + 48, b.w - 72, 54), 'center'),
    ])), lines: []};
  },
  qaBubbles: () => {
    const q = box(120, 286, 500, 220);
    const a = box(1000, 614, 540, 220);
    const from: Pt = [q.x + q.w + 4, q.y + q.h / 2];
    const to: Pt = [a.x - 4, a.y + a.h / 2];
    const c1: Pt = [from[0] + 90, from[1] + 20];
    const c2: Pt = [to[0] - 90, to[1] - 20];
    return {cards: [
      card('q', q, 'navy', [
        T('顶楼能买吗', 44, 'title', box(q.x + 40, q.y + 48, q.w - 80, 58), 'center'),
        T('先看防水隔热', 34, 'body', box(q.x + 40, q.y + 122, q.w - 80, 48), 'center'),
      ]),
      card('a', a, 'champ', [
        T('能买要核验', 44, 'title', box(a.x + 40, a.y + 48, a.w - 80, 58), 'center'),
        T('夏天去现场', 34, 'body', box(a.x + 40, a.y + 122, a.w - 80, 48), 'center'),
      ]),
    ], lines: [{id: 'qa', kind: 'connector', width: 4, anchor: 'both', color: '#8DB8FF', dot: false,
      pts: cubic(from, c1, c2, to, 4), d: `M ${from[0]} ${from[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${to[0]} ${to[1]}`}]};
  },
};

export type SceneData = {sceneText?:Record<string,string[]>;sceneAlign?:Record<string,'left'|'center'>;sceneTone?:Record<string,FogTone>;cardVisual?:Record<string,string>;cardCutout?:Record<string,string>;cardVisualBox?:Record<string,Box>};
export const sceneOf = (name: LayoutName | string, data?: SceneData): Scene => {
 const scene=(scenes[name]??scenes.ticketStub)();
 if(!data)return scene;
 return {...scene,cards:scene.cards.map(c=>{
  const xs=c.poly.map(p=>p[0]),ys=c.poly.map(p=>p[1]);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
  let texts=c.texts.map((t,i)=>({...t,text:data.sceneText?.[c.id]?.[i]??t.text,align:data.sceneAlign?.[c.id]??t.align}));
  let visual:CardGeom['visual'];let tone=data.sceneTone?.[c.id]??c.tone;
  const place=(i:number,xx:number,yy:number,ww:number,hh:number,size:number,align:'left'|'center'='left')=>{if(texts[i])texts[i]={...texts[i],box:box(xx,yy,ww,hh),size,align};};
  if(name==='slashCompare'&&c.id!=='vs'){
   tone=c.id==='L'?'paper':'navy';visual={kind:data.cardVisual?.[c.id]??(c.id==='L'?'search':'cross'),box:box(x+w*.18,y+62,w*.64,240)};
   texts.forEach((t,i)=>place(i,x+w*.14,y+h*.60+i*82,w*.72,76,i===0?56:38,'center'));
  }
  if(name==='ticketStub'&&c.id==='main'){
   tone='paper';place(0,x+42,y+42,w-84,80,54);
   for(let i=1;i<texts.length;i++)place(i,x+42,y+166+(i-1)*100,w-300,64,38);
   visual={kind:data.cardVisual?.[c.id]??'wallet',box:box(x+w-216,y+140,176,200)};
  }
  if(name==='ticketStub'&&c.id==='stub'){
   tone='champ';place(0,x+34,y+44,w-68,50,36,'center');place(1,x+28,y+330,w-56,80,54,'center');place(2,x+34,y+426,w-68,50,36,'center');
   visual={kind:data.cardVisual?.[c.id]??'shield',box:box(x+86,y+120,w-172,182)};
  }
  if(name==='qaBubbles'){
   tone=c.id==='q'?'navy':'paper';texts.forEach((t,i)=>place(i,x+30,y+38+i*86,w-194,64,i===0?46:36,'center'));
   visual={kind:data.cardVisual?.[c.id]??(c.id==='q'?'wallet':'shield'),box:box(x+w-136,y+55,110,112)};
  }
  if(name==='amenityPins'){
   tone=c.id==='ring'?'navy':'paper';
   if(c.id==='ring'){place(0,x+32,y+166,w-64,76,58,'center');place(1,x+32,y+242,w-64,44,34,'center');visual={kind:'route',box:box(x+104,y+22,w-208,132)};}
   else{place(0,x+96,y+28,w-124,h-56,40);visual={kind:data.cardVisual?.[c.id]??'clock',box:box(x+20,y+32,62,h-64)};}
  }
  if(name==='hexSteps'){
   tone=Number(c.id.slice(3))%2?'navy':'paper';place(1,x+44,y+132,w-88,64,44,'center');place(2,x+44,y+204,w-88,46,34,'center');place(3,x+44,y+256,w-88,46,34,'center');
   visual={kind:data.cardVisual?.[c.id]??'house',box:box(x+w/2-66,y+24,132,96)};
  }
  if(name==='indexTabs'&&c.id==='body'){
   texts.forEach((t,i)=>i<3?place(i,x+42,y+48+i*94,w*.44,64,44):place(i,x+w-150,y+h-80,100,40,28));
   visual={kind:data.cardVisual?.[c.id]??'plan',box:box(x+w*.54,y+56,w*.38,h-140)};
  }
  if(name==='contractNote'&&c.id==='doc')visual={kind:data.cardVisual?.[c.id]??'shield',box:box(x+w*.58,y+h*.42,w*.30,h*.36)};
  if(name==='inspectTags'){
   texts.forEach((t,i)=>place(i,x+28,y+30+i*72,w-56,58,i?34:44));
   visual={kind:data.cardVisual?.[c.id]??(['sun','noise','shield','building'][Number(c.id.replace(/\D/g,''))%4]),box:box(x+w*.23,y+170,w*.54,112)};
  }
  const src=data.cardCutout?.[c.id];
  if(src){
   let slot=data.cardVisualBox?.[c.id]??visual?.box;
   if(!slot){
    const iw=Math.min(180,w*.28),ih=Math.min(180,h*.42);
    const candidates=[box(x+w-iw-28,y+h-ih-28,iw,ih),box(x+28,y+h-ih-28,iw,ih),box(x+w-iw-28,y+28,iw,ih)];
    const clear=(a:Box,b:Box)=>a.x+a.w+24<=b.x||b.x+b.w+24<=a.x||a.y+a.h+24<=b.y||b.y+b.h+24<=a.y;
    slot=candidates.find(b=>texts.every(t=>!t.text.trim()||clear(b,t.box))&&(c.marks??[]).every(m=>clear(b,m)));
   }
   if(!slot)throw new Error(name+'/'+c.id+' 无抠图空间，请填写cardVisualBox并调整文字或换版式');
   const outside=slot.x<x+12||slot.y<y+12||slot.x+slot.w>x+w-12||slot.y+slot.h>y+h-12;
   const hit=texts.some(t=>t.text.trim()&&!(slot!.x+slot!.w+24<=t.box.x||t.box.x+t.box.w+24<=slot!.x||slot!.y+slot!.h+24<=t.box.y||t.box.y+t.box.h+24<=slot!.y));
   if(outside||hit)throw new Error(name+'/'+c.id+' 抠图越界或图文净距不足24px');
   visual={kind:visual?.kind??'house',box:slot,src};
  }
  return {...c,tone,texts,visual};
 })};
};
export const NEW_SCENE_NAMES = Object.keys(scenes);
