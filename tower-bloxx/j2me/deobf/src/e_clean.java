// ============================================================================
// e.java → ScreenContract (屏幕实现契约接口)
// 原文件: e.java (24 行, 6 方法)
// 证据: 实现者 h.java (输入处理) 与 House (游戏屏) —— GameMIDlet.d 字段类型
//       (GameMIDlet:255 `this.d.b(n2, n3)`)。六个回调覆盖 生命周期/指针/按键/命令。
// ============================================================================
// import javax.microedition.lcdui.Command;
// import javax.microedition.lcdui.Graphics;

public interface ScreenContract {
    /** 原 e.o(): 屏幕激活/进入 (每帧入口前复位)。 */
    void onShow();

    /** 原 e.n(): 屏幕离开/挂起。 */
    void onHide();

    /** 原 e.a(int, int): 指针事件 (x, y) —— 触屏点击落块。 */
    void onPointer(int x, int y);

    /** 原 e.a(Graphics, boolean): 绘制本屏 (graphics, 覆盖全部/局部)。 */
    void paint(javax.microedition.lcdui.Graphics g, boolean fullRedraw);

    /** 原 e.b(int, int): 指针拖动/释放事件。 */
    void onPointerDrag(int x, int y);

    /** 原 e.a(Command): 软键命令回调。 */
    void onCommand(javax.microedition.lcdui.Command cmd);
}
