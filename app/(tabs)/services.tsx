// app/(tabs)/services.tsx

import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reuse product components
import PromoBannerCarousel from "@/components/Product/BannerCarousel";
import CategoryList from "@/components/Product/CategoryList";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";

// Services-specific lists
import NearbyList from "@/components/Services/NearbyList";
import RecommendedList from "@/components/Services/RecommendedList";

import { ServicesBannerData } from "@/constants/Banner";
import { NEARBY_DATA, RECOMMENDED_DATA } from "@/constants/services";
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
  Home: undefined;
  Services: undefined;
};

type ServicesNavProp = BottomTabNavigationProp<TabParamList, "Services">;

// --- animation constants (same as product.tsx) ---

const FADING_PART_HEIGHT = 80;
const SEARCHBAR_HEIGHT = 60;
const CATEGORY_LIST_HEIGHT = 60;
const EXTRA_PIN_OFFSET = 10;
const HEADER_SCROLL_DISTANCE = FADING_PART_HEIGHT + EXTRA_PIN_OFFSET;
const TOTAL_HEADER_HEIGHT =
  FADING_PART_HEIGHT + SEARCHBAR_HEIGHT + CATEGORY_LIST_HEIGHT + 5;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Services() {
  const router = useRouter();
  const navigation = useNavigation<ServicesNavProp>();
  const isFocused = useIsFocused();
  const setPreset = useCategoryTheme((s) => s.setThemePreset);
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  const [notificationCount, setNotificationCount] = useState(0);

  // set theme preset for services
  useFocusEffect(
    useCallback(() => {
      setPreset("blue");
      const t = setTimeout(() => setNotificationCount(4), 800);
      return () => clearTimeout(t);
    }, [setPreset])
  );

  // --- scroll / reanimated ---

  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const listRef = useRef<FlatList<ContentSectionItem> | null>(null);
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  useEffect(() => {
    const unsub = navigation.addListener("tabPress", () => {
      if (isFocused) {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        setRefreshKey(Date.now());
      }
    });
    return unsub;
  }, [navigation, isFocused]);

  // --- sections in services list (like product contentSections) ---

  const contentSections = [
    { id: "banner", type: "banner" as const },
    { id: "nearby", type: "nearby" as const },
    { id: "recommended", type: "recommended" as const },
  ];
  type ContentSectionItem = (typeof contentSections)[number];

  const nearbyPreview = NEARBY_DATA.slice(0, 3);
  const recommendedPreview = RECOMMENDED_DATA.slice(0, 3);

  const handleServicePress = useCallback(
    (item: { id: string | number; title?: string }) => {
      router.push({
        pathname: "/Services/serviceDetails",
        params: {
          id: String(item.id),
          title: item.title ?? "",
          imageKey: String(item.id),
        },
      });
    },
    [router]
  );

  const renderContentSection = ({
    item,
  }: ListRenderItemInfo<ContentSectionItem>) => {
    switch (item.type) {
      case "banner":
        return (
          <View className="mt-4">
            <PromoBannerCarousel variant="home" data={ServicesBannerData} />
          </View>
        );

      case "nearby":
        return (
          <View className="mt-4">
            <NearbyList
              title="Near by You"
              data={nearbyPreview}
              largeMode={false}
              imageAspect={1.25}
              overlapRatio={0.52}
              onItemPress={handleServicePress}
              onActionPress={() => {
                const payload = encodeURIComponent(JSON.stringify(NEARBY_DATA));
                router.push(
                  `/Services/NearbyAll?items=${payload}&title=${encodeURIComponent(
                    "Near by You"
                  )}`
                );
              }}
            />
          </View>
        );

      case "recommended":
        return (
          <View className="mt-4 px-3 pb-8">
            <RecommendedList
              data={recommendedPreview}
              onItemPress={handleServicePress}
              onActionPress={() => {
                const payload = encodeURIComponent(
                  JSON.stringify(RECOMMENDED_DATA)
                );
                router.push(
                  `/Services/RecommendedAll?items=${payload}&title=${encodeURIComponent(
                    "Recommended For You"
                  )}`
                );
              }}
            />
          </View>
        );

      default:
        return null;
    }
  };

  // --- animated styles (same shell as product.tsx) ---

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

  // --- render ---

  return (
    <View className="flex-1 bg-gray-50">
      {/* 1. SERVICES FLATLIST (same structure as ProductHome) */}
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

      {/* 2. ANIMATED HEADER (same as product.tsx) */}
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
            colors={["#E0DBFF", "#f9fafb"]} // bluish for services
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
            {/* if HomeHeader supports count, pass it; otherwise remove prop */}
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
            onPress={() => router.push("/Searchscreen?tab=service")}
            activeOpacity={0.8}
            className="mt-3 px-3"
          >
            <SearchBar
              placeholder="Search Services"
              readOnly
              borderRadius={10}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* 3. PINNED CATEGORY LIST (same as product pinned tabs) */}
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
        <CategoryList
          orientation="horizontal"
          scrollOffset={scrollOffset}
          scrollDistance={HEADER_SCROLL_DISTANCE}
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
