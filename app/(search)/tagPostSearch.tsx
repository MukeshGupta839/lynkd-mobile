import SearchPostsWithTags from "@/components/SearchPostsWithTags";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const TagPostSearch = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const glow = useSharedValue(0);
  const { tag } = useLocalSearchParams<{ tag?: string }>();

  const [searchQuery, setSearchQuery] = useState(tag || "");

  // Update search query when tag param changes
  useEffect(() => {
    if (tag) {
      setSearchQuery(tag);
    }
  }, [tag]);

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      glow.value,
      [0, 0.5, 1],
      ["#0F27BD", "#ffc202", "#3d576c"]
    );

    const shadowColor = interpolateColor(
      glow.value,
      [0, 0.5, 1],
      [
        "rgba(0, 255, 204, 0.5)",
        "rgba(255, 105, 180, 0.5)",
        "rgba(0, 255, 204, 0.5)",
      ]
    );

    return {
      borderColor,
      shadowColor,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 10,
      elevation: 10,
    };
  });

  return (
    <View className="flex-1 bg-[#F3F4F6]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row pb-2 items-center justify-between pr-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-2 h-10 w-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color="#111827"
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            {
              flex: 1,
              height: 40,
              borderWidth: 2,
              borderRadius: 10,
              paddingHorizontal: 15,
              backgroundColor: "white",
              flexDirection: "row",
              alignItems: "center",
            },
            animatedStyle,
          ]}
        >
          <AnimatedTextInput
            placeholder="Search hashtags..."
            placeholderTextColor="#9ca3af"
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "System",
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Ionicons name="search" size={20} color="#555" />
        </Animated.View>
      </View>

      {/* Hashtag Posts - No tabs, just direct content */}
      <SearchPostsWithTags tag={searchQuery} />
    </View>
  );
};

export default TagPostSearch;
