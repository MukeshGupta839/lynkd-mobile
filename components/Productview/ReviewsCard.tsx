import type { Review, ReviewsSummary } from "@/constants/review"; // adjust path if needed
import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title?: string;
  summary: ReviewsSummary;
  reviews: Review[];
  showAll?: boolean;
  onViewMore?: () => void;
  // optional behavior for services (no avatars / photos)
  showAvatar?: boolean;
  showPhotos?: boolean;
  // mimic px-[5%] default in inline style (number = percent)
  containerPaddingPercent?: number;
};

function StarsRow({ value, size = 18 }: { value: number; size?: number }) {
  const whole = Math.floor(value);
  const remainder = value - whole;
  const hasHalf = remainder >= 0.25 && remainder < 0.75;
  const empty = 5 - whole - (hasHalf ? 1 : 0);

  return (
    <View className="flex-row items-center">
      {/* full stars */}
      {[...Array(whole)].map((_, i) => (
        <FontAwesome5
          key={`f-${i}`}
          name="star"
          size={size}
          color="#FACC15" // Tailwind yellow-400
          style={{ marginRight: 2 }}
          solid
        />
      ))}

      {/* half star */}
      {hasHalf && (
        <FontAwesome5
          name="star-half-alt"
          size={size}
          color="#FACC15"
          style={{ marginRight: 2 }}
          solid
        />
      )}

      {/* empty stars (still solid, but light gray so they look inactive) */}
      {[...Array(empty)].map((_, i) => (
        <FontAwesome5
          key={`e-${i}`}
          name="star"
          size={size}
          color="#E5E7EB" // Tailwind gray-200
          style={{ marginRight: 2 }}
          solid
        />
      ))}
    </View>
  );
}
export default function ReviewsCard({
  title = "Ratings & Reviews",
  summary,
  reviews,
  showAll = false,
  onViewMore,
  showAvatar = true,
  showPhotos = true,
  containerPaddingPercent = 5,
}: Props) {
  const visible = showAll ? reviews : reviews.slice(0, 2);

  // inline padding to emulate px-[5%] style while keeping TS happy
  const paddingHorizontalStyle = {
    paddingHorizontal: `${containerPaddingPercent}%`,
  } as any;

  return (
    <View
      className="w-full bg-white rounded-2xl py-5 space-y-6 px-3"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
      }}>
      {/* Title */}
      <Text className="text-lg font-semibold ">{title}</Text>

      {/* Score + stars + basedOn */}
      <View className="space-y-2">
        <View className="flex-row items-center space-x-3 ">
          <Text className="text-3xl mr-2 ">{summary.average.toFixed(1)}</Text>
          <StarsRow value={summary.average} />
        </View>
        <Text className="text-xs text-gray-500">{summary.basedOnText}</Text>
      </View>

      {/* Reviews list */}
      <View className="space-y-6">
        {visible.map((r, idx) => (
          <View
            key={r.id}
            className={`pt-2 ${idx !== visible.length - 1 ? "pb-6 border-b border-black/5" : ""}`}>
            {/* avatar + name/badge + stars */}
            <View className="flex-row items-center mb-2">
              {showAvatar ? (
                <View className="w-[12%] aspect-square rounded-full overflow-hidden mr-3 border border-black/10">
                  {r.avatar ? (
                    <Image
                      source={r.avatar}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full bg-gray-100" />
                  )}
                </View>
              ) : null}

              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-base font-semibold mr-1">{r.name}</Text>
                  {r.verified && (
                    <FontAwesome5
                      name="check-circle"
                      size={14}
                      color="#22c55e"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>

                <View className="flex-row items-center">
                  <StarsRow value={r.rating} size={14} />
                  <Text className="ml-1 text-xs text-gray-500">
                    {r.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* body text */}
            <Text className="text-sm leading-5 text-gray-700 mb-3">
              {r.text}
            </Text>

            {/* photos (optional) */}
            {showPhotos && !!r.photos?.length && (
              <View className="flex-row justify-between gap-3 mt-1">
                {r.photos.slice(0, 3).map((img, i) => (
                  <View
                    key={`${r.id}-p-${i}`}
                    className="basis-[31%] aspect-square rounded-xl overflow-hidden">
                    <Image
                      source={img}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* View more button */}
      {!showAll && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onViewMore}
          className="mt-4 w-full border border-black/10 rounded-xl items-center justify-center py-3">
          <Text className="text-sm font-medium text-gray-800">
            View More Reviews
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
