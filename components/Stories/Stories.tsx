// app/components/Stories/Stories.tsx
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing as REEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/* Ensure:
   - import 'react-native-gesture-handler' FIRST in your app entry
   - Root wrapped in <GestureHandlerRootView style={{flex:1}}>
   - 'react-native-reanimated' plugin LAST in babel.config.js
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
  segmentDuration?: number;
};

export type StoryUserLike =
  | {
      user_id?: string | number;
      user_image?: string;
      user_name?: string;
      stories?: StoryItem[] | string[];
    }
  | {
      id?: string | number;
      profile_picture?: string;
      username?: string;
      stories?: StoryItem[] | string[];
    };

export type StoriesProps = {
  storiesData: StoryUserLike[];
  initialUserIndex?: number;
  onRequestClose?: () => void;
  showStrip?: boolean;
  onUserFinished?: (userId: string | number) => void;
  onAllFinished?: () => void;
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

/** ---------- Progress persistence (POINTER-BASED) ---------- */
const PROGRESS_KEY = "stories_progress_pointer_v7";
type PointerMap = Record<string, { pointer: number; total: number }>;
const toKey = (id: string | number | undefined) => String(id ?? "");

async function loadPointers(): Promise<PointerMap> {
  try {
    const raw = await SecureStore.getItemAsync(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
async function savePointers(map: PointerMap) {
  try {
    await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(map));
  } catch {}
}

/** ---------- NORMALIZATION ---------- */
type NormalizedUser = {
  user_id: string;
  user_name: string;
  user_image: string;
  stories: StoryItem[];
};

function normalizeUsers(input: StoryUserLike[]): NormalizedUser[] {
  return (input ?? []).map((u, userIdx) => {
    const uidRaw = (u as any).user_id ?? (u as any).id ?? userIdx;
    const uname =
      (u as any).user_name ?? (u as any).username ?? `user_${userIdx}`;
    const uimg =
      (u as any).user_image ??
      (u as any).profile_picture ??
      "https://www.gravatar.com/avatar/?d=mp";
    const arr = Array.isArray((u as any).stories) ? (u as any).stories : [];

    const user_id = toKey(uidRaw);

    const normStories: StoryItem[] = (arr as (StoryItem | string)[])
      .map((s, idx) => {
        if (typeof s === "string") {
          const url = s?.trim();
          if (!url) return null;
          return {
            story_id: `${user_id}-${idx}`,
            story_image: url,
          } as StoryItem;
        } else if (s && typeof s === "object") {
          const img =
            (s as any).story_image ??
            (s as any).image ??
            (s as any).uri ??
            (s as any).url;
          if (!img) return null;
          const sid =
            (s as any).story_id ?? (s as any).id ?? `${user_id}-${idx}`;
          return {
            ...(s as any),
            story_id: sid,
            story_image: img,
          } as StoryItem;
        }
        return null;
      })
      .filter(Boolean) as StoryItem[];

    return {
      user_id,
      user_name: String(uname),
      user_image: String(uimg),
      stories: normStories,
    };
  });
}

/** ---------- Video wrapper ---------- */
const StoryVideoView: React.FC<{
  source: string;
  startAtSeconds?: number;
  segmentDuration?: number;
  onDurationKnown: (d: number) => void;
  onProgressRatio: (r: number) => void;
  onSegmentEnd: () => void;
  viewKey: string;
  onReadyToPlay: () => void;
}> = ({
  source,
  startAtSeconds = 0,
  segmentDuration,
  onDurationKnown,
  onProgressRatio,
  onSegmentEnd,
  viewKey,
  onReadyToPlay,
}) => {
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.play();
    p.timeUpdateEventInterval = 0.1;
  });

  useEventListener(player, "statusChange", (status: any) => {
    const duration = status?.duration ?? (player as any)?.duration ?? 0;
    if (duration) {
      onProgressRatio(0);
      onDurationKnown(duration);
      safeSeek(player, startAtSeconds);
      onReadyToPlay();
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

/** ---------- Component ---------- */
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

  const TOP_UI_HEIGHT = 60;
  const BOTTOM_UI_HEIGHT = 50;
  const LOGGED_IN_USER_ID = "you";

  // Normalize incoming data
  const [localStories, setLocalStories] = useState<NormalizedUser[]>(
    normalizeUsers(storiesData)
  );
  useEffect(() => {
    setLocalStories(normalizeUsers(storiesData));
  }, [storiesData]);

  // Selection
  const [currentUserIndex, setCurrentUserIndex] = useState<number | null>(
    localStories.length ? initialUserIndex : null
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Reanimated shared values
  const rProgress = useSharedValue(0); // 0..1
  const mediaOpacity = useSharedValue(0);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  // JS refs
  const progressValRef = useRef(0);
  const [mediaKey, setMediaKey] = useState(0);
  const cappedOnce = useRef<Set<string>>(new Set());
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState("");
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [focusedPost, setFocusedPost] = useState<any | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const toggleFollow = () => setIsFollowing((v) => !v);

  const isTransitioningRef = useRef(false);
  const storyEpochRef = useRef(0);

  const bumpEpoch = () => {
    storyEpochRef.current += 1;
    return storyEpochRef.current;
  };

  const advancedRef = useRef(false);
  const resetAdvanceFlags = () => {
    advancedRef.current = false;
  };

  /** stable reset helper (so we can include in deps) */
  const resetProgressReanimated = useCallback(() => {
    rProgress.value = 0;
    progressValRef.current = 0;
  }, [rProgress]);

  // Pointers
  const [pointerMap, setPointerMap] = useState<PointerMap>({});
  const [pointersLoaded, setPointersLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = await loadPointers();
      setPointerMap(loaded || {});
      setPointersLoaded(true);
    })();
  }, []);

  /** stable pointer utilities */
  const updatePointers = useCallback(
    (updater: (prev: PointerMap) => PointerMap) => {
      setPointerMap((prev) => {
        const next = updater(prev);
        savePointers(next);
        return next;
      });
    },
    []
  );

  const clearUserPointer = useCallback(
    (userId: string) => {
      updatePointers((prev) => {
        if (!(userId in prev)) return prev;
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    },
    [updatePointers]
  );

  // keep totals correct if data changes
  useEffect(() => {
    if (!pointersLoaded) return;
    updatePointers((prev) => {
      const copy: PointerMap = { ...prev };
      for (const u of localStories) {
        const key = toKey(u.user_id);
        const total = u.stories.length;
        const cur = copy[key];
        if (!cur) continue;
        if (cur.total !== total)
          copy[key] = { pointer: Math.min(cur.pointer, total), total };
      }
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStories, pointersLoaded]);

  const getTotal = (u: NormalizedUser) => u.stories.length;

  /** stable helper used inside effect */
  const getEntryIndexForUser = useCallback(
    (u: NormalizedUser) => {
      const key = toKey(u.user_id);
      const pm = pointerMap[key];
      const total = getTotal(u);
      if (!pm) return 0;
      if (total === 0) return 0;
      return Math.max(0, Math.min(pm.pointer, total - 1));
    },
    [pointerMap]
  );

  // Align to entry index
  useEffect(() => {
    if (!pointersLoaded) return;
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;

    const entry = getEntryIndexForUser(u);
    setCurrentStoryIndex(entry);
    setMediaKey((k) => k + 1);
    resetAdvanceFlags();
    resetProgressReanimated();
    bumpEpoch();
    mediaOpacity.value = 0;
  }, [
    currentUserIndex,
    pointersLoaded,
    localStories,
    getEntryIndexForUser,
    resetProgressReanimated,
    mediaOpacity,
  ]);

  // Keep pointer >= current visible index
  useEffect(() => {
    if (!pointersLoaded) return;
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;
    const total = u.stories.length;
    const key = toKey(u.user_id);
    updatePointers((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      const nextPointer = Math.max(cur.pointer, currentStoryIndex);
      if (nextPointer === cur.pointer && cur.total === total) return prev;
      return {
        ...prev,
        [key]: { pointer: Math.min(nextPointer, total), total },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryIndex, currentUserIndex, localStories, pointersLoaded]);

  /** ---------- Image autoplay ---------- */
  const startProgressImage = () => {
    if (isTransitioningRef.current || postOptionsVisible) return;
    resetProgressReanimated();
    resetAdvanceFlags();
    rProgress.value = withTiming(
      1,
      { duration: 5000, easing: REEasing.linear },
      (finished) => {
        if (finished) {
          runOnJS(finishAndAdvance)();
        }
      }
    );
  };

  // Unified finishing path
  const FINAL_HOLD_MS = 200;
  const finishAndAdvance = () => {
    rProgress.value = 1;
    progressValRef.current = 1;
    safeBumpAtCompletion();

    const u = currentUserIndex != null ? localStories[currentUserIndex] : null;
    if (!u) return;

    const isLastStory = currentStoryIndex >= u.stories.length - 1;

    setTimeout(() => {
      if (isLastStory) {
        handleNextUser();
      } else {
        handleNextStoryCore();
      }
    }, FINAL_HOLD_MS);
  };

  // Internal next-story switch
  const handleNextStoryCore = () => {
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;

    setCurrentStoryIndex((i) => i + 1);
    setMediaKey((k) => k + 1);
    bumpEpoch();
    advancedRef.current = false;
    mediaOpacity.value = 0;

    bumpPointerForward(u, currentStoryIndex + 1);
  };

  // When exiting mid/late story — make this STABLE
  const bumpPointerOnExit = useCallback(() => {
    if (!pointersLoaded) return;
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;
    const total = u.stories.length;
    if (total === 0) return;

    const almostDone = progressValRef.current >= 0.98;
    const key = toKey(u.user_id);

    if (almostDone && currentStoryIndex + 1 >= total) {
      clearUserPointer(key);
      return;
    }

    updatePointers((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      const desired = almostDone
        ? currentStoryIndex + 1
        : Math.max(cur.pointer, currentStoryIndex);
      return {
        ...prev,
        [key]: {
          pointer: Math.min(Math.max(cur.pointer, desired), total),
          total,
        },
      };
    });
  }, [
    pointersLoaded,
    currentUserIndex,
    localStories,
    currentStoryIndex,
    clearUserPointer,
    updatePointers,
  ]);

  // Back handler — include bumpPointerOnExit so linter is happy
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (currentUserIndex !== null) {
        bumpPointerOnExit();
        onRequestClose?.();
        setCurrentUserIndex(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [currentUserIndex, onRequestClose, bumpPointerOnExit]);

  // Unmount — include bumpPointerOnExit
  useEffect(() => {
    return () => {
      bumpPointerOnExit();
    };
  }, [bumpPointerOnExit]);

  // Cap video to 60s
  const capVideoToSixty = (
    userIdx: number,
    storyIdx: number,
    videoDuration: number
  ) => {
    const user = localStories[userIdx];
    if (!user) return;
    const story = user.stories?.[storyIdx];
    if (!story) return;
    const key = String(story.story_id ?? `${user.user_id}-${storyIdx}`);
    if (cappedOnce.current.has(key)) return;

    if (videoDuration > 60) {
      setLocalStories((prev) => {
        const copy = [...prev];
        const u = { ...copy[userIdx] };
        const s = {
          ...u.stories[storyIdx],
          startAtSeconds: 0,
          segmentDuration: 60,
        };
        u.stories = [
          ...u.stories.slice(0, storyIdx),
          s,
          ...u.stories.slice(1 + storyIdx),
        ];
        copy[userIdx] = u;
        return copy;
      });
    }
    cappedOnce.current.add(key);
  };

  /** ---------- NAV ---------- */
  const bumpPointerForward = (user: NormalizedUser, nextIndex: number) => {
    const total = user.stories.length;
    const key = toKey(user.user_id);
    updatePointers((prev) => {
      const cur = prev[key] ?? { pointer: 0, total };
      const bumped = Math.max(cur.pointer, nextIndex);
      return { ...prev, [key]: { pointer: Math.min(bumped, total), total } };
    });
  };

  const safeBumpAtCompletion = () => {
    if (!pointersLoaded) return;
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;

    if (!advancedRef.current && progressValRef.current >= 0.98) {
      advancedRef.current = true;
      bumpPointerForward(u, currentStoryIndex + 1);
    }
  };

  const switchToStory = (nextIndex: number) => {
    rProgress.value = 0;
    progressValRef.current = 0;
    setCurrentStoryIndex(nextIndex);
    setMediaKey((k) => k + 1);
    bumpEpoch();
    advancedRef.current = false;
    mediaOpacity.value = 0;
  };

  const handleNextStory = () => {
    if (currentUserIndex === null) return;
    const u = localStories[currentUserIndex];
    if (!u) return;

    bumpPointerForward(u, currentStoryIndex + 1);

    if (currentStoryIndex < u.stories.length - 1) {
      switchToStory(currentStoryIndex + 1);
    } else {
      finishAndAdvance();
    }
  };

  const handlePreviousStory = () => {
    if (currentUserIndex === null) return;
    if (currentStoryIndex > 0) {
      switchToStory(currentStoryIndex - 1);
    } else {
      handlePreviousUser();
    }
  };

  const switchToUser = (nextUserIndex: number) => {
    rProgress.value = 0;
    progressValRef.current = 0;
    mediaOpacity.value = 0;
    setCurrentUserIndex(nextUserIndex);
    setMediaKey((k) => k + 1);
    advancedRef.current = false;
    bumpEpoch();
  };

  const handleNextUser = () => {
    if (currentUserIndex === null) return;
    const atLast = currentUserIndex >= localStories.length - 1;
    if (!atLast) {
      switchToUser(currentUserIndex + 1);
    } else {
      setTimeout(() => {
        onAllFinished?.();
        onRequestClose?.();
        setCurrentUserIndex(null);
      }, FINAL_HOLD_MS);
    }
  };

  const handlePreviousUser = () => {
    if (currentUserIndex === null) return;
    if (currentUserIndex > 0) {
      switchToUser(currentUserIndex - 1);
    } else {
      onRequestClose?.();
      setCurrentUserIndex(null);
    }
  };

  // Heart animation (Reanimated)
  const triggerHeartAnimation = () => {
    heartOpacity.value = withTiming(1, {
      duration: 120,
      easing: REEasing.ease,
    });
    heartScale.value = withSequence(
      withTiming(1.2, {
        duration: 180,
        easing: REEasing.bezier(0.2, 0.8, 0.2, 1.4),
      }),
      withTiming(1, { duration: 120, easing: REEasing.ease })
    );
    heartOpacity.value = withDelay(
      250,
      withTiming(0, { duration: 220, easing: REEasing.in(REEasing.quad) })
    );
  };

  /** ---------- Progress strip ---------- */
  const ProgressSlot = ({
    state,
  }: {
    state: "past" | "current" | "future";
  }) => {
    const slotW = useSharedValue(0);
    const onLayout = (e: any) => {
      slotW.value = e.nativeEvent.layout.width;
    };

    const fillStyle = useAnimatedStyle(() => {
      const total = slotW.value;
      let w = 0;

      if (state === "past") {
        w = total;
      } else if (state === "current") {
        w = Math.max(0, total * rProgress.value);
      } else {
        w = 0;
      }

      return { width: w, height: "100%" };
    }, [state]);

    return (
      <View
        onLayout={onLayout}
        className="flex-1 bg-white/30 mx-0.5 overflow-hidden">
        <Animated.View style={fillStyle} className="bg-white" />
      </View>
    );
  };

  // Animated styles
  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartScale.value || 0.001 }],
  }));
  const mediaFadeStyle = useAnimatedStyle(() => ({
    opacity: mediaOpacity.value,
  }));

  /** Render one user's stories */
  const renderStories = () => {
    if (!pointersLoaded) return null;
    if (currentUserIndex === null) return null;

    const user = localStories[currentUserIndex];
    const story = user?.stories?.[currentStoryIndex];
    if (!user || !story) return null;

    const isVideo = isVideoUrl(story.story_image);
    const viewKey = `${user.user_id}-${currentStoryIndex}-${mediaKey}`;

    const panGesture = Gesture.Pan()
      .enabled(!postOptionsVisible)
      .minDistance(10)
      .activeOffsetX([-20, 20])
      .activeOffsetY([-20, 20])
      .onEnd((e: any) => {
        const { translationX, translationY, velocityY } = e;
        if (translationY > 100 || velocityY > 1000) {
          bumpPointerOnExit();
          onRequestClose?.();
          setCurrentUserIndex(null);
        } else if (translationX < -50) {
          handleNextUser();
        } else if (translationX > 50) {
          handlePreviousUser();
        }
      });

    const tapGesture = Gesture.Tap()
      .enabled(!postOptionsVisible)
      .maxDuration(250)
      .maxDeltaX(12)
      .maxDeltaY(12)
      .onEnd((event: any, success: boolean) => {
        if (!success) return;
        // @ts-ignore
        const ax = event.absoluteX ?? event.x;
        // @ts-ignore
        const ay = event.absoluteY ?? event.y;

        const topGuard = insets.top + TOP_UI_HEIGHT;
        const bottomGuard = height - (insets.bottom + BOTTOM_UI_HEIGHT);
        if (ay <= topGuard || ay >= bottomGuard) return;

        if (ax >= width / 2) {
          handleNextStory();
        } else {
          handlePreviousStory();
        }
      });

    const combinedGesture = Gesture.Race(panGesture, tapGesture);

    const currentEpoch = storyEpochRef.current;

    const onMediaReady = () => {
      if (currentEpoch !== storyEpochRef.current) return;
      mediaOpacity.value = withTiming(1, {
        duration: 180,
        easing: REEasing.out(REEasing.quad),
      });
      rProgress.value = 0;
      progressValRef.current = 0;

      if (!isVideo) startProgressImage();
    };

    return (
      <GestureDetector gesture={combinedGesture}>
        <SafeAreaView
          edges={["top", "bottom"]}
          style={{ flex: 1, backgroundColor: "black" }}>
          {/* Media */}
          <View style={{ flex: 1, paddingBottom: BOTTOM_UI_HEIGHT }}>
            <Animated.View style={[{ flex: 1 }, mediaFadeStyle]}>
              {isVideo ? (
                <StoryVideoView
                  viewKey={`vid-${viewKey}`}
                  source={story.story_image}
                  startAtSeconds={story.startAtSeconds ?? 0}
                  segmentDuration={story.segmentDuration}
                  onDurationKnown={(dur) => {
                    if (currentEpoch !== storyEpochRef.current) return;
                    capVideoToSixty(currentUserIndex!, currentStoryIndex, dur);
                  }}
                  onProgressRatio={(r) => {
                    if (currentEpoch !== storyEpochRef.current) return;
                    rProgress.value = r;
                    progressValRef.current = r;
                  }}
                  onSegmentEnd={() => {
                    if (currentEpoch !== storyEpochRef.current) return;
                    finishAndAdvance();
                  }}
                  onReadyToPlay={onMediaReady}
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
                  onLoadStart={() => {
                    resetAdvanceFlags();
                    rProgress.value = 0;
                    progressValRef.current = 0;
                  }}
                  onLoadEnd={onMediaReady}
                />
              )}
            </Animated.View>
          </View>

          {/* Heart */}
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
            }}>
            <Animated.View style={heartStyle}>
              <Ionicons name="heart" size={140} color="#FF2D55" />
            </Animated.View>
          </View>

          {/* Top UI */}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: insets.top + 10,
              left: 6,
              right: 6,
            }}>
            {/* Progress bars */}
            <View className="flex-row h-[3px] mb-5">
              {user.stories.map((_, index) => {
                let state: "past" | "current" | "future" = "future";
                if (index < currentStoryIndex) state = "past";
                else if (index === currentStoryIndex) state = "current";
                return (
                  <ProgressSlot
                    key={`${user.user_id}-${index}`}
                    state={state}
                  />
                );
              })}
            </View>

            {/* Avatar + menu */}
            <View className="flex-row items-center justify-between">
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
                }>
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
                className="p-2">
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom actions */}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: insets.bottom,
              paddingHorizontal: 12,
            }}>
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
              <TouchableOpacity
                onPress={() => {
                  setLiked((v) => !v);
                  triggerHeartAnimation();
                }}
                className="ml-4">
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

  /** Root render */
  return (
    <View className="flex-1 bg-black">
      {renderStories()}

      {/* Bottom strip */}
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
          renderItem={({
            item,
            index,
          }: {
            item: NormalizedUser;
            index: number;
          }) => {
            return (
              <TouchableOpacity
                onPress={() => {
                  rProgress.value = 0;
                  progressValRef.current = 0;
                  mediaOpacity.value = 0;
                  setCurrentUserIndex(index);
                  advancedRef.current = false;
                  setMediaKey((k) => k + 1);
                  bumpEpoch();
                }}
                className="items-center">
                <Image
                  source={{
                    uri: item.stories[0]?.story_image ?? item.user_image,
                  }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: "#F472B6",
                  }}
                />
                <Text
                  className="text-white text-xs text-center w-20 mt-1"
                  numberOfLines={1}>
                  {item.user_name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}

      <PostOptionsBottomSheet
        show={postOptionsVisible}
        setShow={(show: boolean) => setPostOptionsVisible(show)}
        setBlockUser={() => {}}
        setReportVisible={() => {}}
        setFocusedPost={(post: any) => setFocusedPost(post)}
        isFollowing={isFollowing}
        toggleFollow={toggleFollow}
        focusedPost={focusedPost}
        deleteAction={() => {}}
        user={{ user_id: LOGGED_IN_USER_ID, id: LOGGED_IN_USER_ID }}
      />
    </View>
  );
};

export default Stories;
