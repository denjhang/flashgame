// ============================================================================
// j.java → MenuScriptInterpreter (菜单脚本解释器 — 读 jar 文件 "m" 的屏幕描述树)
// 原文件: j.java (584 行, 14 方法 + 8 桥接访问器)
// 【重大勘误 JD+3】本类不是 SplashScreen — GameMIDlet.z/new j(w) 是**菜单屏**:
//   快速游戏/建造城市/最高分/规则/设置/关于全部由 "m" 脚本驱动, i 类渲染。
//   之前 PARITY/H5 的 "splash" 语义按此更正。
// "m" 文件布局 (逆向自 ctor/b(int)/d()):
//   头: u16 屏数 N → 9×int32 (b[9], 用途待证——疑每屏入口偏移)
//   每屏: 屏型 i (0=图标菜单列表 / 1=图文页 / 2=全屏消息 / 3=名字录入 / 5=设置 /
//         6=三类设置 / 7=条件跳转), u16 返回屏 g, u16 前进屏 h, 再按型分节。
//   屏型0 菜单项: u16 项数 → 每项 [u16 id, u16 类型(4=设置循环项), u16 子项数,
//         u16 图标资源, u16×3 串/布局, 目标屏/设置对 (e[] 数组)]
//   所有数值原语经 d(int) 静态方法: 正数=定宽读, 负数=-skipBytes(回退重读)。
// ============================================================================
import java.io.DataInputStream;
// import javax.microedition.lcdui.*;

public final class MenuScriptInterpreter implements ScreenContract /* e */ {
    private static int[] bootTable;            // 原 b: 头部 9×int32 (ctor 读, i.a(j.a()) 转交渲染器)
    private static int[][] itemTable;          // 原 c: 菜单项 [项][8] (d() 装载)
    private static String[] subItemNames;      // 原 d: 设置循环项子名 ("名 [子名]")
    private static int[] settingPairs;         // 原 e: 设置项 (f.a 槽, 值) 对 — c() case5 写
    private static int itemCount;              // 原 f: 当前屏菜单项数 (亦作临时: a(int,int,Command[]) 里=模式)
    private static int backScreenId;           // 原 g: 返回屏 id (屏头 u16)
    private static int forwardScreenId;        // 原 h: 前进屏 id (屏头 u16)
    private static int screenType;             // 原 i: 当前屏型 (0/1/2/3/5/6/7)
    private static DataInputStream scriptStream;// 原 j: "m" 流
    private static boolean loadOnNextTick;     // 原 k: a(int,int) 首帧装载当前屏
    private static boolean showList;           // 原 l: FIRE 确认标志
    private static boolean goBackRequested;    // 原 m: BACK → 回跳 forwardScreenId
    private static int scrollDelta;            // 原 n: 上下键 ±1
    private static int actionDelta;            // 原 o: 左右键 ±1 (设置循环项)
    private static CanvasScreen canvas;        // 原 p (static m)
    private static Command[] activeSoftkeys;   // 原 q
    private static boolean rendererNeedsReset; // 原 r: 屏型切换 → i.a() 重置
    private static int targetScreenMode;       // 原 s: 本屏对应 f.g 屏幕模式 (b(int) 按型设 0..4)
    private StringBuffer nameBuffer;           // 原 t【待证: 仅声明, 未见消费】
    private int nameResult;                    // 原 u【待证: 经 b(j,int)/c(j) 桥被 l 监听器用】
    private Form nameForm;                     // 原 v: 名字录入表单 (a(int,int,Command[]) i==3)
    private TextField nameField;               // 原 w: 录入框 (10 字符, 密码位按 n3)
    private static TextField sharedNameField;  // 原 x: b() 读取用
    private boolean soundToggleReturn;         // 原 y: a(int) 音效开关回跳标志
    private boolean returnToQuick;             // 原 z: 回快速设置屏
    private boolean returnToCity;              // 原 A: 回城市建设设置屏
    Command backCommand = new Command(g.d(150), 2, 0);  // 原 a: 表单返回键 (g.d(150)=取消)

    /** 原 j(m): 读 "m" 头 — u16 屏数 N, 回退 2N 字节, b[9]×int32; f.b=历史栈 int[N]; b(6) 开首屏。 */
    public MenuScriptInterpreter(CanvasScreen canvas) { /* :59-78 */ }

    /** 原 a(): 暴露 bootTable 给渲染器 (GameMIDlet 构造: i.a(j.a()))。 */
    public static int[] getBootTable() { return bootTable; }

    /** 原 a(int, int, Command[]): 软键装配 — i==3: 建 Form(g.d(146)=挑战) + TextField(10 字)
     *  (旧名 f.c(0) 预填, 密码位 n3==1?3:0) + CommandListener, Display.setCurrent; 否则注册软键。 */
    public final void setupSoftkeys(int mode, int arg, Command[] commands) { /* :84-122 */ }

    /** 原 b(int): openScreen(id) — id=19 特判 c(2); 从 "m" 读屏头 (回退定位 2n-1):
     *  u16 描述长→回退, u16 屏型 i, u16 g, u16 h; 型 7=条件跳转 (读设置槽值决定下一屏);
     *  型 5/6/4→s=2/3/1, 否则 s=0+k=true; f.b()! =s → r=true; f.d(id) 记屏; 清旧软键。 */
    private void openScreen(int screenId) { /* :124-176 */ }

    /** 原 d() private: loadScreen — 按屏型解析脚本体:
     *  型2: 全屏消息 (i.a(矩形,255,底色) + i.a(g.d(串)));
     *  型0: u16 图资源 + u16 串 + 软键数×[u16 串 id, u16 型] → 菜单项循环
     *       (项: u16 id, 类型≠0 时 u16=f.b(槽) 设置回显; 名=串+[子串]; c[][0..7] 布局);
     *  型1: 图文页 (正文串 + u16 选项→e[]); 收尾: f.a=f.b[栈顶], y/z/A 音效回跳修正,
     *       e() 注册软键, i.a(0) 滚动复位。 */
    private void loadScreen() { /* :178-288 */ }

    /** 原 e() private: 软键重注册 (i≠3 时全组移除重挂, 带图标)。 */
    private void rebindSoftkeys() { /* :290-299 */ }

    /** 原 c(int): 动作位分派 — 由高位到低位消费:
     *  bit0: 弹栈回退 (f.b[槽-1]=0→b(槽)); bit1: s=4+r=true (退出菜单态);
     *  bit2: 设置循环项 (f.a(槽,(现值+actionDelta)%子项数), 刷新名串);
     *  bit5: 写设置对 e[配对槽] 两两 f.a(槽,值)。 */
    private void handleActionBits(int actionBits) { /* :301-342 */ }

    /** 原 a(int): 屏幕激活 (ScreenContract) — 音效开关特殊回跳三态判定
     *  (f.a(12)==5/6 与 f.b(8)/f.b(9) 组合 → y/z/A); f.e(0); case1→b(g) 返回屏, case2→b(h)。 */
    public final void onShow(int screenId) { /* :344-377 */ }

    /** 原 o(): 每帧入口 — r → i.a() 渲染重置 + f.e(s); n()/a(int,int)/paint 全部转 i 渲染器。 */
    public final void onShow() { /* :379-385 */ }

    /** 原 n(): 屏幕隐藏 (空实现)。 */
    public final void onHide() { /* :387-388 */ }

    /** 原 a(int, int): tick — k→d() 装载; n 滚动 (型0: 光标 f.a 移动并入历史栈;
     *  型2 消息末页+下→b(h)); o 确认 (型0 类型4=设置项→c(4)); l=FIRE→c(项类型); m→b(h)。 */
    public final void tick(int deltaTime, int gameTime) { /* :390-437 */ }

    /** 原 a(Graphics, boolean): 绘制 — 全权委托 i.a(g)。 */
    public final void paint(Graphics g, boolean fullRedraw) { /* :439-441 */ }

    /** 原 b(int, int): 按键 — 50/上→n=-1, 56/下→n=1, 53/FIRE→l, 52/左→o=-1, 54/右→o=1
     *  (gameAction 1/2/5/6/8 同义); 数字键直通忽略。 */
    public final void onKey(int keyCode, int gameAction) { /* :443-492 */ }

    /** 原 a(Command): 软键 — OK(4)→l=true; BACK(2)→型0/1/3 时 m=true; CANCEL(3) 忽略; 型7→c(2)。 */
    public final void onCommand(Command command) { /* :494-512 */ }

    /** 原 d(int) static: 流读取原语 — 1=readByte, 3=readShort, 2=readUnsignedByte,
     *  4=readInt, 负数=skipBytes(-n2) 回退。 */
    private static int readPrimitive(int widthCode) { /* :514-542 */ }

    /** 原 b() static: 取录入名 (sharedNameField 去空白换行) — h(HoF) 名字录入回读用。 */
    public static String getEnteredName() { /* :544-546 */ }

    // 原 a(j,int)/a(j)/b(j)/b(j,int)/c(j)/a(j,Form)/a(j,TextField)/c() static:
    // 包私有桥接访问器 (l 类 CommandListener 与友元消费), 语义同其字段。
}
