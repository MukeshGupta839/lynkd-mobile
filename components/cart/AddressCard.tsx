import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function AddressCard() {
  return (
    <View className="bg-white mt-3 rounded-xl overflow-hidden">
      <View className="px-5 py-3">
        <View className="flex-row items-center">
          <View className="w-5 h-5 rounded-md bg-black items-center justify-center mr-3">
            <Ionicons name="paper-plane" size={12} color="#fff" />
          </View>
          <Text className="text-sm font-semibold">HOME</Text>
        </View>

        <View className="mt-2">
          <Text className="text-xs text-gray-500">
            Electronic City Phase 2, Infosys Office Gate 1., 3rd Building,
            Bengaluru, 560100
          </Text>
          <Text className="text-xs font-semibold mt-1">+91 9876923456</Text>
          <TouchableOpacity className="">
            <Text className="text-xs text-blue-600">Change</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
