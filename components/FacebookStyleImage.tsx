import { useEffect, useState } from "react";
import { Dimensions, Image, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureType,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { ImageViewer } from "./ImageViewer";

const windowWidth = Dimensions.get("window").width;

// Cache for image dimensions to prevent layout shift on re-renders
const imageDimensionsCache = new Map<
  string,
  { width: number; height: number }
>();

export const FacebookStyleImage = ({
  uri,
  style,
  onLongPress,
  isGestureActive = false,
  panGesture,
}: {
  uri: string;
  style?: any;
  onLongPress?: () => void;
  isGestureActive?: boolean;
  panGesture?: GestureType;
}) => {
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(() => imageDimensionsCache.get(uri) || null); // Check cache on mount
  const [showViewer, setShowViewer] = useState(false);
  const containerWidth = windowWidth - 24; // Account for padding

  // Facebook-style aspect ratio constraints
  const getClampedHeight = (originalWidth: number, originalHeight: number) => {
    const originalRatio = originalWidth / originalHeight;

    // Facebook's constraints (approximate)
    const MAX_RATIO = 1.91; // Landscape limit (1.91:1)
    const MIN_RATIO = 0.8; // Portrait limit (4:5 = 0.8)

    let clampedRatio = originalRatio;

    if (originalRatio > MAX_RATIO) {
      clampedRatio = MAX_RATIO; // Too wide, clamp to landscape limit
    } else if (originalRatio < MIN_RATIO) {
      clampedRatio = MIN_RATIO; // Too tall, clamp to portrait limit
    }

    return containerWidth / clampedRatio;
  };

  useEffect(() => {
    // Skip if already in cache
    if (imageDimensionsCache.has(uri)) {
      return;
    }

    Image.getSize(
      uri,
      (width, height) => {
        const dimensions = { width, height };
        imageDimensionsCache.set(uri, dimensions); // Cache the dimensions
        setImageSize(dimensions);
      },
      (error) => {
        console.error("Failed to get image size:", error);
        const fallback = { width: containerWidth, height: containerWidth };
        imageDimensionsCache.set(uri, fallback); // Cache fallback too
        setImageSize(fallback); // Fallback to square
      }
    );
  }, [uri, containerWidth]);

  const makeTapThatYieldsToPan = (onEnd: () => void) => {
    let g = Gesture.Tap().maxDuration(220).maxDeltaX(10).maxDeltaY(10);

    // only attach the external-fail requirement if a panGesture was provided
    if (panGesture) {
      // cast to any to satisfy the library typing when conditionally applying the call
      g = (g as any).requireExternalGestureToFail(panGesture);
    }

    return g.onEnd((_e, success) => {
      "worklet";
      if (success) {
        // hop to JS before calling anything that touches React/router
        // runOnJS(onEnd)();
        scheduleOnRN(onEnd);
      }
    });
  };

  const openImageTap = makeTapThatYieldsToPan(() => {
    if (isGestureActive) return;
    setShowViewer(true);
  });

  // Calculate clampedHeight - use a default aspect ratio while loading
  const clampedHeight = imageSize
    ? getClampedHeight(imageSize.width, imageSize.height)
    : containerWidth / 1.2; // Default to a reasonable 1.2:1 ratio while loading

  if (!imageSize) {
    return (
      <View
        style={[
          {
            width: containerWidth,
            height: clampedHeight, // Use calculated height instead of fixed 200
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
          // onPress={isGestureActive ? undefined : () => setShowViewer(true)}
          onLongPress={onLongPress}
          delayLongPress={500}
          activeOpacity={0.95}
          className="overflow-hidden bg-[#f0f0f0] w-full"
          disabled={isGestureActive}
          style={[
            {
              height: clampedHeight,
            },
            style,
          ]}
        >
          <Image
            source={{ uri }}
            className="w-full h-full"
            resizeMode="cover" // This creates the Facebook "crop" effect
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
