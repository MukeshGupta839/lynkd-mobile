import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PostCreate() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? insets.top : 0,
        paddingBottom: !isKeyboardVisible ? insets.bottom : 0,
      }}
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-gray-300 px-3"
        style={{ height: 56 }}
      >
        <TouchableOpacity
          className="rounded-full items-center justify-center"
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl text-black">Create Post</Text>
        <TouchableOpacity
          className="rounded-lg px-3 py-1"
          style={{
            backgroundColor: "#bbb",
            opacity: 0.5,
          }}
          disabled={true}
        >
          <Text className="text-lg text-white">Post</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        className="flex-1 pt-3"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraKeyboardSpace={0}
      >
        <View className="flex-1 px-3">
          <TextInput
            className="border flex-1 border-gray-300 rounded-lg p-2 mb-3"
            placeholder="What's on your mind?"
            style={{ textAlignVertical: "top", minHeight: 200 }}
            multiline
            value={text}
            onChangeText={setText}
          />
        </View>

        {/* Bottom selector */}
        <View className="bg-white border-t border-gray-200 py-2 px-3">
          <View className="flex-row justify-between px-3 items-center">
            <TouchableOpacity
              className="items-center justify-center w-16"
              onPress={() => console.log("open gallery")}
            >
              <Ionicons name="image-outline" size={22} color="#111" />
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center justify-center w-16"
              onPress={() => console.log("GIF picker")}
            >
              <View className="w-8 h-6 rounded-md bg-gray-100 items-center justify-center">
                <Text style={{ fontWeight: "700" }}>GIF</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center justify-center w-16"
              onPress={() => console.log("Mention")}
            >
              <Ionicons name="at-outline" size={22} color="#111" />
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center justify-center w-16"
              onPress={() => console.log("Location")}
            >
              <Ionicons name="location-outline" size={22} color="#111" />
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center justify-center w-16"
              onPress={() => console.log("Camera")}
            >
              <Ionicons name="camera-outline" size={22} color="#111" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
