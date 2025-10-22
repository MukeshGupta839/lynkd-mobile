// components/cart/ProductRow.tsx
import QuantitySelector from "@/components/cart/QuantitySelector";
import { CartItemT, WishlistItemT } from "@/constants/cart";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type CartRowItem = CartItemT & {
  quantity?: number;
  rating?: number;
  reviews?: number;
};
type WishlistRowItem = WishlistItemT & {
  rating?: number;
  reviews?: number;
};

type Props = {
  item?: CartRowItem | WishlistRowItem | null;
  variant: "cart" | "wishlist";
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
  onAddToCart?: () => void;
  onPress?: () => void;
};

/* Format INR without decimals for product prices */
const INR = (n?: number | null) => {
  const num = typeof n === "number" ? n : Number(n ?? 0);
  if (!isFinite(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
};

/* Format INR with decimals for totals */
const INR_DECIMAL = (n?: number | null) => {
  const num = typeof n === "number" ? n : Number(n ?? 0);
  if (!isFinite(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

function ProductRowImpl({
  item,
  variant,
  onIncrement,
  onDecrement,
  onRemove,
  onAddToCart,
}: Props) {
  const hasItem = !!item;

  useEffect(() => {
    if (!hasItem) console.warn("ProductRow: missing item", { variant });
  }, [hasItem, variant]);

  // ✅ Safe defaults so hooks below are unconditional
  const name = item?.name ?? "";
  const price = Number(item?.price ?? 0);
  const mrp = Number((item as any)?.mrp ?? 0);
  const image = item?.image;
  const quantity = Number((item as any)?.quantity ?? 1);
  const reviews = Number((item as any)?.reviews ?? 0);
  const rating =
    typeof (item as any)?.rating === "number" ? (item as any).rating : 4.5;

  /**
   * Logic:
   * - If mrp > price => treat as original price.
   * - Else if mrp < price => treat as discount amount.
   * - Only show % if > 5%.
   */
  const { originalPrice, discountPercent, showDiscount } = useMemo(() => {
    let original = price;

    if (mrp > price) {
      original = mrp;
    } else if (mrp > 0 && mrp < price) {
      original = price + mrp;
    }

    const percent = original > 0 ? ((original - price) / original) * 100 : 0;
    const show = percent > 5;

    return {
      originalPrice: original,
      discountPercent: percent.toFixed(1), // 1 decimal point
      showDiscount: show,
    };
  }, [price, mrp]);

  // Rating stars
  const starCounts = useMemo(() => {
    const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(normalized);
    const half = normalized - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return { full, half, empty, normalized };
  }, [rating]);

  const contentWrapClass = "w-[90%] self-center p-2";
  const imageBasisClass = variant === "cart" ? "basis-[33%]" : "basis-[16%]";
  const imageAspectClass =
    variant === "cart" ? "aspect-[0.92]" : "aspect-[0.78]";

  // 🧱 If item is missing, render nothing (after hooks ran) to keep hook order stable
  if (!hasItem) {
    return null;
  }

  return (
    <View className="w-full bg-white rounded-2xl mt-3 overflow-hidden">
      <View className={`flex-row items-center ${contentWrapClass}`}>
        {/* Product Image */}
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

        <View className="w-4" />

        {/* Product Info */}
        <View className="basis-[65%]">
          <Text
            className="text-base font-semibold text-black"
            numberOfLines={2}
            ellipsizeMode="tail">
            {name}
          </Text>

          {/* Pricing */}
          <View className="flex-row items-center flex-wrap">
            <Text className="text-lg font-bold mr-2">{INR(price)}</Text>

            {originalPrice > price && (
              <Text className="text-xs line-through text-gray-400 mr-2">
                {INR(originalPrice)}
              </Text>
            )}

            {showDiscount && (
              <Text className="text-lg font-semibold text-green-600">
                {discountPercent}% off
              </Text>
            )}
          </View>

          {/* Cart Details */}
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

              <View className="mt-2">
                <QuantitySelector
                  quantity={quantity}
                  onIncrement={onIncrement ?? (() => {})}
                  onDecrement={onDecrement ?? (() => {})}
                  onRemove={onRemove ?? (() => {})}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Wishlist Buttons */}
      {variant === "wishlist" && (
        <View className="px-3 pb-4">
          <View className="w-[90%] self-center flex-row items-center justify-between">
            <TouchableOpacity
              onPress={onRemove}
              className="basis-[55%] flex-row items-center justify-center bg-[#FFEFEF] rounded-2xl px-4 py-3">
              <Ionicons name="trash-outline" size={18} color="#FF0000" />
              <Text className="ml-3 text-red-500 font-medium text-sm">
                Remove from Collection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAddToCart}
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
}

const ProductRow = React.memo(ProductRowImpl);
ProductRow.displayName = "ProductRow";
export default ProductRow;

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
  const total = subtotal - discount + tax;

  const Row = ({
    label,
    value,
    labelClass = "",
    valueClass = "",
  }: {
    label: string;
    value: string;
    labelClass?: string;
    valueClass?: string;
  }) => (
    <View className="flex-row justify-between items-center">
      <Text className={`text-sm text-black ${labelClass}`}>{label}</Text>
      <Text className={`text-sm font-semibold text-black ${valueClass}`}>
        {value}
      </Text>
    </View>
  );

  return (
    <View className="bg-white rounded-2xl p-4 mt-3">
      <Text className="text-lg font-semibold">Price Details</Text>

      <View className="mt-3 space-y-3">
        <Row
          label={`Price (${itemsCount} item)`}
          value={INR_DECIMAL(subtotal)}
        />
        <Row
          label="Discount"
          value={`- ${INR_DECIMAL(discount)}`}
          valueClass="text-green-600 font-bold"
        />
        <Row label="Tax Included" value={INR_DECIMAL(tax)} />
      </View>

      <View className="mt-4 border-t border-black/10 pt-3">
        <Row
          label="Total"
          value={INR_DECIMAL(total)}
          labelClass="text-lg font-bold"
          valueClass="text-lg font-bold"
        />
      </View>
    </View>
  );
}
