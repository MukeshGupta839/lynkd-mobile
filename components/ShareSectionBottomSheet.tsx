// components/ShareSectionBottomSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList, TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ use the same data + helpers as chat.ts
import {
  LOGGED_USER,
  PostPreview,
  registerPost, // ensure preview is saved to the registry
  sendPostToChat,
  sharePostToUsers,
  USERS,
} from "@/constants/chat";

/** Types */
export type ShareUser = {
  id: string | number;
  username: string;
  profile_picture?: string;
  is_creator?: boolean;
};

type Props = {
  show?: boolean;
  setShow: (v: boolean) => void;
  users?: ShareUser[]; // optional override list
  postId?: string | number;

  // ✅ Optional: pass a preview so DM can render the real post (image/author/caption)
  postPreview?: PostPreview;

  onSelectUser?: (user: ShareUser) => void;
  onShareImage?: (
    target?: "whatsapp" | "system" | "facebook" | "instagram"
  ) => void;

  // removed onSendToUsers to avoid double-sends
  initialHeightPct?: number;
  maxHeightPct?: number;
  maxSelect?: number;
};

/** (kept) Local dummy — not used unless you pass users prop */
const USERNAMES = [
  "emma_w",
  "oliver",
  "ava.chan",
  "liam__dev",
  "mia.art",
  "noah99",
  "sophia",
  "lucas.io",
  "isabella",
  "alex.zen",
  "luna",
  "markus",
  "zoe",
  "leo_dev",
  "sarah",
  "mason",
  "bella",
  "nate",
  "soph",
  "val",
  "iris",
  "chris",
  "alina",
  "joel",
  "amy",
  "tom",
  "dan",
];
const DUMMY_USERS: ShareUser[] = Array.from({ length: 27 }).map((_, i) => ({
  id: i + 1,
  username: USERNAMES[i],
  profile_picture: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
  is_creator: Math.random() < 0.4,
}));

const filterUsers = (users: ShareUser[] = [], search: string) =>
  !search
    ? users
    : users.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase())
      );

/** Grid cell */
const GridUser = memo<{
  user: ShareUser;
  selected: boolean;
  onPress: (u: ShareUser) => void;
}>(({ user, selected, onPress }) => (
  <TouchableOpacity
    className="w-1/3 items-center mb-6"
    style={{ paddingHorizontal: 10 }}
    activeOpacity={0.9}
    onPress={() => onPress(user)}>
    <View className="relative">
      <Image
        source={{ uri: user.profile_picture }}
        className="w-20 h-20 rounded-full"
      />
      {user.is_creator && (
        <View className="absolute bottom-1 right-1 bg-[#0095F6] rounded-full p-[2px]">
          <Octicons name="verified" size={14} color="#ffffff" />
        </View>
      )}
      {selected && (
        <>
          <View className="absolute inset-0 bg-black/30 rounded-full" />
          <View className="absolute bottom-0 right-0 bg-[#0095F6] w-6 h-6 rounded-full items-center justify-center">
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        </>
      )}
    </View>
    <Text
      numberOfLines={1}
      className="max-w-[92px] text-sm text-gray-900 text-center mt-1">
      {user.username}
    </Text>
  </TouchableOpacity>
));

const ShareSectionBottomSheet = memo<Props>(
  ({
    show = false,
    setShow,
    users = [],
    postId,
    postPreview, // ✅ we will normalize verified from here
    onSelectUser,
    onShareImage,
    initialHeightPct = 0.35,
    maxHeightPct = 0.95,
    maxSelect = 5,
  }) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const NAV_SAFE = Math.max(
      insets.bottom,
      Platform.OS === "android" ? 24 : 10
    );
    const ACTION_ICON_SIZE = 42;
    const ACTIONS_BAR_HEIGHT = ACTION_ICON_SIZE + 30;
    const SEND_BAR_HEIGHT = 60;
    const CHIP_HEIGHT = 28;

    const SCREEN_H = Dimensions.get("window").height;
    const INITIAL_H = Math.round(SCREEN_H * initialHeightPct);
    const EXPANDED_H = Math.round(SCREEN_H * maxHeightPct);

    const translateY = useRef(new Animated.Value(SCREEN_H)).current;
    const sheetHeight = useRef(new Animated.Value(INITIAL_H)).current;
    const sheetHeightVal = useRef(INITIAL_H);
    sheetHeight.addListener(({ value }) => (sheetHeightVal.current = value));

    const isAnimating = useRef(false);
    const dragStartHeight = useRef(INITIAL_H);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          dragStartHeight.current = sheetHeightVal.current;
        },
        onPanResponderMove: (_e, g) => {
          const next = Math.min(
            EXPANDED_H,
            Math.max(INITIAL_H, dragStartHeight.current - g.dy)
          );
          sheetHeight.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const current = sheetHeightVal.current;
          const halfway = INITIAL_H + (EXPANDED_H - INITIAL_H) / 2;
          if (g.vy > 1.1 && current <= INITIAL_H + 24) {
            closeSheet();
            return;
          }
          Animated.spring(sheetHeight, {
            toValue: current >= halfway || g.vy < -0.6 ? EXPANDED_H : INITIAL_H,
            useNativeDriver: false,
            bounciness: 0,
            speed: 20,
          }).start();
        },
      })
    ).current;

    const [search, setSearch] = useState("");

    // ✅ Default to the same USERS used by chat.ts (keeps everything in sync)
    const baseUsers = useMemo<ShareUser[]>(() => {
      if (users.length) return users;
      return USERS.map((u) => ({
        id: u.id,
        username: u.username,
        profile_picture: u.profile_picture,
        is_creator: u.role === "Creator",
      }));
    }, [users]);

    const filteredUsers = useMemo(
      () => filterUsers(baseUsers, search),
      [baseUsers, search]
    );

    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
      new Set()
    );
    const selectedUsers = useMemo(
      () => baseUsers.filter((u) => selectedIds.has(u.id)),
      [baseUsers, selectedIds]
    );
    const showSendBar = selectedUsers.length > 0;

    const [modalVisible, setModalVisible] = useState(false);
    useEffect(() => {
      if (show && !modalVisible) setModalVisible(true);
      else if (!show && modalVisible) setModalVisible(false);
    }, [show, modalVisible]);

    useEffect(() => {
      if (modalVisible && show) {
        sheetHeight.setValue(INITIAL_H);
        translateY.setValue(SCREEN_H);
        Animated.timing(translateY, {
          toValue: 0,
          duration: 550,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }).start();
      }
    }, [modalVisible]);

    const closeSheet = () => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 420,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
        setSelectedIds(new Set());
        setShow(false);
      });
    };

    const toggleSelect = useCallback(
      (u: ShareUser) => {
        onSelectUser?.(u);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(u.id)) next.delete(u.id);
          else {
            if (prev.size >= maxSelect) {
              Alert.alert(
                "Limit reached",
                `You can select up to ${maxSelect} people.`
              );
              return prev;
            }
            next.add(u.id);
          }
          return next;
        });
      },
      [onSelectUser, maxSelect]
    );

    // 🔒 simple re-entrancy guard to avoid double-taps
    const isSendingRef = useRef(false);

    // ✅ helper: normalize any incoming verified-ish flags to a proper boolean
    const normalizeVerified = (p?: PostPreview) =>
      Boolean(
        p &&
          ((p as any).verified ??
            (p as any).isVerified ??
            (p as any).author_verified ??
            (p as any).user?.verified ??
            (p as any).user?.isVerified ??
            (p as any).is_creator)
      );

    // ✅ The sheet is the ONLY place that sends.
    const handleSend = useCallback(() => {
      if (isSendingRef.current) return; // guard double-tap
      if (!selectedUsers.length) return;

      if (postId == null || postId === "") {
        Alert.alert("Nothing to send", "Missing post id.");
        return;
      }

      isSendingRef.current = true;

      try {
        // ✅ Ensure preview is registered so chat/inbox can render it next time
        if (postPreview?.id) {
          const normalizedVerified = normalizeVerified(postPreview);

          registerPost({
            id: String(postPreview.id),
            image: postPreview.image || "",
            author: postPreview.author || "",
            caption: postPreview.caption,
            author_avatar: postPreview.author_avatar,
            videoUrl: postPreview.videoUrl,
            thumb: postPreview.thumb || postPreview.image,
            verified: normalizedVerified, // ✅ FIXED
          });
        }

        // 1) Insert the post into each selected DM (thread store)
        selectedUsers.forEach((u) => {
          // also pass a preview with normalized verified so UI shows instantly
          const normalizedPreview = postPreview
            ? {
                ...postPreview,
                verified: normalizeVerified(postPreview),
              }
            : undefined;
          sendPostToChat(String(u.id), String(postId), normalizedPreview);
        });

        // 2) Update inbox preview/badges (also normalized)
        const normalizedForInbox = postPreview
          ? { ...postPreview, verified: normalizeVerified(postPreview) }
          : undefined;

        sharePostToUsers(
          String(postId),
          selectedUsers.map((u) => String(u.id)),
          normalizedForInbox
        );

        // 3) Close sheet
        closeSheet();

        // 4) Navigate into the first chat (IG behavior)
        const first = selectedUsers[0];
        router.push({
          pathname: "/chat/UserChatScreen",
          params: {
            userId: String(first.id),
            username: first.username,
            profilePicture: first.profile_picture,
            loggedUserId: LOGGED_USER.id,
            loggedUsername: LOGGED_USER.username,
            loggedAvatar: LOGGED_USER.profile_picture,
          },
        });
      } finally {
        // slight delay so rapid back-and-forth doesn't re-enter
        setTimeout(() => {
          isSendingRef.current = false;
        }, 400);
      }
    }, [selectedUsers, postId, postPreview, router]);

    const actions = [
      {
        key: "copy",
        label: "Copy link",
        icon: <Ionicons name="link-outline" size={26} color="#000" />,
        onPress: () => Alert.alert("Link", "Copied!"),
      },
      {
        key: "system",
        label: "Share to",
        icon: <Ionicons name="share-outline" size={26} color="#000" />,
        onPress: () => onShareImage?.("system"),
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        icon: <Ionicons name="logo-whatsapp" size={26} color="#fff" />,
        onPress: () => onShareImage?.("whatsapp"),
        bg: "#25D366",
      },
      {
        key: "facebook",
        label: "Facebook",
        icon: <Ionicons name="logo-facebook" size={26} color="#1877F2" />,
        onPress: () => onShareImage?.("facebook"),
      },
      {
        key: "instagram",
        label: "Instagram",
        icon: <Ionicons name="logo-instagram" size={26} color="#C13584" />,
        onPress: () => onShareImage?.("instagram"),
      },
    ];

    const RESERVED_BOTTOM =
      NAV_SAFE + (showSendBar ? SEND_BAR_HEIGHT : ACTIONS_BAR_HEIGHT);
    const SHEET_EXTRA = NAV_SAFE;

    return (
      <Modal
        animationType="none"
        transparent
        visible={modalVisible}
        onRequestClose={closeSheet}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeSheet}
          className="flex-1 bg-black/50 justify-end">
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Animated.View
              style={{
                height: Animated.add(
                  sheetHeight,
                  new Animated.Value(SHEET_EXTRA)
                ),
              }}
              className="bg-white rounded-t-2xl w-full px-3 pt-2">
              {/* Handle */}
              <View
                {...panResponder.panHandlers}
                className="w-full items-center mb-2">
                <View className="w-12 h-1.5 rounded-full bg-gray-300" />
              </View>

              {/* Search */}
              <View className="relative  mb-2">
                <TextInput
                  placeholder="Search"
                  placeholderTextColor="#666"
                  value={search}
                  onChangeText={setSearch}
                  className="h-11 bg-white border border-gray-300 rounded-xl px-3 pr-11 text-base text-black"
                  style={{
                    paddingVertical: Platform.OS === "android" ? 0 : undefined,
                  }}
                />
                <Ionicons
                  name="search"
                  size={20}
                  color="#666"
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    marginTop: -10,
                  }}
                />
              </View>

              {/* Sticky horizontal chips */}
              {selectedUsers.length > 0 && (
                <View style={{ height: CHIP_HEIGHT + 14, marginBottom: 4 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      alignItems: "center",
                      paddingHorizontal: 10,
                      gap: 8,
                    }}>
                    {selectedUsers.map((u) => (
                      <View
                        key={`chip-${u.id}`}
                        className="flex-row items-center bg-[#F1F2F6]"
                        style={{
                          height: CHIP_HEIGHT,
                          borderRadius: CHIP_HEIGHT / 2,
                          paddingHorizontal: 10,
                        }}>
                        <Image
                          source={{ uri: u.profile_picture }}
                          className="w-5 h-5 rounded-full mr-2"
                        />
                        <Text className="text-xs text-black" numberOfLines={1}>
                          @{u.username}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              next.delete(u.id);
                              return next;
                            })
                          }>
                          <Ionicons
                            name="close"
                            size={14}
                            color="#333"
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Scrollable users grid */}
              <FlatList
                data={filteredUsers}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => (
                  <GridUser
                    user={item}
                    selected={selectedIds.has(item.id)}
                    onPress={toggleSelect}
                  />
                )}
                numColumns={3}
                contentContainerStyle={{
                  paddingHorizontal: 6,
                  paddingTop: 6,
                  paddingBottom: RESERVED_BOTTOM,
                }}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                showsVerticalScrollIndicator={false}
              />

              {/* Bottom actions — hidden when Send bar visible */}
              {!showSendBar && (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: ACTIONS_BAR_HEIGHT + NAV_SAFE,
                    paddingBottom: NAV_SAFE,
                    backgroundColor: "white",
                  }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: 12,
                      alignItems: "center",
                      height: ACTIONS_BAR_HEIGHT,
                    }}>
                    {actions.map((a) => (
                      <View
                        key={a.key}
                        style={{ alignItems: "center", marginHorizontal: 12 }}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={a.onPress}
                          className="items-center justify-center rounded-full"
                          style={{
                            width: ACTION_ICON_SIZE,
                            height: ACTION_ICON_SIZE,
                            backgroundColor: a.bg ?? "#F7F7F9",
                          }}>
                          {a.icon}
                        </TouchableOpacity>
                        <Text
                          style={{ marginTop: 6, fontSize: 12 }}
                          className="text-black text-center">
                          {a.label}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Send bar */}
              {showSendBar && (
                <View
                  className="absolute left-0 right-0 bg-white border-t border-gray-200"
                  style={{
                    bottom: 0,
                    height: SEND_BAR_HEIGHT + NAV_SAFE,
                    paddingBottom: NAV_SAFE,
                  }}>
                  <View
                    className="flex-row items-center justify-between px-3"
                    style={{ height: SEND_BAR_HEIGHT }}>
                    <Text className="text-gray-700">
                      Send to {selectedUsers.length}/{maxSelect}
                    </Text>
                    <TouchableOpacity
                      disabled={!selectedUsers.length || isSendingRef.current}
                      onPress={handleSend}
                      className={`px-3 py-2 rounded-full ${
                        selectedUsers.length && !isSendingRef.current
                          ? "bg-black"
                          : "bg-gray-300"
                      }`}
                      activeOpacity={0.8}>
                      <Text className="text-white font-semibold">
                        {isSendingRef.current ? "Sending..." : "Send"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  }
);

export default ShareSectionBottomSheet;
