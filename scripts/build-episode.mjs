// 在当期工程执行，按原声时钟渲染完整composition，不把片头重复插到原声前。
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {existsSync,mkdirSync,readFileSync} from 'node:fs';
const project=resolve(process.argv[2]||'.');
if(!existsSync(join(project,'src/demo/Demo.tsx')))throw Error('需要当期完整工程');
if(!existsSync(join(project,'episode-plan.json')))throw Error('缺少与实际shots一致的episode-plan.json');
if(JSON.parse(readFileSync(join(project,'src/demo/episode.json'),'utf8')).previewOnly)throw Error('安装样例不能作为正式成片；先填写真实口播、字幕和本期镜头');
const run=(args)=>{const r=spawnSync(process.execPath,args,{cwd:project,stdio:'inherit'});if(r.error)throw r.error;if(r.status)process.exit(r.status);};
run(['--experimental-strip-types','--no-warnings','scripts/check-episode.mjs','episode-plan.json']);
run(['scripts/check-style.mjs']);
run(['--experimental-strip-types','--no-warnings','scripts/check-layout.mjs']);
mkdirSync(join(project,'成片'),{recursive:true});
const cli=join(project,'node_modules/@remotion/cli/remotion-cli.js');
run([cli,'render','src/index.ts','Style50-Demo','成片/完整成片.mp4','--codec=h264','--crf=18','--pixel-format=yuv420p']);
run([cli,'render','src/index.ts','Opening','成片/片头.mp4','--codec=h264','--crf=16','--pixel-format=yuv420p']);
console.log('已输出完整成片和独立片头；交付前还需完整解码、原声与画面验收');
