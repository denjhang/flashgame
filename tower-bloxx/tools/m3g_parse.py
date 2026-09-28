#!/usr/bin/env python3
"""JSR-184 (M3G) binary parser — field order per J2ME-Loader's C loader (m3g_loader.c).

Usage: python m3g_parse.py <file.m3g> <outdir>
Dumps full object tree to m3g.json and Image2D objects to PNG.
"""
import struct, sys, zlib, json, os
from PIL import Image

TYPES = {0:'Header',1:'ExternalReference',2:'AnimationTrack',3:'KeyframeSequence',
         5:'VertexArray',6:'VertexBuffer',7:'IndexBuffer',8:'Object3D',9:'Group',
         10:'World',11:'Camera',12:'Sprite3D',13:'Mesh',14:'MorphingMesh',15:'SkinnedMesh',
         16:'Node',17:'Texture2D',18:'Image2D',19:'PolygonMode',20:'CompositingMode',
         21:'Material',22:'Fog',23:'Background',24:'TriangleStripArray',25:'Appearance',
         35:'Light',36:'KeyframeSequence2',255:'ExternalRef'}
IMG_FMT = {96:'ALPHA',97:'LUMINANCE',98:'LUMINANCE_ALPHA',99:'RGB',100:'RGBA'}
IMG_BPP = {96:1,97:1,98:2,99:3,100:4}

class R:
    def __init__(self, b): self.b=b; self.p=0
    def u8(self): v=self.b[self.p]; self.p+=1; return v
    def i32(self): v=struct.unpack_from('<i',self.b,self.p)[0]; self.p+=4; return v
    def u32(self): return self.i32()&0xffffffff
    def i16(self): v=struct.unpack_from('<h',self.b,self.p)[0]; self.p+=2; return v
    def f32(self): v=struct.unpack_from('<f',self.b,self.p)[0]; self.p+=4; return round(v,6)
    def raw(self,n): v=self.b[self.p:self.p+n]; self.p+=n; return v

def main(path, outdir):
    d = open(path,'rb').read()
    assert d[:8]==bytes([0xAB,0x4A,0x53,0x52,0x31,0x38,0x34,0xBB])
    pos = 12
    objects = []   # global list (id = index+2 per section; we keep global counter too)
    sec_i = 0
    while pos+9 <= len(d):
        scheme = d[pos]
        total, uncomp = struct.unpack_from('<II', d, pos+1)
        blob = d[pos+9:pos+total-4]
        if scheme == 1: blob = zlib.decompress(blob)
        assert len(blob)==uncomp, (pos, len(blob), uncomp)
        r = R(blob)
        sec_objs = []
        while r.p < uncomp:
            t = r.u8(); length = r.u32(); end = r.p+length
            o = parse_object(t, r, length, objects)
            o['_type_id']=t; o['_section']=sec_i; o['_id']=len(objects)+2
            objects.append(o); sec_objs.append(o)
            r.p = end
        print(f'section@{pos} scheme={scheme} uncomp={uncomp} objects={[ (o["_id"],o["type"]) for o in sec_objs ]}')
        pos += total
        sec_i += 1

    # export images
    os.makedirs(outdir, exist_ok=True)
    for i,o in enumerate(objects):
        if o['type']=='Image2D':
            save_image(o, i, outdir)
    json.dump({'objects':objects}, open(os.path.join(outdir,'m3g.json'),'w'), indent=1)
    print('total objects', len(objects))

def parse_object(t, r, length, objects):
    start = r.p
    o = {'type':TYPES.get(t,t)}
    # Object3D header: userID, animTrackCount, [animTrackIDs], userParamCount, params
    o['userID'] = r.i32()
    at = r.u32(); o['animTracks']=[r.i32() for _ in range(at)]
    up = r.u32(); o['userParams']=[]
    for _ in range(up):
        pid=r.i32(); plen=r.i32(); o['userParams'].append({'id':pid,'data':r.raw(plen).hex()})

    def transformable():
        tr={}
        if r.u8():
            tr['translation']=[r.f32() for _ in range(3)]
            tr['scale']=[r.f32() for _ in range(3)]
            tr['orientation']={'angle':r.f32(),'axis':[r.f32() for _ in range(3)]}
        if r.u8(): tr['matrix']=struct.unpack_from('<16f',r.b,r.p); r.p+=64
        return tr
    def node():
        nd={'transform':transformable()}
        nd['enable']=[r.u8(),r.u8()]
        nd['alphaFactor']=r.u8()
        nd['scope']=r.i32()
        if r.u8():
            nd['alignment']={'zTarget':r.u8(),'yTarget':r.u8(),'zRef':r.i32(),'yRef':r.i32()}
        return nd

    if t==0: # Header
        o['version']=(r.u8(),r.u8()); o['external']=bool(r.u8())
        alen=r.u32(); o['author']=r.raw(alen).decode('utf8','replace')
        o['totalFileSize']=r.u32(); o['approxContentSize']=r.u32()
    elif t==2: # AnimationTrack
        o['keyframeSequence']=r.i32(); o['property']=r.i32(); o['componentCount']=r.u8()
    elif t==3: # KeyframeSequence
        o['interpolation']=r.u8(); o['loopMode']=r.u8(); o['componentCount']=r.u8()
        o['repeatCount']=r.f32(); o['validRange']=[r.i32(),r.i32()]
        o['duration']=r.i32()
        n=r.u32(); o['times']=[r.f32() for _ in range(n)]
        o['values']=[[r.f32() for _ in range(o['componentCount'])] for _ in range(n)]
    elif t==5: # VertexArray
        cs=r.u8(); cc=r.u8(); enc=r.u8(); n=r.i16()
        o.update(componentSize=cs,componentCount=cc,encoding=enc,vertexCount=n)
        vals=[]
        prev=[0]*cc
        for i in range(n):
            row=[]
            for j in range(cc):
                if cs==1:
                    v=r.u8()
                    if enc==1: v=(prev[j]+v)&0xff
                    prev[j]=v
                else:
                    v=r.i16()
                    if enc==1: v=(prev[j]+v)&0xffff
                    prev[j]=v
                row.append(v)
            vals.append(row)
        o['values']=vals
    elif t==6: # VertexBuffer
        o['defaultColor']=r.u32()
        aid=r.i32(); bias=[r.f32() for _ in range(3)]; scale=r.f32()
        o['positions']={'array':aid,'bias':bias,'scale':scale}
        o['normals']={'array':r.i32()}
        o['colors']={'array':r.i32()}
        n=r.u32(); o['texCoords']=[]
        for _ in range(n):
            aid=r.i32(); bias=[r.f32() for _ in range(3)]; scale=r.f32()
            o['texCoords'].append({'array':aid,'bias':bias,'scale':scale})
    elif t==24: # TriangleStripArray
        enc=r.u8()
        if enc==0: o['startIndex']=r.i32()
        elif enc==1: o['startIndex']=r.u8()
        elif enc==2: o['startIndex']=r.i16()
        else:
            n=r.u32()
            if enc==128: idx=[r.i32() for _ in range(n)]
            elif enc==129: idx=list(r.raw(n))
            elif enc==130: idx=[r.i16() for _ in range(n)]
            else: raise ValueError(enc)
            o['indices']=idx
        lc=r.u32(); o['stripLengths']=[r.i32() for _ in range(lc)]
    elif t==19: # PolygonMode
        o['culling']=r.u8(); o['shading']=r.u8(); o['winding']=r.u8()
        o['twoSidedLighting']=r.u8(); o['localCameraLighting']=r.u8(); o['perspectiveCorrection']=r.u8()
    elif t==20: # CompositingMode
        o['depthTest']=r.u8(); o['depthWrite']=r.u8(); o['colorWrite']=r.u8()
        o['alphaWrite']=r.u8(); o['blending']=r.u8(); o['alphaThreshold']=r.u8()
        o['depthOffset']=[r.f32(),r.f32()]
    elif t==21: # Material
        o['ambient']=['rgb',[r.u8() for _ in range(3)]]
        o['diffuse']=['argb',[r.u8() for _ in range(4)]]
        o['emissive']=['rgb',[r.u8() for _ in range(3)]]
        o['specular']=['rgb',[r.u8() for _ in range(3)]]
        o['shininess']=r.f32(); o['vertexColorTracking']=r.u8()
    elif t==25: # Appearance
        o['layer']=r.u8()
        o['compositingMode']=r.i32(); o['fog']=r.i32(); o['polygonMode']=r.i32(); o['material']=r.i32()
        n=r.u32(); o['textures']=[r.i32() for _ in range(n)]
    elif t==18: # Image2D
        fmt=r.u8(); mut=r.u8(); w=r.i32(); h=r.i32()
        o.update(format=IMG_FMT.get(fmt,fmt), mutable=mut, width=w, height=h)
        if not mut:
            pl=r.i32(); pal=r.raw(pl) if pl>0 else None
            pxl=r.i32(); px=r.raw(pxl)
            o['_palette']=pal.hex() if pal else None
            o['_pixels']=px.hex()
    elif t==17: # Texture2D
        o['transform']=transformable()
        o['image']=r.i32(); o['blendColor']=[r.u8() for _ in range(3)]
        o['blendMode']=r.u8(); o['wrapping']=[r.u8(),r.u8()]; o['filtering']=[r.u8(),r.u8()]
    elif t in (9,10): # Group / World
        o['node']=node()
        n=r.u32(); o['children']=[r.i32() for _ in range(n)]
        if t==10:
            o['activeCamera']=r.i32(); o['background']=r.i32()
    elif t==11: # Camera
        o['node']=node()
        p=r.u8()
        if p==48: o['projection']=['generic',struct.unpack_from('<16f',r.b,r.p)]; r.p+=64
        elif p==49: o['projection']=['perspective',{'fovy':r.f32(),'aspect':r.f32(),'near':r.f32(),'far':r.f32()}]
        elif p==50: o['projection']=['parallel',{'fovy':r.f32(),'aspect':r.f32(),'near':r.f32(),'far':r.f32()}]
    elif t in (13,15): # Mesh / SkinnedMesh
        o['node']=node()
        o['vertexBuffer']=r.i32()
        n=r.u32(); o['submeshes']=[]
        for _ in range(n):
            o['submeshes'].append({'indexBuffer':r.i32(),'appearance':r.i32()})
        if t==15:
            o['skeleton']=r.i32()
            n=r.u32(); o['bones']=[]
            for _ in range(n):
                o['bones'].append({'bone':r.i32(),'firstVertex':r.i32(),'vertexCount':r.i32(),'weight':r.i32()})
    elif t==14: # MorphingMesh
        o['node']=node()
        o['vertexBuffer']=r.i32()
        n=r.u32(); o['submeshes']=[{'indexBuffer':r.i32(),'appearance':r.i32()} for _ in range(n)]
        n=r.u32(); o['targets']=[r.i32() for _ in range(n)]
    elif t==12: # Sprite3D
        o['node']=node()
        o['image']=r.i32(); o['appearance']=r.i32(); o['scaled']=r.u8()
        o['crop']=[r.i32() for _ in range(4)]
    elif t==35: # Light
        o['node']=node()
        o['attenuation']=[r.f32() for _ in range(3)]
        o['color']=[r.u8() for _ in range(3)]; o['mode']=r.u8()
        o['intensity']=r.f32(); o['spotAngle']=r.f32(); o['spotExponent']=r.f32()
    elif t==22: # Fog
        o['color']=[r.u8() for _ in range(3)]; m=r.u8()
        if m==32: o['fog']=['exponential',r.f32()]
        else: o['fog']=['linear',r.f32(),r.f32()]
    elif t==23: # Background
        o['color']=r.i32(); o['image']=r.i32()
        o['imageMode']=[r.u8(),r.u8()]; o['crop']=[r.i32() for _ in range(4)]
        o['enable']=[r.u8(),r.u8()]
    elif t==1: # ExternalReference
        n=r.u32(); o['uri']=r.raw(n).decode('utf8','replace')
    else:
        o['unknown']=r.raw(max(0,length-(r.p-start))).hex()[:200]
    return o

def save_image(o, idx, outdir):
    fmt=o['format']; w,h=o['width'],o['height']
    px=bytes.fromhex(o['_pixels']) if o.get('_pixels') else None
    if px is None: return
    try:
        if o.get('_palette'):
            bpp=IMG_BPP[fmt]; pal=bytes.fromhex(o['_palette'])
            img=Image.new(fmt.replace('LUMINANCE_ALPHA','LA').replace('LUMINANCE','L'), (w,h))
            data=[]
            for b in px[:w*h]:
                c=pal[b*bpp:(b+1)*bpp]
                if fmt=='RGBA': data.append(tuple(c))
                elif fmt=='RGB': data.append(tuple(c)+(255,))
                elif fmt=='ALPHA': data.append((0,0,0,c[0]))
                elif fmt=='LUMINANCE': data.append((c[0],)*3+(255,))
                else: data.append((c[0],c[0],c[0],c[1]))
            img.putdata(data)
        else:
            if fmt=='RGBA': img=Image.frombytes('RGBA',(w,h),px)
            elif fmt=='RGB': img=Image.frombytes('RGB',(w,h),px)
            elif fmt=='LUMINANCE': img=Image.frombytes('L',(w,h),px).convert('RGB')
            elif fmt=='LUMINANCE_ALPHA': img=Image.frombytes('LA',(w,h),px).convert('RGBA')
            else: img=Image.frombytes('RGBA',(w,h),bytes([(0,0,0,v) for v in px]))
        img.save(os.path.join(outdir,f'image_{idx}.png'))
    except Exception as e:
        print('img fail',idx,e)

if __name__=='__main__':
    main(sys.argv[1], sys.argv[2])
