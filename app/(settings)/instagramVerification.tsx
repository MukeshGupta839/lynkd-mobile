// app/(onboarding)/InstagramVerification.tsx
import InstagramIcon from "@/assets/images/Instagram.png";
import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InstaPost = {
  id: string;
  photoPreview: string;
  mediaURL?: string;
  type?: "GraphImage" | "GraphVideo" | string;
  likes: number;
  views: number;
};

type InstagramData = {
  profilePic?: string;
  fullName?: string;
  followers: number;
  posts: InstaPost[];
};

type Props = {
  onNext?: () => void;
  /** If provided, used to fetch Instagram data */
  fetchInstagramData?: (username: string) => Promise<InstagramData>;
  /** If provided, used to upload posts */
  uploadInstaPosts?: (posts: InstaPost[]) => Promise<void>;
  /** Optional: called when you just want to link without minimum followers */
  linkInstagramAccount?: () => Promise<void>;
};

/** --- small helper formatters --- */
const kFormatter = (num: number) => {
  const n = Math.abs(num);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k`;
  return `${n}`;
};

/** A tiny mock so the screen works out of the box if you don't pass handlers */
const mockFetch = async (username: string): Promise<InstagramData> => {
  await new Promise((r) => setTimeout(r, 600));
  const posts: InstaPost[] = Array.from({ length: 9 }, (_, i) => ({
    id: `post_${i}`,
    photoPreview: `https://picsum.photos/seed/insta-${i}/400/400`,
    type: i % 3 === 0 ? "GraphVideo" : "GraphImage",
    likes: Math.floor(Math.random() * 5_000_000),
    views: Math.floor(Math.random() * 30_000_000),
  }));
  return {
    profilePic: `https://i.pravatar.cc/100?u=${username}`,
    fullName: `${username} • Demo`,
    followers: 123456,
    posts,
  };
};

const InstagramVerificationComponent: React.FC<Props> = ({
  onNext,
  fetchInstagramData,
  uploadInstaPosts,
  linkInstagramAccount,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [usernameInput, setUsernameInput] = useState("");
  const [instagramData, setInstagramData] = useState<InstagramData | null>(
    null
  );
  const [selectedPosts, setSelectedPosts] = useState<Record<string, boolean>>(
    {}
  );
  const [denied] = useState(false); // keep your flag; UI shows waitlist when true
  const [isLoading, setIsLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const [isCardVisible, setCardVisible] = useState(false);

  // slide-in
  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isCardVisible ? 0 : 500,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isCardVisible, slideAnim]);

  // type → debounce fetch
  useEffect(() => {
    if (!usernameInput) {
      handleReset();
      return;
    }
    const t = setTimeout(() => {
      if (usernameInput.length > 2) handleFindAccount();
    }, 800);
    return () => clearTimeout(t);
  }, [usernameInput]);

  const handleFindAccount = async () => {
    setIsLoading(true);
    try {
      const data = await (fetchInstagramData ?? mockFetch)(usernameInput);
      setInstagramData(data);
    } catch (e) {
      console.error("fetchInstagramData error", e);
      setInstagramData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInstagramData(null);
    setSelectedPosts({});
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const selectedArray = (): InstaPost[] =>
    instagramData?.posts?.filter((p) => selectedPosts[p.id]) ?? [];

  const handleConfirm = async () => {
    if (!instagramData) return;
    setIsLoading(true);
    try {
      // demo rule: if followers > 100 => import (and if provided, call uploadInstaPosts)
      if (instagramData.followers > 100) {
        onNext?.();

        const postsToUpload =
          Object.values(selectedPosts).some(Boolean) && instagramData.posts
            ? selectedArray()
            : instagramData.posts;

        if (uploadInstaPosts) await uploadInstaPosts(postsToUpload);
      } else {
        if (linkInstagramAccount) await linkInstagramAccount();
        onNext?.();
      }
    } catch (e) {
      console.error("confirm/link/import error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const profileImageSource = instagramData?.profilePic
    ? { uri: instagramData.profilePic }
    : undefined;

  const renderInstaItem = (post: InstaPost) => {
    const isSelected = !!selectedPosts[post.id];
    return (
      <TouchableOpacity
        key={post.id}
        className="relative my-1 w-[31%]"
        onPress={() => togglePostSelection(post.id)}
        activeOpacity={0.8}
      >
        <View className="overflow-hidden rounded-md">
          <Image
            source={{ uri: post.photoPreview }}
            style={{ width: "100%", height: 120 }}
          />
        </View>

        {/* selection overlay */}
        <View
          className={[
            "absolute inset-0 items-center justify-center rounded-md",
            isSelected ? "bg-black/50" : "bg-transparent",
          ].join(" ")}
        >
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          )}
        </View>

        {post.type === "GraphVideo" && (
          <View className="absolute right-1.5 top-1.5">
            <Ionicons name="play" size={18} color="#fff" />
          </View>
        )}

        <View className="mt-1.5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="eye" size={12} color="#333" />
            <Text className="ml-1 text-[12px] font-semibold text-zinc-800">
              {kFormatter(post.views)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="heart" size={12} color="#333" />
            <Text className="ml-1 text-[12px] font-semibold text-zinc-800">
              {kFormatter(post.likes)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInstagramTopPosts = (postsData: InstaPost[]) => {
    const allSelected = postsData.every((p) => !!selectedPosts[p.id]);
    return (
      <>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[16px] font-semibold text-zinc-800">
            Select posts to import
          </Text>
          <TouchableOpacity
            onPress={() => {
              const next: Record<string, boolean> = {};
              postsData.forEach((p) => (next[p.id] = !allSelected));
              setSelectedPosts(next);
            }}
          >
            <Text className="text-[14px] font-medium text-indigo-700">
              {allSelected ? "Deselect All" : "Select All"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-5 mt-2 flex-row flex-wrap items-center justify-between gap-y-2">
          {postsData.map(renderInstaItem)}
        </View>

        {Object.values(selectedPosts).some(Boolean) && (
          <Text className="text-center text-[14px] text-zinc-700">
            {Object.values(selectedPosts).filter(Boolean).length} posts selected
          </Text>
        )}
      </>
    );
  };

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <ScreenHeaderBack
          onBack={() => {
            router.back();
          }}
        />
        {!denied ? (
          <View className="px-4 pb-6 pt-2">
            {/* Collab header */}
            <View className="mt-5 flex-row items-center">
              <Image source={InstagramIcon} style={{ width: 24, height: 24 }} />
              <Text className="mx-2 text-[18px] font-light">X</Text>
              {profileImageSource ? (
                <Image
                  source={profileImageSource}
                  style={{ width: 25, height: 25, borderRadius: 50 }}
                  onError={() => handleReset()}
                />
              ) : (
                <View className="h-[25px] w-[25px] rounded-full bg-zinc-200" />
              )}
            </View>

            <Text className="mt-4 text-[22px] font-semibold text-zinc-900">
              Import content from Instagram
            </Text>

            {/* Username input (PaperTextInput) */}
            <View className="mt-4">
              <PaperTextInput
                label="Instagram Username"
                value={usernameInput}
                onChangeText={setUsernameInput}
                onBlur={handleFindAccount}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                theme={{ colors: { background: "white" }, roundness: 12 }}
                outlineColor={
                  usernameInput.length === 0 ? "#bdbdbd" : "#111827"
                }
                activeOutlineColor="#111827"
                left={<PaperTextInput.Icon icon="account" />}
                right={
                  usernameInput ? (
                    <PaperTextInput.Icon
                      icon="magnify"
                      onPress={handleFindAccount}
                    />
                  ) : undefined
                }
              />
            </View>

            {/* Profile row + Import */}
            {!!instagramData && (
              <View className="mt-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  {profileImageSource ? (
                    <Image
                      source={profileImageSource}
                      className="h-12 w-12 rounded-full"
                      style={{ borderWidth: 2, borderColor: "#4338ca" }}
                    />
                  ) : (
                    <View className="h-12 w-12 rounded-full bg-zinc-200" />
                  )}
                  <View>
                    <Text className="text-[18px] font-semibold text-zinc-800">
                      {instagramData.fullName || "—"}
                    </Text>
                    <Text className="text-[15px] text-zinc-700">
                      {kFormatter(instagramData.followers)} Followers
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={isLoading}
                  onPress={handleConfirm}
                  className={[
                    "rounded-full px-5 py-2",
                    isLoading ? "bg-zinc-400" : "bg-black",
                  ].join(" ")}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-[12px] font-bold text-white">
                      Import
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Posts grid */}
            {!!instagramData?.posts?.length &&
              renderInstagramTopPosts(instagramData.posts)}

            {isLoading && (
              <ActivityIndicator color="#000" size="large" className="mt-5" />
            )}
          </View>
        ) : (
          <View className="h-[400px] justify-between bg-white px-4 py-8">
            <TouchableOpacity className="absolute left-3 top-3">
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <View>
              <View className="mb-5 self-center rounded-full bg-red-100 p-6">
                <Ionicons
                  name="information-circle-outline"
                  size={100}
                  color="red"
                />
              </View>
              <Text className="mb-2 text-center text-[17px] font-semibold">
                Oops!
              </Text>
              <Text className="text-center text-[13px] text-zinc-400">
                It seems you&apos;re not eligible at the moment. You can still
                join the waitlist.
              </Text>
            </View>

            <TouchableOpacity className="mt-4 h-12 items-center justify-center rounded-xl bg-black">
              <Text className="font-semibold text-white">Join Waitlist</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default InstagramVerificationComponent;
