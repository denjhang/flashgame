// ============================================================================
// i.java → MessageRenderer (消息/菜单浮层渲染器 — JD+3 部分: 12/~25 方法)
// 原文件: i.java (867 行) — 与 j(菜单脚本) 配对: j 解析 "m" 脚本, i 绘制浮层。
// 证据: 三种浮层模式 a=0 无/1=图标菜单列表/2=消息框/3=文本框; f.c=请求重绘标志
//       (GameMIDlet.d(Graphics) :244 消费)。House 的 statusQ/消息队列
//       (House.a(g.d(x),…) :1727 等) 最终走本类 a(…) 系列。
// 未完成: b/c/d/e(Graphics) 绘制内部与 a(String,int,Font) 折行 — 下轮续。
// ============================================================================

public final class MessageRenderer {
    protected static int displayMode;      // 原 a: 0 无 / 1 菜单列表 / 2 消息框 / 3 文本框
    public static Image titleIcon;         // 原 b: 当前浮层标题图标
    private static String[] wrappedTitle;  // 原 d: 折行后标题行
    private static int[] settingSlots;     // 原 e: 设置槽表 (init 入参, j.c() case5 写用)
    private static int lineStride;         // 原 f: 行高 = boldSmall.getHeight()+4
    private static int alignMode;         // 原 g: 1=居中 / 其他=按横竖屏
    private static boolean multiPage;      // 原 h: 正文多页
    private static int pageScroll;         // 原 i: 正文页滚动序号
    private static Image cornerIcon;       // 原 j: init 装入 (id0)
    private static boolean lastPageReached;// 原 k: b() 返回
    private static int itemCount;          // 原 l: 菜单列表项数
    private static long openClock;         // 原 m: 浮层打开时刻
    private static Image[] itemIcons;      // 原 n
    private static String[][] itemTexts;   // 原 o: 折行后项文本
    private static int[] itemAligns;       // 原 p
    private static int iconMaxH;           // 原 q
    private static int iconMaxW;           // 原 r
    private static String[][] bodyPages;   // 原 s: 正文分页
    private static int boxX, boxY, boxW, boxH;         // 原 u/v/w/x
    private static int titleY, textTopY;   // 原 z/y
    private static int alpha;              // 原 A: 消息框整体透明度 (255)
    private static int[] colors;           // 原 B: int[3] 配色 (调用方传 {-1,-1,-1})
    private static Font titleFont;         // 原 C: (32,1,0) bold system
    private static Font bodyFont;          // 原 D: (32,0,8)
    private static Font itemFont;          // 原 E: (32,1,8)
    private static boolean noContent;      // 原 F: 标题为空 → 只在首帧画

    /** 原 i.a(int[]): init — 三字体 + 行高 + 设置槽表 + 角标图(id0) + f.c=true。 */
    public static void init(int[] slots) { /* :48-56 */ }

    /** 原 i.a(Graphics): 绘制分派 — mode 1→b(g) 菜单列表 / 2→c(g) 消息框 / 3→d(g) 文本框;
     *  收尾 F||单行 → f.c=false (停止重绘请求)。 */
    public static void paint(Graphics g) { /* :58-76 */ }

    /** 原 i.a(int,Image,String,int,int,int,int,int,String): 开菜单列表浮层
     *  (项数, 标题图, 标题串, 对齐, x,y,w,h, 底串)。 */
    public static void openMenuList(int count, Image icon, String title, int align,
                                    int x, int y, int w, int h, String footer) { /* :77-93 */ }

    /** 原 i.a(Image,String,int,int,int,int,int,String): 开消息框 (alpha=255)。 */
    public static void openMessageBox(Image icon, String title, int align,
                                      int x, int y, int w, int h, String footer) { /* :94-107 */ }

    /** 原 i.a(int,int,int,int,int,int,int[]): 开文本框 (w/h clamp 到屏内, 配色3项)。 */
    public static void openTextBox(int x, int y, int w, int h, int innerH,
                                   int alpha, int align, int[] palette) { /* :108-127 */ }

    /** 原 i.a(): 清浮层 (c() + f.c=true)。 */
    public static void close() { /* :128-132 */ }

    /** 原 i.a(int,Image,String,int): 追加菜单项 (图标最大宽高累计, 文本按容器宽折行)。 */
    public static void addMenuItem(int index, Image icon, String text, int align) { /* :133-147 */ }

    /** 原 i.a(String): 设正文 (按容器宽折行分页; >1 页 → multiPage+滚动归零)。 */
    public static void setBody(String text) { /* :148-160 */ }

    /** 原 i.a(int): 正文滚动 (clamp 0..页数-1, 末页→k=true; f.c=true; c=f.a 光标同步)。 */
    public static void scrollBody(int delta) { /* :161-170 */ }

    /** 原 i.b(): 正文是否已到末页。 */
    public static boolean atLastPage() { /* :171-173 */ }

    /** 原 i.a(Image,String) private: 标题/图标装载与容器几何推演
     *  (y=26 起; 有图抬到 图高+12+标题高; w/h=-1→全屏 clamp)。 */
    private static void setupHeader(Image icon, String title) { /* :175-203 */ }

    /** 原 i.c() private: 状态全清 (displayMode=0, 各引用置 null, 几何=-1)。 */
    private static void resetState() { /* :205-234 */ }

    /** 原 i.b(Graphics) private: 菜单列表绘制 (读头部: 行高=body 字体/图标取 max;
     *  横屏光标右置/竖屏左置; g==1 整行居中; 视口行数按 h-16 或 h-52 分页)。 */
    private static void drawMenuList(Graphics g) { /* :236-… */ }

    // 其余 c(Graphics)/d(Graphics)/e(Graphics)/a(String,int,Font)/访问器 — 下轮 (JD+4) 续。
}
