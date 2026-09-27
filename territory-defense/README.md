# TCS H5 重制版（最小可玩原型）

The Commander's Sister 的 HTML5 重制。玩法逻辑按反混淆产物 `deobf/GAME_LOGIC.md`
的公式忠实还原，剧情全部去除。

## 运行

双击 `index.html` 即可（数据已内嵌，无需服务器）。

## 已还原的机制

| 机制 | 出处（反混淆证据） |
|---|---|
| 26 种武器属性 / 11 种炮塔价格 | `deobf/data/weapons.json` `structures.json`（typeData/structureData） |
| 44 波敌人配置 | `deobf/data/missions.json`（unitsMissions） |
| 12 种敌人底盘（速度/血量/赏金） | chassisData 表 |
| 溅射三段伤害（中心/中环/外环 20%） | fireOnEnnemi 伪代码 |
| 对空 ×4 伤害、只有机枪/导弹可锁直升机 | fireOnEnnemi + getTarget |
| 利息公式 `euros × (1 + interest/100)` | giveIntrest 伪代码 |
| 修理 2$/HP、出售 75% 按余血 | 原版教程对话 + keyDown 脚本 |
| 敌人抵达基地 = 失败（原版 `_y > 477`） | getFirstEA 伪代码 |
| 雷达零攻击（原版鸡肋设定的忠实还原） | typeData radar 全零 |

## 与原版的已知差异

- 路线坐标为重建占位（原版 parcourt 是舞台剪辑引用，数值待从 SWF 矩阵提取）
- 美术为占位矩形/圆（原版素材在 `decompiled/assets/images/` 可后续接入）
- 敌方武器为简化开火（原版走 OCEEF 43ms 循环）
- 未实现：Su-37 空袭、炮塔升级、小地图、音效（素材与公式已备齐，见 GAME_LOGIC.md）

## 文件

- `index.html` + `game.js` + `data.js` — 全部代码（无依赖）
- `smoke_test.js` — 无头逻辑冒烟测试（`node smoke_test.js`）
