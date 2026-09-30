// ============================================================================
// GameMIDlet.java → GameMIDlet (MIDlet 宿主: 生命周期/主循环/帧计时/屏幕分派)
// 原文件: GameMIDlet.java (476 行, 26 方法 + 26 字段)
// 证据: run():164-216 主循环; j():425-438 8 帧滑动平均 dt; q():440-466
//       屏幕解析器 (f.b()=全局屏幕模式); w():468-474 RMS "settings" 存 l[0]+l[3]。
// 具体子类 = k.java (q() case 1 返回 this —— 宿主自身即游戏屏实现)。
// ============================================================================

public abstract class GameMIDlet extends MIDlet implements Runnable, ScreenContract /* e */ {
    private int gameTime;               // 原 a: 累计游戏时间 ms (j() 累加, v() 清零; tick 首参)
    private long lastFrameClock;        // 原 b: 上一帧 System.currentTimeMillis
    public int frameRingIndex;          // 原 u: 8 槽帧时环写指针
    public int[] frameRing;             // 原 v: int[8] 帧时环 (初始每槽 40ms → 合计 320)
    private int smoothedFrameMs;        // 原 c: 320 初值; j() 做 8 帧滑动平均, 返回 c>>3
    private ScreenContract activeScreen;// 原 d: 当前屏幕 (q() 解析)
    protected CanvasScreen canvas;      // 原 w: c.a() 工厂
    protected MidiPlayer midiPlayer;    // 原 x: c.c() 工厂
    protected Vibrator vibrator;        // 原 y: c.b() 工厂
    protected SplashScreen splashScreen;// 原 z: new j(canvas)
    protected KeyInputHandler keyInput; // 原 A: c.d() 工厂
    private boolean exitRequested;      // 原 e: run() 退出条件
    private boolean started;            // 原 f: startApp 已跑过 (二次进入走 s() 恢复)
    private boolean keepProcessAlive;   // 原 g: false → notifyDestroyed (destroyApp 置 true 则不退)
    private boolean paused;             // 原 h: pauseApp 置位, run() 跳过 tick
    private boolean resourcesReleased;  // 原 i: g() 只关一次 (g.b() 关资源流)
    private boolean forceFullRedraw;    // 原 j: u() 置位 → paint fullRedraw=true
    public boolean repaintScheduled;    // 原 B: t() repaint 期间为真 (paint 再入门控)
    private boolean splashMode;         // 原 k: true=启动 splash 流程 (d(int,int) 消费)
    public int bootPhase;               // 原 C: -1 未启动 / 3=游戏屏 (c(int,int)/d(int,int)/c(Graphics) 分派键)
    private boolean soundAutoRestore;   // 原 l: 默认 true; false=用户关音 → 不自动恢复
    public Thread mainThread;           // 原 D
    public static int screenWidth;      // 原 E: canvas.getWidth() (:53)
    public static int screenHeight;     // 原 F: canvas.getHeight() (:54)
    private static GameMIDlet instance; // 原 m: r() 单例

    /** 原 GameMIDlet(): 装配 —— canvas/E,F/midi/y vibrator/z splash/读 RMS "settings"
     *  (l[0]=语言, l[3]=音效开关, 0 则停乐)/g.a() 资源初始化/i.a(j.a())/A 注入。 */
    public GameMIDlet() { /* 见原文件 :47-83 */ }

    /** 原 r(): 单例。 */
    public static GameMIDlet getInstance() { return instance; }

    /** 原 g(): 释放资源流 (一次性)。 */
    private void releaseResources() { if (!resourcesReleased) { ResourceStore.shutdown(); resourcesReleased = true; } }

    /** 原 startApp(): 首次 → a() 初始化+f() 后置+绑 canvas+起主循环线程; 再次 → s() 恢复。 */
    protected void startApp() { /* :96-113 */ }

    /** 原 pauseApp(): 停乐; 非启动/ splash 阶段则记 l=false 关音恢复位; h=true; c() 钩子。 */
    protected void pauseApp() { /* :115-129 */ }

    /** 原 s(): 从暂停恢复 (C==-1→b() 钩子; f.c=加载覆盖标志复位; 时钟重启; i.a(0))。 */
    protected final void resumeFromPause() { /* :131-147 */ }

    /** 原 destroyApp(boolean): e=g=true 请求退出, join 主线程。 */
    protected void destroyApp(boolean unconditional) { /* :149-162 */ }

    /** 原 run(): 主循环 —— dt=j(); 屏幕切换 (旧屏 n() hide→v()); d.a(dt,gameTime) tick;
     *  splashMode 时走 d(int,int); 退出序列: 停乐→w() 存设置→e() d() g()→notifyDestroyed。 */
    public void run() { /* :164-216 */ }

    /** 原 t(): flush 一帧 (repaint + serviceRepaints; B 门控 paint 再入)。 */
    public final void flushFrame() { /* :218-224 */ }

    /** 原 u(): 强制整帧重绘 (j=true + t())。 */
    public final void forceFullRepaint() { /* :226-230 */ }

    /** 原 d(Graphics): paint 分派 —— f.c 加载覆盖层 b(g); activeScreen.a(g, j); 否则 splash c(g)。 */
    public final void paint(Graphics g) { /* :232-247 */ }

    /** 原 m(int): keyPressed → getGameAction → activeScreen.b(kc,ga) / splash c(kc,ga)。 */
    public final void keyPressed(int keyCode) { /* :249-262 */ }

    /** 原 n(int): keyRepeated (仅取 action, 空实现)。 */
    public final void keyRepeated(int keyCode) { /* :264-268 */ }

    /** 原 f(int): keyReleased (同上)。 */
    public void keyReleased(int keyCode) { /* :270-274 */ }

    /** 原 b(Command): 软键 → activeScreen.a(cmd); splash 阶段 (C==3) a(cmd)+c(53,8)=模拟 FIRE。 */
    public final void softkeyPressed(Command cmd) { /* :276-289 */ }

    // ---- 抽象钩子 (实现者 k.java) ----
    // a(): 初始化 / b(): 首次恢复 / c(): 暂停 / d(): 退出清理 / f(): 后置初始化
    // e(): 关停收尾 / k(): boot 阶段1 (经 h()) / l(): boot 阶段2 (经 i())
    // d(int): splash 结束判定 / a(Graphics): splash 绘制 / b(Graphics): 加载覆盖层绘制
    // h(int): 游戏 tick / m(): splash tick / p(): 键位表 int[][] / g(int): 键名
    // b(int,int): splash 按键 / a(Command): splash 软键

    /** 原 h()→k(): boot 阶段1 包装。 */
    private void bootStage1() { this.initStage1(); }

    /** 原 i()→l(): boot 阶段2 包装。 */
    private void bootStage2() { this.initStage2(); }

    /** 原 c(int, int): splash 按键路由 (仅 C==3 透传 b(kc,ga))。 */
    private void splashKeyEvent(int keyCode, int gameAction) { /* :333-351 */ }

    /** 原 d(int, int): splash/主屏更新 —— C==-1: h() boot→C=3; case3: 语言包版本写 l[4],
     *  音效按 l 恢复, d(ga)=结束判定 → i() boot2/C=-1/splashMode=false/f.e(0)(回 splash 屏模式)。 */
    private boolean updateSplash(int deltaTime, int gameTime) { /* :353-396 */ }

    /** 原 c(Graphics): splash 绘制路由 (仅 C==3 → a(g))。 */
    private void splashPaint(Graphics g) { /* :398-413 */ }

    /** 原 v(): 计时器复位 (gameTime=0; 环全 40ms; smoothedFrameMs=320)。 */
    protected final void resetTimers() { /* :415-423 */ }

    /** 原 j(): dt 计算 —— dt=now-last (clamp 500ms); gameTime+=dt;
     *  smoothedFrameMs = smoothedFrameMs - ring[u] + dt; ring[u]=dt; u=(u+1)&7; 返回 >>3。 */
    private int computeDeltaTime() { /* :425-438 */ }

    /** 原 q(): 屏幕解析器 —— 按 f.b()(全局屏幕模式): 1=本宿主(游戏屏) / 0=splash z /
     *  2=keyInput A / 3,6=维持当前 / 4=请求退出(e=true,null)。 */
    private ScreenContract resolveScreen() { /* :440-466 */ }

    /** 原 w(): 存设置 RMS "settings" —— writeInt(l[0]) + writeInt(l[3]) (语言+音效)。 */
    private static void saveSettings() throws Exception { /* :468-474 */ }
}
