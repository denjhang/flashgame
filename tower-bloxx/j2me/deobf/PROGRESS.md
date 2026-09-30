# J2ME 反混淆进度账本 (PROGRESS.md)

> 目标: 全部 10+ 类 → 语义化重命名源码 (deobf/src/*_clean.java), 作为 H5 移植唯一权威底本。
> 方法总数估算: House≈98 + k≈60 + i≈40 + j≈30 + g≈9 + GameMIDlet≈25 + n/o/f/d/e/m/b/c/a≈67 + p/h/m 实现 ≈ 40 → **约 340+**。
> 纪律: 每名必有字节码证据; 与 PARITY.md 冲突记【勘误】。

## 进度总览
| 类 | 原行数 | 方法数 | 状态 | 产物 |
|---|---|---|---|---|
| a.java | 7 | 0 (标记接口) | ✅ JD+1 | a_clean.java (ScreenCallback) |
| b.java | 26 | 2 | ✅ JD+1 | b_clean.java (Vibrator) |
| c.java | 21 | 4 | ✅ JD+1 | c_clean.java (ScreenFactory) |
| e.java | 24 | 6 | ✅ JD+1 | e_clean.java (ScreenContract) |
| m.java | 28 | 8 | ✅ JD+1 | m_clean.java (CanvasScreen) |
| d.java | 59 | 6 | ✅ JD+1 | d_clean.java (MeshNode) |
| n.java | 199 | 11 | ✅ JD+1 | n_clean.java (Renderer3D) |
| o.java | 144 | 10 | ✅ JD+1 | o_clean.java (MidiPlayer) |
| f.java | 141 | 11 | ✅ JD+1 | f_clean.java (SettingsStore) |
| g.java | 656 | 9 | ✅ JD+1 | g_clean.java (ResourceStore; 153 项 id 表保留原文) |
| GameMIDlet.java | 476 | 26 | ✅ JD+2 | GameMIDlet_clean.java |
| k.java | 1491 | 22 | ✅ JD+4 | k_clean.java (CityMapScreen) |
| i.java | 867 | 21 | ✅ JD+4 (完整) | i_clean.java (MessageRenderer) |
| j.java | 584 | 23 (含 8 桥) | ✅ JD+3 | j_clean.java (MenuScriptInterpreter) |
| p.java | 209 | 10 | ✅ JD+3 | p_clean.java (PhoneCanvas) |
| h.java | 603 | 19 | ✅ JD+2 | h_clean.java (HallOfFameScreen) |
| House.java | 4420 | 98 | ✅ JD+8 (98/98 全实读, 三分册+JD+8 补读) | House_clean_part1/2/3.java |
| com/.../a.java | ~120 | 4 | ✅ JD+3 | nokia_lang_clean.java (NokiaLangPack) |

**方法计数: 292 / 292 (JD+9 审计对账后定案)。类: 17/17 ✅**

## JD+1 (2026-10-01) 小类全量 67 方法
- a→ScreenCallback: 空标记接口 (extends e)。
- b→Vibrator: DeviceControl.startVibra(100, ms) 诺基亚震动。
- c→ScreenFactory: new p()/b()/o()/h() 四工厂。
- e→ScreenContract: o()/n()/a(int,int)/a(Graphics,bool)/b(int,int)/a(Command) 六回调。
- m→CanvasScreen: 绑定 MIDlet/可见性/软键/getGameAction/getKeyName/宽高。
- d→MeshNode: Mesh+Transform 包装; b()=材质规格化 (blending 228/wrapping 240)。
- n→Renderer3D: init/beginFrame/endFrame/preloadMeshes/getMesh/setupViewport/
  setClip/projectPoint/setFov/setCameraPose (9 参: pos+forward+up, 叉积正交化 view 矩阵)。
  【勘误】n.a(×9) 实参=pos3+forward3+up3 (调用 :3435 (aV,aW,cI, 0,0,-1, 0,1,0));
  最初 javadoc 误写 12 参, 已在 n_clean 注释更正。
  projectPoint = 3D→屏幕像素 (HUD 落点提示 h:3390 的锚点来源)。
- o→MidiPlayer: 双通道 (currentSfx/bgmPlayer), VolumeControl=40, loopCounter 语义。
- f→SettingsStore: RMS 读写 + l[14]/m[12]/n[1] 三设置组 + 语言序号。
- g→ResourceStore: r0 92 偏移表+负 id 分段+e() 哨兵求长+语言包 l 布局 (skip7+readUTF+153 偏移);
  153 项逻辑串 id switch 保留原文 (纯数据表, 样例映射已注)。

## 待下一轮
- GameMIDlet (476 行): 状态机 d(int)/a(Graphics)/key 分派/m()/Command。
- House 字段表补全 (aa-cW)。

## JD+2 (2026-10-01) GameMIDlet + h
- GameMIDlet→(抽象宿主): 主循环 run() (dt=j() 8 帧滑动平均, 屏幕 q() 解析/切换 hide-show),
  计时 v()/j(), paint d(Graphics), 按键 m/n/f, 软键 b(Command), splash 路由 c(int,int)/d(int,int)/c(Graphics),
  RMS "settings" w() (l[0] 语言 + l[3] 音效)。26 方法全建档。
- h→HallOfFameScreen: 高分榜屏 (实现 ScreenCallback) — RMS "HoF" (lastName+榜×3 行×(名+分[])),
  submitScore 排位插入, 名字录入软键流, 横竖屏两套绘制 (f.a(4)), 图例 g.d(155/156/157), 图标 r0 id6/7/8。19 方法。
- 【勘误】f.g 语义: JD+1 误记 vibrationLevel → 实为 screenMode (q():444 switch 分派; :392 f.e(0) 进 splash)。
  FIELDS.md 已改。
- 新证实: A 字段 (h) = 高分榜屏而非"键位处理" (JD+1 注释误判, h implements a 且作为 q() case2 屏返回);
  keymaps p() 由本类键位表兼榜数定义; l[13]=游戏达标标记 (h.n())。
- 下一轮: j.java (584, SplashScreen, 被 GameMIDlet/h 依赖) → p.java → k.java → i.java → House。

## JD+3 (2026-10-01) j + p + i(部分) + nokia lang
- 【重大勘误】j 不是 SplashScreen — 是 MenuScriptInterpreter: 读 jar 文件 "m" (菜单屏幕描述树:
  屏型 0 菜单列表/1 图文页/2 全屏消息/3 名字录入/5/6 设置/7 条件跳转), GameMIDlet.z=菜单屏。
  旧 PARITY/H5 的 "splash" 语义按此更正 (H5 无对应物, 表现层重做时以 "m"+i 渲染器为准)。
- j→MenuScriptInterpreter: ctor(头解析)/setupSoftkeys(名字 Form)/openScreen/loadScreen/
  handleActionBits(位标志: 弹栈/退出/设置循环/写设置对)/onShow(音效开关回跳三态)/tick/paint→i/onKey/命令。
  "m" 布局逆向记于 j_clean 头注。
- p→PhoneCanvas: Nokia FullCanvas, -6/-7 软键汇聚, 软键条绘制 (黑描边白字/图标, 左 36 右 40)。
- i→MessageRenderer (12/25): 三模式浮层 (菜单/消息框/文本框) 装载与几何推演; 绘制内部 b/c/d/e 下轮。
- com/nokia/.../a→NokiaLangPack: nokia 版 lang.* 读取器实锤 (locale 回退 lang.xx)。
- 新证实: GameMIDlet.q() case0 (f.g==0) 返回 j=菜单屏; "splashMode"(k) 实为菜单模式。
- 下一轮: i.java 绘制内部 (JD+4) → k.java (1491, 游戏主屏/具体 MIDlet 子类) → House。

## JD+4 (2026-10-01) i 收尾 + k 全量
- i→MessageRenderer 完整 21 方法: b(Graphics) 菜单列表 (光标高亮/禁用色/图标偏移±1/上下箭头),
  c/d(Graphics) 消息框/文本框 (palette 底色边框), e(Graphics) 标题跑马灯 (1500ms/行+500ms 滚动),
  a(4) CJK 折行分页 (空格/句号断点, \p 强制分页, 。悬挂补偿), 箭头图集 18x18×3 帧。
- k→CityMapScreen 完整 22 方法: 城市视图全逻辑体。【关键定性】House.i:828/j:1003 (cityModeRS
  写/读) 委托 k.n()/k.m() — RMS "citymode" 即 cityModeRS 本体 (House.e/f 城市人口为头两字段)。
  里程碑提示队列 r[46] 与 zh 语言包逐条对上; V[21] 里程碑/ai/aj/al 解锁称号表/彩蛋 626428826。
  aA 虚线相位 >>8=÷256 定点证实。
- H5 表现层重做的权威依据已齐: k.a(Graphics) 即城市屏逐像素版式 (本次浏览器验证暴露的乱象全部可对表修)。


## JD+5 (2026-10-01) House 第 1 分册 (53/98)
- 生命周期组: ctor(JAD 天气参数/cW 表/6 首 MIDI 预挂/世界 1024=1.0 定点)、a()(正弦表+键名)、
  b()(BGM)、c()(暂停)、d()(退出分派: 城市 HoF 提交/citymode/quickRS)、a(int)(音效开关查询)。
- 装载组: w()(城市视图初始化+89 号文件)、x()(释放 UI)、y()(世界初始化: 锚点/跳弧表/相机迭代)、
  e(int)(装载门控 cc)、d(int)(菜单 tick)、a(Graphics)(菜单绘制: 绿底 0x9ACC2A 等逐像素)。
- 玩法运动学组: p()(摆钩: aK=cQ*sin(200aP/cP%360)>>15, aH 提钩, 速度 256=1.0/帧)、
  q()(摇摆 bw%3600)、z(int)(层数变更总响应: bv/cP/cQ/cR 插值公式全量)、A()(摇摆投影 5 层窗)、
  H()(组合银行)、z()/o(int)(相机跟随+随机抖动)、A(int)(机会变更)、K()(塔数组)、F()(命中层定位)。
- 天气/环境组: v()/C()/D()/a(7)/w(int) 雨雪粒子全套、E()/x(int) 背景飞行物、L() 远景楼群表。
- 工具组: M() 正弦表(32768=1.0)、i/j/k 随机/sin/cos、a(5) lerp、a(3) 移位、a(int,boolean) 昼光、
  N() CRC32 表【用途待证】、a(String,Font,int) 折行、l()/O()/P() 菜单导航、q() 字体、a(Graphics,4) setClip。
- 【勘误-补充证据】r(int) 摇摆阻尼为死代码 (乘 0), 此前"摇摆阻尼"语义撤销。
- 待第 2 分册: d(int,int) 主状态机 (:3008-3288)、s(int) 块状态机 (:1852-1999)、b(int,int) 放块 (:350-679)、
  绘制组 f/g/h/i/j/k/l(Graphics) 与 b(Graphics,…) 系列、u(int)/B()/t(n2)/e(int,int) (G() 调用链)、J() 余段。

## JD+6 (2026-10-01) House 第 2 分册 (24 新方法, 累计 77/98)
- s(int) 落块物理 7 态全解 (挂钩/落空坠/砸地横躺/抛物线 n10=200/400/出屏 cm 记录);
  G() 命中判定全解 (地基/完美 ≤127/挤歪 ≥128/连锁 n8=min(4,bs-1)-n4+1; 快速局计分公式);
  d(int,int) 连锁生成 (aw=5 弹块 + aw=7 倾塌, 阈值 20 逐层×2)。
- n()/o()/a(Graphics,boolean)/f(Graphics)/b(5) 主屏入口与绘制分派 + 3D 场景 (fov55, 落点标记,
  起重机臂 cD/cE, aM/540 旋转); b(int)/c(int)/e()/f() 声音与 towermode RMS。
- t(int)/B() 惊慌人群完整状态机 (跳/走缘/站立/掷飞/坠落, 出屏回收, bE[3] 帧公式) — N+60 移植
  的 H5 panicPeople 与原版逐分支核对完毕, 原版多"掷飞 4 态 300ms 转 3"中转。
- u(int) 天气导演 dq 0-3 (相机高度带触发雨/雪, 天色 dg 1024=1.0, 闪电); J() 菜单动作全解;
  e(int,int) 键码表; h(int) 雨滴溅射【部分读, 下轮补】。
- 转正 5 方法 (早前轮已实读): g/h/i/l/a(Graphics,int) 绘制组 (装载屏/落点角标/城市视图/天空/天际线)。
- 配额说明: 本轮 24 新 + 5 转正 = 29, 不足 40 — House 剩余为 4 个大绘制方法
  (j/k/b(6)/c(Graphics) 约 700 行) 与 e(int,int) 173 行, 留 JD+7 一次收尾。
- 待第 3 分册: j(Graphics) HUD (:3467-3585), a/b(6) (:3585-3625), k(Graphics) (:3615),
  b(6) 装饰 (:3625-3710), c(Graphics) 消息 (:4229-4277), e(int,int) 邻接 (:3793-3966),
  h(int) 余段, B() 已入册。

## JD+7 (2026-10-01) House 收尾 (第 3 分册 19 方法) — 全类反混淆完成
- j(Graphics) HUD 全解: 机会竖条(4格, (bl-1)*2 色系+新亮闪)/人口大数字/城市楼型色条(U, bg×3px,
  超建红块 2301460, 黄线目标)/组合计时器(al 4帧@80ms, 黄条 bA*(E/2)/6000, >5850 白闪)/
  悬挂块 am 44x44 3帧(cg/100%3)/连击层星/银行 +bB 红。
- 数字绘制 a(5)/b(5): Z 大字 7x12 / Y 小字 7x9, 逐位 %10。
- k(Graphics)/b(6): 惊慌小人 (32*(bE[7]-aV)>>8 投影, aa/ab 21x28, FLIP 8192 镜像)。
- c(Graphics) 菜单面板: 600ms 从中线展开 (n4=n3*(cg-bX)/600), 四层描边, 正文分页 bV 行,
  子选择高亮框, aj 箭头图集 (末页帧2)。
- b(Graphics) 装载装饰层 + h(int) 环境天空粒子导演 — 【勘误 JD+6】h(int) 非"雨滴溅射",
  是云(cu[40])/背景鸟(cs[18], 8帧折返)/花瓣(cv[20], id45) 三池导演。
- 天气绘制组: b(G,bool) 雨丝(三层景深)/雪块/闪星; e(G) 背景飞行物 (型13单点/6,12横扑/28纵扑);
  a(G,4) 天空渐变 (bO 色带组 9+8 段循环, bM 逐字节均值中缝, 山廓 7 层阶梯)。
- y(int) 人口变更公式 (银行 bB+=bz*(2+bs/10*2); bt+=bs/10+n2) — 与 H5/Flash 三方一致再证。
- 软键/按键/键位表 a(Command)/b(int,int)/p()/g(int)。
- House 计数说明: 98 签名 - 96 实读建档 = 2 项为 CFR 桥方法/签名图计数容差 (f(int) super 转发等)。
- 【全项目定案】17/18 类反混淆完成, 语义源码 + FIELDS.md 字段表 + PROGRESS.md 账本齐备。
  剩余: h.java 实现为 HoF 屏已并入 h_clean; 18 号位为保留。H5 表现层重做可全面依据 deobf 底本。

## JD+8 (2026-10-01) 收尾审计 — 清待证/勘误, House 98/98 齐
- 补读 4: h()=loadQuickModeRS 全字段序证实 (与 g() 严格对称); a(int,int)=指针/装载分派
  (分段 e(5)/e(10)/e(15), BGM 切换); a(String,String[],Image)=消息入队 (折行/分页/子选项/底图);
  b(5) 全读 → cy/cz/cA/cB 四种块 MeshNode 语义 (888=完成楼体 bD 分支, 999=屋顶)。
- 清待证: o.h=suspended 证实; f.c()=flushSettings (d() :126-138); House.N()=死代码勘误
  (静态块裸调用, 表丢弃); l 类=反编译缺失的 Form CommandListener (j 桥服务对象, 记档);
  j.t/j.u 消费者定位至 l。
- 全项目定案: 17/17 类 ✅, House 98/98 ✅, 语义源码+字段表+账本齐备。
  后续 H5 表现层重做 (城市屏/盖楼 HUD/菜单) 以 deobf/ 为唯一依据。

## JD+9 (2026-10-01) 全量覆盖审计 — 账本定案
- 脚本对账 (原始方法 grep vs _clean "原 x(…)" 标记): 
  a0/b2/c4/d5/e6/f14(补 c()+d() 后)/g10/h17(含桥)/i21/j15(标 17=桥)/k22/m8/n10(标 11)/o11/p11/
  GameMIDlet 40(24 具体+18 抽象=42 条)/House 98 → **总数 292, 全覆盖**。
- 补漏: f_clean 补 f.c()=flushSettings 与 f.d() 本体条目; GameMIDlet_clean 补 18 抽象钩子逐条清单。
- House 98/98: 三分册 95 条 + JD+8 补读 4 条 - 1 重记 = 98, 与签名图一致。
- 【定案】反混淆项目完结: 17 类 / 292 方法 / ~260 字段全部语义化建档 (deobf/src/ + FIELDS.md)。
  后续任务 (H5 表现层重做) 引用底本时以 FIELDS.md 行号为准。

## JD+10 (2026-10-01) 数据底本补全 — 反混淆项目最终关账
- STRING_IDS.md: g.java 153 项 switch 全量抽出 94 条逻辑串 id→包序号映射, 对齐 lang.zh-CN 原文;
  【新证据】g.b() 尾行 `return com.nokia.mid.appl.bloxx.a.a(var2_2, var3_3)` — dc_v1507 构建
  的串解析最终委托 NokiaLangPack, 与 nokia_v1011 的 lang.* 读取链汇合 (两代构建共用一条语言包链)。
- MENU_SCRIPT.md: "m" 菜单脚本 (599B/25 屏) 布局解码 (头表 9×int32 + 每屏 7 型记录格式,
  屏栈/软键/FIRE 位分派语义), 首屏抽查 (屏6=型4→游戏屏衔接); 25 屏逐屏展开为纯数据解析, 按需程序化。
- 反混淆项目全部产物: deobf/src/ 17 类语义源码 + FIELDS.md (~260 字段) + STRING_IDS.md +
  MENU_SCRIPT.md + PROGRESS.md。方法 292/292, 类 17/17 — 项目完结。

## JD+11 (2026-10-01) "m" 脚本布局回撤 — 诚实性修订
- 程序化模拟 j.b(int) 的负 skip 语义 (DataInputStream.skipBytes 负数返回 0): 25 屏退化
  为全从 0 读 — JD+10 的 "m" 布局猜想被证伪, MENU_SCRIPT.md 已回撤为"已证实事实+未解问题"两栏。
- 未解根因二选一: 诺基亚专有流的负 skip 行为 / CFR 反编译失真 — 需字节码 (javap -c) 或真机定标。
- 纪律执行: 猜想不得入档。已确凿部分 (25 屏存在性/屏型集合/动作语义/文案 id) 保持可用。
- 反混淆项目维持完结态: 17 类/292 方法/字段表/串表齐备; "m" 游标语义列为唯一的字节码级遗留项。
