// ============================================================================
// 都市摩天楼 快速游戏 — J2ME 忠实独立移植 (h5quick)
// 唯一参照: House.java (Nokia City Bloxx 2008 v1.0.12) + r0 资源 + scene.m3g + MIDI。
// 公式与行号引注见 ../j2me/deobf/TOWER_CORE.md。禁止任何 Flash 版内容混入。
// 世界单位: 256 = 1 层楼 (J2ME 定点 256=1.0 的世界坐标语义)。
// ============================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LibMidi, createUnlockingAudioContext } from './js/midi/libmidi.js';   // 工单#10: MIDI 直接抄 j2me web (freej2me-web libmidi)

// ---- 常量与表 (static :4326-4418 / y():1389 / K()) ----
const E = 240, F = 320;                    // 屏宽高 (E,F)
const FLOOR = 256;                         // 1 层 = 256 世界单位 (A():(bs-6)*256+128 / K():bj[0]=-256)
const aT = E >> 1, aU = F >> 1;            // 屏幕塔锚点 (y():1391)
const bd = 256 * E / 32, be = 256 * F / 32;// 世界宽高 (y():1393) = 1920/2560
const aJ0 = 2432, aH0 = 1664;              // 吊钩基线/提钩顶 (K()/static)
const aQ = [213, 256, 298, 341, 384];      // 横摆幅表 (aS..) :4346
const aR = [85, 106, 128, 149, 170];       // 纵摆幅表 :4347
const aS = [1670, 1700, 1650, 1600, 1550, 1500, 1450]; // 周期表 :4348
const ck = [0, 150, 350, 550, 750];        // 砸地延迟基准 :4373
const bO = [0xB2D6F2,0x9AC8EA,0x80BBE7,0x66AFE4,0x518EE4,0x407ABE,0x1C5B96,0x0C3F7C,
            0x13306A,0x34204C,0x372C51,0x2D4B4B,0x4A6742,0x674723,0x532733,0x802A2B,0x511A2F]; // 17 色带 :4367
const BL = 4;                              // 快速局塔色索引 (n():3115 bl=4 → aQ[4], aS[6])
const BG = 40;                             // bg=k[3] (k={10,20,30,40})
const cd = Math.max(be, 2048);             // 世界深 (y():1446)
const jD = d => Math.sin(d * Math.PI / 180);   // j():4138 sin 查表 (32768=1.0, 此处浮点等价)
const kD = d => -Math.cos(d * Math.PI / 180);  // k():4145 = j(d-90) = -cos  ← H5 旧版相位 bug 的正解
const iR = n => Math.floor(Math.random() * n);  // i():4134

// ---- 游戏状态 (字段语义见 FIELDS.md) ----
const S = {
  cg: 0, cM: 0,                            // 游戏时钟 / 帧累子 (tick 门 25ms)
  bs: 0, bx: 0, by: 0,                     // 层数 / 可见窗
  aF: new Array(20).fill(0),               // 层落点偏移环缓冲
  bi: [0,0,0,0,0], bj: [-FLOOR,0,0,0,0],   // 层中心 x / 层顶 y
  bh: [0,0,0,0,0], cF: [0,0,0,0,0],        // 层渲染 x / 持久倾斜
  aw: [1,0,0,0,0], ax: [0,0,0,0,0], ay: [0,0,0,0,0], az: [0,0,0,0,0], aA: [0,0,0,0,0],
  aB: [0,0,0,0,0], aC: [0,0,0,0,0], aD: [0,0,0,0,0], cG: [0,0,0,0,0], cH: [0,0,0,0,0],
  cl: [0,0,0,0,0], cm: [[0,0,0,0,0],[0,0,0,0,0]],
  aP: 0, cP: aS[0], cQ: aQ[0], cR: aR[0], cO: 0,           // 摆钩参数
  aK: 0, aL: 0, aM: 0, aN: 0, aO: 0, aH: aH0,              // 摆钩位置/速度
  aV: 0, aW: 512, aX: 512, aY: 0,                          // 相机
  bm: 0, bn: 0, bo: 0,                                     // 倾斜累计/地基偏差
  bw: 0, bu: 0, bv: 0, br: 0, cS: 0,                       // 塔摇摆
  bt: 0, bB: 0, bz: 0, bA: 0, bC: 0,                       // 人口/银行/连击
  ba: 3, bb: 0, bc: 0, cN: -9999,                          // 机会
  bk: 0, dD: 0, aE: 0, dE: 0, ch: -9999, cK: false,        // 阶段/游标/时刻
  over: false, people: [],                                 // 惊慌人群 8 槽
  cj: [0,0,0,0,0,0],                                       // 纪录 [3]人口 [4]高度 [5]组合
};
window.__S = S;

// ---- z(int) 层数变更总响应 (:2944-2996) — 含 §13 工单#1/#2/#7 修正 ----
function zFloor(d) {
  if (d < 0) {                                             // 弹层扣分: 按当前顶层偏移档 (z:-1 分支)
    const off = Math.abs(S.aF[(S.bs - 1) % 20]);
    y(off < 25 ? -4 : off < 50 ? -3 : off < 80 ? -2 : -1);
  }
  if (d > 0 && S.bs > 4) S.bn += S.aF[S.bx % 20];
  else if (d < 0) S.bm -= S.aF[(S.bs - 1) % 20];
  S.bs += d;
  S.bx = Math.max(0, S.bs - 5);
  S.by = Math.min(4, S.bs - 1);
  if (d < 0) S.bn -= S.aF[S.bx % 20];
  let dF = 0;
  for (let i = S.bx; i < S.bs; i++) dF += Math.abs(S.aF[i % 20]);
  dF = Math.min(Math.floor(S.bs * (dF / 5) / 20), 100);
  S.bv = Math.min(S.bs / 2 + Math.abs(S.bm) / 20, S.bs * (S.bs / 2 + Math.abs(S.bm) / 20) / 6);
  S.dF = dF;                                               // 供 A() 摇摆修正
  // 快速局分支 (e≠5, bl=4, z:2977-2991): 60 层到满幅, cO 含 bs≥100 深塔分支
  const old = S.cP;
  S.cQ = Math.min(aQ[BL], aQ[0] + S.bs * (aQ[BL] - aQ[0]) / 60);
  S.cR = Math.min(aR[BL], aR[0] + S.bs * (aR[BL] - aR[0]) / 60);
  if (S.bs < 100) {
    S.cO = -Math.min(128, S.bs * 256 / 200);
    S.cP = Math.max(aS[BL + 2], aS[0] - S.bs * (aS[0] - aS[BL + 2]) / 100);
  } else {
    S.cP = aS[BL + 1] - (S.bs - 100) * 100 / 150;
    S.cO = -Math.min(256, 128 + (S.bs - 100) * 256 / 300);
  }
  S.aP = S.aP * S.cP / old;                                // 相位守恒 (z:2992)
  if (d !== 0 && S.bk !== 1 && S.bk !== 4) oCam(d * 256);   // 原版仅 z(±1); z(0) 初始化不动相机
  horizonY = null;                                          // 相机变了重投影
}
// ---- A() 塔重建 (:1999-2072, 原文忠实): 层顶链式 +256, 层心=倾斜累计逐层传导 ----
// 顶块 (f==bs-1, 非 bg-1) 落地后三段缓动: <100ms v1/8+aF/6+t·aF/600;
// 100-500ms cT=v1/8+aF/6+(400-(t-100))·aF/2400; 500-800ms cT→v1 插值; ≥800 稳定
function rebuildFloors() {
  let v1 = 0;
  let var2 = S.bn + S.br;                                  // 累计倾斜 + 摆角偏移 (br=世界x单位)
  const bx = Math.max(0, S.bs - 5);
  let v4 = (bx - 1) * 256 + 128;                           // 层顶基准链起点
  let idx = 0;
  for (let f = bx; f < S.bs; f++) {
    const aFf = S.aF[f % 20];
    // 摇摆方向修正 (cS 规一化 ±1, 常数 29491200/32768=900, 58982400/32768=1800)
    const var9 = -S.dF * aFf * S.cS / 900;
    if (f === S.bs - 1 && f !== BG - 1) {
      const t = S.cg - S.dE;
      let v2;
      if (t < 100) v2 = v1 / 8 + aFf / 6 + t * aFf / 600;
      else if (t < 500) { v1 = v1 / 8 + aFf / 6 + (400 - (t - 100)) * aFf / 2400; S.cT = v1; v2 = v1; }
      else if (t < 800) v2 = S.cT - (S.cT - v1) * (t - 500) / 300;
      else v2 = v1;
      v1 = v2;
    }
    const v3 = S.cS > 0 ? v1 / 2 : -((v1 += var9)) / 2;
    S.bh[idx] = v1;                                        // 渲染偏移 (首层 −999/倒塌 −888 特殊标记省略)
    var2 += aFf + 2 * v1;
    S.bi[idx] = var2;                                      // 层中心 x
    S.bj[idx] = v4 + v3 + 256;                             // 层顶 y 链式
    v4 = S.bj[idx];
    idx++;
  }
}

// ---- o(int) 相机目标 / z() 相机跟随 (:1786/:1765) ----
function oCam(d) { S.aY = S.cg; S.aX = S.bs > 1 ? S.aX + d : 512; }
function camTick() {
  if (S.aW < S.aX) { S.aW = Math.min(S.aX, S.aX + (S.cg - S.aY - 500) * 256 / 500); aJ = S.aW + 1792 + 128; horizonY = null; }
  else if (S.aW > S.aX) { S.aW = Math.max(S.aX, S.aX - (S.cg - S.aY - 500) * 256 / 500); aJ = S.aW + 1792 + 128; horizonY = null; }
  // (z():1779 aJ 仅在相机移动帧更新; aW==aX 时保持 — 与原文 block6 一致)
  if (S.cg - S.cN < 800) { S.aW += 32 - iR(64); horizonY = null; }  // 扣命后 800ms 抖动 (i() 地平线随动)
}

// ---- p(int) 摆钩 (:1791-1815) — 工单#3/#4 正解: x∝-cos, y∝-sin ----
function swing(dt) {
  S.aP += dt;
  if (S.aw[0] === 6) {
    S.aH += 2 * dt / 3;
    const top = 1664;
    if (S.aH >= top) { S.aH = top; S.aw[0] = 1; }
  }
  const th = 200 * S.aP / S.cP % 360;
  S.aK = S.cQ * kD(th);                                    // aK = cQ·k(θ)>>15
  S.aM = S.aK >> 4;
  S.aL = aJ - S.cO - S.aH - S.cR * jD(th);                 // aL = aJ-cO-aH-(cR·sinθ)
  if (!S.swInit) { S.aN = S.aK; S.aO = S.aL; S.swInit = true; }  // 首摆速度基准 (防幽灵初速)
  if (S.aw[0] === 1 && S.bk !== 4) {
    S.aB[0] = (S.aK - S.aN) * 256 / dt;                    // 钩速 (惯性来源)
    S.aC[0] = (S.aL - S.aO) * 256 / dt;
  }
  S.aN = S.aK; S.aO = S.aL;
}
let aJ = aJ0;                                              // 吊钩基线跟随相机 (z():1779)

// ---- J() 投放 (:3716-3727): 挂钩态 + 相机到位才响应 ----
function drop() {
  if (S.over || S.aw[0] !== 1 || S.aW !== S.aX) return;
  S.aw[0] = 2;
  S.aD[0] = S.aL;                                          // 抛物线起点 = 当前钩高
  S.ay[0] = 0; S.aE = S.cg;
}

// ---- s(int) 块物理 (:1852-1994) ----
function blocks(dt) {
  let anyFalling = false;
  S.cK = false;
  for (let i = 0; i < 5; i++) {
    const st = S.aw[i];
    if (st === 1 || st === 6) {                            // 挂钩跟随
      S.ax[i] = S.aM; S.az[i] = S.aK; S.aA[i] = S.aL;
      return;
    }
    if (st === 3) {                                        // 屋顶落空收回 (快速局无屋顶, 备完整性)
      S.aA[i] += 15 * (S.cg - S.aE) >> 8;
      if (S.aA[i] >= aJ - 512 && S.bk !== 2) { S.aw[0] = 6; S.aH = 0; S.dD = Math.min(4, S.bs - 1); S.cP = aS[1]; }
      return;
    }
    if (st === 7) {                                        // 砸地横躺期满 → 落至层顶
      if (S.aE + S.cl[i] < S.cg) {
        S.aA[i] = S.bj[S.by]; S.az[i] = S.bi[S.by];
        S.aw[i] = 5; S.aD[i] = S.aA[i]; S.ax[i] = S.bh[S.by];
        panic(S.bs); zFloor(-1);
      }
      continue;
    }
    if (st !== 2 && st !== 5) continue;
    anyFalling = anyFalling || st === 2;
    const t = S.cg - S.aE - S.cl[i];
    // x 500ms 收敛 ax→ay (s:1906-1913)
    if (S.ax[i] < S.ay[i] && S.ax[i] !== 999)
      S.ax[i] = Math.min(S.ay[i], S.ax[i] + t * (S.ay[i] - S.ax[i]) / 500);
    else if (S.ax[i] > S.ay[i] && S.ax[i] !== 999)
      S.ax[i] = Math.max(S.ay[i], S.ax[i] - t * (S.ax[i] - S.ay[i]) / 500);
    // 旋转 500ms 收敛 cG→cH (s:1915-1924)
    if (S.cG[i] < S.cH[i] || S.cG[i] === 999)
      S.cG[i] = Math.min(S.cH[i], S.cG[i] + t * (S.cH[i] - S.cG[i]) / 500);
    else if (S.cG[i] > S.cH[i] && S.cG[i] !== 999)
      S.cG[i] = Math.max(S.cH[i], S.cG[i] - t * (S.cG[i] - S.cH[i]) / 500);
    // 抛物线 (s:1928-1936): aA = aD + aC·t/256 - t²/n10, 单帧钳 256
    const n10 = 200;
    const prev = S.aA[i];
    S.aA[i] = S.aD[i] + S.aC[i] * t / 256 - t * t / n10;
    if (S.aA[i] < prev - 256) S.aA[i] = prev - 256;
    S.az[i] += S.aB[i] * dt / 512;                         // 水平惯性 = 投放钩速持续作用
    if (S.aA[i] < S.aW - (be >> 1)) {                      // 出屏底 (s:1939-1949)
      S.cm[0][i] = S.az[i]; S.cm[1][i] = S.cg; S.aw[i] = 4;
      if (st === 2) { if (S.bA > 0) H(); A(1); S.cK = true; }
      continue;
    }
    if (st === 2 && land()) {                              // G() 命中 (s:1951)
      return;                                              // 落住/过界分支内部已置状态
    }
  }
  if (S.aw[0] === 4 && S.aE < S.cg - 400 && !anyFalling) { // 提钩复位 (s:1983-1992)
    S.aH = 1664;
    if (S.bk !== 2) {
      S.aw[0] = 1; S.az[0] = S.aK; S.aA[0] = S.aL; S.cH[0] = 0; S.cG[0] = 0;
      S.dD = Math.max(0, Math.min(4, S.bs - 1));
    }
  }
}

// ---- F() 命中层定位 (:2776-2788) ----
function hitFloor() {
  let n = -1;
  do {
    if (S.aA[0] < S.bj[S.dD]) S.dD = Math.max(0, S.dD - 1);
    if (S.aA[0] >= S.bj[S.dD] + 256 || S.aA[0] <= S.bj[S.dD] - 256 ||
        S.az[0] >= S.bi[S.dD] + 256 || S.az[0] <= S.bi[S.dD] - 256) return n;  // 失配返回上个命中层 (n2 语义)
    n = S.dD--;
  } while (S.dD >= 0);
  return n;
}

// ---- G() 落块命中判定 (:2790-2918) ----
function land() {
  const n4 = hitFloor();
  if (n4 === -1) return false;                             // 未命中 → 继续坠
  S.aE = S.cg;
  const n3 = S.az[0] - S.bi[n4];
  const n2 = Math.abs(n3);
  if (S.bs === 0) {                                        // 地基 (:2811-2821)
    S.dE = S.cg; S.cN = S.cg; beep();
    S.aw[0] = 4; S.ax[0] = 0;
    S.bo = n3; S.bn = n3; S.bm = n3;
    zFloor(1);
    return true;
  }
  if (n4 !== Math.min(4, S.bs - 1)) {                      // 命中低层 → 计数连锁 (:2903-2915)
    const n7 = n3 / n2;
    chain(n7, Math.min(4, S.bs - 1) - n4 + 1);
    if (S.bA > 0) H();
    S.aw[0] = 5;
    S.aB[0] = n7 * 500; S.aD[0] = S.aA[0]; S.ay[0] = -n7 * 45; S.aC[0] = 50;
    return false;
  }
  if (n3 > 127 || n3 < -127) {                             // 顶层过界 (:2825-2844)
    if (S.bA > 0) H();
    S.aw[0] = 5;
    const n5 = n3 / Math.abs(n3);
    chain(n5, -1);                                         // 错位倾塌检查变体 (工单#9)
    S.aB[0] = n5 * 500; S.aD[0] = S.aA[0]; S.ay[0] = -n5 * 45;
    S.cH[0] = (1 - iR(2) * 2) * 60; S.aE = S.cg; S.aC[0] = 50;
    return false;
  }
  // 落住 (:2846-2901)
  S.aw[0] = 4; S.dE = S.cg;
  if (S.bz === 0) S.bB = 0;
  else if (S.bA > 0) { S.bz++; if (S.bz > 1) S.bC = Math.max(S.bC, S.bz); }
  else { S.bz = 1; if (S.bz > 1) S.bC = Math.max(S.bC, S.bz); }
  S.bm += n3;
  if (n2 < 25) {                                           // 完美 (:2860-2875)
    S.aF[S.bs % 20] = 0;
    S.bA = 6000;                                           // 固定 6000ms (工单#3)
    spawnPeople(4, S.bs + 1);
    S.ch = S.cg;
  } else {
    S.aF[S.bs % 20] = n3;
    spawnPeople(n2 < 50 ? 3 : n2 < 80 ? 2 : 1, S.bs + 1);
  }
  for (let i2 = 1; i2 < 5; i2++) S.cF[i2 - 1] = S.cF[i2];  // cF 下移 (:2880-2882)
  S.cF[n4] = n3 / 4;                                       // 持久倾斜 (工单#11)
  if (iR(2) === 0) S.cF[n4] = -S.cF[n4];
  zFloor(1);
  return true;
}

// ---- d(int,int) 连锁弹块 (:3008-3057) ----
function chain(dir, cnt) {
  if (cnt !== -1) {                                        // 计数连锁
    let n5 = S.by;
    if (cnt > 4) cnt = 4;
    for (let i = 0; i < cnt; i++) {
      if (S.bs === 1) { A(1); return; }
      const s = i + 1;
      S.ay[s] = -dir * 45; S.aC[s] = 50 + (4 - i) * 30; S.aB[s] = dir * 400 - (4 - i) * 30;
      S.aw[s] = 5; S.aA[s] = S.bj[n5]; S.az[s] = S.bi[n5]; S.aD[s] = S.aA[s];
      S.cH[s] = (1 - iR(2) * 2) * 60; S.cG[s] = 0; S.cl[s] = 0; S.ax[s] = S.bh[n5];
      panic(S.bs); zFloor(-1);
      n5--;
    }
    if (!S.cK) A(1);
    return;
  }
  // 倾塌变体 (:3040-3056): 自顶向下 |bi[i]-bi[i-1]|>20(逐层翻倍) 的错位层
  let n6 = 20, n7 = 1;
  for (let i3 = Math.min(4, S.bs - 1); i3 > 0; i3--) {
    const d = S.bi[i3] - S.bi[i3 - 1];
    if (Math.abs(d) <= n6) break;
    const n8 = d / Math.abs(d);
    S.ay[n7] = -n8 * 45; S.aC[n7] = 50; S.aB[n7] = n8 * 400;
    S.aw[n7] = 7; S.cl[n7] = ck[n7]; S.cH[n7] = (1 - iR(2) * 2) * 60; S.cG[n7] = 0;
    n7++;
    n6 <<= 1;
  }
  A(1);
}

// ---- y/H 人口与银行 (:2920/:2935), c 小人 (:2074) — 工单#8: 生成 n/2 人 ----
function y(n) {
  if (n > 0) {
    if (S.bA > 0) S.bB += S.bz * (2 + Math.floor(S.bs / 10) * 2);
    S.bt += Math.floor(S.bs / 10) + n;
  } else S.bt -= Math.floor(S.bs / 10) - n;
}
function H() { S.bt += S.bB; S.bz = 0; S.bA = 0; }
function spawnPeople(n, floor) {
  y(n);
  let left = n >> 1;                                       // c():2079 n2>>1
  for (let s = 0; s < 8 && left > 0; s++) {
    if (S.people[s]) continue;
    const side = 1 - iR(2) * 2;
    S.people[s] = {
      st: 1,                                               // 1 原地跳
      x: S.aV + side * ((bd >> 1) + 256),
      y: S.aW + (be >> 1) + iR(768),
      t0: S.cg - iR(1000), floor, dir: -side, style: iR(2), rx: 0, ry: 0,
    };
    left--;
  }
}
// ---- t(int) 楼层惊慌 (:2099-2158) / B() tick (:2160) ----
function panic(floor) {
  const off = Math.abs(S.aF[floor % 20]);
  let n6 = (off < 25 ? 4 : off < 50 ? 3 : off < 80 ? 2 : 1) >> 1;
  for (let s = 0; s < 8; s++) {                            // 该层现有 → 坠态 3
    const p = S.people[s];
    if (!p || p.floor !== floor || p.st === 0) continue;
    p.x = p.rx; p.y = p.ry; p.st = 3;
    p.vy = (p.x < 0 ? -1 : 1) * (p.t0 - S.cg) / 500;
    p.t0 = S.cg;
    n6--;
  }
  for (let s = 0; s < 8 && n6 > 0; s++) {                  // 空槽 → 掷飞态 4
    if (S.people[s]) continue;
    const f = Math.min(4, S.bs - 1) - (S.bs - floor);
    S.people[s] = { st: 4, x: S.bi[f], y: S.bj[f], t0: S.cg, floor,
      dir: iR(2) === 0 ? -1 : 1, style: iR(2), force: iR(4), rx: 0, ry: 0 };
    n6--;
  }
}
function peopleTick(dt) {
  for (let s = 0; s < 8; s++) {
    const p = S.people[s];
    if (!p) continue;
    const n4 = S.cg - p.t0;
    if (p.st === 1) {                                      // 原地跳 → 2000ms 后走
      p.rx = p.x + Math.min(4, n4 / 500) * 5;              // 跳弧近似 (bF/bG 表)
      p.ry = p.y;
      if (n4 > 2000 && Math.abs(p.rx - S.bi[S.by]) < 128) { p.st = 2; p.t0 = S.cg; }
    } else if (p.st === 2) {                               // 走向块缘 bi±64
      const tx = S.bi[S.by] + p.dir * 64;
      p.rx += p.dir * n4 / 12;
      if (Math.abs(p.rx - tx) < 16) { p.st = 5; p.t0 = S.cg; }
    } else if (p.st === 5) {                               // 站立 500ms → 释放
      if (n4 > 500) { S.people[s] = null; continue; }
    } else if (p.st === 4) {                               // 掷飞 300ms → 坠
      p.rx = p.x + p.dir * n4 / 3;
      p.ry = p.y + n4 / 3;
      if (n4 > 300) { p.st = 3; p.t0 = S.cg; p.x = p.rx; p.y = p.ry; }
    } else if (p.st === 3) {                               // 坠落
      p.rx = p.x - p.dir * n4 / 30;
      p.ry = p.y + (10 - p.force) * n4 / 30;
    }
    if (p.st !== 0 && (p.ry < S.aW - be / 2 || Math.abs(p.rx) > bd / 2 + 256)) S.people[s] = null;
  }
}

// ---- A(int) 机会 (:2998-3006) ----
function A(n) {
  S.cN = S.cg; beep();
  S.bb = n; S.bc = S.cg;
  S.ba -= n;
  if (S.ba === 0 && !S.over) { S.bk = 2; gameOver(); }
}

// ---- 塔摇摆 — Nokia q():1817 (仅 bk==2 摆) 与 DC v1.5.07 f(int):748 (常态持续正弦,
// 倒塌才衰减) 二版本语义不同; 按用户实机体感 (建楼时楼轻微左右晃=游戏特色) 采用 DC 语义:
// U=(U+dt)%3600, aH=c(U/10)=-cos, S=T·aH>>16 (衰减器), P=-(aH·T)/10000
function sway(dt) {
  if (S.bk === 2) {
    S.bu = S.bu > 0 ? S.bu - 1 : S.bu + 1;                 // 倒塌衰减
  } else {
    S.bw = (S.bw + dt) % 3600;
    S.cS = kD(S.bw / 10);                                  // -cos(U/10°)
    S.bu = S.bv * S.cS;                                    // S=T·aH>>16 (浮点等价)
  }
  S.br = -(S.cS * S.bv) * 3.2768;                          // P=-(aH·T)/10000, br=世界x偏移
}

// ---- 渲染层 ----
const cvs = document.getElementById('game');
const hud = document.getElementById('hud2d').getContext('2d');
const bg2d = document.getElementById('bg2d').getContext('2d');
// ---- 环境背景 (E() :2625 / x() :2702): 28 型按高度带 (dA :4412), r0 位图 dC :4414 ----
// 楼越高越离奇: 0-1 带鸟群 → 3 带气球飞艇 → 6-7 带客机 → 9-14 星星 → 15+ 行星/月亮/飞碟
const FX_START = [0,0,0,2,3,2,3,3,4,5,6,6,6,7,8,8,9,9,10,10,11,12,12,13,14,15,17,18,21];
const FX_END   = [1,1,1,3,4,4,4,5,5,6,7,7,7,999,9,10,999,999,11,999,12,13,14,999,15,16,18,19,999];
const FX_PROB  = [0,30,30,20,20,40,60,60,30,30,50,50,10,50,100,20,40,50,100,30,100,100,30,10,100,100,100,100,100];
const FX_SPD   = [60,2,1,3,2,2,-2,3,-4,5,2,2,6,0,0,-2,0,0,0,0,0,0,3,-3,0,0,0,0,-3];
const FX_DCT = [42,43,44,45,46,47,48,49,50,51,52,53,-1,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68];
const FX_MAX = 9;                                          // dB[9] 槽位
S.fx = Array.from({ length: FX_MAX }, () => ({ type: 0, x: 0, y: 0, next: 1000 + iR(2500) }));
// ---- 环境层 E():2625 + x():2702 原式 ----
// dB[9]=[型,x,y,下次]; dy 配额表(:4035); dz=8·max(图宽,高)(类型5/11减半); cp=2·aW/3/cd
const FX_DY = [0,8,3,2,1,1,8,2,8,1,1,4,4,-1,8,-1,1,5,4,-1,5,2,-1,1,1,-1,-1,-1,-1,-1];
const FX_DZ = new Array(29).fill(1);                        // 装载后按图尺寸填 (:1319-1333)
function fxTick() {                                         // 每 25ms tick 一次 (E() 无 dt 缩放)
  const bdX = bd, dzY = be;
  for (let i = 0; i < 9; i++) {
    const s = S.fx[i];
    if (s.type !== 0) {
      s.x += FX_SPD[s.type];                                 // 每 tick 恒速 (dA[3][型])
      const m = FX_DZ[s.type - 1];
      if (s.x <= bdX + m && s.x >= -bdX - m && 0.75 * S.aW - s.y <= dzY + m) continue;
      s.type = 0; s.next = S.cg + iR(2000);
      if (FX_DY[s.type || 0] >= 0 && FX_DY[s.type] !== undefined) {} // (type 已清, 配额回收见下)
      continue;
    }
    if (s.next >= S.cg) continue;
    fxSpawn(i);
  }
}
function fxSpawn(slot) {                                    // x(int):2702
  const cp = Math.floor(2 * S.aW / 3 / cd);
  let n3 = 0;
  for (let i2 = 0; i2 <= 28; i2++) {
    if (cp >= FX_START[i2] && cp < FX_END[i2] && (FX_DY[i2] > 0 || FX_DY[i2] === -1)
        && iR(100) < FX_PROB[i2]) { n3 = i2; break; }
  }
  if (n3 === 0) { S.fx[slot].type = 0; S.fx[slot].next = S.cg + 1000 + iR(2500); return; }
  FX_DY[n3]--;
  const spd = FX_SPD[n3], m = FX_DZ[n3 - 1];
  if (spd === 0 || iR(2) === 0) {                           // 悬停型: 全域随机
    S.fx[slot].x = iR(bd);
    S.fx[slot].y = 0.75 * S.aW + m + iR(512);
  } else if (spd > 0) {                                     // 从左入, 下半带
    S.fx[slot].x = -m;
    S.fx[slot].y = 0.75 * S.aW - (be >> 1) - 512 + iR(1024);
  } else {                                                  // 从右入
    S.fx[slot].x = bd + m;
    S.fx[slot].y = 0.75 * S.aW - (be >> 1) - 512 + iR(1024);
  }
  S.fx[slot].type = n3;
}
// i(Graphics):3424 工地中景: 地平线 n3=投影(0,-19,-80).y - ao + 9;
// 左: ae(id33 工地全景 136x34) 从 E/2-ap/2 步进 -ar; 右: ag(id35 木板 33x34) 步进 +aq;
// 中央 ah(id36 树 51x48); 底: 黄路 4602900 2px + 深土 1972495 到屏底 (ao=34,ap=136,aq=33,ar=33,as=51)
const AO = 34, AP = 136, AQ = 33, AR = 33, AS = 51;
let horizonY = null;
function horizonScreenY() {                                 // i():3428-3434 — n3 = 投影屏y - ao + 9
  const z = cI - (-80);                                     // 点 (0,-19,-80) 相机空间深度
  const ndcY = (-19 - S.aW) / z / Math.tan(CAM_FOVY * Math.PI / 360);
  return -0.5 * F * ndcY + (F >> 1) - AO + 9;
}
function drawGround() {
  if (horizonY === null) horizonY = horizonScreenY();
  if (horizonY < F) {
    // 树 (中央): ah 锚 17=BOTTOM|HCENTER? 17=1|16=HCENTER|BOTTOM → drawImage(ah, E/2+ap/2, n3-as+9)
    bg2d.drawImage(tex2d.id36, (E >> 1) + (AP >> 1), horizonY - AS + 9);
  }
  if (horizonY < F) {
    // 左半: 从 E/2-ap/2 向左铺 ae (af=id34 绿门 tile 步进 -ar)
    let n2 = (E >> 1) - (AP >> 1);
    bg2d.drawImage(tex2d.id33, n2, horizonY);
    while ((n2 -= AR) > -AR) bg2d.drawImage(tex2d.id34, n2, horizonY);
    // 右半: 从 E/2+ap/2 向右铺 ag (id35)
    let n4 = E >> 1, n5 = AP >> 1;
    while ((n2 = n4 + n5) < E) { bg2d.drawImage(tex2d.id35, n2, horizonY); n4 = n2; n5 = AQ; }
  }
  if (horizonY + AO < F) {
    bg2d.fillStyle = '#463c14';                              // 4602900 = 0x463c14 黄土路 (i():3459)
    bg2d.fillRect(0, horizonY + AO, E, 2);
    bg2d.fillStyle = '#1e190f';                              // 1972495 = 0x1e1e0f? 实为 0x1E190F 深土
    bg2d.fillRect(0, horizonY + AO + 2, E, F - 2 - horizonY - AO);
  }
}
function drawFX() {
  for (const slot of S.fx) {
    if (slot.type === 0) continue;
    const px = aT + (32 * (slot.x - S.aV) >> 8);
    const py = aU - (32 * (slot.y - 0.75 * S.aW) >> 8);
    if (px < -80 || px > E + 80 || py < -80 || py > F + 80) continue;
    if (FX_DCT[slot.type - 1] === -1) { bg2d.fillStyle = '#fff'; bg2d.fillRect(px, py, 2, 2); continue; }
    const img = tex2d['id' + FX_DCT[slot.type - 1]];
    if (!img || !img.complete) continue;
    let f = 0;
    if (slot.type === 6 || slot.type === 12) f = Math.floor(S.cg / 400) % 2;
    const w = img.naturalWidth / (f ? 2 : 1), h = img.naturalHeight;
    bg2d.drawImage(img, f ? w : 0, 0, w, h, px - w / 2, py - h / 2, w, h);
  }
  drawGround();
}
const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(E, F, false);
renderer.setClearColor(0x000000, 0);                       // J2ME 只清深度, 天空由 2D 层透出 (n.init)
const scene = new THREE.Scene();
// n.java setupViewport/setFov(55): fovy=55*((F-top)/E*0.7+0.3), aspect=E/(F-top)*0.7+0.3, near10 far10000
const CAM_FOVY = 55 * ((F - 0) / E * 0.7 + 0.3);           // = 67.833°
const CAM_ASPECT = E / (F - 0) * 0.7 + 0.3;                // = 0.825 (非 0.75!)
const camera = new THREE.PerspectiveCamera(CAM_FOVY, CAM_ASPECT, 10, 10000);
camera.position.set(0, 512, 128);
let cI = 0;
{ // y():1436 相机 z 迭代: 投影点 (0,-384,128) 距屏心 ≤48px
  const pv = new THREE.Vector3();
  for (cI = 128; ; cI += 100) {
    camera.position.set(0, 0, cI);
    camera.updateMatrixWorld(true);
    pv.set(0, -384, 128).project(camera);
    // project() 已做透视除法: ndc.y → 屏 y 偏移 = -0.5·F·ndc.y (向下正)
    if (-0.5 * F * pv.y <= 48) break;
    if (cI > 20000) break;
  }
  window.__cI = cI;
  window.__dbg3d = () => ({ tpl: templates.length, names: templates.map(t=>t.name).join(','),
    ground: !!GROUND_TPL, block: !!BLOCK_TPL, crane: !!CRANE_TPL, live: liveBlocks.length });
}
function project(x, y, z = 0) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return { x: (v.x + 1) / 2 * E, y: (1 - v.y) / 2 * F, behind: v.z > 1 };
}
// 天空+远景楼群 (a(Graphics,int,boolean,boolean):4054 + L():4044 原式)
// cp=2·aW/3/cd 高度带; n3=带起点像素; bK=带下色 bL=上色 bM=中缝混色; dG[12]=楼群矩形
const dH = [7317456, 6070481, 5216461];
S.dG = Array.from({ length: 12 }, () => [0, 0, 0, 0, 1, 0, 0]);
function initSkyline() {                                   // L():4040-4050
  for (let i = 0; i < 12; i++) {
    const w = 8 + iR(8);
    S.dG[i] = [i * (E / 12) - iR(w), w, 640 + iR(256), 16 + iR(16), 1, dH[iR(3)], iR(3)];
  }
}
function sky() {
  const n3 = 32 * (2 * S.aW / 3 % cd) >> 8;                // 带起点像素 (地平线)
  const cp = Math.floor(2 * S.aW / 3 / cd);
  const bi = Math.min(cp, Math.max(9, 9 + (cp - 9) % 8));       // bK 带下色索引
  const bi2 = Math.min(cp + 1, Math.max(9, 9 + (cp + 1 - 9) % 8));  // bL 带上色
  const bK = bO[bi], bL = bO[bi2];
  const mix = (c1, c2) => {
    const r = (((c1 >> 16) & 255) + ((c2 >> 16) & 255)) >> 1;
    const g = (((c1 >> 8) & 255) + ((c2 >> 8) & 255)) >> 1;
    const b = ((c1 & 255) + (c2 & 255)) >> 1;
    return (r << 16) | (g << 8) | b;
  };
  const bM = mix(bK, bL);
  const col = c => '#' + c.toString(16).padStart(6, '0');
  if (n3 < F) { bg2d.fillStyle = col(bK); bg2d.fillRect(0, n3, E, F - n3); }
  if (n3 > 0) { bg2d.fillStyle = col(bL); bg2d.fillRect(0, 0, E, n3); }
  // 中缝 bM 7px 阶梯 (bN 随机地平线 x)
  const n2s = 32 * S.aW >> 8;
  if (S.bN === undefined) S.bN = (E >> 2) + iR(E >> 1);
  bg2d.fillStyle = col(bM);
  bg2d.fillRect(0, n3 - 7, S.bN, 7);
  bg2d.fillRect(S.bN, n3 - 1, E - S.bN, 7);
  bg2d.fillRect(S.bN - 24, n3 - 2, 48, 3);
  bg2d.fillRect(S.bN - 18, n3 - 3, 36, 5);
  bg2d.fillRect(S.bN - 16, n3 - 5, 32, 9);
  bg2d.fillRect(S.bN - 15, n3 - 6, 30, 11);
  bg2d.fillRect(S.bN - 13, n3 - 7, 26, 13);
  // 远景楼群 (dG 12 楼, 随 aW 下沉: n8 = aU - 高 + 32·aW>>8)
  for (const b of S.dG) {
    if (b[4] === 0) continue;
    const n7 = b[2];                                       // 楼高
    let n8 = aU - n7 + n2s;                                // 楼顶屏y (可负)
    let n9 = n8 + n7;                                      // 楼底屏y
    let topVisible = true;
    if (n8 < 0) { n8 = 0; topVisible = false; }
    if (n8 + n9 > F) n9 = F - n8;
    if (n8 > F + 32) { b[4] = 0; continue; }               // 沉出屏底永久移除
    if (n8 < F) { bg2d.fillStyle = col(dH2(b[5])); bg2d.fillRect(b[0], n8, b[1], n9); }
    if (!topVisible) continue;
    if (b[6] === 1) {                                      // 天线+红灯
      bg2d.fillStyle = col(dH2(b[5]));
      bg2d.fillRect(b[0] + (b[1] >> 1), (aU - n7 + n2s) - b[3], 3, b[3]);
      if (Math.floor((S.cg + n7) / 200) % 2 === 0) { bg2d.fillStyle = '#f00'; bg2d.fillRect(b[0] + (b[1] >> 1), (aU - n7 + n2s) - b[3], 3, 3); }
    } else if (b[6] === 2) {                               // 宽顶箱
      bg2d.fillRect(b[0] + b[1] / 10, (aU - n7 + n2s) - 16, b[1] - b[1] / 5, 16);
    }
  }
}
const dH2 = c => c;                                        // dH 色已是 RGB
// 3D 组
const towerGroup = new THREE.Group(); scene.add(towerGroup);   // 摇摆作用于组 (近似 A() 逐层投影)
const fxGroup = new THREE.Group(); scene.add(fxGroup);
let templates = [], GROUND_TPL = null, CRANE_TPL = null, CABLE_TPL = null, BLOCK_TPL = null, BG_TOWERS = [], bgMeshes = [];  // *_TPL = 子网格数组
const tex2d = {};
function loadTex(url) { const t = new THREE.TextureLoader().load(url); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t; }
// 小人帧纹理 (id12/13: 10 帧 × 21x28)
function peopleFrames(id) {
  const arr = [];
  for (let f = 0; f < 10; f++) {
    const c = document.createElement('canvas'); c.width = 21; c.height = 28;
    const cx = c.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(tex2d['id' + id], -f * 21, 0);
    arr.push(c);
  }
  return arr;
}
let dudeFrames = [], dudetteFrames = [];

new GLTFLoader().load('./assets/scene.glb', gltf => {
  const root = gltf.scene; root.updateMatrixWorld(true);
  root.traverse(n => {
    if (n.isMesh && !templates.find(t => t.name === n.name)) {
      n.material.side = THREE.DoubleSide;                  // MeshNode.normalizeAppearance 近似
      if (n.material.map) { n.material.map.colorSpace = THREE.SRGBColorSpace; n.material = new THREE.MeshBasicMaterial({ map: n.material.map, side: THREE.DoubleSide }); }
      else n.material = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });  // g3d.resetLights 后无灯光 → 无光照着色
      templates.push(n);
    }
  });
  // uid→GLB 节点: n(uid+250)。cy块=uid13→n263, cC地面=uid9→n259, cD吊臂=uid8→n258, cE缆=uid7→n257
  const T = name => templates.filter(t => t.name === name || t.name.startsWith(name + '_'));
  GROUND_TPL = T('mesh269'); CRANE_TPL = T('mesh260'); CABLE_TPL = T('mesh261'); BLOCK_TPL = T('mesh265');
  // 预载表 {30..33} = 背景楼 (find(userID)): uid4(mesh253)@原点正后方, uid2(mesh251)@x1600,
  // uid5(mesh254)@x3200, uid6(mesh255)@x4800 — m3g 节点平移即排布位
  BG_TOWERS = [
    { tpl: T('mesh253'), x: 0 },
    { tpl: T('mesh251'), x: 1600 },
    { tpl: T('mesh254'), x: 3200 },
    { tpl: T('mesh255'), x: 4800 },
  ];
  for (const b of BG_TOWERS) {
    if (!b.tpl.length) continue;
    for (const tpl of b.tpl) {
      const m = tpl.clone();
      m.position.set(b.x, 0, -900);                          // 塔(z0)后方
      scene.add(m); bgMeshes.push(m);
    }
  }
  for (const id of [12, 13, 15, 16, 18, 19, 20, 33, 34, 35, 36, 37, 38, 39, 41, ...Array.from({ length: 27 }, (_, k) => 42 + k)]) {
    const im = new Image(); im.src = `./assets/id${id}.png`;
    tex2d['id' + id] = im;
  }
  const wait = setInterval(() => {
    if (Object.values(tex2d).every(im => im.complete)) {
      clearInterval(wait);
      dudeFrames = peopleFrames(12); dudetteFrames = peopleFrames(13);
      bootDone();
    }
  }, 50);
}, undefined, e => console.error('GLB', e));

// ---- HUD 位图绘制 (j(Graphics):3467) ----
// a(Graphics,5):3585 — n3=右缘x; 逐位: setClip(x-6,y,7,高) + drawImage(Z, x-6-d*7, y);
// 步进6px(重叠1), 位数<minD 补零, bl=true 时末位画槽10('+'偏移70)。Z=id16(98x12) Y=id15(98x9)
function drawDigits(sheet, fw, fh, val, rightX, y, minD, plus) {
  let x = rightX - 6;
  let v = Math.max(0, Math.floor(val));
  for (let i = 0; v > 0 || i < minD; i++) {
    hud.save(); hud.beginPath(); hud.rect(x, y, fw, fh); hud.clip();
    const d = v % 10; v = (v - d) / 10;
    hud.drawImage(sheet, x - d * 7, y);
    hud.restore();
    x -= 6;
  }
  if (plus) { hud.save(); hud.beginPath(); hud.rect(x, y, fw, fh); hud.clip();
    hud.drawImage(sheet, x - 70, y); hud.restore(); }
}
function bigNum(rightX, y, val, minD) { drawDigits(tex2d.id16, 7, 12, val, rightX, y, minD, false); }
function smallNum(rightX, y, val, minD) { drawDigits(tex2d.id15, 7, 9, val, rightX, y, minD, false); }
function drawHUD() {
  hud.clearRect(0, 0, E, F);
  // 惊慌人群 (k(Graphics):3624) — 3D→2D 投影, 两帧小人镜像
  for (const p of S.people) {
    if (!p) continue;
    const n4 = S.cg - p.t0;
    let frame = 0;
    if (p.st === 1) frame = 1 + Math.floor(Math.max(0, n4 - 1200) / 280) % 8;
    else if (p.st === 5) frame = 6 + Math.floor(S.cg / 200) % 2;
    else if (p.st === 3 || p.st === 4) frame = 1 + Math.floor(n4 / 280) % 8;
    const pos = project(p.rx, p.ry, 0);
    if (pos.behind) continue;
    const c = (p.style ? dudetteFrames : dudeFrames)[Math.min(9, frame)];
    hud.save();
    hud.translate(pos.x, pos.y);
    if (p.dir < 0) hud.scale(-1, 1);
    hud.drawImage(c, -10, -14 + 10);
    hud.restore();
  }
  // cn = E/20 = 12, co = F/15 = 21 (y():1424-1425)
  {
    const CN = 12, CO = 21;
    // 机会 (j:3467-3495 原式): setClip(cn+cn/2+14+4, F-co-72, 11, 72);
    // drawImage(X, cn+cn/2+14-n6*11+4, F-co-n7*12) — 整图+clip 显单帧
    const clipX = CN + (CN >> 1) + 14 + 4;                   // = 36
    const baseFrame = (BL - 1) * 2;                          // bl=4 → 帧6 橙完整
    hud.save(); hud.beginPath(); hud.rect(clipX, F - CO - 72, 11, 72); hud.clip();
    for (let n7 = 0; n7 <= 3; n7++) {
      let n6;
      if (n7 <= S.ba) n6 = baseFrame;
      else if (S.cg - S.bc < 100 && n7 <= S.ba + S.bb) n6 = baseFrame + 1;
      else n6 = 8;
      if (S.ba === 1 && Math.floor(S.cg / 500) % 2 === 0) n6 = 9;
      hud.drawImage(tex2d.id19, CN + (CN >> 1) + 14 - n6 * 11 + 4, F - CO - n7 * 12);
    }
    hud.restore();
    if (S.bs > 0) {
      // 人口 (j:3497-3501): 大数字右缘 E-cn, y=F-co-2-12; V=id18 图标 (E-cn-28-3-11, F-co-2-19)
      hud.drawImage(tex2d.id18, E - CN - 28 - 3 - 11, F - CO - 2 - 19);
      bigNum(E - CN, F - CO - 2 - 12, S.bt, 5);
    }
    // 楼层 (快速分支 j:3558-3562): W=id20 (cn-9, F-co-50) + 小数字右缘 cn-9+23, y=F-co-50+37
    hud.drawImage(tex2d.id20, CN - 9, F - CO - 50);
    smallNum(CN - 9 + 23, F - CO - 50 + 37, S.bs, 3);
  }
  // 连击计时条 (j:3533-3546)
  if (S.bA > 0) {
    hud.strokeStyle = 'rgb(107,26,0)'; hud.strokeRect((E >> 1) - (E >> 2) - 3, 20, (E >> 1) + 5, 11);
    hud.fillStyle = 'rgb(252,255,0)';
    if (S.bA > 5850) hud.fillStyle = '#fff';
    hud.fillRect((E >> 1) - (E >> 2), 22, Math.max(0, S.bA * (E >> 1) / 6000), 7);
    const f = Math.floor(S.cg / 80) % 4;
    hud.drawImage(tex2d.id38, f * 22, 0, 22, 22, (E >> 1) - (E >> 2) - 11 - 22, 12, 22, 22);
  }
  // 悬挂/落块高亮框 (j:3547): am id39 三帧
  if (S.aw[0] === 1 || S.aw[0] === 2) {
    const pos = project(S.az[0], S.aA[0]);
    const f = Math.floor(S.cg / 100) % 3;
    hud.drawImage(tex2d.id39, f * 44, 0, 44, 44, pos.x - 22, pos.y - 22, 44, 44);
  }
  // 连击层星框 (j:3554)
  for (let n7 = S.by; n7 > Math.max(0, S.by - S.bz); n7--) {
    const pos = project(S.bi[n7], S.bj[n7]);
    const f = (Math.floor(S.cg / 100) + n7) % 3;
    hud.drawImage(tex2d.id39, f * 44, 0, 44, 44, pos.x - 22, pos.y - 22, 44, 44);
  }
  if (S.bz > 1) bigNum((E >> 1) + (E >> 2) + 8, 12, S.bz, 1);
  // 落地角标 (h(Graphics):3391): id37 三帧, ch 后 600ms
  if (S.cg - S.ch < 600 && S.ch > 0) {
    const n2 = S.cg - S.ch;
    const pos = project(S.bi[S.by], S.bj[S.by]);
    const f = n2 < 200 ? 0 : Math.floor(n2 / 50) % 3;
    hud.drawImage(tex2d.id37, f * 13, 0, 13, 13, pos.x - 7, pos.y - 7, 13, 13);
  }
}

// ---- 3D 场景刷新 (f(Graphics):3287 忠实) ----
// b(5参):3340 — 网格原始坐标直传平移, rotZ=n5度/rotY=n6度; 888=随机翻滚,999=屋顶
const liveBlocks = [];
function put(tplArr, x, y, z, rotZ, rotY) {                 // b(5参):3340 — 平移直传+rotZ/rotY
  if (!tplArr || !tplArr.length) return;
  for (const tpl of tplArr) {
    const m = tpl.clone();
    m.position.set(x, y, z);
    m.rotation.set(0, (rotY || 0) * Math.PI / 180, (rotZ || 0) * Math.PI / 180);
    scene.add(m); liveBlocks.push(m);
  }
}
function render3D() {
  camera.position.set(S.aV, S.aW, cI);                      // f(): n.a(aV,aW,cI, 0,0,-1, 0,1,0)
  camera.rotation.set(0, 0, 0);
  for (let i = 0; i < liveBlocks.length; i++) scene.remove(liveBlocks[i]);
  liveBlocks.length = 0;
  if (S.bs <= 5) put(GROUND_TPL, 0, 0, 0, 0, 0);            // cC 地基工地 (identity, bs<=5)
  if (S.bk === 0) {                                         // cD: 滑轮+单缆+吊具 — 放置后钩子仍在缆端
    put(CRANE_TPL, S.aK, S.aL, 0, S.aM * 2 / 3, 0);
  } else if (S.bk === 1 || S.aw[0] === 3) {                 // cE 双缆 (仅城市收尾态, 快速局不出现)
    put(CABLE_TPL, S.aK, S.aL, 0, 0, 0);
  }
  for (let i = 0; i < 5; i++) {
    if (S.aw[i] === 4 || S.aw[i] === 0) continue;
    put(BLOCK_TPL, S.az[i], S.aA[i], 0,
        S.ax[i] === 888 ? Math.random() * 360 : S.ax[i], S.cG[i]);
  }
  for (let i = 0; i < Math.min(S.bs, 5); i++) {
    put(BLOCK_TPL, S.bi[i], S.bj[i], 0, S.cF[i], -S.bh[i]);
  }
  renderer.render(scene, camera);
}

// ---- 音频: LibMidi (抄 freej2me-web web/libmidi — wasm 合成, 非自写振荡器) ----
// x 播放器 = BGM 循环 (r0[81]); b.a 负 id = jingle 单发 (83 放置/84 败/85 胜)
let bgmPlayer = null, jinglePlayer = null;
function beep() {                                           // c.a(800): 扣命/地基提示短音
  try {
    const c = audioCtx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = 220;
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.13);
  } catch (e) {}
}
async function midiPlayerOnce() {
  const p = new LibMidi(createUnlockingAudioContext());
  await p.init();
  return p;
}
async function startBgm() {                                 // b():308 x.a(-2147483568,-1) 循环
  try {
    bgmPlayer = bgmPlayer || await midiPlayerOnce();
    const r = await fetch('./assets/midi/81.mid');
    if (!r.ok) return;
    await bgmPlayer.midiPlayer.setSequence(await r.arrayBuffer());
    bgmPlayer.midiPlayer.loop(-1);
    bgmPlayer.midiPlayer.play();
  } catch (e) {}
}
async function playMidiJingle(id) {                         // :1602-1692 负 id jingle
  try {
    jinglePlayer = jinglePlayer || await midiPlayerOnce();
    const r = await fetch('./assets/midi/' + id + '.mid');
    if (!r.ok) return;
    await jinglePlayer.midiPlayer.setSequence(await r.arrayBuffer());
    jinglePlayer.midiPlayer.play();
  } catch (e) {}
}

// ---- 存档 quickModeRS (g():443/h():618 字段子集) ----
const RS_KEY = 'twrblx_quickRS';
function saveRS() {
  if (S.over) return;
  const d = { v: 2, bs: S.bs, bt: S.bt, ba: S.ba, bz: S.bz, bA: S.bA, bB: S.bB, bC: S.bC,
    bm: S.bm, bn: S.bn, bo: S.bo, bw: S.bw, aP: S.aP, aW: S.aW, aX: S.aX,
    aF: S.aF, cF: S.cF, cj: S.cj, dE: S.dE, bw: S.bw };
  try { localStorage.setItem(RS_KEY, JSON.stringify(d)); } catch (e) {}
}
function loadRS() {
  try {
    const d = JSON.parse(localStorage.getItem(RS_KEY) || 'null');
    if (!d || d.v !== 2 || d.bs === 0) return false;
    Object.assign(S, { bs: 0, bt: d.bt, ba: d.ba, bz: d.bz, bA: d.bA, bB: d.bB, bC: d.bC,
      bm: d.bm, bn: d.bn, bo: d.bo, bw: d.bw, aP: d.aP, aW: d.aW, aX: d.aX });
    S.aF = d.aF || S.aF; S.cF = d.cF || S.cF; S.cj = d.cj || S.cj;
    for (let i = 0; i < d.bs; i++) { S.bs = i; zFloor(1); }  // 逐层重建 (K()+塔数组)
    return true;
  } catch (e) { return false; }
}
function clearRS() { try { localStorage.removeItem(RS_KEY); } catch (e) {} }

// ---- 结算 (a(boolean):1723) — 语言串取自 J2ME lang.zh-CN ----
const msgBox = document.getElementById('msg'), msgTxt = document.getElementById('msgTxt');
const msgOk = document.getElementById('msgOk');
function showMsg(html) { msgTxt.innerHTML = html; msgBox.style.display = 'block'; }
function gameOver() {
  S.over = true;
  playMidiJingle(84);
  const rec = [];
  if (S.bt > S.cj[3]) { S.cj[3] = S.bt; rec.push('人口'); }
  if (S.bs > S.cj[4]) { S.cj[4] = S.bs; rec.push('高度'); }
  if (S.bC > S.cj[5]) { S.cj[5] = S.bC; rec.push('组合'); }
  showMsg(`您的机会已用完<br>人口：${S.bt}<br>摩天楼高度：${S.bs}<br>最长组合时间：${S.bC}` +
    (rec.length ? `<br><b>新记录！</b> (${rec.join('/')})` : ''));
  clearRS();
  try { localStorage.setItem('twrblx_towerMode', JSON.stringify(S.cj)); } catch (e) {}
}
msgOk.onclick = () => { location.reload(); };

// ---- 输入 (b(int,int):3651 + J():3716): FIRE=落块 ----
addEventListener('pointerup', () => drop());
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') { e.preventDefault(); drop(); }
});
addEventListener('beforeunload', saveRS);

// ---- 主循环 (:1697-1719): 25ms 门控, 序=z,u,E,p,s,q,A,B,连击 ----
let last = performance.now(), booted = false, bootAt = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = now - last; last = now;
  if (!booted) { renderer.render(scene, camera); return; }
  S.cM += dt;
  if (S.cM >= 25) {
    const cM = S.cM; S.cM = 0; S.cg += cM;
    if (!S.over) {
      camTick();                                           // z()
      swing(cM);                                           // p()
      blocks(cM);                                          // s()
      sway(cM);                                            // q()
      rebuildFloors();                                    // A() (:1710 每 tick)
      peopleTick(cM);                                      // B()
      if (S.bA > 0) {                                      // 连击计时 (:1712-1718)
        S.bA = S.bA - cM - (S.bz - 1) * cM / 6;
        if (S.bA <= 0) H();
      } else if (S.bA > -2000) S.bA -= cM;
      if (S.bs > 0 && S.bs % 10 === 0) saveRS._dirty = true;
    }
  }
  if (booted) { fxTick(); sky(); drawFX(); }
  render3D();
  drawHUD();
}
requestAnimationFrame(loop);
// rAF 兜底: IAB 面板/后台标签会冻结 requestAnimationFrame — setInterval 驱动同一 loop,
// 两驱动并行时 dt 取真实差值, 步进幂等 (loop 首行 rAF 自排队不受影响)
setInterval(() => loop(performance.now()), 25);

function bootDone() {
  if (booted) return;
  booted = true; bootAt = performance.now();
  document.getElementById('bootFill').style.width = '100%';
  setTimeout(() => document.getElementById('boot').style.display = 'none', 1400);
  initSkyline();                                           // L() 远景楼群
  for (let t = 1; t <= 28; t++) {                          // dz = 8·max(图宽,高), 型6/11 减半 (:1319-1333)
    const img = tex2d['id' + FX_DCT[t - 1]];
    FX_DZ[t - 1] = (!img || FX_DCT[t - 1] === -1) ? 1 : 8 * Math.max(img.naturalWidth, img.naturalHeight) * (t === 6 || t === 12 ? 0.5 : 1);
  }
  { // 开局运镜 (K():3982-3993): 相机从吊钩基线 2432 缓降 2500ms 至地基 512
    S.aW = 2432; S.aX = 512; S.aY = S.cg + 3000; S.aH = 1664;
    S.aw[0] = 1; S.aL = aJ - S.aH; S.aA[0] = S.aL;
    if (loadRS()) { S.aW = S.aX; S.aY = S.cg; }            // 有续档则不做运镜
  }
  zFloor(0);                                               // 参数初始化
  startBgm();
}
