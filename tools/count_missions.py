import re
fp = r'D:\working\vscode-projects\flashgame\decompiled\scripts\scripts\frame_6\PlaceObject2_6_329\CLIPACTIONRECORD onClipEvent(load).as'
s = open(fp, encoding='utf-8', errors='replace').read()
idx = s.find('unitsMissions = Array')
if idx != -1:
    rest = s[idx:]
    # 分割成任务
    tasks = re.split(r',\s*Array\(Array\(', rest)
    tasks = tasks[0] + ',' + ','.join(tasks[1:])  # fix split
    # 实际分割
    tasks = re.split(r'\s*,\s*parcourt\d+\s*\)', rest)
    # 每个任务
    mission_list = []
    current = ''
    for part in rest.split('parcourt'):
        if part.startswith('1') or part.startswith('2') or part.startswith('3') or part.startswith('4'):
            # 这是一个新任务的结尾
            if current:
                mission_list.append(current)
            current = part
    if current:
        mission_list.append(current)
    print(f'总关卡数: {len(mission_list)}')
    for i, m in enumerate(mission_list, 1):
        # 提取敌人类型
        units = re.findall(r'"([^"]+)"', m)
        parcourt = re.findall(r'parcourt(\d+)', m)
        if parcourt:
            p = parcourt[0]
        else:
            p = '?'
        enemy_types = [u for u in units if u not in ('camion1', 'camion2', 'camion3', 'jeep', 'bradley', 'amx10', 'radarMobile', 'm60', '75mmBrad', 'gatlingAmx10', 'm60Brad', 'm60Bradley', 'm60Bradley2', 'null')]
        print(f'第{i}关 (parcourt{p}): 敌人={enemy_types[:10]}... ({len(units)} total)')
