import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

interface CompleteProfilePopupProps {
  user: {
    username?: string;
    profile_picture?: string;
    bio?: string;
    first_name?: string;
    last_name?: string;
  };
  onComplete?: () => void;
  onDismiss?: () => void;
}

const CompleteProfilePopup: React.FC<CompleteProfilePopupProps> = ({
  user,
  onComplete,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const handleNavigateToProfile = () => {
    // Navigate to edit profile screen
    // Adjust the route based on your app structure
    router.push("/(profiles)/editProfile" as any);
    if (onComplete) onComplete();
  };

  if (!visible) return null;

  return (
    <TouchableOpacity
      onPress={handleNavigateToProfile}
      className="flex-row bg-white rounded-lg p-2.5 self-center mt-2 relative"
      style={{
        width: Dimensions.get("window").width * 0.96,
      }}
    >
      {/* Profile Picture */}
      <View className="w-10 h-10 rounded-full bg-black justify-center items-center mr-3">
        {user?.profile_picture ? (
          <Image
            source={{ uri: user.profile_picture }}
            className="w-[95%] h-[95%] rounded-full"
          />
        ) : (
          <MaterialIcons name="person" size={24} color="#fff" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-xs text-gray-500" style={{ width: "90%" }}>
          You&apos;re almost there @{user?.username || "User"}! Complete your
          profile to personalize your experience and connect with people. It
          only takes a minute!
        </Text>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        className="absolute top-0 right-0 p-1"
        onPress={handleDismiss}
      >
        <MaterialIcons name="close" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default CompleteProfilePopup;
