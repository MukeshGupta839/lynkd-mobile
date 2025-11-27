import BlockUserPopup from "@/components/BlockUserPopup";
import Chats from "@/components/chat/Chat";
import CommentsSheet, { CommentsSheetHandle } from "@/components/Comment";
import CompleteProfilePopup from "@/components/CompleteProfilePopup";
import { FloatingUploadButton } from "@/components/FloatingUploadButton";
import FeedSkeletonPlaceholder from "@/components/Placeholder/FeedSkeletonPlaceholder";

import { PostCard } from "@/components/PostCard";

import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "@/components/ReportPostBottomSheet";
import { useAuth } from "@/hooks/useAuth";
import {
  clearPostsCache,
  fetchComment,
  fetchMorePosts,
  fetchPostsAPI,
  FetchPostsResponse,
  fetchUserFollowings,
  fetchUserLikedPosts,
  ShareUser,
  shareUserApi,
} from "@/lib/api/api";
import { apiCall } from "@/lib/api/apiService";
import {
  cameraActiveSV,
  registerTabPressHandler,
  tabBarHiddenSV,
  unregisterTabPressHandler,
} from "@/lib/tabBarVisibility";
import { useUploadStore } from "@/stores/useUploadStore";
import { Post } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  ViewToken,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

// ----- PostCard Component is now imported from @/components/PostCard -----

const NotificationBell = ({
  count = 0,
  onPress,
}: {
  count?: number;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="relative w-9 h-9 rounded-full items-center justify-center"
    >
      <Ionicons name="notifications-outline" size={24} color="#000" />

      <View
        className="absolute top-1 right-1 bg-red-600 rounded-full h-4 w-4 px-1
                     items-center justify-center border border-white"
        // If your Tailwind doesn't support min-w, use style={{ minWidth: 16 }}
      >
        {count > 0 ? (
          <Text className="text-white text-[10px] font-bold">
            {/* {count > 99 ? "99+" : count} */}
            {count}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const AnimatedFlatList = Reanimated.createAnimatedComponent(FlatList<Post>);

// ----- Screen -----
export default function ConsumerHomeUI() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const NAV_BAR_CONTENT_HEIGHT = 56;
  const TOP_BAR_HEIGHT = insets.top - 10 + NAV_BAR_CONTENT_HEIGHT;
  const flatListRef = useRef<FlatList>(null);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  // Post options state
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [blockUser, setBlockUser] = useState(false);
  const [focusedPost, setFocusedPost] = useState<any>(null);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  // Camera active state: only mount/start CameraPost when true
  const [cameraActive, setCameraActive] = useState(false);
  const [page, setPage] = useState(2);
  // posts is null while loading to avoid rendering an empty list then
  // re-rendering with data (prevents the double-render flash)
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [likedPostIDs, setLikedPostIDs] = useState<string[]>([]);
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);

  // Mock user data - replace with your actual user context
  // const user = { id: "1", username: "current_user" };

  // Header animation state
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  // Use Reanimated shared value for header translation
  const headerTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const accumulatedScroll = useSharedValue(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentHeaderTranslateValue = useRef(0); // Track current header position
  const [refreshing, setRefreshing] = React.useState(false);

  // Tab bar hiding state
  const [tabBarHidden, setTabBarHidden] = useState(false);

  // Scroll behavior constants
  const SCROLL_THRESHOLD = 20;
  const ANIMATION_DURATION = 200;

  // Header animation functions
  const hideHeader = useCallback(() => {
    setHeaderHidden(true);
    currentHeaderTranslateValue.current = -TOP_BAR_HEIGHT;
    requestAnimationFrame(() => {
      headerTranslateY.value = withTiming(-TOP_BAR_HEIGHT, {
        duration: ANIMATION_DURATION,
      });
    });
  }, [TOP_BAR_HEIGHT, headerTranslateY]);

  const showHeader = useCallback(() => {
    setHeaderHidden(false);
    currentHeaderTranslateValue.current = 0;
    requestAnimationFrame(() => {
      headerTranslateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
      });
    });
  }, [headerTranslateY]);

  // Tab bar animation functions
  const hideTabBar = useCallback(() => {
    setTabBarHidden(true);
    requestAnimationFrame(() => {
      tabBarHiddenSV.value = true;
    });
  }, []);

  const showTabBar = useCallback(() => {
    setTabBarHidden(false);
    requestAnimationFrame(() => {
      tabBarHiddenSV.value = false;
    });
  }, []);

  // Ensure tab bar is visible when component mounts/unmounts
  useEffect(() => {
    // Show tab bar when component mounts
    showTabBar();

    // Reset translateX to center when home tab is opened/focused
    // Use setTimeout to ensure this runs after render
    const timer = setTimeout(() => {
      translateX.value = 0;
    }, 0);

    // Cleanup: show tab bar when component unmounts
    return () => {
      clearTimeout(timer);
      // Defer shared value update to avoid render-time warning
      requestAnimationFrame(() => {
        tabBarHiddenSV.value = false;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFeedScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      const currentY = Math.max(0, event.contentOffset.y);
      const diff = currentY - lastScrollY.value; // The change in this specific frame

      const isHeaderHidden = headerTranslateY.value <= -TOP_BAR_HEIGHT + 0.5;
      const isHeaderVisible = headerTranslateY.value >= -0.5;

      // 1. Elastic Pull / Top of List Logic (Always Show)
      if (currentY <= TOP_BAR_HEIGHT) {
        // If we are at the very top, reset values and show everything
        accumulatedScroll.value = 0;

        if (isHeaderHidden) {
          headerTranslateY.value = -currentY;
        }
        if (currentY <= 0) {
          tabBarHiddenSV.value = false;
        }
      } else {
        // 2. Main Scroll Logic (Accumulation)

        if (diff > 0) {
          // --- SCROLLING DOWN (Finger moving up) ---

          // If we were previously scrolling UP (negative accumulator), reset to 0
          if (accumulatedScroll.value < 0) {
            accumulatedScroll.value = 0;
          }

          // Add this frame's movement to the accumulator
          accumulatedScroll.value += diff;

          // Only trigger HIDE if we have accumulated enough distance
          if (accumulatedScroll.value > SCROLL_THRESHOLD) {
            // Hide Header
            if (isHeaderVisible || headerTranslateY.value > -TOP_BAR_HEIGHT) {
              headerTranslateY.value = withTiming(-TOP_BAR_HEIGHT, {
                duration: ANIMATION_DURATION,
              });
            }
            // Hide Tab Bar
            tabBarHiddenSV.value = true;
          }
        } else if (diff < 0) {
          // --- SCROLLING UP (Finger moving down) ---

          // If we were previously scrolling DOWN (positive accumulator), reset to 0
          if (accumulatedScroll.value > 0) {
            accumulatedScroll.value = 0;
          }

          // Add this frame's movement to the accumulator
          accumulatedScroll.value += diff;

          // Only trigger SHOW if we have accumulated enough distance (negative)
          if (accumulatedScroll.value < -SCROLL_THRESHOLD) {
            // Show Header
            if (isHeaderHidden || headerTranslateY.value < 0) {
              headerTranslateY.value = withTiming(0, {
                duration: ANIMATION_DURATION,
              });
            }
            // Show Tab Bar
            tabBarHiddenSV.value = false;
          }
        }
      }

      lastScrollY.value = currentY;
    },
  });

  // Handle viewable items change to track which posts are visible
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      console.log("Viewable items changed:", viewableItems.length);
      const visiblePostIds = viewableItems
        .map((item) => item.item?.id)
        .filter(Boolean);

      console.log("Visible post IDs:", visiblePostIds);
      setVisibleItems(visiblePostIds);
    },
    []
  );

  // Configure viewability for auto-play (item needs to be at least 60% visible)
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  // Post options helper functions
  const toggleFollow = useCallback(
    async (userId: string) => {
      if (!user?.id || !userId) return;

      const isFollowing = followedUsers.includes(userId);

      // Optimistic update - instant UI response
      setFollowedUsers((prev) =>
        isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
      );

      try {
        Vibration.vibrate(100);
        console.log(
          isFollowing ? "✅ Unfollowing user:" : "✅ Following user:",
          userId
        );

        const endpoint = isFollowing
          ? `/api/follows/unfollow/${user?.id}/${userId}`
          : `/api/follows/follow/${user?.id}/${userId}`;

        await apiCall(endpoint, isFollowing ? "DELETE" : "POST");
        console.log(
          isFollowing ? "✅ Unfollow successful" : "✅ Follow successful"
        );
      } catch (error) {
        console.error(`❌ Error toggling follow for user ${userId}:`, error);
        // Rollback on error
        setFollowedUsers((prev) =>
          isFollowing ? [...prev, userId] : prev.filter((id) => id !== userId)
        );
      }
    },
    [followedUsers, user?.id]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      console.log("deletePost:", postId, !user?.id);
      if (!user?.id) return;

      try {
        Vibration.vibrate(100);
        console.log("🗑️ Deleting post:", postId);

        await apiCall(`/api/posts/${postId}`, "DELETE");

        // Remove from local state (handle null -> treat as empty array)
        setPosts((prevPosts) =>
          (prevPosts ?? []).filter((post) => post.id !== postId)
        );
        setPostOptionsVisible(false);

        console.log("✅ Post deleted successfully");
      } catch (error) {
        console.error("❌ Error deleting post:", error);
      }
    },
    [user?.id]
  );

  const sharePost = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await shareUserApi(user.id);
      console.log("shareUserApi res:", res);
      setShareUsers(res?.data);
    } catch (error) {
      console.error("shareUserApi error:", error);
    }
  }, [user]);

  console.log("shareUsers :", shareUsers);

  useEffect(() => {
    try {
      sharePost();
    } catch (error) {
      console.log("shareUserApi index error:", error);
    }
  }, [sharePost]);

  const handleLongPress = useCallback((item: any) => {
    Vibration.vibrate(100);
    console.log("Long press on post:", item.id);
    setFocusedPost(item);
    setPostOptionsVisible(true);
  }, []);

  // const tabBarHeight = useBottomTabBarHeight();
  // const footerSpacing = tabBarHeight;

  const { width } = Dimensions.get("window");
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  const [commentsPost, setCommentsPost] = useState<any>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [shouldNavigateToChat, setShouldNavigateToChat] = useState(false);

  // ref to control the modal
  const commentsRef = useRef<CommentsSheetHandle>(null);

  console.log("commentsRef: ", commentsRef.current);

  // Fetch comments for a specific post
  const fetchCommentsForPost = useCallback(async (postId: string) => {
    try {
      const response: any = await fetchComment(postId);
      // Transform API response to match CommentItem type
      const commentsData = (response.comments || []).map((comment: any) => ({
        id: comment.id,
        userId: comment.user_id,
        comment: comment.content,
        username: comment.user.username,
        userImage: comment.user.profile_picture,
        time: new Date(comment.created_at).toLocaleDateString(),
        likes: 0, // Add likes if available in your API
      }));
      setPostComments(commentsData);
      console.log("Fetched comments for post:", postId, commentsData);
    } catch (error) {
      console.error("Error fetching comments for post:", postId, error);
      setPostComments([]);
    }
  }, []);

  // open handler passed down to PostCard
  const openComments = useCallback(
    async (post: any) => {
      setCommentsPost(post);
      // Clear previous comments immediately to avoid showing old comments
      setPostComments([]);
      // Fetch comments before presenting the sheet
      await fetchCommentsForPost(post.id);
      commentsRef.current?.present();
    },
    [fetchCommentsForPost]
  );

  // Add comment handler
  const addComment = useCallback(
    async (text: string) => {
      try {
        if (!text || text.trim() === "") return;
        if (!commentsPost?.id) return;
        if (!user?.id) {
          console.warn("Cannot add comment: user is not logged in");
          return;
        }

        const response = await apiCall(`/api/comments/`, "POST", {
          postID: commentsPost.id,
          content: text,
          userID: user.id,
        });

        console.log("Comment added:", response.comment);

        // Refresh comments after adding
        await fetchCommentsForPost(commentsPost.id);
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    },
    [commentsPost, user?.id, fetchCommentsForPost]
  );

  // Handle navigation to chat after gesture completes
  useEffect(() => {
    if (shouldNavigateToChat) {
      router.push("/(tabs)/chat");
      setShouldNavigateToChat(false);
      // Reset translateX to center after navigating to chat
      // This ensures when user comes back to home tab, it's centered
      setTimeout(() => {
        translateX.value = 0;
      }, 100);
    }
  }, [shouldNavigateToChat, router, translateX]);

  // Debug gesture state
  useEffect(() => {
    console.log("isGestureActiveState changed to:", isGestureActiveState);
  }, [isGestureActiveState]);

  // Debug fetching state
  useEffect(() => {
    console.log("📊 isFetchingNextPage changed to:", isFetchingNextPage);
  }, [isFetchingNextPage]);

  // Safety mechanism to reset gesture state if it gets stuck
  useEffect(() => {
    if (isGestureActiveState) {
      const timeout = setTimeout(() => {
        console.log("Safety reset: Force resetting gesture state");
        setIsGestureActiveState(false);
      }, 3000); // Reset after 3 seconds if still active

      return () => clearTimeout(timeout);
    }
  }, [isGestureActiveState]);

  const panGesture = Gesture.Pan()
    .failOffsetY([-15, 15]) // Increased from 10 to 15
    .activeOffsetX(-25) // Only allow left swipe (negative direction), disable right swipe
    .maxPointers(1)
    // .enabled(!cameraActive)
    .onStart(() => {
      startX.value = translateX.value;
      isGestureActive.value = false;
      // Always reset gesture state on start
      // runOnJS(setIsGestureActiveState)(false);
      scheduleOnRN(setIsGestureActiveState, false);
    })
    .onUpdate((e) => {
      const translationX = Number.isFinite(e.translationX) ? e.translationX : 0;
      const currentStartX = Number.isFinite(startX.value) ? startX.value : 0;

      // Mark gesture as active if there's significant movement (increased threshold)
      if (Math.abs(translationX) > 40) {
        // Increased from 20 to 40
        if (!isGestureActive.value) {
          isGestureActive.value = true;
          // runOnJS(setIsGestureActiveState)(true);
          scheduleOnRN(setIsGestureActiveState, true);
          console.log("Gesture became active, blocking touches");
        }
      }

      // Only allow left swipe (negative direction), block right swipe
      const next = Math.max(
        -width,
        Math.min(0, currentStartX + translationX) // Max 0 prevents right swipe
      );
      translateX.value = next;
    })
    .onEnd((e) => {
      const translationX = Number.isFinite(e.translationX) ? e.translationX : 0;
      const vx = Number.isFinite(e.velocityX) ? e.velocityX : 0;
      const currentStartX = Number.isFinite(startX.value) ? startX.value : 0;

      let targetPosition = 0;

      const startedFromCenter = Math.abs(currentStartX) < width * 0.1;
      const startedFromLeft = currentStartX < -width * 0.5; // Chat underlay

      if (startedFromCenter) {
        const swipeThreshold = width * 0.25;
        const velocityThreshold = 500;

        // RIGHT SWIPE DISABLED - only allow left swipe to chat
        if (translationX < -swipeThreshold || vx < -velocityThreshold) {
          // swipe left -> Chat underlay
          targetPosition = -width;
          scheduleOnRN(setShouldNavigateToChat, true);
        } else {
          targetPosition = 0; // stay centered (right swipe disabled)
        }
      } else if (startedFromLeft) {
        // Chat underlay: ONLY allow right-swipe to go back
        const minSwipe = width * 0.12;
        const minVelocity = 250;

        if (translationX > minSwipe || vx > minVelocity) {
          targetPosition = 0; // right swipe -> center
        } else {
          targetPosition = -width; // ignore left swipe -> stay on Chat
        }
      }

      translateX.value = withSpring(targetPosition, {
        damping: 15,
        stiffness: 160,
      });

      // If we ended on the POST underlay (targetPosition === width) then
      // activate the camera; otherwise deactivate it. Set both the React
      // state (for mounting) and the shared value (for UI-thread animations).
      const activate = targetPosition === width;
      cameraActiveSV.value = activate;
      scheduleOnRN(setCameraActive, activate);

      isGestureActive.value = false;
      // runOnJS(setIsGestureActiveState)(false);
      scheduleOnRN(setIsGestureActiveState, false);
    });

  // --- STYLES ---
  const feedStyle = useAnimatedStyle(() => {
    const safeTranslateX = Number.isFinite(translateX.value)
      ? translateX.value
      : 0;
    return {
      transform: [{ translateX: safeTranslateX }],
    };
  });

  const rightUnderlayStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [
          {
            translateX: interpolate(
              safeTranslateX,
              [0, width],
              [-width, 0],
              Extrapolation.CLAMP
            ),
          },
        ],
        opacity: interpolate(
          safeTranslateX,
          [0, width],
          [0, 1],
          Extrapolation.CLAMP
        ),
        zIndex: 0,
      };
    } catch (error) {
      console.warn("Error in rightUnderlayStyle:", error);
      return {
        transform: [{ translateX: -width }],
        opacity: 0,
        zIndex: 0,
      };
    }
  });

  const leftUnderlayStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [
          {
            translateX: interpolate(
              safeTranslateX,
              [-width, 0],
              [0, width],
              Extrapolation.CLAMP
            ),
          },
        ],
        opacity: interpolate(
          safeTranslateX,
          [-width, 0],
          [1, 0],
          Extrapolation.CLAMP
        ),
        zIndex: 0,
      };
    } catch (error) {
      console.warn("Error in leftUnderlayStyle:", error);
      return {
        transform: [{ translateX: width }],
        opacity: 0,
        zIndex: 0,
      };
    }
  });

  const snapToCenter = useCallback(() => {
    // Defer shared value updates to avoid render-time warning
    requestAnimationFrame(() => {
      translateX.value = withSpring(0, { damping: 15, stiffness: 160 });
      tabBarHiddenSV.value = false;
      cameraActiveSV.value = false;
    });
    // ensure camera is deactivated when snapping back to feed
    setCameraActive(false);
  }, [translateX]);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  const toggleLike = useCallback(
    async (postId: string) => {
      const pid = String(postId);
      const isLiked = likedPostIDs.map(String).includes(pid);

      // add vibration
      Vibration.vibrate(100);
      try {
        // Update likedPostIDs state (normalize everything to strings)
        setLikedPostIDs((prev) =>
          isLiked
            ? prev.filter((id) => String(id) !== pid)
            : [...prev.map(String), pid]
        );

        // Update posts state first - compare ids as strings
        setPosts((prevPosts) =>
          (prevPosts ?? []).map((post) =>
            String(post.id) === pid
              ? {
                  ...post,
                  likes_count: post.likes_count + (isLiked ? -1 : 1),
                }
              : post
          )
        );

        const endpoint = isLiked
          ? `/api/likes/${postId}/${user?.id}/unlike`
          : `/api/likes/${postId}/${user?.id}/like`;
        await apiCall(endpoint, "POST");
      } catch (error) {
        console.error(`Error toggling like for post ${postId}:`, error);
        // Revert the changes on error
        setLikedPostIDs((prev) =>
          isLiked
            ? [...prev.map(String), pid]
            : prev.filter((id) => String(id) !== pid)
        );
        setPosts((prevPosts) =>
          (prevPosts ?? []).map((post) =>
            String(post.id) === pid
              ? {
                  ...post,
                  likes_count: post.likes_count + (isLiked ? 1 : -1),
                }
              : post
          )
        );
      }
    },
    [likedPostIDs, user?.id]
  );

  const fetchPosts = useCallback(async (): Promise<void> => {
    try {
      if (!user?.id) return;
      const { userFeed, randomPosts }: FetchPostsResponse = await fetchPostsAPI(
        user.id
      );

      console.log("Response:", userFeed);
      console.log("Response2:", randomPosts);

      if (userFeed.data.length === 0) {
        console.log("No posts found");
        setPosts([]);
      }

      // Combine user feed + random posts (deduplicated)
      const combinedResponse = [
        ...userFeed.data,
        ...randomPosts.data.filter(
          (randPost) =>
            !userFeed.data.some((feedPost) => feedPost.id === randPost.id)
        ),
      ];

      const postsData: Post[] = combinedResponse.map((post) => ({
        id: post.id,
        user_id: post.user_id,
        is_creator: post.user.is_creator,
        caption: post.caption,
        createdAt: post.created_at,
        username: post.user.username,
        userProfilePic: post.user.profile_picture,
        postImage: post.media_url,
        aspect_ratio: post.aspect_ratio,
        affiliated: post.affiliated,
        affiliation: {
          affiliationID: post.PostToPostAffliation?.id,
          brandName: post.PostToPostAffliation?.brand?.brand_name,
          productID: post.PostToPostAffliation?.productID,
          productURL: post.PostToPostAffliation?.productURL,
          productName: post.PostToPostAffliation?.product?.name,
          productImage: post.PostToPostAffliation?.product?.main_image,
          brandLogo: post.PostToPostAffliation?.brand?.brandLogoURL,
          productDescription: post.PostToPostAffliation?.product?.description,
          productRegularPrice:
            post.PostToPostAffliation?.product?.regular_price,
          productSalePrice: post.PostToPostAffliation?.product?.sale_price,
        },
        likes_count: post.likes_aggregate.aggregate.count,
        comments_count: post.comments_aggregate.aggregate.count,
        text_post: post.text_post,
        post_hashtags: post.PostToTagsMultiple.map((tag) => tag.tag.name),
      }));

      console.log("Posts:", JSON.stringify(postsData));
      setPosts(postsData);
      setRefreshing(false);
      setPage(2);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [user?.id]);

  const fetchUserLikedPostsData = useCallback(async () => {
    try {
      if (!user?.id) return;
      const response: any = await fetchUserLikedPosts(user.id);
      console.log("Liked Posts:", response.likedPosts);
      setLikedPostIDs(response.likedPosts || []);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
    fetchUserLikedPostsData();
  }, [fetchPosts, fetchUserLikedPostsData]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    await clearPostsCache(user.id);
    fetchPosts();
    await fetchUserLikedPostsData();
    await fetchUserFollowings(user.id);
  }, [user?.id, fetchPosts, fetchUserLikedPostsData]);

  // Register tab press handlers for scroll to top and refresh
  useEffect(() => {
    const scrollToTop = () => {
      // Show header when scrolling to top
      showHeader();
      showTabBar();
      // On iOS, scroll to negative offset to account for content inset
      const targetOffset = Platform.OS === "ios" ? -TOP_BAR_HEIGHT : 0;
      flatListRef.current?.scrollToOffset({
        offset: targetOffset,
        animated: true,
      });
    };

    const refresh = () => {
      // Show header when refreshing
      showHeader();
      showTabBar();
      // Set refreshing to true to show the loading indicator
      setRefreshing(true);
      // On iOS, scroll to negative offset to account for content inset
      const targetOffset = Platform.OS === "ios" ? -TOP_BAR_HEIGHT : 0;
      flatListRef.current?.scrollToOffset({
        offset: targetOffset,
        animated: true,
      });
      setTimeout(() => {
        onRefresh();
      }, 100);
    };

    registerTabPressHandler("index", { scrollToTop, refresh });

    return () => {
      unregisterTabPressHandler("index");
    };
  }, [onRefresh, TOP_BAR_HEIGHT, showHeader, showTabBar]);

  // Watch for upload completion to refresh feed
  const { shouldRefreshFeed, clearRefreshTriggers } = useUploadStore();
  useEffect(() => {
    if (shouldRefreshFeed) {
      console.log("🔄 Upload complete - refreshing feed");
      onRefresh();
      clearRefreshTriggers();
    }
  }, [shouldRefreshFeed, clearRefreshTriggers, onRefresh]);

  const fetchMorePostsAPI = async () => {
    if (isFetchingNextPage) return; // Prevent multiple simultaneous fetches
    if (!user?.id) return;

    try {
      console.log("🔄 Fetching more posts... Page:", page);
      setIsFetchingNextPage(true);
      const morePosts = await fetchMorePosts(user.id, page);
      console.log("✅ Fetched more posts:", morePosts.data.length, "posts");
      const postsData = morePosts.data.map((post) => {
        console.log("Post Aff", post.PostToPostAffliation);
        return {
          id: post.id,
          user_id: post.user_id,
          caption: post.caption,
          is_creator: post.user.is_creator,
          createdAt: post.created_at,
          username: post.user.username,
          userProfilePic: post.user.profile_picture,
          postImage: post.media_url,
          aspect_ratio: post.aspect_ratio,
          affiliated: post?.affiliated,
          affiliation: {
            affiliationID: post.PostToPostAffliation?.id,
            brandName: post.PostToPostAffliation?.brand?.brand_name,
            productID: post.PostToPostAffliation?.productID,
            productURL: post.PostToPostAffliation?.productURL,
            productName: post.PostToPostAffliation?.product?.name,
            productImage: post.PostToPostAffliation?.product?.main_image,
            brandLogo: post.PostToPostAffliation?.brand?.brandLogoURL,
            productDescription: post.PostToPostAffliation?.product?.description,
            productRegularPrice:
              post.PostToPostAffliation?.product?.regular_price,
            productSalePrice: post.PostToPostAffliation?.product?.sale_price,
          },
          likes_count: post.likes_aggregate.aggregate.count,
          comments_count: post.comments_aggregate.aggregate.count,
          text_post: post.text_post,
          post_hashtags: post.PostToTagsMultiple.map((tag) => {
            return tag.tag.name;
          }),
        };
      });
      // setPosts([...posts, ...postsData]);
      // check for duplicates
      // posts may be null while initial load hasn't completed; treat as []
      const existing = posts ?? [];
      const combinedResponse = [
        ...existing,
        ...postsData.filter(
          (item) => !existing.some((item2) => item.id === item2.id)
        ),
      ];
      setPosts(combinedResponse);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching more posts:", error);
    } finally {
      setIsFetchingNextPage(false);
    }
  };

  console.log("posts state:", posts);
  console.log("auth user:", user);

  // If user is not loaded or is null, show loading screen
  // This prevents errors when user logs out
  if (!user || !user.id) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-gray-500 text-base">Loading...</Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View style={{ flex: 1 }}>
        <StatusBar
          backgroundColor="transparent"
          style="dark"
          translucent={Platform.OS === "android"}
        />
        {/* UNDERLAYS — rendered first so they sit behind the feed */}
        {/* <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            rightUnderlayStyle,
            { zIndex: 3 },
          ]}
          pointerEvents="auto"
        >
          <CameraPost onBackToFeed={snapToCenter} active={cameraActive} />
        </Reanimated.View> */}

        <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            leftUnderlayStyle,
          ]}
          pointerEvents="auto"
        >
          {/* Chats screen */}
          <Chats />
        </Reanimated.View>

        {/* FEED ON TOP */}
        <Reanimated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2,
            },
            feedStyle,
          ]}
          pointerEvents="auto"
        >
          <View className="flex-1 bg-[#F3F4F8]">
            {/* Top bar */}
            <Reanimated.View
              className="absolute top-0 right-0 left-0 z-10 bg-white overflow-hidden"
              style={[
                {
                  height: TOP_BAR_HEIGHT,
                },
                headerAnimatedStyle,
              ]}
            >
              <View
                style={{
                  paddingTop: insets.top - 10,
                  backgroundColor: "white",
                }}
              >
                <View
                  style={{
                    height: NAV_BAR_CONTENT_HEIGHT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 12,
                  }}
                >
                  <Text className="text-2xl font-bold">LYNKD</Text>
                  <View className="flex-row items-center space-x-3">
                    <TouchableOpacity
                      className="w-9 h-9 rounded-full items-center justify-center"
                      onPress={() => {
                        router.push("/(search)");
                      }}
                    >
                      <Ionicons name="search-outline" size={24} color="#000" />
                    </TouchableOpacity>
                    <NotificationBell
                      count={0}
                      onPress={() => {
                        router.push("/(notifications)");
                      }}
                    />
                  </View>
                </View>
              </View>
            </Reanimated.View>

            {/* Feed list */}
            {posts === null ? (
              // Still loading initial posts: show skeleton placeholders
              <View
                style={{
                  paddingTop: TOP_BAR_HEIGHT,
                  paddingBottom:
                    Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
                  backgroundColor: "#F3F4F8",
                }}
              >
                <FeedSkeletonPlaceholder />
                <FeedSkeletonPlaceholder />
              </View>
            ) : (
              <AnimatedFlatList
                ref={flatListRef}
                data={posts}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                scrollEventThrottle={16}
                onScroll={onFeedScroll}
                onEndReached={() => {
                  console.log("📍 onEndReached triggered");
                  fetchMorePostsAPI();
                }}
                contentContainerStyle={{
                  paddingTop: Platform.OS === "android" ? TOP_BAR_HEIGHT : 0,
                  paddingBottom:
                    Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
                  backgroundColor: "#F3F4F8",
                }}
                contentInset={
                  Platform.OS === "ios" ? { top: TOP_BAR_HEIGHT } : undefined
                }
                contentOffset={
                  Platform.OS === "ios"
                    ? { x: 0, y: -TOP_BAR_HEIGHT }
                    : undefined
                }
                // iOS-specific behaviour to keep the refresh spinner visible
                contentInsetAdjustmentBehavior={
                  Platform.OS === "ios" ? "never" : undefined
                }
                bounces={true}
                alwaysBounceVertical={true}
                style={{ backgroundColor: "#F3F4F8" }}
                ListHeaderComponent={
                  user && (!user.username || !user.profile_picture) ? (
                    // ||
                    // !user.bio ||
                    // !user.first_name ||
                    // !user.last_name
                    <CompleteProfilePopup user={user} />
                  ) : null
                }
                renderItem={({ item }) => (
                  <PostCard
                    item={item}
                    isVisible={visibleItems.includes(item.id)}
                    onLongPress={handleLongPress}
                    isGestureActive={isGestureActiveState}
                    panGesture={panGesture}
                    onPressComments={openComments}
                    toggleLike={toggleLike}
                    likedPostIDs={likedPostIDs}
                    shareUsers={shareUsers}
                  />
                )}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setPage(2);
                      onRefresh();
                    }}
                    colors={["#4D70D1"]}
                    tintColor={"#4D70D1"}
                    progressBackgroundColor={"#F3F4F8"}
                    // On iOS we offset the progress so the spinner appears below
                    // the header; on Android the value is used as a fallback.
                    progressViewOffset={
                      Platform.OS === "ios"
                        ? TOP_BAR_HEIGHT + 8
                        : TOP_BAR_HEIGHT
                    }
                  />
                }
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                removeClippedSubviews
                maxToRenderPerBatch={2}
                windowSize={3}
                initialNumToRender={2}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View
                      style={{
                        paddingBottom: Platform.OS === "android" ? 20 : 0,
                      }}
                    >
                      <FeedSkeletonPlaceholder />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <>
                    <FeedSkeletonPlaceholder />
                    <FeedSkeletonPlaceholder />
                  </>
                }
              />
            )}

            {/* Bottom sheets / popups */}
            <PostOptionsBottomSheet
              show={postOptionsVisible}
              setShow={setPostOptionsVisible}
              setBlockUser={setBlockUser}
              setReportVisible={setReportVisible}
              setFocusedPost={setFocusedPost}
              toggleFollow={() => toggleFollow(focusedPost?.user_id || "")}
              isFollowing={followedUsers.includes(focusedPost?.user_id || "")}
              focusedPost={focusedPost}
              deleteAction={deletePost}
              user={user}
            />

            <CommentsSheet
              key={commentsPost?.id} // Force re-render when post changes
              ref={commentsRef}
              snapPoints={["40%", "85%"]}
              comments={postComments}
              postId={commentsPost?.id}
              onFetchComments={fetchCommentsForPost}
              onSendComment={addComment}
            />

            <ReportPostBottomSheet
              show={reportVisible}
              setShow={setReportVisible}
              postId={focusedPost?.id || ""}
              userId={user?.id || ""}
            />

            <BlockUserPopup
              show={blockUser}
              setShow={setBlockUser}
              post={focusedPost}
            />
          </View>
        </Reanimated.View>
        {/* Floating post button - stays visible above tab bar and moves with it */}
        <Reanimated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            zIndex: 20,
          }}
        >
          {/* Animated container to move the button up/down when tab bar hides/shows */}
          <FloatingUploadButton insets={insets} />
        </Reanimated.View>
      </Reanimated.View>
    </GestureDetector>
  );
}
