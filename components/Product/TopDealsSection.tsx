// components/Product/CategoryPopularPhones.tsx
import { LinearGradient } from "expo-linear-gradient";
import { MoveRight } from "lucide-react-native";
import { Image, ScrollView, Text, View } from "react-native";
import type { DealItem } from "@/constants/Deal";
import { popularPhones } from "@/constants/Deal";

/* Small card used only on Categories */
const CategoryPhoneCard = ({
  name,
  price,
  des,
  image,
  colors,
  imageBgClass = "bg-[#FFFFFF33]",
}: DealItem) => {
  return (
    <View className="items-center">
      <View className="w-full aspect-[127/148] rounded-xl bg-white shadow-md overflow-hidden items-center">
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-full h-[69%] items-center justify-center rounded-t-xl"
        >
          <View className={`w-[88%] h-[88%] rounded-lg items-center justify-center overflow-hidden ${imageBgClass}`}>
            <Image source={image} className="w-[90%] h-[90%]" resizeMode="contain" />
          </View>

          {/* rating pill placeholder, positioned near bottom like your spec */}
          <View className="absolute bottom-[6%] left-[6%] bg-white/90 rounded-md px-1.5 py-[1px] flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1" />
            <Text className="text-[10px] font-semibold">4.4</Text>
            <Text className="text-[10px] text-gray-500 ml-0.5">(1.1k)</Text>
          </View>
        </LinearGradient>

        {/* name */}
        <Text className="w-[90%] text-xs font-medium text-black text-center mt-1" numberOfLines={1}>
          {name}
        </Text>
      </View>

      {/* bottom badge */}
      <View className="-mt-3 z-10 bg-[#26FF91] px-2.5 py-1 rounded-full shadow-md self-center">
        <Text className="text-black font-bold italic text-xs">{des} {price}</Text>
      </View>
    </View>
  );
};

type Props = {
  title?: string;
  data?: DealItem[]; 
};

export default function CategoryPopularPhones({
  title = "Popular Phones",
  data,
}: Props) {
  // ✅ never map on undefined
  const items: DealItem[] = Array.isArray(data) ? data : popularPhones;

  return (
    <View className="bg-white">
      {/* header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-base font-bold text-black">{title}</Text>
        <View className="w-10 h-8 rounded-full bg-black items-center justify-center">
          <MoveRight size={16} color="white" />
        </View>
      </View>

      {/* carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="w-screen flex-row items-start px-4 pb-6">
          {items.map((item, i) => (
            <View
              key={item.id ?? i}
              className={`w-[34%] ${i !== items.length - 1 ? "mr-3.5" : ""} shrink-0`}
            >
              <CategoryPhoneCard {...item} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
