// 模块级执行测试: stub DOM/WebGL/Audio 后真正 import game.js, 跑主循环+模拟放块。
// 目的: 堵住纯静态 smoke 测不出加载期崩溃/运行期异常的盲区 (第 20 轮教训)。
// 用法: node exec_test.js
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const h5 = path.dirname(path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')));
let fail = 0;
const check = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + msg); if (!cond) fail++; };

// ---- DOM stubs ----
const elCache = new Map();
const fire = (id, type) => {
  const e = elCache.get('el:' + id);
  if (!e || !e._l || !e._l[type]) return false;
  e._l[type].forEach(f => f({ stopPropagation() {}, preventDefault() {} }));
  return true;
};
const el = (id) => {
  if (id !== undefined && elCache.has('el:' + id)) return elCache.get('el:' + id);
  const e = {
    style: {}, textContent: '', innerHTML: '', dataset: {}, children: [],
    appendChild(c) { this.children.push(c); }, remove() {},
    _l: {},
    addEventListener(t, f) { (this._l[t] ||= []).push(f); },
    removeEventListener() {},
    querySelector(s2) { this._q = this._q || {}; if (!this._q[s2]) this._q[s2] = el('q:' + (this._qid || '') + s2); return this._q[s2]; },
    querySelectorAll: () => [],
    classList: { add() {}, remove() {}, toggle() {} },
    set onclick(f) { this._onclick = f; }, get onclick() { return this._onclick; },
    prepend() {},
  };
  if (id !== undefined) { elCache.set('el:' + id, e); e._qid = id; }
  e.getContext = () => new Proxy({}, { get: (t, k) => {
    if (k === 'canvas') return e;
    return () => undefined;      // 吸收全部 GL 调用
  }, set: () => true });
  return e;
};
const listeners = {};
globalThis.document = {
  getElementById: (id) => el('id:' + id),
  createElement: () => el(),
  createElementNS: (ns, tag) => {
    if (tag === 'img') return { // ImageLoader 用: src 一设即触发 onload, 尺寸假 64x64
      _w: 64, _h: 64,
      get width() { return this._w; }, set width(v) { this._w = v; },
      get height() { return this._h; }, set height(v) { this._h = v; },
      set src(v) { setTimeout(() => this.onload && this.onload(), 0); },
      addEventListener(t, f) { if (t === 'load') this.onload = f; if (t === 'error') this.onerror = f; },
      removeEventListener() {},
      style: {},
    };
    return el();
  },
  addEventListener() {},
  querySelectorAll: () => [],
};
globalThis.window = globalThis;
globalThis.self = globalThis;
globalThis.addEventListener = (t, f) => { (listeners[t] ||= []).push(f); };
globalThis.localStorage = { _m: new Map(), getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }, setItem(k, v) { this._m.set(k, v); } };
const SCENARIO = process.argv[2] === 'city' ? 'city' : 'tower';
globalThis.location = { search: SCENARIO === 'city' ? '?mode=city' : '?mode=tower', pathname: '/index.html', href: 'http://x/index.html' };
globalThis.devicePixelRatio = 1;
globalThis.Audio = class { constructor() {} set loop(v) {} set src(v) {} play() { return Promise.resolve(); } pause() {} set currentTime(v) {} get currentTime() { return 0; } };
globalThis.Image = class { constructor() { this.width = 64; this.height = 64; } set src(v) { setTimeout(() => this.onload && this.onload(), 0); } addEventListener() {} };
globalThis.URLSearchParams = URLSearchParams;
globalThis.__errs = [];
globalThis.ProgressEvent = class { constructor(type, init) { this.type = type; Object.assign(this, init); } };

// rAF 手动步进
let rafCb = null;
globalThis.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
const frame = (t) => { const cb = rafCb; rafCb = null; cb && cb(t); };

// fetch: 相对路径 → h5 目录 (GLB 加载用)
const realFetch = globalThis.fetch;
globalThis.Request = class { constructor(url) { this.url = String(url); } };
globalThis.fetch = (url, opt) => {
  const u = typeof url === 'string' ? url : (url && url.url) || String(url);
  if (!u.startsWith('http') || u.includes('127.0.0.1')) {
    // file 读取: node fetch 不支持 file://, 用 fs + Response
    const abs = path.join(h5, u.replace(/^\.?\//, ''));
    try {
      const buf = fs.readFileSync(abs);
      return Promise.resolve(new Response(buf, { status: 200 }));
    } catch (e) {
      return Promise.resolve(new Response('not found', { status: 404 }));
    }
  }
  return realFetch(u, opt);
};

const hudCityGridChildren = () => {
  const g = document.getElementById('cityGrid');
  return g ? g.children.length : 0;
};

// 真实时钟帧驱动: secs 秒内每 16ms 一帧, 可选每 dropEvery 帧调 dropFn
async function runRealtime(secs, dropEvery, dropFn, t0) {
  let n = 0;
  const end = performance.now() + secs * 1000;
  while (performance.now() < end) {
    await new Promise(r => setTimeout(r, 16));
    n++;
    t = 500 + n * 16;
    // 玩家语义: tip 弹窗开着就点掉 (game.js __tipOpen 钩子)
    if (globalThis.__tipOpen) { const sm2 = document.getElementById('summary'); sm2.querySelector('.ok').onclick(); }
    if (dropEvery && n % dropEvery === 0) dropFn && dropFn();
    frame(t);
  }
}

// ---- 运行 ----
try {
  await import('./game.js');
  check(true, 'game.js 模块加载无异常 (无 TDZ/引用错误)');
} catch (e) {
  check(false, 'game.js 模块加载: ' + e.message);
  process.exit(1);
}

// 等 GLB 异步加载 + 纹理 onload 定时器
for (let i = 0; i < 100; i++) { await new Promise(r => setTimeout(r, 50)); frame(500 + i * 16); if (globalThis.__ready) break; } // 5s 轮询, 防高负载偶发
console.log('[dbg] errs=' + JSON.stringify(globalThis.__errs) + ' ready=' + globalThis.__ready);
check(globalThis.__ready === true, 'GLB 载入完成 (window.__ready)' + (globalThis.__errs && globalThis.__errs.length ? ' errs=' + JSON.stringify(globalThis.__errs) : ''));
// 等 Crane.restartGame 的 1s 落块锁走完 (真实时钟, 含 GLB 回调延迟)
await new Promise(r => setTimeout(r, 1400));

// 跑 600 帧 × 16ms ≈ 10 秒游戏时间, 期间按空格放块
let t = 1000;
try {
  for (let i = 0; i < 600; i++) {
    await new Promise(r => setTimeout(r, 2)); // 真实时钟: 放行 hideTip 的 blockTime=+100ms 锁
    t += 16;
    if (globalThis.__tipOpen) document.getElementById('summary').querySelector('.ok').onclick(); // 关提示弹窗
    if (i % 30 === 15) for (const f of listeners.pointerdown || []) f({ stopPropagation() {} });
    if (i % 30 === 16) for (const f of listeners.keydown || []) f({ code: 'Space', preventDefault() {} });
    frame(t);
  }
  check(true, '600 帧主循环无异常');
} catch (e) {
  check(false, '主循环异常: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | '));
  process.exit(1);
}

const dbg = globalThis.__dbg || {};
if (SCENARIO === 'tower') check((dbg.lands || []).length >= 3, `放块落地次数 = ${(dbg.lands || []).length} (期望 ≥3)`);

// ---- 场景 2: 菜单流 (标题点击 → 菜单 → Quick Game → 无尽模式放块) ----
// 回 tower 结算后的重启定时器/summary: 直接走菜单入口
if (SCENARIO === 'tower') {
  const title = document.getElementById('titleScr');
  if (title && title.onclick) title.onclick();          // STT_TITLE → STT_MENU
  const clicked = fire('id:mQuick', 'click');            // BTN_QUICK_GAME (GameSprites.as:347)
  check(clicked, '菜单 Quick Game 按钮已绑定');
  const menuEnd = performance.now() + 20000;
  for (let i = 0; i < 400 && performance.now() < menuEnd; i++) {
    await new Promise(r => setTimeout(r, 16));
    t += 16;
    if (i % 30 === 15) for (const f of listeners.pointerdown || []) f({ stopPropagation() {} });
    if (i % 30 === 16) for (const f of listeners.keydown || []) f({ code: 'Space', preventDefault() {} });
    frame(t);
  }
  check((globalThis.__dbg.lands || []).length >= 13, `菜单流+无尽模式放块落地 = ${(globalThis.__dbg.lands || []).length} (期望 ≥13)`);
}

// ---- 场景 city: 网格点击 → 建造 10 层 → 回城放置 → 存档 ----
if (SCENARIO === 'city') {
  check(hudCityGridChildren() === 25, '城市网格渲染 25 格 (实际 ' + hudCityGridChildren() + ')');
  // 选 Residential (cityMenu.children[0].onclick)
  const sel = document.getElementById('cityMenu').children[0];
  sel.onclick();
  // 点第 0 格 → 进入建造 (cityCellClick: isValid(0,0,0) 恒真)
  const cell0 = document.getElementById('cityGrid').children[0];
  cell0.onclick();
  // 放块至 10 层 (含屋顶)
  await runRealtime(25, 30, () => {
    globalThis.__drop && globalThis.__drop();
    const st = globalThis.__state();
    if (st.lives < 3 || st.over) console.log('[dbg] lives=' + st.lives + ' stacked=' + st.stacked + ' over=' + st.over);
  });
  console.log('[dbg] state=' + JSON.stringify(globalThis.__state()));
  check((globalThis.__dbg.lands || []).length >= 10, `城市塔建造落地 = ${(globalThis.__dbg.lands || []).length} (期望 ≥10)`);
  // 过关 → 结算面板 OK → finishCityTower(true) 放置+回城+存档 (GameState.as:138-147)
  await new Promise(r => setTimeout(r, 4200)); // gameOver: 1s delay + panDown(min(3000,stacked*250)) 后才弹结算
  const sm = document.getElementById('summary');
  const okBtn = sm.querySelector('.ok');
  check(!!okBtn && !!okBtn.onclick, '结算面板 OK 按钮就绪');
  okBtn.onclick();
  const save = JSON.parse(localStorage.getItem('twrblx_cookie') || '{}');
  check((save.sm_towerGridData || [])[1] > 0, `sm_towerGridData[1] 人口已写入 (${(save.sm_towerGridData || [])[1]})`);
  check((save.sm_towerGridData || [])[0] === 1, `塔色 type+1=1 已写入 (${(save.sm_towerGridData || [])[0]})`);
  check((save.sm_towerGridData || [])[2] === 1, '屋顶帧=1 已写入');
}

// 快进更多帧验证摇晃/结算路径不炸
try {
  for (let i = 0; i < 1200; i++) { t += 16; frame(t); }
  check(true, '再 1200 帧无异常');
} catch (e) {
  check(false, '后段主循环异常: ' + e.message);
}

process.exit(fail ? 1 : 0);
