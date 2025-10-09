import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import ShareSectionBottomSheet from "@/components/ShareSectionBottomSheet";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
  shareUsers?: any[];
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

    // Use the capped segment length (≤ 60) if provided, else the full duration
    const segLen = segmentDuration ?? duration;
    const segStart = startAtSeconds ?? 0;

    const ratio = Math.max(0, Math.min(1, (currentTime - segStart) / segLen));
    onProgressRatio(ratio);

    // When we reach the segment end (capped), advance to next story
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

const Stories: React.FC<StoriesProps> = ({
  storiesData,
  initialUserIndex = 0,
  onRequestClose,
  showStrip = false,
  shareUsers = [],
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const TOP_UI_HEIGHT = 60;
  const BOTTOM_UI_HEIGHT = 50;

  // TODO: replace with your actual logged-in user id from auth/session
  const LOGGED_IN_USER_ID = "you";

  // Keep a local copy we can modify (delete etc.)
  const [localStories, setLocalStories] = useState<StoryUser[]>(storiesData);

  const [currentUserIndex, setCurrentUserIndex] = useState<number | null>(
    storiesData.length ? initialUserIndex : null
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  // Post options sheet state
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [focusedPost, setFocusedPost] = useState<any | null>(null);

  const progress = useRef(new Animated.Value(0)).current;

  // ✅ NEW: track which items we've already capped so we don't reapply
  const cappedOnce = useRef<Set<string | number>>(new Set());

  const [mediaKey, setMediaKey] = useState(0); // force-remount media

  useEffect(() => {
    if (currentUserIndex !== null && !postOptionsVisible) startProgress();
    return () => progress.stopAnimation();
  }, [currentStoryIndex, currentUserIndex, postOptionsVisible]);

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

    if (!isVideoUrl(story.story_image)) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) handleNextStory();
      });
    }
  };

  /** ✅ Cap a single story's video to max 60s (no splitting) */
  const capVideoToSixty = (
    userIdx: number,
    storyIdx: number,
    videoDuration: number
  ) => {
    const user = localStories[userIdx];
    const story = user?.stories?.[storyIdx];
    if (!user || !story) return;

    const key = story.story_id ?? `${user.user_id}-${storyIdx}`;
    if (cappedOnce.current.has(key)) return;

    // If longer than 60s: keep only first 60s via segmentDuration, no new items
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
      // ≤ 60s: ensure there's no stale segmentDuration
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

  const handleNextStory = () => {
    if (currentUserIndex === null) return;
    const userStories = localStories[currentUserIndex].stories;
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
      setMediaKey((k) => k + 1);
    } else {
      handleNextUser();
    }
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

  const handleNextUser = () => {
    if (currentUserIndex === null) return;
    if (currentUserIndex < localStories.length - 1) {
      setCurrentUserIndex((u) => (u === null ? 0 : u + 1));
      setCurrentStoryIndex(0);
      setMediaKey((k) => k + 1);
      progress.stopAnimation();
      progress.setValue(0);
    } else {
      onRequestClose?.();
      setCurrentUserIndex(null);
    }
  };

  const handlePreviousUser = () => {
    if (currentUserIndex === null) return;
    if (currentUserIndex > 0) {
      const prev = currentUserIndex - 1;
      setCurrentUserIndex(prev);
      setCurrentStoryIndex(localStories[prev].stories.length - 1);
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

    setPostOptionsVisible(false); // close sheet
    setLocalStories((prev) => {
      const users = [...prev];
      const u = { ...users[currentUserIndex] };

      // allow delete only if owner matches the logged-in user
      if (String(u.user_id) !== String(LOGGED_IN_USER_ID)) {
        startProgress();
        return users;
      }

      const nextStories = u.stories.filter((_s, i) => i !== currentStoryIndex);

      progress.stopAnimation();
      progress.setValue(0);

      if (nextStories.length > 0) {
        u.stories = nextStories;
        users[currentUserIndex] = u;
        const nextIndex =
          currentStoryIndex >= nextStories.length
            ? nextStories.length - 1
            : currentStoryIndex;
        setCurrentStoryIndex(nextIndex);
        setMediaKey((k) => k + 1);
        return users;
      }

      // remove the user if no stories left
      users.splice(currentUserIndex, 1);
      if (users.length === 0) {
        setCurrentStoryIndex(0);
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

  /* =========================
     GESTURES (fixed conflicts)
     ========================= */
  const tapGesture = Gesture.Tap()
    .enabled(!postOptionsVisible)
    .maxDuration(250)
    .maxDeltaX(12)
    .maxDeltaY(12)
    .onEnd((event, success) => {
      if (!success) return;
      const ax =
        // @ts-ignore
        event.absoluteX ??
        // @ts-ignore
        event.x;
      const ay =
        // @ts-ignore
        event.absoluteY ??
        // @ts-ignore
        event.y;

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
        // swipe left → next user
        handleNextUser();
      } else if (translationX > 50) {
        // swipe right → previous user
        handlePreviousUser();
      } else {
        startProgress(); // resume if no navigation happened
      }
    });

  // Race: whichever recognizes first wins (fixes tap-vs-pan conflicts)
  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  /** Render one user's stories */
  const renderStories = () => {
    if (currentUserIndex === null) return null;

    const user = localStories[currentUserIndex];
    const story = user?.stories?.[currentStoryIndex];
    if (!user || !story) return null;

    const video = isVideoUrl(story.story_image);
    const viewKey = `${user.user_id}-${story.story_id}-${mediaKey}`;

    return (
      <GestureDetector gesture={combinedGesture}>
        <SafeAreaView
          edges={["top", "bottom"]}
          style={{ flex: 1, backgroundColor: "black" }}>
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
                    // ✅ If >60s, cap this single story to 60s (no splitting)
                    capVideoToSixty(currentUserIndex!, currentStoryIndex, dur);
                  }}
                  onProgressRatio={(r) => progress.setValue(r)}
                  onSegmentEnd={handleNextStory}
                />
              ) : (
                <Image
                  key={`img-${viewKey}`}
                  source={{ uri: story.story_image }}
                  style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                  onLoadEnd={startProgress}
                />
              )}
            </View>
          </View>

          {/* Top UI (below notch) */}
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
                    className="flex-1 bg-white/30 mx-0.5 overflow-hidden">
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
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() =>
                  // @ts-ignore adjust to your route
                  navigation.navigate("NonTabProfile", { user: user.user_id })
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
                  progress.stopAnimation();
                  const u = localStories[currentUserIndex!];
                  const s = u.stories[currentStoryIndex];

                  // Ensure IDs for ownership + delete
                  setFocusedPost({
                    ...s,
                    user_id: u.user_id, // owner id
                    story_id: s.story_id, // delete id
                    story_owner_name: u.user_name,
                  });

                  setPostOptionsVisible(true);
                }}
                className="p-2">
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
              className="bg-black/60 px-3 py-2">
              <Text
                style={{ fontSize: story.caption_size ?? 18 }}
                className="text-white self-center">
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
              paddingHorizontal: 10,
            }}>
            <View className="flex-row items-center gap-2 py-2 rounded-full">
              <TouchableOpacity>
                <Ionicons name="chatbubble-outline" size={28} color="#fff" />
              </TouchableOpacity>

              <TextInput
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={() => setMessage("")}
                placeholder="Send message"
                placeholderTextColor="#d1d5db"
                className="flex-1 px-3 py-2 border border-white rounded-full text-white"
              />

              <TouchableOpacity onPress={() => setLiked((l) => !l)}>
                <MaterialIcons
                  name={liked ? "favorite" : "favorite-border"}
                  size={28}
                  color={liked ? "#ff0000" : "#fff"}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShareOpen(true)}>
                <Ionicons name="arrow-redo-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GestureDetector>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {renderStories()}

      {/* Optional bottom strip */}
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
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => {
                setCurrentUserIndex(index);
                setCurrentStoryIndex(0);
                progress.stopAnimation();
                progress.setValue(0);
                setMediaKey((k) => k + 1);
                startProgress();
              }}
              className="items-center">
              <Image
                source={{
                  uri: item.stories[0]?.story_image ?? item.user_image,
                }}
                className="w-16 h-16 rounded-full border-2 border-pink-400"
              />
              <Text
                className="text-white text-xs text-center w-20 mt-1"
                numberOfLines={1}>
                {item.user_name}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : null}

      <ShareSectionBottomSheet
        show={shareOpen}
        setShow={setShareOpen}
        users={shareUsers}
        postId={
          currentUserIndex !== null
            ? String(localStories[currentUserIndex]?.user_id ?? "")
            : ""
        }
        initialHeightPct={0.4}
        maxHeightPct={0.9}
      />

      {/* Post Options bottom sheet (opens on three-dots) */}
      <PostOptionsBottomSheet
        show={postOptionsVisible}
        setShow={(show: boolean) => {
          setPostOptionsVisible(show);
          if (!show) startProgress(); // resume when closed
        }}
        setBlockUser={(show: boolean) => {}}
        setReportVisible={(show: boolean) => {}}
        setFocusedPost={(post: any) => setFocusedPost(post)}
        toggleFollow={() => {}}
        isFollowing={false}
        focusedPost={focusedPost}
        deleteAction={(postId?: string | number) => {
          // Delete current item
          handleDeleteCurrent();
        }}
        user={{ user_id: LOGGED_IN_USER_ID, id: LOGGED_IN_USER_ID }}
      />
    </View>
  );
};

export default Stories;
