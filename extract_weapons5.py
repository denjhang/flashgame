import os, re
# 读取所有 rollOver 文件，提取 info 字符串
base = r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\DefineSprite_1027'
for root, dirs, files in os.walk(base):
    for f in files:
        fp = os.path.join(root, f)
        if 'rollOver' in f:
            content = open(fp, encoding='utf-8', errors='replace').read()
            # info 在 eval 里，提取所有 "..." 字符串
            strings = re.findall(r'"((?:[^"\\]|\\.)*)"', content)
            for s in strings:
                # 如果字符串包含 \t 或 price，说明是武器信息
                if '\t' in s or 'price' in s or 'power' in s:
                    print(f"文件: {os.path.relpath(fp, base)}")
                    print(f"武器信息: {s}")
                    print("---")
