import CreatePostHeader from "@/components/CreatePostHeader";
import { ResponsiveVideoPlayer } from "@/components/ResponsiveVideoPlayer";
import { SimpleLineIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Define a custom interface for the video status
const windowWidth = Dimensions.get("window").width;

// Custom hook to load local assets with Android compatibility
const useAssetUri = (
  assetName: string | null,
  isLocalAsset: boolean = false
) => {
  const [uri, setUri] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If it's not a local asset, just return the provided URI
    if (!isLocalAsset) {
      setUri(assetName || "");
      return;
    }

    // If no asset name provided for local asset, return empty
    if (!assetName) {
      setUri("");
      return;
    }

    setIsLoading(true);

    try {
      // Load the asset based on the asset name
      let asset: Asset;
      if (assetName === "dummyVerticalVideo") {
        asset = Asset.fromModule(
          require("../../assets/videos/dummyVerticalVideo.mp4")
        );
      } else if (assetName === "dummyHorizintalVideo") {
        asset = Asset.fromModule(
          require("../../assets/videos/dummyHorizintalVideo.mp4")
        );
      } else {
        console.warn("Unknown local asset:", assetName);
        setUri("");
        setIsLoading(false);
        return;
      }

      // For Android, try different URI formats
      const loadAsset = async () => {
        try {
          if (asset.localUri) {
            // Asset already downloaded
            console.log("Using cached asset:", asset.localUri);
            setUri(asset.localUri);
            setIsLoading(false);
            return;
          }

          if (Platform.OS === "android") {
            // On Android, try using the asset directly without downloading first
            console.log("Android: Using asset URI directly:", asset.uri);
            setUri(asset.uri || "");
            setIsLoading(false);
            return;
          }

          // For iOS or if direct access fails, download the asset
          await asset.downloadAsync();
          console.log("Asset downloaded:", asset.localUri || asset.uri);
          setUri(asset.localUri || asset.uri || "");
          setIsLoading(false);
        } catch (error) {
          console.error("Failed to load asset:", error);
          console.log("Trying fallback asset URI:", asset.uri);
          setUri(asset.uri || "");
          setIsLoading(false);
        }
      };

      loadAsset();
    } catch (error) {
      console.error("Asset loading error:", error);
      setUri("");
      setIsLoading(false);
    }
  }, [assetName, isLocalAsset]);

  return { uri, isLoading };
};

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
    >
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: 50,
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
              bottom: 100,
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
const FacebookStyleImage = ({ uri, style }: { uri: string; style?: any }) => {
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
            borderRadius: 8,
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
        activeOpacity={0.95}
        style={[
          {
            width: containerWidth,
            height: clampedHeight,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#f0f0f0",
          },
          style,
        ]}
      >
        <Image
          source={{ uri }}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover" // This creates the Facebook "crop" effect
        />

        {/* Debug overlay */}
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
          }}
        >
          <Text style={{ color: "white", fontSize: 8 }}>
            {originalRatio.toFixed(2)} → {clampedRatio.toFixed(2)}
          </Text>
        </View>
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

// Enhanced post data with diverse video aspect ratios for testing
const POSTS = [
  {
    id: "p1",
    username: "alex_harma",
    is_creator: true,
    userProfilePic: "https://randomuser.me/api/portraits/men/32.jpg",
    caption:
      "Weekend drip with the new #AirMax — comfy and clean. Check this out: https://nike.example",
    likes_count: 128,
    comments_count: 22,
    media: {
      type: "image",
      uri: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    affiliated: true,
    affiliation: {
      brandName: "Nike",
      brandLogo:
        "https://static.nike.com/a/images/t_PDP_864_v1,f_auto,q_auto:eco/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/9d61194f-36de-48ea-b2b7-60b51e52b6e2/jordan-franchise-slides-lXc9nK.png",
      productName: "Air Max 270",
      productDescription:
        "Lightweight comfort with a sleek profile for everyday wear.",
      productImage:
        "https://static.nike.com/a/images/t_PDP_864_v1,f_auto,q_auto:eco/e0ifdacemu8dbiyveth6/dri-fit-mens-fitness-t-shirt-nhgSHx.png",
      productRegularPrice: 14990,
      productSalePrice: 12990,
    },
  },
  {
    id: "p2",
    username: "alex_harma",
    is_creator: true,
    userProfilePic: "https://randomuser.me/api/portraits/men/32.jpg",
    caption:
      "Weekend drip with the new #AirMax — comfy and clean. Check this out: https://nike.example",
    likes_count: 128,
    comments_count: 22,
    media: {
      type: "image",
      uri: "https://media.gettyimages.com/id/2160799152/photo/hamburg-germany-cristiano-ronaldo-of-portugal-looks-dejected-following-the-teams-defeat-in.jpg?s=612x612&w=gi&k=20&c=ffUaAF9km23q47SkX57MtxQIy2no1KrCIeGpihNbR1s=",
    },
  },
  {
    id: "p8",
    username: "Nike modal",
    is_creator: true,
    userProfilePic:
      "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/3e264b2f-9e5f-4c08-acf3-2f95037551a8/FCB+M+NK+DFADV+JSY+SS+MATCH+3R.png",
    caption:
      "Weekend drip with the new #AirMax — comfy and clean. Check this out: https://nike.example",
    likes_count: 128,
    comments_count: 22,
    media: {
      type: "image",
      uri: "https://images.unsplash.com/photo-1533422902779-aff35862e462?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  },
  {
    id: "p3",
    username: "sophia_king",
    is_creator: false,
    userProfilePic: "https://randomuser.me/api/portraits/women/44.jpg",
    caption:
      "Landscape vibes 🌅 Testing 16:9 aspect ratio #landscape #cinematic",
    likes_count: 76,
    comments_count: 9,
    media: {
      type: "video",
      uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      aspectRatio: "landscape", // Will be handled by ResponsiveVideoPlayer
    },
    affiliated: false,
    affiliation: null,
  },
  {
    id: "p4",
    username: "emma_vertical",
    is_creator: false,
    userProfilePic: "https://randomuser.me/api/portraits/women/22.jpg",
    caption:
      "Portrait mode vibes ✨ Testing 9:16 vertical aspect ratio #vertical #story",
    likes_count: 156,
    comments_count: 18,
    media: {
      type: "video",
      uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      aspectRatio: "portrait", // Will be handled by ResponsiveVideoPlayer
    },
    affiliated: false,
    affiliation: null,
  },
  {
    id: "p5",
    username: "james_square",
    is_creator: true,
    userProfilePic: "https://randomuser.me/api/portraits/men/15.jpg",
    caption:
      "Classic Instagram square format 📸 Testing 1:1 ratio #throwback #square",
    likes_count: 89,
    comments_count: 12,
    media: {
      type: "video",
      uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      aspectRatio: "square", // Will be handled by ResponsiveVideoPlayer
    },
    affiliated: false,
    affiliation: null,
  },
  {
    id: "p6",
    username: "nature_lover",
    is_creator: false,
    userProfilePic: "https://randomuser.me/api/portraits/women/33.jpg",
    caption:
      "Wide cinematic shots 🎬 Testing wide landscape format #landscape #cinematic",
    likes_count: 234,
    comments_count: 31,
    media: {
      type: "video",
      uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      aspectRatio: "landscape", // Wide landscape
    },
    affiliated: false,
    affiliation: null,
  },
  {
    id: "p7",
    username: "mobile_creator",
    is_creator: true,
    userProfilePic: "https://randomuser.me/api/portraits/men/27.jpg",
    caption:
      "Shot on mobile 📱 Testing Facebook/Instagram feed ratio 4:5 #mobile #feed",
    likes_count: 167,
    comments_count: 24,
    media: {
      type: "video",
      uri: "dummyVerticalVideo", // Asset name that will be resolved by useAssetUri
      aspectRatio: "feed", // 4:5 Facebook/Instagram feed ratio
      isLocalAsset: true, // This tells the system to use the asset loading hook
    },
    affiliated: false,
    affiliation: null,
  },
];

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

// ----- Enhanced PostMedia with Facebook-style images -----
const PostMedia = ({
  media,
  isVisible,
  postId,
}: {
  media?: {
    type: "image" | "video";
    uri: string;
    aspectRatio?: string;
    isLocalAsset?: boolean;
  };
  isVisible: boolean;
  postId: string;
}) => {
  console.log("PostMedia rendered with:", media, "isVisible:", isVisible);

  // Use the custom hook to get the proper URI for assets
  const { uri: resolvedUri, isLoading: assetLoading } = useAssetUri(
    media?.uri || null,
    media?.isLocalAsset || false
  );

  console.log(
    "PostMedia - originalUri:",
    media?.uri,
    "isLocalAsset:",
    media?.isLocalAsset,
    "resolvedUri:",
    resolvedUri
  );

  // If no media, return null
  if (!media) {
    return null;
  }

  // For images, use Facebook-style behavior
  if (media.type === "image") {
    return (
      <View style={{ marginBottom: 8 }}>
        <FacebookStyleImage uri={resolvedUri} style={{ marginBottom: 0 }} />
      </View>
    );
  }

  // For video content, use the ResponsiveVideoPlayer with Facebook/Instagram aspect ratios
  if (media.type === "video") {
    // Show loading state while asset is being prepared
    if (media.isLocalAsset && assetLoading) {
      return (
        <View
          style={{
            width: "100%",
            aspectRatio: 4 / 5,
            backgroundColor: "#e5e7eb",
            borderRadius: 0,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ color: "#666", fontSize: 12 }}>Loading video...</Text>
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 8 }}>
        <ResponsiveVideoPlayer
          uri={resolvedUri}
          isVisible={isVisible}
          style={
            {
              // Add any additional styling if needed
            }
          }
        />
        {/* Optional: Add aspect ratio hint overlay for testing */}
        <View
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {media.aspectRatio?.toUpperCase() || "AUTO"} RATIO
          </Text>
        </View>
        {/* Show local asset indicator */}
        {media.isLocalAsset && (
          <View
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              backgroundColor: "rgba(0,200,0,0.8)",
              padding: 4,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: "white", fontSize: 8, fontWeight: "bold" }}>
              LOCAL
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Fallback for unknown media types
  return (
    <View className="w-full h-24 bg-gray-200 rounded-lg items-center justify-center mb-2">
      <Text style={{ color: "#666", fontSize: 12 }}>Unknown media type</Text>
    </View>
  );
};

// ----- Post card -----
const PostCard = ({ item, isVisible }: { item: any; isVisible: boolean }) => {
  return (
    <View className="px-3 mt-2 bg-[#F3F4F8]">
      <View className="bg-white rounded-2xl px-3 py-3 shadow-sm overflow-hidden">
        {/* Header */}
        <View className="flex-row items-center mb-2">
          {/* LEFT group takes remaining space, but doesn't overgrow */}
          <View className="flex-row items-center flex-1 mr-2">
            <Image
              source={{ uri: item.userProfilePic }}
              className="w-8 h-8 rounded-full mr-2"
            />
            {/* REMOVE flex-1 here */}
            <View /* className="flex-1" */>
              <View className="flex-row items-center">
                <Text className="font-semibold text-sm">{item.username}</Text>
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
          </View>

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

        {/* Media with ResponsiveVideoPlayer */}
        <PostMedia media={item.media} isVisible={isVisible} postId={item.id} />

        {/* Caption */}
        <Text className="text-sm mb-2">{item.caption}</Text>

        {/* Affiliation */}
        {item.affiliated && item.affiliation && (
          <View className="flex-row gap-x-3 rounded-lg border border-gray-200">
            <View className="basis-1/4 self-stretch rounded overflow-hidden relative">
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
                  console.log("Product image error:", e.nativeEvent.error);
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
              <View className="flex-row items-center mb-2">
                <Image
                  source={{ uri: item.affiliation.brandLogo }}
                  className="w-11 h-11 rounded-full mr-2"
                  resizeMode="contain"
                  onError={(e) => {
                    console.log("Brand logo error:", e.nativeEvent.error);
                    console.log("Brand logo URI:", item.affiliation.brandLogo);
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
        )}

        {/* Actions */}
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center gap-x-4">
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="heart-outline" size={20} color="#000" />
              <Text className="ml-1 text-sm font-medium">
                {item.likes_count}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center">
              <Octicons name="comment" size={18} color="#000" />
              <Text className="ml-1 text-sm font-medium">
                {item.comments_count}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="paper-plane-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
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
  const TOP_BAR_HEIGHT = insets.top + NAV_BAR_CONTENT_HEIGHT;
  const flatListRef = useRef<FlatList>(null);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  // Header animation state
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isFetchingNextPage] = useState(false); // You can connect this to your API loading state
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentHeaderTranslateValue = useRef(0); // Track current header position
  const [refreshing, setRefreshing] = React.useState(false);

  // Scroll behavior constants
  const HIDE_THRESHOLD = 10; // pixels to scroll down before hiding header
  const SHOW_THRESHOLD = 10; // pixels to scroll up before showing header

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

  const tabBarHeight = useBottomTabBarHeight();
  const footerSpacing = tabBarHeight;

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
        <View style={{ paddingTop: insets.top, backgroundColor: "white" }}>
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
          paddingBottom:
            Platform.OS === "ios" ? footerSpacing : footerSpacing + 150,
          backgroundColor: "#F3F4F8",
        }}
        style={{
          backgroundColor: "#F3F4F8",
        }}
        renderItem={({ item }) => (
          <PostCard item={item} isVisible={visibleItems.includes(item.id)} />
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
    </View>
  );
}
