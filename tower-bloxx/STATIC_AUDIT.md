# Tower Bloxx H5 静态对标审计

权威源：`scripts/scripts/__Packages/bz/esg/game/*.as`（Flash 版，符号未混淆）、
`j2me/src/City_Bloxx_2008Nokiav1.0.12/*.java`（J2ME 版，交叉验证用）。
每 10 分钟一轮自动化检查（automation-0847c93e），小差异当场修，大差异记 herein。

## 第 1 轮（2026-09-29）

对号范围：Const.as / Tower.as / Crane.as / Tipper.as / GameModel.as / ComboTimer.as / CPath.as / GameState.as。

### 已修正（本次提交）

| 级别 | 问题 | 原版证据 | 修正 |
|---|---|---|---|
| P1 | 快速游戏目标层数写成 30，到 30 层误判过关 | GameState.as:97 `totalBlocks=999`（无尽模式），CityMap.as:508 才是 (type+1)*10 | `TOTAL_BLOCKS=999`，无尽 |
| P1 | `blockLanded` 开头无条件 `finishCombo()`，连击永远无法维持 | Tower.as:150/139 只在撞塔/坠落分支 finishCombo；成功落块时 comboMult+1（Tower.as:233） | finishCombo 移到 miss/knock 分支 |
| P1 | 计分写成直接 `population += inc` | GameModel.as:159-176 `changePopulation`: 实得 = floor(stacked/10 + inc)，连击期间另入银行 `m_comboPopulation += floor(mult*(2+stacked/10*2))`，finishCombo 时支付 | 按公式重写 + comboBank |
| P1 | 连击计时模型错误（自创 startCombo） | ComboTimer.as:28-46 setTimer/addToTimer（mult==0 时置 1，上限 TIMER_MAX+1=6s）；perfectLanding 公式 Tower.as:330-334 `max(ADJ, SECS-mult*ADJ)` | comboSetTimer/comboAddTimer 对号 |
| P1 | 摇晃速度 30 倍过快、幅度公式缺失 | Tipper.as:77-81 `timer += delta/20/30`；GameModel.as:236-239 `maxTowerAngle = min(SWAY_MAX_ANGLE, min(stacked/2+|currCtr|/20, stacked×(...)/6)/18)`，SWAY_MAX_ANGLE=1 | timer+=dt/600 + 公式对号 |
| P1 | 落点 offset 用网格原点而非块中心 | GameModel.as:235 |currCtr| 取块中心 | offset/currCtr 均改用 position.x+cx |
| P2 | 地基块（第一块）结算了人口 | Tower.as:182-190 onGround 分支无 makePeople | onGround 不结算 |
| P2 | 摆钩为固定高度正弦，幅度自创 45~85 | CPath.as:33 `radx=r*2, rady=r`（椭圆摆），setRadx:41-46 `min(70, 30+totalBlocks)`→恒 70，rady=25 | 椭圆摆 radx=70/rady=25 对号 |
| P3 | 死代码清理（swinging/camTarget/_bl/tex4/targetY） | — | 删除 |

### 连击完整链路（本轮取证，此前理解不全）

完美落地 → `perfectLanding()` 首次走 showTip（GameState.as:115 STT_START_COMBO → `addToTimer(COMBO_SECS)`），
后续走 Tower.as:330-334 计时公式；连击存续期每次成功落块 `comboMult+1`（Tower.as:233）；
非完美落地 `addToTimer(-0.1)`（Tower.as:222-224）；miss/knock → `finishCombo()` 清零并支付银行人口。

### 遗留观察（待后续轮次）

- [P2] 原版 `makePeople` 有 roof 分支（塔顶层人口按 `aoff*128/BLOCK_H` 换算），H5 未区分屋顶块（quick game 屋顶块逻辑 `needRoof` 在 stacked==totalBlocks-1 时成立，999 层实际上取不到）——对无尽模式无影响，城市模式再补。
- [P3] 原版人口 HUD 显示的是 `showPopChange` 增量文本，H5 直接显示总量，视觉差异非机制差异。
- [P3] `blockDx`（Tower.as:24 塔身倾斜累计偏移）H5 声明未用；原版在 knockNextBlock 后续块对齐中生效，待第 2 轮评估是否补。
- [P3] MIDI 音乐未实现（需软音源，与本审计无关，记录在案）。

## 第 2 轮（2026-09-29）

对号范围：上轮遗留 `blockDx` 全链路取证（Crane.as:160-210、Tower.as:107-282）+ 挂钩视觉。

### 已修正

| 级别 | 问题 | 原版证据 | 修正 |
|---|---|---|---|
| P1 | 落块无惯性：原版落块带释放帧钩速漂移 | Crane.as:198-199 `blockDx = dx`，落块路径 `x + blockDx*3` | drop() 记录 `G.craneDx`（折算 px/帧），下落期线性漂移 bdx*3 |
| P1 | 塔身倾斜保留机制缺失 | Tower.as:117 `blockDx=floor(dx/2)`；Tower.as:121 有效偏移 `_loc3_ = 视觉偏移+blockDx`；Tower.as:208-210 完美吸附清零；Tower.as:282 `currCtr = blockx + blockDx` | 全链路对号：有效偏移含 bd，完美落地 placedX=currCtr 且 towerBdx=0，非完美 currCtr 含保留倾斜 |
| P2 | 地基块误用惯性偏移 | Tower.as:182 onGround 分支 `landOnTower(_loc4_, 0, true)`，offset 恒 0 | onGround 不加 bd |
| P2 | 挂钩上无待放积木（视觉+机制） | Crane.updateBlock:199-205 随钩移动、`_rotation = -(endx-320)/5` 度 | 补挂块 mesh，随钩旋转，落块时移除 |

判定阈值核对：hitLimit/miss 分界用有效偏移 `_loc3_`（含 bd），H5 已一致。

### 遗留观察

- [P2] roof 人口分支（同上轮，无尽模式不影响）。
- [P3] 人口 HUD 增量文本 vs 总量（同上轮）。
- [P3] MIDI 音乐。
- [P3] `dropY` 400→340（Crane.as:201）只影响下落动画时长，不影响落点判定；H5 用物理加速近似，暂不动。

## 第 3 轮（2026-09-29）

对号范围：摇晃倾斜对落点测量的影响（Tower.as:118 + Utils.as:12-15）、knock 后计数（Tower.as:176）、
gameOver 时序（Tower.as:152 + Const.GAME_OVER_DELAY/DUR_PAN_DOWN）、全常量复扫（无新偏差）。

### 已修正

| 级别 | 问题 | 原版证据 | 修正 |
|---|---|---|---|
| P1 | 落点测量未计入塔身摇晃的倾斜投影：塔越高歪得越多（20 层 × 1° ≈ 22px，接近 hitLimit 一半） | Tower.as:118 `_loc4_ = block._x - (tower._x + calcX(landingY, _rotation+90))`，Utils.as:14 `calcX = cos(rad(dir))·len` → 投影 = -h·sin(rot) | offset 改为 `blockX - (currCtr - h·sin(θ))` |
| P2 | 撞塔掉顶块后 `stacked` 未递减（影响计分公式的 层数/10 项与倾斜公式输入） | Tower.as:176 `setStackedBlocks(stackedBlocks - 1)` | knockTopBlock 内 `G.stacked--` |
| P3 | gameOver 重启延时固定 4000ms | Tower.as:152 `panDown(min(DUR_PAN_DOWN=3000, stacked×250))` + GAME_OVER_DELAY=1000 | 按层数动态延时 |

### 遗留观察

- [P2] roof 人口分支（同前，无尽模式不影响）。
- [P3] 人口 HUD 增量文本 vs 总量。
- [P3] MIDI 音乐。
- [P3] `dropY` 动画时长（同前）。

机制级（P1）差异已全部清零；剩余遗留均为低危/视觉/音频项。后续轮次如无代码变动将只做回归确认。

## 第 5 轮（2026-09-29）

回归轮：h5/ 无代码变动（git diff 为空），第 3 轮三处修正在位（lean/stacked--/gameOver 延时），smoke_test 16/16。

### J2ME 交叉验证结论（本轮专项）

尝试按任务要求用 `House.java`（Nokia v1.0.12, 4420 行）交叉验证 Flash 版数值。结论：**不采用**。
该文件为定点数表驱动（如 cW 二维表 `{n3/3, n3/30, ..., 409, 1024, 32, 4, 5, 128, ...}`、
魔数 1664=塔高上限），符号全部混淆，等价语义还原成本远超收益；且玩法数值已有未混淆的
Flash 版（同一玩法姊妹作，Const.as 全量可读）作权威源。后续轮次不再尝试 House.java，
除非 Flash 版出现自相矛盾的数值。

### 遗留清单（不变，4 项）

roof 人口分支（P2）/ HUD 增量文本（P3）/ MIDI（P3）/ dropY 动画时长（P3）。

## 第 9 轮（2026-09-29）— PARITY 推进 #1：屋顶块+目标高度+结算面板

- 实现 `?mode=tower`：totalBlocks=(type+1)*10=10（CityMap.as:508），快速游戏仍 999 无尽
- 屋顶块：needRoof→专用模板；人口 roof 换算公式（Tower.as:252-261）；trophyRoof 判定链
  （Crane.setTarget + GameModel.updateCleanTower:181）
- 结算面板：getSummary 三行 + New record! + MSG_RESTART 点击重开（GameSprites.showSummary）
- comboMax/records 记录（GameModel.as:11-13,192）
- smoke_test 16/16；PARITY.md 第 2 节标记闭环

## 第 10 轮（2026-09-29）— PARITY 推进 #2：HUD 完整化

- 进度条：tower 模式显示 fill=stacked/totalBlocks + 顶部旗标（GameModel.as:208-227）；quick 隐藏
- 命数 tries 移至原版坐标 LWR_LFT(51,-55)；人口 5 位数字右上(-52,-40)（setDigits padStart(5)）
- 连击 UI 改原版格式 "min(5,secs) x mult"（ComboTimer.setSecs:50-56），mult≥1 即显示
- 音乐/音效/退出按钮（594,20/50/80）：开关存偏好（音频落地生效），退出暂回模式入口（菜单未实现）
- smoke_test 16/16；PARITY.md 第 4 节 HUD 本体 ✅，菜单流保持 ❌（依赖城市模式）

## 第 11 轮（2026-09-29）— PARITY 推进 #3：视差背景+小人+火花

- 视差背景 3 层：FFDec 按 ExportAssets chid(231/423/426) 导出 bg2/3/4_spr 原版位图，
  worldY=camY×(1-ratio)（Tower.move:93-104, BG_RATIOS 0.05/0.1/0.2），bg4 平铺覆盖太空段
- 小人：Person.as:24-66 全参数（出生点/半步逼近/步长上限/50ms 节拍/淡出），
  dude/dudette 原版位图（chid 753/772），随 towerGroup 倾斜
- miss 坠落小人（makeFallingPerson:296-310）；完美落地四角星形火花（makeSpark:311-317, chid 783）
- smoke_test 16/16；遗留：28 种环境特效（ambient_spr 逐帧导出，下轮）

## 第 12 轮（2026-09-29）— PARITY 推进 #4：人口增量文本 + 环境特效取证

- 落块 "+N" 浮字（showPopChange, GameModel.as:168-171）；连击银行 "Combo bonus! +N" 3000ms
  （showBonusPopulation:361-369 + MSG_COMBO）→ 第 4 节 HUD 全部闭环
- 环境特效：ExportAssets ambient_spr=chid734 仅 5 帧整幅遮罩，28 种图形在更深层子剪辑，
  按"成本/收益"记 [P2] 暂缓，状态机三表已抄录入档（PARITY.md）
- smoke_test 16/16

## 第 13 轮（2026-09-29）— PARITY 推进 #5：音频闭环

- FFDec 从原版 SWF 整体导出 ExportAssets 音频：3 首歌 + 9 音效（mp3, h5/assets/audio/）
- SoundManager（GameState.playSound/playSong/stopSong 对号）+ 全部触发点接线：
  foundation/combo/stacked/destroy/fanfare_bad/good/click
- 音乐/音效按钮开关真实生效（toggleSongs/toggleSounds 对号）
- J2ME MIDI 评估：与 Flash 曲库不同源，Flash 版即权威，不转码
- smoke_test 16/16

## 第 14 轮（2026-09-29）— PARITY 推进 #6：存档闭环

- localStorage["twrblx_cookie"] 与原版 SharedObject 同名同字段（sm_towerGridData/sm_totalPopulation/
  tipFlags, GameModel.restoreModel/saveModel:82-108）
- 纪录三项持久化（twrblx_records; 原版仅会话内, H5 跨会话）+ 音乐/音效偏好持久化
- smoke_test 16/16

## 第 15 轮（2026-09-29）— PARITY 推进 #7：城市模式机制闭环

- ?mode=city: 5×5 网格视图 + 塔型选择（4 型按城市等级解锁, TOWER_UNLOCK_LIMITS）+
  邻接规则 allowed 表（CityMap.updateAllowedTowerTypes 全对号）+ isValid 校验
- 建造流程: buildTower(totalBlocks=(type+1)*10) → 复用 3D 玩法 → 胜/负都入城放置
  （胜负差: 屋顶帧; placeInMap 全链: setTowerInfo/calcCityPop/STATUS_POP_INC/saveModel）
- 城市等级/进度条（CITY_LEVEL_LIMITS 20 级, GameModel.as:281-318）; 存档 sm_towerGridData 真实写入
- 城市视图为 CSS 简排（city_spr 原版美术待导出, 已记 PARITY）
- smoke_test 16/16

## 第 16 轮（2026-09-29）— PARITY 推进 #8：菜单流

- title(原版 title_spr 位图+MSG_CLICK 闪烁)→menu(menu_spr 位图+makeMenuSprites 按钮坐标热区)
- Build City / Quick Game 现场切换状态（STT_CITY/STT_QUICK 对号, 不再依赖 URL 参数）
- Reset Map 确认弹窗（清网格存档）; Instructions 三页（TIP 全文）; High Scores 本地 top10
  （HighScoreLocalProxy 语义, 结算自动入榜按人口排序）
- 歌曲随状态切换: title/menu→sng_title, city→sng_city, 游戏→sng_tower
- smoke_test 16/16

## 第 17 轮（2026-09-29）— PARITY 推进 #9：城市模式尾部+输入

- 升格称号/里程碑提示队列（CITY_PROMOTION_LEVELS+CITY_TYPES, addTipToQueue 语义, 2.6s 逐条）
- dozer 拆除位（按钮+点塔拆除, placeInDozer:398-410 语义）
- 替换对比（点已占格显示 Old 人口, TIP_CITY_COMPARE）
- 输入补齐: 下方向键/PgDn 放块（TIP_INTRO, Key.isDown(34)）
- smoke_test 16/16

## 第 18 轮（2026-09-29）— PARITY 推进 #10：环境特效 28 种闭环

- 反汇编 ambient_spr(chid734) 时间轴: 27 帧, 每帧 PlaceObject2 一个子剪辑 (670..733)
- FFDec 导出 26 张原版特效位图 → h5/assets/flash/fx/fx01..28.png
- 三表状态机全对号: tier=stacked/10 分档 + PROB 掷骰 + OCC 次数(-1 无限, 出界+1 回收) +
  SPD 速度/进场侧 + 9 槽位 2s 随机冷却 (updateEffects/generateEffect 逐行对号)
- smoke_test 16/16

## 第 19 轮（2026-09-29）— PARITY 推进 #11：city_spr 原版美术

- FFDec 导出 city_spr(chid668, 640×509) → city_spr_640.png 作为城市视图底图
- 网格原点按 Const.CITY_MAP_X/Y(-96,-133)+中心(320,240) 对齐到 (224,107), 52px 格
- 塔型选择器/dozer 位置对齐原版左侧面板; 顺带发现并修复: 上轮全量导出清理时误删
  bg/dude/star 位图目录, 已按 chid 重导(231/423/426/753/772/783)
- smoke_test 16/16; PARITY 除 3 项有意不复刻外链外全部 ✅

## 第 20 轮（2026-09-29）— 深度自检：发现并修复加载期 P0 崩溃

用户指出复读机式回归后, 本轮逐行重读 game.js, 发现严重问题:

- [P0] 第12轮存档补丁把 `restoreModel()` 调用放在 `const G` 声明之前 → **TDZ ReferenceError,
  模块加载即崩溃**。第12~19轮冒烟测试只做静态文件/常量检查, 未执行模块, 因此一直没发现
  ——此前"可在浏览器游玩"的说法自第12轮起不成立, 特此勘误。
- [P0] 启动流程: GLB 载入后无条件 `startGame()` → 强制显示吊钩+播放 sng_tower,
  破坏标题屏/城市模式入口 (showTitle/showCity 之后又被覆盖)。改为 startGame 先行,
  再按状态机切 showCity/showTitle。
- [P2] startGame 未清理上一局残留精灵 (people/sparks/fallingPeople/toppled) → 已清。
- smoke_test 新增断言: `restoreModel()` 调用必须在 `const G` 声明之后 (17 项 PASS)。
- 教训: 纯静态冒烟测不出加载期崩溃; 后续重大补丁后应尽量做模块级执行验证。

## 第 21 轮（2026-09-29）— 模块级执行测试落地, 再修一个真 bug

- 新增 h5/exec_test.js: stub DOM/WebGL(three 垫片覆盖 WebGLRenderer)/Audio/fetch(fs+Response)/
  ImageLoader(img onload), 真正 import game.js 跑 1800+ 帧 + 模拟放块
- 立刻抓到真 bug: popFloat/showMsg 用 hud.appendChild (hud 是引用表非 DOM 元素),
  浏览器里首次成功落块即 TypeError → 修复为 hudEl(#hud) 容器
- ?mode=tower 直入跑完整闭环: 10 块落地含屋顶/过关/结算, 无异常
- smoke_test 17/17; 执行测试纳入验证体系 (node exec_test.js)

## 第 22 轮（2026-09-29）— exec_test 菜单流场景

- exec_test 元素桩加 id 缓存与监听记录, 支持测试内触发按钮点击
- 场景 2: 标题 onclick → 菜单 → mQuick (BTN_QUICK_GAME) → 无尽模式 400 帧放块,
  落地 35 次全通过 — 菜单流全链(状态机+按钮绑定+startGame)获得执行级覆盖
- smoke_test 17/17 保持

## 第 23 轮（2026-09-29）— exec_test 城市场景

- exec_test 参数化 (node exec_test.js [tower|city]); city 场景: 网格 25 格渲染 →
  选 Residential → 点格建造 → 10 层(含屋顶)落地 → 结算 OK → finishCityTower 放置 →
  存档断言 (sm_towerGridData 人口/塔色/屋顶帧 1:1)
- 城市模式 click 链(最后的执行盲区)补齐; smoke 17/17 保持

## 第 22+ 轮 — exec_test 稳定性修正

- GLB 载入轮询窗口 2s→5s: 一次回归轮出现偶发 "PASS=2"（高负载下 GLB 未及载入, 后续断言跳过）,
  三连跑验证 7 PASS 稳定; 属测试自身不稳定, 非游戏代码回归
## 第 23 轮（2026-09-30）— 深度自查第二轮: 修正 2 处真实偏差 + 执行测试实时化

- [P1] 放块时机偏差: 原版鼠标"松开"才落块(buttonPressed=!mouseState||Key40||Key32, Crane.as:153-156)
  + 重开后 1s 落块锁(restartGame blockTime=now+1000); H5 原为按下即放/无锁 → 已对号
- [P2] 胜利号声: trophyRoof ? snd_fanfare_good : snd_fanfare_mediocre (GameState.as:128), 原恒 good → 已对号
- exec_test 改真实时钟节奏(runRealtime), 修复 1s 门锁导致的假阴性; tower 7 PASS/city 10 PASS/smoke 17
- 自查方法论: 每轮主动挑 2-3 个从未取证的行为点翻原版源码, 而非只跑回归

## 第 24 轮（2026-09-30）— delayNextBlock 对号

- 结算弹窗期间禁放: showSummary → delayNextBlock(-1) (GameSprites.as:35; Crane.delayNextBlock:121-127
  blockTime=-1, buttonPressed:155 要求 !=-1), OK 后由 startGame 的 +1000 重启 (restartGame:52)
- drop() 门禁补 blockTime===-1 分支; tower 7 PASS / city 10 PASS / smoke 17 PASS

## 第 25 轮（2026-09-30）— 考证收尾轮

- 全库 grep fanfare: GameState.as:128 是唯一胜利分档点, 资产名 snd_fanfare_med(原版内名)
  ↔ snd_fanfare_mediocre(ExportAssets 导出名), H5 映射正确
- Crane.fakeDrop/fakePerfect (Crane.as:213-220) 取证: 无调用方的作弊死代码, 与 sm_cheatsOn
  同类, 记入 PARITY "考证不移植项"
- 全量回归: tower 7 PASS / city 10 PASS / smoke 17 PASS (上一轮已跑, 本轮无代码变动)
## 第 26 轮（2026-09-30）— "真的一样吗"追问: 修正下落运动学 + miss 坠块展示

- [P1] 下落运动学: H5 误用重力加速度 (DROP_G), 原版是匀速 Path tween —— 时长公式
  (dropY-y)*2ms 即恒速 0.5px/ms (Crane.dropTarget:199-201)。改为匀速, 惯性漂移量不变
- [P2] miss 坠块展示: 原版 miss 后块沿 fallPastTower 路径坠出屏幕 (Tower.as:139-145),
  H5 原来直接消失 → 改为继续坠出屏幕再回收
- 记录在案的剩余差异: 摆钩初始相位 (CPath aOffset, 只影响起始方向)、城市塔图形为 CSS 近似、
  Flash 数值 + J2ME 3D 视觉的混搭属用户指定组合
- tower 7 PASS / city 10 PASS / smoke 17 PASS
## 第 27 轮（2026-09-30）— T1 摆钩相位 + T2 dropY 落程语义

- [P1] T1 摆钩相位: H5 原 cos/sin(th) 0 相位起、正向摆; 原版 CPath.init aOffset=(90+180)%360=270、
  ccw=!cw=true → θ=(360-((t*360/DUR+270)%360))° 角度递减, t=0 钩子位于枢轴 (cos90=0,sin90=1),
  首摆向右; 且 firstTick 把椭圆中心重算到枢轴上方 rady=25px (CPath.as:38,54-56)。
  H5 已改 hookTh()/hookY(): 中心 y=CRANE_HOOK_Y+rady, 相位/方向对齐
- [P1] T2 dropY: 原版落块终点是固定屏幕 y (首块 400, 之后恒 340, Crane.as:57,201), 与塔高无关;
  Tower.blockDropped 判定只用 x 偏移 (Tower.as:123), dropY 仅决定下落时长 0.5px/ms 恒速。
  H5 原来直接落到 landingY+BLOCK_H/2 (塔顶) → 改为固定屏幕落程: fallDist=dropY-块屏幕y,
  惯性 vx=bdx*3/(fallDist*2); 落到点后由 blockLanded 吸附/转 miss 坠块 (与原版 STT_BLOCK_LANDED 同)
- 勘误: dropY=400 仅 Crane.init 生效, restartGame→resetGameVars 不重置 → H5 不在 startGame 重置,
  G 字面量初始 400 一次
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 28 轮（2026-09-30）— T3 tipFlags 首次提示队列

- [P1] H5 此前 tipFlags 只存不用。实现 showTip(type,text,after)（GameSprites.showTip:28-46）:
  tipFlags 门控+持久化 saveModel、弹窗期 G.blockTime=-1（delayNextBlock(-1)）、OK 后 +100ms
  （hideTip:62 delayNextBlock(100)）。restoreModel tipFlags 由数组改对象（旧数组存档兼容）
- 调用点全对号: intro（GameState.as:104 每次 STT_PLAY, 首次弹过即不再）、combo（Tower.as:356-358
  首次完美落地, showTip 命中则 comboSetTimer 延到 OK 后——after 回调语义）、进城链
  bought_land→new_tower_type0→click_tower→city_meter(1塔)/city_line(2塔)（CityMap.as:105-118,
  原版 checkTipQueue 里程碑队列位置由 pumpCityTips 承担）、place_tower（CityMap.as:140/167,
  H5 无搬塔相位, 放在选格→建造入口, after=beginBuild）
- 测试适配: exec_test 模拟玩家点掉弹窗（__tipOpen 钩子）；首段 600 帧循环补真实 2ms/帧延时——
  发现纯虚拟时钟下 performance.now() 几乎不走, hideTip 的 100ms 锁永不过期（伪影非游戏 bug）
- 勘误留存: 原版 dropY=400 仅 Crane.init 生效（上轮已记）; 本轮补充 showTip 会 saveModel——
  提示弹过即写存档, 与 SharedObject 行为一致
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 29 轮（2026-09-30）— T4 city_spr_640.png 读图核对 + 城市热区实测校准

- 读图 (640x480 RGBA): 完整城市底版——5×5 蓝格网格/左侧 4 塔型图标列+推土机/顶部等级与人口
  HUD/底部白色消息框。坐标解密: Const.CITY_MAP_X=-96/Y=-133 为相对舞台中心(320,240)局部坐标
  → 网格左上 (224,107), 与 Const.CITY_MAP_CELL=52 (CityMap.as:216,286) 完全一致, H5 已对
- 像素实测 vs 旧 CSS 的偏差并修复:
  1) 选择列图标行 y=109/157/205/253 (节距 48, 高约 44, x≈155-210) — 旧 gap:10 节距 56,
     每档漂移 8px → 改 top:105/gap:4
  2) dozer 黄色区 x162-204/y302-362 — 旧 margin-top:14 落在 ≈340-384 偏 35px+ → margin-top:5
  3) 白色消息框 x146-493/y391-445 — cityStatus 原来挂在顶部 30px → 移入框内 (top:395 居中)
- 叠加层减重: 图标/色板已在底图中, .sel 的 .sw 色板 display:none, 只留文字标签+选中红框;
  locked 用白色半透明遮罩盖住底图图标（底图 4 个塔都是可选状态画的）
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 30 轮（2026-09-30）— T5 GameSprites/Person 逐函数普查 + toon 56 帧动画接入

- 普查结论（22+3 函数）: 特效/提示/结算/计数字/加成/重启/停止/Person 三函数全部已对号或 HTML
  等价（明细记 PARITY 4.1）; 唯一实质缺口 = Person 帧动画
- [P1] toon 帧动画: 发现 dude_spr/dudette_spr 已导出全 56 帧（读图 42x56）→ 载入 2×56 纹理,
  实现 eachTick 帧状态机: frame==1→randRange(0,9) 起播; frame==35→11 走路循环（仅 !arrived,
  原版到达帧同 tick 被覆盖到 36 语义等价）; arrived 后 <36→36, >=56 停 56 起 Fader 250ms;
  步进 30fps（1000/CRANE_FPS ms/帧, CRANE_FPS=30 即 Flash 帧率证据）; sprite 放大到原尺寸 42x56
- miss 坠落小人仍静态帧 → 记 T7
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 31 轮（2026-09-30）— T6 flash/ 资源盘点 + ambient 28 帧修复

- 全目录盘点: 已接入 8 类（明细记 PARITY 5.1）; 其余 219 个 fx/DefineSprite 目录为 UI/弹窗整clip
  导出（HTML 等价实现, 不需要）; image_10..17 待考
- [P0 接错修复] G.txFX 加载 fx/fx01..28.png 但该路径只有 5 张散装 → 23/28 纹理 404, 环境特效
  大部分类型空白。真源 = fx/DefineSprite_734_ambient_spr/1..28.png（338x196 全画布, 特效画在
  舞台原位）。读图比对 fx06 散装 = frame6 鸟群（同素材不同裁剪）→ 用 PIL alpha-bbox 离线把
  28 帧全画布紧裁生成 fx/fx01..28.png, 代码零改动, generateEffect 的纹理自然尺寸即原版尺寸
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 32 轮（2026-09-30）— T7 spawnFallingPerson 帧动画+运动学对号

- 取证 Tower.makeFallingPerson:327-342: dudette/dude 随机; gotoAndStop(9) 初帧; Flipbook 11→35
  /2000ms 循环（12.5fps 翻页）; Path 到 ±100/+100px / 5000ms → vx=±0.02, vy=0.02 px/ms
- [P1] H5 原来静态第 1 帧 + vy=0.15（快了 7.5 倍）→ 改初帧 9、Flipbook 11-35 循环（80ms/帧）、
  vy=0.02、vx=±100/5000、sprite 42x56 原尺寸（与 T5 的 toon 帧序列共用）
- 记录待办: swoosh_spr 翻页小特效（1→3帧/150ms, Tower.as:333）未复刻 → 待办池
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 33 轮（2026-09-30）— T8 CityMap 逐函数普查 + spinReels 补齐

- 普查（22 函数）: 7 个已对号、11 个 HTML/handler 等价、1 个缺失=spinReels（明细 PARITY 3.1）
- [P2] spinReels 补齐: finishCityTower 挂 placeInMap:463 的调用; 5 个 city_reel_spr
  （读图 20x34, 3帧）Flipbook 1-3/150ms×5 遍后移除（setRepCnt(5)+setKillSprite 语义）;
  坐标 (65-22i,-180) 相对 citySpr 中心 → 屏幕 (385-22i, 60), HTML img 翻帧实现
- restoreCity 的 icon 帧语义取证入档 → 下一任务 T9（缩略图原版化, 资产 603 已导出）
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 34 轮（2026-09-30）— T9 city_icon_spr 塔格缩略图原版化

- 读图: DefineSprite_603_city_icon_spr 16 帧 50x50 = 4 色 × (无顶/有顶/…), 验证帧 1=蓝无顶、
  2=蓝有顶（钻石顶）、6=红块 → 帧号=(color-1)*4+roof+1 与 restoreCity:71-73 一致
- renderCity: CSS 色块 div（高度对数近似+★pop 文字）→ img 原版图标; 格内 left:10/bottom:13
  （restoreCity:74-75: cellX+10, 下一行底-13）; 人口数字改 title 属性（原版图标不含数字）
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 35 轮（2026-09-30）— T10 高亮/拆除特效原版化

- 读图: 774=47x47 黄框单帧; 818=72x72 爆闪 6 帧
- .cell.ok 金 outline → 774 黄框 ::after（格内居中 inset 2px）
- dozer 拆除: 补 placeInDozer:398-405 的 city_demol_spr 翻页（1→6/1000ms→167ms/帧, 自毁）,
  拆除格中心 (224+col*52-10, 107+row*52-10) 锚定; 原 H5 只放音效无视觉
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 36 轮（2026-09-30）— T11 GameState 逐函数普查 + 进榜名字输入流

- 39 个 STT_* 状态逐一核对（明细 PARITY 4.2）: 唯一交互缺口 = 进榜名字输入流
- [P2] 补齐: showSummary 判 isQualified（!cityMode && pop>0 && rank<10, 条目带 id）→ 结算 OK →
  showNameDialog（输入 12 字符, 缺省 AAA, 回写同 id 条目）→ showHighScores 弹榜,
  榜单行加名字列——对号 STT_CHECK_HIGHSCORE:148-167 / STT_NEW_HIGHSCORE:168-173 /
  HighScore.showNameDialog→dialogDone→showPopup 链
- 普查归档: STT_SPLASH 原版 case 为空; 外链 5 态=有意不复刻; 其余 33 态 H5 等价实现
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 37 轮（2026-09-30）— T12 GameModel/Tower 普查收官

- GameModel 28 + Tower 21 函数全部归位（明细 PARITY 7.1）; 唯一行为缺口:
- [P2] Reset Map Yes 补 resetTips (GameModel.as:91-94): 原版 STT_RESET_MAP_YES 三连
  clearCity+resetTips+saveModel, 提示（intro/bought_land 等）重置后会重放; H5 原来漏 tipFlags 清空
- 记档: updateCityBadge 为 city_spr 内部实例帧（资产未单导出）, Lv.N 文本等价;
  clearSparkles 的挂块银火花为视觉微差 → 待办池
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 38 轮（2026-09-30）— T13 anim 基类层普查（9 类全取证）

- Path/CPath/Fader/Flipbook/Rotater/Message/Transformer/BPath/Anim 逐类读毕（明细 PARITY 8.1）;
  Flipbook 80ms/帧 与 T7 一致、Fader 线性与 H5 一致, 证实既有实现
- [P1] 落块 Rotater (dropTarget:202): 下落期间倾斜角线性回正——H5 原来落地才摆正
- [P1] bounceOffTower BPath (Tower.as:382): 撞塔块三次贝塞尔弹飞+旋转循环 1000ms——H5 原来直接消失;
  实现 G.bounces (P0/P1/P2/P3, Flash y 取反), 复用 lastFallMesh
- [P2] title Message 5000ms 自动进菜单 (GameState.as:63), 点击提前取消
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 39 轮（2026-09-30）— T14 时间轴脚本普查（三层覆盖收官）

- 46 个带脚本时间轴全归类（明细 PARITY 9.1）: 根帧=mochibot 追踪（不复刻）; 其余为 mx 框架/
  UI 弹窗/stop 占位/特效随机重播
- [P2] statusBar 队列语义 (DefineSprite_648): queueMessage 顺序播——showCityStatus 由覆盖式
  改 3s/条顺序队列 (statusQ/pumpStatus)
- 记档: 216 高分三分页表格（H5 单榜简化→待办池）; 706/713/223 随机重播≈fx 槽位随机重生
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 40 轮（2026-09-30）— T15 image_10..17 贴图盘点

- 逐张读图 + GLB md5 对比: 10/11/12/14 = GLB texture#8/#9/#11/#12 同hash（已间接接入）,
  13 与 12 重复, 15/16/17 为 jar 另一版纹理（不在 GLB, 记档备用）→ 无需新增接入（明细 PARITY 5.2）
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS（本轮零代码变更, 纯盘点轮）
## 第 41 轮（2026-09-30）— T16 miss 音效延迟语义

- 取证: fallPastTower (Tower.as:384-392) 块先坠到屏底 (Path dur=(viewH+200-y)*2), 到达后
  Message 触发 STT_SOUND+"snd_destroy" (wait=dur+100) — 即"坠出屏幕才响"; 撞塔分支即时响
- [P1] H5 miss 即时播 → 改为 missFall 回收时 +100ms playSound('snd_destroy'), 即时播只留撞塔分支
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 42 轮（2026-09-30）— T17 J2ME MIDI 可选 BGM + [P0] 菜单 HTML 落地

- MIDI: 80..88.mid 读头全 format0; parseMidi + WebAudio triangle 合成循环播放 (音量≈原版 40);
  菜单 552 帧12 MUSIC 位开关, 'twrblx_midi' 持久化, 默认关 (明细 PARITY 6.2)
- [P0] 菜单流 HTML 从未落地 (N14 只改 game.js) — 真浏览器 null 崩被 exec_test stub 掩盖。
  补 titleScr(467)/menuScr(473)/menuSub/五按钮(552 帧=BTN 常量, 坐标 makeMenuSprites:342-350)
- 教训同第 20 轮 TDZ: stub 类测试测不出 DOM 缺失 → 新任务 T18: smoke 加 id 存在性断言
- 全量回归: smoke 17 PASS / tower 7 PASS / city 10 PASS
## 第 43 轮（2026-09-30）— T18 DOM id 存在性断言（18 项）

- smoke_test +1 断言: game.js 引用的所有 DOM id（getElementById + bindMenu b('m*')）必须在
  index.html, hsName 除外; 首跑即抓出 summary 缺失(第2个同类P0)与 lives 死引用, 已修
- 修复: index.html 补 #summary markup+CSS(居中白面板, showSummary/showTip 共用);
  game.js 删 hud.lives 死引用
- 过程教训记录: 两处 Edit 假成功(超时), python 重打后 grep 验证才落稳
- 全量回归: smoke 18 PASS / tower 7 PASS / city 10 PASS
