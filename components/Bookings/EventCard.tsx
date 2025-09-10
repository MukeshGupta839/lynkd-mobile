// components/Bookings/EventCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  GestureResponderEvent,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  id?: string;
  title: string;
  price?: string;
  location?: string;
  dateLabel?: string;
  image?: any;
  variant?: "card" | "compact";
  onPress?: (e?: GestureResponderEvent) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id?: string) => void;
  // NEW:
  category?:
    | "music"
    | "club"
    | "sport"
    | "festival"
    | "movie"
    | "concert"
    | "all";
  isLive?: boolean;
};

export default function EventCard({
  id,
  title,
  price,
  location,
  dateLabel,
  image,
  variant = "card",
  onPress,
  isFavorite = false,
  onToggleFavorite,
  category,
  isLive = false,
}: Props) {
  const HeartButton = () => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={(e) => {
        e.stopPropagation?.();
        onToggleFavorite?.(id);
      }}
      className="items-center justify-center">
      <Ionicons
        name={isFavorite ? "heart" : "heart-outline"}
        size={22}
        color={isFavorite ? "#EF4444" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );

  // small helper: is live applicable only for these categories
  const liveCategories = ["club", "music", "sport"];
  const showLive = !!(isLive && category && liveCategories.includes(category));

  // Live pill component
  const LivePill = ({ small = false }: { small?: boolean }) => (
    <View
      className={`${small ? "px-2 py-0.5" : "px-3 py-1"} bg-red-600 rounded-full items-center justify-center z-20`}>
      <Text
        className={`${small ? "text-xxs" : "text-xs"} font-semibold text-white`}>
        LIVE
      </Text>
    </View>
  );

  // Only inline shadow (kept from original)
  const shadowOnly = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3, // Android
  };

  // ---------- Compact variant (Popular Events) ----------
  if (variant === "compact") {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className="mb-3 w-full">
        <View
          style={shadowOnly}
          className="flex-row items-center rounded-2xl p-3 pr-5 w-full bg-white relative">
          {/* Thumbnail (wrap relative for live badge) */}
          <View className="flex-[0.32] aspect-square rounded-lg overflow-hidden bg-gray-200 relative">
            {image ? (
              <Image
                source={image}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : null}

            {/* LIVE pill on thumbnail (small) */}
            {showLive ? (
              <View className="absolute top-2 left-2">
                <LivePill small />
              </View>
            ) : null}
          </View>

          {/* Text column */}
          <View className="flex-1 px-3">
            <Text
              numberOfLines={1}
              className="font-semibold text-lg text-[#13123A]">
              {title}
            </Text>

            {price ? (
              <Text className="text-purple-600 text-base">{price}</Text>
            ) : null}

            {location ? (
              <Text numberOfLines={1} className="text-gray-500 text-base">
                {location}
              </Text>
            ) : null}
          </View>

          {/* Heart icon on the right (only for compact/popular) */}
          <View className="ml-3">
            <HeartButton />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ---------- Card variant (Upcoming Events) ----------
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="mb-4">
      <View style={shadowOnly} className="rounded-2xl bg-white overflow-hidden">
        {/* Image with aspect ratio via Tailwind */}
        <View className="relative w-full bg-gray-200 aspect-[16/9]">
          {image && (
            <Image
              source={image}
              className="w-full h-full"
              resizeMode="cover"
            />
          )}

          {/* Date badge (keeps left) */}
          {dateLabel ? (
            <View className="absolute top-3 left-3 bg-white/80 rounded-md px-4 py-1">
              {(() => {
                const [month = "", day = ""] = (dateLabel || "").split(" ");
                return (
                  <View className="items-center">
                    <Text className="text-xs text-[#111827]">{month}</Text>
                    <Text className="text-lg font-bold text-[#111827]">
                      {day}
                    </Text>
                  </View>
                );
              })()}
            </View>
          ) : null}

          {/* LIVE pill top-right (so it doesn't clash with date badge) */}
          {showLive ? (
            <View className="absolute top-3 right-3">
              <LivePill />
            </View>
          ) : null}
        </View>

        <View className="p-3">
          <Text
            numberOfLines={2}
            className="font-semibold text-lg text-[#13123A]">
            {title}
          </Text>
          {price ? (
            <Text className="text-base text-[#7952FC]">{price}</Text>
          ) : null}
          {location ? (
            <Text className="text-base text-[#7A7A90]">{location}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
