// components/HomeHeader.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

// Badge background colors per tab
const BADGE_COLORS: Record<string, string> = {
  product: "#000000",
  services: "#1B19A8",
  bookings: "#B15CDE",
  pay: "#532ADB",
};

export default function HomeHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = useMemo(() => {
    if (pathname?.includes("/product")) return "product";
    if (pathname?.includes("/services")) return "services";
    if (pathname?.includes("/bookings")) return "bookings";
    if (pathname?.includes("/pay")) return "pay";
    return "product";
  }, [pathname]);

  return (
    <View className="w-full">
      {/* Row: left stacked (2 rows) + right bell (centered) */}
      <View className="w-full flex-row items-center py-1 ">
        {/* LEFT: stacked column (HOME row, address row) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/Address/selectAddress")}
          accessibilityRole="button"
          accessibilityLabel="Select address"
          className="flex-1">
          <View className="flex-col">
            {/* top: icon + HOME */}
            <View className="flex-row items-center">
              <View className="w-5 h-5 rounded-md bg-black items-center justify-center mr-3">
                <Ionicons name="paper-plane" size={12} color="#fff" />
              </View>

              <View className="flex-row items-center">
                <Text className="font-bold text-black text-base mr-1">
                  HOME
                </Text>
                <Ionicons name="chevron-down" size={12} color="black" />
              </View>
            </View>

            {/* bottom: address */}
            <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
              Electronic City Phase 1, Doddathogur Cross ..
            </Text>
          </View>
        </TouchableOpacity>

        {/* RIGHT: bell - vertically centered relative to left's stacked content */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/Notifications?tab=${activeTab}`)}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          className="ml-3">
          <View className="items-center justify-center">
            <View
              className="rounded-full items-center justify-center"
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#EDE8FD4D",
              }}>
              <MaterialCommunityIcons name="bell" size={22} color="#0F0F2D" />

              <View
                className="absolute items-center justify-center rounded-full"
                style={{
                  top: 4,
                  right: 4,
                  minWidth: 18,
                  minHeight: 18,
                  backgroundColor: BADGE_COLORS[activeTab],
                  borderWidth: 2,
                  borderColor: "#fff",
                  paddingHorizontal: 4,
                }}>
                <Text className="text-xs font-bold text-white">5</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
