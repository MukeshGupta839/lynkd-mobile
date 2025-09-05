import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Profile = () => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(profiles)",
      params: {
        user: "1", // Current user ID
        username: "current_user",
      },
    });
  };

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-lg mb-4">Profile Tab</Text>
      <TouchableOpacity
        className="bg-blue-500 px-4 py-2 rounded"
        onPress={handlePress}
      >
        <Text className="text-white">Go to Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;
