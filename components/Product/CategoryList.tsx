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
// ⬇️ 1. IMPORT REANIMATED
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

type Orientation = "horizontal" | "vertical";

const CATS = [
  // ... (your CATS array, no changes)
  { name: "All", icon: LayoutGrid },
  { name: "Mobiles", icon: Smartphone },
  { name: "Electronics", icon: MonitorSmartphone },
  { name: "Appliances", icon: CookingPot },
  { name: "Beauty", icon: Brush },
  { name: "Home", icon: Lamp },
  { name: "Books", icon: BookOpen },
];

// ⬇️ 1. DEFINE HEIGHT CONSTANTS
const ORIGINAL_HEIGHT = 54; // This matches your 'h-16' class
const FINAL_HEIGHT = 28; // The final height for just text + underline

const Tile = React.memo(
  ({
    name,
    Icon,
    active,
    onPress,
    isVertical = false,
    isFirst = false,
    scrollOffset,
    scrollDistance,
  }: {
    name: string;
    Icon: any;
    active: boolean;
    onPress: () => void;
    isVertical?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    scrollOffset?: SharedValue<number>;
    scrollDistance?: number;
  }) => {
    const { activeColor, gradientActive, gradientInactive, underlineColor } =
      useCategoryTheme();

    const activeStroke = active ? (activeColor ?? "#26FF91") : "#7C8797";
    const underlineCol = active ? (underlineColor ?? "#26FF91") : "transparent";

    // This style fades the icon and backgrounds
    const animatedFadingStyle = useAnimatedStyle(() => {
      if (!scrollOffset || !scrollDistance) return {}; // Don't animate if not provided
      return {
        opacity: interpolate(
          scrollOffset.value,
          [0, scrollDistance / 2], // Fade out halfway through the scroll
          [1, 0],
          "clamp"
        ),
      };
    });

    // ⬇️ 2. CREATE NEW ANIMATED STYLE FOR HEIGHT
    const animatedHeightStyle = useAnimatedStyle(() => {
      if (!scrollOffset || !scrollDistance) {
        return { height: ORIGINAL_HEIGHT };
      }
      return {
        height: interpolate(
          scrollOffset.value,
          [0, scrollDistance], // Animate over the full scroll distance
          [ORIGINAL_HEIGHT, FINAL_HEIGHT], // From 64px down to 28px
          "clamp"
        ),
      };
    });

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
        className={tileMargin}
      >
        <View className="items-center">
          {/* ⬇️ 3. REMOVE 'h-16' AND APPLY THE ANIMATED STYLE */}
          <Animated.View
            className={`relative w-16 rounded-10 overflow-hidden`}
            style={animatedHeightStyle} // Apply height animation here
          >
            {/* FADING GRADIENTS */}
            <Animated.View
              style={[
                { position: "absolute", inset: 0 },
                animatedFadingStyle, // Apply fading style here
              ]}
            >
              <LinearGradient
                colors={active ? gradientActive : gradientInactive}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ position: "absolute", inset: 0 }}
              />
              {/* ... (all your other gradients) ... */}
            </Animated.View>
            {/* END of Animated Gradients Wrapper */}

            {/* ⬇️ 4. CHANGE 'justify-center' TO 'justify-end' */}
            <View className="flex-1 items-center justify-end px-1 pb-1.5">
              {/* FADING ICON */}
              <Animated.View style={animatedFadingStyle}>
                <Icon
                  size={22}
                  color={activeStroke}
                  strokeWidth={active ? 2.5 : 2}
                />
              </Animated.View>

              {/* THIS TEXT REMAINS VISIBLE */}
              <Text
                numberOfLines={1}
                className={`mt-1 font-worksans-400`}
                style={{
                  fontSize: 8,
                  color: active ? activeColor : "#6B7280",
                }}
              >
                {name}
              </Text>
            </View>

            {/* THIS UNDERLINE REMAINS VISIBLE */}
            <View
              pointerEvents="none"
              className={`absolute left-3 right-3 bottom-0 h-1.5 rounded-t-full`}
              style={{ backgroundColor: underlineCol }}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  }
);

Tile.displayName = "Tile";

// ... (The rest of your file, CategoryList, remains exactly the same)
export default function CategoryList({
  orientation = "horizontal",
  className = "",
  activeDefault = "All",
  scrollOffset,
  scrollDistance,
}: {
  orientation?: Orientation;
  className?: string;
  activeDefault?: string;
  scrollOffset?: SharedValue<number>;
  scrollDistance?: number;
}) {
  const [active, setActive] = useState(activeDefault);
  useEffect(() => setActive(activeDefault), [activeDefault]);

  const isVertical = orientation === "vertical";

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
        scrollOffset={scrollOffset} // <-- pass down
        scrollDistance={scrollDistance} // <-- pass down
      />
    ),
    [active, handlePress, isVertical, scrollOffset, scrollDistance]
  );

  const keyExtractor = useCallback((item: (typeof CATS)[0]) => item.name, []);

  return (
    <View className={className}>
      {isVertical ? (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          // ... (props)
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
            paddingTop: 8,
            paddingBottom: 8,
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={7}
          initialNumToRender={7}
        />
      )}
    </View>
  );
}
