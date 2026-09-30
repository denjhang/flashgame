# 领土防御（TCS）定时任务书 —— 本文件是定时任务的唯一任务来源

> 项目：`territory-defense/`（TCS.swf 的 H5 一比一复刻）。
> 本文件与 tower-bloxx 等其他项目的任务文档互不相关，各自的定时任务只读自己的文档。

## 一、总目标（长期不变）

对标原版做一比一复刻：除剧情文字外全部用原版素材（FFDec 从 TCS.swf 导出）；
剧情文字按原关卡安排（哪些关卡有对话/演出、顺序与触发时机照原版），
文字内容为中文改写并去除政治元素。

## 二、每轮工作流（固定，不随任务变化）

1. 读本文件「三、当前任务」取第一项执行；若清单为空 → 做深度自查生成新任务写入清单再执行。
2. 纪律：纯离线——禁止 browser-use/浏览器截图/真机抓图；验证只用
   `cd territory-defense && timeout 60 node smoke_test.js`（draw 已 stub）。
3. 对齐依据只认反编译产物：`deobf/scripts/`、`deobf/pcode*/`、FFDec SVG/矩阵、
   `deobf/data/*.json`、`swf_dump.txt`。改码前先穷举调用点取证，写码注明证据。
4. 完成后：更新本文件清单（做完的移入「四、已完成」，自查出的新任务补入「三」）、
   在 `deobf/TCS_LOG.md` 记一轮简报（含"本轮仍未做"；TCS 专属日志，勿写
   共享的 deobf/PROGRESS.md——那是 tower-bloxx 任务的记录文件），
   `node --check` 三件套 + 冒烟全绿后才 `git commit + push`（前缀 TCS+N 递增）。
5. 不碰 territory-defense 之外的任何项目目录；不做破坏性操作。

## 三、当前任务（自查自纠，持续自更新；做完一项划掉并补新项）

- [ ]（空）

## 三之一、已完成于本轮（滚动记录）

- [x] TCS+56: 槽位点击音效勘误（方向2, **行为修正**）——1026_1 on(press):
  成功(unlocker && euros>=cost) = 设 viseurConstruction + ancienX=-548 +
  zoneBombardement 移出屏(取消 Su37 瞄准) + 槽位 gotoAndPlay("press"),
  【无音效】; 失败 cannot。H5 成功路径多播 boutonScroll → 移除。
  断言入冒烟（208 项全绿）

- [x] TCS+55: 建造落点音效勘误（方向2, **行为修正**）——822_226 on(press):
  surfaceForBuild hitTest→塔重叠 hitTest→euros<cost 三处失败均为【静默 return】
  (cannot 只在 1026 槽位点击播); 成功: euros-=cost + gotoAndStop("red") +
  creationUnite + createUnit。H5 落点失败时多播 cannot → 移除。断言入冒烟(207)

- [x] TCS+54: 834 子剪辑审计闭环（方向1）——766 地图位图/768 可建掩码/773 事件/
  785 瞄准区/793 飞机/811 植被/822 光标/833 云层, 八个子剪辑全部此前已翻证且
  H5 接线（game.js 均有取证注释）, 无遗漏。方向1 对 834 子树正式关账

- [x] TCS+53: newEvents 全分支复核 + 面板弹出静音勘误（方向2, **行为修正**）——
  773_189: 16→canon105D自动解锁(无面板)/18,20,37,39→仅面板/27→radar解锁+面板/
  31→su37解锁+面板/25→euros+2400/26→edith/44→Yamato; H5 全接线。
  原版 showPanelForUnlock 无音效 → 移除 H5 多播的 boutonScroll。断言入冒烟(206)

- [x] TCS+52: unlockNextWeapon 对照（方向2）——原版 6_333: iUnlock==5(严格
  等值)→false, 否则解锁 weaponsToUnlock[iUnlock] + iUnlock++ + 建造槽帧刷新
  (gotoAndStop normal ≈ H5 buildShop); 列表五项 crotale/canon125/MLRS/MTHEL/
  pluton 与 H5 一致; H5 的 >= 因步进+1上限5而等价。已有着线断言覆盖, 无码改

- [x] TCS+51: 988_6 解锁按钮逐行对照（方向2）——lockItem 守卫/成功 creationUnite
  +alpha45+面板收起/失败 cannot 且 lockItem 保持(原版怪癖, H5 同构)。
  H5 成功后 closeUnlockPanel 等价原版 _x=-500。断言入冒烟（205 项全绿）

- [x] TCS+50: 解锁面板语义复核（方向2）——原版 988_3 on(press): lockItem 守卫 +
  creationUnite 音 + interest+=3 + 面板移出屏; 988_6 解锁下一件。H5 全对齐,
  INTEREST_STEP=3; 面板文案定案为 H5 中文改写(与整体 UI 文字口径一致,
  数值/结构与 6_333 unlockEnd/unlock1/unlock2 消息一致)。无码改

- [x] TCS+49: 存档/车队链表边界确认（方向3）——存档仅存塔(units)+iMission
  (=下一关, 原版 saveData 同构), 敌人不落盘; 读档从该关简报重新开波,
  devant 链表在 startWave 生成时重建 → 无跨存档生命周期, 无缺口。
  顺带确认 1176 倒计时条/两态点击跳过已接线, 17帧@24≈21tick 换算一致

- [x] TCS+48: 索敌距离比复核（方向2, 重复覆盖确认）——porteeAcq 我方 0.6/
  敌方 0.8 (GAME_LOGIC 42, 174 loc16c4): H5 两侧实现一致且冒烟已有行为级断言
  (1050 起: 0.6 环带恢复轮询不解锁 / 0.85 保持锁定 / 超 100% 僵尸锁定)。
  无需新增

- [x] TCS+47: interWave 318/317 口径定案——317 断言通过; 实战 318 = 对白波
  +1 冻结标记（game.js INTERWAVE_TICKS+1, tick 不推进），非偏差。
  冒烟文案加定案注记防误追

- [x] TCS+46: 金钱面板 LOSSES 勘误（方向2, **行为修正**）——原版 1079
  actualiseInfo: infoMoneyAndScore.score.text = master_menuItems.score
  (丢塔数, 185帧2 iMission<45 时 score++, 卖出/被毁都算); H5 误接 G.losses
  (敌人抵达次数) → 改接 G.score。断言入冒烟（204 项全绿）

- [x] TCS+45: accelere 车速抖动补齐（方向2, **行为补全**）——原版 426_1
  loc0a40: 每帧 1% 概率 vitesseToDoInitPrime = init + rand×(init/5) → 车队
  +0..20% 随机巡航速; H5 缺失 → 补 vBase/vPrime 机制。对照 HEAD 验证既有
  "=false"信息行非回归。断言入冒烟（203 项全绿）

- [x] TCS+44: 路点推进对齐（方向2, **行为修正**）——原版 426_1 changeCheckpoint
  逐轴判定: |dx|<40 且 |dy|<40 → 入弯减速(vitesseFrein); |dx|<4 且 |dy|<4 →
  推进路点+恢复巡航速; 末点→activePerdu。H5 旧实现为径向 max(12,v×5) 且无
  入弯减速 → 已改为逐轴 40/4px 精确对齐(每 tick 各轴位移≤2.9px<4 无隧道)。
  读档 450 帧 sim 不变(击杀14/塔15)。断言入冒烟（202 项全绿）

- [x] TCS+43: 车队制动阈值勘误（方向2, **行为修正**）——原版 426_1 roule:
  dist < unitDevant._height × CONST_ELOIGNEMENT（默认 1.8, 两舰 4, jeep 显式 1.8）;
  H5 旧实现漏乘系数（阈值=前车高裸值）→ 刹车距离短 44%, 舰完全缺 ×4。
  已修正 (hgt×elo); 连带修正波次生成注释(60px<76px 初始即微制动=原版橡皮筋车队)。
  冒烟车队断言同步更新 + 接线断言（201 项全绿）

- [x] TCS+42: 行进速度模型复核（方向2）——原版 chassis[0]×fpsc px/帧@24 +
  转弯减速 chassis[1] + 转向 chassis[2] 度/帧；H5 已按 ×1.13×(24/30) 换算实现，
  且冒烟已有逐车型实战断言（926 行起，8 车型+转向）→ 已覆盖，无需新增

- [x] TCS+41: 射速模型复核（方向2）——原版 174_173: setInterval(OCEEF,43ms) +
  numberOfRequestForPermission=floor(t[2]/fpsc), fpsc=1.13（GAME_LOGIC 9/41 行）;
  H5 fireCooldownMs=floor(t2/1.13)*43ms 毫秒制等价。断言入冒烟（200 项全绿）

- [x] TCS+40: Su37 空袭参数复核（方向2）——834/frame_1/PlaceObject2_793_23
  load 权威: puissance=500, impact=260; H5 POWER/IMPACT 逐值一致, 冷却
  comptDispo=60×1000ms=60s 亦同。断言入冒烟（199 项全绿）

- [x] TCS+39: MTHEL 激光复核（方向2）——原版 obus frame13 (chid399 load):
  _height=目标距离, 同帧 fireOnEnnemi 结算, 只播光束动画 (GAME_LOGIC 56 行
  "无弹道直接结算"); H5 shellHit 即发即中 + beams 12 帧光束, 语义一致且已有
  实战断言(当帧掉血 120)。接线断言入冒烟（198 项全绿）

- [x] TCS+38: 溅射三段复核（方向2）——原版 fireOnEnnemi 三独立调用
  (portee×1/4,1/2,1 × 伤全额,1/2,1/5; 不去重→内圈叠 1.7x) 与 H5 SPLIT 表
  [[.25,1],[.5,.5],[1,.2]] 逐值一致, Su37 空袭/导弹直射两处使用点同构。
  断言入冒烟（197 项全绿）

- [x] TCS+37: 对空 4 倍复核（方向2）——GAME_LOGIC 78 行权威:
  目标 chassis=="tigre" → etat -= power*4（剧情台词说 2 倍, 代码是 4）;
  H5 ANTI_AIR_MULT=4 一致（空袭 893 / 直射 1792/1801 三处全用）。
  断言入冒烟（196 项全绿）

- [x] TCS+36: costUpgraded 取证（方向2）——原版 1027 建造菜单三项
  costUpgraded=300/420/540（canon105 项锚定 420），全库仅赋值无读取点 → 判定
  废弃字段（同 m60AutoFire 族）；U 键对空升级 = H5 扩展，AA_UP_RATIO=0.6 为
  自定参数，game.js 注释已修正避免误标原版数据。入「六」已定案事实

- [x] TCS+35: 全库重复定义扫描（TCS+34 教训推广）——顶层 function 零重名；
  类方法 constructor/update 重名跨类(Unit/Turret)属合法；顺带清理 Turret
  constructor 里重复的 this.cost 赋值。断言(顶层无重名)入冒烟(195 项全绿)

- [x] TCS+34: 修理费取证 + 重复定义缺陷清除（方向2）——原版 819 refresh:
  priceToPay=round(2×(etatMax−etat))（pcode 前两行 r3/2、r3/r5 为混淆死代码）;
  repairIfCan: euros<priceToPay→cannot 音效, 否则扣款+etat=etatMax+selectionUnite。
  发现 game.js 里 repairPrice/repairIfCan/swithRepair 被第二个错误副本遮蔽
  (副本只收固定 2$, 无 per-HP 计价; 因函数提升生效, 幸所有调用点直接用
  repairPrice() 未踩雷) → 删除重复副本。断言入冒烟(194 项全绿)

- [x] TCS+33: 卖出价公式抽查（方向2）——原版 6_1 keyDown(83):
  floor(etatC/etatM × (price×0.75))；H5 分组改为照抄原版（避免浮点结合序差 1），
  断言入冒烟（193 项全绿）。另: 利息公式(giveIntrest)已对齐(TCS 早期轮)

- [x] TCS+32: 初始经济抽查（方向2）——原版 6_333 load: loadGame ? _root 同名字段
  : 新局 euros=850 / interest=6 / score=0（iUnlock=0 同文件 57 行）；H5 game.js
  初始 G 与 loadGame 路径均一致。断言入冒烟（192 项全绿）

- [x] TCS+31: 980 未翻子剪辑取证 + 开场黑幕接线——955=haloNoirOuverture
  (30帧时间线: f1 arcadebomb 赞助商图(不播, 起播帧标签 play=f2), f2..f5 黑→f6 透明,
  ≈0.21s; 每关 980.refresh() → gotoAndPlay("play")); H5 新增 #openCurtain 0.21s 淡出
  于 briefingShow 重启相位; 956=黑矩形(955 用); 958=空 EditText 'txt'(FontID 957,
  14px, 初始 '<p align=left></p>', 全库无代码引用) 判定调试遗留不复刻。
  冒烟 191 项全绿

- [x] TCS+30: 已定案事实补录两条（对白字号定案 / 说话人名为 H5 附加件）

- [x] TCS+29: dlgBox 排版对齐原版（方向4）——取证 EditText 1156（实例 dialogue,
  放置于 980 深度3）: FontHeight=280twips=14px、白色、左对齐、Leading=40twips=2px；
  H5 dlgTxt 12px/1.55 → 14px/1.3，dlgWho 12→14px，加防回归断言（冒烟 190 项）
- [x] TCS+28: 文档漂移修正（方向5）——README 冒烟计数 182→189、
  逐轮记录指针 PROGRESS.md→TCS_LOG.md（历史轮保留注记）

- [x] TCS+16: **811_* 族否证结案**——非逐关事件，实为地图植被（`arbre=N` 标树号，
  gotoAndPlay(random×40) 随机摆动相位）+ 2 个外链版本检查加载器（混淆 URL 指向
  thecommandersister.com/game/TCS.swf，离线无意义）。H5 的逐关事件本就来自
  773_189 且已全量接线，无差异、无需改码
- [x] TCS+15: 834 结构取证（carte 主剪辑定位）

## 四、已完成（摘要，详见 deobf/PROGRESS.md N+1..）

- TCS+11: 文档漂移修正(README 断言计数 164→182/补记断言覆盖面)
- TCS+14: SHOP_INFO rate 列 = permission帧/24 截断 断言(11 武器全吻合)
- TCS+18: enScenario 门禁勘误回退(作用域冲突死条件, 原版实际按键永远可用);
  TCS+17 的 keyDown 全键位表解码仍有效
- TCS+17: 6_1 keyDown 全键位表对齐; T/U 键确认原版不存在(纯 H5 扩展)
- TCS+23: 立绘覆盖 QA(STORY 说话人码→perso 文件 404 检查)入冒烟
- TCS+24: 布景覆盖 QA(STORY 首字母→fond 文件 15/15)入冒烟
- TCS+25: fr 语种码序列比对(原版 fr/en 同构 + STORY 一致)入冒烟
- TCS+9: 1103 页签原版语义解码(prices/keys 帧标签+selectionUnite)+H5 补音
- TCS+13: 6_321/6_335/6_564 翻证(鼠标阈值/读档解锁阈值严格>语义)+断言
- TCS+20: 950 摆动升级为逐帧采样数据关键帧(76帧表, 3.6s, X±1.5/Y±10px)
- TCS+22: STORY 翻译QA(残留英/法文片段扫描)+m26 discret 修正入冒烟
- TCS+8: SHOP_INFO range/impact/life 三列与武器/结构表交叉验证(11 武器)入冒烟
- TCS+7: 底盘表 hp/bounty 与 1103 第二页图示交叉验证(12 项全对上)入冒烟
- TCS+6: 帮助板 1103 双页接线(f1 键位 / f2 敌方单位价目表, 底栏页签热区)
- TCS+5: 836 全屏点击吞噬层(对白/终局期间防误触地图)
- TCS+4: 终局音效编排(1158 frame_2 e1..e14 → CINE_SFX 随对白时间轴铺放)
- TCS+3: protecthint(1166) "protect this area" 原位(642,2)上图接线
- N+105/TCS+2: conseilIntroHelp(1154) 第 1 关操作提示框上图接线
- N+104: 极端存档边界（0 塔/满解锁/末关读档+200 帧 sim 无异常）

- 数据三表（武器/结构/底盘）逐列对齐；44 波编成+路线逐车断言
- 剧情全链：44 关 237 句中文去政治化对白（说话人码逐句比对一致）、
  布景/立绘演出、简报暂停/非简报门控、胜负终局动画+对白时间轴、victims 黑幕
- UI 六面板全原版素材（音乐/建造/侧栏/按钮/修理条/HUD）、金钱面板、帮助板、音量条
- 系统：BGM 三首原曲+四段落音乐+全套 SFX、Su37 空袭、云层/画质、存档读档
- 防回归：冒烟 173 项断言（逻辑/素材尺寸/资产引用/去政治化/码序列/存档往返/读档实战）

## 五、自查方向（清单为空时从这里找活）

1. 从未取证的原版行为点：翻 `deobf/scripts/` 里仍未覆盖的剪辑
   （如 1141 之外的特效类、836/951 子结构、装饰性 timeline）。
2. 数值抽查：任选一张表的一列重算原版来源，验证 H5 值。
3. 边界行为：极端存档（0 塔/满解锁/中途波次）读档后跑 sim。
4. 体验打磨：素材接缝、文字排版与原版截图语义差异（仅离线可判的部分）。
5. 文档：README/PROGRESS 与实现漂移检查。

## 六、已定案事实（勿反复；有新证据才可推翻）

- 雷达 = MLRS/pluton 目标指示（radarCovered 已接线，用户实机证言）。
- 战争迷雾已按用户指令停用（FOG_ENABLED=false），勿恢复。
- m60AutoFire/scoreBonus/interestSup：反编译全库无游戏内读取点（cookie 初始化 +
  ConstantPool 残留），判定废弃/外链字段，不接线。
- 811_* 剪辑族 = 地图植被(随机摆动) + 外链版本检查加载器（TCS+16 否证"逐关事件"假设，
  防止后续误立项）；版本检查属网络功能，离线 H5 不复刻。
- "lapin"(chid6, carte dpt220) = 无行为脚本的装饰彩蛋（仅 ConstantPool 名称出现），
  尺寸微小不复刻。enScenario 门禁 = 作用域冲突死条件（TCS+18），按键实际永远可用。
- canon75AutoFire = **反作弊哨兵**（newEvents mR==1: 旗标开启 → activePerdu 当关判负；
  TCS+2 取证）。H5 无作弊入口，不接线（行为即"不开挂则不触发"）。
- costUpgraded（1027 菜单 300/420/540）= 原版废弃字段（全库无读取点）；
  U 键对空升级 = H5 扩展，AA_UP_RATIO=0.6 为自定参数非原版数据（TCS+36）。
- 1053 story 按钮 = 自含标签翻转（"action"/"story"，QEX 旗标无其他读取点），
  系开发遗留；H5 已在帮助板以等效标签翻转复刻（TCS+6）。
- 真机听感验证：永久挂账（纪律禁止浏览器）。
- 对白文本排版 = EditText 1156（实例 dialogue，放入 980 dpt3）：FontHeight
  280twips=14px、白、左对齐、Leading 40twips=2px（TCS+29 字节级解码，H5 已对齐
  14px/line-height:1.3 并有防回归断言）。
- 说话人名显示（dlgWho）与「▼ 点击继续」提示（dlgNext）= H5 附加件：原版 979
  按钮仅调 nextDialogue()，对白字段只写正文，无名字字段（TCS+29 取证）。
