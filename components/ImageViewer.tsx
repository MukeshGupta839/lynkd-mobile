import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

export const ImageViewer = ({
  imageUri,
  visible,
  onClose,
}: {
  imageUri: string;
  visible: boolean;
  onClose: () => void;
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const insets = useSafeAreaInsets();

  // Create pinch gesture using new Gesture API
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // update shared value on UI thread
      scale.value = event.scale;
    })
    .onEnd((event) => {
      if (event.scale < 1) {
        // If zoomed out, reset to normal using springs
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        // update React state on JS thread
        scheduleOnRN(setIsZoomed, false);
      } else if (event.scale > 1) {
        scheduleOnRN(setIsZoomed, true);
      }
    });

  const handleSingleTap = () => {
    if (isZoomed) {
      // Reset zoom
      scale.value = withSpring(1);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      setIsZoomed(false);
    } else {
      // Close modal
      onClose();
    }
  };

  // Reset values when modal closes
  useEffect(() => {
    if (!visible) {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      setIsZoomed(false);
    }
  }, [visible, scale, translateX, translateY]);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent={Platform.OS === "android"}
      />
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: insets.top + 10,
            right: 20,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Pinch-to-zoom image */}
        <GestureDetector gesture={pinchGesture}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleSingleTap}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Animated.Image
                source={{ uri: imageUri }}
                style={[
                  {
                    width: "100%",
                    height: "100%",
                  },
                  animatedImageStyle,
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        {/* Zoom instruction */}
        {!isZoomed && (
          <View
            style={{
              position: "absolute",
              bottom: insets.bottom + 80,
              alignSelf: "center",
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              Pinch to zoom • Tap to close
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};
