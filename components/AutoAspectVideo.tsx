// components/VideoViewer.tsx
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: W, height: H } = Dimensions.get("window");

type Props = {
  uri: string;
  visible: boolean;
  onClose: () => void;
  loop?: boolean;
  autoPlay?: boolean;
  // optional sizing hint to compute a nice initial aspect box (fallback 16:9)
  widthHint?: number | null;
  heightHint?: number | null;
};

export function VideoViewer({
  uri,
  visible,
  onClose,
  loop = false,
  autoPlay = true,
  widthHint,
  heightHint,
}: Props) {
  const ratio =
    typeof widthHint === "number" &&
    typeof heightHint === "number" &&
    heightHint > 0
      ? widthHint / heightHint
      : 16 / 9;

  const player = useVideoPlayer(uri, (p) => {
    p.loop = loop;
    if (autoPlay) p.play();
  });

  // Fit the video nicely within screen bounds while keeping ratio.
  // We'll make it up to 90% of screen width.
  const boxW = Math.min(W * 0.9, 900);
  const boxH = boxW / ratio;
  const maxH = H * 0.75;
  const finalW = boxH > maxH ? maxH * ratio : boxW;
  const finalH = boxH > maxH ? maxH : boxH;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.viewerBackdrop}>
        <View style={[styles.viewerBox, { width: finalW, height: finalH }]}>
          <VideoView
            player={player}
            nativeControls
            fullscreenOptions={{ enable: true }} // ✅ required
            allowsPictureInPicture
            contentFit="contain"
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={12}
        >
          <Text style={styles.closeTxt}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerBox: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 24,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeTxt: { color: "#fff", fontWeight: "700" },
});
