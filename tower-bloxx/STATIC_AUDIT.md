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
