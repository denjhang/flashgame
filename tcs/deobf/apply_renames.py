#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""应用有硬证据的乱码名语义重命名"""
import json
from pathlib import Path

AS = Path(r"D:\working\vscode-projects\flashgame\deobf\scripts")

# 硬证据命名 (见 garbled_evidence.json)
RENAMES = {
    # 持有 carte/indicateurMiniMap/viseurMiniMap/master_* → _root
    "u191u163": "_root",
    "u174u168u229": "_root",
    # swapDepths 调用者(999/50000/50004 depth) → _root 成员/深度剪辑
    "u170.u215": "swapDepths",
    "u155u180u132": "menuDepthClip",
    # cost=120/range=350/name=m60 精确匹配 structureData.m60+typeData.m60
    "u239u209": "turretInfo_m60",
    # costUp=1000/range=800 匹配 crotale (220,1000)/(800)
    "u194u194b": "turretInfo_crotale",
    # 持有 etatJauge/_x/_y → 炮塔结构剪辑
    "u223.u214": "structureClip",
    # 持有 decalY/decalX/distance/puissance → 炮弹实例
    "u216!N": "obusShell",
    "u171\x0eu173u215": "obusShell2",
    "u251u234P": "obusShell3",
    # 持有 viseurMiniMap → 小地图光标
    "u189u230u178": "minimapCursorClip",
    # _x=-400 移出屏幕的 UI 元素
    "u246&\x18t": "hiddenUiClip",
    # 持有 master_sounds 的 UI 剪辑
    "u140\x16u128": "soundUiClip",
    "u239u199u97": "soundUiClip2",
}

changed = 0
applied = 0
for p in AS.rglob('*.as'):
    t = p.read_text(encoding='utf-8-sig', errors='replace')
    t2 = t
    for old, new in RENAMES.items():
        a = '"%s"' % old
        b = '"%s"' % new
        if a in t2:
            applied += t2.count(a)
            t2 = t2.replace(a, b)
    if t2 != t:
        p.write_text(t2, encoding='utf-8', newline='\n')
        changed += 1

print('更新文件: %d, 替换引用: %d' % (changed, applied))
