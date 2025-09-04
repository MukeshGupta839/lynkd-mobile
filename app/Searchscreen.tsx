import SearchBar from "@/components/Searchbar";
import { allProducts, recentSearchIds } from "@/constants/Search";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  
  const recentItems = allProducts.filter((item) =>
    recentSearchIds.includes(item.id)
  );


  const filteredProducts =
    search.trim().length > 0
      ? allProducts.filter((item) =>
          (item.name + " " + item.category)
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      : [];

  return (
    <>
      
      <LinearGradient
        colors={["#C4FFCA", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="w-full rounded-b-2xl"
      >
        <SafeAreaView edges={["top"]} className="bg-transparent">
          <View className="flex-row items-center px-[5%] py-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={22} color="black" />
            </TouchableOpacity>
            <View className="flex-1">
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search Mobile"
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

     
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        className="flex-1 bg-gray-50"
      >
        <ScrollView
          className="flex-1 px-[3%] mt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {search.trim().length === 0 ? (
            <>
              {/* Recent search header */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold">Recent Search</Text>
                <TouchableOpacity>
                  <Text className="text-xs text-green-500">Clear all</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Searches */}
              {recentItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-full flex-row items-center bg-white rounded-full px-3 py-2 mb-3"
                >
                  {/* Circle with unique gradient per item */}
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    className="w-[12%] aspect-square rounded-full items-center justify-center mr-3"
                  >
                    <Image
                      source={item.image}
                      className="w-[60%] h-[70%]"
                      resizeMode="contain"
                    />
                  </LinearGradient>

                  <View className="flex-1 flex-row items-center justify-between">
                    <Text className="text-base font-medium" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="black"
                      style={{ transform: [{ rotate: "-45deg" }] }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {/* Filtered Products */}
              {filteredProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-full flex-row items-center bg-white rounded-full px-3 py-2 mb-3"
                >
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    className="w-[12%] aspect-square rounded-full items-center justify-center mr-3"
                  >
                    <Image
                      source={item.image}
                      className="w-[60%] h-[70%]"
                      resizeMode="contain"
                    />
                  </LinearGradient>

                  <View className="flex-1 flex-row items-center justify-between">
                    <Text className="text-sm font-medium" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="black"
                      style={{ transform: [{ rotate: "-45deg" }] }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
