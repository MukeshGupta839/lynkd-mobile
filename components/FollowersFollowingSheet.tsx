// components/FollowersFollowingSheet.tsx
import { SkeletonList } from "@/components/Placeholder/FollowersFollowingSkeletons";
import SearchBar from "@/components/Searchbar";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
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
  activeTab?: TabKey;
  onUserPress?: (user: FollowUser) => void;
  loading?: boolean;
  error?: string | null;
  onFollow?: (
    userId: string | number
  ) => Promise<"followed" | "pending" | void> | ("followed" | "pending" | void);
  onUnfollow?: (userId: string | number) => Promise<void> | void;
  onMessage?: (user: FollowUser) => void;
  enableDemoData?: boolean;
  refreshKey?: number;
}

/* ======================== Constants / Helpers ======================== */
const { height: WIN_H, width: WIN_W } = Dimensions.get("window");
const toKey = (id: string | number) => String(id);

const FollowersFollowingSheet: React.FC<FollowersFollowingSheetProps> = ({
  show,
  setShow,
  followers,
  followings,
  activeTab: activeTabProp = "followers",
  onUserPress,
  loading = false,
  error = null,
  onFollow,
  onUnfollow,
  onMessage,
  enableDemoData = false,
}) => {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModalType>(null);

  const snapPoints = useMemo(() => [WIN_H * 0.5, WIN_H * 0.8, WIN_H * 0.9], []);
  const initialIndex = 2;

  useEffect(() => {
    if (show) modalRef.current?.present();
    else modalRef.current?.dismiss();
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
  const PAGE_FOLLOWERS = 0;
  const PAGE_FOLLOWING = 1;

  const [activeTab, setActiveTab] = useState<TabKey>(activeTabProp);
  useEffect(() => setActiveTab(activeTabProp), [activeTabProp]);

  const pagerRef = useRef<ScrollView>(null);
  const [pageW, setPageW] = useState<number>(WIN_W);
  const [pagerReady, setPagerReady] = useState(false);
  const pagerKey = `pager-${pageW}-${activeTab}`;

  const onPagerLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - pageW) > 0.5) setPageW(w);
    setPagerReady(true);
  };

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToTab = useCallback(
    (animate = false) => {
      if (!pagerReady || !show) return;
      const index = activeTab === "following" ? PAGE_FOLLOWING : PAGE_FOLLOWERS;
      pagerRef.current?.scrollTo({ x: index * pageW, y: 0, animated: animate });
    },
    [pagerReady, show, activeTab, pageW]
  );

  useEffect(() => {
    if (!show || !pagerReady) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncToTab(false), 300);
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [show, pagerReady, activeTabProp, syncToTab]);

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

  const toIdSet = (arr?: FollowUser[]) => {
    const s = new Set<string>();
    (arr || []).forEach((u) => s.add(toKey(u.user_id)));
    return s;
  };

  const iFollowSet = useMemo(() => toIdSet(safeFollowings), [safeFollowings]);
  const theyFollowMeSet = useMemo(
    () => toIdSet(safeFollowers),
    [safeFollowers]
  );

  // Local-only pending cache (no persistence)
  const [requestPendingSet, setRequestPendingSet] = useState<Set<string>>(
    new Set<string>()
  );

  const userMap = useMemo(() => {
    const m = new Map<string, FollowUser>();
    safeFollowers?.forEach((u) => m.set(toKey(u.user_id), u));
    safeFollowings?.forEach((u) => m.set(toKey(u.user_id), u));
    return m;
  }, [safeFollowers, safeFollowings]);

  const followingList: FollowUser[] = useMemo(() => {
    const arr: FollowUser[] = [];
    iFollowSet.forEach((id) => {
      const u = userMap.get(id);
      if (u) arr.push(u);
    });
    const order = new Map(
      (safeFollowings || []).map((u, i) => [toKey(u.user_id), i])
    );
    arr.sort(
      (a, b) =>
        (order.get(toKey(a.user_id)) ?? 9999) -
        (order.get(toKey(b.user_id)) ?? 9999)
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

  const isIFollowing = (id: string | number) => iFollowSet.has(toKey(id));
  const isTheyFollowMe = (id: string | number) =>
    theyFollowMeSet.has(toKey(id));
  const isRequestPending = (id: string | number) =>
    requestPendingSet.has(toKey(id));

  const [pendingFollow, setPendingFollow] = useState<Set<string>>(new Set());
  const [pendingUnfollow, setPendingUnfollow] = useState<Set<string>>(
    new Set()
  );
  const isBusy = (id: string | number) => {
    const k = toKey(id);
    return pendingFollow.has(k) || pendingUnfollow.has(k);
  };

  /* ======================== Actions ======================== */

  const doFollow = async (id: string | number) => {
    const k = toKey(id);
    if (isBusy(k)) return;
    if (isIFollowing(k)) return;

    // Mark as pending locally (component-only)
    setRequestPendingSet((prev) => {
      const n = new Set(prev);
      n.add(k);
      return n;
    });
    setPendingFollow((s) => new Set(s).add(k));

    try {
      const result = await onFollow?.(id);
      const status =
        (typeof result === "string" ? result : undefined) ?? "pending";
      if (status === "followed") {
        // If server says followed immediately, remove pending
        setRequestPendingSet((prev) => {
          const n = new Set(prev);
          n.delete(k);
          return n;
        });
      }
    } catch (err) {
      // Remove pending locally on error
      setRequestPendingSet((prev) => {
        const n = new Set(prev);
        n.delete(k);
        return n;
      });
    } finally {
      setPendingFollow((s) => {
        const n = new Set(s);
        n.delete(k);
        return n;
      });
    }
  };

  /**
   * doUnfollow (component-local handling)
   *
   * - If there's a pending request (we sent request but not following), cancelling/decline flow:
   *   - Remove pending locally immediately.
   *   - Call onUnfollow (should call cancel/decline endpoint on server).
   *   - If server errors with "already removed" treat as success.
   *   - If server errors otherwise, re-add pending locally.
   *
   * - If we currently follow the user, call onUnfollow to unfollow and keep UI consistent.
   */
  const doUnfollow = async (id: string | number) => {
    const k = toKey(id);
    if (isBusy(k)) return;

    console.log(
      `[FFSheet] doUnfollow START id=${k} isIFollowing=${isIFollowing(
        k
      )} isRequestPending=${isRequestPending(k)}`
    );

    // If pending (we sent request but not following), attempt cancel/decline flow
    if (!isIFollowing(k) && isRequestPending(k)) {
      // Optimistically remove from local pending set
      setRequestPendingSet((prev) => {
        const n = new Set(prev);
        n.delete(k);
        return n;
      });

      setPendingUnfollow((s) => new Set(s).add(k));

      try {
        console.log(`[FFSheet] calling onUnfollow for pending id=${k}`);
        await onUnfollow?.(id);
        console.log(`[FFSheet] onUnfollow succeeded for pending id=${k}`);
        // nothing else to do — pending already removed
      } catch (err: any) {
        const errMsg = String(err?.message ?? "").toLowerCase();
        const serverMsg = String(
          err?.response?.data?.message ?? err?.response?.data ?? ""
        ).toLowerCase();
        const statusCode = err?.response?.status;

        const alreadyGone =
          errMsg.includes("not following") ||
          errMsg.includes("user was not following") ||
          errMsg.includes("not found") ||
          serverMsg.includes("not following") ||
          serverMsg.includes("not found") ||
          (statusCode && [404, 410].includes(statusCode));

        if (alreadyGone) {
          console.log(
            `[FFSheet] onUnfollow treated-as-success for pending id=${k} (server says already removed)`,
            err
          );
          // already removed on server, keep it removed locally
          setRequestPendingSet((prev) => {
            const n = new Set(prev);
            n.delete(k);
            return n;
          });
        } else {
          console.error(`[FFSheet] onUnfollow FAILED for pending id=${k}`, err);
          // rollback: re-add pending only for genuine failure
          setRequestPendingSet((prev) => {
            const n = new Set(prev);
            n.add(k);
            return n;
          });
        }
      } finally {
        setPendingUnfollow((s) => {
          const n = new Set(s);
          n.delete(k);
          return n;
        });
      }
      return;
    }

    // If not following and not pending, nothing to do
    if (!isIFollowing(k)) {
      return;
    }

    // Normal unfollow flow (we currently follow the user)
    setPendingUnfollow((s) => new Set(s).add(k));
    try {
      console.log(`[FFSheet] calling onUnfollow for unfollow id=${k}`);
      await onUnfollow?.(id);
      console.log(`[FFSheet] onUnfollow succeeded for unfollow id=${k}`);
      // ensure any pending local mark removed
      setRequestPendingSet((prev) => {
        const n = new Set(prev);
        if (n.has(k)) n.delete(k);
        return n;
      });
    } catch (err: any) {
      const errMsg = String(err?.message ?? "").toLowerCase();
      const serverMsg = String(
        err?.response?.data?.message ?? err?.response?.data ?? ""
      ).toLowerCase();
      const statusCode = err?.response?.status;

      const alreadyGone =
        errMsg.includes("not following") ||
        errMsg.includes("not found") ||
        serverMsg.includes("not following") ||
        serverMsg.includes("not found") ||
        (statusCode && [404, 410].includes(statusCode));

      if (alreadyGone) {
        console.log(
          `[FFSheet] onUnfollow treated-as-success for unfollow id=${k} (server says already removed)`,
          err
        );
        setRequestPendingSet((prev) => {
          const n = new Set(prev);
          n.delete(k);
          return n;
        });
      } else {
        console.error(`[FFSheet] onUnfollow FAILED for unfollow id=${k}`, err);
      }
    } finally {
      setPendingUnfollow((s) => {
        const n = new Set(s);
        n.delete(k);
        return n;
      });
    }
  };

  /* Reconcile: if someone appears in iFollowSet remove from pending store */
  useEffect(() => {
    if (!requestPendingSet.size) return;
    setRequestPendingSet((prev) => {
      const n = new Set(prev);
      for (const id of Array.from(prev)) {
        if (iFollowSet.has(id)) {
          n.delete(id);
        }
      }
      return n;
    });
  }, [iFollowSet, requestPendingSet.size]);

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

  const disabledPendingStyle = {
    ...btnOutline,
    backgroundColor: "#F3F4F6", // light gray bg for disabled
    borderColor: "#E5E7EB",
  };
  const disabledPendingText = "text-[12px] text-gray-500";

  const UserRow = ({ u }: { u: FollowUser }) => {
    const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
    const displayName = fullName || u.username;
    const idKey = toKey(u.user_id);
    const iFollow = isIFollowing(idKey);
    const theyFollow = isTheyFollowMe(idKey);
    const reqPending = isRequestPending(idKey);
    const busy = isBusy(idKey);

    let buttonLabel = "Follow";
    if (iFollow) buttonLabel = "Unfollow";
    else if (reqPending) buttonLabel = "Pending";
    else if (theyFollow) buttonLabel = "Follow back";

    const outline = iFollow || reqPending;

    // Make pending unclickable: if reqPending, button disabled and no-op.
    const onPress = iFollow
      ? () => doUnfollow(idKey)
      : reqPending
        ? () => {
            /* intentionally disabled — pending state is unclickable */
          }
        : () => doFollow(idKey);

    const pendingText = iFollow ? "Removing..." : "Following...";
    const isPendingNow = iFollow
      ? pendingUnfollow.has(idKey)
      : pendingFollow.has(idKey);

    // determine disabled state for follow/unfollow TouchableOpacity
    const buttonDisabled = busy || reqPending;

    // === requested behavior: Message ENABLED only when iFollow === true ===
    const messageDisabled = !iFollow;

    // choose style/text class
    const buttonStyle = reqPending
      ? disabledPendingStyle
      : outline
        ? btnOutline
        : btnFill;
    const textClass = reqPending
      ? disabledPendingText
      : outline
        ? btnTextOutline
        : btnTextFill;

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
          onPress={() => onUserPress?.(u)}>
          <Text
            className="text-[14px] font-semibold text-black"
            numberOfLines={1}>
            {displayName}
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexShrink: 0,
            flexDirection: "row",
            alignItems: "center",
            columnGap: ACTIONS_GAP,
          }}>
          <TouchableOpacity
            onPress={() => (onMessage ? onMessage(u) : onUserPress?.(u))}
            disabled={messageDisabled}
            activeOpacity={0.9}
            style={[btnOutline, { opacity: messageDisabled ? 0.5 : 1 }]}>
            <Text className={btnTextOutline} numberOfLines={1}>
              Message
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPress}
            disabled={buttonDisabled}
            activeOpacity={0.9}
            style={[buttonStyle, { opacity: buttonDisabled ? 0.6 : 1 }]}>
            <Text className={textClass} numberOfLines={1}>
              {isPendingNow ? pendingText : buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* ======================== Debug logging ======================== */
  useEffect(() => {
    console.log("[FFSheet] iFollowSet:", Array.from(iFollowSet));
    console.log("[FFSheet] theyFollowMeSet:", Array.from(theyFollowMeSet));
    console.log("[FFSheet] requestPendingSet:", Array.from(requestPendingSet));
  }, [iFollowSet, theyFollowMeSet, requestPendingSet]);

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
      topInset={0}>
      <BottomSheetView
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 12,
          flex: 1,
        }}>
        <View>
          <View className="flex-row mb-2  px-3">
            <TouchableOpacity
              className={`flex-1 items-center  py-2 ${
                activeTab === "followers" ? "border-b-2 border-black" : ""
              }`}
              onPress={() => goToTab("followers")}>
              <Text
                className={`text-base ${
                  activeTab === "followers"
                    ? "text-black font-semibold"
                    : "text-gray-500"
                }`}>
                Followers ({followersCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 items-center py-2 ${
                activeTab === "following" ? "border-b-2 border-black" : ""
              }`}
              onPress={() => goToTab("following")}>
              <Text
                className={`text-base ${
                  activeTab === "following"
                    ? "text-black font-semibold"
                    : "text-gray-500"
                }`}>
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

        {error ? (
          <View className="flex-1 justify-center items-center py-6">
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
                  (activeTab === "following"
                    ? PAGE_FOLLOWING
                    : PAGE_FOLLOWERS) * pageW,
                y: 0,
              }}
              style={{ flex: 1, marginTop: 8 }}
              decelerationRate="fast"
              disableIntervalMomentum
              scrollEventThrottle={16}>
              <BottomSheetScrollView
                style={{ width: pageW }}
                contentContainerStyle={{
                  paddingBottom: 24,
                  paddingHorizontal: 12,
                }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled>
                {loading ? (
                  <SkeletonList />
                ) : dataFollowers.length === 0 ? (
                  <View className="items-center py-8">
                    <Text className="text-gray-500">No followers found</Text>
                  </View>
                ) : (
                  dataFollowers.map((u) => (
                    <UserRow key={toKey(u.user_id)} u={u} />
                  ))
                )}
              </BottomSheetScrollView>

              <BottomSheetScrollView
                style={{ width: pageW }}
                contentContainerStyle={{
                  paddingBottom: 24,
                  paddingHorizontal: 12,
                }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled>
                {loading ? (
                  <SkeletonList />
                ) : dataFollowing.length === 0 ? (
                  <View className="items-center py-8">
                    <Text className="text-gray-500">No following users</Text>
                  </View>
                ) : (
                  dataFollowing.map((u) => (
                    <UserRow key={toKey(u.user_id)} u={u} />
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
