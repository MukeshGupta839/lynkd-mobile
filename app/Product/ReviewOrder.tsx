import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reused components
import FeaturesCard from "@/components/Productview/FeaturesCard";
import OffersCard from "@/components/Productview/OffersCard";

const INR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ReviewOrder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = {
    title: "Apple iPhone 16 (Ultramarine, 128 GB)",
    image: require("@/assets/images/Product/iphonesmall.png"),
    mrp: 200000,
    basePrice: 79999,
    rating: 4.5,
    reviews: 2495,
  };

  const [qty, setQty] = useState(1);

  const price = useMemo(() => product.basePrice * qty, [qty, product.basePrice]);
  const discount = useMemo(
    () => Math.max(0, product.mrp * qty - price),
    [qty, product.mrp, price]
  );
  const taxIncluded = 1000; // display-only
  const grandTotal = useMemo(() => price /* + shipping(if any) */, [price]);

  return (
    // Root as plain View so content can extend under the notch
    <View className="flex-1 bg-gray-100 relative">
      {/* Draw under status bar / notch */}
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Sticky total overlay that paints the home-indicator area */}
<View className="absolute inset-x-0 bottom-0" style={{ zIndex: 50, elevation: 50 }}>
  <View
    className="bg-white w-full rounded-t-xxs border-t border-black/10 aspect-[6.056]"
    // make the bar color fill the home-indicator area
    style={{ paddingBottom: insets.bottom }}
  >
    <View className="flex-1 flex-row items-center justify-between px-[5%] pt-2">
      {/* Price block */}
      <View>
        <Text className="text-[1.25rem] font-semibold">{INR(grandTotal)}</Text>
        <Text className="text-[0.75rem] text-gray-400 line-through opacity-70">20,0000</Text>
      </View>

      {/* Continue button: 187x54 from design */}
      <TouchableOpacity
        className="ml-[3%] mt-2 bg-[#26FF91] rounded-2xl items-center justify-center border border-black/10"
        // width as % of card (187/430), height from aspect ratio (187/54)
        style={{ width: "43.5%", aspectRatio: 3.470 }}
        onPress={() =>
          router.push({ pathname: "/Product/payments", params: { total: String(grandTotal) } })
        }
      >
        <Text className="text-[1rem] font-semibold">Continue</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>

      {/* Header card paints the notch area via paddingTop = insets.top */}
      <View
        className="bg-white rounded-b-2xl px-[5%] py-3 shadow"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-1 mr-2">
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-xxs text-gray-500">Step 1 of 2</Text>
            <Text className="text-sm font-semibold mt-0.5">Review your Order</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        // keep content above the sticky bar (include insets.bottom)
        contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Address card */}
        <View className="bg-white mt-3 rounded-2xl px-[4%] py-3">
          <View className="flex-row items-center">
            <Ionicons name="home" size={18} color="#000" />
            <Text className="ml-2 font-semibold text-sm">HOME</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-600">
            Electronic City Phase 2, Infosys Office Gate 1., 3rd Building, Bengaluru, 560100
          </Text>
          <Text className="mt-1 text-xs text-gray-700">+91 9876923456</Text>

          <TouchableOpacity className="self-start mt-1">
            <Text className="text-xxs text-blue-500 font-medium">Change</Text>
          </TouchableOpacity>
        </View>

        {/* Product card */}
        <View className="bg-white mt-3 rounded-2xl px-[4%] py-3">
          <View className="flex-row">
            <View className="w-[22%] aspect-[1/1.2] rounded-lg overflow-hidden bg-gray-50 mr-3 items-center justify-center">
              <Image source={product.image} className="w-[90%] h-[90%]" resizeMode="contain" />
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold" numberOfLines={2}>
                {product.title}
              </Text>

              <View className="mt-1 flex-row items-center">
                <Text className="text-base font-bold mr-2">{INR(product.basePrice)}</Text>
                <Text className="text-xs line-through text-gray-400 mr-2">{INR(product.mrp)}</Text>
                <Text className="text-xs font-semibold text-green-600">50%</Text>
              </View>

              {/* rating */}
              <View className="mt-1 flex-row items-center">
                {[...Array(4)].map((_, i) => (
                  <Ionicons key={i} name="star" size={14} color="#FFD700" />
                ))}
                <Ionicons name="star-half" size={14} color="#FFD700" />
                <Text className="ml-1 text-[11px] text-gray-600">
                  {product.rating} ({product.reviews.toLocaleString()} reviews)
                </Text>
              </View>

              {/* Qty selector */}
              <View className="mt-2 flex-row items-center">
                <TouchableOpacity
                  className="w-7 aspect-square rounded-full border border-black/10 items-center justify-center"
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Text className="text-lg">−</Text>
                </TouchableOpacity>
                <Text className="mx-3 font-semibold">{qty}</Text>
                <TouchableOpacity
                  className="w-7 aspect-square rounded-full border border-black/10 items-center justify-center"
                  onPress={() => setQty((q) => q + 1)}
                >
                  <Text className="text-lg">＋</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Offers */}
        <View className="mt-1">
          <OffersCard />
        </View>

        {/* Assurances + warranty */}
        <View className="bg-white mt-1 rounded-2xl py-3">
          <FeaturesCard />
          <View className="mt-3 flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mx-[4%]">
            <Ionicons name="logo-apple" size={18} color="#000" />
            <Text className="ml-2 text-xs text-gray-700 px-2 flex-1">
              1 year warranty for the phone and 1 year warranty for in-box accessories. Worldwide
              warranty.
            </Text>
          </View>
        </View>

        {/* Price details */}
        <View className="bg-white mt-1 rounded-2xl px-[4%] py-3">
          <Text className="text-sm font-semibold mb-2">Price Details</Text>

          <View className="flex-row items-center justify-between py-1">
            <Text className="text-xs text-gray-700">Price ( {qty} item)</Text>
            <Text className="text-xs font-semibold">{INR(price)}</Text>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <Text className="text-xs text-gray-700">Discount</Text>
            <Text className="text-xs font-semibold text-green-600">- {INR(discount)}</Text>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <Text className="text-xs text-gray-700">Tax Included</Text>
            <Text className="text-xs font-semibold">{INR(taxIncluded)}</Text>
          </View>

          <View className="bg-black/10 my-2" />

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold">Total</Text>
            <Text className="text-sm font-semibold">{INR(grandTotal)}</Text>
          </View>
        </View>

        {/* Bottom spacer (extra safe, can remove if not needed) */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
