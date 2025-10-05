// components/ScreenHeaderBack.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";

type ScreenHeaderBackProps = {
  title?: string;
  /** If provided, this will be used instead of navigation.goBack() */
  onBack?: () => void;
  /** Optional right-side button renderer */
  additonalBtn?: () => React.ReactNode;
  /** Show a thin divider line under the header */
  showDivider?: boolean;
  /** Extra tailwind classes for the outer container */
  containerClassName?: string;
};

const BUTTON_SIZE = 40; // keep left/right areas consistent

const ScreenHeaderBack: React.FC<ScreenHeaderBackProps> = ({
  title,
  onBack,
  additonalBtn,
  showDivider = false,
  containerClassName = "",
}) => {
  const navigation = useNavigation<any>();
  const handleBack = onBack ?? (() => navigation.goBack());

  return (
    <View className={`bg-gray-100 ${containerClassName}`}>
      {/* Row is relative so we can absolutely center the title */}
      <View className="relative h-14 flex-row items-center justify-between">
        {/* Left: Back */}
        <Pressable
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="chevron-left" size={30} color="#101112" />
        </Pressable>

        {/* Absolute centered title (no pointer events so buttons work) */}
        {title && (
          <View className="absolute left-3 right-3 items-center pointer-events-none">
            <Text
              className="text-2xl font-semibold text-zinc-900"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        )}

        {/* Right: Optional Button (reserve space for symmetry) */}
        <View
          className="pr-3 items-end justify-center"
          style={{ minWidth: BUTTON_SIZE, minHeight: BUTTON_SIZE }}
        >
          {additonalBtn?.()}
        </View>
      </View>

      {showDivider && <View className="h-px w-full bg-gray-200" />}
    </View>
  );
};

export default memo(ScreenHeaderBack);
