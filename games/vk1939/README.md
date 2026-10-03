# VK 1939 反编译档案（Kongregate 版）

## 来源

- 页面: https://www.kongregate.com/en/games/kajika/vk-1939 （game_id = 30979）
- SWF: `游戏swf/vk_1939_agame_com.swf`（4.4 MB, CWS/Flash 9）
  - 原始 URL: `https://chat.kongregate.com/gamez/0003/0979/live/vk_1939_agame_com.swf?kongregate_game_version=1228455208`
  - 嵌入页标注原始尺寸 650×500
- 文件名显示这是 **AGame 渠道包**（`_agame_com` 后缀），非源头版本，带多语言/门户检测逻辑（`language.as`，按 LocalConnection.domain 选择语言包）。
- 广告 SDK: MochiAd（game_id `f8866f7136289fb5`，早已失效，可直接剔除）。

## 导出产物（ffdec 22.0.2）

```
vk1939/decompiled/scripts/   187 个 AS3 脚本
vk1939/decompiled/images/    166 张图 (4.1M)
vk1939/decompiled/shapes/    357 个 SVG (7.4M)
vk1939/decompiled/sounds/    25 个音效 (2.7M)
vk1939/decompiled/sprites/   2323 个 sprite 帧图 (106M)
```

## 混淆评估：基本未混淆

与 TCS.swf 不同，本包**无需 deobf 流水线**：

- 类名/变量名全部可读（`documentClass`、`enemy1`、`tower1`…），无乱码标识符。
- AS3 源码由 ffdec 直接完整还原，`deobf/` 下的 pcode/重命名工具不适用。
- 唯一的"脏"东西是渠道逻辑（`language.as` 的门户/域名多语言切换），不是混淆。

## 代码结构

- `documentClass.as`（7138 行）：全部核心逻辑，**时间轴驱动**——`frame1/2/3/4()` 对应主 SWF 四帧（加载/菜单/游戏/结算），另有 `updateUpgrade`、`updateStars`、`updateString`、`buy` 等。
- 单位类都是 30 行左右的轻量 MovieClip 壳：`enemy1-3`、`troop1-3`、`tower1-3`、`tank1/2`、`plane`、`helicopter`、`airship`、`truck1`、`bullet1-4`、`rocket1`、`radar`、`hostage1`、`vip1` 等。
- `sfx1-16` / `mysf1-10`：声音与贴图资源类。
- `org.flintparticles.*`：开源粒子库（未改动），`MochiAd`：广告库。

## 与 TCS 项目的差异提示

此 AGame 版与 Kongregate 原发版可能有语言/品牌差异；如需比对经济表/波表数据，注意 `documentClass` 里数据可能以帧内嵌对象数组存在，建议后续用 `tools/` 下的提取脚本改造。
