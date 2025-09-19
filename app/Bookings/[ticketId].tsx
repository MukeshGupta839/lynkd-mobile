// app/Bookings/[ticketId].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import BottomNavBar from "@/components/Bookings/BottomBar";
import Header from "@/components/Bookings/Header";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

export default function BookingTicketDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    ticketId?: string;
    ticketNumber?: string;
    ticketIdQuery?: string;
    id?: string;
  }>();

  const pathSegment = params?.ticketId ?? "";
  const ticketNumberFromQuery =
    (params as any)?.ticketNumber ?? (params as any)?.ticketId ?? "";
  const idQuery = params?.id ?? "";
  const eventId = idQuery || pathSegment;

  let ticketNumber = ticketNumberFromQuery ?? "";
  if (!ticketNumber) {
    if (pathSegment && /^\d+$/.test(decodeURIComponent(pathSegment))) {
      ticketNumber = decodeURIComponent(pathSegment);
    }
  }

  // Merge events (memoized)
  const allEvents = useMemo(() => [...UPCOMING_EVENTS, ...POPULAR_EVENTS], []);

  // Find event by ID (memoized)
  const event = useMemo<EventT | undefined>(() => {
    if (!eventId) return undefined;
    const key = decodeURIComponent(String(eventId));
    return allEvents.find((e) => String(e.id) === key);
  }, [allEvents, eventId]);

  const goToMyTickets = useCallback(() => {
    router.replace("/(tabs)/bookingsTickets");
  }, [router]);

  // If event missing: friendly fallback UI
  if (!event) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
        <Header title="Detail Ticket" />
        <View className="flex-1 items-center justify-center px-3">
          <Text className="text-lg font-semibold text-[#111827] mb-2">
            Ticket not found
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
            We couldn't locate the event for this ticket. Try My Tickets.
          </Text>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={goToMyTickets}
              accessibilityLabel="Go to My Tickets"
              className="px-3 py-2 rounded-lg bg-violet-600">
              <Text className="text-white font-semibold">Go to My Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              className="px-3 py-2 rounded-lg border border-gray-200">
              <Text className="text-gray-700">Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Demo purchaser & pricing (could come from API)
  const purchaserName = "Franklin Clinton";
  const qty = 1;
  const price = 50.0;
  const fees = 1.5;
  const tax = +(price * 0.04).toFixed(2);
  const subtotal = price * qty;
  const total = +(subtotal + fees + tax).toFixed(2);

  // CTA handler (stable)
  const onDownload = useCallback(() => {
    router.back();
  }, [router]);

  // Memoized fake barcode (small allocation avoided on re-renders)
  const barcode = useMemo(
    () => (
      <View className="w-full aspect-[4/1] flex-row items-stretch justify-center">
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            className={`h-full ${i % 2 === 0 ? "bg-black" : "bg-white"}`}
            style={{ width: i % 5 === 0 ? 4 : 2 }}
          />
        ))}
      </View>
    ),
    []
  );

  // FlatList sections
  const sections = useMemo(
    () => [{ key: "hero" }, { key: "purchaser" }, { key: "summary" }],
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: { key: string } }) => {
      if (item.key === "hero") {
        return (
          <View className="mx-3 mt-3 bg-white rounded-xl p-4 shadow-md">
            <View className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-200">
              {event.image && (
                <Image
                  source={event.image}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}

              {/* Date badge */}
              <View className="absolute top-3 left-3 bg-black/70 px-3 py-2 rounded-md items-center">
                {(() => {
                  const [month = "", day = ""] = (event.dateLabel || "").split(
                    " "
                  );
                  return (
                    <>
                      <Text className="text-xs text-white font-semibold">
                        {month}
                      </Text>
                      <Text className="text-sm text-white font-bold">
                        {day}
                      </Text>
                    </>
                  );
                })()}
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-base font-semibold text-[#111827]">
                {event.title}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                Ticket ID:{" "}
                {ticketNumber ? `#${ticketNumber}` : String(event.id)}
              </Text>
            </View>
          </View>
        );
      }

      if (item.key === "purchaser") {
        return (
          <View className="mx-3 mt-4 bg-white rounded-xl p-4 shadow-md">
            <Text className="text-sm text-gray-500">Name</Text>
            <Text className="mt-1 text-base font-semibold text-[#111827]">
              {purchaserName}
            </Text>

            <View className="mt-4">
              <Text className="text-sm text-gray-500">Detail Location</Text>
              <Text className="mt-1 text-base text-[#111827]">
                {event.location ?? "-"}
              </Text>
            </View>

            <View className="mt-4 flex-row">
              <View className="flex-1">
                <Text className="text-sm text-gray-500">Number of Ticket</Text>
                <Text className="mt-1 text-base text-[#111827]">x{qty}</Text>
              </View>

              <View className="flex-1 items-end">
                <Text className="text-sm text-gray-500">Date</Text>
                <Text className="mt-1 text-base text-[#111827]">
                  {event.dateLabel ?? "-"}
                </Text>
              </View>
            </View>

            {/* QR / Barcode */}
            <View className="mt-6 items-center">{barcode}</View>
          </View>
        );
      }

      // summary
      return (
        <View className="mx-3 mt-4 bg-white rounded-xl p-4 shadow-md">
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-gray-700">Subtotal</Text>
            <Text className="text-sm text-gray-700">
              ${subtotal.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-gray-700">Fees</Text>
            <Text className="text-sm text-gray-700">${fees.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-gray-700">Tax (4%)</Text>
            <Text className="text-sm text-gray-700">${tax.toFixed(2)}</Text>
          </View>

          <View className="border-t border-gray-100 mt-3 pt-3 flex-row justify-between items-center">
            <Text className="font-semibold text-base">Total</Text>
            <Text className="font-semibold text-base">${total.toFixed(2)}</Text>
          </View>
        </View>
      );
    },
    [
      barcode,
      event,
      ticketNumber,
      purchaserName,
      qty,
      subtotal,
      fees,
      tax,
      total,
    ]
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <Header title="Detail Ticket" />

      <FlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={(s) => s.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(200, insets.bottom + 80),
        }}
        ListFooterComponent={() => <View className="h-6" />}
      />

      {/* Bottom CTA */}
      <View className="absolute left-0 right-0 bottom-0 px-4">
        <BottomNavBar
          variant="buttonOnly"
          ctaLabel="Download Ticket"
          ctaIcon="download"
          onCTAPress={onDownload}
        />
      </View>
    </SafeAreaView>
  );
}
