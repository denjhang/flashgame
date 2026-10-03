import os
base = r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\DefineSprite_1027'
for root, dirs, files in os.walk(base):
    for f in files:
        fp = os.path.join(root, f)
        if 'rollOver' in f:
            content = open(fp, encoding='utf-8', errors='replace').read()
            # 提取 info 行
            idx = content.find('info = "')
            if idx != -1:
                info = content[idx+8:idx+500]  # 最多取500字符
                info = info.split('"')[0]  # 取到第一个引号
                print(f"文件: {os.path.relpath(fp, base)}")
                print(f"武器信息: {info}")
                print("---")
