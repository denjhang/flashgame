// 静态校验 + Node DOM 桩流程测试（不改浏览器，不改游戏逻辑本身）
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

let failures = 0;
const fail = (msg) => { failures++; console.log('  [FAIL]', msg); };
const pass = (msg) => console.log('  [ok]', msg);

// ---------- 1. 静态引用校验 ----------
console.log('== 1. 静态引用校验 ==');
const idRefs = new Set();
for (const m of js.matchAll(/el\("([^"]+)"\)/g)) idRefs.add(m[1]);
for (const m of js.matchAll(/getElementById\("([^"]+)"\)/g)) idRefs.add(m[1]);
// 拼接式 id 前缀
const dynamicPrefixes = [];
for (const m of js.matchAll(/el\("f" \+ (\w+)\)/g)) dynamicPrefixes.push(m[1]);

const htmlIds = new Set();
for (const m of html.matchAll(/id="([^"]+)"/g)) htmlIds.add(m[1]);

for (const id of idRefs) {
  if (!htmlIds.has(id)) fail(`main.js 引用的 id="${id}" 在 index.html 中不存在`);
}
pass(`el()/getElementById 引用 ${idRefs.size} 个 id 已核对`);

// 页面帧 f1/f2/f3/f4/f5/f20/f60/f61/f62
const navTargets = new Set();
for (const m of html.matchAll(/data-nav="(\d+)"/g)) navTargets.add(m[1]);
for (const n of navTargets) {
  if (!htmlIds.has('f' + n)) fail(`data-nav="${n}" 指向的 id="f${n}" 不存在`);
}
pass(`data-nav 目标 ${[...navTargets].join(',')} 已核对`);

// 资源文件存在性
const assetRefs = new Set();
for (const m of html.matchAll(/(?:src)="(assets\/[^"]+)"/g)) assetRefs.add(m[1]);
for (const m of js.matchAll(/"(assets\/[^"]+)"/g)) assetRefs.add(m[1]);
for (const a of assetRefs) {
  if (!fs.existsSync(path.join(__dirname, a))) fail(`资源缺失: ${a}`);
}
pass(`资源引用 ${assetRefs.size} 个已核对（手绘卡牌必须齐全）`);
for (const need of ['assets/jianke.jpg','assets/sheshou.jpg','assets/luck.jpg','assets/defend.jpg','assets/kan.jpg','assets/shejian.jpg']) {
  if (!assetRefs.has(need)) fail(`手绘卡牌 ${need} 未被引用`);
}


// ---------- 1.5 真实HTML按钮属性核对（防"按钮丢data-nav"回归） ----------
console.log('== 1.5 真实HTML按钮核对 ==');
// 从 index.html 提取所有 class 含 btn 的元素标签
const btnTags = [...html.matchAll(/<div\s+class="([^"]*btn[^"]*)"[^>]*>/g)].map(m => m[0]);
let navBtnCount = 0;
for (const tag of btnTags) {
  const hasNav = /data-nav="/.test(tag);
  const idM = tag.match(/id="([^"]+)"/);
  const label = idM ? idM[1] : tag.slice(0, 60);
  if (hasNav) { navBtnCount++; continue; }
  // 无 data-nav 的按钮白名单: 出招(自带监听) / 选招卡(动态) / 上一招·下一招(已由选招卡替代则不应存在)
  if (/id="(出招_btn|上一招_btn|下一招_btn)"/.test(tag)) continue;
  fail(`按钮缺 data-nav 属性: ${label}`);
}
pass(`带 data-nav 的按钮共 ${navBtnCount} 个`);
// 进入战斗_btn 必须可导航到 62
if (!/<div[^>]*id="进入战斗_btn"[^>]*data-nav="62"/.test(html)) fail('进入战斗_btn 必须带 data-nav="62"');
else pass('进入战斗_btn → 帧62 ✓');


// ---------- 1.6 资料页详情结构校验 ----------
console.log('== 1.6 资料页详情结构 ==');
// 每个资料页必须有: 网格卡牌 + 详情面板(图/名/耗/攻/防/述/效)
const pages = [
  { body: html.slice(html.indexOf('id="f4"'), html.indexOf('id="f5"')), sfx: '' },
  { body: html.slice(html.indexOf('id="f5"'), html.indexOf('id="f20"')), sfx: '2' },
];
for (const { body, sfx } of pages) {
  const cards = (body.match(/class="mp-card"/g) || []).length;
  if (cards < 8) fail(`资料页卡牌应≥8张, 实际 ${cards}`);
  const need = ['详情图'+sfx, '详情名'+sfx, '详情耗'+sfx, '详情攻'+sfx, '详情防'+sfx, '详情述'+sfx, '详情效'+sfx];
  for (const id of need) {
    if (!body.includes('id="' + id + '"')) fail(`详情面板缺字段 id="${id}"`);
  }
}
pass('两页详情面板字段齐全(图/名/耗/攻/防/述/效)');
// main.js: 每条资料表必须带 特效 字段
const tbl = js.slice(js.indexOf('const 招式资料'), js.indexOf('const 招式图'));
const rows = (tbl.match(/\{[^{}]*\}/g) || []).filter(r => r.includes('耗:'));
const noEffect = rows.filter(r => !r.includes('特效:'));
if (noEffect.length) fail('资料表缺特效字段: ' + noEffect.map(r => r.slice(1, 12)).join('; '));
else pass(`资料表 ${rows.length} 条全部带特效字段`);

// ---------- 1.7 屏幕结构与可见性校验(防div嵌套错位) ----------
console.log('== 1.7 屏幕结构校验 ==');
// 用注释行分段, 逐屏 div 配平(经 python 独立验证的算法)
const marks = [];
{
  const re = /<!-- ===== (F\d+)/g;
  let m;
  while ((m = re.exec(html))) marks.push([m.index, m[1]]);
}
marks.push([html.indexOf('</div></div>'), 'EOF']);
let balFail = 0;
for (let i = 0; i < marks.length - 1; i++) {
  const seg = html.slice(marks[i][0], marks[i+1][0]);
  const bal = (seg.match(/<div\b/g) || []).length - (seg.match(/<\/div>/g) || []).length;
  if (bal !== 0) { fail(`${marks[i][1]} 段 div 配平差 ${bal}`); balFail++; }
}
if (!balFail) pass('各屏段 div 配平正常(无嵌套吞并)');

// ---------- 2. DOM 桩 ----------

console.log('== 2. Node DOM 桩流程测试 ==');
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    children: [], attrs: {}, _listeners: {},
    textContent: '', innerHTML: '',
    get className() { return [...this.classList._s].join(' '); },
    set className(v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); },
    style: {},
    get dataset() {
      const attrs = this.attrs;
      return new Proxy({}, { get: (_, k) => attrs['data-' + String(k).replace(/[A-Z]/g, c => '-' + c.toLowerCase())] });
    },
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, on) { on ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); },
    },
    setAttribute(k, v) { this.attrs[k] = v; if (k === 'id') this.id = v; },
    getAttribute(k) { return this.attrs[k] ?? null; },
    appendChild(c) { this.children.push(c); c.parentElement = this; return c; },
    remove() { if (this.parentElement) { const i = this.parentElement.children.indexOf(this); if (i >= 0) this.parentElement.children.splice(i, 1); } },
    addEventListener(t, f) { (this._listeners[t] = this._listeners[t] || []).push(f); },
    click() {
      // 模拟冒泡: 自身→祖先, e.target.closest 沿真实祖先链
      const node_target = this;
      const target = {
        closest(sel) {
          let n = node_target;
          while (n) {
            if (matchSel(n, sel)) return n;
            n = n.parentElement;
          }
          return null;
        },
      };
      let node = this;
      while (node) {
        (node._listeners.click || []).forEach(f => f({ target }));
        node = node.parentElement;
      }
    },
    querySelector(sel) { return this._query(sel)[0] || null; },
    querySelectorAll(sel) { return this._query(sel); },
    _query(sel) {
      const out = [];
      const walk = (n) => { n.children.forEach(c => { matchSel(c, sel) && out.push(c); walk(c); }); };
      walk(this);
      return out;
    },
  };
  return el;
}
function matchSel(el, sel) {
  // 支持形如 "#f62 .battle-mid" 的后代选择器（校验器使用）
  if (sel.includes(' ')) {
    const parts = sel.trim().split(/\s+/);
    if (parts.length === 2 && matchSel(el, parts[1])) {
      let p = el.parentElement;
      while (p) { if (matchSel(p, parts[0])) return true; p = p.parentElement; }
    }
    return false;
  }
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList._s.has(sel.slice(1));
  const m = sel.match(/^\[data-nav="(\d+)"\]$/);
  if (m) return el.attrs && el.attrs['data-nav'] === m[1];
  if (sel === '[data-nav]') return el.attrs && el.attrs['data-nav'] !== undefined;
  return false;
}

// 构建文档树（从 index.html 抽 id 结构的最小模拟）
const documentStub = makeEl('#document');
// 手工建立 index.html 中出现的关键节点树
const ids = [...htmlIds];
const nodes = {};
for (const id of ids) { const n = makeEl('div'); n.id = id; nodes[id] = n; }
// 层级（按 index.html 实际结构）
const tree = {
  '#document': ['f1','f2','f3','f4','f5','f20','f60','f61','f62'],
  'f1': ['开始游戏不存在占位'], // f1 内的 data-nav 按钮单独建
};
for (const f of ['f1','f2','f3','f4','f5','f20','f60','f61','f62']) { nodes[f].classList._s.add('screen'); documentStub.appendChild(nodes[f]); }
// f1 按钮
function addBtn(parentId, nav, extraId) {
  const b = makeEl('div'); b.attrs['data-nav'] = String(nav); b.classList._s.add('btn');
  if (extraId) { b.id = extraId; nodes[extraId] = b; }
  nodes[parentId].appendChild(b); return b;
}
addBtn('f1', 61); addBtn('f1', 3); addBtn('f1', 4); addBtn('f1', 2); addBtn('f1', 20); addBtn('f1', 60);
addBtn('f2', 1); addBtn('f3', 1); addBtn('f4', 5); addBtn('f4', 1); addBtn('f5', 4); addBtn('f5', 1);
addBtn('f20', 1); addBtn('f60', 1);
// 从真实 html 读取进入战斗按钮的 nav（防手搭失真）
const enterNavM = html.match(/id="进入战斗_btn"[^>]*data-nav="(\d+)"/);
addBtn('f61', enterNavM ? Number(enterNavM[1]) : 62, '进入战斗_btn');
addBtn('f61', 1); // 返回
// 选角卡
const jk = makeEl('div'); jk.id = '剑客_CharacterSelect'; nodes['f61'].appendChild(jk); nodes['剑客_CharacterSelect'] = jk;
const ss = makeEl('div'); ss.id = '射手_CharacterSelect'; nodes['f61'].appendChild(ss); nodes['射手_CharacterSelect'] = ss;
for (const id of ['玩家_character','AI_character']) {
  const im = makeEl('img'); im.id = id; nodes['f61'].appendChild(im); nodes[id] = im;
}
// f62（按 index.html 战斗页结构: 选招mc含img与名, 上一招/下一招/出招按钮）
addBtn('f62', 61); // 返回选角
for (const bid of ['上一招_btn','下一招_btn','出招_btn']) {
  const b = makeEl('div'); b.id = bid; b.classList._s.add('fbtn'); nodes['f62'].appendChild(b); nodes[bid] = b;
}
for (const mid of ['用户选招mc','AI选招mc']) {
  const m = makeEl('div'); m.id = mid; nodes['f62'].appendChild(m); nodes[mid] = m;
  const img = makeEl('img'); img.id = mid === '用户选招mc' ? '用户选招图' : 'AI选招图'; m.appendChild(img); nodes[img.id] = img;
  const nm = makeEl('div'); nm.id = mid === '用户选招mc' ? '用户选招名' : 'AI选招名'; m.appendChild(nm); nodes[nm.id] = nm;
}

documentStub.getElementById = (id) => {
  if (!nodes[id]) console.log('  [DEBUG] getElementById 未命中:', JSON.stringify(id));
  return nodes[id] || null;
};
documentStub.querySelector = (sel) => documentStub._query(sel)[0] || null;
documentStub.querySelectorAll = (sel) => documentStub._query(sel);
documentStub.addEventListener = (t, f) => { (documentStub._listeners[t] = documentStub._listeners[t] || []).push(f); };
documentStub.createElement = (tag) => makeEl(tag);

// class 查询需覆盖 document 根
const _origQuery = documentStub._query;
documentStub._query = function(sel) {
  const out = [];
  const walk = (n) => { n.children.forEach(c => { matchSel(c, sel) && out.push(c); walk(c); }); };
  walk(this);
  return out;
};

const sandbox = {
  document: documentStub,
  console,
  Math,
  String, Number, Array, Object,
  setInterval: () => 0,
  setTimeout: () => 0,
};
vm.createContext(sandbox);
try {
  vm.runInContext(js + ';this.__x = { gotoAndStop: gotoAndStop, P: 玩家_1, A: AI_1, J: 剑客_招式数组, S: 射手_招式数组 };', sandbox, { filename: 'main.js' });
  pass('main.js 在 DOM 桩下加载无异常');
} catch (e) {
  fail('main.js 加载异常: ' + e.stack);
}

// 流程驱动
const $ = (id) => nodes[id];
function activeScreen() {
  return documentStub.querySelectorAll('.screen').filter(s => s.classList._s.has('active')).map(s => s.id)[0] || '(无)';
}
function mustActive(id, step) {
  const a = activeScreen();
  if (a !== id) fail(`步骤[${step}] 期望活跃页 ${id}，实际 ${a}`);
  else pass(`步骤[${step}] 活跃页 ${id}`);
}

nodes['f1'].classList._s.add('active'); // index.html 中 f1 带 class="screen active"
mustActive('f1', '启动=第1帧');
$('f1').querySelector('[data-nav="61"]').click();
mustActive('f61', '开始游戏→帧61');
$('剑客_CharacterSelect').click();
if (nodes['进入战斗_btn'].style.display !== '') fail('选角后 进入战斗_btn 未显示');
else pass('选角后 进入战斗_btn 已显示');
// 玩家状态对号（玩家_class.as: 生命5/元气0）
const P = sandbox.__x.P, A = sandbox.__x.A;
if (P.生命值 !== 5 || P.元气数 !== 0) fail('玩家初始生命/元气与原版不符');
if (A.生命值 !== 15) fail('AI 初始生命应为15');
if (P.已选的角色名 !== '剑客') fail('玩家应已选剑客，实际 ' + P.已选的角色名);
if (P.已选定的角色的招式数组 !== sandbox.__x.J) fail('玩家招式数组未绑定剑客数组');
if (A.已选的角色名 !== '射手' && A.已选的角色名 !== '剑客') fail('AI 未随机选角');
pass('选角状态对号完毕 (AI=' + A.已选的角色名 + ')');

$('进入战斗_btn').click();
mustActive('f62', '进入战斗→帧62');
// 招式卡为单张翻页式: 初始帧4(砍), 上一招×2 → 帧2(运气)
if (nodes['用户选招图'] && nodes['用户选招图'].src === '') fail('选招卡图未初始化');
else pass('选招卡初始化(帧4=攻击招) ✓');
$('上一招_btn').click(); $('上一招_btn').click();
if (nodes['用户选招名'].textContent !== '运气') fail('翻页两帧应为运气，实际 ' + nodes['用户选招名'].textContent);
else pass('上一招×2 → 运气 ✓');
$('上一招_btn').click();
if (nodes['用户选招名'].textContent !== '砍' && nodes['用户选招名'].textContent !== '射箭') fail('帧2再上一招应循环到攻击招(帧1空帧弹回帧4), 实际 ' + nodes['用户选招名'].textContent);
else pass('上一招循环 wrap ✓(帧1脚本gotoAndStop(4))');
$('下一招_btn').click(); // 回帧2

// 回合1: 元气0 时选砍出招 → 仅提示, 无状态变化
$('下一招_btn').click(); $('下一招_btn').click(); // 帧4
$('出招_btn').click();
if (!nodes['用户消息框_txt'].textContent.includes('出招失败')) fail('砍(元气0)应提示出招失败');
else pass('元气不足提示语 ✓');
if (!nodes['AI消息框_txt'].textContent.includes('装傻')) fail('应显示调侃语');
else pass('调侃语 ✓');

// 回合2: 翻到运气攒气
$('上一招_btn').click(); $('上一招_btn').click();
$('出招_btn').click();
if (P.元气数 !== 1) fail('运气一次后元气应为1，实际 ' + P.元气数);
else pass('运气+1元气 ✓');
if (nodes['AI选招图'] && nodes['AI选招mc'].style.visibility !== 'visible') fail('AI招式卡出招后应显示');
else pass('AI招式卡联动 ✓');

// 后续: 运气→攻击 循环至分胜负
let guard = 0;
while (A.生命值 > 0 && P.生命值 > 0 && guard++ < 300) {
  // 当前帧2(运气): 出招攒气
  $('出招_btn').click();
  if (A.生命值 <= 0 || P.生命值 <= 0) break;
  $('下一招_btn').click(); $('下一招_btn').click();    // 帧4=攻击
  $('出招_btn').click();
  $('上一招_btn').click(); $('上一招_btn').click();    // 回帧2
}
if (A.生命值 <= 0 || P.生命值 <= 0) {
  const meTxt = nodes['用户消息框_txt'].textContent, aiTxt = nodes['AI消息框_txt'].textContent;
  pass(`战斗分出胜负 (guard=${guard}): 玩家${P.生命值} vs AI${A.生命值} | 我方框="${meTxt.replace(/\n/g,'/')}" AI框="${aiTxt.replace(/\n/g,'/')}"`);
  if (A.生命值 <= 0 && !aiTxt.includes('战斗失败')) fail('AI 死亡但 AI框未显示战斗失败');
  if (P.生命值 <= 0 && !meTxt.includes('战斗失败')) fail('玩家死亡但用户框未显示战斗失败');
} else fail('60回合内未分出胜负');

// 胜负后出招按钮隐藏
if (nodes['出招_btn'].style.display === 'none') pass('胜负分出后出招按钮已隐藏');

// ---------- 3. 遍历全部导航 ----------
console.log('== 3. 全导航遍历 ==');
for (const [id, nav] of Object.entries({ 从f2返回:1 })) {}
for (const n of [...navTargets].sort((a,b)=>a-b)) {
  // 找到任一指向 n 的按钮并点击
  const btn = documentStub.querySelectorAll('[data-nav]').find(b => b.attrs['data-nav'] === String(n));
  if (btn) { btn.click(); mustActive('f' + n, `导航→${n}`); }
}

console.log(failures === 0 ? '\n全部校验通过 ✓' : `\n共 ${failures} 处失败 ✗`);
process.exit(failures === 0 ? 0 : 1);
