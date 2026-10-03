# flashgame — Flash/J2ME 小游戏反编译与 H5 翻新工作区

反编译 Flash/J2ME 游戏 → 提取数据与玩法逻辑 → HTML5 重制。
每个游戏一个子文件夹，反编译证据与工具本地保留不入库。

## 目录结构（2026-10-04 整理）

```
flashgame/
├── tcs/                 # 《领土防御》TCS 集群（反混淆 + H5 移植 + 全部证据链）
│   ├── territory-defense/  # ★ H5 游戏本体 (迷雾/波次/武器, node smoke_test.js 验证)
│   ├── deobf/              # 反混淆工程 (343/343, data/ 为权威对号 JSON)
│   ├── decompiled/         # FFDec 全量导出 (不入库)
│   ├── ffdec/              # JPEXS 反编译器 (本地, 不入库)
│   ├── docs/               # TCS 剧情翻译与资源盘点
│   ├── tools/              # 早期一次性分析脚本 (留档)
│   └── TCS*.swf, swf_dump.txt  # 原始 SWF 与权威 dump
├── tower-bloxx/         # 《都市摩天楼》主线: J2ME 快速模式 H5 忠实移植
│   ├── h5quick/          #   ★ 主线 (纯 J2ME 公式/资产; python -m http.server 8210)
│   ├── h5/               #   旧版 (已冻结)
│   └── j2me/             #   J2ME 逆向 (deobf/ 权威底本 + EMULATOR_NOTES.md 模拟器笔记)
├── j2me_ref/            # J2ME 模拟器参考项目 (详见其 README.md)
│   ├── freej2me-web-main/  #   ★ 8211: CheerpJ 版, City Bloxx 带完整 3D (serve_local.py)
│   ├── j2me-web-main/      #   4173: miniJVM-wasm 秒开版 (node server.mjs, 真 Chrome 打开)
│   ├── esp32/              #   ESP32 跑 J2ME 先例 (Flint JVM + Diamond Rush + FreeJ2ME 源码)
│   ├── ref-projects/       #   wie / pluotsorbet (均无法跑 City Bloxx 3D)
│   └── _archive/           #   原始 zip / 旧截图 / 构建缓存
├── flash/               # Flash 播放器技术调研 (ESP32-P4 可行性)
│   └── flash-libs/      #   swf-rs / swf-parser / avmore (AVM1) + 路线图 README
├── games/               # 其他已反编译游戏
│   ├── paper-war/ rise-of-the-tower/ rise-of-the-colony/  # AS3 反编译
│   ├── vk1939/          # VK 1939 审计工程
│   └── 游戏swf/         # 怀旧 Flash 合集 (SWF 不入库; flash_loader.htm 与安卓 APK 入库)
├── _archive/            # 原始 zip (J2ME-Web-Core / freej2me-web / ffdec)
├── AGENTS.md            # 项目记忆 (GitHub 镜像源 + aria2c 下载法)
└── .gitignore
```

## 游戏本体（入库）

### [领土防御 Territory Defense](tcs/territory-defense/)
原作《The Commander's Sister》的 H5 重制。战争迷雾 + 对空升级新设定。
`cd tcs/territory-defense && python -m http.server 8123`；无头验证 `node smoke_test.js`。

### [都市摩天楼 h5quick](tower-bloxx/h5quick/)
J2ME 版快速模式盖楼的忠实移植（纯 J2ME 公式/资产）。
`python -m http.server 8210`；原版对照用 j2me_ref 模拟器（见 tower-bloxx/j2me/EMULATOR_NOTES.md）。

## 工作流约定

- 大体积产物（SWF、反编译/反混淆输出、工具）全部 `.gitignore`，只保留游戏本体与数据
- 每个游戏文件夹自带可运行入口与无头冒烟测试（`node smoke_test.js`）
- 素材一律以 FFDec 权威输出对号（帧标签 / shape→bitmap 链），禁止猜测，对号依据写入注释
- 下载 GitHub 资源用镜像 + aria2c（见 AGENTS.md）
