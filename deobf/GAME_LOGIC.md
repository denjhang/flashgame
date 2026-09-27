# TCS 玩法逻辑清单（H5 重制参考）

来源：deobf/ 反混淆源码 + deobf/pcode/ 字节码。只含玩法逻辑，剧情/UI 忽略。

## A. 全局框架

| 项 | 值/说明 | 源 |
|---|---|---|
| `fpsc` | **1.13**，全局速度倍率，所有速度/射速/冷却都乘它 | frame_6/DoAction.as |
| `gc` | 1，敌方伤害难度倍率 | frame_4/DoAction.as |
| 初始经济 | `euros=850`，`interest=6`（每波利息，升级一次 +3） | frame_6/PlaceObject2_6_333 |
| 管理器 | master_units / master_weapons / master_menuItems / master_pointeur / master_clavier / master_scenario / master_sounds | frame_6 各 PlaceObject |

- master_units 定时器：getFirstEA 每 200ms、countUnitsEnnemies 每 3000ms、refreshRadar 每 1000ms
- 键位：方向键滚图、G 缩放、S 卖塔、R 修理、Q 画质、C 建造区、H 血条、空格取消
- 存档：SharedObject "cookie"，字段 `iMission, euros, interest, score, iUnlock, unitsV[]`（每塔 [structure, etat, x, y, autoRepair]）
- depth 层级：carte(999) → Su37(30001/2) → minimap(50000+) → UI(100000+)

## B. 敌人单位（chassisData：[速度, 转弯减速, 旋转速度, HP, 击杀赏金]）

| 单位 | 数据 |
|---|---|
| camion1 | 3.2, 1.8, 3, 160, 50 |
| camion2/3 | 3.2, 1.8, 2.5, 200, 50 |
| jeep | 3.2, 1.8, 4, 140, 60 |
| bradley | 3, 1.7, 2.5, 345, 155 |
| amx10 | 3, 1.7, 2.5, 440, 250 |
| abrams | 3, 1.7, 2, 880, 340 |
| t90 | 3, 1.7, 1.5, 1200, 500 |
| camionBlinde | 3, 1.7, 1.2, 2800, 250 |
| tigre(直升机) | 3.2, 1.8, 5, 400, 500 |
| navire(舰) | 1, 0.3, 0.8, 1800, 1000 |
| Yamato | 0.5, 0.2, 0.2, 20000, 0 |

实际速度 = chassis[0] × fpsc。单位链表 unitDevant/unitDerriere 维持车距（CONST_ELOIGNEMENT=1.8，舰 4）。击杀 → `euros += prixRevient`。

## C. 武器（typeData：[旋转, 射程, 冷却帧, 炮管数, 伤害, 溅射]）

见 `deobf/data/weapons.json`（26 种全量）。要点：
- 敌方伤害 `puissance *= gc`
- 冷却帧数 = floor(t[2] / fpsc)
- 索敌：`porteeAcq = 0.6(我方) / 0.8(敌方)`，`setInterval(OCEEF, 43)` ≈ 23 次/秒索敌开火循环
- 对空：只有 crotale/m60/gatling 能锁定直升机（getTarget 过滤）；打中直升机伤害 ×4（fireOnEnnemi）
- MLRS/Pluton 需雷达建成才可用（雷达射程 1200/1500）

## D. 炮弹与伤害公式

- 弹速：通用 `50×fpsc`，105mm `40×fpsc`，pluton `40×fpsc` + 加速度 `0.05×fpsc`
- 命中点计算：`α = rotation×π/180; Y = y + cos(α)×h; X = x − sin(α)×h`，调 `fireOnEnnemi(X, Y, portee, puissance, side)`
- **溅射三段**（missile2/pluton/Su37）：
  ```
  fireOnEnnemi(X, Y, portee/4, puissance)      // 中心全额
  fireOnEnnemi(X, Y, portee/2, puissance/2)    // 中环半伤
  fireOnEnnemi(X, Y, portee,   puissance/5)    // 外环 20%
  ```
- 激光（MTHEL）：无弹道，直接对目标坐标结算
- Su-37 空袭：冷却 60s，随机边缘入场，speed=28 / puissance=500 / impact=260，只伤敌方

## E. 波次与胜负

- 44 波定义 + 4 条路线见 `deobf/data/missions.json`（第 24 波舰艇走海线，第 44 波 Yamato）
- 每波结束 → `giveIntrest()` 发利息 → 下一波延迟
- **失败**：任一敌车抵达北面基地（`aPerdu=true` → perdu/out 画面）
- **胜利**：44 波全部挡住 → end/endPass 画面；炮塔被毁大幅扣分（score++ 记毁塔数）
- 武器解锁关卡（iMission > N）：7→canon75, 11→canon105, 16→canon105D, 27→radar, 31→su37
- 经济：修理 2$/HP；出售 `floor(etat/etatMax × price × 0.75)`

## F. 核心函数体（第 3 轮已从 P-code 破解）

完整伪代码见 `deobf/pcode_as/*.pseudo.txt`（由 `pcode2as.py` 生成）。语义摘要：

### fireOnEnnemi(xpos, ypos, range, power, side) — 溅射结算
```
遍历对方阵营数组 (side=ally → 打 ennemy, 反之):
  跳过 "null" 槽位
  粗筛: |x−xpos| > range*2 + 高度 → 跳过 (同 y)
  精筛: dist = sqrt(dx²+dy²); dist > range + _height → 跳过
  伤害: 目标 chassis == "tigre"(直升机) → etat −= power * 4   ← 对空 4 倍!
        否则 etat −= power
  火花特效 createEclat (power>8 时 ×3)
  etat ≤ 0 → unitEtat.destruction()
```
> 对空伤害实际是 **4 倍**（剧情台词说 2 倍，代码是 4）。"只有机枪/导弹能打空中"的限制在 getTarget 里（见下）。

### getTarget() — 索敌
```
自身无效(_x<0 或 _y>477) → 不索敌
无武器(type=="null")/场上无有效目标 → target=null, 停止定时器
我方索敌: 第一有效目标若是直升机 且 武器 ∉ {crotale, m60, gatling} → target=null
          (对空限制: 只有导弹和机枪能锁直升机; 敌方无此限制)
然后遍历全部目标取最近者 (跳过 _x<0 / 已达基地 _y>477 的)
若最近目标 dist > distanceOfFire → target=null (超射程), 记录 directionToGet
```

### OCEEF() — 每帧开火循环 (setInterval 43ms)
```
aPerdu 或 etat≤0 → 不开火; type=="radarMobile" → 不开火
enScenario(剧情中) → 冷却直接充满
有目标但已失效/超射程 → 每 500ms 重跑 getTarget
numberOfRequest < numberOfRequestForPermission(冷却帧) → 累加等待
```

### askPermissionOfFire() — 开火许可
```
冷却充满 且 有目标 → 允许; 多管武器轮换 canonToFire (1..nCanons); 冷却清零
```

### giveIntrest() — 波次利息
```
euros = floor(euros * (1 + interest/100))   (仅 iMission>1; interest 初始 6, 每次+3)
moreeuros = 增量 (UI 飘字用)
```

### startMission() — 波次生成
```
wave = unitsMissions[iMission-1] = [units, route]
特殊: units.length==13 → 纵向排布(60px 间隔), 否则横向(20px 间隔)
逐个 createUnit(route, routeY + 60*i, routeX + 20*i, "ennemy", weapon, vehicle)
建立车队链表 unitDevant/unitDerriere (相邻单位互链, 前后端为 "null")
iMission++
```

### getFirstEA() — 失败判定辅助 (每 200ms)
```
扫描 unitsEnnemies 找第一个 _y > 477 (抵达基地线) 的敌人 → iFirstEnnemy
扫描 unitsAlliees 同样逻辑 → iFirstAlly (我方单位被用于别的判定)
```

### 其余 (伪代码文件内)
`roule`(428_unit): 沿 checkpoint 行进/转向/车距; `activePerdu`: 停止一切+失败画面;
`createUnit`: 实体入数组+挂载; `removeUnits`: 数组置 "null"; `refreshRadar`: 小地图点。
