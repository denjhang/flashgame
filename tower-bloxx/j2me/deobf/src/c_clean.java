// ============================================================================
// c.java → ScreenFactory (屏幕/服务工厂)
// 原文件: c.java (21 行, 4 静态方法)
// 证据: 各方法返回 new p()/new b()/new o()/new h() —— p=具体屏幕绘制器,
//       b=震动器, o=MIDI 播放器, h=输入/软键处理器。调用点: House 静态初始化
//       与 GameMIDlet 组装期。
// ============================================================================

public final class ScreenFactory {
    private ScreenFactory() {}

    /** 原 c.a(): 创建屏幕绘制器实例 (接口 m 的实现 p)。 */
    public static CanvasScreen createScreen() {
        return new PhoneScreen();
    }

    /** 原 c.b(): 创建震动控制器实例。 */
    public static Vibrator createVibrator() {
        return new Vibrator();
    }

    /** 原 c.c(): 创建 MIDI 播放器实例。 */
    public static MidiPlayer createMidiPlayer() {
        return new MidiPlayer();
    }

    /** 原 c.d(): 创建输入/软键处理器实例。 */
    public static KeyInputHandler createKeyInput() {
        return new KeyInputHandler();
    }
}
