import { Star, Truck } from "lucide-react-native";
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
  title = "Best Products for you",
  data,
}: {
  title?: string;
  data: ProductItem[];
}) {
  const { width: sw } = useWindowDimensions();

  
  const CARD_W = sw * 0.3;   
  const GAP    = sw * 0.024;   
  const SIDE   = GAP;          

  return (
    <View className="w-full">
      <Text className="font-bold text-lg px-4  mb-2">{title}</Text>

     
      <View className="w-full aspect-[390.5/190]">
        <FlatList
          horizontal
          data={data}
          keyExtractor={(_, i) => String(i)}
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          ListHeaderComponent={<View style={{ width: SIDE }} />}
          ListFooterComponent={<View style={{ width: SIDE }} />}
          renderItem={({ item }) => <ProductCard item={item} cardWidth={CARD_W} />}
        />
      </View>
      <View className="w-full items-center mt-2">
        <View className="w-[29.2%] h-1.5 bg-black/10 rounded-full overflow-hidden">
          <View className="w-[39.5%] h-full bg-neutral-700 rounded-full" />
        </View>
      </View>
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
  const { name, description, price, oldPrice, discount, image, rating, reviews } = item;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{ width: cardWidth }}
      className="aspect-[127/189] bg-white rounded-xl p-2"
    >
      <View className="flex-1">
       
        <View className="w-full aspect-[114/90] rounded-lg items-center justify-center mb-1.5 relative bg-gray-100 border border-gray-200">
          <Image source={image} className="w-[85%] h-[85%]" resizeMode="contain" />
          {(rating || reviews) && (
            <View className="absolute bottom-1 left-1 flex-row items-center bg-white/90 rounded px-1.5 py-0.5">
              <Star size={12} color="#FFD700" fill="#FFD700" />
              {!!rating && <Text className="ml-1 text-xs font-semibold">{String(rating)}</Text>}
              {!!reviews && <Text className="ml-0.5 text-gray-600 text-xxs">({String(reviews)})</Text>}
            </View>
          )}
        </View>
        {description ? (
          <>
            <Text className="text-sm font-medium" numberOfLines={1}>{name}</Text>
            <Text className="text-xs text-gray-400" numberOfLines={1}>{description}</Text>
          </>
        ) : (
          <Text className="text-sm font-medium" numberOfLines={2}>{name}</Text>
        )}

        {/* bottom block */}
        <View className="mt-1">
          <View className="flex-row items-end">
            <Text className="text-xs font-bold mr-1">₹{price}</Text>
            {oldPrice !== undefined && oldPrice !== null && (
              <Text className="text-gray-400 text-xxs line-through mr-1">₹{oldPrice}</Text>
            )}
            {!!discount && <Text className="text-green-500 text-xs font-bold">{discount}</Text>}
          </View>

          <View className="mt-1 flex-row items-center bg-[#26FF91] px-2 py-0.5 rounded-full self-start">
            <Truck size={14} color="#000" />
            <Text className="ml-1 text-black font-bold text-xxs">Super Fast</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
