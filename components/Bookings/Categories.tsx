// components/bookings/Categories.tsx
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CATEGORIES, CategoryT } from "@/constants/bookings";

type Props = {
  activeCategory: string;
  setActiveCategory: (key: string) => void;
};

export default function Categories({
  activeCategory,
  setActiveCategory,
}: Props) {
  const categories = useMemo(() => CATEGORIES, []);

  const renderCategory = ({ item }: ListRenderItemInfo<CategoryT>) => {
    const isActive = item.key === activeCategory;
    const iconColor = isActive ? "#FFFFFF" : "#111827";

    const Icon = () => {
      if (item.icon === "apps")
        return (
          <MaterialCommunityIcons name="apps" size={18} color={iconColor} />
        );
      if (item.icon === "musical-notes")
        return <Ionicons name="musical-notes" size={18} color={iconColor} />;
      if (item.icon === "star")
        return <FontAwesome5 name="star" size={16} color={iconColor} />;
      if (item.icon === "basketball")
        return (
          <MaterialCommunityIcons
            name="basketball"
            size={18}
            color={iconColor}
          />
        );
      return null;
    };

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setActiveCategory(item.key)}
        className="mx-1"
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}>
        {/* OUTER wrapper: same for both states to guarantee identical shape */}
        <View className="rounded-full overflow-hidden border border-gray-300">
          {isActive ? (
            // active: gradient fill inside same rounded, border-visible container
            <LinearGradient
              colors={["#7952FC", "#B15CDE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-3 py-2 flex-row items-center">
              <View className="mr-2">
                <Icon />
              </View>
              <Text className="text-white font-semibold text-base">
                {item.label}
              </Text>
            </LinearGradient>
          ) : (
            // inactive: white fill inside same rounded, bordered container
            <View className="px-3 py-2 flex-row items-center bg-white">
              <View className="mr-2">
                <Icon />
              </View>
              <Text className="text-gray-800 font-medium text-base">
                {item.label}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="bg-transparent">
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.key}
        renderItem={renderCategory}
        bounces={false}
        overScrollMode="never"
        removeClippedSubviews={false}
        extraData={activeCategory}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
    </View>
  );
}
