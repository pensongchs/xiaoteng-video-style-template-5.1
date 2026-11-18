// 渲染成片 / 打开预览（跨平台）。5.1：检查未通过或非法 props 时拒绝渲染。
//   npm run render                         → out/成片.mp4（全片，需本期口播）
//   npm run render -- --frames=0-89        → 只渲染前 3 秒（快速试片）
//   npm run render -- --out=out/xxx.mp4    → 指定输出
//   npm run render -- --no-subs           → 不烧字幕；--no-highlight → 字幕不做当前词高亮
//   npm run render -- --palette=inkBlue   → 可选色板（默认 inkBlue）
//   npm run render -- --preview           → 允许导出安装样例预览（非正式成片）
//   npm run studio                         → 打开 Remotion Studio 预览
import {existsSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {remotionCli} from './_util.mjs';
import {ensureEpisode} from './episode.mjs';
import {ensurePreviewAudio} from './preview-audio.mjs';
import {assertArgvProps, assertRenderProps, parsePropsArg} from './guard-props.mjs';

const a = process.argv.slice(2);
const get = (k) => a.find((x) => x.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const browserPath = process.env.REMOTION_BROWSER_EXECUTABLE || process.env.REMOTION_BROWSER || (existsSync('.runtime/browser.json') ? JSON.parse(readFileSync('.runtime/browser.json', 'utf8')).path : null);
const browser = browserPath ? [`--browser-executable=${browserPath}`] : [];
const comp = get('comp') || 'Style51-Demo';

if (a.includes('--no-verify')) {
  console.error('✗ 禁止 --no-verify。5.1 要求 npm run verify 通过后才能渲染；跳过检查的输出不能作为模板风格成片。');
  process.exit(1);
}

try {
  assertArgvProps(a, {comp});
} catch (e) {
  console.error('✗ ' + e.message);
  process.exit(1);
}

ensurePreviewAudio();
const episode = ensureEpisode();

if (episode.previewOnly && !a.includes('--preview') && !a.includes('--studio') && !String(comp).startsWith('Cards51') && !String(comp).startsWith('Mg') && !String(comp).startsWith('Opening') && !String(comp).includes('Sample') && !String(comp).includes('Contact')) {
  console.error('✗ 当前是安装样例（previewOnly），不能当作正式成片导出。请先放入本期口播和字幕并运行 npm run episode。若只想导出样例预览，请加 --preview，且不要把文件命名为成片。');
  process.exit(1);
}

if (!a.includes('--studio')) {
  const check = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', 'scripts/verify.mjs'], {stdio: 'inherit'});
  if (check.error) throw check.error;
  if (check.status) {
    console.error('✗ verify 未通过，拒绝渲染。');
    process.exit(check.status);
  }
}

if (a.includes('--studio')) process.exit(remotionCli(['studio', 'src/index.ts', ...browser]).status ?? 0);

const out = get('out') || 'out/成片.mp4';
if (episode.previewOnly && /成片/.test(out) && a.includes('--preview')) {
  console.error('✗ 安装样例预览请不要输出为「成片」。例如使用 --out=out/安装样例预览.mp4');
  process.exit(1);
}
const args = ['render', 'src/index.ts', comp, out, '--codec=h264', '--crf=18', '--audio-codec=aac', '--audio-bitrate=192k', ...browser];
const props = parsePropsArg(a);
if (a.includes('--no-subs')) props.subs = false;
if (a.includes('--no-highlight')) props.highlight = false;
if (get('palette')) props.palette = get('palette');
try { assertRenderProps(props, {comp}); }
catch (e) { console.error('✗ ' + e.message); process.exit(1); }
if (Object.keys(props).length) args.push(`--props=${JSON.stringify(props)}`);
if (get('frames')) args.push(`--frames=${get('frames')}`);
const r = remotionCli(args);
if (r.status === 0) console.log(`✓ ${out}`);
process.exit(r.status ?? 1);
