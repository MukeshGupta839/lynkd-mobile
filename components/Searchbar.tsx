import { Search } from "lucide-react-native";
import { Text, TextInput, View } from "react-native";

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (t: string) => void;
  onSubmitEditing?: () => void;
  className?: string; // extra classes for the outer container
  innerClassName?: string; // extra classes for inner row
  readOnly?: boolean; // NEW: dummy mode toggle
};

export default function SearchBar({
  value,
  placeholder = "Search",
  onChangeText,
  onSubmitEditing,
  className = "",
  innerClassName = "",
  readOnly = false,
}: Props) {
  return (
    <View
      className={[
        "w-full h-13 self-center bg-white border border-gray-200 overflow-hidden",
        className,
      ].join(" ")}
    >
      <View
        className={[
          "flex-1 flex-row items-center justify-between px-3",
          innerClassName,
        ].join(" ")}
      >
        {readOnly ? (
          // 👇 Dummy version
          <Text className="flex-1 mr-2 text-lg text-gray-400">
            {placeholder}
          </Text>
        ) : (
          // 👇 Editable version
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            className="flex-1 mr-2 text-sm leading-none text-gray-700"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        )}

        <Search size={18} strokeWidth={2} color="black" />
      </View>
    </View>
  );
}
