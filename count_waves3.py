segments = [s.strip() for s in open(r'D:\working\vscode-projects\flashgame\story_en.txt').read().strip().split('\n===\n') if s.strip()]
total = len(segments)
print(f"总段落数: {total}")

# 直接按语义数关卡——每波都会有"敌袭"、"新武器解锁"、"国际新闻"等标志
# 波次划分标准：
# - 每出现"capitaine, ... nouvelle" 或 "vague d'assaut" 算一波
# - 每出现"débloquer" 或 "unlock" 算一波
# - 每出现"navires nord-coréens" 算一波
# - 每出现"chinois" 的敌人变化算一波
# 同时排除纯对话和过场

import re
wave_points = []
for i, s in enumerate(segments):
    s_lower = s.lower()
    # 每波开始的标志
    if any(kw in s_lower for kw in [
        'capitaine, ravi de vous',
        'capitaine, j\'ai une mauvaise nouvelle',
        'capitaine, la touche',
        'capitaine, vous allez avoir le choix',
        'capitaine, soyez attentif',
        'capitaine, je vais vous briefer',
        'capitaine, nous savons que la situation',
        'capitaine, le choix du débloquage',
        'capitaine, les chinois ont fait appel',
        'capitaine, je tiens à vous féliciter',
        'capitaine, il faut que je renseigne',
        'La vague d\'assaut ne s\'arrête pas',
        'la vague d\'assaut ne s\'arrête pas',
        'Et encore une vague',
        'Et ce qui devait arriver',
        'capitaine, vous avez de fait droit à un nouveau débloquage',
        'capitaine, soyez attentif, on nous apprend que deux navires',
        'capitaine, je vais vous briefer',
        'capitaine, il faut que je renseigne notre capitaine',
        'capitaine, la vague d\'assaut ne s\'arrête pas'
    ]):
        if len(s) > 15:
            wave_points.append(i)

print(f"\n关卡触发点: {len(wave_points)}")
for i in wave_points:
    print(f"  段{i}: {segments[i][:80]}")

# 同时数敌袭过场
overhead_points = []
for i, s in enumerate(segments):
    if 'Et ce qui devait arriver' in s:
        overhead_points.append(i)
print(f"\n过场段落: {len(overhead_points)}")
for i in overhead_points:
    print(f"  段{i}: {segments[i][:80]}")
