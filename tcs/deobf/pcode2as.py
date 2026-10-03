#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AVM1 P-code → 可读伪代码转换器
对 deobf/pcode/ 中的函数块做栈模拟, 生成表达式化伪代码。
用法:
  python3 pcode2as.py <pcode文件> [函数名 ...]
  python3 pcode2as.py --all        # 转换 GAME_LOGIC.md F 节的核心函数
"""
import re
import sys
from pathlib import Path

ROOT = Path(r"D:\working\vscode-projects\flashgame\deobf\pcode\scripts")

# ---------------- 解析 pcode 行 ----------------

LINE_RE = re.compile(r'^(?:(loc[0-9a-fA-F]+|[0-9a-fA-F]+)\s*:\s*)?(\w+)\s*(.*)$')

def tokenize_values(s):
    """Push 的参数列表 → [token]"""
    toks = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c == ' ' or c == ',':
            i += 1
            continue
        if c == '"':
            j = i + 1
            while j < n:
                if s[j] == '\\':
                    j += 2
                    continue
                if s[j] == '"':
                    break
                j += 1
            toks.append(s[i:j + 1])
            i = j + 1
        else:
            j = i
            while j < n and s[j] not in ' ,':
                j += 1
            toks.append(s[i:j])
            i = j
    return toks


class FuncBlock:
    """DefineFunction2 块: 头行 + body 行列表 + '}'"""
    def __init__(self, header, lines):
        self.header = header
        self.lines = lines


def parse_blocks(text):
    """把 pcode 文本切成函数块列表(按出现顺序)。
    识别 `locXXXX:DefineFunction2 "name" ... {` 直到配平的 `}`。"""
    lines = text.splitlines()
    blocks = []
    cur_header = None
    cur_body = []
    depth = 0
    for ln in lines:
        s = ln.strip()
        if cur_header is None:
            m = re.match(r'^(?:loc[0-9a-fA-F]+\s*:\s*)?DefineFunction2? "(?:\\.|[^"\\])*".*\{', s)
            if m:
                cur_header = s
                cur_body = []
                depth = 1
            continue
        # 块内: 跟踪括号深度(字符串感知)
        i = 0
        n = len(ln)
        while i < n:
            ch = ln[i]
            if ch == '"':
                i += 1
                while i < n:
                    if ln[i] == '\\':
                        i += 2
                        continue
                    if ln[i] == '"':
                        break
                    i += 1
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    blocks.append(FuncBlock(cur_header, cur_body))
                    cur_header = None
                    cur_body = []
                    break
            i += 1
        if cur_header is not None:
            cur_body.append(ln)
    return blocks


def fname(header):
    m = re.match(r'(?:loc[0-9a-fA-F]+\s*:\s*)?DefineFunction2? "((?:\\.|[^"\\])*)"', header)
    return m.group(1) if m else '?'


def fparams(header):
    m = re.search(r'\{', header)
    return m and header  # 参数在 register 绑定里, 简化输出 header 原文


# ---------------- 栈机转换 ----------------

PROPERTY_NAMES = ["_x", "_y", "_xscale", "_yscale", "_currentframe", "_totalframes",
                  "_alpha", "_visible", "_width", "_height", "_rotation", "_target",
                  "_framesloaded", "_name", "_droptarget", "_url", "_highquality",
                  "_focusrect", "_soundbuftime", "_quality", "_xmouse", "_ymouse"]


class Converter:
    def __init__(self, lines):
        self.raw = lines
        self.pools = []      # 按出现顺序
        self.cur_pool = []
        self.out = []
        self.stack = []
        self.label_now = ''

    def const(self, tok):
        """constantN → 当前 pool 字符串"""
        m = re.match(r'^constant(\d+)$', tok)
        if not m:
            return tok
        n = int(m.group(1))
        for pool in reversed(self.pools):
            if n < len(pool):
                return '"%s"' % pool[n]
        return tok

    def prep(self):
        """先扫一遍收集 ConstantPool 顺序"""
        for ln in self.raw:
            if ln.strip().startswith('ConstantPool'):
                items = re.findall(r'"((?:\\.|[^"\\])*)"', ln)
                if items:
                    self.pools.append(items)

    def fmt(self, tok):
        tok = self.const(tok)
        if re.match(r'^register(\d+)$', tok):
            return 'r' + tok[8:]
        return tok

    def pop(self):
        if self.stack:
            return self.stack.pop()
        return '???'

    def push(self, v):
        self.stack.append(v)

    def emit(self, s):
        self.out.append('   ' + s)

    def binop(self, op):
        b = self.pop()
        a = self.pop()
        self.push('(%s %s %s)' % (a, op, b))

    def run(self):
        self.prep()
        pool_iter = iter(self.pools)
        for ln in self.raw:
            lm = LINE_RE.match(ln.strip())
            if not lm or not ln.strip():
                continue
            label, op, arg = lm.group(1), lm.group(2), lm.group(3)
            if op == 'ConstantPool':
                self.cur_pool = next(pool_iter, [])
                continue
            if label:
                self.out.append('%s:' % label)
            try:
                self.step(op, arg)
            except Exception as e:
                self.emit('// !! %s %s (%r)' % (op, arg[:40], e))
                self.stack = []
        # 残留栈
        while self.stack:
            v = self.stack.pop()
            if v not in ('???',):
                self.emit('// stack leftover: ' + v)

    def step(self, op, arg):
        S = self.stack
        if op == 'Push':
            for t in tokenize_values(arg):
                self.push(self.fmt(t))
        elif op == 'Pop':
            v = self.pop()
            if v != '???':
                self.emit('_ = %s;' % v)
        elif op == 'GetVariable':
            a = self.pop()
            self.push(self.deref(a))
        elif op == 'SetVariable':
            v = self.pop()
            n = self.pop()
            self.emit('%s = %s;' % (self.deref(n), v))
        elif op == 'GetMember':
            name = self.pop()
            obj = self.pop()
            self.push('%s.%s' % (obj, strip_q(name)))
        elif op == 'SetMember':
            v = self.pop()
            name = self.pop()
            obj = self.pop()
            self.emit('%s.%s = %s;' % (obj, strip_q(name), v))
        elif op == 'GetProperty':
            idx = int(self.pop())
            obj = self.pop()
            nm = PROPERTY_NAMES[idx] if idx < len(PROPERTY_NAMES) else 'prop%d' % idx
            self.push('%s.%s' % (obj, nm))
        elif op == 'SetProperty':
            v = self.pop()
            idx = int(self.pop())
            obj = self.pop()
            nm = PROPERTY_NAMES[idx] if idx < len(PROPERTY_NAMES) else 'prop%d' % idx
            self.emit('%s.%s = %s;' % (obj, nm, v))
        elif op == 'CallMethod':
            mname = self.pop()
            obj = self.pop()
            nargs = int(self.pop())
            args = [self.pop() for _ in range(nargs)][::-1]
            self.push('%s.%s(%s)' % (obj, strip_q(mname), ', '.join(args)))
        elif op == 'CallFunction':
            fname_ = self.pop()
            nargs = int(self.pop())
            args = [self.pop() for _ in range(nargs)][::-1]
            self.push('%s(%s)' % (self.deref(fname_), ', '.join(args)))
        elif op == 'NewMethod':
            mname = self.pop()
            obj = self.pop()
            nargs = int(self.pop())
            args = [self.pop() for _ in range(nargs)][::-1]
            self.push('new %s.%s(%s)' % (obj, strip_q(mname), ', '.join(args)))
        elif op == 'NewObject':
            cls = self.pop()
            nargs = int(self.pop())
            args = [self.pop() for _ in range(nargs)][::-1]
            self.push('new %s(%s)' % (cls, ', '.join(args)))
        elif op == 'InitArray':
            nargs = int(self.pop())
            args = [self.pop() for _ in range(nargs)][::-1]
            self.push('[%s]' % ', '.join(args))
        elif op == 'InitObject':
            n = int(self.pop())
            pairs = []
            for _ in range(n):
                v = self.pop()
                k = self.pop()
                pairs.append('%s: %s' % (strip_q(k), v))
            pairs.reverse()
            self.push('{%s}' % ', '.join(pairs))
        elif op in ('Add', 'Add2'):
            self.binop('+')
        elif op == 'Subtract':
            self.binop('-')
        elif op == 'Multiply':
            self.binop('*')
        elif op == 'Divide':
            self.binop('/')
        elif op == 'Modulo':
            self.binop('%')
        elif op in ('Equals', 'Equals2', 'StrictEquals'):
            self.binop('==')
        elif op == 'StringEquals':
            self.binop('==')
        elif op in ('Less', 'Less2'):
            self.binop('<')
        elif op == 'Greater':
            self.binop('>')
        elif op in ('BitAnd',):
            self.binop('&')
        elif op in ('BitOr',):
            self.binop('|')
        elif op == 'And':
            self.binop('&&')
        elif op == 'Or':
            self.binop('||')
        elif op == 'Not':
            self.push('!%s' % self.pop())
        elif op == 'ToNumber':
            pass  # Number(...) 语义弱, 保持
        elif op == 'ToString':
            pass
        elif op == 'SetMember2':
            v = self.pop()
            name = self.pop()
            obj = self.pop()
            self.emit('%s.%s = %s;' % (obj, strip_q(name), v))
        elif op == 'StoreRegister':
            m = re.search(r'(\d+)', arg)
            r = 'r' + (m.group(1) if m else '?')
            v = self.pop()
            self.emit('%s = %s;' % (r, v))
            self.push(r)  # AVM1: 值保留在栈
        elif op == 'Increment':
            v = self.pop()
            if re.match(r'^r\d+$', v) or re.match(r'^[A-Za-z_][\w.]*$', v):
                self.emit('%s = %s + 1;' % (v, v))
                self.push(v)
            else:
                self.push('(%s + 1)' % v)
        elif op == 'Decrement':
            v = self.pop()
            if re.match(r'^r\d+$', v) or re.match(r'^[A-Za-z_][\w.]*$', v):
                self.emit('%s = %s - 1;' % (v, v))
                self.push(v)
            else:
                self.push('(%s - 1)' % v)
        elif op == 'PushDuplicate':
            self.push(self.stack[-1] if self.stack else '???')
        elif op == 'StackSwap':
            if len(self.stack) >= 2:
                self.stack[-1], self.stack[-2] = self.stack[-2], self.stack[-1]
        elif op == 'Push r:n' or op.startswith('PushRegister'):
            pass
        elif op == 'If':
            cond = self.pop()
            self.emit('if (%s) goto %s;' % (cond, arg))
        elif op == 'IfTrue':
            self.emit('if (true) goto %s;' % arg)
        elif op == 'Jump':
            self.emit('goto %s;' % arg)
        elif op in ('Trace',):
            self.emit('trace(%s);' % self.pop())
        elif op in ('Play', 'Stop', 'NextFrame', 'PrevFrame', 'StopSounds'):
            self.emit('%s();' % op[0].lower() + op[1:])
        elif op == 'GotoLabel':
            self.emit('gotoAndStop(%s);' % self.pop())
        elif op == 'GotoFrame':
            self.emit('gotoAndStop(%s);' % arg)
        elif op == 'GetURL':
            self.emit('getURL(%s, %s);' % (self.pop(), self.pop()))
        elif op == 'DefineFunction2' or op == 'DefineFunction':
            pass  # 由 parse_blocks 分块, 不会进来
        elif op == 'With':
            self.emit('with (%s) {' % self.pop())
        elif op == 'EndWith' or op == '}':
            self.emit('}')
        elif op == 'Return':
            v = self.pop()
            self.emit('return %s;' % v)
        elif op == 'Enumerate':
            self.push('for-in ' + self.pop())
        elif op == 'SetVariable2':
            v = self.pop()
            n = self.pop()
            self.emit('%s = %s;' % (self.deref(n), v))
        elif op == 'RandomNumber':
            n = self.pop()
            self.push('random(%s)' % n)
        elif op == 'GetTimer':
            self.push('getTimer()')
        elif op == 'MBStringLength' or op == 'StringLength':
            self.push('len(%s)' % self.pop())
        elif op == 'CharToAscii':
            self.push('ord(%s)' % self.pop())
        else:
            self.emit('// ?? %s %s' % (op, arg[:40]))

    def deref(self, a):
        """GetVariable 的目标: _root/master_x 这类点路径 → 直接用"""
        s = strip_q(a)
        if s.startswith('_root') or s.startswith('this') or s.startswith('_parent'):
            return s
        if re.match(r'^r\d+$', s):
            return s
        if re.match(r'^[A-Za-z_]\w*$', s):
            return s
        return 'var(%s)' % a


def strip_q(name):
    """成员名: 去掉多余引号"""
    if len(name) >= 2 and name.startswith('"') and name.endswith('"'):
        return name[1:-1]
    return name


def convert_function(pcode_path, wanted=None):
    text = Path(pcode_path).read_text(encoding='utf-8-sig', errors='replace')
    # 用整个文件收集 ConstantPool (pool 声明可能在函数块之外)
    pools_scan = Converter(text.splitlines())
    pools_scan.prep()
    blocks = parse_blocks(text)
    out = []
    for b in blocks:
        name = fname(b.header)
        if wanted and name not in wanted:
            continue
        c = Converter(b.lines)
        c.pools = pools_scan.pools   # 继承全部 pool
        c.run()
        out.append('// ===== function %s =====' % name)
        out.append(b.header.split('{')[0].strip())
        out.extend(c.out)
        out.append('')
    return '\n'.join(out)


CORE = {
    "frame_6/PlaceObject2_6_327/CLIPACTIONRECORD onClipEvent(load).pcode":
        None,  # 全部函数
    "frame_6/PlaceObject2_6_329/CLIPACTIONRECORD onClipEvent(load).pcode": None,
    "DefineSprite_428_unit/frame_1/PlaceObject2_426_1/CLIPACTIONRECORD onClipEvent(load).pcode": None,
    "DefineSprite_174/frame_1/PlaceObject2_173_1/CLIPACTIONRECORD onClipEvent(load).pcode": None,
}


def main():
    out_dir = ROOT.parent.parent / 'pcode_as'
    out_dir.mkdir(exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] != '--all':
        p = Path(sys.argv[1])
        wanted = set(sys.argv[2:]) or None
        print(convert_function(p, wanted))
        return
    for rel in CORE:
        text = convert_function(ROOT / rel, CORE[rel])
        dst = out_dir / (rel.replace('/', '__') + '.pseudo.txt')
        dst.write_text(text, encoding='utf-8', newline='\n')
        print("%s → %s (%d 行)" % (rel, dst.name, text.count('\n')))


if __name__ == '__main__':
    main()
