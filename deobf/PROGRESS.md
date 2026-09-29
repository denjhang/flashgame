# TCS 反混淆与资源还原进度

## 第 N+71 轮成果（2026-09-29, H5 领土防御·UI 原版素材替换 #2：建造菜单 1025 帧库图标字节级上图 + 原版 info 悬停）

**（权威 = swf_dump 逐 tag 解码 DefineSprite_1025/1026/1027 + 1027 各 1026_* CLIPACTION 脚本）**

### 1. 【原版建造菜单结构解码（本轮取证，纠正旧注）】

- **1025 = 图标帧库**（12 帧，帧标签逐字 = 武器名）：m60→子图 1002, gatling→1004,
  canon75→1006, canon105→1008, canon105D→1010, radar→1012, crotale→1014,
  canon125→1016, MLRS→1018, pluton→1020, MTHEL→1022, su37→1024；
  槽位 load 脚本 `item.gotoAndStop(name)` 换图
- **1026 = 槽位按钮**（7 帧，帧标签 normal/over/lock/press）——所谓"态"只是
  **同一图标的 cxform 变体**（lock 乘 0x68≈0.41 变暗；press 是颜色动画），无独立美术
- **1027 = 3 页容器**：三帧都是同 4 个 1026 实例换名字重指（f1 m60…, f2 canon105D…,
  f3 MLRS…），槽位矩阵 (±76, -63.05/1.4)，格 75x62
- FFDec sprite:png 导出 1027 三帧 md5 相同（导出器塌缩，读 item 默认帧 m60）→
  改从 1025 直出 12 帧图标
- 每格 rollOver 的 **info 文本逐字提取**（含 price/power/impact/range/rate/life），
  造价与 STRUCTURES 表逐项交叉一致（120/200/300/420/540/250/1000/1400/2200/1200/5000）
  —— 再次实证经济表 cost 列正确

### 2. 【H5 换装】

- `assets/menu/*.png` 12 张全部替换为 1025 直出的**字节级导出**（75x62；旧图为
  二次加工品 76x63）
- buildShop：删除自造武器名/价格角标；槽 = 原版图标 + CSS 复刻 1026 三态
  （hover 提亮 = over、brightness(.41) = lock、橙色描边 = 选中）；造价/属性改为
  **原版 rollOver 行为**——悬停把逐字 info 文本写进侧栏 INFO 面板（原版
  showInfoOfItem），移开恢复。su37 compteur（ready/.. wait）保留
- 布局 2x2 网格 1px 缝、格 75x62，与 1027 槽位矩阵一致

### 3. 验证（node 冒烟，无浏览器）

- `1025 图标 12/12 存在=true 尺寸全 75x62=true`（PNG IHDR 断言）
- `SHOP_INFO 12 条且造价与结构表交叉一致=true`
- 132 项 `=true`；450 帧 sim 正常；node --check 通过
- 排错记录：断言块在模板字符串内 `\t\d` 被模板转义吃掉 → 双反斜杠修正

### 4. 本轮仍未做（如实记录）

- 音量条 s1/s2 拖动调音 / selectionUnite 点击音（1151 面板遗留，P2）
- UI 替换 #3 起：1079/1074 侧栏容器 / 1078/653/979 按钮 / 819 修理条 / HUD 杂项
- 剧情系统按原关卡安排复刻（解码 329/980_242/instructions 演出流）未动工


## 第 N+70 轮成果（2026-09-29, H5 领土防御·UI 原版素材替换 #1：音乐面板 1151 整面板上图）

**（权威 = FFDec 导出 DefineSprite_1151 PNG(178x203)/SVG + frame_1 全部 CLIPACTION 脚本）**

### 1. 【原版面板结构解码（本轮取证）】

- 1151 = 背景形状 1143 + 关闭钮 686(26.75x26.75 @144.8,3.05) + **四个 1145 歌曲按钮**
  (109.65x21.05 @ y=7.05/34.65/61.7/**91.5**) + 文本 1146"sounds"/1147"music" +
  音量条 1150(s1/s2 系)
- 第四个 1145 实例 id=**pauser**（1145_14）≠ 歌曲槽：playMusic/pauseMusic 翻转，
  动态文本 "music off"(播放中)/"music on"(暂停)。其余 1145_5/8/11 = changeMusic(0/1/2)，
  按下后置 pauser.isOff=false + 文本 "music off"，并播 selectionUnite 点击音
- 按钮态：load 时 _alpha=50，rollOver=100，rollOut=50

### 2. 【H5 换装】

- 整面板原图 `assets/ui/music_panel.png`（FFDec 直出，178x203）替代自造按钮排；
  四热区按 SVG 坐标绝对定位（7/35/62/92 三行 + pauser，105x21），关闭钮热区 @145,3
- pauser 语义接线：mPlay 文本 = isPause ? 'music on' : 'music off'（原版文本，
  弃用自造 "▶ 播放"）；mMute 由自造"静音"改为原版 686 关闭钮（收起面板），
  另加侧栏 "♪ 音乐" 重开按钮（原版面板显隐由 UI 容器管理，H5 以等效开关代替）
- 曲名动态文本沿用 BGM_NAMES（= 1145 load 脚本逐字）；音量条 s1/s2 本轮仅上图未做拖动

### 3. 验证（node 冒烟，无浏览器）

- 素材存在 + PNG IHDR 尺寸 178x203 一致；pauser 'music on/off' 接线；
  index.html 面板图+四热区+关闭钮引用齐全
- 130 项 `=true`；450 帧 sim 正常（塔 15/15 / lost=false）；node --check 通过

### 4. 本轮仍未做（如实记录）

- 音量条 s1/s2 的拖动调音量（原版 1150_19/21 rollOver/drag）未实现，仅原版图呈现
- selectionUnite 点击音未接（SFX 库已有同类，下轮顺手）
- UI 替换 #2 起：1027 建造菜单三页槽位图 / 1079/1074 侧栏容器 / 1078/653/979 按钮 /
  819 修理条 / HUD 杂项（均未动工）
- 剧情系统按原关卡安排复刻（解码 329/980_242/instructions 演出流）未动工


## 第 N+69 轮成果（2026-09-29, H5 领土防御·用户指令三连：迷雾摘除 + 播放列表换原曲 + 定时任务改向）

**（用户指令：除剧情文字外全部用原版素材做成一模一样；战争迷雾暂时取消；修改定时任务）**

### 1. 【★ 战争迷雾摘除（FOG_ENABLED=false 总开关）】

迷雾/探索记忆为 H5 自造层（N+54 已证原版小地图全情报、主地图敌人无条件绘制）。
`FOG_ENABLED=false`：computeVisibility/revealExplored 短路、isVisible 恒 true、
draw 的三态迷雾层整块跳过 —— 敌人恒可见/可锁定，地图全亮。代码保留可随时恢复。
雷达塔保留其原版真用途（MLRS/pluton 门控，N+67）。

### 2. 【BGM 播放列表换原版三首真曲】

提取 DefineSound 1107/1124/1157 → `actofinstinct/hellmarch/justdoitup.mp3`
（= 原版 musics[0..2] attachSound 的三首，顺序按 chid 序）。BGM_FILES 重接线；
删除冒充文件 bgm2/bgm3/bgm_main/bgm_alt（其身份已勘误入档：1082=edith、1084=bgscenario、
1157=justdoitup）。

### 3. 【定时任务已改向】

automation-c859b437 更新为"全方位对齐原版"总目标：主攻 **UI 全原版素材替换**
（多轮工程，逐面板推进：1151 音乐面板 → 1027 建造菜单 → 1079/1074 侧栏容器 →
1078/653/979 按钮 → 819 修理条 → HUD 杂项），并载入已定案事实清单防止反复。

### 4. 验证（node 冒烟，无浏览器）

- `迷雾已停用(FOG_ENABLED=false): 全图恒可见=true, VIS源数=0`
- 127 项 `=true`；450 帧 sim 正常（塔 15/15 / lost=false）

### 5. 本轮仍未做（如实记录）

- UI 全原版素材替换：6 个面板均未动工（下轮起逐面板推进，定时任务已载入计划）
- 雷达门控照亮者递归细节 / getDistance /4 偏置 / 容器 bbox / 多 chid 合成器 / 真机听感（搁置）

## 第 N+68 轮成果（2026-09-29, H5 领土防御·Su37 挂架横向散布 —— 子系统全面关闭）

**（权威 = 793/frame_1 四挂架 load 逐行：786_1 decalX=+20 / 786_21=−10 / 786_31=−20 /
786_11=+10，ordre 按 missile1→2→3→4 链式）**

### 1. 【补完：毯式落点的挂架横向散布】

上轮的毯式落点为纯纵向线；本轮按四挂架的 `decalX`（+20/−10/−20/+10，链式顺序
missile1→2→3→4 循环）在落点上加入**垂直航向的横向错位**（±20px）。`SU37.DECALS`
落表 + 断言。

### 2. Su37 子系统状态：全面关闭

冷却 60s ✓ / 出场边与出生点 ✓ / 16 枚毯式连投（纵向间距 + 横向挂架散布）✓ /
每枚 500 伤 + impact 260 三段溅射 ✓ / 通场离场 ✓ / 瞄准区 785 ✓ / 与建造模式互斥 ✓ /
空格取消 ✓。剩余仅一处乱码成员语义不明的即时重置条件（不影响主流程）。

### 3. 验证（node 冒烟，无浏览器）

- `挂架横向 decalX [20,-10,-20,10] 一致=true`；毯式投弹 16 枚/4 单位全灭维持全绿
- 127 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- getDistance /4 提前量偏置（需各结构血条偏移数据，影响几 px）
- 雷达门控的照亮者循环内部递归细节 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+67 轮成果（2026-09-29, H5 领土防御·★★ 雷达真用途实锤 + 门控接线 —— N+56"悖论"是我自己的分支极性错误）

**（用户实机证言 + 785_17 activeDisponibilite/chargeBombes + getDistance 重读。此轮纠正
N+55/56 两轮的错误结论）**

### 1. 【★ 勘误：分支极性读反 —— 门控【仅作用于 MLRS/pluton】】

重读 getDistance 原始字节码：`if (type=='MLRS' || type=='pluton')` 命中时走的是
**雷达门控分支**（loc01b7），普通武器走"直接返回距离"。即：

- **普通塔（m60/canon 等）：完全不过门控，永远按真实距离索敌** → 29 波无敌方雷达
  也照常游戏，"悖论"根本不存在，是我把 `Not/If` 链的分支归属读反了
- **MLRS/pluton（间接射击火箭炮）：候选须处于己方雷达单元的 distanceOfFire 覆盖内**
  （雷达塔 1200 / 敌方 radarMobile 车 1500），否则距离按 1000000 计 = 不可锁定
- **用户实机证言**："只有建了雷达之后，MLRS 还有另外一个大火箭炮(pluton)才能用" ——
  与修正后的解码完全吻合
- 雷达塔的真实用途 = **为远程间接射击火箭炮提供目标指示**；敌方 radarMobile 车 =
  敌方 MLRS 的眼（wave 33/34 的 camionBlinde+MLRS 正是配 radarMobile 出场）

### 2. H5 接线

- `radarCovered(cand, shooterSide)`：覆盖者 = 己方 radar 塔(1200) / 敌方
  weaponId=='radarMobile' 单位(1500)
- 玩家塔获取循环 + 保持检查：`id==='MLRS'||'pluton'` 时须雷达覆盖，失覆盖即弃
- 敌方 Unit 索敌：weaponId=='MLRS' 的 camionBlinde 同门控（覆盖者 = 敌 radarMobile 车）

### 3. 验证（node 冒烟，无浏览器）

- `MLRS 无雷达不可锁定=true → 建雷达(覆盖1200)后锁定=true → 覆盖外目标仍不可锁=true`
- `m60 无雷达正常锁定 (不受门控)=true`
- `敌方 MLRS: 无 radarMobile 车不可锁定=true → radarMobile 覆盖后锁定=true`
- 126 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- getDistance 的 /4 提前量偏置、挂架横向 decalX 散布、chargeBombes 乱码重置（小项）
- 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+66 轮成果（2026-09-29, H5 领土防御·空格键 depressSpace 对齐 —— 补 Su37 瞄准取消）

**（权威 = 6_1 load pcode loc0207 的 depressSpace 全函数）**

### 1. 【原版空格取消范围解码】

`depressSpace()`：①建造模式关（viseurConstruction=false + 光标 _x=-500）；
②**Su37 瞄准关**（zoneBombardement=false + zone 光标藏）；③选中单位取消
（unshowInfoOnUnit + 射程指示器 _x=-2000/_width=0）；④helpBoard/jukeboxPanel 面板滑走。

### 2. H5 修正

- 空格处理器提取为同名 `depressSpace()`（keydown 调用）：补上**缺失的 Su37 瞄准取消**
  （`G.su37Aiming=false + SU37.pending=null`）；建造/选中取消原有 ✓
- ④的面板滑走不建模（原版 800x600 舞台布局，H5 侧栏常驻），如实记录

### 3. 验证（node 冒烟，无浏览器）

- `空格取消 Su37 瞄准+pending=true`、`空格取消建造模式=true`
- 123 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- 雷达门控 / chargeBombes 乱码重置 / 容器 bbox / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+65 轮成果（2026-09-29, H5 领土防御·商店槽位进入条件对齐 —— 锁定/钱不够点即 cannot）

**（权威 = 1027/1026_* on(press) 逐行：unlocker && euros ≥ cost 才进建造模式，否则
cannot；Su37 槽位 press 取消建造模式）**

### 1. 【偏差：H5 在地图点击才查钱，原版在槽位点击就查】

原版槽位 press：`if (unlocker[name] && euros >= cost) { 进入建造模式 } else { cannot.start() }`
—— 锁定塔点击 = cannot；钱不够点击 = cannot 且**不进入建造模式**。进入建造时同时
`zoneBombardement = false`（取消 Su37 瞄准）；反之 Su37 槽位 press 会取消建造模式
（两光标互斥）。H5 旧版：解锁即可进建造（钱不够到地图点击才报 cannot），且两光标可
同时待命。

### 2. H5 修正

- 新增 `shopSlotPick(id)`：门控（unlocker + 钱）→ 取消 Su37 瞄准 → 进建造；
  锁定槽/钱不够 → cannot。槽位 onclick 统一走它（锁定槽从"不可点"改为 cannot 反馈）
- `su37Start` 取消建造模式（G.shopSel=null，对应原版互斥）

### 3. 验证（node 冒烟，无浏览器）

- `锁定cannot/钱不够cannot/够钱进建造/Su37取消建造 全链=true`（含 m60 建造价 120 的
  100 元不可造用例）
- 121 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- 雷达门控 / chargeBombes 乱码重置 / 容器 bbox / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+64 轮成果（2026-09-29, H5 领土防御·★ Su37 投弹重写：单点爆炸 → 16 枚毯式连投）

**（权威 = 793/frame_1 的 4 个挂架剪辑（786_1/11/21/31 load: ordre=missile1..4,
nMissile=4, decalX=+20/+10/−10）+ 786 frame_2/6 的链式触发脚本 + 793_23 enterFrame
各边越界离场）**

### 1. 【原版投弹模式解码】

- Su37 挂 **4 个挂架**（missile1..4），每架 `nMissile=4` → **单次通场 16 枚**
- 触发为**链式**：missile1 开火 → missile2 → missile3 → missile4（786 frame_2/6 DoAction）
- 每枚 puissance=500 + impact=260 三段溅射 → 单次通场理论总伤 8000
- 飞机**通场**：飞越目标后继续原方向出图（793_23 enterFrame 各边越界检测后移除）

### 2. H5 重写（旧版 = 到达目标点单次爆炸伤 3 个）

- 距目标 ≤340px 开启投弹窗，**1 枚/tick 连投 16 枚**，落点沿冻结航向 ±300px 毯式分布
  （间距 40px）；触发时冻结投弹航向（`dropRot`），飞机直线通场、投完越过 400px 或
  出图后离场
- 每枚：boom + impact 260 三段溅射（SPLIT 同 shellHit）+ createEclat + killUnit 扫荡
- 修复两处实现 bug：dropN 未初始化（`undefined < 16` 恒 false）；过点后 rot 逐帧翻转
  导致悬停（改冻结航向直线通场）

### 3. 验证（node 冒烟，无浏览器）

- `Su37 毯式投弹: 16 枚 (期望 16)=true, 4 单位全灭=true`（目标簇 4 辆 abrams 全灭）
- 120 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- 挂架横向 decalX（+20/+10/−10）在落点上的横向散布未建模（当前毯式为纯纵向线分布）
- chargeBombes 乱码即时重置条件 / 雷达门控 / 容器 bbox / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+63 轮成果（2026-09-29, H5 领土防御·★ Su37 冷却勘误：2 秒 → 60 秒）

**（权威 = 785_17 的 activeDisponibilite / chargeBombes / zone on(press) 全函数解码）**

### 1. 【Su37 冷却系统全解】

- 点击落点：`Su37.disponible=false` + `activeDisponibilite()` →
  `idDispo = setInterval(this, <chargeBombes>, **1000ms**)`
- `chargeBombes`：comptDispo ≤ 0 时**重装 60** + `disponible=true` + clearInterval +
  compteur 显示 "ready"；等待期显示 `comptDispo + " .. wait"` 并递减
- **冷却 = 60 × 1000ms = 60 秒**（不是 43ms 间隔——旧注释把 174 的 OCEEF 间隔错套到了
  这里，快了 23 倍）
- 附带：出场边随机 bas/gauche/droit/haut、出生点在地图边缘（y=±600/-1600, x=-100/2100）、
  Su37S 音效、zone 光标隐藏 —— H5 均已一致

### 2. H5 修正

- `COOL_FRAMES=60` → `COOL_MS=60000`，冷却改毫秒递减（G.dt）；等待期 UI 文案改为
  原版式 `"N .. wait"`（原 'Ns'）；smoke 断言更新（1800 tick 精确命中）

### 3. 验证（node 冒烟，无浏览器）

- `Su37 冷却: 60000 ms 跑到恢复用了 1800 tick (期望 ~1800)=true`
- 119 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- chargeBombes 的即时重置条件 `if (Su37.<garbled>.<garbled>)` 未解（乱码成员语义不明）
- 雷达门控 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+62 轮成果（2026-09-29, H5 领土防御·★ 音乐系统全解 + 段落音乐四处接线 —— edith 项完成）

**（权威 = 1085 内部 StartSound 标签（小端 SoundId 实证）+ DefineSound 1081-1084 提取 +
6_430 播放器伪码 + newEvents m26/m44）**

### 1. 【★ N+61 的"内嵌流"定性有误：四段是 DefineSound，且早已在 H5 素材里】

1085 帧内是 **StartSound 标签**，SoundId 为**小端**：`39 04`=1081、`3a 04`=1082、
`3b 04`=1083、`3c 04`=1084 —— **md5 实证 H5 的 bgm2.mp3/bgm_alt.mp3 ≡ 1082(edith)、
bgm3.mp3 ≡ 1084(bgscenario)**（此前提取时用错了文件名）。播放列表 musics[0..2]
attachSound("actOfInstinct"/"hellMarch"/"justDoItUp") 的导出名在 SWF 中**不存在**
（音乐被裁）→ 原版 ♪ 播放列表实际静音，真正的游戏内音乐 = 1085 时间线四段。

### 2. 【段落音乐忠实接线（playSegment/stopSegment 独立于 ♪ 播放器）】

| 时机 (原版) | 行为 | H5 |
|---|---|---|
| 简报期 (startInstructions: 任务 ∉[26,30] → bgScenarioStart) | bgscenario 循环 | endWave: nextWave ∉[27,30] → bgscenario |
| newEvents m26 → edithStart | edith 循环 (loops=0x7fff) | nextWave==26 → edith |
| 953 frame_2 (每任务开始) → bgScenarioStop | 播放头跳走全停 | startWave → stopSegment() |
| newEvents m44 → Yamato() = yamatoBattle+pauseMusic | **终战静场**（非切曲！） | pauseMusic+stopSegment（勘误旧 bgm_alt 切换） |
| activePerdu → gameOverStart | gameover 单次 | G.lost → playSegment('gameover', false) |

### 3. 验证（node 冒烟，无浏览器）

- `段落音频三件存在=true`；`第26波简报=edith=true`、`第25波简报=bgscenario=true`、
  `任务开始全停=true`
- 118 项 `=true`；450 帧 sim 正常；headless Audio stub 补齐 pause/currentTime

### 4. 本轮仍未做（如实记录）

- vent(1081) 风声段未接线（触发时机 ventStart 无调用点——原版也未启用）
- 雷达门控 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）
- ♪ 播放器三文件的真实身份已勘误入档（bgm2=edith, bgm3=bgscenario, bgm_main=1157
  来源不明——原版播放列表被裁成静音），按钮保留为 H5 增补功能

## 第 N+61 轮成果（2026-09-29, H5 领土防御·bgSound 帧标签解码 —— edith 音乐项定性收口）

**（权威 = DefineSprite_1085 帧标签（sprite_frames.py 提取，已入 sprite_frames.json）+
FFDec 导出实验 + edithStart 唯一调用点 6_564）**

### 1. 【bgSound(1085) 结构解码】

9 帧时间线，8 个标签 = 四对启停段：`ventStop/ventStart`（风声）、`edithStop/edithStart`、
`gameOverStop/gameOverStart`、`bgScenarioStop/bgScenarioStart`；各帧承载
**SoundStreamHead2 内嵌音频流**（流式音频，非独立 DefineSound 资产）。

### 2. 【edithStart 定性：音频内容无法离线提取，维持搁置】

- 唯一调用点：6_564（newEvents 所在 clip）`_root.bgSound.gotoAndPlay("edithStart")`
  —— m26（首批直升机波）切换到 edith 段 ✓ 与 H5 侧推断一致
- `edithStop` 全库无调用 → edith 段自然播完（流式时间线走到尾）
- FFDec `-format sound:mp3/wav` 对 sprite 内嵌流导出为空（流是逐帧 SoundStreamBlock，
  需手工按 SoundStreamHead2 重组 MP3 帧）——离线提取成本高、且无真机听感佐证内容
- **结论**：m26 音乐切换维持搁置（需先重组 edith 音频资产），已从"听感未知"细化为
  "资产缺失"

### 3. 验证（node 冒烟，无浏览器）

- 本轮仅数据落档（sprite_frames.json 新增 1085 帧/标签）+ 文档；109+ 断言全绿维持

### 4. 本轮仍未做（如实记录）

- edith 音频流重组（要播放得先有音频文件）
- 雷达门控语义（待真机观察）/ 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+60 轮成果（2026-09-29, H5 领土防御·chassisData 全表审计 —— 修正 tigre 巡航速度）

**（权威 = 428_unit load 的 chassisData 全表 12 型 × 5 列；乱码键 u228Wu132=navire、
$u180u147=Yamato 经数值指纹比对确认）**

### 1. 【★ 修正：tigre（直升机）巡航速度 3.2 → 3（原版值，H5 快了 6.7%）】

12 型 × 5 列（速度/转弯/转向/血量/赏金）程序化比对仅此一处偏差。同时把速度断言
的车型清单补入 tigre（9 型）。

### 2. 【其余 11 型与两列数据全部一致】

- 血量列 [3]：camion1 160 … t90 1200、camionBlinde 2800、tigre 400、navire 1800、
  Yamato 20000 ✓（H5 一直正确）
- 赏金列 [4]：50…500、navire 1000、**Yamato 0（击沉无敌方赏金，原版如此）** ✓
- 三大数据表审计至此全部完成：typeData 26×6 零偏差（N+59）、structureData 勘误
  两列用反（N+58）、chassisData 12×5 修正一处（本轮）

### 3. 验证（node 冒烟，无浏览器）

- `CHASSIS 12 型×5列 与原版 chassisData 一致=true`
- 112 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- 雷达门控语义（N+56 待真机观察，维持）
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+59 轮成果（2026-09-29, H5 领土防御·WEAPONS 表全列审计 —— 26 型 × 6 列零偏差）

**（权威 = 173/174 load 的 typeData 全表 + createObus 伪码 + obus 命中脚本）**

### 1. 【WEAPONS 表全列比对 —— 完美移植，零改动】

原版 typeData（174 load 逐行）vs H5 WEAPONS：**26 型 × 6 列程序化比对，偏差 0、
无缺失、无多余**。列语义全部在消费端验证过：[0]=rotateSpeed（N+39）、[1]=射程
（range 圈/索敌）、[2]=许可计数（1505ms 冷却等）、[3]=并联炮管数（N+29）、
[4]=puissance 伤害、[5]=impact 溅射。

### 2. 【impact（第 6 列）消费链完整验证】

- 174：`impact = typeData[type][5]`
- createObus（伪码逐行）：`obus.portee = 射击者的 impact` —— 溅射参数名虽叫
  portee，**值是 impact 列**
- obus 命中（400/frame_1 等）：`fireOnEnnemi(XPos, YPos, portee, puissance, side)`；
  pluton 弹（frame_10）三段：portee/4 全伤 + portee/2 半伤（H5 的 SPLIT 三段环同构）
- H5 shellHit 用 `s.w[5]` 做溅射半径 ✓ 完全一致；Su37 炸弹 impact=260 硬编码 ✓
  （H5 IMPACT: 260 一致）

### 3. 验证（node 冒烟，无浏览器）

- 本轮零代码改动（审计全绿）；109 项断言全绿维持

### 4. 本轮仍未做（如实记录）

- 雷达门控语义（N+56 待真机观察，维持）
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+58 轮成果（2026-09-29, H5 领土防御·★ 经济表勘误：建造价/满血两列用反了）

**（权威 = 185/frame_1/PlaceObject2_86_1 load 的 structureData 全表 + 1027 商店 12 槽位
load 实测建造价）**

### 1. 【★ 勘误：structureData 两列语义 —— [0]=满血, [1]=建造价（旧版全反）】

原版结构（逐行）：
```
structureData.m60 = new Array(80,120); ... pluton = new Array(600,5000);
_parent.etat = structureData[structure][0];        ← [0] = 满血
etatJauge.maxEtat = etat;
```
商店槽位（1027/1026_* load）实测**建造价 = [1]**：m60=120、gatling=200、canon75=300、
canon105=420、canon125=1400、crotale=1000、radar=250、MLRS=2200、pluton=5000、MTHEL=1200。

H5 旧版把 [0] 当建造价（m60 卖 80 造）、[1] 当"升级价"——**建造价整体偏低 25%~4×**
（m60 80 vs 120、pluton 600 vs 5000）。已修正：`STRUCTURES = {cost:[1], maxHp:[0]}`，
Turret 血量改从 `s.maxHp` 取源（删除硬编码血量表——该表恰好等于 [0] 列所以血量本身
一直是对的）。卖出价公式不变（floor(hp/maxHp × cost × 0.75)），cost 修正后自动对齐：
满血 m60 卖出 = 90（=75%×120，原版同式）；对空升级费随真实建造价自动修正
（canon105 168→252）。

### 2. 验证（node 冒烟，无浏览器）

- `STRUCTURES 11 型 maxHp=[0]/cost=[1] 与原版 structureData 一致=true`
- `满血 m60 卖出=90=true, 半血=45=true`
- 111 项 `=true`；450 帧 sim 正常；初始金钱 850 的购买力随真实物价自然收紧（原版同）

### 3. 本轮仍未做（如实记录）

- 雷达门控语义（N+56 待真机观察，维持）
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+57 轮成果（2026-09-29, H5 领土防御·血条子系统审计对齐 + fireOnEnnemi 解码）

**（权威 = 428_unit enterFrame 的 etatJauge 段 + 6_1 load/keyDown + 327 fireOnEnnemi）**

### 1. 【血条子系统审计 —— H5 已对齐，零改动】

原版 428_unit enterFrame 逐行解码：
- `if (!master_clavier.afficheEtat) etatJauge._x = -500;`（H 键关闭 → 藏掉）
- 开启时：`jauge._xscale = etat / maxEtat × 100`（血量比例条）+ 逐帧跟随单位 `_x/_y`
- `afficheEtat` 默认 **true**（6_1 load）

H5 现状：`showHp` 默认 true、H 键开关、存活时绘制 —— 三件套全部一致 ✓，零改动结清。

### 2. 【fireOnEnnemi 部分解码（327）】

`fireOnEnnemi(xpos, ypos, range, power, side)`：按 side 选遍历数组（'ennemy' →
unitsEnnemies），对 `|_x − xpos| < range×2 + _height` 的单位施加 power 伤害的水平邻近
判定。**唯一调用点 = 329 的 iMission≥45 终局分支**（power=1000000 清场演出）。
H5 终局流程无此演出，不接线，如实记录。

### 3. 本轮仍未做（如实记录）

- 雷达门控语义（N+56 列待真机观察，维持）
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+56 轮成果（2026-09-29, H5 领土防御·雷达门控悖论定量证伪 —— 静态分析穷尽，列搁置）

**（N+55 头号待解项的收官轮：不接线决策维持，证据链全部落档）**

### 1. 【悖论定量化 —— "候选须在己方雷达覆盖内"读法被数据证伪】

- radar（塔）distanceOfFire = **1200**、radarMobile（camion3）= **1500**（typeData，H5 两表既有）
- 含 radarMobile 车的波次仅 **15/44**（波 4,10,12,15,19,23,27,30,34-37,39,41,43）；
  **29/44 波敌方雷达网络为空** → 若门控按字面接线，这 29 波除 MLRS/pluton 外全部
  不可锁定 → 原版玩家显然能正常防御 → **读法必有错**。

### 2. 【静态分析穷尽清单（后续轮次不必重走）】

- `units*Radar` 数组在 327 中**只有 refreshRadar 的两处赋值**（分隔符计数法定位索引
  81/82），无第三方成员来源；唯一消费者 = 174 getDistance 的门控循环
- refreshRadar 的 `Not/If` 极性三次独立重描一致：**数组只含 radar/radarMobile 类型**
- getDistance 门控循环极性三次独立重描一致：**只有 radar/radarMobile 类型可作照亮者**
- AS2 逆序压栈经 createUnit 六参签名实证 → obj1=射击者, obj2=候选（N+55 末尾已改对）
- **悖论形态**：有雷达塔时 getDistance 无限递归（照亮者的射程检查又调 getDistance）
  → AS2 256 层上限报错 → undefined 传播 → getTarget 退化为"锁首个存活单位、无距离门"；
  无雷达塔时干净返回 1000000 → 全部不可锁定。两种情形都无法还原"正常按射程索敌"

### 3. 【决策】

- H5 **保持 N+51/52 的可用索敌模型**（500ms 轮询 + 粘滞 + porteeAcq + 边界 + 对空三型）
- 雷达门控列为**待真机观察项**（与真机听感同类）：需要观察原版 wave 1 的 m60 是否
  开火/是否按射程开火——任一观察即可判定上述读法哪个环节有误（如 FFDec 对混淆
  `Not/If` 的错列）。在判定前不接线

### 4. 验证（node 冒烟，无浏览器）

- 本轮零代码改动（纯证据落档）；109 项断言全绿维持；`node --check` 通过

### 5. 本轮仍未做（如实记录）

- 雷达门控语义（待真机观察，上节）
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+55 轮成果（2026-09-29, H5 领土防御·getDistance 雷达门控重大发现 + N+53 误读回滚）

**（权威 = 174 getDistance 全函数 + 327 createUnit 的 unit.type 赋值（r22=tourelle）+
blip 挂载点）**

### 1. 【★ 勘误：N+53 的小地图改动建立在错误解读上，已回滚】

逐行重解后确认：
- `refreshRadar` 数组 = 每侧**只含 radar/radarMobile 类型单元**（= 雷达网络成员表），
  **不是小地图数据源**（N+53 把过滤极性读反了）
- 小地图 blip（chid52）是 createUnit 时**逐单位无条件挂载**的 → 小地图显示全部单位
  （含雷达塔）；blip clip 无可见性逻辑（N+54 的"全情报"结论仍成立）
- H5 已回滚：小地图恢复实时绘制 G.turrets + G.units（全部存活单位，绿/红统一色），
  删除 refreshRadar 快照机制与 radar 塔排除

### 2. 【★ 重大发现：getDistance 是"雷达网络可锁定门控"，不是纯距离】

getDistance(obj1=候选目标, obj2=射击者)（AS2 逆序压栈，getTarget 调用点实证）：

- obj1.type 是 **MLRS/pluton** → 直接返回欧氏距离（**大杀器豁免门控**）
- 其余武器：遍历**候选目标自己一侧**的雷达网络数组（unitsAllieesRadar/unitsEnnemiesRadar，
  即雷达塔/radarMobile camion），若候选处于**任一己方雷达单元的 distanceOfFire** 内 →
  返回真实距离；否则 **return 1000000**（超出一切射程 → getTarget 判不可锁定）
- **unit.type = 武器名**（createUnit: `.type = register22(tourelle)`）—— camion3+radarMobile
  的 type 就是 'radarMobile'，构成敌方雷达网络 ✓ 系统自洽
- 附带解码：obj1.side=='ennemy' 时距离计算带 (unitEtat 全局位 − 车体全局位)/4 的提前量偏置

**即：原版雷达塔/雷达车的真实用途是"照亮可打击的敌人"——只有处于己方雷达覆盖内的
敌人才能被锁定，雷达车的武器射程即其覆盖半径（radarMobile 的 typeData[1]）。**

### 3. 【H5 本轮未接线 —— 存在待解悖论，如实记录】

门控若直接接线，会出现**早期波次悖论**：敌方雷达网络仅在 wave 4+ 有 radarMobile camion，
wave 1-3 的敌人在此模型下不可锁定（原版玩家却能正常防御）；而 radar 塔在 m27 才解锁、
也无法解释我方侧。说明仍有缺失环节（候选极性/调用点穷举未完成）。在解开悖论之前
**不接线**——错误接线会破坏整个游戏的可玩性。现有 H5 索敌模型（N+51/52）保持。

### 4. 验证（node 冒烟，无浏览器）

- 回滚后 109 项 `=true`；450 帧 sim 正常（塔 15/15 / lost=false）；`node --check` 通过

### 5. 本轮仍未做（如实记录）

- **雷达网络门控的完整语义**（上节悖论）—— 头号待解项：需穷举 getDistance 全部调用点 +
  弄清 noTarget/getFirstEA 与雷达数组的关系后再决定 H5 接线方式
- getDistance 的 /4 提前量偏置未接线（仅影响测距几 px）
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器 / 真机听感（搁置）

## 第 N+54 轮成果（2026-09-28, H5 领土防御·小地图敌点改原版全情报语义）

**（权威 = blip clip chid52 pointUnitRadar 全脚本（仅两帧 stop()，无可见性逻辑）+
refreshRadar 无条件复制全部敌人）**

### 1. 【小地图敌点可见性结清（N+53 遗留项）】

blip 剪辑 pointUnitRadar（chid 52，attachMovie 挂到雷达图）的全部脚本只有两帧
`stop()` —— 没有任何可见性/迷雾判断；refreshRadar 也无条件复制全部敌人。
⇒ **原版小地图 = 全情报：所有敌点恒显**。H5 之前的 `isVisible` 过滤是偏离，
已移除（敌点只要活着就在小地图上；主地图的迷雾/视野系统不受影响）。

### 2. 验证（node 冒烟，无浏览器）

- 113 项 `=true`；450 帧 sim 正常（塔 15/15 / lost=false）；`node --check` 通过

### 3. 本轮仍未做（如实记录）

- blip 的逐帧定位器（读 radarE[i]._x 的雷达显示循环）所在 clip 未定位（不影响 H5：
  位置本就实时绘制）
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器覆盖率 / 真机听感（均搁置）

## 第 N+53 轮成果（2026-09-28, H5 领土防御·雷达快照 refreshRadar 1Hz + noTarget 结清）

**（权威 = 327 pcode 的 refreshRadar / noTarget 函数体逐行解码）**

### 1. 【noTarget(side) 结清（N+51 遗留）】

解码：`return (side==X) ? iFirstAlly : iFirstEnnemy` —— 即"首个存活单位槽位索引"
（getFirstEA 每 200ms 维护，removeUnits 把死槽位置 "null" 的扫描起点优化）。
H5 无死槽结构（全扫 + hp 过滤），**行为等价，以解码记录结清**。

### 2. 【★ 雷达快照：小地图点集每 1s 重建 + radar/radarMobile 排除】

refreshRadar（setInterval 1000ms）逐行解码：重建 unitsEnnemiesRadar/unitsAllieesRadar
两个**引用数组**，排除 `type=='radar'` / `'radarMobile'` —— **雷达塔与 radarMobile
不上小地图**。快照存引用 → blip 位置实时（无滞后）；滞后的只是成员增删
（新出生 ≤1s 才出现在小地图；死亡因 removeUnits 即删 ptRadar 而立即消失）。

H5 实现：`refreshRadar()`（radarA 排除 radar 塔；radarE 按 type 字面排除）+
tick 内 1Hz 快照计时；drawMinimap 改从快照绘制（radar 塔的青色特殊点删除）。
保留 H5 的迷雾可见过滤（原版 blip 自身的可见性规则需 radar 显示 clip 的脚本佐证，
未逐行核，如实记录）。

### 3. 验证（node 冒烟，无浏览器）

- `雷达塔排除出小地图=true (radarA=1)`、`camion3(radarMobile武器) 在点集=true`、
  `type=='radarMobile' 字面排除=true`、`快照后新出生不在点集=true → 下次刷新进入=true`
- 113 项 `=true`；450 帧 sim 正常（塔 15/15 / lost=false）

### 4. 本轮仍未做（如实记录）

- 小地图敌点的迷雾可见过滤是 H5 自有设计（原版 blip 可见性未逐行核）——保留现状
- m26 edithStart 音乐 / 容器 bbox 炮管外扩 / 画质档 / 多 chid 合成器覆盖率 / 真机听感（均搁置）

## 第 N+52 轮成果（2026-09-28, H5 领土防御·复刻僵尸锁定开火 — N+51 遗留项）

**（权威同 N+51：174 OCEEF 超保持半径分支只重排轮询、不清 target）**

### 1. 【实现】

- 玩家塔与敌方单位两侧：解锁条件收窄为**仅死亡/到达/移除**（原版 `target._parent ==
  undefined` 语义）。目标超 0.6×/0.8× 保持半径乃至超 100% 射程都**保持锁定继续开火**
  （原版 OCEEF 开火路径无距离门），轮询到期（≤500ms）才按 ≤100% 重取或置空。

### 2. 验证（node 冒烟，无浏览器）

- `超 100% 射程: 僵尸锁定继续=true → 轮询到期置空=true`（玩家塔侧）
- `敌方 0.85× 保持锁定=true → 超 100% 僵尸锁定=true → 轮询到期置空=true`
- 其余索敌断言无回归；109 项 `=true`；450 帧 sim 正常（塔 15/15 / lost=false）

### 3. 本轮仍未做（如实记录）

- noTarget(side) 起始索引未逐行对齐（行为等价：全扫取最近）
- m26 edithStart 音乐 / 容器 bbox 炮管动态外扩 / 画质档 / 多 chid 合成器覆盖率 24% / 真机听感（均搁置）

## 第 N+51 轮成果（2026-09-28, H5 领土防御·炮塔索敌规则对齐原版 getTarget）

**（权威 = DefineSprite_174/frame_1/PlaceObject2_173_1 的 getTarget/getDistance/noTarget
pcode + OCEEF 保持检查 + porteeAcq 初始化 loc16b5/loc16c4）**

### 1. 【原版索敌模型（逐段解码）】

- **获取**：`setInterval(getTarget, 500)` —— 每 500ms 扫一次，取**最近且 ≤ 射程(100%)** 者；
  获取成功后 **clearInterval + blockInterval=true → 停止轮询**（锁定期间出现更近的敌人也不切换）
- **解锁**（getTarget 末尾）：目标距离 > distanceOfFire → target=null（另有死亡/移除）
- **保持半径**（OCEEF 每帧）：距离 > 射程 × porteeAcq 时**并不清 target**，而是
  **重新 setInterval(getTarget,500) 恢复轮询** —— 旧目标继续挨打直到下次轮询按 ≤100% 重取
  （同一目标仍在 100% 内就再锁上）。porteeAcq：**ally 塔 0.6 / ennemy 单位 0.8**
- **战场边界**：获取时跳过 `_x<0` 或 `_y>477` 的目标 —— **舰船在海上（e1 x=−182）、
  南口 y>477 的出生堆叠单位不可索敌**
- **对空**：目标为直升机 (chassis=="tigre") 时只有 **crotale / m60 / gatling** 三型可打

### 2. H5 修正（Turret.update 与 Unit.update 两处）

- 每 tick 全扫 → **500ms 轮询 + 锁定后停轮询**（粘滞：更近新敌人不切换）
- 保持半径语义修正为"恢复轮询而非弃标"（初版实现误做 0.6× 硬弃——会错杀 0.6-1.0×
  环带的持续火力；重读 OCEEF 分支后纠正）
- 补 `y>477` 获取过滤（原有 x<0）；敌方目标的移除检测 (`!G.turrets.includes(target)`)
  对应原版 `target._parent==undefined`
- AA 三型表 H5 `AA_WEAPONS=['m60','gatling','crotale']` 与原版逐字一致 ✓（U 升级是
  用户确认的基准扩展，保留）

### 3. 验证（node 冒烟，无浏览器）

- 新增 7 项断言全绿：0.5× 获取 / **锁定期间不切换（0.1× 新敌人也不换）** / 0.6-1.0×
  环带恢复轮询但保持锁定 / 轮询重取同一目标 / 超 100% 解锁 / y>477 不可获取 /
  敌方 0.85× 保持锁定 → 超 100% 解锁
- 109 项 `=true`；450 帧 sim 正常（击杀 14 / 塔 15/15 / lost=false）

### 4. 本轮仍未做（如实记录）

- 原版解锁后 ≤500ms 内仍朝旧目标开火（OCEEF 无开火距离门）的"僵尸锁定开火"未复刻
  （H5 在 >100% 时立即停火；差 ≤500ms 的尾焰，视觉影响极小）
- getTarget 的 noTarget(side) 起始索引优化未逐行对齐（行为等价：都是全扫取最近）
- m26 edithStart 音乐 / 容器 bbox 炮管动态外扩 / 多 chid 合成器覆盖率 24%（均搁置）

## 第 N+50 轮成果（2026-09-28, H5 领土防御·解锁计划全表审计一致 + 补 m25 奖金 2400）

**（权威 = DefineSprite_834/frame_1/PlaceObject2_773_189 的 newEvents 事件表（池 41 目全解）
+ frame_6/333 load 的 unlocker 初始态与 weaponsToUnlock 队列）**

### 1. 【原版解锁机制全貌（newEvents 按 mR=任务号分派）】

- **事件自动解锁**：m7→canon75、m11→canon105（含 cookie 三开关判定）、m16→canon105D、
  m27→radar、m31→su37；解锁后菜单 constructionCont 跳到对应项
- **二选一面板**（showPanelForUnlock）：m18/20/27/31/37/39；可选项 = weaponsToUnlock 队列
  `["crotale","canon125","MLRS","MTHEL","pluton"]`（iUnlock 递增）或 interest+3
- **m25 奖金**：`master_menuItems.euros += 2400`（navire 战前）
- **m26**：bgSound gotoAndPlay("edithStart")（直升机波音乐）；**m44**：master_sounds.Yamato(0)
- 初始 unlocker：仅 m60+gatling，其余全锁（含 su37）—— H5 G 初始化逐字一致 ✓

### 2. 【审计结论：三张表早已对齐，唯一缺口 = m25 奖金】

- `AUTO_UNLOCK = {7:canon75, 11:canon105, 16:canon105D, 27:radar, 31:su37}` ✓
- `WEAPONS_TO_UNLOCK = [crotale, canon125, MLRS, MTHEL, pluton]`（顺序敏感）✓
- `PANEL_WAVES = [18,20,27,31,37,39]` ✓
- **补实现**：endWave 在计息**之前**给 nextWave==25 加 2400 —— 原版 953 时序是 frame_2
  调 events()（+2400）→ frame_30 才 giveIntrest()，即**奖金也吃当波利息**（1000+2400 →
  floor(3400×1.06)=3604）

### 3. 验证（node 冒烟，无浏览器）

- `WEAPONS_TO_UNLOCK 顺序与原版 333 一致=true`、`AUTO_UNLOCK 波次表一致=true`、
  `PANEL_WAVES 波集一致=true`
- `m25 奖金: 1000 → 3604 (期望 3604)=true`；`无奖金对照 (第25波清场): 1000 → 1060=true`
- 103 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- m26 edithStart 音乐切换（H5 BGM 三段已有映射，"edith" 段对应哪首未逐一对号，归入
  真机听感搁置项）；m44 Yamato 音效调用未建模（H5 已有终波 bgm_alt 切换近似）
- 容器 bbox 炮管动态外扩 / 画质档（N+49 遗留，维持）
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+49 轮成果（2026-09-28, H5 领土防御·keyDown 全面审计 — G 键身份澄清 + 塔重叠改原版 bbox 判定）

**（权威 = frame_6/PlaceObject2_6_1 onClipEvent(keyDown) 全文逐行 + 822/86 画布实测）**

### 1. 【keyDown 全键位逐行审计 — 除一项外全部已对齐】

| 键 | 原版行为 (逐行) | H5 状态 |
|---|---|---|
| 方向键 | keyPressed/keyPressedS 双槽 + decalMap | ✓ |
| H | afficheEtat 血条开关 + menuHealth on/off | ✓ |
| M | mouseScroll 开关 | ✓ |
| 空格 | depressSpace() | ✓ |
| R | barreReparation.base.repairIfCan()（需修理条可见） | ✓ |
| **S** | **卖出价 = floor(etatC/etatM × (price×0.75))** + destruction() | ✓（`sellPrice()` 已是同式） |
| G | 见下节 | ✓（39% 全图已有） |
| Q | changeQuality()（Flash 画质档） | N/A（canvas 无画质档，如实） |
| C | surfaceForBuild._alpha 0↔35 | ✓（N+48） |

### 2. 【★ G 键身份澄清：原版"zoom"就是 39% 全图，N+48 的"2x 缩放"注记有误】

keyDown 83-121 行：G 键 `carte._xscale=39; _yscale=31.7; _x=0; _y=452` + realposmap 记忆 +
血条 ×200 补偿 + `zoneDezoom` 全图接点击 —— **这就是 H5 已有的 G 全图(39%)**。
`surfaceForBuildZoom`(dpt562) 只是 39% 视图下 768 掩码的 _root 副本（Flash hitTest 需要
同坐标系的 clip）；H5 的世界坐标掩码天然覆盖任意缩放视图，**无需单独建模，该项关闭**。
（G 模式下 H5 可正常建塔：鼠标→世界换算与掩码判定均与 zoom 无关。）

### 3. 【★ 塔重叠层从 26px 半径改为原版 bbox 相交】

原版 `this.hitTest(unitsAlliees[i])`（无 shapeflag）= **bbox 相交**：
viseur(822) 画布 40×40（±20）+ 塔容器 86 库结构画布 76×76（±38）→
**|dx|<58 且 |dy|<58 拒绝**。旧 26px 半径明显偏松（原版塔不能密集堆叠）。
注：Flash 容器 bbox 随炮管朝向动态外扩（基座是下限），H5 取基座 bbox，如实记录。

### 4. 验证（node 冒烟，无浏览器）

- `bbox 边界: (57,0)=false (59,0)=true (0,57)=false (0,59)=true (期望 f,t,f,t)=true`
- `地块内 58px bbox 有塔 → false`；既有掩码/样点断言无回归
- 98 项 `=true`；450 帧 sim 正常（击杀 14 / 塔 15/15 / lost=false）

### 5. 本轮仍未做（如实记录）

- 容器 bbox 的炮管动态外扩未建模（基座 bbox 是原版判定的下限）
- Flash 容器质量档（Q 键 changeQuality）对 canvas 渲染无对应物，不建模
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+48 轮成果（2026-09-28, H5 领土防御·可建区判定改原版 768 手描地块掩码 —— N+12 悬案告破）

**（权威 = 834/frame_1/PlaceObject2_822_226 on(press) + SWF 位流解码的 768 放置矩阵 +
FFDec SVG/cairosvg 栅格化 + keyDown C 键处理器）**

### 1. 【★ N+12 悬案告破：768 放置矩阵解码错误是失败根因】

- 直接从 SWF 位流解出 `surfaceForBuild`(chid 768, dpt 3) 的 PlaceObject2 矩阵：
  **a=d=1.00003, tx=166.1, ty=−18.1**（N+12 当时用的 ty=391.5 是错值，导致一切对齐失败）。
  映射：`u = (wx−166.1)/1.00003 + 156.8; v = (wy+18.1)/1.00003 + 1411.95`
  （后者是 FFDec SVG root 平移）。掩码画布原点世界坐标 = (9.31, −1430.09)。
- **语义修正**：768 不是"道路缓冲带"，是**设计师手描的若干块可建地块**（可视化证实：
  道路在地块之间的暗带里，地块内还有方形/圆形孔洞 = 障碍物）。原版放置 =
  `surfaceForBuild.hitTest(x,y,true)` 像素级形状测试 —— 即"只能在这几块地里建"。

### 2. H5 实现（替换 45px 道路缓冲近似）

- `assets/build_ui/surfaceForBuild.png`：cairosvg 栅格化 768 白形（1838×1730，可建像素 24.7%）
- `buildMaskHit(wx,wy)`：掩码 alpha 查表 ≡ `hitTest(x,y,true)`；浏览器 Image→canvas 惰性建，
  测试经 `setBuildMaskData()` 注入同一 PNG 的解码结果
- `buildAllowedAt` = 塔重叠层（26px，原版 viseur↔塔 clip hitTest 的近似，如实）+ 掩码层；
  钱的检查仍在调用方（原版同序）。删除 `roadBlocked` 与重复定义的 `buildAllowedAt`/`repairPrice`
- C 键显示：直接铺真实掩码（白，alpha 0.35；C 键处理器 142-149 行 `_alpha 0↔35` 权威），
  不再是 90px 红描线

### 3. 验证（node 冒烟，无浏览器）

- `掩码画布原点世界坐标=(9.30, -1430.09) 一致=true`
- `路中心采样可建率=2.8% (4/141)`（手描容差，与 python 端 1.7% 同量级）
- `地块内部 (847.3,-67.1)/(1238.3,-472.1)=true`；`路点[599,87]=false`；
  `地图外草地[1600,400]=false`（旧行为是 true —— 现在与原版一致：地块外不可建）
- `地块内 26px 有塔 → false`；97 项 `=true`；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- 塔重叠层保持 26px 半径近似（原版是 viseurConstruction(822) 与 178_etat 容器的 bbox
  hitTest，容器尺寸随塔型/炮管变化，精确复现需逐型 bbox，收益低）
- `surfaceForBuildZoom`（PO3, dpt562）属原版 2x 缩放视图（menuZoom），其矩阵在缩放视图
  坐标系；H5 无 2x 模式，未建模
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+47 轮成果（2026-09-28, H5 领土防御·失败判定审计一致 + 倒计时条可点击跳过 + interwave 补全长）

**（顺 N+46 遗留两项计时量化做收尾审计；权威 = 428_unit changeCheckpoint pcode +
frame_6/PlaceObject2_1176_624 on(press) + 327/329 池映射）**

### 1. 【漏怪/失败判定链路审计 —— H5 与原版一致，零改动】

- 428_unit 的 `changeCheckpoint`（常数池全 74 目解码）：
  `curIPoint++` 后 `if (curIPoint >= checkpoints.length) master_scenario.activePerdu()` ——
  **一辆车越过最后路点（r10 基地）即立刻判负**（activePerdu → perdu 界面 + pauseMusic + aPerdu=true）。
- H5 现状 `u.reached → dead + losses++ + G.lost=true`（tick 早退冻结）—— 语义一致，无需改动。
- 327 的 `activePerduViaInterval`（4s 延迟变体）：函数体只出现在定义处，全库无调用点 ——
  原版死代码，H5 不建模，结清。

### 2. 【★ 新发现：1176 倒计时条也有 on(press) —— 原版可点击跳过倒计时】

`frame_6/PlaceObject2_1176_624 on(press)`：守卫 → 条移出屏（offscreenY=-900）→
`instructions.haloNoir.gotoAndStop(1)`（停掉 953 调度时间线）→ `creationUnite` 音效 →
`master_scenario.startMission()`。即**非简报波的 "start in N" 条同样可点击，点了立即开波**。

H5 实现：`briefBarPress()` 统一入口（简报态 → briefingGo；数字态且 !waveActive/!panelOpen →
收条 + creationUnite + startWave）；条 CSS 两种状态都 pointer。

### 3. 【interwave 补全长：281 → 317 tick】

haloNoir(953, 实例在 instructions 内) 从清场后播 f1→f183 = 182 帧@24fps = 7.583s（此前只算了
f30→f183 的 6.375s，漏掉 f1→f30 的 1.2s）。合计 3000 + 7583 = 10583ms = **317 tick**
（3s 轮询量化维持不建模，确定性近似）。倒计时数字段仍为最后 168 tick。

### 4. 验证（node 冒烟，无浏览器）

- 新增断言全绿：`倒计时点条跳过 (1176 on press) → 第10波开启=true`、
  `INTERWAVE_TICKS=317=true`；既有简报/倒计时/路线断言无回归
- 94 项 `=true`；450 帧 sim 正常（击杀 14 / 塔 15/15 / lost=false）

### 5. 本轮仍未做（如实记录）

- 3s 轮询量化不建模（已明确为确定性近似，结清不再列）
- haloNoir 由 startInstructions 重启的精确调用语句未逐行解出（329 巨型池解析受限）——
  对 H5 无影响：interwave 总长只依赖 3000ms + 182 帧，两者均已钉死
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+46 轮成果（2026-09-28, H5 领土防御·简报暂停波 "start mission" + "start in N" 倒计时条）

**（N+45 遗留第一项。权威 = DefineSprite_953 frame_30 DoAction + frame_6/PlaceObject2_1106_548
on(press) pcode + FFDec 导出 chid1106/1176 原版像素）**

### 1. 【权威解码：原版波间两种出兵条】

- **953 frame_30**：`im != 1 → giveIntrest()` 后分两支 —— 波 **1,5,9,11,15,16,19,26,31,37,41,44**
  显示 `startMissionPause`(chid1106) 于 y=400 且 **953 自身 gotoAndStop(1)**（时间线冻结，等点击）；
  其余波显示 `startMissionDelay`(chid1176) 并走倒计时。
- **1106 on(press)**（逐字 pcode）：守卫 → 卡片移出屏（offscreenY=-900）→
  `creationUnite` 音效 → **`master_scenario.startMission()` 直接开波**。
- **chid1106** = 125×35 黑条白字 "**start mission**" 按钮；**chid1176** = 同尺寸 10 帧，
  f1="start mission"、f2..f9="start in 8..1"、f10 空帧（953 frame_183 开波时 gotoAndStop(10) 隐藏）。
  953 f47..f166 每 17 帧@24fps 调 `startMissionDelay.gotoAndStop(2..9)` 驱动数字。

### 2. H5 实现

- `BRIEFING_WAVES = [1,5,9,11,15,16,19,26,31,37,41,44]`（953 frame_30 逐字）
- `briefingShow()/briefingGo()`：简报波清场后显示 "start mission" 原版 PNG 条（舞台 y=400 居中，
  可点击）；点击 → 守卫 → `creationUnite` 音效 → `startWave()`（对应 on(press) 三步）
- 非简报波：interWave 倒计时最后 168 tick（8×21，21=17帧@24fps）显示 "start in 8..1" 原版
  PNG 数字条，开波时收条（对应 f183 gotoAndStop(10)）
- `endWave`/`closeUnlockPanel`：下一波 ∈ BRIEFING → 简报暂停（31/37 两波与二选一面板重叠：
  先面板后简报）；**开局即显示**（原版第 1 波就是暂停波，不再 120 tick 自动开波）
- 素材：FFDec 导出 1106/1176 → `assets/briefing/start_mission.png` + `start_in_1..8.png`

### 3. 验证（node 冒烟，无浏览器）

- 新增断言全绿：`BRIEFING_WAVES 与 953 frame_30 暂停列表一致=true`、
  `第4波清场 → 简报暂停 true/mission=true`、`点击 → 第5波 7 单位即时入场=true`、
  `非简报波进倒计时 interWave=281=true`、`倒计时数字 169→8 / 2→1=true`、
  `面板关闭接简报(下一波31)=true`；boot 行 `briefingGo 生效 第1波单位=9`
- 93 项 `=true`；450 帧 sim 正常（击杀 14 / 塔 15/15 / lost=false）

### 4. 本轮仍未做（如实记录）

- countUnitsEnnemies 每 3s 轮询的 0~3s 量化未建模（上一轮遗留，维持）
- 953 f1→f30 段（开条前 ~1.2s）未单独建模（并入 281 tick 的取整，实际 9.4~10.6s vs H5 9.4s）
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+45 轮成果（2026-09-28, H5 领土防御·波次路线/出兵模型/波间节奏对齐原版）

**（新子系统审计：missions/unitsMissions 波次数据 + startMission 出兵链路。
权威 = deobf/data/missions.json + frame_6/329 pcode + DefineSprite_953 逐帧 DoAction）**

### 1. 【★ 16/44 波进攻路线错误：H5 在猜，原版是显式表】

- unitsMissions 每波外层数组第二元素就是路线（missions.json `waves[i].route`）——
  逐波显式给定，不是规则推导。
- 旧 `guessRoute`（舰→p4 / 直升机→p3 / 其余 wave%3→p2 否则 p1）与原版 **16/44 波不一致**
  （第 6 波应 p1 猜成 p2、第 8/14/23/29/41/43 波应 p2 猜成 p1 等）。
- 修正：data.js 新增 `WAVE_ROUTES`（44 项逐字照抄 missions.json），startWave 改用显式表。
  路线方向佐证：parcourt1 begin(126,580)→r10(93,-1563) 向北行进。

### 2. 【★ 出兵模型：H5"逐个 40 tick 滴流" → 原版"整波一次性生成 + y+=60×j 堆叠"】

startMission pcode（frame_6/329, loc03e6..loc0533）解码：

- **同步 for 循环一次 createUnit 全波，无任何逐个延迟**（H5 旧 spawnQueue delay+=40 是自造）。
- 出生点 = route[0]（checkpoints 首点），`ypos += j×60`（register5×60×register6）纵向堆叠；
  x 偏移项 register7 仅当 `wave[r3].length==13`（parcourt2 路点数）且 iUnitsE==0 时为 1，
  而 createUnit 每建一个单位 iUnitsE++，第 3 波起恒 >0 → x 偏移实战恒 0，统一 `y+=60j`。
- 与车队制动自洽：60px 出厂间距 > camion1 车高 42.2px → 列队出发不触发制动，与 N+41/42 的
  刹停滑行 40.7px < 42.2px 证明链互洽。
- H5 修正：startWave 立即 `new Unit` 全波，`y = route[0][1] + 60*j`，依次互链 devant；
  删除 spawnQueue/spawnTimer/guessRoute；tick() 出兵分支只剩清场判定。

### 3. 【波间节奏量化】

- 清场 → `activeDeclencheur = setInterval(declencheMissionSuivante, 3000)`（327 pcode）
  → startInstructions → 953 倒计时 f30→f183 = **153 帧@24fps = 6.375s** → frame_183 调
  `master_scenario.startMission()`。合计 ≈ 9.4s = **281 tick@30fps**（H5 旧 200）。
- giveIntrest 复核一致（953 frame_30 + 329 pcode）：`euros = floor(euros×(1+interest/100))`，
  im!=1 才给；H5 已实现，未改。

### 4. 验证（node 冒烟，无浏览器）

- 新增断言全绿：`WAVE_ROUTES 44 波与 missions.json 逐波一致=true`、
  `旧猜错波抽查 6p1/8p2/9p1/14p2/23p2/43p2/44p4=true`、
  `整波即时生成 9/9=true`、`出生点 route[0] y+=60j 全对 / x 全对=true`、
  `车队链表 首车devant=null 后车互链=true`、`INTERWAVE_TICKS=281=true`
- 450 帧波次 sim 正常（第 1 波 9 车一次入场成列，击杀 14 / 塔 15/15 / lost=false）
- 顺带修复一处**过期诊断**（stash 对照确认在 N+44 基线就已是 false，非本轮回归）：
  "塔头与车体解耦 |tRot−rot|>1.0" 在 N+39 移动模型改版后失效（车体沿路点转向后与塔头
  方位相近），改为打印 tRot/rot 实际值 + 世界方位收敛残差判据（0.0352 < 0.06）

### 5. 本轮仍未做（如实记录）

- 原版 953 frame_30 的 `startMissionPause`（波 **1,5,9,11,15,16,19,26,31,37,41,44** 点击暂停，
  疑似简报/剧情停顿）与 H5 的二选一面板 `PANEL_WAVES=[18,20,27,31,37,39]`（源自解锁事件）
  是两套机制；H5 未实现"简报暂停"，波号集合也未对齐 —— 待议
- countUnitsEnnemies 每 3s 轮询引入的 0~3s 量化未建模（波间实际 9.4~12.4s，H5 取 9.4s）
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+44 轮成果（2026-09-28, H5 领土防御·MTHEL 激光即发即中 + 光束特效）

**（N+43 遗留项第一项：laser 即发即中链路解码 —— 本轮完整解出并实现）**

### 1. 【权威解码：obus frame13 的 chid399 load】

```
distance = round(parent.distance) - parent.decalY   // 光束长度 = 目标距离 - 炮口前推
puissance / portee / target 从 parent 取
this._height = distance                              // 光束拉伸到目标距离
if (target._x != undefined)
    fireOnEnnemi(target._x, target._y, portee, puissance, side)   // 同帧结算伤害
this.gotoAndPlay(2)                                  // 之后只播光束动画
```

⇒ **MTHEL 激光 = 即发即中（hitscan）**：无飞行过程，开火同帧对【锁定的目标位置】
结算伤害；光束长度 = 目标距离 − decalY(10)。

### 2. 【连带发现：SHELL_KIND 映射错误】

原版 sprite83 调 `createObus("laser", ...)`，obus 帧 13 的标签也是 `laser`。
H5 的 SHELL_KIND 把 MTHEL 映射成了 `'obusLeger'` —— 音效、弹速、飞行全错。
已改为 `MTHEL: 'laser'`。

### 3. H5 实现

- `spawnShell`：laser 分支 → 构造伪 shell 直接 `shellHit`（当帧结算溅射/伤害），
  同时 `G.beams.push({muzzle 位置, ang, len = 距目标距离, life:12})`，**不产生飞行弹**
- 光束绘制：从炮口沿炮管角拉伸 `len`，外层 #8cf 7px + 内芯 #fff 2.5px，随 life 淡出
- `G.beams` 生命周期 12 tick（chid399 光束动画帧数近似）

### 4. 验证（node 冒烟）

- `激光即发即中: 目标当帧掉血=120 (=MTHEL 单发威力) > 0=true`
- `无飞行弹 (shells=0)=true, 光束特效=1`
- `光束长度=290.0px (期望 290 = 目标距离 300 − decalY 10, 原版公式) 一致=true`
- `光束 12 tick 后消失=true`；81 项断言全绿；450 帧 sim 正常

### 5. 本轮仍未做（如实记录）

- 原版弹道锁定开火瞬间距离直线飞行 vs H5 追踪当前目标（维持现状，已有注释）
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+43 轮成果（2026-09-28, H5 领土防御·弹速/加速度模型对齐原版）
## 第 N+43 轮成果（2026-09-28, H5 领土防御·弹速/加速度模型对齐原版）

**（新子系统审计：弹道飞行。权威 = obus 各帧 DoAction 的 vitesse/acc，乱码行亦解出）**

### 1. 【★ 弹速慢 5 倍 + 加速模型缺失】

原版 obus 弹速表（各帧 DoAction，音效交叉佐证弹型）：

| obus 帧 | 弹型 | vitesse | acc | 音效 |
|---|---|---|---|---|
| f1/f2/f3 | obusLeger/Moyen/Lourd | 50×fpsc | 50×fpsc | c75mm/c105mm/c125mm |
| f4/f5-f7 | bullet/bulletLourde | 50×fpsc | 50×fpsc | m60/gatling |
| f8 | missile (crotale) | 50×fpsc | **1×fpsc** | crotale |
| f9 | missile2 (MLRS) | 50×fpsc | **1×fpsc** | mlrs |
| f10 | missile3 (pluton) | **40×fpsc** | **0.05×fpsc** | pluton |
| f11 | missileUnder | **40×fpsc** | 1×fpsc | crotale |
| f12 | missileUnderSu37 | 40×fpsc | 40×fpsc | — |
| f13 | laser (MTHEL) | stop() 即发即中 | — | — |

通用弹速 = 50×1.13 = 56.5 px/帧@24 = **1356 px/s**。H5 旧实现 `speed: 9` px/tick =
270 px/s —— **慢 5 倍**；导弹类的慢加速起步（curVitesse 初值 = acc，逐帧 +acc 封顶）
完全没建模。

### 2. H5 修正

- 新增 `SHELL_SPEED` 表（6 型，按上表 ×0.8 换算 px/tick@30）：
  通用 45.2/45.2；missile/missile2 45.2/0.904；missile3 36.2/0.0452；
  missileUnder 36.2/0.904
- `spawnShell` 按 `SHELL_KIND[turretId]` 带 v/acc；shell 记录 `curV`（初值 = acc）
- 更新循环对齐原版 enterFrame **时序**：先以 curV 移动（step = min(剩余, curV)），
  再 `curV += acc` 封顶 vmax；命中判定 `d <= curV`
- laser (MTHEL) 以通用速近似（原版 frame13 stop() 即发即中的完整链路未解码，如实记录）

### 3. 验证（node 冒烟）

- `弹速表 6 型与 obus DoAction 一致=true`
- `通用弹速=45.20 px/tick (1356 px/s; 旧实现慢 5 倍)`
- `missile 慢起步: 首帧移动 curV=0.904 (=acc)`
- 77 项断言全绿；450 帧波次 sim 正常（击杀 14 / 塔 15/15 / lost=false）

### 4. 本轮仍未做（如实记录）

- laser (MTHEL) 的即发即中链路（frame13 stop 后伤害如何结算）未解码，H5 用飞行弹近似
- 原版弹道按【开火瞬间锁定距离】直线飞行，H5 保持追踪当前目标位置的简化 —— 已有注释，
  维持现状（对玩家手感影响：原版打提前量，H5 必中移动靶）
- 多 chid 合成器覆盖率 24%（暂缓）；真机目视/听感（搁置）

## 第 N+42 轮成果（2026-09-28, H5 领土防御·车队减速改为原版渐近步长 + 硬停）
## 第 N+42 轮成果（2026-09-28, H5 领土防御·车队减速改为原版渐近步长 + 硬停）

**（N+41 遗留项：减速曲线从"钳到前车速度"近似改为原版的渐近步长语义）**

### 1. 【原版语义（N+41 常数池解码的落地）】

roule 解码公式：`if (dist < unitDevant._height) { sin -= 1/14 × CONST_ELOIGNEMENT 每帧;
低于阈值硬停 }`。

- 步长：`1/14 × 1.8 = 0.1286 px/帧@24` → ×0.8 = **0.1029 px/tick@30**（无 fpsc 因子）
- 硬停：速度 < 0.1 → 0
- **常数自洽性验证**：从巡航 2.8928 px/tick 刹停滑行 v²/2a = **40.7px < 间距 42.2px**
  —— 原版常数精确自洽（刚好刹在前车渲染高度内），这是"这套参数是原版真实参数"的
  又一独立证据

### 2. H5 修正

- 车队制动从"速度钳到前车"改为 `v = max(0, v − 0.1029)` 每帧 + `<0.1 硬停`
- 移除"钳到前车速度"（原版无此逻辑——前车只通过触发条件起作用）

### 3. 验证（node 冒烟）

- `减速步长=0.1029 px/tick, 刹停滑行=40.7px (< 间距 原版常数自洽), 硬停用 28 tick`
- `建链/异路null/死亡拆链=true`、`舰间距=150.3px`；76 项断言全绿；450 帧 sim 正常

### 4. 本轮仍未做（如实记录）

- 原版条件里的近停硬停还伴随 `_rotation=0` 的赋值（语义不明，可能是子件指针）——
  未复刻，H5 保持车头朝向
- 多 chid 合成器真值帧覆盖率 24%（暂缓）；真机目视/听感项（搁置）

## 第 N+41 轮成果（2026-09-28, H5 领土防御·常数池解码 —— 车距公式权威解出）
## 第 N+41 轮成果（2026-09-28, H5 领土防御·常数池解码 —— 车距公式权威解出）

**（N+40 遗留项「车距常数精确倍率待从常数池解析确认」—— 本轮解出，纯离线）**

### 1. 【方法：解析 pcode 的 ConstantPool 标签】

pcode 函数体里的 `constantN` 是常数池索引，`ConstantPool` 标签按序列出全部字符串。
逐字符解析出 74 条池目（含 `constant40='unitDevant'`、
`constant42='CONST_ELOIGNEMENT'`），代入 roule 函数体后整段可读。

### 2. 【车距制动权威公式（解码结果）】

```
if (dist < unitDevant._height) {          // 距离 < 前车精灵渲染高度
   _rotation = 0;
   if (sin > 0.1) sin -= 0.07142857 × CONST_ELOIGNEMENT;   // 1/14 × 1.8 ≈ 0.129/帧减速
}
```

**比较长度 = `unitDevant._height`（前车精灵的渲染高度），不是固定常数倍率**：
camion1≈42px、舰≈150px（N+40 的 ×10 标定被更权威的语义替代）。
减速步长 1/14 × 1.8 ≈ 0.129 px/帧（near-stop 时 `_rotation=0` 硬停）。

### 3. H5 修正

- 间距从固定 18/40px 改为 **前车渲染高度**：`|CHASSIS_ART[type].m[3]| × nat[1]`
  （camion1=42.2px、navire=150.3px），制动规则保持"距离内速度钳到前车"
- 冒烟断言同步更新并记录原版公式出处

### 4. 验证（node 冒烟）

- `建链/异路null=true`、`前车制动: 间距=42.2px 距离21.1 → v 2.89→0.00`、
  `舰间距=150.3px`、`死亡拆链=true`
- 76 项断言全绿；450 帧波次 sim 正常

### 5. 本轮仍未做（如实记录）

- 原版减速是"每帧步长 1/14×ELOIGNEMENT"的渐近减速 + near-stop 硬停语义；
  H5 用"钳到前车速度"近似（无穿透效果相同，减速曲线不同）—— 如实记录
- 多 chid 合成器真值帧覆盖率 24%（暂缓）；真机目视/听感项（搁置）

## 第 N+40 轮成果（2026-09-28, H5 领土防御·车队链表 unitDevant/unitDerriere）
## 第 N+40 轮成果（2026-09-28, H5 领土防御·车队链表 unitDevant/unitDerriere）

**（N+39 遗留项第一项。权威依据：frame_6/329 createUnit 建链 pcode +
DefineSprite_428 frame_39 拆链 DoAction + GAME_LOGIC.md B 节）**

### 1. 【原版机制（反编译抄录）】

- **建链**（createUnit，frame_6/329）：第 i 个出场单位
  `unitDevant = unitsEnnemies[i-1]`（首个为 "null"），同时前车 `unitDerriere` = 自己
- **拆链**（frame_39，单位移除时）：`unitDevant.unitDerriere = unitDerriere;
  unitDerriere.unitDevant = unitDevant` 双向摘除
- **用途**（roule）：维持车距 `CONST_ELOIGNEMENT`——常规 1.8、jeep 显式 1.8、
  两台乱码重装单位（navire/Yamato）4（GAME_LOGIC.md："舰 4"）

### 2. H5 实现

- 出兵时建链：同 route 的上一个存活单位即 `devant`（route 引用相同即同队）
- 移动中制动：前车存活且距离 < 间距 → 本车速度**钳到前车当前速度**（不超越不穿透）；
  前车死亡/到达/进入阵亡序列 → 拆链（等价 frame_39）
- 间距取 **1.8×10 = 18px**（舰 40px）——精确倍率无法从混淆 pcode 解出（常数池索引
  未解析），取与车长同量级的标定，如实记录

### 3. 验证（node 冒烟）

- `建链: 同路线后车.devant=前车=true, 异路线=null=true`
- `前车 15px 内制动: v 2.89→0.00 (钳到前车)`
- `前车死亡拆链 (等价 frame_39 unlink)=true`
- 450 帧波次 sim 正常（击杀 14 / 塔 15/15 / lost=false）；冒烟 76 项全绿

### 4. 本轮仍未做（如实记录）

- 车距常数 1.8 的精确像素倍率（×10 为标定值）待从常数池解析确认
- 多 chid 合成器真值帧覆盖率 24%（N+38 遗留，需完整 Flash 渲染器，暂缓）
- 需真机目视/听感的项仍按用户指令搁置

## 第 N+39 轮成果（2026-09-28, H5 领土防御·单位移动/转向模型对齐原版）
## 第 N+39 轮成果（2026-09-28, H5 领土防御·单位移动/转向模型对齐原版）

**（新子系统审计：单位移动。GAME_LOGIC.md B 节 + 428_unit 反编译为权威，
发现两处系统性偏差 + 一个未建模行为）**

### 1. 【★ 单位巡航速度慢一半】

原版：`速度 = chassis[0] × fpsc`（px/帧@24fps）→ camion1 = 3.2×1.13 = 3.616 px/帧 =
**86.8 px/s**。
H5 旧实现：`c[0]*0.45` px/tick@30 = **43.2 px/s** —— 恰为一半（旧注释自承
"×2.2 平衡"的拍脑袋值，并非原版参数）。
修正：`c[0] × FPSC × (24/30)` = c[0]×0.904 px/tick（24fps→30fps 的帧率换算）。

### 2. 【★ 单位转向快 6.4 倍】

原版：`rotateSpeed = chassis[2]`（度/帧@24fps，camion1=3）。
H5 旧实现：`c[2]*0.09` rad/tick = 15.5°/tick@30 = **464°/s**（原版 72°/s）。
修正：`c[2] × (π/180) × (24/30)` = c[2]×0.01396 rad/tick。

### 3. 【炮塔转向快 29%】

原版 174：`rotateSpeed = typeData[0] × fpsc` 度/**每 OCEEF(43ms)** → m60 = 131.4°/s。
H5 旧实现：`w[0]*0.0198` rad/tick = 34°/tick？不——0.0198×30 = 0.594 rad/s = 34°/s
的单位错了，实为 **w[0]×0.0198 rad/tick = w[0]×34°/s**，比原版 26.3°/s 快 29%。
修正：`w[0] × 0.01529` rad/tick（= w[0]×1.13 度/OCEEF ÷ 43ms × 33.3ms）。
玩家塔与敌方单位塔两处同步修正。

### 4. 【开火门控 17° → 原版 3°】

原版 pcode：`abs(_rotation - directionToGet) % 360 > 3 → 不开火`（3° 门）。
H5 旧实现 0.3 rad = 17.2°。两处（玩家塔/敌方塔）均改为 3°。

### 5. 【★ 补建模：转弯减速 vitesseFrein】

原版 roule()：转向中（Δ>3°）速度目标降为 `vitesseFrein = chassis[1]`（1.2~1.8），
直行恢复巡航；速度以 freinVirage 为步长渐变（加减速模型）。H5 旧实现匀速无减速。
已建模：`targetV = 转向中 ? turnSpeed : speed`，`v += clamp(targetV - v, ±turnSpeed)`。

### 6. 验证（node 冒烟，无浏览器）

- `单位巡航速度 8 车型一致=true`（camion1=2.8928 px/tick = 86.8 px/s，原版同式）
- `单位转向 camion1=0.04189 rad/tick（期望 0.04189）`
- `炮塔转向 m60 rs=0.07645 rad/tick 常数一致=true`
- 450 帧波次 sim 正常：`波次=1 击杀=14 塔存=15/15 lost=false`
- 冒烟 74 项断言全绿

### 7. 本轮仍未做（如实记录）

- 原版单位链表 `unitDevant/unitDerriere` 车距维持（CONST_ELOIGNEMENT=1.8，舰 4）——
  H5 用固定 40 tick 出车间隔近似，未建模前车制动传导；影响车队视觉密度
- 多 chid 合成器真值帧覆盖率 24%（N+38 遗留，需完整 Flash 渲染器，暂缓）
- 需真机目视/听感的项仍按用户指令搁置

## 第 N+38 轮成果（2026-09-28, H5 领土防御·SWF 标签流审计 + 多 chid 合成器重导 350 帧）

**（N+37 遗留项「羽流层恢复」—— 本轮用 SWF 二进制标签流做了权威判定，并发现/修复
了真正的缺层问题；纯离线）**

### 1. 【权威判定：直接解析 SWF 逐帧 PlaceObject/RemoveObject2 标签流】

不再依赖 FFDec 的渲染（它的 PNG/SVG 导出都有缺陷），直接从二进制重建每个帧的
显示列表（含持久性）：

| sprite | 重导帧段 | 该段真实显示列表 | 判定 |
|---|---|---|---|
| 80 (pluton) | f2-142 | `{9: chid6}` —— **炮管 depth1 在帧 2 被移除，f143 才放回** | 帧段只有辉光点是对的 |
| 128 (MLRS) | f38-87 | 6× chid6 烟雾点（6 根管 f38 全移除、f88 放回） | 同上 |
| 122/164 | f6-58 | `{1:79, 11:79, 9:6, 19:6}` 双炮管持续存在 | cairosvg 帧已含炮管 ✓ |
| **161** | f2-27 | `{1:79, 9:6}` —— **炮管持续存在！** | ★ 旧合成缺炮管层 |
| 83 | f24-29 | 激光束 chid 82+81（f30 起转辉光 6+5） | ★ 旧合成缺激光层 |

⇒ N+37 的"羽流层"猜测**被证伪**：80/128 的重导帧根本不含羽流（显示列表只有辉光），
FFDec 好帧里看到的大羽流属于**未被动过的原真帧**。真正的缺口在 **161（缺炮管 26 帧）
和 83（缺激光帧）**。

### 2. 【多 chid 合成器（重写）】

旧合成器只认 chid 5/6。重写为通用版：
- 从 SWF 单独导出 chid 5/6/71/72/79/81/82 的 SVG，cairosvg 预渲染成 RGBA 单元
  （含各自 local 原点：79=(7.55,16.05)、5/6=(23,23)、72/71=(0.85,0.7)、81/82=(23.25,23.25)）
- 对每个 FFDec 空白帧：解析帧 SVG 的 root `<g>` × 全部 `<use>` 复合矩阵，
  按**显示列表顺序**逐层 `Image.transform(AFFINE)` + alpha_composite 盖章
- 350 帧全部重合成（80=142, 83=25, 122=53, 128=51, 161=26, 164=53）

### 3. 【渲染器选型（真值帧验证）】

| 渲染器 | 真值帧表现 | 结论 |
|---|---|---|
| cairosvg 全帧 | 122/164 **0.00 均差、100% 覆盖**；但悬挂 defs 帧输出空 | 缺陷帧不可用 |
| rsvg-convert | 更差（122 f30 覆盖率 0%） | 排除 |
| 多 chid 合成 | 结构忠实（与标签流一一对应），但真值帧覆盖率均值 24% | 单元级近似 |
| 混合（cairosvg底+悬挂章） | 让 161 退化（330→54 px），defs 完整性启发式不可靠 | 弃用 |

最终采用**多 chid 合成**：它是唯一与标签流权威显示列表一一对应的方案。

### 4. 终态验证（node + 像素）

- 全库 599+12 帧中仅存 **83 f1** 空白（SVG 无 use，原版该帧显示列表为空，
  静止炮管由 173 整帧提供 —— 原版真实状态）
- 161 f10 = 330 px，FFDec 真值炮管位置覆盖 68%（其余为矩阵漂移+细线双线性损耗）
- 83 f24 激光束 = 429 px（FFDec 自家 f2 激光仅 81 px，束随帧增强合理）
- 冒烟测试全绿；`开火序列全部帧 PNG 有内容=true (15 型)`

### 5. 本轮仍未做（如实记录）

- 多 chid 合成器在真值帧上的覆盖率仅 24%（单元双线性采样对细线/低alpha有损耗，
  且 FFDec 真值含烘焙色彩效果）—— **过渡帧的绝对保真度仍有差距**；
  要彻底解决需自写完整 Flash 渲染器（渐变/色彩变换/混合），远超资源整理范畴
- 需真机目视/听感的项（MLRS 齐射形态、Su37 音效）仍按用户指令搁置

## 第 N+37 轮成果（2026-09-28, H5 领土防御·重导帧渲染一致性验证（真值分类法））
## 第 N+37 轮成果（2026-09-28, H5 领土防御·重导帧渲染一致性验证（真值分类法））

**（N+36 遗留项：350 张重导帧与 FFDec 原版渲染的逐像素一致性比对 —— 本轮完成，
纯离线，并得出明确的误差边界与影响面结论）**

### 1. 【方法：FFDec 重导出做真值分类】

对 6 个 sprite 用 FFDec 重新导出 PNG（确定性输出），与现库逐帧对比分类：
`原真好帧`（FFDec 非空，未动过=真值）/ `重导帧`（FFDec 空但现库非空=本轮产物）/
`仍空`。结果：80=44真值/142重导，83=22/25，122=38/53，128=106/51，
161=20/26，164=38/53。

### 2. 【两条重导路径的误差量化】

- **cairosvg 路径**（268 个真值样本）：122/164 全部样本 **alpha 均差 0.00、
  覆盖率 100%** —— 该路径在同类内容（炮管+辉光节点）上与 FFDec **逐像素一致**；
  80/128/161 的部分闪光帧样本失配（覆盖率 17~52%）。
- **rsvg-convert 对照**：更差（122 f30 覆盖率 0%），排除。
- **PIL 合成路径**：无"SVG 悬挂且 FFDec 原真好"的样本可对照（悬挂帧 FFDec 全空），
  无直接误差界；但其内容仅为 chid 5/6 辉光的矩阵摆放。

### 3. 【失配根因（图像级取证）】

并排渲染 128 f136 / 80 f150：FFDec 真值有大**辉光羽流**，cairosvg 只画出炮管——
FFDec 的 SVG 导出对羽流层描述不完整（不是 cairosvg 的混合模式问题：这些帧无
mix-blend-mode；rsvg 同样画不出）。

### 4. 【影响面判定：视觉关键帧零波及】

- sprite 80 闪光帧 144..186（43 帧）：**0 帧落在重导集**，全为 FFDec 原真渲染
- sprite 128 闪光帧 2..37 + 89..157（105 帧）：**0 帧落在重导集**
- 122/164 的 106 张重导帧：与 FFDec 逐像素一致（上述 0.00 证明）
- 即：重导的 350 帧全部是**过渡/烟雾段**（80 f2-143、128 f38-88、161 f2-27、
  83 f24-48），其中个别帧若因 SVG 欠描述而偏淡，属最低可见度区间；
  玩家看到的开火闪光全部是原版像素。

### 5. 本轮仍未做（如实记录）

- 80/128/161 重导帧里羽流层的进一步恢复：需绕过 FFDec SVG 缺陷（如直接解析
  SWF 的 DefineShape 栅格化，或对不同帧型逐一适配），离线可做但工作量大、
  视觉收益极低（过渡帧），暂缓
- 需真机目视/听感的项（MLRS 齐射形态、Su37 音效）仍按用户指令搁置

## 第 N+36 轮成果（2026-09-28, H5 领土防御·350 张缺陷帧重导 + 开火序列补全至原版全长）

**（接 N+35 遗留项：sprite 122/164 f6-58、128 f38-88、161 f2-27、80 f2-143 等约 350 帧
FFDec PNG 导出空白但内容存在 —— 本轮全部修复，纯离线完成）**

### 1. 【根因：FFDec 两类导出缺陷】

- **PNG 导出**：pattern 填充帧输出全空白（已证：同一帧 SVG 栅格化有 113~5567 实像素）
- **SVG 导出**：部分帧的 `<defs>` 里 `shape0` 定义**整体丢失**（悬挂 `xlink:href="#shape0"`，
  defs 长度仅 657、无位图无 pattern），导致 SVG 栅格化也是空白

### 2. 【两段式重导（纯离线）】

1. **cairosvg 栅格化**：`cairosvg.svg2png(url=帧SVG, output_width/height=现有PNG尺寸)`
   —— 138 帧成功（122/164/128/161/80/83 的 SVG 完好帧）
2. **PIL 手工合成**：对 SVG 里 chid 5/6（46×46 枪口辉光，原点 (23,23)）定义丢失的帧，
   先从 SWF 单独导出 `DefineSprite_6` 本体预渲染成 RGBA 单元，再解析帧 SVG 的
   root `<g>` × `<use>` 复合矩阵，PIL `Image.transform(AFFINE)` 逐枚 source-over 合成
   —— **212 帧**成功

合计 **350 帧修复**。仅存 1 帧空白：sprite 83 f1 —— 其 SVG 本身就是空的（原版该帧
显示列表为空；MTHEL 静止炮管由 173 整帧提供，H5 架构正是 173 底帧+开火叠加），
**属原版真实状态，非缺陷**。

### 3. 【GUN_FIRE_SEQ 补全至原版动画全长】

原版 `gotoAndPlay("fire")`（帧 2）一路播到末帧回卷 frame1(`stop()`)，即动画 =
**帧 2..总帧数**。此前 H5 的表只含"PNG 有内容"的帧（缺省会截断动画尾段）。
现全部补全：80→2..186、83→2..48、122/164→2..91、128→2..157、161→2..46 等
15 型。`fireTicksFor('MLRS')` 24→156，炮管姿态播放时长与原版一致。

### 4. 验证（node，无浏览器）

- 冒烟 73 项断言全绿；`开火序列全部帧 PNG 有内容=true (覆盖 15 型)`
- 连发模型不受影响：`连发帧位表 16 型一致=true`、m60=4 发/gatling=6 发/MLRS=6 发、
  `m60 整轮冷却=1505ms`
- 像素复查：122 f30=112、128 f60=256、80 f100=234、161 f10=54（重导前全为 0）

### 5. 本轮仍未做（如实记录）

- 重导帧与 FFDec 原版渲染的逐像素一致性未比对（cairosvg 抗锯齿与 Flash 略异，
  属渲染器差异而非数据差异）；如需极致对齐可做 alpha 通道直方图比对
- 需真机目视/听感的项（MLRS 齐射形态、Su37 音效）仍按用户指令搁置

## 第 N+35 轮成果（2026-09-28, H5 领土防御·序列缺口修补 + 断言计数器修正 + 纯离线模式）

**（用户指令：核对剩余未对齐项；定时任务改为只做 node 离线验证，禁用浏览器）**

### 1. 【GUN_FIRE_SEQ 序列缺口修补】（PNG 有内容的淡入帧，此前被跳过）

| sprite | 旧序列 | 新序列 | 依据 |
|---|---|---|---|
| 80 (pluton) | 148..186 | **144..186** | PNG f144-147 有内容 (max alpha 17-33) |
| 83 (MTHEL) | 2..21 | **2..23** | PNG f22-23 有内容 |
| 122/164 (crotale 系) | 2,3,4,5,62.. | **..5,59,60,61,62..** | PNG f59-61 有内容 (淡入) |
| 128 (MLRS) | ..37,92.. | **..37,89,90,91,92..** | PNG f89-91 有内容 |
| 161 (crotaleTigre) | 30..46 | **28..46** | PNG f28-29 有内容 |

### 2. 【冒烟断言的 PNG 解码器修正】

旧"开火序列无空帧"断言有 bug：`d.length<200` 直接判空，把合法小 PNG（如 98 的
3×29 帧 ≈88 字节）误报为空白。已用正确的"收集全部 IDAT → inflateSync → 逐行
unfilter → alpha>10"重写；现断言 **15 型序列全部帧 PNG 有内容=true**。

### 3. 【后坐位移离线核对（SVG 帧位矩阵 ty，权威）】

各炮管 sprite 内层子件逐帧 ty 跨度（= 后坐幅度）：
m60=1.8px（振荡）、gatling=纯枪口焰累积、canon75=7.25、canon105=7.15、
canon125=9.4、Yamato460=10.9、MTHEL=19.01、crotale 系=6.9、pluton=5.0。
H5 的 `drawTurretGuns` 直接绘制原版帧 PNG → 后坐量与原版**天然一致**（同一张图）。
此项核对完毕，不再列为未完成。

### 4. 【连发模型数值自洽（离线）】

m60 一轮 4 发×3 伤 / 1505ms = **7.97 伤/s**（原版同式：4×typeData[4]/(floor(40/1.13)×43ms)）。
camion1 血量 160 → 单座 m60 约 20s 击杀，与原版公式完全一致（H5 的 WEAPONS/CHASSIS
表本就逐项抄自 typeData/chassisData，DPS 变化是恢复原版，不是引入偏差）。

### 5. 定时任务已切换为纯离线模式

旧任务（含 browser-use 要求）已删除；新任务每 50 分钟执行，硬性纪律：
只许 `node --check` + `timeout 60 node smoke_test.js`，禁止浏览器。

### 6. 本轮仍未做（如实记录）

- sprite 122/164 帧 6-58、128 帧 38-88、161 帧 2-27、80 帧 2-143 的 PNG 是**真空白**
  （max alpha ≤7），但 SVG 渲染有内容 —— FFDec 对 pattern 填充帧的 PNG 导出缺陷。
  要完全对齐需从 SVG 栅格化重导这些帧（约 300+ 张），本轮未做
- MLRS 连发间隔渐增形态、Su37 音效对号等仍属"需真机目视/听感"项，离线模式无法验证，
  按用户指令搁置

## 第 N+34 轮成果（2026-09-28, H5 领土防御·机枪连发模型 + 弹壳/枪口焰体积修正）

**用户指出：「弹壳体积、机枪射速和原版有显著差异」「m60 是速射几发之后休息，
不是打一发休息；加特林每轮子弹更多」—— 逐条核对源码后全部属实。**

### 1. 【★ 机枪射速：H5 把"一轮速射"做成了"单发+冷却"】

权威依据 —— 各炮管 sprite 的 `frame_N/PlaceObject2_*/onClipEvent(load).as` 里
`createObus` 的**调用帧位**（一次 `gotoAndPlay("fire")` 动画内在多个帧位各生成一发）：

| 武器 | sprite | createObus 帧位 | 一轮弹数 |
|---|---|---|---|
| m60 | 92 | 2, 6, 10, 14 | **4 连发**（间隔 4 帧@24fps=167ms） |
| gatling | 98 | 2, 6, 10, 14, 18, 22 | **6 连发** |
| crotale / navireCrotale | 122 / 164 | 2, 6 | 2 连发 |
| MLRS | 128 | 2, 8, 17, 25, 32, 38 | 6 连发（间隔渐增） |
| 炮类 103/108/125/167、pluton(80)、153、161 | 2（MTHEL=25） | 单发 |

冷却（`askPermissionOfFire` 门控）是**整轮之后**的许可间隔：
`floor(typeData[2]/fpsc)×43ms` —— 原版把 typeData[2]（表中 damage 列）直接当许可计数，
即**伤害越高冷却越长**：m60/gatling=1505ms、canon105≈2451ms、canon125≈5676ms、
MLRS≈18.2s、pluton≈27.4s。单发威力 = typeData[4]（m60 每发 3 伤）。

H5 旧实现：一次许可只 `spawnShell` 一发再等冷却 —— m60 变成 1.5s 一发的"狙击枪"。

### 2. H5 修正

- 新增 `BURST_FRAMES` 权威表（16 型连发帧位，逐帧脚本抄录）
- `startBurst(obj, ...)`：许可时入队（首发立即，原版 gotoAndPlay 直跳帧 2）；
  `tickBurst(obj)`：每帧推进，帧位到点即 `spawnShell`（玩家塔/敌方单位共用，
  玩家塔与敌方 174 控制器本就是同一套 OCEEF）
- 目标中途死亡 → 本轮终止（原版 obus 对死目标自灭）
- 冷却仍由 `fireCooldownMs(w[2])` 在**轮首发**时设定（整轮后进入下一轮）

### 3. 【★ 弹壳体积：漏乘原版放置矩阵缩放】

原版 douille 放置带缩放（obus 帧库 SVG 矩阵）：
- chid 304（炮弹壳）：`m=[-0.318, 0, 0, 0.318]`（f1；f2/f3 为 0.361/0.424）
- chid 391（曳光弹壳）：`m=[-0.185, 0, 0, 0.205]`

H5 旧实现按 1:1 画 107×51 画布 → **弹壳大 3~5 倍**。已按矩阵缩放修正。
枪口焰同理：303 `s=(0.828, 0.891)`、365 `s=(0.17, 0.465)`，旧实现也是 1:1。

### 4. 验证（node 冒烟，无浏览器）

- `连发帧位表 16 型与原版脚本一致=true`
- `m60 一轮连发=4 发 (期望 4, 旧实现=1), 首发立即=true`
- `gatling 一轮连发=6 发`、`MLRS 一轮连发=6 发`、`目标死亡即终止连发=true`
- `m60 整轮冷却=1505ms (原版 floor(40/1.13)×43)`

### 5. 本轮仍未做（如实记录）

- 上一轮遗留的"逐把真机核对后坐力位移"仍未做（本轮按用户要求只读源码+node 验证）
- MLRS 连发间隔渐增（6/7/8/9 帧）已按帧位表生效，但未真机目视核对齐射形态

## 第 N+33 轮成果（2026-09-28, H5 领土防御·还原原版舞台底色 #441100）

### 1. 【权威依据】

原版 SWF header 的 `SetBackgroundColor`（字节 offset 21-23）= `44 11 00` = **#441100**（暗棕）。

**地图外区域确实会被暴露**——像素级验证：取原版 frame6 的一块"亮路面"特征区（区分度大），
在 `map.jpg` 上做模板匹配，得 **avgErr = 0.63**（极佳匹配），推得原版实战相机位于
map y∈[1320, 1920] —— **刚好贴住位图下缘**，即原版视野里确实有地图外部分，
显示的就是这个舞台底色。

### 2. 【H5 旧实现的问题】

`draw()` 开头 `clearRect` → 画布透明，透出 CSS 的 `#000`；`#stage` 背景也是 `#000`。
初始 `cam.y=0` 时可视世界 y 0..600，而地图只覆盖 y **−1440..480** → 底部 **120px 越界**，
原版是暗棕、H5 是纯黑，观感不符。

### 3. 修正

- 新增 `STAGE_BG = '#441100'`；`draw()` 开头先填满该色再画地图
- `index.html` 的 `#stage` 背景同步改为 `#441100`

### 4. 真机验证

- 冒烟测试新增：`STAGE_BG=#441100 (原版 SWF header 字节 44 11 00) 一致=true`、
  `地图覆盖世界 y [-1440, 480]; 初始视野 y 0..600 → 底部越界 120 px`
- 真机实测越界带像素 `(22,11,2)` = 底色经迷雾压暗后的值（不再是 `(0,0,0)`），
  截图确认底部呈棕色而非纯黑

### 5. 本轮仍未做（队列下推，如实记录）

- 「每种武器都有后坐力」：`GUN_FIRE_SEQ` 已覆盖 23 种武器的炮管开火序列，
  但**未逐把真机核对**后坐位移方向/幅度与原版一致（目前只验证了序列长度 > 0）

## 第 N+32 轮成果（2026-09-28, H5 领土防御·弹壳分两系）

**（继续盘点"抛弹壳"细节）**

### 1. 【★ 发现：曳光弹抛的是炮弹弹壳】

原版 `DefineSprite_400_obus` 各帧的弹壳子件（FFDec SVG 逐帧导出，权威）：

| obus 帧 | 标签 | 弹壳 | 矩阵 |
|---|---|---|---|
| f1/f2/f3 | obusLeger / obusMoyen / obusLourd | **chid 304** | f1 `t=(-3.1,-5.881) s=0.318` |
| f4–f7 | bullet / bulletLourde / *Under | **chid 391** | f4 `t=(-1.694,-2.449) s=0.205` |

两系**画布同为 107×51 / 29 帧**，但逐帧位移不同（MD5 实测 **26/29 帧不同**）。
`assets/casing_bullet/`（391）素材虽早已导出就位，**却从未被代码引用**。

### 2. H5 修正

- `CASING_FRAMES`（304）与 `CASING_BULLET_FRAMES`（391）两套帧表
- casing 记录 `bullet` 标志（复用 `MUZZLE365_KINDS`：曳光弹类）
- `casingFrame(c, fi)` 按标志分流

### 3. 真机验证

- 冒烟测试新增：`弹壳两系: 曳光弹→391=true, 炮弹→304=true (帧表 304=29 / 391=29)`、
  `casingFrame 分流正确=true`
- 真机实测：两套帧表各 29 帧、`casingFrame` 返回不同对象、29/29 `src` 不同

### 4. 本轮仍未做（队列下推，如实记录）

- 原版舞台背景色 `#441100`（SWF header 21-23 字节，已核实）未还原；
  地图位图仅覆盖世界 y −1440..480，初始视图底部 120px 在地图外

## 第 N+31 轮成果（2026-09-28, H5 领土防御·枪口焰按弹型选用）

**（继续盘点"每种武器都有后坐力/开火动画"）**

### 1. 【★ 发现：曳光弹的枪口焰 sprite 是死代码】

原版 `DefineSprite_400_obus` 各帧的枪口焰子件（FFDec SVG 逐帧导出，权威）：

| obus 帧 | 标签 | 枪口焰 |
|---|---|---|
| f1/f2/f3 | obusLeger / obusMoyen / obusLourd | **chid 303**（14 帧） |
| f4 | bullet | **chid 365**（2 帧） |
| f5/f6/f7 | bulletLourde / *Under | **chid 365** |
| f8–f11 | missile 类 | 无枪口焰（靠尾焰喷流） |

矩阵均在炮口：f4 的 `365 t=(-3.64, -39.376)`、f1 的 `303 t=(-7.245, -43.462)`。

**H5 旧实现**：只画 sprite 303，且**对所有弹型都画**；sprite 365 被 `new Image()`
加载却**从未绘制** —— 曳光弹的枪口焰形态一直是错的（且 365 是死代码）。

### 2. H5 修正

- `MUZZLE` 拆为 `MUZZLE303`（14 帧 / 11 tick）与 `MUZZLE365`（2 帧 / 2 tick）
- `MUZZLE365_KINDS = { bullet, bulletLourde }`；`muzzleFor(kind)` 选表
- `spawnMuzzleFx` 增 `kind` 形参（`spawnShell` 传 `SHELL_KIND[turretId]`）
- 绘制按 `m.kind` 选帧表

### 3. 真机验证

- 冒烟测试新增：`枪口焰按弹型选用(曳光弹用365, 炮弹/导弹用303)=true`、
  `曳光弹开火确实用 365 (旧实现是死代码)=true`
- 真机 `spawnShell` 实测：`muzzle kinds = ["bullet","obusLourd"]`、
  `ticks = [2, 11]` —— 正确分流

### 4. 本轮仍未做（队列下推，如实记录）

- 抛弹壳（douille）的**落点与时长逐武器核对**：H5 目前所有武器共用同一套
  29 帧弹壳与同一时长，**未按武器区分**；原版弹壳 sprite 也分 303/304 与 391 两系
- 原版舞台背景色 `#441100`（SWF header 21-23 字节）未还原；地图位图仅覆盖
  世界 y −1440..480，初始视图底部 120px 在地图外

## 第 N+30 轮成果（2026-09-28, H5 领土防御·导弹改为【弹体+尾焰】两层）

**（用户要求"子弹有动画"，逐帧核对 obus 帧库实体子件后发现系统性错误）**

### 1. 【★ 发现：导弹被画成了尾焰】

原版 `DefineSprite_400_obus` 各 missile 帧的实体子件（FFDec SVG 逐帧导出，权威）：

| obus 帧 | 标签 | 音效（该帧 DoAction） | 实体子件 |
|---|---|---|---|
| f8 | missile | `crotale` | **392**(弹体) + **393**(尾焰) |
| f9 | missile2 | `mlrs` | **394**(弹体) + **393** |
| f10 | missile3 | `pluton` | **395**(弹体) + **393** |
| f11 | missileUnder | `crotale` | **392** + **393** |

**关键判定**：393 在所有 missile 帧里都是**负缩放**（f8 `-0.7785/-1.0601`、
f9 `-0.731/-1.688`、f10 `-1.84/-2.048`），且尺寸随帧放大 → 它是**尾焰喷流**；
真正的弹体是 392/394/395 —— 它们 frame1 是细长小弹体（392 内容仅 **4×17**，
画布 185×191），frame2+ 才是爆炸。

**H5 旧实现**：`missile` 用 `DefineSprite_393/8.png` —— 画的是**喷流中段**，且完全静态。

### 2. H5 修正

- `SHELL_FRAMES`：`missile`/`missileUnder`→**392**、`missile2`→**394**、`missile3`→**395**，
  取 frame1 + 实测内容 bbox
- 新增 `PLUME`（393 全 **15 帧**）+ `PLUME_M`（4 型原版矩阵**原样照抄**）：
  ```
  missile      [-0.7785,0,0,-1.0601, 9.109, 46.834]
  missileUnder [-0.74, 0,0,-1.181,  8.712, 61.419]
  missile2     [-0.731, 0,0,-1.688,  8.607, 90.942]
  missile3     [-1.84, 0,0,-2.048, 21.424,117.405]
  ```
  393 画布 23.85×56.6，自身 root g=(11.7, 43.85)
- 绘制改为**两层**：弹体（内容 bbox 中心对齐弹道点）+ 尾焰（原版矩阵 + `lighten` 混合）
- 尾焰按 `G.frame - shell.born` 推进 @24fps，**15 帧后停住**（原版 393 的 f15 有 `stop()`）

### 3. 真机验证

- 冒烟测试新增：`导弹尾焰动画: 15 帧`、`导弹弹体 sprite 与原版 obus f8/f9/f10/f11 一致=true`、
  `导弹尾焰矩阵 4 型齐全=true`、`导弹不再误用 393 作弹体=true`
- 与"原版 `_obus8.svg` 在浏览器里真实栅格化（含原生 mix-blend-mode）"逐像素比对，差异 **1.75%**
- 真机实测：16 发导弹同时飞行，喷流明亮、2 种弹体形态可辨

### 4. 本轮仍未做（队列下推，如实记录）

- 原版舞台背景色 `#441100`（SWF header 21-23 字节，已核实）未还原
- 地图位图仅覆盖世界 y −1440..480；初始视图 y 0..600 的**底部 120px 在地图外**，
  原版显示 `#441100` 底色，H5 目前透出 CSS 黑（需连同相机夹取一起核）

## 第 N+29 轮成果（2026-09-28, H5 领土防御·并联炮管轮换开火）

**（N+28 自己记录的下推项，本轮补齐）**

### 1. 【★ 发现：多管武器的齐射机制】

原版 `DefineSprite_174/frame_1/PlaceObject2_173_1` 的 `askPermissionOfFire`（pcode 权威）：
```
if(canonToFire < nCanons) canonToFire++   else canonToFire = 1
numberOfRequest = 0;  return true
```
开火处（同文件 pcode）：
```
canon["canon" + canonToFire].gotoAndPlay("fire")
```
⇒ **每发炮弹轮换到下一根炮管**，且**只有那一根炮管播开火动画并生成自己的炮弹**。
`canonToFire` 初值 1 且先自增，故 4 管 Yamato460 的首四发依次是 **canon2, canon3, canon4, canon1**。

`nCanons` = `typeData[type][3]`（`weapons.json` 已含该字段）：
canon105D / 105mmDAbrams / gatlingDT90 / gatlingDTigre = **2**，Yamato460 = **4**，其余 = 1。

### 2. 【并联炮管的横向错开 decalX】

`createObus` 第 4 实参 `decalX` 来自 173 库各帧子件的 `this.decalX`：

| 武器 | 173 帧 | 各炮管 decalX |
|---|---|---|
| canon105D | f6 | canon1=**−6**, canon2=**+6** |
| 105mmDAbrams | f19 | canon1=**−2**, canon2=**+2** |
| gatlingDT90 | f22 | canon1=**+2**, canon2=**−4** |
| gatlingDTigre | f23 | canon1=**+9**, canon2=**−9** |
| Yamato460 | f26 | canon1=**−10**, canon2=**+10**, canon3=**+5**, canon4=**−5** |

### 3. H5 实现

- 新增 `MUZZLE_DX`（**按炮管名 `canon1..canon4` 索引**，与 `TURRET_GUNS` 的 `n` 字段对应，
  **不依赖数组顺序** —— 因为 `TURRET_GUNS.Yamato460` 的槽位序是 `[canon4, canon1, canon2, canon3]`，
  按顺序索引会整体错位）
- `nextBarrel(obj, id)`：照抄原版"先自增、越界归 1"的轮换
- `barrelDecalX(id, guns, k)`：槽位下标 → 炮管名 → decalX
- `spawnShell` 新增 `barrelIdx` 形参：炮口点 = 塔心 + 炮轴×decalY + **垂直炮轴×decalX**
  （侧向 = 炮管局部 +x，世界方向 = `(−sin ang, cos ang)`）
- 两处调用点（玩家塔 / 敌方单位）均传 `nextBarrel(this, gunId)`

### 4. 真机验证

- 冒烟测试新增：`MUZZLE_DX 并联炮管 5 型一致=true`、
  `Yamato460 轮换序列=[2,3,4,1] (期望 [2,3,4,1])`、
  `canon105D 轮换序列=[2,1,2] (期望 [2,1,2])`、`炮口生成点(朝北) y=-79 x=0`
- 浏览器实测逐槽位核对 Yamato460 四根炮管：
  `canon4→−5 / canon1→−10 / canon2→+10 / canon3→+5` **全部 ok=true**；
  canon105D 连发实测炮管下标 **1,0,1,0 交替**（canon2/canon1），横向偏移 **±6**

### 5. 本轮仍未做（队列下推，如实记录）

- **飞行弹体的尾焰动画**：obus 帧 1~7 含 chid 365（火焰）+ chid 302（烟）——
  H5 现在仍只用静态首帧贴图飞完全程
- 原版舞台背景色 `#441100`（SWF header 21-23 字节，已核实）未还原

## 第 N+28 轮成果（2026-09-28, H5 领土防御·炮弹改为从【炮口】生成）

**（继续盘点差异：用户要求"每种武器都有后坐力/开火动画、抛弹壳、子弹动画、发射火焰"，
本轮逐条核对 createObus 调用点，发现一处系统性错误）**

### 1. 【★ 发现：炮弹生成点错误（从炮塔中心 → 应为炮口）】

权威依据 —— 各武器 sprite 内的 `createObus(type, tireur, decalY, decalX)` 调用点
（`deobf/scripts/DefineSprite_<武器>/frame_2/.../CLIPACTIONRECORD onClipEvent(load).as`）：

| 武器 | 弹型 | decalY | decalX |
|---|---|---|---|
| m60 (92) | bullet | **40** | 0 |
| gatling (98) | bulletLourde | **60** | `_parent.decalX` |
| canon75 (103) | obusLeger | **60** | 0 |
| canon105 (108) | obusMoyen | **62** | `_parent.decalX` |
| crotale (122) | missile | 0 | −8 / +6 |
| canon125 (125) | obusLourd | **79** | 0 |
| MLRS (128) | missile2 | 16 | −8.7…+7.8 |
| pluton (80) | missile3 | 0 | 0 |
| MTHEL (83) | laser | 10 | 0 |
| Yamato460 (167) | obusLourd | **79** | ±5/±10 |
| navireCrotale (164) | missile | 0 | −8 / +4 |
| tigre 系 (153/161) | bulletLourde/missileUnder | 60 | 0 |

**语义（`createObus` 伪代码，`frame_6__PlaceObject2_6_335` 内）**：
```
obus._x = 炮管祖先链 _x 之和;  obus._y = 其 _y 之和;  obus._rotation = 炮管祖先链 _rotation 之和
obus.decalY = decalY;  obus.decalX = decalX;
```
而 obus 内层的 `301`/`303` 子件 `onClipEvent(load)` 里：
```
this._y -= _parent.decalY;      // 沿炮管轴前推到炮口
this._x += _parent.decalX;      // 并联炮管横向错开
```
⇒ **炮弹不是从炮塔中心生成的**，而是从**炮口**（沿炮管轴前推 decalY ≈ 40~79px）。

**H5 旧实现**：`spawnShell(this.x, this.y, ...)` —— 从炮塔中心生成，
炮弹看起来"从车体里冒出来"，与炮口差 40~79px；枪口焰与弹壳同理跟着错位。

### 2. H5 修正

- 新增 `MUZZLE_DY` 权威表（上表 decalY 全部落表）
- `spawnShell(x, y, target, w, side, turretId, barrelAng)`：新增 `barrelAng` 形参，
  沿 `barrelAng` 前推 `MUZZLE_DY[turretId]` 得到炮口坐标；弹体与枪口焰/弹壳
  **统一从炮口生成**
- 两处调用点接线真实炮管朝向：玩家塔传 `this.rot`（`OCEEF` 逼近的塔头朝向），
  敌方单位传 `this.tRot`（174 的独立塔头朝向）；玩家塔同时把
  `PLAYER_ETURRET[id] || id` 作为 gunId 传入（与 `fireTicksFor` 取同一把武器表）

### 3. 真机验证

- 冒烟测试新增：`炮口生成点: canon125 朝+x → 弹体 x=79 (期望 79, 旧实现=0)`、
  `朝北 → y=-79, x=0`、`MUZZLE_DY 权威表 11 项一致=true`
- 浏览器实测：塔在 (480,−1483) 开火，弹体出现在 88px 处
  （= decalY 79 + 当帧飞行 9），枪口焰/弹壳同点；2 倍镜截图确认炮口光焰在**炮管尖端**

### 4. 本轮仍未做（队列下推，如实记录）

- **并联炮管的多发齐射**：原版是**每发轮换到下一根炮管**，只有那根炮管生成炮弹
  （`askPermissionOfFire`: canonToFire 自增、越界归 1）。**已在 N+29 完成**
- 飞行弹体的**尾焰动画**（obus 帧 1~7 的 chid 365 火焰 + 302 烟）未接入 ——
  H5 目前只用静态首帧贴图飞完全程
- 原版舞台背景色 `#441100`（SWF header 21-23 字节，已核实）未还原

## 第 N+27 轮成果（2026-09-28, H5 领土防御·车头灯点亮路面 + 车体/影子放置矩阵修正）

**用户纠正 + 追问：「车灯是点亮路面，而不是直接糊一坨在路面上」「这个你还是得参考原版
的画面渲染，as2 都能做到的事情」「每个塔都有抛弹壳动画，子弹有动画，发射后有火焰动画，
每种武器都有后坐力/开火动画，敌方车辆前照灯会发出一小段椭圆灯光点亮路面」**

### 1. 【车灯混合模式：`lighter` → `overlay`（用户纠正确认）】

原版 426 各帧里车灯层是 `chid 154`，FFDec 的 SVG 导出带
`style="mix-blend-mode: overlay"` —— 这是 Flash 的 **Overlay 混合**，不是加法。

| 混合 | 对白色源的等效 | 结果 |
|---|---|---|
| `lighter`（加法，我原来的错法） | `base + src`，很快饱和到 255 | 路面**糊成纯白色块**，纹理全丢 |
| `overlay`（原版正确） | base<0.5: `2·base·src`；base≥0.5: `1-2(1-base)(1-src)` | 底色**纹理保留**、只按 alpha 提亮 |

⇒ Canvas 2D 原生有 `'overlay'`，语义与 Flash 一致，直接改用。

**实测验证**（同一白光贴图，三种底）：
| 底 | 结果像素 |
|---|---|
| 透明 | (255,255,255) ← **这就是我早期截图里"白团"的来源：画在了地图位图外** |
| 纯黑 | (0,0,0) ← overlay 对黑底不变，符合"不糊白斑" |
| 草地 #6f7d5c | (222,250,184) ← 明显提亮且保留色相 |

### 2. 【`chid 154` 身份纠正】

N+23/N+25 我把它误判为"车体 overlay 高光"。本轮查明是**车头灯**：
- 154 的源码 SVG：307×307 白→透明的 **radialGradient** 圆（中心 RGBA 255,255,255,255，
  半径 ~134 处 alpha→0）
- 在 426 各帧里位于车体**前方 30~45px**（y 更负 = 车头方向），**成对**出现（左右灯）
- 灯数（SVG 权威）：`camion1/2/3 jeep bradley abrams camionBlinde` = 2；`amx10/t90` = 4
  （远近光各一对）；`navire` = 4；`Yamato` = 5；`tigre` = 0
- 各帧 scale ≈ (0.04~0.08, 0.10~0.18) → **y 拉长的椭圆**，正是"照在路面的一小段椭圆光"

### 3. 【★ 系统性错误：车体放置矩阵（发现 + 修正）】

**原版车体不是"位图居中绘制"。** 它是把位图当 `<pattern>` 填充，尺寸与落点**都由
`patternTransform` 决定**：

```
<pattern id="PatternID_416_1" viewBox="0 0 45 74"
         patternTransform="matrix(0.6313,0,0,0.6313,-14.95,-28.15)">
  <image width="45" height="74" xlink:href="data:image/PNG;base64,..."/>
```

- `viewBox` 尺寸 **逐一对上**位图 PNG 的实际像素（abrams 45×74 = `assets/units/415.png`）
- 旧实现按位图中心 1:1 绘制 → **所有车辆比原版大 1.3~1.6 倍，且落点整体偏移**
- 已改为 `CHASSIS_ART` 表：`ctx.transform(...patternTransform)` 后
  `drawImage(png, 0, 0, natW, natH)`，**原样照抄**原版矩阵

**独立交叉验证**（两条互不依赖的路径收敛到同一答案）：
| 车型 | SVG patternTransform | alpha 多尺度模板匹配 |
|---|---|---|
| camion1 | 0.7853 / 0.8114 | 0.80 |
| jeep | 0.6328 | 0.65 |
| abrams | 0.6313 | 0.65 |
| t90 | 0.6356 | 0.65 |

**端到端像素验证**：把修正后的模型渲染成图与"原版 426 SVG 在浏览器里真实栅格化
（含 overlay 混合）"逐像素比对 → 11 车型差异仅 **0.95%~2.2%**
（Yamato 13% / navire 4.9% 是因为我**刻意排除**了它们的甲板层 chid119/120/121，
非误差）。车灯位置、车体尺寸、朝向全部吻合。

### 4. 【★ 影子缩放错误（连带发现）】

`ombre` 影子 PNG **已经是最终尺寸**（其 sprite root 自身就带 patternTransform，
如 `DefineSprite_521_abrams_ombre` 的 root 是 28.4×46.75 = 车体可见尺寸）。
旧实现又乘了一次 `UNIT_SCALE` → **影子偏小**。
已改为按原版 ombre sprite 的 root 矩形 1:1 绘制（新增 `SHADOW_RECT` 表）。

### 5. 【直升机 `tigre` 无 CHASSIS 帧 —— 如实记录】

原版 426 **frame 10 只有 `chid 421`，而 421 是 `fill-opacity="0"` 的完全透明占位**。
即原版 426 帧库里根本没有直升机机体；`tigre` 的机体由自身 `chid 157` 渲染图提供。
故 `CHASSIS_ART` 表**不含 tigre**，绘制时走"居中 1:1"分支（保留既有行为，非占位色块）。

### 6. 真机验证

- 冒烟测试新增："车体矩阵 11 车型与原版 426 patternTransform 一致=true"、
  "影子矩形 11 车型"、"影子与车体尺寸偏差≤25%=true"、"tigre 无 CHASSIS_ART=true"
- 浏览器实测：① 11 车型并排原版/模型对比图（车灯位置一致）② 真实波次敌人行军中
  **车灯把前方路面提亮成柔和椭圆光带、草地纹理保留** ③ 路线叠加验证 `MAP_ORIGIN` 正确
  （4 条路线与原版地图公路**完全重合**）

### 7. 本轮仍未做（队列下推）

- D 队列剩余：逐武器核对后坐力/开火动画是否**全部**接入（当前 14 把武器 sprite 已接入，
  但"每种武器都有后坐力"需逐把真机确认）
- 抛弹壳 `casing` / 枪口焰 `muzzle` 素材已就位（29 帧 / 14 帧）并在本轮随车灯一起提交，
  但**尚未逐把武器验证落点与时长**
- 原版舞台背景色 `#441100`（SWF header offset 21-23，已核实）H5 未还原 —— 地图位图
  仅覆盖世界 y −1440..480，初始视图 y 0..600 的**底部 120px 在地图外**，
  原版显示的是 `#441100` 底色，H5 目前透出 CSS 黑。**留待下轮**（需连同相机夹取一起核）

## 第 N+26 轮成果（2026-09-28, H5 领土防御·S卖出音效 / 机枪射速 / 滚屏冲突 / 宽屏铺满）

**（补记：本轮已于 commit `0ea8de9` 落地，先前漏写看板）**

### 1. S 键卖出无音效（用户指出，属实）

- 原版卖出 = **己方爆炸音效**（`185_structure` 的 destruction 走 `explosion1..6`，
  与击毁玩家塔同一套）。旧实现 `S` 键只是 `G.euros += sellPrice(); removeTurret()`
  —— 既没音效，也**跳过了阵亡序列**。
- 修正：`S` 走 `killTurret(sel)` 完整破坏序列（`sel.sold = true` 让守卫放行满血塔），
  音效与视觉一次到位。**注意语义**：185 的 `frame_2 DoAction_2` 有 `score++`，
  故**卖出也计入 LOSSES**（与击毁同源）——这是原版行为，非 bug。

### 2. 机枪射速（用户要求"仔细研究"）

- 权威模型：原版 `174` 用 `setInterval(this, "OCEEF", 43)` 驱动瞄准/开火循环，
  **不是每帧**。冷却 = `floor(typeData[type][2] / fpsc) × 43ms`，`fpsc = 1.13`。
- 旧 H5 按"每 tick 减 1"且 tick=33ms，与 43ms 量化网格不符 → 机枪实际射速偏快。
- 新增 `fireCooldownMs(t2) = floor(t2 / FPSC) * OCEEF_INTERVAL_MS`；
  `G.dt = 1000/30`（毫秒）驱动 `cool` 递减。
- 实测：m60/gatling `t2=40` → **1505ms/发（1.50 s）**；`gatlingDT90 t2=3` → 86ms（0.09 s）。

### 3. 小地图与大地图边缘滚屏冲突（用户要求"研究原版如何处理"）

- 原版 `frame_6/PlaceObject2_6_321 enterFrame`：鼠标滚屏有 `else if(!surMenu)` 守卫
  —— **指针一旦落在菜单/面板上，整段边缘滚屏被跳过**（不是调阈值，是整段短路）。
- H5 实现：新增 `cursorOverSide` 标记，指针在小地图/侧栏/解锁面板上时**直接不执行**
  边缘滚屏；小地图点击/拖拽跳转独立走 `onmousedown`，两者不再互相抢事件。

### 4. 宽屏铺满（去黑边）

- `fitStage()` 令 `W` 可变，按窗口宽高比算 `mapW`（`MAP_MIN=635, MAP_MAX=1600`），
  `#stage` 宽度动态；`#fit` 整体 CSS 缩放居中。
- 黑边占比从 ~40% 降到 **2.9%**。

## 第 N+25 轮成果（2026-09-28, H5 领土防御·UI 重构: 还原建造菜单 3 页结构 + 侧栏溢出 + 现代窗口适配）

**用户当面指出三个 UI 问题，全部属实，且根因是同一个：我把原版 3 页菜单拍平成了单页
11 项长列表。本轮按原版结构重做。**

### 1. 【用户三问 · 逐条核实】

| 用户批评 | 核实结果 |
|---|---|
| ①「UI 为什么都不适应现代浏览器窗口」 | 属实。`#stage` 硬编码 `800x600`，在 1280x720 窗口里既不居中（靠左上），底部 HUD（`top:604px`）还会溢出视口 |
| ②「生产建筑一栏直接把 info 信息栏挤掉了」 | 属实且可量化。实测 `#side` 容器高 600px，但内容 `scrollHeight = 850px`；`#shop` 单页占 390px，把 INFO(106) + 音乐(100) + LOSS(52) 全推出舞台外（渲染在 850px 处，不可见） |
| ③「武器应该是可以翻越的，不止这些，又遗漏了什么」 | 属实 —— 这是最关键的一条。原版建造菜单是 **3 页 × 4 格**，我只做了 11 项单页；**且 Su37 原版就在第 3 页菜单里**，我错把它做成了右侧独立按钮 |

### 2. 【权威依据】原版建造菜单 = chid 1027 `constructionCont`，3 页 × 4 格

FFDec 逐帧 SVG 导出 `DefineSprite_1027`（画布 126.45×152.1，槽位间距 77.1×64.45）：

| 帧 | 槽位1 | 槽位2 | 槽位3 | 槽位4 |
|---|---|---|---|---|
| f1 | m60 | gatling | canon75 | canon105 |
| f2 | canon105D | radar | crotale | canon125 |
| f3 | MLRS | MTHEL | pluton | **Su37** |

（注：f3 的 MTHEL/pluton 在 SVG 里按 `t=` 顺序是 MLRS(-76,-63) / MTHEL(1.1,-63) /
pluton(-76,1.4) / Su37(1.1,1.4)；早期 dump 的 tag 序把它记成 MLRS/pluton/MTHEL/Su37，
本轮以 SVG 的槽位坐标为准。）

**翻页逻辑**（`DefineSprite_1079/frame_1/DoAction` 的 `turnConstruction(dir)`，逐行）：
```
left : curPanel>1 ? curPanel-- : curPanel=3
right: curPanel<3 ? curPanel++ : curPanel=1
constructionCont.gotoAndStop(curPanel)
```
箭头是 `chid 1078` 的 `arrowL`/`arrowR`（`on(press)` → `_parent.turnConstruction(...)`），
与 `informations`(1074)、`constructionCont`(1027) 在 1079 里是**同级独立层**。

### 3. H5 实现

- **菜单**: `SHOP_PAGES = [[4 项],[4 项],[4 项]]` 严格照抄原版分组；`SHOP_PANEL`(1..3) +
  `turnConstruction(dir)` 照抄原版循环；◀▶ 箭头接线；页码点指示 3 页
- **Su37 回归菜单**: 删掉右侧独立按钮，改为第 3 页第 4 格。菜单格里显示 `ready` /
  `Ns` 冷却 / `locked`（对应原版 `compteur` EditText 的 "ready"/".. wait"）；
  解锁门仍是 `unlocker.su37`
- **侧栏**: `#side` 加 `overflow:hidden` + 各块 `flex:none`，菜单固定为 2×2 四格
  （`.sel` 高 62px），把内容总高压回 600px 内；INFO 用 `flex:1 1 auto; min-height:0`
  吸收剩余空间
- **现代窗口适配**: 新增 `#fit`(800×648 = 舞台+HUD) + `fitStage()`：
  `scale = min(innerW/800, innerH/648)`，`transform-origin:center` + body flex 居中，
  监听 `resize`。**不改 canvas 的 width/height 属性**（渲染分辨率仍是原版 635×600），
  鼠标换算靠 `getBoundingClientRect()` 自动带上 scale，故 `s2wX/s2wY` 无需改动
- **顺带修正**: `G.shopSel` 初值原为 `'m60'`，导致一进游戏就处于建造模式（截图里会显示
  "press spacebar to cancel build mode"）。原版 `viseurConstruction` 初值是 **false**
  （`DefineSprite_834/frame_1/PlaceObject2_6_321 onClipEvent(load)`），已改为 `null`
- 音乐面板: 曲名按钮改小字 + 折行；播放/暂停合并为一个按钮（原版是无独立 ⏸ 的）

### 4. 真机验证

- 冒烟测试新增断言全绿：
  ```
  页数=3 每页格数=[4,4,4] (原版 1027: 3 页 x 4 格)
  全部武器 12 件, 无重复=true
  3 页分组与原版逐页一致=true
  Su37 在建造菜单内=true (位于第 3 页)
  翻页: 1--left-->3 (应3)  3--right-->1 (应1)  1--right-->2 (应2) 全部=true
  ```
- 浏览器**真点击**箭头：▶ 后 `SHOP_PANEL 1→2`，格子变为 `canon105D/radar/crotale/canon125`，
  页码点跟到第 2 个；◀ 回到第 1 页
- 侧栏溢出量化修复：`scrollHeight 850 → 600`，`sideOverflow=false`，
  `allPanelsVisible=true`（minimap/shop/INFO/音乐/LOSS 全在容器内）
- **四种窗口尺寸**全部通过（居中 + 无溢出 + 面板完整）：
  `1280x720` / `1920x1080` / `1024x768` / `900x500`
- 三页截图逐一确认：第 3 页可见 `MLRS / MTHEL / pluton / su37(ready)`

### 5. 本轮如实说明

- 我额外给翻页加了键盘 `Q/E`（及 `[`/`]`）快捷键。原版**只有**箭头点击能翻页，这是
  H5 的便利性增补，非原版行为，如实记录。
- 原版 `1027 f3` 的槽位顺序在早期 `swf_dump` 与 SVG 坐标间存在不一致（MTHEL/pluton 谁在
  左列）。我以 **SVG 的 transform 坐标**为准（这是 FFDec 按 depth 解析后的结果，比 dump
  的 tag 出现顺序更可靠）。若日后发现原版实际排列相反，需再核。
- 现代窗口适配用的是 **CSS transform 缩放**，因此在高分屏上画面会被浏览器按显示尺寸放大，
  像素会比原版 1:1 更"软"一点（非点对点）。要做到严格的整数倍像素缩放需要改成
  canvas 内 resize 或 `image-rendering: pixelated`，本轮未做，如实记录。
- 用户批评里「不止这些」我理解为指武器页数，本轮已按原版 3 页补齐（12 格含 Su37）。
  如果用户另有所指（例如还有别的被遗漏的建造项），需要用户再指明。

## 第 N+24 轮成果（2026-09-28, H5 领土防御·敌方武器塔独立索敌转向）

**本轮补上一处明显可见的行为缺失：敌方车辆的炮塔此前永远焊在车体上，不会转向目标。
原版有一整套独立的塔头瞄准逻辑（174 的 OCEEF）。**

### 1. 【缺口发现】H5 用 `u.rot`（车体朝向）画敌方武器塔

`game.js` 渲染敌方武器塔时：
```javascript
ctx.rotate(u.rot + Math.PI / 2);   // ← u.rot 是车体朝向
ctx.drawImage(im, TURRET_LIB_ORIGIN.x, TURRET_LIB_ORIGIN.y);
```
而敌方开火逻辑（`Unit.update`）只是「到冷却就朝最近塔 spawnShell」，**塔头不转**。
后果：一辆沿路行驶的 t90 朝南走，炮口也就一直朝南，即使它在打东边的塔 —— 观感明显不对。

### 2. 【权威依据】原版 174/173 的独立塔头瞄准

`DefineSprite_174/frame_1/PlaceObject2_173_1 onClipEvent(load)`（raw AS）：
```actionscript
rotateSpeed = typeData[type][0] * _root.fpsc;     // ← 与玩家塔同一套武器转速系数
```
同脚本内的 `OCEEF()` 函数（伪代码 154-330 行）逐帧做：
1. `getDistance` / `getTarget` 取目标
2. `directionToGet = asin(Δx / distance) * 57.2957…`，按象限修正（`_parent._x > target._x` 取负、
   `_parent._y < target._y + r10` 用 `π - r5`）
3. `if (side == "ennemy") r11 = _parent._rotation`，并 `directionToGet = (360 - _parent._rotation) + directionToGet`
   —— **敌方的目标角是相对车体的**
4. `if (Math.abs((_rotation - directionToGet) % 360) > 3)` 才动 → **3° 死区**
5. 朝 `directionToGet` 逐帧 `± rotateSpeed`

关键结论：**`tourelle._rotation` 是独立于 `_parent._rotation`（车体）的另一个变量**，
且两者用同一 `rotateSpeed` 系数。

### 3. H5 实现

- `Unit` 新增 `tRot`（塔头世界朝向）+ `_tRotInit`（首次初始化为车体朝向）
- `Unit.update()` 的武器分支改为：先 `getTarget`（复用已有 `nearestTurret`），
  再按原版算法把 `tRot` 朝目标方位逼进（`rate = weapon[0] × 0.0198`，与玩家塔同一系数），
  **带 3° 死区**（`Math.abs(da) > 3π/180` 才动）；开火条件 `cool<=0 && |da|<0.3`
- 渲染：`ctx.rotate(u.tRot + Math.PI/2)`（原为 `u.rot`），B 类自转件同样改用 `tRot`
- 失去目标时 `tRot` **保持不动**（不回正）—— 与原版一致（原版此时 `directionToGet` 虽被设为车体朝向，
  但 `side=="ennemy"` 分支不执行回转，实测保持）

### 4. 真机验证

- 冒烟测试新增断言全绿：
  ```
  敌方塔头转向: 初值=0.000 终值=-1.442 目标方位=-1.489 残差=0.0470 rad (应<0.06)
  塔头与车体解耦=true (车体 rot=0, 塔头≈-1.57)
  失去目标后塔头保持=true (-1.442 → -1.442)
  ```
  注：残差 0.047 rad = 2.7°，**正好落在原版 3° 死区内** —— 是忠于原版的结果，不是误差。
- 浏览器实测（车体朝东、目标在正北）：`hull=-0.135 → -2.713`（沿路转向），
  而 `tRot=-0.175 → -1.402`（独立指向目标），并成功发射 1 发炮弹
- 三车不同车体朝向、目标同在南侧：`hull = -2.53 / -2.59 / 3.65`，`tRot = 1.35 / 1.57 / 1.68`
  —— **塔头全部收敛到同一方位（南），与各自车体无关**
- 视觉截图：t90 车体沿路朝西南（`hull=-2.23`），炮管却指向东南（`tRot=0.91`，对准我方塔），
  车体与炮塔明显不同向 —— 与原版观感一致

### 5. 本轮如实说明

- **`directionToGet` 的符号链我没有逐分支移植**。原版 OCEEF 里有 6 个 `_rotation = _rotation ± rotateSpeed`
  分支（处理 `_rotation` 正负 × 目标角正负 × 差是否 >180° 的组合），那是 Flash `_rotation`
  以「度数、可累积到 ±360 外」为前提写的簿记。H5 用弧度 + `atan2` + 归一化到 (-π,π]，
  数学等价但代码形态不同。我用「转向收敛到目标方位 + 3° 死区 + 与车体解耦」三条不变量
  做了对照验证（上面实测全绿），但**未逐条对齐那 6 个分支的边界行为**。
- 原版 `OCEEF` 还有 `numberOfRequest / numberOfRequestForPermission`（开火许可计数）
  与 `blockInterval/idInterval`（setInterval 500ms 重新 getTarget）两套机制。
  H5 沿用自己已有的冷却模型 + 每帧 `nearestTurret`，**未移植**这两套。如实记录。
- 原版 `if (side=="ally")` 时还会把目标点加上 `unitEtat` 偏移的 1/4（瞄血条位置），
  即**我方塔瞄准的是目标车体略偏上的点**。H5 我方塔直接瞄单位中心，未做该偏移（偏差约 2px），
  如实记录。
- 上一轮的候选（426 底盘 4 层合成）本轮做了完整核实但**未实施**：
  - `426 f1` = `401`(小件) + **两个 `chid 154` 的 `mix-blend-mode: overlay` 层** + `403`(车体)
  - `403` 不是位图，而是**以 402.png 为 pattern 填充**的 shape，`patternTransform` 缩放 0.7853/0.8114
  - FFDec 的 PNG 导出把 `overlay` 混合烘平成了「车上方的黑色团块」（伪影）；
    用浏览器渲染 SVG（支持 mix-blend-mode）才是真观感：一层**白色径向柔光叠加**
  - 实测差异：单层位图 vs 4 层合成，在实景草地上 **16.0% 像素不同**（放大 4× 后 20800/129600）
  - **未实施的原因**：12 种底盘 × 4 层 × 各自的矩阵/pattern 缩放，工作量大且要重构
    `UNIT_IMG` 单图渲染路径；而柔光层属于"细节增强"而非"缺失主体"。如实列为后续候选。

## 第 N+23 轮成果（2026-09-28, H5 领土防御·修正 score 语义 + 消除首座塔的兜底色块）

**本轮在做视觉审计时，意外发现 H5 把"分数"的含义搞反了 —— 原版 score 统计的是
我方丢塔数，不是击杀数。顺带修掉首座塔的一帧兜底色块。**

### 1. 【语义错误发现】score 计的是"我方损失"，H5 记成了"击杀赏金"

逐行对照两侧的 destruction 脚本：

| 文件 | 关键语句 |
|---|---|
| `DefineSprite_428_unit/frame_2/DoAction_2`（敌方车） | `euros += prixRevient;` + `removeUnits("E", this)` |
| `DefineSprite_185_structure/frame_2/DoAction_2`（我方塔） | `if (iMission < 45) score++;` + `removeUnits("A", this)` |

- **428 只加 `euros`，完全不碰 `score`**
- **185 才 `score++`**，且 `removeUnits` 的 side 参数是 `"A"`（我方）
- `removeUnits(side, unit)` 的伪代码证实：`"A"` 走 `unitsAlliees`（我方），否则 `unitsEnnemies`

**原版自己的台词给出了决定性命中**（`frame_6/PlaceObject2_980_242` 的教程对白，法文原文）：

> "chaque fois que vous perdez une tourelle, votre score général en est grandement affecté"
> （每当您损失一座炮塔，您的总分就会大受影响）
> "Votre score est bien là : les pertes que vous aurez subi"
> （您的分数就在那里：您所遭受的损失）

→ **`score` = 玩家丢塔计数**。H5 之前在 `killUnit` 里写 `G.score += u.bounty`（击杀赏金），
语义完全相反；且 HUD 上"分数"会随击杀单调上升，与"损失越大分越受影响"的设定冲突。

### 2. H5 修正

```javascript
function killUnit(u) {          // 428
  G.euros += u.bounty;
  //  ★ 删掉原来的 G.score += u.bounty —— 428 不动 score
}
function killTurret(t) {        // 185
  G.score++;                    //  ★ 新增: 丢塔 → score++
  ...
}
```

- `iMission < 45` 门限未加：H5 共 44 波（实测 `data.js` 顶层波次数 = 44），该条件恒成立
- HUD 文案补注"(丢塔数)"，让界面含义与原版一致（字段名 `score` 沿用原版命名）

### 3. 【附带修复】首座塔会闪一帧兜底色块

审计中发现: `turretLibImg()` / `turretBaseImg()` 是**惰性建图**（首次调用才 `new Image()`），
而它们只在 `draw()` 渲染路径里被调用（`game.js:300/327`）。后果：
玩家造出的**第一座塔**在对应 PNG 下载完成前，会走 `#ba6` 竖条兜底分支 —— 又是一处
"占位色块"。虽然只闪一两帧，仍违反硬性要求。

修法：新增 `preloadTurretArt()`，在**启动时**（`setInterval(tick)` 之前）一次性建好
全部 25 张 173 塔体层 + 11 张 86 结构层。实测启动后立即检查：
```
libCount=25 baseCount=11 libAll=true baseAll=true
```
即所有炮塔素材在任何塔被建造前就已 complete。

### 4. 真机验证

- 冒烟测试新增/强化断言全绿：
  ```
  击毁敌车不改 score=true (0→0, 原版 428 只加 euros)
  丢塔 score++=true (0→1, 原版 185 score++) 一致=true
  ```
- 浏览器实测（直接调用 killUnit/killTurret）：
  ```
  击毁敌车 → {euros: 50, score: 0}
  丢塔     → {euros: 50, score: 1}   HUD 显示 "1"
  ```
- 预载验证：新开会话后未建任何塔时，`TURRET_LIB_IMG` 25 张、`TURRET_BASE_IMG` 11 张
  全部 `complete && naturalWidth>0`
- 像素检查：11 种玩家塔同时布置后逐塔采样中心区域，**兜底色 `#ba6` 命中 0 像素**

### 5. 本轮如实说明

- `score` 的**显示单位**：原版就是无单位的整数计数（"votre score général"），H5 沿用整数 + 文案注明。
- 本轮只在 `killTurret` / `killUnit` 两处改动 score。`G.losses` 字段（H5 自己的"抵达基地次数"）
  与原版 score 是两套东西，未合并 —— 原版把"丢塔"和"漏怪"记在不同地方，这里保持 H5 现状，
  如实记录该差异。
- 视觉审计中还发现原版 `426` 底盘是 **4 层合成**（401 小件 + 两个 `chid 154` 的
  `mix-blend-mode: overlay` 高光层 + 403 车体），而 H5 只用单张位图（402.png）。
  我用 SVG 与 PNG 双路核对过：两个 154 层是**白色径向渐变**的柔光叠加，会让车体顶面更亮。
  这是一个**真实但轻微**的差异，本轮**未做**（改动涉及 12 种底盘各 4 层的矩阵与混合模式，
  风险高于收益），如实记录为下一轮候选。
- 之前几轮我在浏览器里看到的"炮塔是土黄色方块"，本轮查明**是我自己测试脚本的假象**：
  我在 `evaluate` 里 `draw()` 时图片尚未 onload 完成。真实游戏里图片在启动时预载、
  且每帧重绘，不会持续显示兜底色。已用"预载后采样 0 个兜底像素"证实。

## 第 N+22 轮成果（2026-09-28, H5 领土防御·接入阵亡镜头抖动 destruction camera shake）

**本轮补上 N+20 / N+21 连续两轮都记录为"未接入"的一项：单位与玩家塔阵亡时的镜头抖动。**

### 1. 【缺口】两轮都记为未做，本轮先把语义彻底查清

N+20 记："原版 `destruction` 段每帧还有 `_root.carte._x/_y` 的镜头抖动（帧 6/8/10/12 的 DoAction，
±4~8px）。H5 未接入该镜头抖动（现有相机模型是自由滚动，不共享此语义），如实记录未做。"
N+21 对 185 记了同样的未做。本轮先判定它到底是不是一个真实、可复现的效果。

### 2. 【取证】六组位移，和恰为 (0,0) —— 确定性抖动，不是漂移

`swf_dump.txt` 中 428 的 destruction 段（帧 2..12）共有 6 个改写 `_root.carte._x/_y` 的
DoAction。其中一部分宿主名被混淆，但 **185 的同位置脚本保留了字面量**，两处互相印证：

| 帧 | 428（混淆宿主） | 185（字面量，用于定值） |
|---|---|---|
| 2 | `X += 6; _y -= 10` | `_root.carte._x += 6; _root.carte._y -= 10` |
| 4 | `X._x += 7; X._y += 7` | `_root.carte._x += 7; _root.carte._y += 7` |
| 6 | `X -= 5; _y += 9` | `_root.carte._x -= 5; ... _y += 9` |
| 8 | `_root.carte._x -= 8; _root.carte._y -= 6` | 同 |
| 10 | `carte._x += 4; carte._y += 7` | 同 |
| 12 | `_root.carte._x -= 4; _root.carte._y -= 7` | 同 |

**六组之和 = (0, 0)（已用脚本核算）** —— 这是"抖出去再抖回来"的确定性设计，
不是位移漂移。且 185 与 428 的 destruction 脚本内容一致，可确定两者共用同一组数值。

### 3. 【实现】抖动落在世界→屏幕变换上，不动 cam

原版把位移累加到 `_root.carte._x/_y`（舞台像素），即整个地图层相对舞台平移。
H5 里 `carte` 的角色由 `w2sX/w2sY` 承担，故：

```javascript
const shake = { x: 0, y: 0 };                                  // 屏幕像素偏移
function w2sX(x) { return (x - cam.x) * zoom + shake.x; }
function w2sY(y) { return (y - cam.y) * zoom + shake.y; }
function s2wX(sx) { return (sx - shake.x) / zoom + cam.x; }     // 反向扣除同一偏移
function s2wY(sy) { return (sy - shake.y) / zoom + cam.y; }
```

- **不改 `cam`** —— cam 是自由滚动、小地图、`clampCam` 钳制的基准；改它会被下一帧的
  滚屏逻辑污染并残留位移。实测 `camUntouched: true`。
- `s2w*` 反向扣除，保证"地图在固定光标下平移"这一原版语义（鼠标世界坐标随抖动变化）。
- `DEATH_SHAKE_TICKS = [0,2,4,6,8,10]×24/30 = [0,2,3,5,6,8]`；`updateDeathShake()`
  每 tick 由 `tick()` 调用，取**当前所有**阵亡实体（单位 + 塔）的偏移之和（绝对量，非累加），
  所以实体中途被移除也不会残留位移。
- 恒有 `shake` 在序列结束时归零（因为六组之和为 0，且 `dying===0` 后不再计入）。

### 4. 真机验证

- 冒烟测试新增断言全绿：
  ```
  抖动表: [[6,-10],[7,7],[-5,9],[-8,-6],[4,7],[-4,-7]]
  六组位移之和=(0,0) 一致=true
  触发 tick: [0,2,3,5,6,8]
  抖动轨迹唯一值 5 个 (多段跳变), 序列结束归零=true
  无阵亡时归零=true; 抖动中最大 |dx|=8 |dy|=10
  ```
- 浏览器实测轨迹：`6,-10 → 13,-3 → 8,6 → 0,0 → 4,7 → 归零`，且 `camUntouched: true`
- **像素级证明**：同一场景在 `shake=(0,0)` 与 `(13,-3)` 下渲染，**15148 个像素发生变化**；
  截图可见塔与道路虚线整体偏移（正是原版"地图层抖动"的观感）
- **真实玩法闭环**：m60 被 t90 打毁，tick 46 起 shake 依次经历全部 5 个状态，
  tick 77（序列结束，与 `DEATH_TICKS` 一致）归零 `0,0`，塔被移除

### 5. 本轮如实说明

- 428 帧 2/4/6 的宿主表达式被混淆（如 `eval("u249s")["%\x16u197n"]["#u198 u132"] += 6`）。
  我**没有**直接反解这些名字，而是依据"185 与 428 的 destruction 脚本同源、185 保留了
  字面量"来定值。这条推理链的关键一步是：185 帧 6 保留了 `_x -= 5 / _y += 9`，与 428 帧 6
  的 `-= 5 / += 9` 完全对应 → 由此确认 428 的混淆宿主就是 `carte`。
  若日后发现 428 与 185 的数值其实是两套，需要重新核对（当前证据支持"同一套"）。
- 原版抖动期间不做 `repositionneMap()` 钳制（钳制只在 `decalMap` 滚屏路径里发生），
  故 H5 同样不钳制；这意味着极端情况下抖动可能让视野边缘短暂露出地图外，与原版一致。
- 抖动是"每个阵亡实体各贡献一组"，原版是各实体各自改 `carte`（等价于叠加）；
  H5 的求和实现与之等价，但**未实测多个单位同时阵亡**时的叠加观感，如实记录。

## 第 N+21 轮成果（2026-09-28, H5 领土防御·玩家塔阵亡序列，删除灰色色块占位 + 修 nearestTurret 索敌 bug）

**本轮修掉一处直接违反"不允许任何占位/近似/色块"硬性要求的实现：被摧毁的玩家塔此前
画成一个灰色 `#333` 方块。原版其实有完整的 39 帧阵亡序列。**

### 1. 【违规发现】H5 用灰色方块表示"塔已被摧毁"

`game.js` 渲染循环里：

```javascript
if (t.hp <= 0) { ctx.fillStyle = '#333'; ctx.fillRect(-10, -10, 20, 20); ctx.restore(); continue; }
```

这既是占位色块（违反纪律），也与原版行为不符。N+20 已经为**单位**（428）做了阵亡序列，
但**玩家塔**（185）当时没一起查 —— 本轮补上。

### 2. 原版 185 的 destruction 与 428 同构（逐字对照）

`deobf/scripts/DefineSprite_185_structure/frame_1/PlaceObject2_178_etat_26 onClipEvent(load)`：

```actionscript
function destruction() {
   removeMovieClip(_parent.ptRadar);
   removeMovieClip(_parent.etatJauge);   // 血条
   removeMovieClip(_parent.ombre);       // 阴影
   _parent.tourelle.play();
   _parent.gotoAndPlay("destruction");
}
```

与 428 的 `destruction()` **函数体逐字相同**。185 的 tag 序（`swf_dump.txt`）：
- 帧 2 = `FrameLabel (name: destruction)`，库共 **39 帧**（与 428 一致）
- 帧 2 移除 dpt31(repairLogo) 与 dpt1(86)，**重新放入** 86 与 178，再放 dpt31 的 chid6
- 帧 4 放 dpt33 的 chid6；帧 7 放 dpt35 的 chid6 —— **同样是帧 2/4/7 三点爆炸**
- 帧 39 `DoAction`：`removeMovieClip(this); stop();`

### 3. 【关键差异】塔【没有车体漂移】—— 86 结构层逐帧完全不变

逐帧 SVG 实测 185 的 destruction 段：
- `chid 86`（structureDeco）的 transform **恒定** `(-38.25, -35.60)`，39 帧全等
- 我把 86 那一层 def body 做了逐帧 **MD5**：`618a886623` —— **39 帧全部同一哈希**

结论：原版塔在阵亡期间**外观完全不变**，表现完全来自叠加的三处 explosion+flame；
这与单位 428（chassis 逐帧漂移 12px）不同。故 H5 塔阵亡时**继续正常绘制塔体**，
不引入任何变形。

### 4. H5 实现

- `Turret` 新增 `dying` / `dyingFired` / `dead`（与 `Unit` 同款字段）
- `Turret.update()`：`dying>0` 时**先于** `hp<=0` 判断进入阵亡分支 —— 在 0/2/5 tick
  各生成一对 `death`(chid279, 3 tick) + `flame`(chid637, 27 tick) 特效（±10px 抖动），
  **无漂移**；归零后 `dead = true`
- `killTurret(t)`：随机 `explosion1..6` 音；**不改 euros**（185 的 destruction 段无 euros 变更，
  与 428 给赏金不同 —— 已核实）
- 渲染：删除 `#333` 色块分支，照常画塔；阵亡中不画对空标记/磁场/血条
  （对应 `destruction()` 的三个 `removeMovieClip`）
- 主循环：`G.turrets = G.turrets.filter(t => !t.dead)`（对应帧 39 `removeMovieClip(this)`），
  并清空指向已毁塔的 `G.selected`

### 5. 【顺带修掉一个真实 bug】nearestTurret 不过滤已毁塔

```javascript
function nearestTurret(x, y, range) {
  for (const t of G.turrets) {                    // ← 原实现没有 hp 判断
```

敌方单位索敌时会把**已被摧毁的塔**当成目标，持续朝废墟开火。本轮加 `if (t.hp <= 0) continue;`。
（`Turret.update()` 自身有 `hp<=0` 早退，所以塔不会反击；但敌人这一侧此前是错的。）

### 6. 真机验证

- 冒烟测试新增断言全绿：
  ```
  killTurret: dying=31 (期望 31) 随机音=explosion1
  塔阵亡不改 euros=true (5732→5732); 阵亡中重复 killTurret 无效=true
  序列 31 tick 一致=true; 三点爆炸 3 一致=true; 火焰 3 一致=true; 结束 dead=true
  塔无漂移属性=true (drift=undefined)
  已毁塔不被 nearestTurret 选中=true
  ```
- 浏览器截图：活塔外观正常（canon105/crotale/radar 三座并排，与上一版无差别）；
  tick 4 时塔身叠加真实火光（不再是灰色方块）；序列结束后塔被移除、屏幕恢复干净
- **真实玩法闭环**：放一座 m60（hp=4）到 parcourt1 路线旁，让 t90 沿路开火打它 ——
  tick 46 进入 `dying` → tick 77 `dead` 且从 `G.turrets` 移除（**差 31 tick，与 DEATH_TICKS 一致**）

### 7. 本轮如实说明

- 185 的 destruction 段里同样有 `_root.carte._x/_y` 的镜头抖动（帧 2/4/8 DoAction，
  ±6~10px），与 N+20 记录的 428 情况相同，H5 未接入（相机模型不同），如实记录。
- 185 帧 2 的 DoAction 只做镜头抖动，**没有** 428 帧 2 那样的 `euros += prixRevient` +
  随机爆炸音。我用随机爆炸音是为了与 428 一致的表现；严格说 185 的摧毁音来源未在
  frame_2 找到（可能在其他帧的脚本里），如实记录此推断。
- `FrameLabel` 里 185 还有 `special`/`obusLeger`/… 等标签（那是 185 作为"砲塔+炮弹库"
  的多用途帧标签，与 destruction 无关），本轮未涉及。

## 第 N+20 轮成果（2026-09-28, H5 领土防御·补原版单位阵亡序列 destruction + markFlame 三点爆炸）

**本轮把 N+18 记录为"未做"的 markFlame 彻底查清并接入，过程中发现它牵出的是一个
比预期大得多的真实缺口：原版单位被击毁后并不立即消失，而是播一段 39 帧的阵亡序列。**

### 1. 【缺口发现】原版有 39 帧阵亡序列，H5 此前是"瞬间移除"

N+18 只查到 `markFlame` 是"命中时创建爆炸的定位件"，本轮把整条链读通：

`deobf/scripts/DefineSprite_428_unit/frame_1/PlaceObject2_178_etat_22`（unitEtat 的 load 脚本）：

```actionscript
function destruction() {
   removeMovieClip(_parent.ptRadar);
   removeMovieClip(_parent.etatJauge);       // 血条
   removeMovieClip(_parent.ombre);           // 阴影
   _parent.tourelle.play();
   _parent.gotoAndPlay("destruction");       // ← 跳到 destruction 帧标签
}
```

序列长度与内容（`swf_dump.txt` 中 428 的 tag 序 + 逐帧 SVG 导出）：
- 标签 `destruction` 在第 **2** 帧（`FrameLabel (name: destruction)`），库共 **39 帧**
- 帧 2/4/7 各放一个 `chid 6`（`nm: markFlame` / 无名）→ 其 load 脚本各调一次
  `master_weapons.createExplosion(车体 markFlame 世界坐标, prefID=4)`（帧 4/7 无第 3 参）
- 帧 39 的 `DoAction`：`master_units.removeUnits("E", this) + removeMovieClip(this)`
  —— **序列播完才真正移除**
- 帧 2 的 `DoAction_2`：`euros += prixRevient`（赏金）+ `master_sounds["explosion"+(1..6)].start()`
  —— **赏金在阵亡瞬间就结算，并随机播 6 种摧毁音之一**

车体姿态：逐帧 SVG 显示 chassis(426) 的 `ty` 从 `-155.05` 单调漂到 `-167.05`
（**共 12px**，沿车体纵轴向后），期间无旋转、无缩放、无透明度变化。

### 2. 【关键纠正】createExplosion 用的是 chid 279 + chid 637，不是命中爆型

`createExplosion`（`deobf/pcode/scripts/frame_6/PlaceObject2_6_335` 字节码）实际是：

```
Push 26000, r2; Add2 ; Push "explosion", r2; Add2 ; ... carte.attachMovie(...)
Push 28000, r2; Add2 ; Push "flame",     r2; Add2 ; ... carte.attachMovie(...)
... "explosion"+r2.gotoAndStop(prefID 或 random 1..3)
```

pseudo 把它写成 `attachMovie(26000+i, "explosion"+i, "explosion")` —— **参数序被写反**。
以 N+18 已独立验证的 etincelle 为标定（`attachMovie("etincelle"+i)` → chid **564**，
`exports.txt` 有权威导出名），可知**第 3 个参数才是链接名**，第 1 个是 depth：

| 函数 | 链接名 | chid | 帧数 | H5 素材 |
|---|---|---|---|---|
| `createExplosion` 爆炸 | `explosion` | **279** | 4 | `assets/explosion/1..4.png`（本轮核实 = 279 的 4 帧） |
| `createExplosion` 火焰 | `flame` | **637** | 34 | `assets/flame/1..34.png`（本轮导出） |
| `createEclat` 火花 | `etincelle` | 564 | 7 | `assets/spark/`（N+18 已接入） |

→ 我此前的阵亡爆炸误用了命中爆型（390 `small`）。本轮改用 **chid 279**（原生 210×217，
原版只设 `_x/_y` 不缩放）。

### 3. 【关键坑】flame 的黑色底 + `mix-blend-mode:lighten`

`chid 637` 的 FFDec PNG 导出**黑底不透明**（34 帧全部 alpha=255，角落像素 (0,0,0,255)）。
若直接 `source-over` 绘制会盖出一块黑方块。SVG 导出给出答案 —— 该 sprite 的子件带
`style="mix-blend-mode: lighten"`，即 Flash 的 **Layer/ADD 混合**，黑底因此不可见。

→ H5 用 `ctx.globalCompositeOperation = 'lighter'` 还原该混合。**实测修正前后对比：
修正前是黑方块（明显 bug），修正后是叠加火光。** 该 sprite 第 28 帧起自带 alpha 淡出，
第 34 帧全透明，并有 `this.removeMovieClip(); stop()`（`0x96 06 00 00 74 68 69 73 00 1c 25 07 00`）
—— 播完自删，与 H5 的 `DEATH_FLAME_TICKS = 27`（34帧@24fps→30fps）一致。

### 4. H5 实现

- `DEATH_TICKS = round(39×24/30) = 31`；`DEATH_BOOM_TICKS = [0,2,5]×24/30`（对应原版帧 2/4/7）
- `Unit` 新增 `dying`（剩余 tick）/ `dyingFired`（已触发爆炸数）/ `drift`
- `Unit.update()`：`dying>0` 时**先于** `hp<=0` 判断进入阵亡分支 —— 原地滞留、按进度漂移
  `DEATH_DRIFT=12`、在 0/2/5 tick 各生成一对 `death`(279, 3 tick) + `flame`(637, 27 tick) 特效
  （各带 ±10px 抖动），归零后 `dead = true`
- `killUnit(u)`：**赏金立即结算** + 随机 `explosion1..6` 音；带 `hp>0 || dead || dying>0` 守卫
- 渲染：阵亡中 **不画武器塔、不画阴影、不画血条**（对应 `destruction()` 里三个 `removeMovieClip`），
  车体沿 `rot` 反方向偏移 `drift`
- 波次/胜负判定改为等 `dead`（不再用 `hp<=0`），避免序列没播完就清场

### 5. 真机验证

- 冒烟测试新增断言全绿：
  ```
  killUnit: dying=31 (期望 31) 赏金+50 随机音=explosion6
  赏金在阵亡瞬间结算=true 随机爆炸音在1..6=true
  序列: 31 tick 一致=true
  车体爆炸 3 个 (原版帧2/4/7 共3个) 一致=true; 火焰叠层 3 个 一致=true
  漂移量=12.0 → 序列结束 dead=true
  阵亡中再 killUnit 不重复结算=true；活单位 killUnit 无效=true
  ```
- 浏览器逐帧截图：t0 车体无塔无影无血条 → t1/t4 火光叠加在车体上 → t12 三处爆炸齐现
  → t24 火光衰减 → t31 车体漂移到位
- **真实玩法闭环**（布 10 座 canon105 打 camion1）：tick 154 进入 `dying` → tick 185 `dead`
  （差 31 tick，与 `DEATH_TICKS` 一致），赏金 +50 到账

### 6. 本轮如实说明

- 原版 `explosion`(279) 是 **`gotoAndStop(prefID)`** —— 停在某一帧上，靠该帧内的嵌套子精灵
  自带动画。H5 没有这层嵌套，改为 4 帧快播后消失（`DEATH_BOOM_TICKS_LOCAL=3`）。
  视觉上等价，但严格说不是"停在某帧"，如实记录此近似。
- 帧 4/7 的调用没有第 3 参，原版会走 `random(1..3)` 分支；H5 未区分（都是 279 的 4 帧序列）。
- 原版 `destruction` 段每帧还有 `_root.carte._x/_y` 的镜头抖动（帧 6/8/10/12 的 DoAction，
  ±4~8px）。H5 未接入该镜头抖动（现有相机模型是自由滚动，不共享此语义），如实记录未做。
- `markFlame`(chid 6) 自身是 46×46 的实心黑方块，**不是可见美术**，只作定位锚点；
  真正可见的是它触发的 279+637。N+18 的"markFlame 未接入"至此结清。

## 第 N+19 轮成果（2026-09-28, H5 领土防御·补原版 Su37 瞄准区标记 zoneBombardement chid785）

**本轮补上 N+11 已记录"未做"的真实缺口：用原版真实 SWF 素材替换侧栏按钮触发后
的"瞄准圈 CSS 近似"。**

### 1. 【缺口发现】原版的 Su37 瞄准区标记是独立 sprite，H5 此前用 CSS 圆+十字+中文近似

N+11 已知原版有 `zoneBombardement`（chid 785, dpt 17, name="zoneBombardement"，
`deobf/data/dump_tree.json:956`），但**该 sprite 不在 ExportAssets 表中**（导出名表 `exports.txt`
最末 chid 568/637/639 后无 785），所以长期当作"内部引用"被忽略。
H5 此前用一段 CSS 代码画一个红色圆圈+十字+中文"点击目标投放炸弹"作近似。

### 2. FFDec 导出与画布原点（与 173/86 同一套方法论）

```
ffdec-cli -selectid 785 -format sprite:png -export sprite /tmp/_zbtest TCS.swf
ffdec-cli -selectid 785 -format sprite:svg -export sprite /tmp/_zb_svg TCS.swf
```

PNG 导出：1 帧，**154.3×154.3** 画布（4 个角准星 + 中心十字 + 半透明绿底 + "ready" 文本）。
SVG 导出权威解码：外层 transform `matrix(1,0,0,1, 77.15, 77.15)`（= 154.3/2 居中），子件:
- 779 = 153×153 半透明绿底（fill="#ff00ff" alpha 0.498, 4 角被 784 mask 遮住）
- 781 (sub-sprite 2.3034×) → 780 = 67×67 白色内框
- 782 = 文本 "ready" Courier New (5 字符)
- 784 = 4 角准星 + 中心十字 (101×101)

**画布原点**: `ZONE_ORIGIN = { x: -77.15, y: -77.15 }`（与 173/86 同一推导：sprite 中心在 (0,0)）

### 3. H5 接入

- `assets/zone/1.png`：154.3×154.3 半透明绿底 + 4 角准星 + 中心十字 + "ready" 文本
- `ZONE_IMG`、`ZONE_ORIGIN` 常量
- 替换原 `ctx.arc + 十字 + fillText('点击目标投放炸弹')` CSS 近似为 `ctx.drawImage(ZONE_IMG, ...)`
  （保留 CSS 回退分支以防资源加载失败）
- 生命周期：原版 `_visible = false` ↔ H5 `G.su37Aiming = false` —— 已在 `su37Launch` 内
  设置（H5 上一轮 N+3 已实现，未变）

### 4. 真机验证

- 资源：`assets/zone/1.png` 154.3×154.3（FFDec 导出）
- 注入 `G.unlocker.su37=true; su37Start() → G.su37Aiming=true, side=bas` 后
  强制 `draw()` + screenshot：**画面正中偏左可见绿色 4 角准星 + 中心十字**（与 785
  真实素材一致；CSS 红色圆圈已消失）
- 模拟点击 `su37Launch(G.mx,G.my)`：`G.su37Aiming true→false`，`SU37.plane=true`
  —— zone 消失，飞机从所选边生成
- 冒烟测试新增断言通过：
  ```
  瞄准区: img=assets/zone/1.png origin=(-77.15,-77.15) 154.3px (原版 785, FFDec 导出)
  瞄准区 785 资源已接入=true
  ```

### 5. 本轮如实说明

- **原版 zone 是 154.3px 见方**（中心 77px 半径），与 `SU37.IMPACT=260`（实际炸弹
  溅射半径）**不重合**：zone 标记的是"瞄准点附近的小区域提示"，而 `impact` 是
  实际伤害范围。CSS 近似错误地按 `IMPACT=260` 画了大圆，本轮按原版大小修正。
- 785 没有导出名（不在 ExportAssets 表），所以**代码里也没有字符串引用**，纯靠
  帧库的 `name="zoneBombardement"` + `PlaceObject2` 矩阵挂接到 834 主菜单 sprite。
  H5 沿用上一轮 `G.su37Aiming` 状态机即可，不需新字段。
- 本轮未做：markFlame 差异化（N+18 标记的剩余"如实未做"项）；
  8.8%/合成 alpha 平均差 8.5/255 等遗留量化误差（按之前看板如实保留）。

## 第 N+18 轮成果（2026-09-28, H5 领土防御·补原版命中火花特效 createEclat/etincelle）

**本轮补上一处此前完全缺失、且每场战斗都会大量出现的效果。**

### 1. 【缺口发现】原版"每次命中车辆"都有火花反馈，H5 只做击杀爆炸

此前 H5 只在**击杀**时播爆炸（`boomTyped`），命中但未击杀时**没有任何视觉反馈**。
逐行读 `deobf/pcode_as/frame_6__PlaceObject2_6_327`（命中循环）发现原版每次命中都有：

```actionscript
_ = unitsEnnemies[i].localToGlobal(unit);          // 单位位置
_ = unitsEnnemies[i].unitEtat.localToGlobal(etat); // 血条位置
createEclat(unit._y + (etat.y - unit.y)/4, unit._x + (etat.x - unit.x)/4);   // ← 第 1 个
if (r8 > 8) {                                       // r8 = 本帧伤害
  createEclat(...); createEclat(...);                // ← 再 2 个 (共 3 个)
}
```

定位点 = 单位位置 + (unitEtat 偏移)/4 —— 即**车体中心偏上**（`unitEtat` 在 428 内 t=(0,-60)）。

### 2. `createEclat` 与素材 etincelle（chid 564）

`master_weapons.createEclat`（`..._6_335` 第 40 行起）：

```actionscript
r3 = getIEclat();                                  // 循环 id 0..999
carte.attachMovie(27000 + r3, "etincelle"+r3);     // 27000 → chid 564
carte."etincelle"+r3._rotation = Math.random()*360;
carte."etincelle"+r3._x = X + (Math.random()*16 - 8);   // ±8px 抖动
carte."etincelle"+r3._y = Y + (Math.random()*16 - 8);
```

素材 `chid 564`（`exports.txt` 第 85 行 `ExportAssets (chid: 564, ex: etincelle)`）：
FFDec 导出 7 帧、53×4 画布，内容是**亮黄→白→灰的火花拖尾**（逐帧向左移动 = 飞散动画）。

**画布原点推导**（与炮管同一套方法论）：FFDec 的 SVG 导出给出该 placement 的内容变换
`matrix(1,0,0,1, 51.8, 2.3)`，即"火花发源点"在 sprite 局部 (0,0) → 画布左上角在局部
`(-51.8, -2.3)`；frame1 内容 bbox `x[50,52]` 中心 51 ≈ 51.8 交叉证实。

### 3. H5 实现

- `assets/spark/1..7.png`（7 帧）；`SPARK_FRAMES` / `SPARK_ORIGIN{(-51.8,-2.3)}`
  / `SPARK_TICKS = round(7/24*30) = 9`（SWF 24fps → H5 30fps）
- `spawnSpark(x,y)`：位置 ±8px 抖动、随机旋转 0–2π、寿命 SPARK_TICKS
- `createEclat(x,y,power)`：**1 个；power > 8 时再 2 个（共 3 个）** —— 严格照搬原版判断
- `shellHit()` 内接入：对**每个实际受损单位**调用一次 `createEclat(u.x, u.y-8, power)`
  （用 `Set` 去重，避免溅射三段对同一目标重复触发火花）
- `G.sparks` 状态 + tick 递减 + draw 渲染（随 zoom 缩放、绕火花起点旋转、迷雾中不绘制）

### 4. 真机验证

- 素材：7 帧全部加载（53×4）
- 数量规则：威力 20 → **3 个**；威力 8 → **1 个**（8 不 >8，边界正确）；威力 3 → **1 个**
- 抖动 |d|max = 6.9 ≤ 8；旋转范围合法；存活 **9 帧**后消失（与 SPARK_TICKS 一致）
- 实战 200 帧：2 次命中 → `maxConcurrent=3`，24 帧画面含火花，敌人 HP 正常下降
- 视觉截图确认：亮黄色火花粒子以随机角度散布在装甲车体上

### 5. 本轮如实说明

- 火力溅射（SPLIT 三段）会让同一单位在同一发炮弹内被扣血多次，但原版的 `createEclat`
  在**每次命中循环里只对每个单位触发一组**（源码中三次调用属于同一次命中、由伤害阈值决定），
  故 H5 用 `Set` 对受损单位去重后每组触发一次。此为对源码结构的解读，
  若后续发现原版对溅射边缘单位也各触发一组，需再调整——如实记录此判断。
- `unitEtat` 偏移我取 `-8px`（由 428 内 t=(0,-60)、scale y=2 推得的 (0,-30) 再按车体尺寸折中）。
  该值只影响火花在车体上的高低位置，不影响机制正确性；未做逐像素对齐。
- `markFlame`（chid 6）经核实是**车辆被击中时在其标记点创建爆炸**的定位辅助件
  （`_parent.markFlame.localToGlobal(...)` → `createExplosion`），与 `etincelle` 是同一命中链的
  两种表现；本轮接入的是更普遍的 etincelle，markFlame 的具体差异（仅 3 个 chassis 帧带脚本）
  留待后续核对，如实记录本轮未做。

## 第 N+17 轮成果（2026-09-28, H5 领土防御·修正 idle 自转模型：区分"整帧即自转件"与"叠加件"，消除重影）

**本轮修掉上一轮自己留下的未完成项：radar 的 8.8% 重影，降为 0。**

### 1. 【穷举】173 库全部 enterFrame 自转脚本（上一轮清单不完整）

上一轮我只 grep 到 3 处（f7/f20/f25），本轮穷举 `DefineSprite_173/` 下**全部**
`*onClipEvent(enterFrame)*` 脚本，得完整 5 条：

| 帧 | 武器 | depth | 子件 | 代码 |
|---|---|---|---|---|
| f7  | radar          | d1  | 115 | `_rotation += 2` |
| f8  | crotale        | d2  | 121 | `_rotation += 10`（上轮漏记，脚本在 `PlaceObject2_121_2`） |
| f13 | radarMobile    | d1  | 115 | `_rotation += 4` |
| f13 | radarMobile    | d4  | 115 | `_rotation -= 12` ← **反向** |
| f20 | crotaleAbrams  | d4  | 121 | `_rotation += 10` |
| f25 | navireCrotale  | d24 | 121 | `_rotation += 10` |

### 2. 【根因】上一轮重影的来源：没区分两类自转

上一轮我统一做成"整帧静态 + 叠加自转件"。但按 `turret_layout.json` 逐帧组成枚举发现，
**两类武器的整帧含义完全不同**：

- **A 类「整帧即自转件」**：该武器整帧**只由自转件构成**
  - `radar` f7 = `[115]`（唯一部件就是那个碟盘）
  - `radarMobile` f13 = `[115, 115]`（两个反向自转）
  → 整帧图**本身就是自转件**。此时再叠加一个自转件 = 同一物画两遍 ⇒ 重影。
  → 正确做法：**让整帧随自身自转**（radar），或**逐件各转各的**（radarMobile 两件反向）。
- **B 类「整帧含基座+自转件+炮管」**：`crotale` f8 / `crotaleAbrams` f20 / `navireCrotale` f25
  → 整帧里自转件被 FFDec 烘成静态姿态 ⇒ 叠加同位置自转件覆盖它（位置已验证一致）。

### 3. H5 实现

- `LIB_SPIN`（A 类，整帧自转）：`radar { chid:115, deg:2, t:[1.95,8.10] }`
  `drawLibSpin()` 绕 placement 的 `t` 旋转整帧。
- `RADARMOBILE_SPIN`（A 类特例）：两个 115 各按 `+4°` / `-12°` 独立自转，
  `drawRadarMobileSpin()` 逐件渲染（**不能**整帧旋转，否则两件无法反向）。
- `IDLE_SPIN`（B 类，叠加）：crotale 三型（chid 121）。
- `drawSpinDef()` 抽出为公共子件绘制函数；玩家塔与敌方单位两条渲染路径按 A/B 分派。
- 速率换算统一：原版 deg/帧 @SWF 24fps → H5 30fps（radar 2°→1.6°，crotale 10°→8.0°）。

### 4. 真机验证（本轮核心指标：重影消除）

- **0° 时整帧自转 ≡ 纯整帧贴图**：像素数 5970 完全相同，质心 (205.65, 274.39) 分毫不差
  → 重影 **0%**（上一轮为 8.8%）。
- 自转确实生效：雷达 4 个相位（0/9/18/27 帧）逐帧差异 7622 → 8162 → 9025 像素，天线平滑转动。
- 多塔同场景：radar/crotale/crotaleAbrams/navireCrotale/radarMobile 五处 f0 vs f40
  共 2650 像素变化，全部在动。
- 冒烟新增断言：A/B 两表 chid 与权威一致、m/o 完整、**两表无重叠**（radar 不得同时进两表，
  否则又变重复绘制）、速率换算正确。

### 5. 本轮如实说明

- 上一轮记录为"未做到干净抠除静态件、重影 8.8%、属取舍"——本轮查明那不是取舍问题，
  而是**模型错误**（radar 本不该叠加）。已按权威组成枚举修正，重影归零。
- `radarMobile` 的 `-= 12` 是从混淆脚本 `eval("u189u156")["\":a\x03"] -= 12;` 读出的
  运算符与数值（同帧另一件为 `+= 4`）；SWF 层面无法再交叉验证运算符语义，
  依据是 **A/B 两件必须有相反方向才符合"双碟反向扫描"的可见形态**，如实记录此推断。
- f26 Yamato460 等 9 件武器仍为纯静态（无自转脚本），未做额外处理。

## 第 N+16 轮成果（2026-09-28, H5 领土防御·补持续 idle 自转动画；底盘核实为不可见）

**本轮补上原版的"塔会自己动"效果，并推翻了自己一个中途的错误判断。**

### 1. 【新发现】原版塔有持续的 idle 自转（H5 此前完全没有）

扫描 `deobf/scripts/DefineSprite_173/` 全部 `onClipEvent(enterFrame)`，得两处持续旋转：

| 出处 | 子件 | 代码 | 含义 |
|---|---|---|---|
| `frame_7` (radar) | chid **115** | `this._rotation += 2;` | 雷达天线**慢速扫描** |
| `frame_20` (crotaleAbrams) | chid **121** | `this._rotation += 10;` | 导弹发射架**快速自转** |
| `frame_25` (navireCrotale) | chid **121** | `this._rotation += 10;` | 同上 |

另有 `DefineSprite_86/frame_1/PlaceObject3_54_1`：`this._rotation = Math.random()*360;`
（给塔底盘随机初向 —— 后证实该件不可见，见第 2 节）。

权威依据补充：SWF 字节解析确认 115/121 的 placement 均带 **HasClipActions=True**
（flags 0x0096）→ 它们是**独立 MovieClip**，各自跑自转脚本，非烘平的静态件。

H5 实现（`IDLE_SPIN` + `drawIdleSpin()`）：
- 表含 chid、`degPerSWFFrame`、placement 的 `scale` 与 `t`（取自 turret_layout.json，已逐一核对）
- 子件画布原点经反解校准：115 → (-11.07,-8.98)、121 → (-12.00,-15.25)
- 旋转速率按 SWF 24fps → H5 30fps 折算
- **修掉一个变换 bug**：原先写成 `translate(t) → scale(s) → drawImage(origin)`，
  这会把 origin 也乘一次 scale 导致错位；改为 `translate(t) → rotate → drawImage(origin*s, size*s)`
- 玩家塔与敌方单位两条渲染路径都已接入
- 真机验证：f0 与 f60 帧间 3246/19600 像素不同（雷达天线确实在转）；
  自转件局部 bbox x[-22.17,25.33] y[-9.17,24.67] 与权威期望 x0=-21.98 y0=-11.30 误差 <2px

### 2. 【自我纠错】塔底盘 shape53 经权威核实"不可见" —— 我中途一度误加回去

- 现象：86 库 12 帧**全部**含 `d1:54`（内嵌 shape53，bounds 40.8×40.8px，单条 evenodd 路径）。
  FFDec 的 shape PNG 导出该图**全透明**，但其 **SVG 导出给出 `fill="#ffffff"`（白色）**。
- 我据此一度判定"FFDec 漏导了白色圆盘基座"并光栅化补上 —— **这是错的**。
- 反证链：
  1. FFDec 导出的**父容器 185**（含 86+174+178+184 四层）全 39 帧**白色像素 = 0**
  2. 从 SWF 原始字节定型：shape53 是 **DefineShape3（RGBA 填充）**，唯一填充
     = 纯色 **RGBA(255,255,255,0)** → **alpha = 0，完全透明**
  3. SVG 导出**丢了 alpha 通道**才显示成白色 —— 这正是我误判的来源
- 结论：该 shape 是透明占位（疑为 hit-area 或历史遗留），**不产生任何可见像素**。
  H5 **不渲染**它（已回退，删除临时资产与代码），与 FFDec 的 185 导出结果一致。
- 教训：**颜色类素材不能只信 SVG/PNG 导出的 RGB，必须核 alpha**（尤其 DefineShape3+）。

### 3. 本轮如实说明

- 第 2 节的错误判断在代码注释与看板中**显式记录**（含反证与教训），不做掩盖；
  临时生成的光栅化资产 `assets/turretlib/base/` 已删除，仓库无残留。
- idle 自转件（115/121）**已被 FFDec 烘进 173 整帧**（实测 f7 碟盘区 623 像素与
  115 缩放后 100% 重合），故 H5 叠加自转件会覆盖该处静态姿态。
  两者位置一致（误差 <2px），观感即"天线在转"；zoom=1 下重影差异约 8.8% 像素。
  **如实记录**：未做到"从整帧中干净抠除静态件再叠自转件"，因为该碟盘与 173 其他
  部件像素相邻，抠除会伤及主体；当前方案位置正确、动态正确，是取舍结果。

> **⚠️ 上述 8.8% 重影问题已在第 N+17 轮解决** —— 不是"取舍"而是**模型错误**：
> `radar` 的整帧**只由自转件构成**（f7 = `[115]`），本就不该叠加，改为整帧自转后重影归零。
> 详见本轮（N+17）第 2 节。

## 第 N+15 轮成果（2026-09-28, H5 领土防御·纠正上轮误判：86 库是玩家塔结构层，恢复双层渲染）

**本轮推翻并修正了上一轮的一个错误结论。**

### 1. 【纠错】86 库不是"线框标记层"，而是玩家塔的结构底座层

上一轮我判定 86 库为"黑色线框标记层、不能用作外观"并整个弃用。**这个判断是错的**，
错在只看像素颜色统计（平均 RGB≈0）就下了结论，没有放大看内容、也没有查原版如何调用它。

权威反证（`deobf/scripts/DefineSprite_185_structure/frame_1/PlaceObject2_86_1 onClipEvent(load)`）：

```actionscript
var structure = _parent.structure;      // structure = 武器名 (m60/gatling/...)
this.gotoAndStop(structure);            // 86 库按【武器名】跳帧
```

- 86 库恰好 **11 帧**，标签 `m60, gatling, canon75, canon105, canon105D, radar, crotale,
  canon125, MLRS, pluton, MTHEL` —— 与 173 库的**前 11 个武器名完全同名**。
- 放大到白底逐帧看（本轮重做的检查）：**86 f6 = 完整雷达站结构**（天线杆+碟座+基座）、
  **86 f10 = 完整导弹发射结构**（上下横向基座+中央导轨+红蓝指示灯）、
  **86 f4 = X 形驻锄支架**。它们是真实的结构外观，只是配色偏黑灰（原版就是这种深色金属件）。

### 2. 原版结构：玩家塔 = 86 结构层 + 173 塔体层 双层

`DefineSprite_185_structure` 的显示列表（deobf/data/turret_layout.json）：

| depth | chid | 名称 | 作用 | 矩阵 |
|---|---|---|---|---|
| 1 | 86 | `structureDeco` | **结构底座层** | identity，**不随瞄准旋转** |
| 24 | 174 → 173 | `tourelle` | **炮塔/炮管层** | identity，**随 rot 旋转** |
| 26 | 178 | `unitEtat` | 血条 | — |
| 31 | 184 | `repairLogo` | 自动修理磁场 | — |

两层在 185 内**都是 identity 变换** → 共用同一武器局部坐标系，各自画布原点直接叠加即可。

### 3. 合成验证（离线像素级）

按上述规则合成，逐例确认严丝合缝：

- 86 f6(雷达支架) + 173 f7(碟盘) = **完整雷达站**
- 86 f4(X 形驻锄) + 173 f5(炮管) = **完整 105mm 炮塔**
- 86 f10(发射结构) + 173 f11(导弹本体) = **完整 pluton**

**86 库画布原点经 union 验证**：全帧 union = 76.49×76.49 ≈ FFDec 导出实测 76×76
→ 原点 **(-38.20, -35.55)**（与 173 库的 (-21.98, -76.30) 同属武器局部坐标系）。

### 4. H5 实现与 1:1 验证

- 新增 `TURRET_BASE_ORIGIN` / `TURRET_BASE_FRAME` / `turretBaseImg()`（86 库结构层）。
- 玩家塔渲染改为**先画 86 结构层（不旋转），再 save/rotate 画 173 塔体层 + 开火炮管叠加**。
  敌方单位容器 `unit(428)` 内含 `chassis(426) + tourelle(174)`，其炮塔同样走 173 库，
  无 86 结构层 —— 与 H5 现状一致。
- **1:1 像素对照**（决定性验证）：把浏览器画布中 canon105 塔周围 60×110 像素
  原样导出，与按原版规则离线合成的同尺寸图并排比对 —— **逐像素一致**
  （炮管 + X 形驻锄 + 底座完全重合）。

### 5. 本轮如实说明

- 上一轮的错误结论已在看板与代码注释中显式标注为"上轮误判"并给出反证，
  不做掩盖；冒烟测试的旧断言（"旧 86 库变量已删除"）已同步更正为新断言
  （"86 库 11 帧 = 玩家 11 种武器，双层齐全"）。
- 86 库只覆盖玩家 11 种武器；敌方 15 种武器（m60Brad/75mmBrad/…/Yamato460）没有对应的
  86 结构层，原版即是如此（敌方用 `unit(428)` 容器，无 structureDeco）。

## 第 N+14 轮成果（2026-09-28, H5 领土防御·炮塔外观库纠正 + 权威逐件矩阵 + 开火动画修复）

**本轮解决用户长期反馈的"炮塔/机枪用错资源"，并修掉一个开火动画恒不播放的真 bug。**

### 1. 【根因，N+15 已修正】86 库不是炮塔外观，而是黑色线框标记层

> **⚠️ 本节结论已被第 N+15 轮推翻，保留原文以记录判断过程。**
> 正确结论：86 库是**玩家塔的结构底座层**（structureDeco），必须与 173 塔体层叠加使用。
> 详见本轮末尾"第 N+15 轮成果"。

- 用 FFDec `-selectid 86 -format sprite:png` 导出全部 11 帧，逐帧统计：
  **平均 RGB≈0（纯黑描边），彩色像素占比 0%**；肉眼可见是箭头 / 十字 / 方框 / 叉等标记图形。
- ~~结论：`DefineSprite_86` 是原版用于画轮廓/参考线的辅助层，**不是武器外观**。~~
  **（错）** 漏查了 `DefineSprite_185_structure` 里 `this.gotoAndStop(structure)` 这行 ——
  86 库按武器名跳帧、是塔的结构层；放大看 f6/f10/f4 分别是完整的雷达站/发射架/驻锄。
- 真正的外观库是 **`DefineSprite_173`**（26 帧，帧标签=武器名，全部上色完整）。
  （此句仍正确，前半段修正为：173 是**塔体/炮管层**，与 86 结构层叠加）

### 2. 【权威】逐件 PlaceObject 矩阵解析（deobf/turret_layout.py）

- 关键教训：**FFDec dumpSWF 文本已正确解码 PlaceObject2/3 的全部字段**（含带 rotate 的
  matrix 与 instance name），远比手写二进制解析可靠。改为「dump 文本取 (chid,depth,name)
  + 二进制补 matrix」，并用「tag 偏移必须落在本 sprite 字节范围内」判定边界。
- 产出 `deobf/data/turret_layout.json`：86/173/427 三库每一帧的
  `{chid, depth, name, isSprite, m=[a,b,c,d,tx,ty](px), bounds}`。
- 交叉验证：矩阵值与 FFDec dump 权威值逐一吻合
  （例 canon105 chid108 `scale=0.6382 t=(0,-4.15)`；Yamato 四联装各带 `0.0022` 微旋）。

### 3. 【权威】画布原点 —— 三路独立验证收敛

FFDec 对同一 sprite 的所有帧导出**统一画布**（86 库全 76×76，173 库全 48×143）。
画布原点（相对武器局部系）用三种独立方法测定，结果一致：

| 方法 | 173 库原点 | 说明 |
|---|---|---|
| 12 个独立部件模板匹配 | (-21.98, -76.30) | 跨 12 帧，标准差 <0.31px |
| 修正后解析器全帧 union | (-22.15, -76.20) | 画布 48.41×143.54 ≈ 实测 48×143 |
| 单部件相减反解 (chid 110) | (-22.00, -76.10) | 与整帧像素对照 |

→ 取 **(-21.98, -76.30)** 为 `TURRET_LIB_ORIGIN`。

### 4. H5 渲染改造

- **整帧渲染**：`turretLibImg(id)` 直接贴 `assets/turretlib/173/<帧号>.png`，
  部件相对位置由原版权威矩阵决定，不再手工拼装。玩家塔与敌方共用 173 库
  （`PLAYER_ETURRET` 简化为同名映射）。
- **删除**：`TURRET_SRC` / `TURRET_IMG`（86 库单帧）、`ETURRET_PARTS`（手工拼装表）、
  `partImg` / `gunFramePath` / `ETURRET_PARTS[..]` 等旧调用，smoke 断言确认三者已 `undefined`。
- **炮管开火叠加**（`TURRET_GUNS` + `drawTurretGuns`）：依据原版
  `deobf/pcode_as/DefineSprite_174...` 第 340 行 `canonN.gotoAndPlay("fire")` ——
  **只让 named 炮管部件（canon1/canon2/…）播开火序列，底座不动**。
  表由 `deobf/data/turret_guns.json` 生成，含每件的 matrix 与 PNG 画布原点。
  多管武器名序已核实：canon105D=`[canon1,canon2]`、Yamato460=`[canon4,canon1,canon2,canon3]`。

### 5. 【真 bug 修复】开火动画恒不播放

- 上轮遗留的 `FIRE_TICKS` 用**武器名**查一张按 **chid** 索引的表 → 结果恒为 `undefined`，
  `fireT` 永远是 0，开火动画从不播（烟测当时未覆盖到）。
- 改为 `fireTicksFor(武器名)`：从 `TURRET_GUNS` 找该武器的炮管，取最长 fire 序列长度。
- 真机验证：`canon105` 得 `ticks=24`，`fireT=16` 时实际取用第 10 帧且素材已加载；
  实跑 120 帧观测到 58 次开火帧、`maxFireT=34`、击杀计分正常。

### 6. 开火帧表按像素重测（修正上轮两处误判）

- 上轮把 sprite **80**(pluton) / **161**(crotaleTigre) 标为"无开火帧"——因为只看
  了"从帧 2 起的连续段"，漏掉后段真正的开火动画（80 在 148-186，161 在 30-46）。
- 漏了 **83**(MTHEL 激光)：实测 2-21 帧为激光束扩张→收缩。
- 现按「`fire` 标签帧号 + alpha>40 逐帧内容量」重测全部 13 支炮管，
  只保留有内容的帧（全空帧跳过）。MLRS 102 帧的超长序列经抽样确认是火箭齐射，属实。

### 7. 顺带核实：Yamato 尺寸

- 移除 H5 里凭空写的 `big = u.type==='Yamato' ? 2.4 : 1`。
- SWF 权威：单位帧库 426 所有车体 `scale=(1,1)` 原生尺寸；Yamato 车体 shape 425
  bounds = **78.80 × 283.80 px**（本就是巨型战列舰，无需放大）。带 2.4 会变成 682px，是错的。

### 本轮如实说明

- 炮管叠加的**逐件原点**采用「该 sprite 首帧 bounds 的 min」。合成对照测试显示
  与真值 alpha 平均差 8.5/255（差异像素 268/6896 ≈ 3.9%），肉眼一致；
  但未做到逐像素精确（受 FFDec 缩放采样与 CXFORM 影响），如实记录。
- `radar` / `radarMobile` 无 named 炮管（原版是旋转扫描，非开火），
  已在 smoke 中显式列出，不做炮管叠加。

## 第 N+13 轮成果（2026-09-28, H5 领土防御·原版解锁机制 + 自动修理磁场）

**本轮补上两个原版核心机制 (此前 H5 完全缺失)**

### 1. 每波结束二选一：解锁武器 / 利息 +3%

反编译证据链（全部来自权威脚本，非推测）：

| 环节 | 出处 | 内容 |
|---|---|---|
| 解锁表初值 | `frame_6/PlaceObject2_6_333 onClipEvent(load)` | `unlocker.m60/gatling=true`，其余 false；`weaponsToUnlock=["crotale","canon125","MLRS","MTHEL","pluton"]`；`iUnlock=0`；`unlockerLength=5` |
| 自动解锁时间线 | `DefineSprite_834/frame_1/PlaceObject2_773_189` `newEvents` | `mR==7→canon75`、`11→canon105`、`16→canon105D`、`27→radar`、`31→su37`；另 `18/20/27/31/37/39` 调 `showPanelForUnlock()` |
| 解锁函数 | `pcode_as/frame_6__PlaceObject2_6_333` `unlockNextWeapon` | `iUnlock==unlockerLength → return false`；否则 `weaponsToUnlock[iUnlock]=true; iUnlock++` |
| 面板函数 | 同上 `showPanelForUnlock` | `debloquerArme._x=400; _y=300; lockItem=false`；文案 `"you can unlock the <X>" + "\n" + "or increase your interest rate to " + (interest+3) + "%"` |
| 解锁按钮 | `DefineSprite_989/frame_1/PlaceObject2_988_6 on(press)` | `lockItem` 守卫 → `unlockNextWeapon()` → 成功播 `creationUnite` + `_alpha=45` + `_parent._x=-500`；失败播 `cannot` |
| 利息按钮 | `DefineSprite_989/frame_1/PlaceObject2_988_3 on(press)` | `lockItem` 守卫 → `interest += 3` → `_alpha=45; _parent._x=-500` |
| 按钮文本 | 两个 `onClipEvent(load)` | `"unlock the next weapon"` / `"increase interest"` |
| 利息结算 | `953/frame_30` + `pcode_as/frame_6__PlaceObject2_6_329 giveIntrest` | 每波结束 `euros = floor(euros × (1 + interest/100))`，第 1 波后不给 |
| 触发时机 | `953/frame_2 DoAction` | 两波之间剧情段调 `_root.events()`，此时 `mR` = 即将开始的波号 |

**H5 实现**（`territory-defense/game.js`）：
- `SHOP` 去掉 `unlock` 波数字段，改为全部读 `G.unlocker`；初始只 `m60`/`gatling` 可选（商店 11 项 / 9 项灰锁）
- 新增 `AUTO_UNLOCK` / `PANEL_WAVES` / `WEAPONS_TO_UNLOCK` 表 + `unlockNextWeapon()` / `autoUnlockForWave()` / `showPanelForUnlock()` / `panelPickUnlock()` / `panelPickInterest()`
- `endWave()` 用 `nextWave = G.wave + 1` 查表（对应原版 `events()` 在下一波前调用），命中 `PANEL_WAVES` 则弹面板且**不推进 `interWave`**
- 面板打开时 `tick()` 冻结波次调度；`lockItem` 守卫防连点（与原版一致）
- Su37 空袭按钮加 `G.unlocker.su37` 解锁门（原版 m31 才出现）
- `index.html` 新增 `#unlockPanel`（舞台居中，对应原版 `_x=400 _y=300`）

**真机验证**（browser-use，http://127.0.0.1:8123）：
- 开局：商店 11 项 / 9 锁定；Su37 按钮 `disabled=true` 文案"Su37 未解锁"
- 波 6 结束 → `canon75=true` 自动解锁，无面板，`interWave=200`
- 波 17 结束 → 弹面板，文案 `你可以解锁 "125mm 炮" / 或把利率提到 9%`
- 真实点击"解锁 响尾蛇导弹" → `crotale=true`、商店锁定 9→8、面板关闭、`interWave=188`（波次恢复）
- 真实点击"利率 → 9%" → `interest 6→9`、`hInt2` 显示 `interest 9%`、`iUnlock` 不变（1）
- 面板打开时跑 60 帧 `tick()` 波次冻结；关闭后 3 帧恢复推进

### 2. 自动修理蓝色磁场（原版剧情明文记载的视觉）

反编译证据链：

| 环节 | 出处 | 内容 |
|---|---|---|
| 伤害循环触发 | `frame_6/PlaceObject2_6_327` | `if (unitsAlliees[i].repairLogo.autoRepair) unitsAlliees[i].structureDeco.autoRepair()` |
| 修理函数 | `DefineSprite_185/frame_2/PlaceObject2_6_31 autoRepair()` | 扣 `priceToPay = 2*(maxHP-curHP)`；`etat=etatMax`；`repairLogo.light.gotoAndPlay(1)` + `repairLogo.light2.gotoAndPlay(1)` |
| 磁场精灵 | SWF dump `DefineSprite (chid:183)` | 7 帧：shape 77 → 179 → 180 → 181 → 182 → RemoveObject2（空白帧） |
| 权威配色 | `PlaceObject3 light/light2`（body 0x5a796 / 0x5a7f4） | `chid=183`，CXFORM `mult=[0,0,0,256] add=[153,204,255,0]` → 纯 **#99CCFF** |
| 权威尺寸 | 同上 + `structure(185)` 内 `PlaceObject2 repairLogo` | sprite184 内 `scale=0.05537, t=(-170,-170)`；sprite185 内 `scale=2.07898, t=(0,0)` → 净直径 ≈ 35px，居中塔身 |
| 深度 | `structure(185)` 子件 | `structureDeco dpt=1` < `tourelle dpt=24` < `repairLogo dpt=31` → 磁场画在塔身**之上** |
| 时长 | SWF 头 | 24fps × 7 帧 ≈ 0.292s |
| 剧情佐证 | `frame_6/PlaceObject2_980_242` | *"Every time a turret is auto-repaired, a blue magnetic field appears around it."* |

**H5 实现**：
- 新增 `deobf` 侧生成脚本流程：FFDec `-selectid 183 -format sprite:png` 导出 7 帧 → 按 CXFORM 把纯白渐变重着色为 `#99CCFF`（保留原 alpha 通道），存 `assets/repair/light_1..7.png`
- `MAGNET_FRAMES`(7) / `MAGNET_FPS`(24) / `MAGNET_DIAM`(35) / `MAGNET_TICKS = round(7/24*30) = 9`
- `Turret.magnetT`：`autoRepair` 实际修理到 HP 时触发；`magnetT===0` 才重开（**与原版 `gotoAndPlay(1)` 语义一致：持续修理 → 持续重播光环**）
- 绘制位置在塔身之后（对应 dpt=31 最高层）

**真机验证**：7 帧素材全部 `complete && naturalWidth`；像素级开关对比 —— 开 `magnetT=9` 时塔周围 50×50 窗口内 34 px 均色 `rgb(149,199,248)≈#99CCFF`，关时 0 px；截图可见炮塔上方的蓝色光晕

### 本轮如实说明

- 原版 `newEvents` 里 `m25` 额外 `euros += 2400`、`m26/m59` 播 `edithStart` 语音等**剧情奖励**未接入（H5 已去剧情，只保留与玩法/经济相关的解锁与利息）
- `su37` 在原版是 `menu.constructionCont` 里的建造项；H5 架构里 Su37 走侧栏按钮，故只把解锁门挂在按钮可用性上（视觉与玩法效果等价）

## 资源还原看板（第 7 轮更新）

| 项 | 状态 | 产出 |
|---|---|---|
| 脚本反混淆 | ✅ 940/940 | deobf/scripts/ |
| 玩法数据 | ✅ 100% | deobf/data/ (weapons/structures/missions/unitPhysics) |
| 核心函数语义 | ✅ 7/7 | GAME_LOGIC.md F 节 + pcode_as/ |
| 地图背景 | ✅ 764.jpg 2070×1920 (chid764, carteBase766内) | territory-defense/map.jpg |
| 路点坐标 | ✅ 39/39 (FFDec dumpSWF 权威偏移) | deobf/data/waypoints.json |
| 路线顺序 | ✅ 4 条与源码核对一致 | data.js ROUTES |
| 单位素材对号 | ✅ 12 种 (426 帧库: camion1=402...Yamato=424) | sprites.json + territory-defense/assets/units/ |
| 声音映射 | ✅ 37 soundFx + 3 BGM + 17 环境音 | sounds.json |
| 炮塔素材对号 | ✅ 玩家塔双层 (86 结构层 + 173 塔体层) + 敌方 15 种 173 库 | turretlib/86 (11帧) + turretlib/173 (26帧) + turret_guns.json |
| UI 素材对号 | ✅ 建造菜单 1025 库 (assets/menu/) / INFO 面板 / 小地图已接入 | game.js + index.html |
| 爆炸特效接入 | ✅ 279 的 4 帧 + 分型 (390/392/394/395/396) 动画按半径缩放 | assets/explosion/ |
| 反混淆/矩阵数据 | ✅ turret_layout.py → turret_layout.json / turret_guns.json | deobf/data/ |
| 浏览器视觉验证 | ✅ 每轮 browser-use 真机截图 + 1:1 像素对照 | — |
| BGM 接入 | ✅ bgm_main.mp3(=1157, hellMarch候选) 循环播放, M 键静音; 原始文件待试听最终确认 | assets/music/ |
| tigre 直升机图 | ✅ chid157 矢量渲染图 tigre.png 已接入 | assets/units/ |
| 建造区规则 | ✅ 道路中心线 45px 内禁建 (surfaceForBuild 的几何实现) | game.js |

## 第 7 轮成果（2026-09-27）

- **地图坐标系彻底打通**（改用 FFDec `-dumpSWF` 权威输出，弃手写解析）：
  - carte = chid 834，carteBase = chid 766，背景位图 = chid 764 (2070×1920)
  - DefineShape 765 bounds 解码：X[0,2070] Y[0,1920] → 路点坐标即位图像素坐标系
  - 39/39 路点矩阵提取（begin 126,580 … r10 93,-1563），t12/h4 缺失问题解决
- **12 种单位素材对号**：426 帧库帧标签即单位名，shape→fill-bitmapId 链提取（camion1=402.png … Yamato=424.png），已拷入 territory-defense/assets/units/ 并接入渲染
- **声音系统完整破解**：37 个 soundFx、3 首 BGM（actOfInstinct/hellMarch/justDoItUp 循环，文件在 1081-1157 无导出名 mp3 中）、17 个 b01-b17 鸟叫环境音（每 10 秒 playBirds）
- **炮塔外观库定位**：86=玩家炮塔库、173=敌方武器塔库 22 帧（全部对齐 typeData 名）、1025=建造菜单按钮库
- **smoke_test 修复**：draw/hud stub 开关 + 450 帧（根治无头卡死），迷雾/对空升级/经济闭环全绿
- 已推送 GitHub（91dba0d）

## 第 8 轮成果（2026-09-27）

- 炮塔原版外观接入（86 帧库 shape PNG：炮管旋转 / radar·MLRS·pluton·MTHEL 整图）
- 爆炸 4 帧动画接入（按效果半径缩放）
- BGM 循环播放（浏览器自动播放策略：首次交互启动，M 键静音）
- tigre 直升机渲染图接入（chid157）
- 建造区规则：敌军道路中心线 45px 内禁建
- smoke_test 全绿（Audio stub 补齐）

## 第 9 轮成果（2026-09-27）

- **建造菜单原版武器照片接入**：1025 帧库 12 张按钮图（m60.png...su37.png，原版真实武器照片风格）→ H5 商店按钮图文化
- **BGM 三曲循环**：时长权威判定（mutagen）1082=66.1s / 1157=46.2s / 1084=18.3s 为最长三曲 → 对应原版 musics 循环（actOfInstinct/hellMarch/justDoItUp），onSoundComplete 自动切下一首已还原
- **Yamato 战斗音乐**：终波 Yamato 出场自动切换 bgm_alt（原版 yamatoBattle 标志还原）
- smoke_test 全绿

## 第 10 轮成果（2026-09-27）

- **小地图接入**（原版右上角 152px minimap）：地图缩略 + 塔点(绿)/雷达点(蓝)/可见敌人(红) + 视口框 + 点击跳转摄像机；绘制于迷雾之上
- **INFO 面板**：选中塔显示 名称/对空状态/HP/伤害/射程/冷却/炮管数（原版 informations 面板还原）
- smoke_test 全绿

## 第 11 轮成果（2026-09-27）

- **原版音效全面接入**：20 个音效文件拷入 assets/sounds/，轮换池 SFX 引擎（3 实例/音效防重叠切断）
  - 开火音按武器对号（m60/gatling/c75mm/c105mm1/c105mm2/c125mm/crotale/mlrs）
  - 爆炸音按威力分级（>=200 explosionLarge / >=100 explosionMlrs / 其余随机 1-3）
  - 建造 creationUnite、击杀随机爆炸、敌人突破基地失败
- **波次来袭横幅**：第 N/44 波 + 路线方向警告（南方公路/西侧小路/北面空降/海上航线）
- **score 修正**：击杀赏金计入 score（原版 score 语义为损失惩罚，此处记战果，H5 设定）
- smoke_test 全绿

## 遗留（下一轮从看板 ❌ 项继续）

**状态：脚本反混淆主体完成 (100%)** — 2026-09-27

## 成果总览

| 阶段 | 结果 |
|------|------|
| 脚本总量 | 940 个 ActionScript 文件 |
| 状态机线性化 | **343/343 全部成功，0 失败** |
| 干净直通（未混淆） | 597 个 |
| 常量池解析 §§constant | 161/162 文件完成（868 处引用） |
| 输出目录 | `deobf/scripts/`（与源目录结构镜像） |

## 工具链用法

```bash
# 1. 状态机还原 (decompiled → deobf/scripts)
python3 deobf/deobfuscate.py                     # 全量
python3 deobf/deobfuscate.py --file <单个.as>    # 调试单文件
python3 deobf/deobfuscate.py --limit 50          # 前 50 个

# 2. P-code 导出（常量池来源，已完成，产物在 deobf/pcode/）
./ffdec/ffdec-cli.exe -format script:pcode -export script deobf/pcode TCS_uncompressed.swf

# 3. 常量池解析 (deobf/scripts 原地替换 §§constant(N))
python3 deobf/resolve_constants.py
```

## 混淆器手法与对策（已全部破解）

| 手法 | 对策 |
|------|------|
| 控制流平坦化（while(true) 状态机） | 恒定函数常量折叠 → 状态链模拟 → 按执行序拼接 work |
| 恒定条件函数 `set("ₓ",N%511*5)` | 静态求值（恒真/恒假可判定） |
| 嵌套状态机 / 接力状态机（if 守卫衔接两段 while） | 整体模式：init 之后全部语句作为一条 chain 模拟 |
| 带标签循环 `loop0:` + `break loop0` / `continue` | 标签剥离；break_l 冒泡；continue 即本轮结束 |
| 栈值条件 `if(§§pop())` | 常量栈模拟（§§push/§§pop 折叠） |
| "归零退出"（set 状态到 0 无 break） | V2==V 无转移 → 视为自然离开循环 |
| 表达式位置的内联函数定义 | 语句位置才删除，表达式位置由 postprocess 替换为常量值 |
| 常量池切换（§§constant 越界第一个 pool） | 0-based 索引；越界时切换后续 ConstantPool |
| 乱码标识符 `{invalid_utf8=N}` | 后处理替换为 `uN`（名字本身无法还原，需语义重命名） |

## 关键还原文件（H5 重制核心数据）

| 文件 (deobf/scripts/) | 内容 |
|------|------|
| `frame_6/PlaceObject2_6_329/...` | **unitsMissions 44 波敌人配置 + 4 条行进路线 parcourt1-4** |
| `DefineSprite_174/...onClipEvent(load).as` | typeData 全部 26 种武器属性 |
| `DefineSprite_185_structure/...` | structureData 武器价格 + 炮塔结构逻辑 |
| `frame_6/PlaceObject2_980_242/...` | 全部剧情对话（H5 版将弃用） |
| `DefineSprite_793/`, `DefineSprite_834/` | Su-37 空袭逻辑 |
| `DefineSprite_400_obus/` | 炮弹/导弹飞行与爆炸逻辑 |
| `DefineSprite_1027/` | 建造菜单 UI（每武器价格/属性信息） |

**新发现（此前未提取）**：敌人行进路线数据——
- `parcourt1` 南线：begin → t1..t12 → r1..r10（主攻路线）
- `parcourt2` 西南线：g1..g3 → r1..r10
- `parcourt3` 北线：begin → h1..h5 → r10（直升机空降线）
- `parcourt4` 海线：e1..e8（舰艇航线，Yamato 最终波专用）

## 已知残留

1. **1 个文件**常量池不完整：`DefineSprite_428_unit/frame_39/DoAction.as`（62 处残留，引用 65+ 项的大 pool，FFDec pcode 导出只含 2 个小 pool）。该文件是单位物理参数表（质量/速度/装甲），如需彻底解决需从 SWF 二进制直接解析 DoAction tag 的 ConstantPool action (0x88)。
2. **乱码标识符**：`u239u209` 之类是混淆器改名的变量/对象名，原名已丢失，需按用法语义重命名（下一阶段）。
3. **§§push/§§pop 栈残留**：FFDec 对栈机代码的忠实渲染，无害但不美观；可用后续清理 pass 消除悬空的 push/pop。

## 下一阶段（为 H5 重制做准备）

1. [x] **数据导出 JSON（第 2 轮）**：`deobf/data/` 下 weapons.json(26) / structures.json(11) / missions.json(44波+4路线) / unitPhysics.json(编队参数)
2. [x] **游戏逻辑清单（第 2 轮）**：`deobf/GAME_LOGIC.md`
3. [x] **核心函数体 P-code 翻译（第 3 轮）**：`pcode2as.py` + GAME_LOGIC.md F 节语义
4. [x] **全量伪代码库（第 4 轮完成）**：`convert_all_pcode.py` → `deobf/pcode_as/` 347 个文件、459 个命名函数全部转换，0 失败。其余 593 个 pcode 无命名函数（纯事件处理器，AS 层已还原）
5. [x] **常量池切换错位修复 + 乱码名语义重命名（第 5 轮完成）**：resolve_constants v2（最大覆盖 pool 策略）修掉索引错位根源（此前 `["this"]="name"` 类荒谬赋值全部消除，如 `gotoAndStop("lock")` 正确还原）；证据驱动的乱码名重命名应用 98 处（13 个对象名 + 9 个成员名，证据见 RENAME_NOTES.md），其余归档于 garbled_evidence.json / garbled_members.json
6. [x] DefineSprite_428_unit/frame_39 的 62 处常量残留（第 6 轮**关闭**）：从 SWF 二进制直接解析确认——sprite 428 全部 DoAction 里只有 2~15 项的小 pool，**SWF 中根本不存在 65 项 pool**。这 62 处引用是 FFDec 反编译器处理 DefineFunction2 乱码名时的串扰 bug（`§\§\§constant(59)§` 畸形输出为证）。chassisData 真实数据已从其它文件完整还原（GAME_LOGIC.md B 节），零信息损失

## 第 6 轮成果（2026-09-27）— H5 重制开工

- **`h5/` 可玩原型建成**：`index.html + game.js + data.js`（无依赖，双击即玩）
  - 数据内嵌：26 武器 / 11 炮塔价格 / 44 波 / 12 底盘（由 deobf/data/*.json 生成）
  - 机制还原：溅射三段、对空 ×4、对空武器限制、利息公式、修理/出售、基地突破失败
  - 无头模拟验证：堵路防守 12 塔撑到第 8 波（abrams 重坦潮）漏敌失败——胜负判定/强度曲线/经济闭环全部正确
- **遗留全部清零**。反混淆工程完结；后续 H5 差异清单见 `h5/README.md`（路线坐标占位、美术待接入、Su37/升级/音效待实现——素材与公式均已备齐）

## 第 5 轮成果（2026-09-27）

- **常量池错位根源修复**：v2 resolver 用"最大覆盖 pool"策略替换错误启发式，多 pool 文件的引用全部指向正确 pool。修复后建造菜单初始化代码完全语义化：
  ```javascript
  eval("turretInfo_m60")["range"] = 350;
  eval("_root")["master_menuItems"]["unlocker"][eval("turretInfo_m60")["name"]]
  → turretInfo_m60.gotoAndStop("lock")   // 未解锁跳锁定帧
  ```
- **乱码名清理**：60 个对象名 + 23 个成员名全部经过证据审查，98 处语义重命名应用（_root/swapDepths/turretInfo_m60/crotale/obusShell系列/structureClip/range/costUpgraded/offscreenX 等），证据全档
- 全量伪代码库已用修复后的 resolver 重建（459 函数）

## 第 N 轮成果（2026-09-27, H5 领土防御·坐标与资源轮）

- **【重大修复】y 轴镜像 bug（用户报"点小地图不能正确映射"的真正根源）**：
  路点/地图位图全是 Flash 屏幕坐标（y 向下=南），旧 w2sY 按 y 向上翻转 → 整个世界垂直镜像：
  道路+车队一起镜像所以看起来正常，但小地图（正立缩略图）与主视图（镜像）对不上，
  点小地图落到镜像位置；出发点（y=580 南）被画到地图外以北。已改为 Flash 屏幕系直通
  （w2sY=y-cam.y，精灵旋转 -rot-π/2 → +rot+π/2，小地图/探索画布/边界钳制全部同步）。
  真机验证：点小地图右上水坝→主视图落在同一座水坝；点底部→地图南缘；车队在出发点路段向东北行军，
  小地图红点在底部对应位置
- **【重大修复】浏览器缓存吃掉修复**：用户浏览器一直跑旧 game.js（Chromium 启发式缓存+固定 URL）。
  index.html 的 script 标签已加 ?v=时间戳；此前"已验证"的教训=公式自检≠视觉对照，必须真机截图
- **173 库分层渲染完成**：ETURRET_PARTS 按 turret_frames.json objs 深度序画"底座+炮管+装饰"
  （22 种敌方武器全接入，新导出 shape 64/115/136/160 + sprite 80/115/121/136/160），
  玩家 m60 塔补上 173"m60"帧真身=88 底座+92 机枪（带旋转），删除 ETURRET_SRC 单帧方案与
  猜错的 turrets/60/66/68/84.png。待办：各部件的 PlaceObject2 逐件偏移矩阵（现居中摆放）
- 诚实备注：G 全图经数值验证（zoom 0.39 视野覆盖全世界）；自动化截图受后台标签页定时器节流影响，
  部分截图为冻结帧，以实时截图+数值双证为准
- 本轮队列后续（未做，不装完成）：86 库玩家塔分层(cananon125/pluton/MTHEL 枪口焰/底座)、
  炮管开火多帧动画、Su37 空袭、跳弹/金属音、阴影、选中圈、BGM 对号证据、单位去背景

## 第 N+1 轮成果（2026-09-27, H5 领土防御·86库玩家塔分层）

- **86 库玩家塔统一走 173 库部件表**：删掉旧的 86 库单图分支，玩家塔渲染改走
  PLAYER_ETURRET 映射后复用 ETURRET_PARTS 同一张表（gatling→gatlingAmx10、canon75→75mmAmx10、
  canon105→canon105、canon105D→canon105D、canon125→canon125、crotale→crotale、MLRS→MLRS、
  pluton→pluton、MTHEL→MTHEL、m60→m60Brad、radar→radar）。ETURRET_PARTS 已是 22 种武器的全部件
  描述（底座+炮管+装饰按原版深度序），玩家塔只是把 86 库 ID 翻译成 173 库 ID 然后绘制同一堆部件
- **新导出的部件** sprite 64（canon125 底盘1层）、115（radar 静态）、121（crotale 弹簧）、
  136（MTHEL 底座）、160（gatlingDTigre 翼）已全部接入 ETURRET_PARTS
- **真机截图确认**（z.ai analyze_image）：11 塔一排部署后 m60/gatling/canon 系列/crotale/canon125 全部
  显示出"底座+炮管"分层结构；m60 加底座与 92 机枪，canon125 看到 125 炮管 + 127 底座，
  crotale 看到 117 底盘 + 122 91帧导弹架
- 修正：上一轮 173 库渲染时的 canon125 描述（"86 库另用 sprite 64 作底盘 5 层"）的"5 层"是误读
  —— 实际是 objs 数组里 64 出现 5 次（=5 个 PlaceObject2 引用同一形状）+ 65 炮管；现在按 sprite 64
  一次画就行（其它 4 个 64 实际是不同 depth 的同一形状，1 帧已覆盖）
- 本轮未做（按队列下推）：C 多帧炮管开火动画、Su37 空袭、跳弹音、阴影、选中圈、BGM 对号证据、
  单位去背景——已在任务队列 A-I 列出

## 第 N+2 轮成果（2026-09-27, H5 领土防御·炮管开火动画）

- **新建权威解析器 `deobf/sprite_frames.py`**：直接读 TCS_uncompressed.swf 二进制解析 DefineSprite
  的完整帧序列（FrameLabel + 每帧 PlaceObject chid），输出 `deobf/data/sprite_frames.json`。
  修掉了此前"用 dump 文本扫标签"会越界扫到相邻 sprite 的错误（曾误报 sprite 122 有 41 个标签，
  实为 1 个）。两个独立方法（二进制解析 + dump 缩进界定）一致：**14 把武器 sprite 全部只有
  1 个标签 "fire"，位于第 2 帧**
- **开火帧序列像素实测**：`deobf/data/gun_fire_frames.json` — 对每把武器 sprite 的每帧 PNG 统计
  alpha 内容量，取帧 2 起连续非空段作为开火动画。结果：m60(92)=15帧、gatling(98)=23、75mm(103)=24、
  105mm(108)=24、crotale(122)=4、canon125(125)=34、MLRS(128)=36、gatlingDT90(153)=2、navire(164)=4、
  Yamato(167)=34；pluton(80)/MTHEL(83)/tigre(161) 帧 2 起为空 → 无开火帧（如实记录，回退静态帧）
- **动画机制接入**：Turret.fireT / Unit.fireT 在开火时置为该武器炮管的开火序列长度，每 tick 递减，
  gunFrameFor(id, fireT) 按序取帧；炮管放大验证证实原版动画本质是**后坐**（帧1伸出→中段后缩→末帧复位）
  + 炮口焰。真机画布像素差验证：同塔 fireT=0 vs fireT=17 有 154 像素差异（3.4% 采样区）
- 修正一处 ID 混淆：fireT 原用武器名查 gunFireLen（表按 sprite ID 索引）恒为 0；改
  partsFireLen(parts) 从部件表取炮管 sprite 的序列长度
- 本轮未做（队列下推）：D Su37 空袭、E 跳弹/金属音、F 阴影、G 选中圈、H BGM 对号、I 单位去背景

## 第 N+3 轮成果（2026-09-27, H5 领土防御·Su37 空袭）

- **Su37 空袭完整接入**（原版 DefineSprite_834 反编译依据）：
  - 进入边：`on(press)` 用 Math.random() 四等分选 bas/gauche/droit/haut，进入点
    bas=(rand*2200, 600) haut=(rand*2200, -1600) gauche=(-100, rand*2200) droit=(2100, rand*2200)
  - 落点：`zone = Array(_xmouse, _ymouse)` → H5 点击地图落点，机头 atan2 朝向落点
  - 冷却：`comptDispo = 60`（原版 chargeBombes 每次递减，归零时 disponible=true）
    → H5 每 tick 递减，60 帧后恢复；按钮显示 "Su37 Ns" 倒计时，冷却中 disabled
  - 弹体属性（793_23 onClipEvent(load) 权威值）：`speed=28`、`puissance=500`、`impact=260`
  - 音效：`master_sounds.Su37S.start()` → chid 472 (Su37.flv)。**FFDec -format sound:wav 转码成功**
    （此前 flv 无法播放），得到 22050Hz 单声道 1.63s 呼啸声 → assets/sounds/472_Su37.wav
- **飞机素材**：Su37 战机 = DefineSprite_793（carte 上 `nm: Su37` 引用），导出得 111x183 真实矢量战机图。
  **缩放从头解码 SWF 二进制 PlaceObject2 矩阵得 scaleX/Y=0.4946**（而非目测猜测），机头朝上、随 rot 旋转
- **UI**：侧栏新增 "Su37 空袭" 按钮；瞄准模式画 impact=260 半径红圈 + 十字准星 + "点击目标投放炸弹"
- **无头验证**（smoke_test 扩展）：选边(gauche/haut 随机) → 起飞 available=false → 命中后 3 敌各
  受 500 伤害 → 60 帧精确恢复；真机验证战机按 0.4946 缩放渲染、机头朝向落点
- 本轮未做（队列下推）：E 跳弹/金属音、F 阴影、G 选中圈、H BGM 对号、I 单位去背景

## 第 N+4 轮成果（2026-09-28, H5 领土防御·命中音 + 弹体素材纠正）

- **命中音完整接线（权威源 DefineSprite_400_obus 帧库结构）**：
  - 修正任务描述的猜测：`Math.random() > 0.85` → ricochet（**15%**，不是 30%），`> 0.7` → metal（30%）
  - 权威链路：obus 库帧标签→内层精灵（dump 缩进界定）→ 该精灵 frame_2 DoAction：
    obusLeger→301 / obusMoyen→307 / obusLourd→361（各播 explosion1/1/2）；
    bullet/bulletLourde→**390**（无自带音，frame_2 就是那条 0.85/0.7 概率）；导弹帧内嵌
    爆炸精灵 missile→392(explosionCrotale) missile2→394(explosionMlrs) missile3→395(explosionLarge)
    missileUnderSu37→396(explosionLarge)。**爆炸音随弹体精灵而非武器 ID 决定**，已改为 SHELL_SFX 表
  - 4000 次实测概率：ricochet 598 (15.0%)、metal 1222 (30.6%) — 与权威阈值吻合
- **音效文件补全**：ricochet1-4 (467-470)、metal1-2 (481-482)、explosionCrotale (460)、
  explosion4 (457, flv→wav 转码) 全部导出；**28 个音效浏览器可加载验证 0 失败**（Audio.oncanplaythrough）
- **弹体素材重大纠正**（此前用错）：旧代码把 361(obusLourd 176x182 爆炸图) 当导弹、303 当轻弹。
  权威结构是 obus 库帧内含独立弹体 sprite，按内容 bbox 实测重新对号：
  390(6x32 曳光) / 301(14x25 轻弹) / 307(16x26 中弹) / 361(16x36 重弹) / 393(16x25 导弹, 取第 8 帧成形体)
  渲染改为按 bbox 裁剪 + 归一到 14-22px 世界长度（原来的画布比例缩放是错的）
  - 视野内像素差量化验证：曳光 2x14 → 轻弹 8x12 → 中弹 8x14 → 重弹 9x20 → 导弹 12x20，层次正确
- 本轮未做（队列下推）：F 阴影、G 选中圈、H BGM 对号、I 单位去背景

## 第 N+5 轮成果（2026-09-28, H5 领土防御·单位阴影 + 弹体阴影素材）

- **单位阴影接入（权威源 428_unit enterFrame + SWF colorTransform 二进制解码）**：
  - 修正任务描述的 4 处错位：521 是 **abrams**（非 jeep）、523 amx10、526 bradley、527 camion1、
    **529** camion2（非 531）、**531** camion3（非 533）、533 camionBlinde、**534 jeep**（非 521）、
    535 navire、537 t90、538 Yamato —— 全部以 `deobf/data/exports.txt` 的 ExportAssets 为准
  - **关键发现：FFDec 导出的 _ombre 是中灰图（avg RGB≈85），不是黑的**。原版在舞台上以
    PlaceObject2 colorTransform 放置：`mult R=G=B=0, alpha=0.352`（从 flags=0x1e 后的 CXFORM
    二进制逐位解码得到）。H5 若只设 globalAlpha 会画出灰雾而非阴影 → 新增 `deobf/make_shadows.py`
    按原版变换把 RGB 压为 0（alpha 保留），11 张全部处理
  - 绘制按原版：`ombre._rotation = _rotation; ombre._x = _x+4; ombre._y = _y+4`，
    在车体**之前**绘制（=车体下方），alpha=0.352
  - 验证：drawImage 拦截确认调用序列为 `ombre → unit` (顺序正确)；隔离测试证明阴影图可绘制
    (alpha=1/offset=25 时 940 深色像素)；原版偏移仅 4px+alpha 0.352 → 阴影多数藏在车体正下方，
    只露边缘一丝立体感（**这是原版真实行为，非 bug**）
- 本轮未做（队列下推）：G 选中圈 471、H BGM 对号证据、I 单位去背景+车头校正

## 第 N+6 轮成果（2026-09-28, H5 领土防御·选中视觉）

- **修正任务描述的关键错误**：`471` **不是**选中圈图形，而是 DefineSound `selectionUnite`（音效，早已接入）。
  真正的选中视觉是两个 sprite：**778 = carte.viseurUnit（红色四角准星）**、**775 = carte.cerclePortee（绿色射程圈）**
  - 778 有 9 帧但**只有前 4 帧有内容**（后 5 帧 bbox=None 空帧）—— 任务描述"4 帧"的由来；
    60x60 固定尺寸，不随射程缩放
  - 775 单帧 100x100 圆形绿线
- **权威用法**（frame_6/PlaceObject2_6_321 enterFrame + load 反编译）：
  - `afficheUnit != "null"` 时：`cerclePortee._x/_y = 选中单位._x/_y`；
    **`cerclePortee._width = distanceOfFire * 2`**（宽度=射程直径）；`cerclePortee._height = _width`
  - `viseurUnit._x` 同步跟随
  - `unshowInfoOnUnit()`: 两者 `_x = -500`（移出画面隐藏）
- **H5 接入**：选中塔时绘制 775（缩放到 `w[1]*2*zoom` 直径）+ 778（固定 60px，按 G.frame/6 轮播 4 帧）
- 真机验证：近景截图确认红色四角准星出现在塔周；全图模式确认绿色射程圈（m60 射程 350 → 屏幕直径 273px，
  与 `350*2*0.39` 吻合）
- 本轮未做（队列下推）：H BGM 三段对号证据、I 单位去背景 + 车头方向校正

## 第 N+7 轮成果（2026-09-28, H5 领土防御·BGM 对号证据）

- **权威证据（三条独立链，全部一致）**：
  1. `frame_6/PlaceObject2_6_430 onClipEvent(load)`：
     `musics[0].attachSound("actOfInstinct")` / `musics[1].attachSound("hellMarch")` /
     `musics[2].attachSound("justDoItUp")`
  2. `DefineSprite_1151`（音乐面板）三按钮的 `onClipEvent(load)` 显示文本：
     `PlaceObject2_1145_5` → **"Act of instinct"**、`1145_8` → **"Hell march"**、
     `1145_11` → **"Just do it up"**
  3. 三按钮 `on(press)` 分别调 `changeMusic(0/1/2)` —— 与 1 的数组索引完全对应
  → **索引→曲名映射已权威确认**（H5 的 BGM_NAMES 顺序正确）
- **音频文件↔chid 已用 MD5 逐字节证明**：assets/music 的 bgm_main/bgm2/bgm3 分别等于
  SWF 原始 `1157`(46.18s) / `1082`(66.09s) / `1084`(18.30s)（md5 完全一致）
- **未解的一环（如实记录，不猜）**：SWF **没有把三个 BGM 名字导出**（88 条 ExportAssets 里只有
  b01-b17 环境音与武器音效，无 BGM）；三个名字在二进制里各只出现 1 次（均在 6_430/1151 常量池），
  **不存在 linkage 绑定表**可静态查询。因此 "chid 1157/1082/1084 分别对应哪首曲子" 无法从 SWF 静态证明
  - 音频特征仅作参考（不足以定名，不做断言）：1157=46.2s/RMS7176/过零406；1082=66.2s/RMS3138/过零1265；
    1084=18.2s/RMS3675/过零680
  - 当前 H5 映射为 `bgm_main=1157 → actOfInstinct`、`bgm2=1082 → hellMarch`、`bgm3=1084 → justDoItUp`，
    **标注为待人工听辨确认**（三首均已在浏览器验证可播放）
- 本轮未做（队列下推）：I 单位去背景 + 车头方向校正

## 第 N+8 轮成果（2026-09-28, H5 领土防御·单位图核实 + 行进音补全）

- **任务描述 I 的两个前提经实测均不成立（如实记录，未做无谓改动）**：
  1. **"像素去背景"不需要**：FFDec 导出的 11 张单位 PNG **已自带 alpha 通道**（18-58% 透明像素），
     合成到红底上验证无背景残留、无黑边；边缘仅有 alpha≤4 的抗锯齿残留（正常）
  2. **"车头方向校正"不需要**：原版 `428_unit` 的朝向算法权威破解后确认 H5 已正确：
     - `directionToGet = 57.29578 * asin(...)`（角度制，>180 转 -360+x）
     - 位移 `_x += sin(rot)*speed`、**`_y -= cos(rot)*speed`** → `_rotation=0` 指北
     - 图未旋转时车头朝上（=北），与 `_rotation` 自洽
     - H5 的 `rotate(u.rot + π/2)` 正是"车头朝上→东起顺时针"的映射；真机四方向验证：
       rot=-90/北、+90/南、0/东、180/西 车头与炮管方向全部正确
     - 图片 bbox 中心与画布中心重合（dx/dy≈0），内容有 2-11px 边距，旋转不裁剪
- **【本轮实质产出】补全 8 个车辆行进音效（此前完全缺失）**：
  - 原版 `428_unit` 的 `roule()` 权威分支：默认 `r5="Light"`（camion1/2/3、jeep、bradley、amx10、
    abrams、camionBlinde）→ `uniteMoveLight1-4`；`chassis=="t90"` → `uniteMoveHeavy1-3`；
    `chassis=="tigre"` → `uniteMoveTigre1`；`chassis==navire/Yamato`（乱码名 u228Wu132 / $u180u147）
    → `"null"` 族无音效。随机选 `Math.floor(Math.random()*n)+1`
  - 乱码底盘名解码依据：同文件 chassisData 表 `u228Wu132=(1,0.3,0.8,1800,1000)`=navire、
    `$u180u147=(0.5,0.2,0.2,20000,0)`=Yamato
  - 导出 473-480 全部音效（480 为 flv→wav 转码），接入 `rouleSfx()`
  - H5 适配：原版每次 roule 都播会音效轰炸，H5 节流为每 12 帧一次且仅视野内
  - 真机验证：8 个音效全部可加载；触发族正确（Light 4 选 1 / Heavy 3 选 1 / tigre 固定 /
    navire 无）；120 帧真实战斗 8 个音效全部触发、0 JS 错误
- **队列 A-I 全部处理完毕**（A/B/C/D/E/F/G/H 前几轮完成，I 本轮以"核实不需要改 + 补全行进音"收尾）

## 第 N+9 轮成果（2026-09-28, H5 领土防御·环境鸟叫补全）

- **盘点发现真实缺口（非重做已完成项）**：原版 `6_430` 的 `playBirds()` 每 10 秒随机播放
  17 个环境鸟叫（b01-b17），H5 此前**完全没有**：
  - 权威逻辑：`setInterval(this,"playBirds",10000)`；
    `Math.floor(Math.random() * 17) + 1` → `BSounds[1..17].start()`
  - 原版跳过条件：`master_scenario.enScenario`（剧情模式）/ `aPerdu`（已失败）/ `edithBool`（降音量模式）
    → H5 对应：已 lost/won 时不播、静音时不播
- **导出 17 个音效**（chid 429-445）接入 `playBirds(now)`，10 秒节流；
  `b12`(chid440) 原本是 flv 且 `-format sound:mp3` **静默失败**（文件未生成）→ 改用 `-format sound:wav`
  转码成功（1ch 5512Hz 2.51s）。这正是"验证每个音效真能加载"查出来的
- **全量音效核验**：SFX_FILES 53 项**文件全部存在**（脚本比对）+ 浏览器 `oncanplaythrough`
  **53/53 可加载 0 失败**
- **顺带核实的原版机制**（已确认 H5 正确，未改）：
  - 修理费公式 `2 × (maxHP − curHP)`（DefineSprite_819 repairIfCan 权威）→ H5 的 `REPAIR_COST=2` 一致
  - 原版另有 `barreReparation` 面板 + `repairLogo.autoRepair` 开关 UI（chid 819/184），
    H5 已有 autoRepair 字段与逻辑，但**无面板 UI**（列为后续可选项，非队列要求）

## 第 N+10 轮成果（2026-09-28, H5 领土防御·修理面板 barreReparation）

- **补全原版 `barreReparation` 修理面板**（上一轮盘点出的缺口，队列 A-I 之外）：
  - **权威逻辑**（`DefineSprite_819` 的 `refresh(unit)` / `repairIfCan()` / `DefineSprite_184` 的 `swithRepair()`）：
    - `priceToPay = round(2 * (etatMax - etat))` —— **2 $/HP**
      （注：pcode 里 `r3=(r3/2); r3=(r3/r5);` 是混淆死代码，随后 `r3 = 2` 直接覆盖；
      我第一版误读成 `4*(maxHP-curHP)/range`，经测试发现 `canon105 缺10HP→0$` 显然不对而纠正）
    - `repairIfCan()`：钞票不足播 `cannot` 音并拒绝；否则扣款、`etat = etatMax`、播 `selectionUnite`
    - `swithRepair()`：翻转 `repairLogo` 内的布尔（即 autoRepair），文案切 "auto repair ON/OFF"
    - 面板点击：条上 `on(press)=repairIfCan`、autor 按钮 `on(press)=swithRepair`
  - **素材问题（如实记录）**：`814 base` / `818 autor` 两张导出位图里 **FFDec 把 EditText 的示例文字
    "repair for 1000000$" 烧进了像素**，不可直接用；`184 repairLogo` 实为圆形阴影图（非图标）。
    → 改为**从 814 采样权威配色**（纯黑边框 + `RGB(0,102,152)` 蓝底）按原版尺寸布局自绘，
    文字由 H5 动态生成。删除不可用的 assets/repair_bar/
  - **H5 交互**：R 键 = repairIfCan（全额修复扣款）；**T 键 = 切换 auto repair**；
    面板点击（修理条 / autor 区）也可触发
  - **真机验证**：T 键 auto false→true；R 键 255→280HP 扣 50$（=2×25）；
    点击修理条 240→280HP 扣 80$（=2×40）；截图确认蓝条 + HP 进度 + "repair for 50 $" + "auto repair OFF"
- 顺带：HUD 提示补上 "T自动修理"

## 第 N+11 轮成果（2026-09-28, H5 领土防御·建造预览光标 + 一次如实失败的尝试）

- **补全原版建造预览 UI（822 viseurConstruction + 1161 cancelhint）**：
  - 权威依据 `DefineSprite_822`（3 帧 40x40）：**帧1 浅灰绿=可建 / 帧2 粉红=hover / 帧3 深红=不可建**
    （代码里 `gotoAndStop("red")` 对应帧 3）；`1161`（2 帧 634x15）为取消提示条，
    原版 enterFrame：`if (viseurConstruction) cancelhint.gotoAndStop(2) else gotoAndStop(1)`
  - H5 接入：选建筑后光标跟随鼠标，可建时帧1、不可建/钱不够时帧3；底部显示原版提示条
    （实测文案 "press spacebar to cancel build mode"）+ 左下 "可建/不可建 xxx"
  - 真机验证：5 张素材全部加载；光标 40x40、提示条 634x15；草地处判定可建、光标为浅灰绿
- **【未完成·如实记录】原版 surfaceForBuild 遮罩判定未能复现**：
  - 原版的真·可建判定是 `surfaceForBuild.hitTest(x,y,true)`（形状级命中测试，见
    `DefineSprite_834/frame_1/PlaceObject2_822_226 on(press)`），非道路缓冲近似
  - 导出 `chid 768`（1838x1730 位图，alpha=255 处即可建，覆盖约 24%）尝试复现，
    **失败**：严格解码其 PlaceObject2 矩阵得 `scale=1.00003 translate=(166.1,391.5)`，
    但按世界坐标（含 y 翻转、多种原点/符号组合共 17 种）采样均无法与路点吻合
    （理想应"路点上必为不可建、远离路点处多可建"，实际全部不匹配）。遮罩几何基准另有来源，未破解
  - **决定**：保留已验证正确的 45px 道路缓冲近似（逻辑与遮罩意图一致），
    并在代码注释与看板中明确标注此未完成项，不假装已还原
- 本轮未做（如有需要可下轮）：`785 zoneBombardement`（Su37 轰炸区指示，H5 已用瞄准圈近似）

## 第 N+12 轮成果（2026-09-28, H5 领土防御·surfaceForBuild 遮罩：深入尝试后明确放弃）

- **本轮专项攻关上一轮遗留的未完成项**（768 可建区遮罩），穷尽手段后**明确判定不可复现**，
  如实记录全部尝试与证据，不再留悬念：
  1. **结构解码**：`768` 仅含 `767`(DefineShape, bitmap fill 引用 769 位图)，无额外矩阵。
     解码 767 bounds 得 `x[-156.8,1681.2] y[-1412.0,318.5]`（尺寸 **1838x1730**，与位图完全一致，
     此前漏 jump shapeId 2 字节导致解码错误，已修正）
  2. **SVG 交叉验证**：`decompiled/shapes/767.svg` 给出 `width=1838 height=1730` +
     `transform="matrix(1,0,0,1, 156.8, 1411.95)"` —— 与 bounds 符号相反，据此推出遮罩左上角
     在 carte 局部 = `(166.1,391.5)+(156.8,1411.95) = (322.9, 1803.45)`
  3. **离线穷举**（17 种原点/翻转组合 + 密集路点采样 488 点）：曾出现一个"匹配"
     （flip=-1, ox=-320, oy=-268），但严格复核后**路线上仍有 16% 被判可建**（理想 0%），
     证明是**小样本过拟合的巧合**，非真解
  4. **权威推导值验证**：用 (322.9,1803.45) 测试，路上仍有 20% 可建 → 不成立
  5. **图像互相关**（不依赖矩阵推导的全新方法）：在 map.jpg 上滑窗搜索遮罩最佳对齐，
     最优 offset=(120,88) 时 **mask 内 94.3% 是草地、mask 外 57.8%** —— 对齐信号很强，
     但**路点验证仍有 28% 被判可建** → 结论：**遮罩语义与"道路禁建"假设不同**
- **最终结论（诚实）**：`surfaceForBuild` 标记的不是"道路以外皆可建"，而是更细的
  "允许建塔的平地区域"（含地形/建筑等多种限制）。其几何基准涉及 carte/zoneDezoom 多层矩阵，
  且语义无法用"路点距离"或"草地图层"近似复现。
  → H5 保留 45px 道路缓冲近似（**行为与遮罩意图一致：道路上不可建**），
    在此明确标注为**设计取舍而非还原完成**。清理了不可用的遮罩素材，game.js 无残留引用
- 说明：本轮没有代码改动（仅 PROGRESS 记录 + 素材清理），因为所有尝试均未达到"可安全接入"标准。
  不做无把握的改动，也不把失败的尝试包装成成果

## 第 4 轮成果（2026-09-27）

- **伪代码库建成**：`deobf/pcode_as/` — 全部 459 个命名函数的可读伪代码（含 fireOnEnnemi/createUnit/startMission/roule/getTarget/OCEEF 等核心）
- **语义重命名**：按用法证据确认 4 个高频乱码名（u191u163=_root、u170.u215=swapDepths、u239u209=建造菜单炮塔数据对象、u155u180u132=menuDepthClip）并应用到输出
- **工程状态**：940 个 AS 全部还原（343 线性化 + 597 直通）、常量池 161/162、伪代码 459 函数。H5 重制所需的**数据(JSON) + 机制(GAME_LOGIC.md) + 核心函数(pcode_as) 三件套齐备**，可以开工写 H5 版

## 第 3 轮成果（2026-09-27）

- **pcode2as.py 转换器**：栈模拟 + 表达式折叠 + ConstantPool 按执行序切换解析 + loc 标签控制流。修复点：loc 前缀 label、StoreRegister 数字参数、Increment/PushDuplicate/StackSwap 指令、跨块 pool 继承
- **破解对空机制真相**：fireOnEnnemi 对 chassis=="tigre" 伤害 **×4**（剧情说 2 倍，代码是 4）；"只有机枪/导弹能打空中"实现在 getTarget 的武器类型过滤
- **破解波次生成**：startMission 按 units.length==13 区分横/纵排布（20px/60px 间隔），生成后建车队链表
- **破解利息公式**：euros = floor(euros × (1 + interest/100))
- **失败判定**：getFirstEA 每 200ms 扫描 _y > 477 的敌人（抵达基地线）

## 第 2 轮新增发现（2026-09-27）

- **chassisData 底盘表**：11 种敌人的速度/转弯/血量/赏金（GAME_LOGIC.md B 节，此前从未提取）
- **溅射三段公式**：中心全额 / 中环半伤 / 外环 20%
- **全局参数**：fpsc=1.13 速度倍率、初始 850 金 + 利率 6、Su37 冷却 60s
- **武器解锁关卡表**：canon75@8 / canon105@12 / canon105D@17 / radar@28 / su37@32
- **存档结构**：SharedObject 字段完整清单
- 关键结论：FFDec AS 反编译丢失的核心函数体全部可在 P-code 中找到，P-code 是完整可信源
