// components/DeliveryDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import { Truck } from "lucide-react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type Address = {
  title: string;
  details: string;
};

type Props = {
  addresses: Address[];
  warrantyText: string;
  onCheckPin?: (pin: string) => void;
};

export default function DeliveryDetails({
  addresses,
  warrantyText,
  onCheckPin,
}: Props) {
  let pinCode = "";

  return (
    <View className="w-full bg-white rounded-2xl p-4">
      {/* Title */}
      <Text className="text-base font-semibold">Delivery Details</Text>

      {/* Pin Code + Check */}
      <View className="flex-row justify-between items-center w-full mt-3">
        <TextInput
          placeholder="Enter Pin Code"
          placeholderTextColor="#9CA3AF"
          className="flex-1 bg-gray-100 rounded-xl px-3 py-2 mr-3 text-sm text-gray-700"
        />
        <TouchableOpacity
          className="bg-[#26FF91] px-4 py-2 rounded-xl items-center justify-center"
        >
          <Text className="text-black font-medium">Check</Text>
        </TouchableOpacity>
      </View>

      {/* Super Fast Delivery */}
      <View className="mt-3 flex-row items-center bg-[#26FF91] px-3 py-1 rounded-full self-start">
        <Truck size={14} color="#000" />
        <Text className="ml-2 text-black font-bold text-xs">
          Super Fast Delivery in 1 Day
        </Text>
      </View>

      {/* Address List */}
      <View className="mt-3">
        {addresses.map((addr, idx) => (
          <View
            key={idx}
            className={`flex-row items-start bg-gray-100 rounded-xl p-3 ${
              idx < addresses.length - 1 ? "mb-3" : ""
            }`}
          >
            <Ionicons name="home" size={18} color="black" />
            <View className="ml-2">
              <Text className="font-semibold text-sm">{addr.title}</Text>
              <Text className="text-xs text-gray-600">{addr.details}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Warranty */}
      <View className="mt-3 flex-row items-center bg-gray-100 rounded-xl p-3">
        <Ionicons name="logo-apple" size={22} color="black" />
        <Text className="ml-2 text-xs text-gray-700 flex-1">{warrantyText}</Text>
      </View>
    </View>
  );
}
