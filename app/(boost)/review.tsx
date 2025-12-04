// app/(boost)/review.tsx
import {
  PreferenceId,
  useBoostStore,
  WebsiteActionId,
} from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// same dummy username you used in Goal screen
const DUMMY_USERNAME = "@srikant_197";

// Reuse labels like in Goal screen
const ACTION_LABELS: Record<WebsiteActionId, string> = {
  learn_more: "Learn more",
  shop_now: "Shop now",
  watch_more: "Watch more",
  contact_us: "Contact us",
  book_now: "Book now",
  sign_up: "Sign up",
};

const PREFERENCE_LABELS: Record<PreferenceId, string> = {
  engagement: "Engagement (likes, comments, shares, saves and link clicks)",
  profile_visits: "Profile visits and follows",
  messages_instagram: "Messages on Instagram",
  no_preference: "No preference",
};

const ReviewScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { goal, website, websiteAction, preference, audience, budget } =
    useBoostStore();

  // ---- GOAL label from store ----
  const { goalLabel, goalValue } = (() => {
    switch (goal) {
      case "profile":
        return {
          goalLabel: "Profile visits to",
          goalValue: DUMMY_USERNAME,
        };

      case "website":
        return {
          goalLabel: `Website visits to (${ACTION_LABELS[websiteAction]})`,
          goalValue: website || "www.myshop.com",
        };

      case "message":
        return {
          goalLabel: "More messages on Lynkd",
          goalValue: "",
        };

      case "mix": {
        const prefText = preference
          ? PREFERENCE_LABELS[preference]
          : "No specific preference";
        return {
          goalLabel: "A mix of actions",
          goalValue: prefText,
        };
      }

      default:
        return {
          goalLabel: "Profile visits to",
          goalValue: DUMMY_USERNAME,
        };
    }
  })();

  // ---- AUDIENCE label from store ----
  const audienceLocation = audience.location || "India";

  // gender text from genders array
  const genders = audience.genders || [];
  const genderLabel =
    genders.length === 2
      ? "Men and women"
      : genders.length === 1
        ? genders[0] === "male"
          ? "Men"
          : "Women"
        : "All genders";

  // 🔹 Age: show RANGE when possible (e.g. "Ages 28-34")
  const buildAgeLabel = () => {
    const { minAge, maxAge, age } = audience;

    if (minAge != null && maxAge != null) {
      // full range
      return `Ages ${minAge}-${maxAge}`;
    }

    const base = minAge != null ? minAge : age != null ? age : 18; // fallback

    // fallback to 18+ style if we don't have maxAge
    return `Ages ${base}+`;
  };

  const ageLabel = buildAgeLabel();

  // Final audience label, example:
  // "India | Ages 28-34 | Men and women"
  const audienceLabel = `${audienceLocation} | ${ageLabel} | ${genderLabel}`;

  // ---- BUDGET & DURATION label from store ----
  const dailyBudget = budget.dailyBudget ?? 10;
  const durationMode = budget.durationMode;
  const durationDays = budget.durationDays;

  const isRunUntilPaused = durationMode === "run_until_paused";

  // Example:
  //  - "₹10 daily | runs until paused"
  //  - "₹50 total | 5 days"
  const budgetLabel = isRunUntilPaused
    ? `₹${dailyBudget.toFixed(0)} daily | runs until paused`
    : `₹${(dailyBudget * (durationDays ?? 1)).toFixed(0)} total | ${
        durationDays ?? 1
      } days`;

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}>
      {/* Header */}
      <View className="flex-row items-center px-3 border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
          <Ionicons name="arrow-back" size={30} />
        </Pressable>

        <Text className="flex-1 text-center text-2xl font-semibold text-gray-900">
          Review
        </Text>

        {/* Spacer to keep title centered (no info icon) */}
        <View className="w-8" />
      </View>

      {/* Progress bar – all 4 steps active */}
      <View className="flex-row items-center pt-2 pb-3">
        <LinearGradient
          colors={["#251e15ff", "#000000ff"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="h-0.5 flex-1 rounded-full"
        />
        <View className="w-2" />
        <LinearGradient
          colors={["#000000ff", "#000000ff"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="h-0.5 flex-1 rounded-full"
        />
        <View className="w-2" />
        <LinearGradient
          colors={["#000000ff", "#000000ff"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="h-0.5 flex-1 rounded-full"
        />
        <View className="w-2" />
        <LinearGradient
          colors={["#000000ff", "#000000ff"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="h-0.5 flex-1 rounded-full"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}>
        {/* Big title */}
        <Text className=" px-4 text-center text-xl font-semibold text-gray-900">
          Everything look good ?
        </Text>

        {/* Goal row – dynamic from store */}
        <View className="mt-8 px-4">
          <Text className="text-base font-semibold text-gray-900">Goal</Text>
          <Text className="mt-2 text-sm text-gray-500">
            {goalLabel}
            {goalValue ? (
              <>
                {" "}
                <Text className="font-semibold text-gray-700">{goalValue}</Text>
              </>
            ) : null}
          </Text>
        </View>

        {/* Audience row – dynamic from audience store */}
        <View className="mt-6 px-4">
          <Text className="text-base font-semibold text-gray-900">
            Audience
          </Text>
          <Text className="mt-2 text-sm text-gray-500">{audienceLabel}</Text>
        </View>

        {/* Budget & duration row – dynamic from budget store */}
        <View className="mt-6 px-4">
          <Text className="text-base font-semibold text-gray-900">
            Budget and duration
          </Text>
          <Text className="mt-2 text-sm text-gray-500">{budgetLabel}</Text>
        </View>

        {/* Payment method block (unchanged) */}
        <View className="mt-10 border-t border-gray-200 pt-6 px-4">
          <View className="flex-row items-center">
            <View className="h-8 w-12 items-center justify-center rounded-md bg-blue-700 mr-3">
              <Text className="text-xs font-semibold text-white">VISA</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                Payment method
              </Text>
              <Text className="mt-1 text-sm font-semibold text-[#4B4DED]">
                Add payment method
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-xs leading-4 text-gray-500">
            Ads are reviewed within 24 hours although, in some cases, it may
            take longer. Once they&apos;re running, you can pause spending at
            any time.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Boost post button */}
      <View className="px-3 pb-6">
        <Pressable
          className="h-12 items-center justify-center rounded-full bg-black"
          onPress={() => {
            // later: handle final submit / API call
            router.push("/(tabs)"); // placeholder
          }}>
          <Text className="text-base font-semibold text-white">Boost post</Text>
        </Pressable>

        <Text className="mt-4 px-2 text-center text-xs leading-4 text-gray-500">
          By creating ads, you agree to Instagram&apos;s{" "}
          <Text className="text-[#4B4DED]">Terms</Text> and{" "}
          <Text className="text-[#4B4DED]">Advertising Guidelines</Text>. All
          ads are listed in the{" "}
          <Text className="text-[#4B4DED]">Meta Ad Library</Text>.
        </Text>
      </View>
    </View>
  );
};

export default ReviewScreen;
