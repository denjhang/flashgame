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

// 建造菜单 (原版解锁关卡 iMission > N)
const SHOP = [
  { id:'m60',       unlock:0 },
  { id:'gatling',   unlock:0 },
  { id:'canon75',   unlock:7 },
  { id:'canon105',  unlock:11 },
  { id:'canon105D', unlock:16 },
  { id:'crotale',   unlock:5 },
  { id:'canon125',  unlock:22 },
  { id:'MLRS',      unlock:28 },
  { id:'MTHEL',     unlock:30 },
  { id:'pluton',    unlock:36 },
];

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


function w2sX(x) { return (x - cam.x) * zoom; }
function w2sY(y) { return (y - cam.y) * zoom; }   // 世界 y = Flash 屏幕坐标 (y 向下=南), 无翻转
function s2wX(sx) { return sx / zoom + cam.x; }
function s2wY(sy) { return sy / zoom + cam.y; }

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

// ---------------- 原版炮塔外观 (86 帧库 shape→PNG) + 爆炸动画 + BGM ----------------
const TURRET_IMG = {};
// 权威对号 deobf/data/turret_frames.json (DefineSprite 86 帧标签→shape):
// gatling=56 canon75=57 canon105=58 canon105D=59 radar=61 crotale=62 canon125=65
// MLRS=67 pluton=69(+80枪口焰) MTHEL=83(spr)+85 ; m60 无帧(原版塔库无 m60)
const TURRET_SRC = {
  gatling: 'assets/turrets/56.png', canon75: 'assets/turrets/57.png',
  canon105: 'assets/turrets/58.png', canon105D: 'assets/turrets/59.png',
  crotale: 'assets/turrets/62.png', canon125: 'assets/turrets/65.png',
  radar: 'assets/turrets/61.png', MLRS: 'assets/turrets/67.png',
  pluton: 'assets/turrets/69.png', MTHEL: 'assets/turrets/85.png',
};
for (const k in TURRET_SRC) {
  const im = new Image();
  im.src = TURRET_SRC[k];
  TURRET_IMG[k] = im;
}
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
// 敌方武器塔分层外观 (DefineSprite_173 帧库, deobf/data/turret_frames.json objs 深度序):
//   g: 旋转炮管 sprite (eturrets_spr/DefineSprite_N/1.png, 原版带开火动画帧)
//   s: 静态件 shape (eturrets/N.png, 底座/护盾/装饰), 按 objs 顺序绘制 (先下后上)
// 重复出现的 id (如 105mmD 双管 [108,108]) 去重为一次, 位置差异待矩阵解析
const ETURRET_PARTS = {
  m60Brad:       [{ s: 'eturrets/138.png' }, { g: 92 }, { s: 'eturrets/139.png' }],
  '75mmBrad':    [{ s: 'eturrets/140.png' }, { g: 103 }, { s: 'eturrets/141.png' }],
  gatlingAmx10:  [{ g: 98 }, { s: 'eturrets/143.png' }],
  '75mmAmx10':   [{ g: 103 }, { s: 'eturrets/144.png' }],
  canon105:      [{ g: 108 }, { s: 'eturrets/110.png' }],
  '105mmAbrams': [{ g: 108 }, { s: 'eturrets/147.png' }],
  canon105D:     [{ g: 108 }, { s: 'eturrets/112.png' }],
  '105mmDAbrams': [{ g: 108 }, { s: 'eturrets/148.png' }],
  crotale:       [{ s: 'eturrets/117.png' }, { s: 'eturrets_spr/DefineSprite_121/1.png' }, { g: 122 }],
  crotaleAbrams: [{ s: 'eturrets/149.png' }, { s: 'eturrets_spr/DefineSprite_121/1.png' }, { s: 'eturrets/150.png' }, { g: 122 }],
  crotaleTigre:  [{ g: 157 }, { g: 161 }],
  navireCrotale: [{ s: 'eturrets/163.png' }, { g: 164 }],
  canon125:      [{ g: 125 }, { s: 'eturrets/127.png' }],
  '125mmT90':    [{ g: 125 }, { s: 'eturrets/152.png' }],
  MLRS:          [{ g: 128 }, { s: 'eturrets/130.png' }],
  pluton:        [{ g: 80 }, { s: 'eturrets/132.png' }],
  MTHEL:         [{ g: 83 }, { s: 'eturrets/134.png' }, { s: 'eturrets_spr/DefineSprite_136/1.png' }],
  gatlingDT90:   [{ g: 153 }, { s: 'eturrets/152.png' }],
  gatlingDTigre: [{ g: 153 }, { g: 157 }, { s: 'eturrets_spr/DefineSprite_160/1.png' }],
  radar:         [{ s: 'eturrets_spr/DefineSprite_115/1.png' }],
  radarMobile:   [{ s: 'eturrets_spr/DefineSprite_115/1.png' }],
  Yamato460:     [{ s: 'eturrets/166.png' }, { g: 167 }, { s: 'eturrets/169.png' }, { s: 'eturrets/170.png' }, { s: 'eturrets/171.png' }, { s: 'eturrets/172.png' }],
};
// 炮管 sprite 帧结构 (deobf/data/sprite_frames.json 二进制解析; deobf/data/gun_fire_frames.json 像素实测):
//   帧 1 = 静态 base (炮管朝上, 无焰); FrameLabel "fire" 在第 2 帧 = 开火起点;
//   后续帧为该武器的开火/后坐动画 (由 PNG alpha 内容量实测出连续段)
const GUN_FIRE_SEQ = {
  92: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
  98: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
  103: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
  108: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
  122: [2,3,4,5],
  125: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35],
  128: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37],
  153: [2,3],
  157: [],
  164: [2,3,4,5],
  167: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35],
  80: [], 161: [],   // 帧 2 起为空白 → 无可用开火帧 (回退静态帧, 如实记录)
};
const ET_PART_IMG = {};
function partImg(path) {
  if (!ET_PART_IMG[path]) { const im = new Image(); im.src = 'assets/' + path; ET_PART_IMG[path] = im; }
  return ET_PART_IMG[path];
}
function gunFramePath(id, f) {
  return 'eturrets_spr/DefineSprite_' + id + '/' + f + '.png';
}
// 选定炮管当前显示的帧: 开火时按 fireT 顺序播开火序列, 播完/未开火回静态帧 1
function gunFrameFor(id, fireT) {
  const seq = GUN_FIRE_SEQ[id];
  if (fireT > 0 && seq && seq.length) {
    const idx = seq.length - fireT;
    if (idx >= 0 && idx < seq.length) return seq[idx];
  }
  return 1;
}
function gunFireLen(id) { const s = GUN_FIRE_SEQ[id]; return s ? s.length : 0; }
// 从部件表取该武器炮管的开火动画长度 (取所有 gun 件里最长的)
function partsFireLen(parts) {
  let n = 0;
  if (parts) for (const p of parts) if (p.g) n = Math.max(n, gunFireLen(p.g));
  return n;
}
// 玩家武器 → 173 库武器 ID (玩家 86 库的 sprite 88 实际是 173 库 m60 帧底座; 玩家塔炮管与 173 库底层 sprite 同源)
//   gatling86=56 → 173库 gatlingAmx10 (sprite 98 机枪 + 143 护盾)
//   canon75=57 → 173库 75mmAmx10 (sprite 103 + 144 底座)
//   canon105=58 → 173库 canon105 (sprite 108 炮管 + 110 底座)
//   canon105D=59 → 173库 canon105D (sprite 108 双管 + 112 底座)
//   radar=61 → 173库 radar (sprite 115)
//   crotale=62 → 173库 crotale (117 底座 + 121 弹簧 + 122 91帧导弹)
//   canon125=65 → 173库 canon125 (sprite 125 炮管 + 127 底座; 86 库另用 sprite 64 作底盘 5 层)
//   MLRS=67 → 173库 MLRS (sprite 128 157帧 + 130 底座)
//   pluton=69+80 → 173库 pluton (sprite 80 枪口焰 + 132 底座)
//   MTHEL=83+85 → 173库 MTHEL (sprite 83 激光 + 134 底座 + 136)
//   m60=88 → 173库 m60Brad (sprite 138 底座 + 92 机枪 + 139 后座)
const PLAYER_ETURRET = {
  m60: 'm60Brad', gatling: 'gatlingAmx10', canon75: '75mmAmx10',
  canon105: 'canon105', canon105D: 'canon105D', canon125: 'canon125',
  crotale: 'crotale', MLRS: 'MLRS', pluton: 'pluton', MTHEL: 'MTHEL',
  radar: 'radar',
};
// 玩家塔底座 (86 库原底盘, 旋转时不动的固定件)  ← 173 库 [底座] 视觉差, 但与玩家塔对应
// 86 库原 sprite 56/57/58/59/61/62/65/67/69/85/88 → 173 库同源 shape, 已存在于 eturrets/
// 通过 PLAYER_ETURRET 映射到 ETURRET_PARTS 自动复用, 不再单独维护
function playerParts(id) { return ETURRET_PARTS[PLAYER_ETURRET[id]]; }
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
function su37Img() {
  if (!SU37.img) { SU37.img = new Image(); SU37.img.src = SU37_IMG_SRC; }
  return SU37.img;
}
function su37Start() {   // 侧栏按钮: 选进入边, 等待玩家点击地图落点
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
      for (const u of G.units) {
        if (u.hp <= 0 && !u.dead) { u.dead = true; G.euros += u.bounty; G.score += u.bounty; }
      }
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
  units: [], turrets: [], shells: [], effects: [],
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
  }
  update() {
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
          this.fireT = partsFireLen(ETURRET_PARTS[this.weaponId]);
          spawnShell(this.x, this.y, t, this.weapon, 'ennemy');
        }
      }
    }
  }
}

function nearestTurret(x, y, range) {
  let best = null, bd = range;
  for (const t of G.turrets) {
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
    this.aa = AA_WEAPONS.includes(id);   // 机枪/导弹天生对空; 其余可付费升级
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
    if (this.hp <= 0) return;   // 被摧毁的塔不再索敌开火
    if (this.fireT > 0) this.fireT--;   // 炮管开火帧倒计时
    if (this.autoRepair && this.hp < this.maxHp && G.euros >= REPAIR_COST) {
      const n = Math.min(5, this.maxHp - this.hp, Math.floor(G.euros / REPAIR_COST));
      this.hp += n; G.euros -= n * REPAIR_COST;
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
        this.fireT = partsFireLen(playerParts(this.id));   // 播完整开火动画
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
    for (const [rr, pm] of SPLIT) {
      for (const u of victims) {
        if (u.hp <= 0) continue;
        const d = Math.hypot(u.x - tx, u.y - ty);
        if (d <= range * rr) {
          if (u.aa) u.hp -= power * pm * ANTI_AIR_MULT;
          else u.hp -= power * pm;
        }
      }
    }
    // 击杀赏金
    for (const u of victims) {
      if (u.hp <= 0 && !u.dead) {
        u.dead = true;
        G.euros += u.bounty;
        G.score += u.bounty;
        const utype = u.type === 'Yamato' || u.type === 'navire' ? 'large2' : 'small';
        boomTyped(u.x, u.y, 8, utype);
        shellImpactSfx(SHELL_KIND[s.turretId] || 'bullet');
      }
    }
  } else {
    for (const t of victims) {
      if (t.hp <= 0) continue;
      if (Math.hypot(t.x - tx, t.y - ty) <= range * 2) t.hp -= power;
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
function boomTyped(x, y, r, type) {
  const n = (EXPLOSION_TYPED[type] || EXPLOSION_TYPED.small).length;
  G.effects.push({ x, y, r, life: n, life0: n, type: type || 'small' });
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

function endWave() {
  // 利息 (giveIntrest): euros = floor(euros × (1 + interest/100))
  if (G.wave > 1) G.euros = Math.floor(G.euros * (1 + G.interest / 100));
  G.waveActive = false;
  G.interWave = 200;
  if (G.wave >= WAVES.length && G.units.every(u => u.hp <= 0 || u.dead)) {
    G.won = true;
  }
  hud();
}

// ---------------- 主循环 ----------------
function tick() {
  if (G.lost || G.won) return;
  G.frame++;
  scrollCamera();
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
    } else if (G.units.every(u => u.hp <= 0 || u.dead || u.reached)) {
      endWave();
    }
  } else {
    if (--G.interWave <= 0) startWave();
  }

  for (const u of G.units) {
    u.update();
    if (u.reached && !u.dead) { u.dead = true; G.losses++; G.lost = true; }  // 抵达基地 = 失败
  }
  G.units = G.units.filter(u => !u.dead);
  for (const t of G.turrets) t.update();

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
    if (t.hp <= 0) {
      ctx.fillStyle = '#333';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.restore(); continue;
    }
    // 玩家塔统一走 173 库分层部件渲染 (PLAYER_ETURRET 映射后复用 ETURRET_PARTS)
    const parts = playerParts(t.id);
    if (parts) {
      for (const p of parts) {
        if (p.g) {
          const f = gunFrameFor(p.g, t.fireT);
          const im = partImg(gunFramePath(p.g, f));
          if (!(im.complete && im.naturalWidth)) continue;
          ctx.save(); ctx.rotate(t.rot + Math.PI / 2);
          ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight + im.naturalHeight * 0.12);
          ctx.restore();
        } else {
          const im = partImg(p.s);
          if (!(im.complete && im.naturalWidth)) continue;
          ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
        }
      }
    } else if (t.id === 'radar') {
      // 雷达: 173 库 radar=[115] 静态 + 扫描波纹
      const ph = (Date.now() / 900) % 1;
      ctx.strokeStyle = `rgba(120,220,255,${0.5 * (1 - ph)})`;
      ctx.beginPath(); ctx.arc(0, 0, 40 + ph * 70, 0, 7); ctx.stroke();
    } else if (TURRET_IMG[t.id] && TURRET_IMG[t.id].complete && TURRET_IMG[t.id].naturalWidth) {
      // 旧 86 库兜底 (万一新映射漏了一个)
      const im = TURRET_IMG[t.id];
      const big = (t.id === 'MLRS' || t.id === 'pluton' || t.id === 'MTHEL');
      if (big) {
        const s = 0.35;
        ctx.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2,
                      im.naturalWidth * s, im.naturalHeight * s);
      } else {
        ctx.save(); ctx.rotate(t.rot + Math.PI / 2);
        ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight + 12,
                      im.naturalWidth, im.naturalHeight);
        ctx.restore();
      }
    } else {
      // 缺图兜底
      ctx.save(); ctx.rotate(t.rot);
      ctx.fillStyle = t.id.startsWith('crotale') ? '#aaf' : '#ba6';
      ctx.fillRect(0, -3, 18, 6);
      ctx.restore();
    }
    // 对空标记 (蓝色小点)
    if (t.aa) { ctx.fillStyle = '#6cf'; ctx.fillRect(6, -14, 4, 4); }
    // 血条 (原版 H 键开关)
    if (G.showHp) {
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
    const sx = w2sX(u.x), sy = w2sY(u.y);
    // 车体阴影 (原版 428_unit enterFrame: ombre 同 rot 旋转, 偏移 +4/+4,
    // colorTransform mult RGB=0 alpha=0.352 → 全黑半透明). 先画 = 在车体下方
    const sim = SHADOW_IMG[u.type];
    if (sim && sim.complete && sim.naturalWidth) {
      const big = u.type === 'Yamato' ? 2.4 : 1;
      ctx.save();
      ctx.translate(sx + SHADOW_OFFSET * zoom, sy + SHADOW_OFFSET * zoom);   // y-down 世界系, +4=屏幕右下
      ctx.scale(zoom, zoom);
      ctx.rotate(u.rot + Math.PI / 2);
      ctx.globalAlpha = SHADOW_ALPHA;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(sim, -sim.naturalWidth / 2 * big, -sim.naturalHeight / 2 * big,
                    sim.naturalWidth * big, sim.naturalHeight * big);
      ctx.restore();
    }
    ctx.save(); ctx.translate(sx, sy); ctx.scale(zoom, zoom);
    const img = UNIT_IMG[u.type];
    if (img && img.complete && img.naturalWidth) {
      ctx.rotate(u.rot + Math.PI / 2);
      const big = u.type === 'Yamato' ? 2.4 : 1;
      ctx.drawImage(img, -img.naturalWidth / 2 * big, -img.naturalHeight / 2 * big,
                    img.naturalWidth * big, img.naturalHeight * big);
    } else {
      ctx.rotate(-u.rot);
      const col = { jeep:'#c66', tigre:'#6cf', navire:'#6ae' }[u.type] || '#c66';
      ctx.fillStyle = col;
      ctx.fillRect(-8, -5, 16, 10);
    }
    ctx.restore();
    // 武器塔分层叠加 (173 库 objs 深度序: 静态件居中, 炮管随瞄准角 -rot-π/2 旋转)
    if (u.weapon) {
      const parts = ETURRET_PARTS[u.weaponId];
      if (parts) {
        for (const p of parts) {
          if (p.g) {
            const f = gunFrameFor(p.g, u.fireT);
            const im = partImg(gunFramePath(p.g, f));
            if (!(im.complete && im.naturalWidth)) continue;
            ctx.save(); ctx.translate(sx, sy); ctx.scale(zoom, zoom);
            ctx.rotate(u.rot + Math.PI / 2);
            // 炮管 sprite 注册点在底座环 (底部中心)
            ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight + im.naturalHeight * 0.12);
            ctx.restore();
          } else {
            const im = partImg(p.s);
            if (!(im.complete && im.naturalWidth)) continue;
            ctx.save(); ctx.translate(sx, sy); ctx.scale(zoom, zoom);
            ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
            ctx.restore();
          }
        }
      }
    }
    if (G.showHp) {
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
  // Su37 空袭 (飞行中的战机, 在迷雾之前绘制)
  su37Draw();
  // Su37 瞄准提示 (原版 zoneBombardement: 光标区标记)
  if (G.su37Aiming) {
    const sx = w2sX(G.mx), sy = w2sY(G.my);
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
}
function buildShop() {
  const el = document.getElementById('shop');
  el.innerHTML = '';
  for (const s of SHOP) {
    const locked = G.wave < s.unlock;
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
    b.disabled = !SU37.available;
    b.classList.toggle('on', G.su37Aiming);
    b.textContent = SU37.available ? 'Su37 空袭'
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
