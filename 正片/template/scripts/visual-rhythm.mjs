import {F, FPS} from '../src/sync/timeline.ts';

export const VISUAL_RHYTHM = {first: 0.9, longest: 3.2, shortest: 0.3, stillShare: 0.25};
const keyOf = (media) => `${media.src}@${media.trim ?? 0}`;
const time = (frame) => `${(frame / FPS).toFixed(2)} 秒`;

export const visualRhythmFaults = (items, episode, openingFrames, hasAsset) => {
  const faults = [];
  const speechEnd = F(episode.cues.at(-1)?.endMs ?? 0);
  if (speechEnd <= openingFrames) return faults;

  const narratedFrames = (start, stop) => {
    let count = 0, through = start;
    for (const cue of episode.cues) {
      const inFrame = Math.max(through, F(cue.startMs));
      const outFrame = Math.min(stop, F(cue.endMs));
      if (inFrame >= stop) break;
      if (outFrame > inFrame) {
        count += outFrame - inFrame;
        through = outFrame;
      }
    }
    return count;
  };

  const beats = [];
  let backgroundFrames = 0, stillFrames = 0;
  for (const item of items) {
    if (item.from + item.d <= openingFrames || item.from >= speechEnd) continue;
    if (!item.visuals.length) {
      faults.push(`${item.s.id} 缺逐句画面表，须绑定台词原词与相应素材`);
      continue;
    }
    const firstFrame = item.from + item.visuals[0].frame;
    const backgroundKeys = new Set(item.visuals.filter(({mode, media}) => mode === 'layout' && media?.src).map(({media}) => keyOf(media)));
    if (firstFrame > Math.max(openingFrames, item.from) && item.s.bg?.src) backgroundKeys.add(keyOf(item.s.bg));
    if (backgroundKeys.size > 1) faults.push(`${item.s.id} 同一 MG 组的背景已切换，请在独立素材段或下一组换背景`);
    const recordBackground = (media, start, end) => {
      const frames = Math.max(0, Math.min(speechEnd, end) - Math.max(openingFrames, start));
      backgroundFrames += frames;
      if (media?.src && !media.video) stillFrames += frames;
    };
    recordBackground(item.s.bg, item.from, firstFrame);
    if (narratedFrames(Math.max(openingFrames, item.from), firstFrame) > F(VISUAL_RHYTHM.first * 1000)) {
      faults.push(`${item.s.id} 开口后等画面至 ${time(firstFrame)}，请在分句开头落画`);
    }
    item.visuals.forEach((cut, i) => {
      const start = item.from + cut.frame;
      const next = item.from + (item.visuals[i + 1]?.frame ?? item.d);
      recordBackground(cut.media, start, next);
      const tag = `${item.s.id} ${time(start)}「${cut.at}」`;
      if (!cut.subject?.trim() || !['layout', 'footage'].includes(cut.mode)) faults.push(`${tag} 缺素材主体说明或画面方式`);
      if (!cut.media?.src || !hasAsset(cut.media.src)) {
        faults.push(`${tag} 对应素材不存在`);
        return;
      }
      if (cut.media.video && (episode.clips[cut.media.src] ?? 0) < ((cut.media.trim ?? 0) + (next - start) / FPS) * 1000) {
        faults.push(`${tag} 视频有效长度不足，无法覆盖这一段口播`);
      }
      if (start < speechEnd) beats.push({start, cut, tag});
    });
  }

  const firstVisible = beats.findIndex(({start}) => start >= openingFrames);
  if (firstVisible < 0 || narratedFrames(openingFrames, beats[firstVisible].start) > F(VISUAL_RHYTHM.first * 1000)) {
    faults.push('片头之后缺少及时落画的正文素材');
  }
  const visible = firstVisible < 0 ? [] : beats.slice(firstVisible);
  visible.forEach(({start, cut, tag}, i) => {
    const prev = visible[i - 1];
    const nextStart = visible[i + 1]?.start ?? speechEnd;
    if (prev && prev.cut.media.src === cut.media.src) faults.push(`${tag} 连续用同一源素材，不能计为换画`);
    if (prev && start - prev.start < F(VISUAL_RHYTHM.shortest * 1000)) faults.push(`${tag} 换画太快，素材来不及看清`);
    if (narratedFrames(start, nextStart) > F(VISUAL_RHYTHM.longest * 1000)) faults.push(`${tag} 到 ${time(nextStart)} 持续口播超过 ${VISUAL_RHYTHM.longest} 秒，需给新的语义点补画`);
  });
  if (stillFrames > Math.ceil(backgroundFrames * VISUAL_RHYTHM.stillShare)) {
    faults.push(`全屏静图占正文画面 ${Math.round(stillFrames / backgroundFrames * 100)}%，请控制在 ${VISUAL_RHYTHM.stillShare * 100}% 以内；卡内嵌图不计`);
  }
  return faults;
};
