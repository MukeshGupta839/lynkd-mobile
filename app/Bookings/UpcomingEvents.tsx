// app/Bookings/upcomingEvents/index.tsx
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
import { SafeAreaView } from "react-native-safe-area-context";

import Categories from "@/components/Bookings/Categories";
import EventCard from "@/components/Bookings/EventCard";
import type { EventT } from "@/constants/bookings";
import { POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";
import { useFavorites } from "@/context/FavoritesContext";

export default function UpcomingEvents() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ---------- Memoized all events ----------
  const allEvents = useMemo<EventT[]>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS];
  }, []);

  // ---------- Memoized filtered events ----------
  const filtered = useMemo(() => {
    if (!activeCategory || activeCategory === "all") return allEvents;
    return allEvents.filter(
      (e) => (e.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory, allEvents]);

  // ---------- Header (Back + Title + Categories) ----------
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const ListHeader = useCallback(() => {
    return (
      <View>
        {/* Header bar */}
        <View className="bg-white shadow-md">
          <SafeAreaView edges={["top"]} className="pb-3 bg-transparent">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={goBack}
                activeOpacity={0.8}
                accessibilityLabel="Go back"
                className="p-2">
                <Ionicons name="chevron-back" size={22} />
              </TouchableOpacity>
              <Text className="ml-1 text-lg font-semibold text-[#13123A]">
                Upcoming Event
              </Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Categories below header */}
        <View className="mt-4 mb-3">
          <Categories
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </View>
      </View>
    );
  }, [activeCategory, goBack]);

  // ---------- Render event item ----------
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<EventT>) => (
      <View className="px-3">
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
          isFavorite={isFavorite(item.id)} // ✅ connect favorite state
          onToggleFavorite={() => toggleFavorite(item.id)} // ✅ toggle on heart press
          onPress={() =>
            router.push({
              pathname: "/Bookings/Booking",
              params: { id: item.id },
            } as any)
          }
        />
      </View>
    ),
    [router, isFavorite, toggleFavorite]
  );

  // ---------- UI ----------
  return (
    <View className="flex-1 mt-2 bg-gray-50">
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() => (
          <Text className="text-center text-gray-400 mt-10">
            No events found
          </Text>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
        // FlatList optimization props
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}
