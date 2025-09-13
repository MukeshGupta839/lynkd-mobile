// app/Product/ReviewOrder.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reused components
import FeaturesCard from "@/components/Productview/FeaturesCard";
import OffersCard from "@/components/Productview/OffersCard";

/* Memoize heavy children if they are pure */
const MemoOffersCard = React.memo(OffersCard);
const MemoFeaturesCard = React.memo(FeaturesCard);

const INR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ReviewOrder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = useMemo(
    () => ({
      title: "Apple iPhone 16 (Ultramarine, 128 GB)",
      image: require("@/assets/images/Product/iphonesmall.png"),
      mrp: 200000,
      basePrice: 79999,
      rating: 4.5,
      reviews: 2495,
    }),
    []
  );

  const [qty, setQty] = useState(1);

  const price = useMemo(
    () => product.basePrice * qty,
    [qty, product.basePrice]
  );
  const discount = useMemo(
    () => Math.max(0, product.mrp * qty - price),
    [qty, product.mrp, price]
  );
  const taxIncluded = 1000; // display-only
  const grandTotal = useMemo(() => price, [price]);

  /* Stable handlers */
  const decreaseQty = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const increaseQty = useCallback(() => setQty((q) => q + 1), []);
  const onContinue = useCallback(
    () =>
      router.push({
        pathname: "/Product/payments",
        params: { total: String(grandTotal) },
      }),
    [router, grandTotal]
  );

  /* ---------- List header (all page content) ---------- */
  const ListHeader = useMemo(
    () => (
      <View>
        {/* Header (no px-3, edge to edge) */}
        <View
          className="bg-white rounded-b-2xl py-3 shadow"
          style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center px-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-1 mr-2"
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="arrow-back" size={20} color="black" />
            </TouchableOpacity>
            <View>
              <Text className="text-xxs text-gray-500">Step 1 of 2</Text>
              <Text className="text-sm font-semibold mt-0.5">
                Review your Order
              </Text>
            </View>
          </View>
        </View>

        {/* Content wrapper so all cards get px-3 */}
        <View className="px-3">
          {/* Address card */}
          <View className="bg-white mt-3 rounded-2xl px-3 py-3">
            <View className="flex-row items-center">
              <Ionicons name="home" size={18} color="#000" />
              <Text className="ml-2 font-semibold text-sm">HOME</Text>
            </View>
            <Text className="mt-1 text-xs text-gray-600">
              Electronic City Phase 2, Infosys Office Gate 1., 3rd Building,
              Bengaluru, 560100
            </Text>
            <Text className="mt-1 text-xs text-gray-700">+91 9876923456</Text>

            <TouchableOpacity
              className="self-start mt-1"
              accessibilityRole="button"
              accessibilityLabel="Change address"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-xxs text-blue-500 font-medium">Change</Text>
            </TouchableOpacity>
          </View>

          {/* Product card */}
          <View className="bg-white mt-3 rounded-2xl px-3 py-3">
            <View className="flex-row">
              <View className="w-[22%] aspect-[1/1.2] rounded-lg overflow-hidden bg-gray-50 mr-3 items-center justify-center">
                <Image
                  source={product.image}
                  className="w-[90%] h-[90%]"
                  resizeMode="contain"
                  accessible
                  accessibilityLabel={product.title}
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold" numberOfLines={2}>
                  {product.title}
                </Text>

                <View className="mt-1 flex-row items-center">
                  <Text className="text-base font-bold mr-2">
                    {INR(product.basePrice)}
                  </Text>
                  <Text className="text-xs line-through text-gray-400 mr-2">
                    {INR(product.mrp)}
                  </Text>
                  <Text className="text-xs font-semibold text-green-600">
                    50%
                  </Text>
                </View>

                {/* rating */}
                <View className="mt-1 flex-row items-center">
                  {[...Array(4)].map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#FFD700" />
                  ))}
                  <Ionicons name="star-half" size={14} color="#FFD700" />
                  <Text className="ml-1 text-[11px] text-gray-600">
                    {product.rating} ({product.reviews.toLocaleString()}{" "}
                    reviews)
                  </Text>
                </View>

                {/* Qty selector */}
                <View className="mt-2 flex-row items-center">
                  <TouchableOpacity
                    className="w-8 aspect-square rounded-full border border-black/10 items-center justify-center"
                    onPress={decreaseQty}>
                    <Text className="text-lg">−</Text>
                  </TouchableOpacity>

                  <Text className="mx-3 font-semibold">{qty}</Text>

                  <TouchableOpacity
                    className="w-8 aspect-square rounded-full border border-black/10 items-center justify-center"
                    onPress={increaseQty}>
                    <Text className="text-lg">＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Offers */}
          <View className="mt-3">
            <MemoOffersCard />
          </View>

          {/* Assurances + warranty */}
          <View className="bg-white mt-3 rounded-2xl py-3 px-3">
            <MemoFeaturesCard />
            <View className="mt-3 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <Ionicons name="logo-apple" size={18} color="#000" />
              <Text className="ml-2 text-xs text-gray-700 px-2 flex-1">
                1 year warranty for the phone and 1 year warranty for in-box
                accessories. Worldwide warranty.
              </Text>
            </View>
          </View>

          {/* Price details */}
          <View className="bg-white mt-3 rounded-2xl px-3 py-3">
            <Text className="text-sm font-semibold mb-2">Price Details</Text>

            <View className="flex-row items-center justify-between py-1">
              <Text className="text-xs text-gray-700">Price ( {qty} item)</Text>
              <Text className="text-xs font-semibold">{INR(price)}</Text>
            </View>

            <View className="flex-row items-center justify-between py-1">
              <Text className="text-xs text-gray-700">Discount</Text>
              <Text className="text-xs font-semibold text-green-600">
                - {INR(discount)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1">
              <Text className="text-xs text-gray-700">Tax Included</Text>
              <Text className="text-xs font-semibold">{INR(taxIncluded)}</Text>
            </View>

            <View className="bg-black/10 my-2 h-[1px]" />

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold">Total</Text>
              <Text className="text-sm font-semibold">{INR(grandTotal)}</Text>
            </View>
          </View>

          <View style={{ height: 16 }} />
        </View>
      </View>
    ),
    [
      insets.top,
      product,
      qty,
      price,
      discount,
      taxIncluded,
      grandTotal,
      decreaseQty,
      increaseQty,
      router,
    ]
  );

  return (
    <View className="flex-1 bg-gray-100 relative">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Sticky bottom total/CTA */}
      <View
        className="absolute inset-x-0 bottom-0"
        style={{ zIndex: 50, elevation: 50 }}
        pointerEvents="box-none">
        <View
          className="bg-white w-full rounded-t-2xl border-t border-black/10"
          style={{
            paddingBottom: insets.bottom || 12,
            minHeight: 76,
            justifyContent: "center",
          }}>
          <View className="flex-row items-center justify-between px-[5%]">
            <View>
              <Text className="text-lg font-semibold">{INR(grandTotal)}</Text>
              <Text className="text-xs text-gray-400 line-through opacity-70">
                {INR(product.mrp)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onContinue}
              className="bg-[#26FF91] rounded-2xl items-center justify-center border border-black/10 px-4 py-3"
              style={{
                minWidth: 140,
                maxWidth: 220,
              }}>
              <Text className="text-base font-semibold">Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={[0]}
        keyExtractor={(_v, i) => String(i)}
        renderItem={(): null => null}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 50 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={1}
        maxToRenderPerBatch={4}
        windowSize={9}
        removeClippedSubviews={false}
      />
    </View>
  );
}
