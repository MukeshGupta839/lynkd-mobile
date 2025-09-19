// app/(tabs)/servicesCategories.tsx
import QuickActions from "@/components/Product/QuickActions";
import SearchBar from "@/components/Searchbar";
import { NEARBY_DATA, RECOMMENDED_DATA } from "@/constants/services";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function GradientWrapper({
  children,
  colors = ["#C5F8CE", "#ffffff"] as const,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  className = "rounded-b-3xl",
}: {
  children?: React.ReactNode;
  colors?: readonly [string, string];
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
/* ---------- CATEGORY_TILES ---------- */
const CATEGORY_TILES = [
  {
    id: "restaurant",
    title: "Restaurant",
    gradient: ["#EC6F1E", "#E2E2FF"] as const,
    image: require("@/assets/images/ServicesCRestaraut.png"),
    titleClass: "text-white",
  },
  {
    id: "club",
    title: "Club",
    gradient: ["#2E2E2B", "#FFFFFF"] as const,
    image: require("@/assets/images/ServicesClub.png"),
    titleClass: "text-white",
  },
  {
    id: "home",
    title: "Home",
    gradient: ["#B64D1E", "#FFFFFF"] as const,
    image: require("@/assets/images/ServicesHome.png"),
    titleClass: "text-white",
  },
  {
    id: "hotel",
    title: "Hotel",
    gradient: ["#B56E1E", "#FFFFFF"] as const,
    image: require("@/assets/images/ServicesHotel.png"),
    titleClass: "text-white",
  },
  {
    id: "saloon",
    title: "Saloon",
    gradient: ["#ED8D98", "#FFFFFF"] as const,
    image: require("@/assets/images/ServicesSaloon.png"),
    titleClass: "text-white",
  },
] as const;

/* ---------- HERO BANNER (simplified, with containerPadding) ---------- */
function HeroImageUnderSearch({
  containerPadding = 16,
}: {
  containerPadding?: number;
}) {
  const { width } = useWindowDimensions();

  // inner width = screen width minus padding
  const innerWidth = Math.max(0, width - containerPadding * 1);

  // height is 45% of width (tweak multiplier as needed)
  const height = Math.round(innerWidth * 0.45);

  const hero = require("@/assets/images/ServicesCategories.png");

  return (
    <View className="px-3 ">
      <Image
        source={hero}
        style={{ width: innerWidth, height }}
        resizeMode="cover"
      />
    </View>
  );
}

/* ---------- CATEGORY GRID (optimized: justify-between, no hard gaps) ---------- */
function CategoryGrid({
  tiles = CATEGORY_TILES,
  onPress,
}: {
  tiles?: typeof CATEGORY_TILES;
  onPress?: (t: any) => void;
}) {
  const topRow = tiles.slice(0, 2);
  const secondRow = tiles.slice(2, 5);

  return (
    <View className="mb-4">
      {/* Top row: 2 equal hero tiles (flex distributes space evenly) */}
      <View className="flex-row justify-between mb-3 items-start">
        {topRow.map((t) => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.95}
            onPress={() => onPress?.(t)}
            className="basis-[48%] rounded-xl overflow-hidden aspect-[1.8]">
            <LinearGradient
              colors={t.gradient}
              start={[0, 0]}
              end={[1, 1]}
              className="flex-1 flex-row items-stretch rounded-xl overflow-hidden">
              <View className="flex-1 p-4">
                <Text
                  className={`${t.titleClass} text-base font-extrabold`}
                  numberOfLines={1}>
                  {t.title}
                </Text>
              </View>

              <View className="flex-1 justify-end items-end p-2">
                <View className="aspect-square">
                  <Image
                    source={t.image}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Second row: 3 compact tiles (flex distributes space evenly) */}
      <View className="flex-row justify-between items-start">
        {secondRow.map((t) => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.92}
            onPress={() => onPress?.(t)}
            className="basis-[30%] rounded-lg overflow-hidden aspect-[1.1]">
            <LinearGradient
              colors={t.gradient}
              start={[0, 0]}
              end={[1, 1]}
              className="flex-1 p-2 rounded-lg overflow-hidden flex-col justify-between">
              <Text
                className={`${t.titleClass} text-base font-bold`}
                numberOfLines={1}>
                {t.title}
              </Text>

              {/* Controlled image size */}
              <View className="self-end w-4/5 aspect-square">
                <Image
                  source={t.image}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/* ---------- RECOMMENDED LIST ---------- */
function RecommendedList({ recommended }: { recommended: any[] }) {
  return (
    <View>
      {recommended.map((r) => (
        <View
          key={String(r.id)}
          className="bg-white rounded-2xl mb-4 overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 12 },
            elevation: 6,
          }}>
          <View className="w-full aspect-[2.5]">
            <Image
              source={
                r.image ?? require("@/assets/images/ServicesCategories.png")
              }
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          <View className="px-3 py-3">
            <Text className="text-lg font-semibold text-gray-900">
              {r.title}
            </Text>
            {r.subtitle && (
              <Text className="text-xs text-gray-500 mt-1">{r.subtitle}</Text>
            )}
            <View className="flex-row items-center mt-2">
              <Text className="text-sm text-yellow-400 mr-2">★</Text>
              <Text className="text-sm text-gray-700">
                {(r.rating ?? 4.4).toFixed(1)}
              </Text>
              <Text className="text-xs text-gray-500 ml-2">
                ({r.users ?? 120} Users)
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ---------- PAGE ---------- */
export default function ServicesCategories() {
  const tiles = useMemo(() => CATEGORY_TILES, []);
  const recommended = useMemo(
    () => (RECOMMENDED_DATA.length ? RECOMMENDED_DATA : (NEARBY_DATA ?? [])),
    []
  );

  return (
    <View className="flex-1 bg-gray-50">
      <GradientWrapper
        colors={["#E0DBFF", "#f9fafb"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-b-2xl overflow-hidden">
        <SafeAreaView edges={["top"]}>
          <View className="px-3 ">
            <QuickActions />
            <View className="mt-3">
              <SearchBar />
            </View>
          </View>
        </SafeAreaView>
      </GradientWrapper>

      <FlatList
        data={[{ key: "content" }]}
        renderItem={() => (
          <View className="px-3">
            <HeroImageUnderSearch />
            <CategoryGrid tiles={tiles} onPress={() => {}} />

            <View className="mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Recommended For you
              </Text>
            </View>

            <RecommendedList recommended={recommended} />
          </View>
        )}
        keyExtractor={(it) => String(it.key)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
}
