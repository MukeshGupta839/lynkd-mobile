import Ionicons from "@expo/vector-icons/Ionicons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ResponsiveVideoPlayerProps {
  uri: string;
  isVisible: boolean;
  onPress?: () => void;
  style?: any;
}

// Get device dimensions for responsive calculations
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const ResponsiveVideoPlayer: React.FC<ResponsiveVideoPlayerProps> = ({
  uri,
  isVisible,
  onPress,
  style,
}) => {
  const [userPaused, setUserPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Validate URI and provide safe fallback
  const safeUri = uri && typeof uri === "string" ? uri : "";
  const isValidUri = Boolean(safeUri);

  // Initialize video player with safe URI
  const player = useVideoPlayer(safeUri, (player) => {
    if (isValidUri) {
      player.loop = true;
      player.muted = false;
    }
  });

  // Auto-play logic based on visibility (DISABLED - videos won't auto-play)
  useEffect(() => {
    if (player && isValidUri) {
      // Auto-play is disabled - videos will only play when user taps them
      // Only pause when video goes out of view and is currently playing
      if (!isVisible && player.playing) {
        player.pause();
        setIsPlaying(false);
      }
    }
  }, [isVisible, player, isValidUri]);

  // Reset pause state when video goes out of view
  useEffect(() => {
    if (!isVisible) {
      setUserPaused(false);
    }
  }, [isVisible]);

  // Listen for video metadata to get dimensions and playing state
  useEffect(() => {
    if (player && isValidUri) {
      const subscription = player.addListener("statusChange", (status) => {
        console.log("Video status:", status);
        console.log("Player playing state:", player.playing);
        setIsLoading(false);

        // Track playing state for UI updates
        setIsPlaying(player.playing);
        console.log("Updated isPlaying to:", player.playing);

        // Enhanced logging for debugging
        if (status.status === "error") {
          console.error("Video error details:", {
            error: status.error,
            uri: safeUri,
            platform: Platform.OS,
          });
        } else if (status.status === "readyToPlay") {
          console.log("Video ready to play:", {
            uri: safeUri,
            platform: Platform.OS,
          });
        }
      });

      return () => subscription?.remove();
    }
  }, [player, isValidUri, safeUri]);

  // Calculate Facebook/Instagram responsive aspect ratio
  const getResponsiveAspectRatio = () => {
    if (!isValidUri) {
      return 4 / 5; // Default aspect ratio for invalid URIs
    }

    // Smart defaults based on URI patterns
    const uriLower = safeUri.toLowerCase();
    if (
      uriLower.includes("vertical") ||
      uriLower.includes("portrait") ||
      uriLower.includes("story")
    ) {
      return 9 / 16; // Portrait
    } else if (uriLower.includes("square")) {
      return 1; // Square
    } else if (
      uriLower.includes("horizontal") ||
      uriLower.includes("landscape")
    ) {
      return 1.91; // Landscape (Facebook max)
    }

    // Default Instagram feed ratio
    return 4 / 5;
  };

  // Calculate responsive container dimensions
  const getResponsiveDimensions = () => {
    const aspectRatio = getResponsiveAspectRatio();
    const maxWidth = screenWidth - 24; // Account for padding
    const maxHeight = screenHeight * 0.6; // Max 60% of screen height

    let containerWidth = maxWidth;
    let containerHeight = containerWidth / aspectRatio;

    // If height exceeds max, constrain by height
    if (containerHeight > maxHeight) {
      containerHeight = maxHeight;
      containerWidth = containerHeight * aspectRatio;
    }

    return {
      width: containerWidth,
      height: containerHeight,
      aspectRatio,
    };
  };

  const dimensions = getResponsiveDimensions();

  const handleVideoPress = () => {
    console.log("Video press - current state:", {
      playerPlaying: player.playing,
      isPlaying,
      userPaused,
    });

    if (onPress) {
      onPress();
    } else {
      // Default play/pause toggle
      if (isPlaying || player.playing) {
        console.log("Pausing video");
        player.pause();
        setUserPaused(true);
        setIsPlaying(false);
      } else {
        console.log("Playing video");
        player.play();
        setUserPaused(false);
        setIsPlaying(true);
      }
    }
  };

  // If URI is invalid, show error state
  if (!isValidUri) {
    console.warn("ResponsiveVideoPlayer: Invalid or missing uri:", uri);
    return (
      <View
        style={[
          {
            width: 300,
            height: 200,
            backgroundColor: "#f0f0f0",
            borderRadius: 0,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
          },
          style,
        ]}
      >
        <Text style={{ color: "#666", fontSize: 14 }}>Invalid Video URI</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: "#000",
          borderRadius: 0,
          overflow: "hidden",
          alignSelf: "center",
        },
        style,
      ]}
    >
      <VideoView
        style={{
          width: "100%",
          height: "100%",
        }}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        nativeControls={false}
        contentFit="contain" // Ensures no cropping, like Facebook/Instagram
      />

      {/* Loading indicator */}
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <Text style={{ color: "white", fontSize: 12 }}>Loading...</Text>
        </View>
      )}

      {/* Tap overlay for play/pause */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        {/* Play button when paused */}
        {!isPlaying && (
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={24} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {/* Debug info */}
      <View
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: 4,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: "white", fontSize: 10 }}>
          {dimensions.width.toFixed(0)}×{dimensions.height.toFixed(0)} (
          {dimensions.aspectRatio.toFixed(2)}) {isVisible ? "▶️" : "⏸️"}
        </Text>
      </View>
    </View>
  );
};

export default ResponsiveVideoPlayer;
