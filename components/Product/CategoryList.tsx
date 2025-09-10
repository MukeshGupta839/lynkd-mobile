// components/CategoryList.tsx
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Brush,
  CookingPot,
  Lamp,
  LayoutGrid,
  MonitorSmartphone,
  Smartphone,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

type Orientation = "horizontal" | "vertical";

const CATS = [
  { name: "All", icon: LayoutGrid },
  { name: "Mobiles", icon: Smartphone },
  { name: "Electronics", icon: MonitorSmartphone },
  { name: "Appliances", icon: CookingPot },
  { name: "Beauty", icon: Brush },
  { name: "Home", icon: Lamp },
  { name: "Books", icon: BookOpen },
];

const Tile = React.memo(
  ({
    name,
    Icon,
    active,
    onPress,
    isVertical = false,
    isFirst = false,
  }: {
    name: string;
    Icon: any;
    active: boolean;
    onPress: () => void;
    isVertical?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
  }) => {
    const stroke = active ? "#26FF91" : "#7C8797";
    const tileMargin = [
      !isVertical && "mr-3",
      !isVertical && isFirst && "ml-3",
      isVertical && "mb-3",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className={tileMargin}>
        <View className="items-center">
          {/* OUTER HALO when active (behind the card) */}
          {/* CARD */}
          <View className={`relative w-16 h-16 rounded-10 overflow-hidden`}>
            {/* Base background – gradient for BOTH states */}
            <LinearGradient
              colors={
                active
                  ? ["#BEFBE0", "#FFFFFF"] // mint -> white
                  : ["#FFFFFF", "#F6F8FB"] // soft card gradient (inactive)
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />

            {/* glossy top strip (inactive) */}
            {!active && (
              <LinearGradient
                colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={{
                  position: "absolute",
                  top: 0, // <— no 1px inset
                  left: 0,
                  right: 0,
                  height: 18,
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                }}
              />
            )}

            {/* left glossy streak (inactive) */}
            {!active && (
              <LinearGradient
                colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: 18,
                }}
              />
            )}

            {/* right glossy streak (inactive) */}
            {!active && (
              <LinearGradient
                colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)"]}
                start={{ x: 1, y: 0.1 }}
                end={{ x: 0, y: 0.1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: 0.5,
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              />
            )}

            {/* bottom glossy strip (inactive) */}
            {!active && (
              <LinearGradient
                colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)"]}
                start={{ x: 0.5, y: 1 }} // from bottom
                end={{ x: 0.5, y: 0 }} // fade upward
                style={{
                  position: "absolute",
                  bottom: 0, // anchor to bottom instead of top
                  left: 0,
                  right: 0,
                  height: 1,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              />
            )}

            {/* CONTENT */}
            <View className="flex-1 items-center justify-center px-1 pb-1.5">
              <Icon size={22} color={stroke} strokeWidth={active ? 2.5 : 2} />
              <Text
                numberOfLines={1}
                className={`mt-1 font-worksans-400 ${
                  active ? "text-emerald-600" : "text-gray-500"
                }`}
                style={{ fontSize: 8 }}>
                {name}
              </Text>
            </View>

            {/* UNDERLINE (INSIDE the card) */}
            <View
              pointerEvents="none"
              className={`${active ? "bg-[#26FF91]" : "bg-transparent"} absolute left-3 right-3 bottom-0 h-1.5 rounded-t-full`}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

Tile.displayName = "Tile";

export default function CategoryList({
  orientation = "horizontal",
  className = "",
  activeDefault = "All",
}: {
  orientation?: Orientation;
  className?: string;
  activeDefault?: string;
}) {
  const [active, setActive] = useState(activeDefault);
  useEffect(() => setActive(activeDefault), [activeDefault]);

  const isVertical = orientation === "vertical";

  const handlePress = useCallback((name: string) => {
    setActive(name);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof CATS)[0]; index: number }) => (
      <Tile
        name={item.name}
        Icon={item.icon}
        active={active === item.name}
        onPress={() => handlePress(item.name)}
        isVertical={isVertical}
        isFirst={index === 0}
      />
    ),
    [active, handlePress, isVertical]
  );

  const keyExtractor = useCallback((item: (typeof CATS)[0]) => item.name, []);

  return (
    <View className={className}>
      {isVertical ? (
        <FlatList
          data={CATS}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: 4,
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
          }}
          style={{ paddingTop: 4 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={7}
          initialNumToRender={7}
        />
      ) : (
        <FlatList
          data={CATS}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          decelerationRate="fast"
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: 8,
          }}
          style={{ paddingTop: 4 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={7}
          initialNumToRender={7}
        />
      )}
    </View>
  );
}
