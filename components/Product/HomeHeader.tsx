import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // ✅ add router
import { Send } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

export default function HomeHeader() {
  const router = useRouter(); // ✅ init router

  return (
    <View className="w-full">
      <View className="relative w-full flex-row items-center">
        <View className="absolute top-1.5 left-1/2 -translate-x-1/2">
          <Ionicons name="sparkles" size={22} color="white" />
        </View>
        <View className="absolute bottom-1 right-0 translate-x-2">
          <Ionicons name="sparkles" size={22} color="white" />
        </View>

        <TouchableOpacity
          className="flex-1"
          activeOpacity={0.7}
          onPress={() => router.push("/Address/select-address")}
        >
          <View className="flex-row items-center gap-1.5">
            <Send size={15} color="black" />
            <Text className="font-bold text-black text-base tracking-wide">
              HOME
            </Text>
            <Ionicons name="chevron-down" size={12} color="black" />
          </View>
          <Text
            className="text-gray-600 text-xs mt-1 leading-snug"
            numberOfLines={1}
          >
            Electronic City Phase 1, Doddathogur Cross ..
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} className="ml-auto shrink-0 ">
          <View className="w-full items-end ">
            <View className="w-[37%] aspect-square rounded-full bg-[#EDE8FD4D] items-center justify-center shadow-md relative">
              <MaterialCommunityIcons name="bell" size={32} color="#0f0f2d" />

              <View className="absolute top-[11%] right-[12%] w-[39%] aspect-square rounded-full bg-black border-2 border-white items-center justify-center">
                <Text className="text-xs font-bold text-white ">5</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
