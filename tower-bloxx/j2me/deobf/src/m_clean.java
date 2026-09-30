// ============================================================================
// m.java → CanvasScreen (画布抽象接口)
// 原文件: m.java (28 行, 8 方法)
// 证据: 方法签名集合 = MIDP GameCanvas 所需能力的最小面
//       (getGameAction/getKeyName/getWidth/getHeight + 事件回调)。GameMIDlet.w
//       持有 m 类型字段并转发 keyRepeated/keyPressed (GameMIDlet:249-268)。
// ============================================================================
// import javax.microedition.lcdui.Command;
// import javax.microedition.lcdui.Image;

public interface CanvasScreen {
    /** 原 m.a(GameMIDlet): 绑定宿主 MIDlet (回调命令/重绘)。 */
    void bind(GameMIDlet midlet);

    /** 原 m.a(boolean): 可见性变更回调 (showNotify/hideNotify 转发)。 */
    void onVisibilityChanged(boolean visible);

    /** 原 m.a(Command, Image): 设置软键按钮 (左/右软键 + 标签图)。 */
    void setSoftkeyLabel(Command cmd, javax.microedition.lcdui.Image image);

    /** 原 m.a(Command): 移除软键按钮。 */
    void removeSoftkeyLabel(Command cmd);

    /** 原 m.getGameAction(int): MIDP 按键→游戏动作转义。 */
    int getGameAction(int keyCode);

    /** 原 m.getHeight(): 画布像素高。 */
    int getHeight();

    /** 原 m.getWidth(): 画布像素宽。 */
    int getWidth();

    /** 原 m.getKeyName(int): 键码→键名 (语言包键位提示 %U 填充用)。 */
    String getKeyName(int keyCode);
}
