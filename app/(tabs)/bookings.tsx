// app/(tabs)/bookings.tsx

import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Header pieces (same as product)
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";

// Bookings-specific UI
import Categories from "@/components/Bookings/Categories";
import EventCard from "@/components/Bookings/EventCard";

import { POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";
import { useFavorites } from "@/context/FavoritesContext";
import { useCategoryTheme } from "@/stores/useThemeStore";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// Reanimated
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type TabParamList = {
  Bookings: undefined;
  Home: undefined;
  Services?: undefined;
};

type BookingsNavProp = BottomTabNavigationProp<TabParamList, "Bookings">;

// --- Animation constants (mirroring product.tsx) ---

const FADING_PART_HEIGHT = 80;
const SEARCHBAR_HEIGHT = 60;
const CATEGORY_LIST_HEIGHT = 60;
const EXTRA_PIN_OFFSET = 10;
const HEADER_SCROLL_DISTANCE = FADING_PART_HEIGHT + EXTRA_PIN_OFFSET;
const TOTAL_HEADER_HEIGHT =
  FADING_PART_HEIGHT + SEARCHBAR_HEIGHT + CATEGORY_LIST_HEIGHT + 5;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Bookings() {
  const router = useRouter();
  const navigation = useNavigation<BookingsNavProp>();
  const isFocused = useIsFocused();
  const setPreset = useCategoryTheme((s) => s.setThemePreset);
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  const [notificationCount, setNotificationCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width: screenWidth } = useWindowDimensions();

  // theme + notifications (same pattern you had)
  useFocusEffect(
    useCallback(() => {
      setPreset("blue"); // booking theme color
      const t = setTimeout(() => setNotificationCount(6), 800);
      return () => clearTimeout(t);
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

  const renderPopularItemCard = useCallback(
    (item: (typeof POPULAR_EVENTS)[number]) => (
      <View key={item.id} className="px-3 mb-3">
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

  // ---------- Reanimated scroll state ----------
  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // Sections list (like contentSections in product.tsx)
  const contentSections = [
    { id: "upcoming", type: "upcoming" as const },
    { id: "popular", type: "popular" as const },
  ];
  type ContentSectionItem = (typeof contentSections)[number];

  const renderContentSection = ({
    item,
  }: ListRenderItemInfo<ContentSectionItem>) => {
    switch (item.type) {
      case "upcoming":
        return (
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-3 px-3">
              <Text className="font-semibold text-lg">Upcoming Events</Text>
              <TouchableOpacity
                onPress={() => router.push("/Bookings/UpcomingEvents")}
                activeOpacity={0.8}
                accessibilityLabel="See all upcoming events"
              >
                <Text className="text-base text-[#7952FC]">See all events</Text>
              </TouchableOpacity>
            </View>

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
              ItemSeparatorComponent={() => (
                <View style={{ width: ITEM_GAP }} />
              )}
              ListEmptyComponent={emptyUpcomingComponent}
            />
          </View>
        );

      case "popular":
        return (
          <View className="mt-4 pb-8">
            <View className="flex-row items-center justify-between mb-3 px-3">
              <Text className="font-semibold text-lg">Popular Events</Text>
              <TouchableOpacity
                onPress={() => router.push("/Bookings/PopularEvents")}
                activeOpacity={0.8}
                accessibilityLabel="See all popular events"
              >
                <Text className="text-base text-[#7952FC]">See all events</Text>
              </TouchableOpacity>
            </View>

            {popularFiltered.length === 0
              ? emptyPopularComponent
              : popularFiltered.map(renderPopularItemCard)}
          </View>
        );

      default:
        return null;
    }
  };

  // ---------- Animated header styles (same shell as product.tsx) ----------

  const animatedFadingPart = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollOffset.value,
      [0, HEADER_SCROLL_DISTANCE / 2],
      [1, 0],
      "clamp"
    ),
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [0, HEADER_SCROLL_DISTANCE],
          [0, -FADING_PART_HEIGHT],
          "clamp"
        ),
      },
    ],
  }));

  const animatedSearchBar = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [0, HEADER_SCROLL_DISTANCE],
          [0, -HEADER_SCROLL_DISTANCE],
          "clamp"
        ),
      },
    ],
  }));

  const animatedGradientWrapper = useAnimatedStyle(() => ({
    height: interpolate(
      scrollOffset.value,
      [0, HEADER_SCROLL_DISTANCE],
      [
        topInset + FADING_PART_HEIGHT + SEARCHBAR_HEIGHT,
        topInset + SEARCHBAR_HEIGHT - EXTRA_PIN_OFFSET,
      ],
      "clamp"
    ),
  }));

  const animatedCategoryList = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [0, HEADER_SCROLL_DISTANCE],
          [0, -HEADER_SCROLL_DISTANCE],
          "clamp"
        ),
      },
    ],
  }));

  // ---------- Scroll + Refresh (tab press) ----------

  const listRef = useRef<FlatList<ContentSectionItem> | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      if (isFocused) {
        try {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        } catch {
          // ignore
        }
        setRefreshKey(Date.now());
      }
    });

    return unsubscribe;
  }, [navigation, isFocused]);

  // ---------- Render root ----------
  return (
    <View className="flex-1 bg-gray-50">
      {/* 1. MAIN SCROLLING CONTENT (like ProductHome) */}
      <AnimatedFlatList
        key={String(refreshKey)}
        ref={listRef as any}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        data={contentSections}
        renderItem={renderContentSection as any}
        keyExtractor={(item: any) => item.id}
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottomInset + 16,
          paddingTop: TOTAL_HEADER_HEIGHT + topInset,
        }}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        windowSize={5}
      />

      {/* 2. ANIMATED HEADER (same structure as product.tsx) */}
      <Animated.View
        className="w-full overflow-hidden"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          },
          animatedGradientWrapper,
        ]}
      >
        {/* Gradient background */}
        <Animated.View
          style={[styles.headerBg, animatedGradientWrapper]}
          pointerEvents="none"
        >
          <AnimatedLinearGradient
            colors={["#E0DBFF", "#f9fafb"]} // purple-ish for bookings
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Fading part: QuickActions + HomeHeader */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              paddingTop: topInset,
            },
            animatedFadingPart,
          ]}
        >
          <View className="flex px-3 gap-2">
            <QuickActions />
            {/* If HomeHeader supports a count prop you can pass it; else keep as is */}
            <HomeHeader />
          </View>
        </Animated.View>

        {/* Search bar */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: FADING_PART_HEIGHT + topInset,
              left: 0,
              right: 0,
            },
            animatedSearchBar,
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push("/Searchscreen?tab=booking")}
            activeOpacity={0.8}
            className="mt-3 px-3"
            accessibilityLabel="Search bookings"
          >
            <SearchBar
              placeholder="Search Bookings"
              readOnly
              borderRadius={10}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* 3. PINNED CATEGORY ROW (analogous to CategoryList in product.tsx) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: FADING_PART_HEIGHT + SEARCHBAR_HEIGHT + topInset,
            left: 0,
            right: 0,
            zIndex: 9,
            backgroundColor: "#f9fafb",
            paddingTop: 5,
          },
          animatedCategoryList,
        ]}
      >
        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    overflow: "hidden",
    backgroundColor: "#E0DBFF",
  },
});
