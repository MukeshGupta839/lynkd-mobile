import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Text, View } from "react-native";

export type DealItem = {
  id?: string | number;
  name: string;
  subtitle?: string;
  price: string | number;
  oldPrice?: string | number;
  discount?: string;
  image: any;
  badgeText?: string;
  badgeColor?: string;
  textColor?: string;
};

function DealCard({
  name,
  subtitle,
  price,
  oldPrice,
  discount,
  image,
  badgeText,
  badgeColor = "bg-[#26FF91]",
  textColor = "text-black",
}: DealItem) {
  return (
    <View>
      <View className="w-full relative items-center justify-center">
        {badgeText && (
          <View
            className={`absolute top-0 left-0 flex-row items-center justify-center px-2 py-1 rounded-full z-10 ${badgeColor}`}
          >
            <Text className={`font-semibold text-xxs ${textColor}`}>
              {badgeText}
            </Text>
          </View>
        )}
        <Image
          source={image}
          className="w-[90%] aspect-[0.89]"
          resizeMode="contain"
        />
      </View>

      <Text className="text-sm font-semibold truncate w-full" numberOfLines={1}>
        {name}
      </Text>
      {!!subtitle && (
        <Text
          className="text-xs w-full text-gray-500 truncate"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}

      <View className="flex-row items-end">
        <Text className="text-sm font-bold mr-2 flex-shrink-0">₹{price}</Text>
        {oldPrice && (
          <Text className="text-gray-400 text-xs line-through mr-2 flex-shrink-0">
            ₹{oldPrice}
          </Text>
        )}
        {discount && (
          <Text className="text-green-600 text-sm font-bold flex-shrink-0">
            {discount}
          </Text>
        )}
      </View>
    </View>
  );
}

function GradientWrapper({
  children,
  colors = ["#D0FFD4", "#ADF5D1"],
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  className = "rounded-3xl overflow-hidden",
}: {
  children?: React.ReactNode;
  colors?: [string, string];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      className={`w-full ${className}`}
    >
      {children}
    </LinearGradient>
  );
}

export default function BestDealsGrid({
  title = "Best Deals for you",
  data,
  colors = ["#D0FFD4", "#ADF5D1"],
}: {
  title?: string;
  data: DealItem[];
  colors?: [string, string];
}) {
  return (
    <View className="w-full px-3">
      <Text className="font-bold text-lg mt-4 mb-2">{title}</Text>

      <View className="rounded-3xl overflow-hidden">
        <GradientWrapper
          colors={colors}
          className="rounded-3xl overflow-hidden"
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View className="p-5">
            {/* Create rows of 2 items each */}
            {Array.from({ length: Math.ceil(data.length / 2) }).map(
              (_, rowIndex) => {
                const isLastRow = rowIndex === Math.ceil(data.length / 2) - 1;
                return (
                  <View
                    key={rowIndex}
                    className={`flex-row justify-between ${!isLastRow ? "mb-4" : ""}`}
                  >
                    {data
                      .slice(rowIndex * 2, rowIndex * 2 + 2)
                      .map((item, colIndex) => (
                        <View
                          key={item.id || rowIndex * 2 + colIndex}
                          className="bg-white rounded-xl p-6 w-[48%] aspect-[0.92]"
                        >
                          <DealCard {...item} />
                        </View>
                      ))}
                    {/* Add empty spacer if odd number of items in last row */}
                    {data.slice(rowIndex * 2, rowIndex * 2 + 2).length ===
                      1 && <View className="w-[48%]" />}
                  </View>
                );
              }
            )}
          </View>
        </GradientWrapper>
      </View>
    </View>
  );
}
