// components/Product/CategoryPopularPhones.tsx
import type { DealItem } from "@/constants/Deal";
import { popularPhones } from "@/constants/Deal";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import { FlatList, Image, Text, View } from "react-native";
import RightArrow from "../../assets/svg/arrow-right.svg";

/* Small card used only on Categories */
const CategoryPhoneCard = React.memo(
  ({
    name,
    price,
    des,
    image,
    colors,
    imageBgClass = "bg-[#FFFFFF33]",
  }: DealItem) => {
    return (
      <View className="items-center relative min-h-28">
        <View
          className="w-full rounded-xl bg-white items-center"
          style={{
            height: 148,
            width: "100%",
            // Android shadow
            elevation: 4,
            // iOS shadow (only bottom, no top)
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 }, // push shadow down
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: "100%",
              height: 102, // 69% of 148
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <View
              className={`rounded-lg items-center justify-center ${imageBgClass}`}
              style={{
                width: "88%",
                height: "88%",
                overflow: "hidden",
              }}
            >
              <Image
                source={image}
                style={{
                  width: "90%",
                  height: "90%",
                }}
                resizeMode="contain"
              />
            </View>

            {/* rating pill placeholder */}
            <View
              className="bg-white/90 rounded-md px-1.5 py-[1px] flex-row items-center"
              style={{
                position: "absolute",
                bottom: 6,
                left: 6,
              }}
            >
              <View className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1" />
              <Text className="text-[10px] font-semibold">4.4</Text>
              <Text className="text-[10px] text-gray-500 ml-0.5">(1.1k)</Text>
            </View>
          </LinearGradient>

          {/* name */}
          <View
            className="w-[90%] items-center justify-center"
            style={{
              flex: 1,
              paddingTop: 4,
              paddingBottom: 12,
            }}
          >
            <Text
              className="text-xs font-medium text-black text-center"
              numberOfLines={1}
              style={{ lineHeight: 16 }}
            >
              {name}
            </Text>
          </View>
        </View>

        {/* bottom badge */}
        <View
          className="bg-[#26FF91] px-2.5 py-1 rounded-full shadow-md absolute -bottom-3 self-center z-10"
          style={{
            elevation: 10,
          }}
        >
          <Text className="text-black font-bold italic text-xs">
            {des} {price}
          </Text>
        </View>
      </View>
    );
  }
);

CategoryPhoneCard.displayName = "CategoryPhoneCard";

type Props = {
  title?: string;
  data?: DealItem[];
};

export default function CategoryPopularPhones({
  title = "Popular Phones",
  data,
}: Props) {
  // ✅ never map on undefined
  const items: DealItem[] = Array.isArray(data) ? data : popularPhones;

  const renderItem = useCallback(
    ({ item, index }: { item: DealItem; index: number }) => (
      <View
        className="w-32 shrink-0"
        style={{
          marginRight: index !== items.length - 1 ? 14 : 0,
          marginBottom: 20,
          marginLeft: index === 0 ? 12 : 0, // First item spacing
        }}
      >
        <CategoryPhoneCard {...item} />
      </View>
    ),
    [items.length]
  );

  const keyExtractor = useCallback(
    (item: DealItem, index: number) => item.id?.toString() ?? index.toString(),
    []
  );

  return (
    <View className="bg-white">
      {/* header */}
      <View className="flex-row items-center justify-between px-3 py-3">
        <Text className="text-lg font-bold text-black">{title}</Text>
        <View className="w-10 h-6 rounded-full bg-black items-center justify-center">
          <RightArrow width={22} height={22} />
        </View>
      </View>

      {/* carousel */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 16,
          paddingRight: 12,
        }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={5}
        windowSize={10}
      />
    </View>
  );
}
