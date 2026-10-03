# 乱码标识符语义重命名 — 证据笔记 (第 5 轮完成)

混淆器把对象名/方法名/属性名替换为非 UTF-8 字节串（postprocess 后显示为 `uN` 标记）。
原名不可恢复，按用法证据推断语义。**先修常量池切换错位（v2 resolver），再推断命名**——
错位修复后乱码名从 193 个降到 60 个对象名 + 23 个成员名，且用法证据变得可靠。

## 已应用的重命名

### 对象名（89 处，`deobf/apply_renames.py`）

| 乱码名 | 语义名 | 证据 |
|---|---|---|
| `u191u163` `u174u168u229` | `_root` | 持有 carte/indicateurMiniMap/viseurMiniMap/master_pointeur/master_sounds——全部是 GAME_LOGIC G 节确认的 _root 对象 |
| `u170.u215` | `swapDepths` | 调用参数 999/50000/50004/50001 精确匹配 depth 层级表 |
| `u239u209` | `turretInfo_m60` | cost=120(80/120)、range=350、name="m60" 与 structureData/typeData 精确吻合 |
| `u194u194b` | `turretInfo_crotale` | costUp=1000、range=800 匹配 crotale (220,1000)/(800) |
| `u223.u214` | `structureClip` | 持有 etatJauge/_x/_y（炮塔血条结构） |
| `u216!N` `u171\x0eu173u215` `u251u234P` | `obusShell`/`2`/`3` | 持有 decalY/decalX/distance/puissance（炮弹飞行参数，Su37 导弹同款字段） |
| `u189u230u178` | `minimapCursorClip` | 持有 viseurMiniMap |
| `u246&\x18t` | `hiddenUiClip` | _x=-400 移出屏幕隐藏的 UI 元素 |
| `u140\x16u128` `u239u199u97` | `soundUiClip`/`2` | 持有 master_sounds |
| `u155u180u132` | `menuDepthClip` | 与深度管理剪辑组一起调 swapDepths |

### 成员名（9 处，`deobf/rename_members.py`）

| 乱码名 | 语义名 | 证据 |
|---|---|---|
| `u176u200` `u135u159u181u242` `u214(u147` | `range` | 被赋 350/800/620，精确匹配对应武器 typeData 射程 |
| `u208\x18` `u184u150` `u227u` | `costUpgraded` | 被赋 300/420/540，精确匹配 structureData 升级价 |
| `u186u204` | `costBase` | 被赋 80（m60 基础价） |
| `u154u203D<` `u186\tu141)` | `offscreenX`/`offscreenY` | 被赋 -400/-900（移出屏幕坐标） |

## 保留原名（约 51 个对象名 + 14 个调用型方法名）

全部证据归档：
- `deobf/garbled_evidence.json` — 对象名：用途、成员、被赋数值、所在文件
- `deobf/garbled_members.json` — 成员名：宿主对象、数值签名、是否方法

保留原因：调用型方法名（`X["u136&cO"](...)`）无数值签名可校验，乱猜名字比保留
乱码名更危险；其余低频对象名每个仅出现 1-3 次，集中在单文件的 UI 胶水代码。
两者均不影响玩法逻辑（玩法层的全部对象/成员已命名）。
