// app/(boost)/interests.tsx
import SearchBar from "@/components/Searchbar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ESTIMATED_MIN = "410.3M";
const ESTIMATED_MAX = "482.6M";

// Dummy list – replace with API later
const INTERESTS: { id: string; label: string }[] = [
  { id: "fashion", label: "Fashion" },
  { id: "beauty", label: "Beauty" },
  { id: "fitness", label: "Fitness & wellness" },
  { id: "travel", label: "Travel" },
  { id: "food", label: "Food & restaurants" },
  { id: "technology", label: "Technology" },
  { id: "gaming", label: "Gaming" },
  { id: "music", label: "Music" },
  { id: "sports", label: "Sports" },
  { id: "shopping", label: "Online shopping" },
  { id: "pets", label: "Pets & animals" },
  { id: "parenting", label: "Parenting" },
  { id: "automotive", label: "Automotive" },
  { id: "finance", label: "Personal finance" },
  { id: "education", label: "Education" },
  { id: "art", label: "Art & design" },
  { id: "photography", label: "Photography" },
  { id: "outdoors", label: "Outdoors & adventure" },
  { id: "health", label: "Health & nutrition" },
  { id: "movies", label: "Movies & TV shows" },
];

const InterestsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🔍 Show ALL when no search, filter when typing
  const filteredInterests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return INTERESTS;
    return INTERESTS.filter((item) => item.label.toLowerCase().includes(q));
  }, [search]);

  const toggleInterest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedItems = INTERESTS.filter((i) => selectedIds.includes(i.id));

  const handleDone = () => {
    // later you can push selected interests to Zustand / backend
    router.back();
  };

  const hasSearch = search.trim().length > 0;

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with custom safe-area padding */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <View className="flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={28} />
          </Pressable>

          <Text className="text-xl font-semibold text-gray-900">Interests</Text>

          <Pressable onPress={handleDone} className="p-1">
            <Ionicons name="checkmark" size={26} />
          </Pressable>
        </View>
      </View>

      {/* Content area (fixed + scrollable list inside) */}
      <View className="flex-1 px-4 pb-10">
        {/* Estimated audience size */}
        <View className="mt-8 items-center">
          <Text className="text-3xl font-semibold text-gray-900">
            {ESTIMATED_MIN} - {ESTIMATED_MAX}
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            Estimated audience size
          </Text>
        </View>

        {/* Selected chips – always visible when you have selections */}
        {selectedItems.length > 0 && (
          <View className="mt-8">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Selected interests
            </Text>
            <View className="flex-row flex-wrap">
              {selectedItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleInterest(item.id)}
                  className="mr-2 mb-2 flex-row items-center rounded-full bg-gray-100 px-3 py-1">
                  <Text className="text-sm text-gray-900 mr-1">
                    {item.label}
                  </Text>
                  <Ionicons name="close" size={14} color="#6B7280" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Search bar */}
        <View className="mt-8">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search interests"
            borderRadius={20}
            className="border border-gray-300"
          />
        </View>

        {/* Helper text when search empty */}
        {!hasSearch && (
          <Text className="mt-4 text-sm text-gray-500">
            We suggest adding a broad range of interests to cover the largest
            audience.
          </Text>
        )}

        {/* 👉 Scrollable LIST only */}
        <ScrollView
          className="mt-6 flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {filteredInterests.length === 0 ? (
            <Text className="mt-4 text-sm text-gray-500">
              No interests found. Try a different search.
            </Text>
          ) : (
            filteredInterests.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleInterest(item.id)}
                  className="py-3 flex-row items-center justify-between">
                  <Text className="text-base text-gray-900">{item.label}</Text>

                  <View
                    className={`h-5 w-5 rounded-sm items-center justify-center ${
                      selected ? "bg-black" : "border border-gray-400 bg-white"
                    }`}>
                    {selected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default InterestsScreen;
