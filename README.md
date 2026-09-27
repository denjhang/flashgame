# flashgame — Flash 小游戏反编译与 H5 翻新工作区

反编译 Flash 游戏 → 提取数据与玩法逻辑 → HTML5 重制。
每个游戏一个子文件夹。

## 游戏

### [领土防御 Territory Defense](territory-defense/) 
原作《The Commander's Sister》的 H5 重制。去除全部剧情，忠实还原玩法，
并加入新设定：**战争迷雾**（塔提供射程外一小圈视野，雷达站消除 1200 范围迷雾，
建造不受视野限制）与**对空升级**（任意塔付费解锁对空）。

反编译依据（本地保留，不入库）：`decompiled/`、`deobf/`（玩法公式见
`deobf/GAME_LOGIC.md`，数据 JSON 见 `deobf/data/`）。

## 工作流约定

- 大体积产物（SWF、反编译输出、反混淆输出、工具）全部 `.gitignore`，只保留游戏本体
- 每个游戏文件夹自带可运行入口（index.html）与无头冒烟测试（`node smoke_test.js`）

## 工具（本地）

- `ffdec/` — JPEXS Flash Decompiler（CLI 可用）
- `deobf/deobfuscate.py` — AS2 状态机还原（343/343 全成功）
- `deobf/pcode2as.py` — AVM1 字节码 → 伪代码
- `deobf/extract_pool_428.py` — SWF 二进制 DoAction/ConstantPool 解析器
