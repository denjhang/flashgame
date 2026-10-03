#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析 DefineSprite 的完整帧序列: 每帧的 PlaceObject chid + FrameLabel 名称。
用于确定"静态 base 帧"与"fire 开火动画段"边界, 供 H5 炮管动画使用。
输出 deobf/data/sprite_frames.json
"""
import struct
import re
import json
from pathlib import Path

ROOT = Path(r"D:\working\vscode-projects\flashgame")
data = (ROOT / "TCS_uncompressed.swf").read_bytes()

DEFS = {}
for m in re.finditer(r'^([0-9a-f]{8}):\s+\d+\. (DefineSprite|DefineShape\w*|DefineBitsJPEG\d?|DefineBitsLossless\d?) \(chid: (\d+)\)\s+tagId=\s*(\d+) len=\s*(\d+)',
                     (ROOT / "swf_dump.txt").read_text(encoding='utf-8', errors='replace'), re.M):
    off = int(m.group(1), 16)
    tag, chid, ln = m.group(2), int(m.group(3)), int(m.group(5))
    hdr = 6 if ln > 62 or data[off + 2] & 0x3F == 0x3F else 2
    DEFS[chid] = (tag, off + hdr, ln)


def parse_sprite(body, size):
    """返回 [(frame_no, label_or_None, [chid...]), ...]"""
    p = body + 4           # 跳过 spriteId(2) + frameCount(2)
    end = body + size
    frame = 1
    frames = {}            # frame -> {'label': str|None, 'objs': [chid]}
    frames[1] = {'label': None, 'objs': []}
    while p < end - 1:
        hdr = struct.unpack_from('<H', data, p)[0]; p += 2
        code = hdr >> 6; ln = hdr & 0x3F
        if ln == 0x3F:
            ln = struct.unpack_from('<I', data, p)[0]; p += 4
        if code == 0:
            break
        if code == 43:                       # FrameLabel
            z = data.index(b'\x00', p)
            frames[frame]['label'] = data[p:z].decode('latin-1')
        elif code == 26 or code == 70:       # PlaceObject2 / PlaceObject3
            flags = data[p]
            q = p + 1
            q += 2                           # depth
            cid = None
            if flags & 2:                    # HasCharacter
                cid = struct.unpack_from('<H', data, q)[0]; q += 2
            if flags & 0x08: q += 2          # HasMatrix (近似: 实际变长, 这里只取 chid 够用)
            if cid:
                frames[frame]['objs'].append(cid)
        elif code == 1:                      # ShowFrame
            frame += 1
            frames.setdefault(frame, {'label': None, 'objs': []})
        p += ln
    return [(f, frames[f]['label'], frames[f]['objs']) for f in sorted(frames)]


if __name__ == '__main__':
    import sys
    ids = [int(a) for a in sys.argv[1:]] or [122]
    out = {}
    for sid in ids:
        if sid not in DEFS or DEFS[sid][0] != 'DefineSprite':
            continue
        _, body, size = DEFS[sid]
        fr = parse_sprite(body, size)
        out[str(sid)] = {
            'total': max(f for f, _, _ in fr) if fr else 0,
            'frames': [{'f': f, 'label': lab, 'objs': objs} for f, lab, objs in fr],
        }
        labs = [(f, lab) for f, lab, _ in fr if lab]
        print(f"sprite {sid}: 总帧 {out[str(sid)]['total']}, 标签 {labs}")
    if len(sys.argv) > 1:
        p = ROOT / 'deobf' / 'data' / 'sprite_frames.json'
        old = json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
        old.update(out)
        p.write_text(json.dumps(old, ensure_ascii=False, indent=1), encoding='utf-8')
        print("written", p)
