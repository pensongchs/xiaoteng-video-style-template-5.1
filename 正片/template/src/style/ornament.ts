// 5.1.5 饰线几何（纯函数，渲染 CardOrnament.tsx 与 plan:check 共用）：内缝 inset 随圆角缩放，内缝圆角 = 卡圆角 − inset（同心）。
export type OrnRole = 'data' | 'risk' | 'key' | 'decision' | 'neutral';
export const ORNAMENT = {insetRatio: 0.3, insetMin: 4, insetMax: 9, seam: 1, arc: 2, tailRatio: 0.9} as const;
/** 内缝几何：inset 随圆角缩放；内缝圆角 = radius − inset（同心）。 */
export const ornamentSpec = (radius: number) => {
  const inset = Math.round(Math.max(ORNAMENT.insetMin, Math.min(ORNAMENT.insetMax, radius * ORNAMENT.insetRatio)));
  return {inset, r: Math.max(0, radius - inset), tail: Math.round(Math.max(10, radius * ORNAMENT.tailRatio))};
};
export type Corner = 'tl' | 'tr' | 'br' | 'bl';
export const ORN_ARCS: Record<OrnRole, Corner[]> = {data: ['tl'], risk: ['bl'], key: ['tl', 'br'], decision: ['br'], neutral: []};
export const roleOfTone = (tone?: string): OrnRole => tone === 'navy' ? 'data' : tone === 'clay' ? 'risk' : tone === 'champ' ? 'key' : tone === 'tea' ? 'decision' : 'neutral';
/** 静态检查：饰线几何都由卡圆角推出（同心）。radii = 各卡档位 / 图框 / 大卡的圆角。 */
export const ornamentFaults = (radii: number[]): string[] => radii.flatMap((rad) => {
  const s = ornamentSpec(rad);
  if (s.r !== Math.max(0, rad - s.inset)) return [`圆角 ${rad} 的内缝半径 ${s.r} ≠ ${rad}−${s.inset}（不同心）`];
  if (rad > 0 && s.inset >= rad) return [`圆角 ${rad} 的 inset ${s.inset} ≥ 圆角，饰线会变直角`];
  return [];
});
/** 源码检查：所有 <CardOrnament> 都必须把卡自己的圆角传进来（radius=…），饰线文件里不许再写固定 inset/角括号尺寸。 */
export const ornamentSourceFaults = (files: {path: string; text: string}[]): string[] => {
  const out: string[] = [];
  for (const f of files) {
    const re = /<CardOrnament\b([^>]*)\/>/g; let m;
    while ((m = re.exec(f.text))) if (!/\bradius=/.test(m[1])) out.push(`${f.path}: <CardOrnament> 没传卡圆角 radius（饰线必须由卡圆角推出）`);
    if (/CardOrnament\.tsx$/.test(f.path) && /\binset\s*=\s*compact|borderTopLeftRadius:\s*Math\.min\(6/.test(f.text)) out.push(`${f.path}: 仍有固定 inset/角括号尺寸（5.1.4 旧饰线）`);
  }
  return out;
};
