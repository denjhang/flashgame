#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用 FFDec dumpSWF 给出的权威偏移解析路点 matrix。
同时解析 carte(834) 内背景位图 764 的放置矩阵 → 坐标系换算。
"""
import struct
import re
import json
from pathlib import Path

ROOT = Path(r"D:\working\vscode-projects\flashgame")
data = (ROOT / "TCS_uncompressed.swf").read_bytes()
dump = (ROOT / "swf_dump.txt").read_text(encoding="utf-8", errors="replace")

class R:
    def __init__(self, b, p=0):
        self.b = b; self.p = p; self.bit = 0
    def align(self):
        if self.bit:
            self.p += 1
            self.bit = 0
    def bits(self, n):
        v = 0
        for _ in range(n):
            v = (v << 1) | ((self.b[self.p + (self.bit >> 3)] >> (7 - (self.bit & 7))) & 1)
            self.bit += 1
        self.p += self.bit >> 3
        self.bit &= 7
        return v
    def sbits(self, n):
        v = self.bits(n)
        if n and v >> (n - 1): v -= 1 << n
        return v
    def u8(self):
        v = self.b[self.p]; self.p += 1; return v
    def u16(self):
        v = struct.unpack_from('<H', self.b, self.p)[0]; self.p += 2; return v

def matrix(r):
    r.align()
    sx = sy = rx = ry = None
    if r.bits(1):
        nx = r.bits(5); sx = r.sbits(nx) / 65536
        ny = r.bits(5); sy = r.sbits(ny) / 65536
    if r.bits(1):
        nx = r.bits(5); rx = r.sbits(nx) / 65536
        ny = r.bits(5); ry = r.sbits(ny) / 65536
    n = r.bits(5)
    tx = r.sbits(n) / 20
    ty = r.sbits(n) / 20
    return {"sx": sx, "sy": sy, "tx": tx, "ty": ty}

def parse_po2_at(off):
    hdr = struct.unpack_from('<H', data, off)[0]
    code = hdr >> 6
    ln = hdr & 0x3F
    body = off + 2
    if ln == 0x3F:
        ln = struct.unpack_from('<I', data, body)[0]
        body += 4
    r = R(data, body)
    flags = r.u8()
    depth = r.u16()
    cid = r.u16() if flags & 2 else None
    m = matrix(r) if flags & 4 else None
    return cid, depth, m

# 路点行: 偏移 + name
rows = re.findall(
    r'^([0-9a-f]{8}):\s+\d+\. PlaceObject2 \(chid: (\d+), dpt: (\d+), nm: (\w+)\)',
    dump, re.M)

waypoints = {}
for off_s, cid_s, dpt_s, name in rows:
    if not re.match(r'^(begin|t\d+|r\d+|g\d+|h\d+|e\d+)$', name):
        continue
    m = parse_po2_at(int(off_s, 16))
    if m and m[2]:
        # 同名多次放置: 后者覆盖 (文件顺序)
        waypoints[name] = {"chid": m[0], "depth": m[1],
                           "x": round(m[2]["tx"], 1), "y": round(m[2]["ty"], 1),
                           "scaleX": m[2]["sx"], "scaleY": m[2]["sy"]}

out = {k: waypoints[k] for k in sorted(waypoints,
       key=lambda s: (s[0], int(s[1:]) if s[1:].isdigit() else 0))}

# carte(834) 在主时间轴的矩阵 + 背景位图 764 在 834 内的矩阵
carte_m = None
mm = re.search(r'^([0-9a-f]{8}):\s+\d+\. PlaceObject2 \(chid: 834, dpt: 3, nm: carte\)', dump, re.M)
if mm:
    carte_m = parse_po2_at(int(mm.group(1), 16))[2]

bmp = {}
for off_s, cid_s, dpt_s, name in re.findall(
        r'^([0-9a-f]{8}):\s+\d+\. PlaceObject2 \(chid: 764, dpt: (\d+)\)', dump, re.M):
    bmp = parse_po2_at(int(off_s, 16))[2]

result = {
    "_note": "路点=carte(chid834)内部坐标; carte 主时间轴矩阵与背景位图764矩阵用于坐标系换算",
    "carteTransform": carte_m,
    "background764": bmp,
    "waypoints": out,
}
(ROOT / "deobf/data/waypoints.json").write_text(
    json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")

print("carte 主时间轴矩阵:", carte_m)
print("背景位图 764 放置矩阵:", bmp)
print("路点数:", len(out))
for k, v in out.items():
    print(" %s (%s, %s)" % (k, v["x"], v["y"]))
