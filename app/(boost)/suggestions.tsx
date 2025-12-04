// app/(boost)/suggestions.tsx
import { useBoostStore } from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// dummy for now – N/A audience size
const ESTIMATED_SIZE = "N/A";
const DEFAULT_AGE_LABEL = "18+ | Men and women";

const SuggestionsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ ageLabel?: string }>();
  const paramAgeLabel =
    typeof params.ageLabel === "string" ? params.ageLabel : DEFAULT_AGE_LABEL;

  // 🔹 Read audience from global store
  const { audience } = useBoostStore();

  // Build label from global audience (age range + genders),
  // but fall back to paramAgeLabel if something is missing.
  const buildAgeGenderLabel = () => {
    const { age, minAge, maxAge, genders } = audience;

    // 🔹 Age part
    let agePart: string;
    if (minAge != null && maxAge != null) {
      // e.g. "18-28"
      agePart = `${minAge}-${maxAge}`;
    } else if (minAge != null) {
      // only minimum known: "18+"
      agePart = `${minAge}+`;
    } else if (age != null) {
      // legacy single age: "18+"
      agePart = `${age}+`;
    } else {
      // fallback to the age part from param/default label: "18+ | Men and women"
      const parts = paramAgeLabel.split("|");
      agePart = parts[0]?.trim() || "18+";
    }

    // 🔹 Gender part
    let genderPart: string;
    if (!genders || genders.length === 0) {
      // fallback to param label's gender part if present
      const parts = paramAgeLabel.split("|");
      genderPart = parts[1]?.trim() || "Men and women";
    } else if (genders.length === 1) {
      genderPart = genders[0] === "male" ? "Men" : "Women";
    } else {
      genderPart = "Men and women";
    }

    return `${agePart} | ${genderPart}`;
  };

  const ageLabel = buildAgeGenderLabel();

  const handleDone = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header - apply paddingTop using insets */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={28} />
          </Pressable>

          <Text className="text-xl font-semibold text-gray-900">
            Suggestions
          </Text>

          <Pressable onPress={handleDone} className="p-1">
            <Ionicons name="checkmark" size={26} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}>
        {/* Estimated audience size */}
        <View className="mt-8 items-center">
          <Text className="text-3xl font-semibold text-gray-900">
            {ESTIMATED_SIZE}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Text className="text-sm text-gray-500">
              Estimated audience size
            </Text>
          </View>
        </View>

        {/* Helper text */}
        <Text className="mt-8 text-sm text-gray-500">
          Use suggestions to guide our tools towards people that you think are
          most likely to engage.
        </Text>

        {/* Age & Gender */}
        <Pressable
          className="mt-8 flex-row items-center justify-between py-2"
          onPress={() => router.push("/(boost)/ageGender")}>
          <View>
            <Text className="text-sm font-semibold text-gray-500">
              Age & gender
            </Text>
            <Text className="mt-1 text-base text-gray-900">{ageLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* Interests */}
        <Pressable
          className="mt-6 flex-row items-center justify-between py-2"
          onPress={() => router.push("/(boost)/interests")}>
          <View>
            <Text className="text-sm font-semibold text-gray-500">
              Interests
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default SuggestionsScreen;
