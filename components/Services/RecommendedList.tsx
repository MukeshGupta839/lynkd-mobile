// components/Services/RecommendedList.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export type RecommendedItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  rating?: number;
  users?: number;
  image: any;
};

type Props = {
  data: RecommendedItem[];
  onItemPress?: (item: RecommendedItem) => void;
  title?: string;
  horizontalPadding?: number;
  gap?: number;
  verticalGap?: number;
  bottomSpacing?: number;
  imageAspect?: number;
};

function RecommendedListComponent({
  data,
  onItemPress,
  title = "Recommended For You",
  horizontalPadding = 12,
  gap = 12,
  verticalGap = 16,
  bottomSpacing = 28,
  imageAspect = 16 / 9,
}: Props) {
  const { width: sw } = useWindowDimensions();

  const numColumns = useMemo(() => (sw >= 640 ? 2 : 1), [sw]);

  const itemWidthPx = useMemo(() => {
    const containerWidth = Math.max(0, sw - horizontalPadding * 2);
    if (numColumns === 1) return containerWidth;
    return Math.floor((containerWidth - gap) / 2);
  }, [sw, horizontalPadding, gap, numColumns]);

  const estimatedImageHeight = useMemo(
    () => Math.round(itemWidthPx / imageAspect),
    [itemWidthPx, imageAspect]
  );
  const estimatedContentHeight = 88;
  const estimatedItemHeight =
    estimatedImageHeight + estimatedContentHeight + verticalGap;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RecommendedItem>) => {
      return (
        <View
          style={{
            width: itemWidthPx,
            paddingHorizontal: gap / 2,
            paddingBottom: verticalGap,
          }}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => onItemPress?.(item)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="rounded-2xl overflow-hidden bg-white"
            style={{
              // Inline shadow only (iOS shadow + Android elevation)
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}>
            {/* image container - dynamic aspect ratio */}
            <View
              style={{
                width: "100%",
                aspectRatio: imageAspect,
                overflow: "hidden",
              }}>
              <Image
                source={item.image}
                resizeMode="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>

            <View className="px-4 py-3">
              <Text
                className="text-lg font-bold text-gray-900"
                numberOfLines={1}>
                {item.title}
              </Text>

              {item.subtitle ? (
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              ) : null}

              <View className="flex-row items-center mt-2">
                <Ionicons name="star" size={14} color="#facc15" />
                <Text className="ml-2 text-sm font-medium text-gray-800">
                  {(item.rating ?? 0).toFixed(1)}
                </Text>
                <Text className="ml-2 text-xs text-gray-500">
                  ({item.users ?? 0} Users)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [itemWidthPx, gap, verticalGap, onItemPress, imageAspect]
  );

  const keyExtractor = useCallback((it: RecommendedItem) => String(it.id), []);

  // compute row-based offset for multi-column lists
  const getItemLayout = useCallback(
    (data: ArrayLike<RecommendedItem> | null | undefined, index: number) => {
      const row = Math.floor(index / numColumns);
      return {
        length: estimatedItemHeight,
        offset: estimatedItemHeight * row,
        index,
      };
    },
    [estimatedItemHeight, numColumns]
  );

  return (
    <View className="mt-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="See all recommendations">
          <Text className="text-sm text-gray-500">See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        scrollEnabled={false} // parent scroll should handle scrolling
        numColumns={numColumns}
        columnWrapperStyle={
          numColumns > 1
            ? {
                justifyContent: "space-between",
                paddingHorizontal: Math.max(0, horizontalPadding - gap / 2),
              }
            : undefined
        }
        contentContainerStyle={{ paddingBottom: bottomSpacing }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={true}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}

export default React.memo(RecommendedListComponent);
