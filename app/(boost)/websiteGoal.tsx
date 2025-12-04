// app/(boost)/websiteGoal.tsx
import SearchBar from "@/components/Searchbar"; // ⬅️ adjust path if needed
import { useBoostStore, WebsiteActionId } from "@/stores/useBoostStore"; // ⬅️ adjust path if needed
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ActionId = WebsiteActionId;

const ACTIONS: { id: ActionId; label: string }[] = [
  { id: "learn_more", label: "Learn more" },
  { id: "shop_now", label: "Shop now" },
  { id: "watch_more", label: "Watch more" },
  { id: "contact_us", label: "Contact us" },
  { id: "book_now", label: "Book now" },
  { id: "sign_up", label: "Sign up" },
];

const isValidUrl = (value: string) => {
  const v = value.trim();
  if (!v) return false;
  // simple check: starts with http/https/www and has a dot
  const regex = /^(https?:\/\/|www\.)\S+\.\S+$/i;
  return regex.test(v);
};

const WebsiteGoalScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { website: storeWebsite, websiteAction, setWebsite } = useBoostStore();

  // use store values as initial
  const [website, setWebsiteLocal] = useState(storeWebsite);
  const [selectedAction, setSelectedAction] = useState<ActionId>(websiteAction);
  const [touched, setTouched] = useState(false); // user tried to use screen

  const valid = isValidUrl(website);
  const showError = touched && !valid;

  const handleSelectAction = (id: ActionId) => {
    setSelectedAction(id);
    if (!website.trim()) {
      // user interacted without URL -> show error
      setTouched(true);
    }
  };

  const handleDone = () => {
    if (!valid) {
      setTouched(true);
      return;
    }

    // ✅ Save to global Boost store
    setWebsite(website.trim(), selectedAction);

    // Just go back to Goal screen – it reads from store
    router.back();
  };

  // Tailwind-like class for SearchBar border based on error state
  const searchBarClassName = showError
    ? "border border-red-500"
    : "border border-gray-300";

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with insets instead of SafeAreaView */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3 pb-2 border-b border-gray-200">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1">
            <Ionicons name="arrow-back" size={30} />
          </Pressable>

          <Text className="text-2xl font-semibold text-gray-900">
            Website goal setup
          </Text>

          <Pressable hitSlop={10} className="p-1" onPress={handleDone}>
            <Text className="text-xl font-semibold text-blue-500">Done</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 pb-6"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text className="mt-5 mb-4 text-lg font-semibold text-gray-900">
          Add URL and action button
        </Text>

        {/* Website field – using your SearchBar */}
        <View>
          <SearchBar
            placeholder="Website"
            value={website}
            borderRadius={16}
            className={searchBarClassName}
            onChangeText={(text: string) => {
              setWebsiteLocal(text);
              if (!touched) setTouched(true);
            }}
          />
          {showError && (
            <Text className="mt-2 text-sm font-medium text-red-500">
              Required field
            </Text>
          )}
        </View>

        {/* Action button section */}
        <Text className="mt-6 mb-2 text-base font-semibold text-gray-900">
          Action button
        </Text>

        <View className="bg-white px-3">
          {ACTIONS.map((action, index) => (
            <Pressable
              key={action.id}
              onPress={() => handleSelectAction(action.id)}
              className={`flex-row items-center justify-between py-5 ${
                index !== ACTIONS.length - 1 ? "" : ""
              }`}>
              <Text className="text-base text-gray-900">{action.label}</Text>

              <View className="items-center justify-center">
                <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300">
                  {selectedAction === action.id && (
                    <View className="h-2.5 w-2.5 rounded-full bg-black" />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default WebsiteGoalScreen;
