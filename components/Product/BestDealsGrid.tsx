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
  const getBadgeStyle = () => {
    if (badgeText === "Best Flash Deal") {
      return { backgroundColor: "#26FF91" }; // Green
    } else if (badgeText === "Only 1 left") {
      return { backgroundColor: "#EF4444" }; // Red
    } else if (badgeText === "LYNKD Choice") {
      return { backgroundColor: "#26FF91" }; // Green
    }
    return { backgroundColor: "#26FF91" };
  };

  return (
    <View className="flex-1" style={{ height: "100%" }}>
      {/* Image Container - Fixed height */}
      <View
        className="w-full relative items-center justify-center"
        style={{ height: "65%" }}>
        {badgeText && (
          <View
            className="absolute top-1 left-0 items-center justify-center px-2 py-1 rounded-full z-10"
            style={{ ...getBadgeStyle(), minHeight: 20 }}>
            <Text className={`font-semibold text-xxs ${textColor}`}>
              {badgeText}
            </Text>
          </View>
        )}
        <Image
          source={image}
          className="w-[85%]"
          style={{
            aspectRatio: 1,
            maxHeight: "85%",
          }}
          resizeMode="contain"
        />
      </View>

      {/* Text Container - Fixed height */}
      <View
        className="w-full justify-center"
        style={{ height: "35%", paddingTop: 4 }}>
        <Text
          className="text-sm font-semibold w-full"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ fontSize: 13, lineHeight: 16, marginBottom: 2 }}>
          {name}
        </Text>
        {!!subtitle && (
          <Text
            className="text-gray-500"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontSize: 10,
              lineHeight: 12,
              maxWidth: "95%",
              marginBottom: 4,
            }}>
            {subtitle}
          </Text>
        )}

        <View className="flex-row items-center flex-wrap">
          <Text
            className="font-bold mr-2 flex-shrink-0"
            style={{ fontSize: 13, lineHeight: 16, color: "#000" }}>
            ₹{price}
          </Text>
          {oldPrice && (
            <Text
              className="text-gray-400 line-through mr-2 flex-shrink-0"
              style={{ fontSize: 11, lineHeight: 13 }}>
              ₹{oldPrice}
            </Text>
          )}
          {discount && (
            <Text
              className="text-green-600 font-bold flex-shrink-0"
              style={{ fontSize: 12, lineHeight: 14 }}>
              {discount}
            </Text>
          )}
        </View>
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
      className={`w-full ${className}`}>
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
          end={{ x: 0, y: 1 }}>
          <View className="p-5">
            {/* Create rows of 2 items each */}
            {Array.from({ length: Math.ceil(data.length / 2) }).map(
              (_, rowIndex) => {
                const isLastRow = rowIndex === Math.ceil(data.length / 2) - 1;
                return (
                  <View
                    key={rowIndex}
                    className={`flex-row justify-between ${!isLastRow ? "mb-4" : ""}`}>
                    {data
                      .slice(rowIndex * 2, rowIndex * 2 + 2)
                      .map((item, colIndex) => (
                        <View
                          key={item.id || rowIndex * 2 + colIndex}
                          className="bg-white rounded-xl w-[48%]"
                          style={{
                            aspectRatio: 0.92,
                            padding: 9,
                            minHeight: 200,
                          }}>
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
