import { Star, Truck } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

export type ProductItem = {
  name: string;
  description?: string;
  price: string | number;
  oldPrice?: string | number;
  discount?: string;
  image: ImageSourcePropType;
  rating?: string | number;
  reviews?: string | number;
};

export default function BestProductsCarousel({
  title = "",
  data,
}: {
  title?: string;
  data: ProductItem[];
}) {
  const { width: sw } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const CARD_W = sw * 0.3;
  const GAP = sw * 0.03;
  const SIDE = GAP;

  // Calculate total scrollable width
  const totalContentWidth = data.length * CARD_W + (data.length - 1) * GAP;
  const containerWidth = sw - 2 * SIDE;
  const maxScrollDistance = Math.max(0, totalContentWidth - containerWidth);

  // Handle scroll progress
  const handleScroll = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;

      if (maxScrollDistance <= 0) {
        // If content fits within container, keep progress at minimum
        setScrollProgress(0);
        return;
      }

      // Calculate progress with bounds checking
      const rawProgress = contentOffsetX / maxScrollDistance;
      const boundedProgress = Math.max(0, Math.min(rawProgress, 1));
      setScrollProgress(boundedProgress);
    },
    [maxScrollDistance]
  );

  return (
    <View className="w-full">
      <Text className="font-bold text-lg px-3 mb-2">{title}</Text>

      <View className="w-full aspect-[390.5/190]">
        <FlatList
          ref={flatListRef}
          horizontal
          data={data}
          keyExtractor={(_, i) => String(i)}
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          ListHeaderComponent={<View style={{ width: SIDE }} />}
          ListFooterComponent={<View style={{ width: SIDE }} />}
          renderItem={({ item }) => (
            <ProductCard item={item} cardWidth={CARD_W} />
          )}
        />
      </View>
      {/* Scroll indicator - only show if content is scrollable */}
      {maxScrollDistance > 0 && (
        <View className="w-full items-center mt-2">
          <View className="w-[29.2%] h-1.5 bg-black/10 rounded-full relative overflow-hidden">
            <View
              className="h-full bg-neutral-700 rounded-full absolute"
              style={{
                width: "15%", // Fixed width for the indicator
                left: `${scrollProgress * 85}%`, // Move from 0% to 85% (so it stays within bounds)
                transitionProperty: "left",
                transitionDuration: "200ms",
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function ProductCard({
  item,
  cardWidth,
}: {
  item: ProductItem;
  cardWidth: number;
}) {
  const {
    name,
    description,
    price,
    oldPrice,
    discount,
    image,
    rating,
    reviews,
  } = item;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{
        width: cardWidth,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Android shadow
      }}
      className="aspect-[127/189] bg-white rounded-xl p-2"
    >
      <View className="flex-1">
        <View
          className="w-full aspect-[114/90] rounded-lg items-center justify-center mb-1.5 relative bg-gray-100"
          style={{ borderWidth: 1, borderColor: "#e5e7eb" }}
        >
          <Image
            source={image}
            className="w-[85%] h-[85%]"
            resizeMode="contain"
          />
          {(rating || reviews) && (
            <View className="absolute bottom-1 left-1 flex-row items-center rounded bg-white/80 px-1.5 py-0.5">
              <Star size={12} color="#FFD700" fill="#FFD700" />
              {!!rating && (
                <Text
                  className="ml-1 text-xs font-semibold"
                  style={{ includeFontPadding: false }}
                >
                  {String(rating)}
                </Text>
              )}
              {/* {!!reviews && (
                <Text
                  className="ml-0.5 text-gray-600 text-xxs"
                  style={{ includeFontPadding: false }}
                >
                  ({String(reviews)})
                </Text>
              )} */}
            </View>
          )}
        </View>
        {/* Product title section - fixed height */}
        <View className="h-10 justify-start">
          {description ? (
            <>
              <Text
                className="text-sm font-medium"
                numberOfLines={1}
                style={{ includeFontPadding: false }}
              >
                {name}
              </Text>
              <Text
                className="text-xs text-gray-400"
                numberOfLines={1}
                style={{ includeFontPadding: false }}
              >
                {description}
              </Text>
            </>
          ) : (
            <Text
              className="text-sm font-medium"
              numberOfLines={2}
              style={{ includeFontPadding: false }}
            >
              {name}
            </Text>
          )}
        </View>

        {/* Spacer to push bottom content down */}
        <View className="flex-1" />

        {/* Bottom section - fixed position at bottom */}
        <View className="gap-1.5">
          <View className="flex-row items-end">
            <Text
              className="text-xs font-bold mr-1"
              style={{ includeFontPadding: false }}
            >
              ₹{price}
            </Text>
            {oldPrice !== undefined && oldPrice !== null && (
              <Text
                className="text-gray-400 text-xxs line-through mr-1"
                style={{ includeFontPadding: false }}
              >
                ₹{oldPrice}
              </Text>
            )}
            {!!discount && (
              <Text
                className="text-green-500 text-xs font-bold"
                style={{ includeFontPadding: false }}
              >
                {discount}
              </Text>
            )}
          </View>

          <View className="flex-row items-center rounded-full self-start bg-[#26FF91]/70 px-2 py-0.5">
            <Truck size={14} color="#000" />
            <Text
              className="ml-1 text-black font-bold text-xxs"
              style={{ includeFontPadding: false }}
            >
              Super Fast
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
