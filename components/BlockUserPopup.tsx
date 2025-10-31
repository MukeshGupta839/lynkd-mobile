import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import React from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

type Post = {
  username?: string;
  userProfilePic?: string;
};

interface BlockUserPopupProps {
  show: boolean;
  setShow: (value: boolean) => void;
  post?: Post;
}

const BlockUserPopup: React.FC<BlockUserPopupProps> = ({
  show,
  setShow,
  post,
}) => {
  const userDetails = {
    username: post?.username || "Unknown User",
    profilePicture: post?.userProfilePic,
  };

  return (
    <Modal
      visible={show}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setShow(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        className="flex-1 bg-black/50 justify-end"
        onPress={() => setShow(false)}
      >
        <View className="bg-white rounded-t-2xl max-h-[80%]">
          {/* Handle Bar */}
          <TouchableOpacity
            className="self-center mt-2"
            onPress={() => setShow(false)}
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </TouchableOpacity>

          {/* Success Message */}
          <View className="items-center px-5 py-6">
            <MaterialDesignIcons
              name="account-cancel"
              size={50}
              color="#FF0000"
            />
            <Text className="text-lg font-bold mt-5 mb-2 text-black">
              User Blocked Successfully
            </Text>
            <Text className="text-sm text-gray-500 text-center leading-5 mb-4">
              You will no longer see posts from this user. They won&apos;t be
              able to interact with your profile or content.
            </Text>
          </View>

          {/* User Info */}
          <View className="flex-row items-center px-5 py-4 border-t border-gray-200">
            {userDetails.profilePicture ? (
              <Image
                source={{ uri: userDetails.profilePicture }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-300 justify-center items-center">
                <MaterialDesignIcons name="account" size={24} color="#888" />
              </View>
            )}
            <Text className="ml-3 font-semibold text-black">
              {userDetails.username}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default BlockUserPopup;
