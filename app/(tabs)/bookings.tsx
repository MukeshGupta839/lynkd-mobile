// app/(tabs)/bookings.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Categories from "@/components/Bookings/Categories";
import EventCard from "@/components/Bookings/EventCard";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";

import {
  CATEGORIES,
  POPULAR_EVENTS,
  UPCOMING_EVENTS,
} from "@/constants/bookings";
import { useFavorites } from "@/context/FavoritesContext";

export default function Bookings() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width: sw } = useWindowDimensions();

  const categories = useMemo(() => CATEGORIES, []);

  const upcomingFiltered = useMemo(() => {
    if (!activeCategory || activeCategory === "all") return UPCOMING_EVENTS;
    return UPCOMING_EVENTS.filter(
      (e) => (e.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory]);

  const popularFiltered = useMemo(() => {
    if (!activeCategory || activeCategory === "all") return POPULAR_EVENTS;
    return POPULAR_EVENTS.filter(
      (e) => (e.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory]);

  // ---------- Upcoming renderer: card variant, NO heart, but pass category/isLive ----------
  const renderUpcoming = useCallback(
    ({ item }: ListRenderItemInfo<(typeof UPCOMING_EVENTS)[number]>) => (
      <EventCard
        id={item.id}
        title={item.title}
        price={item.price}
        location={item.location}
        dateLabel={item.dateLabel}
        image={item.image}
        variant="card"
        category={item.category}
        isLive={item.isLive}
        onPress={() =>
          router.push({
            pathname: "/Bookings/Booking",
            params: { id: item.id },
          })
        }
      />
    ),
    [router]
  );

  // ---------- Popular renderer: compact variant, WITH heart/favorite support, and pass category/isLive ----------
  const renderPopularItem = useCallback(
    ({ item }: ListRenderItemInfo<(typeof POPULAR_EVENTS)[number]>) => (
      <View className="px-3">
        <EventCard
          id={item.id}
          title={item.title}
          price={item.price}
          location={item.location}
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
            })
          }
        />
      </View>
    ),
    [router, isFavorite, toggleFavorite]
  );

  // ---------- card sizing & spacing for Upcoming only ----------
  const CARD_PERCENT = 0.48; // adjust to taste (0.48 ~ two cards)
  const MIN_CARD_WIDTH = 240;
  const MAX_CARD_WIDTH = 520;
  const rawCardWidth = Math.round(sw * CARD_PERCENT);
  const CARD_WIDTH = Math.max(
    MIN_CARD_WIDTH,
    Math.min(rawCardWidth, MAX_CARD_WIDTH)
  );

  const SIDE_PADDING = 12;
  const ITEM_GAP = 12;

  // ---------- Header component for the vertical FlatList ----------
  const ListTop = () => (
    <View>
      {/* Rounded gradient header */}
      <View className="w-full rounded-b-2xl overflow-hidden">
        <LinearGradient
          colors={["#E0DBFF", "#f9fafb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-full rounded-b-2xl overflow-hidden">
          <SafeAreaView edges={["top"]} className="px-3 pb-2">
            <HomeHeader />
            <QuickActions />
            <TouchableOpacity
              onPress={() => router.push("/Searchscreen")}
              activeOpacity={0.8}
              className="mt-3">
              <SearchBar placeholder="Search" readOnly />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View className="mt-4">
        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </View>

      {/* Upcoming Events (horizontal) */}
      <View className="mt-4 mb-6">
        <View className="flex-row items-center justify-between mb-3 px-3">
          <Text className="font-semibold text-lg">Upcoming Events</Text>
          <TouchableOpacity
            onPress={() => router.push("/Bookings/UpcomingEvents")}
            activeOpacity={0.8}>
            <Text className="text-base text-[#7952FC]">See all events</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={upcomingFiltered}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <View style={{ width: CARD_WIDTH }}>
              {renderUpcoming({ item, index, separators: undefined as any })}
            </View>
          )}
          bounces={false}
          overScrollMode="never"
          ListHeaderComponent={<View style={{ width: SIDE_PADDING }} />}
          ListFooterComponent={<View style={{ width: SIDE_PADDING }} />}
          ItemSeparatorComponent={() => <View style={{ width: ITEM_GAP }} />}
          contentContainerStyle={{}}
        />
      </View>

      {/* Popular header (the vertical list items follow after this) */}
      <View className="px-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-lg">Popular Events</Text>
          <TouchableOpacity
            onPress={() => router.push("/Bookings/PopularEvents")}
            activeOpacity={0.8}>
            <Text className="text-base text-[#7952FC]">See all events</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    // top-level vertical FlatList renders Popular events; header contains everything else
    <FlatList
      data={popularFiltered}
      keyExtractor={(i) => i.id}
      renderItem={renderPopularItem}
      ListHeaderComponent={<ListTop />}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      contentContainerStyle={{
        paddingBottom: 100,
        backgroundColor: "transparent",
      }}
      ItemSeparatorComponent={() => <View className="h-3" />}
    />
  );
}
