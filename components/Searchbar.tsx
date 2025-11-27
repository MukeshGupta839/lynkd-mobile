import { Ionicons } from "@expo/vector-icons";
import {
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (t: string) => void;
  onSubmitEditing?: () => void;
  className?: string;
  readOnly?: boolean;
  borderRadius?: number;
};

export default function SearchBar({
  value = "",
  placeholder = "Search",
  onChangeText,
  onSubmitEditing,
  className = "",
  readOnly = false,
  borderRadius = 10,
}: Props) {
  const { height } = useWindowDimensions();

  // Dynamically adjust height
  const baseHeight = 40;

  return (
    <View
      className={[
        "w-full bg-white flex-row items-center rounded-lg px-3",
        className,
      ].join(" ")}
      style={{
        height: baseHeight,
        borderRadius: borderRadius,
      }}
    >
      {/* Search Icon (Left) */}
      <Ionicons
        name="search"
        size={20}
        color="#666"
        style={{ marginRight: 8 }}
      />

      {/* Input (Middle) - Using BottomSheetTextInput for Sheet support */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor="#999"
        editable={!readOnly}
        style={{
          flex: 1,
          fontSize: 16,
          color: "#000",
          paddingVertical: 0, // Fix alignment on Android
          height: "100%", // Ensure it takes full height of container
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* Clear Button (Right) */}
      {value.length > 0 && !readOnly && onChangeText && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}
