import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Individual image item component for horizontal slider
const ImageItem = ({ uri, onClose }: { uri: string; onClose: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isZoomed, setIsZoomed] = useState(false);

  // Create pinch gesture using new Gesture API
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.setValue(event.scale);
    })
    .onEnd((event) => {
      if (event.scale < 1) {
        // If zoomed out, reset to normal
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
          }),
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }),
        ]).start(() => setIsZoomed(false));
      } else if (event.scale > 1) {
        setIsZoomed(true);
      }
    });

  const handleSingleTap = () => {
    if (isZoomed) {
      // Reset zoom
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start(() => setIsZoomed(false));
    } else {
      // Close modal
      onClose();
    }
  };

  return (
    <View
      style={{
        width: screenWidth,
        height: screenHeight,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <GestureDetector gesture={pinchGesture}>
        <TouchableOpacity
          onPress={handleSingleTap}
          activeOpacity={1}
          style={{
            width: screenWidth,
            height: screenHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.Image
            source={{ uri }}
            style={{
              width: "100%",
              height: "100%",
              transform: [{ scale }, { translateX }, { translateY }],
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </GestureDetector>
    </View>
  );
};

export const MultiImageViewer = ({
  images,
  visible,
  initialIndex = 0,
  onClose,
}: {
  images: string[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
}) => {
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (visible && flatListRef.current && images.length > 0) {
      setCurrentImageIndex(initialIndex);
      setTimeout(() => {
        try {
          const validIndex = Math.max(
            0,
            Math.min(initialIndex, images.length - 1)
          );
          flatListRef.current?.scrollToIndex({
            index: validIndex,
            animated: false,
          });
        } catch (error) {
          console.log("ScrollToIndex error:", error);
        }
      }, 100);
    }
  }, [visible, initialIndex, images.length]);

  // Handle momentum scroll end for horizontal pagination
  const onMomentumScrollEnd = (event: any) => {
    const pageIndex = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    setCurrentImageIndex(pageIndex);
  };

  const renderItem = ({ item }: { item: string }) => (
    <ImageItem uri={item} onClose={onClose} />
  );

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
      <View style={{ flex: 1, backgroundColor: "black" }}>
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

        {/* Current image counter */}
        <View
          style={{
            position: "absolute",
            top: insets.top + 10,
            left: 20,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 15,
          }}
        >
          <Text style={{ color: "white", fontSize: 14, fontWeight: "500" }}>
            {currentImageIndex + 1} of {images.length}
          </Text>
        </View>

        {/* Horizontal image slider */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollToIndexFailed={(info) => {
            console.log("ScrollToIndexFailed:", info);
            setTimeout(() => {
              try {
                const validIndex = Math.max(
                  0,
                  Math.min(info.index, images.length - 1)
                );
                flatListRef.current?.scrollToIndex({
                  index: validIndex,
                  animated: true,
                });
              } catch (error) {
                console.log("Retry ScrollToIndex error:", error);
              }
            }, 100);
          }}
        />

        {/* Page indicator dots */}
        {images.length > 1 && (
          <View
            style={{
              position: "absolute",
              bottom: insets.bottom + 30,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    index === currentImageIndex
                      ? "white"
                      : "rgba(255,255,255,0.4)",
                  marginHorizontal: 4,
                }}
              />
            ))}
          </View>
        )}

        {/* Zoom instruction */}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 60,
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 12 }}>
            Pinch to zoom • Swipe to navigate • Tap to close
          </Text>
        </View>
      </View>
    </Modal>
  );
};
