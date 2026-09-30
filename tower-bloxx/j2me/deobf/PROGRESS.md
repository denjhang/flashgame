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
| k.java | 1491 | ~60 | ⬜ | |
| i.java | 867 | ~40 | ⬜ | |
| j.java | 584 | ~30 | ⬜ | |
| p.java | 209 | ~15 | ⬜ | |
| h.java | 603 | 19 | ✅ JD+2 | h_clean.java (HallOfFameScreen) |
| House.java | 4420 | 98 | ⬜ (字段表起步见 FIELDS.md) | |

**方法计数: 112 / ~340 (JD+2)。类: 12/17。**

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
