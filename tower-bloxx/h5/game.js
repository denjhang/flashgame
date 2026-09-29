// Tower Bloxx H5 — 玩法按 Flash 版 Const.as/Tower.as/Crane.as/Tipper.as 对号移植,
// 3D 资产为原版 J2ME scene.m3g 直转 (GLB)。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ---- Const.as 对号 ----
const BLOCK_H = 64;             // Const.BLOCK_H
const TOWER_START_X = 320;      // Const.TOWER_START_X
const STAGE_W = 640, STAGE_H = 480;
const CRANE_DUR = 2600;         // Const.CRANE_DUR (ms, 摆钩周期)
const CRANE_HOOK_Y = 100;       // Crane.init hookSpr.move(320,100)
const CABLE_TOP_Y = -100;       // Crane.animate moveTo(320,-100)
const HIT_LIMIT = BLOCK_H / 2;  // Tower.hitLimit
const TOON_LIMIT_1 = 4, TOON_LIMIT_2 = 6, TOON_LIMIT_3 = 9; // Const.TOON_LIMIT_*
const MAX_LANDING_AMT = 30;     // Const.MAX_LANDING_AMT
const COMBO_SECS = 5, COMBO_ADJ = 0.1; // Const.COMBO_SECS/COMBO_ADJ_FACTOR
const NUM_TRIES = 3;            // Const.NUM_TRIES
const TOTAL_BLOCKS = 999;       // quick game: GameState.as:97 totalBlocks=999 (无尽模式)
const SWAY_MAX_ANGLE = 1;       // Const.SWAY_MAX_ANGLE (度, GameModel:239 上限)
const TIMER_MAX = 5;            // Const.TIMER_MAX (ComboTimer 计时上限 TIMER_MAX+1 秒)
const DELAY_PAN_UP = 500;       // Const.DELAY_PAN_UP
const DROP_G = 0.0045;          // 落块加速度 (px/ms^2, 调校值, 对应原版 ~0.55s 落程)
const CRANE_FPS = 30;           // Flash 帧率: blockDx 以 px/帧 计 (Crane.animate dx=endx-lastX)

const stage = document.getElementById('stage');
const hud = {
  pop: document.getElementById('pop'), lives: document.getElementById('lives'),
  combo: document.getElementById('combo'), msg: document.getElementById('msg'),
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(STAGE_W, STAGE_H);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ec9e8);

// 原版 m3g 相机是 parallel fovy45; 这里用等价正交取景, 1 世界单位 = 1 原版像素
const camera = new THREE.OrthographicCamera(-STAGE_W/2, STAGE_W/2, STAGE_H/2, -STAGE_H/2, 1, 20000);
camera.position.set(0, 0, 1000);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(0.4, 1, 1.5);
scene.add(sun);

// ---- 资产载入 ----
const templates = [];   // 各楼块 mesh 模板 (从 GLB 取)
let hookPlane = null;   // 原版吊钩贴图 sprite
let ready = false;

new GLTFLoader().load('./assets/scene.glb', (gltf) => {
  const root = gltf.scene;
  // GLB 里的节点名 n<gid>; 251..268 是楼块, 269 是吊车
  root.updateMatrixWorld(true);
  root.traverse(n => {
    if (n.isMesh && !templates.find(t => t.name === n.name)) {
      n.material.side = THREE.DoubleSide;
      if (n.material.map) n.material.map.colorSpace = THREE.SRGBColorSpace;
      // 归一化: 楼块统一缩到 BLOCK_H 高 (原 m3g 场景单位 ~700)
      n.geometry.computeBoundingBox();
      const bb = n.geometry.boundingBox.clone();
      const size = new THREE.Vector3(); bb.getSize(size);
      const s = BLOCK_H / size.y;
      n.userData.s = s;
      n.userData.cx = (bb.min.x + size.x / 2) * s;   // 缩放后的中心偏移
      n.userData.cy = bb.min.y * s;
      templates.push(n);
    }
  });
  // 吊钩: 用原版 hook 贴图 (image_12) 做公告牌
  const tex = new THREE.TextureLoader().load('./assets/image_12.png');
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  tex.repeat.set(0.55, 1); tex.offset.set(0.45, 0);   // 裁掉贴图左缘黑条, 只留吊钩
  hookPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  );
  craneGroup.add(hookPlane);
  hookPlane.position.set(0, 0, 5);
  ready = true;
  window.__ready = true;
  window.__tpl = templates.map(t => ({ n: t.name, s: +t.userData.s.toFixed(3), cx: +t.userData.cx.toFixed(1), cy: +t.userData.cy.toFixed(1), kid: t.geometry?.attributes?.position?.count }));
  window.__dbg = { drops: 0, lands: [] };
  startGame();
}, undefined, (e) => { window.__errs && window.__errs.push('GLB: ' + String(e)); });

function blockTemplate(i) {
  // 楼层外观按高度进阶 (对应原版 block00..03), 取 GLB 中四款方块网格
  // 楼块网格 263/264/265/252, 8 层换一档 (GLB 节点名 = m3g 全局 id)
  const want = ['mesh263','mesh264','mesh265','mesh252'][Math.floor(i / 8) % 4];
  return templates.find(t => t.name === want) || templates[0];
}

// ---- 游戏状态 ----
const G = {
  blocks: [],           // 已落位 {mesh}
  landingY: 0,          // 塔顶 (Tower.landingY, 向上为负 → 这里向上为正)
  currCtr: 0,           // Tower.currCtr: 塔顶中心 x
  blockDx: 0,
  lives: NUM_TRIES,
  population: 0,
  stacked: 0,
  falling: null,        // {mesh, vy, cy, bdx, vx}
  hanging: null, hangingFor: -1,
  craneDx: 0, towerBdx: 0,
  sway: { recent: [0,0,0], idx: 0, adj: 0.5, timer: 0 },  // Tipper
  comboMult: 0, comboT: 0, comboBank: 0,
  camY: 0,
  over: false,
};

const towerGroup = new THREE.Group();  // 摇晃作用于此 (Tipper: parentSpr._rotation)
scene.add(towerGroup);
const craneGroup = new THREE.Group();  // 吊钩/缆绳/下落块
scene.add(craneGroup);
const cable = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, CABLE_TOP_Y - 1000, 0), new THREE.Vector3(0, 0, 0)]),
  new THREE.LineBasicMaterial({ color: 0x222222 })
);
craneGroup.add(cable);

function addHud() {
  hud.pop.textContent = '👥 ' + G.population;
  hud.lives.textContent = '❤'.repeat(Math.max(0, G.lives)) || '—';
  hud.combo.style.display = G.comboMult > 1 ? 'block' : 'none';
  if (G.comboMult > 1) hud.combo.textContent = 'COMBO ×' + G.comboMult;
}

function startGame() {
  for (const b of G.blocks) towerGroup.remove(b.mesh);
  G.blocks = []; G.landingY = 0; G.currCtr = 0; G.towerBdx = 0;
  G.lives = NUM_TRIES; G.population = 0; G.stacked = 0; G.falling = null;
  G.sway = { recent: [0,0,0], idx: 0, adj: 0.5, timer: 0 };
  G.comboMult = 0; G.comboT = 0; G.comboBank = 0; G.camY = 0; G.over = false;
  hud.msg.style.display = 'none';
  craneGroup.visible = true;
  if (G.hanging) { craneGroup.remove(G.hanging); G.hanging = null; G.hangingFor = -1; }
  addHud();
}

function gameOver(won) {
  G.over = true;
  hud.msg.textContent = won ? '🏆 过关！' : '💥 塔倒了';
  hud.msg.style.color = won ? '#ffd700' : '#ff6b6b';
  hud.msg.style.display = 'block';
  if (!won) {
    // 塔散架 (Tower.clearBlocks(topple))
    for (let i = G.blocks.length - 1; i >= 0; i--) {
      const b = G.blocks[i];
      b.vy = 0; b.vx = (Math.random() - 0.5) * 0.3; b.vr = (Math.random() - 0.5) * 0.02;
      toppled.push(b);
    }
    G.blocks = [];
  }
  setTimeout(startGame, 4000);
}
const toppled = [];

// ---- Crane: 摆钩 ----
let t0 = performance.now();
// Crane.resetGameVars: setRadx(30+totalBlocks); CPath.setRadx: min(70,v) → 快速游戏恒 70
// CPath.init: radx=r*2, rady=r=25 → 椭圆摆 (CPath.as:33, updateLoc: x+=radx*cosθ, y+=rady*sinθ)
const CRANE_RADX = Math.min(70, 30 + TOTAL_BLOCKS);
const CRANE_RADY = 25;
function hookX(now) {
  const th = (2 * Math.PI * (now - t0)) / CRANE_DUR;
  return TOWER_START_X - STAGE_W/2 + CRANE_RADX * Math.cos(th);
}
function hookY(now) {
  const th = (2 * Math.PI * (now - t0)) / CRANE_DUR;
  return CRANE_HOOK_Y + CRANE_RADY * Math.sin(th);
}

// ---- Tower.blockLanded 对号 (Tower.as:107-186) ----
function blockLanded(offset, releaseBdx) {
  window.__dbg && (window.__dbg.lands.push(offset), window.__dbg.drops++);
  // Tower.blockLanded: blockDx = floor(nextBlock.blockDx/2); 有效偏移 _loc3_ = 视觉偏移 + blockDx (Tower.as:117-121)
  const bd = Math.floor((releaseBdx || 0) / 2);
  if (G.landingY !== 0) offset = Math.round(offset + bd); // 地基块不走 _loc3_ 惯性偏移 (Tower.as:182 onGround 传 offset=0)
  const abs = Math.abs(offset);
  if (abs >= HIT_LIMIT && abs <= BLOCK_H) {
    // 撞塔: 弹飞 + 晃动加剧 + 顶部一块被撞掉 (Tower.as:150-167 finishCombo→bounceOffTower→knockNextBlock→decTries)
    finishCombo();
    tipperIncSway(offset);
    G.lives--; showMsg('-1', '#ff6b6b');
    if (G.blocks.length > 1) knockTopBlock();
    addHud();
    if (G.lives <= 0) gameOver(false);
    return;
  }
  if (abs > BLOCK_H) { // fallPastTower (Tower.as:139-145)
    finishCombo();
    G.lives--; showMsg('MISS', '#ff6b6b'); addHud();
    if (G.lives <= 0) gameOver(false);
    return;
  }

  // landOnTower (Tower.as:169-261)
  const onGround = G.landingY === 0;               // onGround: 地基块, 不结算人口
  let x = offset;
  const perfect = !onGround && abs < TOON_LIMIT_1; // _loc5_(frame<3) && |offset|<TOON_LIMIT_1
  if (Math.abs(offset) < TOON_LIMIT_1) { x = 0; G.towerBdx = 0; } // 完美吸附: blockx=currCtr, 塔身倾斜清零 (Tower.as:208-210)
  else x = offset;
  const tpl = blockTemplate(G.stacked);
  const mesh = tpl.clone();
  mesh.scale.setScalar(tpl.userData.s);
  mesh.rotation.z = perfect ? 0 : offset / 2;      // Rotater offset/2 度 (Tower.as:211)
  const cx = G.currCtr + x;
  towerGroup.add(mesh);
  mesh.position.set(cx - tpl.userData.cx, G.landingY - tpl.userData.cy, 0);
  // 连击: 落地时 comboMult!=0 → +1 (Tower.as:233); 完美落地重置计时 (perfectLanding→ComboTimer.setTimer)
  if (G.comboMult !== 0) G.comboMult++;
  if (perfect) comboSetTimer();
  else if (G.comboMult !== 0) comboAddTimer(-COMBO_ADJ); // Tower.as:222-224 addToTimer(-COMBO_ADJ_FACTOR)
  // 人口: makePeople 4/3/2/1 按 |offset| 分级 (Tower.as:252-261); 地基块不结算
  const pop = onGround ? 0 : perfect ? 4 : abs < TOON_LIMIT_2 ? 3 : abs < TOON_LIMIT_3 ? 2 : 1;
  if (pop > 0) changePopulation(pop);
  tipperIncSway(offset);
  G.blocks.push({ mesh, cx: tpl.userData.cx, pop });
  G.landingY += BLOCK_H;
  // currCtr = blockx + blockDx (Tower.as:282): 塔顶中心带保留倾斜
  G.towerBdx = (Math.abs(offset) < TOON_LIMIT_1) ? 0 : bd;
  G.currCtr += x + G.towerBdx;
  G.stacked++;
  panUp();
  addHud();
  if (G.stacked >= TOTAL_BLOCKS) gameOver(true);
}

function knockTopBlock() { // Tower.knockNextBlock
  const top = G.blocks.pop();
  top.vy = 0; top.vx = (Math.random() - 0.5) * 0.4; top.vr = 0.03;
  toppled.push(top);
  G.landingY -= BLOCK_H;
  const under = G.blocks[G.blocks.length - 1];
  if (under) G.currCtr = under.mesh.position.x + under.cx; // currCtr = 新顶块中心
  G.population = Math.max(0, G.population - (top.pop || 0));
}

// ---- Tipper.incSway / updateTower ----
function tipperIncSway(amt) {
  const s = G.sway;
  s.recent[s.idx] = Math.min(MAX_LANDING_AMT, Math.abs(amt));
  s.idx = (s.idx + 1) % 3;
  s.adj = 0.5 + (s.recent[0] + s.recent[1] + s.recent[2]) / 3 / 20; // Tipper.incSway
}
function maxTowerAngle() { // GameModel.as:236-239
  const c = Math.abs(G.currCtr);
  const a = G.stacked / 2 + c / 20;
  const b = G.stacked * a / 6;
  return Math.min(SWAY_MAX_ANGLE, Math.min(a, b) / 18);
}
function swayAngle(dt) {
  const s = G.sway;
  s.timer += dt / 20 / 30;                            // Tipper.updateTower: delta/=swayVolume(20); timer+=delta/30
  return maxTowerAngle() * s.adj * Math.cos(s.timer); // Tipper.as:80-81
}

// ---- 计分: GameModel.changePopulation (GameModel.as:159-176) ----
// 落块人口 = floor(stackedBlocks/10 + inc); 连击期间银行 m_comboPopulation += floor(mult*(2+stacked/10*2))
function changePopulation(inc) {
  if (G.comboMult > 0) G.comboBank += Math.floor(G.comboMult * (2 + G.stacked / 10 * 2));
  G.population += Math.floor(G.stacked / 10 + inc);
}
// ---- combo: ComboTimer.as:28-46 (setTimer/addToTimer, 上限 TIMER_MAX+1 秒) + perfectLanding 公式 (Tower.as:330-334) ----
function comboSetTimer() {
  if (G.comboMult === 0) G.comboMult = 1;       // ComboTimer.setTimer
  const secs = Math.max(COMBO_ADJ, COMBO_SECS - G.comboMult * COMBO_ADJ); // perfectLanding
  G.comboT = Math.min((TIMER_MAX + 1) * 1000 - 1, secs * 1000);
}
function comboAddTimer(amt) {
  if (G.comboMult === 0) G.comboMult = 1;       // ComboTimer.addToTimer
  G.comboT = Math.min((TIMER_MAX + 1) * 1000 - 1, Math.max(G.comboT, 0) + amt * 1000);
}
function finishCombo() { // GameModel.finishCombo: 支付连击银行人口
  if (G.comboBank > 0) { G.population += G.comboBank; showMsg('+' + G.comboBank, '#ffd700'); G.comboBank = 0; }
  G.comboMult = 0; G.comboT = 0;
}

function panUp() { // Path DELAY_PAN_UP
  G.camTarget = Math.max(0, G.landingY - STAGE_H/2 + 3 * BLOCK_H);
}
function showMsg(txt, color) {
  const m = document.createElement('div');
  m.textContent = txt; m.style.cssText = `position:absolute;top:30%;left:50%;transform:translateX(-50%);color:${color};font-size:28px;font-weight:bold;text-shadow:1px 1px 2px #000;transition:all .8s;opacity:1;`;
  hud.appendChild(m);
  requestAnimationFrame(() => { m.style.top = '15%'; m.style.opacity = '0'; });
  setTimeout(() => m.remove(), 900);
}

// ---- 输入 ----
function drop() {
  if (!ready || G.over || G.falling || !craneGroup.visible) return;
  const tpl = blockTemplate(G.stacked);
  const mesh = tpl.clone();
  mesh.scale.setScalar(tpl.userData.s);
  const x = craneGroup.position.x - tpl.userData.cx, y = craneGroup.position.y - 60 - tpl.userData.cy;
  mesh.position.set(x, y, 0);
  scene.add(mesh);
  // Crane.dropTarget: blockDx = dx (释放帧钩速 px/帧); 落块带惯性漂移 x + blockDx*3 (Crane.as:198-199)
  const bdx = G.craneDx || 0;
  const topY = G.landingY + BLOCK_H / 2;
  const fallMs = Math.sqrt(2 * Math.max(1, topY - y) / DROP_G);
  G.falling = { mesh, vy: 0, cy: tpl.userData.cy, bdx, vx: bdx * 3 / fallMs };
  if (G.hanging) { craneGroup.remove(G.hanging); G.hanging = null; G.hangingFor = -1; }
}
addEventListener('pointerdown', drop);
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); drop(); } });

// ---- 主循环 ----
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(50, now - last); last = now;
  if (ready) {
    // 摆钩
    G.craneDx = (hookX(now) - craneGroup.position.x) / (dt / (1000 / CRANE_FPS)); // 折算 px/帧 (Crane.animate dx)
    if (!G.falling && !G.over) craneGroup.position.x = hookX(now);
    craneGroup.position.y = G.camY + hookY(now);
    cable.geometry.setFromPoints([new THREE.Vector3(0, STAGE_H/2 - CRANE_HOOK_Y + 10, 0), new THREE.Vector3(0, 0, 0)]);

    // 下落块
    if (G.falling) {
      const f = G.falling;
      f.vy += DROP_G * dt;
      f.mesh.position.y -= f.vy * dt;
      f.mesh.position.x += f.vx * dt; // 惯性漂移 (Crane.as:199 path x+blockDx*3)
      const topY = G.landingY + BLOCK_H / 2;
      if (f.mesh.position.y + f.cy <= topY) {
        scene.remove(f.mesh);
        G.falling = null;
        const offset = Math.round(f.mesh.position.x + f.cx - G.currCtr); // 块中心 - 塔顶中心
        blockLanded(offset, f.bdx);
      }
    }

    // 摇晃 (Tipper.updateTower): 塔绕底部枢轴旋转
    if (!G.over) towerGroup.rotation.z = THREE.MathUtils.degToRad(swayAngle(dt));

    // 掉落中的碎块
    for (let i = toppled.length - 1; i >= 0; i--) {
      const b = toppled[i];
      b.vy = (b.vy || 0) + DROP_G * dt;
      b.mesh.position.x += (b.vx || 0) * dt;
      b.mesh.position.y -= b.vy * dt;
      b.mesh.rotation.z += (b.vr || 0) * dt;
      if (b.mesh.position.y < G.camY - STAGE_H) { towerGroup.remove(b.mesh); scene.remove(b.mesh); toppled.splice(i, 1); }
    }

    // 相机跟随 (pan up)
    const camTargetY = Math.max(0, G.landingY - STAGE_H / 2 + 3 * BLOCK_H);
    G.camY += (camTargetY - G.camY) * Math.min(1, dt / DELAY_PAN_UP);
    camera.position.y = G.camY;

    // 挂钩待放积木 (Crane.updateBlock: targetSpr 随钩, _rotation = -(endx-320)/5 度, 挂点 hook.y+100)
    if (ready && !G.falling && !G.over && G.hangingFor !== G.stacked) {
      if (G.hanging) craneGroup.remove(G.hanging);
      const tpl = blockTemplate(G.stacked);
      G.hanging = tpl.clone();
      G.hanging.scale.setScalar(tpl.userData.s);
      G.hangingFor = G.stacked;
      craneGroup.add(G.hanging);
    }
    if (G.hanging) {
      G.hanging.position.set(-G.hanging.userData.cx ?? 0, -60 - (G.hanging.userData.cy || 0), 0);
      G.hanging.rotation.z = THREE.MathUtils.degToRad(-((craneGroup.position.x + STAGE_W/2) - TOWER_START_X) / 5);
    }

    // combo 计时
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) finishCombo(); addHud(); }
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
