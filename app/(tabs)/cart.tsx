// app/cart.tsx
import {
  CART_DATA as CART_DATA_CONST,
  CartItemT,
  WISHLIST_DATA as WISHLIST_DATA_CONST,
  WishlistItemT,
} from "@/constants/cart";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddressCard from "@/components/cart/AddressCard";
import ProductRow, { PriceDetails } from "@/components/cart/ProductRow";

/* ------------------------------------------------------------------ */
/* Local INR formatter (Indian grouping). Kept here per your request. */
/* ------------------------------------------------------------------ */
const fmtINR = (n?: number | null) => {
  const num = typeof n === "number" ? n : Number(n ?? 0);
  if (!isFinite(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
};

type CartItemWithQty = CartItemT & { quantity: number };

function subtotalFromCart(cart: CartItemWithQty[]) {
  return cart.reduce((s, it) => s + it.price * (it.quantity ?? 1), 0);
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

/* ------------------------------------------------------------------ */

const TAB_BAR_HEIGHT = 64;

export default function CartAndWishlistScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"cart" | "wishlist">("cart");

  const [cartData, setCartData] = useState<CartItemWithQty[]>(() =>
    CART_DATA_CONST.map((c) => ({
      ...(c as CartItemT),
      quantity: (c as any).quantity ?? 1,
    }))
  );
  const [wishlistData, setWishlistData] = useState<WishlistItemT[]>(() => [
    ...WISHLIST_DATA_CONST,
  ]);

  const footerPadding = useMemo(
    () => (insets.bottom || 0) + TAB_BAR_HEIGHT + 70,
    [insets.bottom]
  );

  // Derived values
  const subtotal = useMemo(() => subtotalFromCart(cartData), [cartData]);
  const itemsCount = useMemo(
    () => cartData.reduce((s, it) => s + it.quantity, 0),
    [cartData]
  );
  const discount = 9999;
  const tax = 1000;
  const total = subtotal - discount + tax;
  const totalStr = useMemo(() => fmtINR(total), [total]);

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

  /* ----------------- Memoized styles/components ----------------- */

  const cartContentContainerStyle = useMemo(
    () => ({ paddingBottom: footerPadding, paddingTop: 12 }),
    [footerPadding]
  );

  const wishlistContentContainerStyle = useMemo(
    () => ({ paddingBottom: (insets.bottom || 0) + 70, paddingTop: 12 }),
    [insets.bottom]
  );

  const CartListHeader = useMemo(
    () => () => (
      <View className="mt-3">
        <AddressCard />
      </View>
    ),
    []
  );

  const CartListFooter = useMemo(
    () => () => (
      <View className="mt-4">
        <PriceDetails
          itemsCount={itemsCount}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
        />
      </View>
    ),
    [itemsCount, subtotal, discount, tax]
  );

  // Only use getItemLayout if rows are stable height
  const useFixedRowHeight = false;
  const ITEM_HEIGHT = 160;
  const getItemLayout = useMemo(
    () =>
      useFixedRowHeight
        ? (_data: any, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })
        : undefined,
    [useFixedRowHeight]
  );

  const removeClippedSubviewsForPlatform = Platform.OS === "android";

  /* ----------------- UI ----------------- */

  return (
    <View className="flex-1 bg-gray-100 pt-safe">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header + tabs */}
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
            getItemLayout={getItemLayout}
            ListHeaderComponent={CartListHeader}
            ListFooterComponent={CartListFooter}
            contentContainerStyle={cartContentContainerStyle}
            initialNumToRender={5}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={removeClippedSubviewsForPlatform}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
          />
        ) : (
          <FlatList
            data={wishlistData}
            keyExtractor={(i) => i.id}
            renderItem={renderWishlistItem}
            contentContainerStyle={wishlistContentContainerStyle}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={removeClippedSubviewsForPlatform}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            ListEmptyComponent={<View />}
          />
        )}
      </View>

      {/* Continue bar */}
      {tab === "cart" && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: (insets.bottom || 0) + TAB_BAR_HEIGHT - 8,
            zIndex: 30,
            paddingHorizontal: 16,
          }}>
          <View className="bg-white rounded-xl px-4 py-3 flex-row justify-between items-center shadow-md">
            {/* Left: total */}
            <View>
              <Text className="text-xl font-semibold">{totalStr}</Text>
              <Text className="text-xs text-gray-400 line-through">
                ₹2,00,00
              </Text>
            </View>

            {/* Buy Now */}
            <TouchableOpacity
              onPress={() => {
                /* continue action */
              }}
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
