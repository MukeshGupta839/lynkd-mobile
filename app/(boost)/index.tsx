// app/(boost)/index.tsx
import {
  GoalId,
  PreferenceId,
  useBoostStore,
  WebsiteActionId,
} from "@/stores/useBoostStore";
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
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// dummy values – later you can replace with API data
const DUMMY_USERNAME = "@srikant_197";

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

const GOALS: {
  id: GoalId;
  title: string;
  description: string;
  username?: string;
}[] = [
  {
    id: "profile",
    title: "Visit your profile",
    description: "Best for brand awareness and follows",
    username: DUMMY_USERNAME,
  },
  {
    id: "website",
    title: "Visit your website",
    description:
      "Best for online sales, bookings and helping people learn more about you",
  },
  {
    id: "message",
    title: "Message you",
    description: "Best for Lynkd  that can get you leads and sales",
  },
  {
    id: "mix",
    title: "A mix of actions",
    description:
      "Best for multiple goals including engagement, follows and more to help drive overall performance",
  },
];

// slides for bottom sheet (order like Instagram)
const INFO_SLIDES = [
  {
    id: "reach",
    title: "Reach new people",
    body: "Increase your reach by boosting a post to people who don't currently follow you. We'll automatically format your post for feed, stories and Explore, and run it wherever it's performing best.",
  },
  {
    id: "profile",
    title: "More profile visits",
    body: "Select this option if your profile showcases products, services, a portfolio or a brand.\n\nTip: You might send people to your profile if you want people to see more of your content and start to follow you.",
  },
  {
    id: "website",
    title: "More website visits",
    body: 'Select this option if you want people to do things such as browse an online store, learn more about an event or sign up for a special offer or mailing list.\n\nTip: If you choose this goal, you can choose call-to-action buttons, such as "Learn more" or "Shop now".',
  },
  {
    id: "messages",
    title: "More messages",
    body: "Select this option if you provide services and want customers to enquire about requests, appointments or consultations.\n\nTip: If you select messages as a goal, try asking a question or using a conversation starter in your caption to encourage interaction.",
  },
  {
    id: "mix",
    title: "A mix of actions",
    body: "Select this option as your ad goal and let us take care of the rest. We'll show your ad to people who are most likely to take a variety of actions to help drive overall performance.",
  },
] as const;

type InfoSlideId = (typeof INFO_SLIDES)[number]["id"];

const getInfoButtonLabel = (id: InfoSlideId) => {
  switch (id) {
    case "profile":
      return "Select your profile";
    case "website":
      return "Select a website";
    case "messages":
      return "Select your messages";
    case "mix":
      return "Select this option";
    default:
      return "";
  }
};

const BoostGoalScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { goal, website, websiteAction, preference, setGoal, reset } =
    useBoostStore();

  const selectedGoal = goal; // single source of truth from Zustand

  const websiteToShow = website;
  const websiteActionLabel = ACTION_LABELS[websiteAction];

  const preferredGoalText =
    preference && PREFERENCE_LABELS[preference]
      ? `Preferred goal (optional): ${PREFERENCE_LABELS[preference]}`
      : "Preferred goal (optional): None selected";

  // bottom sheet state
  const [showInfo, setShowInfo] = useState(false);
  const [infoIndex, setInfoIndex] = useState(0);

  const handleInfoOpen = () => {
    setInfoIndex(0);
    setShowInfo(true);
  };

  const handleInfoClose = () => setShowInfo(false);

  const handleClose = () => {
    reset();
    router.back();
  };

  // what each black button should do (inside info bottom sheet)
  const handleSlideAction = (id: InfoSlideId) => {
    switch (id) {
      case "profile":
        setGoal("profile");
        break;
      case "website":
        setGoal("website");
        router.push("/(boost)/websiteGoal");
        break;
      case "messages":
        setGoal("message");
        break;
      case "mix":
        setGoal("mix");
        router.push("/(boost)/preferencesGoal");
        break;
      case "reach":
      default:
        break;
    }

    setShowInfo(false);
  };

  const handleInfoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const idx = Math.round(contentOffset.x / layoutMeasurement.width);
    if (idx !== infoIndex) {
      setInfoIndex(idx);
    }
  };

  const currentSlide = INFO_SLIDES[infoIndex];
  const showStickyButton = currentSlide.id !== "reach";

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with custom paddingTop instead of SafeAreaView */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3">
          <Pressable onPress={handleClose} hitSlop={10} className="p-1">
            <Ionicons name="close" size={30} />
          </Pressable>

          <Text className="text-2xl font-semibold text-gray-900">Goal</Text>

          <Pressable hitSlop={10} className="p-1" onPress={handleInfoOpen}>
            <Ionicons name="information-circle-outline" size={30} />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View className="flex-row items-center pt-2 pb-3">
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
          <View className="w-2" />
          <View className="h-0.5 flex-1 rounded-full bg-gray-200" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className=" px-3 text-center text-xl font-semibold text-gray-900 pb-4">
          What do you want people to do when they see your ad ?
        </Text>

        {/* Goals list */}
        <View className=" px-3 ">
          <View className="overflow-hidden rounded-xl bg-white px-3">
            {GOALS.map((goalItem) => (
              <Pressable
                key={goalItem.id}
                onPress={() => {
                  setGoal(goalItem.id);
                }}
                className="flex-row items-center justify-between py-4">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-semibold text-gray-900">
                    {goalItem.title}
                  </Text>

                  <Text className="mt-1 text-sm text-gray-600">
                    {goalItem.description}
                  </Text>

                  {goalItem.id === "profile" &&
                    selectedGoal === "profile" &&
                    goalItem.username && (
                      <Text className="mt-3 text-sm text-gray-400">
                        {goalItem.username}
                      </Text>
                    )}

                  {goalItem.id === "website" && selectedGoal === "website" && (
                    <View className="mt-3">
                      <Text className="text-sm text-gray-500">
                        {websiteToShow}
                      </Text>
                      <Text className="mt-1 text-sm text-gray-500">
                        Action button: {websiteActionLabel}
                      </Text>
                      <Text
                        className="mt-1 text-sm font-semibold text-[#4B4DED]"
                        onPress={() => router.push("/(boost)/websiteGoal")}>
                        Edit
                      </Text>
                    </View>
                  )}

                  {goalItem.id === "mix" && selectedGoal === "mix" && (
                    <View className="mt-3">
                      <Text className="text-sm text-gray-500">
                        {preferredGoalText}
                      </Text>
                      <Text
                        className="mt-1 text-sm font-semibold text-[#4B4DED]"
                        onPress={() => router.push("/(boost)/preferencesGoal")}>
                        Edit
                      </Text>
                    </View>
                  )}
                </View>

                <View className="items-center justify-center">
                  <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400">
                    {selectedGoal === goalItem.id && (
                      <View className="h-2.5 w-2.5 rounded-full bg-gray-900" />
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View className="px-3 pb-6">
        <Pressable
          className="h-12 items-center justify-center rounded-full bg-black"
          onPress={() => {
            router.push("/(boost)/audience");
          }}>
          <Text className="text-base font-semibold text-white">Next</Text>
        </Pressable>
      </View>

      {/* INFO BOTTOM SHEET */}
      <Modal
        visible={showInfo}
        transparent
        animationType="slide"
        onRequestClose={handleInfoClose}>
        <View className="flex-1 justify-end bg-black/40">
          {/* tap outside to close */}
          <Pressable className="flex-1" onPress={handleInfoClose} />

          <View className="bg-white rounded-t-3xl pt-2 pb-6">
            {/* horizontal pager */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleInfoScroll}>
              {INFO_SLIDES.map((slide) => (
                <View key={slide.id} className="w-screen px-6 pt-4 pb-2">
                  <Text className="text-center text-lg font-semibold text-gray-900">
                    {slide.title}
                  </Text>

                  <Text className="mt-4 text-sm text-gray-700 leading-relaxed">
                    {slide.body}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* sticky button area: from dots to pt-2 */}
            {showStickyButton ? (
              <View className="px-6 pt-2">
                <Pressable
                  className="h-11 items-center justify-center rounded-full bg-black"
                  onPress={() => handleSlideAction(currentSlide.id)}>
                  <Text className="text-sm font-semibold text-white">
                    {getInfoButtonLabel(currentSlide.id)}
                  </Text>
                </Pressable>
              </View>
            ) : (
              // keep same height when no button (reach slide)
              <View className="px-6 pt-2 h-11" />
            )}

            {/* dots: circles with small gaps */}
            <View className="mt-4 mb-2 flex-row items-center justify-center">
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

export default BoostGoalScreen;
