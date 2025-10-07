// app/(tabs)/posts.tsx
/// <reference types="react" />
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import { USERS } from "@/constants/PostCreation";
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
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
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Reanimated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Send from "../../assets/posts/send.svg";

// ✅ Added: import the comments sheet component + handle
import CommentsSheet, { CommentsSheetHandle } from "@/components/Comment";

const { width, height } = Dimensions.get("window");
const BOTTOM_NAV_HEIGHT = 80;
const TRUNCATE_LEN = 25;
const router = useRouter();

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

// Remote video URLs with different aspect ratios
const SAMPLE_REMOTE_VIDEOS = [
  // 16:9 landscape
  {
    url: "https://cdn.pixabay.com/video/2022/07/24/125314-733046618_tiny.mp4",
    aspectRatio: "16:9",
  },
  // 9:16 vertical/portrait
  {
    url: "https://cdn.pixabay.com/video/2022/11/07/138173-768820177_large.mp4",
    aspectRatio: "9:16",
  },
  // 1:1 square
  {
    url: "https://cdn.pixabay.com/video/2023/11/19/189692-886572510_tiny.mp4",
    aspectRatio: "1:1",
  },
  // 4:5 portrait (Instagram style)
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    aspectRatio: "4:5",
  },
  // 9:16 vertical
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    aspectRatio: "9:16",
  },
  // 16:9 landscape - replaced broken Chromecast URL
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    aspectRatio: "16:9",
  },
  // 9:16 vertical
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    aspectRatio: "9:16",
  },
  // 1:1 square
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    aspectRatio: "1:1",
  },
];

const DUMMY_POSTS: Post[] = Array.from({ length: 8 }).map((_, i) => {
  const videoData = SAMPLE_REMOTE_VIDEOS[i % SAMPLE_REMOTE_VIDEOS.length];
  const user = USERS[i % USERS.length];
  const id = i + 1;
  return {
    id,
    media_url: videoData.url,
    thumbnail_url: `https://via.placeholder.com/800x1200.png?text=thumb+${id}`,
    photoURL: user?.avatar ?? "https://via.placeholder.com/100.png",
    username: user?.username ?? `user_${id}`,
    user_id: Number(user?.id ?? id),
    verified: i % 3 === 0,
    caption: `This is a sample caption for reel #${id}. Video aspect ratio: ${videoData.aspectRatio}. Additional details and hashtags #bird #dj #video #bb #hero #dog #wired #god #cricket #greatleader #srikanth #beauty #LYNKD.`,
    likes: Math.floor(Math.random() * 200),
    commentsCount: Math.floor(Math.random() * 20),
    shareUrl: `https://example.com/reel/${id}`,
    liked: false,
    following: false,
    isProduct: id === 2 || id === 5,
    productCount: id === 2 ? "23k" : id === 5 ? "1.2k" : undefined,
  };
});

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
  item: Post;
  index: number;
  active: boolean;
  onOpenProfile: (uid?: number) => void;
  onToggleLike: () => void;
  onOpenPostOptions: () => void;
  isFavorited: boolean;
  onToggleFollow: (uid?: number) => void;
  isFollowing: boolean;
  setPostsState?: React.Dispatch<React.SetStateAction<Post[]>>;
  onOverlayPress: () => void;
  centerVisible: boolean;
  isPlaying: boolean;
  onCenterToggle: () => void;
  // ✅ Added: a callback to open comments for this item
  onOpenComments: () => void;
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
    setPostsState,
    onOverlayPress,
    centerVisible,
    isPlaying,
    onCenterToggle,
    onOpenComments, // ✅ Added
  }: any) => {
    const [imgLoading, setImgLoading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [localFollowing, setLocalFollowing] = useState<boolean>(
      !!item.following
    );

    useEffect(() => setLocalFollowing(!!item.following), [item.following]);

    const userFromList = USERS.find(
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

    const onShare = async () => {
      try {
        const url =
          item.shareUrl ??
          (typeof item.media_url === "string"
            ? item.media_url
            : `https://example.com/reel/${item.id}`);
        await Share.share({ message: url, url });
      } catch (e) {
        console.error("share error", e);
      }
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
                onLongPress={onOpenPostOptions}>
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
                onLongPress={onOpenPostOptions}>
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
                onLongPress={onOpenPostOptions}>
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
            style={{ zIndex: 30 }}>
            <TouchableOpacity onPress={onCenterToggle} activeOpacity={0.9}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.32)",
                }}>
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
          style={{ zIndex: 30 }}>
          {item.isProduct && (
            <>
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center mb-1 bg-white/20"
                onPress={() => {}}
                activeOpacity={0.8}>
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
            activeOpacity={0.8}>
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
            activeOpacity={0.8}>
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xs mt-2">
            {(item.commentsCount ?? 0).toString()}
          </Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={onShare}
            activeOpacity={0.8}>
            <Send width={20} height={20} />
          </TouchableOpacity>
          <Text className="text-white text-xs mt-2">Share</Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={() => onOpenPostOptions()}
            activeOpacity={0.8}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* bottom profile + caption (lifted above overlays) */}
        <View
          className="absolute left-3 right-3 rounded-2xl px-3 py-3 bg-black/20"
          style={{
            bottom: BOTTOM_NAV_HEIGHT + 10,
            zIndex: 40,
          }}>
          <TouchableOpacity
            onPress={() => {
              onToggleFollow(item.user_id);
              setLocalFollowing((s) => !s);
            }}
            activeOpacity={0.95}
            className="absolute right-3 top-2 z-10 rounded-full px-3 py-1 border border-white/70 bg-white/8">
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
                  activeOpacity={0.7}>
                  <StyledText
                    className="text-white font-bold text-base mr-2"
                    numberOfLines={1}
                    ellipsizeMode="tail">
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
            style={[{ overflow: "hidden" }, captionAnimatedStyle]}>
            <Text
              numberOfLines={captionOpen ? undefined : 1}
              ellipsizeMode="tail"
              className="text-white text-base mt-2 leading-7">
              {captionOpen ? (
                <>
                  {renderCaptionParts(item.caption ?? "")}
                  <Text
                    onPress={() => setCaptionOpen(false)}
                    style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                    {"  "}Show less
                  </Text>
                </>
              ) : (
                <>
                  {renderCaptionParts(collapsedCaption)}
                  {needsTruncate ? (
                    <Text
                      onPress={() => setCaptionOpen(true)}
                      style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                      {" "}
                      ... more
                    </Text>
                  ) : null}
                </>
              )}
            </Text>
          </Reanimated.View>
        </View>
      </View>
    );
  }
);

PostItem.displayName = "PostItem";

/* ----------------- MAIN: single shared player overlay + AnimatedFlatList ----------------- */
const VideoFeed: React.FC = () => {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList<Post> | null>(null);
  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);
  const [showPostOptionsFor, setShowPostOptionsFor] = useState<Post | null>(
    null
  );

  const focused = useIsFocused();

  // ----- NEW (minimal): refreshKey to force lightweight remount on tab re-tap -----
  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());

  // reanimated scroll tracking
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((ev) => {
    scrollY.value = ev.contentOffset.y;
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
  const [currentMedia, setCurrentMedia] = useState<Post | null>(
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

  // ✅ Added: comments sheet ref + selected post state
  const commentsRef = useRef<CommentsSheetHandle>(null);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);

  // ✅ Added: open comments handler
  const openCommentsFor = useCallback((post: Post) => {
    setCommentsPost(post);
    commentsRef.current?.present();
  }, []);

  // create single player for currentMedia
  const player = useVideoPlayer(
    currentMedia ? currentMedia.media_url : null,
    (pl) => {
      console.log("🎬 Player created for:", currentMedia?.media_url);
      playerRef.current = pl as any;
      releasedRef.current = false;
      try {
        if (pl) {
          // apply looping & unmuted on the player instance (not the VideoView props)
          if (typeof (pl as any).setIsLooping === "function")
            (pl as any).setIsLooping(true);
          else if ("loop" in (pl as any)) (pl as any).loop = true;

          // Enable sound (unmuted)
          if (typeof (pl as any).setIsMuted === "function")
            (pl as any).setIsMuted(false);
          else if ("muted" in (pl as any)) (pl as any).muted = false;
        }
      } catch {}
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
      if (!p) return;
      if (releasedRef.current) return;
      if (typeof p !== "object") return;

      // start fresh (seek to 0 before play)
      if (typeof (p as any).setPositionAsync === "function") {
        try {
          await (p as any).setPositionAsync(0);
        } catch {}
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

      if (typeof (p as any).playAsync === "function") {
        await (p as any).playAsync();
        return;
      }
      if (typeof (p as any).play === "function") {
        (p as any).play();
      }
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (/already released|shared object|Cannot use shared object/i.test(msg))
        return;
      console.warn("safePlay failed", e);
    }
  }, [player]);

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
          const userFromList = USERS.find(
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
      } catch (e) {}
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

            // Trigger aggressive preloading of next videos
            const nextIndex = currentIndex + 1;
            const nextNextIndex = currentIndex + 2;

            // Preload next video completely
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
                    `📥 Starting full download of video ${nextIndex} while video ${currentIndex} plays`
                  );

                  fetch(nextPost.media_url, { method: "GET" })
                    .then(() => {
                      preloadedPlayersRef.current.set(
                        nextIndex,
                        "fully-loaded"
                      );
                      console.log(
                        `✅ Fully loaded video ${nextIndex} during playback`
                      );

                      // Also preload thumbnail
                      if (nextPost.thumbnail_url) {
                        Image.prefetch(nextPost.thumbnail_url).catch(() => {});
                      }
                    })
                    .catch((err) => {
                      console.log(
                        `❌ Failed to preload video ${nextIndex}:`,
                        err
                      );
                      preloadedPlayersRef.current.delete(nextIndex);
                    });
                }
              }
            }

            // Preload next 2-3 videos partially for smooth scrolling
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

                  fetch(nextPost.media_url, {
                    method: "GET",
                    headers: { Range: "bytes=0-307200" }, // 300KB for better cache
                  })
                    .then(() => {
                      preloadedPlayersRef.current.set(idx, "loaded");
                      console.log(`✅ Preloaded video ${idx} during playback`);
                    })
                    .catch(() => {
                      preloadedPlayersRef.current.delete(idx);
                    });
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

            // When video is 30% played, ensure next video is fully loaded
            if (progress > 0.3 && progress < 0.4) {
              const nextIndex = currentIndex + 1;
              if (
                nextIndex < posts.length &&
                preloadedPlayersRef.current.get(nextIndex) !== "fully-loaded"
              ) {
                console.log(
                  `🎯 Video ${currentIndex} at 30% - ensuring next video fully loaded`
                );
              }
            }
          }
        }
      } catch (error) {}
    };

    // Start monitoring when video is likely playing
    if (isPlayingState && !mediaLoading) {
      playbackMonitor = setInterval(monitorPlaybackAndPreload, 1000); // Check every second
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
    const MAX_POLL_COUNT = 100; // 10 seconds max (100ms * 100)

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
            // Improved ready detection: video is ready when loaded and has minimal buffering
            const readyToRender =
              status?.isLoaded &&
              (!status?.isBuffering ||
                status?.isPlaying ||
                (typeof status?.positionMillis === "number" &&
                  status.positionMillis > 0));

            if (readyToRender) {
              if (cancelled) return;
              if (!loadedSetRef.current.has(currentIndex)) {
                loadedSetRef.current.add(currentIndex);
                setLoadedVersion((v) => v + 1);
                console.log(
                  `✅ Video ${currentIndex} loaded after ${pollCount} polls`
                );
              }
              setMediaLoading(false);
              setShowLoadingSpinner(false);
              const pausedForIndex =
                pausedMapRef.current.get(currentIndex) ?? false;
              manualPausedRef.current = pausedForIndex;
              if (!pausedForIndex) {
                await safePlay();
                setIsPlayingState(true);
              } else {
                await safePause();
                setIsPlayingState(false);
              }
              if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
              }
            }
          } else {
            // fallback behavior if status API not present
            console.log(
              "📹 Using fallback loading detection for index:",
              currentIndex
            );
            if (!loadedSetRef.current.has(currentIndex)) {
              loadedSetRef.current.add(currentIndex);
              setLoadedVersion((v) => v + 1);
              console.log(
                "✅ Video marked as loaded (fallback):",
                currentIndex
              );
            }
            setMediaLoading(false);
            setShowLoadingSpinner(false);
            const pausedForIndex =
              pausedMapRef.current.get(currentIndex) ?? false;
            manualPausedRef.current = pausedForIndex;
            if (!pausedForIndex) {
              await safePlay();
              setIsPlayingState(true);
            } else {
              await safePause();
              setIsPlayingState(false);
            }
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
          }
        } catch (error) {
          // ignore but log for debugging
          console.log("Poll error:", error);
        }
      }, 100);
    };

    setMediaLoading(true);
    const startDelay = setTimeout(() => startPolling(), 30);

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
    if (!next) return;

    // don't recreate player on posts change — only update currentMedia when index changes
    manualPausedRef.current = pausedMapRef.current.get(currentIndex) ?? false;
    setCenterVisible(false);

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

    // Always set loading to true first to show thumbnail immediately and hide previous video
    setMediaLoading(true);
    setShowLoadingSpinner(false);
    setCurrentMedia(next);

    // Check if already loaded (cached/preloaded)
    if (loadedSetRef.current.has(currentIndex)) {
      // Video already loaded, show it quickly
      setTimeout(() => {
        setMediaLoading(false);
        setShowLoadingSpinner(false);
      }, 50); // Reduced delay for faster transition
    } else {
      // Show loading spinner after 500ms if still loading (network issue)
      // Reduced from 800ms for better user feedback
      loadingTimeoutRef.current = setTimeout(() => {
        if (!loadedSetRef.current.has(currentIndex)) {
          console.log(`⏳ Showing spinner for video ${currentIndex}`);
          setShowLoadingSpinner(true);
        }
      }, 500);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]); // intentionally not depending on `posts`  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      (async () => {
        try {
          await tryRelease(playerRef.current ?? player);
        } catch (e) {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // DOUBLE TAP ACTION: toggle like for the current post (no big heart overlay)
      setPosts((prev) =>
        prev.map((p, i) =>
          i === currentIndex
            ? {
                ...p,
                liked: !p.liked,
                likes: (p.likes ?? 0) + (p.liked ? -1 : 1),
              }
            : p
        )
      );
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
    } catch (e) {}
  };

  // viewability
  const viewabilityConfig = { itemVisiblePercentThreshold: 75 } as const;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems?: any[] }) => {
      if (!viewableItems || viewableItems.length === 0) return;
      const firstVisible = viewableItems[0];
      if (typeof firstVisible?.index === "number")
        setCurrentIndex(firstVisible.index);
    }
  ).current;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y ?? 0;
    const index = Math.round(y / height);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  // video style — keep under PostItem
  // Important: completely hide video during loading to prevent flicker on Android
  const videoStyle = {
    width,
    height,
    backgroundColor: "#000000",
    // Hide video completely during loading to prevent previous video from showing
    opacity: mediaLoading ? 0 : 1,
    display: mediaLoading ? "none" : "flex", // Extra safety for Android
    zIndex: mediaLoading ? -1 : 0, // Push behind during loading
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
    zIndex: 15, // Higher z-index to definitely cover video during transition
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

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Shared overlay - non-interactive so touches pass to items */}
      <Reanimated.View pointerEvents="none" style={overlayStyle}>
        <View pointerEvents="none" style={{ width, height }}>
          <VideoView
            player={playerRef.current ?? (player as any)}
            style={videoStyle}
            contentFit="contain"
            nativeControls={false}
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
              }}>
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.4)",
                  borderRadius: 50,
                  padding: 16,
                }}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            </View>
          </View>
        )}
      </Reanimated.View>

      {/* Animated list of posts */}
      <AnimatedFlatList
        // NEW: key forces remount when refreshKey changes (lightweight refresh)
        key={String(refreshKey)}
        ref={flatListRef}
        data={posts}
        keyExtractor={(item: Post) => item.id.toString()}
        renderItem={({ item, index }: ListRenderItemInfo<Post>) => {
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
                onToggleLike={() =>
                  setPosts((prev) =>
                    prev.map((p, i) =>
                      i === index
                        ? {
                            ...p,
                            liked: !p.liked,
                            likes: (p.likes ?? 0) + (p.liked ? -1 : 1),
                          }
                        : p
                    )
                  )
                }
                onOpenPostOptions={() => setShowPostOptionsFor(item)}
                isFavorited={!!item.liked}
                onToggleFollow={(uid?: number) => {
                  if (uid == null) return;
                  setFollowedUsers((prev) =>
                    prev.includes(uid)
                      ? prev.filter((x) => x !== uid)
                      : [...prev, uid]
                  );
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.user_id === uid
                        ? { ...p, following: !(p.following ?? false) }
                        : p
                    )
                  );
                }}
                isFollowing={!!item.following}
                setPostsState={setPosts}
                onOverlayPress={onOverlayPress}
                centerVisible={centerVisible && active}
                isPlaying={isPlayingState && active}
                onCenterToggle={onCenterToggle}
                // ✅ Pass the per-item comments opener
                onOpenComments={() => openCommentsFor(item)}
              />
            </View>
          );
        }}
        pagingEnabled
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
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews={true}
      />

      {/* ✅ Added: Comments sheet instance */}
      <CommentsSheet
        ref={commentsRef}
        snapPoints={["40%", "85%"]}
        title={
          commentsPost ? `Comments • @${commentsPost.username}` : "Comments"
        }
      />

      <PostOptionsBottomSheet
        show={!!showPostOptionsFor}
        setShow={(v: boolean) => {
          if (!v) setShowPostOptionsFor(null);
        }}
        toggleFollow={() => {
          setFollowedUsers((prev) =>
            prev.includes(Number(showPostOptionsFor?.user_id ?? -1))
              ? prev.filter((x) => x !== Number(showPostOptionsFor?.user_id))
              : [...prev, Number(showPostOptionsFor?.user_id)]
          );
        }}
        isFollowing={followedUsers.includes(
          Number(showPostOptionsFor?.user_id ?? -1)
        )}
        focusedPost={showPostOptionsFor}
        setFocusedPost={setShowPostOptionsFor}
        setBlockUser={() => {}}
        setReportVisible={() => {}}
        deleteAction={(postId: string) => {
          setPosts((prev) => prev.filter((p) => p.id !== Number(postId)));
          setShowPostOptionsFor(null);
        }}
        user={{ id: 9999 }}
      />
    </View>
  );
};

export default VideoFeed;
