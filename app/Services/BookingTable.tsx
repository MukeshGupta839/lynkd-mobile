// app/Services/BookingTable.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import HeroHeader from "@/components/Services/HeroHeader";
import { NEARBY_DATA, RECOMMENDED_DATA } from "@/constants/services";

const SAMPLE_DATES = [
  { day: "Mon", date: "2" },
  { day: "Tue", date: "3" },
  { day: "Wed", date: "4" },
  { day: "Thu", date: "5" },
  { day: "Fri", date: "6" },
  { day: "Sat", date: "7" },
];

const SAMPLE_TIMES = [
  "10:30 am",
  "11:00 am",
  "12:00 pm",
  "01:30 pm",
  "04:00 pm",
  "05:00 pm",
  "05:30 pm",
  "06:00 pm",
  "07:00 pm",
  "07:10 pm",
  "07:30 pm",
  "08:00 pm",
  "08:30 pm",
  "09:00 pm",
  "09:30 pm",
];

export default function BookingTable() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const id = String(idParam ?? "");
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const service = useMemo(() => {
    const all = [...(NEARBY_DATA ?? []), ...(RECOMMENDED_DATA ?? [])] as any[];
    return all.find((s) => String(s.id) === id) ?? null;
  }, [id]);

  const imageHeight = Math.round(width * 0.65);

  const title = service?.title ?? "Service";
  const address =
    "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC";
  const heroSource = service?.image ?? require("@/assets/images/kfc.png");

  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(0);
  // ← default time set to first available time
  const [selectedTime, setSelectedTime] = useState<string | null>(
    SAMPLE_TIMES[0]
  );
  const [vehicle, setVehicle] = useState<"car" | "bike" | "none">("car");

  const onNext = useCallback(() => {
    const payload = {
      id,
      title,
      address,
      date: SAMPLE_DATES[selectedDateIdx],
      time: selectedTime, // can be null if user clears later
      vehicle,
    };
    router.push({
      pathname: "/Services/PersonalDetails",
      params: { payload: JSON.stringify(payload) },
    });
  }, [id, title, address, selectedDateIdx, selectedTime, vehicle, router]);

  // date item renderer for horizontal FlatList
  const renderDate = ({
    item,
    index,
  }: {
    item: { day: string; date: string };
    index: number;
  }) => {
    const selected = index === selectedDateIdx;
    return (
      <TouchableOpacity
        onPress={() => setSelectedDateIdx(index)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.day} ${item.date}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="mx-2 items-center justify-center w-12 h-16">
        <View
          className={`w-full h-full items-center justify-center rounded-xl border ${
            selected
              ? "bg-[#1B19A8] border-transparent"
              : "bg-white border-gray-100"
          }`}>
          <Text
            className={`text-xs ${selected ? "text-white" : "text-gray-500"}`}>
            {item.day}
          </Text>
          <Text
            className={`mt-1 font-semibold ${selected ? "text-white" : "text-gray-700"}`}>
            {item.date}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // time item renderer for 3-column FlatList
  const renderTime = ({ item, index }: { item: string; index: number }) => {
    const selected = selectedTime === item;
    return (
      <View className="w-1/3 px-2 mb-3">
        <TouchableOpacity
          onPress={() => setSelectedTime(item)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`Select time ${item}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View
            className={`h-12 rounded-xl items-center justify-center ${
              selected
                ? "bg-[#1B19A8] border-transparent"
                : "bg-white border border-gray-200"
            }`}>
            <Text
              className={`text-sm ${selected ? "text-white" : "text-gray-700"}`}>
              {item}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // calendar pill as footer (visual-only; no action)
  const DateListFooter = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        /* intentionally left empty — no action required per request */
      }}
      className="mx-2 w-12 h-16 items-center justify-center rounded-xl">
      <View className="w-full h-full items-center justify-center rounded-xl bg-white border border-gray-100">
        <Ionicons name="calendar" size={20} color="#374151" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <HeroHeader
        heroSource={heroSource}
        imageWidth={Math.round(width)}
        imageHeight={imageHeight}
        title={title}
        address={address}
        rating={service?.rating ?? 4.6}
        onBack={() => router.back()}
        onRightPress={() => {}}
        rightIconName="cart"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={["left", "right"]} className="px-4 pt-4">
          {/* Pickup Date (horizontal FlatList) */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Pickup Date
            </Text>

            <View
              className="bg-white rounded-2xl p-3 overflow-visible"
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
              }}>
              <FlatList
                data={SAMPLE_DATES}
                horizontal
                keyExtractor={(_, i) => String(i)}
                renderItem={renderDate}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  alignItems: "center",
                  paddingHorizontal: 8,
                }}
                initialNumToRender={6}
                windowSize={2}
                removeClippedSubviews={true}
                ListFooterComponent={DateListFooter}
              />
            </View>
          </View>

          {/* Pickup Time (3-column FlatList) */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Pickup Time
            </Text>

            <View
              className="bg-white rounded-2xl p-3 overflow-visible"
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
              }}>
              <FlatList
                data={SAMPLE_TIMES}
                keyExtractor={(t, i) => String(i)}
                renderItem={renderTime}
                numColumns={3}
                scrollEnabled={false} // parent ScrollView handles vertical scroll
                initialNumToRender={9}
                windowSize={5}
                removeClippedSubviews={true}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              />
            </View>
          </View>

          {/* Vehicle Type */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Vehicle Type
            </Text>

            <View
              className="bg-white rounded-2xl py-3 flex-row"
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
              }}>
              {[
                { type: "car", icon: "car", label: "Car" },
                { type: "bike", icon: "bicycle", label: "Bike" },
                { type: "none", icon: "close", label: "None" },
              ].map((v) => {
                const isSelected = vehicle === v.type;
                return (
                  <TouchableOpacity
                    key={v.type}
                    onPress={() => setVehicle(v.type as any)}
                    activeOpacity={0.9}
                    className="flex-1 items-center">
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? "bg-[#1B19A8]" : "bg-gray-100"}`}
                      style={
                        isSelected
                          ? {
                              shadowColor: "#000",
                              shadowOpacity: 0.12,
                              shadowRadius: 8,
                              shadowOffset: { width: 0, height: 4 },
                              elevation: 6,
                            }
                          : {}
                      }>
                      <Ionicons
                        name={v.icon as any}
                        size={20}
                        color={isSelected ? "#fff" : "#9CA3AF"}
                      />
                    </View>
                    <Text
                      className={`text-sm mt-2 ${isSelected ? "text-gray-900" : "text-gray-800"}`}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Sticky Next button */}
      <View className="absolute bottom-6 left-0 right-0 px-4">
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.95}
          className="w-full h-14 rounded-xl items-center justify-center bg-[#1B19A8]">
          <Text className="text-white font-semibold text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
