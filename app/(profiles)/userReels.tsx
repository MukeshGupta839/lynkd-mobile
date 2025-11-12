// app/(profiles)/userReels.tsx
/// <reference types="react" />
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import { USERS as CREATION_USERS } from "@/constants/PostCreation";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView, type VideoPlayer } from "expo-video";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Send from "../../assets/posts/send.svg";

// ✅ Added: import the comments sheet component + handle
import CommentsSheet, { CommentsSheetHandle } from "@/components/Comment";
// ✅ Added: Share bottom sheet (for Send button)
import ShareSectionBottomSheet from "@/components/ShareSectionBottomSheet";
import { useAuth } from "@/hooks/useAuth";
import { RawReel } from "@/lib/api/api";
import { useUploadStore } from "@/stores/useUploadStore";
import { useReelsStore } from "@/stores/useUserReelsStore";
// ✅ Added: import apiCall for like and comment API calls
import ReportPostBottomSheet from "@/components/ReportPostBottomSheet";
import { apiCall } from "@/lib/api/apiService";
import {
  registerTabPressHandler,
  unregisterTabPressHandler,
} from "@/lib/tabBarVisibility";

// Use 'screen' instead of 'window' for true fullscreen (includes notch and navigation)
const { width, height } = Dimensions.get("screen");
const BOTTOM_NAV_HEIGHT = 80;
const TRUNCATE_LEN = 25;

// put near the top, e.g. under imports
type HLSOrMP4 = {
  uri: string;
  contentType?: "hls" | "mp4";
  headers?: Record<string, string>;
};

const toVideoSource = (url?: string): HLSOrMP4 | null => {
  if (!url) return null;
  // If backend provides HLS, great:
  if (/\.m3u8(\?|$)/i.test(url)) return { uri: url, contentType: "hls" };
  // If you *must* keep MP4s around temporarily:
  return { uri: url, contentType: "mp4" };
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
  likedPostIDs: number[]; // ✅ Changed: receive likedPostIDs array instead of isFavorited
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
    likedPostIDs, // ✅ Changed: receive likedPostIDs array
    onToggleFollow,
    isFollowing,
    onOverlayPress,
    centerVisible,
    isPlaying,
    onCenterToggle,
    onOpenComments, // ✅ Added
    router,
  }: any) => {
    const [imgError, setImgError] = useState(false);
    const [localFollowing, setLocalFollowing] = useState<boolean>(
      !!item.following
    );

    // ✅ Added: local state to open ShareSectionBottomSheet
    const [shareOpen, setShareOpen] = useState(false);

    // ✅ Calculate isFavorited internally to avoid unnecessary re-renders
    const isFavorited = useMemo(
      () => likedPostIDs.includes(item.id) || !!item.liked,
      [likedPostIDs, item.id, item.liked]
    );

    // ✅ Added: Local like count state (similar to your other app)
    const [likesCount, setLikesCount] = useState(
      item?.reels_likes_aggregate?.aggregate?.count ??
        item?.likesCount ??
        item?.likes ??
        0
    );
    const prevIsFavoritedRef = useRef(isFavorited);

    // ✅ Sync like count with isFavorited changes (similar to your other app)
    useEffect(() => {
      if (prevIsFavoritedRef.current !== isFavorited) {
        setLikesCount((prev: number) =>
          Math.max(0, isFavorited ? prev + 1 : prev - 1)
        );
      }
      prevIsFavoritedRef.current = isFavorited;
    }, [isFavorited]);

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
          <Text className="text-white text-xs mt-2">{likesCount}</Text>

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
                    onError={() => setImgError(true)}
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
  },
  // ✅ Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    const itemChanged = prevProps.item.id !== nextProps.item.id;
    const activeChanged = prevProps.active !== nextProps.active;
    const isPlayingChanged = prevProps.isPlaying !== nextProps.isPlaying;
    const centerVisibleChanged =
      prevProps.centerVisible !== nextProps.centerVisible;

    // Check if THIS specific item's like status changed
    const prevLiked =
      prevProps.likedPostIDs.includes(prevProps.item.id) ||
      !!prevProps.item.liked;
    const nextLiked =
      nextProps.likedPostIDs.includes(nextProps.item.id) ||
      !!nextProps.item.liked;
    const likeStatusChanged = prevLiked !== nextLiked;

    // Return true to skip re-render, false to re-render
    return !(
      itemChanged ||
      activeChanged ||
      isPlayingChanged ||
      centerVisibleChanged ||
      likeStatusChanged
    );
  }
);

PostItem.displayName = "PostItem";

/* ----------------- MAIN: single shared player overlay + AnimatedFlatList ----------------- */
const ProfileReelsFeed: React.FC = () => {
  const params = useLocalSearchParams<{
    openPostId?: string;
    userId?: string;
    userReelsData?: string;
    initialIndex?: string;
    username?: string;
  }>();
  const navigation = useNavigation<any>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<RawReel> | null>(null);

  // ✅ Log navigation params for debugging
  console.log("📍 ProfileReelsFeed params:", params);

  // ✅ Use Zustand store for reels state management
  const {
    reels: posts,
    isInitialLoading: loading,
    error: reelsError,
    updateReel,
    likedPostIDs,
    postComments,
    fetchUserLikedPosts,
    toggleLike: toggleLikeStore,
    fetchCommentsOfAPost: fetchCommentsStore,
    addComment: addCommentStore,
    reset,
  } = useReelsStore();

  // ✅ Initialize currentIndex from params if available
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (params.initialIndex) {
      const idx = parseInt(String(params.initialIndex), 10);
      return !isNaN(idx) && idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);
  const [showPostOptionsFor, setShowPostOptionsFor] = useState<RawReel | null>(
    null
  );
  const [reportVisible, setReportVisible] = useState(false);
  const [focusedPost] = useState<any>(null); // Only for ReportPostBottomSheet props

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
  // Show thumbnail overlay after a short delay to avoid covering video during quick swipes
  const [showLoadingThumbnail, setShowLoadingThumbnail] = useState(false);
  const loadingThumbTimeoutRef = useRef<any>(null);
  // short timeout to suppress overlays briefly after momentum end (Android)
  const scrollEndTimeoutRef = useRef<any>(null);
  // Keep a ref-free usage of loadedVersion so linter doesn't complain
  const [loadedVersion, setLoadedVersion] = useState(0);

  // reference loadedVersion to suppress unused variable lint; value updates force re-renders
  useEffect(() => {}, [loadedVersion]);

  // Helper: determine whether the video for the given index is already
  // effectively playing/loaded so we can skip showing thumbnail/spinner overlays.
  const isIndexPlayingOrLoaded = useCallback(async (index: number) => {
    try {
      // If we've explicitly marked it loaded (prefetch or cache), skip overlays
      if (loadedSetRef.current.has(index)) return true;
      if (localFileUrisRef.current.has(index)) return true;

      // If a player exists (shared or slot) and reports playing/position, skip
      const p = playerRef.current ?? (player as any);
      if (p && typeof p.getStatusAsync === "function") {
        const s: any = await p.getStatusAsync().catch(() => null);
        const pos = Number(s?.positionMillis ?? s?.position ?? 0);
        if (s && (s.isPlaying || s.isLoaded || pos > 50)) return true;
      }

      // Android: also check the two-slot players if they match this index's media
      if (Platform.OS === "android" && currentMedia) {
        const uri = String(currentMedia.media_url);
        if (slotAUri === uri) {
          const pl = slotPlayersRef.current[0];
          if (pl && typeof pl.getStatusAsync === "function") {
            const s: any = await pl.getStatusAsync().catch(() => null);
            const pos = Number(s?.positionMillis ?? s?.position ?? 0);
            if (s && (s.isPlaying || s.isLoaded || pos > 50)) return true;
          }
        }
        if (slotBUri === uri) {
          const pl = slotPlayersRef.current[1];
          if (pl && typeof pl.getStatusAsync === "function") {
            const s: any = await pl.getStatusAsync().catch(() => null);
            const pos = Number(s?.positionMillis ?? s?.position ?? 0);
            if (s && (s.isPlaying || s.isLoaded || pos > 50)) return true;
          }
        }
      }
    } catch {
      // ignore errors and fall back to showing overlays
    }
    return false;
    // Intentionally empty deps - this reads latest refs/state via closures
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Manage thumbnail overlay delay: show after short delay, hide immediately when loaded
    if (mediaLoading) {
      if (loadingThumbTimeoutRef.current)
        clearTimeout(loadingThumbTimeoutRef.current);
      loadingThumbTimeoutRef.current = setTimeout(async () => {
        try {
          const playing = await isIndexPlayingOrLoaded(currentIndex);
          if (playing) return;
        } catch {
          // ignore
        }
        setShowLoadingThumbnail(true);
      }, 350); // 350ms delay to avoid UI flash on quick swipes
    } else {
      if (loadingThumbTimeoutRef.current) {
        clearTimeout(loadingThumbTimeoutRef.current);
        loadingThumbTimeoutRef.current = null;
      }
      setShowLoadingThumbnail(false);
    }
    return () => {
      if (loadingThumbTimeoutRef.current) {
        clearTimeout(loadingThumbTimeoutRef.current);
        loadingThumbTimeoutRef.current = null;
      }
    };
  }, [mediaLoading, currentIndex, isIndexPlayingOrLoaded]);

  // loadedSetRef tracks which indices have finished loading at least once
  const loadedSetRef = useRef<Set<number>>(new Set());
  // a tiny integer state to trigger re-renders when loadedSetRef changes

  // Preload nearby videos for smooth Instagram-like experience
  const preloadedPlayersRef = useRef<Map<number, any>>(new Map());
  // If we've downloaded a video file to cache, store its local URI here
  const localFileUrisRef = useRef<Map<number, string>>(new Map());
  // Track active downloads to avoid concurrent downloads spamming device
  const downloadingSetRef = useRef<Set<number>>(new Set());

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
  // Track whether the user is actively scrolling/swiping between reels
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // ✅ Added: heart animation for double-tap like
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  // ✅ Added: comments sheet ref + selected post state
  const commentsRef = useRef<CommentsSheetHandle>(null);
  const [commentsPost, setCommentsPost] = useState<RawReel | null>(null);

  // Track video errors by index
  const videoErrorsRef = useRef<Map<number, boolean>>(new Map());
  const [hasVideoError, setHasVideoError] = useState(false);

  // Handler for video load failures - ensures all players are paused/muted
  const handleVideoLoadError = (index: number, reason?: any) => {
    try {
      console.error("❌ Handling video load error for index:", index, reason);
      videoErrorsRef.current.set(index, true);
      setHasVideoError(true);
      // stop media loading UI
      setMediaLoading(false);
      setShowLoadingSpinner(false);
      setShowLoadingThumbnail(false);

      // Show swap placeholder on Android so user doesn't see artifacts
      if (Platform.OS === "android") setAndroidSwapInProgress(true);

      // Pause/mute the single/shared player if present
      try {
        const p = playerRef.current as any;
        if (p) {
          if (typeof p.pause === "function") p.pause();
          else if (typeof p.pauseAsync === "function")
            p.pauseAsync().catch(() => {});
          if (typeof p.setIsMuted === "function") p.setIsMuted(true);
          else if ("muted" in p) p.muted = true;
        }
      } catch (e) {
        console.error("Error pausing shared player on error:", e);
      }

      // Pause and mute both slot players (Android two-slot system)
      try {
        const slots = slotPlayersRef.current || [];
        for (let i = 0; i < slots.length; i++) {
          const sp = slots[i];
          if (!sp) continue;
          try {
            if (typeof sp.pause === "function") sp.pause();
            else if (typeof sp.pauseAsync === "function")
              sp.pauseAsync().catch(() => {});
            if (typeof sp.setIsMuted === "function") sp.setIsMuted(true);
            else if ("muted" in sp) sp.muted = true;
          } catch (e) {
            console.error(`Error pausing slot ${i} on video error:`, e);
          }
        }
      } catch (e) {
        console.error("Error iterating slot players on video error:", e);
      }

      // Keep the Android swap placeholder visible so user sees thumbnail until they swipe/ retry
    } catch (e) {
      console.error("Error in handleVideoLoadError:", e);
    }
  };

  // ✅ Added: open comments handler
  const openCommentsFor = useCallback(
    (post: RawReel) => {
      setCommentsPost(post);
      fetchCommentsStore(post.id);
      commentsRef.current?.present();
    },
    [fetchCommentsStore]
  );

  // ✅ CRITICAL: Load reels data from navigation params (passed from ProfileScreen)
  useEffect(() => {
    if (params.userReelsData && typeof params.userReelsData === "string") {
      try {
        const parsed = JSON.parse(params.userReelsData);
        console.log(
          "📦 Received reels data from params:",
          parsed.length,
          "reels"
        );
        useReelsStore.setState({ reels: parsed });

        // Set initial media immediately
        if (parsed.length > 0) {
          const initialIdx = params.initialIndex
            ? parseInt(String(params.initialIndex), 10)
            : 0;
          const validIdx =
            !isNaN(initialIdx) && initialIdx >= 0 && initialIdx < parsed.length
              ? initialIdx
              : 0;

          console.log("🎯 Setting initial index to:", validIdx);
          console.log(
            "🔄 Resetting from previous index:",
            currentIndex,
            "to:",
            validIdx
          );

          // ✅ CRITICAL: Always reset index when params change (handles component reuse by React Navigation)
          setCurrentIndex(validIdx);
          // ✅ CRITICAL: Also set currentMedia immediately so Android slot initialization works
          setCurrentMedia(parsed[validIdx]);
          setMediaLoading(true);
        }
      } catch (e) {
        console.error("❌ Error parsing userReelsData:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userReelsData, params.initialIndex]);

  // ✅ Scroll to initial index after data is loaded
  useEffect(() => {
    if (params.initialIndex && posts.length > 0 && flatListRef.current) {
      const idx = parseInt(String(params.initialIndex), 10);
      if (!isNaN(idx) && idx >= 0 && idx < posts.length) {
        console.log("📜 Scrolling to index:", idx);
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({ index: idx, animated: false });
          } catch (e) {
            console.log("Scroll to index error:", e);
          }
        }, 200);
      }
    }
  }, [params.initialIndex, posts.length]);

  // ✅ Reset store on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up UserReels store");
      reset();
    };
  }, [reset]);

  // ✅ REMOVED: Sync effect that was causing unnecessary re-renders
  // The liked status is now calculated directly in PostItem using useMemo,
  // so we don't need to update the posts array when likedPostIDs changes

  const fetchUserFollowings = useCallback(async () => {
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
  }, [user?.id]);

  // ✅ Fetch user's liked posts and followings on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserLikedPosts(user.id);
      fetchUserFollowings();
    }
  }, [user?.id, fetchUserLikedPosts, fetchUserFollowings]);

  // ✅ Fetch user's liked posts and followings on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserLikedPosts(user.id);
      fetchUserFollowings();
    }
  }, [user?.id, fetchUserLikedPosts, fetchUserFollowings]);

  const toggleLike = async (postId: number) => {
    if (!user?.id) return;
    try {
      Vibration.vibrate(50);
      // Use the store method for toggling like
      await toggleLikeStore(postId, user.id);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // create single player for currentMedia
  // On Android we use the two-slot persistent players to avoid surface
  // re-creation; do NOT create the single shared player on Android to avoid
  // multiple native decoders and possible OOMs.
  const player = useVideoPlayer(
    Platform.OS === "android"
      ? null
      : currentMedia
        ? String(currentMedia.media_url)
        : null,
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
              // Centralized handler will pause/mute players and show placeholder
              handleVideoLoadError(currentIndex, error);
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

  // ------------------ Android two-slot persistent players ------------------
  // Mount two persistent player hooks (slot 0 and slot 1). Load the new URI
  // into the inactive slot and swap to it once it reports ready to avoid
  // reusing released native objects and to prevent surface flicker on Android.
  // Only initialize slot URIs on Android; on iOS keep them null so the
  // useVideoPlayer hooks remain idle and don't allocate decoders.
  const [slotAUri, setSlotAUri] = useState<string | null>(
    Platform.OS === "android" && currentMedia
      ? String(currentMedia.media_url)
      : null
  );
  const [slotBUri, setSlotBUri] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  // Android-only: render a temporary placeholder while swapping persistent slots
  // to avoid showing the previous player's last frame (native surface artifact).
  const [androidSwapInProgress, setAndroidSwapInProgress] = useState(false);

  // ✅ CRITICAL FIX: Initialize slotAUri when currentMedia becomes available
  // This handles the case where currentMedia is null during initial useState (when params load async)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!currentMedia?.media_url) return;

    const targetUri = String(currentMedia.media_url);

    // ✅ Initialize or update slotAUri if it doesn't match currentMedia
    // This ensures the slot always reflects the current media, even after params load
    if (slotAUri !== targetUri) {
      console.log(
        "🎬 Initializing/updating slotAUri for Android with currentMedia:",
        targetUri
      );
      setSlotAUri(targetUri);
    }
  }, [currentMedia, slotAUri]);

  const slotPlayersRef = useRef<any[]>([null, null]);
  const slotReadyRef = useRef<Record<number, boolean>>({});

  // animated opacities for crossfade
  const slot0Opacity = useSharedValue(activeSlot === 0 ? 1 : 0);
  const slot1Opacity = useSharedValue(activeSlot === 1 ? 1 : 0);
  useEffect(() => {
    // ✅ For fast swipes: instant hide inactive, instant show active
    // NO FADE-IN to prevent any partial visibility during rendering
    if (activeSlot === 0) {
      slot1Opacity.value = 0; // Instant hide slot1
      slot0Opacity.value = 1; // INSTANT show slot0 (no animation)
    } else {
      slot0Opacity.value = 0; // Instant hide slot0
      slot1Opacity.value = 1; // INSTANT show slot1 (no animation)
    }

    // ✅ CRITICAL: Always pause and seek the inactive slot to prevent audio overlap and stale frames
    if (Platform.OS === "android") {
      const inactiveSlot = activeSlot === 0 ? 1 : 0;
      const inactivePlayer = slotPlayersRef.current[inactiveSlot];
      if (inactivePlayer) {
        try {
          // Mute immediately to prevent audio bleed
          if (typeof inactivePlayer.setIsMuted === "function") {
            inactivePlayer.setIsMuted(true);
          } else if ("muted" in inactivePlayer) {
            inactivePlayer.muted = true;
          }

          // Pause the inactive player
          if (typeof inactivePlayer.pause === "function") {
            inactivePlayer.pause();
          } else if (typeof inactivePlayer.pauseAsync === "function") {
            inactivePlayer.pauseAsync().catch(() => {});
          }

          // Seek to start to prevent showing last frame when it becomes active again
          if (typeof (inactivePlayer as any).seekTo === "function") {
            (inactivePlayer as any).seekTo(0);
          } else if (
            typeof (inactivePlayer as any).setPositionAsync === "function"
          ) {
            (inactivePlayer as any).setPositionAsync(0).catch(() => {});
          }

          console.log(
            `🔇 Muted, paused and reset inactive slot${inactiveSlot}`
          );
        } catch (e) {
          console.error(`Error pausing slot${inactiveSlot}:`, e);
        }
      }
    }
  }, [activeSlot, slot0Opacity, slot1Opacity]);

  const slot0Style = useAnimatedStyle(() => ({
    opacity: slot0Opacity.value,
    // Use zIndex to ensure inactive slot is behind active slot during crossfade
    zIndex: slot0Opacity.value > 0.5 ? 2 : 1,
  }));
  const slot1Style = useAnimatedStyle(() => ({
    opacity: slot1Opacity.value,
    // Use zIndex to ensure inactive slot is behind active slot during crossfade
    zIndex: slot1Opacity.value > 0.5 ? 2 : 1,
  }));

  // helper to poll a player until it reports a duration or loaded status
  const watchPlayerReady = (pl: any, slotIndex: number) => {
    if (!pl) return;
    slotReadyRef.current[slotIndex] = false;
    const id = setInterval(async () => {
      try {
        if (typeof pl.getStatusAsync === "function") {
          const s: any = await pl.getStatusAsync();
          if (s && (s.isLoaded || (s.durationMillis || s.duration) > 0)) {
            slotReadyRef.current[slotIndex] = true;
            clearInterval(id);
          }
        } else if (Number(pl.duration || 0) > 0) {
          slotReadyRef.current[slotIndex] = true;
          clearInterval(id);
        }
      } catch {
        // ignore and continue polling
      }
    }, 120);
  };

  // slot 0 player hook
  useVideoPlayer(slotAUri, (pl) => {
    try {
      slotPlayersRef.current[0] = pl;
      if (pl) {
        console.log("slot0 player created", slotAUri);

        // ✅ Enable looping for Android slot player
        if (typeof (pl as any).setIsLooping === "function") {
          (pl as any).setIsLooping(true);
          console.log("🔁 Looping enabled for slot0");
        } else if ("loop" in (pl as any)) {
          (pl as any).loop = true;
          console.log("🔁 Looping enabled for slot0 (alt method)");
        }

        // Enable sound (unmuted)
        if (typeof (pl as any).setIsMuted === "function") {
          (pl as any).setIsMuted(false);
        } else if ("muted" in (pl as any)) {
          (pl as any).muted = false;
        }

        // ✅ CRITICAL: Seek to position 0 to prevent showing previous video's last frame
        try {
          if (typeof (pl as any).seekTo === "function") {
            (pl as any).seekTo(0);
            console.log("⏮️ Seeked slot0 to position 0");
          } else if (typeof (pl as any).setPositionAsync === "function") {
            (pl as any).setPositionAsync(0).catch(() => {});
            console.log("⏮️ Seeked slot0 to position 0 (async)");
          }
        } catch (e) {
          console.log("Could not seek slot0 to start:", e);
        }

        watchPlayerReady(pl, 0);
      } else {
        slotReadyRef.current[0] = false;
        slotPlayersRef.current[0] = null;
      }
    } catch {}
  });

  // slot 1 player hook
  useVideoPlayer(slotBUri, (pl) => {
    try {
      slotPlayersRef.current[1] = pl;
      if (pl) {
        console.log("slot1 player created", slotBUri);

        // ✅ Enable looping for Android slot player
        if (typeof (pl as any).setIsLooping === "function") {
          (pl as any).setIsLooping(true);
          console.log("🔁 Looping enabled for slot1");
        } else if ("loop" in (pl as any)) {
          (pl as any).loop = true;
          console.log("🔁 Looping enabled for slot1 (alt method)");
        }

        // Enable sound (unmuted)
        if (typeof (pl as any).setIsMuted === "function") {
          (pl as any).setIsMuted(false);
        } else if ("muted" in (pl as any)) {
          (pl as any).muted = false;
        }

        // ✅ CRITICAL: Seek to position 0 to prevent showing previous video's last frame
        try {
          if (typeof (pl as any).seekTo === "function") {
            (pl as any).seekTo(0);
            console.log("⏮️ Seeked slot1 to position 0");
          } else if (typeof (pl as any).setPositionAsync === "function") {
            (pl as any).setPositionAsync(0).catch(() => {});
            console.log("⏮️ Seeked slot1 to position 0 (async)");
          }
        } catch (e) {
          console.log("Could not seek slot1 to start:", e);
        }

        watchPlayerReady(pl, 1);
      } else {
        slotReadyRef.current[1] = false;
        slotPlayersRef.current[1] = null;
      }
    } catch {}
  });

  // When currentIndex changes: on Android, load into inactive slot and swap
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const target = posts[currentIndex];
    if (!target || !target.media_url) return;
    const targetUri = String(target.media_url);

    // If already in a slot and ready, switch immediately
    if (slotAUri === targetUri && slotReadyRef.current[0]) {
      // ✅ Show swap placeholder briefly to cover transition
      setAndroidSwapInProgress(true);

      // ✅ Pause the other slot before switching
      const prevPlayer = slotPlayersRef.current[1];
      if (prevPlayer) {
        try {
          if (typeof prevPlayer.pause === "function") {
            prevPlayer.pause();
          } else if (typeof prevPlayer.pauseAsync === "function") {
            prevPlayer.pauseAsync().catch(() => {});
          }
          console.log("🔇 Paused slot1 player before switching to slot0");
        } catch (e) {
          console.error("Error pausing slot1:", e);
        }
      }

      setActiveSlot(0);
      playerRef.current = slotPlayersRef.current[0] ?? playerRef.current;
      setMediaLoading(false);
      setShowLoadingSpinner(false);
      setShowLoadingThumbnail(false);

      // ✅ Ensure the new active player is playing
      const newPlayer = slotPlayersRef.current[0];
      if (newPlayer) {
        try {
          if (typeof newPlayer.play === "function") {
            newPlayer.play();
          } else if (typeof newPlayer.playAsync === "function") {
            newPlayer.playAsync().catch(() => {});
          }
          console.log("▶️ Started slot0 player");

          // ✅ CRITICAL: Wait for video to actually start playing before removing placeholder
          // This prevents flickering by ensuring the first frame is rendered
          if (typeof newPlayer.getStatusAsync === "function") {
            let waitedMs = 0;
            const CHECK_MS = 50;
            const MAX_MS = 800;
            const pollInterval = setInterval(async () => {
              try {
                const status: any = await newPlayer.getStatusAsync();
                const isPlaying = !!status?.isPlaying;
                const pos = Number(
                  status?.positionMillis ?? status?.position ?? 0
                );
                // Wait for both playing AND position to advance
                if (isPlaying && pos > 50) {
                  clearInterval(pollInterval);
                  setTimeout(() => {
                    setAndroidSwapInProgress(false);
                  }, 150); // Small additional delay for surface rendering
                  return;
                }
              } catch {}
              waitedMs += CHECK_MS;
              if (waitedMs >= MAX_MS) {
                clearInterval(pollInterval);
                setTimeout(() => {
                  setAndroidSwapInProgress(false);
                }, 150);
              }
            }, CHECK_MS);
          } else {
            // Fallback: use timeout if getStatusAsync not available
            setTimeout(() => {
              setAndroidSwapInProgress(false);
            }, 600);
          }
        } catch (e) {
          console.error("Error playing slot0:", e);
          setTimeout(() => {
            setAndroidSwapInProgress(false);
          }, 400);
        }
      } else {
        setTimeout(() => {
          setAndroidSwapInProgress(false);
        }, 400);
      }
      return;
    }
    if (slotBUri === targetUri && slotReadyRef.current[1]) {
      // ✅ Show swap placeholder briefly to cover transition
      setAndroidSwapInProgress(true);

      // ✅ Pause the other slot before switching
      const prevPlayer = slotPlayersRef.current[0];
      if (prevPlayer) {
        try {
          if (typeof prevPlayer.pause === "function") {
            prevPlayer.pause();
          } else if (typeof prevPlayer.pauseAsync === "function") {
            prevPlayer.pauseAsync().catch(() => {});
          }
          console.log("🔇 Paused slot0 player before switching to slot1");
        } catch (e) {
          console.error("Error pausing slot0:", e);
        }
      }

      setActiveSlot(1);
      playerRef.current = slotPlayersRef.current[1] ?? playerRef.current;
      setMediaLoading(false);
      setShowLoadingSpinner(false);
      setShowLoadingThumbnail(false);

      // ✅ Ensure the new active player is playing
      const newPlayer = slotPlayersRef.current[1];
      if (newPlayer) {
        try {
          if (typeof newPlayer.play === "function") {
            newPlayer.play();
          } else if (typeof newPlayer.playAsync === "function") {
            newPlayer.playAsync().catch(() => {});
          }
          console.log("▶️ Started slot1 player");

          // ✅ CRITICAL: Wait for video to actually start playing before removing placeholder
          // This prevents flickering by ensuring the first frame is rendered
          if (typeof newPlayer.getStatusAsync === "function") {
            let waitedMs = 0;
            const CHECK_MS = 50;
            const MAX_MS = 800;
            const pollInterval = setInterval(async () => {
              try {
                const status: any = await newPlayer.getStatusAsync();
                const isPlaying = !!status?.isPlaying;
                const pos = Number(
                  status?.positionMillis ?? status?.position ?? 0
                );
                // Wait for both playing AND position to advance
                if (isPlaying && pos > 50) {
                  clearInterval(pollInterval);
                  setTimeout(() => {
                    setAndroidSwapInProgress(false);
                  }, 150); // Small additional delay for surface rendering
                  return;
                }
              } catch {}
              waitedMs += CHECK_MS;
              if (waitedMs >= MAX_MS) {
                clearInterval(pollInterval);
                setTimeout(() => {
                  setAndroidSwapInProgress(false);
                }, 150);
              }
            }, CHECK_MS);
          } else {
            // Fallback: use timeout if getStatusAsync not available
            setTimeout(() => {
              setAndroidSwapInProgress(false);
            }, 600);
          }
        } catch (e) {
          console.error("Error playing slot1:", e);
          setTimeout(() => {
            setAndroidSwapInProgress(false);
          }, 400);
        }
      } else {
        setTimeout(() => {
          setAndroidSwapInProgress(false);
        }, 400);
      }
      return;
    }

    // Otherwise load into inactive slot
    const inactive = activeSlot === 0 ? 1 : 0;

    // ✅ CRITICAL FIX: Immediately hide the inactive slot's opacity BEFORE loading new content
    // This prevents showing the previous video's last frame during the load
    if (inactive === 0) {
      slot0Opacity.value = 0; // Hide slot0 immediately
    } else {
      slot1Opacity.value = 0; // Hide slot1 immediately
    }

    // ✅ CRITICAL: Immediately pause and hide the inactive slot before loading new content
    // This prevents showing stale frames from the previous video
    const inactivePlayer = slotPlayersRef.current[inactive];
    if (inactivePlayer) {
      try {
        // Mute immediately
        if (typeof inactivePlayer.setIsMuted === "function") {
          inactivePlayer.setIsMuted(true);
        } else if ("muted" in inactivePlayer) {
          inactivePlayer.muted = true;
        }

        // Pause
        if (typeof inactivePlayer.pause === "function") {
          inactivePlayer.pause();
        } else if (typeof inactivePlayer.pauseAsync === "function") {
          inactivePlayer.pauseAsync().catch(() => {});
        }
        console.log(
          `🔇 Pre-emptively hidden, muted and paused slot${inactive} before loading new content`
        );
      } catch (e) {
        console.error(`Error pre-pausing slot${inactive}:`, e);
      }
    }

    // Mark the inactive slot as not ready immediately to prevent premature switching
    slotReadyRef.current[inactive] = false;

    // prefer local cached file if present
    const localCached = localFileUrisRef.current.get(currentIndex);
    const uriToUse = localCached ?? targetUri;
    if (inactive === 0) setSlotAUri(uriToUse);
    else setSlotBUri(uriToUse);
    // show loading and start the android swap guard so we render a placeholder
    // until the new slot is ready and playing
    setMediaLoading(true);
    setAndroidSwapInProgress(true);
    setShowLoadingSpinner(false);
    setShowLoadingThumbnail(false);

    // wait for readiness (with timeout)
    let waited = 0;
    const interval = setInterval(async () => {
      if (slotReadyRef.current[inactive]) {
        clearInterval(interval);
        // pause previous player if possible
        try {
          const prev = slotPlayersRef.current[activeSlot];
          if (prev) {
            if (typeof prev.pause === "function") prev.pause();
            else if (typeof prev.pauseAsync === "function")
              await prev.pauseAsync().catch(() => {});
          }
        } catch {}

        // attach new active player
        setActiveSlot(inactive);
        playerRef.current =
          slotPlayersRef.current[inactive] ?? playerRef.current;

        // start playback on new player
        try {
          const p = playerRef.current as any;
          if (p) {
            if (typeof p.playAsync === "function")
              await p.playAsync().catch(() => {});
            else if (typeof p.play === "function") p.play();

            // After requesting playback, poll the player status briefly until
            // it reports isPlaying or a non-zero position. This avoids hiding
            // the placeholder (and thereby exposing previous frame) before the
            // native surface has actually rendered the new frame.
            if (typeof p.getStatusAsync === "function") {
              let waitedMs = 0;
              const CHECK_MS = 50; // Check more frequently
              const MAX_MS = 1000; // Wait longer for video to actually start playing
              try {
                await new Promise<void>((resolve) => {
                  const tid = setInterval(async () => {
                    try {
                      const s: any = await p.getStatusAsync();
                      const isPlaying = !!s?.isPlaying;
                      const pos = Number(s?.positionMillis ?? s?.position ?? 0);
                      // ✅ Wait for BOTH playing AND position to advance (ensures frame is rendered)
                      if (isPlaying && pos > 50) {
                        clearInterval(tid);
                        resolve();
                        return;
                      }
                    } catch {
                      // ignore transient errors while polling
                    }
                    waitedMs += CHECK_MS;
                    if (waitedMs >= MAX_MS) {
                      clearInterval(tid);
                      resolve();
                    }
                  }, CHECK_MS);
                });
              } catch {}
            }
          }
        } catch {}

        setMediaLoading(false);
        setShowLoadingSpinner(false);
        setShowLoadingThumbnail(false);

        // ✅ CRITICAL: Keep placeholder visible longer to ensure video surface has fully rendered
        // Android's TextureView needs extra time to show the first frame
        setTimeout(() => {
          setAndroidSwapInProgress(false);
        }, 500); // Increased from 250ms to 500ms for better coverage
      } else {
        waited += 120;
        if (waited > 3000) {
          // timeout: give up and show spinner as fallback
          clearInterval(interval);
          setShowLoadingSpinner(true);
          // stop forcing the swap placeholder on timeout
          setAndroidSwapInProgress(false);
        }
      }
    }, 120);

    return () => clearInterval(interval);
  }, [
    currentIndex,
    slotAUri,
    slotBUri,
    activeSlot,
    posts,
    slot0Opacity,
    slot1Opacity,
  ]);

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

                  // Full download - write to FileSystem cache and use local file
                  (async () => {
                    try {
                      if (downloadingSetRef.current.has(nextIndex)) return;
                      // Limit concurrent downloads to 2
                      if (downloadingSetRef.current.size >= 2) return;
                      downloadingSetRef.current.add(nextIndex);
                      const filename = `reel_${nextIndex}.mp4`;
                      const cacheDir =
                        (FileSystem as any).cacheDirectory ??
                        (FileSystem as any).documentDirectory ??
                        "";
                      const localPath = cacheDir + filename;

                      // If file already present, reuse it
                      const info = await FileSystem.getInfoAsync(localPath);
                      if (!info.exists) {
                        console.log(
                          `📥 Downloading next video ${nextIndex} to cache:`,
                          localPath
                        );
                        await FileSystem.downloadAsync(
                          nextPost.media_url,
                          localPath
                        );
                      } else {
                        console.log(
                          `📦 Reusing cached video for ${nextIndex}: ${localPath}`
                        );
                      }

                      localFileUrisRef.current.set(nextIndex, localPath);
                      preloadedPlayersRef.current.set(
                        nextIndex,
                        "fully-loaded-local"
                      );
                      loadedSetRef.current.add(nextIndex);
                      console.log(
                        `✅ ⚡ Next video ${nextIndex} cached locally and marked ready`
                      );

                      if (nextPost.thumbnail_url) {
                        Image.prefetch(nextPost.thumbnail_url).catch(() => {});
                      }
                    } catch (err) {
                      console.log(
                        `❌ Failed to download next video ${nextIndex}:`,
                        err
                      );
                      preloadedPlayersRef.current.delete(nextIndex);
                      loadedSetRef.current.delete(nextIndex);
                      // remove any partial file
                      try {
                        const filename = `reel_${nextIndex}.mp4`;
                        const cacheDir =
                          (FileSystem as any).cacheDirectory ??
                          (FileSystem as any).documentDirectory ??
                          "";
                        const localPath = cacheDir + filename;
                        await FileSystem.deleteAsync(localPath, {
                          idempotent: true,
                        });
                      } catch {
                        /* ignore */
                      }
                    } finally {
                      downloadingSetRef.current.delete(nextIndex);
                    }
                  })();
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
          // Remove if outside cache window by more than 2 positions
          if (idx < newCacheStart - 2 || idx > cacheEnd + 2) {
            keysToRemove.push(idx);
          }
        });

        if (keysToRemove.length > 0) {
          console.log(
            `🧹 Cleaning up ${keysToRemove.length} videos outside cache window`
          );
          for (const key of keysToRemove) {
            preloadedPlayersRef.current.delete(key);
            // delete cached file if present
            const local = localFileUrisRef.current.get(key);
            if (local) {
              try {
                await FileSystem.deleteAsync(local, { idempotent: true });
              } catch {
                /* ignore */
              }
              localFileUrisRef.current.delete(key);
            }
          }
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
              // Use centralized handler to ensure players are paused/muted
              handleVideoLoadError(currentIndex, status?.error);
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
                      handleVideoLoadError(currentIndex, response.status);
                    }
                  })
                  .catch((error) => {
                    console.error("❌ Failed to validate video URL:", error);
                    handleVideoLoadError(currentIndex, error);
                  })
                  .finally(() => {
                    if (pollTimer) {
                      clearInterval(pollTimer);
                      pollTimer = null;
                    }
                  });
              } else {
                console.error("❌ Invalid video URL:", videoUrl);
                handleVideoLoadError(currentIndex, "Invalid URL");
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
    if (
      !next.media_url ||
      (typeof next.media_url !== "string" && typeof next.media_url !== "number")
    ) {
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
      setShowLoadingThumbnail(false);
    } else if (isAlreadyLoaded) {
      // Video already loaded before, transition instantly
      console.log(
        `⚡ Video ${currentIndex} already loaded - instant transition`
      );
      setMediaLoading(false);
      setShowLoadingSpinner(false);
      setShowLoadingThumbnail(false);
    } else {
      // First time loading this video
      console.log(`📥 Loading video ${currentIndex} for first time`);
      setMediaLoading(true);
      setShowLoadingSpinner(false);
      // reset thumbnail/show flags
      setShowLoadingThumbnail(false);

      // ✅ Show spinner only after a long delay (2s) so quick swipes don't show it
      loadingTimeoutRef.current = setTimeout(async () => {
        try {
          const playing = await isIndexPlayingOrLoaded(currentIndex);
          if (playing) return;
        } catch {
          // ignore
        }
        if (!loadedSetRef.current.has(currentIndex)) {
          console.log(`⏳ Showing spinner for video ${currentIndex}`);
          setShowLoadingSpinner(true);
        }
      }, 2000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (loadingThumbTimeoutRef.current) {
        clearTimeout(loadingThumbTimeoutRef.current);
      }
    };
  }, [currentIndex, isIndexPlayingOrLoaded, posts]); // ✅ FIXED: Only depend on currentIndex, not posts array (prevents reload on like/unlike)

  // Handle screen focus/blur - pause when screen is not focused
  useEffect(() => {
    console.log("🎯 Screen focus changed:", focused);
    if (focused && !mediaLoading && !manualPausedRef.current) {
      // ✅ CRITICAL: Only resume if we have valid posts data
      if (posts.length === 0) {
        console.log("⏭️ No posts yet, skipping auto-play on focus");
        return;
      }
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
  }, [focused, mediaLoading, safePlay, safePause, posts.length]);

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
    // Only on unmount - player ref accessed from cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // user finished scrolling
    // On Android, keep suppressing overlays for a short window after the momentum
    // ends to allow the native player surface to settle and render the new frame.
    try {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current as any);
        scrollEndTimeoutRef.current = null as any;
      }
    } catch {}
    if (Platform.OS === "android") {
      // keep suppressing overlays briefly (500ms) so we don't flash the thumbnail
      scrollEndTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
        scrollEndTimeoutRef.current = null as any;
      }, 500);
    } else {
      setIsUserScrolling(false);
    }
    // After user finished the swipe, allow overlays to appear again if still loading.
    // (Don't immediately show spinner; the existing delayed timeout will handle that.)
  };

  const onMomentumScrollBegin = () => {
    // User started an active swipe — immediately suppress any loading UI
    // to avoid flicker while the list is animating between items.
    setIsUserScrolling(true);

    // ✅ CRITICAL FIX for Android: Show swap placeholder immediately when user starts swiping
    // This prevents showing the previous video's last frame during the swipe transition
    if (Platform.OS === "android") {
      setAndroidSwapInProgress(true);
    }

    // Cancel pending spinner timeout and hide overlays immediately
    try {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current as any);
        loadingTimeoutRef.current = null as any;
      }
      if (loadingThumbTimeoutRef.current) {
        clearTimeout(loadingThumbTimeoutRef.current as any);
        loadingThumbTimeoutRef.current = null as any;
      }
    } catch {}
    setShowLoadingSpinner(false);
    setShowLoadingThumbnail(false);
  };

  // Load more reels when approaching the end
  const onEndReached = () => {
    // No pagination needed since all reels are passed from ProfileScreen
    console.log("� Reached end of reels");
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
    // Keep the previous video visible during quick swipes; only hide if there's an actual error
    opacity: hasVideoError ? 0 : 1,
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

    // Note: No API refresh needed since data is passed from ProfileScreen
    // Just clear local state
    setRefreshing(false);
    console.log("✅ Refresh complete");
  }, [safePause, scrollY, user?.id]); // user?.id included for completeness even though checked inside

  // Register tab press handlers for scroll to top and refresh
  useEffect(() => {
    const scrollToTop = () => {
      // For reels/posts screen, always scroll to 0 (first reel)
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      // Reset the current index to first item
      setCurrentIndex(0);
    };

    const refresh = () => {
      // For reels/posts screen, always scroll to 0 (first reel)
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      // Reset the current index to first item
      setCurrentIndex(0);
      // Set refreshing to true to show the loading indicator
      setRefreshing(true);
      setTimeout(() => {
        onRefresh();
      }, 100);
    };

    registerTabPressHandler("posts", { scrollToTop, refresh });

    return () => {
      unregisterTabPressHandler("posts");
    };
  }, [onRefresh]);

  // Watch for upload completion to refresh reels
  const { shouldRefreshReels, clearRefreshTriggers } = useUploadStore();
  useEffect(() => {
    if (shouldRefreshReels) {
      console.log("🔄 Upload complete - refreshing reels");
      onRefresh();
      clearRefreshTriggers();
    }
  }, [shouldRefreshReels, clearRefreshTriggers, onRefresh]);

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
            console.log("� Going back to profile");
            router.back();
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
      {/* Header */}
      <View
        className="absolute top-0 left-0 right-0 z-[100] flex-row items-center px-4"
        style={{
          height: insets.top + 50,
          paddingTop: insets.top,
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-black/50 justify-center items-center"
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-white text-lg font-semibold ml-3 mr-9 text-center">
          {params.username ? `@${params.username}'s Reels` : "Your Reels"}
        </Text>
      </View>

      {/* Shared overlay - non-interactive so touches pass to items */}
      {/* Hide overlay during refresh to prevent positioning issues on iOS */}
      {!refreshing && posts.length > 0 && currentMedia && (
        <Reanimated.View pointerEvents="none" style={overlayStyle}>
          <View
            pointerEvents="none"
            style={{ width, height, backgroundColor: "#000000" }}
          >
            {Platform.OS === "android" ? (
              // Two persistent stacked VideoViews (slot 0 and slot 1) with animated crossfade
              <>
                <Reanimated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 1, // Lower z-index than swap placeholder
                    },
                    slot0Style as any,
                  ]}
                >
                  {slotPlayersRef.current[0] ? (
                    <VideoView
                      player={slotPlayersRef.current[0]}
                      style={videoStyle}
                      contentFit="contain"
                      nativeControls={false}
                      allowsPictureInPicture={false}
                      allowsFullscreen={false}
                      surfaceType="textureView"
                    />
                  ) : null}
                </Reanimated.View>

                <Reanimated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 1, // Lower z-index than swap placeholder
                    },
                    slot1Style as any,
                  ]}
                >
                  {slotPlayersRef.current[1] ? (
                    <VideoView
                      player={slotPlayersRef.current[1]}
                      style={videoStyle}
                      contentFit="contain"
                      nativeControls={false}
                      allowsPictureInPicture={false}
                      allowsFullscreen={false}
                      surfaceType="textureView"
                    />
                  ) : null}
                </Reanimated.View>
                {/* Android placeholder during swap: blurred thumbnail if available,
                    otherwise solid black. This covers native surface artifacts during fast swipes. */}
                {androidSwapInProgress && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#000",
                      zIndex: 100, // Much higher z-index to ensure it's ALWAYS on top
                      elevation: 100, // Android elevation to render above native video surfaces
                    }}
                  >
                    {currentMedia?.thumbnail_url ? (
                      <Image
                        source={{ uri: currentMedia.thumbnail_url }}
                        style={{ width, height }}
                        resizeMode="cover"
                        blurRadius={10} // Slightly more blur for smoother transition
                        onError={() => {}}
                      />
                    ) : null}
                  </View>
                )}
              </>
            ) : (
              <VideoView
                player={playerRef.current ?? (player as any)}
                style={videoStyle}
                contentFit="contain"
                nativeControls={false}
                allowsPictureInPicture={false}
                allowsFullscreen={false}
                surfaceType={undefined}
              />
            )}
          </View>

          {/* mandatory shared thumbnail: visible while mediaLoading is true */}
          {mediaLoading && showLoadingThumbnail && !isUserScrolling && (
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

      {/* ✅ Refresh Loading Indicator Overlay - Shows prominently during refresh */}
      {/* {refreshing && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 60,
            width,
            zIndex: 1000,
            alignItems: "center",
          }}
        >
          <Reanimated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              borderRadius: 50,
              padding: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <ActivityIndicator size="small" color="#4D70D1" />
            <Text
              style={{
                color: "#ffffff",
                marginLeft: 12,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Refreshing...
            </Text>
          </Reanimated.View>
        </View>
      )} */}

      {/* Animated list of posts */}
      <AnimatedFlatList
        // NEW: key forces remount when refreshKey changes (lightweight refresh)
        key={String(refreshKey)}
        ref={flatListRef}
        data={posts}
        keyExtractor={(item: RawReel) => item.id.toString()}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        onMomentumScrollBegin={onMomentumScrollBegin}
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
                likedPostIDs={likedPostIDs}
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
        comments={
          commentsPost && postComments[commentsPost.id]
            ? postComments[commentsPost.id]
            : []
        }
        postId={commentsPost ? String(commentsPost.id) : undefined}
        onSendComment={async (text) => {
          if (commentsPost && user?.id && text.trim()) {
            try {
              console.log("Sending comment:", {
                postID: commentsPost.id,
                content: text,
                userID: user.id,
              });

              // Use the store method to add comment
              await addCommentStore(commentsPost.id, user.id, text);

              console.log("✅ Comment added successfully");
            } catch (error) {
              console.error("❌ Error adding comment:", error);
            }
          }
        }}
        onFetchComments={async (postId) => {
          await fetchCommentsStore(Number(postId));
        }}
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

            const idNum = Number(postId);

            // Read current posts and compute deleted index
            const prevPosts = useReelsStore.getState().reels;
            const deletedIdx = prevPosts.findIndex((p) => p.id === idNum);

            // Remove the reel from the store
            useReelsStore.setState((state) => ({
              reels: state.reels.filter((p) => p.id !== idNum),
            }));

            // Read updated posts immediately from the store
            const newPosts = useReelsStore.getState().reels;

            // Decide new index and media to show so video updates as well
            if (newPosts.length === 0) {
              // No posts left
              setCurrentIndex(0);
              setCurrentMedia(null);
            } else {
              // Compute a sensible new index
              // If we deleted an earlier item, shift current index left to keep
              // the same visual item in view. If we deleted the current item,
              // keep the same index (next item shifted into place) when
              // possible; otherwise clamp to last index.
              const prevIndex = currentIndex;
              let newIndex = prevIndex;

              if (deletedIdx === -1) {
                // Deleted id not found in previous list - keep currentIndex but clamp
                if (newIndex >= newPosts.length) newIndex = newPosts.length - 1;
              } else if (deletedIdx < prevIndex) {
                newIndex = Math.max(0, prevIndex - 1);
              } else if (deletedIdx === prevIndex) {
                newIndex =
                  prevIndex >= newPosts.length
                    ? newPosts.length - 1
                    : prevIndex;
              } else {
                // deletedIdx > prevIndex -> no index shift
                if (newIndex >= newPosts.length) newIndex = newPosts.length - 1;
              }

              // Apply index and media. Setting both ensures the player hook sees the new URI.
              setCurrentIndex(newIndex);
              setCurrentMedia(newPosts[newIndex]);
            }

            // Close the options sheet
            setShowPostOptionsFor(null);

            console.log(`✅ Reel ${postId} deleted successfully`);
          } catch (error) {
            console.error("❌ Error deleting reel:", error);
          }
        }}
        user={user}
      />

      <ReportPostBottomSheet
        show={reportVisible}
        setShow={setReportVisible}
        postId={focusedPost?.id || ""}
        userId={user?.id || ""}
      />
    </View>
  );
};

export default ProfileReelsFeed;
