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
  getElementById: () => ({ getContext: () => ctxStub, textContent: "", appendChild() {}, innerHTML: "", style: {} }),
  createElement: () => ({ onclick: null, classList: {}, style: {}, getContext: () => ctxStub, width: 0, height: 0, appendChild() {} }),
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
eval(src);
console.log("[done]");
