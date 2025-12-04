// app/(boost)/ageGender.tsx
import { useBoostStore } from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ESTIMATED_MIN = "410.3M";
const ESTIMATED_MAX = "482.6M";

const AgeGenderScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { audience, setAudience } = useBoostStore();

  // 🔹 RANGE: initialise from global audience, fallback 18–65
  const [minAge, setMinAge] = useState<number>(audience.minAge ?? 18);
  const [maxAge, setMaxAge] = useState<number>(audience.maxAge ?? 65);

  const [male, setMale] = useState(audience.genders.includes("male"));
  const [female, setFemale] = useState(audience.genders.includes("female"));

  // awesome-slider shared values (global min/max are 18–65)
  const sliderMin = useSharedValue(18);
  const sliderMax = useSharedValue(65);
  const minProgress = useSharedValue(minAge);
  const maxProgress = useSharedValue(maxAge);

  const handleDone = () => {
    const genders: ("male" | "female")[] = [];
    if (male) genders.push("male");
    if (female) genders.push("female");

    // if user unselects both, fall back to both selected
    const finalGenders =
      genders.length > 0
        ? genders
        : (["male", "female"] as ("male" | "female")[]);

    // 🔹 Save range + keep age = minAge for backward compatibility
    setAudience({
      ...audience,
      age: minAge,
      minAge,
      maxAge,
      genders: finalGenders,
    });

    router.back();
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with safe-area padding */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3 border-b border-gray-200">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={28} />
          </Pressable>

          <Text className="text-xl font-semibold text-gray-900">
            Age & gender
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
            {ESTIMATED_MIN} - {ESTIMATED_MAX}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Text className="text-sm text-gray-500">
              Estimated audience size
            </Text>
          </View>
        </View>

        {/* Age RANGE */}
        <View className="mt-8">
          <Text className="text-base font-semibold text-gray-900">Age</Text>

          {/* Current selected range text */}
          <Text className="mt-2 text-sm text-gray-600">
            Selected: {minAge}-{maxAge}
          </Text>

          {/* labels 18 - 65 */}
          <View className="mt-4 flex-row justify-between">
            <Text className="text-sm text-gray-500">18</Text>
            <Text className="text-sm text-gray-500">65</Text>
          </View>

          {/* Min age slider */}
          <View className="mt-2">
            <Text className="mb-1 text-xs text-gray-500">Minimum age</Text>
            <Slider
              minimumValue={sliderMin}
              maximumValue={sliderMax}
              progress={minProgress}
              step={1}
              theme={{
                maximumTrackTintColor: "#E5E7EB", // light gray
                minimumTrackTintColor: "#000000", // black active track
                cacheTrackTintColor: "#111827",
                disableMinTrackTintColor: "#999999",
                bubbleBackgroundColor: "#000000", // black bubble card
                heartbeatColor: "#000000",
              }}
              bubble={(value) => `${Math.round(value as number)}`}
              bubbleTextStyle={{ color: "#FFFFFF", fontWeight: "600" }}
              onValueChange={(value) => {
                const raw = Math.round(value as number);
                // don't let min be >= max
                const clamped = Math.min(raw, maxAge - 1);
                setMinAge(clamped);
                minProgress.value = clamped;
              }}
            />
          </View>

          {/* Max age slider */}
          <View className="mt-4">
            <Text className="mb-1 text-xs text-gray-500">Maximum age</Text>
            <Slider
              minimumValue={sliderMin}
              maximumValue={sliderMax}
              progress={maxProgress}
              step={1}
              theme={{
                maximumTrackTintColor: "#E5E7EB",
                minimumTrackTintColor: "#000000",
                cacheTrackTintColor: "#111827",
                disableMinTrackTintColor: "#999999",
                bubbleBackgroundColor: "#000000",
                heartbeatColor: "#000000",
              }}
              bubble={(value) => `${Math.round(value as number)}`}
              bubbleTextStyle={{ color: "#FFFFFF", fontWeight: "600" }}
              onValueChange={(value) => {
                const raw = Math.round(value as number);
                // don't let max be <= min
                const clamped = Math.max(raw, minAge + 1);
                setMaxAge(clamped);
                maxProgress.value = clamped;
              }}
            />
          </View>
        </View>

        {/* Gender */}
        <View className="mt-8">
          <Text className="text-base font-semibold text-gray-900">Gender</Text>

          {/* Male */}
          <Pressable
            className="mt-4 flex-row items-center justify-between"
            onPress={() => setMale((prev) => !prev)}>
            <Text className="text-base text-gray-900">Male</Text>
            <View
              className={`h-6 w-6 rounded-sm items-center justify-center ${
                male ? "bg-black" : "border border-gray-400 bg-white"
              }`}>
              {male && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
            </View>
          </Pressable>

          {/* Female */}
          <Pressable
            className="mt-4 flex-row items-center justify-between"
            onPress={() => setFemale((prev) => !prev)}>
            <Text className="text-base text-gray-900">Female</Text>
            <View
              className={`h-6 w-6 rounded-sm items-center justify-center ${
                female ? "bg-black" : "border border-gray-400 bg-white"
              }`}>
              {female && (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default AgeGenderScreen;
