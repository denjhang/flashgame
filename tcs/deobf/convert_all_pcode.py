#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""全量 pcode → 伪代码库"""
import sys
sys.path.insert(0, r'D:\working\vscode-projects\flashgame\deobf')
from pcode2as import convert_function
from pathlib import Path

ROOT = Path(r'D:\working\vscode-projects\flashgame\deobf\pcode\scripts')
OUT = Path(r'D:\working\vscode-projects\flashgame\deobf\pcode_as')
OUT.mkdir(exist_ok=True)

ok = fail = empty = 0
fails = []
total_funcs = 0
for p in sorted(ROOT.rglob('*.pcode')):
    rel = p.relative_to(ROOT)
    try:
        text = convert_function(p)
        n = text.count('// ===== function')
        if n == 0:
            empty += 1
            continue
        dst = OUT / (str(rel).replace('/', '__') + '.pseudo.txt')
        dst.write_text(text, encoding='utf-8', newline='\n')
        ok += 1
        total_funcs += n
    except Exception as e:
        fail += 1
        fails.append((str(rel), repr(e)[:80]))
print('ok=%d empty=%d fail=%d functions=%d' % (ok, empty, fail, total_funcs))
for f in fails[:15]:
    print(' FAIL', f[0], f[1])
