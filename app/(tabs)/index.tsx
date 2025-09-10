import BlockUserPopup from "@/components/BlockUserPopup";
import CreatePostHeader from "@/components/CreatePostHeader";
import { MultiImageCollage } from "@/components/MultiImageCollage";
import { MultiImageViewer } from "@/components/MultiImageViewer";
import PostOptionsBottomSheet from "@/components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "@/components/ReportPostBottomSheet";
import { POSTS } from "@/constants/HomeData";
import { tabBarHiddenSV } from "@/lib/tabBarVisibility";
import { SimpleLineIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  ViewToken,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
      statusBarTranslucent={true}
    >
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
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
        }}
      >
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
          }}
        >
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
            }}
          >
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
              }}
            >
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
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              Pinch to zoom • Tap to close
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ----- Facebook-style Image Component -----
const FacebookStyleImage = ({
  uri,
  style,
  onLongPress,
}: {
  uri: string;
  style?: any;
  onLongPress?: () => void;
}) => {
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const containerWidth = windowWidth - 24; // Account for padding

  // Facebook-style aspect ratio constraints
  const getClampedHeight = (originalWidth: number, originalHeight: number) => {
    const originalRatio = originalWidth / originalHeight;

    // Facebook's constraints (approximate)
    const MAX_RATIO = 1.91; // Landscape limit (1.91:1)
    const MIN_RATIO = 0.8; // Portrait limit (4:5 = 0.8)

    let clampedRatio = originalRatio;

    if (originalRatio > MAX_RATIO) {
      clampedRatio = MAX_RATIO; // Too wide, clamp to landscape limit
    } else if (originalRatio < MIN_RATIO) {
      clampedRatio = MIN_RATIO; // Too tall, clamp to portrait limit
    }

    return containerWidth / clampedRatio;
  };

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => {
        setImageSize({ width, height });
      },
      (error) => {
        console.error("Failed to get image size:", error);
        setImageSize({ width: containerWidth, height: containerWidth }); // Fallback to square
      }
    );
  }, [uri, containerWidth]);

  if (!imageSize) {
    return (
      <View
        style={[
          {
            width: containerWidth,
            height: 200,
            backgroundColor: "#f0f0f0",
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
      >
        <Text style={{ color: "#666", fontSize: 12 }}>Loading...</Text>
      </View>
    );
  }

  const clampedHeight = getClampedHeight(imageSize.width, imageSize.height);
  const originalRatio = imageSize.width / imageSize.height;
  const clampedRatio = containerWidth / clampedHeight;

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowViewer(true)}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.95}
        className="overflow-hidden bg-[#f0f0f0] w-full"
        style={[
          {
            height: clampedHeight,
          },
          style,
        ]}
      >
        <Image
          source={{ uri }}
          className="w-full h-full"
          resizeMode="cover" // This creates the Facebook "crop" effect
        />

        {/* Debug overlay */}
        {/* <View className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded">
          <Text style={{ color: "white", fontSize: 8 }}>
            {originalRatio.toFixed(2)} → {clampedRatio.toFixed(2)}
          </Text>
        </View> */}
      </TouchableOpacity>

      <FacebookImageViewer
        imageUri={uri}
        visible={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </>
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
  avatar: `https://randomuser.me/api/portraits/${i % 2 ? "women" : "men"}/${i + 1}.jpg`,
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
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
    >
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
}: {
  media?: { type: "image"; uri: string } | { type: "images"; uris: string[] };
  isVisible: boolean;
  postId: string;
  onLongPress?: () => void;
}) => {
  const [showMultiViewer, setShowMultiViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  console.log("PostMedia rendered with:", media, "isVisible:", isVisible);

  // If no media, return null
  if (!media) {
    return null;
  }

  // Handle single image
  if (media.type === "image") {
    return (
      <View style={{ marginBottom: 8 }}>
        <FacebookStyleImage
          uri={media.uri}
          style={{ marginBottom: 0 }}
          onLongPress={onLongPress}
        />
      </View>
    );
  }

  // Handle multiple images
  if (media.type === "images" && media.uris?.length) {
    return (
      <View style={{ marginBottom: 8 }}>
        <MultiImageCollage
          images={media.uris}
          onPressImage={(index) => {
            setSelectedImageIndex(index);
            setShowMultiViewer(true);
          }}
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
}: {
  item: any;
  isVisible: boolean;
  onLongPress?: (item: any) => void;
}) => {
  const router = useRouter();
  const navigating = useRef(false);

  const handleUserPress = () => {
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

  const goToProduct = useCallback(() => {
    if (navigating.current) return; // ignore re-press
    navigating.current = true;
    router.push("/Product/Productview");
    // release the lock after a short delay or on focus event
    setTimeout(() => {
      navigating.current = false;
    }, 600);
  }, [router]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={500}
    >
      <View className="px-3 mt-2 bg-[#F3F4F8]">
        <View
          style={{
            borderRadius: 16,
            elevation: Platform.OS === "android" ? 2 : 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          }}
        >
          <View
            className="bg-white py-3"
            style={{
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View className="flex-row px-3 items-center mb-2">
              {/* LEFT group takes remaining space, but doesn't overgrow */}
              <TouchableOpacity
                className="flex-row items-center flex-1 mr-2"
                onPress={handleUserPress}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.userProfilePic }}
                  className="w-13 h-13 rounded-full mr-2"
                />
                {/* REMOVE flex-1 here */}
                <View /* className="flex-1" */>
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
                </View>
              </TouchableOpacity>

              {/* RIGHT button: fixed size, don’t let it shrink */}
              {item.affiliated && item.affiliation && (
                <TouchableOpacity
                  className="w-11 h-11 rounded-lg items-center justify-center ml-2"
                  style={{ flexShrink: 0 }} // tailwind: shrink-0 (if available)
                  onPress={() => {
                    /* ... */
                  }}
                >
                  <SimpleLineIcons name="handbag" size={20} color="#000" />
                </TouchableOpacity>
              )}
            </View>

            {/* Media Display */}
            <PostMedia
              media={item.media}
              isVisible={isVisible}
              postId={item.id}
              onLongPress={() => onLongPress?.(item)}
            />

            {/* Caption */}
            {/* <Text className="text-sm  mb-2">{item.caption}</Text> */}
            <TouchableOpacity>
              <Text className="text-sm px-3 text-gray-900">
                {(item.caption || "")
                  .split(/((?:@|#)[\w.]+|(?:https?:\/\/|www\.)\S+)/gi)
                  .map((part: string, index: number) => {
                    if (part && part.startsWith("@")) {
                      return (
                        <Text
                          key={index}
                          className="text-blue-600"
                          onPress={() =>
                            router.push(
                              `/(profiles)?mentionedUsername=${part.slice(1)}`
                            )
                          }
                        >
                          {part}
                        </Text>
                      );
                    } else if (part && part.startsWith("#")) {
                      return (
                        <Text
                          key={index}
                          className="text-blue-600"
                          onPress={() =>
                            console.log("Navigate to hashtag:", part)
                          }
                        >
                          {part}
                        </Text>
                      );
                    } else if (part && /^(https?:\/\/|www\.)/i.test(part)) {
                      const url = part.startsWith("www.")
                        ? `https://${part}`
                        : part;
                      return (
                        <Text
                          key={index}
                          className="text-blue-600 underline"
                          onPress={() => Linking.openURL(url)}
                        >
                          {part}
                        </Text>
                      );
                    }
                    return part;
                  })}{" "}
              </Text>
              {item?.post_hashtags?.length ? (
                <Text className="text-blue-600 mt-1 px-3">
                  {neededHashtags.map((tag: string, i: number) => (
                    <Text
                      key={tag}
                      onPress={() =>
                        console.log("Navigate to hashtag:", "#" + tag)
                      }
                    >
                      #{tag}
                      {i < neededHashtags.length - 1 ? " " : ""}
                    </Text>
                  ))}
                </Text>
              ) : null}
            </TouchableOpacity>

            {/* Affiliation */}
            {item.affiliated && item.affiliation && (
              <TouchableOpacity className="px-3 mt-1" onPress={goToProduct}>
                <View className="flex-row gap-x-3 rounded-lg border border-gray-200">
                  <View
                    className="basis-1/4 self-stretch relative"
                    style={{
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                      overflow: "hidden",
                    }}
                  >
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
                        onPress={() => {}}
                        className="self-start"
                      >
                        <Ionicons name="cart-outline" size={24} color="#000" />
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
            )}

            {/* Actions */}
            <View className="flex-row items-center justify-between mt-3 px-3">
              <View className="flex-row items-center gap-x-4">
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="heart-outline" size={20} color="#000" />
                  <Text className="ml-1 text-sm font-medium">
                    {item.likes_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="chatbubble-outline" size={18} color="#000" />
                  <Text className="ml-1 text-sm font-medium">
                    {item.comments_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity>
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
      className="relative w-9 h-9 rounded-full items-center justify-center"
    >
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

  // Mock user data - replace with your actual user context
  const user = { id: "1", username: "current_user" };

  // Header animation state
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isFetchingNextPage] = useState(false); // You can connect this to your API loading state
  const headerTranslateY = useRef(new Animated.Value(0)).current;
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
    Animated.timing(headerTranslateY, {
      toValue: -TOP_BAR_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const showHeader = () => {
    setHeaderHidden(false);
    currentHeaderTranslateValue.current = 0;
    Animated.timing(headerTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
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
    // If the loader is active (isFetchingNextPage is true),
    // and the header is currently hidden (headerHidden is true),
    // and we are not scrolling into the top "sync" region,
    // then we should prevent the sticky logic from accidentally showing the header.
    if (isFetchingNextPage && headerHidden && currentY > TOP_BAR_HEIGHT) {
      lastScrollY.current = currentY; // Update lastScrollY
      return; // Exit early, preventing sticky logic that might show the header
    }

    // --- Proceed with normal scroll logic ---
    if (currentY <= TOP_BAR_HEIGHT) {
      // --- Phase 1: Synchronized Scroll Region ---
      if (
        !headerHidden &&
        Math.abs(currentHeaderTranslateValue.current) < 0.1 &&
        currentY > 0 &&
        delta <= 0
      ) {
        // Header is fully visible (translateY is ~0) and we are scrolling UP towards currentY = 0.
        // KEEP headerTranslateY at its current ~0 value to prevent the "vanish" jump.
        if (headerHidden) {
          setHeaderHidden(false);
        }
      } else {
        // Normal sync behavior
        const newTranslateValue = -currentY;
        headerTranslateY.setValue(newTranslateValue);
        currentHeaderTranslateValue.current = newTranslateValue;
        const isNowHiddenBySync = newTranslateValue <= -TOP_BAR_HEIGHT + 0.1;
        if (headerHidden !== isNowHiddenBySync) {
          setHeaderHidden(isNowHiddenBySync);
        }
      }
    } else {
      // --- Phase 2: Sticky Behavior Region (currentY > TOP_BAR_HEIGHT) ---
      // The `if (isFetchingNextPage && ...)` block above has already handled
      // the problematic case for this region when the loader is active.
      if (delta > HIDE_THRESHOLD && !headerHidden) {
        hideHeader();
      } else if (delta < -SHOW_THRESHOLD && headerHidden) {
        // If isFetchingNextPage was true, we would have returned early if currentY > TOP_BAR_HEIGHT.
        // So, this showHeader() call is generally safe from loader-induced triggers if far from top.
        showHeader();
      }

      // Tab bar hiding logic (independent of header)
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

  return (
    <View className="flex-1 bg-[#F3F4F8]">
      {/* ─── Animated Top Bar (Logo + Search) ─────────────────────────────────── */}
      <Animated.View
        className="absolute top-0 right-0 left-0 z-10 bg-white overflow-hidden"
        style={{
          height: TOP_BAR_HEIGHT,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        {/* Safe-area padding so that logo+search sits below notch/status bar */}
        <View style={{ paddingTop: insets.top - 10, backgroundColor: "white" }}>
          <View
            style={{
              height: NAV_BAR_CONTENT_HEIGHT,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 12,
            }}
          >
            <Text className="text-2xl font-bold">LYNKD</Text>
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity className="w-9 h-9 rounded-full items-center justify-center">
                <Ionicons name="search-outline" size={24} color="#000" />
              </TouchableOpacity>
              <NotificationBell
                count={12}
                onPress={() => {
                  /* open notifications */
                }}
              />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ─── FlatList w/ CreatePostHeader as the first visible row ────────────────── */}
      <FlatList
        ref={flatListRef}
        data={POSTS}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: handleOnScroll,
          }
        )}
        // Only pad by TOP_BAR_HEIGHT (logo+search). CreatePostHeader will render immediately below.
        contentContainerStyle={{
          top: TOP_BAR_HEIGHT,
          // paddingBottom:
          //   Platform.OS === "ios" ? footerSpacing : footerSpacing + 150,
          paddingBottom:
            Platform.OS === "ios" ? insets.bottom : insets.bottom + 120,
          backgroundColor: "#F3F4F8",
        }}
        style={{
          backgroundColor: "#F3F4F8",
        }}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            isVisible={visibleItems.includes(item.id)}
            onLongPress={handleLongPress}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4D70D1"]} // Android
            tintColor={"#4D70D1"} // iOS
            progressBackgroundColor={"#F3F4F8"} // Match background
            progressViewOffset={TOP_BAR_HEIGHT} // Position below header
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // Optimize performance for smooth scrolling
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={2}
        onEndReachedThreshold={0.5}
      />

      {/* Post Options Bottom Sheet */}
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

      {/* Report Post Bottom Sheet */}
      <ReportPostBottomSheet
        show={reportVisible}
        setShow={setReportVisible}
        postId={focusedPost?.id || ""}
        userId={user.id}
      />

      {/* Block User Popup */}
      <BlockUserPopup
        show={blockUser}
        setShow={setBlockUser}
        post={focusedPost}
      />
    </View>
  );
}
