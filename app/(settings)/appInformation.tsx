// AppInformation.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppInfo = {
  name: string;
  company: string;
  version: string;
  description: string;
};

const AppInformation: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [appInfo, setAppInfo] = useState<AppInfo>({
    name: "Lynkd | Social Commerce",
    company: "Synthora Innovations Private Limited",
    version: "",
    description:
      "Lynkd is an innovative all-in-one platform designed to help users create and share content, connect with friends, and shop their favorite brands—all in one seamless experience. Whether you're an aspiring content creator, a social media enthusiast, or a brand-conscious shopper, Lynkd brings together the best of social interaction, creative expression, and shopping convenience in a single app. With inclusion of AI, it brings back the best interactive experience possible.",
  });

  useEffect(() => {
    // Try common locations for package.json; keep it simple and safe.
    try {
      const pkgA = require("../../../package.json");
      if (pkgA?.version) {
        setAppInfo((prev) => ({ ...prev, version: String(pkgA.version) }));
        return;
      }
    } catch {}
    try {
      const pkgB = require("../../package.json");
      if (pkgB?.version) {
        setAppInfo((prev) => ({ ...prev, version: String(pkgB.version) }));
        return;
      }
    } catch {}
    // Fallback to empty / unknown
    setAppInfo((prev) => ({ ...prev, version: prev.version || "" }));
  }, []);

  return (
    <View
      className="flex-1 bg-white"
      style={{
        paddingTop: insets.top, // ✅ same safe-area handling as your reference
      }}>
      {/* Header — mirrors your pattern */}
      <View className="flex-row items-center  bg-white">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="chevron-left" size={30} color="#101112" />
        </Pressable>

        <Text className="flex-1 text-center text-2xl font-semibold">
          App Information
        </Text>

        {/* Spacer to balance the back button width */}
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View className="px-5 py-5">
        <Text className="text-xl font-bold">{appInfo.name}</Text>
        <Text className="mt-1 text-base">{appInfo.company}</Text>
        <Text className="mt-1 text-sm text-gray-600">
          Version {appInfo.version || "-"}
        </Text>

        <View className="mt-4">
          <Text className="text-sm leading-5 text-zinc-800">
            {appInfo.description}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default AppInformation;
