// app/(tabs)/ProductHome.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

function GradientWrapper({
  children,
  colors = ["#C5F8CE", "#ffffff"] as const,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  className = "rounded-b-3xl overflow-hidden",
}: {
  children?: React.ReactNode;
  colors?: readonly [string, string]; // tuple required by expo-linear-gradient types
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

  // ensure ProductHome uses the green preset when mounted (Option 1)
  const setPreset = useCategoryTheme((s) => s.setThemePreset);
  useFocusEffect(
    useCallback(() => {
      setPreset("green");
      // no cleanup here — ProductHome will set green on focus (or you can restore if preferred)
      return () => {};
    }, [setPreset])
  );
  // Data array for FlatList - each item represents a section
  const contentSections = [
    { id: "categories", type: "categories" },
    { id: "banner", type: "banner" },
    { id: "bestProducts", type: "bestProducts" },
    { id: "bestDeals", type: "bestDeals" },
    { id: "topDeals", type: "topDeals" },
  ];

  // Render function for each FlatList item
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
          <View className="mt-4 ">
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
      {/* Rounded gradient header with safe area INSIDE */}
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#C5F8CE", "#f9fafb"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden">
          <SafeAreaView edges={["top"]} className="px-3 py-1">
            <HomeHeader />
            <QuickActions />
            <TouchableOpacity
              onPress={() => router.push("/Searchscreen?tab=product")}
              activeOpacity={0.8}
              className="mt-3">
              <SearchBar placeholder="Search" readOnly />
            </TouchableOpacity>
          </SafeAreaView>
        </GradientWrapper>
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        <FlatList
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
