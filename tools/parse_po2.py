import struct

b = bytes([0x36,0x2b,0x02,0x76,0x04,0x1e,0xcb,0x45,0x63,0xc8,0x05,0x00])

class BR:
    def __init__(s, data): s.d=data; s.p=0
    def bit(s):
        byte=s.d[s.p>>3]; v=(byte>>(7-(s.p&7)))&1; s.p+=1; return v
    def bits(s,n):
        v=0
        for _ in range(n): v=(v<<1)|s.bit()
        return v
    def sb(s,n):
        v=s.bits(n)
        if v & (1<<(n-1)): v-=1<<n
        return v

f=BR(b[1:])   # skip flags
chid=f.bits(16)
print('chid', chid)
hasScale=f.bit()
print('hasScale', hasScale)
if hasScale:
    nb=f.bits(5); sx=f.sb(nb)/65536; sy=f.sb(nb)/65536
    print('scale', sx, sy)
hasRot=f.bit()
print('hasRot', hasRot)
if hasRot:
    nb=f.bits(5); r0=f.sb(nb)/65536; r1=f.sb(nb)/65536
    print('rot', r0, r1)
tx=f.bits(16); ty=f.bits(16)
if tx>=32768: tx-=65536
if ty>=32768: ty-=65536
print('translate', tx, ty)
