// 5.1 预览：5 款已登记小卡版式走正式 ShotView（含标题/栏目/背景），配逐字高亮字幕；白天+夜景各有。
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Backdrop, CamCtx, Fonts, Headline, Kicker} from '../style/components';
import {ShotView} from '../style/archetypes';
import {Subtitles} from '../style/subtitles';
import {SUB_V50} from '../style/subtitle-tokens';
import type {Shot} from '../style/types.ts';

export const SCENE = 180; // 6.0s，给 chain 最后一张卡留停稳时间
export const SHOTS51: (Shot & {sub: string[]})[] = [
  {id: 'P1', layout: 'dataCluster', kicker: '买房预算', title: '首付之外还要{留多少}', bg: {src: 'media/stock/mixkit_residential_above_day.mp4', video: true, dark: 0.44},
    sub: ['首付之外', '税费和杂费也要提前留'],
    data: {hero: {v: '8.6', unit: '万', sub: '首付之外'}, items: [{k: '契税', v: '1%–3%'}, {k: '中介费', v: '1%–2%'}, {k: '维修基金', v: '按面积'}], pill: {t: '应急金别动'}}},
  {id: 'P2', layout: 'comparePair', kicker: '新房还是二手', title: '差别看{入住时间}', bg: {src: 'media/stock/mixkit_42332_day.mp4', video: true, dark: 0.42},
    sub: ['急着住的话', '二手房更现实'],
    data: {L: {name: '新房', img: 'media/gen/new_vs_used.jpg', rows: [['入住', '1–2年后'], ['税费', '较少']]},
      R: {name: '二手', img: 'media/gen/ew_units.jpg', rows: [['入住', '过户即住'], ['税费', '看年限']]}, verdict: {t: '急着住，优先看二手'}}},
  {id: 'P3', layout: 'stepRail', kicker: '看房顺序', title: '看房按{这四步}', bg: {src: 'media/stock/mixkit_city_night_skyscrapers.mp4', video: true, dark: 0.40},
    sub: ['先小区再楼栋', '然后户型和成交价'],
    data: {steps: [{k: '看小区', s: '物业与密度'}, {k: '看楼栋', s: '采光与间距'}, {k: '看户型', s: '动静分区'}, {k: '看成交', s: '真实价格'}]}},
  {id: 'P4', layout: 'riskGroup', kicker: '避坑提醒', title: '签字前别踩{这2个坑}', bg: {src: 'media/preview-city.jpg', dark: 0.40},
    sub: ['口头承诺', '一律写进合同'],
    data: {head: {t: '签字前', n: '02'}, items: [['只看样板间', '交付标准写进合同'], ['轻信口头承诺', '一律落到纸面']], pill: {t: '逐条核对再签'}}},
  {id: 'P5', layout: 'noteGroup', kicker: '政策便签', title: '资格以{当地为准}', bg: {src: 'media/stock/mixkit_shanghai_river.mp4', video: true, dark: 0.42},
    sub: ['政策常调整', '买之前先问清楚'],
    data: {quote: {t: '资格以当地为准', s: '政策常调，买前先问'}, notes: [['限购', '看户籍与社保'], ['首付比例', '看名下套数'], ['公积金', '看缴存年限']]}},
];
/** 每个字一个时间（逐字高亮）；一句两段，自然断句。 */
const subsOf = (offsetF: number) => SHOTS51.flatMap((s, i) => {
  const t0 = (offsetF + i * SCENE + 14) * 1000 / 30, seg = (SCENE - 28) * 1000 / 30 / 2;
  return s.sub.map((line, k) => { const a = t0 + k * seg, chars = [...line], per = (seg - 260) / chars.length;
    return {startMs: Math.round(a), endMs: Math.round(a + seg - 200), lines: [chars.map((t, j) => ({t, s: Math.round(a + j * per), e: Math.round(a + (j + 1) * per)}))]}; });
});
const EP: any = {name: 'p51', audio: '', audioMs: 0, hasWords: true, cues: [], clips: {}, subs: subsOf(0)};
export const PREVIEW51_FRAMES = SCENE * SHOTS51.length;

export const Preview51: React.FC<{only?: number; legacySub?: boolean}> = ({only, legacySub}) => <AbsoluteFill style={{background: '#0c1018'}}><Fonts />
  {SHOTS51.map((s, i) => (only == null || only === i) && <Sequence key={s.id} from={only == null ? i * SCENE : 0} durationInFrames={SCENE} premountFor={30}>
    <ShotView s={s} dur={SCENE} exampleData />
  </Sequence>)}
  <AbsoluteFill style={{zIndex: 100, pointerEvents: 'none'}}>
    {only == null ? <Subtitles ep={EP} opts={{}} /> : <Sequence from={-only * SCENE}><Subtitles ep={EP} opts={{}} tokens={legacySub ? SUB_V50 : undefined} /></Sequence>}
  </AbsoluteFill>
</AbsoluteFill>;

/** 字幕前后对比：同一背景、同一句、同一帧（当前词在句中）。legacy=5.0 原字幕与金色标题强调。 */
const SUB_BGS = [
  {src: 'media/preview-city.jpg', name: '亮白天（雾霾城市）'},
  {src: 'media/stock/mixkit_admin_district_day.mp4', video: true, name: '白天航拍'},
  {src: 'media/gen/interior_warm.jpg', name: '室内暖光'},
  {src: 'media/stock/mixkit_city_night_skyscrapers.mp4', video: true, name: '夜景'},
];
export const SUB_CASES = SUB_BGS.length;
const SUB_EP: any = {name: 'subcmp', audio: '', audioMs: 0, hasWords: true, cues: [], clips: {}, subs: [(() => {
  const line = [...'这套房能不能买 三条都满足可以考虑 任一不满足先缓一缓'], a = 0, per = 110; // 5.1.5 单行样例：取样例口播里最长的一组（27 字，接近 28 字上限）
  return {startMs: a, endMs: a + per * line.length + 2000, lines: [line.map((t, j) => ({t, s: a + j * per, e: a + (j + 1) * per}))]};
})()]};
export const SubCompare: React.FC<{i?: number; legacy?: boolean}> = ({i = 0, legacy}) => {
  const b = SUB_BGS[i];
  return <AbsoluteFill className={legacy ? 'legacy50' : undefined} style={{background: '#0c1018'}}><Fonts />
    {legacy && <style>{`.legacy50 .gt{color:#F1D39D !important;filter:drop-shadow(0 2px 4px rgba(60,36,12,0.55)) !important}`}</style>}
    <CamCtx.Provider value={{dirX: 0.3, dirY: 0, zoom: 1}}><Backdrop src={b.src} video={(b as any).video} dark={0.42} /></CamCtx.Provider>
    <Kicker text={b.name} /><Headline text={'首付之外还要{留多少}'} start={-30} />
    <AbsoluteFill style={{zIndex: 100}}><Subtitles ep={SUB_EP} opts={{}} tokens={legacy ? SUB_V50 : undefined} /></AbsoluteFill>
  </AbsoluteFill>;
};
