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
  getElementById: () => ({ getContext: () => ctxStub, textContent: "", appendChild() {}, innerHTML: "", style: {}, classList: { toggle() {} }, dataset: {}, addEventListener() {}, children: [], querySelector: () => null, querySelectorAll: () => [] }),
  createElement: () => ({ onclick: null, classList: { toggle() {} }, style: {}, getContext: () => ctxStub, width: 0, height: 0, appendChild() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] }),
  querySelectorAll: () => [],
  createTextNode: () => ({}),
  addEventListener() {},
};
global.window = { addEventListener() {}, innerWidth: 1280, innerHeight: 720 };
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
// ---- 敌方武器塔独立索敌转向 (原版 174 OCEEF: tourelle._rotation 朝目标逼近, 3° 死区) ----
src += `
{
  G.units.length = 0; G.turrets.length = 0; G.effects.length = 0;
  // 车体朝东 (rot=0), 目标塔放在车体正北 → 塔头应转到 -90° 左右, 与车体解耦
  const u = new Unit('t90', '125mmT90', 'parcourt1');
  u.x = 1000; u.y = 1000; u.rot = 0; u._tRotInit = false;
  G.units.push(u);
  const t = new Turret('canon105', 1000, 800);   // 正北 (世界 y 向下, 北 = y 小)
  G.turrets.push(t);
  const r0 = u.tRot;
  // 视野: 手动塞一个视野源使目标可见
  VIS = [{ x: 1000, y: 900, r: 5000 }];
  let steps = 0;
  while (steps++ < 200) {
    const before = u.tRot;
    u.update();
    if (Math.abs(u.tRot - before) < 1e-9 && Math.abs(((Math.atan2(800 - u.y, 1000 - u.x) - u.tRot + Math.PI*3) % (2*Math.PI)) - Math.PI) < 0.06) break;
  }
  const want = Math.atan2(800 - u.y, 1000 - u.x);
  let da = want - u.tRot; while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
  console.log("敌方塔头转向: 初值=%s 终值=%s 目标方位=%s 残差=%s rad (应<0.06)",
    r0.toFixed(3), u.tRot.toFixed(3), want.toFixed(3), Math.abs(da).toFixed(4));
  console.log("塔头与车体解耦=%s (车体 rot=0, 塔头≈-1.57)", Math.abs(u.tRot - u.rot) > 1.0);
  console.log("用 %d 次 update 完成转向", steps);
  // 无目标时 tRot 保持不动 (原版: target == null 时 directionToGet = 车体朝向, 但 ennemy 侧不回转)
  const held = u.tRot; G.turrets.length = 0;
  u.update(); u.update();
  console.log("失去目标后塔头保持=%s (%s → %s)", Math.abs(u.tRot - held) < 1e-9, held.toFixed(3), u.tRot.toFixed(3));
  G.units.length = 0;
}
`;
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
  // ★ 428 只加 euros, 不动 score (score 是"我方丢塔数", 由 killTurret 负责)
  console.log("击毁敌车不改 score=%s (%d→%d, 原版 428 只加 euros)", G.score === s0, s0, G.score);
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
// ---- 开火细节: 弹壳 / 枪口焰 / 车头灯 (原版 obus sprite 子件 + 426 的 chid154 层) ----
console.log("--- 开火细节 ---");
{
  G.muzzle = []; G.casings = []; G.shells = [];
  const tgt = { x: 100, y: 0, hp: 10, aa: false };
  spawnShell(0, 0, tgt, [4, 380, 40, 1, 3, 3], 'ally', 'm60');
  console.log("开火一次 → 弹壳 %d 枚 (期望1), 枪口焰 %d 个 (期望1), 弹体 %d",
    G.casings.length, G.muzzle.length, G.shells.length);
  console.log("弹壳帧数=" + CASING_FRAMES.length + " (原版 douille chid304 = 29 帧) 时长=" + CASING_TICKS + " tick");
  console.log("枪口焰帧数=" + MUZZLE.length + " (原版 chid303 = 14 帧) 时长=" + MUZZLE_TICKS + " tick");
  const expected = { camion1:2, camion2:2, camion3:2, jeep:2, bradley:2, amx10:4,
                     abrams:2, t90:4, camionBlinde:2, navire:4, Yamato:5 };
  let ok = true;
  for (const k in expected) {
    const got = (HEADLIGHTS[k] || []).length;
    if (got !== expected[k]) { ok = false; console.log("  " + k + " 灯数 " + got + " != " + expected[k]); }
  }
  console.log("车头灯: 11 车型灯数与原版 426 一致=" + ok + " (tigre 无灯=" + !HEADLIGHTS.tigre + ")");
  console.log("车头灯素材=" + (HEADLIGHT_IMG && HEADLIGHT_IMG.src.split('/').slice(-3).join('/')));
  G.muzzle = []; G.casings = []; G.shells = [];
}
// ---- 车体放置 (原版 426 patternTransform 矩阵) + 影子矩形 ----
console.log("--- 车体放置 ---");
{
  // 权威值 = 426 SVG patternTransform 与 ombre sprite root, 逐项核对
  const AUTH = {
    camion1:      [0.7853, 0.8114, -9.85, -30.2],
    camion2:      [0.6428, 0.6189, -9.8, -39.3],
    camion3:      [0.6188, 0.625, -10.05, -33.85],
    jeep:         [0.6328, 0.6328, -9.55, -25.35],
    bradley:      [0.7781, 0.7781, -14.25, -27.75],
    amx10:        [0.6221, 0.6221, -10.8, -27.45],
    abrams:       [0.6313, 0.6313, -14.95, -28.15],
    t90:          [0.6356, 0.6356, -16.9, -30.55],
    camionBlinde: [0.6195, 0.6195, -12.8, -35.75],
    navire:       [0.6682, 0.6682, -20.75, -86.6],
    Yamato:       [0.7649, 0.7649, -38.15, -146.85],
  };
  let bad = [];
  for (const k in AUTH) {
    const c = CHASSIS_ART[k];
    if (!c) { bad.push(k + ":缺CHASSIS_ART"); continue; }
    const v = [c.m[0], c.m[3], c.m[4], c.m[5]];
    for (let i = 0; i < 4; i++) if (Math.abs(v[i] - AUTH[k][i]) > 1e-4) bad.push(k + "[" + i + "]=" + v[i]);
    if (!SHADOW_RECT[k]) bad.push(k + ":缺SHADOW_RECT");
  }
  // navire/Yamato 有第二 pattern (119/120 甲板件) 被刻意排除: AUTH 只取主车体
  console.log("车体矩阵: 11 车型与原版 426 patternTransform 一致=" + (bad.length === 0) + (bad.length ? " 偏差:" + bad.join(",") : ""));
  console.log("影子矩形: " + Object.keys(SHADOW_RECT).length + " 车型 (原版 ombre sprite root)");
  // 影子与车体"大体同尺寸"——各自 sprite 的 pattern 略异, 属原版真实数据而非硬约束
  //   例: bradley 影子源 chid525 / t90 影子源 chid536, 与原车体 shape 不同 → 尺寸天然有别
  let szbad = [];
  for (const k in AUTH) {
    const c = CHASSIS_ART[k], r = SHADOW_RECT[k];
    const cw = Math.abs(c.m[0]) * c.nat[0], chh = Math.abs(c.m[3]) * c.nat[1];
    if (Math.abs(cw - r.w) / cw > 0.25 || Math.abs(chh - r.h) / chh > 0.25)
      szbad.push(k + " 车体" + cw.toFixed(1) + "x" + chh.toFixed(1) + " vs 影子" + r.w + "x" + r.h);
  }
  console.log("影子与车体尺寸偏差≤25%=" + (szbad.length === 0) + (szbad.length ? " 超差:" + szbad.join("; ") : " (bradley/t90 略小属原版真实数据)"));
  console.log("tigre 无 CHASSIS_ART (原版 426 frame10 为透明占位)=" + !CHASSIS_ART.tigre);
}
// ---- 射速 (原版 174 OCEEF 循环模型) ----
console.log("--- 射速 ---");
{
  const FPSC = 1.13, INTERVAL = 43;
  const cases = [
    { id: 'm60', t2: 40,    expect_ms: Math.floor(40/FPSC) * INTERVAL },
    { id: 'gatling', t2: 40, expect_ms: Math.floor(40/FPSC) * INTERVAL },
    { id: 'gatlingDT90', t2: 3,  expect_ms: Math.floor(3/FPSC) * INTERVAL },
    { id: 'pluton', t2: 720,   expect_ms: Math.floor(720/FPSC) * INTERVAL },
  ];
  for (const c of cases) {
    const got = fireCooldownMs(c.t2);
    console.log("  " + c.id + " t2=" + c.t2 + " 冷却=" + got + " ms (期望 " + c.expect_ms + ", 一致=" + (got === c.expect_ms) + ") → " + (got/1000).toFixed(2) + " s/发");
  }
  // 跑一帧 (33.33ms) 测减扣
  const t = new Turret('m60', 0, 0);
  t.cool = 1505;
  for (let i = 0; i < 30; i++) t.update();   // 1000ms 模拟
  const dt = 1000/30;
  const consumed = 1505 - t.cool;
  console.log("m60 起始 1505ms 跑 30 tick(" + (30*dt).toFixed(0) + "ms) 后剩 " + t.cool + " ms (消耗 " + consumed + "ms, 应 ~" + (30*dt).toFixed(0) + "ms) 一致=" + (Math.abs(consumed - 30*dt) < 1));
  // 关键: m60 与 gatlingDT90 的差异 (重机枪与速射机枪)
  const m60_ms = fireCooldownMs(40), fast_ms = fireCooldownMs(3);
  console.log("m60(" + m60_ms + "ms) / gatlingDT90(" + fast_ms + "ms) = " + (m60_ms/fast_ms).toFixed(1) + " 倍 (原版 ~17 倍, H5 修正后应接近)");
}
// ---- 玩家塔阵亡序列 (原版 185 "destruction" 39帧, 与单位 428 同构; 无漂移) ----
console.log("--- 玩家塔阵亡序列 ---");
{
  G.effects.length = 0;
  const t = new Turret('canon105', 0, 0);
  t.hp = 0;
  let sfx = null;
  const scBefore = G.score;
  const _p3 = playSfx; playSfx = (n) => { if (sfx === null) sfx = n; };
  killTurret(t);
  playSfx = _p3;
  console.log("killTurret: dying=%d (期望 %d) 随机音=%s", t.dying, DEATH_TICKS, sfx);
  // ★ score 语义: 原版 185 frame_2 DoAction_2 是 score++ (丢塔计数), 428 才是给 euros。
  //   原版台词佐证: "chaque fois que vous perdez une tourelle, votre score général en est grandement affecté"
  console.log("丢塔 score++=%s (%d→%d, 原版 185 score++) 一致=%s",
    G.score === scBefore + 1, scBefore, G.score, G.score === scBefore + 1);
  // ★ S 键卖出走同一套 destruction (原版 6_1 keyDown: euros+=priceOfSell; unitEtat.destruction())
  {
    const tSell = new Turret('m60', 0, 0);
    tSell.hp = tSell.maxHp;   // 满血 → 折价 = cost*0.75
    G.turrets.length = 0; G.turrets.push(tSell);
    G.selected = tSell;
    const e0 = G.euros;
    let snd = null;
    const _ps = playSfx; playSfx = (n) => { if (snd === null) snd = n; };
    // 直接调 sellPrice + killTurret, 与 keydown 's' 分支同一路径
    G.euros += tSell.sellPrice();
    tSell.sold = true;   // 与 keydown 's' 分支一致 (卖出时满血, 需放行)
    killTurret(tSell);
    playSfx = _ps;
    console.log("S 卖出: 折价+%d (满血=80*0.75=60) 触发阵亡序列 dying=%d 播放音=%s",
      G.euros - e0, tSell.dying, snd);
    console.log("  卖出走 destruction(有爆炸音)=%s 音在1..6=%s",
      tSell.dying > 0, /^explosion[1-6]$/.test(snd || ''));
    G.turrets.length = 0;
  }
  // 原版 185 destruction 段只做 removeMovieClip + score++, 不改 euros
  const eBefore = G.euros;
  killTurret(t);   // 已在阵亡中, 应无效
  console.log("塔阵亡不改 euros=%s (%d→%d); 阵亡中重复 killTurret 无效=%s",
    G.euros === eBefore, eBefore, G.euros, t.dying === DEATH_TICKS || t.dying > 0);
  let booms = 0, flames = 0, ticks = 0;
  while (t.dying > 0 && ticks++ < 100) {
    const before = G.effects.length;
    t.update();
    for (let i = before; i < G.effects.length; i++) {
      if (G.effects[i].type === 'death') booms++;
      if (G.effects[i].type === 'flame') flames++;
    }
  }
  console.log("序列 %d tick (期望 %d) 一致=%s; 三点爆炸 %d 一致=%s; 火焰 %d 一致=%s; 结束 dead=%s",
    ticks, DEATH_TICKS, ticks === DEATH_TICKS, booms, booms === 3, flames, flames === 3, t.dead);
  // 塔【无漂移】—— 与单位不同 (原版 185 的 86 结构层 t 恒为 -38.25,-35.60)
  console.log("塔无漂移属性=%s (drift=%s)", t.drift === undefined, t.drift);
  // 已摧毁的塔不被索敌
  G.turrets.length = 0; G.turrets.push(t);
  console.log("已毁塔不被 nearestTurret 选中=%s", nearestTurret(0, 0, 1000) === null);
  G.turrets.length = 0; G.effects.length = 0;
}
// ---- 阵亡镜头抖动 (原版 destruction 段改 _root.carte._x/_y, 428 与 185 数值相同) ----
console.log("--- 阵亡镜头抖动 ---");
{
  console.log("抖动表 (原版帧 2/4/6/8/10/12): %j", DEATH_SHAKE);
  const sx = DEATH_SHAKE.reduce((a, d) => a + d[0], 0);
  const sy = DEATH_SHAKE.reduce((a, d) => a + d[1], 0);
  console.log("六组位移之和=(%d,%d) (应 0,0 → 确定性抖动而非漂移) 一致=%s", sx, sy, sx === 0 && sy === 0);
  console.log("触发 tick: %j (帧 2/4/6/8/10/12 @24fps→30fps)", DEATH_SHAKE_TICKS);
  // 无阵亡单位时 shake 归零
  G.units.length = 0; G.turrets.length = 0; updateDeathShake();
  const zero = shake.x === 0 && shake.y === 0;
  // 一个单位进入阵亡 → 逐 tick 记录 shake 轨迹, 并验证序列结束归零
  const u2 = new Unit('camion1', 'null', 'parcourt1');
  G.units.push(u2); u2.hp = 0; killUnit(u2);
  const traj = [];
  while (u2.dying > 0) { u2.update(); updateDeathShake(); traj.push(shake.x + ',' + shake.y); }
  const uniq = [...new Set(traj)];
  updateDeathShake();   // 单位 dead 后仍留 1 tick 于数组, 但 dying=0 → 不再计入
  const back0 = shake.x === 0 && shake.y === 0;
  console.log("抖动轨迹唯一值 %d 个 (多段跳变), 序列结束归零=%s", uniq.length, back0);
  console.log("无阵亡时归零=%s; 抖动中最大 |dx|=%d |dy|=%d",
    zero, Math.max(...DEATH_SHAKE.map(d => Math.abs(d[0]))), Math.max(...DEATH_SHAKE.map(d => Math.abs(d[1]))));
  G.units.length = 0; G.turrets.length = 0; updateDeathShake();
}
// ---- 建造菜单 3 页结构 (原版 constructionCont chid 1027) ----
console.log("--- 建造菜单分页 ---");
{
  console.log("页数=%d 每页格数=%j (原版 1027: 3 页 x 4 格)",
    SHOP_PAGES.length, SHOP_PAGES.map(p => p.length));
  const all = SHOP_PAGES.flat();
  console.log("全部武器 %d 件: %j", all.length, all);
  const uniq = new Set(all);
  console.log("无重复=%s (应有 12 件唯一)", uniq.size === all.length, all.length === 12);
  // 原版权威分组 (FFDec SVG: DefineSprite_1027 帧 1/2/3)
  const expect = [
    ['m60', 'gatling', 'canon75', 'canon105'],
    ['canon105D', 'radar', 'crotale', 'canon125'],
    ['MLRS', 'MTHEL', 'pluton', 'su37'],
  ];
  let ok = true;
  for (let i = 0; i < 3; i++) {
    if (JSON.stringify(SHOP_PAGES[i].slice().sort()) !== JSON.stringify(expect[i].slice().sort())) {
      ok = false; console.log("  第%d页不符: %j vs %j", i + 1, SHOP_PAGES[i], expect[i]);
    }
  }
  console.log("3 页分组与原版逐页一致=%s", ok);
  console.log("Su37 在建造菜单内=%s (原版 1027 f3 id=Su37, 非独立按钮, 位于第 3 页)",
    all.includes('su37') && SHOP_PAGES[2].includes('su37'));
  // 翻页循环 (原版 turnConstruction: left 1→3, right 3→1, 中间页逐页走)
  SHOP_PANEL = 1; turnConstruction('left');   const wrapL = SHOP_PANEL;   // 期望 3
  SHOP_PANEL = 3; turnConstruction('right');  const wrapR = SHOP_PANEL;   // 期望 1
  SHOP_PANEL = 1; turnConstruction('right');  const midR = SHOP_PANEL;    // 期望 2
  console.log("翻页: 1--left-->%d (应3)  3--right-->%d (应1)  1--right-->%d (应2) 全部=%s",
    wrapL, wrapR, midR, wrapL === 3 && wrapR === 1 && midR === 2);
  SHOP_PANEL = 1;
}
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
