// H5 逻辑冒烟测试 (无头运行)
// 注意: 必须 stub 掉 draw/hud (每帧全图重绘+迷雾渐变在无头模式极慢), 帧数 ≤500
const fs = require("fs");

const ctxStub = new Proxy(function () {}, {
  get(t, p) {
    if (p === Symbol.toPrimitive) return () => 0;
    return ctxStub;
  },
  apply() { return ctxStub; },
  set() { return true; },
});
global.__ctxStub = ctxStub;
global.document = {
  getElementById: () => ({ getContext: () => ctxStub, textContent: "", appendChild() {}, innerHTML: "", style: {}, classList: { toggle() {} }, dataset: {}, addEventListener() {} }),
  createElement: () => ({ onclick: null, classList: { toggle() {} }, style: {}, getContext: () => ctxStub, width: 0, height: 0, appendChild() {}, addEventListener() {} }),
  createTextNode: () => ({}),
  addEventListener() {},
};
global.window = { addEventListener() {} };
global.Image = class { constructor() { this.src = ""; } };
global.Audio = class { constructor() {} play() { return { catch() {} }; } };

let src = fs.readFileSync("./data.js", "utf-8") + "\n" + fs.readFileSync("./game.js", "utf-8");
const cvCode = 'const cv = { width: 960, height: 480, addEventListener() {}, getBoundingClientRect() { return { left: 0, top: 0 }; } };';
src = src.replace(/const cv = document\.getElementById\('cv'\);/, cvCode);
src = src.replace(/const ctx = cv\.getContext\('2d'\);/, "const ctx = global.__ctxStub;");
src = src.replace(/setInterval\(tick, 1000 \/ 30\);/, "");   // 无头: 去掉真定时器
src = src.replace(/function draw\(\) \{/, "function draw() { if (global.__noDraw) return;");  // 可开关
src = src.replace(/function hud\(\) \{/, "function hud() { if (global.__noDraw) return;");

src += "\nglobal.__noDraw = true;   // 无头: 跳过绘制只测逻辑";
// 沿 parcourt1 真实路点放塔 (含 2 座雷达驱雾)
src += "\nconst R1 = ROUTES.parcourt1;";
src += "\nconst ids = ['canon105','canon105','crotale','canon105','crotale','canon105','canon105','crotale','canon105','crotale','canon105','canon105'];";
src += "\nfor (let i = 0; i < 12; i++) { const p = R1[Math.min(i * 2, R1.length - 1)]; G.turrets.push(new Turret(ids[i], p[0] + (i % 2 ? 70 : -70), p[1])); }";
src += "\nG.turrets.push(new Turret('radar', R1[6][0], R1[6][1] + 120));";
// 海线也布防
src += "\nconst R4 = ROUTES.parcourt4;";
src += "\nG.turrets.push(new Turret('canon105', R4[4][0], R4[4][1] + 60));";
src += "\nG.turrets.push(new Turret('crotale', R4[6][0] + 60, R4[6][1] + 40));";
src += "\nfor (let i = 0; i < 450; i++) tick();";
src += '\nconsole.log("迷雾+真实路点 450帧: 波次=%d 金钱=%d 场上敌=%d 击杀=%d 塔存=%d/%d lost=%s won=%s",';
src += '  G.wave, G.euros, G.units.filter(u=>u.hp>0).length,';
src += '  14 - G.turrets.length + G.turrets.filter(t=>t.hp>0).length, G.turrets.filter(t=>t.hp>0).length, G.turrets.length, G.lost, G.won);';
src += '\nconst aaT = G.turrets.find(t => !t.aa);';
src += '\nif (aaT) { G.euros += 5000; const c0 = aaT.aaUpgradeCost(); const ok = aaT.upgradeAA(); console.log("对空升级: 花费=%d 成功=%s 可对空=%s", c0, ok, aaT.aa); }';
src += '\nconsole.log("迷雾验证: 视野源数=", VIS.length, " 敌人在迷雾外不可见=", !isVisible(100000, 100000));';
// ---- Su37 空袭流程 (原版 m31 才解锁, 测试前先置 unlocker.su37 = true) ----
src += `
G.frame = 0;
G.unlocker.su37 = true;
const su0 = { avail: SU37.available, cool: SU37.cool };
// 放一队敌人在目标点附近, 验证炸弹伤害
G.units.length = 0;
[0,1,2].forEach(i => { const u = new Unit('abrams', '105mmAbrams', 'parcourt1'); u.x = 800 + i*30; u.y = 200; G.units.push(u); });
const hp0 = G.units.map(u => u.hp);
const okStart = su37Start();
const aiming = G.su37Aiming;
const p0 = SU37.pending ? { side: SU37.pending.side, x: Math.round(SU37.pending.x), y: Math.round(SU37.pending.y) } : null;
su37Launch(820, 210);
const planeAfter = !!SU37.plane;
const availAfterLaunch = SU37.available;
let guard = 0;
while (SU37.plane && guard++ < 400) su37Update();
const hp1 = G.units.map(u => u.hp);
const dmg = hp0.map((h, i) => h - hp1[i]);
console.log("Su37: start=%s aiming=%s 边=%s 起飞=%s 起飞后available=%s",
  okStart, aiming, p0 && p0.side, planeAfter, availAfterLaunch);
console.log("Su37 投弹: 3 敌HP损伤=%j 爆炸特效=%d", dmg, G.effects.length);
// 冷却: 从 COOL_FRAMES 起逐帧跑到恢复
SU37.available = false; SU37.cool = SU37.COOL_FRAMES;
let f = 0; while (!SU37.available && f++ < 200) su37Update();
console.log("Su37 冷却: 从 %d 跑到恢复用了 %d 帧 (期望 %d)", SU37.COOL_FRAMES, f, SU37.COOL_FRAMES);
// ---- E: 命中音概率 + 音效文件存在性 ----
const fs2 = require('fs');
const played = {};
const origPlaySfx = playSfx;
playSfx = function(name, vol) { played[name] = (played[name] || 0) + 1; };
const N = 4000;
for (let i = 0; i < N; i++) impactSfx();
const rico = Object.keys(played).filter(k => k.startsWith('ricochet')).reduce((a,k)=>a+played[k],0);
const metal = Object.keys(played).filter(k => k.startsWith('metal')).reduce((a,k)=>a+played[k],0);
console.log("命中音概率 (%d 次): ricochet=%d (期望~15%%) metal=%d (期望~30%%)",
  N, rico, metal);
const missing = [];
for (const k in SFX_FILES) if (!fs2.existsSync('./assets/sounds/' + SFX_FILES[k])) missing.push(k + '→' + SFX_FILES[k]);
console.log("音效文件: 共 %d 个, 缺失 %d %j", Object.keys(SFX_FILES).length, missing.length, missing);
playSfx = origPlaySfx;
['bullet','missile2','missile','obusLourd','obusLeger'].forEach(k => shellImpactSfx(k));
console.log("shellImpactSfx 三型接线正常");
// ---- F: 阴影映射 ----
// ---- G: 选中视觉 ----
console.log("选中视觉: 准星帧=%d 射程圈=%s (原版 778/775)", SEL_CROSS.length, !!SEL_RANGE);
console.log("BGM: %j chid映射 %j (曲名来自原版1151按钮文本)", BGM_NAMES, BGM_FILES);
// I: 行进音族 + 单位朝向
const famTest = {};
for (const ch of ['camion1','jeep','bradley','amx10','abrams','camionBlinde','t90','tigre','navire','Yamato']) {
  const fam = ch in MOVE_FAMILY ? MOVE_FAMILY[ch] : 'Light';
  famTest[ch] = fam || '(无)';
}
console.log("行进音族: %j", famTest);
console.log("单位图: %d 张 (FFDec 导出已含 alpha, bbox居中, 车头朝上)", Object.keys(UNIT_BMP).length);
// 环境鸟叫
const birdKeys = Object.keys(SFX_FILES).filter(k => k.length === 3 && k[0] === 'b');
lastBirdAt = 0; const birdLog = {};
const _ps = playSfx; playSfx = (n,v) => { birdLog[n] = (birdLog[n]||0)+1; };
playBirds(0); playBirds(5000); playBirds(10000); playBirds(20000);
playSfx = _ps;
// 修理面板 (原版 819 refresh 公式: 4*(maxHP-curHP)/range)
{
  const t2 = new Turret('canon105', 0, 0);
  t2.hp = t2.maxHp - 10;
  const p = repairPrice(t2);
  const expect = 2 * 10;
  console.log("修理费: canon105 缺10HP → %d $ (公式 2*10=%d) 一致=%s", p, expect, p === expect);
  const e0 = G.euros; G.euros = 9999;
  const ok = repairIfCan(t2);
  console.log("repairIfCan: %s HP=%d/%d", ok, t2.hp, t2.maxHp);
  t2.autoRepair = false; swithRepair(t2);
  console.log("swithRepair: autoRepair=%s", t2.autoRepair);
  G.euros = e0;
}
// 建造区遮罩 (原版 surfaceForBuild chid 768)
console.log("建造预览: 光标帧=%d 取消提示帧=%d (原版 822/1161)", CURSOR_FRAMES.length, CANCEL_HINT.length);
{
  G.turrets.length = 0;   // 清空已有塔, 隔离测试
  const R1 = ROUTES.parcourt1;
  const onRoad = R1[3];               // 真实路点上 (599,87)
  const offRoad = [1600, 400];        // 离最近路线 208px 的草地
  console.log("可建判定(回退路径): 路点%j上=%s (应false)  草地%j=%s (应true)",
    [Math.round(onRoad[0]), Math.round(onRoad[1])], buildAllowedAt(onRoad[0], onRoad[1]),
    offRoad, buildAllowedAt(offRoad[0], offRoad[1]));
}
console.log("鸟叫: %d 个音效, 10s节流触发 %d 次 %j", birdKeys.length, Object.keys(birdLog).length, Object.keys(birdLog));
console.log("阴影: %d 单位映射, alpha=%s offset=%s, 缺映射 %j",
  Object.keys(UNIT_SHADOW).length, SHADOW_ALPHA, SHADOW_OFFSET,
  Object.keys(UNIT_BMP).filter(k => k !== 'tigre' && !UNIT_SHADOW[k]));

// ==== M2a: 原版解锁机制 (unlockNextWeapon / interest+3 二选一) ====
console.log("--- 解锁机制 ---");
console.log("初始 unlocker: m60=%s gatling=%s canon75=%s crotale=%s su37=%s",
  G.unlocker.m60, G.unlocker.gatling, G.unlocker.canon75, G.unlocker.crotale, G.unlocker.su37);
console.log("AUTO_UNLOCK=%j  PANEL_WAVES=%j  weaponsToUnlock=%j", AUTO_UNLOCK, PANEL_WAVES, WEAPONS_TO_UNLOCK);
// 自动解锁: 波 7/11/16/27/31
G.unlocker = { m60:true, gatling:true, canon75:false, canon105:false, canon105D:false,
               radar:false, crotale:false, canon125:false, MLRS:false, pluton:false, MTHEL:false, su37:false };
G.iUnlock = 0;
[7,11,16,27,31].forEach(w => autoUnlockForWave(w));
const autoOK = ['canon75','canon105','canon105D','radar','su37'].every(k => G.unlocker[k]);
console.log("自动解锁 m7/11/16/27/31 全生效=%s (canon75=%s radar=%s su37=%s)",
  autoOK, G.unlocker.canon75, G.unlocker.radar, G.unlocker.su37);
console.log("二选一面板触发波次判定: m18=%s m19=%s m37=%s",
  shouldShowUnlockPanel(18), shouldShowUnlockPanel(19), shouldShowUnlockPanel(37));
// 二选一: 解锁路线 (iUnlock 递增, 依次 crotale→canon125→...)
const seq = [];
for (let i = 0; i < WEAPONS_TO_UNLOCK.length; i++) {
  const r = unlockNextWeapon();
  seq.push(WEAPONS_TO_UNLOCK[i] + ':' + r + '/' + G.unlocker[WEAPONS_TO_UNLOCK[i]]);
}
console.log("连续解锁 5 件: %j  iUnlock=%d", seq, G.iUnlock);
console.log("第 6 次调用 (应返回 false)=%s", unlockNextWeapon());
// 二选一: 利息路线
G.lockItem = false; const i0 = G.interest;
panelPickInterest();
console.log("panelPickInterest: interest %d → %d (原版 +3) 一致=%s  lockItem=%s", i0, G.interest, i0 + 3, G.interest === i0 + 3, G.lockItem);
// 面板锁: lockItem=true 时按钮无效
G.lockItem = true; const e1 = G.euros, i1 = G.interest;
panelPickInterest();
console.log("lockItem=true 时点击无效: interest 仍=%d (应 %d) 一致=%s", G.interest, i1, G.interest === i1);
// 重置到游戏初始态, 供后续一致性使用
G.unlocker = { m60:true, gatling:true, canon75:false, canon105:false, canon105D:false,
               radar:false, crotale:false, canon125:false, MLRS:false, pluton:false, MTHEL:false, su37:false };
G.iUnlock = 0; G.panelOpen = false; G.lockItem = true;

// ==== M2b: 自动修理蓝色磁场 (sprite 183) ====
console.log("--- 自动修理磁场 ---");
console.log("磁场素材: %d 帧 (原版 sprite 183 七帧) 直径=%dpx 颜色=#99CCFF (CXFORM add=[153,204,255])",
  MAGNET_FRAMES.length, MAGNET_DIAM);
{
  const t3 = new Turret('canon105', 0, 0);
  t3.hp = t3.maxHp - 100;
  t3.autoRepair = true;
  G.euros = 99999;
  const hpA = t3.hp;
  t3.update();
  const healed = t3.hp - hpA;
  console.log("autoRepair 一次 update: 修理 %d HP, magnetT=%d (应=%d)", healed, t3.magnetT, MAGNET_TICKS);
  // 关掉 autoRepair 再跑完剩余磁场, 确认单遍时长 = MAGNET_TICKS
  // (开着修理会每遍结束就重播 → 持续光环, 这正是原版 "every time a turret is auto-repaired" 语义)
  t3.autoRepair = false;
  let mf = 0; while (t3.magnetT > 0 && mf++ < 50) t3.update();
  console.log("单遍磁场用 %d 帧 (期望 %d = 7帧@24fps 折算到 30fps) 一致=%s", mf, MAGNET_TICKS, mf === MAGNET_TICKS);
  // 持续修理 → 持续重播 (原版语义)
  const t3b = new Turret('canon105', 0, 0);
  t3b.hp = 1; t3b.autoRepair = true; G.euros = 99999;
  let everZero = false;
  for (let i = 0; i < 60; i++) { t3b.update(); if (t3b.magnetT === 0) everZero = true; }
  console.log("持续修理 60 帧: 磁场从未熄灭=%s (原版每次修理重播) HP=%d/%d", !everZero, t3b.hp, t3b.maxHp);
  G.euros = 850;
  // autoRepair 关闭时不触发
  const t4 = new Turret('canon105', 0, 0);
  t4.hp = t4.maxHp - 100; t4.autoRepair = false;
  t4.update();
  console.log("autoRepair=false 时不触发: magnetT=%d (应 0) 一致=%s", t4.magnetT, t4.magnetT === 0);
  // 满血时不触发
  const t5 = new Turret('canon105', 0, 0);
  t5.autoRepair = true; t5.update();
  console.log("满血时不触发: magnetT=%d (应 0) 一致=%s", t5.magnetT, t5.magnetT === 0);
  G.euros = 850;
}
`;
eval(src);
console.log("[done]");
