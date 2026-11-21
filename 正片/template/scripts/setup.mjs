import {readFileSync,writeFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {ensurePreviewAudio} from './preview-audio.mjs';
const require=createRequire(import.meta.url),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const major=Number(process.versions.node.split('.')[0]);if(major<22)throw Error('需要Node≥22.18');
require('./runtime.cjs').prepareDependencies();
const manifest=JSON.parse(readFileSync(new URL('./resources.json',import.meta.url),'utf8'));
const cache=join(process.env.CODEX_HOME||join(homedir(),'.codex'),'shared-node-dependencies','resource-cache');
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const item of manifest.files){
 const target=resolve(root,item.target);if(!target.startsWith(root+'/')&&!target.startsWith(root+'\\'))throw Error('资源路径越界');
 if(existsSync(target)&&hash(readFileSync(target))===item.sha256)continue;
 mkdirSync(cache,{recursive:true});const cached=join(cache,item.sha256);let bytes;
 if(existsSync(cached)&&hash(readFileSync(cached))===item.sha256)bytes=readFileSync(cached);
 else{const response=await fetch(item.url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('资源下载失败 '+response.status+' '+item.url);bytes=Buffer.from(await response.arrayBuffer());if(hash(bytes)!==item.sha256)throw Error('资源SHA256不符 '+item.target);writeFileSync(cached,bytes);}
 mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);console.log('资源已校验 '+item.target);
}
const numeral=join(root,'public/fonts/Style40-Arial-Bold.ttf');
if(!existsSync(numeral)){
 const src=[process.env.XT_ARIAL_BOLD,'C:/Windows/Fonts/arialbd.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf','/Library/Fonts/Arial Bold.ttf'].filter(Boolean).find(existsSync);
 if(!src)throw Error('缺少Arial Bold数字字体，请提供本机合法字体路径XT_ARIAL_BOLD，不自动替换');
 mkdirSync(dirname(numeral),{recursive:true});copyFileSync(src,numeral);
}
// 5.1.5 片头 039 ASCII 背景：官方固定提交下载 + 本机适配（不随仓库分发）
await new Promise((ok,no)=>{const r=require('node:child_process').spawnSync(process.execPath,[join(root,'scripts/fetch-ascii-bg.cjs')],{stdio:'inherit'});r.status?no(Error('039 背景准备失败')):ok();});
const renderer=require('@remotion/renderer');let browser=process.env.REMOTION_BROWSER_EXECUTABLE;
if(!browser){const b=await renderer.ensureBrowser({chromeMode:'headless-shell'});browser=b.path;}
if(!existsSync(browser))throw Error('渲染浏览器不可用');mkdirSync(join(root,'.runtime'),{recursive:true});writeFileSync(join(root,'.runtime/browser.json'),JSON.stringify({path:browser},null,2));
ensurePreviewAudio(root);
console.log('共享依赖、字体与渲染浏览器已就绪');
