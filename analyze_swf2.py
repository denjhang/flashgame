import zlib
d = open(r'D:\working\vscode-projects\flashgame\TCS.swf', 'rb').read()
out = zlib.decompress(d[8:])

# Flash 8+ 压缩格式：第一个字节是标志位
# 0x0C = DefineBitsJPEG2 (JPEG), 0x20 = DefineBitsJPEG3/4, 0x21 = DefineShape
# 标签格式: tag(2byte) + length(3byte) - 但 Flash 8+ 使用短标签

pos = 0
count = 0
while pos + 2 < len(out):
    tag = int.from_bytes(out[pos:pos+2], 'little')
    # Flash 8+ 短标签: tag & 0x3F 是标签类型, 其他位是长度高位
    tag_type = tag & 0x3F
    if tag_type == 0 and (tag >> 6) != 0:
        # 超长标签
        length_bytes = []
        shift = 0
        while True:
            b = out[pos + 2 + shift]
            length_bytes.append(b & 0x7F)
            if (b & 0x80) == 0:
                break
            shift += 1
        length = 0
        for b in reversed(length_bytes):
            length = (length << 7) | b
        tag_name = f"ShortTag(type={tag_type},extended)"
    elif tag_type == 0:
        break
    else:
        length = (tag >> 6) | ((out[pos + 2] & 0x7F) << 6) | ((out[pos + 3] & 0x7F) << 13) if (out[pos + 2] & 0x80) else ((tag >> 6) | ((out[pos + 2] & 0x7F) << 6))
        tag_name = f"Type={tag_type}"
    
    if tag_type not in (1, 5, 12, 13, 14, 15, 17, 18, 19, 24, 25):
        pass  # print only interesting types
    else:
        tag_names = {
            1: 'DefineShape',
            5: 'DefineButton',
            12: 'SetBackgroundColor',
            13: 'DefineFont',
            14: 'DefineFontInfo',
            15: 'DefineSound',
            17: 'DefineBitsLossless',
            18: 'DefineBitsJPEG3',
            19: 'DefineBitsJPEG4',
            24: 'DefineEditText',
            25: 'DefineSprite'
        }
        name = tag_names.get(tag_type, f"Unknown({tag_type})")
        if count < 30:
            print(f"tag={tag_type}({name}) pos={pos} len={length}")
        count += 1
    pos += length + (3 if tag_type != 0 else 2)
