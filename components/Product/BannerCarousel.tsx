import { PromoSlide } from "@/constants/Banner";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  View,
} from "react-native";

// Slide component wrapped in React.memo for optimization
const Slide = React.memo(
  ({
    data,
    width,
    height,
    onPress,
  }: {
    data: PromoSlide;
    width: number;
    height: number;
    onPress?: () => void;
  }) => {
    return (
      <TouchableOpacity
        style={{
          width,
          height,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f9fa", // Light background to see bounds
        }}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Image
          source={data.image}
          style={{
            width: width - 8, // Small margin for better visual
            height: height,
            borderRadius: 12,
          }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  }
);

Slide.displayName = "Slide";

type LayoutPreset = {
  widthPctOfScreen: number; // fallback width if containerWidthPx not provided
  cardAspect: number; // w/h
  containerAlignClass: string;
};

const PRESETS: Record<"home" | "categories", LayoutPreset> = {
  home: {
    widthPctOfScreen: 1.0,
    cardAspect: 1 / 0.38, // Wide banner for home
    containerAlignClass: "items-center",
  },
  categories: {
    widthPctOfScreen: 0.95,
    cardAspect: 2.1, // Better aspect ratio for categories: 2.5:1
    containerAlignClass: "items-center",
  },
};

type PromoBannerCarouselProps = {
  variant: "home" | "categories";
  data: PromoSlide[];
  containerWidthPx?: number;
  cardPercentOfContainer?: number;
  containerClassName?: string;
  onSlidePress?: (slide: PromoSlide, index: number) => void;
};

export default function PromoBannerCarousel({
  variant,
  data,
  containerWidthPx,
  cardPercentOfContainer = 1,
  containerClassName = "",
  onSlidePress,
}: PromoBannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(index);
  indexRef.current = index;

  // Track user interaction to prevent auto-play conflicts
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const userInteractionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const sw = Dimensions.get("window").width;
  const L = PRESETS[variant];

  // Use provided data and create infinite loop data
  const originalSlides = data;
  // Create infinite scroll by tripling the data: [...data, ...data, ...data]
  const slides = [...originalSlides, ...originalSlides, ...originalSlides];
  const originalLength = originalSlides.length;
  const startIndex = originalLength; // Start from the middle set

  // Calculate responsive dimensions
  const baseW = containerWidthPx ?? sw * L.widthPctOfScreen;
  const cardW = Math.round(baseW + 18 * cardPercentOfContainer);
  const cardH = Math.round(cardW / L.cardAspect);

  // Ensure minimum dimensions for proper display
  const minHeight = 150;
  const finalCardH = Math.max(cardH, minHeight);

  // FlatList ref and initial scroll setup
  const flatListRef = useRef<FlatList>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Track current scroll position for auto-play
  const currentScrollIndex = useRef(startIndex);

  // Initialize the carousel at the middle position for infinite scroll
  useEffect(() => {
    if (!isInitialized && flatListRef.current && slides.length > 0) {
      // Set initial position to middle set without animation
      // Use longer timeout for better initialization on all platforms
      const initDelay = 200; // Consistent delay for both platforms

      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: startIndex,
          animated: false,
        });
        setIsInitialized(true);
      }, initDelay);

      return () => clearTimeout(timer);
    }
  }, [startIndex, slides.length, isInitialized]);

  // Optimized scroll handler with infinite scroll logic
  const onScroll = useCallback(
    (event: any) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const currentIndex = event.nativeEvent.contentOffset.x / slideSize;
      const roundIndex = Math.round(currentIndex);

      const distance = Math.abs(roundIndex - currentIndex);
      // Increase threshold to reduce oversensitivity - only update when we're closer to a slide
      const isNoMansLand = 0.2 < distance; // Changed from 0.4 to 0.2 for better control

      if (roundIndex !== indexRef.current && !isNoMansLand) {
        // Calculate the display index (relative to original data)
        // We need to map the tripled array index back to original index
        let displayIndex;

        if (roundIndex < originalLength) {
          // First set (0 to originalLength-1)
          displayIndex = roundIndex;
        } else if (roundIndex < originalLength * 2) {
          // Middle set (originalLength to 2*originalLength-1)
          displayIndex = roundIndex - originalLength;
        } else {
          // Third set (2*originalLength to 3*originalLength-1)
          displayIndex = roundIndex - originalLength * 2;
        }

        // Ensure displayIndex is within bounds
        displayIndex = Math.max(0, Math.min(displayIndex, originalLength - 1));

        setIndex(displayIndex);
      }
    },
    [originalLength]
  );

  // Handle infinite scroll reset with better boundary detection
  const onMomentumScrollEnd = useCallback(
    (event: any) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const currentIndex = event.nativeEvent.contentOffset.x / slideSize;
      const roundIndex = Math.round(currentIndex);

      // Update current scroll position tracker
      currentScrollIndex.current = roundIndex;

      // Reset user interaction after momentum ends
      setIsUserInteracting(false);

      // Add delay to prevent disappearing items (especially important for Android)
      const resetPosition = () => {
        // More precise boundary detection for seamless infinite scroll
        if (roundIndex < originalLength) {
          // We're in the first set, jump to equivalent position in middle set
          const equivalentIndex = roundIndex + originalLength;
          currentScrollIndex.current = equivalentIndex;

          try {
            flatListRef.current?.scrollToIndex({
              index: equivalentIndex,
              animated: false,
            });
          } catch {
            // Fallback if scrollToIndex fails
            flatListRef.current?.scrollToOffset({
              offset: equivalentIndex * cardW,
              animated: false,
            });
          }
        } else if (roundIndex >= originalLength * 2) {
          // We're in the third set, jump to equivalent position in middle set
          const equivalentIndex = roundIndex - originalLength;
          currentScrollIndex.current = equivalentIndex;

          try {
            flatListRef.current?.scrollToIndex({
              index: equivalentIndex,
              animated: false,
            });
          } catch {
            // Fallback if scrollToIndex fails
            flatListRef.current?.scrollToOffset({
              offset: equivalentIndex * cardW,
              animated: false,
            });
          }
        }
      };

      // Use setTimeout for both platforms to prevent visual glitches
      setTimeout(resetPosition, 50);
    },
    [originalLength, cardW]
  );

  // Handle scroll begin to pause auto-play
  const onScrollBeginDrag = useCallback(() => {
    setIsUserInteracting(true);
    // Clear any existing timeout
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
    }
  }, []);

  // Handle scroll end to ensure single-item snapping
  const onScrollEndDrag = useCallback(
    (event: any) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const currentOffset = event.nativeEvent.contentOffset.x;
      const currentIndex = Math.round(currentOffset / slideSize);

      // Force snap to the nearest single item
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: currentIndex,
            animated: true,
          });
        } catch {
          flatListRef.current?.scrollToOffset({
            offset: currentIndex * cardW,
            animated: true,
          });
        }
      }, 10);
    },
    [cardW]
  );

  // FlatList optimization props (modified for better touch handling)
  const flatListOptimizationProps = {
    initialNumToRender: 5, // Increase for Android to prevent disappearing items
    maxToRenderPerBatch: 5, // Increase batch size for smoother Android performance
    removeClippedSubviews: false, // Always false to prevent disappearing items on both platforms
    scrollEventThrottle: 32, // Balanced responsiveness without oversensitivity
    windowSize: 7, // Larger window for Android compatibility
    updateCellsBatchingPeriod: 100, // Consistent timing for both platforms
    keyExtractor: useCallback(
      (item: PromoSlide, itemIndex: number) => `${item.id}-${itemIndex}`,
      []
    ),
    getItemLayout: useCallback(
      (_: any, itemIndex: number) => ({
        length: cardW,
        offset: itemIndex * cardW,
        index: itemIndex,
      }),
      [cardW]
    ),
  };

  // Auto-play functionality (updated for seamless infinite scroll with user interaction handling)
  useEffect(() => {
    if (!isInitialized || originalSlides.length <= 1 || isUserInteracting)
      return;

    const timer = setInterval(() => {
      // Only auto-play if user is not actively interacting
      if (!isUserInteracting) {
        currentScrollIndex.current += 1;

        try {
          flatListRef.current?.scrollToIndex({
            index: currentScrollIndex.current,
            animated: true,
          });
        } catch {
          // Fallback to scrollToOffset if scrollToIndex fails
          flatListRef.current?.scrollToOffset({
            offset: currentScrollIndex.current * cardW,
            animated: true,
          });
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isInitialized, originalSlides.length, cardW, isUserInteracting]); // Render item with useCallback for optimization
  const renderItem = useCallback(
    ({ item, index: itemIndex }: { item: PromoSlide; index: number }) => {
      const originalIndex = itemIndex % originalLength;
      return (
        <Slide
          data={item}
          width={cardW}
          height={finalCardH}
          onPress={() => onSlidePress?.(item, originalIndex)}
        />
      );
    },
    [cardW, finalCardH, onSlidePress, originalLength]
  );

  return (
    <View className={`w-full ${L.containerAlignClass} ${containerClassName}`}>
      <View
        style={{
          width: cardW, // Use exact card width instead of 100%
          height: finalCardH,
          alignSelf: "center",
          overflow: "hidden", // Prevent showing parts of adjacent banners
        }}
      >
        <FlatList
          ref={flatListRef}
          data={slides}
          style={{
            flex: 1,
            width: cardW, // Ensure FlatList width matches container
          }}
          contentContainerStyle={{
            alignItems: "center",
          }}
          renderItem={renderItem}
          pagingEnabled={true}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollBeginDrag={onScrollBeginDrag} // Handle user interaction start
          onScrollEndDrag={onScrollEndDrag} // Handle single-item snapping
          scrollEnabled={true}
          decelerationRate="fast" // Change to "fast" for better single-item snapping
          snapToAlignment="center" // Back to center for better control
          snapToInterval={cardW}
          disableIntervalMomentum={true} // Enable for better single-item control
          bounces={false} // Disable bounce for cleaner infinite scroll
          // Enhanced touch handling
          keyboardShouldPersistTaps="never"
          directionalLockEnabled={true} // Lock to horizontal direction
          scrollsToTop={false} // Prevent accidental scroll to top
          // Props to prevent visual glitches
          persistentScrollbar={false}
          {...flatListOptimizationProps}
        />
      </View>

      <View className="flex-row justify-center mt-3 w-full">
        {originalSlides.map((_, i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 4,
              backgroundColor: i === index ? "#000000" : "rgba(0, 0, 0, 0.3)",
            }}
          />
        ))}
      </View>
    </View>
  );
}
