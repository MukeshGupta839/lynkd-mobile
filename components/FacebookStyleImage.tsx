import { useEffect, useState } from "react";
import { Dimensions, Image, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureType,
  TapGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { ImageViewer } from "./ImageViewer";

const windowWidth = Dimensions.get("window").width;

// Cache for image dimensions to prevent layout shift on re-renders
const imageDimensionsCache = new Map<
  string,
  { width: number; height: number }
>();

type Props = {
  uri: string;
  style?: any;
  onLongPress?: () => void;
  isGestureActive?: boolean;
  panGesture?: GestureType;
  /** NEW: when true, this component does not handle any taps/long-press, and does not open its own viewer */
  disableInteractions?: boolean;
};

export const FacebookStyleImage = ({
  uri,
  style,
  onLongPress,
  isGestureActive = false,
  panGesture,
  disableInteractions = false,
}: Props) => {
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(() => imageDimensionsCache.get(uri) || null);
  const [showViewer, setShowViewer] = useState(false);
  const containerWidth = windowWidth; // Account for padding

  // Facebook-style aspect ratio constraints
  const getClampedHeight = (originalWidth: number, originalHeight: number) => {
    const originalRatio = originalWidth / originalHeight;

    // Facebook's constraints (approximate)
    const MAX_RATIO = 1.91; // Landscape limit (1.91:1)
    const MIN_RATIO = 0.8; // Portrait limit (4:5 = 0.8)

    let clampedRatio = originalRatio;
    if (originalRatio > MAX_RATIO) clampedRatio = MAX_RATIO;
    else if (originalRatio < MIN_RATIO) clampedRatio = MIN_RATIO;

    return containerWidth / clampedRatio;
  };

  useEffect(() => {
    if (imageDimensionsCache.has(uri)) return;

    Image.getSize(
      uri,
      (width, height) => {
        const dimensions = { width, height };
        imageDimensionsCache.set(uri, dimensions);
        setImageSize(dimensions);
      },
      (_error) => {
        const fallback = { width: containerWidth, height: containerWidth };
        imageDimensionsCache.set(uri, fallback);
        setImageSize(fallback); // fallback to square
      }
    );
  }, [uri, containerWidth]);

  // Calculate clampedHeight - use a default aspect ratio while loading
  const clampedHeight = imageSize
    ? getClampedHeight(imageSize.width, imageSize.height)
    : containerWidth / 1.2; // Default to a reasonable 1.2:1 ratio while loading

  // ---------- PURE DISPLAY MODE (parent controls all gestures) ----------
  if (disableInteractions) {
    return (
      <View
        // Let parent GestureDetector receive touches
        pointerEvents="none"
        style={[{ width: containerWidth, height: clampedHeight }, style]}
        className="overflow-hidden bg-[#f0f0f0] w-full"
      >
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // ---------- INTERACTIVE MODE (standalone use) ----------
  // If you still use this component elsewhere by itself, it can open its own viewer.

  const makeTapThatYieldsToPan = (onEnd: () => void) => {
    // Single-tap to open viewer (no double-tap logic here; leave that to parent if needed)
    const DOUBLE_DELAY_PAD = 40;
    let g = Gesture.Tap()
      .numberOfTaps(1)
      .maxDelay(260 + DOUBLE_DELAY_PAD);

    if (panGesture) {
      // allow taps to recognize alongside parent pans
      g = g.simultaneousWithExternalGesture(panGesture);
    }

    return g.onEnd(
      (
        _e: GestureStateChangeEvent<TapGestureHandlerEventPayload>,
        success: boolean
      ) => {
        "worklet";
        if (success) scheduleOnRN(onEnd);
      }
    );
  };

  const openImageTap = makeTapThatYieldsToPan(() => {
    if (isGestureActive) return;
    setShowViewer(true);
  });

  if (!imageSize) {
    return (
      <View
        style={[
          {
            width: containerWidth,
            height: clampedHeight,
            backgroundColor: "#f0f0f0",
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
        className="rounded-2xl animate-pulse"
      >
        <View className="mt-4">
          <View className="w-full bg-gray-300 rounded-xl flex-1" />
        </View>
      </View>
    );
  }

  return (
    <>
      <GestureDetector gesture={openImageTap}>
        <TouchableOpacity
          onLongPress={onLongPress}
          delayLongPress={500}
          activeOpacity={0.95}
          className="overflow-hidden bg-[#f0f0f0] w-full"
          disabled={isGestureActive}
          style={[{ height: clampedHeight }, style]}
        >
          <Image
            source={{ uri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>
      </GestureDetector>

      <ImageViewer
        imageUri={uri}
        visible={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </>
  );
};
