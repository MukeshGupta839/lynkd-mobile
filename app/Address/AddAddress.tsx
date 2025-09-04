import FormInput from "@/components/FormInput"; // ✅ import component
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddAddress() {
  const router = useRouter();
  const [focused, setFocused] = useState<string | null>(null);


  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center px-[5%] py-[4%] bg-white shadow-sm">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-base font-semibold">Add New Address</Text>
      </View>

      {/* Scrollable Form */}
      <ScrollView
        className="flex-1 px-[5%] mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <FormInput
          label="Flat/House no. / Building Name"
          isFocused={focused === "house"}
          onFocus={() => setFocused("house")}
          onBlur={() => setFocused(null)}
        />

        <FormInput
          label="Enter Full Name"
          isFocused={focused === "name"}
          onFocus={() => setFocused("name")}
          onBlur={() => setFocused(null)}
        />

        <FormInput
          label="Mobile Number"
          keyboardType="phone-pad"
          isFocused={focused === "mobile"}
          onFocus={() => setFocused("mobile")}
          onBlur={() => setFocused(null)}
        />

        <FormInput
          label="Alternate Mobile Number"
          keyboardType="phone-pad"
          isFocused={focused === "altmobile"}
          onFocus={() => setFocused("altmobile")}
          onBlur={() => setFocused(null)}
        />
      </ScrollView>

      {/* Floating Bottom Button */}
      <View className="absolute bottom-0 inset-x-0 px-[5%] pb-4">
        <TouchableOpacity className="w-full py-4 bg-[#26FF91] items-center justify-center rounded-lg shadow-md shadow-black/20">
          <Text className="text-black font-semibold text-sm">Save Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
