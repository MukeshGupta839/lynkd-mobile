// components/ShareSectionBottomSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { KeyboardState } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ Import Hook from your CommentsSheet logic
import { useKeyboardVisibleReanimated } from "@/hooks/useKeyboardVisibleReanimated";

import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetHandleProps,
  BottomSheetModal,
  // ✅ Import BottomSheetTextInput
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";

// Removed generic SearchBar to use BottomSheetTextInput directly
// import SearchBar from "@/components/Searchbar";

import { PostPreview } from "@/constants/chat";
import { useSocket } from "@/context/SocketProvider";
import { useAuth } from "@/hooks/useAuth";
import { ShareUser } from "@/lib/api/api";
import { apiCall } from "@/lib/api/apiService";
import { ScrollView } from "react-native-gesture-handler";

/* ---------- helpers ---------- */
function normalizePreview(src?: Partial<PostPreview>): PostPreview | undefined {
  if (!src || !src.id || !src.image || !src.author) return undefined;
  const v =
    (src as any).verified ??
    (src as any).isVerified ??
    (src as any).author_verified ??
    (src as any).user?.verified ??
    (src as any).user?.isVerified ??
    (src as any).is_creator ??
    false;

  return {
    id: String(src.id),
    image: String(src.image),
    author: String(src.author),
    caption: src.caption ?? "",
    author_avatar: src.author_avatar || "",
    videoUrl:
      typeof src.videoUrl === "string" && src.videoUrl.length > 0
        ? src.videoUrl
        : undefined,
    thumb:
      typeof src.thumb === "string" && src.thumb.length > 0
        ? src.thumb
        : String(src.image),
    verified: Boolean(v),
  };
}

type ShareSectionBottomSheetComponentProps = {
  show?: boolean;
  setShow: (v: boolean) => void;
  users?: ShareUser[];
  postId?: string | number;
  postPreview?: Partial<PostPreview>;
  onSelectUser?: (user: ShareUser) => void;
  onShareImage?: (
    target?: "whatsapp" | "system" | "facebook" | "instagram"
  ) => void;
  initialHeightPct?: number;
  maxHeightPct?: number;
  maxSelect?: number;
  shareUsers: ShareUser[];
};

const filterUsers = (users: ShareUser[] = [], search: string) =>
  !search
    ? users
    : users.filter((u) =>
        u.username.toLowerCase().startsWith(search.toLowerCase())
      );

/* Grid cell */
function GridUserComponent({
  user,
  selected,
  onPress,
}: {
  user: ShareUser;
  selected: boolean;
  onPress: (u: ShareUser) => void;
}) {
  return (
    <TouchableOpacity
      className="items-center mb-6"
      style={{ paddingHorizontal: 10, flex: 1 }}
      activeOpacity={0.9}
      onPress={() => onPress(user)}
    >
      <View className="relative">
        <Image
          source={{ uri: user.profile_picture }}
          className="w-20 h-20 rounded-full"
        />
        {selected && (
          <>
            <View className="absolute inset-0 bg-black/30 rounded-full" />
            <View className="absolute bottom-0 right-0 bg-[#0095F6] w-6 h-6 rounded-full items-center justify-center">
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </>
        )}
      </View>
      <View className="flex-row items-center justify-center mt-1 max-w-[92px]">
        <Text
          numberOfLines={1}
          className="text-sm text-gray-900 text-center"
          style={{ maxWidth: 92 }}
        >
          {user.username}
        </Text>
        {user?.is_creator && (
          <Octicons
            name="verified"
            size={14}
            color="#000"
            style={{ marginLeft: 4 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}
GridUserComponent.displayName = "GridUser";
const GridUser = memo(GridUserComponent);

/* Footer */
const ACTION_ICON_SIZE = 42;
const ACTIONS_BAR_HEIGHT = ACTION_ICON_SIZE + 30;
const SEND_BAR_HEIGHT = 60;
// const FOOTER_MIN_HEIGHT = 54;

const ShareFooter = memo(function ShareFooter({
  animatedFooterPosition,
  showSendBar,
  selectedCount,
  maxSelect,
  onSend,
  actions,
}: BottomSheetFooterProps & {
  showSendBar: boolean;
  selectedCount: number;
  maxSelect: number;
  onSend: () => void;
  actions: {
    key: string;
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    bg?: string;
  }[];
}) {
  const insets = useSafeAreaInsets();

  // ✅ LOGIC FROM CommentsFooter: Handle keyboard state
  const { state } = useKeyboardVisibleReanimated({
    includeOpening: true,
    minHeight: 1,
  });

  const isKeyboardUp =
    state === KeyboardState.OPEN || state === KeyboardState.OPENING;

  const paddingBottom = !isKeyboardUp
    ? Platform.OS === "ios"
      ? insets.bottom
      : insets.bottom + 12
    : 12;

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <View
        style={{
          backgroundColor: "#fff",
          paddingBottom: paddingBottom,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
        }}
      >
        {showSendBar ? (
          <View
            className="flex-row items-center justify-between px-3"
            style={{ height: SEND_BAR_HEIGHT }}
          >
            <Text className="text-gray-700">
              Send to {selectedCount}/{maxSelect}
            </Text>
            <TouchableOpacity
              onPress={onSend}
              disabled={!selectedCount}
              className={`px-3 py-2 rounded-full ${selectedCount ? "bg-black" : "bg-gray-300"}`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 12,
              alignItems: "center",
              height: ACTIONS_BAR_HEIGHT,
            }}
          >
            {actions.map((a) => (
              <View
                key={a.key}
                style={{ alignItems: "center", marginHorizontal: 12 }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={a.onPress}
                  className="items-center justify-center rounded-full"
                  style={{
                    width: ACTION_ICON_SIZE,
                    height: ACTION_ICON_SIZE,
                    backgroundColor: a.bg ?? "#F7F7F9",
                  }}
                >
                  {a.icon}
                </TouchableOpacity>
                <Text
                  style={{ marginTop: 6, fontSize: 12 }}
                  className="text-black text-center"
                >
                  {a.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </BottomSheetFooter>
  );
});

/* Handle Component */
const SimpleHandle = memo((props: BottomSheetHandleProps) => {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        paddingTop: 8,
        paddingBottom: 10,
        alignItems: "center",
        justifyContent: "center",
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
      }}
    >
      <View
        style={{
          width: 42,
          height: 5,
          borderRadius: 3,
          backgroundColor: "#cfd2d7",
        }}
      />
    </View>
  );
});

SimpleHandle.displayName = "SimpleHandle";

// SearchHeader
const SearchHeader = memo(function SearchHeader({
  selectedUsers,
  setSelectedIds,
  search,
  setSearch,
}: {
  selectedUsers: ShareUser[];
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <View style={{ backgroundColor: "#fff" }}>
      <View className="px-3 pb-1 items-center justify-center">
        <Text className="text-lg font-opensans-semibold text-black">Share</Text>
      </View>

      {/* ✅ FIX: Use BottomSheetTextInput directly inside a container to simulate SearchBar */}
      <View className="px-3 mt-2 mb-1">
        <View
          className="flex-row items-center bg-gray-100 rounded-lg px-3"
          style={{ height: 40 }}
        >
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={{ marginRight: 8 }}
          />
          <BottomSheetTextInput
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              fontSize: 16,
              color: "#000",
              paddingVertical: 0, // fix for android alignment
            }}
            placeholderTextColor="#999"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectedUsers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: "center",
            paddingHorizontal: 10,
            gap: 8,
          }}
          style={{ marginBottom: 4, marginTop: 4 }}
        >
          {selectedUsers.map((u) => (
            <View
              key={`chip-${u.id}`}
              className="flex-row items-center bg-[#F1F2F6]"
              style={{ height: 28, borderRadius: 14, paddingHorizontal: 10 }}
            >
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
                }
              >
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
      )}
    </View>
  );
});

/* ---------- component ---------- */
function ShareSectionBottomSheetComponent({
  show = false,
  setShow,
  users = [],
  postId,
  postPreview,
  onSelectUser,
  onShareImage,
  initialHeightPct = 0.5, // slightly increased to give space for keyboard
  maxHeightPct = 0.9,
  maxSelect = 5,
  shareUsers = [],
}: ShareSectionBottomSheetComponentProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const sendingRef = useRef(false);

  const snapPoints = useMemo<(string | number)[]>(
    () => [
      `${Math.round(initialHeightPct * 100)}%`,
      `${Math.round(maxHeightPct * 100)}%`,
    ],
    [initialHeightPct, maxHeightPct]
  );

  const { state: keyboardState } = useKeyboardVisibleReanimated({
    includeOpening: true,
    minHeight: 1,
  });

  const isKeyboardUp =
    keyboardState === KeyboardState.OPEN ||
    keyboardState === KeyboardState.OPENING;

  const sheetRef = useRef<BottomSheetModalType>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (show) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [show]);

  // 👇 NEW: snap based on keyboard
  useEffect(() => {
    if (!show) return; // don't snap if sheet is closed
    const sheet = sheetRef.current;
    if (!sheet) return;

    if (isKeyboardUp) {
      // keyboard open → expand to 90% (index 1)
      sheet.snapToIndex(1);
    } else {
      // keyboard closed → go back to 50% (index 0)
      sheet.snapToIndex(0);
    }
  }, [isKeyboardUp, show]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
    setShow(false);
  }, [setShow]);

  const filteredUsers = useMemo(() => {
    const list = filterUsers(shareUsers, search);
    // ✅ Duplicate the list here
    return [...list];
  }, [shareUsers, search]);

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  );
  const selectedUsers = useMemo(
    () => shareUsers.filter((u) => selectedIds.has(u.id)),
    [shareUsers, selectedIds]
  );
  const showSendBar = selectedUsers.length > 0;

  const actions = useMemo(
    () => [
      {
        key: "copy",
        label: "Copy link",
        icon: <Ionicons name="link-outline" size={26} color="#000" />,
        onPress: () => alert("Copied!"),
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
    ],
    [onShareImage]
  );

  const handleSend = useCallback(async () => {
    // 1. Basic guards
    if (sendingRef.current || !user) return;

    if (!postId) {
      alert("Nothing to send: missing post id.");
      return;
    }

    if (!selectedIds.size) return;

    // Build the list of selected users from ids
    const recipients = shareUsers.filter((u) => selectedIds.has(u.id));
    if (!recipients.length) return;

    const createdAt = new Date().toISOString();

    // Normalize preview → optional, only for client-side UI via socket
    const normalizedPreview = normalizePreview(postPreview);

    const postIdNum = Number(postId);
    const senderIdNum = Number(user.id);

    if (!Number.isFinite(postIdNum) || !Number.isFinite(senderIdNum)) {
      console.warn("Invalid IDs for shared post", { postId, userId: user.id });
      alert("Invalid post or user id");
      return;
    }

    // Optional UI payload for socket consumers
    const sharedPostPayload =
      normalizedPreview != null
        ? { ...normalizedPreview, id: postIdNum }
        : { id: postIdNum };

    sendingRef.current = true;

    console.log("handleSend:", postIdNum, sharedPostPayload, user, recipients);

    try {
      if (socket?.connected) {
        // ✅ Socket branch: must still send shared_post_id so backend can save correctly
        recipients.forEach((receiver) => {
          const receiverIdNum = Number(receiver.id);
          if (!Number.isFinite(receiverIdNum)) return;

          const payload = {
            client_id: `share_${senderIdNum}_${receiverIdNum}_${Date.now()}`,
            sender_id: senderIdNum,
            receiver_id: receiverIdNum,
            content: "Shared a post",
            message_type: "shared_post",
            shared_post_id: postIdNum, // 👈 IMPORTANT
            // you *can* also attach the preview object for UI only:
            shared_post: sharedPostPayload, // 👌 optional, backend ignores this
            created_at: createdAt,
            is_read: false,
          };

          socket
            .timeout(5000)
            .emit("sendMessage", payload, (err: any, ack: any) => {
              if (err || ack?.error) {
                console.log(
                  `Failed to share post to ${receiverIdNum}`,
                  err || ack?.error
                );
              }
            });
        });
      } else {
        // ✅ REST/GraphQL fallback: EXACTLY what saveMessage expects
        await Promise.all(
          recipients.map((receiver) => {
            const receiverIdNum = Number(receiver.id);
            if (!Number.isFinite(receiverIdNum)) return Promise.resolve();

            const payload = {
              sender_id: senderIdNum,
              receiver_id: receiverIdNum,
              content: "Shared a post",
              message_type: "shared_post",
              shared_post_id: postIdNum, // 👈 KEY LINE
            };

            return apiCall("/api/messages/send", "POST", payload);
          })
        );
      }

      // 3. Close sheet and navigate to the FIRST selected user's chat
      const first = recipients[0];

      closeSheet();

      router.push({
        pathname: "/(chat)",
        params: {
          userId: String(first.id),
          username: first.username,
          profilePicture: first.profile_picture,
          loggedUserId: senderIdNum,
          loggedUsername: user.username,
          loggedAvatar: user.profile_picture,
        },
      });
    } catch (error: any) {
      console.error("Error sharing post:", error);
      alert(error?.message ?? "Failed to share post. Please try again.");
    } finally {
      sendingRef.current = false;
    }
  }, [
    user,
    postId,
    selectedIds,
    shareUsers,
    postPreview,
    socket,
    closeSheet,
    router,
  ]);

  // const handleSend = useCallback(() => {
  //   if (isSendingRef.current) return;
  //   if (!selectedUsers.length) return;
  //   if (postId == null || postId === "") {
  //     alert("Nothing to send: missing post id.");
  //     return;
  //   }
  //   isSendingRef.current = true;
  //   try {
  //     const normalized = normalizePreview(postPreview);
  //     if (normalized) registerPost(normalized);
  //     selectedUsers.forEach((u) =>
  //       sendPostToChat(String(u.id), String(postId), normalized)
  //     );
  //     sharePostToUsers(
  //       String(postId),
  //       selectedUsers.map((u) => String(u.id)),
  //       normalized
  //     );
  //     closeSheet();
  //     const first = selectedUsers[0];
  //     router.push({
  //       pathname: "/(chat)",
  //       params: {
  //         userId: String(first.id),
  //         username: first.username,
  //         profilePicture: first.profile_picture,
  //         loggedUserId: LOGGED_USER.id,
  //         loggedUsername: LOGGED_USER.username,
  //         loggedAvatar: LOGGED_USER.profile_picture,
  //       },
  //     });
  //   } finally {
  //     setTimeout(() => {
  //       isSendingRef.current = false;
  //     }, 400);
  //   }
  // }, [selectedUsers, postId, postPreview, closeSheet, router]);

  const DefaultBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );

  const keyExtractor = useCallback((it: ShareUser) => String(it.id), []);
  const renderItem = useCallback(
    ({ item }: { item: ShareUser }) => (
      <GridUser
        user={item}
        selected={selectedIds.has(item.id)}
        onPress={(u) => {
          onSelectUser?.(u);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(u.id)) next.delete(u.id);
            else {
              if (prev.size >= (maxSelect ?? 5)) {
                alert(`You can select up to ${maxSelect ?? 5} people.`);
                return prev;
              }
              next.add(u.id);
            }
            return next;
          });
        }}
      />
    ),
    [onSelectUser, selectedIds, maxSelect]
  );

  const renderFooter = useCallback(
    (fp: BottomSheetFooterProps) => (
      <ShareFooter
        {...fp}
        showSendBar={showSendBar}
        selectedCount={selectedUsers.length}
        maxSelect={maxSelect ?? 5}
        onSend={handleSend}
        actions={actions}
      />
    ),
    [showSendBar, selectedUsers.length, maxSelect, handleSend, actions]
  );

  // Footer height calculation
  const NAV_SAFE = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 10);
  const footerHeightBase = showSendBar ? SEND_BAR_HEIGHT : ACTIONS_BAR_HEIGHT;
  // We add some buffer so the last item in the list isn't hidden behind the footer
  const reservedBottom = footerHeightBase + NAV_SAFE + 12;

  const renderHandle = useCallback(
    (props: any) => <SimpleHandle {...props} />,
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      // 👉 start at the larger snap so the list can scroll immediately
      index={0} // use 1 (90%) instead of 0 (50%)
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={DefaultBackdrop}
      enableDynamicSizing={false}
      enableOverDrag={false}
      enableHandlePanningGesture
      handleComponent={renderHandle}
      onDismiss={() => setShow(false)}
      backgroundStyle={{ backgroundColor: "#fff" }}
      handleIndicatorStyle={{ backgroundColor: "#cfd2d7" }}
      footerComponent={renderFooter}
      keyboardBehavior="extend"
      keyboardBlurBehavior="none"
      enableDismissOnClose
    >
      {/* ✅ Direct child is the BottomSheet-aware FlatList */}
      <BottomSheetFlatList
        data={filteredUsers}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        // 👇 Header is “inside” the list
        ListHeaderComponent={
          <SearchHeader
            selectedUsers={selectedUsers}
            setSelectedIds={setSelectedIds}
            search={search}
            setSearch={setSearch}
          />
        }
        // 👇 This keeps the header visually pinned at the top
        stickyHeaderIndices={[0]}
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingTop: 6,
          paddingBottom: reservedBottom, // so last row isn't hidden under footer
          backgroundColor: "#fff",
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
}

ShareSectionBottomSheetComponent.displayName =
  "ShareSectionBottomSheetComponent";
const ShareSectionBottomSheet = memo(ShareSectionBottomSheetComponent);
ShareSectionBottomSheet.displayName = "ShareSectionBottomSheet";
export default ShareSectionBottomSheet;
