"""r0 资源包解包器 (g.java:40-138 逆向)
格式: [92 个 big-endian int32 偏移表][数据块...]
  - b[0..90]: 条目 n2 (0..90) 的字节偏移; b[91]: 包尾偏移
  - 长度 (g.e): 下一非负偏移 - 本偏移; 若后续全负则用 b[91+seg]
  - id 编码: 资源 id = (seg<<16) | index, seg=0 → r0 (正式版仅 r0)
用法: python r0_unpack.py <jar 内提取的 r0> <输出目录>
"""
import sys, struct, os
data = open(sys.argv[1], 'rb').read()
out = sys.argv[2]; os.makedirs(out, exist_ok=True)
b = struct.unpack('>92i', data[:92*4])
def ext(n):
    nxt = None
    m = n + 1
    while m <= 91 and b[m] < 0: m += 1
    if m >= 91 or b[m] <= b[n]:
        return None  # 需 seg 表 (c 段), 记为未知长度 → 用下一条目估
    return b[n], b[m] - b[n]
names = {}
for n in range(0, 91):
    if b[n] < 0: continue
    r = ext(n)
    if not r: continue
    off, ln = r
    if off + ln > len(data) or ln <= 0: continue
    blob = data[off:off+ln]
    sig = blob[:4]
    kind = 'png' if sig == b'\x89PNG' else 'mid' if sig == b'MThd' else 'bin'
    fn = f'{out}/id{n:02d}.{kind}'
    open(fn, 'wb').write(blob)
    names[n] = (kind, ln, sig.hex()[:8])
for n, v in sorted(names.items()):
    print(f'id{n:02d} {v[0]} {v[1]:7d}B  sig={v[2]}')
print('总条目:', len(names))
