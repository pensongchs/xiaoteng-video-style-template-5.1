// 5.1 出片前强制检查。任一失败则渲染视为无效。
//   npm run verify
//   npm run verify -- --dom    另做小卡组合 +（可选）本期 DOM 检查
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ensurePreviewAudio} from './preview-audio.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
ensurePreviewAudio(root);

const argv = process.argv.slice(2);
const steps = [
  {name: 'TypeScript', cmd: ['node_modules/typescript/bin/tsc', '--noEmit']},
  {name: '风格指纹', cmd: ['scripts/check-style.mjs']},
  {name: '颜色守卫', cmd: ['scripts/check-colors.mjs']},
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
console.log('\n✓ verify 通过：指纹、颜色、约束、冻结、顺序与连线、镜头结构均符合 5.1 输出标准。静态通过不能代替看预览样张与用户批准。');
