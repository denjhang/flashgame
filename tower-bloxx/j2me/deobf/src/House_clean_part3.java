// ============================================================================
// House.java → HouseTowerGame 第 3 分册 (JD+7 收尾: 19 方法 — HUD/数字/小人/
//              菜单面板/天空装饰粒子/天气粒子绘制/人口变更)
// 至此 House.java 98 方法全部实读建档 (与签名图逐一对表, 差 2 项为 CFR 桥方法计数容差)。
// ============================================================================

    /** 原 j(Graphics): 游戏 HUD 绘制 —
     *  左下: 机会数 X(id18) 竖排 4 格 (ba 亮/新亮 bb 闪烁 100ms/熄 8 槽, (bl-1)*2 色系);
     *  人口大数字 b(g,bt) + V(id20); 城市模式 (e==5): U 楼型色条 (bg 层 ×3px,
     *  bk==1 闪 4 槽) + V 每层灯 + 黄线目标 (4725760/0xFFFF00) + 超建红块 (2301460);
     *  快速模式: W(id20) 图 + 小数字;
     *  组合计时器: bA>0 → 顶部黄条 (bA*(E/2)/6000, >5850 白闪) + al 4 帧 (cg/80%4) 图标;
     *  悬挂/落块: 44×44 am 三帧 (cg/100%3) 高亮框 (32*(az-aV)>>8 投影);
     *  连击: by..by-bz 层逐个 am 星框 + 右上 Z 数字 ×bZ;
     *  bB 银行: bA<=-2000 且偶百 ms → 中上显示 "+bB" (红)。 */
    private static void paintHud(Graphics g)

    /** 原 a(Graphics,5): 大数字绘制 (Z=7x12 字符表, 逐位 %10, bl=补 "x" 尾符位 70)。 */
    private static void drawBigNumber(Graphics g, int value, int x, int y, int minDigits, boolean plus)

    /** 原 b(Graphics,5): 小数字绘制 (Y=7x9 字符表, 同构)。 */
    private static void drawSmallNumber(Graphics g, int value, int x, int y, int minDigits, boolean plus)

    /** 原 k(Graphics): 惊慌人群绘制 — 8 槽 bE → 屏幕 (32*(bE[7]-aV)>>8, aU-32*(bE[8]-aW)>>8
     *  3D→2D 换算), 偏移 -10/-14, 帧 bE[3]/向 bE[6]/款 bE[10] 转 b(Graphics,6)。 */
    private static void paintPanicPeople(Graphics g)

    /** 原 b(Graphics,6): 单个小人绘制 — aa/ab 21×28 两款 (n6==1 选 dudette);
     *  n5<0 → DirectGraphics FLIP_HORIZONTAL (8192) 镜像; 否则取帧 n4*21 (帧表 n4=7-帧 镜像分支)。 */
    private static void paintPerson(Graphics g, int x, int y, int frame, int dir, int style)

    /** 原 b(int, int): 游戏按键 — f==2 → k.a(kc,ga) 转城市; 35+FIRE 且作弊 → bk=2;
     *  菜单阶段 (I==-1): f==7 忽略; e(kc,ga)→0=确认 at / 1=左 au / 2=右 av
     *  (f 5/6 确认 → cL=true 防双触发); 否则 K=true 跳过标题。 */
    public final void onGameKey(int keyCode, int gameAction)

    /** 原 a(Command): 左软键 P — f==7 → n=true 暂停; !cL → O=2 退出流程; R=false。 */
    public final void onSoftkey(Command command)

    /** 原 p(): 键位表 (a = GameMIDlet.p() 装的五向键码, HoF 榜数定义兼用)。 */
    public final int[][] getKeymaps()

    /** 原 g(int): 数字→串 (分数显示无本地化)。 */
    public final String numberToText(int value)

    /** 原 c(Graphics): 菜单消息面板 — 展开动画: 高 n4 = n3*(cg-bX)/600 (600ms 从中线展开);
     *  四层描边 (8220270/0xEBE1E1/0x915555/白底 1313804 竖线); 正文 bV 行×bW 行高
     *  分页 (bQ 页), 居中 anchor 17; 末页且 bY!=null → 子选择高亮框 (16266752) + bY 行;
     *  末页且 ca!=null → ca 图; 600ms 输入门后画上/下箭头 (aj 图集, 帧=末页?2:1, bQ>0 画上)。 */
    private static void paintMenuPanel(Graphics g)

    /** 原 b(Graphics): 装载/标题装饰层 — a(g, 32*cr>>8, true,false) 天空渐变;
     *  cu 云池 (ac/ad 两款按 [4] 分组绘) + cs 鸟池 (5 帧折返, 方向镜像) + cv 花瓣池 (ce[3]=id45)。 */
    protected final void paintSkyDecor(Graphics g)

    /** 原 h(int): 【勘误 JD+6】环境天空粒子导演 (非雨滴溅射) — 三池:
     *  cu[40] 云 (y=be 初, x += vx*n>>6; 出底 → 顶部重生 x=-半宽+i(bd), 款 i(2));
     *  cs[18] 背景鸟 (每 300ms ct 步进帧 0..7 折返; x/y 速度 ±; 重生随机 y=-224-i(be),
     *  帧 i(8), vx=i(16)-8, vy=10+i(10), 款 i(2));
     *  cv[20] 花瓣 (id45, x=左界外-i(bd), y=屏上, vx=6+i*6, vy=6+i*3);
     *  尾 f.c=true 请求重绘。 */
    private static void ambientSkyTick(int deltaTime)

    /** 原 b(Graphics, boolean): 天气粒子绘制 — 前/后半池 (bl 分雨雪组);
     *  dw=1 雨: a(g,x>>10,y>>10, 线 dx,dy, 色) 斜线; dw=2 雪: a(g,3) 方块 (>>0/>>1 尺寸);
     *  dw=3 星: b(g,3) 闪烁点。 */
    private static void paintWeatherParticles(Graphics g, boolean firstHalf)

    /** 原 a(Graphics, 6): 雨丝 — n6<0 远景 (0xAAAACC 调 dg/2) 单线;
     *  n6<2 中景 (768+dg/4) 双线; 近景 0xAAAACC+白 双线。 */
    private static void drawRainStreak(Graphics g, int x, int y, int dx, int dy, int depth)

    /** 原 a(Graphics, 3): 雪片 — n4>1: 0xDDDDFF 方块 + 四角点; 小: 0xAAAADD 实块。 */
    private static void drawSnowflake(Graphics g, int x, int y, int size)

    /** 原 b(Graphics, 3): 闪星 — 两张亮度表 {512..1}/{6885390..白} 8 点随机撒 (4n+4 盒内)。 */
    private static void drawTwinkle(Graphics g, int x, int y, int size)

    /** 原 e(Graphics): 背景飞行物绘制 — dB[9] 投影 (aT+32*(x-aV)>>8, aU-32*(y-3aW/4)>>8);
     *  型 13 = 单点白 (远处飞机); 型 6/12 = ce 两帧横扑 (cg/400%2); 型 28 = ce[27] 纵扑;
     *  其余 ce[型-1] 直绘 anchor 3。 */
    private static void drawBackgroundBirds(Graphics g)

    /** 原 a(Graphics, int, boolean, boolean): 天空渐变 — 色带组 bO 按 (2n/3%cd) 段位:
     *  bl(城市) 循环 3 段 / 塔模式 9 段后循环 8 段; bK/bL 上下色, bM=中缝混色 (逐字节均值);
     *  bN=地平线随机 x (i(E/2)+E/4); 绘上下两半 + 中缝 7 层阶梯 (山廓形)。 */
    private static void paintSkyGradient(Graphics g, int clock, boolean cityMode, boolean tint)

    /** 原 y(int): 人口变更 — bk==1 收尾: bt += n2 (纯增);
     *  n2>0: 有银行 (bA>0) → bB += bz*(2+bs/10*2) (连击加成入银行), bt += bs/10 + n2;
     *  n2<0: bt -= bs/10 - n2 (扣为负增量);
     *  (与 Flash/现 H5 公式同源 — 三方一致已证)。 */
    private static void changePopulation(int delta)
}
