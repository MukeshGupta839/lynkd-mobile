// app/(tabs)/servicehistory.tsx
import {
  NEARBY_DATA,
  NearbyItem,
  RECOMMENDED_DATA,
  RecommendedItem,
} from "@/constants/services";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HistoryItem = RecommendedItem | (NearbyItem & { subtitle?: string });

/* ---------- Memoized history card ---------- */
const HistoryCard = React.memo(
  ({ item, onPress }: { item: HistoryItem; onPress: () => void }) => {
    const isRecommended =
      "rating" in item && typeof item.rating !== "undefined";

    return (
      <TouchableOpacity activeOpacity={0.95} onPress={onPress} className="mb-4">
        <View
          className="w-full bg-white rounded-2xl overflow-hidden "
          // only shadow inline
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
          {/* Responsive image wrapper */}
          <View className="w-full aspect-[2.5]">
            <Image
              source={item.image}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          <View className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              {item.title}
            </Text>

            {item.subtitle ? (
              <Text className="text-sm text-gray-500 mb-3">
                {item.subtitle}
              </Text>
            ) : null}

            <View className="flex-row items-center">
              {isRecommended ? (
                <>
                  <View className="flex-row items-center mr-3">
                    <Ionicons name="star" size={16} color="#f2c94c" />
                    <Text className="ml-1 text-sm font-medium text-gray-900">
                      {(item as RecommendedItem).rating?.toFixed(1) ?? "-"}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500">
                    ({(item as RecommendedItem).users ?? 0} Users)
                  </Text>
                </>
              ) : (
                <Text className="text-sm text-gray-500">
                  {item.subtitle ?? ""}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

HistoryCard.displayName = "HistoryCard";

/* ---------- Screen ---------- */
export default function ServiceHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Randomize 3 items (memoized)
  const historyData: HistoryItem[] = useMemo(() => {
    const nearbyMapped: HistoryItem[] = NEARBY_DATA.map((n) => ({
      ...n,
      subtitle: n.distance,
      rating: undefined,
      users: undefined,
    }));
    const allItems: HistoryItem[] = [...RECOMMENDED_DATA, ...nearbyMapped];
    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, []);

  const handlePress = useCallback(
    (item: HistoryItem) => {
      router.push(`/Services/Receipt?id=${encodeURIComponent(item.id)}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => (
      <HistoryCard item={item} onPress={() => handlePress(item)} />
    ),
    [handlePress]
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View
        className="w-full bg-white items-center justify-center"
        style={{
          paddingTop: insets.top,
          paddingBottom: 12,
          // shadow inline only
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 3,
        }}>
        <Text className="text-lg font-bold text-gray-900">Service History</Text>
      </View>

      <View className="flex-1 mt-3">
        <FlatList
          data={historyData}
          keyExtractor={(i) => `${i.id}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 75,
            paddingTop: 2,
            paddingHorizontal: 12, // same as px-3
          }}
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          windowSize={5}
          bounces={false}
          overScrollMode="never"
          removeClippedSubviews={false} // ensures smooth scrolling
        />
      </View>
    </View>
  );
}
