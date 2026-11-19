// 5.1.2 重做后的「交付实力怎么看」枢纽版式样镜（pitfallLens）：圆里是图标 + 标题 + 补充行，三张条卡 = 图标 + 标题 + 补充行，卡宽按内容定。
// 文字是示例口径，正式片按本期口播换字；换字时必须保留「标题 + 补充行」，不得写「示意」之类占位字（sceneOf / verify 会拦）。
import type {Shot} from '../style/types.ts';
export const DELIVERY_SHOT: Shot = {
  id: 'D01', layout: 'pitfallLens', kicker: '看交付', title: '交付实力 {怎么看}',
  bg: {src: 'media/gen/yl_lowdensity.jpg', dark: 0.46, blur: 0},
  data: {sceneText: {lens: ['交付实力', '三项看清'], c0: ['资金保障', '监管账户 · 融资到位'], c1: ['工程进度', '节点对照合同'], c2: ['过往交付质量', '往期楼盘 · 业主口碑']},
    cardVisual: {lens: 'building', c0: 'wallet', c1: 'route', c2: 'shield'}},
};
