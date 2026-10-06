#!/usr/bin/env python3
"""模拟农场 资源导出脚本。

格式依据（对 jadx_src/d.java 转写，非猜测）：
- Res.ifo 整读入 c[]，每项 6 字节：
  c[i*6+1]=pak号  c[i*6+2]=type  c[i*6+3]=id  c[i*6+4]+c[i*6+5]<<8=长度(LE)
  (d.java L30-33)
- pak 内偏移 = 同 pak 前面各条 长度+1 的累加（d.java L42: i3+i9+1）
- 条目类型: type 4 = 图片(Image.createImage 原始字节, d.h()); 
  type 3 = 文本数据; type 0 = 菜单数据; type 1 = 帮助文本(b 类用)
- 文本: 16-bit LE 字符流, 0x000D 结尾, 后面还垫 2 字节 (d.a() L103: b += i+4)
- 字节串: 0x0D 结尾 +1 垫 (d.f()); 0x0D 结尾 +2 垫 (d.d())
"""
import struct, sys, os

RES = r"G:\备份\BV0730 20261005\J2ME-Loader\converted\模拟农场\res"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "res_dump")

ifo = open(os.path.join(RES, "Res.ifo"), "rb").read()
n = len(ifo) // 6
paks = {}   # pak_no -> bytes
entries = []
skip = 0
lastpak = -1
for i in range(n):
    pak = ifo[i*6+1]
    typ = ifo[i*6+2]
    eid = ifo[i*6+3]
    ln = ifo[i*6+4] | (ifo[i*6+5] << 8)
    if pak != lastpak:      # d.java L34-37: pak 变化时 i3 归零
        skip = 0
        lastpak = pak
    entries.append((pak, typ, eid, ln, skip))
    skip += ln + 1  # d(int,int) 字节码 @630-653: i3=i3+len, 再 i3=i3+1
    if pak not in paks:
        paks[pak] = open(os.path.join(RES, f"Res{pak}.pak"), "rb").read()

def read_d(bytes_):      # d.d(): 0x0D 结尾, +2
    i = bytes_.index(0x0D)
    return bytes_[:i], i + 2

def read_f(bytes_):      # d.f(): 0x0D 结尾, +1
    i = bytes_.index(0x0D)
    return bytes_[:i], i + 1

def read_chars(bytes_):  # d.a(): 16-bit LE, 0x000D 结尾, +4
    i = 0
    while i < len(bytes_)-1 and not (bytes_[i] == 13 and bytes_[i+1] == 0):
        i += 1
    chars = [bytes_[b] | (bytes_[b+1] << 8) for b in range(0, i, 2)]
    return "".join(chr(c) for c in chars), i + 4

os.makedirs(OUT, exist_ok=True)
report = []
for pak, typ, eid, ln, off in entries:
    data = paks[pak][off:off+ln]
    name = f"t{typ}_id{eid}_p{pak}"
    if typ == 4:
        fn = name + ".png"
        open(os.path.join(OUT, fn), "wb").write(data)
        report.append(f"{fn}  {ln}B")
    elif typ in (0, 1, 3):
        if data[:2] == b"\xff\xfe":
            # 16-bit 文本块 (c 构造 d(i+1,0) 菜单文本): 头 0xFFFE(BE), 余同 d.a()
            fn = name + ".str.txt"
            strings, pos = [], 2
            while pos < len(data) - 4:
                i = pos
                while i < len(data) - 1 and not (data[i] == 13 and data[i+1] == 0):
                    i += 1
                s = "".join(chr(data[x] | (data[x+1] << 8)) for x in range(pos, i, 2))
                strings.append(s)
                if s == "":
                    break
                pos += (i - pos) + 4
            with open(os.path.join(OUT, fn), "w", encoding="utf-8") as f:
                for k, s in enumerate(strings):
                    f.write(f"[{k}] {s}\n")
            report.append(f"{fn}  {len(strings)}条  {ln}B")
        else:
            # 数值字段流 (c 构造 d(i,0) 菜单数据): d.f() 0x0D 结尾 +1 垫
            pos, lines = 0, []
            while pos < len(data):
                try:
                    s, adv = read_f(data[pos:])
                except ValueError:
                    break
                lines.append(s.decode("iso-8859-1"))
                pos += adv
            fn = name + ".txt"
            with open(os.path.join(OUT, fn), "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
            report.append(f"{fn}  {len(lines)}行  {ln}B")
    else:
        fn = name + ".bin"
        open(os.path.join(OUT, fn), "wb").write(data)
        report.append(f"{fn}  {ln}B")

print("\n".join(report))
