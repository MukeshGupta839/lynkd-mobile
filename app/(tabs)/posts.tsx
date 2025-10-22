/* eslint-disable react-hooks/exhaustive-deps */
// app/(tabs)/posts.tsx
/// <reference types="react" />
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import { USERS as CREATION_USERS } from "@/constants/PostCreation";
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView, type VideoPlayer } from "expo-video";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Reanimated, {
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Send from "../../assets/posts/send.svg";

// ✅ Added: import the comments sheet component + handle
import CommentsSheet, { CommentsSheetHandle } from "@/components/Comment";
// ✅ Added: Share bottom sheet (for Send button)
import ShareSectionBottomSheet from "@/components/ShareSectionBottomSheet";
import { useAuth } from "@/hooks/useAuth";
import { RawReel } from "@/lib/api/api";
import { useReelsStore } from "@/stores/useReelsStore";
import { useUploadStore } from "@/stores/useUploadStore";
// ✅ Added: import apiCall for like and comment API calls
import { apiCall } from "@/lib/api/apiService";

// Use 'screen' instead of 'window' for true fullscreen (includes notch and navigation)
const { width, height } = Dimensions.get("screen");
const BOTTOM_NAV_HEIGHT = 80;
const TRUNCATE_LEN = 25;

type Post = {
  id: number;
  media_url: string | number;
  thumbnail_url?: string;
  photoURL?: string;
  username?: string;
  user_id?: number;
  caption?: string;
  likes?: number;
  commentsCount?: number;
  shareUrl?: string;
  verified?: boolean;
  liked?: boolean;
  following?: boolean;
  isProduct?: boolean;
  productCount?: string;
};

const AnimatedFlatList = Reanimated.createAnimatedComponent(
  FlatList
) as unknown as typeof FlatList;
const StyledText: React.FC<any> = ({ children, className, style, ...rest }) => (
  <Text className={className} style={style} {...rest}>
    {children}
  </Text>
);

/* ----------------- PostItem overlays + actions ----------------- */
/* NOTE: removed isLoaded-based thumbnail overlay here. The shared overlay in parent
   will show the thumbnail while the player is loading (mediaLoading). */
const PostItem: React.FC<{
  item: RawReel;
  index: number;
  active: boolean;
  onOpenProfile: (uid?: number) => void;
  onToggleLike: () => void;
  onOpenPostOptions: () => void;
  isFavorited: boolean;
  onToggleFollow: (uid?: number) => void;
  isFollowing: boolean;
  onOverlayPress: () => void;
  centerVisible: boolean;
  isPlaying: boolean;
  onCenterToggle: () => void;
  // ✅ Added: a callback to open comments for this item
  onOpenComments: () => void;
  router: any;
}> = memo(
  ({
    item,
    index,
    active,
    onOpenProfile,
    onToggleLike,
    onOpenPostOptions,
    isFavorited,
    onToggleFollow,
    isFollowing,
    onOverlayPress,
    centerVisible,
    isPlaying,
    onCenterToggle,
    onOpenComments, // ✅ Added
    router,
  }: any) => {
    const [imgLoading, setImgLoading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [localFollowing, setLocalFollowing] = useState<boolean>(
      !!item.following
    );

    // ✅ Added: local state to open ShareSectionBottomSheet
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => setLocalFollowing(!!item.following), [item.following]);

    const userFromList = CREATION_USERS.find(
      (u: any) => String(u.id) === String(item.user_id)
    );
    const avatarUri: string | undefined =
      userFromList?.avatar ?? item?.photoURL;
    const hasValidUri =
      typeof avatarUri === "string" && /^(http|https):/.test(avatarUri);

    const rawCaption = item.caption ?? "";
    const needsTruncate = rawCaption.length > TRUNCATE_LEN;
    const collapsedCaption = needsTruncate
      ? rawCaption.slice(0, TRUNCATE_LEN).trim()
      : rawCaption;

    const captionExpanded = useSharedValue(0);
    const [captionOpen, setCaptionOpen] = useState(false);
    useEffect(() => {
      captionExpanded.value = captionOpen ? 1 : 0;
    }, [captionOpen, captionExpanded]);
    const captionAnimatedStyle = useAnimatedStyle(() => ({
      maxHeight: withTiming(captionExpanded.value ? 200 : 48, {
        duration: 300,
      }),
    }));

    // ❌ OLD: native share
    // const onShare = async () => {
    //   try {
    //     const url =
    //       item.shareUrl ??
    //       (typeof item.media_url === "string"
    //         ? item.media_url
    //         : `https://example.com/reel/${item.id}`);
    //     await Share.share({ message: url, url });
    //   } catch (e) {
    //     console.error("share error", e);
    //   }
    // };

    // ✅ NEW: open our ShareSectionBottomSheet (same behavior as your PostCard)
    const onShare = () => setShareOpen(true);

    // ✅ Build the same postPreview payload the Share sheet expects
    const previewImage =
      typeof item.thumbnail_url === "string" && item.thumbnail_url
        ? item.thumbnail_url
        : typeof item.media_url === "string"
          ? item.media_url
          : "";

    const postPreview = {
      id: String(item.id),
      image: previewImage || "",
      author: item.username || "user",
      caption: item.caption || "",
      author_avatar: avatarUri || "",
      // ✅ NEW: pass both fields so the chat bubble can render a thumbnail instantly
      videoUrl: typeof item.media_url === "string" ? item.media_url : undefined,
      thumb:
        typeof item.thumbnail_url === "string" ? item.thumbnail_url : undefined,
      verified: !!item.verified,
    };
    // ✅ UPDATED: Linkify caption parts (hashtags -> search screen, mentions -> profile, URLs -> open)
    const renderCaptionParts = (text: string) => {
      return text
        .split(/((?:@|#)[\w.]+|(?:https?:\/\/|www\.)\S+)/gi)
        .map((part, i) => {
          if (!part) return null;

          // Mention
          if (part.startsWith("@")) {
            const username = part.slice(1);
            return (
              <Text
                key={`m-${i}`}
                className="text-blue-400"
                suppressHighlighting
                onPress={() =>
                  router.push({
                    pathname: "/(profiles)" as any,
                    params: {
                      username,
                      user: 999999,
                    },
                  })
                }
                onLongPress={onOpenPostOptions}
              >
                {part}
              </Text>
            );
          }

          // Hashtag
          if (part.startsWith("#")) {
            const tag = part; // keep leading '#'
            return (
              <Text
                key={`h-${i}`}
                className="text-white font-semibold"
                suppressHighlighting
                onPress={() =>
                  router.push({
                    pathname: "/(search)/searchPostsWithTags" as any,
                    params: { tag },
                  })
                }
                onLongPress={onOpenPostOptions}
              >
                {part}
              </Text>
            );
          }

          // URL
          if (/^(https?:\/\/|www\.)/i.test(part)) {
            const url = part.startsWith("www.") ? `https://${part}` : part;
            return (
              <Text
                key={`u-${i}`}
                className="text-blue-400"
                style={{ textDecorationLine: "underline" }}
                suppressHighlighting
                onPress={() => Linking.openURL(url)}
                onLongPress={onOpenPostOptions}
              >
                {part}
              </Text>
            );
          }

          // Plain text
          return (
            <Text key={`t-${i}`} className="text-white">
              {part}
            </Text>
          );
        });
    };

    return (
      <View style={{ height, width, zIndex: 20 }} className="w-full">
        {/* NOTE: removed per-item full-screen thumbnail overlay so it won't hide the shared overlay / video.
            The parent-level shared thumbnail (mediaLoading) ensures a thumbnail is shown while the player loads. */}

        {/* Touchable overlay to toggle play/pause on this item. */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onOverlayPress}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width,
            height,
            zIndex: 21,
          }}
        />

        {/* center play/pause icon (only for active item) */}
        {centerVisible && active && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ zIndex: 30 }}
          >
            <TouchableOpacity onPress={onCenterToggle} activeOpacity={0.9}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.32)",
                }}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={32}
                  color="rgba(255,255,255,0.95)"
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* right action column (icons) */}
        <View
          className="absolute right-3 bottom-1/4 items-center"
          style={{ zIndex: 30 }}
        >
          {item.isProduct && (
            <>
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center mb-1 bg-white/20"
                onPress={() => {}}
                activeOpacity={0.8}
              >
                <Ionicons name="bag-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white text-xs mt-2">
                {item.productCount ?? "0"}
              </Text>
            </>
          )}

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={() => onToggleLike()}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.liked || isFavorited ? "heart" : "heart-outline"}
              size={20}
              color={item.liked || isFavorited ? "#ff3b30" : "#fff"}
            />
          </TouchableOpacity>
          <Text className="text-white text-xs mt-2">{item.likes ?? 0}</Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            // ✅ Changed: open the comments sheet
            onPress={onOpenComments}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xs mt-2">
            {(item.commentsCount ?? 0).toString()}
          </Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={onShare}
            activeOpacity={0.8}
          >
            <Send width={20} height={20} />
          </TouchableOpacity>
          <Text className="text-white text-xs mt-2">Share</Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={() => onOpenPostOptions()}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* bottom profile + caption (lifted above overlays) */}
        <View
          className="absolute left-3 right-3 rounded-2xl px-3 py-3 bg-black/20"
          style={{
            bottom: BOTTOM_NAV_HEIGHT + 10,
            zIndex: 40,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              onToggleFollow(item.user_id);
              setLocalFollowing((s) => !s);
            }}
            activeOpacity={0.95}
            className="absolute right-3 top-2 z-10 rounded-full px-3 py-1 border border-white/70 bg-white/8"
          >
            <Text className="text-white font-semibold">
              {localFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => onOpenProfile(item.user_id)}>
              <View className="w-14 h-14 rounded-full overflow-hidden items-center justify-center border border-white/20">
                {hasValidUri && !imgError ? (
                  <Image
                    source={{ uri: avatarUri! }}
                    className="w-14 h-14 rounded-full"
                    onLoadStart={() => setImgLoading(true)}
                    onLoadEnd={() => setImgLoading(false)}
                    onError={() => {
                      setImgLoading(false);
                      setImgError(true);
                    }}
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-gray-500 justify-center items-center">
                    <Text className="text-white font-bold">
                      {(item?.username && item.username[0]) || "?"}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => onOpenProfile(item.user_id)}
                  activeOpacity={0.7}
                >
                  <StyledText
                    className="text-white font-bold text-base mr-2"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.username}
                  </StyledText>
                </TouchableOpacity>

                {item.verified && (
                  <Octicons
                    name="verified"
                    size={16}
                    color="#ffffff"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>

              <View className="flex-row items-center mt-1">
                <Text className="text-white/80 text-sm">
                  Explore with Dumble Door
                </Text>
                <Text className="text-white/60 mx-2">•</Text>
                <Text className="text-white/80 text-sm">2 days ago</Text>
              </View>
            </View>
          </View>

          <Reanimated.View
            style={[{ overflow: "hidden" }, captionAnimatedStyle]}
          >
            <Text
              numberOfLines={captionOpen ? undefined : 1}
              ellipsizeMode="tail"
              className="text-white text-base mt-2 leading-7"
            >
              {captionOpen ? (
                <>
                  {renderCaptionParts(item.caption ?? "")}
                  <Text
                    onPress={() => setCaptionOpen(false)}
                    style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}
                  >
                    {"  "}Show less
                  </Text>
                </>
              ) : (
                <>
                  {renderCaptionParts(collapsedCaption)}
                  {needsTruncate ? (
                    <Text
                      onPress={() => setCaptionOpen(true)}
                      style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}
                    >
                      {" "}
                      ... more
                    </Text>
                  ) : null}
                </>
              )}
            </Text>
          </Reanimated.View>
        </View>

        {/* ✅ Share sheet with the same API as your PostCard */}
        <ShareSectionBottomSheet
          show={shareOpen}
          setShow={setShareOpen}
          postId={String(item.id)}
          postPreview={postPreview}
          initialHeightPct={0.4}
          maxHeightPct={0.9}
          maxSelect={5}
        />
      </View>
    );
  }
);

PostItem.displayName = "PostItem";

/* ----------------- MAIN: single shared player overlay + AnimatedFlatList ----------------- */
const VideoFeed: React.FC = () => {
  const { openPostId } = useLocalSearchParams<{ openPostId?: string }>();
  const navigation = useNavigation<any>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList<RawReel> | null>(null);

  // ✅ Use Zustand store for reels state management
  const {
    reels: posts,
    isInitialLoading: loading,
    error: reelsError,
    hasMore,
    cursor,
    fetchReels,
    loadMoreReels,
    refreshReels,
    updateReel,
  } = useReelsStore();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);
  const [showPostOptionsFor, setShowPostOptionsFor] = useState<RawReel | null>(
    null
  );

  const focused = useIsFocused();

  // ----- NEW (minimal): refreshKey to force lightweight remount on tab re-tap -----
  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());

  // reanimated scroll tracking
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((ev) => {
    // Clamp scroll value to prevent negative offsets during pull-to-refresh
    scrollY.value = Math.max(0, ev.contentOffset.y);
  });

  // overlay top follows currentIndex and scroll offset
  const overlayTop = useDerivedValue(
    () => currentIndex * height - scrollY.value
  );
  const overlayStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: 0,
    width,
    height,
    top: overlayTop.value,
    zIndex: 0, // keep shared overlay under items
  }));

  // single shared player refs
  const playerRef = useRef<VideoPlayer | null>(null);
  const releasedRef = useRef(false);

  // current media = post object for currentIndex
  // NOTE: intentionally depends ONLY on currentIndex to avoid recreating player when posts change (likes etc.)
  const [currentMedia, setCurrentMedia] = useState<RawReel | null>(
    posts[0] ?? null
  );

  // mediaLoading: true while waiting for native player to report loaded for the currentIndex
  const [mediaLoading, setMediaLoading] = useState<boolean>(true);

  // Track if we're showing loading spinner (after timeout)
  const [showLoadingSpinner, setShowLoadingSpinner] = useState<boolean>(false);
  const loadingTimeoutRef = useRef<any>(null);

  // loadedSetRef tracks which indices have finished loading at least once
  const loadedSetRef = useRef<Set<number>>(new Set());
  // a tiny integer state to trigger re-renders when loadedSetRef changes
  const [loadedVersion, setLoadedVersion] = useState(0);

  // Preload nearby videos for smooth Instagram-like experience
  const preloadedPlayersRef = useRef<Map<number, any>>(new Map());

  // Track if we've triggered playback-based preloading for current video
  const playbackPreloadTriggeredRef = useRef<Set<number>>(new Set());

  // CACHE WINDOW: Track the current cache window (10 videos)
  const CACHE_SIZE = 10; // Total videos to keep in cache
  const BATCH_LOAD_TRIGGER = 5; // Load more when reaching this index in cache window
  const BATCH_LOAD_SIZE = 5; // How many videos to load in next batch
  const cacheWindowStartRef = useRef<number>(0); // Start of current cache window
  const batchLoadTriggeredRef = useRef<Set<number>>(new Set()); // Track batch loads

  // track per-index manual pause state map
  const pausedMapRef = useRef<Map<number, boolean>>(new Map());
  const manualPausedRef = useRef(false);

  // tap timing refs for distinguishing single vs double tap
  const lastTapRef = useRef<number | null>(null);
  const singleTapTimeoutRef = useRef<any>(null);

  // parent-level center icon state and playing state
  const [centerVisible, setCenterVisible] = useState(false);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Added: heart animation for double-tap like
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  // ✅ Added: comments sheet ref + selected post state
  const commentsRef = useRef<CommentsSheetHandle>(null);
  const [commentsPost, setCommentsPost] = useState<RawReel | null>(null);

  // ✅ Added: state for comments and likes
  const [postComments, setPostComments] = useState<any[]>([]);
  const [likedPostIDs, setLikedPostIDs] = useState<number[]>([]);

  // Track video errors by index
  const videoErrorsRef = useRef<Map<number, boolean>>(new Map());
  const [hasVideoError, setHasVideoError] = useState(false);

  // ✅ Added: open comments handler
  const openCommentsFor = useCallback((post: RawReel) => {
    setCommentsPost(post);
    fetchCommentsOfAPost(post.id);
    commentsRef.current?.present();
  }, []);

  // ✅ Added: fetch user's liked posts and followings on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserLikedPosts();
      fetchUserFollowings();
    }
  }, [user?.id]);

  const fetchUserLikedPosts = async () => {
    if (!user?.id) return;
    try {
      const response = await apiCall(
        `/api/reelLikes/${user.id}/likedPosts`,
        "GET"
      );
      setLikedPostIDs(response.likedPosts || []);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    }
  };

  const fetchUserFollowings = async () => {
    if (!user?.id) return;
    try {
      const response = await apiCall(
        `/api/follows/following/${user.id}`,
        "GET"
      );
      // Assuming API returns { following: [userId1, userId2, ...] }
      setFollowedUsers(response.following || []);
      console.log(
        "✅ Fetched user followings:",
        response.following?.length || 0
      );
    } catch (error) {
      console.error("❌ Error fetching user followings:", error);
    }
  };

  const fetchCommentsOfAPost = async (postID: number) => {
    try {
      const response = await apiCall(`/api/reelComments/post/${postID}`, "GET");
      console.log("Comments API Response:", response.comments);
      console.log("First comment structure:", response.comments?.[0]);

      // Map API response to expected comment format
      const mappedComments = (response.comments || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id || c.userId,
        comment: c.content || c.comment,
        username: c.user?.username || c.username || "Unknown",
        userImage:
          c.user?.profile_picture ||
          c.user?.photoURL ||
          c.userImage ||
          "https://via.placeholder.com/150",
        time: formatCommentTime(c.created_at || c.createdAt || c.time),
        likes: c.likes || 0,
      }));

      console.log("Mapped comments:", mappedComments);
      setPostComments(mappedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Helper function to format comment timestamp
  const formatCommentTime = (timestamp: string) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleLike = async (postId: number) => {
    if (!user?.id) return;
    try {
      Vibration.vibrate(50);

      const isPostLiked = likedPostIDs.includes(postId);
      const endpoint = isPostLiked
        ? `/api/reelLikes/${postId}/${user.id}/unlike`
        : `/api/reelLikes/${postId}/${user.id}/like`;

      await apiCall(endpoint, "POST");

      // Update liked posts state
      setLikedPostIDs((prev) =>
        isPostLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
      );

      // ✅ Update posts state with new like status using Zustand
      updateReel(postId, {
        liked: !isPostLiked,
        likes:
          (posts.find((p) => p.id === postId)?.likes ?? 0) +
          (isPostLiked ? -1 : 1),
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // create single player for currentMedia
  const player = useVideoPlayer(
    currentMedia ? currentMedia.media_url : null,
    (pl) => {
      console.log("🎬 Player created for:", currentMedia?.media_url);
      console.log("🎬 Player object:", pl ? "✅ Available" : "❌ Null");
      console.log(
        "🎬 Has getStatusAsync:",
        typeof (pl as any)?.getStatusAsync === "function" ? "✅ Yes" : "❌ No"
      );
      playerRef.current = pl as any;
      releasedRef.current = false;
      try {
        if (pl) {
          // Listen for player errors
          if (typeof (pl as any).addListener === "function") {
            (pl as any).addListener("error", (error: any) => {
              console.error("❌ Player error event:", error);
              videoErrorsRef.current.set(currentIndex, true);
              setHasVideoError(true);
            });
            console.log("👂 Error listener added");
          }

          // apply looping & unmuted on the player instance (not the VideoView props)
          if (typeof (pl as any).setIsLooping === "function") {
            (pl as any).setIsLooping(true);
            console.log("🔁 Looping enabled");
          } else if ("loop" in (pl as any)) {
            (pl as any).loop = true;
            console.log("🔁 Looping enabled (alt method)");
          }

          // Enable sound (unmuted)
          if (typeof (pl as any).setIsMuted === "function") {
            (pl as any).setIsMuted(false);
            console.log("🔊 Audio enabled");
          } else if ("muted" in (pl as any)) {
            (pl as any).muted = false;
            console.log("🔊 Audio enabled (alt method)");
          }

          // iOS-specific: Ensure player is configured for autoplay
          if (Platform.OS === "ios") {
            console.log("🍎 Configuring iOS-specific player settings");
            // Set playsinline to avoid fullscreen
            if (typeof (pl as any).setPlaysinline === "function") {
              (pl as any).setPlaysinline(true);
              console.log("📱 Playsinline enabled");
            }
            // Ensure allowsExternalPlayback is false
            if (typeof (pl as any).setAllowsExternalPlayback === "function") {
              (pl as any).setAllowsExternalPlayback(false);
              console.log("📱 External playback disabled");
            }
          }
        }
      } catch (err) {
        console.error("❌ Error configuring player:", err);
      }
    }
  );

  // defensive helpers
  const tryRelease = async (p: any) => {
    if (!p) return;
    releasedRef.current = true;
    try {
      if (typeof p.unload === "function") {
        await p.unload();
        return;
      }
      if (typeof p.unloadAsync === "function") {
        await p.unloadAsync();
        return;
      }
      if (typeof p.release === "function") {
        await p.release();
        return;
      }
      if (typeof p.stop === "function") {
        await p.stop();
        return;
      }
    } catch (err) {
      console.warn("tryRelease error", err);
    } finally {
      try {
        playerRef.current = null;
      } catch {}
    }
  };

  const safePlay = useCallback(async () => {
    try {
      const p = playerRef.current ?? (player as any);
      if (!p) {
        console.log("⚠️ safePlay: No player available");
        return;
      }
      if (releasedRef.current) {
        console.log("⚠️ safePlay: Player already released");
        return;
      }
      if (typeof p !== "object") {
        console.log("⚠️ safePlay: Player is not an object");
        return;
      }

      console.log("🎬 safePlay: Starting playback for index:", currentIndex);

      // Seek to beginning for new video (non-blocking for faster start)
      const seekPromises = [];
      if (typeof (p as any).setPositionAsync === "function") {
        seekPromises.push((p as any).setPositionAsync(0).catch(() => {}));
      } else if (typeof (p as any).setCurrentTime === "function") {
        try {
          (p as any).setCurrentTime(0);
        } catch {}
      } else if (typeof (p as any).seek === "function") {
        try {
          (p as any).seek(0);
        } catch {}
      } else if (typeof (p as any).seekTo === "function") {
        try {
          (p as any).seekTo(0);
        } catch {}
      }

      // Start playing immediately without waiting for seek (Instagram-style)
      if (typeof (p as any).playAsync === "function") {
        console.log("🎬 Calling playAsync");
        await (p as any).playAsync();
        console.log("✅ playAsync completed");
        return;
      }
      if (typeof (p as any).play === "function") {
        console.log("🎬 Calling play");
        (p as any).play();
        console.log("✅ play completed");
      }
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (
        /already released|shared object|Cannot use shared object/i.test(msg)
      ) {
        console.log("⚠️ safePlay: Player was released");
        return;
      }
      console.error("❌ safePlay failed:", e);
    }
  }, [player, currentIndex]);

  const safePause = useCallback(async () => {
    try {
      const p = playerRef.current ?? (player as any);
      if (!p) return;
      if (releasedRef.current) return;
      if (typeof p !== "object") return;
      if (typeof (p as any).pauseAsync === "function") {
        await (p as any).pauseAsync();
        return;
      }
      if (typeof (p as any).pause === "function") {
        (p as any).pause();
      }
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (/already released|shared object|Cannot use shared object/i.test(msg))
        return;
      console.warn("safePause failed", e);
    }
  }, [player]);

  // PREFETCH avatars & thumbnails to avoid placeholder flicker
  useEffect(() => {
    const prefetchAll = async () => {
      try {
        const urls: string[] = [];
        for (const p of posts) {
          if (p.thumbnail_url && typeof p.thumbnail_url === "string")
            urls.push(p.thumbnail_url);
          const userFromList = CREATION_USERS.find(
            (u: any) => String(u.id) === String(p.user_id)
          );
          const avatarUri = userFromList?.avatar ?? p?.photoURL;
          if (
            avatarUri &&
            typeof avatarUri === "string" &&
            /^(http|https):/.test(avatarUri)
          )
            urls.push(avatarUri);
        }
        urls.forEach((u) => {
          Image.prefetch(u).catch(() => {});
        });
      } catch (e) {
        console.log("prefetchAll error: ", e);
      }
    };
    prefetchAll();
  }, [posts]);

  // CONTINUOUS PLAYBACK MONITORING: Preload next video while current is playing
  useEffect(() => {
    let playbackMonitor: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const monitorPlaybackAndPreload = async () => {
      try {
        const p = playerRef.current ?? (player as any);
        if (!p || cancelled) return;

        // Check if video is actively playing
        if (typeof p.getStatusAsync === "function") {
          const status: any = await p.getStatusAsync();

          // If video is playing and we haven't triggered preload yet
          if (
            status?.isPlaying &&
            !playbackPreloadTriggeredRef.current.has(currentIndex)
          ) {
            playbackPreloadTriggeredRef.current.add(currentIndex);
            console.log(
              `🎥 Video ${currentIndex} is playing - triggering aggressive preload of next videos`
            );

            // ✅ PRIORITY: Preload NEXT video immediately and completely
            const nextIndex = currentIndex + 1;
            const nextNextIndex = currentIndex + 2;

            // Preload next video completely - THIS IS CRITICAL FOR INSTANT PLAYBACK
            if (nextIndex < posts.length) {
              const nextPost = posts[nextIndex];
              if (
                nextPost?.media_url &&
                typeof nextPost.media_url === "string"
              ) {
                if (
                  !preloadedPlayersRef.current.has(nextIndex) ||
                  preloadedPlayersRef.current.get(nextIndex) === "loading"
                ) {
                  preloadedPlayersRef.current.set(nextIndex, "loading");
                  console.log(
                    `📥 🚨 PRIORITY: Full download of next video ${nextIndex} while video ${currentIndex} plays`
                  );

                  // Full download - no byte range limit
                  fetch(nextPost.media_url, { method: "GET" })
                    .then(() => {
                      preloadedPlayersRef.current.set(
                        nextIndex,
                        "fully-loaded"
                      );
                      // ✅ Mark as loaded immediately so no spinner shows
                      loadedSetRef.current.add(nextIndex);
                      console.log(
                        `✅ ⚡ Next video ${nextIndex} FULLY LOADED and marked - ready for instant playback!`
                      );

                      // Also preload thumbnail
                      if (nextPost.thumbnail_url) {
                        Image.prefetch(nextPost.thumbnail_url).catch(() => {});
                      }
                    })
                    .catch((err) => {
                      console.log(
                        `❌ Failed to preload next video ${nextIndex}:`,
                        err
                      );
                      preloadedPlayersRef.current.delete(nextIndex);
                      loadedSetRef.current.delete(nextIndex);
                    });
                }
              }
            }

            // Preload next 2-4 videos partially for smooth scrolling
            const nextVideosToPreload = [
              nextNextIndex,
              currentIndex + 3,
              currentIndex + 4,
            ];
            for (const idx of nextVideosToPreload) {
              if (idx < posts.length && !preloadedPlayersRef.current.has(idx)) {
                const nextPost = posts[idx];
                if (
                  nextPost?.media_url &&
                  typeof nextPost.media_url === "string"
                ) {
                  preloadedPlayersRef.current.set(idx, "loading");

                  // Partial download for videos further ahead
                  fetch(nextPost.media_url, {
                    method: "GET",
                    headers: { Range: "bytes=0-512000" }, // 500KB for better cache
                  })
                    .then(() => {
                      preloadedPlayersRef.current.set(idx, "loaded");
                      console.log(`✅ Preloaded video ${idx} during playback`);
                    })
                    .catch(() => {
                      preloadedPlayersRef.current.delete(idx);
                    });

                  // Prefetch thumbnail
                  if (nextPost.thumbnail_url) {
                    Image.prefetch(nextPost.thumbnail_url).catch(() => {});
                  }
                }
              }
            }
          }

          // Check playback progress for additional optimizations
          if (
            status?.isPlaying &&
            status?.durationMillis &&
            status?.positionMillis
          ) {
            const progress = status.positionMillis / status.durationMillis;

            // ✅ When video is 20% played, double-check next video is fully loaded
            if (progress > 0.2 && progress < 0.25) {
              const nextIndex = currentIndex + 1;
              if (
                nextIndex < posts.length &&
                !loadedSetRef.current.has(nextIndex)
              ) {
                console.log(
                  `⚠️ Video ${currentIndex} at 20% but next video ${nextIndex} not loaded yet - triggering NOW!`
                );
                const nextPost = posts[nextIndex];
                if (nextPost?.media_url) {
                  preloadedPlayersRef.current.set(nextIndex, "loading");
                  fetch(nextPost.media_url, { method: "GET" })
                    .then(() => {
                      preloadedPlayersRef.current.set(
                        nextIndex,
                        "fully-loaded"
                      );
                      loadedSetRef.current.add(nextIndex);
                      console.log(
                        `✅ Emergency load complete for video ${nextIndex}`
                      );
                    })
                    .catch((err) => {
                      console.log(`❌ Emergency load failed:`, err);
                    });
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("monitorPlaybackAndPreload error: ", error);
      }
    };

    // ✅ Start monitoring immediately when video starts playing
    if (isPlayingState && !mediaLoading) {
      playbackMonitor = setInterval(monitorPlaybackAndPreload, 500); // Check every 500ms
      // Also run once immediately
      monitorPlaybackAndPreload();
    }

    return () => {
      cancelled = true;
      if (playbackMonitor) {
        clearInterval(playbackMonitor);
      }
    };
  }, [currentIndex, isPlayingState, mediaLoading, posts, player]);

  // DYNAMIC CACHE WINDOW: Intelligent 10-video cache with batch loading
  useEffect(() => {
    const manageCacheWindow = async () => {
      try {
        // Update cache window start based on current position
        const newCacheStart = Math.max(0, currentIndex - 2); // Keep 2 behind current
        cacheWindowStartRef.current = newCacheStart;
        const cacheEnd = Math.min(posts.length, newCacheStart + CACHE_SIZE);

        console.log(
          `📦 Cache window: [${newCacheStart} to ${cacheEnd - 1}] (current: ${currentIndex})`
        );

        // Calculate position within cache window
        const positionInCache = currentIndex - newCacheStart;

        // TRIGGER BATCH LOAD: When reaching 5th video in cache, load next 5
        if (
          positionInCache === BATCH_LOAD_TRIGGER &&
          !batchLoadTriggeredRef.current.has(currentIndex)
        ) {
          batchLoadTriggeredRef.current.add(currentIndex);
          const batchStart = cacheEnd;
          const batchEnd = Math.min(posts.length, batchStart + BATCH_LOAD_SIZE);

          console.log(
            `🚀 BATCH LOAD TRIGGERED at video ${currentIndex}! Loading videos [${batchStart} to ${batchEnd - 1}]`
          );

          // Load next batch of 5 videos
          for (let idx = batchStart; idx < batchEnd; idx++) {
            const post = posts[idx];
            if (post?.media_url && typeof post.media_url === "string") {
              if (!preloadedPlayersRef.current.has(idx)) {
                preloadedPlayersRef.current.set(idx, "loading");
                console.log(`📥 Batch loading video ${idx}`);

                fetch(post.media_url, {
                  method: "GET",
                  headers: { Range: "bytes=0-307200" }, // 300KB for batch load
                })
                  .then(() => {
                    preloadedPlayersRef.current.set(idx, "batch-loaded");
                    console.log(`✅ Batch loaded video ${idx}`);
                  })
                  .catch(() => {
                    preloadedPlayersRef.current.delete(idx);
                  });

                // Preload thumbnail
                if (post.thumbnail_url) {
                  Image.prefetch(post.thumbnail_url).catch(() => {});
                }
              }
            }
          }
        }

        // PRELOAD VIDEOS IN CACHE WINDOW
        const indicesToPreload: number[] = [];

        // Priority order:
        // 1. Next immediate video (full load)
        // 2. Next 2-4 videos (partial load)
        // 3. Previous 1-2 videos (partial load)

        for (let i = 0; i < CACHE_SIZE; i++) {
          const idx = newCacheStart + i;
          if (idx >= 0 && idx < posts.length && idx !== currentIndex) {
            indicesToPreload.push(idx);
          }
        }

        // Preload videos in cache window
        for (const idx of indicesToPreload) {
          if (!preloadedPlayersRef.current.has(idx)) {
            const post = posts[idx];
            if (post?.media_url && typeof post.media_url === "string") {
              preloadedPlayersRef.current.set(idx, "loading");

              // Full load for next immediate video, partial for others
              const isNextVideo = idx === currentIndex + 1;
              const distanceFromCurrent = Math.abs(idx - currentIndex);

              if (
                isNextVideo &&
                playbackPreloadTriggeredRef.current.has(currentIndex)
              ) {
                // Full download for immediate next video when triggered by playback
                fetch(post.media_url, { method: "GET" })
                  .then(() => {
                    preloadedPlayersRef.current.set(idx, "fully-loaded");
                    console.log(`✅ Fully preloaded video ${idx}`);
                  })
                  .catch(() => {
                    preloadedPlayersRef.current.delete(idx);
                  });
              } else if (distanceFromCurrent <= 3) {
                // High priority: videos 1-3 positions away
                fetch(post.media_url, {
                  method: "GET",
                  headers: { Range: "bytes=0-307200" }, // 300KB
                })
                  .then(() => {
                    preloadedPlayersRef.current.set(idx, "loaded");
                    console.log(`✅ Preloaded video ${idx} (priority)`);
                  })
                  .catch(() => {
                    preloadedPlayersRef.current.delete(idx);
                  });
              } else {
                // Lower priority: videos 4+ positions away
                fetch(post.media_url, {
                  method: "GET",
                  headers: { Range: "bytes=0-204800" }, // 200KB
                })
                  .then(() => {
                    preloadedPlayersRef.current.set(idx, "loaded");
                    console.log(`✅ Preloaded video ${idx} (background)`);
                  })
                  .catch(() => {
                    preloadedPlayersRef.current.delete(idx);
                  });
              }

              // Also prefetch thumbnail
              if (post.thumbnail_url) {
                Image.prefetch(post.thumbnail_url).catch(() => {});
              }
            }
          }
        }

        // CLEANUP: Remove videos outside cache window (keep 10 in cache)
        const keysToRemove: number[] = [];
        preloadedPlayersRef.current.forEach((_, idx) => {
          const distanceFromWindow = Math.min(
            Math.abs(idx - newCacheStart),
            Math.abs(idx - (cacheEnd - 1))
          );

          // Remove if outside cache window by more than 2 positions
          if (idx < newCacheStart - 2 || idx > cacheEnd + 2) {
            keysToRemove.push(idx);
          }
        });

        if (keysToRemove.length > 0) {
          console.log(
            `🧹 Cleaning up ${keysToRemove.length} videos outside cache window`
          );
          keysToRemove.forEach((key) =>
            preloadedPlayersRef.current.delete(key)
          );
        }

        // Cleanup old batch load triggers
        const triggersToRemove: number[] = [];
        batchLoadTriggeredRef.current.forEach((idx) => {
          if (idx < currentIndex - 10) {
            triggersToRemove.push(idx);
          }
        });
        triggersToRemove.forEach((idx) =>
          batchLoadTriggeredRef.current.delete(idx)
        );
      } catch (error) {
        console.log("Cache management error:", error);
      }
    };

    // Start cache management immediately
    const cacheTimer = setTimeout(manageCacheWindow, 50);
    return () => clearTimeout(cacheTimer);
  }, [currentIndex, posts]);

  // monitor player status for load -> autoplay (handles initial & switches)
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let pollCount = 0;
    const MAX_POLL_COUNT = 150; // 15 seconds max (100ms * 150)

    // ✅ Check if video is prefetched for faster polling
    const isPrefetched = preloadedPlayersRef.current.has(currentIndex);
    const POLL_INTERVAL = isPrefetched ? 20 : 50; // 20ms for prefetched, 50ms for new videos

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(async () => {
        try {
          const p = playerRef.current ?? (player as any);
          if (!p || cancelled) return;

          pollCount++;

          // Safety: stop polling after max attempts
          if (pollCount > MAX_POLL_COUNT) {
            console.warn(
              `⚠️ Video ${currentIndex} failed to load after ${MAX_POLL_COUNT} attempts`
            );
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
            setMediaLoading(false);
            setShowLoadingSpinner(false);
            return;
          }

          if (typeof p.getStatusAsync === "function") {
            const status: any = await p.getStatusAsync();

            // ✅ Only log every 10th poll to reduce console spam
            if (pollCount % 10 === 0 || pollCount < 3) {
              console.log(
                `📊 Video ${currentIndex} status (poll ${pollCount}):`,
                {
                  isLoaded: status?.isLoaded,
                  isBuffering: status?.isBuffering,
                  isPlaying: status?.isPlaying,
                  error: status?.error,
                  prefetched: isPrefetched,
                }
              );
            }

            // Check if video is loaded and doesn't have an error
            const readyToRender = status?.isLoaded && !status?.error;

            if (readyToRender) {
              if (cancelled) return;
              if (!loadedSetRef.current.has(currentIndex)) {
                loadedSetRef.current.add(currentIndex);
                setLoadedVersion((v) => v + 1);
                console.log(
                  `✅ Video ${currentIndex} loaded successfully after ${pollCount} polls (${pollCount * POLL_INTERVAL}ms)`
                );
              }

              // Immediately hide loading and start playback for smooth experience
              setMediaLoading(false);
              setShowLoadingSpinner(false);

              const pausedForIndex =
                pausedMapRef.current.get(currentIndex) ?? false;
              manualPausedRef.current = pausedForIndex;

              if (!pausedForIndex) {
                // Start playing immediately without waiting
                safePlay().then(() => {
                  setIsPlayingState(true);
                });
              } else {
                safePause().then(() => {
                  setIsPlayingState(false);
                });
              }

              if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
              }
            } else if (status?.error) {
              // Video has an error, stop polling and show error state
              console.error(
                `❌ Video ${currentIndex} failed to load:`,
                status.error
              );
              videoErrorsRef.current.set(currentIndex, true);
              setHasVideoError(true);
              if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
              }
              setMediaLoading(false);
              setShowLoadingSpinner(false);
              // Don't add to loadedSetRef so it can retry on next view
            }
          } else {
            // Only use fallback after reasonable attempts AND validate URL
            if (pollCount > 20) {
              console.log(
                "📹 Using fallback loading detection for index:",
                currentIndex,
                "after",
                pollCount,
                "polls"
              );

              // Validate video URL before marking as loaded
              const videoUrl = currentMedia?.media_url;
              if (videoUrl && typeof videoUrl === "string") {
                console.log("🔍 Validating video URL:", videoUrl);

                // Try to fetch video to check if it exists
                fetch(videoUrl, { method: "HEAD" })
                  .then((response) => {
                    if (response.ok) {
                      console.log("✅ Video URL validated, marking as loaded");
                      if (!loadedSetRef.current.has(currentIndex)) {
                        loadedSetRef.current.add(currentIndex);
                        setLoadedVersion((v) => v + 1);
                      }
                      setMediaLoading(false);
                      setShowLoadingSpinner(false);

                      const pausedForIndex =
                        pausedMapRef.current.get(currentIndex) ?? false;
                      manualPausedRef.current = pausedForIndex;

                      if (!pausedForIndex) {
                        safePlay().then(() => {
                          setIsPlayingState(true);
                        });
                      } else {
                        safePause().then(() => {
                          setIsPlayingState(false);
                        });
                      }
                    } else {
                      console.error(
                        "❌ Video URL validation failed:",
                        response.status
                      );
                      videoErrorsRef.current.set(currentIndex, true);
                      setHasVideoError(true);
                      setMediaLoading(false);
                      setShowLoadingSpinner(false);
                    }
                  })
                  .catch((error) => {
                    console.error("❌ Failed to validate video URL:", error);
                    videoErrorsRef.current.set(currentIndex, true);
                    setHasVideoError(true);
                    setMediaLoading(false);
                    setShowLoadingSpinner(false);
                  })
                  .finally(() => {
                    if (pollTimer) {
                      clearInterval(pollTimer);
                      pollTimer = null;
                    }
                  });
              } else {
                console.error("❌ Invalid video URL:", videoUrl);
                videoErrorsRef.current.set(currentIndex, true);
                setHasVideoError(true);
                setMediaLoading(false);
                setShowLoadingSpinner(false);
                if (pollTimer) {
                  clearInterval(pollTimer);
                  pollTimer = null;
                }
              }
            }
          }
        } catch (error) {
          // ignore but log for debugging
          if (pollCount % 20 === 0) {
            console.log("Poll error:", error);
          }
        }
      }, POLL_INTERVAL); // ✅ Use dynamic interval based on prefetch status
    };

    setMediaLoading(true);
    const startDelay = setTimeout(() => startPolling(), isPrefetched ? 5 : 10); // ✅ Faster start for prefetched

    return () => {
      cancelled = true;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      clearTimeout(startDelay);
    };
  }, [currentMedia, safePlay, safePause, currentIndex, player]);

  useEffect(() => {
    if (!openPostId) return;
    const idx = posts.findIndex((p) => String(p.id) === String(openPostId));
    if (idx >= 0) {
      setCurrentIndex(idx);
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        } catch {
          const y = idx * height;
          flatListRef.current?.scrollToOffset({ offset: y, animated: false });
        }
      }, 0);
    }
  }, [openPostId]);

  // pause/resume on screen focus
  useEffect(() => {
    (async () => {
      try {
        if (!playerRef.current && !player) return;
        if (!focused) {
          await safePause();
          setIsPlayingState(false);
        } else {
          manualPausedRef.current =
            pausedMapRef.current.get(currentIndex) ?? false;
          if (!manualPausedRef.current) {
            await safePlay();
            setIsPlayingState(true);
          }
        }
      } catch (e) {
        console.warn("focus control error", e);
      }
    })();
  }, [focused, currentIndex, safePause, safePlay, player]);

  // when index changes, set currentMedia and clear transient manual pause for new index
  useEffect(() => {
    const next = posts[currentIndex];

    // ✅ CRITICAL FIX: If posts array doesn't have this index, don't update
    // This prevents showing wrong video/user during refresh
    if (!next) {
      console.log(`⚠️ No post at index ${currentIndex}, skipping media update`);
      return;
    }

    // ✅ CRITICAL FIX: Verify the post data is valid before updating
    if (!next.media_url || typeof next.media_url !== "string") {
      console.log(`⚠️ Invalid media_url at index ${currentIndex}, skipping`);
      return;
    }

    // don't recreate player on posts change — only update currentMedia when index changes
    manualPausedRef.current = pausedMapRef.current.get(currentIndex) ?? false;
    setCenterVisible(false);

    // Check if current video has error
    const hasError = videoErrorsRef.current.get(currentIndex);
    setHasVideoError(!!hasError);

    // Clear previous loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Clean up old playback preload triggers (keep only recent videos)
    const triggersToRemove: number[] = [];
    playbackPreloadTriggeredRef.current.forEach((idx) => {
      if (Math.abs(idx - currentIndex) > 10) {
        // Increased for larger cache
        triggersToRemove.push(idx);
      }
    });
    triggersToRemove.forEach((idx) =>
      playbackPreloadTriggeredRef.current.delete(idx)
    );

    // ✅ Check if video was prefetched/preloaded
    const isAlreadyLoaded = loadedSetRef.current.has(currentIndex);
    const isPrefetched = preloadedPlayersRef.current.has(currentIndex);

    // ✅ CRITICAL FIX: Update media immediately and validate it matches the post
    console.log(`🎬 Updating currentMedia to index ${currentIndex}:`, {
      id: next.id,
      username: next.username,
      media_url: next.media_url?.substring(0, 50) + "...",
    });
    setCurrentMedia(next);

    // ✅ If video is prefetched, mark it as loaded immediately to skip loading state
    if (isPrefetched && !isAlreadyLoaded) {
      console.log(
        `⚡ Video ${currentIndex} was prefetched - marking as loaded immediately`
      );
      loadedSetRef.current.add(currentIndex);
      setMediaLoading(false);
      setShowLoadingSpinner(false);
    } else if (isAlreadyLoaded) {
      // Video already loaded before, transition instantly
      console.log(
        `⚡ Video ${currentIndex} already loaded - instant transition`
      );
      setMediaLoading(false);
      setShowLoadingSpinner(false);
    } else {
      // First time loading this video
      console.log(`📥 Loading video ${currentIndex} for first time`);
      setMediaLoading(true);
      setShowLoadingSpinner(false);

      // ✅ Show spinner only after 150ms (reduced from 300ms) if still loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (!loadedSetRef.current.has(currentIndex)) {
          console.log(`⏳ Showing spinner for video ${currentIndex}`);
          setShowLoadingSpinner(true);
        }
      }, 150);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [currentIndex, posts]); // ✅ Now properly depends on both currentIndex AND posts

  // Handle screen focus/blur - pause when screen is not focused
  useEffect(() => {
    console.log("🎯 Screen focus changed:", focused);
    if (focused && !mediaLoading && !manualPausedRef.current) {
      // Screen just became focused and video is loaded - start playing
      console.log("▶️ Screen focused - resuming playback");
      safePlay().then(() => {
        setIsPlayingState(true);
      });
    } else if (!focused) {
      // Screen lost focus - pause playback
      console.log("⏸️ Screen unfocused - pausing playback");
      safePause().then(() => {
        setIsPlayingState(false);
      });
    }
  }, [focused, mediaLoading, safePlay, safePause]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      (async () => {
        try {
          await tryRelease(playerRef.current ?? player);
        } catch (e) {
          console.log("single tap error: ", e);
        }
      })();
    };
  }, []); // only on unmount

  // SINGLE vs DOUBLE tap handling: if second tap occurs within DELAY, treat as double-tap
  const DOUBLE_PRESS_DELAY = 260;
  const onOverlayPress = async () => {
    const now = Date.now();

    // Double-tap detected
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      // cancel pending single-tap action
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = null;

      // DOUBLE TAP ACTION: always show heart animation, only API call if not liked
      const currentPost = posts[currentIndex];
      if (currentPost) {
        // Always show heart animation on double tap
        setShowHeartAnimation(true);
        Vibration.vibrate(50);
        setTimeout(() => setShowHeartAnimation(false), 1000);

        // Only perform like API call if post is not already liked
        if (!likedPostIDs.includes(currentPost.id)) {
          toggleLike(currentPost.id);
        }
      }
      return;
    }

    // Not a double-tap (yet) — schedule single-tap action after DELAY,
    // to allow second tap to arrive
    lastTapRef.current = now;
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
    singleTapTimeoutRef.current = setTimeout(async () => {
      // SINGLE TAP ACTION: toggle play/pause
      try {
        if (isPlayingState) {
          await safePause();
          setIsPlayingState(false);
          manualPausedRef.current = true;
          pausedMapRef.current.set(currentIndex, true);
          setCenterVisible(true);
        } else {
          await safePlay();
          setIsPlayingState(true);
          manualPausedRef.current = false;
          pausedMapRef.current.set(currentIndex, false);
          setCenterVisible(true);
          setTimeout(() => setCenterVisible(false), 380);
        }
      } catch (e) {
        console.log("onOverlayPress error :", e);
        // ignore
      } finally {
        lastTapRef.current = null;
        singleTapTimeoutRef.current = null;
      }
    }, DOUBLE_PRESS_DELAY);
  };

  const onCenterToggle = async () => {
    try {
      if (isPlayingState) {
        await safePause();
        setIsPlayingState(false);
        manualPausedRef.current = true;
        pausedMapRef.current.set(currentIndex, true);
        setCenterVisible(true);
      } else {
        await safePlay();
        setIsPlayingState(true);
        manualPausedRef.current = false;
        pausedMapRef.current.set(currentIndex, false);
        setCenterVisible(true);
        setTimeout(() => setCenterVisible(false), 380);
      }
    } catch (e) {
      console.log("onCenterToggle error: ", e);
    }
  };

  // viewability - more sensitive detection for Instagram-like feel
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // Reduced from 75 to 50 for faster switching
    minimumViewTime: 0, // Immediate response
    waitForInteraction: false,
  } as const;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems?: any[] }) => {
      if (!viewableItems || viewableItems.length === 0) return;
      const firstVisible = viewableItems[0];
      if (
        typeof firstVisible?.index === "number" &&
        firstVisible.index !== currentIndex
      ) {
        setCurrentIndex(firstVisible.index);
      }
    }
  ).current;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y ?? 0;
    const index = Math.round(y / height);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  // Load more reels when approaching the end
  const onEndReached = () => {
    if (!loading && hasMore && user?.id) {
      console.log("🔄 Loading more reels...");
      loadMoreReels(String(user.id));
    }
  };

  // Render loading footer
  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    );
  };

  // video style — keep under PostItem
  // Important: completely hide video during loading or error to prevent flicker on Android
  const videoStyle = {
    width,
    height,
    backgroundColor: "#000000",
    // Use opacity for smoother transitions on Android
    // Hide video when loading OR when there's an error (prevents previous video showing through)
    opacity: mediaLoading || hasVideoError ? 0 : 1,
    position: "absolute" as const,
    left: 0,
    top: 0,
  } as any;

  // shared thumbnail overlay is mandatory while mediaLoading is true
  // High z-index ensures it covers video during transitions on both iOS and Android
  const sharedThumbStyle = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    width,
    height,
    backgroundColor: "#000000", // Solid background to prevent any bleed-through
    zIndex: 100, // Much higher z-index to ensure it's always on top during loading
  };

  // -------------------------
  // NEW: add tabPress listener to scroll to top + refresh when tab is tapped again
  // -------------------------
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
      if (focused) {
        try {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        } catch {}
        setRefreshKey(Date.now());
      }
    });
    return unsubscribe;
  }, [navigation, focused]);

  console.log("posts: ", posts);

  // Refresh handler - clear all caches and fetch fresh data
  const onRefresh = React.useCallback(async () => {
    if (!user?.id) return;

    setRefreshing(true);

    // Pause video during refresh to prevent UI issues
    await safePause();
    setIsPlayingState(false);

    // ✅ CRITICAL FIX: Reset currentIndex and currentMedia BEFORE clearing data
    // This prevents mismatch between old index/media and new data
    setCurrentIndex(0);
    setCurrentMedia(null);
    setHasVideoError(false);
    setMediaLoading(true);

    // Reset scroll position to 0 (both FlatList and reanimated value)
    scrollY.value = 0;

    // Scroll to top to ensure proper video positioning on iOS
    try {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    } catch (e) {
      console.log("Scroll to top error:", e);
    }

    // Small delay to let scroll complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clear all video caches
    console.log("🔄 Refreshing - clearing all caches");
    preloadedPlayersRef.current.clear();
    loadedSetRef.current.clear();
    videoErrorsRef.current.clear();
    playbackPreloadTriggeredRef.current.clear();
    batchLoadTriggeredRef.current.clear();
    pausedMapRef.current.clear();

    // ✅ Use Zustand refresh action
    await refreshReels(String(user.id));

    setRefreshing(false);
    console.log("✅ Refresh complete");
  }, [refreshReels, safePause, scrollY, user?.id]);

  // Watch for upload completion to refresh reels
  const { shouldRefreshReels, clearRefreshTriggers } = useUploadStore();
  useEffect(() => {
    if (shouldRefreshReels) {
      console.log("🔄 Upload complete - refreshing reels");
      onRefresh();
      clearRefreshTriggers();
    }
  }, [shouldRefreshReels, clearRefreshTriggers, onRefresh]);

  // ✅ Fetch reels on component mount only if not already loaded
  useEffect(() => {
    console.log(
      "📊 Fetch check - user?.id:",
      user?.id,
      "posts.length:",
      posts.length,
      "loading:",
      loading
    );

    if (user?.id && posts.length === 0 && !loading) {
      console.log(
        "🚀 Component mounted - fetching initial reels for user:",
        user.id
      );
      fetchReels(String(user.id), 0).catch((error) => {
        console.error("❌ Error fetching initial reels:", error);
      });
    } else if (!user?.id) {
      console.log("⚠️ No user ID available yet, waiting for auth...");
    } else if (posts.length > 0) {
      console.log("✅ Posts already loaded, skipping fetch");
    } else if (loading) {
      console.log("⏳ Already loading, skipping fetch");
    }
  }, [user?.id, posts.length, loading, fetchReels]);

  // ✅ Aggressive preloading: Load next batch when within 5 posts of the end
  useEffect(() => {
    const postsRemaining = posts.length - currentIndex;
    const shouldPreload = postsRemaining <= 5 && postsRemaining > 0;

    if (shouldPreload && !loading && hasMore && user?.id) {
      console.log(
        `🚀 Preloading next batch (${postsRemaining} posts remaining, currently at ${currentIndex}/${posts.length})`
      );
      loadMoreReels(String(user.id));
    }
  }, [currentIndex, posts.length, loading, hasMore, user?.id, loadMoreReels]);

  // Initialize currentMedia when posts are loaded
  useEffect(() => {
    if (posts.length > 0 && !currentMedia && currentIndex === 0) {
      console.log("📹 Initializing first video:", posts[0].media_url);
      setCurrentMedia(posts[0]);
      setMediaLoading(true);
    }

    // ✅ CRITICAL FIX: Reset currentMedia if posts become empty (during refresh)
    // This prevents showing stale data from previous posts array
    if (posts.length === 0 && currentMedia) {
      console.log("🧹 Clearing stale currentMedia - posts array is empty");
      setCurrentMedia(null);
      setMediaLoading(true);
    }

    // ✅ CRITICAL FIX: Validate currentIndex is within bounds
    // If currentIndex is out of bounds, reset to 0
    if (posts.length > 0 && currentIndex >= posts.length) {
      console.log(
        `⚠️ currentIndex ${currentIndex} out of bounds (posts.length: ${posts.length}), resetting to 0`
      );
      setCurrentIndex(0);
      setCurrentMedia(posts[0]);
      setMediaLoading(true);
    }
  }, [posts, currentMedia, currentIndex]);

  // Show initial loading when no posts yet
  if (posts.length === 0 && loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: "#ffffff", marginTop: 16, fontSize: 16 }}>
          Loading reels...
        </Text>
        {reelsError && (
          <Text
            style={{
              color: "#ff3b30",
              marginTop: 8,
              fontSize: 14,
              paddingHorizontal: 20,
              textAlign: "center",
            }}
          >
            Error: {reelsError}
          </Text>
        )}
      </View>
    );
  }

  // Show message if no posts and not loading
  if (posts.length === 0 && !loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 16 }}>
          No reels available
        </Text>
        {reelsError && (
          <Text
            style={{
              color: "#ff3b30",
              marginTop: 8,
              fontSize: 14,
              paddingHorizontal: 20,
              textAlign: "center",
            }}
          >
            Error: {reelsError}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => {
            if (user?.id) {
              console.log("🔄 Retrying fetch...");
              fetchReels(String(user.id), 0);
            }
          }}
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: "#4D70D1",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Shared overlay - non-interactive so touches pass to items */}
      {/* Hide overlay during refresh to prevent positioning issues on iOS */}
      {!refreshing && posts.length > 0 && currentMedia && (
        <Reanimated.View pointerEvents="none" style={overlayStyle}>
          <View
            pointerEvents="none"
            style={{ width, height, backgroundColor: "#000000" }}
          >
            <VideoView
              player={playerRef.current ?? (player as any)}
              style={videoStyle}
              contentFit="contain"
              nativeControls={false}
              allowsPictureInPicture={false}
              allowsFullscreen={false}
            />
          </View>

          {/* mandatory shared thumbnail: visible while mediaLoading is true */}
          {mediaLoading && (
            <View pointerEvents="none" style={sharedThumbStyle}>
              {currentMedia?.thumbnail_url ? (
                <>
                  <Image
                    source={{ uri: currentMedia.thumbnail_url }}
                    style={{ width, height }}
                    resizeMode="cover"
                    onError={(e) => {
                      console.log("Thumbnail load error:", currentMedia.id);
                    }}
                  />
                  {/* Subtle overlay to indicate loading state */}
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.15)",
                    }}
                  />
                </>
              ) : (
                // Fallback if no thumbnail - show dark background
                <View
                  style={{
                    width,
                    height,
                    backgroundColor: "#000000",
                  }}
                />
              )}

              {/* Loading spinner - show immediately for better feedback */}
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  // Show spinner with slight delay or immediately based on showLoadingSpinner
                  opacity: showLoadingSpinner ? 1 : 0.7,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderRadius: 50,
                    padding: 16,
                  }}
                >
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              </View>
            </View>
          )}

          {/* Error indicator - show when video fails to load */}
          {hasVideoError && !mediaLoading && (
            <Reanimated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  left: 0,
                  width,
                  height,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#000000", // Solid black to hide previous video on Android
                  zIndex: 200,
                },
                { top: overlayTop.value },
              ]}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,0,0,0.3)",
                  borderRadius: 50,
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <Ionicons name="alert-circle" size={48} color="#ff3b30" />
                <Text
                  style={{
                    color: "#ffffff",
                    marginTop: 12,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Failed to load video
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    marginTop: 4,
                    fontSize: 14,
                    opacity: 0.8,
                  }}
                >
                  Swipe to next video
                </Text>
              </View>
            </Reanimated.View>
          )}
        </Reanimated.View>
      )}

      {/* ✅ Heart Animation on Double-Tap Like */}
      {showHeartAnimation && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width,
            height,
            zIndex: 999,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Reanimated.View
            entering={FadeIn.duration(200).springify()}
            exiting={FadeOut.duration(300)}
            style={{
              width: width * 0.6,
              height: width * 0.6,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="heart" size={width * 0.35} color="#ff3b30" />
          </Reanimated.View>
        </View>
      )}

      {/* Animated list of posts */}
      <AnimatedFlatList
        // NEW: key forces remount when refreshKey changes (lightweight refresh)
        key={String(refreshKey)}
        ref={flatListRef}
        data={posts}
        keyExtractor={(item: RawReel) => item.id.toString()}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        // Aggressive rendering for smooth preloading
        initialNumToRender={12}
        maxToRenderPerBatch={5}
        windowSize={11}
        removeClippedSubviews={false}
        ListFooterComponent={renderFooter}
        renderItem={({ item, index }: ListRenderItemInfo<RawReel>) => {
          const active = index === currentIndex;
          return (
            // ensure item container above shared overlay
            <View style={{ height, width, zIndex: 20 }}>
              <PostItem
                item={item}
                index={index}
                active={active}
                onOpenProfile={(uid) =>
                  router.push({
                    pathname: "/(profiles)" as any,
                    params: { user: uid, username: item.username },
                  })
                }
                onToggleLike={() => toggleLike(item.id)}
                onOpenPostOptions={() => setShowPostOptionsFor(item)}
                isFavorited={!!item.liked}
                onToggleFollow={async (uid?: number) => {
                  if (uid == null || !user?.id) return;
                  try {
                    Vibration.vibrate(50);
                    const isFollowing = followedUsers.includes(uid);
                    const endpoint = isFollowing
                      ? `/api/follows/unfollow/${user.id}/${uid}`
                      : `/api/follows/follow/${user.id}/${uid}`;

                    // Optimistic UI update
                    setFollowedUsers((prev) =>
                      isFollowing
                        ? prev.filter((x) => x !== uid)
                        : [...prev, uid]
                    );

                    // ✅ Update follow status for all reels by this user
                    posts.forEach((p) => {
                      if (p.user_id === uid) {
                        updateReel(p.id, { following: !isFollowing });
                      }
                    });

                    // API call
                    await apiCall(endpoint, isFollowing ? "DELETE" : "POST");

                    console.log(
                      `✅ ${isFollowing ? "Unfollowed" : "Followed"} user:`,
                      uid
                    );
                  } catch (error) {
                    console.error("❌ Error toggling follow:", error);
                    // Rollback on error
                    setFollowedUsers((prev) =>
                      prev.includes(uid)
                        ? prev.filter((x) => x !== uid)
                        : [...prev, uid]
                    );

                    // ✅ Rollback follow status
                    posts.forEach((p) => {
                      if (p.user_id === uid) {
                        updateReel(p.id, {
                          following: !(p.following ?? false),
                        });
                      }
                    });
                  }
                }}
                isFollowing={!!item.following}
                onOverlayPress={onOverlayPress}
                centerVisible={centerVisible && active}
                isPlaying={isPlayingState && active}
                onCenterToggle={onCenterToggle}
                // ✅ Pass the per-item comments opener
                onOpenComments={() => openCommentsFor(item)}
                router={router}
              />
            </View>
          );
        }}
        pagingEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4D70D1"]}
            tintColor={"#4D70D1"}
            progressBackgroundColor={"#F3F4F8"}
          />
        }
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        getItemLayout={(_: any, index: number) => ({
          length: height,
          offset: height * index,
          index,
        })}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
        disableIntervalMomentum={true}
        snapToInterval={height}
        snapToAlignment="start"
      />

      {/* ✅ Added: Comments sheet instance */}
      <CommentsSheet
        ref={commentsRef}
        snapPoints={["40%", "85%"]}
        title={
          commentsPost ? `Comments • @${commentsPost.username}` : "Comments"
        }
        comments={postComments}
        postId={commentsPost ? String(commentsPost.id) : undefined}
        onSendComment={async (text) => {
          if (commentsPost && user?.id && text.trim()) {
            try {
              console.log("Sending comment:", {
                postID: commentsPost.id,
                content: text,
                userID: user.id,
              });

              // Optimistically add comment to UI
              const optimisticComment = {
                id: Date.now(), // Temporary ID
                userId: user.id,
                comment: text,
                username: user.username || "You",
                userImage:
                  user.profile_picture || "https://via.placeholder.com/150",
                time: "Just now",
                likes: 0,
              };
              setPostComments((prev) => [optimisticComment, ...prev]);

              const response = await apiCall(`/api/reelComments/`, "POST", {
                postID: commentsPost.id,
                content: text,
                userID: user.id,
              });

              console.log("✅ Comment added successfully:", response.comment);

              // Fetch fresh comments from server
              await fetchCommentsOfAPost(commentsPost.id);

              // ✅ Update comment count using Zustand
              updateReel(commentsPost.id, {
                commentsCount:
                  (posts.find((p) => p.id === commentsPost.id)?.commentsCount ||
                    0) + 1,
              });
            } catch (error) {
              console.error("❌ Error adding comment:", error);
              // Remove optimistic comment on error
              await fetchCommentsOfAPost(commentsPost.id);
            }
          }
        }}
        onFetchComments={(postId) => fetchCommentsOfAPost(Number(postId))}
        currentUserAvatar={user?.profile_picture}
      />

      <PostOptionsBottomSheet
        show={!!showPostOptionsFor}
        setShow={(v: boolean) => {
          if (!v) setShowPostOptionsFor(null);
        }}
        toggleFollow={async () => {
          if (!showPostOptionsFor?.user_id || !user?.id) return;
          try {
            Vibration.vibrate(50);
            const isFollowing = followedUsers.includes(
              Number(showPostOptionsFor.user_id)
            );
            const endpoint = isFollowing
              ? `/api/follows/unfollow/${user.id}/${showPostOptionsFor.user_id}`
              : `/api/follows/follow/${user.id}/${showPostOptionsFor.user_id}`;

            await apiCall(endpoint, isFollowing ? "DELETE" : "POST");

            // Update followed users state
            setFollowedUsers((prev) =>
              isFollowing
                ? prev.filter((x) => x !== Number(showPostOptionsFor.user_id))
                : [...prev, Number(showPostOptionsFor.user_id)]
            );

            // ✅ Update posts state with new follow status using Zustand
            posts.forEach((p) => {
              if (p.user_id === showPostOptionsFor.user_id) {
                updateReel(p.id, { following: !isFollowing });
              }
            });

            console.log(
              `✅ ${isFollowing ? "Unfollowed" : "Followed"} user:`,
              showPostOptionsFor.user_id
            );
          } catch (error) {
            console.error("❌ Error toggling follow:", error);
          }
        }}
        isFollowing={followedUsers.includes(
          Number(showPostOptionsFor?.user_id ?? -1)
        )}
        focusedPost={showPostOptionsFor}
        setFocusedPost={setShowPostOptionsFor}
        setBlockUser={() => {}}
        setReportVisible={() => {}}
        deleteAction={async (postId: string) => {
          try {
            if (!user?.id) return;

            console.log(`🗑️ Deleting reel ${postId}...`);
            await apiCall(
              `/api/posts/user/${user.id}/reel/${postId}`,
              "DELETE"
            );

            // ✅ Remove the reel from state (Zustand will filter it out)
            const newPosts = posts.filter((p) => p.id !== Number(postId));
            useReelsStore.setState({ reels: newPosts });
            setShowPostOptionsFor(null);

            console.log(`✅ Reel ${postId} deleted successfully`);
          } catch (error) {
            console.error("❌ Error deleting reel:", error);
          }
        }}
        user={user}
      />
    </View>
  );
};

export default VideoFeed;
