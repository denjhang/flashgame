// ============================================================================
// n.java → Renderer3D (JSR-184 渲染器全局封装)
// 原文件: n.java (199 行, 11 方法 + 14 字段)
// 证据: Graphics3D.getInstance() 单例; Loader.load("/scene.m3g") 按 uid 装入
//       Hashtable c; a(float[]) 把 3D 坐标投影到屏幕 (HUD 锚点用: 落点提示
//       h:3390 的 n7/n8 即此产物 ×32/256 缩放)。视口裁剪 setClip(0,l,m,n-l)
//       → l=屏幕顶部 HUD 高度, m/n=视口宽高。
// 定点/单位: 全 float, 无定点数; 相机 fov=60(:a(float) 调用), near=10/far=10000。
// ============================================================================
// import javax.microedition.m3g.*;

public final class Renderer3D {
    public static float[] projectedPoint = new float[4];  // 原 a: 3D→屏幕投影暂存 (x,y,z,w)
    private static Graphics3D g3d;                        // 原 b
    private static Hashtable meshCache;                   // 原 c: uid → MeshNode
    private static Background background;                 // 原 d: 只清深度, 不清色 (天空由 2D 画)
    private static Camera camera;                         // 原 e
    private static Transform cameraXform;                 // 原 f: 相机位姿
    private static Transform invXform;                    // 原 g: 相机逆变换 (投影用)
    private static float[] matrix;                        // 原 h: 4x4 位姿矩阵暂存
    private static float viewportTop;                     // 原 i: fov 暂存 (a(float) 入参)
    private static float viewportY;                       // 原 j: m/(n-l)*0.7+0.3 宽高比修正
    private static float viewportX;                       // 原 k: (n-l)/m*0.7+0.3
    private static int clipTop;                           // 原 l: 裁剪顶 (=HUD 高度, 传入 n2)
    private static int clipW;                             // 原 m
    private static int clipH;                             // 原 n

    private Renderer3D() {}

    /** 原 n.a(int,int,int): 初始化 (clipTop, 视口宽, 视口高)。 */
    public static final void init(int top, int width, int height) {
        meshCache = new Hashtable();
        g3d = Graphics3D.getInstance();
        background = new Background();
        background.setColorClearEnable(false);   // 不清色 → 保留 2D 画的天空
        background.setDepthClearEnable(true);
        setupViewport(top, width, height);
    }

    /** 原 n.a(): 取 Graphics3D 单例。 */
    public static final Graphics3D graphics3D() {
        return g3d;
    }

    /** 原 n.a(Object): 帧开始 —— 绑定绘制目标+清深度+复位灯光。 */
    public static final void beginFrame(Object graphicsTarget) {
        setClip(graphicsTarget);
        g3d.bindTarget(graphicsTarget, true, 0);
        g3d.clear(background);
        g3d.resetLights();
    }

    /** 原 n.b(): 帧结束 —— 释放目标。 */
    public static final void endFrame() {
        g3d.releaseTarget();
    }

    /** 原 n.a(int[], int): 批量从 m3g World 预载网格 (uid 数组, 场景资源 n3)。 */
    public static final void preloadMeshes(int[] uids, int sceneResource) {
        World world = null;
        try {
            Object3D[] roots = Loader.load("/" + (sceneResource & Integer.MAX_VALUE));
            for (int i = 0; i < roots.length; ++i) {
                if (roots[i] instanceof World) { world = (World) roots[i]; break; }
            }
        }
        catch (IOException ioe) {}
        if (world == null) return;
        for (int i = 0; i < uids.length; ++i) {
            if (meshCache.get(new Integer(uids[i])) != null) continue;
            Mesh mesh = (Mesh) world.find(uids[i]);
            if (mesh == null) continue;
            MeshNode node = new MeshNode(mesh);
            node.normalizeAppearance();
            meshCache.put(new Integer(uids[i]), node);
        }
    }

    /** 原 n.a(int,int,boolean): 按需取网格节点 (缺则懒加载; uid, 场景资源, 允许加载)。 */
    public static final MeshNode getMesh(int uid, int sceneResource, boolean allowLoad) {
        MeshNode node = (MeshNode) meshCache.get(new Integer(uid));
        if (node == null && allowLoad) {
            World world = null;
            try {
                Object3D[] roots = Loader.load("/" + (sceneResource & Integer.MAX_VALUE));
                for (int i = 0; i < roots.length; ++i) {
                    if (roots[i] instanceof World) { world = (World) roots[i]; break; }
                }
            }
            catch (Exception e) { e.printStackTrace(); }
            if (world == null) { System.out.println("NO world"); return null; }
            Mesh mesh = (Mesh) world.find(uid);
            if (mesh == null) return null;
            node = new MeshNode(mesh);
            node.normalizeAppearance();
            meshCache.put(new Integer(uid), node);
        }
        return node;
    }

    /** 原 n.b(int,int,int): 视口/相机装配 —— 纵横比按 HUD 裁剪后的区域修正。 */
    private static final void setupViewport(int top, int width, int height) {
        clipTop = top;
        clipW = width;
        clipH = height;
        viewportY = (float) width / (float) (height - top) * 0.7f + 0.3f;
        viewportX = (float) (height - top) / (float) width * 0.7f + 0.3f;
        camera = new Camera();
        setFov(60.0f);
        cameraXform = new Transform();
        invXform = new Transform();
        matrix = new float[16];
    }

    /** 原 n.b(Object): 绘制目标裁剪到 3D 视口区。 */
    private static void setClip(Object graphicsTarget) {
        ((Graphics) graphicsTarget).setClip(0, clipTop, clipW, clipH - clipTop);
    }

    /** 原 n.a(float[]): 3D 点 → 屏幕像素 (相机逆×模型视×投影), HUD 锚点用。 */
    public static final void projectPoint(float[] point) {
        invXform.set(cameraXform);
        invXform.invert();
        invXform.transform(point);
        camera.getProjection(invXform);
        invXform.transform(point);
        point[0] = 0.5f * clipW * point[0] / point[3] + (clipW >> 1);
        point[1] = -0.5f * clipH * point[1] / point[3] + (clipH >> 1);
    }

    /** 原 n.a(float): 设置垂直 fov (60 度), 纵横比取修正值。 */
    public static final void setFov(float degrees) {
        viewportTop = degrees;
        camera.setPerspective(degrees * viewportX, viewportY, 10.0f, 10000.0f);
    }

    /**
     * 原 n.a(float×9): 设置相机位姿 (位置 x,y,z + 朝向基向量 right/up/forward)。
     * 用叉积正交化构造 view 矩阵 (h), 第三列取 -forward (右手系→D3D 式)。
     * 调用点: House i():3435 n.a(aV,aW,cI, 0,0,-1, 0,1,0, 1) —— 塔顶上方看下。
     */
    public static final void setCameraPose(
            float px, float py, float pz,
            float rx, float ry, float rz,
            float ux, float uy, float uz,
            float fx, float fy, float fz) {
        if (rx < 1.0E-4f && rx > -1.0E-4f) rx = 0.0f;
        if (ry < 1.0E-4f && ry > -1.0E-4f) ry = 0.0f;
        if (rz < 1.0E-4f && rz > -1.0E-4f) rz = 0.0f;
        float zx = ry * fz - rz * fy;   // right × up 预备项
        float zy = rz * fx - rx * fz;
        float zz = rx * fy - ry * fx;
        float len = 1.0f / (float) Math.sqrt(zx * zx + zy * zy + zz * zz);
        zx *= len; zy *= len; zz *= len;
        float m10 = zy * rz - zz * ry;
        float m11 = zz * rx - zx * rz;
        float m12 = zx * ry - zy * rx;
        matrix[0] = zx;  matrix[1] = m10; matrix[2] = -rx; matrix[3] = px;
        matrix[4] = zy;  matrix[5] = m11; matrix[6] = -ry; matrix[7] = py;
        matrix[8] = zz;  matrix[9] = m12; matrix[10] = -rz; matrix[11] = pz;
        matrix[12] = 0;  matrix[13] = 0;  matrix[14] = 0;   matrix[15] = 1;
        cameraXform.set(matrix);
        g3d.setCamera(camera, cameraXform);
    }
}
