#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""乱码成员名重命名 (字面转义形式匹配)"""
from pathlib import Path

AS = Path(r"D:\working\vscode-projects\flashgame\deobf\scripts")
MEM = {
    "u176u200": "range",
    "u208\\x18": "costUpgraded",     # 文件中为字面 \x18 文本
    "u184u150": "costUpgraded",
    "u227u": "costUpgraded",
    "u214(u147": "range",
    "u135u159u181u242": "range",
    "u186u204": "costBase",
    "u154u203D<": "offscreenX",
    "u186\\tu141)": "offscreenY",
}
changed = applied = 0
for p in AS.rglob('*.as'):
    t = p.read_text(encoding='utf-8-sig', errors='replace')
    t2 = t
    for old, new in MEM.items():
        a = '["%s"]' % old
        b = '["%s"]' % new
        c = t2.count(a)
        if c:
            applied += c
            t2 = t2.replace(a, b)
    if t2 != t:
        p.write_text(t2, encoding='utf-8', newline='\n')
        changed += 1
print('更新文件: %d, 替换成员引用: %d' % (changed, applied))
