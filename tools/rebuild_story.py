# -*- coding: utf-8 -*-
"""重建 data.js 的 STORY: git HEAD 的 12 简报关 + emit_story.py 的 32 关 → 完整 44 关。"""
import io, json, subprocess

head = subprocess.check_output(['git', 'show', 'HEAD:territory-defense/data.js'],
                               encoding='utf8', errors='strict')
i = head.index('const STORY = {')
j = head.index('\n};', i)
story12 = head[i + len('const STORY = {'):j]

src = io.open(r'D:\working\vscode-projects\flashgame\tools\emit_story.py', encoding='utf8').read()
g = {}
exec(src.split('# 原版权威句数')[0], g)
S = g['S']

def js(m):
    parts = []
    for sp, tx in S[m]:
        parts.append('["%s",%s]' % (sp, json.dumps(tx, ensure_ascii=False)))
    return '%d: [\n' % m + ',\n'.join(parts) + ']'

block = ',\n'.join(js(m) for m in sorted(S))

p = r'territory-defense/data.js'
s = io.open(p, encoding='utf8').read()
anchor = "const STORY_NAMES = ["
k = s.index(anchor)
kend = s.index('];', k) + 2
newstory = '\nconst STORY = {' + story12 + block + '\n};\n'
s = s[:kend] + newstory + s[kend:]
io.open(p, 'w', encoding='utf8').write(s)
print('rebuilt: 12 + %d missions' % len(S))
