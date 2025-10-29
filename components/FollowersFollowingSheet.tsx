// components/FollowersFollowingSheet.tsx
import SearchBar from "@/components/Searchbar";
// (Octicons removed)
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  PanResponderGestureState,
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
  activeTab?: TabKey;
  onUserPress?: (user: FollowUser) => void;
  loading?: boolean;
  error?: string | null;
  onFollow?: (userId: string | number) => Promise<void> | void;
  onUnfollow?: (userId: string | number) => Promise<void> | void;
  onMessage?: (user: FollowUser) => void;
  confirmUnfollow?: boolean;
  enableDemoData?: boolean;
}

const { height: WIN_H, width: WIN_W } = Dimensions.get("window");
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const FollowersFollowingSheet: React.FC<FollowersFollowingSheetProps> = ({
  show,
  setShow,
  followers,
  followings,
  activeTab: activeTabProp = "following",
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

  /** Sheet sizing/animation */
  const SHEET_H = Math.round(WIN_H * 0.9);
  const OPEN_Y = 0;
  const CLOSED_Y = SHEET_H;
  const slideY = useRef(new Animated.Value(CLOSED_Y)).current;

  useEffect(() => {
    Animated.timing(slideY, {
      toValue: show ? OPEN_Y : CLOSED_Y,
      duration: show ? 260 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show]);

  const close = () => setShow(false);

  /** Pan to close/open */
  const dragStartYRef = useRef(0);
  const snapOpen = () =>
    Animated.spring(slideY, {
      toValue: OPEN_Y,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start();

  const snapClose = () =>
    Animated.spring(slideY, {
      toValue: CLOSED_Y,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start(({ finished }) => finished && close());

  const decideSnap = (finalY: number, vy: number) => {
    const distanceThreshold = SHEET_H * 0.35;
    const velocityThreshold = 1.0;
    if (vy > velocityThreshold) return snapClose();
    if (vy < -velocityThreshold) return snapOpen();
    return finalY > distanceThreshold ? snapClose() : snapOpen();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => {
        const vx = Math.abs(g.dx);
        const vy = Math.abs(g.dy);
        return vy > 4 && vy > vx;
      },
      onPanResponderGrant: () => {
        slideY.stopAnimation((cur: number) => {
          dragStartYRef.current = cur;
        });
      },
      onPanResponderMove: (_e, g: PanResponderGestureState) => {
        const next = clamp(dragStartYRef.current + g.dy, OPEN_Y, CLOSED_Y);
        slideY.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const next = clamp(dragStartYRef.current + g.dy, OPEN_Y, CLOSED_Y);
        decideSnap(next, g.vy);
      },
      onPanResponderTerminate: (_e, g) => {
        const next = clamp(dragStartYRef.current + g.dy, OPEN_Y, CLOSED_Y);
        decideSnap(next, g.vy);
      },
    })
  ).current;

  /** Demo data */
  const DEMO_MUTUAL: FollowUser = {
    user_id: "demo_mutual",
    username: "mutual_guy",
    first_name: "Mutual",
    last_name: "Guy",
    is_creator: true,
  };
  const DEMO_I_FOLLOW_ONLY: FollowUser = {
    user_id: "demo_i_follow_only",
    username: "solo_follow",
    first_name: "Solo",
    last_name: "Follow",
  };
  const DEMO_THEY_FOLLOW_ONLY: FollowUser = {
    user_id: "demo_they_follow_only",
    username: "follow_me_back",
    first_name: "Follow",
    last_name: "MeBack",
    isVerified: true,
  };

  const safeFollowers = useMemo(
    () =>
      enableDemoData
        ? [...followers, DEMO_MUTUAL, DEMO_THEY_FOLLOW_ONLY]
        : followers,
    [enableDemoData, followers]
  );
  const safeFollowings = useMemo(
    () =>
      enableDemoData
        ? [...followings, DEMO_MUTUAL, DEMO_I_FOLLOW_ONLY]
        : followings,
    [enableDemoData, followings]
  );

  /** Tabs + pager */
  const [activeTab, setActiveTab] = useState<TabKey>(activeTabProp);
  useEffect(() => setActiveTab(activeTabProp), [activeTabProp]);

  const pagerRef = useRef<ScrollView>(null);
  const [pageW, setPageW] = useState<number>(WIN_W);
  const [pagerReady, setPagerReady] = useState(false);
  const [pagerVisible, setPagerVisible] = useState(false);
  const initialIndex = activeTabProp === "following" ? 0 : 1;
  const pagerKey = `pager-${show ? 1 : 0}-${pageW}-${initialIndex}`;

  const onPagerLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - pageW) > 0.5) setPageW(w);
    setPagerReady(true);
  };

  useEffect(() => {
    if (show) setPagerVisible(false);
  }, [show]);

  const raf1Ref = useRef<number | null>(null);
  const raf2Ref = useRef<number | null>(null);

  useEffect(() => {
    if (!show || !pagerReady) return;

    const index = activeTabProp === "following" ? 0 : 1;

    raf1Ref.current = requestAnimationFrame(() => {
      raf2Ref.current = requestAnimationFrame(() => {
        pagerRef.current?.scrollTo({ x: index * pageW, y: 0, animated: false });
        setPagerVisible(true);
      });
    });

    return () => {
      if (raf1Ref.current) cancelAnimationFrame(raf1Ref.current);
      if (raf2Ref.current) cancelAnimationFrame(raf2Ref.current);
      raf1Ref.current = null;
      raf2Ref.current = null;
    };
  }, [show, pagerReady, pageW, activeTabProp]);

  const goToTab = (tab: TabKey, animated = true) => {
    setActiveTab(tab);
    const index = tab === "following" ? 0 : 1;
    pagerRef.current?.scrollTo({ x: index * pageW, y: 0, animated });
  };

  const onPageScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / pageW);
    setActiveTab(index === 0 ? "following" : "followers");
  };

  /** Search */
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!show) setQuery("");
  }, [show]);
  useEffect(() => {
    setQuery("");
  }, [activeTab]);

  /** Relationship state */
  const userMap = useMemo(() => {
    const m = new Map<string | number, FollowUser>();
    safeFollowers?.forEach((u) => m.set(u.user_id, u));
    safeFollowings?.forEach((u) => m.set(u.user_id, u));
    return m;
  }, [safeFollowers, safeFollowings]);

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
    setIFollowSet((prev) => new Set(prev).add(id));
    try {
      await onFollow?.(id);
    } catch {
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
      setIFollowSet((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      try {
        await onUnfollow?.(id);
      } catch {
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

  /** Buttons — smaller but consistent */
  const BTN_H = 30; // ↓ a bit
  const BTN_W = 108; // still fits "Follow back"
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
  const btnFill = { ...btnBase, backgroundColor: "#0095F6" };
  const btnTextOutline = "text-[12px] text-black";
  const btnTextFill = "text-[12px] text-white font-semibold";

  /** Row */
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
              "https://lynkd-all-media-storage.s3.amazonaws.com/profile-pictures/FFT5JanXZoVDyZKpwtXC2mwXevy1/pic_1734432687555.jpeg",
          }}
          className="w-10 h-10 rounded-full"
        />

        {/* Only bold name */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.7}
          onPress={() => (onMessage ? onMessage(u) : onUserPress?.(u))}>
          <Text
            className="text-[14px] font-semibold text-black"
            numberOfLines={1}>
            {displayName}
          </Text>
        </TouchableOpacity>

        {/* Actions */}
        <View
          style={{
            flexShrink: 0,
            flexDirection: "row",
            alignItems: "center",
            columnGap: ACTIONS_GAP,
          }}>
          <TouchableOpacity
            onPress={() => (onMessage ? onMessage(u) : onUserPress?.(u))}
            disabled={pending}
            activeOpacity={0.9}
            style={[btnOutline, { opacity: pending ? 0.5 : 1 }]}>
            <Text
              className={btnTextOutline}
              numberOfLines={1}
              allowFontScaling={false}>
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
            ]}>
            <Text
              className={outline ? btnTextOutline : btnTextFill}
              numberOfLines={1}
              allowFontScaling={false}>
              {isPendingNow ? pendingText : buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /** Lists */
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

  const filterList = (list: FollowUser[]) => {
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
  };

  const dataFollowing = filterList(followingList);
  const dataFollowers = filterList(followersList);

  const followingCount = iFollowSet.size;
  const followersCount = theyFollowMeSet.size;

  /** Render */
  return (
    <Modal
      visible={show}
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={close}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={close}
        className="flex-1 bg-black/25"
      />

      <Animated.View
        className="absolute left-0 right-0 bottom-0 w-full rounded-t-2xl bg-white shadow-lg"
        style={{
          height: SHEET_H - Math.max(insets.bottom, 0),
          transform: [{ translateY: slideY }],
          paddingBottom: Math.max(insets.bottom, 12),
          paddingHorizontal: 16,
          paddingTop: 16,
        }}>
        {/* Header: handle + tabs + search */}
        <View {...panResponder.panHandlers}>
          <View className="items-center mb-3">
            <View className="w-10 h-1.5 rounded-full bg-gray-300" />
          </View>

          <View className="flex-row mb-2 border-b border-gray-100">
            <TouchableOpacity
              className={`flex-1 items-center py-2 ${
                activeTab === "following" ? "border-b-2 border-black" : ""
              }`}
              onPress={() => goToTab("following")}>
              <Text
                className={`text-[13px] ${
                  activeTab === "following"
                    ? "text-black font-semibold"
                    : "text-gray-500"
                }`}>
                Following ({followingCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-2 ${
                activeTab === "followers" ? "border-b-2 border-black" : ""
              }`}
              onPress={() => goToTab("followers")}>
              <Text
                className={`text-[13px] ${
                  activeTab === "followers"
                    ? "text-black font-semibold"
                    : "text-gray-500"
                }`}>
                Followers ({followersCount})
              </Text>
            </TouchableOpacity>
          </View>

          <SearchBar
            placeholder="Search"
            value={query}
            onChangeText={setQuery}
          />
        </View>

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
        ) : (
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
              x: (activeTabProp === "following" ? 0 : 1) * pageW,
              y: 0,
            }}
            style={{ flex: 1, marginTop: 8 }}>
            {/* Following */}
            <ScrollView
              style={{ width: pageW }}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled">
              {dataFollowing.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-gray-500">No following users</Text>
                </View>
              ) : (
                dataFollowing.map((u) => (
                  <UserRow key={String(u.user_id)} u={u} />
                ))
              )}
            </ScrollView>

            {/* Followers */}
            <ScrollView
              style={{ width: pageW }}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled">
              {dataFollowers.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-gray-500">No followers found</Text>
                </View>
              ) : (
                dataFollowers.map((u) => (
                  <UserRow key={String(u.user_id)} u={u} />
                ))
              )}
            </ScrollView>
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
};

export default FollowersFollowingSheet;
