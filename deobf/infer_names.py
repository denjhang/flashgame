#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
乱码名(u标记)自动语义推断
从用法上下文收集证据, 为每个乱码名生成语义候选名并应用。
证据规则:
  - 对象被赋 structureData 已知值序列(cost/range) → turretInfo<N>
  - 对象调用 swapDepths/gotoAndStop("lock")    → 按钮剪辑
  - eval(NAME) 作为 GetVariable 目标且持有已知全局属性 → 已知管理器
"""
import re
import json
from pathlib import Path
from collections import defaultdict

AS = Path(r"D:\working\vscode-projects\flashgame\deobf\scripts")

# 已知数值签名
COSTS = {80: 'm60', 120: 'm60', 220: 'canon75/crotale/radar', 280: 'canon105',
         300: 'canon105D/MTHEL', 240: 'canon125', 320: 'MLRS', 600: 'pluton'}
RANGES = {350: 'm60系', 380: 'gatling', 480: 'canon75', 620: 'canon105系',
          800: 'crotale/MTHEL', 1200: 'canon125', 1300: 'MLRS', 10000: 'pluton'}
DEPTHS = {999: 'carte', 30001: 'su37层', 50000: 'minimap层', 100000: 'UI层'}

members = defaultdict(lambda: defaultdict(int))   # name -> member -> count
numassign = defaultdict(list)                     # name -> [被赋的数值]
callsig = defaultdict(lambda: defaultdict(int))   # name -> 方法名 -> count
usage_count = defaultdict(int)
filectx = defaultdict(set)

PAT_MEMBER_W = re.compile(r'eval\("((?:u\d+)[^"]*)"\)\["([^"]+)"\]')     # X["m"]
PAT_ASSIGN_NUM = re.compile(r'eval\("((?:u\d+)[^"]*)"\)\["([^"]+)"\] = (-?\d+)')
PAT_CALL = re.compile(r'eval\("((?:u\d+)[^"]*)"\)\["([^"]+)"\]\(')
PAT_VAR = re.compile(r'set\("((?:u\d+)[^"]*)",')

for p in AS.rglob('*.as'):
    t = p.read_text(encoding='utf-8-sig', errors='replace')
    short = '/'.join(p.parts[-3:-1])
    for m in PAT_MEMBER_W.finditer(t):
        name, mem = m.group(1), m.group(2)
        members[name][mem] += 1
        usage_count[name] += 1
        filectx[name].add(short)
    for m in PAT_ASSIGN_NUM.finditer(t):
        numassign[m.group(1)].append((m.group(2), int(m.group(3))))
    for m in PAT_CALL.finditer(t):
        callsig[m.group(1)][m.group(2)] += 1
    for m in PAT_VAR.finditer(t):
        usage_count[m.group(1)] += 1
        filectx[m.group(1)].add(short)

report = []
auto_renames = {}
for name, mems in sorted(members.items(), key=lambda x: -usage_count[x[0]]):
    top = sorted(mems.items(), key=lambda x: -x[1])[:6]
    topcalls = sorted(callsig.get(name, {}).items(), key=lambda x: -x[1])[:4]
    nums = numassign.get(name, [])[:6]
    report.append({
        'name': name,
        'uses': usage_count[name],
        'files': sorted(filectx[name])[:3],
        'members': dict(top),
        'calls': dict(topcalls),
        'numassigns': nums,
    })

(AS.parent / 'garbled_evidence.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
print('乱码名总数:', len(report))
for r in report[:12]:
    print(r['uses'], r['name'][:30], '→', r['members'], r['numassigns'][:3])
