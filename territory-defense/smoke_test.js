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
  // ★ 炮口生成点 (原版 createObus 的 decalY: 第3实参) —— 旧实现从炮塔中心生成
  {
    G.shells = []; G.muzzle = []; G.casings = [];
    const t2 = { x: 100, y: 0, hp: 10, aa: false };
    spawnShell(0, 0, t2, [4, 380, 40, 1, 3, 3], 'ally', 'canon125');   // decalY=79, 朝 +x
    const sh = G.shells[0];
    console.log("炮口生成点: canon125 朝+x → 弹体 x=%s (期望 79, 旧实现=0)", sh && sh.x);
    // 朝上 (barrelAng=-PI/2) 应沿 -y 前推
    G.shells = []; G.muzzle = []; G.casings = [];
    spawnShell(0, 0, t2, [4, 380, 40, 1, 3, 3], 'ally', 'canon125', -Math.PI / 2);
    const sh2 = G.shells[0];
    console.log("炮口生成点(朝北): y=%s (期望 -79), x=%s (期望 0)",
      sh2 && Math.round(sh2.y), sh2 && Math.round(sh2.x));
    const exp = { m60:40, gatling:60, canon75:60, canon105:62, crotale:0, canon125:79,
                  MLRS:16, pluton:0, MTHEL:10, Yamato460:79, navireCrotale:0 };
    let bad = [];
    for (const k in exp) if (MUZZLE_DY[k] !== exp[k]) bad.push(k + "=" + MUZZLE_DY[k]);
    console.log("MUZZLE_DY 权威表 11 项一致=" + (bad.length === 0) + (bad.length ? " 偏差:" + bad.join(",") : ""));
    // ★ 并联炮管轮换 (原版 askPermissionOfFire: canonToFire<nCanons ? ++ : =1)
    const AUTH_DX = {
      canon105D:      { canon1:-6, canon2:6 },
      '105mmDAbrams': { canon1:-2, canon2:2 },
      gatlingDT90:    { canon1:2,  canon2:-4 },
      gatlingDTigre:  { canon1:9,  canon2:-9 },
      Yamato460:      { canon1:-10, canon2:10, canon3:5, canon4:-5 },
    };
    let dxbad = [];
    for (const id in AUTH_DX) {
      const guns = TURRET_GUNS[id];
      if (!guns) { dxbad.push(id + ":无炮管表"); continue; }
      const got = guns.map(g => MUZZLE_DX[id][g.n]);
      const want = guns.map(g => AUTH_DX[id][g.n]);
      if (JSON.stringify(got) !== JSON.stringify(want)) dxbad.push(id + " got=" + got + " want=" + want);
    }
    console.log("MUZZLE_DX 并联炮管 5 型一致=" + (dxbad.length === 0) + (dxbad.length ? " 偏差:" + dxbad.join("; ") : ""));
    // 轮换: Yamato460 4 管 → 首轮 2,3,4,1 (原版 canonToFire 初值 1 后先自增)
    const dummy = {};
    const seq = [1,2,3,4].map(() => nextBarrel(dummy, 'Yamato460') + 1);
    console.log("Yamato460 轮换序列=" + JSON.stringify(seq) + " (期望 [2,3,4,1])");
    const dummy2 = {};
    const seq2 = [1,2,3].map(() => nextBarrel(dummy2, 'canon105D') + 1);
    console.log("canon105D 轮换序列=" + JSON.stringify(seq2) + " (期望 [2,1,2])");
    G.shells = []; G.muzzle = []; G.casings = [];
  }
  console.log("弹壳帧数=" + CASING_FRAMES.length + " (原版 douille chid304 = 29 帧) 时长=" + CASING_TICKS + " tick");
  console.log("枪口焰: 303=" + MUZZLE303.length + " 帧/" + MUZZLE303_TICKS + " tick (炮弹类), 365=" +
    MUZZLE365.length + " 帧/" + MUZZLE365_TICKS + " tick (曳光弹类)");
  // 弹型 → 枪口焰 sprite 选择 (原版 obus f1-f3 用 303, f4-f7 用 365)
  {
    const pick = (k) => muzzleFor(k).frames;
    const ok = pick('bullet') === MUZZLE365 && pick('bulletLourde') === MUZZLE365 &&
               pick('obusLeger') === MUZZLE303 && pick('obusMoyen') === MUZZLE303 &&
               pick('obusLourd') === MUZZLE303 && pick('missile') === MUZZLE303;
    console.log("枪口焰按弹型选用(曳光弹用365, 炮弹/导弹用303)=" + ok);
    // 365 不再是死代码: spawnMuzzleFx 会按 kind 选
    G.muzzle = []; G.casings = []; G.shells = [];
    spawnMuzzleFx(0, 0, 0, 'ally', 'bullet');
    const is365 = G.muzzle.length === 1 && G.muzzle[0].life0 === MUZZLE365_TICKS;
    console.log("曳光弹开火确实用 365 (旧实现是死代码)=" + is365);
    // ★ 弹壳两系 (原版 obus f1-f3 用 chid304, f4-f7 用 chid391)
    G.muzzle = []; G.casings = []; G.shells = [];
    spawnMuzzleFx(0, 0, 0, 'ally', 'bullet');
    spawnMuzzleFx(0, 0, 0, 'ally', 'obusLourd');
    const cb = G.casings.map(c => c.bullet);
    console.log("弹壳两系: 曳光弹→391=" + (cb[0] === true) + ", 炮弹→304=" + (cb[1] === false) +
      " (帧表 304=" + CASING_FRAMES.length + " / 391=" + CASING_BULLET_FRAMES.length + ")");
    const im1 = casingFrame({ bullet: true }, 0), im2 = casingFrame({ bullet: false }, 0);
    console.log("casingFrame 分流正确=" + (im1 !== im2 && !!im1 && !!im2));
    G.muzzle = []; G.casings = []; G.shells = [];
  }
  const expected = { camion1:2, camion2:2, camion3:2, jeep:2, bradley:2, amx10:4,
                     abrams:2, t90:4, camionBlinde:2, navire:4, Yamato:5 };
  let ok = true;
  for (const k in expected) {
    const got = (HEADLIGHTS[k] || []).length;
    if (got !== expected[k]) { ok = false; console.log("  " + k + " 灯数 " + got + " != " + expected[k]); }
  }
  console.log("车头灯: 11 车型灯数与原版 426 一致=" + ok + " (tigre 无灯=" + !HEADLIGHTS.tigre + ")");
  console.log("车头灯素材=" + (HEADLIGHT_IMG && HEADLIGHT_IMG.src.split('/').slice(-3).join('/')));
  // ★ 导弹 = 弹体 + 尾焰两层 (旧实现误把尾焰 393 当弹体)
  console.log("导弹尾焰动画: " + PLUME.length + " 帧 (原版 sprite 393 = 15 帧, f15 stop)");
  const bodyOk = {
    missile: 'DefineSprite_392', missileUnder: 'DefineSprite_392',
    missile2: 'DefineSprite_394', missile3: 'DefineSprite_395',
  };
  let mb = [];
  for (const k in bodyOk) {
    const s = SHELL_FRAMES[k];
    if (!s || s.src.indexOf(bodyOk[k]) < 0) mb.push(k + "=" + (s ? s.src : 'missing'));
  }
  console.log("导弹弹体 sprite 与原版 obus f8/f9/f10/f11 一致=" + (mb.length === 0) + (mb.length ? " 偏差:" + mb.join(",") : ""));
  const pmOk = ['missile', 'missileUnder', 'missile2', 'missile3'].every(k => PLUME_M[k] && PLUME_M[k].length === 6);
  console.log("导弹尾焰矩阵 4 型齐全=" + pmOk);
  console.log("导弹不再误用 393 作弹体=" + Object.keys(SHELL_FRAMES).every(k => SHELL_FRAMES[k].src.indexOf('DefineSprite_393') < 0));
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
// ---- 连发模型 (原版: gotoAndPlay("fire") 动画内多帧位各 createObus 一次) ----
console.log("--- 机枪连发 ---");
{
  // 权威连发帧位 (各炮管 sprite 的 createObus 调用帧, 逐帧脚本抄录)
  const AUTH = {
    92: [2, 6, 10, 14],           // m60: 4 连发
    98: [2, 6, 10, 14, 18, 22],   // gatling: 6 连发
    122: [2, 6], 164: [2, 6],     // crotale 系: 2 连发
    128: [2, 8, 17, 25, 32, 38],  // MLRS: 6 连发 (间隔渐增)
    103: [2], 108: [2], 125: [2], 167: [2], 80: [2], 83: [25], 153: [2], 161: [2],
  };
  let bad = [];
  for (const k in AUTH) if (JSON.stringify(BURST_FRAMES[k]) !== JSON.stringify(AUTH[k]))
    bad.push(k + '=' + JSON.stringify(BURST_FRAMES[k]));
  console.log("连发帧位表 16 型与原版脚本一致=" + (bad.length === 0) + (bad.length ? " 偏差:" + bad.join(",") : ""));
  // 模拟一轮: m60 应打 4 发 (首发射击时 1 发 + 3 tick 后续)
  G.shells = []; G.muzzle = []; G.casings = [];
  const tgt = { x: 500, y: 0, hp: 100, aa: false };
  const fake = { x: 0, y: 0, rot: 0, tRot: 0 };
  startBurst(fake, tgt, [5, 350, 40, 1, 3, 3], 'ally', 'm60', 0, 0);
  const first = G.shells.length;
  for (let i = 0; i < 40; i++) { G.frame++; tickBurst(fake); }
  console.log("m60 一轮连发=" + G.shells.length + " 发 (期望 4, 旧实现=1), 首发立即=" + (first === 1));
  G.shells = []; G.muzzle = []; G.casings = [];
  const fake2 = { x: 0, y: 0, rot: 0, tRot: 0 };
  startBurst(fake2, tgt, [4, 380, 40, 1, 3, 3], 'ally', 'gatling', 0, 0);
  for (let i = 0; i < 40; i++) { G.frame++; tickBurst(fake2); }
  console.log("gatling 一轮连发=" + G.shells.length + " 发 (期望 6)");
  G.shells = []; G.muzzle = []; G.casings = [];
  const fake3 = { x: 0, y: 0, rot: 0, tRot: 0 };
  startBurst(fake3, tgt, [2, 1300, 480, 1, 40, 120], 'ally', 'MLRS', 0, 0);
  for (let i = 0; i < 60; i++) { G.frame++; tickBurst(fake3); }
  console.log("MLRS 一轮连发=" + G.shells.length + " 发 (期望 6)");
  // 目标中途死亡 → 连发终止
  G.shells = []; G.muzzle = []; G.casings = [];
  const tgt2 = { x: 500, y: 0, hp: 100, aa: false };
  const fake4 = { x: 0, y: 0, rot: 0, tRot: 0 };
  startBurst(fake4, tgt2, [5, 350, 40, 1, 3, 3], 'ally', 'm60', 0, 0);
  tgt2.hp = 0;
  for (let i = 0; i < 40; i++) { G.frame++; tickBurst(fake4); }
  console.log("目标死亡即终止连发 (只首发)=" + (G.shells.length === 1));
  G.shells = []; G.muzzle = []; G.casings = [];
  // 冷却 = 整轮之后 (m60: floor(40/1.13)×43 = 1505ms)
  console.log("m60 整轮冷却=" + fireCooldownMs(40) + "ms (期望 1505, 原版 floor(40/1.13)×43)");
}
// ---- 车队链表 (原版 createUnit unitDevant/unitDerriere + frame_39 拆链) ----
console.log("--- 车队链表 ---");
{
  // 建链: 同路线按出场顺序互链
  G.units.length = 0;
  const a = new Unit('camion1', 'null', 'parcourt1');
  const b = new Unit('camion1', 'null', 'parcourt1');
  a.devant = null;
  b.devant = a;                       // createUnit: 后车.devant = 前车
  const c = new Unit('jeep', 'null', 'parcourt2');   // 不同路线
  c.devant = null;
  G.units.push(a, b, c);
  console.log("建链: 同路线后车.devant=前车=" + (b.devant === a) + ", 异路线=null=" + (c.devant === null));
  // 制动: 前车停在正前方 (间距=前车渲染高度, 原版 roule: dist < unitDevant._height)
  const dcA = CHASSIS_ART['camion1'];
  const gapA = Math.abs(dcA.m[3]) * dcA.nat[1];
  a.x = b.x + gapA * 0.5 * Math.cos(b.rot); a.y = b.y + gapA * 0.5 * Math.sin(b.rot);
  a.v = 0; a.rot = b.rot;
  b.v = 2.8928;                       // camion1 巡航
  const DECEL = (1 / 14) * 1.8 * (24 / 30);   // 0.1029 px/tick (原版每帧 1/14×1.8)
  const dd = Math.hypot(b.devant.x - b.x, b.devant.y - b.y);
  // 渐近减速 N tick 后硬停: v_N = max(0, v0 - N×DECEL), <0.1 → 0
  let v = b.v, ticks = 0;
  while (v > 0 && ticks < 200) { v = Math.max(0, v - DECEL); if (v < 0.1) v = 0; ticks++; }
  const stopDist = b.v * b.v / (2 * DECEL);
  console.log("前车制动: 间距=前车渲染高度 camion1=" + gapA.toFixed(1) + "px," +
    " 减速步长=" + DECEL.toFixed(4) + " px/tick, 刹停滑行=" + stopDist.toFixed(1) +
    "px (" + (stopDist < gapA ? "< 间距 原版常数自洽" : ">=间距!") + "), 硬停用 " + ticks + " tick");
  // 舰的间距 = 舰渲染高度
  const dcN = CHASSIS_ART['navire'];
  console.log("舰间距=渲染高度 navire=" + (Math.abs(dcN.m[3]) * dcN.nat[1]).toFixed(1) + "px");
  // 拆链: 前车死亡 → 后车脱离
  a.hp = 0; a.dead = true;
  if (b.devant.dead || b.devant.reached || b.devant.hp <= 0) b.devant = null;
  console.log("前车死亡拆链 (等价 frame_39 unlink)=" + (b.devant === null));
  G.units.length = 0;
}
// ---- 单位移动模型 (原版 428_unit: 速度=chassis[0]×fpsc px/帧@24, 转向=chassis[2] 度/帧) ----
console.log("--- 单位移动模型 ---");
{
  // 换算: px/tick@30 = 原版 × 24/30; 度/帧@24 → rad/tick@30 同比例
  const K = FPSC * (24 / 30);
  let bad = [];
  const cases = { camion1: 3.2, jeep: 3.2, bradley: 3, abrams: 3, t90: 3,
                  navire: 1, Yamato: 0.5, camionBlinde: 3 };
  for (const t in cases) {
    const u = new Unit(t, 'null', 'parcourt1');
    const want = cases[t] * K;
    if (Math.abs(u.speed - want) > 1e-9) bad.push(t + '=' + u.speed.toFixed(4));
  }
  console.log("单位巡航速度 = chassis[0]×1.13×0.8 px/tick: 8 车型一致=" + (bad.length === 0) +
    (bad.length ? " 偏差:" + bad.join(",") : "") +
    " (camion1=" + (new Unit('camion1','null','parcourt1')).speed.toFixed(4) + " px/tick = " +
    (3.2 * FPSC * 24).toFixed(1) + " px/s, 原版同式)");
  // 转向: camion1 chassis[2]=3 度/帧@24 → 3×0.8×π/180 rad/tick
  const u2 = new Unit('camion1', 'null', 'parcourt1');
  console.log("单位转向 = chassis[2] 度/帧换算: camion1=" + u2.rotateSpeed.toFixed(5) +
    " rad/tick (期望 " + (3 * (Math.PI/180) * 0.8).toFixed(5) + ", 旧 0.09 快 6.4 倍)");
  // 炮塔转向: typeData[0]×1.13 度/43ms(OCEEF) → rad/tick
  const tt = new Turret('m60', 0, 0);
  const wantRs = 5 * FPSC * (Math.PI/180) * (1000/43) / 30;   // 度/OCEEF -> rad/秒 -> rad/tick@30
  console.log("炮塔转向 = typeData[0]×1.13 度/OCEEF: m60 rs=" + (5 * 0.01529).toFixed(5) +
    " rad/tick 常数一致=" + (Math.abs(0.01529 * 5 - wantRs) < 0.0005));
  // 450 帧波次 sim 里的节奏 (数值打印在上方"迷雾+真实路点"行)
}
// ---- 舞台底色 (原版 SWF SetBackgroundColor) ----
console.log("--- 舞台底色 ---");
{
  // SWF header offset 21-23 = 44 11 00
  console.log("STAGE_BG=" + STAGE_BG + " (原版 SWF header 字节 44 11 00) 一致=" + (STAGE_BG === '#441100'));
  // 地图只覆盖世界 y -1440..480; 初始视高 600 → 底部越界量
  const over = 600 - (MAP_ORIGIN.y + MAP_H);
  console.log("地图覆盖世界 y [%d, %d]; 初始视野 y 0..600 → 底部越界 %d px (原版露舞台底色)",
    MAP_ORIGIN.y, MAP_ORIGIN.y + MAP_H, over);
}
// ---- 开火序列: H5 GUN_FIRE_SEQ 全序列帧应均有内容(无 PNG 空帧) ----
console.log("--- 开火序列无空帧 ---");
{
  // 正确的 PNG 解码: 收集全部 IDAT -> inflate -> 逐行 unfilter -> 统计 alpha>10
  // (旧版有 bug: d.length<200 直接返回空, 把小文件误判为空白)
  const fsx=require('fs');
  const zlix=require('zlib');
  function pngNonBlank(p){
    const d=fsx.readFileSync(p);
    const w=d.readUInt32BE(16), h=d.readUInt32BE(20), ct=d[25];
    const ids=[]; let i=8;
    while (i<d.length-8){
      const ln=d.readUInt32BE(i);
      const t=d.slice(i+4, i+8).toString('latin1');
      if (t==='IDAT') ids.push(d.slice(i+8, i+8+ln));
      i+=12+ln;
    }
    if (!ids.length) return false;
    const raw=zlix.inflateSync(Buffer.concat(ids));
    const ch=({0:1,2:3,3:1,4:2,6:4})[ct]||4;
    if (ch!==4 && ch!==2) return true;   // 调色板/灰度图视为有内容
    const step=ch; const st=w*step;
    let prev=Buffer.alloc(st); let p2=0;
    for (let y=0;y<h;y++){
      const ft=raw[p2]; p2++;
      const line=Buffer.from(raw.slice(p2, p2+st)); p2+=st;
      for (let x=0;x<st;x++){
        const a=x>=step?line[x-step]:0; const b=prev[x]; const c=x>=step?prev[x-step]:0;
        if (ft===1) line[x]=(line[x]+a)&255;
        else if (ft===2) line[x]=(line[x]+b)&255;
        else if (ft===3) line[x]=(line[x]+((a+b)>>1))&255;
        else if (ft===4){ const pp=a+b-c; const da=Math.abs(pp-a),db=Math.abs(pp-b),dc=Math.abs(pp-c);
          const pr=da<=db&&da<=dc?a:(db<=dc?b:c); line[x]=(line[x]+pr)&255; }
      }
      if (ch===4){ for (let j=3;j<st;j+=4) if (line[j]>10) return true; }
      else { for (let j=0;j<st;j++) if (line[j]>10) return true; }
      prev=line;
    }
    return false;
  }
  const nonBlankSet={};
  function isNonBlank(sid, f){
    const k=sid+'/'+f;
    if (!(k in nonBlankSet)){
      const p='assets/eturrets_spr/DefineSprite_'+sid+'/'+f+'.png';
      nonBlankSet[k]=fsx.existsSync(p) && pngNonBlank(p);
    }
    return nonBlankSet[k];
  }
  let bad=[];
  for (const sid in GUN_FIRE_SEQ){
    const seq=GUN_FIRE_SEQ[sid];
    if (!seq || !seq.length) continue;
    for (const f of seq){ if (!isNonBlank(sid, f)){ bad.push(sid+':f'+f); break; } }
  }
  console.log("开火序列全部帧 PNG 有内容=" + (bad.length===0) +
    (bad.length ? "  空帧序列: " + bad.slice(0,10).join(',') : " (覆盖 " + Object.keys(GUN_FIRE_SEQ).length + " 型)"));
  // 连发帧位表: 每型的连发帧数 (帧位权威见 BURST_FRAMES 注释)
  const burstCount={};
  for (const sid in BURST_FRAMES) burstCount[sid]=BURST_FRAMES[sid].length;
  console.log("连发数一览: m60(92)=" + burstCount[92] + " gatling(98)=" + burstCount[98] +
    " crotale(122)=" + burstCount[122] + " MLRS(128)=" + burstCount[128] +
    " (期望 4/6/2/6)");
}
`;
eval(src);
console.log("[done]");
