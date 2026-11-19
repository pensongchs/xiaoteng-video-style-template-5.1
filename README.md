# 小滕视频风格模板5.1

与 5.0 共存的独立正片模板。视觉基准：墨蓝·电光玻璃卡、5 款小卡组合、冰蓝标题/字幕强调。标识 `5.1.1-2026-11-18「图卡与可读性」`（在 5.1「顺序与连线」之上：大卡放图、自绘户型图、统一字阶、无黑字、图表重做、片尾互动）。

**调用本模板前必须阅读并遵守 [AGENTS.md](AGENTS.md)（即《[模板输出约束标准](模板输出约束标准.md)》）。** 风格靠已登记版式、锁定令牌和 `npm run verify` 强制执行，不能重新设计。

![5.1 → 5.1.1 对比](previews/current/01_5.1对比5.1.1_联系表.jpg)

![样例抽帧](previews/current/07_5.1.1顺序与连线_样例抽帧.jpg)

![选卡池 38 款总览](previews/current/03_5.1.1墨蓝电光_38款选卡池总览.jpg)

![图表](previews/current/08_图表_大字直标_依次长出.jpg)

![片尾](previews/current/09_片尾_小滕互动.jpg)

![字幕前后对比](previews/current/04_字幕前后对比.jpg)

- 中文调用名：小滕视频风格模板5.1
- 安装与制作入口：[SKILL.md](SKILL.md)
- 快速上手：见 AGENTS.md 第 12 节，或 [QUICKSTART.md](QUICKSTART.md)
- 出片标准：[references/出片标准.md](references/出片标准.md)
- 安装与运行：[references/安装与运行.md](references/安装与运行.md)
- 版式目录：[正片/references/版式目录.md](正片/references/版式目录.md)
- 素材规则：[正片/references/素材与生图规则.md](正片/references/素材与生图规则.md)
- 预览样张：[previews/current/](previews/current/)

源码与压缩样张随包；不打包完整成片、stock 原片、模型、node_modules、运行缓存和字体。字体按 `正片/template/scripts/resources.json` 的 URL 与 SHA256 在 `npm run setup` 时下载。依赖按锁文件安装，不自动升级。

建议仓库名（由 GitHub 仓库管理员创建，默认私有）：`pensongchs/xiaoteng-video-style-template-5.1`。
