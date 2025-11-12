import SearchBar from "@/components/Searchbar";
import Stories from "@/components/Stories/Stories";
import StoriesCamera from "@/components/StoriesCamera";
import {
  DEFAULT_AVATAR,
  LOGGED_USER,
  USERS,
  type ChatItem,
  type User,
} from "@/constants/chat";
import { AuthContext } from "@/context/AuthContext";
import { apiCall } from "@/lib/api/apiService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useEventListener } from "expo";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useSegments } from "expo-router";
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
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import io from "socket.io-client";

/* ---- Endpoints on your backend ---- */
const CHATS_OF_USER = (id: string | number) => `/api/messages/user-chats/${id}`;
//const STORIES_FEED = (id: string | number) => `/api/posts/stories/feed/${id}`; // kept but unused

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
const SOCKET_PATH = "/socket.io/";
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
          className="items-center">
          {hasStory ? (
            isSeen ? (
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
          {(user.username ?? "user").split(".")[0]}
        </Text>
      </View>
    );
  }
);
StoryBubble.displayName = "StoryBubble";

/* ---------- Your bubble ---------- */
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
  onOpenChat: (u: User) => void;
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

/* ---------- Preview video ---------- */
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
      if (now - lastPing.current >= 2500) onHudVisibleChange(false);
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
        // @ts-ignore
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
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const auth = useContext(AuthContext);
  const me = auth?.user;
  const ME_ID = (me?.id as string | number | undefined) ?? "me";
  const ME_USERNAME = me?.username ?? "you";
  const ME_AVATAR = (me as any)?.profilePicture ?? DEFAULT_AVATAR;
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

  // STORIES: same structure as second file (use dummy users from constants)
  const [storiesVisible, setStoriesVisible] = useState(false);
  const [storiesInitialIndex, setStoriesInitialIndex] = useState(0);
  const [storyUsers, setStoryUsers] = useState<(User & { isYou?: boolean })[]>(
    () => {
      const others = USERS.filter(
        (u) => String(u.id) !== String(LOGGED_USER.id)
      );
      return [
        {
          ...(LOGGED_USER as any),
          id: "you", // keep "you" sentinel for viewer ordering
          isYou: true,
          username: ME_USERNAME,
          profile_picture: ME_AVATAR,
        } as any,
        ...others,
      ];
    }
  );

  const [seenStoryUserIds, setSeenStoryUserIds] = useState<Set<string>>(
    new Set()
  );

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);

  // message conversations only
  const [chatList, setChatList] = useState<ChatItem[]>([]);

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
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const seenKeySetRef = useRef<Set<string>>(new Set());
  const byClientIdRef = useRef<Set<string>>(new Set());
  const connectedRef = useRef(false);
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
  const confirmPreviewAdd = useCallback(async () => {
    if (!previewUri) return;
    setUploading(true);
    try {
      setStoryUsers((prev) =>
        prev.map((u) =>
          (u as any).isYou
            ? { ...u, stories: [...(u.stories ?? []), previewUri] }
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

  /* ---- fetch chats only (stories are local dummy now) ---- */
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

        // merge local rows, but don't let slightly older server overwrite fresher local
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
  }, [ME_ID]);

  // warm cache on mount then fetch fresh (stories are local/dummy so no fetch)
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
      // stories are already seeded from constants in state initializer
    })();
  }, [ME_ID, fetchChatsOnly]);

  // refetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchChatsOnly();
    }, [fetchChatsOnly])
  );

  // refetch when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchChatsOnly();
    });
    return () => sub.remove();
  }, [fetchChatsOnly]);

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
  }, [ME_ID, ME_USERNAME, ME_AVATAR]);

  // Listen for thread open/close signals from UserChatScreen
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
  }, []);

  // SOCKET: real-time updates make inbox show latest message (both directions)
  useEffect(() => {
    // don't try to connect until we have a valid id and endpoint
    if (!ENDPOINT || !isValidId(ME_ID)) return;

    const s = io(ENDPOINT, {
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
      reconnection: true,
      auth: {
        token: TOKEN || "",
        userId: String(ME_ID),
      },
    });
    socketRef.current = s;

    if (__DEV__) {
      s.on("connect", () => {
        console.log("[inbox] socket connected", { id: s.id, url: ENDPOINT });
      });
      s.on("connect_error", (e: any) => {
        console.warn("[inbox] connect_error:", e?.message);
      });
    }

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

    const doJoin = () => {
      const uid = String(ME_ID);
      s.emit("join", {
        userId: uid,
        user_id: uid,
        id: uid,
        token: TOKEN || "",
      });
    };

    s.on("connect", () => {
      connectedRef.current = true;
      doJoin();
      fetchChatsOnly(); // sync missed while disconnected
      // gentle safety poll while connected
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => {
          fetchChatsOnly();
        }, 25000);
      }
    });

    s.on("reconnect", () => {
      connectedRef.current = true;
      doJoin();
      fetchChatsOnly();
    });

    s.on("disconnect", () => {
      connectedRef.current = false;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    });

    s.on("receiveMessage", onIncoming);
    s.on("message", onIncoming);
    s.on("newMessage", onIncoming);

    // Catch-all for unknown event names (private_message, chat, dm, etc.)
    const onAny = (event: string, payload: any) => {
      const n = normalizeAny(event, payload);
      if (!n) return;
      bumpInboxWith(n);
    };
    if (typeof (s as any).onAny === "function") {
      (s as any).onAny(onAny);
    }

    return () => {
      try {
        s.off("receiveMessage", onIncoming);
        s.off("message", onIncoming);
        s.off("newMessage", onIncoming);
        if (typeof (s as any).offAny === "function") {
          (s as any).offAny(onAny);
        }
        s.disconnect();
      } catch {}
      socketRef.current = null;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [ME_ID, TOKEN, fetchChatsOnly]);

  const markConversationRead = useCallback((_otherUserId: string | number) => {
    // No-op: message counting and unread state removed
    return;
  }, []);

  const openChatAndMarkRead = useCallback(
    (u: User) => {
      // set current open thread
      activeChatPartnerIdRef.current = u.id;
      // (no unread count to clear)
      markConversationRead(u.id);
      router.push({
        pathname: "/chat/UserChatScreen",
        params: {
          userId: u.id,
          username: u.username,
          profilePicture: u.profile_picture,
          loggedUserId: ME_ID,
          loggedUsername: ME_USERNAME,
          loggedAvatar: ME_AVATAR,
        },
      });
      // also broadcast for any other listeners
      DeviceEventEmitter.emit("thread:active", { partnerId: u.id });
    },
    [markConversationRead, router, ME_ID, ME_USERNAME, ME_AVATAR]
  );

  const bottomSpacer = (insets.bottom || 16) + 55;

  /* ---- stories derived (copied from second file) ---- */
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
      user_id: (u as any).id,
      user_image: u.profile_picture ?? DEFAULT_AVATAR,
      user_name: u.username ?? "User",
      stories: (u.stories ?? []).map((uri: string, idx: number) => ({
        story_id: `${(u as any).id}-${idx}`,
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

  /* conversations used by FlatList */
  const conversations = useMemo(() => chatList, [chatList]);

  /* ---- UI ---- */
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* Stories */}
      <View className="mt-3">
        <FlatList
          horizontal
          data={storyRowData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(it, idx) =>
            String((it as any)?.id ?? (it as any)?.user_id ?? `story-${idx}`)
          }
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
                    hasStory ? openStoryModal(u) : openCameraModal()
                  }
                  onAdd={openCameraModal}
                />
              );
            }
            const isSeen = seenStoryUserIds.has(String((u as any).id));
            return (
              <StoryBubble
                user={u}
                isSeen={isSeen}
                onOpen={openStoryModal}
                onOpenProfile={openProfileModal}
              />
            );
          }}
        />
      </View>

      {/* Search -> goes to Search page */}
      <View className="px-3 mt-2">
        <Pressable
          onPress={() => router.push("/chat/Search")}
          accessibilityLabel="Open people search">
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

      {/* Stories full-screen */}
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

            <View className="flex-1 items-center justify-center">
              {previewUri ? (
                previewIsVideo ? (
                  <PreviewVideo
                    uri={previewUri}
                    onHudVisibleChange={(v) => setHudVisible(v)}
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

      {/* Stories Camera */}
      {cameraModalVisible && (
        <Modal
          visible={cameraModalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setCameraModalVisible(false)}>
          <StoriesCamera
            onMediaCaptured={handleMediaCaptured}
            onClose={() => setCameraModalVisible(false)}
          />
        </Modal>
      )}
    </View>
  );
}
