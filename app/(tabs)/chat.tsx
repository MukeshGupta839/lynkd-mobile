// app/(tabs)/chat.tsx
import SearchBar from "@/components/Searchbar";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
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

import Stories, { StoryUser } from "@/components/Stories/Stories";
import {
  CHAT_LIST_DUMMY,
  ChatItem,
  DEFAULT_AVATAR,
  LOGGED_USER,
  User,
  USERS,
} from "@/constants/chat";

// ✅ added: file access (types-safe workaround below)
import * as FileSystem from "expo-file-system";

/* ---------- helpers: video trim + uri normalization ---------- */
/**
 * Try to require FFmpeg at runtime so the app still builds if the native module
 * isn't installed yet. If unavailable, we fall back to rejecting >60s videos.
 */
function getFFmpegKitSafely():
  | { FFmpegKit: any } // use any to avoid TS friction
  | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("ffmpeg-kit-react-native");
    return mod && mod.FFmpegKit ? { FFmpegKit: mod.FFmpegKit } : null;
  } catch {
    return null;
  }
}

// Copies content:// URIs to a file:// path FFmpeg can read
async function ensureFilePath(inputUri: string): Promise<string> {
  if (inputUri.startsWith("file://")) return inputUri;

  // Some SDK typings might miss these fields; cast to any avoids TS error.
  const anyFS = FileSystem as any;
  const cacheDir: string | null =
    anyFS.cacheDirectory ?? anyFS.documentDirectory ?? null;

  if (!cacheDir) {
    // Fallback: just return original, FFmpeg may fail without file://
    return inputUri;
  }
  const outPath = `${cacheDir}pick_${Date.now()}.mp4`;
  await anyFS.copyAsync({ from: inputUri, to: outPath });
  return outPath;
}

async function trimVideoTo60Sec(
  inputUri: string,
  startSec: number = 0
): Promise<string> {
  const ff = getFFmpegKitSafely();
  if (!ff) {
    throw new Error("FFMPEG_UNAVAILABLE");
  }
  const { FFmpegKit } = ff;

  const src = await ensureFilePath(inputUri);

  const anyFS = FileSystem as any;
  const baseDir: string = anyFS.cacheDirectory ?? anyFS.documentDirectory ?? "";

  const outPath = `${baseDir}story_${Date.now()}_trimmed.mp4`;
  const ss = Math.max(0, Math.floor(startSec));

  // Faster stream copy first; if it fails on some codecs, you can switch to re-encode.
  const cmd = `-y -ss ${ss} -i "${src}" -t 60 -c copy "${outPath}"`;
  // const cmd = `-y -ss ${ss} -i "${src}" -t 60 -preset ultrafast -c:v libx264 -c:a aac "${outPath}"`;

  const session = await FFmpegKit.run(cmd);
  const returnCode = await session.getReturnCode?.();
  if (returnCode?.isValueSuccess?.()) {
    return outPath;
  }
  throw new Error("FFMPEG_TRIM_FAILED");
}

/* ---------- Story bubble (other users) ---------- */
type StoryBubbleProps = {
  user: User;
  onOpen: (u: User) => void;
  onOpenProfile: (img?: string) => void;
};
const StoryBubble = memo<StoryBubbleProps>(
  ({ user, onOpen, onOpenProfile }) => {
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
            <LinearGradient
              colors={["#f58529", "#dd2a7b", "#8134af", "#515bd4"]}
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
          ) : (
            <View className="w-16 h-16 rounded-full items-center justify-center">
              <Image
                source={{ uri: user.profile_picture ?? DEFAULT_AVATAR }}
                className="w-16 h-16 rounded-full"
              />
            </View>
          )}
        </Pressable>
        <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
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
                colors={["#f58529", "#dd2a7b", "#8134af", "#515bd4"]}
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

            {/* blue + overlay — always visible */}
            <Pressable
              onPress={onAdd}
              hitSlop={10}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full items-center justify-center"
              style={{
                backgroundColor: "#0095F6",
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
  item: ChatItem;
  onOpenChat: (u: User) => void;
  onOpenProfile: (img?: string) => void;
};
const ChatRow = memo<ChatRowProps>(({ item, onOpenChat, onOpenProfile }) => {
  const otherUser =
    item.sender.id === LOGGED_USER.id ? item.receiver : item.sender;
  const displayName =
    otherUser.username.charAt(0).toUpperCase() + otherUser.username.slice(1);
  const unreadCount = (item as any).unreadCount ?? (item.unread ? 1 : 0);
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
          className={`text-base ${item.unread ? "font-bold text-black" : "font-medium text-black"}`}>
          {displayName}
        </Text>
        <Text
          className={`text-sm ${item.unread ? "text-black" : "text-gray-500"}`}
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

/* ---------- Screen ---------- */
export default function Chats() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [chatList] = useState<ChatItem[]>(CHAT_LIST_DUMMY);
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

  const addYourStoryFromGallery = useCallback(async () => {
    // ⚠️ NOTE: The native gallery opened by ImagePicker is OS-controlled.
    // You cannot dismiss it by tapping outside; only Cancel/back works.
    // If you need tap-to-dismiss, implement a custom in-app gallery.
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
      // videoMaxDuration only affects recordings; not library picks
      // videoMaxDuration: 60,
    });
    if (result.canceled) return;

    const assets = result.assets ?? [];
    if (!assets.length) return;

    setUploading(true);

    try {
      const acceptedUris: string[] = [];

      for (const a of assets) {
        const uri = a.uri;
        const type = a.type;
        const isVideo =
          (type?.startsWith("video") ?? false) || type === "video";

        if (!isVideo) {
          // image -> accept directly
          acceptedUris.push(uri);
          continue;
        }

        // Duration in seconds (may be undefined on some devices)
        const rawDuration = (a as any).duration;
        const durationSec =
          typeof rawDuration === "number" ? rawDuration : undefined;

        if (typeof durationSec === "number" && durationSec <= 60) {
          // video ≤ 60s -> accept directly
          acceptedUris.push(uri);
          continue;
        }

        // video >60s OR unknown duration -> attempt trim; if FFmpeg missing, reject
        try {
          const trimmedUri = await trimVideoTo60Sec(uri, 0);
          acceptedUris.push(trimmedUri);
        } catch (e: any) {
          const msg =
            e?.message === "FFMPEG_UNAVAILABLE"
              ? "Trimming requires FFmpeg. Please install ffmpeg-kit-react-native or choose a video under 60 seconds."
              : "This video is over 60 seconds and couldn't be trimmed automatically. Please trim it and try again.";
          Alert.alert("Video too long", msg);
          // skip this asset
        }
      }

      if (acceptedUris.length === 0) {
        setUploading(false);
        return;
      }

      setStoryUsers((prev) =>
        prev.map((u) =>
          u.isYou
            ? {
                ...u,
                hasStory: true,
                stories: [...(u.stories ?? []), ...acceptedUris],
              }
            : u
        )
      );

      setUploading(false);
      setStoriesInitialIndex(0);
      setStoriesVisible(true);
    } catch (err) {
      setUploading(false);
      Alert.alert("Error", "Something went wrong while adding your story.");
    }
  }, []);

  /* Stories viewer data (only users with stories) */
  const storiesViewerData: StoryUser[] = useMemo(() => {
    const you = storyUsers.find((u) => u.isYou);
    const others = storyUsers.filter(
      (u) => !u.isYou && (u.stories ?? []).length > 0
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

  /* Stories row data:
     - Always include YOU as the first item (so + is always available)
     - Include only other users who have stories
  */
  const youUser = storyUsers.find((u) => u.isYou)!;
  const storyRowData = useMemo(
    () => [
      youUser,
      ...storyUsers.filter((u) => !u.isYou && (u.stories ?? []).length > 0),
    ],
    [youUser, storyUsers]
  );

  // Chats filtering
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

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* Search Bar */}
      <View className="px-3">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search chats or users"
        />
      </View>

      {/* Stories Row */}
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
            if (u.isYou) {
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
            return (
              <StoryBubble
                user={u}
                onOpen={openStoryModal}
                onOpenProfile={(img) => {
                  setProfileModalImage(img ?? DEFAULT_AVATAR);
                  setProfileModalVisible(true);
                }}
              />
            );
          }}
        />
      </View>

      {/* Chats list */}
      <View className="flex-1 mt-2">
        <FlatList
          data={filteredChats}
          renderItem={({ item }) => (
            <ChatRow
              item={item}
              onOpenChat={(u) =>
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
                })
              }
              onOpenProfile={(img) => {
                setProfileModalImage(img ?? DEFAULT_AVATAR);
                setProfileModalVisible(true);
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
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
          onRequestClose={() => setStoriesVisible(false)}>
          <View className="flex-1 bg-black">
            <Stories
              storiesData={storiesViewerData}
              initialUserIndex={storiesInitialIndex}
              onRequestClose={() => setStoriesVisible(false)}
              showStrip={false}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
