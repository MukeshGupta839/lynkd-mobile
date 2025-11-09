// app/ProductView.tsx
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import FeaturesCard from "@/components/Productview/FeaturesCard";
import OffersCard from "@/components/Productview/OffersCard";
import ProductHighlights, {
  type ProductHighlightsHandle,
} from "@/components/Productview/ProductHighlights";
import ReviewsCard from "@/components/Productview/ReviewsCard";
import VariantOptions from "@/components/Productview/VariantOptions";
import StoreIconButton from "@/components/StoreIconButton";

import {
  productByKind,
  type Product as ProductShape,
  type ProductVariant,
  type StorageOption,
} from "@/constants/Productview";

import { detailsByKind } from "@/constants/highlights";
import { reviewsByKind } from "@/constants/review";

import ProductSkeletonPlaceholder, {
  BottomBarSkeleton,
} from "@/components/Placeholder/ProductSkeletonPlaceholder";
import ShareSectionBottomSheet from "@/components/ShareSectionBottomSheet";
import { products } from "@/constants/Product";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Send } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Vibration,
  View,
} from "react-native";
import { FlatList as GHFlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ----------------- Borders (no gaps) ----------------- */
const CARD_BORDER_COLOR = "#D1D5DB"; // gray-300
const BORDER_WIDTH = 1; // border-2

const CardWrap = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <View
    style={[
      {
        backgroundColor: "#fff",
        borderBottomWidth: BORDER_WIDTH,
        borderColor: CARD_BORDER_COLOR,
      },
      style,
    ]}>
    {children}
  </View>
);

/* ----------------- Memoized children ----------------- */
const MemoOffersCard = React.memo(OffersCard);
const MemoReviewsCard = React.memo(ReviewsCard);
const MemoBestProductsCarousel = React.memo(BestProductsCarousel);

/* ----------------- Dots paginator ----------------- */
type PaginatorProps = {
  total: number;
  index: number;
  onPressDot?: (toIndex: number) => void;
  freeze?: boolean;
};

const PaginationDots = React.memo(function PaginationDots({
  total,
  index,
  onPressDot,
  freeze = false,
}: PaginatorProps) {
  const SIZE = 8,
    SMALL = 6,
    GAP = 8,
    MAX_VISIBLE = 5;
  const SLOT = SIZE + GAP;

  const computeStart = React.useCallback(
    (i: number) => {
      if (total <= MAX_VISIBLE) return 0;
      if (i <= 2) return 0;
      if (i >= total - 3) return total - MAX_VISIBLE;
      return i - 2;
    },
    [total]
  );

  const startForIndex = computeStart(index);
  const transX = useRef(new Animated.Value(-startForIndex * SLOT)).current;

  useEffect(() => {
    const toValue = -computeStart(index) * SLOT;
    if (freeze) {
      transX.stopAnimation?.();
      transX.setValue(toValue);
    } else {
      Animated.timing(transX, {
        toValue,
        duration: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [index, freeze, computeStart, SLOT, transX]);

  if (total <= 1) return <View style={{ height: SIZE, width: SIZE }} />;

  const visible = Math.min(MAX_VISIBLE, total);
  const start = computeStart(index);
  const inWindow = (i: number) => i >= start && i < start + visible;
  const leftEdgeSmall = (i: number) =>
    total > MAX_VISIBLE && i === start && start > 0;
  const rightEdgeSmall = (i: number) =>
    total > MAX_VISIBLE && i === start + visible - 1 && start + visible < total;

  return (
    <View
      style={{ width: visible * SLOT, overflow: "hidden", alignSelf: "center" }}
      renderToHardwareTextureAndroid
      needsOffscreenAlphaCompositing>
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          transform: [{ translateX: transX }],
          paddingHorizontal: GAP / 2,
        }}>
        {Array.from({ length: total }).map((_, i) => {
          const targetSize =
            leftEdgeSmall(i) || rightEdgeSmall(i) ? SMALL : SIZE;

          const dot = (
            <View
              key={`dot-${i}`}
              style={{
                width: targetSize,
                height: targetSize,
                borderRadius: targetSize / 2,
                backgroundColor: i === index ? "#000" : "#9CA3AF",
                opacity: i === index ? 1 : 0.7,
              }}
              accessibilityRole="imagebutton"
              accessibilityState={{ selected: i === index }}
            />
          );

          return (
            <View
              key={`slot-${i}`}
              style={{
                width: SLOT,
                alignItems: "center",
                justifyContent: "center",
                opacity: inWindow(i) ? 1 : 0,
              }}>
              {onPressDot ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onPressDot(i)}>
                  {dot}
                </TouchableOpacity>
              ) : (
                dot
              )}
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
});

/* ----------------- Helpers ----------------- */
const money = (n = 0) =>
  Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const getMatrix = <T,>(
  map: Record<string, Record<string, T>> | undefined,
  color: string,
  size: string
): T | undefined => map?.[color]?.[size];

const getPriceFor = (product: ProductShape, color: string, storage: string) => {
  const m = getMatrix(product.priceMatrix, color, storage);
  if (typeof m === "number") return m;
  const direct = product.storages?.find((s) => s.size === storage)?.price;
  return direct ?? 0;
};

const getMrpFor = (product: ProductShape, color: string, storage: string) => {
  const m = getMatrix(product.mrpMatrix, color, storage);
  return (typeof m === "number" ? m : product.mrp) ?? 0;
};

const getStockFor = (product: ProductShape, color: string, storage: string) => {
  const n = getMatrix(product.stockMatrix, color, storage);
  return typeof n === "number" ? n : 9999;
};

const isAvailable = (product: ProductShape, color: string, storage: string) =>
  getStockFor(product, color, storage) > 0;

const cheapestStorageForColor = (product: ProductShape, color: string) => {
  const list = (product.storages ?? [])
    .filter((s) => isAvailable(product, color, s.size))
    .map((s) => ({ ...s, price: getPriceFor(product, color, s.size) }))
    .sort((a, b) => a.price - b.price);
  return list[0];
};

type Kind = "phone" | "facewash" | "clothing";

export default function ProductView() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const chosenType: Kind =
    typeof type === "string" && ["phone", "facewash", "clothing"].includes(type)
      ? (type as Kind)
      : "phone";

  const DEFAULT_PRODUCT = productByKind.phone;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState<ProductShape | null>(null);

  const [bottomBarReady, setBottomBarReady] = useState(false);
  useEffect(() => {
    setBottomBarReady(!(loadingProduct || refreshing));
  }, [loadingProduct, refreshing]);

  const fetchProduct = async () => {
    try {
      if (!refreshing) setLoadingProduct(true);
      await new Promise((r) => setTimeout(r, 450));
      const next =
        productByKind[chosenType as keyof typeof productByKind] ??
        DEFAULT_PRODUCT;
      setProduct(next);
    } catch {
      setProduct(DEFAULT_PRODUCT);
    } finally {
      setLoadingProduct(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [chosenType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProduct();
  };

  const safeProduct = product ?? DEFAULT_PRODUCT;
  const hasVariants = (safeProduct.variants?.length ?? 0) > 0;
  const hasStorages = (safeProduct.storages?.length ?? 0) > 0;

  const [selectedColor, setSelectedColor] = useState<string>(
    hasVariants ? (safeProduct.variants![0]?.color ?? "") : ""
  );
  const [selectedStorage, setSelectedStorage] = useState<StorageOption>(
    hasStorages ? safeProduct.storages![0] : { size: "", price: 0 }
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!safeProduct) return;
    const firstColor = hasVariants
      ? (safeProduct.variants?.[0]?.color ?? "")
      : "";
    const firstSize = hasStorages
      ? (safeProduct.storages?.[0] ?? { size: "", price: 0 })
      : { size: "", price: 0 };
    setSelectedColor(firstColor);
    setSelectedStorage(firstSize);
    setActiveIndex(0);
  }, [safeProduct?.name, hasVariants, hasStorages, chosenType]);

  const [qty, setQty] = useState(0);
  const [added, setAdded] = useState(false);
  const onAdd = () => {
    setQty((v) => (v > 0 ? v : 1));
    setAdded(true);
  };
  const dec = () =>
    setQty((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0) setAdded(false);
      return next;
    });
  const inc = () => setQty((v) => v + 1);

  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const toggleLike = () => {
    Vibration.vibrate(100);
    setLiked((prev) => !prev);
  };

  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DOUBLE_DELAY = 260;

  const routerOpenMediaViewer = (startIndex: number) => {
    router.push({
      pathname: "/Product/media",
      params: {
        images: encodeURIComponent(JSON.stringify(galleryBase)),
        index: String(startIndex),
        title: safeProduct.name ?? "",
      },
    });
  };

  const onImageTap = (index: number) => {
    const now = Date.now();
    const delta = now - (lastTapRef.current || 0);
    lastTapRef.current = now;

    if (delta < DOUBLE_DELAY) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      toggleLike();
      return;
    }

    tapTimeoutRef.current = setTimeout(() => {
      tapTimeoutRef.current = null;
      const real = loopToRealIndex(index);
      routerOpenMediaViewer(real);
    }, DOUBLE_DELAY + 20);
  };

  useEffect(() => {
    if (!hasVariants || !hasStorages) return;
    const currentOk =
      selectedStorage?.size &&
      isAvailable(safeProduct, selectedColor, selectedStorage.size);
    if (!currentOk) {
      const cheapest = cheapestStorageForColor(safeProduct, selectedColor);
      if (cheapest && cheapest.size !== selectedStorage?.size) {
        setSelectedStorage(cheapest);
      }
    }
  }, [
    safeProduct,
    selectedColor,
    selectedStorage?.size,
    hasVariants,
    hasStorages,
  ]);

  const offerPrice = useMemo(() => {
    if (hasStorages)
      return getPriceFor(safeProduct, selectedColor, selectedStorage.size);
    return (safeProduct as any).price ?? safeProduct.mrp ?? 0;
  }, [hasStorages, safeProduct, selectedColor, selectedStorage.size]);

  const mrp = useMemo(() => {
    if (hasStorages)
      return getMrpFor(safeProduct, selectedColor, selectedStorage.size);
    return safeProduct.mrp ?? (safeProduct as any).mrp ?? offerPrice;
  }, [
    hasStorages,
    safeProduct,
    selectedColor,
    selectedStorage.size,
    offerPrice,
  ]);

  const save = Math.max(mrp - offerPrice, 0);
  const offPct = mrp ? Math.round((save / mrp) * 100) : 0;

  const stock = useMemo(() => {
    if (hasStorages)
      return getStockFor(safeProduct, selectedColor, selectedStorage.size);
    return (safeProduct as any).stock ?? 999;
  }, [hasStorages, safeProduct, selectedColor, selectedStorage.size]);

  /* ----------------- Gallery / Carousel ----------------- */
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width: sw } = useWindowDimensions();
  const mediaRef = useRef<any>(null);

  const resolveGallery = React.useCallback(() => {
    if (hasVariants) {
      const variant = safeProduct.variants?.find(
        (v: ProductVariant) => v.color === selectedColor
      );
      const variantImages = variant?.images;
      if (Array.isArray(variantImages) && variantImages.length)
        return [...variantImages];
    }
    return [safeProduct.mainImage, ...(safeProduct.thumbnails ?? [])].filter(
      Boolean
    );
  }, [safeProduct, selectedColor, hasVariants]);

  const galleryBase = useMemo(resolveGallery, [resolveGallery]);

  const canLoop = galleryBase.length > 1;
  const loopData = useMemo(
    () =>
      canLoop
        ? [galleryBase[galleryBase.length - 1], ...galleryBase, galleryBase[0]]
        : galleryBase,
    [galleryBase, canLoop]
  );

  const realLen = galleryBase.length;

  const loopToRealIndex = (idx: number) => {
    if (!canLoop) return idx;
    if (idx === 0) return realLen - 1;
    if (idx === realLen + 1) return 0;
    return idx - 1;
  };

  const realToLoopIndex = (real: number) => {
    if (!canLoop) return real;
    return real + 1;
  };

  const [loopIndex, setLoopIndex] = useState<number>(canLoop ? 1 : 0);
  const [teleportFreeze, setTeleportFreeze] = useState(false);

  const getItemLayout = React.useCallback(
    (_: any, i: number) => ({ length: sw, offset: sw * i, index: i }),
    [sw]
  );

  useEffect(() => {
    const start = canLoop ? 1 : 0;
    setLoopIndex(start);
    requestAnimationFrame(() => {
      mediaRef.current?.scrollToIndex({ index: start, animated: false });
      scrollX.stopAnimation?.();
      scrollX.setValue(start * sw);
    });
    setActiveIndex(0);
  }, [canLoop, galleryBase, scrollX, sw]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / sw);
    if (!canLoop) {
      setActiveIndex(next);
      return;
    }
    const real = loopToRealIndex(next);
    if (real !== activeIndex) setActiveIndex(real);

    if (next === 0) {
      const to = realLen;
      setTeleportFreeze(true);
      requestAnimationFrame(() => {
        mediaRef.current?.scrollToIndex({ index: to, animated: false });
        scrollX.stopAnimation?.();
        scrollX.setValue(to * sw);
        setLoopIndex(to);
        requestAnimationFrame(() => setTeleportFreeze(false));
      });
    } else if (next === realLen + 1) {
      const to = 1;
      setTeleportFreeze(true);
      requestAnimationFrame(() => {
        mediaRef.current?.scrollToIndex({ index: to, animated: false });
        scrollX.stopAnimation?.();
        scrollX.setValue(to * sw);
        setLoopIndex(to);
        requestAnimationFrame(() => setTeleportFreeze(false));
      });
    } else {
      setLoopIndex(next);
    }
  };

  /* ----------------- Size Guide link ----------------- */
  const pageRef = useRef<any>(null);
  const highlightsRef = useRef<ProductHighlightsHandle>(null);
  const [headerH, setHeaderH] = useState(0);
  const scrollYRef = useRef(0);

  const scrollToSizeGuide = () => {
    highlightsRef.current?.openSizeGuide?.();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        highlightsRef.current?.measureSizeGuideScreenY?.((yOnScreen) => {
          const NUDGE = 6;
          const desiredScreenY = headerH + NUDGE;
          const delta = yOnScreen - desiredScreenY;
          const targetOffset = Math.max(0, scrollYRef.current + delta);
          pageRef.current?.scrollToOffset({
            offset: targetOffset,
            animated: true,
          });
        });
      });
    });
  };

  const [lockOuterScroll, setLockOuterScroll] = useState(false);

  /* ----------------- Sticky Header ----------------- */
  const TopStickyHeader = useMemo(() => {
    const p = safeProduct;
    return (
      <View
        className="w-full bg-[#C5F8CE]"
        style={{ zIndex: 10 }}
        onLayout={(e) => setHeaderH(Math.round(e.nativeEvent.layout.height))}>
        <View
          className="flex-row items-center justify-between px-3"
          style={{ paddingVertical: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>

          <Text className="text-base font-semibold uppercase" numberOfLines={1}>
            {p.name}
            {hasVariants && selectedColor ? ` - ${selectedColor}` : ""}
            {hasStorages && selectedStorage?.size
              ? ` (${selectedStorage.size})`
              : ""}
          </Text>

          <TouchableOpacity activeOpacity={0.8}>
            <StoreIconButton store={{ id: 1, slug: "apple" }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    safeProduct,
    hasVariants,
    hasStorages,
    selectedColor,
    selectedStorage?.size,
    router,
  ]);

  const StickyHeaderSkeleton = () => (
    <View className="w-full bg-gray-100" style={{ zIndex: 10 }}>
      <View
        className="flex-row items-center justify-between px-3"
        style={{ paddingVertical: 10 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#E5E7EB",
          }}
        />
        <View
          style={{
            width: "42%",
            height: 14,
            borderRadius: 7,
            backgroundColor: "#E5E7EB",
          }}
        />
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#E5E7EB",
          }}
        />
      </View>
      <View
        style={{
          height: BORDER_WIDTH,
          backgroundColor: CARD_BORDER_COLOR,
          width: "100%",
        }}
      />
    </View>
  );

  /* ----------------- Header Block (Gallery + Price) ----------------- */
  const HeaderBlock = useMemo(() => {
    const p = safeProduct;

    return (
      <View>
        {/* Gallery area with bottom border-2 */}
        <View style={{ backgroundColor: "#F3F4F6" }}>
          <View className="w-full items-center">
            <View className={`w-full aspect-[3/3] items-center justify-center`}>
              <View
                className="w-full h-full overflow-hidden"
                style={{ position: "relative" }}>
                {teleportFreeze && canLoop && (
                  <ExpoImage
                    source={loopData[loopIndex]}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "90%",
                      height: "100%",
                      alignSelf: "center",
                    }}
                    contentFit="contain"
                    transition={0}
                    cachePolicy="memory-disk"
                  />
                )}

                <Animated.FlatList
                  ref={mediaRef}
                  data={loopData}
                  keyExtractor={(_it, i) => `media-${i}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  removeClippedSubviews={false}
                  initialNumToRender={3}
                  maxToRenderPerBatch={5}
                  windowSize={9}
                  getItemLayout={(...args) => getItemLayout(...args)}
                  initialScrollIndex={canLoop ? 1 : 0}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                  )}
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  renderItem={({ item, index }) => {
                    return (
                      <View
                        style={{ width: sw, height: "100%" }}
                        accessibilityRole="image"
                        accessibilityLabel={`Product media ${loopToRealIndex(index) + 1}`}
                        accessibilityHint="Double-tap to like, single-tap to open full-screen">
                        <Pressable
                          onPress={() => onImageTap(index)}
                          style={{ width: "100%", height: "100%" }}
                          renderToHardwareTextureAndroid
                          needsOffscreenAlphaCompositing>
                          <ExpoImage
                            source={item}
                            style={{
                              width: "90%",
                              height: "100%",
                              alignSelf: "center",
                            }}
                            contentFit="contain"
                            contentPosition="center"
                            transition={0}
                            cachePolicy="memory-disk"
                            recyclingKey={
                              typeof item === "string"
                                ? item
                                : ((item as any)?.uri ??
                                  String(loopToRealIndex(index)))
                            }
                          />
                        </Pressable>
                      </View>
                    );
                  }}
                />
              </View>
            </View>

            {/* Dots + actions */}
            <View
              className="w-full px-3"
              style={{ marginTop: 8, marginBottom: 6 }}>
              <View className="flex-row items-center justify-between">
                <View
                  style={{
                    width: Math.max(18, Math.round(sw * 0.05)) * 2 + 24,
                  }}
                />
                <PaginationDots
                  total={realLen}
                  index={activeIndex}
                  onPressDot={(to) => {
                    const toLoop = realToLoopIndex(to);
                    mediaRef.current?.scrollToIndex({
                      index: toLoop,
                      animated: true,
                    });
                    setLoopIndex(toLoop);
                    setActiveIndex(to);
                  }}
                  freeze={teleportFreeze}
                />
                <View className="flex-row items-center">
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Add to wishlist"
                    accessibilityHint="Double-tap a photo to like quickly"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="p-2 bg-white rounded-full"
                    onPress={toggleLike}
                    activeOpacity={0.8}>
                    <Ionicons
                      name={liked ? "heart" : "heart-outline"}
                      size={Math.max(18, Math.round(sw * 0.05))}
                      color={liked ? "#ff3b30" : "#111827"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShareOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Share"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="p-2 bg-white rounded-full ml-2"
                    activeOpacity={0.8}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        justifyContent: "center",
                        transform: [{ rotate: "15deg" }],
                      }}>
                      <Send
                        width={18}
                        height={18}
                        stroke="#262626"
                        strokeWidth={1.6}
                        fill="none"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
        {/* Price card (border-2 handled by CardWrap) */}
        <CardWrap style={{ paddingVertical: 8 }}>
          <View className="px-3 py-2">
            <Text className="text-base font-semibold mb-1">
              {p.name}
              {hasVariants && selectedColor ? ` (${selectedColor}` : ""}
              {hasStorages && selectedStorage?.size
                ? hasVariants
                  ? `, ${selectedStorage.size})`
                  : ` (${selectedStorage.size})`
                : hasVariants
                  ? ")"
                  : ""}
            </Text>

            <View className="flex-row items-end gap-x-2">
              <Text className="text-2xl font-extrabold text-black">
                ₹{money(offerPrice)}
              </Text>
              {mrp > 0 && offerPrice < mrp && (
                <Text className="line-through text-gray-400 mb-0.5">
                  ₹{money(mrp)}
                </Text>
              )}
              {save > 0 && (
                <Text className="text-black-600 font-semibold mb-0.5">
                  You save{" "}
                  <Text className="text-green-600">₹{money(save)} </Text>
                  <Text className="text-red-600">({offPct}%)</Text>
                </Text>
              )}
            </View>

            <Text className="text-xs text-gray-600 mt-1">
              Inclusive of all taxes
            </Text>

            <View className="mt-2">
              {stock <= 0 ? (
                <Text className="text-red-600 font-semibold">Out of stock</Text>
              ) : stock < 10 ? (
                <Text className="text-orange-600 font-semibold">
                  Only {stock} left in stock
                </Text>
              ) : (
                <Text className="ml-1 text-green-600 font-semibold">
                  In Stock
                </Text>
              )}
            </View>
          </View>
        </CardWrap>
      </View>
    );
  }, [
    safeProduct,
    activeIndex,
    liked,
    sw,
    hasVariants,
    hasStorages,
    offerPrice,
    mrp,
    stock,
    save,
    offPct,
    realLen,
    selectedColor,
    selectedStorage?.size,
    teleportFreeze,
    canLoop,
    loopData,
    loopIndex,
  ]);

  /* ----------------- Details Block (all border-2) ----------------- */
  const DetailsBlock = useMemo(
    () => (
      <View>
        {(hasVariants || hasStorages) && (
          <CardWrap style={{ paddingVertical: 12 }}>
            <VariantOptions
              variants={(safeProduct.variants as any) ?? []}
              selectedColor={selectedColor}
              onSelectColor={(c) => setSelectedColor(c)}
              isColorAvailable={(c) =>
                hasStorages
                  ? (safeProduct.storages ?? []).some((s) =>
                      isAvailable(safeProduct, c, s.size)
                    )
                  : true
              }
              storages={(safeProduct.storages as any) ?? []}
              selectedStorage={selectedStorage}
              onSelectStorage={(s) => setSelectedStorage(s)}
              getPriceFor={(size) =>
                getPriceFor(safeProduct, selectedColor, size)
              }
              getStockFor={(size) =>
                getStockFor(safeProduct, selectedColor, size)
              }
              isStorageAvailable={(size) =>
                isAvailable(safeProduct, selectedColor, size)
              }
              singleColorPrice={offerPrice}
              singleColorMrp={mrp}
              onPressSizeGuide={
                chosenType === "clothing" ? scrollToSizeGuide : undefined
              }
            />
          </CardWrap>
        )}

        <CardWrap>
          <ProductHighlights
            ref={highlightsRef}
            data={detailsByKind[chosenType]}
            kind={chosenType}
            showGallery
            showWhatsInBox
            onGalleryOpenChange={setLockOuterScroll}
          />
        </CardWrap>

        <CardWrap>
          <MemoOffersCard kind={chosenType} />
        </CardWrap>

        <CardWrap>
          <FeaturesCard source="product" />
        </CardWrap>

        <CardWrap>
          <MemoReviewsCard
            kind={chosenType}
            summary={reviewsByKind[chosenType].summary}
            reviews={reviewsByKind[chosenType].reviews}
            showAll={false}
          />
        </CardWrap>

        <CardWrap>
          <View className="bg-white">
            <MemoBestProductsCarousel title="Best Products" data={products} />
          </View>
        </CardWrap>
      </View>
    ),
    [
      safeProduct,
      selectedColor,
      selectedStorage,
      offerPrice,
      mrp,
      chosenType,
      hasVariants,
      hasStorages,
    ]
  );

  /* ----------------- Render ----------------- */
  const productKey = `${chosenType}-${(safeProduct as any)?.id ?? safeProduct?.name ?? "p"}`;

  return (
    <View className="flex-1 bg-[#C5F8CE] pt-safe">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <GHFlatList
        key={productKey}
        ref={pageRef}
        data={["__sticky__", "__content__"]}
        extraData={{
          productKey,
          lockOuterScroll,
          loadingProduct,
          refreshing,
          selectedColor,
          selectedStorage: selectedStorage?.size,
        }}
        keyExtractor={(item, i) => `${item}-${i}`}
        renderItem={({ item }) =>
          item === "__sticky__" ? (
            loadingProduct || refreshing ? (
              <StickyHeaderSkeleton />
            ) : (
              TopStickyHeader
            )
          ) : loadingProduct ? (
            <View>
              <CardWrap>
                <ProductSkeletonPlaceholder />
              </CardWrap>
              <CardWrap>
                <ProductSkeletonPlaceholder />
              </CardWrap>
              <CardWrap>
                <ProductSkeletonPlaceholder />
              </CardWrap>
            </View>
          ) : (
            <View>
              {HeaderBlock}
              <View>{DetailsBlock}</View>
            </View>
          )
        }
        stickyHeaderIndices={[0]}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!lockOuterScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4D70D1"]}
            tintColor={"#4D70D1"}
            progressBackgroundColor={"#F3F4F8"}
          />
        }
        contentContainerStyle={{
          paddingBottom: (insets.bottom || 0) + 83,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={2}
        maxToRenderPerBatch={4}
        windowSize={9}
        onScroll={({ nativeEvent }) => {
          scrollYRef.current = nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      />

      {/* Floating "View cart" pill */}
      {added && qty > 0 && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: (insets.bottom || 0) + 80,
            zIndex: 50,
          }}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/cart")}
            activeOpacity={0.95}
            accessibilityLabel="View cart"
            accessibilityRole="button"
            style={{ width: Math.round(width * 0.5), minHeight: 70 }}
            className="mx-auto rounded-full px-3 py-2 flex-row items-center justify-between bg-black shadow-lg overflow-visible">
            <View className="w-14 h-14 rounded-full bg-white items-center justify-center mr-2">
              <ExpoImage
                source={(galleryBase?.[0] as any) ?? safeProduct.mainImage}
                contentFit="contain"
                style={{ width: 45, height: 45, borderRadius: 20 }}
              />
            </View>
            <View className="flex-1 items-center justify-center">
              <Text className="text-white text-base font-semibold mr-5">
                View cart
              </Text>
              <Text className="text-white/100 text-xs mt-0.5 mr-5">
                {qty} Item{qty > 1 ? "s" : ""}
              </Text>
            </View>
            <View className="w-10 h-10 rounded-3xl items-center justify-center ml-2 mb-1 bg-white">
              <Ionicons name="chevron-forward" size={18} color="#000000ff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Sticky bottom bar */}
      {!bottomBarReady || loadingProduct ? (
        <BottomBarSkeleton />
      ) : (
        <View
          className="absolute inset-x-0 bottom-0 z-40"
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
            backgroundColor:
              Platform.OS === "ios" ? "transparent" : "rgba(255,255,255,0.92)",
            borderTopWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 18,
            elevation: 14,
          }}
          accessibilityLabel="Purchase actions">
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={30}
              tint="light"
              style={{
                paddingHorizontal: 12,
                paddingTop: 12,
                paddingBottom: (insets.bottom || 0) + 12,
              }}>
              <BottomBarContent
                offerPrice={offerPrice}
                mrp={mrp}
                offPct={offPct}
                qty={qty}
                onAdd={onAdd}
                dec={dec}
                inc={inc}
              />
            </BlurView>
          ) : (
            <View
              style={{
                paddingHorizontal: 12,
                paddingTop: 12,
                paddingBottom: (insets.bottom || 0) + 12,
              }}>
              <BottomBarContent
                offerPrice={offerPrice}
                mrp={mrp}
                offPct={offPct}
                qty={qty}
                onAdd={onAdd}
                dec={dec}
                inc={inc}
              />
            </View>
          )}
        </View>
      )}

      {/* Share sheet */}
      <ShareSectionBottomSheet
        show={shareOpen}
        setShow={setShareOpen}
        users={[]}
        postId={(safeProduct as any).id}
        postPreview={{
          id: String((safeProduct as any).id || ""),
          image:
            typeof galleryBase?.[0] === "string"
              ? (galleryBase as any)[0]
              : ((galleryBase?.[0] as any)?.uri ??
                (safeProduct as any).mainImage),
          author: (safeProduct as any).brand || "store",
          caption: (safeProduct as any).name || "",
          author_avatar: (safeProduct as any).brandLogo ?? "",
          verified: false,
          thumb:
            typeof galleryBase?.[0] === "string"
              ? (galleryBase as any)[0]
              : ((galleryBase?.[0] as any)?.uri ?? undefined),
        }}
        initialHeightPct={0.4}
        maxHeightPct={0.9}
        maxSelect={5}
      />
    </View>
  );
}

/* ----------------- Bottom bar content ----------------- */
function BottomBarContent({
  offerPrice,
  mrp,
  offPct,
  qty,
  onAdd,
  dec,
  inc,
}: {
  offerPrice: number;
  mrp: number;
  offPct: number;
  qty: number;
  onAdd: () => void;
  dec: () => void;
  inc: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        <View className="mt-1 flex-row items-center">
          <Text className="text-2xl font-extrabold text-black">
            ₹{money(offerPrice)}
          </Text>
          {mrp > 0 && offerPrice < mrp && (
            <Text className="ml-2 text-gray-400 line-through">
              ₹{money(mrp)}
            </Text>
          )}
          {offPct > 0 && (
            <View className="ml-2 rounded-md px-2 py-0.5 bg-green-100/80">
              <Text className="text-xs font-semibold text-green-700">
                {offPct}% OFF
              </Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-600 mt-1">
          Inclusive of all taxes
        </Text>
      </View>

      {qty === 0 ? (
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onAdd}
          className="items-center justify-center rounded-full"
          style={{
            backgroundColor: "#000000ff",
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 999,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 8,
            minWidth: 152,
          }}
          accessibilityRole="button"
          accessibilityLabel="Add to cart"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-white font-semibold text-lg">Add to cart</Text>
        </TouchableOpacity>
      ) : (
        <View
          className="flex-row items-center justify-between"
          style={{
            backgroundColor: "#000000ff",
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderRadius: 999,
            minWidth: 152,
            shadowColor: "#000",
            shadowOpacity: 0.14,
            shadowRadius: 8,
            elevation: 8,
          }}
          accessibilityLabel="Quantity stepper">
          <TouchableOpacity
            onPress={dec}
            accessibilityLabel="Decrease quantity"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>

          <Text className="text-white font-semibold text-lg px-3">{qty}</Text>

          <TouchableOpacity
            onPress={inc}
            accessibilityLabel="Increase quantity"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
