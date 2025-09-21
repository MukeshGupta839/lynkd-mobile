import { useEffect, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureType,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { ImageViewer } from "./ImageViewer";

const windowWidth = Dimensions.get("window").width;

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
  } | null>(null);
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
    Image.getSize(
      uri,
      (width, height) => {
        setImageSize({ width, height });
      },
      (error) => {
        console.error("Failed to get image size:", error);
        setImageSize({ width: containerWidth, height: containerWidth }); // Fallback to square
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

  if (!imageSize) {
    return (
      <View
        style={[
          {
            width: containerWidth,
            height: 200,
            backgroundColor: "#f0f0f0",
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
      >
        <Text style={{ color: "#666", fontSize: 12 }}>Loading...</Text>
      </View>
    );
  }

  const clampedHeight = getClampedHeight(imageSize.width, imageSize.height);

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
