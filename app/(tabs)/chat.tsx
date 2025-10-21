// app/(tabs)/chat.tsx
import SearchBar from "@/components/Searchbar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Stories from "@/components/Stories/Stories";
import {
  CHAT_LIST_DUMMY,
  ChatItem,
  DEFAULT_AVATAR,
  LOGGED_USER,
  User,
  USERS,
} from "@/constants/chat";

import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";

/* ---------- helpers ---------- */
function normalizeAssetDuration(raw: any): number | undefined {
  if (typeof raw !== "number" || !isFinite(raw)) return undefined;
  if (raw > 1000) return raw / 1000;
  return raw;
}
const MAX_VIDEO_SECONDS = 60;

/* ---------- Story bubble (other users) ---------- */
type StoryBubbleProps = {
  user: User;
  onOpen: (u: User) => void;
  onOpenProfile: (img?: string) => void;
  isSeen?: boolean; // <-- seen means finished all stories
};
const StoryBubble = memo<StoryBubbleProps>(
  ({ user, onOpen, onOpenProfile, isSeen }) => {
    const hasStory = (user.stories ?? []).length > 0;

    return (
      <View className="items-center">
        <Pressable
          onPress={() =>
            hasStory ? onOpen(user) : onOpenProfile(user.profile_picture)
          }
          accessibilityLabel={`${user.username} story or profile`}
          className="items-center">
          {hasStory ? (
            isSeen ? (
              // Gray ring + dim avatar if finished
              <View
                style={{
                  padding: 2,
                  borderRadius: 999,
                  backgroundColor: "#e5e7eb",
                }}
                className="rounded-full">
                <View className="w-16 h-16 rounded-full items-center justify-center bg-white">
                  <Image
                    source={{ uri: user.profile_picture ?? DEFAULT_AVATAR }}
                    className="w-14 h-14 rounded-full"
                    style={{ opacity: 0.6 }}
                  />
                </View>
              </View>
            ) : (
              // Colorful ring if not finished
              <LinearGradient
                colors={["#C0C0C0", "#000000", "#FFD700", "#FFA500"]}
                start={[0, 0]}
                end={[1, 1]}
                className="rounded-full"
                style={{ padding: 2, borderRadius: 999 }}>
                <View className="w-16 h-16 rounded-full items-center justify-center bg-white">
                  <Image
                    source={{ uri: user.profile_picture ?? DEFAULT_AVATAR }}
                    className="w-14 h-14 rounded-full"
                  />
                </View>
              </LinearGradient>
            )
          ) : (
            <View className="w-16 h-16 rounded-full items-center justify-center">
              <Image
                source={{ uri: user.profile_picture ?? DEFAULT_AVATAR }}
                className="w-16 h-16 rounded-full"
              />
            </View>
          )}
        </Pressable>
        <Text
          className={`text-xs mt-1 ${isSeen ? "text-gray-400" : "text-gray-600"}`}
          numberOfLines={1}>
          {user.username.split(".")[0]}
        </Text>
      </View>
    );
  }
);
StoryBubble.displayName = "StoryBubble";

/* ---------- Your bubble (always shows +) ---------- */
type YouBubbleProps = {
  you: User & { isYou?: boolean };
  uploading: boolean;
  onOpenStories: () => void;
  onAdd: () => void;
};
const YouBubble = memo<YouBubbleProps>(
  ({ you, uploading, onOpenStories, onAdd }) => {
    const hasStory = (you.stories ?? []).length > 0;

    return (
      <View className="items-center ">
        <Pressable
          onPress={hasStory ? onOpenStories : onAdd}
          accessibilityLabel="Your story"
          className="items-center">
          <View className="relative">
            {hasStory ? (
              <LinearGradient
                colors={["#C0C0C0", "#000000", "#FFD700", "#FFA500"]}
                start={[0, 0]}
                end={[1, 1]}
                className="rounded-full"
                style={{ padding: 2, borderRadius: 999 }}>
                <View className="w-16 h-16 rounded-full items-center justify-center bg-white">
                  <Image
                    source={{ uri: you.profile_picture ?? DEFAULT_AVATAR }}
                    className="w-14 h-14 rounded-full"
                  />
                </View>
              </LinearGradient>
            ) : (
              <Image
                source={{ uri: you.profile_picture ?? DEFAULT_AVATAR }}
                className="w-16 h-16 rounded-full"
              />
            )}

            {/* + overlay */}
            <Pressable
              onPress={onAdd}
              hitSlop={10}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full items-center justify-center"
              style={{
                backgroundColor: "#000",
                borderWidth: 2,
                borderColor: "#fff",
              }}>
              <Text className="text-white text-xs font-extrabold">＋</Text>
            </Pressable>

            {uploading && (
              <View className="absolute inset-0 rounded-full items-center justify-center bg-black/40">
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
        </Pressable>
        <Text className="text-xs text-gray-600 mt-1">
          {hasStory ? "Your Story" : "Add Story"}
        </Text>
      </View>
    );
  }
);
YouBubble.displayName = "YouBubble";

/* ---------- Chat row ---------- */
type ChatRowProps = {
  item: ChatItem & { unreadCount?: number };
  onOpenChat: (u: User) => void;
  onOpenProfile: (img?: string) => void;
};
const ChatRow = memo<ChatRowProps>(({ item, onOpenChat, onOpenProfile }) => {
  const otherUser =
    item.sender.id === LOGGED_USER.id ? item.receiver : item.sender;
  const displayName =
    otherUser.username.charAt(0).toUpperCase() + otherUser.username.slice(1);

  const unreadCount = (item as any).unreadCount ?? 0;

  const preview =
    item.content?.length && item.content.length > 30
      ? item.content.slice(0, 30) + "..."
      : (item.content ?? "");

  return (
    <Pressable
      onPress={() => onOpenChat(otherUser)}
      className="flex-row items-center px-3 py-3 border-b border-gray-100"
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${displayName}`}>
      <Pressable onPress={() => onOpenProfile(otherUser.profile_picture)}>
        <Image
          source={{ uri: otherUser.profile_picture ?? DEFAULT_AVATAR }}
          className="w-12 h-12 rounded-full"
        />
      </Pressable>

      <View className="flex-1 ml-3">
        <Text
          className={`text-base ${unreadCount > 0 ? "font-bold text-black" : "font-medium text-black"}`}>
          {displayName}
        </Text>
        <Text
          className={`text-sm ${unreadCount > 0 ? "text-black" : "text-gray-500"}`}
          numberOfLines={1}>
          {preview}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-xs text-gray-700">
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {unreadCount > 0 && (
          <View className="mt-1 bg-black rounded-full px-2 py-0.5 items-center justify-center">
            <Text className="text-white text-xs font-semibold">
              {unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});
ChatRow.displayName = "ChatRow";

/* ---------- Preview video with smart HUD detection ---------- */
function PreviewVideo({
  uri,
  onHudVisibleChange,
}: {
  uri: string;
  onHudVisibleChange: (visible: boolean) => void;
}) {
  const player = useVideoPlayer(uri);
  const lastPing = useRef(Date.now());
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pingVisible = () => {
    onHudVisibleChange(true);
    lastPing.current = Date.now();
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastPing.current >= 2500) {
        onHudVisibleChange(false);
      }
    }, 2600);
  };

  useEventListener(player, "statusChange", pingVisible);
  useEventListener(player, "timeUpdate", pingVisible);

  useEffect(() => {
    try {
      player.play();
    } catch {}
    pingVisible();
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      try {
        // @ts-ignore older versions safety
        player?.destroy?.();
      } catch {}
    };
  }, []);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      nativeControls
      allowsFullscreen
      startsPictureInPictureAutomatically={false}
      contentFit="contain"
    />
  );
}

/* ---------- ImagePicker compatibility helper ---------- */
function getPickerMediaTypes(): any {
  const ip: any = ImagePicker as any;
  if (ip?.MediaType) return [ip.MediaType.image, ip.MediaType.video];
  return ip?.MediaTypeOptions?.All ?? ip?.MediaTypeOptions?.All;
}

/* ---------- Screen ---------- */
export default function Chats() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // now mutable so we can mark read
  const [chatList, setChatList] = useState<ChatItem[]>(CHAT_LIST_DUMMY);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileModalImage, setProfileModalImage] = useState<string | null>(
    null
  );

  const [uploading, setUploading] = useState(false);

  const openProfileModal = useCallback((imageUri?: string) => {
    setProfileModalImage(imageUri ?? DEFAULT_AVATAR);
    setProfileModalVisible(true);
  }, []);

  // Stories state
  const [storiesVisible, setStoriesVisible] = useState(false);
  const [storiesInitialIndex, setStoriesInitialIndex] = useState(0);
  const [storyUsers, setStoryUsers] = useState<(User & { isYou?: boolean })[]>([
    { ...LOGGED_USER, id: "you", isYou: true },
    ...USERS,
  ]);

  // ✅ Track which users have fully finished (for gray + move to end)
  const [seenStoryUserIds, setSeenStoryUserIds] = useState<Set<string>>(
    new Set()
  );

  // ==== PREVIEW state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);

  // HUD visibility
  const [hudVisible, setHudVisible] = useState(false);

  // === Mixed gallery, SINGLE PICK, then show preview
  const addYourStoryFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: getPickerMediaTypes(),
      allowsMultipleSelection: false,
      selectionLimit: 1,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    const a = result.assets[0];
    const isVideo =
      (a.type?.startsWith("video") ?? false) || a.type === "video";

    // Enforce <= 60 seconds for videos (block longer)
    if (isVideo) {
      const durSec = normalizeAssetDuration((a as any).duration);
      if (typeof durSec === "number" && durSec > MAX_VIDEO_SECONDS) {
        Alert.alert(
          "Video too long",
          "Please pick a video of 60 seconds or less."
        );
        return;
      }
    }

    setPreviewUri(a.uri);
    setPreviewIsVideo(!!isVideo);
    setPreviewOpen(true);
  }, []);

  // Confirm from preview → add to story
  const confirmPreviewAdd = useCallback(async () => {
    if (!previewUri) return;
    setUploading(true);
    try {
      const finalUri = previewUri;

      setStoryUsers((prev) =>
        prev.map((u) =>
          (u as any).isYou
            ? {
                ...u,
                hasStory: true,
                stories: [...(u.stories ?? []), finalUri],
              }
            : u
        )
      );
      setStoriesInitialIndex(0);
      setStoriesVisible(true);
      setPreviewOpen(false);
      setPreviewUri(null);
    } finally {
      setUploading(false);
    }
  }, [previewUri]);

  type StoryUser = {
    user_id: string | number;
    user_image: string;
    user_name: string;
    stories: { story_id: string; story_image: string; created_at: string }[];
  };

  /* Stories viewer data (only users with stories) */
  const storiesViewerData: StoryUser[] = useMemo(() => {
    const you = storyUsers.find((u) => (u as any).isYou);
    const others = storyUsers.filter(
      (u) => !(u as any).isYou && (u.stories ?? []).length > 0
    );
    const ordered = [
      ...(you && (you.stories ?? []).length > 0 ? [you] : []),
      ...others,
    ];
    return ordered.map((u) => ({
      user_id: u.id,
      user_image: u.profile_picture ?? DEFAULT_AVATAR,
      user_name: u.username ?? "User",
      stories: (u.stories ?? []).map((uri: string, idx: number) => ({
        story_id: `${u.id}-${idx}`,
        story_image: uri,
        created_at: new Date().toISOString(),
      })),
    }));
  }, [storyUsers]);

  const viewerIndexByUserId = useMemo(() => {
    const m = new Map<string | number, number>();
    storiesViewerData.forEach((u, idx) => m.set(u.user_id, idx));
    return m;
  }, [storiesViewerData]);

  const openStoryModal = useCallback(
    (user: User) => {
      const idx = viewerIndexByUserId.get(user.id);
      if (idx === undefined) return;
      setStoriesInitialIndex(idx);
      setStoriesVisible(true);
    },
    [viewerIndexByUserId]
  );

  /* Stories row data (You, then Unseen, then Seen@end) */
  const youUser = storyUsers.find((u) => (u as any).isYou)!;
  const storyRowData = useMemo(() => {
    const othersWithStories = storyUsers.filter(
      (u) => !(u as any).isYou && (u.stories ?? []).length > 0
    );

    const unseen = othersWithStories.filter(
      (u) => !seenStoryUserIds.has(String(u.id))
    );
    const seen = othersWithStories.filter((u) =>
      seenStoryUserIds.has(String(u.id))
    );

    // Move finished (seen) to the end
    return [youUser, ...unseen, ...seen];
  }, [youUser, storyUsers, seenStoryUserIds]);

  /* ---------- Build IG-style conversation rows ---------- */
  const conversations = useMemo(() => {
    type Acc = {
      [otherId: string]: ChatItem & { unreadCount: number };
    };

    const acc: Acc = {};

    for (const msg of chatList) {
      const other =
        msg.sender.id === LOGGED_USER.id ? msg.receiver : msg.sender;
      const key = String(other.id);

      const unreadInc =
        msg.receiver.id === LOGGED_USER.id && (msg as any).unread === true
          ? 1
          : 0;

      const msgTime = new Date(msg.created_at).getTime();

      if (!acc[key]) {
        acc[key] = {
          ...msg,
          id: `conv-${key}`,
          unreadCount: unreadInc,
        };
      } else {
        acc[key].unreadCount += unreadInc;

        const prevTime = new Date(acc[key].created_at).getTime();
        if (msgTime > prevTime) {
          acc[key] = {
            ...msg,
            id: `conv-${key}`,
            unreadCount: acc[key].unreadCount,
          };
        }
      }
    }

    return Object.values(acc).sort((a, b) => {
      const au = a.unreadCount || 0;
      const bu = b.unreadCount || 0;
      if (au > 0 && bu === 0) return -1;
      if (bu > 0 && au === 0) return 1;
      const at = new Date(a.created_at).getTime();
      const bt = new Date(b.created_at).getTime();
      return bt - at;
    });
  }, [chatList]);

  // Search filters over conversations
  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const otherUser = c.sender.id === LOGGED_USER.id ? c.receiver : c.sender;
      const username = otherUser.username?.toLowerCase() ?? "";
      const content = (c.content ?? "").toLowerCase();
      return username.includes(q) || content.includes(q);
    });
  }, [conversations, searchQuery]);

  /* ✅ Mark conversation read when opening it (IG style) */
  const markConversationRead = useCallback((otherUserId: string | number) => {
    setChatList((prev) =>
      prev.map((c) => {
        const betweenSamePair =
          (c.sender.id === LOGGED_USER.id && c.receiver.id === otherUserId) ||
          (c.receiver.id === LOGGED_USER.id && c.sender.id === otherUserId);

        if (!betweenSamePair) return c;

        if (c.receiver.id === LOGGED_USER.id) {
          const next: any = { ...c, unread: false };
          if (typeof (c as any).unreadCount !== "undefined") {
            next.unreadCount = 0;
          }
          return next as ChatItem;
        }
        return c;
      })
    );
  }, []);

  const openChatAndMarkRead = useCallback(
    (u: User) => {
      markConversationRead(u.id);
      router.push({
        pathname: "/chat/UserChatScreen",
        params: {
          userId: u.id,
          username: u.username,
          profilePicture: u.profile_picture,
          loggedUserId: LOGGED_USER.id,
          loggedUsername: LOGGED_USER.username,
          loggedAvatar: LOGGED_USER.profile_picture,
        },
      });
    },
    [markConversationRead, router]
  );

  const bottomSpacer = (insets.bottom || 16) + 55;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* Stories FIRST */}
      <View className="mt-3">
        <FlatList
          horizontal
          data={storyRowData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(it, idx) => String((it as any).id ?? idx)}
          contentContainerStyle={{
            alignItems: "center",
            paddingVertical: 6,
            paddingHorizontal: 12,
          }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => {
            const u = item as User & { isYou?: boolean };
            if ((u as any).isYou) {
              const hasStory = (u.stories ?? []).length > 0;
              return (
                <YouBubble
                  you={u}
                  uploading={uploading}
                  onOpenStories={() =>
                    hasStory ? openStoryModal(u) : addYourStoryFromGallery()
                  }
                  onAdd={addYourStoryFromGallery}
                />
              );
            }
            const isSeen = seenStoryUserIds.has(String(u.id));
            return (
              <StoryBubble
                user={u}
                isSeen={isSeen}
                onOpen={openStoryModal}
                onOpenProfile={() => {}}
              />
            );
          }}
        />
      </View>

      {/* Search bar SECOND */}
      <View className="px-3 mt-2">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search chats or users"
        />
      </View>

      {/* Chats list */}
      <View className="flex-1 mt-2">
        <FlatList
          data={filteredChats}
          renderItem={({ item }) => (
            <ChatRow
              item={item}
              onOpenChat={openChatAndMarkRead}
              onOpenProfile={(img) => {
                setProfileModalImage(img ?? DEFAULT_AVATAR);
                setProfileModalVisible(true);
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomSpacer }}
          scrollIndicatorInsets={{ bottom: bottomSpacer }}
          ListFooterComponent={<View style={{ height: 4 }} />}
        />
      </View>

      {/* Profile image modal */}
      {profileModalVisible && (
        <Modal
          visible={profileModalVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setProfileModalVisible(false)}>
          <View className="flex-1 bg-black">
            <Pressable
              className="absolute top-10 left-4 z-50 p-2"
              onPress={() => setProfileModalVisible(false)}>
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
          </View>
        </Modal>
      )}

      {/* Stories full-screen viewer */}
      {storiesVisible && (
        <Modal
          visible={storiesVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => {
            setStoriesVisible(false);
          }}>
          <View className="flex-1 bg-black">
            <Stories
              storiesData={storiesViewerData}
              initialUserIndex={storiesInitialIndex}
              onRequestClose={() => {
                setStoriesVisible(false);
              }}
              showStrip={false}
              // ⬇️ Mark finished user as seen → row reorders & turns gray
              onUserFinished={(userId) => {
                setSeenStoryUserIds((prev) => {
                  const next = new Set(prev);
                  next.add(String(userId));
                  return next;
                });
              }}
            />
          </View>
        </Modal>
      )}

      {/* Preview */}
      {previewOpen && (
        <Modal
          visible={previewOpen}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setPreviewOpen(false)}>
          <View
            className="flex-1 bg-black"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            {/* Top-right CLOSE (X) */}
            <Pressable
              onPress={() => setPreviewOpen(false)}
              accessibilityLabel="Close preview"
              style={{
                position: "absolute",
                top: insets.top ? insets.top + 6 : 12,
                right: 10,
                zIndex: 10,
                backgroundColor: "transparent",
              }}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>

            {/* Body */}
            <View className="flex-1 items-center justify-center">
              {previewUri ? (
                previewIsVideo ? (
                  <PreviewVideo
                    uri={previewUri}
                    onHudVisibleChange={(visible) => setHudVisible(visible)}
                  />
                ) : (
                  <Image
                    source={{ uri: previewUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                )
              ) : (
                <Text className="text-white">No media</Text>
              )}
            </View>

            {/* Bottom-center Send */}
            {!hudVisible && (
              <Pressable
                onPress={confirmPreviewAdd}
                disabled={uploading}
                accessibilityLabel="Add to story"
                style={{
                  position: "absolute",
                  bottom: (insets.bottom || 16) + 12,
                  alignSelf: "center",
                  width: 50,
                  height: 50,
                  borderRadius: 32,
                  backgroundColor: "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: uploading ? 0.7 : 1,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.9)",
                }}>
                <Ionicons name="arrow-forward" size={30} color="#ffffff" />
              </Pressable>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}
