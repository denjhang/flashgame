# TCS 反混淆与资源还原进度

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
| 炮塔素材对号 | ✅ 10/11 有原版图 (56-85.png), m60 机枪塔用炮管线条兜底 | turrets/ (86 帧库: radar=61位图60 / MLRS=67位图66 / pluton=68 / MTHEL=84; 其余为矢量绘制无位图) | turret_frames.json |
| BGM 接入 | ✅ bgm_main.mp3(=1157, hellMarch候选) 循环播放, M 键静音; 原始文件待试听最终确认 | assets/music/ |
| tigre 直升机图 | ✅ chid157 矢量渲染图 tigre.png 已接入 | assets/units/ |
| UI 素材对号 | ❌ 建造菜单(1025帧库)/INFO面板/小地图未接入 | — |
| 爆炸特效接入 | ✅ 279 的 4 帧动画 (210×217) 按效果半径缩放播放 | assets/explosion/ |
| 建造区规则 | ✅ 道路中心线 45px 内禁建 (surfaceForBuild 的几何实现) | game.js |
| 浏览器视觉验证 | ❌ 无头逻辑已验证, 浏览器效果未看 | — |

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
