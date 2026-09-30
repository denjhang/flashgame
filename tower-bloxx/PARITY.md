# Tower Bloxx H5 与原版全面对差清单（PARITY）

> ## ▶ 下一轮任务（活页区——每轮由此开始, 做完勾掉并写入下一项）
>
> **【主线】J2ME (House.java 98 方法 + r0 89 条目) 完全一致移植。进度: 方法 98/98 ✅; 资源 89/89 ✅; **T46 ✅ 89 号文件破译**(城市天际线: 171 建筑条+74 帧时长, bI(x,w)/bH(y,h) 结构, id87=伴随小表)。当前: T48 按差异表修 H5。下一阶段: T46(id87/88 解码)+T48(按差异表修 H5)。**
>
> **T45.【资源】r0 素材鉴定与接入**：id00-80 拼图已读（滚轮/块面板/城市图标/软键/数值图标），
> 对照 House.java 绘制调用（House.b(graphics,id,...)）确定每张的屏幕位置，替换 H5 对应 UI。
> **T46.【函数】id87/88 bin 鉴定**：686B/1347B，疑关卡或字体数据，读 House 中消费点。
> **T47.【函数】House.java 方法清单推进**：按 99 方法清单逐个过（判定/计分/城市/存档四块，
> 已完成 ~10），每方法一行差异记录。
> **T48.【修】差异表逐项修 H5（J2ME 语义优先）: 摆钩✅/摇摆✅/连锁✅/瞄准鸟✅/天空✅/中断续档✅(N94: g:443/h:618/i:828/j:1003 → twrblx_quickRS/cityRS, btnExit 写档+enterQuick/beginBuild 恢复+gameOver 清档)。惊慌人群✅(N+60: t:2098 panicPeople, bE[8][12] 定性=8槽惊慌人群非下落块)/落地角标✅(N+60: h:3390 landFxSpawn, r0id37 三帧星)。T48 全部关闭 ✅
>
> **待办池**：MIDI 6 曲中 3 个短音效接入；l0-l6 语言包（本地化暂缓）。

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
> 【更正】H5 玩法核心 = J2ME（用户指令, 第 76 轮）；Flash 仅为参考。原表 J2ME 列即移植目标语义, H5 现状待 T40-T43 重对齐。抽样
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


### 12. T40 取证记录（第 77-78 轮）——【更正】控制映射结论作废
- ~~第 77 轮曾称"J2ME 钩可左右操控、与 Flash 根本语义不同"~~ **作废（用户指正, 第 78 轮）**:
  J2ME 同样是单键落块 + 自动摆; 50/56 键经 l(dir) 操作的是 **UI 光标/菜单/城市选格导航**
  (bZ 索引滑 bY 数组, l:4277 有 600ms 节流), 非玩法操控。教训: 混淆变量必须先确认运行态
  归属 (f 状态号) 再下结论, 禁止跳到"重大差异"
- 已确认事实 (保留): e():3793 键码映射 (53/FIRE→落块, 50→UI 左, 56→UI 右);
  z():1758-1781 摆动 = aW 以 256/500 fixed/ms 匀速趋向 aX 后折返 (线性扫摆, 待塔模式实证);
  u():2258 = 场景切换状态机, 非落块判定
- 待续 (T40b): 塔模式 f 状态号 → 落块落点判定公式 → 与 H5 对齐验证

### 13. r0 解包（第 79 轮）——J2ME 资源全量到手
- 解包器 tools/r0_unpack.py (g.java:40-138 逆向): 92×int32 BE 偏移表+数据块, 长度=下非负偏移差
- dc_v1507 r0 (77.6KB) → 89 条目: PNG 81 + MIDI 6 + bin 2 (id87=686B sig 5811, id88=1347B)
- 拼图鉴定: id02-06 数值图标/ id00-01 图标/ id07-12 滚轮/ id24-32 块面板/ id33-49 城市网格系列/
  id50-77 软键/返回/箭头图标 — 全 J2ME 独有 UI 素材; MIDI 与散装 80-85.mid 同源
- 产出目录: j2me/res/dc_v1507_r0/


### 15. T46 完成（第 88 轮）——89 号文件破译 + id87/88 定性
- jar 独立文件 "89"(121KB): r=171 建筑条 + s=74 帧时长 bJ[] + 逐条 (x,w 单位 E/176; y=2*n5<<1;
  h; colIdx) → House.bI[171][3]/bH[171][2] 城市天际线数据 (背景剪影动画)
- r0 id88(1347B)/id87(686B): 同族小表(结构同, 数值小) — 备用天际线变体, 记档
- 产物: j2me/res/dc_v1507_misc/{89, m}

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


### 13.1 r0 条目消费点（T45 逐条）
| id | 内容(读图) | 消费点 | 判定 |
|---|---|---|---|
| 00 | 37x37 音符图标 | g.c(0)×2 → House 音乐状态图标 | 记档: J2ME 状态条, T48 评估 |
| 01 | 18x54 软键图标列 | g.c(1) → 软键栏 | 记档同上 |
| 06 | 20x12 数字图标 | h.java:59 z=g.c(6), 状态条两端 | 记档: h.java 状态条 |
| 09 | 20x12 数字图标 | House:1395 cw=g.c(9); :3372 居中+进度条 | 记档: 加载画面, H5 无 |
| 10 | 20x12 数字图标 | House:289 Q=g.c(10); :3094 Command 图标 | 记档: MIDlet 软键, H5 无 |
| 11 | 20x12 数字图标 | House:1217 M=g.c(11); :1536 全屏过场 | 记档: 过场, H5 无 |
| r0id12 | 20x12 数字图标 | House:1398 aa=g.c(12) 条件加载 | 记档: 状态图标 |
| r0id13 | 20x12 数字图标 | House:1401 ab=g.c(13) 条件加载 | 记档同上 |
| r0id69 | 20x12 图标 | House:1404 ac=g.c(69); :1523 draw(E-80,60) | 记档: 右上角状态 |
| r0id70 | 20x12 图标 | House:1407 ad=g.c(70); :1520 draw(10,40) | 记档: 左侧状态 |
| r0id14-20 | 20x12 数字/图标 | House:1292-1297 U/Y/Z/V/X/W = g.c(14..20) | 记档: 条件加载 UI 组, 下轮逐张定位 |
| r0id33-36 | 城市图标组 | House:1302-1305 ae/af/ag/ah = g.c(33..36) | 记档: 城市视图, T48 |
| r0id45 | 20x12 图标 | House:1413 ce[3]=g.c(45); :1517 draw(E/2,30) | 记档: 顶部居中状态 |
| r0id14 U | 20x12 | House:1292; :3508 draw(cn-3-n7*20, F-co-21-3*bg) 左侧列 | 记档: 城市左列图标 |
| r0id15 Y | 20x12 | House:1293 | 记档: 条件 UI 组 |
| r0id16 Z | 20x12 | House:1294 | 记档同上 |
| r0id17 | 20x12 | k.java:187 U=g.c(17) | 记档: k.java UI |
| r0id21 | 20x12 | k.java:158 L=g.c(21) | 记档同上 |
| r0id22 | 20x12 | k.java:159 M=g.c(22) | 记档同上 |
| r0id18 V | 20x12 | House:1295; :3500 draw(E-cn-42, F-co-21) 等右下角 | 记档: 城市 HUD |
| r0id19 X | 20x12 | House:1296; :3495 右下数字列 | 记档: 城市 HUD |
| r0id20 W | 20x12 | House:1297; :3530 draw(cn-9, F-co-50) | 记档: 城市 HUD |
| r0id23 N | 20x12 | k.java:160; :777 draw(100+i*14, 10) 顶部数字串 | 记档: 高分榜页 |
| r0id24 O | 20x12 | k.java:164; :887 draw(x-37, y+140) | 记档: 菜单页 |
| r0id25-29 P[0-4] | 图标组 | k.java:166-176; :971 榜行图标 draw(x-n*w/4, y) | 记档: 高分榜 5 类型图标 |
| r0id30 Q | 20x12 | k.java:177 | 记档: k UI |
| r0id31 R | 20x12 | k.java:181 | 记档同上 |
| r0id32 | 预载 | House:1288 g.c(32) 预热 | 记档 |
| r0id33 ae | 城市图标 | House:1302; :3454 | 记档: 城市视图(条件加载) |
| r0id34 af | 城市图标 | House:1303 | 记档同上 |
| r0id35 ag | 城市图标 | House:1304; :3454 draw | 记档 |
| r0id36 ah | 城市图标 | House:1305; :3439 draw((E/2)+(ap/2), y+9) | 记档 |
| r0id37 ai | 三帧星形闪光(13x13x3) | House:1336; h:3390 落地角标帧表 | ✅ N+60 landFxSpawn (h5/assets/id37.png) |
| r0id38 al | 鸟/云帧 | House:1346; :3544 翻帧 cg/80%4*22 | 记档: 动画帧 |
| r0id39 am | 云帧 | House:1347; :3549/3556 翻帧 cg/100%3*44 | 记档 |
| r0id40 an | 图标 | House:1351; :3279 draw(x-11-n*23, F-34) 底行 | 记档: 底部图标列 |
| r0id41 ak | 图标 | House:1345; :3307 draw(x+4, y, 锚40=右底) | 记档 |
| r0id42-44 | 未直接引用 | (dC[] 间接: ce[i]=g.c(dC[i]) 28 特效帧) | 记档: 特效帧表 |
| r0id46-80 | ce[] 特效帧池 | House:1319 ce[i]=g.c(dC[i]); :2722-2734 翻帧绘制 | 记档: J2ME 28 特效(对应 Flash ambient) |
| r0id50-77 | 软键/箭头图标 28 张 | h.java/k.java 软键栏与方向箭头 (条件加载组) | 记档: MIDlet 导航 UI, H5 用鼠标 |
| r0id78/79 | 图标 | 尾部图标组 | 记档: 待消费点精查 |
| r0id81-86 MIDI | 6 曲 | o.java Manager "audio/midi" | ✅ 3 曲已接入(80/81/82), 84/85 短音效 T48 |
| r0id87 | bin 686B sig=5811 | 未解码 | T46: 疑关卡/数据表 |
| r0id88 | bin 1347B | 未解码 | T46 同上 |

## 14. House.java 99 方法清单（T47 逐行填: 语义/差异; 已读标✅）

| # | 行 | 方法 | 参数 | 语义 | 与H5差异 |
|---|---|---|---|---|---|
| 1 | 303 | a | () | 启动 init: House.M() + 键名收集(52/54/50/56/53) | H5 无键名 UI |
| 2 | 308 | b | () | BGM 切换 x.a(-2147483568,-1) | H5 playSong 等价 |
| 3 | 312 | c | () | 失败标志 n=true + O=2 | H5 无 MIDlet 退出 |
| 4 | 317 | d | () | 退出分派: e==2 城市菜单/e==5 暂停/默认 g() 存档 | H5 btnExit 等价 |
| 5 | 334 | a | (int n2) | 音效开关查询 a(3)=f.b(8)==0 / a(1)=f.b(9)==0 | H5 soundOn/musicOn 等价 |
| 6 | 344 | b | (int n2) | 音效开关写入+存档 | H5 localStorage 等价 |
| 7 | 362 | c | (int n2) | 音效开关开启版: f.b(8,0)/f.b(9,0)+a(n,1)+存档 | 同上 等价 |
| 8 | 381 | e | () | 存档写 towermode: cj[6] int + 音效2 bool (f.b RMS) | H5 saveModel 等价(字段更多) |
| 9 | 400 | f | () | 存档读 towermode: cj[6]+2 bool, 默认开 | H5 restoreModel 等价 |
| 10 | 443 | g | () | 写 quickModeRS: e/f/bk/cg/aT.. 全状态 ~44 标量+数组 | ✅ N94 saveTowerRS()→twrblx_quickRS (btnExit 写档) |
| 11 | 618 | h | () | 读 quickModeRS: ~44 标量+bi/bj/cF/bh 数组+bool → 全玩法状态(挂点/塔/连击等) | ✅ N94 enterQuick→loadTowerRS+applyTowerRS 无条件恢复 |
| 12 | 828 | i | () | 写 cityModeRS: e/f/bk... 全量城市+塔状态 | ✅ N94 cityMode→twrblx_cityRS (城市地图本体走 twrblx_cookie) |
| 13 | 1003 | j | () | 读 cityModeRS (loadTowerInfoCityMode) | ✅ N94 beginBuild→loadTowerRS('city')+applyTowerRS |
| 14 | 1214 | k | () | 过场载入: L=g.c(-1)空, M=g.c(11)全屏图 | H5 无过场, 记档 |
| 15 | 1219 | l | () | 已读 |
| 16 | 1224 | w | () | 私有检查: b.a() (调 f/b 存档层?) — 短方法 | 记档: 语义待深挖 |
| 17 | 1362 | x | () | 资源全释放: 3D 组 cy-cE/UI 图 U-an 全 null + System.gc() | H5 scene 清理+GC 等价 |
| 18 | 1388 | y | () | 场景资源装载: aT=E/2,aU=F/2(视中心), bd/be=256*E/F/32(定点视宽高), 载入状态图标组 | H5 启动装载 等价; 视口定点换算 256/32=8px/unit 已记档 |
| 19 | 1456 | d | (int n2) | 带3s超时横幅: I=1→3000ms→y()收起, R&&!S 触发MIDI | 与 H5 showCityStatus 同型 |
| 20 | 1479 | a | (Graphics graphics) | 过场绘制: N 时 I==0 白屏+L 图, I==1 蓝底(0x9AAAC A)+M 图居中 | H5 无过场, 记档 |
| 21 | 1547 | a | (int var1_1, int var2_2) | 按键分派 a(x,y)(触摸/指针): O==0 且 f==7 释放 3D 组 | H5 无指针事件流, 记档 |
| 22 | 1722 | a | (boolean bl) | 结算文本组装: g.a(93/94/96 语言串)+破纪录标记 bf/cj[3..4] | H5 showSummary 等价(无多语言) |
| 23 | 1758 | e | (int n2) | 资源预载检查: cc=id, GameMIDlet.u(), 返回 !n(失败标志) | H5 启动全量加载, 无需对应 |
| 24 | 1764 | z | () | 已读 |
| 25 | 1785 | o | (int n2) | 已读 |
| 26 | 1790 | p | (int n2) | p(dt) 摆钩运动学: aH 渐增至 1664/1408(bk==1); aK=cQ*sin(200*aP/cP%360)>>15 定点正弦摆! | H5 hookX 余弦椭圆(Flash 式) — 同为正弦摆但参数/定点精度不同, 待T48对表换算 |
| 27 | 1816 | q | (int n2) | q(dt) 塔摇摆: bw=(bw+dt)%3600, cS=k(bw/10)正弦, bu=bv*cS>>16, br=-(cS*bv)/10000 摆角 | H5 swayAngle dt/20/30+cos — 同型异参, 待T48换算对齐 |
| 28 | 1842 | r | (int n2) | r(dt) 摆角微调: 按 aB[0] 符号 ±(死代码*0) | H5 无, 原版乘0无效 记档 |
| 29 | 1851 | s | (int n2) | s(dt) 块结算主循环: aw[i] 5 块状态机(6=下落/1=挂起等), 碰撞+落地分支 | H5 blockLanded 等价核心, 参数级差异待T48 |
| 30 | 1999 | A | () | A() 塔身重建: var4=(bs-6)*256+128 定点起点, 自底向上逐块 | H5 blocks 数组 等价 |
| 31 | 2073 | c | (int n2, int n3) | c(n2,n3) 生成下落块: bk==1 跳过, y(n2) 取块, bE[0] 8 槽占用 | H5 drop() 等价(槽位=单下落块, J2ME 8并发?)待T48 |
| 32 | 2098 | t | (int n2) | t(n2) 逐块更新 | H5 falling 更新 等价 |
| 33 | 2159 | B | () | B() 8 槽粒子/块生命周期: 按 cg-bE[4] 时差分派 case1/… | H5 bounces/sparks 分队列 等价 |
| 34 | 2260 | u | (int var0) | 已读 |
| 35 | 2372 | v | (int n2) | v(n2) cW 数组分派(特效池) | H5 fxSlots 等价 |
| 36 | 2395 | a | (int n2, int n3, int n4, int n5, int n6) | lerp 关键帧插值: (d5-d4)*t/span+d4, u() 场景机用 | H5 setTimeout/线性tween 等价 |
| 37 | 2402 | a | (int n2, int n3, int n4) | a(n2,n3,n4) 移位: n2>>n3/n4 | 工具函数, 内联等价 |
| 38 | 2406 | a | (int n2, int n3, boolean bl) | 场景过渡变暗: de 时 RGB 三通道缩放 | H5 无场景过渡动画, 记档 |
| 39 | 2423 | C | () | 特效清场: dc[2]+dd[300x7] 全零 | H5 scene.remove 等价 |
| 40 | 2441 | D | () | 粒子生成: 速度=(base+i(n)-n/2)/(4-type), 定点 368640 | H5 sparks 近似, T48 核对 |
| 41 | 2464 | a | (int n2, int n3, int n4, int n5, int n6, int n7, int n8) | a(7参) dc 粒子源配置: [0]=数 [1]=层 [3/4]=范围 [5/6]=速度 | H5 generateEffect 参数 等价 |
| 42 | 2476 | w | (int n2) | w(dt) 粒子推进: 层进度 + pos+=vel*dt + (256*aW>>8)+384 视口换算 + dw 分派渲染 | H5 updateEffects 等价; 视口定点 384 偏移记档 |
| 43 | 2541 | b | (Graphics graphics, boolean bl) | 粒子渲染分派: dw 1=雨丝线段/2=方块/3=其他, dd[] 按 dc 源分前后景 | H5 无雨天粒子(Flash 28 种特效替代), 待T48评估 |
| 44 | 2573 | a | (Graphics graphics, int n2, int n3, int n4, int n5, int n6) | 雨丝绘制: 两段 drawLine (AAAACC 变暗 via dg) | 同上 |
| 45 | 2597 | a | (Graphics graphics, int n2, int n3, int n4) | 方块粒子: >1 白框蓝底, ≤1 蓝点 | 同上 |
| 46 | 2611 | b | (Graphics graphics, int n2, int n3, int n4) | b(g,n2,n3,n4) 火花绘制: 10 色渐变 fillRect 随机散点 | H5 star 贴图火花 — 程序绘制 vs 位图, T48 评估 |
| 47 | 2625 | E | () | E() 星星/特效推进: dB[9] 槽, 出界回收+dy 计数, cp 高度分层选型 | H5 fxSlots 同型(9槽!) 等价 |
| 48 | 2645 | x | (int n2) | x(n2) 特效生成选型: cp∈dA[0..1] 高度段+dy 次数+i(100)<dA[2] 概率 | H5 generateEffect 三表同型 等价 |
| 49 | 2702 | e | (Graphics graphics) | 已读 |
| 50 | 2737 | a | (Graphics graphics, int n2, boolean bl, boolean bl2) | a(g,n2,bl,bl2) 天空绘制: bO 色带插值 bM + 地平线+塔剪影 fillRect | H5 bg 位图 — 程序渐变 vs 位图, 记档 |
| 51 | 2775 | F | () | F() 命中块索引: aA/az 距 bj/bi 256(=1px) 内反向扫描 | H5 offset 判定 等价(阈值同 256 定点) |
| 52 | 2789 | G | () | G() 预留 | 记档 |
| 53 | 2919 | y | (int n2) | y(n2) 人口增减: 正=bt+(bs/10+n2)+银行 bB+=bz*(2+bs/10*2); 负=bt-(bs/10-n2) | 与 Flash changePopulation 同公式! H5 已对号 |
| 54 | 2934 | H | () | H() 银行结清: bt+=bB, bB/bz/bA 清零 | H5 finishCombo 等价 |
| 55 | 2944 | z | (int var0) | 已读 |
| 56 | 2997 | A | (int n2) | A(n2) 扣命: cN=cg, c.a(800) 音效, ba-=n2, 归零→bk=2(GAMEOVER) | H5 decTries+c.a(800)=snd 等价 |
| 57 | 3007 | d | (int n2, int n3) | d(n2,n3) 撞塔弹块: n3>0 逐块弹出(aw=5, 速度±45/400); n3==-1 连锁倒塌(aw=7) | H5 knockTopBlock 单块 — J2ME 多块连锁, T48 待办 |
| 58 | 3058 | m | () | m() 主分派(渲染循环) | H5 rAF 主循环 等价 |
| 59 | 3082 | n | () | n(g) HUD 绘制 | H5 addHud 等价 |
| 60 | 3203 | o | () | 已读 |
| 61 | 3247 | a | (Graphics graphics, boolean bl) | a(g,bl) 总渲染: f==7→g(g); f==2→k.a; 塔模式 b(前后景)/f(3D)/h/k/j 分层 | H5 renderer 分层 等价 |
| 62 | 3287 | f | (Graphics graphics) | f(g) 3D 相机: n.a(55f) FOV + lookAt(aV,aW,cI), bk 条件分支 | H5 camera 等价(FOV 55°) |
| 63 | 3339 | b | (int n2, int n3, int n4, int n5, int n6) | b(5参) 3D 绘制原语: d 类封装, 888/999 特殊材质(cA/cB/cz) | H5 three.js 材质 等价 |
| 64 | 3364 | g | (Graphics graphics) | g(g) 加载画面: cw 标题居中+进度条 | H5 无加载屏, 记档 |
| 65 | 3390 | h | (Graphics graphics) | h(g) 落块瞄准提示: cg-ch<600ms 时块影/虚线(48x32) | H5 无落点预览, T48 评估 |
| 66 | 3423 | i | (Graphics graphics) | 已读 |
| 67 | 3466 | j | (Graphics graphics) | j(g) HUD 文本绘制(分数/层高) | H5 addHud 等价 |
| 68 | 3584 | a | (Graphics graphics, int n2, int n3, int n4, int n5, boolean bl) | a(5参+bl) 数字绘制: Z 图标每位 drawImage(x-n*7) | H5 文本数字 等价(id16 Z 消费点!) |
| 69 | 3599 | b | (Graphics graphics, int n2, int n3, int n4, int n5, boolean bl) | b(6参) 小人绘制: aa/ab(=id12/13) 两帧 DirectGraphics 镜像 | H5 toon 56帧 — J2ME 仅2帧!记档 |
| 70 | 3614 | k | (Graphics graphics) | k(g) 8 槽块状态渲染(bE) | H5 bounces/missFall 队列 等价 |
| 71 | 3624 | b | (Graphics graphics, int n2, int n3, int n4, int n5, int n6) | b(6参) 小人绘制底层(镜像变体) | 同上 |
| 72 | 3651 | b | (int n2, int n3) | b(n2,n3) 键按下总入口(分发 k.a) | H5 keydown 等价 |
| 73 | 3685 | f | (int n2) | f(n2) 键释放透传 | H5 keyup 等价 |
| 74 | 3689 | a | (Command command) | a(Command) 软键命令: P=Exit → n=true | H5 btnExit 等价 |
| 75 | 3701 | p | () | p() 返回 a[][] 静态表 | 内联等价 |
| 76 | 3705 | g | (int n2) | g(n2) int→String | 内联等价 |
| 77 | 3709 | I | () | I() 输入旗标清零 at/au/av | H5 无需(事件驱动) |
| 78 | 3715 | J | () | 已读 |
| 79 | 3792 | e | (int n2, int n3) | 已读 |
| 80 | 3824 | h | (int n2) | h(n2) 键持续处理 | H5 keydown 等价 |
| 81 | 3914 | b | (Graphics graphics) | b(g) 塔模式主绘制: ce[3] 标题+粒子块 cu[]+cs[] 3D 投影序列 | H5 renderer 等价 |
| 82 | 3965 | K | () | K() 高分榜逻辑 | H5 三表 等价 |
| 83 | 4038 | L | () | L() 语言装载 | H5 中文硬编码, 记档 |
| 84 | 4053 | l | (Graphics graphics) | 已读 |
| 85 | 4107 | a | (Graphics graphics, int n2) | a(n2) ci 查表: <0 取 -ci[|n2|] | 三角函数查表(定点 sin/cos), H5 用 Math 等价 |
| 86 | 4121 | M | () | M() 初始化: 大量字段默认值+ci 表 | H5 const 初始化 等价 |
| 87 | 4133 | i | (int n2) | 已读 |
| 88 | 4137 | j | (int n2) | j(n2) ci 表查询(三角) | 内联等价 |
| 89 | 4144 | k | (int n2) | k(n2) cos 查表 | 内联等价 |
| 90 | 4148 | N | () | N() 随机种子? | 内联等价 |
| 91 | 4160 | a | (String string, Font font, int n2) | a(n2..) sin 查表组合 | 内联等价 |
| 92 | 4202 | a | (String string, String[] stringArray, Image image) | a(n2,n3) 弧度组合查表 | 内联等价 |
| 93 | 4228 | c | (Graphics graphics) | c(n2) 表索引 | 内联等价 |
| 94 | 4276 | l | (int n2) | UI 光标导航: 600ms 节流; 子列表 bZ 滑动/顶层 bQ 步进, 到底 P() 触发 O() 确认 | H5 DOM 点击/悬停 等价 |
| 95 | 4304 | O | () | 光标复位: bP/bQ/bX/bY/ca 全清 | H5 每次打开重置 等价 |
| 96 | 4313 | P | () | 光标末位判定: bQ==bP-1 | H5 无此状态机, 记档 |
| 97 | 4317 | q | () | 字体 getter: 返回 o (font.bin 点阵) | H5 用系统字体, 待T48评估 font.bin |
| 98 | 4321 | a | (Graphics graphics, int n2, int n3, int n4, int n5) | 裁剪区设置 setClip | H5 canvas 裁剪 等价 |
