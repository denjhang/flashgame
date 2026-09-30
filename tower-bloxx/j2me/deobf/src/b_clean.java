// ============================================================================
// b.java → Vibrator (震动控制器)
// 原文件: b.java (26 行, 2 方法 + 1 字段)
// 证据: import com.nokia.mid.ui.DeviceControl; DeviceControl.startVibra(100, ms)
//       → 诺基亚专有震动 API 封装
// ============================================================================
// import com.nokia.mid.ui.DeviceControl;

public final class Vibrator {
    private boolean vibrationEnabled = true;   // 原 a: 震动总开关 (f.b(8/9) 音效开关体系之外)

    /** 原 b.a(int): 震动 ms 毫秒 (强度固定 100)。开关关闭或异常时静默。 */
    public final void vibrate(int durationMs) {
        if (this.vibrationEnabled) {
            try {
                // DeviceControl.startVibra(100, durationMs);
                return;
            }
            catch (Exception exception) {}
        }
    }

    /** 原 b.a(boolean): 设置震动开关。 */
    public final void setEnabled(boolean enabled) {
        this.vibrationEnabled = enabled;
    }
}
