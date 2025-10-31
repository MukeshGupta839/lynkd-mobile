import Ionicons from "@expo/vector-icons/Ionicons";
import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// shared in-memory zoom cache across ImageItems keyed by uri
const ZOOM_CACHE = ((global as any).__LYNKD_IMAGE_ZOOM_CACHE__ ||= {});

// Individual image item component for horizontal slider using Zoomable
const ImageItem = ({
  uri,
  onClose,
  onZoomChange,
}: {
  uri: string;
  onClose: () => void;
  onZoomChange: (z: boolean) => void;
}) => {
  const scale = useSharedValue(1);
  const zoomRef = useRef<any>(null);

  // For behind-notch/fullscreen rendering we'll use the full screen height so
  // Zoomable and layout cover the notch/status-bar area.
  const [displayWidth, setDisplayWidth] = useState(screenWidth);
  const [displayHeight, setDisplayHeight] = useState(screenHeight);

  // restore cached zoom
  useEffect(() => {
    if (!uri) return;
    const cached = ZOOM_CACHE[uri];
    if (cached) {
      scale.value = cached.scale ?? 1;
      if ((cached.scale ?? 1) > 1) onZoomChange(true);
    } else {
      scale.value = 1;
    }
  }, [uri, scale, onZoomChange]);

  // compute display-fit size
  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => {
        // fit inside full-screen width/height so the image can render behind notch
        const fit = Math.min(screenWidth / w, screenHeight / h);
        setDisplayWidth(w * fit);
        setDisplayHeight(h * fit);
      },
      () => {
        setDisplayWidth(screenWidth);
        setDisplayHeight(screenHeight);
      }
    );
  }, [uri]);

  const handleInteractionStart = () => onZoomChange(true);

  const handleInteractionEnd = () => {
    try {
      const info = zoomRef.current?.getInfo?.();
      const currentScale = info?.transformations?.scale ?? scale.value ?? 1;
      const tx = info?.transformations?.translateX ?? 0;
      const ty = info?.transformations?.translateY ?? 0;
      if (uri) ZOOM_CACHE[uri] = { scale: currentScale, tx, ty };
      onZoomChange(currentScale > 1);
      scale.value = currentScale;
    } catch {
      // ignore
      onZoomChange(scale.value > 1);
    }
  };

  const handleSingleTap = () => {
    if ((scale?.value ?? 1) <= 1) {
      if (uri) delete ZOOM_CACHE[uri];
      onClose();
    } else {
      zoomRef.current?.reset?.();
      if (uri) delete ZOOM_CACHE[uri];
      onZoomChange(false);
    }
  };

  const handleDoubleTap = (zoomType?: any) => {
    onZoomChange(true);
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
      <View
        style={{
          width: screenWidth,
          height: screenHeight,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          backgroundColor: "black",
        }}
      >
        <Zoomable
          ref={zoomRef}
          minScale={1}
          maxScale={5}
          scale={scale}
          doubleTapScale={3}
          isSingleTapEnabled
          isDoubleTapEnabled
          onInteractionStart={handleInteractionStart}
          onInteractionEnd={handleInteractionEnd}
          onPanStart={() => {}}
          onPanEnd={() => {}}
          onPinchStart={() => {}}
          onPinchEnd={() => {}}
          onSingleTap={handleSingleTap}
          onDoubleTap={handleDoubleTap}
          onProgrammaticZoom={() => {}}
          onResetAnimationEnd={() => {}}
          style={{ width: screenWidth, height: screenHeight }}
        >
          <Image
            source={{ uri }}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              width: displayWidth,
              height: displayHeight,
              alignSelf: "center",
            }}
            resizeMode="contain"
          />
        </Zoomable>
      </View>
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

  const [childZoomed, setChildZoomed] = useState(false);

  const renderItem = ({ item }: { item: string }) => (
    <ImageItem
      uri={item}
      onClose={onClose}
      onZoomChange={(z) => setChildZoomed(z)}
    />
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
          scrollEnabled={!childZoomed}
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
