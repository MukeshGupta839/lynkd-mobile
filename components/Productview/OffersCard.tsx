import { Image, Text, TouchableOpacity, View } from "react-native";

interface OffersCardProps {
  showBankOffers?: boolean; // ✅ make it optional
}

export default function OffersCard({ showBankOffers = true }: OffersCardProps) {
  return (
    <View className="w-full self-center bg-white rounded-2xl p-4 m-2 space-y-4">
      {/* Title */}
      <Text className="text-base font-semibold">Offers</Text>

      {/* Bank Offers (optional) */}
      {showBankOffers && (
        <View className="space-y-2 mt-3">
          <Text className="text-sm font-medium">Bank Offers</Text>
          <View className="flex-row justify-between">
            {/* HDFC */}
            <View className="flex-1 border border-blue-500 rounded-md mt-2 p-2 mr-2">
              <Image
                source={require("../../assets/images/Product/hdfc.png")}
                className="w-[60%] aspect-[5/1]"
                resizeMode="contain"
              />
              <Text className="text-xs mt-1 text-gray-700">
                10% Discount on the iPhone 16{"\n"}and get upto 10% of cashback
              </Text>
            </View>
            {/* Kotak */}
            <View className="flex-1 border border-red-500 rounded-md p-2 mt-2 ml-2">
              <Image
                source={require("../../assets/images/Product/kotak.png")}
                className="w-[60%] aspect-[5/1]"
                resizeMode="contain"
              />
              <Text className="text-xs mt-1 text-gray-700">
                10% Discount on the iPhone 16{"\n"}and get upto 10% of cashback
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Coupon Offers (always shown) */}
      <View className="space-y-3 mt-2">
        <Text className="text-sm font-medium">Coupon Offers</Text>

        {/* Cashback highlight */}
        <View className="bg-green-100 rounded-lg px-3 py-2 mt-2">
          <Text className="text-green-600 font-semibold text-sm">
            💸 Get Rs 5000 Cashback
          </Text>
        </View>

        {/* Extra cashback */}
        <View className="mt-2">
          <Text className="text-sm font-semibold">Extra 15% cashback</Text>
          <Text className="text-xs text-gray-600 mt-2">
            Up to Rs 5000 on your first order
          </Text>
        </View>

        {/* Code + Apply button */}
        <View className="flex-row justify-between items-center mt-2">
          <View className="border border-green-500 rounded-md px-3 py-2 border-dashed">
            <Text className="text-green-600 font-medium">FIRST15</Text>
          </View>
          <TouchableOpacity className="bg-[#26FF91] px-5 py-2 rounded-lg">
            <Text className="text-black font-semibold">Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
