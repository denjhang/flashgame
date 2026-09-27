#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
§§constant(N) 常量池解析器 v2
策略: 对每个文件统计引用的 N 值集合, 选择"覆盖率最高"的 ConstantPool
(混淆器把 ConstantPool 指令放在代码尾部/中部的切换手法导致首个 pool
经常只有几项, 而真实引用全部指向后面的完整 pool)。
0-based 索引。
"""
import re
import json
import sys
from pathlib import Path

ROOT = Path(r"D:\working\vscode-projects\flashgame\deobf")
AS_DIR = ROOT / "scripts"
PC_DIR = ROOT / "pcode" / "scripts"

POOL_RE = re.compile(r'ConstantPool ((?:"(?:\\.|[^"\\])*)")')


def get_pools(pcode_path):
    try:
        text = pcode_path.read_text(encoding='utf-8-sig', errors='replace')
    except OSError:
        return []
    pools = []
    for line in text.splitlines():
        s = line.strip()
        if s.startswith('ConstantPool'):
            items = re.findall(r'"((?:\\.|[^"\\])*)"', s)
            if items:
                pools.append(items)
    return pools


def resolve_file(as_path):
    rel = as_path.relative_to(AS_DIR)
    pcode_path = PC_DIR / rel.with_suffix('.pcode')
    text = as_path.read_text(encoding='utf-8-sig', errors='replace')
    ns = [int(m.group(1)) for m in re.finditer(r'§§constant\((\d+)\)', text)]
    if not ns:
        return ('none', 0)
    pools = get_pools(pcode_path)
    if not pools:
        return ('no-pool', len(ns))
    # 选覆盖率最高的 pool (唯一 pool 直接用; 多 pool 时覆盖最多引用者胜)
    uniq = set(ns)
    best = None
    best_cov = -1
    for pool in pools:
        cov = sum(1 for n in uniq if n < len(pool))
        if cov > best_cov or (cov == best_cov and best is not None
                              and len(pool) < len(best)):
            best = pool
            best_cov = cov
    count = 0

    def repl(m):
        nonlocal count
        n = int(m.group(1))
        if n < len(best):
            count += 1
            return '"%s"' % best[n]
        return m.group(0)

    new_text = re.sub(r'§§constant\((\d+)\)', repl, text)
    as_path.write_text(new_text, encoding='utf-8', newline='\n')
    unresolved = len(re.findall(r'§§constant\(\d+\)', new_text))
    return ('ok' if unresolved == 0 else 'partial'), unresolved


def main():
    stats = {'ok': 0, 'partial': 0, 'none': 0, 'no-pool': 0}
    leftovers = []
    for p in sorted(AS_DIR.rglob('*.as')):
        status, unresolved = resolve_file(p)
        stats[status] += 1
        if status in ('partial', 'no-pool'):
            leftovers.append((p, status, unresolved))
    print(stats)
    for p, s, u in leftovers[:20]:
        print("  %s %s (残留 %d)" % (s, p.relative_to(AS_DIR), u))


if __name__ == '__main__':
    main()
