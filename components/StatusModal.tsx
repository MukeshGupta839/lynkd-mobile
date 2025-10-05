import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type StatusModalProps = {
  visible: boolean;
  onClose?: () => void;
  showImage?: boolean;
  imageSource?: any;
  showHeading?: boolean;
  heading?: string;
  showDescription?: boolean;
  description?: string;
  showButton?: boolean;
  buttonText?: string;
  closeOnBackdrop?: boolean;
};

export default function StatusModal({
  visible,
  onClose,
  showImage = true,
  imageSource,
  showHeading = true,
  heading = "Posting is Failed",
  showDescription = true,
  description = "Due to some technical issue your post failed to upload. Please try again.",
  showButton = true,
  buttonText = "Okay",
  closeOnBackdrop = true,
}: StatusModalProps) {
  const FallbackIcon = () => (
    <View className="w-20 h-20 rounded-full bg-[#F35B57] items-center justify-center">
      <Ionicons name="close" size={56} color="#C62828" />
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* backdrop */}
      <Pressable
        className="absolute inset-0 bg-black/60"
        onPress={closeOnBackdrop ? onClose : undefined}
      />

      {/* centered card */}
      <View pointerEvents="box-none" className="absolute inset-0">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full max-w-[520px] rounded-3xl overflow-hidden border border-white/10 relative">
            {/* blur behind */}
            <BlurView
              intensity={30}
              tint="dark"
              pointerEvents="none"
              className="absolute inset-0 z-0"
            />

            {/* content on top */}
            <View className="z-10 px-7 py-6 items-center gap-4">
              {showImage &&
                (imageSource ? (
                  <Image
                    source={imageSource}
                    className="w-28 h-28"
                    resizeMode="contain"
                  />
                ) : (
                  <FallbackIcon />
                ))}

              {showHeading && (
                <Text
                  numberOfLines={2}
                  className="text-white text-[26px] font-extrabold text-center"
                >
                  {heading}
                </Text>
              )}

              {showDescription && (
                <Text className="text-white/90 text-base leading-[22px] text-center mx-1.5">
                  {description}
                </Text>
              )}

              {showButton && (
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.9}
                  className="bg-white rounded-2xl px-6 py-3 min-w-[180px] items-center justify-center shadow-md shadow-black/20"
                >
                  <Text className="text-[#111] text-lg font-bold">
                    {buttonText || "Okay"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
