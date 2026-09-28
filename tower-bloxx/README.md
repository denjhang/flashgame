# Tower Bloxx（都市摩天楼）

Digital Chocolate 原版 Flash 游戏（Flash 7, AS2），反编译导出完成。

## 文件

- `towerbloxx.swf` — 原始 SWF（CWS zlib 压缩）
- `towerbloxx-dec.swf` — 解压后版本（FFDec 输入用）
- `Tower-Bloxx_J2ME_EN_*.zip/.jar` — J2ME 手机版多个版本（原始压缩包，在 `j2me/jars/`）
- `j2me/` — J2ME 反编译工程（见下）
- `scripts/` — FFDec 导出的 AS（246 个文件，未入库）

## 代码结构

AS2 类在 `scripts/scripts/__Packages/bz/esg/game/`，符号名完整未混淆，共约 3800 行：

| 类 | 内容 |
|---|---|
| `Const.as` (224行) | 全部常量表：舞台 640x480、摆钩周期 CRANE_DUR=2600ms、摆幅 SWAY_MAX_ANGLE=1、连击窗口 COMBO_SECS=5、积木高 BLOCK_H=64、城市地图 5x5 格（52px/格）、3 条命 |
| `Tower.as` (400行) | 摆钩/落块判定与摇晃物理 |
| `GameModel.as` / `GameState.as` | 状态机与玩法流程 |
| `CityMap.as` (665行) | 城市建设模式（放置塔、人口结算） |
| `Crane.as` / `Person.as` / `ComboTimer.as` | 吊钩、小人、连击计时 |

时间轴与按钮脚本在 `scripts/scripts/` 根部（`block*_spr.as`、`tower_spr.as`、`crane_spr.as` 等）。

## J2ME 版反编译（j2me/）

共 11 个 jar（Nokia《City Bloxx》v1.0.11/v1.0.12 各 3+5 个变体、Digital Chocolate《Tower Bloxx》v1.2.11/v1.5.07），
全部用 CFR 0.152 反编译到 `j2me/src/<jar名>/`（共 240 个 .java，未入库）。
类名被混淆成单字母（a.class…），但 `House.java`、`GameMIDlet.java` 等主类可读，逻辑完整。

**重要发现：J2ME 版全部使用 JSR-184（Mobile 3D Graphics）**，Nokia 版与 DC 版源码里都有
`javax.microedition.m3d.Graphics3D` 调用（Nokia v1.0.12 在 `n.java`，DC v1.5.07 在 `m.java`），
渲染的就是 jar 里那个 121KB 的 `scene.m3g` 场景模型——用户所说"动用诺基亚 3D 机能"属实。

`j2me/res/` 为按魔数鉴别的资源（已重命名）：

| 版本 | 内容 |
|---|---|
| `nokia_v1011/` `nokia_v1012/` | 9 首 MIDI 音乐、`scene.m3g`（JSR184 3D 场景）、`font.bin`、`palette.aco`、40+ 语言文件 |
| `dc_v1211/` `dc_v1507/` | `scene.m3g`、`font.bin`、`palette.aco`、7 个语言包（无 MIDI，音效内嵌其他格式） |

m3g 文件可用 M3G Viewer / JSR-184 模拟器查看；H5 重制如需 3D 视角参考，以 `scene.m3g` 为准。

## 下一步

数值审计入口：Flash 版 `Const.as` + `Tower.as`（落块偏移判定、摇晃角速度模型）；
J2ME 版主逻辑入口：`House.java`（主游戏状态机）+ `n.java`/`m.java`（3D 渲染）。
