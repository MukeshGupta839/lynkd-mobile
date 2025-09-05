import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const BlockUserPopup = ({
  show,
  setShow,
  post,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  post: any;
}) => {
  const handleBlock = () => {
    console.log("Blocking user:", post?.username);
    // Add your block user logic here
    setShow(false);
  };

  return (
    <Modal
      visible={show}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShow(false)}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-xl p-5 w-[90%] max-w-96">
          <Text className="text-lg font-bold text-center mb-3">
            Block {post?.username}?
          </Text>
          <Text className="text-sm text-gray-600 text-center mb-5 leading-5">
            They won&apos;t be able to find your profile, posts or story on
            Lynkd. They won&apos;t be notified that you blocked them.
          </Text>

          <TouchableOpacity
            className="p-4 rounded-lg mb-3 border border-red-500 bg-red-500"
            onPress={handleBlock}
          >
            <Text className="text-base text-center font-medium text-white">
              Block
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 rounded-lg border border-gray-300"
            onPress={() => setShow(false)}
          >
            <Text className="text-base text-center font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default BlockUserPopup;
