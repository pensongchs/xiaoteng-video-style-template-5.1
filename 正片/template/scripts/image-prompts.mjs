// 5.1.5 生图钩子：从镜头表（src/demo/shots.ts）列出每个图片组件镜的 {镜, 版式, 关键词 kw, 提示词 prompt, src, 是否已有文件}。
//   npm run images:plan            → 表格
//   npm run images:plan -- --json  → JSON（交给生图工具逐条生成，产物放 public/<src> 并登记 public/media/gen/img515/ledger.json）
// 规则：kw 必须是本镜口播原词；prompt 必须含 kw；写实照片、冷色或中性光、无文字/水印/人脸特写；1280–1600px 长边。
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {SHOTS} from '../src/demo/shots.ts';
import {IMAGE_LAYOUTS} from '../src/style/layouts.ts';
import {imageRefsOf} from '../src/images51/specs.ts';

const root = resolve(import.meta.dirname, '..');
const rows = [];
for (const s of SHOTS) {
  if (!IMAGE_LAYOUTS.includes(s.layout)) continue;
  for (const r of imageRefsOf(s.layout, s.data ?? s)) rows.push({shot: s.id, layout: s.layout, kw: r?.kw ?? '', prompt: r?.prompt ?? '', src: r?.src ?? '', exists: !!r?.src && existsSync(resolve(root, 'public', r.src))});
}
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else {
  for (const r of rows) console.log(`${r.exists ? '✓' : '✗ 待生成'}  ${r.shot}/${r.layout}  「${r.kw}」  ${r.src}\n     ${r.prompt}`);
  console.log(`\n共 ${rows.length} 张图（${rows.filter((r) => !r.exists).length} 张待生成）。生成后跑 npm run plan:check 核对 kw/提示词/口播出处。`);
}
