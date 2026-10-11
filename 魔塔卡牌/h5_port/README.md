# 魔塔卡牌 V0.1.6 — HTML5 原生移植版

来源：`mota_as3-V0.1.6/mota_as3-V0.1.6.fla`（Flash CS5.5 工程，解包为合法 XFL zip）
+ 同目录三个类源码 `玩家_class.as` / `招式_class.as` / `战斗系统_class.as`。

本目录是**纯 HTML5/JS 原生移植**（无 Flash、无模拟器）。`../h5/` 是备用方案
（Ruffle 加载原 SWF），不再维护。

## 运行

```
cd h5_port && python -m http.server 8234
# 打开 http://127.0.0.1:8234/index.html
```

## 文件

- `index.html` — 舞台 480×800（DOMDocument.xml `width="480" height="800" frameRate="60"`）。
  9 个页面 = 原主时间轴帧 1/2/3/4/5/20/60/61/62，全部元素坐标取自
  DOMDocument.xml 主场景对应帧的 matrix tx/ty（见下表）。
- `main.js` — 逻辑逐字段转写：
  - `招式` ← 招式_class.as
  - `玩家` ← 玩家_class.as（含 AI选角色/AI出招/AI出无需元气的招）
  - `战斗系统` ← 战斗系统_class.as（出招判定/攻防判定/战斗回合/胜负判定，消息文案逐字保留）
  - 全局实例与招式数组 ← DOMDocument_9.as（玩家生命5/AI生命15；运气耗-1、防御防1、砍攻2耗1、射箭攻2耗1）
  - 选招 mc 帧结构 ← 剑客招式选择_影片剪辑.xml（1-based 帧1空/帧2运气/帧3防御/帧4砍/帧5空，
    初始 gotoAndStop(4)，下标=currentFrame-2，越界 gotoAndStop 空操作）
- `assets/*.jpg` — 从 fla 中央目录按原名提取的原版手绘位图（14 张）。

## 关键对号引注

| H5 处 | 原文出处 |
|---|---|
| 按钮→页面跳转 1/2/3/4/5/20/60/61/62 | DOMDocument_0~5.as 各 gotoAndStop |
| 选角逻辑/AI随机/进入战斗 | DOMDocument_7.as（帧61脚本） |
| 出招按钮流程（判定→AI→攻防→回合→胜负→刷新） | DOMDocument_8.as（帧62脚本） |
| 角色图偏移 剑客(-71,-42.6)/射手(-59,-45.55)，元件原点 玩家(61,122)/AI(413.95,123) | 角色选择.xml frame1/2 + 主场景 index=60 |
| 选角卡片 剑客(0,288.35)/射手(3.85,429.35) | 主场景 index=60 DOMSymbolInstance matrix |
| 战斗页全部文本框坐标 | 主场景 index=61 各 DOMDynamicText name+matrix |
| THINKS 飘动（60fps 随机 480×800） | DOMDocument_6.as + thinks_mc F59 |

## 已知还原度取舍

- 按钮为 HTML/CSS 重绘（原版为 FLA 矢量按钮），文字与位置一致。
- 战斗画面/vs/thinks 元件为矢量+文字，按文字内容重排。
- 资料（F4/F5）页招式缩略图位置按原 matrix 中可解析者放置，
  个别重叠处做了少量手工排开（原版即重叠）。
