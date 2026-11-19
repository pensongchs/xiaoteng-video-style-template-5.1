import type {Shot} from '../style/types.ts';
/** 无口播的安装样例，正式制作必须替换完整口播、素材、锚点和数据。 */
export const SUBTITLE={show:true,highlight:true};
export const SHOTS:Shot[]=[
  {
    "id": "S01",
    "layout": "titleFloat",
    "at": {
      "ms": 0
    },
    "bg": {
      "src": "media/gen/yl_lowdensity.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "chips": [
        {
          "t": "夏天长",
          "tone": "coral"
        },
        {
          "t": "冬天长",
          "tone": "green"
        }
      ],
      "line1": "西晒是电费",
      "line2": "还是好处",
      "sub": "夏天长：年年交电费；冬天长：多晒一下午",
      "media": {
        "src": "media/preview-house.jpg",
        "label": "午后西晒",
        "tag": "概念图",
        "video": false,
        "trim": 0
      },
      "callout": "看城市，{不看口诀}",
      "icon": "▲"
    },
    "anchors": {
      "entry": 1
    }
  },
  {
    "layout": "floorLadder",
    "title": "楼层怎么挑 {一层层看}",
    "bg": {
      "src": "media/gen/yl_dark.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "floors": [
        {
          "f": "1–3F",
          "k": "低层",
          "s": "出行快 · 防潮防暗"
        },
        {
          "f": "4–8F",
          "k": "中低",
          "s": "性价比高 · 防扬尘"
        },
        {
          "f": "9–15F",
          "k": "中层",
          "s": "采光视野都均衡"
        },
        {
          "f": "16–25F",
          "k": "中高",
          "s": "视野好 · 等梯久"
        },
        {
          "f": "26F+",
          "k": "高层",
          "s": "查消防和防水"
        }
      ]
    },
    "id": "S02",
    "at": {
      "ms": 5000
    },
    "anchors": {
      "entry": 2,
      "r0": "低层",
      "r1": "中低",
      "r2": "中层",
      "r3": "中高",
      "r4": "高层"
    }
  },
  {
    "id": "S03",
    "layout": "riskGroup",
    "title": "签约先看{这三处}",
    "bg": {
      "src": "media/gen/west_sun.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "head": {
        "t": "签约先看",
        "n": "03"
      },
      "items": [
        [
          "交房日期",
          "写明逾期违约"
        ],
        [
          "违约责任",
          "逐条看清"
        ],
        [
          "贷款条款",
          "利率与期限"
        ]
      ],
      "pill": {
        "t": "逐条核对再签"
      }
    },
    "at": {
      "ms": 10000
    },
    "anchors": {
      "entry": 3,
      "r0": "签约先看",
      "r1": "交房日期",
      "r2": "违约责任",
      "r3": "贷款条款"
    }
  },
  {
    "layout": "decisionFork",
    "title": "先问自己 {三个问题}",
    "bg": {
      "src": "media/gen/yl_roof.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "q": "这套房，能不能买？",
      "yes": {
        "k": "可以考虑",
        "tone": "green",
        "mark": "✓",
        "tag": "三条都满足",
        "items": [
          "月供 ≤ 家庭收入 40%",
          "首付后还留应急金",
          "通勤在 1 小时内"
        ]
      },
      "no": {
        "k": "先缓一缓",
        "tone": "coral",
        "mark": "!",
        "tag": "任一不满足",
        "items": [
          "要掏空几家积蓄",
          "收入还不稳定",
          "只是跟风上车"
        ]
      }
    },
    "id": "S04",
    "at": {
      "ms": 15000
    },
    "anchors": {
      "entry": 4,
      "r0": "能不能买",
      "r1": "可以考虑",
      "r2": "先缓一缓"
    }
  },
  {
    "id": "S05",
    "layout": "planSplit",
    "title": "一百平{能用多少}",
    "bg": {
      "src": "media/gen/clean_complex.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {},
    "at": {
      "ms": 20000
    },
    "anchors": {
      "entry": 5
    }
  },
  {
    "id": "S06",
    "layout": "mediaRows",
    "at": {
      "ms": 25000
    },
    "anchors": {
      "entry": 6,
      "r0": "选东户",
      "r1": "选西户",
      "r2": "光凭"
    },
    "title": "东户还是西户？{各有说法}",
    "bg": {
      "src": "media/gen/yl_terrace.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "media": {
        "src": "media/preview-house.jpg",
        "label": "一梯两户 · 东西两户",
        "tag": "概念图",
        "video": false,
        "trim": 0
      },
      "rows": [
        {
          "t": "选东户",
          "s": "上午有太阳，下午不晒",
          "k": "说法一"
        },
        {
          "t": "选西户",
          "s": "冬天下午暖和",
          "k": "说法二"
        },
        {
          "t": "光凭东西两个字",
          "s": "根本定不了",
          "k": "结论"
        }
      ]
    }
  },
  {
    "id": "S07",
    "layout": "dataCluster",
    "title": "冬至能晒{几小时}",
    "bg": {
      "src": "media/gen/water_stain.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "hero": {
        "label": "冬至日照 · 示例",
        "v": "5.0",
        "unit": "小时",
        "sub": "朝南户型参考"
      },
      "items": [
        {
          "k": "朝南优先",
          "v": "晒得足",
          "icon": "sun"
        },
        {
          "k": "西晒遮阳",
          "v": "夏天热",
          "icon": "building"
        },
        {
          "k": "楼距靠前",
          "v": "看遮挡",
          "icon": "search"
        }
      ],
      "pill": {
        "t": "实地看一眼"
      }
    },
    "at": {
      "ms": 30000
    },
    "anchors": {
      "entry": 7,
      "r0": "五小时",
      "r1": "朝南",
      "r2": "西晒",
      "r3": "楼距"
    }
  },
  {
    "id": "S08",
    "layout": "timeline",
    "at": {
      "ms": 35000
    },
    "anchors": {
      "entry": 8,
      "s0": "朝向",
      "s1": "边套",
      "s2": "气候"
    },
    "title": "按{三步}看",
    "bg": {
      "src": "media/gen/yl_inspect.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "steps": [
        {
          "t": "确认楼栋朝向",
          "s": "两户是不是都朝南",
          "chip": "第 1 步"
        },
        {
          "t": "看哪户是边套",
          "s": "窗外是马路还是楼",
          "chip": "第 2 步"
        },
        {
          "t": "想想城市气候",
          "s": "夏天长还是冬天长",
          "chip": "第 3 步"
        }
      ],
      "note": {
        "t": "朝向、边套、气候，{一起看}"
      }
    }
  },
  {
    "id": "S09",
    "layout": "inspectTags",
    "title": "收房先看{这四处}",
    "bg": {
      "src": "media/gen/main_road.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "sceneText": {
        "tag0": [
          "窗边",
          "看水渍"
        ],
        "tag1": [
          "墙角",
          "看空鼓"
        ],
        "tag2": [
          "地漏",
          "放水试"
        ],
        "tag3": [
          "插座",
          "逐个试"
        ]
      }
    },
    "at": {
      "ms": 40000
    },
    "anchors": {
      "entry": 9
    }
  },
  {
    "id": "S10",
    "layout": "outroHost",
    "at": {
      "ms": 45000
    },
    "bg": {
      "src": "media/gen/outro_windows.jpg",
      "dark": 0.46,
      "blur": 0
    },
    "data": {
      "eyebrow": "今天记住这句",
      "line": "不选{优点}最多的",
      "points": [
        "先列最在意的三件事",
        "每套房按三条打分",
        "缺点能接受再下手"
      ],
      "note": "选缺点也能接受的",
      "account": "极限小滕 · 房产知识科普"
    },
    "anchors": {
      "entry": 10
    }
  }
];
