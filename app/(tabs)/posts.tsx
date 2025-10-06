// src/screens/VideoFeed.tsx
/// <reference types="react" />
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import { USERS } from "@/constants/PostCreation";
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useVideoPlayer, VideoView, type VideoPlayer } from "expo-video";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
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

const { width, height } = Dimensions.get("window");
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

// Remote video URLs with different aspect ratios
const SAMPLE_REMOTE_VIDEOS = [
  // 16:9 landscape
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    aspectRatio: "16:9",
  },
  // 9:16 vertical/portrait
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    aspectRatio: "9:16",
  },
  // 1:1 square
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
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
    caption: `This is a sample caption for reel #${id}. Video aspect ratio: ${videoData.aspectRatio}. Additional details and hashtags #bird #dj #video #bb #hero #dog #wired #god #cricket #greatleader #srikanth #beauty.`,
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

    const renderCaptionParts = (text: string) => {
      const parts = text.split(/(\s+)/);
      return parts.map((part, i) => {
        if (!part.trim()) return <Text key={`sp-${i}`}>{part}</Text>;
        if (part.startsWith("#")) {
          const tag = part.replace(/[^#\w-]/g, "");
          return (
            <Text
              key={`h-${i}`}
              onPress={() => {
                console.log("hashtag clicked:", tag);
              }}
              className="font-bold"
            >
              {part}
            </Text>
          );
        }
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
            onPress={() => {}}
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
                <StyledText
                  className="text-white font-bold text-lg mr-2"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.username}
                </StyledText>
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
              className="text-white text-lg mt-2 leading-7"
            >
              {captionOpen ? (
                <>
                  {renderCaptionParts(item.caption ?? "")}
                  <Text
                    onPress={() => setCaptionOpen(false)}
                    style={{ color: "rgba(255,255,255,0.75)" }}
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
                      style={{ color: "rgba(255,255,255,0.75)" }}
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

  // track per-index manual pause state map
  const pausedMapRef = useRef<Map<number, boolean>>(new Map());
  const manualPausedRef = useRef(false);

  // tap timing refs for distinguishing single vs double tap
  const lastTapRef = useRef<number | null>(null);
  const singleTapTimeoutRef = useRef<any>(null);

  // parent-level center icon state and playing state
  const [centerVisible, setCenterVisible] = useState(false);
  const [isPlayingState, setIsPlayingState] = useState(false);

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

  // PRELOAD next and previous videos for Instagram-like smooth transitions
  useEffect(() => {
    const preloadNearbyVideos = async () => {
      try {
        // Preload next video
        const nextIndex = currentIndex + 1;
        if (
          nextIndex < posts.length &&
          !preloadedPlayersRef.current.has(nextIndex)
        ) {
          const nextPost = posts[nextIndex];
          if (nextPost?.media_url && typeof nextPost.media_url === "string") {
            // Mark as loading to prevent duplicate preloads
            preloadedPlayersRef.current.set(nextIndex, "loading");
            // Prefetch the video URL to cache it
            fetch(nextPost.media_url, { method: "HEAD" }).catch(() => {});
          }
        }

        // Preload previous video
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0 && !preloadedPlayersRef.current.has(prevIndex)) {
          const prevPost = posts[prevIndex];
          if (prevPost?.media_url && typeof prevPost.media_url === "string") {
            preloadedPlayersRef.current.set(prevIndex, "loading");
            fetch(prevPost.media_url, { method: "HEAD" }).catch(() => {});
          }
        }
      } catch (e) {
        console.log("Preload error:", e);
      }
    };

    // Delay preload slightly to prioritize current video
    const preloadTimer = setTimeout(preloadNearbyVideos, 200);
    return () => clearTimeout(preloadTimer);
  }, [currentIndex, posts]);

  // monitor player status for load -> autoplay (handles initial & switches)
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(async () => {
        try {
          const p = playerRef.current ?? (player as any);
          if (!p || cancelled) return;
          if (typeof p.getStatusAsync === "function") {
            const status: any = await p.getStatusAsync();
            const readyToRender =
              status?.isLoaded &&
              !status?.isBuffering &&
              (status?.isPlaying ||
                (typeof status?.positionMillis === "number" &&
                  status.positionMillis > 20));
            if (readyToRender) {
              if (cancelled) return;
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
        } catch (e) {
          // ignore
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
  }, [currentMedia, safePlay, safePause, currentIndex]);

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
      }, 100);
    } else {
      // Show loading spinner after 800ms if still loading (network issue)
      loadingTimeoutRef.current = setTimeout(() => {
        if (!loadedSetRef.current.has(currentIndex)) {
          setShowLoadingSpinner(true);
        }
      }, 800);
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
  const videoStyle = {
    width,
    height,
    backgroundColor: "black",
    // Hide video during loading to prevent previous video from showing, show when ready
    opacity: mediaLoading ? 0 : 1,
    zIndex: 0,
  } as any;

  // shared thumbnail overlay is mandatory while mediaLoading is true
  const sharedThumbStyle = {
    position: "absolute",
    left: 0,
    top: 0,
    width,
    height,
    zIndex: 10, // Higher z-index to cover video during transition
  } as const;

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
        {mediaLoading && currentMedia?.thumbnail_url && (
          <View pointerEvents="none" style={sharedThumbStyle}>
            <Image
              source={{ uri: currentMedia.thumbnail_url }}
              style={{ width, height }}
              resizeMode="cover"
              onError={() => {
                /* If thumbnail fails, we still avoid blank screen; keep this silent or log as needed */
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.12)",
              }}
            />

            {/* Loading spinner - only show if taking too long (network issue) */}
            {showLoadingSpinner && (
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            )}
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
                  navigation.navigate?.("NonTabProfile", { user: uid })
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
