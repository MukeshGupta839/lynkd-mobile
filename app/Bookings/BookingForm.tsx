// app/book/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNavBar from "@/components/Bookings/BottomBar";
import Header from "@/components/Bookings/Header";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

type TicketType = {
  id: string;
  label: string;
  price: string;
  fee?: string;
  subtitle?: string;
  available?: number;
  soldOut?: boolean;
};

type Offer = {
  id: string;
  code: string;
  label: string;
  kind: "percent" | "fixed";
  value: number;
  minQty?: number;
};

const COLORS = {
  primary: "#7C3AED",
  primaryDark: "#6B21A8",
  primaryLight: "#F5F3FF",
  border: "#E6E6EA",
  text: "#111827",
  muted: "#6B7280",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

const SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  accent: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
};

export default function BookTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params?.id ?? "";
  const { width: screenWidth } = useWindowDimensions();

  // responsive sizes
  const thumbW = Math.round(screenWidth * 0.15);
  const thumbH = Math.round(screenWidth * 0.11);

  // responsive offer card width:
  const offerCardWidth = Math.max(
    140,
    Math.min(200, Math.floor(screenWidth * 0.45))
  );

  // find event
  const event = useMemo<EventT | undefined>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS].find((e) => e.id === id);
  }, [id]);

  // 🔁 redirect via effect; do NOT early-return before hooks
  useEffect(() => {
    if (!event) router.replace("/bookings");
  }, [event, router]);

  // ticket types (sample)
  const ticketTypes: TicketType[] = useMemo(
    () => [
      {
        id: "t1",
        label: "Pre Sale I",
        price: "$25.00",
        fee: "+ $1.50 Fee",
        subtitle: "Sold Out",
        soldOut: true,
        available: 0,
      },
      {
        id: "t2",
        label: "Pre Sale II",
        price: "$50.00",
        fee: "+ $1.50 Fee",
        subtitle: "542 Ticket Available",
        available: 542,
      },
      {
        id: "t3",
        label: "Normal Ticket",
        price: "$125.00",
        fee: "+ $1.50 Fee",
        subtitle: "1000 Ticket Available",
        available: 1000,
      },
    ],
    []
  );

  // sample offers
  const offers: Offer[] = useMemo(
    () => [
      {
        id: "o1",
        code: "SAVE10",
        label: "10% off",
        kind: "percent",
        value: 10,
      },
      {
        id: "o2",
        code: "NEWOFFER",
        label: "50% off",
        kind: "fixed",
        value: 5.0,
        minQty: 1,
      },
    ],
    []
  );

  const [qty, setQty] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<string>(ticketTypes[1].id);
  const [appliedOfferId, setAppliedOfferId] = useState<string | null>(null);

  // coupon input state & message
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  // safe derived fields for unconditional hooks/JSX
  const title = event?.title ?? "";
  const image = event?.image;
  const dateLabel = event?.dateLabel ?? "";
  const location = event?.location ?? "";

  // utilities
  const parsePrice = useCallback((priceStr: string) => {
    const num = Number(priceStr.replace(/[^0-9.]/g, ""));
    return Number.isNaN(num) ? 0 : num;
  }, []);

  const formatPrice = useCallback((n: number) => `$${n.toFixed(2)}`, []);

  const getOfferById = useCallback(
    (offerId?: string) => offers.find((o) => o.id === offerId) ?? null,
    [offers]
  );

  const computeDiscountedPrice = useCallback(
    (basePriceStr: string) => {
      const base = parsePrice(basePriceStr);
      const offer = getOfferById(appliedOfferId ?? undefined);
      if (!offer) return formatPrice(base);
      if (offer.minQty && qty < offer.minQty) return formatPrice(base);

      if (offer.kind === "percent") {
        const discounted = base * (1 - offer.value / 100);
        return formatPrice(Math.max(0, discounted));
      } else {
        const discounted = base - offer.value;
        return formatPrice(Math.max(0, discounted));
      }
    },
    [appliedOfferId, getOfferById, parsePrice, formatPrice, qty]
  );

  // handlers
  const increaseQty = useCallback(() => {
    setQty((q) => Math.min(10, q + 1));
    setCouponMsg(null);
  }, []);

  const decreaseQty = useCallback(() => {
    setQty((q) => Math.max(1, q - 1));
    setCouponMsg(null);
  }, []);

  const handleSelectType = useCallback((typeId: string, soldOut?: boolean) => {
    if (!soldOut) {
      setSelectedType(typeId);
      setCouponMsg(null);
    }
  }, []);

  const handleApplyOffer = useCallback((offerId: string) => {
    setAppliedOfferId((prev) => (prev === offerId ? null : offerId));
    setCouponMsg(null);
  }, []);

  const handleApplyCouponInput = useCallback(() => {
    setCouponMsg(null);
    const code = couponInput.trim().toUpperCase();
    const found = code
      ? offers.find((o) => o.code.toUpperCase() === code)
      : null;
    if (!code) return setCouponMsg("Enter a coupon code");
    if (!found) return setCouponMsg("Coupon not found");
    setAppliedOfferId(found.id);
    setCouponMsg(`Applied ${found.code}`);
  }, [couponInput, offers]);

  const onContinue = useCallback(() => {
    router.push({
      pathname: "/Bookings/Details",
      params: {
        id,
        qty: String(qty),
        type: selectedType,
        offer: appliedOfferId ?? "",
      },
    });
  }, [id, qty, selectedType, appliedOfferId, router]);

  // renderers
  const renderTicketType = useCallback(
    ({ item }: ListRenderItemInfo<TicketType>) => {
      const isSelected = selectedType === item.id;
      const discountedPrice = computeDiscountedPrice(item.price);
      const basePriceNum = parsePrice(item.price);
      const discountedNum = parsePrice(discountedPrice);

      return (
        <TouchableOpacity
          activeOpacity={0.95}
          disabled={item.soldOut}
          onPress={() => handleSelectType(item.id, item.soldOut)}
          accessibilityRole="button"
          accessibilityState={{
            disabled: !!item.soldOut,
            selected: isSelected,
          }}
          accessibilityLabel={`Select ${item.label}`}
          className="mb-3 rounded-xl overflow-hidden">
          <View
            className="flex-row items-center px-3 py-3 bg-white rounded-xl"
            style={{
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? COLORS.primary : COLORS.border,
              opacity: item.soldOut ? 0.45 : 1,
              ...SHADOW.card,
            }}>
            <View
              className="w-12 h-12 rounded-lg items-center justify-center"
              style={{ backgroundColor: COLORS.primaryLight }}>
              <Ionicons name="ticket" size={20} color={COLORS.primary} />
            </View>

            <View className="ml-3 flex-1">
              <Text
                className="font-semibold text-base"
                style={{ color: COLORS.text }}>
                {item.label}
              </Text>

              <View className="flex-row items-center mt-1">
                {discountedNum < basePriceNum ? (
                  <>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: COLORS.primaryDark }}>
                      {discountedPrice}
                    </Text>
                    <Text
                      className="text-sm text-gray-400 ml-2"
                      style={{ textDecorationLine: "line-through" }}>
                      {item.price}
                    </Text>
                  </>
                ) : (
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: COLORS.primaryDark }}>
                    {item.price}
                  </Text>
                )}
                {item.fee ? (
                  <Text className="text-sm text-gray-400 ml-2">{item.fee}</Text>
                ) : null}
              </View>

              <Text className="text-sm text-gray-400 mt-1">
                {item.soldOut ? "Sold Out" : item.subtitle}
              </Text>
            </View>

            <View className="ml-2">
              {isSelected ? (
                <View
                  style={SHADOW.accent}
                  className="w-8 h-8 rounded-full items-center justify-center">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: COLORS.primary }}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                </View>
              ) : (
                <View className="w-6 h-6 rounded-full border border-gray-300 bg-white" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectType, selectedType, computeDiscountedPrice, parsePrice]
  );

  const renderOfferItem = useCallback(
    ({ item }: ListRenderItemInfo<Offer>) => {
      const isApplied = appliedOfferId === item.id;
      return (
        <View style={{ width: offerCardWidth }} className="mr-3">
          <View
            className="rounded-xl p-3"
            style={{
              backgroundColor: COLORS.white,
              borderWidth: isApplied ? 1.5 : 1,
              borderColor: isApplied ? COLORS.primary : COLORS.border,
              ...SHADOW.card,
            }}>
            <Text className="font-semibold" style={{ color: COLORS.text }}>
              {item.code}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">{item.label}</Text>

            <View className="mt-3 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => handleApplyOffer(item.id)}
                activeOpacity={0.85}
                accessibilityLabel={
                  isApplied
                    ? `Remove offer ${item.code}`
                    : `Apply offer ${item.code}`
                }
                className="px-3 py-1 rounded-md"
                style={{
                  backgroundColor: isApplied ? COLORS.primary : "#F3F4F6",
                }}>
                <Text
                  style={{
                    color: isApplied ? COLORS.white : COLORS.text,
                    fontSize: 13,
                  }}>
                  {isApplied ? "Applied" : "Apply"}
                </Text>
              </TouchableOpacity>

              <Text className="text-sm text-gray-400">
                {item.minQty ? `Min: ${item.minQty}` : ""}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [appliedOfferId, handleApplyOffer, offerCardWidth]
  );

  // small helper for fixed format (kept outside hooks intentionally)

  // Render a minimal shell while redirecting to keep hooks order stable
  if (!event) {
    return <SafeAreaView edges={[]} className="flex-1 bg-gray-50" />;
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <Header title="Booking Ticket" />

      {/* Event summary */}
      <View className="mx-3 mt-3 bg-white rounded-xl p-4" style={SHADOW.card}>
        <View className="flex-row items-center">
          <View
            className="rounded-lg overflow-hidden"
            style={{ width: thumbW, height: thumbH }}>
            {image ? (
              <Image
                source={image}
                className="w-full h-full"
                resizeMode="cover"
                accessibilityLabel={`${title} banner`}
              />
            ) : null}
          </View>

          <View className="ml-3 flex-1">
            <Text className="font-semibold text-base text-[#111827]">
              {title}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">{dateLabel}</Text>
            <Text className="text-sm text-gray-400">{location}</Text>
          </View>
        </View>

        <View className="my-4 border-t border-gray-100" />

        {/* Number of tickets */}
        <Text className="text-sm text-gray-600 mb-2">Number of tickets</Text>

        <View className="flex-row items-center">
          <View className="flex-1">
            <View
              className="flex-row items-center justify-between rounded-xl px-3 py-2"
              style={{
                borderWidth: 1.2,
                borderColor: "#E6E0F8",
                backgroundColor: "#fff",
              }}>
              <View className="flex-row items-center">
                <View
                  className="w-9 h-9 rounded-md items-center justify-center mr-3"
                  style={{ backgroundColor: "#F5F3FF" }}>
                  <Ionicons name="person" size={16} color={COLORS.primary} />
                </View>
                <Text className="text-base font-medium text-[#111827]">
                  {qty}
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={decreaseQty}
                  activeOpacity={0.7}
                  accessibilityLabel="Decrease ticket quantity"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="p-2">
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={increaseQty}
                  activeOpacity={0.7}
                  accessibilityLabel="Increase ticket quantity"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="p-2">
                  <Ionicons name="chevron-up" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Offers compact row */}
      <View className="px-3 mt-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-[#111827]">Offers</Text>
          <TouchableOpacity
            onPress={() => {
              setAppliedOfferId(null);
              setCouponInput("");
              setCouponMsg(null);
            }}
            accessibilityLabel="Clear offers">
            <Text className="text-sm text-gray-400">Clear</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={offers}
          keyExtractor={(o) => o.id}
          renderItem={renderOfferItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />

        {/* Apply coupon input (compact) */}
        <View className="mt-3 flex-row items-center">
          <View className="flex-1">
            <TextInput
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder="Enter coupon code"
              accessibilityLabel="Coupon code input"
              style={{
                backgroundColor: "#fff",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
            {couponMsg ? (
              <Text className="text-sm text-red-500 mt-2">{couponMsg}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleApplyCouponInput}
            activeOpacity={0.85}
            accessibilityLabel="Apply coupon code"
            className="ml-3 px-4 py-2 rounded-lg items-center justify-center"
            style={{ backgroundColor: COLORS.primary }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ticket types list */}
      <View className="px-3 mt-5 flex-1">
        <Text className="text-sm font-semibold text-[#111827] mb-3">
          Ticket Type:
        </Text>

        <FlatList
          data={ticketTypes}
          keyExtractor={(t) => t.id}
          renderItem={renderTicketType}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      </View>

      {/* Bottom Continue bar */}
      <BottomNavBar
        variant="buttonOnly"
        ctaLabel="Continue"
        onCTAPress={onContinue}
      />
    </SafeAreaView>
  );
}
