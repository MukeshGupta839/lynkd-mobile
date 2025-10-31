import { Search } from "lucide-react-native";
import { Text, TextInput, View } from "react-native";

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (t: string) => void;
  onSubmitEditing?: () => void;
  className?: string;
  innerClassName?: string;
  readOnly?: boolean;
};

export default function SearchBar({
  value,
  placeholder = "",
  onChangeText,
  onSubmitEditing,
  className = "",
  innerClassName = "",
  readOnly = false,
}: Props) {
  return (
    <View
      className={[
        "w-full h-13 self-center bg-white border border-gray-200 rounded-xl overflow-hidden",
        className,
      ].join(" ")}>
      <View
        className={[
          "flex-1 flex-row items-center justify-between px-3",
          innerClassName,
        ].join(" ")}>
        {readOnly ? (
          <Text className="flex-1 mr-2 text-base text-gray-400">
            {placeholder}
          </Text>
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            className="flex-1 mr-2 text-base text-gray-700"
            style={{
              paddingVertical: 0, // ensures caret is vertically centered
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        )}

        <Search size={20} strokeWidth={2} color="black" />
      </View>
    </View>
  );
}
