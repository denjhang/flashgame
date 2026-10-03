#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单位阴影预处理: 原版 _ombre sprite 在舞台上以 colorTransform 放置
  mult R=G=B=0, alpha=0.352   (从 SWF PlaceObject2 flags=0x1e 后的 CXFORM 二进制解码)
即: 显示颜色 = 纯黑, 显示 alpha = 图像 alpha × 0.352。
FFDec 导出的是未变换的中灰原图 (avg RGB≈85), H5 侧若只设 globalAlpha 会画成灰雾而非黑阴影。
本脚本按原版变换把 RGB 压为 0 (alpha 保留), 输出到 territory-defense/assets/ombre/。
alpha 的 0.352 倍在 game.js 绘制时用 globalAlpha=SHADOW_ALPHA 施加。
"""
from pathlib import Path
from PIL import Image

ROOT = Path(r"D:\working\vscode-projects\flashgame")
SRC = ROOT / "territory-defense" / "assets" / "ombre"

n = 0
for p in sorted(SRC.glob("DefineSprite_*_ombre/1.png")):
    im = Image.open(p).convert("RGBA")
    r, g, b, a = im.split()
    black = Image.new("L", im.size, 0)
    out = Image.merge("RGBA", (black, black, black, a))
    out.save(p)
    n += 1
    print(f"  {p.parent.name}: RGB→0, alpha 保留")
print(f"处理 {n} 个单位阴影 (RGB 压黑; alpha×0.352 由 game.js 的 SHADOW_ALPHA 施加)")
