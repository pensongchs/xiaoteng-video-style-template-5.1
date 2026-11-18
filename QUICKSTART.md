# 小滕视频风格模板5.1 · 快速上手

更完整的约束见根目录 `AGENTS.md`。下面是最小操作路径。

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

阅读 `AGENTS.md` 第 6 节决策表。编辑：

- `src/demo/shots.ts`：每镜 `layout`、`at`、`anchors`、`bg`、`data`、`title` / `kicker`
  - 流程类版式（stepRail、timeline、dataCluster、noteGroup、riskGroup、floorLadder…）**每一项**都要在 `anchors` 绑口播里说到它的词，按口播先后递增，例如 `anchors: {r0: '小区', r1: '楼栋', r2: '户型', r3: '成交'}`；连线自动在两端卡片停稳后依次长出（AGENTS.md 第 3A 节，`npm run check:sequence`）
- `episode-plan.json`：与镜头表一致；需要数字的项加 `evidence`

内容短时优先：`dataCluster`、`comparePair`、`stepRail`、`riskGroup`、`noteGroup`。只使用已登记 layout。颜色不要写在镜头数据里。

背景视频优先免费高清航拍或有质感实景，生成图只放在能加强表达的位置。列举和对比用图片框 + 文字标题。素材放到 `public/media/` 并登记。

## 检查

```bash
npm run verify          # 必须通过
npm run verify -- --dom # 正式交付建议加上
```

不要改 `style-lock.json` 或 `color-allowlist.json` 来通过检查。

## 预览与导出

```bash
# 先片头预览，再正片试看，交给用户审看
npm run render -- --comp=Opening --out=out/片头预览.mp4
npm run stills
npm run render -- --out=out/正片审看.mp4

# 用户批准后再正式导出
npm run render -- --out=out/成片.mp4
```

`npm run render` 会先跑 verify；检查失败、非法色板 / 字幕 props、或把安装样例导出成「成片」都会被拒绝。
