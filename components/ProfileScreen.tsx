// ProfileScreen.tsx
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

// Components
import FollowersFollowingSheet from "@/components/FollowersFollowingSheet";
import TextPost from "./TextPost";

// api helper
import { apiCall } from "@/lib/api/apiService";

const { width } = Dimensions.get("window");

interface UserDetails {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  banner_image?: string;
  is_creator: boolean;
  postsCount: number;
  reelsCount: number;
  followersCount: number;
  followingCount: number;
  social_media_accounts?: {
    instagram_username?: string;
    twitter_username?: string;
    youtube_username?: string;
  }[];
}

type FollowUser = {
  user_id: number | string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_creator?: boolean;
  profile_picture?: string;
};

interface ProfileScreenProps {
  userId?: number;
  username?: string;
  fetchUserDetails?: (
    userId: number,
    username?: string
  ) => Promise<UserDetails>;
  fetchUserPosts?: (userId: number) => Promise<any[]>;
  fetchUserReels?: (userId: number) => Promise<any[]>;
  fetchUserProducts?: (userId: number) => Promise<any[]>;
  onFollow?: (userId: number) => Promise<any>;
  onUnfollow?: (userId: number) => Promise<any>;
  checkFollowStatus?: (userId: number) => Promise<string | null>;
  currentUserId?: number;
  followersData?: FollowUser[];
  followingData?: FollowUser[];
}

/* =========================================================================
   Default API implementations (only used if props not provided)
   ========================================================================= */

const defaultFetchUserDetails = async (
  userId: number,
  username?: string
): Promise<UserDetails> => {
  const endpoint = username
    ? `/api/users/profile?username=${encodeURIComponent(username)}`
    : `/api/users/${userId}`;

  const res = await apiCall(endpoint, "GET");
  const u = res?.data ?? res;

  const details: UserDetails = {
    id: Number(u?.id ?? userId),
    username: String(u?.username ?? username ?? ""),
    first_name: u?.first_name ?? u?.firstName ?? "",
    last_name: u?.last_name ?? u?.lastName ?? "",
    bio: u?.bio ?? "",
    profile_picture: u?.profile_picture ?? u?.photoURL ?? "",
    banner_image: u?.banner_image ?? u?.bannerURL ?? "",
    is_creator: !!(u?.is_creator ?? u?.verified ?? false),
    postsCount: Number(u?.postsCount ?? u?.posts_count ?? 0),
    reelsCount: Number(u?.reelsCount ?? u?.reels_count ?? 0),
    followersCount: Number(u?.followersCount ?? u?.followers_count ?? 0),
    followingCount: Number(u?.followingCount ?? u?.following_count ?? 0),
    social_media_accounts: u?.social_media_accounts ?? [
      {
        instagram_username: u?.instagram_username ?? "",
        twitter_username: u?.twitter_username ?? "",
        youtube_username: u?.youtube_username ?? "",
      },
    ],
  };

  return details;
};

const defaultFetchUserPosts = async (userId: number): Promise<any[]> => {
  const res = await apiCall(`/api/posts/user/${userId}`, "GET");
  const data = res?.data ?? res ?? [];
  return Array.isArray(data) ? data : [];
};

const defaultFetchUserReels = async (userId: number): Promise<any[]> => {
  const res = await apiCall(`/api/reels/user/${userId}`, "GET");
  const data = res?.data ?? res ?? [];
  return Array.isArray(data) ? data : [];
};

const defaultFetchUserProducts = async (userId: number): Promise<any[]> => {
  const res = await apiCall(`/api/products/user/${userId}`, "GET");
  const data = res?.data ?? res ?? [];
  return Array.isArray(data) ? data : [];
};

const defaultCheckFollowStatus = async (
  userId: number
): Promise<string | null> => {
  const res = await apiCall(`/api/follows/status/${userId}`, "GET");
  const status = res?.status ?? res?.data?.status ?? "";
  if (typeof status === "string") return status;
  return null;
};

const defaultOnFollow = async (userId: number): Promise<any> => {
  return apiCall(`/api/follows/follow/${userId}`, "POST");
};

const defaultOnUnfollow = async (userId: number): Promise<any> => {
  return apiCall(`/api/follows/unfollow/${userId}`, "POST");
};

const ProfileScreen = ({
  userId: propUserId,
  username: propUsername,
  fetchUserDetails,
  fetchUserPosts,
  fetchUserReels,
  fetchUserProducts,
  onFollow,
  onUnfollow,
  checkFollowStatus,
  currentUserId,
  followersData,
  followingData,
}: ProfileScreenProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();

  const isNavigatingRef = useRef(false);

  const safePush = useCallback(
    (to: any) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      try {
        router.push(to);
      } catch (err) {
        console.error("Navigation error:", err);
      }
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 800);
    },
    [router]
  );

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [userReels, setUserReels] = useState<any[]>([]);
  const [productsAffiliated, setProductsAffiliated] = useState<any[]>([]);
  const [userID, setUserID] = useState<number | undefined>(
    propUserId ||
      (params.user
        ? Number(Array.isArray(params.user) ? params.user[0] : params.user) ||
          currentUserId
        : currentUserId)
  );
  const [following, setFollowing] = useState("");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ffLoading, setFfLoading] = useState(false);
  const [ffError, setFfError] = useState<string | null>(null);

  // NEW: prevent duplicate follow/unfollow taps for header follow button
  const [followLoading, setFollowLoading] = useState(false);

  // sheet state
  const [showFFSheet, setShowFFSheet] = useState(false);
  const [activeFFTab, setActiveFFTab] = useState<"followers" | "following">(
    "followers"
  );
  const [ffKey, setFfKey] = useState(0);

  // local lists
  const [followersList, setFollowersList] = useState<FollowUser[]>(
    followersData ?? []
  );
  const [followingList, setFollowingList] = useState<FollowUser[]>(
    followingData ?? []
  );

  // per-item busy map
  const [ffBusyMap, setFfBusyMap] = useState<Record<string, boolean>>({});

  const setBusy = useCallback((id: string | number, v: boolean) => {
    setFfBusyMap((m) => ({ ...m, [String(id)]: v }));
  }, []);

  const fetchUserDetailsFn = fetchUserDetails ?? defaultFetchUserDetails;
  const fetchUserPostsFn = fetchUserPosts ?? defaultFetchUserPosts;
  const fetchUserReelsFn = fetchUserReels ?? defaultFetchUserReels;
  const fetchUserProductsFn = fetchUserProducts ?? defaultFetchUserProducts;
  const checkFollowStatusFn = checkFollowStatus ?? defaultCheckFollowStatus;
  const followFn = onFollow ?? defaultOnFollow;
  const unfollowFn = onUnfollow ?? defaultOnUnfollow;

  const kFormatter = (num: number): string => {
    if (Math.abs(num) > 999999999) {
      return (Math.sign(num) * (Math.abs(num) / 1000000000)).toFixed(1) + "B";
    } else if (Math.abs(num) > 999999) {
      return (Math.sign(num) * (Math.abs(num) / 1000000)).toFixed(1) + "M";
    } else if (Math.abs(num) > 999) {
      return (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + "K";
    } else {
      return (Math.sign(num) * Math.abs(num)).toString();
    }
  };

  // helper to close and reset sheet data
  const closeSheet = (_?: boolean) => {
    setShowFFSheet(false);
    setFollowersList([]);
    setFollowingList([]);
  };

  const toUser = (u: any): FollowUser => ({
    user_id: String(u?.user_id ?? u?.id ?? u?.userId ?? ""),
    username: u?.username ?? "",
    first_name: u?.first_name ?? u?.firstName ?? "",
    last_name: u?.last_name ?? u?.lastName ?? "",
    is_creator: !!(u?.is_creator ?? u?.verified),
    profile_picture: u?.profile_picture ?? u?.photoURL ?? "",
  });

  const refreshFollowLists = async (targetUserId?: number) => {
    if (!targetUserId) return;
    setFfLoading(true);
    setFfError(null);

    try {
      const res = await apiCall(
        `/api/follows/followFollowing/${targetUserId}`,
        "GET"
      );
      const payload = res?.data ?? res ?? {};

      const apiFollowers: FollowUser[] = Array.isArray(payload?.followers)
        ? payload.followers.map(toUser)
        : [];

      const apiFollowing: FollowUser[] = Array.isArray(payload?.following)
        ? payload.following.map(toUser)
        : [];

      setFollowersList(apiFollowers);
      setFollowingList(apiFollowing);
    } catch (err: any) {
      console.error("Failed to refresh follow lists:", err);
      const status = err?.response?.status;
      setFfError(
        status === 404
          ? `Follow lists not found (404).`
          : `Failed to load followers/following data`
      );
    } finally {
      setFfLoading(false);
    }
  };

  // declare handleUserPress after closeSheet to avoid TS error
  const handleUserPress = useCallback(
    (u: FollowUser) => {
      closeSheet();

      setTimeout(() => {
        safePush({
          pathname: "/(profiles)",
          params: { username: u.username },
        });
      }, 60);
    },
    [closeSheet, safePush]
  );

  /**
   * Optimistic follow:
   * - Add target to followingList locally (if appropriate)
   * - Set per-item busy flag
   * - Call API
   * - On error rollback; on success optionally merge canonical data
   */
  const handleFollow = useCallback(
    async (id: string | number) => {
      if (!userID) return;
      const key = String(id);

      if (ffBusyMap[key]) return;
      setBusy(key, true);

      // Build optimistic user (if you already render item from UI, this will be short-lived)
      const optimisticUser: FollowUser = {
        user_id: key,
        username: `user_${key}`,
        profile_picture: "",
      };

      // Add to followingList optimistically
      setFollowingList((cur) => {
        if (cur.some((u) => String(u.user_id) === key)) return cur;
        return [optimisticUser, ...cur];
      });

      // Update local count optimistically
      setUserDetails((d) =>
        d ? { ...d, followingCount: (d.followingCount || 0) + 1 } : d
      );

      try {
        const res = await followFn(Number(id));
        // If server returns canonical user details, merge them
        const serverUser =
          res?.data?.user ??
          res?.user ??
          (res && typeof res === "object" && res.username ? res : null);

        if (serverUser && serverUser.id) {
          // replace optimistic entry with canonical server user if present
          setFollowingList((cur) =>
            cur.map((u) =>
              String(u.user_id) === key
                ? toUser({ user_id: serverUser.id, ...serverUser })
                : u
            )
          );
        }
        // If server returned status 'pending' you might want to update following state
        // But we keep sheet-specific lists as-is (server canonicalization handled above)
      } catch (e) {
        console.error("follow failed, rolling back:", e);
        // rollback
        setFollowingList((cur) => cur.filter((u) => String(u.user_id) !== key));
        setUserDetails((d) =>
          d
            ? { ...d, followingCount: Math.max((d.followingCount || 1) - 1, 0) }
            : d
        );
        // Optionally call refreshFollowLists(userID) here if you want full reconcilation
      } finally {
        setBusy(key, false);
      }
    },
    [followFn, userID, ffBusyMap, setBusy]
  );

  /**
   * Optimistic unfollow:
   * - Remove from followingList immediately
   * - Set per-item busy
   * - Call API
   * - On error re-insert or call refreshFollowLists
   */
  const handleUnfollow = useCallback(
    async (id: string | number) => {
      if (!userID) return;
      const key = String(id);

      if (ffBusyMap[key]) return;
      setBusy(key, true);

      let removedUser: FollowUser | null = null;
      setFollowingList((cur) => {
        const idx = cur.findIndex((u) => String(u.user_id) === key);
        if (idx === -1) return cur;
        removedUser = cur[idx];
        return cur.filter((u) => String(u.user_id) !== key);
      });

      // update counts optimistically
      setUserDetails((d) =>
        d
          ? { ...d, followingCount: Math.max((d.followingCount || 1) - 1, 0) }
          : d
      );

      try {
        const res = await unfollowFn(Number(id));
        // if server indicates "already removed" treat as success; otherwise OK
        // optionally re-sync authoritative lists:
        // await refreshFollowLists(userID);
        // setFfKey(k => k + 1);
      } catch (e: any) {
        console.error("unfollow failed, rolling back or reconciling:", e);
        const errMsg = String(e?.message ?? "").toLowerCase();
        const serverMsg = String(
          e?.response?.data?.message ?? ""
        ).toLowerCase();
        const statusCode = e?.response?.status;
        const alreadyGone =
          errMsg.includes("not following") ||
          errMsg.includes("user was not following") ||
          serverMsg.includes("not following") ||
          serverMsg.includes("not found") ||
          (statusCode && [404, 410].includes(statusCode));

        if (alreadyGone) {
          // treat as success: ensure authoritative re-sync to reflect server
          await refreshFollowLists(userID);
          setFfKey((k) => k + 1);
        } else {
          // rollback optimistic removal
          if (removedUser) {
            setFollowingList((cur) => [removedUser!, ...cur]);
          } else {
            await refreshFollowLists(userID);
          }
          // rollback counts
          setUserDetails((d) =>
            d ? { ...d, followingCount: (d.followingCount || 0) + 1 } : d
          );
        }
      } finally {
        setBusy(key, false);
      }
    },
    [unfollowFn, userID, ffBusyMap, setBusy]
  );

  const handleMessage = useCallback(
    (u: FollowUser) => {
      router.push({
        pathname: "/chat/UserChatScreen",
        params: {
          userId: String(u.user_id),
          username: u.username ?? "User",
          profilePicture:
            u.profile_picture ?? "https://www.gravatar.com/avatar/?d=mp",
          loggedUserId: String(currentUserId ?? ""),
          loggedUsername: userDetails?.username ?? "",
        },
      });
    },
    [router, currentUserId, userDetails?.username]
  );

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        let actualUserId = userID;
        const mentionedUsername = propUsername || (params.username as string);

        const hasValidUserId = propUserId && propUserId !== currentUserId;
        const needsUserIdResolution =
          mentionedUsername && !hasValidUserId && fetchUserDetailsFn;

        if (needsUserIdResolution) {
          const details = await fetchUserDetailsFn(
            actualUserId ?? 0,
            mentionedUsername
          );
          setUserDetails(details);

          if (details.id && details.id !== actualUserId) {
            actualUserId = details.id;
            setUserID(details.id);
          }
        } else {
          if (fetchUserDetailsFn && actualUserId) {
            const details = await fetchUserDetailsFn(
              actualUserId,
              mentionedUsername
            );
            setUserDetails(details);
          } else {
            setUserDetails({
              id: actualUserId || 0,
              username: mentionedUsername || "john_doe",
              first_name: "John",
              last_name: "Doe",
              bio: "Photography enthusiast • Travel lover • Coffee addict ☕️",
              profile_picture: "https://randomuser.me/api/portraits/men/1.jpg",
              banner_image:
                "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
              is_creator: true,
              postsCount: 12,
              reelsCount: 5,
              followersCount: 1250,
              followingCount: 890,
              social_media_accounts: [
                {
                  instagram_username: "john_doe_photo",
                  twitter_username: "johndoe",
                  youtube_username: "johndoevlogs",
                },
              ],
            });
          }
        }

        if (!actualUserId) {
          console.error("No valid userId found");
          return;
        }

        if (fetchUserPostsFn) {
          const userPosts = await fetchUserPostsFn(actualUserId);
          setPosts(userPosts);
        }

        if (fetchUserReelsFn) {
          const reels = await fetchUserReelsFn(actualUserId);
          setUserReels(reels);
        }

        if (fetchUserProductsFn) {
          const products = await fetchUserProductsFn(actualUserId);
          setProductsAffiliated(products);
        }

        if (checkFollowStatusFn && actualUserId !== currentUserId) {
          const status = await checkFollowStatusFn(actualUserId);
          if (status) {
            setFollowing(status);
          } else {
            setFollowing("");
          }
        } else {
          setFollowing("");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [
    propUserId,
    propUsername,
    params.username,
    fetchUserDetailsFn,
    fetchUserPostsFn,
    fetchUserReelsFn,
    fetchUserProductsFn,
    checkFollowStatusFn,
    userID,
    params.user,
    currentUserId,
    refreshKey,
  ]);

  useEffect(() => {
    if (isFocused) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [isFocused]);

  const toggleFollow = async () => {
    if (!userID) {
      console.error("Cannot toggle follow: userID is undefined");
      return;
    }

    if (followLoading) return;
    setFollowLoading(true);

    try {
      if (following === "followed") {
        const res: any = await unfollowFn(userID as number);
        const status =
          res?.status ??
          res?.data?.status ??
          (typeof res === "string" ? res : "");
        if (status === "pending" || status === "followed") {
          setFollowing(status === "followed" ? "followed" : "pending");
        } else {
          setFollowing("");
        }
        if (userID) await refreshFollowLists(userID);
      } else {
        const res: any = await followFn(userID as number);
        const status =
          res?.status ??
          res?.data?.status ??
          (typeof res === "string" ? res : "") ??
          "";
        if (status === "pending" || status === "followed") {
          setFollowing(status);
        } else {
          try {
            const check = await checkFollowStatusFn(userID);
            setFollowing(check ?? "");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (err) {
            setFollowing("followed");
          }
        }
        if (userID) await refreshFollowLists(userID);
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      try {
        const check = await checkFollowStatusFn(userID);
        setFollowing(check ?? "");
      } catch (err) {
        console.error("Failed to re-check follow status after error:", err);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenSheet = async (label: string) => {
    if (userID !== currentUserId || label === "Posts") return;

    const tab = label.toLowerCase() as "followers" | "following";

    setShowFFSheet(true);
    setActiveFFTab(tab);
    setFfLoading(true);
    setFfError(null);
    setFollowersList([]);
    setFollowingList([]);

    try {
      const res = await apiCall(
        `/api/follows/followFollowing/${userID}`,
        "GET"
      );

      const apiFollowers: FollowUser[] =
        res?.followers?.map((u: any) => ({
          user_id: u.user_id ?? u.id ?? u.userId,
          username: u.username,
          first_name: u.first_name ?? u.firstName,
          last_name: u.last_name ?? u.lastName,
          is_creator: !!(u.is_creator ?? u.verified),
          profile_picture: u.profile_picture ?? u.photoURL,
        })) ?? [];

      const apiFollowing: FollowUser[] =
        res?.following?.map((u: any) => ({
          user_id: u.user_id ?? u.id ?? u.userId,
          username: u.username,
          first_name: u.first_name ?? u.firstName,
          last_name: u.last_name ?? u.lastName,
          is_creator: !!(u.is_creator ?? u.verified),
          profile_picture: u.profile_picture ?? u.photoURL,
        })) ?? [];

      setFollowersList(apiFollowers);
      setFollowingList(apiFollowing);
    } catch (err) {
      console.error("Failed to fetch follow lists:", err);
      setFfError("Failed to load followers/following data");
    } finally {
      setFfLoading(false);
    }
  };

  const stats = [
    {
      label: "Posts",
      value: (userDetails?.postsCount || 0) + (userDetails?.reelsCount || 0),
    },
    { label: "Followers", value: userDetails?.followersCount || 0 },
    { label: "Following", value: userDetails?.followingCount || 0 },
  ];

  const tabs = userDetails?.is_creator
    ? ["All", "Photos", "Videos", "Notes", " "]
    : ["All", "Photos", "Videos", "Notes"];

  const renderGridLayout = () => {
    const groupedImages: { [key: string]: any[] } = {};
    const months: string[] = [];

    const filteredPosts = posts.filter(
      (post) => post.text_post !== true && post.media_url
    );

    if (filteredPosts.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Feather name="image" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No posts yet. Content shared will appear here.
          </Text>
        </View>
      );
    }

    filteredPosts.forEach((image) => {
      const month = new Date(image.created_at).toLocaleString("default", {
        month: "long",
      });
      const year = new Date(image.created_at).getFullYear();
      const key = month + " " + year;

      if (!groupedImages[key]) {
        groupedImages[key] = [];
        months.push(key);
      }
      groupedImages[key].push(image);
    });

    const containerWidth = width - 32;
    const gap = 4;
    const imageHeight = Math.min(220, containerWidth * 0.6);

    return (
      <View>
        {Object.entries(groupedImages).map(([date, dateImages]) => (
          <View key={date}>
            <Text className="text-base font-semibold text-gray-900 mb-3">
              {date}
            </Text>
            <View className="w-full">
              {dateImages.length === 1 && (
                <TouchableOpacity
                  className="w-full rounded-xl overflow-hidden"
                  style={{ height: imageHeight }}
                  onPress={() =>
                    safePush({
                      pathname: "/(profiles)/profilePosts",
                      params: {
                        posts: JSON.stringify(posts),
                        focusedIndexPost: dateImages[0].id,
                      },
                    })
                  }>
                  <Image
                    source={{ uri: dateImages[0].media_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                    onError={(error) => {
                      console.log(
                        "renderGridLayout image load error:",
                        error.nativeEvent.error
                      );
                    }}
                    onLoad={() => {
                      console.log("renderGridLayout image loaded successfully");
                    }}
                  />
                </TouchableOpacity>
              )}

              {dateImages.length === 2 && (
                <View className="flex-row justify-between">
                  {dateImages.map((image, index) => (
                    <TouchableOpacity
                      key={image.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        width: (containerWidth - gap) / 2,
                        height: imageHeight * 0.8,
                      }}
                      onPress={() =>
                        safePush({
                          pathname: "/(profiles)/profilePosts",
                          params: {
                            posts: JSON.stringify(posts),
                            focusedIndexPost: image.id,
                          },
                        })
                      }>
                      <Image
                        source={{ uri: image.media_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={(error) => {
                          console.log(
                            "renderGridLayout image load error:",
                            error.nativeEvent.error
                          );
                        }}
                        onLoad={() => {
                          console.log(
                            "renderGridLayout image loaded successfully"
                          );
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {dateImages.length === 3 && (
                <View className="flex-row" style={{ gap: gap }}>
                  <TouchableOpacity
                    className="rounded-xl overflow-hidden"
                    style={{
                      width: (containerWidth - gap) * 0.6,
                      height: imageHeight,
                    }}
                    onPress={() =>
                      safePush({
                        pathname: "/(profiles)/profilePosts",
                        params: {
                          posts: JSON.stringify(posts),
                          focusedIndexPost: dateImages[0].id,
                        },
                      })
                    }>
                    <Image
                      source={{ uri: dateImages[0].media_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  <View className="flex-1" style={{ gap: gap }}>
                    {dateImages.slice(1, 3).map((image) => (
                      <TouchableOpacity
                        key={image.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          height: (imageHeight - gap) / 2,
                        }}
                        onPress={() =>
                          safePush({
                            pathname: "/(profiles)/profilePosts",
                            params: {
                              posts: JSON.stringify(posts),
                              focusedIndexPost: image.id,
                            },
                          })
                        }>
                        <Image
                          source={{ uri: image.media_url }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {dateImages.length >= 4 && (
                <View>
                  <TouchableOpacity
                    className="w-full rounded-xl overflow-hidden mb-1"
                    style={{ height: imageHeight }}
                    onPress={() =>
                      safePush({
                        pathname: "/(profiles)/profilePosts",
                        params: {
                          posts: JSON.stringify(posts),
                          focusedIndexPost: dateImages[0].id,
                        },
                      })
                    }>
                    <Image
                      source={{ uri: dateImages[0].media_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  <View className="flex-row justify-between">
                    {dateImages.slice(1, 4).map((image, index) => (
                      <TouchableOpacity
                        key={image.id}
                        className="rounded-xl overflow-hidden relative"
                        style={{
                          width: (containerWidth - gap * 2) / 3,
                          height: (containerWidth - gap * 2) / 3,
                        }}
                        onPress={() =>
                          safePush({
                            pathname: "/(profiles)/profilePosts",
                            params: {
                              posts: JSON.stringify(posts),
                              focusedIndexPost: image.id,
                            },
                          })
                        }>
                        <Image
                          source={{ uri: image.media_url }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                        {index === 2 && dateImages.length > 4 && (
                          <View className="absolute inset-0 bg-black/60 justify-center items-center">
                            <Text className="text-white text-lg font-bold">
                              +{dateImages.length - 4}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSquareGrid = () => {
    const filteredPosts = posts.filter(
      (post) => post.text_post !== true && post.media_url
    );

    if (filteredPosts.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Feather name="image" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No photos yet. Photos shared will appear here.
          </Text>
        </View>
      );
    }

    const containerWidth = width - 32;
    const gap = 2;
    const imageSize = (containerWidth - gap * 2) / 3;

    const rows = [];
    for (let i = 0; i < filteredPosts.length; i += 3) {
      rows.push(filteredPosts.slice(i, i + 3));
    }

    return (
      <View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row mb-1" style={{ gap: gap }}>
            {row.map((image, imageIndex) => (
              <TouchableOpacity
                key={image.id}
                className="rounded-xl overflow-hidden"
                style={{
                  width: imageSize,
                  height: imageSize,
                }}
                onPress={() =>
                  safePush({
                    pathname: "/(profiles)/profilePosts",
                    params: {
                      posts: JSON.stringify(posts),
                      focusedIndexPost: image.id,
                    },
                  })
                }>
                <Image
                  source={{ uri: image.media_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}

            {row.length < 3 && (
              <View
                style={{
                  flex: 3 - row.length,
                  minWidth:
                    imageSize * (3 - row.length) + gap * (3 - row.length - 1),
                }}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderVideosGrid = () => {
    if (userReels.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Feather name="video" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No videos yet. Videos shared will appear here.
          </Text>
        </View>
      );
    }

    const containerWidth = width - 32;
    const gap = 2;
    const videoWidth = (containerWidth - gap * 2) / 3;
    const videoHeight = videoWidth * 1.5;

    const rows = [];
    for (let i = 0; i < userReels.length; i += 3) {
      rows.push(userReels.slice(i, i + 3));
    }

    return (
      <View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row mb-1 gap-1" style={{ gap }}>
            {row.map((video, videoIndex) => (
              <TouchableOpacity
                key={video.id}
                className="rounded-xl overflow-hidden relative"
                style={{
                  width: videoWidth,
                  height: videoHeight,
                }}
                onPress={() => {
                  const clickedIndex = userReels.findIndex(
                    (r) => r.id === video.id
                  );

                  safePush({
                    pathname: "/(profiles)/userReels",
                    params: {
                      userReelsData: JSON.stringify(userReels),
                      initialIndex:
                        clickedIndex >= 0 ? clickedIndex.toString() : "0",
                      username: userDetails?.username || "",
                    },
                  });
                }}>
                <Image
                  source={{ uri: video.thumbnail_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute bottom-2 left-2 flex-row items-center bg-black/50 px-2 py-1 rounded-xl">
                  <Feather name="play" size={16} color="#fff" />
                  <Text className="text-white text-xs ml-1">
                    {kFormatter(video?.reels_views_aggregate.aggregate.count)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {row.length < 3 && (
              <View
                style={{
                  flex: 3 - row.length,
                  minWidth:
                    videoWidth * (3 - row.length) + gap * (3 - row.length - 1),
                }}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderProductGrid = () => {
    if (productsAffiliated.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <SimpleLineIcons name="handbag" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No affiliated products yet.
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-row flex-wrap justify-between">
        {productsAffiliated.map((product) => (
          <TouchableOpacity
            key={product.id}
            className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-200"
            style={{ width: (width - 40) / 2 }}>
            <Image
              source={{ uri: product.main_image }}
              className="w-full h-40"
              resizeMode="cover"
            />
            <View className="p-2">
              <Text className="text-sm font-medium text-gray-900">
                {product.name.length > 15
                  ? product.name.slice(0, 15) + "..."
                  : product.name}
              </Text>
              <Text className="text-sm font-semibold text-gray-900 mt-1">
                ₹{product.sale_price}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTextPosts = () => {
    const filteredPosts = posts.filter((post) => post.text_post === true);

    if (filteredPosts.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Foundation name="text-color" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No notes yet. Notes shared will appear here.
          </Text>
        </View>
      );
    }
    return (
      <View className="gap-2">
        {filteredPosts.map((item) => (
          <TextPost
            key={item.id}
            item={item}
            onPress={() =>
              safePush({
                pathname: "/(profiles)/profilePosts",
                params: {
                  posts: JSON.stringify(posts),
                  focusedIndexPost: item.id,
                },
              })
            }
            likedPosts={[]}
            likedPostIDs={[]}
            handleShare={() => {}}
            toggleLike={() => {}}
            commentBox={() => {}}
            toggleFollow={() => {}}
            followedUsers={[]}
            setFocusedPostID={() => {}}
            hideActions={true}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-base text-gray-600 text-center">
          Failed to load user profile
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom:
            Platform.OS === "ios" ? insets.bottom + 45 : insets.bottom + 55,
        }}
        nestedScrollEnabled={true}>
        <View className="relative h-52">
          <Image
            source={{
              uri:
                userDetails.banner_image ||
                "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg?semt=ais_hybrid",
            }}
            className="w-full h-full"
            resizeMode="cover"
            onError={(error) => {
              console.log("Banner image load error:", error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log("Banner image loaded successfully");
            }}
          />

          <View
            className="absolute inset-0 flex-row justify-between px-4"
            style={{ paddingTop: insets.top - 10 }}>
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
              onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {userID === currentUserId && (
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                onPress={() => safePush("/(settings)")}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row absolute bottom-9 right-4 gap-2">
            {userDetails?.social_media_accounts &&
              userDetails.social_media_accounts.length > 0 && (
                <>
                  {userDetails.social_media_accounts[0]?.instagram_username &&
                    userDetails.social_media_accounts[0].instagram_username
                      .length > 2 && (
                      <TouchableOpacity
                        className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                        onPress={() =>
                          Linking.openURL(
                            `https://instagram.com/${userDetails.social_media_accounts![0].instagram_username}`
                          )
                        }>
                        <FontAwesome5 name="instagram" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  {userDetails.social_media_accounts[0]?.twitter_username &&
                    userDetails.social_media_accounts[0].twitter_username
                      .length > 2 && (
                      <TouchableOpacity
                        className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                        onPress={() =>
                          Linking.openURL(
                            `https://twitter.com/${userDetails.social_media_accounts![0].twitter_username}`
                          )
                        }>
                        <FontAwesome5 name="twitter" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  {userDetails.social_media_accounts[0]?.youtube_username &&
                    userDetails.social_media_accounts[0].youtube_username
                      .length > 2 && (
                      <TouchableOpacity
                        className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                        onPress={() =>
                          Linking.openURL(
                            `https://youtube.com/${userDetails.social_media_accounts![0].youtube_username}`
                          )
                        }>
                        <FontAwesome5 name="youtube" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                </>
              )}
          </View>
        </View>

        <View className="px-4 pt-4 bg-gray-100 rounded-t-3xl rounded-t-6 -mt-4">
          <View className="flex-row items-start">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                console.log("Profile link copied");
              }}>
              <Image
                source={{
                  uri:
                    userDetails.profile_picture ||
                    "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=",
                }}
                className="w-24 h-24 rounded-full border-4 border-white -mt-12"
              />
            </TouchableOpacity>

            <View className="ml-2 flex-1">
              <View className="mb-1 -mt-3">
                {(userDetails?.first_name || userDetails?.last_name) && (
                  <Text className="text-lg font-bold text-gray-900">
                    {(
                      (userDetails?.first_name || "") +
                      " " +
                      (userDetails?.last_name || "")
                    ).trim()}
                  </Text>
                )}
                <View className="flex-row items-center">
                  <Text className="text-base text-gray-600">
                    @{userDetails.username}
                  </Text>
                  {userDetails.is_creator && (
                    <Octicons
                      name="verified"
                      size={16}
                      color="#1a1a1a"
                      className="ml-1"
                    />
                  )}
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setBioExpanded(!bioExpanded)}
            className="py-2">
            {userDetails?.bio && (
              <Text className="text-base text-gray-700 leading-5">
                {bioExpanded
                  ? userDetails?.bio
                  : userDetails?.bio?.length > 100
                    ? userDetails?.bio?.slice(0, 90).trim() + "..."
                    : userDetails?.bio?.trim()}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-around py-1 border-gray-200 mb-1">
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                className="items-center"
                onPress={() => handleOpenSheet(stat.label)}
                disabled={userID !== currentUserId || stat.label === "Posts"}>
                <Text className="text-sm font-bold text-gray-900">
                  {kFormatter(stat.value)}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between mb-6">
            {userID === currentUserId ? (
              <>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-full justify-center items-center bg-white mr-2"
                  onPress={() => safePush("/(profiles)/editProfile")}>
                  <Text className="text-sm font-semibold text-gray-900">
                    Edit Profile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-full justify-center items-center bg-gray-900 ml-2"
                  onPress={() => safePush("/(profiles)/InviteHome")}>
                  <Text className="text-sm font-semibold text-white">
                    Invite
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  className={`flex-1 h-10 rounded-full justify-center items-center ${
                    following === "followed" ? "bg-white" : "bg-gray-900"
                  }`}
                  onPress={toggleFollow}
                  disabled={followLoading}>
                  <Text
                    className={`text-sm font-semibold ${
                      following === "followed" ? "text-gray-900" : "text-white"
                    }`}>
                    {followLoading
                      ? "Requesting..."
                      : following === "followed"
                        ? "Following"
                        : following === "pending"
                          ? "Requested"
                          : "Follow"}
                  </Text>
                </TouchableOpacity>

                {following === "followed" && (
                  <TouchableOpacity className="flex-1 h-10 rounded-full justify-center items-center bg-white ml-2">
                    <Text className="text-sm font-semibold text-gray-900">
                      Message
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {userDetails.is_creator ||
          following === "followed" ||
          userDetails.id === currentUserId ? (
            <>
              <View className="flex-row justify-between mb-4">
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    className={`w-12 h-12 rounded-full justify-center items-center ${
                      activeTab === tab ? "bg-gray-900" : "bg-white"
                    }`}
                    onPress={() => setActiveTab(tab)}>
                    {tab === "All" && (
                      <FontAwesome
                        name="snowflake-o"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === "Photos" && (
                      <Foundation
                        name="photo"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === "Videos" && (
                      <Foundation
                        name="play-video"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === "Notes" && (
                      <Foundation
                        name="text-color"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === " " && (
                      <SimpleLineIcons
                        name="handbag"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View>
                {activeTab === "All" && renderGridLayout()}
                {activeTab === "Photos" && renderSquareGrid()}
                {activeTab === "Videos" && renderVideosGrid()}
                {activeTab === "Notes" && renderTextPosts()}
                {activeTab === " " && renderProductGrid()}
              </View>
            </>
          ) : (
            <View className="items-center justify-center py-12">
              <View className="w-16 h-16 rounded-full bg-white justify-center items-center mb-4">
                <Ionicons name="lock-closed" size={24} color="#1a1a1a" />
              </View>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                This Account is Private
              </Text>
              <Text className="text-sm text-gray-600 text-center max-w-4/5">
                Follow this account to see their photos and videos
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FollowersFollowingSheet
        show={showFFSheet}
        setShow={closeSheet}
        followers={followersList}
        followings={followingList}
        enableDemoData
        activeTab={activeFFTab}
        loading={ffLoading}
        error={ffError}
        onUserPress={(u: FollowUser) => {
          closeSheet();
          setTimeout(() => {
            safePush({
              pathname: "/(profiles)",
              params: { username: u.username },
            });
          }, 60);
        }}
        onFollow={(id: string | number) => handleFollow(id)}
        onUnfollow={(id: string | number) => handleUnfollow(id)}
        onMessage={(u: FollowUser) => {
          closeSheet();
          setTimeout(() => {
            handleMessage(u);
          }, 60);
        }}
      />
    </View>
  );
};

export default ProfileScreen;
