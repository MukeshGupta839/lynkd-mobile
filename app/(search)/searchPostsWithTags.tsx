// app/(search)/SearchPostsWithTags.tsx
import { PostCard } from "@/components/PostCard";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type BasePost = {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  caption?: string;
  createdAt: string;
  likes: number;
  comments: number;
  hashtags?: string[];
  textPost?: boolean;
};

type ImagePost = BasePost & {
  textPost?: false;
  imageUrl: string;
  aspectRatio?: "1:1" | "4:5" | "16:9";
};

type TextOnlyPost = BasePost & {
  textPost: true;
  text: string;
  bg?: string; // background color
};

type PostItem = ImagePost | TextOnlyPost;

/* -------------------------- MOCK HELPERS (UI ONLY) ------------------------- */

const mockImage = (i: number) =>
  `https://picsum.photos/seed/search-${i}/900/900`;

const makeMockPosts = (count = 8): PostItem[] =>
  Array.from({ length: count }, (_, i) => {
    const isText = i % 4 === 2;
    if (isText) {
      return {
        id: `post_${i}`,
        userId: `user_${i}`,
        username: ["maya", "alex", "jordan", "sam"][i % 4],
        userAvatar: `https://i.pravatar.cc/100?u=user_${i}`,
        createdAt: new Date(Date.now() - i * 36e5).toISOString(),
        likes: Math.floor(Math.random() * 1200),
        comments: Math.floor(Math.random() * 200),
        hashtags: ["fashion", "street", "ootd", "sale"].slice(0, (i % 4) + 1),
        textPost: true,
        text: "the new features include a new ability for a player and a more advanced ability for a player who is more familiar…",
        bg: ["#F5F3FF", "#EEF2FF", "#ECFDF5", "#FFF7ED"][i % 4],
      };
    }
    return {
      id: `post_${i}`,
      userId: `user_${i}`,
      username: ["maya", "alex", "jordan", "sam"][i % 4],
      userAvatar: `https://i.pravatar.cc/100?u=user_${i}`,
      createdAt: new Date(Date.now() - i * 36e5).toISOString(),
      likes: Math.floor(Math.random() * 1200),
      comments: Math.floor(Math.random() * 200),
      hashtags: ["tech", "creator", "travel", "life"].slice(0, (i % 4) + 1),
      textPost: false,
      imageUrl: mockImage(i),
      aspectRatio: (["1:1", "4:5", "16:9"] as const)[i % 3],
    };
  });

/* --------------------------------- SCREEN --------------------------------- */

const SearchPostsWithTags: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tag } = useLocalSearchParams<{ tag?: string }>();

  const [searchQuery, setSearchQuery] = useState(tag ?? "#fashion");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // animated glow on the search bar border/shadow using Reanimated
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 3200 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const shadowColor = interpolateColor(
      glow.value,
      [0, 0.5, 1],
      [
        "rgba(0, 255, 204, 0.5)",
        "rgba(255, 105, 180, 0.5)",
        "rgba(0, 255, 204, 0.5)",
      ]
    );
    const borderColor = interpolateColor(
      glow.value,
      [0, 0.5, 1],
      ["#0F27BD", "#ffc202", "#3d576c"]
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

  // simulate “fetch on type”
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setPosts(makeMockPosts(10));
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Create a simple pan gesture for PostCard (required prop)

  const filtered = useMemo(() => posts, [posts]);

  /* ------------------------------ RENDER ITEMS ----------------------------- */

  const Header = (
    <View className="flex-row items-center justify-between">
      <TouchableOpacity
        onPress={() => router.back()}
        className="mr-2 h-10 w-10 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color="#111827" />
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
  );

  // Create a simple pan gesture for PostCard (required prop)
  const panGesture = Gesture.Pan();

  // Transform the post data to match PostCard's expected format
  const transformPostData = (post: PostItem) => {
    const baseData = {
      id: post.id,
      user_id: post.userId,
      username: post.username,
      userProfilePic: post.userAvatar || "https://via.placeholder.com/40",
      caption: post.caption || "",
      postDate: post.createdAt,
      likes_count: post.likes,
      comments_count: post.comments,
      post_hashtags: post.hashtags || [],
      location: "",
      is_creator: false,
      affiliated: false,
      affiliation: null,
    };

    if (post.textPost) {
      // Text post - no media
      return {
        ...baseData,
        media: undefined,
      };
    } else {
      // Image post
      return {
        ...baseData,
        media: {
          type: "images" as const,
          uris: [(post as ImagePost).imageUrl],
        },
      };
    }
  };

  const renderItem = ({ item }: { item: PostItem }) => (
    <PostCard
      item={transformPostData(item)}
      isVisible={true}
      onLongPress={() => {}}
      isGestureActive={false}
      panGesture={panGesture}
      onPressComments={() => {}}
    />
  );

  return (
    <View className="flex-1 bg-zinc-100" style={{ paddingTop: insets.top }}>
      <View className="pr-3 py-2">{Header}</View>

      {loading ? (
        <View className="mt-8 items-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom:
              Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default SearchPostsWithTags;
