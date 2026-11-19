// 维护者工具：用户批准改风格后，重签 style-lock.json 的 sha256（会改 revision）。单期制作不得运行。
//   node scripts/write-style-lock.mjs "5.1.2-2026-11-19 卡面内容守卫（说明…）"
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = resolve(root, 'scripts/style-lock.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const revision = process.argv[2];
if (!revision) throw Error('用法：node scripts/write-style-lock.mjs "<revision 说明>"');
const extra = ['scripts/check-readability.mjs', 'scripts/make-floorplan.mjs', 'scripts/check-card-content.mjs', 'src/style/content-guard.ts', 'src/gallery/shots-delivery.ts', 'scripts/plan-check.mjs', 'src/style/provenance.ts', 'src/opening/openingBeats.ts', 'src/style/placeholder.ts'];
const files = {};
for (const f of [...new Set([...Object.keys(lock.files), ...extra])].sort()) files[f] = createHash('sha256').update(readFileSync(resolve(root, f))).digest('hex');
writeFileSync(lockPath, JSON.stringify({revision, files}, null, 2) + '\n');
console.log(`已重签 style-lock.json（${Object.keys(files).length} 个文件）：${revision}`);
