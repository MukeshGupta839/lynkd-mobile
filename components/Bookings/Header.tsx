import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function BookingHeader({ title = "" }: { title?: string }) {
  const router = useRouter();

  // iOS + Android shadow
  const shadowOnly = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  };

  return (
    <View style={shadowOnly} className="bg-white rounded-b-2xl">
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>

        <Text className="ml-3 text-lg font-semibold text-[#111827]">
          {title}
        </Text>
      </View>
    </View>
  );
}
