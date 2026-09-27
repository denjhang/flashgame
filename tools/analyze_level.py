import re, os

fp = r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\DefineSprite_793\frame_1\PlaceObject2_786_21\CLIPACTIONRECORD onClipEvent(load).as'
content = open(fp, encoding='utf-8', errors='replace').read()

# 直接按行提取带引号的字符串
lines = content.split('\n')
for line in lines:
    if '="' in line or "= \"" in line:
        # 找 "..." 模式
        parts = line.split('"')
        for p in parts:
            p = p.strip()
            if len(p) > 3:
                print(p[:120])
            if '===\n' in p or 'vague' in p or 'vague' in line.lower():
                print('---FOUND VAGUE---')
