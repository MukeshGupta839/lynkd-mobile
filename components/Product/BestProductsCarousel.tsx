// components/Product/BestProductsCarousel.tsx
import Constants from "expo-constants";
import { Star, Truck } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

/* ─────────────────────────────────────────
   Types and Normalization
────────────────────────────────────────── */

export type ProductItem = {
  id?: string | number;
  name: string;
  description?: string;
  price: number | string;
  oldPrice?: number | string;
  discount?: string;
  image?: ImageSourcePropType | string | null;
  rating?: number | string;
  reviews?: number | string;
};

// Typical API product shape we’ll normalize from
type ApiProduct = {
  id?: string | number;
  name?: string;
  title?: string;
  product_name?: string;
  description?: string;
  main_image?: string;
  image?: string;
  thumbnail?: string;
  sale_price?: number | string;
  price?: number | string; // some APIs use "price"
  regular_price?: number | string;
  mrp?: number | string;
  rating?: number | string;
  reviews?: number | string;
};

/* ─────────────────────────────────────────
   Helpers
────────────────────────────────────────── */

// Optional base for relative image paths: set expo.extra.IMAGE_BASE_URL
const IMAGE_BASE = (Constants.expoConfig?.extra as any)?.IMAGE_BASE_URL as
  | string
  | undefined;

const withBase = (path: string) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  if (IMAGE_BASE) {
    return `${IMAGE_BASE.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
  }
  // No base configured; return as-is (may fail if not absolute)
  return path;
};

const normalizeImage = (img?: ImageSourcePropType | string | null) => {
  if (!img) return undefined;
  if (typeof img === "string") {
    const uri = withBase(img);
    return { uri };
  }
  // assume local require(...)
  return img;
};

const toNumberINR = (v: any): number => {
  if (v == null) return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  // handle "₹2,49,999.50" → 249999.5
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const fmtINR = (n?: number | string) =>
  `₹${toNumberINR(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const computeDiscountPct = (price?: number | string, old?: number | string) => {
  const p = toNumberINR(price);
  const o = toNumberINR(old);
  if (!o || !p || o <= p) return undefined;
  return `${Math.round(((o - p) / o) * 100)}% off`;
};

// Accepts either a legacy ProductItem or raw ApiProduct
const normalize = (raw: any): ProductItem | null => {
  // Already close to ProductItem?
  if (
    raw &&
    typeof raw === "object" &&
    "name" in raw &&
    ("price" in raw || "image" in raw)
  ) {
    const priceN = toNumberINR((raw as ProductItem).price);
    const oldN = raw.oldPrice != null ? toNumberINR(raw.oldPrice) : undefined;
    const discount =
      (raw as ProductItem).discount ?? computeDiscountPct(priceN, oldN);
    const img = normalizeImage((raw as ProductItem).image as any);
    return {
      ...(raw as ProductItem),
      price: priceN,
      oldPrice: oldN,
      discount,
      image: img,
    };
  }

  // Treat as ApiProduct
  const p = raw as ApiProduct;
  const name = p.name ?? p.title ?? p.product_name ?? "Product";
  const image = normalizeImage(
    p.main_image ?? p.image ?? p.thumbnail ?? undefined
  );

  const price = toNumberINR(
    p.sale_price ?? p.price ?? p.regular_price ?? p.mrp ?? 0
  );
  const oldCandidate = toNumberINR(p.regular_price ?? p.mrp);
  const oldPrice = oldCandidate > price ? oldCandidate : undefined;

  return {
    id: p.id,
    name,
    description: p.description,
    image,
    price,
    oldPrice,
    rating: p.rating,
    reviews: p.reviews,
    discount: computeDiscountPct(price, oldPrice),
  };
};

/* ─────────────────────────────────────────
   Component
────────────────────────────────────────── */

export default function BestProductsCarousel({
  title = "",
  data,
}: {
  title?: string;
  /** Can be ProductItem[] or raw ApiProduct[] */
  data: Array<ProductItem | ApiProduct>;
}) {
  const { width: sw } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const CARD_W = sw * 0.3;
  const GAP = sw * 0.03;
  const SIDE = GAP;

  // Normalize once for rendering
  const items = useMemo(
    () => (data ?? []).map(normalize).filter(Boolean) as ProductItem[],
    [data]
  );

  const totalContentWidth = items.length * CARD_W + (items.length - 1) * GAP;
  const containerWidth = sw - 2 * SIDE;
  const maxScrollDistance = Math.max(0, totalContentWidth - containerWidth);

  const handleScroll = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      if (maxScrollDistance <= 0) {
        setScrollProgress(0);
        return;
      }
      const rawProgress = contentOffsetX / maxScrollDistance;
      const boundedProgress = Math.max(0, Math.min(rawProgress, 1));
      setScrollProgress(boundedProgress);
    },
    [maxScrollDistance]
  );

  return (
    <View className="w-full">
      <Text className="font-bold text-lg px-3 mb-2">{title}</Text>

      <View className="w-full aspect-[390.5/190]">
        <FlatList
          ref={flatListRef}
          horizontal
          data={items}
          keyExtractor={(it, i) => String(it.id ?? i)}
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          ListHeaderComponent={<View style={{ width: SIDE }} />}
          ListFooterComponent={<View style={{ width: SIDE }} />}
          renderItem={({ item }) => (
            <ProductCard item={item} cardWidth={CARD_W} />
          )}
        />
      </View>

      {maxScrollDistance > 0 && (
        <View className="w-full items-center mt-2">
          <View className="w-[29.2%] h-1.5 bg-black/10 rounded-full relative overflow-hidden">
            <View
              className="h-full bg-neutral-700 rounded-full absolute"
              style={{
                width: "15%",
                left: `${scrollProgress * 85}%`,
                transitionProperty: "left",
                transitionDuration: "200ms",
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function ProductCard({
  item,
  cardWidth,
}: {
  item: ProductItem;
  cardWidth: number;
}) {
  const {
    name,
    description,
    price,
    oldPrice,
    discount,
    image,
    rating,
    reviews,
  } = item;

  const priceStr = fmtINR(price);
  const oldStr =
    oldPrice != null && toNumberINR(oldPrice) > toNumberINR(price)
      ? fmtINR(oldPrice)
      : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{
        width: cardWidth,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      className="aspect-[127/189] bg-white rounded-xl p-2">
      <View className="flex-1">
        <View
          className="w-full aspect-[114/90] rounded-lg items-center justify-center mb-1.5 relative bg-gray-100"
          style={{ borderWidth: 1, borderColor: "#e5e7eb" }}>
          {image ? (
            <Image
              // image can be {uri} or a local require(...) already
              source={image as any}
              className="w-[85%] h-[85%]"
              resizeMode="contain"
            />
          ) : (
            <View className="w-[85%] h-[85%] items-center justify-center rounded-lg bg-gray-200">
              <Text className="text-gray-500 text-xs">No Image</Text>
            </View>
          )}

          {(rating || reviews) && (
            <View className="absolute bottom-1 left-1 flex-row items-center rounded bg-white/80 px-1.5 py-0.5">
              <Star size={12} color="#FFD700" fill="#FFD700" />
              {!!rating && (
                <Text
                  className="ml-1 text-xs font-semibold"
                  style={{ includeFontPadding: false }}>
                  {String(rating)}
                </Text>
              )}
              {/* {!!reviews && (
                <Text className="ml-0.5 text-gray-600 text-xxs" style={{ includeFontPadding: false }}>
                  ({String(reviews)})
                </Text>
              )} */}
            </View>
          )}
        </View>

        {/* Title / description */}
        <View className="h-10 justify-start">
          {description ? (
            <>
              <Text
                className="text-sm font-medium"
                numberOfLines={1}
                style={{ includeFontPadding: false }}>
                {name}
              </Text>
              <Text
                className="text-xs text-gray-400"
                numberOfLines={1}
                style={{ includeFontPadding: false }}>
                {description}
              </Text>
            </>
          ) : (
            <Text
              className="text-sm font-medium"
              numberOfLines={2}
              style={{ includeFontPadding: false }}>
              {name}
            </Text>
          )}
        </View>

        <View className="flex-1" />

        {/* Bottom area */}
        <View className="gap-1.5">
          <View className="flex-row items-end">
            <Text
              className="text-xs font-bold mr-1"
              style={{ includeFontPadding: false }}>
              {priceStr}
            </Text>
            {!!oldStr && (
              <Text
                className="text-gray-400 text-xxs line-through mr-1"
                style={{ includeFontPadding: false }}>
                {oldStr}
              </Text>
            )}
            {!!discount && (
              <Text
                className="text-green-500 text-xs font-bold"
                style={{ includeFontPadding: false }}>
                {discount}
              </Text>
            )}
          </View>

          <View className="flex-row items-center rounded-full self-start bg-[#26FF91]/70 px-2 py-0.5">
            <Truck size={14} color="#000" />
            <Text
              className="ml-1 text-black font-bold text-xxs"
              style={{ includeFontPadding: false }}>
              Super Fast
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
