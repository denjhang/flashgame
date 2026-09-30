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

## TCS+48（2026-09-26）索敌距离比复核（方向2，重复覆盖确认）

- 取证：GAME_LOGIC 42（porteeAcq 0.6 我方 / 0.8 敌方，174 loc16c4）+ game.js
  两处实现（塔 1592 区 / 敌方单位 1459 区，均注明僵尸锁定语义：超保持半径只
  恢复 500ms 轮询、不解锁、旧目标继续挨打）。
- 结论：冒烟 1050/1070 起已有行为级断言（0.6 环带重取 / 0.85 保持 / 超 100%
  置空）——已被覆盖，本轮重复确认，无码改。三件套通过，204 项全 `=true`。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+49（2026-09-26）存档/车队链表边界确认（方向3）

- 排查假设：读档后 devant 指针丢失 → 车队制动失效。
- 结论：不成立——原版 saveData 与 H5 saveGame 同构，只存塔（id/hp/x/y/
  autoRepair）+ iMission/score/euros/interest/iUnlock；敌人不落盘，读档从该关
  简报重新开波，devant 链表在 startWave 逐单位重建。无缺口。
- 顺带确认：1176 "start in N" 倒计时条两态接线齐全（点击可跳过开波），
  17帧@24fps ≈ 21 tick 换算一致。三件套通过，冒烟 204 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+50（2026-09-26）解锁面板语义复核（方向2）

- 取证：989/frame_1/988_3 on(press)——lockItem==false 守卫 → lockItem=true +
  creationUnite 音 + `interest += 3` + this._alpha=45 + 面板 _x=-500；
  988_6 = unlockNextWeapon（失败 cannot）。6_333 的 unlockEnd/unlock1/unlock2
  消息结构（"已解锁全部武器/可提利率至 X%"）与 H5 refreshPanelButtons 文案
  逐段对应，INTEREST_STEP=3 一致。
- 定案：面板文字为 H5 中文改写（与整体 H5 UI 文字口径一致；非剧情文字但
  原版面板为位图+系统字，H5 以 DOM 呈现），数值与流程零漂移。无码改。
  三件套通过，冒烟 204 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+51（2026-09-26）988_6 解锁按钮逐行对照（方向2）

- 取证：989/988_6 on(press)——lockItem==false 守卫 → 上锁 →
  unlockNextWeapon() 成功: creationUnite + this._alpha=45 + 面板 _x=-500;
  失败: cannot，且 lockItem 保持 true、面板停留（原版怪癖，实际只在
  iUnlock 耗尽时出现）。H5 panelPickUnlock 同构；成功后 closeUnlockPanel
  （DOM 整面板收起 ≈ 原版移出屏），失败路径同样保持上锁。
- 断言 +1 → 冒烟 205 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+52（2026-09-26）unlockNextWeapon 对照（方向2）

- 取证：6_333 pcode——`iUnlock == unlockerLength(5)` 严格等值 → return false；
  否则 `unlocker[weaponsToUnlock[iUnlock]] = true` + 建造槽 gotoAndStop("normal")
  + `iUnlock++`。weaponsToUnlock 五项与 H5 WEAPONS_TO_UNLOCK 逐项一致。
- 结论：H5 用 `>=` 判满——iUnlock 每次仅 +1、上限 5，永不过冲，等价。
  建造槽刷新 ≈ buildShop()。冒烟已有连线断言（连续解锁 5 件/iUnlock=5）。
  无码改。三件套通过，205 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+53（2026-09-26）newEvents 全分支复核 + 面板弹出静音勘误（方向2）

- 取证：773_189 newEvents 全分支——16→canon105D 自动解锁（**无面板**）；
  18/20/37/39→仅 showPanelForUnlock；27/31→radar/su37 解锁+面板；
  25→euros+2400（法英补助，H5 在计息前入账，正确吃息）；26→edith 语音；
  44→Yamato。H5 全部接线，PANEL_WAVES/AUTO_UNLOCK 与之逐项吻合。
- **勘误**：6_333 showPanelForUnlock 函数体与 773_189 调用点均无任何
  sound.start() → 移除 H5 多播的 boutonScroll（面板弹出应为静音）。
- 断言 +1 → 冒烟 206 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+54（2026-09-26）834 子剪辑审计闭环（方向1）

- 逐一核对 DefineSprite_834/frame_1 全部子剪辑：766（地图位图, game.js 2416）、
  768（可建地块掩码, 1068/2436）、773（newEvents, TCS+53 全分支）、
  785（Su37 瞄准区）、793（飞机+弹体 500/260）、811（植被）、
  822（建造光标 3 帧/塔重叠 hitTest）、833（云层）。
- 结论：8/8 均已翻证且接线，无遗漏——方向1（未取证剪辑）对 834 子树正式
  关账。三件套通过，冒烟 206 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+55（2026-09-26）建造落点音效勘误（方向2，行为修正）

- 取证：822_226 on(press) 全流程——surfaceForBuild.hitTest(x,y,true) →
  逐塔 hitTest 重叠检查 → `euros < cost → return false`（三处失败均静默，
  无音效）；成功：euros-=cost + viseur gotoAndStop("red") + creationUnite +
  createUnit。cannot 音只在 1026/1026_* 建造槽 on(press)（shopSlotPick）。
- **修正**：H5 落点失败两分支多播 cannot → 移除，静默失败对齐原版。
  扣款/音效/建造顺序本已一致。
- 断言 +1 → 冒烟 207 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+56（2026-09-26）槽位点击音效勘误（方向2，行为修正）

- 取证：1027/frame_1/1026_1 on(press)——成功（unlocker && euros>=cost）只做
  viseurConstruction.construction 赋值 + ancienX=-548（光标初始藏）+
  zoneBombardement._x=-500（取消 Su37 瞄准）+ 槽位 gotoAndPlay("press")，
  **无音效**；失败（锁定/钱不够）cannot。
- **修正**：H5 shopSlotPick 成功路径多播 boutonScroll → 移除。至此与 TCS+53/55
  连成一致口径：原版的 cannot 只在"明确拒绝"时播，成功与静默失败均无声。
- 断言 +1 → 冒烟 208 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+57（2026-09-26）自动修理语义对齐（方向2，行为修正）

- 取证：185/86_1 `autoRepair()`——与修理条 refresh 同构（priceToPay=
  2×(etatMax−etat)），euros 够 → 扣款 + etat=etatMax + light/light2 光环；
  唯一触发点 = 6_327 伤害分支 loc06d6（掉血未毁时调用）。
- **缺陷**：H5 在 Turret.update 里每 tick 渐回 min(5,…) HP 且无伤也持续回
  （语义=持续回血）→ 改为 autoRepairNow()（一次全额）挂到 shellHit 塔受击
  分支。经济行为差异：受击瞬间全额扣款 vs 逐 tick 小额。
- 顺带审计：818_4 autor on(press) 原版即播 selectionUnite，H5 T 键一致 ✓。
- 冒烟断言更新（一次全额 100HP/磁场 9 帧/持续受击全额保持+光环重开 7 次）
  → 208 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+58（2026-09-26）R 键满血怪癖对齐（方向2，行为修正）

- 取证：819 repairIfCan pcode——满血时 r3==0 → 文本 "no reparations needed"、
  priceToPay=0；仍执行 euros<0?否 → 扣 0 + etat=etatMax + selectionUnite.start()
  （814_1 on(press) 与 6_1 keyDown(82) 都直接调它，无 hp<max 前置守卫）。
- **修正**：H5 两处提前拦截（R 键 `sel.hp < sel.maxHp`、修理条点击
  `price<=0 return`）→ 移除，满血按 R/点修理条现在照播 selectionUnite、
  扣 0 元（原版怪癖同构）。
- 断言 +1 → 冒烟 209 项全 `=true`、exit 0，三件套通过。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+59（2026-09-26）C 键建造区显示复核（方向2）

- 取证：6_1 keyDown(key==67)——`surfaceForBuild._alpha` 0↔35 切换 +
  `menuArea` 按钮帧 on/off 同步。
- 结论：H5 `G.showBuildArea` 掩码 35% 透明度渲染（2446）+ 侧栏按钮状态
  同步（3151 `set('tArea',...)`）+ C 键/按钮双向切换（3169/3258），一致。
  无码改。三件套通过，209 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+60（2026-09-26）空格键 depressSpace 对照（方向2）

- 取证：6_1 load loc0207 depressSpace——viseurConstruction=false、
  zoneBombardement=false、viseurConstruction._x=-500、indicateurPortee 收起、
  unshowInfoOnUnit（取消选中）、helpBoard._x=-800、jukeboxPanel._y=-700。
- 结论：H5 depressSpace 覆盖建造光标/Su37 瞄准/选中三项；射程指示为按需
  绘制无需收起；helpBoard/jukebox 滑走属 800x600 舞台布局差异（侧栏常驻，
  代码已注明定案）。无码改。三件套通过，209 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+61（2026-09-26）M 键滚轮开关复核（方向2）

- 取证：6_1 keyDown(key==77)——`mouseScroll` 布尔翻转 + `menuScroll` 按钮
  帧 on/off 同步。
- 结论：H5 `k === 'm'` → `G.mouseScroll` 翻转 + 侧栏 `set('tScroll',...)`
  同步，一致。无码改。三件套通过，209 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+62（2026-09-26）H/G 键复核（方向2）

- 取证：6_1 keyDown——72: `afficheEtat` 血条开关 + `menuHealth` 帧同步；
  71: zoom 全图 39%（realposmap 反算鼠标世界坐标）+ `menuZoom` 帧同步。
- 结论：H5 `k==='h'`→showHp / `k==='g'`→toggleZoom（2412 起）+ 侧栏
  tHp/tZoom 按钮同步（3151/3170），一致。无码改。三件套通过，
  209 项全 `=true`、exit 0。
- 本轮仍未做：无（「三」空，下轮按「五」生成）。

## TCS+63（2026-09-26）普查立账 + 每轮配额制（用户指令）

- **函数普查**：原版具名函数 95 个（DefineFunction2×82 + DefineFunction×13）。
  绝大多数已在前 60+ 轮对号或定案废弃；按 6 族立签名卡清单（A1 单位族…
  A6 散件族），逐族补「H5 对应点+证据行号」。
- **资源普查**：assets 共 1948 文件；动态路径引用（briefing 数字帧/repair 光环/
  eturrets_spr 帧/枪口 303 等）经目录前缀匹配排除后，真正待人工核对的是
  4 组：B1 枪口/弹体帧集合、B2 敌塔序列帧区间（80/128/122/164/83/161/167）、
  B3 turrets/eturrets 散件 70+、B4 已断言组抽查。
- **配额制**（写入 TASKS.md「二之一」）：每 10 分钟一轮，每轮 ≥3 条目
  （≥2 资源 + ≥1 函数，复杂项可顶 2 条须注明折算）；完成标准=取证→对照→
  结论→断言；禁止一轮一条就停。定时任务已更新为 */10（注意：更新后任务
  显示 paused，本会话无法自行启用，需用户在任务列表手动启用）。
- 账本进度：A: 0/6 族, B: 0/4 组（本轮为立账轮）。
- 本轮仍未做：A1-A6、B1-B4 全部（下轮起按配额推进）。

## TCS+64（2026-10-01）配额轮 1: A1 单位族 + B1 枪口弹体系 + B3 散件（3 条目）

- **A1 ✅**：428/426_1 六函数签名卡（roule/changeCheckpoint/accelere/
  selectUnit/destruction/autoRepair）入 deobf/ALIGN_LEDGER.md。
  **修正**：原版 selectUnit 播 selectionUnite → H5 点选己方塔补音（3244）。
- **B1 ✅**：muzzle 303×14/365×2 全用；shells/304=弹壳→assets/casing、
  391=曳光弹壳→casing_bullet（各 29 帧全接）；shells/<chid> 目录导出为
  源副本（冗余定案）。无缺失。
- **B3 ✅**：turrets/56.png(17x81 黑竖条)、eturrets/100.png(12x15) 读图确认为
  线框标记层残片（与"86 库=标记层"定案同族）→ 冗余不接入。
- 断言：下轮补点选音断言（本轮 3 条目已满, 折算注记: selectUnit 卡含码改）。
- **账本进度：A: 1/6 族, B: 2/4 组**。三件套通过，冒烟 209 全绿 exit 0。
- 本轮仍未做：A2/A4-A6、B2/B4（下轮配额）。

## TCS+65（2026-10-01）配额轮 2: A2 调度族 + B2 敌塔序列 + B4 抽样（3 条目 + 补断言）

- **A2 ✅**：refreshVectors/startMission/activeDeclencheur/declencheMissionSuivante/
  newEvents 五函数签名卡（证据 loc 号齐）→ 账本。
- **B2 ✅**：帧区间权威=gun_fire_frames.json；80(186)=全用；122/161 超区帧
  md5 抽证为原版时间线尾部（脚本不播段）→ 定案不接入。
- **B4 ✅**：menu/fond/perso/perdu/end/units 六组计数全符既有断言。
- 补上轮挂账：点选己方塔 selectionUnite 断言（210 项）。
- **账本进度：A: 2/6 族, B: 4/4 组**。三件套通过，冒烟 210 全绿 exit 0。
- 本轮仍未做：A3 武器族、A4-A6（下轮配额）。

## TCS+66（2026-10-01）配额轮 3: A3 武器族 + B5 音效表 + 命中半径修正（3 条目）

- **A3 ✅**：fireOnEnnemi/createObus/createExplosion/createEclat/chargeBombes
  五函数签名卡。**修正**：原版精筛 `dist > range + _height → 跳过`（目标高度
  计入命中半径），H5 两处（单位溅射/塔受击）均无高度项 → Unit/Turret 增 hgt
  （渲染身高 / 76），判定改 `range*rr + (u.hgt||0)` 与 `range + (t.hgt||0)`。
  450 帧 sim 结果不变（击杀 14/塔 15）。
- **B5 ✅**：53 个 SFX 文件与磁盘逐一相符；**修正**导弹发射音接线
  （missile/missileUnder→crotale, missile2→mlrs, 原版在弹体生成时播）；
  **新挂账**：466_pluton 源编码 Nellymoser（DefineSound format 6, 导出仅得
  flv）→ H5 无法解码，pluton 发射无声，与 1040 同族永久挂账。
- **账本进度：A: 3/6 族, B: 5/6 组**。三件套通过，冒烟 211 项全 `=true`
  （连跑两次稳定）exit 0。
- 本轮仍未做：A4 索敌族、A5/A6（下轮配额）。

## TCS+67（2026-10-01）配额轮 4: A4 索敌族 + B6 增量抽查 + OCEMM 射程预览补缺（3 条目）

- **A4 ✅**：getTarget/OCEEF/askPermissionOfFire/OCEMM/e1..e14 五项签名卡。
  **补缺**：原版 OCEMM 建造光标 enterFrame 让 indicateurPortee 跟随鼠标
  (w/h=portee×2) —— 建造时射程预览圈，H5 只有选中塔才有 → 已补
  （shopSel 模式画 SEL_RANGE, 直径=WEAPONS[portee]×2×zoom）。
- **B6 ✅**：units/gun chid 全集/turretlib 26 帧/ui 各目录与 H5 表逐项相符，
  无增量漂移（此后每轮随配额滚动抽查一小组）。
- **账本进度：A: 4/6 族, B: 6/6 组**。三件套通过，冒烟 211 项全 `=true`、exit 0。
- 本轮仍未做：A5 UI/存档族、A6 散件定案表（下轮配额）。

## TCS+68（2026-10-01）配额轮 5: A5+A6 函数账本全签收 + B 滚动抽查

- **A5 ✅**：saveData/loadData/actualiseInfo/showInfoOfItem/setScores 五卡。
  **补缺**：原版胜局 end 序列内嵌 1123 score 面板（setScores 每 50ms 刷
  score1..5=丢塔数），H5 胜局画面无计分 → 动画末行补 "SCORE N (丢塔数)"。
- **A6 ✅**：散件 20+ 函数定案表——edith/Yamato/playBirds 等音效族已接线;
  getPwd/gpfl/__mochibot__ 统计族与混淆辅助函数全库无游戏内消费点 → 不复刻。
- **B 滚动抽查 ✅**：explosion typed 5 型帧组/flame/spark/headlight 抽查与
  H5 引用一致（细节: flame 28000+i 与 explosion 26000+i 同位 ±10 抖动,
  H5 boomTyped 同构）。
- **账本进度：A: 6/6 族, B: 6/6 组 —— 函数 95 项全部签收完毕。**
- 三件套通过，冒烟 211 项全 `=true`、exit 0。
- 本轮仍未做：push 积压待网络（本轮回吐时重试）。

## TCS+69（2026-10-01）复审轮: R1 startInstructions + R2 173 帧标签 + R3 音效字节比对（3 条目）

- **R1 ✅**：startInstructions/refresh 全流程卡（enScenario/鸟叫停/段落乐切换/
  45 关 endPass 分支）——H5 briefingShow+playSegment 同构。
- **R2 ✅**：TURRET_LIB_FRAME 25 项 vs turret_layout.json「173.labels」：
  零错配零缺漏（86 旧表为标记层已弃）。
- **R3 ✅**：53 个音效 md5 对比 decompiled/sounds：49 一致 0 不同，4 个
  src-only 均为 466 挂账族。音效资产 100% 原版字节。
- **账本进度：A: 6/6, B: 6/6, R: 3 项新签**。三件套通过，冒烟 211 全绿 exit 0。
- 本轮仍未做：无（下轮继续 R 滚动深查，候补: 1141 浮字相位/云层帧/菜单图标逐张读图）。

## TCS+70（2026-10-01）复审轮 2: R4 浮字 + R5 云层 + R6 菜单图标（3 条目）

- **R4 ✅**：1141 浮字 87 帧 @24fps；FFDec 离线仅 6 关键帧，精确相位不可判 →
  H5 1.3s 近似维持**永久账定案**（同真机听感族），码不变。
- **R5 ✅**：nuageux 833 矩阵/量化图/QUALITY 门控对齐，无码改。
- **R6 ✅**：菜单 12 图标 75×62 抽样读图（pluton/radar）内容与命名相符。
- **账本进度：A: 6/6, B: 6/6, R: 6 项**。三件套通过，冒烟 211 全绿 exit 0。
- 本轮仍未做：无（下轮候补: selection 775/778 帧核对、ombre 阴影矩阵抽查、
  story 立绘 39 张逐张读图）。

## TCS+71（2026-10-01）复审轮 3: R7 选中视觉 + R8 阴影 + R9 立绘 + F1 补卡（4 条目）

- **R7 ✅**：778 帧 1-4 内容/5-9 空白（271B vs 93B 实证）→ H5 轮播 1..4 忠实；
  775 射程圈单帧缩放对齐（含 TCS+67 建造预览复用）。
- **R8 ✅**：ombre 全系列映射 + 偏移 4/随车旋转/alpha 0.352/阵亡移除，全对齐。
- **R9 ✅**：story 立绘 39 张计数+抽样读图相符。
- **F1 ✅**（函数）：unshowInfoOnUnit 等效实现补卡。
- **账本进度：A: 6/6 + F1 补卡, B: 6/6, R: 9 项**。三件套通过，冒烟 211 全绿。
- 本轮仍未做：无（下轮候补: eturret base_px 表核对、flame 帧数核对、
  spark 521 族计数）。

## TCS+72（2026-10-01）复审轮 4: R10 flame + R11 spark + F2 计数器族 + R12 炮管原点定案（4 条目）

- **R10 ✅**：flame 34 帧=chid 637 全用，与 explosion 同位 ±10 抖动 attach。
- **R11 ✅**：spark 7 帧 53x4 淡出画布，createEclat ±8 抖动/随机旋转同构。
- **F2 ✅**（函数）：getIEclat/getIExplosion/getIObus 深度计数器族 → H5 数组
  生命周期等效，补卡。
- **R12 ✅**：12 门炮 o 偏移与 gun_origins.json 系统差（y 恒 +4）→ 定案
  H5 矩阵解码值为权威，测量表仅存档。
- **账本进度：A: 6/6+F1/F2, B: 6/6, R: 12 项**。三件套通过，冒烟 211 全绿。
- 本轮仍未做：无（下轮候补: headlight 光斑参数核对、casing 双系帧位差抽证、
  1176 倒计时 8 帧图与 21 tick 换算断言）。

## TCS+73（2026-10-01）实机验证（用户指令解锁浏览器）+ LOSSES 标签重复修正

- 用户指令开内置浏览器实测（覆盖离线纪律一次）。http-server 8789 端口（8788
  被 Chromium 启发式缓存污染，换源破缓存）。
- **实测通过项**：①加载/开局（地图/侧栏/小地图/开战条/提示框）；②44 句开场
  对白逐句推进+CNN 式新闻布景+第 1 关操作提示框；③开战→敌车队入场（血条/
  小地图红点）→基地机枪开火；④建造流程（掩码判定/扣款 120/creationUnite/
  选中射程圈 350×2/四角准星/修理条 "no reparations needed"+"auto repair OFF"
  ——TCS+58 怪癖实机可见）；⑤败局端到端（敌人攻入→1132 GAME OVER 动画→
  点击重开）；⑥INFO 面板武器属性、HUD 全字段。
- **发现并修正**：金钱面板 "LOSSES" 标签重复——money_panel.png 已烤入标签，
  DOM 又写 "LOSSES 0" → 改为纯数字（原版 score 字段即纯数字），断言更新，
  实机复核 ✓。冒烟 211 全绿。
- **提请用户决策**：败局动画为原版素材（含旗帜画面）。按"其他全用原版"指令
  保留；如需对该段演出做去政治化处理（替换帧图），请另行指示。
- **账本进度：A: 6/6+F1/F2, B: 6/6, R: 12 项**。commit 带 LOSSES 修正与断言。

## TCS+74（2026-10-01）开机链补齐（用户实机反馈：主界面/进度条/arcadebomb 缺失）

- **取证**（原版开机序列）：frame1 预载(percent/barre) → arcadebomb 演出
  (955 f1, 800x600 logo) → frame_4 停帧主菜单：NEW GAME(656)→dff(703) 难度
  面板 "Select your skill level"（easy=gc 0.75 / normal=gc 1, 703 f3 实拍
  面板图）→ _root.nextFrame()；LOAD GAME(659)→loadData（无档显示 no data）；
  GAME_LOGIC: 敌方伤害 puissance *= gc。
- **实现**：bootChain 状态机（真实素材预载+进度条→arcadebomb 2.6s/点击跳过→
  主菜单[标题光晕 673+NEW GAME+LOAD GAME]→难度面板→briefingShow）；开机期间
  tick 门禁 + HUD 隐藏；CONTINUE 无档提示 no data；**gc 倍率接入敌方伤害**
  （spawnShell ennemy 侧 power×GC）。
- **素材**：assets/boot/（barre/arcadebomb/title/btn_new/btn_continue/skill，
  FFDec 原版直出）。菜单布局为视觉近似（放置矩阵解析受 dump 截断限制，
  下轮精化——已记 R13 候补）。
- **smoke**：boot 门禁适配（bootDone=true + briefingShow() 注入 sim）；
  211 项全 `=true`、exit 0，三件套通过。
- **实机复验**（浏览器）：preloader→arcadebomb→主菜单→难度面板→选 normal→
  简报对白打开+HUD 恢复，全链路 ✓（截图逐段核对）。
- **账本进度：A: 6/6+F1/F2, B: 6/6, R: 12 项 + 开机链大项（折算 ≥4 条）**。
- 本轮仍未做：菜单放置矩阵像素级精化（R13）；about/language 按钮未复刻
  （about 弹窗内容/language FR 文案无对应资源，已定案不复刻）。

## TCS+75（2026-10-01）硬统计（用户质询"还差多远"）

**可计算基准 vs 现状**：
| 维度 | 原版 | H5 | 距离 |
|---|---|---|---|
| 函数 | 95 具名 | 95/95 签收（含定案不复刻） | **0** |
| 声音 | 62 DefineSound | 61 覆盖（466 Nellymoser 永久挂账; BGM 按用户指令换曲） | **1（不可解）** |
| 开机链 | 6 帧序列 | 全实现+实机验证（菜单布局近似 R13） | **矩阵精化 1 轮** |
| 视觉资产 | **838 个被放置 chid** | 显式+动态表覆盖 73；其余 765 个为容器/组合层，**内容大多已随整帧导出但未逐个证明** | **chid 级全量对账未做** |
| EditText | 115 | 功能性覆盖（剧情/HUD/烤图），未逐个建档 | **约 3 轮** |

**结论**：玩法系统 100% 且实机可玩；"可证明 1:1"还差 **chid 级全量对账**
（765 个待归类的容器 chid 需显示树展开后逐批归入 已覆盖/缺失/冗余）+ EditText
建档 + 菜单矩阵精化 ≈ **15-18 轮**。此账此前建不起来，因为反混淆阶段只建了
逻辑/函数清单，没有做 SWF 显示树的叶子资产清单——C1 补上。
