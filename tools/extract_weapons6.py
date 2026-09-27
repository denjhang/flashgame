import os, re
base = r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\DefineSprite_1027'
for root, dirs, files in os.walk(base):
    for f in files:
        fp = os.path.join(root, f)
        if 'rollOver' in f:
            content = open(fp, encoding='utf-8', errors='replace').read()
            # 提取所有双引号内的字符串
            idx = 0
            while idx < len(content):
                q1 = content.find('"', idx)
                if q1 == -1:
                    break
                q2 = content.find('"', q1 + 1)
                if q2 == -1:
                    break
                s = content[q1+1:q2]
                # 检查是否是武器信息（包含 \t 和数字）
                if '\t' in s and re.search(r'\d', s):
                    print(f'文件: {os.path.relpath(fp, base)}')
                    print(f'武器信息: {s}')
                    print('---')
                idx = q2 + 1
