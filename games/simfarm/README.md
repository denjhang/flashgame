# 模拟农场（数字鱼/JOFUN）— 孤本存档说明

> 2026-10-07。据持有者确认：本游戏已成失传媒体，本工程内的副本是**孤本**（无公开下载源）。
> 请按文物对待：任何目录调整前先核对下方校验和。

## 孤本文件清单与 MD5

| 文件 | MD5 | 说明 |
|---|---|---|
| `games/jars/模拟农场.jar` | 4816881654bd0ce34494853deb7f210f | 可玩 jar（Enjarify 转制+CLDC 补丁，见 HANDOFF） |
| `games/simfarm/res_dump/`（17 文件） | 逐文件见 res_dump.py 复现产物 | 全部资源导出（PNG 魔数/IEND/FFFE 逐条验证） |
| `games/simfarm/mapping.md` | 66cbed6d81d7e4de8a42d38e844eb2d5 | 反混淆权威规格书（零残留） |
| `games/simfarm/story.md` | 37dbce1071d88dd74e201170db9ffba6 | 剧情/玩法/隐藏/结局全案 |
| `games/simfarm/HANDOFF.md` | b2c7f37971d0fa3c9cc1423b7e9e70ac | 工作交接与进度 |
| `games/simfarm/res_dump.py` | 7915d82e0069739b9c5574fb584d7317 | 资源导出脚本（可复现） |

## 原始来源（G: 备份盘，本次会话期间未挂载，校验和待补）

- `G:\备份\BV0730 20261005\J2ME-Loader\converted\模拟农场\converted.dex`（100288B，7 类）
- `G:\备份\BV0730 20261005\J2ME-Loader\converted\模拟农场\res\`（Res.ifo / Res0.pak / Res1.pak / Icon.png / META-INF）
- `G:\备份\BV0730 20261005\J2ME-Loader\data\模拟农场\TemplateRMS.1.rsr`（2596B 实机存档）

## 复现链（jar 可从 dex 完整重建）

1. converted.dex → Enjarify → jar（`games/patch_enj.py` 打 CLDC 资源补丁）
2. 资源/MANIFEST 原样来自上面 res 目录
3. `games/simfarm/res_dump.py` 从 res 目录复现全部资源导出

## 玩法考证结论（防讹传）

- 天气仅晴/雨两态，**无龙卷风**（网络传言不实，见 story.md）
- 结局唯一：王二流亡、玩家成农场大亨
- 本 jar 为**试玩版**（画面硬编码"试玩版 仅供参考"），完整版是否存在待考
