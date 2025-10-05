// app/chat/UserChatScreen.tsx
import ProductModal from "@/components/PostCreation/ProductModal"; // adjust path if needed
import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
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
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ChatOptionsBottomSheet from "../chat/ChatOptionsBottomSheet";

import { useGradualAnimation } from "@/hooks/useGradualAnimation"; // your PostCreate hook
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import Svg, { Path } from "react-native-svg";

type Message = {
  id: string;
  text?: string;
  image?: string;
  createdAt: string;
  userId: string;
  username?: string;
  product?: { id: string; name: string } | null;
};

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* ---------------------------
   Message bubble
   - now reports measured height via onMeasure
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
  onMeasure, // NEW: reports measured height
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
          {/* Avatar intentionally omitted inside bubble area */}

          <View
            style={{ maxWidth: maxBubbleWidth }}
            className={`${mine ? "items-end" : "items-start"}`}>
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

          {/* Avatar intentionally omitted */}
        </View>
      </Pressable>

      {/* small spacer after each bubble so layout stays consistent */}
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

  const chattingUser = {
    userId: userId ?? "other",
    username: username ?? "Unknown User",
    profilePicture: profilePicture ?? DEFAULT_AVATAR,
  };

  const cacheKey = `chat-${currentUserId}-${chattingUser.userId}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [showPreviewImage, setShowPreviewImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // layout related
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // composer measured height (wrapper) used to reserve footer on FlatList
  const [composerHeight, setComposerHeight] = useState(0);

  // text input dynamic height (drives visual growth)
  const [inputHeight, setInputHeight] = useState<number | undefined>(undefined);
  const inputRef = useRef<TextInput | null>(null);

  // selection state: store selected message ids
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // attachment strip state and product modal
  const [showAttachmentStrip, setShowAttachmentStrip] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // compute responsive bubble width (78% of width)
  const maxBubbleWidth = useMemo(
    () => Math.round(screenWidth * 0.78),
    [screenWidth]
  );

  // keyboard animation hook
  const kbHeight = useGradualAnimation();

  // small gap reduction value (tweak this to taste)
  const GAP_REDUCTION = 18;

  // Animated style to follow keyboard
  const keyboardPadding = useAnimatedStyle(() => {
    const raw = kbHeight.value || 0;
    const adjusted = raw - GAP_REDUCTION;
    const positive = adjusted > 0 ? adjusted : 0;
    return { paddingBottom: positive };
  }, [kbHeight]);

  // local keyboard timeout ref for dismiss flow
  const keyboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // used to avoid duplicate sends & re-entrant sends
  const sendingRef = useRef(false);

  // track last programmatic-sent message id so we can reliably scroll after layout
  const lastSentRef = useRef<string | null>(null);

  // stable keyboard dismissal helper
  const dismissKeyboardAndWait = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }

      Keyboard.dismiss();

      InteractionManager.runAfterInteractions(() => {
        keyboardTimeoutRef.current = setTimeout(
          () => {
            resolve();
          },
          Platform.OS === "ios" ? 150 : 100
        );
      });
    });
  }, []);

  // --------------------------
  // Height cache and measurement
  // --------------------------
  // store measured heights per message id for accurate getItemLayout
  const heightCache = useRef<Record<string, number>>({});
  const onMeasureItem = useCallback((id: string, height: number) => {
    // store but avoid thrashing
    if (!id) return;
    const prev = heightCache.current[id];
    const rounded = Math.round(height);
    if (!prev || prev !== rounded) {
      heightCache.current[id] = rounded;
    }
  }, []);

  // --------------------------
  // Batched persistence
  // --------------------------
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistBatched = useCallback(
    (nextMessages: Message[]) => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = setTimeout(async () => {
        try {
          await SecureStore.setItemAsync(
            cacheKey,
            JSON.stringify(nextMessages)
          );
        } catch (e) {
          console.warn("Save cache failed (batched)", e);
        }
        persistTimerRef.current = null;
      }, 400);
    },
    [cacheKey]
  );

  // Load cached messages once (initial)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const raw = await SecureStore.getItemAsync(cacheKey);
        if (raw && mounted) {
          const parsed: Message[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          } else {
            setMessages([]);
          }
          InteractionManager.runAfterInteractions(() => {
            try {
              flatListRef.current?.scrollToIndex({ index: 0, animated: false });
            } catch {
              flatListRef.current?.scrollToOffset({ offset: 0 });
            }
          });
        } else if (mounted) {
          setMessages([
            {
              id: "welcome-1",
              text: `Say hello to ${chattingUser.username}.`,
              createdAt: new Date().toISOString(),
              userId: chattingUser.userId,
              username: chattingUser.username,
            },
          ]);
        }
      } catch (e) {
        console.warn("Load cache failed", e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [cacheKey, chattingUser.userId, chattingUser.username]);

  // helper: fingerprint for uniqueness (removed unused assetKey helper)

  // helper to reliably scroll to newest (index 0) after layout finishes
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

  // When messages update, if we recently sent a message (lastSentRef), scroll it into view
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

  // Pick image from gallery and add as message
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

  // Take a photo with camera and add as message
  const takePhoto = useCallback(async () => {
    try {
      await dismissKeyboardAndWait();

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        console.warn("Camera permission denied");
        return;
      }
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

  // When product selected from modal, insert a message referencing product
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

  // Send handler (text message)
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

  // selection handlers
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

  // dynamic footer height for FlatList so the composer never overlaps messages
  const listFooterHeightRaw = Math.round(composerHeight + insets.bottom);
  const listFooterHeight =
    listFooterHeightRaw - GAP_REDUCTION > 0
      ? listFooterHeightRaw - GAP_REDUCTION
      : listFooterHeightRaw;

  // --- derive spacing values from composerHeight (no hard-coded extra bottom) ---
  const composerBase = Math.max(56, composerHeight || 56);
  const smallSpacer = Math.max(6, Math.round(composerBase * 0.1));
  const timeMarginTop = Math.max(8, Math.round(composerBase * 0.1));
  const timeMarginBottom = Math.max(12, Math.round(composerBase * 0.16));
  // reserve exactly the footer space equal to composer/footer area (inverted list)
  const invertedFooterReserve = Math.max(0, listFooterHeight);

  // EXTRA GAP so last message isn't sticky to composer
  const EXTRA_BOTTOM_GAP = 10;

  // ------------------- getItemLayout estimator (uses cache if available) -------------------
  const estimateItemHeight = useCallback(
    (msg?: Message) => {
      const avatarH = 36;
      const bubbleVerticalPadding = 16;
      const bubbleExtra = 8;

      if (!msg) return Math.round(Math.max(avatarH, 40));
      // use cached measured height if available
      const cached = heightCache.current[msg.id];
      if (cached) return cached;

      if (msg.product) {
        const productH = 88;
        return Math.round(
          Math.max(avatarH, productH + bubbleVerticalPadding + bubbleExtra)
        );
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
      // If we have exact cached heights for items up to index, compute offset by summing.
      // Fallback to length * index for heuristic speed (keeps performance good).
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

  // Memoized renderItem
  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const mine = item.userId === currentUserId;
      const isSelected = selectedIds.includes(item.id);

      // Decide whether to show time:
      let showTime = true;
      const nextMsg = messages[index + 1];
      if (nextMsg) {
        const sameUser = nextMsg.userId === item.userId;
        const t1 = new Date(item.createdAt);
        const t2 = new Date(nextMsg.createdAt);
        const sameMinute =
          t1.getHours() === t2.getHours() &&
          t1.getMinutes() === t2.getMinutes();
        if (sameUser && sameMinute) {
          showTime = false;
        }
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
          onMeasure={onMeasureItem} // report measured height
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

  // Toggle the attachment strip visibility
  const toggleAttachmentStrip = useCallback(
    () => setShowAttachmentStrip((s) => !s),
    []
  );

  // text input content size change -> grow input
  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const h = Math.ceil(e.nativeEvent.contentSize.height);
      const clamped = Math.min(Math.max(h, 40), 140);
      setInputHeight(clamped);
    },
    []
  );

  // New: onChangeText that sends when Enter/newline is typed (mobile behavior).
  const onChangeTextHandle = useCallback(
    (val: string) => {
      // treat newline as send for mobile keyboards
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

  // onKeyPress for web/desktop: support Shift+Enter for newline, Enter to send
  const onKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const native = e.nativeEvent as any;
      const key = native.key ?? native.key;
      if (key === "Enter") {
        if (native.shiftKey) {
          setText((prev) => prev + "\n");
          return;
        }
        if (native.preventDefault) native.preventDefault();
        if (text.trim() && !sendingRef.current) {
          handleSend();
        }
      }
    },
    [handleSend, text]
  );

  // Memoize SVG path for attachment strip (only depends on screenWidth)
  const attachmentCardMemo = useMemo(() => {
    const paddingH = 12 * 2; // px-3 left+right
    const w = Math.max(260, screenWidth - paddingH); // card width
    const cardHeight = 90;
    const radius = 12;
    const tailWidth = 12;
    const tailDepth = 14;
    const ts = 0;
    const te = Math.min(tailWidth, w - radius);
    const cx = ts;
    const h = cardHeight;
    const td = tailDepth;

    const path = `
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

    return {
      w,
      h,
      td,
      path,
    };
  }, [screenWidth]);

  return (
    // Root: whatsapp-like light green background (#ECE5DD)
    <SafeAreaView className="flex-1 bg-[#ECE5DD]">
      {/* Header */}

      <View className="flex-row items-center px-1 py-3 border-b border-gray-300 bg-[#ECE5DD]">
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
          paddingTop: Math.round(composerBase * 0.05),
          paddingBottom: invertedFooterReserve,
        }}
        ListHeaderComponent={<View style={{ height: EXTRA_BOTTOM_GAP }} />}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={12}
        windowSize={7}
        // conditional - avoid removeClippedSubviews on iOS inverted lists (can cause issues)
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

        {/* ---------------- Attachment strip + Composer (animated to follow keyboard) ---------------- */}
        <Animated.View style={[keyboardPadding]} className="bg-transparent">
          {showAttachmentStrip && (
            <View className="px-3" style={{ overflow: "visible" }}>
              <View
                style={{
                  width: attachmentCardMemo.w,
                  alignSelf: "center",
                  position: "relative",
                  marginBottom: 8,
                }}>
                <Svg
                  width={attachmentCardMemo.w}
                  height={attachmentCardMemo.h + attachmentCardMemo.td}
                  viewBox={`0 0 ${attachmentCardMemo.w} ${
                    attachmentCardMemo.h + attachmentCardMemo.td
                  }`}
                  style={{ position: "absolute", top: 0, left: 0 }}>
                  <Path d={attachmentCardMemo.path} fill="#F3F4F6" />
                </Svg>

                {/* Overlay the icons row inside the svg area */}
                <View
                  style={{
                    width: attachmentCardMemo.w,
                    height: attachmentCardMemo.h,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <View className="flex-row justify-between">
                    <View className="items-center">
                      <Pressable
                        onPress={pickImage}
                        className="w-12 h-12 rounded-full items-center justify-center bg-white">
                        <Ionicons name="images" size={22} color="#EC4899" />
                      </Pressable>
                      <Text className="text-xs text-gray-800 mt-2 font-medium">
                        Gallery
                      </Text>
                    </View>

                    <View className="items-center">
                      <Pressable
                        onPress={takePhoto}
                        className="w-12 h-12 rounded-full items-center justify-center bg-white">
                        <Ionicons name="camera" size={22} color="#2563EB" />
                      </Pressable>
                      <Text className="text-xs text-gray-800 mt-2 font-medium">
                        Camera
                      </Text>
                    </View>

                    <View className="items-center">
                      <Pressable
                        onPress={() => setShowProductModal(true)}
                        className="w-12 h-12 rounded-full items-center justify-center bg-white">
                        <FontAwesome5
                          name="shopping-cart"
                          size={16}
                          color="#111827"
                        />
                      </Pressable>
                      <Text className="text-xs text-gray-800 mt-2 font-medium">
                        Product
                      </Text>
                    </View>

                    <View className="items-center">
                      <Pressable
                        onPress={() => console.log("attach location")}
                        className="w-12 h-12 rounded-full items-center justify-center bg-white">
                        <Ionicons
                          name="location-sharp"
                          size={22}
                          color="#DC2626"
                        />
                      </Pressable>
                      <Text className="text-xs text-gray-800 mt-2 font-medium">
                        Location
                      </Text>
                    </View>

                    <View className="items-center">
                      <Pressable
                        onPress={() => console.log("attach document")}
                        className="w-12 h-12 rounded-full items-center justify-center bg-white">
                        <MaterialIcons
                          name="insert-drive-file"
                          size={20}
                          color="#6366F1"
                        />
                      </Pressable>
                      <Text className="text-xs text-gray-800 mt-2 font-medium">
                        Document
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Composer (dynamic height) */}
          <View
            className="px-3 bg-transparent"
            onLayout={(e) => {
              const h = Math.round(e.nativeEvent.layout.height);
              if (h !== composerHeight) setComposerHeight(h);
            }}>
            <View className="flex-row items-center">
              {/* Attach */}
              <Pressable
                onPress={toggleAttachmentStrip}
                accessibilityLabel="Attach"
                hitSlop={8}
                className="w-12 h-12 rounded-full bg-black items-center justify-center">
                <Entypo name="attachment" size={18} color="#fff" />
              </Pressable>

              {/* Input pill (center) */}
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

                  {/* small emoji / extra action inside pill */}
                  <Pressable
                    onPress={() => console.log("Emoji tapped")}
                    accessibilityLabel="Emoji"
                    className="w-8 h-8 rounded-full items-center justify-center"
                    hitSlop={6}>
                    <Ionicons name="happy-outline" size={20} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>

              {/* Mic / Send - vector icons */}
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
        {/* ---------------- end attachment + composer ---------------- */}
      </KeyboardAvoidingView>

      {/* Chat options bottom sheet */}
      <ChatOptionsBottomSheet
        show={showOptions}
        setShow={setShowOptions}
        isChatOptions
        onClearChat={handleClearChat}
        onSetExpiry={() => console.log("Set Expiry")}
        onPinChat={() => console.log("Pin Chat")}
      />
    </SafeAreaView>
  );
}
