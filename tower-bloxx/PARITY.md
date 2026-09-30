# Tower Bloxx H5 与原版全面对差清单（PARITY）

> ## ▶ 下一轮任务（活页区——每轮由此开始, 做完勾掉并写入下一项；任务一律以【函数】/【资源】为单位, 目标=一模一样）
>
> **T10.【资源】city_place_highlight_spr(774) / city_demol_spr(818) 原版化**：读图确认帧，
> 替换 .cell.ok 金色 outline 高亮与 dozer 选中态（CityMap.updateCellHighlights:514-539 /
> setSelectOK:198-202 取证）。
>
> **待办池**：J2ME MIDI 曲库做可选 BGM / miss 时 snd_destroy 延迟播放语义 /
> swoosh_spr 翻页小特效（1→3帧/150ms, Tower.as:333）。
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

## 2. 塔楼目标与屋顶（quick/city 共用）——✅ 机制闭环（2026-09-29）

- ✅ 目标高度：`?mode=tower` → `totalBlocks=(type+1)*10`（CityMap.as:508）；快速游戏仍 999 无尽
- ✅ 屋顶块：needRoof（Crane.as:209）→ 专用模板 mesh253/254；人口按 `128-aoff*256/BLOCK_H`
  折算（Tower.as:252-261 roof 分支，trophy 除数 (currColor+1)/2）
- ✅ 奖杯屋顶 trophyRoof：needRoof && cleanTower（Crane.setTarget；cleanTower=人口≥
  TROPHY_TOWER_POP_LIMITS[currColor]，GameModel.as:181）→ mesh254 放大 variant（3D 替代外观）
- ✅ GAME_WON 结算：showSummary 面板 人口/塔高/最长连击 + New record!（GameSprites.showSummary:48-59,
  GameModel.getSummary:204-207, Const.TIP_SUMMARY_REC/MSG_RESTART），OK 点击重开
- ⬜ tries 用尽未达标仍可无屋顶入城（TIP_OUT_OF_TRIES）——依赖城市模式，归入第 3 节

## 3. Build City 城市模式——🟨 机制闭环（底图+热区已用原版 city_spr_640.png+实测坐标, 第29轮; 塔格缩略图仍 CSS 近似）[P0]

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
- ⬜ splash 素材（828_splash_spr 已导出未接, portal logo 层）
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

## 5. 视觉表现层——🟨 部分有 3D 资产但未接 [P1]

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

## 7. 存档/记录——✅ 闭环（2026-09-29）

- ✅ 存档键与字段 1:1：`localStorage["twrblx_cookie"]` = { sm_towerGridData, sm_totalPopulation,
  tipFlags }（GameModel.restoreModel/saveModel:82-108，SharedObject 名原样）；sm_towerGridData
  结构已就位，城市模式接入后即写入
- ✅ 结算纪录 populationRecord/blockRecord/comboRecord 持久化（localStorage["twrblx_records"]；
  原版纪录仅会话内 GameModel.as:11-13，H5 按用户预期跨会话并保留字段名）
- ✅ 音乐/音效偏好持久化（twrblx_music/sound）
- 结算面板 "New record!"（setComboMult:190-193）前轮已实现

## 8. 输入——🟨

- ✅ 点击/空格/下方向键/PgDn 放块（TIP_INTRO; Tipper.as:62 Key.isDown(34)）
- ✅ 放块时机: 鼠标松开判定 + 重开后 1s 落块锁（Crane.buttonPressed:153-156 (!mouseState||Key40||Key32),
  restartGame blockTime=getTimer()+1000）—— 第 22 轮自查发现并修正
- ❌ 下方向键（TIP_INTRO: "spacebar or down arrow"，Key.isDown 34）
- ❌ 菜单鼠标导航、城市模式拖放定位、暂停按钮（fla 有 bt_pause/bt_restart/bt_speed? 仅快速游戏音速）

## 9. 已知有意差异（不属于"不一样"）

- 3D 渲染取自 J2ME 版资产（Flash 版是 2D）——用户指定要 J2ME 3D
- 去除 Kongregate/MochiBot/广告/Get More Games 外链（平台依赖，无法也无需复刻）
- m3g 吊车 3D 模型未挂接（现用原版 hook 贴图公告牌）

## 实施顺序建议（P0 → P1）

1. 屋顶块+目标高度+结算面板（第 2 节，闭环 quick game）
2. HUD 完整化（第 4 节）
3. 视差背景+环境特效+小人/火花（第 5 节）
4. 音频（第 6 节）
5. 存档记录（第 7 节）
6. Build City 城市模式（第 3 节，最大件）
7. 菜单流（第 4 节菜单子项，依赖城市模式）
