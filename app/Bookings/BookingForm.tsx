// app/book/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import BottomNavBar from "@/components/Bookings/BottomBar";
import Header from "@/components/Bookings/Header";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";
import { SafeAreaView } from "react-native-safe-area-context";

type TicketType = {
  id: string;
  label: string;
  price: string;
  fee?: string;
  subtitle?: string;
  available?: number;
  soldOut?: boolean;
};

export default function BookTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params?.id ?? "";

  // find event by id (from your constants)
  const event = useMemo<EventT | undefined>(() => {
    return [...UPCOMING_EVENTS, ...POPULAR_EVENTS].find((e) => e.id === id);
  }, [id]);

  // sample ticket types to match screenshot
  const ticketTypes: TicketType[] = [
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
  ];

  const [qty, setQty] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<string>(ticketTypes[1].id); // default Pre Sale II

  // If event not found, redirect back (silent)
  if (!event) {
    router.replace("/Bookings/[id]");
    return null;
  }

  const onContinue = () => {
    // pass to checkout (typed push)
    router.push({
      pathname: "/Bookings/Details",
      params: { id, qty: String(qty), type: selectedType },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 ">
      {/* Header */}
      <View>
        <Header title="Booking Ticket" />

        {/* Event summary card */}
        <View className="mx-4 mt-3 bg-white rounded-xl p-4 shadow-md">
          <View className="flex-row items-center">
            <View className="w-20 h-14 rounded-lg overflow-hidden bg-gray-200">
              {event.image ? (
                <Image
                  source={event.image}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <View className="ml-3 flex-1">
              <Text className="font-semibold text-base text-[#111827]">
                {event.title}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                {event.dateLabel ?? ""}
              </Text>
              <Text className="text-sm text-gray-400">
                {event.location ?? ""}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="my-4 border-t border-gray-100" />

          {/* Number of tickets selector */}
          <Text className="text-sm text-gray-600 mb-2">Number of tickets</Text>

          <View className="flex-row items-center">
            <View className="flex-1">
              {/* Outer selector box: purple-ish border, rounded, padding */}
              <View
                className="flex-row items-center justify-between rounded-xl px-3 py-2"
                style={{
                  borderWidth: 1.2,
                  borderColor: "#E6E0F8", // subtle purple-ish border
                  backgroundColor: "#fff",
                }}>
                {/* left: icon + qty */}
                <View className="flex-row items-center">
                  <View
                    className="w-9 h-9 rounded-md items-center justify-center mr-3"
                    style={{ backgroundColor: "#F5F3FF" }}>
                    {/* small ticket/person icon */}
                    <Ionicons name="person" size={16} color="#7C3AED" />
                  </View>

                  <Text className="text-base font-medium text-[#111827]">
                    {qty}
                  </Text>
                </View>

                {/* right: compact controls (chevrons instead of + / -) */}
                <View className="flex-row items-center">
                  {/* Decrease (down arrow) */}
                  <TouchableOpacity
                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-2">
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>

                  {/* Increase (up arrow) */}
                  <TouchableOpacity
                    onPress={() => setQty((q) => Math.min(10, q + 1))}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-2">
                    <Ionicons name="chevron-up" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Ticket Type heading */}
        <View className="px-4 mt-5">
          <Text className="text-sm font-semibold text-[#111827] mb-3">
            Ticket Type:
          </Text>

          {/* Ticket cards */}
          {ticketTypes.map((t) => {
            const isSelected = selectedType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.95}
                disabled={t.soldOut}
                onPress={() => !t.soldOut && setSelectedType(t.id)}
                className="mb-3 rounded-xl overflow-hidden">
                <View
                  className="flex-row items-center px-4 py-4 bg-white rounded-xl"
                  style={{
                    borderColor: isSelected ? "#7C3AED" : "#E6E6EA",
                    borderWidth: isSelected ? 2 : 1,
                    opacity: t.soldOut ? 0.5 : 1,
                  }}>
                  <View className="w-12 h-12 rounded-lg bg-violet-50 items-center justify-center">
                    <Ionicons name="ticket" size={20} color="#7C3AED" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-base text-[#111827]">
                      {t.label}
                    </Text>
                    <Text className="text-sm text-gray-400 mt-1">
                      {t.subtitle}
                    </Text>
                  </View>

                  <View className="items-end mr-3">
                    <Text
                      className={`font-semibold ${isSelected ? "text-[#7C3AED]" : "text-gray-700"}`}>
                      {t.price}
                    </Text>
                    <Text className="text-xs text-gray-400">{t.fee}</Text>
                  </View>

                  <View>
                    {/* radio */}
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center 
                      ${isSelected ? "bg-[#7C3AED]" : "border border-gray-300 bg-white"}`}>
                      {isSelected ? (
                        <View className="w-2 h-2 rounded-full bg-white" />
                      ) : null}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
