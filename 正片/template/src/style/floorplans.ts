// 户型图素材（5.1.1）：不再用代码里手搓的示意户型，改为真实比例（mm）的 CAD 风格户型图素材。
// 素材由 scripts/make-floorplan.mjs 生成：public/media/floorplan/plan_3br2ba.svg（文字已转轮廓，不依赖字体）+ .png + .json。
// 想换户型：改 make-floorplan.mjs 里的 rooms / ops 坐标重新生成，或把别的户型图（同样的墨蓝底，真实尺寸，带中文房间名）放进 public/media/floorplan/ 并在镜头里用 data.plan.src 指定。
import plan from '../../public/media/floorplan/plan_3br2ba.json' with {type: 'json'};

export const PLAN_ASSET = {
  src: 'media/floorplan/plan_3br2ba.svg',
  png: 'media/floorplan/plan_3br2ba.png',
  aspect: (plan.viewBox as number[])[2] / (plan.viewBox as number[])[3],
  name: plan.name as string,
  grossM2: plan.grossM2 as number,
  netM2: plan.netM2 as number,
  rooms: plan.rooms as {id: string; name: string; w: number; d: number; m2: number}[],
};
/** 素材自检：必须有中文房间名、面积、墙厚、门窗数量，且面积在 89–120㎡ 的常见三居范围 */
export const REQUIRED_ROOMS = ['客厅', '主卧', '次卧', '厨房', '卫生间', '阳台'];
export const validatePlanAsset = (): string[] => {
  const errs: string[] = [];
  const names = new Set(PLAN_ASSET.rooms.map((r) => r.name));
  for (const n of REQUIRED_ROOMS) if (!names.has(n)) errs.push(`户型素材缺房间「${n}」`);
  if (PLAN_ASSET.grossM2 < 89 || PLAN_ASSET.grossM2 > 120) errs.push(`户型建面 ${PLAN_ASSET.grossM2}㎡ 不在 89–120㎡`);
  if ((plan.walls as any).exterior < 200 || (plan.walls as any).interior < 100) errs.push('墙体厚度不真实（外墙应 ≥200mm，内墙 ≥100mm）');
  if ((plan.doors as number) < 6) errs.push(`门只有 ${plan.doors} 扇，不像真实户型`);
  if ((plan.windows as number) < 6) errs.push(`窗只有 ${plan.windows} 扇，不像真实户型`);
  for (const r of PLAN_ASSET.rooms) {
    if (r.m2 <= 0 || r.w < 900 || r.d < 900) errs.push(`房间「${r.name}」净尺寸 ${r.w}×${r.d} 不合理`);
    if (r.name === '主卧' && r.m2 < 12) errs.push('主卧小于 12㎡');
    if (r.name === '客厅' && r.m2 < 14) errs.push('客厅小于 14㎡');
  }
  return errs;
};
