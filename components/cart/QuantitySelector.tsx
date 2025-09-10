// components/cart/QuantitySelector.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove?: () => void; // called when quantity === 1 and user taps trash
  min?: number;
};

export default React.memo(function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
  min = 1,
}: Props) {
  // handler for left control (either decrement or remove)
  const leftPress = useCallback(() => {
    if (quantity > min) {
      onDecrement();
    } else {
      // quantity <= min -> use onRemove if provided
      if (onRemove) onRemove();
    }
  }, [quantity, min, onDecrement, onRemove]);

  const showTrash = quantity <= min;

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-black/10 px-3 w-2/5">
      <TouchableOpacity
        onPress={leftPress}
        accessibilityRole="button"
        accessibilityLabel={showTrash ? "Remove item" : "Decrease quantity"}
        activeOpacity={0.7}
        className={showTrash ? "opacity-100" : "opacity-100"}>
        {showTrash ? (
          <Ionicons name="trash-outline" size={15} color="#ef4444" />
        ) : (
          <Text className="text-base">−</Text>
        )}
      </TouchableOpacity>

      <Text className="font-semibold">{quantity}</Text>

      <TouchableOpacity
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        activeOpacity={0.7}>
        <Text className="text-base">＋</Text>
      </TouchableOpacity>
    </View>
  );
});
