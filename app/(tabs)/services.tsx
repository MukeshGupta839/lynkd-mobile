// app/(tabs)/services.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HomeHeader from "@/components/Product/HomeHeader";
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";

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

export default function Services() {
  const router = useRouter();

  // keep behavior simple here — CategoryList manages its own active state;
  // if you need the selected category in this screen, change CategoryList to accept onChange callback.
  return (
    <View className="flex-1 bg-gray-50">
      {/* Rounded gradient header with safe area INSIDE */}
      <View className="w-full rounded-b-2xl overflow-hidden">
        <GradientWrapper
          colors={["#E0DBFF", "#f9fafb"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-b-2xl overflow-hidden">
          <SafeAreaView edges={["top"]} className="px-3 pb-2">
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
    </View>
  );
}
