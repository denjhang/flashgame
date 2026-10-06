import zipfile, struct, shutil, os

ENJ = os.path.join(os.environ['TEMP'], 'simfarm_enjarify.jar')
RES = r"G:\备份\BV0730 20261005\J2ME-Loader\converted\模拟农场\res"
JAR = r"E:\working\vscode-projects\flashgame\games\jars\模拟农场.jar"
d = zipfile.ZipFile(ENJ).read('d.class')
orig_len = len(d)

p = 10
cp_count = struct.unpack('>H', d[8:10])[0]
cp = {}
i = 1
while i < cp_count:
    tag = d[p]
    if tag == 1:
        n = struct.unpack('>H', d[p+1:p+3])[0]
        cp[i] = (1, d[p+3:p+3+n]); p += 3 + n
    elif tag == 7:
        cp[i] = (7, struct.unpack('>H', d[p+1:p+3])[0]); p += 3
    elif tag == 8:
        cp[i] = (8, struct.unpack('>H', d[p+1:p+3])[0]); p += 3
    elif tag in (16, 19, 20):
        cp[i] = (tag, d[p+1:p+3]); p += 3
    elif tag in (9, 10, 11, 12, 17, 18):
        cp[i] = (tag, struct.unpack('>HH', d[p+1:p+5])); p += 5
    elif tag in (3, 4):
        cp[i] = (tag, d[p+1:p+5]); p += 5
    elif tag in (5, 6):
        cp[i] = (tag, d[p+1:p+9]); cp[i+1] = None; p += 9; i += 1
    elif tag == 15:
        cp[i] = (tag, d[p+1:p+4]); p += 4
    else:
        raise SystemExit('bad tag %r at %d' % (tag, i))
    i += 1
cp_end = p

def find_utf8(s):
    for k, v in cp.items():
        if v and v[0] == 1 and v[1] == s.encode():
            return k
    return None

CTX_NAME = b'javax/microedition/util/ContextHolder'
ctx = None
for k, v in cp.items():
    if not v or v[0] != 10:
        continue
    ce = cp.get(v[1][0])
    if not ce or ce[0] != 7:
        continue
    ne = cp.get(ce[1])
    if not ne or ne[0] != 1 or ne[1] != CTX_NAME:
        continue
    nat = cp.get(v[1][1])
    if not nat or nat[0] != 12:
        continue
    n1 = cp.get(nat[1][0])
    if n1 and n1[0] == 1 and n1[1] == b'getResourceAsStream':
        ctx = k
assert ctx, 'ContextHolder methodref not found'
print('ContextHolder Methodref cp#%d' % ctx)

append = b''
new_count = cp_count

def add_utf8(s):
    global append, new_count
    k = find_utf8(s)
    if k:
        return k
    k = new_count
    append += b'\x01' + struct.pack('>H', len(s.encode())) + s.encode()
    cp[k] = (1, s.encode())
    new_count += 1
    return k

cls_cls = None
for k, v in cp.items():
    if v and v[0] == 7:
        ne = cp.get(v[1])
        if ne and ne[0] == 1 and ne[1] == b'java/lang/Class':
            cls_cls = k
if cls_cls is None:
    u = add_utf8('java/lang/Class')
    cls_cls = new_count
    append += b'\x07' + struct.pack('>H', u)
    cp[cls_cls] = (7, u)
    new_count += 1

name_s = 'getResourceAsStream'
desc_s = '(Ljava/lang/String;)Ljava/io/InputStream;'
add_utf8(name_s)
add_utf8(desc_s)

nat_new = None
for k, v in cp.items():
    if v and v[0] == 12:
        n1, n2 = cp.get(v[1][0]), cp.get(v[1][1])
        if n1 and n1[0] == 1 and n1[1] == name_s.encode() and n2 and n2[0] == 1 and n2[1] == desc_s.encode():
            nat_new = k
if nat_new is None:
    nat_new = new_count
    append += b'\x0c' + struct.pack('>HH', find_utf8(name_s), find_utf8(desc_s))
    new_count += 1

mref = None
for k, v in cp.items():
    if v and v[0] == 10 and v[1][0] == cls_cls and v[1][1] == nat_new:
        mref = k
if mref is None:
    mref = new_count
    append += b'\x0a' + struct.pack('>HH', cls_cls, nat_new)
    new_count += 1
print('Class.getResourceAsStream Methodref cp#%d (cp %d -> %d)' % (mref, cp_count, new_count))

old = b'\xb8' + struct.pack('>H', ctx)
new = b'\xb6' + struct.pack('>H', mref)
region = d[cp_end:]
cnt = region.count(old)
print('call sites: %d' % cnt)
assert cnt == 2, 'expected exactly 2 call sites'

nd = d[:cp_end] + append + region.replace(old, new)
nd = nd[:8] + struct.pack('>H', new_count) + nd[10:]
print('d.class %d -> %d bytes' % (orig_len, len(nd)))

out = JAR + '.new'
with zipfile.ZipFile(ENJ) as zen, zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zen.infolist():
        data = nd if item.filename == 'd.class' else zen.read(item.filename)
        zout.writestr(item.filename, data)
    for root, _, files in os.walk(RES):
        for fn in files:
            fp = os.path.join(root, fn)
            arc = os.path.relpath(fp, RES).replace('\\', '/')
            zout.writestr(arc, open(fp, 'rb').read())
shutil.move(out, JAR)
print('final jar written:', JAR)
