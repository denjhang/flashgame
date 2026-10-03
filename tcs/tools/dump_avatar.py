import re
s = open('swf_dump.txt', encoding='utf8', errors='ignore').read()
lines = s.split('\n')
def sprite_span(chid):
    for ln in lines:
        m = re.search(r'^([0-9a-f]+): \s*\d+\. DefineSprite \(chid: (\d+)\)\s+tagId= 39 len=\s*(\d+)', ln)
        if m and int(m.group(2)) == chid:
            return int(m.group(1), 16), int(m.group(3))
    return None, None
for chid in (870, 948, 949, 950, 951):
    o, l = sprite_span(chid)
    print('chid', chid, 'off', hex(o) if o else None, 'len', l)
    if not o:
        continue
    for ln in lines:
        m = re.match(r'^([0-9a-f]+):', ln)
        if m and o <= int(m.group(1), 16) <= o + l:
            if 'FrameLabel' in ln or ('DefineSprite' in ln and ('chid: %d)' % chid) not in ln):
                print('   ', ln.strip()[:100])
