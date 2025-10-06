import { useIsFocused, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ---------- Type your tab navigator routes ----------
type TabParamList = {
  Home: undefined;
  ProductHome?: undefined;
  Services?: undefined;
  Bookings?: undefined;
  // add other tabs if needed
};

type HomeNavProp = BottomTabNavigationProp<TabParamList, "Home">;

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
      className={`w-full ${className}`}>
      {children}
    </LinearGradient>
  );
}

export default function Home() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);

  const navigation = useNavigation<HomeNavProp>();
  const isFocused = useIsFocused();

  // lightweight refresh (forces remount)
  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());

  // when home tab is tapped again, scroll to top + refresh
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Rounded gradient header with safe area INSIDE */}
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#bcb9ffff", "#ffffffff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden">
          <SafeAreaView edges={["top"]} className="px-3 py-1">
            <HomeHeader />
            <QuickActions />
            <TouchableOpacity
              onPress={() => router.push("/Searchscreen")}
              activeOpacity={0.8}
              className="mt-3">
              <SearchBar placeholder="Search" readOnly />
            </TouchableOpacity>
          </SafeAreaView>
        </GradientWrapper>
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        <ScrollView
          key={String(refreshKey)} // lightweight remount on refresh
          ref={scrollRef}
          className="flex-1"
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: 0 }}
          contentContainerStyle={{ paddingBottom: 70 }}>
          <View className="mt-4">
            <TouchableOpacity
              onPress={() => router.push("/Product/Productview")}
              activeOpacity={0.8}>
              {/* You can add a preview or banner here if needed */}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
