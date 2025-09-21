// ProductModal.tsx — Tailwind (NativeWind) version (card matches your screenshot)
import { MOCK_PRODUCTS } from "@/constants/PostCreation";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  visible,
  onClose,
  onSelectProduct,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(MOCK_PRODUCTS);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProducts(MOCK_PRODUCTS);
    } else {
      const filtered = MOCK_PRODUCTS.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, []);

  const formatPrice = (price: number) =>
    price.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  // Normalize incoming price values. Heuristic rules:
  // - If price is a float between 1 and 1000 (e.g. 79.999), it's likely a
  //   scaled value representing 79,999. Multiply by 1000.
  // - If price is an integer but < 1000 while the otherPrice is >> 1000,
  //   scale price by 1000 as well (covers cases where one field is correct).
  const normalizePrice = (price: number | undefined, otherPrice?: number) => {
    if (price == null) return 0;
    // decimal scenario: 79.999 -> 79999
    if (!Number.isInteger(price) && price > 1 && price < 1000) {
      return Math.round(price * 1000);
    }
    // small integer scenario: 80 -> 80000 if otherPrice suggests scale
    if (Number.isInteger(price) && price > 0 && price < 1000) {
      if ((otherPrice ?? 0) > 1000) return price * 1000;
      // also if price is suspiciously small (<= 100) assume scale
      if (price <= 100) return price * 1000;
    }
    return price;
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${n}`;
  };

  // ⬇️ The card now matches your screenshot
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="
        basis-[47%] rounded-2xl bg-[#F9F9F9] mb-4 border border-white/70 overflow-hidden
      "
      onPress={() => {
        onSelectProduct(item);
        onClose();
      }}
    >
      {/* Image tile */}
      <View className="px-3 pt-3">
        <View
          className="
            bg-white rounded-2xl w-full
            items-center justify-center
            border border-neutral-100
          "
          style={{ aspectRatio: 1.05 }} // tall-ish tile, like the screenshot
        >
          <Image
            source={item.image}
            className="w-3/4 h-3/4 rounded-xl"
            resizeMode="cover"
          />
          {/* Rating row (tiny, left) */}
          <View className=" absolute left-1 bottom-1 rounded-md flex flex-row bg-black/5 p-1">
            <Ionicons name="star" size={12} color="#FFC107" />
            <Text className="text-xs text-neutral-600 ml-1">
              {item.rating.toFixed(1)} ({formatCount(item.reviewCount)})
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="px-3 pt-2 pb-3 flex-row justify-between items-center">
        {/* Name + plus */}
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between">
            <Text
              className="flex-1 text-xs font-opensans-semibold text-neutral-900"
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>

          {/* Price row */}
          <View className="flex-row items-center flex-wrap">
            {(() => {
              const curr = normalizePrice(
                item.currentPrice,
                item.originalPrice
              );
              const orig = item.originalPrice
                ? normalizePrice(item.originalPrice, item.currentPrice)
                : undefined;
              return (
                <>
                  <Text className="text-xxs font-opensans-semibold text-black mr-1">
                    ₹{formatPrice(curr)}
                  </Text>

                  {!!orig && (
                    <Text className="text-xxs font-opensans-regular text-neutral-400 line-through mr-1">
                      ₹{formatPrice(orig)}
                    </Text>
                  )}
                </>
              );
            })()}

            {!!item.discount && (
              <Text className="text-xxs font-opensans-semibold text-emerald-600">
                {item.discount}%
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          className="bg-black rounded-full w-8 h-8 items-center justify-center"
          onPress={() => {
            onSelectProduct(item);
            onClose();
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-white"
        style={{ paddingTop: Platform.OS === "android" ? insets.top - 10 : 0 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-[18px] font-semibold text-neutral-800">
            Add Product
          </Text>
          <View className="w-6" />
        </View>

        {/* Search (uniform height iOS/Android) */}
        <View className="bg-white px-5 pb-4">
          <View className="flex-row items-center bg-neutral-100 rounded-full px-4 h-11">
            <TextInput
              className="flex-1 text-base text-neutral-800 h-11"
              style={{
                paddingVertical: 0,
                ...(Platform.OS === "android"
                  ? { textAlignVertical: "center" }
                  : null),
              }}
              underlineColorAndroid="transparent"
              placeholder="Search products..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <Ionicons name="search" size={18} color="#666" />
          </View>
        </View>

        {/* Results */}
        <View className="flex-1 px-5">
          <Text className="text-[16px] font-semibold text-neutral-800 mb-4">
            Result
          </Text>

          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", rowGap: 16 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ProductModal;
