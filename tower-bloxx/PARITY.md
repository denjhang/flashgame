# Tower Bloxx H5 与原版全面对差清单（PARITY）

> ## ▶ 下一轮任务（活页区——每轮由此开始, 做完勾掉并写入下一项；任务一律以【函数】/【资源】为单位, 目标=一模一样）
>
> **T35.【回归】维护轮**：三件套守护 + 巡检（无具体任务时跑全量回归并巡检记档项，
> 发现回归立即修）。
>
> **待办池**：（空）
>
> （每轮完成后：把完成的项标 ✅ 移入对应章节，并在此区写下一轮任务——任务来源是本文件, 不是定时任务提示词。）

盘点源：`scripts/scripts/__Packages/bz/esg/game/*.as`（Const/GameState/GameModel/GameSprites/
CityMap/Tower/Crane/Tipper/ComboTimer/Person/HighScore）、时间轴脚本（paperdefense_fla）、
J2ME 版资源（scene.m3g/MIDI）。对照物：`h5/game.js` 当前实现。
状态：✅ 已对号 / 🟨 部分 / ❌ 缺失。每项标注原版证据与优先级。

## 1. 核心落块循环（quick game 内核）

| 项 | 状态 | 证据 | 说明 |
|---|---|---|---|
| 摆钩椭圆轨迹/周期 2600ms | ✅ | CPath.as:33,54-64 / Crane.as:46 | radx=min(70,30+totalBlocks), rady=25; aOffset=270+ccw → 首摆向右, 椭圆中心在枢轴上方 rady (第27轮) |
| 落块惯性漂移 blockDx*3 | ✅ | Crane.as:198-199 | |
| 落程 dropY=400→340 固定屏幕落点 | ✅ | Crane.as:57,199-201 | 首块落程 400, 之后恒 340 且会话内不重置 (resetGameVars 不碰); 判定只用 x 偏移, dropY 仅定时长 |
| 三档判定 hitLimit/BLOCK_H | ✅ | Tower.as:124-167 | |
| 塔身倾斜保留 currCtr+=blockDx | ✅ | Tower.as:117/208-210/282 | |
| 摇晃倾斜投影参与落点测量 | ✅ | Tower.as:118 + Utils.as:12-15 | |
| 完美落地/连击/连击银行 | ✅ | Tower.as:222-233,330-334 / ComboTimer.as:28-46 / GameModel.as:110-129,159-176 | |
| 计分 floor(stacked/10+inc)+comboBank | ✅ | GameModel.as:159-176 | |
| 摇晃近3次均值+maxTowerAngle | ✅ | Tipper.as:49-59,77-81 / GameModel.as:236-239 | |
| 3 条命/miss/knock 扣命 | ✅ | Tower.as:139-176 / Const.NUM_TRIES | |
| 无尽模式 totalBlocks=999 | ✅ | GameState.as:97 | |


### 1.1 忠实度抽查回归（第 47 轮, T22 ✅）——二遍细读捞真 bug
- [P1] 挂块倾斜门控 (updateBlock Crane.as:66-79): 原版仅 rotateBlock(首块/屋顶除外)倾斜,
  块心沿 ang+90 偏移 targetDy=65 → H5 原来无条件倾斜且无偏移, 已修; drop 生成点改用挂块
  实际位置(倾斜偏移连续, 原来瞬跳回钩心)
- [P2] showPopChange(-999) 清 "+" 浮字 (GameModel.as:147-151): miss/撞塔分支立即清
  → H5 popClear() 挂到两个 miss 分支 (原来自然过期 1.2s)
- [P1] 第41轮 T16 补丁幻影叠加: miss 分支 G.missFall.push 重复两行 (视觉双块, 测试不敏感
  未暴露) → 去重。二遍细读的直接战果


### 1.2 landOnTower 并排复核（第 48 轮, T23 ✅）
- [P1] currCtr 双计 blockDx: 原版 :120 offset 已含 +bd、:282 currCtr=blockx+bd 恰好抵消
  (blockx=currCtr+offset-bd) → H5 原来再 +towerBdx 多漂 bd/块, 已修 (currCtr += x)
- [P1] makeSpark 从未被调用: 原版完美落地 4 角各一颗 (landOnTower:248-251, 角度 135/45/225/315),
  H5 定义了 makeSparks 却没接 → 重写单颗 makeSpark + perfect 分支 4 调用
- [P2] 落块 Rotater 渐正 (landOnTower:211: offset/2→0 over DELAY_PAN_UP=500ms)
  → G.straighten 队列, H5 原来永久停倾
- 已核实一致: 完美吸附清 blockDx (:206-210)/comboMult++ 先于判定 (:233)/makePeople 数量
  4/3/2/1 三档/roof aoff=128-aoff*256/BLOCK_H 折算 (:293-302)/updateCleanTower 时点


### 1.3 ComboTimer/计分并排复核（第 57 轮, T32 ✅）——五处修复
- [P2] combo fill 比例: bar._width=min(136, remaining*136/5000) (ComboTimer eachTick:86)
  → H5 原来按 163px 槽整段缩放, 已改 136px/5s 基准
- [P1] changePopulation 负分支缺失 (GameModel.as:174-177: 扣分=floor(stacked/10+|inc|))
  → knockTopBlock 改走 changePopulation(-pop) 且先于 stacked-- (原版顺序), 原手写扣分删
- [P1] cleanTower 条件错: 原版=currColor≤sm_unlockedTrophyTowerType 且 人口≥limit (:181);
  H5 原来是猜的 (currColor≤0 或 人口) → 补 sm_unlockedTrophyTowerType 字段全链
  (G 字面量 -1/存档持久化/updateCityLevel 解锁 [8,12,14,16] (Const:218)/startGame 同步)
- 已核实一致: setTimer/addToTimer 上限公式 (:60-75)/setSecs 文本与 finishCombo 触发 (:97-105)/
  combo 银行公式 (:163)

## 2. 塔楼目标与屋顶（quick/city 共用）——✅ 机制闭环（2026-09-29）

- ✅ 目标高度：`?mode=tower` → `totalBlocks=(type+1)*10`（CityMap.as:508）；快速游戏仍 999 无尽
- ✅ 屋顶块：needRoof（Crane.as:209）→ 专用模板 mesh253/254；人口按 `128-aoff*256/BLOCK_H`
  折算（Tower.as:252-261 roof 分支，trophy 除数 (currColor+1)/2）
- ✅ 奖杯屋顶 trophyRoof：needRoof && cleanTower（Crane.setTarget；cleanTower=人口≥
  TROPHY_TOWER_POP_LIMITS[currColor]，GameModel.as:181）→ mesh254 放大 variant（3D 替代外观）
- ✅ GAME_WON 结算：showSummary 面板 人口/塔高/最长连击 + New record!（GameSprites.showSummary:48-59,
  GameModel.getSummary:204-207, Const.TIP_SUMMARY_REC/MSG_RESTART），OK 点击重开
- ✅ tries 用尽未达标无屋顶入城: gameOver(false)→finishCityTower 无屋顶放置, 行为已对号;
  TIP_OUT_OF_TRIES 经查为死常量 (Const.as:108, 全源码无调用点), 原版也无提示


### 2.1 gameOver/knockNextBlock 并排复核（第 49 轮, T24 ✅）
- [P1] gameOver 时序: 原版 Message wait=GAME_OVER_DELAY=1000ms, 赢时再 +panDown
  (dur=min(DUR_PAN_DOWN=3000, stacked*250)) 回卷塔底后才弹结算 → H5 原来立即弹, 已改
  setTimeout(1000+pan); won 时 camTarget=0 触发回卷 (camera glide≈panDown 视觉)
- knockNextBlock 已核实一致: 弹顶块+dumpPerson/landingY 回退/currCtr=新顶块/stacked-1;
  弹飞 BPath 已在第52轮对号 (pushBounce 确定性方向)
- checkTipQueue 顺序 T3 轮已核实 (pumpCityTips 2.6s 间隔)


### 2.2 待办池清零（第 50 轮, T25 ✅）——三个小视觉项一次做完
- ✅ swoosh_spr 烟雾轨迹 (790, 读图 46x66×3帧): spawnFallingPerson 处 Flipbook 1→3/150ms
  自毁 (makeFallingPerson:329-334)
- ✅ 地基塔身抖动 (landOnTower:217-219): y-5 osc 75ms×6 次=900ms, G.shakeT 施加于塔组
- ✅ 挂块 combo 银火花 (makeBlock:135-138): comboMult!=0 且 rotateBlock 时挂 star 精灵,
  随块回收 (clearSparkles 语义)


### 2.3 knockTopBlock 改 BPath（第 52 轮, T27 ✅）
- knockNextBlock:169-173 弹飞方向确定 (offset=新顶块x−被弹块x), wait=DELAY_FINAL_TUMBLE=250ms
  → 抽 pushBounce(mesh,offset,wait) 助手 (撞塔/knock 共用), bounces 更新支持 wait 冻结期

## 3. Build City 城市模式——✅ 闭环（底图/热区/塔格缩略图/滚轮动画全原版, 第29/34/33轮）

- ✅ 5×5 网格（CITY_MAP_CELL=52px）+ 放置校验 isValid（CityMap.as:561-567）
- ✅ 邻接解锁 allowed 表（CityMap.updateAllowedTowerTypes:569-632: 红1需蓝邻, 绿2需蓝+红, 黄3需蓝+红+绿）
- ✅ 塔型选择/锁（TOWER_UNLOCK_LIMITS=[0,3,6,10] 按城市等级, buildTower:505-513
  totalBlocks=(type+1)*10, currColor=type）
- ✅ placeInMap 全链（CityMap.as:411-460: setTowerInfo(color=type+1/roof帧)→calcCityPop→
  增减人口状态文本(STATUS_POP_INC*)→updateCityLevelAndUnlockedTypes→saveModel→空地foundation/重建destroy音）
- ✅ 城市等级/进度条（GameModel.as:281-318, CITY_LEVEL_LIMITS 20 级, 338px 条）
- ✅ 0 命未达标 → 无屋顶入城（TIP_OUT_OF_TRIES）
- ✅ 升格称号提示（CITY_PROMOTION_LEVELS→CITY_TYPES 队列, GameModel.as:315-323）
- ✅ 里程碑提示（TIP_MSa + CITY_LEVEL_LIMITS 阈值, addTipToQueue:243-250 队列语义）
- ✅ 替换对比人口（TIP_CITY_COMPARE: 点已占格显示 Old 人口）
- ✅ dozer 拆除（placeInDozer:398-410 语义: dozer 按钮+点塔拆除, snd_destroy）
- ✅ city_spr 原版美术（FFDec 导出 chid668, 640×509→裁 480; 网格原点对号
  (320+CITY_MAP_X, 240+CITY_MAP_Y)=(224,107), 格 52px; 塔型选择器/dozer 对齐原版面板位置）

**第 3 节全部 ✅（城市模式闭环）**

证据：CityMap.as 全文 + Const.as:67-71/103/117-119/216-220。

- ❌ 5×5 城市网格（CITY_MAP_*，52px/格），放置/替换/对比人口（TIP_CITY_COMPARE）
- ❌ 4 种塔型解锁链：Residential→Commercial→Office→Luxury，
  `TOWER_UNLOCK_LIMITS=[0,3,6,10]`（城市等级），放置邻接规则 `STATUS_CITY_RULES`
  （红需蓝邻、绿需红+蓝、黄需红+蓝+绿，CityMap.isValid:561）
- ❌ 城市人口等级 `CITY_LEVEL_LIMITS=[0,75,…,19000]`（20 级）+ 升格动画/提示
  （CITY_TYPES 9 级称号 Tiny Town→Megalopolis，CITY_PROMOTION_LEVELS）
- ❌ 20 里程碑提示（TIP_MS1a/MSa）
- ❌ 拆除位 dozer（placeInDozer:398）
- ❌ 网格存档 SharedObject（GameModel.sm_towerGridData 等 → H5 应 localStorage）
- ❌ 城市背景（city_spr 网格视图）与城市 BGM `sng_city`


### 3.1 CityMap.as 逐函数普查（第 33 轮, T8 ✅）
- 已对号: placeInMap/placeInDozer/isValid/updateAllowedTowerTypes/calcCityPop/buildTower/
  updateCellHighlights（.cell.ok 高亮）
- HTML/handler 等价: setMode（MODE_* 分散在 cityCellClick/finishCityTower/showCity）、
  setPlaceOK/setSelectOK、onMouseMove/mouseRoll（悬停高亮; carry 幽灵塔 n/a——H5 建后才放）、
  showTowerSelections/checkButtons/selectTowerType/selectTower/showMenu（cityMenu HTML）、
  placeTower（finishCityTower）、restoreCity（renderCity）
- 第 33 轮补齐: spinReels ✅——placeInMap 后 5 个 city_reel_spr 滚轮翻页（Flipbook 1-3/150ms
  ×5 遍, 读图 20x34, 原版坐标 65-22i/-180 相对中心 → 屏幕 (385-22i,60), setRepCnt(5) 后移除）
- ✅ 城市塔格缩略图原版化（第34轮, T9）: city_icon_spr 603 共 16 帧 50x50（读图验证 1=蓝无顶/
  2=蓝有顶/6=红块）, renderCity 用 img 帧号 (color-1)*4+roof+1, 格内 left:10/bottom:13,
  原 CSS 色块+人口文字移除（原版图标不含数字）


### 3.2 高亮/拆除原版化（第 35 轮, T10 ✅）
- ✅ 可建格高亮: city_place_highlight_spr(774) 单帧 47x47 黄框（读图验证）, .cell.ok::after
  52 格内居中 inset 2px, 替换金 outline（updateCellHighlights:514-539 语义=格级显隐, 帧按 color
  切换——H5 单帧, 因 774 只导出 1 帧）
- ✅ dozer 拆除特效: city_demol_spr(818) 6 帧 72x72 爆闪（读图验证）, placeInDozer:398-405
  翻页 1→6/1000ms 后自毁, 拆除格中心锚定

## 4. HUD 与界面——✅ HUD 本体闭环（2026-09-29）/ 菜单流 ❌ [P1]

- ✅ 高度进度条（tower 模式 fill=stacked/total + 顶部旗标 hudTop；GameModel.as:208-227；quick 隐藏）
- ✅ 命数 HUD tries（LWR_LFT 51,-55，♥ 计数替代原版帧动画，GameModel.as:139-148）
- ✅ 人口 5 位数字（GameSprites.setDigits:124-136，padStart(5)）+ 连击计量 "min(5,secs) x mult"
  （ComboTimer.setSecs:50-56）
- ✅ 音乐/音效/退出按钮（GameSprites.buildGameSprites:99-101 坐标 594,20/50/80；开关先存偏好，
  音频落地后生效；退出暂回模式入口）
- ✅ 人口增量弹出文本：落块 "+实得"（GameModel.changePopulation:168-171 showPopChange）；
  连击银行支付 "Combo bonus! +N" 3000ms（GameSprites.showBonusPopulation:361-369 + Const.MSG_COMBO）
- ❌ 菜单流：splash→title→menu（GameState.as:53-257 状态机）、Instructions 三页、About、
  High Scores、Reset 确认弹窗——依赖城市模式，保持在清单末位
- ✅ 菜单流：title→menu（原版 title_spr/menu_spr 位图 + makeMenuSprites:341-355 按钮坐标）
  Build City→城市 / Quick Game→无尽 / Reset Map→确认弹窗（STT_RESET_MAP_YES/NO）/
  Instructions（Quick Game/Build City/About 三页, TIP_INSTR*/TIP_ABOUT 全文）/
  High Scores（本地 top10, HighScoreLocalProxy 语义）；无 URL 参数时从 title 进入
- ⬜ Get More Games/Mobile League/Tell a Friend 外链按钮（平台依赖, 有意不复刻）
- ✅ splash 素材（828 logo 已接, 第55轮: 无 URL 模式 2s→title）
- ✅ tipFlags 首次提示弹窗（第28轮）：showTip 门控=tipFlags 持久化+弹窗期 delayNextBlock(-1)/
  OK 后 +100ms（GameSprites.showTip:28-46/hideTip:60-63）。调用点: intro（STT_PLAY GameState.as:104）/
  combo（首次完美落地 Tower.as:356-358, OK 后补 setTimer）/ bought_land→new_tower_type0→
  click_tower→city_meter(1塔)/city_line(2塔) 进城链（CityMap.as:105-118）/ place_tower（选格进城时）


### 4.1 GameSprites/Person 逐函数普查（第 30 轮, T5 ✅）
- 逻辑 1:1 对号: generateEffect/updateEffects（Const 三表+m_effectOccurences 全量）、showTip/hideTip、
  showSummary、setDigits、showBonusPopulation、restartGame、stopGame、
  Person.init/eachTick/factory（行走 (T-p)/2 半步+±seekMax(10..30)+50ms 节拍+250ms 淡出）
- HTML/overlay 等价（交互语义在, 非逐像素）: buildGameSprites/enableMainMenu/make-kill 三组弹窗/
  makeGameButton/makeMenuButton/makeMenuSprites/updateCityMap（594,80 菜单钮=btnExit）
- 第 30 轮升级: Person toon 帧动画全 56 帧接入（读图 42x56）——eachTick 帧状态机
  frame==1→rand(0..9) 起播 / 35→11 走路循环 / 到达后 <36→36 / 56 淡出, 30fps 每帧 33.3ms
- 剩余: spawnFallingPerson 静态帧 → T7


### 4.2 GameState.as 逐函数普查（第 36 轮, T11 ✅）
- 39 个 STT_* 状态逐一归位: 核心流（PLAY/BLOCK_LANDED/CLEAR_TO_SEND/GAME_WON/LOST/OVER/RESTART/
  HIDE_POPUP/INSTR1-4/HIGHSCORES/RESET_MAP*/CITY/SOUND/MUSIC/EXIT*）H5 均有等价实现;
  STT_SPLASH 原版 case 为空 break（素材在时间轴, 等效跳过）; 外链 5 态（CALLTOACT*/GET_MORE_GAMES/
  MOBILE_LEAGUE/TELL_A_FRIEND）= 有意不复刻项
- 7 个函数: setTargetState/cngState/onEnterFrame=H5 直接事件驱动等价; toggleSongs/toggleSounds/
  playSound/playSong/stopSong ✅; dialogDone=OK 回调等价
- 第 36 轮补齐: 进榜名字输入流 ✅——isQualified(top10 且 !cityMode)→结算 OK 后 showNameDialog
  （输入→回写同条目 by id）→showHighScores 弹榜（STT_CHECK_HIGHSCORE:148-167 +
  STT_NEW_HIGHSCORE:168-173 + HighScore.showNameDialog/showPopup 链）; 榜单行加名字列


### 4.3 smoke 防线 + summary 面板补齐（第 43 轮, T18 ✅）
- [P0] 第二个同类缺失: summary 面板（结算/提示共用弹窗）无 markup 无 CSS → 已补
  （居中白面板+标题/.ok 样式, popupSpr 语义）
- [P2] 死引用: hud.lives=getElementById('lives') 从未使用 → 删
- smoke_test 新增断言(第18项): game.js 的 getElementById(...) 与 bindMenu b('m...') 引用的
  id 必须存在于 index.html（hsName 除外=动态 innerHTML）——断言首跑即抓出上述两项,
  防线生效。教训: Edit 工具超时可能假成功, 重补后必须 grep 验证


### 4.4 HUD 位图化（第 53 轮, T28 ✅）
- tries_spr(358) 26 帧位图: 帧=3+currColor*6+(3-tries)*2 (GameModel.as:143), 替换 ♥ 文本;
  population_spr(303) 97x26 底图 + 数字叠圈位 (读图圈槽 x25..95, 5 圈距 15px);
  combo_spr(275) 272x52 顶中 (UPR_CTR 0,50) + fill(读图条槽 x36..199)+文字盖内嵌样本;
  progress_spr(251) 47x232 帧=1+total/10 (:216) + blackBar=(total-stacked)*5px 底锚 4px (:226-227)
  + hudTop 旗 (bottom=21+seg)
- 坐标全部来自 buildGameSprites:91-95 (LWR_LFT/UPR_CTR 锚点)


### 4.5 弹窗面板位图化（第 54 轮, T29 ✅）
- 读图: 462 popup_spr 与 444 confirmation_reset 同为绿色圆角面板 433x219 (462 帧带滚动箭头变体);
  360 msg_spr 无导出帧 (记档)
- #summary 白面板 → 462 位图面板 (popupSpr CTR 0,40 → 屏 (320,280) → left104/top170);
  showResetConfirm 改用 444 面板 + Yes/No (原 menuSub 文本路径停用)
- 教训: python 补丁切点落在旧函数体中段会留孤儿代码——node --check 必须在补丁后立即跑
  (本轮 node --check 抓到 Unexpected '}', 已清)

## 5. 视觉表现层——✅ 全接入（背景/特效/小人/特效帧/HUD/菜单/弹窗/splash 全原版位图）

- ✅ 视差背景 3 层 bg2/3/4（FFDec 导出原版位图 640×2000/912/316，Tower.move:93-104
  `worldY = camY×(1-ratio)`，BG_RATIOS 0.05/0.1/0.2；bg4 纵向平铺 6 次覆盖太空段；
  原版无 bg5_spr，NUM_BGS 循环 2..4）
- ✅ 环境特效系统 28 种：ambient_spr(chid734) 帧结构反汇编成功（27 帧每帧 PlaceObject 一个子剪辑
  670..733），FFDec 逐子剪辑导出 26 张原版位图（鸟群/飞艇/气球/云/客机/星星/行星/鲸鱼…）；
  三表状态机全对号（EFFECT_PROBABILITIES_START/END/PROB/SPD + 次数表 GameSprites.as:26，
  槽位 9、出生点/速度/出界回收 GameSprites.updateEffects:154-208 + generateEffect:209-263）
- ✅ 小人系统：落块居民走半步逼近入住（Person.as:24-66，出生 ±viewWidth/2、上方 rand(100,200)、
  步长 min(PEOPLE_MAX_MV±10, dist/2)、每 50ms、到达 250ms 淡出）、miss 小人坠落
  （makeFallingPerson:296-310 漂移±100/5s）、完美落地四角星形火花（makeSpark:311-317, speed=100）
- ❌ 落块 bounceOffTower 旋转弹飞轨迹（BPath 抛物线，Tower.as:344-356）
- ✅ 楼块外观按 currColor 选款（CityMap.as:160 currColor×4 语义；quick=3→第 4 款，tower=0→第 1 款）
- ✅ 屋顶人口/特效触发（snd_stacked 音效待音频轮）
- ❌ 音效触发视觉（snd_destroy 等与动画同步）


### 5.1 flash/ 资源盘点（第 31 轮, T6 ✅）
- ✅ 已接入: city_spr_640.png(城市底版) / bg2/3/4(视差,231/423/426) / dude+dudette 56帧(753/772) /
  star 3帧(783,火花用第1帧) / fx 28帧(环境特效) / image_12(吊钩) / scene.glb(3D积木) / audio 12个
- ✅ 第31轮修复[P0接错]: ambient 28 帧实际在 fx/DefineSprite_734_ambient_spr/(338x196 全画布),
  代码指的 fx/fxNN.png 只有 5 张存在 → 23 纹理 404 空白。已离线 bbox 裁剪 28 张全画布帧
  生成 fx/fx01..28.png 紧裁单图（与既有 5 张散装同规格, 读图比对 fx06=frame6 鸟群一致）
- 未接入（有意/低优先）: fx/ 下其余 219 个 DefineSprite 目录多为 UI 弹窗/按钮/块模板的 FFDec
  整clip导出（HUD/菜单用 HTML 等价实现）; image_10/11/13..17（J2ME/UI 贴图, 用途待考）


### 5.2 image_10..17 贴图盘点（第 40 轮, T15 ✅）
- 逐张读图: 10/11=64x64 蓝/绿块面纹理, 12/13=16x16 吊钩件, 14=8x8 色点, 15=64x32 红蓝门面,
  16=32x32 红屋顶, 17=32x32 绿块 —— J2ME jar 原始纹理导出
- md5 对比 GLB: image_10/11/12/14 与 scene.glb 内 texture#8/#9/#11/#12 完全同hash → 已通过
  GLB 间接接入; image_13 与 12 同内容重复; 15/16/17 不在 GLB（j2me jar 另一版纹理, 备用记档）
- 结论: 无需新增接入, 全部已有归属


### 5.3 panDown 时长精确化（第 51 轮, T26 ✅）
- Tower.panDown (:199-201): Path 到塔底, dur=min(DUR_PAN_DOWN=3000, stacked*250) → H5 原来
  camTarget=0 靠 500ms glide; 改 G.panDownDur/T/StartY 线性 tween 精确时长, 结算弹窗时序
  (1s+pan, 第49轮) 与镜头同步


### 4.6 splash 接入（第 55 轮, T30 ✅）
- 828_splash_spr 读图: Digital Chocolate logo 640x480 满屏 → 无 URL 模式启动先显 logo 2s
  再进 title (STT_SPLASH 原版 case 为空, 时序在时间轴); 点击不做跳过 (原版时间轴亦无)
- 360 msg_spr 无导出帧, 记档


### 5.4 结算数字/悬停取证（第 56 轮, T31 ✅）——两项候选均判"非差距"
- 结算面板: popup displayText=areaField.text 纯文本 (462 帧脚本) → H5 HTML 文本一致,
  无位图字需求; HUD 数字 setDigits 也是动态文本字段 (digit0..4) → HTML 数字等价
- city_icon 悬停放大: CityMap 无 rollOver/_xscale, 原版不存在 → 不做


### 5.5 钩缆线对号（第 62 轮, T35 ✅）
- Crane.animate:86-92: lineStyle(3,0,50)=黑 3px 20% 透明; moveTo(320,-100)=固定枢轴斜拉
  → H5 原来竖直不透明线, 改斜线 (起点=枢轴 x−钩 x) + 透明黑材质
  - 补: 钩贴图随倾斜旋转 (hookSpr._rotation=_loc3_ Crane.as:73 / setTarget 归零 :59) — 第 63 轮
  - 补: 小人生成坐标 (第 68 轮) — makePerson:320-322 偏移=±viewWidth/2 (±320, H5 原 ±160..320),
    右侧出生镜像 (_xscale=-100)
  - 补: 右上角三按钮位图化 (第 66 轮) — menu_btn_spr 帧 12(MUSIC)/11(EFFECTS)/9(EXIT) 按中心
    594,20/50/80 裁切布置 (bbox 实测), 替换 ♪/🔊/✕ 文本

## 6. 音频——✅ 闭环（2026-09-29）

- ✅ 歌曲与音效全部为原版 SWF 内嵌音频，FFDec 整体导出（ExportAssets 1:1）：
  sng_tower/sng_title/sng_city + snd_combo/click/city_milestone/destroy/foundation/stacked/
  fanfare_bad/good/mediocre（共 12 个 mp3，h5/assets/audio/）
- ✅ 触发点对号：snd_foundation 地基（Tower.as:203）、snd_combo 完美（:228）、snd_stacked
  非完美堆叠（:222-248）、snd_destroy miss/撞塔（:139-167）、snd_fanfare_bad/good 胜负
  （GameState.as:121-131）、playSong("sng_tower") 开局（GameState.as:102）、按钮 snd_click
- ✅ 音乐/音效开关生效（STT_MUSIC_TOGGLE/STT_SOUND_TOGGLE, GameState.as:249-255）
- ✅ 胜利号声分档: trophyRoof ? snd_fanfare_good : snd_fanfare_med (GameState.as:128;
  原版资产名 "snd_fanfare_med", ExportAssets 导出名为 snd_fanfare_mediocre, H5 用后者 1:1)
- ✅ 考证不移植项: Crane.fakeDrop/fakePerfect (Crane.as:213-220) 为原版内部作弊死代码,
  无任何 UI 调用方, 与 sm_cheatsOn 一样属调试残留
- 备注：J2ME 9 首 MIDI 为手机版曲目，与 Flash 版曲库不同源；Flash 版即权威，MIDI 不再转码


### 6.1 音效时机普查（第 41 轮, T16 ✅）
- [P1] fallPastTower 的 snd_destroy 是延迟播: Path 坠到 viewHeight+200 (dur=(屏底-y)*2ms) 后
  Message(STT_SOUND+"snd_destroy", dur+100ms) 才触发 (Tower.as:386-390); H5 原来即时播 →
  改为 missFall 块坠出屏幕回收时 +100ms 播
- bounceOffTower 分支 (Tower.as:146) 即时播 ✓ H5 一致; CityMap placeInMap:425-429
  foundation/destroy 即时 ✓; fanfare 三态 (GameState:120/128) ✓ (第 N23 轮已对号)


### 6.2 J2ME MIDI 曲库 + 可选 BGM（第 42 轮, T17 ✅）
- 取证: MIDI 已解包 j2me/res/nokia_v1011/80..88.mid（全部 format0/480tick, 读头验证）;
  80(3.8K)/81(10.4K 主旋律)/82(5.1K) 为曲目, 84-88 短音效; 原版 o.java "audio/midi"+
  VolumeControl 40; 歌曲经 r0 打包负数 id 解码 (g.a: (id&0x7FFF) 索引)
- 接入: parseMidi(格式0 解析+tempo) + WebAudio triangle 合成 (gain 0.09≈40/100 音量,
  线性起音+指数衰减), 整曲 setTimeout 循环; 菜单 MUSIC 位 (552 帧12, Get More 空位) 开关,
  localStorage 'twrblx_midi' 持久化, 默认关（可选 BGM, Flash mp3 歌曲仍是权威）
- [P0] 同轮修复: 菜单流 HTML 从未落地 (N14 只写了 game.js, index.html 缺
  titleScr/menuScr/menuSub/五个 mBtn)——真实浏览器 showMenu() 必 null 崩, exec_test 的
  getElementById stub 掩盖。已补齐: titleScr=467 位图(648x480 读图), menuScr=473 底图
  (640x480), 五按钮=552 帧1/2/3/4/10 (帧号=BTN 常量 Const.as:6-14, 299x67 读图),
  坐标=makeMenuSprites:342-350 中心点换算

## 7. 存档/记录——✅ 闭环（2026-09-29）

- ✅ 存档键与字段 1:1：`localStorage["twrblx_cookie"]` = { sm_towerGridData, sm_totalPopulation,
  tipFlags }（GameModel.restoreModel/saveModel:82-108，SharedObject 名原样）；sm_towerGridData
  结构已就位，城市模式接入后即写入
- ✅ 结算纪录 populationRecord/blockRecord/comboRecord 持久化（localStorage["twrblx_records"]；
  原版纪录仅会话内 GameModel.as:11-13，H5 按用户预期跨会话并保留字段名）
- ✅ 音乐/音效偏好持久化（twrblx_music/sound）
- 结算面板 "New record!"（setComboMult:190-193）前轮已实现


### 7.1 GameModel/Tower 逐函数普查收官（第 37 轮, T12 ✅）
- GameModel 28 函数: 已对号/等价全覆盖——getRoofType（H5 内联读 [..+2]）、resetMaximums
  （startGame 重置 comboMax 等）、formatInfo（showSummary line()）、setMapTower/getMapTower
  （renderCity 重渲等价）、clearCity（Reset Yes 清数据等价）、showCityPop（cityPop textContent）
- Tower 21 函数: 全覆盖——getBGTileId/move（BG_TEX 视差 :236）、makePerson（spawnPeople）、
  blockDropped（drop()+falling 流）、clearSparkles（挂块银火花已接, 第50轮）
- 第 37 轮修复: Reset Map Yes 补 resetTips（GameModel.as:91-94, STT_RESET_MAP_YES:242-248
  clearCity+resetTips+saveModel）——原版重置城市后首次提示会重放, H5 漏了
- 记档: updateCityBadge（cityBadge2 帧=max(1,cityLevel), GameModel.as:411-414）为 city_spr 内部
  实例, 资产未单独导出; H5 'Lv.N/20' 文本 = 等价实现


### 7.2 HighScore.as 普查 + 三表落地（第 44 轮, T19 ✅）——game/*.as 十类普查全部收官
- HighScore 17 函数 + HighScoreLocalProxy 全取证: 三榜语义 = CITY(nTotPop 城市总人口)/
  QUICK(nHighPop session 最高单塔)/QUICK2(nHighBlocks 最高塔高), 预置榜 Player1-10
  (sPreset_* 逐字对号: 10000..100/3000..50/500..10); stripIllegalChars 去 ,|;
  startGame session 复位/endOfRound 取 max/isQualified 双源任一/submitName 写表+重读
- H5 重写: 单榜 twrblx_highscores → 三表 twrblx_hs(CITY 展示用预置, QUICK/QUICK2 可进榜),
  showSummary=endOfRound(hiPop/hiBlocks 取 max), 结算 OK→showNameDialog(名字去 ,|, 截 12)→
  hsInsert 双榜→三表弹窗; hsEsc 防 name 注入 innerHTML; G.hs session 在 startGame 复位
- 未复刻(记档): NETWORK 源(原版服务端已死)+CITY 榜写入(原版城市模式 CHECK_HIGHSCORE 直接
  回 STT_CITY 不写榜, 语义一致)


### 7.3 存档兼容自测（第 59 轮, T34 ✅）
- exec_test 加 SAVE_SEED=1/2/3 三代存档种子 (v1 空对象/v2 数组 tipFlags/v3 现行全量),
  注入后跑 tower+city 双场景: 7+10 PASS 全兼容
- smoke 第 19 项断言: restoreModel 对 sm_unlockedTrophyTowerType/tipFlags 的兜底代码必须在位


### 7.4 高分表播种回写（第 61 轮, T35 ✅）
- hsLoad 播种预置榜后未落盘 (SharedObject 语义应为读取即写) → 补 setItem 回写;
  exec_test city +1 断言: 三表 10 行就绪 (city 11 PASS)

## 8. 输入——🟨

- ✅ 点击/空格/下方向键/PgDn 放块（TIP_INTRO; Tipper.as:62 Key.isDown(34)）
- ✅ 放块时机: 鼠标松开判定 + 重开后 1s 落块锁（Crane.buttonPressed:153-156 (!mouseState||Key40||Key32),
  restartGame blockTime=getTimer()+1000）—— 第 22 轮自查发现并修正
- ✅ 下方向键/PageDn（Key.isDown 34 → e.code PageDown, 已接）
- ✅ 菜单鼠标导航（menu 位图五按钮）/城市点击定位（原版亦为点击非拖放）
- ⬜ 暂停按钮: 原版脚本无 pause 逻辑 (全源码无引用), 记档不复刻
- ✅ 移除 H5 自创常驻提示条 (第 64 轮): #hint/#cityHint 原版不存在, 提示职能归 tipFlags
  弹窗 (TIP_INTRO 等) 与城市状态条 (648 队列)


### 8.1 anim 基类层普查（第 38 轮, T13 ✅）
- Anim 基类: 工厂+对象池/wait 首帧/loop/osc/repCnt/killSprite/nextState 语义——H5 事件驱动等价
- Path(线性 tween)/CPath(第27轮已对号)/BPath(三次贝塞尔)/Fader(线性 alpha)/Flipbook
  (start→target+0.99 线性翻页, floor 取帧)/Rotater(角度线性)/Message(定时→nextState)/
  Transformer(值插值基类)——9 类全取证
- 第 38 轮补齐三个缺口:
  1) [P1] 落块 Rotater (Crane.dropTarget:202): 挂块倾斜角在下落期间线性回正到 0
     (H5 原来落地瞬间才摆正)——drop() 存 rot0/left0, falling 每帧 rotation=rot0*left/left0
  2) [P1] bounceOffTower 的 BPath (Tower.as:367-383): 撞塔块沿三次贝塞尔弹飞
     P1=(x+off/2,y+50) P2=(x+off,y-100) P3=(x+off*2,屏底), 1000ms 自毁 + Rotater 359°/s 循环
     (H5 原来块直接消失)
  3) [P2] title 自动进菜单 (GameState.as:63 Message 5000ms): showTitle 挂 5s 定时, 点击取消

## 9. 已知有意差异（不属于"不一样"）

- 3D 渲染取自 J2ME 版资产（Flash 版是 2D）——用户指定要 J2ME 3D
- 去除 Kongregate/MochiBot/广告/Get More Games 外链（平台依赖，无法也无需复刻）
- m3g 吊车 3D 模型未挂接（现用原版 hook 贴图公告牌）


### 9.1 时间轴脚本普查（第 39 轮, T14 ✅）
- 根帧: mochibot 追踪 + 广告 ID = 平台追踪, 有意不复刻; frame_3 stop() = 入口停帧
- 46 个带脚本时间轴归类: mx 框架/滚动条/高分表格分页（216 drawNetworkTableLines, H5 单榜简化）/
  calltoaction（不复刻）/ stop() 占位（317/330/343/355/437/444/606/622 等）
- 行为类: 648 statusBar 消息队列（queueMessage 顺序播/forceMessage 插队/打字机）——第 39 轮把
  showCityStatus 从覆盖式改为 3s/条顺序队列; 706/713/223 环境特效随机重播（50%/25% 概率
  gotoAndPlay(1)）——H5 fx 槽位随机重生成语义等价; 39 HS_NameDialog/462 popup displayText/
  214/124 高分页切换——均已有等价实现（T11 名字对话框/提示弹窗/单榜）
- 普查至此完整: game 六主类 + anim 基类 + 时间轴脚本三层全覆盖


### 10. esg 根类层普查（第 45 轮, T20 ✅）——反编译源码树全覆盖收官
- Sprite(12 函数): addAnim/findAnim/move/gotoAndStop → three.js 对象方法+game.js 内联;
  setClick/clickAction → HTML onclick; returnToFactory 对象池 → JS GC 等价
- SpriteMgr(9): spriteFactory/makeSpr/makeMovie/killSpr → scene.add/remove + DOM;
  FluidLayout(5): noscale+alignC 舞台居中 → 第 45 轮补 body flex 居中 (原 H5 靠左上)
- StateMach/Animator/Recycler(接口+池): STT 分发在 GameState(T11), 池=GC; Utils(8):
  randRange/calcX/calcY/calcDist 内联等价, isClicked=hitTest → DOM 命中测试等价
- 至此覆盖链完整: game 六主类+anim 基类+时间轴+esg 根类, 四层全普查


### 11. J2ME 版差异盘点（第 46 轮, T21 ✅）——"哪边才是原版"判定表
> H5 玩法以 Flash 版为权威（用户定调"J2ME 版动了诺基亚 3D 机能"= 3D 资产来源）。抽样
> House.java(4420 行, 混淆) 关键段:
| 维度 | J2ME (House.java) | Flash (bz/esg/game) | H5 取舍 |
|---|---|---|---|
| 渲染 | DirectGraphics 2D 投影自绘, 32/256 缩放 (:1393-94,2711) | 真 Flash 剪辑舞台 | M3G→GLB 真 3D (用户指定) |
| 数值 | 定点 256=1.0 (>>8/:1879,1940) | 浮点 | 浮点 (Flash) |
| 摆钩/判定 | u() 状态机 dv/dr 渐加 (:2258-2271), aW∈[0,3840] fixed | CPath 椭圆+Tipper (已逐行对号) | Flash |
| 存档 | RMS DataInputStream (cj[] 数组, towermode/quickModeRS :412-623) | SharedObject twrblx_cookie | Flash 字段 |
| 音频 | MIDI audio/midi Volume40 (o.java, r0 打包负数 id :1602-1605) | mp3 sng_*+9 sfx | Flash mp3 为主, MIDI 可选 BGM (第42轮) |
| 关卡 | House.e(80)/aW 阈值 10240..12800 分段 | CITY_LEVEL_LIMITS 20 级 | Flash |
| 高分 | 无网络/RMS | HighScore 三表 (第44轮已对号) | Flash |
- 结论: 差异均为"实现载体"级, 非玩法规则冲突; 后续审计遇到 J2ME 数值不一致时以本表为准,
  不再误判

## 实施顺序建议（P0 → P1）

> ### ▣ 收尾计划（第 58 轮 T33 盘点结论）
> 全源码四层（game 六主类/anim 基类/时间轴 46 轴/esg 根类）普查完毕；视觉层全原版位图化；
> 待办池清零。剩余项全部为"永久记档"性质：
> 1. 外链按钮 5 态（平台依赖）/暂停按钮（原版无实现）——有意不复刻
> 2. NETWORK 高分源（服务端已死）/CITY 榜写入（原版城市模式亦不写）——语义等价
> 3. J2ME 载体差异（七维判定表第 11 节）——以 Flash 为权威
> 4. 高分三分页表格（H5 单屏三表已并列展示, 等价）
> 后续轮次转为：回归维护（三件套全绿守护）+ 玩家实测反馈驱动的微修。

1. 屋顶块+目标高度+结算面板（第 2 节，闭环 quick game）
2. HUD 完整化（第 4 节）
3. 视差背景+环境特效+小人/火花（第 5 节）
4. 音频（第 6 节）
5. 存档记录（第 7 节）
6. Build City 城市模式（第 3 节，最大件）
7. 菜单流（第 4 节菜单子项，依赖城市模式）
