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
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Orientation = "horizontal" | "vertical";

const CATS = [
  { name: "All", icon: LayoutGrid },
  { name: "Mobiles", icon: Smartphone },
  { name: "Electronics", icon: MonitorSmartphone },
  { name: "Appliances", icon: CookingPot },
  { name: "Beauty", icon: Brush },
  { name: "Home", icon: Lamp },
  { name: "Books", icon: BookOpen },
  { name: "Smart Gadgets", icon: BookOpen },
  { name: "Grocery", icon: BookOpen },
  { name: "Sport Hub", icon: BookOpen },
  { name: "Furniture", icon: BookOpen },
  { name: "Travel", icon: BookOpen },
];

const ORIGINAL_HEIGHT = 60;
const FINAL_HEIGHT = 28;
const ICON_CONTAINER_SIZE = 40;

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
    shrinkOnScroll = false,
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
    shrinkOnScroll?: boolean;
  }) => {
    const { activeColor, gradientActive, gradientInactive, underlineColor } =
      useCategoryTheme();

    const activeStroke = active ? (activeColor ?? "#2874F0") : "#7C8797";
    const underlineCol = active ? (underlineColor ?? "#2874F0") : "transparent";

    // progress just for icon pop-out
    const activeProgress = useSharedValue(active ? 1 : 0);

    useEffect(() => {
      activeProgress.value = withTiming(active ? 1 : 0, {
        duration: 180,
      });
    }, [active, activeProgress]);

    const animatedFadingStyle = useAnimatedStyle(() => {
      if (!scrollOffset || !scrollDistance) return {};
      return {
        opacity: interpolate(
          scrollOffset.value,
          [0, scrollDistance / 2],
          [1, 0],
          "clamp"
        ),
      };
    });

    // Only animate height for vertical list (avoid clipping on horizontal)
    const animatedHeightStyle = useAnimatedStyle(() => {
      if (!shrinkOnScroll || !scrollOffset || !scrollDistance) {
        return { height: ORIGINAL_HEIGHT };
      }
      return {
        height: interpolate(
          scrollOffset.value,
          [0, scrollDistance],
          [ORIGINAL_HEIGHT, FINAL_HEIGHT],
          "clamp"
        ),
      };
    });

    // 👇 This is applied ONLY to the Icon, not the gradient container
    const iconPopStyle = useAnimatedStyle(() => {
      const scale = interpolate(activeProgress.value, [0, 1], [1, 1.08]);
      const translateY = interpolate(activeProgress.value, [0, 1], [0, -3]);
      return {
        transform: [{ scale }, { translateY }],
      };
    });

    const tileMargin = [!isVertical && "mr-3", !isVertical && isFirst && "ml-3"]
      .filter(Boolean)
      .join(" ");

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className={`${tileMargin} ${isVertical ? "py-2" : ""} ${
          isVertical ? (active ? "bg-white" : "bg-gray-50") : ""
        }`}
      >
        <View className="items-center">
          <Animated.View
            className={`relative ${
              isVertical ? "w-24" : "w-16 rounded-t-10"
            } overflow-hidden`}
            style={animatedHeightStyle}
          >
            <View
              className={`flex-1 items-center px-1 ${
                isVertical ? "justify-center py-2" : "justify-end pb-2"
              }`}
            >
              {/* Gradient box stays static; icon inside pops */}
              <Animated.View style={animatedFadingStyle}>
                {!isVertical ? (
                  <LinearGradient
                    colors={active ? gradientActive : gradientInactive}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{
                      width: ICON_CONTAINER_SIZE,
                      height: ICON_CONTAINER_SIZE,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Animated.View style={iconPopStyle}>
                      <Icon
                        size={20}
                        color={activeStroke}
                        strokeWidth={active ? 2.4 : 2}
                      />
                    </Animated.View>
                  </LinearGradient>
                ) : (
                  <Animated.View style={iconPopStyle}>
                    <Icon
                      size={20}
                      color={activeStroke}
                      strokeWidth={active ? 2.4 : 2}
                    />
                  </Animated.View>
                )}
              </Animated.View>

              <Text
                numberOfLines={1}
                className={`${
                  active ? "font-opensans-semibold" : "font-opensans-regular"
                }`}
                style={{
                  fontSize: 9,
                  color: active ? "#111827" : "#6B7280",
                }}
              >
                {name}
              </Text>
            </View>

            {/* underline */}
            <View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  backgroundColor: underlineCol,
                },
                isVertical
                  ? {
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      borderTopRightRadius: 999,
                      borderBottomRightRadius: 999,
                    }
                  : {
                      left: 8,
                      right: 8,
                      bottom: 0,
                      height: 3,
                      borderTopLeftRadius: 999,
                      borderTopRightRadius: 999,
                    },
              ]}
            />
          </Animated.View>
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
        scrollOffset={scrollOffset}
        scrollDistance={scrollDistance}
        shrinkOnScroll={true}
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 70 }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: "#e5e7eb" }} />
          )}
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
          removeClippedSubviews
          maxToRenderPerBatch={7}
          initialNumToRender={7}
          contentContainerClassName="border-b border-gray-200"
        />
      )}
    </View>
  );
}
