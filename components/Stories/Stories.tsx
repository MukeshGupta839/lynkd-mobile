// app/components/Stories/Stories.tsx
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import { useAuth } from "@/hooks/useAuth";
import { apiCall } from "@/lib/api/apiService";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/* IMPORTANT:
   - Ensure the very first import in your app entry is:
       import 'react-native-gesture-handler';
   - Ensure your root is wrapped in <GestureHandlerRootView style={{flex:1}}>
   - Ensure babel.config.js includes 'react-native-reanimated' plugin LAST.
*/

const { width, height } = Dimensions.get("window");

/** Types */
export type StoryItem = {
  created_at?: string;
  story_id: number | string;
  story_image: string;
  swipeText?: string;
  caption?: string;
  caption_size?: number;
  caption_position?: number;
  startAtSeconds?: number;
  segmentDuration?: number; // we'll cap this to 60s when needed
};

export type StoryUser = {
  user_id: number | string;
  user_image: string;
  user_name: string;
  stories: StoryItem[];
};

export type StoriesProps = {
  storiesData: StoryUser[];
  initialUserIndex?: number;
  onRequestClose?: () => void;
  showStrip?: boolean;
  onUserFinished?: (userId: string | number) => void; // when a user's last story finishes
  onAllFinished?: () => void; // when all users finish
};

const isVideoUrl = (uri?: string) => {
  const u = (uri ?? "").toLowerCase();
  return (
    u.endsWith(".mp4") ||
    u.endsWith(".mov") ||
    u.endsWith(".m4v") ||
    u.endsWith(".webm") ||
    u.includes("video")
  );
};

const safeSeek = async (player: any, seconds: number) => {
  try {
    if (player?.seekTo) await player.seekTo(seconds);
  } catch {}
};

/** --------- SECURE progress persistence helpers ---------- */
const PROGRESS_KEY = "stories_progress_v1";

// Map<userId, { watched: Record<storyKey, true>, lastIndex: number }>
// storyKey is `${userId}:${storyIndex}` to avoid duplicate/missing story_id bugs
type ProgressMap = Record<
  string,
  {
    watched: Record<string, true>;
    lastIndex: number; // last COMPLETED story index
  }
>;

const toUserKey = (id: string | number) => String(id);
const storyKeyByIndex = (userId: string | number, storyIndex: number) =>
  `${toUserKey(userId)}:${storyIndex}`;

async function loadProgress(): Promise<ProgressMap> {
  try {
    const raw = await SecureStore.getItemAsync(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveProgress(map: ProgressMap) {
  try {
    await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(map));
  } catch {}
}

/** Video player view */
const StoryVideoView: React.FC<{
  source: string;
  startAtSeconds?: number;
  segmentDuration?: number;
  onDurationKnown: (d: number) => void;
  onProgressRatio: (r: number) => void;
  onSegmentEnd: () => void;
  viewKey: string;
}> = ({
  source,
  startAtSeconds = 0,
  segmentDuration,
  onDurationKnown,
  onProgressRatio,
  onSegmentEnd,
  viewKey,
}) => {
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.play();
    p.timeUpdateEventInterval = 0.1;
  });

  useEventListener(player, "statusChange", (status: any) => {
    const duration = status?.duration ?? (player as any)?.duration ?? 0;
    if (duration) {
      onDurationKnown(duration);
      safeSeek(player, startAtSeconds);
    }
  });

  useEventListener(player, "timeUpdate", ({ currentTime }: any) => {
    const duration = (player as any)?.duration ?? 0;
    if (!duration) return;

    const segLen = segmentDuration ?? duration;
    const segStart = startAtSeconds ?? 0;

    const ratio = Math.max(0, Math.min(1, (currentTime - segStart) / segLen));
    onProgressRatio(ratio);

    if (currentTime >= segStart + segLen - 0.05) onSegmentEnd();
  });

  return (
    <VideoView
      key={viewKey}
      player={player}
      style={{ width: "100%", height: "100%" }}
      contentFit="contain"
      nativeControls={false}
      allowsFullscreen={false}
    />
  );
};

const Stories = ({
  storiesData,
  initialUserIndex = 0,
  onRequestClose,
  showStrip = false,
  onUserFinished,
  onAllFinished,
}: StoriesProps): React.ReactElement | null => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const TOP_UI_HEIGHT = 60;
  const BOTTOM_UI_HEIGHT = 50;

  const LOGGED_IN_USER_ID = user?.id || "you"; // Use actual user ID from auth

  // Editable copy of incoming data
  const [localStories, setLocalStories] = useState<StoryUser[]>(storiesData);

  // selection state
  const [currentUserIndex, setCurrentUserIndex] = useState<number | null>(
    storiesData.length ? initialUserIndex : null
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // UI state
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState("");
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [focusedPost, setFocusedPost] = useState<any | null>(null);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);

  // playback/progress anim
  const progress = useRef(new Animated.Value(0)).current;
  const cappedOnce = useRef<Set<string | number>>(new Set());
  const [mediaKey, setMediaKey] = useState(0);

  // heart animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  /** persisted story progress state */
  const [progressMap, setProgressMap] = useState<ProgressMap>({});

  // Load persisted progress on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadProgress();
      setProgressMap(loaded);
    })();
  }, []);

  // Is a whole user fully watched?
  const isUserFullyWatched = (u: StoryUser) => {
    const key = toUserKey(u.user_id);
    const entry = progressMap[key];
    if (!entry) return false;
    const watchedCount = Object.keys(entry.watched || {}).length;
    return watchedCount >= (u.stories?.length ?? 0);
  };

  /** ---------- First unread / Entry index (IG style) keyed by index ---------- */

  // Get first unread index; if everything is watched, return -1
  const getFirstUnreadIndex = (u: StoryUser) => {
    const userKey = toUserKey(u.user_id);
    const watched = progressMap[userKey]?.watched || {};
    return u.stories.findIndex(
      (_s, idx) => !watched[storyKeyByIndex(userKey, idx)]
    );
  };

  // Entry index logic:
  // - If there’s an unread story -> start from that (resume)
  // - If all are watched -> start from 0 (replay from beginning, stays gray/end)
  const getEntryIndexForUser = (u: StoryUser) => {
    const idx = getFirstUnreadIndex(u);
    return idx === -1 ? 0 : idx;
  };

  // When we enter a user, position to entry index (first unread or 0 if all watched)
  useEffect(() => {
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;

    const entryIndex = getEntryIndexForUser(u);
    setCurrentStoryIndex(entryIndex);

    setMediaKey((k) => k + 1);
    progress.stopAnimation();
    progress.setValue(0);
  }, [currentUserIndex]); // eslint-disable-line

  // Align initial load when progress changes
  useEffect(() => {
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;

    const entryIndex = getEntryIndexForUser(u);
    setCurrentStoryIndex(entryIndex);
  }, [progressMap]); // eslint-disable-line

  useEffect(() => {
    if (currentUserIndex !== null && !postOptionsVisible) startProgress();
    return () => progress.stopAnimation();
  }, [currentStoryIndex, currentUserIndex, postOptionsVisible]); // eslint-disable-line

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (currentUserIndex !== null) {
        onRequestClose?.();
        setCurrentUserIndex(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [currentUserIndex, onRequestClose]);

  const startProgress = () => {
    progress.stopAnimation();
    progress.setValue(0);
    const story =
      currentUserIndex !== null
        ? localStories[currentUserIndex]?.stories[currentStoryIndex]
        : undefined;
    if (!story || postOptionsVisible) return;

    // images auto-advance using an Animated timer
    if (!isVideoUrl(story.story_image)) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) handleMarkCurrentAsWatchedThenNext();
      });
    }
  };

  /** Cap a single story's video to max 60s (no splitting) */
  const capVideoToSixty = (
    userIdx: number,
    storyIdx: number,
    videoDuration: number
  ) => {
    const user = localStories[userIdx];
    if (!user) return;
    const story = user.stories?.[storyIdx];
    if (!story) return;

    const key = story.story_id ?? `${user.user_id}-${storyIdx}`;
    if (cappedOnce.current.has(key)) return;

    if (videoDuration > 60) {
      setLocalStories((prev) => {
        const copy = [...prev];
        const u = { ...copy[userIdx] };
        const s = { ...u.stories[storyIdx] };
        s.startAtSeconds = 0;
        s.segmentDuration = 60; // cap
        u.stories = [
          ...u.stories.slice(0, storyIdx),
          s,
          ...u.stories.slice(storyIdx + 1),
        ];
        copy[userIdx] = u;
        return copy;
      });
      cappedOnce.current.add(key);
    } else {
      if (story.segmentDuration || story.startAtSeconds) {
        setLocalStories((prev) => {
          const copy = [...prev];
          const u = { ...copy[userIdx] };
          const s = { ...u.stories[storyIdx] };
          delete s.segmentDuration;
          delete s.startAtSeconds;
          u.stories = [
            ...u.stories.slice(0, storyIdx),
            s,
            ...u.stories.slice(storyIdx + 1),
          ];
          copy[userIdx] = u;
          return copy;
        });
      }
      cappedOnce.current.add(key);
    }
  };

  /** Mark & persist current story as watched (keyed by index) */
  const markCurrentWatched = async () => {
    if (currentUserIndex === null) return { finishedUser: false };

    const u = localStories[currentUserIndex];
    if (!u) return { finishedUser: false };

    const userKey = toUserKey(u.user_id);
    const idx = currentStoryIndex;
    const s = u.stories[idx];
    if (!s) return { finishedUser: false };

    const sKey = storyKeyByIndex(userKey, idx);

    const nextMap: ProgressMap = JSON.parse(JSON.stringify(progressMap || {}));
    if (!nextMap[userKey]) nextMap[userKey] = { watched: {}, lastIndex: -1 };
    nextMap[userKey].watched[sKey] = true;
    if (idx > nextMap[userKey].lastIndex) {
      nextMap[userKey].lastIndex = idx;
    }

    setProgressMap(nextMap);
    await saveProgress(nextMap);

    const finished =
      Object.keys(nextMap[userKey].watched).length >= u.stories.length;

    return { finishedUser: finished };
  };

  /** mark watched, then decide next story/user */
  const handleMarkCurrentAsWatchedThenNext = async () => {
    const { finishedUser } = await markCurrentWatched();

    if (currentUserIndex === null) return;
    const userStories = localStories[currentUserIndex].stories;

    if (currentStoryIndex < userStories.length - 1) {
      // More stories → next story
      setCurrentStoryIndex((i) => i + 1);
      setMediaKey((k) => k + 1);
    } else {
      // Last story just finished → only now move user to end/gray
      handleNextUser(finishedUser);
    }
  };

  const handleNextStory = () => {
    handleMarkCurrentAsWatchedThenNext();
  };

  const handlePreviousStory = () => {
    if (currentUserIndex === null) return;
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
      setMediaKey((k) => k + 1);
    } else {
      handlePreviousUser();
    }
  };

  /** Move to next user. If finishedUser === true, push to end & gray and notify. */
  const handleNextUser = (finishedUser?: boolean) => {
    if (currentUserIndex === null) return;

    const finishedUserId = localStories[currentUserIndex]?.user_id;
    if (finishedUser && finishedUserId !== undefined) {
      onUserFinished?.(finishedUserId);
    }

    setLocalStories((prev) => {
      if (finishedUser) {
        const copy = [...prev];
        const [doneUser] = copy.splice(currentUserIndex, 1);
        copy.push(doneUser);
        return copy;
      }
      return prev;
    });

    // after reorder (if any), jump to next user
    setTimeout(() => {
      if (currentUserIndex === null) return;
      const nextUserIdx =
        currentUserIndex < localStories.length - 1
          ? currentUserIndex + 1
          : localStories.length - 1;

      if (nextUserIdx > currentUserIndex) {
        setCurrentUserIndex(nextUserIdx);
        setMediaKey((k) => k + 1);
        progress.stopAnimation();
        progress.setValue(0);
      } else {
        onAllFinished?.();
        onRequestClose?.();
        setCurrentUserIndex(null);
      }
    }, 0);
  };

  const handlePreviousUser = () => {
    if (currentUserIndex === null) return;
    if (currentUserIndex > 0) {
      const prev = currentUserIndex - 1;
      setCurrentUserIndex(prev);
      setMediaKey((k) => k + 1);
      progress.stopAnimation();
      progress.setValue(0);
    } else {
      onRequestClose?.();
      setCurrentUserIndex(null);
    }
  };

  /** Delete current story (only if it's yours). Also remount media immediately. */
  const handleDeleteCurrent = () => {
    if (currentUserIndex === null) return;

    setPostOptionsVisible(false);
    setLocalStories((prev) => {
      const users = [...prev];
      const u = { ...users[currentUserIndex] };

      // allow delete only if owner matches the logged-in user
      if (String(u.user_id) !== String(LOGGED_IN_USER_ID)) {
        startProgress();
        return users;
      }

      const deletingIndex = currentStoryIndex;
      const nextStories = u.stories.filter((_s, i) => i !== deletingIndex);

      // also clean progress for this story index
      (async () => {
        const userKey = toUserKey(u.user_id);
        const sKey = storyKeyByIndex(userKey, deletingIndex);
        const next = JSON.parse(
          JSON.stringify(progressMap || {})
        ) as ProgressMap;
        if (next[userKey]?.watched?.[sKey]) {
          delete next[userKey].watched[sKey];
          if (next[userKey].lastIndex >= deletingIndex) {
            next[userKey].lastIndex = Math.max(0, deletingIndex - 1);
          }
          setProgressMap(next);
          await saveProgress(next);
        }
      })();

      progress.stopAnimation();
      progress.setValue(0);

      if (nextStories.length > 0) {
        u.stories = nextStories;
        users[currentUserIndex] = u;

        // snap to entry index (first unread, else 0) after deletion
        const nextIndex = getEntryIndexForUser(u);
        setCurrentStoryIndex(nextIndex);
        setMediaKey((k) => k + 1);
        return users;
      }

      // remove the user if no stories left
      users.splice(currentUserIndex, 1);
      if (users.length === 0) {
        setCurrentStoryIndex(0);
        onAllFinished?.();
        onRequestClose?.();
        setCurrentUserIndex(null);
        return users;
      }

      let nextUserIdx = currentUserIndex;
      if (nextUserIdx >= users.length) nextUserIdx = users.length - 1;

      setCurrentUserIndex(nextUserIdx);
      setCurrentStoryIndex(0);
      setMediaKey((k) => k + 1);
      return users;
    });
  };

  /** Toggle follow/unfollow for a user */
  const toggleFollow = async (userId: string | number) => {
    if (!user?.id || !userId) return;

    const userIdStr = String(userId);
    const isFollowing = followedUsers.includes(userIdStr);

    // Optimistic update - instant UI response
    setFollowedUsers((prev) =>
      isFollowing ? prev.filter((id) => id !== userIdStr) : [...prev, userIdStr]
    );

    try {
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
        isFollowing
          ? [...prev, userIdStr]
          : prev.filter((id) => id !== userIdStr)
      );
    }
  };

  /* =========================
     GESTURES
     ========================= */
  const tapGesture = Gesture.Tap()
    .enabled(!postOptionsVisible)
    .maxDuration(250)
    .maxDeltaX(12)
    .maxDeltaY(12)
    .onEnd((event, success) => {
      if (!success) return;
      // @ts-ignore
      const ax = event.absoluteX ?? event.x;
      // @ts-ignore
      const ay = event.absoluteY ?? event.y;

      const topGuard = insets.top + TOP_UI_HEIGHT;
      const bottomGuard = height - (insets.bottom + BOTTOM_UI_HEIGHT);

      if (ay <= topGuard || ay >= bottomGuard) return;

      if (ax >= width / 2) handleNextStory();
      else handlePreviousStory();
    });

  const panGesture = Gesture.Pan()
    .enabled(!postOptionsVisible)
    .minDistance(10)
    .activeOffsetX([-20, 20])
    .activeOffsetY([-20, 20])
    .onBegin(() => {
      progress.stopAnimation(); // pause while swiping
    })
    .onEnd((e) => {
      const { translationX, translationY, velocityY } = e;
      if (translationY > 100 || velocityY > 1000) {
        // swipe down → close
        onRequestClose?.();
        setCurrentUserIndex(null);
      } else if (translationX < -50) {
        // swipe left → next user (only gray/move if fully watched)
        handleNextUser(isUserFullyWatched(localStories[currentUserIndex!]));
      } else if (translationX > 50) {
        // swipe right → previous user
        handlePreviousUser();
      } else {
        startProgress();
      }
    });

  // Race: whichever recognizes first wins
  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  // heart animation
  const triggerHeartAnimation = () => {
    heartScale.setValue(0.4);
    heartOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(heartOpacity, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.2,
          duration: 180,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Animated.timing(heartOpacity, {
        toValue: 0,
        delay: 250,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  const handleLikePress = () => {
    setLiked((prev) => {
      const next = !prev;
      if (next) triggerHeartAnimation();
      return next;
    });
  };

  /** Render one user's stories */
  const renderStories = () => {
    if (currentUserIndex === null) return null;

    const user = localStories[currentUserIndex];
    const story = user?.stories?.[currentStoryIndex];
    if (!user || !story) return null;

    const video = isVideoUrl(story.story_image);
    const viewKey = `${user.user_id}-${currentStoryIndex}-${mediaKey}`;

    return (
      <GestureDetector gesture={combinedGesture}>
        <SafeAreaView
          edges={["top", "bottom"]}
          style={{ flex: 1, backgroundColor: "black" }}
        >
          {/* Media area between top and bottom UI */}
          <View style={{ flex: 1, paddingBottom: BOTTOM_UI_HEIGHT }}>
            <View style={{ flex: 1 }}>
              {video ? (
                <StoryVideoView
                  viewKey={`vid-${viewKey}`}
                  source={story.story_image}
                  startAtSeconds={story.startAtSeconds ?? 0}
                  segmentDuration={story.segmentDuration}
                  onDurationKnown={(dur) => {
                    capVideoToSixty(currentUserIndex!, currentStoryIndex, dur);
                  }}
                  onProgressRatio={(r) => progress.setValue(r)}
                  onSegmentEnd={handleNextStory} // marks watched then next
                />
              ) : (
                <Image
                  key={`img-${viewKey}`}
                  source={{ uri: story.story_image }}
                  style={{
                    width: "100%",
                    height: "100%",
                    resizeMode: "contain",
                  }}
                  onLoadEnd={startProgress}
                />
              )}
            </View>
          </View>

          {/* Center big heart animation */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View
              style={{
                opacity: heartOpacity,
                transform: [{ scale: heartScale }],
              }}
            >
              <Ionicons name="heart" size={140} color="#FF2D55" />
            </Animated.View>
          </View>

          {/* Top UI (below notch) */}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: insets.top + 10,
              left: 6,
              right: 6,
            }}
          >
            {/* Progress bars */}
            <View className="flex-row h-[3px] mb-5">
              {user.stories.map((_, index) => {
                const animatedWidth =
                  index < currentStoryIndex
                    ? "100%"
                    : index === currentStoryIndex
                      ? (progress as any).interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        })
                      : "0%";
                return (
                  <View
                    key={`${user.user_id}-${index}`}
                    className="flex-1 bg-white/30 mx-0.5 overflow-hidden"
                  >
                    <Animated.View
                      style={{ width: animatedWidth, height: "100%" }}
                      className="bg-white"
                    />
                  </View>
                );
              })}
            </View>

            {/* User row + three-dots */}
            <View className="flex-row items-center justify-between">
              {/* Avatar + name */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() =>
                  router.push({
                    pathname: "/(profiles)" as any,
                    params: {
                      user: String(user.user_id),
                      username: user.user_name,
                    },
                  })
                }
              >
                <Image
                  source={{ uri: user.user_image }}
                  className="w-10 h-10 rounded-full"
                />
                <Text className="text-white font-semibold ml-2">
                  {user.user_name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  progress.stopAnimation();
                  const u = localStories[currentUserIndex!];
                  const s = u.stories[currentStoryIndex];

                  setFocusedPost({
                    ...s,
                    user_id: u.user_id,
                    story_id: s.story_id,
                    story_owner_name: u.user_name,
                  });

                  setPostOptionsVisible(true);
                }}
                className="p-2"
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Optional caption */}
          {!!story.caption && (
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                top: insets.top + (story.caption_position ?? 0),
                left: 0,
                right: 0,
              }}
              className="bg-black/60 px-3 py-2"
            >
              <Text
                style={{ fontSize: story.caption_size ?? 18 }}
                className="text-white self-center"
              >
                {story.caption}
              </Text>
            </View>
          )}

          {/* Bottom actions — above nav bar */}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: insets.bottom,
              paddingHorizontal: 12,
            }}
          >
            <View className="flex-row items-center justify-between bg-transparent py-2">
              <View className="flex-1 flex-row items-center bg-transparent border border-white rounded-full px-3">
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  onSubmitEditing={() => setMessage("")}
                  placeholder="Send message"
                  placeholderTextColor="#d1d5db"
                  className="flex-1 py-2 text-white"
                />
              </View>

              <TouchableOpacity onPress={handleLikePress} className="ml-4">
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={32}
                  color={liked ? "#FF2D55" : "#ffffff"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GestureDetector>
    );
  };

  // ✅ ALWAYS return a value from this component
  return (
    <View className="flex-1 bg-black">
      {renderStories()}

      {/* Bottom strip: gray only when fully watched */}
      {showStrip ? (
        <FlatList
          data={localStories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.user_id)}
          contentContainerStyle={{
            columnGap: 8,
            paddingHorizontal: 10,
            paddingBottom: insets.bottom,
          }}
          renderItem={({ item, index }: { item: StoryUser; index: number }) => {
            const fullyWatched = isUserFullyWatched(item);
            return (
              <TouchableOpacity
                onPress={() => {
                  setCurrentUserIndex(index);
                  // entry index will be computed in the effect
                  progress.stopAnimation();
                  progress.setValue(0);
                  setMediaKey((k) => k + 1);
                  startProgress();
                }}
                className="items-center"
              >
                <Image
                  source={{
                    uri: item.stories[0]?.story_image ?? item.user_image,
                  }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: fullyWatched ? "#9CA3AF" : "#F472B6",
                  }}
                />
                <Text
                  className="text-white text-xs text-center w-20 mt-1"
                  numberOfLines={1}
                >
                  {item.user_name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}

      <PostOptionsBottomSheet
        show={postOptionsVisible}
        setShow={(show: boolean) => {
          setPostOptionsVisible(show);
          if (!show) startProgress();
        }}
        setBlockUser={() => {}}
        setReportVisible={() => {}}
        setFocusedPost={(post: any) => setFocusedPost(post)}
        toggleFollow={() => {
          const currentStory =
            currentUserIndex !== null ? localStories[currentUserIndex] : null;
          if (currentStory?.user_id) {
            toggleFollow(currentStory.user_id);
          }
        }}
        isFollowing={
          currentUserIndex !== null && localStories[currentUserIndex]
            ? followedUsers.includes(
                String(localStories[currentUserIndex].user_id)
              )
            : false
        }
        focusedPost={focusedPost}
        deleteAction={() => {
          handleDeleteCurrent();
        }}
        user={{ user_id: LOGGED_IN_USER_ID, id: LOGGED_IN_USER_ID }}
      />
    </View>
  );
};

export default Stories;
