# TCS 对齐账本（签名卡；配额制，见 TASKS.md「二之一」）

进度行：**A: 1/6 族, B: 2/4 组**（2026-10-01, TCS+64）

## A. 函数账本（95 个具名函数 = DefineFunction2×82 + DefineFunction×13）

### A1 单位族（428/426_1）✅ TCS+64
| 原版函数 | 语义 | H5 对应点 | 结论 |
|---|---|---|---|
| roule (loc08b2 前) | 巡航/转向渐变 + 车队制动 (dist<前车高×1.8, 舰×4) | game.js Unit.update 1418-1436 (TCS+43) | 对齐 |
| changeCheckpoint | 逐轴 40px 入弯减速 / 4px 推进路点 / 末点 activePerdu | 1444-1455 (TCS+44) | 对齐 |
| accelere | 每帧 1% 重 roll 巡航目标 +0..20% | vPrime 机制 (TCS+45) | 对齐 |
| selectUnit | selectionUnite 音 + afficheUnit=单位 + zoom 反算 | 点选 handler 3244 (**TCS+64 补音**) | 对齐 |
| destruction | 阵亡序列 39 帧, 三点爆炸, 车 12px 漂移 | killUnit/killTurret (早期轮) | 对齐 |
| autoRepair | 受击触发一次全额修复 | shellHit→autoRepairNow (TCS+57) | 对齐 |

### A2-A6: 未签（后续轮）

## B. 资源账本（assets 1948 文件）

### B1 枪口/弹体系 ✅ TCS+64
- muzzle/DefineSprite_303: 14 帧全用（MUZZLE303, game.js 1768）
- muzzle 365: 曳光弹 2 帧（MUZZLE365_KINDS bullet/bulletLourde）
- shells/DefineSprite_304 = douille 弹壳（obus f1/f2/f3 炮弹类）→ H5 `assets/casing/` 29 帧
- shells/DefineSprite_391 = 曳光弹弹壳（obus f4..f7）→ H5 `assets/casing_bullet/` 29 帧
- shells/303,304,391,400_obus 目录导出 = **已用等价物的源导出**（冗余副本, 定案不删不接）
- 结论：B1 帧集合全部有消费点，无缺失。

### B2 敌塔序列 ❌ 未签（下轮：80/128/122/164/83/161/167 帧区间核对）

### B3 散件判定 ✅ TCS+64
- turrets/56..88.png（17x81 黑竖条）、eturrets/100..172.png（12x15 小件）
  抽样 2 张读图：为**线框标记层/占位残片**——与已定案「86 库=黑色线框标记层」
  同族；H5 玩家塔用 turretlib/173 整帧（48x143）、敌塔用 eturrets_spr。
- 结论：**导出冗余，定案不接入**（保留存档）。覆盖 turrets 14 张 + eturrets 27 张
  + sprites/DefineSprite_64 等同名小件。

### B4 抽样复核 ❌ 未签（下轮）
