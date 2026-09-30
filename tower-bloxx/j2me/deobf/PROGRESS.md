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
| GameMIDlet.java | 476 | ~25 | ⬜ | |
| k.java | 1491 | ~60 | ⬜ | |
| i.java | 867 | ~40 | ⬜ | |
| j.java | 584 | ~30 | ⬜ | |
| p.java | 209 | ~15 | ⬜ | |
| h.java | 603 | ~25 | ⬜ | |
| House.java | 4420 | 98 | ⬜ (字段表起步见 FIELDS.md) | |

**方法计数: 67 / ~340 (JD+1)。类: 10/17。**

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
