# TCS 反混淆与资源还原进度

## 第 N+21 轮成果（2026-09-28, H5 领土防御·玩家塔阵亡序列，删除灰色色块占位 + 修 nearestTurret 索敌 bug）

**本轮修掉一处直接违反"不允许任何占位/近似/色块"硬性要求的实现：被摧毁的玩家塔此前
画成一个灰色 `#333` 方块。原版其实有完整的 39 帧阵亡序列。**

### 1. 【违规发现】H5 用灰色方块表示"塔已被摧毁"

`game.js` 渲染循环里：

```javascript
if (t.hp <= 0) { ctx.fillStyle = '#333'; ctx.fillRect(-10, -10, 20, 20); ctx.restore(); continue; }
```

这既是占位色块（违反纪律），也与原版行为不符。N+20 已经为**单位**（428）做了阵亡序列，
但**玩家塔**（185）当时没一起查 —— 本轮补上。

### 2. 原版 185 的 destruction 与 428 同构（逐字对照）

`deobf/scripts/DefineSprite_185_structure/frame_1/PlaceObject2_178_etat_26 onClipEvent(load)`：

```actionscript
function destruction() {
   removeMovieClip(_parent.ptRadar);
   removeMovieClip(_parent.etatJauge);   // 血条
   removeMovieClip(_parent.ombre);       // 阴影
   _parent.tourelle.play();
   _parent.gotoAndPlay("destruction");
}
```

与 428 的 `destruction()` **函数体逐字相同**。185 的 tag 序（`swf_dump.txt`）：
- 帧 2 = `FrameLabel (name: destruction)`，库共 **39 帧**（与 428 一致）
- 帧 2 移除 dpt31(repairLogo) 与 dpt1(86)，**重新放入** 86 与 178，再放 dpt31 的 chid6
- 帧 4 放 dpt33 的 chid6；帧 7 放 dpt35 的 chid6 —— **同样是帧 2/4/7 三点爆炸**
- 帧 39 `DoAction`：`removeMovieClip(this); stop();`

### 3. 【关键差异】塔【没有车体漂移】—— 86 结构层逐帧完全不变

逐帧 SVG 实测 185 的 destruction 段：
- `chid 86`（structureDeco）的 transform **恒定** `(-38.25, -35.60)`，39 帧全等
- 我把 86 那一层 def body 做了逐帧 **MD5**：`618a886623` —— **39 帧全部同一哈希**

结论：原版塔在阵亡期间**外观完全不变**，表现完全来自叠加的三处 explosion+flame；
这与单位 428（chassis 逐帧漂移 12px）不同。故 H5 塔阵亡时**继续正常绘制塔体**，
不引入任何变形。

### 4. H5 实现

- `Turret` 新增 `dying` / `dyingFired` / `dead`（与 `Unit` 同款字段）
- `Turret.update()`：`dying>0` 时**先于** `hp<=0` 判断进入阵亡分支 —— 在 0/2/5 tick
  各生成一对 `death`(chid279, 3 tick) + `flame`(chid637, 27 tick) 特效（±10px 抖动），
  **无漂移**；归零后 `dead = true`
- `killTurret(t)`：随机 `explosion1..6` 音；**不改 euros**（185 的 destruction 段无 euros 变更，
  与 428 给赏金不同 —— 已核实）
- 渲染：删除 `#333` 色块分支，照常画塔；阵亡中不画对空标记/磁场/血条
  （对应 `destruction()` 的三个 `removeMovieClip`）
- 主循环：`G.turrets = G.turrets.filter(t => !t.dead)`（对应帧 39 `removeMovieClip(this)`），
  并清空指向已毁塔的 `G.selected`

### 5. 【顺带修掉一个真实 bug】nearestTurret 不过滤已毁塔

```javascript
function nearestTurret(x, y, range) {
  for (const t of G.turrets) {                    // ← 原实现没有 hp 判断
```

敌方单位索敌时会把**已被摧毁的塔**当成目标，持续朝废墟开火。本轮加 `if (t.hp <= 0) continue;`。
（`Turret.update()` 自身有 `hp<=0` 早退，所以塔不会反击；但敌人这一侧此前是错的。）

### 6. 真机验证

- 冒烟测试新增断言全绿：
  ```
  killTurret: dying=31 (期望 31) 随机音=explosion1
  塔阵亡不改 euros=true (5732→5732); 阵亡中重复 killTurret 无效=true
  序列 31 tick 一致=true; 三点爆炸 3 一致=true; 火焰 3 一致=true; 结束 dead=true
  塔无漂移属性=true (drift=undefined)
  已毁塔不被 nearestTurret 选中=true
  ```
- 浏览器截图：活塔外观正常（canon105/crotale/radar 三座并排，与上一版无差别）；
  tick 4 时塔身叠加真实火光（不再是灰色方块）；序列结束后塔被移除、屏幕恢复干净
- **真实玩法闭环**：放一座 m60（hp=4）到 parcourt1 路线旁，让 t90 沿路开火打它 ——
  tick 46 进入 `dying` → tick 77 `dead` 且从 `G.turrets` 移除（**差 31 tick，与 DEATH_TICKS 一致**）

### 7. 本轮如实说明

- 185 的 destruction 段里同样有 `_root.carte._x/_y` 的镜头抖动（帧 2/4/8 DoAction，
  ±6~10px），与 N+20 记录的 428 情况相同，H5 未接入（相机模型不同），如实记录。
- 185 帧 2 的 DoAction 只做镜头抖动，**没有** 428 帧 2 那样的 `euros += prixRevient` +
  随机爆炸音。我用随机爆炸音是为了与 428 一致的表现；严格说 185 的摧毁音来源未在
  frame_2 找到（可能在其他帧的脚本里），如实记录此推断。
- `FrameLabel` 里 185 还有 `special`/`obusLeger`/… 等标签（那是 185 作为"砲塔+炮弹库"
  的多用途帧标签，与 destruction 无关），本轮未涉及。

## 第 N+20 轮成果（2026-09-28, H5 领土防御·补原版单位阵亡序列 destruction + markFlame 三点爆炸）

**本轮把 N+18 记录为"未做"的 markFlame 彻底查清并接入，过程中发现它牵出的是一个
比预期大得多的真实缺口：原版单位被击毁后并不立即消失，而是播一段 39 帧的阵亡序列。**

### 1. 【缺口发现】原版有 39 帧阵亡序列，H5 此前是"瞬间移除"

N+18 只查到 `markFlame` 是"命中时创建爆炸的定位件"，本轮把整条链读通：

`deobf/scripts/DefineSprite_428_unit/frame_1/PlaceObject2_178_etat_22`（unitEtat 的 load 脚本）：

```actionscript
function destruction() {
   removeMovieClip(_parent.ptRadar);
   removeMovieClip(_parent.etatJauge);       // 血条
   removeMovieClip(_parent.ombre);           // 阴影
   _parent.tourelle.play();
   _parent.gotoAndPlay("destruction");       // ← 跳到 destruction 帧标签
}
```

序列长度与内容（`swf_dump.txt` 中 428 的 tag 序 + 逐帧 SVG 导出）：
- 标签 `destruction` 在第 **2** 帧（`FrameLabel (name: destruction)`），库共 **39 帧**
- 帧 2/4/7 各放一个 `chid 6`（`nm: markFlame` / 无名）→ 其 load 脚本各调一次
  `master_weapons.createExplosion(车体 markFlame 世界坐标, prefID=4)`（帧 4/7 无第 3 参）
- 帧 39 的 `DoAction`：`master_units.removeUnits("E", this) + removeMovieClip(this)`
  —— **序列播完才真正移除**
- 帧 2 的 `DoAction_2`：`euros += prixRevient`（赏金）+ `master_sounds["explosion"+(1..6)].start()`
  —— **赏金在阵亡瞬间就结算，并随机播 6 种摧毁音之一**

车体姿态：逐帧 SVG 显示 chassis(426) 的 `ty` 从 `-155.05` 单调漂到 `-167.05`
（**共 12px**，沿车体纵轴向后），期间无旋转、无缩放、无透明度变化。

### 2. 【关键纠正】createExplosion 用的是 chid 279 + chid 637，不是命中爆型

`createExplosion`（`deobf/pcode/scripts/frame_6/PlaceObject2_6_335` 字节码）实际是：

```
Push 26000, r2; Add2 ; Push "explosion", r2; Add2 ; ... carte.attachMovie(...)
Push 28000, r2; Add2 ; Push "flame",     r2; Add2 ; ... carte.attachMovie(...)
... "explosion"+r2.gotoAndStop(prefID 或 random 1..3)
```

pseudo 把它写成 `attachMovie(26000+i, "explosion"+i, "explosion")` —— **参数序被写反**。
以 N+18 已独立验证的 etincelle 为标定（`attachMovie("etincelle"+i)` → chid **564**，
`exports.txt` 有权威导出名），可知**第 3 个参数才是链接名**，第 1 个是 depth：

| 函数 | 链接名 | chid | 帧数 | H5 素材 |
|---|---|---|---|---|
| `createExplosion` 爆炸 | `explosion` | **279** | 4 | `assets/explosion/1..4.png`（本轮核实 = 279 的 4 帧） |
| `createExplosion` 火焰 | `flame` | **637** | 34 | `assets/flame/1..34.png`（本轮导出） |
| `createEclat` 火花 | `etincelle` | 564 | 7 | `assets/spark/`（N+18 已接入） |

→ 我此前的阵亡爆炸误用了命中爆型（390 `small`）。本轮改用 **chid 279**（原生 210×217，
原版只设 `_x/_y` 不缩放）。

### 3. 【关键坑】flame 的黑色底 + `mix-blend-mode:lighten`

`chid 637` 的 FFDec PNG 导出**黑底不透明**（34 帧全部 alpha=255，角落像素 (0,0,0,255)）。
若直接 `source-over` 绘制会盖出一块黑方块。SVG 导出给出答案 —— 该 sprite 的子件带
`style="mix-blend-mode: lighten"`，即 Flash 的 **Layer/ADD 混合**，黑底因此不可见。

→ H5 用 `ctx.globalCompositeOperation = 'lighter'` 还原该混合。**实测修正前后对比：
修正前是黑方块（明显 bug），修正后是叠加火光。** 该 sprite 第 28 帧起自带 alpha 淡出，
第 34 帧全透明，并有 `this.removeMovieClip(); stop()`（`0x96 06 00 00 74 68 69 73 00 1c 25 07 00`）
—— 播完自删，与 H5 的 `DEATH_FLAME_TICKS = 27`（34帧@24fps→30fps）一致。

### 4. H5 实现

- `DEATH_TICKS = round(39×24/30) = 31`；`DEATH_BOOM_TICKS = [0,2,5]×24/30`（对应原版帧 2/4/7）
- `Unit` 新增 `dying`（剩余 tick）/ `dyingFired`（已触发爆炸数）/ `drift`
- `Unit.update()`：`dying>0` 时**先于** `hp<=0` 判断进入阵亡分支 —— 原地滞留、按进度漂移
  `DEATH_DRIFT=12`、在 0/2/5 tick 各生成一对 `death`(279, 3 tick) + `flame`(637, 27 tick) 特效
  （各带 ±10px 抖动），归零后 `dead = true`
- `killUnit(u)`：**赏金立即结算** + 随机 `explosion1..6` 音；带 `hp>0 || dead || dying>0` 守卫
- 渲染：阵亡中 **不画武器塔、不画阴影、不画血条**（对应 `destruction()` 里三个 `removeMovieClip`），
  车体沿 `rot` 反方向偏移 `drift`
- 波次/胜负判定改为等 `dead`（不再用 `hp<=0`），避免序列没播完就清场

### 5. 真机验证

- 冒烟测试新增断言全绿：
  ```
  killUnit: dying=31 (期望 31) 赏金+50 随机音=explosion6
  赏金在阵亡瞬间结算=true 随机爆炸音在1..6=true
  序列: 31 tick 一致=true
  车体爆炸 3 个 (原版帧2/4/7 共3个) 一致=true; 火焰叠层 3 个 一致=true
  漂移量=12.0 → 序列结束 dead=true
  阵亡中再 killUnit 不重复结算=true；活单位 killUnit 无效=true
  ```
- 浏览器逐帧截图：t0 车体无塔无影无血条 → t1/t4 火光叠加在车体上 → t12 三处爆炸齐现
  → t24 火光衰减 → t31 车体漂移到位
- **真实玩法闭环**（布 10 座 canon105 打 camion1）：tick 154 进入 `dying` → tick 185 `dead`
  （差 31 tick，与 `DEATH_TICKS` 一致），赏金 +50 到账

### 6. 本轮如实说明

- 原版 `explosion`(279) 是 **`gotoAndStop(prefID)`** —— 停在某一帧上，靠该帧内的嵌套子精灵
  自带动画。H5 没有这层嵌套，改为 4 帧快播后消失（`DEATH_BOOM_TICKS_LOCAL=3`）。
  视觉上等价，但严格说不是"停在某帧"，如实记录此近似。
- 帧 4/7 的调用没有第 3 参，原版会走 `random(1..3)` 分支；H5 未区分（都是 279 的 4 帧序列）。
- 原版 `destruction` 段每帧还有 `_root.carte._x/_y` 的镜头抖动（帧 6/8/10/12 的 DoAction，
  ±4~8px）。H5 未接入该镜头抖动（现有相机模型是自由滚动，不共享此语义），如实记录未做。
- `markFlame`(chid 6) 自身是 46×46 的实心黑方块，**不是可见美术**，只作定位锚点；
  真正可见的是它触发的 279+637。N+18 的"markFlame 未接入"至此结清。

## 第 N+19 轮成果（2026-09-28, H5 领土防御·补原版 Su37 瞄准区标记 zoneBombardement chid785）

**本轮补上 N+11 已记录"未做"的真实缺口：用原版真实 SWF 素材替换侧栏按钮触发后
的"瞄准圈 CSS 近似"。**

### 1. 【缺口发现】原版的 Su37 瞄准区标记是独立 sprite，H5 此前用 CSS 圆+十字+中文近似

N+11 已知原版有 `zoneBombardement`（chid 785, dpt 17, name="zoneBombardement"，
`deobf/data/dump_tree.json:956`），但**该 sprite 不在 ExportAssets 表中**（导出名表 `exports.txt`
最末 chid 568/637/639 后无 785），所以长期当作"内部引用"被忽略。
H5 此前用一段 CSS 代码画一个红色圆圈+十字+中文"点击目标投放炸弹"作近似。

### 2. FFDec 导出与画布原点（与 173/86 同一套方法论）

```
ffdec-cli -selectid 785 -format sprite:png -export sprite /tmp/_zbtest TCS.swf
ffdec-cli -selectid 785 -format sprite:svg -export sprite /tmp/_zb_svg TCS.swf
```

PNG 导出：1 帧，**154.3×154.3** 画布（4 个角准星 + 中心十字 + 半透明绿底 + "ready" 文本）。
SVG 导出权威解码：外层 transform `matrix(1,0,0,1, 77.15, 77.15)`（= 154.3/2 居中），子件:
- 779 = 153×153 半透明绿底（fill="#ff00ff" alpha 0.498, 4 角被 784 mask 遮住）
- 781 (sub-sprite 2.3034×) → 780 = 67×67 白色内框
- 782 = 文本 "ready" Courier New (5 字符)
- 784 = 4 角准星 + 中心十字 (101×101)

**画布原点**: `ZONE_ORIGIN = { x: -77.15, y: -77.15 }`（与 173/86 同一推导：sprite 中心在 (0,0)）

### 3. H5 接入

- `assets/zone/1.png`：154.3×154.3 半透明绿底 + 4 角准星 + 中心十字 + "ready" 文本
- `ZONE_IMG`、`ZONE_ORIGIN` 常量
- 替换原 `ctx.arc + 十字 + fillText('点击目标投放炸弹')` CSS 近似为 `ctx.drawImage(ZONE_IMG, ...)`
  （保留 CSS 回退分支以防资源加载失败）
- 生命周期：原版 `_visible = false` ↔ H5 `G.su37Aiming = false` —— 已在 `su37Launch` 内
  设置（H5 上一轮 N+3 已实现，未变）

### 4. 真机验证

- 资源：`assets/zone/1.png` 154.3×154.3（FFDec 导出）
- 注入 `G.unlocker.su37=true; su37Start() → G.su37Aiming=true, side=bas` 后
  强制 `draw()` + screenshot：**画面正中偏左可见绿色 4 角准星 + 中心十字**（与 785
  真实素材一致；CSS 红色圆圈已消失）
- 模拟点击 `su37Launch(G.mx,G.my)`：`G.su37Aiming true→false`，`SU37.plane=true`
  —— zone 消失，飞机从所选边生成
- 冒烟测试新增断言通过：
  ```
  瞄准区: img=assets/zone/1.png origin=(-77.15,-77.15) 154.3px (原版 785, FFDec 导出)
  瞄准区 785 资源已接入=true
  ```

### 5. 本轮如实说明

- **原版 zone 是 154.3px 见方**（中心 77px 半径），与 `SU37.IMPACT=260`（实际炸弹
  溅射半径）**不重合**：zone 标记的是"瞄准点附近的小区域提示"，而 `impact` 是
  实际伤害范围。CSS 近似错误地按 `IMPACT=260` 画了大圆，本轮按原版大小修正。
- 785 没有导出名（不在 ExportAssets 表），所以**代码里也没有字符串引用**，纯靠
  帧库的 `name="zoneBombardement"` + `PlaceObject2` 矩阵挂接到 834 主菜单 sprite。
  H5 沿用上一轮 `G.su37Aiming` 状态机即可，不需新字段。
- 本轮未做：markFlame 差异化（N+18 标记的剩余"如实未做"项）；
  8.8%/合成 alpha 平均差 8.5/255 等遗留量化误差（按之前看板如实保留）。

## 第 N+18 轮成果（2026-09-28, H5 领土防御·补原版命中火花特效 createEclat/etincelle）

**本轮补上一处此前完全缺失、且每场战斗都会大量出现的效果。**

### 1. 【缺口发现】原版"每次命中车辆"都有火花反馈，H5 只做击杀爆炸

此前 H5 只在**击杀**时播爆炸（`boomTyped`），命中但未击杀时**没有任何视觉反馈**。
逐行读 `deobf/pcode_as/frame_6__PlaceObject2_6_327`（命中循环）发现原版每次命中都有：

```actionscript
_ = unitsEnnemies[i].localToGlobal(unit);          // 单位位置
_ = unitsEnnemies[i].unitEtat.localToGlobal(etat); // 血条位置
createEclat(unit._y + (etat.y - unit.y)/4, unit._x + (etat.x - unit.x)/4);   // ← 第 1 个
if (r8 > 8) {                                       // r8 = 本帧伤害
  createEclat(...); createEclat(...);                // ← 再 2 个 (共 3 个)
}
```

定位点 = 单位位置 + (unitEtat 偏移)/4 —— 即**车体中心偏上**（`unitEtat` 在 428 内 t=(0,-60)）。

### 2. `createEclat` 与素材 etincelle（chid 564）

`master_weapons.createEclat`（`..._6_335` 第 40 行起）：

```actionscript
r3 = getIEclat();                                  // 循环 id 0..999
carte.attachMovie(27000 + r3, "etincelle"+r3);     // 27000 → chid 564
carte."etincelle"+r3._rotation = Math.random()*360;
carte."etincelle"+r3._x = X + (Math.random()*16 - 8);   // ±8px 抖动
carte."etincelle"+r3._y = Y + (Math.random()*16 - 8);
```

素材 `chid 564`（`exports.txt` 第 85 行 `ExportAssets (chid: 564, ex: etincelle)`）：
FFDec 导出 7 帧、53×4 画布，内容是**亮黄→白→灰的火花拖尾**（逐帧向左移动 = 飞散动画）。

**画布原点推导**（与炮管同一套方法论）：FFDec 的 SVG 导出给出该 placement 的内容变换
`matrix(1,0,0,1, 51.8, 2.3)`，即"火花发源点"在 sprite 局部 (0,0) → 画布左上角在局部
`(-51.8, -2.3)`；frame1 内容 bbox `x[50,52]` 中心 51 ≈ 51.8 交叉证实。

### 3. H5 实现

- `assets/spark/1..7.png`（7 帧）；`SPARK_FRAMES` / `SPARK_ORIGIN{(-51.8,-2.3)}`
  / `SPARK_TICKS = round(7/24*30) = 9`（SWF 24fps → H5 30fps）
- `spawnSpark(x,y)`：位置 ±8px 抖动、随机旋转 0–2π、寿命 SPARK_TICKS
- `createEclat(x,y,power)`：**1 个；power > 8 时再 2 个（共 3 个）** —— 严格照搬原版判断
- `shellHit()` 内接入：对**每个实际受损单位**调用一次 `createEclat(u.x, u.y-8, power)`
  （用 `Set` 去重，避免溅射三段对同一目标重复触发火花）
- `G.sparks` 状态 + tick 递减 + draw 渲染（随 zoom 缩放、绕火花起点旋转、迷雾中不绘制）

### 4. 真机验证

- 素材：7 帧全部加载（53×4）
- 数量规则：威力 20 → **3 个**；威力 8 → **1 个**（8 不 >8，边界正确）；威力 3 → **1 个**
- 抖动 |d|max = 6.9 ≤ 8；旋转范围合法；存活 **9 帧**后消失（与 SPARK_TICKS 一致）
- 实战 200 帧：2 次命中 → `maxConcurrent=3`，24 帧画面含火花，敌人 HP 正常下降
- 视觉截图确认：亮黄色火花粒子以随机角度散布在装甲车体上

### 5. 本轮如实说明

- 火力溅射（SPLIT 三段）会让同一单位在同一发炮弹内被扣血多次，但原版的 `createEclat`
  在**每次命中循环里只对每个单位触发一组**（源码中三次调用属于同一次命中、由伤害阈值决定），
  故 H5 用 `Set` 对受损单位去重后每组触发一次。此为对源码结构的解读，
  若后续发现原版对溅射边缘单位也各触发一组，需再调整——如实记录此判断。
- `unitEtat` 偏移我取 `-8px`（由 428 内 t=(0,-60)、scale y=2 推得的 (0,-30) 再按车体尺寸折中）。
  该值只影响火花在车体上的高低位置，不影响机制正确性；未做逐像素对齐。
- `markFlame`（chid 6）经核实是**车辆被击中时在其标记点创建爆炸**的定位辅助件
  （`_parent.markFlame.localToGlobal(...)` → `createExplosion`），与 `etincelle` 是同一命中链的
  两种表现；本轮接入的是更普遍的 etincelle，markFlame 的具体差异（仅 3 个 chassis 帧带脚本）
  留待后续核对，如实记录本轮未做。

## 第 N+17 轮成果（2026-09-28, H5 领土防御·修正 idle 自转模型：区分"整帧即自转件"与"叠加件"，消除重影）

**本轮修掉上一轮自己留下的未完成项：radar 的 8.8% 重影，降为 0。**

### 1. 【穷举】173 库全部 enterFrame 自转脚本（上一轮清单不完整）

上一轮我只 grep 到 3 处（f7/f20/f25），本轮穷举 `DefineSprite_173/` 下**全部**
`*onClipEvent(enterFrame)*` 脚本，得完整 5 条：

| 帧 | 武器 | depth | 子件 | 代码 |
|---|---|---|---|---|
| f7  | radar          | d1  | 115 | `_rotation += 2` |
| f8  | crotale        | d2  | 121 | `_rotation += 10`（上轮漏记，脚本在 `PlaceObject2_121_2`） |
| f13 | radarMobile    | d1  | 115 | `_rotation += 4` |
| f13 | radarMobile    | d4  | 115 | `_rotation -= 12` ← **反向** |
| f20 | crotaleAbrams  | d4  | 121 | `_rotation += 10` |
| f25 | navireCrotale  | d24 | 121 | `_rotation += 10` |

### 2. 【根因】上一轮重影的来源：没区分两类自转

上一轮我统一做成"整帧静态 + 叠加自转件"。但按 `turret_layout.json` 逐帧组成枚举发现，
**两类武器的整帧含义完全不同**：

- **A 类「整帧即自转件」**：该武器整帧**只由自转件构成**
  - `radar` f7 = `[115]`（唯一部件就是那个碟盘）
  - `radarMobile` f13 = `[115, 115]`（两个反向自转）
  → 整帧图**本身就是自转件**。此时再叠加一个自转件 = 同一物画两遍 ⇒ 重影。
  → 正确做法：**让整帧随自身自转**（radar），或**逐件各转各的**（radarMobile 两件反向）。
- **B 类「整帧含基座+自转件+炮管」**：`crotale` f8 / `crotaleAbrams` f20 / `navireCrotale` f25
  → 整帧里自转件被 FFDec 烘成静态姿态 ⇒ 叠加同位置自转件覆盖它（位置已验证一致）。

### 3. H5 实现

- `LIB_SPIN`（A 类，整帧自转）：`radar { chid:115, deg:2, t:[1.95,8.10] }`
  `drawLibSpin()` 绕 placement 的 `t` 旋转整帧。
- `RADARMOBILE_SPIN`（A 类特例）：两个 115 各按 `+4°` / `-12°` 独立自转，
  `drawRadarMobileSpin()` 逐件渲染（**不能**整帧旋转，否则两件无法反向）。
- `IDLE_SPIN`（B 类，叠加）：crotale 三型（chid 121）。
- `drawSpinDef()` 抽出为公共子件绘制函数；玩家塔与敌方单位两条渲染路径按 A/B 分派。
- 速率换算统一：原版 deg/帧 @SWF 24fps → H5 30fps（radar 2°→1.6°，crotale 10°→8.0°）。

### 4. 真机验证（本轮核心指标：重影消除）

- **0° 时整帧自转 ≡ 纯整帧贴图**：像素数 5970 完全相同，质心 (205.65, 274.39) 分毫不差
  → 重影 **0%**（上一轮为 8.8%）。
- 自转确实生效：雷达 4 个相位（0/9/18/27 帧）逐帧差异 7622 → 8162 → 9025 像素，天线平滑转动。
- 多塔同场景：radar/crotale/crotaleAbrams/navireCrotale/radarMobile 五处 f0 vs f40
  共 2650 像素变化，全部在动。
- 冒烟新增断言：A/B 两表 chid 与权威一致、m/o 完整、**两表无重叠**（radar 不得同时进两表，
  否则又变重复绘制）、速率换算正确。

### 5. 本轮如实说明

- 上一轮记录为"未做到干净抠除静态件、重影 8.8%、属取舍"——本轮查明那不是取舍问题，
  而是**模型错误**（radar 本不该叠加）。已按权威组成枚举修正，重影归零。
- `radarMobile` 的 `-= 12` 是从混淆脚本 `eval("u189u156")["\":a\x03"] -= 12;` 读出的
  运算符与数值（同帧另一件为 `+= 4`）；SWF 层面无法再交叉验证运算符语义，
  依据是 **A/B 两件必须有相反方向才符合"双碟反向扫描"的可见形态**，如实记录此推断。
- f26 Yamato460 等 9 件武器仍为纯静态（无自转脚本），未做额外处理。

## 第 N+16 轮成果（2026-09-28, H5 领土防御·补持续 idle 自转动画；底盘核实为不可见）

**本轮补上原版的"塔会自己动"效果，并推翻了自己一个中途的错误判断。**

### 1. 【新发现】原版塔有持续的 idle 自转（H5 此前完全没有）

扫描 `deobf/scripts/DefineSprite_173/` 全部 `onClipEvent(enterFrame)`，得两处持续旋转：

| 出处 | 子件 | 代码 | 含义 |
|---|---|---|---|
| `frame_7` (radar) | chid **115** | `this._rotation += 2;` | 雷达天线**慢速扫描** |
| `frame_20` (crotaleAbrams) | chid **121** | `this._rotation += 10;` | 导弹发射架**快速自转** |
| `frame_25` (navireCrotale) | chid **121** | `this._rotation += 10;` | 同上 |

另有 `DefineSprite_86/frame_1/PlaceObject3_54_1`：`this._rotation = Math.random()*360;`
（给塔底盘随机初向 —— 后证实该件不可见，见第 2 节）。

权威依据补充：SWF 字节解析确认 115/121 的 placement 均带 **HasClipActions=True**
（flags 0x0096）→ 它们是**独立 MovieClip**，各自跑自转脚本，非烘平的静态件。

H5 实现（`IDLE_SPIN` + `drawIdleSpin()`）：
- 表含 chid、`degPerSWFFrame`、placement 的 `scale` 与 `t`（取自 turret_layout.json，已逐一核对）
- 子件画布原点经反解校准：115 → (-11.07,-8.98)、121 → (-12.00,-15.25)
- 旋转速率按 SWF 24fps → H5 30fps 折算
- **修掉一个变换 bug**：原先写成 `translate(t) → scale(s) → drawImage(origin)`，
  这会把 origin 也乘一次 scale 导致错位；改为 `translate(t) → rotate → drawImage(origin*s, size*s)`
- 玩家塔与敌方单位两条渲染路径都已接入
- 真机验证：f0 与 f60 帧间 3246/19600 像素不同（雷达天线确实在转）；
  自转件局部 bbox x[-22.17,25.33] y[-9.17,24.67] 与权威期望 x0=-21.98 y0=-11.30 误差 <2px

### 2. 【自我纠错】塔底盘 shape53 经权威核实"不可见" —— 我中途一度误加回去

- 现象：86 库 12 帧**全部**含 `d1:54`（内嵌 shape53，bounds 40.8×40.8px，单条 evenodd 路径）。
  FFDec 的 shape PNG 导出该图**全透明**，但其 **SVG 导出给出 `fill="#ffffff"`（白色）**。
- 我据此一度判定"FFDec 漏导了白色圆盘基座"并光栅化补上 —— **这是错的**。
- 反证链：
  1. FFDec 导出的**父容器 185**（含 86+174+178+184 四层）全 39 帧**白色像素 = 0**
  2. 从 SWF 原始字节定型：shape53 是 **DefineShape3（RGBA 填充）**，唯一填充
     = 纯色 **RGBA(255,255,255,0)** → **alpha = 0，完全透明**
  3. SVG 导出**丢了 alpha 通道**才显示成白色 —— 这正是我误判的来源
- 结论：该 shape 是透明占位（疑为 hit-area 或历史遗留），**不产生任何可见像素**。
  H5 **不渲染**它（已回退，删除临时资产与代码），与 FFDec 的 185 导出结果一致。
- 教训：**颜色类素材不能只信 SVG/PNG 导出的 RGB，必须核 alpha**（尤其 DefineShape3+）。

### 3. 本轮如实说明

- 第 2 节的错误判断在代码注释与看板中**显式记录**（含反证与教训），不做掩盖；
  临时生成的光栅化资产 `assets/turretlib/base/` 已删除，仓库无残留。
- idle 自转件（115/121）**已被 FFDec 烘进 173 整帧**（实测 f7 碟盘区 623 像素与
  115 缩放后 100% 重合），故 H5 叠加自转件会覆盖该处静态姿态。
  两者位置一致（误差 <2px），观感即"天线在转"；zoom=1 下重影差异约 8.8% 像素。
  **如实记录**：未做到"从整帧中干净抠除静态件再叠自转件"，因为该碟盘与 173 其他
  部件像素相邻，抠除会伤及主体；当前方案位置正确、动态正确，是取舍结果。

> **⚠️ 上述 8.8% 重影问题已在第 N+17 轮解决** —— 不是"取舍"而是**模型错误**：
> `radar` 的整帧**只由自转件构成**（f7 = `[115]`），本就不该叠加，改为整帧自转后重影归零。
> 详见本轮（N+17）第 2 节。

## 第 N+15 轮成果（2026-09-28, H5 领土防御·纠正上轮误判：86 库是玩家塔结构层，恢复双层渲染）

**本轮推翻并修正了上一轮的一个错误结论。**

### 1. 【纠错】86 库不是"线框标记层"，而是玩家塔的结构底座层

上一轮我判定 86 库为"黑色线框标记层、不能用作外观"并整个弃用。**这个判断是错的**，
错在只看像素颜色统计（平均 RGB≈0）就下了结论，没有放大看内容、也没有查原版如何调用它。

权威反证（`deobf/scripts/DefineSprite_185_structure/frame_1/PlaceObject2_86_1 onClipEvent(load)`）：

```actionscript
var structure = _parent.structure;      // structure = 武器名 (m60/gatling/...)
this.gotoAndStop(structure);            // 86 库按【武器名】跳帧
```

- 86 库恰好 **11 帧**，标签 `m60, gatling, canon75, canon105, canon105D, radar, crotale,
  canon125, MLRS, pluton, MTHEL` —— 与 173 库的**前 11 个武器名完全同名**。
- 放大到白底逐帧看（本轮重做的检查）：**86 f6 = 完整雷达站结构**（天线杆+碟座+基座）、
  **86 f10 = 完整导弹发射结构**（上下横向基座+中央导轨+红蓝指示灯）、
  **86 f4 = X 形驻锄支架**。它们是真实的结构外观，只是配色偏黑灰（原版就是这种深色金属件）。

### 2. 原版结构：玩家塔 = 86 结构层 + 173 塔体层 双层

`DefineSprite_185_structure` 的显示列表（deobf/data/turret_layout.json）：

| depth | chid | 名称 | 作用 | 矩阵 |
|---|---|---|---|---|
| 1 | 86 | `structureDeco` | **结构底座层** | identity，**不随瞄准旋转** |
| 24 | 174 → 173 | `tourelle` | **炮塔/炮管层** | identity，**随 rot 旋转** |
| 26 | 178 | `unitEtat` | 血条 | — |
| 31 | 184 | `repairLogo` | 自动修理磁场 | — |

两层在 185 内**都是 identity 变换** → 共用同一武器局部坐标系，各自画布原点直接叠加即可。

### 3. 合成验证（离线像素级）

按上述规则合成，逐例确认严丝合缝：

- 86 f6(雷达支架) + 173 f7(碟盘) = **完整雷达站**
- 86 f4(X 形驻锄) + 173 f5(炮管) = **完整 105mm 炮塔**
- 86 f10(发射结构) + 173 f11(导弹本体) = **完整 pluton**

**86 库画布原点经 union 验证**：全帧 union = 76.49×76.49 ≈ FFDec 导出实测 76×76
→ 原点 **(-38.20, -35.55)**（与 173 库的 (-21.98, -76.30) 同属武器局部坐标系）。

### 4. H5 实现与 1:1 验证

- 新增 `TURRET_BASE_ORIGIN` / `TURRET_BASE_FRAME` / `turretBaseImg()`（86 库结构层）。
- 玩家塔渲染改为**先画 86 结构层（不旋转），再 save/rotate 画 173 塔体层 + 开火炮管叠加**。
  敌方单位容器 `unit(428)` 内含 `chassis(426) + tourelle(174)`，其炮塔同样走 173 库，
  无 86 结构层 —— 与 H5 现状一致。
- **1:1 像素对照**（决定性验证）：把浏览器画布中 canon105 塔周围 60×110 像素
  原样导出，与按原版规则离线合成的同尺寸图并排比对 —— **逐像素一致**
  （炮管 + X 形驻锄 + 底座完全重合）。

### 5. 本轮如实说明

- 上一轮的错误结论已在看板与代码注释中显式标注为"上轮误判"并给出反证，
  不做掩盖；冒烟测试的旧断言（"旧 86 库变量已删除"）已同步更正为新断言
  （"86 库 11 帧 = 玩家 11 种武器，双层齐全"）。
- 86 库只覆盖玩家 11 种武器；敌方 15 种武器（m60Brad/75mmBrad/…/Yamato460）没有对应的
  86 结构层，原版即是如此（敌方用 `unit(428)` 容器，无 structureDeco）。

## 第 N+14 轮成果（2026-09-28, H5 领土防御·炮塔外观库纠正 + 权威逐件矩阵 + 开火动画修复）

**本轮解决用户长期反馈的"炮塔/机枪用错资源"，并修掉一个开火动画恒不播放的真 bug。**

### 1. 【根因，N+15 已修正】86 库不是炮塔外观，而是黑色线框标记层

> **⚠️ 本节结论已被第 N+15 轮推翻，保留原文以记录判断过程。**
> 正确结论：86 库是**玩家塔的结构底座层**（structureDeco），必须与 173 塔体层叠加使用。
> 详见本轮末尾"第 N+15 轮成果"。

- 用 FFDec `-selectid 86 -format sprite:png` 导出全部 11 帧，逐帧统计：
  **平均 RGB≈0（纯黑描边），彩色像素占比 0%**；肉眼可见是箭头 / 十字 / 方框 / 叉等标记图形。
- ~~结论：`DefineSprite_86` 是原版用于画轮廓/参考线的辅助层，**不是武器外观**。~~
  **（错）** 漏查了 `DefineSprite_185_structure` 里 `this.gotoAndStop(structure)` 这行 ——
  86 库按武器名跳帧、是塔的结构层；放大看 f6/f10/f4 分别是完整的雷达站/发射架/驻锄。
- 真正的外观库是 **`DefineSprite_173`**（26 帧，帧标签=武器名，全部上色完整）。
  （此句仍正确，前半段修正为：173 是**塔体/炮管层**，与 86 结构层叠加）

### 2. 【权威】逐件 PlaceObject 矩阵解析（deobf/turret_layout.py）

- 关键教训：**FFDec dumpSWF 文本已正确解码 PlaceObject2/3 的全部字段**（含带 rotate 的
  matrix 与 instance name），远比手写二进制解析可靠。改为「dump 文本取 (chid,depth,name)
  + 二进制补 matrix」，并用「tag 偏移必须落在本 sprite 字节范围内」判定边界。
- 产出 `deobf/data/turret_layout.json`：86/173/427 三库每一帧的
  `{chid, depth, name, isSprite, m=[a,b,c,d,tx,ty](px), bounds}`。
- 交叉验证：矩阵值与 FFDec dump 权威值逐一吻合
  （例 canon105 chid108 `scale=0.6382 t=(0,-4.15)`；Yamato 四联装各带 `0.0022` 微旋）。

### 3. 【权威】画布原点 —— 三路独立验证收敛

FFDec 对同一 sprite 的所有帧导出**统一画布**（86 库全 76×76，173 库全 48×143）。
画布原点（相对武器局部系）用三种独立方法测定，结果一致：

| 方法 | 173 库原点 | 说明 |
|---|---|---|
| 12 个独立部件模板匹配 | (-21.98, -76.30) | 跨 12 帧，标准差 <0.31px |
| 修正后解析器全帧 union | (-22.15, -76.20) | 画布 48.41×143.54 ≈ 实测 48×143 |
| 单部件相减反解 (chid 110) | (-22.00, -76.10) | 与整帧像素对照 |

→ 取 **(-21.98, -76.30)** 为 `TURRET_LIB_ORIGIN`。

### 4. H5 渲染改造

- **整帧渲染**：`turretLibImg(id)` 直接贴 `assets/turretlib/173/<帧号>.png`，
  部件相对位置由原版权威矩阵决定，不再手工拼装。玩家塔与敌方共用 173 库
  （`PLAYER_ETURRET` 简化为同名映射）。
- **删除**：`TURRET_SRC` / `TURRET_IMG`（86 库单帧）、`ETURRET_PARTS`（手工拼装表）、
  `partImg` / `gunFramePath` / `ETURRET_PARTS[..]` 等旧调用，smoke 断言确认三者已 `undefined`。
- **炮管开火叠加**（`TURRET_GUNS` + `drawTurretGuns`）：依据原版
  `deobf/pcode_as/DefineSprite_174...` 第 340 行 `canonN.gotoAndPlay("fire")` ——
  **只让 named 炮管部件（canon1/canon2/…）播开火序列，底座不动**。
  表由 `deobf/data/turret_guns.json` 生成，含每件的 matrix 与 PNG 画布原点。
  多管武器名序已核实：canon105D=`[canon1,canon2]`、Yamato460=`[canon4,canon1,canon2,canon3]`。

### 5. 【真 bug 修复】开火动画恒不播放

- 上轮遗留的 `FIRE_TICKS` 用**武器名**查一张按 **chid** 索引的表 → 结果恒为 `undefined`，
  `fireT` 永远是 0，开火动画从不播（烟测当时未覆盖到）。
- 改为 `fireTicksFor(武器名)`：从 `TURRET_GUNS` 找该武器的炮管，取最长 fire 序列长度。
- 真机验证：`canon105` 得 `ticks=24`，`fireT=16` 时实际取用第 10 帧且素材已加载；
  实跑 120 帧观测到 58 次开火帧、`maxFireT=34`、击杀计分正常。

### 6. 开火帧表按像素重测（修正上轮两处误判）

- 上轮把 sprite **80**(pluton) / **161**(crotaleTigre) 标为"无开火帧"——因为只看
  了"从帧 2 起的连续段"，漏掉后段真正的开火动画（80 在 148-186，161 在 30-46）。
- 漏了 **83**(MTHEL 激光)：实测 2-21 帧为激光束扩张→收缩。
- 现按「`fire` 标签帧号 + alpha>40 逐帧内容量」重测全部 13 支炮管，
  只保留有内容的帧（全空帧跳过）。MLRS 102 帧的超长序列经抽样确认是火箭齐射，属实。

### 7. 顺带核实：Yamato 尺寸

- 移除 H5 里凭空写的 `big = u.type==='Yamato' ? 2.4 : 1`。
- SWF 权威：单位帧库 426 所有车体 `scale=(1,1)` 原生尺寸；Yamato 车体 shape 425
  bounds = **78.80 × 283.80 px**（本就是巨型战列舰，无需放大）。带 2.4 会变成 682px，是错的。

### 本轮如实说明

- 炮管叠加的**逐件原点**采用「该 sprite 首帧 bounds 的 min」。合成对照测试显示
  与真值 alpha 平均差 8.5/255（差异像素 268/6896 ≈ 3.9%），肉眼一致；
  但未做到逐像素精确（受 FFDec 缩放采样与 CXFORM 影响），如实记录。
- `radar` / `radarMobile` 无 named 炮管（原版是旋转扫描，非开火），
  已在 smoke 中显式列出，不做炮管叠加。

## 第 N+13 轮成果（2026-09-28, H5 领土防御·原版解锁机制 + 自动修理磁场）

**本轮补上两个原版核心机制 (此前 H5 完全缺失)**

### 1. 每波结束二选一：解锁武器 / 利息 +3%

反编译证据链（全部来自权威脚本，非推测）：

| 环节 | 出处 | 内容 |
|---|---|---|
| 解锁表初值 | `frame_6/PlaceObject2_6_333 onClipEvent(load)` | `unlocker.m60/gatling=true`，其余 false；`weaponsToUnlock=["crotale","canon125","MLRS","MTHEL","pluton"]`；`iUnlock=0`；`unlockerLength=5` |
| 自动解锁时间线 | `DefineSprite_834/frame_1/PlaceObject2_773_189` `newEvents` | `mR==7→canon75`、`11→canon105`、`16→canon105D`、`27→radar`、`31→su37`；另 `18/20/27/31/37/39` 调 `showPanelForUnlock()` |
| 解锁函数 | `pcode_as/frame_6__PlaceObject2_6_333` `unlockNextWeapon` | `iUnlock==unlockerLength → return false`；否则 `weaponsToUnlock[iUnlock]=true; iUnlock++` |
| 面板函数 | 同上 `showPanelForUnlock` | `debloquerArme._x=400; _y=300; lockItem=false`；文案 `"you can unlock the <X>" + "\n" + "or increase your interest rate to " + (interest+3) + "%"` |
| 解锁按钮 | `DefineSprite_989/frame_1/PlaceObject2_988_6 on(press)` | `lockItem` 守卫 → `unlockNextWeapon()` → 成功播 `creationUnite` + `_alpha=45` + `_parent._x=-500`；失败播 `cannot` |
| 利息按钮 | `DefineSprite_989/frame_1/PlaceObject2_988_3 on(press)` | `lockItem` 守卫 → `interest += 3` → `_alpha=45; _parent._x=-500` |
| 按钮文本 | 两个 `onClipEvent(load)` | `"unlock the next weapon"` / `"increase interest"` |
| 利息结算 | `953/frame_30` + `pcode_as/frame_6__PlaceObject2_6_329 giveIntrest` | 每波结束 `euros = floor(euros × (1 + interest/100))`，第 1 波后不给 |
| 触发时机 | `953/frame_2 DoAction` | 两波之间剧情段调 `_root.events()`，此时 `mR` = 即将开始的波号 |

**H5 实现**（`territory-defense/game.js`）：
- `SHOP` 去掉 `unlock` 波数字段，改为全部读 `G.unlocker`；初始只 `m60`/`gatling` 可选（商店 11 项 / 9 项灰锁）
- 新增 `AUTO_UNLOCK` / `PANEL_WAVES` / `WEAPONS_TO_UNLOCK` 表 + `unlockNextWeapon()` / `autoUnlockForWave()` / `showPanelForUnlock()` / `panelPickUnlock()` / `panelPickInterest()`
- `endWave()` 用 `nextWave = G.wave + 1` 查表（对应原版 `events()` 在下一波前调用），命中 `PANEL_WAVES` 则弹面板且**不推进 `interWave`**
- 面板打开时 `tick()` 冻结波次调度；`lockItem` 守卫防连点（与原版一致）
- Su37 空袭按钮加 `G.unlocker.su37` 解锁门（原版 m31 才出现）
- `index.html` 新增 `#unlockPanel`（舞台居中，对应原版 `_x=400 _y=300`）

**真机验证**（browser-use，http://127.0.0.1:8123）：
- 开局：商店 11 项 / 9 锁定；Su37 按钮 `disabled=true` 文案"Su37 未解锁"
- 波 6 结束 → `canon75=true` 自动解锁，无面板，`interWave=200`
- 波 17 结束 → 弹面板，文案 `你可以解锁 "125mm 炮" / 或把利率提到 9%`
- 真实点击"解锁 响尾蛇导弹" → `crotale=true`、商店锁定 9→8、面板关闭、`interWave=188`（波次恢复）
- 真实点击"利率 → 9%" → `interest 6→9`、`hInt2` 显示 `interest 9%`、`iUnlock` 不变（1）
- 面板打开时跑 60 帧 `tick()` 波次冻结；关闭后 3 帧恢复推进

### 2. 自动修理蓝色磁场（原版剧情明文记载的视觉）

反编译证据链：

| 环节 | 出处 | 内容 |
|---|---|---|
| 伤害循环触发 | `frame_6/PlaceObject2_6_327` | `if (unitsAlliees[i].repairLogo.autoRepair) unitsAlliees[i].structureDeco.autoRepair()` |
| 修理函数 | `DefineSprite_185/frame_2/PlaceObject2_6_31 autoRepair()` | 扣 `priceToPay = 2*(maxHP-curHP)`；`etat=etatMax`；`repairLogo.light.gotoAndPlay(1)` + `repairLogo.light2.gotoAndPlay(1)` |
| 磁场精灵 | SWF dump `DefineSprite (chid:183)` | 7 帧：shape 77 → 179 → 180 → 181 → 182 → RemoveObject2（空白帧） |
| 权威配色 | `PlaceObject3 light/light2`（body 0x5a796 / 0x5a7f4） | `chid=183`，CXFORM `mult=[0,0,0,256] add=[153,204,255,0]` → 纯 **#99CCFF** |
| 权威尺寸 | 同上 + `structure(185)` 内 `PlaceObject2 repairLogo` | sprite184 内 `scale=0.05537, t=(-170,-170)`；sprite185 内 `scale=2.07898, t=(0,0)` → 净直径 ≈ 35px，居中塔身 |
| 深度 | `structure(185)` 子件 | `structureDeco dpt=1` < `tourelle dpt=24` < `repairLogo dpt=31` → 磁场画在塔身**之上** |
| 时长 | SWF 头 | 24fps × 7 帧 ≈ 0.292s |
| 剧情佐证 | `frame_6/PlaceObject2_980_242` | *"Every time a turret is auto-repaired, a blue magnetic field appears around it."* |

**H5 实现**：
- 新增 `deobf` 侧生成脚本流程：FFDec `-selectid 183 -format sprite:png` 导出 7 帧 → 按 CXFORM 把纯白渐变重着色为 `#99CCFF`（保留原 alpha 通道），存 `assets/repair/light_1..7.png`
- `MAGNET_FRAMES`(7) / `MAGNET_FPS`(24) / `MAGNET_DIAM`(35) / `MAGNET_TICKS = round(7/24*30) = 9`
- `Turret.magnetT`：`autoRepair` 实际修理到 HP 时触发；`magnetT===0` 才重开（**与原版 `gotoAndPlay(1)` 语义一致：持续修理 → 持续重播光环**）
- 绘制位置在塔身之后（对应 dpt=31 最高层）

**真机验证**：7 帧素材全部 `complete && naturalWidth`；像素级开关对比 —— 开 `magnetT=9` 时塔周围 50×50 窗口内 34 px 均色 `rgb(149,199,248)≈#99CCFF`，关时 0 px；截图可见炮塔上方的蓝色光晕

### 本轮如实说明

- 原版 `newEvents` 里 `m25` 额外 `euros += 2400`、`m26/m59` 播 `edithStart` 语音等**剧情奖励**未接入（H5 已去剧情，只保留与玩法/经济相关的解锁与利息）
- `su37` 在原版是 `menu.constructionCont` 里的建造项；H5 架构里 Su37 走侧栏按钮，故只把解锁门挂在按钮可用性上（视觉与玩法效果等价）

## 资源还原看板（第 7 轮更新）

| 项 | 状态 | 产出 |
|---|---|---|
| 脚本反混淆 | ✅ 940/940 | deobf/scripts/ |
| 玩法数据 | ✅ 100% | deobf/data/ (weapons/structures/missions/unitPhysics) |
| 核心函数语义 | ✅ 7/7 | GAME_LOGIC.md F 节 + pcode_as/ |
| 地图背景 | ✅ 764.jpg 2070×1920 (chid764, carteBase766内) | territory-defense/map.jpg |
| 路点坐标 | ✅ 39/39 (FFDec dumpSWF 权威偏移) | deobf/data/waypoints.json |
| 路线顺序 | ✅ 4 条与源码核对一致 | data.js ROUTES |
| 单位素材对号 | ✅ 12 种 (426 帧库: camion1=402...Yamato=424) | sprites.json + territory-defense/assets/units/ |
| 声音映射 | ✅ 37 soundFx + 3 BGM + 17 环境音 | sounds.json |
| 炮塔素材对号 | ✅ 玩家塔双层 (86 结构层 + 173 塔体层) + 敌方 15 种 173 库 | turretlib/86 (11帧) + turretlib/173 (26帧) + turret_guns.json |
| UI 素材对号 | ✅ 建造菜单 1025 库 (assets/menu/) / INFO 面板 / 小地图已接入 | game.js + index.html |
| 爆炸特效接入 | ✅ 279 的 4 帧 + 分型 (390/392/394/395/396) 动画按半径缩放 | assets/explosion/ |
| 反混淆/矩阵数据 | ✅ turret_layout.py → turret_layout.json / turret_guns.json | deobf/data/ |
| 浏览器视觉验证 | ✅ 每轮 browser-use 真机截图 + 1:1 像素对照 | — |
| BGM 接入 | ✅ bgm_main.mp3(=1157, hellMarch候选) 循环播放, M 键静音; 原始文件待试听最终确认 | assets/music/ |
| tigre 直升机图 | ✅ chid157 矢量渲染图 tigre.png 已接入 | assets/units/ |
| 建造区规则 | ✅ 道路中心线 45px 内禁建 (surfaceForBuild 的几何实现) | game.js |

## 第 7 轮成果（2026-09-27）

- **地图坐标系彻底打通**（改用 FFDec `-dumpSWF` 权威输出，弃手写解析）：
  - carte = chid 834，carteBase = chid 766，背景位图 = chid 764 (2070×1920)
  - DefineShape 765 bounds 解码：X[0,2070] Y[0,1920] → 路点坐标即位图像素坐标系
  - 39/39 路点矩阵提取（begin 126,580 … r10 93,-1563），t12/h4 缺失问题解决
- **12 种单位素材对号**：426 帧库帧标签即单位名，shape→fill-bitmapId 链提取（camion1=402.png … Yamato=424.png），已拷入 territory-defense/assets/units/ 并接入渲染
- **声音系统完整破解**：37 个 soundFx、3 首 BGM（actOfInstinct/hellMarch/justDoItUp 循环，文件在 1081-1157 无导出名 mp3 中）、17 个 b01-b17 鸟叫环境音（每 10 秒 playBirds）
- **炮塔外观库定位**：86=玩家炮塔库、173=敌方武器塔库 22 帧（全部对齐 typeData 名）、1025=建造菜单按钮库
- **smoke_test 修复**：draw/hud stub 开关 + 450 帧（根治无头卡死），迷雾/对空升级/经济闭环全绿
- 已推送 GitHub（91dba0d）

## 第 8 轮成果（2026-09-27）

- 炮塔原版外观接入（86 帧库 shape PNG：炮管旋转 / radar·MLRS·pluton·MTHEL 整图）
- 爆炸 4 帧动画接入（按效果半径缩放）
- BGM 循环播放（浏览器自动播放策略：首次交互启动，M 键静音）
- tigre 直升机渲染图接入（chid157）
- 建造区规则：敌军道路中心线 45px 内禁建
- smoke_test 全绿（Audio stub 补齐）

## 第 9 轮成果（2026-09-27）

- **建造菜单原版武器照片接入**：1025 帧库 12 张按钮图（m60.png...su37.png，原版真实武器照片风格）→ H5 商店按钮图文化
- **BGM 三曲循环**：时长权威判定（mutagen）1082=66.1s / 1157=46.2s / 1084=18.3s 为最长三曲 → 对应原版 musics 循环（actOfInstinct/hellMarch/justDoItUp），onSoundComplete 自动切下一首已还原
- **Yamato 战斗音乐**：终波 Yamato 出场自动切换 bgm_alt（原版 yamatoBattle 标志还原）
- smoke_test 全绿

## 第 10 轮成果（2026-09-27）

- **小地图接入**（原版右上角 152px minimap）：地图缩略 + 塔点(绿)/雷达点(蓝)/可见敌人(红) + 视口框 + 点击跳转摄像机；绘制于迷雾之上
- **INFO 面板**：选中塔显示 名称/对空状态/HP/伤害/射程/冷却/炮管数（原版 informations 面板还原）
- smoke_test 全绿

## 第 11 轮成果（2026-09-27）

- **原版音效全面接入**：20 个音效文件拷入 assets/sounds/，轮换池 SFX 引擎（3 实例/音效防重叠切断）
  - 开火音按武器对号（m60/gatling/c75mm/c105mm1/c105mm2/c125mm/crotale/mlrs）
  - 爆炸音按威力分级（>=200 explosionLarge / >=100 explosionMlrs / 其余随机 1-3）
  - 建造 creationUnite、击杀随机爆炸、敌人突破基地失败
- **波次来袭横幅**：第 N/44 波 + 路线方向警告（南方公路/西侧小路/北面空降/海上航线）
- **score 修正**：击杀赏金计入 score（原版 score 语义为损失惩罚，此处记战果，H5 设定）
- smoke_test 全绿

## 遗留（下一轮从看板 ❌ 项继续）

**状态：脚本反混淆主体完成 (100%)** — 2026-09-27

## 成果总览

| 阶段 | 结果 |
|------|------|
| 脚本总量 | 940 个 ActionScript 文件 |
| 状态机线性化 | **343/343 全部成功，0 失败** |
| 干净直通（未混淆） | 597 个 |
| 常量池解析 §§constant | 161/162 文件完成（868 处引用） |
| 输出目录 | `deobf/scripts/`（与源目录结构镜像） |

## 工具链用法

```bash
# 1. 状态机还原 (decompiled → deobf/scripts)
python3 deobf/deobfuscate.py                     # 全量
python3 deobf/deobfuscate.py --file <单个.as>    # 调试单文件
python3 deobf/deobfuscate.py --limit 50          # 前 50 个

# 2. P-code 导出（常量池来源，已完成，产物在 deobf/pcode/）
./ffdec/ffdec-cli.exe -format script:pcode -export script deobf/pcode TCS_uncompressed.swf

# 3. 常量池解析 (deobf/scripts 原地替换 §§constant(N))
python3 deobf/resolve_constants.py
```

## 混淆器手法与对策（已全部破解）

| 手法 | 对策 |
|------|------|
| 控制流平坦化（while(true) 状态机） | 恒定函数常量折叠 → 状态链模拟 → 按执行序拼接 work |
| 恒定条件函数 `set("ₓ",N%511*5)` | 静态求值（恒真/恒假可判定） |
| 嵌套状态机 / 接力状态机（if 守卫衔接两段 while） | 整体模式：init 之后全部语句作为一条 chain 模拟 |
| 带标签循环 `loop0:` + `break loop0` / `continue` | 标签剥离；break_l 冒泡；continue 即本轮结束 |
| 栈值条件 `if(§§pop())` | 常量栈模拟（§§push/§§pop 折叠） |
| "归零退出"（set 状态到 0 无 break） | V2==V 无转移 → 视为自然离开循环 |
| 表达式位置的内联函数定义 | 语句位置才删除，表达式位置由 postprocess 替换为常量值 |
| 常量池切换（§§constant 越界第一个 pool） | 0-based 索引；越界时切换后续 ConstantPool |
| 乱码标识符 `{invalid_utf8=N}` | 后处理替换为 `uN`（名字本身无法还原，需语义重命名） |

## 关键还原文件（H5 重制核心数据）

| 文件 (deobf/scripts/) | 内容 |
|------|------|
| `frame_6/PlaceObject2_6_329/...` | **unitsMissions 44 波敌人配置 + 4 条行进路线 parcourt1-4** |
| `DefineSprite_174/...onClipEvent(load).as` | typeData 全部 26 种武器属性 |
| `DefineSprite_185_structure/...` | structureData 武器价格 + 炮塔结构逻辑 |
| `frame_6/PlaceObject2_980_242/...` | 全部剧情对话（H5 版将弃用） |
| `DefineSprite_793/`, `DefineSprite_834/` | Su-37 空袭逻辑 |
| `DefineSprite_400_obus/` | 炮弹/导弹飞行与爆炸逻辑 |
| `DefineSprite_1027/` | 建造菜单 UI（每武器价格/属性信息） |

**新发现（此前未提取）**：敌人行进路线数据——
- `parcourt1` 南线：begin → t1..t12 → r1..r10（主攻路线）
- `parcourt2` 西南线：g1..g3 → r1..r10
- `parcourt3` 北线：begin → h1..h5 → r10（直升机空降线）
- `parcourt4` 海线：e1..e8（舰艇航线，Yamato 最终波专用）

## 已知残留

1. **1 个文件**常量池不完整：`DefineSprite_428_unit/frame_39/DoAction.as`（62 处残留，引用 65+ 项的大 pool，FFDec pcode 导出只含 2 个小 pool）。该文件是单位物理参数表（质量/速度/装甲），如需彻底解决需从 SWF 二进制直接解析 DoAction tag 的 ConstantPool action (0x88)。
2. **乱码标识符**：`u239u209` 之类是混淆器改名的变量/对象名，原名已丢失，需按用法语义重命名（下一阶段）。
3. **§§push/§§pop 栈残留**：FFDec 对栈机代码的忠实渲染，无害但不美观；可用后续清理 pass 消除悬空的 push/pop。

## 下一阶段（为 H5 重制做准备）

1. [x] **数据导出 JSON（第 2 轮）**：`deobf/data/` 下 weapons.json(26) / structures.json(11) / missions.json(44波+4路线) / unitPhysics.json(编队参数)
2. [x] **游戏逻辑清单（第 2 轮）**：`deobf/GAME_LOGIC.md`
3. [x] **核心函数体 P-code 翻译（第 3 轮）**：`pcode2as.py` + GAME_LOGIC.md F 节语义
4. [x] **全量伪代码库（第 4 轮完成）**：`convert_all_pcode.py` → `deobf/pcode_as/` 347 个文件、459 个命名函数全部转换，0 失败。其余 593 个 pcode 无命名函数（纯事件处理器，AS 层已还原）
5. [x] **常量池切换错位修复 + 乱码名语义重命名（第 5 轮完成）**：resolve_constants v2（最大覆盖 pool 策略）修掉索引错位根源（此前 `["this"]="name"` 类荒谬赋值全部消除，如 `gotoAndStop("lock")` 正确还原）；证据驱动的乱码名重命名应用 98 处（13 个对象名 + 9 个成员名，证据见 RENAME_NOTES.md），其余归档于 garbled_evidence.json / garbled_members.json
6. [x] DefineSprite_428_unit/frame_39 的 62 处常量残留（第 6 轮**关闭**）：从 SWF 二进制直接解析确认——sprite 428 全部 DoAction 里只有 2~15 项的小 pool，**SWF 中根本不存在 65 项 pool**。这 62 处引用是 FFDec 反编译器处理 DefineFunction2 乱码名时的串扰 bug（`§\§\§constant(59)§` 畸形输出为证）。chassisData 真实数据已从其它文件完整还原（GAME_LOGIC.md B 节），零信息损失

## 第 6 轮成果（2026-09-27）— H5 重制开工

- **`h5/` 可玩原型建成**：`index.html + game.js + data.js`（无依赖，双击即玩）
  - 数据内嵌：26 武器 / 11 炮塔价格 / 44 波 / 12 底盘（由 deobf/data/*.json 生成）
  - 机制还原：溅射三段、对空 ×4、对空武器限制、利息公式、修理/出售、基地突破失败
  - 无头模拟验证：堵路防守 12 塔撑到第 8 波（abrams 重坦潮）漏敌失败——胜负判定/强度曲线/经济闭环全部正确
- **遗留全部清零**。反混淆工程完结；后续 H5 差异清单见 `h5/README.md`（路线坐标占位、美术待接入、Su37/升级/音效待实现——素材与公式均已备齐）

## 第 5 轮成果（2026-09-27）

- **常量池错位根源修复**：v2 resolver 用"最大覆盖 pool"策略替换错误启发式，多 pool 文件的引用全部指向正确 pool。修复后建造菜单初始化代码完全语义化：
  ```javascript
  eval("turretInfo_m60")["range"] = 350;
  eval("_root")["master_menuItems"]["unlocker"][eval("turretInfo_m60")["name"]]
  → turretInfo_m60.gotoAndStop("lock")   // 未解锁跳锁定帧
  ```
- **乱码名清理**：60 个对象名 + 23 个成员名全部经过证据审查，98 处语义重命名应用（_root/swapDepths/turretInfo_m60/crotale/obusShell系列/structureClip/range/costUpgraded/offscreenX 等），证据全档
- 全量伪代码库已用修复后的 resolver 重建（459 函数）

## 第 N 轮成果（2026-09-27, H5 领土防御·坐标与资源轮）

- **【重大修复】y 轴镜像 bug（用户报"点小地图不能正确映射"的真正根源）**：
  路点/地图位图全是 Flash 屏幕坐标（y 向下=南），旧 w2sY 按 y 向上翻转 → 整个世界垂直镜像：
  道路+车队一起镜像所以看起来正常，但小地图（正立缩略图）与主视图（镜像）对不上，
  点小地图落到镜像位置；出发点（y=580 南）被画到地图外以北。已改为 Flash 屏幕系直通
  （w2sY=y-cam.y，精灵旋转 -rot-π/2 → +rot+π/2，小地图/探索画布/边界钳制全部同步）。
  真机验证：点小地图右上水坝→主视图落在同一座水坝；点底部→地图南缘；车队在出发点路段向东北行军，
  小地图红点在底部对应位置
- **【重大修复】浏览器缓存吃掉修复**：用户浏览器一直跑旧 game.js（Chromium 启发式缓存+固定 URL）。
  index.html 的 script 标签已加 ?v=时间戳；此前"已验证"的教训=公式自检≠视觉对照，必须真机截图
- **173 库分层渲染完成**：ETURRET_PARTS 按 turret_frames.json objs 深度序画"底座+炮管+装饰"
  （22 种敌方武器全接入，新导出 shape 64/115/136/160 + sprite 80/115/121/136/160），
  玩家 m60 塔补上 173"m60"帧真身=88 底座+92 机枪（带旋转），删除 ETURRET_SRC 单帧方案与
  猜错的 turrets/60/66/68/84.png。待办：各部件的 PlaceObject2 逐件偏移矩阵（现居中摆放）
- 诚实备注：G 全图经数值验证（zoom 0.39 视野覆盖全世界）；自动化截图受后台标签页定时器节流影响，
  部分截图为冻结帧，以实时截图+数值双证为准
- 本轮队列后续（未做，不装完成）：86 库玩家塔分层(cananon125/pluton/MTHEL 枪口焰/底座)、
  炮管开火多帧动画、Su37 空袭、跳弹/金属音、阴影、选中圈、BGM 对号证据、单位去背景

## 第 N+1 轮成果（2026-09-27, H5 领土防御·86库玩家塔分层）

- **86 库玩家塔统一走 173 库部件表**：删掉旧的 86 库单图分支，玩家塔渲染改走
  PLAYER_ETURRET 映射后复用 ETURRET_PARTS 同一张表（gatling→gatlingAmx10、canon75→75mmAmx10、
  canon105→canon105、canon105D→canon105D、canon125→canon125、crotale→crotale、MLRS→MLRS、
  pluton→pluton、MTHEL→MTHEL、m60→m60Brad、radar→radar）。ETURRET_PARTS 已是 22 种武器的全部件
  描述（底座+炮管+装饰按原版深度序），玩家塔只是把 86 库 ID 翻译成 173 库 ID 然后绘制同一堆部件
- **新导出的部件** sprite 64（canon125 底盘1层）、115（radar 静态）、121（crotale 弹簧）、
  136（MTHEL 底座）、160（gatlingDTigre 翼）已全部接入 ETURRET_PARTS
- **真机截图确认**（z.ai analyze_image）：11 塔一排部署后 m60/gatling/canon 系列/crotale/canon125 全部
  显示出"底座+炮管"分层结构；m60 加底座与 92 机枪，canon125 看到 125 炮管 + 127 底座，
  crotale 看到 117 底盘 + 122 91帧导弹架
- 修正：上一轮 173 库渲染时的 canon125 描述（"86 库另用 sprite 64 作底盘 5 层"）的"5 层"是误读
  —— 实际是 objs 数组里 64 出现 5 次（=5 个 PlaceObject2 引用同一形状）+ 65 炮管；现在按 sprite 64
  一次画就行（其它 4 个 64 实际是不同 depth 的同一形状，1 帧已覆盖）
- 本轮未做（按队列下推）：C 多帧炮管开火动画、Su37 空袭、跳弹音、阴影、选中圈、BGM 对号证据、
  单位去背景——已在任务队列 A-I 列出

## 第 N+2 轮成果（2026-09-27, H5 领土防御·炮管开火动画）

- **新建权威解析器 `deobf/sprite_frames.py`**：直接读 TCS_uncompressed.swf 二进制解析 DefineSprite
  的完整帧序列（FrameLabel + 每帧 PlaceObject chid），输出 `deobf/data/sprite_frames.json`。
  修掉了此前"用 dump 文本扫标签"会越界扫到相邻 sprite 的错误（曾误报 sprite 122 有 41 个标签，
  实为 1 个）。两个独立方法（二进制解析 + dump 缩进界定）一致：**14 把武器 sprite 全部只有
  1 个标签 "fire"，位于第 2 帧**
- **开火帧序列像素实测**：`deobf/data/gun_fire_frames.json` — 对每把武器 sprite 的每帧 PNG 统计
  alpha 内容量，取帧 2 起连续非空段作为开火动画。结果：m60(92)=15帧、gatling(98)=23、75mm(103)=24、
  105mm(108)=24、crotale(122)=4、canon125(125)=34、MLRS(128)=36、gatlingDT90(153)=2、navire(164)=4、
  Yamato(167)=34；pluton(80)/MTHEL(83)/tigre(161) 帧 2 起为空 → 无开火帧（如实记录，回退静态帧）
- **动画机制接入**：Turret.fireT / Unit.fireT 在开火时置为该武器炮管的开火序列长度，每 tick 递减，
  gunFrameFor(id, fireT) 按序取帧；炮管放大验证证实原版动画本质是**后坐**（帧1伸出→中段后缩→末帧复位）
  + 炮口焰。真机画布像素差验证：同塔 fireT=0 vs fireT=17 有 154 像素差异（3.4% 采样区）
- 修正一处 ID 混淆：fireT 原用武器名查 gunFireLen（表按 sprite ID 索引）恒为 0；改
  partsFireLen(parts) 从部件表取炮管 sprite 的序列长度
- 本轮未做（队列下推）：D Su37 空袭、E 跳弹/金属音、F 阴影、G 选中圈、H BGM 对号、I 单位去背景

## 第 N+3 轮成果（2026-09-27, H5 领土防御·Su37 空袭）

- **Su37 空袭完整接入**（原版 DefineSprite_834 反编译依据）：
  - 进入边：`on(press)` 用 Math.random() 四等分选 bas/gauche/droit/haut，进入点
    bas=(rand*2200, 600) haut=(rand*2200, -1600) gauche=(-100, rand*2200) droit=(2100, rand*2200)
  - 落点：`zone = Array(_xmouse, _ymouse)` → H5 点击地图落点，机头 atan2 朝向落点
  - 冷却：`comptDispo = 60`（原版 chargeBombes 每次递减，归零时 disponible=true）
    → H5 每 tick 递减，60 帧后恢复；按钮显示 "Su37 Ns" 倒计时，冷却中 disabled
  - 弹体属性（793_23 onClipEvent(load) 权威值）：`speed=28`、`puissance=500`、`impact=260`
  - 音效：`master_sounds.Su37S.start()` → chid 472 (Su37.flv)。**FFDec -format sound:wav 转码成功**
    （此前 flv 无法播放），得到 22050Hz 单声道 1.63s 呼啸声 → assets/sounds/472_Su37.wav
- **飞机素材**：Su37 战机 = DefineSprite_793（carte 上 `nm: Su37` 引用），导出得 111x183 真实矢量战机图。
  **缩放从头解码 SWF 二进制 PlaceObject2 矩阵得 scaleX/Y=0.4946**（而非目测猜测），机头朝上、随 rot 旋转
- **UI**：侧栏新增 "Su37 空袭" 按钮；瞄准模式画 impact=260 半径红圈 + 十字准星 + "点击目标投放炸弹"
- **无头验证**（smoke_test 扩展）：选边(gauche/haut 随机) → 起飞 available=false → 命中后 3 敌各
  受 500 伤害 → 60 帧精确恢复；真机验证战机按 0.4946 缩放渲染、机头朝向落点
- 本轮未做（队列下推）：E 跳弹/金属音、F 阴影、G 选中圈、H BGM 对号、I 单位去背景

## 第 N+4 轮成果（2026-09-28, H5 领土防御·命中音 + 弹体素材纠正）

- **命中音完整接线（权威源 DefineSprite_400_obus 帧库结构）**：
  - 修正任务描述的猜测：`Math.random() > 0.85` → ricochet（**15%**，不是 30%），`> 0.7` → metal（30%）
  - 权威链路：obus 库帧标签→内层精灵（dump 缩进界定）→ 该精灵 frame_2 DoAction：
    obusLeger→301 / obusMoyen→307 / obusLourd→361（各播 explosion1/1/2）；
    bullet/bulletLourde→**390**（无自带音，frame_2 就是那条 0.85/0.7 概率）；导弹帧内嵌
    爆炸精灵 missile→392(explosionCrotale) missile2→394(explosionMlrs) missile3→395(explosionLarge)
    missileUnderSu37→396(explosionLarge)。**爆炸音随弹体精灵而非武器 ID 决定**，已改为 SHELL_SFX 表
  - 4000 次实测概率：ricochet 598 (15.0%)、metal 1222 (30.6%) — 与权威阈值吻合
- **音效文件补全**：ricochet1-4 (467-470)、metal1-2 (481-482)、explosionCrotale (460)、
  explosion4 (457, flv→wav 转码) 全部导出；**28 个音效浏览器可加载验证 0 失败**（Audio.oncanplaythrough）
- **弹体素材重大纠正**（此前用错）：旧代码把 361(obusLourd 176x182 爆炸图) 当导弹、303 当轻弹。
  权威结构是 obus 库帧内含独立弹体 sprite，按内容 bbox 实测重新对号：
  390(6x32 曳光) / 301(14x25 轻弹) / 307(16x26 中弹) / 361(16x36 重弹) / 393(16x25 导弹, 取第 8 帧成形体)
  渲染改为按 bbox 裁剪 + 归一到 14-22px 世界长度（原来的画布比例缩放是错的）
  - 视野内像素差量化验证：曳光 2x14 → 轻弹 8x12 → 中弹 8x14 → 重弹 9x20 → 导弹 12x20，层次正确
- 本轮未做（队列下推）：F 阴影、G 选中圈、H BGM 对号、I 单位去背景

## 第 N+5 轮成果（2026-09-28, H5 领土防御·单位阴影 + 弹体阴影素材）

- **单位阴影接入（权威源 428_unit enterFrame + SWF colorTransform 二进制解码）**：
  - 修正任务描述的 4 处错位：521 是 **abrams**（非 jeep）、523 amx10、526 bradley、527 camion1、
    **529** camion2（非 531）、**531** camion3（非 533）、533 camionBlinde、**534 jeep**（非 521）、
    535 navire、537 t90、538 Yamato —— 全部以 `deobf/data/exports.txt` 的 ExportAssets 为准
  - **关键发现：FFDec 导出的 _ombre 是中灰图（avg RGB≈85），不是黑的**。原版在舞台上以
    PlaceObject2 colorTransform 放置：`mult R=G=B=0, alpha=0.352`（从 flags=0x1e 后的 CXFORM
    二进制逐位解码得到）。H5 若只设 globalAlpha 会画出灰雾而非阴影 → 新增 `deobf/make_shadows.py`
    按原版变换把 RGB 压为 0（alpha 保留），11 张全部处理
  - 绘制按原版：`ombre._rotation = _rotation; ombre._x = _x+4; ombre._y = _y+4`，
    在车体**之前**绘制（=车体下方），alpha=0.352
  - 验证：drawImage 拦截确认调用序列为 `ombre → unit` (顺序正确)；隔离测试证明阴影图可绘制
    (alpha=1/offset=25 时 940 深色像素)；原版偏移仅 4px+alpha 0.352 → 阴影多数藏在车体正下方，
    只露边缘一丝立体感（**这是原版真实行为，非 bug**）
- 本轮未做（队列下推）：G 选中圈 471、H BGM 对号证据、I 单位去背景+车头校正

## 第 N+6 轮成果（2026-09-28, H5 领土防御·选中视觉）

- **修正任务描述的关键错误**：`471` **不是**选中圈图形，而是 DefineSound `selectionUnite`（音效，早已接入）。
  真正的选中视觉是两个 sprite：**778 = carte.viseurUnit（红色四角准星）**、**775 = carte.cerclePortee（绿色射程圈）**
  - 778 有 9 帧但**只有前 4 帧有内容**（后 5 帧 bbox=None 空帧）—— 任务描述"4 帧"的由来；
    60x60 固定尺寸，不随射程缩放
  - 775 单帧 100x100 圆形绿线
- **权威用法**（frame_6/PlaceObject2_6_321 enterFrame + load 反编译）：
  - `afficheUnit != "null"` 时：`cerclePortee._x/_y = 选中单位._x/_y`；
    **`cerclePortee._width = distanceOfFire * 2`**（宽度=射程直径）；`cerclePortee._height = _width`
  - `viseurUnit._x` 同步跟随
  - `unshowInfoOnUnit()`: 两者 `_x = -500`（移出画面隐藏）
- **H5 接入**：选中塔时绘制 775（缩放到 `w[1]*2*zoom` 直径）+ 778（固定 60px，按 G.frame/6 轮播 4 帧）
- 真机验证：近景截图确认红色四角准星出现在塔周；全图模式确认绿色射程圈（m60 射程 350 → 屏幕直径 273px，
  与 `350*2*0.39` 吻合）
- 本轮未做（队列下推）：H BGM 三段对号证据、I 单位去背景 + 车头方向校正

## 第 N+7 轮成果（2026-09-28, H5 领土防御·BGM 对号证据）

- **权威证据（三条独立链，全部一致）**：
  1. `frame_6/PlaceObject2_6_430 onClipEvent(load)`：
     `musics[0].attachSound("actOfInstinct")` / `musics[1].attachSound("hellMarch")` /
     `musics[2].attachSound("justDoItUp")`
  2. `DefineSprite_1151`（音乐面板）三按钮的 `onClipEvent(load)` 显示文本：
     `PlaceObject2_1145_5` → **"Act of instinct"**、`1145_8` → **"Hell march"**、
     `1145_11` → **"Just do it up"**
  3. 三按钮 `on(press)` 分别调 `changeMusic(0/1/2)` —— 与 1 的数组索引完全对应
  → **索引→曲名映射已权威确认**（H5 的 BGM_NAMES 顺序正确）
- **音频文件↔chid 已用 MD5 逐字节证明**：assets/music 的 bgm_main/bgm2/bgm3 分别等于
  SWF 原始 `1157`(46.18s) / `1082`(66.09s) / `1084`(18.30s)（md5 完全一致）
- **未解的一环（如实记录，不猜）**：SWF **没有把三个 BGM 名字导出**（88 条 ExportAssets 里只有
  b01-b17 环境音与武器音效，无 BGM）；三个名字在二进制里各只出现 1 次（均在 6_430/1151 常量池），
  **不存在 linkage 绑定表**可静态查询。因此 "chid 1157/1082/1084 分别对应哪首曲子" 无法从 SWF 静态证明
  - 音频特征仅作参考（不足以定名，不做断言）：1157=46.2s/RMS7176/过零406；1082=66.2s/RMS3138/过零1265；
    1084=18.2s/RMS3675/过零680
  - 当前 H5 映射为 `bgm_main=1157 → actOfInstinct`、`bgm2=1082 → hellMarch`、`bgm3=1084 → justDoItUp`，
    **标注为待人工听辨确认**（三首均已在浏览器验证可播放）
- 本轮未做（队列下推）：I 单位去背景 + 车头方向校正

## 第 N+8 轮成果（2026-09-28, H5 领土防御·单位图核实 + 行进音补全）

- **任务描述 I 的两个前提经实测均不成立（如实记录，未做无谓改动）**：
  1. **"像素去背景"不需要**：FFDec 导出的 11 张单位 PNG **已自带 alpha 通道**（18-58% 透明像素），
     合成到红底上验证无背景残留、无黑边；边缘仅有 alpha≤4 的抗锯齿残留（正常）
  2. **"车头方向校正"不需要**：原版 `428_unit` 的朝向算法权威破解后确认 H5 已正确：
     - `directionToGet = 57.29578 * asin(...)`（角度制，>180 转 -360+x）
     - 位移 `_x += sin(rot)*speed`、**`_y -= cos(rot)*speed`** → `_rotation=0` 指北
     - 图未旋转时车头朝上（=北），与 `_rotation` 自洽
     - H5 的 `rotate(u.rot + π/2)` 正是"车头朝上→东起顺时针"的映射；真机四方向验证：
       rot=-90/北、+90/南、0/东、180/西 车头与炮管方向全部正确
     - 图片 bbox 中心与画布中心重合（dx/dy≈0），内容有 2-11px 边距，旋转不裁剪
- **【本轮实质产出】补全 8 个车辆行进音效（此前完全缺失）**：
  - 原版 `428_unit` 的 `roule()` 权威分支：默认 `r5="Light"`（camion1/2/3、jeep、bradley、amx10、
    abrams、camionBlinde）→ `uniteMoveLight1-4`；`chassis=="t90"` → `uniteMoveHeavy1-3`；
    `chassis=="tigre"` → `uniteMoveTigre1`；`chassis==navire/Yamato`（乱码名 u228Wu132 / $u180u147）
    → `"null"` 族无音效。随机选 `Math.floor(Math.random()*n)+1`
  - 乱码底盘名解码依据：同文件 chassisData 表 `u228Wu132=(1,0.3,0.8,1800,1000)`=navire、
    `$u180u147=(0.5,0.2,0.2,20000,0)`=Yamato
  - 导出 473-480 全部音效（480 为 flv→wav 转码），接入 `rouleSfx()`
  - H5 适配：原版每次 roule 都播会音效轰炸，H5 节流为每 12 帧一次且仅视野内
  - 真机验证：8 个音效全部可加载；触发族正确（Light 4 选 1 / Heavy 3 选 1 / tigre 固定 /
    navire 无）；120 帧真实战斗 8 个音效全部触发、0 JS 错误
- **队列 A-I 全部处理完毕**（A/B/C/D/E/F/G/H 前几轮完成，I 本轮以"核实不需要改 + 补全行进音"收尾）

## 第 N+9 轮成果（2026-09-28, H5 领土防御·环境鸟叫补全）

- **盘点发现真实缺口（非重做已完成项）**：原版 `6_430` 的 `playBirds()` 每 10 秒随机播放
  17 个环境鸟叫（b01-b17），H5 此前**完全没有**：
  - 权威逻辑：`setInterval(this,"playBirds",10000)`；
    `Math.floor(Math.random() * 17) + 1` → `BSounds[1..17].start()`
  - 原版跳过条件：`master_scenario.enScenario`（剧情模式）/ `aPerdu`（已失败）/ `edithBool`（降音量模式）
    → H5 对应：已 lost/won 时不播、静音时不播
- **导出 17 个音效**（chid 429-445）接入 `playBirds(now)`，10 秒节流；
  `b12`(chid440) 原本是 flv 且 `-format sound:mp3` **静默失败**（文件未生成）→ 改用 `-format sound:wav`
  转码成功（1ch 5512Hz 2.51s）。这正是"验证每个音效真能加载"查出来的
- **全量音效核验**：SFX_FILES 53 项**文件全部存在**（脚本比对）+ 浏览器 `oncanplaythrough`
  **53/53 可加载 0 失败**
- **顺带核实的原版机制**（已确认 H5 正确，未改）：
  - 修理费公式 `2 × (maxHP − curHP)`（DefineSprite_819 repairIfCan 权威）→ H5 的 `REPAIR_COST=2` 一致
  - 原版另有 `barreReparation` 面板 + `repairLogo.autoRepair` 开关 UI（chid 819/184），
    H5 已有 autoRepair 字段与逻辑，但**无面板 UI**（列为后续可选项，非队列要求）

## 第 N+10 轮成果（2026-09-28, H5 领土防御·修理面板 barreReparation）

- **补全原版 `barreReparation` 修理面板**（上一轮盘点出的缺口，队列 A-I 之外）：
  - **权威逻辑**（`DefineSprite_819` 的 `refresh(unit)` / `repairIfCan()` / `DefineSprite_184` 的 `swithRepair()`）：
    - `priceToPay = round(2 * (etatMax - etat))` —— **2 $/HP**
      （注：pcode 里 `r3=(r3/2); r3=(r3/r5);` 是混淆死代码，随后 `r3 = 2` 直接覆盖；
      我第一版误读成 `4*(maxHP-curHP)/range`，经测试发现 `canon105 缺10HP→0$` 显然不对而纠正）
    - `repairIfCan()`：钞票不足播 `cannot` 音并拒绝；否则扣款、`etat = etatMax`、播 `selectionUnite`
    - `swithRepair()`：翻转 `repairLogo` 内的布尔（即 autoRepair），文案切 "auto repair ON/OFF"
    - 面板点击：条上 `on(press)=repairIfCan`、autor 按钮 `on(press)=swithRepair`
  - **素材问题（如实记录）**：`814 base` / `818 autor` 两张导出位图里 **FFDec 把 EditText 的示例文字
    "repair for 1000000$" 烧进了像素**，不可直接用；`184 repairLogo` 实为圆形阴影图（非图标）。
    → 改为**从 814 采样权威配色**（纯黑边框 + `RGB(0,102,152)` 蓝底）按原版尺寸布局自绘，
    文字由 H5 动态生成。删除不可用的 assets/repair_bar/
  - **H5 交互**：R 键 = repairIfCan（全额修复扣款）；**T 键 = 切换 auto repair**；
    面板点击（修理条 / autor 区）也可触发
  - **真机验证**：T 键 auto false→true；R 键 255→280HP 扣 50$（=2×25）；
    点击修理条 240→280HP 扣 80$（=2×40）；截图确认蓝条 + HP 进度 + "repair for 50 $" + "auto repair OFF"
- 顺带：HUD 提示补上 "T自动修理"

## 第 N+11 轮成果（2026-09-28, H5 领土防御·建造预览光标 + 一次如实失败的尝试）

- **补全原版建造预览 UI（822 viseurConstruction + 1161 cancelhint）**：
  - 权威依据 `DefineSprite_822`（3 帧 40x40）：**帧1 浅灰绿=可建 / 帧2 粉红=hover / 帧3 深红=不可建**
    （代码里 `gotoAndStop("red")` 对应帧 3）；`1161`（2 帧 634x15）为取消提示条，
    原版 enterFrame：`if (viseurConstruction) cancelhint.gotoAndStop(2) else gotoAndStop(1)`
  - H5 接入：选建筑后光标跟随鼠标，可建时帧1、不可建/钱不够时帧3；底部显示原版提示条
    （实测文案 "press spacebar to cancel build mode"）+ 左下 "可建/不可建 xxx"
  - 真机验证：5 张素材全部加载；光标 40x40、提示条 634x15；草地处判定可建、光标为浅灰绿
- **【未完成·如实记录】原版 surfaceForBuild 遮罩判定未能复现**：
  - 原版的真·可建判定是 `surfaceForBuild.hitTest(x,y,true)`（形状级命中测试，见
    `DefineSprite_834/frame_1/PlaceObject2_822_226 on(press)`），非道路缓冲近似
  - 导出 `chid 768`（1838x1730 位图，alpha=255 处即可建，覆盖约 24%）尝试复现，
    **失败**：严格解码其 PlaceObject2 矩阵得 `scale=1.00003 translate=(166.1,391.5)`，
    但按世界坐标（含 y 翻转、多种原点/符号组合共 17 种）采样均无法与路点吻合
    （理想应"路点上必为不可建、远离路点处多可建"，实际全部不匹配）。遮罩几何基准另有来源，未破解
  - **决定**：保留已验证正确的 45px 道路缓冲近似（逻辑与遮罩意图一致），
    并在代码注释与看板中明确标注此未完成项，不假装已还原
- 本轮未做（如有需要可下轮）：`785 zoneBombardement`（Su37 轰炸区指示，H5 已用瞄准圈近似）

## 第 N+12 轮成果（2026-09-28, H5 领土防御·surfaceForBuild 遮罩：深入尝试后明确放弃）

- **本轮专项攻关上一轮遗留的未完成项**（768 可建区遮罩），穷尽手段后**明确判定不可复现**，
  如实记录全部尝试与证据，不再留悬念：
  1. **结构解码**：`768` 仅含 `767`(DefineShape, bitmap fill 引用 769 位图)，无额外矩阵。
     解码 767 bounds 得 `x[-156.8,1681.2] y[-1412.0,318.5]`（尺寸 **1838x1730**，与位图完全一致，
     此前漏 jump shapeId 2 字节导致解码错误，已修正）
  2. **SVG 交叉验证**：`decompiled/shapes/767.svg` 给出 `width=1838 height=1730` +
     `transform="matrix(1,0,0,1, 156.8, 1411.95)"` —— 与 bounds 符号相反，据此推出遮罩左上角
     在 carte 局部 = `(166.1,391.5)+(156.8,1411.95) = (322.9, 1803.45)`
  3. **离线穷举**（17 种原点/翻转组合 + 密集路点采样 488 点）：曾出现一个"匹配"
     （flip=-1, ox=-320, oy=-268），但严格复核后**路线上仍有 16% 被判可建**（理想 0%），
     证明是**小样本过拟合的巧合**，非真解
  4. **权威推导值验证**：用 (322.9,1803.45) 测试，路上仍有 20% 可建 → 不成立
  5. **图像互相关**（不依赖矩阵推导的全新方法）：在 map.jpg 上滑窗搜索遮罩最佳对齐，
     最优 offset=(120,88) 时 **mask 内 94.3% 是草地、mask 外 57.8%** —— 对齐信号很强，
     但**路点验证仍有 28% 被判可建** → 结论：**遮罩语义与"道路禁建"假设不同**
- **最终结论（诚实）**：`surfaceForBuild` 标记的不是"道路以外皆可建"，而是更细的
  "允许建塔的平地区域"（含地形/建筑等多种限制）。其几何基准涉及 carte/zoneDezoom 多层矩阵，
  且语义无法用"路点距离"或"草地图层"近似复现。
  → H5 保留 45px 道路缓冲近似（**行为与遮罩意图一致：道路上不可建**），
    在此明确标注为**设计取舍而非还原完成**。清理了不可用的遮罩素材，game.js 无残留引用
- 说明：本轮没有代码改动（仅 PROGRESS 记录 + 素材清理），因为所有尝试均未达到"可安全接入"标准。
  不做无把握的改动，也不把失败的尝试包装成成果

## 第 4 轮成果（2026-09-27）

- **伪代码库建成**：`deobf/pcode_as/` — 全部 459 个命名函数的可读伪代码（含 fireOnEnnemi/createUnit/startMission/roule/getTarget/OCEEF 等核心）
- **语义重命名**：按用法证据确认 4 个高频乱码名（u191u163=_root、u170.u215=swapDepths、u239u209=建造菜单炮塔数据对象、u155u180u132=menuDepthClip）并应用到输出
- **工程状态**：940 个 AS 全部还原（343 线性化 + 597 直通）、常量池 161/162、伪代码 459 函数。H5 重制所需的**数据(JSON) + 机制(GAME_LOGIC.md) + 核心函数(pcode_as) 三件套齐备**，可以开工写 H5 版

## 第 3 轮成果（2026-09-27）

- **pcode2as.py 转换器**：栈模拟 + 表达式折叠 + ConstantPool 按执行序切换解析 + loc 标签控制流。修复点：loc 前缀 label、StoreRegister 数字参数、Increment/PushDuplicate/StackSwap 指令、跨块 pool 继承
- **破解对空机制真相**：fireOnEnnemi 对 chassis=="tigre" 伤害 **×4**（剧情说 2 倍，代码是 4）；"只有机枪/导弹能打空中"实现在 getTarget 的武器类型过滤
- **破解波次生成**：startMission 按 units.length==13 区分横/纵排布（20px/60px 间隔），生成后建车队链表
- **破解利息公式**：euros = floor(euros × (1 + interest/100))
- **失败判定**：getFirstEA 每 200ms 扫描 _y > 477 的敌人（抵达基地线）

## 第 2 轮新增发现（2026-09-27）

- **chassisData 底盘表**：11 种敌人的速度/转弯/血量/赏金（GAME_LOGIC.md B 节，此前从未提取）
- **溅射三段公式**：中心全额 / 中环半伤 / 外环 20%
- **全局参数**：fpsc=1.13 速度倍率、初始 850 金 + 利率 6、Su37 冷却 60s
- **武器解锁关卡表**：canon75@8 / canon105@12 / canon105D@17 / radar@28 / su37@32
- **存档结构**：SharedObject 字段完整清单
- 关键结论：FFDec AS 反编译丢失的核心函数体全部可在 P-code 中找到，P-code 是完整可信源
