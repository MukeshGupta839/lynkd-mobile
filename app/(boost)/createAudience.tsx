// app/(boost)/createAudience.tsx
import { useBoostStore } from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// dummy data – replace with API later
const ESTIMATED_SIZE = "N/A";
const MIN_AGE = "18";

// same as in AudienceDetails – 18–28
const AGE_OPTIONS = Array.from({ length: 11 }, (_, i) => (18 + i).toString());

const CreateAudienceScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { audience, setAudience } = useBoostStore();

  const [useAdvantagePlus, setUseAdvantagePlus] = useState(false);
  const [audienceSuggestionsExpanded, setAudienceSuggestionsExpanded] =
    useState(false);

  // 👇 Minimum age state + modal visibility (init from global audience)
  const [minAge, setMinAge] = useState(
    audience.age ? String(audience.age) : MIN_AGE
  );
  const [showAgeModal, setShowAgeModal] = useState(false);

  const closeModal = () => setShowAgeModal(false);

  // Build dynamic "Age & gender" label instead of hard-coded text
  const buildAgeGenderLabel = () => {
    const genders = audience.genders;
    const age = audience.age;

    let genderPart = "All";
    if (genders.length === 1) {
      genderPart = genders[0] === "male" ? "Men" : "Women";
    } else if (genders.length === 2) {
      genderPart = "Men and women";
    }

    const agePart = age ? `${age}+ years` : "18-65 years";

    return `${genderPart} | ${agePart}`;
  };

  const AGE_GENDER_LABEL = buildAgeGenderLabel();

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 ">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
          <Ionicons name="arrow-back" size={30} />
        </Pressable>

        <Text className="text-2xl font-semibold text-gray-900">
          Create audience
        </Text>

        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
          <Ionicons name="checkmark" size={26} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}>
        {/* Estimated audience size */}
        <View className="mt-8 px-4 items-center">
          <Text className="text-3xl font-semibold text-gray-900">
            {ESTIMATED_SIZE}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Text className="text-sm text-gray-500">
              Estimated audience size
            </Text>
            <View className="ml-1">
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Recommended pill + Advantage+ switch */}
        <View className="mt-8 px-4">
          <Text className="mb-3 self-start rounded-full bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600">
            Recommended
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-gray-900">
                Use Advantage+ audience
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Automatically finds and updates audiences whenever it&apos;s
                likely to improve performance
              </Text>
            </View>

            <Switch
              value={useAdvantagePlus}
              onValueChange={setUseAdvantagePlus}
              trackColor={{ false: "#d1d5db", true: "#000000" }} // gray -> black
              thumbColor={"#ffffff"}
              ios_backgroundColor="#d1d5db"
            />
          </View>
        </View>

        {/* Audience name row */}
        <Pressable className="mt-8 px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
          <Text className="text-base text-gray-400">Audience name</Text>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
        </Pressable>

        {/* Audience details section title */}
        <View className="px-4 pt-4">
          <Text className="text-base font-semibold text-gray-900">
            Audience details
          </Text>
        </View>

        {/* ---------------------------
            WHEN Advantage+ IS ON
           --------------------------- */}
        {useAdvantagePlus ? (
          <>
            {/* Locations row */}
            <Pressable
              className="px-4 py-4 flex-row items-center justify-between"
              onPress={() => router.push("/(boost)/locations")}>
              <Text className="text-base text-gray-700">Locations</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            {/* Minimum age row – opens bottom sheet modal */}
            <Pressable
              className="px-4 py-4 flex-row items-center justify-between"
              onPress={() => setShowAgeModal(true)}>
              <View>
                <Text className="text-sm font-semibold text-gray-400">
                  Minimum age
                </Text>
                <Text className="mt-1 text-base text-gray-900">{minAge}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            {/* OPTIONAL Audience Suggestions */}
            <View className="px-4 pt-6">
              <Text className="text-xs font-semibold text-gray-400 tracking-wide">
                OPTIONAL
              </Text>
            </View>

            {/* Audience Suggestions row – acts like dropdown header */}
            <Pressable
              className="px-4 py-4 flex-row items-center justify-between"
              onPress={() => setAudienceSuggestionsExpanded((prev) => !prev)}>
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold text-gray-900">
                  Audience Suggestions
                </Text>
                <Text className="mt-1 text-sm text-gray-600">
                  We&apos;ll show ads to audiences matching your suggestions
                  before searching more widely.
                </Text>
              </View>
              <Ionicons
                name={
                  audienceSuggestionsExpanded ? "chevron-up" : "chevron-down"
                }
                size={18}
                color="#9CA3AF"
              />
            </Pressable>

            {/* 👇 These rows ONLY show when dropdown is open */}
            {audienceSuggestionsExpanded && (
              <>
                {/* Age & gender row */}
                <Pressable
                  className="px-4 py-4 flex-row items-center justify-between"
                  onPress={() => router.push("/(boost)/ageGender")}>
                  <View>
                    <Text className="text-sm font-semibold text-gray-400">
                      Age &amp; gender
                    </Text>
                    <Text className="mt-1 text-base text-gray-900">
                      {AGE_GENDER_LABEL}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </Pressable>

                {/* Interests row */}
                <Pressable
                  className="px-4 py-4 flex-row items-center justify-between"
                  onPress={() => router.push("/(boost)/interests")}>
                  <Text className="text-base text-gray-700">Interests</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </Pressable>
              </>
            )}
          </>
        ) : (
          /* ---------------------------
             WHEN Advantage+ IS OFF
             --------------------------- */
          <>
            {/* Locations row */}
            <Pressable
              className="px-4 py-4 flex-row items-center justify-between"
              onPress={() => router.push("/(boost)/locations")}>
              <Text className="text-base text-gray-700">Locations</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            {/* Interests row */}
            <Pressable
              className="px-4 py-4 flex-row items-center justify-between"
              onPress={() => router.push("/(boost)/interests")}>
              <Text className="text-base text-gray-700">Interests</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            {/* Age & gender row */}
            <Pressable
              className="px-4 py-4 flex-row items-center justify-between"
              onPress={() => router.push("/(boost)/ageGender")}>
              <View>
                <Text className="text-sm font-semibold text-gray-400">
                  Age &amp; gender
                </Text>
                <Text className="mt-1 text-base text-gray-900">
                  {AGE_GENDER_LABEL}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* 👇 Minimum Age Bottom Sheet Modal (same style as AudienceDetails) */}
      <Modal
        transparent
        animationType="fade"
        visible={showAgeModal}
        onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/40">
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
                        setAudience({ age: Number(age) });
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

export default CreateAudienceScreen;
