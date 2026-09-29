# Tower Bloxx H5 与原版全面对差清单（PARITY）

盘点源：`scripts/scripts/__Packages/bz/esg/game/*.as`（Const/GameState/GameModel/GameSprites/
CityMap/Tower/Crane/Tipper/ComboTimer/Person/HighScore）、时间轴脚本（paperdefense_fla）、
J2ME 版资源（scene.m3g/MIDI）。对照物：`h5/game.js` 当前实现。
状态：✅ 已对号 / 🟨 部分 / ❌ 缺失。每项标注原版证据与优先级。

## 1. 核心落块循环（quick game 内核）

| 项 | 状态 | 证据 | 说明 |
|---|---|---|---|
| 摆钩椭圆轨迹/周期 2600ms | ✅ | CPath.as:33,62-64 / Crane.as:46 | radx=min(70,30+totalBlocks), rady=25 |
| 落块惯性漂移 blockDx*3 | ✅ | Crane.as:198-199 | |
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

## 3. Build City 城市模式——❌ 整体缺失 [P0]

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
- ❌ 菜单流：splash→title→menu（Build City/Quick Game/Instructions/High Scores/About），
  GameState.as:53-257 全状态机；H5 直接进游戏无任何菜单
- ❌ Instructions 三页（TIP_INSTR_QUICK/BUILD/INTRO 文案齐全）、About（版本版权）
- ❌ High Scores（HighScore.as + Local/NetworkProxy；H5 可本地 top10）
- ❌ Reset 确认弹窗（STT_RESET_MAP_*）

## 5. 视觉表现层——🟨 部分有 3D 资产但未接 [P1]

- ✅ 视差背景 3 层 bg2/3/4（FFDec 导出原版位图 640×2000/912/316，Tower.move:93-104
  `worldY = camY×(1-ratio)`，BG_RATIOS 0.05/0.1/0.2；bg4 纵向平铺 6 次覆盖太空段；
  原版无 bg5_spr，NUM_BGS 循环 2..4）
- ❌ [P2 遗留] 环境特效系统 28 种（AMBIENT_SPRS + EFFECT_PROBABILITIES*，GameSprites.generateEffect:209,
  次数表 GameSprites.as:26）。取证：ExportAssets ambient_spr=chid734 仅 5 帧且为整幅遮罩，
  28 种特效图形嵌在更深层子剪辑，逐帧还原需逐 clip 反汇编，成本/收益不匹配——暂缓，
  状态机参数已记录在案（发生次数表 [8,3,2,1,1,8,2,8,1,1,4,4,-1,8,-1,1,5,4,-1,5,2,-1,1,1,-1,-1,-1,-1,-1]）
- ✅ 小人系统：落块居民走半步逼近入住（Person.as:24-66，出生 ±viewWidth/2、上方 rand(100,200)、
  步长 min(PEOPLE_MAX_MV±10, dist/2)、每 50ms、到达 250ms 淡出）、miss 小人坠落
  （makeFallingPerson:296-310 漂移±100/5s）、完美落地四角星形火花（makeSpark:311-317, speed=100）
- ❌ 落块 bounceOffTower 旋转弹飞轨迹（BPath 抛物线，Tower.as:344-356）
- ✅ 楼块外观按 currColor 选款（CityMap.as:160 currColor×4 语义；quick=3→第 4 款，tower=0→第 1 款）
- ✅ 屋顶人口/特效触发（snd_stacked 音效待音频轮）
- ❌ 音效触发视觉（snd_destroy 等与动画同步）

## 6. 音频——❌ 整体缺失 [P1]

- 歌曲：sng_title / sng_tower / sng_city（GameState.playSong）；J2ME 版有 9 首 MIDI 原声可转
- 音效：snd_combo / snd_foundation / snd_stacked / snd_destroy / snd_fanfare_bad / snd_guiselect /
  snd_negative / snd_towerconstruct 等（PlaySound 调用点已 grep 全）
- 音乐/音效开关（STT_MUSIC_TOGGLE / STT_SOUND_TOGGLE）
- H5 方案：MIDI → 预渲染 OGG/MP3（需软音源），或 WebAudio 合成近似

## 7. 存档/记录——❌ 缺失 [P1]

- GameModel SharedObject：sm_totalPopulation/cityLevel/unlockedTowerType/trophyTowerType/
  towerGridData/populationRecord/comboRecord…（GameModel.as:28-44,74-86）→ H5 用 localStorage
- 结算记录 populationRecord/comboMax/comboRecord + "New record!"（setComboMult:190-193）

## 8. 输入——🟨

- ✅ 点击/空格放块
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
