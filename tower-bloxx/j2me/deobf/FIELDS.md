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
| f.g | vibrationLevel (默认 5) | e(int)/b() |
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
