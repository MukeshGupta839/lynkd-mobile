// app/(tabs)/bookingsTickets.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Bookings/Header";
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

    const pathSegment = encodeURIComponent(String(item.id));
    const ticketQuery = encodeURIComponent(
      String(item.ticketId).replace(/^#/, "")
    );

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          router.push(`/Bookings/${pathSegment}?ticketId=${ticketQuery}`);
        }}
        className="mb-4 bg-white rounded-xl overflow-hidden"
        style={{
          // card shadow inline
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
        }}>
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
          <View className="pr-3 flex-1">
            <Text className="font-semibold text-base text-[#111827]">
              {item.title}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              Ticket ID: {item.ticketId}
            </Text>
          </View>

          {/* chevron with purple circular background */}
          <View
            style={{
              // shadow for the circle (inline only)
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 3,
            }}>
            <View className="w-9 h-9 rounded-full items-center justify-center bg-[#7C3AED]">
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const data = tab === "active" ? activeTickets : pastTickets;

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <Header title="My Ticket" showBackIcon={false} />
      <View className="flex-1 px-4">
        <View className="flex-row mt-4 mb-4 bg-gray-100 rounded-full p-1 h-14">
          {/* Active Tab (left) */}
          <View className="flex-1 h-full">
            {tab === "active" ? (
              <LinearGradient
                colors={["#B15CDE", "#7952FC"]}
                start={[1, 0]}
                end={[0, 0]}
                className="flex-1 h-full"
                style={{
                  borderRadius: 12,
                  shadowColor: "#7C3AED",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                <TouchableOpacity
                  onPress={() => setTab("active")}
                  activeOpacity={0.9}
                  className="flex-1 h-full items-center justify-center"
                  style={{ borderRadius: 24 }}>
                  <Text className="font-semibold text-white">
                    Active Ticket
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                onPress={() => setTab("active")}
                activeOpacity={0.9}
                className="flex-1 h-full items-center justify-center"
                style={{ borderRadius: 24 }}>
                <Text className="font-semibold text-gray-700">
                  Active Ticket
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Past Tab (right) */}
          <View className="flex-1 h-full ">
            {tab === "past" ? (
              <LinearGradient
                colors={["#B15CDE", "#7952FC"]}
                start={[1, 0]}
                end={[0, 0]}
                className="flex-1 h-full "
                style={{
                  borderRadius: 12,
                  shadowColor: "#7C3AED",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                <TouchableOpacity
                  onPress={() => setTab("past")}
                  activeOpacity={0.9}
                  className="flex-1 h-full items-center justify-center"
                  style={{ borderRadius: 24 }}>
                  <Text className="font-semibold text-white">Past Ticket</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                onPress={() => setTab("past")}
                activeOpacity={0.9}
                className="flex-1 h-full items-center justify-center"
                style={{ borderRadius: 24 }}>
                <Text className="font-semibold text-gray-700">Past Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
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
