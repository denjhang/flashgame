#!/usr/bin/env python3
"""Convert parsed City Bloxx scene.m3g to glTF 2.0 GLB for three.js.

Usage: python m3g_to_glb.py j2me/res/nokia_v1012/scene.m3g ../h5/assets/scene.glb
"""
import struct, sys, os, json, importlib.util
from PIL import Image
import io

def load_module():
    spec = importlib.util.spec_from_file_location(
        'm3g_parse', os.path.join(os.path.dirname(__file__), 'm3g_parse.py'))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

def main(src, dst):
    mp = load_module()
    d = open(src, 'rb').read()
    import tempfile
    tmp = tempfile.mkdtemp()
    # parse inline (reuse internals)
    import struct, zlib
    assert d[:8] == bytes([0xAB,0x4A,0x53,0x52,0x31,0x38,0x34,0xBB])
    pos = 12; objects = []; secno = 0
    while pos + 9 <= len(d):
        scheme = d[pos]
        total, uncomp = struct.unpack_from('<II', d, pos+1)
        blob = d[pos+9:pos+total-4]
        if scheme == 1: blob = zlib.decompress(blob)
        r = mp.R(blob)
        sec_objs = []
        while r.p < uncomp:
            t = r.u8(); length = r.u32(); end = r.p + length
            ob = mp.parse_object(t, r)
            ob['_section'] = secno
            sec_objs.append(ob); objects.append(ob)
            r.p = end
        secno += 1
        pos += total
    o = {}
    for i, x in enumerate(objects): o[i+1] = x   # 1-based global id

    def decode_image(img):
        fmt, w, h = img['format'], img['width'], img['height']
        px = bytes.fromhex(img['_pixels']) if img.get('_pixels') else None
        if px is None: return None
        if img.get('_palette'):
            bpp = mp.IMG_BPP[fmt]; pal = bytes.fromhex(img['_palette'])
            rgba = bytearray()
            for b in px:
                c = pal[b*bpp:(b+1)*bpp]
                if fmt == 'RGBA': rgba += c
                elif fmt == 'RGB': rgba += c + b'\xff'
                elif fmt == 'LUMINANCE': rgba += c*3 + b'\xff'
                elif fmt == 'LUMINANCE_ALPHA': rgba += bytes([c[0],c[0],c[0],c[1]])
                else: rgba += b'\x00\x00\x00' + c[:1]
            im = Image.frombytes('RGBA', (w, h), bytes(rgba))
        else:
            if fmt == 'RGB': im = Image.frombytes('RGB', (w, h), px).convert('RGBA')
            elif fmt == 'RGBA': im = Image.frombytes('RGBA', (w, h), px)
            else: im = Image.frombytes('L', (w, h), px).convert('RGBA')
        buf = io.BytesIO(); im.save(buf, 'PNG')
        return buf.getvalue()

    # gather images
    images, textures = {}, {}   # imageGid -> gltf image index ; textureGid -> tex index
    mats = {}                   # appearance gid -> material index
    bin_data = bytearray()

    def push(b, align=4):
        while len(bin_data) % align: bin_data.append(0)
        off = len(bin_data); bin_data.extend(b); return off

    def add_image(gid):
        if gid in images: return images[gid]
        png = decode_image(o[gid])
        if png is None:
            images[gid] = 0; return 0
        off = push(png)
        bvs.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(png)})
        bvi = len(bvs) - 1
        idx = len(img_list); img_list.append({'bufferView': bvi, 'mimeType': 'image/png'})
        images[gid] = idx
        return idx

    img_list, bvs = [], []

    def add_texture(gid):
        if gid in textures: return textures[gid]
        ii = add_image(o[gid].get('image'))
        ti = len(tex_list)
        tex_list.append({'source': ii, 'sampler': 0})
        textures[gid] = ti
        return ti

    mat_list = []
    tex_list, samplers = [], [{'wrapS': 33071, 'wrapT': 33071, 'magFilter': 9729, 'minFilter': 9987}]

    def add_material(ap_gid):
        if ap_gid in mats: return mats[ap_gid]
        ap = o[ap_gid]
        m = {'name': f'ap{ap_gid}', 'doubleSided': True, 'pbrMetallicRoughness': {'metallicFactor': 0.0, 'roughnessFactor': 1.0}}
        mat = ap.get('material')
        if mat and o.get(mat, {}).get('diffuse'):
            a, r_, g, b = o[mat]['diffuse']
            m['pbrMetallicRoughness']['baseColorFactor'] = [r_/255, g/255, b/255, a/255]
        if ap.get('textures'):
            m['pbrMetallicRoughness']['baseColorTexture'] = {'index': add_texture(ap['textures'][0])}
        mi = len(mat_list); mat_list.append(m)
        mats[ap_gid] = mi
        return mi

    gltf_meshes, gltf_nodes = [], []
    world = [x for x in objects if x['type'] == 'World'][0]
    world_gid = [i+1 for i, x in enumerate(objects) if x['type'] == 'World'][0]

    def tri_indices(ib):
        if 'indices' in ib:
            idx = ib['indices']
        else:
            idx = list(range(ib['startIndex'], ib['startIndex'] + sum(ib['stripLengths'])))
        tris = []; k = 0
        for l in ib['stripLengths']:
            s = idx[k:k+l]
            for i in range(l-2):
                tris += [s[i], s[i+1], s[i+2]]
            k += l
        return tris

    def verts_of(vb):
        va = o[vb['positions']['array']]
        sc = vb['positions']['scale']; bs = vb['positions']['bias']
        pos = [[v[j]*sc+bs[j] for j in range(3)] for v in va['values']]
        uv = []
        if vb.get('texCoords'):
            ta = o[vb['texCoords'][0]['array']]
            sc = vb['texCoords'][0]['scale']; bs = vb['texCoords'][0]['bias']
            comps = ta['componentCount']
            uv = [[ta['values'][i][0]*sc+bs[0], ta['values'][i][1]*sc+bs[1]] if comps >= 2 else [0,0] for i in range(len(pos))]
        else:
            uv = [[0,0]] * len(pos)
        return pos, uv

    def add_mesh(gid):
        mesh = o[gid]
        vb = o[mesh['vertexBuffer']]
        pos, uv = verts_of(vb)
        prims = []
        for sm in mesh['submeshes']:
            tris = tri_indices(o[sm['indexBuffer']])
            acc_p = push_acc([c for v in pos for c in v], 3, 5126, 4, [min(v[j] for v in pos) for j in range(3)], [max(v[j] for v in pos) for j in range(3)])
            acc_u = push_acc([c for v in uv for c in v], 2, 5126, 4)
            acc_i = push_acc(tris, 1, 5125, 4)
            prims.append({'attributes': {'POSITION': acc_p, 'TEXCOORD_0': acc_u}, 'indices': acc_i, 'material': add_material(sm['appearance']), 'mode': 4})
        mi = len(gltf_meshes); gltf_meshes.append({'primitives': prims, 'name': f'mesh{gid}'})
        return mi

    def push_acc(vals, ncomp, comp_type, sz, min_=None, max_=None):
        if sz == 4: b = struct.pack(f'<{len(vals)}f', *vals) if comp_type == 5126 else struct.pack(f'<{len(vals)}I', *vals)
        off = push(b)
        bv = len(bvs); bvs.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(b)})
        a = {'bufferView': bv, 'componentType': comp_type, 'count': len(vals)//ncomp,
             'type': 'SCALAR' if ncomp == 1 else ('VEC2' if ncomp == 2 else 'VEC3')}
        if min_ is not None: a['min'] = min_; a['max'] = max_
        ACC_LIST.append(a)
        return len(ACC_LIST)-1

    ACC_LIST = []

    def add_node(gid, name):
        n = o[gid]
        node = {'name': name}
        t = n.get('transform', {})
        if t.get('translation'): node['translation'] = t['translation']
        if t.get('scale'): node['scale'] = t['scale']
        if t.get('orientation'):
            import math
            ang = t['orientation']['angle']; ax = t['orientation']['axis']
            node['rotation'] = quat_from_axis_angle(ax, ang)
        if t.get('matrix'):
            node['matrix'] = gltf_matrix(t['matrix'])
        if n['type'] == 'Mesh':
            node['mesh'] = add_mesh(gid)
        ni = len(gltf_nodes); gltf_nodes.append(node)
        return ni

    def quat_from_axis_angle(axis, deg):
        import math
        l = (axis[0]**2+axis[1]**2+axis[2]**2) ** 0.5 or 1
        x, y, z = [a/l for a in axis]; a = math.radians(deg)/2
        s = math.sin(a)
        return [x*s, y*s, z*s, math.cos(a)]

    def gltf_matrix(m16):
        # m3g stores row-major with row vectors; glTF wants column-major
        rows = [m16[i*4:(i+1)*4] for i in range(4)]
        cols = [[rows[r][c] for r in range(4)] for c in range(4)]
        return [c for col in cols for c in col]

    # build scene: world children + camera info
    for c in world['children']:
        add_node(c, f'n{c}')
    cam = o[world['activeCamera']]
    cam_info = cam.get('projection')
    bg = o.get(world.get('background'))

    # assemble GLB
    gltf = {
        'asset': {'version': '2.0', 'generator': 'm3g_to_glb.py'},
        'scene': 0,
        'scenes': [{'nodes': list(range(len(gltf_nodes)))}],
        'nodes': gltf_nodes,
        'meshes': gltf_meshes,
        'materials': mat_list,
        'textures': tex_list,
        'images': img_list,
        'samplers': samplers,
        'accessors': ACC_LIST,
        'bufferViews': bvs,
        'buffers': [{'byteLength': 0}],
        'extras': {'camera': cam_info, 'backgroundColor': (bg['color'] if bg else 0)},
    }
    gltf['buffers'][0]['byteLength'] = len(bin_data)
    js = json.dumps(gltf, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    while len(bin_data) % 4: bin_data.append(0)
    total = 12 + 8 + len(js) + 8 + len(bin_data)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(bin_data), 0x004E4942)); f.write(bytes(bin_data))
    print('GLB written', dst, total, 'bytes; meshes', len(gltf_meshes), 'images', len(img_list))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
