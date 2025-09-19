// app/(tabs)/services.tsx
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import PromoBannerCarousel from "@/components/Product/BannerCarousel";
import CategoryList from "@/components/Product/CategoryList";
import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";
import NearbyList from "@/components/Services/NearbyList";
import RecommendedList from "@/components/Services/RecommendedList";
import { ServicesBannerData } from "@/constants/Banner";
import { RECOMMENDED_DATA } from "@/constants/services";
import { useCategoryTheme } from "@/stores/useThemeStore";

const NEARBY_DATA = [
  {
    id: "kfc",
    title: "KFC",
    distance: "250 Meters Away",
    image: require("@/assets/images/kfc.png"),
  },
  {
    id: "hotel",
    title: "Five Star Hotel",
    distance: "350 Meters Away",
    image: require("@/assets/images/hotel.png"),
  },
  {
    id: "dominos",
    title: "Domino's",
    distance: "300 Meters Away",
    image: require("@/assets/images/dominos.png"),
  },
];

function GradientWrapper({
  children,
  colors = ["#C5F8CE", "#ffffff"] as const,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  className = "rounded-b-3xl",
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

export default function Services() {
  const router = useRouter();
  const setPreset = useCategoryTheme((s) => s.setThemePreset);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setPreset("blue");
    }, [setPreset])
  );

  const handleItemPress = useCallback(
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

  const ListHeader = useMemo(
    () => (
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#E0DBFF", "#f9fafb"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden">
          <SafeAreaView edges={["top"]} className="px-3 py-1">
            <HomeHeader />
            <QuickActions />
            <TouchableOpacity
              onPress={() => router.push("/Searchscreen?tab=service")}
              activeOpacity={0.8}
              className="mt-3 ">
              <SearchBar placeholder="Search Services" readOnly />
            </TouchableOpacity>
          </SafeAreaView>
        </GradientWrapper>
      </View>
    ),
    [router]
  );

  const contentContainerStyle = { paddingBottom: insets.bottom + 40 };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={[]}
        ListHeaderComponent={
          <View>
            {ListHeader}
            <View className="mt-3">
              <CategoryList orientation="horizontal" />
            </View>

            <View className="mt-4">
              <PromoBannerCarousel variant="home" data={ServicesBannerData} />
            </View>

            <View className="mt-4">
              <NearbyList
                title="Near by You"
                data={NEARBY_DATA}
                largeMode={false}
                imageAspect={1.25}
                overlapRatio={0.52}
                onItemPress={handleItemPress}
              />
            </View>

            <View className="mt-4 px-3">
              <RecommendedList
                data={RECOMMENDED_DATA}
                onItemPress={handleItemPress}
              />
            </View>
          </View>
        }
        renderItem={null}
        keyExtractor={() => "services-root"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        // 👇 disable stretch/bounce here
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
}
