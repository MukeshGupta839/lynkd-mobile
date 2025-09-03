import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

const FEED_MIN_RATIO = 0.8; // 4:5 portrait clamp used in FB/IG feed
const FEED_MAX_RATIO = 1.91; // landscape clamp
const GAP = 3; // space between tiles

const containerWidth = Dimensions.get("window").width - 24;

const clampFeedHeight = (w: number, targetRatio = 4 / 5) => {
  const r = Math.max(FEED_MIN_RATIO, Math.min(FEED_MAX_RATIO, targetRatio));
  return Math.round(w / r);
};

type TileProps = {
  uri: string;
  w: number;
  h: number;
  radius?: number;
  onPress?: () => void;
  overlayCount?: number; // show +N if provided and > 0
};

const Tile = ({ uri, w, h, radius = 0, onPress, overlayCount }: TileProps) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={{ width: w, height: h, borderRadius: radius, overflow: "hidden" }}
  >
    <Image
      source={{ uri }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="cover"
    />
    {!!overlayCount && overlayCount > 0 && (
      <View
        style={{
          position: "absolute",
          inset: 0 as any,
          backgroundColor: "rgba(0,0,0,0.45)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700", fontSize: 22 }}>
          +{overlayCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

export const MultiImageCollage = ({
  images,
  onPressImage,
}: {
  images: string[];
  onPressImage?: (index: number) => void;
}) => {
  if (!images?.length) return null;

  const W = containerWidth;
  const H = clampFeedHeight(W, 4 / 5); // overall collage height
  const heroH = Math.round(H * 0.62); // top hero takes ~62%
  const rowH = H - heroH;

  // 1 image → full bleed
  if (images.length === 1) {
    return (
      <View
        style={{
          width: W,
          height: H,
          overflow: "hidden",
        }}
      >
        <Tile uri={images[0]} w={W} h={H} onPress={() => onPressImage?.(0)} />
      </View>
    );
  }

  // 2 images → two rows (vertical stack)
  if (images.length === 2) {
    const rowH = Math.floor((H - GAP) / 2);
    return (
      <View
        style={{
          width: W,
          height: H,
          overflow: "hidden",
          flexDirection: "column",
        }}
      >
        <Tile
          uri={images[0]}
          w={W}
          h={rowH}
          onPress={() => onPressImage?.(0)}
        />
        <View style={{ height: GAP }} />
        <Tile
          uri={images[1]}
          w={W}
          h={rowH}
          onPress={() => onPressImage?.(1)}
        />
      </View>
    );
  }

  // 3+ images → big hero on top, two tiles below; overlay "+N" on the last tile
  const colW = Math.floor((W - GAP) / 2);
  const extra = images.length - 3;

  return (
    <View
      style={{
        width: W,
        height: H,
        overflow: "hidden",
      }}
    >
      {/* Top hero */}
      <Tile uri={images[0]} w={W} h={heroH} onPress={() => onPressImage?.(0)} />

      {/* gap between rows */}
      <View style={{ height: GAP }} />

      {/* Bottom row */}
      <View style={{ flexDirection: "row" }}>
        <Tile
          uri={images[1]}
          w={colW}
          h={rowH}
          onPress={() => onPressImage?.(1)}
        />
        <View style={{ width: GAP }} />
        <Tile
          uri={images[2]}
          w={colW}
          h={rowH}
          onPress={() => onPressImage?.(2)}
          overlayCount={extra > 0 ? extra : 0}
        />
      </View>
    </View>
  );
};
