// ============================================================================
// g.java → ResourceStore (r0 资源包 + 语言包统一存取)
// 原文件: g.java (656 行, 8 方法 + 7 字段 + 1 张 153 项 id 重映射 switch 表)
// 证据: 构造私有(单例 a); a() 读 "r0" 头 b[92] int32 偏移 + c[153] 字符串偏移;
//       a(int) 按负 id 分段加载 ("r"+seg, 段号=(id&0x7FFFFFFF)>>16, 项号=id&0x7FFF);
//       e(int) 由相邻偏移差求条目长 (b[i]<0 为连续标记, b[91+seg]=段末);
//       f(int) 装语言包 "l"+n2: skipBytes(7)+readUTF()+c[153]×int32 偏移;
//       b(int,String)/d(int) 走 153 项 switch 逻辑串 id→包内序号 (如 152→93, 93→83)。
//       注意 nokia_v1011 jar 的 lang.* 用另一布局 ([94×u16 表]+[u16 len][UTF-8]×88),
//       对应另一版 g —— 见 j2me/res/nokia_v1011/lang.zh-CN.json。
// ============================================================================
import java.io.DataInputStream;
import java.io.InputStream;
import javax.microedition.lcdui.Image;
// import com.nokia.mid.appl.bloxx.a;  // 诺基亚专有 (分段资源名)

public final class ResourceStore {
    private static ResourceStore instance;        // 原 a: 单例
    private static int[] offsetsR0;               // 原 b: r0 段 92×int32 偏移表 (负数=连续条目)
    private static int[] stringOffsets;           // 原 c: 语言包 153×int32 字符串偏移
    private static int cachedEnd;                 // 原 d: 当前流已读位置 (d=-2 表示需重开)
    private static DataInputStream r0Stream;      // 原 e: r0 常驻流
    private static String currentPack;            // 原 f: 当前资源段名 ("r0")
    private static DataInputStream langStream;    // 原 g: 语言包流

    private ResourceStore() {}

    /** 原 g.a(): 初始化 —— 打开 r0, 读 92 项偏移表, 校验语言包版本(d(152)=="0")。 */
    public static void init() {
        if (instance == null) {
            instance = new ResourceStore();
        }
        try {
            currentPack = "r0";
            InputStream in = instance.getClass().getResourceAsStream(currentPack);
            r0Stream = new DataInputStream(in);
            offsetsR0 = new int[92];
            for (int i = 0; i < offsetsR0.length; ++i) {
                offsetsR0[i] = r0Stream.readInt();
            }
            cachedEnd = offsetsR0.length * 4;
            stringOffsets = new int[153];
            loadLanguagePack(readPackIndex(2));           // f.a(2): 包表 2 号=语言序号
            if (getString(152).compareTo("0") != 0) {     // 152→93: 版本标记串
                seekPack(4, 0);                           // 版本不符: 回退语言 0
                return;
            }
            seekPack(4, 1);
        }
        catch (Exception exception) {}
    }

    /** 原 g.a(int): 取资源字节 (负 id→分段即时开流; 正 id→r0 常驻流顺序读)。 */
    public static byte[] getBytes(int id) {
        byte[] data = null;
        if (id != -1) {
            try {
                int segment = (id & Integer.MAX_VALUE) >> 16;
                if (cachedEnd == -2 || offsetsR0[id & Short.MAX_VALUE] < cachedEnd
                        || !currentPack.equals("r" + segment) || (id & Integer.MIN_VALUE) != 0) {
                    if (r0Stream != null) { r0Stream.close(); r0Stream = null; }
                    currentPack = "r" + segment;
                    DataInputStream stream = openSegment(id);
                    // ...此处 CFR 展开的分段装载/顺序读逻辑, 见原 :60-72
                }
                DataInputStream in = /* openSegment(id) */ null;
                data = new byte[entryLength(id)];
                in.read(data);
                if ((id & Integer.MIN_VALUE) == 0) {
                    cachedEnd = offsetsR0[id & Short.MAX_VALUE] + data.length;  // 顺序缓存推进
                } else {
                    cachedEnd = -2;
                    in.close();
                }
            }
            catch (Exception exception) {}
        }
        return data;
    }

    /** 原 g.b(int): 打开指定资源的读流 (负 id: "r"+低15位段; 正 id: skip 到偏移)。 */
    public static DataInputStream openSegment(int id) {
        DataInputStream stream = null;
        if (id != -1) {
            try {
                int segment;
                StringBuffer name = new StringBuffer();
                if ((id & Integer.MIN_VALUE) != 0) {
                    segment = id & Short.MAX_VALUE;          // 负 id: 段名即 "r"+项号 (单文件段)
                } else {
                    name.append("r");
                    segment = (id & Integer.MAX_VALUE) >> 16;
                }
                InputStream in = instance.getClass().getResourceAsStream(name.append(segment).toString());
                stream = new DataInputStream(in);
                if ((id & Integer.MIN_VALUE) == 0) {
                    stream.skipBytes(offsetsR0[id & Short.MAX_VALUE]);
                }
            }
            catch (Exception exception) {}
        }
        cachedEnd = -2;
        return stream;
    }

    /** 原 g.c(int): 取资源并解码为 Image (id=-1 返回 null)。 */
    public static Image getImage(int id) {
        Image image = null;
        if (id != -1) {
            byte[] data = getBytes(id);
            try {
                image = Image.createImage(data, 0, data.length);
            }
            catch (Exception exception) {}
        }
        return image;
    }

    /** 原 g.e(int): 求条目字节长 —— 偏移表负项=同组连续, b[91+段] 为段末哨兵。 */
    private static int entryLength(int id) {
        int length = 0;
        if (id != -1) {
            int index = id & Short.MAX_VALUE;
            if ((id & Integer.MIN_VALUE) == 0) {
                int next = index + 1;
                while (offsetsR0[next] < 0) { ++next; }      // 跳过连续标记
                length = next >= 91 || offsetsR0[next] <= offsetsR0[index]
                    ? offsetsR0[91 + ((id & Integer.MAX_VALUE) >> 16)] - offsetsR0[index]
                    : offsetsR0[next] - offsetsR0[index];
            } else {
                length = -offsetsR0[index];                  // 负偏移绝对值即长度
            }
        }
        return length;
    }

    /** 原 g.b(): 关闭常驻流 (语言+资源)。 */
    public static void shutdown() {
        try {
            if (r0Stream != null) { cachedEnd = -2; r0Stream.close(); r0Stream = null; }
            if (langStream != null) { langStream.close(); langStream = null; }
            return;
        }
        catch (Exception exception) {}
    }

    /** 原 g.f(int): 装语言包 "l"+n2 —— skip 7 字节(语言码) + readUTF(语言名) + 153 偏移。 */
    private static void loadLanguagePack(int packIndex) {
        try {
            InputStream in = instance.getClass().getResourceAsStream("l" + packIndex);
            if (in == null) return;
            langStream = new DataInputStream(in);
            langStream.skipBytes(7);
            langStream.readUTF();
            for (int i = 0; i < stringOffsets.length; ++i) {
                stringOffsets[i] = langStream.readInt();
            }
            return;
        }
        catch (Exception exception) {}
    }

    /** 原 g.d(int): 取本地化串 (逻辑 id → 153 项 switch 映射)。 */
    public static synchronized String getString(int logicalId) {
        return formatString(logicalId, null);
    }

    /** 原 g.a(int, String[]): 取本地化串并填 %0U..%nU / %U 占位符。 */
    public static synchronized String formatString(int logicalId, String[] args) {
        String result = null;
        try {
            result = resolveString(logicalId, args);
        }
        catch (Exception exception) {}
        return result;
    }

    // 原 g.b(int, String[]): 656 行主体 = 153 项 switch (逻辑串 id → 包内序号) +
    //        按偏移读串 + %U 替换。映射样例(字节码证据):
    //        0→30, 152→93, 158→27, 155→47, 4→43, 6→37, 7→31, 5→39, 22→34,
    //        93→83, 94→81, 95→80, 96→82 … (完整表见原文件 :188-358)
    //        —— 保留混淆原文, 语义重命名无收益 (纯数据表)。
    private static String resolveString(int logicalId, String[] args) {
        throw new UnsupportedOperationException("见原文件 g.java:188-358 数据表");
    }

    private static int readPackIndex(int table) { return 0; }        // 原 f.a(2) 桩
    private static void seekPack(int table, int value) {}            // 原 f.a(4, x) 桩
}
