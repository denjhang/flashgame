// ============================================================================
// com/nokia/mid/appl/bloxx/a.java → NokiaLangPack (诺基亚版语言包读取器)
// 原文件: com/nokia/mid/appl/bloxx/a.java (~120 行, 4 方法 + 3 字段)
// 证据: getResourceAsStream("/lang."+locale) 回退 "/lang.xx" — 这就是
//       nokia_v1011 jar 里 lang.zh-CN 等文件的读取器 (JD+3 证实 nokia 版
//       lang.* 布局的出处; 与 dc 版 g.f(int) 的 "l"+n2 布局并存于不同构建)。
// ============================================================================

public final class NokiaLangPack {
    private static NokiaLangPack instance;                     // 原 b
    private static DataInputStream stream;                     // 原 c
    public static String locale = System.getProperty("microedition.locale");  // 原 a

    private NokiaLangPack() {}

    /** 原 a(String,String,String): 全量替换子串 (占位符处理辅助)。 */
    private static String replaceAll(String s, String from, String to) { /* 逐 indexOf 循环 */ }

    /** 原 a(int, String[]): 读逻辑串并填占位 — 首次懒加载 lang.<locale> (回退 lang.xx);
     *  读不到返回 "X"。布局与 dc 版不同: [94×u16 表][u16 len][UTF-8]×88
     *  (实证: j2me/res/nokia_v1011/lang.zh-CN.json)。 */
    public static synchronized String get(int logicalId, String[] args) { /* 见原文件 */ }

    // 其余: 私有读串/定位方法, 见原文件。
}
