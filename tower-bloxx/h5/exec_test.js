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
    querySelector: () => el(), querySelectorAll: () => [],
    classList: { add() {}, remove() {}, toggle() {} },
    set onclick(f) { this._onclick = f; }, get onclick() { return this._onclick; },
    prepend() {},
  };
  if (id !== undefined) elCache.set('el:' + id, e);
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
globalThis.location = { search: '?mode=tower', pathname: '/index.html', href: 'http://x/index.html?mode=tower' };
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

// ---- 运行 ----
try {
  await import('./game.js');
  check(true, 'game.js 模块加载无异常 (无 TDZ/引用错误)');
} catch (e) {
  check(false, 'game.js 模块加载: ' + e.message);
  process.exit(1);
}

// 等 GLB 异步加载 + 纹理 onload 定时器
for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 50)); frame(500 + i * 16); if (globalThis.__ready) break; }
console.log('[dbg] errs=' + JSON.stringify(globalThis.__errs) + ' ready=' + globalThis.__ready);
check(globalThis.__ready === true, 'GLB 载入完成 (window.__ready)' + (globalThis.__errs && globalThis.__errs.length ? ' errs=' + JSON.stringify(globalThis.__errs) : ''));

// 跑 600 帧 × 16ms ≈ 10 秒游戏时间, 期间按空格放块
let t = 1000;
try {
  for (let i = 0; i < 600; i++) {
    t += 16;
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
check((dbg.lands || []).length >= 3, `放块落地次数 = ${(dbg.lands || []).length} (期望 ≥3)`);

// ---- 场景 2: 菜单流 (标题点击 → 菜单 → Quick Game → 无尽模式放块) ----
// 回 tower 结算后的重启定时器/summary: 直接走菜单入口
{
  const title = document.getElementById('titleScr');
  if (title && title.onclick) title.onclick();          // STT_TITLE → STT_MENU
  const clicked = fire('id:mQuick', 'click');            // BTN_QUICK_GAME (GameSprites.as:347)
  check(clicked, '菜单 Quick Game 按钮已绑定');
  for (let i = 0; i < 400; i++) {
    t += 16;
    if (i % 30 === 15) for (const f of listeners.pointerdown || []) f({ stopPropagation() {} });
    if (i % 30 === 16) for (const f of listeners.keydown || []) f({ code: 'Space', preventDefault() {} });
    frame(t);
  }
  check((globalThis.__dbg.lands || []).length >= 13, `菜单流+无尽模式放块落地 = ${(globalThis.__dbg.lands || []).length} (期望 ≥13)`);
}

// 快进更多帧验证摇晃/结算路径不炸
try {
  for (let i = 0; i < 1200; i++) { t += 16; frame(t); }
  check(true, '再 1200 帧无异常');
} catch (e) {
  check(false, '后段主循环异常: ' + e.message);
}

process.exit(fail ? 1 : 0);
