---
name: github-fast-download
description: 从 GitHub 高速下载文件（release 资产/分支 zip/raw/clone）时使用 gh-proxy 镜像源 + aria2c，不走外网直连。当需要下载 GitHub 上的任何文件、zip、release、源码时使用此技能。
---

# GitHub 高速下载

优先镜像源 + aria2c；代理 7892 仅作回退。

## 镜像源（gh-proxy.org 系）

| 线路 | 前缀 |
|---|---|
| Cloudflare v4 主站（推荐） | `https://gh-proxy.org/` |
| Cloudflare v4 优选 | `https://v4.gh-proxy.org/` |
| Cloudflare v4/v6 优选 | `https://v6.gh-proxy.org/` |
| Fastly CDN | `https://cdn.gh-proxy.org/` |
| AxisNow v4 | `https://axisnow.gh-proxy.org/` |

用法 = 前缀 + 原始 GitHub URL 原样拼接：

- 分支 zip: `https://gh-proxy.org/https://github.com/<user>/<repo>/archive/refs/heads/main.zip`
- Release: `https://gh-proxy.org/https://github.com/<user>/<repo>/releases/download/<tag>/<file>`
- Raw: `https://gh-proxy.org/https://raw.githubusercontent.com/<user>/<repo>/<ref>/<path>`

## 下载命令

aria2c 位于 `/d/msys64/ucrt64/bin/aria2c.exe`（Git Bash 内可用）。

```bash
A2=/d/msys64/ucrt64/bin/aria2c.exe

# 首选: 镜像, 不走代理
$A2 -x 16 -s 16 -c --check-certificate=false -o out.zip "https://gh-proxy.org/https://github.com/<user>/<repo>/archive/refs/heads/main.zip"

# 回退: 代理直连 GitHub（镜像全挂时）
$A2 -x 16 -s 16 -c --all-proxy=http://127.0.0.1:7892 --check-certificate=false -o out.zip "https://github.com/<原始URL>"
```

## 注意事项

- 必加 `--check-certificate=false`（本机证书链缺失会报 SSL 错误）
- `-c` 断点续传；大文件可能被 CDN 中途重置连接，aria2 多线程重试即可拉完
- 下载后用 `wc -c` 验证大小，zip 用 `unzip -l` 或 python zipfile 校验完整性（曾出现截断文件）
- GitHub API（api.github.com）不在镜像覆盖内，查询 releases 元数据时走代理 7892
- 单一镜像失败时依次换 v4 → cdn → v6 → axisnow，主站兜底
