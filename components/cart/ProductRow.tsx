// components/cart/ProductRow.tsx
import QuantitySelector from "@/components/cart/QuantitySelector";
import { CartItemT, WishlistItemT } from "@/constants/cart";
import { Ionicons } from "@expo/vector-icons";
import { Truck } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type CartRowItem = CartItemT & { quantity?: number };
type WishlistRowItem = WishlistItemT;

type Props = {
  item: CartRowItem | WishlistRowItem;
  variant: "cart" | "wishlist";
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove: () => void;
  onAddToCart?: () => void;
  onPress?: () => void;
};

/* local INR helper (kept inside file as requested) */
const INR = (n?: number | null) => {
  const num = typeof n === "number" ? n : Number(n ?? 0);
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
  const quantity = (item as any).quantity ?? 1;
  const reviews = (item as any).reviews ?? 0;

  // Variant-specific classes
  const contentWrapClass =
    variant === "cart" ? "w-[90%] self-center p-2" : "w-[90%] self-center p-2";
  const imageBasisClass = variant === "cart" ? "basis-[33%]" : "basis-[16%]";
  const imageAspectClass =
    variant === "cart" ? "aspect-[0.9]" : "aspect-[0.78]";

  return (
    <View className="w-full bg-white rounded-2xl mt-3 overflow-hidden">
      {/* TOP ROW */}
      <View className={`flex-row items-center ${contentWrapClass}`}>
        {/* Image column */}
        <View
          className={`${imageBasisClass} rounded-xl overflow-hidden bg-gray-50`}>
          <View className={`w-full ${imageAspectClass}`}>
            <Image
              source={(item as any).image}
              className="w-full h-full"
              resizeMode="contain"
            />
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
            {(item as any).name}
          </Text>

          {/* Price row */}
          <View className="flex-row items-center">
            <Text className="text-lg font-bold mr-2">
              {INR((item as any).price)}
            </Text>
            <Text className="text-xs line-through text-gray-400 mr-2">
              {INR((item as any).mrp ?? (item as any).price)}
            </Text>
            <Text className="text-xs font-semibold text-green-600">50%</Text>
          </View>

          {/* Cart-only metadata */}
          {variant === "cart" && (
            <>
              <View className="flex-row items-center ">
                {/* stars: render according to reviews if you have rating value; static fallback */}
                {[...Array(4)].map((_, i) => (
                  <Ionicons key={i} name="star" size={14} color="#FFD700" />
                ))}
                <Ionicons name="star-half" size={14} color="#FFD700" />
                <Text className="ml-1 text-sm text-gray-600">{`${4.5} (${reviews.toLocaleString()} reviews)`}</Text>
              </View>

              <View className="mt-2 flex-row items-center bg-[#26FF91] px-2 py-0.5 rounded-full self-start">
                <Truck size={14} color="#000" />
                <Text className="ml-1 text-black text-xs">Super Fast</Text>
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
        <View className="px-4 pb-4">
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
              className="basis-[35%] flex-row items-center justify-center bg-[#26FF91] rounded-2xl px-4 py-3">
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
  const INR = (n?: number | null) => {
    const num = typeof n === "number" ? n : Number(n ?? 0);
    if (!isFinite(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const total = subtotal - discount + tax;

  function Row({
    label,
    value,
    labelClass,
    valueClass,
  }: {
    label: string;
    value: string;
    labelClass?: any;
    valueClass?: any;
  }) {
    return (
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-black" style={labelClass}>
          {label}
        </Text>
        <Text className="text-sm font-semibold text-black" style={valueClass}>
          {value}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4">
      <Text className="text-lg font-semibold">Price Details</Text>

      <View className="mt-3 space-y-3">
        <Row label={`Price (${itemsCount} item)`} value={INR(subtotal)} />
        <Row
          label="Discount"
          value={`- ${INR(discount)}`}
          valueClass={{ color: "#059669", fontWeight: "700" }}
        />
        <Row label="Tax Included" value={INR(tax)} />
      </View>

      <View className="mt-4 border-t border-black/10 pt-3">
        <Row
          label="Total"
          value={INR(total)}
          labelClass={{ fontSize: 18, fontWeight: "700" }}
          valueClass={{ fontSize: 18, fontWeight: "700" }}
        />
      </View>
    </View>
  );
}
