import { Text, TextInput, TextInputProps, View } from "react-native";

interface FormInputProps extends TextInputProps {
  label: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export default function FormInput({
  label,
  isFocused,
  onFocus,
  onBlur,
  ...props
}: FormInputProps) {
  return (
    <View className="mb-5">
      <Text className="text-xs mb-2">{label}</Text>
      <TextInput
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full rounded-lg px-4 py-4 text-sm bg-white border ${
          isFocused ? "border-black-500" : "border-gray-300"
        }`}
      />
    </View>
  );
}
