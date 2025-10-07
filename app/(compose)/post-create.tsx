// PostCreate.tsx - Smart Mention Popover with Auto-positioning
import { FacebookStyleImage } from "@/components/FacebookStyleImage";
import { FacebookStyleVideo } from "@/components/FacebookStyleVideo";
import Mention from "@/components/Mention";
import ProductModal from "@/components/PostCreation/ProductModal";
import CreatePostImageViewer from "@/components/Product/CreatePostImageViewer";
import CircularProgress from "@/components/ProgressBar/CircularProgress";
import StatusModal from "@/components/StatusModal";
import { TAGS, USERS } from "@/constants/PostCreation";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { Entypo, Ionicons, Octicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
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
import { scheduleOnRN } from "react-native-worklets";
import Camera from "../../assets/posts/camera.svg";
import Cart from "../../assets/posts/cart.svg";
import Community from "../../assets/posts/community.svg";
import Gallery from "../../assets/posts/gallery.svg";
import Location from "../../assets/posts/location.svg";
import Send from "../../assets/posts/send.svg";

interface RNFile {
  id?: string;
  uri: string;
  name: string;
  type: string; // e.g. 'image/jpeg' | 'video/mp4'
  width?: number;
  height?: number;
  duration?: number;
  isVideo?: boolean;
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
// Allow zero or more username chars after @/# so partial tokens (eg. "@5" or just "@")
// are still recognized and highlighted even when there are no matching options.
// One canonical pattern for mentions (0–30 chars after @/#)
const MENTION_PATTERN = "[@#][A-Za-z0-9_]{0,30}";
const MENTION_RE_END = new RegExp(`([@#])([A-Za-z0-9_]{0,30})$`); // for live-detect

const styles = StyleSheet.create({
  base: {
    fontSize: INPUT_FONT_SIZE,
    lineHeight: INPUT_LINE_HEIGHT,
    letterSpacing: 0,
    includeFontPadding: false, // Android: align baselines
  },
  mention: { color: "#1b74e4" }, // ← no fontWeight change
});

// Stable tokenizer (don’t use split with capturing groups)
export function tokenizeMentions(t: string) {
  const re = new RegExp(MENTION_PATTERN, "g"); // fresh instance, no shared state
  const parts: { text: string; isMention: boolean }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(t)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > last)
      parts.push({ text: t.slice(last, start), isMention: false });
    parts.push({ text: m[0], isMention: true });
    last = end;
  }
  if (last < t.length) parts.push({ text: t.slice(last), isMention: false });
  return parts;
}

function HighlightedText({
  value,
  caretIndex,
  users,
  activeHasSuggestions,
}: {
  value: string;
  caretIndex: number;
  users: { username: string }[]; // same shape as your USERS
  activeHasSuggestions: boolean; // “mentioning && filteredUsers.length > 0”
}) {
  const usernameSet = useMemo(
    () => new Set(users.map((u) => u.username.toLowerCase())),
    [users]
  );

  const parts: { text: string; isBlue: boolean }[] = [];
  const re = new RegExp(MENTION_PATTERN, "g");
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(value)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > last)
      parts.push({ text: value.slice(last, start), isBlue: false });

    const tok = m[0];
    const trigger = tok[0];
    const handle = tok.slice(1);
    const isActive = caretIndex >= start && caretIndex <= end;

    let isBlue = false;
    if (trigger === "@") {
      if (isActive) {
        // Active, incomplete token → blue only if suggestions exist
        isBlue = !!activeHasSuggestions;
      } else {
        // Completed token → blue only if it matches a known user exactly
        isBlue = usernameSet.has(handle.toLowerCase());
      }
    } else if (trigger === "#") {
      // keep your existing hashtag behavior (always blue). If you want the same gating, copy the @ logic here.
      isBlue = true;
    }

    parts.push({ text: tok, isBlue });
    last = end;
  }
  if (last < value.length)
    parts.push({ text: value.slice(last), isBlue: false });

  return (
    <Text
      style={styles.base}
      allowFontScaling={false}
      textBreakStrategy="simple">
      {parts.map((p, i) => (
        <Text key={i} style={p.isBlue ? styles.mention : undefined}>
          {p.text}
        </Text>
      ))}
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
  const [statusOpen, setStatusOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loader, setLoader] = useState(false);
  // NEW state (top of component)
  const [mode, setMode] = useState<"length" | "posting">("length");
  const [postingProgress, setPostingProgress] = useState(0);

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
  // keep your existing length-mode variables
  const LIMIT = 300;
  const WARN_AT = 290;
  const remaining = LIMIT - text.length;
  const pct = Math.min(1, text.length / LIMIT);
  const isRed = text.length > LIMIT;
  const ringColor = isRed
    ? "#FF3B30"
    : text.length >= WARN_AT
      ? "#FF9500"
      : "#000";
  const hideRing = isRed && Math.abs(remaining) > 9; // your rule

  // Derived for render
  const headerProgress = mode === "posting" ? postingProgress : pct;
  const headerPgColor = mode === "posting" ? "#000" : ringColor;
  const headerBgColor =
    mode === "posting" ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.15)";
  const headerDuration = mode === "posting" ? 180 : 120;
  const headerText =
    mode === "posting" ? "" : text.length >= WARN_AT ? String(remaining) : "";
  const headerShowRing = mode === "posting" ? true : !hideRing; // always show ring while posting
  const headerTextSize = mode === "posting" ? 0 : hideRing ? 12 : 8; // no text during posting

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

  const looksLikeVideo = (nameOrUri: string) =>
    /\.(mp4|mov|m4v|webm|3gp|mkv)$/i.test(nameOrUri);

  const normalizeUri = (u: string) => u.split("?")[0];
  // assetKey helper removed (not used)

  type MediaLock = "image" | "video" | null;
  const [mediaLock, setMediaLock] = useState<MediaLock>(null);

  // helpers
  const hasVideo = image.length === 1 && !!image[0]?.isVideo;

  const keyboardPadding = useAnimatedStyle(() => {
    return {
      paddingBottom: kbHeight.value,
    };
  }, [kbHeight]);

  // Drive the header ring while posting (up to 0.9, finish on success)
  useEffect(() => {
    if (mode !== "posting") return;
    let id: any;
    setPostingProgress(0.1); // quick start

    id = setInterval(() => {
      setPostingProgress((p) => Math.min(p + 0.05, 0.9)); // ease towards 90%
    }, 120);

    return () => {
      if (id) clearInterval(id);
    };
  }, [mode]);

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

  // Stable keyboard dismissal (no InteractionManager)
  const nextTick = (cb: () => void) => {
    // prefer worklets scheduler if available, else rAF x2
    if (typeof scheduleOnRN === "function") {
      scheduleOnRN(cb);
    } else {
      requestAnimationFrame(() => requestAnimationFrame(cb));
    }
  };

  // Stable keyboard dismissal
  const dismissKeyboardAndWait = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (keyboardTimeoutRef.current) clearTimeout(keyboardTimeoutRef.current);
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      Keyboard.dismiss();
      nextTick(() => {
        keyboardTimeoutRef.current = setTimeout(
          () => resolve(),
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

  const pickMedia = async () => {
    // Ensure keyboard is dismissed before opening picker
    await dismissKeyboardAndWait();

    // If images are already selected, we *disable* video picking by only allowing images
    const mediaTypes: ImagePicker.MediaType[] =
      mediaLock === "image" ? ["images"] : ["images", "videos"];

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 1,
    });

    if (result.canceled) return;

    const files: RNFile[] = [];
    const existingIds = new Set(image.map((f) => f.id ?? normalizeUri(f.uri)));

    // normalize picker assets -> RNFile
    for (const a of result.assets) {
      const id = await fingerprintAsset(a);
      if (existingIds.has(id)) continue;

      const nameFromUri = a.uri.split("/").pop() || "media";
      const name = a.fileName ?? nameFromUri;
      const ext = (name.split(".").pop() || "").toLowerCase();

      const pickerKind = (a.type || "").toLowerCase();
      const inferredVideo =
        pickerKind === "video" ||
        looksLikeVideo(name) ||
        looksLikeVideo(a.uri) ||
        typeof (a as any).duration === "number";

      const mime = inferredVideo
        ? `video/${ext || "mp4"}`
        : `image/${ext || "jpeg"}`;

      files.push({
        id,
        uri: a.uri,
        name,
        type: mime,
        width: a.width ?? undefined,
        height: a.height ?? undefined,
        duration: (a as any).duration ?? undefined,
        isVideo: inferredVideo,
      });
    }

    if (!files.length) return;

    // ⬇️ Core rules
    const pickedHasVideo = files.some((f) => f.isVideo);

    if (pickedHasVideo) {
      // 1) Only one video allowed → pick the last video and REPLACE any previous media
      const lastVideo = [...files].reverse().find((f) => f.isVideo)!;
      setImage([lastVideo]);
      setMediaLock("video"); // still allow switching to images later; Gallery will allow both
    } else {
      // 2) Only images picked
      if (hasVideo) {
        // If a video was selected, replace it with images and DISABLE video from now on
        setImage(files);
        setMediaLock("image"); // Gallery will accept only images from now on
      } else if (mediaLock === "image") {
        // Already in image mode → append images
        setImage((prev) => [...prev, ...files]);
      } else {
        // No media yet → start image mode
        setImage(files);
        setMediaLock("image");
      }
    }

    setDisablePostButton(false);
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
    const caret = selection?.start ?? text.length;
    const before = text.slice(0, caret);
    const m = before.match(MENTION_RE_END); // ([@#])([A-Za-z0-9_]{0,30})$
    if (m) {
      setMentioning(true);
      setMentionTrigger(m[1]);
      setMentionQuery(m[2] ?? "");
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

  // When the mention UI opens, make sure the text area scrolls up so the
  // input isn't hidden by the bottom selector; run after interactions for smoothness.
  useEffect(() => {
    if (!mentioning) return;
    nextTick(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [mentioning]);

  // Use includes so users show up even when typing part of the name, and
  // be case-insensitive. When mentionQuery is empty, this returns all users.
  const filteredUsers = (
    mentionTrigger === "#" ? TAGS.map((t) => ({ username: t.name })) : USERS
  ).filter((u) =>
    u.username.toLowerCase().includes(mentionQuery.toLowerCase())
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

  const createPost = async () => {
    // if (!text.trim() && image.length === 0) return;

    setMode("posting");
    setLoader(true);

    try {
      // TODO: call your real create API here.
      // If using axios/fetch with upload progress, set postingProgress to real value (0..1).
      await new Promise((r) => setTimeout(r, 2000)); // demo wait
      setPostingProgress(1); // finish the ring
    } catch (e) {
      console.log("error creating post:", e);
      // on failure, optionally flash red, then fall back to length mode
    } finally {
      setTimeout(() => {
        setLoader(false);
        setMode("length");
        setPostingProgress(0);
      }, 200); // tiny delay so users see 100%
    }
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
      }}>
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
        className="flex-row justify-between items-center border-gray-300 px-3"
        style={{ height: 56 }}>
        <TouchableOpacity
          className="flex items-center justify-center rounded-full w-9 h-9"
          onPress={() => router.back()}
          accessibilityLabel="Close">
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl text-black font-opensans-semibold text-center">
          Create Post
        </Text>
        <View className="flex items-center justify-center w-9 h-9">
          <CircularProgress
            size={28}
            strokeWidth={3}
            progress={headerProgress}
            pgColor={headerPgColor}
            bgColor={headerBgColor}
            duration={headerDuration}
            text={headerText}
            textSize={headerTextSize}
            textColor={headerPgColor}
            showRing={headerShowRing}
          />
        </View>
      </View>

      {/* Main container with stable layout */}
      <View className="flex-1" style={{ paddingBottom: getBottomPadding() }}>
        <View
          className="rounded-t-5xl flex-1 border border-black/10 border-b-0 bg-white overflow-hidden"
          onLayout={(event) => {
            layoutRef.current = event.nativeEvent.layout;
            setMainContainerLayout(event.nativeEvent.layout);
          }}>
          <ScrollView
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow gap-3 pt-3 pb-2"
            onScroll={(e) => {
              setScrollOffset(e.nativeEvent.contentOffset.y);
            }}
            scrollEventThrottle={16}>
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
                  style={{ minWidth: 0 }}>
                  <Text
                    className="text-sm font-opensans-semibold"
                    numberOfLines={1}>
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
                  <HighlightedText
                    value={text}
                    caretIndex={selection?.start ?? text.length}
                    users={mentionTrigger === "#" ? filteredUsers : USERS}
                    activeHasSuggestions={
                      mentioning && filteredUsers.length > 0
                    }
                  />
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
                  onLayout={(e) => {
                    const { x, y, width, height } = e.nativeEvent.layout;
                    setInputLayout({ x, y, w: width, h: height });
                  }}
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
                  editable={!loader}
                />
              </View>

              {/* Remove the old hidden text measurement */}
            </View>

            {image.length === 1 && (
              <View className="px-3 rounded-xl">
                {image[0].isVideo ? (
                  <FacebookStyleVideo
                    uri={image[0].uri}
                    sourceWidth={image[0].width}
                    sourceHeight={image[0].height}
                    style={{ marginBottom: 0, borderRadius: 12 }}
                    // onLongPress={...} isGestureActive={...} panGesture={...} (optional, same as image)
                  />
                ) : (
                  <FacebookStyleImage
                    uri={image[0].uri}
                    style={{ marginBottom: 0, borderRadius: 12 }}
                  />
                )}
                <Pressable
                  onPress={() => {
                    setImage([]);
                    setMediaLock(null); // allow both again
                  }}
                  hitSlop={10}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 20,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: 999,
                    padding: 6,
                  }}
                  accessibilityRole="button">
                  <Entypo name="cross" size={16} color="#fff" />
                </Pressable>
              </View>
            )}

            {image.length > 1 && (
              <CreatePostImageViewer
                images={image}
                removeImage={(idx) => {
                  setImage((prev) => {
                    const next = prev.filter((_, i) => i !== idx);
                    if (next.length === 0) setMediaLock(null);
                    return next;
                  });
                }}
              />
            )}

            {/* 🔹 Attached product chip — matches your screenshot */}
            {selectedProduct && (
              <View className="px-3">
                <View
                  className="
                    flex-row w-3/4 items-center rounded-xl bg-white border border-black/10
                    px-3 py-3
                  ">
                  {/* Left product tile */}
                  <View
                    className="
                      w-14 h-14 rounded-xl bg-white border border-neutral-200
                      items-center justify-center overflow-hidden
                    ">
                    <Image
                      source={require("../../assets/images/Product/phone.png")}
                      className="w-12 h-12"
                      resizeMode="contain"
                    />
                  </View>

                  {/* Name */}
                  <Text
                    className="flex-1 text-[16px] font-opensans-semibold text-neutral-900 ml-3"
                    numberOfLines={1}>
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
          className="bg-white flex flex-row items-center px-3 gap-2">
          {mentioning && filteredUsers.length > 0 ? (
            // When mentioning, show the Mention UI in place of the bottom selector.
            // Center it and use ~100% width so the left/right parts of the bar remain visible.
            <View style={{ width: "100%", alignItems: "center" }}>
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
            </View>
          ) : (
            // Default bottom controls when not mentioning
            <>
              <View className="flex-1 flex-row justify-between p-2.5 items-center bg-[#F2F2F4] rounded-full">
                <TouchableOpacity
                  className={`items-center justify-center ${loader ? "bg-gray-200" : "bg-white"} p-2.5 rounded-full`}
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    console.log("Camera");
                  }}>
                  <Camera width={22} height={22} />
                </TouchableOpacity>

                <TouchableOpacity
                  className={`items-center justify-center ${loader ? "bg-gray-200" : "bg-white"} p-2.5 rounded-full`}
                  onPress={pickMedia}>
                  <Gallery width={22} height={22} />
                </TouchableOpacity>

                <TouchableOpacity
                  className={`items-center justify-center ${loader ? "bg-gray-200" : "bg-white"} p-2.5 rounded-full`}
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    openProductModal();
                    console.log("GIF picker");
                  }}>
                  <Cart width={22} height={22} />
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center justify-center bg-gray-200 p-2.5 rounded-full"
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    setStatusOpen(true);
                  }}>
                  <Community width={22} height={22} />
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center justify-center bg-gray-200 p-2.5 rounded-full"
                  onPress={async () => {
                    await dismissKeyboardAndWait();
                    console.log("Location");
                  }}>
                  <Location width={22} height={22} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-black flex-row rounded-full items-center justify-center px-3 py-2.5 gap-1"
                onPress={createPost}>
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
      <StatusModal
        visible={statusOpen}
        onClose={() => setStatusOpen(false)}
        showImage={false}
        showHeading={false}
        showDescription={true}
        description="This feature is not available right now"
        showButton={false}
      />
      {/* <StatusModal
        visible={statusOpen}
        onClose={() => setStatusOpen(false)}
        // image
        showImage={true}
        // imageSource={failImg} // or leave undefined to use the red X fallback

        // heading
        showHeading={true}
        heading="Posting is Failed"
        // description
        showDescription={true}
        description="Due to some technical issue your post failed to upload. Please try again."
        // button
        showButton={true}
        buttonText="Okay"
        // close when tapping the dim background
        closeOnBackdrop={true}
      /> */}
    </View>
  );
}
