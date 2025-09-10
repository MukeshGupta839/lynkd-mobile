// app/book/Details.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  // find event
  const event = useMemo<EventT | undefined>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS].find((e) => e.id === id);
  }, [id]);

  // If event not found, go back to bookings
  if (!event) {
    router.replace("/Bookings/BookingForm");
    return null;
  }

  // Example ticket type pricing (you can replace with real ticket metadata)
  const ticketTypes = {
    t1: { label: "Pre Sale I", price: 25.0 },
    t2: { label: "Pre Sale II", price: 50.0 },
    t3: { label: "Normal Ticket", price: 125.0 },
  } as Record<string, { label: string; price: number }>;

  const ticket = ticketTypes[selectedType] ?? ticketTypes.t2;
  const subtotal = ticket.price * qty;
  const fees = 1.5 * qty; // example per-ticket fee
  const tax = parseFloat((subtotal * 0.04).toFixed(2)); // 4% tax example
  const total = parseFloat((subtotal + fees + tax).toFixed(2));

  const ticketId = `#${Math.floor(Math.random() * 9000000 + 1000000)}`; // example ticket id; replace with real

  const onContinue = () => {
    // pass to checkout (typed push)
    router.push({
      pathname: "/Bookings/Payments",
      params: { id, qty: String(qty), type: selectedType },
    });
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <Header title="Detail Booking" />

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          {/* Hero card */}
          <View className="mx-4 mt-3 bg-white rounded-xl p-4 shadow-md">
            <View className="rounded-lg overflow-hidden bg-gray-200">
              {event.image ? (
                <Image
                  source={event.image}
                  className="w-full h-44 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-44 bg-gray-200 rounded-lg" />
              )}
            </View>

            <View className="mt-4">
              <Text className="text-base font-semibold text-[#111827]">
                {event.title}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Ticket ID: {ticketId}
              </Text>
            </View>
          </View>

          {/* Details card */}
          <View className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-md">
            {/* Name */}
            <Text className="text-sm text-gray-500">Name</Text>
            <TextInput
              placeholder="Franklin Clinton"
              defaultValue="Franklin Clinton"
              className="mt-1 text-base text-[#111827] bg-transparent p-0"
              style={{ paddingVertical: Platform.OS === "android" ? 0 : 6 }}
            />

            {/* Location */}
            <View className="mt-4">
              <Text className="text-sm text-gray-500">Detail Location</Text>
              <Text className="mt-1 text-sm text-[#111827]">
                Mandala Krida, Yogyakarta
              </Text>
            </View>

            {/* Row: Number of Ticket + Date */}
            <View className="mt-4 flex-row justify-between">
              <View>
                <Text className="text-sm text-gray-500">Number of Ticket</Text>
                <Text className="mt-1 font-semibold text-sm text-[#111827]">
                  x{qty}
                </Text>
              </View>

              <View>
                <Text className="text-sm text-gray-500">Date</Text>
                <Text className="mt-1 text-sm text-[#111827]">
                  {event.dateLabel ?? "-"}
                </Text>
              </View>
            </View>
          </View>

          {/* Order summary */}
          <View className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-md">
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
              <Text className=" text-base">Total</Text>
              <Text className="font-semibold text-base">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Checkout bar */}

        <BottomNavBar
          variant="buttonOnly"
          ctaLabel="Checkout"
          onCTAPress={onContinue}
        />
      </View>
    </SafeAreaView>
  );
}
