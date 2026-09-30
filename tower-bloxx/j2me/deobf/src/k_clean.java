// ============================================================================
// k.java → CityMapScreen (城市视图屏 — 网格/放置/里程碑/存档, JD+4 完整 22 方法)
// 原文件: k.java (1491 行, 22 方法 + ~50 字段)
// 定位: GameMIDlet.q() 之外的城市主屏逻辑体; House.j():1003 (cityModeRS 读)
//       与 House.i():828 (写) 分别委托本类 m()/n() — RMS "citymode" 即
//       cityModeRS 本体。House.e/f = 城市总人口字段 (存档首两 int)。
// ============================================================================
// import javax.microedition.lcdui.*;

public final class CityMapScreen {
    // ---- 常量表 (静态块 :1438-1491) ----
    // A[6]  = 天空渐变起止 RGB (y58..F-55 线性插值)
    // B[18] = 地平线带 18 色 (含两条 40px 大色块 idx2/3)
    // C[8]  = 楼型面色 (0-3 常态 / 4-7 选中亮色)
    // D[4]/E[4] = 可建格三级底/面色; F[8] = 楼型格面色 (0-3 常态/4-7 脉冲亮色)
    // V[21] = 里程碑人口表 {0,75,150,…,19000} — 城市等级 h 的刻度
    // ai[4] = {0,3,6,10} 楼型解锁等级; aj[4]={8,12,14,16} 替换解锁等级
    // al[10]={0,1,4,7,9,11,13,15,18,20} 升格称号阈值 (小小镇→特大都市)
    // au    = "626428826" 作弊密码 (a(int,int) 逐键比对 → at=true 无限建)

    public static int[] cityCells;        // 原 a: int[75] = 25 格×3 (类型/人口/roof帧) — 城市地图本体
    public static int[] buildableLevel;   // 原 b: int[25] 每格可建类型上限 (h() 重算 0-3)
    public static Image[] towerIcons;     // 原 c: Image[9] = r0 id71-79 楼型/里程碑图标
    public static boolean hudMsgShown;    // 原 d: 消息弹出中 (f() 返回)
    public static int selTowerType;       // 原 e: 选中楼型 0-3
    public static int uiMode;             // 原 f: 0=常态 / 1=盖楼模式
    public static int cityPopulation;     // 原 g: 城市总人口 (动画滚动值)
    public static int cityLevel;          // 原 h: 城市等级 (V 刻度)
    public static int selCol;             // 原 i: 光标列 -1=起重机位
    public static int selRow;             // 原 j: 光标行
    public static boolean placeAnimActive;// 原 l: 放置动画中 (ab 3000ms)
    public static int milestoneLevel;     // 原 n: 称号档 (al 表)
    static boolean firstTipShown;         // 原 o: 提示队列占用标志
    public static int replaceLevel;       // 原 p: 替换提示等级 (m 表, -1 初始)
    static boolean cheatMode;             // 原 q: at
    public static boolean[] tipFlags;     // 原 r: boolean[46] 里程碑提示已显示
    public static int popFlashTimer;      // 原 s: 人口变化闪烁计时 (ap=闪烁帧相)
    public static int popFlashDigits;     // 原 t: 闪烁位数 (变化量级 1-5)
    public static int cranePopValue;      // 原 u: 起重机侧显示的人口增量
    public static boolean mapFullFlag;    // 原 v: 地图占满事件 (j() 消费)
    public static String[] towerNames;    // 原 w: 状态条文本行 (House.a 折行产物)
    // 私有: L边框柱(id21)/M箭头滑块(id22)/N居民条(id23)/O起重机(id24)/P[5]城市塔图标(id25-29)/
    //       Q放置动画6帧(id30)/R摧毁动画6帧(id31)/S,T,U状态图标(id15,16,17)/
    //       W新楼类型/X新楼人口/Y新楼roof/Z,aa光标滚动偏移/ab放置动画计时/ac字体/ad[12]三组文案/
    //       ae,af,ag状态文案(g.d 65/66/64)/ah放置结果文案/ai,aj,al,au,at(cheat)/av密码进度/
    //       aw旧人口(放置前)/ax帧脉冲(800ms)/ay地图满/az可建上限/aA虚线相位(>>8=÷256! :917)/
    //       aB[16]行列建筑范围/aC状态条行数/aD跑马灯偏移/aE跑马灯停留/aF盖楼飞入动画(700ms)/
    //       aG落定脉冲(2000ms)/aH可取消标志

    /** 原 k.a(): 城市屏 UI 初始化 — 字体/数组/三组文案 (楼型名 g.d(99-102),
     *  解锁 g.a(62,{楼名,等级}), 人口需求 g.a(63,{人口}), 状态条 g.d(64/65/66))。 */
    public static void initCityUi()

    /** 原 k.b(): 重置城市会话 (uiMode=0, 光标 2/2, 计时清零; 首次提示 g.d(36))。 */
    public static void resetCitySession()

    /** 原 k.c(): 分段装载城市图像 — id21-31 与 id15/16/17 与 c[9]=id71-79,
     *  House.e(20..100) 门控; am=楼型名表 ("-"+g.d(71..79)), an=替换提示表 (g.d(47/49/50))。 */
    public static boolean loadCityImages()

    /** 原 k.a(int,int,int): 进入盖楼模式 (类型,人口,roof) — uiMode=1, 飞入动画 700ms,
     *  cheat 时 pop=0 特判 o(); 首次提示 g.d(39)+158 / 替换提示 g.d(46)。 */
    public static void startBuild(int towerType, int population, int roofFrame)

    /** 原 k.d(): 下一格最低人口需求 (m≥e ? e+5 : e+1)。 */
    public static int nextPopulationTarget()

    /** 原 k.a(int, int): 城市屏按键 — 方向布尔置位 (c(kc,ga) 0-3, FIRE=5);
     *  数字键与 "626428826" 逐位比对 → at=true + g() 刷新解锁。 */
    public static void handleCityKey(int keyCode, int gameAction)

    /** 原 k.c(int,int) private: 键→方向码 — 50/上=0, 56/下=1, 52/左=2, 54/右=3, 53/8=FIRE=5, 其余 -1。 */
    private static int keyToDirection(int keyCode, int gameAction)

    /** 原 k.e(): 清方向布尔 G..K。 */
    public static void clearDirectionFlags()

    /** 原 k.f(): 消息弹出中判定 (d)。 */
    public static boolean isMessageShown()

    /** 原 k.b(int, int): 城市 tick — ①里程碑提示队列 (r[46] 门控, 串与 zh 语言包全对上:
     *  37/38 首次, 41 首解锁, 58/59/60/43 里程碑, 52 满级, 45 首塔, 44 替换, 42, 48, 51, 53, 54);
     *  ②光标移动 (i/j 0-4, 出界时 -1=起重机位; Z/aa 滚动偏移+150ms 补间);
     *  ③放置动画 (ab 3000ms → 写 a[75] 三元组 / 拆除 v=true; 人口滚动 g→aw ±增量, t 闪烁位数);
     *  ④状态条文本选择 (楼型名/解锁文案/放置结果) + 跑马灯 (aC 行数, aD 偏移, aE 停留 2000ms)。 */
    public static void cityTick(int deltaTime, int gameTime)

    /** 原 k.a(Graphics): 城市屏绘制 — ①天空渐变 A + 地平线带 B; ②人口进度条 (V 刻度,
     *  -89856/-130816 双色) + L 边框柱; ③等级标记 (M 滑块 + h+"<20"); ④居民条 N 6 段
     *  (ap 动画) + 人口数字 (T/aq 闪烁); ⑤比较面板 (新楼 C[W] vs 旧楼 C[类型] + 人口);
     *  ⑥底部白面板 + 状态文本 marquee; ⑦173×173 网格 (34px 格/27px 块, C/D/E/F 配色,
     *  选中脉冲 400ms; 可建格高亮虚线 — aB 行列范围 + aA 相位 >>8=÷256!); ⑧每格塔
     *  P[类型] 4 帧按 roof; ⑨光标/起重机 O + 放置 Q/摧毁 R 6 帧动画。 */
    public static void drawCityScreen(Graphics g)

    /** 原 k.a(Graphics,Image,String,9) private: 图标+文字组合绘制辅助。 */
    private static void drawIconWithText(Graphics g, Image img, String text, int x, int y, int ax, int ay, int sx, int sy)

    /** 原 k.g(): 刷新等级/解锁 — h=V 刻度定位; ak=楼型解锁数 (ai); m=替换等级 (aj);
     *  n=称号档 (al); ak 变化时 e 选中跟随。 */
    public static void updateCityLevel()

    /** 原 k.h(): 重算可建格 — 每格四邻颜色 (类型 1-3) 集合 → b[格]=邻接色数上限;
     *  az=max; ay=地图满; aB[16]=每行/列连续建筑范围 (虚线高亮边界)。 */
    public static void recomputeBuildable()

    /** 原 k.i(): 作弊模式判定 (at)。 */
    public static boolean isCheatMode()

    /** 原 k.o() private: 随机新楼参数 — Y=House.i(3) roof, X=(W-1)*100+House.i(W*100) 人口。 */
    private static void randomizeNewTowerParams()

    /** 原 k.j(): 消费地图满事件 (v 取反清零)。 */
    public static boolean consumeMapFullFlag()

    /** 原 k.k(): 读城市人口 (g)。 */
    public static int getPopulation()

    /** 原 k.l(): 释放图像 (L..U/c/am/an=null + gc)。 */
    public static void releaseImages()

    /** 原 k.m(): 读城市存档 — RMS "citymode" (House.j:1003 委托; 字段序 = n() 对称)。 */
    public static void loadCityState()

    /** 原 k.a(int) private: 恢复提示队列单条 (0/3/38 → g.d(36/39/46))。 */
    private static void restoreTip(int tipId)

    /** 原 k.n(): 写城市存档 — RMS "citymode": House.e/f + 34 标量 + aB[16] + b[25] +
     *  a[75] (类型 byte+人口 int+roof byte ×25) + r[46] + z 续读位 (首个未显示提示序号)。
     *  这就是 House.i():828 (cityModeRS 写) 的主体。 */
    public static void saveCityState()
}
