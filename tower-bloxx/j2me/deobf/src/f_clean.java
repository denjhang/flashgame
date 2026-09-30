// ============================================================================
// f.java → SettingsStore (RMS 设置/暂存仓)
// 原文件: f.java (141 行, 11 方法 + 12 字段)
// 证据: RecordStore.openRecordStore(name).getRecord(1) (:73-79) — 打开/关闭
//       RecordStore。三个并排 int[] 数组 l[14]/m[12]/n[1] 是三组布尔/数值设置;
//       音效开关调用点: House.b(int,int) f.a/f.b/f.c → f.b(8,x)/f.a(12,x)
//       (House:299 f.a(12) 取 e 状态; :339/:346 音效开关写 f.b + a(n,1)+g())。
// ============================================================================
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import javax.microedition.rms.RecordStore;

public final class SettingsStore {
    private static int languageIndex = 0;          // 原 f: 语言包序号 (d(int)/a())
    private static int vibrationLevel = 5;         // 原 g: 震动等级 (e(int)/b()), 默认 5
    public static int loadPhase = 0;               // 原 a: 分段加载进度 (0..100, House.e() 门控)
    public static int[] screenFlags;               // 原 l: [14] 屏幕状态 int 组 (a(int)/a(int,int))
    public static int[] audioFlags;                // 原 m: [12] 音频/开关 int 组 (b(int)/b(int,int))
    public static String[] customName;             // 原 n: [1] 玩家自定义名 (高分录入)
    public static boolean recordStoreReady;        // 原 c
    private static String openStoreName;           // 原 h
    private static ByteArrayOutputStream writeBuffer;  // 原 i
    private static DataOutputStream writer;        // 原 j
    private static DataInputStream reader;         // 原 k: 当前打开的读流
    public static boolean hasRecord;               // 原 d: RMS 是否有档 (House.e==5/6 k.d 判定)
    public static int recordSize;                  // 原 e

    /** 原 f.a(int, int): 写 screenFlags[n2] = n3。 */
    public static void setScreenFlag(int index, int value) {
        SettingsStore.screenFlags[index] = value;
    }

    /** 原 f.a(int): 读 screenFlags[index] (音效状态 12 等)。 */
    public static int getScreenFlag(int index) {
        return screenFlags[index];
    }

    /** 原 f.b(int, int): 写 audioFlags[index] = value (音效开/关 8/9)。 */
    public static void setAudioFlag(int index, int value) {
        SettingsStore.audioFlags[index] = value;
    }

    /** 原 f.b(int): 读 audioFlags[index]。 */
    public static int getAudioFlag(int index) {
        return audioFlags[index];
    }

    /** 原 f.a(int, String): 写 customName (仅 1 槽 — 玩家名)。 */
    public static void setCustomName(int slot, String name) {
        SettingsStore.customName[slot] = name;
    }

    /** 原 f.c(int): 读 customName[slot]。 */
    public static String getCustomName(int slot) {
        return customName[slot];
    }

    /** 原 f.d(int): 设置语言包序号。 */
    public static void setLanguage(int index) {
        SettingsStore.languageIndex = index;
    }

    /** 原 f.a(): 读语言包序号。 */
    public static int getLanguage() {
        return languageIndex;
    }

    /** 原 f.e(int): 设置震动等级。 */
    public static void setVibrationLevel(int level) {
        SettingsStore.vibrationLevel = level;
    }

    /** 原 f.b(): 读震动等级。 */
    public static int getVibrationLevel() {
        return vibrationLevel;
    }

    /** 原 f.a(String): 打开 RecordStore 读流 (记录 1)。无档 → reader=null。 */
    public static DataInputStream openReader(String storeName) {
        try {
            RecordStore store = RecordStore.openRecordStore(storeName, false);
            reader = new DataInputStream(new ByteArrayInputStream(store.getRecord(1)));
            store.closeRecordStore();
        }
        catch (Exception exception) {
            reader = null;
        }
        return reader;
    }

    /** 原 f.b(String): 打开 RecordStore 写流 (内存缓冲, flush 落记录 1)。 */
    public static DataOutputStream openWriter(String storeName) {
        try {
            openStoreName = storeName;
            writeBuffer = new ByteArrayOutputStream();
            writer = new DataOutputStream(writeBuffer);
        }
        catch (Exception exception) {}
        return writer;
    }

    // 原 f 静态块: l=new int[14]; m=new int[12]; n=new String[1]; d=false
    // 注: f.c()(writeBuffer 落盘 addRecord) 在 :126-140 区段 —— 见原文件。
}
