#!/usr/bin/env python3
"""JSR-184 (M3G) binary parser for the HI Corp draft numbering used by City Bloxx.

Section: scheme(1) total(4) uncomp(4) data(total-13) adler(4)
Object:  type(1) length(4) [class data] — Object3D tail (userID/animTracks/userParams)
         sits at the START for every object except Header/ExternalReference.

Usage: python m3g_parse.py <file.m3g> <outdir>
"""
import struct, sys, zlib, json, os
from PIL import Image

TYPES = {0:'Header',1:'AnimationController',2:'AnimationTrack',3:'Appearance',
         4:'Background',5:'Camera',6:'CompositingMode',7:'Fog',8:'PolygonMode',
         9:'Group',10:'Image2D',11:'TriangleStripArray',12:'Light',13:'Material',
         14:'Mesh',15:'MorphingMesh',16:'SkinnedMesh',17:'Texture2D',18:'Sprite3D',
         19:'KeyframeSequence',20:'VertexArray',21:'VertexBuffer',22:'World',255:'ExternalRef'}
IMG_FMT = {96:'ALPHA',97:'LUMINANCE',98:'LUMINANCE_ALPHA',99:'RGB',100:'RGBA'}
IMG_BPP = {'ALPHA':1,'LUMINANCE':1,'LUMINANCE_ALPHA':2,'RGB':3,'RGBA':4}

class R:
    def __init__(self, b): self.b=b; self.p=0
    def u8(self): v=self.b[self.p]; self.p+=1; return v
    def i32(self): v=struct.unpack_from('<i',self.b,self.p)[0]; self.p+=4; return v
    def u32(self): v=struct.unpack_from('<I',self.b,self.p)[0]; self.p+=4; return v
    def i16(self): v=struct.unpack_from('<h',self.b,self.p)[0]; self.p+=2; return v
    def f32(self): v=struct.unpack_from('<f',self.b,self.p)[0]; self.p+=4; return v
    def raw(self,n): v=self.b[self.p:self.p+n]; self.p+=n; return v
    def str0(self):
        e=self.b.index(0,self.p); s=self.b[self.p:e].decode('utf8','replace'); self.p=e+1; return s

def main(path, outdir):
    d = open(path,'rb').read()
    assert d[:8]==bytes([0xAB,0x4A,0x53,0x52,0x31,0x38,0x34,0xBB])
    pos = 12
    objects = []
    sec = 0
    while pos+9 <= len(d):
        scheme = d[pos]
        total, uncomp = struct.unpack_from('<II', d, pos+1)
        blob = d[pos+9:pos+total-4]
        if scheme == 1: blob = zlib.decompress(blob)
        assert len(blob)==uncomp
        chk = struct.unpack_from('<I', d, pos+total-4)[0]
        def adler(b):
            s1=s2=0; s1=1
            for x in b: s1=(s1+x)%65521; s2=(s2+s1)%65521
            return (s2<<16)|s1
        assert chk==adler(d[pos:pos+9]+blob), 'checksum mismatch'
        r = R(blob)
        sec_objs=[]
        while r.p < uncomp:
            t = r.u8(); length = r.u32(); end = r.p+length
            o = parse_object(t, r)
            o['_type_id']=t; o['_section']=sec; o['_id']=len(sec_objs)+2
            o['_gid']=len(objects)+2
            objects.append(o); sec_objs.append(o)
            r.p = end
        print(f'section@{pos}: {[(o["_id"],o["type"]) for o in sec_objs]}')
        pos += total; sec += 1

    os.makedirs(outdir, exist_ok=True)
    for i,o in enumerate(objects):
        if o['type']=='Image2D': save_image(o, i, outdir)
    clean = [{k:v for k,v in o.items() if not k.startswith('_pix') and k!='_palette'} for o in objects]
    json.dump({'objects':clean}, open(os.path.join(outdir,'m3g.json'),'w'), indent=1)
    print('total objects', len(objects))

def parse_object(t, r):
    o = {'type':TYPES.get(t,t)}
    start=r.p
    def object3d():
        d={}
        d['userID']=r.i32()
        n=r.u32(); d['animTracks']=[r.i32() for _ in range(n)]
        n=r.u32(); d['userParams']=[]
        for _ in range(n):
            pid=r.i32(); plen=r.i32(); d['userParams'].append({'id':pid,'data':r.raw(plen).hex()})
        return d
    def transformable():
        tr=object3d()
        if r.u8():
            tr['translation']=[r.f32() for _ in range(3)]
            tr['scale']=[r.f32() for _ in range(3)]
            tr['orientation']={'angle':r.f32(),'axis':[r.f32() for _ in range(3)]}
        if r.u8():
            tr['matrix']=struct.unpack_from('<16f',r.b,r.p); r.p+=64
        return tr
    def node():
        nd={'transform':transformable()}
        nd['enable']=[r.u8(),r.u8()]; nd['alphaFactor']=r.u8(); nd['scope']=r.i32()
        if r.u8():
            nd['alignment']={'z':r.u8(),'y':r.u8(),'zRef':r.i32(),'yRef':r.i32()}
        return nd

    if t==0: # Header: no Object3D part
        o['version']=(r.u8(),r.u8()); o['external']=bool(r.u8())
        o['fileSize']=r.i32(); o['contentSize']=r.i32(); o['author']=r.str0()
    elif t==255:
        o['uri']=r.str0()
    elif t==2:
        o.update(object3d())
        o['keyframeSequence']=r.i32(); o['controller']=r.i32(); o['property']=r.i32()
    elif t==19:
        o.update(object3d())
        o['interpolation']=r.u8(); o['repeatMode']=r.u8(); o['encoding']=r.u8()
        o['duration']=r.i32(); o['validRange']=[r.i32(),r.i32()]
        comps=r.i32(); n=r.i32(); o['components']=comps; o['keyframes']=n
        vals=[]; times=[]
        if o['encoding']==0:
            for _ in range(n):
                times.append(r.i32()); vals.append([r.f32() for _ in range(comps)])
        else:
            base=[r.f32() for _ in range(comps)]
            bias=[r.f32() for _ in range(comps)]
            o['base']=base; o['bias']=bias
            for _ in range(n):
                times.append(r.i32())
                vals.append([bias[j]+r.u8() if o['encoding']==1 else bias[j]+r.i16() for j in range(comps)])
        o['times']=times; o['values']=vals
    elif t==1:
        o.update(object3d())
        o['speed']=r.f32(); o['weight']=r.f32()
        o['activeInterval']=[r.i32(),r.i32()]
        o['referenceSeqTime']=r.f32(); o['referenceWorldTime']=r.i32()
    elif t==20:
        o.update(object3d())
        cs=r.u8(); cc=r.u8(); enc=r.u8(); n=r.i16()
        o.update(componentSize=cs,componentCount=cc,encoding=enc,vertexCount=n)
        vals=[]; prev=[0]*cc
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
    elif t==21:
        o.update(object3d())
        o['defaultColor']=r.i32()
        aid=r.i32(); bias=[r.f32() for _ in range(3)]; scale=r.f32()
        o['positions']={'array':aid,'bias':bias,'scale':scale}
        o['normals']={'array':r.i32()}
        o['colors']={'array':r.i32()}
        n=r.u32(); o['texCoords']=[]
        for _ in range(n):
            aid=r.i32(); bias=[r.f32() for _ in range(3)]; scale=r.f32()
            o['texCoords'].append({'array':aid,'bias':bias,'scale':scale})
    elif t==11:
        o.update(object3d())
        enc=r.u8()
        if enc==0: o['startIndex']=r.i32()
        elif enc==1: o['startIndex']=r.u8()
        elif enc==2: o['startIndex']=r.i16()
        else:
            n=r.u32()
            o['indices']=[r.i32() if enc==128 else (r.u8() if enc==129 else r.i16()) for _ in range(n)]
        lc=r.u32(); o['stripLengths']=[r.i32() for _ in range(lc)]
    elif t==8:
        o.update(object3d())
        o['culling']=r.u8(); o['shading']=r.u8(); o['winding']=r.u8()
        o['twoSidedLighting']=r.u8(); o['localCameraLighting']=r.u8(); o['perspectiveCorrection']=r.u8()
    elif t==6:
        o.update(object3d())
        o['depthTest']=r.u8(); o['depthWrite']=r.u8(); o['colorWrite']=r.u8()
        o['alphaWrite']=r.u8(); o['blending']=r.u8(); o['alphaThreshold']=r.u8()
        o['depthOffset']=[r.f32(),r.f32()]
    elif t==13:
        o.update(object3d())
        o['ambient']=[r.u8() for _ in range(3)]
        o['diffuse']=[r.u8() for _ in range(4)]
        o['emissive']=[r.u8() for _ in range(3)]
        o['specular']=[r.u8() for _ in range(3)]
        o['shininess']=r.f32(); o['vertexColorTracking']=r.u8()
    elif t==3:
        o.update(object3d())
        o['layer']=r.u8()
        o['compositingMode']=r.i32(); o['fog']=r.i32(); o['polygonMode']=r.i32(); o['material']=r.i32()
        n=r.u32(); o['textures']=[r.i32() for _ in range(n)]
    elif t==10:
        o.update(object3d())
        fmt=r.u8(); mut=r.u8(); w=r.i32(); h=r.i32()
        o.update(format=IMG_FMT.get(fmt,fmt), mutable=mut, width=w, height=h)
        if not mut:
            pl=r.i32(); o['_palette']=r.raw(pl).hex() if pl>0 else None
            pxl=r.i32(); o['_pixels']=r.raw(pxl).hex()
    elif t==17:
        o.update(transformable())
        o['image']=r.i32()
        o['blendColor']=[r.u8() for _ in range(3)]; o['blendMode']=r.u8()
        o['wrapping']=[r.u8(),r.u8()]; o['filtering']=[r.u8(),r.u8()]
    elif t in (9,22):
        o.update(node())
        n=r.u32(); o['children']=[r.i32() for _ in range(n)]
        if t==22:
            o['activeCamera']=r.i32(); o['background']=r.i32()
    elif t==5:
        o.update(node())
        p=r.u8()
        if p==48: o['projection']=['generic',struct.unpack_from('<16f',r.b,r.p)]; r.p+=64
        elif p==49: o['projection']=['perspective',{'fovy':r.f32(),'aspect':r.f32(),'near':r.f32(),'far':r.f32()}]
        else: o['projection']=['parallel',{'fovy':r.f32(),'aspect':r.f32(),'near':r.f32(),'far':r.f32()}]
    elif t in (14,16):
        o.update(node())
        o['vertexBuffer']=r.i32()
        n=r.u32(); o['submeshes']=[{'indexBuffer':r.i32(),'appearance':r.i32()} for _ in range(n)]
        if t==16:
            o['skeleton']=r.i32()
            n=r.u32(); o['bones']=[{'bone':r.i32(),'firstVertex':r.i32(),'vertexCount':r.i32(),'weight':r.i32()} for _ in range(n)]
    elif t==15:
        o.update(node())
        o['vertexBuffer']=r.i32()
        n=r.u32(); o['submeshes']=[{'indexBuffer':r.i32(),'appearance':r.i32()} for _ in range(n)]
        n=r.u32(); o['targets']=[r.i32() for _ in range(n)]
    elif t==18:
        o.update(node())
        o['image']=r.i32(); o['appearance']=r.i32(); o['scaled']=r.u8()
        o['crop']=[r.i32() for _ in range(4)]
    elif t==12:
        o.update(node())
        o['attenuation']=[r.f32() for _ in range(3)]
        o['color']=[r.u8() for _ in range(3)]; o['mode']=r.u8()
        o['intensity']=r.f32(); o['spotAngle']=r.f32(); o['spotExponent']=r.f32()
    elif t==7:
        o.update(object3d())
        o['color']=[r.u8() for _ in range(3)]; m=r.u8()
        if m==32: o['fog']=['exponential',r.f32()]
        else: o['fog']=['linear',r.f32(),r.f32()]
    elif t==4:
        o.update(object3d())
        o['color']=r.i32(); o['image']=r.i32()
        o['imageMode']=[r.u8(),r.u8()]; o['crop']=[r.i32() for _ in range(4)]
        o['enable']=[r.u8(),r.u8()]
    return o

def save_image(o, idx, outdir):
    fmt=o['format']; w,h=o['width'],o['height']
    px=bytes.fromhex(o['_pixels']) if o.get('_pixels') else None
    if px is None: return
    try:
        if o.get('_palette'):
            bpp=IMG_BPP[fmt]; pal=bytes.fromhex(o['_palette'])
            img=Image.new('RGBA',(w,h))
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
            else: img=Image.frombytes('RGBA',(w,h),bytes((0,0,0,v) for v in px))
        img.save(os.path.join(outdir,f'image_{idx}.png'))
    except Exception as e:
        print('img fail',idx,e)

if __name__=='__main__':
    main(sys.argv[1], sys.argv[2])
