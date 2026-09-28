// TCS H5 重制 — 玩法逻辑按 deobf/GAME_LOGIC.md 还原
// 数据: WEAPONS/STRUCTURES/CHASSIS/WAVES (data.js)
'use strict';

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
let zoom = 1;                // 原版 G 键: 1 ↔ 0.39 全图视图

// ---------------- 原版机制参数 (GAME_LOGIC.md) ----------------
const REPAIR_COST = 2;          // 2$/HP
const SELL_RATIO = 0.75;        // 75% 按余血
const INTEREST_STEP = 3;        // 利率每次 +3
const SPLIT = [ [0.25, 1], [0.5, 0.5], [1, 0.2] ];  // 溅射三段: 半径比例, 伤害比例
const ANTI_AIR_MULT = 4;        // 打直升机 ×4 (fireOnEnnemi)
const AA_WEAPONS = ['m60', 'gatling', 'crotale']; // 天生可对空
const RADAR_RANGE = 1200;       // 雷达站视野 (typeData radar distanceOfFire)
const VIS_MARGIN = 60;          // 防御塔视野 = 射程外一小圈
const BASE_VIS = 150;           // 基地基础视野
const AA_UP_RATIO = 0.6;        // 对空升级费 = 塔造价 × 0.6

// ---------------- 战争迷雾 ----------------
// 改设定: 全图默认迷雾; 视野源 = 各塔(射程+60)/雷达站(1200)/基地(150)。
// 建造不受视野限制(区别于红警)。雷达站由原版鸡肋变为驱雾核心。
const fogCv = document.createElement('canvas');
fogCv.width = W; fogCv.height = H;
const fogCtx = fogCv.getContext('2d');
let VIS = [];                   // 每帧重算的视野源

function computeVisibility() {
  // 基地视野: 基地在 r10 (93, -1563) 北端
  VIS = [{ x: 480, y: WORLD.y0 + 80, r: BASE_VIS * 1.6 }];
  for (const t of G.turrets) {
    if (t.hp <= 0) continue;
    if (t.id === 'radar') VIS.push({ x: t.x, y: t.y, r: RADAR_RANGE });
    else if (t.w) VIS.push({ x: t.x, y: t.y, r: t.w[1] + VIS_MARGIN });
  }
}
function isVisible(x, y) {
  for (const s of VIS)
    if (Math.hypot(s.x - x, s.y - y) <= s.r) return true;
  return false;
}
function revealExplored() {   // 视野经过的区域永久标记为已探索
  exploredCtx.fillStyle = '#fff';
  for (const s of VIS) {
    const ex = (s.x - (WORLD.x0 - 40)) * EXPLORED_SCALE;
    const ey = (s.y - (WORLD.y0 - 40)) * EXPLORED_SCALE;
    exploredCtx.beginPath();
    exploredCtx.arc(ex, ey, s.r * EXPLORED_SCALE, 0, 7);
    exploredCtx.fill();
  }
}
function exploredToScreen() {   // 探索记忆 → 屏幕绘制参数
  return { x: w2sX(WORLD.x0 - 40), y: w2sY(WORLD.y0 - 40),
           w: expW / EXPLORED_SCALE * zoom, h: expH / EXPLORED_SCALE * zoom };
}

// 建造菜单 —— 顺序按原版 menu.constructionCont 子件顺序 (frame_6/PlaceObject2_6_333)
// 解锁不再看波数阈值, 全部走原版 unlocker 表 + 二选一面板
const SHOP = [
  { id:'m60'       }, { id:'gatling'   }, { id:'canon75'   },
  { id:'canon105'  }, { id:'canon105D' }, { id:'radar'     },
  { id:'crotale'   }, { id:'canon125'  }, { id:'MLRS'      },
  { id:'MTHEL'     }, { id:'pluton'    },
];
// 原版解锁时间线 (DefineSprite_834/frame_1/PlaceObject2_773_189 newEvents, 关卡号=波号):
//   m7 → canon75 / m11 → canon105 / m16 → canon105D  (自动解锁)
//   m27 → radar / m31 → su37                          (自动解锁 + 开二选一面板)
//   m18 m20 m27 m31 m37 m39                            (开二选一面板)
// 二选一 (sprite 989): 解锁下一件 weaponsToUnlock[iUnlock], 或 interest += 3
const AUTO_UNLOCK = { 7:'canon75', 11:'canon105', 16:'canon105D', 27:'radar', 31:'su37' };
const PANEL_WAVES = [18, 20, 27, 31, 37, 39];
const WEAPONS_TO_UNLOCK = ['crotale', 'canon125', 'MLRS', 'MTHEL', 'pluton'];
const WEAPON_CN = { crotale:'响尾蛇导弹', canon125:'125mm 炮', MLRS:'火箭炮',
                    MTHEL:'激光防空', pluton:'冥王导弹' };

// 路线: deobf/data/waypoints.json 的真实路点 (SWF PlaceObject2 矩阵坐标, y 向上)
// 地图: map.jpg (原版 chid764, 2070x1920)。世界坐标 = Flash 坐标:
//   x ∈ [-237, 1899], y ∈ [-1563, 580] (路点范围, 覆盖整张地图)
// 屏幕绘制: sx = x - cam.x, sy = (MAP_TOP - y) - cam.y  (翻转 y)

const MAP_W = 2070, MAP_H = 1920;
const WORLD = { x0: -237, x1: 1899, y0: -1563, y1: 580 };   // 路点包围盒
// 地图位图左上角对应的世界坐标 (位图 2070x1920 铺满整个世界带)
const MAP_ORIGIN = { x: 0, y: -1440 };   // carteBase 放置矩阵 (0,-1440), 位图 2070x1920
const cam = { x: 60, y: 0 };   // 初始: 原版 carte._y=0 视图 (舞台 y 0..600, 出发区在底部)
// 探索记忆: 世界包围盒 (x -237..1899, y -1563..580) 半分辨率
const EXPLORED_SCALE = 0.5;
const expW = Math.ceil((WORLD.x1 - WORLD.x0 + 80) * EXPLORED_SCALE);
const expH = Math.ceil((WORLD.y1 - WORLD.y0 + 80) * EXPLORED_SCALE);
const exploredCv = document.createElement('canvas');
exploredCv.width = expW; exploredCv.height = expH;
const exploredCtx = exploredCv.getContext('2d');
const heavyCv = document.createElement('canvas');
heavyCv.width = W; heavyCv.height = H;
const heavyCtx = heavyCv.getContext('2d');


// 阵亡镜头抖动偏移 (屏幕像素)。原版在 destruction 段直接累加 _root.carte._x/_y;
// H5 里 carte 的角色由世界→屏幕变换承担, 故把该偏移加在 w2s*/s2w* 上。
// 必须在 w2sX/w2sY 之前声明 (它们是热路径, 直接读 shake.x/shake.y)。
const shake = { x: 0, y: 0 };

function w2sX(x) { return (x - cam.x) * zoom + shake.x; }
function w2sY(y) { return (y - cam.y) * zoom + shake.y; }   // 世界 y = Flash 屏幕坐标 (y 向下=南), 无翻转
function s2wX(sx) { return (sx - shake.x) / zoom + cam.x; }
function s2wY(sy) { return (sy - shake.y) / zoom + cam.y; }

// ---------------- 原版单位贴图 (deobf/data/sprites.json: shape→bitmap 对号) ----------------
const UNIT_IMG = {};
const UNIT_BMP = {
  camion1: 402, camion2: 404, camion3: 406, jeep: 409, bradley: 411, amx10: 413,
  abrams: 415, t90: 417, camionBlinde: 419, navire: 422, Yamato: 424,
  tigre: 'tigre',   // 直升机 (原版矢量 chid157 渲染图)
};
for (const k in UNIT_BMP) {
  const im = new Image();
  im.src = 'assets/units/' + UNIT_BMP[k] + '.png';
  UNIT_IMG[k] = im;
}
// 单位阴影 (原版 _ombre 系列, deobf/data/exports.txt 权威映射):
//   原版放置带 colorTransform mult RGB=0/alpha=0.352 → 把 _ombre 图压成全黑半透明阴影
//   原版 428_unit enterFrame: ombre._rotation = _rotation; ombre._x = _x+4; ombre._y = _y+4
const UNIT_SHADOW = {
  camion1: 'DefineSprite_527_camion1_ombre', camion2: 'DefineSprite_529_camion2_ombre',
  camion3: 'DefineSprite_531_camion3_ombre', jeep: 'DefineSprite_534_jeep_ombre',
  bradley: 'DefineSprite_526_bradley_ombre', amx10: 'DefineSprite_523_amx10_ombre',
  abrams: 'DefineSprite_521_abrams_ombre', t90: 'DefineSprite_537_t90_ombre',
  camionBlinde: 'DefineSprite_533_camionBlinde_ombre', navire: 'DefineSprite_535_navire_ombre',
  Yamato: 'DefineSprite_538_Yamato_ombre',
};
const SHADOW_IMG = {};
for (const k in UNIT_SHADOW) {
  const im = new Image();
  im.src = 'assets/ombre/' + UNIT_SHADOW[k] + '/1.png';
  SHADOW_IMG[k] = im;
}
const SHADOW_ALPHA = 0.352;   // 原版 colorTransform alpha mult
const SHADOW_OFFSET = 4;      // 原版 ombre._x/_y = _x/_y + 4

// ---------------- 选中视觉 (原版 carte.viseurUnit 778 + carte.cerclePortee 775) ----------------
// 反编译依据 (frame_6/PlaceObject2_6_321 enterFrame + load):
//   afficheUnit != "null" 时: cerclePortee 移到选中单位 (x,y), _width = distanceOfFire * 2 (直径)
//   viseurUnit 同样跟随; unshowInfoOnUnit() 时两者 _x = -500 (移出画面)
//   471 是音效 selectionUnite (非视觉!); 778=红色四角准星(前4帧有内容), 775=绿色射程圈
const SEL_CROSS = [1, 2, 3, 4].map(i => {
  const im = new Image();
  im.src = 'assets/selection/DefineSprite_778/' + i + '.png';
  return im;
});
const SEL_RANGE = (() => {
  const im = new Image();
  im.src = 'assets/selection/DefineSprite_775/1.png';
  return im;
})();
// ---------------- 命中火花 (原版 master_weapons.createEclat → etincelle, chid 564) ----------------
// 权威依据 deobf/pcode_as/frame_6__PlaceObject2_6_327 (命中循环) + ..._6_335 createEclat:
//   每次命中敌人: createEclat(单位位置 + (unitEtat偏移)/4)   ← 1 个
//   若威力 > 8:   再 createEclat ×2                          ← 共 3 个
//   createEclat: attachMovie("etincelle"+i) (chid 564, 7 帧)
//                _rotation = random()*360; _x/_y = 目标 ± (random()*16 - 8)
//   etincelle 素材: 53x4 画布, 7 帧逐帧淡出 (亮黄→白→灰), 火花自右向左飞散
const SPARK_FRAMES = [1,2,3,4,5,6,7].map(i => {
  const im = new Image();
  im.src = 'assets/spark/' + i + '.png';
  return im;
});
const SPARK_FPS = 24;                        // SWF 帧率
const SPARK_TICKS = Math.round(SPARK_FRAMES.length / SPARK_FPS * 30);   // 7帧@24fps → 30fps
// 火花画布原点: FFDec SVG 导出该 placement 的内容变换为 matrix(1,0,0,1, 51.8, 2.3),
//   即"火花发源点"在 sprite 局部 (0,0) → 画布左上角在局部 (-51.8, -2.3)
//   (frame1 内容 bbox x[50,52] 中心 51 ≈ 51.8, 交叉证实)
const SPARK_ORIGIN = { x: -51.8, y: -2.3 };

// ---------------- 阵亡序列 (原版 428 "destruction" 39 帧) ----------------
// 原版流程 (权威依据 deobf/scripts/DefineSprite_428_unit/):
//   unitEtat.destruction()  →  tourelle.play() + _parent.gotoAndPlay("destruction")
//   destruction 段 (f2..f39): 车辆原地滞留, 车体沿自身轴向后漂移 12px,
//     帧 2 / 帧 4 / 帧 7 各触发一次 createExplosion(车体 markFlame 世界坐标, prefID=4)
//     (f4 与 f7 调用无第 3 参 → createExplosion 内 `if (prefID == undefined) 随机1..3`)
//   frame_39 DoAction: master_units.removeUnits("E", this) + removeMovieClip(this)
//   frame_2 DoAction_2: euros += prixRevient (售回收益) + 随机 explosion1..6 音效
const DEATH_TICKS = Math.round(39 * 24 / 30);      // 39 帧 @24fps → 31 tick
// 三次爆炸在序列内的触发 tick (原版帧 2/4/7 → 相对帧 2 偏移 0/2/5 帧)
const DEATH_BOOM_TICKS = [0, 2, 5].map(f => Math.round(f * 24 / 30));
// 车体漂移总量 (SVG 实测 chassis ty -155.05 → -167.05 = 12px, 沿车体纵轴向后)
const DEATH_DRIFT = 12;
// 阵亡爆炸用原版 createExplosion 的素材: chid 279 "explosion" (4 帧) + chid 637 "flame" (34 帧)
//   权威依据 deobf/pcode/scripts/frame_6/PlaceObject2_6_335 (createExplosion 字节码):
//     carte.attachMovie("explosion"+i) → chid 279; carte.attachMovie("flame"+i) → chid 637
//     (pseudo 里显示为 26000+i / 28000+i, 实为 AS2 attachMovie 参数序被写反, 链接名才是常量)
//     gotoAndStop(prefID) —— prefID=4 时播 "flame"? 不: explosion 停在第 4 帧 (共 4 帧, 即最后一帧)
//   H5 assets/explosion/1..4.png 已核实 = chid 279 的 4 帧; assets/flame/ = chid 637 的 34 帧
const DEATH_FLAME_FRAMES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,
  25,26,27,28,29,30,31,32,33,34].map(i => {
  const im = new Image();
  im.src = 'assets/flame/' + i + '.png';
  return im;
});
const DEATH_FLAME_TICKS = Math.round(DEATH_FLAME_FRAMES.length * 24 / 30);   // 34帧@24fps → 27 tick
// 爆炸本体 (chid 279, 4 帧)。原版 createExplosion 末尾是 gotoAndStop(prefID 或随机1..3) ——
// 即"停在一帧上", 但该帧内的子精灵自带动画。H5 无此嵌套, 改为 4 帧快播后消失 (视觉近似, 如实记录)
const DEATH_BOOM_TICKS_LOCAL = Math.round(4 * 24 / 30);   // 4帧@24fps → 3 tick
// 阵亡期的镜头抖动 (原版 destruction 段帧 2/4/6/8/10/12 直接改 _root.carte._x/_y)
//   权威依据 (两处互相印证):
//     428 帧 8 为字面量 `_root.carte._x -= 8; _root.carte._y -= 6;`
//     185 帧 2/4 为字面量 `_root.carte._x += 6 / += 7; _root.carte._y -= 10 / += 7;`
//     (428 帧 2/4/6 的宿主名被混淆, 但 185 与 428 的 destruction 脚本同为逐字相同的代码,
//      且 185 帧 6 保留字面量 `_x -= 5 / _y += 9`, 据此确定 6 组数值)
//   => 六组位移之和 = (0,0) —— 确定性"抖动后归位", 不是漂移
const DEATH_SHAKE = [
  [6, -10],   // 帧 2
  [7, 7],     // 帧 4
  [-5, 9],    // 帧 6
  [-8, -6],   // 帧 8
  [4, 7],     // 帧 10
  [-4, -7],   // 帧 12
];
// 相对 destruction 起始帧(=帧2)的帧偏移 0,2,4,6,8,10 → 折算到 H5 30fps 的 tick
const DEATH_SHAKE_TICKS = [0, 2, 4, 6, 8, 10].map(f => Math.round(f * 24 / 30));
// 每帧重算阵亡镜头抖动。
//   原版把位移累加到 _root.carte._x/_y (舞台像素), 六组之和恰为 0 → 序列结束自然归位。
//   H5 的 carte 语义由世界→屏幕变换承担, 故把偏移加在 shake 上 (w2s*/s2w* 统一承担),
//   不动 cam (cam 是滚动/小地图/钳制的基准)。
function updateDeathShake() {
  let ox = 0, oy = 0;
  for (const arr of [G.units, G.turrets]) {
    for (const e of arr) {
      if (!(e.dying > 0)) continue;
      const t = DEATH_TICKS - e.dying;   // 已播 tick 数
      for (let i = 0; i < DEATH_SHAKE_TICKS.length; i++) {
        if (t >= DEATH_SHAKE_TICKS[i]) { ox += DEATH_SHAKE[i][0]; oy += DEATH_SHAKE[i][1]; }
      }
    }
  }
  shake.x = ox; shake.y = oy;
}

// ---------------- 爆炸动画 + BGM ----------------
// 注: 旧的 86 库单帧方案 (TURRET_SRC/TURRET_IMG) 已删除 —— 经 FFDec 导出核实,
//     DefineSprite_86 是黑色线框标记层 (箭头/十字/方框), 不是炮塔外观。
//     现改用 173 库整帧, 见下方 TURRET_LIB_* 与 TURRET_GUNS。
// 炮弹 (权威映射, 全部来自 DefineSprite_400_obus 帧库子件 + frame_1 弹体):
//   obus 库帧标签 → 内层弹体 sprite (dump 权威):
//     obusLeger→301(90x93) obusMoyen→307(104x108) obusLourd→361(176x182)
//     bullet/bulletLourde→390(曳光, 无爆炸音, 带 ricochet/metal 概率)
//     missile/missileUnder→393(23x56 导弹) missile2→394 内嵌 missile3→395 内嵌
//   飞行弹体统一取 sprite 的 frame 1 (其余帧是爆炸/尾焰动画)
const SHELL_FRAMES = {
  // 每型: sprite 路径 + 内容 bbox (实测) + 缩放到 ~16-22px 世界长度
  bullet:      { src: 'assets/shells/DefineSprite_390/1.png', bbox: [19,38,6,32],  scale: 0.4688 },
  bulletLourde:{ src: 'assets/shells/DefineSprite_390/1.png', bbox: [19,38,6,32],  scale: 0.4688 },
  obusLeger:   { src: 'assets/shells/DefineSprite_301/1.png', bbox: [39,36,14,25], scale: 0.5600 },
  obusMoyen:   { src: 'assets/shells/DefineSprite_307/1.png', bbox: [45,43,16,26], scale: 0.6154 },
  obusLourd:   { src: 'assets/shells/DefineSprite_361/1.png', bbox: [81,74,16,36], scale: 0.6111 },
  missile:     { src: 'assets/shells/DefineSprite_393/8.png', bbox: [4,21,16,25],  scale: 0.8000 },
  missile2:    { src: 'assets/shells/DefineSprite_393/8.png', bbox: [4,21,16,25],  scale: 0.8000 },
  missile3:    { src: 'assets/shells/DefineSprite_393/8.png', bbox: [4,21,16,25],  scale: 0.8000 },
  missileUnder:{ src: 'assets/shells/DefineSprite_393/8.png', bbox: [4,21,16,25],  scale: 0.8000 },
};
const SHELL_IMG = {};
for (const k in SHELL_FRAMES) {
  const im = new Image(); im.src = SHELL_FRAMES[k].src; SHELL_IMG[k] = im;
}
// 武器 → 弹型 (塔库帧→内部弹 sprite→createObus 类型, 逐一对号)
const SHELL_KIND = {
  m60: 'bullet', gatling: 'bullet', m60Brad: 'bullet', gatlingAmx10: 'bullet',
  gatlingDT90: 'bullet', gatlingDTigre: 'bullet',
  canon75: 'bulletLourde', '75mmBrad': 'bulletLourde', '75mmAmx10': 'bulletLourde',
  canon105: 'obusLeger', '105mmAbrams': 'obusLeger',
  canon105D: 'obusMoyen', '105mmDAbrams': 'obusMoyen',
  canon125: 'obusLourd', '125mmT90': 'obusLourd',
  crotale: 'missile', crotaleAbrams: 'missile', crotaleTigre: 'missile',
  MLRS: 'missile2', pluton: 'missile3', navireCrotale: 'missileUnder',
  Yamato460: 'obusLourd', MTHEL: 'obusLeger',
};
// ---------------- 炮塔外观: 173 库整帧渲染 (原版权威) ----------------
// 结论依据 (deobf/turret_layout.py + 模板匹配双证):
//   1) DefineSprite_173 是真正的武器塔外观库 (26 帧, 帧标签=武器名)
//      FFDec `-selectid 173 -format sprite:png` 导出的每帧都是统一画布 48x143,
//      **部件已按原版 PlaceObject 矩阵合成为正确布局** —— 无需手工拼装。
//   2) 画布原点 (相对武器局部坐标系) 经 12 个独立部件模板匹配一致收敛:
//      origin = (-21.98, -76.30), 标准差 <0.31px  → 见 TURRET_LIB_ORIGIN
//   3) DefineSprite_86 (原 H5 用的"86 库") 经导出核实是**黑色线框标记层**
//      (箭头/十字/方框/叉, 平均 RGB≈0, 彩色占比 0%), 不是炮塔外观。
//      这正是此前"炮塔资源用错"的根因 → 玩家塔也改用 173 库。
//   4) 旋转语义: structure(185) 内 tourelle=dpt24 整体旋转 (DefineSprite_174 控制器
//      调 gotoAndStop(type) 显示整帧, 再旋转 tourelle 自身) → H5 整帧一起转。
const TURRET_LIB_ORIGIN = { x: -21.98, y: -76.30 };   // 173 库 48x143 画布原点
// 武器 ID → 173 库帧号 (deobf/data/turret_layout.json labels)
const TURRET_LIB_FRAME = {
  m60: 2, gatling: 3, canon75: 4, canon105: 5, canon105D: 6, radar: 7,
  crotale: 8, canon125: 9, MLRS: 10, pluton: 11, MTHEL: 12,
  radarMobile: 13, m60Brad: 14, '75mmBrad': 15, gatlingAmx10: 16, '75mmAmx10': 17,
  '105mmAbrams': 18, '105mmDAbrams': 19, crotaleAbrams: 20, '125mmT90': 21,
  gatlingDT90: 22, gatlingDTigre: 23, crotaleTigre: 24, navireCrotale: 25, Yamato460: 26,
};
const TURRET_LIB_IMG = {};
function turretLibImg(id) {
  const f = TURRET_LIB_FRAME[id];
  if (!f) return null;
  if (!TURRET_LIB_IMG[id]) {
    const im = new Image();
    im.src = 'assets/turretlib/173/' + f + '.png';
    TURRET_LIB_IMG[id] = im;
  }
  return TURRET_LIB_IMG[id];
}
// ---------------- 玩家塔结构层: 86 库 (structureDeco) ----------------
// 【重要修正】上一轮误判 86 库为"线框标记层"而弃用 —— 错了。
//   权威依据 deobf/scripts/DefineSprite_185_structure/frame_1/PlaceObject2_86_1 onClipEvent(load):
//     `var structure = _parent.structure; this.gotoAndStop(structure);`
//   → 86 库按【武器名】跳帧, 与 173 库同一套武器名 (86 恰 11 帧 = 玩家 11 种武器)
//   结构: structure(185) = 86[dpt1 结构层, 不旋转] + 174->173[dpt24 炮塔层, 随 rot 旋转]
//         两层在 185 内都是 identity 变换 → 共用同一武器局部坐标系, 直接叠加
//   合成验证: 86 f6(雷达支架) + 173 f7(碟盘) 严丝合缝拼成完整雷达站;
//             86 f4(X 形驻锄) + 173 f5(炮管) = 完整 105mm 炮塔;
//             86 f10(发射结构) + 173 f11(导弹) = 完整 pluton
//   画布原点经 union 验证: 76.49x76.49 ≈ FFDec 实测 76x76 → (-38.20, -35.55)
const TURRET_BASE_ORIGIN = { x: -38.20, y: -35.55 };   // 86 库 76x76 画布原点
const TURRET_BASE_FRAME = {
  m60: 1, gatling: 2, canon75: 3, canon105: 4, canon105D: 5, radar: 6,
  crotale: 7, canon125: 8, MLRS: 9, pluton: 10, MTHEL: 11,
};
const TURRET_BASE_IMG = {};
function turretBaseImg(id) {
  const f = TURRET_BASE_FRAME[id];
  if (!f) return null;
  if (!TURRET_BASE_IMG[id]) {
    const im = new Image();
    im.src = 'assets/turretlib/86/' + f + '.png';
    TURRET_BASE_IMG[id] = im;
  }
  return TURRET_BASE_IMG[id];
}
// ---------------- 塔底盘: 经权威核实"不可见", 不渲染 ----------------
// 86 库每帧含 d1:54(内嵌 shape53), shape53 bounds 40.8x40.8px, 单条 evenodd 路径。
// 【核实过程与结论】
//   FFDec 的 shape PNG 导出该图为全透明; 但 SVG 导出给出 fill="#ffffff"(白色),
//   一度误判为"漏导的白色圆盘"并光栅化补上 —— 结果与 FFDec 导出的父容器 185 不符
//   (185 全 39 帧白色像素 = 0)。
//   最终从 SWF 原始字节解析定型: shape53 是 **DefineShape3**(RGBA 填充),
//   唯一填充 = 纯色 RGBA(255,255,255,**0**) → **alpha=0, 完全透明**。
//   SVG 导出丢了 alpha 通道才显示成白色。原版该 shape 是透明占位(疑为 hit-area/遗留),
//   **不产生任何可见像素** → H5 不渲染它, 与 FFDec 的 185 导出结果一致。
//   (即: 上一版本 H5"没有底盘"是对的; 本轮一度加回属于错误, 已回退并记录证据)
// 原版另给该透明件随机初向 (DefineSprite_86/frame_1/PlaceObject3_54_1:
//   `this._rotation = Math.random()*360;`) —— 因不可见, 无视觉影响。
// ---------------- 持续 idle 旋转 (原版 onClipEvent(enterFrame) 逐帧自转) ----------------
// 穷举 deobf/scripts/DefineSprite_173 下全部 *onClipEvent(enterFrame)* 脚本, 权威清单:
//   frame_7  (radar)         d1  chid115  `_rotation += 2`
//   frame_8  (crotale)       d2  chid121  `_rotation += 10`
//   frame_13 (radarMobile)   d1  chid115  `_rotation += 4`
//                            d4  chid115  `_rotation -= 12`   ← 反向!
//   frame_20 (crotaleAbrams) d4  chid121  `_rotation += 10`
//   frame_25 (navireCrotale) d24 chid121  `_rotation += 10`
// 这些子件都带 HasClipActions(SWF flags 0x0096), 是独立 MovieClip。
// 速率换算: 原版 deg/帧 @SWF 24fps → H5 30fps: deg * 24/30
//
// 【关键区分 · 依据 turret_layout.json 逐帧组成枚举】
//   A) 整帧**只由自转件构成** → 该武器整帧图本身就是自转件, 直接整帧自转, 不可叠加(会重影)
//        radar(f7=[115]), radarMobile(f13=[115,115])
//   B) 整帧 = 基座 + 自转件 + 炮管 → 整帧里自转件被 FFDec 烘成静态姿态,
//      叠加同位置的自转件覆盖它
//        crotale(f8)/crotaleAbrams(f20)/navireCrotale(f25)
//   C) 无自转件 (其余 20 种) → 纯整帧贴图
// A 类的整帧自转中心 = 子件原点在武器局部系的位置 (即 placement 平移项 t):
//   radar     f7 d1 : t=(1.95, 8.10)
//   radarMobile f13 : 两个子件各转各的 → 见 RADARMOBILE_SPIN (整帧拆两件渲染)
const LIB_SPIN = {              // A 类: 单件整帧, 整帧绕 t 自转
  radar: { chid: 115, degPerSWFFrame: 2, t: [1.95, 8.10] },
};
// radarMobile 整帧含两个反向自转的 115 → 必须逐件渲染 (拆成两件各转各的)
const RADARMOBILE_SPIN = [
  { chid: 115, degPerSWFFrame: 4,  scale: 1.1960, t: [0.85, -8.0] },
  { chid: 115, degPerSWFFrame: -12, scale: 0.7817, t: [0.85,  5.8] },
];
const IDLE_SPIN = {             // B 类: 在整帧之上叠加自转件
  crotale:       { chid: 121, degPerSWFFrame: 10, scale: 0.5177, t: [-0.45, 1.90] },
  crotaleAbrams: { chid: 121, degPerSWFFrame: 10, scale: 0.5177, t: [-3.10, 8.55] },
  navireCrotale: { chid: 121, degPerSWFFrame: 10, scale: 1.1784, t: [-0.70, 5.20] },
};
const IDLE_SPR_IMG = {};
function idleSprImg(chid) {
  if (!IDLE_SPR_IMG[chid]) {
    const im = new Image();
    im.src = 'assets/eturrets_spr/DefineSprite_' + chid + '/1.png';
    IDLE_SPR_IMG[chid] = im;
  }
  return IDLE_SPR_IMG[chid];
}
// 子 sprite 画布原点 (union 实测): 115 = (-11.15,-8.55), 121 = (-12.00,-15.25)
const IDLE_SPR_ORIGIN = { 115: { x: -11.15, y: -8.55 }, 121: { x: -12.00, y: -15.25 } };
// 玩家武器 → 173 库武器 ID (玩家塔 = 86 结构层 + 173 塔体层, 同武器名)
const PLAYER_ETURRET = {
  m60: 'm60', gatling: 'gatling', canon75: 'canon75',
  canon105: 'canon105', canon105D: 'canon105D', canon125: 'canon125',
  crotale: 'crotale', MLRS: 'MLRS', pluton: 'pluton', MTHEL: 'MTHEL',
  radar: 'radar',
};
// 开火动画: 原版 tourelle 控制器 `canonN.gotoAndPlay("fire")` —— 只让 named 炮管部件
// 播开火序列, 底座不动 (deobf/pcode_as/DefineSprite_174... 第 340 行)。
// 表由 deobf/turret_layout.py 生成 (deobf/data/turret_guns.json):
//   m   = 该部件在武器局部系的权威 matrix [a,b,c,d,tx,ty] (tx,ty 已转 px)
//   o   = 该部件 PNG 画布左上角在部件局部系的坐标 (= 首帧 bounds 的 min, px)
//   n   = 原版实例名 (canon1/canon2... 决定开火顺序)
const TURRET_GUNS = {
  m60: [{ chid: 92, n: 'canon1', m: [0.565155, 0, 0, 0.565155, 0.5, -1.05], o: [-5.49, -22.65] }],
  gatling: [{ chid: 98, n: 'canon1', m: [1.390945, 0, 0, 0.752762, 0, -4], o: [-1.41, -14.83] }],
  canon75: [{ chid: 103, n: 'canon1', m: [0.561356, 0, 0, 0.561356, 0.05, -4.55], o: [-3.62, -27.96] }],
  canon105: [{ chid: 108, n: 'canon1', m: [0.638199, 0, 0, 0.638199, 0, -4.15], o: [-5.17, -32.21] }],
  canon105D: [
    { chid: 108, n: 'canon1', m: [0.640259, 0, 0, 0.638626, -2.5, -5.9], o: [-5.17, -32.21] },
    { chid: 108, n: 'canon2', m: [-0.640259, 0, 0, 0.638626, 3.4, -5.9], o: [-5.17, -32.21] }],
  crotale: [{ chid: 122, n: 'canon1', m: [0.5439, 0, 0, 0.539276, -8.15, -6.5], o: [-2.84, -7.36] }],
  canon125: [{ chid: 125, n: 'canon1', m: [0.748901, 0, 0, 0.748901, 0, -5.85], o: [-7.58, -38.13] }],
  MLRS: [{ chid: 128, n: 'canon1', m: [0.626816, 0, 0, 0.788177, -8.65, 0.8], o: [-2.11, -22.56] }],
  pluton: [{ chid: 80, n: 'canon1', m: [1.101685, 0, 0, 0.784576, 0, -5.25], o: [-2.74, -10.51] }],
  MTHEL: [{ chid: 83, n: 'canon1', m: [-0.572128, 0, 0, 0.572128, 0, -13.4], o: [0, 0] }],
  m60Brad: [{ chid: 92, n: 'canon1', m: [1.060989, 0, 0, 0.530502, 0.2, -4.15], o: [-5.49, -22.65] }],
  '75mmBrad': [{ chid: 103, n: 'canon1', m: [0.483109, 0, 0, 0.483109, 0.05, -8.9], o: [-3.62, -27.96] }],
  gatlingAmx10: [{ chid: 98, n: 'canon1', m: [1.713364, 0, 0, 0.681793, -0.15, -5.95], o: [-1.41, -14.83] }],
  '75mmAmx10': [{ chid: 103, n: 'canon1', m: [0.483109, 0, 0, 0.483109, 0, -10.4], o: [-3.62, -27.96] }],
  '105mmAbrams': [{ chid: 108, n: 'canon1', m: [0.541931, 0, 0, 0.541931, -0.15, -14.15], o: [-5.17, -32.21] }],
  '105mmDAbrams': [
    { chid: 108, n: 'canon2', m: [0.577667, 0, 0, 0.577026, 1.85, -12.55], o: [-5.17, -32.21] },
    { chid: 108, n: 'canon1', m: [-0.577667, 0, 0, 0.577026, -2.15, -12.55], o: [-5.17, -32.21] }],
  crotaleAbrams: [{ chid: 122, n: 'canon1', m: [0.5439, 0, 0, 0.539276, -7.7, -2.95], o: [-2.84, -7.36] }],
  '125mmT90': [{ chid: 125, n: 'canon1', m: [0.748901, 0, 0, 0.748901, 0.05, -16.55], o: [-7.58, -38.13] }],
  gatlingDT90: [
    { chid: 153, n: 'canon2', m: [-1.390945, 0, 0, 0.752762, 2.8, -11.55], o: [-1.41, -14.83] },
    { chid: 153, n: 'canon1', m: [1.390945, 0, 0, 0.752762, -2.15, -11.55], o: [-1.41, -14.83] }],
  gatlingDTigre: [
    { chid: 153, n: 'canon2', m: [-1.100342, 0, 0, 0.702637, 9.1, 3.05], o: [-1.41, -14.83] },
    { chid: 153, n: 'canon1', m: [-1.100342, 0, 0, 0.702637, -9.3, 2.85], o: [-1.41, -14.83] }],
  crotaleTigre: [{ chid: 161, n: 'canon1', m: [0.676193, 0, 0, 0.676193, -11.6, -3.95], o: [-2.84, -7.36] }],
  navireCrotale: [{ chid: 164, n: 'canon1', m: [0.569885, 0, 0, 0.565033, -8.15, -6], o: [-2.84, -7.36] }],
  Yamato460: [
    { chid: 167, n: 'canon4', m: [0.965179, 0.002197, -0.002136, 0.645447, 4.4, -14.85], o: [-7.58, -38.13] },
    { chid: 167, n: 'canon1', m: [0.965179, 0.002197, -0.002136, 0.645447, -4.2, -15], o: [-7.58, -38.13] },
    { chid: 167, n: 'canon2', m: [0.965179, 0.002197, -0.002136, 0.645447, -9.2, -15], o: [-7.58, -38.13] },
    { chid: 167, n: 'canon3', m: [0.965179, 0.002197, -0.002136, 0.645447, 9.95, -15], o: [-7.58, -38.13] }],
};
// (旧 ETURRET_PARTS 手工拼装表已删除; 现用 173 库整帧 + TURRET_GUNS 炮管叠加)
// 炮管 sprite 开火帧序列 —— 像素实测 (deobf/turret_layout.py 给出 "fire" 标签帧号,
// 再用 alpha>40 逐帧内容量确定实际可见段)。Flash 语义: canonN.gotoAndPlay("fire") 从
// fire 标签帧顺序播到末尾。本表只保留【有内容】的帧 (全空帧播了也看不见, 跳过)。
// 修正记录: 上一轮把 80/161 误判为"无开火帧"(只看了从帧2起的连续段, 漏掉后段真正的开火),
//           且漏了 83 (MTHEL 激光)。本轮按 fire 标签+内容量重测, 全部补齐。
const GUN_FIRE_SEQ = {
  80:  [148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186],
  83:  [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
  92:  [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
  98:  [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
  103: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
  108: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
  122: [2,3,4,5,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91],
  125: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35],
  128: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157],
  153: [2,3],
  157: [],
  160: [],
  161: [30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46],
  164: [2,3,4,5,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91],
  167: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35],
};
// 每个武器的开火动画时长 (帧) —— 按【武器名】索引 (上一轮曾误按 chid 查表导致 fireT 恒为 0,
// 开火动画永不播放)。时长 = 该武器所有 named 炮管里最长的 fire 序列长度。
const FIRE_TICKS = {};
function fireTicksFor(id) {
  if (id in FIRE_TICKS) return FIRE_TICKS[id];
  let n = 0;
  const guns = (typeof TURRET_GUNS !== 'undefined' && TURRET_GUNS[id]) || [];
  for (const g of guns) n = Math.max(n, (GUN_FIRE_SEQ[g.chid] || []).length);
  FIRE_TICKS[id] = n;
  return n;
}
// ---------------- 炮管开火叠加 (原版 canonN.gotoAndPlay("fire")) ----------------
const GUN_SPR_IMG = {};
function gunSprImg(chid, frame) {
  const k = chid + '/' + frame;
  if (!GUN_SPR_IMG[k]) {
    const im = new Image();
    im.src = 'assets/eturrets_spr/DefineSprite_' + chid + '/' + frame + '.png';
    GUN_SPR_IMG[k] = im;
  }
  return GUN_SPR_IMG[k];
}
// 在武器局部坐标系内画所有 named 炮管 (开火时播 fire 序列帧)
// 调用方需已 translate 到武器位置并 rotate 到朝向后
function drawTurretGuns(id, fireT) {
  const guns = TURRET_GUNS[id];
  if (!guns) return;
  for (const g of guns) {
    const s = GUN_FIRE_SEQ[g.chid];
    let f = 1;
    if (fireT > 0 && s && s.length) {
      const idx = s.length - fireT;
      if (idx >= 0 && idx < s.length) f = s[idx];
    }
    const im = gunSprImg(g.chid, f);
    if (!(im.complete && im.naturalWidth)) continue;
    const [a, b, c, d, tx, ty] = g.m;
    ctx.save();
    ctx.transform(a, b, c, d, tx, ty);
    ctx.drawImage(im, g.o[0], g.o[1]);
    ctx.restore();
  }
}
// ---------------- 持续 idle 自转部件 (原版 onClipEvent(enterFrame)) ----------------
// 在武器局部坐标系内画随帧持续自转的子 sprite (雷达天线/导弹发射架)。
// ⚠ 这两个子件(115/121)带 HasClipActions, 是**独立 MovieClip**, 各自 onClipEvent(enterFrame)
//   逐帧累加 _rotation。FFDec 导出 173 整帧时把它们**烘平成了静态姿态**
//   (实测: f7 碟盘区域 623 像素与 115 缩放后 100% 重合) → 故叠加自转件会覆盖那处静态件,
//   位置一致(见下), 观感即"天线在转"。
// 变换: placement 的 t=(tx,ty) 是子 MC 原点在武器局部系的位置; origin 是子 MC 画布左上角
//   在其自身局部系的坐标(未缩放)。故: translate(t) 后用 drawImage 的 w/h 参数缩放,
//   而**不能**先 ctx.scale 再画 origin (会把 origin 也乘一次缩放 → 位置错位)。
// 画一个自转子件 (给定 spin 定义与当前角度); 调用方需已定位到武器原点并 rotate 到朝向
function drawSpinDef(sd, spinDeg) {
  const im = idleSprImg(sd.chid);
  if (!(im && im.complete && im.naturalWidth)) return;
  const o = IDLE_SPR_ORIGIN[sd.chid];
  const [tx, ty] = sd.t;
  const s = sd.scale;
  ctx.save();
  ctx.translate(tx, ty);                                  // 移到子 MC 原点
  ctx.rotate(spinDeg * Math.PI / 180);                    // 自转 (绕子 MC 原点)
  ctx.drawImage(im, o.x * s, o.y * s, im.naturalWidth * s, im.naturalHeight * s);
  ctx.restore();
}
function drawIdleSpin(id, spinDeg) {
  const sd = IDLE_SPIN[id];
  if (sd) drawSpinDef(sd, spinDeg);
}
// A 类: 整帧即自转件 (radar) —— 绕 placement 的 t 旋转整帧
function drawLibSpin(id) {
  const ls = LIB_SPIN[id];
  if (!ls) return;
  const im = turretLibImg(id);
  if (!(im && im.complete && im.naturalWidth)) return;
  const [tx, ty] = ls.t;
  const deg = (G.frame * ls.degPerSWFFrame * (24 / 30)) % 360;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(deg * Math.PI / 180);
  // 该帧画布原点已知 (TURRET_LIB_ORIGIN); 平移项已单独处理, 故按 画布原点 - t 偏移回画
  ctx.drawImage(im, TURRET_LIB_ORIGIN.x - tx, TURRET_LIB_ORIGIN.y - ty);
  ctx.restore();
}
// A 类特例: radarMobile 整帧含两个反向自转的 115 → 逐件各转各的
function drawRadarMobileSpin() {
  for (const sd of RADARMOBILE_SPIN) {
    drawSpinDef(sd, (G.frame * sd.degPerSWFFrame * (24 / 30)) % 360);
  }
}
// ---------------- 自动修理蓝色磁场 (原版 sprite 183, 挂在 structure 的 repairLogo.light) ----------------
// 反编译依据:
//   frame_6/PlaceObject2_6_327 伤害循环: if (unitsAlliees[i].repairLogo.autoRepair) structures[i].structureDeco.autoRepair()
//   DefineSprite_185/frame_2/PlaceObject2_6_31 autoRepair(): etat=etatMax; repairLogo.light.gotoAndPlay(1); light2.gotoAndPlay(1)
//   sprite 183 = 7 帧 (shape 77→179→180→181→182→空), 307×307, 24fps → ≈0.29s
//   PlaceObject3 light: chid=183, CXFORM mult=[0,0,0,256] add=[153,204,255,0] → 纯 #99CCFF
//   sprite184 内 scale=0.0554 t=(-170,-170); structure185 内 scale=2.079 → 净直径 ≈ 35px, 居中塔身
const MAGNET_FRAMES = [1,2,3,4,5,6,7].map(i => {
  const im = new Image();
  im.src = 'assets/repair/light_' + i + '.png';
  return im;
});
const MAGNET_FPS = 24;               // SWF 帧率
const MAGNET_DIAM = 35;              // 净显示直径 (世界像素)
// 7 帧 @24fps ≈ 0.292s; H5 主循环 30fps → 折算 9 帧, 视觉时长与原版一致
const MAGNET_TICKS = Math.round(MAGNET_FRAMES.length / MAGNET_FPS * 30);
const EXPLOSION_FRAMES = [1, 2, 3, 4].map(i => {
  const im = new Image();
  im.src = 'assets/explosion/' + i + '.png';
  return im;
});
// ---------------- Su37 空袭 (原版 DefineSprite_834 on(press) 逻辑) ----------------
// 反编译依据 (deobf/scripts/DefineSprite_834/frame_1/PlaceObject2_785_17 + 793_23):
//   disponible=false 时播 cannot 音并拒绝; 否则按 4 边随机选进入边 (bas/gauch/droit/haut),
//   进入点: bas=(rand*2200, 600) haut=(rand*2200, -1600) gauche=(-100, rand*2200) droit=(2100, rand*2200)
//   机头朝点击点 (zone = 鼠标位置), 播 Su37S 音效, disponible=false 并启动冷却
//   冷却 = comptDispo=60 次 chargeBombes 调用 (原版 setInterval 43ms → ≈2.6s/次 → ~2.6s 总计)
//   弹体属性 (793_23 load): speed=28, puissance=500, impact=260
const SU37 = {
  img: null,
  available: true,
  cool: 0,          // 剩余冷却帧 (原版 comptDispo)
  COOL_FRAMES: 60,  // 原版 comptDispo 初值
  pending: false,   // 已选边待点击落点
  plane: null,      // 飞行中的飞机 {x,y,rot,side,tx,ty,phase}
  SPEED: 28 * 0.45, // 原版 speed=28 (每帧) → H5 tick 折算
  POWER: 500,       // 原版 puissance
  IMPACT: 260,      // 原版 impact (溅射范围)
  SCALE: 0.4946,    // 原版 PlaceObject2 矩阵 scaleX/Y (SWF 二进制权威解码)
};
const SU37_IMG_SRC = 'assets/su37/DefineSprite_793/1.png';
// ---------------- Su37 瞄准区标记 (原版 zoneBombardement chid 785) ----------------
// 权威依据: deobf/data/dump_tree.json line 956 name="zoneBombardement" chid="785" dpt="17"
// FFDec SVG 导出: 154.3x154.3 画布, 内容在 sprite 局部 (-77.15,-77.15)..(77.15,77.15)
//   779 半透明绿底 + 780/781 白色框 + 782 文本 "ready" + 784 4 角准星 + 中心十字
// 原版行为: Su37 选边 (su37Start) 后 zoneBombardement._visible=true 并跟随鼠标;
//          点击地图后置 false, 飞机从所选边飞入。
const ZONE_IMG_SRC = 'assets/zone/1.png';
const ZONE_IMG = new Image();
ZONE_IMG.src = ZONE_IMG_SRC;
const ZONE_ORIGIN = { x: -77.15, y: -77.15 };   // 154.3/2, 画布左上角 → 中心
function su37Img() {
  if (!SU37.img) { SU37.img = new Image(); SU37.img.src = SU37_IMG_SRC; }
  return SU37.img;
}
function su37Start() {   // 侧栏按钮: 选进入边, 等待玩家点击地图落点
  if (!G.unlocker.su37) { playSfx('cannot', 0.4); return false; }   // 原版 m31 才解锁
  if (!SU37.available) { playSfx('cannot', 0.4); return false; }
  const rd = Math.random();
  const side = rd < 0.25 ? 'bas' : rd < 0.5 ? 'gauche' : rd < 0.75 ? 'droit' : 'haut';
  let x, y;
  if (side === 'haut' || side === 'bas') {
    x = Math.random() * 2200;
    y = side === 'bas' ? 600 : -1600;
  } else {
    y = Math.random() * 2200 - 800;   // 原版对 gauche/droit 用 rand*2200 (世界 y 范围)
    x = side === 'gauche' ? -100 : 2100;
  }
  SU37.pending = { side, x, y };
  G.su37Aiming = true;
  playSfx('selectionUnite', 0.35);
  return true;
}
function su37Launch(tx, ty) {   // 玩家点击地图落点 → 起飞
  if (!SU37.pending) return;
  const p = SU37.pending;
  const rot = Math.atan2(ty - p.y, tx - p.x);
  SU37.plane = { x: p.x, y: p.y, rot, tx, ty, dropped: false };
  SU37.pending = null; G.su37Aiming = false;
  playSfx('Su37', 0.55);       // 原版 master_sounds.Su37S.start()
  SU37.available = false;
  SU37.cool = SU37.COOL_FRAMES;
}
function su37Update() {
  if (!SU37.available && SU37.cool > 0) {
    if (--SU37.cool === 0) SU37.available = true;
  }
  const p = SU37.plane;
  if (!p) return;
  const dx = p.tx - p.x, dy = p.ty - p.y;
  const d = Math.hypot(dx, dy);
  const turn = Math.min(Math.abs(0) , 0);
  p.rot = Math.atan2(dy, dx);
  if (d < SU37.SPEED) {
    // 抵达目标 → 投弹 (原版 793_23: 到达 zone 后引爆, impact=260 溅射)
    if (!p.dropped) {
      p.dropped = true;
      boomTyped(p.tx, p.ty, 40, 'large');
      playSfx('explosionLarge', 0.6);
      for (const u of G.units) {
        if (u.hp <= 0) continue;
        const dd = Math.hypot(u.x - p.tx, u.y - p.ty);
        if (dd <= SU37.IMPACT) u.hp -= SU37.POWER * (dd <= SU37.IMPACT / 3 ? 1 : 0.5);
      }
      for (const u of G.units) killUnit(u);
    }
    SU37.plane = null;   // 投弹后离场
    return;
  }
  p.x += dx / d * SU37.SPEED;
  p.y += dy / d * SU37.SPEED;
}
function su37Draw() {
  const p = SU37.plane;
  if (!p) return;
  const sx = w2sX(p.x), sy = w2sY(p.y);
  const im = su37Img();
  const s = SU37.SCALE * zoom;   // 原版 PlaceObject2 矩阵 scaleX/Y=0.4946 (SWF 权威解码)
  if (im.complete && im.naturalWidth) {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot + Math.PI / 2); ctx.scale(s, s);
    ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
    ctx.restore();
  } else {
    ctx.fillStyle = '#8cf'; ctx.beginPath(); ctx.arc(sx, sy, 8 * zoom, 0, 7); ctx.fill();
  }
}

// ---------------- 音乐 (原版 1151 面板机制: 手动选曲 changeMusic + playMusic/pauseMusic) ----------------
const BGM_FILES = ['bgm_main.mp3', 'bgm2.mp3', 'bgm3.mp3'];
// 曲名 = 原版 1151 音乐面板按钮显示文本 (反编译权威):
//   PlaceObject2_1145_5 → "Act of instinct" (changeMusic 0)
//   PlaceObject2_1145_8 → "Hell march"       (changeMusic 1)
//   PlaceObject2_1145_11 → "Just do it up"   (changeMusic 2)
// 与 6_430 的 musics[0..2].attachSound("actOfInstinct"/"hellMarch"/"justDoItUp") 索引一致
const BGM_NAMES = ['Act of instinct', 'Hell march', 'Just do it up'];
let bgmAudio = null, imusic = 0, positionmusic = 0, isPause = true, bgmMuted = false;
function playMusic() {                    // 原版 playMusic: 从 positionmusic 恢复
  try {
    if (!bgmAudio) bgmAudio = new Audio();
    if (!bgmAudio.src.endsWith(BGM_FILES[imusic])) bgmAudio.src = 'assets/music/' + BGM_FILES[imusic];
    bgmAudio.currentTime = positionmusic;
    bgmAudio.volume = 0.5;
    bgmAudio.onended = () => {            // 原版 onSoundComplete=nextMusic
      imusic = imusic === 2 ? 0 : imusic + 1;
      positionmusic = 0;
      playMusic();
      refreshMusicPanel();
    };
    bgmAudio.play().catch(() => {});
    isPause = false;
  } catch (e) {}
}
function pauseMusic() {                   // 原版 pauseMusic: 记录进度并停止
  try {
    if (!bgmAudio) return;
    positionmusic = bgmAudio.currentTime;
    bgmAudio.pause();
    isPause = true;
  } catch (e) {}
}
function changeMusic(im) {                // 原版 changeMusic: 换曲并立即播放
  pauseMusic();
  positionmusic = 0;
  imusic = im;
  playMusic();
  refreshMusicPanel();
}
function refreshMusicPanel() {            // 音乐面板按钮状态
  for (let i = 0; i < 3; i++) {
    const b = document.getElementById('m' + i);
    if (b) {
      b.classList.toggle('on', i === imusic && !isPause);
      b.textContent = BGM_NAMES[i];   // 原版 1151 按钮显示曲名
    }
  }
  const pp = document.getElementById('mPlay');
  if (pp) pp.textContent = isPause ? '▶ 播放' : '⏸ 播放中';
}
function wireMusicPanel() {               // 原版 1151 面板按钮
  for (let i = 0; i < 3; i++) {
    const b = document.getElementById('m' + i);
    if (b) b.onclick = () => changeMusic(i);
  }
  const pp = document.getElementById('mPlay');
  if (pp) pp.onclick = () => { if (isPause) playMusic(); else pauseMusic(); refreshMusicPanel(); };
  const pa = document.getElementById('mPause');
  if (pa) pa.onclick = () => pauseMusic();
  const mu = document.getElementById('mMute');
  if (mu) mu.onclick = () => { bgmMuted = !bgmMuted; if (bgmAudio) bgmAudio.muted = bgmMuted;
                               mu.textContent = bgmMuted ? '🔇 已静音' : '🔇'; };
  refreshMusicPanel();
}
wireMusicPanel();

// ---------------- 游戏状态 ----------------

// ---------------- 音效 (原版 soundsFx; 轮换池避免重叠切断) ----------------
// 建造区判定: 原版用 carte.surfaceForBuild(768) 的 shape hitTest
//   (DefineSprite_834/frame_1/PlaceObject2_822_226 on(press):
//    `if (surfaceForBuild.hitTest(x,y,true)) {...允许建...}`)
// 【未完成】尝试用 768 遮罩位图复现该判定失败: 遮罩 1838x1730 的几何基准无法用
//   世界坐标 + PlaceObject2 矩阵(translate 166.1,391.5) 对齐 (多种变换组合均不吻合,
//   见 PROGRESS 记录)。故仍用道路缓冲近似作为可建判定 (逻辑正确、与遮罩意图一致)
function buildAllowedAt(wx, wy) {
  for (const t of G.turrets)
    if (Math.hypot(t.x - wx, t.y - wy) < 26) return false;
  return !roadBlocked(wx, wy);
}

// 建造预览光标 (原版 carte.viseurConstruction, chid 822, 3 帧):
//   帧1 浅灰绿 = 可建; 帧2 粉红 = hover; 帧3 深红 = 已建/不可建 (代码 gotoAndStop("red"))
const CURSOR_FRAMES = [1, 2, 3].map(i => {
  const im = new Image();
  im.src = 'assets/build_ui/DefineSprite_822/' + i + '.png';
  return im;
});
// 取消提示条 (原版 carte.cancelhint, chid 1161, 2 帧):
//   帧1 = 建造中 (提示可取消), 帧2 = 无建造 (隐藏) —— 原版 enterFrame:
//   `if (viseurConstruction) cancelhint.gotoAndStop(2) else cancelhint.gotoAndStop(1)`
const CANCEL_HINT = [1, 2].map(i => {
  const im = new Image();
  im.src = 'assets/build_ui/DefineSprite_1161/' + i + '.png';
  return im;
});

// 建造区判定: 原版用 carte.surfaceForBuild(768) 的 shape hitTest
//   (DefineSprite_834/frame_1/PlaceObject2_822_226 on(press):
//    `if (surfaceForBuild.hitTest(x,y,true)) {...允许建...}`)
// 【未完成·如实记录, 见 PROGRESS 第 N+12 轮】尝试用 768 遮罩位图(1838x1730)复现该判定:
//   已穷尽: 结构解码(767 bounds 1838x1730) + SVG transform 权威值(322.9,1803.45)
//   + 离线穷举 17 种坐标组合 + 图像互相关对齐(最优 offset 时 mask 内 94% 为草地)。
//   但全部方案下"路点上仍有 16-28% 被判可建"(理想 0%) → 说明遮罩语义不是"道路禁建",
//   而是更细的"可建平地"(含地形/建筑等多重限制), 无法用路点距离或草地图层近似复现。
//   → H5 保留 45px 道路缓冲近似 (行为与遮罩意图一致: 道路上不可建), 属设计取舍, 非还原完成。
function roadBlocked(wx, wy) {
  for (const rn in ROUTES) {
    const r = ROUTES[rn];
    for (let i = 0; i < r.length - 1; i++) {
      const ax = r[i][0], ay = r[i][1], bx = r[i+1][0], by = r[i+1][1];
      const L2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
      let t2 = ((wx - ax) * (bx - ax) + (wy - ay) * (by - ay)) / L2;
      t2 = Math.max(0, Math.min(1, t2));
      if (Math.hypot(wx - (ax + (bx - ax) * t2), wy - (ay + (by - ay) * t2)) < 45) return true;
    }
  }
  return false;
}
// 完整可建判定 (原版 822_226 on(press)): 不与已有塔重叠 + 非道路
function buildAllowedAt(wx, wy) {
  for (const t of G.turrets)
    if (Math.hypot(t.x - wx, t.y - wy) < 26) return false;
  return !roadBlocked(wx, wy);
}

// 修理面板 (原版 819 barreReparation = 814 base(236x21) + 813 repairPrice(EditText) + 818 autor + 184 repairLogo)
// 注意: FFDec 把 814/818 里 EditText 的示例文字("repair for 1000000$")烧进了导出位图, 不可直接用;
// 已从 814 采样权威配色: 边框纯黑 + 填充 RGB(0,102,152); 818 autor 为黑底。H5 按此配色 + 原版布局自绘
const BAR_FILL = '#006698', BAR_BORDER = '#000';
// 修理费公式 (原版 819 refresh() 权威): round(2 * (etatMax - etat)) = 2 $/HP
//   注: pcode 里 r3=(r3/2); r3=(r3/r5); 是混淆死代码, 随后 `r3 = 2` 直接覆盖
function repairPrice(t) {
  if (t.hp >= t.maxHp) return 0;
  return REPAIR_COST * (t.maxHp - t.hp);
}
function repairIfCan(t) {
  const price = repairPrice(t);
  if (price <= 0) return false;
  if (G.euros < price) { playSfx('cannot', 0.4); return false; }
  G.euros -= price; t.hp = t.maxHp;
  playSfx('selectionUnite', 0.4);
  return true;
}
function swithRepair(t) { t.autoRepair = !t.autoRepair; }

// 修理费公式 (原版 819 refresh() 权威): round(2 * (etatMax - etat)) = 2 $/HP
//   注: pcode 里 r3=(r3/2); r3=(r3/r5); 是混淆死代码, 随后 `r3 = 2` 直接覆盖,
//   最终 r3 = round(2 * (maxHP - curHP))。H5 的 REPAIR_COST=2 与之完全一致
function repairPrice(t) {
  if (t.hp >= t.maxHp) return 0;
  return REPAIR_COST * (t.maxHp - t.hp);
}
function repairIfCan(t) {
  if (G.euros < REPAIR_COST) { playSfx('cannot', 0.4); return false; }
  t.hp = t.maxHp;
  playSfx('selectionUnite', 0.4);
  return true;
}
function swithRepair(t) { t.autoRepair = !t.autoRepair; }

const SFX_FILES = {
  boutonScroll: '450_boutonScroll.mp3', creationUnite: '452_creationUnite.mp3',
  selectionUnite: '471_selectionUnite.mp3', cannot: '451_cannot.mp3',
  m60: '464_m60.wav', gatling: '463_gatling.mp3', c75mm: '446_c75mm.mp3',
  c105mm1: '447_c105mm1.mp3', c105mm2: '448_c105mm2.mp3', c125mm: '449_c125mm.mp3',
  crotale: '453_crotale.mp3', mlrs: '465_mlrs.mp3',
  explosion1: '454_explosion1.mp3', explosion2: '455_explosion2.mp3',
  explosion3: '456_explosion3.mp3', explosion4: '457_explosion4.wav',
  explosion5: '458_explosion5.mp3', explosion6: '459_explosion6.mp3',
  explosionLarge: '461_explosionLarge.mp3', explosionMlrs: '462_explosionMlrs.mp3',
  explosionCrotale: '460_explosionCrotale.mp3',
  ricochet1: '467_ricochet1.mp3', ricochet2: '468_ricochet2.mp3',
  ricochet3: '469_ricochet3.mp3', ricochet4: '470_ricochet4.mp3',
  metal1: '481_metal1.mp3', metal2: '482_metal2.mp3',
  // 车辆行进音 (原版 428_unit 的 roule(): 按底盘类型随机播)
  uniteMoveLight1: '476_uniteMoveLight1.mp3', uniteMoveLight2: '477_uniteMoveLight2.mp3',
  uniteMoveLight3: '478_uniteMoveLight3.mp3', uniteMoveLight4: '479_uniteMoveLight4.mp3',
  uniteMoveHeavy1: '473_uniteMoveHeavy1.mp3', uniteMoveHeavy2: '474_uniteMoveHeavy2.mp3',
  uniteMoveHeavy3: '475_uniteMoveHeavy3.mp3', uniteMoveTigre1: '480_uniteMoveTigre1.wav',
  // 环境鸟叫 b01-b17 (原版 playBirds: setInterval 10000ms 随机播 BSounds[1..17])
  b01: '429_b01.mp3', b02: '430_b02.mp3', b03: '431_b03.mp3', b04: '432_b04.mp3',
  b05: '433_b05.mp3', b06: '434_b06.mp3', b07: '435_b07.mp3', b08: '436_b08.mp3',
  b09: '437_b09.mp3', b10: '438_b10.mp3', b11: '439_b11.mp3', b12: '440_b12.wav',
  b13: '441_b13.mp3', b14: '442_b14.mp3', b15: '443_b15.mp3', b16: '444_b16.mp3',
  b17: '445_b17.mp3',
  Su37: '472_Su37.wav',
};
const SFX_POOL = {};
function playSfx(name, vol = 0.4) {
  try {
    if (!SFX_POOL[name]) {
      SFX_POOL[name] = [0, 1, 2].map(() => {
        const a = new Audio('assets/sounds/' + SFX_FILES[name]);
        a.volume = vol;
        return a;
      });
      SFX_POOL[name]._i = 0;
    }
    const pool = SFX_POOL[name];
    pool._i = (pool._i + 1) % pool.length;
    const a = pool[pool._i];
    a.currentTime = 0;
    a.volume = vol;
    a.play().catch(() => {});
  } catch (e) { /* 无头环境 */ }
}
function weaponSfx(turretId) {
  const map = { m60:'m60', gatling:'gatling', canon75:'c75mm', canon105:'c105mm1',
    canon105D:'c105mm2', canon125:'c125mm', crotale:'crotale', MLRS:'mlrs' };
  if (map[turretId]) playSfx(map[turretId], 0.25);
}
function explosionSfx(power) {
  if (power >= 200) playSfx('explosionLarge', 0.5);
  else if (power >= 100) playSfx('explosionMlrs', 0.45);
  else playSfx('explosion' + (1 + Math.floor(Math.random() * 3)), 0.4);
}
// 普通弹命中附加音 (原版 DefineSprite_390 frame_2 DoAction 权威概率):
//   Math.random() > 0.85 → ricochet1-4 (15%)  |  Math.random() > 0.7 → metal1-2 (30%)
function impactSfx() {
  if (Math.random() > 0.85) playSfx('ricochet' + (1 + Math.floor(Math.random() * 4)), 0.35);
  if (Math.random() > 0.7) playSfx('metal' + (1 + Math.floor(Math.random() * 2)), 0.35);
}
// 车辆行进音 (原版 428_unit 的 roule() 权威逻辑):
//   默认 r5="Light" (camion1/2/3, jeep, bradley, amx10, abrams, camionBlinde)
//   chassis=="t90" → "Heavy";  chassis=="tigre" → "Tigre"
//   chassis==navire(u228Wu132) / Yamato($u180\x17u147) → "null" (无音效)
//   随机选: Math.floor(Math.random() * n) + 1
// H5 按 30fps 节流到每 12 帧一次且仅视野内 (原版每次 roule 都播, 直接照搬会音效轰炸)
const MOVE_SFX = {
  Light: { pre: 'uniteMoveLight', n: 4 },
  Heavy: { pre: 'uniteMoveHeavy', n: 3 },
  Tigre: { pre: 'uniteMoveTigre', n: 1 },
};
const MOVE_FAMILY = { t90: 'Heavy', tigre: 'Tigre', navire: null, Yamato: null };
function rouleSfx(chassis) {
  const fam = chassis in MOVE_FAMILY ? MOVE_FAMILY[chassis] : 'Light';
  if (!fam) return;   // navire/Yamato 原版为 "null" 族
  const m = MOVE_SFX[fam];
  playSfx(m.pre + (1 + Math.floor(Math.random() * m.n)), 0.16);
}
// 环境鸟叫 (原版 6_430 playBirds: setInterval(this,"playBirds",10000)):
//   Math.floor(Math.random() * 17) + 1 → BSounds[1..17] 随机播一个
//   原版在 enScenario / aPerdu / edithBool 三个条件下跳过; H5 对应: 剧情模式(无)/已失败/静音
let lastBirdAt = 0;
function playBirds(now) {
  if (G.lost || G.won) return;       // 原版 aPerdu 时不播
  if (bgmMuted) return;              // 原版 edithBool (降音量模式) 时不播
  if (now - lastBirdAt < 10000) return;   // 原版 setInterval 10000ms
  lastBirdAt = now;
  playSfx('b' + String(1 + Math.floor(Math.random() * 17)).padStart(2, '0'), 0.12);
}
// 命中音 (权威源: DefineSprite_400_obus 帧库结构 → 内层精灵 frame_2 DoAction):
//   弹体精灵: 301(obusLeger)/307(obusMoyen) → explosion1;  361(obusLourd) → explosion2
//   导弹帧内嵌爆炸精灵: missile/missileUnder → 392(explosionCrotale), missile2 → 394(explosionMlrs),
//                       missile3 → 395(explosionLarge), missileUnderSu37 → 396(explosionLarge)
//   曳光弹帧 bullet/bulletLourde → 390 (无自带音, frame_2 = 0.85 阈值 ricochet + 0.7 阈值 metal)
// 结论: 爆炸音随"弹体精灵"而非武器 ID 决定, 与 H5 的 SHELL_KIND 一一对应
const SHELL_SFX = {
  obusLeger:  { boom: 'explosion1' },
  obusMoyen:  { boom: 'explosion1' },
  obusLourd:  { boom: 'explosion2' },
  bullet:     { boom: null },            // 390: 只播弹道金属音
  bulletLourde: { boom: null },
  missile:    { boom: 'explosionCrotale' },
  missile2:   { boom: 'explosionMlrs' },
  missile3:   { boom: 'explosionLarge' },
  missileUnder: { boom: 'explosionCrotale' },
};
function shellImpactSfx(shellKind) {
  const e = SHELL_SFX[shellKind] || SHELL_SFX.bullet;
  if (e.boom) playSfx(e.boom, 0.45);
  else impactSfx();   // 曳光弹: 原版 sprite 390 的 ricochet/metal 概率音
}
// 波次来袭横幅
let banner = null;   // {text, until}
function showBanner(text) { banner = { text, until: Date.now() + 3200 }; }

// ---------------- 游戏状态 ----------------
const G = {
  euros: 850, interest: 6, score: 0,
  wave: 0,                 // 已开始的波数 (1..44)
  units: [], turrets: [], shells: [], effects: [], sparks: [],
  spawnQueue: [],          // 本波待生成 [unitType, weapon, route, delayTicks]
  spawnTimer: 0,
  waveActive: false, interWave: 120,
  lost: false, won: false, losses: 0,
  shopSel: 'm60', placing: null,
  showHp: true,            // 原版 H 键开关
  mouseScroll: true,       // 原版 M 键开关 (鼠标边缘滚屏)
  showBuildArea: false,    // 原版 C 键开关 (可建区域显示)
  frame: 0,               // 帧计数 (炮弹动画)
  su37Aiming: false,      // Su37 已选边, 等待玩家点击落点
  // ---- 原版解锁状态 (frame_6/PlaceObject2_6_333 onClipEvent(load)) ----
  unlocker: { m60: true, gatling: true, canon75: false, canon105: false, canon105D: false,
              radar: false, crotale: false, canon125: false, MLRS: false,
              pluton: false, MTHEL: false, su37: false },
  iUnlock: 0,              // 已通过二选一解锁的件数 (0..5)
  lockItem: true,          // 面板期间锁住, 防连点 (on(press) 里 lockItem 守卫)
  panelOpen: false,        // 二选一面板已弹出, 冻结波次调度
};

// ---------------- 单位 ----------------
class Unit {
  constructor(type, weaponId, route) {
    const c = CHASSIS[type];
    this.type = type;
    this.route = ROUTES[route] || ROUTES.parcourt1;
    this.pt = 0;                              // 当前路点
    this.x = this.route[0][0]; this.y = this.route[0][1];
    this.rot = 0;
    // 原版: 速度 = chassis[0] × fpsc; 此处 tick 制, ×2.2 平衡
    this.speed = c[0] * 0.45;
    this.rotateSpeed = c[2] * 0.09;
    this.hp = this.maxHp = c[3];
    this.bounty = c[4];
    this.aa = (type === 'tigre');             // 直升机
    this.weapon = weaponId !== 'null' ? WEAPONS[weaponId] : null;
    this.weaponId = weaponId;
    this.cool = 0;
    this.fireT = 0;        // 敌方炮管开火帧计时
    this.dead = false;
    this.reached = false;
    // 阵亡序列 (原版 428 unit 的 "destruction" 标签, 39 帧; 由 unitEtat.destruction() 触发)
    //   权威依据 deobf/scripts/DefineSprite_428_unit/frame_1/PlaceObject2_178_etat_22 onClipEvent(load):
    //     destruction(): removeClip(ptRadar/etatJauge/ombre); tourelle.play(); _parent.gotoAndPlay("destruction")
    //   428 的 destruction 段: 车辆原地滞留, 车体每帧微漂 (SVG 实测 chassis ty 从 -155.05 → -167.05, 共 12px),
    //   并在帧 2/4/7 各创建一次 createExplosion(markFlame 世界坐标) —— 即"车体三点爆炸";
    //   frame_39 的 DoAction: removeMovieClip(this) —— 序列结束才真正移除。
    //   39 帧 @24fps → H5 30fps = 31 tick
    this.dying = 0;        // >0 表示正在播阵亡序列 (剩余 tick)
    this.dyingFired = 0;   // 已触发的爆炸点数 (0..3, 对应原版帧 2/4/7)
  }
  update() {
    // 阵亡序列播放中: 车辆原地滞留 + 车体漂移, 不再行进/开火 (原版 gotoAndPlay("destruction") 后
    // enterFrame 的行进/索敌逻辑不再作用于该单位; 漂移由 destruction 段自身的矩阵逐帧给出)
    // 注: 必须放在 hp<=0 判断之前 —— 阵亡单位的 hp 已 <=0, 但序列仍要推进
    if (this.dying > 0) {
      this.dying--;
      const p = (DEATH_TICKS - this.dying) / DEATH_TICKS;
      this.drift = DEATH_DRIFT * p;
      while (this.dyingFired < 3 &&
             (DEATH_TICKS - this.dying) >= DEATH_BOOM_TICKS[this.dyingFired]) {
        // 车体三点爆炸 (原版 createExplosion: 同时挂 explosion(chid279) + flame(chid637),
        // 各带 ±10px 抖动; 两者都按原生尺寸摆放 —— 原版只设 _x/_y, 不设 _xscale/_yscale)
        const jx = Math.random() * 20 - 10, jy = Math.random() * 20 - 10;
        const ex = this.x + jx, ey = this.y + jy;
        G.effects.push({ x: ex, y: ey, type: 'death',
                         life: DEATH_BOOM_TICKS_LOCAL, life0: DEATH_BOOM_TICKS_LOCAL });
        G.effects.push({ x: ex, y: ey, type: 'flame',
                         life: DEATH_FLAME_TICKS, life0: DEATH_FLAME_TICKS });
        this.dyingFired++;
      }
      if (this.dying === 0) this.dead = true;
      return;
    }
    if (this.hp <= 0) return;
    const [tx, ty] = this.route[this.pt];
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    const want = Math.atan2(dy, dx);
    let da = want - this.rot;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const turn = Math.min(Math.abs(da), this.rotateSpeed);
    this.rot += Math.sign(da) * turn;
    this.x += Math.cos(this.rot) * this.speed;
    this.y += Math.sin(this.rot) * this.speed;
    // 行进音 (原版 roule(): 按底盘随机播车体音; 节流到每 12 帧, 且仅在视野内)
    if (G.frame % 12 === 0 && isVisible(this.x, this.y)) rouleSfx(this.type);
    if (d < Math.max(12, this.speed * 5)) {
      this.pt++;
      if (this.pt >= this.route.length) this.reached = true;
    }
    // 敌方武器开火 (打我方炮塔)
    if (this.weapon) {
      this.cool--;
      if (this.fireT > 0) this.fireT--;
      if (this.cool <= 0) {
        const t = nearestTurret(this.x, this.y, this.weapon[1]);
        if (t) {
          this.cool = this.weapon[2] * 3;
          this.fireT = fireTicksFor(this.weaponId);
          spawnShell(this.x, this.y, t, this.weapon, 'ennemy');
        }
      }
    }
  }
}

function nearestTurret(x, y, range) {
  let best = null, bd = range;
  for (const t of G.turrets) {
    if (t.hp <= 0) continue;   // 已摧毁的塔不再被索敌 (含阵亡序列播放中)
    const d = Math.hypot(t.x - x, t.y - y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

// ---------------- 炮塔 ----------------
class Turret {
  constructor(id, x, y) {
    this.id = id;
    const s = STRUCTURES[id];
    this.cost = s.cost; this.costUp = s.costUpgraded;
    this.x = x; this.y = y;
    this.hp = this.maxHp = {m60:80,gatling:120,canon75:220,canon105:280,canon105D:300,
      canon125:240,crotale:220,radar:220,MLRS:320,pluton:600,MTHEL:300}[id] || 200;
    this.w = WEAPONS[id];
    this.rot = -Math.PI / 2;
    this.cool = 0;
    this.fireT = 0;        // 炮管开火帧计时 (>0 时切到 fire 序列)
    this.target = null;
    this.autoRepair = false;
    this.magnetT = 0;      // 蓝色磁场剩余帧 (原版 repairLogo.light.gotoAndPlay(1), 7 帧)
    this.aa = AA_WEAPONS.includes(id);   // 机枪/导弹天生对空; 其余可付费升级
    // 阵亡序列 (原版 185 structure 的 "destruction" 标签, 39 帧, 与单位 428 同构)
    //   权威依据 deobf/scripts/DefineSprite_185_structure/frame_1/PlaceObject2_178_etat_26 onClipEvent(load):
    //     与 428 完全相同的 destruction(): removeClip(ptRadar/etatJauge/ombre) + gotoAndPlay("destruction")
    //   185 destruction 段 (逐帧 SVG 实测): 86 结构层【保持原位不动】(t 恒为 -38.25,-35.60),
    //     帧 2/4/7 各放一个 chid 6 (markFlame) → 触发 createExplosion; 帧 39 removeMovieClip(this)
    //   → 与单位不同: 塔没有"车体漂移", 但同样的三点爆炸
    this.dying = 0;
    this.dyingFired = 0;
  }
  aaUpgradeCost() { return Math.floor(this.cost * AA_UP_RATIO); }
  upgradeAA() {
    if (this.aa || this.hp <= 0) return false;
    const c = this.aaUpgradeCost();
    if (G.euros < c) return false;
    G.euros -= c;
    this.aa = true;
    return true;
  }
  update() {
    // 阵亡序列 (原版 185 gotoAndPlay("destruction")): 与单位同构, 但【无漂移】
    //   (逐帧 SVG 实测 86 结构层 t 恒为 -38.25,-35.60 不变)
    // 注: 必须放在 hp<=0 判断之前 —— 被毁的塔 hp 已 <=0, 但序列仍要推进
    if (this.dying > 0) {
      this.dying--;
      while (this.dyingFired < 3 &&
             (DEATH_TICKS - this.dying) >= DEATH_BOOM_TICKS[this.dyingFired]) {
        const jx = Math.random() * 20 - 10, jy = Math.random() * 20 - 10;
        const ex = this.x + jx, ey = this.y + jy;
        G.effects.push({ x: ex, y: ey, type: 'death',
                         life: DEATH_BOOM_TICKS_LOCAL, life0: DEATH_BOOM_TICKS_LOCAL });
        G.effects.push({ x: ex, y: ey, type: 'flame',
                         life: DEATH_FLAME_TICKS, life0: DEATH_FLAME_TICKS });
        this.dyingFired++;
      }
      if (this.dying === 0) this.dead = true;   // 原版 frame_39: removeMovieClip(this)
      return;
    }
    if (this.hp <= 0) return;   // 被摧毁的塔不再索敌开火
    if (this.fireT > 0) this.fireT--;   // 炮管开火帧倒计时
    if (this.magnetT > 0) this.magnetT--;   // 蓝色磁场动画倒计时
    if (this.autoRepair && this.hp < this.maxHp && G.euros >= REPAIR_COST) {
      const n = Math.min(5, this.maxHp - this.hp, Math.floor(G.euros / REPAIR_COST));
      this.hp += n; G.euros -= n * REPAIR_COST;
      // 原版 autoRepair() 里 repairLogo.light/light2.gotoAndPlay(1): 每次实际修理播一遍光环
      // 上一遍播完才重开, 避免逐帧修理把动画钉在第 1 帧
      if (this.magnetT === 0) this.magnetT = MAGNET_TICKS;
    }
    if (!this.w || this.w[0] === 0) return;   // radar: 零属性 (原版鸡肋, 忠实还原)
    if (this.cool > 0) { this.cool--; }
    // 索敌 (getTarget): 有效目标 + 对空限制 + 迷雾可见 + 最近
    let best = null, bd = Infinity;
    for (const u of G.units) {
      if (u.hp <= 0 || u.x < 0 || u.reached) continue;
      if (u.aa && !this.aa) continue;               // 直升机需对空能力
      if (!isVisible(u.x, u.y)) continue;           // 迷雾中的敌人不可锁定
      const d = Math.hypot(u.x - this.x, u.y - this.y);
      if (d < bd && d <= this.w[1]) { bd = d; best = u; }
    }
    this.target = best;
    if (best) {
      // 转向 (rotateSpeed 因子越小越快)
      const want = Math.atan2(best.y - this.y, best.x - this.x);
      let da = want - this.rot;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      const rs = this.w[0] * 0.0198;   // 原版: typeData[0] × fpsc 度/帧 → 弧度
      this.rot += Math.sign(da) * Math.min(Math.abs(da), rs);
      // 开火 (冷却 = 威力因子 × 系数) → 触发炮管开火帧 (fireT = 0..fireDur)
      if (Math.abs(da) < 0.3 && this.cool <= 0 && bd <= this.w[1]) {
        this.cool = this.w[2] * 1.15;
        this.fireT = fireTicksFor(PLAYER_ETURRET[this.id] || this.id);   // 播完整开火动画
        spawnShell(this.x, this.y, best, this.w, 'ally', this.id);
      }
    }
  }
  sellPrice() { return Math.floor(this.hp / this.maxHp * this.cost * SELL_RATIO); }
}

// ---------------- 炮弹 (溅射按原版三段公式) ----------------
function spawnShell(x, y, target, w, side, turretId) {
  G.shells.push({ x, y, target, w, side, turretId,
    speed: 9, trail: 0 });
}

function shellHit(s) {
  const tx = s.target.x, ty = s.target.y;
  const range = s.w[5], power = s.w[4];
  const victims = s.side === 'ally' ? G.units : G.turrets;
  const mult = (u) => (u.aa ? ANTI_AIR_MULT : 1);
  if (s.side === 'ally') {
    // 溅射三段 (原版 fireOnEnnemi: 中心全额/中环半伤/外环20%)
    const damaged = new Set();
    for (const [rr, pm] of SPLIT) {
      for (const u of victims) {
        if (u.hp <= 0) continue;
        const d = Math.hypot(u.x - tx, u.y - ty);
        if (d <= range * rr) {
          if (u.aa) u.hp -= power * pm * ANTI_AIR_MULT;
          else u.hp -= power * pm;
          damaged.add(u);
        }
      }
    }
    // 原版命中循环: 每个受击单位 createEclat(单位位置 + (unitEtat偏移)/4) —— 车体中部
    // (unitEtat 在 428 内 t=(0,-60) scale y=2 → 偏移/4 ≈ 车体中心偏上约 8px)
    for (const u of damaged) createEclat(u.x, u.y - 8, power);
    // 击杀 → 启动阵亡序列 (原版 unitEtat.destruction(): 车辆滞留 39 帧播 destruction 段)
    for (const u of victims) killUnit(u);
  } else {
    for (const t of victims) {
      if (t.hp <= 0) continue;
      if (Math.hypot(t.x - tx, t.y - ty) <= range * 2) {
        t.hp -= power;
        if (t.hp <= 0) killTurret(t);   // 塔被毁 → 启动阵亡序列 (原版 unitEtat 同款 destruction)
      }
    }
  }
  // 命中爆型 (原版: crotale弹→392, MLRS→394, pluton/Yamato重炮→395/396, 普通→390)
  const kind = s.turretId === 'crotale' || s.turretId === 'crotaleAbrams' || s.turretId === 'crotaleTigre' ? 'crotale'
    : s.turretId === 'MLRS' ? 'mlrs'
    : s.turretId === 'pluton' || s.turretId === 'Yamato460' ? 'large'
    : 'small';
  boomTyped(tx, ty, 4 + s.w[4] / 40, kind);
  shellImpactSfx(SHELL_KIND[s.turretId] || 'bullet');   // 命中音 (原版弹体精灵 frame_2)
}

// 分型爆炸 (原版 sprite: 390=普通弹爆(小) 392=crotale 394=MLRS 395=large/pluton 396=large2/Yamato)
const EXPLOSION_TYPED = {
  small: [1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => 'assets/explosion/typed/DefineSprite_390/' + i + '.png'),
  crotale: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(i => 'assets/explosion/typed/DefineSprite_392/' + i + '.png'),
  mlrs: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(i => 'assets/explosion/typed/DefineSprite_394/' + i + '.png'),
  large: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].map(i => 'assets/explosion/typed/DefineSprite_395/' + i + '.png'),
  large2: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(i => 'assets/explosion/typed/DefineSprite_396/' + i + '.png'),
};
const EXPLOSION_TYPED_IMG = {};
for (const k in EXPLOSION_TYPED)
  EXPLOSION_TYPED_IMG[k] = EXPLOSION_TYPED[k].map(src => { const im = new Image(); im.src = src; return im; });

function boom(x, y, r) {
  boomTyped(x, y, r, 'small');
}
// 单位阵亡 → 启动阵亡序列 (替代原来的"立即移除")
// 权威依据 deobf/scripts/DefineSprite_428_unit/frame_2/DoAction_2.as:
//   euros += prixRevient; master_units.removeUnits("E", this);
//   var ie = Math.floor(Math.random()*6)+1; master_sounds["explosion"+ie].start();
// 即: 赏金在阵亡瞬间结算, 并随机播放 6 种爆炸音之一 (与命中音不同, 这是"车辆被摧毁"音)
function killUnit(u) {
  if (u.hp > 0 || u.dead || u.dying > 0) return;   // 只在"血已尽且未在阵亡中"时启动序列
  G.euros += u.bounty;
  G.score += u.bounty;
  u.dying = DEATH_TICKS;
  u.dyingFired = 0;
  // 原版: master_sounds["explosion" + (1..6)].start()
  playSfx('explosion' + (1 + Math.floor(Math.random() * 6)), 0.5);
}
// 玩家塔阵亡 → 启动阵亡序列 (原版 185 的 destruction 与 428 同构: 三点爆炸, 但结构层不漂移)
function killTurret(t) {
  if (t.hp > 0 || t.dying > 0) return;
  t.dying = DEATH_TICKS;
  t.dyingFired = 0;
  playSfx('explosion' + (1 + Math.floor(Math.random() * 6)), 0.5);
}
function boomTyped(x, y, r, type) {
  const n = (EXPLOSION_TYPED[type] || EXPLOSION_TYPED.small).length;
  G.effects.push({ x, y, r, life: n, life0: n, type: type || 'small' });
}
// 命中火花 (原版 createEclat): 单颗 etincelle, 带随机旋转 ±8px 抖动
function spawnSpark(x, y) {
  G.sparks.push({
    x: x + (Math.random() * 16 - 8),
    y: y + (Math.random() * 16 - 8),
    rot: Math.random() * Math.PI * 2,
    life: SPARK_TICKS,
  });
}
// createEclat 包装: 命中必出 1 个; 威力 > 8 再出 2 个 (共 3 个)
function createEclat(x, y, power) {
  spawnSpark(x, y);
  if (power > 8) { spawnSpark(x, y); spawnSpark(x, y); }
}

// ---------------- 波次调度 (startMission) ----------------
function startWave() {
  if (G.wave >= WAVES.length) return;
  // 原版 yamatoBattle: 终波 Yamato 出场切换战斗音乐
  const isYamatoWave = WAVES[G.wave].some(u => u.type === 'Yamato');
  if (isYamatoWave && bgmAudio) {
    bgmAudio.src = 'assets/music/bgm_alt.mp3';
    bgmAudio.play().catch(() => {});
  }
  const wave = WAVES[G.wave];
  G.wave++;
  const routeName = 'parcourt' + (wave[0] && JSON.stringify(ROUTES).includes('p') ? guessRoute(wave) : 1);
  let delay = 0;
  for (const u of wave) {
    const type = u.type, weapon = u.weapon;
    G.spawnQueue.push({ type, weapon, route: guessRoute(wave), delay });
    delay += 40;                            // 原版 20px 间隔 ≈ 出车间隔
  }
  G.waveActive = true;
  const dirNames = { parcourt1: '南方公路', parcourt2: '西侧小路', parcourt3: '北面空降', parcourt4: '海上航线' };
  const dirs = [...new Set(G.spawnQueue.map(s => s.route))];
  showBanner('第 ' + G.wave + ' / 44 波来袭 — ' + dirs.map(d => dirNames[d]).join(' + '));
  // 原版 startInstructions: 简报期间 pauseMusic, 出兵后恢复
  if (!isPause) { pauseMusic(); setTimeout(() => { if (isPause) playMusic(); refreshMusicPanel(); }, 3200); }
  hud();
}

function guessRoute(wave) {
  // 原版按波配置路线: 舰艇海线, 直升机空降线, 其余南/西线交替
  if (wave.some(u => u[0] === 'navire' || u[0] === 'Yamato')) return 'parcourt4';
  if (wave.some(u => u[0] === 'tigre')) return 'parcourt3';
  return (G.wave % 3 === 0) ? 'parcourt2' : 'parcourt1';
}

// ---------------- 原版解锁机制 (unlockNextWeapon / showPanelForUnlock) ----------------
// 伪代码出处 deobf/pcode_as/frame_6__PlaceObject2_6_333 onClipEvent(load):
//   unlockNextWeapon: iUnlock==unlockerLength → return false; 否则 weaponsToUnlock[iUnlock]=true, iUnlock++
//   showPanelForUnlock: 弹出面板, lockItem=false, 显示下一件武器名 + (interest+3)%
function unlockNextWeapon() {
  if (G.iUnlock >= WEAPONS_TO_UNLOCK.length) return false;
  G.unlocker[WEAPONS_TO_UNLOCK[G.iUnlock]] = true;
  G.iUnlock++;
  buildShop();
  return true;
}
// 原版 newEvents 里按关卡号自动解锁 (mR 是当前任务号, 事件在波开始前调用)
function autoUnlockForWave(waveNo) {
  const id = AUTO_UNLOCK[waveNo];
  if (id && !G.unlocker[id]) { G.unlocker[id] = true; buildShop(); }
}
function shouldShowUnlockPanel(waveNo) { return PANEL_WAVES.includes(waveNo); }
// 面板弹出: 原版 _x=400/_y=300 居中, 冻结演出直到玩家二选一
function showPanelForUnlock() {
  G.panelOpen = true;
  G.lockItem = false;
  playSfx('boutonScroll', 0.4);
  refreshPanelButtons();
  syncPanel();          // 函数声明提升, 定义在输入段
}
// sprite 989 / PlaceObject2_988_6 on(press): 解锁下一件武器 (失败播 cannot)
function panelPickUnlock() {
  if (G.lockItem) return;
  G.lockItem = true;
  if (unlockNextWeapon()) { playSfx('creationUnite', 0.45); closeUnlockPanel(); }
  else playSfx('cannot', 0.45);
}
// sprite 989 / PlaceObject2_988_3 on(press): interest += 3
function panelPickInterest() {
  if (G.lockItem) return;
  G.lockItem = true;
  playSfx('creationUnite', 0.45);
  G.interest += INTEREST_STEP;
  closeUnlockPanel();
}
function closeUnlockPanel() {
  G.panelOpen = false;
  G.interWave = 200;
  hud();
}
function refreshPanelButtons() {
  const b1 = document.getElementById('upUnlock');
  const b2 = document.getElementById('upInterest');
  if (!b1 || !b2) return;
  const done = G.iUnlock >= WEAPONS_TO_UNLOCK.length;
  b1.disabled = done;
  b1.textContent = done ? '已解锁全部武器' : '解锁 ' + (WEAPON_CN[WEAPONS_TO_UNLOCK[G.iUnlock]] || WEAPONS_TO_UNLOCK[G.iUnlock]);
  b2.textContent = '利率 → ' + (G.interest + INTEREST_STEP) + '%';
  const el = document.getElementById('upInfo');
  if (el) {
    el.textContent = done
      ? '全部武器已解锁。\n你可以把利率提到 ' + (G.interest + INTEREST_STEP) + '%'
      : '你可以解锁 "' + (WEAPON_CN[WEAPONS_TO_UNLOCK[G.iUnlock]] || WEAPONS_TO_UNLOCK[G.iUnlock])
        + '"\n或把利率提到 ' + (G.interest + INTEREST_STEP) + '%';
  }
}

function endWave() {
  // 利息 (giveIntrest, 953/frame_30): euros = floor(euros × (1 + interest/100)); 第 1 波后不给
  if (G.wave > 1) G.euros = Math.floor(G.euros * (1 + G.interest / 100));
  G.waveActive = false;
  // 原版两波之间的剧情段调用 _root.events() (953/frame_2), 此时 mR = 即将开始的波号
  const nextWave = G.wave + 1;
  autoUnlockForWave(nextWave);
  if (shouldShowUnlockPanel(nextWave)) { showPanelForUnlock(); return; }   // 面板期间不推进 interWave
  G.interWave = 200;
  if (G.wave >= WAVES.length && G.units.every(u => u.dead)) {
    G.won = true;
  }
  hud();
}

// ---------------- 主循环 ----------------
function tick() {
  if (G.lost || G.won) return;
  G.frame++;
  scrollCamera();
  updateDeathShake();   // 阵亡镜头抖动 (原版 destruction 段改 _root.carte._x/_y; 差值之和为 0)
  su37Update();
  playBirds(performance.now());
  computeVisibility();
  revealExplored();

  // 出兵
  if (G.waveActive) {
    if (G.spawnQueue.length) {
      G.spawnTimer++;
      if (G.spawnTimer >= G.spawnQueue[0].delay) {
        const s = G.spawnQueue.shift();
        G.units.push(new Unit(s.type, s.weapon, s.route));
        G.spawnTimer = 0;
      }
    } else if (G.units.every(u => u.dead || u.reached)) {
      // 注: 阵亡序列播放中 (dying>0) 的单位不算"已清场" —— 等它播完才结束本波
      endWave();
    }
  } else {
    // 二选一面板打开时冻结波次调度 (原版 startMissionPause 期间不推进)
    if (!G.panelOpen && --G.interWave <= 0) startWave();
  }

  for (const u of G.units) {
    u.update();
    if (u.reached && !u.dead) { u.dead = true; G.losses++; G.lost = true; }  // 抵达基地 = 失败
  }
  G.units = G.units.filter(u => !u.dead);
  for (const t of G.turrets) t.update();
  // 阵亡序列播完的塔移除 (原版 185 frame_39 removeMovieClip(this))
  G.turrets = G.turrets.filter(t => !t.dead);
  if (G.selected && G.selected.dead) G.selected = null;   // 选中项被摧毁 → 清空选中

  for (const s of G.shells) {
    const t = s.target;
    if (!t || t.hp <= 0) { s.hit = true; continue; }
    const dx = t.x - s.x, dy = t.y - s.y;
    const d = Math.hypot(dx, dy);
    if (d < s.speed) { s.hit = true; shellHit(s); }
    else { s.x += dx / d * s.speed; s.y += dy / d * s.speed; }
  }
  G.shells = G.shells.filter(s => !s.hit);
  for (const e of G.effects) e.life--;
  G.effects = G.effects.filter(e => e.life > 0);
  for (const sp of G.sparks) sp.life--;
  G.sparks = G.sparks.filter(sp => sp.life > 0);

  // 炮塔全毁不算输 (原版只有基地被突破才输)
  draw();
  hud();
  refreshToggleBtns();   // Su37 冷却倒计时显示
}

// ---------------- 绘制 (原版地图 map.jpg + 世界坐标→屏幕变换) ----------------
const mapImg = new Image();
mapImg.src = 'map.jpg';

function clampCam() {
  const viewW = W / zoom, viewH = H / zoom;
  const lo = Math.min(WORLD.x0 - 40, (WORLD.x0 + WORLD.x1 - viewW) / 2);
  cam.x = Math.max(lo, Math.min(WORLD.x1 + 40 - viewW, cam.x));
  // cam.y = 屏幕顶边的世界 y (Flash 系, 北=-1563 顶 / 南=580 底)
  cam.y = Math.max(WORLD.y0 - 40, Math.min(WORLD.y1 + 40 - viewH, cam.y));
}
function toggleZoom() {   // 原版 G 键: 39% 全图视图
  zoom = zoom === 1 ? 0.39 : 1;
  if (zoom < 1) {         // 全图居中
    cam.x = (WORLD.x0 + WORLD.x1 - W / zoom) / 2;
    cam.y = (WORLD.y0 + WORLD.y1 - H / zoom) / 2;
  }
  clampCam();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  clampCam();
  // 地图背景: 位图左上角放在世界 (MAP_ORIGIN.x, MAP_ORIGIN.y=-1440=北缘), Flash 屏幕系直接铺
  ctx.drawImage(mapImg, w2sX(MAP_ORIGIN.x), w2sY(MAP_ORIGIN.y), MAP_W * zoom, MAP_H * zoom);

  // 建造区显示 (原版 C 键: surfaceForBuild alpha=35) — 道路缓冲带外可建
  if (G.showBuildArea) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#f64'; ctx.lineWidth = 90 * zoom; ctx.lineCap = 'round';
    for (const rn in ROUTES) {
      const r = ROUTES[rn];
      ctx.beginPath();
      ctx.moveTo(w2sX(r[0][0]), w2sY(r[0][1]));
      for (let i = 1; i < r.length; i++) ctx.lineTo(w2sX(r[i][0]), w2sY(r[i][1]));
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const t of G.turrets) {
    const sx = w2sX(t.x), sy = w2sY(t.y);
    if (sx < -60 * zoom || sx > W + 60 * zoom || sy < -60 * zoom || sy > H + 60 * zoom) continue;
    ctx.save(); ctx.translate(sx, sy); ctx.scale(zoom, zoom);
    // 注意: 被摧毁的塔不再用灰色色块占位 (违反"无占位/近似/色块"要求, 且与原版不符)。
    // 原版 185 destruction 段的 86 结构层 body 逐帧哈希完全相同 (实测 39 帧全等),
    // 即塔的外观【不变】, 只是叠三处爆炸并最终 removeMovieClip。
    // 因此这里继续正常绘制塔体, 阵亡表现完全交给 G.effects 的 death+flame 特效。
    const libId = PLAYER_ETURRET[t.id] || t.id;
    const bimg = turretBaseImg(libId);
    if (bimg && bimg.complete && bimg.naturalWidth) {
      ctx.drawImage(bimg, TURRET_BASE_ORIGIN.x, TURRET_BASE_ORIGIN.y);
    }
    const im = turretLibImg(libId);
    if (im && im.complete && im.naturalWidth) {
      if (LIB_SPIN[libId] || libId === 'radarMobile') {
        // A 类: 整帧即自转件 → 整帧随瞄准朝向旋转, 再叠加自身自转 (无静态重影)
        ctx.save();
        ctx.rotate(t.rot + Math.PI / 2);
        if (libId === 'radarMobile') {
          // 两个 115 反向自转, 不能整帧旋转 → 逐件各转各的
          drawRadarMobileSpin();
        } else {
          drawLibSpin(libId);       // radar: 整帧绕子件原点自转
        }
        ctx.restore();
      } else {
        // B/C 类: 整帧静态铺底 (+ 炮管开火帧 + B 类自转件覆盖)
        ctx.save();
        ctx.rotate(t.rot + Math.PI / 2);
        ctx.drawImage(im, TURRET_LIB_ORIGIN.x, TURRET_LIB_ORIGIN.y);
        drawTurretGuns(libId, t.fireT);
        ctx.restore();
        const sd = IDLE_SPIN[libId];
        if (sd) drawIdleSpin(libId, (G.frame * sd.degPerSWFFrame * (24 / 30)) % 360);
      }
    } else if (t.id === 'radar') {
      // 雷达: 扫描波纹 (叠加在整帧之上)
      const ph = (Date.now() / 900) % 1;
      ctx.strokeStyle = `rgba(120,220,255,${0.5 * (1 - ph)})`;
      ctx.beginPath(); ctx.arc(0, 0, 40 + ph * 70, 0, 7); ctx.stroke();
    } else {
      // 缺图兜底 (库未加载完)
      ctx.save(); ctx.rotate(t.rot);
      ctx.fillStyle = t.id.startsWith('crotale') ? '#aaf' : '#ba6';
      ctx.fillRect(0, -3, 18, 6);
      ctx.restore();
    }
    // 对空标记 (蓝色小点; 阵亡序列中不显示)
    if (t.aa && t.dying === 0) { ctx.fillStyle = '#6cf'; ctx.fillRect(6, -14, 4, 4); }
    // 自动修理蓝色磁场 (原版 repairLogo dpt=31 > tourelle dpt=24, 画在塔身之上)
    //   7 帧 24fps, frame7 为空白帧, 播完自然消失; 阵亡序列中不显示
    if (t.magnetT > 0 && t.dying === 0) {
      // magnetT: MAGNET_TICKS..1 → 映射到精灵帧 1..7
      const done = MAGNET_TICKS - t.magnetT;              // 0..TICKS-1
      const idx = Math.floor(done / MAGNET_TICKS * MAGNET_FRAMES.length);
      const im = MAGNET_FRAMES[Math.max(0, Math.min(MAGNET_FRAMES.length - 1, idx))];
      if (im && im.complete && im.naturalWidth) {
        const s = MAGNET_DIAM / im.naturalWidth;
        ctx.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2,
                      im.naturalWidth * s, im.naturalHeight * s);
      }
    }
    // 血条 (原版 H 键开关; 阵亡序列中不显示 —— 对应 destruction() 里 removeMovieClip(etatJauge))
    if (G.showHp && t.dying === 0) {
      ctx.fillStyle = '#300'; ctx.fillRect(-10, -16, 20, 3);
      ctx.fillStyle = '#4f4'; ctx.fillRect(-10, -16, 20 * t.hp / t.maxHp, 3);
    }
    ctx.restore();
    // 选中视觉 (原版 cerclePortee 射程圈 + viseurUnit 四角准星)
    if (t === G.selected && t.w) {
      // 绿色射程圈: 原版 _width = distanceOfFire * 2 (直径), 图 100x100 → 缩放 直径/100
      if (SEL_RANGE.complete && SEL_RANGE.naturalWidth) {
        const dia = t.w[1] * 2 * zoom;
        ctx.drawImage(SEL_RANGE, sx - dia / 2, sy - dia / 2, dia, dia);
      } else {
        ctx.strokeStyle = 'rgba(120,255,120,.45)';
        ctx.beginPath(); ctx.arc(sx, sy, t.w[1] * zoom, 0, 7); ctx.stroke();
      }
      // 红色四角准星 (原版 viseurUnit 778, 60x60, 固定大小不随射程)
      const ci = SEL_CROSS[Math.floor(G.frame / 6) % SEL_CROSS.length];
      if (ci.complete && ci.naturalWidth) {
        ctx.drawImage(ci, sx - 30 * zoom, sy - 30 * zoom, 60 * zoom, 60 * zoom);
      }
      ctx.fillStyle = '#ff8'; ctx.font = '11px monospace';
      const msg = t.aa ? '[对空OK] S卖 R修' : `按U升级对空 $${t.aaUpgradeCost()}`;
      ctx.fillText(msg, sx - 30, sy + 30);
    }
  }
  for (const u of G.units) {
    if (!isVisible(u.x, u.y)) continue;   // 迷雾中的敌人不可见
    // 阵亡序列: 车体沿自身纵轴向后漂移 (原版 destruction 段 chassis ty 逐帧 -155→-167, 共 12px)
    // 车头方向 = rot (世界系 y 向下)。向后 = 车头反方向。
    const dr = u.dying > 0 ? (u.drift || 0) : 0;
    const ux = u.x - Math.cos(u.rot) * dr, uy = u.y - Math.sin(u.rot) * dr;
    const sx = w2sX(ux), sy = w2sY(uy);
    // 车体阴影 (原版 428_unit enterFrame: ombre 同 rot 旋转, 偏移 +4/+4,
    // colorTransform mult RGB=0 alpha=0.352 → 全黑半透明). 先画 = 在车体下方
    // 注: 原版 destruction() 里 removeMovieClip(_parent.ombre) —— 阵亡序列中阴影已移除
    const sim = u.dying > 0 ? null : SHADOW_IMG[u.type];
    if (sim && sim.complete && sim.naturalWidth) {
      ctx.save();
      ctx.translate(sx + SHADOW_OFFSET * zoom, sy + SHADOW_OFFSET * zoom);   // y-down 世界系, +4=屏幕右下
      ctx.scale(zoom, zoom);
      ctx.rotate(u.rot + Math.PI / 2);
      ctx.globalAlpha = SHADOW_ALPHA;
      ctx.globalCompositeOperation = 'source-over';
      // 原版 426 帧库: 所有车体 scale=(1,1) 原生尺寸 (Yamato 亦为 1.0, 无放大)
      ctx.drawImage(sim, -sim.naturalWidth / 2, -sim.naturalHeight / 2);
      ctx.restore();
    }
    ctx.save(); ctx.translate(sx, sy); ctx.scale(zoom, zoom);
    const img = UNIT_IMG[u.type];
    if (img && img.complete && img.naturalWidth) {
      ctx.rotate(u.rot + Math.PI / 2);
      // 原版 426 帧库: 所有车体 scale=(1,1) 原生尺寸 (Yamato 亦为 1.0)
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    } else {
      ctx.rotate(-u.rot);
      const col = { jeep:'#c66', tigre:'#6cf', navire:'#6ae' }[u.type] || '#c66';
      ctx.fillStyle = col;
      ctx.fillRect(-8, -5, 16, 10);
    }
    ctx.restore();
    // 武器塔整帧叠加 (173 库: 部件已按原版矩阵合成, 整帧随瞄准角旋转)
    // 注: 阵亡序列中不再绘制武器塔 (原版 destruction 段只保留 chassis, 塔已随 tourelle.play() 停止)
    if (u.weapon && u.dying === 0) {
      const im = turretLibImg(u.weaponId);
      if (im && im.complete && im.naturalWidth) {
        ctx.save(); ctx.translate(sx, sy); ctx.scale(zoom, zoom);
        ctx.rotate(u.rot + Math.PI / 2);
        if (LIB_SPIN[u.weaponId] || u.weaponId === 'radarMobile') {
          // A 类: 整帧即自转件
          if (u.weaponId === 'radarMobile') drawRadarMobileSpin();
          else drawLibSpin(u.weaponId);
        } else {
          ctx.drawImage(im, TURRET_LIB_ORIGIN.x, TURRET_LIB_ORIGIN.y);
          drawTurretGuns(u.weaponId, u.fireT);
        }
        ctx.restore();
        // B 类持续自转件 (crotale 发射架等)
        const sd = IDLE_SPIN[u.weaponId];
        if (sd) {
          ctx.save(); ctx.translate(sx, sy); ctx.scale(zoom, zoom);
          ctx.rotate(u.rot + Math.PI / 2);
          drawSpinDef(sd, (G.frame * sd.degPerSWFFrame * (24 / 30)) % 360);
          ctx.restore();
        }
      }
    }
    // 血条 (原版 unitEtat/etatJauge; destruction() 里 removeMovieClip(_parent.etatJauge) →
    // 阵亡序列中不再显示)
    if (G.showHp && u.dying === 0) {
      ctx.fillStyle = '#300'; ctx.fillRect(sx - 9 * zoom, sy - 14 * zoom, 18 * zoom, 3 * zoom);
      ctx.fillStyle = '#f43'; ctx.fillRect(sx - 9 * zoom, sy - 14 * zoom, 18 * zoom * Math.max(0, u.hp) / u.maxHp, 3 * zoom);
    }
  }
  for (const s of G.shells) {
    if (!isVisible(s.x, s.y)) continue;   // 飞入迷雾的炮弹不可见
    const sx = w2sX(s.x), sy = w2sY(s.y);
    const t = s.target && s.target.hp > 0 ? s.target : null;
    const ang = t ? Math.atan2(t.y - s.y, t.x - s.x) : 0;   // y-down 世界系, 屏幕角=世界角
    const kind = SHELL_KIND[s.turretId] || 'bullet';
    const spec = SHELL_FRAMES[kind] || SHELL_FRAMES.bullet;
    const im = SHELL_IMG[kind];
    if (im && im.complete && im.naturalWidth) {
      const [bx, by, bw, bh] = spec.bbox;
      const sc = spec.scale * zoom;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang + Math.PI / 2); ctx.scale(sc, sc);
      // 以内容 bbox 中心对齐弹道点 (画布中心 ≠ 内容中心)
      ctx.drawImage(im, bx, by, bw, bh, -bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    } else {
      ctx.fillStyle = s.side === 'ally' ? '#ff6' : '#f66';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
  }
  for (const e of G.effects) {
    const sx = w2sX(e.x), sy = w2sY(e.y);
    // 阵亡火焰叠层 (原版 createExplosion 附带的 chid 637 "flame", 34 帧, 播完自删)
    // 注: SVG 导出证明该 sprite 用 mix-blend-mode:lighten (Flash Layer/ADD 混合) —— 黑色底在
    //     原版里因混合模式而不可见。H5 用 globalCompositeOperation='lighter' 还原该混合,
    //     否则整块黑底会盖住画面 (实测过, 是个明显 bug)
    if (e.type === 'flame') {
      const n = DEATH_FLAME_FRAMES.length;
      const fi = Math.min(n - 1, Math.floor((e.life0 - e.life) / e.life0 * n));
      const fim = DEATH_FLAME_FRAMES[fi];
      if (fim && fim.complete && fim.naturalWidth) {
        ctx.save();
        ctx.translate(sx, sy); ctx.scale(zoom, zoom);
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(fim, -fim.naturalWidth / 2, -fim.naturalHeight / 2);   // 原生尺寸
        ctx.restore();
      }
      continue;
    }
    // 阵亡爆炸用 chid 279 (4 帧, 原生 210x217 大画布, 中心对齐) —— 与命中爆型
    // (390/392/394/395/396) 不同: 原版 createExplosion 只设 _x/_y, 不缩放
    if (e.type === 'death') {
      const n = EXPLOSION_FRAMES.length;
      const fi = Math.min(n - 1, Math.floor((e.life0 - e.life) / e.life0 * n));
      const im = EXPLOSION_FRAMES[fi];
      if (im && im.complete && im.naturalWidth) {
        ctx.save();
        ctx.translate(sx, sy); ctx.scale(zoom, zoom);
        ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
        ctx.restore();
      }
      continue;
    }
    const frames = EXPLOSION_TYPED_IMG[e.type] || EXPLOSION_FRAMES;
    const n = frames.length;
    const fi = Math.min(n - 1, Math.floor((e.life0 - e.life) / e.life0 * n));
    const im = frames[fi];
    if (im && im.complete && im.naturalWidth) {
      const s = Math.max(0.35, e.r / 45) * zoom;
      ctx.drawImage(im, sx - im.naturalWidth / 2 * s, sy - im.naturalHeight / 2 * s,
                    im.naturalWidth * s, im.naturalHeight * s);
    } else {
      ctx.strokeStyle = `rgba(255,${120 + e.life * 8},60,${e.life / e.life0})`;
      ctx.beginPath(); ctx.arc(sx, sy, e.r * (e.life0 - e.life) / 3 * zoom, 0, 7); ctx.stroke();
    }
  }
  // 命中火花 (原版 etincelle): 7 帧淡出, 随机朝向, 位置已含 ±8px 抖动
  for (const sp of G.sparks) {
    if (!isVisible(sp.x, sp.y)) continue;
    const sx = w2sX(sp.x), sy = w2sY(sp.y);
    const fi = Math.min(SPARK_FRAMES.length - 1,
      Math.floor((SPARK_TICKS - sp.life) / SPARK_TICKS * SPARK_FRAMES.length));
    const im = SPARK_FRAMES[fi];
    if (im && im.complete && im.naturalWidth) {
      ctx.save();
      ctx.translate(sx, sy); ctx.rotate(sp.rot); ctx.scale(zoom, zoom);
      ctx.drawImage(im, SPARK_ORIGIN.x, SPARK_ORIGIN.y);
      ctx.restore();
    }
  }
  // Su37 空袭 (飞行中的战机, 在迷雾之前绘制)
  su37Draw();
  // Su37 瞄准提示 (原版 zoneBombardement chid 785: 跟随鼠标的 4 角准星 + 中心十字 + "ready" 文本)
  if (G.su37Aiming) {
    const sx = w2sX(G.mx), sy = w2sY(G.my);
    if (ZONE_IMG.complete && ZONE_IMG.naturalWidth) {
      ctx.drawImage(ZONE_IMG, sx + ZONE_ORIGIN.x * zoom, sy + ZONE_ORIGIN.y * zoom,
                    154.3 * zoom, 154.3 * zoom);
    } else {
      // 资源未到位时回退到原 CSS 近似 (不影响玩法)
      ctx.save();
      ctx.strokeStyle = 'rgba(255,90,60,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, SU37.IMPACT * zoom, 0, 7); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - 14, sy); ctx.lineTo(sx + 14, sy);
      ctx.moveTo(sx, sy - 14); ctx.lineTo(sx, sy + 14);
      ctx.stroke();
      ctx.fillStyle = '#ff9'; ctx.font = '12px monospace';
      ctx.fillText('点击目标投放炸弹', sx + 18, sy - 8);
      ctx.restore();
    }
  }
  // 建造预览光标 (原版 carte.viseurConstruction: 跟随鼠标, 帧号反映可建状态)
  if (G.shopSel && !G.su37Aiming) {
    const ok = buildAllowedAt(G.mx, G.my);
    const aff = G.euros >= (STRUCTURES[G.shopSel] || {}).cost;
    // 帧3(深红)=不可建; 帧1(浅绿)=可建; 帧2(粉)为 hover 中间态
    const fi = (ok && aff) ? 0 : 2;
    const im = CURSOR_FRAMES[fi];
    if (im.complete && im.naturalWidth) {
      const sx0 = w2sX(G.mx), sy0 = w2sY(G.my);
      const w = im.naturalWidth * zoom, h = im.naturalHeight * zoom;
      ctx.save(); ctx.globalAlpha = 0.75;
      ctx.drawImage(im, sx0 - w / 2, sy0 - h / 2, w, h);
      ctx.restore();
    }
    // 原版 cancelhint: 建造中显示提示条 (帧 2 = 建造中)
    const hi = CANCEL_HINT[1];
    if (hi.complete && hi.naturalWidth) {
      ctx.drawImage(hi, (W - hi.naturalWidth) / 2, H - 26);
    }
    ctx.fillStyle = ok ? '#cfc' : '#f88';
    ctx.font = '11px monospace';
    ctx.fillText((ok ? '可建 ' : '不可建 ') + (SHOP.find(s => s.id === G.shopSel) || {}).id, 8, H - 8);
  }

  // ---- 战争迷雾 (最后绘制, 视野源换算到屏幕坐标) ----
  // 三态迷雾: 淡雾基底 → 挖当前视野 → 叠未探索浓雾(探索记忆挖除)
  // 第一层: 已探索淡雾基底
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, W, H);
  fogCtx.fillStyle = 'rgba(5,9,5,0.25)';
  fogCtx.fillRect(0, 0, W, H);
  // 第二层: 未探索浓雾 (探索记忆挖除已探索区域)
  heavyCtx.globalCompositeOperation = 'source-over';
  heavyCtx.clearRect(0, 0, W, H);
  heavyCtx.fillStyle = 'rgba(4,8,4,0.60)';
  heavyCtx.fillRect(0, 0, W, H);
  heavyCtx.globalCompositeOperation = 'destination-out';
  const ep = exploredToScreen();
  heavyCtx.drawImage(exploredCv, ep.x, ep.y, ep.w, ep.h);
  fogCtx.drawImage(heavyCv, 0, 0);
  // 第三层 (最后): 挖当前视野圈 → 全亮
  fogCtx.globalCompositeOperation = 'destination-out';
  for (const s of VIS) {
    const fx = w2sX(s.x), fy = w2sY(s.y);
    const g = fogCtx.createRadialGradient(fx, fy, s.r * 0.55 * zoom, fx, fy, s.r * zoom);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    fogCtx.fillStyle = g;
    fogCtx.beginPath();
    fogCtx.arc(fx, fy, s.r * zoom, 0, 7);
    fogCtx.fill();
  }
  fogCtx.globalCompositeOperation = 'source-over';
  // 雷达站扫描圈提示 (可见的驱雾范围)
  ctx.drawImage(fogCv, 0, 0);

  // ---- 小地图 + INFO 面板 (迷雾之上, 原版右上角 minimap 152px) ----
  drawMinimap();
  drawInfoPanel();

  // ---- 敌军路线情报 (虚线, 任务简报已知) ----
  ctx.strokeStyle = 'rgba(255,255,150,0.22)';
  ctx.setLineDash([8, 16]);
  for (const rn in ROUTES) {
    const r = ROUTES[rn];
    ctx.beginPath();
    ctx.moveTo(w2sX(r[0][0]), w2sY(r[0][1]));
    for (let i = 1; i < r.length; i++) ctx.lineTo(w2sX(r[i][0]), w2sY(r[i][1]));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // ---- 波次来袭横幅 ----
  if (banner && Date.now() < banner.until) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H / 2 - 34, W, 56);
    ctx.fillStyle = '#ffd';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(banner.text, W / 2, H / 2 + 6);
    ctx.textAlign = 'left';
  }
}

// ---- 小地图: 右上角 152x141, 敌(红,限可见)/塔(绿)/视野(淡圈)/视口框 ----
const MM = { w: 161, h: 150 };
const mmCv = document.getElementById('minimap');
const mmCtx = mmCv.getContext('2d');
function drawMinimap() {
  const ctx = mmCtx;   // 画到侧栏小地图
  ctx.clearRect(0, 0, MM.w, MM.h);
  ctx.drawImage(mapImg, 0, 0, MM.w, MM.h);
  // 坐标换算: 与缩略图同一坐标系 = 地图位图 (世界 x 0..2070, y -1440(北)..480(南), 顶=北)
  const mx = (wx) => (wx - MAP_ORIGIN.x) / MAP_W * MM.w;
  const my = (wy) => (wy - MAP_ORIGIN.y) / MAP_H * MM.h;
  for (const t of G.turrets) {
    if (t.hp <= 0) continue;
    ctx.fillStyle = t.id === 'radar' ? '#6cf' : '#4f4';
    ctx.fillRect(mx(t.x) - 1.5, my(t.y) - 1.5, 3, 3);
  }
  for (const u of G.units) {
    if (u.hp <= 0 || !isVisible(u.x, u.y)) continue;
    ctx.fillStyle = '#f44';
    ctx.fillRect(mx(u.x) - 1.5, my(u.y) - 1.5, 3, 3);
  }
  // 视口框 (屏幕对应世界区域; cam.y = 屏幕顶边世界 y)
  const vyN = cam.y, vyS = cam.y + H / zoom;
  const vxL = cam.x, vxR = cam.x + W / zoom;
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(mx(vxL), my(vyN), (vxR - vxL) / MAP_W * MM.w,
                 (vyS - vyN) / MAP_H * MM.h);
}

// ---- INFO 面板: 选中塔属性 (原版 informations 面板) ----
function drawInfoPanel() {
  const box = document.getElementById('infoBox');
  const t = G.selected;
  if (!t) { if (box && !box.dataset.keep) box.innerHTML = '点选炮塔查看属性'; return; }
  const price = repairPrice(t);
  if (box) box.innerHTML =
    '<b>' + t.id.toUpperCase() + (t.aa ? ' [对空]' : '') + '</b><br>' +
    'HP ' + Math.max(0, t.hp) + '/' + t.maxHp + '<br>' +
    (t.w ? '伤害 ' + t.w[4] + ' · 射程 ' + t.w[1] + '<br>冷却 ' + t.w[2] + ' · 炮管 ' + t.w[3] : '无武装') + '<br>' +
    (price > 0 ? '<b>修理 ' + price + ' $</b> (按 R)' : '无需修理') + '<br>' +
    (t.autoRepair ? '<b>自动修理 ON</b>' : '自动修理 OFF') + ' (按 T)';
  const px = 8, py = H - 112, pw = 244, ph = 104;
  ctx.fillStyle = 'rgba(20,26,20,0.82)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#6a6'; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = '#cfc'; ctx.font = 'bold 13px monospace';
  ctx.fillText(t.id.toUpperCase() + (t.aa ? '  [对空]' : ''), px + 8, py + 16);
  ctx.fillStyle = '#8f8'; ctx.font = '11px monospace';
  ctx.fillText('HP ' + t.hp + '/' + t.maxHp, px + 8, py + 32);
  if (t.w) ctx.fillText('伤害 ' + t.w[4] + '  射程 ' + t.w[1] + '  冷却 ' + t.w[2], px + 8, py + 46);
  // 修理条 (原版 814 base 尺寸 236x21, 权威配色: 纯黑边框 + RGB(0,102,152) 填充)
  {
    const barX = px + 4, barY = py + 56, barW = 236, barH = 21;
    ctx.fillStyle = BAR_BORDER; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = BAR_FILL;  ctx.fillRect(barX + 1, barY + 1, barW - 2, barH - 2);
    // HP 进度 (亮起部分)
    const ratio = t.maxHp > 0 ? Math.max(0, t.hp) / t.maxHp : 0;
    ctx.fillStyle = 'rgba(120,230,160,.45)';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * ratio, barH - 2);
    // 修理费文字 (原版 813 repairPrice EditText 的内容, 中英双写保留原版英文)
    ctx.fillStyle = price > 0 ? '#fff' : '#bfe';
    ctx.font = '12px monospace';
    ctx.fillText(price > 0 ? 'repair for ' + price + ' $' : 'no reparations needed', barX + 8, barY + 15);
  }
  // autoRepair 开关 (原版 818 autor 文字层: 黑底 + "auto repair ON/OFF")
  {
    const aX = px + 4, aY = py + 82, aW = 236, aH = 19;
    ctx.fillStyle = BAR_BORDER; ctx.fillRect(aX, aY, aW, aH);
    ctx.fillStyle = t.autoRepair ? '#1a3a1a' : '#2a1010';
    ctx.fillRect(aX + 1, aY + 1, aW - 2, aH - 2);
    ctx.fillStyle = t.autoRepair ? '#8f8' : '#a88';
    ctx.font = '12px monospace';
    ctx.fillText(t.autoRepair ? 'auto repair ON' : 'auto repair OFF', aX + 8, aY + 14);
  }
}

// 修改 draw 里的敌/弹绘制: 迷雾中不渲染 (在 draw 主循环内已由 VIS 过滤)

// ---------------- HUD / 商店 ----------------
function hud() {
  document.getElementById('hEuros').textContent = G.euros + ' $';
  document.getElementById('hWave').textContent = Math.max(1, G.wave);
  document.getElementById('hScore').textContent = G.score;
  document.getElementById('hCash').textContent = G.euros + ' $';
  document.getElementById('hInt2').textContent = 'interest ' + G.interest + '%';
  document.getElementById('hLoss').textContent = 'LOSSES ' + G.losses;
  if (typeof syncPanel === 'function') syncPanel();
}
function buildShop() {
  const el = document.getElementById('shop');
  el.innerHTML = '';
  for (const s of SHOP) {
    const locked = !G.unlocker[s.id];
    const sp = document.createElement('span');
    sp.className = 'sel' + (locked ? ' lock' : '') + (G.shopSel === s.id ? ' on' : '');
    // 原版建造菜单武器照片 (1025 帧库)
    const im = document.createElement('img');
    im.src = 'assets/menu/' + s.id + '.png';
    sp.appendChild(im);
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = s.id;
    sp.appendChild(nm);
    const pr = document.createElement('div');
    pr.className = 'price';
    pr.textContent = '$' + STRUCTURES[s.id].cost;
    sp.appendChild(pr);
    if (!locked) sp.onclick = () => { G.shopSel = s.id; playSfx('boutonScroll', 0.35); buildShop(); };
    el.appendChild(sp);
  }
}

// ---------------- 输入 (原版 master_clavier: 方向键持续滚动 + 边缘滚屏, 无 WASD) ----------------
cv.addEventListener('mousemove', (e) => {
  const r = cv.getBoundingClientRect();
  G.mx = s2wX(e.clientX - r.left); G.my = s2wY(e.clientY - r.top);   // 世界坐标
});
// 原版 vitesseDeplacement = 24 * fpsc(1.13) ≈ 27 世界像素/帧, 边缘阈值 k=35
const SCROLL_SPEED = 27, EDGE = 35;
const heldKeys = new Set();
window.addEventListener('keydown', (e) => {
  const map = { arrowleft:'left', arrowright:'right', arrowup:'up', arrowdown:'down' };
  const dir = map[e.key.toLowerCase()];
  if (dir) { heldKeys.add(dir); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  const map = { arrowleft:'left', arrowright:'right', arrowup:'up', arrowdown:'down' };
  const dir = map[e.key.toLowerCase()];
  if (dir) heldKeys.delete(dir);
});
function scrollCamera() {   // 每帧: 方向键 + (M 开启时) 鼠标边缘滚屏, 原版 6_321 enterFrame
  if (zoom < 1) return;     // 全图模式下锁定
  let dx = 0, dy = 0;       // dy 为世界坐标 (上=+)
  if (heldKeys.has('left')) dx -= SCROLL_SPEED;
  if (heldKeys.has('right')) dx += SCROLL_SPEED;
  if (heldKeys.has('up')) dy += SCROLL_SPEED;
  if (heldKeys.has('down')) dy -= SCROLL_SPEED;
  if (G.mouseScroll && typeof G.mx === 'number' && !Number.isNaN(G.mx)) {
    const sx = w2sX(G.mx), sy = w2sY(G.my);
    if (sx < EDGE) dx -= SCROLL_SPEED; else if (sx > W - EDGE) dx += SCROLL_SPEED;
    if (sy < EDGE) dy += SCROLL_SPEED; else if (sy > H - EDGE) dy -= SCROLL_SPEED;
  }
  if (dx || dy) { cam.x += dx; cam.y -= dy; clampCam(); }
}
// 原版 minimap 点击: 跳转摄像机 (绑在侧栏小地图 DOM)
mmCv.addEventListener('click', mmJump);
let mmDrag = false;
mmCv.addEventListener('mousedown', () => { mmDrag = true; });
window.addEventListener('mouseup', () => { mmDrag = false; });
mmCv.addEventListener('mousemove', (e) => { if (mmDrag) mmJump(e); });   // 原版 viseurMiniMap 拖拽
function mmJump(e) {
  // CSS 拉伸归一 (canvas 161x150, 显示 165x152): 用 getBoundingClientRect 换算
  const r = mmCv.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width * MM.w;
  const fy = (e.clientY - r.top) / r.height * MM.h;
  // 与缩略图同坐标系: 地图位图 (世界 x 0..2070, y -1440(北)..480(南), 顶=北, 无翻转)
  const wx = MAP_ORIGIN.x + fx / MM.w * MAP_W;
  const wy = MAP_ORIGIN.y + fy / MM.h * MAP_H;
  cam.x = wx - W / (2 * zoom);
  cam.y = wy - H / (2 * zoom);   // cam.y = 屏幕顶边世界 y
  clampCam();
}
// 侧栏开关按钮 (原版 menu.informations 可点击按钮, 鼠标为主)
function refreshToggleBtns() {
  const set = (id, on) => { const b = document.getElementById(id); if (b) b.classList.toggle('on', on); };
  set('tHp', G.showHp); set('tScroll', G.mouseScroll); set('tArea', G.showBuildArea); set('tZoom', zoom < 1);
  // Su37 按钮: 冷却中禁用并显示剩余秒数 (原版 compteur.text = ".. wait" / "ready")
  const b = document.getElementById('tSu37');
  if (b) {
    // 原版: su37 要在 m31 解锁后才出现在建造菜单 (unlocker.su37)
    const unlocked = G.unlocker.su37;
    b.disabled = !unlocked || !SU37.available;
    b.classList.toggle('on', G.su37Aiming);
    b.textContent = !unlocked ? 'Su37 未解锁'
      : SU37.available ? 'Su37 空袭'
      : 'Su37 ' + Math.ceil(SU37.cool / 30) + 's';
  }
}
function bindToggle(id, fn) {
  const b = document.getElementById(id);
  if (b) b.onclick = () => { fn(); refreshToggleBtns(); };
}
bindToggle('tHp', () => G.showHp = !G.showHp);
bindToggle('tScroll', () => G.mouseScroll = !G.mouseScroll);
bindToggle('tArea', () => G.showBuildArea = !G.showBuildArea);
bindToggle('tZoom', () => toggleZoom());
bindToggle('tSu37', () => su37Start());
// 二选一面板按钮 (原版 sprite 989 两个按钮的 on(press))
{
  const b1 = document.getElementById('upUnlock');
  const b2 = document.getElementById('upInterest');
  if (b1) b1.onclick = () => { panelPickUnlock(); refreshPanelButtons(); syncPanel(); };
  if (b2) b2.onclick = () => { panelPickInterest(); refreshPanelButtons(); syncPanel(); };
}
// 面板 DOM 显隐跟随 G.panelOpen (原版 debloquerArme._x = 400 / -500 切换)
function syncPanel() {
  const el = document.getElementById('unlockPanel');
  if (el) el.classList.toggle('show', G.panelOpen);
}
cv.addEventListener('click', (e) => {
  if (G.lost || G.won) return;
  // Su37 瞄准中: 点击地图 = 空袭落点 (原版 zone = _xmouse/_ymouse)
  if (G.su37Aiming) { su37Launch(G.mx, G.my); return; }
  // 修理面板点击 (原版 819: 条上 on(press)=repairIfCan, autor 按钮 on(press)=swithRepair)
  {
    const rr = cv.getBoundingClientRect();
    const cx = e.clientX - rr.left, cy = e.clientY - rr.top;
    const px = 8, py = H - 112, pw = 244;
    const sel0 = G.selected;
    if (sel0) {
      if (cx >= px + pw - 22 && cx <= px + pw - 5 && cy >= py + 84 && cy <= py + 101) {
        sel0.autoRepair = !sel0.autoRepair; playSfx('selectionUnite', 0.35); return;
      }
      if (cx >= px + 4 && cx <= px + 240 && cy >= py + 56 && cy <= py + 77) {
        const price = repairPrice(sel0);
        if (price <= 0) return;
        if (G.euros < price) playSfx('cannot', 0.4);
        else { G.euros -= price; sel0.hp = sel0.maxHp; playSfx('selectionUnite', 0.4); }
        return;
      }
    }
  }
  // 点中已有塔 → 选中 (供 U 升级对空)
  const hit = G.turrets.find(t => Math.hypot(t.x - G.mx, t.y - G.my) < 20);
  if (hit) { G.selected = hit; return; }
  G.selected = null;
  if (!G.shopSel) return;
  const s = STRUCTURES[G.shopSel];
  if (G.euros < s.cost) { playSfx('cannot', 0.35); return; }
  if (!buildAllowedAt(G.mx, G.my)) { playSfx('cannot', 0.35); return; }
  G.euros -= s.cost;
  G.turrets.push(new Turret(G.shopSel, G.mx, G.my));
  playSfx('creationUnite', 0.4);   // 原版 creationUnite.start()
  boom(G.mx, G.my, 6);
});
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const sel = G.selected || G.turrets.find(t => Math.hypot(t.x - G.mx, t.y - G.my) < 20);
  const k = e.key.toLowerCase();
  // 原版 keyDown 映射: S=卖出(按血量75%折价) R=修理 空格=取消 H=血条 M=滚屏 C=建造区 G=全图
  if (k === 's') {
    if (sel) { G.euros += sel.sellPrice(); G.turrets = G.turrets.filter(t => t !== sel); G.selected = null; }
  }
  if (k === 'r') {   // 原版 819 repairIfCan(): 全额修复, 扣 repairPrice
    if (sel && sel.hp < sel.maxHp) {
      const price = repairPrice(sel);
      if (G.euros < price) playSfx('cannot', 0.4);
      else { G.euros -= price; sel.hp = sel.maxHp; playSfx('selectionUnite', 0.4); }
    }
  }
  if (k === 't') {   // 原版 818 autor: 切换 auto repair ON/OFF
    if (sel) { sel.autoRepair = !sel.autoRepair; playSfx('selectionUnite', 0.35); }
  }
  if (k === 'u') {
    // 对空升级: 花费 造价×0.6, 任意塔获得对空能力
    if (sel && !sel.aa) {
      if (sel.upgradeAA()) boom(sel.x, sel.y, 10);
    }
  }
  if (k === 'h') G.showHp = !G.showHp;
  if (k === 'm') G.mouseScroll = !G.mouseScroll;
  if (k === 'c') G.showBuildArea = !G.showBuildArea;
  if (k === 'g') toggleZoom();
  if (e.key === ' ') { G.shopSel = null; G.selected = null; e.preventDefault(); buildShop(); }
});

// ---------------- 启动 ----------------
refreshToggleBtns();
buildShop();
hud();
setInterval(tick, 1000 / 30);
