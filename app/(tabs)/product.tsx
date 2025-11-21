import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from "react-native";
// ⬇️ 1. IMPORT REANIMATED
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Banner from "@/components/Product/BannerCarousel";
import BestDealsGrid from "@/components/Product/BestDealsGrid";
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import CategoryList from "@/components/Product/CategoryList";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import DealsStrip from "@/components/Product/TopDealsSection";
import SearchBar from "@/components/Searchbar";

import { homeBannerData } from "@/constants/Banner";
import { bestDeals as fallbackBestDeals } from "@/constants/BestDeals";
import { topDeals as fallbackTopDeals } from "@/constants/Deal";
import { products as fallbackProducts } from "@/constants/Product";

import { useProductDetail } from "@/hooks/useCatalog";
import { useCategoryTheme } from "@/stores/useThemeStore";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ⬇️ 2. CREATE ANIMATED FLATLIST
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type TabParamList = { Home: undefined; Services: undefined };
type ProductNavProp = BottomTabNavigationProp<TabParamList, "Home">;

// ⬇️ 3. DEFINE ANIMATION CONSTANTS
// These are approximate heights. You can fine-tune them.
const FADING_PART_HEIGHT = 80; // Was 90
const SEARCHBAR_HEIGHT = 60; // Approx height of SearchBar + its padding
const CATEGORY_LIST_HEIGHT = 60; // Approx height of CategoryList
const EXTRA_PIN_OFFSET = 10;
// The total distance we'll animate over
const HEADER_SCROLL_DISTANCE = FADING_PART_HEIGHT + EXTRA_PIN_OFFSET; // 👈 AFTER (80 + 10 = 90)
// The total height of the header when fully expanded
const TOTAL_HEADER_HEIGHT =
  FADING_PART_HEIGHT + SEARCHBAR_HEIGHT + CATEGORY_LIST_HEIGHT + 5;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function ProductHome() {
  const router = useRouter();
  const navigation = useNavigation<ProductNavProp>();
  const isFocused = useIsFocused();
  const setPreset = useCategoryTheme((s) => s.setThemePreset);
  const { top: topInset } = useSafeAreaInsets();

  const [notificationCount, setNotificationCount] = useState(0);

  // ⬇️ 4. SETUP REANIMATED VALUES
  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  useFocusEffect(
    useCallback(() => {
      setPreset("green");
      const t = setTimeout(() => setNotificationCount(8), 300);
      return () => clearTimeout(t);
    }, [setPreset])
  );

  const productId = 1;
  const { data, loading, error, refresh } = useProductDetail(productId);
  const bestProductsData = data ? [data] : fallbackProducts;

  const listRef = useRef<FlatList<ContentSectionItem> | null>(null);
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  useEffect(() => {
    const unsub = navigation.addListener("tabPress", () => {
      if (isFocused) {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        refresh();
        setRefreshKey(Date.now());
      }
    });
    return unsub;
  }, [navigation, isFocused, refresh]);

  // ⬇️ 5. REMOVE 'categories' FROM THE LIST DATA
  const contentSections = [
    // { id: "categories", type: "categories" as const }, // <-- REMOVED
    { id: "banner", type: "banner" as const },
    { id: "bestProducts", type: "bestProducts" as const },
    { id: "bestDeals", type: "bestDeals" as const },
    { id: "topDeals", type: "topDeals" as const },
  ];

  type ContentSectionItem = (typeof contentSections)[number];

  const handleBestDealPress = (item: any, index: number) => {
    if (index === 0) {
      router.push({
        pathname: "/Product/Productview",
        params: { type: "clothing" },
      });
      return;
    }
    const typeFromItem =
      (item?.type as "phone" | "facewash" | "clothing" | undefined) ?? "phone";
    router.push({
      pathname: "/Product/Productview",
      params: { type: typeFromItem },
    });
  };

  const renderContentSection = ({
    item,
  }: ListRenderItemInfo<ContentSectionItem>) => {
    switch (item.type) {
      // case "categories": // <-- REMOVED
      //   return <CategoryList orientation="horizontal" />;

      case "banner":
        return (
          <View className="mt-4">
            <Banner
              variant="home"
              data={homeBannerData}
              onSlidePress={() =>
                router.push({
                  pathname: "/Product/Productview",
                })
              }
            />
          </View>
        );

      case "bestProducts":
        // ... (rest of your cases)
        if (loading) {
          return (
            <View className="px-3 py-4">
              <ActivityIndicator />
            </View>
          );
        }
        return (
          <>
            {error && (
              <Text className="px-3 text-red-600 mb-1">
                {error} (showing fallback)
              </Text>
            )}
            <BestProductsCarousel
              data={bestProductsData as any}
              title="Best Product for you"
            />
          </>
        );

      case "bestDeals":
        return (
          <BestDealsGrid
            title="Best Deals for you"
            data={fallbackBestDeals as any}
            onItemPress={handleBestDealPress}
          />
        );

      case "topDeals":
        return <DealsStrip title="Top Deals" data={fallbackTopDeals as any} />;

      default:
        return null;
    }
  };

  // ⬇️ 6. DEFINE ANIMATED STYLES
  const animatedFadingPart = useAnimatedStyle(() => {
    return {
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
    };
  });

  const animatedSearchBar = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, HEADER_SCROLL_DISTANCE],
            // [0, -FADING_PART_HEIGHT - EXTRA_PIN_OFFSET], // 👈 BEFORE
            [0, -HEADER_SCROLL_DISTANCE], // 👈 AFTER (Moves from 0 to -90)
            "clamp"
          ),
        },
      ],
    };
  });

  const animatedGradientWrapper = useAnimatedStyle(() => ({
    height: interpolate(
      scrollOffset.value,
      [0, HEADER_SCROLL_DISTANCE], // 👈 AFTER (uses 90)
      [
        topInset + FADING_PART_HEIGHT + SEARCHBAR_HEIGHT,
        topInset + SEARCHBAR_HEIGHT - EXTRA_PIN_OFFSET, // 👈 (This was already correct)
      ],
      "clamp"
    ),
  }));

  const animatedCategoryList = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, HEADER_SCROLL_DISTANCE],
            // [0, -HEADER_SCROLL_DISTANCE - EXTRA_PIN_OFFSET - 10], // 👈 BEFORE
            [0, -HEADER_SCROLL_DISTANCE], // 👈 AFTER (Moves from 0 to -90)
            "clamp"
          ),
        },
      ],
    };
  });

  // ⬇️ 7. RE-STRUCTURE JSX WITH ANIMATED COMPONENTS
  return (
    <View className="flex-1 bg-gray-50">
      {/* 1. FLATLIST (in the back, with top padding) */}
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
          paddingBottom: 70,
          paddingTop: TOTAL_HEADER_HEIGHT + topInset,
        }}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        windowSize={5}
      />

      {/* 2. ANIMATED HEADER (floats on top) */}
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
          animatedGradientWrapper, // <-- Height animation is applied to this parent
        ]}
      >
        {/* ⬇️ FIX: The GradientWrapper is now a sibling, not a parent. */}
        {/* It's the background layer. */}
        <Animated.View
          style={[
            styles.headerBg, // absolute, clip, zIndex 0
            animatedGradientWrapper, // only height is animated
          ]}
          pointerEvents="none"
        >
          <AnimatedLinearGradient
            colors={["#C5F8CE", "#f9fafb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            // absolute fill avoids percent-height quirks on iOS
            style={[
              StyleSheet.absoluteFill,
              {
                // borderBottomLeftRadius: RADIUS,
                // borderBottomRightRadius: RADIUS,
              },
            ]}
          />
        </Animated.View>

        {/* ⬇️ Fading Part and Search Bar are ALSO siblings,
            layered ON TOP of the gradient. */}

        {/* Fading Part (absolute) */}
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
            <HomeHeader />
          </View>
        </Animated.View>

        {/* Search Bar (absolute, animates up) */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: FADING_PART_HEIGHT + topInset, // Positioned below the fading part
              left: 0,
              right: 0,
              // backgroundColor: "#000", // Needs a BG color
            },
            animatedSearchBar,
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push("/Searchscreen?tab=product")}
            activeOpacity={0.8}
            className="mt-3 px-3" // Padding is here
          >
            <SearchBar placeholder="Search..." readOnly borderRadius={10} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* 3. ANIMATED CATEGORY LIST (floats on top, below header) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: FADING_PART_HEIGHT + SEARCHBAR_HEIGHT + topInset, // Starts below searchbar
            left: 0,
            right: 0,
            zIndex: 9,
            // backgroundColor: "#000", // 👈 BEFORE
            backgroundColor: "#f9fafb", // 👈 AFTER (Matches gradient end)
            paddingTop: 5,
          },
          animatedCategoryList,
        ]}
      >
        <CategoryList
          orientation="horizontal"
          scrollOffset={scrollOffset} // <-- Pass scrollOffset
          scrollDistance={HEADER_SCROLL_DISTANCE} // <-- Pass distance
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
    zIndex: 0, // background layer
    overflow: "hidden",
    // borderBottomLeftRadius: RADIUS,
    // borderBottomRightRadius: RADIUS,
    backgroundColor: "#C5F8CE", // nice fallback while animating
  },
});
