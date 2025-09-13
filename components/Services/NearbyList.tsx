// components/Services/NearbyList.tsx
import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default React.memo(function NearbyList({
  data,
  onItemPress,
  title = "Near By You",
  onActionPress,
  horizontalPadding = 8,
  gap = 12,
  maxCardWidth = 200,
  minCardWidth = 120,
  cardsPerRowOnLarge = 2.2,
  overlapRatio = 0.65,
  imageAspect = 2.0,
  largeMode = false,
}: {
  data: any[];
  onItemPress?: (item: any) => void;
  title?: string;
  onActionPress?: () => void;
  horizontalPadding?: number;
  gap?: number;
  maxCardWidth?: number;
  minCardWidth?: number;
  cardsPerRowOnLarge?: number;
  overlapRatio?: number;
  imageAspect?: number;
  largeMode?: boolean;
}) {
  const { width: sw } = useWindowDimensions();

  // responsive card width (dynamic)
  const cardWidth = useMemo(() => {
    const available = Math.max(320, sw - horizontalPadding * 2);
    const desired = largeMode
      ? cardsPerRowOnLarge
      : available > 420
        ? 3.0
        : 2.2;
    let w = Math.floor(available / desired) - gap;
    w = Math.max(minCardWidth, Math.min(maxCardWidth, w));
    return w;
  }, [
    sw,
    horizontalPadding,
    gap,
    maxCardWidth,
    minCardWidth,
    cardsPerRowOnLarge,
    largeMode,
  ]);

  // image height and top offset (dynamic)
  const imageHeight = useMemo(
    () => Math.round(cardWidth / imageAspect),
    [cardWidth, imageAspect]
  );
  const imageTop = useMemo(
    () => Math.round(-imageHeight * overlapRatio),
    [imageHeight, overlapRatio]
  );

  // list padding top so overlapping images don't hit header
  const listPaddingTop = Math.abs(imageTop) + 8;

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const leftOffset = Math.round((cardWidth * (1 - 0.92)) / 2);
      const innerImageW = Math.round(cardWidth * 0.92);

      return (
        <View style={{ width: cardWidth }} className="overflow-visible mx-1.5">
          <View className="relative overflow-visible">
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => onItemPress?.(item)}
              accessibilityRole="button"
              accessibilityLabel={
                item?.title
                  ? `Open ${item.title}`
                  : `Open nearby item ${index + 1}`
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="overflow-visible rounded-2xl">
              {/* card (visual) - keep only shadow inline (platform specific) */}
              <View
                className="rounded-2xl bg-white overflow-hidden"
                style={{
                  // Shadow kept inline only (iOS shadow + Android elevation)
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 12 },
                  elevation: 6,
                }}>
                {/* spacer for image overlap */}
                <View
                  style={{
                    height: Math.max(imageHeight * (1 - overlapRatio), 10),
                  }}
                />
                <View className="px-4 pt-3 pb-4">
                  <Text
                    numberOfLines={1}
                    className="text-lg font-bold text-gray-900">
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-sm text-gray-500 mt-1">
                    {item.distance ?? ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* overlapping image; pointerEvents="box-none" so touch falls through */}
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                left: leftOffset,
                width: innerImageW,
                height: imageHeight,
                top: imageTop,
              }}
              className="items-center justify-center overflow-visible">
              <View className="w-[96%] h-[96%] rounded-lg overflow-hidden bg-white">
                <Image
                  source={item.image}
                  resizeMode="cover"
                  className="w-full h-full"
                />
              </View>
            </View>
          </View>
        </View>
      );
    },
    [cardWidth, imageHeight, imageTop, overlapRatio, onItemPress]
  );

  // stable key: use id/key if present, otherwise index
  const keyExtractor = useCallback(
    (i: any, index: number) => String(i?.id ?? i?.key ?? index),
    []
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<any> | null | undefined, index: number) => {
      const length = cardWidth + gap;
      return { length, offset: length * index, index };
    },
    [cardWidth, gap]
  );

  return (
    <View className="overflow-visible">
      {/* Header using Tailwind */}
      <View className="pb-2 px-3 pt-2 bg-gray-50">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-gray-900">{title}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onActionPress}
            accessibilityRole="button"
            accessibilityLabel="See all nearby items"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-sm text-gray-500">See All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={data}
        horizontal
        style={{ overflow: "visible" }}
        contentContainerStyle={{
          paddingTop: listPaddingTop,
          paddingHorizontal: horizontalPadding,
        }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={6}
        removeClippedSubviews={true}
        getItemLayout={getItemLayout}
      />
    </View>
  );
});
