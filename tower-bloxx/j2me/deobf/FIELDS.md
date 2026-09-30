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
