import { NotificationT, SAMPLE_NOTIFICATIONS } from "@/constants/Notification";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SectionList,
  SectionListData,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/* -------- helpers for grouping (TODAY/YESTERDAY) -------- */
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const localYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function labelForDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const key = localYMD(d);
  if (key === localYMD(today)) return "TODAY";
  if (key === localYMD(yesterday)) return "YESTERDAY";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatStamp(iso: string) {
  const d = new Date(iso);
  const day = pad2(d.getDate());
  const monthShort = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${day} ${monthShort} ${year}, ${hh}:${mm}`;
}

type SectionT = { title: string; data: NotificationT[] };

function buildSections(list: NotificationT[]): SectionT[] {
  const buckets: Record<string, NotificationT[]> = {};
  for (const n of list) {
    const label = labelForDay(n.datetime);
    (buckets[label] ||= []).push(n);
  }
  const priority = ["TODAY", "YESTERDAY"];
  const keys = Object.keys(buckets).sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    return a.localeCompare(b);
  });
  return keys.map((k) => ({ title: k, data: buckets[k] }));
}

/* ---------------- Notification Card ---------------- */
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
      className={`flex-row items-center   p-4 ${
        item.unread ? "bg-[#EDE8FD]" : "bg-white"
      }`}>
      {/* Bell icon centered vertically */}
      <View className="w-10 h-10 rounded-full bg-violet-50 items-center justify-center mr-3">
        <Ionicons name="notifications-outline" size={20} color="#7C3AED" />
      </View>

      <View className="flex-1">
        <Text
          className="font-semibold text-[#111827] text-base"
          numberOfLines={2}>
          {item.title}
        </Text>
        {!!item.body && (
          <Text
            className="text-sm text-gray-600 mt-1 leading-5"
            numberOfLines={2}>
            {item.body}
          </Text>
        )}
        <Text className="text-xs text-gray-500 mt-2">
          {formatStamp(item.datetime)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---------------- Main Screen ---------------- */
export default function NotificationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();

  const tab =
    (params?.tab as "product" | "services" | "bookings" | "pay") || "product";

  const initial = useMemo(
    () => SAMPLE_NOTIFICATIONS.filter((n) => n.type === tab),
    [tab]
  );

  const [data, setData] = useState<NotificationT[]>(initial);
  const [menuVisible, setMenuVisible] = useState(false);

  const sections = useMemo(() => buildSections(data), [data]);
  const unreadCount = data.filter((n) => n.unread).length;

  useEffect(() => setData(initial), [initial]);

  // tapping an unread notification marks it as read and decrements the pill
  const onPressNotif = (n: NotificationT) => {
    setData((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
    );
  };

  const handleMarkAllRead = () => {
    setData((prev) => prev.map((n) => ({ ...n, unread: false })));
    setMenuVisible(false);
  };

  const renderHeader = () => (
    <View className="flex-row items-center justify-between px-3 pb-3 bg-white ">
      {/* Left: back + title */}
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name="chevron-back" size={18} color="#111827" />
        </TouchableOpacity>
        <Text className="ml-3 font-semibold text-xl text-[#111827]">
          Notification
        </Text>
      </View>

      {/* Right: unread pill (hidden when 0) + 3 dots */}
      <View className="flex-row items-center">
        {unreadCount > 0 && (
          <View className="bg-[#B15CDE] px-3 py-2 rounded-lg mr-1">
            <Text className="text-white text-sm font-semibold">
              {unreadCount} NEW
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          className="p-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={18} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      {/* Status bar in white area (notch + header) */}
      <StatusBar style="dark" backgroundColor="white" translucent />

      <SafeAreaView edges={[]} className="flex-1 bg-gray-100 relative">
        {/* White background behind notch + header */}
        <View
          style={{ height: insets.top + 10 }}
          className="bg-white absolute top-0 left-0 right-0 z-10"
        />

        {/* Actual header */}
        <View style={{ marginTop: insets.top + 10 }}>{renderHeader()}</View>

        {/* Floating menu (above notifications) */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}>
          <Pressable
            onPress={() => setMenuVisible(false)}
            className="flex-1 bg-black/30 justify-start items-end pt-16 pr-4">
            <View className="bg-white rounded-lg shadow-md w-40 py-2">
              <TouchableOpacity
                onPress={handleMarkAllRead}
                className="px-3 py-2 active:bg-gray-100">
                <Text className="text-base font-semibold text-[#6D28D9]">
                  Mark all as read
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View>
              <NotificationRow item={item} onPress={onPressNotif} />
            </View>
          )}
          renderSectionHeader={({
            section,
          }: {
            section: SectionListData<NotificationT, SectionT>;
          }) => (
            <View className="px-2 mt-2 mb-2 items-center w-full">
              <Text className="text-sm font-semibold text-gray-400 tracking-widest text-center">
                {section.title}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </SafeAreaView>
    </>
  );
}
