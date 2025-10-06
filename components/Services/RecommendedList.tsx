// components/Services/RecommendedList.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  onActionPress?: () => void; // <- added here
  horizontalPadding?: number; // accepted but layout uses Tailwind px-4
  gap?: number;
  verticalGap?: number;
  bottomSpacing?: number;
  imageAspect?: number;
};

function RecommendedListComponent({
  data,
  onItemPress,
  title = "Recommended For You",
  onActionPress,
}: Props) {
  const router = useRouter();
  const { width: sw } = useWindowDimensions();

  // decide columns (same responsive logic)
  const numColumns = useMemo(() => (sw >= 640 ? 2 : 1), [sw]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RecommendedItem>) => {
      return (
        <View className="flex-1 px-1 pb-4">
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => onItemPress?.(item)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="rounded-2xl overflow-hidden bg-white shadow-md">
            {item.image ? (
              <Image
                source={item.image}
                resizeMode="cover"
                className="w-full h-40"
              />
            ) : (
              <View className="w-full h-40 bg-gray-200" />
            )}

            <View className="px-3 py-3">
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
    [onItemPress]
  );

  const keyExtractor = useCallback((it: RecommendedItem) => String(it.id), []);

  const handleSeeAll = useCallback(() => {
    if (typeof onActionPress === "function") {
      onActionPress();
      return;
    }
    try {
      const payload = encodeURIComponent(JSON.stringify(data ?? []));
      router.push(
        `/Services/RecommendedAll?items=${payload}&title=${encodeURIComponent(title)}`
      );
    } catch (e) {
      console.warn("Failed to open RecommendedAll", e);
    }
  }, [onActionPress, data, router, title]);

  return (
    <View className="mt-4">
      <View className="flex-row justify-between items-center mb-3 ">
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="See all recommendations"
          onPress={handleSeeAll}>
          <Text className="text-sm text-gray-500">See All</Text>
        </TouchableOpacity>
      </View>

      <View>
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          scrollEnabled={false} // parent scroll should handle scrolling
          numColumns={numColumns}
          columnWrapperClassName={numColumns > 1 ? "gap-x-2" : undefined}
          contentContainerClassName="pb-7"
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={true}
        />
      </View>
    </View>
  );
}

export default React.memo(RecommendedListComponent);
