// app/Bookings/[id].tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNavBar from "@/components/Bookings/BottomBar";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

export default function BookingsEventDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params?.id ?? "";

  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);

  // ---------- Find event ----------
  const event = useMemo<EventT | undefined>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS].find((e) => e.id === id);
  }, [id]);

  if (!event) {
    router.replace("/bookings");
    return null;
  }

  const { title, image, price, dateLabel, location, category, isLive } = event;

  const liveCategories = ["club", "music", "sport"];
  const isLiveApplicable = !!(
    isLive &&
    category &&
    liveCategories.includes(category)
  );

  // ---------- Handlers ----------
  const handleGoBack = useCallback(() => router.back(), [router]);

  const handleShare = useCallback(() => {
    console.log("Share:", title);
  }, [title]);

  const handleWatchLive = useCallback(() => {
    console.log("Watch live:", id);
    // router.push(`/LivePlayer?id=${encodeURIComponent(id)}`);
  }, [id]);

  const handleBook = useCallback(() => {
    router.push(`/Bookings/BookingForm?id=${encodeURIComponent(id)}`);
  }, [id, router]);

  const toggleExpand = useCallback(() => setExpanded((p) => !p), []);
  const toggleLike = useCallback(() => setLiked((p) => !p), []);

  // ---------- Detail content ----------
  const renderDetailContent = () => (
    <View className="px-3">
      {/* Title */}
      <Text className="text-lg font-bold text-[#0F172A]">{title}</Text>

      {/* Info row */}
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
        <View className="w-12 h-12 rounded-full bg-violet-600 items-center justify-center">
          <Ionicons name="person" size={22} color="white" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-[#111827]">Michael De Santa</Text>
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
            ? `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
            : `Lorem ipsum dolor sit amet, consectetur adipiscing elit...`}
        </Text>
        <TouchableOpacity onPress={toggleExpand} className="mt-2">
          <Text className="text-sm text-violet-600 underline font-medium">
            {expanded ? "Show less" : "Read more"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location / map */}
      <View className="mt-6 mb-4">
        <Text className="font-semibold text-sm text-[#111827] mb-1">
          Location:
        </Text>
        <Text className="text-sm text-gray-500 mb-3">{location ?? "-"}</Text>

        <View className="w-full h-40 rounded-2xl bg-gray-100 overflow-hidden items-center justify-center relative">
          <Text className="text-gray-300">Map placeholder</Text>
          <View className="absolute">
            <Ionicons name="location" size={28} color="#7C3AED" />
          </View>
        </View>
      </View>
    </View>
  );

  // ---------- UI ----------
  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <FlatList
        data={[{ key: "detail" }]}
        renderItem={renderDetailContent}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 160 }}
        ListHeaderComponent={
          // Hero section is now part of scroll
          <View className="w-full">
            <View className="w-full aspect-[11/9] relative">
              {image ? (
                <Image
                  source={image}
                  className="w-full h-full"
                  resizeMode="cover"
                  accessibilityLabel={`${title} banner image`}
                />
              ) : (
                <View className="w-full h-full bg-gray-200" />
              )}

              {/* gradient overlay */}
              <View className="absolute left-0 right-0 bottom-0 h-[36%]">
                <LinearGradient
                  colors={["transparent", "rgba(255,255,255,0.98)"]}
                  start={{ x: 0.5, y: 0.3 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ flex: 1 }}
                />
              </View>

              {/* top buttons */}
              <SafeAreaView
                edges={["top"]}
                className="absolute inset-x-0 top-0 px-3">
                <View className="flex-row justify-between items-center py-1">
                  <TouchableOpacity
                    onPress={handleGoBack}
                    className="bg-white/80 w-10 h-10 rounded-full items-center justify-center"
                    activeOpacity={0.85}>
                    <Ionicons name="chevron-back" size={20} color="#111827" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleShare}
                    className="bg-white/80 w-10 h-10 rounded-full items-center justify-center"
                    activeOpacity={0.85}>
                    <Feather name="share-2" size={18} color="#7952FC" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              {/* category pill + live badge */}
              {category ? (
                <View className="absolute left-4 bottom-6 flex-row items-center space-x-3">
                  <View className="flex-row items-center bg-[#8554F5] px-3 py-1.5 rounded-full shadow-sm">
                    <Text className="text-xs text-white font-semibold">
                      {category}
                    </Text>
                  </View>
                  {isLiveApplicable && (
                    <View className="bg-red-600 px-3 py-1 rounded-full items-center justify-center">
                      <Text className="text-xs font-semibold text-white">
                        LIVE
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        }
      />

      {/* Bottom bar stays fixed */}
      <View className="mb-3">
        <BottomNavBar
          liked={liked}
          onToggleLike={toggleLike}
          ctaLabel={isLiveApplicable ? "Watch Live" : "Booking Ticket"}
          onCTAPress={isLiveApplicable ? handleWatchLive : handleBook}
        />
      </View>
    </SafeAreaView>
  );
}
