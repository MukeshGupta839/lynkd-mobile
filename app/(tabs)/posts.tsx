// app/(tabs)/posts.tsx
import {
  registerTabPressHandler,
  unregisterTabPressHandler,
} from "@/lib/tabBarVisibility";
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
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
  // ✅ FIX: Alias Image to RNImage to avoid conflict with global Image class
  Image as RNImage,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

import { scheduleOnRN } from "react-native-worklets";

import Reanimated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const { width, height } = Dimensions.get("window");
const BOTTOM_NAV_HEIGHT = 80;
const TRUNCATE_LEN = 25;

const BATCH_LOAD_SIZE = 5;
const BATCH_LOAD_TRIGGER = 3;

const StyledText: React.FC<any> = ({ children, className, style, ...rest }) => (
  <Text className={className} style={style} {...rest}>
    {children}
  </Text>
);

const AnimatedFlatList = Reanimated.createAnimatedComponent(FlatList);

const VideoFeed: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { top } = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const isFocused = useIsFocused();

  const activeIndex = useSharedValue(0);
  const isScreenFocused = useSharedValue(false);

  useEffect(() => {
    isScreenFocused.value = isFocused;
  }, [isFocused, isScreenFocused]);

  const {
    reels,
    isInitialLoading,
    isPrefetching,
    isLoadingMore,
    hasMore,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error,
    fetchReels,
    loadMoreReels,
    refreshReels,
    fetchUserLikedPosts,
    toggleLike,
    fetchCommentsOfAPost,
    likedPostIDs,
    postComments,
    addComment,
  } = useReelsStore();

  const [jsIndex, setJsIndex] = useState(0);

  const [followedUsers, setFollowedUsers] = useState<number[]>([]);
  const [showPostOptionsFor, setShowPostOptionsFor] = useState<RawReel | null>(
    null
  );
  const [reportVisible, setReportVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [lastBatchTriggerIndex, setLastBatchTriggerIndex] =
    useState<number>(-1);

  const commentsRef = useRef<CommentsSheetHandle>(null);
  const [commentsPost, setCommentsPost] = useState<RawReel | null>(null);

  const openCommentsFor = useCallback(
    (post: RawReel) => {
      setCommentsPost(post);
      fetchCommentsOfAPost(post.id);
      commentsRef.current?.present();
    },
    [fetchCommentsOfAPost]
  );

  const fetchUserFollowings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await apiCall(
        `/api/follows/following/${user.id}`,
        "GET"
      );
      setFollowedUsers(response.following || []);
    } catch (error) {
      console.error("❌ Error fetching user followings:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserLikedPosts(user.id);
      fetchUserFollowings();
      setLastBatchTriggerIndex(-1);
    }
  }, [user?.id, fetchUserLikedPosts, fetchUserFollowings]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    setJsIndex(0);
    activeIndex.value = 0;
    try {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    } catch (e) {
      console.log("onRefresh error: ", e);
    }
    setLastBatchTriggerIndex(-1);
    await refreshReels(String(user.id));
    setRefreshing(false);
  }, [user?.id, activeIndex, refreshReels]);

  useEffect(() => {
    const scrollToTop = () => {
      setJsIndex(0);
      activeIndex.value = 0;
      try {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      } catch (e) {
        console.log("scrollToTop error: ", e);
      }
    };
    const refresh = () => {
      setRefreshing(true);
      try {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      } catch (e) {
        console.log("refresh scrollToOffset error: ", e);
      }
      setTimeout(() => onRefresh(), 100);
    };
    registerTabPressHandler("posts", { scrollToTop, refresh });
    return () => unregisterTabPressHandler("posts");
  }, [activeIndex, onRefresh]);

  useEffect(() => {
    if (!user?.id || isPrefetching) return;
    if (reels.length === 0 && !isInitialLoading) {
      fetchReels(String(user.id), 0).catch(console.error);
    }
  }, [user?.id, reels.length, isInitialLoading, isPrefetching, fetchReels]);

  useEffect(() => {
    if (reels.length > lastBatchTriggerIndex + BATCH_LOAD_SIZE) {
      setLastBatchTriggerIndex(-1);
    }
  }, [reels.length, lastBatchTriggerIndex]);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    const idx = Math.round(e.contentOffset.y / height);
    activeIndex.value = idx;
    // Use scheduleOnRN instead of runOnJS
    scheduleOnRN(setJsIndex, idx);
  });

  useEffect(() => {
    const videosFromEnd = reels.length - jsIndex;
    const shouldTriggerBatch =
      videosFromEnd <= BATCH_LOAD_TRIGGER &&
      videosFromEnd > 0 &&
      hasMore &&
      !isLoadingMore &&
      user?.id &&
      jsIndex !== lastBatchTriggerIndex;

    if (shouldTriggerBatch) {
      setLastBatchTriggerIndex(jsIndex);
      loadMoreReels(String(user.id));
    }
  }, [
    jsIndex,
    reels.length,
    hasMore,
    isLoadingMore,
    user?.id,
    lastBatchTriggerIndex,
    loadMoreReels,
  ]);

  if (reels.length === 0 && isInitialLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3e3434" />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  if (reels.length === 0 && !isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No reels available</Text>
        <TouchableOpacity onPress={() => onRefresh()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item: any) => String(item.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={2}
        initialNumToRender={2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4D70D1"]}
            tintColor={"#4D70D1"}
            progressViewOffset={top + 10}
          />
        }
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        renderItem={({ item, index }: any) => {
          return (
            <ReelItem
              item={item}
              index={index}
              uri={typeof item.media_url === "string" ? item.media_url : ""}
              activeIndex={activeIndex}
              isScreenFocused={isScreenFocused}
              currentUser={user}
              router={router}
              likedPostIDs={likedPostIDs}
              followedUsers={followedUsers}
              toggleLike={toggleLike}
              toggleFollow={async (uid: number) => {
                if (!uid || !user?.id) return;
                try {
                  Vibration.vibrate(50);
                  const isFollowing = followedUsers.includes(uid);
                  const endpoint = isFollowing
                    ? `/api/follows/unfollow/${user.id}/${uid}`
                    : `/api/follows/follow/${user.id}/${uid}`;

                  setFollowedUsers((prev) =>
                    isFollowing ? prev.filter((x) => x !== uid) : [...prev, uid]
                  );
                  await apiCall(endpoint, isFollowing ? "DELETE" : "POST");
                } catch (e) {
                  console.error(e);
                }
              }}
              openComments={() => openCommentsFor(item)}
              openPostOptions={() => setShowPostOptionsFor(item)}
            />
          );
        }}
      />

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
            await addComment(commentsPost.id, user.id, text);
          }
        }}
        onFetchComments={async (postId) => {
          await fetchCommentsOfAPost(Number(postId));
        }}
        currentUserAvatar={user?.profile_picture}
      />

      <PostOptionsBottomSheet
        show={!!showPostOptionsFor}
        setShow={(v: boolean) => !v && setShowPostOptionsFor(null)}
        toggleFollow={async () => {}}
        isFollowing={followedUsers.includes(
          Number(showPostOptionsFor?.user_id ?? -1)
        )}
        focusedPost={showPostOptionsFor}
        setFocusedPost={setShowPostOptionsFor}
        setBlockUser={() => {}}
        setReportVisible={() => {}}
        deleteAction={async (postId: string) => {
          const idNum = Number(postId);
          useReelsStore.setState((state) => ({
            reels: state.reels.filter((p) => p.id !== idNum),
          }));
          setShowPostOptionsFor(null);
        }}
        user={user}
      />

      <ReportPostBottomSheet
        show={reportVisible}
        setShow={setReportVisible}
        postId={String(showPostOptionsFor?.id || "")}
        userId={user?.id || ""}
      />
    </View>
  );
};

const ReelItem = memo(
  ({
    item,
    index,
    uri,
    activeIndex,
    isScreenFocused,
    currentUser,
    router,
    likedPostIDs,
    followedUsers,
    toggleLike,
    toggleFollow,
    openComments,
    openPostOptions,
  }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [hasVideoError, setHasVideoError] = useState(false);

    // Setup Player
    const player = useVideoPlayer(uri, (player) => {
      player.loop = true;
      player.muted = false;
    });

    // Wrapper functions to prevent C++ crash and provide stable references
    const playVideo = useCallback(() => {
      player.play();
    }, [player]);

    const pauseVideo = useCallback(() => {
      player.pause();
    }, [player]);

    const isActive = useDerivedValue(() => {
      return activeIndex.value === index;
    }, [activeIndex, index]);

    useAnimatedReaction(
      () => {
        return isActive.value && isScreenFocused.value;
      },
      (shouldPlay, previous) => {
        if (shouldPlay !== previous) {
          if (shouldPlay) {
            // ✅ FIX 3: Use scheduleOnRN(func)
            scheduleOnRN(playVideo);
          } else {
            // ✅ FIX 3: Use scheduleOnRN(func)
            scheduleOnRN(pauseVideo);
          }
        }
      },
      [isActive, isScreenFocused, playVideo, pauseVideo]
    );

    const isFavorited = useMemo(
      () => likedPostIDs.includes(item.id) || !!item.liked,
      [likedPostIDs, item.id, item.liked]
    );
    const [likesCount, setLikesCount] = useState(item?.likesCount ?? 0);
    const prevFav = useRef(isFavorited);

    useEffect(() => {
      if (prevFav.current !== isFavorited) {
        setLikesCount((prev: number) =>
          Math.max(0, isFavorited ? prev + 1 : prev - 1)
        );
      }
      prevFav.current = isFavorited;
    }, [isFavorited]);

    const onOpenProfile = useCallback(
      (uid: number) => {
        router.push({
          pathname: "/(profiles)",
          params: { user: uid, username: item.username },
        });
      },
      [router, item.username]
    );

    const captionExpanded = useSharedValue(0);
    const [captionOpen, setCaptionOpen] = useState(false);
    useEffect(() => {
      captionExpanded.value = captionOpen ? 1 : 0;
    }, [captionExpanded, captionOpen]);

    const captionAnimatedStyle = useAnimatedStyle(() => ({
      maxHeight: withTiming(captionExpanded.value ? 1000 : 48, {
        duration: 300,
      }),
    }));

    const [shareOpen, setShareOpen] = useState(false);

    const userFromList = CREATION_USERS.find(
      (u: any) => String(u.id) === String(item.user_id)
    );
    const avatarUri = userFromList?.avatar ?? item?.photoURL;
    const hasValidUri =
      typeof avatarUri === "string" && /^(http|https):/.test(avatarUri);
    const rawCaption = item.caption ?? "";
    const needsTruncate = rawCaption.length > TRUNCATE_LEN;
    const collapsedCaption = needsTruncate
      ? rawCaption.slice(0, TRUNCATE_LEN).trim()
      : rawCaption;

    return (
      <View style={styles.reelContainer}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />

        {hasVideoError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ff3b30" />
            <Text style={styles.errorText}>Failed to load video</Text>
          </View>
        )}

        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (player.playing) player.pause();
            else player.play();
          }}
        />

        <View
          className="absolute right-3 bottom-1/4 items-center"
          style={{ zIndex: 30 }}
        >
          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={() => toggleLike(item.id, currentUser.id)}
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
            onPress={openComments}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xs mt-2">
            {(item.commentsCount ?? 0).toString()}
          </Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={() => setShareOpen(true)}
          >
            <Send width={20} height={20} />
          </TouchableOpacity>
          <Text className="text-white text-xs mt-2">Share</Text>

          <TouchableOpacity
            className="w-12 h-12 rounded-full items-center justify-center mt-3 bg-white/20"
            onPress={openPostOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View
          className="absolute left-3 right-3 rounded-2xl px-3 py-3 bg-black/20"
          style={{ bottom: BOTTOM_NAV_HEIGHT + 10, zIndex: 40 }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => onOpenProfile(item.user_id)}>
              <View className="w-14 h-14 rounded-full overflow-hidden items-center justify-center border border-white/20">
                {hasValidUri ? (
                  <RNImage // ✅ FIX: Use the aliased RNImage component here
                    source={{ uri: avatarUri }}
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
                <TouchableOpacity onPress={() => onOpenProfile(item.user_id)}>
                  <StyledText
                    className="text-white font-bold text-base mr-2"
                    numberOfLines={1}
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
            {!item.following && currentUser?.id !== item.user_id && (
              <TouchableOpacity
                onPress={() => toggleFollow(item.user_id)}
                style={styles.followBtn}
              >
                <Text style={styles.followText}>Follow</Text>
              </TouchableOpacity>
            )}
          </View>

          <Reanimated.View
            style={[{ overflow: "hidden" }, captionAnimatedStyle]}
          >
            <View>
              <Text
                numberOfLines={captionOpen ? undefined : 1}
                className="text-white text-base mt-2 leading-7"
                style={{ flexWrap: "wrap" }}
              >
                {captionOpen ? (item.caption ?? "") : collapsedCaption}
                {!captionOpen && needsTruncate && (
                  <Text
                    onPress={() => setCaptionOpen(true)}
                    style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}
                  >
                    {" "}
                    ... more
                  </Text>
                )}
              </Text>
              {captionOpen && (
                <Text
                  onPress={() => setCaptionOpen(false)}
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  Show less
                </Text>
              )}
            </View>
          </Reanimated.View>
        </View>

        <ShareSectionBottomSheet
          show={shareOpen}
          setShow={setShareOpen}
          postId={String(item.id)}
          postPreview={{
            id: String(item.id),
            image: item.thumbnail_url || item.media_url || "",
            author: item.username || "user",
            caption: item.caption || "",
            author_avatar: avatarUri || "",
            videoUrl:
              typeof item.media_url === "string" ? item.media_url : undefined,
          }}
          initialHeightPct={0.4}
          maxHeightPct={0.9}
          maxSelect={5}
          shareUsers={[]}
        />
      </View>
    );
  }
);

// ✅ FIX: Component display name
ReelItem.displayName = "ReelItem";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  reelContainer: { width, height, backgroundColor: "black" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#ffffff", marginTop: 16, fontSize: 16 },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#4D70D1",
    borderRadius: 8,
  },
  retryText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    zIndex: 10,
  },
  errorText: { color: "white", marginTop: 10 },
  followBtn: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  followText: { color: "white", fontSize: 12, fontWeight: "bold" },
});

export default VideoFeed;
