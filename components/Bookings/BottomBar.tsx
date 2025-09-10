// components/Bookings/BottomBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  GestureResponderEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  liked?: boolean;
  onToggleLike?: () => void;
  ctaLabel: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  onCTAPress?: (e?: GestureResponderEvent) => void;
  variant?: "default" | "buttonOnly";
  /** new: accept either prop name for convenience */
  useFullSafeArea?: boolean;
  safeArea?: boolean;
};

export default function BottomNavBar({
  liked = false,
  onToggleLike,
  ctaLabel,
  ctaIcon,
  onCTAPress,
  variant = "default",
  useFullSafeArea = false,
  safeArea,
}: Props) {
  const insets = useSafeAreaInsets();

  // support both prop names; `safeArea` (if provided) overrides useFullSafeArea
  const wantsFullSafeArea =
    typeof safeArea === "boolean" ? safeArea : useFullSafeArea;

  // clamp bottom inset to a small, consistent value unless full safe area requested
  const bottomPadding = wantsFullSafeArea
    ? insets.bottom
    : Math.max(insets.bottom, 12);

  return (
    <View className="absolute left-0 right-0 bottom-4 px-4">
      {variant === "default" ? (
        // --- Default with heart + button ---
        <View className="flex-row items-center space-x-4">
          {/* Like button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onToggleLike}
            className="w-14 h-14 bg-[#F4EEFF] rounded-xl items-center justify-center shadow-sm mr-3"
            style={{ elevation: 2 }}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={22}
              color={liked ? "#E11D48" : "#7C3AED"}
            />
          </TouchableOpacity>

          {/* CTA button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onCTAPress}
            className="flex-1 h-14 rounded-xl overflow-hidden">
            <LinearGradient
              colors={["#7C3AED", "#B15CDE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-1 rounded-xl items-center justify-center flex-row">
              {ctaIcon ? (
                <Ionicons
                  name={ctaIcon}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
              ) : null}
              <Text className="text-white font-semibold">{ctaLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        // --- Button only ---
        <View className="w-full pb-3">
          {/* small inner padding so gradient isn't flush with bottom of container */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onCTAPress}
            className="w-full h-14 rounded-xl overflow-hidden">
            <LinearGradient
              colors={["#7C3AED", "#B15CDE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-1 rounded-xl items-center justify-center flex-row">
              {ctaIcon ? (
                <Ionicons
                  name={ctaIcon}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
              ) : null}
              <Text className="text-white font-semibold">{ctaLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
