// components/Product/HomeHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router"; // ← added usePathname
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeHeader({ count = 0 }: { count?: number }) {
  const router = useRouter();
  const pathname = usePathname(); // ← added
  const insets = useSafeAreaInsets();

  // ← added: detect current tab from path
  const activeTab = pathname?.includes("/services")
    ? "services"
    : pathname?.includes("/bookings")
      ? "bookings"
      : pathname?.includes("/pay")
        ? "pay"
        : "product";

  return (
    <View
      style={{
        paddingTop: insets.top + 5,
      }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        {/* LEFT: stacked HOME + address */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/Address/selectAddress")}
          className="flex-1">
          <View className="flex-col">
            <View className="flex-row items-center">
              <View className="w-5 h-5 rounded-md bg-black items-center justify-center mr-3">
                <Ionicons name="paper-plane" size={12} color="#fff" />
              </View>

              <View className="flex-row items-center">
                <Text className="font-bold text-black text-base mr-1">
                  HOME
                </Text>
                <Ionicons name="chevron-down" size={12} color="black" />
              </View>
            </View>

            <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
              Electronic City Phase 1, Doddathogur Cross ..
            </Text>
          </View>
        </TouchableOpacity>

        {/* RIGHT: dynamic NotificationBell */}
        <NotificationBell
          count={count}
          onPress={() =>
            router.push({
              pathname: "/ecommerceNotifications",
              params: { tab: activeTab }, // ← added tab param
            })
          }
        />
      </View>
    </View>
  );
}

/* ---------- NotificationBell identical to index.tsx ---------- */
function NotificationBell({
  count = 0,
  onPress,
}: {
  count?: number;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="relative w-9 h-9 -top-2  rounded-full  ">
      <Ionicons name="notifications-outline" size={24} color="#000" />
      {count > 0 && (
        <View
          className="absolute -top-2 right-0 bg-black rounded-full h-6 w-6 
                     items-center justify-center border border-white">
          <Text className="text-white text-xs font-bold">
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
