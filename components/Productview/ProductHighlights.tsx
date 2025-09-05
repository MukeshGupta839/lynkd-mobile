import { Camera, Cpu, Smartphone } from "lucide-react-native";
import { JSX } from "react";
import { Text, View } from "react-native";

type Highlight = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type Props = {
  highlights: Highlight[];
};

const iconMap: Record<string, JSX.Element> = {
  cpu: <Cpu size={20} color="black" />,
  camera: <Camera size={20} color="black" />,
  display: <Smartphone size={20} color="black" />,
};

export default function ProductHighlights({ highlights }: Props) {
  return (
    <View className="w-full bg-white rounded-2xl p-5">
      {/* Title */}
      <Text className="text-base font-semibold mb-4">
        Product Highlights
      </Text>

      {/* Highlights List */}
      {highlights.map((item) => (
        <View
          key={item.id}
          className="flex-row items-center mb-4"
        >
          {/* ✅ Icon with softer background */}
          <View className="bg-[#CCFFE5] aspect-square w-[11%] rounded-2xl items-center justify-center">
            {iconMap[item.icon]}
          </View>

          {/* ✅ Texts with better spacing */}
          <View className="flex-1 ml-3">
            <Text className="text-xs text-gray-700 mb-1">
              {item.title}
            </Text>
            <Text className="text-sm font-semibold text-gray-900 leading-5">
              {item.description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
