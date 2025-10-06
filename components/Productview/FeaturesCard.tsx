import {
  AirVent,
  Car,
  DoorClosed,
  RefreshCw,
  Star,
  Truck,
  Utensils,
  Wallet,
} from "lucide-react-native";
import { ReactNode } from "react";
import { Text, View } from "react-native";

type FeatureItem = {
  icon: ReactNode;
  label: string;
};

export default function FeaturesCard({
  source = "product", // "product" | "service"
  features,
}: {
  source?: "product" | "service";
  features?: FeatureItem[];
}) {
  // Default product features
  const productFeatures: FeatureItem[] = [
    { icon: <Truck size={22} color="black" />, label: "Delivery\nby LYNKD" },
    { icon: <Star size={22} color="black" />, label: "High Rated\nSeller" },
    { icon: <RefreshCw size={22} color="black" />, label: "Low\nReturns" },
    { icon: <Wallet size={22} color="black" />, label: "Cash On\nDelivery" },
  ];

  // Default service features
  const serviceFeatures: FeatureItem[] = [
    { icon: <Car size={22} color="white" />, label: "Car Parking" },
    { icon: <AirVent size={22} color="white" />, label: "AC/NON-AC" },
    { icon: <DoorClosed size={22} color="white" />, label: "Private Cabins" },
    { icon: <Utensils size={22} color="white" />, label: "Waiter" },
  ];

  // Pick feature list
  const items =
    features ?? (source === "service" ? serviceFeatures : productFeatures);

  // Background colors by type
  const circleBg = source === "service" ? "bg-indigo-600" : undefined; // service: indigo
  const circleStyle =
    source === "product" ? { backgroundColor: "#26FF914D" } : undefined; // product: translucent green

  return (
    <View className="w-full bg-white rounded-2xl  py-4 flex-row justify-between">
      {items.map((f, idx) => (
        <View key={idx} className="items-center flex-1">
          <View className="items-center justify-center">
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${
                circleBg ?? ""
              }`}
              style={circleStyle}>
              {f.icon}
            </View>
          </View>
          <Text className="text-xs text-center text-gray-800 mt-2">
            {f.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
