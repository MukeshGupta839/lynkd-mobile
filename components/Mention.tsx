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

export type MentionUser = {
  id: string;
  avatar: string;
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
    <View
      className="border border-gray-200 rounded-md flex-1 overflow-hidden justify-center"
      style={{ height: Dimensions.get("window").height * 0.15 }}
    >
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-start px-2"
        className="py-1.5"
      >
        <View className="flex items-start gap-2">
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              className="items-center flex-row gap-1 px-1"
              onPress={() => {
                const caret = selection?.start ?? 0;
                const before = text.slice(0, caret);
                const after = text.slice(caret);
                const trigger = mentionTrigger ?? "@";
                const newBefore = before.replace(
                  /[@#]\w*$/,
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
              <Image
                source={{ uri: user.avatar }}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <Text
                className="text-sm mt-1 text-[#333] font-medium"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user.username}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
