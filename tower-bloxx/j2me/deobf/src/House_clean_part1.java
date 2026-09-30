// ============================================================================
// House.java → HouseTowerGame (反混淆 第 1 分册, JD+5: 53 方法)
// 原文件: House.java (4420 行, 98 方法)
// 定位: 塔模式游戏屏本体 (GameMIDlet 的具体子类; q() case1 返回的 "this")。
// 本册覆盖: 构造/生命周期/装载门控/存档四件套/相机/摆钩/摇摆/天气/背景鸟群/
//           正弦表/菜单导航等。绘制大方法组与 d(int,int) 主状态机留第 2-3 分册。
// 定点数约定: 全文件 256=1.0 (>>8), 正弦表 ci[360] 以 32768=1.0 (>>15)。
// ============================================================================

public class HouseTowerGame {
    // ---- 字段语义表见 deobf/FIELDS.md (House 节) ----

    /** 原 House(): 内存预热 (2×256KB arraycopy 试探), JAD 参数读天气概率/时长
     *  (DChoc-Rain-Probability/Duration, DChoc-Snow-*), cU/cV=概率*1024/100,
     *  cW[2][20]=雨/雪粒子参数表; 预挂 6 首 MIDI (-2147483568..63, 全 false=不预载);
     *  n.a(0,E,F) 3D 初始化 + 预载网格表 {7..13,20..23,30..33,40..43} (scene.m3g uid);
     *  G=E*1024/H=F*1024 世界宽高 (定点 1024=1.0!)。 */
    public HouseTowerGame()

    /** 原 a(): M() 建正弦表 + 取五向键名 (getKeyName 52/54/50/56/53)。 */
    protected final void initKeyNames()

    /** 原 b(): 启动主 BGM (x.a(-2147483568, -1) = r0[80] 循环)。 */
    protected final void startBgm()

    /** 原 c(): 暂停钩子 (n=true 暂停态, O=2)。 */
    protected final void onPause()

    /** 原 d(): 退出清理分派 — e==2 城市: 非作弊时 HoF 提交 A.a(1,{bt,bs},j.b());
     *  e==5 城市中: k.n() 存 citymode + i() 写 cityModeRS; 否则 g() 写 quickModeRS。 */
    protected final void onExitCleanup()

    /** 原 a(int): 查音效开关 — 3=按键音 (f.b(8)==0), 1=环境音 (f.b(9)==0)。 */
    public static boolean isSoundOff(int which)

    /** 原 w(): 城市视图初始化器 — 停乐 b.a(); 异步分段门控 e(0)/e(10)/e(12);
     *  jar 文件 89 → 天际线 (r=u8 建筑数→s=u8 帧时长 bJ[]→每条 u8,u8,u16,u16,u8;
     *  bI[0]=E*n3/176, bI[1]=max(1,E*(n3+n4)/176-x), bH[0]=n5*2, bH[1]=n6*2);
     *  cy/cz/cB/cA=四方向天际线渲染 sprite; 绘制 a(Graphics,int):4107。 */
    private boolean initCityView()

    /** 原 x(): 释放全部 UI 图像 (cy..an=null + gc) — 内存紧张时调用。 */
    private static void releaseUiImages()

    /** 原 y(): 游戏世界初始化 — aT=E/2, aU=F/2 屏幕塔锚点; bd/be=E,F*256/32 (世界宽高定点);
     *  cw=id9 DCH logo, aj=id0, aa/ab=id12/13 小人行, ac/ad=id69/70 云, ce[3]=id45;
     *  bF/bG[0..6]=跳弧表 (n4+=5+n2 上升 / n3+=5-n2 下降);
     *  cn=E/20, co=F/15 网格度量; aG[2][13]=城市图标栅格 (n%5*45, n/5*45);
     *  相机 cI 迭代 (+100 直到 3D 点 y 投影入屏); cd=max(be,2048); l={70,250,550,1000}
     *  里程碑提示阈值; 音效开关回读 a(3)/a(1) → q/p 标志。 */
    private void initGameWorld()

    /** 原 d(int): 菜单/标题 tick — I==-1 首帧→I=1, 3000ms 后 (或 K 按键跳过) y() 进世界;
     *  R 且 !S → 主 BGM 起播一次。返回是否仍在菜单态。 */
    protected boolean updateMenu(int clock)

    /** 原 a(Graphics): 菜单/标题绘制 — I==0: 白屏 + L(id=-1→null 跳过);
     *  I==1: 绿底 0x9ACC2A + ce[3](id45 顶部饰) + ad(10,40)/ac(E-80,60) 云 +
     *  House.b(三组装饰楼) + M(id11 气球 logo) 居中。 */
    protected void paintMenu(Graphics g)

    /** 原 a(boolean): 结算面板 — 串=g.a(93,人口%)+a(94,高度%)+a(95,组合%),
     *  超 cj[3]/[4]/[5] 纪录 → 追加 g.d(96)="新记录！" 且写回; bf=新纪录标志;
     *  e==6 快速局 → HoF 提交 A.a(1,{bt,bs}); e==5 城市 → ++d (局数);
     *  f=6 状态, bk=3。 */
    private void showRoundSummary(boolean withRecords)

    /** 原 e(int): 装载门控 — cc=进度值 (g():3363 进度条), u() 强制重绘;
     *  返回 !n (非暂停时继续下一分段)。 */
    public static boolean loadGate(int progress)

    /** 原 z(): 相机跟随塔顶 — aW 向 aX 定点趋近 ((cg-aY-500)*256/500 步长, 500ms 缓动);
     *  到位清 dI 天际线偏移; 800ms 内加随机抖动 (±32, i(64)); aJ=aW+1792+128 吊钩基线。 */
    private static void cameraFollowTower()

    /** 原 o(int): 设相机目标 — aY=cg 起始时刻; aX = bs>1 ? aX+n2(层高增量) : 512(回地面)。 */
    private static void setCameraTarget(int delta)

    /** 原 p(int): 摆钩运动学 — aP+=n2 相位; aw[0]==6 (提钩态) aH+=2n2/3 上升,
     *  顶到 1664 (bk==1 时 1408) → aw[0]=1;
     *  aK = cQ*sin(200*aP/cP%360)>>15 (横摆, 32768=1.0);
     *  aM = aK>>4; aL = aJ-cO-aH - cR*sin(...)>>15 (纵摆);
     *  aw[0]==1 时 aB[0]/aC[0] = 本帧速度 (256=1.0/帧), aN/aO 记上一帧。 */
    private static void updateCraneSwing(int deltaTime)

    /** 原 q(int): 塔摇摆 — bk==2 且 bu≠0: bw=(bw+n2)%3600, cS=sin(bw/10),
     *  bu 向 0 收敛 (±(bv*cS)>>16); br = -(cS*bv)/10000 塔倾角。 */
    private static void updateTowerSway(int deltaTime)

    /** 原 r(int): 【死代码】摇摆阻尼 — 乘 0 的占位实现 (Math.max(|0|,80) 同样无效)。 */
    private static void dampSwayDeadCode(int deltaTime)

    /** 原 A(): 摇摆投影 — 塔倾 (bn+br) 传导到各层块/人 x 偏移:
     *  顶层 5 层窗 (bx..bs), 每层偏移 aF[层%20], dF=平均偏移;
     *  顶块放置后 100-800ms 三段缓动 (v2 公式组), cT 为稳态值;
     *  写 bh[层] 渲染 x (v6=-999/-888 为特殊层标记)。 */
    private static void updateSwayProjection()

    /** 原 v(int): 生成天气参数 — cW[雨0/雪1][20] 表 → ds/dt/du 粒子生成节奏,
     *  dh=dg, di=表[6], dj=表[7]; a(0,300-表[8],…) 与 a(1,表[8],…) 两组粒子头。 */
    private static void spawnWeather(int kind)

    /** 原 a(int,int,int,int,int): 线性插值 — (n5-n4)*n6/(n3-n2)+n4 (分母 0 返 0)。 */
    private static int lerp(int t0, int t1, int v0, int v1, int t)

    /** 原 a(int,int,int): 移位辅助 — n2 >> n3/n4。 */
    private static int shiftByRatio(int value, int num, int den)

    /** 原 a(int, int, boolean): 昼光调色 — de(昼)时 RGB 各 ×n3>>10 (n3≈1024=1.0), clamp。 */
    private static int tintByDaylight(int rgb, int factor, boolean enabled)

    /** 原 C(): 清天气 — 两组粒子头复位 + dd[300] 粒子清零。 */
    private static void clearWeather()

    /** 原 D(): 播种天气粒子 — 按 dc 组头 (数量=ds 段) 随机化 dd[i]:
     *  位置 i(G)/i(H), 层级 i(4), 相位 i(368640), 速度按 (头[3/4]+随机)/4-层级。 */
    private static void seedWeatherParticles()

    /** 原 a(int,int,int,int,int,int,int): 写粒子组头 dc[n2] (组型, 起点, 计数, 速度 x/y, 色对)。 */
    private static void setWeatherGroup(int group, int count, int start, int vx, int vy, int c1, int c2)

    /** 原 w(int): 天气 tick — 组头推进 (n2 头[1]*头[4]/2/H*n2); 粒子 y+=速度, 雪时 x 摆动
     *  (sin 表, 相位 +=(90+90*(3-层级))*dt %368640); 出界/落地 → 重生 (n5/n4 回写随机位);
     *  aW (相机) 参与 y 阈值 (256*aW>>8+384)。 */
    private static void weatherTick(int deltaTime)

    /** 原 E(): 背景鸟群/机群 tick — dB[9] 槽: 活动槽 y 推进 (dA[3][型]), 出屏 → 回收
     *  (下次出现=cg+1000+i(2500), dy[型] 计数+1); 到期槽 → x(i2) 生成。 */
    private static void backgroundBirdsTick()

    /** 原 x(int): 生成背景飞行物 — 按高度带 dA[0..2][28] 选型 (cp 相机高度窗,
     *  dy 余量, i(100)<概率); 型 0 仅延时; 否则扣 dy 余量, 随机 x (bd 内),
     *  y=3*aW/4±dz[型], dA[3] 符号定左右入场侧。 */
    private static void spawnBackgroundBird(int slot)

    /** 原 F(): 命中层定位 — dD 游标沿 bj[层] (层顶 y, 定点 256=1.0) 下行,
     *  块心 (aA[0],az[0]) 落入 层顶±256 / 层中心 x±256 → 返回层号; 否则 -1。
     *  调用点: 撞塔连锁 G():3007。 */
    private static int findHitFloor()

    /** 原 H(): 组合银行入账 — bt(总人口) += bB(银行); bz/bA 清零。 */
    private static void addComboBank()

    /** 原 z(int): 层数变更总响应 — bn/bm 倾斜累计增删; 可见窗 bx=max(0,bs-5)/by=min(4,bs-1);
     *  dF=5 层窗内 |aF| 平均 (clamp bs*dF/20, ≤100); bv=摇摆幅 min(bs/2+|bm|/20, bs*(...)/6);
     *  城市/快速两套摆参数插值: cQ/cR=min(aQ[aQ1], aQ0+bs*(...)/(60 或 bg>>1)),
     *  cP=aS 表随层递减, cO=-min(128 或 256, bs*256/200, 100 层以上线性);
     *  aP 相位按 cP 比例保留; bk≠1/4 时 o(var0*256) 相机跟随。 */
    private static void onFloorCountChanged(int delta)

    /** 原 A(int): 机会数变更 — cN=cg; 组合音 i? c.a(800); bb+=n2; ba==0 且非 HoF → bk=2。 */
    private static void onLivesChanged(int delta)

    /** 原 I(): 清菜单输入标志 (at/au/av=false)。 */
    private static void clearMenuInput()

    /** 原 J(): 菜单 FIRE 处理 — 菜单态 (f 4/5/6/8) → l(0) 逐页; 塔待落态 (f 1/3, aw[0]==1,
     *  相机到位 aW==aX) → aw[0]=2 落块 + aD[0]=aL 挂点 + aE=cg。 */
    private void onMenuFire()

    /** 原 K(): 塔数组初始化 — aw/ax/ay/az/aA/aB/aC/aD=int[5] (8 槽块状态的前 5 可见槽),
     *  cg=0, bj[0]=-256 (层 0 顶, 定点), aF=byte[20] 层偏移环, bs/bo/bp/bn=0,
     *  aI=0, aJ=2432 (吊钩基线), bh/bi=int[5] 层中心。 */
    private static void initTowerArrays()

    /** 原 L(): 城市天际线动画表 — dG[12][7] 条目 (x=i*E/12-i(8), 宽 8+i(8),
     *  y=640+i(256), 高 16+i(16), 1, dH[随机3] 色, i(3) 款) — 远景楼群。 */
    private static void initSkylineAnim()

    /** 原 M(): 正弦表 — ci[360] 积分构建 (振幅 32768=1.0, 步长 2π/3600000)。 */
    private static void buildSinTable()

    /** 原 i(int): 随机数 — |cf.nextInt() % n|。 */
    public static int randInt(int n)

    /** 原 j(int): sin(deg) 查表 (负角取反)。 */
    public static int sinDeg(int deg)

    /** 原 k(int): cos(deg) = sinDeg(deg-90)。 */
    public static int cosDeg(int deg)

    /** 原 N(): CRC32 查表 (0xEDB88320 多项式) — 【用途待证: 未在此文件消费】。 */
    private static int[] buildCrcTable()

    /** 原 a(String, Font, int): 文本折行 (宽 n2) → String[] (见 :4161-4202 逐词度量)。 */
    public static String[] wrapText(String text, Font font, int width)

    /** 原 l(int): 菜单翻页/子选择 — cg-bX<600 输入门; I() 清标志; P() 末页判定;
     *  bY!=null: 子选择 bZ=clamp(bZ+n2), 越上界 → bQ--; n2==0(确定) → O() 清空返 true;
     *  否则 bQ 分页 clamp, 末页+确定 → O()+true。 */
    public static boolean navigateMenu(int direction)

    /** 原 O(): 菜单导航状态复位 (bP/bQ/bX/bY/ca/cb 清)。 */
    private static void resetMenuNav()

    /** 原 P(): 当前是否末页 (bQ==bP-1)。 */
    private static boolean atLastPage()

    /** 原 q(): 取全局字体 (o = Font (32,0,8)? 见静态块)。 */
    public static Font getFont()

    /** 原 a(Graphics, int, int, int, int): setClip 直通。 */
    public static void setClip(Graphics g, int x, int y, int w, int h)
}
