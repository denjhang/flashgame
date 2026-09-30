// ============================================================================
// o.java → MidiPlayer (MIDI 音乐/音效播放器, PlayerListener)
// 原文件: o.java (144 行, 10 方法 + 7 字段)
// 证据: Manager.createPlayer(..., "audio/midi") + VolumeControl.setLevel(40)
//       (:87); 双通道: a=一次性音效 (b(int,int) 创建, loopCount=n3),
//       b=循环 BGM (预载 a(int,boolean)→Hashtable d)。playerUpdate endOfMedia
//       → 循环计数 c==0 无限 / 否则递减重播。调用点: House.x=音乐通道(loop -1),
//       House.b=音效通道(loop 1); 曲目负 id -2147483563..-2147483568
//       (解码: index=低 15 位 → r0[80..85] = BGM80/歌曲81,82/jingle 83放置,84败,85胜)。
// ============================================================================

public final class MidiPlayer implements PlayerListener {
    private Player currentSfx;          // 原 a: 当前一次性播放 (音效/jingle)
    private Player bgmPlayer;           // 原 b: 预载循环 BGM
    private int loopCounter;            // 原 c: endOfMedia 后剩余重播次数 (0=无限)
    private Hashtable sfxCache;         // 原 d: 预载音效表 (id→Player)
    private Player preloadPlayer;       // 原 e: 预载暂存
    private boolean soundEnabled = true;// 原 f: 总开关 (f.a(bool) 切换, 关时 a() 停播)
    private boolean bgmActive;          // 原 g: BGM 播放中标志

    /** 原 o.a(int, boolean): 预载音效到缓存 (id, 需要预载)。 */
    public final void preload(int resourceId, boolean enable) {
        if (!this.sfxCache.containsKey(new Integer(resourceId)) && enable) {
            try {
                this.preloadPlayer = Manager.createPlayer(
                    new ByteArrayInputStream(g.a(resourceId)), "audio/midi");
                this.preloadPlayer.realize();
                this.preloadPlayer.prefetch();
                this.sfxCache.put(new Integer(resourceId), this.preloadPlayer);
                return;
            }
            catch (Exception exception) {}
        }
    }

    /** 原 o.a(boolean): 总开关切换, 关时立即停播。 */
    public final void setSoundEnabled(boolean enabled) {
        this.soundEnabled = enabled;
        if (!this.soundEnabled) {
            this.stopAll();
        }
    }

    /** 原 o.a(int, int): 播放音效 (r0 id, 重播次数) —— 先停当前再建新 Player。 */
    public final void play(int resourceId, int loopCount) {
        if (this.soundEnabled && resourceId != -1) {
            this.stopCurrent();
            this.bgmActive = true;
            this.startPlayer(resourceId, loopCount);
        }
    }

    /** 原 o.b(): BGM 暂停 (未挂起时)。 */
    private void pauseBgm() {
        if (this.bgmPlayer != null && !this.suspended) {
            this.haltBgm();
        }
    }

    /** 原 o.c(): 停当前音效 (g 标志复位)。 */
    private void stopCurrent() {
        if (this.currentSfx != null && this.bgmActive) {
            this.closeCurrent();
        }
        this.bgmActive = false;
    }

    /** 原 o.a(): 全停 (停 BGM + 停音效) —— 场景切换时调 (House.b.a() :1671/:1226)。 */
    public final void stopAll() {
        this.stopCurrent();
        this.pauseBgm();
    }

    /** 原 o.playerUpdate(Player, String, Object): endOfMedia → 循环/收尾。 */
    public final void playerUpdate(Player player, String event, Object data) {
        if (event == "endOfMedia" && player == this.currentSfx) {
            if (this.loopCounter == 0) {
                this.restartCurrent();
                return;
            }
            if (this.loopCounter != -1) {
                --this.loopCounter;
            }
            try {
                this.currentSfx.start();
                return;
            }
            catch (Exception exception) {}
        }
    }

    /** 原 o.b(int, int): 创建并启动 Player (loopCount, VolumeControl=40)。 */
    private void startPlayer(int resourceId, int loopCount) {
        if (!this.soundEnabled || resourceId == -1) {
            return;
        }
        try {
            this.currentSfx = Manager.createPlayer(
                new ByteArrayInputStream(g.a(resourceId)), "audio/midi");
            this.currentSfx.setLoopCount(loopCount);
            this.currentSfx.addPlayerListener(this);
            this.currentSfx.prefetch();
            VolumeControl volume = (VolumeControl) this.currentSfx.getControl("VolumeControl");
            if (volume != null) {
                volume.setLevel(40);   // 原版音量 40/100
            }
            this.currentSfx.start();
            return;
        }
        catch (Exception exception) {}
    }

    /** 原 o.d(): 关闭并置空当前音效。 */
    private void closeCurrent() {
        try {
            this.currentSfx.close();
            this.currentSfx = null;
            return;
        }
        catch (Exception exception) {}
    }

    /** 原 o.e(): 当前音效重播 (无限循环路径)。 */
    private void restartCurrent() {
        try {
            this.currentSfx.start();
            return;
        }
        catch (Exception exception) {}
    }

    /** 原 o.f(): BGM 停止。 */
    private void haltBgm() {
        try {
            this.bgmPlayer.stop();
            return;
        }
        catch (Exception exception) {}
    }
}
