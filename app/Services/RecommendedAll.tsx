// app/Services/RecommendedAll.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecommendedAll() {
  const router = useRouter();
  const params = useLocalSearchParams() as { items?: string; title?: string };

  const items = useMemo(() => {
    try {
      if (!params?.items) return [];
      return JSON.parse(decodeURIComponent(params.items));
    } catch (e) {
      console.warn("Failed to parse recommended items", e);
      return [];
    }
  }, [params]);

  const title = decodeURIComponent(params?.title ?? "Recommended");

  const onBack = useCallback(() => {
    router.replace("/(tabs)/services");
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <View className="flex-1">
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() =>
            router.push({
              pathname: "/Services/serviceDetails",
              params: { id: item.id, title: item.title },
            })
          }
          className="bg-white rounded-xl overflow-hidden shadow-md">
          {item?.image ? (
            <Image
              source={item.image}
              className="w-full h-40"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-40 bg-gray-200" />
          )}

          <View className="p-3">
            <Text
              numberOfLines={1}
              className="font-semibold text-base text-gray-900">
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text numberOfLines={1} className="text-sm text-gray-500 mt-1">
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
    ),
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-row items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <TouchableOpacity
          onPress={onBack}
          className="p-2 rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>

        <Text className="text-lg font-bold">{title}</Text>

        <View className="w-8" />
      </View>

      <View className="flex-1 px-4 py-2">
        <FlatList
          data={items}
          keyExtractor={(i, idx) => String(i?.id ?? idx)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperClassName="gap-x-2"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="p-5">
              <Text className="text-gray-500 text-center">No items found.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
