// app/book/Details.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import BottomNavBar from "@/components/Bookings/BottomBar";
import Header from "@/components/Bookings/Header";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

export default function Details() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    qty?: string;
    type?: string;
  }>();
  const id = params?.id ?? "";
  const qty = Math.max(1, Number(params?.qty ?? "1"));
  const selectedType = params?.type ?? "";

  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const heroHeight = Math.round(screenWidth * 0.4);

  // find event
  const event = useMemo<EventT | undefined>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS].find((e) => e.id === id);
  }, [id]);

  // ✅ redirect without breaking hooks order
  useEffect(() => {
    if (!event) router.replace("/Bookings/BookingForm");
  }, [event, router]);

  // ticket types and pricing (unconditional hooks)
  const ticketTypes = useMemo(
    () =>
      ({
        t1: { label: "Pre Sale I", price: 25.0 },
        t2: { label: "Pre Sale II", price: 50.0 },
        t3: { label: "Normal Ticket", price: 125.0 },
      }) as Record<string, { label: string; price: number }>,
    []
  );

  const ticket = useMemo(
    () => ticketTypes[selectedType] ?? ticketTypes.t2,
    [selectedType, ticketTypes]
  );

  const FEE_PER_TICKET = 1.5;
  const TAX_RATE = 0.04;

  const subtotal = useMemo(() => ticket.price * qty, [ticket.price, qty]);
  const fees = useMemo(() => FEE_PER_TICKET * qty, [qty]);
  const tax = useMemo(
    () => parseFloat((subtotal * TAX_RATE).toFixed(2)),
    [subtotal]
  );
  const total = useMemo(
    () => parseFloat((subtotal + fees + tax).toFixed(2)),
    [subtotal, fees, tax]
  );

  const ticketId = useMemo(
    () => `#${Math.floor(Math.random() * 9000000 + 1000000)}`,
    []
  );

  const [name, setName] = useState<string>("Franklin Clinton");

  const onContinue = useCallback(() => {
    router.push({
      pathname: "/Bookings/Payments",
      params: { id, qty: String(qty), type: selectedType },
    });
  }, [router, id, qty, selectedType]);

  // --- Section data for FlatList ---
  const sections = useMemo(
    () => [{ key: "hero" }, { key: "details" }, { key: "summary" }],
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: { key: string } }) => {
      switch (item.key) {
        case "hero":
          return (
            <View className="mx-3 mt-3 bg-white rounded-xl p-4 shadow-md">
              <View className="rounded-lg overflow-hidden bg-gray-200">
                {event?.image ? (
                  <Image
                    source={event.image}
                    style={{
                      width: "100%",
                      height: heroHeight,
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                    accessibilityLabel={`${event?.title ?? "Event"} image`}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: heroHeight,
                      backgroundColor: "#E5E7EB",
                      borderRadius: 8,
                    }}
                  />
                )}
              </View>

              <View className="mt-4">
                <Text className="text-base font-semibold text-[#111827]">
                  {event?.title ?? ""}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Ticket ID: {ticketId}
                </Text>
              </View>
            </View>
          );

        case "details":
          return (
            <View className="mx-3 mt-4 bg-white rounded-xl p-4 shadow-md">
              <Text className="text-sm text-gray-500">Name</Text>
              <TextInput
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                className="mt-1 text-base text-[#111827] bg-transparent p-0"
                style={{ paddingVertical: Platform.OS === "android" ? 0 : 6 }}
                accessibilityLabel="Enter your full name"
              />

              <View className="mt-4">
                <Text className="text-sm text-gray-500">Detail Location</Text>
                <Text className="mt-1 text-sm text-[#111827]">
                  {event?.location ?? "—"}
                </Text>
              </View>

              <View className="mt-4 flex-row justify-between">
                <View>
                  <Text className="text-sm text-gray-500">
                    Number of Ticket
                  </Text>
                  <Text className="mt-1 font-semibold text-sm text-[#111827]">
                    x{qty}
                  </Text>
                </View>

                <View>
                  <Text className="text-sm text-gray-500">Date</Text>
                  <Text className="mt-1 text-sm text-[#111827]">
                    {event?.dateLabel ?? "-"}
                  </Text>
                </View>
              </View>
            </View>
          );

        case "summary":
          return (
            <View className="mx-3 mt-2 bg-white rounded-xl p-4 shadow-md">
              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-gray-700">Subtotal</Text>
                <Text className="text-sm text-gray-700">
                  ${subtotal.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-gray-700">Fees</Text>
                <Text className="text-sm text-gray-700">
                  ${fees.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between py-2">
                <Text className="text-sm text-gray-700">Tax (4%)</Text>
                <Text className="text-sm text-gray-700">${tax.toFixed(2)}</Text>
              </View>

              <View className="border-t border-gray-100 mt-3 pt-3 flex-row justify-between items-center">
                <Text className=" text-base">Total</Text>
                <Text className="font-semibold text-base">
                  ${total.toFixed(2)}
                </Text>
              </View>
            </View>
          );

        default:
          return null;
      }
    },
    [event, heroHeight, ticketId, name, qty, subtotal, fees, tax, total]
  );

  // Minimal shell while redirecting; hooks already ran this render
  if (!event) {
    return <SafeAreaView edges={[]} className="flex-1 bg-gray-50" />;
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <View className="flex-1">
        <Header title="Detail Booking" />

        <FlatList
          data={sections}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(140, insets.bottom + 80),
          }}
        />

        <BottomNavBar
          variant="buttonOnly"
          ctaLabel="Checkout"
          onCTAPress={onContinue}
        />
      </View>
    </SafeAreaView>
  );
}
