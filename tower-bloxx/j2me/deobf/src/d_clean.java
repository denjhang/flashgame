// ============================================================================
// d.java → MeshNode (M3G 网格节点包装)
// 原文件: d.java (59 行, 6 方法 + 2 字段)
// 证据: 持有 javax.microedition.m3g.Mesh + Transform; render 经 n.a()
//       (Graphics3D)。b() 对每个 submesh 的 Texture2D 设 blending(228)=
//       AlphaAddBlend? / wrapping(240,240)=REPEAT → 材质规格化。
// ============================================================================
// import javax.microedition.m3g.Mesh;
// import javax.microedition.m3g.Texture2D;
// import javax.microedition.m3g.Transform;

public final class MeshNode {
    private Transform transform = new Transform();   // 原 a: 节点局部变换
    private Mesh mesh;                               // 原 b: 包装的网格

    public MeshNode(Object meshObject) {
        this.transform.setIdentity();
        this.mesh = (Mesh) meshObject;
    }

    /** 原 d.a(): 提交渲染 (经全局 3D 渲染器)。 */
    public final void render() {
        Renderer3D.graphics3D().render(this.mesh, this.transform);
    }

    /** 原 d.b(): 材质规格化 —— 清 material, 贴图 blending=228/wrapping=240(REPEAT)。 */
    public final void normalizeAppearance() {
        for (int i = 0; i < this.mesh.getSubmeshCount(); ++i) {
            this.mesh.getAppearance(i).setMaterial(null);
            Texture2D tex = this.mesh.getAppearance(i).getTexture(0);
            if (tex == null) continue;
            tex.setBlending(228);
            tex.setWrapping(240, 240);
        }
    }

    /** 原 d.c(): 变换取模 (复位为单位阵)。 */
    public final void resetTransform() {
        this.transform.setIdentity();
    }

    /** 原 d.a(float,float,float): 平移, 近零分量(<1e-4)归零防漂移。 */
    public final void translate(float dx, float dy, float dz) {
        if (dx < 1.0E-4f && dx > -1.0E-4f) dx = 0.0f;
        if (dy < 1.0E-4f && dy > -1.0E-4f) dy = 0.0f;
        if (dz < 1.0E-4f && dz > -1.0E-4f) dz = 0.0f;
        this.transform.postTranslate(dx, dy, dz);
    }

    /** 原 d.a(float,float,float,float): 绕轴旋转 (角→360 度制: deg*360)。 */
    public final void rotate(float deg, float ax, float ay, float az) {
        this.transform.postRotate(deg * 360.0f, ax, ay, az);
    }
}
