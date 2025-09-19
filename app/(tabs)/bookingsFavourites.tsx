// app/(tabs)/favorites.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import Categories from "@/components/Bookings/Categories";
import EventCard from "@/components/Bookings/EventCard";
import Header from "@/components/Bookings/Header";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";
import { useFavorites } from "@/context/FavoritesContext";

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favoriteIds, isFavorite, toggleFavorite, setFavoriteIds } =
    useFavorites();

  // Combine all events
  const allEvents = useMemo(() => [...POPULAR_EVENTS, ...UPCOMING_EVENTS], []);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Default suggestions (mix 3 items: 2 popular + 1 upcoming)
  const defaultFavorites = useMemo(
    () => [...POPULAR_EVENTS.slice(0, 2), ...UPCOMING_EVENTS.slice(0, 1)],
    []
  );
  const defaultFavoriteIds = useMemo(
    () => defaultFavorites.map((e) => e.id),
    [defaultFavorites]
  );

  // --- Seed defaults ONCE on first mount if favorites are empty
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current && favoriteIds.length === 0) {
      setFavoriteIds(defaultFavoriteIds);
      seededRef.current = true;
    }
    // We intentionally do NOT re-seed when favoriteIds becomes empty later.
    // Dependencies included so React knows which values are used.
  }, [favoriteIds, setFavoriteIds, defaultFavoriteIds]);

  // Filter favorites (only items in favoriteIds are shown)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const baseList = allEvents.filter((e) => favoriteIds.includes(e.id));

    return baseList
      .filter((e) =>
        activeCategory === "all"
          ? true
          : (e as any).category?.toLowerCase() === activeCategory.toLowerCase()
      )
      .filter((e) => (q ? e.title.toLowerCase().includes(q) : true));
  }, [allEvents, favoriteIds, search, activeCategory]);

  // Stable renderItem
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<EventT>) => (
      <EventCard
        id={item.id}
        title={item.title}
        price={item.price}
        location={item.location}
        dateLabel={item.dateLabel}
        image={item.image}
        variant="compact"
        isFavorite={isFavorite(item.id)} // filled only if truly in favoriteIds
        onToggleFavorite={() => toggleFavorite(item.id)} // will remove and immediately disappear
        onPress={() =>
          router.push({
            pathname: "/Bookings/Booking",
            params: { id: item.id },
          })
        }
      />
    ),
    [isFavorite, toggleFavorite, router]
  );

  const hasAny = filtered.length > 0;

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      {/* Header */}
      <Header title="Favorite" showBackIcon={false} />

      {/* Search bar */}
      <View className="px-3">
        <View className="mt-3 flex-row items-center bg-white rounded-xl px-3 border border-gray-200">
          <Ionicons name="search" size={18} color="#13123A" />
          <TextInput
            placeholder="Search Event"
            value={search}
            onChangeText={setSearch}
            className="ml-3 flex-1 text-sm"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Categories */}
      <View className="mt-4">
        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </View>

      {/* Content */}
      <View className="mt-4 flex-1">
        {hasAny ? (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 120,
              paddingHorizontal: 12,
            }}
            initialNumToRender={6}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xl font-semibold text-[#111827] mt-2">
              No favorites found
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              Add events to your favorites and they will appear here
            </Text>
          </View>
        )}
      </View>

      {/* Explore Events button (only when there are no favorites) */}
      {!hasAny && (
        <View
          className="absolute inset-x-0 px-3 mb-3"
          style={{ bottom: insets.bottom + 40 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/bookings")}
            className="w-full rounded-2xl overflow-hidden"
            accessibilityLabel="Explore all available events">
            <LinearGradient
              colors={["#7C3AED", "#B15CDE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 items-center">
              <Text className="text-white font-semibold">Explore Events</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
