import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PromoBanner from "@/components/Product/BannerCarousel";
import CategoryList from "@/components/Product/CategoryList";
import QuickActions from "@/components/Product/QuickActions";
import DealsStrip from "@/components/Product/TopDealsSection";
import SearchBar from "@/components/Searchbar";

// 🔹 brand data moved to constants
import { popularPhones } from "@/constants/Deal";
import { popularBrands } from "@/constants/popularBrand";

export default function CategoriesScreen() {
  const [contentW, setContentW] = useState(0);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Top gradient (no header) */}
      <LinearGradient
        colors={["#C5F8CE", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="w-full rounded-b-2xl"
      >
        <SafeAreaView edges={["top"]}>
          <View className="px-4 py-3">
            <QuickActions />
            <SearchBar className="mt-3" />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Text className="px-4 py-3 text-base font-bold">All Categories</Text>

      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: 0 }}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        <View className="flex-row">
          <View className="w-[24%] rounded-tr-lg rounded-br-lg border-r border-gray-200 py-4 px-5 bg-white">
            <ScrollView showsVerticalScrollIndicator={false}>
              <CategoryList orientation="vertical" activeDefault="Mobiles" />
            </ScrollView>
          </View>
          <View className="flex-1 pl-2">
            <View
              className="mr-4"
              onLayout={(e) => setContentW(e.nativeEvent.layout.width)}
            >
              {contentW > 0 && (
                <PromoBanner
                  variant="categories"
                  containerWidthPx={contentW}
                  cardPercentOfContainer={1}
                />
              )}
            </View>

            <View className="mt-4">
              <Text className="px-4 text-base font-bold">Popular Brands</Text>

              {/* 4-up responsive grid */}
              <View className="flex-row flex-wrap mt-2">
                {popularBrands.map((b, i) => (
                  <View key={i} className="w-1/4 items-center mb-5">
                    {/* Circle ≈47px on a 390px layout; scales with container */}
                    <LinearGradient
                      colors={b.colors}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      className="w-[65%] aspect-square rounded-full items-center justify-center border border-white/60"
                    >
                      <Image
                        source={b.logo}
                        resizeMode="contain"
                        className="w-[58%] aspect-square"
                      />
                    </LinearGradient>

                    <Text
                      className="mt-1 text-xs text-gray-700 w-[85%] text-center"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {b.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Popular Phones Section */}
            <DealsStrip title="Popular Phones" data={popularPhones} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
