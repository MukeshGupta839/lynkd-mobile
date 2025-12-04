// app/(boost)/budgetDuration.tsx
import { DurationMode, useBoostStore } from "@/stores/useBoostStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 🔹 Info slides for the bottom sheet
const INFO_SLIDES = [
  {
    key: "budget",
    title: "Budget",
    body: "Your budget affects how many people see your ad. As you increase your ad budget, you grow the pool of people that you can reach. The minimum amount that you can spend varies based on your ad goal.",
  },
  {
    key: "duration",
    title: "Duration",
    body: "Duration determines when your ad ends and how it's delivered. The minimum duration depends on your ad goal.",
  },
  {
    key: "distribution",
    title: "Distribution",
    body: "Your ad will appear in Feed, Stories and Explore on Instagram. We’ll automatically adjust your post so that it's correctly formatted.",
  },
];

const BudgetDurationScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 🔹 Get budget slice from store
  const { budget, setBudget } = useBoostStore();

  // 🔹 Local state initialised from store
  const [dailyBudget, setDailyBudget] = useState(budget.dailyBudget ?? 10); // default 10
  const [durationMode, setDurationMode] = useState<DurationMode>(
    budget.durationMode ?? "run_until_paused"
  );
  const [durationDays, setDurationDays] = useState(budget.durationDays ?? 5); // default 5 days

  const isRunUntilPaused = durationMode === "run_until_paused";

  const adBudgetLabel = isRunUntilPaused
    ? `$${dailyBudget.toFixed(0)} daily`
    : `$${(dailyBudget * durationDays).toFixed(0)} over ${durationDays.toFixed(
        0
      )} days`;

  // 🔹 Dynamic reach calculations based on sliders
  const minReach = isRunUntilPaused
    ? Math.round(dailyBudget * 1800) // per-day base reach
    : Math.round(dailyBudget * durationDays * 900); // lower per-day multiplier but over more days

  const maxReach = isRunUntilPaused
    ? Math.round(dailyBudget * 4700)
    : Math.round(dailyBudget * durationDays * 2400);

  const estimatedReachLabel = `${minReach.toLocaleString()} - ${maxReach.toLocaleString()}`;

  // 🔹 info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoIndex, setInfoIndex] = useState(0);

  const closeInfoModal = () => {
    setShowInfoModal(false);
    setInfoIndex(0);
  };

  // 🔹 Awesome slider shared values
  // Daily budget slider: 1–100
  const budgetMin = useSharedValue(1);
  const budgetMax = useSharedValue(100);
  const budgetProgress = useSharedValue(dailyBudget);

  // Duration slider: 1–30
  const durationMin = useSharedValue(1);
  const durationMax = useSharedValue(30);
  const durationProgress = useSharedValue(durationDays);

  // 👉 On Next: make sure budget in store is fully in sync, then go to review
  const handleNext = () => {
    setBudget({
      dailyBudget,
      durationMode,
      durationDays: isRunUntilPaused ? null : durationDays,
    });

    router.push("/(boost)/review");
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with safe-area padding */}
      <View style={{ paddingTop: insets.top - 10 }}>
        {/* Header */}
        <View className="flex-row justify-between px-3 border-gray-200">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
            <Ionicons name="arrow-back" size={30} />
          </Pressable>

          <Text className="text-2xl font-semibold text-gray-900">
            Budget and duration
          </Text>

          {/* info icon -> open modal on first slide (Budget) */}
          <Pressable
            hitSlop={10}
            className="p-1"
            onPress={() => {
              setInfoIndex(0);
              setShowInfoModal(true);
            }}>
            <Ionicons name="information-circle-outline" size={30} />
          </Pressable>
        </View>

        {/* Progress bar – first 3 steps active */}
        <View className="flex-row items-center pt-2 pb-3">
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
          <View className="w-2" />
          <View className="h-0.5 flex-1 rounded-full bg-gray-200" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text className=" px-3 text-center text-xl font-semibold text-gray-900 pb-4">
          What&apos;s your ad budget ?
        </Text>

        {/* Daily budget */}
        <View className="mt-4 px-4">
          <Text className="text-base font-semibold text-gray-900">
            Daily budget
          </Text>
          <Text className="mt-2 text-lg text-gray-800">
            ${dailyBudget.toFixed(0)} daily
          </Text>

          {/* <Text className="mt-2 text-lg text-gray-800">
            ₹{dailyBudget.toFixed(0)} daily
          </Text> */}

          <View className="mt-4 w-full">
            <Slider
              minimumValue={budgetMin}
              maximumValue={budgetMax}
              progress={budgetProgress}
              step={1}
              // same style as other sliders: black track, black bubble, white text
              theme={{
                minimumTrackTintColor: "#000000", // black
                maximumTrackTintColor: "#E5E7EB", // light gray
                cacheTrackTintColor: "#111827",
                disableMinTrackTintColor: "#999999",
                bubbleBackgroundColor: "#000000",
                heartbeatColor: "#000000",
              }}
              // bubble shows integer only
              bubble={(value) => `${Math.round(value as number)}`}
              bubbleTextStyle={{ color: "#FFFFFF", fontWeight: "600" }}
              onValueChange={(value) => {
                const v = Math.round(value as number);
                setDailyBudget(v);
                budgetProgress.value = v;
                // 🔹 keep store in sync
                setBudget({ dailyBudget: v });
              }}
            />
          </View>
        </View>

        {/* Duration section */}
        <View className="mt-8 px-4">
          <Text className="text-base font-semibold text-gray-900">
            Duration
          </Text>

          {/* Option 1: run until paused */}
          <Pressable
            className="mt-4 flex-row items-center justify-between"
            onPress={() => {
              setDurationMode("run_until_paused");
              // store: mode + clear durationDays
              setBudget({
                durationMode: "run_until_paused",
                durationDays: null,
              });
            }}>
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-gray-900">
                Run this ad until you pause it
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Let your ad run for as long as you like. You can pause it at any
                time in ad tools.
              </Text>
            </View>

            <View className="items-center justify-center">
              <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400">
                {isRunUntilPaused && (
                  <View className="h-2.5 w-2.5 rounded-full bg-black" />
                )}
              </View>
            </View>
          </Pressable>

          {/* Option 2: set duration */}
          <Pressable
            className="mt-6 flex-row items-center justify-between"
            onPress={() => {
              setDurationMode("set_duration");
              // if store had null durationDays, keep current local or default 5
              const days = durationDays || 5;
              setDurationDays(days);
              setBudget({
                durationMode: "set_duration",
                durationDays: days,
              });
            }}>
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-gray-900">
                Set duration
              </Text>
            </View>

            <View className="items-center justify-center">
              <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400">
                {!isRunUntilPaused && (
                  <View className="h-2.5 w-2.5 rounded-full bg-black" />
                )}
              </View>
            </View>
          </Pressable>

          {/* Duration slider & label – only when "Set duration" is selected */}
          {!isRunUntilPaused && (
            <View className="mt-6 w-full">
              <Text className="text-base text-gray-900">
                {durationDays.toFixed(0)} days
              </Text>

              <View className="mt-4 w-full">
                <Slider
                  minimumValue={durationMin}
                  maximumValue={durationMax}
                  progress={durationProgress}
                  step={1}
                  theme={{
                    minimumTrackTintColor: "#000000", // black
                    maximumTrackTintColor: "#E5E7EB", // light gray
                    cacheTrackTintColor: "#111827",
                    disableMinTrackTintColor: "#999999",
                    bubbleBackgroundColor: "#000000",
                    heartbeatColor: "#000000",
                  }}
                  // bubble integer only
                  bubble={(value) => `${Math.round(value as number)}`}
                  bubbleTextStyle={{ color: "#FFFFFF", fontWeight: "600" }}
                  onValueChange={(value) => {
                    const v = Math.round(value as number);
                    setDurationDays(v);
                    durationProgress.value = v;
                    // 🔹 update store
                    setBudget({ durationDays: v });
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Ad budget summary card */}
        <View className="mt-10 border-t border-gray-200 px-4 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">
              Ad budget
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {adBudgetLabel}
            </Text>
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm text-gray-500">
              {isRunUntilPaused ? "Estimated daily reach" : "Estimated reach"}
            </Text>
            <Text className="text-sm text-gray-500">{estimatedReachLabel}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Next button – black */}
      <View className="px-3 pb-6">
        <Pressable
          className="h-12 items-center justify-center rounded-full bg-black"
          onPress={handleNext}>
          <Text className="text-base font-semibold text-white">Next</Text>
        </Pressable>
      </View>

      {/* 🔹 Info Modal (no drag indicator) */}
      <Modal
        transparent
        animationType="fade"
        visible={showInfoModal}
        onRequestClose={closeInfoModal}>
        <View className="flex-1 justify-end bg-black/40">
          {/* tap outside to close */}
          <Pressable className="flex-1" onPress={closeInfoModal} />

          <View className="bg-white rounded-t-3xl pt-6 pb-7">
            {/* Horizontal pager */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const page = e.nativeEvent.contentOffset.x / SCREEN_WIDTH || 0;
                setInfoIndex(Math.round(page));
              }}>
              {INFO_SLIDES.map((slide) => (
                <View
                  key={slide.key}
                  style={{ width: SCREEN_WIDTH }}
                  className="px-6 items-center">
                  <Text className="text-lg font-semibold text-gray-900 text-center">
                    {slide.title}
                  </Text>

                  <Text className="mt-4 text-sm text-gray-700 text-center leading-5">
                    {slide.body}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* dots with small gap, active = blue circle */}
            <View className="mt-6 mb-1 flex-row justify-center items-center">
              {INFO_SLIDES.map((slide, idx) => (
                <View
                  key={slide.key}
                  className={`h-2 w-2 rounded-full mx-1 ${
                    idx === infoIndex ? "bg-[#1877F2]" : "bg-gray-300"
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

export default BudgetDurationScreen;
