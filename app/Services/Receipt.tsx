// app/Services/Receipt.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { NEARBY_DATA, RECOMMENDED_DATA } from "@/constants/services";

function getTransactionId(id: string) {
  const codes = [...id].map((c) => c.charCodeAt(0).toString(36)).join("");
  const part = (codes + "000000").slice(0, 8).toUpperCase();
  const suffix = (id.length * 1234).toString(16).slice(-4).toUpperCase();
  return `HR${part}${suffix}`;
}

function getDummyBooking(id: string) {
  const rec = RECOMMENDED_DATA.find((r) => String(r.id) === String(id));
  const nearby = NEARBY_DATA.find((n) => String(n.id) === String(id));

  return {
    title: rec?.title ?? nearby?.title ?? "Booking",
    subtitle: rec?.subtitle ?? nearby?.distance ?? "",
    date: "Aug 11, 2025 | 09 : 30 am",
    arriving: "AUG 22, 2025 | 05 : 30 pm",
    tableNumber: "Table Number 03",
    totalMembers: "Total Members 04",
    paymentMethod: "Google Pay",
    advance: "Rs 1,000",
    txId: getTransactionId(id ?? "unknown"),
  };
}

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // responsive QR size: scale with screen width but clamp to reasonable range
  const qrSize = useMemo(() => {
    const pct = Math.round(width * 0.55); // ~55% of screen width
    return Math.max(140, Math.min(260, pct)); // clamp between 140 and 260
  }, [width]);

  const booking = useMemo(() => getDummyBooking(id ?? "unknown"), [id]);

  const qrUri = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(
        booking.txId
      )}`,
    [booking.txId, qrSize]
  );

  const onDownload = useCallback(() => {
    Alert.alert(
      "Download",
      "Download E-Receipt (implement export/download logic)"
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header (flat — no shadow) */}
      <View className="w-full border-b border-gray-100 bg-white">
        <View className="px-4 py-3">
          <View className="relative items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="absolute left-0 w-8 h-8 items-center justify-center">
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>

            <Text className="text-lg font-bold text-gray-900">E-RECEIPT</Text>

            <View className="absolute right-0 w-8 h-8" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* QR area - responsive size */}
        <View className="px-6 pt-8 items-center">
          <Image
            source={{ uri: qrUri }}
            style={{ width: qrSize, height: qrSize }}
            accessibilityLabel="QR Code"
          />
        </View>

        {/* Info rows rendered directly (no white card, no shadow) */}
        <View className="px-4 mt-6">
          {/* first group */}
          <View className="pb-3">
            {[
              ["Booking Date", booking.date],
              ["Arriving Date & Time", booking.arriving],
              ["Table Number", booking.tableNumber],
              ["Total Members", booking.totalMembers],
            ].map(([label, value]) => (
              <View
                key={label}
                className="flex-row items-center justify-between py-3">
                {/* large pill-like label */}
                <View className=" px-3 bg-purple-100 rounded-3xl">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: "#5233FF" }}>
                    {label}
                  </Text>
                </View>
                <Text className="text-sm text-gray-800">{value}</Text>
              </View>
            ))}
          </View>

          {/* thin divider (keeps visual grouping but still flat) */}
          <View className="border-t border-gray-100" />

          {/* second group */}
          <View className="pt-4 pb-6">
            {[
              ["Payment Methods", booking.paymentMethod],
              ["Advance Payment", booking.advance],
              ["Date", "Aug 11, 2025, 11:19 pm"],
            ].map(([label, value]) => (
              <View
                key={label}
                className="flex-row items-center justify-between py-3">
                <View className="px-3 bg-purple-100 rounded-3xl">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: "#5233FF" }}>
                    {label}
                  </Text>
                </View>
                <Text className="text-sm text-gray-800">{value}</Text>
              </View>
            ))}

            {/* Transaction ID row (decorative icon) */}
            <View className="flex-row items-center justify-between py-3">
              <View className="px-3 bg-purple-100 rounded-3xl">
                <Text
                  className="text-base font-semibold"
                  style={{ color: "#5233FF" }}>
                  Transaction ID
                </Text>
              </View>

              <View className="flex-row items-center">
                <Text className="text-sm text-gray-800 ">{booking.txId}</Text>
                <View className="p-1">
                  <Ionicons name="copy-outline" size={18} color="#5233FF" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Download button (flat) */}
      <View className="absolute left-0 right-0 bottom-5 px-4">
        <TouchableOpacity
          onPress={onDownload}
          accessibilityRole="button"
          accessibilityLabel="Download e-receipt"
          className="w-full rounded-2xl py-4 items-center justify-center bg-[#2b21b8]">
          <Text className="text-white text-base font-semibold">
            Download E-Receipt
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
