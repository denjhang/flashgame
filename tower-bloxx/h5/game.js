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
// quick game: totalBlocks=999/currColor=3 (GameState.as:97-99); tower 模式: (type+1)*10 (CityMap.as:508)
const TOTAL_BLOCKS = new URLSearchParams(location.search).get('mode') === 'tower' ? 10 : 999;
const CURR_COLOR = TOTAL_BLOCKS === 999 ? 3 : 0;
const TROPHY_POP_LIMITS = [70, 250, 550, 1000]; // Const.TROPHY_TOWER_POP_LIMITS
const CITY_MODE = new URLSearchParams(location.search).get('mode') === 'city';
const TOWER_GRID_TOWERS = 5, TOWER_GRID_PARAMS = 3;              // Const.TOWER_GRID_*
const CITY_MAP_CELL = 52;                                        // Const.CITY_MAP_CELL_W/H
const CITY_LEVEL_LIMITS = [0,75,150,250,400,600,800,1000,1400,1800,2200,3000,4000,5000,6500,8000,9500,11500,14000,17000,19000]; // Const
const TOWER_UNLOCK_LIMITS = [0,3,6,10];                          // Const
const CITY_TYPES = ['Tiny Town','Small Town','Town','Small City','Medium City','Big City','Capital','Metropolis','Megalopolis'];
const TOWER_TYPE_NAMES = ['Residential Tower','Commercial Tower','Office Tower','Luxury Tower']; // Const.TOWER_TYPES
const TOWER_TYPE_COLORS = ['#4a90d9','#d94a4a','#7aa04a','#d9c04a'];
const SWAY_MAX_ANGLE = 1;       // Const.SWAY_MAX_ANGLE (度, GameModel:239 上限)
const TIMER_MAX = 5;            // Const.TIMER_MAX (ComboTimer 计时上限 TIMER_MAX+1 秒)
const DELAY_PAN_UP = 500;       // Const.DELAY_PAN_UP
const DROP_G = 0.0045;          // 落块加速度 (px/ms^2, 调校值, 对应原版 ~0.55s 落程)
const CRANE_FPS = 30;           // Flash 帧率: blockDx 以 px/帧 计 (Crane.animate dx=endx-lastX)

const stage = document.getElementById('stage');
const hud = {
  pop: document.getElementById('pop'), lives: document.getElementById('lives'),
  combo: document.getElementById('combo'), msg: document.getElementById('msg'),
  summary: document.getElementById('summary'),
  progress: document.getElementById('progress'), tries: document.getElementById('tries'),
  btnMusic: document.getElementById('btnMusic'), btnSound: document.getElementById('btnSound'),
  btnExit: document.getElementById('btnExit'),
  city: document.getElementById('city'), cityGrid: document.getElementById('cityGrid'),
  cityMenu: document.getElementById('cityMenu'), cityLevel: document.getElementById('cityLevel'),
  cityPop: document.getElementById('cityPop'), cityProgressFill: document.getElementById('cityProgressFill'),
  cityStatus: document.getElementById('cityStatus'), cityHint: document.getElementById('cityHint'),
  titleScr: document.getElementById('titleScr'), menuScr: document.getElementById('menuScr'),
  menuSub: document.getElementById('menuSub'),
  hudEl: document.getElementById('hud'),   // 真实 HUD 容器 (浮字 append 用, hud 对象本身是引用表)
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


// ---- 菜单流 (GameState.as:53-257 状态机; GameSprites.makeMenuSprites:341-355 按钮坐标) ----
const TIP_TEXTS = { // Const.TIP_INSTR_QUICK/BUILD/INTRO/ABOUT (Const.as:74-82)
  quick: "In the Quick Game mode your goal is to build as high and as stable a building as possible. At the bottom of the screen you'll see the current height of the building, how many tries you have left, and the current population of the building. The higher your building the more people you'll get for each placed block. The amount of people also depends on how well the block is placed. Centering a block perfectly on top of another will fill the combo meter. Placing more blocks before the meter empties will add to the combo, and perfect drops will refill the meter. Every block that's placed while a combo is active will increase the combo score. The combo score is added to the population score after the combo ends.",
  build: "In Build City mode your goal is to create a thriving Megalopolis! Build towers and place them wisely in the city grid to reach the goal. Increasing your city's population and level will unlock new building types. In tower building mode you are aiming to reach a target height. The better you place the roof the more bonus you'll get. You have three chances to finish the tower, if you fail, the building can still be placed in the city without a roof.",
  intro: "Left click anywhere on the screen with your mouse or press the spacebar or down arrow on your keyboard to drop the apartment blocks. You're allowed 3 misses before the construction is halted. The better you build the more people will move in. Good luck!",
  about: "Tower Bloxx(TM) v.1.0. Copyright 2005-2007 Digital Chocolate, Inc. All Rights Reserved. www.DigitalChocolate.com. Flash version developed by Zero G Games (www.zeroggames.com)"
};
function showTitle() { // STT_TITLE
  craneGroup.visible = false;
  hud.titleScr.style.display = 'block';
  playSong('sng_title');
  hud.titleScr.onclick = () => { hud.titleScr.onclick = null; showMenu(); };
}
function showMenu() { // STT_MENU (makeMenuSprites:341-355)
  hud.titleScr.style.display = 'none';
  hud.menuSub.style.display = 'none';
  stopGameVisual();
  hud.menuScr.style.display = 'block';
  playSong('sng_title');
}
function enterQuick() { // STT_QUICK (GameState.as:93-100): totalBlocks=999, currColor=3
  G.cityMode = false; G.totalBlocks = 999; G.currColor = 3; G.pendingCell = null;
  hud.menuScr.style.display = 'none';
  craneGroup.visible = true;
  startGame();
}
function enterCity() { // STT_CITY (GameState.as:86-92)
  G.cityMode = true;
  hud.menuScr.style.display = 'none';
  showCity();
  playSong('sng_city');
}
function showSub(html) { // 子页容器 (Instructions/About/HighScores)
  hud.menuSub.innerHTML = '<span class="close">✕ close</span>' + html;
  hud.menuSub.style.display = 'block';
  hud.menuSub.querySelector('.close').onclick = () => { hud.menuSub.style.display = 'none'; };
}
function showInstructions(page) { // STT_INSTRUCTIONS + INSTR fork (GameSprites.as:322-330)
  const fork = '<h3>Instructions</h3>' +
    '<div class="mbtn" style="position:static;display:block;margin:8px 0;padding:6px;border:1px solid #456" data-p="quick">Quick Game</div>' +
    '<div class="mbtn" style="position:static;display:block;margin:8px 0;padding:6px;border:1px solid #456" data-p="build">Build City</div>' +
    '<div class="mbtn" style="position:static;display:block;margin:8px 0;padding:6px;border:1px solid #456" data-p="about">About</div>';
  if (page) showSub('<h3>Instructions — ' + page + '</h3><p>' + TIP_TEXTS[page].replace(/\r\r|\r/g, '<br><br>') + '</p>');
  else {
    showSub(fork);
    hud.menuSub.querySelectorAll('[data-p]').forEach(el => {
      el.onclick = () => showInstructions(el.dataset.p);
    });
  }
}
function showHighScores() { // STT_HIGHSCORES + HighScoreLocalProxy (本地 top10)
  const hs = JSON.parse(localStorage.getItem('twrblx_highscores') || '[]');
  const rows = hs.map((h, i) => '<div>' + (i + 1) + '. Population ' + h.pop + ' — height ' + h.h + ', combo x' + h.combo + '</div>').join('') || '<div>No scores yet.</div>';
  showSub('<h3>High Scores</h3>' + rows);
}
function showResetConfirm() { // STT_RESET_MAP + TIP_CONFIRM_RESET
  showSub('<h3>Reset city?</h3><p>Reset the progress and population score in your city? (TIP_CONFIRM_RESET)</p>' +
    '<div class="mbtn" style="position:static;display:inline-block;margin:8px;padding:6px 14px;border:1px solid #456" data-r="1">Yes</div>' +
    '<div class="mbtn" style="position:static;display:inline-block;margin:8px;padding:6px 14px;border:1px solid #456" data-r="0">No</div>');
  hud.menuSub.querySelectorAll('[data-r]').forEach(el => {
    el.onclick = () => { // STT_RESET_MAP_YES/NO (GameState.as:242-248)
      if (el.dataset.r === '1') {
        G.save.sm_towerGridData = []; G.save.sm_totalPopulation = 0; saveModel();
        updateCityLevelAndUnlockedTypes(); renderCity();
      }
      hud.menuSub.style.display = 'none';
    };
  });
}
function bindMenu() {
  const b = (id, fn) => document.getElementById(id).addEventListener('click', e => { e.stopPropagation(); sndClick(); fn(); });
  b('mBuild', enterCity);        // BTN_BUILD_CITY → STT_CITY (GameSprites.as:346)
  b('mQuick', enterQuick);       // BTN_QUICK_GAME → STT_QUICK (:347)
  b('mReset', showResetConfirm); // BTN_RESET_MAP → STT_RESET_MAP (:348)
  b('mInstr', () => showInstructions()); // BTN_INSTRUCTIONS (:349)
  b('mHS', showHighScores);      // BTN_HIGHSCORES (:350)
}
bindMenu();

// ---- SoundManager: 音效/歌曲用 FFDec 从原版 SWF 导出的 mp3 (ExportAssets snd_*/sng_* 1:1) ----
const SND = {};
for (const n of ['snd_combo','snd_click','snd_city_milestone','snd_destroy','snd_foundation',
                 'snd_stacked','snd_fanfare_bad','snd_fanfare_good','snd_fanfare_mediocre'])
  SND[n] = new Audio(`./assets/audio/${n}.mp3`);
const SONGS = { sng_tower: new Audio('./assets/audio/sng_tower.mp3'),
                sng_title: new Audio('./assets/audio/sng_title.mp3'),
                sng_city: new Audio('./assets/audio/sng_city.mp3') };
for (const a of Object.values(SONGS)) a.loop = true;
function playSound(name) { // GameState.playSound:293
  if (G.soundOn && SND[name]) { SND[name].currentTime = 0; SND[name].play().catch(() => {}); }
}
function playSong(name) { // GameState.playSong:300
  if (!G.musicOn) return;
  for (const k in SONGS) if (k !== name) SONGS[k].pause();
  SONGS[name].play().catch(() => {});
}
function stopSong() { for (const k in SONGS) SONGS[k].pause(); } // GameState.stopSong:312

// ---- 存档: GameModel.restoreModel/saveModel:79-108, SharedObject "twrblx_cookie" 同名同字段 → localStorage ----
const SAVE_KEY = 'twrblx_cookie';
function restoreModel() { // GameModel.restoreModel:82-99
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    G.save = {
      sm_towerGridData: d.sm_towerGridData || [],
      sm_totalPopulation: d.sm_totalPopulation == null ? 0 : d.sm_totalPopulation,
      tipFlags: d.tipFlags || [],
    };
  } catch (e) { G.save = { sm_towerGridData: [], sm_totalPopulation: 0, tipFlags: [] }; }
}
function saveModel() { // GameModel.saveModel:101-108
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {}
}

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
  // ---- 原版视差背景 (Tower.move:93-104, BG_RATIOS=[0.05,0.1,0.2,0.3]; FFDec 导出 bg2/3/4_spr) ----
  const BG_TEX = ['DefineSprite_231_bg2_spr','DefineSprite_423_bg3_spr','DefineSprite_426_bg4_spr']
    .map(n => { const t = new THREE.TextureLoader().load(`./assets/flash/${n}/1.png`); t.colorSpace = THREE.SRGBColorSpace; return t; });
  const BG_CONF = [ // [ratio, 高度px, 世界基准y, z]
    { r: 0.05, h: 2000, y0: 240 - 1000, z: -420 },
    { r: 0.10, h: 912,  y0: -1760 - 456, z: -400 },
    { r: 0.20, h: 316,  y0: -2216 - 950, z: -380 }, // 太空层 repeat 纵向平铺
  ];
  BG_TEX[2].wrapT = THREE.RepeatWrapping; BG_TEX[2].repeat.set(1, 6);
  G.bgs = BG_CONF.map((c, i) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(640, c.h * (i === 2 ? 6 : 1)),
      new THREE.MeshBasicMaterial({ map: BG_TEX[i], transparent: true, depthWrite: false })
    );
    m.position.set(0, c.y0 - (i === 2 ? c.h * 2.5 : 0), c.z);
    m.userData.r = c.r;
    scene.add(m);
    return m;
  });
  // 小人/火花纹理 (dude_spr 753 / dudette_spr 772 / star_spr 783)
  G.texPeople = ['DefineSprite_753_dude_spr', 'DefineSprite_772_dudette_spr'].map(n => {
    const t = new THREE.TextureLoader().load(`./assets/flash/${n}/1.png`); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  G.texStar = new THREE.TextureLoader().load('./assets/flash/DefineSprite_783_star_spr/1.png');
  G.texStar.colorSpace = THREE.SRGBColorSpace;
  // 环境特效 28 帧 (ambient_spr chid734 帧→子剪辑 670..733, FFDec 逐帧导出)
  G.txFX = [];
  for (let i = 1; i <= 28; i++) {
    const t = new THREE.TextureLoader().load(`./assets/flash/fx/fx${String(i).padStart(2, '0')}.png`);
    t.colorSpace = THREE.SRGBColorSpace;
    G.txFX.push(t);
  }
  initAmbientFX();
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
  // GameState 状态机入口: 无 URL 模式 → STT_TITLE (sng_title); 有 → 直接进对应场景
  startGame(); // 先完成状态/HUD 初始化
  if (CITY_MODE) { stopGameVisual(); showCity(); playSong('sng_city'); }        // STT_CITY
  else if (TOTAL_BLOCKS !== 999) { /* ?mode=tower 直入 */ }
  else { stopGameVisual(); showTitle(); playSong('sng_title'); }                // STT_TITLE
  window.__tpl = templates.map(t => ({ n: t.name, s: +t.userData.s.toFixed(3), cx: +t.userData.cx.toFixed(1), cy: +t.userData.cy.toFixed(1), kid: t.geometry?.attributes?.position?.count }));
  window.__dbg = { drops: 0, lands: [] };
  window.__drop = drop;                    // 执行测试钩子
  window.__state = () => ({ bt: G.blockTime, now: performance.now(), over: G.over,
    vis: craneGroup.visible, falling: !!G.falling, city: hud.city.style.display });
}, undefined, (e) => { window.__errs && window.__errs.push('GLB: ' + String(e)); });

// ---- Build City: CityMap/GameModel 对号 ----
function getTowerColor(col, row) { // GameModel.as:48-52 (0=空, 1..4=色)
  const v = G.save.sm_towerGridData[(row * TOWER_GRID_TOWERS + col) * TOWER_GRID_PARAMS + 0];
  return (v >= 0 && v < 5) ? v : 0;
}
function getTowerPop(col, row) { // GameModel.as:58-62
  const v = G.save.sm_towerGridData[(row * TOWER_GRID_TOWERS + col) * TOWER_GRID_PARAMS + 1];
  return v < 0 ? 0 : (v || 0);
}
function setTowerInfo(col, row, pop, color, roof) { // GameModel.as:63-69 (color 存 type+1)
  const i = (row * TOWER_GRID_TOWERS + col) * TOWER_GRID_PARAMS;
  G.save.sm_towerGridData[i + 1] = pop;
  G.save.sm_towerGridData[i + 0] = color;
  G.save.sm_towerGridData[i + 2] = roof;
}
function calcCityPop() { // CityMap.as:540-556
  let sum = 0;
  for (let r = 0; r < TOWER_GRID_TOWERS; r++)
    for (let c = 0; c < TOWER_GRID_TOWERS; c++) sum += getTowerPop(c, r);
  return sum;
}
function updateAllowedTowerTypes() { // CityMap.as:569-632: 邻接色 1/2/3 决定允许色
  const has = [false, false, false];
  for (let row = 0; row < TOWER_GRID_TOWERS; row++)
    for (let col = 0; col < TOWER_GRID_TOWERS; col++) {
      has[0] = has[1] = has[2] = false;
      const nb = [];
      if (col - 1 >= 0) nb.push(getTowerColor(col - 1, row));
      if (col + 1 < TOWER_GRID_TOWERS) nb.push(getTowerColor(col + 1, row));
      if (row - 1 >= 0) nb.push(getTowerColor(col, row - 1));
      if (row + 1 < TOWER_GRID_TOWERS) nb.push(getTowerColor(col, row + 1));
      for (const c of nb) if (c > 0 && c < 4) has[c - 1] = true;
      let a = 0;
      if (has[0] && has[1] && has[2]) a = 3;
      else if (has[0] && has[1]) a = 2;
      else if (has[0]) a = 1;
      G.sm_towerGridTypesAllowed[row * TOWER_GRID_TOWERS + col] = a;
    }
}
function isValid(col, row, color) { // CityMap.as:561-567
  if (col < 0 || col >= 5 || row < 0 || row >= 5) return false;
  return G.sm_towerGridTypesAllowed[row * TOWER_GRID_TOWERS + col] >= color;
}
const CITY_PROMOTION_LEVELS = [0,1,4,7,9,11,13,15,18,20]; // Const (称号档)
function updateCityLevelAndUnlockedTypes() { // GameModel.as:281-293 + TOWER_UNLOCK_LIMITS + 提示队列
  G.sm_totalPopulation = calcCityPop();
  const prev = G.sm_cityLevel;
  let lv = 0;
  for (let i = 0; i < CITY_LEVEL_LIMITS.length; i++) if (G.sm_totalPopulation >= CITY_LEVEL_LIMITS[i]) lv = i;
  G.sm_cityLevel = lv;
  G.sm_unlockedTowerType = TOWER_UNLOCK_LIMITS.filter(t => t <= lv).length - 1;
  if (lv !== prev) { // GameModel.as:315-323: 里程碑提示 (TIP_MSa + 阈值)
    queueCityTip('More than ' + CITY_LEVEL_LIMITS[lv] + ' citizens have moved in!  (Lv.' + lv + ')');
    // 升格称号 (CITY_PROMOTION_LEVELS → CITY_TYPES)
    for (let k = 0; k < CITY_PROMOTION_LEVELS.length; k++) {
      if (CITY_PROMOTION_LEVELS[k] === lv && k > 0) queueCityTip('Your city is now a ' + CITY_TYPES[Math.min(8, k - 1)] + '!');
    }
  }
}
// 提示队列 (GameModel.addTipToQueue:243-250)
const cityTipQueue = [];
function queueCityTip(txt) { cityTipQueue.push(txt); }
function pumpCityTips() {
  if (cityTipQueue.length === 0) return;
  const txt = cityTipQueue.shift();
  showCityStatus(txt);
  setTimeout(pumpCityTips, 2600);
}
// 进入城市视图 / 渲染
function showCity() {
  stopGameVisual();
  updateAllowedTowerTypes();
  updateCityLevelAndUnlockedTypes();
  renderCity();
  hud.city.style.display = 'block';
  pumpCityTips();
}
function renderCity() {
  hud.cityLevel.textContent = 'Lv.' + G.sm_cityLevel + '/20 ' + (CITY_TYPES[Math.min(8, Math.floor(G.sm_cityLevel / 2.5))] || '');
  hud.cityPop.textContent = '👥 ' + G.sm_totalPopulation;
  const base = CITY_LEVEL_LIMITS[G.sm_cityLevel], next = CITY_LEVEL_LIMITS[Math.min(20, G.sm_cityLevel + 1)];
  hud.cityProgressFill.style.width = G.sm_cityLevel >= 20 ? '100%'
    : (100 * (G.sm_totalPopulation - base) / (next - base)) + '%'; // GameModel.as:299-311 (338px 条)
  hud.cityGrid.innerHTML = '';
  for (let row = 0; row < TOWER_GRID_TOWERS; row++)
    for (let col = 0; col < TOWER_GRID_TOWERS; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const color = getTowerColor(col, row), pop = getTowerPop(col, row);
      if (color > 0) {
        const tw = document.createElement('div');
        tw.className = 'tower';
        tw.style.height = Math.min(48, 10 + Math.log2(1 + pop) * 6) + 'px';
        tw.style.background = TOWER_TYPE_COLORS[color - 1];
        tw.textContent = pop;
        if (G.save.sm_towerGridData[(row * TOWER_GRID_TOWERS + col) * TOWER_GRID_PARAMS + 2] > 0)
          tw.textContent = '★' + pop; // 屋顶帧
        cell.appendChild(tw);
      } else if (isValid(col, row, G.selectedType) && G.selectedType >= 0) {
        cell.classList.add('ok'); // updateCellHighlights: 可建格高亮
      }
      cell.onclick = () => cityCellClick(col, row);
      hud.cityGrid.appendChild(cell);
    }
  hud.cityMenu.innerHTML = '';
  for (let t = 0; t < 4; t++) {
    const locked = t > G.sm_unlockedTowerType;
    const sel = document.createElement('div');
    sel.className = 'sel' + (locked ? ' locked' : '') + (G.selectedType === t ? ' active' : '');
    sel.innerHTML = `<div class="sw" style="background:${TOWER_TYPE_COLORS[t]}"></div>` +
      (locked ? '🔒 Lv.' + TOWER_UNLOCK_LIMITS[t] : TOWER_TYPE_NAMES[t].split(' ')[0]);
    sel.onclick = () => {
      if (locked) return;
      sndClick();
      G.selectedType = t;
      renderCity();
    };
    hud.cityMenu.appendChild(sel);
  }
  const dz = document.createElement('div');
  dz.className = 'sel' + (G.dozerMode ? ' active' : '');
  dz.innerHTML = '<div class="sw">🚜</div>Dozer';
  dz.onclick = () => { sndClick(); G.dozerMode = !G.dozerMode; renderCity(); }; // placeInDozer/STATUS_DOZER
  hud.cityMenu.appendChild(dz);
  hud.cityHint.textContent = '选塔型 → 点网格建造（目标高度 10 层/塔）。邻接规则：红需蓝邻，绿需蓝+红，黄需蓝+红+绿（Const.STATUS_CITY_RULES）';
}
function cityCellClick(col, row) {
  // dozer 模式: 点已有塔拆除 (placeInDozer:398-410, snd_destroy)
  if (G.dozerMode) {
    if (getTowerColor(col, row) > 0) {
      playSound('snd_destroy');
      setTowerInfo(col, row, 0, 0, 0);
      updateCityLevelAndUnlockedTypes();
      saveModel();
      renderCity();
      showCityStatus('Tower demolished. (STATUS_DOZER)');
    }
    return;
  }
  if (G.selectedType < 0) return;
  if (!isValid(col, row, G.selectedType)) { showCityStatus("You can't place the tower here."); return; } // STATUS_PLACE_TOWER3
  const oldPop = getTowerPop(col, row);
  if (oldPop > 0) showCityStatus('New: ? / Old: ' + oldPop + '  (TIP_CITY_COMPARE)'); // 替换对比
  G.pendingCell = { col, row };
  // buildTower (CityMap.as:505-513): totalBlocks=(type+1)*10, currColor=type
  G.totalBlocks = (G.selectedType + 1) * 10;
  G.currColor = G.selectedType;
  hud.city.style.display = 'none';
  startGame();
}
function showCityStatus(txt) {
  hud.cityStatus.textContent = txt;
  setTimeout(() => { hud.cityStatus.textContent = ''; }, 3000);
}
// 建造结束回城放置 (CityMap.placeInMap:411-460: setTowerInfo→calcCityPop→level/unlock→saveModel)
function finishCityTower(won) {
  if (!G.pendingCell) { startGame(); return; }
  const { col, row } = G.pendingCell;
  playSound(getTowerPop(col, row) === 0 ? 'snd_foundation' : 'snd_destroy'); // placeInMap:425-429
  setTowerInfo(col, row, G.population, G.currColor + 1, won ? 1 : 0);        // 屋顶帧: 胜 1 败 0
  const before = G.sm_totalPopulation;
  G.sm_totalPopulation = calcCityPop();                                      // :447
  const diff = G.sm_totalPopulation - before;
  showCityStatus(diff > 0 ? 'Population increased by ' + diff + ' citizens!'
    : diff < 0 ? 'Population decreased by ' + diff + ' citizens.'
    : 'The new building had no effect on overall population.');              // STATUS_POP_INC*
  updateCityLevelAndUnlockedTypes();
  G.pendingCell = null; G.selectedType = -1;
  saveModel();
  hud.msg.style.display = 'none';
  showCity();
}
// 城市模式下停掉玩法可视化 (原版 MODE_HIDE_CITY)
function stopGameVisual() {
  craneGroup.visible = false;
  if (G.hanging) { craneGroup.remove(G.hanging); G.hanging = null; G.hangingFor = -1; }
}

function needRoof(i) { // Crane.as:209: stacked>0 && stacked==totalBlocks-1
  return G.totalBlocks !== 999 && i > 0 && i === G.totalBlocks - 1;
}
function blockTemplate(i) {
  if (needRoof(i)) {
    // 屋顶块: 奖杯屋顶 (cleanTower→trophyRoof, Crane.setTarget) 用放大 variant, 普通 frame3
    return templates.find(t => t.name === (G.trophyRoof ? 'mesh254' : 'mesh253')) || templates[0];
  }
  // 楼层外观按 currColor 选款: block 款 263/264/265/252 ↔ currColor 0..3 (CityMap.as:160 currColor*4)
  const want = ['mesh263','mesh264','mesh265','mesh252'][G.currColor % 4];
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
  people: [], sparks: [], fallingPeople: [],
  sway: { recent: [0,0,0], idx: 0, adj: 0.5, timer: 0 },  // Tipper
  comboMult: 0, comboT: 0, comboBank: 0,
  camY: 0,
  over: false,
  totalBlocks: TOTAL_BLOCKS, currColor: CURR_COLOR,
  cityMode: CITY_MODE,
  pendingCell: null, selectedType: -1, dozerMode: false,
  sm_towerGridTypesAllowed: new Array(25).fill(0),
  sm_cityLevel: 0, sm_unlockedTowerType: 0, sm_totalPopulation: 0,
  cleanTower: false, trophyRoof: false,          // GameModel.updateCleanTower / Crane.setTarget
  comboMax: 0,                                    // GameModel.setComboMax
  records: Object.assign({ populationRecord: 0, blockRecord: 0, comboRecord: 0 },
    JSON.parse(localStorage.getItem('twrblx_records') || '{}')), // 原版纪录仅会话内(GameModel.as:11-13), H5 持久化
  save: null,
};

restoreModel();
// sm_unlockedTowerType 由城市人口推导 (Const.TOWER_UNLOCK_LIMITS; GameModel.updateCityLevelAndUnlockedTypes)
{
  const pop = G.save.sm_totalPopulation || 0;
  let lv = 0;
  for (let i = 0; i < CITY_LEVEL_LIMITS.length; i++) if (pop >= CITY_LEVEL_LIMITS[i]) lv = i; // :286-293
  G.sm_cityLevel = lv;
  G.sm_unlockedTowerType = TOWER_UNLOCK_LIMITS.filter(t => t <= lv).length - 1;
  G.sm_totalPopulation = pop;
}

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
  // 人口: 5 位数字 (GameSprites.setDigits:124-136, populationSpr numDigs=5)
  hud.pop.textContent = String(Math.floor(G.population)).padStart(5, '0');
  // 命数 (tries_spr LWR_LFT 51,-55; GameModel.setTries:139)
  hud.tries.textContent = '♥'.repeat(Math.max(0, G.lives)) || '—';
  // 高度进度条: tower 模式 blackBar=(total-stacked)*total*5/total (GameModel.as:213-227); quick 只显示层数
  if (G.totalBlocks !== 999) {
    hud.progress.querySelector('.fill').style.height = (100 * G.stacked / G.totalBlocks) + '%';
    hud.progress.querySelector('.top').style.display = G.stacked >= G.totalBlocks - 1 ? 'block' : 'none'; // hudTop:217
  } else hud.progress.style.display = 'none';
  // 连击: "min(5,secs) x mult" (ComboTimer.setSecs:50-56)
  const secs = Math.max(0, Math.ceil(G.comboT / 1000));
  hud.combo.style.display = G.comboMult > 0 && G.comboT > 0 ? 'block' : 'none';
  if (G.comboMult > 0 && G.comboT > 0) hud.combo.textContent = Math.min(5, secs) + ' x' + G.comboMult;
}

function startGame() {
  for (const b of G.blocks) towerGroup.remove(b.mesh);
  for (const q of G.people) towerGroup.remove(q.sp);          // 上一局残留清理
  for (const q of G.sparks) scene.remove(q.sp);
  for (const q of G.fallingPeople) scene.remove(q.sp);
  for (const b of toppled) { towerGroup.remove(b.mesh); scene.remove(b.mesh); }
  G.people = []; G.sparks = []; G.fallingPeople = []; toppled.length = 0;
  G.blocks = []; G.landingY = 0; G.currCtr = 0; G.towerBdx = 0;
  G.lives = NUM_TRIES; G.population = 0; G.stacked = 0; G.falling = null;
  G.sway = { recent: [0,0,0], idx: 0, adj: 0.5, timer: 0 };
  G.comboMult = 0; G.comboT = 0; G.comboBank = 0; G.camY = 0; G.over = false;
  G.comboMax = 0; G.cleanTower = false; G.trophyRoof = false; G.dozerMode = false;
  G.blockTime = performance.now() + 1000;      // Crane.restartGame: blockTime = getTimer()+1000
  hud.summary.style.display = 'none';
  hud.msg.style.display = 'none';
  craneGroup.visible = true;
  if (G.hanging) { craneGroup.remove(G.hanging); G.hanging = null; G.hangingFor = -1; }
  playSong('sng_tower');                       // GameState.as:102 STT_PLAY playSong("sng_tower")
  addHud();
}

function gameOver(won) {
  G.over = true;
  hud.msg.textContent = won ? 'Tower complete!' : 'Too many blocks missed!'; // Const.MSG_GAME_WON/MSG_GAME_LOST
  hud.msg.style.color = won ? '#ffd700' : '#ff6b6b';
  hud.msg.style.display = 'block';
  // GameState.as:128: 胜利 fanfare 按 trophyRoof 分 med/good; 失败 bad (:122)
  playSound(won ? (G.trophyRoof ? 'snd_fanfare_good' : 'snd_fanfare_mediocre') : 'snd_fanfare_bad');
  if (won) showSummary();
  if (!won) {
    // 塔散架 (Tower.clearBlocks(topple))
    for (let i = G.blocks.length - 1; i >= 0; i--) {
      const b = G.blocks[i];
      b.vy = 0; b.vx = (Math.random() - 0.5) * 0.3; b.vr = (Math.random() - 0.5) * 0.02;
      toppled.push(b);
    }
    G.blocks = [];
  }
  // panDown min(DUR_PAN_DOWN=3000, stacked*250) + GAME_OVER_DELAY=1000 (Tower.as:152, Const.as)
  if (!won) {
    if (G.cityMode && G.pendingCell) { // 0 命未达目标: 楼仍无屋顶入城 (TIP_OUT_OF_TRIES)
      setTimeout(() => finishCityTower(false), Math.min(3000, G.stacked * 250) + 1000);
    } else setTimeout(startGame, Math.min(3000, G.stacked * 250) + 1000);
  }
}

// ---- 结算面板 (GameSprites.showSummary:48-59 + GameModel.getSummary:204-207 + Const.TIP_SUMMARY1-3/MSG_RESTART) ----
function showSummary() {
  G.records.populationRecord = Math.max(G.records.populationRecord, G.population); // GameModel.setPopulation
  G.records.blockRecord = Math.max(G.records.blockRecord, G.stacked);              // setStackedBlocks
  G.records.comboRecord = Math.max(G.records.comboRecord, G.comboMax);             // setComboMult
  localStorage.setItem('twrblx_records', JSON.stringify(G.records));
  // HighScore 本地榜 (HighScoreLocalProxy): 按人口 top10
  const hs = JSON.parse(localStorage.getItem('twrblx_highscores') || '[]');
  hs.push({ pop: G.population, h: G.stacked, combo: G.comboMax });
  hs.sort((a, b) => b.pop - a.pop);
  localStorage.setItem('twrblx_highscores', JSON.stringify(hs.slice(0, 10)));
  G.save.sm_totalPopulation = Math.max(G.save.sm_totalPopulation, G.population); // 城市总人口占位(城市模式接入后为累计值)
  saveModel();
  const line = (label, v, rec) => label + v + (rec ? '  New record!' : '');        // Const.TIP_SUMMARY_REC
  hud.summary.innerHTML =
    '<div class="t">' + hud.msg.textContent + '</div>' +
    '<div>' + line('Population: ', G.population, G.population >= G.records.populationRecord && G.population > 0) + '</div>' +
    '<div>' + line('Tower height:  ', G.stacked, G.stacked >= G.records.blockRecord && G.stacked > 0) + '</div>' +
    '<div>' + line('Longest combo: ', G.comboMax, G.comboMax >= G.records.comboRecord && G.comboMax > 0) + '</div>' +
    '<div class="ok">Click here to play again</div>';                               // Const.MSG_RESTART
  hud.summary.style.display = 'block';
  hud.summary.querySelector('.ok').onclick = () => {
    if (G.cityMode && G.pendingCell) finishCityTower(true); else startGame();
  };
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
    playSound('snd_destroy');                    // Tower.as:162
    G.lives--; showMsg('-1', '#ff6b6b');
    if (G.blocks.length > 1) knockTopBlock();
    addHud();
    if (G.lives <= 0) gameOver(false);
    return;
  }
  if (abs > BLOCK_H) { // fallPastTower (Tower.as:139-145, snd_destroy 延迟触发此处直接播)
    finishCombo();
    playSound('snd_destroy');
    G.lives--; showMsg('MISS', '#ff6b6b'); addHud();
    if (G.lives <= 0) gameOver(false);
    return;
  }

  // landOnTower (Tower.as:169-261)
  const onGround = G.landingY === 0;               // onGround: 地基块, 不结算人口
  const isRoof = needRoof(G.stacked);              // 屋顶块 frame>=3 → _loc5_=false
  let x = offset;
  const perfect = !onGround && !isRoof && abs < TOON_LIMIT_1; // _loc5_(frame<3) && |offset|<TOON_LIMIT_1
  if (Math.abs(offset) < TOON_LIMIT_1) { x = 0; G.towerBdx = 0; } // 完美吸附: blockx=currCtr, 塔身倾斜清零 (Tower.as:208-210)
  else x = offset;
  const tpl = blockTemplate(G.stacked);
  const mesh = tpl.clone();
  mesh.scale.setScalar(tpl.userData.s);
  mesh.rotation.z = perfect ? 0 : offset / 2;      // Rotater offset/2 度 (Tower.as:211)
  const cx = G.currCtr + x;
  towerGroup.add(mesh);
  mesh.position.set(cx - tpl.userData.cx, G.landingY - tpl.userData.cy, 0);
  if (onGround) playSound('snd_foundation');   // Tower.as:203 地基块
  // 连击: 落地时 comboMult!=0 → +1 (Tower.as:233); 完美落地重置计时 (perfectLanding→ComboTimer.setTimer)
  if (G.comboMult !== 0) { G.comboMult++; G.comboMax = Math.max(G.comboMax, G.comboMult); } // Tower.as:233 + GameModel.as:192
  if (perfect) { playSound('snd_combo'); comboSetTimer(); }   // Tower.as:228
  else if (G.comboMult !== 0) { playSound('snd_stacked'); comboAddTimer(-COMBO_ADJ); } // Tower.as:222-224
  else playSound('snd_stacked');                              // Tower.as:238/243/248
  // 人口 (Tower.makePeople:252-261): 地基块不结算; 屋顶块走 roof 换算
  let pop;
  if (onGround) pop = 0;
  else if (isRoof) {
    let a = 128 - abs * 256 / BLOCK_H;                       // makePeople roof: aoff = 128 - aoff*256/BLOCK_H
    pop = G.trophyRoof ? Math.floor(a * (G.currColor + 1) / 2)   // trophy: floor(aoff*(currColor+1)/2)
                       : Math.floor(a / (5 - (G.currColor + 1))); // 普通: floor(aoff/(5-(currColor+1)))
    pop = Math.max(0, pop);
  } else pop = perfect ? 4 : abs < TOON_LIMIT_2 ? 3 : abs < TOON_LIMIT_3 ? 2 : 1;
  if (pop > 0) { changePopulation(pop); if (!isRoof) spawnPeople(mesh, pop); }
  updateCleanTower();                            // GameModel.updateCleanTower
  tipperIncSway(offset);
  G.blocks.push({ mesh, cx: tpl.userData.cx, pop });
  G.landingY += BLOCK_H;
  // currCtr = blockx + blockDx (Tower.as:282): 塔顶中心带保留倾斜
  G.towerBdx = (Math.abs(offset) < TOON_LIMIT_1) ? 0 : bd;
  G.currCtr += x + G.towerBdx;
  G.stacked++;
  panUp();
  addHud();
  if (G.totalBlocks !== 999 && G.stacked >= G.totalBlocks) gameOver(true); // CityMap 目标高度
}

// ---- 环境特效 (Const.as:176-181 三表 + GameSprites.updateEffects/generateEffect) ----
const FX_START=[0,0,0,2,3,2,3,3,4,5,6,6,6,7,8,8,9,9,10,10,11,12,12,13,14,15,17,18,21];
const FX_END  =[1,1,1,3,4,4,4,5,5,6,7,7,7,999,9,10,999,999,11,999,12,13,14,999,15,16,18,19,999];
const FX_PROB =[0,30,30,20,20,40,60,60,30,30,50,50,10,50,100,20,40,50,100,30,100,100,30,10,100,100,100,100,100];
const FX_SPD  =[60,2,1,3,2,2,-2,3,-4,5,2,2,6,0,0,-2,0,0,0,0,0,0,3,-3,0,0,0,0,-3];
const FX_OCC0 =[8,3,2,1,1,8,2,8,1,1,4,4,-1,8,-1,1,5,4,-1,5,2,-1,1,1,-1,-1,-1,-1,-1]; // GameSprites.as:26
const FX_MAX = 9;                 // Const.MAX_NUMBER_OF_EFFECTS
const FX_SIZES = {};              // 载入后按纹理自然尺寸填
function initAmbientFX() {
  G.fxSlots = [];
  for (let i = 0; i < FX_MAX; i++)
    G.fxSlots.push({ type: 0, x: 0, sy: 0, next: performance.now() + Math.random() * 2000, sp: null });
  G.fxOcc = FX_OCC0.slice();
}
function generateEffect(slot) { // GameSprites.generateEffect:209-263
  const tier = G.stacked / 10;
  let pick = 0;
  for (let i = 1; i <= 28; i++) {
    if (tier >= FX_START[i] && tier < FX_END[i] && (G.fxOcc[i] > 0 || G.fxOcc[i] === -1) &&
        Math.random() * 100 < FX_PROB[i]) { pick = i; break; }
  }
  if (pick === 0) { slot.next = performance.now() + 1000 + Math.random() * 2500; return; }
  G.fxOcc[pick]--; // :243
  const spd = FX_SPD[pick];
  if (spd === 0 || Math.floor(Math.random() * 2) === 0)
    slot.x = -320 + Math.random() * 640;
  else if (spd > 0) slot.x = -320 - 100;
  else slot.x = 320 + 100;
  slot.sy = -BLOCK_H / 2 - Math.random() * BLOCK_H * 1.5; // 2500-camy-rand(BLOCK_H/2..*2) 的屏幕等价
  slot.type = pick;
  const tex = G.txFX[pick];
  if (!FX_SIZES[pick]) FX_SIZES[pick] = { w: tex.image.width, h: tex.image.height };
  const { w, h } = FX_SIZES[pick];
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(w, h, 1);
  scene.add(sp);
  slot.sp = sp;
}
function updateEffects(dt, now) { // GameSprites.updateEffects:154-208
  if (!G.fxSlots) return;
  for (const slot of G.fxSlots) {
    if (slot.type !== 0) {
      slot.x += FX_SPD[slot.type] * dt / 330; // :167 SPD/10 per frame@30fps
      if (slot.sp) slot.sp.position.set(slot.x, G.camY + slot.sy, -350);
      const syWorld = slot.sp ? slot.sp.position.y - G.camY : 0;
      if (slot.x > 320 + 200 || slot.x < -320 - 200 || syWorld > STAGE_H + 100) { // :174-176
        if (G.fxOcc[slot.type] >= 0) G.fxOcc[slot.type]++; // :189-191
        if (slot.sp) { scene.remove(slot.sp); slot.sp = null; }
        slot.type = 0;
        slot.next = now + Math.random() * 2000;
      }
    } else if (now >= slot.next) generateEffect(slot);
  }
}

// ---- 小人 (Person.as:24-66): 出生 ±viewWidth/2 / 上方 rand(100,200), 向 (x±12, y-17) 半步逼近,
// 步长 min(PEOPLE_MAX_MV±10, dist/2), 每 50ms; 到达后 250ms 淡出 ----
function spawnPeople(blockMesh, amt) {
  for (let k = 0; k < amt; k++) {
    const tex = G.texPeople[Math.floor(Math.random() * 2)];
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(30, 40, 1);
    const bx = blockMesh.position.x + (blockMesh.userData.cx || 0);
    const side = Math.random() < 0.5 ? -1 : 1;
    sp.position.set(bx + side * (160 + Math.random() * 160), G.landingY + 100 + Math.random() * 100, 2);
    towerGroup.add(sp);
    G.people.push({ sp, tx: bx + (12 - Math.floor(Math.random() * 2) * 24), ty: G.landingY - 17,
      seekMax: 10 + Math.random() * 20, next: 0, fading: 0 });
  }
}
// 完美落地 4 向火花 (Tower.makeSpark:311-317, speed=100, angles 135/45/225/315, Flipbook 150ms)
function makeSparks(x, y) {
  for (const a of [135, 45, 225, 315]) {
    const mat = new THREE.SpriteMaterial({ map: G.texStar, transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(26, 24, 1);
    sp.position.set(x, y, 3);
    scene.add(sp);
    G.sparks.push({ sp, vx: 100 * Math.cos(a * Math.PI / 180), vy: 100 * Math.sin(a * Math.PI / 180), life: 500 });
  }
}
// miss 坠落小人 (Tower.makeFallingPerson:296-310: 5000ms, 漂移 ±100)
function spawnFallingPerson(x, y) {
  const mat = new THREE.SpriteMaterial({ map: G.texPeople[Math.floor(Math.random() * 2)], transparent: true });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(30, 40, 1);
  sp.position.set(x, y, 2);
  scene.add(sp);
  G.fallingPeople.push({ sp, vx: (Math.random() - 0.5) * 0.04, life: 5000 });
}

function knockTopBlock() { // Tower.knockNextBlock
  const top = G.blocks.pop();
  top.vy = 0; top.vx = (Math.random() - 0.5) * 0.4; top.vr = 0.03;
  toppled.push(top);
  spawnFallingPerson(top.mesh.position.x + (top.cx || 0), top.mesh.position.y + 40); // makeFallingPerson
  G.landingY -= BLOCK_H;
  G.stacked--;                                   // Tower.as:176 setStackedBlocks(stackedBlocks - 1)
  const under = G.blocks[G.blocks.length - 1];
  if (under) G.currCtr = under.mesh.position.x + under.cx; // currCtr = 新顶块中心
  G.population = Math.max(0, G.population - (top.pop || 0));
}

function updateCleanTower() { // GameModel.as:181
  G.cleanTower = G.currColor <= 0 || G.population >= TROPHY_POP_LIMITS[G.currColor];
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
  const gain = Math.floor(G.stacked / 10 + inc);
  G.population += gain;
  popFloat('+' + gain); // showPopChange: 人口 HUD 增量文本 (GameModel.as:168-171)
}
// ---- combo: ComboTimer.as:28-46 (setTimer/addToTimer, 上限 TIMER_MAX+1 秒) + perfectLanding 公式 (Tower.as:330-334) ----
function comboSetTimer() {
  if (G.comboMult === 0) G.comboMult = 1;       // ComboTimer.setTimer
  G.comboMax = Math.max(G.comboMax, G.comboMult); // GameModel.as:192 comboMax
  const secs = Math.max(COMBO_ADJ, COMBO_SECS - G.comboMult * COMBO_ADJ); // perfectLanding
  G.comboT = Math.min((TIMER_MAX + 1) * 1000 - 1, secs * 1000);
}
function comboAddTimer(amt) {
  if (G.comboMult === 0) G.comboMult = 1;       // ComboTimer.addToTimer
  G.comboT = Math.min((TIMER_MAX + 1) * 1000 - 1, Math.max(G.comboT, 0) + amt * 1000);
}
function finishCombo() { // GameModel.finishCombo: 支付连击银行人口
  if (G.comboBank > 0) {
    G.population += G.comboBank;
    popFloat('Combo bonus! +' + G.comboBank, 3000); // MSG_COMBO + showBonusPopulation(3000ms)
    G.comboBank = 0;
  }
  G.comboMult = 0; G.comboT = 0;
}

function panUp() { // Path DELAY_PAN_UP
  G.camTarget = Math.max(0, G.landingY - STAGE_H/2 + 3 * BLOCK_H);
}
function popFloat(txt, life = 1200) { // bonus_spr 在 (321,31) 人口 HUD 中心, 生命 1200/3000ms
  const m = document.createElement('div');
  m.textContent = txt;
  m.style.cssText = `position:absolute;top:64px;right:52px;color:#ffe27a;font-size:16px;font-weight:bold;` +
    `text-shadow:1px 1px 2px #000;transition:opacity ${life}ms;`;
  hud.hudEl.appendChild(m);
  setTimeout(() => { m.style.opacity = '0'; }, life * 0.3);
  setTimeout(() => m.remove(), life + 50);
}

function showMsg(txt, color) {
  const m = document.createElement('div');
  m.textContent = txt; m.style.cssText = `position:absolute;top:30%;left:50%;transform:translateX(-50%);color:${color};font-size:28px;font-weight:bold;text-shadow:1px 1px 2px #000;transition:all .8s;opacity:1;`;
  hud.hudEl.appendChild(m);
  requestAnimationFrame(() => { m.style.top = '15%'; m.style.opacity = '0'; });
  setTimeout(() => m.remove(), 900);
}

// ---- 输入 ----
function drop() {
  if (!ready || G.over || G.falling || !craneGroup.visible ||
      hud.city.style.display === 'block' || hud.menuScr.style.display === 'block' ||
      hud.titleScr.style.display === 'block') return;
  if (performance.now() < G.blockTime) return;  // restartGame: blockTime = now+1000 (Crane.as:139)
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
// 原版鼠标语义: 按下仅置 mouseState=false, 松开才落块 (Crane.onMouseDown/Up:176-189, buttonPressed:155)
addEventListener('pointerdown', () => { G.mouseState = false; });
addEventListener('pointerup', () => { G.mouseState = true; drop(); });
addEventListener('keydown', e => {
  // Key.isDown(40)/Key.isDown(32): 按住即落 (buttonPressed:155) — keydown 触发一次等价
  if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'PageDown') { e.preventDefault(); drop(); } // TIP_INTRO
});
// 音乐/音效开关 (GameState.toggleSongs/toggleSounds) — 音频系统落地后生效, 先存偏好
G.musicOn = localStorage.getItem('twrblx_music') !== '0';
G.soundOn = localStorage.getItem('twrblx_sound') !== '0';
if (!G.musicOn) hud.btnMusic.style.opacity = 0.4;
if (!G.soundOn) hud.btnSound.style.opacity = 0.4;
function sndClick() { if (G.soundOn && SND.snd_click) { SND.snd_click.currentTime = 0; SND.snd_click.play().catch(() => {}); } }
hud.btnMusic.onclick = e => { e.stopPropagation(); G.musicOn = !G.musicOn; hud.btnMusic.style.opacity = G.musicOn ? 1 : 0.4;
  localStorage.setItem('twrblx_music', G.musicOn ? '1' : '0'); sndClick();
  if (!G.musicOn) stopSong(); else playSong('sng_tower'); };  // STT_MUSIC_TOGGLE toggleSongs
hud.btnSound.onclick = e => { e.stopPropagation(); G.soundOn = !G.soundOn; hud.btnSound.style.opacity = G.soundOn ? 1 : 0.4;
  localStorage.setItem('twrblx_sound', G.soundOn ? '1' : '0'); sndClick(); }; // STT_SOUND_TOGGLE
hud.btnExit.onclick = e => { // BTN_EXIT_QUICK (GameState STT_EXIT_PLAY → 菜单; 菜单未实现, 先回模式入口)
  e.stopPropagation();
  location.href = location.pathname + (G.totalBlocks !== 999 ? '' : '?mode=tower');
};

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
        // 块中心 - 塔顶中心(含摇晃倾斜投影): Tower.as:118 calcX(landingY, rot+90) = -h*sin(rot)
        const lean = Math.sin(towerGroup.rotation.z) * G.landingY;
        const offset = Math.round(f.mesh.position.x + f.cx - (G.currCtr - lean));
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

    updateEffects(dt, now);
    // 视差背景: worldY = camY*(1-r) + y0 (Tower.move: bg._y = towerY + bgStartY - towerY*ratio)
    for (const b of G.bgs) b.position.y = G.camY * (1 - b.userData.r) + b.userData.y0;

    // 小人寻步 (Person.eachTick: 每 50ms 半步逼近, 上限 seekMax; 到达后 250ms 淡出)
    for (let i = G.people.length - 1; i >= 0; i--) {
      const q = G.people[i];
      if (!q.fading) {
        if (now >= q.next) {
          q.next = now + 50;
          const dx = Math.max(-q.seekMax, Math.min(q.seekMax, (q.sp.position.x + (0 - q.tx)) / -2));
          const dy = Math.max(-q.seekMax, Math.min(q.seekMax, (q.sp.position.y + (0 - q.ty)) / -2));
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) q.fading = now + 250;
          else q.sp.position.x += dx, q.sp.position.y += dy;
        }
      } else if (now >= q.fading) {
        q.sp.material.opacity -= dt / 250;
        if (q.sp.material.opacity <= 0) { towerGroup.remove(q.sp); G.people.splice(i, 1); }
      }
    }
    // 火花
    for (let i = G.sparks.length - 1; i >= 0; i--) {
      const q = G.sparks[i];
      q.sp.position.x += q.vx * dt / 1000; q.sp.position.y += q.vy * dt / 1000;
      q.life -= dt; q.sp.material.opacity = Math.max(0, q.life / 500);
      if (q.life <= 0) { scene.remove(q.sp); G.sparks.splice(i, 1); }
    }
    // 坠落小人
    for (let i = G.fallingPeople.length - 1; i >= 0; i--) {
      const q = G.fallingPeople[i];
      q.sp.position.x += q.vx * dt; q.sp.position.y -= 0.15 * dt;
      q.life -= dt;
      if (q.life <= 0 || q.sp.position.y < G.camY - STAGE_H) { scene.remove(q.sp); G.fallingPeople.splice(i, 1); }
    }

    // 相机跟随 (pan up)
    const camTargetY = Math.max(0, G.landingY - STAGE_H / 2 + 3 * BLOCK_H);
    G.camY += (camTargetY - G.camY) * Math.min(1, dt / DELAY_PAN_UP);
    camera.position.y = G.camY;

    // 挂钩待放积木 (Crane.updateBlock: targetSpr 随钩, _rotation = -(endx-320)/5 度, 挂点 hook.y+100)
    if (ready && !G.falling && !G.over && G.hangingFor !== G.stacked) {
      if (needRoof(G.stacked)) G.trophyRoof = G.cleanTower; // Crane.setTarget: trophyRoof = needRoof && cleanTower
      if (G.hanging) craneGroup.remove(G.hanging);
      const tpl = blockTemplate(G.stacked);
      G.hanging = tpl.clone();
      G.hanging.scale.setScalar(tpl.userData.s);
      G.hangingFor = G.stacked;
      craneGroup.add(G.hanging);
    }
    if (G.hanging) {
      G.hanging.position.set(-(G.hanging.userData.cx || 0), -60 - (G.hanging.userData.cy || 0), 0);
      G.hanging.rotation.z = THREE.MathUtils.degToRad(-((craneGroup.position.x + STAGE_W/2) - TOWER_START_X) / 5);
    }

    // combo 计时
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) finishCombo(); addHud(); }
    else if (hud.combo.style.display !== 'none') addHud();
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
