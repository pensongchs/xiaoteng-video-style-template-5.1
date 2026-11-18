export const openingConfig={
  "enabled": false,
  "skyline": "media/template-city.mp4",
  "projectTitle": "定版片头示例",
  "fps": 50,
  "durationInFrames": 108,
  "timingMs": {
    "focus": 340,
    "turn": 892,
    "verdict": 1480
  },
  "text": {
    "prefix": "看房",
    "focus": "越多",
    "turn": "反而越容易",
    "verdict": "买错？"
  },
  "cards": [
    {
      "x": 1194,
      "y": 172,
      "w": 410,
      "h": 540,
      "at": 0,
      "src": "media/gen/opening_cutout.png"
    },
    {
      "x": 1114,
      "y": 230,
      "w": 450,
      "h": 570,
      "at": 220,
      "src": "media/gen/cutouts/选房住宅.png"
    },
    {
      "x": 1030,
      "y": 296,
      "w": 500,
      "h": 580,
      "at": 500,
      "src": "media/gen/cutouts/选房住宅.png"
    }
  ],
  "colors": {
    "background": "#07090f"
  }
} as const;
