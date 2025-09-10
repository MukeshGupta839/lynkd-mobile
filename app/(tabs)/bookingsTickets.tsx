// app/(tabs)/bookingsTickets.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

type Ticket = EventT & {
  ticketId: string;
  date: string;
  id: string; // <- this must match event.id from constants
};

export default function BookingsTickets() {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "past">("active");

  const allTickets: Ticket[] = [
    {
      ...UPCOMING_EVENTS[0],
      ticketId: "#8954673009",
      id: "u1",
      date: "2025-09-20",
    },
    {
      ...UPCOMING_EVENTS[1],
      ticketId: "#8954673011",
      id: "u2",
      date: "2025-09-20",
    },
    {
      ...POPULAR_EVENTS[0],
      ticketId: "#8954673010",
      id: "p1",
      date: "2024-05-25",
    },
    {
      ...POPULAR_EVENTS[1],
      ticketId: "#8954673020",
      id: "p2",
      date: "2024-05-25",
    },
  ];

  const today = new Date();
  const activeTickets = useMemo(
    () => allTickets.filter((t) => new Date(t.date) >= today),
    [allTickets]
  );
  const pastTickets = useMemo(
    () => allTickets.filter((t) => new Date(t.date) < today),
    [allTickets]
  );

  const renderTicket = ({ item }: { item: Ticket }) => {
    const [month, day] = new Date(item.date)
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .split(" ");

    // Use event id as path segment (stable). Send ticket number as query param for display.
    const pathSegment = encodeURIComponent(String(item.id));
    const ticketQuery = encodeURIComponent(
      String(item.ticketId).replace(/^#/, "")
    );

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          // result URL: /Bookings/u1?ticketId=8954673009
          router.push(`/Bookings/${pathSegment}?ticketId=${ticketQuery}`);
        }}
        className="mb-4 bg-white rounded-xl shadow-sm overflow-hidden">
        <View className="relative w-full h-36">
          <Image
            source={item.image}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs font-semibold">{month}</Text>
            <Text className="text-white text-sm font-bold">{day}</Text>
          </View>
        </View>

        <View className="p-3 flex-row items-center justify-between">
          <View>
            <Text className="font-semibold text-base text-[#111827]">
              {item.title}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              Ticket ID: {item.ticketId}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
        </View>
      </TouchableOpacity>
    );
  };

  const data = tab === "active" ? activeTickets : pastTickets;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="flex-1 px-4">
        <Text className="text-lg font-semibold text-[#111827] mt-2">
          My Ticket
        </Text>

        <View className="flex-row mt-4 mb-4 bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setTab("active")}
            className={`flex-1 py-2 rounded-lg items-center ${tab === "active" ? "bg-violet-600" : ""}`}>
            <Text
              className={`font-semibold ${tab === "active" ? "text-white" : "text-gray-500"}`}>
              Active Ticket
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab("past")}
            className={`flex-1 py-2 rounded-lg items-center ${tab === "past" ? "bg-violet-600" : ""}`}>
            <Text
              className={`font-semibold ${tab === "past" ? "text-white" : "text-gray-500"}`}>
              Past Ticket
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.ticketId}
          renderItem={renderTicket}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text className="text-center text-gray-400 mt-10">
              No tickets found
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
