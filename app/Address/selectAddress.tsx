// app/SelectAddress.tsx
import SearchBar from "@/components/Searchbar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LocateFixed } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type DummyAddress = {
  id: string;
  name: string;
  label: string;
  address: string;
  phone: string;
};

const DUMMY_ADDRESSES: DummyAddress[] = [
  {
    id: "1",
    name: "Karthik Kumar",
    label: "Home",
    address:
      "Tech city layout, Electronic City Phase 1, Wipro gate, Bengaluru, 560100",
    phone: "9440898767",
  },
  {
    id: "2",
    name: "Asha Rao",
    label: "Work",
    address: "MG Road, Bangalore, Karnataka, 560001",
    phone: "9898989898",
  },
  {
    id: "3",
    name: "Siddharth",
    label: "Other",
    address: "Koramangala 6th Block, Bangalore, 560095",
    phone: "9123456780",
  },
];

export default function SelectAddress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const goBack = useCallback(() => router.back(), [router]);

  const onAddNew = useCallback(() => {
    router.push("/Address/AddAddress");
  }, [router]);

  const onUseLocation = useCallback(() => {
    // placeholder for location logic
    router.push("/Address/ShippingAddress");
  }, [router]);

  const renderAddress = ({ item }: { item: DummyAddress }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => setSelectedId(item.id)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Select address ${item.name}`}
        className={`bg-white rounded-lg p-4 mb-4 border ${
          isSelected ? "border-[#26FF91]" : "border-gray-200"
        }`}>
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center">
            <Ionicons name="home" size={18} color="black" />
            <Text className="ml-3 font-bold text-base">{item.name}</Text>
            <View className="ml-2  py-0.5 bg-gray-100 rounded-full">
              <Text className="text-xxs text-gray-600">{item.label}</Text>
            </View>
          </View>

          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color="#26FF91" />
          )}
        </View>

        <Text className="text-xs text-gray-600 leading-snug">
          {item.address}
        </Text>
        <Text className="text-sm font-semibold mt-2">{item.phone}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2">
        <TouchableOpacity
          onPress={goBack}
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-base font-semibold flex-1 text-center mr-6">
          Select delivery address
        </Text>
      </View>

      {/* Main content */}
      <FlatList
        data={DUMMY_ADDRESSES}
        keyExtractor={(item) => item.id}
        renderItem={renderAddress}
        ListHeaderComponent={() => (
          <View>
            {/* Use my location */}
            <View className="mt-3 ">
              <TouchableOpacity
                className="flex-row items-center rounded-lg bg-[#26FF9112] py-3"
                onPress={onUseLocation}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Use my current location">
                <View className="w-7 h-7 rounded-full items-center justify-center">
                  <LocateFixed size={20} color="black" />
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
            </View>

            {/* Search */}
            <View className="mt-4 ">
              <SearchBar
                placeholder="Search by area, street name, pin code"
                value={query}
                onChangeText={setQuery}
              />
            </View>

            {/* Saved Address title */}
            <View className="mt-6">
              <Text className="font-semibold text-sm mb-3">Select Address</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky Bottom Button */}
      <View className="absolute bottom-6 left-0 right-0 px-3">
        <TouchableOpacity
          className="w-full py-4 bg-[#26FF91] items-center justify-center rounded-lg"
          onPress={onAddNew}
          accessibilityRole="button"
          accessibilityLabel="Add new address"
          activeOpacity={0.9}>
          <Text className="text-black font-bold text-sm">Add New Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
