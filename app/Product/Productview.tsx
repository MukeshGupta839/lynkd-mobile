// app/ProductView.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Send } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Vibration,
  View,
} from "react-native";
import { FlatList as GHFlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Components ---
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import FeaturesCard from "@/components/Productview/FeaturesCard";
import OffersCard from "@/components/Productview/OffersCard";
import ProductHighlights, {
  type ProductHighlightsHandle,
} from "@/components/Productview/ProductHighlights";
import ReviewsCard from "@/components/Productview/ReviewsCard";
import VariantOptions from "@/components/Productview/VariantOptions";
import ShareSectionBottomSheet from "@/components/ShareSectionBottomSheet";
import StoreIconButton from "@/components/StoreIconButton";

// --- Constants & Data ---
import { products } from "@/constants/Product";
import {
  type Kind,
  type ProductData,
  productByKind,
} from "@/constants/Productview";
import { detailsByKind } from "@/constants/highlights";
import { reviewsByKind } from "@/constants/review";

/* ----------------- Borders ----------------- */
const CARD_BORDER_COLOR = "#D1D5DB";
const BORDER_WIDTH = 1;

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
    ]}
  >
    {children}
  </View>
);

/* ----------------- Memoized Children ----------------- */
const MemoOffersCard = React.memo(OffersCard);
const MemoReviewsCard = React.memo(ReviewsCard);
const MemoBestProductsCarousel = React.memo(BestProductsCarousel);

/* ----------------- Helpers ----------------- */
const money = (n = 0) =>
  Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* ----------------- Pagination Dots ----------------- */
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

  const computeStart = useCallback(
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
      needsOffscreenAlphaCompositing
    >
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          transform: [{ translateX: transX }],
          paddingHorizontal: GAP / 2,
        }}
      >
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
              }}
            >
              {onPressDot ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onPressDot(i)}
                >
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

/* =========================================================
   1. PARENT COMPONENT (Container)
   ========================================================= */
export default function ProductView() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1. Dynamic Data Lookup
  const typeParam = (params.type as string) || "phone";

  const chosenType: Kind =
    typeParam in productByKind ? (typeParam as Kind) : "phone";

  const productData = productByKind[chosenType];

  // 2. Early Return (Safe here because we haven't called logic hooks yet)
  if (!productData) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg font-semibold text-gray-500">
          Product not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 p-2 bg-gray-100 rounded-lg"
        >
          <Text className="text-blue-600">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Pass guaranteed data to the Child
  return <ProductContent productData={productData} kind={chosenType} />;
}

/* =========================================================
   2. CHILD COMPONENT (Presenter)
   ========================================================= */

type ProductContentProps = {
  productData: ProductData;
  kind: Kind;
};

function ProductContent({ productData, kind }: ProductContentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: sw } = useWindowDimensions();
  const BOTTOM_BAR_VISIBLE_HEIGHT = 86;

  // --- 1. INITIALIZE STATE ---
  const initialColor = productData.colors[0];
  const initialSize = initialColor?.options[0]?.size || "";

  const [selectedColorName, setSelectedColorName] = useState<string>(
    initialColor?.name || ""
  );
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);

  // --- 2. DERIVED DATA ---
  const activeColorObj = useMemo(
    () =>
      productData.colors.find((c) => c.name === selectedColorName) ||
      productData.colors[0],
    [productData, selectedColorName]
  );

  const activeOptionObj = useMemo(
    () =>
      activeColorObj.options.find((o) => o.size === selectedSize) ||
      activeColorObj.options[0],
    [activeColorObj, selectedSize]
  );

  const currentPrice = activeOptionObj.price;
  const currentMrp = activeOptionObj.mrp;
  const currentStock = activeOptionObj.stock;
  const save = Math.max(currentMrp - currentPrice, 0);
  const offPct = currentMrp ? Math.round((save / currentMrp) * 100) : 0;

  // --- 3. UI STATE ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(0);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [loopIndex, setLoopIndex] = useState(1);
  const [teleportFreeze, setTeleportFreeze] = useState(false);
  const [lockOuterScroll, setLockOuterScroll] = useState(false);
  const [headerH, setHeaderH] = useState(0);

  // --- 4. REFS ---
  const scrollX = useRef(new Animated.Value(0)).current;
  const mediaRef = useRef<any>(null);
  const pageRef = useRef<any>(null);
  const highlightsRef = useRef<ProductHighlightsHandle>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollYRef = useRef(0);

  // --- 5. ACTIONS ---
  const toggleLike = useCallback(() => {
    Vibration.vibrate(100);
    setLiked((prev) => !prev);
  }, []);

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

  const scrollToSizeGuide = useCallback(() => {
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
  }, [headerH]);

  // --- 6. GALLERY LOGIC ---
  const galleryBase = useMemo(() => {
    if (!activeColorObj?.images?.length) return [{ uri: "" }];
    return activeColorObj.images.map((url) => ({ uri: url }));
  }, [activeColorObj]);

  const canLoop = galleryBase.length > 1;
  const loopData = useMemo(
    () =>
      canLoop
        ? [galleryBase[galleryBase.length - 1], ...galleryBase, galleryBase[0]]
        : galleryBase,
    [galleryBase, canLoop]
  );

  const realLen = galleryBase.length;

  const loopToRealIndex = useCallback(
    (idx: number) => {
      if (!canLoop) return idx;
      if (idx === 0) return realLen - 1;
      if (idx === realLen + 1) return 0;
      return idx - 1;
    },
    [canLoop, realLen]
  );

  const onImageTap = useCallback(
    (index: number) => {
      const now = Date.now();
      const delta = now - (lastTapRef.current || 0);
      lastTapRef.current = now;

      if (delta < 260) {
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        toggleLike();
        return;
      }
      tapTimeoutRef.current = setTimeout(() => {
        const real = loopToRealIndex(index);
        router.push({
          pathname: "/Product/media",
          params: {
            images: encodeURIComponent(JSON.stringify(galleryBase)),
            index: String(real),
            title: productData.name ?? "",
          },
        });
      }, 280);
    },
    [toggleLike, loopToRealIndex, router, galleryBase, productData.name]
  );

  useEffect(() => {
    if (loopData.length === 0) return;
    const start = canLoop ? 1 : 0;
    setLoopIndex(start);
    requestAnimationFrame(() => {
      mediaRef.current?.scrollToIndex({ index: start, animated: false });
      scrollX.setValue(start * sw);
    });
    setActiveIndex(0);
  }, [activeColorObj, canLoop, loopData.length, scrollX, sw]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (realLen === 0) return;
      const next = Math.round(e.nativeEvent.contentOffset.x / sw);

      if (!canLoop) {
        setActiveIndex(next);
        return;
      }

      const real = loopToRealIndex(next);
      if (real !== activeIndex) setActiveIndex(real);

      if (next === 0 || next === realLen + 1) {
        const to = next === 0 ? realLen : 1;
        setTeleportFreeze(true);
        requestAnimationFrame(() => {
          mediaRef.current?.scrollToIndex({ index: to, animated: false });
          scrollX.setValue(to * sw);
          setLoopIndex(to);
          requestAnimationFrame(() => setTeleportFreeze(false));
        });
      } else {
        setLoopIndex(next);
      }
    },
    [sw, canLoop, loopToRealIndex, activeIndex, realLen, scrollX]
  );

  const getItemLayout = useCallback(
    (_: any, i: number) => ({ length: sw, offset: sw * i, index: i }),
    [sw]
  );

  /* --- RENDER COMPONENTS --- */

  const TopStickyHeader = useMemo(
    () => (
      <View
        className="w-full bg-[#C5F8CE]"
        style={{ zIndex: 10, paddingTop: insets.top - 10 }}
        onLayout={(e) => setHeaderH(Math.round(e.nativeEvent.layout.height))}
      >
        <View className="flex-row items-center justify-between px-3 py-2">
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <StoreIconButton
            store={{
              ...productData.store,
              id: productData.store.id,
              slug: String(productData.store.id),
            }}
          />
        </View>
      </View>
    ),
    [insets.top, router, productData.store]
  );

  const HeaderBlock = useMemo(
    () => (
      <View>
        {/* Gallery */}
        <View style={{ backgroundColor: "#F3F4F6" }}>
          <View className="w-full aspect-[3/3] relative">
            {teleportFreeze && canLoop && (
              <ExpoImage
                source={loopData[loopIndex]}
                style={{
                  position: "absolute",
                  width: "90%",
                  height: "100%",
                  alignSelf: "center",
                }}
                contentFit="contain"
              />
            )}
            <Animated.FlatList
              ref={mediaRef}
              data={loopData}
              keyExtractor={(_it, i) => `media-${i}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              getItemLayout={getItemLayout}
              initialScrollIndex={canLoop ? 1 : 0}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              onMomentumScrollEnd={onMomentumScrollEnd}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => onImageTap(index)}
                  style={{ width: sw, height: "100%" }}
                >
                  <ExpoImage
                    source={item}
                    style={{
                      width: "90%",
                      height: "100%",
                      alignSelf: "center",
                    }}
                    contentFit="contain"
                  />
                </Pressable>
              )}
            />
          </View>

          {/* Pagination Dots */}
          <View className="w-full px-3 mt-2 mb-1 flex-row items-center justify-between">
            <View style={{ width: 40 }} />
            <PaginationDots
              total={realLen}
              index={activeIndex}
              freeze={teleportFreeze}
            />
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={toggleLike}
                className="p-2 bg-white rounded-full mr-2"
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={18}
                  color={liked ? "#ff3b30" : "#111827"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShareOpen(true)}
                className="p-2 bg-white rounded-full"
              >
                <Send width={18} height={18} stroke="#262626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Price Info */}
        <CardWrap style={{ paddingVertical: 8 }}>
          <View className="px-3 py-2">
            <Text className="text-base font-semibold mb-1">
              {productData.name}
              {productData.colors.length > 1 && (
                <Text className="font-normal text-gray-500">
                  {" "}
                  ({activeColorObj.name}, {activeOptionObj.size})
                </Text>
              )}
            </Text>

            <View className="flex-row items-end gap-x-2">
              <Text className="text-2xl font-extrabold text-black">
                ₹{money(currentPrice)}
              </Text>
              {currentMrp > currentPrice && (
                <Text className="line-through text-gray-400 mb-0.5">
                  ₹{money(currentMrp)}
                </Text>
              )}
              {save > 0 && (
                <Text className="text-red-600 font-semibold mb-0.5">
                  ({offPct}% OFF)
                </Text>
              )}
            </View>
            <Text className="text-xs text-gray-600 mt-1">
              Inclusive of all taxes
            </Text>
            <Text
              className={`mt-2 font-semibold ${currentStock <= 0 ? "text-red-600" : "text-green-600"}`}
            >
              {currentStock <= 0
                ? "Out of stock"
                : currentStock < 10
                  ? `Only ${currentStock} left`
                  : "In Stock"}
            </Text>
          </View>
        </CardWrap>
      </View>
    ),
    [
      teleportFreeze,
      canLoop,
      loopData,
      loopIndex,
      getItemLayout,
      scrollX,
      onMomentumScrollEnd,
      realLen,
      activeIndex,
      toggleLike,
      liked,
      productData.name,
      productData.colors.length,
      activeColorObj.name,
      activeOptionObj.size,
      currentPrice,
      currentMrp,
      save,
      offPct,
      currentStock,
      sw,
      onImageTap,
    ]
  );

  /* --- DETAILS BLOCK --- */
  const DetailsBlock = useMemo(() => {
    // Check if we have multiple options to show
    const showColors = productData.colors.length > 1;
    const showSizes = activeColorObj.options.length > 1;

    // Hide the entire card if there's only 1 color AND 1 size (e.g. Facewash)
    const shouldShowVariantCard = showColors || showSizes;

    return (
      <View>
        {shouldShowVariantCard && (
          <CardWrap style={{ paddingVertical: 12 }}>
            <VariantOptions
              // Pass [] if only 1 color, so the Color Row is hidden by VariantOptions
              variants={
                showColors
                  ? productData.colors.map((c) => ({
                      color: c.name,
                      swatch: { uri: c.swatch },
                      images: c.images.map((i) => ({ uri: i })),
                    }))
                  : []
              }
              selectedColor={selectedColorName}
              onSelectColor={(c) => {
                setSelectedColorName(c);
                const newColor = productData.colors.find(
                  (col) => col.name === c
                );
                if (newColor && newColor.options.length > 0) {
                  setSelectedSize(newColor.options[0].size);
                }
              }}
              isColorAvailable={() => true}
              // Pass [] if only 1 size, so the Size Row is hidden by VariantOptions
              storages={showSizes ? activeColorObj.options : []}
              selectedStorage={activeOptionObj}
              onSelectStorage={(s) => setSelectedSize(s.size)}
              getPriceFor={(size) =>
                activeColorObj.options.find((o) => o.size === size)?.price ??
                currentPrice
              }
              getStockFor={() => 999}
              isStorageAvailable={() => true}
              singleColorPrice={currentPrice}
              singleColorMrp={currentMrp}
              // DYNAMIC SIZE GUIDE: Only show if data exists
              onPressSizeGuide={
                productData.sizeGuide ? scrollToSizeGuide : undefined
              }
            />
          </CardWrap>
        )}

        <CardWrap>
          <ProductHighlights
            ref={highlightsRef}
            data={detailsByKind[kind] ?? detailsByKind["phone"]}
            kind={kind}
            showGallery
            showWhatsInBox
            onGalleryOpenChange={setLockOuterScroll}
          />
        </CardWrap>

        <CardWrap>
          <MemoOffersCard kind={kind} />
        </CardWrap>
        <CardWrap>
          <FeaturesCard source="product" />
        </CardWrap>
        <CardWrap>
          <MemoReviewsCard
            kind={kind}
            summary={
              reviewsByKind[kind]?.summary ?? reviewsByKind["phone"].summary
            }
            reviews={
              reviewsByKind[kind]?.reviews ?? reviewsByKind["phone"].reviews
            }
            showAll={false}
          />
        </CardWrap>
        <CardWrap>
          <View className="bg-white">
            <MemoBestProductsCarousel title="Best Products" data={products} />
          </View>
        </CardWrap>
      </View>
    );
  }, [
    activeColorObj,
    activeOptionObj,
    currentPrice,
    selectedColorName,
    kind,
    productData.colors,
    productData.sizeGuide,
    scrollToSizeGuide,
    currentMrp,
  ]);

  return (
    <View className="flex-1 bg-[#F3F4F8]">
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      {TopStickyHeader}

      <GHFlatList
        key={productData.id}
        ref={pageRef}
        data={["__content__"]}
        keyExtractor={() => "content"}
        renderItem={() => (
          <View>
            {HeaderBlock}
            {DetailsBlock}
          </View>
        )}
        scrollEnabled={!lockOuterScroll}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_VISIBLE_HEIGHT }}
        onScroll={({ nativeEvent }) => {
          scrollYRef.current = nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      />

      {/* Floating Cart Button */}
      {added && qty > 0 && (
        <View className="absolute inset-x-0 bottom-[90px] z-50 items-center">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/cart")}
            className="rounded-full px-3 py-2 flex-row gap-2 items-center bg-black shadow-lg max-w-[80%]"
          >
            <View className="w-14 h-14 rounded-full bg-white items-center justify-center">
              <ExpoImage
                source={galleryBase[0]}
                contentFit="contain"
                style={{ width: 45, height: 45, borderRadius: 20 }}
              />
            </View>
            <View>
              <Text className="text-white text-base font-semibold">
                View cart
              </Text>
              <Text className="text-white text-xs">
                {qty} Item{qty > 1 ? "s" : ""}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="black"
              style={{
                backgroundColor: "white",
                borderRadius: 100,
                padding: 2,
              }}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Bar */}
      <View
        className="absolute inset-x-0 bottom-0 z-40"
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: "hidden",
          backgroundColor:
            Platform.OS === "ios" ? "transparent" : "rgba(255,255,255,0.92)",
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 18,
          elevation: 14,
          height: BOTTOM_BAR_VISIBLE_HEIGHT,
        }}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={30}
            tint="light"
            style={{
              paddingHorizontal: 12,
              paddingTop: 12,
              paddingBottom: insets.bottom,
              height: BOTTOM_BAR_VISIBLE_HEIGHT,
              justifyContent: "center",
            }}
          >
            <BottomBarContent
              offerPrice={currentPrice}
              mrp={currentMrp}
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
              paddingBottom: insets.bottom,
              height: BOTTOM_BAR_VISIBLE_HEIGHT,
              justifyContent: "center",
            }}
          >
            <BottomBarContent
              offerPrice={currentPrice}
              mrp={currentMrp}
              offPct={offPct}
              qty={qty}
              onAdd={onAdd}
              dec={dec}
              inc={inc}
            />
          </View>
        )}
      </View>

      <ShareSectionBottomSheet
        show={shareOpen}
        setShow={setShareOpen}
        users={[]}
        postId={productData.id}
        postPreview={{
          id: String(productData.id),
          image: galleryBase[0]?.uri,
          author: productData.store.name,
          caption: productData.name,
          author_avatar: productData.store.logo,
          verified: false,
          thumb: galleryBase[0]?.uri,
        }}
      />
    </View>
  );
}

/* ----------------- Bottom Bar Content ----------------- */
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
          {/* {mrp > 0 && offerPrice < mrp && (
            <Text className="ml-2 text-gray-400 line-through">
              ₹{money(mrp)}
            </Text>
          )} */}
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
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
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
          accessibilityLabel="Quantity stepper"
        >
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
            }}
          >
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
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
