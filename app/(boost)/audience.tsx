// app/(boost)/audience.tsx
import { useBoostStore } from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// fallback dummy values – used only when store has nothing
const FALLBACK_COUNTRY = "India";

type CategoryId = "financial" | "employment" | "housing" | "social_issues";

const CATEGORIES: {
  id: CategoryId;
  title: string;
  description: string;
}[] = [
  {
    id: "financial",
    title: "Financial products and services",
    description:
      "Credit cards, loans, bank accounts, investing, insurance and other financial products and services",
  },
  {
    id: "employment",
    title: "Employment",
    description: "Jobs, certifications or career opportunities",
  },
  {
    id: "housing",
    title: "Housing",
    description: "Property, insurance, mortgages or similar",
  },
  {
    id: "social_issues",
    title: "Social issues, elections or politics",
    description:
      "Issues (such as immigration or civil rights), elections, politicians or political campaigns",
  },
];

// ---------- Info bottom sheet slides ----------
const INFO_SLIDES = [
  {
    id: "suggested" as const,
    title: "Suggested",
    body: "This option targets people most likely to engage. It looks for those who have engaged with your content before and may be interested in seeing more.",
    buttonLabel: "Select suggested audience",
  },
  {
    id: "create" as const,
    title: "Create your own",
    body: "You build your own audience based on location, age, interests and gender. Add as many interests as possible to increase the size of your potential audience.",
    buttonLabel: "Create audience",
  },
];

type InfoSlideId = (typeof INFO_SLIDES)[number]["id"];

const AudienceScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { audience } = useBoostStore();

  const [isFinancialAd, setIsFinancialAd] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<"suggested" | null>(
    "suggested"
  );

  // modal state for Special requirements
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    []
  );
  const [showSocialWarning, setShowSocialWarning] = useState(false);

  // info sheet state (for i icon)
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoIndex, setInfoIndex] = useState(0);

  const toggleCategory = (id: CategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const closeCategories = () => {
    setShowCategoriesModal(false);
    setShowSocialWarning(false);
  };

  const openInfo = () => {
    setInfoIndex(0);
    setShowInfoModal(true);
  };

  const closeInfo = () => setShowInfoModal(false);

  const handleInfoButtonPress = (slideId: InfoSlideId) => {
    if (slideId === "suggested") {
      // just mark that user chose suggested – audience details are already in store
      setSelectedAudience("suggested");
      setShowInfoModal(false);
    } else {
      setShowInfoModal(false);
      router.push("/(boost)/createAudience");
    }
  };

  const handleInfoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const idx = Math.round(contentOffset.x / layoutMeasurement.width);
    if (idx !== infoIndex) {
      setInfoIndex(idx);
    }
  };

  const currentSlide = INFO_SLIDES[infoIndex];

  // 👉 Build labels from global audience state

  const locationLabel = audience.location || FALLBACK_COUNTRY;

  const buildGenderLabel = () => {
    const genders = audience.genders;
    if (!genders || genders.length === 0) return "Men and women";
    if (genders.length === 1) {
      return genders[0] === "male" ? "Men" : "Women";
    }
    return "Men and women";
  };

  const genderLabel = buildGenderLabel();

  // 🔹 Age part (range-aware, same base logic as Suggestions/AudienceDetails)
  const buildAgePart = () => {
    const { age, minAge, maxAge } = audience;

    if (minAge != null && maxAge != null) {
      return `${minAge}-${maxAge}`;
    }
    if (minAge != null) {
      return `${minAge}+`;
    }
    if (age != null) {
      return `${age}+`;
    }
    return "18+";
  };

  const agePart = buildAgePart();

  const suggestionLine = `Suggestions: ${genderLabel}, ${agePart}`;

  // 👉 When user taps main Next button
  const handleNext = () => {
    // no need to overwrite store here – everything already saved from other screens
    router.push("/(boost)/budgetDuration");
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with insets instead of SafeAreaView */}
      <View style={{ paddingTop: insets.top - 10 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
            <Ionicons name="arrow-back" size={30} />
          </Pressable>

          <Text className="text-2xl font-semibold text-gray-900">Audience</Text>

          <Pressable hitSlop={10} className="p-1" onPress={openInfo}>
            <Ionicons name="information-circle-outline" size={30} />
          </Pressable>
        </View>

        {/* Progress bar – first two active */}
        <View className="flex-row items-center pt-2 pb-3">
          <LinearGradient
            colors={["#251e15ff", "#000000ff"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="h-0.5 flex-1 rounded-full"
          />
          <View className="w-2" />
          <LinearGradient
            colors={["#251e15ff", "#000000ff"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="h-0.5 flex-1 rounded-full"
          />
          <View className="w-2" />
          <View className="h-0.5 flex-1 rounded-full bg-gray-200" />
          <View className="w-2" />
          <View className="h-0.5 flex-1 rounded-full bg-gray-200" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text className=" px-3 text-center text-xl font-semibold text-gray-900 pb-4">
          Who should see your ad ?
        </Text>

        {/* Special requirements */}
        <View className="border-b border-gray-200 px-3 py-4">
          <Pressable
            className="flex-row items-start justify-between"
            onPress={() => setShowCategoriesModal(true)}>
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-gray-900">
                Special requirements
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Review these if your ad is about financial products and
                services, employment, housing, social issues, elections or
                politics.
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Suggested audience */}
        <View className="px-3 py-4">
          <Pressable
            onPress={() => setSelectedAudience("suggested")}
            className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-gray-900">
                Suggested audience
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Uses Advantage+ audience to reach people most likely to visit
                your website
              </Text>

              <View className="mt-3">
                {/* LOCATION from store (Chennai, India, etc.) */}
                <Text className="text-sm text-gray-500">{locationLabel}</Text>

                {/* SUGGESTIONS from store (Suggestions: Men and women, 18-28 etc.) */}
                <Text className="mt-1 text-sm text-gray-500">
                  {suggestionLine}
                </Text>

                <Text
                  className="mt-1 text-sm font-semibold text-[#4B4DED]"
                  onPress={() => router.push("/(boost)/audienceDetails")}>
                  Edit
                </Text>
              </View>
            </View>

            <View className="items-center justify-center">
              <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400">
                {selectedAudience === "suggested" && (
                  <View className="h-2.5 w-2.5 rounded-full bg-black" />
                )}
              </View>
            </View>
          </Pressable>
        </View>

        {/* Financial products + Action required IN ONE BOX */}
        <View className="mx-3 mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {/* Top: toggle row */}
          <View className="flex-row items-center px-4 py-4">
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-gray-900">
                This ad is about financial products and services.
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Includes ads about securities and investments
              </Text>
            </View>
            <Switch
              value={isFinancialAd}
              onValueChange={setIsFinancialAd}
              trackColor={{ false: "#d1d5db", true: "#000000" }}
              thumbColor={"#ffffff"}
              ios_backgroundColor="#d1d5db"
            />
          </View>

          {/* Bottom: Action required (only when toggle ON) */}
          {isFinancialAd && (
            <Pressable
              className="px-4 py-4"
              onPress={() => router.push("/(boost)/additionalActionRequired")}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-gray-900">
                    Action required
                  </Text>
                  <Text className="mt-1 text-sm text-gray-600">
                    To deliver ads in India, you must take additional action.
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="warning-outline" size={18} color="#f97316" />
                  <View className="w-1.5" />
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
              </View>
            </Pressable>
          )}
        </View>

        {/* Create your own */}
        <View className="mt-6 px-3 py-4">
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => router.push("/(boost)/createAudience")}>
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-gray-900">
                Create your own
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Enter your targeting options manually
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom button – BLACK */}
      <View className="px-3 pb-6">
        <Pressable
          className="h-12 items-center justify-center rounded-full bg-black"
          onPress={handleNext}>
          <Text className="text-base font-semibold text-white">Next</Text>
        </Pressable>
      </View>

      {/* Categories Modal (Special requirements) */}
      <Modal
        transparent
        animationType="slide"
        visible={showCategoriesModal}
        onRequestClose={closeCategories}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={closeCategories} />

          <View className="bg-white rounded-t-3xl px-3 pt-4 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="w-10" />
              <Text className="text-lg font-semibold text-gray-900">
                Select categories
              </Text>
              <Pressable onPress={closeCategories}>
                <Text className="text-base font-semibold text-blue-500">
                  Done
                </Text>
              </Pressable>
            </View>

            {CATEGORIES.map((cat, index) => {
              const isSelected = selectedCategories.includes(cat.id);

              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    if (cat.id === "social_issues") {
                      setShowSocialWarning(true);
                      return;
                    }
                    toggleCategory(cat.id);
                    setShowSocialWarning(false);
                  }}
                  className={`py-3 ${
                    index !== CATEGORIES.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-base font-semibold text-gray-900">
                        {cat.title}
                      </Text>
                      <Text className="mt-1 text-sm text-gray-600">
                        {cat.description}
                      </Text>

                      {isSelected && cat.id !== "social_issues" && (
                        <View className="mt-2">
                          <Text className="text-xs text-gray-500">
                            US targeting will be updated for this ad. Audiences
                            will include all genders, ages from 18–65+ and all
                            people in a 15-mile radius of the selected location.
                            Targeted interests may also be adjusted.
                          </Text>
                          <Text className="mt-1 text-xs font-semibold text-[#4B4DED]">
                            Learn more
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="items-center justify-center mt-1">
                      <View
                        className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                          cat.id === "social_issues"
                            ? "border-gray-300 opacity-40"
                            : "border-gray-400"
                        }`}>
                        {isSelected && cat.id !== "social_issues" && (
                          <View className="h-2.5 w-2.5 rounded-full bg-black" />
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {showSocialWarning && (
              <View className="mt-4 flex-row items-start rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
                <Ionicons name="warning-outline" size={18} color="#f97316" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-800">
                    Ads about social issues, elections or politics can only be
                    created in Ads Manager.
                  </Text>
                  <Text className="mt-1 text-sm font-semibold text-[#4B4DED]">
                    Learn more
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* INFO BOTTOM SHEET (i icon) */}
      <Modal
        transparent
        animationType="slide"
        visible={showInfoModal}
        onRequestClose={closeInfo}>
        <View className="flex-1 justify-end bg-black/40">
          {/* tap outside to close */}
          <Pressable className="flex-1" onPress={closeInfo} />

          <View className="bg-white rounded-t-3xl pt-2 pb-6">
            {/* horizontal pager, NO drag indicator here */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleInfoScroll}>
              {INFO_SLIDES.map((slide) => (
                <View key={slide.id} className="w-screen px-6 pt-8 pb-2">
                  <Text className="text-center text-lg font-semibold text-gray-900">
                    {slide.title}
                  </Text>
                  <Text className="mt-4 text-sm text-gray-700 leading-relaxed text-center">
                    {slide.body}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* sticky button under slides, above dots */}
            <View className="px-6 pt-2">
              <Pressable
                className="h-11 items-center justify-center rounded-full bg-black"
                onPress={() => handleInfoButtonPress(currentSlide.id)}>
                <Text className="text-sm font-semibold text-white">
                  {currentSlide.buttonLabel}
                </Text>
              </Pressable>
            </View>

            {/* dots */}
            <View className="mt-4 mb-1 flex-row items-center justify-center">
              {INFO_SLIDES.map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full mx-1 ${
                    i === infoIndex ? "bg-[#2563eb]" : "bg-gray-300"
                  }`}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AudienceScreen;
