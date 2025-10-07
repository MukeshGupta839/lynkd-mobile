import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";

import Banner from "@/components/Product/BannerCarousel";
import BestDealsGrid from "@/components/Product/BestDealsGrid";
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import CategoryList from "@/components/Product/CategoryList";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import DealsStrip from "@/components/Product/TopDealsSection";
import SearchBar from "@/components/Searchbar";
import { homeBannerData } from "@/constants/Banner";
import { bestDeals } from "@/constants/BestDeals";
import { topDeals } from "@/constants/Deal";
import { products } from "@/constants/Product";
import { useCategoryTheme } from "@/stores/useThemeStore";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ---------- Type the bottom tab navigator routes here ----------
type TabParamList = {
  Home: undefined;
  Services: undefined;
  // add other tabs if you have them
};
type ProductNavProp = BottomTabNavigationProp<TabParamList, "Home">;

function GradientWrapper({
  children,
  colors = ["#C5F8CE", "#ffffff"] as const,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  className = "rounded-b-3xl overflow-hidden",
}: {
  children?: React.ReactNode;
  colors?: readonly [string, string];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      className={`w-full ${className}`}>
      {children}
    </LinearGradient>
  );
}

const ProductHome = () => {
  const router = useRouter();
  const navigation = useNavigation<ProductNavProp>();
  const isFocused = useIsFocused();
  const setPreset = useCategoryTheme((s) => s.setThemePreset);

  // ✅ Dynamic notification count
  const [notificationCount, setNotificationCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setPreset("green");

      // Simulate fetching notifications (replace with API later)
      setTimeout(() => {
        setNotificationCount(8); // dynamic example value
      }, 1000);

      return () => {};
    }, [setPreset])
  );

  // FlatList ref and refresh key for lightweight refresh
  const listRef = useRef<FlatList<any> | null>(null);
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  // scroll-to-top + refresh when home tab pressed again
  useEffect(() => {
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
    return unsubscribe;
  }, [navigation, isFocused]);

  // -----------------------
  // FlatList content
  // -----------------------
  const contentSections = [
    { id: "categories", type: "categories" },
    { id: "banner", type: "banner" },
    { id: "bestProducts", type: "bestProducts" },
    { id: "bestDeals", type: "bestDeals" },
    { id: "topDeals", type: "topDeals" },
  ];

  const renderContentSection = ({
    item,
  }: {
    item: (typeof contentSections)[0];
  }) => {
    switch (item.type) {
      case "categories":
        return <CategoryList orientation="horizontal" />;

      case "banner":
        return (
          <View className="mt-4">
            <Banner
              variant="home"
              data={homeBannerData}
              onSlidePress={() => router.push("/Product/Productview")}
            />
          </View>
        );

      case "bestProducts":
        return (
          <BestProductsCarousel data={products} title="Best Products for you" />
        );

      case "bestDeals":
        return <BestDealsGrid title="Best Deals for you" data={bestDeals} />;

      case "topDeals":
        return <DealsStrip title="Top Deals" data={topDeals} />;

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#C5F8CE", "#f9fafb"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden">
          <View className="px-3 py-1">
            {/* ✅ pass dynamic count to HomeHeader */}
            <HomeHeader count={notificationCount} />

            <QuickActions />
            <TouchableOpacity
              onPress={() => router.push("/Searchscreen?tab=product")}
              activeOpacity={0.8}
              className="mt-3">
              <SearchBar placeholder="Search" readOnly />
            </TouchableOpacity>
          </View>
        </GradientWrapper>
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        <FlatList
          key={String(refreshKey)} // remounts on refresh
          ref={listRef}
          data={contentSections}
          renderItem={renderContentSection}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: 0 }}
          contentContainerStyle={{ paddingBottom: 70 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={50}
          initialNumToRender={3}
          windowSize={5}
        />
      </View>
    </View>
  );
};

export default ProductHome;
