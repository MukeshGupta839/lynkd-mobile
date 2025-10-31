// components/FollowersFollowingSheet.tsx
import SearchBar from "@/components/Searchbar";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ======================== Types ======================== */
type FollowUser = {
  user_id: number | string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_creator?: boolean;
  verified?: any;
  isVerified?: any;
  author_verified?: any;
  user?: { verified?: any; is_verified?: any };
  profile_picture?: string;
};

type TabKey = "following" | "followers";

interface FollowersFollowingSheetProps {
  show: boolean;
  setShow: (show: boolean) => void;
  followers: FollowUser[];
  followings: FollowUser[];
  activeTab?: TabKey; // which tab to open on
  onUserPress?: (user: FollowUser) => void;
  loading?: boolean; // show skeletons when true
  error?: string | null;
  onFollow?: (userId: string | number) => Promise<void> | void;
  onUnfollow?: (userId: string | number) => Promise<void> | void;
  onMessage?: (user: FollowUser) => void;
  confirmUnfollow?: boolean;
  enableDemoData?: boolean;
}

/* ======================== Constants / Helpers ======================== */
const { height: WIN_H, width: WIN_W } = Dimensions.get("window");
const SCREEN_W = WIN_W;

/* ======================== Skeleton Loader ======================== */
const Shimmer: React.FC<{
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ height, borderRadius = 8, style }) => {
  const translateX = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: SCREEN_W,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return (
    <View
      style={[
        {
          overflow: "hidden",
          backgroundColor: "#ECEFF3",
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          colors={["transparent", "rgba(255,255,255,0.65)", "transparent"]}
          style={{ width: 120, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

const SkeletonRow: React.FC = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    }}
  >
    <Shimmer height={40} borderRadius={20} style={{ width: 40 }} />
    <View style={{ flex: 1, gap: 6 }}>
      <Shimmer height={14} borderRadius={6} style={{ width: "60%" }} />
      <Shimmer height={12} borderRadius={6} style={{ width: "40%" }} />
    </View>
    <Shimmer height={30} borderRadius={10} style={{ width: 108 }} />
  </View>
);

const SkeletonList: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <View style={{ paddingVertical: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </View>
);

/* ======================== Component ======================== */
const FollowersFollowingSheet: React.FC<FollowersFollowingSheetProps> = ({
  show,
  setShow,
  followers,
  followings,
  activeTab: activeTabProp = "followers", // default to followers tab
  onUserPress,
  loading = false,
  error = null,
  onFollow,
  onUnfollow,
  onMessage,
  confirmUnfollow = true,
  enableDemoData = false,
}) => {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModalType>(null);

  // Snap points: 50%, 80%, 90%
  const snapPoints = useMemo(() => [WIN_H * 0.5, WIN_H * 0.8, WIN_H * 0.9], []);
  const initialIndex = 2; // open near-full

  // Present/dismiss
  useEffect(() => {
    if (show) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [show]);

  const close = useCallback(() => setShow(false), [setShow]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  /* ======================== Demo augment ======================== */
  const safeFollowers: FollowUser[] = useMemo(() => {
    if (!followers) return [];
    return enableDemoData ? [...followers] : followers;
  }, [followers, enableDemoData]);

  const safeFollowings: FollowUser[] = useMemo(() => {
    if (!followings) return [];
    return enableDemoData ? [...followings] : followings;
  }, [followings, enableDemoData]);

  /* ======================== Tabs / Pager ======================== */
  // Pages order: [Followers (0), Following (1)]
  const PAGE_FOLLOWERS = 0;
  const PAGE_FOLLOWING = 1;

  const [activeTab, setActiveTab] = useState<TabKey>(activeTabProp);
  useEffect(() => setActiveTab(activeTabProp), [activeTabProp]);

  const pagerRef = useRef<ScrollView>(null);
  const [pageW, setPageW] = useState<number>(WIN_W);
  const [pagerReady, setPagerReady] = useState(false);

  // Keep a key tied to target tab to ensure initial contentOffset applies
  const pagerKey = `pager-${pageW}-${activeTabProp}`;

  const onPagerLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - pageW) > 0.5) setPageW(w);
    setPagerReady(true);
  };

  // Type-safe timer ref
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToTab = useCallback(
    (animate = false) => {
      if (!pagerReady || !show) return;
      const index =
        activeTabProp === "following" ? PAGE_FOLLOWING : PAGE_FOLLOWERS;
      pagerRef.current?.scrollTo({ x: index * pageW, y: 0, animated: animate });
    },
    [pagerReady, show, activeTabProp, pageW]
  );

  // Align pager after sheet opens & whenever target tab prop changes
  useEffect(() => {
    if (!show || !pagerReady) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    // Wait a bit so BottomSheet can finish its opening animation/layout
    syncTimeoutRef.current = setTimeout(() => syncToTab(false), 300);
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [show, pagerReady, activeTabProp, syncToTab]);

  // Re-sync once loader flips off (layout/content height changes can nudge)
  useEffect(() => {
    if (!loading && show && pagerReady) {
      const t = setTimeout(() => syncToTab(false), 50);
      return () => clearTimeout(t);
    }
  }, [loading, show, pagerReady, syncToTab]);

  const goToTab = (tab: TabKey, animated = true) => {
    setActiveTab(tab);
    const index = tab === "following" ? PAGE_FOLLOWING : PAGE_FOLLOWERS;
    pagerRef.current?.scrollTo({ x: index * pageW, y: 0, animated });
  };

  const onPageScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / pageW);
    setActiveTab(index === PAGE_FOLLOWING ? "following" : "followers");
  };

  /* ======================== Search / Filtering ======================== */
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!show) setQuery("");
  }, [show]);
  useEffect(() => {
    setQuery("");
  }, [activeTab]);

  const filterList = useCallback(
    (list: FollowUser[]) => {
      const q = query.trim().toLowerCase();
      if (!q) return list;
      return list.filter((u) => {
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
    },
    [query]
  );

  // Relationship sets for fast lookups (who I follow, who follows me)
  const makeIdSet = (arr?: FollowUser[]) => {
    const s = new Set<string | number>();
    (arr || []).forEach((u) => s.add(u.user_id));
    return s;
  };
  const setsEqual = (a: Set<any>, b: Set<any>) => {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  };

  const [iFollowSet, setIFollowSet] = useState<Set<string | number>>(() =>
    makeIdSet(safeFollowings)
  );
  useEffect(() => {
    const next = makeIdSet(safeFollowings);
    setIFollowSet((prev) => (setsEqual(prev, next) ? prev : next));
  }, [safeFollowings]);

  const [theyFollowMeSet, setTheyFollowMeSet] = useState<Set<string | number>>(
    () => makeIdSet(safeFollowers)
  );
  useEffect(() => {
    const next = makeIdSet(safeFollowers);
    setTheyFollowMeSet((prev) => (setsEqual(prev, next) ? prev : next));
  }, [safeFollowers]);

  // Map for quick user lookups
  const userMap = useMemo(() => {
    const m = new Map<string | number, FollowUser>();
    safeFollowers?.forEach((u) => m.set(u.user_id, u));
    safeFollowings?.forEach((u) => m.set(u.user_id, u));
    return m;
  }, [safeFollowers, safeFollowings]);

  // Ordered following list (preserve original followings order)
  const followingList: FollowUser[] = useMemo(() => {
    const arr: FollowUser[] = [];
    iFollowSet.forEach((id) => {
      const u = userMap.get(id);
      if (u) arr.push(u);
    });
    const order = new Map((safeFollowings || []).map((u, i) => [u.user_id, i]));
    arr.sort(
      (a, b) => (order.get(a.user_id) ?? 9999) - (order.get(b.user_id) ?? 9999)
    );
    return arr;
  }, [iFollowSet, safeFollowings, userMap]);

  const followersList: FollowUser[] = useMemo(
    () => safeFollowers || [],
    [safeFollowers]
  );

  const dataFollowing = filterList(followingList);
  const dataFollowers = filterList(followersList);

  const followingCount = iFollowSet.size;
  const followersCount = theyFollowMeSet.size;

  /* ======================== Follow / Unfollow handlers ======================== */
  const isIFollowing = (id: string | number) => iFollowSet.has(id);
  const isTheyFollowMe = (id: string | number) => theyFollowMeSet.has(id);

  const [pendingFollow, setPendingFollow] = useState<Set<string | number>>(
    new Set()
  );
  const [pendingUnfollow, setPendingUnfollow] = useState<Set<string | number>>(
    new Set()
  );
  const isPending = (id: string | number) =>
    pendingFollow.has(id) || pendingUnfollow.has(id);

  const doFollow = async (id: string | number) => {
    if (isIFollowing(id) || isPending(id)) return;
    setPendingFollow((s) => new Set(s).add(id));
    setIFollowSet((prev) => new Set(prev).add(id)); // optimistic
    try {
      await onFollow?.(id);
    } catch {
      // revert
      setIFollowSet((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    } finally {
      setPendingFollow((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const doUnfollow = async (id: string | number) => {
    if (!isIFollowing(id) || isPending(id)) return;

    const run = async () => {
      setPendingUnfollow((s) => new Set(s).add(id));
      // optimistic remove
      setIFollowSet((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      try {
        await onUnfollow?.(id);
      } catch {
        // revert
        setIFollowSet((prev) => new Set(prev).add(id));
      } finally {
        setPendingUnfollow((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    };

    if (confirmUnfollow) {
      Alert.alert("Unfollow?", "You will stop seeing their posts.", [
        { text: "Cancel", style: "cancel" },
        { text: "Unfollow", style: "destructive", onPress: run },
      ]);
    } else {
      run();
    }
  };

  /* ======================== UI Atoms ======================== */
  const BTN_H = 30;
  const BTN_W = 108;
  const ACTIONS_GAP = 8;
  const btnBase = {
    height: BTN_H,
    width: BTN_W,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
  const btnOutline = {
    ...btnBase,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
  };
  const btnFill = { ...btnBase, backgroundColor: "#000" };
  const btnTextOutline = "text-[12px] text-black";
  const btnTextFill = "text-[12px] text-white font-semibold";

  const UserRow = ({ u }: { u: FollowUser }) => {
    const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
    const displayName = fullName || u.username;
    const iFollow = isIFollowing(u.user_id);
    const theyFollow = isTheyFollowMe(u.user_id);
    const pending = isPending(u.user_id);

    const buttonLabel = iFollow
      ? "Unfollow"
      : theyFollow
        ? "Follow back"
        : "Follow";
    const outline = iFollow;
    const onPress = iFollow
      ? () => doUnfollow(u.user_id)
      : () => doFollow(u.user_id);
    const pendingText = iFollow ? "Removing..." : "Following...";
    const isPendingNow = iFollow
      ? pendingUnfollow.has(u.user_id)
      : pendingFollow.has(u.user_id);

    return (
      <View className="flex-row items-center py-2 gap-3">
        <Image
          source={{
            uri:
              u.profile_picture ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          className="w-10 h-10 rounded-full"
        />

        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.7}
          onPress={() => (onMessage ? onMessage(u) : onUserPress?.(u))}
        >
          <Text
            className="text-[14px] font-semibold text-black"
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexShrink: 0,
            flexDirection: "row",
            alignItems: "center",
            columnGap: ACTIONS_GAP,
          }}
        >
          <TouchableOpacity
            onPress={() => (onMessage ? onMessage(u) : onUserPress?.(u))}
            disabled={pending}
            activeOpacity={0.9}
            style={[btnOutline, { opacity: pending ? 0.5 : 1 }]}
          >
            <Text
              className={btnTextOutline}
              numberOfLines={1}
              allowFontScaling={false}
            >
              Message
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPress}
            disabled={pending}
            activeOpacity={0.9}
            style={[
              outline ? btnOutline : btnFill,
              { opacity: pending ? 0.5 : 1 },
            ]}
          >
            <Text
              className={outline ? btnTextOutline : btnTextFill}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {isPendingNow ? pendingText : buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* ======================== Render ======================== */
  return (
    <BottomSheetModal
      ref={modalRef}
      index={initialIndex}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={close}
      enablePanDownToClose
      enableHandlePanningGesture
      enableContentPanningGesture
      enableOverDrag={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="none"
      handleIndicatorStyle={{ backgroundColor: "#cfd2d7" }}
      backgroundStyle={{ backgroundColor: "#fff" }}
      topInset={0}
    >
      <BottomSheetView
        style={{
          paddingBottom: Math.max(insets.bottom, 12),

          paddingTop: 12,
          flex: 1,
        }}
      >
        {/* Header (built-in handle only) */}
        <View>
          {/* Tabs: order matches swipe pages (Followers | Following) */}
          <View className="flex-row mb-2  px-3">
            <TouchableOpacity
              className={`flex-1 items-center  py-2 ${
                activeTab === "followers" ? "border-b-2 border-black" : ""
              }`}
              onPress={() => goToTab("followers")}
            >
              <Text
                className={`text-base ${
                  activeTab === "followers"
                    ? "text-black font-semibold"
                    : "text-gray-500"
                }`}
              >
                Followers ({followersCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 items-center py-2 ${
                activeTab === "following" ? "border-b-2 border-black" : ""
              }`}
              onPress={() => goToTab("following")}
            >
              <Text
                className={`text-base ${
                  activeTab === "following"
                    ? "text-black font-semibold"
                    : "text-gray-500"
                }`}
              >
                Following ({followingCount})
              </Text>
            </TouchableOpacity>
          </View>
          <View className="px-3 mt-2">
            <SearchBar
              placeholder="Search"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {/* Body */}
        {error ? (
          <View className="flex-1 justify-center items-center  py-6">
            <Text className="text-red-500 text-sm">{error}</Text>
          </View>
        ) : (
          <Animated.View style={{ flex: 1, opacity: loading ? 0.35 : 1 }}>
            <ScrollView
              key={pagerKey}
              ref={pagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onPageScrollEnd}
              onLayout={onPagerLayout}
              keyboardShouldPersistTaps="handled"
              contentOffset={{
                x:
                  (activeTabProp === "following"
                    ? PAGE_FOLLOWING
                    : PAGE_FOLLOWERS) * pageW,
                y: 0,
              }}
              style={{ flex: 1, marginTop: 8 }}
              decelerationRate="fast"
              disableIntervalMomentum
              scrollEventThrottle={16}
            >
              {/* Followers page (index 0) */}
              <BottomSheetScrollView
                style={{ width: pageW }}
                contentContainerStyle={{
                  paddingBottom: 24,
                  paddingHorizontal: 12,
                }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {loading ? (
                  <SkeletonList />
                ) : dataFollowers.length === 0 ? (
                  <View className="items-center py-8">
                    <Text className="text-gray-500">No followers found</Text>
                  </View>
                ) : (
                  dataFollowers.map((u) => (
                    <UserRow key={String(u.user_id)} u={u} />
                  ))
                )}
              </BottomSheetScrollView>

              {/* Following page (index 1) */}
              <BottomSheetScrollView
                style={{ width: pageW }}
                contentContainerStyle={{
                  paddingBottom: 24,
                  paddingHorizontal: 12,
                }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {loading ? (
                  <SkeletonList />
                ) : dataFollowing.length === 0 ? (
                  <View className="items-center py-8">
                    <Text className="text-gray-500">No following users</Text>
                  </View>
                ) : (
                  dataFollowing.map((u) => (
                    <UserRow key={String(u.user_id)} u={u} />
                  ))
                )}
              </BottomSheetScrollView>
            </ScrollView>
          </Animated.View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default FollowersFollowingSheet;
