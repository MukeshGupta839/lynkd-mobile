import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

/* ---------------- Shimmer core ---------------- */
const Shimmer = ({
  height,
  width,
  radius = 8,
  style = {} as any,
}: {
  height: number | string;
  width: number | string;
  radius?: number;
  style?: any;
}) => {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
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
          backgroundColor: "#E7EBF0",
          borderRadius: radius,
          height,
          width,
        },
        style,
      ]}>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "60%",
          transform: [
            {
              translateX: translateX.interpolate({
                inputRange: [-1, 1],
                outputRange: [-200, 200],
              }),
            },
          ],
        }}>
        <LinearGradient
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          colors={["transparent", "rgba(255,255,255,0.55)", "transparent"]}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const RowGap = ({ h = 12 }) => <View style={{ height: h }} />;

/* ---------------- Main Page Skeleton ---------------- */
const ProductSkeletonPlaceholder = () => {
  return (
    <View style={{ padding: 12 }}>
      {/* Image */}
      <Shimmer height={280} width={"100%"} radius={12} />
      <RowGap h={16} />

      {/* Title line */}
      <Shimmer height={18} width={"78%"} />
      <RowGap h={8} />

      {/* Price row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Shimmer height={20} width={120} />
        <Shimmer height={16} width={80} />
        <Shimmer height={18} width={64} />
      </View>
      <RowGap h={12} />
      <Shimmer height={10} width={120} />
      <RowGap h={14} />

      {/* Color section header */}
      <Shimmer height={16} width={140} />
      <RowGap h={10} />

      {/* Color cards */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Shimmer height={100} width={96} radius={12} />
        <Shimmer height={100} width={96} radius={12} />
        <Shimmer height={100} width={96} radius={12} />
      </View>
      <RowGap h={18} />

      {/* Size header */}
      <Shimmer height={16} width={100} />
      <RowGap h={10} />

      {/* Size chips */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Shimmer height={60} width={110} radius={10} />
        <Shimmer height={60} width={110} radius={10} />
        <Shimmer height={60} width={110} radius={10} />
      </View>
      <RowGap h={20} />

      {/* Highlights list */}
      {[1, 2, 3, 4].map((k) => (
        <View key={k} style={{ marginBottom: 8 }}>
          <Shimmer height={14} width={"92%"} />
        </View>
      ))}
      <RowGap h={12} />

      {/* Reviews title + box */}
      <Shimmer height={16} width={"55%"} />
      <RowGap h={10} />
      <Shimmer height={120} width={"100%"} radius={12} />
      <RowGap h={16} />

      {/* Bottom bar skeleton */}
      <BottomBarSkeleton />
    </View>
  );
};

/* ---------------- Bottom Bar Skeleton (exported) ---------------- */
export const BottomBarSkeleton = () => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(240,243,247,0.8)",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 16,
        paddingVertical: 14,
        height: 70,
      }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Shimmer height={22} width={130} radius={8} />
        <Shimmer height={12} width={100} radius={8} />
      </View>
      <Shimmer height={46} width={150} radius={28} />
    </View>
  );
};

export default ProductSkeletonPlaceholder;
