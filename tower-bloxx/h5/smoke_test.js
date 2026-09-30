// 无头冒烟测试: 校验 H5 资产完整性 (node smoke_test.js)
const fs = require('fs');
const path = require('path');

let fail = 0;
const check = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + msg); if (!cond) fail++; };

const h5 = __dirname;
for (const f of ['index.html', 'game.js', 'js/three.module.js', 'js/loaders/GLTFLoader.js',
                 'js/utils/BufferGeometryUtils.js', 'assets/scene.glb', 'assets/image_12.png'])
  check(fs.existsSync(path.join(h5, f)), `存在 ${f}`);

// GLB 结构校验
const d = fs.readFileSync(path.join(h5, 'assets/scene.glb'));
check(d.readUInt32LE(0) === 0x46546C67, 'GLB magic');
const jsonLen = d.readUInt32LE(12);
const g = JSON.parse(d.slice(20, 20 + jsonLen).toString());
check(g.meshes.length === 19, `19 个网格 (实际 ${g.meshes.length})`);
check(g.images.length === 17, `17 张内嵌原版贴图 (实际 ${g.images.length})`);
const binStart = 28 + jsonLen;
const pngOk = g.images.every(im => {
  const bv = g.bufferViews[im.bufferView];
  return d.slice(binStart + bv.byteOffset, binStart + bv.byteOffset + 4).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47]));
});
check(pngOk, '全部内嵌贴图为合法 PNG');
check(g.meshes.every(m => m.primitives.every(p =>
  p.attributes.POSITION !== undefined && p.attributes.TEXCOORD_0 !== undefined)), '全部网格带 UV');
const accOk = g.accessors.every(a => {
  const bv = g.bufferViews[a.bufferView];
  return binstartSafe(bv);
  function binstartSafe(b) { return b.byteOffset + b.byteLength <= g.buffers[0].byteLength; }
});
check(accOk, 'accessor 越界检查');
// 玩法常量对号 (Const.as)
const src = fs.readFileSync(path.join(h5, 'game.js'), 'utf8');
// 加载顺序: restoreModel() 必须在 const G 声明之后 (防 TDZ 崩溃, 第20轮教训)
{
  const gi = src.indexOf('const G = {'), ri = src.indexOf('restoreModel();');
  check(gi >= 0 && ri > gi, 'restoreModel() 调用在 const G 声明之后');
}
check(/const CRANE_DUR = 2600/.test(src), '摆钩周期 CRANE_DUR=2600 (Const.as)');
check(/const BLOCK_H = 64/.test(src), '积木高 BLOCK_H=64 (Const.as)');
check(/const NUM_TRIES = 3/.test(src), '3 条命 NUM_TRIES=3 (Const.as)');
// J2ME 中断续档 (T48-6, House.g:443/h:618/i:828/j:1003)
check(/const RS_KEYS = \{ quick: 'twrblx_quickRS', city: 'twrblx_cityRS' \}/.test(src), '中断续档 RS_KEYS (quickModeRS/cityModeRS)');
check(/function saveTowerRS/.test(src) && /function applyTowerRS/.test(src), '中断续档 save/apply 函数');
check(/saveTowerRS\(\);/.test(src), 'btnExit 写中断档 (House.d:317)');
check(/applyTowerRS\(rs\)/.test(src), '进入塔模式恢复中断档 (House.h:618/j:1003)');
// 惊慌人群 + 落地角标 (N+60, House.t:2098/h:3390)
check(/function panicPeople/.test(src), '惊慌人群 t:2098 (抛飞+走缘)');
check(/function landFxSpawn/.test(src), '落地角标 h:3390 (白30/橙缩200/帧闪600)');
check(/id37\.png/.test(src), 'r0id37 星形帧资产引用');
// HTML 引用的本地资源必须存在 (防 404 类事故, fx28帧前科)
{
  const html = fs.readFileSync(path.join(h5, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["'](\.\/[^"']+)["']/g)].map(m => m[1]);
  const missing = refs.filter(r => !fs.existsSync(path.join(h5, r)));
  check(missing.length === 0, 'index.html 引用的资源文件都存在' + (missing.length ? ' 缺: ' + missing.join(',') : ''));
}
check(/sm_unlockedTrophyTowerType: d\.sm_unlockedTrophyTowerType == null \? -1/.test(src)
  && /tipFlags: d\.tipFlags && !Array\.isArray\(d\.tipFlags\)/.test(src),
  'restoreModel 旧存档字段全兜底 (T34 存档兼容)');

// DOM id 存在性: game.js 引用的 id 必须在 index.html (防 stub 掩盖的 null 崩, 第42轮教训)
{
  const html = fs.readFileSync(path.join(h5, 'index.html'), 'utf8');
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const refs = new Set([...src.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]));
  for (const m of src.matchAll(/\bb\('(m[A-Za-z]+)',/g)) refs.add(m[1]); // bindMenu 辅助
  refs.delete('hsName');                                            // 动态 innerHTML, 打开时才存在
  const missing = [...refs].filter(id => !ids.has(id));
  check(missing.length === 0, 'game.js 引用的 DOM id 都存在于 index.html' + (missing.length ? ' 缺: ' + missing.join(',') : ''));
}
process.exit(fail ? 1 : 0);
