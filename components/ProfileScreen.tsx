import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import FollowersFollowingSheet from "@/components/FollowersFollowingSheet"; // ⬅️ ADDED
import TextPost from "./TextPost";

// ⬅️ ADDED: api helper
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

// ⬅️ ADDED: lightweight type for users in followers/following lists
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
  onFollow?: (userId: number) => Promise<void>;
  onUnfollow?: (userId: number) => Promise<void>;
  checkFollowStatus?: (userId: number) => Promise<string | null>;
  currentUserId?: number;

  // ⬅️ ADDED (optional): feed data into the sheet without API in this component
  followersData?: FollowUser[];
  followingData?: FollowUser[];
}

/* =========================================================================
   ⬇️ ADDED: Default API implementations (only used if props not provided)
   ========================================================================= */

const defaultFetchUserDetails = async (
  userId: number,
  username?: string
): Promise<UserDetails> => {
  // Try username lookup first if provided; else use userId
  const endpoint = username
    ? `/api/users/profile?username=${encodeURIComponent(username)}`
    : `/api/users/${userId}`;

  const res = await apiCall(endpoint, "GET");

  // Accept both {data:{...}} and flat {...}
  const u = res?.data ?? res;

  // Map to UserDetails with safe fallbacks
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
  // Normalize to array of posts
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
  // Expect {status:"followed"|"pending"|""}
  const status = res?.status ?? res?.data?.status ?? "";
  if (typeof status === "string") return status;
  return null;
};

const defaultOnFollow = async (userId: number): Promise<void> => {
  await apiCall(`/api/follows/follow/${userId}`, "POST");
};

const defaultOnUnfollow = async (userId: number): Promise<void> => {
  await apiCall(`/api/follows/unfollow/${userId}`, "POST");
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
  followersData, // ⬅️ ADDED
  followingData, // ⬅️ ADDED
}: ProfileScreenProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFocused = useIsFocused(); // Track if screen is focused

  // Prevent double navigation on rapid taps. Use a ref so re-renders don't reset it.
  const isNavigatingRef = useRef(false);

  const safePush = (to: any) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      router.push(to);
    } catch (err) {
      console.error("Navigation error:", err);
    }
    // Reset after a short delay — router.push doesn't return a promise in expo-router
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 800);
  };

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
  const [refreshKey, setRefreshKey] = useState(0); // Key to trigger refresh
  // ⬇ add these
  const [ffLoading, setFfLoading] = useState(false);
  const [ffError, setFfError] = useState<string | null>(null);

  // ⬅️ ADDED: state to control the Followers/Following sheet
  const [showFFSheet, setShowFFSheet] = useState(false);
  const [activeFFTab, setActiveFFTab] = useState<"followers" | "following">(
    "followers"
  );
  const [ffKey, setFfKey] = useState(0);

  // ⬅️ ADDED: local state that actually feeds the sheet (no mock fallback)
  const [followersList, setFollowersList] = useState<FollowUser[]>(
    followersData ?? []
  );
  const [followingList, setFollowingList] = useState<FollowUser[]>(
    followingData ?? []
  );

  // ⬅️ ADDED: stable function references (use props if provided, else defaults)
  const fetchUserDetailsFn = fetchUserDetails ?? defaultFetchUserDetails;
  const fetchUserPostsFn = fetchUserPosts ?? defaultFetchUserPosts;
  const fetchUserReelsFn = fetchUserReels ?? defaultFetchUserReels;
  const fetchUserProductsFn = fetchUserProducts ?? defaultFetchUserProducts;
  const checkFollowStatusFn = checkFollowStatus ?? defaultCheckFollowStatus;
  const followFn = onFollow ?? defaultOnFollow;
  const unfollowFn = onUnfollow ?? defaultOnUnfollow;

  // Function to format numbers (e.g., 1000 -> 1k)
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

  // Fetch user details and data
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        let actualUserId = userID;
        const mentionedUsername = propUsername || (params.username as string);

        console.log("ProfileScreen loadUserData:", {
          propUserId,
          propUsername,
          userID,
          actualUserId,
          mentionedUsername,
          currentUserId: currentUserId,
          "params.user": params.user,
          "params.username": params.username,
        });

        // If we have a username but no valid userId was passed, fetch user details first to get the userId
        // This happens when navigating with only username (no userId in params)
        const hasValidUserId = propUserId && propUserId !== currentUserId;
        const needsUserIdResolution =
          mentionedUsername && !hasValidUserId && fetchUserDetailsFn;

        console.log("Resolution check:", {
          hasValidUserId,
          needsUserIdResolution,
        });

        if (needsUserIdResolution) {
          console.log(
            "Fetching user details from username:",
            mentionedUsername
          );
          // We can call defaultFetchUserDetails with username (userId may be undefined)
          const details = await fetchUserDetailsFn(
            actualUserId ?? 0,
            mentionedUsername
          );
          setUserDetails(details);

          // Update the userID state with the fetched user's ID
          if (details.id && details.id !== actualUserId) {
            actualUserId = details.id;
            setUserID(details.id);
            console.log("Updated userID from username fetch:", details.id);
          }
        } else {
          // Fetch user details normally
          if (fetchUserDetailsFn && actualUserId) {
            const details = await fetchUserDetailsFn(
              actualUserId,
              mentionedUsername
            );
            setUserDetails(details);
          } else {
            // Mock data fallback
            setUserDetails({
              id: actualUserId || 0,
              username: mentionedUsername || "john_doe",
              first_name: "John",
              last_name: "Doe",
              bio: "Photography enthusiast • Travel lover • Coffee addict ☕️ ssfsfs sffsfsf sffssfsf sfsfsfs sfsf sfsf sf sf sfsf sfsfsfs sfsf swrwrw wrwrwrwrw wwr wr wwrw wrwrwrrw wr wrwrwr wr wr wqahlskhlfkhashlf hahs ahfslkfh lkfhl akfhslksjhfalksfjh lakshf h afsakhflkfhlskhlak hasf hlakfh. fhashlffhfasl ",
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

        // Now use the actual user ID for all subsequent API calls
        // Only proceed if we have a valid userId
        if (!actualUserId) {
          console.error("No valid userId found");
          return;
        }

        // Fetch user posts
        if (fetchUserPostsFn) {
          const userPosts = await fetchUserPostsFn(actualUserId);
          console.log("Loaded posts:", userPosts.length);
          console.log("Sample post:", userPosts[0]);
          setPosts(userPosts);
        }

        // Fetch user reels
        if (fetchUserReelsFn) {
          const reels = await fetchUserReelsFn(actualUserId);
          setUserReels(reels);
        }

        // Fetch user products
        if (fetchUserProductsFn) {
          const products = await fetchUserProductsFn(actualUserId);
          setProductsAffiliated(products);
        }

        // Check follow status if this is not the current user's profile
        if (checkFollowStatusFn && actualUserId !== currentUserId) {
          const status = await checkFollowStatusFn(actualUserId);
          if (status) {
            setFollowing(status);
          }
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
    refreshKey, // Add refreshKey to dependencies
  ]);

  // Re-fetch data when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      console.log("Profile screen focused - triggering refresh");
      setRefreshKey((prev) => prev + 1);
    }
  }, [isFocused]);

  const toggleFollow = async () => {
    if (!userID) {
      console.error("Cannot toggle follow: userID is undefined");
      return;
    }

    try {
      if (following === "followed") {
        // Unfollow
        await unfollowFn(userID);
        setFollowing("");
      } else {
        // Follow
        await followFn(userID);
        // Some backends return "pending" if private accounts
        // Here we optimistically set to "followed" unless you need to read response
        setFollowing("followed");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  // ⬅️ UPDATED: open Followers/Following sheet and fetch via API
  const handleOpenSheet = async (label: string) => {
    if (userID !== currentUserId || label === "Posts") return;

    const tab = label.toLowerCase() as "followers" | "following";
    setActiveFFTab(tab);
    setShowFFSheet(true);
    setFfLoading(true);
    setFfError(null);
    setActiveFFTab(tab);
    setFfKey((k) => k + 1);
    setShowFFSheet(true);
    try {
      // Expected response from backend:
      // { followers: FollowUser[], following: FollowUser[] }
      const res = await apiCall(
        `/api/follows/followFollowing/${userID}`,
        "GET"
      );

      // Map to the shape our sheet expects (defensive for alternate keys)
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

      // Set lists from API (or []) — no mock fallback here
      setFollowersList(apiFollowers ?? []);
      setFollowingList(apiFollowing ?? []);
    } catch (err) {
      console.error("Failed to fetch follow lists:", err);
      // Keep whatever is already in state; optionally clear:
      // setFollowersList([]);
      // setFollowingList([]);
    } finally {
      setFfLoading(false);
    }
  };

  // ⬅️ ADDED: helper to close and reset sheet data (accept optional bool to match setter signature)
  const closeSheet = (_?: boolean) => {
    setShowFFSheet(false);
    setFollowersList([]);
    setFollowingList([]);
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

    // Filter for posts with images (not text posts) and valid media_url
    const filteredPosts = posts.filter(
      (post) => post.text_post !== true && post.media_url
    );

    console.log("renderGridLayout - Total posts:", posts.length);
    console.log("renderGridLayout - Filtered posts:", filteredPosts.length);
    console.log("renderGridLayout - First post:", posts[0]);

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

    // Calculate responsive dimensions for small screens
    const containerWidth = width - 32; // Account for horizontal padding
    const gap = 4;
    const imageHeight = Math.min(220, containerWidth * 0.6); // Responsive height with max limit

    return (
      <View>
        {Object.entries(groupedImages).map(([date, dateImages]) => (
          <View key={date}>
            <Text className="text-base font-semibold text-gray-900 mb-3">
              {date}
            </Text>
            <View className="w-full">
              {/* Single image - full width */}
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
                  }
                >
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

              {/* Two images - side by side with equal width */}
              {dateImages.length === 2 && (
                <View className="flex-row justify-between">
                  {dateImages.map((image, index) => (
                    <TouchableOpacity
                      key={image.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        width: (containerWidth - gap) / 2,
                        height: imageHeight * 0.8, // Slightly shorter for better proportion
                      }}
                      onPress={() =>
                        safePush({
                          pathname: "/(profiles)/profilePosts",
                          params: {
                            posts: JSON.stringify(posts),
                            focusedIndexPost: image.id,
                          },
                        })
                      }
                    >
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

              {/* Three images - one large on left, two stacked on right */}
              {dateImages.length === 3 && (
                <View className="flex-row" style={{ gap: gap }}>
                  {/* Large image on left */}
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
                    }
                  >
                    <Image
                      source={{ uri: dateImages[0].media_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Two smaller images stacked on right */}
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
                        }
                      >
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

              {/* Four or more images - one large on top, three small below */}
              {dateImages.length >= 4 && (
                <View>
                  {/* Large featured image */}
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
                    }
                  >
                    <Image
                      source={{ uri: dateImages[0].media_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Three images in a row below */}
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
                        }
                      >
                        <Image
                          source={{ uri: image.media_url }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                        {/* Show overlay on last image if there are more */}
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
    // Filter for posts with images (not text posts) and valid media_url
    const filteredPosts = posts.filter(
      (post) => post.text_post !== true && post.media_url
    );

    console.log("renderSquareGrid - Total posts:", posts.length);
    console.log("renderSquareGrid - Filtered posts:", filteredPosts.length);

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

    // Calculate responsive dimensions
    const containerWidth = width - 32; // Account for horizontal padding
    const gap = 2;
    const imageSize = (containerWidth - gap * 2) / 3; // 3 images per row with gaps

    // Group images into rows of 3
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
                }
              >
                <Image
                  source={{ uri: image.media_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}

            {/* Fill remaining space if row has less than 3 images */}
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

    // Calculate responsive dimensions
    const containerWidth = width - 32; // Account for horizontal padding
    const gap = 2;
    const videoWidth = (containerWidth - gap * 2) / 3; // 3 videos per row with gaps
    const videoHeight = videoWidth * 1.5; // 3:2 aspect ratio for videos

    // Group videos into rows of 3
    const rows = [];
    for (let i = 0; i < userReels.length; i += 3) {
      rows.push(userReels.slice(i, i + 3));
    }

    return (
      <View>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            className="flex-row mb-1 gap-1"
            style={{ gap: gap }}
          >
            {row.map((video, videoIndex) => (
              <TouchableOpacity
                key={video.id}
                className="rounded-xl overflow-hidden relative"
                style={{
                  width: videoWidth,
                  height: videoHeight,
                }}
                onPress={() => router.navigate("/(tabs)/posts")}
              >
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

            {/* Fill remaining space if row has less than 3 videos */}
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
            style={{ width: (width - 40) / 2 }}
          >
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
    // Filter for text posts only
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
            Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom, // Tab bar height + extra space
        }}
        nestedScrollEnabled={true}
      >
        {/* Header with Banner - Fixed height */}
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
            style={{ paddingTop: insets.top - 10 }}
          >
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {userID === currentUserId && (
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                onPress={() => safePush("/(settings)")}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Social Media Buttons */}
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
                        }
                      >
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
                        }
                      >
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
                        }
                      >
                        <FontAwesome5 name="youtube" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                </>
              )}
          </View>
        </View>

        {/* Profile Info Section */}
        <View className="px-4 pt-4 bg-gray-100 rounded-t-3xl rounded-t-6 -mt-4">
          <View className="flex-row items-start">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                // Copy profile link functionality
                console.log("Profile link copied");
              }}
            >
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

          {/* Bio Section - Optimized for expansion */}
          <TouchableOpacity
            onPress={() => setBioExpanded(!bioExpanded)}
            className="py-2"
          >
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

          {/* Stats Section */}
          <View className="flex-row justify-around py-1 border-gray-200 mb-1">
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                className="items-center"
                onPress={() => handleOpenSheet(stat.label)}
                disabled={userID !== currentUserId || stat.label === "Posts"}
              >
                <Text className="text-sm font-bold text-gray-900">
                  {kFormatter(stat.value)}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-6">
            {userID === currentUserId ? (
              <>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-full justify-center items-center bg-white mr-2"
                  onPress={() => safePush("/(profiles)/editProfile")}
                >
                  <Text className="text-sm font-semibold text-gray-900">
                    Edit Profile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-full justify-center items-center bg-gray-900 ml-2"
                  onPress={() => safePush("/(profiles)/InviteHome")}
                >
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
                >
                  <Text
                    className={`text-sm font-semibold ${
                      following === "followed" ? "text-gray-900" : "text-white"
                    }`}
                  >
                    {following === "followed"
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

          {/* Content Tabs and Display */}
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
                    onPress={() => setActiveTab(tab)}
                  >
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
            // Private account view
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

      {/* ⬇️ ADDED: Followers / Following Bottom Sheet */}
      <FollowersFollowingSheet
        key={`ff-${activeFFTab}-${showFFSheet ? 1 : 0}`}
        show={showFFSheet}
        setShow={closeSheet}
        followers={followersList}
        followings={followingList}
        enableDemoData={true}
        activeTab={activeFFTab}
        loading={ffLoading} // ⬅️ pass loader state
        error={ffError} // ⬅️ pass error state (sheet shows red text)
        onUserPress={(u) =>
          safePush({
            pathname: "/(profiles)",
            params: { username: u.username },
          })
        }
      />
    </View>
  );
};

export default ProfileScreen;
