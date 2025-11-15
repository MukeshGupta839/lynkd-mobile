import { Search } from "lucide-react-native";
import { Text, TextInput, useWindowDimensions, View } from "react-native";

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (t: string) => void;
  onSubmitEditing?: () => void;
  className?: string;
  innerClassName?: string;
  readOnly?: boolean;
  borderRadius?: number;
};

export default function SearchBar({
  value,
  placeholder = "",
  onChangeText,
  onSubmitEditing,
  className = "",
  innerClassName = "",
  readOnly = false,
  borderRadius = 2,
}: Props) {
  const { height } = useWindowDimensions();

  // Dynamically adjust height and padding
  const baseHeight = height < 700 ? 44 : height < 850 ? 36 : 48;
  const verticalPadding = baseHeight * 0.18; // consistent vertical spacing (top/bottom)

  return (
    <View
      className={[
        "w-full bg-white border border-gray-200 overflow-hidden",
        className,
      ].join(" ")}
      style={{
        height: baseHeight,
        borderRadius: borderRadius,
      }}
    >
      <View
        className={[
          "flex-1 flex-row items-center justify-between",
          innerClassName,
        ].join(" ")}
        style={{
          paddingHorizontal: 12,
          paddingVertical: verticalPadding,
        }}
      >
        {readOnly ? (
          <Text
            className="flex-1 text-base text-gray-400"
            style={{
              paddingVertical: 0,
              includeFontPadding: false,
              textAlignVertical: "center",
            }}
          >
            {placeholder}
          </Text>
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            className="flex-1 text-base text-gray-700"
            style={{
              paddingVertical: 0,
              includeFontPadding: false,
              textAlignVertical: "center",
              fontSize: 15,
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        )}

        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Search size={20} strokeWidth={2} color="black" />
        </View>
      </View>
    </View>
  );
}
