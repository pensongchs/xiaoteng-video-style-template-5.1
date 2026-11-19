// 生成「户型图素材」：真实比例（mm）的三室两厅两卫 CAD 风格户型图，墨蓝底 + 冰白墙体。
//   node scripts/make-floorplan.mjs        → public/media/floorplan/plan_3br2ba.svg（+ plan_3br2ba.json 面积/房间清单）
// 画法：墙体有厚度（外墙 240 / 内墙 120）、门洞带开启弧线、窗为三线窗、客厅阳台推拉门、家具图例、
// 中文房间名 + 面积、三道尺寸链（mm）、指北针。所有数字来自同一份坐标，面积是净尺寸实算，不是写死的。
import {writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import opentype from 'opentype.js';
const font = opentype.loadSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fonts', 'AlibabaHealthFont2.0CN-85B.ttf'));
/** 文字转轮廓路径：SVG 不依赖任何字体，放进 <Img>、PNG、别的软件里都一样清楚。 */
const txt = (text, x, y, size, fill, anchor = 'middle', rot) => {
  // 字体里没有「㎡」：拆成 m + 上标 2（同字体轮廓），视觉等同
  const runs = []; text.split('㎡').forEach((part, i, arr) => { if (part) runs.push([part, size, 0]); if (i < arr.length - 1) runs.push(['m', size, 0], ['2', size * 0.6, -size * 0.42]); });
  const width = runs.reduce((acc, [t, z]) => acc + font.getAdvanceWidth(t, z), 0); let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const d = runs.map(([t, z, dy]) => { const p = font.getPath(t, cx, y + dy, z).toPathData(1); cx += font.getAdvanceWidth(t, z); return p; }).join(' ');
  return `<path d="${d}" fill="${fill}"${rot ? ` transform="rotate(${rot[0]} ${rot[1]} ${rot[2]})"` : ''}/>`;
};
const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'public', 'media', 'floorplan');
mkdirSync(OUT, {recursive: true});

const W = 12000, D = 7800, EXT = 240, INT = 120;
// 房间（中心线坐标，mm）。kind 决定地面色与家具。
const rooms = [
  {id: 'kitchen', name: '厨房', x: 0, y: 0, w: 2700, h: 2400, kind: 'wet'},
  {id: 'dining', name: '餐厅', x: 2700, y: 0, w: 3000, h: 3000, kind: 'living'},
  {id: 'bath2', name: '卫生间', x: 5700, y: 0, w: 2100, h: 3000, kind: 'wet'},
  {id: 'bed3', name: '次卧', x: 7800, y: 0, w: 4200, h: 3000, kind: 'bed'},
  {id: 'bath1', name: '主卫', x: 0, y: 2400, w: 2700, h: 1700, kind: 'wet'},
  {id: 'hall', name: '过道', x: 2700, y: 3000, w: 9300, h: 1100, kind: 'hall'},
  {id: 'master', name: '主卧', x: 0, y: 4100, w: 4200, h: 3700, kind: 'bed'},
  {id: 'living', name: '客厅', x: 4200, y: 4100, w: 4500, h: 3700, kind: 'living'},
  {id: 'bed2', name: '次卧', x: 8700, y: 4100, w: 3300, h: 3700, kind: 'bed'},
  {id: 'balcony', name: '阳台', x: 4200, y: 7800, w: 4500, h: 1500, kind: 'balc'},
];
const R = Object.fromEntries(rooms.map((r) => [r.id, r]));
const half = (t) => t / 2;
const edgeT = (orient, c, a, b) => {            // 边的墙厚：位于外框上 = 外墙；阳台栏板 = 120
  const onBox = orient === 'v' ? (c === 0 || c === W) : (c === 0 || c === D);
  if (orient === 'h' && c === D && a >= 4200 && b <= 8700) return INT;       // 客厅-阳台 之间墙
  if (orient === 'h' && c === 9300) return INT;                              // 阳台栏板
  if (orient === 'v' && (c === 4200 || c === 8700) && a >= 7800) return INT; // 阳台侧栏板
  return onBox ? EXT : INT;
};
// 净面积：每面墙各让出一半墙厚
const netArea = (r) => {
  const L = edgeT('v', r.x, r.y, r.y + r.h), Rr = edgeT('v', r.x + r.w, r.y, r.y + r.h), T = edgeT('h', r.y, r.x, r.x + r.w), B = edgeT('h', r.y + r.h, r.x, r.x + r.w);
  const w = r.w - half(L) - half(Rr), h = r.h - half(T) - half(B);
  return {w, h, m2: (w * h) / 1e6};
};
const segs = [];
for (const r of rooms) {
  const e = [['h', r.y, r.x, r.x + r.w], ['h', r.y + r.h, r.x, r.x + r.w], ['v', r.x, r.y, r.y + r.h], ['v', r.x + r.w, r.y, r.y + r.h]];
  for (const [o, c, a, b] of e) segs.push({o, c, a, b, t: edgeT(o, c, a, b)});
}
// 开口：o=墙方向 c=墙中心线 a..b=开口范围 type=door|slide|open|win
const ops = [
  {o: 'v', c: W, a: 3080, b: 3980, type: 'door', hinge: 'a', swing: 'in-', name: '入户门'},                     // 入户门：向走廊内开（朝 -x）
  {o: 'v', c: 2700, a: 1250, b: 2250, type: 'slide'},                                                          // 厨房推拉门
  {o: 'h', c: 3000, a: 3300, b: 5100, type: 'open'},                                                          // 餐厅—过道 垭口
  {o: 'h', c: 3000, a: 6300, b: 7200, type: 'door', hinge: 'a', swing: 'up'},                                  // 卫生间门（向北开进卫生间）
  {o: 'h', c: 3000, a: 8600, b: 9500, type: 'door', hinge: 'b', swing: 'up'},                                  // 次卧门
  {o: 'h', c: 4100, a: 1000, b: 1900, type: 'door', hinge: 'a', swing: 'up'},                                  // 主卫门
  {o: 'h', c: 4100, a: 2850, b: 3750, type: 'door', hinge: 'a', swing: 'down'},                                // 主卧门
  {o: 'h', c: 4100, a: 4900, b: 7300, type: 'open'},                                                          // 客厅开口
  {o: 'h', c: 4100, a: 9000, b: 9900, type: 'door', hinge: 'a', swing: 'down'},                                // 次卧门
  {o: 'h', c: 7800, a: 5000, b: 7900, type: 'slide'},                                                         // 客厅—阳台 推拉门
  // 窗
  {o: 'h', c: 0, a: 600, b: 2100, type: 'win'}, {o: 'h', c: 0, a: 3500, b: 5300, type: 'win'}, {o: 'h', c: 0, a: 6200, b: 7300, type: 'win'}, {o: 'h', c: 0, a: 8700, b: 11100, type: 'win'},
  {o: 'v', c: 0, a: 4900, b: 6900, type: 'win'}, {o: 'v', c: 0, a: 2750, b: 3750, type: 'win'}, {o: 'v', c: W, a: 5100, b: 6700, type: 'win'},
  {o: 'h', c: 7800, a: 1000, b: 3300, type: 'win'}, {o: 'h', c: 7800, a: 9400, b: 11300, type: 'win'}, {o: 'h', c: 9300, a: 4700, b: 8200, type: 'win'},
];
const C = {bg: '#0F1B33', wall: '#DCE6F6', floorLiving: 'rgba(91,155,255,0.13)', floorBed: 'rgba(157,140,255,0.11)', floorWet: 'rgba(45,212,191,0.12)', floorHall: 'rgba(255,255,255,0.05)', floorBalc: 'rgba(255,255,255,0.07)',
  furn: '#8EA7CF', furnFill: 'rgba(142,167,207,0.12)', text: '#F5F8FC', area: '#9CC2FF', dim: '#7FB2FF', dimText: '#BCD6FF', glass: '#6FA6FF', door: '#F5F8FC'};
const floorOf = (k) => ({living: C.floorLiving, bed: C.floorBed, wet: C.floorWet, hall: C.floorHall, balc: C.floorBalc}[k]);
const o = [];
const rect = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
// ===== 画布 =====
const M = 1250, X0 = -1700, Y0 = -M - 1000, VW = W + 1700 + 1500, VH = D + 1500 + M * 2 + 1000 - 160;
o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${X0} ${Y0} ${VW} ${VH}" width="${VW / 8}" height="${VH / 8}" font-family="Alibaba Health, 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif">`);
o.push(`<title>三室两厅两卫 户型图（示例）</title>`);
o.push(rect(X0, Y0, VW, VH, `fill="${C.bg}"`));
// 地面
for (const r of rooms) o.push(rect(r.x, r.y, r.w, r.h, `fill="${C.bg}"`) + rect(r.x, r.y, r.w, r.h, `fill="${floorOf(r.kind)}"`));
// 厨卫瓷砖线（淡）
for (const r of rooms.filter((q) => q.kind === 'wet' || q.kind === 'balc')) {
  const g = []; for (let x = r.x + 300; x < r.x + r.w; x += 300) g.push(`M${x} ${r.y} V${r.y + r.h}`); for (let y = r.y + 300; y < r.y + r.h; y += 300) g.push(`M${r.x} ${y} H${r.x + r.w}`);
  o.push(`<path d="${g.join(' ')}" stroke="rgba(255,255,255,0.06)" stroke-width="10" fill="none"/>`);
}
// ===== 家具（图例，浅线框）=====
const F = (s) => `<g stroke="${C.furn}" stroke-width="24" fill="${C.furnFill}" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
const bed = (x, y, w, h, head) => { // head: 'n'|'s'|'e'|'w' 床头所在边
  const pw = head === 'n' || head === 's' ? w * 0.4 : 520, ph = head === 'n' || head === 's' ? 420 : h * 0.4;
  const pl = [], add = (px, py, ww, hh) => pl.push(`<rect x="${px}" y="${py}" width="${ww}" height="${hh}" rx="60"/>`);
  if (head === 'n') { add(x + w * 0.05, y + 80, w * 0.4, 420); add(x + w * 0.55, y + 80, w * 0.4, 420); }
  if (head === 's') { add(x + w * 0.05, y + h - 500, w * 0.4, 420); add(x + w * 0.55, y + h - 500, w * 0.4, 420); }
  if (head === 'e') { add(x + w - 500, y + h * 0.05, 420, h * 0.4); add(x + w - 500, y + h * 0.55, 420, h * 0.4); }
  if (head === 'w') { add(x + 80, y + h * 0.05, 420, h * 0.4); add(x + 80, y + h * 0.55, 420, h * 0.4); }
  const blanket = head === 'e' ? `<path d="M${x} ${y + 80} H${x + w * 0.55} V${y + h - 80} H${x}" fill="none"/>` : head === 'w' ? `<path d="M${x + w} ${y + 80} H${x + w * 0.45} V${y + h - 80} H${x + w}" fill="none"/>` : head === 'n' ? `<path d="M${x + 80} ${y + h} V${y + h * 0.45} H${x + w - 80} V${y + h}" fill="none"/>` : `<path d="M${x + 80} ${y} V${y + h * 0.55} H${x + w - 80} V${y}" fill="none"/>`;
  return F(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="50"/>${pl.join('')}${blanket}`);
};
const wardrobe = (x, y, w, h) => F(`<rect x="${x}" y="${y}" width="${w}" height="${h}"/><path d="M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}" stroke-width="12" opacity=".5"/>`);
const nightstand = (x, y) => F(`<rect x="${x}" y="${y}" width="420" height="420"/>`);
const toilet = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">${F(`<rect x="-190" y="-380" width="380" height="170" rx="30"/><ellipse cx="0" cy="-60" rx="170" ry="230"/>`)}</g>`;
const basin = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">${F(`<rect x="-300" y="-230" width="600" height="460" rx="50"/><ellipse cx="0" cy="0" rx="190" ry="140"/>`)}</g>`;
const shower = (x, y, s = 900) => F(`<rect x="${x}" y="${y}" width="${s}" height="${s}"/><path d="M${x} ${y} L${x + s} ${y + s}" stroke-width="12" opacity=".55"/><circle cx="${x + s / 2}" cy="${y + s / 2}" r="55"/>`);
const chair = (x, y) => `<rect x="${x - 190}" y="${y - 190}" width="380" height="380" rx="70"/>`;
// 主卧
const mR = R.master, mb = (mR.x + 60), mt = (mR.y + 60);
o.push(bed(2100, 5350, 2000, 1800, 'e'));
o.push(nightstand(3700, 7220));

o.push(wardrobe(mb + 60, mt, 2300, 600));
// 次卧（北）
o.push(bed(9650, 300, 2000, 1500, 'e'));
o.push(wardrobe(10050, 2250, 1800, 560));
o.push(F(`<rect x="8000" y="180" width="1000" height="560"/><rect x="8320" y="790" width="360" height="360" rx="60"/>`)); // 书桌+椅
// 次卧（南）
o.push(bed(8860, 5300, 2000, 1500, 'w'));
o.push(wardrobe(10250, 4200, 1620, 520));
// 客厅：电视墙 + 沙发 + 茶几 + 边几
o.push(F(`<rect x="4290" y="5300" width="360" height="1800" rx="30"/>`));
o.push(F(`<rect x="7260" y="4800" width="1300" height="900" rx="90"/><rect x="7260" y="5760" width="1300" height="1440" rx="90"/><rect x="6200" y="5650" width="760" height="1100" rx="60"/>`)); // L型沙发 + 茶几
o.push(F(`<rect x="6280" y="4300" width="620" height="620" rx="80"/>`)); // 单椅
o.push(F(`<circle cx="5250" cy="7380" r="210"/><circle cx="5250" cy="7380" r="110" stroke-width="12"/>`)); // 绿植
// 餐厅：餐桌 + 6 椅
o.push(F(`<rect x="3500" y="800" width="1600" height="800" rx="40"/>${[3800, 4300, 4800].map((x) => chair(x, 520) + chair(x, 1890)).join('')}`));
// 厨房：L 形台面 + 水槽 + 灶台 + 冰箱
o.push(F(`<path d="M120 120 H2580 V780 H780 V2280 H120 Z"/><rect x="1400" y="200" width="760" height="500" rx="30"/><ellipse cx="1780" cy="450" rx="270" ry="170"/>`));
o.push(F(`<rect x="210" y="1200" width="470" height="620" rx="30"/>${[[330, 1330], [560, 1330], [330, 1690], [560, 1690]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="80"/>`).join('')}`));
o.push(F(`<rect x="900" y="1560" width="660" height="720" rx="30"/><path d="M900 1900 H1560" stroke-width="12"/>`));
// 卫生间（公卫）
o.push(`<g transform="translate(7560 1950) rotate(90)">${F(`<rect x="-190" y="-380" width="380" height="170" rx="30"/><ellipse cx="0" cy="-60" rx="170" ry="230"/>`)}</g>`, basin(7330, 420, 0), shower(5860, 140, 900));
// 主卫
o.push(toilet(2400, 3980, 180), basin(1750, 2790, 0), shower(120, 2480, 900));
// 阳台：洗衣机 + 绿植
o.push(F(`<rect x="4300" y="8600" width="640" height="640" rx="40"/><circle cx="4620" cy="8920" r="190"/><circle cx="8350" cy="8700" r="220"/><circle cx="8350" cy="8700" r="110" stroke-width="12"/>`));
// ===== 墙体 =====
o.push(`<g fill="${C.wall}">`);
for (const s of segs) {
  const t = s.t;
  if (s.o === 'h') o.push(rect(s.a - t / 2, s.c - t / 2, s.b - s.a + t, t)); else o.push(rect(s.c - t / 2, s.a - t / 2, t, s.b - s.a + t));
}
o.push('</g>');
// ===== 开口 =====
const wallT = (op) => {
  const hit = segs.find((s) => s.o === op.o && s.c === op.c && s.a <= op.a + 1 && s.b >= op.b - 1);
  return hit ? hit.t : INT;
};
const line = (x1, y1, x2, y2, w, col, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" ${extra}/>`;
for (const op of ops) {
  const t = wallT(op) + 8, pad = 6;
  const gx = op.o === 'h' ? op.a : op.c - t / 2, gy = op.o === 'h' ? op.c - t / 2 : op.a, gw = op.o === 'h' ? op.b - op.a : t, gh = op.o === 'h' ? t : op.b - op.a;
  o.push(rect(gx, gy, gw, gh, `fill="${C.bg}"`));
  // 洞口所在墙两侧的地面色补上（避免黑洞）：用相邻房间的地面色铺
  o.push(rect(gx, gy, gw, gh, `fill="rgba(255,255,255,0.05)"`));
  const along = (u) => (op.o === 'h' ? [op.a + u, op.c] : [op.c, op.a + u]);
  const len = op.b - op.a, tt = wallT(op);
  if (op.type === 'win') { // 三线窗 + 玻璃线
    const offs = [-tt / 2, 0, tt / 2];
    for (const d of offs) o.push(op.o === 'h' ? line(op.a, op.c + d, op.b, op.c + d, 14, C.wall) : line(op.c + d, op.a, op.c + d, op.b, 14, C.wall));
    o.push(op.o === 'h' ? line(op.a, op.c, op.b, op.c, 26, C.glass) : line(op.c, op.a, op.c, op.b, 26, C.glass));
    o.push(op.o === 'h' ? rect(op.a - 14, op.c - tt / 2, 28, tt, `fill="${C.wall}"`) + rect(op.b - 14, op.c - tt / 2, 28, tt, `fill="${C.wall}"`) : rect(op.c - tt / 2, op.a - 14, tt, 28, `fill="${C.wall}"`) + rect(op.c - tt / 2, op.b - 14, tt, 28, `fill="${C.wall}"`));
  } else if (op.type === 'open') { // 垭口：两端门垛
    const j = 90;
    o.push(op.o === 'h' ? rect(op.a - 20, op.c - tt / 2, 40, tt, `fill="${C.wall}"`) + rect(op.b - 20, op.c - tt / 2, 40, tt, `fill="${C.wall}"`) : rect(op.c - tt / 2, op.a - 20, tt, 40, `fill="${C.wall}"`) + rect(op.c - tt / 2, op.b - 20, tt, 40, `fill="${C.wall}"`));
    o.push(op.o === 'h' ? line(op.a, op.c, op.b, op.c, 10, 'rgba(220,230,246,0.35)', 'stroke-dasharray="60 60"') : line(op.c, op.a, op.c, op.b, 10, 'rgba(220,230,246,0.35)', 'stroke-dasharray="60 60"'));
  } else if (op.type === 'slide') { // 推拉门：两扇错位
    const half2 = len / 2;
    const a = op.o === 'h' ? [rect(op.a, op.c - 60, half2 + 80, 40, `fill="${C.glass}"`), rect(op.a + half2 - 80, op.c + 20, half2 + 80, 40, `fill="${C.glass}"`)] : [rect(op.c - 60, op.a, 40, half2 + 80, `fill="${C.glass}"`), rect(op.c + 20, op.a + half2 - 80, 40, half2 + 80, `fill="${C.glass}"`)];
    o.push(...a);
    o.push(op.o === 'h' ? rect(op.a - 20, op.c - tt / 2, 40, tt, `fill="${C.wall}"`) + rect(op.b - 20, op.c - tt / 2, 40, tt, `fill="${C.wall}"`) : rect(op.c - tt / 2, op.a - 20, tt, 40, `fill="${C.wall}"`) + rect(op.c - tt / 2, op.b - 20, tt, 40, `fill="${C.wall}"`));
  } else if (op.type === 'door') { // 平开门：门垛 + 门扇 + 开启弧
    const rad = len;
    o.push(op.o === 'h' ? rect(op.a - 20, op.c - tt / 2, 40, tt, `fill="${C.wall}"`) + rect(op.b - 20, op.c - tt / 2, 40, tt, `fill="${C.wall}"`) : rect(op.c - tt / 2, op.a - 20, tt, 40, `fill="${C.wall}"`) + rect(op.c - tt / 2, op.b - 20, tt, 40, `fill="${C.wall}"`));
    // 铰链点
    let hx, hy, ex, ey, cx2, cy2; // 门扇开启 90° 的端点 e，闭合端点 c
    if (op.o === 'h') {
      hx = op.hinge === 'a' ? op.a : op.b; cx2 = op.hinge === 'a' ? op.b : op.a; cy2 = op.c; hy = op.c;
      const dir = op.swing === 'up' ? -1 : 1; ex = hx; ey = hy + dir * rad;
      const sweep = (op.hinge === 'a') === (dir === -1) ? 0 : 1;
      o.push(`<path d="M${cx2} ${cy2} A${rad} ${rad} 0 0 ${sweep} ${ex} ${ey}" fill="none" stroke="${C.door}" stroke-width="12" stroke-dasharray="70 50" opacity=".85"/>`);
      o.push(line(hx, hy, ex, ey, 34, C.door));
    } else {
      hx = op.c; hy = op.hinge === 'a' ? op.a : op.b; cx2 = op.c; cy2 = op.hinge === 'a' ? op.b : op.a;
      const dir = op.swing === 'in-' ? -1 : 1; ex = hx + dir * rad; ey = hy;
      const sweep = (op.hinge === 'a') === (dir === 1) ? 1 : 0;
      o.push(`<path d="M${cx2} ${cy2} A${rad} ${rad} 0 0 ${sweep} ${ex} ${ey}" fill="none" stroke="${C.door}" stroke-width="12" stroke-dasharray="70 50" opacity=".85"/>`);
      o.push(line(hx, hy, ex, ey, 34, C.door));
    }
  }
}
// ===== 房间名 + 面积 =====
const info = [];
const label = (id, cx, cy, size = 500) => {
  const r = R[id], n = netArea(r);
  info.push({id, name: r.name, w: Math.round(n.w), d: Math.round(n.h), m2: Number(n.m2.toFixed(1))});
  o.push(txt(r.name, cx, cy, size, C.text));
  o.push(txt(`${n.m2.toFixed(1)}㎡`, cx, cy + size * 0.86, Math.round(size * 0.74), C.area));
};
label('master', 1050, 6050, 520);
label('living', 5450, 5950, 600);
label('bed2', 10250, 7150, 520);
label('bed3', 8900, 1750, 520);
label('dining', 4300, 2400, 420);
label('kitchen', 1850, 1180, 400);
label('bath2', 6650, 1750, 440);
label('bath1', 1700, 3550, 360);
label('hall', 10200, 3700, 340);
label('balcony', 6450, 8780, 420);
// 入户门标注 + 指北针
o.push(txt('入户', W + 330, 3720, 340, C.dimText, 'start'));
// ===== 尺寸链 =====
const dimH = (y, xs, texts, off = 250) => {
  o.push(line(xs[0], y, xs[xs.length - 1], y, 14, C.dim));
  xs.forEach((x, i) => { o.push(line(x, y - 90, x, y + 90, 14, C.dim)); o.push(line(x - 70, y + 70, x + 70, y - 70, 20, C.dim)); });
  texts.forEach((t, i) => o.push(txt(t, (xs[i] + xs[i + 1]) / 2, y - 100, 330, C.dimText)));
};
const dimV = (x, ys, texts) => {
  o.push(line(x, ys[0], x, ys[ys.length - 1], 14, C.dim));
  ys.forEach((y) => { o.push(line(x - 90, y, x + 90, y, 14, C.dim)); o.push(line(x - 70, y + 70, x + 70, y - 70, 20, C.dim)); });
  texts.forEach((t, i) => { const cy = (ys[i] + ys[i + 1]) / 2; o.push(txt(t, x - 110, cy, 330, C.dimText, 'middle', [-90, x - 110, cy])); });
};
dimH(-620, [0, 2700, 5700, 7800, W], ['2700', '3000', '2100', '4200']);
dimH(-1000, [0, W], [String(W)]);
dimV(-620, [0, 2400, 4100, 7800], ['2400', '1700', '3700']);
dimV(-1000, [0, D], [String(D)]);
dimH(D + 1500 + 600, [0, 4200, 8700, W], ['4200', '4500', '3300']);
// 指北针 + 标题条
o.push(`<g transform="translate(${W + 520} ${D + 1250})"><circle r="360" fill="none" stroke="${C.dim}" stroke-width="16"/><path d="M0 -300 L110 120 L0 40 L-110 120 Z" fill="${C.dimText}"/>${txt('北', 0, -420, 340, C.dimText)}</g>`);
const totalNet = info.reduce((a, b) => a + b.m2, 0);
const gross = ((W + EXT) * (D + EXT)) / 1e6 + (4500 * 1500) / 2e6;
o.push(txt('三室两厅两卫', X0 + 300, Y0 + 520, 520, C.text, 'start'));
o.push(txt(`建面约 ${Math.round(gross)}㎡ · 套内约 ${Math.round(totalNet - info.find((i) => i.id === 'balcony').m2)}㎡ · 南向阳台`, X0 + 300 + 3500, Y0 + 520, 400, C.area, 'start'));
o.push('</svg>');
writeFileSync(join(OUT, 'plan_3br2ba.svg'), o.join('\n'));
writeFileSync(join(OUT, 'plan_3br2ba.json'), JSON.stringify({
  name: '三室两厅两卫', unit: 'mm', viewBox: [X0, Y0, VW, VH], outer: {w: W + EXT, d: D + EXT}, grossM2: Math.round(gross), netM2: Math.round(totalNet - info.find((i) => i.id === 'balcony').m2), rooms: info,
  source: '本模板自绘（make-floorplan.mjs），无第三方素材，无版权问题；户型为常见南北通透 89–120㎡ 三居布局示意，不对应任何真实楼盘。',
  walls: {exterior: EXT, interior: INT}, doors: ops.filter((p) => p.type === 'door').length, windows: ops.filter((p) => p.type === 'win').length,
}, null, 2) + '\n');
console.log('✓ plan_3br2ba.svg', info.map((i) => `${i.name}${i.m2}`).join(' '), '建面', Math.round(gross), '套内', Math.round(totalNet - info.find((i) => i.id === 'balcony').m2));
