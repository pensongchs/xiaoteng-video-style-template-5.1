// 片头 039「蓝青渐变ASCII字符背景」：按《小滕片头风格模板》从官方固定提交下载（sha256 校验）并在本机适配成视频时钟驱动。
// 背景源码不随仓库分发（.gitignore 已排除生成物）；装依赖 / 首次渲染片头前运行一次：node scripts/fetch-ascii-bg.cjs
// 生成：src/opening/AsciiGradientBackground.jsx / .css，.runtime/React-Bits-LICENSE.md
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const src = fs.existsSync(path.join(root, 'src/opening')) ? path.join(root, 'src/opening') : path.join(root, 'src');
const sources = require('./ascii-bg/sources.json').background;
const adapt = require('./ascii-bg/adapt-background.cjs');
const get = async (url, sha) => {
  const r = await fetch(url); if (!r.ok) throw Error(`下载失败 ${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer()); const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (h !== sha) throw Error(`校验失败（官方源已变化？）${url}\n  期望 ${sha}\n  实得 ${h}`); return buf.toString('utf8');
};
(async () => {
  const out = path.join(src, 'AsciiGradientBackground.jsx');
  if (fs.existsSync(out) && !process.argv.includes('--force')) { console.log('✓ 039 背景已就绪：' + path.relative(root, out)); return; }
  const [jsx, css, lic] = await Promise.all([get(sources.url, sources.sha256), get(sources.cssUrl, sources.cssSha256), get(sources.licenseUrl, sources.licenseSha256)]);
  fs.writeFileSync(out, adapt(jsx)); fs.writeFileSync(path.join(src, 'AsciiGradientBackground.css'), css);
  fs.mkdirSync(path.join(root, '.runtime'), {recursive: true}); fs.writeFileSync(path.join(root, '.runtime/React-Bits-LICENSE.md'), lic);
  console.log(`✓ 039 背景已从 react-bits@${sources.commit.slice(0, 7)} 下载并适配`);
})().catch((e) => { console.error('✗ ' + e.message); process.exit(1); });
