// components/BookingHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title?: string;
  showBackIcon?: boolean; // new prop, optional
};

export default function BookingHeader({
  title = "",
  showBackIcon = true,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // iOS + Android shadow
  const shadowOnly = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  };

  return (
    <View
      style={[shadowOnly, { paddingTop: insets.top, paddingBottom: 12 }]}
      className="bg-white rounded-b-2xl pt-safe">
      <View className="flex-row items-center px-3">
        {showBackIcon && (
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            className=" h-8 bg-white rounded-full items-center justify-center shadow-sm"
            accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>
        )}

        <Text
          className={`text-lg font-semibold text-[#111827] ${
            showBackIcon ? "ml-3" : ""
          }`}>
          {title}
        </Text>
      </View>
    </View>
  );
}
