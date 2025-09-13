// app/Search.tsx
import SearchBar from "@/components/Searchbar";
import {
  allBookings,
  allProducts,
  allServices,
  recentBookingIds,
  recentSearchIds,
  recentServiceIds,
} from "@/constants/Search";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabKey = "product" | "service" | "booking";

export default function SearchPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tab = ((params?.tab as TabKey) || "product") as TabKey;
  const [search, setSearch] = useState("");

  // Configure dataset & behavior per tab
  const config = useMemo(() => {
    if (tab === "service") {
      return {
        items: allServices,
        recentIds: recentServiceIds,
        placeholder: "Search Services",
        headerGradient: ["#E5E0FF", "#FFFFFF"] as const,
        matcher: (item: any, q: string) =>
          (
            (item.title ?? "") +
            " " +
            (item.category ?? "") +
            " " +
            (item.tag ?? "")
          )
            .toLowerCase()
            .includes(q),
        labelOf: (item: any) => item.title,
        imageOf: (item: any) => item.image,
        gradientOf: (item: any) => item.gradient,
        onPress: (item: any) => {},
      };
    }
    if (tab === "booking") {
      return {
        items: allBookings,
        recentIds: recentBookingIds,
        placeholder: "Search Bookings",
        headerGradient: ["#E5EOFF", "#FFFFFF"] as const,
        matcher: (item: any, q: string) =>
          (
            (item.title ?? "") +
            " " +
            (item.category ?? "") +
            " " +
            (item.status ?? "")
          )
            .toLowerCase()
            .includes(q),
        labelOf: (item: any) => item.title ?? item.category,
        imageOf: (item: any) => item.image,
        gradientOf: (item: any) => item.gradient,
        onPress: (item: any) => {},
      };
    }

    // default: product
    return {
      items: allProducts,
      recentIds: recentSearchIds,
      placeholder: "Search Mobile",
      headerGradient: ["#C4FFCA", "#FFFFFF"] as const,
      matcher: (item: any, q: string) =>
        ((item.name ?? "") + " " + (item.category ?? ""))
          .toLowerCase()
          .includes(q),
      labelOf: (item: any) => item.name,
      imageOf: (item: any) => item.image,
      gradientOf: (item: any) => item.gradient,
      onPress: (item: any) => {},
    };
  }, [tab, router]);

  // recent items derived by matching ids in config.recentIds
  const recentItems = config.items.filter((item: any) =>
    config.recentIds.includes(item.id)
  );

  const filteredItems =
    search.trim().length > 0
      ? config.items.filter((item: any) =>
          config.matcher(item, search.toLowerCase())
        )
      : [];

  return (
    <>
      {/* 🔹 Header gradient is now dynamic */}
      <LinearGradient
        colors={config.headerGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="w-full rounded-b-2xl">
        <SafeAreaView edges={["top"]} className="bg-transparent">
          <View className="flex-row items-center px-[5%] py-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={22} color="black" />
            </TouchableOpacity>
            <View className="flex-1">
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={config.placeholder}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView
        edges={["left", "right", "bottom"]}
        className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1 px-[3%] mt-4"
          contentContainerStyle={{ paddingBottom: 40 }}>
          {search.trim().length === 0 ? (
            <>
              {/* Recent search header */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold">Recent Search</Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log("Clear recent for tab:", tab);
                  }}>
                  <Text className="text-xs text-green-500">Clear all</Text>
                </TouchableOpacity>
              </View>

              {/* Recent list */}
              {recentItems.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => config.onPress(item)}
                  className="w-full flex-row items-center bg-white rounded-full px-3 py-2 mb-3">
                  <LinearGradient
                    colors={config.gradientOf(item)}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    className="w-[12%] aspect-square rounded-full items-center justify-center mr-3">
                    <Image
                      source={config.imageOf(item)}
                      className="w-[60%] h-[70%]"
                      resizeMode="contain"
                    />
                  </LinearGradient>

                  <View className="flex-1 flex-row items-center justify-between">
                    <Text className="text-base font-medium" numberOfLines={1}>
                      {config.labelOf(item)}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="black"
                      style={{ transform: [{ rotate: "-45deg" }] }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {/* Filtered Results */}
              {filteredItems.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => config.onPress(item)}
                  className="w-full flex-row items-center bg-white rounded-full px-3 py-2 mb-3">
                  <LinearGradient
                    colors={config.gradientOf(item)}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    className="w-[12%] aspect-square rounded-full items-center justify-center mr-3">
                    <Image
                      source={config.imageOf(item)}
                      className="w-[60%] h-[70%]"
                      resizeMode="contain"
                    />
                  </LinearGradient>

                  <View className="flex-1 flex-row items-center justify-between">
                    <Text className="text-sm font-medium" numberOfLines={1}>
                      {config.labelOf(item)}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="black"
                      style={{ transform: [{ rotate: "-45deg" }] }}
                    />
                  </View>
                </TouchableOpacity>
              ))}

              {/* No results */}
              {filteredItems.length === 0 && (
                <View className="mt-6 items-center">
                  <Text className="text-sm text-gray-500">
                    No results found
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
