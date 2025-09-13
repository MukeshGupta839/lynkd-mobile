// app/components/Services/HeroHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Image,
  ImageSourcePropType,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  heroSource: ImageSourcePropType;
  imageWidth: number;
  imageHeight: number;
  title?: string;
  address?: string;
  rating?: number | null;
  openStatus?: string | null;
  onBack?: () => void;
  onRightPress?: () => void;
  rightIconName?: string;
  overlapCard?: boolean | undefined;
  cardHeight?: number;
  cardContent?: React.ReactNode;
};

export default function HeroHeader({
  heroSource,
  imageWidth,
  imageHeight,
  title = "Service",
  address = "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
  rating = 4.6,
  openStatus = "Now Open - Closes At 10:00PM",
  onBack,
  onRightPress,
  rightIconName = "cart",
  overlapCard = undefined,
  cardHeight = 120,
  cardContent = null,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // auto-detect overlap behavior if prop omitted
  const autoDetectOverlap = useMemo(() => {
    if (typeof overlapCard === "boolean") return overlapCard;
    try {
      const anyRouter = router as any;
      const path =
        typeof anyRouter.pathname === "string"
          ? anyRouter.pathname
          : typeof anyRouter.path === "string"
            ? anyRouter.path
            : typeof anyRouter.getState === "function"
              ? String(anyRouter.getState?.()?.routeNames ?? "")
              : "";
      const normalized = (path ?? "").toLowerCase();
      if (
        normalized.includes("servicedetail") ||
        (normalized.includes("service") && normalized.includes("detail"))
      )
        return true;
      return false;
    } catch {
      return false;
    }
  }, [router, overlapCard]);

  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    router.back();
  }, [onBack, router]);

  const handleRight = useCallback(() => {
    if (onRightPress) return onRightPress();
  }, [onRightPress]);

  return (
    // allow overflow so overlapping card isn't clipped
    <View
      className="bg-black"
      style={{
        overflow: "visible",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
      {/* Image wrapper keeps image rounded and clipped */}
      <View className="rounded-b-2xl overflow-hidden">
        <Image
          source={heroSource}
          resizeMode="cover"
          style={{ width: imageWidth, height: imageHeight }}
        />
      </View>

      {/* Top overlay: use SafeAreaView and explicit paddingTop from insets so content sits below notch */}
      <SafeAreaView
        pointerEvents="box-none"
        style={{ paddingTop: insets.top }}
        className="absolute left-0 right-0">
        <View className="px-4" style={{ paddingBottom: 6 }}>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-11 h-11 rounded-full items-center justify-center bg-black/30">
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <Text
              className="text-white font-bold text-sm px-3 py-1"
              numberOfLines={1}>
              {title}
            </Text>

            <TouchableOpacity
              onPress={handleRight}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Right action"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-11 h-11 rounded-full items-center justify-center bg-black/30">
              <Ionicons name={rightIconName as any} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Default inline bottom overlay inside image */}
      {!autoDetectOverlap && (
        <View className="absolute left-4 right-4 bottom-4">
          <View className="flex-row items-center justify-between bg-black/40 rounded-xl px-4 py-3">
            <View className="flex-1 pr-3">
              <Text
                className="text-white font-bold text-base"
                numberOfLines={1}>
                {title}
              </Text>
              <Text className="text-xs text-white mt-1" numberOfLines={2}>
                {address}
              </Text>
              {openStatus ? (
                <View className="mt-2">
                  <Text className="text-xs text-white font-semibold">
                    {openStatus}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="ml-3 px-3 py-2 rounded-full bg-[#1B19A8]">
              <Text className="text-white font-semibold">
                {rating ? rating.toFixed(1) + " ★" : "-"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Overlap card mode */}
      {autoDetectOverlap && cardContent && (
        <View
          className="absolute left-4 right-4"
          style={{
            bottom: -(cardHeight / 2),
            zIndex: 50,
            // inline shadow only
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          }}>
          <View className="rounded-2xl overflow-hidden">{cardContent}</View>
        </View>
      )}
    </View>
  );
}
