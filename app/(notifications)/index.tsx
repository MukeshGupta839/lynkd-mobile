import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { AuthContext } from "@/context/AuthContext";
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

  // ✅ --- All internal logic functions are now removed ---
  // (fetchFollowRequests, fetchNotifications, fetchFollowings, etc.)

  const NotificationCard = ({
    item,
    index,
  }: {
    item: NotificationItem;
    index: number;
  }) => {
    const itemAnimation = new Animated.Value(0);
    // ✅ Check followedUsers list from the store
    const isFollowed = followedUsers.includes(item.userByFollowerId ?? "");

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
          onPress={() => handleNotificationClick(item)}
        >
          <View className="relative mr-3 h-12 w-12">
            <Image
              source={
                typeof item.avatar === "string"
                  ? { uri: item.avatar || "https://via.placeholder.com/40" }
                  : item.avatar
              }
              className="h-11 w-11 rounded-full bg-gray-200 border border-gray-300"
            />
            {["comment", "like", "Users", "UsersAccepted"].includes(
              item.type
            ) && (
              <View
                className={`absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full ${item.type === "like" ? "bg-red-600" : item.type === "Users" || item.type === "UsersAccepted" ? "bg-blue-600" : "bg-green-400"} border border-white`}
              >
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
          <View className="flex-1 justify-between">
            <View>
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
        {item.type === "Users" && item.request && user?.id && (
          <View className="flex-row px-4 pb-3 gap-2">
            <TouchableOpacity
              className="flex-1 bg-black py-2 rounded-lg items-center"
              // ✅ Call store action
              onPress={() => acceptFollowRequest(item.id, user.id)}
            >
              <Text className="text-white font-opensans-semibold text-sm">
                Accept
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-200 py-2 rounded-lg items-center"
              // ✅ Call store action
              onPress={() => rejectFollowRequest(item.id)}
            >
              <Text className="text-gray-800 font-opensans-semibold text-sm">
                Decline
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Follow back button */}
        {item.type === "UsersAccepted" && !item.request && (
          <View className="px-4 pb-3">
            {!isFollowed && (
              <TouchableOpacity
                className={`py-2 rounded-lg items-center ${
                  item.followPending ? "bg-gray-200" : "bg-black"
                }`}
                onPress={() => {
                  if (
                    !item.followPending &&
                    item.userByFollowerId &&
                    user?.id
                  ) {
                    // 1. Calls the API
                    followUser(user.id, item.userByFollowerId);

                    // 2. Immediately updates the UI to "Pending"
                    setFollowPending(item.id);
                  }
                }}
                disabled={item.followPending}
              >
                <Text
                  className={`font-opensans-semibold text-sm ${
                    item.followPending ? "text-gray-600" : "text-white"
                  }`}
                >
                  {item.followPending ? "Pending" : "Follow Back"}
                </Text>
              </TouchableOpacity>
            )}
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
              onPress={() => setFilter(type.key)} // ✅ Call store action
              className={`flex-row items-center rounded-full border px-3 py-2 gap-2 ${
                filter === type.key
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
                className={`text-sm ${
                  filter === type.key
                    ? "font-opensans-semibold text-white"
                    : "font-opensans-regular text-gray-800"
                }`}
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
                // ✅ Call store action
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
