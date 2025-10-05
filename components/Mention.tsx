import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

export type MentionUser = {
  id?: string;
  avatar?: string;
  username: string;
};

interface Props {
  users: MentionUser[];
  selection: { start: number; end: number };
  text: string;
  mentionTrigger?: string | null;
  setText: (t: string) => void;
  setMentioning: (b: boolean) => void;
  setSelection: (s: { start: number; end: number }) => void;
  inputRef: React.RefObject<TextInput | null>;
}

export default function Mention({
  users,
  selection,
  text,
  mentionTrigger,
  setText,
  setMentioning,
  setSelection,
  inputRef,
}: Props) {
  return (
    <Animated.View
      className="bg-white z-10 border border-gray-200 rounded-full overflow-hidden justify-center"
      style={[
        // match bottom selector height so it appears identical in-place
        {
          height: 60,
          width: "100%",
          maxHeight: Dimensions.get("window").height * 0.15,
        },
      ]}
    >
      <ScrollView
        keyboardShouldPersistTaps="always" // ← keep keyboard open on taps
        keyboardDismissMode="none"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-2"
        contentContainerStyle={{ alignItems: "center", paddingVertical: 6 }}
        className="py-1.5"
      >
        <View className="flex-row items-start gap-2">
          {users.map((user) => (
            <TouchableOpacity
              key={user.id ?? user.username}
              className="items-center flex-row gap-1 px-1"
              onPressIn={() => {
                // ensure the TextInput never loses focus as the tap starts
                inputRef.current?.focus();
              }}
              onPress={() => {
                const caret = selection?.start ?? 0;
                const before = text.slice(0, caret);
                const after = text.slice(caret);
                const trigger = mentionTrigger ?? "@";
                const newBefore = before.replace(
                  /[@#][A-Za-z0-9_]*$/,
                  `${trigger}${user.username} `
                );
                const next = newBefore + after;

                setText(next);
                setMentioning(false);

                const newCaret = newBefore.length;
                setSelection({ start: newCaret, end: newCaret });

                // Focus back to input
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }}
            >
              {user.avatar && (
                <Image
                  source={{ uri: user.avatar }}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
              )}

              <Text
                className="text-sm text-[#333] font-medium"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {mentionTrigger === "#" ? `#${user.username}` : user.username}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}
