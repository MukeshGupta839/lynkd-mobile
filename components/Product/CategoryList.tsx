// components/CategoryList.tsx
import { useCategoryTheme } from "@/stores/useThemeStore"; // new store
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

/** fallback default categories (kept exactly as before) */
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
    // read theme values from store (keeps behavior but makes color configurable)
    const { activeColor, gradientActive, gradientInactive, underlineColor } =
      useCategoryTheme();

    // if store is not present for some reason, fallback to original hardcoded color
    const activeStroke = active ? (activeColor ?? "#26FF91") : "#7C8797";
    const underlineCol = active ? (underlineColor ?? "#26FF91") : "transparent";

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
              colors={active ? gradientActive : gradientInactive}
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
                  top: 0,
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
                  bottom: 0,
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
              <Icon
                size={22}
                color={activeStroke}
                strokeWidth={active ? 2.5 : 2}
              />
              <Text
                numberOfLines={1}
                className={`mt-1 font-worksans-400`}
                style={{
                  fontSize: 8,
                  color: active ? activeColor : "#6B7280",
                }}>
                {name}
              </Text>
            </View>

            {/* UNDERLINE (INSIDE the card) */}
            <View
              pointerEvents="none"
              className={`absolute left-3 right-3 bottom-0 h-1.5 rounded-t-full`}
              style={{ backgroundColor: underlineCol }}
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

  // read categories from store — fallback to your original CATS
  const storeCategories = useCategoryTheme((s) => s.categories);
  const categories =
    storeCategories && storeCategories.length ? storeCategories : CATS;

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
          data={categories}
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
          data={categories}
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
