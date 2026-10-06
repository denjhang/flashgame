# 模拟农场 反混淆/反编译 工作交接（给新会话的开场简报）

> 2026-10-06 定稿。本文件是自包含交接：新会话只需读这一份即可开工。
> 遵守 AGENTS.md 铁律：**禁止猜测**，一切结论落到字节码/dex 原文引注。

## 已完成的事实（勿重做）

1. **可运行 jar 已造好**：`games/jars/模拟农场.jar`
   - 来源链：`G:\备份\BV0730 20261005\J2ME-Loader\converted\模拟农场\converted.dex`
     （J2ME-Loader 转换产物，100288B，7 类，已验证干净——无 loader/android 注入字符串）
   - 类转换用 **Enjarify**（`/tmp/enjarify-master`，即 google/enjarify master zip），
     忠实 Dalvik→Java 字节码，7/7 成功 0 错误。
     **禁用 jadx 反编译源码重编译**：jadx 把 `b.<init>` 字符串表计数循环编译错
     （h=1 而非 117 → `k[9]` AIOOBE），这是第一版 jar 蓝屏的根因。
   - `d.class` 打了 2 处字节码补丁：`invokestatic javax/microedition/util/ContextHolder.
     getResourceAsStream(Class,String)` → `invokevirtual java/lang/Class.
     getResourceAsStream(String)`（栈形态一致；Nokia S40 私有 API 换成 CLDC 通用 API，
     真 Nokia/任何模拟器可跑）。补丁脚本：`games/patch_enj.py`（常量池追加+调用点改写，
     可复现；注意它读 %TEMP%/simfarm_enjarify.jar，重跑前先重新 Enjarify）。
   - 资源与 manifest 原样来自 `converted\模拟农场\res\`（Icon.png / Res.ifo / Res0.pak /
     Res1.pak / META-INF）。
2. **运行验证通过**：freej2me-web (8211, `j2me_ref/freej2me-web-main/web`,
   `python serve_local.py`)，URL `http://127.0.0.1:8211/run.html?jar=simfarm.jar`，
   240×320 正常渲染、0 WARN。CheerpJ 冷启动 ~2min；卡 Loading >3min 先清 IndexedDB
   （先关游戏 tab，再开同源静态页如 /loader.js 执行
   `indexedDB.databases().then(ds=>ds.forEach(d=>indexedDB.deleteDatabase(d.name)))`）。
3. **调试设施已就位**：`web/src/loadlog.js` 会把 console（CheerpJ 的 Java stdout/stderr
   栈）打进左下角 LLOG 面板；改 main.js 要升 run.html 里 `?v=`。
4. **桌面 JVM 冒烟测试法**（快，不依赖浏览器）：
   ```
   cd /tmp/sftest
   javac/java -cp ".;…\freej2me-web-main\web\freej2me-web.jar;…\games\jars\模拟农场.jar" T.java
   ```
   freej2me-web.jar 自带全套 javax.microedition + com.nokia 存根，游戏类可直接反射调用。
   已验证：Res0.pak 首两字节 0xFFFE → p=true 分支，字符串表 117 条中文（16-bit char）。

## 游戏结构速览（已勘明）

- 类：Main / a(RMS 封装 TemplateRMS) / b(资源记录/文本) / c(菜单场景) / d(资源读取器：
  静态 Res.ifo 索引 + /Res{n}.pak 读取, 6 字节表项) / e(主逻辑 87KB) / f(FullCanvas 主画布,
  paint 按 state s 0-9 分发到 a..g 子绘制)。
- 资源格式：Res.ifo 每项 6 字节：[1]=pak号 [2]=type [3]=id [4..5]=长度(LE)；
  命中后 skip(累计长度+计数) 再读。文本为 length-prefixed 16-bit 字符流，0x000D 结尾。
- 存档：RMS `TemplateRMS`（备份里有实机存档 `data\模拟农场\TemplateRMS.1.rsr` 2596B + .rsh）。

## 新会话要做的事：反混淆 + 反编译

目标：把 a/b/c/d/e/f/Main 重命名成语义名，产出可读源码（Java 或对拍用）。

建议步骤：

1. **反编译（只读用，不回编）**：用 jadx（CLI `jadx -d out dir converted.dex`，或
   `/tmp` 下载 jadx zip）看结构；**一切语义结论以 dex Dalvik 指令或 enjarify class
   反汇编为准**（javap），jadx 输出仅当索引。
2. **命名映射**：按上面结构速览逐类逐方法建映射表（如 d→ResourceReader,
   d.a()→readChars, d.e()→readByte...），写成 `games/simfarm/mapping.md`，每条附
   dex 偏移/方法签名引注。
3. **资源导出**：写脚本按 Res.ifo 索引导出 pak 内条目（图片条目 d.h() 走
   Image.createImage → PNG; 文本条目按 16-bit 解码成 UTF-8），存
   `games/simfarm/res_dump/`。
4. **字符串表**：117 条中文已可读（桌面 JVM 测试打印过），落盘
   `games/simfarm/strings.txt`，帮助推断 UI 流程与状态机（f.paint 的 s 0-9）。
5. **持久化**：对拍实机存档 TemplateRMS.rsr 结构，确定存档字段含义。
6. 产物目录约定：`games/simfarm/`（本文件、mapping、dump、脚本）。

## 相关路径速查

- 工作 jar：`E:\working\vscode-projects\flashgame\games\jars\模拟农场.jar`
- dex/存档备份：`G:\备份\BV0730 20261005\J2ME-Loader\{converted,data,configs}\模拟农场\`
- 模拟器：`E:\working\vscode-projects\flashgame\j2me_ref\freej2me-web-main\web\`（8211）
- Enjarify：`%TEMP%\enjarify-master`（丢了就重下 google/enjarify master.zip，走 gh-proxy 镜像）
- 下载 GitHub 一律走 gh-proxy 镜像 + aria2c，见 AGENTS.md

## 进度更新（2026-10-06 会话）

- jadx 1.5.3 已装于 `/tmp/jadx`；jadx 源码拷贝在 `jadx_src/`，javap 反汇编在 `disasm/`。
- `mapping.md` 已建：类级映射 + d/b/c/f 逐方法映射 + 资源格式定论，均附引注。
- `res_dump.py` 可复现导出全部 17 条目 → `res_dump/`（PNG 11 张 + 字符串表 4 份 .str.txt + 菜单数据）。
- 字符串表：t1_id0=116条UI文本(+终止空串=117行), t1_id1=职员表, t1_id2=帮助, t1_id3=184条对话。
- 关键勘误：d() 偏移累加 = Σ(len+1)（字节码 @disasm/d.javap.txt L630-653 实证）；字符串消费量是相对计数 (i-pos)+4，jadx 的 `b += i+4` 里 i 是相对值。
- 待做：e 类 87KB 逐方法语义映射（借 t1_id3 对话文本与 t4 图片对拍）、RMS 存档字段对拍。

## 进度更新（2026-10-06 第二轮：全量反混淆完成）

- **mapping.md 已定稿（全量）**：7 类全部映射；e 类 87KB 主逻辑方法级映射完成
  （字段语义表、u 状态机 50-88 全表、作物/动物/背包数组、剧情过场 P..f 区间表）。
- **RMS 存档格式破解并对拍通过**：payload 2584B int BE（.rsr 容器头 12B）。
  偏移：0 状态 26int / 104 g[3] / 116 Y[11] / 160 w[16][2] 背包 / 288 n[50][6] 作物 /
  1488 d[16][14] 动物 / 2384 作物图块 50×4B。实机存档解析：380 金钱、10 成年鸡、
  2 小猪、50 块翻土地，全部合理。
- **17 条资源全部与代码引用对上**（mapping.md 资源总表，含每张图尺寸/用途/W 槽位）。
- k(Graphics) jadx 反编译失败处已用 javap 补齐（=动物层绘制+拾取判定）。
- 残留 3 个小不确定点在 mapping.md 末尾（d[][8/12/13] 下标、个别基价物名、装饰图块命名）。
- 反混淆阶段收工。下一步若移植：按 mapping.md 直接重写即可，无需再啃混淆码。

## 进度更新（2026-10-06 第三轮：残留点全部解决）

- d[16][14] 的 [8][12][13]：全代码仅清零写入零读取 → 死字段，移植可忽略。
- 卖出基价 i(3..10) 与资产页标签 k[71..78] 逐条对拍完成；玫瑰情人节(2月14日)×3。
- 商店 R=0..9 与描述串 k[24..43] 对拍完成；勘误：R=7 是杀虫剂50。
- w 背包 id 10-12 = 锄子/洒水壶/镰刀（k[68-70]）；手持决定动作（种/锄/浇/收）。
- 槽15 语义定案：王二家的鸡/猪闯入破坏庄稼，抓住得鸡肉+1或+30钱。
- 反混淆零残留。mapping.md 即权威规格书。
