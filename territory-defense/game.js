// TCS H5 重制 — 玩法逻辑按 deobf/GAME_LOGIC.md 还原
// 数据: WEAPONS/STRUCTURES/CHASSIS/WAVES (data.js)
'use strict';

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const BASE_Y = 60;          // 基地红线 (原版 _y > 477 判定, 此处倒置: y < BASE_Y 失败)

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
  VIS = [{ x: W / 2, y: 30, r: BASE_VIS }];
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

// 路线 (数值化: 原版 parcourt 为舞台剪辑引用, 此处按南线/西线/空降线/海线重建)
const ROUTES = {
  parcourt1: [[480,500],[480,440],[430,400],[430,330],[470,290],[470,220],[430,180],[430,120],[470,90]],
  parcourt2: [[120,500],[140,430],[200,390],[260,350],[330,330],[400,300],[470,270],[470,220],[430,180],[430,120],[470,90]],
  parcourt3: [[900,120],[800,150],[700,140],[600,120],[520,100],[470,90]],           // 直升机空降
  parcourt4: [[-40,330],[120,340],[260,350],[400,330],[500,300],[520,200],[490,140],[470,90]], // 海路
};

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

// ---------------- 绘制 (占位美术: 矩形/圆) ----------------
function draw() {
  ctx.clearRect(0, 0, W, H);
  // 草地纹理 (建造区)
  ctx.fillStyle = 'rgba(255,255,120,.05)';
  for (let gx = 40; gx < W - 40; gx += 160)
    for (let gy = 100; gy < H - 40; gy += 130)
      ctx.fillRect(gx, gy, 130, 100);
  // 基地红线
  ctx.strokeStyle = '#f44'; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(0, BASE_Y); ctx.lineTo(W, BASE_Y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#888'; ctx.fillRect(W/2 - 40, 20, 80, 38);
  ctx.fillStyle = '#ddd'; ctx.fillText('BASE', W/2 - 16, 44);

  for (const t of G.turrets) {
    if (t.hp <= 0) {
      ctx.fillStyle = '#333';
      ctx.fillRect(t.x - 10, t.y - 10, 20, 20);
      continue;
    }
    // 雷达站: 扫描波纹 (迷雾驱散可视化)
    if (t.id === 'radar') {
      const ph = (Date.now() / 900) % 1;
      ctx.strokeStyle = `rgba(120,220,255,${0.5 * (1 - ph)})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 40 + ph * 70, 0, 7);
      ctx.stroke();
    }
    ctx.save(); ctx.translate(t.x, t.y);
    ctx.fillStyle = '#464'; ctx.fillRect(-10, -10, 20, 20);
    ctx.rotate(t.rot);
    ctx.fillStyle = t.id.startsWith('crotale') ? '#aaf' : '#ba6';
    ctx.fillRect(0, -3, 18, 6);
    ctx.restore();
    // 对空标记 (蓝色小点)
    if (t.aa) { ctx.fillStyle = '#6cf'; ctx.fillRect(t.x + 6, t.y - 14, 4, 4); }
    // 血条
    ctx.fillStyle = '#300'; ctx.fillRect(t.x - 10, t.y - 16, 20, 3);
    ctx.fillStyle = '#4f4'; ctx.fillRect(t.x - 10, t.y - 16, 20 * t.hp / t.maxHp, 3);
    // 射程圈 (选中)
    if (t === G.selected && t.w) {
      ctx.strokeStyle = 'rgba(255,255,150,.4)';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.w[1], 0, 7); ctx.stroke();
      ctx.fillStyle = '#ff8'; ctx.font = '11px monospace';
      const msg = t.aa ? '[对空OK] S卖 R修' : `按U升级对空 $${t.aaUpgradeCost()}`;
      ctx.fillText(msg, t.x - 30, t.y + 30);
    }
  }
  for (const u of G.units) {
    if (!isVisible(u.x, u.y)) continue;   // 迷雾中的敌人不可见
    ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(u.rot);
    const col = { jeep:'#c66', camion1:'#a77', camion2:'#966', camion3:'#966', bradley:'#c96',
      amx10:'#ca6', abrams:'#dc6', t90:'#dd3', camionBlinde:'#bbb', tigre:'#6cf',
      navire:'#6ae', Yamato:'#eee' }[u.type] || '#c66';
    ctx.fillStyle = col;
    const big = u.type === 'Yamato' ? 2 : 1;
    ctx.fillRect(-8 * big, -5 * big, 16 * big, 10 * big);
    ctx.restore();
    ctx.fillStyle = '#300'; ctx.fillRect(u.x - 9, u.y - 14, 18, 3);
    ctx.fillStyle = '#f43'; ctx.fillRect(u.x - 9, u.y - 14, 18 * Math.max(0, u.hp) / u.maxHp, 3);
  }
  for (const s of G.shells) {
    if (!isVisible(s.x, s.y)) continue;   // 飞入迷雾的炮弹不可见
    ctx.fillStyle = s.side === 'ally' ? '#ff6' : '#f66';
    ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  }
  for (const e of G.effects) {
    ctx.strokeStyle = `rgba(255,${120 + e.life * 8},60,${e.life / 14})`;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (14 - e.life) / 3, 0, 7); ctx.stroke();
  }
  // 建造预览
  if (G.shopSel) {
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '11px monospace';
    ctx.fillText(SHOP.find(s => s.id === G.shopSel).id, 8, H - 8);
  }

  // ---- 战争迷雾 (最后绘制, 覆盖未探索区域) ----
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, W, H);
  fogCtx.fillStyle = 'rgba(6,10,6,0.88)';
  fogCtx.fillRect(0, 0, W, H);
  fogCtx.globalCompositeOperation = 'destination-out';
  for (const s of VIS) {
    const g = fogCtx.createRadialGradient(s.x, s.y, s.r * 0.55, s.x, s.y, s.r);
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
  G.mx = e.clientX - r.left; G.my = e.clientY - r.top;
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
  if (e.key === ' ') { G.shopSel = null; e.preventDefault(); buildShop(); }
});

// ---------------- 启动 ----------------
buildShop();
hud();
setInterval(tick, 1000 / 30);
