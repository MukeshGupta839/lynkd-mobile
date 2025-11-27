// app/(chat)/index.tsx
import ProductModal from "@/components/PostCreation/ProductModal";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DeviceEventEmitter,
  FlatList,
  Image,
  InteractionManager,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  TextInputKeyPressEvent,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import ShareIcon from "@/assets/svg/Share.svg";
import StatusModal from "@/components/StatusModal";
import { StatusBar } from "expo-status-bar";
import * as VideoThumbnails from "expo-video-thumbnails";
import Svg, { Path } from "react-native-svg";
import Camera from "../../assets/posts/camera.svg";
import Cart from "../../assets/posts/cart.svg";
import Document from "../../assets/posts/document.svg";
import Gallery from "../../assets/posts/gallery.svg";
import Location from "../../assets/posts/location.svg";

import Octicons from "@expo/vector-icons/Octicons";

import { apiCall } from "@/lib/api/apiService";

// 🔹 Reanimated (V1 feature)
import { useSocket } from "@/context/SocketProvider";
import { useChatStore } from "@/stores/chatStore";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ChatOptionsBottomSheet from "./ChatOptionsBottomSheet";

type Message = {
  id: string; // server id OR temporary local id
  clientId?: string; // optimistic idempotency key
  text?: string;
  image?: string;
  createdAt: string; // ISO
  createdAtMs: number; // number
  userId: string;
  username?: string;
  product?: { id: string; name: string } | null;
  messageType?: "text" | "post";
  postId?: string;
  postPreview?: any;
};

type ServerMessage = {
  id?: string;
  client_id?: string;
  sender_id: string;
  receiver_id: string;
  content?: string;
  message_type?: "text" | "shared_post";
  shared_post?: any;
  created_at?: string;
  is_read?: boolean;
};

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* ----------------------------- */
const toMs = (iso?: string): number => {
  if (!iso) return Date.now();
  const hasTZ = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(iso);
  const safe = hasTZ ? iso : `${iso}Z`;
  const t = Date.parse(safe);
  return Number.isFinite(t) ? t : Date.now();
};

const isValidId = (v?: string) => {
  if (!v) return false;
  const s = String(v);
  if (s === "me" || s === "other") return false;
  const reNum = /^\d+$/;
  const reUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return reNum.test(s) || reUuid.test(s) || s.length >= 3;
};
const makeClientId = () =>
  `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/* ---------------- ONLY-ID DEDUPE ---------------- */
const mergeById = (items: Message[]): Message[] => {
  const map = new Map<string, Message>();
  for (const m of items) {
    if (!m) continue;
    if (m.id) {
      map.set(m.id, m);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
};

/* ------------------------------------------------------------- */

// app/(chat)/index.tsx

function normalizePreview(raw?: any): any | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  // --- START: FIX ---
  // Read properties from the correct API response structure
  const v =
    raw.verified ??
    raw.isVerified ??
    raw.author_verified ??
    raw.user?.verified ??
    raw.user?.isVerified ??
    raw.is_creator;

  const image = raw.media_url ?? raw.image ?? ""; // Use media_url first
  const author = raw.user?.username ?? raw.author ?? "Post"; // Use user.username first
  const authorAvatar =
    raw.user?.profile_picture ?? raw.author_avatar ?? undefined; // Use user.profile_picture first
  // --- END: FIX ---

  return {
    id: String(raw.id ?? ""),
    // --- START: FIX ---
    image: typeof image === "string" ? image : "",
    author: typeof author === "string" ? author : "Post",
    caption: typeof raw.caption === "string" ? raw.caption : "",
    author_avatar: typeof authorAvatar === "string" ? authorAvatar : undefined,
    // --- END: FIX ---
    videoUrl: typeof raw.videoUrl === "string" ? raw.videoUrl : undefined,
    thumb: typeof raw.thumb === "string" ? raw.thumb : undefined,
    verified: Boolean(v),
    likes: typeof raw.likes === "number" ? raw.likes : undefined,
    comments: typeof raw.comments === "number" ? raw.comments : undefined,
  };
}

const formatFromServer = (
  msg: ServerMessage,
  me: { id: string; username: string },
  them: { id: string; username: string }
): Message => {
  const kind = msg.message_type ?? "text";
  const isText = kind === "text";
  const createdAtMs = toMs(msg.created_at);
  return {
    id: msg.id || Math.random().toString(36).slice(2),
    clientId: msg.client_id,
    text: isText ? (msg.content ?? "") : undefined,
    createdAt: new Date(createdAtMs).toISOString(),
    createdAtMs,
    userId: String(msg.sender_id),
    username: String(msg.sender_id) === me.id ? me.username : them.username,
    messageType: isText ? "text" : "post",
    postId: !isText ? String(msg.shared_post?.id ?? "") : undefined,
    postPreview: !isText ? normalizePreview(msg.shared_post) : undefined,
  };
};

const toServerMessage = (
  local: Message,
  meId: string,
  themId: string
): ServerMessage => ({
  id: local.id,
  client_id: local.clientId,
  sender_id: meId,
  receiver_id: themId,
  content: local.text ?? "",
  message_type: local.messageType === "post" ? "shared_post" : "text",
  created_at: local.createdAt,
  is_read: false,
});

/* --------------------------- */
const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const isSameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);
const labelForDay = (ms: number) => {
  const now = new Date();
  const d = new Date(ms);
  const diffDays = Math.round(
    (startOfDay(now.getTime()) - startOfDay(ms)) / 86400000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};
const withinGroup = (a: Message, b: Message) => {
  if (!a || !b) return false;
  if (String(a.userId) !== String(b.userId)) return false;
  return Math.abs(a.createdAtMs - b.createdAtMs) <= 2 * 60 * 1000;
};

/* ---------- pending-per-text queue ---------- */
const trimKey = (s?: string) => (s ?? "").trim();
function pushPending(
  mapRef: React.MutableRefObject<Map<string, string[]>>,
  textKey: string,
  optimisticId: string
) {
  const key = trimKey(textKey);
  if (!key) return;
  const q = mapRef.current.get(key) ?? [];
  q.push(optimisticId);
  mapRef.current.set(key, q);
}
function popPending(
  mapRef: React.MutableRefObject<Map<string, string[]>>,
  textKey: string
): string | undefined {
  const key = trimKey(textKey);
  if (!key) return undefined;
  const q = mapRef.current.get(key);
  if (!q || q.length === 0) return undefined;
  const id = q.shift();
  if (!q.length) mapRef.current.delete(key);
  else mapRef.current.set(key, q);
  return id;
}
function removeSpecificPending(
  mapRef: React.MutableRefObject<Map<string, string[]>>,
  textKey: string,
  optimisticId: string
) {
  const key = trimKey(textKey);
  const q = mapRef.current.get(key);
  if (!q) return;
  const idx = q.indexOf(optimisticId);
  if (idx >= 0) q.splice(idx, 1);
  if (!q.length) mapRef.current.delete(key);
  else mapRef.current.set(key, q);
}

const DayDivider = ({ label }: { label: string }) => (
  <View className="w-full items-center my-3">
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <Text className="text-[11px] text-gray-600">{label}</Text>
    </View>
  </View>
);

/* --------------------------- */
const TIME_RIGHT_PAD = 50; // keep for post/product bubbles

const MessageBubble = React.memo(function MessageBubble({
  message,
  mine,
  maxBubbleWidth,
  onPressImage,
  onLongPress,
  onPress,
  selected,
  onMeasure,
  onOpenReel,
  onOpenFeedPost,
  isFirstInGroup,
  isLastInGroup,
}: {
  message: Message;
  mine: boolean;
  maxBubbleWidth: number;
  onPressImage: (id: string) => void;
  onLongPress: (id: string) => void;
  onPress: (id: string) => void;
  selected?: boolean;
  onMeasure?: (id: string, height: number) => void;
  onOpenReel?: (postId?: string) => void;
  onOpenFeedPost?: (postId?: string) => void;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}) {
  const timeText = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeInsideColor = mine ? "#4b5563" : "#6b7280";

  const postCardWidth = Math.min(maxBubbleWidth, 320);
  const postMediaHeight = Math.round(postCardWidth);

  const safePreview = (message.postPreview ?? {}) as any;
  const previewAuthor =
    typeof safePreview.author === "string" && safePreview.author
      ? safePreview.author
      : "Post";
  const previewAvatar =
    typeof safePreview.author_avatar === "string" && safePreview.author_avatar
      ? safePreview.author_avatar
      : DEFAULT_AVATAR;
  const previewImage =
    typeof safePreview.image === "string" ? safePreview.image : "";
  const previewCaption =
    typeof safePreview.caption === "string" ? safePreview.caption : "";
  const previewVideo =
    typeof safePreview.videoUrl === "string" && safePreview.videoUrl
      ? safePreview.videoUrl
      : undefined;
  const previewThumb =
    typeof safePreview.thumb === "string" && safePreview.thumb
      ? safePreview.thumb
      : undefined;

  const [generatedThumb, setGeneratedThumb] = useState<string | undefined>();
  useEffect(() => {
    if (!previewVideo || previewThumb || generatedThumb) return;
    let cancelled = false;

    (async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(previewVideo, {
          time: 800,
        });
        if (!cancelled) setGeneratedThumb(uri);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [previewVideo, previewThumb, generatedThumb]);

  const sourceUri = previewThumb || generatedThumb || previewImage || undefined;

  const baseRadius = 18;

  const bubbleCommonStyle: ViewStyle = {
    borderTopLeftRadius: baseRadius,
    borderTopRightRadius: baseRadius,
    borderBottomLeftRadius: mine ? baseRadius : 2,
    borderBottomRightRadius: mine ? 2 : baseRadius,
    position: "relative",
    minHeight: 36,
  };

  const containerSpacing = isFirstInGroup ? 8 : 2;

  // Absolute time badge (for non-text)
  const Time = ({ className }: { className?: string }) => (
    <Text
      numberOfLines={1}
      ellipsizeMode="clip"
      allowFontScaling={false}
      style={{
        // position: "absolute",
        // right: 8,
        // bottom,
        fontSize: 10,
        lineHeight: 12,
        includeFontPadding: false,
        color: timeInsideColor,
        minWidth: 56,
        textAlign: "right",
        // marginRight: 12,
      }}
      className={`${className ?? ""}`}
    >
      {timeText}
    </Text>
  );

  return (
    <View style={{ marginTop: containerSpacing }}>
      <Pressable
        onLongPress={() => onLongPress(message.id)}
        onPress={() => onPress(message.id)}
        accessibilityLabel="Message"
        onLayout={(e) =>
          onMeasure?.(message.id, Math.round(e.nativeEvent.layout.height))
        }
      >
        <View className={`flex-row ${mine ? "justify-end pr-3" : "pl-3"} mb-0`}>
          <View
            style={{ maxWidth: maxBubbleWidth }}
            className={`${mine ? "items-end" : "items-start"}`}
          >
            {/* Product bubble */}
            {message.product ? (
              <View
                style={[
                  bubbleCommonStyle,
                  {
                    backgroundColor: mine ? "#DCF8C6" : "#FFFFFF",
                    paddingTop: 10,
                    paddingBottom: 20,
                    paddingHorizontal: 12,
                    paddingRight: TIME_RIGHT_PAD,
                    borderWidth: mine ? 0 : 1,
                    borderColor: "#E5E7EB",
                    shadowColor: mine ? "#000" : undefined,
                    shadowOpacity: mine ? 0.06 : 0,
                    shadowRadius: mine ? 6 : 0,
                    shadowOffset: mine ? { width: 0, height: 2 } : undefined,
                    elevation: mine ? 1 : 0,
                  },
                ]}
              >
                <Text className="font-semibold text-black">
                  {message.product.name}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Product attached
                </Text>
                <Time />
              </View>
            ) : null}

            {/* Post bubble */}
            {message.messageType === "post" && message.postId ? (
              message.postPreview ? (
                <View
                  style={[
                    bubbleCommonStyle,
                    {
                      backgroundColor: mine ? "#DCF8C6" : "#FFFFFF",
                      borderWidth: mine ? 0 : 1,
                      borderColor: "#E5E7EB",
                      overflow: "hidden",
                      shadowColor: mine ? "#000" : undefined,
                      shadowOpacity: mine ? 0.06 : 0,
                      shadowRadius: mine ? 6 : 0,
                      shadowOffset: mine ? { width: 0, height: 2 } : undefined,
                      elevation: mine ? 1 : 0,
                    },
                  ]}
                  className="py-2 gap-2"
                >
                  <View className="flex-row items-center px-3">
                    <Image
                      source={{ uri: previewAvatar }}
                      className="w-7 h-7 rounded-full mr-2"
                    />
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-black">
                        {previewAuthor}
                      </Text>
                      {safePreview.verified ? (
                        <Octicons
                          name="verified"
                          size={16}
                          color="#000000ff"
                          style={{ marginLeft: 6 }}
                        />
                      ) : null}
                    </View>
                  </View>

                  {sourceUri && (
                    <Pressable
                      onPress={() => {
                        if (!message.postId) return;
                        onPress(message.postId);
                      }}
                      style={{
                        width: postCardWidth,
                        height: postMediaHeight,
                        overflow: "hidden",
                        backgroundColor: "#000",
                      }}
                    >
                      <Image
                        source={{ uri: sourceUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </Pressable>
                  )}

                  {previewCaption && (
                    <View className="px-3">
                      <Text numberOfLines={2} className="text-xs text-gray-800">
                        {previewCaption}
                      </Text>
                    </View>
                  )}

                  <Time className="pr-3" />
                </View>
              ) : (
                <View
                  style={[
                    bubbleCommonStyle,
                    {
                      backgroundColor: mine ? "#DCF8C6" : "#FFFFFF",
                      padding: 12,
                      paddingBottom: 10,
                      paddingRight: TIME_RIGHT_PAD,
                      borderWidth: mine ? 0 : 1,
                      borderColor: "#E5E7EB",
                    },
                  ]}
                >
                  <Text className="font-semibold text-black">
                    {mine ? "You shared a post" : "Shared a post"}
                  </Text>
                  <View className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 items-center justify-center">
                    <Text className="text-xs text-gray-500">{`Post ID: ${message.postId}`}</Text>
                    <Text className="text-xs text-gray-400 mt-2">
                      Tap to view
                    </Text>
                  </View>
                  <Time />
                </View>
              )
            ) : null}

            {/* TEXT bubble — inline time like WhatsApp */}
            {message.text ? (
              <View
                style={[
                  bubbleCommonStyle,
                  {
                    backgroundColor: mine ? "#DCF8C6" : "#FFFFFF",
                    borderWidth: mine ? 0 : 1,
                    borderColor: "#E5E7EB",
                    shadowColor: mine ? "#000" : undefined,
                    shadowOpacity: mine ? 0.06 : 0,
                    shadowRadius: mine ? 6 : 0,
                    shadowOffset: mine ? { width: 0, height: 2 } : undefined,
                    elevation: mine ? 1 : 0,
                  },
                ]}
                className="px-3 py-2 gap-1"
              >
                <Text
                  style={{
                    color: "#111827",
                    fontSize: 16,
                    lineHeight: 20,
                    includeFontPadding: false,
                  }}
                >
                  {message.text}
                  {"  "}
                </Text>
                <Time />
              </View>
            ) : null}

            {/* Image bubble — tap to full-screen preview */}
            {message.image ? (
              <Pressable
                onPress={() => onPressImage(message.id)}
                style={{ borderRadius: 12, overflow: "hidden", marginTop: 2 }}
              >
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: message.image }}
                    className="w-48 h-36"
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      position: "absolute",
                      right: 6,
                      bottom: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 10,
                      backgroundColor: "rgba(0,0,0,0.35)",
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      allowFontScaling={false}
                      style={{
                        fontSize: 10,
                        color: "#fff",
                        includeFontPadding: false,
                        minWidth: 56,
                        textAlign: "right",
                        lineHeight: 12,
                      }}
                    >
                      {timeText}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
});
MessageBubble.displayName = "MessageBubble";

/* --------------------------- */
const UserChatScreen = () => {
  const router = useRouter();
  const { socket } = useSocket();

  const {
    userId,
    username,
    profilePicture,
    loggedUserId,
    loggedUsername,
    lastMessage,
    preview,
    subtitle,
    skipHistory,
  } = useLocalSearchParams<{
    userId?: string;
    username?: string;
    profilePicture?: string;
    loggedUserId?: string;
    loggedUsername?: string;
    loggedAvatar?: string;
    lastMessage?: string;
    preview?: string;
    subtitle?: string;
    skipHistory?: string;
  }>();

  const currentUserId = String(loggedUserId ?? "me");
  const currentUsername = loggedUsername ?? "You";
  const [statusOpen, setStatusOpen] = useState(false);

  const chattingUser = useMemo(
    () => ({
      userId: String(userId ?? "other"),
      username: username ?? "Unknown User",
      profilePicture: profilePicture ?? DEFAULT_AVATAR,
    }),
    [userId, username, profilePicture]
  );

  const routePreview =
    (lastMessage as string) ||
    (preview as string) ||
    (subtitle as string) ||
    undefined;

  const cacheKey = `chatHistory-${currentUserId}-${chattingUser.userId}`;

  // Migrate messages state to a global zustand store to persist across chat screens
  const messages = useChatStore((s) => s.messages) as Message[];
  const setMessages = useChatStore((s) => s.setMessages);
  const [text, setText] = useState("");
  const [showPreviewImage, setShowPreviewImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // NEW: confirm-send image modal state
  const [confirmImageUri, setConfirmImageUri] = useState<string | null>(null);
  const [showSendImageModal, setShowSendImageModal] = useState(false);

  const flatListRef = useRef<FlatList<Message> | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const maxBubbleWidth = Math.round(useWindowDimensions().width * 0.78);
  const [composerHeight, setComposerHeight] = useState(0);
  const inputRef = useRef<TextInput | null>(null);

  const [showAttachmentStrip, setShowAttachmentStrip] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [composerH, setComposerH] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const isAtBottomRef = useRef(true);
  const initialJumpDoneRef = useRef(false);

  const keyboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const lastSentRef = useRef<string | null>(null);

  // small helper to force a UI tick when sendingRef changes (so disabled state updates)
  const [, forceTick] = useState(0);

  const byClientIdRef = useRef<Map<string, string>>(new Map());
  const pendingByTextRef = useRef<Map<string, string[]>>(new Map());

  // 🔹 V1: keyboard height (animated)
  const kbH = useSharedValue(0);
  const OPENED_OFFSET = 4;
  const BASE_TRIM = 0;

  const dismissKeyboardAndWait = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (keyboardTimeoutRef.current) clearTimeout(keyboardTimeoutRef.current);
      Keyboard.dismiss();
      InteractionManager.runAfterInteractions(() => {
        keyboardTimeoutRef.current = setTimeout(
          () => resolve(),
          Platform.OS === "ios" ? 150 : 100
        );
      });
    });
  }, []);

  const openReelFromChat = useCallback(
    (postId?: string) => {
      if (!postId) return;
      router.push({
        pathname: "/(tabs)/posts",
        params: { openPostId: String(postId) },
      });
    },
    [router]
  );

  const openFeedPostFromChat = useCallback(
    (postId?: string) => {
      if (!postId) return;
      router.push({ pathname: "/(tabs)", params: { postId: String(postId) } });
    },
    [router]
  );

  const heightCache = useRef<Record<string, number>>({});
  const onMeasureItem = useCallback((id: string, height: number) => {
    if (!id) return;
    const prev = heightCache.current[id];
    const rounded = Math.round(height);
    if (!prev || prev !== rounded) heightCache.current[id] = rounded;
  }, []);

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistBatched = useCallback(
    (nextMessages: Message[]) => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(async () => {
        try {
          const lean = nextMessages.map((m) => {
            const base: Message = {
              ...m,
              createdAt: new Date(m.createdAtMs).toISOString(),
            };
            if (!base.postPreview) return base;
            const p = normalizePreview(base.postPreview) as any;
            const caption =
              typeof p.caption === "string" ? p.caption.slice(0, 200) : "";
            return { ...base, postPreview: { ...p, caption } } as Message;
          });
          await AsyncStorage.setItem(cacheKey, JSON.stringify(lean));
        } catch {}
        persistTimerRef.current = null;
      }, 300);
    },
    [cacheKey]
  );

  const pickPreviewText = useCallback(
    (row?: any): string | undefined =>
      routePreview ??
      row?.lastMessage?.text ??
      row?.lastMessage?.content ??
      row?.content ??
      row?.message ??
      row?.preview ??
      row?.subtitle ??
      undefined,
    [routePreview]
  );

  // 2. Create a "Seed" effect
  // This runs ONCE when the component mounts to show data instantly
  // useEffect(() => {
  //   // Only run if we have text and the list is currently empty
  //   if (initialMessageText && messages.length === 0) {
  //     const seedId = `temp-${Date.now()}`;
  //     const seedTime = initialMessageTime
  //       ? toMs(initialMessageTime)
  //       : Date.now();

  //     const seedMessage: Message = {
  //       id: seedId,
  //       text: initialMessageText,
  //       // Ensure the ID matches the partner so it shows on the left
  //       userId: chattingUser.userId,
  //       username: chattingUser.username,
  //       createdAt: new Date(seedTime).toISOString(),
  //       createdAtMs: seedTime,
  //       messageType: "text",
  //     };

  //     // Update the store immediately
  //     setMessages([seedMessage]);
  //   }
  // }, [
  //   initialMessageText,
  //   initialMessageTime,
  //   chattingUser.userId,
  //   chattingUser.username,
  //   messages.length,
  //   setMessages,
  // ]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        const cachedRaw: Message[] = raw ? JSON.parse(raw) : [];
        const cached: Message[] = cachedRaw.map((m) => {
          const ms = m.createdAtMs ?? toMs(m.createdAt);
          return {
            ...m,
            createdAtMs: ms,
            createdAt: new Date(ms).toISOString(),
          };
        });

        const map = new Map<string, Message>();
        cached.forEach((m) => m?.id && map.set(m.id, m));
        let merged = Array.from(map.values());

        // const inboxRow = findChatListRow();
        // const previewText = pickPreviewText(inboxRow);

        // if (merged.length === 0 && previewText) {
        //   const ms = Date.now();
        //   merged.push({
        //     id: `seed_${ms}`,
        //     text: String(previewText),
        //     createdAt: new Date(ms).toISOString(),
        //     createdAtMs: ms,
        //     userId: chattingUser.userId,
        //     username: chattingUser.username,
        //     messageType: "text",
        //   });
        // }

        merged.sort((a, b) => b.createdAtMs - a.createdAtMs);
        merged = mergeById(merged);

        if (!mounted) return;

        setMessages(merged);
        persistBatched(merged);

        initialJumpDoneRef.current = true;
      } catch {}
    };
    load();
    return () => {
      mounted = false;
    };
  }, [
    cacheKey,
    chattingUser.userId,
    chattingUser.username,
    currentUserId,
    persistBatched,
    pickPreviewText,
    setMessages,
  ]);

  const scrollToNewest = useCallback(
    (animated = true) => {
      requestAnimationFrame(() => {
        if (!messages.length) return;
        flatListRef.current?.scrollToOffset({ offset: 0, animated });
      });
    },
    [messages.length]
  );

  useEffect(() => {
    if (!lastSentRef.current) return;
    if (!messages.length) {
      lastSentRef.current = null;
      return;
    }
    if (messages[0].id === lastSentRef.current) {
      scrollToNewest(true);
      lastSentRef.current = null;
    }
  }, [messages, scrollToNewest]);

  // add image message after confirm
  const addImageMessage = useCallback(
    (uri: string) => {
      const now = Date.now();
      const m: Message = {
        id: Math.random().toString(36).slice(2),
        clientId: makeClientId(),
        image: uri,
        createdAt: new Date(now).toISOString(),
        createdAtMs: now,
        userId: currentUserId,
        username: currentUsername,
      };
      byClientIdRef.current.set(m.clientId!, m.id);
      lastSentRef.current = m.id;
      setMessages((prev) => {
        const next = mergeById([m, ...prev]);
        persistBatched(next);
        return next;
      });
    },
    [currentUserId, currentUsername, persistBatched, setMessages]
  );

  const pickImage = useCallback(async () => {
    try {
      await dismissKeyboardAndWait();
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        quality: 0.9,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setConfirmImageUri(uri);
      setShowSendImageModal(true);
      setShowAttachmentStrip(false);
    } catch {}
  }, [dismissKeyboardAndWait]);

  const takePhoto = useCallback(async () => {
    try {
      await dismissKeyboardAndWait();
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images", "videos"] as any,
        quality: 0.9,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setConfirmImageUri(uri);
      setShowSendImageModal(true);
      setShowAttachmentStrip(false);
    } catch {}
  }, [dismissKeyboardAndWait]);

  const onProductSelect = useCallback(
    (p: { id: string; name: string }) => {
      const now = Date.now();
      const m: Message = {
        id: Math.random().toString(36).slice(2),
        clientId: makeClientId(),
        product: { id: p.id, name: p.name },
        createdAt: new Date(now).toISOString(),
        createdAtMs: now,
        userId: currentUserId,
        username: currentUsername,
      };
      byClientIdRef.current.set(m.clientId!, m.id);
      lastSentRef.current = m.id;
      setMessages((prev) => {
        const next = mergeById([m, ...prev]);
        persistBatched(next);
        return next;
      });
      setShowProductModal(false);
      setShowAttachmentStrip(false);
    },
    [currentUserId, currentUsername, persistBatched, setMessages]
  );

  const me = useMemo(
    () => ({
      id: currentUserId,
      username: currentUsername,
    }),
    [currentUserId, currentUsername]
  );
  const them = useMemo(
    () => ({
      id: chattingUser.userId,
      username: chattingUser.username,
    }),
    [chattingUser.userId, chattingUser.username]
  );

  // Stable refs for current identities so handlers don't force socket reconnection
  const meRef = useRef(me);
  const themRef = useRef(them);
  useEffect(() => {
    meRef.current = me;
    themRef.current = them;
  }, [me, them]);

  // Keep a ref to the latest handleIncoming so socket listeners remain stable
  const handleIncomingRef = useRef<any>(null);

  // Dedupe any server echoes across event names / retries
  const seenIncomingKeysRef = useRef<Set<string>>(new Set());

  const makeIncomingKey = (m: ServerMessage) => {
    if (!m) return `fx:empty`;
    // prefer strong identity first
    if (m.id) return `id:${m.id}`;
    if (m.client_id) return `cid:${m.client_id}`;
    // fallback composite (rarely used, only if server omits both)
    const ts = toMs(m.created_at);
    const body = (m.content || "").slice(0, 64);
    return `fx:${m.sender_id}|${m.receiver_id}|${ts}|${body}`;
  };

  const handleIncoming = useCallback(
    (incomingRaw: any) => {
      const normalized: ServerMessage = {
        id: incomingRaw?.id,
        client_id: incomingRaw?.client_id ?? incomingRaw?.clientId,
        sender_id: String(
          incomingRaw?.sender_id ?? incomingRaw?.senderId ?? ""
        ),
        receiver_id: String(
          incomingRaw?.receiver_id ?? incomingRaw?.receiverId ?? ""
        ),
        content: incomingRaw?.content ?? incomingRaw?.text ?? "",
        message_type:
          incomingRaw?.message_type ?? incomingRaw?.messageType ?? "text",
        shared_post: incomingRaw?.shared_post ?? incomingRaw?.sharedPost,
        created_at:
          incomingRaw?.created_at ??
          incomingRaw?.createdAt ??
          new Date().toISOString(),
        is_read: incomingRaw?.is_read ?? incomingRaw?.isRead ?? false,
      };

      // ---- hard dedupe guard (prevents double UI adds) ----
      try {
        const key = makeIncomingKey(normalized);
        if (seenIncomingKeysRef.current.has(key)) {
          return; // we've already processed this payload
        }
        seenIncomingKeysRef.current.add(key);
      } catch {}

      // 1) My echo with client_id
      if (
        normalized.client_id &&
        byClientIdRef.current.has(normalized.client_id)
      ) {
        const optimisticId = byClientIdRef.current.get(normalized.client_id)!;
        setMessages((prev) => {
          const serverMsg = formatFromServer(normalized, me, them);
          // If we already have this server id, skip (prevents double-insert)
          if (serverMsg.id && prev.some((m) => m.id === serverMsg.id))
            return prev;
          const idx = prev.findIndex((m) => m.id === optimisticId);
          if (idx === -1) {
            const next = mergeById([serverMsg, ...prev]);
            persistBatched(next);
            return next;
          }
          const optText = trimKey(prev[idx].text);
          const updated = [...prev];
          updated[idx] = {
            ...serverMsg,
            clientId: normalized.client_id,
            userId: me.id,
          };
          const next = mergeById(updated);
          persistBatched(next);
          removeSpecificPending(pendingByTextRef, optText, optimisticId);
          return next;
        });
        if (isAtBottomRef.current) scrollToNewest(false);
        return;
      }

      // 2) My echo without client_id
      if (
        String(normalized.sender_id) === me.id &&
        String(normalized.receiver_id) === them.id
      ) {
        const formattedMine = formatFromServer(normalized, me, them);
        const textKey = trimKey(formattedMine.text);
        setMessages((prev) => {
          const optimisticId = popPending(pendingByTextRef, textKey);
          if (!optimisticId) {
            const next = mergeById([formattedMine, ...prev]);
            persistBatched(next);
            return next;
          }
          const idx = prev.findIndex((m) => m.id === optimisticId);
          if (idx === -1) {
            const next = mergeById([formattedMine, ...prev]);
            persistBatched(next);
            return next;
          }
          const updated = [...prev];
          updated[idx] = formattedMine;
          const next = mergeById(updated);
          persistBatched(next);
          return next;
        });
        if (isAtBottomRef.current) scrollToNewest(false);
        return;
      }

      // 3) Their incoming
      if (
        String(normalized.sender_id) !== them.id ||
        String(normalized.receiver_id) !== me.id
      ) {
        return;
      }

      setMessages((prev) => {
        const formatted = formatFromServer(normalized, me, them);
        if (formatted.id && prev.some((m) => m.id === formatted.id))
          return prev;
        const next = mergeById([formatted, ...prev]);
        persistBatched(next);
        return next;
      });

      DeviceEventEmitter.emit("inbox:update", {
        partnerId: normalized.sender_id,
        text: normalized.content ?? "",
        created_at: normalized.created_at ?? new Date().toISOString(),
        partnerUsername: chattingUser.username,
        partnerAvatar: chattingUser.profilePicture,
      });

      if (isAtBottomRef.current) scrollToNewest(false);
    },
    [
      me,
      them,
      persistBatched,
      chattingUser.username,
      chattingUser.profilePicture,
      scrollToNewest,
      setMessages,
    ]
  );

  // Keep handleIncomingRef in sync with the latest function
  useEffect(() => {
    handleIncomingRef.current = handleIncoming;
  }, [handleIncoming]);

  useEffect(() => {
    // Safety checks
    if (!socket || !socket.connected || !me.id || !them.id) return;

    // 2. Create the wrapped handler for THIS screen
    const handleIncomingWrapper = (payload: any) => {
      try {
        if (handleIncomingRef.current) handleIncomingRef.current(payload);
      } catch (e) {
        console.warn("Handler error", e);
      }
    };

    // 3. Listen to events on the GLOBAL socket
    console.log("Listening for messages on existing socket");
    socket.on("receiveMessage", handleIncomingWrapper);
    socket.on("message", handleIncomingWrapper);
    socket.on("newMessage", handleIncomingWrapper);

    // 4. Handle User Status specifically for this chat
    const handleStatus = (statusData: any) => {
      if (String(statusData.userId) === String(them.id)) {
        // Update your UI for online/offline here
      }
    };
    socket.on("userStatus", handleStatus);

    // 5. Request status (Emit)
    socket.emit("getUserStatus", { userId: them.id });

    // 6. Cleanup: ONLY remove the listeners, DO NOT disconnect the socket
    return () => {
      socket.off("receiveMessage", handleIncomingWrapper);
      socket.off("message", handleIncomingWrapper);
      socket.off("newMessage", handleIncomingWrapper);
      socket.off("userStatus", handleStatus);
      // DO NOT CALL socket.disconnect() HERE!
      // Let the Provider handle disconnection when the app closes.
    };
  }, [socket, me.id, them.id]); // Re-run if socket or users change

  useEffect(() => {
    if (skipHistory === "1") return;

    let cancelled = false;
    const loadHistory = async () => {
      if (!me.id || !them.id) return;
      try {
        const res = await apiCall(
          `/api/messages/history/${me.id}/${them.id}`,
          "GET"
        );

        console.log("res:", res);

        const list: ServerMessage[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? (res as unknown as ServerMessage[])
            : [];

        if (cancelled) return;

        const formatted = list.map((m) => formatFromServer(m, me, them));
        formatted.sort((a, b) => b.createdAtMs - a.createdAtMs);

        setMessages((prev) => {
          let next = [...prev];
          for (const fm of formatted) {
            if (String(fm.userId) === me.id) {
              const textKey = trimKey(fm.text);
              const optimisticId = popPending(pendingByTextRef, textKey);
              if (optimisticId) {
                const idx = next.findIndex((m) => m.id === optimisticId);
                if (idx !== -1) next[idx] = fm;
                else next = mergeById([fm, ...next]);
              } else {
                next = mergeById([fm, ...next]);
              }
            } else {
              next = mergeById([fm, ...next]);
            }
          }
          next = mergeById(next);
          persistBatched(next);
          return next;
        });
        if (isAtBottomRef.current) scrollToNewest(false);
      } catch (e: any) {
        console.warn("history fetch error", e?.message || e || "unknown error");
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [
    skipHistory,
    me.id,
    them.id,
    persistBatched,
    scrollToNewest,
    me,
    them,
    setMessages,
  ]);

  const safeSendToApi = useCallback(async (payload: ServerMessage) => {
    try {
      await apiCall("/api/messages/send", "POST", payload);
      return true;
    } catch {
      try {
        await apiCall("/api/messages", "POST", payload);
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  const handleSend = useCallback(() => {
    if (sendingRef.current) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!isValidId(currentUserId) || !isValidId(chattingUser.userId)) {
      console.warn("Abort send: invalid IDs", {
        currentUserId,
        peer: chattingUser.userId,
      });
      return;
    }

    sendingRef.current = true;
    forceTick((x) => x + 1);
    const now = Date.now();
    const cid = makeClientId();
    const m: Message = {
      id: Math.random().toString(36).slice(2),
      clientId: cid,
      text: trimmed,
      createdAt: new Date(now).toISOString(),
      createdAtMs: now,
      userId: currentUserId,
      username: currentUsername,
      messageType: "text",
    };

    byClientIdRef.current.set(cid, m.id);
    pushPending(pendingByTextRef, trimmed, m.id);

    lastSentRef.current = m.id;
    setMessages((prev) => {
      const next = mergeById([m, ...prev]);
      persistBatched(next);
      return next;
    });

    setText("");
    setShowAttachmentStrip(false);

    DeviceEventEmitter.emit("inbox:update", {
      partnerId: chattingUser.userId,
      text: trimmed,
      created_at: new Date().toISOString(),
      partnerUsername: chattingUser.username,
      partnerAvatar: chattingUser.profilePicture,
    });

    const payload = toServerMessage(m, me.id, them.id);

    // ---------------------------------------------------------
    // FIX: Use 'socket' directly instead of socketRef.current
    // ---------------------------------------------------------
    if (!socket?.connected) {
      // Branch 1: Socket is NOT connected. Use REST fallback.
      (async () => {
        const ok = await safeSendToApi(payload);
        if (!ok) console.warn("REST send failed");
        setTimeout(() => {
          sendingRef.current = false;
          forceTick((x) => x + 1);
        }, 500);
      })();
    } else {
      // Branch 2: Socket IS connected.
      socket
        .timeout(5000)
        .emit("sendMessage", payload, (err: any, ack: any) => {
          if (err || (ack && ack.error)) {
            console.log(
              "socket emit timeout/error (no REST fallback)",
              err || ack?.error
            );
            sendingRef.current = false;
            forceTick((x) => x + 1);
          } else {
            setTimeout(() => {
              sendingRef.current = false;
              forceTick((x) => x + 1);
            }, 500);
          }
        });
    }

    scrollToNewest(true);
  }, [
    text,
    currentUserId,
    currentUsername,
    persistBatched,
    scrollToNewest,
    me.id,
    them.id,
    chattingUser.userId,
    chattingUser.username,
    chattingUser.profilePicture,
    safeSendToApi,
    setMessages,
    socket, // <--- Add socket to dependency array
  ]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    persistBatched([]);
  }, [persistBatched, setMessages]);

  const smallSpacer = 1;

  const estimateItemHeight = useCallback(
    (msg?: Message) => {
      const avatarH = 36;
      const bubbleVerticalPadding = 20;
      const bubbleExtra = 12;

      if (!msg) return Math.round(Math.max(avatarH, 40));
      const cached = heightCache.current[msg.id];
      if (cached) return cached;

      if (msg.product) {
        const productH = 88;
        return Math.round(
          Math.max(avatarH, productH + bubbleVerticalPadding + bubbleExtra)
        );
      }

      if (msg.messageType === "post") {
        const hasPreview = !!msg.postPreview;
        const cardH = hasPreview ? 440 : 160;
        return Math.round(Math.max(avatarH, cardH));
      }

      const text = msg.text ?? "";
      if (!text) return Math.round(Math.max(avatarH, 48));

      const approxCharWidth = Math.max(
        6,
        Math.round((maxBubbleWidth || screenWidth) / 28)
      );
      const charsPerLine = Math.max(
        20,
        Math.floor(maxBubbleWidth / approxCharWidth)
      );
      const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
      const lineHeight = 20;
      const textBlock = lines * lineHeight;

      const total = textBlock + bubbleVerticalPadding + bubbleExtra;
      return Math.round(Math.max(avatarH, total));
    },
    [maxBubbleWidth, screenWidth]
  );

  const getItemLayout = useCallback(
    (data: ArrayLike<Message> | null | undefined, index: number) => {
      const msg = data ? (data[index] as Message | undefined) : undefined;
      const length = estimateItemHeight(msg);
      let offset = length * index;
      try {
        if (data && data.length) {
          let sum = 0;
          for (let i = 0; i < index; i++) {
            const it = data[i] as Message;
            sum += heightCache.current[it?.id] ?? estimateItemHeight(it);
          }
          offset = sum;
        }
      } catch {
        offset = length * index;
      }
      return { length, offset, index };
    },
    [estimateItemHeight]
  );

  console.log("userChat messages:", messages);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const mine = String(item.userId) === String(currentUserId);

      const nextOlder = messages[index + 1];
      const needDayDivider = nextOlder
        ? !isSameDay(nextOlder.createdAtMs, item.createdAtMs)
        : false;
      const dayLabel = needDayDivider ? labelForDay(item.createdAtMs) : null;

      const prevNewer = messages[index - 1];
      const firstInGroup = nextOlder ? !withinGroup(nextOlder, item) : true;
      const lastInGroup = prevNewer ? !withinGroup(item, prevNewer) : true;

      const singlePost = async (postId: string) => {
        try {
          router.push({
            pathname: "/(profiles)/profilePosts" as any,
            params: { showOnlyPost: postId },
          });
          // const res = await fetchSinglePost(postId);
          // console.log("singlePost: ", res);
        } catch {
          return null;
        }
      };

      return (
        <>
          <MessageBubble
            message={item}
            mine={mine}
            maxBubbleWidth={maxBubbleWidth}
            onPressImage={(id) => singlePost(id)}
            onLongPress={() => {}}
            onPress={(id) => singlePost(id)}
            selected={false}
            onMeasure={onMeasureItem}
            onOpenReel={openReelFromChat}
            onOpenFeedPost={openFeedPostFromChat}
            isFirstInGroup={firstInGroup}
            isLastInGroup={lastInGroup}
          />
          <View style={{ height: smallSpacer }} />
          {needDayDivider ? <DayDivider label={dayLabel!} /> : null}
        </>
      );
    },
    [
      currentUserId,
      messages,
      maxBubbleWidth,
      onMeasureItem,
      openReelFromChat,
      openFeedPostFromChat,
      router,
    ]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const listEmpty = useMemo(
    () => (
      <View className="flex-1 justify-center items-center py-8">
        <Text className="text-gray-500">
          No messages yet — start the conversation
        </Text>
      </View>
    ),
    []
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    isAtBottomRef.current = y < 30;
  }, []);

  // 🔹 V1: header spacer animated style (based on real keyboard height)
  const headerSpacerStyle = useAnimatedStyle(() => {
    const insetBottom = insets.bottom || 0;
    const baseAndroid =
      kbH.value + Math.max(0, insetBottom + OPENED_OFFSET - BASE_TRIM);
    const baseIOS = kbH.value + OPENED_OFFSET - BASE_TRIM;
    const target =
      Platform.OS === "android"
        ? Math.max(0, baseAndroid)
        : Math.max(0, baseIOS);
    return { height: target };
  }, [insets.bottom]);

  // 🔹 V1: keyboard listeners drive kbH + isKeyboardOpen
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      setIsKeyboardOpen(true);
      kbH.value = withTiming(h, {
        duration: Platform.OS === "ios" ? 180 : 120,
      });
    };
    const onHide = () => {
      setIsKeyboardOpen(false);
      kbH.value = withTiming(0, {
        duration: Platform.OS === "ios" ? 160 : 100,
      });
    };

    const s1 = Keyboard.addListener(showEvent, onShow);
    const s2 = Keyboard.addListener(hideEvent, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [kbH]);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-[#ECE5DD]">
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <View className="bg-white" style={{ height: insets.top - 10 }} />

      {/* Header */}
      <View className="flex-row items-center px-1 py-2 border-b border-gray-300 bg-white">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          className="pr-3"
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>

        <Pressable
          onPress={() => setProfileModalVisible(true)}
          accessibilityLabel="Open profile"
          className="mr-3"
        >
          <Image
            source={{ uri: chattingUser.profilePicture }}
            className="w-10 h-10 rounded-full"
          />
        </Pressable>

        <View className="flex-1">
          {/* Tap name to go to Profile */}
          <Pressable
            onPress={() => {
              setProfileModalVisible(false);
              router.push({
                pathname: "/(profiles)",
                params: {
                  userId: chattingUser.userId,
                  username: chattingUser.username,
                  from: "chat",
                },
              });
            }}
            accessibilityLabel="View profile"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View className="flex-row items-center">
              <Text className="text-base font-semibold text-black">
                {chattingUser.username}
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setShowOptions(true)}
          className="px-2"
          accessibilityLabel="Chat options"
          accessibilityHint="Opens chat options"
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#6B7280" />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        style={{ flex: 1 }}
        ListEmptyComponent={listEmpty}
        // 🔹 V1: animated header spacer that follows the keyboard
        ListHeaderComponent={<Animated.View style={[headerSpacerStyle]} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={18}
        windowSize={9}
        removeClippedSubviews={Platform.OS === "android"}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={false as any}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={() => {
          requestAnimationFrame(() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: false,
              });
            }
          });
        }}
      />

      {/* Full-screen chat image preview */}
      <Modal
        visible={showPreviewImage}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowPreviewImage(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <Pressable
            className="absolute top-10 left-4 z-50 p-2"
            onPress={() => setShowPreviewImage(false)}
            accessibilityLabel="Close image preview"
          >
            <Text className="text-white text-2xl">✕</Text>
          </Pressable>

          <View className="flex-1 items-center justify-center">
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: screenWidth, height: screenHeight }}
                resizeMode="contain"
              />
            ) : (
              <View className="bg-white p-4 rounded-lg">
                <Text>No image</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Product modal */}
      <ProductModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={(p: any) => {
          onProductSelect(p);
          setShowProductModal(false);
        }}
      />

      {/* Profile full screen (avatar preview) */}
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

          <View className="flex-1 items-center justify-center">
            <Image
              source={{ uri: chattingUser.profilePicture }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* FULL-SCREEN confirm Send Image (updated like WhatsApp) */}
      <Modal
        visible={showSendImageModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowSendImageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Close (X) button at top-left */}
          <Pressable
            onPress={() => {
              setShowSendImageModal(false);
              setConfirmImageUri(null);
            }}
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? insets.top + 10 : 30,
              left: 16,
              zIndex: 50,
              padding: 8,
            }}
            hitSlop={10}
          >
            <Text style={{ color: "#fff", fontSize: 28 }}>✕</Text>
          </Pressable>

          {/* Image Full Screen */}
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            {confirmImageUri ? (
              <Image
                source={{ uri: confirmImageUri }}
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "contain",
                }}
              />
            ) : null}
          </View>

          {/* Send button at bottom-right (floating) */}
          <View
            style={{
              position: "absolute",
              bottom: Platform.OS === "ios" ? insets.bottom + 20 : 30,
              right: 20,
            }}
          >
            <Pressable
              onPress={() => {
                if (confirmImageUri) addImageMessage(confirmImageUri);
                setShowSendImageModal(false);
                setConfirmImageUri(null);
              }}
              style={{
                backgroundColor: "#fff",
                borderRadius: 50,
                paddingVertical: 10,
                paddingHorizontal: 24,
                elevation: 6,
              }}
              hitSlop={10}
            >
              <Text style={{ color: "#000", fontWeight: "600", fontSize: 16 }}>
                Send
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Attachment strip + Composer */}
      <KeyboardStickyView offset={{ opened: 0, closed: 0 }}>
        <View className="bg-transparent">
          {showAttachmentStrip && (
            <View className="px-3" style={{ overflow: "visible" }}>
              <View
                style={{
                  width: Math.max(260, screenWidth - 24),
                  alignSelf: "center",
                  position: "relative",
                  marginBottom: 8,
                }}
              >
                {(() => {
                  const paddingH = 24;
                  const w = Math.max(260, screenWidth - paddingH);
                  const cardHeight = 90;
                  const radius = 12;
                  const tailWidth = 12;
                  const tailDepth = 14;
                  const ts = 0;
                  const te = Math.min(tailWidth, w - radius);
                  const cx = ts;
                  const h = cardHeight;
                  const td = tailDepth;

                  const d = `
                    M ${radius} 0
                    L ${w - radius} 0
                    A ${radius} ${radius} 0 0 1 ${w} ${radius}
                    L ${w} ${h - radius}
                    A ${radius} ${radius} 0 0 1 ${w - radius} ${h}
                    L ${te} ${h}
                    Q ${te + 26} ${h - 10} ${cx} ${h + td}
                    Q ${ts} ${h} ${ts} ${h}
                    L 0 ${h}
                    L 0 ${radius}
                    A ${radius} ${radius} 0 0 1 ${radius} 0
                    Z
                  `;

                  return (
                    <>
                      <Svg
                        width={w}
                        height={h + td}
                        viewBox={`0 0 ${w} ${h + td}`}
                        style={{ position: "absolute", top: 0, left: 0 }}
                      >
                        <Path d={d} fill={"#F3F4F6"} />
                      </Svg>

                      <View
                        style={{
                          width: w,
                          height: h,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                        }}
                      >
                        <View className="flex-row justify-between">
                          <View className="items-center">
                            <Pressable
                              onPress={pickImage}
                              className="w-12 h-12 rounded-full items-center justify-center bg-white"
                              hitSlop={8}
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                              })}
                            >
                              <Gallery width={22} height={22} />
                            </Pressable>
                            <Text className="text-xs text-gray-800 mt-2 font-medium">
                              Gallery
                            </Text>
                          </View>

                          <View className="items-center">
                            <Pressable
                              className="w-12 h-12 rounded-full items-center justify-center bg-white"
                              onPress={async () => {
                                await dismissKeyboardAndWait();
                                await takePhoto();
                              }}
                              hitSlop={8}
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                              })}
                            >
                              <Camera width={22} height={22} />
                            </Pressable>
                            <Text className="text-xs text-gray-800 mt-2 font-medium">
                              Camera
                            </Text>
                          </View>

                          <View className="items-center">
                            <Pressable
                              onPress={() => setShowProductModal(true)}
                              className="w-12 h-12 rounded-full items-center justify-center bg-white"
                              hitSlop={8}
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                              })}
                            >
                              <Cart width={22} height={22} />
                            </Pressable>
                            <Text className="text-xs text-gray-800 mt-2 font-medium">
                              Product
                            </Text>
                          </View>

                          <View className="items-center">
                            <Pressable
                              onPress={async () => {
                                await dismissKeyboardAndWait();
                                setStatusOpen(true);
                              }}
                              className="w-12 h-12 rounded-full items-center justify-center bg-white"
                              hitSlop={8}
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                              })}
                            >
                              <Location width={22} height={22} />
                            </Pressable>
                            <Text className="text-xs text-gray-800 mt-2 font-medium">
                              Location
                            </Text>
                          </View>

                          <View className="items-center">
                            <Pressable
                              onPress={async () => {
                                await dismissKeyboardAndWait();
                                setStatusOpen(true);
                              }}
                              className="w-12 h-12 rounded-full items-center justify-center bg-white"
                              hitSlop={8}
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                              })}
                            >
                              <Document width={22} height={22} />
                            </Pressable>
                            <Text className="text-xs text-gray-800 mt-2 font-medium">
                              Document
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          )}

          {/* Composer */}
          <View
            className="px-3 bg-transparent"
            style={{
              paddingBottom: isKeyboardOpen
                ? 4
                : Platform.OS === "ios"
                  ? insets.bottom - 10
                  : insets.bottom,
            }}
            onLayout={(e) => {
              const h = Math.round(e.nativeEvent.layout.height);
              if (h !== composerHeight) setComposerHeight(h);
              if (h !== composerH) setComposerH(h);
            }}
          >
            <View className="flex-row items-center">
              <Pressable
                onPress={() => setShowAttachmentStrip((s) => !s)}
                accessibilityLabel="Attach"
                accessibilityHint="Show attachment options"
                hitSlop={8}
                className="w-12 h-12 rounded-full bg-black items-center justify-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <ShareIcon width={24} height={24} fill="#fff" />
              </Pressable>

              <View className="flex-1 mx-3">
                <View
                  className="flex-row items-end bg-white rounded-3xl px-3 py-2 border border-gray-200"
                  style={{ minHeight: 48, maxHeight: 120 }}
                >
                  <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={(v) => {
                      setText(v);
                      setShowAttachmentStrip(false);
                    }}
                    placeholder="Message"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 text-base text-gray-700"
                    multiline
                    accessibilityLabel="Message input"
                    returnKeyType="default"
                    submitBehavior="newline"
                    onKeyPress={(e: TextInputKeyPressEvent) => {}}
                    onFocus={() => {
                      setTimeout(() => scrollToNewest(true), 60);
                    }}
                    // 🔹 Removed heuristic onBlur/onTouchStart; we now use real OS events
                    style={{
                      maxHeight: 100,
                      paddingTop: Platform.OS === "ios" ? 8 : 6,
                      paddingBottom: Platform.OS === "ios" ? 8 : 6,
                      paddingHorizontal: 0,
                      lineHeight: 20,
                      textAlignVertical: "top",
                    }}
                  />

                  <Pressable
                    onPress={() => setStatusOpen(true)}
                    accessibilityLabel="Emoji"
                    accessibilityHint="Choose emoji"
                    className="items-center justify-center ml-2"
                    style={{ width: 28, height: 28, marginBottom: 2 }}
                    hitSlop={6}
                  >
                    <Ionicons name="happy-outline" size={22} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>

              {text.trim() ? (
                <Pressable
                  onPress={() => {
                    if (!sendingRef.current) handleSend();
                  }}
                  disabled={sendingRef.current}
                  accessibilityLabel="Send message"
                  className="w-12 h-12 rounded-full bg-black items-center justify-center shadow-lg"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    opacity: sendingRef.current ? 0.5 : pressed ? 0.8 : 1,
                  })}
                >
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  accessibilityLabel="Voice message"
                  accessibilityHint="Record and send voice message"
                  className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <FontAwesome5 name="microphone" size={18} color="#111827" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </KeyboardStickyView>

      {/* Chat options */}
      <ChatOptionsBottomSheet
        show={showOptions}
        setShow={setShowOptions}
        isChatOptions
        onClearChat={handleClearChat}
        onSetExpiry={() => console.log("Set Expiry")}
        onPinChat={() => console.log("Pin Chat")}
      />

      <StatusModal
        visible={statusOpen}
        onClose={() => setStatusOpen(false)}
        showImage={false}
        showHeading={false}
        showDescription={true}
        description="This feature is not available right now it will be available soon."
        showButton={false}
      />
    </SafeAreaView>
  );
};

export default React.memo(UserChatScreen);
