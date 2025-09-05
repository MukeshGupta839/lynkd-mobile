import { BadgeCheck, Star, StarHalf } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Review = {
  id: string;
  name: string;
  avatar: any;
  verified?: boolean;
  rating: number;
  text: string;
  photos?: any[];
};

type Props = {
  title?: string;
  average: number;
  basedOnText: string;
  reviews: Review[];
  showAll?: boolean;
  onViewMore?: () => void;
};

function StarsRow({ value, size = 18 }: { value: number; size?: number }) {
  const whole = Math.floor(value);
  const remainder = value - whole;
  const hasHalf = remainder >= 0.25 && remainder < 0.75;
  const empty = 5 - whole - (hasHalf ? 1 : 0);

  return (
    <View className="flex-row items-center">
      {[...Array(whole)].map((_, i) => (
        <Star key={`f-${i}`} size={size} color="#FACC15" fill="#FACC15" />
      ))}
      {hasHalf && <StarHalf size={size} color="#FACC15" fill="#FACC15" />}
      {[...Array(empty)].map((_, i) => (
        <Star key={`e-${i}`} size={size} color="#E5E7EB" />
      ))}
    </View>
  );
}

export default function ReviewsCard({
  title = "Ratings & Reviews",
  average,
  basedOnText,
  reviews,
  showAll = false,
  onViewMore,
}: Props) {
  const visible = showAll ? reviews : reviews.slice(0, 2);

  return (
    <View className="w-full bg-white rounded-2xl px-[5%] py-5 space-y-6">
      {/* Title */}
      <Text className="text-base font-semibold">{title}</Text>

      {/* Score + stars + based on */}
      <View className="space-y-2">
        <View className="flex-row items-center space-x-3">
          <Text className="text-3xl font-bold">{average.toFixed(1)}</Text>
          <StarsRow value={average} />
        </View>
        <Text className="text-xs text-gray-500">{basedOnText}</Text>
      </View>

      {/* Reviews */}
      <View className="space-y-6">
        {visible.map((r, idx) => (
          <View
            key={r.id}
            className={`pt-2 ${idx !== visible.length - 1 ? "pb-6 border-b border-black/5" : ""}`}
          >
            {/* avatar + name/badge + stars under it */}
            <View className="flex-row items-center mb-2">
              <View className="w-[12%] aspect-square rounded-full overflow-hidden mr-3 border border-black/10">
                <Image source={r.avatar} className="w-full h-full" resizeMode="cover" />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-sm font-semibold mr-1">{r.name}</Text>
                  {r.verified && <BadgeCheck size={14} color="#22c55e" />}
                </View>

                <View className="flex-row items-center">
                  <StarsRow value={r.rating} size={14} />
                  <Text className="ml-1 text-xs text-gray-500">{r.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>

            {/* body text */}
            <Text className="text-xs leading-5 text-gray-700 mb-3">{r.text}</Text>

            {/* photos */}
            {!!r.photos?.length && (
              <View className="flex-row justify-between gap-3 mt-1">
                {r.photos.slice(0, 3).map((img, i) => (
                  <View
                    key={`${r.id}-p-${i}`}
                    className="basis-[31%] aspect-square rounded-xl overflow-hidden"
                  >
                    <Image source={img} className="w-full h-full" resizeMode="cover" />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* button (hidden when showAll) */}
      {!showAll && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onViewMore}
          className="mt-4 w-full border border-black/10 rounded-xl items-center justify-center py-3"
        >
          <Text className="text-sm font-medium text-gray-800">View More Reviews</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
