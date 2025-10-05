// components/cart/ProductRow.tsx
import QuantitySelector from "@/components/cart/QuantitySelector";
import { CartItemT, WishlistItemT } from "@/constants/cart";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type CartRowItem = CartItemT & {
  quantity?: number;
  mrp?: number;
  rating?: number;
};
type WishlistRowItem = WishlistItemT & { mrp?: number; rating?: number };

type Props = {
  item?: CartRowItem | WishlistRowItem | null; // made optional to be defensive
  variant: "cart" | "wishlist";
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove: () => void;
  onAddToCart?: () => void;
  onPress?: () => void;
};

/* local INR helper (kept inside file) */
const INR = (n?: number | null) => {
  const num = typeof n === "number" ? Math.round(n) : Number(n ?? 0);
  if (!isFinite(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
};

export default React.memo(function ProductRow({
  item,
  variant,
  onIncrement,
  onDecrement,
  onRemove,
  onAddToCart,
}: Props) {
  // Defensive: warn if item missing and avoid crash
  useEffect(() => {
    if (item == null) {
      // eslint-disable-next-line no-console
      console.warn(
        "ProductRow: received undefined/null `item`. Check data source.",
        {
          variant,
        }
      );
    }
  }, [item, variant]);

  if (!item) {
    // don't render a broken row — return null to avoid crashes
    return null;
  }

  // normalize fields safely with fallbacks
  const name = (item as any).name ?? "";
  const price = Number((item as any).price ?? 0);
  const mrp = Number((item as any).mrp ?? price);
  const image = (item as any).image;
  const quantity = Number((item as any).quantity ?? 1);
  const reviews = Number((item as any).reviews ?? 0);
  const rating =
    typeof (item as any).rating === "number" ? (item as any).rating : 4.5;

  // compute discount percent (rounded, no decimals)
  const discountPercent = useMemo(() => {
    if (!isFinite(mrp) || mrp <= 0) return 0;
    const pct = Math.round((1 - price / mrp) * 100);
    return Math.max(0, pct);
  }, [price, mrp]);

  // star rendering: compute full/half/empty counts from rating (0..5)
  const starCounts = useMemo(() => {
    const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(normalized);
    const half = normalized - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return { full, half, empty, normalized };
  }, [rating]);

  // Variant-specific classes (kept but simple)
  const contentWrapClass = "w-[90%] self-center p-2";
  const imageBasisClass = variant === "cart" ? "basis-[33%]" : "basis-[16%]";
  const imageAspectClass =
    variant === "cart" ? "aspect-[0.92]" : "aspect-[0.78]";

  return (
    <View className="w-full bg-white rounded-2xl mt-3 overflow-hidden">
      {/* TOP ROW */}
      <View className={`flex-row items-center ${contentWrapClass}`}>
        {/* Image column */}
        <View
          className={`${imageBasisClass} rounded-xl overflow-hidden bg-gray-50`}>
          <View className={`w-full ${imageAspectClass}`}>
            {image ? (
              <Image
                source={image}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="image-outline" size={28} color="#9CA3AF" />
              </View>
            )}
          </View>
        </View>

        {/* Gap */}
        <View className="w-4" />

        {/* DETAILS column */}
        <View className="basis-[65%]">
          {/* Title */}
          <Text
            className="text-base font-semibold text-black"
            numberOfLines={2}
            ellipsizeMode="tail"
            accessibilityRole="header">
            {name}
          </Text>

          {/* Price row */}
          <View className="flex-row items-center">
            <Text className="text-lg font-bold mr-2">{INR(price)}</Text>
            <Text className="text-xs line-through text-gray-400 mr-2">
              {INR(mrp)}
            </Text>
            <Text className="text-lg font-semibold text-green-600">
              {discountPercent}%{/* computed discount */}
            </Text>
          </View>

          {/* Cart-only metadata */}
          {variant === "cart" && (
            <>
              <View className="flex-row items-center mt-2">
                <View className="flex-row items-center">
                  {[...Array(starCounts.full)].map((_, i) => (
                    <Ionicons
                      key={`f-${i}`}
                      name="star"
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                  {starCounts.half === 1 && (
                    <Ionicons name="star-half" size={14} color="#FFD700" />
                  )}
                  {[...Array(starCounts.empty)].map((_, i) => (
                    <Ionicons
                      key={`e-${i}`}
                      name="star-outline"
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                </View>
                <Text className="ml-1 text-sm text-gray-600">
                  {`${starCounts.normalized.toFixed(1)} (${reviews.toLocaleString()} reviews)`}
                </Text>
              </View>

              {/* QuantitySelector inside details */}
              <View className="mt-2">
                <QuantitySelector
                  quantity={quantity}
                  onIncrement={onIncrement ?? (() => {})}
                  onDecrement={onDecrement ?? (() => {})}
                  onRemove={onRemove}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Wishlist actions row (below top row) */}
      {variant === "wishlist" && (
        <View className="px-3 pb-4">
          <View className="w-[90%] self-center flex-row items-center justify-between">
            <TouchableOpacity
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove from collection"
              className="basis-[55%] flex-row items-center justify-center bg-[#FFEFEF] rounded-2xl px-4 py-3">
              <Ionicons name="trash-outline" size={18} color="#FF0000" />
              <Text className="ml-3 text-red-500 font-medium text-sm">
                Remove from Collection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAddToCart}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
              className="basis-[35%] flex-row items-center justify-center bg-[#26FF91] rounded-2xl px-3 py-3">
              <Ionicons name="cart-outline" size={18} color="#000" />
              <Text className="ml-3 text-black font-semibold text-sm">
                Add to cart
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});
/* ------------------ PriceDetails ------------------ */
export function PriceDetails({
  itemsCount,
  subtotal,
  discount = 0,
  tax = 0,
}: {
  itemsCount: number;
  subtotal: number;
  discount?: number;
  tax?: number;
}) {
  // local INR helper here too for footer (kept local per your request)
  const INR2 = (n?: number | null) => {
    const num = typeof n === "number" ? Math.round(n) : Number(n ?? 0);
    if (!isFinite(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const total = subtotal - discount + tax;

  function Row({
    label,
    value,
    labelClass = "",
    valueClass = "",
  }: {
    label: string;
    value: string;
    labelClass?: string;
    valueClass?: string;
  }) {
    return (
      <View className="flex-row justify-between items-center">
        <Text className={`text-sm text-black ${labelClass}`}>{label}</Text>
        <Text className={`text-sm font-semibold text-black ${valueClass}`}>
          {value}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4">
      <Text className="text-lg font-semibold">Price Details</Text>

      <View className="mt-3 space-y-3">
        <Row label={`Price (${itemsCount} item)`} value={INR2(subtotal)} />
        <Row
          label="Discount"
          value={`- ${INR2(discount)}`}
          valueClass="text-green-600 font-bold"
        />
        <Row label="Tax Included" value={INR2(tax)} />
      </View>

      <View className="mt-4 border-t border-black/10 pt-3">
        <Row
          label="Total"
          value={INR2(total)}
          labelClass="text-lg font-bold"
          valueClass="text-lg font-bold"
        />
      </View>
    </View>
  );
}
