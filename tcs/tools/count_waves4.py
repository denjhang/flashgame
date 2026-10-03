segments = [s.strip() for s in open(r'D:\working\vscode-projects\flashgame\story_en.txt').read().strip().split('\n===\n') if s.strip()]

# 手动数波次——根据实际游戏流程
# 从第 28 段开始（新队长入场）到第 354 段结束，中间有多少波
# 每波都会触发以下至少一个：
# - "capitaine" 呼叫（教学/新武器/新敌人）
# - 新敌人类型出现（轻型装甲车→重坦→猛犸象→朝鲜舰艇→伊朗直升机→MLRS→雷达车）
# - 国际新闻播报
# - 剧情推进（伊丽莎白日记、音乐、间谍）

# 从英文对话中数
en_segments = [s for s in segments if any(c.isascii() for c in s) and not any(c in s for c in "àâêéèìîòùûç")]
print(f"纯英文段落数: {len(en_segments)}")

# 按内容类型分组
import re
all_strs = []
for s in segments:
    # 提取所有英文短句
    en_part = re.findall(r'(?:"[^"]{10,}"|the [A-Z]|[A-Z].{10,})', s)
    if en_part:
        all_strs.extend(en_part)

# 按波次分类：每波都会有新敌人类型 + 国际新闻 + 新武器解锁
wave_enemies = [
    "Chinese vehicles",           # 轻型坦克
    "light armoured",             # 轻型装甲车
    "heavy combat vehicle",       # 重战车
    "Chinese chose a heavier",    # 重战车
    "new double 105",             # 双 105 炮
    "new heavy Chinese tanks",    # 重坦克
    "Chinese chose a heavier combat",
    "two North-Korean ships",     # 朝鲜舰艇
    "Iranian helicopters",         # 伊朗直升机
    "missile crotale",            # 响尾蛇导弹
    "MLRS and Pluton",             # MLRS/普鲁东导弹
    "Chinese heavy tanks",         # 猛犸象重坦
    "Elena \"Angel\"",             # 苏-37空援
    "Japanese admiral",            # 日本战列舰
    "MLRS battery",                # MLRS 卡车
    "monster",                     # 水面巨物
]

# 每波触发器
for i, s in enumerate(en_segments):
    for enemy in wave_enemies:
        if enemy.lower() in s.lower():
            print(f"段{i} (波): {s[:100]}")
            break
