// components/FollowersFollowingSkeletons.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

/* =============== Shimmer =============== */
export const Shimmer: React.FC<{
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ height, borderRadius = 8, style }) => {
  const translateX = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: SCREEN_W,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return (
    <View
      style={[
        {
          overflow: "hidden",
          backgroundColor: "#ECEFF3",
          height,
          borderRadius,
        },
        style,
      ]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateX }] },
        ]}>
        <LinearGradient
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          colors={["transparent", "rgba(255,255,255,0.65)", "transparent"]}
          style={{ width: 120, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

/* =============== Skeleton Row =============== */
export const SkeletonRow: React.FC = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    }}>
    <Shimmer height={40} borderRadius={20} style={{ width: 40 }} />
    <View style={{ flex: 1, gap: 6 }}>
      <Shimmer height={14} borderRadius={6} style={{ width: "60%" }} />
      <Shimmer height={12} borderRadius={6} style={{ width: "40%" }} />
    </View>
    <Shimmer height={30} borderRadius={10} style={{ width: 108 }} />
  </View>
);

/* =============== Skeleton List =============== */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <View style={{ paddingVertical: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </View>
);
