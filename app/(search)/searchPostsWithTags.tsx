// app/(search)/SearchPostsWithTags.tsx
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
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

const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

/* --------------------------------- SCREEN --------------------------------- */

const SearchPostsWithTags: React.FC = () => {
  const router = useRouter();
  const { tag } = useLocalSearchParams<{ tag?: string }>();

  const [searchQuery, setSearchQuery] = useState(tag ?? "#fashion");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // animated glow on the search bar border/shadow
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 3600,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const glowShadowColor = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      "rgba(16,24,39,0.18)",
      "rgba(99,102,241,0.28)",
      "rgba(16,24,39,0.18)",
    ],
  });
  const glowBorderColor = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#0F27BD", "#ffc202", "#3d576c"],
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

  const onToggleLike = (id: string) =>
    setPosts((cur) =>
      cur.map((p) =>
        p.id === id
          ? {
              ...p,
              likes: Math.max(0, p.likes + (Math.random() > 0.5 ? 1 : -1)),
            }
          : p
      )
    );

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
        style={{
          width: width * 0.82,
          height: 44,
          borderWidth: 2,
          borderRadius: 12,
          paddingHorizontal: 12,
          backgroundColor: "white",
          flexDirection: "row",
          alignItems: "center",
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 10,
          elevation: 5,
          borderColor: glowBorderColor as any,
          shadowColor: glowShadowColor as any,
          shadowOpacity: 0.9,
        }}
      >
        <Ionicons
          name="search"
          size={18}
          color="#6b7280"
          style={{ marginRight: 8 }}
        />
        <AnimatedTextInput
          placeholder="Search hashtags…"
          placeholderTextColor="#9ca3af"
          className="flex-1 text-[14px] text-zinc-800"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Animated.View>
    </View>
  );

  const ImageCard = (p: ImagePost) => {
    const ratioStyle =
      p.aspectRatio === "1:1"
        ? { aspectRatio: 1 }
        : p.aspectRatio === "4:5"
          ? { aspectRatio: 4 / 5 }
          : { aspectRatio: 16 / 9 };

    return (
      <View className="mb-3 overflow-hidden rounded-2xl bg-white">
        {/* header */}
        <View className="flex-row items-center justify-between px-3 py-3">
          <View className="flex-row items-center">
            <Image
              source={{ uri: p.userAvatar }}
              className="mr-2 h-8 w-8 rounded-full"
            />
            <Text className="text-[14px] font-semibold text-zinc-900">
              {p.username}
            </Text>
          </View>
          <TouchableOpacity className="rounded-full bg-zinc-100 px-3 py-1">
            <Text className="text-[11px] font-semibold text-zinc-800">
              Follow
            </Text>
          </TouchableOpacity>
        </View>

        {/* media */}
        <View className="w-full bg-zinc-200">
          <Image
            source={{ uri: p.imageUrl }}
            style={[{ width: width - 24 }, ratioStyle]}
          />
        </View>

        {/* footer */}
        <View className="px-3 pb-3 pt-2">
          <View className="mb-2 flex-row items-center">
            <TouchableOpacity
              onPress={() => onToggleLike(p.id)}
              className="mr-4 flex-row items-center"
            >
              <Ionicons name="heart-outline" size={22} color="#111827" />
              <Text className="ml-1 text-[13px] text-zinc-800">
                {k(p.likes)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="mr-4 flex-row items-center">
              <Ionicons name="chatbubble-outline" size={21} color="#111827" />
              <Text className="ml-1 text-[13px] text-zinc-800">
                {k(p.comments)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center">
              <Entypo name="forward" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          {!!p.caption && (
            <Text
              className="text-[13px] leading-5 text-zinc-900"
              numberOfLines={3}
            >
              <Text className="font-semibold">{p.username} </Text>
              {p.caption}
            </Text>
          )}

          {!!p.hashtags?.length && (
            <View className="mt-2 flex-row flex-wrap">
              {p.hashtags.map((h) => (
                <Pressable
                  key={h}
                  className="mr-2 mb-2 rounded-full bg-zinc-100 px-3 py-1"
                >
                  <Text className="text-[12px] font-medium text-zinc-800">
                    #{h}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const TextCard = (p: TextOnlyPost) => {
    return (
      <View className="mb-3 overflow-hidden rounded-2xl bg-white">
        {/* header */}
        <View className="flex-row items-center justify-between px-3 py-3">
          <View className="flex-row items-center">
            <Image
              source={{ uri: p.userAvatar }}
              className="mr-2 h-8 w-8 rounded-full"
            />
            <Text className="text-[14px] font-semibold text-zinc-900">
              {p.username}
            </Text>
          </View>
          <TouchableOpacity className="rounded-full bg-zinc-100 px-3 py-1">
            <Text className="text-[11px] font-semibold text-zinc-800">
              Follow
            </Text>
          </TouchableOpacity>
        </View>

        {/* body */}
        <View className="px-3 pb-3">
          <View
            className="w-full rounded-xl px-4 py-6"
            style={{ backgroundColor: p.bg ?? "#F4F4F5" }}
          >
            <Text className="text-[15px] leading-6 text-zinc-900">
              {p.text}
            </Text>
          </View>

          <View className="mt-3 mb-1 flex-row items-center">
            <TouchableOpacity
              onPress={() => onToggleLike(p.id)}
              className="mr-4 flex-row items-center"
            >
              <Ionicons name="heart-outline" size={22} color="#111827" />
              <Text className="ml-1 text-[13px] text-zinc-800">
                {k(p.likes)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="mr-4 flex-row items-center">
              <Ionicons name="chatbubble-outline" size={21} color="#111827" />
              <Text className="ml-1 text-[13px] text-zinc-800">
                {k(p.comments)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center">
              <Entypo name="forward" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          {!!p.hashtags?.length && (
            <View className="mt-1 flex-row flex-wrap">
              {p.hashtags.map((h) => (
                <Pressable
                  key={h}
                  className="mr-2 mb-2 rounded-full bg-zinc-100 px-3 py-1"
                >
                  <Text className="text-[12px] font-medium text-zinc-800">
                    #{h}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: PostItem }) =>
    item.textPost
      ? TextCard(item as TextOnlyPost)
      : ImageCard(item as ImagePost);

  return (
    <SafeAreaView className="flex-1 bg-zinc-100">
      <View className="px-3 pt-2">{Header}</View>

      {loading ? (
        <View className="mt-8 items-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default SearchPostsWithTags;
