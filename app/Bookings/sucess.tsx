// app/book/success.tsx
import BottomNavBar from "@/components/Bookings/BottomBar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; amount?: string }>();
  const id = params?.id;
  const amount = params?.amount;

  const onPress = () => {
    // navigate to success screen (create app/book/success.tsx)
    router.push({
      pathname: "/(tabs)/bookingsTickets",
    });
  };
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        {/* subtle decorative arcs (printed using rounded views) */}
        <View className="absolute -top-36 -left-36 w-80 h-80 rounded-full bg-gray-100 opacity-70" />
        <View className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gray-50 opacity-60" />

        {/* icon circle */}
        <View className="w-36 h-36 rounded-2xl overflow-hidden items-center justify-center mb-6">
          <LinearGradient
            colors={["#1f1233", "#7C3AED"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
            }}>
            <View className="w-20 h-20 rounded-full bg-white items-center justify-center">
              <Ionicons name="checkmark" size={36} color="#7C3AED" />
            </View>
          </LinearGradient>
        </View>

        <Text className="text-lg font-semibold text-[#111827] ">
          Payment Success!
        </Text>
        <Text className="text-sm text-gray-400 text-center px-6">
          {amount ? `You paid $${Number(amount).toFixed(2)}.` : ""}
          {"\n"}Please check your ticket in the My Ticket menu.
        </Text>
      </View>
      {/* bottom button */}
      <BottomNavBar
        variant="buttonOnly"
        ctaLabel="Check Ticket"
        onCTAPress={onPress}
      />
    </SafeAreaView>
  );
}
