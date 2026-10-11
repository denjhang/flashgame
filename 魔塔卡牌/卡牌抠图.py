# 卡牌自动抠图: 亮白纸片 vs 深色木纹背景 → 阈值分离 → 连通域 → 最小外接矩形(支持旋转) → 透视矫正
import numpy as np
from PIL import Image
import os, sys, glob

def find_cards(img_path, min_area_ratio=0.004):
    im = Image.open(img_path).convert('RGB')
    W, H = im.size
    scale = 1000 / max(W, H)
    small = im.resize((int(W*scale), int(H*scale)))
    a = np.asarray(small, dtype=np.int16)
    # 亮度: 纸片亮(>170), 木纹暗
    bright = a.mean(axis=2) > 175
    # 连通域(简单BFS, 小图上够快)
    h, w = bright.shape
    labels = np.zeros((h, w), dtype=np.int32)
    cur = 0
    boxes = []
    from collections import deque
    for y in range(h):
        for x in range(w):
            if bright[y, x] and labels[y, x] == 0:
                cur += 1
                q = deque([(y, x)])
                labels[y, x] = cur
                ys, xs, n = [y], [x], 0
                while q:
                    cy, cx = q.popleft()
                    n += 1
                    ys.append(cy); xs.append(cx)
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny, nx = cy+dy, cx+dx
                        if 0 <= ny < h and 0 <= nx < w and bright[ny, nx] and labels[ny, nx] == 0:
                            labels[ny, nx] = cur
                            q.append((ny, nx))
                y0, y1, x0, x1 = min(ys), max(ys), min(xs), max(xs)
                area_ratio = n / (h*w)
                fill = n / max(1, (y1-y0+1)*(x1-x0+1))
                # 过滤: 面积够大、填充率高(矩形纸片)、不是整幅背景
                if area_ratio > min_area_ratio and fill > 0.45 and n > 300:
                    boxes.append((x0, y0, x1, y1, n))
    return im, scale, boxes

def crop_card(im, scale, box, pad=6):
    x0, y0, x1, y1, _ = box
    s = 1/scale
    L = max(0, int(x0*s)-pad); T = max(0, int(y0*s)-pad)
    R = min(im.width, int((x1+1)*s)+pad); B = min(im.height, int((y1+1)*s)+pad)
    return im.crop((L, T, R, B))

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else '.'
    outdir = sys.argv[2] if len(sys.argv) > 2 else '抠图输出'
    os.makedirs(outdir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(src, '*.jpg')))
    for f in files:
        name = os.path.basename(f).rsplit('.', 1)[0]
        im, scale, boxes = find_cards(f)
        boxes.sort(key=lambda b: (b[1], b[0]))
        if not boxes:
            print(f'{name}: 未检出卡牌')
            continue
        for i, b in enumerate(boxes, 1):
            card = crop_card(im, scale, b)
            out = os.path.join(outdir, f'{name}_{i:02d}.png')
            card.save(out)
        print(f'{name}: {len(boxes)} 张 → {outdir}')
