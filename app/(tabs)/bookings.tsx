import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";

import Categories from "@/components/Bookings/Categories";
import EventCard from "@/components/Bookings/EventCard";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";

import { POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";
import { useFavorites } from "@/context/FavoritesContext";
import { useCategoryTheme } from "@/stores/useThemeStore";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ----- typed Bottom Tab param list -----
type TabParamList = {
  Bookings: undefined;
  Home: undefined;
  Services?: undefined;
};
type BookingsNavProp = BottomTabNavigationProp<TabParamList, "Bookings">;

export default function Bookings() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width: screenWidth } = useWindowDimensions();
  const setPreset = useCategoryTheme((s) => s.setThemePreset);

  // ✅ Dynamic notification count (same pattern)
  const [notificationCount, setNotificationCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setPreset("blue"); // booking theme color
      // simulate async fetch
      setTimeout(() => setNotificationCount(6), 800);
    }, [setPreset])
  );

  const CARD_PERCENT = 0.6;
  const ITEM_GAP = 12;
  const CARD_WIDTH = Math.round(screenWidth * CARD_PERCENT);

  // ---------- filters ----------
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

  // ---------- renderers ----------
  const renderUpcomingItem = useCallback(
    ({ item }: ListRenderItemInfo<(typeof UPCOMING_EVENTS)[number]>) => (
      <View style={{ width: CARD_WIDTH }}>
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
      </View>
    ),
    [router, CARD_WIDTH]
  );

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

  const horizontalGetItemLayout = useCallback(
    (_: any, index: number) => {
      const length = CARD_WIDTH + ITEM_GAP;
      const offset = index * length;
      return { length, offset, index };
    },
    [CARD_WIDTH]
  );

  const listEdgeSpacer = useMemo(
    () => <View style={{ width: ITEM_GAP }} />,
    [ITEM_GAP]
  );
  const emptyUpcomingComponent = useMemo(
    () => <Text className="px-3">No upcoming events</Text>,
    []
  );
  const emptyPopularComponent = useMemo(
    () => <Text className="px-3">No popular events</Text>,
    []
  );

  // ---------- Header (ListTop) ----------
  const ListTop = useMemo(() => {
    return (
      <View>
        <View className="w-full rounded-b-2xl overflow-hidden">
          <LinearGradient
            colors={["#E0DBFF", "#f9fafb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="w-full rounded-b-2xl overflow-hidden">
            <View className="px-3 py-1">
              {/* ✅ pass count to HomeHeader */}
              <HomeHeader count={notificationCount} />

              <QuickActions />
              <TouchableOpacity
                onPress={() => router.push("/Searchscreen?tab=booking")}
                activeOpacity={0.8}
                className="mt-3"
                accessibilityLabel="Search bookings">
                <SearchBar placeholder="Search Bookings" readOnly />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View className="mt-4">
          <Categories
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </View>

        {/* Upcoming header */}
        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-3 px-3">
            <Text className="font-semibold text-lg">Upcoming Events</Text>
            <TouchableOpacity
              onPress={() => router.push("/Bookings/UpcomingEvents")}
              activeOpacity={0.8}
              accessibilityLabel="See all upcoming events">
              <Text className="text-base text-[#7952FC]">See all events</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal FlatList */}
          <FlatList
            data={upcomingFiltered}
            keyExtractor={(i) => i.id}
            renderItem={renderUpcomingItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            initialNumToRender={3}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            snapToInterval={CARD_WIDTH + ITEM_GAP}
            decelerationRate="fast"
            getItemLayout={horizontalGetItemLayout}
            ListHeaderComponent={listEdgeSpacer}
            ListFooterComponent={listEdgeSpacer}
            ItemSeparatorComponent={() => <View style={{ width: ITEM_GAP }} />}
            ListEmptyComponent={emptyUpcomingComponent}
          />
        </View>

        <View className="px-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-lg">Popular Events</Text>
            <TouchableOpacity
              onPress={() => router.push("/Bookings/PopularEvents")}
              activeOpacity={0.8}
              accessibilityLabel="See all popular events">
              <Text className="text-base text-[#7952FC]">See all events</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [
    router,
    activeCategory,
    renderUpcomingItem,
    horizontalGetItemLayout,
    listEdgeSpacer,
    emptyUpcomingComponent,
    notificationCount,
  ]);

  // ---------- Scroll + Refresh ----------
  const listRef = useRef<FlatList<any> | null>(null);
  const navigation = useNavigation<BookingsNavProp>();
  const isFocused = useIsFocused();
  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());

  useMemo(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
      if (isFocused) {
        try {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        } catch {
          // ignore
        }
        setRefreshKey(Date.now());
      }
    });
    return () => {
      unsubscribe();
    };
  }, [navigation, isFocused]);

  return (
    <FlatList
      key={String(refreshKey)}
      ref={listRef}
      data={popularFiltered}
      keyExtractor={(i) => i.id}
      renderItem={renderPopularItem}
      ListHeaderComponent={ListTop}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      contentContainerStyle={{
        paddingBottom: 70,
        backgroundColor: "transparent",
      }}
      initialNumToRender={6}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews={true}
      ListEmptyComponent={emptyPopularComponent}
    />
  );
}
