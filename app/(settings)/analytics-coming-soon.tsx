// app/(settings)/analytics-coming-soon.tsx
import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

const { width } = Dimensions.get("window");

const upcomingFeatures: Feature[] = [
  { icon: "trending-up", text: "Performance Metrics" },
  { icon: "people-outline", text: "Audience Demographics" },
  { icon: "bar-chart-outline", text: "Content Engagement Analytics" },
  { icon: "git-network-outline", text: "Reach & Impression Stats" },
];

const AnalyticsComingSoon: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="flex-1 bg-zinc-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      {/* Header */}
      <ScreenHeaderBack title="Analytics" onBack={() => router.back()} />

      {/* Content */}
      <View className="flex-1 items-center px-3 pt-10">
        {/* Illustration circle */}
        <View className="mb-8 bg-white w-40 h-40 rounded-full items-center justify-center shadow-sm">
          <MaterialCommunityIcons
            name="chart-line-variant"
            size={100}
            color="#8A8D91"
          />
        </View>

        <Text className="text-2xl font-bold text-zinc-900 mb-4">
          Analytics Coming Soon
        </Text>

        <Text className="text-base text-zinc-600 text-center leading-6 mb-8">
          We&apos;re building powerful analytics tools to help you understand
          your audience and grow your online presence.
        </Text>

        {/* Features */}
        <View className="w-full mb-10">
          {upcomingFeatures.map((feature, idx) => (
            <View
              key={`${feature.text}-${idx}`}
              className="flex-row items-center mb-4 bg-white p-4 rounded-xl"
            >
              <Ionicons name={feature.icon} size={22} color="#101112" />
              <Text className="ml-3 text-base font-medium text-zinc-900">
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Optional CTA (uncomment to use) */}
        {/* 
        <Pressable
          className="bg-zinc-900 rounded-full w-11/12 h-12 items-center justify-center mb-4"
          onPress={() => {}}
        >
          <Text className="text-white text-base font-semibold">
            Notify Me When Available
          </Text>
        </Pressable>

        <Text className="text-sm text-zinc-500 mt-2">
          Estimated arrival: Q4 2024
        </Text>
        */}
      </View>
    </View>
  );
};

export default AnalyticsComingSoon;
