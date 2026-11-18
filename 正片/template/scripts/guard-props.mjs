// 渲染/检查共用：只允许白名单 inputProps，禁止用 props 覆盖色板或字幕令牌。
export const ALLOWED_PROP_KEYS = new Set(['subs', 'highlight', 'palette', 'check', 'only', 'i', 'legacy']);
export const ALLOWED_PALETTES = new Set(['inkBlue', 'graphiteIce', 'glacier']);
const FORBIDDEN = /subtitle-tokens|\bSUB\b|\bFROST\b|\bFOG\b|\bHILITE\b|goldHi|#F3D79E|#F4EEE4|#FFDF51|warmPaper|tokensOverride/i;

export function parsePropsArg(argv) {
  const raw = argv.find((x) => x.startsWith('--props='));
  if (!raw) return {};
  try { return JSON.parse(raw.slice('--props='.length)); }
  catch (e) { throw new Error('无法解析 --props：' + e.message); }
}

export function assertRenderProps(props = {}, {comp} = {}) {
  if (props == null || typeof props !== 'object' || Array.isArray(props)) {
    throw new Error('inputProps 必须是对象');
  }
  for (const k of Object.keys(props)) {
    if (!ALLOWED_PROP_KEYS.has(k)) {
      throw new Error(`非法 inputProps「${k}」。只允许 ${[...ALLOWED_PROP_KEYS].join('、')}。禁止用 props 覆盖字幕令牌或色板令牌；颜色必须来自 tokens.ts / subtitle-tokens.ts。`);
    }
  }
  if (props.palette && !ALLOWED_PALETTES.has(props.palette)) {
    throw new Error(`非法 palette「${props.palette}」。只允许 inkBlue（默认，墨蓝·电光）、graphiteIce、glacier（仅建议夜景或深底）。`);
  }
  if (props.legacy && comp && comp !== 'Cards51SubCompare') {
    throw new Error('legacy 仅用于 Cards51SubCompare 的 5.0/5.1 字幕对照，不能用于正式出片。');
  }
  const dumped = JSON.stringify(props);
  if (FORBIDDEN.test(dumped)) {
    throw new Error('检测到试图通过 props 覆盖锁定令牌。字幕与色板以源码令牌为准。');
  }
}

export function assertArgvProps(argv, {comp} = {}) {
  const raw = argv.find((x) => x.startsWith('--props='));
  if (raw && FORBIDDEN.test(raw)) {
    throw new Error('命令行 --props 试图覆盖锁定的字幕或色板令牌，已拒绝。');
  }
  assertRenderProps(parsePropsArg(argv), {comp});
}
