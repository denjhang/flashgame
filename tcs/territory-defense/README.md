# 领土防御 H5（The Commander's Sister 一比一复刻）

TCS.swf 的 HTML5 复刻。对齐依据 = 反编译产物（`../deobf/` 的 AS 与 pcode、
FFDec 导出的 SVG 矩阵/帧位、`../deobf/data/*.json`、`../swf_dump.txt`），
全部美术/音频为 FFDec 从原 SWF 直出（除剧情文字按原关卡安排中文改写并去除政治元素）。

## 运行

双击 `index.html`（无依赖、可 file:// 直开）。离线验证：`node smoke_test.js`
（draw 已 stub、≤450 帧、180+ 项断言）。

## 操作（与原版一致）

- 方向键 27px/帧 + 鼠标边缘滚屏（M 开关，35px 阈值）；小地图点击/拖拽跳转
- 点建造菜单（1027 三页）→ 点地图放置；空格取消；S 卖 75% / R 修 / T 自动修理 / U 对空
- H 血条 / C 建区 / G 全图（39%） / Q 画质循环（good 档有原版云层）
- ◀▶ 翻建造页（键盘 [ / E]）；♪ 音乐面板（三首原曲 + 音量条）；? 帮助板（按键说明）
- 存档：开战等待期 SAVE GAME；boot 检测到存档出现 CONTINUE

## 已复刻（与原版逐项对齐）

- 三表逐列对齐：26 武器 / 11 结构 / 12 底盘（含巡航速度、赏金、血量）
- 44 波敌人（unitsMissions 逐车 + 16/44 波真实路线）、整波同步生成、车队制动
- 目标系统：OCEEF 43ms 控制器、getTarget 500ms 轮询、porteeAcq 0.6/0.8、
  **雷达 = MLRS/pluton 目标指示**（radarCovered 门控，敌方 radarMobile 同理）
- 经济：利息、m25 奖金、修理 2$/HP、卖 75%、二选一解锁（989）、自动解锁时间线
- Su37：60s 冷却、16 枚毯式投弹（挂架横向散布 decalX）、瞄准区 785、与建造互斥
- 剧情：44 关 237 句对白（980_242 逐句结构，说话人码 D/G/R/S + 人物/情绪）、
  870 房间布景 ×16 + 948 立绘 ×39、简报暂停波（953 f30）、R 镜像、950 待机摆动
- 胜负：败局 4s 延迟（activePerdu）+ 1132 黑幕动画；终局停火 + 1158 六句对白
  （textesTempo 时间轴）+ 1125 胜局动画；前 3 关 victims 黑幕帘
- UI 全原版素材：1151 音乐面板（含音量条 changeLevels）、1079 侧栏底板、
  1025/1027 建造菜单、1040-1078 按钮族、814/818 修理条（烤入文本清洗）、
  1141 利息浮字、1161 取消提示、778/775 选中环
- 音视频：BGM 三首原曲（1107/1124/1157）、四段落音乐时点（edith/bgscenario/gameover）、
  全套 SFX、点击音 selectionUnite
- 存档：saveData 全字段（localStorage "tcs_cookie" 等价 SharedObject）

## 已知微差（如实记录）

- 950 入场为逐帧解码的 CSS 近似（3.4s 待机摆动）；浮字三相位为 CSS 近似
- 1040 quality（Flash 声音质量）H5 无对应；m60AutoFire/scoreBonus 族字段
  反编译全库无读取点（废弃/外链），未接
- 真机听感未验证（离线纪律禁止浏览器）

## 文件

- `index.html` + `game.js` + `data.js` — 全部代码（无依赖）
- `smoke_test.js` — 无头冒烟（189 项断言：逻辑/素材尺寸/资产引用/去政治化审计/
  剧情码序列/存档往返/读档实战/文本原文逐字节）
- `assets/` — FFDec 直出素材（按系统分目录）
- 解码工具：`../tools/parse_scenario.py` 等；逐轮记录：`../deobf/TCS_LOG.md`（历史轮见 `../deobf/PROGRESS.md`）
