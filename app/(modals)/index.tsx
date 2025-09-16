import { Entypo, Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Camera from "../../assets/posts/camera.svg";
import Cart from "../../assets/posts/cart.svg";
import Gallery from "../../assets/posts/gallery.svg";
import Location from "../../assets/posts/location.svg";
import Poll from "../../assets/posts/poll.svg";
import Send from "../../assets/posts/send.svg";

interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export default function PostCreate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [imageRatio, setImageRatio] = useState(1);
  const [image, setImage] = useState<RNFile | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [disablePostButton, setDisablePostButton] = useState(true);
  const headerHeight = useHeaderHeight();

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

  useEffect(() => {
    if (image) {
      Image.getSize(image.uri, (w, h) => setImageRatio(w / h));
    }
  }, [image]);

  const pickImage = async () => {
    Keyboard.dismiss();
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      alert("Permission required");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      // allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uriParts = asset.uri.split("/");
      const name = uriParts.pop()!;
      const type = `image/${name.split(".").pop()}`;
      setImage({ uri: asset.uri, name, type });
      setDisablePostButton(false);
    }
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? insets.top : 0,
      }}
    >
      {/* Header (No changes here) */}
      <View
        className="relative border-b justify-center border-gray-300 px-3"
        style={{ height: 56 }}
      >
        <TouchableOpacity
          className="absolute flex items-center justify-center z-10 left-3 top-1/2 transform -translate-y-1/2 rounded-full w-9 h-9"
          onPress={() => router.back()}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl text-black font-opensans-semibold text-center">
          Create Post
        </Text>
      </View>

      {/* This is the main container that will adjust for the keyboard */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // 'padding' is the most reliable behavior for iOS
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // This correctly tells the view to ignore the header's height
        keyboardVerticalOffset={headerHeight}
      >
        {/* Replace KeyboardAwareScrollView with a standard ScrollView.
        The parent KeyboardAvoidingView is now handling the adjustment.
      */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-3 pt-3">
            <TextInput
              className="border flex-1 border-gray-300 rounded-lg p-2"
              placeholder="What's on your mind?"
              style={{
                textAlignVertical: "top",
                height: Platform.OS === "ios" ? 200 : undefined,
                minHeight: Platform.OS === "android" ? 200 : undefined,
              }} // Give it a minHeight
              multiline
              value={text}
              onChangeText={setText}
            />
          </View>

          {image && (
            <View
              className="w-full px-4 mt-4" // Added vertical margin
              style={{ aspectRatio: imageRatio }}
            >
              <Image
                source={{ uri: image.uri }}
                className="flex-1 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setImage(null)}
                className="absolute rounded-full p-1"
                style={{
                  top: 8,
                  right: 24,
                  backgroundColor: "rgba(0,0,0,0.6)",
                }}
              >
                <Entypo name="cross" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom selector is now a sibling to the ScrollView */}
        <View
          // Add padding to respect the safe area when the keyboard is closed
          // style={{ paddingBottom: insets.bottom === 0 ? 12 : insets.bottom }}
          style={{
            paddingBottom:
              insets.bottom === 0
                ? 12
                : Platform.OS === "android"
                  ? isKeyboardVisible
                    ? 5
                    : insets.bottom - 5
                  : isKeyboardVisible
                    ? insets.bottom + 39
                    : insets.bottom - 15,
          }}
          className="bg-white flex flex-row items-center px-3 gap-2 pt-2"
        >
          <View className="flex-1 flex-row justify-between p-2.5 items-center bg-[#F2F2F4] rounded-full">
            <TouchableOpacity
              className="items-center justify-center bg-white p-2.5 rounded-full"
              onPress={() => console.log("Camera")}
            >
              <Camera width={22} height={22} />
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center justify-center bg-white p-2.5 rounded-full"
              onPress={pickImage}
            >
              <Gallery width={22} height={22} />
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center justify-center bg-white p-2.5 rounded-full"
              onPress={() => console.log("GIF picker")}
            >
              <Cart width={22} height={22} />
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center justify-center bg-white p-2.5 rounded-full"
              onPress={() => console.log("Mention")}
            >
              <Poll width={22} height={22} />
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center justify-center bg-white p-2.5 rounded-full"
              onPress={() => console.log("Location")}
            >
              <Location width={22} height={22} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="bg-black flex-row rounded-full items-center justify-center px-3 py-2.5 gap-1"
            onPress={() => console.log("Post")}
          >
            <Send width={16} height={16} />
            <Text className="text-white text-sm font-opensans-semibold">
              POST
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
