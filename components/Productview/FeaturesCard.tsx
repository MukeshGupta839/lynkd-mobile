import { RefreshCw, Star, Truck, Wallet } from "lucide-react-native";
import { Text, View } from "react-native";

export default function FeaturesCard() {
  const features = [
    { icon: <Truck size={22} color="black" />, label: "Delivery\nby LYNKD" },
    { icon: <Star size={22} color="black" />, label: "High Rated\nSeller" },
    { icon: <RefreshCw size={22} color="black" />, label: "Low\nReturns" },
    { icon: <Wallet size={22} color="black" />, label: "Cash On\nDelivery" },
  ];

  return (
    <View className="w-full bg-white rounded-2xl px-4 py-5 flex-row justify-between">
      {features.map((f, idx) => (
        <View key={idx} className="items-center flex-1">
          {/* ✅ Proper circle */}
          <View className="items-center justify-center">
            <View className="w-12 h-12 rounded-full bg-green-200 items-center justify-center">
              {f.icon}
            </View>
          </View>
          <Text className="text-xs text-center text-gray-800 mt-2">{f.label}</Text>
        </View>
      ))}
    </View>
  );
}
