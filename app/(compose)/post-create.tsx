// PostCreate.tsx - Smart Mention Popover with Auto-positioning
import { FacebookStyleImage } from "@/components/FacebookStyleImage";
import Mention from "@/components/Mention";
import ProductModal from "@/components/PostCreation/ProductModal";
import CreatePostImageViewer from "@/components/Product/CreatePostImageViewer";
import { USERS } from "@/constants/PostCreation";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { Entypo, Ionicons, Octicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  InteractionManager,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Camera from "../../assets/posts/camera.svg";
import Cart from "../../assets/posts/cart.svg";
import Gallery from "../../assets/posts/gallery.svg";
import Location from "../../assets/posts/location.svg";
import Poll from "../../assets/posts/poll.svg";
import Send from "../../assets/posts/send.svg";

interface RNFile {
  id?: string;
  uri: string;
  name: string;
  type: string;
}

const INPUT_LINE_HEIGHT = 20; // keep in sync with TextInput's lineHeight
const INPUT_FONT_SIZE = 14;
// (popover constants removed — not used in current implementation)

// Access dimensions for side-effects if needed later
void Dimensions.get("window");
interface Product {
  id: string;
  name: string;
  image: ImageSourcePropType | string;
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
}
const MENTION_RE = /([@#][A-Za-z0-9_]{1,30})/g;

const styles = StyleSheet.create({
  base: {
    fontSize: INPUT_FONT_SIZE,
    lineHeight: INPUT_LINE_HEIGHT,
    letterSpacing: 0,
    includeFontPadding: false, // Android: align baselines
  },
  mention: { color: "#1b74e4" }, // ← no fontWeight change
});

// split helper (unchanged logic)
const splitParts = (t: string) => t.split(MENTION_RE);

function HighlightedText({ value }: { value: string }) {
  const parts = splitParts(value);
  return (
    <Text
      style={styles.base}
      allowFontScaling={false}
      // Android: keep the same break algorithm as TextInput
      textBreakStrategy="simple"
    >
      {parts.map((part, i) => {
        const isMention = part.startsWith("@") || part.startsWith("#");
        return (
          <Text key={i} style={isMention ? styles.mention : undefined}>
            {part}
          </Text>
        );
      })}
      {"\u200B"}
    </Text>
  );
}

export default function PostCreate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kbHeight = useGradualAnimation();
  const [text, setText] = useState("");
  const [image, setImage] = useState<RNFile[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [, setDisablePostButton] = useState(true);
  const [, setKeyboardHeight] = useState(0);
  const [, setScrollOffset] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Refs for managing transitions
  const keyboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutRef = useRef<{ width: number; height: number } | null>(null);
  const containerRef = useRef<View>(null);
  const [, setContainerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // mention logic
  const [mentionQuery, setMentionQuery] = useState(""); // chars after @
  const [mentioning, setMentioning] = useState(false);
  // mention trigger ('@' or '#') to preserve which symbol the user typed
  const [mentionTrigger, setMentionTrigger] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  // caret measurement
  const inputRef = useRef<TextInput>(null);
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [, setCaretAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // layouts reserved for future positioning improvements
  const [, setMainContainerLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const normalizeUri = (u: string) => u.split("?")[0];
  // assetKey helper removed (not used)

  const keyboardPadding = useAnimatedStyle(() => {
    return {
      paddingBottom: kbHeight.value,
    };
  }, [kbHeight]);

  // Improved keyboard handling with focus management
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      if (keyboardTimeoutRef.current) clearTimeout(keyboardTimeoutRef.current);
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    };

    const onHide = () => {
      if (keyboardTimeoutRef.current) clearTimeout(keyboardTimeoutRef.current);

      if (Platform.OS === "ios") {
        // iOS: flip immediately so safe-area padding applies right away
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      } else {
        // Android: small delay if you want to avoid layout jitter
        keyboardTimeoutRef.current = setTimeout(() => {
          setKeyboardHeight(0);
          setKeyboardVisible(false);
        }, 100);
      }
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      if (keyboardTimeoutRef.current) clearTimeout(keyboardTimeoutRef.current);
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Stable keyboard dismissal
  const dismissKeyboardAndWait = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }

      // Mark that we're transitioning
      setKeyboardVisible(false);
      setKeyboardHeight(0);

      Keyboard.dismiss();

      // Use InteractionManager for better timing
      InteractionManager.runAfterInteractions(() => {
        keyboardTimeoutRef.current = setTimeout(
          () => {
            resolve();
          },
          Platform.OS === "ios" ? 150 : 100
        );
      });
    });
  }, []);

  // Fingerprint function remains the same
  async function fingerprintAsset(a: ImagePicker.ImagePickerAsset) {
    if (a.assetId) return `asset:${a.assetId}`;

    try {
      const info = (await FileSystem.getInfoAsync(a.uri, {
        md5: true,
      })) as FileSystem.FileInfo & { md5?: string | null };
      if (info.md5) return `md5:${info.md5}`;
    } catch {}

    const name = a.fileName ?? normalizeUri(a.uri).split("/").pop() ?? "image";
    const size = a.fileSize ?? 0;
    return `meta:${name}|${size}|${a.width}x${a.height}`;
  }

  const pickImage = async () => {
    // Ensure keyboard is dismissed before opening picker
    await dismissKeyboardAndWait();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos", "livePhotos"],
      quality: 1,
    });

    if (result.canceled) return;

    const existingIds = new Set(image.map((f) => f.id ?? normalizeUri(f.uri)));
    const files: RNFile[] = [];

    for (const a of result.assets) {
      const id = await fingerprintAsset(a);
      if (existingIds.has(id)) continue;
      existingIds.add(id);

      const nameFromUri = a.uri.split("/").pop() || "image.jpg";
      const name = a.fileName ?? nameFromUri;
      const ext = (name.split(".").pop() || "jpg").toLowerCase();
      const type = a.type ?? `image/${ext}`;

      files.push({ id, uri: a.uri, name, type });
    }

    if (files.length) {
      setImage((prev) => [...prev, ...files]);
      setDisablePostButton(false);
    }
  };

  // Enhanced bottom padding calculation
  const getBottomPadding = useCallback(() => {
    if (Platform.OS === "android") {
      return isKeyboardVisible ? 8 : Math.max(insets.bottom - 5, 12);
    } else {
      return isKeyboardVisible ? 8 : Math.max(insets.bottom - 15, 5);
    }
  }, [isKeyboardVisible, insets.bottom]);

  // Enhanced caret position calculation
  const updateCaretPosition = useCallback(() => {
    if (!mentioning || !text || !inputLayout.w) return;

    const caretIndex = selection.start || 0;
    if (caretIndex === 0) {
      setCaretAnchor({ x: 0, y: 0 });
      return;
    }

    const textBeforeCaret = text.substring(0, caretIndex);
    const inputWidth = inputLayout.w - 24; // minus padding

    // More accurate line calculation
    const lines: string[] = [];
    const paragraphs = textBeforeCaret.split("\n");

    paragraphs.forEach((paragraph) => {
      if (paragraph === "") {
        lines.push("");
        return;
      }

      // Better character width estimation
      const avgCharWidth = INPUT_FONT_SIZE * 0.5; // More conservative
      const maxCharsPerLine = Math.floor(inputWidth / avgCharWidth);

      if (paragraph.length <= maxCharsPerLine) {
        lines.push(paragraph);
      } else {
        // Break long lines at word boundaries when possible
        let remaining = paragraph;
        while (remaining.length > 0) {
          if (remaining.length <= maxCharsPerLine) {
            lines.push(remaining);
            break;
          }

          let breakPoint = maxCharsPerLine;
          const spaceIndex = remaining.lastIndexOf(" ", maxCharsPerLine);
          if (spaceIndex > maxCharsPerLine * 0.7) {
            breakPoint = spaceIndex + 1;
          }

          lines.push(remaining.substring(0, breakPoint));
          remaining = remaining.substring(breakPoint);
        }
      }
    });

    // Calculate final caret position
    const lineIndex = lines.length - 1;
    const lastLine = lines[lineIndex] || "";
    const avgCharWidth = INPUT_FONT_SIZE * 0.5;

    const caretX = Math.min(lastLine.length * avgCharWidth, inputWidth);
    const caretY = lineIndex * INPUT_LINE_HEIGHT;

    setCaretAnchor({ x: caretX, y: caretY });
  }, [mentioning, text, selection.start, inputLayout.w]);

  // Mention parsing + selection tracking
  const handleChangeText = useCallback((input: string) => {
    setText(input);
  }, []);

  // 2) parse after both text & selection are current
  useEffect(() => {
    // if Android hasn’t fired onSelectionChange yet, assume caret at end
    const caret = selection?.start ?? text.length;
    const before = text.slice(0, caret);

    // find an unfinished mention right before the caret
    const m = before.match(/(^|\s)([@#])([A-Za-z0-9_]{0,30})$/);
    if (m) {
      setMentioning(true);
      setMentionTrigger(m[2]);
      setMentionQuery(m[3]); // <- always in sync with what’s typed
    } else {
      setMentioning(false);
      setMentionTrigger(null);
      setMentionQuery("");
    }
  }, [text, selection]);

  // Update caret position when selection or text changes
  useEffect(() => {
    updateCaretPosition();
  }, [updateCaretPosition]);

  const filteredUsers = USERS.filter((u) =>
    u.username.toLowerCase().startsWith(mentionQuery.toLowerCase())
  );

  // Absolute popover positioning removed — mentions are rendered in the bottom selector for a stable UX

  const onSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setDisablePostButton(false);
  };

  const openProductModal = async () => {
    await dismissKeyboardAndWait();
    setShowProductModal(true);
  };

  return (
    <View
      ref={containerRef}
      className="flex-1 bg-white"
      style={{
        paddingTop: insets.top - 10,
      }}
      onLayout={(event) => {
        setContainerLayout(event.nativeEvent.layout);
      }}
    >
      <ProductModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={(p) => {
          onSelectProduct(p);
          setShowProductModal(false);
        }}
      />
      <StatusBar style="dark" />
      {/* Header */}
      <View
        className="relative justify-center border-gray-300 px-3"
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

      {/* Main container with stable layout */}
      <View className="flex-1" style={{ paddingBottom: getBottomPadding() }}>
        <View
          className="rounded-t-5xl flex-1 border border-black/10 border-b-0 bg-white overflow-hidden"
          onLayout={(event) => {
            layoutRef.current = event.nativeEvent.layout;
            setMainContainerLayout(event.nativeEvent.layout);
          }}
        >
          <ScrollView
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow gap-3 pt-3 pb-2"
            onScroll={(e) => {
              setScrollOffset(e.nativeEvent.contentOffset.y);
            }}
            scrollEventThrottle={16}
          >
            <View className="flex-1 pt-3 gap-3">
              <View className="flex flex-row items-center px-3">
                <Image
                  source={{
                    uri: "https://media.gettyimages.com/id/2160799152/photo/hamburg-germany-cristiano-ronaldo-of-portugal-looks-dejected-following-the-teams-defeat-in.jpg?s=612x612&w=gi&k=20&c=ffUaAF9km23q47SkX57MtxQIy2no1KrCIeGpihNbR1s=",
                  }}
                  className="w-10 h-10 rounded-full"
                  resizeMode="cover"
                />

                <View
                  className="ml-3 flex flex-row items-center"
                  style={{ minWidth: 0 }}
                >
                  <Text
                    className="text-sm font-opensans-semibold"
                    numberOfLines={1}
                  >
                    Karthik Kumar
                  </Text>

                  <Octicons
                    name="verified"
                    size={14}
                    color="#000"
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>
              <View style={{ position: "relative" }} className="flex-1 mx-3">
                {/* Highlighter behind */}
                <View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFillObject, { padding: 8 }]} // matches p-2
                >
                  <HighlightedText value={text} />
                </View>

                {/* Real input on top */}
                <TextInput
                  ref={inputRef}
                  className="border flex-1 border-gray-300 rounded-lg p-2"
                  placeholder="What's on your mind?"
                  style={[
                    styles.base,
                    {
                      textAlignVertical: "top",
                      minHeight: Platform.OS === "android" ? 200 : undefined,
                      // Use *almost* transparent to avoid Android composition artifacts
                      color: "rgba(0,0,0,0.01)",
                      backgroundColor: "transparent",
                    },
                  ]}
                  multiline
                  scrollEnabled={false}
                  autoFocus
                  value={text}
                  onChangeText={handleChangeText}
                  onSelectionChange={(e) => {
                    setSelection(e.nativeEvent.selection);
                    setTimeout(() => updateCaretPosition(), 50);
                  }}
                  selectionColor="#000"
                  placeholderTextColor="#8E8E93"
                  allowFontScaling={false}
                  textBreakStrategy="simple" // ← match the highlighter
                  underlineColorAndroid="transparent"
                />
              </View>

              {/* Remove the old hidden text measurement */}
            </View>

            {image.length === 1 && (
              <View className="px-3 rounded-xl">
                <FacebookStyleImage
                  uri={image[0].uri}
                  style={{ marginBottom: 0, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => setImage([])}
                  hitSlop={10}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 20,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: 999,
                    padding: 6,
                  }}
                  accessibilityRole="button"
                >
                  <Entypo name="cross" size={16} color="#fff" />
                </Pressable>
              </View>
            )}

            {image.length > 1 && (
              <CreatePostImageViewer
                images={image}
                removeImage={(idx) =>
                  setImage((prev) => prev.filter((_, i) => i !== idx))
                }
              />
            )}

            {/* 🔹 Attached product chip — matches your screenshot */}
            {selectedProduct && (
              <View className="px-3">
                <View
                  className="
                    flex-row w-3/4 items-center rounded-xl bg-white border border-black/10
                    px-3 py-3
                  "
                >
                  {/* Left product tile */}
                  <View
                    className="
                      w-14 h-14 rounded-xl bg-white border border-neutral-200
                      items-center justify-center overflow-hidden
                    "
                  >
                    <Image
                      source={require("../../assets/images/Product/phone.png")}
                      className="w-12 h-12"
                      resizeMode="contain"
                    />
                  </View>

                  {/* Name */}
                  <Text
                    className="flex-1 text-[16px] font-opensans-semibold text-neutral-900 ml-3"
                    numberOfLines={1}
                  >
                    {selectedProduct.name}
                  </Text>

                  {/* Delete button */}
                  <TouchableOpacity
                    accessibilityLabel="Remove product"
                    onPress={() => setSelectedProduct(null)}
                    className="ml-3 w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(255,59,48,0.12)" }} // iOS red with 12% alpha
                  >
                    <Ionicons name="trash" size={20} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Bottom selector with stable positioning. When mentioning, show smart mention list here */}
        <Animated.View
          style={[keyboardPadding, { minHeight: 60 }]}
          className="bg-white flex flex-row items-center px-3 gap-2"
        >
          {mentioning && filteredUsers.length > 0 ? (
            <Mention
              users={filteredUsers}
              selection={selection}
              text={text}
              mentionTrigger={mentionTrigger}
              setText={setText}
              setMentioning={setMentioning}
              setSelection={setSelection}
              inputRef={inputRef}
            />
          ) : (
            <>
              <View className="flex-1 flex-row justify-between p-2.5 items-center bg-[#F2F2F4] rounded-full">
                <TouchableOpacity
                  className="items-center justify-center bg-white p-2.5 rounded-full"
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    console.log("Camera");
                  }}
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
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    openProductModal();
                    console.log("GIF picker");
                  }}
                >
                  <Cart width={22} height={22} />
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center justify-center bg-white p-2.5 rounded-full"
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    console.log("Mention");
                  }}
                >
                  <Poll width={22} height={22} />
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center justify-center bg-white p-2.5 rounded-full"
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    console.log("Location");
                  }}
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
            </>
          )}
        </Animated.View>

        {/* Smart Mention is rendered in the bottom selector now */}
      </View>
    </View>
  );
}
