// 静态布局检查: 解析 index.html 中所有绝对定位元素, 估算包围盒, 报告同屏重叠对
// 文本宽度估算: CJK 字符 ≈ 1×font-size, ASCII ≈ 0.55×font-size (SimSun/雅黑近似)
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// ---- 解析每个 screen 内的绝对定位元素 ----
const screens = {};
const screenRe = /<div class="screen[^"]*" id="(f\d+)">([\s\S]*?)\n  <\/div>/g;
let m;
while ((m = screenRe.exec(html))) screens[m[1]] = m[2];

const elRe = /<(div|img)\s+([^>]*?)>/g;
const attr = (s, k) => { const r = s.match(new RegExp(k + '="([^"]*)"')); return r ? r[1] : null; };
const num = (s, k) => { const r = s.match(new RegExp(k + ':\\s*([\\d.]+)px')); return r ? parseFloat(r[1]) : null; };

function estTextW(text, fontSize) {
  let w = 0;
  for (const ch of text) w += /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch) ? fontSize : fontSize * 0.55;
  return w;
}

const boxes = {}; // screen -> [{id, x,y,w,h,tag}]
for (const [sid, body] of Object.entries(screens)) {
  const list = [];
  let em;
  while ((em = elRe.exec(body))) {
    const attrs = em[2];
    const style = attr(attrs, 'style') || '';
    const x = num(style, 'left'), y = num(style, 'top');
    const iw = num(style, 'width'), ih = num(style, 'height');
    if (x === null || y === null) continue; // 只查绝对定位
    const id = attr(attrs, 'id') || attr(attrs, 'src') || '(匿名)';
    let w = num(style, 'width'), h = num(style, 'height');
    if (w !== null && String(w).includes('%')) w = null;
    const cls = attr(attrs, 'class') || '';
    if (/card/.test(cls) && (attr(attrs,'id')||'').includes('character')) continue; // 容器内JS定位卡图不参与静态检测
    let fontSize = (style.match(/font-size:\s*(\d+)px/) || [])[1]
      || ({ 'fbtn|btn': 20 }[cls] || 15);
    fontSize = parseFloat(fontSize);
    const KNOWN = { 'pick-card': [123, 196], 'fbtn': [130, 26], 'selcard': [120, 191] };
    for (const [k, [kw, kh]] of Object.entries(KNOWN)) {
      if (new RegExp('(^|\s)' + k + '($|\s)').test(cls)) { w = w ?? kw; h = h ?? kh; }
    }
    if (w === null) {
      if (em[1] === 'img') { w = 130; h = h ?? 200; }
      else if (/fbtn|btn/.test(cls)) { w = 130; h = h ?? 38; }
      else {
        // 取元素文字(下一行文本), 估宽
        const after = body.slice(em.index);
        const txtM = after.match(/>([^<]*)</);
        const txt = txtM ? txtM[1].trim() : '';
        w = txt ? estTextW(txt, fontSize) : 100;
        h = h ?? fontSize * 1.4;
      }
    }
    if (h === null) h = 38;
    if (iw !== null) w = iw;
    if (ih !== null) h = ih;
    list.push({ id, x, y, w: +w, h: +h, tag: em[1] });
  }
  boxes[sid] = list;
}

// ---- 舞台边界检测 (480x800, DOMDocument.xml width/height) ----
let fails = 0;
const STAGE_W = 480, STAGE_H = 800;
for (const [sid, list] of Object.entries(boxes)) {
  for (const b of list) {
    if (b.x < 0 || b.y < 0 || b.x + b.w > STAGE_W || b.y + b.h > STAGE_H) {
      fails++;
      console.log(`[越界] ${sid}: "${b.id}"(${b.x},${b.y},${b.w}x${b.h}) 右/下边缘 = ${(b.x+b.w).toFixed(1)}/${(b.y+b.h).toFixed(1)} 超出 ${STAGE_W}x${STAGE_H}`);
    }
  }
}

// ---- 重叠检测 ----
for (const [sid, list] of Object.entries(boxes)) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 2 && oy > 2) { // 容差2px
      fails++;
      console.log(`[重叠] ${sid}: "${a.id}"(${a.x},${a.y},${a.w}x${a.h}) ∩ "${b.id}"(${b.x},${b.y},${b.w}x${b.h}) 重叠 ${ox.toFixed(0)}x${oy.toFixed(0)}px`);
    }
  }
  console.log(`${sid}: ${list.length} 个绝对定位元素`);
}
console.log(fails === 0 ? '\n布局检查通过 ✓ (估算模型, 文本宽度为近似值)' : `\n共 ${fails} 处重叠 ✗`);
process.exit(fails ? 1 : 0);
