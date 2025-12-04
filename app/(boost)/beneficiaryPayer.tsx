// app/(boost)/beneficiaryPayer.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BeneficiaryPayerScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
          <Ionicons name="close" size={30} />
        </Pressable>

        <Text className="text-2xl font-semibold text-gray-900">
          Beneficiary and payer
        </Text>

        <Pressable hitSlop={10} className="p-1"></Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-6 pb-10"
        showsVerticalScrollIndicator={false}>
        {/* Icon placeholder – you can replace with actual image if you have one */}
        <View className="mt-16 mb-8 h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500">
          <Ionicons name="information" size={38} color="#ffffff" />
        </View>

        {/* Title */}
        <Text className="text-xl font-semibold text-gray-900 text-center">
          Verify beneficiary and payer
        </Text>

        {/* Description */}
        <Text className="mt-4 text-sm text-gray-600 text-center">
          For this ad to be shown in India, you must verify a beneficiary and
          payer in Meta Business Suite.{" "}
          <Text className="text-[#4B4DED] font-semibold">Learn more</Text>
        </Text>
      </ScrollView>

      {/* Bottom button – blue as in reference UI */}
      <View className="px-3 pb-6">
        <Pressable
          className="h-12 items-center justify-center rounded-full bg-black"
          onPress={() => {
            // Later you can deep-link to Meta Business Suite
            router.back();
          }}>
          <Text className="text-base font-semibold text-white">
            Verify in Meta Business Suite
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default BeneficiaryPayerScreen;
