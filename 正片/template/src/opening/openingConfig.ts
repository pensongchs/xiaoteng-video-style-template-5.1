// 5.1.5 片头配置（《小滕片头风格模板》：蓝青 ASCII 字符底 + 透明抠像 + 冰蓝银主题字与收句红章 + 图文左右接力）。
// 片头 = 口播第 1 句，只这一句：时长 = 第 1 句口播时长（vo.startMs→vo.endMs），拍点 = 第 1 句里的短语起点；说完立刻切正片。
// 换期：vo.text 换成本期口播第 1 句；timingMs 换成真实 SRT/逐字时间码的短语起点；cards 换本期透明抠像。plan:check 会核对。
export const openingConfig = {
  "enabled": false,
  "projectTitle": "定版片头示例",
  "background": {"libraryId": 39, "name": "蓝青渐变ASCII字符背景"},
  "fps": 50,
  "durationInFrames": 130,
  "vo": {
    "text": "看房越多，反而越容易买错？",
    "startMs": 0,
    "endMs": 2600,
    "timingBasis": "随包示例时间码，未配音；制作时换成本期第 1 句的真实 SRT",
    "anchors": {"focus": "越多", "turn": "反而", "verdict": "买错"}
  },
  "timingMs": {"focus": 340, "turn": 892, "verdict": 1480},
  "text": {"prefix": "看房", "focus": "越多", "turn": "反而越容易", "verdict": "买错"},
  "warm": [],
  "stamp": {},
  "identity": "极限小滕 房产科普",
  "extra": [],
  "cards": [
    {"src": "media/gen/cutouts/现代住宅.png", "at": 0},
    {"src": "media/gen/cutouts/成熟社区住宅.png", "at": 340},
    {"src": "media/gen/cutouts/住宅组团.png", "at": 892}
  ],
  "colors": {"background": "#061629"}
} as const;
