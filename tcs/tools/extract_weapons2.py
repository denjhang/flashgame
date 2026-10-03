import os, re
weapon_data = {}
base = r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\DefineSprite_1027'
for root, dirs, files in os.walk(base):
    for f in files:
        fp = os.path.join(root, f)
        if 'rollOver' in f:
            content = open(fp, encoding='utf-8', errors='replace').read()
            # 找 info = 行
            info_match = re.search(r'info\s*=\s*"([^"]*)"', content, re.DOTALL)
            if info_match:
                info = info_match.group(1).strip()
                # 解析 info 字符串
                lines = info.split('\n')
                weapon_name = ''
                price = '?',
                power = '?',
                impact = '?',
                rate = '?',
                life = '?',
                range_ = '?'
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    if '\t' in line:
                        key, val = line.split('\t')
                        if key == 'price':
                            price = val
                        elif key == 'power':
                            power = val
                        elif key == 'impact':
                            impact = val
                        elif key == 'range':
                            range_ = val
                        elif key == 'rate':
                            rate = val
                        elif key == 'life':
                            life = val
                    elif line and not line[0].isdigit():
                        weapon_name = line
                if not weapon_name:
                    # 名字可能没找到，取文件名
                    weapon_name = os.path.basename(os.path.dirname(fp))
                weapon_data[weapon_name] = {
                    'price': price,
                    'power': power,
                    'impact': impact,
                    'range': range_,
                    'rate': rate,
                    'life': life
                }
                print(f"\n{weapon_name}:")
                for k, v in weapon_data[weapon_name].items():
                    print(f"  {k} = {v}")
