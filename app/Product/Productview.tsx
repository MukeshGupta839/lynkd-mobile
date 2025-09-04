import BestProductsCarousel from "@/components/Product/BestProductsCarousel";
import DeliveryDetails from "@/components/Productview/DeliveryDetails";
import FeaturesCard from "@/components/Productview/FeaturesCard";
import ProductHighlights from "@/components/Productview/ProductHighlights";
import ReviewsCard from "@/components/Productview/ReviewsCard";
import { products } from "@/constants/Product";
import { reviewsData, reviewsSummary } from "@/constants/review";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Truck } from "lucide-react-native";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OffersCard from "@/components/Productview/OffersCard";
import { product } from "@/constants/Productview";
import { highlightsData } from "@/constants/highlights";

export default function ProductView() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // top/bottom safe inset
  const [selectedColor, setSelectedColor] = useState(product.variants[0].color);
  const [selectedStorage, setSelectedStorage] = useState(product.storages[0]);
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);

  return (
    // Root is a plain View so content can extend under the notch
    <View className="flex-1 bg-gray-100">
      {/* Draw under the status bar / notch */}
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <ScrollView
        className="flex-1"
        // add bottom padding so content won't be hidden behind the CTA bar
        contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 88 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Card 1 - Header + Main Image */}
        <View
          className="bg-white rounded-b-2xl shadow px-[5%]"
          // header paints the notch area
          style={{ paddingTop: insets.top }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="arrow-back" size={22} color="black" />
            </TouchableOpacity>
            <Text className="text-base font-semibold uppercase">iphone 16</Text>
            <View className="p-2 bg-white rounded-full shadow">
              <Ionicons name="search" size={20} color="black" />
            </View>
          </View>

          {/* Heart + Share (right side) */}
          <View className="absolute right-5 top-20 space-y-3">
            <TouchableOpacity className="p-2 bg-white rounded-full shadow">
              <Ionicons name="heart-outline" size={20} color="black" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 bg-white rounded-full shadow">
              <Ionicons name="share-social-outline" size={20} color="black" />
            </TouchableOpacity>
          </View>

          {/* Main Product Image */}
          <View className="w-full items-center mt-4">
            <Image
              source={product.mainImage}
              className="w-[70%] aspect-[224/277]"
              resizeMode="contain"
            />
          </View>
        </View>

        {/* ✅ Card 2 - Thumbnails + Product Info */}
        <View className="bg-white rounded-2xl mt-3 px-[5%] py-4">
          {/* Thumbnails */}
          <View className="flex-row justify-between mb-4">
            {product.thumbnails.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                className={`w-[18%] aspect-[67/81] rounded-lg items-center justify-center ${
                  selectedThumbnail === idx
                    ? "border-2 border-[#26FF91] bg-[#CCFFE5]"
                    : "border border-[#CACACA33] bg-white"
                }`}
                onPress={() => setSelectedThumbnail(idx)}
              >
                <Image
                  source={img}
                  className="w-[70%] aspect-[49/60] rounded-md"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Product Info */}
          <View className="py-2">
            <Text className="text-base font-semibold mb-1">
              {product.name} ({selectedColor}, {selectedStorage.size})
            </Text>

            {/* Price row */}
            <View className="flex-row items-center space-x-2">
              <Text className="text-lg font-bold text-black mr-1">
                ₹{selectedStorage.price.toLocaleString("en-IN")}
              </Text>
              <Text className="line-through text-gray-400 text-sm mr-1">20,0000</Text>
              <Text className="text-green-500 text-sm font-semibold">50%</Text>
            </View>

            {/* Rating row */}
            <View className="flex-row items-center mt-1">
              {[...Array(4)].map((_, i) => (
                <Ionicons key={i} name="star" size={16} color="#FFD700" />
              ))}
              <Ionicons name="star-half" size={16} color="#FFD700" />
              <Text className="ml-1 text-sm text-gray-700">4.5 (2,495 reviews)</Text>
            </View>

            <View className="mt-1 flex-row items-center bg-[#26FF91] px-2 py-0.5 rounded-full self-start">
              <Truck size={14} color="#000" />
              <Text className="ml-1 text-black font-bold text-xxs">Super Fast</Text>
            </View>
          </View>
        </View>

        {/* ✅ Card 3 - Color + Storage */}
        <View className="bg-white rounded-2xl shadow mt-3 px-[5%] py-4">
          {/* Colors */}
          <Text className="font-semibold mb-2">Color</Text>
          <View className="flex-row justify-between mb-4">
            {product.variants.map((variant, idx) => (
              <TouchableOpacity
                key={idx}
                className={`w-[18%] aspect-[67/81] rounded-lg border items-center justify-center ${
                  selectedColor === variant.color
                    ? "border-2 border-[#26FF91] bg-[#CCFFE5]"
                    : "border border-[#CACACA33] bg-white"
                }`}
                onPress={() => setSelectedColor(variant.color)}
              >
                <Image
                  source={variant.swatch}
                  className="w-[70%] aspect-[49/60]"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Storage */}
          <Text className="font-semibold mb-2">Storage</Text>
          <View className="flex-row flex-wrap gap-3">
            {product.storages.map((s) => (
              <TouchableOpacity
                key={s.size}
                className={`px-4 py-2 rounded-md border ${
                  selectedStorage.size === s.size
                    ? "border-2 border-[#26FF91] bg-[#CCFFE5]"
                    : "border border-[#CACACA33] bg-white"
                }`}
                onPress={() => setSelectedStorage(s)}
              >
                <Text
                  className={`text-sm ${
                    selectedStorage.size === s.size
                      ? "text-black-600 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {s.size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <OffersCard />

        <DeliveryDetails
          addresses={[
            { title: "HOME", details: "Electronic City Phase 1, Doddathogur Cross .." },
            { title: "HOME 2", details: "Electronic City Phase 2, Infosys Office Gate 1..." },
          ]}
          warrantyText="1 year warranty for the phone and 1 year warranty for in Box Accessories. In all over the World Warranty"
        />

        <View className="mt-3">
          <FeaturesCard />
        </View>

        <View className="mt-3">
          <ProductHighlights highlights={highlightsData} />
        </View>

        <View className="mt-3">
          <ReviewsCard
            average={reviewsSummary.average}
            basedOnText={reviewsSummary.basedOnText}
            reviews={reviewsData}
            onViewMore={() => router.push("/")}
          />
        </View>

        <View className="mt-4">
          <View className="bg-white rounded-2xl shadow px-4 py-5">
            <BestProductsCarousel data={products} />
          </View>
        </View>
      </ScrollView>

      {/* ---- Sticky bottom CTA bar that paints the home-indicator area ---- */}
      <View
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl px-[4%] pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        // This makes the bar extend under the home indicator and color it
        style={{ paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center justify-between gap-4">
          {/* Add To Cart */}
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 rounded-2xl border border-[#26FF91] bg-white"
            onPress={() => {}}
          >
            <View className="flex-row items-center justify-center gap-2 py-4">
              <Text className="text-base font-semibold text-black">Add To Cart</Text>
              <Ionicons name="cart-outline" size={20} color="black" />
            </View>
          </TouchableOpacity>

          {/* Buy Now */}
          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-1 rounded-2xl bg-[#26FF91]"
            onPress={() => router.push("/Product/ReviewOrder")}
          >
            <View className="items-center justify-center py-[1rem]">
              <Text className="text-base font-semibold text-black">Buy Now</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
