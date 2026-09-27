#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 FFDec dumpSWF 文本 + SWF 二进制，解析炮塔库 (86 玩家 / 173 敌方 / 427 舰船)
每一帧的**权威**摆放布局。

关键: (chid, depth, name) 三者直接取 FFDec dump 文本 —— FFDec 已正确解码
PlaceObject2/3 的全部字段 (包括带 rotate 的 matrix 与 instance name)，
比手写二进制解析可靠。matrix 数值由二进制解析补充 (带 rotate 的 6 个用例
用 FFDec 语义独立校验)。

输出 deobf/data/turret_layout.json
"""
import struct
import json
import re
from pathlib import Path

ROOT = Path(r"D:\working\vscode-projects\flashgame")
DATA = (ROOT / "TCS_uncompressed.swf").read_bytes()
DUMP = (ROOT / "swf_dump.txt").read_text(encoding='utf-8', errors='replace')

DEFS = {}   # chid -> (tagName, body_offset, length)


def scan_tags():
    p = 8
    nbits = DATA[p] >> 3
    p += (5 + 4 * nbits + 7) // 8
    p += 4
    while p < len(DATA) - 1:
        hdr = struct.unpack_from('<H', DATA, p)[0]
        code = hdr >> 6
        ln = hdr & 0x3F
        p += 2
        if ln == 0x3F:
            ln = struct.unpack_from('<I', DATA, p)[0]
            p += 4
        body = p
        if code == 0:
            break
        if code == 39:
            DEFS[struct.unpack_from('<H', DATA, body)[0]] = ('DefineSprite', body, ln)
        elif code in (2, 22, 32, 83):
            DEFS[struct.unpack_from('<H', DATA, body)[0]] = ('DefineShape', body, ln)
        p = body + ln


scan_tags()


class BR:
    def __init__(self, base):
        self.base = base; self.p = 0; self.bit = 0

    def align(self):
        self.bit = 0

    def u8(self):
        self.align(); v = DATA[self.base + self.p]; self.p += 1; return v

    def u16(self):
        self.align(); v = struct.unpack_from('<H', DATA, self.base + self.p)[0]; self.p += 2; return v

    def ub(self, n):
        v = 0
        for _ in range(n):
            v = (v << 1) | ((DATA[self.base + self.p] >> (7 - self.bit)) & 1)
            self.bit += 1
            if self.bit == 8:
                self.bit = 0; self.p += 1
        return v

    def sb(self, n):
        if n == 0:
            return 0
        v = self.ub(n)
        return v - (1 << n) if (v >> (n - 1)) & 1 else v

    def fixed(self, n):
        return self.sb(n) / 65536.0

    def rect(self):
        self.align()
        n = self.ub(5)
        r = (self.sb(n), self.sb(n), self.sb(n), self.sb(n))
        self.align()
        return r

    def matrix(self):
        """MATRIX -> (a,b,c,d,tx,ty) twips; HasScale/HasRotate 标志各自独立"""
        a = d = 1.0; b = c = 0.0
        if self.ub(1):
            n = self.ub(5); a = self.fixed(n); d = self.fixed(n)
        if self.ub(1):
            n = self.ub(5); b = self.fixed(n); c = self.fixed(n)
        n = self.ub(5)
        tx = self.sb(n); ty = self.sb(n)
        self.align()
        return (a, b, c, d, tx, ty)


def shape_bounds(chid):
    if chid not in DEFS or DEFS[chid][0] != 'DefineShape':
        return None
    _, body, _ = DEFS[chid]
    b = BR(body); b.u16()
    xmin, xmax, ymin, ymax = b.rect()
    return (xmin, ymin, xmax, ymax)


# ---------- 从 dump 文本提取每个 sprite 的权威 tag 序列 ----------
DUMP_LINE = re.compile(
    r'^(?P<off>[0-9a-f]{8}):\s+(?P<seq>\d+)\.\s+(?P<tag>.+?)\s+tagId=\s*(?P<tid>\d+)\s+len=\s*(?P<len>\d+)')


def _sprite_span(chid):
    """
    返回 dump 中该 DefineSprite 的内部 tag 行区间 (start_idx, end_idx)。
    dump 的行号前缀是全局递增的 SWF 偏移, 故用「偏移必须落在本 sprite 的
    tag 字节范围内」判定边界 —— 比缩进可靠。
    """
    lines = DUMP.split('\n')
    start = None
    for i, l in enumerate(lines):
        if re.search(rf'DefineSprite \(chid: {chid}\)', l):
            start = i
            break
    if start is None:
        return None
    def off_of(line):
        m = re.match(r'^([0-9a-f]{8}):', line)
        return int(m.group(1), 16) if m else None
    base = off_of(lines[start])
    if base is None or chid not in DEFS:
        return None
    _, body, ln = DEFS[chid]
    # tag header 起点 = body - (6 长格式 / 2 短格式)
    hdr_len = 6 if struct.unpack_from('<H', DATA, body - 6)[0] & 0x3F == 0x3F else 2
    tag_start = body - hdr_len
    tag_end = body + ln
    end = start + 1
    for j in range(start + 1, len(lines)):
        o = off_of(lines[j])
        if o is None:
            continue
        if o >= tag_end:
            break
        end = j + 1
    return (start + 1, end)


def _iter_tags(chid):
    """yield (tag_name, args, offset) —— 仅本 sprite 内部的 tag"""
    span = _sprite_span(chid)
    if not span:
        return
    lines = DUMP.split('\n')
    for l in lines[span[0]:span[1]]:
        m = DUMP_LINE.match(l)
        if not m:
            continue
        tag = m.group('tag').strip()
        args = ''
        pa = tag.find('(')
        if pa >= 0:
            args = tag[pa + 1:tag.rfind(')')] if tag.rfind(')') > pa else tag[pa + 1:]
            tag = tag[:pa].strip()
        yield tag, args, int(m.group('off'), 16)


def parse_dump_frames(chid):
    """
    解析 sprite 内部 tag 序列 → {frame: {'label', 'place':[{chid,depth,name}]}}
    显示列表按 Flash 语义继承 (ShowFrame 复制上一帧)。
    """
    out = {1: {'label': None, 'place': []}}
    frame = 1
    for tag, args, _ in _iter_tags(chid):
        if tag == 'ShowFrame':
            frame += 1
            prev = out.get(frame - 1, {'place': []})
            out[frame] = {'label': None, 'place': [dict(x) for x in prev['place']]}
            continue
        out.setdefault(frame, {'label': None, 'place': []})
        if tag == 'FrameLabel':
            nm = re.search(r'name: (.+?)\s*$', args)
            if nm:
                out[frame]['label'] = nm.group(1).strip()
        elif tag.startswith('PlaceObject'):
            cid = re.search(r'chid: (\d+)', args)
            dpt = re.search(r'dpt: (\d+)', args)
            nm = re.search(r'nm: ([^\s,)]+)', args)
            if dpt is None:
                continue
            dv = int(dpt.group(1))
            if cid is None:
                # PlaceObject2 (dpt: N) = 仅移动/改属性, 保留原实例
                continue
            rec = {'chid': int(cid.group(1)), 'depth': dv,
                   'name': nm.group(1) if nm else None}
            out[frame]['place'] = [x for x in out[frame]['place'] if x['depth'] != dv]
            out[frame]['place'].append(rec)
        elif tag.startswith('RemoveObject'):
            dpt = re.search(r'dpt: (\d+)', args)
            if dpt:
                dv = int(dpt.group(1))
                out[frame]['place'] = [x for x in out[frame]['place'] if x['depth'] != dv]
    return out


# ---------- 二进制补 matrix (按 dump 给出的 tag 偏移) ----------
DUMP_OFF = re.compile(r'^([0-9a-f]{8}):\s+\d+\.\s+(PlaceObject\d?)\s+.*tagId=\s*(?:26|70)\s+len=\s*(\d+)')


def matrices_for_sprite(chid):
    """返回 {(frame, depth): matrix}，按 dump 偏移逐 tag 解析二进制 matrix"""
    res = {}
    frame = 1
    for tag, args, off in _iter_tags(chid):
        if tag == 'ShowFrame':
            frame += 1
            continue
        if not tag.startswith('PlaceObject'):
            continue
        code = 70 if tag == 'PlaceObject3' else 26
        b = BR(off + 2)
        # dump 偏移 = tag header 起点; 长格式需要再跳 4 字节长度字段
        if struct.unpack_from('<H', DATA, off)[0] & 0x3F == 0x3F:
            b = BR(off + 6)
        fl = b.u16() if code == 70 else b.u8()
        dv = b.u16()
        if fl & 2:
            b.u16()
        mat = b.matrix() if fl & 4 else (1.0, 0.0, 0.0, 1.0, 0, 0)
        res[(frame, dv)] = mat
    return res


def build_lib(chid):
    frames = parse_dump_frames(chid)
    if not frames:
        return None
    mats = matrices_for_sprite(chid)
    out = {'labels': {}, 'frames': {}}
    for f in sorted(frames):
        d = frames[f]
        if not d['place']:
            continue
        if d.get('label'):
            out['labels'][d['label']] = f
        place = []
        for p in sorted(d['place'], key=lambda x: x['depth']):
            cid = p['chid']
            m = mats.get((f, p['depth']), (1.0, 0.0, 0.0, 1.0, 0, 0))
            bnd = None
            is_spr = False
            if cid is not None and cid in DEFS:
                is_spr = DEFS[cid][0] == 'DefineSprite'
                bnd = shape_bounds(cid)
            place.append({
                'chid': cid, 'depth': p['depth'], 'name': p['name'],
                'isSprite': is_spr,
                'm': [round(m[0], 6), round(m[1], 6), round(m[2], 6), round(m[3], 6),
                      round(m[4] / 20.0, 3), round(m[5] / 20.0, 3)],
                'bounds': [round(v / 20.0, 3) for v in bnd] if bnd else None,
            })
        out['frames'][str(f)] = {'label': d.get('label'), 'place': place}
    return out


if __name__ == '__main__':
    out = {}
    for lib in (86, 173, 427):
        r = build_lib(lib)
        if not r:
            continue
        out[str(lib)] = r
        print(f"--- sprite {lib}: {len(r['frames'])} 帧, 标签 {len(r['labels'])}")
        for lab, f in sorted(r['labels'].items(), key=lambda x: x[1]):
            ps = r['frames'][str(f)]['place']
            print(f"   f{f:<3} {lab:<16} " + ", ".join(
                f"d{p['depth']}:{p['chid']}" + ("(spr)" if p['isSprite'] else "")
                + (f"[{p['name']}]" if p['name'] else "") for p in ps))
    p = ROOT / 'deobf' / 'data' / 'turret_layout.json'
    p.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print("\nwritten", p)
