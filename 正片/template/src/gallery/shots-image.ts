// 5.1.5 图片动效组件样镜（4 款）。图片按样镜文案关键词生成（提示词见 public/media/gen/img515/ledger.json），正式片按本期口播重新生成。
import type {Shot} from '../style/types.ts';

const P = (kw: string, scene: string) => `${kw}：${scene}，中国住宅语境，中性日光，真实摄影质感，冷静偏蓝自然色，无文字、无logo、无水印`;
export const IMAGE_GALLERY: (Shot & {vo: string})[] = [
  {id: 'I1', layout: 'imageFrame3D', title: '东户西户{差在哪}', bg: {src: 'media/stock/mixkit_residential_above_day.mp4', video: true, dark: 0.5},
    vo: '选东户上午有太阳 选西户冬天下午暖和',
    data: {frames: [
      {src: 'media/gen/img515/东户上午.jpg', kw: '上午有太阳', prompt: P('上午有太阳', '东向卧室清晨阳光斜射进窗'), cap: '东户', sub: '上午有太阳'},
      {src: 'media/gen/west_sun.jpg', kw: '下午暖和', prompt: P('下午暖和', '西向客厅午后暖阳'), cap: '西户', sub: '冬天下午暖和'}]}},
  {id: 'I2', layout: 'imageSwap', title: '签约先看{这三处}', bg: {src: 'media/stock/mixkit_city_night_skyscrapers.mp4', video: true, dark: 0.5},
    vo: '签约先看三处 交房日期 违约责任 还有贷款条款',
    data: {images: [
      {src: 'media/gen/img515/交房日期.jpg', kw: '交房日期', prompt: P('交房日期', '新房交房现场递钥匙'), cap: '交房日期', sub: '写明逾期怎么赔'},
      {src: 'media/gen/img515/违约责任.jpg', kw: '违约责任', prompt: P('违约责任', '购房合同与钢笔特写'), cap: '违约责任', sub: '双方都要写清'},
      {src: 'media/gen/img515/贷款条款.jpg', kw: '贷款条款', prompt: P('贷款条款', '房贷文件、计算器与住宅模型'), cap: '贷款条款', sub: '贷不下来怎么办'}]}},
  {id: 'I3', layout: 'imageGrid', title: '收房先看{这四处}', bg: {src: 'media/gen/clean_complex.jpg', dark: 0.5},
    vo: '验房先看窗边 再看墙角 然后地漏 最后插座',
    data: {cells: [
      {src: 'media/gen/img515/窗边.jpg', kw: '窗边', prompt: P('窗边', '铝合金窗框与窗台打胶缝特写'), cap: '窗边', sub: '看打胶缝'},
      {src: 'media/gen/img515/墙角.jpg', kw: '墙角', prompt: P('墙角', '室内墙面阴角与踢脚线的潮湿水渍'), cap: '墙角', sub: '看有无渗水'},
      {src: 'media/gen/img515/地漏.jpg', kw: '地漏', prompt: P('地漏', '卫生间地漏与地面坡度'), cap: '地漏', sub: '看排水坡度'},
      {src: 'media/gen/img515/插座.jpg', kw: '插座', prompt: P('插座', '86型五孔插座与验电器'), cap: '插座', sub: '逐个验电'}]}},
  {id: 'I4', layout: 'imageCutout', title: '低密度小区{好在哪}', bg: {src: 'media/stock/mixkit_42332_day.mp4', video: true, dark: 0.5},
    vo: '低密度小区 楼间距大 绿化多 住着更安静',
    data: {photo: {src: 'media/gen/yl_lowdensity.jpg', kw: '绿化多', prompt: P('绿化多', '低密度小区草坪与园林绿化')}, cutout: {src: 'media/gen/cutouts/成熟社区住宅.png', kw: '低密度小区', prompt: P('低密度小区', '7–9层成熟社区透明抠像')},
      cap: {t: '低密度小区', s: '楼间距大'}, chips: ['绿化多', '住着更安静']}},
];
