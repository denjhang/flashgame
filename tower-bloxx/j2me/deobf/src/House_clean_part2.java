// ============================================================================
// House.java → HouseTowerGame 第 2 分册 (JD+6: 24 方法 — 落块物理/落块判定/
// 连锁生成/主屏绘制/3D 场景/声音开关/towermode 存档/惊慌人群/天气导演/菜单动作)
// ============================================================================
// 接 House_clean_part1.java。

    /** 原 s(int): 落块物理状态机 (5 可见槽 aw[0..4]) —
     *  aw=1/6 挂钩跟随: ax=aM, az=aK, aA=aL (块心=钩心, 888=不倾斜);
     *  aw=3 落空坠落: aA += 15*(cg-aE)>>8 (15/256 px/ms), 低于 aJ-512 → aw=6 提钩
     *  (aH=0, dD=min(4,bs-1), cP=aS[1]);
     *  aw=7 砸地横躺: aE+cl[i] 期满 → 落至层顶 (bj[by]/bi[by]), aw=5, t(bs) 惊慌, z(-1);
     *  aw=2/5 抛掷抛物线: ax→ay 500ms 收敛, cG→cH 同步, 高度 aA = aD + aC*n3/256
     *  - n3²/n10 (n10=200; bk==1 时 400), az += aB*n2/512; 出屏底 → cm[0/1] 记录 + aw=4
     *  (aw==2 时: bA>0 → H() 组合银行; A(1) 扣命; cK=true);
     *  aw==2 且 G() 命中: bk==4→0 / 顶层满 bs==bg-1 (城市) → bk=1 收尾态 /
     *  bk==1→bk=2 摇摆; 尾: aw[0]==4 且 aE<cg-400 且无坠落块 → 提钩复位 (aH=1664, aw=1)。 */
    private static void updateBlockPhysics(int deltaTime)

    /** 原 G(): 落块命中判定 — F() 定命中层 n4;
     *  bk==1 且 dD/n4≠4 → bq=0, aw=3 (落空), A(1), false;
     *  bs==0 地基: dE/cN=cg, 音 800, aw=4, bo/bn/bm=偏差, z(1), true;
     *  n4==顶层: |n3|≤127 完美 (aw=4, dE=cg, 组合 bz/bB/bC 结算, aF[bs%20]=0,
     *  c(4,bs+1) 4 人, ch=cg) / ≥128 挤歪 (aF=偏差 byte, c(3/2/1,bs+1) 按档;
     *  cF[] 平移写 n4 槽 ±n3/4); 快速局计分: bB=(128-n2)*bl/2 (bD) 或 /(5-bl), bq=档, y(bB);
     *  n4<顶层: 连锁 d(-n7, min(4,bs-1)-n4+1) — n7=偏差方向; aw=5 弹飞
     *  (aB=±500, ay=∓45, cH=±60 随机, aC=50); true。 */
    private static boolean evaluateLanding()

    /** 原 d(int, int): 连锁弹块生成 (方向 n2, 数量 n3) —
     *  n3!=-1: 自顶层连弹 n3 块 (bs==1 只罚 A(1)); 每块 aw=5,
     *  aB=n2*400-(4-i)*30, aC=50+(4-i)*30, ay=-n2*45, cH=±60, ax=bh[层], t(bs), z(-1);
     *  n3==-1 (倾塌): 自顶层向下 |bi[i]-bi[i-1]|>20(逐层×2) 的错位层 → aw=7
     *  (aB=±400, aC=50, ay=∓45, cl=ck[i] 延迟); A(1)。 */
    private static void spawnKnockChain(int direction, int count)

    /** 原 m(): 声音状态同步 — R=环境音 (f.a(3)); midi 预挂切换; y(HoF?) 见 :3128-3138。 */
    protected final void syncSoundState()

    /** 原 n(): 进入游戏屏 (Command/度量初始化: bT=E/60, bU=塔区顶, bR=24, bS=E/30;
     *  软键挂 P/Q) — f.a(12)==3 城市: k 复位+续档 (k.d→K()+j()+D()); ==4 快速:
     *  bl=4, bg=k[3] (塔色=表第4), K()+h(); e==5 城市中: q 标志→内联复位 k.* 全字段
     *  (a[75]/r[46]/b[25] 清零, g/h/i/j 光标, 首提示 g.d(36)); e==6 全新快速;
     *  f=7 游戏屏; c(1)/c(3) 音效键挂载。 */
    public final void enterGameScreen()

    /** 原 o(): 退出分阶段 — O==1: x() 释放+软键撤+z.a(1); O==2: 同上 +
     *  e==6 → c(1)+p=true+g() 写 quickRS / e==5 → c(3)+q=true+k.n() 存城市+i() 写 cityRS;
     *  O==3: f.e(2) 回菜单模式。O 复位。 */
    public final void processExitStage()

    /** 原 a(Graphics, boolean): 主屏绘制分派 — O!=0 跳过;
     *  f==7 → g(g) 装载进度屏; f==2 → k.a(g) 城市屏; 其余: i(g) 天空 → b(g,false)
     *  背景 → 3D f(g) (bk==1 ax[0]=888 / bk==4 ax[0]=999 特殊标记) → b(g,true) 前景
     *  → h(g) 落点角标 → k(g) 装饰层 → cm[] 出屏小人 (300ms 内, an 图 3 帧) →
     *  j(g) HUD → 菜单态 (f 4/5/6/8) → c(g) 消息浮层。 */
    protected void paintGame(Graphics g, boolean fullRedraw)

    /** 原 f(Graphics): 3D 场景绘制 — fov 55; 相机 (aV,aW,cI, -z 前向 +y 上);
     *  bk==1/aw==3 (待落/坠落) 画落点标记: 3D 投影 (aK,aL+528) → ak(id41) 图 + 2px 竖线到锚点;
     *  n.a(g) 绑帧; bs≤5 画地基 cC; bk==0 起重机臂 cD (位置 aK,aL, 旋转 aM/540 度),
     *  bk==1/aw==3 收缆态 cE; 落块槽 b(az,aA,0,ax,cG); 塔层 b(bi,bj,cF,-bh,0) min(bs,5);
     *  n.b() 收帧。 */
    protected void paintScene3D(Graphics g)

    /** 原 b(int,int,int,int,int): 单块网格渲染 — y<-256 跳过 (屏下); 旋转 n5=888→
     *  随机翻滚 / 999→固定; d 节点平移 (x/256 定点) + 旋转 (n5/540 度) + render。 */
    private static void renderBlockMesh(int x, int y, int z, int spin, int tint)

    /** 原 b(int): 环境音开关 (f.b(9,0)/f.a(10,1))。 */
    public final void toggleEnvSound(int unused)

    /** 原 c(int): 按键音开关 (f.b(8,0)/f.a(9,1))。 */
    public final void toggleKeySound(int unused)

    /** 原 e(): 写 RMS "towermode" — cj[6] int (纪录/提示标志) + a(1)/a(3) 两 bool。 */
    protected final void saveTowerMode()

    /** 原 f(): 读 RMS "towermode" — cj[6] + 音效两 bool (缺省全开); cj 数组初始化。 */
    protected final void loadTowerMode()

    /** 原 t(int): 楼层惊慌 — |aF[层%20]| 档位 (<25→4/<50→3/<80→2/else 1)>>1 抛飞数;
     *  先把该层现有惊慌人群 (bE[5]==层) 转坠态 3 (速度=±距/500); 再从槽池取余数:
     *  状态 4 掷飞 (随机 0-3 力度/方向, 起点=层中心 bi/bj)。 */
    private static void panicOnFloor(int floor)

    /** 原 B(): 惊慌人群 tick (bE[8][12], [0]状态 [1]x [2]y [3]帧 [4]t0 [5]层 [6]向
     *  [7]渲染x [8]渲染y [9]朝向) —
     *  1 原地跳: bF/bG[段] 插值 (500ms/段, 段=min(n4/500,5)), 帧=1+(n4-1200)/280%8 折返;
     *    2000ms 后且落到层心±128 → 2 行走;
     *  2 行走缘: x 每帧 ±n4/12 (贴 bi±64), y 降向 bj; 到达 → 5 站立 (帧 6+cg/200%2);
     *  5 站立: 500ms → 释放槽 0;
     *  4 掷飞: 300ms 直线 → 转 3;
     *  3 坠落: x-=向*n4/30, y-|10-力|*n4/30, 帧 1+n4/280%8;
     *  出屏 (y<aW-be/2 / x 越塔±bd/2+256) → 0。 */
    private static void panicPeopleTick(int deltaTime)

    /** 原 u(int): 天气导演 (dq 0-3) —
     *  0 待机: 相机高度带触发 (cX 雨 aW 0..3840 / cY 雪 10240..12800) → C() 清+v(kind)
     *  播种, dw=kind, de=true, dg=1024 天色, 进 1;
     *  1 增强: dg 向 dj 插值, 粒子透明度 dc[*][1] 渐入; 满 → 2;
     *  2 保持: 透明度正弦呼吸 (dr/2 分界), 雪时随机闪电 (i(100)==7 → dl/dm/dn);
     *    满 → 3;
     *  3 减弱: dg 回 dh, 透明度渐出; 满 → C() 清, 回 0。每态尾 w(dt) 粒子推进。 */
    private static void weatherDirector(int deltaTime)

    /** 原 J(): 菜单动作 — at(上)/av(下)/au(左) 三向输入:
     *  f==4 首次买地确认 (l(0)) → cj[0 城市/1 快速]=1, e(), f=1;
     *  f==5 重开确认 → a(false)+b(1);
     *  f==6 结算确认 → 城市: k.a(bl,bt,bq) 放置回城市 (f=7,aZ=2) / 快速: R=false,O=3,g();
     *  f==8 首次失误确认 → cj[2]=1, e(), 清 i/j; 尾 I() 清输入。 */
    private void onMenuAction()

    /** 原 e(int,int): 键→码 — 53/8→0, 56/6→2, 50/1→1, 其余 -1 (菜单四向用)。 */
    private static int keyToCode(int keyCode, int gameAction)

    /** 原 h(int)【部分读】: 雨滴溅射粒子 — cu[40]/cs[18]/cv[20] 三池 (y 初=be 屏高),
     *  cq 累积 (cap 150) → cr+=n2>>1 生成配额; 内部循环未读完, 下轮补。 */
    private static void spawnRainSplashes(int deltaTime)

    // ---- 以下 5 方法在更早轮次已实读 (PARITY 轮取证), 本轮转正入册 ----

    /** 原 g(Graphics): 装载进度屏 — a(g, 32*cr>>8, true,false) 天空底; cw(id09 DCH logo)
     *  居中 (anchor 33, y=F/2+h/8); 进度条: 双层描边 (n3=E*2/3) + 白底 + 红/橙填充
     *  (cc 百分比, 4 段色 -4980736/-9895936/-487168/-510464)。 (:3365-3390) */
    private static void paintLoading(Graphics g)

    /** 原 h(Graphics): 落点角标 — cg-ch<600ms 窗; 锚点 n7/n8 = aT±32*(bi-aV)>>8 /
     *  aU-32*(bj-aW)>>8 (3D 投影换算); <30ms 白块 / <200ms 橙缩 (n4=16+n2*32/200,
     *  n5=16+n2*32/400, 斜线×4) / 之后 ai(id37 三帧星) 帧=n2/50%3, 三角位。 (:3391-3424) */
    private static void paintLandingMarker(Graphics g)

    /** 原 i(Graphics): 城市屏 3D 锚点+天际线 — 相机 (aV,aW,cI); 投影点 n3=(int)a[1]-ao+9;
     *  a(g,aW,false,true) 塔渲染; l(g) 天空; a(g,n3) 天际线; 楼顶饰 ae/ag 循环 (横排, n2=E/2-…)。 (:3424-3467) */
    private static void paintCityView(Graphics g)

    /** 原 l(Graphics): 天空渐变 — l=32*aW>>8 (相机高度换算), a(g,l,true,false) 17 色带走带。 (:4054-4107) */
    private static void paintSky(Graphics g)

    /** 原 a(Graphics, int): 天际线条带绘制 — dI 起始, bI[x,w]/bH[y,h] (89 号文件),
     *  色=House.a(bJ[bI[i2][2]],dg,true) 昼光; y=aU-bH[0]-h+n2; 剪裁 y+h<0 break / y>F skip。 (:4107-4122) */
    private static void paintSkyline(Graphics g, int scroll)
