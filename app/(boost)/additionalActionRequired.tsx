// app/(boost)/additionalActionRequired.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AdditionalActionRequiredScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
          <Ionicons name="arrow-back" size={30} />
        </Pressable>

        <Text className="text-2xl font-semibold text-gray-900">
          Additional action required
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}>
        {/* Title + description */}
        <View className="mt-10 px-6 items-center">
          <Text className="text-xl font-semibold text-gray-900 text-center">
            Complete requirements
          </Text>
          <Text className="mt-3 text-sm text-gray-600 text-center">
            Provide additional information to comply with local regulatory
            guidelines or other requirements.
          </Text>
        </View>

        {/* Country block */}
        <View className="mt-10 px-6">
          <Text className="text-base font-semibold text-gray-900">India</Text>
          <Text className="mt-2 text-sm text-gray-600">
            Financial ads in India require disclosure on who will be benefiting
            and paying for the ad.{" "}
            <Text className="text-[#4B4DED] font-semibold">Learn more</Text>
          </Text>
        </View>

        {/* Verify beneficiary and payer row */}
        <Pressable
          className="mt-10 px-6 py-4 flex-row items-center justify-between border-t border-gray-200"
          onPress={() => router.push("/(boost)/beneficiaryPayer")}>
          <Text className="text-base text-gray-900">
            Verify beneficiary and payer
          </Text>
          <View className="flex-row items-center">
            <Ionicons
              name="warning-outline"
              size={18}
              color="#f97316"
              style={{ marginRight: 8 }}
            />
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </Pressable>
      </ScrollView>

      {/* Bottom button (blue like reference) */}
      <View className="px-3 pb-6">
        <Pressable
          className="h-12 items-center justify-center rounded-full bg-black"
          onPress={() => router.back()}>
          <Text className="text-base font-semibold text-white">Done</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AdditionalActionRequiredScreen;
