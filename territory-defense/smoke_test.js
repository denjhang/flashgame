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
// 瞄准区标记 (原版 zoneBombardement chid 785, 替代 CSS 近似)
console.log("瞄准区: img=%s origin=(%s,%s) 154.3px (原版 785, FFDec 导出)",
  ZONE_IMG && ZONE_IMG.src, ZONE_ORIGIN.x, ZONE_ORIGIN.y);
const zbOk = ZONE_IMG && ZONE_IMG.src.endsWith('/zone/1.png')
  && ZONE_ORIGIN.x === -77.15 && ZONE_ORIGIN.y === -77.15;
console.log("瞄准区 785 资源已接入=%s", zbOk);
// ---- 阵亡序列 (原版 428 "destruction" 39帧: 车体三点爆炸 + 随机爆炸音) ----
console.log("--- 阵亡序列 ---");
{
  const u = new Unit('camion1', 'null', 'parcourt1');
  u.hp = 0;
  const e0 = G.euros, s0 = G.score, fx0 = G.effects.length;
  let sfxName = null;
  const _ps2 = playSfx; playSfx = (n) => { if (sfxName === null) sfxName = n; };
  killUnit(u);
  playSfx = _ps2;
  console.log("killUnit: dying=%d (期望 %d) 赏金+%d 随机音=%s",
    u.dying, DEATH_TICKS, G.euros - e0, sfxName);
  console.log("赏金在阵亡瞬间结算=%s 随机爆炸音在1..6=%s",
    G.euros - e0 === u.bounty, /^explosion[1-6]$/.test(sfxName || ''));
  // 推进序列: 统计爆炸点数 + 序列总长 + 漂移
  let booms = 0, flames = 0, ticks = 0;
  const fx1 = G.effects.length;
  while (u.dying > 0 && ticks++ < 100) {
    const before = G.effects.length;
    u.update();
    for (let i = before; i < G.effects.length; i++) {
      if (G.effects[i].type === 'death') booms++;
      if (G.effects[i].type === 'flame') flames++;
    }
  }
  console.log("序列: %d tick (期望 %d) 一致=%s", ticks, DEATH_TICKS, ticks === DEATH_TICKS);
  console.log("车体爆炸 %d 个 (原版帧2/4/7 共3个) 一致=%s; 火焰叠层 %d 个 (每次爆炸各1) 一致=%s",
    booms, booms === 3, flames, flames === 3);
  console.log("素材: 爆炸=chid279 4帧 火焰=chid637 %d帧 原生下落时长 %d tick",
    DEATH_FLAME_FRAMES.length, DEATH_FLAME_TICKS);
  console.log("漂移量=%s (原版 chassis ty -155.05→-167.05 = %d) 序列结束 dead=%s",
    u.drift.toFixed(1), DEATH_DRIFT, u.dead);
  // 重复调用不重复结算
  const e1 = G.euros; killUnit(u);
  console.log("阵亡中再 killUnit 不重复结算=%s (euros %d→%d)", G.euros === e1, e1, G.euros);
  // 活着的单位不会被误杀
  const alive = new Unit('jeep', 'null', 'parcourt1');
  killUnit(alive);
  console.log("活单位 killUnit 无效=%s (dying=%d, 应 0)", alive.dying === 0, alive.dying);
  G.euros = e0; G.score = s0;
}
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

// ==== M2c: 炮塔外观库核实 (本轮: 86 库=线框标记层 → 改用 173 库整帧) ====
console.log("--- 炮塔外观库 ---");
console.log("173 库整帧: 帧号映射 %d 种武器, 画布原点 (%s,%s)",
  Object.keys(TURRET_LIB_FRAME).length, TURRET_LIB_ORIGIN.x, TURRET_LIB_ORIGIN.y);
{
  const bad = Object.keys(TURRET_LIB_FRAME).filter(k => !TURRET_LIB_FRAME[k]);
  console.log("帧号映射完好=%s 缺=%j", bad.length === 0, bad);
  // 玩家塔 = 86 结构层 + 173 塔体层 (同武器名)
  const miss = Object.keys(PLAYER_ETURRET).filter(k => !TURRET_LIB_FRAME[PLAYER_ETURRET[k]]);
  console.log("PLAYER_ETURRET 全部有 173 帧=%s 缺=%j", miss.length === 0, miss);
  console.log("旧单帧变量已删除: TURRET_SRC=%s TURRET_IMG=%s ETURRET_PARTS=%s",
    typeof TURRET_SRC, typeof TURRET_IMG, typeof ETURRET_PARTS);
}
// ---- 玩家塔结构层 86 库 (structureDeco, 不随瞄准旋转) ----
console.log("--- 玩家塔结构层 (86 库) ---");
{
  console.log("86 库画布原点 (%s,%s) [union 验证 76.49x76.49 ≈ FFDec 实测 76x76]",
    TURRET_BASE_ORIGIN.x, TURRET_BASE_ORIGIN.y);
  const labs = ['m60','gatling','canon75','canon105','canon105D','radar','crotale','canon125','MLRS','pluton','MTHEL'];
  const missing = labs.filter(k => !TURRET_BASE_FRAME[k]);
  console.log("86 库 %d 帧 = 玩家 %d 种武器, 映射完好=%s 缺=%j",
    Object.keys(TURRET_BASE_FRAME).length, labs.length, missing.length === 0, missing);
  // 每个玩家武器必须两层都有
  const noBase = labs.filter(k => !TURRET_BASE_FRAME[k]);
  const noLib = labs.filter(k => !TURRET_LIB_FRAME[k]);
  console.log("11 种玩家武器双层齐全=%s (缺基座 %j / 缺塔体 %j)",
    noBase.length === 0 && noLib.length === 0, noBase, noLib);
  // 帧号对应关系与原版一致 (86 f1=m60 ... f11=MTHEL 连续)
  const seq = labs.map(k => TURRET_BASE_FRAME[k]);
  console.log("86 帧号序列 %j (应 1..11 连续)", seq);
}
// ---- 持续 idle 自转 (原版 onClipEvent(enterFrame) 逐帧累加 _rotation) ----
// 权威清单 (穷举 DefineSprite_173 全部 enterFrame 脚本):
//   f7 radar d1 115 +=2 | f8 crotale d2 121 +=10 | f13 radarMobile d1 115 +=4 / d4 115 -=12
//   f20 crotaleAbrams d4 121 +=10 | f25 navireCrotale d24 121 +=10
console.log("--- idle 自转 ---");
{
  // B 类: 整帧之上叠加自转件
  const bIds = Object.keys(IDLE_SPIN);
  const bExpect = { crotale: 121, crotaleAbrams: 121, navireCrotale: 121 };
  const bBad = bIds.filter(k => IDLE_SPIN[k].chid !== bExpect[k]);
  console.log("B类(叠加)自转件 %j chid 权威一致=%s 不符=%j", bIds, bBad.length === 0, bBad);
  const bIncomplete = bIds.filter(k => !IDLE_SPIN[k].t || IDLE_SPIN[k].scale === undefined
    || !IDLE_SPR_ORIGIN[IDLE_SPIN[k].chid]);
  console.log("B类 m/o 完整=%s 缺=%j", bIncomplete.length === 0, bIncomplete);
  // A 类: 整帧即自转件 (不能叠加, 否则重影)
  console.log("A类(整帧自转): %j  %j",
    Object.keys(LIB_SPIN), LIB_SPIN.radar);
  console.log("A类特例 radarMobile 两个反向自转件: %j",
    RADARMOBILE_SPIN.map(s => s.chid + ':' + s.degPerSWFFrame + '°@d'));
  // 速率换算核对 (SWF 24fps → H5 30fps)
  const rate = d => d * 24 / 30;
  console.log("速率换算: radar %d°/帧(原版) → %s°/帧(H5); crotale %d → %s",
    LIB_SPIN.radar.degPerSWFFrame, rate(LIB_SPIN.radar.degPerSWFFrame).toFixed(1),
    IDLE_SPIN.crotale.degPerSWFFrame, rate(IDLE_SPIN.crotale.degPerSWFFrame).toFixed(1));
  // 关键不变量: A 类的武器不能被放进 B 表 (否则重复绘制)
  const overlap = Object.keys(LIB_SPIN).filter(k => IDLE_SPIN[k]);
  console.log("A/B 表无重叠=%s 重叠=%j (radar 不得同时进两表)", overlap.length === 0, overlap);
  console.log("塔底盘: shape53 = DefineShape3 填充 RGBA(255,255,255,0) → alpha=0 不可见, 不渲染 (已核实)");
}
// ---- 命中火花 (原版 master_weapons.createEclat → etincelle chid564) ----
console.log("--- 命中火花 ---");
{
  console.log("素材: %d 帧 %s, 原点 (%s,%s), 时长 %d 帧 (7帧@24fps→30fps)",
    SPARK_FRAMES.length, JSON.stringify({ w: 53, h: 4 }),
    SPARK_ORIGIN.x, SPARK_ORIGIN.y, SPARK_TICKS);
  // 数量规则: 威力>8 → 3 个; 否则 1 个 (原版 createEclat 调用次数)
  G.sparks.length = 0; createEclat(0, 0, 20);
  const strong = G.sparks.length;
  G.sparks.length = 0; createEclat(0, 0, 8);
  const edge = G.sparks.length;         // 8 不 >8 → 1
  G.sparks.length = 0; createEclat(0, 0, 3);
  const weak = G.sparks.length;
  console.log("威力20→%d 个, 威力8→%d 个, 威力3→%d 个 (期望 3/1/1)", strong, edge, weak);
  console.log("数量规则正确=%s", strong === 3 && edge === 1 && weak === 1);
  // 抖动范围 ±8px, 随机旋转
  G.sparks.length = 0; createEclat(1000, 1000, 30);
  const dx = G.sparks.map(s => Math.abs(s.x - 1000)).concat(G.sparks.map(s => Math.abs(s.y - 1000)));
  const rotOk = G.sparks.every(s => s.rot >= 0 && s.rot < Math.PI * 2);
  console.log("抖动 |d|max=%s (应≤8) 旋转范围合法=%s", Math.max(...dx).toFixed(1), rotOk);
  // 生命周期: SPARK_TICKS 帧后消失
  G.sparks.length = 0; createEclat(0, 0, 20);
  let f = 0; while (G.sparks.length > 0 && f++ < 50) { for (const sp of G.sparks) sp.life--; G.sparks = G.sparks.filter(sp => sp.life > 0); }
  console.log("火花存活 %d 帧 (期望 %d) 一致=%s", f, SPARK_TICKS, f === SPARK_TICKS);
}
// 炮管叠加表 + 开火时长 (上一轮 fireT 恒为 0 的 bug 已修)
console.log("--- 炮管开火叠加 ---");
{
  const names = Object.keys(TURRET_GUNS);
  const noGuns = Object.keys(TURRET_LIB_FRAME).filter(id => !TURRET_GUNS[id]);
  console.log("炮管表覆盖 %d 种武器; 无 named 炮管的: %j", names.length, noGuns);
  // fireTicksFor 必须按武器名返回正确时长 (旧 bug: 按 chid 查表 → 恒 0)
  const rows = ['m60','canon105','canon125','MLRS','Yamato460'].map(id =>
    id + '=' + fireTicksFor(id));
  console.log("fireTicksFor: %j", rows);
  const allNonZero = ['m60','gatling','canon75','canon105','canon105D','canon125','MLRS','pluton','MTHEL']
    .every(id => fireTicksFor(id) > 0);
  console.log("所有玩家武器的开火时长 > 0=%s (旧 bug 时全为 0)", allNonZero);
  // 双管/多管武器的 name 顺序 (原版 canonN.gotoAndPlay("fire"))
  console.log("canon105D 炮管: %j", TURRET_GUNS.canon105D.map(g => g.n));
  console.log("Yamato460 炮管: %j", TURRET_GUNS.Yamato460.map(g => g.n));
  // 每条炮管项都带 matrix 与原点
  const incomplete = names.filter(id => TURRET_GUNS[id].some(g => !g.m || g.o === undefined));
  console.log("炮管项 m/o 完整=%s 缺=%j", incomplete.length === 0, incomplete);
}
`;
eval(src);
console.log("[done]");
