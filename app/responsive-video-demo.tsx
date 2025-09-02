import { ResponsiveVideoPlayer } from "@/components/ResponsiveVideoPlayer";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Video feed demo data showcasing Facebook/Instagram responsive aspect ratios
const VIDEO_FEED_DATA = [
  {
    id: "v1",
    title: "Portrait Video (9:16)",
    description: "TikTok/Instagram Story style vertical video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    aspectHint: "portrait",
  },
  {
    id: "v2",
    title: "Square Video (1:1)",
    description: "Classic Instagram square format",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    aspectHint: "square",
  },
  {
    id: "v3",
    title: "Feed Video (4:5)",
    description: "Facebook/Instagram feed optimized ratio",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    aspectHint: "feed",
  },
  {
    id: "v4",
    title: "Landscape Video (16:9)",
    description: "YouTube style wide format",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    aspectHint: "landscape",
  },
  {
    id: "v5",
    title: "Vertical Video (9:16)",
    description: "Portrait aspect ratio video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    aspectHint: "portrait",
  },
  {
    id: "v6",
    title: "Cinematic Wide (1.91:1 max)",
    description: "Facebook's maximum allowed aspect ratio",
    uri: require("../assets/images/dummyVerticalVideo.mp4"),
    aspectHint: "landscape",
  },
];

const VideoCard = ({ item, isVisible }: { item: any; isVisible: boolean }) => {
  return (
    <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
      {/* Header */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1a1a1a" }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
          {item.description}
        </Text>
      </View>

      {/* Responsive Video Player */}
      <ResponsiveVideoPlayer
        uri={item.uri}
        isVisible={isVisible}
        style={
          {
            // The ResponsiveVideoPlayer handles all aspect ratio calculations
          }
        }
      />

      {/* Aspect Ratio Info */}
      <View
        style={{
          marginTop: 8,
          backgroundColor: "#f0f0f0",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 12, color: "#666" }}>
          🎯 <Text style={{ fontWeight: "bold" }}>Aspect Ratio:</Text>{" "}
          {item.aspectHint.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
          📱 <Text style={{ fontWeight: "bold" }}>Behavior:</Text> Automatically
          adapts to Facebook/Instagram rules
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
          ✨ <Text style={{ fontWeight: "bold" }}>Features:</Text> Auto-play,
          responsive sizing, tap controls
        </Text>
      </View>
    </View>
  );
};

export default function ResponsiveVideoFeedDemo() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visible = viewableItems
        .filter((item) => item.isViewable && item.item?.id)
        .map((item) => item.item.id);
      setVisibleItems(visible);
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isVisible = visibleItems.includes(item.id);
      return <VideoCard item={item} isVisible={isVisible} />;
    },
    [visibleItems]
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View style={{ padding: 16, backgroundColor: "#4D70D1" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons name="play-circle" size={32} color="white" />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              marginLeft: 12,
            }}
          >
            Responsive Video Feed
          </Text>
        </View>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }}>
          Facebook & Instagram Style Aspect Ratios
        </Text>
        <Text
          style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 8 }}
        >
          • Auto-sizing based on video dimensions{"\n"}• Clamped to
          Facebook/Instagram rules (9:16 to 1.91:1){"\n"}• Smart default
          detection from filename{"\n"}• Auto-play when 60% visible{"\n"}• Tap
          to play/pause controls
        </Text>
      </View>
    ),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <FlatList
        data={VIDEO_FEED_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4D70D1"
            progressViewOffset={Platform.OS === "ios" ? 0 : 50}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
