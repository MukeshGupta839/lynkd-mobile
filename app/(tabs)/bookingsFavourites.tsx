// app/(tabs)/favorites.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

  const allEvents = useMemo(() => [...POPULAR_EVENTS, ...UPCOMING_EVENTS], []);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEvents
      .filter((e) => favoriteIds.includes(e.id))
      .filter((e) =>
        activeCategory === "all"
          ? true
          : (e as any).category?.toLowerCase() === activeCategory.toLowerCase()
      )
      .filter((e) => (q ? e.title.toLowerCase().includes(q) : true));
  }, [allEvents, favoriteIds, search, activeCategory]);

  const renderItem = ({ item }: ListRenderItemInfo<EventT>) => (
    <EventCard
      id={item.id}
      title={item.title}
      price={item.price}
      location={item.location}
      dateLabel={item.dateLabel}
      image={item.image}
      variant="compact"
      isFavorite={isFavorite(item.id)}
      onToggleFavorite={() => toggleFavorite(item.id)}
      onPress={() =>
        router.push({
          pathname: "/Bookings/Booking",
          params: { id: item.id },
        })
      }
    />
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
      <View className=" mt-4 flex-1">
        {hasAny ? (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View className="h-3" />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center ">
            <View className="w-40 h-40 rounded-xl items-center justify-center bg-white shadow-sm">
              <View className="w-24 h-24 rounded-full items-center justify-center bg-violet-50">
                <Ionicons name="alert-circle" size={48} color="#C7B0F6" />
              </View>
            </View>

            <Text className="text-xl font-semibold text-[#111827] mt-2">
              Oops!
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              There are no events you saved
            </Text>
          </View>
        )}
      </View>

      {/* Floating Explore Event button */}
      {!hasAny && (
        <View
          className={`absolute inset-x-0 px-4 mb-3`}
          style={{ bottom: insets.bottom + 45 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/bookings")}
            className="w-full rounded-2xl overflow-hidden">
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
