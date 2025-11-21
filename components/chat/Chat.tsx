// app/(tabs)/chat.tsx
import SearchBar from "@/components/Searchbar"; // your SearchBar component
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  CHAT_LIST_DUMMY,
  ChatItem,
  DEFAULT_AVATAR,
  LOGGED_USER,
  User,
  USERS,
} from "@/constants/chat";

type StoryBubbleProps = {
  user: User;
  onOpen: (u: User) => void;
  onOpenProfile: (img?: string) => void;
};
const StoryBubble = memo<StoryBubbleProps>(
  ({ user, onOpen, onOpenProfile }) => {
    return (
      <View className="items-center">
        <Pressable
          onPress={() =>
            user.hasStory ? onOpen(user) : onOpenProfile(user.profile_picture)
          }
          accessibilityLabel={`${user.username} story or profile`}
          className="items-center"
        >
          {user.hasStory ? (
            <LinearGradient
              colors={["#f58529", "#dd2a7b", "#8134af", "#515bd4"]}
              start={[0, 0]}
              end={[1, 1]}
              className="rounded-full"
              style={{ padding: 2, borderRadius: 999 }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center bg-white">
                <Image
                  source={{ uri: user.profile_picture ?? DEFAULT_AVATAR }}
                  className="w-14 h-14 rounded-full"
                />
              </View>
            </LinearGradient>
          ) : (
            <View className="w-16 h-16 rounded-full items-center justify-center">
              <Image
                source={{ uri: user.profile_picture ?? DEFAULT_AVATAR }}
                className="w-14 h-14 rounded-full"
              />
            </View>
          )}
        </Pressable>
        <Text className="text-xs text-gray-600 mt-1">
          {user.username.split(".")[0]}
        </Text>
      </View>
    );
  }
);
StoryBubble.displayName = "StoryBubble";

type ChatRowProps = {
  item: ChatItem;
  onOpenChat: (u: User) => void;
  onOpenProfile: (img?: string) => void;
};
const ChatRow = memo<ChatRowProps>(({ item, onOpenChat, onOpenProfile }) => {
  const otherUser =
    item.sender.id === LOGGED_USER.id ? item.receiver : item.sender;
  const displayName =
    otherUser.username.charAt(0).toUpperCase() + otherUser.username.slice(1);

  // prefer explicit unreadCount if present, otherwise fallback to boolean unread -> 1
  const unreadCount = (item as any).unreadCount ?? (item.unread ? 1 : 0);

  return (
    <Pressable
      onPress={() => onOpenChat(otherUser)}
      className="flex-row items-center px-3 py-3 border-b border-gray-100"
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${displayName}`}
    >
      <View className="relative">
        <Pressable
          onPress={() => onOpenProfile(otherUser.profile_picture)}
          accessibilityLabel={`${displayName} profile`}
        >
          <Image
            source={{ uri: otherUser.profile_picture ?? DEFAULT_AVATAR }}
            className="w-12 h-12 rounded-full"
          />
        </Pressable>
      </View>

      <View className="flex-1 ml-3">
        <Text
          className={`text-base ${
            item.unread ? "font-bold text-black" : "font-medium text-black"
          }`}
        >
          {displayName}
        </Text>
        <Text
          className={`text-sm ${item.unread ? "text-black" : "text-gray-500"}`}
        >
          {item.content
            ? item.content.length > 30
              ? item.content.slice(0, 30) + "..."
              : item.content
            : ""}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-xs text-gray-700">
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {/* Unread badge (number) */}
        {unreadCount > 0 ? (
          <View className="mt-1 bg-black rounded-full px-2 py-0.5 items-center justify-center">
            <Text className="text-white text-xs font-semibold">
              {unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
ChatRow.displayName = "ChatRow";

export default function Chats() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [chatList] = useState<ChatItem[]>(CHAT_LIST_DUMMY);

  // search state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // profile modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileModalImage, setProfileModalImage] = useState<string | null>(
    null
  );
  const openProfileModal = useCallback((imageUri?: string) => {
    setProfileModalImage(imageUri ?? DEFAULT_AVATAR);
    setProfileModalVisible(true);
  }, []);

  // story viewer
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [storyUserStories, setStoryUserStories] = useState<string[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);

  const openStoryModal = useCallback((user: User) => {
    const stories = Array.isArray(user.stories) ? user.stories : [];
    if (!stories.length) return;
    setStoryUserStories(stories);
    setStoryIndex(0);
    setStoryModalVisible(true);
  }, []);

  const goNextStory = useCallback(() => {
    setStoryIndex((idx) => {
      const next = idx + 1;
      if (next >= storyUserStories.length) {
        setStoryModalVisible(false);
        return idx;
      }
      return next;
    });
  }, [storyUserStories.length]);

  const goPrevStory = useCallback(() => {
    setStoryIndex((idx) => (idx - 1 >= 0 ? idx - 1 : idx));
  }, []);

  // navigate to chat screen
  const openChatWithUser = useCallback(
    (user: User) => {
      router.push({
        pathname: "/(chat)",
        params: {
          userId: user.id,
          username: user.username,
          profilePicture: user.profile_picture,
          loggedUserId: LOGGED_USER.id,
          loggedUsername: LOGGED_USER.username,
          loggedAvatar: LOGGED_USER.profile_picture,
        },
      });
    },
    [router]
  );

  // Stories data
  const storiesData: (User & { isYou?: boolean })[] = [
    { ...LOGGED_USER, id: "you", isYou: true },
    ...USERS,
  ];

  const keyExtractor = (item: ChatItem) => item.id;

  // filtered chat list based on searchQuery
  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chatList;
    return chatList.filter((c) => {
      const otherUser = c.sender.id === LOGGED_USER.id ? c.receiver : c.sender;
      const username = otherUser.username?.toLowerCase() ?? "";
      const content = (c.content ?? "").toLowerCase();
      return username.includes(q) || content.includes(q);
    });
  }, [chatList, searchQuery]);

  const emptyComponent = useMemo(
    () => (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-base text-gray-500 mb-2">
          No previous chats yet.
        </Text>
        <Pressable
          className="bg-black px-3 py-2 rounded-full"
          onPress={() => router.push("/(chat)")}
          accessibilityLabel="Start new chat"
        >
          <Text className="text-white font-medium">Start New Chat</Text>
        </Pressable>
      </View>
    ),
    [router]
  );

  // Tabs state
  const [activeTab, setActiveTab] = useState<"AI" | "Chats" | "Groups">(
    "Chats"
  );

  return (
    // <SafeAreaView className="flex-1 bg-white">
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top - 10 }}>
      {/* 1) SearchBar at top */}
      <View className="px-3 pt-3">
        <SearchBar
          value={searchQuery}
          onChangeText={(val: string) => setSearchQuery(val)}
          placeholder="Search chats or users"
        />
      </View>

      {/* 2) Stories carousel (no heading) */}
      <View className="mt-3 ">
        <FlatList
          horizontal
          data={storiesData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(it: any) => it.id ?? Math.random().toString()}
          contentContainerStyle={{
            alignItems: "center",
            paddingVertical: 6,
            paddingLeft: 0,
            paddingRight: 0,
          }}
          ListHeaderComponent={<View style={{ width: 12 }} />}
          ListFooterComponent={<View style={{ width: 12 }} />}
          renderItem={({ item, index }) => {
            const isLast = index === storiesData.length - 1;
            return (
              <View className={`${!isLast ? "mr-3" : ""} items-center`}>
                {item.isYou ? (
                  <Pressable
                    onPress={() =>
                      openProfileModal(
                        LOGGED_USER.profile_picture ?? DEFAULT_AVATAR
                      )
                    }
                    accessibilityLabel="Your profile story"
                    className="items-center"
                  >
                    <View className="w-16 h-16 rounded-full items-center justify-center">
                      <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                        <Text className="text-xl text-gray-500">＋</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-600 mt-1">You</Text>
                  </Pressable>
                ) : (
                  <StoryBubble
                    user={item}
                    onOpen={openStoryModal}
                    onOpenProfile={openProfileModal}
                  />
                )}
              </View>
            );
          }}
        />
      </View>

      {/* 3) Tabs pill */}
      <View className="px-16 mt-3">
        <View className="bg-gray-100 rounded-2xl flex-row items-center justify-center p-1 mx-2">
          <Pressable
            className={`px-5 py-2 rounded-full ${activeTab === "AI" ? "bg-white shadow" : ""}`}
          >
            <Text
              className={`text-sm ${activeTab === "AI" ? "font-semibold" : "text-gray-600"}`}
            >
              AI LYNKD
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("Chats")}
            className={`px-5 py-2 rounded-full mx-2 ${activeTab === "Chats" ? "bg-white shadow" : ""}`}
          >
            <Text
              className={`text-sm ${activeTab === "Chats" ? "font-semibold" : "text-gray-600"}`}
            >
              Chats
            </Text>
          </Pressable>

          <Pressable
            className={`px-5 py-2 rounded-full ${activeTab === "Groups" ? "bg-white shadow" : ""}`}
          >
            <Text
              className={`text-sm ${activeTab === "Groups" ? "font-semibold" : "text-gray-600"}`}
            >
              Groups
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 4) Page content: show chats content only when Chats tab active */}
      {activeTab === "Chats" ? (
        <View className="flex-1 mt-2">
          {filteredChats.length > 0 ? (
            <FlatList
              data={filteredChats}
              renderItem={({ item }) => (
                <ChatRow
                  item={item}
                  onOpenChat={openChatWithUser}
                  onOpenProfile={openProfileModal}
                />
              )}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews
            />
          ) : (
            emptyComponent
          )}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-gray-500 mb-2">
            {activeTab === "AI"
              ? "AI LYNKD content placeholder"
              : "Groups content placeholder"}
          </Text>
        </View>
      )}

      {/* Profile image modal */}
      {profileModalVisible && (
        <Modal
          visible={profileModalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <SafeAreaView className="flex-1 bg-black">
            <Pressable
              className="absolute top-10 left-4 z-50 p-2"
              onPress={() => setProfileModalVisible(false)}
              accessibilityLabel="Close profile preview"
            >
              <Text className="text-white text-2xl">✕</Text>
            </Pressable>

            {profileModalImage ? (
              <View className="flex-1 items-center justify-center">
                <Image
                  source={{ uri: profileModalImage }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-white">No image</Text>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      )}

      {/* Story viewer modal */}
      {storyModalVisible && (
        <Modal
          visible={storyModalVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setStoryModalVisible(false)}
        >
          <SafeAreaView className="flex-1 bg-black">
            <Pressable
              className="absolute top-8 right-4 z-50 p-2"
              onPress={() => setStoryModalVisible(false)}
              accessibilityLabel="Close story"
            >
              <Text className="text-white text-2xl">✕</Text>
            </Pressable>

            <View className="flex-1 flex-row">
              <Pressable
                onPress={goPrevStory}
                className="flex-1"
                style={{ justifyContent: "center" }}
              />
              <Pressable
                onPress={goNextStory}
                className="flex-1"
                style={{ justifyContent: "center" }}
              />
            </View>

            <View className="absolute inset-0 items-center justify-center">
              {storyUserStories[storyIndex] ? (
                <Image
                  source={{ uri: storyUserStories[storyIndex] }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <Text className="text-white">No story</Text>
              )}
            </View>

            <View className="absolute bottom-8 left-0 right-0 items-center">
              <Text className="text-white text-sm">
                {storyIndex + 1} / {storyUserStories.length}
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
    // </SafeAreaView>
  );
}
