// OrDivider.tsx
import { Text, View } from "react-native";

export default function OrDivider({ label = "OR" }: { label?: string }) {
  return (
    <View className="flex-row items-center my-4">
      <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
      <Text className="mx-3 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </Text>
      <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
    </View>
  );
}
