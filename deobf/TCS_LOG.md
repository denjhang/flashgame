# TCS 领土防御 · 定时任务轮记录（TCS 专属日志）

> 本文件为 territory-defense（TCS）定时任务的**专属**轮记录；
> deobf/PROGRESS.md 与 deobf/TASKS.md 的历史轮（N+1..N+102 / TCS+1..+25）仍保留在
> 原文件中供追溯，但**自 TCS+26 起新记录只写本文件**，避免与 tower-bloxx 任务冲突。

## TCS+26（2026-09-26）日志独立化

- 依据 TCS+25 教训：与 tower-bloxx 任务共享 PROGRESS/TASKS 导致推流冲突三次。
  自本轮起 TCS 轮记录 → 本文件；TASKS.md 中 TCS 段落视为冻结历史。
- 复核：三件套 node --check 通过；冒烟 189 项全 `=true`、exit 0。
- 本轮仍未做：无（下轮按 TASKS.md「五、自查方向」继续）

## TCS+27（2026-09-26）入库收尾 + 待命复核

- 发现 TCS+26 的两份产物（本日志、TASKS.md 工作流改指向）建好后未提交入库，
  本轮补齐 commit + push；同时修正 TCS+26 日期笔误（误写 09-30）。
- 复核：三件套 node --check 通过；冒烟 189 项全 `=true`、exit 0；
  工作树仅含本项目产物，未触碰 tower-bloxx 文件。
- 本轮仍未做：无新任务——「三、当前任务」为空，「五、自查方向」五条均已
  覆盖（TCS+19 全库翻证完结 / TCS+25 校验矩阵补全）；维持待命复核态，
  待用户实机反馈或新取证证据出现再开工。


## TCS+28（2026-09-26）文档漂移修正（方向5）

- README.md 两处漂移：冒烟断言计数 182→189（TCS+20..25 增补后未同步）；
  「逐轮记录」指针由共享 PROGRESS.md 改为 TCS 专属 TCS_LOG.md（历史轮注记保留）。
- 复核：三件套 node --check 通过；冒烟 189 项全 `=true`、exit 0。
- 本轮仍未做：方向4（dlgBox 排版 vs 原版 textfield 坐标核对）已补入任务书「三」，下轮执行。

## TCS+29（2026-09-26）dlgBox 排版对齐原版（方向4）

- 取证链：PlaceObject2 (chid:1156, dpt:3, nm:dialogue) 放入 980 → EditText 1156
  解码（swf_dump 003cba02 + 字节级 bit 解码）：FontID 3、FontHeight=280twips=**14px**、
  颜色 FFFFFF、左对齐、Leading=40twips=2px、自动宽（rect 宽 0，autosize）。
- H5 修正：#dlgTxt 12px/1.55 → **14px/1.3**（14px 默认单倍 + 2px leading ≈ 1.3）；
  #dlgWho 12 → 14px（说话人名行为 H5 附加，字号跟随正文）。
- 防回归：冒烟新增断言（dlgTxt 14px/1.3 + dlgWho 14px）→ 190 项全 `=true`、exit 0；
  三件套 node --check 通过。
- 本轮仍未做：方向5（已定案事实补录两条）已入任务书「三」，下轮执行。

## TCS+30（2026-09-26）已定案事实补录（方向5）

- TASKS.md「六」新增两条定案：①对白排版 = EditText 1156（14px/白/左对齐/leading
  2px，H5 已对齐并有断言）；②dlgWho 说话人名与 dlgNext 提示 = H5 附加件
  （原版无名字字段）。防止后续轮次反复翻证。
- 复核：三件套 node --check 通过；冒烟 190 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」清单为空，下轮按「五」自查生成新任务）。

## TCS+31（2026-09-26）980 未翻子剪辑取证 + 开场黑幕接线（方向1）

- 取证：980 装配表 9 个子剪辑中 955/956/958 此前未翻。955 = **haloNoirOuverture**
  （PlaceObject2 dpt14 nm），30 帧时间线 f1 stop / f2 play(标签) / f30 stop；
  FFDec 帧图：f1=arcadebomb.com 赞助商图（起播在 play=f2 故实际不显示），
  f2..f5 全黑 → f6 全透明 ≈ **5帧@24fps=0.21s 开场黑闪**。调用点唯一：
  6_329 → 980.refresh(iMission) → haloNoirOuverture.gotoAndPlay("play")，每关一次。
- H5：新增 #openCurtain（z-index 28，在对白框之下），briefingShow 顶部重启相位播放
  0.21s 淡出；958 = 空 EditText 'txt'（全库无代码引用）判调试遗留不复刻，
  956 = 955 用黑矩形。防回归断言 +1 → 冒烟 191 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+32（2026-09-26）初始经济抽查（方向2）

- 取证：6_333 onClipEvent(load) 逐分支解码——`loadGame ? _root.<同名> : 默认`，
  默认 euros=850 / interest=6 / score=0，iUnlock=0（同文件 57 行）；另有
  scoreBonus=1 / interestSup=0 cookie 缺省（与已定案"废弃字段"一致）。
- 结论：H5 game.js `euros: 850, interest: 6, score: 0` 与原版逐值一致；
  读档路径（_root 同名 → H5 localStorage 字段）此前存档往返断言已覆盖。
- 防回归断言 +1 → 冒烟 192 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+33（2026-09-26）卖出价公式抽查（方向2）

- 取证：6_1 keyDown(key==83) → `priceOfSell = Math.floor(etatC/etatM * (price*0.75))`
  （price=structureData[structure][1], etatM=[0], etatC=当前血），euros 累加后
  unitEtat.destruction()。H5 sellPrice() 语义一致但乘法结合序不同
  ((hp/maxHp*cost)*0.75)，极端浮点边界 floor 可差 1 → 分组照抄原版。
- 断言 +1 → 冒烟 193 项全 `=true`、exit 0；三件套通过。
  （插曲: 断言正则插入 eval 模板串被吃反斜杠 → 改 includes() 写法, 与 N+7x 教训一致）
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+34（2026-09-26）修理费取证 + 重复定义缺陷清除（方向2）

- 取证：819 onClipEvent(load) 两个函数——refresh(): repairPrice.text =
  priceToPay = **round(2×(etatMax−etat))**（pcode 中 r3=(r3/2); r3=(r3/r5) 是混淆
  死代码，随后 r3=2 覆盖）；"no reparations needed" 当差 0。repairIfCan():
  euros<priceToPay → cannot 音效；否则扣款、etat=etatMax、selectionUnite 音效。
  另: autor 标签随 repairLogo.autoRepair 翻转 ON/OFF。
- **缺陷**：game.js 中 repairPrice/repairIfCan/swithRepair 各有两份定义，第二份
  repairIfCan 只扣固定 2$（非 per-HP 计价）且因函数提升成为生效版本——潜伏缺陷，
  幸而所有调用点（R 键/修理条点击）均直接调 repairPrice() 自行扣款，未踩雷。
  已删除错误副本，保留与原版一致的第一份。
- 防回归断言（公式+唯一性）+1 → 冒烟 194 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+35（2026-09-26）全库重复定义扫描（TCS+34 教训推广）

- 方法：node 脚本扫 game.js 顶层 `function 名` 重复 + 2 空格缩进方法定义重复。
- 结论：顶层 function **零重名**（TCS+34 缺陷是孤例，已无同类）；类方法
  constructor/update 各出现 2 次但分属 Unit/Turret 两类，合法。顺带清理
  Turret constructor 中重复的 `this.cost = s.cost;`（无害冗余）。
- 防回归断言（顶层无重名）+1 → 冒烟 195 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+36（2026-09-26）costUpgraded 否证 + AA_UP_RATIO 定性（方向2）

- 取证：1027 建造菜单 load 三处 `costUpgraded = 300/420/540`（1026_7 锚定
  canon105→420；1026_5 类型名混淆但值 300；1026_1 m60→540）。反编译全库
  **无任何读取点** → 与 m60AutoFire/scoreBonus 同类的废弃/遗留字段。
- 定性：U 键「付费对空升级」是 H5 扩展（TCS+17: T/U 原版不存在），
  AA_UP_RATIO=0.6 是自定平衡参数——**非**原版数据（0.6 在原版是 porteeAcq
  索敌比例，曾被注释混淆）。game.js 注释已修正标明。
- 复核：三件套通过；冒烟 195 项全 `=true`、exit 0（无行为改动）。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+37（2026-09-26）对空 4 倍复核（方向2）

- 取证：GAME_LOGIC.md 78 行（fireOnEnnemi 反编译逐行）——目标 chassis=="tigre"
  → etat -= power×**4**；剧情台词宣称 2 倍但代码是 4（文档已注明）。H5
  ANTI_AIR_MULT=4 与之逐值一致，且三处使用点（Su37 空袭/直射命中）全走该常量。
- 断言 +1 → 冒烟 196 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+38（2026-09-26）溅射三段复核（方向2）

- 取证：GAME_LOGIC 52-54——missile2/pluton/Su37 溅射 = fireOnEnnemi 三次
  **独立**调用：portee×{1/4,1/2,1} × 伤害×{1,1/2,1/5}；因不去重，内圈单位
  实际累计 1+0.5+0.2=1.7 倍（原版语义，非 bug）。H5 SPLIT 表逐值一致，
  两处使用（Su37 空袭 889 / 导弹溅射 1796）同构，亦不去重 → 行为等价。
- 断言 +1 → 冒烟 197 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+39（2026-09-26）MTHEL 激光复核（方向2）

- 取证：GAME_LOGIC 56 + obus frame13 (chid399 onClipEvent(load)) —— MTHEL 的
  "laser" 弹在子件 load 时以 _height=目标距离拉出光束、同帧 fireOnEnnemi 结算，
  之后仅播动画，无飞行过程。
- 结论：H5 spawnShell 的 laser 分支（shellHit 即发即中 + G.beams 12 帧光束）
  与原版语义一致；冒烟本就有实战断言（当帧掉血 120 = MTHEL 单发威力）。
  本轮补接线断言 +1 → 198 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+40（2026-09-26）Su37 空袭参数复核（方向2）

- 取证：deobf/scripts/DefineSprite_834/frame_1/PlaceObject2_793_23 load——
  `puissance = 500; impact = 260;`（弹体属性）；冷却 785_17 权威
  comptDispo=60×chargeBombes 1000ms = 60 秒。
- 结论：H5 SU37.POWER=500 / IMPACT=260 / COOL_MS=60000 逐值一致，无漂移。
  断言 +1 → 冒烟 199 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+41（2026-09-26）射速模型复核（方向2）

- 取证：DefineSprite_174/frame_1/PlaceObject2_173_1——`setInterval(this,"OCEEF",43)`
  循环 + `numberOfRequestForPermission = floor(typeData[2]/fpsc)`（GAME_LOGIC 9 行
  fpsc=1.13 全局速度倍率，41 行冷却帧数公式）； numberOfRequest 累加至许可数才开火。
- 结论：H5 `fireCooldownMs(t2) = floor(t2/1.13) × 43ms`——H5 以毫秒计时，
  N 次 OCEEF tick × 43ms，逐值等价。断言 +1 → 冒烟 200 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+42（2026-09-26）行进速度模型复核（方向2，重复覆盖确认）

- 取证：GAME_LOGIC 35（巡航速度 = chassis[0]×fpsc，转弯减速 vitesseFrein=
  chassis[1]，旋转 chassis[2] 度/帧@24fps）+ game.js Unit 构造注释（旧实现
  c[0]*0.45/c[2]*0.09 偏差已在此前轮修正，×1.13×(24/30) 换算正确）。
- 结论：冒烟 926 行起已有逐车型断言（camion1/jeep/bradley/abrams/t90/navire/
  Yamato/camionBlinde/tigre 巡航 + camion1 转向），本方向已被覆盖——本轮
  重复确认，无码改。三件套通过，冒烟 200 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+43（2026-09-26）车队制动阈值勘误（方向2，行为修正）

- 取证：428_unit/frame_1/PlaceObject2_426_1 load——`CONST_ELOIGNEMENT` 默认 1.8,
  两个混淆名底盘 set 4（GAME_LOGIC 注"舰 4"）, jeep 显式 1.8; roule pcode:
  `if (dist < unitDevant._height × CONST_ELOIGNEMENT) → vitesseToDo=0 + 每帧减速`。
- **缺陷**：H5 阈值只用了前车渲染高度裸值（camion1 42.2px），漏乘 1.8/4 ——
  刹车距离短 44%，舰船间距 150px vs 原版 601px。
- 修正：`hgt × elo`（elo = 舰 4 / 其余 1.8）；减速步长 (1/14)×1.8×0.8 不变；
  波次生成注释同步（60px 初始间距 < 76px 阈值 → 初始微制动、前车拉开后追赶
  = 原版橡皮筋车队行为）。冒烟车队断言更新（75.9px/601.4px）+ 接线断言 +1
  → 201 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+44（2026-09-26）路点推进对齐（方向2，行为修正）

- 取证：426_1 changeCheckpoint pcode——逐轴双阈值：40px 内（|dx|且|dy|）置
  vitesseToDo=vitesseFrein（入弯减速），4px 内推进 curIPoint 并恢复
  vitesseToDoInitPrime，末点再推进 → activePerdu（敌方抵基判负）。
- **缺陷**：H5 旧实现为径向 `d < max(12, v×5)`（约 12-14.5px，偏松且无入弯
  减速）。已改逐轴 40/4px。安全性：每 tick 各轴位移 ≤2.9px（camion1 最快
  2.89），小于 4px 盒宽，无越点隧道。读档 450 帧 sim 结果不变（击杀 14、
  塔存 15/15、非胜非败）。
- 断言 +1 → 冒烟 202 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+45（2026-09-26）accelere 车速抖动补齐（方向2，行为补全）

- 取证：426_1 loc0a40 `accelere()`——每帧 `if (random×100 > 99)`（1% 概率）
  重 roll `vitesseToDoInitPrime = vitesseToDoInit + rand×(vitesseToDoInit/5)`
  （+0..20%），作为路点推进后恢复的巡航目标速 → 原版车队车速各车不同且缓变。
- 补全：H5 Unit 增 vBase/vPrime，每帧 1% 重 roll，直行 targetV 用 vPrime
  （转向仍 turnSpeed）。对照 HEAD 验证冒烟中既有 "=false" 信息行为原样
  （期望值即 false / 已知口径），非本轮回归。
- 断言 +1 → 冒烟 203 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+46（2026-09-26）金钱面板 LOSSES 勘误（方向2，行为修正）

- 取证：1079/frame_1/1074_30 `actualiseInfo()`——金钱面板三字段 euros/interest/
  score，其中 score.text = master_menuItems.score；score 只在塔 destruction 时
  ++（185帧2 DoAction_2: iMission<45 → score++，战斗被毁与 S 键卖出同路径），
  即 **LOSSES = 丢塔数**（原版教程台词"your score is the losses you suffered"
  佐证）。敌方抵达基地 → activePerdu，不进 score。
- **缺陷**：H5 hLoss 显示 'LOSSES ' + G.losses（敌人抵达次数）→ 改为 G.score。
  G.losses 变量保留（smoke sim 快照用），不再上屏。
- 断言 +1 → 冒烟 204 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+47（2026-09-26）interWave 318/317 口径定案

- 排查：冒烟输出"第1波清场 → interWave=318 (期望 317)"疑似 off-by-one。
  溯源：317 常量断言本身通过；318 出自 game.js 对白分支
  `if (dlgOpen(nextWave)) G.interWave = INTERWAVE_TICKS + 1`——对白波 +1 为
  冻结标记（>窗口，tick 不推进），设计如此。
- 处置：不改码；冒烟文案加"[TCS+47 定案]"注记，防止后续轮次重复追查。
  三件套通过，冒烟 204 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。
