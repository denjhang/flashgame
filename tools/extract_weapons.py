import os, re
weapon_data = {}
for root, dirs, files in os.walk(r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\DefineSprite_1027'):
    for f in files:
        fp = os.path.join(root, f)
        if 'rollOver' in f:
            content = open(fp, encoding='utf-8', errors='replace').read()
            price_m = re.search(r'price\s*=\s*(\d+)', content)
            power_m = re.search(r'power\s*=\s*(\d+)\s*\*\s*(\d+)', content)
            impact_m = re.search(r'impact\s*=\s*(\d+)', content)
            rate_m = re.search(r'rate\s*=\s*(\d+)\s*sec', content)
            life_m = re.search(r'life\s*=\s*(\d+)', content)
            range_m = re.search(r'range\s*=\s*(\d+)', content)
            name_m = re.search(r'\"(.*?)\"', content)
            name = ''
            if name_m:
                name = name_m.group(1).strip()
                if not name:
                    name_m2 = re.search(r'\"([^"]{3,})\"', content)
                    name = name_m2.group(1).strip() if name_m2 else ''
            wname = os.path.basename(os.path.dirname(os.path.dirname(fp)))
            weapon_data[wname] = {
                'name': name,
                'price': price_m.group(1) if price_m else '?',
                'power': power_m.group(1)+'*'+power_m.group(2) if power_m else '?',
                'impact': impact_m.group(1) if impact_m else '?',
                'range': range_m.group(1) if range_m else '?',
                'rate': rate_m.group(1) if rate_m else '?',
                'life': life_m.group(1) if life_m else '?'
            }

for wname, data in weapon_data.items():
    print(f"{wname}:")
    for k, v in data.items():
        print(f"  {k} = {v}")
