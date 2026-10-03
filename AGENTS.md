# GitHub 高速下载（镜像源 + aria2c）— 项目记忆

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
