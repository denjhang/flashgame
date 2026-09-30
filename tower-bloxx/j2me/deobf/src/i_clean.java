// ============================================================================
// i.java → MessageRenderer (消息/菜单浮层渲染器 — JD+4 完整版 21 方法)
// 原文件: i.java (867 行, 21 方法 + 31 字段)
// 与 j(菜单脚本解释器) 配对: j 解析 "m" 脚本, i 绘制浮层。House 消息队列
// (a(g.d(x),…) 系列) 最终走本类。三种浮层: displayMode 1 菜单/2 消息框/3 文本框。
// f.c=请求重绘标志 (GameMIDlet.d(Graphics):244 消费, 画完自动撤)。
// ============================================================================
import java.util.Vector;
// import javax.microedition.lcdui.*;

public final class MessageRenderer {
    protected static int displayMode;      // 原 a: 0 无 / 1 菜单列表 / 2 消息框 / 3 文本框
    public static Image titleIcon;         // 原 b: 浮层标题图标
    private static String[] wrappedTitle;  // 原 d: 折行后标题 (e() 跑马灯轮播)
    private static int[] settingSlots;     // 原 e: 设置槽表 (j.c() case5 写用, init 入参)
    private static int lineStride;         // 原 f: 行高 = boldSmall.getHeight()+4
    private static int alignMode;          // 原 g: 1=整行居中 / 0=按横竖屏
    private static boolean multiPage;      // 原 h: 正文多页 (需滚动)
    private static int pageScroll;         // 原 i: 正文页序号
    private static Image cornerIcon;       // 原 j: 18x18 箭头图集 (id0, a/b(G,3,bo) 取帧)
    private static boolean lastPageReached;// 原 k: 正文已到末页
    private static int itemCount;          // 原 l: 菜单列表项数
    private static long openClock;         // 原 m: 标题跑马灯起始时刻
    private static Image[] itemIcons;      // 原 n
    private static String[][] itemTexts;   // 原 o: 折行后项文本
    private static int[] itemAligns;       // 原 p: 2=禁用项 (灰)
    private static int iconMaxH;           // 原 q
    private static int iconMaxW;           // 原 r
    private static String[][] bodyPages;   // 原 s: 正文分页 (a(4) wrap 产物)
    private static int boxX, boxY;         // 原 u/v
    private static int boxW, boxH;         // 原 w/x (-1=全屏 clamp)
    private static int titleBandH;         // 原 y: 标题带高 (≥26, 有图抬升)
    private static int iconTopY;           // 原 z: 图标 y (0)
    private static int boxAlpha;           // 原 A: 消息框底色 alpha (255)
    private static int[] palette;          // 原 B: int[3] 自定义配色 (-1=用 e 表)
    private static Font titleFont;         // 原 C: (32,1,0)
    private static Font bodyFont;          // 原 D: (32,0,8)
    private static Font itemFont;          // 原 E: (32,1,8)
    private static boolean noContent;      // 原 F: 标题为空 → 仅首帧画

    /** 原 i.a(int[]): init — 三字体/行高/设置槽表/角标图集(id0)/f.c=true。 */
    public static void init(int[] slots)

    /** 原 i.a(Graphics): 绘制分派 — 1→drawMenuList / 2→drawMessageBox / 3→drawTextBox;
     *  收尾 noContent||单行标题 → f.c=false。 */
    public static void paint(Graphics g)

    /** 原 i.a(9): 开菜单列表浮层 (项数/标题图/标题/对齐/x,y,w,h/底串)。 */
    public static void openMenuList(int count, Image icon, String title, int align, int x, int y, int w, int h, String footer)

    /** 原 i.a(8): 开消息框 (boxAlpha=255, textTop=w-32)。 */
    public static void openMessageBox(Image icon, String title, int align, int x, int y, int w, int h, String footer)

    /** 原 i.a(7): 开文本框 (w/h clamp 屏内, 配色3项拷入 palette)。 */
    public static void openTextBox(int x, int y, int w, int h, int innerH, int alpha, int align, int[] pal)

    /** 原 i.a(): 关浮层 (resetState + f.c=true)。 */
    public static void close()

    /** 原 i.a(4): 追加菜单项 (图标 max 累计; 文本按 w-24-iconMaxW 折行; align 存 p[])。 */
    public static void addMenuItem(int index, Image icon, String text, int align)

    /** 原 i.a(String): 设正文 (按容器宽折行分页; 多页→multiPage+滚动归零)。 */
    public static void setBody(String text)

    /** 原 i.a(int): 正文滚动 (clamp; 末页→k=true; f.c=true; protected c=f.a 菜单光标同步)。 */
    public static void scrollBody(int delta)

    /** 原 i.b(): 正文是否末页。 */
    public static boolean atLastPage()

    /** 原 i.a(Image,String) private: 头部几何 — noContent 判定, 标题折行宽 (有图-30/无图-8),
     *  titleBandH≥26 且有图取 图高+12+标题高; boxW/H=-1→全屏 clamp。 */
    private static void setupHeader(Image icon, String title)

    /** 原 i.c() private: 状态全清 (31 字段复位)。 */
    private static void resetState()

    /** 原 i.b(Graphics) private: 菜单列表 — 基础 e(g); f.c 时: 行高=max(字体,图标+2),
     *  横屏文字右对齐 (x+w-16-r) 竖屏左 (x+16+r); 光标行高亮 (e[6], 横屏宽=文本+16+r);
     *  p[n]==2 禁用色 e[5]; 选中项 itemFont+e[7]; 图标居中偏移±1 选中态;
     *  上下溢出 → 画上/下箭头 (a/b(G,3,bo))。 */
    private static void drawMenuList(Graphics g)

    /** 原 i.c(Graphics) private: 消息框 — e(g) 头 + a(g,false) 正文 (无箭头)。 */
    private static void drawMessageBox(Graphics g)

    /** 原 i.d(Graphics) private: 文本框 — 裁剪到 box; palette[1] 启用时:
     *  底色 palette[1] (回退 e[4]), 边框线 palette[2] (回退 e[8]); 再 a(g,true) 正文。 */
    private static void drawTextBox(Graphics g)

    /** 原 i.e(Graphics) private: 标题带 — 顶色 e[1]; 图标 (noContent?f.c:有图) 居中 anchor 17;
     *  标题 y 推演; 多行标题跑马灯: 周期 =1500ms×行数+500ms, 行停留 1500ms/滚动 500ms,
     *  下一行自底滑入 (n15=bandH*n11/500); 单行且 f.c 直绘。 */
    private static void drawTitleHeader(Graphics g)

    /** 原 i.a(Graphics, boolean) private: 正文绘制 — 逐行 bodyFont, alignMode=1 居中;
     *  multiPage 且 pageScroll>0 → 上箭头; 末页 k → 下箭头 (bl 参数控高亮态);
     *  正文起始 y = boxY+8+18 (菜单模式再加 18); 收尾恢复裁剪。 */
    private static void drawBody(Graphics g, boolean arrowActive)

    /** 原 i.a(Graphics,int,int,boolean): 画上箭头 — 裁剪 18x18 取图集第 0 帧 (bl=恢复全裁剪)。 */
    public static void drawArrowUp(Graphics g, int x, int y, boolean restoreClip)

    /** 原 i.b(Graphics,int,int,boolean): 画下箭头 — 取图集帧: bl? y-36 帧2 : y-18 帧1
     *  (图集 j 竖排 3 帧, 各 18px)。 */
    public static void drawArrowDown(Graphics g, int x, int y, boolean active)

    /** 原 i.a(String,int,Font) private: 折行 (不限页高) → a(4) 页高=-1。 */
    private static String[] wrapText(String text, int width, Font font)

    /** 原 i.a(String,int,int,Font) private: CJK 折行+分页 — 断点优先 空格/句号.,
     *  句号后随 '.'/' ' 连断; 溢出逐字强断; '\\p' 强制分页; '。'(12290) 悬挂补偿
     *  (上一页末行回拼); 页高 n2=-1 表示不分页。返回 [页][行]。 */
    private static String[][] wrapTextPaged(String text, int pageHeight, int width, Font font)

    // 静态块: g/l/c=0, u..A=-1, B=new int[3]
}
