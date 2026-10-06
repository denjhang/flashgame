# GitHub 高速下载（镜像源 + aria2c）— 项目记忆

> **铁律（2026-10-04 用户指令）：禁止猜测。一切编码/修改必须有根据、有来源。**
> 逆向对号必须落到反编译原文（House.java 行号/m3g 对象 id/MANIFEST），拿不出原文引注的
> 结论不许写进代码。视觉判断必须与权威截图对照，不许"看起来像"。

> 2026-10-04 验证。本机下载 GitHub 内容（release 资产 / 分支 zip / raw / clone）用下面的镜像源，
> 配合 aria2c 走不走代理都很快。**优先镜像，代理 7892 只作回退。**

## 可用镜像源（gh-proxy.org 系，5 条线路）

| 线路 | 前缀 |
|---|---|
| Cloudflare v4（主站，推荐） | `https://gh-proxy.org/` |
| Cloudflare v4 优选 | `https://v4.gh-proxy.org/` |
| Cloudflare v4/v6 优选 | `https://v6.gh-proxy.org/` |
| Fastly CDN | `https://cdn.gh-proxy.org/` |
| AxisNow v4 优选 | `https://axisnow.gh-proxy.org/` |

用法 = 前缀 + 原始 GitHub URL（无需改 URL 结构）：

```
分支 zip:  https://gh-proxy.org/https://github.com/<user>/<repo>/archive/refs/heads/main.zip
Release:   https://gh-proxy.org/https://github.com/<user>/<repo>/releases/download/<tag>/<file>
Raw 文件:  https://gh-proxy.org/https://raw.githubusercontent.com/<user>/<repo>/<ref>/<path>
```

## aria2c 用法（本机路径 /d/msys64/ucrt64/bin/aria2c.exe）

```bash
A2=/d/msys64/ucrt64/bin/aria2c.exe
# 不走代理（镜像通常更快）:
$A2 -x 16 -s 16 -c --check-certificate=false -o out.zip "<镜像URL>"
# 走 7892 代理（镜像失败时回退，或直连 GitHub 时）:
$A2 -x 16 -s 16 -c --all-proxy=http://127.0.0.1:7892 --check-certificate=false -o out.zip "<URL>"
```

要点：
- `-c` 断点续传；大文件（rt.jar 26MB 等）实测连接重置后循环重试即可拉完
- `--check-certificate=false` 必加（本机证书链报 unable to get local issuer certificate）
- GitHub API（api.github.com）不受镜像覆盖，仍走代理 7892
- 注意 CDN 对大文件的连接可能中途重置，aria2 `-x16 -s16` + `-c` 实测可靠

## 本机其他下载相关事实

- Clash 代理固定 `http://127.0.0.1:7892`
- MSYS2 pacman 已配 USTC/清华源（msys 仓库路径带 x86_64，mingw 仓库不带 $arch）
- MSYS2 装的 aria2 在 `/d/msys64/ucrt64/bin/aria2c.exe`（包名 mingw-w64-ucrt-x86_64-aria2）

# J2ME 逆向工具链 — 项目记忆（2026-10-06 验证）

> 本工程长期做 J2ME 移植（tower-bloxx / city bloxx / simfarm 等）。
> 铁律见上：一切语义结论以字节码（javap/baksmali）+ 资源原始字节实证为准，jadx 只当索引用。

## 已装好的工具（勿重装/重下）

| 工具 | 位置 | 用途 |
|---|---|---|
| jadx 1.5.3 | `/tmp/jadx/bin/jadx.bat`（zip 备份 `/tmp/jadx.zip`） | 反编译**只当索引用，禁止拿它回编**（会把字符串表计数循环编错，simfarm 第一版蓝屏根因） |
| Enjarify | `%TEMP%\enjarify-master`（丢了走 gh-proxy 重下 google/enjarify master.zip） | Dalvik dex → Java 字节码，忠实（比 jadx 回编可靠） |
| freej2me-web | `j2me_ref/freej2me-web-main/web/`（python serve_local.py, 端口 8211） | 浏览器跑 jar 验证；`web.jar` 自带 javax.microedition + com.nokia 存根可做桌面 JVM 冒烟测试 |
| aria2c | `/d/msys64/ucrt64/bin/aria2c.exe` | 见上节 |

## 标准逆向流程（simfarm 实战定型）

1. dex → Enjarify → jar（打补丁用 python 改常量池+调用点，参考 `games/patch_enj.py`）
2. jadx 出源码当索引；语义对号用 `javap -c -p -classpath <jar解出的classes>`，**不要用旧目录里可能过期的 class**
3. 建映射表 `mapping.md`，每条附 jadx 行号 + javap 字节码偏移引注
4. 资源按反编译出的格式写 python 脚本导出，逐条目用魔数/尾标记验证偏移（PNG 魔数 89504E47 / IEND、文本 FFFE 头）
5. 字符串表落盘帮助推断 UI 流程/状态机

## 实战踩坑（重点记住）

- **jadx 显示的变量可能是相对计数**：如 `b += i+4` 的 i 是 `i-this.b` 相对值，脚本照抄绝对下标会全串错位（simfarm d.a() 踩过）
- **javap 前先确认 class 来源新鲜**：/tmp 下残留旧产物会给出与 jar 不符的反汇编
- **脚本化验证偏移，不要手数 hexdump**：hexdump 行数极易数错，写 python 对全部条目断言魔数
- simfarm 资源格式定论与逐条引注见 `games/simfarm/mapping.md`（Res.ifo 6B 表项、pak 偏移=Σ(len+1)、字符串 0D 00 结尾+2 垫）
- **simfarm 反混淆已全量完成**（2026-10-06）：7 类语义映射、e 类方法级+状态机、RMS 存档 2584B 布局（对拍实机 rsr 通过）、17 条资源全对号、物品/作物/动物 id 与价格全部与字符串表逐条对拍（含情人节玫瑰×3、邻居牲口闯入事件），零残留不确定点；`games/simfarm/mapping.md` 即权威规格书，移植时直接照它重写，不必再读混淆码
