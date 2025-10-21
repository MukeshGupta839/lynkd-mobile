// app/chat/UserChatScreen.tsx
import ProductModal from "@/components/PostCreation/ProductModal";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Image,
  InteractionManager,
  Keyboard,
  Modal,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  TextInputContentSizeChangeEventData,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ChatOptionsBottomSheet from "../chat/ChatOptionsBottomSheet";

import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

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

import {
  CHAT_LIST_DUMMY,
  LOGGED_USER,
  PostPreview as RegistryPostPreview,
  getMessagesWith,
  getPostPreview as getRegistryPostPreview,
} from "@/constants/chat";
import Octicons from "@expo/vector-icons/Octicons";

/* -------------------------------------------------------
   Local PostPreview adds a few UI-only numbers if needed
-------------------------------------------------------- */
type PostPreview = RegistryPostPreview & {
  author_avatar?: string;
  likes?: number;
  comments?: number;
  verified?: boolean; // <- we will always coerce this to a real boolean
};

type Message = {
  id: string;
  text?: string;
  image?: string;
  createdAt: string;
  userId: string;
  username?: string;
  product?: { id: string; name: string } | null;

  messageType?: "text" | "post";
  postId?: string;

  postPreview?: PostPreview;
};

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* -------------------------------------------------------
   Normalize ANY upstream preview into a safe object with
   a guaranteed boolean 'verified'.
-------------------------------------------------------- */
function normalizePreview(raw?: any): PostPreview | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const v =
    raw.verified ??
    raw.isVerified ??
    raw.author_verified ??
    raw.user?.verified ??
    raw.user?.isVerified ??
    raw.is_creator;

  return {
    id: String(raw.id ?? ""),
    image: typeof raw.image === "string" ? raw.image : "",
    author: typeof raw.author === "string" ? raw.author : "Post",
    caption: typeof raw.caption === "string" ? raw.caption : "",
    author_avatar:
      typeof raw.author_avatar === "string" ? raw.author_avatar : undefined,
    videoUrl: typeof raw.videoUrl === "string" ? raw.videoUrl : undefined,
    thumb: typeof raw.thumb === "string" ? raw.thumb : undefined,
    verified: Boolean(v),
    // optional UI fields if they exist
    likes: typeof raw.likes === "number" ? raw.likes : undefined,
    comments: typeof raw.comments === "number" ? raw.comments : undefined,
  };
}

/* ---------------------------
   Message bubble
--------------------------- */
const MessageBubble = React.memo(function MessageBubble({
  message,
  mine,
  onPressImage,
  maxBubbleWidth,
  onLongPress,
  onPress,
  selected,
  showTime,
  smallSpacer,
  timeMarginTop,
  timeMarginBottom,
  onMeasure,
  onOpenReel,
  onOpenFeedPost,
}: {
  message: Message;
  mine: boolean;
  onPressImage: (uri?: string) => void;
  maxBubbleWidth: number;
  onLongPress?: (id: string) => void;
  onPress?: (id: string) => void;
  selected?: boolean;
  showTime?: boolean;
  smallSpacer: number;
  timeMarginTop: number;
  timeMarginBottom: number;
  onMeasure?: (id: string, height: number) => void;
  onOpenReel?: (postId?: string) => void;
  onOpenFeedPost?: (postId?: string) => void;
}) {
  const containerStyle = selected
    ? {
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 6,
      }
    : undefined;

  const timeText = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const postCardWidth = Math.min(maxBubbleWidth, 320);
  const postMediaHeight = Math.round(postCardWidth); // 1:1

  const rawPreview = message.postPreview;
  const safePreview =
    rawPreview && typeof rawPreview === "object" ? rawPreview : ({} as any);

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
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewVideo, previewThumb, generatedThumb]);

  const sourceUri = previewThumb || generatedThumb || previewImage || undefined;

  return (
    <>
      <Pressable
        onLongPress={() => onLongPress?.(message.id)}
        onPress={() => onPress?.(message.id)}
        accessibilityLabel="Message"
        style={containerStyle}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          onMeasure?.(message.id, h);
        }}>
        <View className={`flex-row ${mine ? "justify-end pr-3" : "pl-3"} mb-0`}>
          <View
            style={{ maxWidth: maxBubbleWidth }}
            className={`${mine ? "items-end" : "items-start"}`}>
            {/* Product card */}
            {message.product ? (
              <View className="bg-white border border-black/100 rounded-3xl p-3">
                <Text className="font-semibold text-black">
                  {message.product.name}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Product attached
                </Text>
              </View>
            ) : null}

            {/* Shared post card */}
            {message.messageType === "post" && message.postId ? (
              message.postPreview ? (
                <View
                  className="bg-white border border-gray-200 rounded-2xl mt-1 overflow-hidden"
                  style={{ width: postCardWidth }}>
                  {/* Header */}
                  <View className="flex-row items-center px-3 pt-3">
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

                  {/* Media */}
                  <Pressable
                    onPress={() => {
                      if (!message.postId) return;
                      if (previewVideo) onOpenReel?.(message.postId);
                      else onOpenFeedPost?.(message.postId);
                    }}
                    style={{
                      width: postCardWidth,
                      height: postMediaHeight,
                      marginTop: 8,
                      overflow: "hidden",
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      backgroundColor: "#000",
                    }}>
                    {sourceUri ? (
                      <Image
                        source={{ uri: sourceUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: "#000" }} />
                    )}

                    {/* Play overlay for videos */}
                    {previewVideo ? (
                      <>
                        <View
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.12)",
                          }}
                        />
                        <View
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <View
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 28,
                              backgroundColor: "rgba(0,0,0,0.45)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                            <Ionicons name="play" size={28} color="#fff" />
                          </View>
                        </View>
                      </>
                    ) : null}
                  </Pressable>

                  {/* Caption ONLY */}
                  {previewCaption ? (
                    <View className="px-3 pt-3 pb-3">
                      <Text numberOfLines={2} className="text-xs text-gray-800">
                        {previewCaption}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                // Fallback placeholder
                <View className="bg-white border border-gray-200 rounded-2xl p-3 mt-1">
                  <Text className="font-semibold text-black">
                    {mine ? "You shared a post" : "Shared a post"}
                  </Text>
                  <View className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 items-center justify-center">
                    <Text className="text-xs text-gray-500">{`Post ID: ${message.postId}`}</Text>
                    <Text className="text-xs text-gray-400 mt-2">
                      Tap to view
                    </Text>
                  </View>
                </View>
              )
            ) : null}

            {/* Text */}
            {message.text ? (
              <View
                className={`py-2 px-3 mt-1  ${
                  mine
                    ? "bg-[#DCF8C6] border border-gray-200 rounded-2xl rounded-br-sm"
                    : "bg-[#FFFFFF] rounded-2xl rounded-bl-sm"
                }`}>
                <Text className="text-black">{message.text}</Text>
              </View>
            ) : null}

            {/* Image */}
            {message.image ? (
              <Pressable
                onPress={() => onPressImage?.(message.image)}
                className="mt-2">
                <Image
                  source={{ uri: message.image }}
                  className="w-48 h-36 rounded-lg"
                  resizeMode="cover"
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={{ height: smallSpacer }} />

      {showTime ? (
        <View
          style={{
            width: "100%",
            alignItems: "center",
            marginTop: timeMarginTop,
            marginBottom: timeMarginBottom,
          }}>
          <Text className="text-xs text-gray-400">{timeText}</Text>
        </View>
      ) : null}
    </>
  );
});
MessageBubble.displayName = "MessageBubble";

/* ---------------------------
   Screen
--------------------------- */
export default function UserChatScreen() {
  const router = useRouter();
  const { userId, username, profilePicture, loggedUserId, loggedUsername } =
    useLocalSearchParams<{
      userId?: string;
      username?: string;
      profilePicture?: string;
      loggedUserId?: string;
      loggedUsername?: string;
      loggedAvatar?: string;
    }>();

  const currentUserId = loggedUserId ?? "me";
  const currentUsername = loggedUsername ?? "You";
  const [statusOpen, setStatusOpen] = useState(false);

  const chattingUser = {
    userId: userId ?? "other",
    username: username ?? "Unknown User",
    profilePicture: profilePicture ?? DEFAULT_AVATAR,
  };

  // bump version so old cached previews (without verified) don't persist
  const cacheKey = `chat-v2-${currentUserId}-${chattingUser.userId}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [showPreviewImage, setShowPreviewImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const flatListRef = useRef<FlatList<Message> | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [composerHeight, setComposerHeight] = useState(0);
  const [inputHeight, setInputHeight] = useState<number | undefined>(undefined);
  const inputRef = useRef<TextInput | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showAttachmentStrip, setShowAttachmentStrip] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const maxBubbleWidth = useMemo(
    () => Math.round(screenWidth * 0.78),
    [screenWidth]
  );

  const kbHeight = useGradualAnimation();

  const GAP_REDUCTION = 18;

  const keyboardPadding = useAnimatedStyle(() => {
    const raw = kbHeight.value || 0;
    const adjusted = raw - GAP_REDUCTION;
    const positive = adjusted > 0 ? adjusted : 0;
    return { paddingBottom: positive };
  }, [kbHeight]);

  const keyboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendingRef = useRef(false);
  const lastSentRef = useRef<string | null>(null);

  const dismissKeyboardAndWait = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
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

  // Height cache
  const heightCache = useRef<Record<string, number>>({});
  const onMeasureItem = useCallback((id: string, height: number) => {
    if (!id) return;
    const prev = heightCache.current[id];
    const rounded = Math.round(height);
    if (!prev || prev !== rounded) heightCache.current[id] = rounded;
  }, []);

  /* -----------------------------------------
     Persist with normalized + trimmed preview
  ----------------------------------------- */
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistBatched = useCallback(
    (nextMessages: Message[]) => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(async () => {
        try {
          const lean = nextMessages.map((m) => {
            if (!m.postPreview) return m;
            const p = normalizePreview(m.postPreview) as PostPreview;
            // Trim long captions a bit for store size
            const caption =
              typeof p.caption === "string" ? p.caption.slice(0, 200) : "";
            return {
              ...m,
              postPreview: { ...p, caption },
            } as Message;
          });
          await SecureStore.setItemAsync(cacheKey, JSON.stringify(lean));
        } catch (e) {
          console.warn("Save cache failed (batched)", e);
        }
        persistTimerRef.current = null;
      }, 400);
    },
    [cacheKey]
  );

  const buildUnreadFillers = useCallback(
    (needed: number, baseText: string): Message[] => {
      const out: Message[] = [];
      for (let i = 0; i < needed; i++) {
        out.push({
          id: `unreadfill_${Date.now()}_${i}_${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          text: needed > 1 ? `${baseText} (${i + 1})` : baseText,
          createdAt: new Date(Date.now() - (needed - i) * 60_000).toISOString(),
          userId: String(chattingUser.userId),
          username: chattingUser.username,
          messageType: "text",
        });
      }
      return out;
    },
    [chattingUser.userId, chattingUser.username]
  );

  // Load cached + external + mirror unread count
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const raw = await SecureStore.getItemAsync(cacheKey);
        const cached: Message[] = raw ? JSON.parse(raw) : [];

        const external = getMessagesWith(String(chattingUser.userId)) || [];
        const mappedExternal: Message[] = external.map((ci: any) => {
          const fromStore = ci.postPreview;
          const fromRegistry = ci.postId
            ? (getRegistryPostPreview(String(ci.postId)) as any)
            : undefined;
          const rawPrev = fromStore ?? fromRegistry;
          const normalizedPreview = normalizePreview(rawPrev);

          return {
            id: ci.id,
            text: ci.messageType === "text" ? (ci.content ?? "") : undefined,
            messageType: ci.messageType,
            postId: ci.messageType === "post" ? ci.postId : undefined,
            postPreview: normalizedPreview,
            createdAt: ci.created_at,
            userId: ci.sender?.id ?? "unknown",
            username: ci.sender?.username ?? "User",
          } as Message;
        });

        const map = new Map<string, Message>();
        [...cached, ...mappedExternal].forEach((m) => {
          if (!m || !m.id) return;
          map.set(m.id, m);
        });
        let merged = Array.from(map.values());

        const inboxRow = CHAT_LIST_DUMMY.find((c) => {
          const a = c.sender?.id;
          const b = c.receiver?.id;
          const otherId = String(chattingUser.userId);
          return (
            (a === otherId && b === LOGGED_USER.id) ||
            (b === otherId && a === LOGGED_USER.id)
          );
        });

        const desiredUnread =
          inboxRow && inboxRow.unread
            ? Math.max(1, inboxRow.unreadCount || 1)
            : 0;

        const currentIncoming = merged.filter(
          (m) => m.userId === chattingUser.userId
        ).length;

        if (desiredUnread > currentIncoming) {
          const fillers = buildUnreadFillers(
            desiredUnread - currentIncoming,
            inboxRow?.content || "New message"
          );
          merged = [...fillers, ...merged];
        }

        merged.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (!mounted) return;

        if (merged.length === 0) {
          merged = [
            {
              id: "welcome-1",
              text: `Say hello to ${chattingUser.username}.`,
              createdAt: new Date().toISOString(),
              userId: chattingUser.userId,
              username: chattingUser.username,
            },
          ];
        }

        setMessages(merged);

        InteractionManager.runAfterInteractions(() => {
          try {
            flatListRef.current?.scrollToIndex({ index: 0, animated: false });
          } catch {
            flatListRef.current?.scrollToOffset({ offset: 0 });
          }
        });

        persistBatched(merged);
      } catch (e) {
        console.warn("Load cache/store failed", e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [
    cacheKey,
    chattingUser.userId,
    chattingUser.username,
    buildUnreadFillers,
    persistBatched,
  ]);

  const scrollToNewest = useCallback((animated = true) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated,
            viewPosition: 0,
          });
        } catch {
          try {
            flatListRef.current?.scrollToOffset({ offset: 0, animated });
          } catch {
            /* ignore */
          }
        }
      }, 40);
    });
  }, []);

  useEffect(() => {
    if (!lastSentRef.current) return;
    if (messages.length === 0) {
      lastSentRef.current = null;
      return;
    }
    if (messages[0].id === lastSentRef.current) {
      scrollToNewest(true);
      lastSentRef.current = null;
    }
  }, [messages, scrollToNewest]);

  const pickImage = useCallback(async () => {
    try {
      await dismissKeyboardAndWait();

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        console.warn("Gallery permission denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.9,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      const m: Message = {
        id: Math.random().toString(36).slice(2),
        image: uri,
        createdAt: new Date().toISOString(),
        userId: currentUserId,
        username: currentUsername,
      };

      lastSentRef.current = m.id;
      setMessages((prev) => {
        const next = [m, ...prev];
        persistBatched(next);
        return next;
      });
      setShowAttachmentStrip(false);
    } catch {
      console.warn("pickImage error");
    }
  }, [currentUserId, currentUsername, persistBatched, dismissKeyboardAndWait]);

  const takePhoto = useCallback(async () => {
    try {
      await dismissKeyboardAndWait();

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.9,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      const m: Message = {
        id: Math.random().toString(36).slice(2),
        image: uri,
        createdAt: new Date().toISOString(),
        userId: currentUserId,
        username: currentUsername,
      };

      lastSentRef.current = m.id;
      setMessages((prev) => {
        const next = [m, ...prev];
        persistBatched(next);
        return next;
      });

      setShowAttachmentStrip(false);
    } catch {
      console.warn("takePhoto error");
    }
  }, [currentUserId, currentUsername, persistBatched, dismissKeyboardAndWait]);

  const onProductSelect = useCallback(
    (p: { id: string; name: string }) => {
      const m: Message = {
        id: Math.random().toString(36).slice(2),
        product: { id: p.id, name: p.name },
        createdAt: new Date().toISOString(),
        userId: currentUserId,
        username: currentUsername,
      };

      lastSentRef.current = m.id;
      setMessages((prev) => {
        const next = [m, ...prev];
        persistBatched(next);
        return next;
      });

      setShowProductModal(false);
      setShowAttachmentStrip(false);
    },
    [currentUserId, currentUsername, persistBatched]
  );

  const handleSend = useCallback(() => {
    if (sendingRef.current) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    sendingRef.current = true;

    const m: Message = {
      id: Math.random().toString(36).slice(2),
      text: trimmed,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
      username: currentUsername,
      messageType: "text",
    };

    lastSentRef.current = m.id;
    setMessages((prev) => {
      const next = [m, ...prev];
      persistBatched(next);
      return next;
    });

    setText("");
    setInputHeight(undefined);
    setShowAttachmentStrip(false);

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        scrollToNewest(true);
        sendingRef.current = false;
      }, 50);
    });
  }, [text, currentUserId, currentUsername, persistBatched, scrollToNewest]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    persistBatched([]);
  }, [persistBatched]);

  const handleLongPressMessage = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const handlePressMessage = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.length === 0) return prev;
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    setMessages((prev) => {
      const next = prev.filter((m) => !selectedIds.includes(m.id));
      persistBatched(next);
      return next;
    });
    setSelectedIds([]);
  }, [persistBatched, selectedIds]);

  const listFooterHeightRaw = Math.round(composerHeight + insets.bottom);
  const listFooterHeight =
    listFooterHeightRaw - GAP_REDUCTION > 0
      ? listFooterHeightRaw - GAP_REDUCTION
      : listFooterHeightRaw;

  const composerBase = Math.max(56, composerHeight || 56);
  const smallSpacer = Math.max(6, Math.round(composerBase * 0.1));
  const timeMarginTop = Math.max(8, Math.round(composerBase * 0.1));
  const timeMarginBottom = Math.max(12, Math.round(composerBase * 0.16));
  const invertedFooterReserve = Math.max(0, listFooterHeight);

  const estimateItemHeight = useCallback(
    (msg?: Message) => {
      const avatarH = 36;
      const bubbleVerticalPadding = 16;
      const bubbleExtra = 8;

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
        const cardH = hasPreview ? 420 : 140; // rough estimate
        return Math.round(Math.max(avatarH, cardH));
      }

      const text = msg.text ?? "";
      if (!text) return Math.round(Math.max(avatarH, 40));

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

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const mine = item.userId === currentUserId;
      const isSelected = selectedIds.includes(item.id);

      let showTime = true;
      const nextMsg = messages[index + 1];
      if (nextMsg) {
        const sameUser = nextMsg.userId === item.userId;
        const t1 = new Date(item.createdAt);
        const t2 = new Date(nextMsg.createdAt);
        const sameMinute =
          t1.getHours() === t2.getHours() &&
          t1.getMinutes() === t2.getMinutes();
        if (sameUser && sameMinute) showTime = false;
      }

      return (
        <MessageBubble
          message={item}
          mine={mine}
          onPressImage={(uri) => {
            if (selectedIds.length > 0) {
              setSelectedIds((prev) =>
                prev.includes(item.id)
                  ? prev.filter((x) => x !== item.id)
                  : [...prev, item.id]
              );
            } else {
              setSelectedImage(uri ?? null);
              setShowPreviewImage(true);
            }
          }}
          maxBubbleWidth={maxBubbleWidth}
          onLongPress={handleLongPressMessage}
          onPress={handlePressMessage}
          selected={isSelected}
          showTime={showTime}
          smallSpacer={smallSpacer}
          timeMarginTop={timeMarginTop}
          timeMarginBottom={timeMarginBottom}
          onMeasure={onMeasureItem}
          onOpenReel={openReelFromChat}
          onOpenFeedPost={openFeedPostFromChat}
        />
      );
    },
    [
      messages,
      currentUserId,
      maxBubbleWidth,
      selectedIds,
      handleLongPressMessage,
      handlePressMessage,
      smallSpacer,
      timeMarginTop,
      timeMarginBottom,
      onMeasureItem,
      openReelFromChat,
      openFeedPostFromChat,
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

  const toggleAttachmentStrip = useCallback(
    () => setShowAttachmentStrip((s) => !s),
    []
  );

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const h = Math.ceil(e.nativeEvent.contentSize.height);
      const clamped = Math.min(Math.max(h, 40), 140);
      setInputHeight(clamped);
    },
    []
  );

  const onChangeTextHandle = useCallback(
    (val: string) => {
      if (val.includes("\n")) {
        const cleaned = val.replace(/\n+/g, "").trim();
        if (cleaned.length > 0) {
          if (!sendingRef.current) {
            sendingRef.current = true;
            const m: Message = {
              id: Math.random().toString(36).slice(2),
              text: cleaned,
              createdAt: new Date().toISOString(),
              userId: currentUserId,
              username: currentUsername,
              messageType: "text",
            };
            lastSentRef.current = m.id;
            setMessages((prev) => {
              const next = [m, ...prev];
              persistBatched(next);
              return next;
            });
            setText("");
            setInputHeight(undefined);
            setShowAttachmentStrip(false);
            InteractionManager.runAfterInteractions(() => {
              setTimeout(() => {
                scrollToNewest(true);
                sendingRef.current = false;
              }, 40);
            });
          }
        } else {
          setText("");
        }
        return;
      }

      setText(val);
      if (showAttachmentStrip) setShowAttachmentStrip(false);
    },
    [
      currentUserId,
      currentUsername,
      persistBatched,
      scrollToNewest,
      showAttachmentStrip,
    ]
  );

  const onKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = (e as any)?.nativeEvent?.key;
      const shiftKey = (e as any)?.nativeEvent?.shiftKey;
      if (key === "Enter") {
        if (shiftKey) {
          setText((prev) => prev + "\n");
          return;
        }
        if ((e as any).preventDefault) (e as any).preventDefault();
        if (text.trim() && !sendingRef.current) {
          handleSend();
        }
      }
    },
    [handleSend, text]
  );

  // Layout + list config
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      className="flex-1 bg-[#ECE5DD]">
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <View style={{ height: insets.top }} className="bg-white" />
      <View className="flex-row items-center px-1 py-3 border-b border-gray-300 bg-white">
        <Pressable
          onPress={() => {
            if (selectedIds.length > 0) {
              setSelectedIds([]);
              return;
            }
            router.back();
          }}
          accessibilityLabel="Back"
          className="pr-3">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>

        <Pressable
          onPress={() => setProfileModalVisible(true)}
          accessibilityLabel="Open profile"
          className="mr-3">
          <Image
            source={{ uri: chattingUser.profilePicture }}
            className="w-10 h-10 rounded-full"
          />
        </Pressable>

        <View className="flex-1">
          <Text className="text-base font-semibold text-black">
            {chattingUser.username}
          </Text>
        </View>

        {selectedIds.length > 0 ? (
          <Pressable
            onPress={deleteSelected}
            className="px-3"
            accessibilityLabel="Delete selected messages"
            accessibilityHint="Deletes all selected messages">
            <Ionicons name="trash" size={22} color="#DC2626" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setShowOptions(true)}
            className="px-2"
            accessibilityLabel="Chat options"
            accessibilityHint="Opens chat options">
            <Ionicons name="ellipsis-vertical" size={22} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingTop: Math.round(Math.max(56, composerHeight || 56) * 0.05),
          paddingBottom: Math.max(
            0,
            Math.round(composerHeight + insets.bottom) - GAP_REDUCTION
          ),
        }}
        ListHeaderComponent={<View style={{ height: 10 }} />}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        keyboardShouldPersistTaps="always"
      />

      {/* Image preview modal */}
      <Modal
        visible={showPreviewImage}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreviewImage(false)}>
        <Pressable
          className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.6)]"
          onPress={() => setShowPreviewImage(false)}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={{
                width: Math.round(screenWidth * 0.92),
                height: Math.round(screenWidth * 0.92 * 0.66),
              }}
              className="rounded-lg"
              resizeMode="contain"
            />
          ) : (
            <View className="bg-white p-4 rounded-lg">
              <Text>No image</Text>
            </View>
          )}
        </Pressable>
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

      {/* Profile image full screen */}
      <Modal
        visible={profileModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-black">
          <Pressable
            className="absolute top-10 left-4 z-50 p-2"
            onPress={() => setProfileModalVisible(false)}
            accessibilityLabel="Close profile preview">
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

      {/* Attachment strip + Composer */}
      <Animated.View style={[keyboardPadding]} className="bg-transparent">
        {showAttachmentStrip && (
          <View className="px-3" style={{ overflow: "visible" }}>
            <View
              style={{
                width: Math.max(260, screenWidth - 24),
                alignSelf: "center",
                position: "relative",
                marginBottom: 8,
              }}>
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
                      style={{ position: "absolute", top: 0, left: 0 }}>
                      <Path d={d} fill="#F3F4F6" />
                    </Svg>

                    <View
                      style={{
                        width: w,
                        height: h,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                      }}>
                      <View className="flex-row justify-between">
                        <View className="items-center">
                          <Pressable
                            onPress={pickImage}
                            className="w-12 h-12 rounded-full items-center justify-center bg-white">
                            <Gallery width={22} height={22} />
                          </Pressable>
                          <Text className="text-xs text-gray-800 mt-2 font-medium">
                            Gallery
                          </Text>
                        </View>

                        <View className="items-center">
                          <TouchableOpacity
                            className="items-center justify-center bg-white p-2.5 rounded-full"
                            onPress={async () => {
                              await dismissKeyboardAndWait();
                              await takePhoto();
                            }}>
                            <Camera width={22} height={22} />
                          </TouchableOpacity>
                          <Text className="text-xs text-gray-800 mt-2 font-medium">
                            Camera
                          </Text>
                        </View>

                        <View className="items-center">
                          <Pressable
                            onPress={() => setShowProductModal(true)}
                            className="w-12 h-12 rounded-full items-center justify-center bg-white">
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
                            className="w-12 h-12 rounded-full items-center justify-center bg-white">
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
                            className="w-12 h-12 rounded-full items-center justify-center bg-white">
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
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h !== composerHeight) setComposerHeight(h);
          }}>
          <View className="flex-row items-center">
            <Pressable
              onPress={toggleAttachmentStrip}
              accessibilityLabel="Attach"
              hitSlop={8}
              className="w-12 h-12 rounded-full bg-black items-center justify-center">
              <ShareIcon width={24} height={24} fill="#fff" />
            </Pressable>

            <View className="flex-1 mx-3">
              <View
                className="flex-row items-center bg-white rounded-full px-3 border border-gray-200"
                style={{ minHeight: 48, maxHeight: 140 }}>
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={onChangeTextHandle}
                  placeholder="Message"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-base text-gray-700"
                  multiline
                  accessibilityLabel="Message input"
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (!sendingRef.current && text.trim()) handleSend();
                  }}
                  onContentSizeChange={onContentSizeChange}
                  onKeyPress={onKeyPress}
                  style={{
                    height: inputHeight ?? undefined,
                    paddingVertical: 10,
                    textAlignVertical: "top",
                  }}
                />

                <Pressable
                  onPress={() => console.log("Emoji tapped")}
                  accessibilityLabel="Emoji"
                  className="w-8 h-8 rounded-full items-center justify-center"
                  hitSlop={6}>
                  <Ionicons name="happy-outline" size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>

            {text.trim() ? (
              <Pressable
                onPress={() => {
                  if (!sendingRef.current) handleSend();
                }}
                accessibilityLabel="Send message"
                className="w-12 h-12 rounded-full bg-black items-center justify-center shadow-lg"
                hitSlop={8}>
                <Ionicons name="paper-plane" size={18} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => console.log("Record tapped")}
                accessibilityLabel="Voice message"
                className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg"
                hitSlop={8}>
                <FontAwesome5 name="microphone" size={18} color="#111827" />
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>

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
        description="This feature is not available right now"
        showButton={false}
      />
    </SafeAreaView>
  );
}
