// app/Notifications.tsx
import Header from "@/components/Bookings/Header"; // or your header path
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Minimal Notification type
 */
type NotificationT = {
  id: string;
  title: string;
  body: string;
  datetime: string; // ISO or simple date string
  type: "product" | "services" | "bookings" | "pay";
  unread?: boolean;
};

/**
 * Sample in-memory notifications for demo.
 * In real app fetch these from API filtered by type.
 */
const SAMPLE_NOTIFICATIONS: NotificationT[] = [
  {
    id: "n1",
    title: "Event Booked Successfully",
    body: "Lorem ipsum dolor sit amet...",
    datetime: "2024-10-25T11:31:00Z",
    type: "bookings",
    unread: true,
  },
  {
    id: "n2",
    title: "3 more days until WJNC #9 starts!",
    body: "Reminder for your upcoming event",
    datetime: "2024-10-15T09:30:00Z",
    type: "bookings",
  },
  {
    id: "n3",
    title: "New product launched",
    body: "Check out the new limited edition",
    datetime: "2024-10-10T09:43:00Z",
    type: "product",
  },
  {
    id: "n4",
    title: "Service Request Received",
    body: "We'll contact you soon",
    datetime: "2024-10-09T10:10:00Z",
    type: "services",
  },
  {
    id: "n5",
    title: "Payment processed",
    body: "Your payment was successful",
    datetime: "2024-10-08T08:00:00Z",
    type: "pay",
  },
  // add more entries for Yesterday/Today demonstration...
];

function formatDayLabel(iso: string) {
  const dt = new Date(iso);
  const now = new Date();
  const sameDay = dt.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return "TODAY";
  if (dt.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return dt.toLocaleDateString();
}

function groupByDay(notifs: NotificationT[]) {
  const map: Record<string, NotificationT[]> = {};
  for (const n of notifs) {
    const key = formatDayLabel(n.datetime);
    if (!map[key]) map[key] = [];
    map[key].push(n);
  }
  // keep order: TODAY, YESTERDAY, others chronological
  const order = ["TODAY", "YESTERDAY"];
  const keys = Object.keys(map).sort((a, b) => {
    if (order.includes(a) && order.includes(b))
      return order.indexOf(a) - order.indexOf(b);
    if (order.includes(a)) return -1;
    if (order.includes(b)) return 1;
    return a < b ? -1 : 1;
  });
  return keys.map((k) => ({ label: k, items: map[k] }));
}

/* Small list item UI */
function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationT;
  onPress: (n: NotificationT) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      className="flex-row items-start bg-white p-4 rounded-lg mb-3 shadow-sm">
      <View className="w-10 h-10 rounded-full bg-violet-50 items-center justify-center mr-3">
        <Ionicons name="notifications" size={18} color="#7C3AED" />
      </View>

      <View className="flex-1">
        <Text
          className={`font-semibold ${item.unread ? "text-[#111827]" : "text-[#111827]"}`}>
          {item.title}
        </Text>
        <Text className="text-sm text-gray-400 mt-1" numberOfLines={2}>
          {item.body}
        </Text>
        <Text className="text-xs text-gray-300 mt-2">
          {new Date(item.datetime).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const router = useRouter();
  const tab =
    (params?.tab as "product" | "services" | "bookings" | "pay") || "product";

  // filter sample data by selected tab
  const filtered = useMemo(
    () => SAMPLE_NOTIFICATIONS.filter((s) => s.type === tab),
    [tab]
  );

  const sections = useMemo(() => groupByDay(filtered), [filtered]);

  const onPressNotif = (n: NotificationT) => {
    console.log("open notification", n.id);
    // TODO: navigate to relevant place depending on n.type and metadata
    // router.push(`/SomeDetailScreen?id=${...}`);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      {/* Use your Header component or a shared header */}
      <Header title="Notification" />

      <View className="px-4 mt-4">
        {/* Tabs (optional inside Notification screen) */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-sm text-gray-500">
            {tab.toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => {
              /* mark all read action */
            }}
            className="px-2 py-1">
            <Text className="text-sm text-violet-500 font-semibold">
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>

        {sections.length === 0 ? (
          <View className="items-center mt-10">
            <Text className="text-gray-400">No notifications</Text>
          </View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(s) => s.label}
            renderItem={({ item: section }) => (
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-xs font-semibold text-gray-400">
                    {section.label}
                  </Text>
                </View>

                {section.items.map((n) => (
                  <NotificationRow key={n.id} item={n} onPress={onPressNotif} />
                ))}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
