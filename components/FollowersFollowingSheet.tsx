// components/FollowersFollowingSheet.tsx
import SearchBar from "@/components/Searchbar";
import Octicons from "@expo/vector-icons/Octicons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FollowUser = {
  user_id: number | string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_creator?: boolean;
  profile_picture?: string;
};

type TabKey = "followers" | "following";

interface FollowersFollowingSheetProps {
  show: boolean;
  setShow: (show: boolean) => void;
  followers: FollowUser[];
  followings: FollowUser[];
  activeTab?: TabKey;
  onUserPress?: (user: FollowUser) => void;
  loading?: boolean; // ⬅️ added for API loading state
  error?: string | null; // ⬅️ added for API error handling
}

const { height: WIN_H } = Dimensions.get("window");

const FollowersFollowingSheet: React.FC<FollowersFollowingSheetProps> = ({
  show,
  setShow,
  followers,
  followings,
  activeTab: activeTabProp = "followers",
  onUserPress,
  loading = false,
  error = null,
}) => {
  const insets = useSafeAreaInsets();

  const SHEET_MAX = Math.min(WIN_H * 0.55, WIN_H - insets.top - 24);
  const slideY = useRef(
    new Animated.Value(SHEET_MAX + (insets.bottom || 0))
  ).current;

  const [activeTab, setActiveTab] = useState<TabKey>(activeTabProp);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // 🔎 NEW: query state for the search bar
  const [query, setQuery] = useState("");

  // Sync active tab with prop
  useEffect(() => setActiveTab(activeTabProp), [activeTabProp]);

  // Reset query whenever tab changes or sheet closes
  useEffect(() => {
    if (!show) setQuery("");
  }, [show]);
  useEffect(() => {
    setQuery("");
  }, [activeTab]);

  // Animate in/out
  useEffect(() => {
    Animated.timing(slideY, {
      toValue: show ? 0 : SHEET_MAX + (insets.bottom || 0),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show, SHEET_MAX, insets.bottom, slideY]);

  // Keyboard adjust (mainly iOS)
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      setKeyboardOffset(h * 0.3);
    };
    const onHide = () => setKeyboardOffset(0);

    const s = Keyboard.addListener(showEvt, onShow);
    const h = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  // Which list to show (followers or following)
  const data = activeTab === "followers" ? followers : followings;

  // 🔎 NEW: filter logic (case-insensitive; matches username/first/last/full name)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter((u) => {
      const username = u.username?.toLowerCase() ?? "";
      const first = u.first_name?.toLowerCase() ?? "";
      const last = u.last_name?.toLowerCase() ?? "";
      const full = `${first} ${last}`.trim();
      return (
        username.includes(q) ||
        first.includes(q) ||
        last.includes(q) ||
        full.includes(q)
      );
    });
  }, [data, query]);

  const close = () => setShow(false);

  return (
    <Modal
      visible={show}
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={close}>
      {/* BACKDROP */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={close}
        className="flex-1 bg-black/25"
        accessibilityRole="button"
        accessibilityLabel="Dismiss followers sheet"
      />

      {/* SHEET */}
      <Animated.View
        style={{
          transform: [{ translateY: slideY }],
          height: SHEET_MAX - keyboardOffset + (insets.bottom || 0),
        }}
        className="absolute left-0 right-0 bottom-0 w-full rounded-t-2xl bg-white px-4 pt-5 pb-3 shadow-lg">
        {/* Grab handle */}
        <TouchableOpacity
          onPress={close}
          activeOpacity={0.9}
          className="absolute top-3 left-0 right-0 items-center z-50">
          <View className="w-10 h-1 rounded-full bg-gray-300" />
        </TouchableOpacity>

        {/* Tabs */}
        <View className="flex-row mt-7 mb-2 border-b border-gray-100">
          <TouchableOpacity
            className={`flex-1 items-center py-2 ${
              activeTab === "followers" ? "border-b-2 border-black" : ""
            }`}
            onPress={() => setActiveTab("followers")}>
            <Text
              className={`text-[13px] ${
                activeTab === "followers"
                  ? "text-black font-semibold"
                  : "text-gray-500"
              }`}>
              Followers ({followers?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 items-center py-2 ${
              activeTab === "following" ? "border-b-2 border-black" : ""
            }`}
            onPress={() => setActiveTab("following")}>
            <Text
              className={`text-[13px] ${
                activeTab === "following"
                  ? "text-black font-semibold"
                  : "text-gray-500"
              }`}>
              Following ({followings?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔎 Search bar (now controlled) */}
        <SearchBar placeholder="Search" value={query} onChangeText={setQuery} />

        {/* CONTENT */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-6">
            <ActivityIndicator size="small" color="#000" />
            <Text className="text-gray-500 mt-2 text-sm">
              Loading {activeTab}...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center py-6">
            <Text className="text-red-500 text-sm">{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-gray-500">No users found</Text>
          </View>
        ) : (
          <ScrollView
            className="mt-3"
            contentContainerStyle={{
              paddingBottom: Math.max(16, insets.bottom),
            }}
            keyboardShouldPersistTaps="handled">
            {filtered.map((u) => {
              const fullName =
                `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
              return (
                <TouchableOpacity
                  key={String(u.user_id)}
                  className="flex-row items-center py-2 gap-3"
                  onPress={() => {
                    onUserPress?.(u);
                    close();
                  }}>
                  <Image
                    source={{
                      uri:
                        u.profile_picture ||
                        "https://lynkd-all-media-storage.s3.amazonaws.com/profile-pictures/FFT5JanXZoVDyZKpwtXC2mwXevy1/pic_1734432687555.jpeg",
                    }}
                    className="w-10 h-10 rounded-full"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      {!!fullName && (
                        <Text className="text-[14px] font-semibold text-black">
                          {fullName}
                        </Text>
                      )}
                      {u.is_creator && (
                        <Octicons
                          name="verified"
                          size={14}
                          color="#000"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    <Text className="text-[14px] text-gray-500">
                      @{u.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
};

export default FollowersFollowingSheet;
