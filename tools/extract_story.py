import re

p = r'decompiled/scripts/scripts/frame_6/PlaceObject2_980_242/CLIPACTIONRECORD onClipEvent(load).as'
s = open(p, encoding='utf-8', errors='replace').read()
pat = re.compile(r'"((?:[^"\\]|\\.)*)"')
strs = pat.findall(s)
seen = set()
out = []
for x in strs:
    x = x.encode().decode('unicode_escape', errors='replace')
    x = x.replace("\\n", "\n").replace("\\'", "'")
    if len(x) > 30 and x not in seen and not re.search(r'[§]|invalid_utf8', x):
        seen.add(x)
        out.append(x)
print(len(out))
open('story_en.txt', 'w', encoding='utf-8').write('\n\n===\n\n'.join(out))
