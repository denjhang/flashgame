#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
递归解析 DefineSprite 的 帧→PlaceObject→chid 树, 输出结构账本
定义表: chid -> (type, body_off, size)
"""
import struct
import json
import re
from pathlib import Path

data = (Path(r"D:\working\vscode-projects\flashgame") / "TCS_uncompressed.swf").read_bytes()

DEFS = {}   # chid -> (tagname, body, size)
for m in re.finditer(r'^([0-9a-f]{8}):\s+\d+\. (DefineSprite|DefineShape|DefineBitsJPEG2|DefineBitsLossless2|DefineBitsJPEG3|DefineBitsLossless) \(chid: (\d+)\)\s+tagId=\s*(\d+) len=\s*(\d+)',
                     (ROOT := Path(r"D:\working\vscode-projects\flashgame"), ROOT / "swf_dump.txt")[1].read_text(encoding='utf-8', errors='replace'), re.M):
    off = int(m.group(1), 16)
    tag = m.group(2)
    chid = int(m.group(3))
    ln = int(m.group(5))
    hdr = 6 if data[off + 2] & 0x3F == 0x3F or ln > 62 else 2
    # 长格式判定: len 显示的是真实长度; FFDec 对 >62 用长格式
    hdr = 6 if ln > 62 or data[off + 2] & 0x3F == 0x3F else 2
    DEFS[chid] = (tag, off + hdr, ln)

def frames_objects(body, size):
    p = body + 4
    end = body + size
    frame = 1
    objs = {}
    while p < end - 1:
        hdr = struct.unpack_from('<H', data, p)[0]; p += 2
        code = hdr >> 6; ln = hdr & 0x3F
        if ln == 0x3F:
            ln = struct.unpack_from('<I', data, p)[0]; p += 4
        if code == 0:
            break
        if code == 26:
            flags = data[p]
            q = p + 1
            q += 2
            cid = None
            if flags & 2:
                cid = struct.unpack_from('<H', data, q)[0]; q += 2
            if cid:
                objs.setdefault(frame, []).append(cid)
        if code == 1:
            frame += 1
        p += ln
    return objs

def walk(chid, depth=0, seen=None):
    if seen is None: seen = set()
    if chid in seen or depth > 4:
        return f"{'  '*depth}[{chid}] (recursion)"
    seen = seen | {chid}
    if chid not in DEFS:
        return f"{'  '*depth}[{chid}] (not defined)"
    tag, body, size = DEFS[chid]
    if tag != 'DefineSprite':
        return f"{'  '*depth}[{chid}] {tag}"
    objs = frames_objects(body, size)
    lines = [f"{'  '*depth}[{chid}] DefineSprite frames={max(objs) if objs else 0}:"]
    for f in sorted(objs):
        kids = ', '.join(str(c) for c in objs[f])
        lines.append(f"{'  '*(depth+1)}f{f}: {kids}")
        if f <= 3 or depth == 0:
            for c in objs[f]:
                if c in DEFS and DEFS[c][0] == 'DefineSprite':
                    lines.append(walk(c, depth + 2, seen))
    return '\n'.join(lines)

if __name__ == '__main__':
    import sys
    for chid in [int(a) for a in sys.argv[1:]] or [426]:
        print(walk(chid))
        print()
