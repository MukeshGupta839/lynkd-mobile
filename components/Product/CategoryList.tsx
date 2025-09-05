// components/CategoryList.tsx
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Brush,
  CookingPot,
  Dumbbell,
  Lamp,
  LayoutGrid,
  MonitorSmartphone,
  Smartphone,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type Orientation = "horizontal" | "vertical";

const categories = [
  { name: "All", icon: LayoutGrid },
  { name: "Mobiles", icon: Smartphone },
  { name: "Electronics", icon: MonitorSmartphone },
  { name: "Appliances", icon: CookingPot },
  { name: "Beauty", icon: Brush },
  { name: "Home", icon: Lamp },
  { name: "Book", icon: BookOpen },
  { name: "GYM", icon: Dumbbell },
];

// Reusable gradient shell so we don’t repeat <LinearGradient>
function GradientTile({
  colors,
  borderClass,
  children,
}: {
  colors: [string, string];
  borderClass: string;
  children: React.ReactNode;
}) {
  return (
    <View className="w-full h-full rounded-2xl overflow-hidden">
      <LinearGradient
        colors={colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className={`w-full h-full items-center justify-center rounded-2xl border ${borderClass}`}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

// ✅ Clean DuoIcon (no duplicate rendering)
function DuoIcon({ Icon, active }: { Icon: any; active: boolean }) {
  if (!active) {
    return <Icon size={24} color="#6B7280" strokeWidth={2} />;
  }
  return <Icon size={24} color="#16A34A" strokeWidth={2.5} />;
}

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

  const INACTIVE_COLORS: [string, string] = ["#F8F8F8", "#FFFFFF"];
  const ACTIVE_COLORS: [string, string] = ["#A7F3D0", "#FFFFFF"];

  const Tile = ({ name, Icon }: { name: string; Icon: any }) => {
    const isActive = active === name;

    const box = isVertical
      ? "w-full aspect-[26/25] mb-3 items-center justify-center"
      : "w-[12%] aspect-[26/29] mr-3 mt-4 items-center justify-center";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setActive(name)}
        className={box}
      >
        {isActive ? (
          <GradientTile colors={ACTIVE_COLORS} borderClass="border-green-200">
            <DuoIcon Icon={Icon} active />
            <Text
              className="mt-1 text-xxs  leading-snug text-center font-medium text-green-600"
              numberOfLines={1}
            >
              {name}
            </Text>
            {/* proportional underline */}
            <View className="absolute bottom-0 w-1/2 h-1 bg-green-500 rounded-t-xl" />
          </GradientTile>
        ) : (
          <GradientTile colors={INACTIVE_COLORS} borderClass="border-gray-200">
            <DuoIcon Icon={Icon} active={false} />
            <Text
              className="mt-1 text-xxs leading-snug text-center font-medium text-gray-500"
              numberOfLines={1}
            >
              {name}
            </Text>
          </GradientTile>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className={className}>
      {isVertical ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-col items-stretch">
            {categories.map((c) => (
              <Tile key={c.name} name={c.name} Icon={c.icon} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center">
            {categories.map((c) => (
              <Tile key={c.name} name={c.name} Icon={c.icon} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
