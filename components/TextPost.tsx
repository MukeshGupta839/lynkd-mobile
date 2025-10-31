import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Icons
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";

interface TextPostProps {
  item: any;
  onPress: () => void;
  likedPosts: any[];
  hideActions?: boolean;
  handleShare: () => void;
  toggleChat?: () => void;
  likedPostIDs: string[];
  toggleLike: (id: string) => void;
  commentBox: () => void;
  followedUsers: string[];
  toggleFollow: () => void;
  setFocusedPostID: (id: string) => void;
  setPostOptionsVisible?: (visible: boolean) => void;
}

const TextPost: React.FC<TextPostProps> = ({
  item,
  onPress,
  likedPosts,
  hideActions,
  handleShare,
  toggleChat,
  likedPostIDs,
  toggleLike,
  commentBox,
  followedUsers,
  toggleFollow,
  setFocusedPostID,
  setPostOptionsVisible,
}) => {
  const [playLikedAnimation, setPlayLikedAnimation] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const router = useRouter();

  // useEffect to turn off the animation
  useEffect(() => {
    if (playLikedAnimation) {
      setTimeout(() => {
        setPlayLikedAnimation(false);
      }, 2000);
    }
  }, [playLikedAnimation]);

  const getHashtagsWithinLimit = (hashtags: string[], limit = 50) => {
    let totalLength = 0;
    if (!hashtags) return [];

    return hashtags.filter((tag) => {
      totalLength += tag.length + 1; // +1 for the # symbol
      return totalLength <= limit;
    });
  };

  const neededHashtags = getHashtagsWithinLimit(item.post_hashtags || []);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={() => {
        setFocusedPostID(item.id);
        setPostOptionsVisible?.(true);
      }}
      onPress={onPress}
      delayLongPress={500}
    >
      <View className="bg-gray-100">
        <View
          style={{
            borderRadius: 16,
            elevation: 2,
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
              <View
                className="flex-row items-center flex-1 mr-2"
                // onPress={() => router.push(`/(profiles)?user=${item?.user_id}`)}
                // activeOpacity={0.7}
              >
                <Image
                  source={{
                    uri:
                      item?.userProfilePic ||
                      "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=",
                  }}
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
                </View>
              </View>
            </View>

            {/* Caption */}
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
                                onPress={() =>
                                  router.push(
                                    `/(profiles)?mentionedUsername=${part.slice(
                                      1
                                    )}`
                                  )
                                }
                                onLongPress={() => {
                                  setFocusedPostID(item.id);
                                  setPostOptionsVisible?.(true);
                                }}
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
                                onPress={() =>
                                  console.log("Navigate to hashtag:", part)
                                }
                                onLongPress={() => {
                                  setFocusedPostID(item.id);
                                  setPostOptionsVisible?.(true);
                                }}
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
                                onPress={() => Linking.openURL(url)}
                                onLongPress={() => {
                                  setFocusedPostID(item.id);
                                  setPostOptionsVisible?.(true);
                                }}
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
                        onPress={() => setShowFullCaption(true)}
                        hitSlop={8}
                        style={{ marginLeft: 2, alignSelf: "baseline" }}
                        onLongPress={() => {
                          setFocusedPostID(item.id);
                          setPostOptionsVisible?.(true);
                        }}
                        delayLongPress={500}
                      >
                        <Text className="text-sm text-gray-500 px-3 font-medium">
                          Show more
                        </Text>
                      </Pressable>
                    )}

                    {shouldTruncate && showFullCaption && (
                      <Pressable
                        onPress={() => setShowFullCaption(false)}
                        hitSlop={8}
                        style={{ marginLeft: 2, alignSelf: "baseline" }}
                        onLongPress={() => {
                          setFocusedPostID(item.id);
                          setPostOptionsVisible?.(true);
                        }}
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
            </View>

            {/* Affiliation */}
            {item?.affiliated && item?.affiliation?.brandName && (
              <TouchableOpacity
                className="px-3"
                onLongPress={() => {
                  setFocusedPostID(item.id);
                  setPostOptionsVisible?.(true);
                }}
                delayLongPress={500}
                onPress={() =>
                  console.log(
                    "Navigate to product:",
                    item.affiliation.productID
                  )
                }
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
                        onPress={() => {
                          console.log(
                            "Add to cart:",
                            item.affiliation.productName
                          );
                        }}
                        className="self-start"
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
            )}

            {/* Actions */}
            {!hideActions && (
              <View className="flex-row items-center justify-between px-3">
                <View className="flex-row items-center gap-x-4">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => toggleLike(item.id)}
                  >
                    <Ionicons
                      name={
                        likedPostIDs.includes(item.id)
                          ? "heart"
                          : "heart-outline"
                      }
                      size={20}
                      color={
                        likedPostIDs.includes(item.id) ? "#CE395F" : "#000"
                      }
                    />
                    <Text className="ml-1 text-sm font-medium">
                      {likedPostIDs.includes(item.id)
                        ? (item.likes_count || 0) + 1
                        : item.likes_count || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={commentBox}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color="#000"
                    />
                    <Text className="ml-1 text-sm font-medium">
                      {item.comments_count || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleShare}>
                    <Ionicons
                      name="arrow-redo-outline"
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TextPost;
