#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 SWF 二进制直接解析 DefineSprite_428 frame_39 的 DoAction ConstantPool
(action 0x88), 绕过 FFDec pcode 导出不完整的问题。
"""
import struct
from pathlib import Path

SWF = Path(r"D:\working\vscode-projects\flashgame\TCS_uncompressed.swf")

data = SWF.read_bytes()
pos = 0
assert data[:3] in (b'FWS', b'CWS'), 'not a swf'
ver = data[3]
pos = 8
# RECT: Nbits = 5 bits, 4 fields
nbits = (data[pos] >> 3) & 0x1F
rect_bits = 5 + nbits * 4
pos += (rect_bits + 7) // 8
pos += 4  # framerate + framecount
print('tags start at', pos)

def read_tags(buf, pos, end=None):
    """yield (code, payload_bytes)"""
    while pos < len(buf):
        hdr = struct.unpack_from('<H', buf, pos)[0]
        pos += 2
        code = hdr >> 6
        ln = hdr & 0x3F
        if ln == 0x3F:
            ln = struct.unpack_from('<I', buf, pos)[0]
            pos += 4
        yield code, buf[pos:pos + ln]
        pos += ln
        if code == 0:
            break

def parse_actions(buf):
    """yield (code, payload) for action records (leading flags byte for DoAction)"""
    pos = 0
    while pos < len(buf):
        code = buf[pos]
        pos += 1
        if code < 0x80:
            yield code, b''
            continue
        ln = struct.unpack_from('<H', buf, pos)[0]
        pos += 2
        yield code, buf[pos:pos + ln]
        pos += ln

def parse_pool(payload):
    n = struct.unpack_from('<H', payload, 0)[0]
    pos = 2
    items = []
    for _ in range(n):
        slen = struct.unpack_from('<H', payload, pos)[0]
        pos += 2
        items.append(payload[pos:pos + slen].decode('utf-8', errors='replace'))
        pos += slen
    return items

TARGET_SPRITE = 428
TARGET_FRAME = 39

for code, payload in read_tags(data, pos):
    if code == 39:  # DefineSprite
        sid = struct.unpack_from('<H', payload, 0)[0]
        if sid != TARGET_SPRITE:
            continue
        inner = payload[4:]
        frame = 0
        for icode, ipayload in read_tags(inner, 0):
            if icode == 1:  # ShowFrame
                frame += 1
                continue
            if icode == 12 and frame + 1 == TARGET_FRAME:  # DoAction
                print('found DoAction in sprite %d frame %d, %d bytes' %
                      (sid, frame + 1, len(ipayload)))
                out = []
                for acode, apayload in parse_actions(ipayload):
                    if acode == 0x88:
                        items = parse_pool(apayload)
                        print('ConstantPool: %d 项' % len(items))
                        out.append(items)
                if out:
                    import json
                    Path(r"D:\working\vscode-projects\flashgame\deobf").joinpath('pool_428_39.json').write_text(
                        json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
                    for i, pool in enumerate(out):
                        print('pool%d: %s...' % (i, pool[:6]))
                else:
                    print('无 ConstantPool action!')
                raise SystemExit
