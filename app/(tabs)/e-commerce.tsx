import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
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

function GradientWrapper({
  children,
  colors = ["#C5F8CE", "#ffffff"],
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  className = "rounded-b-3xl overflow-hidden",
}: {
  children?: React.ReactNode;
  colors?: [string, string];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      className={`w-full ${className}`}
    >
      {children}
    </LinearGradient>
  );
}

export default function Home() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Rounded gradient header with safe area INSIDE */}
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#C5F8CE", "#f9fafb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden"
        >
          <SafeAreaView edges={["top"]} className="px-3 pb-2">
            <HomeHeader />
            <QuickActions />
            <TouchableOpacity
              onPress={() => router.push("/Searchscreen")}
              activeOpacity={0.8}
              className="mt-3"
            >
              <SearchBar placeholder="Search" readOnly />
            </TouchableOpacity>
          </SafeAreaView>
        </GradientWrapper>
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: 0 }}
          contentContainerStyle={{ paddingBottom: 70 }}
        >
          {/* Categories */}
          <CategoryList orientation="horizontal" />
          <View className="mt-4">
            <Banner
              variant="home"
              data={homeBannerData}
              onSlidePress={() => router.push("/Product/Productview")}
            />
          </View>
          {/* Best Products (moved to reusable component) */}
          <BestProductsCarousel data={products} title="Best Products for you" />

          {/* Best Deals */}
          <BestDealsGrid title="Best Deals for you" data={bestDeals} />

          <DealsStrip title="Top Deals" data={topDeals} />
        </ScrollView>
      </View>
    </View>
  );
}
