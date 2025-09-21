// CreatePostImageViewer.tsx
import { Entypo } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ImageViewer } from "../ImageViewer";

interface RNFile {
  uri: string;
  name: string;
  type: string;
}

interface CreatePostImageViewerProps {
  images: RNFile[];
  removeImage: (index: number) => void;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

export default function CreatePostImageViewer({
  images,
  removeImage,
}: CreatePostImageViewerProps) {
  const flatListRef = useRef<FlatList<RNFile>>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentUri =
    currentIndex != null && images[currentIndex]
      ? images[currentIndex].uri
      : "";

  // keep viewer safe if an item is removed
  useEffect(() => {
    if (currentIndex != null && currentIndex >= images.length) {
      setShowViewer(false);
      setCurrentIndex(null);
    }
  }, [images.length, currentIndex]);

  // Handle viewer state changes with transition management
  const handleOpenViewer = (index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);

    // Small delay to ensure state is set before showing viewer
    requestAnimationFrame(() => {
      setShowViewer(true);
      // Reset transition flag after a brief delay
      setTimeout(() => setIsTransitioning(false), 100);
    });
  };

  const handleCloseViewer = () => {
    setIsTransitioning(true);
    setShowViewer(false);

    // Delay clearing the index to prevent flicker
    setTimeout(() => {
      setCurrentIndex(null);
      setIsTransitioning(false);
    }, 100);
  };

  // Composer-like constants
  const THUMB_H = 120; // fixed row height
  const GAP = 12; // gap between cards
  const SIDE = 12; // side padding
  const MIN_W = THUMB_H * 0.6; // tall images appear narrower
  const MAX_W = THUMB_H * 2.1; // very wide images appear wider

  return (
    <View style={{ width: "100%" }}>
      <View
        style={{
          height: THUMB_H,
          // Prevent layout shifts during transitions
          opacity: isTransitioning ? 0.95 : 1,
        }}
      >
        <FlatList
          ref={flatListRef}
          horizontal
          data={images}
          keyExtractor={(it, i) => `${it.uri}-${i}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SIDE }}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          // These props disable virtualization and keep all items rendered
          removeClippedSubviews={false}
          initialNumToRender={images.length}
          maxToRenderPerBatch={images.length}
          windowSize={images.length}
          // Improved getItemLayout for better performance
          getItemLayout={(data, index) => {
            const itemWidth =
              data && data[index]
                ? clamp(THUMB_H * 1, MIN_W, MAX_W) // Use average width estimate
                : MAX_W;
            return {
              length: itemWidth + GAP,
              offset: (itemWidth + GAP) * index,
              index,
            };
          }}
          renderItem={({ item, index }) => (
            <ImageCard
              uri={item.uri}
              index={index}
              height={THUMB_H}
              minWidth={MIN_W}
              maxWidth={MAX_W}
              onPreview={() => handleOpenViewer(index)}
              onRemove={() => removeImage(index)}
              isTransitioning={isTransitioning}
            />
          )}
        />
      </View>

      {/* Your full-screen viewer */}
      <ImageViewer
        imageUri={currentUri}
        visible={showViewer}
        onClose={handleCloseViewer}
      />
    </View>
  );
}

function ImageCard({
  uri,
  index,
  height,
  minWidth,
  maxWidth,
  onPreview,
  onRemove,
  isTransitioning,
}: {
  uri: string;
  index: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  onPreview: () => void;
  onRemove: () => void;
  isTransitioning?: boolean;
}) {
  // default to square until we know the real size
  const [aspect, setAspect] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  // width scales from the actual aspect ratio, clamped for nice UI
  const width = useMemo(
    () => clamp(height * aspect, minWidth, maxWidth),
    [aspect, height, minWidth, maxWidth]
  );

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#f2f2f2",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        // Prevent interaction during transitions
        pointerEvents: isTransitioning ? "none" : "auto",
      }}
    >
      <Image
        source={{ uri }}
        style={{
          width: "100%",
          height: "100%",
          opacity: isLoaded ? 1 : 0,
        }}
        contentFit="cover"
        transition={100}
        onLoad={(e) => {
          // expo-image gives actual dimensions here
          const w = e.source?.width ?? 0;
          const h = e.source?.height ?? 0;
          if (w > 0 && h > 0) {
            setAspect(w / h);
            setIsLoaded(true);
          }
        }}
      />

      {/* Loading placeholder */}
      {!isLoaded && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#f2f2f2",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      )}

      {/* tap anywhere on the card to preview */}
      <Pressable
        onPress={onPreview}
        style={{ position: "absolute", inset: 0 }}
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Open image ${index + 1}`}
        disabled={isTransitioning}
      />

      {/* close button */}
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          backgroundColor: "rgba(0,0,0,0.7)",
          borderRadius: 999,
          padding: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Remove image ${index + 1}`}
      >
        <Entypo name="cross" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}
