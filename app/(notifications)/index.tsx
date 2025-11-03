import { useContext, useEffect, useState } from "react";
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
} from "react-native";

import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { AuthContext } from "@/context/AuthContext";
import { fetchUserFollowings } from "@/lib/api/api";
import { apiCall } from "@/lib/api/apiService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const LynkdLogo = require("@/assets/icon.png");

type NotificationType =
  | "Overview"
  | "Users"
  | "Shop"
  | "Orders"
  | "UsersAccepted"
  | "comment"
  | "like";

interface NotificationItem {
  id: string;
  name: string;
  time: string;
  message: string;
  avatar: any;
  type: NotificationType;
  read: boolean;
  request?: boolean;
  followPending?: boolean;
  userByFollowerId?: string;
  postID?: string;
  onPress?: () => void;
}

const filterTypes = [
  { key: "Overview", label: "Overview", icon: "apps" },
  { key: "Users", label: "People", icon: "people" },
  { key: "Shop", label: "Shop", icon: "storefront" },
  { key: "Orders", label: "Orders", icon: "receipt" },
] as const;

const allNotifications: NotificationItem[] = [
  {
    id: "welcome",
    name: "Welcome to Lynkd App",
    time: "",
    message:
      "Welcome to Lynkd App. We are excited to have you on board. Start exploring now!",
    avatar: LynkdLogo,
    type: "Overview",
    read: false,
  },
];

const Notifications = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("Overview");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationItem[]
  >([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);

  // Time formatting helper
  const getTimeFromDateObject = (createdAt: Date) => {
    const hours = createdAt.getHours();
    const minutes = createdAt.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const hours12 = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours12}:${formattedMinutes} ${ampm}`;
  };

  // Fetch follow requests
  const fetchFollowRequests = async () => {
    try {
      if (!user?.id) return [];

      const response = await apiCall(
        `/api/follows/followRequests/${user.id}`,
        "GET"
      );
      const followRequests = response?.followerRequests || [];

      const followRequestNotifications = followRequests
        ?.map((request: any) => {
          const createdAt = new Date(request.created_at);
          const now = new Date();
          const localCreatedAt = new Date(
            createdAt.getTime() - createdAt.getTimezoneOffset() * 60000
          );
          const diffInMinutes = Math.floor(
            (now.getTime() - localCreatedAt.getTime()) / 60000
          );

          let time;
          if (diffInMinutes < 60) {
            time = getTimeFromDateObject(localCreatedAt);
          } else if (diffInMinutes < 1440) {
            time = getTimeFromDateObject(localCreatedAt);
          } else if (diffInMinutes < 43200) {
            const days = Math.floor(diffInMinutes / 1440);
            time = days === 1 ? "1 day ago" : `${days} days ago`;
          } else {
            const months = Math.floor(diffInMinutes / 43200);
            time = months === 1 ? "1 month ago" : `${months} months ago`;
          }

          const trimmedName = (
            (request.userByFollowerId?.first_name?.trim() || "") +
            " " +
            (request.userByFollowerId?.last_name?.trim() || "")
          ).trim();

          if (request.status === "pending") {
            return {
              id: request.id,
              name: request.userByFollowerId.username,
              userByFollowerId: request.userByFollowerId.id,
              time: time,
              message: `${trimmedName} has requested to follow you.`,
              avatar: request.userByFollowerId.profile_picture,
              type: "Users" as NotificationType,
              request: true,
              read: false,
              createdAt: localCreatedAt.toISOString(),
            };
          } else {
            return {
              id: request.id,
              name: request.userByFollowerId.username,
              userByFollowerId: request.userByFollowerId.id,
              time: time,
              message: `${trimmedName} has followed you.`,
              avatar: request.userByFollowerId.profile_picture,
              type: "UsersAccepted" as NotificationType,
              request: false,
              read: false,
              createdAt: localCreatedAt.toISOString(),
            };
          }
        })
        .filter((notif: any) => notif?.message?.length > 0);

      // Fetch followed requests (accepted requests)
      const response2 = await apiCall(
        `/api/follows/followedRequests/${user.id}`,
        "GET"
      );
      const followedRequests = response2?.followedRequests || [];

      const followedRequestNotifications = followedRequests
        .map((request: any) => {
          const createdAt = new Date(request.created_at);
          const now = new Date();
          const localCreatedAt = new Date(
            createdAt.getTime() - createdAt.getTimezoneOffset() * 60000
          );
          const diffInMinutes = Math.floor(
            (now.getTime() - localCreatedAt.getTime()) / 60000
          );

          let time;
          if (diffInMinutes < 60) {
            time = `${diffInMinutes} min ago`;
          } else if (diffInMinutes < 1440) {
            time = `${Math.floor(diffInMinutes / 60)} hours ago`;
          } else if (diffInMinutes < 43200) {
            time = `${Math.floor(diffInMinutes / 1440)} days ago`;
          } else {
            time = `${Math.floor(diffInMinutes / 43200)} months ago`;
          }

          const trimmedName = (
            (request.user?.first_name?.trim() || "") +
            " " +
            (request.user?.last_name?.trim() || "")
          ).trim();

          if (!request.user.is_creator) {
            return {
              id: request.id,
              name: request.user.username,
              time: time,
              message: `${trimmedName} has accepted your follow request.`,
              avatar: request.user?.profile_picture,
              type: "UsersAccepted" as NotificationType,
              request: false,
              read: false,
              createdAt: localCreatedAt.toISOString(),
              userByFollowerId: request.user.id,
            };
          }
          return null;
        })
        .filter(Boolean);

      return [
        ...followRequestNotifications,
        ...followedRequestNotifications,
      ].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      return [];
    }
  };

  // Fetch general notifications
  const fetchNotifications = async () => {
    try {
      if (!user?.id) return [];

      const response = await apiCall(
        `/api/notifications/user/${user.id}`,
        "GET"
      );
      const notifications = response?.data?.notifications || [];

      const notificationItems = notifications.map((notification: any) => {
        const createdAt = new Date(notification.created_at);
        const now = new Date();
        const localCreatedAt = new Date(
          createdAt.getTime() - createdAt.getTimezoneOffset() * 60000
        );
        const diffInMinutes = Math.floor(
          (now.getTime() - localCreatedAt.getTime()) / 60000
        );

        let time;
        if (diffInMinutes < 60) {
          time = `${diffInMinutes} min ago`;
        } else if (diffInMinutes < 1440) {
          time = `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else if (diffInMinutes < 43200) {
          time = `${Math.floor(diffInMinutes / 1440)} days ago`;
        } else {
          time = `${Math.floor(diffInMinutes / 43200)} months ago`;
        }

        return {
          id: notification.id,
          name: notification.title,
          time: time,
          message: notification.message,
          avatar: notification?.user?.profile_picture,
          type: notification.type as NotificationType,
          read: false,
          postID: notification.post_id,
          createdAt: localCreatedAt.toISOString(),
        };
      });

      return notificationItems.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  };

  // Fetch user followings
  const fetchFollowings = async () => {
    try {
      if (!user?.id) return;

      const response = await fetchUserFollowings(user.id);
      const followingIds =
        response?.data?.map((f: any) => f.following_id) || [];
      setFollowedUsers(followingIds);
    } catch (error) {
      console.error("Error fetching followings:", error);
    }
  };

  // Load all notifications
  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [followNotifs, generalNotifs] = await Promise.all([
        fetchFollowRequests(),
        fetchNotifications(),
      ]);

      await fetchFollowings();

      const allCombinedNotifications = [
        ...followNotifs,
        ...generalNotifs,
        ...allNotifications,
      ].sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setNotifications(allCombinedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Accept follow request
  const acceptFollowRequest = async (requestId: string) => {
    try {
      const response = await apiCall(
        `/api/follows/acceptRequest/${requestId}`,
        "POST"
      );
      if (response?.status === "success") {
        setNotifications((prev) => prev.filter((n) => n.id !== requestId));
        await fetchFollowings();
      }
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
  };

  // Reject follow request
  const rejectFollowRequest = async (requestId: string) => {
    try {
      const response = await apiCall(
        `/api/follows/rejectRequest/${requestId}`,
        "DELETE"
      );
      if (response?.status === "success") {
        setNotifications((prev) => prev.filter((n) => n.id !== requestId));
      }
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    }
  };

  // Follow user
  const followUser = async (userID: string) => {
    try {
      if (!user?.id) return;

      const response = await apiCall(
        `/api/follows/follow/${user.id}/${userID}`,
        "POST"
      );
      if (response.data) {
        await fetchFollowings();
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (id: string) => {
    const focusedNotification = notifications.find((n) => n.id === id);
    if (!focusedNotification) return;

    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    // Navigate based on type
    if (
      focusedNotification.type === "Users" ||
      focusedNotification.type === "UsersAccepted"
    ) {
      if (focusedNotification.userByFollowerId) {
        router.push({
          pathname: "/(profiles)/" as any,
          params: { user: focusedNotification.userByFollowerId },
        });
      }
    } else if (
      focusedNotification.type === "comment" ||
      focusedNotification.type === "like"
    ) {
      if (focusedNotification.postID) {
        router.push({
          pathname: "/(profiles)/profilePosts" as any,
          params: { showOnlyPost: focusedNotification.postID },
        });
      }
    }

    // Execute onPress if available
    focusedNotification.onPress?.();
  };

  useEffect(() => {
    if (filter === "Overview") {
      setFilteredNotifications(notifications);
      return;
    }

    if (filter === "Users") {
      setFilteredNotifications(
        notifications.filter(
          (n) => n.type === "Users" || n.type === "UsersAccepted"
        )
      );
      return;
    }

    setFilteredNotifications(notifications.filter((n) => n.type === filter));
  }, [filter, notifications]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleFilterChange = (newFilter: string) => setFilter(newFilter);

  const NotificationCard = ({
    item,
    index,
  }: {
    item: NotificationItem;
    index: number;
  }) => {
    const itemAnimation = new Animated.Value(0);
    const isFollowed = followedUsers.includes(item.userByFollowerId || "");

    useEffect(() => {
      Animated.timing(itemAnimation, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

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
        className="mx-3 my-1 rounded-xl bg-white shadow-sm"
      >
        <TouchableOpacity
          className={`flex-row p-4 rounded-xl ${item.read ? "bg-gray-50" : "bg-white"}`}
          activeOpacity={0.7}
          onPress={() => handleNotificationClick(item.id)}
        >
          <View className="relative mr-3 h-12 w-9">
            <Image
              source={
                typeof item.avatar === "string"
                  ? { uri: item.avatar || "https://via.placeholder.com/40" }
                  : item.avatar
              }
              className="h-9 w-9 rounded-full bg-gray-200"
            />
            {["comment", "like", "Users", "UsersAccepted"].includes(
              item.type
            ) && (
                <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-white">
                  <Ionicons
                    name={
                      item.type === "like"
                        ? "heart"
                        : item.type === "comment"
                          ? "chatbubble"
                          : "person"
                    }
                    size={14}
                    color={item.type === "like" ? "#ee0000" : "#000"}
                  />
                </View>
              )}
          </View>
          <View className="flex-1 justify-between">
            <View className="flex-1">
              <Text
                className="text-base font-opensans-semibold text-gray-900"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                className="mt-0.5 text-sm text-gray-600 font-opensans-regular"
                numberOfLines={2}
              >
                {item.message}
              </Text>
            </View>
            <Text className="text-xs text-gray-400 font-opensans-regular">
              {item.time}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action buttons for follow requests */}
        {item.type === "Users" && item.request && (
          <View className="flex-row px-4 pb-3 gap-2">
            <TouchableOpacity
              className="flex-1 bg-black py-2 rounded-lg items-center"
              onPress={() => acceptFollowRequest(item.id)}
            >
              <Text className="text-white font-opensans-semibold text-sm">
                Accept
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-200 py-2 rounded-lg items-center"
              onPress={() => rejectFollowRequest(item.id)}
            >
              <Text className="text-gray-800 font-opensans-semibold text-sm">
                Decline
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Follow back button */}
        {item.type === "UsersAccepted" &&
          !item.request &&
          item.userByFollowerId &&
          !isFollowed && (
            <View className="px-4 pb-3">
              <TouchableOpacity
                className={`py-2 rounded-lg items-center ${item.followPending ? "bg-gray-200" : "bg-black"
                  }`}
                onPress={() => {
                  if (!item.followPending && item.userByFollowerId) {
                    followUser(item.userByFollowerId);
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === item.id ? { ...n, followPending: true } : n
                      )
                    );
                  }
                }}
                disabled={item.followPending}
              >
                <Text
                  className={`font-opensans-semibold text-sm ${item.followPending ? "text-gray-600" : "text-white"
                    }`}
                >
                  {item.followPending ? "Pending" : "Follow Back"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </Animated.View>
    );
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
      {/* Header */}
      <View style={{ paddingTop: insets.top - 10 }}>
        <ScreenHeaderBack title="Notifications" />
      </View>

      {/* Filter Tabs */}
      <View className="bg-gray-100 py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3 gap-2 flex-grow min-w-full justify-between items-center"
        >
          {filterTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              onPress={() => handleFilterChange(type.key)}
              className={`flex-row items-center rounded-lg border px-3 py-2 gap-2 ${filter === type.key
                  ? "bg-black border-gray-300"
                  : "bg-white border-gray-200"
                }`}
            >
              <Ionicons
                name={type.icon}
                size={18}
                color={filter === type.key ? "#fff" : "#6B7280"}
              />
              <Text
                className={`text-sm ${filter === type.key ? "font-opensans-semibold text-white" : "font-opensans-regular text-gray-800"}`}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications list */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
            renderItem={({ item, index }) => (
              <NotificationCard item={item} index={index} />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 8,
              paddingBottom:
                Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadNotifications(true)}
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
