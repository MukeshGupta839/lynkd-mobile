// app/cart.tsx
import AddressCard from "@/components/cart/AddressCard";
import ProductRow, { PriceDetails } from "@/components/cart/ProductRow";
import {
  CART_DATA as CART_DATA_CONST,
  CartItemT,
  WISHLIST_DATA as WISHLIST_DATA_CONST,
  WishlistItemT,
} from "@/constants/cart";
import { StatusBar } from "expo-status-bar";
import { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ------------------------------------------------------------------ */
/* INR formatters */
/* ------------------------------------------------------------------ */

// For normal (non-decimal) numbers — used everywhere except total
const fmtINR = (n?: number | null) => {
  const num = typeof n === "number" ? n : Number(n ?? 0);
  if (!isFinite(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
};

// For totalStr — only final total shows decimals
const fmtINRDecimal = (n?: number | null) => {
  const num = typeof n === "number" ? n : Number(n ?? 0);
  if (!isFinite(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

type CartItemWithQty = CartItemT & { quantity: number };

function subtotalFromCart(cart: CartItemWithQty[]) {
  return cart.reduce((s, it) => s + it.price * (it.quantity ?? 1), 0);
}

function totalMRPFromCart(cart: CartItemWithQty[]) {
  return cart.reduce((s, it) => {
    const price = Number(it.price ?? 0);
    const mrp = Number(it.mrp ?? 0);
    let original = price;
    if (mrp > price)
      original = mrp; // mrp is original price
    else if (mrp > 0 && mrp < price) original = price + mrp; // mrp is discount amount
    return s + original * (it.quantity ?? 1);
  }, 0);
}

function mapWishlistToCartItem(w: WishlistItemT): CartItemWithQty {
  return {
    id: w.id,
    name: w.name,
    price: w.price,
    mrp: (w as any).mrp ?? w.price,
    image: w.image,
    reviews: (w as any).reviews ?? 0,
    quantity: 1,
  } as CartItemWithQty;
}

const TAB_BAR_HEIGHT = 45;
const TAX_RATE = 0.18; // 18% GST placeholder

/* ------------------------------------------------------------------ */
/* Named memoized components (with displayName)                       */
/* ------------------------------------------------------------------ */

const CartListHeader = memo(function CartListHeader() {
  return <AddressCard />;
});
CartListHeader.displayName = "CartListHeader";

type CartListFooterProps = {
  itemsCount: number;
  subtotal: number;
  discount: number;
  tax: number;
};

const CartListFooter = memo(function CartListFooter({
  itemsCount,
  subtotal,
  discount,
  tax,
}: CartListFooterProps) {
  return (
    <View className="mt-4">
      <PriceDetails
        itemsCount={itemsCount}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
      />
    </View>
  );
});
CartListFooter.displayName = "CartListFooter";

/* ------------------------------------------------------------------ */

export default function CartAndWishlistScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"cart" | "wishlist">("cart");

  const [cartData, setCartData] = useState<CartItemWithQty[]>(() =>
    CART_DATA_CONST.map((c) => ({
      ...(c as CartItemT),
      quantity: (c as any).quantity ?? 1,
    }))
  );
  const [wishlistData, setWishlistData] = useState<WishlistItemT[]>([
    ...WISHLIST_DATA_CONST,
  ]);

  const footerPadding = useMemo(
    () => (insets.bottom || 0) + TAB_BAR_HEIGHT + 10,
    [insets.bottom]
  );

  /* ----------------- Derived Values ----------------- */

  const subtotal = useMemo(() => subtotalFromCart(cartData), [cartData]);
  const totalMRP = useMemo(() => totalMRPFromCart(cartData), [cartData]);
  const discount = useMemo(
    () => Math.max(0, totalMRP - subtotal),
    [totalMRP, subtotal]
  );
  const tax = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const total = useMemo(
    () => subtotal - discount + tax,
    [subtotal, discount, tax]
  );

  // Format totals for display
  const totalStr = useMemo(() => fmtINRDecimal(total), [total]); // show decimals
  const originalStr = useMemo(() => fmtINR(totalMRP + tax), [totalMRP, tax]); // full original before discount
  const itemsCount = useMemo(
    () => cartData.reduce((s, it) => s + it.quantity, 0),
    [cartData]
  );

  /* ----------------- Handlers ----------------- */

  const increment = useCallback((id: string) => {
    setCartData((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, quantity: it.quantity + 1 } : it
      )
    );
  }, []);

  const decrement = useCallback((id: string) => {
    setCartData((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCartData((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlistData((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const moveWishlistToCart = useCallback((id: string) => {
    setWishlistData((prevWishlist) => {
      const found = prevWishlist.find((w) => w.id === id);
      const newWishlist = prevWishlist.filter((w) => w.id !== id);
      if (found) {
        const newCartItem = mapWishlistToCartItem(found);
        setCartData((prevCart) => [newCartItem, ...prevCart]);
      }
      return newWishlist;
    });
  }, []);

  /* ----------------- Renderers ----------------- */

  const renderCartItem = useCallback(
    ({ item }: ListRenderItemInfo<CartItemWithQty>) => (
      <ProductRow
        item={item}
        variant="cart"
        onIncrement={() => increment(item.id)}
        onDecrement={() => decrement(item.id)}
        onRemove={() => removeItem(item.id)}
      />
    ),
    [increment, decrement, removeItem]
  );

  const renderWishlistItem = useCallback(
    ({ item }: ListRenderItemInfo<WishlistItemT>) => (
      <ProductRow
        item={item}
        variant="wishlist"
        onRemove={() => removeFromWishlist(item.id)}
        onAddToCart={() => moveWishlistToCart(item.id)}
      />
    ),
    [removeFromWishlist, moveWishlistToCart]
  );

  const cartContentContainerStyle = useMemo(
    () => ({ paddingBottom: footerPadding, paddingTop: 12 }),
    [footerPadding]
  );

  const wishlistContentContainerStyle = useMemo(
    () => ({ paddingBottom: (insets.bottom || 0) + 70, paddingTop: 12 }),
    [insets.bottom]
  );

  const removeClippedSubviewsForPlatform = Platform.OS === "android";

  /* ----------------- UI ----------------- */

  return (
    <View className="flex-1 bg-gray-100 pt-safe">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header Tabs */}
      <View className="w-full bg-white rounded-b-xl">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setTab("cart")}
            className="flex-1 py-5 items-center justify-center border-black/10">
            <Text
              className={`text-base font-semibold ${
                tab === "cart" ? "text-black" : "text-gray-400"
              }`}>
              My Cart
            </Text>
          </TouchableOpacity>
          <View className="w-px bg-black/10 self-stretch" />
          <TouchableOpacity
            onPress={() => setTab("wishlist")}
            className="flex-1 py-5 items-center justify-center">
            <Text
              className={`text-base font-semibold ${
                tab === "wishlist" ? "text-black" : "text-gray-400"
              }`}>
              Wishlist
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lists */}
      <View className="flex-1 px-3">
        {tab === "cart" ? (
          <FlatList
            data={cartData}
            keyExtractor={(i) => i.id}
            renderItem={renderCartItem}
            ListHeaderComponent={CartListHeader}
            ListFooterComponent={
              <CartListFooter
                itemsCount={itemsCount}
                subtotal={subtotal}
                discount={discount}
                tax={tax}
              />
            }
            contentContainerStyle={cartContentContainerStyle}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={removeClippedSubviewsForPlatform}
          />
        ) : (
          <FlatList
            data={wishlistData}
            keyExtractor={(i) => i.id}
            renderItem={renderWishlistItem}
            contentContainerStyle={wishlistContentContainerStyle}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={removeClippedSubviewsForPlatform}
          />
        )}
      </View>

      {/* Sticky bottom total */}
      {tab === "cart" && (
        <View
          style={{
            left: 0,
            right: 0,
            bottom: (insets.bottom || 0) + TAB_BAR_HEIGHT,
            zIndex: 30,
          }}>
          <View className="bg-white rounded-xl px-3 py-3 flex-row justify-between items-center">
            <View>
              {/* Final total (decimal) */}
              <Text className="text-xl font-semibold">{totalStr}</Text>
              {/* Original total before discount (no decimals) */}
              <Text className="text-xs text-gray-400 line-through">
                {originalStr}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.9}
              className="items-center justify-center bg-[#26FF91] rounded-xl px-14 py-4 shadow-sm">
              <Text className="text-base font-semibold">Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
