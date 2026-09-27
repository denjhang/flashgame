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
// ---- Su37 空袭流程 (按钮→选边→点击落点→投弹→冷却) ----
src += `
G.frame = 0;
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
console.log("阴影: %d 单位映射, alpha=%s offset=%s, 缺映射 %j",
  Object.keys(UNIT_SHADOW).length, SHADOW_ALPHA, SHADOW_OFFSET,
  Object.keys(UNIT_BMP).filter(k => k !== 'tigre' && !UNIT_SHADOW[k]));
`;
eval(src);
console.log("[done]");
