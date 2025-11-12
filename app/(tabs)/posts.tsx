/* eslint-disable react-hooks/exhaustive-deps */
// app/(tabs)/posts.tsx
/// <reference types="react" />
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useIsFocused } from "@react-navigation/native";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { Asset } from "expo-asset";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  ResizeMode,
  Video,
} from "expo-av";
import { useRouter } from "expo-router";
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
  Image,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Send from "../../assets/posts/send.svg";

// Import components
import CommentsSheet, { CommentsSheetHandle } from "../../components/Comment";
import PostOptionsBottomSheet from "../../components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "../../components/ReportPostBottomSheet";
import ShareSectionBottomSheet from "../../components/ShareSectionBottomSheet";

// Import constants and types
import { USERS as CREATION_USERS } from "../../constants/PostCreation";

// Import hooks and stores
import { useAuth } from "../../hooks/useAuth";
import { useReelsStore } from "../../stores/useReelsStore";

// Import API
import { RawReel } from "../../lib/api/api";
import { apiCall } from "../../lib/api/apiService";

// Use 'screen' instead of 'window' for true fullscreen (includes notch and navigation)
const { width, height } = Dimensions.get("screen");
const BOTTOM_NAV_HEIGHT = 80;
const TRUNCATE_LEN = 25;

// ✅ BATCH LOADING CONSTANTS
const BATCH_LOAD_SIZE = 5; // Load 5 more videos per batch (to match your API)
const BATCH_LOAD_TRIGGER = 3; // Trigger when 2 videos from end

const StyledText: React.FC<any> = ({ children, className, style, ...rest }) => (
  <Text className={className} style={style} {...rest}>
    {children}
  </Text>
);

/* ----------------- MAIN: single shared player overlay + AnimatedFlatList ----------------- */
/**
 * ✅ ENHANCED BATCH LOADING SYSTEM:
 * - Loads 10 videos initially (INITIAL_LOAD_SIZE)
 * - Automatically loads 10 more videos (BATCH_LOAD_SIZE) when user scrolls to 5th video from end (BATCH_LOAD_TRIGGER)
 * - Prevents duplicate batch loads using lastBatchTriggerIndex tracking
 * - Shows visual notification when batch loading is triggered
 * - Includes debug overlay showing current position and batch load status
 * - Integrates with existing sophisticated video preloading and caching system
 */
const VideoFeed: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<any>(null);
  const isFocused = useIsFocused(); // Track if screen is focused

  // ✅ Use Zustand store for reels state management
  const {
    reels,
    isInitialLoading,
    isPrefetching,
    isLoadingMore,
    hasMore,
    error,
    fetchReels,
    loadMoreReels,
    fetchUserLikedPosts,
    toggleLike,
    fetchCommentsOfAPost,
    likedPostIDs,
    postComments,
    addComment,
  } = useReelsStore();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);
  const [showPostOptionsFor, setShowPostOptionsFor] = useState<RawReel | null>(
    null
  );
  const [reportVisible, setReportVisible] = useState(false);
  const [focusedPost] = useState<any>(null);
  // ✅ ENHANCED: Focus-aware video play state management system
  const [videoPlayStates, setVideoPlayStates] = useState<Map<number, boolean>>(
    new Map()
  );
  // ✅ Video error and loading state management
  const [videoErrors, setVideoErrors] = useState<Map<number, boolean>>(
    new Map()
  );
  const [mediaLoadingStates, setMediaLoadingStates] = useState<
    Map<number, boolean>
  >(new Map());

  // Small in-memory cache mapping remote URI -> local file URI (when prefetched)
  const [videoCache, setVideoCache] = useState<Map<string, string>>(new Map());

  // Prefetch progressive mp4s (skip HLS .m3u8) using expo-asset and store local uri
  const prefetchVideo = useCallback(
    async (uri?: string) => {
      try {
        if (!uri || typeof uri !== "string") return;
        // Skip HLS playlists
        if (/\.m3u8($|\?)/i.test(uri)) return;
        if (videoCache.has(uri)) return;
        const asset = Asset.fromURI(uri);
        await asset.downloadAsync();
        const local = (asset as any).localUri ?? asset.uri;
        setVideoCache((prev) => {
          const m = new Map(prev);
          m.set(uri, local);
          return m;
        });
        console.log("✅ Prefetched video:", uri, "->", local);
      } catch (e) {
        console.log("⚠️ Prefetch failed for", uri, e);
      }
    },
    [videoCache]
  );

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  // Prefetch neighbors when currentIndex changes
  useEffect(() => {
    if (!reels || reels.length === 0) return;
    const next = reels[currentIndex + 1]?.media_url;
    const prev = reels[currentIndex - 1]?.media_url;
    prefetchVideo(next);
    prefetchVideo(prev);
  }, [currentIndex, reels, prefetchVideo]);

  // Prefetch first few on initial load
  useEffect(() => {
    if (!reels || reels.length === 0) return;
    const limit = Math.min(3, reels.length);
    for (let i = 0; i < limit; i++) {
      prefetchVideo(reels[i]?.media_url);
    }
  }, [reels.length, prefetchVideo]);

  // ✅ Helper functions for video play state management
  const getVideoPlayState = useCallback(
    (index: number): boolean => {
      return videoPlayStates.get(index) ?? true; // Default to playing
    },
    [videoPlayStates]
  );

  const setVideoPlayState = useCallback((index: number, playing: boolean) => {
    setVideoPlayStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(index, playing);
      return newMap;
    });
  }, []);

  const toggleVideoPlayState = useCallback((index: number) => {
    setVideoPlayStates((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(index) ?? true;
      newMap.set(index, !currentState);
      return newMap;
    });
  }, []);

  // --- Video error state helpers ---
  const getVideoError = useCallback(
    (index: number): boolean => {
      return videoErrors.get(index) ?? false;
    },
    [videoErrors]
  );

  const setVideoError = useCallback((index: number, error: boolean) => {
    setVideoErrors((prev) => {
      const newMap = new Map(prev);
      newMap.set(index, error);
      return newMap;
    });
  }, []);

  // --- Media loading state helpers ---
  const getMediaLoading = useCallback(
    (index: number): boolean => {
      return mediaLoadingStates.get(index) ?? false;
    },
    [mediaLoadingStates]
  );

  const setMediaLoading = useCallback((index: number, loading: boolean) => {
    setMediaLoadingStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(index, loading);
      return newMap;
    });
  }, []);

  // ✅ CRITICAL: Focus-aware video state management - handles tab switches and navigation
  useEffect(() => {
    console.log("🎯 Screen focus changed:", isFocused);

    if (!isFocused) {
      // Screen lost focus - pause all videos immediately
      console.log("⏸️ Screen unfocused - pausing all videos");
      setVideoPlayStates((prev) => {
        const newMap = new Map(prev);
        // Mark all videos as paused but preserve user's manual pause preferences
        reels.forEach((_, index) => {
          newMap.set(index, false);
        });
        return newMap;
      });
    } else {
      // Screen regained focus - restore playing state for current video
      console.log(
        "▶️ Screen focused - resuming current video if it was playing"
      );
      setVideoPlayStates((prev) => {
        const newMap = new Map(prev);
        // Resume the current video (defaulting to playing if no previous state)
        const wasCurrentVideoPlaying = prev.get(currentIndex) ?? true;
        newMap.set(currentIndex, wasCurrentVideoPlaying);
        return newMap;
      });
    }
  }, [isFocused, currentIndex, reels]);

  // ✅ CRITICAL: Enhanced current video management - auto-play when switching videos
  useEffect(() => {
    if (isFocused && reels.length > 0) {
      console.log(
        `🎬 Current video changed to index ${currentIndex}, auto-playing`
      );
      // Auto-play the current video when index changes (only if screen is focused)
      setVideoPlayState(currentIndex, true);
    }
  }, [currentIndex, isFocused, reels.length, setVideoPlayState]);

  // ✅ Added: Batch loading tracking
  const [lastBatchTriggerIndex, setLastBatchTriggerIndex] =
    useState<number>(-1);
  const [showBatchLoadNotification, setShowBatchLoadNotification] =
    useState<boolean>(false);

  // ✅ Added: comments sheet ref + selected post state
  const commentsRef = useRef<CommentsSheetHandle>(null);
  const [commentsPost, setCommentsPost] = useState<RawReel | null>(null);

  // ✅ Added: open comments handler
  const openCommentsFor = useCallback(
    (post: RawReel) => {
      setCommentsPost(post);
      fetchCommentsOfAPost(post.id);
      commentsRef.current?.present();
    },
    [fetchCommentsOfAPost]
  );

  // ✅ Fetch user's liked posts and followings on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserLikedPosts(user.id);
      fetchUserFollowings();
      // Reset batch trigger when user changes
      setLastBatchTriggerIndex(-1);
    }
  }, [user?.id, fetchUserLikedPosts]);

  const fetchUserFollowings = async () => {
    if (!user?.id) return;
    try {
      const response = await apiCall(
        `/api/follows/following/${user.id}`,
        "GET"
      );
      setFollowedUsers(response.following || []);
      console.log(
        "✅ Fetched user followings:",
        response.following?.length || 0
      );
    } catch (error) {
      console.error("❌ Error fetching user followings:", error);
    }
  };

  // ✅ Reset video play states when reels change
  useEffect(() => {
    // Reset all video play states to default (playing) when reels array changes
    if (reels.length > 0) {
      const newPlayStates = new Map<number, boolean>();
      reels.forEach((_, index) => {
        newPlayStates.set(index, true); // Default all videos to playing
      });
      setVideoPlayStates(newPlayStates);
      console.log(`🔄 Reset video play states for ${reels.length} videos`);
    }
  }, [reels.length]); // Remove currentIndex to prevent excessive re-renders

  // ✅ Fetch reels on component mount only if not already loaded
  useEffect(() => {
    if (!user?.id) return;
    if (isPrefetching) {
      console.log("already prefetched❌");
      return;
    } // avoid racing the splash prefetch
    if (reels.length === 0 && !isInitialLoading) {
      fetchReels(String(user.id), 0).catch((err) =>
        console.error("❌ Error fetching initial reels:", err)
      );
    }
  }, [user?.id, reels.length, isInitialLoading, isPrefetching, fetchReels]);

  // ✅ Reset batch trigger when new videos are loaded
  useEffect(() => {
    // Reset trigger index when videos are loaded (length increased significantly)
    if (reels.length > lastBatchTriggerIndex + BATCH_LOAD_SIZE) {
      setLastBatchTriggerIndex(-1);
      console.log(
        `🔄 Reset batch trigger - new videos loaded (${reels.length} total)`
      );
    }
  }, [reels.length, lastBatchTriggerIndex]);

  // ✅ Pause all videos when screen loses focus (tab switch/navigation)
  useEffect(() => {
    if (!isFocused) {
      console.log("📱 Screen lost focus - pausing all videos");
      setVideoPlayStates((prevStates) => {
        const newStates = new Map(prevStates);
        reels.forEach((_, index) => {
          newStates.set(index, false);
        });
        return newStates;
      });
    }
  }, [isFocused, reels.length]);

  // ✅ Auto-play current video and pause all others (only when screen is focused)
  useEffect(() => {
    if (reels.length === 0 || currentIndex >= reels.length) return;

    // Pause ALL videos first to prevent audio bleeding
    setVideoPlayStates((prevStates) => {
      const newStates = new Map(prevStates);

      // Pause all videos
      reels.forEach((_, index) => {
        if (index !== currentIndex) {
          newStates.set(index, false);
        }
      });

      // Only set current video to playing if screen is focused and not explicitly paused by user
      if (isFocused) {
        const currentState = prevStates.get(currentIndex) ?? true;
        if (currentState !== false) {
          newStates.set(currentIndex, true);
          console.log(
            `🎬 Video ${currentIndex} set to playing, all others paused (total: ${reels.length})`
          );
        } else {
          console.log(`⏸️ Video ${currentIndex} remains paused by user choice`);
        }
      } else {
        // Screen is not focused, pause current video too
        newStates.set(currentIndex, false);
        console.log(
          `📱 Screen unfocused - pausing all videos including current ${currentIndex}`
        );
      }

      return newStates;
    });
  }, [currentIndex, reels.length, isFocused]); // Also depend on isFocused

  // Debug info
  useEffect(() => {
    console.log("🎬 VideoFeed State:", {
      reelsCount: reels.length,
      hasMore,
      isLoadingMore,
      isInitialLoading,
      error,
      currentIndex,
      videosFromEnd: reels.length - currentIndex,
      batchLoadWillTrigger: reels.length - currentIndex <= BATCH_LOAD_TRIGGER,
      lastBatchTriggerIndex,
      currentVideoPlaying: getVideoPlayState(currentIndex),
    });
  }, [
    reels.length,
    hasMore,
    isLoadingMore,
    isInitialLoading,
    error,
    currentIndex,
    lastBatchTriggerIndex,
  ]);

  // Show initial loading when no posts yet
  if (reels.length === 0 && isInitialLoading) {
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
        {error && (
          <Text
            style={{
              color: "#ff3b30",
              marginTop: 8,
              fontSize: 14,
              paddingHorizontal: 20,
              textAlign: "center",
            }}
          >
            Error: {error}
          </Text>
        )}
      </View>
    );
  }

  // Show message if no posts and not loading
  if (reels.length === 0 && !isInitialLoading) {
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
        {error && (
          <Text
            style={{
              color: "#ff3b30",
              marginTop: 8,
              fontSize: 14,
              paddingHorizontal: 20,
              textAlign: "center",
            }}
          >
            Error: {error}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => {
            if (user?.id) {
              console.log("🔄 Retrying fetch...");
              setLastBatchTriggerIndex(-1); // Reset batch trigger tracking
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
      {/* Batch Load Notification */}
      {/* {showBatchLoadNotification && (
        <View
          style={{
            position: "absolute",
            top: 120,
            left: "50%",
            transform: [{ translateX: -120 }],
            zIndex: 1000,
            backgroundColor: "rgba(77, 112, 209, 0.95)",
            padding: 12,
            paddingHorizontal: 20,
            borderRadius: 25,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <ActivityIndicator size="small" color="#ffffff" />
          <Text
            style={{
              color: "#ffffff",
              marginLeft: 8,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Loading {BATCH_LOAD_SIZE} more videos...
          </Text>
        </View>
      )} */}

      {/* ✅ Batch Loading Debug Overlay */}
      {/* <View
        style={{
          position: "absolute",
          top: 50,
          left: 10,
          zIndex: 999,
          backgroundColor:
            reels.length - currentIndex <= BATCH_LOAD_TRIGGER
              ? "rgba(255,165,0,0.9)"
              : "rgba(0,0,0,0.7)",
          padding: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          borderWidth:
            reels.length - currentIndex <= BATCH_LOAD_TRIGGER ? 2 : 1,
          borderColor:
            reels.length - currentIndex <= BATCH_LOAD_TRIGGER
              ? "#FFA500"
              : "#333",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 2,
          }}
        >
          📹 {reels.length} videos | 👆 #{currentIndex + 1} | 📊{" "}
          {reels.length - currentIndex} from end
        </Text>
        <Text
          style={{
            color: getVideoPlayState(currentIndex) ? "#90EE90" : "#FFB6C1",
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 2,
          }}
        >
          {getVideoPlayState(currentIndex) ? "▶️ PLAYING" : "⏸️ PAUSED"}
        </Text>
        <Text
          style={{
            color:
              reels.length - currentIndex <= BATCH_LOAD_TRIGGER
                ? "#FFE4B5"
                : "lightgray",
            fontSize: 11,
            fontWeight:
              reels.length - currentIndex <= BATCH_LOAD_TRIGGER
                ? "bold"
                : "normal",
          }}
        >
          {reels.length - currentIndex <= BATCH_LOAD_TRIGGER
            ? `⚡ LOADING ${BATCH_LOAD_SIZE} MORE SOON!`
            : `🚀 Load triggers at ${BATCH_LOAD_TRIGGER} from end`}
        </Text>
        {isLoadingMore && (
          <Text
            style={{
              color: "#4D70D1",
              fontSize: 11,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            ⏳ Loading {BATCH_LOAD_SIZE} videos...
          </Text>
        )}
      </View> */}

      {/* FlashList for smooth single video scrolling */}
      <FlashList
        ref={flatListRef}
        data={reels}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        pagingEnabled
        onViewableItemsChanged={({ viewableItems }) => {
          if (!viewableItems?.length) return;
          const i = viewableItems[0]?.index;
          if (
            typeof i === "number" &&
            i !== currentIndex &&
            i >= 0 &&
            i < reels.length
          ) {
            console.log(
              `👀 Viewable item changed from ${currentIndex} to ${i}`
            );
            setCurrentIndex(i);
          }
        }}
        onMomentumScrollBegin={() => {
          // Pause all videos when scrolling starts to prevent audio bleeding
          console.log(`📱 Scroll began - pausing all videos`);
          setVideoPlayStates((prevStates) => {
            const newStates = new Map(prevStates);
            reels.forEach((_, index) => {
              newStates.set(index, false);
            });
            return newStates;
          });
        }}
        onMomentumScrollEnd={(event) => {
          const y = event.nativeEvent.contentOffset.y ?? 0;
          const i = Math.round(y / height);

          console.log(`📱 Scroll ended at index ${i} (was ${currentIndex})`);

          if (i !== currentIndex && i >= 0 && i < reels.length) {
            setCurrentIndex(i);
          }

          // Resume playing the current video after scroll ends (only if screen is focused)
          setTimeout(() => {
            if (isFocused) {
              setVideoPlayStates((prevStates) => {
                const newStates = new Map(prevStates);
                // Ensure only the current video is playing
                reels.forEach((_, index) => {
                  if (index === i) {
                    newStates.set(index, true);
                    console.log(`▶️ Resuming video ${index} after scroll`);
                  } else {
                    newStates.set(index, false);
                  }
                });
                return newStates;
              });
            } else {
              console.log(
                `📱 Screen unfocused - not resuming videos after scroll`
              );
            }
          }, 100); // Small delay to ensure scroll has completely finished

          // Batch loading
          const videosFromEnd = reels.length - i;
          const shouldTriggerBatch =
            videosFromEnd <= BATCH_LOAD_TRIGGER &&
            videosFromEnd > 0 &&
            hasMore &&
            !isLoadingMore &&
            user?.id &&
            i !== lastBatchTriggerIndex;

          console.log(
            `📱 Batch loading check at video ${i}: videosFromEnd=${videosFromEnd}, trigger=${BATCH_LOAD_TRIGGER}, shouldTrigger=${shouldTriggerBatch}`
          );

          if (shouldTriggerBatch) {
            console.log(
              `🚀 BATCH LOAD TRIGGERED at video ${i}! (${videosFromEnd} videos remaining)`
            );
            setLastBatchTriggerIndex(i);
            setShowBatchLoadNotification(true);
            setTimeout(() => setShowBatchLoadNotification(false), 1000);
            loadMoreReels(String(user.id));
          }
        }}
        onEndReached={() => {
          if (hasMore && !isLoadingMore && user?.id) {
            loadMoreReels(String(user.id));
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => {
          if (isLoadingMore) {
            return (
              <View
                style={{
                  height: 100,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#4D70D1" />
                <Text style={{ color: "#ffffff", marginTop: 10, fontSize: 14 }}>
                  Loading more videos...
                </Text>
              </View>
            );
          }
          return null;
        }}
        renderItem={({ item, index }: ListRenderItemInfo<RawReel>) => {
          const active = index === currentIndex;
          const isVideoPlaying = getVideoPlayState(index);
          const shouldRenderVideo = Math.abs(index - currentIndex) <= 2;

          // per-item video callbacks (wire to parent maps)
          const onVideoLoadStart = () => setMediaLoading(index, true);
          const onVideoLoaded = () => {
            setMediaLoading(index, false);
            setVideoError(index, false);
          };
          const onVideoError = (e?: any) => {
            setMediaLoading(index, false);
            setVideoError(index, true);
            console.warn(
              "Video error @index",
              index,
              e?.nativeEvent?.error ?? e
            );
          };

          // compute cached local URI if available
          const cached = videoCache.get(String(item.media_url));
          const videoUri =
            cached ??
            (typeof item.media_url === "string" ? item.media_url : "");

          return (
            <View style={{ height, width, zIndex: 20 }}>
              <PostItem
                item={item}
                index={index}
                active={active}
                shouldRenderVideo={shouldRenderVideo}
                isFocused={isFocused}
                onOpenProfile={(uid) =>
                  router.push({
                    pathname: "/(profiles)" as any,
                    params: { user: uid, username: item.username },
                  })
                }
                onToggleLike={() => toggleLike(item.id, user.id)}
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

                    setFollowedUsers((prev) =>
                      isFollowing
                        ? prev.filter((x) => x !== uid)
                        : [...prev, uid]
                    );

                    await apiCall(endpoint, isFollowing ? "DELETE" : "POST");
                  } catch (error) {
                    console.error("❌ Error toggling follow:", error);
                    setFollowedUsers((prev) =>
                      prev.includes(uid)
                        ? prev.filter((x) => x !== uid)
                        : [...prev, uid]
                    );
                  }
                }}
                isFollowing={!!item.following}
                onOverlayPress={() => toggleVideoPlayState(index)}
                centerVisible={false}
                isPlaying={isVideoPlaying}
                onCenterToggle={() => toggleVideoPlayState(index)}
                onOpenComments={() => openCommentsFor(item)}
                router={router}
                videoUri={videoUri}
                /* NEW: wire loading/error -> parent maps */
                onVideoLoadStart={onVideoLoadStart}
                onVideoLoaded={onVideoLoaded}
                onVideoError={onVideoError}
                hasVideoError={getVideoError(index)}
                mediaLoading={getMediaLoading(index)}
              />
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
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
              await addComment(commentsPost.id, user.id, text);
              console.log("✅ Comment added successfully");
            } catch (error) {
              console.error("❌ Error adding comment:", error);
            }
          }
        }}
        onFetchComments={async (postId) => {
          await fetchCommentsOfAPost(Number(postId));
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

            // Remove the reel from the store
            useReelsStore.setState((state) => ({
              reels: state.reels.filter((p) => p.id !== idNum),
            }));

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

// PostItem component
const PostItem: React.FC<{
  item: RawReel;
  index: number;
  active: boolean;
  shouldRenderVideo?: boolean;
  isFocused: boolean;
  onOpenProfile: (uid?: number) => void;
  onToggleLike: () => void;
  onOpenPostOptions: () => void;
  likedPostIDs: number[];
  onToggleFollow: (uid?: number) => void;
  isFollowing: boolean;
  onOverlayPress: () => void;
  centerVisible: boolean;
  isPlaying: boolean;
  onCenterToggle: () => void;
  onOpenComments: () => void;
  router: any;
  hasVideoError?: boolean;
  mediaLoading?: boolean;
  onVideoLoadStart: () => void;
  onVideoLoaded: () => void;
  onVideoError: (e?: any) => void;
  videoUri?: string;
}> = memo(
  ({
    item,
    index,
    active,
    shouldRenderVideo = true,
    isFocused,
    onOpenProfile,
    onToggleLike,
    onOpenPostOptions,
    likedPostIDs,
    onToggleFollow,
    isFollowing,
    onOverlayPress,
    centerVisible,
    isPlaying,
    onCenterToggle,
    onOpenComments,
    router,
    onVideoLoadStart,
    onVideoLoaded,
    onVideoError,
    hasVideoError = false,
    mediaLoading = false,
    videoUri,
  }) => {
    const [shareOpen, setShareOpen] = useState(false);
    const videoRef = useRef<Video>(null);

    // ✅ Enhanced video lifecycle management with focus-aware resume
    useEffect(() => {
      const handleVideoLifecycle = async () => {
        if (!videoRef.current) return;

        try {
          if (!active || !isFocused || !isPlaying) {
            // Pause and mute when inactive, unfocused, or user paused
            console.log(
              `⏸️ Pausing video ${index} - active: ${active}, focused: ${isFocused}, playing: ${isPlaying}`
            );
            await videoRef.current.pauseAsync?.();
            await videoRef.current.setIsMutedAsync?.(true);
          } else if (active && isFocused && isPlaying) {
            // Resume and unmute when active, focused, and should be playing
            console.log(
              `▶️ Resuming video ${index} - active: ${active}, focused: ${isFocused}, playing: ${isPlaying}`
            );
            await videoRef.current.setIsMutedAsync?.(false);
            await videoRef.current.playAsync?.();
          }
        } catch (error) {
          console.log(`⚠️ Video ${index} lifecycle error:`, error);
        }
      };

      // Small delay to ensure proper state synchronization
      const timeout = setTimeout(handleVideoLifecycle, 100);
      return () => clearTimeout(timeout);
    }, [active, isFocused, isPlaying, index]);

    // ✅ Calculate isFavorited internally to avoid unnecessary re-renders
    const isFavorited = useMemo(
      () => likedPostIDs.includes(item.id) || !!item.liked,
      [likedPostIDs, item.id, item.liked]
    );

    // ✅ Added: Local like count state
    const [likesCount, setLikesCount] = useState(
      item?.reels_likes_aggregate?.aggregate?.count ??
        item?.likesCount ??
        item?.likes ??
        0
    );
    const prevIsFavoritedRef = useRef(isFavorited);

    // ✅ Sync like count with isFavorited changes
    useEffect(() => {
      if (prevIsFavoritedRef.current !== isFavorited) {
        setLikesCount((prev: number) =>
          Math.max(0, isFavorited ? prev + 1 : prev - 1)
        );
      }
      prevIsFavoritedRef.current = isFavorited;
    }, [isFavorited]);

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
      videoUrl: typeof item.media_url === "string" ? item.media_url : undefined,
      thumb:
        typeof item.thumbnail_url === "string" ? item.thumbnail_url : undefined,
      verified: !!item.verified,
    };

    return (
      <View style={{ height, width, zIndex: 20 }} className="w-full">
        {/* Video Background - Only render when shouldRenderVideo is true */}
        {item.media_url && shouldRenderVideo && (
          <Video
            key={videoUri || item.media_url}
            source={{ uri: videoUri ?? item.media_url }}
            shouldPlay={active && isPlaying && isFocused}
            isLooping
            isMuted={!active || !isFocused} // Mute if not active or screen not focused
            resizeMode={ResizeMode.CONTAIN}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width,
              height,
              zIndex: 10,
            }}
            posterSource={
              item.thumbnail_url ? { uri: item.thumbnail_url } : undefined
            }
            usePoster
            useNativeControls={false}
            onLoadStart={onVideoLoadStart}
            onLoad={onVideoLoaded}
            onReadyForDisplay={onVideoLoaded} // fires on first frame ready
            onError={onVideoError}
            onPlaybackStatusUpdate={(s) => {
              // Safety: if not loaded due to error, surface it
              // @ts-ignore status.error exists when !isLoaded
              if (!s.isLoaded && s?.error) onVideoError(new Error(s.error));
            }}
          />
        )}

        {/* Show thumbnail when video is not rendered */}
        {item.thumbnail_url && !shouldRenderVideo && (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width,
              height,
              zIndex: 10,
            }}
            resizeMode="cover"
          />
        )}

        {/* Error indicator - show when video fails to load */}
        {hasVideoError && !mediaLoading && (
          <Reanimated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width,
              height,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#000000", // Solid black to hide previous video on Android
              zIndex: 200,
            }}
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

        {/* Play/Pause Indicator */}
        {(!isPlaying || !active) && (
          <View
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: [{ translateX: -25 }, { translateY: -25 }],
              zIndex: 25,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 25,
              width: 50,
              height: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="play" size={24} color="#fff" />
          </View>
        )}

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

        {/* right action column (icons) */}
        <View
          className="absolute right-3 bottom-1/4 items-center"
          style={{ zIndex: 30 }}
        >
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

        {/* bottom profile + caption */}
        <View
          className="absolute left-3 right-3 rounded-2xl px-3 py-3 bg-black/20"
          style={{
            bottom: BOTTOM_NAV_HEIGHT + 10,
            zIndex: 40,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => onOpenProfile(item.user_id)}>
              <View className="w-14 h-14 rounded-full overflow-hidden items-center justify-center border border-white/20">
                {hasValidUri ? (
                  <Image
                    source={{ uri: avatarUri! }}
                    className="w-14 h-14 rounded-full"
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
                  {item.caption ?? ""}
                  <Text
                    onPress={() => setCaptionOpen(false)}
                    style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}
                  >
                    {"  "}Show less
                  </Text>
                </>
              ) : (
                <>
                  {collapsedCaption}
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

        {/* ✅ Share sheet */}
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
  (prevProps, nextProps) => {
    // Custom comparison for better performance - include focus state
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.active === nextProps.active &&
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.isFocused === nextProps.isFocused && // ✅ Include focus state
      prevProps.shouldRenderVideo === nextProps.shouldRenderVideo &&
      prevProps.likedPostIDs.length === nextProps.likedPostIDs.length &&
      prevProps.isFollowing === nextProps.isFollowing &&
      // 🔴 Ensure UI updates when error/loading/source change
      prevProps.hasVideoError === nextProps.hasVideoError &&
      prevProps.mediaLoading === nextProps.mediaLoading &&
      prevProps.videoUri === nextProps.videoUri
    );
  }
);

PostItem.displayName = "PostItem";

export default VideoFeed;
