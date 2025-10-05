import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FavItem = {
  id: number;
  type: "image" | "video";
  url: string;
  views: number;
};

const { width } = Dimensions.get("window");

// utility: 1.2k / 3.4M formatting
const kFormatter = (num: number) => {
  const n = Math.abs(num);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};

const FavoritesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Toggle for demo (empty state vs data)
  const [hasFavorites, setHasFavorites] = useState(false);

  // Dummy data
  const favorites: FavItem[] = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        type: i % 3 === 0 ? "video" : "image",
        url: `https://picsum.photos/800/800?random=${i + 10}`,
        views: Math.floor(Math.random() * 10_000),
      })),
    []
  );

  // tile size (3 columns, small gaps, padding=10)
  const tileSize = (width - 30) / 3;

  return (
    <View
      className="flex-1 bg-zinc-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      {/* Header */}
      <ScreenHeaderBack title="Favorites" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 60 }}>
        {hasFavorites ? (
          // Grid
          <View className="flex-row flex-wrap justify-between">
            {favorites.map((item) => (
              <Pressable
                key={item.id}
                className="mb-1.5 rounded-md overflow-hidden relative bg-zinc-200"
                style={{ width: tileSize, height: tileSize }}
                onPress={() => {}}
              >
                <Image
                  source={{ uri: item.url }}
                  style={{ width: "100%", height: "100%" }}
                />

                {item.type === "video" && (
                  <View className="absolute bottom-1.5 left-1.5 flex-row items-center">
                    <Feather name="play" size={16} color="#fff" />
                    <Text className="ml-1 text-xs text-white">
                      {kFormatter(item.views)}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          // Empty state
          <View className="items-center justify-center px-10 py-24">
            <Ionicons name="star-outline" size={60} color="#a3a3a3" />
            <Text className="text-xl text-zinc-900 mt-5 mb-2 font-medium">
              No Favorites Yet
            </Text>
            <Text className="text-base text-zinc-600 text-center leading-6">
              Save your favorite posts and videos here to easily find them
              later.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Demo toggle (optional) */}
      {/* <View className="absolute bottom-5 self-center">
        <Pressable
          onPress={() => setHasFavorites((v) => !v)}
          className="bg-zinc-900 px-5 py-3 rounded-full"
        >
          <Text className="text-white text-sm font-semibold">
            {hasFavorites ? "Show Empty State" : "Show Favorites"}
          </Text>
        </Pressable>
      </View> */}
    </View>
  );
};

export default FavoritesScreen;
