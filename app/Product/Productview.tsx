// app/ProductView.tsx
import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import DeliveryDetails from "@/components/Productview/DeliveryDetails";
import FeaturesCard from "@/components/Productview/FeaturesCard";
import OffersCard from "@/components/Productview/OffersCard";
import ProductHighlights from "@/components/Productview/ProductHighlights";
import ReviewsCard from "@/components/Productview/ReviewsCard";
import { products } from "@/constants/Product";
import { product as productConst } from "@/constants/Productview";
import { highlightsData } from "@/constants/highlights";
import { reviewsData, reviewsSummary } from "@/constants/review";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Truck } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ----------------- Memoize heavy pure children globally ----------------- */
/* Wrap external components with React.memo if they are pure and expensive.
   This avoids re-renders when parent state changes that don't affect them. */
const MemoOffersCard = React.memo(OffersCard);
const MemoDeliveryDetails = React.memo(DeliveryDetails);
const MemoFeaturesCard = React.memo(FeaturesCard);
const MemoProductHighlights = React.memo(ProductHighlights);
const MemoReviewsCard = React.memo(ReviewsCard);
const MemoBestProductsCarousel = React.memo(BestProductsCarousel);

/* ----------------- Main component ----------------- */
export default function ProductView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const product = productConst;

  // state
  const [selectedColor, setSelectedColor] = useState(
    product.variants?.[0]?.color ?? ""
  );
  const [selectedStorage, setSelectedStorage] = useState(
    product.storages?.[0] ?? { size: "", price: 0 }
  );
  const [selectedThumbnail, setSelectedThumbnail] = useState<number | null>(
    null
  );

  // navigation callbacks
  const goBack = useCallback(() => router.back(), [router]);
  const goToCart = useCallback(() => router.push("/(tabs)/cart"), [router]);
  const goToBuy = useCallback(
    () => router.push("/Product/ReviewOrder"),
    [router]
  );

  // selection callbacks (stable)
  const onSelectThumbnail = useCallback((idx: number) => {
    setSelectedThumbnail(idx);
  }, []);
  const onSelectColor = useCallback((c: string) => setSelectedColor(c), []);
  const onSelectStorage = useCallback((s: any) => setSelectedStorage(s), []);

  /* ----------------- Responsive / runtime values ----------------- */
  const isWide = width >= 760; // treat as tablet/large landscape
  const floatingTop =
    insets.top + Math.max(40, height * (isWide ? 0.06 : 0.06));
  const iconSize = Math.max(16, Math.round(width * (isWide ? 0.035 : 0.045)));
  const floatingRight = 12;

  // content container style for FlatList (keeps bottom CTA visible)
  const contentContainerStyle = useMemo(
    () => ({ paddingBottom: (insets.bottom || 0) + 40 }),
    [insets.bottom]
  );

  /* ----------------- UI pieces ----------------- */
  const ThumbnailsRow = useMemo(() => {
    return (
      <View className="flex-row mb-4 px-3">
        {product.thumbnails?.map((img: any, idx: number) => {
          const active = selectedThumbnail === idx;
          return (
            <TouchableOpacity
              key={typeof img === "string" ? img : `thumb-${idx}`}
              onPress={() => onSelectThumbnail(idx)}
              activeOpacity={0.85}
              accessibilityLabel={`Thumbnail ${idx + 1}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className={`flex-1 mx-1 rounded-lg items-center justify-center ${
                active
                  ? "border-2 border-[#26FF91] bg-[#CCFFE5]"
                  : "border border-[#E5E7EB] bg-white"
              }`}>
              <View className="w-full aspect-square flex items-center justify-center p-2">
                <Image
                  source={img}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [product.thumbnails, selectedThumbnail, onSelectThumbnail]);

  const ColorOptionsRow = useMemo(() => {
    return (
      <View className="flex-row px-3">
        {product.variants?.map((v: any, idx: number) => {
          const active = selectedColor === v.color;
          return (
            <TouchableOpacity
              key={v.color ?? `color-${idx}`}
              onPress={() => onSelectColor(v.color)}
              activeOpacity={0.85}
              accessibilityLabel={`Color ${v.color}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className={`flex-1 mx-1 rounded-lg border items-center justify-center ${
                active
                  ? "border-2 border-[#26FF91] bg-[#CCFFE5]"
                  : "border border-[#E5E7EB] bg-white"
              }`}>
              <View className="w-full aspect-square flex items-center justify-center p-2">
                <Image
                  source={v.swatch}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [product.variants, selectedColor, onSelectColor]);

  const StorageOptionsRow = useMemo(() => {
    return (
      <View className="flex-row flex-wrap px-3 gap-3">
        {product.storages?.map((s: any) => (
          <TouchableOpacity
            key={s.size}
            onPress={() => onSelectStorage(s)}
            activeOpacity={0.85}
            accessibilityLabel={`Storage ${s.size}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className={`px-3 py-2 rounded-md border ${
              selectedStorage.size === s.size
                ? "border-2 border-[#26FF91] bg-[#CCFFE5]"
                : "border border-[#E5E7EB] bg-white"
            }`}>
            <Text
              className={`text-sm ${
                selectedStorage.size === s.size
                  ? "font-semibold"
                  : "text-gray-700"
              }`}>
              {s.size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [product.storages, selectedStorage, onSelectStorage]);

  /* ----------------- Header Block ----------------- */
  const HeaderBlock = useMemo(() => {
    const mainImageSource =
      selectedThumbnail != null && product.thumbnails?.[selectedThumbnail]
        ? product.thumbnails[selectedThumbnail]
        : product.mainImage;

    return (
      <View>
        {/* Header container with runtime top padding */}
        <View className="bg-white rounded-b-2xl shadow">
          <View style={{ paddingTop: insets.top + 8 }} className="px-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={goBack}
                className="p-2"
                accessibilityLabel="Go back"
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="arrow-back" size={20} color="black" />
              </TouchableOpacity>

              <Text className="text-base font-semibold uppercase">
                {product.name}
              </Text>

              <View
                className="p-2 bg-white rounded-full"
                style={Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  },
                  android: { elevation: 2 },
                  default: {
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                  },
                })}
                accessibilityLabel="Search"
                accessibilityRole="button">
                <Ionicons name="search" size={18} color="black" />
              </View>
            </View>
          </View>

          {/* Responsive heart & share positioned relative to header area */}
          <View
            style={{
              position: "absolute",
              right: floatingRight,
              top: floatingTop,
              zIndex: 10,
            }}
            pointerEvents="box-none">
            <View
              className={
                isWide ? "flex-row items-center space-x-3" : "space-y-3"
              }>
              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add to wishlist"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-2 bg-white rounded-full"
                style={Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  },
                  android: { elevation: 4 },
                  default: {
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                  },
                })}
                onPress={() => {
                  // TODO: toggle wishlist or open modal
                  console.log("Wishlist pressed");
                }}>
                <Ionicons name="heart-outline" size={iconSize} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Share"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-2 bg-white rounded-full mt-2"
                style={Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  },
                  android: { elevation: 4 },
                  default: {
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                  },
                })}
                onPress={() => {
                  // TODO: call Share API
                  console.log("Share pressed");
                }}>
                <Ionicons
                  name="share-social-outline"
                  size={iconSize}
                  color="black"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* main image: responsive aspect ratio */}
          <View className="w-full items-center mt-4 px-3">
            <View
              className={
                isWide
                  ? "w-full aspect-[16/9] items-center justify-center"
                  : "w-full aspect-[4/3] items-center justify-center"
              }>
              <Image
                source={mainImageSource}
                className="w-full h-full"
                resizeMode="contain"
                accessibilityLabel="Main product image"
              />
            </View>
          </View>
        </View>

        {/* Thumbnails card and product info */}
        <View className="bg-white rounded-2xl mt-3 px-3 py-4">
          {ThumbnailsRow}

          <View className="px-3 py-2">
            <Text className="text-base font-semibold mb-1">
              {product.name} ({selectedColor}, {selectedStorage?.size})
            </Text>

            <View className="flex-row items-center space-x-2">
              <Text className="text-lg font-bold text-black">
                ₹
                {Number(selectedStorage?.price ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </Text>
              <Text className="line-through text-gray-400 text-sm">
                20,0000
              </Text>
              <Text className="text-green-500 text-sm font-semibold">50%</Text>
            </View>

            <View className="flex-row items-center mt-1">
              {[...Array(4)].map((_, i) => (
                <Ionicons key={i} name="star" size={14} color="#FFD700" />
              ))}
              <Ionicons name="star-half" size={14} color="#FFD700" />
              <Text className="ml-1 text-sm text-gray-700">
                4.5 (2,495 reviews)
              </Text>
            </View>

            <View className="mt-1 flex-row items-center bg-[#26FF91] px-2 py-0.5 rounded-full self-start">
              <Truck size={14} color="#000" />
              <Text className="ml-1 text-black font-bold text-xxs">
                Super Fast
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, [
    product,
    selectedThumbnail,
    insets.top,
    selectedColor,
    selectedStorage,
    goBack,
    ThumbnailsRow,
    floatingRight,
    floatingTop,
    iconSize,
    isWide,
  ]);

  /* ----------------- Details Block ----------------- */
  const DetailsBlock = useMemo(() => {
    return (
      <>
        <View className="bg-white rounded-2xl shadow mt-3 py-4">
          <View className="px-3">
            <Text className="font-semibold mb-2">Color</Text>
          </View>
          <View>{ColorOptionsRow}</View>

          <View className="px-3 mt-3">
            <Text className="font-semibold mb-2">Storage</Text>
            {StorageOptionsRow}
          </View>
        </View>

        <MemoOffersCard />

        <MemoDeliveryDetails
          addresses={[
            {
              title: "HOME",
              details: "Electronic City Phase 1, Doddathogur Cross ..",
            },
            {
              title: "HOME 2",
              details: "Electronic City Phase 2, Infosys Office Gate 1...",
            },
          ]}
          warrantyText="1 year warranty for the phone and 1 year warranty for in Box Accessories. In all over the World Warranty"
        />

        <View className="mt-3">
          <FeaturesCard source="product" />
        </View>

        <View className="mt-3">
          <MemoProductHighlights highlights={highlightsData} />
        </View>

        <View className="mt-3">
          <MemoReviewsCard
            summary={reviewsSummary}
            reviews={reviewsData}
            showAll={false}
            onViewMore={() => router.push("/")}
          />
        </View>

        <View className="mt-4">
          <View className="py-5">
            <MemoBestProductsCarousel title="Best Products" data={products} />
          </View>
        </View>
      </>
    );
  }, [ColorOptionsRow, StorageOptionsRow, router]);

  /* ----------------- Render ----------------- */
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <FlatList
        data={[0]}
        keyExtractor={(_v, i) => String(i)}
        renderItem={(): null => null}
        ListHeaderComponent={useMemo(
          () => (
            <View>
              {HeaderBlock}
              <View className="px-3">{DetailsBlock}</View>
            </View>
          ),
          [HeaderBlock, DetailsBlock]
        )}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={1}
        maxToRenderPerBatch={4}
        windowSize={9}
      />

      {/* Sticky bottom CTA (uses runtime inset for bottom) */}
      <View
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl px-3 pt-2"
        style={{ paddingBottom: insets.bottom }}
        accessibilityLabel="Purchase actions">
        <View className="flex-row items-center justify-between gap-4">
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 rounded-2xl border border-[#26FF91] bg-white"
            onPress={goToCart}
            accessibilityLabel="Add to cart"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View className="flex-row items-center justify-center gap-2 py-3">
              <Text className="text-base font-semibold text-black">
                Add To Cart
              </Text>
              <Ionicons name="cart-outline" size={18} color="black" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-1 rounded-2xl bg-[#26FF91]"
            onPress={goToBuy}
            accessibilityLabel="Buy now"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View className="items-center justify-center py-3">
              <Text className="text-base font-semibold text-black">
                Buy Now
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
