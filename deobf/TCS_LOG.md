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
