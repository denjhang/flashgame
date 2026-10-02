// h5quick 无头执行测试 — DOM/WebGL/fetch/Image 全桩, 真实 import game.js 跑主循环+投放
// 用法: node exec_test.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const G = (m => m && m.default || m) || {};

// ---- DOM 桩 ----
const ctx2dStub = new Proxy(function () {}, {
  get: (t, k) => {
    if (k === 'canvas') return null;
    if (k === Symbol.toPrimitive) return () => 0;
    return ctx2dStub;                                      // 任何方法/属性都返回自身 (链式吸收)
  },
  set: () => true,
  apply: () => ctx2dStub,
});
function makeEl(id) {
  const el = {
    id, style: new Proxy({}, { get: () => '', set: () => true }),
    children: [], _handlers: {},
    getContext: (kind) => kind === '2d' ? ctx2dStub : null,
    addEventListener(ev, fn) { (this._handlers[ev] ||= []).push(fn); },
    appendChild(c) { this.children.push(c); return c; },
    querySelector: () => makeEl('q'), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 640 }),
    remove() {}, click() {},
    width: 240, height: 320, complete: true, naturalWidth: 21, naturalHeight: 28,
    classList: { add() {}, remove() {}, toggle() {} },
    textContent: '', innerHTML: '',
  };
  if (id === 'game' || id === 'hud2d') { el.width = 240; el.height = 320; }
  return el;
}
const els = {};
globalThis.document = {
  getElementById: id => els[id] ||= makeEl(id),
  createElement: tag => {
    if (tag === 'canvas') { const c = makeEl('c'); c.width = 1; c.height = 1; c.toDataURL = () => 'data:'; return c; }
    return makeEl('d');
  },
  createElementNS: (ns, tag) => {
    if (tag === 'img') { const im = new globalThis.Image(); return im; }
    return makeEl(tag);
  },
  querySelectorAll: () => [],
  body: makeEl('body'), head: makeEl('head'),
  addEventListener() {},
};
globalThis.window = globalThis;
globalThis.Image = class {
  constructor() { this.complete = false; this._src = ''; this._h = {}; }
  addEventListener(ev, fn) { (this._h[ev] ||= []).push(fn); }
  removeEventListener(ev, fn) { this._h[ev] = (this._h[ev] || []).filter(f => f !== fn); }
  set src(v) { this._src = v; setTimeout(() => {
    this.complete = true; this.naturalWidth = 64; this.naturalHeight = 64;
    this._h.load?.forEach(fn => fn()); this.onload && this.onload();
  }, 0); }
  get src() { return this._src; }
};
globalThis.localStorage = {
  _d: {}, getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
};
globalThis.addEventListener = () => {};
// ---- fetch 桩: 读本地文件 (GLB/MIDI) ----
globalThis.self = globalThis;
globalThis.createImageBitmap = (buf) => Promise.resolve({ width: 64, height: 64, close() {} });
globalThis.Request = class { constructor(url) { this.url = String(url); } };
globalThis.fetch = (reqOrUrl) => {
  const url = typeof reqOrUrl === 'string' ? reqOrUrl : reqOrUrl.url;
  const p = path.join(ROOT, String(url).replace(/^\.?\//, ''));
  const ok = fs.existsSync(p);
  return Promise.resolve({
    ok, status: ok ? 200 : 404,
    arrayBuffer: () => ok ? fs.readFileSync(p).buffer.slice(fs.readFileSync(p).byteOffset,
      fs.readFileSync(p).byteOffset + fs.readFileSync(p).length) : new ArrayBuffer(0),
    headers: { get: () => 'application/octet-stream' },
  });
};
// ---- rAF 手动泵 ----
let rafQ = [];
globalThis.requestAnimationFrame = fn => (rafQ.push(fn), rafQ.length);
globalThis.performance = { now: () => tNow };
let tNow = 0;

// ---- 载入游戏 ----
const gameUrl = new URL('./game.js', import.meta.url).href;
await import(gameUrl);
const S = globalThis.__S;
const ok = (cond, name) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + name); if (!cond) process.exitCode = 1; };

// 推进虚拟时间: 每帧 25ms
function step(frames) {
  for (let i = 0; i < frames; i++) {
    tNow += 25;
    const q = rafQ; rafQ = [];
    for (const fn of q) fn(tNow);
  }
}
async function settleBooted() {
  for (let i = 0; i < 2000 && !(globalThis.__S && S && S.cg > 0); i++) {
    step(1);
    await new Promise(r => setTimeout(r, 0));   // 泵真实定时器 (Image onload / boot 轮询)
  }
}
await settleBooted();
globalThis.__DBG_ON = process.env.DBG === "1"; globalThis.__DBG2 = process.env.DBG2 === "1";
ok(S && S.cg > 0, '游戏主循环运转 (cg=' + (S && S.cg) + ')');
ok(S.aw[0] === 1 || S.aw[0] === 6, '摆钩就位 (aw[0]=' + S.aw[0] + ')');

// 摆幅验证: bs=0 时 cQ 应接近 aQ[0]=213 (不是城市分支的 256+)
ok(Math.round(S.cQ) === 213, '摆幅初值=213 (快速局分支, 工单#1) cQ=' + S.cQ.toFixed(1));

// 相机到位 + 挂钩态后投放
for (let i = 0; i < 4000 && !(S.aW === S.aX && S.aw[0] === 1); i++) step(1);
ok(S.aW === S.aX, '相机到位 (aW==aX)');
for (let i = 0; i < 4000 && Math.abs(S.aK) >= 50; i++) step(1);   // 等钩到塔心 (aw==1)
S.aw[0] = 2; S.aD[0] = S.aL; S.ay[0] = 0; S.aE = S.cg; S.aO = S.aL; S.aN = S.aK;
let landed = false, guard = 0;
while (!landed && guard++ < 3000) {
  step(1);
  if (guard % 20 === 0 && globalThis.__DBG_ON !== false) console.log('t', S.cg, 'aA', S.aA[0].toFixed(0), 'az', S.az[0].toFixed(0), 'aD', S.aD[0].toFixed(0), 'aC', S.aC[0].toFixed(1), 'bj0', S.bj[0], 'bi0', S.bi[0], 'aw', S.aw[0]);
  if (S.aw[0] === 4 || S.aw[0] === 5 || S.ba < 3) landed = true;
}
ok(landed, '投放块有终态 (aw[0]=' + S.aw[0] + ', bs=' + S.bs + ')');

// 连打 40 次: 每摆周期跟踪预测落点偏差, 在最优点投放 (模拟熟练玩家)
for (let k = 0; k < 40 && !S.over; k++) {
  let best = 1e9;
  for (let i = 0; i < 4000; i++) {
    step(1);
    if (S.over) break;
    if (S.aw[0] !== 1 || S.aW !== S.aX) continue;
    const vc = S.aC[0] / 256, dy = Math.max(0, S.aL - S.bj[S.by]);
    const tFall = 100 * (Math.max(vc, 0) + Math.sqrt(Math.max(0, vc * vc + 4 * dy / 200)));
    const dev = Math.abs(S.aK + S.aB[0] * tFall / 512 - S.bi[S.by]);
    if (dev < best) best = dev;
    if (dev <= Math.max(24, best) && i > 60) break;          // 到达本周期最优点
  }
  if (S.over) break;
  S.aw[0] = 2; S.aD[0] = S.aL; S.ay[0] = 0; S.aE = S.cg; S.aO = S.aL; S.aN = S.aK;
  if (globalThis.__DBG_ON && k >= 2) console.log('REL k=' + k, 'aL=' + S.aL.toFixed(0), 'aK=' + S.aK.toFixed(0), 'aB=' + S.aB[0].toFixed(0), 'aC=' + S.aC[0].toFixed(0), 'by=' + S.by, 'bs=' + S.bs, 'bj3=' + S.bj[3].toFixed(0), 'bi3=' + S.bi[3].toFixed(0), 'aX=' + S.aX.toFixed(0), 'aW=' + S.aW.toFixed(0), 'aJ=' + aJglobal());
  for (let z = 0; z < 200 && S.aw[0] === 2; z++) {
    step(1);
    if (globalThis.__DBG_ON && k >= 2 && z % 5 === 0) console.log('  F z=' + z, 'aA=' + S.aA[0].toFixed(0), 'az=' + S.az[0].toFixed(0), 'dD=' + S.dD, 'bj=[' + S.bj.map(v=>v.toFixed(0)) + ']');
  }
}
function aJglobal(){ return 0; }
ok(S.bs >= 5, '多轮投放后层数增长 (bs=' + S.bs + ')');
ok(S.bt > 0, '人口结算 (bt=' + S.bt + ')');

// 摆幅随层数: bs≥5 后 cQ > 213+bs*2.85*0.8 (60 层线性递增验证)
if (S.bs >= 5) {
  const expect = 213 + S.bs * (384 - 213) / 60;
  ok(Math.abs(S.cQ - Math.min(384, expect)) < 5, '摆幅按 60 层线性递增 cQ=' + S.cQ.toFixed(1) + ' 期望≈' + Math.min(384, expect).toFixed(1));
}
// 摇摆相位 (DC 语义): bk!=2 常态持续摆, bw=0 时 cS=-cos(0)=-1
S.bw = 0; S.bk = 0; step(1);
ok(S.cS < -0.99, '摇摆相位 cS=-cos 常态持续 (DC f:int) cS=' + S.cS.toFixed(3));
console.log('--- 完成: bs=' + S.bs + ' bt=' + S.bt + ' ba=' + S.ba + ' cg=' + S.cg);
