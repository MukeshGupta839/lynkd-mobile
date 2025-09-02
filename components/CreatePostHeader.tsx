import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CratePostHeaderProps {
  onPressCreatePost: () => void;
}

const CreatePostHeader = ({ onPressCreatePost }: CratePostHeaderProps) => {
  return (
    <View className="bg-white">
      {/* Create Post Bar */}
      <View className="flex flex-row items-center px-3 py-2">
        <TouchableOpacity
          // style={styles.inputButton}
          className="flex-1 flex-row items-center justify-between border border-gray-300 rounded-xl py-3 px-4"
          onPress={onPressCreatePost}
        >
          <Text className="text-lg font-worksans-500 text-[#65676b]">
            Search...
          </Text>
          <Ionicons name="search-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* <View className="h-1.5 bg-[#ccc]" /> */}
    </View>
  );
};

export default CreatePostHeader;
