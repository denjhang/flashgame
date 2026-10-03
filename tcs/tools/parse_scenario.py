import re, json
s = open(r'deobf/scripts/frame_6/PlaceObject2_980_242/CLIPACTIONRECORD onClipEvent(load).as', encoding='utf8', errors='ignore').read()

def scan(start):
    """Parse Array(...)+string literals with escape awareness; return nested list tree."""
    assert s[start:start+5] == 'Array'
    k = start + 5
    assert s[k] == '('
    k += 1
    items = []
    cur = ''          # current scalar being built (strings only)
    stack = [items]
    while k < len(s):
        c = s[k]
        top = stack[-1]
        if c == '"':
            # string literal
            k += 1
            buf = []
            while True:
                ch = s[k]
                if ch == '\\' and k+1 < len(s):
                    buf.append(ch); buf.append(s[k+1]); k += 2; continue
                if ch == '"':
                    break
                buf.append(ch); k += 1
            top.append(''.join(buf))
            k += 1
            continue
        if c == 'A' and s[k:k+5] == 'Array' and s[k+5:k+6] == '(':
            new = []
            top.append(new)
            stack.append(new)
            k += 6
            continue
        if c == '(':
            k += 1
            continue
        if c == ')':
            stack.pop()
            if len(stack) == 0:
                return items, k
            k += 1
            continue
        k += 1
    return items, k

# find both scenario assignments
fr_start = s.index('scenario = Array(')
en_start = s.index('Array(', s.index('scenario = Array(', fr_start+10))
# english branch: second occurrence of 'scenario = Array('? check
occ = [m.start() for m in re.finditer(r'scenario\s*=\s*Array\(', s)]
print('scenario assignments at', occ)
fr, _ = scan(s.index('Array(', occ[0]))
en, _ = scan(s.index('Array(', occ[1])) if len(occ) > 1 else (None, None)
print('fr top-level items:', len(fr), 'en:', len(en) if en else None)
for i, m in enumerate(fr):
    if isinstance(m, list) and m and isinstance(m[0], list):
        sp = sorted(set(x[0] for x in m if isinstance(x, list) and x))
        print('fr m%02d lines=%d speakers=%s' % (i, len(m), sp))
json.dump({'fr': fr, 'en': en}, open(r'C:\Users\Administrator\AppData\Local\Temp\scenario.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('saved')
