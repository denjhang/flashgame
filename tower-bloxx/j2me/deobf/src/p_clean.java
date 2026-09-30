// ============================================================================
// p.java → PhoneCanvas (诺基亚 FullCanvas 实现 — 事件汇聚 + 软键条绘制)
// 原文件: p.java (209 行, 10 方法 + 9 字段)
// 证据: extends com.nokia.mid.ui.FullCanvas implements m; keyPressed -6/-7=左右
//       软键 (:50-70); paint→GameMIDlet.d(g)+软键条 a(g) (:39-48); 软键按
//       Command.getCommandType 分侧: 2/3/6/7=右, 1/4/5/8=左 (:131-149)。
// ============================================================================
// import com.nokia.mid.ui.FullCanvas;
// import javax.microedition.lcdui.*;

public final class PhoneCanvas extends FullCanvas implements CanvasScreen /* m */ {
    protected GameMIDlet midlet;        // 原 a
    private boolean suppressShowNotify; // 原 b: a(true) 首次 setCurrent 时吞一次 showNotify
    private boolean suppressHideNotify; // 原 c: 表单(Form 录入名)前置时忽略 hideNotify
    private Command leftSoftkey;        // 原 d (型 1/4/5/8)
    private Command rightSoftkey;       // 原 e (型 2/3/6/7)
    private Image leftSoftkeyIcon;      // 原 f
    private Image rightSoftkeyIcon;     // 原 g
    private Font softkeyFont;           // 原 h: (32,1,8) bold small

    /** 原 p.a(GameMIDlet): 绑定宿主。 */
    public final void bind(GameMIDlet gameMIDlet) { this.midlet = gameMIDlet; }

    /** 原 paint(): midlet.d(g) 帧绘制 + 软键条 a(g)。 */
    public final void paint(Graphics g) { /* :39-48 */ }

    /** 原 keyPressed(): -6=左软键→midlet.b(left), -7=右软键→b(right), -11/-12 忽略,
     *  其余→midlet.m(kc) keyPressed 分派。 */
    protected final void keyPressed(int keyCode) { /* :50-70 */ }

    /** 原 keyRepeated(): 非软键 → midlet.n(kc)。 */
    protected final void keyRepeated(int keyCode) { /* :72-83 */ }

    /** 原 keyReleased(): 非软键 → midlet.f(kc)。 */
    protected final void keyReleased(int keyCode) { /* :85-96 */ }

    /** 原 hideNotify(): 非表单前置 → midlet.pauseApp()。 */
    protected final void hideNotify() { /* :98-108 */ }

    /** 原 showNotify(): 非吞帧 → midlet.s() 恢复。 */
    protected final void showNotify() { /* :110-119 */ }

    /** 原 a(boolean): true=显示并前置 canvas (吞一次 showNotify); false=表单前置标记。 */
    public final void onVisibilityChanged(boolean showCanvas) { /* :121-129 */ }

    /** 原 a(Command, Image): 设软键 (按类型分左右侧, 带图标)。 */
    public final void setSoftkeyLabel(Command cmd, Image image) { /* :131-149 */ }

    /** 原 a(Command): 移除软键 (按类型分侧置 null)。 */
    public final void removeSoftkeyLabel(Command cmd) { /* :151-169 */ }

    /** 原 a(Graphics) private: 软键条 — 底部 h 高+6px 裁剪; 左键 anchor 36(左中),
     *  右键 anchor 40(右中); 无图标时文字黑描边×4+白芯。 */
    private void drawSoftkeyBar(Graphics g) { /* :171-207 */ }

    // 其余 m 接口方法 (getGameAction/getKeyName/getWidth/getHeight) 由 FullCanvas 原生提供。
}
