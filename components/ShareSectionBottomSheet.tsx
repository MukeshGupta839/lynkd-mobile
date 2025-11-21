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
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";

import SearchBar from "@/components/Searchbar";

import {
  LOGGED_USER,
  PostPreview,
  registerPost,
  sendPostToChat,
  sharePostToUsers,
  USERS,
} from "@/constants/chat";

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

export type ShareUser = {
  id: string | number;
  username: string;
  profile_picture?: string;
  is_creator?: boolean;
};

type Props = {
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
};

/* Dummy users */
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
const FOOTER_MIN_HEIGHT = 54;

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
  const NAV_SAFE = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 10);

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <View
        style={{
          backgroundColor: "#fff",
          paddingBottom: NAV_SAFE,
          paddingTop: 8,
          minHeight: FOOTER_MIN_HEIGHT + NAV_SAFE,
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

/* Header (drag handle + title + SearchBar + selected chips) */
const HeaderHandle = memo(function HeaderHandle({
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
      <View
        style={{
          paddingTop: 8,
          paddingBottom: 10,
          alignItems: "center",
          justifyContent: "center",
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

      <View className="px-3 pb-1 items-center justify-center">
        <Text className="text-lg font-opensans-semibold text-black">Share</Text>
      </View>

      {/* Use shared SearchBar */}
      <View className="px-3 mt-2 mb-1">
        <SearchBar
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
        />
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
          style={{ marginBottom: 4 }}
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
  initialHeightPct = 0.3,
  maxHeightPct = 0.9,
  maxSelect = 5,
}: Props) {
  const router = useRouter(); // ✅ hook at top level
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo<(string | number)[]>(
    () => [
      `${Math.round(initialHeightPct * 100)}%`,
      `${Math.round(maxHeightPct * 100)}%`,
    ],
    [initialHeightPct, maxHeightPct]
  );

  const sheetRef = useRef<BottomSheetModalType>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (show) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [show]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
    setShow(false);
  }, [setShow]);

  const baseUsers = useMemo<ShareUser[]>(() => {
    if (users.length) return users;
    if (USERS?.length) {
      return USERS.map((u) => ({
        id: u.id,
        username: u.username,
        profile_picture: u.profile_picture,
        is_creator: u.role === "Creator",
      }));
    }
    return DUMMY_USERS;
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

  const isSendingRef = useRef(false);
  const handleSend = useCallback(() => {
    if (isSendingRef.current) return;
    if (!selectedUsers.length) return;
    if (postId == null || postId === "") {
      alert("Nothing to send: missing post id.");
      return;
    }
    isSendingRef.current = true;
    try {
      const normalized = normalizePreview(postPreview);
      if (normalized) registerPost(normalized);
      selectedUsers.forEach((u) =>
        sendPostToChat(String(u.id), String(postId), normalized)
      );
      sharePostToUsers(
        String(postId),
        selectedUsers.map((u) => String(u.id)),
        normalized
      );
      closeSheet();
      const first = selectedUsers[0];
      // ✅ use the router instance created at the top
      router.push({
        pathname: "/(chat)",
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
      setTimeout(() => {
        isSendingRef.current = false;
      }, 400);
    }
  }, [selectedUsers, postId, postPreview, closeSheet, router]);

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

  const NAV_SAFE = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 10);
  const reservedBottom =
    (showSendBar ? SEND_BAR_HEIGHT : ACTIONS_BAR_HEIGHT) + NAV_SAFE + 6;

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={DefaultBackdrop}
      enableDynamicSizing={false}
      enableOverDrag={false}
      enableContentPanningGesture={false}
      enableHandlePanningGesture
      handleComponent={() => (
        <HeaderHandle
          selectedUsers={selectedUsers}
          setSelectedIds={setSelectedIds}
          search={search}
          setSearch={setSearch}
        />
      )}
      keyboardBehavior="extend"
      keyboardBlurBehavior="none"
      onDismiss={() => setShow(false)}
      backgroundStyle={{ backgroundColor: "#fff" }}
      handleIndicatorStyle={{ backgroundColor: "#cfd2d7" }}
      footerComponent={renderFooter}
    >
      {/* BODY */}
      <BottomSheetFlatList
        style={{ flex: 1 }}
        data={filteredUsers}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingTop: 6,
          paddingBottom: reservedBottom,
          backgroundColor: "#fff",
        }}
        scrollEnabled
        nestedScrollEnabled
        keyboardShouldPersistTaps="always"
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: reservedBottom }}
      />
    </BottomSheetModal>
  );
}

ShareSectionBottomSheetComponent.displayName =
  "ShareSectionBottomSheetComponent";
const ShareSectionBottomSheet = memo(ShareSectionBottomSheetComponent);
ShareSectionBottomSheet.displayName = "ShareSectionBottomSheet";
export default ShareSectionBottomSheet;
