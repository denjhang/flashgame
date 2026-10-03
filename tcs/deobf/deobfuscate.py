#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TCS.swf ActionScript2 反混淆器 v1
还原混淆器的控制流平坦化(while(true) 状态机)为线性代码。

原理:
  混淆器把顺序代码拆成状态机:
    function §\x04\x05§() { set("\x03", N % 511 * 5); return eval("\x03"); }   // 恒定函数 C
    var §\x01§ = INIT + "\x04\x05"();          // 初始状态 = INIT + C
    while(true) {
       if(eval("\x01") == S1) { set("\x01", eval("\x01") OP K); [work] }
       else if(eval("\x01") == S2) { ... }
       ...
    }
  所有跳转条件都是编译期常量 → 每条路径静态可判定。
  直接模拟执行, 按执行顺序拼接 work 语句即得原代码。

分支体内的语句分类(控制区规则):
  - set(状态变量, ...)                    → 状态转移(控制)
  - if(恒定函数){ set(状态变量,...) }      → 条件转移(控制, 常量恒真/恒假)
  - break / return                        → 结束
  - 其余(真实赋值/调用/真实if)             → work, 其后全部语句原样保留(遇顶层 break/return 终止)
"""
import re
import sys
import json
from pathlib import Path

SRC_DEFAULT = Path(r"D:\working\vscode-projects\flashgame\decompiled\scripts\scripts")
DST_DEFAULT = Path(r"D:\working\vscode-projects\flashgame\deobf\scripts")

MAX_STEPS = 100000

# ---------------- 文本基础工具 ----------------

def skip_string(text, i):
    """text[i] == '\"'。返回字符串结束引号之后的位置。"""
    i += 1
    n = len(text)
    while i < n:
        c = text[i]
        if c == '\\':
            i += 2
            continue
        if c == '"':
            return i + 1
        i += 1
    return n

def match_brace(text, open_idx):
    """text[open_idx]=='{'。返回匹配'}'下标, 失败返回-1。"""
    depth = 0
    i, n = open_idx, len(text)
    while i < n:
        c = text[i]
        if c == '"':
            i = skip_string(text, i)
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

def match_paren(text, open_idx):
    depth = 0
    i, n = open_idx, len(text)
    while i < n:
        c = text[i]
        if c == '"':
            i = skip_string(text, i)
            continue
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

ARITH_RE = re.compile(r'^[\d\s%*+/()-]+$')

def const_eval(expr):
    """求值纯算术常量表达式, 失败返回 None。"""
    e = expr.strip()
    if not e or not ARITH_RE.match(e):
        return None
    try:
        v = eval(e, {"__builtins__": {}}, {})
        return int(v)
    except Exception:
        return None

def reindent(text, pad="   "):
    lines = [ln.strip() for ln in text.strip().splitlines()]
    lines = [ln for ln in lines if ln]
    return ("\n" + pad).join(lines)

# ---------------- 语句解析 ----------------

class Amb(Exception):
    """无法静态判定 → 该 handler 放弃线性化。"""
    pass

def scan_stmt_end(block, i):
    """从 i 扫描到语句结束(顶层';'之后, 或块结束)。返回结束位置(不含')。"""
    dp = db = 0
    n = len(block)
    while i < n:
        c = block[i]
        if c == '"':
            i = skip_string(block, i)
            continue
        if c == '(':
            dp += 1
        elif c == ')':
            dp -= 1
        elif c == '{':
            db += 1
        elif c == '}':
            if db == 0:
                return i          # 不消耗, 交给上层
            db -= 1
        elif c == ';' and dp == 0 and db == 0:
            return i + 1
        i += 1
    return n

def parse_if(block, i):
    """block[i:] 以 'if' 开头。解析 if [else if.../else], 返回 (stmt_dict, next_idx)。
    body/else 均为 stmt 列表; raw 保留原文。"""
    pm = re.compile(r'\s*if\s*\(').match(block, i)
    if not pm:
        raise Amb("parse_if: no if(")
    po = pm.end() - 1
    pc = match_paren(block, po)
    if pc < 0:
        raise Amb("parse_if: unbalanced (")
    cond = block[po + 1:pc].strip()
    bm = re.compile(r'\s*\{').match(block, pc + 1)
    if not bm:
        raise Amb("parse_if: body not {")
    bo = bm.end() - 1
    bc = match_brace(block, bo)
    if bc < 0:
        raise Amb("parse_if: unbalanced {")
    body = parse_stmts(block[bo + 1:bc])
    j = bc + 1
    els = None
    em = re.compile(r'\s*else\b').match(block, j)
    if em:
        k = em.end()
        ifm = re.compile(r'\s*if\b').match(block, k)
        if ifm:
            sub, j2 = parse_if(block, k)
            els = [sub]
            j = j2
        else:
            bm2 = re.compile(r'\s*\{').match(block, k)
            if not bm2:
                raise Amb("parse_if: else not {")
            bo2 = bm2.end() - 1
            bc2 = match_brace(block, bo2)
            if bc2 < 0:
                raise Amb("parse_if: else unbalanced {")
            els = parse_stmts(block[bo2 + 1:bc2])
            j = bc2 + 1
    stmt = {'kind': 'if', 'cond': cond, 'body': body, 'else': els,
            'raw': block[i:j]}
    return stmt, j

def parse_stmts(block):
    """块 → 语句列表。语句: {'kind':'if',...} / {'kind':'while',...} / {'kind':'code',...}"""
    stmts = []
    i, n = 0, len(block)
    ws = re.compile(r'[\s;]*')
    while i < n:
        m = ws.match(block, i)
        i = m.end()
        if i >= n:
            break
        if block.startswith('if', i) and re.match(r'if\s*\(', block[i:]):
            stmt, i = parse_if(block, i)
            stmts.append(stmt)
            continue
        wm = re.match(r'while\s*\(\s*true\s*\)\s*\{', block[i:])
        if wm:
            bo = i + wm.end() - 1
            bc = match_brace(block, bo)
            if bc < 0:
                raise Amb("while unbalanced")
            inner = parse_stmts(block[bo + 1:bc])
            stmts.append({'kind': 'while', 'body': inner, 'raw': block[i:bc + 1]})
            i = bc + 1
            continue
        j = scan_stmt_end(block, i)
        if j <= i:
            raise Amb("stmt scan stuck at: " + block[i:i + 40])
        raw = block[i:j]
        text = raw.strip()
        if text.endswith(';'):
            text = text[:-1].rstrip()
        stmts.append({'kind': 'code', 'text': text, 'raw': raw})
        i = j
    return stmts

# ---------------- 条件与状态转移 ----------------

CFUN_LIT_RE = re.compile(
    r'^\s*!\s*function\s+§((?:\\.|[^§\\])*)§\s*\(\s*\)\s*\{[^{}]*\}\s*$')
CFUN_LIT_RE2 = re.compile(
    r'^\s*function\s+§((?:\\.|[^§\\])*)§\s*\(\s*\)\s*\{[^{}]*\}\s*$')
STATE_CMP_RE_TPL = r'^eval\(\s*"{esc}"\s*\)\s*(==|!=|<=|>=|<|>)\s*(-?\d+)$'

def parse_cond(cond):
    """→ ('const',True) ('const',False) ('state',op,n) 或 ('unknown',)"""
    c = cond.strip()
    # 去掉成对 outer 括号
    while c.startswith('('):
        pc = match_paren(c, 0)
        if pc == len(c) - 1:
            c = c[1:pc].strip()
        else:
            break
    if '&&' in c or '||' in c:
        return ('unknown',)
    m = CFUN_LIT_RE.match(c)
    if m:
        return ('const', False)   # !CFUN → 恒假
    m = CFUN_LIT_RE2.match(c)
    if m:
        return ('const', True)    # CFUN → 恒真
    esc = inner_name_of_any(c)
    m = re.match(STATE_CMP_RE_TPL.format(esc=re.escape(esc)) if esc else r'^$', c)
    if m:
        return ('state', m.group(1), int(m.group(2)))
    return ('unknown',)

def inner_name_of_any(cond):
    """从条件文本里猜状态变量的 esc 名(用于状态比较), 失败返回 None。"""
    m = re.match(r'^\s*eval\(\s*"((?:\\.|[^"\\])*)"\s*\)', cond)
    return m.group(1) if m else None

def eval_cond(cond_ast, V):
    t = cond_ast[0]
    if t == 'const':
        return cond_ast[1]
    if t == 'state':
        op, n = cond_ast[1], cond_ast[2]
        return {'==': V == n, '!=': V != n, '<': V < n,
                '>': V > n, '<=': V <= n, '>=': V >= n}[op]
    return None

def make_state_set_checker(state_esc):
    rx = re.compile(r'^set\(\s*"' + re.escape(state_esc) +
                    r'"\s*,\s*(.*?)\s*\)$', re.S)
    op_re = re.compile(r'^eval\(\s*"' + re.escape(state_esc) +
                       r'"\s*\)\s*([-+*/%])\s*(-?\d+)$')
    set_re = re.compile(r'^(-?\d+)$')
    opc_re = re.compile(r'^eval\(\s*"' + re.escape(state_esc) +
                        r'"\s*\)\s*([-+*/%])\s*"(?:\\.|[^"\\])*"\s*\(\s*\)$')
    setc_re = re.compile(r'^"(?:\\.|[^"\\])*"\s*\(\s*\)$')

    def check(text):
        """返回 ('op',sym,k) / ('set',k) / ('opc',sym) / ('setc',) / None(不是状态set)
        / 'unknown'(是状态set但形态不明)"""
        m = rx.match(text)
        if not m:
            return None
        rhs = m.group(1).strip()
        m2 = op_re.match(rhs)
        if m2:
            return ('op', m2.group(1), int(m2.group(2)))
        m3 = set_re.match(rhs)
        if m3:
            return ('set', int(m3.group(1)))
        m4 = opc_re.match(rhs)
        if m4:
            return ('opc', m4.group(1))
        m5 = setc_re.match(rhs)
        if m5:
            return ('setc',)
        return 'unknown'
    return check

def apply_state(st, V, C):
    kind = st[0]
    if kind == 'op':
        sym, k = st[1], st[2]
        return {'+': V + k, '-': V - k, '*': V * k,
                '/': V // k, '%': V % k}[sym]
    if kind == 'set':
        return st[1]
    if kind == 'opc':
        sym = st[1]
        return {'+': V + C, '-': V - C, '*': V * C,
                '/': V // C, '%': V % C}[sym]
    if kind == 'setc':
        return C
    raise Amb("unknown state set form")

# ---------------- 模拟 ----------------

def classify_cfun_body(body_text):
    """恒定函数体: set("V",纯算术); return eval("V"); → C 或 None"""
    b = body_text.strip()
    m = re.match(r'^set\(\s*"((?:\\.|[^"\\])*)"\s*,\s*([^;]+?)\)\s*;\s*'
                 r'return\s+eval\(\s*"(?:\\.|[^"\\])*"\s*\)\s*;?$', b, re.S)
    if not m:
        return None
    return const_eval(m.group(2))

def is_pure_state_sets(stmts, check_state_set):
    """控制if体: 只含 状态set 语句"""
    if not stmts:
        return False
    for s in stmts:
        if s['kind'] != 'code':
            return False
        if check_state_set(s['text']) is None:
            return False
    return True

# ---------------- 常量栈折叠 ----------------

UNK = object()   # 运行时才能确定的栈值

PUSH_RE = re.compile(r'^§§push\((.*)\)$', re.S)

def _lit_value(e):
    """字面量/常量表达式 → (known, py值)"""
    e = e.strip()
    if re.match(r'^-?\d+$', e):
        return True, int(e)
    if e == 'true':
        return True, True
    if e == 'false':
        return True, False
    if re.match(r'^"(?:\\.|[^"\\])*"$', e, re.S):
        return True, e
    m = re.match(r'^!(-?\d+)$', e)
    if m:
        return True, (int(m.group(1)) == 0)
    return False, None

def fold_pops(t, stack):
    """把语句里的 §§pop() 依序替换为栈值(已知→字面量, 未知→保留原文)。
    返回 (新文本, 是否全部已知)。"""
    known_all = True
    out = []
    pos = 0
    for m in re.finditer(r'§§pop\(\)', t):
        out.append(t[pos:m.start()])
        if stack:
            v = stack.pop()
            if v is UNK:
                known_all = False
                out.append('§§pop()')
            elif isinstance(v, bool):
                out.append('true' if v else 'false')
            else:
                out.append(str(v))
        else:
            known_all = False
            out.append('§§pop()')
        pos = m.end()
    out.append(t[pos:])
    return ''.join(out), known_all

def run_stmts(stmts, V, out, C, check_state_set, ctx, depth=0):
    """执行语句序列。返回 (control, V)。
    control: ''=体自然结束 / 'continue'=本轮结束 / 'break'=跳出本层while
             / 'break_l'=带标签break(冒泡到最外层) / 'return'
    out: list[str]; ctx['stack']: 常量栈。"""
    if depth > 8:
        raise Amb("while nesting too deep")
    in_work = False
    for st in stmts:
        if st['kind'] == 'while':
            # 嵌套状态机: 反复执行内层体直到 break/return
            seen_local = set()
            steps_local = 0
            while True:
                steps_local += 1
                if steps_local > 10000:
                    raise Amb("inner while too long (V=%d)" % V)
                r, V = run_stmts(st['body'], V, out, C, check_state_set,
                                 ctx, depth + 1)
                if r == 'break':
                    break
                if r in ('return', 'break_l'):
                    return r, V
                if V in seen_local:
                    raise Amb("inner while cycle at %d" % V)
                seen_local.add(V)
            continue
        if st['kind'] == 'if':
            if not in_work:
                cond = st['cond'].strip()
                # 栈值条件: if(§§pop())
                if re.match(r'^§§pop\(\)$', cond):
                    if stack:
                        v = stack.pop()
                        if v is UNK:
                            raise Amb("if(§§pop()) unknown value")
                        cv = bool(v)
                    else:
                        raise Amb("if(§§pop()) empty stack")
                    if cv:
                        r, V = run_stmts(st['body'], V, out, C,
                                         check_state_set, ctx, depth)
                        if r:
                            return r, V
                    elif st.get('else') is not None:
                        r, V = run_stmts(st['else'], V, out, C,
                                         check_state_set, ctx, depth)
                        if r:
                            return r, V
                    continue
                cond_ast = parse_cond(cond)
                if cond_ast[0] == 'const':
                    # 恒定条件: 与体无关, 静态判定
                    if cond_ast[1]:
                        r, V = run_stmts(st['body'], V, out, C,
                                         check_state_set, ctx, depth)
                        if r:
                            return r, V
                    continue
                if cond_ast[0] == 'state':
                    cv = eval_cond(cond_ast, V)
                    if cv:
                        r, V = run_stmts(st['body'], V, out, C,
                                         check_state_set, ctx, depth)
                        if r:
                            return r, V
                    elif st.get('else') is not None:
                        r, V = run_stmts(st['else'], V, out, C,
                                         check_state_set, ctx, depth)
                        if r:
                            return r, V
                    continue
                # unknown 条件 → 真实 if → work
            in_work = True
            out.append(reindent(st['raw']))
            continue
        # code 语句
        t = st['text']
        if not in_work:
            pm = PUSH_RE.match(t)
            if pm:
                inner = pm.group(1).strip()
                if '§§pop' in inner:
                    inner2, _k = fold_pops(inner, ctx['stack'])
                    val, known = _lit_value(inner2)
                else:
                    val, known = _lit_value(inner)
                ctx['stack'].append(val if known else UNK)
                continue
            chk = check_state_set(t)
            if chk is not None:
                if chk == 'unknown':
                    raise Amb("unknown state set: " + t[:60])
                V = apply_state(chk, V, C)
                continue
            if re.fullmatch(r'break', t):
                return 'break', V
            if re.fullmatch(r'break\s+\w+', t):
                return 'break_l', V
            if re.fullmatch(r'continue', t):
                return 'continue', V
            if re.match(r'^return\b', t):
                out.append(t)
                return 'return', V
            # 第一条真实 work
            in_work = True
        else:
            # work 区中出现的顶层 break/continue/return = 流程控制
            if re.fullmatch(r'break', t):
                return 'break', V
            if re.fullmatch(r'break\s+\w+', t):
                return 'break_l', V
            if re.fullmatch(r'continue', t):
                return 'continue', V
            if re.match(r'^return\b', t):
                out.append(t)
                return 'return', V
            if check_state_set(t) is not None:
                raise Amb("state set inside work zone: " + t[:60])
        # 真实 work: 折叠 §§pop 后入 out; var §§pop() = 纯值 → 消掉
        if re.match(r'^var\s+§§pop\(\)\s*=\s*(.*)$', t, re.S):
            rhs = re.match(r'^var\s+§§pop\(\)\s*=\s*(.*)$', t, re.S).group(1)
            if ctx['stack']:
                ctx['stack'].pop()
            rhs2, k = fold_pops(rhs, ctx['stack'])
            val, known = _lit_value(rhs2)
            if known:
                ctx['stack'].append(val if not isinstance(val, bool) else val)
                continue
            out.append(reindent(st['raw']))
            continue
        t2, _k = fold_pops(t, ctx['stack'])
        out.append(reindent(st['raw'] if 'raw' in st else t))
    return '', V

def simulate(chain, V0, C, check_state_set, ctx):
    """chain: while体顶层语句列表 → (work列表, 状态路径)"""
    V = V0
    out = []
    path = [V0]
    seen = {V0}
    for _ in range(ctx['max_steps']):
        r, V2 = run_stmts(chain, V, out, C, check_state_set, ctx)
        if r in ('break', 'break_l', 'return'):
            return out, path
        if V2 == V:
            # 无分支匹配且无转移 = 混淆器的"归零退出"语义, 离开循环
            return out, path
        if V2 in seen:
            raise Amb("cycle at state %d" % V2)
        seen.add(V2)
        V = V2
        path.append(V2)
    raise Amb("too many steps path=%s" % path[-15:])

# ---------------- handler 处理 ----------------

HANDLER_OPEN_RE = re.compile(r'\bon\s*\(|\bonClipEvent\s*\(')
CFUN_DEF_RE = re.compile(
    r'function\s+§((?:\\.|[^§\\])*)§\s*\(\s*\)\s*\{')
VAR_INIT_RE = re.compile(
    r'var\s+§((?:\\.|[^§\\])*)§\s*=\s*([^;]+);')
WHILE_RE = re.compile(r'while\s*\(\s*true\s*\)\s*\{')
NUM_CF = r'(-?\d+)\s*([+-])\s*"((?:\\.|[^"\\])*)"\s*\(\s*\)'
STR_CALL = r'"\s*\(\s*\)'
CF_CALL = r'§(?:\\.|[^§\\])*§\s*\(\s*\)'

def split_handlers(text, is_doaction):
    """→ [(header, body, span)]"""
    if is_doaction:
        return [("DoAction", text, (0, len(text)))]
    parts = []
    pos = 0
    while True:
        m = HANDLER_OPEN_RE.search(text, pos)
        if not m:
            break
        pm = re.compile(r'\(').search(text, m.start())
        pe = match_paren(text, pm.start())
        bm = re.compile(r'\{').search(text, pe + 1)
        bo = bm.start()
        bc = match_brace(text, bo)
        if bc < 0:
            break
        header = text[m.start():bo].strip()
        parts.append((header, text[bo + 1:bc], (m.start(), bc + 1)))
        pos = bc + 1
    return parts

def process_handler(header, body):
    """→ (status, new_body, info)。status: 'linearized'|'clean'|'failed'"""
    info = {}
    # 预处理: 删除 while 前的标签行 (loop0: 等)
    body = re.sub(r'(^[ \t]*[A-Za-z_]\w*:[ \t]*\n)', '', body, flags=re.M)
    cfuns = {}          # esc_name -> C
    spans = []          # (start, end, replacement)

    # 1. 找 while(true) 块 (只收顶层; 嵌套 while 交给 run_stmts 递归处理)
    raw_whiles = []
    for m in WHILE_RE.finditer(body):
        bo = m.end() - 1
        bc = match_brace(body, bo)
        if bc < 0:
            return 'failed', None, {'reason': 'while unbalanced'}
        raw_whiles.append((m.start(), m.end(), bo, bc))
    whiles = []
    for w in raw_whiles:
        # 嵌套于其它 while 内 → 跳过 (由 run_stmts 递归处理)
        nested = any(a <= w[0] and w[3] <= d and (a, d) != (w[0], w[3])
                     for (a, _b, _c, d) in raw_whiles)
        if not nested:
            whiles.append(w)
    if not whiles:
        return 'clean', None, info

    def in_any_while(pos):
        return any(ws_ <= pos <= bc + 1 for (ws_, _me, _bo, bc) in whiles)

    # 2. 收集恒定函数定义(跳过 while 体内的内联匿名函数;
    #    表达式位置的 def 不删除, 留给 postprocess 替换为 C)
    cfuns = {}          # esc_name -> C
    spans = []          # (start, end, replacement)
    for m in CFUN_DEF_RE.finditer(body):
        bo = m.end() - 1
        bc = match_brace(body, bo)
        if bc < 0:
            continue
        C = classify_cfun_body(body[bo + 1:bc])
        name = m.group(1)
        if C is None:
            continue
        if name in cfuns and cfuns[name] != C:
            info['warn'] = 'cfun conflict %s' % name
        cfuns[name] = C
        if in_any_while(m.start()):
            continue
        # 判断是否语句位置: 前方最近非空白字符是行首/分号/大括号
        k = m.start() - 1
        while k >= 0 and body[k] in ' \t\n':
            k -= 1
        if k < 0 or body[k] in ';}{':
            spans.append((m.start(), bc + 1, ''))
    if not cfuns:
        return 'clean', None, info

    def parse_init(vi):
        """init var 语句 → (V0, state_esc)"""
        rhs = vi.group(2).strip()
        m2 = re.match(r'^' + NUM_CF + r'$', rhs)
        m3 = re.match(r'^"((?:\\.|[^"\\])*)"\s*\(\s*\)$', rhs)
        m4 = re.match(r'^§((?:\\.|[^§\\])*)§\s*\(\s*\)$', rhs)
        if m2:
            C = cfuns.get(m2.group(3))
            if C is None:
                raise Amb('init cfun unknown')
            return (int(m2.group(1)) + (C if m2.group(2) == '+' else -C),
                    vi.group(1))
        if m3:
            C = cfuns.get(m3.group(1))
            if C is None:
                raise Amb('init cfun unknown')
            return (C, vi.group(1))
        if m4:
            C = cfuns.get(m4.group(1))
            if C is None:
                raise Amb('init cfun unknown')
            return (C, vi.group(1))
        m5 = re.match(r'^(-?\d+)$', rhs)
        if m5:
            return (int(m5.group(1)), vi.group(1))
        raise Amb('init form unknown: ' + rhs[:50])

    def simulate_piece(chain, V0, state_esc):
        check_state_set = make_state_set_checker(state_esc)
        ctx = {'max_steps': MAX_STEPS, 'stack': []}
        work, path = simulate(chain, V0, _C_of(cfuns), check_state_set, ctx)
        linear = "   " + "\n   ".join(work)
        return linear, path

    # 3a. 整体模式: init 之后的所有顶层语句作为一条 chain (支持接力状态机)
    try:
        w0 = whiles[0]
        head = body[:w0[0]]
        vi0 = None
        for m in VAR_INIT_RE.finditer(head):
            vi0 = m
        if vi0 is not None:
            V0, state_esc = parse_init(vi0)
            chain = parse_stmts(body[vi0.end():])
            linear, path = simulate_piece(chain, V0, state_esc)
            all_spans = spans + [(vi0.start(), vi0.end(), ''),
                                 (vi0.end(), len(body),
                                  "// [deobf] states: %s\n%s" % (
                                      "->".join(map(str, path)), linear))]
            all_spans.sort(key=lambda x: x[0])
            if all(all_spans[i][0] >= all_spans[i - 1][1]
                   for i in range(1, len(all_spans))):
                buf = []
                pos = 0
                for (a, b, rep) in all_spans:
                    buf.append(body[pos:a])
                    buf.append(rep)
                    pos = b
                buf.append(body[pos:])
                info['handlers_linearized'] = 1
                info['states'] = len(path)
                return 'linearized', ''.join(buf), info
    except Amb:
        pass  # 整体模式失败 → 回退逐 while 模式

    # 3b. 逐 while 模式: 每个 while 独立找 init 模拟
    pieces = []         # (wstart, wend, linear_text, path, V0)
    inits = []          # (start,end) 待删除
    seen_inits = set()
    for (ws_, wme, bo, bc) in whiles:
        head = body[:ws_]
        vi = None
        for m in VAR_INIT_RE.finditer(head):
            vi = m
        if vi is None:
            return 'failed', None, {'reason': 'no init var'}
        try:
            V0, state_esc = parse_init(vi)
        except Amb as e:
            return 'failed', None, {'reason': 'amb: %s' % e}
        chain = parse_stmts(body[wme:bc])
        try:
            linear, path = simulate_piece(chain, V0, state_esc)
        except Amb as e:
            return 'failed', None, {'reason': 'amb: %s' % e}
        pieces.append((ws_, bc + 1, linear, path, V0))
        if vi.start() not in seen_inits:
            seen_inits.add(vi.start())
            inits.append((vi.start(), vi.end()))

    # 4. 组装: 删除 cfun 定义 / init 行, 替换 while 块
    all_spans = spans + [(a, b, '') for (a, b) in inits] + \
        [(p[0], p[1], "// [deobf] states: %s\n%s" % ("->".join(map(str, p[3])), p[2]))
         for p in pieces]
    all_spans.sort(key=lambda x: x[0])
    for i in range(1, len(all_spans)):
        if all_spans[i][0] < all_spans[i - 1][1]:
            return 'failed', None, {'reason': 'span overlap'}
    buf = []
    pos = 0
    for (a, b, rep) in all_spans:
        buf.append(body[pos:a])
        buf.append(rep)
        pos = b
    buf.append(body[pos:])
    info['handlers_linearized'] = len(pieces)
    info['states'] = max((len(p[3]) for p in pieces), default=0)
    return 'linearized', ''.join(buf), info

def _C_of(cfuns):
    return next(iter(cfuns.values())) if cfuns else 0

def _cfun_of_state(state_esc, cfuns):
    return None

# ---------------- 后处理 ----------------

def postprocess(text, cfuns):
    """函数字面量→C; eval(N)→N; 字符串调用→C; 乱码utf8标记→可读名"""
    def repl_lit(m):
        C = cfuns.get(m.group(1))
        return str(C) if C is not None else m.group(0)

    text = re.sub(r'function\s+§((?:\\.|[^§\\])*)§\s*\(\s*\)\s*\{[^{}]*\}',
                  repl_lit, text)
    text = re.sub(r'eval\(\s*(-?\d+)\s*\)', r'\1', text)
    for esc, C in cfuns.items():
        text = re.sub(r'"' + re.escape(esc) + r'"\s*\(\s*\)', str(C), text)
        text = re.sub(r'§' + re.escape(esc) + r'§', '__c%d__' % C, text)
    text = re.sub(r'\{invalid_utf8=(\d+)\}', r'u\1', text)
    return text

# ---------------- 文件处理 ----------------

def process_file(path, dst_root, src_root):
    rel = path.relative_to(src_root)
    is_doaction = path.name.startswith('DoAction')
    raw = path.read_text(encoding='utf-8-sig', errors='replace')
    raw = raw.replace('\r\n', '\n')

    stats = {'file': str(rel), 'status': 'clean', 'handlers': 0,
             'linearized': 0, 'work_stmts': 0, 'reason': ''}

    try:
        handlers = split_handlers(raw, is_doaction)
    except Exception as e:
        stats.update(status='failed', reason='split: %s' % e)
        out = raw
        _write(dst_root / rel, out)
        return stats

    if not handlers:
        out = raw
        _write(dst_root / rel, out)
        return stats

    out_parts = []
    pos = 0
    any_fail = False
    fail_reason = ''
    lin_count = 0
    work_count = 0
    for (header, body, (a, b)) in handlers:
        out_parts.append(raw[pos:a])
        try:
            status, new_body, info = process_handler(header, body)
        except Exception as e:
            import traceback
            tbfr = traceback.extract_tb(sys.exc_info()[2])[-1]
            status, new_body, info = 'failed', None, {
                'reason': 'exc: %r @ %s:%d' % (e, tbfr.filename, tbfr.lineno)}
        stats['handlers'] += 1
        if status == 'linearized':
            # 后处理 + 包一层注释
            all_cfuns = {}
            for m in CFUN_DEF_RE.finditer(body):
                bo2 = m.end() - 1
                bc2 = match_brace(body, bo2)
                if bc2 < 0:
                    continue
                C = classify_cfun_body(body[bo2 + 1:bc2])
                if C is not None:
                    all_cfuns[m.group(1)] = C
            new_body = postprocess(new_body, all_cfuns)
            out_parts.append("%s{\n%s\n}" % (header, new_body))
            lin_count += 1
            work_count += info.get('handlers_linearized', 0)
        elif status == 'clean':
            out_parts.append("%s{\n%s\n}" % (header, body))
        else:
            any_fail = True
            fail_reason = info.get('reason', '?')
            out_parts.append(raw[a:b])
        pos = b
    out_parts.append(raw[pos:])
    out = ''.join(out_parts)

    if any_fail:
        stats.update(status='failed', reason=fail_reason)
    else:
        stats.update(status=('linearized' if lin_count else 'clean'),
                     linearized=lin_count, work_stmts=work_count)
    _write(dst_root / rel, out)
    return stats

def _write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8', newline='\n')

# ---------------- 主入口 ----------------

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(SRC_DEFAULT))
    ap.add_argument('--dst', default=str(DST_DEFAULT))
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--file', default='')
    args = ap.parse_args()

    src = Path(args.src)
    dst = Path(args.dst)
    dst.mkdir(parents=True, exist_ok=True)

    if args.file:
        files = [Path(args.file).resolve()]
    else:
        files = sorted(p for p in src.rglob('*.as'))

    results = []
    for idx, p in enumerate(files):
        try:
            r = process_file(p, dst, src)
        except Exception as e:
            r = {'file': str(p.relative_to(src)), 'status': 'failed',
                 'reason': 'outer: %r' % e, 'handlers': 0, 'linearized': 0,
                 'work_stmts': 0}
        results.append(r)
        if (idx + 1) % 100 == 0:
            print("[%d/%d] ok=%d failed=%d clean=%d" % (
                idx + 1, len(files),
                sum(1 for x in results if x['status'] == 'linearized'),
                sum(1 for x in results if x['status'] == 'failed'),
                sum(1 for x in results if x['status'] == 'clean')))
        if args.limit and idx + 1 >= args.limit:
            break

    # 统计
    n = len(results)
    ok = [r for r in results if r['status'] == 'linearized']
    failed = [r for r in results if r['status'] == 'failed']
    clean = [r for r in results if r['status'] == 'clean']
    print("\n===== 汇总 =====")
    print("总计: %d | 线性化成功: %d | 干净直通: %d | 失败: %d" % (
        n, len(ok), len(clean), len(failed)))
    reasons = {}
    for r in failed:
        reasons[r.get('reason', '?')] = reasons.get(r.get('reason', '?'), 0) + 1
    for k, v in sorted(reasons.items(), key=lambda x: -x[1]):
        print("  失败原因 [%s]: %d" % (k, v))

    (dst.parent / '_report.json').write_text(
        json.dumps(results, ensure_ascii=False, indent=1),
        encoding='utf-8')

    md = ["# TCS 反混淆批量报告\n",
          "- 总计: %d" % n,
          "- 线性化成功: %d" % len(ok),
          "- 干净直通: %d" % len(clean),
          "- 失败: %d\n" % len(failed),
          "## 失败原因分布\n"]
    for k, v in sorted(reasons.items(), key=lambda x: -x[1]):
        md.append("- `%s`: %d" % (k, v))
    md.append("\n## 失败文件清单\n")
    for r in failed[:200]:
        md.append("- %s — %s" % (r['file'], r.get('reason', '?')))
    (dst.parent / '_report.md').write_text(
        "\n".join(md), encoding='utf-8', newline='\n')
    print("报告: %s" % (dst.parent / '_report.md'))

if __name__ == '__main__':
    main()
