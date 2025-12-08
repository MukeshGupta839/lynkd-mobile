import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type FlatListProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { AuthContext } from "@/context/AuthContext";
import Reanimated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ✅ Import the store and types
import {
  useNotificationStore,
  type NotificationItem,
} from "@/stores/useNotificationStore"; // Adjust path as needed

const filterTypes = [
  { key: "Overview", label: "Overview", icon: "apps" },
  { key: "Users", label: "People", icon: "people" },
  { key: "Shop", label: "Shop", icon: "storefront" },
  { key: "Orders", label: "Orders", icon: "receipt" },
] as const;

// --- Extra type just for the FlatList rows ---
type NotificationRow =
  | { type: "header"; id: string; title: string }
  | { type: "notification"; id: string; notification: NotificationItem };

// 🔹 Properly typed Animated FlatList
const AnimatedFlatList = Reanimated.createAnimatedComponent(
  FlatList<NotificationRow>
) as React.ComponentType<FlatListProps<NotificationRow>>;

// 🔹 Pure presentational card (memoized so only changed item re-renders)
type NotificationCardProps = {
  item: NotificationItem;
  index: number;
  onPress: (item: NotificationItem) => void;
  followedUsers: string[];
  acceptFollowRequest: (id: string, userId: string) => void;
  rejectFollowRequest: (id: string) => void;
  followUser: (myId: string, userToFollowId: string) => void;
  setFollowPending: (notificationId: string) => void;
  currentUserId?: string;
};

const NotificationCardBase = ({
  item,
  index,
  onPress,
  followedUsers,
  acceptFollowRequest,
  rejectFollowRequest,
  followUser,
  setFollowPending,
  currentUserId,
}: NotificationCardProps) => {
  const itemAnimation = useRef(new Animated.Value(0)).current;
  const isFollowed = followedUsers.includes(item.userByFollowerId ?? "");

  useEffect(() => {
    Animated.timing(itemAnimation, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [itemAnimation, index]);

  return (
    <Animated.View
      style={{
        opacity: itemAnimation,
        transform: [
          {
            translateY: itemAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
      className="bg-white">
      <TouchableOpacity
        className={`flex-row px-4 py-3 ${
          item.read ? "bg-gray-100" : "bg-white"
        }`}
        activeOpacity={0.7}
        onPress={() => onPress(item)}>
        {/* LEFT: Avatar */}
        <View className="relative mr-3 h-16 w-16">
          <Image
            source={
              typeof item.avatar === "string"
                ? { uri: item.avatar || "https://via.placeholder.com/40" }
                : item.avatar
            }
            className="h-16 w-16 rounded-full bg-gray-200 border border-gray-300"
          />
          {["comment", "like", "Users", "UsersAccepted"].includes(
            item.type
          ) && (
            <View
              className={`absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full ${
                item.type === "like"
                  ? "bg-red-600"
                  : item.type === "Users" || item.type === "UsersAccepted"
                    ? "bg-blue-600"
                    : "bg-green-400"
              } border border-white`}>
              <Ionicons
                name={
                  item.type === "like"
                    ? "heart"
                    : item.type === "comment"
                      ? "chatbubble"
                      : "person"
                }
                size={14}
                color={"#fff"}
              />
            </View>
          )}
        </View>

        {/* RIGHT: Text + time + buttons */}
        <View className="flex-1">
          <View>
            <Text
              className="text-base font-opensans-semibold text-gray-900"
              numberOfLines={1}>
              {item.name}
            </Text>
            <Text
              className="mt-0.5 text-sm text-gray-600 font-opensans-regular"
              numberOfLines={2}>
              {item.message}
            </Text>
          </View>

          <Text className="mt-1 text-xs text-gray-400 font-opensans-regular">
            {item.time}
          </Text>

          {/* Action buttons for follow requests - under text only */}
          {item.type === "Users" && item.request && currentUserId && (
            <View className="mt-2 flex-row gap-2">
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center bg-black"
                onPress={() => acceptFollowRequest(item.id, currentUserId)}>
                <Text className="text-white font-opensans text-sm">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center bg-black"
                onPress={() => rejectFollowRequest(item.id)}>
                <Text className="text-white font-opensans text-sm">
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Follow back button - also under text only */}
          {item.type === "UsersAccepted" && !item.request && (
            <View className="mt-2">
              {!isFollowed && (
                <TouchableOpacity
                  className={`py-2 rounded-lg items-center border ${
                    item.followPending ? "bg-gray-200" : "bg-black"
                  }`}
                  onPress={() => {
                    if (
                      !item.followPending &&
                      item.userByFollowerId &&
                      currentUserId
                    ) {
                      // 1. Calls the API
                      followUser(currentUserId, item.userByFollowerId);

                      // 2. Immediately updates the UI to "Pending"
                      setFollowPending(item.id);
                    }
                  }}
                  disabled={item.followPending}>
                  <Text
                    className={`font-opensans text-sm ${
                      item.followPending ? "text-gray-600" : "text-white"
                    }`}>
                    {item.followPending ? "Pending" : "Follow Back"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ✅ Memoized so only the card whose `item` object changes will re-render
const NotificationCard = React.memo(NotificationCardBase);

const Notifications = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const insets = useSafeAreaInsets();

  // ✅ Get all state and actions from the Zustand store
  const {
    isLoading,
    isRefreshing,
    filter,
    followedUsers,
    setFilter,
    loadNotifications,
    acceptFollowRequest,
    rejectFollowRequest,
    followUser,
    markAsRead,
    setFollowPending,
  } = useNotificationStore();

  const notifications = useNotificationStore((state) => state.notifications);

  // 🔹 HEIGHT CONSTANTS
  const NAV_BAR_CONTENT_HEIGHT = 56;
  const HEADER_HEIGHT = insets.top - 10 + NAV_BAR_CONTENT_HEIGHT; // full header area
  const TABS_HEIGHT = 48;
  const OVERLAY_HEIGHT = HEADER_HEIGHT + TABS_HEIGHT;

  // 🔹 Tabs animation (same pattern as (tabs)/index.tsx, but for tabs row)
  const tabsTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const accumulatedScroll = useSharedValue(0);

  const SCROLL_THRESHOLD = 20; // same as home feed
  const ANIMATION_DURATION = 200;

  const onNotificationScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      const currentY = Math.max(0, event.contentOffset.y);
      const diff = currentY - lastScrollY.value; // delta this frame

      const isTabsHidden = tabsTranslateY.value <= -TABS_HEIGHT + 0.5;
      const isTabsVisible = tabsTranslateY.value >= -0.5;

      // 1. Top of list – keep tabs visible, elastic effect
      if (currentY <= TABS_HEIGHT) {
        accumulatedScroll.value = 0;

        // If tabs were fully hidden, let them follow the content for elastic feel
        if (isTabsHidden) {
          tabsTranslateY.value = -currentY;
        }
      } else {
        // 2. Main scroll logic – exactly like home feed header

        if (diff > 0) {
          // scrolling DOWN (finger going up)
          if (accumulatedScroll.value < 0) {
            accumulatedScroll.value = 0;
          }

          accumulatedScroll.value += diff;

          if (accumulatedScroll.value > SCROLL_THRESHOLD) {
            // hide tabs
            if (isTabsVisible || tabsTranslateY.value > -TABS_HEIGHT) {
              tabsTranslateY.value = withTiming(-TABS_HEIGHT, {
                duration: ANIMATION_DURATION,
              });
            }
          }
        } else if (diff < 0) {
          // scrolling UP (finger going down)
          if (accumulatedScroll.value > 0) {
            accumulatedScroll.value = 0;
          }

          accumulatedScroll.value += diff;

          if (accumulatedScroll.value < -SCROLL_THRESHOLD) {
            // show tabs
            if (isTabsHidden || tabsTranslateY.value < 0) {
              tabsTranslateY.value = withTiming(0, {
                duration: ANIMATION_DURATION,
              });
            }
          }
        }
      }

      lastScrollY.value = currentY;
    },
  });

  const tabsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: tabsTranslateY.value }],
    };
  });

  const filteredNotifications = useMemo(() => {
    if (filter === "Overview") {
      return notifications;
    }
    if (filter === "Users") {
      return notifications.filter(
        (n) => n.type === "Users" || n.type === "UsersAccepted"
      );
    }
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]); // Dependencies: Only re-run if these change!

  // 👉 Build rows: [ "New", new items..., "Earlier", earlier items... ]
  const notificationRows: NotificationRow[] = useMemo(() => {
    const now = new Date();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    const newItems: NotificationItem[] = [];
    const earlierItems: NotificationItem[] = [];

    filteredNotifications.forEach((n) => {
      if (!n.createdAt) {
        earlierItems.push(n);
        return;
      }
      const created = new Date(n.createdAt);
      const diff = now.getTime() - created.getTime();
      if (diff < TWO_HOURS_MS) {
        newItems.push(n);
      } else {
        earlierItems.push(n);
      }
    });

    const rows: NotificationRow[] = [];

    if (newItems.length > 0) {
      rows.push({ type: "header", id: "header-new", title: "New" });
      newItems.forEach((n) =>
        rows.push({ type: "notification", id: n.id, notification: n })
      );
    }

    if (earlierItems.length > 0) {
      rows.push({ type: "header", id: "header-earlier", title: "Earlier" });
      earlierItems.forEach((n) =>
        rows.push({ type: "notification", id: n.id, notification: n })
      );
    }

    // If no notifications at all, rows will be [] and EmptyState will handle it
    return rows;
  }, [filteredNotifications]);

  console.log("filteredNotifications:", filteredNotifications);

  // Load notifications on mount
  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
    }
  }, [user?.id, loadNotifications]);

  // Handle notification click
  const handleNotificationClick = (item: NotificationItem) => {
    if (!item) return;

    // Mark as read in the store
    markAsRead(item.id);

    // Navigate based on type
    if (item.type === "Users" || item.type === "UsersAccepted") {
      if (item.userByFollowerId) {
        router.push({
          pathname: "/(profiles)/" as any,
          params: { user: item.userByFollowerId },
        });
      }
    } else if (item.type === "comment" || item.type === "like") {
      if (item.postID) {
        router.push({
          pathname: "/(profiles)/profilePosts" as any,
          params: { showOnlyPost: item.postID },
        });
      }
    }

    item.onPress?.();
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Feather name="bell" size={48} color="#D1D5DB" />
      <Text className="mt-4 mb-2 text-lg font-opensans-semibold text-gray-900">
        No notifications yet
      </Text>
      <Text className="text-center text-sm text-gray-500 font-opensans-regular">
        When you get notifications, they&apos;ll show up here
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* 🔹 Overlay area that contains BOTH: fixed header + animated tabs */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: OVERLAY_HEIGHT,
          zIndex: 20,
          pointerEvents: "box-none",
        }}>
        {/* Fixed header - DOES NOT MOVE, ALWAYS ABOVE TABS */}
        <View
          style={{
            paddingTop: insets.top - 10,
            backgroundColor: "#F3F4F6",
            height: HEADER_HEIGHT,
            justifyContent: "flex-end",
            zIndex: 2,
          }}>
          <ScreenHeaderBack title="Notifications" />
        </View>

        {/* Animated tabs - ONLY THIS MOVES, BEHIND HEADER */}
        <Reanimated.View
          style={[
            {
              height: TABS_HEIGHT,
              backgroundColor: "#F3F4F6",
              justifyContent: "center",
              zIndex: 1,
            },
            tabsAnimatedStyle,
          ]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 gap-2 flex-grow min-w-full justify-between items-center">
            {filterTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => setFilter(type.key)}
                // 🔹 removed border classes so no top/bottom stroke on pills
                className={`flex-row items-center rounded-full px-3 py-2 gap-2 ${
                  filter === type.key ? "bg-black" : "bg-white"
                }`}>
                <Ionicons
                  name={type.icon}
                  size={18}
                  color={filter === type.key ? "#fff" : "#6B7280"}
                />
                <Text
                  className={`text-sm ${
                    filter === type.key
                      ? "font-opensans-semibold text-white"
                      : "font-opensans-regular text-gray-800"
                  }`}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Reanimated.View>
      </View>

      {/* Notifications list */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : notificationRows.length > 0 ? (
          <AnimatedFlatList
            data={notificationRows}
            renderItem={({
              item,
              index,
            }: {
              item: NotificationRow;
              index: number;
            }) => {
              if (item.type === "header") {
                return (
                  <Text className="px-4 pb-1 text-xl font-opensans-semibold text-gray-900">
                    {item.title}
                  </Text>
                );
              }
              return (
                <NotificationCard
                  item={item.notification}
                  index={index}
                  onPress={handleNotificationClick}
                  followedUsers={followedUsers}
                  acceptFollowRequest={acceptFollowRequest}
                  rejectFollowRequest={rejectFollowRequest}
                  followUser={followUser}
                  setFollowPending={setFollowPending}
                  currentUserId={user?.id}
                />
              );
            }}
            keyExtractor={(item: NotificationRow) => item.id}
            showsVerticalScrollIndicator={false}
            onScroll={onNotificationScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingVertical: 8,

              paddingTop: Platform.OS === "android" ? OVERLAY_HEIGHT : 0,
              paddingBottom:
                Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
            }}
            contentInset={
              Platform.OS === "ios" ? { top: OVERLAY_HEIGHT } : undefined
            }
            contentOffset={
              Platform.OS === "ios" ? { x: 0, y: -OVERLAY_HEIGHT } : undefined
            }
            contentInsetAdjustmentBehavior={
              Platform.OS === "ios" ? "never" : undefined
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  if (user?.id) loadNotifications(user.id, true);
                }}
                colors={["#000"]}
                tintColor="#000"
              />
            }
          />
        ) : (
          <EmptyState />
        )}
      </View>
    </View>
  );
};

export default Notifications;
