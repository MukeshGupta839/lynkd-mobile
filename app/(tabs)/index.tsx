import BlockUserPopup from "@/components/BlockUserPopup";
import CameraPost from "@/components/CameraPost";
import Chats from "@/components/chat/Chat";
import CommentsSheet, { CommentsSheetHandle } from "@/components/Comment";

import { PostCard } from "@/components/PostCard";

import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "@/components/ReportPostBottomSheet";
import { POSTS } from "@/constants/HomeData";
import { cameraActiveSV, tabBarHiddenSV } from "@/lib/tabBarVisibility";
import { FontAwesome6 } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { BlurView } from "expo-blur";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  ViewToken,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

// ----- Dummy data (replace with your API data later) -----
const STORIES = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i + 1),
  name: [
    "alex_harma",
    "jamie.870",
    "jane.math",
    "mad_max",
    "lucas",
    "jane_doe",
    "james_brown",
    "sophia_king",
    "emma_clarke",
    "lucas_williams",
  ][i],
  avatar: `https://randomuser.me/api/portraits/${i % 2 ? "women" : "men"}/${
    i + 1
  }.jpg`,
}));

// ----- PostCard Component is now imported from @/components/PostCard -----

const NotificationBell = ({
  count = 0,
  onPress,
}: {
  count?: number;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="relative w-9 h-9 rounded-full items-center justify-center">
      <Ionicons name="notifications-outline" size={24} color="#000" />

      {count > 0 && (
        <View
          className="absolute -top-1 -right-1 bg-black rounded-full h-6 w-6 px-1
                     items-center justify-center border border-white"
          // If your Tailwind doesn't support min-w, use style={{ minWidth: 16 }}
        >
          <Text className="text-white text-[10px] font-bold">
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ----- Screen -----
export default function ConsumerHomeUI() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const NAV_BAR_CONTENT_HEIGHT = 56;
  const TOP_BAR_HEIGHT = insets.top - 10 + NAV_BAR_CONTENT_HEIGHT;
  const flatListRef = useRef<FlatList>(null);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  // Post options state
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [blockUser, setBlockUser] = useState(false);
  const [focusedPost, setFocusedPost] = useState<any>(null);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  // Camera active state: only mount/start CameraPost when true
  const [cameraActive, setCameraActive] = useState(false);

  // Mock user data - replace with your actual user context
  const user = { id: "1", username: "current_user" };

  // Header animation state
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isFetchingNextPage] = useState(false); // You can connect this to your API loading state
  // Use Reanimated shared value for header translation
  const headerTranslateY = useSharedValue(0);
  const lastScrollY = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentHeaderTranslateValue = useRef(0); // Track current header position
  const [refreshing, setRefreshing] = React.useState(false);

  // Tab bar hiding state
  const [tabBarHidden, setTabBarHidden] = useState(false);

  // Scroll behavior constants
  const HIDE_THRESHOLD = 10; // pixels to scroll down before hiding header
  const SHOW_THRESHOLD = 10; // pixels to scroll up before showing header
  const TAB_BAR_HIDE_THRESHOLD = 50; // pixels to scroll down before hiding tab bar
  const TAB_BAR_SHOW_THRESHOLD = 30; // pixels to scroll up before showing tab bar
  // Header animation functions
  const hideHeader = () => {
    setHeaderHidden(true);
    currentHeaderTranslateValue.current = -TOP_BAR_HEIGHT;
    headerTranslateY.value = withTiming(-TOP_BAR_HEIGHT, {
      duration: 200,
    });
  };

  const showHeader = () => {
    setHeaderHidden(false);
    currentHeaderTranslateValue.current = 0;
    headerTranslateY.value = withTiming(0, {
      duration: 200,
    });
  };

  // Tab bar animation functions
  const hideTabBar = () => {
    setTabBarHidden(true);
    tabBarHiddenSV.value = true;
  };

  const showTabBar = () => {
    setTabBarHidden(false);
    tabBarHiddenSV.value = false;
  };

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const cameraResponse = await Camera.requestCameraPermissionsAsync();
        const mediaLibraryResponse =
          await MediaLibrary.requestPermissionsAsync();

        if (cameraResponse.status !== "granted") {
          console.warn("Camera permission not granted");
        }
        if (mediaLibraryResponse.status !== "granted") {
          console.warn("Media library permission not granted");
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
      }
    };

    requestPermissions();
  }, []);

  // Ensure tab bar is visible when component mounts/unmounts
  useEffect(() => {
    // Show tab bar when component mounts
    showTabBar();

    // Reset translateX to center when home tab is opened/focused
    translateX.value = 0;

    // Cleanup: show tab bar when component unmounts
    return () => {
      tabBarHiddenSV.value = false;
    };
  }, []);

  const handleOnScroll = (event: any) => {
    const currentRawY = event.nativeEvent.contentOffset.y;
    const currentY = Math.max(0, currentRawY); // Ensure currentY is not negative

    const delta = currentY - lastScrollY.current;

    // --- Prevent header from showing due to loader appearance ---
    if (isFetchingNextPage && headerHidden && currentY > TOP_BAR_HEIGHT) {
      lastScrollY.current = currentY;
      return;
    }

    if (currentY <= TOP_BAR_HEIGHT) {
      if (
        !headerHidden &&
        Math.abs(currentHeaderTranslateValue.current) < 0.1 &&
        currentY > 0 &&
        delta <= 0
      ) {
        if (headerHidden) {
          setHeaderHidden(false);
        }
      } else {
        const newTranslateValue = -currentY;
        headerTranslateY.value = newTranslateValue;
        currentHeaderTranslateValue.current = newTranslateValue;
        const isNowHiddenBySync = newTranslateValue <= -TOP_BAR_HEIGHT + 0.1;
        if (headerHidden !== isNowHiddenBySync) {
          setHeaderHidden(isNowHiddenBySync);
        }
      }
    } else {
      if (delta > HIDE_THRESHOLD && !headerHidden) {
        hideHeader();
      } else if (delta < -SHOW_THRESHOLD && headerHidden) {
        showHeader();
      }

      if (delta > TAB_BAR_HIDE_THRESHOLD && !tabBarHidden) {
        hideTabBar();
      } else if (delta < -TAB_BAR_SHOW_THRESHOLD && tabBarHidden) {
        showTabBar();
      }
    }
    lastScrollY.current = currentY;
  };

  // Handle viewable items change to track which posts are visible
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      console.log("Viewable items changed:", viewableItems.length);
      const visiblePostIds = viewableItems
        .map((item) => item.item?.id)
        .filter(Boolean);

      console.log("Visible post IDs:", visiblePostIds);
      setVisibleItems(visiblePostIds);
    },
    []
  );

  // Configure viewability for auto-play (item needs to be at least 60% visible)
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  // Post options helper functions
  const toggleFollow = useCallback(
    async (userId: string) => {
      const isFollowing = followedUsers.includes(userId);
      try {
        Vibration.vibrate(100);
        console.log(isFollowing ? "Unfollowing" : "Following", userId);
        // Add your follow/unfollow API call here

        setFollowedUsers((prev) =>
          isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
      } catch (error) {
        console.error(`Error toggling follow for user ${userId}:`, error);
      }
    },
    [followedUsers]
  );

  const deletePost = useCallback(async (postId: string) => {
    try {
      console.log("Deleting post:", postId);
      // Add your delete post API call here
      setPostOptionsVisible(false);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }, []);

  const handleLongPress = useCallback((item: any) => {
    Vibration.vibrate(100);
    console.log("Long press on post:", item.id);
    setFocusedPost(item);
    setPostOptionsVisible(true);
  }, []);

  // const tabBarHeight = useBottomTabBarHeight();
  // const footerSpacing = tabBarHeight;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const { width } = Dimensions.get("window");
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  const [commentsPost, setCommentsPost] = useState<any>(null);
  const [shouldNavigateToChat, setShouldNavigateToChat] = useState(false);

  // ref to control the modal
  const commentsRef = useRef<CommentsSheetHandle>(null);

  // open handler passed down to PostCard
  const openComments = useCallback((post: any) => {
    setCommentsPost(post);
    commentsRef.current?.present();
  }, []);

  // Handle navigation to chat after gesture completes
  useEffect(() => {
    if (shouldNavigateToChat) {
      router.push("/(tabs)/chat");
      setShouldNavigateToChat(false);
      // Reset translateX to center after navigating to chat
      // This ensures when user comes back to home tab, it's centered
      setTimeout(() => {
        translateX.value = 0;
      }, 100);
    }
  }, [shouldNavigateToChat, router]);

  // Debug gesture state
  useEffect(() => {
    console.log("isGestureActiveState changed to:", isGestureActiveState);
  }, [isGestureActiveState]);

  // Safety mechanism to reset gesture state if it gets stuck
  useEffect(() => {
    if (isGestureActiveState) {
      const timeout = setTimeout(() => {
        console.log("Safety reset: Force resetting gesture state");
        setIsGestureActiveState(false);
      }, 3000); // Reset after 3 seconds if still active

      return () => clearTimeout(timeout);
    }
  }, [isGestureActiveState]);

  const panGesture = Gesture.Pan()
    .failOffsetY([-15, 15]) // Increased from 10 to 15
    .activeOffsetX(-25) // Only allow left swipe (negative direction), disable right swipe
    .maxPointers(1)
    // .enabled(!cameraActive)
    .onStart(() => {
      startX.value = translateX.value;
      isGestureActive.value = false;
      // Always reset gesture state on start
      // runOnJS(setIsGestureActiveState)(false);
      scheduleOnRN(setIsGestureActiveState, false);
    })
    .onUpdate((e) => {
      const translationX = Number.isFinite(e.translationX) ? e.translationX : 0;
      const currentStartX = Number.isFinite(startX.value) ? startX.value : 0;

      // Mark gesture as active if there's significant movement (increased threshold)
      if (Math.abs(translationX) > 40) {
        // Increased from 20 to 40
        if (!isGestureActive.value) {
          isGestureActive.value = true;
          // runOnJS(setIsGestureActiveState)(true);
          scheduleOnRN(setIsGestureActiveState, true);
          console.log("Gesture became active, blocking touches");
        }
      }

      // Only allow left swipe (negative direction), block right swipe
      const next = Math.max(
        -width,
        Math.min(0, currentStartX + translationX) // Max 0 prevents right swipe
      );
      translateX.value = next;
    })
    .onEnd((e) => {
      const translationX = Number.isFinite(e.translationX) ? e.translationX : 0;
      const vx = Number.isFinite(e.velocityX) ? e.velocityX : 0;
      const currentStartX = Number.isFinite(startX.value) ? startX.value : 0;

      let targetPosition = 0;

      const startedFromCenter = Math.abs(currentStartX) < width * 0.1;
      const startedFromLeft = currentStartX < -width * 0.5; // Chat underlay

      if (startedFromCenter) {
        const swipeThreshold = width * 0.25;
        const velocityThreshold = 500;

        // RIGHT SWIPE DISABLED - only allow left swipe to chat
        if (translationX < -swipeThreshold || vx < -velocityThreshold) {
          // swipe left -> Chat underlay
          targetPosition = -width;
          scheduleOnRN(setShouldNavigateToChat, true);
        } else {
          targetPosition = 0; // stay centered (right swipe disabled)
        }
      } else if (startedFromLeft) {
        // Chat underlay: ONLY allow right-swipe to go back
        const minSwipe = width * 0.12;
        const minVelocity = 250;

        if (translationX > minSwipe || vx > minVelocity) {
          targetPosition = 0; // right swipe -> center
        } else {
          targetPosition = -width; // ignore left swipe -> stay on Chat
        }
      }

      translateX.value = withSpring(targetPosition, {
        damping: 15,
        stiffness: 160,
      });

      // If we ended on the POST underlay (targetPosition === width) then
      // activate the camera; otherwise deactivate it. Set both the React
      // state (for mounting) and the shared value (for UI-thread animations).
      const activate = targetPosition === width;
      cameraActiveSV.value = activate;
      scheduleOnRN(setCameraActive, activate);

      isGestureActive.value = false;
      // runOnJS(setIsGestureActiveState)(false);
      scheduleOnRN(setIsGestureActiveState, false);
    });

  // --- STYLES ---
  const feedStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [{ translateX: safeTranslateX }],
        zIndex: 2,
      };
    } catch (error) {
      console.warn("Error in feedStyle:", error);
      return {
        transform: [{ translateX: 0 }],
        zIndex: 2,
      };
    }
  });

  const rightUnderlayStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [
          {
            translateX: interpolate(
              safeTranslateX,
              [0, width],
              [-width, 0],
              Extrapolation.CLAMP
            ),
          },
        ],
        opacity: interpolate(
          safeTranslateX,
          [0, width],
          [0, 1],
          Extrapolation.CLAMP
        ),
        zIndex: 0,
      };
    } catch (error) {
      console.warn("Error in rightUnderlayStyle:", error);
      return {
        transform: [{ translateX: -width }],
        opacity: 0,
        zIndex: 0,
      };
    }
  });

  const leftUnderlayStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [
          {
            translateX: interpolate(
              safeTranslateX,
              [-width, 0],
              [0, width],
              Extrapolation.CLAMP
            ),
          },
        ],
        opacity: interpolate(
          safeTranslateX,
          [-width, 0],
          [1, 0],
          Extrapolation.CLAMP
        ),
        zIndex: 0,
      };
    } catch (error) {
      console.warn("Error in leftUnderlayStyle:", error);
      return {
        transform: [{ translateX: width }],
        opacity: 0,
        zIndex: 0,
      };
    }
  });

  const snapToCenter = () => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 160 });
    tabBarHiddenSV.value = false;
    // ensure camera is deactivated when snapping back to feed
    setCameraActive(false);
    cameraActiveSV.value = false;
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View style={{ flex: 1 }}>
        <StatusBar
          backgroundColor="transparent"
          style="dark"
          translucent={Platform.OS === "android"}
        />
        {/* UNDERLAYS — rendered first so they sit behind the feed */}
        <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            rightUnderlayStyle,
            { zIndex: 3 },
          ]}
          pointerEvents="auto">
          <CameraPost onBackToFeed={snapToCenter} active={cameraActive} />
        </Reanimated.View>

        <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            leftUnderlayStyle,
          ]}
          pointerEvents="auto">
          {/* Chats screen */}
          <Chats />
        </Reanimated.View>

        {/* FEED ON TOP */}
        <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            feedStyle,
            { zIndex: 1 },
          ]}
          pointerEvents="auto">
          <View className="flex-1 bg-[#F3F4F8]">
            {/* Top bar */}
            <Reanimated.View
              className="absolute top-0 right-0 left-0 z-10 bg-white overflow-hidden"
              style={[
                {
                  height: TOP_BAR_HEIGHT,
                },
                headerAnimatedStyle,
              ]}>
              <View
                style={{
                  paddingTop: insets.top - 10,
                  backgroundColor: "white",
                }}>
                <View
                  style={{
                    height: NAV_BAR_CONTENT_HEIGHT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 12,
                  }}>
                  <Text className="text-2xl font-bold">LYNKD</Text>
                  <View className="flex-row items-center space-x-3">
                    <TouchableOpacity
                      className="w-9 h-9 rounded-full items-center justify-center"
                      onPress={() => {
                        router.push("/(search)");
                      }}>
                      <Ionicons name="search-outline" size={24} color="#000" />
                    </TouchableOpacity>
                    <NotificationBell
                      count={12}
                      onPress={() => {
                        router.push("/(notifications)");
                      }}
                    />
                  </View>
                </View>
              </View>
            </Reanimated.View>

            {/* Feed list */}
            <FlatList
              ref={flatListRef}
              data={POSTS}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false, listener: handleOnScroll }
              )}
              contentContainerStyle={{
                // On Android we add paddingTop so the feed content sits below
                // the absolute header. On iOS we use contentInset/contentOffset
                // so RefreshControl positions correctly.
                paddingTop: Platform.OS === "android" ? TOP_BAR_HEIGHT : 0,
                paddingBottom:
                  Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
                backgroundColor: "#F3F4F8",
              }}
              // On iOS, use contentInset/contentOffset so RefreshControl is
              // positioned relative to the scrollable area (appears under our
              // absolute header). contentContainerStyle.top doesn't affect
              // RefreshControl coordinates reliably on iOS.
              contentInset={
                Platform.OS === "ios" ? { top: TOP_BAR_HEIGHT } : undefined
              }
              contentOffset={
                Platform.OS === "ios" ? { x: 0, y: -TOP_BAR_HEIGHT } : undefined
              }
              // iOS-specific behaviour to keep the refresh spinner visible
              contentInsetAdjustmentBehavior={
                Platform.OS === "ios" ? "never" : undefined
              }
              bounces={true}
              alwaysBounceVertical={true}
              style={{ backgroundColor: "#F3F4F8" }}
              renderItem={({ item }) => (
                <PostCard
                  item={item}
                  isVisible={visibleItems.includes(item.id)}
                  onLongPress={handleLongPress}
                  isGestureActive={isGestureActiveState}
                  panGesture={panGesture}
                  onPressComments={openComments}
                />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#4D70D1"]}
                  tintColor={"#4D70D1"}
                  progressBackgroundColor={"#F3F4F8"}
                  // On iOS we offset the progress so the spinner appears below
                  // the header; on Android the value is used as a fallback.
                  progressViewOffset={
                    Platform.OS === "ios" ? TOP_BAR_HEIGHT + 8 : TOP_BAR_HEIGHT
                  }
                />
              }
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              removeClippedSubviews
              maxToRenderPerBatch={2}
              windowSize={3}
              initialNumToRender={2}
              onEndReachedThreshold={0.5}
            />

            {/* Bottom sheets / popups */}
            <PostOptionsBottomSheet
              show={postOptionsVisible}
              setShow={setPostOptionsVisible}
              setBlockUser={setBlockUser}
              setReportVisible={setReportVisible}
              setFocusedPost={setFocusedPost}
              toggleFollow={() => toggleFollow(focusedPost?.user_id || "")}
              isFollowing={followedUsers.includes(focusedPost?.user_id || "")}
              focusedPost={focusedPost}
              deleteAction={deletePost}
              user={user}
            />

            <CommentsSheet ref={commentsRef} snapPoints={["40%", "85%"]} />

            <ReportPostBottomSheet
              show={reportVisible}
              setShow={setReportVisible}
              postId={focusedPost?.id || ""}
              userId={user.id}
            />

            <BlockUserPopup
              show={blockUser}
              setShow={setBlockUser}
              post={focusedPost}
            />
          </View>
        </Reanimated.View>
        {/* Floating post button - stays visible above tab bar and moves with it */}
        <Reanimated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            zIndex: 20,
          }}>
          {/* Animated container to move the button up/down when tab bar hides/shows */}
          <FloatingPostButton
            insets={insets}
            onPressFab={() => router.push("/(compose)/post-create")}
          />
        </Reanimated.View>
      </Reanimated.View>
    </GestureDetector>
  );
}

// Floating post button component placed in this file so change stays limited to (tabs)/index.tsx
function FloatingPostButton({
  insets,
  onPressFab,
}: {
  insets: { bottom: number };
  onPressFab?: () => void;
}) {
  const { bottom } = insets;

  // derive a reanimated value directly from the global mutable shared values
  const shouldHide = useDerivedValue(() => {
    // hide when either the tab bar is hidden OR the camera underlay is active
    return !!tabBarHiddenSV.value || !!cameraActiveSV.value;
  });

  // Mirror the CustomTabBar constants so movement is identical
  const BUTTON_LIFT = Platform.OS === "ios" ? 15 : 35;
  const ANIM_DURATION = 180;

  const animatedStyle = useAnimatedStyle(() => {
    // when shouldHide -> translate down off-screen and fade out
    const translateY = shouldHide.value
      ? withTiming(BUTTON_LIFT + (bottom || 0) + 24, {
          duration: ANIM_DURATION,
        })
      : withTiming(-(BUTTON_LIFT + (bottom || 0)), { duration: ANIM_DURATION });
    const opacity = shouldHide.value
      ? withTiming(0, { duration: ANIM_DURATION })
      : withTiming(1, { duration: ANIM_DURATION });
    return {
      transform: [{ translateY }],
      opacity,
      // align on the right, keep center alignment for inner content
      alignItems: "flex-end",
    } as any;
  });

  return (
    <Reanimated.View style={animatedStyle}>
      <View
        className="items-end pr-4"
        style={{ paddingBottom: insets.bottom }}
        pointerEvents="box-none">
        <Pressable
          onPress={() => onPressFab?.()}
          className="w-14 h-14 rounded-full overflow-hidden items-center justify-center shadow-lg">
          <BlurView
            intensity={60}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            className="absolute inset-0"
          />

          {/* subtle glass tint + border like Figma */}
          <View className="absolute inset-0 rounded-full bg-white/20" />

          <FontAwesome6 name="plus" size={28} color="#000" />
        </Pressable>
      </View>
    </Reanimated.View>
  );
}
