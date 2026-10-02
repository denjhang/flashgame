# Tower Bloxx（都市摩天楼）— J2ME 版快速模式盖楼移植

> **项目目标（2026-10-02 定稿）：专做 J2ME 手机版《Tower Bloxx》快速模式盖楼玩法的 H5 忠实移植。**
> 唯一权威参照 = J2ME 版：`House.java`（玩法语义）+ `r0` 资源包（UI/图标）+ `scene.m3g`（3D 场景）+ MIDI 曲库 + 中文语言包。
> Flash 网页版（AS2）为姊妹作，仅作交叉验证参考与部分 2D 特效/小人素材来源；City 建造模式为非目标（已实现部分冻结保留）。

## 当前状态

- **主线收口**：House.java 98/98 方法建档（PARITY §14）、r0 89/89 资源消费点定位（PARITY §13.1）、
  T48 差异表六项全部落地（摆钩定点正弦/塔摇摆/撞塔多块连锁/程序渐变天空/中断续档/落地角标）。
- H5 默认走 J2ME 语义（`G.j2me=true`）：`j2Hook()` 摆钩（House.p:1790）、`swayAngle()` J2ME 分支（House.q:1816）、
  程序天空 17 色带（House.a:2737）、中文界面（lang.zh-CN 88 条全量）。
- 反混淆底本：`j2me/deobf/`（17 类/292 方法/~260 字段，PROGRESS.md 账本），`*_clean.java` 为语义化源。
- **盖楼核心源码精读总结：`j2me/deobf/TOWER_CORE.md`** — 帧循环/摆钩/命中判定/计分连击/摇摆/惊慌人群/
  相机/存档的公式级底册（语义名+原始行号引注），末节为 H5 已知偏差工单（12 项）。

## H5 移植（h5quick/）— 当前主线 ✅

**`h5quick/` 为独立重写的快速模式移植**（2026-10-02），纯 J2ME 公式与资产、零 Flash 内容，
修正旧版全部 12 项公式错误（对照表见其 README）。运行：`cd h5quick && python -m http.server 8210`；
无头测试：`node exec_test.js`（9/9 PASS）。

## H5 移植（h5/）— 已冻结

- `h5/index.html` — 入口（240x320 竖屏容器 x1.5，splash→title→menu→快速游戏，全中文）
- `h5/game.js` — 玩法逻辑。**判定/计分/连击公式 J2ME 与 Flash 同源已证实**（House.y:2919 与
  GameModel.changePopulation 同公式），落点三档判定、人口 4/3/2/1 分级、连击银行、3 条命、
  999 层无尽；J2ME 专属语义（摆钩/摇摆/天空/连锁/续档/角标）全部按 House.java 行号对号
- `h5/assets/scene.glb` — 原版 `scene.m3g` 直转（19 网格 + 17 张原版贴图内嵌），
  转换器 `tools/m3g_to_glb.py`
- `h5/assets/id*.png / j2me_*.png` — r0 导出（吊钩/落地角标/logo/云等）
- `h5/assets/audio/` — Flash 版 mp3（当前默认音效）+ `h5/assets/midi/` — J2ME MIDI
  （WebAudio 合成：BGM 81 + 胜/败/放置 jingle 83/84/85，菜单可开关，默认关）
- 冒烟/执行测试：`cd h5 && node smoke_test.js` / `node exec_test.js [tower|city]`
- 本地运行：`cd h5 && python -m http.server 8200` → 打开 `http://127.0.0.1:8200/`

### 已知未完（按 J2ME 目标口径）

- 吊车 3D 模型挂接（现为原版 hook 贴图公告牌）
- intro 弹窗实机自动关闭时序待查（PARITY 活页区）
- 音频双轨现状：音效用 Flash mp3、BGM 可选 MIDI——按"J2ME 唯一权威"应收敛为 MIDI 为主（待定轮）

## 文件

- `towerbloxx.swf` / `towerbloxx-dec.swf` — Flash 版 SWF（参考）
- `j2me/jars/` — 11 个 J2ME jar（Nokia City Bloxx v1.0.11/12 ×8、DC Tower Bloxx v1.2.11/v1.5.07）
- `j2me/*.zip` — 原始下载包
- `j2me/src/` — CFR 0.152 反编译 .java（未入库）
- `j2me/deobf/` — 反混淆工程（权威底本，见其 PROGRESS.md）
- `j2me/res/` — 按魔数鉴别重命名的资源（scene.m3g / MIDI / font.bin / 语言包 / r0 解包 / 89 号天际线）
- `j2me/m3g_scene/` — scene.m3g 解析产物（Image2D 导出 + m3g.json）
- `scripts/` — Flash 版 FFDec 导出 AS（246 个文件，未入库，参考）
- `tools/` — m3g_parse / m3g_to_glb / r0_unpack 等逆向工具

## J2ME 版要点（已考证）

- 全部使用 JSR-184（Mobile 3D Graphics）渲染 `scene.m3g`（Nokia v1.0.12 在 `n.java`，DC v1.5.07 在 `m.java`）
- 定点数运算（256=1.0，`>>8`/`>>15`），House.java 4420 行，符号混淆但主类可读
- 存档走 RMS（quickModeRS/cityModeRS 全状态中断续档）→ H5 以 localStorage 同语义落地
- r0 资源包：92×int32 偏移表结构（g.java:40-138 逆向），dc_v1507 89 条目
- 语言包：nokia lang.zh-CN = [94×u16 偏移表][u16 len][UTF-8]×88

## 下一步（快速模式主线）

入口：`House.java`（`j2me/deobf/src/House_clean_part1..3.java` 底本）+ PARITY.md 活页区待办；
数值疑义以 J2ME 反混淆底本为准，Flash 版仅用于交叉验证。
