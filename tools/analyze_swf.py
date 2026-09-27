import zlib, struct

d = open(r'D:\working\vscode-projects\flashgame\TCS.swf', 'rb').read()
out = zlib.decompress(d[8:])

TAG_NAMES = {
    0: 'ShowFrame',
    1: 'DefineShape',
    2: 'DefineBits',
    3: 'PlaceObject',
    4: 'RemoveObject',
    5: 'DefineButton',
    6: 'ColorTransform',
    7: 'MoveTo',
    8: 'DefineButtonSound',
    9: 'SoundStreamHead',
    10: 'DefineButton2',
    11: 'DefineBitsJPEG2',
    12: 'SetBackgroundColor',
    13: 'DefineFont',
    14: 'DefineFontInfo',
    15: 'DefineSound',
    16: 'StartSound',
    17: 'DefineBitsLossless',
    18: 'DefineBitsJPEG3',
    19: 'DefineBitsJPEG4',
    20: 'DefineShape3',
    21: 'DefineShape4',
    22: 'DefineMorph',
    23: 'DefineFont2',
    24: 'DefineEditText',
    25: 'DefineSprite',
    26: 'DefineFont3',
    27: 'DefineLanguage',
    28: 'DefineScale9Grid',
    29: 'DefineSprite',  # duplicate tag
    30: 'DefineVideo',
    31: 'DefineBitmapFilter',
    32: 'DefineBlurFilter',
    33: 'DefineColorMatrixFilter',
    34: 'DefineGradientMatrix',
    36: 'DefineMorph',  # morph tag
    43: 'DefineShape',
    69: 'PlaceObject3',
    74: 'DefineFont4',
    82: 'ExportAssets',
    83: 'ImportAssets',
    85: 'DefineVideoStream',
    86: 'VideoFrame',
    87: 'DefineFontInfo2',
    88: 'DefineSprite',
}

shapes = []
buttons = []
sprites = []
sounds = []
fonts = []
bitmaps = []
edit_text = []

pos = 0
while pos + 2 < len(out):
    raw = out[pos:pos+5]
    tag = int.from_bytes(raw[:2], 'little')
    length = int.from_bytes(raw[2:5], 'little')
    tag_name = TAG_NAMES.get(tag, f'Unknown({tag})')
    tag_type = tag & 0x1F
    if tag_type == 1:
        shapes.append(tag)
    elif tag_type == 5:
        buttons.append(tag)
    elif tag_type == 12 or tag_type == 29:
        sprites.append(tag)
    elif tag_type == 15:
        sounds.append(tag)
    elif tag_type == 13 or tag_type == 23 or tag_type == 26 or tag_type == 74:
        fonts.append(tag)
    elif tag_type == 2 or tag_type == 7 or tag_type == 17 or tag_type == 18 or tag_type == 19:
        bitmaps.append(tag)
    elif tag_type == 24:
        edit_text.append(tag)

    print(f'pos={pos} tag={tag}({tag_name}) len={length}')
    if len(sprites) > 0 and len(sprites) <= 100:
        pass  # we'll print sprites
    pos += length + 5
    if pos > len(out):
        break

print(f"\n--- Summary ---")
print(f"DefineShape: {len(shapes)}")
print(f"DefineButton: {len(buttons)}")
print(f"DefineSprite: {len(sprites)}")
print(f"DefineSound: {len(sounds)}")
print(f"DefineFont: {len(fonts)}")
print(f"DefineBitmap: {len(bitmaps)}")
print(f"DefineEditText: {len(edit_text)}")

# 查找 DefineSprite 标签（关卡/场景）
for tag in sprites:
    print(f"\nDefineSprite tag {tag} 相关的精灵名称...")
    # 尝试找到精灵 ID 对应的名称
    # 精灵内部结构：Find 和 ActionScript
    pass
