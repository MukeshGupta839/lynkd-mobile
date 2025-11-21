import { useIsFocused, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Header pieces (same as product.tsx)
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ⬇️ Reanimated
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ---------- Type your tab navigator routes ----------
type TabParamList = {
  Home: undefined;
  ProductHome?: undefined;
  Services?: undefined;
  Bookings?: undefined;
};

type HomeNavProp = BottomTabNavigationProp<TabParamList, "Home">;

// --- Animation constants (mirroring product.tsx) ---

const FADING_PART_HEIGHT = 80; // Header top (QuickActions + HomeHeader)
const SEARCHBAR_HEIGHT = 60; // Search bar block
const CATEGORY_LIST_HEIGHT = 60; // Not used here, but keep for TOTAL_HEADER_HEIGHT parity
const EXTRA_PIN_OFFSET = 10;

// Distance over which header animates
const HEADER_SCROLL_DISTANCE = FADING_PART_HEIGHT + EXTRA_PIN_OFFSET;

// Total header height (same formula as product.tsx)
const TOTAL_HEADER_HEIGHT =
  FADING_PART_HEIGHT + SEARCHBAR_HEIGHT + CATEGORY_LIST_HEIGHT + 5;

export default function Pay() {
  const router = useRouter();
  const navigation = useNavigation<HomeNavProp>();
  const isFocused = useIsFocused();
  const { top: topInset } = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView | null>(null);

  // ✅ Dynamic notification count (same logic as others)
  const [notificationCount, setNotificationCount] = useState(0);

  // Simulate fetching notifications or unseen updates dynamically
  useEffect(() => {
    if (isFocused) {
      const t = setTimeout(() => {
        setNotificationCount(10); // Example: update from backend later
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isFocused]);

  // lightweight refresh (forces remount)
  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());

  // when home/pay tab is tapped again, scroll to top + refresh
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      if (isFocused) {
        try {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } catch {
          // ignore
        }
        setRefreshKey(Date.now());
      }
    });
    return unsubscribe;
  }, [navigation, isFocused]);

  // ---------- Reanimated scroll state ----------
  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // ---------- Animated header styles (same shell as product.tsx) ----------

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
            [0, -HEADER_SCROLL_DISTANCE], // 0 → -90
            "clamp"
          ),
        },
      ],
    };
  });

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

  // ---------- Render ----------
  return (
    <View className="flex-1 bg-gray-50">
      {/* 1. SCROLLABLE CONTENT (goes under the floating header) */}
      <AnimatedScrollView
        key={String(refreshKey)}
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: 0 }}
        contentContainerStyle={{
          paddingBottom: 70,
          paddingTop: TOTAL_HEADER_HEIGHT + topInset, // same pattern as product.tsx
        }}
      >
        {/* 👉 Your pay content goes here (placeholder now) */}
        <View className="mt-4 px-3">
          <TouchableOpacity
            onPress={() => router.push("/Product/Productview")}
            activeOpacity={0.8}
          >
            {/* TODO: Replace with Pay banners / shortcuts / etc */}
          </TouchableOpacity>
        </View>
      </AnimatedScrollView>

      {/* 2. ANIMATED HEADER (same behavior as ProductHome) */}
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
        {/* Gradient background layer */}
        <Animated.View
          style={[styles.headerBg, animatedGradientWrapper]}
          pointerEvents="none"
        >
          <AnimatedLinearGradient
            colors={["#bcb9ff", "#ffffff"]} // your Pay gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Fading area: QuickActions + HomeHeader */}
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
            {/* If HomeHeader supports a `count` prop, pass notificationCount */}
            <HomeHeader />
          </View>
        </Animated.View>

        {/* Search bar that slides up & pins */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: FADING_PART_HEIGHT + topInset, // below fading part
              left: 0,
              right: 0,
            },
            animatedSearchBar,
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push("/Searchscreen")}
            activeOpacity={0.8}
            className="mt-3 px-3"
          >
            <SearchBar placeholder="Search" readOnly borderRadius={10} />
          </TouchableOpacity>
        </Animated.View>
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
    backgroundColor: "#bcb9ff", // fallback while gradient animates
  },
});
