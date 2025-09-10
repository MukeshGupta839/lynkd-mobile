import SearchBar from "@/components/Searchbar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { House, LocateFixed } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectAddress() {
  const router = useRouter();
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-base font-semibold flex-1 text-center mr-6">
          Select delivery address
        </Text>
      </View>

      {/* Scrollable content */}
      <View className="flex-1">
        <ScrollView
          className="px-5"
          contentContainerStyle={{ paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}>
          {/* SearchBar Component */}
          <View className="mt-3">
            <SearchBar placeholder="Search by area, street name, pin code" />
          </View>

          {/* Location */}
          <TouchableOpacity
            className="flex-row items-center rounded-lg bg-[#26FF9112] py-3 mt-3"
            onPress={() => router.push("/")}>
            {/* Icon */}
            <View className="w-7 h-7 rounded-full items-center justify-center">
              <LocateFixed size={24} color="black" />
            </View>
            <View className="ml-3">
              <Text className="font-semibold text-xs">
                Use my current location
              </Text>
              <Text className="text-gray-500 mt-1 text-xxs">
                Allow access to location
              </Text>
            </View>
          </TouchableOpacity>

          {/* Saved Addresses */}
          <View className="mt-6">
            <Text className="font-semibold text-sm mb-3">Select Address</Text>

            {[1, 2, 3].map((_, i) => (
              <TouchableOpacity
                key={i}
                className="bg-white rounded-lg p-4 mb-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center">
                    <House size={20} color="black" />
                    <Text className="ml-3 font-bold text-base">
                      Karthik Kumar
                    </Text>
                  </View>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color="black"
                  />
                </View>

                <Text className="text-xs text-gray-600 leading-snug">
                  Tech city layout, electronic city phase 1, Wipro gate, 3rd
                  building, 3rd floor, Bengaluru, Karnataka , 560100
                </Text>

                <Text className="text-sm font-semibold mt-2">9440898767</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sticky Bottom Button */}
      <View className="absolute bottom-0 inset-x-0 pb-4 px-5">
        <TouchableOpacity
          className="w-full py-4 bg-[#26FF91] items-center justify-center rounded-lg"
          onPress={() => router.push("/Address/AddAddress")}>
          <Text className="text-black font-bold text-sm">Add New Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
