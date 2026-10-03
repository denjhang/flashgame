#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析 FFDec dumpSWF 的树形结构, 建立 DefineSprite 嵌套栈:
  1. 每个命名 PlaceObject2 的完整父链 (哪个 sprite 里放置)
  2. _root.carte(834) 子树内全部路点的最终矩阵
  3. 全部命名实例清单 (资源账本)
"""
import re
import json
from pathlib import Path

ROOT = Path(r"D:\working\vscode-projects\flashgame")
lines = (ROOT / "swf_dump.txt").read_text(encoding="utf-8", errors="replace").splitlines()

ROW = re.compile(
    r'^(?P<ind>[ ]*)(?P<off>[0-9a-f]{8}):\s+(?P<idx>\d+)\. (?P<tag>\w+)'
    r'(?: \(chid: (?P<chid>\d+), dpt: (?P<dpt>\d+)(?:, nm: (?P<nm>[^)]*))?\)|'
    r' \(chid: (?P<chid2>\d+)\))?')

stack = []           # [(indent, chid)] DefineSprite 栈
named = []           # 命名放置: {name, chid, dpt, off, parents}
alldef = []          # DefineSprite 清单

for ln in lines:
    m = ROW.match(ln)
    if not m:
        continue
    ind = len(m.group('ind'))
    tag = m.group('tag')
    chid = m.group('chid') or m.group('chid2')
    while stack and stack[-1][0] >= ind:
        stack.pop()
    if tag == 'DefineSprite':
        stack.append((ind, chid))
        alldef.append((chid, m.group('off')))
        continue
    if tag == 'PlaceObject2' and m.group('nm'):
        named.append({
            'name': m.group('nm').strip(),
            'chid': chid, 'dpt': m.group('dpt'),
            'off': m.group('off'),
            'parents': [c for _, c in stack],
        })

# ---- 路点: 父链含 834 的最终放置 ----
WP = re.compile(r'^(begin|t\d+|r\d+|g\d+|h\d+|e\d+)$')
wp_by_name = {}
for n in named:
    if WP.match(n['name']) and '834' in n['parents']:
        wp_by_name.setdefault(n['name'], []).append(n)

print("=== 父链含 carte(834) 的路点放置 ===")
for k in sorted(wp_by_name, key=lambda s: (s[0], int(s[1:]) if s[1:].isdigit() else 0)):
    for inst in wp_by_name[k]:
        print(" %-6s off=%s dpt=%s parents=%s" % (
            k, inst['off'], inst['dpt'], inst['parents']))

# ---- 多容器同名冲突检查 ----
conflict = {}
for n in named:
    if WP.match(n['name']):
        conflict.setdefault(n['name'], set()).update(n['parents'])
print("\n=== 同名路点出现在多个容器 ===")
for k, v in sorted(conflict.items()):
    if len(v) > 1:
        print(" %-5s 容器: %s" % (k, sorted(v)))

# ---- 全部命名实例 (资源账本摘要) ----
out = {
    "waypointPlacements": named if False else
        [n for n in named if WP.match(n['name'])],
    "allNamedCount": len(named),
}
(ROOT / "deobf/data/dump_tree.json").write_text(
    json.dumps({"named": named, "defineSprites": alldef},
               ensure_ascii=False, indent=1), encoding="utf-8")
print("\n命名实例总数:", len(named), "| DefineSprite 总数:", len(alldef))
print("已写 deobf/data/dump_tree.json")
