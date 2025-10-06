import { FacebookStyleImage } from "@/components/FacebookStyleImage";
import { MultiImageCollage } from "@/components/MultiImageCollage";
import { MultiImageViewer } from "@/components/MultiImageViewer";
import { MaterialIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureType,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

// ----- PostMedia Component -----
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

// ----- PostCard Types -----
export interface PostCardProps {
  item: any;
  isVisible: boolean;
  onLongPress?: (item: any) => void;
  isGestureActive?: boolean;
  panGesture: GestureType;
  onPressComments?: (post: any) => void;
}

// ----- PostCard Component -----
export const PostCard: React.FC<PostCardProps> = ({
  item,
  isVisible,
  onLongPress,
  isGestureActive = false,
  panGesture,
  onPressComments,
}) => {
  const router = useRouter();
  const navigating = useRef(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const openPostOptions = React.useCallback(() => {
    Vibration.vibrate(100);
    onLongPress?.(item);
  }, [item, onLongPress]);

  // Debug: log when isGestureActive changes
  useEffect(() => {
    console.log(
      `PostCard ${item.id} - isGestureActive changed to:`,
      isGestureActive
    );
  }, [isGestureActive, item.id]);

  const handleUserPressSafe = () => {
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
      totalLength += tag.length + 1;
      return totalLength <= limit;
    });
  };

  const neededHashtags = getHashtagsWithinLimit(item.post_hashtags || []);

  const goToProductSafe = () => {
    if (isGestureActive) return;
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
          scheduleOnRN(onEnd);
        }
      });

  const openProductTap = makeTapThatYieldsToPan(goToProductSafe);
  const openProfileTap = makeTapThatYieldsToPan(handleUserPressSafe);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={500}
    >
      <View className="px-3 mt-2 bg-gray-100">
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
            className="bg-white py-3 gap-2.5"
            style={{
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View className="flex-row px-3 items-center h-10">
              <GestureDetector gesture={openProfileTap}>
                <TouchableOpacity
                  className="flex-row items-center flex-1 mr-2"
                  activeOpacity={0.7}
                  disabled={isGestureActive}
                >
                  <Image
                    source={{ uri: item.userProfilePic }}
                    className="w-10 h-10 rounded-full mr-2"
                  />
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

              {item.affiliated && item.affiliation && <View />}
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
            <View>
              {(() => {
                const caption = item.caption || "";
                const captionLimit = 150;
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
                                onLongPress={openPostOptions}
                              >
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
                                        router.push({
                                          pathname:
                                            "/(search)/searchPostsWithTags" as any,
                                          params: {
                                            tag: part,
                                          },
                                        })
                                }
                                onLongPress={openPostOptions}
                              >
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
                                onLongPress={openPostOptions}
                              >
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
                        delayLongPress={500}
                      >
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
                        delayLongPress={500}
                      >
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
                          : () =>
                              router.push({
                                pathname:
                                  "/(search)/searchPostsWithTags" as any,
                                params: {
                                  tag: "#" + tag,
                                },
                              })
                      }
                    >
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
                  disabled={isGestureActive}
                >
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
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                        }}
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1 justify-between p-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row flex-1 items-center">
                          <Image
                            source={{ uri: item.affiliation.brandLogo }}
                            className="w-11 h-11 rounded-full mr-2"
                            resizeMode="contain"
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
                          disabled={isGestureActive}
                        >
                          <MaterialIcons
                            name="add-shopping-cart"
                            size={24}
                            color="#707070"
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
                  onPress={isGestureActive ? undefined : undefined}
                >
                  <Ionicons name="heart-outline" size={20} color="#000" />
                  <Text className="ml-1 text-sm font-medium">
                    {item.likes_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center"
                  disabled={isGestureActive}
                  onPress={
                    isGestureActive
                      ? undefined
                      : () => {
                          onPressComments?.(item);
                        }
                  }
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#000" />
                  <Text className="ml-1 text-sm font-medium">
                    {item.comments_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isGestureActive}
                  onPress={isGestureActive ? undefined : undefined}
                >
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
