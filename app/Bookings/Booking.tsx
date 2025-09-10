// app/Bookings/[id].tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNavBar from "@/components/Bookings/BottomBar";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

export default function BookingsEventDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params?.id ?? "";

  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);

  const event = useMemo<EventT | undefined>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS].find((e) => e.id === id);
  }, [id]);

  // if event not found, go back (avoid leaving broken route)
  if (!event) {
    router.replace("/bookings");
    return null;
  }

  const { title, image, price, dateLabel, location, category, isLive } = event;

  // only certain categories support live
  const liveCategories = ["club", "music", "sport"];
  const isLiveApplicable = !!(
    isLive &&
    category &&
    liveCategories.includes(category)
  );

  // Handlers (keep routing logic inside the screen)
  const handleWatchLive = () => {
    // navigate to a live player screen (replace with your actual route)
    // use string href to avoid strict expo-router pathname typing issues
    // router.push(`/LivePlayer?id=${encodeURIComponent(id)}`);
  };

  const handleBook = () => {
    router.push(`/Bookings/BookingForm?id=${encodeURIComponent(id)}`);
  };

  return (
    // Root: keep background gray so card contrast appears clearly
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* HERO: image fills the very top, and extends into the notch (no top safe area reserved) */}
        <View className="w-full">
          <View className="w-full aspect-[11/9] relative">
            {image ? (
              <Image
                source={image}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gray-200" />
            )}

            {/* soft white fade at bottom of hero so content card feels connected */}
            <View className="absolute left-0 right-0 bottom-0 h-[36%]">
              <LinearGradient
                colors={["transparent", "rgba(255,255,255,0.98)"]}
                start={{ x: 0.5, y: 0.3 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1 }}
              />
            </View>

            {/* top controls: place inside a SafeAreaView overlay so buttons respect notch */}
            <SafeAreaView
              edges={["top"]}
              className="absolute inset-x-0 top-0 px-4">
              <View className="flex-row justify-between items-center py-3">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="bg-white/80 w-10 h-10 rounded-full items-center justify-center"
                  activeOpacity={0.85}>
                  <Ionicons name="chevron-back" size={20} color="#111827" />
                </TouchableOpacity>

                <View className="flex-row items-center space-x-3">
                  <TouchableOpacity
                    className="bg-white/80 w-10 h-10 rounded-full items-center justify-center"
                    activeOpacity={0.85}>
                    <Feather name="share-2" size={18} color="#7952FC" />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>

            {/* category pill placed near bottom-left of hero + optional LIVE badge */}
            {category ? (
              <View className="absolute left-4 bottom-6 flex-row items-center space-x-3">
                <View className="flex-row items-center bg-[#8554F5] px-3 py-1.5 rounded-full shadow-sm">
                  <View className="mr-2">
                    {category === "music" && (
                      <Ionicons name="musical-notes" size={14} color="#fff" />
                    )}
                    {category === "club" && (
                      <Ionicons name="star" size={14} color="#fff" />
                    )}
                    {category === "sport" && (
                      <Ionicons name="basketball" size={14} color="#fff" />
                    )}
                    {category === "festival" && (
                      <Ionicons name="sparkles" size={14} color="#fff" />
                    )}
                  </View>
                  <Text className="text-xs text-white font-semibold">
                    {category}
                  </Text>
                </View>

                {isLiveApplicable ? (
                  <View className="bg-red-600 px-3 py-1 rounded-full items-center justify-center">
                    <Text className="text-xs font-semibold text-white">
                      LIVE
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* CONTENT: white card-like section starts below hero (visible clearly on gray bg) */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 160 }}
          className="flex-1"
          showsVerticalScrollIndicator={false}>
          <View className="mt-4 px-4">
            {/* Title */}
            <Text className="text-lg font-bold text-[#0F172A]">{title}</Text>

            {/* Info cards row — single white card with dividers */}
            <View className="mt-4 bg-white rounded-2xl shadow-sm flex-row items-stretch">
              {/* Price */}
              <View className="flex-1 items-center justify-center py-4">
                <View className="flex-row items-center space-x-1">
                  <Ionicons name="pricetag" size={14} color="#7C3AED" />
                  <Text className="text-xs text-gray-500"> Price</Text>
                </View>
                <Text className="mt-1 font-semibold text-[#7C3AED]">
                  {price ?? "Free"}
                </Text>
              </View>

              {/* Divider */}
              <View className="w-px bg-gray-200 my-3" />

              {/* Date */}
              <View className="flex-1 items-center justify-center py-4">
                <View className="flex-row items-center space-x-1">
                  <Ionicons name="calendar" size={14} color="#7C3AED" />
                  <Text className="text-xs text-gray-500"> Date</Text>
                </View>
                <Text className="mt-1 font-semibold text-[#7C3AED]">
                  {dateLabel ?? "-"}
                </Text>
              </View>

              {/* Divider */}
              <View className="w-px bg-gray-200 my-3" />

              {/* Location */}
              <View className="flex-1 items-center justify-center py-4">
                <View className="flex-row items-center space-x-1">
                  <Ionicons name="location" size={14} color="#7C3AED" />
                  <Text className="text-xs text-gray-500"> Location</Text>
                </View>
                <Text className="mt-1 font-semibold text-[#7C3AED]">
                  {location ?? "-"}
                </Text>
              </View>
            </View>

            {/* Organizer */}
            <View className="mt-5 flex-row items-center">
              {/* Avatar circle with icon */}
              <View className="w-12 h-12 rounded-full bg-violet-600 items-center justify-center">
                <Ionicons name="person" size={22} color="white" />
              </View>

              {/* Text info */}
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-[#111827]">
                  Michael De Santa
                </Text>
                <Text className="text-sm text-gray-400">Organizer</Text>
              </View>
            </View>

            {/* About */}
            <View className="mt-6">
              <Text className="font-semibold text-base text-[#111827] mb-3">
                About this event:
              </Text>

              <Text className="text-gray-600 text-sm leading-relaxed">
                {expanded
                  ? `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`
                  : `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...`}
              </Text>

              <TouchableOpacity
                onPress={() => setExpanded((s) => !s)}
                className="mt-2">
                <Text className="text-sm text-violet-600 underline font-medium">
                  {expanded ? "Show less" : "Read more"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Location / map */}
            <View className="mt-6">
              {/* Title + value */}
              <Text className="font-semibold text-sm text-[#111827] mb-1">
                Location:
              </Text>
              <View>
                <Text className="text-sm text-gray-500 mb-3">
                  {location ?? "-"}
                </Text>
              </View>

              {/* Map placeholder */}
              <View className="w-full h-40 rounded-2xl bg-gray-100 overflow-hidden items-center justify-center relative">
                {/* fake map background (replace with MapView later) */}
                <Text className="text-gray-300">Map placeholder</Text>

                {/* purple pin marker */}
                <View className="absolute">
                  <Ionicons name="location" size={28} color="#7C3AED" />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM BAR */}
        <View className="mb-3">
          <BottomNavBar
            liked={liked}
            onToggleLike={() => setLiked((s) => !s)}
            ctaLabel={isLiveApplicable ? "Watch Live" : "Booking Ticket"}
            onCTAPress={isLiveApplicable ? handleWatchLive : handleBook}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
