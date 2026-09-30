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
const DROP_SPD = 0.5;           // 落块匀速 px/ms: 原版 Path 时长=(dropY-y)*2ms → 速度恒 0.5 (Crane.dropTarget:200-201)
const CRANE_FPS = 30;           // Flash 帧率: blockDx 以 px/帧 计 (Crane.animate dx=endx-lastX)

const stage = document.getElementById('stage');
const hud = {
  pop: document.getElementById('pop'),
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
  about: "Tower Bloxx(TM) v.1.0. Copyright 2005-2007 Digital Chocolate, Inc. All Rights Reserved. www.DigitalChocolate.com. Flash version developed by Zero G Games (www.zeroggames.com)",
  combo: "You started a combo by centering a block precisely on the one below it! As long as the combo meter at the top stays active you'll get more people for each block placed! Precise drops will refill the combo meter. If you miss a drop, the combo will end automatically",
  bought_land: "You've bought yourself a piece of land to fulfill your dream of building a thriving metropolis!",
  new_tower_type0: "Your investors have supplied a crane and building materials for you to create blue Residential Towers!",
  click_tower: "Select the blue Residential Tower on the left by clicking it with your mouse.",
  place_tower: "Place the tower on the map with your mouse on any of the squares on the city grid highlighted in the same color as the tower.",
  city_meter: "The meter on top shows the current city population.",
  city_line: "The orange horizontal line above the city map shows how many people you need for the next city level."
};
// ---- 提示弹窗 (GameSprites.showTip:28-46): tipFlags 门控+持久化, 弹窗期 delayNextBlock(-1),
// OK 后 delayNextBlock(100) (GameSprites.hideTip:60-63) ----
function showTip(type, text, after) {
  if (G.save.tipFlags[type]) return false;
  G.save.tipFlags[type] = true;
  saveModel();                                   // showTip 内 saveModel (:34)
  G.blockTime = -1;                              // delayNextBlock(-1) 弹窗期禁放
  globalThis.__tipOpen = true;                   // 测试钩子 (exec_test 模拟玩家点 OK)
  hud.summary.innerHTML =
    '<div>' + text.replace(/\r\r|\r/g, '<br><br>') + '</div><div class="ok">OK</div>';
  hud.summary.style.display = 'block';
  hud.summary.querySelector('.ok').onclick = () => {
    hud.summary.style.display = 'none';
    G.blockTime = performance.now() + 100;       // hideTip: delayNextBlock(100)
    globalThis.__tipOpen = false;
    if (after) after();
  };
  return true;
}
function showTitle() { // STT_TITLE
  craneGroup.visible = false;
  hud.titleScr.style.display = 'block';
  playSong('sng_title');
  hud.titleScr.onclick = () => { clearTimeout(titleMsgT); hud.titleScr.onclick = null; showMenu(); };
  // Message.factory(msg,titleSpr,STT_MENU,5000) (GameState.as:63): title 5s 自动进菜单
  clearTimeout(titleMsgT);
  titleMsgT = setTimeout(() => { if (hud.titleScr.style.display === 'block') showMenu(); }, 5000);
}
let titleMsgT = 0;
function showMenu() { // STT_MENU (makeMenuSprites:341-355)
  hud.titleScr.style.display = 'none';
  hud.menuSub.style.display = 'none';
  stopGameVisual();
  hud.menuScr.style.display = 'block';
  playSong('sng_title');
}
function enterQuick() { // STT_QUICK (GameState.as:93-100): totalBlocks=999, currColor=3
  G.hs = { hiPop: 0, hiBlocks: 0 };            // highScore.startGame(QUICK) session 复位
  G.cityMode = false; G.totalBlocks = 999; G.currColor = 3; G.pendingCell = null;
  hud.menuScr.style.display = 'none';
  craneGroup.visible = true;
  startGame();
}
function enterCity() { // STT_CITY (GameState.as:86-92)
  G.hs = { hiPop: 0, hiBlocks: 0 };            // highScore.startGame(CITY) session 复位
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
// ---- HighScore 三表 (HighScoreLocalProxy: HS_TYPE_CITY=totPop/QUICK=hiPop/QUICK2=hiBlocks,
// 预置 Player1-10 逐字对号; SharedObject hs_cookie 同义 → localStorage 'twrblx_hs') ----
const HS_PRESETS = {
  CITY:  ['Player 1,10000','Player 2,7500','Player 3,5000','Player 4,4000','Player 5,3000','Player 6,2000','Player 7,1000','Player 8,750','Player 9,500','Player 10,100'],
  QUICK: ['Player 1,3000','Player 2,2000','Player 3,1000','Player 4,750','Player 5,500','Player 6,400','Player 7,300','Player 8,200','Player 9,100','Player 10,50'],
  QUICK2:['Player 1,500','Player 2,300','Player 3,200','Player 4,100','Player 5,50','Player 6,40','Player 7,35','Player 8,30','Player 9,20','Player 10,10'],
};
function hsLoad() {
  const hs = JSON.parse(localStorage.getItem('twrblx_hs') || 'null') || {};
  for (const t of ['CITY', 'QUICK', 'QUICK2'])
    if (!hs[t]) hs[t] = HS_PRESETS[t].map(r => { const [name, v] = r.split(','); return { name, v: Number(v) }; });
  return hs;
}
function hsInsert(table, value, name) { // writeData: 插入+按值降序+截 10
  const hs = hsLoad();
  hs[table].push({ name, v: value });
  hs[table].sort((a, b) => b.v - a.v);
  hs[table] = hs[table].slice(0, 10);
  localStorage.setItem('twrblx_hs', JSON.stringify(hs));
}
function hsEsc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function showHighScores() { // STT_HIGHSCORES → drawDataSet 三表
  const hs = hsLoad();
  const tbl = (title, rows, unit) => '<h3>' + title + '</h3>' +
    rows.map((r, i) => '<div>' + (i + 1) + '. ' + hsEsc(r.name) + ' — ' + unit + ' ' + r.v + '</div>').join('');
  showSub(tbl('City Population', hs.CITY, 'Pop') +
    tbl('Quick Game Population', hs.QUICK, 'Pop') +
    tbl('Quick Game Height', hs.QUICK2, 'Blocks'));
}
function showResetConfirm() { // STT_RESET_MAP + TIP_CONFIRM_RESET
  showSub('<h3>Reset city?</h3><p>Reset the progress and population score in your city? (TIP_CONFIRM_RESET)</p>' +
    '<div class="mbtn" style="position:static;display:inline-block;margin:8px;padding:6px 14px;border:1px solid #456" data-r="1">Yes</div>' +
    '<div class="mbtn" style="position:static;display:inline-block;margin:8px;padding:6px 14px;border:1px solid #456" data-r="0">No</div>');
  hud.menuSub.querySelectorAll('[data-r]').forEach(el => {
    el.onclick = () => { // STT_RESET_MAP_YES/NO (GameState.as:242-248)
      if (el.dataset.r === '1') {
        G.save.sm_towerGridData = []; G.save.sm_totalPopulation = 0;
        G.save.tipFlags = {};                    // resetTips (GameModel.as:91-94): 提示重放
        saveModel();
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
  b('mMidi', toggleMidi);        // 可选: J2ME MIDI BGM (menu_btn_spr 帧12 MUSIC 位, Get More 空位)
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
      tipFlags: d.tipFlags && !Array.isArray(d.tipFlags) ? d.tipFlags : {}, // GameModel.as:7/83 持久化提示门控
    };
  } catch (e) { G.save = { sm_towerGridData: [], sm_totalPopulation: 0, tipFlags: {} }; }
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
  // Person 帧动画全 56 帧: 走路循环 11-35 / 到达 36-56 / 56 淡出 (Person.as TOON_FRM_*)
  G.texPeople = ['DefineSprite_753_dude_spr', 'DefineSprite_772_dudette_spr'].map(n => {
    const arr = [];
    for (let i = 1; i <= 56; i++) {
      const t = new THREE.TextureLoader().load(`./assets/flash/${n}/${i}.png`);
      t.colorSpace = THREE.SRGBColorSpace; arr.push(t);
    }
    return arr;
  });
  G.texStar = new THREE.TextureLoader().load('./assets/flash/DefineSprite_783_star_spr/1.png');
  G.texStar.colorSpace = THREE.SRGBColorSpace;
  // swoosh 烟雾轨迹 3 帧 (读图 46x66, makeFallingPerson:329 Flipbook 1→3/150ms)
  G.texSwoosh = [1, 2, 3].map(i => {
    const t = new THREE.TextureLoader().load(`./assets/flash/fx/DefineSprite_790_swoosh_spr/${i}.png`);
    t.colorSpace = THREE.SRGBColorSpace; return t;
  });
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
    vis: craneGroup.visible, falling: !!G.falling, city: hud.city.style.display,
    lives: G.lives, stacked: G.stacked, pending: !!G.pendingCell });
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
  // 首次进城提示链 (CityMap.as:105-118): bought_land → new_tower_type0 → click_tower →
  // city_meter(1塔)/city_line(2塔); 里程碑队列由 pumpCityTips 承担 (原版 checkTipQueue 在两者之间)
  const nTowers = (() => { let n = 0;
    for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) if (getTowerPop(c, r) > 0) n++;
    return n; })();
  if (!showTip('bought_land', TIP_TEXTS.bought_land) &&
      !showTip('new_tower_type0', TIP_TEXTS.new_tower_type0) &&
      !showTip('click_tower', TIP_TEXTS.click_tower)) {
    if (nTowers === 1) showTip('city_meter', TIP_TEXTS.city_meter);      // num_city_towers==1
    else if (nTowers === 2) showTip('city_line', TIP_TEXTS.city_line);   // num_city_towers==2
  }
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
        // 城市图标 (CityMap.restoreCity:66-76): icon.gotoAndStop((color-1)*4 + roofType+1),
        // 格内偏移 (CITY_MAP_X+col*52+10, 下一行底-13) → cell 内 left:10 bottom:13, 读图 50x50
        const roof = G.save.sm_towerGridData[(row * TOWER_GRID_TOWERS + col) * TOWER_GRID_PARAMS + 2] > 0 ? 1 : 0;
        const tw = document.createElement('img');
        tw.className = 'tower';
        tw.src = './assets/flash/fx/DefineSprite_603_city_icon_spr/' + ((color - 1) * 4 + roof + 1) + '.png';
        tw.title = 'pop ' + pop;
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
      // placeInDozer:398-405: 拆除位置 city_demol_spr 翻页 1→6 帧/1000ms 后自毁 (读图 72x72)
      const dem = document.createElement('img');
      dem.src = './assets/flash/fx/DefineSprite_818_city_demol_spr/1.png';
      dem.style.cssText = `position:absolute;left:${224 + col * 52 - 10}px;top:${107 + row * 52 - 10}px;` +
        'width:72px;height:72px;z-index:2;pointer-events:none;';
      hud.city.appendChild(dem);
      let df = 1;
      const div = setInterval(() => {
        if (++df > 6) { clearInterval(div); dem.remove(); return; }
        dem.src = `./assets/flash/fx/DefineSprite_818_city_demol_spr/${df}.png`;
      }, 1000 / 6);
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
  const beginBuild = () => { hud.city.style.display = 'none'; startGame(); };
  if (!showTip('place_tower', TIP_TEXTS.place_tower, beginBuild)) beginBuild(); // CityMap.as:140/167
}
// 状态条=消息队列 (DefineSprite_648 statusBar: queueMessage 顺序播, forceMessage 插队;
// H5 每条 3s 顺序显示——原为覆盖式, 连续消息会互吞)
const statusQ = [];
let statusTimer = 0;
function showCityStatus(txt) {
  statusQ.push(txt);
  if (statusQ.length === 1) pumpStatus();
}
function pumpStatus() {
  hud.cityStatus.textContent = statusQ[0];
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusQ.shift();
    if (statusQ.length) pumpStatus();
    else hud.cityStatus.textContent = '';
  }, 3000);
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
  spinReels();                                                               // :463
  updateCityLevelAndUnlockedTypes();
  G.pendingCell = null; G.selectedType = -1;
  saveModel();
  hud.msg.style.display = 'none';
  showCity();
}
// 城市模式下停掉玩法可视化 (原版 MODE_HIDE_CITY)
// spinReels (CityMap.spinReels:649-664): placeInMap 后 5 个 city_reel_spr 滚轮翻页
// Flipbook 1-3/150ms ×5 遍; 原版坐标 (65-22i, -180) 相对 citySpr 中心(320,240) → 屏幕 (385-22i, 60)
function spinReels() {
  for (let i = 0; i < 5; i++) {
    const img = document.createElement('img');
    img.src = './assets/flash/fx/DefineSprite_825_city_reel_spr/1.png';
    img.style.cssText = `position:absolute;left:${385 - 22 * i - 10}px;top:${60 - 17}px;` +
      'width:20px;height:34px;z-index:2;pointer-events:none;';
    hud.city.appendChild(img);
    let f = 1, rep = 0;
    const iv = setInterval(() => {
      if (++f > 3) {
        f = 1;
        if (++rep >= 5) { clearInterval(iv); img.remove(); return; }  // setRepCnt(5)+setKillSprite
      }
      img.src = `./assets/flash/fx/DefineSprite_825_city_reel_spr/${f}.png`;
    }, 150);
  }
}
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
  dropY: 400,           // Crane.init: this.dropY=400, 每次落块后 340 (Crane.as:57,201)
  people: [], sparks: [], fallingPeople: [], missFall: [], bounces: [], straighten: [],
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
  for (const q of G.bounces) scene.remove(q.mesh);
  for (const q of G.fallingPeople) scene.remove(q.sp);
  for (const q of G.missFall) scene.remove(q.mesh);
  for (const b of toppled) { towerGroup.remove(b.mesh); scene.remove(b.mesh); }
  G.people = []; G.sparks = []; G.fallingPeople = []; G.missFall = []; G.bounces = []; G.straighten = []; toppled.length = 0;
  G.blocks = []; G.landingY = 0; G.currCtr = 0; G.towerBdx = 0;
  G.lives = NUM_TRIES; G.population = 0; G.stacked = 0; G.falling = null;
  G.sway = { recent: [0,0,0], idx: 0, adj: 0.5, timer: 0 };
  G.comboMult = 0; G.comboT = 0; G.comboBank = 0; G.camY = 0; G.over = false;
  G.comboMax = 0; G.cleanTower = false; G.trophyRoof = false; G.dozerMode = false;
  G.hs = { hiPop: 0, hiBlocks: 0 };            // highScore.startGame session 复位 (HighScore.as:139)
  G.blockTime = performance.now() + 1000;      // Crane.restartGame: blockTime = getTimer()+1000
  G.panDownDur = null; G.panDownT = 0;
  // 注意: dropY 不在此重置 — 原版 resetGameVars 不碰 dropY, 400 仅 Crane.init 后首块生效 (Crane.as:57)
  hud.summary.style.display = 'none';
  hud.msg.style.display = 'none';
  craneGroup.visible = true;
  if (G.hanging) { craneGroup.remove(G.hanging); G.hanging = null; G.hangingFor = -1; }
  playSong('sng_tower');                       // GameState.as:102 STT_PLAY playSong("sng_tower")
  addHud();
  showTip('intro', TIP_TEXTS.intro);           // GameState.as:104 STT_PLAY showTip("intro",TIP_INTRO)
}

function gameOver(won) {
  G.over = true;
  hud.msg.textContent = won ? 'Tower complete!' : 'Too many blocks missed!'; // Const.MSG_GAME_WON/MSG_GAME_LOST
  hud.msg.style.color = won ? '#ffd700' : '#ff6b6b';
  hud.msg.style.display = 'block';
  // GameState.as:128: 胜利 fanfare 按 trophyRoof 分 med/good; 失败 bad (:122)
  playSound(won ? (G.trophyRoof ? 'snd_fanfare_good' : 'snd_fanfare_mediocre') : 'snd_fanfare_bad');
  wonRef.won = won;
  // Tower.gameOver (:194-203): won → panDown 回卷塔底 (dur=min(DUR_PAN_DOWN=3000, stacked*250)),
  // Message wait=GAME_OVER_DELAY=1000 → 输 1s / 赢 1s+pan 后才弹结算
  if (won) { G.camTarget = 0; G.panDownDur = Math.min(3000, G.stacked * 250);
    G.panDownStartY = G.camY; G.panDownT = 0; } // Tower.panDown (:200) Path 到塔底
  const goDelay = 1000 + (won ? G.panDownDur : 0);
  setTimeout(showSummary, goDelay);
  if (!won && !(G.cityMode && G.pendingCell)) {
    // 塔散架 (Tower.clearBlocks(topple)); 城市模式失败楼保留待无屋顶放置
    for (let i = G.blocks.length - 1; i >= 0; i--) {
      const b = G.blocks[i];
      b.vy = 0; b.vx = (Math.random() - 0.5) * 0.3; b.vr = (Math.random() - 0.5) * 0.02;
      toppled.push(b);
    }
    G.blocks = [];
  }
  // panDown 后由结算面板 OK 驱动后续 (放置/回菜单); 无自动重开 (GameState.as:138-147)
}

// ---- 结算面板 (GameSprites.showSummary:48-59 + GameModel.getSummary:204-207 + Const.TIP_SUMMARY1-3/MSG_RESTART) ----
function showSummary() {
  G.records.populationRecord = Math.max(G.records.populationRecord, G.population); // GameModel.setPopulation
  G.records.blockRecord = Math.max(G.records.blockRecord, G.stacked);              // setStackedBlocks
  G.records.comboRecord = Math.max(G.records.comboRecord, G.comboMax);             // setComboMult
  localStorage.setItem('twrblx_records', JSON.stringify(G.records));
  // endOfRound (HighScore.as:185-194): session 内 hiPop/hiBlocks 取 max;
  // isQualified (:200-219): hiPop 进 QUICK 榜 或 hiBlocks 进 QUICK2 榜 (仅 !cityMode, STT_CHECK_HIGHSCORE:148)
  G.hs.hiPop = Math.max(G.hs.hiPop, G.population);
  G.hs.hiBlocks = Math.max(G.hs.hiBlocks, G.stacked);
  const hs = hsLoad();
  G.pendingHS = (!G.cityMode && G.population > 0 && (
    hs.QUICK.length < 10 || G.hs.hiPop > hs.QUICK[hs.QUICK.length - 1].v ||
    hs.QUICK2.length < 10 || G.hs.hiBlocks > hs.QUICK2[hs.QUICK2.length - 1].v)) ? { name: '' } : null;
  G.save.sm_totalPopulation = Math.max(G.save.sm_totalPopulation, G.population); // 城市总人口占位(城市模式接入后为累计值)
  saveModel();
  const line = (label, v, rec) => label + v + (rec ? '  New record!' : '');        // Const.TIP_SUMMARY_REC
  hud.summary.innerHTML =
    '<div class="t">' + hud.msg.textContent + '</div>' +
    '<div>' + line('Population: ', G.population, G.population >= G.records.populationRecord && G.population > 0) + '</div>' +
    '<div>' + line('Tower height:  ', G.stacked, G.stacked >= G.records.blockRecord && G.stacked > 0) + '</div>' +
    '<div>' + line('Longest combo: ', G.comboMax, G.comboMax >= G.records.comboRecord && G.comboMax > 0) + '</div>' +
    '<div class="ok">Click here to play again</div>';                               // Const.MSG_RESTART
  G.blockTime = -1;                          // GameSprites.showSummary:35 delayNextBlock(-1)
  hud.summary.style.display = 'block';
  hud.summary.querySelector('.ok').onclick = () => {
    if (G.cityMode && G.pendingCell) finishCityTower(wonRef.won);
    else if (G.pendingHS) showNameDialog();   // afterHighScore = STT_NEW_HIGHSCORE
    else showMenu(); // afterHighScore = STT_MENU (GameState.as:145)
  };
}
// 高分名字输入 (HighScore.showNameDialog → dialogDone → STT_NEW_HIGHSCORE: showPopup)
function showNameDialog() {
  hud.summary.innerHTML =
    '<div>Congratulations! You made the high score list!</div>' +              // HighScoreLocalProxy 语义
    '<div><input id="hsName" maxlength="12" style="font-size:16px;width:180px" placeholder="Your name"></div>' +
    '<div class="ok">OK</div>';
  hud.summary.style.display = 'block';
  hud.summary.querySelector('.ok').onclick = () => {
    // submitName (:249-268) + stripIllegalChars (:98-117): 去 , 与 |
    const nm = String(document.getElementById('hsName').value || 'AAA').split(',').join('').split('|').join('').slice(0, 12);
    const hs = hsLoad();
    if (hs.QUICK.length < 10 || G.hs.hiPop > hs.QUICK[hs.QUICK.length - 1].v) hsInsert('QUICK', G.hs.hiPop, nm);
    if (hs.QUICK2.length < 10 || G.hs.hiBlocks > hs.QUICK2[hs.QUICK2.length - 1].v) hsInsert('QUICK2', G.hs.hiBlocks, nm);
    G.pendingHS = null;
    showHighScores();                          // STT_NEW_HIGHSCORE → highScore.showPopup
  };
}
const toppled = [];
const wonRef = { won: false }; // gameOver(won) → 结算 OK 回调用

// ---- Crane: 摆钩 ----
let t0 = performance.now();
// Crane.resetGameVars: setRadx(30+totalBlocks); CPath.setRadx: min(70,v) → 快速游戏恒 70
// CPath.init: radx=r*2, rady=r=25 → 椭圆摆 (CPath.as:33, updateLoc: x+=radx*cosθ, y+=rady*sinθ)
const CRANE_RADX = Math.min(70, 30 + TOTAL_BLOCKS);
const CRANE_RADY = 25;
const CRANE_AOFFSET = 270;   // CPath.init: aOffset=(a+180)%360, factory 传 a=90 (CPath.as:38, Crane.as:46)
// firstTick/updateLoc: ccw=!cw=true → θ=(360-((t*360/DUR+aOffset)%360))°, 角度递减 → 首摆向右 (CPath.as:54,62)
// 椭圆中心在枢轴上方 rady: ctrY = pivot + calcY(rady,270°) = pivot-25 (CPath.as:54-56); H5 y 向上取 +rady
function hookTh(now) {
  const t = ((now - t0) % CRANE_DUR + CRANE_DUR) % CRANE_DUR;
  return (360 - (t / CRANE_DUR * 360 + CRANE_AOFFSET) % 360) * Math.PI / 180;
}
function hookX(now) {
  return TOWER_START_X - STAGE_W/2 + CRANE_RADX * Math.cos(hookTh(now));
}
function hookY(now) {
  return CRANE_HOOK_Y + CRANE_RADY + CRANE_RADY * Math.sin(hookTh(now));
}

// ---- Tower.blockLanded 对号 (Tower.as:107-186) ----
let lastFallMesh = null;
function blockLanded(offset, releaseBdx, fallMesh) {
  lastFallMesh = fallMesh;
  window.__dbg && (window.__dbg.lands.push(offset), window.__dbg.drops++);
  // Tower.blockLanded: blockDx = floor(nextBlock.blockDx/2); 有效偏移 _loc3_ = 视觉偏移 + blockDx (Tower.as:117-121)
  const bd = Math.floor((releaseBdx || 0) / 2);
  if (G.landingY !== 0) offset = Math.round(offset + bd); // 地基块不走 _loc3_ 惯性偏移 (Tower.as:182 onGround 传 offset=0)
  const abs = Math.abs(offset);
  if (abs >= HIT_LIMIT && abs <= BLOCK_H) {
    // 撞塔: 弹飞 + 晃动加剧 + 顶部一块被撞掉 (Tower.as:150-167 finishCombo→bounceOffTower→knockNextBlock→decTries)
    finishCombo();
    popClear();                                  // showPopChange(-999) (Tower.as:151)
    tipperIncSway(offset);
    playSound('snd_destroy');                    // Tower.as:162
    G.lives--; showMsg('-1', '#ff6b6b');
    if (lastFallMesh) pushBounce(lastFallMesh, offset, 0); // bounceOffTower (Tower.as:367-383)
    if (G.blocks.length > 1) knockTopBlock();
    addHud();
    if (G.lives <= 0) gameOver(false);
    return;
  }
  if (abs > BLOCK_H) { // fallPastTower (Tower.as:139-145): 块坠出屏幕后 Message 定时播 snd_destroy (dur+100ms)
    finishCombo();
    popClear();                                  // showPopChange(-999) (Tower.as:140)
    G.missFall.push({ mesh: lastFallMesh, vy: DROP_SPD });
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
  if (!perfect && !onGround) G.straighten.push({ mesh, rot0: offset / 2, t: 0 });
  const cx = G.currCtr + x;
  towerGroup.add(mesh);
  mesh.position.set(cx - tpl.userData.cx, G.landingY - tpl.userData.cy, 0);
  if (onGround) { playSound('snd_foundation');  // Tower.as:203 地基块
    G.shakeT = 0; }                              // 塔身抖动 Path y-5 osc rep6 (landOnTower:217-219)
  // 连击: 落地时 comboMult!=0 → +1 (Tower.as:233); 完美落地重置计时 (perfectLanding→ComboTimer.setTimer)
  if (G.comboMult !== 0) { G.comboMult++; G.comboMax = Math.max(G.comboMax, G.comboMult); } // Tower.as:233 + GameModel.as:192
  if (perfect) { playSound('snd_combo');
    // makeSpark ×4 (landOnTower:248-251): 块底两角+顶两角, 角度 135/45/225/315
    const sw = tpl.userData.w || BLOCK_H;
    makeSpark(cx - sw / 2, G.landingY, 135); makeSpark(cx + sw / 2, G.landingY, 45);
    makeSpark(cx - sw / 2, G.landingY + BLOCK_H, 225); makeSpark(cx + sw / 2, G.landingY + BLOCK_H, 315);
    if (!showTip('combo', TIP_TEXTS.combo, comboSetTimer)) comboSetTimer(); }   // Tower.as:356-358
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
  G.currCtr += x;  // :282 currCtr=blockx+bd 与 :120 的 offset+bd 恰好抵消 bd, 不再另加 towerBdx
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
    const toon = Math.floor(Math.random() * 2);
    const mat = new THREE.SpriteMaterial({ map: G.texPeople[toon][0], transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(42, 56, 1);                           // 帧原始尺寸 (读图 42x56)
    const bx = blockMesh.position.x + (blockMesh.userData.cx || 0);
    const side = Math.random() < 0.5 ? -1 : 1;
    sp.position.set(bx + side * (160 + Math.random() * 160), G.landingY + 100 + Math.random() * 100, 2);
    towerGroup.add(sp);
    G.people.push({ sp, tx: bx + (12 - Math.floor(Math.random() * 2) * 24), ty: G.landingY - 17,
      seekMax: 10 + Math.random() * 20, next: 0, fading: 0,
      toon, f: 1, animT: 0 });   // Person.init: gotoAndPlay(1), eachTick frame==1 → randRange(0,9) 重定位
  }
}
// 完美落地 4 向火花 (Tower.makeSpark:311-317, speed=100, angles 135/45/225/315, Flipbook 150ms)
function pushBounce(mesh, offset, wait) { // bounceOffTower:367-383: BPath 三次贝塞尔 1000ms
  // P1=(x+off/2, 上50) P2=(x+off, 下100) P3=(x+2off, 屏底); Rotater 0↔359/1000ms 循环; wait 后起跳
  const p0 = { x: mesh.position.x, y: mesh.position.y };
  scene.add(mesh);
  G.bounces.push({ mesh, t: -wait, p0,
    p1: { x: p0.x + offset / 2, y: p0.y + 50 },   // Flash y 向下 → H5 y 向上取反
    p2: { x: p0.x + offset, y: p0.y - 100 },
    p3: { x: p0.x + offset * 2, y: G.camY - STAGE_H / 2 - 200 },
    rotDir: offset > 0 ? 1 : -1 });
}
function makeSpark(x, y, a) { // Tower.makeSpark:344-352: 单颗, speed=100, 角度方向飞散
  const mat = new THREE.SpriteMaterial({ map: G.texStar, transparent: true });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(26, 24, 1);
  sp.position.set(x, y, 3);
  scene.add(sp);
  G.sparks.push({ sp, vx: 100 * Math.cos(a * Math.PI / 180), vy: 100 * Math.sin(a * Math.PI / 180), life: 500 });
}
// miss 坠落小人 (Tower.makeFallingPerson:327-342): toon 随机, 初帧 gotoAndStop(9),
// Flipbook 11→35 / 2000ms 循环; Path 到 ±100 / +100px 时长 5000ms → vx=±0.02, vy=0.02 px/ms
function spawnFallingPerson(x, y) {
  const toon = Math.floor(Math.random() * 2);
  const mat = new THREE.SpriteMaterial({ map: G.texPeople[toon][8], transparent: true }); // 帧 9
  const sp = new THREE.Sprite(mat);
  sp.scale.set(42, 56, 1);
  sp.position.set(x, y, 2);
  scene.add(sp);
  G.fallingPeople.push({ sp, toon, f: 9, animT: 0,
    vx: (Math.random() - 0.5) * 2 * 100 / 5000, vy: 100 / 5000, life: 5000 });
  // swoosh_spr 翻页 1→3/150ms setKillSprite (makeFallingPerson:329-334, 读图 46x66)
  const sw = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.texSwoosh[0], transparent: true }));
  sw.scale.set(46, 66, 1); sw.position.set(x, y, 1);
  scene.add(sw);
  let sf = 1;
  const siv = setInterval(() => {
    if (++sf > 3) { clearInterval(siv); scene.remove(sw); return; }
    sw.material.map = G.texSwoosh[sf - 1];
  }, 150);
}

function knockTopBlock() { // Tower.knockNextBlock
  const top = G.blocks.pop();
  // knockNextBlock:169-170: offset = 新顶块x − 被弹块x (确定性方向), wait=DELAY_FINAL_TUMBLE=250ms
  const under0 = G.blocks[G.blocks.length - 1];
  const kOff = (under0 ? under0.mesh.position.x + (under0.cx || 0) : G.currCtr)
    - (top.mesh.position.x + (top.cx || 0));
  pushBounce(top.mesh, kOff, 250);
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
let popEl = null;
function popFloat(txt, life = 1200) { // bonus_spr 在 (321,31) 人口 HUD 中心, 生命 1200/3000ms
  const m = document.createElement('div');
  m.textContent = txt;
  m.style.cssText = `position:absolute;top:64px;right:52px;color:#ffe27a;font-size:16px;font-weight:bold;` +
    `text-shadow:1px 1px 2px #000;transition:opacity ${life}ms;`;
  hud.hudEl.appendChild(m);
  popEl = m;
  setTimeout(() => { m.style.opacity = '0'; }, life * 0.3);
  setTimeout(() => { m.remove(); if (popEl === m) popEl = null; }, life + 50);
}
function popClear() { if (popEl) { popEl.remove(); popEl = null; } } // showPopChange(-999) (GameModel.as:147-151)

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
  if (G.blockTime === -1 || performance.now() < G.blockTime) return;
  // blockTime=-1 = 弹窗期禁放 (Crane.delayNextBlock:123 delayNextBlock(-1)/buttonPressed:155)
  const tpl = blockTemplate(G.stacked);
  const mesh = tpl.clone();
  mesh.scale.setScalar(tpl.userData.s);
  const hx = G.hanging ? G.hanging.position.x : -(tpl.userData.cx || 0);
  const hy = G.hanging ? G.hanging.position.y : -60 - (tpl.userData.cy || 0);
  const x = craneGroup.position.x + hx, y = craneGroup.position.y + hy; // 生成于挂块实际位置(含倾斜偏移)
  mesh.position.set(x, y, 0);
  scene.add(mesh);
  // Crane.dropTarget: blockDx = dx (释放帧钩速 px/帧); 落块带惯性漂移 x + blockDx*3 (Crane.as:198-199)
  const bdx = G.craneDx || 0;
  // Crane.dropTarget: 落程 = dropY - 块屏幕y (固定屏幕落点, 与塔高无关), 时长=落程*2ms → 0.5px/ms;
  // dropY 首块 400、之后恒 340 (Crane.as:57,201)
  const hangScreenY = STAGE_H / 2 - (y - G.camY);
  const fallDist = Math.max(1, G.dropY - hangScreenY);
  // Rotater (dropTarget:202 rotateBlock 时): 挂块倾斜角在下落期间线性回正到 0
  mesh.rotation.z = G.hanging ? G.hanging.rotation.z : 0;
  G.falling = { mesh, vy: DROP_SPD, cy: tpl.userData.cy, bdx, vx: bdx * 3 / (fallDist * 2), left: fallDist,
    left0: fallDist, rot0: mesh.rotation.z };
  G.dropY = 340;                                 // Crane.dropTarget 末尾: this.dropY = 340
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

// ---- J2ME MIDI 可选 BGM (j2me/res/nokia_v1011/80-82.mid, format0/480tick;
// 原版 o.java: Manager.createPlayer "audio/midi" + VolumeControl 40) —— WebAudio 合成, 默认关 ----
function parseMidi(buf) {
  const dv = new DataView(buf);
  let p = 0;
  if (dv.getUint32(0) !== 0x4d546864) return null;                 // MThd
  const div = dv.getUint16(12); p = 14;
  const notes = []; let secPerTick = 500000 / 1000 / div;
  for (let t = 0; t < dv.getUint16(10); t++) {
    if (dv.getUint32(p) !== 0x4d54726b) return null;               // MTrk
    p += 8;
    const end = p + dv.getUint32(p - 4);
    let tick = 0;
    const readVar = () => { let v = 0; for (;;) { const b = dv.getUint8(p++); v = (v << 7) | (b & 0x7f); if (!(b & 0x80)) return v; } };
    while (p < end) {
      tick += readVar();
      const st = dv.getUint8(p++);
      if (st === 0xff) {
        const type = dv.getUint8(p++), l = readVar();
        if (type === 0x51 && l === 3) secPerTick = ((dv.getUint8(p) << 16) | (dv.getUint8(p + 1) << 8) | dv.getUint8(p + 2)) / 1e6 / div;
        p += l;
      } else if (st === 0xf0 || st === 0xf7) p += readVar();
      else {
        const hi = st & 0xf0, n = dv.getUint8(p++), v = dv.getUint8(p++);
        if (hi === 0x90 && v > 0) notes.push({ t: tick * secPerTick, n, d: 0 });
        else if (hi === 0x80 || (hi === 0x90 && v === 0)) {
          for (let i = notes.length - 1; i >= 0; i--) if (notes[i].n === n && !notes[i].d) { notes[i].d = tick * secPerTick - notes[i].t; break; }
        }
      }
    }
    p = end;
  }
  const good = notes.filter(x => x.d > 0);
  return { notes: good, total: Math.max(1, ...good.map(x => x.t + x.d)) };
}
let midiCtx = null, midiTimer = 0, midiTrack = 81;                 // 81.mid = 主旋律 (10.4KB 最长)
function playMidiSchedule() {
  if (!G.midiOn || !midiCtx) return;
  const t0 = midiCtx.currentTime + 0.1;
  for (const x of midiCtx._notes) {
    const osc = midiCtx.createOscillator(), g = midiCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 440 * Math.pow(2, (x.n - 69) / 12);
    g.gain.setValueAtTime(0.0001, t0 + x.t);
    g.gain.linearRampToValueAtTime(0.09, t0 + x.t + 0.02);         // 原版 VolumeControl 40 → 低音量
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + x.t + x.d);
    osc.connect(g).connect(midiCtx.destination);
    osc.start(t0 + x.t); osc.stop(t0 + x.t + x.d + 0.05);
  }
  midiTimer = setTimeout(playMidiSchedule, midiCtx._total * 1000); // setLoop
}
function toggleMidi() {
  G.midiOn = !G.midiOn;
  localStorage.setItem('twrblx_midi', G.midiOn ? '1' : '0');
  if (G.midiOn) {
    if (!midiCtx) midiCtx = new (window.AudioContext || window.webkitAudioContext)();
    midiCtx.resume && midiCtx.resume();
    fetch(`./assets/midi/${midiTrack}.mid`).then(r => r.arrayBuffer()).then(buf => {
      const parsed = parseMidi(buf);
      if (!parsed) { G.midiOn = false; return; }
      midiCtx._notes = parsed.notes; midiCtx._total = parsed.total;
      clearTimeout(midiTimer); playMidiSchedule();
    });
  } else {
    clearTimeout(midiTimer);
    if (midiCtx) midiCtx.close(), midiCtx = null;
  }
}
G.midiOn = localStorage.getItem('twrblx_midi') === '1';
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
      const step = f.vy * dt;
      f.mesh.position.y -= step;           // 匀速 tween (Crane.dropTarget Path)
      f.mesh.position.x += f.vx * dt;      // 惯性漂移 (Crane.as:199 path x+blockDx*3)
      f.left -= step;
      f.mesh.rotation.z = f.rot0 * Math.max(0, f.left) / f.left0; // Rotater 线性回正 (dropTarget:202)
      if (f.left <= 0) {
        scene.remove(f.mesh);
        G.falling = null;
        // 块中心 - 塔顶中心(含摇晃倾斜投影): Tower.as:118 calcX(landingY, rot+90) = -h*sin(rot)
        const lean = Math.sin(towerGroup.rotation.z) * G.landingY;
        const offset = Math.round(f.mesh.position.x + f.cx - (G.currCtr - lean));
        blockLanded(offset, f.bdx, f.mesh);
      }
    }

    // 摇晃 (Tipper.updateTower): 塔绕底部枢轴旋转
    if (!G.over) towerGroup.rotation.z = THREE.MathUtils.degToRad(swayAngle(dt));
    // 地基塔身抖动 (landOnTower:217-219): y-5 osc 75ms×6 次 = 900ms
    if (G.shakeT != null) {
      G.shakeT += dt;
      towerGroup.position.y = G.shakeT < 900 ? -5 * (0.5 + 0.5 * Math.sin(2 * Math.PI * G.shakeT / 150)) : 0;
      if (G.shakeT >= 900) G.shakeT = null;
    }

    // miss 坠块 (fallPastTower: 坠到 viewHeight+200)
    for (let i = G.missFall.length - 1; i >= 0; i--) {
      const q = G.missFall[i];
      q.mesh.position.y -= q.vy * dt;
      if (q.mesh.position.y < G.camY - STAGE_H) {
        scene.remove(q.mesh); G.missFall.splice(i, 1);
        setTimeout(() => playSound('snd_destroy'), 100); // Message dur+100ms (Tower.as:389-390)
      }
    }

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
      // Person.eachTick 帧状态机 (30fps=每 33.3ms 一帧): frame==1→randRange(0,9) 起播;
      // frame==35→11 走路循环; 到达后 <36→36 播到 56, 56 帧起 Fader 250ms (Person.as:32-66)
      if (!q.fading) {
        q.animT += dt;
        while (q.animT >= 1000 / CRANE_FPS) {
          q.animT -= 1000 / CRANE_FPS;
          if (q.f === 1) q.f = 1 + Math.floor(Math.random() * 10);      // randRange(0, TOON_FRM_START_LOOP-2)
          else if (q.f === 35 && !q.arrived) q.f = 11;                  // TOON_FRM_END_LOOP → START_LOOP
          else if (q.arrived && q.f < 36) q.f = 36;
          else if (q.arrived && q.f >= 56) { q.f = 56; q.fading = now; } // TOON_FRM_LAST → Fader
          else q.f++;
          q.sp.material.map = G.texPeople[q.toon][q.f - 1];
        }
        if (now >= q.next) {
          q.next = now + 50;
          const dx = Math.max(-q.seekMax, Math.min(q.seekMax, (q.sp.position.x + (0 - q.tx)) / -2));
          const dy = Math.max(-q.seekMax, Math.min(q.seekMax, (q.sp.position.y + (0 - q.ty)) / -2));
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) q.arrived = true;
          else q.sp.position.x += dx, q.sp.position.y += dy;
        }
      } else if (now >= q.fading) {
        q.sp.material.opacity -= dt / 250;
        if (q.sp.material.opacity <= 0) { towerGroup.remove(q.sp); G.people.splice(i, 1); }
      }
    }
    // 落块 Rotater 渐正 (landOnTower:211: offset/2→0 over DELAY_PAN_UP=500ms)
    for (let i = G.straighten.length - 1; i >= 0; i--) {
      const q = G.straighten[i];
      q.t += dt;
      const u = Math.min(1, q.t / 500);
      q.mesh.rotation.z = q.rot0 * (1 - u);
      if (u >= 1) G.straighten.splice(i, 1);
    }

    // 火花
    // 撞塔弹飞块 (bounceOffTower BPath 三次贝塞尔 + Rotater 359°/s 循环, 1000ms 后自毁)
    for (let i = G.bounces.length - 1; i >= 0; i--) {
      const b = G.bounces[i];
      b.t += dt;
      if (b.t < 0) continue;                     // wait 期 (bounceOffTower wait 参数)
      const u = Math.min(1, b.t / 1000), v = 1 - u;
      const bez = (a, b2, c, d) => v * v * v * a + 3 * v * v * u * b2 + 3 * v * u * u * c + u * u * u * d;
      b.mesh.position.set(
        bez(b.p0.x, b.p1.x, b.p2.x, b.p3.x),
        bez(b.p0.y, b.p1.y, b.p2.y, b.p3.y), 0);
      b.mesh.rotation.z += b.rotDir * 2 * Math.PI * dt / 1000;
      if (u >= 1) { scene.remove(b.mesh); G.bounces.splice(i, 1); }
    }
    for (let i = G.sparks.length - 1; i >= 0; i--) {
      const q = G.sparks[i];
      q.sp.position.x += q.vx * dt / 1000; q.sp.position.y += q.vy * dt / 1000;
      q.life -= dt; q.sp.material.opacity = Math.max(0, q.life / 500);
      if (q.life <= 0) { scene.remove(q.sp); G.sparks.splice(i, 1); }
    }
    // 坠落小人
    for (let i = G.fallingPeople.length - 1; i >= 0; i--) {
      const q = G.fallingPeople[i];
      q.sp.position.x += q.vx * dt; q.sp.position.y -= q.vy * dt;
      // Flipbook 11→35 / 2000ms 循环 (makeFallingPerson:337): 25 帧/2000ms = 12.5fps 翻页
      q.animT += dt;
      while (q.animT >= 80) {
        q.animT -= 80;
        q.f = q.f >= 35 ? 11 : q.f + 1;
        q.sp.material.map = G.texPeople[q.toon][q.f - 1];
      }
      q.life -= dt;
      if (q.life <= 0 || q.sp.position.y < G.camY - STAGE_H) { scene.remove(q.sp); G.fallingPeople.splice(i, 1); }
    }

    // 相机跟随 (pan up); 胜利 panDown 用精确 tween 时长 (Tower.panDown:199-201 Path dur)
    if (G.panDownDur != null) {
      G.panDownT = (G.panDownT || 0) + dt;
      const u = Math.min(1, G.panDownT / G.panDownDur);
      G.camY = G.panDownStartY * (1 - u);
      if (u >= 1) G.panDownDur = null;
    } else {
      const camTargetY = Math.max(0, G.landingY - STAGE_H / 2 + 3 * BLOCK_H);
      G.camY += (camTargetY - G.camY) * Math.min(1, dt / DELAY_PAN_UP);
    }
    camera.position.y = G.camY;

    // 挂钩待放积木 (Crane.updateBlock: targetSpr 随钩, _rotation = -(endx-320)/5 度, 挂点 hook.y+100)
    if (ready && !G.falling && !G.over && G.hangingFor !== G.stacked) {
      if (needRoof(G.stacked)) G.trophyRoof = G.cleanTower; // Crane.setTarget: trophyRoof = needRoof && cleanTower
      if (G.hanging) craneGroup.remove(G.hanging);
      const tpl = blockTemplate(G.stacked);
      G.hanging = tpl.clone();
      G.hanging.scale.setScalar(tpl.userData.s);
      G.hangingFor = G.stacked;
      // makeBlock:135-138: combo 进行中的挂块加银火花 (sparkle gotoAndPlay(2); clearSparkles 随块回收)
      if (G.comboMult !== 0 && G.stacked > 0 && !needRoof(G.stacked)) {
        const st = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.texStar, transparent: true }));
        st.scale.set(24, 22, 1);
        st.position.set(0, BLOCK_H / 2, 5);
        G.hanging.add(st);
      }
      craneGroup.add(G.hanging);
    }
    if (G.hanging) {
      // updateBlock (Crane.as:66-79): 仅 rotateBlock(首块/屋顶块除外)倾斜; 块心沿 ang+90 偏移 targetDy=65
      if (G.stacked > 0 && !needRoof(G.stacked)) {
        const ang = -((craneGroup.position.x + STAGE_W/2) - TOWER_START_X) / 5;
        const th = (ang + 90) * Math.PI / 180;
        G.hanging.rotation.z = THREE.MathUtils.degToRad(ang);
        G.hanging.position.set(-(G.hanging.userData.cx || 0) + 65 * Math.cos(th),
          -60 - (G.hanging.userData.cy || 0) - 65 * Math.sin(th), 0);
      } else {
        G.hanging.rotation.z = 0;                  // 首块/屋顶块直立 (else 分支 :76-80)
        G.hanging.position.set(-(G.hanging.userData.cx || 0), -60 - (G.hanging.userData.cy || 0), 0);
      }
    }

    // combo 计时
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) finishCombo(); addHud(); }
    else if (hud.combo.style.display !== 'none') addHud();
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
