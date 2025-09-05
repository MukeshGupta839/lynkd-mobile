import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Banner from "@/components/Product/BannerCarousel";
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import CategoryList from "@/components/Product/CategoryList";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import DealsStrip from "@/components/Product/TopDealsSection";
import SearchBar from "@/components/Searchbar";
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
    <LinearGradient colors={colors} start={start} end={end} className={`w-full ${className}`}>
      {children}
    </LinearGradient>
  );
}

/* ---------------- Deal Card (kept inline for "Best Deals") ---------------- */
function DealCard({
  name,
  subtitle,
  price,
  oldPrice,
  discount,
  image,
  badgeText,
  badgeColor = "bg-[#26FF91]",
  textColor = "text-black",
}: {
  name: string;
  subtitle?: string;
  price: string | number;
  oldPrice?: string | number;
  discount?: string;
  image: any;
  badgeText?: string;
  badgeColor?: string;
  textColor?: string;
}) {
  return (
    <View>
      <View className=" w-full relative items-center justify-center">
        {badgeText && (
          <View className={`absolute top-0 left-0 flex-row items-center justify-center px-2 py-1 rounded-full z-10 ${badgeColor}`}>
            <Text className={`font-semibold text-xxs ${textColor}`}>{badgeText}</Text>
          </View>
        )}
        <Image source={image} className="w-[90%] aspect-[0.89]" resizeMode="contain" />
      </View>

      <Text className="text-sm font-semibold truncate w-full" numberOfLines={1}>
        {name}
      </Text>
      {!!subtitle && (
        <Text className="text-xs w-full text-gray-500 truncate" numberOfLines={1}>
          {subtitle}
        </Text>
      )}

      <View className="flex-row items-end">
        <Text className="text-sm font-bold mr-2 flex-shrink-0">₹{price}</Text>
        {oldPrice && (
          <Text className="text-gray-400 text-xs line-through mr-2 flex-shrink-0">₹{oldPrice}</Text>
        )}
        {discount && <Text className="text-green-600 text-sm font-bold flex-shrink-0">{discount}</Text>}
      </View>
    </View>
  );
}

/* ---------------- Home Page ---------------- */
export default function Home() {
  const router = useRouter();
  
  return (
    <View className="flex-1 bg-gray-50">
      {/* Rounded gradient header with safe area INSIDE */}
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#C5F8CE", "#ffffffff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden"
        >
          <SafeAreaView edges={["top"]} className="px-4 py-2">
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
          <View className="px-4">
            <CategoryList orientation="horizontal" />
          </View>
<View className="mt-4">
         <TouchableOpacity onPress={() => router.push("/Product/Productview")}>
        <Banner variant="home" />
      </TouchableOpacity>
</View>
          {/* Best Products (moved to reusable component) */}
          <BestProductsCarousel data={products} />

          {/* Best Deals */}
          <View className="w-full p-3">
            <Text className="font-bold text-base px-2 mt-4 mb-2">Best Deals for you</Text>

            <View className="rounded-3xl overflow-hidden">
              <GradientWrapper
                colors={["#D0FFD4", "#ADF5D1"]}
                className="rounded-3xl overflow-hidden"
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View className="flex-row flex-wrap px-4 justify-between">
                  <View className="bg-white rounded-xl p-6 w-[48%] aspect-[0.82] mb-4 mt-5">
                    <DealCard
                      name="NIKE Shoe"
                      subtitle="Running Shoe For Men.."
                      price="10,999"
                      oldPrice="20,000"
                      discount="50%"
                      image={require("../../assets/images/Product/shoe.png")}
                      badgeText="Best Flash Deal"
                      badgeColor="bg-[#26FF91]"
                    />
                  </View>

                  <View className="bg-white rounded-xl p-6 w-[48%] aspect-[0.92] mb-4 mt-5">
                    <DealCard
                      name="Apple Ultra Watch"
                      subtitle="Accurate Measuring Your Health..."
                      price="39,999"
                      oldPrice="20,000"
                      discount="50%"
                      image={require("../../assets/images/Product/watch.png")}
                      badgeText="Only 1 left"
                      textColor="text-white"
                      badgeColor="bg-[#FF1616]"
                    />
                  </View>

                  <View className="bg-white rounded-xl p-6 w-[48%] aspect-[0.92] mb-4">
                    <DealCard
                      name="GOOGLE Pixel 9 Pro"
                      subtitle="8/512 GB , Black Space Color"
                      price="99,999"
                      oldPrice="20,000"
                      discount="50%"
                      image={require("../../assets/images/Product/Pixel9pro.png")}
                      badgeText="Best Flash Deal"
                      badgeColor="bg-[#26FF91]"
                    />
                  </View>

                  <View className="bg-white rounded-xl p-6 w-[48%] aspect-[0.92] mb-4">
                    <DealCard
                      name="Samsung Fridge"
                      subtitle="Accurate Measuring Your Health..."
                      price="39,999"
                      oldPrice="20,000"
                      discount="50%"
                      image={require("../../assets/images/Product/fridge.png")}
                      badgeText="LYNKD Choice"
                      badgeColor="bg-[#26FF91]"
                    />
                  </View>
                </View>
              </GradientWrapper>
            </View>
          </View>

          {/* Deals Strip */}
          <DealsStrip title="Top Deals" data={topDeals}/>

        </ScrollView>
      </View>
    </View>
  );
}
