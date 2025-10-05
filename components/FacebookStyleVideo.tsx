// components/FacebookStyleVideo.tsx
import { Entypo } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { ComponentRef, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  uri: string;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  style?: any;
  onLongPress?: () => void;
  isGestureActive?: boolean;
  loop?: boolean;
};

export const FacebookStyleVideo = ({
  uri,
  sourceWidth,
  sourceHeight,
  style,
  onLongPress,
  isGestureActive = false,
  loop = false,
}: Props) => {
  // --- Inline sizing (Facebook clamp 4:5 .. 1.91:1) ---
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) =>
    setBoxWidth(e.nativeEvent.layout.width);
  const videoRef = useRef<ComponentRef<typeof VideoView>>(null);

  const inlineHeight = useMemo(() => {
    if (!boxWidth) return null;
    const ratio =
      typeof sourceWidth === "number" &&
      typeof sourceHeight === "number" &&
      sourceHeight > 0
        ? sourceWidth / sourceHeight
        : 16 / 9;
    const MAX = 1.91;
    const MIN = 0.8;
    const r = Math.max(MIN, Math.min(MAX, ratio));
    return boxWidth / r;
  }, [boxWidth, sourceWidth, sourceHeight]);

  // --- Two players (inline & fullscreen) ---
  const inlinePlayer = useVideoPlayer(uri, (p) => {
    p.loop = loop;
  });
  const fsPlayer = useVideoPlayer(uri, (p) => {
    p.loop = loop;
  });

  // UI state reads from whichever is visible
  const [fsOpen, setFsOpen] = useState(false);
  const active = fsOpen ? fsPlayer : inlinePlayer;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      setIsPlaying(!!active.playing);
      setCurrentTime(Number(active.currentTime || 0));
      setDuration(Number(active.duration || 0));
    }, 200);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [active]);

  const ENDED_EPS = 0.05;
  const isEnded = duration > 0 && currentTime >= duration - ENDED_EPS;

  const togglePlay = () => {
    const p = fsOpen ? fsPlayer : inlinePlayer;
    if (p.playing) {
      p.pause();
    } else {
      if (isEnded) p.replay();
      p.play();
    }
  };

  // ---- Robust sync helpers ----
  function syncWhenReady(
    target: any,
    t: number,
    shouldPlay: boolean,
    maxMs = 1500
  ) {
    const start = Date.now();
    const tick = () => {
      try {
        const ready = Number(target?.duration || 0) > 0;
        if (ready) {
          target.currentTime = t;
          if (shouldPlay) target.play();
          return;
        }
      } catch {}
      if (Date.now() - start < maxMs) requestAnimationFrame(tick as any);
    };
    requestAnimationFrame(tick as any);
  }

  // We force a fresh fullscreen surface each time with a changing key
  const [fsKey, setFsKey] = useState(0);
  const [pending, setPending] = useState<{
    t: number;
    playing: boolean;
  } | null>(null);

  const openFullscreen = async () => {
    try {
      await videoRef.current?.enterFullscreen();
    } catch (e) {
      console.warn("Failed to enter fullscreen", e);
    }
  };

  const closeFullscreen = () => {
    const t = Number(fsPlayer.currentTime || 0);
    const wasPlaying = !!fsPlayer.playing;
    fsPlayer.pause();
    // Give inline surface a frame to be definitely visible again
    setFsOpen(false);
    requestAnimationFrame(() => {
      try {
        inlinePlayer.currentTime = t;
        if (wasPlaying) inlinePlayer.play();
      } catch {}
    });
  };

  const onFsModalShow = () => {
    // Modal is on screen; mount happened; now sync softly when player is ready
    if (pending) {
      syncWhenReady(fsPlayer, pending.t, pending.playing);
      setPending(null);
    }
  };

  const format = (s?: number) => {
    const v = Math.max(0, Math.floor(s ?? 0));
    const mm = String(Math.floor(v / 60)).padStart(2, "0");
    const ss = String(v % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  if (!inlineHeight) {
    return (
      <View onLayout={onLayout} style={styles.skeleton}>
        <Text style={{ color: "#666", fontSize: 12 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <>
      {/* ---------- INLINE (always mounted; surface kept alive) ---------- */}
      <View
        onLayout={onLayout}
        collapsable={false}
        style={[
          {
            width: "100%",
            height: inlineHeight,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#000",
            opacity: fsOpen ? 0.001 : 1, // keep GPU surface alive (avoid exact 0)
          },
          style,
        ]}
      >
        <VideoView
          ref={videoRef}
          player={inlinePlayer}
          nativeControls={Platform.OS !== "android"}
          contentFit="cover"
          style={StyleSheet.absoluteFillObject}
          surfaceType={Platform.OS === "android" ? "textureView" : undefined}
          fullscreenOptions={{ enable: true }}
        />

        {!fsOpen && (
          <>
            {/* Center play/pause */}
            <TouchableOpacity
              onPress={togglePlay}
              activeOpacity={0.85}
              style={styles.centerBtn}
              accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
              disabled={isGestureActive}
            >
              {isPlaying ? (
                <View style={styles.pauseBars}>
                  <View style={styles.pauseBar} />
                  <View style={[styles.pauseBar, { marginLeft: 6 }]} />
                </View>
              ) : (
                <View style={styles.playTriangle} />
              )}
            </TouchableOpacity>

            {/* Enter fullscreen */}
            <TouchableOpacity
              onPress={openFullscreen}
              activeOpacity={0.85}
              style={styles.inlineFullscreenBtn}
              accessibilityLabel="Enter fullscreen"
              disabled={isGestureActive}
            >
              <Entypo name="resize-full-screen" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ---------- FULLSCREEN (custom modal) ---------- */}
      {/* <Modal
        visible={fsOpen}
        animationType="fade"
        onShow={onFsModalShow}
        onRequestClose={closeFullscreen}
        presentationStyle="fullScreen"
        hardwareAccelerated
        statusBarTranslucent
      >
        <StatusBar hidden style="light" />
        <View style={styles.fsRoot} collapsable={false}>
          <VideoView
            key={`fs-${fsKey}`} // fresh surface each time
            player={fsPlayer}
            nativeControls={false}
            contentFit="contain"
            style={StyleSheet.absoluteFillObject}
            surfaceType={Platform.OS === "android" ? "textureView" : undefined}
          />

          <TouchableOpacity
            onPress={togglePlay}
            activeOpacity={0.85}
            style={styles.fsCenterBtn}
            accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <View style={styles.fsPauseBars}>
                <View style={styles.fsPauseBar} />
                <View style={[styles.fsPauseBar, { marginLeft: 8 }]} />
              </View>
            ) : (
              <View style={styles.fsPlayTriangle} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={closeFullscreen}
            activeOpacity={0.85}
            style={styles.fsExitBtn}
            accessibilityLabel="Exit fullscreen"
          >
            <Entypo name="resize-100" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.fsTimeWrap} pointerEvents="none">
            <Text style={styles.fsTimeText}>
              {format(currentTime)} / {format(duration)}
            </Text>
          </View>
        </View>
      </Modal> */}
    </>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },

  centerBtn: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  playTriangle: {
    marginLeft: 4,
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 18,
    borderStyle: "solid",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
  },
  pauseBars: { flexDirection: "row", alignItems: "center" },
  pauseBar: { width: 6, height: 24, backgroundColor: "#fff", borderRadius: 2 },

  inlineFullscreenBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  fsRoot: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  fsCenterBtn: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -36 }, { translateY: -36 }],
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  fsPlayTriangle: {
    marginLeft: 6,
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftWidth: 22,
    borderStyle: "solid",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
  },
  fsPauseBars: { flexDirection: "row", alignItems: "center" },
  fsPauseBar: {
    width: 8,
    height: 28,
    backgroundColor: "#fff",
    borderRadius: 2,
  },

  fsExitBtn: {
    position: "absolute",
    top: 44,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  fsTimeWrap: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fsTimeText: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
