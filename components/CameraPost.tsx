// CameraPost.tsx
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

type CameraPostProps = { onBackToFeed: () => void; active?: boolean };

export default function CameraPost({
  onBackToFeed,
  active = true,
}: CameraPostProps) {
  const insets = useSafeAreaInsets();
  const camRef = useRef<CameraView>(null);

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<"picture" | "video">("picture");
  const [libPerm, requestLibPerm] = MediaLibrary.usePermissions();
  const [hasHardware, setHasHardware] = useState<boolean | null>(null);

  // ✅ Detect real camera availability (simulator will be false)
  useEffect(() => {
    (async () => {
      try {
        const ok =
          typeof CameraView.isAvailableAsync === "function"
            ? await CameraView.isAvailableAsync()
            : true;
        setHasHardware(ok);
      } catch {
        setHasHardware(true);
      }
    })();
  }, []);

  // ✅ Ask only for camera permission up front. Ask mic later (when recording).
  useEffect(() => {
    (async () => {
      if (!camPerm?.granted) await requestCamPerm();
    })().catch(console.warn);
  }, [camPerm, requestCamPerm]);

  // ✅ Reset ready when we toggle visibility/facing
  useEffect(() => setIsReady(false), [active]);

  // ✅ On iOS, resume preview after the view is actually visible
  useEffect(() => {
    if (Platform.OS === "ios" && active) {
      const t = setTimeout(() => camRef.current?.resumePreview?.(), 100);
      return () => clearTimeout(t);
    }
  }, [active]);

  // ask permissions up front
  useEffect(() => {
    (async () => {
      if (!camPerm?.granted) await requestCamPerm();
      if (!micPerm?.granted) await requestMicPerm();
    })().catch(console.warn);
  }, [camPerm, micPerm, requestCamPerm, requestMicPerm]);

  // reset "ready" whenever we remount-worthy inputs change
  useEffect(() => setIsReady(false), [active, facing]);

  // gestures (unchanged)
  const zoomStartRef = useRef(0);
  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          zoomStartRef.current = zoom;
        })
        .onUpdate((e) => {
          "worklet";
          const next = Math.max(0, Math.min(1, zoomStartRef.current * e.scale));
          scheduleOnRN(() => setZoom(next));
        }),
    [zoom]
  );
  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          "worklet";
          scheduleOnRN(() => setZoom((z) => (z < 0.35 ? 0.4 : 0)));
        }),
    []
  );
  const previewGestures = Gesture.Simultaneous(pinch, doubleTap);

  // Add a lightweight horizontal-pan detector so swiping from the camera
  // surface will navigate back to the main feed. This prevents the parent
  // pan gesture from being completely blocked by the camera's own GestureDetector.
  const swipeBackThreshold = 60; // px
  const horizontalPan = useMemo(
    () =>
      Gesture.Pan()
        .onEnd((e) => {
          "worklet";
          const tx = e.translationX ?? 0;
          const ty = e.translationY ?? 0;
          // Only treat as a swipe if horizontal movement is dominant
          if (
            Math.abs(tx) > Math.abs(ty) &&
            Math.abs(tx) > swipeBackThreshold
          ) {
            // schedule back to JS and navigate
            scheduleOnRN(() => onBackToFeed());
          }
        })
        // allow a single-finger pan to be recognized alongside pinch/doubleTap
        .activeOffsetY([-30, 30]),
    [onBackToFeed]
  );

  // Combine pan with preview gestures so pinch/double-tap still work
  const combinedPreview = useMemo(
    () => Gesture.Simultaneous(previewGestures, horizontalPan),
    [previewGestures, horizontalPan]
  );

  const ensureReady = useCallback(() => {
    if (!active) {
      console.log("❌ Camera inactive");
      return false;
    }
    if (!isReady) {
      console.log("❌ Camera not ready");
      return false;
    }
    if (!camRef.current) {
      console.log("❌ camRef null");
      return false;
    }
    return true;
  }, [active, isReady, camRef]);

  const takePhoto = useCallback(async () => {
    if (!ensureReady() || isRecording) return;
    try {
      if (mode !== "picture") setMode("picture");
      await new Promise(requestAnimationFrame);
      console.log("📸 takePictureAsync…");
      const pic = await camRef.current!.takePictureAsync({
        quality: 1,
        skipProcessing: Platform.OS === "android",
      });
      console.log("✅ photo:", pic?.uri);

      // 👇 save to Gallery (cross-platform)
      const perm = libPerm ?? (await requestLibPerm());
      if (!perm?.granted && perm?.accessPrivileges !== "all") {
        const res = await requestLibPerm();
        if (!res.granted && res.accessPrivileges !== "all") {
          console.warn("Media Library permission denied");
          return;
        }
      }

      // simplest: drop it into the user's camera roll
      await MediaLibrary.saveToLibraryAsync(pic.uri);

      // (optional) put it in a specific album:
      // const asset = await MediaLibrary.createAssetAsync(pic.uri);
      // const album = await MediaLibrary.getAlbumAsync("LYNKD");
      // if (album) {
      //   await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      // } else {
      //   await MediaLibrary.createAlbumAsync("LYNKD", asset, false);
      // }
    } catch (e) {
      console.warn("❌ takePictureAsync failed:", e);
    }
  }, [ensureReady, isRecording, mode, libPerm, requestLibPerm]);

  const startVideo = useCallback(async () => {
    if (!ensureReady() || isRecording) return;
    if (!micPerm?.granted) {
      await requestMicPerm();
      return;
    }
    try {
      if (mode !== "video") setMode("video");
      await new Promise(requestAnimationFrame);
      console.log("🎥 recordAsync start…");
      setIsRecording(true);
      const video = await camRef.current!.recordAsync({ maxDuration: 30 });
      console.log("✅ video:", video?.uri);
    } catch (e) {
      console.warn("❌ recordAsync failed:", e);
    } finally {
      setIsRecording(false);
      setMode("picture");
    }
  }, [ensureReady, isRecording, micPerm?.granted, mode, requestMicPerm]);

  const stopVideo = useCallback(() => {
    camRef.current?.stopRecording();
  }, []);

  const longPress = Gesture.LongPress()
    .minDuration(250)
    .onStart(() => {
      "worklet";
      scheduleOnRN(startVideo);
    })
    .onEnd((_e, success) => {
      "worklet";
      if (isRecording) scheduleOnRN(stopVideo);
    })
    .onFinalize(() => {
      "worklet";
      if (isRecording) scheduleOnRN(stopVideo);
    });

  const tap = Gesture.Tap()
    .maxDeltaX(10)
    .maxDeltaY(10)
    .onEnd((_e, success) => {
      "worklet";
      if (success) scheduleOnRN(takePhoto);
    });

  const shutterGesture = Gesture.Exclusive(longPress, tap);

  if (hasHardware === false) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text>
          Camera not available (iOS Simulator). Please test on a real device.
        </Text>
      </View>
    );
  }

  if (!camPerm) return <View style={{ flex: 1, backgroundColor: "black" }} />;
  if (!camPerm.granted) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Camera permission required.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Mount the camera ONLY when active. Also re-mount on facing/active to kick iOS into starting the session. */}
      <GestureDetector gesture={combinedPreview}>
        {active ? (
          <CameraView
            key={`${facing}-${active}`} // ← forces clean mount when shown
            ref={camRef}
            style={{ flex: 1 }}
            active // we’re mounted only when active
            facing={facing}
            flash={flash}
            zoom={zoom}
            mode={mode}
            videoQuality="1080p"
            onCameraReady={() => {
              console.log("✅ Camera ready");
              requestAnimationFrame(() => setIsReady(true));
            }}
            onMountError={(e) =>
              console.warn("❌ Camera mount error:", e?.message ?? e)
            }
            onLayout={() => {
              // make sure preview is running once laid out (helps iOS)
              if (Platform.OS === "ios") camRef.current?.resumePreview?.();
            }}
          />
        ) : (
          <View style={{ flex: 1 }} /> // placeholder while hidden
        )}
      </GestureDetector>

      {/* HUD + chrome (unchanged) */}
      <View style={{ position: "absolute", top: insets.top + 8, left: 12 }}>
        <Text style={{ color: "#0f0", fontSize: 12 }}>
          active:{String(active)} ready:{String(isReady)} rec:
          {String(isRecording)} mode:{mode}
        </Text>
      </View>

      {/* top/back + flash + facing ... */}

      {/* shutter */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom + 24,
          alignItems: "center",
        }}
      >
        <GestureDetector gesture={shutterGesture}>
          <View
            style={{
              width: 78,
              height: 78,
              borderRadius: 39,
              borderWidth: 6,
              borderColor: isRecording ? "#ff3b30" : "#fff",
              backgroundColor: isRecording
                ? "rgba(255,59,48,0.25)"
                : "transparent",
              opacity: isReady && active ? 1 : 0.5,
            }}
          />
        </GestureDetector>

        {/* hard buttons */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <TouchableOpacity onPress={takePhoto}>
            <Text style={{ color: "white" }}>Take Photo</Text>
          </TouchableOpacity>
          {!isRecording ? (
            <TouchableOpacity onPress={startVideo}>
              <Text style={{ color: "white" }}>Start Video</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={stopVideo}>
              <Text style={{ color: "white" }}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
