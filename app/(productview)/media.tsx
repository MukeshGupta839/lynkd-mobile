// app/product/media.tsx
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image as RNImage,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { FlatList as GHFlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MediaItem = string | { uri: string } | number;

type Size = { w: number; h: number };

export default function ProductMediaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { images = "[]", title } = useLocalSearchParams<{
    images?: string;
    title?: string;
  }>();

  const data: MediaItem[] = useMemo(() => {
    try {
      const parsed = JSON.parse(decodeURIComponent(String(images)));
      return Array.isArray(parsed) ? (parsed as MediaItem[]) : [];
    } catch {
      return [];
    }
  }, [images]);

  const listRef = useRef<GHFlatList<any>>(null);
  const [headerH, setHeaderH] = useState(0);

  // Premeasured sizes (so rows never change height)
  const [sizes, setSizes] = useState<Size[] | null>(null);
  const [errorIdx, setErrorIdx] = useState<number | null>(null);

  // helper: get (w,h) for each item
  const getSizeFor = (item: MediaItem): Promise<Size> =>
    new Promise((resolve) => {
      // string URL
      if (typeof item === "string") {
        RNImage.getSize(
          item,
          (w, h) => resolve({ w, h }),
          () => resolve({ w: 1, h: 1 }) // safe square fallback
        );
        return;
      }

      // { uri }
      if (
        item &&
        typeof item === "object" &&
        "uri" in item &&
        typeof item.uri === "string"
      ) {
        RNImage.getSize(
          item.uri,
          (w, h) => resolve({ w, h }),
          () => resolve({ w: 1, h: 1 })
        );
        return;
      }

      // local module (require)
      if (typeof item === "number") {
        const src = RNImage.resolveAssetSource(item);
        if (src?.width && src?.height) {
          resolve({ w: src.width, h: src.height });
        } else {
          resolve({ w: 1, h: 1 });
        }
        return;
      }

      resolve({ w: 1, h: 1 });
    });

  useEffect(() => {
    let cancelled = false;
    async function measureAll() {
      if (!data.length) {
        setSizes([]);
        return;
      }
      try {
        const results = await Promise.all(data.map(getSizeFor));
        if (!cancelled) setSizes(results);
      } catch {
        if (!cancelled) setSizes(data.map(() => ({ w: 1, h: 1 })));
      }
    }
    measureAll();
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (!data.length) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center pt-safe">
        <Text>No images</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 rounded-full bg-black">
          <Text className="text-white">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const GAP = 6;

  // show a short loader until we know all sizes to prevent any reflow/jump
  if (!sizes) {
    return (
      <View className="flex-1 bg-gray-200">
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <View
          className="absolute inset-x-0 top-0 z-20 pt-safe bg-white border-b border-gray-200 "
          onLayout={(e) => setHeaderH(Math.round(e.nativeEvent.layout.height))}>
          <View
            style={{
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
              {title ? String(title) : "Product gallery images"}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}>
              <Text style={{ fontSize: 28, lineHeight: 20, color: "#111827" }}>
                ×
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{ flex: 1, paddingTop: headerH }}
          className="items-center justify-center">
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-200">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Sticky/overlay header */}
      <View
        className="absolute inset-x-0 top-0 z-20 pt-safe bg-white border-b border-gray-200 "
        onLayout={(e) => setHeaderH(Math.round(e.nativeEvent.layout.height))}>
        <View
          style={{
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
            {title ? String(title) : "Product gallery images"}
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              position: "absolute",
              right: 12,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}>
            <Text style={{ fontSize: 28, lineHeight: 20, color: "#111827" }}>
              ×
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vertical gallery with stable row heights */}
      <GHFlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => `media-vert-${i}`}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: headerH + GAP,
          paddingBottom: (insets.bottom || 0) + GAP,
        }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        initialNumToRender={6}
        windowSize={7}
        maxToRenderPerBatch={10}
        removeClippedSubviews={false}
        renderItem={({ item, index }) => {
          const sz = sizes[index] ?? { w: 1, h: 1 };
          const ratio = sz.w > 0 && sz.h > 0 ? sz.w / sz.h : 1; // aspectRatio = width/height

          return (
            <View style={{ width: "100%" }}>
              <View
                style={{
                  width: "100%",
                  aspectRatio: ratio,
                  backgroundColor: "#F3F4F6",
                }}>
                <ExpoImage
                  source={item}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                  contentPosition="center"
                  transition={120}
                  cachePolicy="memory-disk"
                  onError={() => setErrorIdx(index)}
                />
              </View>

              {errorIdx === index && (
                <View className="absolute inset-0 items-center justify-center">
                  <Text className="text-gray-500">Failed to load</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
