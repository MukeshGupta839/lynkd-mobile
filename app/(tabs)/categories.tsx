import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Banner from "@/components/Product/BannerCarousel";
import CategoryList from "@/components/Product/CategoryList";
import DealsStrip from "@/components/Product/TopDealsSection";

// 🔹 brand data moved to constants
import { CategoriesBannerData } from "@/constants/Banner";
import { popularPhones } from "@/constants/Deal";
import { popularBrands } from "@/constants/popularBrand";
import { useRouter } from "expo-router";
import { Search, ShoppingCart } from "lucide-react-native";

const CategoriesScreen = () => {
  const router = useRouter();
  const { top: topInset } = useSafeAreaInsets();
  const [contentW, setContentW] = useState(0);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: topInset - 10 }}>
      {/* Top gradient (no header) */}
      {/* <LinearGradient
        colors={["#C5F8CE", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="w-full rounded-b-2xl"
      >
        <View style={{ paddingTop: topInset - 10 }}>
          <View className="px-3 py-3">
            <QuickActions />
            <SearchBar className="mt-3" />
          </View>
        </View>
      </LinearGradient> */}

      <View className="flex-row items-center justify-between px-3 py-3">
        <Text className="text-base font-bold">All Categories</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => router.push("/Searchscreen?tab=product")}
          >
            <Search size={20} strokeWidth={2} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <ShoppingCart size={20} strokeWidth={2} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-row flex-1">
        <View className="border-r border-gray-200 bg-white">
          <CategoryList orientation="vertical" activeDefault="Mobiles" />
        </View>

        <View className="flex-1">
          <ScrollView
            className="flex-1"
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: 0 }}
            contentContainerStyle={{ paddingBottom: 70 }}
            // Improve horizontal gesture handling for nested Banner
            directionalLockEnabled={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              onLayout={(e) => setContentW(e.nativeEvent.layout.width)}
              style={{
                // Ensure touch events are properly handled for Banner
                overflow: "hidden",
              }}
            >
              {contentW > 0 && (
                <Banner
                  variant="categories"
                  data={CategoriesBannerData}
                  containerWidthPx={contentW} // Use full width, no margin subtraction
                  cardPercentOfContainer={1.0}
                  onSlidePress={() => router.push("/Product/Productview")}
                />
              )}
            </View>

            <View className="mt-4">
              <Text className="px-4 text-lg font-bold">Popular Brands</Text>

              {/* 4-up responsive grid */}
              <View className="flex-row flex-wrap mt-2">
                {popularBrands.map((b, i) => (
                  <View key={i} className="w-1/4 items-center mb-5">
                    <LinearGradient
                      colors={b.colors}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      <Image
                        source={b.logo}
                        resizeMode="contain"
                        style={{
                          width: 35,
                          height: 35,
                        }}
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
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default CategoriesScreen;
