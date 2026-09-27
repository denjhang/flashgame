import os
base = r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\DefineSprite_1027'
for root, dirs, files in os.walk(base):
    for f in files:
        fp = os.path.join(root, f)
        if 'rollOver' in f:
            content = open(fp, encoding='utf-8', errors='replace').read()
            idx = content.find('info = "')
            if idx != -1:
                rest = content[idx+8:]
                info = ""
                in_quote = True
                for c in rest:
                    if in_quote:
                        if c == '"':
                            in_quote = False
                        else:
                            info += c
                    elif c == ' ' and not info.strip():
                        continue
                    else:
                        break
                print(f"文件: {os.path.relpath(fp, base)}")
                print(f"武器信息: {info}")
                print("---")
