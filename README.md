# flashgame — Flash 小游戏反编译与 H5 翻新工作区

反编译 Flash 游戏 → 提取数据与玩法逻辑 → HTML5 重制。
每个游戏一个子文件夹，反编译证据与工具本地保留不入库。

## 目录结构

```
flashgame/
├── territory-defense/   # 《领土防御》H5 游戏 (当前主线)
│   ├── index.html       # 入口 (原版 800x600 舞台布局)
│   ├── game.js          # 游戏核心 (迷雾/波次/武器/操作)
│   ├── data.js          # 原版数据 (武器/底盘/波次/路点, 反混淆源码对号)
│   ├── map.jpg          # 原版地图位图 (chid764)
│   ├── smoke_test.js    # 无头冒烟测试 (node smoke_test.js)
│   └── assets/          # 原版素材 (FFDec 权威导出, 全部带 chid 对号)
├── docs/                # 文档与剧情翻译
│   ├── TCS_剧情翻译.md / TCS_逐关剧情详细翻译.md
│   ├── resource_inventory.md / weapon_analysis.md   # 早期盘点 (部分已被 deobf/data 取代)
│   └── story_en.txt     # 原版剧情英文原文
├── tools/               # 早期一次性分析脚本 (已被 deobf/ 工具链取代, 留档)
├── deobf/               # 反混淆工程 (代码入库, 大体积输出不入库)
│   ├── deobfuscate.py   # AS2 状态机还原 (343/343)
│   ├── pcode2as.py      # AVM1 字节码 → 伪代码
│   ├── extract_waypoints.py 等
│   ├── GAME_LOGIC.md    # 玩法逻辑清单
│   ├── PROGRESS.md      # 资源还原看板
│   └── data/            # 权威对号数据 JSON (武器/路点/炮塔帧/声音/精灵)
├── tower-bloxx/         # 《都市摩天楼 Tower Bloxx》反编译 (AS2, bz.esg.game 包, 未混淆)
├── paper-war/           # 《Paper Defense》反编译 (AS3, 276 类, 未混淆)
├── rise-of-the-tower/   # 《Rise of the Tower》反编译 (AS3, 已混淆 §_-xx§)
├── rise-of-the-colony/  # 《Rise of the Colony》反编译 (AS3, 328 类, 未混淆)
├── vk1939/              # 《VK 1939》审计工程 (见其 README)
├── swf_dump.txt         # FFDec -dumpSWF 权威 dump (deobf 脚本引用, 保留根目录)
└── .gitignore           # decompiled/ deobf输出 ffdec/ *.swf 等大体积产物
```

## 游戏本体（入库）

### [领土防御 Territory Defense](territory-defense/)
原作《The Commander's Sister》的 H5 重制。去除全部剧情，忠实还原玩法，
并加入新设定：**战争迷雾**（塔提供射程外一小圈视野，雷达站消除 1200 范围迷雾，
建造不受视野限制）与**对空升级**（任意塔付费解锁对空）。

操作（还原原版 master_clavier）：方向键持续滚动 / 鼠标边缘滚屏（M 开关）、
小地图点击+拖拽跳转、H 血条、C 建造区、G 全图（39%）、S 卖（75% 折价）、
R 修理、U 对空升级、空格取消。

本地运行：`cd territory-defense && python -m http.server 8123`，
浏览器打开 `http://127.0.0.1:8123/`。无头验证：`node smoke_test.js`。

## 工作流约定

- 大体积产物（SWF、反编译输出、反混淆输出、工具）全部 `.gitignore`，只保留游戏本体与数据
- 每个游戏文件夹自带可运行入口（index.html）与无头冒烟测试（`node smoke_test.js`）
- 素材一律以 FFDec 权威输出对号（帧标签 / shape→bitmap 链），禁止猜测，对号依据写入注释

## 工具（本地保留，不入库）

- `ffdec/` — JPEXS Flash Decompiler（CLI 可用）
- `TCS.swf` / `TCS_uncompressed.swf` — 原始 SWF
- `decompiled/` — FFDec 全量导出（shapes/scripts/images）
- `deobf/pcode*/`、`deobf/__pycache__/` — 反混淆中间产物
