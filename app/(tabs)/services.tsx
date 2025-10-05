// app/(tabs)/services.tsx
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
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
import { NEARBY_DATA, RECOMMENDED_DATA } from "@/constants/services";
import { useCategoryTheme } from "@/stores/useThemeStore";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type TabParamList = {
  Services: undefined;
  Home: undefined;
};

type ServicesNavProp = BottomTabNavigationProp<TabParamList, "Services">;

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

  // show only first 3 items on the home screen
  const nearbyPreview = NEARBY_DATA.slice(0, 3);
  const recommendedPreview = RECOMMENDED_DATA.slice(0, 3);

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
      <View className="w-full rounded-b-2xl overflow-hidden ">
        <GradientWrapper
          colors={["#E0DBFF", "#f9fafb"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden">
          <SafeAreaView edges={["top"]} className="px-3  py-1">
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

  // -------------------------
  // refs & refresh behavior
  // -------------------------
  const scrollRef = useRef<ScrollView | null>(null);
  const navigation = useNavigation<ServicesNavProp>();
  const isFocused = useIsFocused();

  // refreshKey toggles to force a lightweight re-render of the ScrollView content
  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());

  // when tab is pressed while focused, scroll to top and trigger refresh
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
      if (isFocused) {
        try {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } catch {
          // ignore scroll errors
        }
        // simple refresh: toggle refresh key so the ScrollView content can remount
        setRefreshKey(Date.now());
      }
    });

    return unsubscribe;
  }, [navigation, isFocused]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        // key forces a remount when refreshKey changes (lightweight refresh)
        key={String(refreshKey)}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        bounces={false}
        overScrollMode="never">
        {/* Header + content */}
        {ListHeader}

        <View className="mt-3">
          <CategoryList orientation="horizontal" />
        </View>

        <View className="mt-4">
          <PromoBannerCarousel variant="home" data={ServicesBannerData} />
        </View>

        {/* Nearby preview (only 3 items shown here) */}
        <View className="mt-4 ">
          <NearbyList
            title="Near by You"
            data={nearbyPreview}
            largeMode={false}
            imageAspect={1.25}
            overlapRatio={0.52}
            onItemPress={handleItemPress}
            onActionPress={() => {
              const payload = encodeURIComponent(JSON.stringify(NEARBY_DATA));
              router.push(
                `/Services/NearbyAll?items=${payload}&title=${encodeURIComponent(
                  "Near by You"
                )}`
              );
            }}
          />
        </View>

        {/* Recommended preview (only 3 items shown here) */}
        <View className="mt-4 px-3 pb-8">
          <RecommendedList
            data={recommendedPreview}
            onItemPress={handleItemPress}
            onActionPress={() => {
              const payload = encodeURIComponent(
                JSON.stringify(RECOMMENDED_DATA)
              );
              router.push(
                `/Services/RecommendedAll?items=${payload}&title=${encodeURIComponent(
                  "Recommended For You"
                )}`
              );
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
