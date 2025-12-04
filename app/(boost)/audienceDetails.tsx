// app/(boost)/audienceDetails.tsx
import { useBoostStore } from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// dummy values – later you can replace with API data
const ESTIMATED_MIN = "410.3M";
const ESTIMATED_MAX = "482.6M";
const DEFAULT_LOCATION = "India";
const SUGGESTIONS_LABEL = "18+ | Men and women";

const AGE_OPTIONS = Array.from({ length: 11 }, (_, i) => (18 + i).toString()); // 18–28

const AudienceDetailsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { audience, setAudience } = useBoostStore();

  // 🔹 read selected location if coming back from Locations screen
  const params = useLocalSearchParams<{ location?: string }>();
  const locationFromParams =
    typeof params.location === "string" ? params.location : undefined;

  const locationFromStore = audience.location || DEFAULT_LOCATION;

  const locationToShow =
    locationFromParams || locationFromStore || DEFAULT_LOCATION;

  // keep store's location in sync with what we display
  useEffect(() => {
    setAudience({ location: locationToShow });
  }, [locationToShow, setAudience]);

  // 🔹 Minimum age local state, initialised from store (minAge -> age -> "18")
  const [minAge, setMinAge] = useState(
    audience.minAge != null
      ? String(audience.minAge)
      : audience.age != null
        ? String(audience.age)
        : "18"
  );
  const [showAgeModal, setShowAgeModal] = useState(false);

  const closeModal = () => setShowAgeModal(false);

  // 🔹 Build Suggestions label from global audience (age range + genders)
  const buildSuggestionsLabel = () => {
    const { age, minAge: storeMinAge, maxAge, genders } = audience;

    // Age part
    let agePart: string;
    if (storeMinAge != null && maxAge != null) {
      agePart = `${storeMinAge}-${maxAge}`;
    } else if (storeMinAge != null) {
      agePart = `${storeMinAge}+`;
    } else if (age != null) {
      agePart = `${age}+`;
    } else {
      agePart = "18+";
    }

    // Gender part
    let genderPart: string;
    if (!genders || genders.length === 0) {
      genderPart = "Men and women";
    } else if (genders.length === 1) {
      genderPart = genders[0] === "male" ? "Men" : "Women";
    } else {
      genderPart = "Men and women";
    }

    return `${agePart} | ${genderPart}`;
  };

  const suggestionsLabel = buildSuggestionsLabel() || SUGGESTIONS_LABEL;

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with insets instead of SafeAreaView */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3 border-gray-200">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={30} />
          </Pressable>

          <Text className="text-2xl font-semibold text-gray-900">
            Audience details
          </Text>

          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="checkmark" size={26} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}>
        {/* Estimated audience size */}
        <View className="mt-8 px-4 items-center">
          <Text className="text-3xl font-semibold text-gray-900">
            {ESTIMATED_MIN} - {ESTIMATED_MAX}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Text className="text-sm text-gray-500">
              Estimated audience size
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="mt-8 border-t border-gray-200" />

        {/* Locations */}
        <Pressable
          className="px-4 py-5 flex-row items-center justify-between"
          onPress={() =>
            router.push({
              pathname: "/(boost)/locations",
              params: {
                location: locationToShow,
              },
            })
          }>
          <View>
            <Text className="text-sm font-semibold text-gray-400">
              Locations
            </Text>
            <Text className="mt-1 text-base text-gray-900">
              {locationToShow}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* Minimum age */}
        <Pressable
          className="px-4 py-5 flex-row items-center justify-between"
          onPress={() => setShowAgeModal(true)}>
          <View>
            <Text className="text-sm font-semibold text-gray-400">
              Minimum age
            </Text>
            <Text className="mt-1 text-base text-gray-900">{minAge}+</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* Suggestions (optional) */}
        <Pressable
          className="px-4 py-5 flex-row items-center justify-between"
          onPress={() =>
            router.push({
              pathname: "/(boost)/suggestions",
              params: {
                ageLabel: suggestionsLabel, // pass current label if needed
              },
            })
          }>
          <View className="flex-1 pr-4">
            <Text className="text-sm font-semibold text-gray-400">
              Suggestions (optional)
            </Text>
            <Text className="mt-1 text-base text-gray-900">
              {suggestionsLabel}
            </Text>
            <Text className="mt-2 text-sm text-gray-600">
              We will show your ad to people outside your suggestions when it is
              likely to improve results.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>
      </ScrollView>

      {/* Minimum Age Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showAgeModal}
        onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/40 ">
          {/* tap outside to close */}
          <Pressable className="flex-1" onPress={closeModal} />

          {/* bottom sheet – no drag indicator */}
          <View className="bg-white rounded-t-3xl px-4 pt-4 pb-8">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Minimum age
              </Text>
              <Pressable onPress={closeModal}>
                <Ionicons name="checkmark" size={28} />
              </Pressable>
            </View>

            {/* Info text */}
            <Text className="text-sm text-gray-600 mb-4">
              Without an upper age limit, our system can show your ads to a
              broader audience, which can improve results. You can&apos;t select
              a minimum age below 18 globally, 20 in Thailand or 21 in
              Indonesia.
            </Text>

            {/* Scroll & select list 18–28 */}
            <View className="border-t border-b border-gray-200 max-h-64">
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="py-1">
                {AGE_OPTIONS.map((age) => {
                  const selected = age === minAge;
                  return (
                    <Pressable
                      key={age}
                      onPress={() => {
                        setMinAge(age);
                        const numericAge = Number(age);
                        // 🔹 keep store minAge + legacy age in sync
                        setAudience({
                          age: numericAge,
                          minAge: numericAge,
                        });
                      }}
                      className={`py-3 items-center ${
                        selected ? "bg-gray-100" : ""
                      }`}>
                      <Text
                        className={`text-lg ${
                          selected
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}>
                        {age}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AudienceDetailsScreen;
