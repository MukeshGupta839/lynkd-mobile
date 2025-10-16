import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Banner from "@/components/Product/BannerCarousel";
import BestDealsGrid from "@/components/Product/BestDealsGrid";
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import CategoryList from "@/components/Product/CategoryList";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import DealsStrip from "@/components/Product/TopDealsSection";
import SearchBar from "@/components/Searchbar";

// local fallbacks
import { homeBannerData } from "@/constants/Banner";
import { bestDeals as fallbackBestDeals } from "@/constants/BestDeals";
import { topDeals as fallbackTopDeals } from "@/constants/Deal";
import { products as fallbackProducts } from "@/constants/Product";

import { useCategoryTheme } from "@/stores/useThemeStore";

// ✅ updated import
import { useProductDetail } from "@/hooks/useCatalog";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type TabParamList = { Home: undefined; Services: undefined };
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

export default function ProductHome() {
  const router = useRouter();
  const navigation = useNavigation<ProductNavProp>();
  const isFocused = useIsFocused();
  const setPreset = useCategoryTheme((s) => s.setThemePreset);

  const [notificationCount, setNotificationCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setPreset("green");
      const t = setTimeout(() => setNotificationCount(8), 300);
      return () => clearTimeout(t);
    }, [setPreset])
  );

  // 🟩 Call single product API here
  const productId = 1; // <-- replace with any valid product ID from your backend
  const { data, loading, error, refresh } = useProductDetail(productId);

  const bestProductsData = data ? [data] : fallbackProducts;

  const listRef = useRef<FlatList<any> | null>(null);
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

  const contentSections = [
    { id: "categories", type: "categories" as const },
    { id: "banner", type: "banner" as const },
    { id: "bestProducts", type: "bestProducts" as const },
    { id: "bestDeals", type: "bestDeals" as const },
    { id: "topDeals", type: "topDeals" as const },
  ];

  const renderContentSection = ({
    item,
  }: {
    item: (typeof contentSections)[number];
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
          />
        );

      case "topDeals":
        return <DealsStrip title="Top Deals" data={fallbackTopDeals as any} />;

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#C5F8CE", "#f9fafb"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}>
          <View className="px-3 py-1">
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

      <View className="flex-1 bg-gray-50">
        <FlatList
          key={String(refreshKey)}
          ref={listRef}
          data={contentSections}
          renderItem={renderContentSection}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 70 }}
          removeClippedSubviews
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={50}
          initialNumToRender={3}
          windowSize={5}
        />
      </View>
    </View>
  );
}
