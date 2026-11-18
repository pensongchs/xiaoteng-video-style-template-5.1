import {cpSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const skill=resolve(dirname(fileURLToPath(import.meta.url)),'..'),target=resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('用法 node scripts/create-project.mjs 当期工程绝对路径');
if(target===skill||target.startsWith(skill+sep))throw Error('当期工程须放在Skill之外，不要在模板安装目录里写成片');
if(existsSync(join(target,'package.json')))throw Error('已有工程请续接，不覆盖');
mkdirSync(target,{recursive:true});
cpSync(join(skill,'正片/template'),target,{recursive:true,filter:p=>!/(^|[\\/])(node_modules|out|检查|\.runtime|dist|build|\.cache)([\\/]|$)/.test(p) && !/public[\\/]episode[\\/].+\.(wav|mp3|m4a|aac|flac|ogg)$/i.test(p)});
writeFileSync(join(target,'制作说明.md'),`# 当期制作（小滕视频风格模板5.1）

先读模板根目录 AGENTS.md 与《模板输出约束标准》。只改文案、素材、时间码、锚点和已登记版式；颜色只用 tokens.ts / subtitle-tokens.ts，禁止手写 CSS 色值。

1. npm run setup
2. 把口播和字幕放入 episodes/<期名>/ ，执行 npm run episode -- <期名>
3. 按决策表填写 src/demo/shots.ts 与 episode-plan.json（内容短优先小卡组合）
4. 按素材规则准备背景视频和生成图
5. npm run verify 必须通过
6. 先出片头预览，再出正片全片审看；用户批准后才 npm run render
`);
console.log('工程已创建：'+target+'；下一步 npm run setup，阅读 AGENTS.md，填写本期内容后 npm run verify。');
