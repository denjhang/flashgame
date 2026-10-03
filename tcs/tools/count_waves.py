segments = [s.strip() for s in open(r'D:\working\vscode-projects\flashgame\story_en.txt').read().strip().split('\n===\n') if s.strip()]

# 关卡触发器（波次/关卡开始时的对话）
wave_triggers = [
    'capitaine, ravi',
    'capitaine, j\'ai une mauvaise nouvelle pour vous',
    'capitaine, la touche',
    'capitaine, vous allez avoir le choix',
    'capitaine, soyez attentif',
    'capitaine, je vais vous briefer',
    'capitaine, il faut que je renseigne notre',
    'capitaine, je tiens à vous féliciter',
    'capitaine, je tiens à vous',
    'capitaine, nous avons de nouvelles troupes',
    'capitaine, les chinois ont fait appel',
    'capitaine, je vous ai une mauvaise nouvelle pour vous',
    'capitaine, nous savons que la situation',
    'capitaine, le choix du débloquage d\'une arme',
    'capitaine, j\'ai une mauvaise nouvelle',
    'capitaine, soyez attentif, on nous apprend',
    'capitaine, je vais vous briefer',
    'capitaine, il faut que je renseigne',
    'capitaine, la vague'
]
wave_segments = []
for i, s in enumerate(segments):
    s_lower = s.lower()
    for trigger in wave_triggers:
        if trigger.lower() in s_lower and len(s) > 10:
            wave_segments.append((i, s[:100]))
            break
print(f'关卡触发点数量: {len(wave_segments)}')
for i, s in wave_segments:
    print(f'段{i}: {s}')
