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
  bk: 4, dD: 0, aE: 0, dE: 0, ch: -9999, cK: false,        // 阶段: 4=开局运镜期(K:4021), 首落成→0 (:1952)
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
  if (S.aW < S.aX) { S.aW = Math.min(S.aX, S.aX + (S.cg - S.aY - 500) * 256 / 500); horizonY = null; }
  else if (S.aW > S.aX) { S.aW = Math.max(S.aX, S.aX - (S.cg - S.aY - 500) * 256 / 500); horizonY = null; }
  // z():1779 aJ=aW+1920 仅游戏内相机移动帧更新 — 运镜期(bk==4)主tick不跑z(),
  // aJ 恒为 K():3983 的 2432 (世界坐标不动): 相机下移, 臂/钢丝/盒子原地滚出画面 (用户设定)
  if (S.bk !== 4 && S.aW !== S.aX) aJ = S.aW + 1792 + 128;
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
    anyFalling = anyFalling || st === 2 || st === 5 || st === 7;   // s(): bl2=true 于 st2/5/7 三分支 (:1901/:1972)
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
  if (S.bk === 4) S.bk = 0;                               // G() 命中: 开局态→正常 (:1952-53)
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
  // 落住 (:2846-2858): bz==0 → bB=0 后 break block25 落到 :2854 ++bz (bz 0→1);
  // bz!=0 且 bA>0 → ++bz; bz!=0 且 bA<=0 → break block26 保持不变 (不重置, 断链只藏不清)
  S.aw[0] = 4; S.dE = S.cg;
  if (S.bz === 0) { S.bB = 0; S.bz = 1; }
  else if (S.bA > 0) S.bz++;
  if (S.bz > 1) S.bC = Math.max(S.bC, S.bz);
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
      st: 1,                                               // 1 跳向楼层 (B() case1 抛物线弧)
      x: S.aV + side * ((bd >> 1) + 256),                  // 出生 x = 塔 ± (bd/2+256) 屏缘外
      y: S.aW + (be >> 1) + iR(768),                       // 出生 y = 相机+1280+rand 屏外上方
      tX: S.bm,                                            // 跳弧终点 x = bm (c():2089)
      floor, dir: -side, style: iR(2), rx: 0, ry: 0,
      t0: S.cg - iR(1000),                                // 出生时间回拨 (:2090-2092) → 出生即在弧线中段
    };
    // rx/ry 初始化为出生点, 防止渲染先于 tick 时画在世界原点(屏左上) (:2253 前无条件渲染)
    S.people[s].rx = S.people[s].x; S.people[s].ry = S.people[s].y;
    left--;
  }
}
// 跳弧表 (y():1416-1423): bG 累加 5+i (x 向), bF 累加 5-i (y 向)
const bG_ARC = [0, 5, 11, 18, 26, 35, 45, 0];
const bF_ARC = [0, 5, 9, 12, 14, 15, 15, 0];
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
    S.people[s] = { st: 4, x: S.bi[f], y: S.bj[f], t0: S.cg, floor, rx: S.bi[f], ry: S.bj[f],
      dir: iR(2) === 0 ? -1 : 1, style: iR(2), force: iR(4) };
    n6--;
  }
}
function peopleTick(dt) {
  for (let s = 0; s < 8; s++) {
    const p = S.people[s];
    if (!p) continue;
    const n4 = S.cg - p.t0;
    const fl = Math.max(0, Math.min(4, Math.min(4, S.bs - 1) - (S.bs - p.floor)));  // 目标层可见窗索引
    if (p.st === 1) {                                      // B() case1: 抛物线跳向目标层 (:2170-2196)
      const n6 = Math.min(5, Math.floor(n4 / 500)), n7 = n4 - n6 * 500;
      const xT = p.tX, yT = (p.floor - 1) * 256 + 128;     // 终点: x=bm, y=层中心
      p.rx = p.x - bG_ARC[n6] * (p.x - xT) / 45 - n7 * (bG_ARC[n6 + 1] - bG_ARC[n6]) * (p.x - xT) / 22500;
      p.ry = p.y - bF_ARC[n6] * (p.y - yT) / 15 - n7 * (bF_ARC[n6 + 1] - bF_ARC[n6]) * (p.y - yT) / 7500;
      const tgtX = S.bi[fl];
      // :2192 原文是 AND: 转爬需 n4≥2000 且 |Δx|<128 且 y≤层心 三者同时成立
      // (旧写法 || 把超时当独立条件 → 2000ms 未到块也强制空中转爬)
      if (n4 >= 2000 && Math.abs(p.rx - tgtX) < 128 && p.ry <= (p.floor - 1) * 256 + 128) {
        p.st = 2; p.t0 = S.cg;                             // case2 转换 (:2196-2205)
        p.x = p.rx - tgtX; p.y = (p.floor - 1) * 256 + 128 - p.ry;   // 记录相对偏移 (bE[1]/[2])
        p.dir = p.x < 0 ? -1 : 1;
      }
    } else if (p.st === 2) {                               // case2: 走向块缘 bi±64 (:2197-2212)
      const flX = S.bi[fl];
      p.rx = flX + p.x - p.dir * n4 / 12;
      if (Math.abs(p.rx - flX) < 64) p.rx = flX + p.dir * 64;
      p.ry = Math.min(S.bj[fl], S.bj[fl] - p.y + n4 / 12);
      if (p.rx === flX + p.dir * 64 && p.ry === S.bj[fl]) {
        p.x = p.dir * 64; p.st = 5; p.t0 = S.cg;
      }
    } else if (p.st === 5) {                               // case5: 站立 500ms → 释放
      p.rx = S.bi[fl] + p.x; p.ry = S.bj[fl];
      if (n4 > 500) { S.people[s] = null; continue; }
    } else if (p.st === 4) {                               // case4: 掷飞 300ms → 坠
      p.rx = p.x - p.dir * (10 - p.force) * n4 / 15;
      p.ry = p.y + p.dir * p.force * n4 / 15;
      if (n4 > 300) { p.st = 3; p.t0 = S.cg; p.x = p.rx; p.y = p.ry; }
    } else if (p.st === 3) {                               // case3: 坠落
      p.rx = p.x - p.dir * n4 / 30;
      p.ry = p.y - Math.abs(10 - p.force) * n4 / 30;
    }
    if (p.st !== 0 && (p.ry < S.aW - be / 2 || Math.abs(p.rx - S.aV) > bd / 2 + 256)) S.people[s] = null;
  }
}

// ---- A(int) 机会 (:2998-3006) ----
function A(n) {
  S.cN = S.cg; beep();
  S.bb = n; S.bc = S.cg;
  S.ba -= n;
  if (S.ba === 0 && !S.over) { S.bk = 2; gameOver(); }
}

// ---- 塔摇摆 q(int):1817-1841 原文忠实转写 ----
// :1823 cS 每 tick 强制清 0; :1824-1837 相位推进分支 (:1833-1835) 不可达 — bu 在全工程
// 无非 0 赋值 (仅存档 IO :487/:662/:872/:1048), bu>=0 → break block3 直接短路;
// :1839 br=-(cS·bv)/10000 恒 0。Nokia v1.0.12 塔身无周期摆动, 视觉"微晃"来自:
// 落点误差静态累计 aF (A():2067) + 落块后 800ms 一次坐稳缓动 (dE/cT, :2037-2047) + 
// 落块随机 ±n3/4 恒定倾角 (:2883-2886)。DC v1.5.07 的常态正弦是别家语义, 已弃用。
// bu 衰减方向按 :1825-1830: bk==2 且 bu>0 → bu-1; 否则 bu<0 → bu+1 (读档脏值归零)。
function sway() {
  S.cS = 0;
  if (S.bk === 2) { if (S.bu > 0) S.bu--; }
  else if (S.bu < 0) S.bu++;
  S.br = 0;
}

// ---- 渲染层 ----
const cvs = document.getElementById('game');
const hud = document.getElementById('hud2d').getContext('2d');
const bg2d = document.getElementById('bg2d').getContext('2d');
// ---- 环境背景 (E() :2625 / x() :2702): 28 型按高度带 (dA :4412), r0 位图 dC :4414 ----
// 勘误(2026-10-05): dA 三行与 dy 均为 29 项、下标=型别本身 (1..28, 下标0哑元 prob=0)。
// 旧版把三张表当"型别-1"0基用 → 全部环境层提前一个高度带 (≈1.5屏) 出现:
// 型3(飞艇 id44) 被错给 [0,1) (原文 [2,3)) → 1 楼就见飞艇; 配额也串一格。
const FX_START = [0,0,0,2,3,2,3,3,4,5,6,6,6,7,8,8,9,9,10,10,11,12,12,13,14,15,17,18,21];
const FX_END   = [1,1,1,3,4,4,4,5,5,6,7,7,7,999,9,10,999,999,11,999,12,13,14,999,15,16,18,19,999];
const FX_PROB  = [0,30,30,20,20,40,60,60,30,30,50,50,10,50,100,20,40,50,100,30,100,100,30,10,100,100,100,100,100];
const FX_SPD   = [60,2,1,3,2,2,-2,3,-4,5,2,2,6,0,0,-2,0,0,0,0,0,0,3,-3,0,0,0,0,-3];
const FX_DCT = [42,43,44,45,46,47,48,49,50,51,52,53,-1,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68];
const FX_MAX = 9;                                          // dB[9] 槽位
S.fx = Array.from({ length: FX_MAX }, () => ({ type: 0, x: 0, y: 0, next: 1000 + iR(2500) }));
// ---- 环境层 E():2625 + x():2702 原式 ----
// dB[9]=[型,x,y,下次]; dy 配额表(:4035); dz=8·max(图宽,高)(类型5/11减半); cp=2·aW/3/cd
const FX_DY = [8,3,2,1,1,8,2,8,1,1,4,4,-1,8,-1,1,5,4,-1,5,2,-1,1,1,-1,-1,-1,-1,-1];  // dy 原文29项(:4035), 下标=型别 (0=哑元)
const FX_DZ = new Array(29).fill(1);                        // 装载后按图尺寸填 (:1319-1333)
function fxTick() {                                         // 每 25ms tick 一次 (E() 无 dt 缩放)
  const bdX = bd, dzY = be;
  for (let i = 0; i < 9; i++) {
    const s = S.fx[i];
    if (s.type !== 0) {
      s.x += FX_SPD[s.type];                                 // 每 tick 恒速 (dA[3][型])
      const m = FX_DZ[s.type - 1];
      if (s.x <= bdX + m && s.x >= -bdX - m && 0.75 * S.aW - s.y <= dzY + m) continue;
      const deadT = s.type;                                  // E():2634-2639: 先记旧型再清, 配额返还
      s.type = 0; s.next = S.cg + iR(2000);
      if (FX_DY[deadT] > 0) FX_DY[deadT]++;                  // dy[型] (:2638) — 下标=型别
      continue;
    }
    if (s.next >= S.cg) continue;
    fxSpawn(i);
  }
}
function fxSpawn(slot) {                                    // x(int):2702
  const cp = Math.floor(2 * S.aW / 3 / cd);
  let n3 = 0;
  for (let i2 = 1; i2 <= 28; i2++) {                        // 型别=i2, 表直接下标 (:2661-2665)
    if (cp >= FX_START[i2] && cp < FX_END[i2] && (FX_DY[i2] > 0 || FX_DY[i2] === -1)
        && iR(100) < FX_PROB[i2]) { n3 = i2; break; }
  }
  if (n3 === 0) { S.fx[slot].type = 0; S.fx[slot].next = S.cg + 1000 + iR(2500); return; }
  FX_DY[n3]--;                                              // dy[n3] (:2672) — 下标=型别
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
// ---- 城市剪影层 (r0#89, w():1225-1251 + a(Graphics,n3):4103-4119) — "背景高楼"本体 ----
let SKY89 = null;
function loadSky89() {
  fetch('./assets/city_skyline.bin').then(r => r.arrayBuffer()).then(b => {
    const v = new DataView(b); let p = 0;
    const rCnt = v.getUint8(p++), sCnt = v.getUint8(p++);
    const cols = [];
    for (let i = 0; i < sCnt; i++) { cols.push(v.getUint32(p, false) & 0xFFFFFF); p += 4; }
    const rects = [];
    for (let i = 0; i < rCnt; i++) {
      const x176 = v.getUint8(p++), w176 = v.getUint8(p++);
      const n5 = v.getUint16(p, false); p += 2;
      const n6 = v.getUint16(p, false); p += 2;
      rects.push({ x176, w176, yTop: 2 * n5, h: 2 * n6, col: v.getUint8(p++) });
    }
    SKY89 = { cols, rects };
  }).catch(() => {});
}
loadSky89();
function drawSky89(hznY) {                                  // a():4103-4119: top = aU - yTop - h + n3
  if (!SKY89) return;
  for (const R of SKY89.rects) {
    const x = E * R.x176 / 176;
    const w = Math.max(1, E * (R.x176 + R.w176) / 176 - x); // w():1244-1246
    const top = aU - R.yTop - R.h + hznY;
    if (top + R.h < 0) break;                               // 基线降序, 出顶即止
    if (top > F) continue;
    bg2d.fillStyle = '#' + SKY89.cols[R.col].toString(16).padStart(6, '0');
    bg2d.fillRect(x, top, w, R.h);
  }
}
function drawFX() {
  for (const slot of S.fx) {
    if (slot.type === 0) continue;
    const px = (aT + 32 * (slot.x - S.aV)) >> 8;               // 字节码裁定: 移位作用于整个和 (e():2711)
    const py = (aU - 32 * (slot.y - 0.75 * S.aW)) >> 8;      // e():2712
    if (px < -80 || px > E + 80 || py < -80 || py > F + 80) continue;
    if (FX_DCT[slot.type - 1] === -1) { bg2d.fillStyle = '#fff'; bg2d.fillRect(px, py, 1, 1); continue; }   // e():2714 drawLine=1px
    const img = tex2d['id' + FX_DCT[slot.type - 1]];
    if (!img || !img.complete) continue;
    let f = 0;
    if (slot.type === 6 || slot.type === 12) f = Math.floor(S.cg / 400) % 2;
    const w = img.naturalWidth / (f ? 2 : 1), h = img.naturalHeight;
    bg2d.drawImage(img, f ? w : 0, 0, w, h, px - w / 2, py - h / 2, w, h);
  }
  drawGround();
  drawWeather(bg2d, false);                                // b(g,false) :3262 — 背景天气画在 3D 之后(其下)
  // 2D 起重机悬臂+黑钢丝 (f():3296-3310): 仅 bk==1/aw==3/(bk==4&&aw!=2) —
  // 即开局运镜期(bk=4)可见, 开局后条件永假 → 悬臂永在画面外 (用户设定确认)
  if (S.bk === 1 || S.aw[0] === 3 || (S.bk === 4 && S.aw[0] !== 2)) {
    const n2 = (E >> 1) + ((0 - S.aV) >> 3);           // aT=E/2, aI=0 (K:3982); 32*x>>8 = x/8
    const n3 = (F >> 1) - ((aJ - S.aW) >> 3);          // aU=F/2
    const p = project(S.aK, S.aL + 528);
    if (tex2d.id41 && tex2d.id41.complete)              // ak=g.c(41) 151x31, 锚40=RIGHT|BOTTOM
      bg2d.drawImage(tex2d.id41, n2 + 4 - 151, n3 - 31);
    bg2d.strokeStyle = '#000'; bg2d.lineWidth = 1;
    bg2d.beginPath(); bg2d.moveTo(n2, n3); bg2d.lineTo(p.x, p.y);
    bg2d.moveTo(n2 + 1, n3); bg2d.lineTo(p.x + 1, p.y); bg2d.stroke();
  }
}

// ---- 天气系统 u()/v()/w()/D()/C()/b(Graphics,boolean) (:2260-2623) ----
// 快速模式全量参与 (tick :1705 无 bk/bl 门)。JAD(a3): DChoc-Rain-Probability=20, Snow=30,
// Rain-Duration=60s, Snow-Duration=50s → cU=204, cV=307 (1024 刻度)。
// 雨: 低空带 aW∈[0,3840] 触发 (概率 20%), 天空暗到 409/1024, 带闪电 (dq=2 期 1%/tick);
// 雪: 高空带 aW∈[10240,12800] (30%), 暗到 819/1024, 粒子正弦飘摆。各闩锁一场 (da/db)。
// 状态机 dq: 0空闲→1变暗(ds)→2持续(dt, 强度512→1024→512)→3恢复(du)→0。
// 粒子 dd[300] 持久 (x/y 1024 制): 前景层 210 (b(g,true), 画在 3D 之上)、背景层 90。
const WT = {
  cU: 204, cV: 307, cX: false, cY: false, da: false, db: false,
  dq: 0, dw: 2, de: false, dv: 0, dr: 0, ds: 0, dt: 0, du: 0, dh: 0, di: 0, dj: 0,
  dg: 1024, dk: 0, dl: 0, dm: 0, dn: 0, dO: 100,
  dc: [new Array(7).fill(0), new Array(7).fill(0)],
  dd: Array.from({ length: 300 }, () => [0, 0, 0, 0, 0, 0, 0]),
};
const cW = [
  [20000,2000,20000,5000,20000,2000,409,20000,90,1024,32,4,5,128,16,96,0,10,256,64],
  [10000,2000,30000,5000,10000,2000,819,10000,90,1024,2,0,10,50,10,2,0,10,150,32],
];
window.__WT = WT;
const GW = E * 1024, GH = F * 1024;                        // G/H (:300-301)
const jS = idx => Math.sin(idx * Math.PI / 180) * 32768;   // j() 正弦表 Q15
const lerp5 = (a1, b1, c1, d1, e1) => b1 - a1 === 0 ? 0 : (d1 - c1) * e1 / (b1 - a1) + c1;  // a(5参):2396
function weatherInit() {                                   // :4025-4026 开局一次性掷骰
  WT.cX = WT.cU >= iR(1024); WT.cY = WT.cV >= iR(1024);
}
function weatherClear() {                                  // C():2424
  WT.dc[0].fill(0); WT.dc[1].fill(0);
  for (const p of WT.dd) p.fill(0);
}
function weatherParams(kind) {                             // v():2373
  const r = cW[kind === 1 ? 0 : 1];
  WT.ds = r[0] + iR(r[1] + 1); WT.dt = r[2] + iR(r[3] + 1); WT.du = r[4] + iR(r[5] + 1);
  WT.dh = WT.dg; WT.di = r[6]; WT.dj = r[7];
  const n4 = r[8], n5 = iR(2) - 1;                         // 风向 ±1
  const setL = (i, cnt, acc, wind, grav, r1, r2) => { const d = WT.dc[i]; d[0] = cnt; d[1] = acc; d[2] = 0; d[3] = wind; d[4] = grav; d[5] = r1; d[6] = r2; };
  setL(0, 300 - n4, 0, n5 * r[10], r[13], r[11], r[11]);   // a():2465 前景层
  setL(1, n4, 0, n5 * r[15], r[18], r[16], r[16]);         // 背景层
}
function weatherFill() {                                   // D():2442 全屏铺粒子
  let off = 0;
  for (const d of WT.dc) {
    const n = d[1] >> 10, r1 = d[5] + 1, r2 = d[6] + 1;
    for (let i = 0; i < n; i++) {
      const p = WT.dd[i + off];
      p[0] = 1; p[1] = iR(GW); p[2] = iR(GH); p[3] = iR(4); p[4] = iR(368640);
      p[5] = (d[3] + iR(r1) - (r1 >> 1)) / (4 - p[3]); p[6] = (d[4] + iR(r2) - (r2 >> 1)) / (4 - p[3]);
    }
    d[2] = 0; off += d[0];
  }
}
function weatherTick(dt) {                                 // u():2260
  WT.dv = Math.min(WT.dv + dt, WT.dr);
  switch (WT.dq) {
    case 0: {
      let kind = 0;
      if (WT.cX && !WT.da && S.aW >= 0 && S.aW <= 3840) { WT.da = true; weatherClear(); weatherParams(1); kind = 1; }
      else if (WT.cY && !WT.db && S.aW >= 10240 && S.aW <= 12800) { WT.db = true; weatherClear(); weatherParams(2); kind = 2; }
      if (!kind) return;
      WT.dw = kind; WT.de = true; WT.dg = 1024; WT.dk = 0; WT.dq = 1; WT.dr = WT.ds; WT.dv = 0;
      return;
    }
    case 1: {
      WT.dg = lerp5(0, WT.dj, 1024, WT.di, Math.min(WT.dv, WT.dj));
      for (const d of WT.dc) d[1] = d[0] * lerp5(0, WT.dr, 0, 512, Math.min(WT.dv, WT.dr));
      if (WT.dv === WT.dr) { WT.dq = 2; WT.dr = WT.dt; WT.dv = 0; }
      break;
    }
    case 2: {
      const h = WT.dr >> 1;
      if (WT.dv < h) for (const d of WT.dc) d[1] = d[0] * lerp5(0, h, 512, 1024, Math.min(WT.dv, h) + 512);
      else for (const d of WT.dc) d[1] = d[0] * lerp5(h, WT.dr, 1024, 512, Math.min(WT.dv - h, h) + 1024);
      if (WT.dw === 1) {                                   // 闪电 (仅雨, :2334-2344)
        WT.dn = Math.min(WT.dn + dt, WT.dO);
        if (iR(100) === 7) { WT.dl = 512; WT.dm = 0; WT.dn = 0; WT.dk = WT.dl; }
        if (WT.dk > 0) WT.dk = WT.dk >> Math.floor(WT.dn / WT.dO);  // a(3参):2403 n2>>n3/n4
      }
      if (WT.dv === WT.dr) { WT.dq = 3; WT.dh = WT.dg; WT.dr = WT.du; WT.dv = 0; }
      break;
    }
    case 3: {
      WT.dg = lerp5(0, WT.dj, WT.dh, 1024, Math.min(WT.dv, WT.dj));
      for (const d of WT.dc) d[1] = d[0] * lerp5(0, WT.dr - 1000, 512, 0, Math.min(WT.dv, WT.dr - 1000));
      if (WT.dv === WT.dr) { WT.dq = 0; weatherClear(); return; }
      break;
    }
  }
  weatherMove(dt);
}
function weatherMove(dt) {                                 // w():2477
  const n6 = S.aW + 384;                                   // 256*aW>>8 = aW (:2490)
  let off = 0;
  for (const d of WT.dc) {
    d[2] += d[1] * d[4] / 2 / GH * dt;                     // 生成节流累计器
    for (let i = 0; i < d[0]; i++) {
      const p = WT.dd[i + off];
      if (p[0] === 1) {
        p[1] += p[5] * dt; p[2] += p[6] * dt;
        if (WT.dw === 2) {                                 // 雪: 相位推进 + 正弦水平飘 (:2498-2500)
          p[4] += (90 + 90 * (3 - p[3])) * dt; p[4] %= 368640;
          p[1] += (64 * p[3] * jS(p[4] >> 10)) >> 15;
        }
        if (p[2] > GH) { p[0] = 0; p[2] = 0; }
        else if (n6 < 1024 && p[2] > n6 * GH / 1024) { p[0] = 0; p[2] = 0; }   // 地面截断
        else if (p[1] < 0) p[1] = GW;
        else if (p[1] > GW) p[1] = 0;
      } else if (d[2] >= 1024) {                           // 补发 (:2521-2534)
        d[2] -= 1024;
        p[0] = 1; p[1] = iR(GW); p[2] = 0; p[3] = iR(4); p[4] = iR(368640);
        p[5] = (d[3] + iR(d[5] + 1) - ((d[5] + 1) >> 1)) / (4 - p[3]);
        p[6] = (d[4] + iR(d[6] + 1) - ((d[6] + 1) >> 1)) / (4 - p[3]);
      }
    }
    off += d[0];
  }
}
function wxCss(c, m) {                                     // a(int,int,boolean):2407 颜色调制
  if (!WT.de || m === 1024) return '#' + c.toString(16).padStart(6, '0');
  const ch = v => Math.max(0, Math.min(v * m >> 10, 255));
  return 'rgb(' + ch((c >> 16) & 255) + ',' + ch((c >> 8) & 255) + ',' + ch(c & 255) + ')';
}
function drawWeather(ctx, fg) {                            // b(Graphics,boolean):2542
  const d = WT.dc[fg ? 0 : 1], off = fg ? 0 : WT.dc[0][0];
  if (WT.dq === 0 && !WT.de) return;
  for (let i = 0; i < d[0]; i++) {
    const p = WT.dd[i + off];
    if (p[0] !== 1) continue;
    const x = p[1] >> 10, y = p[2] >> 10;
    if (WT.dw === 1) {                                     // 雨丝 a(g,5参):2574 — 沿速度画斜线
      const vx = p[5] * 32 >> 10, vy = p[6] * 32 >> 10, t = fg ? p[3] : -1;
      ctx.lineWidth = 1;
      if (t < 0) { ctx.strokeStyle = wxCss(0xAAAACC, 512 + (WT.dg >> 1)); seg(x, y, x + vx, y + vy); }
      if (t < 2) { ctx.strokeStyle = wxCss(0xAAAACC, 768 + (WT.dg >> 2)); seg(x, y, x + vx, y + vy); }
      else {                                               // 前景亮雨丝: AAAACC 底 + FFFFFF 盖
        ctx.strokeStyle = wxCss(0xAAAACC, 1024); seg(x, y, x + vx, y + vy);
        ctx.strokeStyle = '#fff'; seg(x, y, x + vx, y + vy);
      }
    } else {                                               // 雪花 a(g,3参):2598
      const s = p[3] >> (fg ? 0 : 1);
      if (s > 1) {
        ctx.fillStyle = '#DDDDFF'; ctx.fillRect(x + 1, y + 1, s - 1, s - 1);
        ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + s, y, 1, 1);
        ctx.fillRect(x, y + s, 1, 1); ctx.fillRect(x + s, y + s, 1, 1);
      } else { ctx.fillStyle = wxCss(0xAAAADD, 1024); ctx.fillRect(x, y, s + 1, s + 1); }
    }
    function seg(a, b, c2, d2) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d2); ctx.stroke(); }
  }
}
const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: false, alpha: true, preserveDrawingBuffer: true });
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
    ground: !!GROUND_TPL, block: !!BLOCK_TPL, crane: !!CRANE_TPL, live: liveBlocks.length,
    liveBox: liveBlocks.map(m => ({ n: m.name, p: m.position.x.toFixed(0) + ',' + m.position.y.toFixed(0),
      box: (b => b.isEmpty() ? 'empty' : [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map(v => v.toFixed(0)).join('~'))(new THREE.Box3().setFromObject(m)) })) });
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
  const col = c => wxCss(c, WT.dg + WT.dk);                // a(bK, dg+dk, bl2=true) :2759 天气变暗+闪电
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
      if (Math.floor((S.cg + n7) / 200) % 2 !== 0) { bg2d.fillStyle = '#f00'; bg2d.fillRect(b[0] + (b[1] >> 1), (aU - n7 + n2s) - b[3], 3, 3); }   // l():4088 相位!=0
    } else if (b[6] === 2) {                               // 宽顶箱
      bg2d.fillRect(b[0] + b[1] / 10, (aU - n7 + n2s) - 16, b[1] - b[1] / 5, 16);
    }
  }
  drawSky89(horizonY === null ? horizonScreenY() : horizonY);   // 锚=i() 的 3D 投影地平线(:3428), 非色带边界 (勘误)
}
const dH2 = c => c;                                        // dH 色已是 RGB
// 3D 组
const towerGroup = new THREE.Group(); scene.add(towerGroup);   // 摇摆作用于组 (近似 A() 逐层投影)
const fxGroup = new THREE.Group(); scene.add(fxGroup);
let templates = [], GROUND_TPL = null, CB_TPL = null, CRANE_TPL = null, CABLE_TPL = null, BLOCK_TPL = null, BG_TOWERS = [], bgMeshes = [];  // *_TPL = 子网格数组
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

new GLTFLoader().load('./assets/scene.glb?v=2', gltf => {
  const root = gltf.scene; root.updateMatrixWorld(true);
  root.traverse(n => {
    if (n.isMesh && !templates.find(t => t.name === n.name)) {
      n.material.side = THREE.DoubleSide;                  // MeshNode.normalizeAppearance 近似
      if (n.material.map) { n.material.map.colorSpace = THREE.SRGBColorSpace;
        // m3g 原文 Texture2D filtering [208,210] = NEAREST/无mipmap — GLB sampler 默认 LINEAR
        // 会在 16x16 小贴图边缘混色 → 吊钩白边。强制最近邻。
        n.material.map.magFilter = THREE.NearestFilter; n.material.map.minFilter = THREE.NearestFilter;
        n.material.map.generateMipmaps = false;
        // m3g CompositingMode blending 64 = ALPHA_BLEND (吊钩等小贴图带 alpha) —
        // 不开 transparent 时贴图透明区按 RGB(白)不透明渲染 → 钩子白矩形
        n.material = new THREE.MeshBasicMaterial({ map: n.material.map, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }); }
      else {
        // 无贴图材质: 用 GLB baseColorFactor (转换器自 m3g diffuse RGBA 直传, 2026-10-04 修复)
        // 原曾硬编码 0xcccccc → uid9 土板/灰板全成浅灰
        const f = n.material.userData?.baseColorFactor || (n.material.color ? [n.material.color.r, n.material.color.g, n.material.color.b, 1] : [0.8, 0.8, 0.8, 1]);
        const c = new THREE.Color(f[0], f[1], f[2]);
        c.convertSRGBToLinear();
        n.material = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: f[3] < 1, opacity: f[3] });
      }
      templates.push(n);
    }
  });
  // uid→GLB 节点: n(uid+250)。cy块=uid13→n263, cC地面=uid9→n259, cD吊臂=uid8→n258, cE缆=uid7→n257
  const T = name => templates.filter(t => t.name === name || t.name.startsWith(name + '_'));
  GROUND_TPL = T('mesh269'); CB_TPL = T('mesh268'); CRANE_TPL = T('n260'); CABLE_TPL = T('mesh261'); BLOCK_TPL = T('mesh265');
  // 勘误 (2026-10-05): 快速模式 bl=4 (:3115) → cB=uid23=mesh268 (84v 标准块);
  // mesh262=uid20 是城市 bl=1 蓝房子 (用户指正: 蓝色属城市模式, 与快速无关)
  // 勘误: uid8 吊车在 GLB 里对象名是节点名 n260 (GLTFLoader 单 primitive 用节点名),
  // 旧 T('mesh260') 匹配空 → 吊车从未渲染 (开局无悬臂/钢丝/吊钩)。
  // uid 对号勘误 (2026-10-04): cC=n.a(9)=mesh269 是 bs≤5 附加灰色平面(无贴图, 原版 cC.c()+a() 手动渲染);
  // 带贴图的工地全景(黄土地+水泥台) = uid20 → mesh262, 属 World 保留模式每帧必渲染 (n.a(graphics)),
  // 节点平移 [-400,0,0]。此前 GROUND_TPL 误用 mesh269 当工地 → 灰色平面盖住水泥台。
  // 勘误 (2026-10-04): 下列四个 mesh 实为块模型翻滚族 uid30..33 (29+bl, k.java:1481 级数表),
  // 并非"背景楼" — 曾误作 3D 背景常驻摆放, 即地面红/蓝盒子来源。快速模式背景楼 = 2D dG 程序矩形
  // (a(Graphics,4):4054), 3D 层无任何彩色背景物。删除 BG_TOWERS 摆放。
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
  drawWeather(hud, true);                                  // b(g,true) :3270 — 前景天气画在 3D 之上
  // 惊慌人群 (k(Graphics):3624) — 3D→2D 投影, 两帧小人镜像
  for (const p of S.people) {
    if (!p) continue;
    const n4 = S.cg - p.t0;
    let frame = 0;
    if (p.st === 1) {                                      // B():2182-2186 — 折返: 1,2,3,4,5,4,3,2
      frame = 1 + Math.floor(Math.max(0, n4 - 1200) / 280) % 8;
      if (frame > 5) frame = 5 - (frame - 5);               // 缺此折返会闪帧6-8 (半空变姿态)
    }
    else if (p.st === 2) frame = 6 + Math.floor(S.cg / 200) % 2;   // B() case2: 横向滑落/爬窗两帧交替
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
      if (n7 <= S.ba)                                        // 剩余命: ba==1 时 500ms 相位闪帧9 (仅此一格)
        n6 = S.ba === 1 && Math.floor(S.cg / 500) % 2 === 0 ? 9 : baseFrame;
      else if (S.cg - S.bc < 100 && n7 <= S.ba + S.bb) n6 = baseFrame + 1;
      else n6 = 8;
      hud.drawImage(tex2d.id19, CN + (CN >> 1) + 14 - n6 * 11 + 4, F - CO - n7 * 12);
    }
    hud.restore();
    if (S.bs > 0) {
      // 人口 (j:3497-3501): 大数字右缘 E-cn, y=F-co-2-12; V=id18 图标 (E-cn-28-3-11, F-co-2-19)
      // 原式先 setClip 11×19 再画 V — id18 全图 14×35, 下段彩条(调色/多帧区)不可见
      hud.save(); hud.beginPath(); hud.rect(E - CN - 28 - 3 - 11, F - CO - 2 - 19, 11, 19); hud.clip();
      hud.drawImage(tex2d.id18, E - CN - 28 - 3 - 11, F - CO - 2 - 19);
      hud.restore();
      bigNum(E - CN, F - CO - 2 - 12, S.bt, 5);
    }
    // 楼层 (快速分支 j:3558-3562): W=id20 (cn-9, F-co-50) + 小数字右缘 cn-9+23, y=F-co-50+37
    hud.drawImage(tex2d.id20, CN - 9, F - CO - 50);
    smallNum(CN - 9 + 23, F - CO - 50 + 37, S.bs, 3);
  }
  // 连击 HUD (j:3533-3567) — 全部在 bA>0 门内 (:3534 break block22), 无连击=无任何星框/发光
  if (S.bA > 0) {
    // 计时条 (j:3536-3542 原式): 外框深红 (X0-3, co-1, E/2+5, 9) / 内框黄内缩1px (X0-2, co, E/2+3, 7)
    // / 填充 (X0, co+2, bA·E/2/6000, 4); 刚完美 150ms 内 (bA>5850) 填白。
    // MIDP drawRect 覆盖 (w+1)×(h+1): 外框行20..29/内框行21..28/填充23..26 (内框内腔22..27,
    // 上下各留1px → 居中)。canvas strokeRect(x+.5,y+.5,w,h) 边线恰在行 y 与 y+h → 原样传 w/h
    const X0 = (E >> 1) - (E >> 2);
    hud.strokeStyle = 'rgb(107,26,0)'; hud.lineWidth = 1;
    hud.strokeRect(X0 - 3 + 0.5, 20.5, (E >> 1) + 5, 9);
    hud.strokeStyle = 'rgb(252,255,0)';
    hud.strokeRect(X0 - 2 + 0.5, 21.5, (E >> 1) + 3, 7);
    hud.fillStyle = S.bA > 5850 ? '#fff' : 'rgb(252,255,0)';
    hud.fillRect(X0, 23, Math.max(0, S.bA * (E >> 1) / 6000), 4);
    // 条左图标 al=id38 22px 4 帧 cg/80%4, anchor 20=LEFT|TOP → 顶左=(E/2-E/4-11, co-7) (:3543)
    hud.drawImage(tex2d.id38, (Math.floor(S.cg / 80) % 4) * 22, 0, 22, 22,
      (E >> 1) - (E >> 2) - 11, 14, 22, 22);
    // 悬挂/落块高亮框 (j:3545-3550): am id39 三帧 — 同在 bA>0 门内
    if (S.aw[0] === 1 || S.aw[0] === 2) {
      const pos = project(S.az[0], S.aA[0]);
      hud.drawImage(tex2d.id39, (Math.floor(S.cg / 100) % 3) * 44, 0, 44, 44, pos.x - 22, pos.y - 22, 44, 44);
    }
    // 连击层星框 (j:3551-3557): 用户实机定性=连击时整栋可见楼都亮 (含连击层以下), 而非仅顶部
    // bz 层 — 原文循环 by→max(0,by-bz) 在 bz≥窗口时即全窗, 按实机观察直接铺满可见窗口
    for (let n7 = S.by; n7 >= 0; n7--) {
      const pos = project(S.bi[n7], S.bj[n7]);
      hud.drawImage(tex2d.id39, ((Math.floor(S.cg / 100) + n7) % 3) * 44, 0, 44, 44, pos.x - 22, pos.y - 22, 44, 44);
    }
    // 倍数 "x{bz}" (j:3558-3581 原式): x 字形 clip=+5,co 7×12 / 图 y=co-2 (字形低数字 2px);
    // 数字首位 x = (E/2+E/4)+12+7·n7 再减 6 (绘制器 :3586 n6=n3-6 起步), y=co-2
    if (S.bz > 1) {
      const n7 = S.bz > 9 ? 2 : 1;
      const Xd = (E >> 1) + (E >> 2) + 5;
      hud.save(); hud.beginPath(); hud.rect(Xd, 21, 7, 12); hud.clip();
      hud.drawImage(tex2d.id16, Xd - 13 * 7, 19);
      hud.restore();
      bigNum(Xd + 7 + 2 + n7 * 7 - 6, 19, S.bz, n7);
    }
  }
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
  // 勘误 (2026-10-04, d.java+3316 原文): n.a(graphics) 仅 bindTarget+clear, World 不整体渲染;
  // 一切网格经 d 类逐个 render (d.a()=Graphics3D.render)。快速模式 3D 层仅: cC(bs≤5)/cD吊臂/块。
  // mesh262(uid20) 是城市建筑模型(cB族), 不得渲染 — 即"地基左侧蓝盒子"来源, 删除摆放。
  if (S.bs <= 5) put(GROUND_TPL, 0, 0, 0, 0, 0);            // cC 附加灰平面 (identity, bs<=5, 原版 cC.c()+a())
  // f():3317-3329 原文 (uid8 真实几何=8顶点: 128x198 吊具面板+28x1030 单缆上探1246,
  // 此前"退化点阵"系 dump 脚本 off-by-one 读错对象的伪数据):
  //   cD=uid8/n260 单缆+吊钩: bk==0 正式游戏常显 (第2层起单根缆绳晃动, 首落成即出现)
  //   cE=uid7/mesh261 双缆: bk==1||aw==3||(bk==4&&aw!=2) — 运镜期扯着首块 (与 2D 悬臂同条件)
  if (S.bk === 0) put(CRANE_TPL, S.aK, S.aL, 0, S.aM * 2 / 3, 0);   // cD, 旋 aM/540*360
  if (S.bk === 1 || S.aw[0] === 3 || (S.bk === 4 && S.aw[0] !== 2)) put(CABLE_TPL, S.aK, S.aL, 0, 0, 0);
  // a(graphics):3265-3270 哨兵覆盖: bk==1→ax=888(翻滚), bk==4→ax=999(锁零旋转)
  // b():3348-3351 解码: 888→cz/cA 随机翻滚; 999→cB 网格+旋转0 (双缆期首块: 只平移不旋转)
  if (S.aw[0] !== 0) S.ax[0] = S.bk === 1 ? 888 : S.bk === 4 ? 999 : S.ax[0];
  for (let i = 0; i < 5; i++) {
    if (S.aw[i] === 4 || S.aw[i] === 0) continue;
    if (S.ax[i] === 999) put(CB_TPL, S.az[i], S.aA[i], 0, 0, S.cG[i]);     // cB=uid23 快速首块模型, 零旋转
    else put(BLOCK_TPL, S.az[i], S.aA[i], 0,
        S.ax[i] === 888 ? Math.random() * 360 : S.ax[i], S.cG[i]);
  }
  for (let i = 0; i < Math.min(S.bs, 5); i++) {
    // 第1层(绝对层号0)保留 cB 特殊贴图 (用户实机对号); bi[] 是可见窗口压缩索引
    // (rebuildFloors 从 bx=max(0,bs-5) 起写), bs>5 时渲染槽0=第bs-5层 — 判据须用绝对层号
    put(S.bs - Math.min(S.bs, 5) + i === 0 ? CB_TPL : BLOCK_TPL, S.bi[i], S.bj[i], 0, S.cF[i], -S.bh[i]);
  }
  // 底块消失探针: 记录相机移动期的渲染窗口与视锥底
  if (S.aW !== S.aX) {
    window.__camLog = (window.__camLog || []).slice(-40);
    window.__camLog.push({ t: Math.round(S.cg), bs: S.bs, aW: Math.round(S.aW), aX: S.aX,
      n: Math.min(S.bs, 5), botY: Math.round(S.bj[0] - 128), viewBot: Math.round(S.aW - 1280) });
  }
  renderer.render(scene, camera);
}

// ---- 音频: LibMidi (抄 freej2me-web web/libmidi — wasm 合成, 非自写振荡器) ----
// x 播放器 = BGM 循环 (r0[81]); b.a 负 id = jingle 单发 (83 放置/84 败/85 胜)
let bgmPlayer = null, jinglePlayer = null;
let audioOn = (() => { try { return localStorage.getItem('twrblx_sound') !== '0'; } catch (e) { return true; } })();
try { document.getElementById('sound').textContent = audioOn ? '声音:开' : '声音:关'; } catch (e) {}   // 声音总开关 (UI 按钮, localStorage 持久化)
function beep() {                                           // c.a(800): 扣命/地基提示短音
  if (!audioOn) return;
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
  if (!audioOn) return;
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
  if (!audioOn) return;
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
    aF: S.aF, cF: S.cF, cj: S.cj, dE: S.dE, bw: S.bw,
    wx: (({ cX, cY, da, db, dq, dw, de, dv, dr, ds, dt, du, dh, dg, dk, dn }) =>
      ({ cX, cY, da, db, dq, dw, de, dv, dr, ds, dt, du, dh, dg, dk, dn }))(WT) };
  try { localStorage.setItem(RS_KEY, JSON.stringify(d)); } catch (e) {}
}
function loadRS() {
  try {
    const d = JSON.parse(localStorage.getItem(RS_KEY) || 'null');
    if (!d || d.v !== 2 || d.bs === 0) return false;
    Object.assign(S, { bs: 0, bt: d.bt, ba: d.ba, bz: d.bz, bA: d.bA, bB: d.bB, bC: d.bC,
      bm: d.bm, bn: d.bn, bo: d.bo, bw: d.bw, aP: d.aP, aW: d.aW, aX: d.aX });
    S.aF = d.aF || S.aF; S.cF = d.cF || S.cF; S.cj = d.cj || S.cj;
    if (d.wx) Object.assign(WT, d.wx);                     // 天气跨存档持续 (RMS :577-600)
    if (WT.dq > 0) { weatherParams(WT.dw); weatherFill(); WT.dc[0][1] = WT.dc[0][0] >> 1; WT.dc[1][1] = WT.dc[1][0] >> 1; }
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
// 重新开始: 先置标志再清档 — 否则 reload 触发 beforeunload→saveRS() 把当前局存回去
let restarting = false;
function restartGame() {
  if (restarting) return;
  restarting = true;
  clearRS();
  location.reload();
}
// 声音开关: 关=停 BGM/jingle/beep 全静音; 开=恢复 BGM。stopPropagation 防落块
document.getElementById('sound').addEventListener('pointerup', e => {
  e.stopPropagation();
  audioOn = !audioOn;
  document.getElementById('sound').textContent = audioOn ? '声音:开' : '声音:关';
  try { localStorage.setItem('twrblx_sound', audioOn ? '1' : '0'); } catch (err) {}
  if (!audioOn) {
    try { bgmPlayer && bgmPlayer.midiPlayer.stop(); } catch (err) {}
    try { jinglePlayer && jinglePlayer.midiPlayer.stop(); } catch (err) {}
  } else startBgm();
});
document.getElementById('restart').addEventListener('pointerup', e => {
  e.stopPropagation();
  restartGame();
});
addEventListener('pointerup', () => drop());               // 全局落块 (b:3651) — v4 误删致鼠标失效
addEventListener('keydown', e => {
  if (e.code === 'KeyR') { restartGame(); return; }
  if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') { e.preventDefault(); drop(); }
});
addEventListener('beforeunload', () => { if (!restarting) saveRS(); });

// ---- 主循环 (:1697-1719): 25ms 门控, 序=z,u,E,p,s,q,A,B,连击 ----
let last = performance.now(), booted = false, bootAt = 0, lastRender = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = now - last; last = now;
  if (!booted) { renderer.render(scene, camera); return; }
  S.cM += dt;
  if (S.cM >= 25) {
    const cM = S.cM; S.cM = 0; S.cg += cM;
    if (!S.over) {
      camTick();                                           // z()
      weatherTick(cM);                                     // u() (:1705, 无 bk/bl 门)
      // tick 门控勘误 (2026-10-05): 原文 :1700-1702 仅 f∈{4,5,6,8} 菜单态跳过, 运镜期 f=7
      // tick 照跑 (块随摆小幅动)。此前误用 aW!=aX 当运镜 → 盖楼后相机上升期也被冻结
      // (提钩停摆→块消失)。运镜特有语义只在 z(): bk==4 不更新 aJ (break block5)。
      swing(cM);                                           // p()
      blocks(cM);                                          // s()
      sway();                                              // q()
      rebuildFloors();                                    // A() (:1710 每 tick)
      peopleTick(cM);                                      // B()
      if (S.bA > 0) {                                      // 连击计时 (:1712-1718)
        S.bA = S.bA - cM - (S.bz - 1) * cM / 6;
        if (S.bA <= 0) H();
      } else if (S.bA > -2000) S.bA -= cM;
      if (S.bs > 0 && S.bs % 10 === 0) saveRS._dirty = true;
    }
  }
  // 渲染门控: rAF(≈60fps) + setInterval(40fps) 双驱动会叠加到≈100次/秒,
  // sky/render3D/drawHUD 每次都是全画布重绘 — 限制到 ≥24ms 一次 (≈40fps, 对齐 J2ME tick)
  if (booted && now - lastRender >= 24) {
    lastRender = now;
    fxTick(); sky(); drawFX();
    render3D();
    drawHUD();
  }
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
  weatherInit();                                           // :4025-4026 雨/雪开局掷骰 (JAD 20%/30%)
  for (let t = 1; t <= 28; t++) {                          // dz = 8·max(图宽,高), 型6/11 减半 (:1319-1333)
    const img = tex2d['id' + FX_DCT[t - 1]];
    FX_DZ[t - 1] = (!img || FX_DCT[t - 1] === -1) ? 1 : 8 * Math.max(img.naturalWidth, img.naturalHeight) * (t === 6 || t === 12 ? 0.5 : 1);
  }
  { // 开局运镜 (K():3982-3993): 相机从吊钩基线 2432 缓降 2500ms 至地基 512
    S.aW = 2432; S.aX = 512; S.aY = S.cg + 3000; S.aH = 1664;
    S.aw[0] = 1; S.aL = aJ - S.aH; S.aA[0] = S.aL;
    if (loadRS()) {                                        // 有续档: 无运镜, 直接正常游戏态
      S.aW = S.aX; S.aY = S.cg;
      S.bk = 0;                                            // 原文读档(:3119 h()+D())不写 bk 且无 K() 运镜
      aJ = S.aW + 1792 + 128;                              // 吊钩基线随相机 (z():1779); 漏此行则
                                                           // aJ 恒 2432 → 挂块/单缆悬半空错位
    }
  }
  zFloor(0);                                               // 参数初始化
  startBgm();
}
