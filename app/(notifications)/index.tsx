import { useEffect, useState } from "react";
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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const dummyNotifications: NotificationItem[] = [
  // 🛍️ Shop
  {
    id: "1",
    name: "Shop Update",
    time: "10 min ago",
    message:
      "New products have been added to the Electronics section. Check them out now!",
    avatar:
      "https://static.vecteezy.com/system/resources/previews/000/583/708/original/online-shop-icon-vector.jpg",
    type: "Shop",
    read: false,
  },
  {
    id: "2",
    name: "Price Drop Alert",
    time: "30 min ago",
    message: "Wireless Bluetooth Headphones are now 20% off!",
    avatar:
      "https://static.vecteezy.com/system/resources/previews/000/583/708/original/online-shop-icon-vector.jpg",
    type: "Shop",
    read: false,
  },

  // 📦 Orders
  {
    id: "3",
    name: "Order #1234",
    time: "1 hour ago",
    message: "Your order has been shipped! Track it in your email.",
    avatar:
      "https://icons.veryicon.com/png/o/miscellaneous/icondian/icon-order-1.png",
    type: "Orders",
    read: false,
  },
  {
    id: "4",
    name: "Order #5678",
    time: "5 hours ago",
    message: "Your order is out for delivery and will arrive today.",
    avatar:
      "https://icons.veryicon.com/png/o/miscellaneous/icondian/icon-order-1.png",
    type: "Orders",
    read: false,
  },

  // 👥 Users
  {
    id: "5",
    name: "John Doe",
    time: "3 min ago",
    message: "John Doe has requested to follow you.",
    avatar: "https://randomuser.me/api/portraits/men/7.jpg",
    type: "Users",
    request: true,
    read: false,
    userByFollowerId: "101",
  },
  {
    id: "6",
    name: "Jane Smith",
    time: "2 hours ago",
    message: "Jane Smith has accepted your follow request.",
    avatar: "https://randomuser.me/api/portraits/women/8.jpg",
    type: "UsersAccepted",
    request: false,
    read: false,
    userByFollowerId: "102",
  },

  // ❤️ Likes
  {
    id: "7",
    name: "Alex Johnson",
    time: "6 hours ago",
    message: "Alex liked your post.",
    avatar: "https://randomuser.me/api/portraits/men/9.jpg",
    type: "like",
    read: false,
    postID: "post_123",
  },
  // ❤️ Likes
  {
    id: "8",
    name: "Alex Johnson",
    time: "6 hours ago",
    message: "Alex liked your post.",
    avatar: "https://randomuser.me/api/portraits/men/9.jpg",
    type: "like",
    read: false,
    postID: "post_123",
  },
  // ❤️ Likes
  {
    id: "9",
    name: "Alex Johnson",
    time: "6 hours ago",
    message: "Alex liked your post.",
    avatar: "https://randomuser.me/api/portraits/men/9.jpg",
    type: "like",
    read: false,
    postID: "post_123",
  },

  // 💬 Comments
  {
    id: "10",
    name: "Sarah Brown",
    time: "1 day ago",
    message: "Sarah commented: 'This looks amazing!'",
    avatar: "https://randomuser.me/api/portraits/women/10.jpg",
    type: "comment",
    read: false,
    postID: "post_456",
  },
];

const Notifications = () => {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("Overview");
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(dummyNotifications);
  const [filteredNotifications, setFilteredNotifications] =
    useState<NotificationItem[]>(dummyNotifications);

  useEffect(() => {
    if (filter === "Overview") {
      setFilteredNotifications(notifications);
      return;
    }
    setFilteredNotifications(notifications.filter((n) => n.type === filter));
  }, [filter, notifications]);

  const handleFilterChange = (newFilter: string) => setFilter(newFilter);

  const NotificationCard = ({
    item,
    index,
  }: {
    item: NotificationItem;
    index: number;
  }) => {
    const itemAnimation = new Animated.Value(0);

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
        >
          <View className="relative mr-3 h-12 w-9">
            <Image
              source={
                typeof item.avatar === "string"
                  ? { uri: item.avatar }
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
              className={`flex-row items-center rounded-lg border px-3 py-2 gap-1 ${
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
                onRefresh={() => {
                  setIsRefreshing(true);

                  // simulate API call / refresh for 5 sec
                  setTimeout(() => {
                    setIsRefreshing(false);
                  }, 5000);
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
