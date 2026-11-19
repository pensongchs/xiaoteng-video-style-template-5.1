// 片头节拍检查（纯静态，不渲染）：npm run check 会跑。规则见 src/openingBeats.ts 与 制作说明。
import {openingConfig} from '../src/openingConfig.ts';
import {openingFaults, beatsOf} from '../src/openingBeats.ts';
const errs = openingFaults(openingConfig);
if (errs.length) { console.error('✗ 片头节拍检查失败：\n  - ' + errs.join('\n  - ')); process.exit(1); }
console.log(`✓ 片头节拍通过：${beatsOf(openingConfig).length} 拍，相邻 ≤1.5s，逐句取自口播`);
