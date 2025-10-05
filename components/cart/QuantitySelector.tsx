// components/cart/QuantitySelector.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove?: () => void;
  min?: number;
};

export default React.memo(function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
  min = 1,
}: Props) {
  const leftPress = useCallback(() => {
    if (quantity > min) {
      onDecrement();
    } else {
      if (onRemove) onRemove();
    }
  }, [quantity, min, onDecrement, onRemove]);

  const showTrash = quantity <= min;

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-black/10 w-2/5 h-10">
      {/* Left button */}
      <TouchableOpacity
        onPress={leftPress}
        accessibilityRole="button"
        accessibilityLabel={showTrash ? "Remove item" : "Decrease quantity"}
        activeOpacity={0.7}
        className="w-10 h-full items-center justify-center">
        {showTrash ? (
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        ) : (
          <Text className="text-lg font-semibold leading-none -translate-y-0.5">
            −
          </Text>
        )}
      </TouchableOpacity>

      {/* Quantity */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-base font-semibold leading-none text-center">
          {quantity}
        </Text>
      </View>

      {/* Right button */}
      <TouchableOpacity
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        activeOpacity={0.7}
        className="w-10 h-full items-center justify-center">
        <Text className="text-lg font-semibold leading-none -translate-y-0.5">
          ＋
        </Text>
      </TouchableOpacity>
    </View>
  );
});
