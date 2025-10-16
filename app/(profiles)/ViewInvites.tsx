import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReferredUser = {
  id: string | number;
  created_at: string;
  user: {
    id: string | number;
    username: string;
    profile_picture?: string | null;
  };
};

const Header: React.FC<{ title: string }> = ({ title }) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="bg-white border-b border-gray-200  py-1">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>

          <View className="absolute left-0 right-0 items-center">
            <Text className="text-lg font-semibold">{title}</Text>
          </View>

          {/* Invisible right spacer for balance */}
          <View className="p-2 opacity-0">
            <Ionicons name="arrow-back" size={26} color="#000" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Utility to format date/time ---
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `Joined: ${date} at ${time}`;
};

const ViewInvites: React.FC = () => {
  const navigation = useNavigation();

  // Dummy users for testing
  const referredUsers: ReferredUser[] = useMemo(
    () => [
      {
        id: 1,
        created_at: "2025-02-10T09:15:00Z",
        user: {
          id: 101,
          username: "john_doe",
          profile_picture: "https://randomuser.me/api/portraits/men/32.jpg",
        },
      },
      {
        id: 2,
        created_at: "2025-03-01T16:40:00Z",
        user: {
          id: 102,
          username: "longusername_user_2025",
          profile_picture: "https://randomuser.me/api/portraits/men/32.jpg",
        },
      },
      {
        id: 3,
        created_at: "2025-01-05T21:20:00Z",
        user: {
          id: 103,
          username: "emma.williams",
          profile_picture: "https://randomuser.me/api/portraits/women/68.jpg",
        },
      },
      {
        id: 4,
        created_at: "2025-02-20T10:05:00Z",
        user: {
          id: 104,
          username: "sara",
          profile_picture: "https://randomuser.me/api/portraits/women/12.jpg",
        },
      },
    ],
    []
  );

  const renderItem = ({ item }: { item: ReferredUser }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-xl px-3 py-3 mx-3 my-2 border border-gray-100"
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/(profiles)" as any,
          params: {
            user: String(item.user.id),
            username: item.user.username,
          },
        })
      }>
      <Image
        source={{
          uri:
            item.user.profile_picture ||
            "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg",
        }}
        className="w-10 h-10 rounded-full"
      />

      <View className="ml-2 flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-gray-900">
          {item.user.username}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {formatDateTime(item.created_at)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <Header title="View Invites" />

      <FlatList
        data={referredUsers}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          <View className="mt-8 px-6">
            <Text className="text-center text-gray-600">
              No referred users yet. Invite your friends to earn rewards!
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default ViewInvites;
