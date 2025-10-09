// src/components/Placeholder/FeedSkeletonPlaceholder.tsx
import React from "react";
import { Dimensions, Platform, View } from "react-native";

const screenHeight = Dimensions.get("window").height;

const FeedSkeletonPlaceholder: React.FC = () => {
  return (
    <View className="px-3 mt-3">
      <View
        className="bg-white rounded-2xl p-4 animate-pulse"
        style={Platform.select({
          android: { elevation: 2 },
          ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
        })}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-gray-300 rounded-full" />
          <View className="flex-1">
            <View className="w-32 h-4 bg-gray-300 rounded" />
            <View className="w-20 h-3 bg-gray-300 rounded mt-2" />
          </View>
        </View>

        {/* Image / Media Placeholder */}
        <View className="mt-4">
          <View
            className="w-full bg-gray-300 rounded-xl"
            style={{ height: screenHeight * 0.3 }}
          />
        </View>

        {/* Caption Placeholder */}
        <View className="mt-4 space-y-2 gap-1">
          <View className="h-4 bg-gray-300 rounded w-full" />
          <View className="h-4 bg-gray-300 rounded w-4/6" />
        </View>

        {/* Product / Affiliation Placeholder (optional) */}
        {/* <View className="mt-4 border border-gray-200 rounded-lg p-3">
          <View className="flex-row gap-3 items-center">
            <View className="w-12 h-12 bg-gray-300 rounded-lg" />
            <View className="flex-1 space-y-2">
              <View className="w-2/3 h-4 bg-gray-300 rounded" />
              <View className="w-1/3 h-3 bg-gray-300 rounded" />
            </View>
          </View>
          <View className="mt-3 h-3 bg-gray-300 rounded w-5/6" />
          <View className="mt-1 h-3 bg-gray-300 rounded w-3/4" />
        </View> */}

        {/* Action Bar */}
        <View className="mt-4 flex-row justify-between items-center">
          <View className="flex-row gap-6">
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 bg-gray-300 rounded-full" />
              <View className="w-10 h-3 bg-gray-300 rounded" />
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 bg-gray-300 rounded-full" />
              <View className="w-10 h-3 bg-gray-300 rounded" />
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 bg-gray-300 rounded-full" />
              <View className="w-10 h-3 bg-gray-300 rounded" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FeedSkeletonPlaceholder;
