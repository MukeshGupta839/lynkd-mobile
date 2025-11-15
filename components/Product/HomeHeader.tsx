// components/Product/HomeHeader.tsx
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // ← added usePathname
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/Address/selectAddress")}
      className="flex-row items-center"
    >
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-5 h-5 rounded-md bg-black items-center justify-center">
            <Ionicons name="paper-plane" size={12} color="#fff" />
          </View>
          <Text className="font-opensans-semibold text-black text-base">
            HOME
          </Text>
        </View>
        <Text className="text-gray-600 text-sm" numberOfLines={1}>
          Electronic City Phase 1, Doddathogur Cross ..
        </Text>
        <AntDesign name="right" size={12} color="#000" />
      </View>
    </TouchableOpacity>
  );
}
