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

## 2. 塔楼目标与屋顶（quick/city 共用）——❌ 大部缺失 [P0]

- ❌ 目标高度：城市模式 `totalBlocks=(type+1)*10`（CityMap.as:508），HUD 左下显示目标高度
- ❌ 屋顶块：`needRoof`（Crane.as:209 stacked==total-1）→ 块外观 frame3/4；落屋顶人口按
  `aoff*128/BLOCK_H` 折算（Tower.as:252-261 roof 分支），放得越正人越多
- ❌ 奖杯屋顶 trophyRoof：cleanTower（人口≥TROPHY_TOWER_POP_LIMITS[currColor]，Const:220）
  时给特殊屋顶（frame4），人口加成（Tower.as:255-260）
- ❌ GAME_WON 结算：塔完成 → panDown 展示全塔（Tower.as:152）→ 结算面板
  （GameSprites.showSummary: 人口/塔高/最长连击 + "New record!"，Const.TIP_SUMMARY1-3）
- ❌ tries 用尽但塔未达标：楼仍可无屋顶放入城市（TIP_OUT_OF_TRIES）

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

## 4. HUD 与界面——🟨 极简代替 [P1]

- ❌ 高度进度条 progress_spr（LWR_LFT，setStackedBlocks 驱动，GameModel.as:208-227）
- ❌ 命数 HUD tries_spr（帧 `3+currColor*6+(3-v)*2`，GameModel.as:143）
- 🟨 人口显示：原版 5 位数字滚动（setDigits）+ 增量弹出文本（showPopChange/showBonusPopulation），
  H5 为静态文本
- 🟨 连击 UI：原版 combo_spr 计量表（ComboTimer.setSecs `min(5,secs)+" x"+mult`），H5 为文本
- ❌ 音乐/音效/退出按钮（GameSprites.buildGameSprites:99-101，594,20/50/80）
- ❌ 菜单流：splash→title→menu（Build City/Quick Game/Instructions/High Scores/About），
  GameState.as:53-257 全状态机；H5 直接进游戏无任何菜单
- ❌ Instructions 三页（TIP_INSTR_QUICK/BUILD/INTRO 文案齐全）、About（版本版权）
- ❌ High Scores（HighScore.as + Local/NetworkProxy；H5 可本地 top10）
- ❌ Reset 确认弹窗（STT_RESET_MAP_*）

## 5. 视觉表现层——🟨 部分有 3D 资产但未接 [P1]

- ❌ 4 层视差背景 bg2-5（Tower.move:93-104，BG_RATIOS=[0.05,0.1,0.2,0.3]，BG_PANEL_H=1000，
  随高度换景 BG_IDS 2/3/4/5：城市→高空→太空）
- ❌ 环境特效系统 28 种（AMBIENT_SPRS + EFFECT_PROBABILITIES*：云/鸟/飞艇/气球/客机/
  星星/行星/鲸鱼 FX_*，GameSprites.generateEffect:209）
- ❌ 小人系统：落块后居民入住动画（Person.as 走到楼内）、miss 时小人坠落
  （Tower.makeFallingPerson:296-310）、完美落地火花 makeSpark（4 向星形）
- ❌ 落块 bounceOffTower 旋转弹飞轨迹（BPath 抛物线，Tower.as:344-356）
- 🟨 楼块外观：现用 4 款网格轮换；原版 currColor 驱动 block00-03 同款不同色 +
  城市模式逐级换色（GameModel.currColor，CityMap.towerSpr gotoAndStop(currColor*4+…)）
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
