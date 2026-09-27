// TCS H5 重制 — 玩法逻辑按 deobf/GAME_LOGIC.md 还原
// 数据: WEAPONS/STRUCTURES/CHASSIS/WAVES (data.js)
'use strict';

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const BASE_LINE_Y = 560;     // 基地防线 (世界坐标, y 最大=最北; 原版 _y>477 失败线)

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
  VIS = [{ x: 480, y: WORLD.y0 + 80, r: BASE_VIS }];
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
const MAP_ORIGIN = { x: WORLD.x0, y: WORLD.y1 };             // 位图顶=世界上缘
const cam = { x: WORLD.x0 + (WORLD.x1 - WORLD.x0 - 960) / 2, y: 0 };  // 初始居中

function w2sX(x) { return x - cam.x; }
function w2sY(y) { return (MAP_ORIGIN.y - y) - cam.y; }      // y 翻转
function s2wX(sx) { return sx + cam.x; }
function s2wY(sy) { return MAP_ORIGIN.y - (sy + cam.y); }

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

// ---------------- 原版炮塔外观 (86 帧库 shape→PNG) + 爆炸动画 + BGM ----------------
const TURRET_IMG = {};
const TURRET_SRC = {
  gatling: 'assets/turrets/56.png', canon75: 'assets/turrets/57.png',
  canon105: 'assets/turrets/58.png', canon105D: 'assets/turrets/59.png',
  crotale: 'assets/turrets/62.png', canon125: 'assets/turrets/65.png',
  radar: 'assets/turrets/60.png', MLRS: 'assets/turrets/66.png',
  pluton: 'assets/turrets/68.png', MTHEL: 'assets/turrets/84.png',
};
for (const k in TURRET_SRC) {
  const im = new Image();
  im.src = TURRET_SRC[k];
  TURRET_IMG[k] = im;
}
const EXPLOSION_FRAMES = [1, 2, 3, 4].map(i => {
  const im = new Image();
  im.src = 'assets/explosion/' + i + '.png';
  return im;
});
// BGM (原版 musics 循环: hellMarch 候选 1157)
let bgmAudio = null;
try {
  bgmAudio = new Audio('assets/music/bgm_main.mp3');
  bgmAudio.loop = true;
  bgmAudio.volume = 0.5;
  const startBgm = () => {
    bgmAudio.play().catch(() => {});
    window.removeEventListener('pointerdown', startBgm);
    window.removeEventListener('keydown', startBgm);
  };
  window.addEventListener('pointerdown', startBgm);
  window.addEventListener('keydown', startBgm);   // 浏览器自动播放策略: 首次交互启动
} catch (e) { /* 无 Audio 环境(无头)忽略 */ }

// ---------------- 游戏状态 ----------------
const G = {
  euros: 850, interest: 6, score: 0,
  wave: 0,                 // 已开始的波数 (1..44)
  units: [], turrets: [], shells: [], effects: [],
  spawnQueue: [],          // 本波待生成 [unitType, weapon, route, delayTicks]
  spawnTimer: 0,
  waveActive: false, interWave: 120,
  lost: false, won: false,
  shopSel: 'm60', placing: null,
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
    this.speed = c[0] * 0.62;
    this.rotateSpeed = c[2] * 0.09;
    this.hp = this.maxHp = c[3];
    this.bounty = c[4];
    this.aa = (type === 'tigre');             // 直升机
    this.weapon = weaponId !== 'null' ? WEAPONS[weaponId] : null;
    this.weaponId = weaponId;
    this.cool = 0;
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
    if (d < Math.max(12, this.speed * 5)) {
      this.pt++;
      if (this.pt >= this.route.length) this.reached = true;
    }
    // 敌方武器开火 (打我方炮塔)
    if (this.weapon) {
      this.cool--;
      if (this.cool <= 0) {
        const t = nearestTurret(this.x, this.y, this.weapon[1]);
        if (t) {
          this.cool = this.weapon[2] * 3;
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
      const rs = (6 - this.w[0]) * 0.02 + 0.02;
      this.rot += Math.sign(da) * Math.min(Math.abs(da), rs);
      // 开火 (冷却 = 威力因子 × 系数)
      if (Math.abs(da) < 0.3 && this.cool <= 0 && bd <= this.w[1]) {
        this.cool = this.w[2] * 2;
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
        boom(u.x, u.y, 8);
      }
    }
  } else {
    for (const t of victims) {
      if (t.hp <= 0) continue;
      if (Math.hypot(t.x - tx, t.y - ty) <= range * 2) t.hp -= power;
    }
  }
  boom(tx, ty, 4 + power / 40);
}

function boom(x, y, r) {
  G.effects.push({ x, y, r, life: 14 });
}

// ---------------- 波次调度 (startMission) ----------------
function startWave() {
  if (G.wave >= WAVES.length) return;
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
  computeVisibility();

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
    if (u.reached && !u.dead) { u.dead = true; G.lost = true; }  // 抵达基地 = 失败
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
}

// ---------------- 绘制 (原版地图 map.jpg + 世界坐标→屏幕变换) ----------------
const mapImg = new Image();
mapImg.src = 'map.jpg';

function clampCam() {
  cam.x = Math.max(WORLD.x0 - 40, Math.min(WORLD.x1 + 40 - W, cam.x));
  // 世界 y 向上; 屏幕范围对应 [MAP_ORIGIN.y - cam.y - H, MAP_ORIGIN.y - cam.y]
  const yTop = WORLD.y1 + 40;      // 最北可见
  const yBot = WORLD.y0 - 40;      // 最南可见
  cam.y = Math.max(MAP_ORIGIN.y - yTop, Math.min(MAP_ORIGIN.y + H - yBot, cam.y));
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  clampCam();
  // 地图背景 (世界坐标 → 屏幕)
  ctx.drawImage(mapImg, w2sX(MAP_ORIGIN.x), w2sY(MAP_ORIGIN.y), MAP_W, MAP_H);

  // 路线虚线 (低透明度导航提示)
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.setLineDash([10, 14]);
  for (const rn in ROUTES) {
    const r = ROUTES[rn];
    ctx.beginPath();
    ctx.moveTo(w2sX(r[0][0]), w2sY(r[0][1]));
    for (let i = 1; i < r.length; i++) ctx.lineTo(w2sX(r[i][0]), w2sY(r[i][1]));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 基地红线 (北方 = y 最大; 原版 _y > 477 失败线的镜像)
  ctx.strokeStyle = '#f44'; ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, w2sY(BASE_LINE_Y)); ctx.lineTo(W, w2sY(BASE_LINE_Y));
  ctx.stroke();
  ctx.setLineDash([]);

  for (const t of G.turrets) {
    const sx = w2sX(t.x), sy = w2sY(t.y);
    if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
    if (t.hp <= 0) {
      ctx.fillStyle = '#333';
      ctx.fillRect(sx - 10, sy - 10, 20, 20);
      continue;
    }
    // 雷达站: 扫描波纹 (迷雾驱散可视化)
    if (t.id === 'radar') {
      const ph = (Date.now() / 900) % 1;
      ctx.strokeStyle = `rgba(120,220,255,${0.5 * (1 - ph)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 40 + ph * 70, 0, 7);
      ctx.stroke();
    }
    ctx.save(); ctx.translate(sx, sy);
    // 底座 (固定)
    ctx.fillStyle = '#3a4a3a';
    ctx.fillRect(-11, -11, 22, 22);
    // 原版炮塔外观: radar/MLRS/pluton/MTHEL 整图 (不旋转); 其余炮管图随 rot 旋转
    if (t.id === 'radar') {
      const ph = (Date.now() / 900) % 1;
      ctx.strokeStyle = `rgba(120,220,255,${0.5 * (1 - ph)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 40 + ph * 70, 0, 7);
      ctx.stroke();
      const im = TURRET_IMG.radar;
      if (im && im.complete && im.naturalWidth)
        ctx.drawImage(im, -im.naturalWidth / 4, -im.naturalHeight / 4,
                      im.naturalWidth / 2, im.naturalHeight / 2);
    } else if (TURRET_IMG[t.id] && TURRET_IMG[t.id].complete && TURRET_IMG[t.id].naturalWidth) {
      const im = TURRET_IMG[t.id];
      const big = (t.id === 'MLRS' || t.id === 'pluton' || t.id === 'MTHEL');
      if (big) {
        const s = 0.35;
        ctx.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2,
                      im.naturalWidth * s, im.naturalHeight * s);
      } else {
        // 炮管图 (17x81, 原图朝上): 旋转 = -rot - π/2
        ctx.save();
        ctx.rotate(-t.rot - Math.PI / 2);
        ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight + 12,
                      im.naturalWidth, im.naturalHeight);
        ctx.restore();
      }
    } else {
      // m60 / 缺图兜底: 画炮管线条
      ctx.save(); ctx.rotate(-t.rot);
      ctx.fillStyle = t.id.startsWith('crotale') ? '#aaf' : '#ba6';
      ctx.fillRect(0, -3, 18, 6);
      ctx.restore();
    }
    ctx.restore();
    // 对空标记 (蓝色小点)
    if (t.aa) { ctx.fillStyle = '#6cf'; ctx.fillRect(sx + 6, sy - 14, 4, 4); }
    // 血条
    ctx.fillStyle = '#300'; ctx.fillRect(sx - 10, sy - 16, 20, 3);
    ctx.fillStyle = '#4f4'; ctx.fillRect(sx - 10, sy - 16, 20 * t.hp / t.maxHp, 3);
    // 射程圈 (选中)
    if (t === G.selected && t.w) {
      ctx.strokeStyle = 'rgba(255,255,150,.4)';
      ctx.beginPath(); ctx.arc(sx, sy, t.w[1], 0, 7); ctx.stroke();
      ctx.fillStyle = '#ff8'; ctx.font = '11px monospace';
      const msg = t.aa ? '[对空OK] S卖 R修' : `按U升级对空 $${t.aaUpgradeCost()}`;
      ctx.fillText(msg, sx - 30, sy + 30);
    }
  }
  for (const u of G.units) {
    if (!isVisible(u.x, u.y)) continue;   // 迷雾中的敌人不可见
    const sx = w2sX(u.x), sy = w2sY(u.y);
    const img = UNIT_IMG[u.type];
    if (img && img.complete && img.naturalWidth) {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-u.rot - Math.PI / 2);
      const big = u.type === 'Yamato' ? 2.4 : 1;
      ctx.drawImage(img, -img.naturalWidth / 2 * big, -img.naturalHeight / 2 * big,
                    img.naturalWidth * big, img.naturalHeight * big);
      ctx.restore();
    } else {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-u.rot);
      const col = { jeep:'#c66', tigre:'#6cf', navire:'#6ae' }[u.type] || '#c66';
      ctx.fillStyle = col;
      ctx.fillRect(-8, -5, 16, 10);
      ctx.restore();
    }
    ctx.fillStyle = '#300'; ctx.fillRect(sx - 9, sy - 14, 18, 3);
    ctx.fillStyle = '#f43'; ctx.fillRect(sx - 9, sy - 14, 18 * Math.max(0, u.hp) / u.maxHp, 3);
  }
  for (const s of G.shells) {
    if (!isVisible(s.x, s.y)) continue;   // 飞入迷雾的炮弹不可见
    const sx = w2sX(s.x), sy = w2sY(s.y);
    ctx.fillStyle = s.side === 'ally' ? '#ff6' : '#f66';
    ctx.fillRect(sx - 2, sy - 2, 4, 4);
  }
  for (const e of G.effects) {
    const sx = w2sX(e.x), sy = w2sY(e.y);
    const fi = Math.min(3, Math.floor((14 - e.life) / 14 * 4));
    const im = EXPLOSION_FRAMES[fi];
    if (im && im.complete && im.naturalWidth) {
      const s = Math.max(0.4, e.r / 30);
      ctx.drawImage(im, sx - 105 * s, sy - 108 * s, 210 * s, 217 * s);
    } else {
      ctx.strokeStyle = `rgba(255,${120 + e.life * 8},60,${e.life / 14})`;
      ctx.beginPath(); ctx.arc(sx, sy, e.r * (14 - e.life) / 3, 0, 7); ctx.stroke();
    }
  }
  // 建造预览
  if (G.shopSel) {
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '11px monospace';
    ctx.fillText(SHOP.find(s => s.id === G.shopSel).id, 8, H - 8);
  }

  // ---- 战争迷雾 (最后绘制, 视野源换算到屏幕坐标) ----
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, W, H);
  fogCtx.fillStyle = 'rgba(6,10,6,0.88)';
  fogCtx.fillRect(0, 0, W, H);
  fogCtx.globalCompositeOperation = 'destination-out';
  for (const s of VIS) {
    const fx = w2sX(s.x), fy = w2sY(s.y);
    const g = fogCtx.createRadialGradient(fx, fy, s.r * 0.55, fx, fy, s.r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    fogCtx.fillStyle = g;
    fogCtx.beginPath();
    fogCtx.arc(s.x, s.y, s.r, 0, 7);
    fogCtx.fill();
  }
  // 雷达站扫描圈提示 (可见的驱雾范围)
  ctx.drawImage(fogCv, 0, 0);
}

// 修改 draw 里的敌/弹绘制: 迷雾中不渲染 (在 draw 主循环内已由 VIS 过滤)

// ---------------- HUD / 商店 ----------------
function hud() {
  document.getElementById('hEuros').textContent = G.euros;
  document.getElementById('hInt').textContent = G.interest + '%';
  document.getElementById('hWave').textContent = Math.max(1, G.wave);
  document.getElementById('hScore').textContent = G.score;
}
function buildShop() {
  const el = document.getElementById('hShop');
  el.innerHTML = '';
  for (const s of SHOP) {
    const locked = G.wave < s.unlock;
    const sp = document.createElement('span');
    sp.className = 'sel' + (locked ? ' lock' : '') + (G.shopSel === s.id ? ' on' : '');
    sp.textContent = s.id + ' $' + STRUCTURES[s.id].cost;
    if (!locked) sp.onclick = () => { G.shopSel = s.id; buildShop(); };
    el.appendChild(sp);
  }
}

// ---------------- 输入 ----------------
cv.addEventListener('mousemove', (e) => {
  const r = cv.getBoundingClientRect();
  G.mx = s2wX(e.clientX - r.left); G.my = s2wY(e.clientY - r.top);   // 世界坐标
});
// 边缘滚动 + 方向键移动摄像机
setInterval(() => {
  if (typeof G.mx === 'number' && G.mx >= WORLD.x0 && G.mx <= WORLD.x1) {
    const sx = w2sX(G.mx);
    if (sx < 40) cam.x -= 12; else if (sx > W - 40) cam.x += 12;
  }
}, 50);
window.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowLeft') cam.x -= 40;
  if (k === 'ArrowRight') cam.x += 40;
  if (k === 'ArrowUp') cam.y -= 40;
  if (k === 'ArrowDown') cam.y += 40;
});
cv.addEventListener('click', () => {
  if (G.lost || G.won) return;
  // 点中已有塔 → 选中 (供 U 升级对空)
  const hit = G.turrets.find(t => Math.hypot(t.x - G.mx, t.y - G.my) < 20);
  if (hit) { G.selected = hit; return; }
  G.selected = null;
  if (!G.shopSel) return;
  const s = STRUCTURES[G.shopSel];
  if (G.euros < s.cost) return;
  // 只能在草地 (简化: 全场可建, 不与现有塔重叠)
  for (const t of G.turrets)
    if (Math.hypot(t.x - G.mx, t.y - G.my) < 26) return;
  // 原版 surfaceForBuild 规则: 敌军道路上不可建
  for (const rn in ROUTES) {
    const r = ROUTES[rn];
    for (let i = 0; i < r.length - 1; i++) {
      const ax = r[i][0], ay = r[i][1], bx = r[i+1][0], by = r[i+1][1];
      const L2 = (bx-ax)*(bx-ax) + (by-ay)*(by-ay);
      let t2 = ((G.mx-ax)*(bx-ax) + (G.my-ay)*(by-ay)) / L2;
      t2 = Math.max(0, Math.min(1, t2));
      if (Math.hypot(G.mx - (ax + (bx-ax)*t2), G.my - (ay + (by-ay)*t2)) < 45) return;
    }
  }
  G.euros -= s.cost;
  G.turrets.push(new Turret(G.shopSel, G.mx, G.my));
  boom(G.mx, G.my, 6);
});
window.addEventListener('keydown', (e) => {
  const sel = G.selected || G.turrets.find(t => Math.hypot(t.x - G.mx, t.y - G.my) < 20);
  if (e.key === 's' || e.key === 'S') {
    if (sel) { G.euros += sel.sellPrice(); G.turrets = G.turrets.filter(t => t !== sel); }
  }
  if (e.key === 'r' || e.key === 'R') {
    if (sel) {
      const n = Math.min(sel.maxHp - sel.hp, Math.floor(G.euros / REPAIR_COST));
      sel.hp += n; G.euros -= n * REPAIR_COST;
    }
  }
  if (e.key === 'u' || e.key === 'U') {
    // 对空升级: 花费 造价×0.6, 任意塔获得对空能力
    if (sel && !sel.aa) {
      if (sel.upgradeAA()) boom(sel.x, sel.y, 10);
    }
  }
  if (e.key === 'm' || e.key === 'M') {
    if (bgmAudio) bgmAudio.muted = !bgmAudio.muted;
  }
  if (e.key === ' ') { G.shopSel = null; e.preventDefault(); buildShop(); }
});

// ---------------- 启动 ----------------
buildShop();
hud();
setInterval(tick, 1000 / 30);
