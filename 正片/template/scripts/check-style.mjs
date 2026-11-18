import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(readFileSync(new URL('./style-lock.json',import.meta.url),'utf8')),errors=[];
for(const [file,want] of Object.entries(lock.files)){
 const p=resolve(root,file);if(!existsSync(p)){errors.push('缺共用文件 '+file);continue;}
 const got=createHash('sha256').update(readFileSync(p)).digest('hex');if(got!==want)errors.push('共用风格实现已改动 '+file);
}
if(errors.length)throw Error(errors.join('\n')+'\n单期仅改文案、素材、锚点和配置；共用风格变更须用户明确要求并完整验收。不得为通过检查重写指纹。');
console.log('共用风格指纹通过 '+lock.revision+'（不含当期文案、素材和配置）');
