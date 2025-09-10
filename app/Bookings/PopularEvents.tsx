// app/Bookings/popularEvents/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Categories from "@/components/Bookings/Categories";
import EventCard from "@/components/Bookings/EventCard";
import type { EventT } from "@/constants/bookings";
import { POPULAR_EVENTS } from "@/constants/bookings";
import { useFavorites } from "@/context/FavoritesContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PopularEvents() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const allEvents = useMemo<EventT[]>(() => [...POPULAR_EVENTS], []);

  const filtered = useMemo(() => {
    if (!activeCategory || activeCategory === "all") return allEvents;
    return allEvents.filter(
      (e) => (e.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory, allEvents]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const ListHeader = useCallback(() => {
    return (
      <View>
        <View className="bg-white shadow-md">
          <SafeAreaView edges={["top"]} className="pb-3 bg-transparent">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={goBack}
                activeOpacity={0.8}
                className="p-2">
                <Ionicons name="chevron-back" size={22} />
              </TouchableOpacity>
              <Text className="ml-1 text-lg font-semibold text-[#13123A]">
                Popular Event
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View className="mt-4 pb-3">
          <Categories
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </View>
      </View>
    );
  }, [activeCategory, goBack]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<EventT>) => {
      return (
        // padding for shadow breathing room
        <View className="px-3 pb-3">
          <EventCard
            id={item.id}
            title={item.title}
            price={item.price}
            location={item.location}
            dateLabel={item.dateLabel}
            image={item.image}
            variant="compact"
            category={item.category}
            isLive={item.isLive}
            isFavorite={isFavorite(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onPress={() =>
              router.push({
                pathname: "/Bookings/Booking",
                params: { id: item.id },
              } as any)
            }
          />
        </View>
      );
    },
    [isFavorite, toggleFavorite, router]
  );

  return (
    <View className="flex-1 mt-2 bg-gray-50">
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        // provide vertical spacing between items and room for shadows
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListFooterComponent={() => <View className="h-16" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    </View>
  );
}
