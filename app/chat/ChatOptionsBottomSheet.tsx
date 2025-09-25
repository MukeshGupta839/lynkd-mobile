// app/Chat/ChatOptionsBottomSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import {
  GestureResponderEvent,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

type Props = {
  show: boolean;
  setShow: (v: boolean) => void;
  isChatOptions?: boolean; // for future extension
  onClearChat?: () => void;
  onSetExpiry?: () => void;
  onPinChat?: () => void;
};

function OptionRow({
  icon,
  label,
  tint = "#111827",
  onPress,
}: {
  icon?: React.ReactNode;
  label: string;
  tint?: string;
  onPress?: (e: GestureResponderEvent) => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center px-4 py-3">
      <View className="w-10 h-10 rounded-xl items-center justify-center bg-white border border-gray-200">
        {icon}
      </View>
      <View className="ml-3">
        <Text className="text-base text-black">{label}</Text>
      </View>
    </Pressable>
  );
}

const ChatOptionsBottomSheet = memo(function ChatOptionsBottomSheet({
  show,
  setShow,
  isChatOptions,
  onClearChat,
  onSetExpiry,
  onPinChat,
}: Props) {
  return (
    <Modal
      visible={show}
      transparent
      animationType="slide"
      onRequestClose={() => setShow(false)}>
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-[rgba(0,0,0,0.4)]"
        onPress={() => setShow(false)}
      />

      {/* Sheet */}
      <View
        className={`bg-white rounded-t-2xl shadow-xl ${Platform.OS === "ios" ? "pb-6" : "pb-4"}`}>
        {/* Handle */}
        <View className="w-full items-center py-3">
          <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </View>

        {/* Options list */}
        <View className="px-2">
          {/* Clear chat */}
          <OptionRow
            icon={<Ionicons name="trash" size={20} color="#DC2626" />}
            label="Clear chat"
            onPress={() => {
              setShow(false);
              onClearChat?.();
            }}
          />

          {/* Pin chat */}
          <OptionRow
            icon={<Ionicons name="pin" size={20} color="#111827" />}
            label="Pin chat"
            onPress={() => {
              setShow(false);
              onPinChat?.();
            }}
          />

          {/* Set expiry */}
          <OptionRow
            icon={<Ionicons name="time" size={20} color="#111827" />}
            label="Set expiry"
            onPress={() => {
              setShow(false);
              onSetExpiry?.();
            }}
          />

          {/* Separator */}
          <View className="h-px bg-gray-100 my-2" />

          {/* Additional/secondary actions */}
          <OptionRow
            icon={<Ionicons name="person" size={20} color="#111827" />}
            label="View profile"
            onPress={() => {
              setShow(false);
              // parent screen handles opening profile if needed
            }}
          />

          <OptionRow
            icon={<Ionicons name="share-social" size={20} color="#111827" />}
            label="Share chat"
            onPress={() => {
              setShow(false);
              // optional: parent can handle share via prop in future
            }}
          />
        </View>

        {/* Cancel */}
        <View className="px-4 pt-4 pb-6">
          <Pressable
            onPress={() => setShow(false)}
            accessibilityRole="button"
            className="w-full bg-gray-100 rounded-xl py-3 items-center">
            <Text className="text-base text-black">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

export default ChatOptionsBottomSheet;
