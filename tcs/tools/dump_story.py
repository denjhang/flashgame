import json, sys
d = json.load(open(r'C:\Users\Administrator\AppData\Local\Temp\scenario.json', encoding='utf8'))
arr = d['en'] if 'en' in sys.argv else d['fr']
sel = set(int(x) for x in sys.argv[1:] if x.isdigit())
total = 0
for i, m in enumerate(arr):
    if isinstance(m, list) and m and isinstance(m[0], list):
        total += len(m)
        if not sel or i in sel:
            print('===== iMission %d (%d lines)' % (i, len(m)))
            for sp, tx in m:
                print(' ', sp, '|', tx.replace('\n', ' / '))
print('total lines', total, ' missions with dialogue:', sum(1 for m in arr if isinstance(m, list) and m and isinstance(m[0], list)))
