import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

// Icons
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";

// Components
import FeedSkeletonPlaceholder from "@/components/Placeholder/FeedSkeletonPlaceholder";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { fetchComment, fetchUserLikedPosts } from "@/lib/api/api";
import { apiCall } from "@/lib/api/apiService";
import BlockUserPopup from "../../components/BlockUserPopup";
import CommentsSheet, { CommentsSheetHandle } from "../../components/Comment";
import PostOptionsBottomSheet from "../../components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "../../components/ReportPostBottomSheet";

interface Post {
  id: number;
  user_id: number;
  caption?: string;
  created_at: string;
  username: string;
  userProfilePic?: string;
  media_url?: string;
  postImage?: string;
  aspect_ratio?: number;
  affiliated?: boolean;
  affiliation?: any;
  likes_count?: number;
  comments_count?: number;
  text_post: boolean;
  post_hashtags?: string[];
}

interface RegularPostCardProps {
  item: Post;
  likedPostIDs: string[];
  toggleLike: (postId: string) => void;
  commentBox: (post: Post) => void;
  handleShare: () => void;
  setFocusedPostID: (id: string) => void;
  setPostOptionsVisible: (visible: boolean) => void;
  router: any;
}

// Memoized PostCard component to prevent unnecessary re-renders
const RegularPostCard = React.memo<RegularPostCardProps>(
  ({
    item,
    likedPostIDs,
    toggleLike,
    commentBox,
    handleShare,
    setFocusedPostID,
    setPostOptionsVisible,
    router,
  }) => {
    const [showFullCaption, setShowFullCaption] = useState(false);

    const getHashtagsWithinLimit = useCallback(
      (hashtags: string[], limit = 50) => {
        let totalLength = 0;
        if (!hashtags) return [];

        return hashtags.filter((tag) => {
          totalLength += tag.length + 1; // +1 for the # symbol
          return totalLength <= limit;
        });
      },
      []
    );

    const neededHashtags = useMemo(
      () => getHashtagsWithinLimit(item.post_hashtags || []),
      [item.post_hashtags, getHashtagsWithinLimit]
    );

    const openPostOptions = useCallback(() => {
      Vibration.vibrate(100);
      setFocusedPostID(String(item.id));
      setPostOptionsVisible(true);
    }, [item.id, setFocusedPostID, setPostOptionsVisible]);

    // Double tap logic for like/unlike
    const lastTapRef = useRef<number>(0);
    type Timer = ReturnType<typeof setTimeout>;
    const singleTimerRef = useRef<Timer | null>(null);
    const DOUBLE_DELAY = 260; // ms
    const doubleTapLockRef = useRef(false);

    const armDoubleTapLock = useCallback(() => {
      doubleTapLockRef.current = true;
      setTimeout(() => {
        doubleTapLockRef.current = false;
      }, 360); // > DOUBLE_DELAY window
    }, []);

    const handleDoubleTapLike = useCallback(() => {
      toggleLike(String(item.id));
    }, [item.id, toggleLike]);

    // Handle tap for profile and media (double tap to like)
    const handleTap = useCallback(
      (singleAction: () => void, doubleTapAction: () => void) => {
        const now = Date.now();
        const delta = now - (lastTapRef.current || 0);
        lastTapRef.current = now;

        if (singleTimerRef.current) {
          clearTimeout(singleTimerRef.current);
          singleTimerRef.current = null;
        }

        if (delta < DOUBLE_DELAY) {
          // DOUBLE TAP → like/unlike + lock out single action
          doubleTapAction();
          armDoubleTapLock();
          return;
        }

        // SINGLE TAP → perform single action after delay
        singleTimerRef.current = setTimeout(() => {
          singleTimerRef.current = null;
          if (!doubleTapLockRef.current) singleAction();
        }, DOUBLE_DELAY + 10);
      },
      [armDoubleTapLock]
    );

    const makeTapGesture = useCallback(
      (onTap: () => void) =>
        Gesture.Tap()
          .numberOfTaps(1)
          .maxDelay(DOUBLE_DELAY + 40)
          .onEnd((_e: unknown, success: boolean) => {
            "worklet";
            if (success) scheduleOnRN(onTap);
          }),
      []
    );

    const onProfileTap = useCallback(
      () => handleTap(() => { }, handleDoubleTapLike),
      [handleTap, handleDoubleTapLike]
    );

    const onMediaTap = useCallback(
      () => handleTap(() => { }, handleDoubleTapLike),
      [handleTap, handleDoubleTapLike]
    );

    const profileTapGesture = useMemo(
      () => makeTapGesture(onProfileTap),
      [makeTapGesture, onProfileTap]
    );
    const mediaTapGesture = useMemo(
      () => makeTapGesture(onMediaTap),
      [makeTapGesture, onMediaTap]
    );

    // Get profile picture with fallback logic
    const getProfilePicture = useCallback((post: Post) => {
      if (post.userProfilePic) {
        return post.userProfilePic;
      }
      // Fallback based on username or default
      return "https://randomuser.me/api/portraits/men/1.jpg";
    }, []);

    const profilePic = useMemo(
      () => getProfilePicture(item),
      [getProfilePicture, item]
    );

    return (
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={openPostOptions}
        delayLongPress={500}
      >
        <View className="bg-gray-100">
          <View
            style={{
              borderRadius: 16,
              elevation: Platform.OS === "android" ? 2 : 0,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
            }}
          >
            <View
              className="bg-white py-3 gap-2.5"
              style={{
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <View className="flex-row px-3 items-center h-10">
                <GestureDetector gesture={profileTapGesture}>
                  <TouchableOpacity
                    className="flex-row items-center flex-1 mr-2"
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri: profilePic,
                      }}
                      className="w-10 h-10 rounded-full mr-2"
                    />
                    <View>
                      <View className="flex-row items-center">
                        <Text className="font-semibold text-lg">
                          {item.username}
                        </Text>
                        {item.user_id === 1 && (
                          <Octicons
                            name="verified"
                            size={14}
                            color="#000"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </GestureDetector>
              </View>

              {/* Media Display */}
              <GestureDetector gesture={mediaTapGesture}>
                <TouchableOpacity
                  activeOpacity={1}
                  onLongPress={openPostOptions}
                  delayLongPress={500}
                  className="w-full h-80"
                >
                  <Image
                    source={{ uri: item.media_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </GestureDetector>

              {/* Caption */}
              {item.caption && (
                <View>
                  {(() => {
                    const caption = item.caption || "";
                    const captionLimit = 150;
                    const shouldTruncate = caption.length > captionLimit;
                    const displayCaption =
                      shouldTruncate && !showFullCaption
                        ? caption.substring(0, captionLimit)
                        : caption;

                    return (
                      <View>
                        <Text className="text-sm px-3 text-gray-900">
                          {displayCaption
                            .split(/((?:@|#)[\w.]+|(?:https?:\/\/|www\.)\S+)/gi)
                            .map((part: string, index: number) => {
                              if (part && part.startsWith("@")) {
                                return (
                                  <Text
                                    key={index}
                                    className="text-blue-600"
                                    suppressHighlighting
                                    onPress={() =>
                                      router.push(
                                        `/(profiles)?mentionedUsername=${part.slice(1)}`
                                      )
                                    }
                                    onLongPress={openPostOptions}
                                  >
                                    {part}
                                  </Text>
                                );
                              } else if (part && part.startsWith("#")) {
                                return (
                                  <Text
                                    key={index}
                                    className="text-blue-600"
                                    suppressHighlighting
                                    onPress={() =>
                                      console.log("Navigate to hashtag:", part)
                                    }
                                    onLongPress={openPostOptions}
                                  >
                                    {part}
                                  </Text>
                                );
                              } else if (
                                part &&
                                /^(https?:\/\/|www\.)/i.test(part)
                              ) {
                                const url = part.startsWith("www.")
                                  ? `https://${part}`
                                  : part;
                                return (
                                  <Text
                                    key={index}
                                    className="text-blue-600 underline"
                                    suppressHighlighting
                                    onPress={() => Linking.openURL(url)}
                                    onLongPress={openPostOptions}
                                  >
                                    {part}
                                  </Text>
                                );
                              }
                              return part;
                            })}
                        </Text>
                        {shouldTruncate && !showFullCaption && (
                          <Pressable
                            onPress={() => setShowFullCaption(true)}
                            hitSlop={8}
                            style={{
                              marginLeft: 2,
                              alignSelf: "baseline",
                            }}
                            onLongPress={openPostOptions}
                            delayLongPress={500}
                          >
                            <Text className="text-sm text-gray-500 px-3 font-medium">
                              Show more
                            </Text>
                          </Pressable>
                        )}

                        {shouldTruncate && showFullCaption && (
                          <Pressable
                            onPress={() => setShowFullCaption(false)}
                            hitSlop={8}
                            style={{
                              marginLeft: 2,
                              alignSelf: "baseline",
                            }}
                            onLongPress={openPostOptions}
                            delayLongPress={500}
                          >
                            <Text className="text-sm text-gray-500 px-3 font-medium">
                              Show less
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })()}
                  {item?.post_hashtags?.length ? (
                    <Text className="text-blue-600 mt-1 px-3">
                      {neededHashtags.map((tag: string, i: number) => (
                        <Text
                          key={tag}
                          onPress={() =>
                            console.log("Navigate to hashtag:", "#" + tag)
                          }
                        >
                          #{tag}
                          {i < neededHashtags.length - 1 ? " " : ""}
                        </Text>
                      ))}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Affiliation */}
              {item.affiliated && item.affiliation && (
                <TouchableOpacity
                  className="px-3"
                  onLongPress={openPostOptions}
                  delayLongPress={500}
                >
                  <View className="flex-row gap-x-3 rounded-lg border border-gray-200">
                    <View
                      className="basis-1/4 self-stretch relative"
                      style={{
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{
                          uri: item.affiliation.productImage,
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                        }}
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1 justify-between p-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row flex-1 items-center">
                          <Image
                            source={{
                              uri: item.affiliation.brandLogo,
                            }}
                            className="w-11 h-11 rounded-full mr-2"
                            resizeMode="contain"
                          />
                          <View className="flex-1">
                            <Text className="font-semibold text-sm text-gray-800">
                              {item.affiliation.brandName}
                            </Text>
                            <Text className="font-medium text-sm text-black">
                              {item.affiliation.productName}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity className="self-start">
                          <MaterialIcons
                            name="add-shopping-cart"
                            size={24}
                            color="#707070"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-sm text-gray-600 mb-2 leading-4">
                        {item.affiliation.productDescription}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-400 line-through mr-2">
                          ₹{item.affiliation.productRegularPrice}
                        </Text>
                        <Text className="text-sm font-bold text-green-600">
                          ₹{item.affiliation.productSalePrice}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Actions */}
              <View className="flex-row items-center justify-between px-3">
                <View className="flex-row items-center gap-x-4">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => toggleLike(String(item.id))}
                  >
                    <Ionicons
                      name={
                        likedPostIDs.includes(String(item.id))
                          ? "heart"
                          : "heart-outline"
                      }
                      size={20}
                      color={
                        likedPostIDs.includes(String(item.id))
                          ? "#CE395F"
                          : "#000"
                      }
                    />
                    <Text className="ml-1 text-sm font-medium">
                      {item.likes_count || 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => commentBox(item)}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color="#000"
                    />
                    <Text className="ml-1 text-sm font-medium">
                      {item.comments_count || 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare}>
                    <Ionicons
                      name="arrow-redo-outline"
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  // Custom comparison function to prevent re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.likes_count === nextProps.item.likes_count &&
      prevProps.item.comments_count === nextProps.item.comments_count &&
      prevProps.likedPostIDs.includes(String(prevProps.item.id)) ===
      nextProps.likedPostIDs.includes(String(nextProps.item.id))
    );
  }
);

RegularPostCard.displayName = "RegularPostCard";

export default function ProfilePosts() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const postsParam = typeof params.posts === "string" ? params.posts : "";
  const focusParam =
    params.focusedIndexPost != null ? Number(params.focusedIndexPost) : null;
  const showOnlyPostParam = params.showOnlyPost ? String(params.showOnlyPost) : null;

  const [reportVisible, setReportVisible] = useState(false);
  const [blockUser, setBlockUser] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [focusedPostID, setFocusedPostID] = useState<string | null>(null);
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [likedPostIDs, setLikedPostIDs] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsPost, setCommentsPost] = useState<any>(null);
  const [postComments, setPostComments] = useState<any[]>([]);

  const flatListRef = useRef<FlatList<Post>>(null);
  const commentsRef = useRef<CommentsSheetHandle>(null);

  // Visibility / gesture helpers used by PostCard
  const [visibleItems, setVisibleItems] = useState<string[]>([]);
  const panGesture = Gesture.Pan();

  const handleLongPress = useCallback(
    (item: any) => {
      Vibration.vibrate(100);
      setFocusedPostID(String(item.id));
      setPostOptionsVisible(true);
    },
    [setPostOptionsVisible]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const visiblePostIds = (viewableItems || []).map((v: any) => v.item.id);
    setVisibleItems(visiblePostIds);
  }).current;

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    []
  );

  // Fetch user's liked posts to initialize the liked state
  const fetchUserLikedPostsData = useCallback(async () => {
    try {
      if (!user?.id) return;
      const response: any = await fetchUserLikedPosts(user.id);
      console.log("📋 Fetched liked posts:", response.likedPosts);
      // Set the liked post IDs as strings
      const likedIds = (response.likedPosts || []).map(String);
      setLikedPostIDs(likedIds);
    } catch (error) {
      console.error("❌ Error fetching liked posts:", error);
    }
  }, [user?.id]);

  // Fetch liked posts on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserLikedPostsData();
    }
  }, [fetchUserLikedPostsData, user?.id]);

  // Fetch single post for notifications
  const fetchSinglePost = useCallback(async (postId: string) => {
    try {
      const response = await apiCall(`/api/posts/${postId}`, "GET");
      console.log("Single Post:", response.data);

      const formattedPost: Post = {
        id: response.data.id,
        user_id: response.data.user_id,
        caption: response.data.caption,
        created_at: response.data.created_at,
        username: response.data.user.username,
        userProfilePic: response.data.user.profile_picture,
        postImage: response.data.media_url,
        media_url: response.data.media_url,
        aspect_ratio: response.data.aspect_ratio,
        affiliated: response.data?.affiliated,
        affiliation: {
          affiliationID: response.data.PostToPostAffliation?.id,
          brandName: response.data.PostToPostAffliation?.brand?.brand_name,
          productID: response.data.PostToPostAffliation?.productID,
          productURL: response.data.PostToPostAffliation?.productURL,
          productName: response.data.PostToPostAffliation?.product?.name,
          productImage: response.data.PostToPostAffliation?.product?.main_image,
          brandLogo: response.data.PostToPostAffliation?.brand?.brandLogoURL,
          productDescription:
            response.data.PostToPostAffliation?.product?.description,
          productRegularPrice:
            response.data.PostToPostAffliation?.product?.regular_price,
          productSalePrice:
            response.data.PostToPostAffliation?.product?.sale_price,
        },
        likes_count: response.data.likes_aggregate?.aggregate?.count || 0,
        comments_count: response.data.comments_aggregate?.aggregate?.count || 0,
        text_post: response.data.text_post,
        post_hashtags: response.data.PostToTagsMultiple?.map((tag: any) => {
          return tag.tag.name;
        }),
      };

      setPosts([formattedPost]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching single post:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If showOnlyPost param exists, fetch only that post
    if (showOnlyPostParam) {
      setLoading(true);
      fetchSinglePost(showOnlyPostParam);
      return;
    }

    // Otherwise, parse posts from params
    if (!postsParam) {
      setLoading(false);
      return;
    }

    try {
      const parsed: Post[] = JSON.parse(postsParam);

      if (focusParam != null) {
        const idx = parsed.findIndex((p) => p.id === focusParam);
        if (idx > -1) {
          const next = [...parsed];
          const [f] = next.splice(idx, 1);
          setPosts([f, ...next]);
        } else {
          setPosts(parsed);
        }
      } else {
        setPosts(parsed);
      }
    } catch (e) {
      console.error("Error parsing posts:", e);
    }
    setLoading(false);
  }, [postsParam, focusParam, showOnlyPostParam, fetchSinglePost]);

  const focusedPost = useMemo(
    () => posts.find((p) => p.id === Number(focusedPostID)) ?? null,
    [posts, focusedPostID]
  );

  // Create setFocusedPost function that works with the current architecture
  const setFocusedPost = useCallback((post: Post | null) => {
    if (post) {
      setFocusedPostID(String(post.id));
    } else {
      setFocusedPostID(null);
    }
  }, []);

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
          ? `/api/follows/unfollow/${user.id}/${userId}`
          : `/api/follows/follow/${user.id}/${userId}`;

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

  const toggleLike = useCallback(
    async (postId: string) => {
      const pid = String(postId);
      const isLiked = likedPostIDs.includes(pid);
      setFocusedPostID(pid);
      Vibration.vibrate(100);

      try {
        // Optimistic update - Update likedPostIDs state immediately
        setLikedPostIDs((prev) =>
          isLiked ? prev.filter((id) => id !== pid) : [...prev, pid]
        );

        // Update posts state immediately
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === Number(pid)
              ? {
                ...post,
                likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1),
              }
              : post
          )
        );

        // Make API call
        const endpoint = isLiked
          ? `/api/likes/${pid}/${user?.id}/unlike`
          : `/api/likes/${pid}/${user?.id}/like`;
        await apiCall(endpoint, "POST");

        console.log(isLiked ? "✅ Unlike successful" : "✅ Like successful");
      } catch (error) {
        console.error(`❌ Error toggling like for post ${pid}:`, error);
        // Rollback on error
        setLikedPostIDs((prev) =>
          isLiked ? [...prev, pid] : prev.filter((id) => id !== pid)
        );
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === Number(pid)
              ? {
                ...post,
                likes_count: (post.likes_count || 0) + (isLiked ? 1 : -1),
              }
              : post
          )
        );
      }
    },
    [likedPostIDs, user?.id]
  );

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

  // open handler for comments
  const openComments = useCallback(
    async (post: any) => {
      setCommentsPost(post);
      // Clear previous comments immediately to avoid showing old comments
      setPostComments([]);
      // Fetch comments before presenting the sheet
      await fetchCommentsForPost(String(post.id));
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

        console.log("✅ Comment added:", response.comment);

        // Update the comment count in the posts state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === commentsPost.id
              ? {
                ...post,
                comments_count: (post.comments_count || 0) + 1,
              }
              : post
          )
        );

        // Refresh comments after adding
        await fetchCommentsForPost(String(commentsPost.id));
      } catch (error) {
        console.error("❌ Error adding comment:", error);
      }
    },
    [commentsPost, user?.id, fetchCommentsForPost]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!user?.id) return;

      try {
        Vibration.vibrate(100);
        console.log("🗑️ Deleting post:", postId);

        await apiCall(`/api/posts/${postId}`, "DELETE");

        // Remove from local state
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== Number(postId))
        );
        setPostOptionsVisible(false);

        console.log("✅ Post deleted successfully");
      } catch (error) {
        console.error("❌ Error deleting post:", error);
      }
    },
    [user?.id]
  );

  // Memoized callbacks to prevent re-renders
  const handleToggleFollow = useCallback(() => {
    if (focusedPost?.user_id) {
      toggleFollow(String(focusedPost.user_id));
    }
  }, [focusedPost?.user_id, toggleFollow]);

  const isUserFollowing = useMemo(() => {
    return focusedPost?.user_id
      ? followedUsers.includes(String(focusedPost.user_id))
      : false;
  }, [followedUsers, focusedPost?.user_id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4"
        style={{ paddingTop: insets.top - 10 }}
      >
        <TouchableOpacity
          className="w-9 h-9 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">Posts</Text>

        <View className="w-9 h-9" />
      </View>

      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={posts}
          nestedScrollEnabled={true}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              isVisible={visibleItems.includes(String(item.id))}
              onLongPress={handleLongPress}
              panGesture={panGesture}
              onPressComments={openComments}
              toggleLike={toggleLike}
              likedPostIDs={likedPostIDs}
              profilePostsMode={true}
            />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            });
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom:
              Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
            backgroundColor: "#F3F4F8",
          }}
          ListEmptyComponent={
            <>
              <FeedSkeletonPlaceholder />
              <FeedSkeletonPlaceholder />
            </>
          }
        />
      </View>

      {/* Modals */}
      <ReportPostBottomSheet
        show={reportVisible}
        setShow={setReportVisible}
        postId={focusedPostID || ""}
        userId={user?.id}
      />

      <BlockUserPopup
        show={blockUser}
        setShow={setBlockUser}
        post={focusedPost || undefined}
      />

      <PostOptionsBottomSheet
        show={postOptionsVisible}
        setShow={setPostOptionsVisible}
        setBlockUser={setBlockUser}
        setReportVisible={setReportVisible}
        setFocusedPost={setFocusedPost}
        toggleFollow={handleToggleFollow}
        isFollowing={isUserFollowing}
        focusedPost={focusedPost}
        deleteAction={deletePost}
        user={user}
      />

      {/* CommentsSheet with double tap support */}
      <CommentsSheet
        ref={commentsRef}
        title="Comments"
        comments={postComments}
        onSendComment={addComment}
        currentUserAvatar={user?.profile_picture || ""}
      />
    </View>
  );
}
