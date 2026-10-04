# J2ME 网页模拟器使用笔记（已验证可玩配置）

> 2026-10-04 定稿。**City Bloxx v1.0.12 (a3) 丝滑完美**，对比验收以它为准。
> **权威初始画面**：`ref_citybloxx1012a3_initial.png`（开局工地全景截图，含黄土地基、
> 灰色水泥台、单缆吊具、背景楼群、HUD 000 层/3 命）——h5quick 视觉对齐以此图为准。

## 启动

```bash
# 模拟器服务器 (8211) — 必须用这个脚本, 普通 http.server 缺 Range/多段支持会卡死
cd j2me_ref/freej2me-web-main/web
python serve_local.py

# h5quick 游戏本 (8210)
cd tower-bloxx/h5quick
python -m http.server 8210
```

浏览器打开（jar 参数可换）：

```
http://127.0.0.1:8211/run.html?jar=citybloxx1012big.jar   ← 推荐, 丝滑完美
http://127.0.0.1:8211/run.html?jar=citybloxx1012.jar      — v1.0.12 标准版
http://127.0.0.1:8211/run.html?jar=towerbloxx1507.jar     — DC Tower Bloxx v1.5.07
http://127.0.0.1:8211/run.html?jar=towerbloxx1211.jar     — DC v1.2.11
http://127.0.0.1:8211/run.html?jar=citybloxx.jar          — 最初版
```

jar 存放处：`j2me_ref/freej2me-web-main/web/jar/`（均已 manifest 验真）。

## 关键经验（踩坑 3 小时的结论）

1. **冷启动 1~2 分钟是 CheerpJ 固有成本**（wasm 编译 JVM），期间"Loading CheerpJ..."静默是正常阶段，
   不是卡死。第二次启动走 IndexedDB 缓存会明显变快——**标签页别关，常驻热启动**。
   - 2026-10-04 完整取证：`cheerpjInit 完成 → freej2me-web.jar 下载` 之间 69 秒空窗内
     **服务器零请求**（rt.jar 走 IndexedDB 缓存，无网络活动）→ 该空窗是纯 CPU 类表构建，
     与下载无关，无法从服务器端优化。空窗后的真实下载：freej2me-web.jar 约 540KB +
     游戏 jar 291KB，Range 分块各 4~16ms，合计不到 1MB，非瓶颈。
     （页面日志 0KB = 浏览器缓存命中无传输；非 0KB = 真实传输，均正常。）
   - 服务器日志出现 `ConnectionAbortedError 10053` 属正常：CheerpJ 主动中止大块传输。
   - 加速手段只剩：保持标签页常驻（IDB 热缓存）+ 不要清 IndexedDB（除非卡死超 3 分钟）。
2. **卡在 Loading 超过 3 分钟 → 清 IndexedDB**（控制台执行）：
   ```js
   indexedDB.databases().then(ds => ds.forEach(d => indexedDB.deleteDatabase(d.name)))
   ```
   cheerpOS 的文件系统缓存 `cjFS_/files/` 会把坏时期下载的半成品数据当有效缓存反复使用——
   这是"无论服务器怎么修都卡同一位置"的元凶。
3. **服务器必须支持**：
   - HTTP Range 单段（206 + Content-Range）——JVM 类加载靠它惰性读 rt.jar；
   - **多段 Range**（`bytes=a-b,c-d` → multipart/byteranges）——cheerpOS 下载器会发，
     python rangehttpserver 默认返回 400 导致 JVM 挂死，`serve_local.py` 已补齐；
   - `/app/` 路径前缀改写到站点根（cheerpjWebRoot 约定）。
4. **运行时已全量本地化**：`web/cdn/20260317_2978/` 内含 loader/cj3/cj3.wasm/cj3n8.wasm/
   cheerpOS/c.html/c.js + `8/jre/lib/`（rt.jar 26.9MB、resources/javaws/jsse/jce/charsets/
   cheerpj-awt.jar），全部经 MD5/ZIP 校验与 CDN 一致，**离线可用**。
   注：`charsets/javaws/jce/jsse/resources.jar` 曾被 aria2 误存 0 字节占位（CDN 实际都有），
   已重拉真身；如再遇 JNI 初始化失败先查这批文件的 zip 完整性。
5. **main.js 阶段打点**（LLOG 面板在页面左下角）：页面就绪 → cheerpjInit 开始/完成 →
   cheerpjRunLibrary → 启动游戏。卡住时看最后一条到哪。模块有缓存问题，run.html 里
   main.js 带 `?v=2` 参数，改 main.js 后要升版本号。
6. jar 真伪鉴别：DC 官方版有 `.gsid` 指纹文件 + 2008-07-10 类时间戳；freej2me 默认皮肤
   会让正版看起来"假"，勿据此判断。

## j2me-web（miniJVM-wasm, 无 CheerpJ, 秒开）— 2026-10-04 部署

- 位置 `j2me_ref/j2me-web-main/`，启动 `node server.mjs` → `http://127.0.0.1:4173`
- 运行时用官方预构建（v0.3.4 release zip）放 `public/runtime/`，**无需 Docker/npm 构建**
- 游戏 jar 放 `fixture/J2ME/`，URL 直载：`/?fixture=CityBloxx&autostart=1`
- **硬要求**：SharedArrayBuffer → 必须真 Chrome/Edge 打开；**IAB 内核（WebKit 系）不实现
  COOP 隔离，`crossOriginIsolated=false`，无法在内置浏览器运行**（`browserSupported()` 检查不过）
- M3G/JSR-184 有 WebGL2 后端；`web/compatibility-profiles.js` 按 jar SHA-256 绑定档案——
  作者已验证 Tower Bloxx 3D（eb44f978），已添加我们的 City Bloxx v1.0.12a3（ad3d3ef0）
  档案 `city-bloxx-nokia-1012a3-m3g`（Nokia + WEBGL2）。改档案后外部浏览器 Ctrl+F5 生效。
- **实测结论（2026-10-04 用户验收）：j2me-web 跑 City Bloxx 无 3D——游戏有机型识别功能，
  检测到非真实 Nokia 硬件后自动退回 2D 界面。加档案也无法解决。**
  → **网页跑 City Bloxx（带 3D）的唯一可用方案仍是 freej2me-web（8211, CheerpJ）**，
  接受 69 秒冷启动，标签页常驻热玩。
- 其他参考：J2ME-For-Web（TS 解释器，无 JSR-184）、PluotSorbet（Mozilla 已死项目，phoneME
  系但无 WebGL）、wie（Rust/WASM，未证实 M3G）——均无法替代 j2me-web 跑 City Bloxx 3D。



## 对照验收成果（h5quick ↔ 8211 权威画面）

- ✅ 黄土地/水泥台修复（2026-10-04）：uid 对号勘误（cC=mesh269 灰板 vs uid20=mesh262 带贴图工地）
  + 转换器 RGBA 通道序 bug + game.js 材质覆盖 bug，详见 h5quick/README.md 第四轮修正。
  权威画面 = 本目录 `ref_citybloxx1012a3_initial*.png`。

## 对照验收要点（用户指出的 h5quick 三大疑点）

- 吊车悬臂/缆绳样式
- 地基水泥台颜色与覆盖关系
- 地基周围黄土 vs 灰色地面
