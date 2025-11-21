// app/(tabs)/index.tsx

import SearchBar from "@/components/Searchbar";
import Stories from "@/components/Stories/Stories";
import StoriesCamera from "@/components/StoriesCamera";
import { DEFAULT_AVATAR, type ChatItem, type User } from "@/constants/chat"; // Removed USERS and LOGGED_USER
import { AuthContext } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketProvider";
import { apiCall } from "@/lib/api/apiService";
import { useChatListStore } from "@/stores/chatListStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  DeviceEventEmitter,
  FlatList,
  Image,
  Modal,
  Platform, // ✅ ADDED: Platform
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---- Endpoints on your backend ---- */
const CHATS_OF_USER = (id: string | number) => `/api/messages/user-chats/${id}`;
const STORIES_FEED = (id: string | number) => `/api/posts/stories/feed/${id}`;
// ✅ ADDED: Story Create Endpoint
const STORY_CREATE = "/api/posts/stories/create";

/* ---- Socket config (match UserChatScreen) ---- */
function resolveApiUrl(): string | null {
  // Expo recommends EXPO_PUBLIC_* for runtime env
  const v1 = (process as any)?.env?.EXPO_PUBLIC_API_URL;
  const v2 = (process as any)?.env?.API_URL;
  const v3 = Constants?.expoConfig?.extra?.API_URL;
  const v4 = (Constants as any)?.manifest2?.extra?.API_URL;
  const pick = v1 || v2 || v3 || v4 || null;
  if (!pick && __DEV__) {
    console.warn(
      "[inbox] API_URL is not defined. Set EXPO_PUBLIC_API_URL in app config. Socket will not connect."
    );
  }
  return pick;
}
const ENDPOINT = resolveApiUrl() || "";

/* ---------- Small date helpers ---------- */
const toMs = (iso?: string): number => {
  if (!iso) return Date.now();
  const hasTZ = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(iso);
  const safe = hasTZ ? iso : `${iso}Z`;
  const t = Date.parse(safe);
  return Number.isFinite(t) ? t : Date.now();
};
const toIso = (maybeIso?: string) => new Date(toMs(maybeIso)).toISOString();

/* ---------- Cache helpers (SecureStore) ---------- */
const INBOX_CACHE_KEY = (meId: string | number) => `inbox-cache-${meId}`;
async function saveInboxCache(meId: string | number, rows: any[]) {
  try {
    await SecureStore.setItemAsync(INBOX_CACHE_KEY(meId), JSON.stringify(rows));
  } catch (e) {
    if (__DEV__) console.warn("[inbox] saveInboxCache failed:", e);
  }
}
async function loadInboxCache(meId: string | number): Promise<any[] | null> {
  try {
    const raw = await SecureStore.getItemAsync(INBOX_CACHE_KEY(meId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ✅ ADDED: Type for fetched story data
type StoryUser = {
  user_id: string | number;
  user_image: string;
  user_name: string;
  stories: {
    story_id: string | number;
    story_image: string;
    [key: string]: any; // Allow other fields from fetchStories
  }[];
  isYou?: boolean; // Flag to identify the logged-in user
};

/* ---------- Story bubble (other users) ---------- */
type StoryBubbleProps = {
  user: User;
  onOpen: (u: User) => void;
  onOpenProfile: (img?: string) => void;
  isSeen?: boolean;
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
          className="items-center"
        >
          {hasStory ? (
            isSeen ? (
              <View
                style={{
                  padding: 2,
                  borderRadius: 999,
                  backgroundColor: "#e5e7eb",
                }}
                className="rounded-full"
              >
                <View className="w-16 h-16 rounded-full items-center justify-center bg-white">
                  <Image
                    source={{ uri: user.profile_picture ?? DEFAULT_AVATAR }}
                    className="w-14 h-14 rounded-full"
                    style={{ opacity: 0.6 }}
                  />
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={["#C0C0C0", "#000000", "#FFD700", "#FFA500"]}
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
          numberOfLines={1}
        >
          {(user.username ?? "user").split(".")[0]}
        </Text>
      </View>
    );
  }
);
StoryBubble.displayName = "StoryBubble";

/* ---------- Your bubble ---------- */
type YouBubbleProps = {
  you: StoryUser; // Use StoryUser type
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
          className="items-center"
        >
          <View className="relative">
            {hasStory ? (
              <LinearGradient
                colors={["#C0C0C0", "#000000", "#FFD700", "#FFA500"]}
                start={[0, 0]}
                end={[1, 1]}
                className="rounded-full"
                style={{ padding: 2, borderRadius: 999 }}
              >
                <View className="w-16 h-16 rounded-full items-center justify-center bg-white">
                  <Image
                    source={{ uri: you.user_image ?? DEFAULT_AVATAR }}
                    className="w-14 h-14 rounded-full"
                  />
                </View>
              </LinearGradient>
            ) : (
              <Image
                source={{ uri: you.user_image ?? DEFAULT_AVATAR }}
                className="w-16 h-16 rounded-full"
              />
            )}

            <Pressable
              onPress={onAdd}
              hitSlop={10}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full items-center justify-center"
              style={{
                backgroundColor: "#000",
                borderWidth: 2,
                borderColor: "#fff",
              }}
            >
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

/* ---------- Chat helpers (robust to API shape) ---------- */
const getIds = (msg: any) => {
  const senderId = msg?.sender?.id ?? msg?.sender_id ?? msg?.from_id ?? null;
  const receiverId =
    msg?.receiver?.id ?? msg?.receiver_id ?? msg?.to_id ?? null;
  return { senderId, receiverId };
};

const pairKey = (c: any) => {
  const { senderId, receiverId } = getIds(c);
  if (senderId == null || receiverId == null)
    return `bad-${c?.id ?? String(c?.created_at ?? "no-id")}`;
  return [String(senderId), String(receiverId)].sort().join("-");
};

const groupMessagesByUser = (messages: any[]) => {
  const byPair = new Map<string, any>();
  for (const msg of messages) {
    const key = pairKey(msg);
    const t = new Date(
      msg?.created_at ?? msg?.timestamp ?? msg?.time ?? 0
    ).getTime();
    const prev = byPair.get(key);
    const prevT = new Date(
      prev?.created_at ?? prev?.timestamp ?? prev?.time ?? 0
    ).getTime();
    if (!prev || t > prevT) byPair.set(key, msg);
  }
  return Array.from(byPair.values());
};

/* ---------- Chat row ---------- */
type ChatRowProps = {
  item: ChatItem;
  meId: string | number;
  // Update this signature to accept content and time
  onOpenChat: (u: User, lastContent?: string, lastTime?: string) => void;
  onOpenProfile: (img?: string) => void;
};

const getPeerUser = (item: any, meId: string | number): User => {
  const s = item?.sender ?? {};
  const r = item?.receiver ?? {};
  const sId = s?.id ?? item?.sender_id;
  const rId = r?.id ?? item?.receiver_id;
  const iAmSender = String(sId) === String(meId);
  const peer = iAmSender ? r : s;

  const peerId = (iAmSender ? rId : sId) ?? peer?.id;
  return {
    id: peerId,
    username: peer?.username ?? peer?.name ?? "user",
    profile_picture: peer?.profile_picture ?? DEFAULT_AVATAR,
  } as any;
};

const ChatRow = memo<ChatRowProps>(
  ({ item, meId, onOpenChat, onOpenProfile }) => {
    const otherUser: User = getPeerUser(item, meId);
    const displayName =
      otherUser.username?.charAt(0).toUpperCase() +
      otherUser.username?.slice(1);

    const preview =
      (item.content ?? "").length > 30
        ? (item.content ?? "").slice(0, 30) + "..."
        : (item.content ?? "Start a conversation!");

    const createdMs = toMs((item as any).created_at);

    return (
      <Pressable
        onPress={() => onOpenChat(otherUser, item.content, item.created_at)}
        className="flex-row items-center px-3 py-3 border-b border-gray-100"
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${displayName}`}
      >
        <Pressable onPress={() => onOpenProfile(otherUser.profile_picture)}>
          <Image
            source={{ uri: otherUser.profile_picture ?? DEFAULT_AVATAR }}
            className="w-12 h-12 rounded-full"
          />
        </Pressable>

        <View className="flex-1 ml-3">
          <Text className="text-base font-medium text-black">
            {displayName}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {preview}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-xs text-gray-700">
            {new Date(createdMs).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Pressable>
    );
  }
);
ChatRow.displayName = "ChatRow";

/* ---------- ✅ FIXED: Preview video ---------- */
function PreviewVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  useEffect(() => {
    try {
      player.play();
    } catch {}

    // Clean up the player on unmount
    return () => {
      try {
        // @ts-ignore
        player?.destroy?.();
      } catch {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      nativeControls // This provides all the play/pause controls
      allowsFullscreen
      startsPictureInPictureAutomatically={false}
      contentFit="contain"
    />
  );
}

/* ---------- helpers for socket readiness ---------- */
const isValidId = (v?: any) => {
  if (!v) return false;
  const s = String(v);
  if (s === "me" || s === "other") return false;
  const reNum = /^\d+$/;
  const reUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return reNum.test(s) || reUuid.test(s) || s.length >= 3;
};

/* ---------- Screen ---------- */
export default function Chats() {
  const router = useRouter();
  const { socket } = useSocket();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const auth = useContext(AuthContext);
  const me = auth?.user;
  // ✅ ADDED: Get firebaseUser from context
  const firebaseUser = auth?.firebaseUser;
  const ME_ID = String(me?.id ?? "me");
  const ME_USERNAME = me?.username ?? "you";
  const ME_AVATAR = me?.profile_picture ?? DEFAULT_AVATAR;
  const TOKEN =
    (me as any)?.token ||
    (auth as any)?.token ||
    (auth as any)?.accessToken ||
    undefined;

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileModalImage, setProfileModalImage] = useState<string | null>(
    null
  );

  const [uploading, setUploading] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);

  // ✅ ----- NEW STORY STATE -----
  const [storyData, setStoryData] = useState<StoryUser[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const storiesLoaded = useRef(false);
  const [storiesVisible, setStoriesVisible] = useState(false);
  const [storiesInitialIndex, setStoriesInitialIndex] = useState(0);
  const [seenStoryUserIds, setSeenStoryUserIds] = useState<
    Set<string | number>
  >(new Set());
  // ✅ ---------------------------

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  // ⛔ REMOVED: Unused hudVisible state
  // const [hudVisible, setHudVisible] = useState(false);

  // message conversations only
  const chatList = useChatListStore((s) => s.chatList);
  const setChatList = useChatListStore((s) => s.setChatList);

  // —— focus flag
  const focusedRef = useRef<boolean>(true);
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, [])
  );

  // Track which thread is currently open in UserChatScreen
  const activeChatPartnerIdRef = useRef<string | number | null>(null);

  // —— socket & de-dupe helpers
  const socketRef = useRef<any | null>(null);
  const seenKeySetRef = useRef<Set<string>>(new Set());
  const byClientIdRef = useRef<Set<string>>(new Set());
  // retired: connectedRef was only written but not read; remove to silence unused var
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const makeSeenKey = (sm: any) =>
    [
      sm?.client_id ?? "",
      sm?.id ?? "",
      sm?.sender_id ?? "",
      sm?.receiver_id ?? "",
      String(sm?.content ?? "").slice(0, 140),
      String(toMs(sm?.created_at ?? new Date().toISOString())),
    ].join("|");

  /* ---- helpers ---- */
  const openProfileModal = useCallback((uri?: string) => {
    setProfileModalImage(uri ?? DEFAULT_AVATAR);
    setProfileModalVisible(true);
  }, []);
  const openCameraModal = useCallback(() => setCameraModalVisible(true), []);
  const handleMediaCaptured = useCallback((uri: string, isVideo: boolean) => {
    setCameraModalVisible(false);
    setPreviewUri(uri);
    setPreviewIsVideo(isVideo);
    setPreviewOpen(true);
  }, []);

  // ✅ ----- NEW: fetchStories function -----
  const fetchStories = useCallback(async () => {
    if (storiesLoaded.current || !isValidId(ME_ID)) return;
    setLoadingStories(true);
    try {
      const response = await apiCall(STORIES_FEED(ME_ID), "GET");
      if (response?.data) {
        const formattedData: StoryUser[] = response.data
          .filter((user: any) => user?.stories && user?.stories.length > 0)
          .map((user: any) => ({
            user_id: user.user_id,
            user_image: user.user_image || DEFAULT_AVATAR,
            user_name: user.user_name,
            isYou: String(user.user_id) === String(ME_ID), // Flag your user
            stories: user.stories.map((story: any) => ({
              id: story.story_id,
              story_id: story.story_id,
              story_image: story.story_image,
              swipeText: "Swipe Up",
              caption: story.caption,
              caption_size: story.caption_size,
              caption_position: story.caption_position,
              text_position: story.text_position,
              location_position: story.location_position,
              mention_position: story.mention_position,
              location: story.location,
              mention: story.mention,
              shared_post_id: story.shared_post_id,
              user_id: story.user_id,
              username: user.user_name,
              userProfilePic: user.user_image || DEFAULT_AVATAR,
            })),
          }));

        console.log("response :", response);
        console.log("response formattedData :", formattedData);

        // Sort to put your story first
        const userStoryIndex = formattedData.findIndex(
          (storyUser) => storyUser.isYou
        );
        if (userStoryIndex !== -1) {
          const userStory = formattedData.splice(userStoryIndex, 1);
          setStoryData(userStory.concat(formattedData));
        } else {
          setStoryData(formattedData);
        }
        storiesLoaded.current = true;
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoadingStories(false);
    }
  }, [ME_ID]);

  // ✅ ----- REBUILT: confirmPreviewAdd with API logic -----
  const confirmPreviewAdd = useCallback(async () => {
    if (!previewUri || !firebaseUser || !me) {
      console.error("Missing data for story upload:", {
        previewUri,
        firebaseUser,
        me,
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("firebaseUID", firebaseUser.uid);
      formData.append("userID", String(me.id));

      const mediaType = previewIsVideo ? "video" : "image";
      formData.append("mediaType", mediaType);

      // Determine file type
      let fileExtension = "jpg";
      let mimeType = "image/jpeg";
      if (previewIsVideo) {
        // Use platform-specific extension or detect from URI
        const isAndroid = Platform.OS === "android";
        fileExtension = isAndroid ? "mp4" : "mov";
        mimeType = isAndroid ? "video/mp4" : "video/quicktime";

        // More robust detection
        const uriExt = previewUri.split(".").pop()?.toLowerCase();
        if (uriExt === "mp4") {
          fileExtension = "mp4";
          mimeType = "video/mp4";
        } else if (uriExt === "mov") {
          fileExtension = "mov";
          mimeType = "video/quicktime";
        }
      }

      formData.append("mediaUrl", {
        uri: previewUri,
        name: `story-${Date.now()}.${fileExtension}`,
        type: mimeType,
      } as any);

      // Append default/empty values for other fields
      formData.append("caption", "");
      formData.append("caption_size", String(20));
      formData.append("text_position", JSON.stringify({ x: 0, y: 0 }));
      formData.append("location", "");
      formData.append("location_position", JSON.stringify({ x: 0, y: 0 }));
      formData.append("mention", "");
      formData.append("mention_position", JSON.stringify({ x: 0, y: 0 }));
      formData.append(
        "media_position",
        JSON.stringify({ x: 0, y: 0, scale: 1, rotation: 0 })
      );

      console.log("Uploading story...");
      const response = await apiCall(STORY_CREATE, "POST", formData, {
        "Content-Type": "multipart/form-data",
      });

      if (response.message === "Story created successfully!") {
        console.log("Story created successfully:", response.data.id);
        // Force a refresh of stories on next focus/load
        storiesLoaded.current = false;
        fetchStories(); // Refresh stories list
      } else {
        console.error("Error creating story:", response);
      }
    } catch (error) {
      console.error("Failed to create story:", error);
    } finally {
      setUploading(false);
      setPreviewOpen(false);
      setPreviewUri(null);
    }
  }, [previewUri, previewIsVideo, me, firebaseUser, fetchStories]);
  // ✅ --------------------------------------------------
  // ✅ ---------------------------------

  /* ---- fetch chats only ---- */
  const fetchChatsOnly = useCallback(async () => {
    if (!isValidId(ME_ID)) return;
    try {
      const chatsRes = await apiCall(CHATS_OF_USER(ME_ID), "GET");
      const server = groupMessagesByUser(chatsRes?.data ?? []);

      setChatList((prev) => {
        const map = new Map<string, ChatItem>();

        // seed with server rows
        (server as any[]).forEach((c) => {
          // normalize server time as ISO so sorting works
          if (c?.created_at) c.created_at = toIso(c.created_at);
          map.set(pairKey(c), c as any);
        });

        // merge local rows
        (prev as any[]).forEach((c) => {
          const k = pairKey(c);
          const s = map.get(k) as any | undefined;
          if (!s) {
            map.set(k, c as any);
          } else {
            const sTime = new Date(
              s?.created_at ?? s?.timestamp ?? 0
            ).getTime();
            const cTime = new Date(
              (c as any)?.created_at ?? (c as any)?.timestamp ?? 0
            ).getTime();
            // keep client row unless server is clearly newer (> 1500ms)
            if (sTime - cTime > 1500) {
              map.set(k, s);
            } else {
              map.set(k, c as any);
            }
          }
        });

        const merged = Array.from(map.values())
          .sort(
            (a: any, b: any) =>
              new Date(a?.created_at ?? a?.timestamp ?? 0).getTime() -
              new Date(b?.created_at ?? b?.timestamp ?? 0).getTime()
          )
          .reverse();

        saveInboxCache(ME_ID, merged as any[]).catch(() => {});
        return merged as any;
      });
    } catch (e) {
      console.error("fetchChatsOnly failed:", e);
    }
  }, [ME_ID, setChatList]);

  // warm cache on mount then fetch fresh
  useEffect(() => {
    (async () => {
      if (!isValidId(ME_ID)) return;
      const cached = await loadInboxCache(ME_ID);
      if (cached && cached.length) {
        try {
          setChatList(cached as any);
        } catch {}
      }
      fetchChatsOnly();
      fetchStories(); // ✅ Fetch stories on mount
    })();
  }, [ME_ID, fetchChatsOnly, fetchStories, setChatList]);

  // refetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchChatsOnly();
      fetchStories(); // ✅ Fetch stories on focus
    }, [fetchChatsOnly, fetchStories])
  );

  // refetch when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        fetchChatsOnly();
        storiesLoaded.current = false; // ✅ Force refresh stories on app active
        fetchStories();
      }
    });
    return () => sub.remove();
  }, [fetchChatsOnly, fetchStories]);

  // Local event updates (from UserChatScreen)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "inbox:update",
      (payload: {
        partnerId: string | number;
        text: string;
        created_at?: string;
        partnerUsername?: string;
        partnerAvatar?: string;
      }) => {
        const {
          partnerId,
          text,
          created_at = new Date().toISOString(),
          partnerUsername,
          partnerAvatar,
        } = payload || ({} as any);
        if (!partnerId || !text) return;

        // normalize time to ISO to keep sort stable
        const normalizedIso = toIso(created_at);

        setChatList((prev: any[]) => {
          const idx = prev.findIndex((c: any) => {
            const { senderId, receiverId } = getIds(c);
            const otherId =
              String(senderId) === String(ME_ID) ? receiverId : senderId;
            return String(otherId) === String(partnerId);
          });

          const updateRow = (row: any): any => ({
            ...row,
            content: text,
            created_at: normalizedIso,
          });

          let next: any[];
          if (idx >= 0) {
            const updated = updateRow(prev[idx]);
            next = [updated, ...prev.filter((_, i) => i !== idx)];
          } else {
            const seed: ChatItem = {
              id: `seed-${partnerId}-${Date.now()}`,
              sender: {
                id: ME_ID,
                username: ME_USERNAME,
                profile_picture: ME_AVATAR,
              } as any,
              receiver: {
                id: partnerId,
                username: partnerUsername ?? "user",
                profile_picture: partnerAvatar ?? DEFAULT_AVATAR,
              } as any,
              content: text,
              created_at: normalizedIso,
            } as any;

            next = [seed, ...prev];
          }

          saveInboxCache(ME_ID, next).catch(() => {});
          return next;
        });
      }
    );
    return () => {
      sub.remove();
    };
  }, [ME_ID, ME_USERNAME, ME_AVATAR, setChatList]);

  // Listen for thread open/close signals from UserChatScreen

  const markConversationRead = useCallback((_otherUserId: string | number) => {
    // No-op: message counting and unread state removed
    return;
  }, []);

  useEffect(() => {
    const onActive = DeviceEventEmitter.addListener(
      "thread:active",
      (p: { partnerId: string | number }) => {
        activeChatPartnerIdRef.current = p?.partnerId ?? null;
        if (p?.partnerId != null) {
          markConversationRead(p.partnerId);
        }
      }
    );
    const onInactive = DeviceEventEmitter.addListener("thread:inactive", () => {
      activeChatPartnerIdRef.current = null;
    });
    const onClear = DeviceEventEmitter.addListener(
      "inbox:clear",
      (p: { partnerId: string | number }) => {
        if (p?.partnerId != null) markConversationRead(p.partnerId);
      }
    );
    return () => {
      onActive.remove();
      onInactive.remove();
      onClear.remove();
    };
  }, [markConversationRead]);

  // SOCKET: real-time updates make inbox show latest message (both directions)
  useEffect(() => {
    // don't try to connect until we have a valid id and endpoint
    if (!socket || !ENDPOINT || !isValidId(ME_ID)) return;

    const normalizeKnown = (raw: any) => ({
      id: raw?.id,
      client_id: raw?.client_id ?? raw?.clientId,
      sender_id: String(
        raw?.sender_id ?? raw?.senderId ?? raw?.from_id ?? raw?.fromId ?? ""
      ),
      receiver_id: String(
        raw?.receiver_id ?? raw?.receiverId ?? raw?.to_id ?? raw?.toId ?? ""
      ),
      content: raw?.content ?? raw?.text ?? raw?.message ?? raw?.body ?? "",
      created_at: toIso(raw?.created_at ?? raw?.createdAt ?? raw?.timestamp),
      message_type:
        raw?.message_type ?? raw?.messageType ?? raw?.type ?? "text",
      shared_post: raw?.shared_post ?? raw?.sharedPost,
      is_read: raw?.is_read ?? raw?.isRead ?? false,
    });

    // super-tolerant auto-detector (used by onAny)
    const normalizeAny = (evt: string, raw: any) => {
      if (!raw || typeof raw !== "object") return null;
      const n = normalizeKnown(raw);
      if (!n.sender_id || !n.receiver_id) {
        const p = raw.payload || raw.data || raw.message || {};
        const m = normalizeKnown(p);
        if (m.sender_id && m.receiver_id) return m;
      }
      return n.sender_id && n.receiver_id ? n : null;
    };

    const bumpInboxWith = (msg: {
      id?: string;
      client_id?: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      created_at: string;
    }) => {
      // client_id-level dedupe (prevents double bumps when both local and socket fire)
      if (msg.client_id) {
        if (byClientIdRef.current.has(msg.client_id)) return;
        byClientIdRef.current.add(msg.client_id);
      }

      const seenKey = makeSeenKey(msg);
      if (seenKeySetRef.current.has(seenKey)) return;
      seenKeySetRef.current.add(seenKey);

      const partnerId =
        String(msg.sender_id) === String(ME_ID)
          ? msg.receiver_id
          : msg.sender_id;

      const created_at = msg.created_at;
      const text = msg.content ?? "";

      setChatList((prev: any[]) => {
        const idx = prev.findIndex((c: any) => {
          const { senderId, receiverId } = getIds(c);
          const otherId =
            String(senderId) === String(ME_ID) ? receiverId : senderId;
          return String(otherId) === String(partnerId);
        });

        const bump = (row: any): any => {
          const prevT = new Date(row?.created_at ?? 0).getTime();
          const nextT = new Date(created_at).getTime();
          if (nextT >= prevT) {
            return {
              ...row,
              content: text,
              created_at,
            };
          }
          return row;
        };

        let next: any[];
        if (idx >= 0) {
          const updated = bump(prev[idx]);
          next = [updated, ...prev.filter((_, i) => i !== idx)];
        } else {
          const seed: ChatItem = {
            id: `seed-${partnerId}-${Date.now()}`,
            sender: { id: partnerId } as any,
            receiver: { id: ME_ID } as any,
            content: text,
            created_at,
          } as any;
          next = [seed, ...prev];
        }
        saveInboxCache(ME_ID, next).catch(() => {});
        return next;
      });
    };

    const onIncoming = (raw: any) => {
      const msg = normalizeKnown(raw);
      if (!msg.sender_id || !msg.receiver_id) return;
      bumpInboxWith(msg);
    };

    socket.on("receiveMessage", onIncoming);
    socket.on("message", onIncoming);
    socket.on("newMessage", onIncoming);

    // Catch-all for unknown event names (private_message, chat, dm, etc.)
    const onAny = (event: string, payload: any) => {
      const n = normalizeAny(event, payload);
      if (!n) return;
      bumpInboxWith(n);
    };
    if (typeof (socket as any).onAny === "function") {
      (socket as any).onAny(onAny);
    }

    return () => {
      try {
        socket.off("receiveMessage", onIncoming);
        socket.off("message", onIncoming);
        socket.off("newMessage", onIncoming);
      } catch {}
      socketRef.current = null;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [ME_ID, TOKEN, socket, setChatList]);

  const openChatAndMarkRead = useCallback(
    (u: User, lastContent?: string, lastTime?: string) => {
      activeChatPartnerIdRef.current = u.id;
      markConversationRead(u.id);
      // (no unread count to clear)
      markConversationRead(u.id);
      router.push({
        pathname: "/(chat)",
        params: {
          userId: u.id,
          username: u.username,
          profilePicture: u.profile_picture,
          loggedUserId: ME_ID,
          loggedUsername: ME_USERNAME,
          loggedAvatar: ME_AVATAR,
          initialMessageText: lastContent,
          initialMessageTime: lastTime,
        },
      });
      // also broadcast for any other listeners
      DeviceEventEmitter.emit("thread:active", { partnerId: u.id });
    },
    [markConversationRead, router, ME_ID, ME_USERNAME, ME_AVATAR]
  );

  /* ---- ✅ REVISED stories derived hooks ---- */

  /* Stories viewer data (only users with stories) */
  const storiesViewerData: StoryUser[] = useMemo(() => {
    // Filter out users with no stories, as the viewer only shows users with stories
    return storyData.filter((u) => (u.stories ?? []).length > 0);
  }, [storyData]);

  const viewerIndexByUserId = useMemo(() => {
    const m = new Map<string | number, number>();
    storiesViewerData.forEach((u, idx) => m.set(u.user_id, idx));
    return m;
  }, [storiesViewerData]);

  const openStoryModal = useCallback(
    (user: StoryUser) => {
      const idx = viewerIndexByUserId.get(user.user_id);
      if (idx === undefined) return;
      setStoriesInitialIndex(idx);
      setStoriesVisible(true);
    },
    [viewerIndexByUserId]
  );

  /* Stories row data (You, then Unseen, then Seen@end) */
  const storyRowData = useMemo(() => {
    const you = storyData.find((u) => u.isYou);
    const others = storyData.filter(
      (u) => !u.isYou && (u.stories ?? []).length > 0
    );

    const unseen = others.filter(
      (u) => !seenStoryUserIds.has(String(u.user_id))
    );
    const seen = others.filter((u) => seenStoryUserIds.has(String(u.user_id)));

    // Create a persistent "you" object for the bubble
    // This ensures "Your Story" always shows, even with 0 stories
    const youBubbleUser: StoryUser = you || {
      user_id: me?.id || "you",
      user_image: ME_AVATAR,
      user_name: "Your Story",
      stories: [],
      isYou: true,
    };

    return [youBubbleUser, ...unseen, ...seen];
  }, [storyData, seenStoryUserIds, me, ME_AVATAR]);
  /* ✅ --------------------------------- */

  /* conversations used by FlatList */
  const conversations = useMemo(() => chatList, [chatList]);

  /* ---- UI ---- */
  return (
    <View
      style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top - 10 }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Stories */}
      <View className="mt-3">
        <FlatList
          horizontal
          data={storyRowData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.user_id)}
          contentContainerStyle={{
            alignItems: "center",
            paddingVertical: 6,
            paddingHorizontal: 12,
          }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          ListEmptyComponent={
            loadingStories ? (
              <View
                style={{
                  width: width - 24,
                  height: 98, // approx height of bubble + text
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator color="#9ca3af" />
              </View>
            ) : null // Or show a "No stories" placeholder
          }
          renderItem={({ item }) => {
            const u = item as StoryUser;
            if (u.isYou) {
              const hasStory = (u.stories ?? []).length > 0;
              return (
                <YouBubble
                  you={u}
                  uploading={uploading}
                  onOpenStories={() =>
                    hasStory ? openStoryModal(u) : openCameraModal()
                  }
                  onAdd={openCameraModal}
                />
              );
            }

            // Adapt StoryUser to User prop for StoryBubble
            const userProp: User = {
              id: String(u.user_id),
              username: u.user_name,
              profile_picture: u.user_image,
              stories: u.stories.map((s) => s.story_image),
            };
            const isSeen = seenStoryUserIds.has(String(u.user_id));

            return (
              <StoryBubble
                user={userProp}
                isSeen={isSeen}
                onOpen={() => openStoryModal(u)}
                onOpenProfile={() => openProfileModal(u.user_image)}
              />
            );
          }}
        />
      </View>

      {/* Search -> goes to Search page */}
      <View className="px-3 mt-2">
        <Pressable
          onPress={() => router.push("/(chat)/Search")}
          accessibilityLabel="Open people search"
        >
          <SearchBar
            value=""
            onChangeText={() => {}}
            placeholder="Search for people"
            readOnly
          />
        </Pressable>
      </View>

      {/* Chats list (messages only) */}
      <View className="flex-1 mt-2">
        <FlatList
          data={conversations}
          renderItem={({ item }) => (
            <ChatRow
              item={item}
              meId={ME_ID}
              onOpenChat={openChatAndMarkRead}
              onOpenProfile={(img) => {
                setProfileModalImage(img ?? DEFAULT_AVATAR);
                setProfileModalVisible(true);
              }}
            />
          )}
          keyExtractor={(item, index) =>
            pairKey(item as any) || `conv-${index}`
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: (insets.bottom || 16) + 55 }}
          scrollIndicatorInsets={{ bottom: (insets.bottom || 16) + 55 }}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <Text className="text-gray-500">
                No messages yet. Start one from Search.
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 4 }} />}
        />
      </View>

      {/* Profile image modal */}
      {profileModalVisible && (
        <Modal
          visible={profileModalVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <View className="flex-1 bg-black">
            <Pressable
              className="absolute top-10 left-4 z-50 p-2"
              onPress={() => setProfileModalVisible(false)}
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
          </View>
        </Modal>
      )}

      {/* Stories full-screen */}
      {storiesVisible && (
        <Modal
          visible={storiesVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setStoriesVisible(false)}
        >
          <View className="flex-1 bg-black">
            <Stories
              storiesData={storiesViewerData}
              initialUserIndex={storiesInitialIndex}
              onRequestClose={() => setStoriesVisible(false)}
              showStrip={false}
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
          onRequestClose={() => setPreviewOpen(false)}
        >
          <View
            className="flex-1 bg-black"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
          >
            <Pressable
              onPress={() => setPreviewOpen(false)}
              accessibilityLabel="Close preview"
              style={{
                position: "absolute",
                top: insets.top ? insets.top + 6 : 12,
                left: 10, // ✅ MOVED to left
                zIndex: 10,
                backgroundColor: "transparent",
              }}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>

            <View className="flex-1 items-center justify-center">
              {previewUri ? (
                previewIsVideo ? (
                  <PreviewVideo
                    uri={previewUri}
                    // ⛔ REMOVED: Faulty prop
                    // onHudVisibleChange={() => setHudVisible(true)}
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

            {/* ✅ FIXED: Removed !hudVisible wrapper */}
            <Pressable
              onPress={confirmPreviewAdd}
              disabled={uploading}
              accessibilityLabel="Add to story"
              style={{
                position: "absolute",
                top: insets.top ? insets.top + 6 : 12, // ✅ MOVED to top right
                right: 10, // ✅ MOVED to right
                alignSelf: "center",
                width: 50, // ✅ Increased size for easier tapping
                height: 50, // ✅ Increased size
                borderRadius: 25, // ✅ Adjusted border radius
                backgroundColor: "rgba(0, 0, 0, 0.5)", // ✅ Added background
                alignItems: "center",
                justifyContent: "center",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="arrow-forward" size={30} color="#ffffff" />
              )}
            </Pressable>
          </View>
        </Modal>
      )}

      {/* Stories Camera */}
      {cameraModalVisible && (
        <Modal
          visible={cameraModalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setCameraModalVisible(false)}
        >
          <StoriesCamera
            onMediaCaptured={handleMediaCaptured}
            onClose={() => setCameraModalVisible(false)}
            disableVideo={true}
          />
        </Modal>
      )}
    </View>
  );
}
