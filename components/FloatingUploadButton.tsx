import { cameraActiveSV, tabBarHiddenSV } from "@/lib/tabBarVisibility";
import { useUploadStore } from "@/stores/useUploadStore";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FloatingUploadButtonProps {
  insets: { bottom: number };
}

export function FloatingUploadButton({ insets }: FloatingUploadButtonProps) {
  const router = useRouter();
  const { bottom } = insets;

  const { status, progress } = useUploadStore();

  // Animated progress value for smooth transitions
  const animatedProgress = useSharedValue(0);

  // Update animated progress when progress changes
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 400, // Smooth 400ms transition between updates
      // Using timing instead of spring for more predictable, linear progress
    });
  }, [animatedProgress, progress]);

  // Scale animation for success/error icons
  const iconScale = useSharedValue(0);

  useEffect(() => {
    if (status === "success" || status === "error") {
      iconScale.value = 0;
      iconScale.value = withSpring(1, {
        damping: 10,
        stiffness: 200,
      });
    } else {
      iconScale.value = withTiming(0, { duration: 200 });
    }
  }, [iconScale, status]);

  // Opacity animation for upload state
  const uploadOpacity = useSharedValue(status === "uploading" ? 1 : 0);

  useEffect(() => {
    if (status === "uploading") {
      uploadOpacity.value = withTiming(1, { duration: 300 });
    } else {
      uploadOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [status, uploadOpacity]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const uploadAnimatedStyle = useAnimatedStyle(() => ({
    opacity: uploadOpacity.value,
  }));

  // Derive visibility from global shared values
  const shouldHide = useDerivedValue(() => {
    return !!tabBarHiddenSV.value || !!cameraActiveSV.value;
  });

  // Mirror the CustomTabBar constants
  const BUTTON_LIFT = Platform.OS === "ios" ? 15 : 35;
  const ANIM_DURATION = 180;

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = shouldHide.value
      ? withTiming(BUTTON_LIFT + (bottom || 0) + 24, {
          duration: ANIM_DURATION,
        })
      : withTiming(-(BUTTON_LIFT + (bottom || 0)), { duration: ANIM_DURATION });
    const opacity = shouldHide.value
      ? withTiming(0, { duration: ANIM_DURATION })
      : withTiming(1, { duration: ANIM_DURATION });
    return {
      transform: [{ translateY }],
      opacity,
      alignItems: "flex-end",
    } as any;
  });

  const handlePress = () => {
    if (status === "uploading") return; // Disable when uploading
    router.push("/(compose)/post-create");
  };

  // Animated props for the progress circle
  const animatedCircleProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * 16;
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View
        className="items-end pr-4"
        style={{ paddingBottom: insets.bottom }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handlePress}
          disabled={status === "uploading"}
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            backgroundColor: "transparent",
          }}
        >
          {/* Glass effect - Same for both platforms */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 28,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
            }}
          />

          {/* Additional white tint for glass effect */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 28,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
            }}
          />

          {/* Inner glow/highlight - brighter for better glass effect */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.4)",
              borderTopColor: "rgba(255, 255, 255, 0.7)",
              borderLeftColor: "rgba(255, 255, 255, 0.5)",
            }}
          />

          {/* Outer border for definition */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 28,
              borderWidth: 0.5,
              borderColor: "rgba(0, 0, 0, 0.12)",
            }}
          />

          {/* Content based on upload status */}
          {status === "idle" && (
            <FontAwesome6 name="plus" size={28} color="#000" />
          )}

          {status === "uploading" && (
            <Animated.View
              className="items-center justify-center"
              style={uploadAnimatedStyle}
            >
              {/* Progress circle */}
              <Svg width="40" height="40" style={{ position: "absolute" }}>
                {/* Background circle */}
                <Circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#E0E0E0"
                  strokeWidth="3"
                  fill="none"
                />
                {/* Animated progress circle */}
                <AnimatedCircle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#000"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="20, 20"
                  animatedProps={animatedCircleProps}
                />
              </Svg>
              <ActivityIndicator size="small" color="#000" />
            </Animated.View>
          )}

          {status === "success" && (
            <Animated.View style={iconAnimatedStyle}>
              <FontAwesome6 name="check" size={28} color="#22C55E" />
            </Animated.View>
          )}

          {status === "error" && (
            <Animated.View style={iconAnimatedStyle}>
              <FontAwesome6 name="xmark" size={28} color="#EF4444" />
            </Animated.View>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}
