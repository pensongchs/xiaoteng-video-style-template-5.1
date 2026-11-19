// 5.1 出片前强制检查。任一失败则渲染视为无效。
//   npm run verify
//   npm run verify -- --dom    另做小卡组合 +（可选）本期 DOM 检查
import {spawnSync} from 'node:child_process';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ensurePreviewAudio} from './preview-audio.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
ensurePreviewAudio(root);

// 未配置真实镜头时明确阻断，避免样例与本期口播混用。
const episode = JSON.parse(readFileSync('src/demo/episode.json', 'utf8'));
const plan = existsSync('episode-plan.json') ? JSON.parse(readFileSync('episode-plan.json', 'utf8')) : null;
if (!episode.previewOnly && String(plan?.purpose ?? '').includes('安装样例')) {
  console.error('✗ 检测到安装示例镜头与真实口播混用：请按本期口播替换 shots.ts 和 episode-plan.json，再重新运行 verify。');
  process.exit(1);
}
const {SHOTS} = await import('../src/demo/shots.ts');
if (!SHOTS.length) {
  console.error('✗ 本期镜头表为空：请根据口播与时间码完成选材、正式版式、锚点和 episode-plan.json，然后重新运行 verify。');
  process.exit(1);
}

const argv = process.argv.slice(2);
const steps = [
  {name: 'TypeScript', cmd: ['node_modules/typescript/bin/tsc', '--noEmit']},
  {name: '风格指纹', cmd: ['scripts/check-style.mjs']},
  {name: '颜色守卫', cmd: ['scripts/check-colors.mjs']},
  {name: '可读性/字阶', cmd: ['--experimental-strip-types', '--no-warnings', 'scripts/check-readability.mjs']},
  {name: '约束', cmd: ['--experimental-strip-types', '--no-warnings', 'scripts/check-constraints.mjs']},
  {name: '定格冻结', cmd: ['scripts/check-freeze.cjs']},
  {name: '顺序与连线', cmd: ['scripts/check-sequence.cjs']},
  {name: '镜头表/样例结构', cmd: ['--no-warnings', 'scripts/check-layout.mjs']},
];
if (argv.includes('--dom')) {
  steps.push({name: '小卡组合 DOM', cmd: ['--experimental-strip-types', '--no-warnings', 'scripts/cards51-domcheck.mjs']});
}

let failed = 0;
for (const s of steps) {
  console.log(`\n—— ${s.name} ——`);
  const r = spawnSync(process.execPath, s.cmd, {stdio: 'inherit', cwd: root});
  if (r.error) { console.error(r.error); failed++; continue; }
  if (r.status) { console.error(`✗ ${s.name} 失败`); failed++; }
}
if (failed) {
  console.error(`\n✗ verify 未通过（${failed} 项）。渲染结果不能视为有效成片，禁止把失败当成风格已对齐。`);
  process.exit(1);
}
console.log('\n✓ verify 通过：指纹、颜色、可读性/字阶、约束、冻结、顺序与连线、镜头结构均符合 5.1.1 输出标准。静态通过不能代替画面检查。');
