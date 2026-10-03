#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 deobf 还原源码提取 H5 重制所需核心数据 → deobf/data/*.json
  weapons.json   typeData (26 种武器属性)
  structures.json structureData (11 种炮塔价格)
  missions.json  unitsMissions (44 波) + parcourt (4 条路线)
  unitPhysics.json DefineSprite_428_unit 单位物理参数
"""
import re
import json
from pathlib import Path

ROOT = Path(r"D:\working\vscode-projects\flashgame\deobf")
OUT = ROOT / "data"
AS = ROOT / "scripts"

ARR = re.compile(r'new Array\(([^()]*)\)')


def read(rel):
    return (AS / rel).read_text(encoding='utf-8-sig', errors='replace')


def export_weapons():
    t = read("DefineSprite_174/frame_1/PlaceObject2_173_1/"
             "CLIPACTIONRECORD onClipEvent(load).as")
    data = {}
    # typeData["name"] = new Array(...) / typeData.name = new Array(...)
    for m in re.finditer(r'typeData(?:\["([^"]+)"\]|\.(\w+))\s*=\s*new Array\(([^)]*)\)', t):
        name = m.group(1) or m.group(2)
        vals = [v.strip() for v in m.group(3).split(',')]
        data[name] = [int(v) if v.lstrip('-').isdigit() else v for v in vals]
    meta = {
        "_comment": "typeData: [rotateSpeed因子(越小越快), range射程, damage伤害, nCanons炮管数, hp生命, impact冲击]",
        "fields": ["rotateSpeed", "range", "damage", "nCanons", "hp", "impact"],
        "data": data,
    }
    (OUT / "weapons.json").write_text(
        json.dumps(meta, indent=1), encoding='utf-8', newline='\n')
    return len(data)


def export_structures():
    t = read("DefineSprite_185_structure/frame_1/PlaceObject2_86_1/"
             "CLIPACTIONRECORD onClipEvent(load).as")
    data = {}
    for m in re.finditer(r'structureData(?:\["([^"]+)"\]|\.(\w+))\s*=\s*new Array\(([^)]*)\)', t):
        name = m.group(1) or m.group(2)
        vals = [int(v.strip()) for v in m.group(3).split(',')]
        data[name] = {"cost": vals[0], "costUpgraded": vals[1]}
    meta = {
        "_comment": "structureData: 建造价/升级价; 修理2$/HP; 出售75%按余血比例",
        "economy": {"repairPerHp": 2, "sellRatio": 0.75},
        "data": data,
    }
    (OUT / "structures.json").write_text(
        json.dumps(meta, indent=1), encoding='utf-8', newline='\n')
    return len(data)


def export_missions():
    t = read("frame_6/PlaceObject2_6_329/"
             "CLIPACTIONRECORD onClipEvent(load).as")
    # parcourt1 = Array(Array(x,y), ...)
    routes = {}
    for m in re.finditer(r'var (parcourt\d) = (Array\(.*?\));\n', t, re.S):
        name, expr = m.group(1), m.group(2)
        pts = re.findall(r'Array\(([^,]+),([^)]+)\)', expr)
        routes[name] = [{"x": a.strip(), "y": b.strip()} for a, b in pts]
    # unitsMissions = Array( wave, wave, ... )  wave = Array(units, route)
    m = re.search(r'unitsMissions = (Array\(.*?\));\n', t, re.S)
    waves = []
    if m:
        expr = m.group(1)
        # 顶层按 "),Array(Array(" 分割不可靠 → 用括号深度扫描
        body = expr[len('Array('):-1]
        depth = 0
        top = []
        cur = []
        i = 0
        while i < len(body):
            c = body[i]
            if c == '"':
                j = i + 1
                while j < len(body):
                    if body[j] == '\\':
                        j += 2
                        continue
                    if body[j] == '"':
                        break
                    j += 1
                cur.append(body[i:j + 1])
                i = j + 1
                continue
            if c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
            if c == ',' and depth == 0:
                top.append(''.join(cur))
                cur = []
            else:
                cur.append(c)
            i += 1
        if cur:
            top.append(''.join(cur))
        for w in top:
            units = re.findall(r'Array\("([^"]+)","([^"]+)"\)', w)
            route = re.search(r'parcourt(\d)', w)
            waves.append({
                "units": [{"type": a, "weapon": b} for a, b in units],
                "route": "parcourt" + route.group(1) if route else None,
            })
    meta = {
        "_comment": "unitsMissions: 44 波敌人; route 引用 parcourt 路线点(坐标为舞台影片剪辑引用)",
        "routes": routes,
        "waves": waves,
    }
    (OUT / "missions.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=1),
        encoding='utf-8', newline='\n')
    return len(waves), len(routes)


def export_unit_physics():
    """DefineSprite_428_unit frame_39: 单位物理参数 (常量池残留, 正则直取数值)"""
    p = AS / "DefineSprite_428_unit/frame_39/DoAction.as"
    if not p.exists():
        return 0
    t = p.read_text(encoding='utf-8-sig', errors='replace')
    # 形如: [...][KEY] = new §§constant(59)§(a,b,c,d,e);  KEY 是已解析名或残留
    entries = {}
    for m in re.finditer(r'(?:\.(\w+)|\["([^"]+)"\])\s*=\s*new .*?§\(([^()]*)\)', t):
        key = m.group(1) or m.group(2)
        vals = [v.strip() for v in m.group(3).split(',')]
        entries[key] = [float(v) if '.' in v else int(v) for v in vals]
    meta = {
        "_comment": "单位物理参数(DefineSprite_428_unit): 疑似 [质量?, 尺寸?, 装甲?, 血量?, 得分?] 待语义确认",
        "fields_guess": ["mass", "size", "armor", "life", "score"],
        "data": entries,
    }
    (OUT / "unitPhysics.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=1),
        encoding='utf-8', newline='\n')
    return len(entries)


def main():
    OUT.mkdir(exist_ok=True)
    n_w = export_weapons()
    n_s = export_structures()
    n_m, n_r = export_missions()
    n_p = export_unit_physics()
    print("weapons: %d | structures: %d | missions: %d waves, %d routes | unitPhysics: %d" %
          (n_w, n_s, n_m, n_r, n_p))


if __name__ == '__main__':
    main()
