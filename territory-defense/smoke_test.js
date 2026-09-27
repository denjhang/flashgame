// H5 逻辑冒烟测试 (无头运行)
const fs = require("fs");

// 万能链式 stub: 任何属性调用返回自身 (支持 addColorStop 等链式)
const chainProxy = new Proxy(function () {}, {
  get(t, p) {
    if (p === Symbol.toPrimitive) return () => 0;
    return chainProxy;
  },
  apply() { return chainProxy; },
  set() { return true; },
});
const ctxStub = chainProxy;
global.__ctxStub = ctxStub;
global.document = {
  getElementById: () => ({ getContext: () => ctxStub, textContent: "", appendChild() {}, innerHTML: "", style: {} }),
  createElement: () => ({ onclick: null, classList: {}, style: {}, getContext: () => ctxStub, width: 0, height: 0 }),
  addEventListener() {},
};
global.window = { addEventListener() {} };

console.log("[start]");
let src = fs.readFileSync("./data.js", "utf-8") + "\n" + fs.readFileSync("./game.js", "utf-8");
const cvCode = 'const cv = { width: 960, height: 480, addEventListener() {}, getBoundingClientRect() { return { left: 0, top: 0 }; } };';
src = src.replace(/const cv = document\.getElementById\('cv'\);/, cvCode);
src = src.replace(/const ctx = cv\.getContext\('2d'\);/, "const ctx = global.__ctxStub;");
src = src.replace(/setInterval\(tick, 1000 \/ 30\);/, "");   // 无头: 去掉真定时器
const ids = ["m60","m60","gatling","canon75","crotale","canon105","gatling","m60","m60","gatling","canon105","canon105","radar","radar"];
src += "\nfor (const id of " + JSON.stringify(ids) + ") { G.turrets.push(new Turret(id, 430 + (Math.random()*200-100), 220 + (Math.random()*180-90))); }";
src += "\nfor (let i = 0; i < 2500; i++) tick();";
src += '\nconsole.log("迷雾模式12塔+2雷达 2500帧: 波次=%d 金钱=%d 残敌=%d 塔存=%d lost=%s won=%s", G.wave, G.euros, G.units.filter(u=>u.hp>0).length, G.turrets.filter(t=>t.hp>0).length, G.lost, G.won);';
src += '\nconst aaT = G.turrets.find(t => !t.aa); if (aaT) { G.euros += 5000; const ok = aaT.upgradeAA(); console.log("对空升级测试: 花费", aaT.aaUpgradeCost(), "结果", ok, "可对空", aaT.aa); }';
eval(src);
