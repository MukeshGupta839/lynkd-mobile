// app/book/success.tsx
import BottomNavBar from "@/components/Bookings/BottomBar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; amount?: string }>();
  const amount = params?.amount;

  const onPress = useCallback(() => {
    router.push({
      pathname: "/(tabs)/bookingsTickets",
    });
  }, [router]);

  // Inline shadow styles only (kept minimal)
  const bigArcShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  };

  const smallArcShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  };

  const iconShadow = {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        {/* decorative arcs (tailwind sizing; shadow inline) */}
        <View
          className="absolute -top-36 -left-36 w-80 h-80 rounded-full bg-gray-100 opacity-70"
          style={bigArcShadow}
          pointerEvents="none"
        />
        <View
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gray-50 opacity-60"
          style={smallArcShadow}
          pointerEvents="none"
        />

        {/* icon circle */}
        <View
          className="w-36 h-36 rounded-2xl overflow-hidden items-center justify-center mb-6"
          style={iconShadow}>
          <LinearGradient
            colors={["#1f1233", "#7C3AED"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            className="w-full h-full items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-white items-center justify-center">
              <Ionicons name="checkmark" size={36} color="#7C3AED" />
            </View>
          </LinearGradient>
        </View>

        <Text className="text-lg font-semibold text-[#111827]">
          Payment Success!
        </Text>

        <Text className="text-sm text-gray-400 text-center px-6 mt-2">
          {amount ? `You paid $${Number(amount).toFixed(2)}.` : ""}
          {"\n"}Please check your ticket in the My Ticket menu.
        </Text>
      </View>

      <BottomNavBar
        variant="buttonOnly"
        ctaLabel="Check Ticket"
        onCTAPress={onPress}
        // ensure BottomNavBar uses accessibilityLabel internally
      />
    </SafeAreaView>
  );
}
