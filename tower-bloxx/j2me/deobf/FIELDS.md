# J2ME 反混淆字段语义表 (FIELDS.md)

> 纪律: 每个条目须有字节码证据; 未证实的留【待证】。格式: `类.原字段 → 语义名 — 证据`。

## n.java → Renderer3D
| 原字段 | 语义名 | 证据 |
|---|---|---|
| n.a | projectedPoint (float[4] 投影暂存) | a(float[]) 唯一写者, HUD 锚点消费 (House:3435 附近读 n.a[0..3]) |
| n.b | g3d (Graphics3D 单例) | a() 直接返回 b |
| n.c | meshCache (Hashtable uid→MeshNode) | a(int[],int)/a(int,int,boolean) put/get |
| n.d | background (只清深度) | a(int,int,int): setColorClearEnable(false) |
| n.e | camera | b(int,int,int) new Camera() |
| n.f | cameraXform | setCamera(e, f) |
| n.g | invXform (逆变换暂存) | a(float[]): g.set(f); g.invert() |
| n.h | matrix (float[16] 位姿) | a(×9) 填 4x4 |
| n.i | fovDegrees | a(float): i=f2; setPerspective(i*k,…) |
| n.j | aspectCorrX | =m/(n-l)*0.7+0.3 (视口宽比修正) |
| n.k | aspectCorrY | =(n-l)/m*0.7+0.3 |
| n.l | clipTop (HUD 高度) | setClip(0,l,m,n-l); 初始化入参 n2 |
| n.m | viewportW | 同上 |
| n.n | viewportH | 同上 |

## d.java → MeshNode
| d.a | transform | 构造器 setIdentity |
| d.b | mesh | 构造器 (Mesh)object |

## o.java → MidiPlayer
| o.a | currentSfx (当前一次性 Player) | b(int,int) 创建/playerUpdate 比对 |
| o.b | bgmPlayer (循环 BGM) | f() stop |
| o.c | loopCounter (剩余重播, 0=无限/-1=无) | playerUpdate |
| o.d | sfxCache (预载表) | a(int,boolean) put |
| o.e | preloadPlayer | a(int,boolean) 赋值 |
| o.f | soundEnabled (默认 true) | a(boolean) |
| o.g | bgmActive | a(int,int) 置 true / c() 置 false |
| o.h | suspended【待证: b() 中 !this.h 判定, 疑挂起标志】 | b() |

## f.java → SettingsStore
| f.f | languageIndex | d(int)/a() |
| f.g | screenMode (0=splash/1=游戏屏/2=键位屏/4=退出; 默认 5=维持) | 【勘误 JD+2】q():444 switch(f.b()) 分派屏幕, :392 f.e(0) 进 splash — 非震动等级 |
| f.a | loadPhase (0..100) | House.e() 分段门控读 |
| f.l | screenFlags int[14] | a(int,int)/a(int) |
| f.m | audioFlags int[12] | b(int,int)/b(int); 音效开关 House:339/:346 写 8/9 |
| f.n | customName String[1] | a(int,String)/c(int) |
| f.c | recordStoreReady | 静态块 false |
| f.h | openStoreName | b(String) |
| f.i | writeBuffer | b(String) |
| f.j | writer | b(String) |
| f.k | reader | a(String) |
| f.d | hasRecord | 静态块 false; House 中 k.d 判定相关【待证】 |
| f.e | recordSize【待证: 无读点命中】 | — |

## g.java → ResourceStore
| g.a | instance (单例) | a() |
| g.b | offsetsR0 int[92] | a() 读入 |
| g.c | stringOffsets int[153] | f(int) 读入 |
| g.d | cachedEnd (-2=需重开流) | a(int) 推进/复位 |
| g.e | r0Stream | a() 打开 |
| g.f | currentPack ("r0"/"r"+seg) | a()/a(int) |
| g.g | langStream | f(int) |

## House.java 静态字段 (起步——完整表随类轮次补)
| House.e | gameState (状态机 f.a(12) 的值: 3=城市/4=快速/5=城市中/6=快速中) | :3096/:3108 分派 |
| House.f | screenState (7=游戏主屏) | :3104/:3112 f=7 |
| House.g | inQuickGame (快速局进行中) | :1596 e==6 分支 |
| House.h | inCityGame (城市局进行中) | :1677 |
| House.bf | towerCompletedFlag (bf→胜 jingle 85) | :1602/:1689 |
| House.bq | cityBuildPhase (0=新建/2=替换) | :1681/:1689 |
| House.k | colorTable int[?] (bg=k[bl-1] 塔色) | :3096 bl=4 |
| House.bl | towerColorIndex (1..4) | :3096 bl=4 |
| House.bg | currentTowerColor | :3096 bg=k[bl-1] |
| House.bs | floorCount (当前层数) | t(bs)/aF[bs%20] |
| House.bx | swaySampleIndex | :2951 aF[bx%20] |
| House.aF | floorOffsets byte[20] (每层落点偏移环缓冲) | :2870 写 0 / :2877 写偏差 |
| House.bi | floorX int[5] (层中心 x, 定点 256=1.0) | :2088 附近写 |
| House.bj | floorY int[5] (层顶 y) | 同上 |
| House.bE | panicPeople int[12][8] (8 槽惊慌人群, [0]=状态 0空/1跳/2走/3坠/4掷/5站, [1]x[2]y[3]帧[4]t0[5]层[6]向[7]x[8]y[9]向[10]款) | B():2149-2242 状态机 |
| House.bF/bG | panicJumpTableX/Y (跳弧插值表) | B() case1 lerp |
| House.cg | gameClock ms (cg-aE=局内计时) | :2873 ch=cg |
| House.ch | lastLandClock (上次落地时刻, h:3390 600ms 窗) | :2873 |
| House.aV/aW | towerOriginX/Y (塔世界原点) | c():2088 aV+… |
| House.bd/be | towerWidth/height (定点) | :2088 (bd>>1) |
| House.cI | cameraZ | i():3435 n.a(aV,aW,cI,…) |
| House.E/F | screenWidth/screenHeight | GameMIDlet:53-54 getWidth/getHeight |
| House.bU | towerBaseY (塔底屏幕 y) | :4270 F-bU-(1+n2)*18 |
| House.dC | ambientFxIds int[28] | :1319 ce[i2]=g.c(dC[i2]) |
| House.ce | ambientFxImages Image[28] | 同上 |
| House.ai | sparkSheet (id37 三帧星 13x13x3) | :1336 ai=g.c(37); h:3390 帧表 |
| House.cw | publisherLogo (id09 DCH) | :1395; g():3372 drawImage |
| House.L/M | splashImage(id=-1→null)/titleOverlay(id11 气球logo) | k():1216-1217 |
| House.aa/ab | peopleRow1/2 (id12/13 小人行 210x28) | :1398-1401 |
| House.ac/ad | cloudBig(id69)/cloudSmall(id70) | :1404-1407 |
| House.ae/af/ag/ah | citySkyl… 【待证: :1302-1305 id33-36, :70 处 ao=ae.getHeight → ae=城市楼顶饰?】 | i():3433-3443 |
| House.ak/al/am/an | hudIcons (id41/38/39/40) | :1345-1351 |
| House.U/Y/Z/V/X/W | levelBadges(id14)/digitsSmall(id15)/digitsBig(id16)/…(id18/19/20) | :1292-1297 |

> House 完整字段表 (aa-cW 约 130 项) 随 House 反混淆轮次逐段补全。

## GameMIDlet.java (JD+2)
| a | gameTime (累计 ms, tick 首参) | j() 累加, v() 清零 |
| b | lastFrameClock | j() |
| u | frameRingIndex (8 槽) | j() (u+1)&7 |
| v | frameRing int[8] (初始 40ms/槽) | v() |
| c | smoothedFrameMs (320 初值, >>3=平均) | j() |
| d | activeScreen (e 接口) | q()/run() |
| w | canvas (m) | 构造 c.a() |
| x | midiPlayer (o) | 构造 c.c() |
| y | vibrator (b) | 构造 c.b() |
| z | splashScreen (j) | 构造 new j(w) |
| A | keyInput (h=高分榜屏!) | 构造 c.d(); q() case2 作为屏返回 |
| e/f/g/h/i/j | exitRequested/started/keepProcessAlive/paused/resourcesReleased/forceFullRedraw | 生命周期 |
| B | repaintScheduled | t()/d(Graphics) |
| k | splashMode | startApp/d(int,int) |
| C | bootPhase (-1 未启动/3=游戏) | c(int,int)/d(int,int)/c(Graphics) 分派键 |
| l | soundAutoRestore (false=用户关音不恢复) | d(int,int):378-387 |
| D/E/F/m | mainThread/screenWidth/screenHeight/instance | 构造 :53-54, r() |
| l[0]/l[3] | 语言序号/音效开关 | 构造读 RMS "settings"; w() 写回 |
| l[4] | 语言包版本合规标志 | d(int,int):370-377 (d(152)=="1") |
| l[13] | 游戏局达标标记 (1→HoF 新纪录) | h.n():282 |
| m[4]/m[6]/m[7] | 启动完成标志组 (b(4,1)/b(6,1)/b(7,1)) | 构造 :73-77 |

## h.java → HallOfFameScreen (JD+2)
| a/b | tableNames [榜][3] / tableScores [榜][3][列] | RMS "HoF" 读写 (:104-121/:217-234) |
| c | lastName (writeUTF 首项) | :105 |
| d/e/f | lastScores/submitTable/submitRank | a(int,int[],String) |
| g/h | game/splash | a(GameMIDlet,j,m) |
| i/j/k | entryState/shownState/pendingNameState | b()/c()/a(Command) |
| l | nameConfirmPending | a(int,int):293 |
| m | softkeys | b() |
| n | canvas (static) | a(GameMIDlet…) |
| o | keymaps = game.p() | :71 |
| p/q | okCommand/backCommand | b() |
| r..w | rankLabelW/leftX/rightX/trophyRightX/trophyLeftX/lineH | 静态块字体度量 |
| x/y | smallFont/boldFont (32,0,8)/(32,1,8) | 同上 |
| z/A/B | imgTrophy/imgPop/imgBlocks (id6/7/8) | 构造 g.c(6/7/8) |
| C/D | fadeWide/fadeTall (椭圆羽化蒙版) | 构造 c(E,lineH)/c(E,2lineH) |
| E/F/G/H | viewLandscape/viewPortrait/legendPending/legendDone | 静态块+b(int,int) |
| id6/7/8 | 榜行图标/人口图标/高度图标 (r0) | 构造 + 绘制 :424-487 |

## j.java → MenuScriptInterpreter (JD+3)
| b | bootTable int[9] ("m" 头) | ctor; i.a(j.a()) 转交渲染器 |
| c | itemTable int[项][8] | d() 装载 (型0 菜单项) |
| d | subItemNames ("名 [子名]") | d():229 |
| e | settingPairs (f.a 槽,值 对) | c() case5 |
| f | itemCount (兼临时模式) | d()/a(int,int,Command[]) |
| g/h | backScreenId/forwardScreenId | b(int) 屏头 |
| i | screenType (0/1/2/3/5/6/7) | b(int) |
| j | scriptStream ("m") | ctor/b(int) |
| k/l/m | loadOnNextTick/showList(FIRE)/goBackRequested(BACK) | a(int,int)/b(int,int)/a(Command) |
| n/o | scrollDelta/actionDelta | b(int,int) |
| p/q | canvas/activeSoftkeys | ctor/b(int) |
| r | rendererNeedsReset | b(int):165 |
| s | targetScreenMode (按屏型 0..4) | b(int):148-163 |
| t/u | 【待证】nameBuffer/nameResult | 仅声明/桥访问器 |
| v/w/x | nameForm/nameField/sharedNameField | a(int,int,Command[]) 录入名 |
| y/z/A | soundToggleReturn/returnToQuick/returnToCity | a(int):348-360 音效开关回跳 |
| "m" 文件 | 菜单屏幕描述脚本 (u16 屏数+9×int32 头+每屏树) | ctor/b(int)/d() 逆向 |

## p.java → PhoneCanvas (JD+3)
| a/b/c | midlet/suppressShowNotify/suppressHideNotify | :35/:121-129/:98 |
| d/e/f/g | leftSoftkey/rightSoftkey/leftSoftkeyIcon/rightSoftkeyIcon | a(Command,Image) 型 1/4/5/8=左, 2/3/6/7=右 |
| h | softkeyFont (32,1,8) | :33 |
| 软键键码 | -6=左 / -7=右 / -11,-12 忽略 | keyPressed :53-63 |

## i.java → MessageRenderer (JD+3, 部分)
| a | displayMode (0无/1菜单/2消息/3文本) | a(Graphics) 分派 |
| b | titleIcon | a(Image,String) |
| d..F | (28 项) wrappedTitle/settingSlots/lineStride/alignMode/multiPage/pageScroll/cornerIcon(id0)/lastPageReached/itemCount/openClock/itemIcons/itemTexts/itemAligns/iconMaxH/iconMaxW/bodyPages/boxX..boxH/titleY/textTopY/alpha/colors/titleFont/bodyFont/itemFont/noContent | 逐字段见 i_clean.java 注释 (行号 :16-46) |

## com/nokia/mid/appl/bloxx/a.java → NokiaLangPack (JD+3)
| b/c/a | instance/stream/locale | lang.<locale> 回退 lang.xx — nokia 版 lang.* 布局出处实锤 |

## k.java → CityMapScreen (JD+4)
| a | cityCells int[75]=25 格×3 (类型/人口/roof) — 城市地图本体 | b(int,int):放置写 / m() 读 |
| b | buildableLevel int[25] (0-3 可建上限) | h() 邻接色判定 |
| c | towerIcons Image[9] = r0 id71-79 | c() |
| d | hudMsgShown | f() |
| e/f | selTowerType(0-3)/uiMode(0 常,1 盖楼) | b(int,int) |
| g/h | cityPopulation/cityLevel (V[21] 里程碑刻度) | g() |
| i/j | selCol/selRow (-1=起重机位) | b(int,int) 光标 |
| l | placeAnimActive (ab 3000ms) | b(int,int) |
| n | milestoneLevel (al 称号档) | g() |
| o/q | firstTipShown/cheatMode(at, 密码 626428826) | a(int,int) |
| p | replaceLevel (aj 替换档, -1) | g() |
| r | tipFlags boolean[46] 里程碑提示 | b(int,int) 队列 / n() 存 |
| s/t | popFlashTimer/popFlashDigits | b(int,int) 人口闪烁 |
| u/v | cranePopValue/mapFullFlag | b(int,int)/j() |
| w | towerNames (状态条折行文本, 跑马灯 aD/aE/aC) | b(int,int) 尾段 |
| L..U | id21 边框柱/id22 箭头滑块/id23 居民条/id24 起重机/id25-29 城市塔×5/id30 放置6帧/id31 摧毁6帧/id15,16,17 状态图标 | c() |
| V[21] | 里程碑人口表 {0,75,…,19000} | 静态块 |
| ai/aj/al | {0,3,6,10} 楼型解锁 / {8,12,14,16} 替换解锁 / {0,1,4,7,9,11,13,15,18,20} 称号档 | g() |
| au | "626428826" 作弊密码 | a(int,int) 逐键比对 |
| aB[16] | 行/列建筑连续范围 (虚线瓦片高亮边界) | h() |
| aC/aD/aE | 状态条行数/跑马灯偏移/停留 2000ms | b(int,int) 尾段 |
| aF/aG | 盖楼飞入 700ms/落定脉冲 2000ms | b(int,int) |
| aA | 虚线相位 (>>8=÷256 定点!) | :917 |
| ax | 格色脉冲 800ms | a(Graphics) |
| aw | 放置前旧人口 (滚动起点) | b(int,int) |
| W/X/Y | 新楼类型/人口/roof | a(int,int,int) |
| Z/aa/k | 光标滚动偏移/150ms | b(int,int) |
| RMS "citymode" | cityModeRS 本体: House.e/f + 34 标量 + aB[16] + b[25] + a[75]×3 + r[46] + z 续读位 | n() 写 / m() 读 — House.i/j 委托 |

## House.java 字段 (JD+5 批次)
| aT/aU | 屏幕塔锚点 x=E/2, y=F/2 | y() |
| bd/be | 世界宽/高 =E,F*256/32 (定点 256=1.0) | y() |
| cI | 相机 Z (迭代使 3D 点入屏) | y() |
| cw/aj | id9 DCH logo / id0 角标图集 | y() |
| aa/ab/ac/ad | id12/13 小人行 / id69/70 云 | y() |
| bF/bG[0..6] | 惊慌人群跳弧表 (n4+=5+n2 升 / n3+=5-n2 降) | y() |
| cn/co | E/20, F/15 网格度量 | y() |
| aG[2][13] | 城市图标栅格 (n%5*45, n/5*45) | y() |
| cd | max(be,2048) 世界深 | y() |
| l[4] | 里程碑提示阈值 {70,250,550,1000} | y() |
| G/H | 世界宽/高 =E,F*1024 (定点 1024=1.0, 天气用) | ctor |
| cU/cV | 雨/雪概率 *1024/100 | ctor JAD 参数 |
| cW[2][20] | 雨/雪粒子参数表 (JAD 时长换算) | ctor |
| aP/cP/cQ/cR/cO | 摆钩相位/摆周期参数/横摆幅/纵摆幅/吊缆长 | p()/z(int) |
| aK/aL/aM | 摆钩 x/y(定点 256)/x>>4 | p() |
| aH | 吊钩提升高度 (顶 1664, bk==1 时 1408) | p() |
| aJ | 吊钩基线 y=2432 | K() |
| aN/aO | 上帧摆钩位置 (速度计算) | p() |
| aB[0]/aC[0] | 摆钩速度 (256=1.0/帧) | p() |
| bw/bu/bv/br/cS | 摇摆相位/衰减值/摆幅/倾角/sin(bw/10) | q(int) |
| bn/bm | 塔身倾斜累计 (左右) | z(int) |
| bx/by | 可见层窗下沿/上沿 (max(0,bs-5)/min(4,bs-1)) | z(int) |
| dF | 5 层窗平均偏移 (clamp ≤100) | z(int) |
| bs | 层数 | K()/z(int) |
| bt | 总人口 (累计+银行) | H() |
| bB/bz/bA | 组合银行/零头 | H() |
| aF byte[20] | 层落点偏移环缓冲 (bs%20) | :2877 写 |
| bi/bj[5] | 层中心 x/层顶 y (定点 256=1.0) | K() |
| bh[5] | 层渲染 x (A() 摇摆投影输出) | A() |
| dD | 命中层游标 | F() |
| aA[0]/az[0] | 下落块 x/层内 y (定点) | F() 容差 ±256 |
| aw[5] | 块状态机 (0/1 待落,2 落,6 提钩; [1]=) | J()/p() |
| aD[0]/aE | 挂点 y/落块时刻 | J() |
| cc | 装载进度 (e(int) 写, g():3363 消费) | e(int) |
| aW/aX/aY | 相机 y(定点)/目标/起始时刻 | z()/o(int) |
| dI | 天际线滚动偏移 | z() |
| aJ=cW+1792+128 | 吊钩基线跟随相机 | z() |
| cN | 上次机会变更时刻 | A(int) |
| bb/bc/ba | 机会变更累计/时刻/计数 | A(int) |
| bk | 摆钩状态机 (1/4 特判, 2=摇摆) | 多处 |
| bf | 新纪录标志 | a(boolean) |
| cj[3]/[4]/[5] | 人口/高度/组合 纪录 | a(boolean) |
| dG[12][7]/dH[3] | 远景楼群动画表/配色 | L() |
| ci[360] | 正弦表 32768=1.0 | M() |
| cf | Random | i(int) |
| dB[9]/dA[4][28]/dy[28]/dz[28] | 背景飞行物槽/型表(高度带/概率/速度向)/余量/偏移 | E()/x(int) |
| bP/bQ/bX/bY/bZ/ca/cb | 菜单分页/输入门/子选择/暂存 | l(int)/O() |
| de | 昼光标志 | a(int,boolean) |
| ds..dj, dc[2], dd[300] | 天气粒子组头/粒子 | v()/w(int) |
| n | 暂停标志 (e(int) 返回 !n) | c() |
| q/p | 音效开关回读标志 (a(3)/a(1)) | y() |
| g/h | 快速/城市局进行中 | a(boolean) |
| I/J/K/N/R/S | 菜单阶段/时限/跳过/需绘/已起播 | d(int) |
