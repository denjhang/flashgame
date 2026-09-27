# 游戏资源完整清单

从反编译后的 SWF 文件中提取了所有资源，包括声音、动画、图像、形状、字体、地图元素、UI 控件和脚本代码。

---

## 一、声音资源（51 个）

全部文件位于 `D:\working\vscode-projects\flashgame\decompiled\sounds\`，按类别整理：

### 武器音效
| ID | 文件名 | 用途 |
|----|--------|------|
| 446 | `446_c75mm.mp3` | 75mm 炮开火 |
| 447 | `447_c105mm1.mp3` | 105mm 炮开火（变体1） |
| 448 | `448_c105mm2.mp3` | 105mm 炮开火（变体2） |
| 449 | `449_c125mm.mp3` | 125mm 炮开火 |
| 453 | `453_crotale.mp3` | 响尾蛇导弹发射 |
| 463 | `463_gatling.mp3` | 加特林机枪 |
| 464 | `464_m60.wav` | M60 机枪 |
| 465 | `465_mlrs.mp3` | 多管火箭炮 |
| 471 | `471_selectionUnite.mp3` | 单位选择 |

### 爆炸音效
| ID | 文件名 | 用途 |
|----|--------|------|
| 454 | `454_explosion1.mp3` | 爆炸1 |
| 455 | `455_explosion2.mp3` | 爆炸2 |
| 456 | `456_explosion3.mp3` | 爆炸3 |
| 458 | `458_explosion5.mp3` | 爆炸5 |
| 459 | `459_explosion6.mp3` | 爆炸6 |
| 460 | `460_explosionCrotale.mp3` | 响尾蛇导弹爆炸 |
| 461 | `461_explosionLarge.mp3` | 大型爆炸 |
| 462 | `462_explosionMlrs.mp3` | 多管火箭炮爆炸 |
| 279 | `279_explosion` | 爆炸动画关联声音 |

### 金属碰撞/溅射音效
| ID | 文件名 | 用途 |
|----|--------|------|
| 481 | `481_metal1.mp3` | 金属碰撞1 |
| 482 | `482_metal2.mp3` | 金属碰撞2 |
| 467 | `467_ricochet1.mp3` | 跳弹1 |
| 468 | `468_ricochet2.mp3` | 跳弹2 |
| 469 | `469_ricochet3.mp3` | 跳弹3 |
| 470 | `470_ricochet4.mp3` | 跳弹4 |

### 移动音效
| ID | 文件名 | 用途 |
|----|--------|------|
| 476-479 | `476-479_uniteMoveLight[1-4].mp3` | 轻型单位移动 |
| 473-475 | `473-475_uniteMoveHeavy[1-3].mp3` | 重型单位移动 |

### 杂项音效
| ID | 文件名 | 用途 |
|----|--------|------|
| 430 | `430_b01.mp3` | 音效 b01 |
| 431-439 | `431_b03.mp3` - `439_b11.mp3` | 杂项音效（b03-b11） |
| 441-445 | `441_b13.mp3` - `445_b17.mp3` | 杂项音效（b13-b17） |
| 450 | `450_boutonScroll.mp3` | 按钮滚动 |
| 451 | `451_cannot.mp3` | 无法操作错误音 |
| 452 | `452_creationUnite.mp3` | 单位创建 |
| 763-1157 | 编号声音 | 未知用途 |

---

## 二、动画精灵（Sprites）— 游戏动画与场景

全部文件位于 `D:\working\vscode-projects\flashgame\decompiled\sprites\`，共 172 个（76 个带图形的游戏精灵 + 96 个包含逻辑的精灵）。

### 游戏功能精灵（带图像）
| ID | 名称 | 用途 |
|----|------|------|
| 52 | `pointUnitRadar` | 雷达瞄准点 |
| 185 | `structure` | 建筑结构/防御塔 |
| 279 | `explosion` | 爆炸动画 |
| 300-307 | — | 地图场景精灵（8 个） |
| 360-368 | — | 地图地形/场景精灵（9 个） |
| 426-428 | — | 地图单位精灵 |
| 497 | `facette` | 地形块面 |
| 637 | `flame` | 火焰效果 |
| 638 | — | 风/气效果 |
| 656-659 | — | UI 小元素 |
| 742, 762 | — | 地图精灵 |
| 793 | — | 空袭飞机精灵（Su-37） |
| 834 | — | 空袭执行精灵 |
| 979 | — | 地图精灵 |
| 其他编号 2-178 等 | — | 游戏内各种精灵（车辆、坦克、背景等） |

### 逻辑脚本精灵（ActionScript 密集）
| ID | 名称 | 用途 |
|----|------|------|
| 1025 | 12 帧多帧动画 | 动画序列 |
| 1026-1027 | 带 press/rollOver/rollOut | 炮塔选择按钮 |
| 1074 | 8 层嵌套精灵 | 单位选择菜单 |
| 1079 | 带 turret 1000 和 1078 | 炮塔射击 UI |
| 1103 | 多帧炮塔放置 | 炮塔建造逻辑 |
| 1125 | 336 帧动画 | 长动画序列 |
| 1132 | 30 帧动画 | 短动画序列 |
| 1141 | 多帧 DoAction | 复杂逻辑 |
| 1151 | 8 个 turret 精灵 | 炮塔选择面板 |

---

## 三、图像资源（197 个文件）

全部位于 `D:\working\vscode-projects\flashgame\decompiled\assets\images\`，PNG/JPG 格式，ID 范围 60-946。

### 大型场景/背景
| 文件 | 大小 | 用途 |
|------|------|------|
| 671.png | 113KB | 场景背景 |
| 674.png | 125KB | 场景背景 |
| 680.png | 80KB | 场景背景 |
| 769.png | 134KB | 场景背景 |
| 640.jpg | 30KB | 场景背景 |
| 642.png | 47KB | 场景背景 |
| 764.jpg | 296KB | 大型场景 |
| 839.jpg | 16KB | 背景 |
| 841.jpg | 21KB | 背景 |
| 843.jpg | 26KB | 背景 |

### 单位部件精灵（大量帧动画）
| 文件范围 | 大小 | 说明 |
|----------|------|------|
| 823-831.png | 78-184KB | 单位精灵帧（坦克/车辆） |
| 872-946.png | 55-199KB | 单位部件（40+ 帧，每单位 40+ 帧动画） |

---

## 四、字体资源（7 个字体文件）

`D:\working\vscode-projects\flashgame\decompiled\assets\fonts\`：

| ID | 文件名 | 字体名 | 用途 |
|----|--------|--------|------|
| 3 | `3_Courier New.ttf` | Courier New | 等宽字体（代码/信息） |
| 41 | `41_Arial.ttf` | Arial | 通用字体 |
| 45 | `45_Arial.ttf` | Arial | Arial 备用 |
| 510 | `510_Courier New.ttf` | Courier New | Courier New 备用 |
| 660 | `660_arial.ttf` | Arial | Arial 小字号 |
| 957 | `957_tahoma.ttf` | Tahoma | 小字号 UI 字体 |
| 968 | `968_Armalite Rifle.ttf` | **Armalite Rifle** | 军事主题装饰字体 |

---

## 五、SVG 形状（370+ 个文件）

`D:\working\vscode-projects\flashgame\decompiled\assets\shapes\`，ID 范围 1-947。

### 大型地图/地形形状
| 文件 | 大小 | 用途 |
|------|------|------|
| 67.svg | 331KB | 大型形状 |
| 669.svg | 96KB | 场景元素 |
| 672.svg | 152KB | 场景元素 |
| 675.svg | 168KB | 场景元素 |
| 765.svg | 396KB | 地图/地形形状 |
| 832.svg | 1.6MB | 详细地形/景观（最大形状） |
| 873-879.svg | 100-184KB | 单位形状 |
| 880-947.svg | 56-199KB | 单位帧详细矢量 |

---

## 六、帧图像序列（6 个文件）

`D:\working\vscode-projects\flashgame\decompiled\assets\frames\`：

| 文件 | 大小 | 说明 |
|------|------|------|
| 1.png | 23KB | 帧图像 |
| 2.png | 11KB | 帧图像 |
| 3.png | 3KB | 帧图像 |
| 4.png | 3KB | 帧图像 |
| 5.png | 3KB | 帧图像 |
| 6.png | 915KB | 大型帧图像（背景场景） |

---

## 七、地图/关卡资源（DefineSprite）

基于精灵命名推断的地图元素：
- **DefineSprite_185_structure** — 建筑结构（地图上的防御点）
- **DefineSprite_300-307** — 地图场景序列（8 个帧）
- **DefineSprite_360-368** — 地形块/地图元素
- **DefineSprite_426-428** — 地图上的单位
- **DefineSprite_497_facette** — 地形块面
- **DefineSprite_742, 762** — 地图精灵
- **DefineSprite_793** — 空袭地图（Su-37 飞行路径）
- **DefineSprite_834** — 地图爆炸效果

---

## 八、UI 界面元素

### 炮塔选择面板
- **DefineSprite_1026** (帧 1-4) — 带 press/rollOver/rollOut 的按钮
- **DefineSprite_1027** — 4 个炮塔精灵 (1026_1, 1026_3, 1026_5, 1026_7)，每个都有 press/rollOver/rollOut

### 单位选择菜单
- **DefineSprite_1074** — 8 层嵌套精灵 (1040,1046,1053,1058,1063,1068,1073)，每个有 3 帧状态
- **DefineSprite_1079** — 带 turret 1000 和 1078 的复杂交互
- **DefineSprite_1151** — 8 个 turret 精灵 (1145_5,1145_8,1145_11,1145_14) 的炮塔选择面板

### 其他 UI
- **DefineSprite_1103** — 炮塔放置的多帧状态
- **DefineSprite_1085** — 8 帧菜单动画
- **DefineSprite_1123** — 单位选择菜单
- **DefineSprite_1150** — 带 DoAction 的菜单
- **DefineSprite_279** — 爆炸 UI 覆盖
- **DefineSprite_637** — 火焰特效
- **DefineSprite_656-659** — 小 UI 元素

### 按钮脚本
- **DefineButton2_653** — 按钮 press 事件
- **DefineButton2_979** — 按钮 press 事件

---

## 九、脚本代码文件

全部位于 `D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\`，按 DefineSprite ID 组织。

### 脚本类型
- `DoAction.as` — 帧级 ActionScript
- `CLIPACTIONRECORD on(press).as` — 按钮按下处理
- `CLIPACTIONRECORD on(rollOver).as` — 鼠标悬停处理
- `CLIPACTIONRECORD on(rollOut).as` — 鼠标离开处理
- `CLIPACTIONRECORD onClipEvent(load).as` — 精灵加载处理
- `BUTTONCONDACTION on(press).as` — 按钮条件动作

### 关键逻辑文件
| 文件路径 | 内容 |
|----------|------|
| `DefineSprite_174/frame_1/PlaceObject2_173_1/...` | 武器定义（typeData） |
| `DefineSprite_185_structure/frame_1/PlaceObject2_86_1/...` | 结构价格（structureData） |
| `DefineSprite_980/frame_6/PlaceObject2_980_242/...` | 全部剧情对话脚本 |
| `DefineSprite_793/frame_1/PlaceObject2_786_1/...` | Su-37 空袭逻辑 |
| `DefineSprite_834/frame_1/PlaceObject2_785_17/...` | 空袭执行（导弹投掷） |
| `DefineSprite_400_obus/frame_1/...` | 导弹飞行逻辑 |
| `DefineSprite_6/frame_6/PlaceObject2_6_329/...` | 敌人任务波次（unitsMissions） |
