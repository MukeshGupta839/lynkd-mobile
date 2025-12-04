// app/(boost)/preferencesGoal.tsx
import { PreferenceId, useBoostStore } from "@/stores/useBoostStore"; // ⬅️ adjust path if needed
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PREFERENCES: { id: PreferenceId; label: string }[] = [
  {
    id: "engagement",
    label: "Engagement (likes, comments, shares, saves and link clicks)",
  },
  { id: "profile_visits", label: "Profile visits and follows" },
  { id: "messages_instagram", label: "Messages on Instagram" },
  { id: "no_preference", label: "No preference" },
];

// dummy bottom note (later replace with API text if needed)
const BOTTOM_NOTE =
  "Website visits, purchases and WhatsApp messages are not currently available for this option.";

const PreferencesGoalScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { preference, setPreference, setGoal } = useBoostStore();

  // local selection, initialised from store
  const [selected, setSelected] = useState<PreferenceId | null>(
    preference ?? null
  );

  const handleDone = () => {
    if (!selected) return; // no selection -> ignore

    // save to global store
    setPreference(selected);
    // ensure goal is "mix" when using preferences
    setGoal("mix");

    // just go back; Goal screen reads from store
    router.back();
  };

  const handleSelect = (id: PreferenceId) => {
    setSelected(id);
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with insets instead of SafeAreaView */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3 pb-1 border-b border-gray-200">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
            <Ionicons name="arrow-back" size={24} />
          </Pressable>

          <Text className="text-lg font-semibold text-gray-900">
            Preferences
          </Text>

          <Pressable onPress={handleDone} hitSlop={10} className="p-1">
            <Text
              className={`text-base font-semibold ${
                selected ? "text-blue-500" : "text-gray-400"
              }`}>
              Done
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 pb-8"
        showsVerticalScrollIndicator={false}>
        {/* Title + description */}
        <Text className="mt-6 text-xl font-semibold text-gray-900 text-center">
          Which goal should be prioritised?
        </Text>

        <Text className="mt-3 text-sm text-gray-500 text-center">
          We will prioritise your preferred goal if it is likely to improve
          performance.
        </Text>

        <Text className="mt-3 text-sm text-gray-500 text-center">
          If you select <Text className="font-semibold">No preference</Text>, we
          will show your ad to people who are likely to take a variety of
          actions.
        </Text>

        {/* Options */}
        <View className="mt-8 bg-white px-3 rounded-xl">
          {PREFERENCES.map((pref, index) => (
            <Pressable
              key={pref.id}
              onPress={() => handleSelect(pref.id)}
              className={`flex-row items-center justify-between py-4 ${
                index !== PREFERENCES.length - 1
                  ? "border-b border-gray-200"
                  : ""
              }`}>
              <Text className="flex-1 pr-4 text-base text-gray-900">
                {pref.label}
              </Text>

              <View className="items-center justify-center">
                <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300">
                  {selected === pref.id && (
                    <View className="h-2.5 w-2.5 rounded-full bg-black" />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Bottom note */}
        <Text className="mt-8 text-sm text-gray-500">{BOTTOM_NOTE}</Text>
      </ScrollView>
    </View>
  );
};

export default PreferencesGoalScreen;
