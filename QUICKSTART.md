# 小滕视频风格模板5.1 · 快速上手

更完整的约束见根目录 `AGENTS.md`（先读第 0、3B、3A、6、7 节）。下面是最小操作路径。风格靠已登记版式、锁定令牌和 `npm run verify` 强制执行，不能重新设计。

## 安装

需要 Node ≥ 22.18、npm、FFmpeg，以及可渲染的 Chrome / Headless Shell。

```bash
node /path/to/小滕视频风格模板5.1/scripts/create-project.mjs /path/to/outputs/本期名
cd /path/to/outputs/本期名
npm run setup
```

若本机有 `~/.codex/shared-node-dependencies/ensure.mjs`，setup 会复用共享依赖。字体不在仓库里，setup 会按 SHA256 下载。

## 放入期素材

在工程内创建 `episodes/本期名/`，放入：

- 一个口播音频（mp3 / m4a / wav / aac / flac / ogg）
- 字幕：`*.srt`（句级）和 / 或 Remotion Caption `*.json`（逐词，用于卡拉 OK 和精确锚点）

然后：

```bash
npm run episode -- 本期名
```

## 选版式并填镜头

新工程镜头表为空。根据本期字幕和原声主动完成镜头表、素材和锚点，再执行检查；不要使用安装示例替代本期内容。

阅读 `AGENTS.md` 第 6 节决策表和第 3B 节。编辑：

- `src/demo/shots.ts`：每镜 `layout`、`at`、`anchors`、`bg`、`data`、`title` / `kicker`
  - 只选 `POOL_LAYOUTS` 里的 38 款，不要用已退役的纯文字重卡（`quoteStack`、`pitfallBoard` 等 10 款）
  - 大卡必须有图或图表，纯文字进小卡；户型用随包 `public/media/floorplan/plan_3br2ba`
  - 不要手写颜色或小卡字号；卡面用浅色字，不用黑字
  - 流程类版式（stepRail、timeline、dataCluster、noteGroup、riskGroup、floorLadder…）**每一项**都要在 `anchors` 绑口播里说到它的词，按口播先后递增，例如 `anchors: {r0: '小区', r1: '楼栋', r2: '户型', r3: '成交'}`；连线自动在两端卡片停稳后依次长出（AGENTS.md 第 3A 节，`npm run check:sequence`）
- `episode-plan.json`：与镜头表一致；需要数字的项加 `evidence`

内容短时优先：`dataCluster`、`comparePair`、`stepRail`、`riskGroup`、`noteGroup`。只使用已登记 layout。颜色不要写在镜头数据里。

背景视频优先免费高清航拍或有质感实景，生成图只放在能加强表达的位置。列举和对比用图片框 + 文字标题。素材放到 `public/media/` 并登记。

## 检查

```bash
npm run verify          # 必须通过（含可读性/字阶、大卡放图、退役版式、顺序连线）
npm run verify -- --dom # 正式交付建议加上；仓库不含 stock，需先 npm run stock 或补齐背景
```

不要改 `style-lock.json` 或 `color-allowlist.json` 来通过检查。检查失败时修的是镜头配置、文案或素材，不是检查本身。

## 预览与导出

```bash
# 检查片头预览与正片代表帧
npm run render -- --comp=Opening --out=out/片头预览.mp4
npm run stills
npm run render -- --out=out/正片审看.mp4

# 检查通过后正式导出
npm run render -- --out=out/成片.mp4
```

`npm run render` 会先跑 verify；检查失败、非法色板 / 字幕 props、或把安装样例导出成「成片」都会被拒绝。
