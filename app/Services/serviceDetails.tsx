// app/service/serviceDetails.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FeaturesCard from "@/components/Productview/FeaturesCard";
import ReviewsCard from "@/components/Productview/ReviewsCard";
import HeroHeader from "@/components/Services/HeroHeader";
import {
  reviewsData as SERVICE_REVIEWS_DATA,
  reviewsSummary as SERVICE_REVIEWS_SUMMARY,
} from "@/constants/review";
import { NEARBY_DATA, RECOMMENDED_DATA } from "@/constants/services";
import { AirVent, Car, DoorClosed, Utensils } from "lucide-react-native";

const FALLBACK_IMAGE = require("@/assets/images/kfc.png");

export default function ServiceDetails() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const {
    id: idParam,
    title: titleParam,
    imageKey,
  } = useLocalSearchParams<{
    id?: string;
    title?: string;
    imageKey?: string;
  }>();

  const id = String(idParam ?? imageKey ?? titleParam ?? "");

  const item = useMemo(() => {
    const all = [...(NEARBY_DATA ?? []), ...(RECOMMENDED_DATA ?? [])];
    return all.find((it: any) => String(it.id) === String(id)) ?? null;
  }, [id]);

  const heroImage =
    (item as any)?.image ??
    NEARBY_DATA?.[0]?.image ??
    RECOMMENDED_DATA?.[0]?.image ??
    FALLBACK_IMAGE;

  const title = (item as any)?.title ?? titleParam ?? "Service";
  const address =
    "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC";

  const description =
    (item as any)?.description ??
    "Short description about this service goes here. Replace with your real data.";
  const rating = (item as any)?.rating ?? 4.6;

  const features = [
    { icon: <Car size={22} color="white" />, label: "Car Parking" },
    { icon: <AirVent size={22} color="white" />, label: "AC/NON-AC" },
    { icon: <DoorClosed size={22} color="white" />, label: "Private Cabins" },
    { icon: <Utensils size={22} color="white" />, label: "Waiter" },
  ];

  // responsive hero image height derived from width
  const imageHeight = Math.round(width * 0.65);

  // summary card used as a normal card below the hero (NOT overlapped)
  const summaryCard = (
    <View
      className="bg-white rounded-2xl p-4"
      style={{
        // inline shadow only
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-gray-900">{title}</Text>
          <Text className="text-xs text-gray-500 mt-1">{address}</Text>

          <View className="mt-3">
            <View className="px-2 py-1 rounded-md bg-blue-50 self-start">
              <Text className="text-xs text-blue-700 font-semibold">
                Now Open -{" "}
                <Text className="text-xs text-gray-700 font-semibold">
                  Closes At 10:00PM
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View className="items-end">
          <View className="px-3 py-2 rounded-full bg-[#1B19A8] min-w-[64px] items-center justify-center">
            <Text className="text-white font-semibold">
              {rating.toFixed(1)} ★
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* HeroHeader - default (no overlap) */}
      <HeroHeader
        heroSource={heroImage}
        imageWidth={width}
        imageHeight={imageHeight}
        title={title}
        address={address}
        rating={rating}
        overlapCard={true} // explicit: no overlap here
        onBack={() => router.back()}
        onRightPress={() => {}}
        rightIconName="cart"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={["left", "right", "bottom"]} className="px-3 pt-4">
          {/* Summary card placed normally BELOW the hero image */}
          <View className="mt-4 z-10">{summaryCard}</View>

          {/* Description card */}
          <View
            className="bg-white rounded-2xl px-3 mt-4"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}>
            <Text className="text-lg font-bold text-gray-700 mt-3 leading-6">
              Description
            </Text>
            <Text className="text-sm text-gray-700 pr-3 pb-3 leading-6">
              {description}
            </Text>
          </View>

          {/* FEATURES CARD */}
          <View className="mt-4">
            <FeaturesCard source="service" />
          </View>

          {/* Reviews */}
          <View className="mt-4 mb-6">
            <ReviewsCard
              summary={SERVICE_REVIEWS_SUMMARY}
              reviews={SERVICE_REVIEWS_DATA}
              showAll={false}
              onViewMore={() => router.push("/")}
              showAvatar={true}
              showPhotos={false}
              containerPaddingPercent={5}
            />
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="absolute left-0 right-0 bottom-4 px-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => {
              if (item?.id) {
                router.push({
                  pathname: "/Services/BookingTable",
                  params: { id: String(item.id) },
                });
              }
            }}
            className="flex-1 ml-3 rounded-xl items-center justify-center h-14 bg-[#1B19A8] mb-1">
            <Text className="text-white font-semibold text-lg">Book Table</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
