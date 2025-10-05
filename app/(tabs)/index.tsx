import BlockUserPopup from "@/components/BlockUserPopup";
import CameraPost from "@/components/CameraPost";
import Chats from "@/components/chat/Chat";
import CommentsSheet, { CommentsSheetHandle } from "@/components/Comment";
import CreatePostHeader from "@/components/CreatePostHeader";
import { FacebookStyleImage } from "@/components/FacebookStyleImage";
import { MultiImageCollage } from "@/components/MultiImageCollage";
import { MultiImageViewer } from "@/components/MultiImageViewer";
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "@/components/ReportPostBottomSheet";
import { POSTS } from "@/constants/HomeData";
import { cameraActiveSV, tabBarHiddenSV } from "@/lib/tabBarVisibility";
import { FontAwesome6 } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { BlurView } from "expo-blur";
import { Camera } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  ViewToken,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureType,
} from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

// Define window width for calculations
const windowWidth = Dimensions.get("window").width;

// ----- Facebook-style Image Viewer Component -----
const FacebookImageViewer = ({
  imageUri,
  visible,
  onClose,
}: {
  imageUri: string;
  visible: boolean;
  onClose: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isZoomed, setIsZoomed] = useState(false);
  const insets = useSafeAreaInsets();

  // Create pinch gesture using new Gesture API
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.setValue(event.scale);
    })
    .onEnd((event) => {
      if (event.scale < 1) {
        // If zoomed out, reset to normal
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
          }),
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }),
        ]).start(() => setIsZoomed(false));
      } else if (event.scale > 1) {
        setIsZoomed(true);
      }
    });

  const handleSingleTap = () => {
    if (isZoomed) {
      // Reset zoom
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start(() => setIsZoomed(false));
    } else {
      // Close modal
      onClose();
    }
  };

  // Reset values when modal closes
  useEffect(() => {
    if (!visible) {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
      setIsZoomed(false);
    }
  }, [visible, scale, translateX, translateY]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <StatusBar
        backgroundColor="transparent"
        style="light"
        translucent={Platform.OS === "android"}
      />
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
        }}>
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: insets.top + 10,
            right: 20,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Pinch-to-zoom image */}
        <GestureDetector gesture={pinchGesture}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
            }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleSingleTap}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Animated.Image
                source={{ uri: imageUri }}
                style={{
                  width: "100%",
                  height: "100%",
                  transform: [
                    { scale: scale },
                    { translateX: translateX },
                    { translateY: translateY },
                  ],
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        {/* Zoom instruction */}
        {!isZoomed && (
          <View
            style={{
              position: "absolute",
              bottom: insets.bottom + 80,
              alignSelf: "center",
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}>
            <Text style={{ color: "white", fontSize: 12 }}>
              Pinch to zoom • Tap to close
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ----- Dummy data (replace with your API data later) -----
const STORIES = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i + 1),
  name: [
    "alex_harma",
    "jamie.870",
    "jane.math",
    "mad_max",
    "lucas",
    "jane_doe",
    "james_brown",
    "sophia_king",
    "emma_clarke",
    "lucas_williams",
  ][i],
  avatar: `https://randomuser.me/api/portraits/${i % 2 ? "women" : "men"}/${
    i + 1
  }.jpg`,
}));

// ----- Header -----
const HomeHeader = () => (
  <View className="border-b border-gray-200 px-3 pb-2">
    <View className="flex-row items-center justify-between">
      <Text className="text-xl font-bold">LYNKD</Text>
      <View className="flex-row items-center space-x-3">
        <TouchableOpacity className="w-9 h-9 rounded-full items-center justify-center">
          <Ionicons name="search-outline" size={22} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity className="w-9 h-9 rounded-full items-center justify-center relative">
          <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />
          <Ionicons name="notifications-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ----- Stories row -----
const Stories = () => (
  <View className="border-b border-gray-200">
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}>
      {STORIES.map((s) => (
        <View key={s.id} className="w-[64px] items-center mr-4">
          <View className="w-16 h-16">
            <LinearGradient
              colors={["#4D70D1", "#921EC4"]}
              className="absolute -top-[3px] -right-[3px] w-18 h-18 rounded-full"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Image
              source={{ uri: s.avatar }}
              className="w-16 h-16 rounded-full border-2 border-white"
            />
          </View>
          <Text className="text-xs text-gray-700 mt-1" numberOfLines={1}>
            {s.name}
          </Text>
        </View>
      ))}
    </ScrollView>
  </View>
);

// ----- Create post card -----
const CreatePostCard = () => (
  <View className="px-3 py-3">
    <CreatePostHeader
      onPressCreatePost={() => console.log("Create post pressed")}
    />
  </View>
);

// ----- Enhanced PostMedia Component -----
const PostMedia = ({
  media,
  isVisible,
  postId,
  onLongPress,
  isGestureActive = false,
  panGesture,
}: {
  media?: { type: "images"; uris: string[] };
  isVisible: boolean;
  postId: string;
  onLongPress?: () => void;
  isGestureActive?: boolean;
  panGesture: GestureType;
}) => {
  const [showMultiViewer, setShowMultiViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  console.log("PostMedia rendered with:", media, "isVisible:", isVisible);

  const handlePressImage = useCallback(
    (index: number) => {
      if (isGestureActive) return;
      setSelectedImageIndex(index);
      setShowMultiViewer(true);
    },
    [isGestureActive]
  );

  // If no media, return null
  if (!media) {
    return null;
  }

  // Handle single image
  if (media.type === "images" && media.uris?.length === 1) {
    return (
      <View>
        <FacebookStyleImage
          uri={media.uris[0]}
          style={{ marginBottom: 0 }}
          onLongPress={onLongPress}
          isGestureActive={isGestureActive}
          panGesture={panGesture}
        />
      </View>
    );
  }

  // Handle multiple images
  if (media.type === "images" && media.uris?.length > 1) {
    return (
      <View>
        <MultiImageCollage
          images={media.uris}
          onPressImage={handlePressImage}
          onLongPress={onLongPress}
        />

        <MultiImageViewer
          images={media.uris}
          visible={showMultiViewer}
          initialIndex={selectedImageIndex}
          onClose={() => setShowMultiViewer(false)}
        />
      </View>
    );
  }

  // Fallback for unknown media types
  return (
    <View className="w-full h-24 bg-gray-200 rounded-lg items-center justify-center mb-2">
      <Text style={{ color: "#666", fontSize: 12 }}>
        Unsupported media type
      </Text>
    </View>
  );
};

// ----- Post card -----
const PostCard = ({
  item,
  isVisible,
  onLongPress,
  isGestureActive = false,
  panGesture,
  onPressComments,
}: {
  item: any;
  isVisible: boolean;
  onLongPress?: (item: any) => void;
  isGestureActive?: boolean;
  panGesture: GestureType;
  onPressComments?: (post: any) => void;
}) => {
  const router = useRouter();
  const navigating = useRef(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const openPostOptions = React.useCallback(() => {
    Vibration.vibrate(100);
    onLongPress?.(item); // the same callback you're passing to the card
  }, [item, onLongPress]);

  // Debug: log when isGestureActive changes
  useEffect(() => {
    console.log(
      `PostCard ${item.id} - isGestureActive changed to:`,
      isGestureActive
    );
  }, [isGestureActive, item.id]);

  const handleUserPressSafe = () => {
    // optional: block while a horizontal gesture is active
    if (isGestureActive) return;

    router.push({
      pathname: "/(profiles)" as any,
      params: {
        user: item.user_id as number,
        username: item.username,
      },
    });
  };

  const getHashtagsWithinLimit = (hashtags: string[], limit = 50) => {
    let totalLength = 0;
    if (!hashtags) return [];

    return hashtags.filter((tag) => {
      totalLength += tag.length + 1; // +1 for the # symbol
      return totalLength <= limit;
    });
  };

  const neededHashtags = getHashtagsWithinLimit(item.post_hashtags || []);

  const goToProductSafe = () => {
    if (isGestureActive) return; // prop/JS state check in JS
    if (navigating.current) return;
    navigating.current = true;
    router.push("/Product/Productview");
    setTimeout(() => {
      navigating.current = false;
    }, 600);
  };

  const makeTapThatYieldsToPan = (onEnd: () => void) =>
    Gesture.Tap()
      .maxDuration(220)
      .maxDeltaX(10)
      .maxDeltaY(10)
      .requireExternalGestureToFail(panGesture)
      .onEnd((_e, success) => {
        "worklet";
        if (success) {
          // hop to JS before calling anything that touches React/router
          // runOnJS(onEnd)();
          scheduleOnRN(onEnd);
        }
      });

  const openProductTap = makeTapThatYieldsToPan(goToProductSafe);
  const openProfileTap = makeTapThatYieldsToPan(handleUserPressSafe);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={500}>
      <View className="px-3 mt-2 bg-[#F3F4F8]">
        <View
          style={{
            borderRadius: 16,
            elevation: Platform.OS === "android" ? 2 : 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          }}>
          <View
            className="bg-white py-3 gap-2.5"
            style={{
              borderRadius: 16,
              overflow: "hidden",
            }}>
            {/* Header */}
            <View className="flex-row px-3 items-center h-10">
              {/* LEFT group takes remaining space, but doesn't overgrow */}
              <GestureDetector gesture={openProfileTap}>
                <TouchableOpacity
                  className="flex-row items-center flex-1 mr-2"
                  // onPress={isGestureActive ? undefined : handleUserPressSafe}
                  activeOpacity={0.7}
                  disabled={isGestureActive}>
                  <Image
                    source={{ uri: item.userProfilePic }}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  {/* REMOVE flex-1 here */}
                  <View>
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-lg">
                        {item.username}
                      </Text>
                      {item.is_creator && (
                        <Octicons
                          name="verified"
                          size={14}
                          color="#000"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    <View className="flex-row items-center">
                      {item.location && (
                        <Text className="text-xs text-[#257AF1] mr-2 font-opensans-regular">
                          {item.location}
                        </Text>
                      )}
                      <View className="w-1 h-1 rounded-full bg-black mr-1.5" />
                      {item.postDate && (
                        <Text className="text-xs text-black font-opensans-regular">
                          {item.postDate}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </GestureDetector>

              {/* RIGHT button: fixed size, don’t let it shrink */}
              {item.affiliated && item.affiliation && (
                <View />
                // <TouchableOpacity
                //   className="w-11 h-11 rounded-lg items-center justify-center ml-2"
                //   style={{ flexShrink: 0 }} // tailwind: shrink-0 (if available)
                //   onPress={
                //     isGestureActive
                //       ? undefined
                //       : () => {
                //           /* ... */
                //         }
                //   }
                //   disabled={isGestureActive}
                // >
                //   <SimpleLineIcons name="handbag" size={20} color="#000" />
                // </TouchableOpacity>
              )}
            </View>

            {/* Media Display */}
            <PostMedia
              media={item.media}
              isVisible={isVisible}
              postId={item.id}
              onLongPress={() => onLongPress?.(item)}
              isGestureActive={isGestureActive}
              panGesture={panGesture}
            />

            {/* Caption */}
            {/* <Text className="text-sm  mb-2">{item.caption}</Text> */}
            <View>
              {(() => {
                const caption = item.caption || "";
                const captionLimit = 150; // Character limit before showing "more"
                const shouldTruncate = caption.length > captionLimit;
                const displayCaption =
                  shouldTruncate && !showFullCaption
                    ? caption.substring(0, captionLimit)
                    : caption;

                return (
                  <View>
                    <Text className="text-sm px-3 text-gray-900">
                      {displayCaption
                        .split(/((?:@|#)[\w.]+|(?:https?:\/\/|www\.)\S+)/gi)
                        .map((part: string, index: number) => {
                          if (part && part.startsWith("@")) {
                            return (
                              <Text
                                key={index}
                                className="text-blue-600"
                                suppressHighlighting
                                onPress={
                                  isGestureActive
                                    ? undefined
                                    : () =>
                                        router.push(
                                          `/(profiles)?mentionedUsername=${part.slice(
                                            1
                                          )}`
                                        )
                                }
                                onLongPress={openPostOptions}>
                                {part}
                              </Text>
                            );
                          } else if (part && part.startsWith("#")) {
                            return (
                              <Text
                                key={index}
                                className="text-blue-600"
                                suppressHighlighting
                                onPress={
                                  isGestureActive
                                    ? undefined
                                    : () =>
                                        console.log(
                                          "Navigate to hashtag:",
                                          part
                                        )
                                }
                                onLongPress={openPostOptions}>
                                {part}
                              </Text>
                            );
                          } else if (
                            part &&
                            /^(https?:\/\/|www\.)/i.test(part)
                          ) {
                            const url = part.startsWith("www.")
                              ? `https://${part}`
                              : part;
                            return (
                              <Text
                                key={index}
                                className="text-blue-600 underline"
                                suppressHighlighting
                                onPress={
                                  isGestureActive
                                    ? undefined
                                    : () => Linking.openURL(url)
                                }
                                onLongPress={openPostOptions}>
                                {part}
                              </Text>
                            );
                          }
                          return part;
                        })}
                    </Text>
                    {shouldTruncate && !showFullCaption && (
                      <Pressable
                        onPress={
                          isGestureActive
                            ? undefined
                            : () => setShowFullCaption(true)
                        }
                        hitSlop={8}
                        style={{ marginLeft: 2, alignSelf: "baseline" }}
                        onLongPress={openPostOptions}
                        delayLongPress={500}>
                        <Text className="text-sm text-gray-500 px-3 font-medium">
                          Show more
                        </Text>
                      </Pressable>
                    )}

                    {shouldTruncate && showFullCaption && (
                      <Pressable
                        onPress={
                          isGestureActive
                            ? undefined
                            : () => setShowFullCaption(false)
                        }
                        hitSlop={8}
                        style={{ marginLeft: 2, alignSelf: "baseline" }}
                        onLongPress={openPostOptions}
                        delayLongPress={500}>
                        <Text className="text-sm text-gray-500 px-3 font-medium">
                          Show less
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })()}
              {item?.post_hashtags?.length ? (
                <Text className="text-blue-600 mt-1 px-3">
                  {neededHashtags.map((tag: string, i: number) => (
                    <Text
                      key={tag}
                      onPress={
                        isGestureActive
                          ? undefined
                          : () => console.log("Navigate to hashtag:", "#" + tag)
                      }>
                      #{tag}
                      {i < neededHashtags.length - 1 ? " " : ""}
                    </Text>
                  ))}
                </Text>
              ) : null}
            </View>

            {/* Affiliation */}
            {item.affiliated && item.affiliation && (
              <GestureDetector gesture={openProductTap}>
                <TouchableOpacity
                  className="px-3"
                  onLongPress={() => onLongPress?.(item)}
                  delayLongPress={500}
                  disabled={isGestureActive}>
                  <View className="flex-row gap-x-3 rounded-lg border border-gray-200">
                    <View
                      className="basis-1/4 self-stretch relative"
                      style={{
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                        overflow: "hidden",
                      }}>
                      <Image
                        source={{ uri: item.affiliation.productImage }}
                        // Fill the wrapper's full height & width
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                        }}
                        resizeMode="cover"
                        onError={(e) => {
                          console.log(
                            "Product image error:",
                            e.nativeEvent.error
                          );
                          console.log(
                            "Product image URI:",
                            item.affiliation.productImage
                          );
                        }}
                        onLoad={() =>
                          console.log(
                            "Product image loaded:",
                            item.affiliation.productImage
                          )
                        }
                      />
                    </View>
                    <View className="flex-1 justify-between p-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row flex-1 items-center">
                          <Image
                            source={{ uri: item.affiliation.brandLogo }}
                            className="w-11 h-11 rounded-full mr-2"
                            resizeMode="contain"
                            onError={(e) => {
                              console.log(
                                "Brand logo error:",
                                e.nativeEvent.error
                              );
                              console.log(
                                "Brand logo URI:",
                                item.affiliation.brandLogo
                              );
                            }}
                            onLoad={() =>
                              console.log(
                                "Brand logo loaded:",
                                item.affiliation.brandLogo
                              )
                            }
                          />
                          <View className="flex-1">
                            <Text className="font-semibold text-sm text-gray-800">
                              {item.affiliation.brandName}
                            </Text>
                            <Text className="font-medium text-sm text-black">
                              {item.affiliation.productName}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={isGestureActive ? undefined : () => {}}
                          className="self-start"
                          disabled={isGestureActive}>
                          <Ionicons
                            name="cart-outline"
                            size={24}
                            color="#000"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-sm text-gray-600 mb-2 leading-4">
                        {item.affiliation.productDescription}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-400 line-through mr-2">
                          ₹{item.affiliation.productRegularPrice}
                        </Text>
                        <Text className="text-sm font-bold text-green-600">
                          ₹{item.affiliation.productSalePrice}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </GestureDetector>
            )}

            {/* Actions */}
            <View className="flex-row items-center justify-between px-3">
              <View className="flex-row items-center gap-x-4">
                <TouchableOpacity
                  className="flex-row items-center"
                  disabled={isGestureActive}
                  onPress={isGestureActive ? undefined : undefined}>
                  <Ionicons name="heart-outline" size={20} color="#000" />
                  <Text className="ml-1 text-sm font-medium">
                    {item.likes_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center"
                  disabled={isGestureActive}
                  onPress={isGestureActive ? undefined : undefined}>
                  <Ionicons name="chatbubble-outline" size={18} color="#000" />
                  <Text className="ml-1 text-sm font-medium">
                    {item.comments_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isGestureActive}
                  onPress={isGestureActive ? undefined : undefined}>
                  <Ionicons name="arrow-redo-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const NotificationBell = ({
  count = 0,
  onPress,
}: {
  count?: number;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="relative w-9 h-9 rounded-full items-center justify-center">
      <Ionicons name="notifications-outline" size={24} color="#000" />

      {count > 0 && (
        <View
          className="absolute -top-1 -right-1 bg-black rounded-full h-6 w-6 px-1
                     items-center justify-center border border-white"
          // If your Tailwind doesn't support min-w, use style={{ minWidth: 16 }}
        >
          <Text className="text-white text-[10px] font-bold">
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ----- Screen -----
export default function ConsumerHomeUI() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const NAV_BAR_CONTENT_HEIGHT = 56;
  const TOP_BAR_HEIGHT = insets.top - 10 + NAV_BAR_CONTENT_HEIGHT;
  const flatListRef = useRef<FlatList>(null);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  // Post options state
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [blockUser, setBlockUser] = useState(false);
  const [focusedPost, setFocusedPost] = useState<any>(null);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  // Camera active state: only mount/start CameraPost when true
  const [cameraActive, setCameraActive] = useState(false);

  // Mock user data - replace with your actual user context
  const user = { id: "1", username: "current_user" };

  // Header animation state
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isFetchingNextPage] = useState(false); // You can connect this to your API loading state
  // Use Reanimated shared value for header translation
  const headerTranslateY = useSharedValue(0);
  const lastScrollY = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentHeaderTranslateValue = useRef(0); // Track current header position
  const [refreshing, setRefreshing] = React.useState(false);

  // Tab bar hiding state
  const [tabBarHidden, setTabBarHidden] = useState(false);

  // Scroll behavior constants
  const HIDE_THRESHOLD = 10; // pixels to scroll down before hiding header
  const SHOW_THRESHOLD = 10; // pixels to scroll up before showing header
  const TAB_BAR_HIDE_THRESHOLD = 50; // pixels to scroll down before hiding tab bar
  const TAB_BAR_SHOW_THRESHOLD = 30; // pixels to scroll up before showing tab bar
  // Header animation functions
  const hideHeader = () => {
    setHeaderHidden(true);
    currentHeaderTranslateValue.current = -TOP_BAR_HEIGHT;
    headerTranslateY.value = withTiming(-TOP_BAR_HEIGHT, {
      duration: 200,
    });
  };

  const showHeader = () => {
    setHeaderHidden(false);
    currentHeaderTranslateValue.current = 0;
    headerTranslateY.value = withTiming(0, {
      duration: 200,
    });
  };

  // Tab bar animation functions
  const hideTabBar = () => {
    setTabBarHidden(true);
    tabBarHiddenSV.value = true;
  };

  const showTabBar = () => {
    setTabBarHidden(false);
    tabBarHiddenSV.value = false;
  };

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const cameraResponse = await Camera.requestCameraPermissionsAsync();
        const mediaLibraryResponse =
          await MediaLibrary.requestPermissionsAsync();

        if (cameraResponse.status !== "granted") {
          console.warn("Camera permission not granted");
        }
        if (mediaLibraryResponse.status !== "granted") {
          console.warn("Media library permission not granted");
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
      }
    };

    requestPermissions();
  }, []);

  // Ensure tab bar is visible when component mounts/unmounts
  useEffect(() => {
    // Show tab bar when component mounts
    showTabBar();

    // Cleanup: show tab bar when component unmounts
    return () => {
      tabBarHiddenSV.value = false;
    };
  }, []);

  const handleOnScroll = (event: any) => {
    const currentRawY = event.nativeEvent.contentOffset.y;
    const currentY = Math.max(0, currentRawY); // Ensure currentY is not negative

    const delta = currentY - lastScrollY.current;

    // --- Prevent header from showing due to loader appearance ---
    if (isFetchingNextPage && headerHidden && currentY > TOP_BAR_HEIGHT) {
      lastScrollY.current = currentY;
      return;
    }

    if (currentY <= TOP_BAR_HEIGHT) {
      if (
        !headerHidden &&
        Math.abs(currentHeaderTranslateValue.current) < 0.1 &&
        currentY > 0 &&
        delta <= 0
      ) {
        if (headerHidden) {
          setHeaderHidden(false);
        }
      } else {
        const newTranslateValue = -currentY;
        headerTranslateY.value = newTranslateValue;
        currentHeaderTranslateValue.current = newTranslateValue;
        const isNowHiddenBySync = newTranslateValue <= -TOP_BAR_HEIGHT + 0.1;
        if (headerHidden !== isNowHiddenBySync) {
          setHeaderHidden(isNowHiddenBySync);
        }
      }
    } else {
      if (delta > HIDE_THRESHOLD && !headerHidden) {
        hideHeader();
      } else if (delta < -SHOW_THRESHOLD && headerHidden) {
        showHeader();
      }

      if (delta > TAB_BAR_HIDE_THRESHOLD && !tabBarHidden) {
        hideTabBar();
      } else if (delta < -TAB_BAR_SHOW_THRESHOLD && tabBarHidden) {
        showTabBar();
      }
    }
    lastScrollY.current = currentY;
  };

  // Handle viewable items change to track which posts are visible
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      console.log("Viewable items changed:", viewableItems.length);
      const visiblePostIds = viewableItems
        .map((item) => item.item?.id)
        .filter(Boolean);

      console.log("Visible post IDs:", visiblePostIds);
      setVisibleItems(visiblePostIds);
    },
    []
  );

  // Configure viewability for auto-play (item needs to be at least 60% visible)
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  // Post options helper functions
  const toggleFollow = useCallback(
    async (userId: string) => {
      const isFollowing = followedUsers.includes(userId);
      try {
        Vibration.vibrate(100);
        console.log(isFollowing ? "Unfollowing" : "Following", userId);
        // Add your follow/unfollow API call here

        setFollowedUsers((prev) =>
          isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
      } catch (error) {
        console.error(`Error toggling follow for user ${userId}:`, error);
      }
    },
    [followedUsers]
  );

  const deletePost = useCallback(async (postId: string) => {
    try {
      console.log("Deleting post:", postId);
      // Add your delete post API call here
      setPostOptionsVisible(false);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }, []);

  const handleLongPress = useCallback((item: any) => {
    Vibration.vibrate(100);
    console.log("Long press on post:", item.id);
    setFocusedPost(item);
    setPostOptionsVisible(true);
  }, []);

  // const tabBarHeight = useBottomTabBarHeight();
  // const footerSpacing = tabBarHeight;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const { width } = Dimensions.get("window");
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  const [commentsPost, setCommentsPost] = useState<any>(null);
  const [shouldNavigateToChat, setShouldNavigateToChat] = useState(false);

  // ref to control the modal
  const commentsRef = useRef<CommentsSheetHandle>(null);

  // open handler passed down to PostCard
  const openComments = useCallback((post: any) => {
    setCommentsPost(post);
    commentsRef.current?.present();
  }, []);

  // Handle navigation to chat after gesture completes
  useEffect(() => {
    if (shouldNavigateToChat) {
      router.push("/(tabs)/chat");
      setShouldNavigateToChat(false);
    }
  }, [shouldNavigateToChat, router]);

  // Debug gesture state
  useEffect(() => {
    console.log("isGestureActiveState changed to:", isGestureActiveState);
  }, [isGestureActiveState]);

  // Safety mechanism to reset gesture state if it gets stuck
  useEffect(() => {
    if (isGestureActiveState) {
      const timeout = setTimeout(() => {
        console.log("Safety reset: Force resetting gesture state");
        setIsGestureActiveState(false);
      }, 3000); // Reset after 3 seconds if still active

      return () => clearTimeout(timeout);
    }
  }, [isGestureActiveState]);

  const panGesture = Gesture.Pan()
    .failOffsetY([-15, 15]) // Increased from 10 to 15
    .activeOffsetX([-25, 25]) // Increased from 10 to 25
    .maxPointers(1)
    // .enabled(!cameraActive)
    .onStart(() => {
      startX.value = translateX.value;
      isGestureActive.value = false;
      // Always reset gesture state on start
      // runOnJS(setIsGestureActiveState)(false);
      scheduleOnRN(setIsGestureActiveState, false);
    })
    .onUpdate((e) => {
      const translationX = Number.isFinite(e.translationX) ? e.translationX : 0;
      const currentStartX = Number.isFinite(startX.value) ? startX.value : 0;

      // Mark gesture as active if there's significant movement (increased threshold)
      if (Math.abs(translationX) > 40) {
        // Increased from 20 to 40
        if (!isGestureActive.value) {
          isGestureActive.value = true;
          // runOnJS(setIsGestureActiveState)(true);
          scheduleOnRN(setIsGestureActiveState, true);
          console.log("Gesture became active, blocking touches");
        }
      }

      const next = Math.max(
        -width,
        Math.min(width, currentStartX + translationX)
      );
      translateX.value = next;
    })
    .onEnd((e) => {
      const translationX = Number.isFinite(e.translationX) ? e.translationX : 0;
      const vx = Number.isFinite(e.velocityX) ? e.velocityX : 0;
      const currentStartX = Number.isFinite(startX.value) ? startX.value : 0;

      let targetPosition = 0;

      const startedFromCenter = Math.abs(currentStartX) < width * 0.1;
      const startedFromLeft = currentStartX < -width * 0.5; // Chat underlay
      const startedFromRight = currentStartX > width * 0.5; // AI underlay

      if (startedFromCenter) {
        const swipeThreshold = width * 0.25;
        const velocityThreshold = 500;

        if (translationX > swipeThreshold || vx > velocityThreshold) {
          // swipe right -> POST underlay
          targetPosition = width;
          // runOnJS(setCameraActive)(true);
          tabBarHiddenSV.value = true; // hide tab bar when swiping to POST
        } else if (translationX < -swipeThreshold || vx < -velocityThreshold) {
          // swipe left -> Chat underlay
          targetPosition = -width;
          scheduleOnRN(setShouldNavigateToChat, true);
        } else {
          targetPosition = 0; // stay centered
        }
      } else if (startedFromRight) {
        // POST underlay: ONLY allow left-swipe to go back
        const minSwipe = width * 0.12;
        const minVelocity = 250;

        if (translationX < -minSwipe || vx < -minVelocity) {
          targetPosition = 0; // left swipe -> center
          tabBarHiddenSV.value = false;
        } else {
          targetPosition = width; // ignore right swipe -> stay on POST
        }
      } else if (startedFromLeft) {
        // Chat underlay: ONLY allow right-swipe to go back
        const minSwipe = width * 0.12;
        const minVelocity = 250;

        if (translationX > minSwipe || vx > minVelocity) {
          targetPosition = 0; // right swipe -> center
        } else {
          targetPosition = -width; // ignore left swipe -> stay on Chat
        }
      }

      translateX.value = withSpring(targetPosition, {
        damping: 15,
        stiffness: 160,
      });

      // If we ended on the POST underlay (targetPosition === width) then
      // activate the camera; otherwise deactivate it. Set both the React
      // state (for mounting) and the shared value (for UI-thread animations).
      const activate = targetPosition === width;
      cameraActiveSV.value = activate;
      scheduleOnRN(setCameraActive, activate);

      isGestureActive.value = false;
      // runOnJS(setIsGestureActiveState)(false);
      scheduleOnRN(setIsGestureActiveState, false);
    });

  // --- STYLES ---
  const feedStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [{ translateX: safeTranslateX }],
        zIndex: 2,
      };
    } catch (error) {
      console.warn("Error in feedStyle:", error);
      return {
        transform: [{ translateX: 0 }],
        zIndex: 2,
      };
    }
  });

  const rightUnderlayStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [
          {
            translateX: interpolate(
              safeTranslateX,
              [0, width],
              [-width, 0],
              Extrapolation.CLAMP
            ),
          },
        ],
        opacity: interpolate(
          safeTranslateX,
          [0, width],
          [0, 1],
          Extrapolation.CLAMP
        ),
        zIndex: 0,
      };
    } catch (error) {
      console.warn("Error in rightUnderlayStyle:", error);
      return {
        transform: [{ translateX: -width }],
        opacity: 0,
        zIndex: 0,
      };
    }
  });

  const leftUnderlayStyle = useAnimatedStyle(() => {
    try {
      const safeTranslateX = Number.isFinite(translateX.value)
        ? translateX.value
        : 0;
      return {
        transform: [
          {
            translateX: interpolate(
              safeTranslateX,
              [-width, 0],
              [0, width],
              Extrapolation.CLAMP
            ),
          },
        ],
        opacity: interpolate(
          safeTranslateX,
          [-width, 0],
          [1, 0],
          Extrapolation.CLAMP
        ),
        zIndex: 0,
      };
    } catch (error) {
      console.warn("Error in leftUnderlayStyle:", error);
      return {
        transform: [{ translateX: width }],
        opacity: 0,
        zIndex: 0,
      };
    }
  });

  const ChatUnderlay = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f8f9fa",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: insets.top + 60,
      }}>
      <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
        <Ionicons
          name="chatbubbles"
          size={48}
          color="#4D70D1"
          style={{ marginBottom: 16 }}
        />
        <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 8 }}>
          Messages
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#666",
            textAlign: "center",
            marginBottom: 24,
          }}>
          Connect with friends and discover new conversations
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#4D70D1",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
          onPress={() => {
            // Navigate to actual chat screen or back to center
            router.push("/(tabs)/chat");
          }}>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
            Open Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            translateX.value = withSpring(0, {
              damping: 15,
              stiffness: 160,
            });
          }}>
          <Text style={{ color: "#666", fontSize: 14 }}>← Back to Feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const snapToCenter = () => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 160 });
    tabBarHiddenSV.value = false;
    // ensure camera is deactivated when snapping back to feed
    setCameraActive(false);
    cameraActiveSV.value = false;
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View style={{ flex: 1 }}>
        <StatusBar
          backgroundColor="transparent"
          style="dark"
          translucent={Platform.OS === "android"}
        />
        {/* UNDERLAYS — rendered first so they sit behind the feed */}
        <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            rightUnderlayStyle,
            { zIndex: 3 },
          ]}
          pointerEvents="auto">
          <CameraPost onBackToFeed={snapToCenter} active={cameraActive} />
        </Reanimated.View>

        <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            leftUnderlayStyle,
          ]}
          pointerEvents="auto">
          {/* Chats screen */}
          <Chats />
        </Reanimated.View>

        {/* FEED ON TOP */}
        <Reanimated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            feedStyle,
            { zIndex: 1 },
          ]}
          pointerEvents="auto">
          <View className="flex-1 bg-[#F3F4F8]">
            {/* Top bar */}
            <Reanimated.View
              className="absolute top-0 right-0 left-0 z-10 bg-white overflow-hidden"
              style={[
                {
                  height: TOP_BAR_HEIGHT,
                },
                headerAnimatedStyle,
              ]}>
              <View
                style={{
                  paddingTop: insets.top - 10,
                  backgroundColor: "white",
                }}>
                <View
                  style={{
                    height: NAV_BAR_CONTENT_HEIGHT,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 12,
                  }}>
                  <Text className="text-2xl font-bold">LYNKD</Text>
                  <View className="flex-row items-center space-x-3">
                    <TouchableOpacity
                      className="w-9 h-9 rounded-full items-center justify-center"
                      onPress={() => {
                        router.push("/(search)");
                      }}>
                      <Ionicons name="search-outline" size={24} color="#000" />
                    </TouchableOpacity>
                    <NotificationBell
                      count={12}
                      onPress={() => {
                        router.push("/(notifications)");
                      }}
                    />
                  </View>
                </View>
              </View>
            </Reanimated.View>

            {/* Feed list */}
            <FlatList
              ref={flatListRef}
              data={POSTS}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false, listener: handleOnScroll }
              )}
              contentContainerStyle={{
                // On Android we add paddingTop so the feed content sits below
                // the absolute header. On iOS we use contentInset/contentOffset
                // so RefreshControl positions correctly.
                paddingTop: Platform.OS === "android" ? TOP_BAR_HEIGHT : 0,
                paddingBottom:
                  Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
                backgroundColor: "#F3F4F8",
              }}
              // On iOS, use contentInset/contentOffset so RefreshControl is
              // positioned relative to the scrollable area (appears under our
              // absolute header). contentContainerStyle.top doesn't affect
              // RefreshControl coordinates reliably on iOS.
              contentInset={
                Platform.OS === "ios" ? { top: TOP_BAR_HEIGHT } : undefined
              }
              contentOffset={
                Platform.OS === "ios" ? { x: 0, y: -TOP_BAR_HEIGHT } : undefined
              }
              // iOS-specific behaviour to keep the refresh spinner visible
              contentInsetAdjustmentBehavior={
                Platform.OS === "ios" ? "never" : undefined
              }
              bounces={true}
              alwaysBounceVertical={true}
              style={{ backgroundColor: "#F3F4F8" }}
              renderItem={({ item }) => (
                <PostCard
                  item={item}
                  isVisible={visibleItems.includes(item.id)}
                  onLongPress={handleLongPress}
                  isGestureActive={isGestureActiveState}
                  panGesture={panGesture}
                  onPressComments={openComments}
                />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#4D70D1"]}
                  tintColor={"#4D70D1"}
                  progressBackgroundColor={"#F3F4F8"}
                  // On iOS we offset the progress so the spinner appears below
                  // the header; on Android the value is used as a fallback.
                  progressViewOffset={
                    Platform.OS === "ios" ? TOP_BAR_HEIGHT + 8 : TOP_BAR_HEIGHT
                  }
                />
              }
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              removeClippedSubviews
              maxToRenderPerBatch={2}
              windowSize={3}
              initialNumToRender={2}
              onEndReachedThreshold={0.5}
            />

            {/* Bottom sheets / popups */}
            <PostOptionsBottomSheet
              show={postOptionsVisible}
              setShow={setPostOptionsVisible}
              setBlockUser={setBlockUser}
              setReportVisible={setReportVisible}
              setFocusedPost={setFocusedPost}
              toggleFollow={() => toggleFollow(focusedPost?.user_id || "")}
              isFollowing={followedUsers.includes(focusedPost?.user_id || "")}
              focusedPost={focusedPost}
              deleteAction={deletePost}
              user={user}
            />

            <CommentsSheet ref={commentsRef} snapPoints={["40%", "85%"]} />

            <ReportPostBottomSheet
              show={reportVisible}
              setShow={setReportVisible}
              postId={focusedPost?.id || ""}
              userId={user.id}
            />

            <BlockUserPopup
              show={blockUser}
              setShow={setBlockUser}
              post={focusedPost}
            />
          </View>
        </Reanimated.View>
        {/* Floating post button - stays visible above tab bar and moves with it */}
        <Reanimated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            zIndex: 20,
          }}>
          {/* Animated container to move the button up/down when tab bar hides/shows */}
          <FloatingPostButton
            insets={insets}
            onPressFab={() => router.push("/(compose)/post-create")}
          />
        </Reanimated.View>
      </Reanimated.View>
    </GestureDetector>
  );
}

// Floating post button component placed in this file so change stays limited to (tabs)/index.tsx
function FloatingPostButton({
  insets,
  onPressFab,
}: {
  insets: { bottom: number };
  onPressFab?: () => void;
}) {
  const { bottom } = insets;

  // derive a reanimated value directly from the global mutable shared values
  const shouldHide = useDerivedValue(() => {
    // hide when either the tab bar is hidden OR the camera underlay is active
    return !!tabBarHiddenSV.value || !!cameraActiveSV.value;
  });

  // Mirror the CustomTabBar constants so movement is identical
  const BUTTON_LIFT = Platform.OS === "ios" ? 15 : 35;
  const ANIM_DURATION = 180;

  const animatedStyle = useAnimatedStyle(() => {
    // when shouldHide -> translate down off-screen and fade out
    const translateY = shouldHide.value
      ? withTiming(BUTTON_LIFT + (bottom || 0) + 24, {
          duration: ANIM_DURATION,
        })
      : withTiming(-(BUTTON_LIFT + (bottom || 0)), { duration: ANIM_DURATION });
    const opacity = shouldHide.value
      ? withTiming(0, { duration: ANIM_DURATION })
      : withTiming(1, { duration: ANIM_DURATION });
    return {
      transform: [{ translateY }],
      opacity,
      // align on the right, keep center alignment for inner content
      alignItems: "flex-end",
    } as any;
  });

  return (
    <Reanimated.View style={animatedStyle}>
      <View
        className="items-end pr-4"
        style={{ paddingBottom: insets.bottom }}
        pointerEvents="box-none">
        <Pressable
          onPress={() => onPressFab?.()}
          className="w-14 h-14 rounded-full overflow-hidden items-center justify-center shadow-lg">
          <BlurView
            intensity={60}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            className="absolute inset-0"
          />

          {/* subtle glass tint + border like Figma */}
          <View className="absolute inset-0 rounded-full bg-white/20" />

          <FontAwesome6 name="plus" size={28} color="#000" />
        </Pressable>
      </View>
    </Reanimated.View>
  );
}
