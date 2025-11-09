// components/StoreIconButton.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";

const StoreIconButton = ({
  store,
}: {
  store: { id?: number; slug?: string };
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (store?.id) {
          router.push({
            pathname: "/Store/storeProfile",
            params: { store: store.id },
          });
        } else if (store?.slug) {
          router.push({
            pathname: "/Store/storeProfile",
            params: { slug: store.slug },
          });
        } else {
          console.warn("⚠️ No store id or slug provided!");
        }
      }}>
      <View
        className="p-1.5  rounded-full"
        accessibilityLabel="Store"
        accessibilityRole="button">
        <Ionicons name="storefront-outline" size={18} color="black" />
      </View>
    </TouchableOpacity>
  );
};

export default StoreIconButton;
