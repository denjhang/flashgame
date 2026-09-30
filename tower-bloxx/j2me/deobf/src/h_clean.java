// ============================================================================
// h.java → HallOfFameScreen (高分榜屏: HoF 存取/排位/名字录入/榜单绘制)
// 原文件: h.java (603 行, 19 方法 + 26 字段)
// 证据: RMS "HoF" (:80/:104/:217); 排位插入 a(int[],String):236-260 (3 行,
//       首列 b[..][0]=分数); 名字录入软键 OK(4)/BACK(2) :570-585; 横竖屏分支
//       f.a(4) (:348/:365); 图例串 g.d(155/156/157) :514-544。
// ============================================================================
// import javax.microedition.lcdui.*;

public final class HallOfFameScreen implements ScreenCallback /* a */ {
    private String[][] tableNames;        // 原 a: [榜数][3] 名字
    private int[][][] tableScores;        // 原 b: [榜数][3][列] 分数 (列0=主分)
    private String lastName;              // 原 c: 最后玩家名 (writeUTF 首项 :105)
    private int[] lastScores;             // 原 d: 提交分数副本
    private int submitTable;              // 原 e: 提交目标榜号
    private int submitRank;               // 原 f: 排位结果 (4=入榜首行? :133)
    private GameMIDlet game;              // 原 g
    private SplashScreen splash;          // 原 h: 底层 splash (过渡动画)
    private int entryState;               // 原 i: -1 无 / 0 消费完 / 1 新纪录输入 / 2 挑战确认
    private int shownState;               // 原 j: 已渲染态 (b() 后 = i)
    private int pendingNameState;         // 原 k: BACK 时回退的目标态
    private boolean nameConfirmPending;   // 原 l: c() 单次消费标志
    private Command[] softkeys;           // 原 m: 当前软键组
    private static CanvasScreen canvas;   // 原 n (static m)
    private static int[][] keymaps;       // 原 o: game.p() 键位表 (兼榜数定义)
    private static Command okCommand;     // 原 p
    private static Command backCommand;   // 原 q
    private static final int rankLabelW;  // 原 r: font.stringWidth("3. ")
    private static final int leftX;       // 原 s: 竖屏左起点 = 8+rankLabelW
    private static final int rightX;      // 原 t: 横屏右起点 = E-8-rankLabelW (右对齐布局)
    private static final int trophyRightX;// 原 u: rightX-8
    private static final int trophyLeftX; // 原 v: leftX+8
    private static final int lineH;       // 原 w: 字体行高
    private static final Font smallFont;  // 原 x: FACE_SYSTEM/STYLE_PLAIN/SIZE_SMALL? (32,0,8)
    private static final Font boldFont;   // 原 y: (32,1,8)
    private static Image imgTrophy;       // 原 z: id6 (榜行图标)
    private static Image imgPop;          // 原 A: id7 (人口图标)
    private static Image imgBlocks;       // 原 B: id8 (高度图标)
    private static Image fadeWide;        // 原 C: 椭圆羽化蒙版 (E×lineH)
    private static Image fadeTall;        // 原 D: 椭圆羽化蒙版 (E×2lineH)
    private static boolean viewLandscape; // 原 E: 56/6 键切换 (:552-556)
    private static boolean viewPortrait;  // 原 F: 50/1 键切换
    private static boolean legendPending; // 原 G: 初始 true (先画图例)
    private static boolean legendDone;    // 原 H: 图例已画完 (版面够时置位)

    /** 原 h(): 预载 id6/7/8 图标 + 生成两张羽化蒙版。 */
    public HallOfFameScreen() { /* :58-64 */ }

    /** 原 a(GameMIDlet, j, m): 绑定 —— keymaps=p(); 开 RMS "HoF": 无档→空榜建档, 有档→readHoF。 */
    public final void bind(GameMIDlet midlet, SplashScreen splash, CanvasScreen canvas) { /* :66-100 */ }

    /** 原 a() private: writeHoF —— writeUTF(lastName) + 每榜 3 行 (UTF 名 + int[] 分)。 */
    private void writeHoF() { /* :102-121 */ }

    /** 原 a(int, int[], String): 提交分数 —— 榜号, 分数组, 玩家名(null=弹录入)。
     *  达标: 入榜/弹录入, 返回 rank; 未达标: -1。f=4 为入榜标记。 */
    public final int submitScore(int tableIdx, int[] scores, String playerName) { /* :123-163 */ }

    /** 原 b() private: 建录入 UI —— i==2: 挑战消息 g.d(146)+OK 软键;
     *  i==1: 新纪录 g.d(151)+名字输入 g.d(143)+BACK; 转发 splash.a(rows, mode)。 */
    private void buildEntryUi() { /* :165-202 */ }

    /** 原 c() private: 名字确认回写 —— 读 f.c(0) 自定义名 → 插榜 → ((House)g).b(1)。 */
    private void onNameConfirmed() { /* :204-213 */ }

    /** 原 d() private: readHoF —— writeUTF/int 对称读。 */
    private void readHoF() { /* :215-234 */ }

    /** 原 a(int[], String) private: 排位插入 —— 3 行降序, 逐行下移腾位。 */
    private void insertScore(int[] scores, String playerName) { /* :236-260 */ }

    /** 原 o(): 屏幕激活 (ScreenContract) —— j==-2/-1 → splash 帧步进。 */
    public final void onShow() { /* :262-279 */ }

    /** 原 n(): 屏幕隐藏 —— f.a(13)==1 (游戏局达标标记) → entryState=1 新纪录。 */
    public final void onHide() { /* :281-286 */ }

    /** 原 a(int, int): tick —— 建 UI 一次; nameConfirmPending→onNameConfirmed; 转发 splash tick。 */
    public final void tick(int deltaTime, int gameTime) { /* :288-299 */ }

    /** 原 a(Graphics, boolean): 绘制 —— shownState==1: i.a(g) 底层+榜单+图例。 */
    public final void paint(Graphics g, boolean fullRedraw) { /* :301-311 */ }

    /** 原 c(int, int) static: 生成椭圆羽化 alpha 蒙版图 (RGB: alpha=160·fx·fy)。 */
    private static final Image createFeatherMask(int w, int h) { /* :313-335 */ }

    /** 原 a(Graphics) private: 榜单绘制 —— 标签 g.d(92)(最高成绩)/g.d(154)/g.d(91)(高度),
     *  表 1 (b[1]) 三行: 名字(z 图标)+分1(A)+分2(B); 横屏右对齐/竖屏左对齐; 底部滚动箭头 i.b()。 */
    private void drawHofList(Graphics g) { /* :337-496 */ }

    /** 原 a(Graphics, int, boolean) static: 图例 —— g.d(155/156/157) 三图标说明行。 */
    private static void drawLegend(Graphics g, int y, boolean withArrow) { /* :498-550 */ }

    /** 原 b(int, int): 按键 —— 56/6=切横屏, 50/1=切竖屏, 53/8 FIRE 忽略, 其余转发 splash。 */
    public final void onKey(int keyCode, int gameAction) { /* :552-568 */ }

    /** 原 a(Command): 软键 —— OK(4)→名字确认; BACK/CANCEL(2,3)→j==2 转发否则回退 i=k。 */
    public final void onCommand(Command command) { /* :570-585 */ }

    // 静态块 (:587-601): 字体度量/两字体/视图布尔初始化
}
