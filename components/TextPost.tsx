import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Icons
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

const { width } = Dimensions.get("window");

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
  const backCountRef = useRef(0);
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
    <View
      className="bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100"
      style={{ width: width * 0.96, alignSelf: "center" }}
    >
      {/* User Header */}
      <TouchableOpacity
        onLongPress={() => {
          setFocusedPostID(item.id);
          setPostOptionsVisible?.(true);
        }}
        onPress={() => {
          backCountRef.current += 1;

          if (backCountRef.current === 1 && hideActions) {
            onPress();
          }
          if (backCountRef.current === 2) {
            clearTimeout((this as any).backTimer);
            toggleLike(item.id);
            setPlayLikedAnimation(true);
            backCountRef.current = 0;
          } else {
            (this as any).backTimer = setTimeout(() => {
              backCountRef.current = 0;
            }, 3000);
          }
        }}
        activeOpacity={0.8}
        delayLongPress={250}
        className="w-full rounded-xl relative"
      >
        <View className="flex-row mb-2 items-center">
          <TouchableOpacity
            onPress={() => router.push(`/(profiles)?user=${item?.user_id}`)}
            className="mr-2"
          >
            <Image
              source={{
                uri:
                  item?.userProfilePic ||
                  "https://randomuser.me/api/portraits/men/32.jpg",
              }}
              className="w-13 h-13 rounded-full"
            />
          </TouchableOpacity>

          <View className="flex-1 mt-1">
            <View className="flex-row gap-1 items-center">
              <TouchableOpacity
                onPress={() => router.push(`/(profiles)?user=${item.user_id}`)}
              >
                <Text className="text-lg font-semibold text-gray-900">
                  {item.username}
                </Text>
              </TouchableOpacity>
              {item.is_creator && (
                <Octicons
                  name="verified"
                  size={14}
                  color="#000"
                  className="mt-0.5"
                />
              )}
            </View>
          </View>

          {item.affiliation?.productID && item.affiliation?.productID !== 1 && (
            <TouchableOpacity className="w-14 h-9 rounded-full flex-row justify-center items-center p-1">
              <SimpleLineIcons name="handbag" size={20} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={onPress}>
          <Text className="text-base text-gray-900 leading-5">
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
                      onPress={() => console.log("Navigate to hashtag:", part)}
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
              })}
            {""}
          </Text>
          {item?.post_hashtags?.length ? (
            <Text className="text-blue-600">
              {neededHashtags.map((tag: string, i: number) => (
                <Text
                  key={tag}
                  onPress={() => console.log("Navigate to hashtag:", "#" + tag)}
                >
                  #{tag}
                  {i < neededHashtags.length - 1 ? " " : ""}
                </Text>
              ))}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Affiliated Product Card */}
        {item?.affiliated && item?.affiliation?.brandName && (
          <TouchableOpacity
            className="border border-gray-200 rounded-xl overflow-hidden mb-3 flex-row h-36"
            onPress={() =>
              console.log("Navigate to product:", item.affiliation.productID)
            }
          >
            <Image
              source={{ uri: item.affiliation.productImage }}
              className="w-2/5 h-36 bg-gray-100"
              resizeMode="cover"
            />

            <View className="py-1 px-3 flex-1">
              <View className="flex-row items-center mb-2 gap-3">
                <Image
                  source={{ uri: item.affiliation.brandLogo }}
                  className="w-10 h-10 rounded-full bg-gray-100"
                  resizeMode="contain"
                />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-900">
                    {item.affiliation.brandName}
                  </Text>
                  <Text className="text-xs font-semibold text-gray-900">
                    {item.affiliation.productName}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-800 flex-1" numberOfLines={3}>
                {item.affiliation.productDescription?.slice(0, 100)}
              </Text>

              <View className="flex-row items-center gap-1 justify-end">
                <Text className="text-sm text-gray-500 line-through">
                  ₹{item.affiliation.productRegularPrice}
                </Text>
                <Text className="text-sm font-bold text-gray-900">
                  ₹{item.affiliation.productSalePrice}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Social Actions */}
        {!hideActions && (
          <View className="flex-row justify-between w-full -ml-1">
            <View className="flex-row gap-3 ml-1">
              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={() => toggleLike(item.id)}
              >
                <Ionicons
                  name={
                    likedPostIDs.includes(item.id) ? "heart" : "heart-outline"
                  }
                  size={20}
                  color={likedPostIDs.includes(item.id) ? "#CE395F" : "#687684"}
                />
                <Text className="text-sm text-gray-500">
                  {likedPostIDs.includes(item.id)
                    ? (item.likes_count || 0) + 1
                    : item.likes_count || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={commentBox}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#687684" />
                <Text className="text-sm text-gray-500">
                  {item.comments_count || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={handleShare}
              >
                <Ionicons name="arrow-redo-outline" size={20} color="#687684" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TextPost;
