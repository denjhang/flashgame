// 魔塔卡牌 V0.1.6 — AS3 → HTML5 移植
// 来源引注：
//   玩家_class.as / 招式_class.as / 战斗系统_class.as （fla 同目录原源码，逐字段转写）
//   DOMDocument.xml 时间轴脚本（fla_src/as3_out/DOMDocument_0~9.as）
//   布局坐标：DOMDocument.xml 主场景各帧 DOMSymbolInstance/DOMText 矩阵
'use strict';

// ============ 招式_class ============
class 招式 {
  constructor(招式名称_形参) {
    this.招式名称 = 招式名称_形参;
    this.攻击力 = 0;
    this.耗元气数 = 0;
    this.防御值 = 0;
    this.招式图帧位 = 1;
    this.招式效果描述 = "没效果";
  }
}

// ============ 玩家_class ============
class 玩家 {
  constructor(玩家名称_形参) {
    this.玩家名称 = 玩家名称_形参;
    this.生命值 = 5;
    this.元气数 = 0;
    this.防御数 = 0;
    this.已选的角色名 = "未选择";
    this.已选的角色图帧位 = 1;
    this.已选的招式名 = "未出招";
    this.已选定的角色的招式数组 = [];
    this.是否为AI = false;
    this.是否成功出招 = 0;
    this.已成功出招的招式对象 = {};
    this.AI生成的招式数组下标 = 1;
    this.已选的招式图帧位 = 1;
    this.玩家消息框 = null;
    this.中毒剩余回合 = 0; // 毒箭状态
  }
  AI选角色_f() {
    this.已选的角色图帧位 = Math.round(Math.random() * 1 + 2);
    return this.已选的角色图帧位;
  }
  AI出招_f() {
    this.AI生成的招式数组下标 = Math.round(Math.random() * 2);
    this.已选的招式图帧位 = this.AI生成的招式数组下标 + 2;
    return this.AI生成的招式数组下标;
  }
  AI出无需元气的招_f() {
    this.AI生成的招式数组下标 = Math.round(Math.random() * 1);
    this.已选的招式图帧位 = this.AI生成的招式数组下标 + 2;
    return this.AI生成的招式数组下标;
  }
}

// ============ 战斗系统_class ============
class 战斗系统 {
  constructor(战斗系统名_形参) {
    this.战斗回合 = 0;
    this.战斗系统名 = 战斗系统名_形参;
    this.攻防判定数值_1 = 0;
    this.攻防判定数值_2 = 0;
  }
  出招判定_f(玩家_形参, 招式数组_形参, 招式数组下标_形参, 玩家消息框_形参) {
    if (玩家_形参.中毒剩余回合 > 0 && 招式数组_形参[招式数组下标_形参].耗元气数 < 0) {
      setBoxText(玩家消息框_形参, "中毒中！无法凝聚元气");
      玩家_形参.是否成功出招 = 0;
      setBoxBg(玩家消息框_形参, 0x9B59B6);
      return;
    }
    if (玩家_形参.元气数 >= 招式数组_形参[招式数组下标_形参].耗元气数) {
      玩家_形参.已选的招式名 = 招式数组_形参[招式数组下标_形参].招式名称;
      玩家_形参.元气数 -= 招式数组_形参[招式数组下标_形参].耗元气数;
      玩家_形参.是否成功出招 = 1;
      玩家_形参.已成功出招的招式对象 = 招式数组_形参[招式数组下标_形参];
      setBoxBg(玩家消息框_形参, 0x00D7EC);
      const 招 = 招式数组_形参[招式数组下标_形参];
      if (招.耗元气数 > 0) {
        setBoxText(玩家消息框_形参, 玩家_形参.玩家名称 + "成功出招," + "\n" + 玩家_形参.玩家名称 + " 的元气数减少" + String(招.耗元气数));
      } else if (招.耗元气数 === 0) {
        setBoxText(玩家消息框_形参, 玩家_形参.玩家名称 + "成功出招," + "\n" + " 此招式不消耗元气，" + "\n" + "该招效果为：" + "\n" + 招.招式效果描述 + "\n");
      } else {
        setBoxText(玩家消息框_形参, 玩家_形参.玩家名称 + "成功出招," + "\n" + 玩家_形参.玩家名称 + " 的元气数增加" + String(-招.耗元气数) + "\n");
      }
    } else {
      if (玩家_形参.是否为AI === true) {
        this.出招判定_f(玩家_形参, 招式数组_形参, 玩家_形参.AI出无需元气的招_f(), 玩家消息框_形参);
      } else {
        setBoxText(玩家消息框_形参, "出招失败,元气不足");
        玩家_形参.是否成功出招 = 0;
        setBoxBg(玩家消息框_形参, 0xFFC9E9);
      }
    }
  }
  攻防判定_f(玩家1_形参, 招式1_形参, 玩家2_形参, 招式2_形参) {
    this.攻防判定数值_1 = 招式1_形参.攻击力 - 招式2_形参.防御值;
    this.攻防判定数值_2 = 招式2_形参.攻击力 - 招式1_形参.防御值;
    if (this.攻防判定数值_1 > 0) {
      玩家2_形参.生命值 -= this.攻防判定数值_1;
      appendBox(玩家1_形参.玩家消息框, "\n" + "此招式让" + 玩家2_形参.玩家名称 + "生命数减少" + String(this.攻防判定数值_1));
      if (招式1_形参.中毒回合) {
        玩家2_形参.中毒剩余回合 = 招式1_形参.中毒回合;
        appendBox(玩家1_形参.玩家消息框, "" + 玩家2_形参.玩家名称 + "中毒！此后" + 招式1_形参.中毒回合 + "回合每回合扣" + 招式1_形参.中毒扣血 + "血且无法加气");
      }
    }
    if (this.攻防判定数值_2 > 0) {
      玩家1_形参.生命值 -= this.攻防判定数值_2;
      appendBox(玩家2_形参.玩家消息框, "\n" + "此招式让" + 玩家1_形参.玩家名称 + "生命数减少" + String(this.攻防判定数值_2));
    }
    if (this.攻防判定数值_1 === 0) appendBox(玩家1_形参.玩家消息框, "\n" + "此招式目前无攻击效果");
    if (this.攻防判定数值_2 === 0) appendBox(玩家2_形参.玩家消息框, "\n" + "此招式目前无攻击效果");
    if (this.攻防判定数值_1 < 0) appendBox(玩家1_形参.玩家消息框, "\n" + "双方很和气...");
    if (this.攻防判定数值_2 < 0) appendBox(玩家2_形参.玩家消息框, "\n" + "双方很和气...");
      if (招式2_形参.中毒回合) {
        玩家1_形参.中毒剩余回合 = 招式2_形参.中毒回合;
        appendBox(玩家2_形参.玩家消息框, "" + 玩家1_形参.玩家名称 + "中毒！此后" + 招式2_形参.中毒回合 + "回合每回合扣" + 招式2_形参.中毒扣血 + "血且无法加气");
      }
  }
  战斗回合_f(显示战斗回合数的文本框_形参, 玩家1_形参, 玩家2_形参) {
    if ((玩家1_形参.是否成功出招 + 玩家2_形参.是否成功出招) === 2) {
      this.战斗回合++;
      for (const p of [玩家1_形参, 玩家2_形参]) {
        if (p.中毒剩余回合 > 0) { // 防御对中毒无效
          p.生命值 -= 2;
          p.中毒剩余回合--;
          appendBox(p.玩家消息框, "" + "中毒发作，生命数减少2" + (p.中毒剩余回合 > 0 ? "（剩" + p.中毒剩余回合 + "回合）" : "（毒已解）"));
        }
      }
    }
    显示战斗回合数的文本框_形参.textContent = "回合数：" + String(this.战斗回合);
  }
  胜负判定_f(玩家1_形参, 玩家2_形参, 出招按钮_形参) {
    if (玩家2_形参.生命值 === 0 && 玩家1_形参.生命值 === 0) {
      setBoxText(玩家2_形参.玩家消息框, 玩家2_形参.玩家名称 + "平局");
      setBoxBg(玩家2_形参.玩家消息框, 0xD9CCCC);
      setBoxText(玩家1_形参.玩家消息框, 玩家1_形参.玩家名称 + "平局");
      setBoxBg(玩家1_形参.玩家消息框, 0xD9CCCC);
      出招按钮_形参.style.display = "none";
    }
    if (玩家1_形参.生命值 <= 0) {
      setBoxText(玩家1_形参.玩家消息框, 玩家1_形参.玩家名称 + "战斗失败");
      setBoxBg(玩家1_形参.玩家消息框, 0xD9CCCC);
      setBoxText(玩家2_形参.玩家消息框, 玩家2_形参.玩家名称 + "战斗胜利");
      setBoxBg(玩家2_形参.玩家消息框, 0x00FF00);
      出招按钮_形参.style.display = "none";
    }
    if (玩家2_形参.生命值 <= 0) {
      setBoxText(玩家2_形参.玩家消息框, 玩家2_形参.玩家名称 + "战斗失败");
      setBoxBg(玩家2_形参.玩家消息框, 0xD9CCCC);
      setBoxText(玩家1_形参.玩家消息框, 玩家1_形参.玩家名称 + "战斗胜利");
      setBoxBg(玩家1_形参.玩家消息框, 0x00FF00);
      出招按钮_形参.style.display = "none";
    }
  }
}

// ============ DOMDocument_9.as: 全局实例与招式 ============
const 玩家_1 = new 玩家("玩家_1"); 玩家_1.是否为AI = false;
const AI_1 = new 玩家("AI_1"); AI_1.是否为AI = true; AI_1.生命值 = 15;
const 战斗系统_1 = new 战斗系统("战斗系统_1");

const 运气 = new 招式("运气"); 运气.耗元气数 = -1; 运气.招式图帧位 = 1;
const 防御 = new 招式("防御"); 防御.耗元气数 = 0; 防御.防御值 = 5; 防御.招式效果描述 = "此回合防御值为5"; // 作者钦定: 免气防5(原源码为防1)
const 砍 = new 招式("砍"); 砍.耗元气数 = 1; 砍.攻击力 = 1; 砍.招式图帧位 = 4; // 作者钦定: 攻1耗1(原源码为攻2)
const 射箭 = new 招式("射箭"); 射箭.耗元气数 = 1; 射箭.攻击力 = 1; 射箭.招式图帧位 = 3; // 作者钦定攻1耗1

// ===== 射手招式(2026-10-07 作者钦定) =====
const 翔云箭 = new 招式("翔云箭"); 翔云箭.耗元气数 = 3; 翔云箭.攻击力 = 2; 翔云箭.破防 = true; // 破防御
const 火焰箭 = new 招式("火焰箭"); 火焰箭.耗元气数 = 4; 火焰箭.攻击力 = 4; 火焰箭.受防转群攻 = 2; // 被防御时转群攻2
const 四连射 = new 招式("四连射"); 四连射.耗元气数 = 4; 四连射.攻击力 = 4;
const 毒箭 = new 招式("毒箭"); 毒箭.耗元气数 = 5; 毒箭.攻击力 = 2; 毒箭.中毒回合 = 2; 毒箭.中毒扣血 = 2;

const 剑客_招式数组 = [运气, 防御, 砍];
const 射手_招式数组 = [运气, 防御, 射箭, 翔云箭, 火焰箭, 四连射, 毒箭];

// 选招图帧位→图片（引注：剑客招式选择_影片剪辑.xml 帧=运气图0131115155/防御图0131115202/砍图；
// 招式下标=currentFrame-2，gotoAndStop(4) 初始选砍）
// ===== 招式资料全表(游戏资料页用; 2026-10-07 作者钦定剑客数值) =====
const 招式资料 = {
  "运气":   { 耗: -1, 攻: 0, 防: 0, 描述: "攒聚气力。", 特效: "加气（元气+1）", 图: "assets/luck.jpg" },
  "防御":   { 耗: 0, 攻: 0, 防: 5, 描述: "双手握拳护胸，喊\"抵\"。", 特效: "免耗元气；本回合防御值5，完全格挡攻≤5的招式", 图: "assets/defend.jpg" },
  "砍":     { 耗: 1, 攻: 1, 防: 0, 描述: "基础攻击。", 特效: "无", 图: "assets/kan.jpg" },
  "飞镖":   { 耗: 2, 攻: 2, 防: 0, 描述: "投掷飞镖攻击。", 特效: "无", 图: "assets/feibiao.jpg" },
  "三连击": { 耗: 3, 攻: 3, 防: 0, 描述: "连续三次攻击。", 特效: "无", 图: "assets/sanlianji.jpg" },
  "破云剑": { 耗: 5, 攻: 5, 防: 0, 描述: "剑气破云而出的强力一击。", 特效: "群攻；反隐——可命中隐身状态的角色，对隐身目标伤害为4（待隐身角色实装后生效）", 图: "assets/poyunjian.jpg" },
  "龙抬头": { 耗: 4, 攻: 4, 防: 0, 描述: "强力一击。", 特效: "无", 图: "assets/longtaitou.jpg" },
  "射箭":   { 耗: 1, 攻: 1, 防: 0, 描述: "基础射击。", 特效: "无", 图: "assets/shejian.jpg" },
  "翔云箭":  { 耗: 3, 攻: 2, 防: 0, 描述: "箭乘翔云，穿甲而过。", 特效: "破防——伤害无视对方防御值（防5也挡不住）", 图: "assets/xiangyun.jpg" },
  "四连射": { 耗: 4, 攻: 4, 防: 0, 描述: "四箭齐发。", 特效: "无", 图: "assets/silianshe.jpg" },
  "火焰箭":  { 耗: 4, 攻: 4, 防: 0, 描述: "燃烧的箭矢。", 特效: "单体攻击4；若被防御格挡，火焰蔓延——自动转化为无视防御的群攻2", 图: "assets/huoyan.jpg" },
  "毒箭":   { 耗: 5, 攻: 2, 防: 0, 描述: "淬毒之箭。", 特效: "命中后中毒2回合：每回合扣2血、无法加气（出运气失败）；防御对中毒无效", 图: "assets/dujian.jpg" },
};

const 招式图 = {
  "运气": "assets/luck.jpg",
  "防御": "assets/defend.jpg",
  "砍": "assets/kan.jpg",
  "射箭": "assets/shejian.jpg",
};

// ============ 消息框帮助函数 ============
function el(id) { return document.getElementById(id); }
function setBoxText(box, t) { if (box) box.textContent = t; }
function appendBox(box, t) { if (box) box.textContent += t; }
function setBoxBg(box, hex) { if (box) box.style.backgroundColor = "#" + hex.toString(16).padStart(6, "0"); }
// ============ 场景(帧)导航 ============
// 引注: 主时间轴 gotoAndStop(1/2/3/4/5/20/60/61/62)
let 当前帧 = 1;
function gotoAndStop(帧号) {
  if (!Number.isFinite(帧号)) return; // 防呆: 无效帧号空操作（对齐 Flash 行为）
  当前帧 = 帧号;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const sc = el("f" + 帧号);
  if (sc) sc.classList.add("active");
  if (帧号 === 61) 进入角色选择_f();
  if (帧号 === 62) 进入战斗_f();
}

// ============ DOMDocument_0.as: 主菜单 ============
// 事件委托绑定页面跳转（对动态/重排元素稳健）
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-nav]");
  if (b) gotoAndStop(Number(b.dataset.nav));
});

// ============ DOMDocument_6.as: THINKS 飘动 (退出页) ============
setInterval(() => {
  if (当前帧 !== 60) return;
  const x_num = Math.round(Math.random() * 480);
  const y_num = Math.round(Math.random() * 800);
  const mc = el("thinks_mc");
  mc.style.left = x_num + "px";
  mc.style.top = y_num + "px";
}, 1000 / 60); // 原版 frameRate=60

// ============ DOMDocument_7.as: 角色选择(帧61) ============
let 玩家_角色编号 = 0;
let AI_角色编号 = 0;

function 进入角色选择_f() {
  // 引注: DOMDocument_7.as 帧脚本: 进入战斗_btn.visible=false, 文本初始化
  el("进入战斗_btn").style.display = "none";
  el("玩家已选择的角色_txt").textContent = "还没选定";
  el("AI已选择的角色_txt").textContent = "还没选定";
  el("玩家_character").src = "";
  el("AI_character").src = "";
  玩家_角色编号 = 0;
  AI_角色编号 = 0;
}
// 展示框位图偏移(引注: 角色选择.xml frame1 射手@(-59,-45.55) frame2 剑客@(-71,-42.6);
// gotoAndStop(2)=射手帧 / gotoAndStop(3)=剑客帧; 元件原点 玩家(61,122) AI(413.95,123), AI侧限480内)
const 角色展示 = {
  2: { img: "assets/sheshou.jpg", w: 119, h: 92,  dx: -59, dy: -45.55 },
  3: { img: "assets/jianke.jpg",  w: 143, h: 110, dx: -71, dy: -42.6 },
};
function 已选择角色展示_f() {
  // 引注: DOMDocument_7.as 已选择角色展示_f — switch 双方编号, 设文本+gotoAndStop+绑定数组
  const 角色名 = { 2: "射手", 3: "剑客" };
  const 角色数组 = { 2: 射手_招式数组, 3: 剑客_招式数组 };
  const p = 角色展示[玩家_角色编号], a = 角色展示[AI_角色编号];
  if (p) {
    const img = el("玩家_character");
    img.src = p.img;
    img.style.display = "";
    // 按蓝框内容区(100x109)等比缩放居中
    const s = Math.min(100 / p.w, 109 / p.h, 1);
    img.style.width = Math.round(p.w * s) + "px";
    img.style.height = Math.round(p.h * s) + "px";
    img.style.left = Math.round((100 - p.w * s) / 2) + "px";
    img.style.top = Math.round((109 - p.h * s) / 2) + "px";
    el("玩家已选择的角色_txt").textContent = "你选择了：" + 角色名[玩家_角色编号];
    玩家_1.已选的角色名 = 角色名[玩家_角色编号];
    玩家_1.已选定的角色的招式数组 = 角色数组[玩家_角色编号];
  }
  if (a) {
    const img = el("AI_character");
    img.src = a.img;
    img.style.display = "";
    const s2 = Math.min(100 / a.w, 109 / a.h, 1);
    img.style.width = Math.round(a.w * s2) + "px";
    img.style.height = Math.round(a.h * s2) + "px";
    img.style.left = Math.round((100 - a.w * s2) / 2) + "px";
    img.style.top = Math.round((109 - a.h * s2) / 2) + "px";
    el("AI已选择的角色_txt").textContent = "AI选择了：" + 角色名[AI_角色编号];
    AI_1.已选的角色名 = 角色名[AI_角色编号];
    AI_1.已选定的角色的招式数组 = 角色数组[AI_角色编号];
  }
}
function AI_随机选择角色_f() {
  // 引注: DOMDocument_7.as — round(random*1+2), 显示进入战斗, 刷新展示
  AI_角色编号 = Math.round(Math.random() * 1 + 2);
  el("进入战斗_btn").style.display = "";
  已选择角色展示_f();
}
el("剑客_CharacterSelect").addEventListener("click", () => {
  玩家_角色编号 = 3;
  AI_随机选择角色_f();
});
el("射手_CharacterSelect").addEventListener("click", () => {
  玩家_角色编号 = 2;
  AI_随机选择角色_f();
});
// ============ DOMDocument_8.as: 战斗(帧62) — 按原版逐行转写 ============
// 选招卡 = 5 帧 mc（帧1空/帧2运气/帧3防御/帧4砍·射箭/帧5空），下标=帧-2
// 引注: 剑客招式选择_影片剪辑.xml + DOMDocument_8.as gotoAndStop(currentFrame∓1)
let 选招帧 = 4; // mc 自身帧0脚本 gotoAndStop(4)（剑客招式选择_影片剪辑_0.as）

// 帧→图片（引注: 招式选择 mc 各帧位图；剑客帧4=砍图，射手mc帧4=射箭图）
function 帧图(帧) {
  if (帧 === 2) return { img: "assets/luck.jpg", 名: "运气" };
  if (帧 === 3) return { img: "assets/defend.jpg", 名: "防御" };
  if (帧 === 4) {
    const 攻招 = 玩家_1.已选定的角色的招式数组[2];
    return { img: 招式图[攻招.招式名称], 名: 攻招.招式名称 };
  }
  return null; // 帧1/5 空帧
}
function 刷新用户选招卡() {
  const 卡 = 帧图(选招帧);
  const mc = el("用户选招mc");
  if (卡) {
    el("用户选招图").src = 卡.img;
    el("用户选招名").textContent = 卡.名;
    mc.style.visibility = "visible";
  } else {
    mc.style.visibility = "hidden"; // 空帧
  }
}
function 刷新AI选招卡(帧位) {
  // 引注: DOMDocument_8.as:93 AI_选招控制对象mc_obj.gotoAndStop(AI_1.已选的招式图帧位)
  const 卡 = 帧图(帧位);
  const mc = el("AI选招mc");
  if (卡) {
    el("AI选招图").src = 卡.img;
    el("AI选招名").textContent = 卡.名;
    mc.style.visibility = "visible";
  } else {
    mc.style.visibility = "hidden";
  }
}
// 翻页循环(引注: 招式选择mc 帧1脚本gotoAndStop(4) 帧5脚本gotoAndStop(2) — 空帧被弹走)
el("上一招_btn").addEventListener("click", () => {
  选招帧 = (选招帧 - 1) === 1 ? 4 : 选招帧 - 1;
  刷新用户选招卡();
});
el("下一招_btn").addEventListener("click", () => {
  选招帧 = (选招帧 + 1) === 5 ? 2 : 选招帧 + 1;
  刷新用户选招卡();
});

// 进入帧62（原版帧脚本每次进入都执行；生命/元气/回合为全局单例延续，不重置）
function 进入战斗_f() {
  刷新文本框_f();
  选招帧 = 4;                    // mc 重建后自身 gotoAndStop(4)
  el("用户选招标题").textContent = 玩家_1.已选的角色名 === "剑客" ? "剑客选招" : "射手选招";
  el("AI选招标题").textContent = AI_1.已选的角色名 === "剑客" ? "剑客选招" : "射手选招";
  刷新用户选招卡();
  el("AI选招mc").style.visibility = "hidden";
  // 原版: 用户消息框_txt.backgroundColor=0xCCCCCC; 两个消息框绑定
  setBoxBg(el("用户消息框_txt"), 0xCCCCCC); // 引注: frame62 只设用户消息框底色
  el("用户消息框_txt").textContent = "";
  el("AI消息框_txt").textContent = "";
  AI_1.玩家消息框 = el("AI消息框_txt");
  玩家_1.玩家消息框 = el("用户消息框_txt");
  el("出招_btn").style.display = ""; // 重进恢复（若上局胜负隐藏过）
}
function 刷新文本框_f() {
  // 引注: DOMDocument_8.as 刷新文本框_f 逐字文案
  el("玩家名称_txt").textContent = "玩家名称:" + 玩家_1.玩家名称;
  el("玩家元气数_txt").textContent = String("玩家元气数:" + 玩家_1.元气数);
  el("玩家生命值_txt").textContent = String("玩家生命值:" + 玩家_1.生命值);
  el("玩家角色名_txt").textContent = "玩家角色名:" + 玩家_1.已选的角色名;
  el("玩家招式名_txt").textContent = "玩家招式名:" + 玩家_1.已选的招式名;
  el("AI对手名称_txt").textContent = "对手名称:" + AI_1.玩家名称;
  el("AI元气数_txt").textContent = String("AI元气数:" + AI_1.元气数);
  el("AI生命值_txt").textContent = String("AI生命值:" + AI_1.生命值);
  el("AI角色名_txt").textContent = "AI角色名:" + AI_1.已选的角色名;
  el("AI招式名_txt").textContent = "AI招式名:" + AI_1.已选的招式名;
}
// 出招按钮 — 引注: DOMDocument_8.as 出招_btn_f 原顺序
el("出招_btn").addEventListener("click", () => {
  const 下标 = 选招帧 - 2;
  if (下标 < 0 || 下标 > 2) return; // 空帧: 原版此处空引用中断；此处防护为忽略本次点击
  战斗系统_1.出招判定_f(玩家_1, 玩家_1.已选定的角色的招式数组, 下标, el("用户消息框_txt"));
  el("玩家招式名_txt").textContent = 玩家_1.已选的招式名;
  if (玩家_1.是否成功出招 === 1) {
    战斗系统_1.出招判定_f(AI_1, AI_1.已选定的角色的招式数组, AI_1.AI出招_f(), el("AI消息框_txt"));
    刷新AI选招卡(AI_1.已选的招式图帧位);   // AI 卡联动翻帧
    战斗系统_1.攻防判定_f(玩家_1, 玩家_1.已成功出招的招式对象, AI_1, AI_1.已成功出招的招式对象);
    战斗系统_1.战斗回合_f(el("回合数_txt"), 玩家_1, AI_1);
    战斗系统_1.胜负判定_f(玩家_1, AI_1, el("出招_btn"));
    刷新文本框_f();
  } else {
    // 调侃语：提示玩家选错了招式，本次点击不产生任何游戏状态变化
    setBoxText(el("AI消息框_txt"), "等你出招,要不然AI继续装傻");
    setBoxBg(el("AI消息框_txt"), 0xFFFF00);
  }
});

// ============ 游戏资料页: 卡牌按钮 + 详情显示 ============
const 招式资料_角色 = {
  "剑客": { 耗: "—", 攻: "—", 防: "—", 描述: "近战角色，以剑法招式为主。", 图: "assets/jianke.jpg" },
  "射手": { 耗: "—", 攻: "—", 防: "—", 描述: "远程角色，以箭术招式为主。", 图: "assets/sheshou.jpg" },
};
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-move]");
  if (!card) return;
  const 名 = card.dataset.move;
  const d = 招式资料[名] || 招式资料_角色[名];
  if (!d) return;
  // 选中态
  document.querySelectorAll(".mp-card").forEach(c => c.classList.toggle("sel", c === card));
  // 详情填充(两页字段带不带2)
  const p = document.querySelector('.screen.active .detail-panel');
  if (!p) return;
  const sfx = p.id === "资料详情2" ? "2" : "";
  el("详情图" + sfx).src = d.图;
  el("详情名" + sfx).textContent = 名;
  el("详情耗" + sfx).textContent = d.耗 === null ? "待定" : (typeof d.耗 === "number" && d.耗 < 0 ? (-d.耗) + "(元气+" + (-d.耗) + ")" : d.耗);
  el("详情攻" + sfx).textContent = d.攻 === null ? "待定" : d.攻;
  el("详情防" + sfx).textContent = d.防 === null ? "待定" : d.防;
  el("详情述" + sfx).textContent = d.描述;
  const 效果框 = el("详情效" + sfx);
  if (效果框) 效果框.textContent = "特殊效果：" + (d.特效 || "无");
});

// ============ 启动: 主时间轴第1帧 ============
gotoAndStop(1);
