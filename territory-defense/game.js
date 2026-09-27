// TCS H5 重制 — 玩法逻辑按 deobf/GAME_LOGIC.md 还原
// 数据: WEAPONS/STRUCTURES/CHASSIS/WAVES (data.js)
'use strict';

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const BASE_LINE_Y = 560;     // 基地防线 (世界坐标, y 最大=最北; 原版 _y>477 失败线)
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
    const ey = ((WORLD.y1 + 40) - s.y) * EXPLORED_SCALE;
    exploredCtx.beginPath();
    exploredCtx.arc(ex, ey, s.r * EXPLORED_SCALE, 0, 7);
    exploredCtx.fill();
  }
}
function exploredToScreen() {   // 探索记忆 → 屏幕绘制参数
  return { x: w2sX(WORLD.x0 - 40), y: w2sY(WORLD.y1 + 40),
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
const cam = { x: 480 - 317, y: -1440 - (-1483) - 300 };  // 初始: 基地视野圈居中
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
// ---------------- 音乐 (原版 1151 面板机制: 手动选曲 changeMusic + playMusic/pauseMusic) ----------------
const BGM_FILES = ['bgm_main.mp3', 'bgm2.mp3', 'bgm3.mp3'];   // actOfInstinct / hellMarch / justDoItUp
const BGM_NAMES = ['actOfInstinct', 'hellMarch', 'justDoItUp'];
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
    if (b) b.classList.toggle('on', i === imusic && !isPause);
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
const SFX_FILES = {
  boutonScroll: '450_boutonScroll.mp3', creationUnite: '452_creationUnite.mp3',
  selectionUnite: '471_selectionUnite.mp3', cannot: '451_cannot.mp3',
  m60: '464_m60.wav', gatling: '463_gatling.mp3', c75mm: '446_c75mm.mp3',
  c105mm1: '447_c105mm1.mp3', c105mm2: '448_c105mm2.mp3', c125mm: '449_c125mm.mp3',
  crotale: '453_crotale.mp3', mlrs: '465_mlrs.mp3',
  explosion1: '454_explosion1.mp3', explosion2: '455_explosion2.mp3',
  explosion3: '456_explosion3.mp3', explosionLarge: '461_explosionLarge.mp3',
  explosionMlrs: '462_explosionMlrs.mp3', ricochet1: '467_ricochet1.mp3',
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
      const rs = this.w[0] * 0.0198;   // 原版: typeData[0] × fpsc 度/帧 → 弧度
      this.rot += Math.sign(da) * Math.min(Math.abs(da), rs);
      // 开火 (冷却 = 威力因子 × 系数)
      if (Math.abs(da) < 0.3 && this.cool <= 0 && bd <= this.w[1]) {
        this.cool = this.w[2] * 1.15;
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
        boom(u.x, u.y, 8);
        explosionSfx(60);   // 原版: 死亡随机 explosion1-6
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
}

// ---------------- 绘制 (原版地图 map.jpg + 世界坐标→屏幕变换) ----------------
const mapImg = new Image();
mapImg.src = 'map.jpg';

function clampCam() {
  const viewW = W / zoom, viewH = H / zoom;
  const lo = Math.min(WORLD.x0 - 40, (WORLD.x0 + WORLD.x1 - viewW) / 2);
  cam.x = Math.max(lo, Math.min(WORLD.x1 + 40 - viewW, cam.x));
  const camYLo = Math.min(MAP_ORIGIN.y - WORLD.y1 - 40, (MAP_ORIGIN.y - (WORLD.y0 + WORLD.y1) / 2 - viewH / 2));
  const camYHi = Math.max(MAP_ORIGIN.y + H / zoom - WORLD.y0 + 40, camYLo);
  cam.y = Math.max(camYLo, Math.min(camYHi, cam.y));
}
function toggleZoom() {   // 原版 G 键: 39% 全图视图
  zoom = zoom === 1 ? 0.39 : 1;
  if (zoom < 1) {         // 全图居中
    cam.x = (WORLD.x0 + WORLD.x1 - W / zoom) / 2;
    cam.y = MAP_ORIGIN.y - (WORLD.y0 + WORLD.y1) / 2 - H / zoom / 2;
  }
  clampCam();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  clampCam();
  // 地图背景 (世界坐标 → 屏幕)
  ctx.drawImage(mapImg, w2sX(MAP_ORIGIN.x), w2sY(MAP_ORIGIN.y), MAP_W, MAP_H);

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
  // 三态迷雾: 淡雾基底 → 挖当前视野 → 叠未探索浓雾(探索记忆挖除)
  // 第一层: 已探索淡雾基底
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, W, H);
  fogCtx.fillStyle = 'rgba(5,9,5,0.42)';
  fogCtx.fillRect(0, 0, W, H);
  // 第二层: 未探索浓雾 (探索记忆挖除已探索区域)
  heavyCtx.globalCompositeOperation = 'source-over';
  heavyCtx.clearRect(0, 0, W, H);
  heavyCtx.fillStyle = 'rgba(4,8,4,0.85)';
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
const MM = { w: 161, h: 150, x: 0, y: 0 };
function drawMinimap() {
  MM.x = W - MM.w - 6; MM.y = 6;
  ctx.save();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  ctx.strokeRect(MM.x - 1, MM.y - 1, MM.w + 2, MM.h + 2);
  ctx.drawImage(mapImg, MM.x, MM.y, MM.w, MM.h);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#000';
  ctx.fillRect(MM.x, MM.y, MM.w, MM.h);
  ctx.globalAlpha = 1;
  // 坐标换算: 世界 → minimap (路点包围盒映射)
  const mx = (wx) => MM.x + (wx - WORLD.x0) / (WORLD.x1 - WORLD.x0) * MM.w;
  const my = (wy) => MM.y + (WORLD.y1 - wy) / (WORLD.y1 - WORLD.y0) * MM.h;
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
  // 视口框 (屏幕对应世界区域)
  const vyN = MAP_ORIGIN.y - cam.y;
  const vyS = MAP_ORIGIN.y - cam.y - H / zoom;
  const vxL = cam.x, vxR = cam.x + W / zoom;
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(mx(vxL), my(vyN), (vxR - vxL) / (WORLD.x1 - WORLD.x0) * MM.w,
                 (vyS - vyN) / -(WORLD.y1 - WORLD.y0) * MM.h);
  ctx.restore();
}

// ---- INFO 面板: 选中塔属性 (原版 informations 面板) ----
function drawInfoPanel() {
  const box = document.getElementById('infoBox');
  const t = G.selected;
  if (!t) { if (box && !box.dataset.keep) box.innerHTML = '点选炮塔查看属性'; return; }
  if (box) box.innerHTML =
    '<b>' + t.id.toUpperCase() + (t.aa ? ' [对空]' : '') + '</b><br>' +
    'HP ' + Math.max(0, t.hp) + '/' + t.maxHp + '<br>' +
    (t.w ? '伤害 ' + t.w[4] + ' · 射程 ' + t.w[1] + '<br>冷却 ' + t.w[2] + ' · 炮管 ' + t.w[3] : '无武装');
  const px = 8, py = H - 86, pw = 210, ph = 78;
  ctx.fillStyle = 'rgba(20,26,20,0.82)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#6a6'; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = '#cfc'; ctx.font = '12px monospace';
  ctx.fillText(t.id.toUpperCase() + (t.aa ? '  [对空]' : ''), px + 8, py + 16);
  ctx.fillStyle = '#8f8';
  ctx.fillText('HP ' + t.hp + '/' + t.maxHp, px + 8, py + 34);
  if (t.w) {
    ctx.fillText('伤害 ' + t.w[4] + '  射程 ' + t.w[1], px + 8, py + 50);
    ctx.fillText('冷却 ' + t.w[2] + '  炮管 ' + t.w[3], px + 8, py + 66);
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
  const k = e.key.toLowerCase();
  const step = 60 / zoom;
  if (k === 'arrowleft' || k === 'a') cam.x -= step;
  if (k === 'arrowright' || k === 'd') cam.x += step;
  if (k === 'arrowup' || k === 'w') cam.y += step;    // 世界 y 向上=北=屏幕上
  if (k === 'arrowdown' || k === 's' && !G.turrets.length || k === 's' && !G.selected) cam.y -= step;
  if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright') e.preventDefault();
});
cv.addEventListener('click', (e) => {
  const r = cv.getBoundingClientRect();
  const cx = e.clientX - r.left, cy = e.clientY - r.top;
  // 小地图命中 → 摄像机跳转 (原版 minimap 点击行为)
  if (cx >= MM.x && cx <= MM.x + MM.w && cy >= MM.y && cy <= MM.y + MM.h) {
    cam.x = WORLD.x0 + (cx - MM.x) / MM.w * (WORLD.x1 - WORLD.x0) - W / 2;
    cam.y = MAP_ORIGIN.y - (WORLD.y1 - (cy - MM.y) / MM.h * (WORLD.y1 - WORLD.y0)) - H / 2;
    clampCam();
    return;
  }
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
