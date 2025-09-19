// app/(tabs)/bookingsTickets.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Bookings/Header";
import { EventT, POPULAR_EVENTS, UPCOMING_EVENTS } from "@/constants/bookings";

// ---------- Local constants (colors & shadows) ----------
const COLORS = {
  primary: "#7C3AED",
  secondary: "#B15CDE",
  textDark: "#111827",
  textLight: "#9CA3AF",
  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.7)",
};

const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  circle: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
};

type Ticket = EventT & {
  ticketId: string;
  date: string;
  id: string;
};

export default function BookingsTickets() {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "past">("active");
  const { width: screenWidth } = useWindowDimensions();

  // ---------- Responsive sizes ----------
  const CARD_HEIGHT = Math.round(screenWidth * 0.4);
  const TAB_HEIGHT = Math.round(screenWidth * 0.12);
  const ICON_SIZE = Math.round(screenWidth * 0.045);
  const ICON_WRAPPER = Math.round(screenWidth * 0.12);

  // ---------- Memoized ticket data ----------
  const allTickets: Ticket[] = useMemo(
    () => [
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
    ],
    []
  );

  const today = useMemo(() => new Date(), []);
  const activeTickets = useMemo(
    () => allTickets.filter((t) => new Date(t.date) >= today),
    [allTickets, today]
  );
  const pastTickets = useMemo(
    () => allTickets.filter((t) => new Date(t.date) < today),
    [allTickets, today]
  );

  // ---------- Render ticket item ----------
  const renderTicket = useCallback(
    ({ item }: { item: Ticket }) => {
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
          accessibilityLabel={`View details for ${item.title}, ticket ${item.ticketId}`}
          onPress={() =>
            router.push(`/Bookings/${pathSegment}?ticketId=${ticketQuery}`)
          }
          className="mb-4 bg-white rounded-xl overflow-hidden"
          style={SHADOWS.card}>
          {/* Banner image */}
          <View className="relative w-full" style={{ height: CARD_HEIGHT }}>
            <Image
              source={item.image}
              className="w-full h-full"
              resizeMode="cover"
            />
            {/* Date badge */}
            <View
              className="absolute top-2 left-2 px-3 py-2 rounded"
              style={{ backgroundColor: COLORS.overlay }}>
              <Text className="text-white text-xs font-semibold">{month}</Text>
              <Text className="text-white text-sm font-bold">{day}</Text>
            </View>
          </View>

          {/* Info + Chevron */}
          <View className="p-3 flex-row items-center justify-between">
            <View className="pr-3 flex-1">
              <Text className="font-semibold text-base text-[#111827]">
                {item.title}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                Ticket ID: {item.ticketId}
              </Text>
            </View>

            <View style={SHADOWS.circle}>
              <View
                style={{
                  width: ICON_WRAPPER,
                  height: ICON_WRAPPER,
                }}
                className="rounded-full items-center justify-center bg-violet-100">
                <Ionicons
                  name="chevron-forward"
                  size={ICON_SIZE}
                  color={COLORS.textDark}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [router, CARD_HEIGHT, ICON_SIZE, ICON_WRAPPER]
  );

  const data = tab === "active" ? activeTickets : pastTickets;

  // ---------- UI ----------
  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <Header title="My Ticket" showBackIcon={false} />

      <View className="flex-1 ">
        {/* Tabs */}
        <View
          className="flex-row px-3 mt-4 mb-4 bg-gray-100 p-1 rounded-full overflow-hidden"
          style={{ height: TAB_HEIGHT }}>
          {/* Active Tab */}
          <View className="flex-1 h-full">
            {tab === "active" ? (
              <LinearGradient
                colors={[COLORS.secondary, COLORS.primary]}
                start={[1, 0]}
                end={[0, 0]}
                className="flex-1 h-full rounded-2xl overflow-hidden"
                style={SHADOWS.circle}>
                <TouchableOpacity
                  onPress={() => setTab("active")}
                  activeOpacity={0.9}
                  className="flex-1 h-full items-center justify-center rounded-2xl"
                  accessibilityLabel="Show active tickets">
                  <Text className="font-semibold text-white">
                    Active Ticket
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                onPress={() => setTab("active")}
                activeOpacity={0.9}
                className="flex-1 h-full items-center justify-center rounded-2xl"
                accessibilityLabel="Switch to active tickets tab">
                <Text className="font-semibold text-gray-700">
                  Active Ticket
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Past Tab */}
          <View className="flex-1 h-full">
            {tab === "past" ? (
              <LinearGradient
                colors={[COLORS.secondary, COLORS.primary]}
                start={[1, 0]}
                end={[0, 0]}
                className="flex-1 h-full rounded-2xl overflow-hidden"
                style={SHADOWS.circle}>
                <TouchableOpacity
                  onPress={() => setTab("past")}
                  activeOpacity={0.9}
                  className="flex-1 h-full items-center justify-center rounded-full"
                  accessibilityLabel="Show past tickets">
                  <Text className="font-semibold text-white">Past Ticket</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                onPress={() => setTab("past")}
                activeOpacity={0.9}
                className="flex-1 h-full items-center justify-center rounded-2xl"
                accessibilityLabel="Switch to past tickets tab">
                <Text className="font-semibold text-gray-700">Past Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tickets list */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.ticketId}
          renderItem={renderTicket}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 12 }}
          ListEmptyComponent={() => (
            <Text className="text-center text-gray-400 mt-10">
              No tickets found
            </Text>
          )}
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      </View>
    </SafeAreaView>
  );
}
