import { PostCard } from "@/components/PostCard";
import TextPost from "@/components/TextPost";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Text,
  View,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiCall } from "../lib/api/apiService";

const { height } = Dimensions.get("window");

interface SearchPostsWithTagsProps {
  tag?: string;
  likedPosts?: any[];
  followedUsers?: any[];
  likedPostIDs?: any[];
}

const removeHashtagSymbol = (hashtag: string) => {
  return hashtag.replace(/^#+/, "");
};

const SearchPostsWithTags: React.FC<SearchPostsWithTagsProps> = ({
  tag: tagProp,
  likedPosts = [],
  followedUsers = [],
  likedPostIDs = [],
}) => {
  const insets = useSafeAreaInsets();
  const { tag: tagParam } = useLocalSearchParams<{ tag?: string }>();

  const [searchQuery, setSearchQuery] = useState(
    tagProp || tagParam || "#fashion"
  );
  const [posts, setPosts] = useState<any[]>([]);
  const glowAnimation = useRef(new Animated.Value(0)).current;

  // Update search query when prop changes
  useEffect(() => {
    if (tagProp) {
      setSearchQuery(tagProp);
    }
  }, [tagProp]);

  // Animation setup
  useEffect(() => {
    const animateGlow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animateGlow();
  }, [glowAnimation]);

  // Animation values for future use (search bar glow effect)
  // const glowColor = glowAnimation.interpolate({
  //   inputRange: [0, 0.5, 1],
  //   outputRange: [
  //     "rgba(0, 255, 204, 0.5)",
  //     "rgba(255, 105, 180, 0.5)",
  //     "rgba(0, 255, 204, 0.5)",
  //   ],
  // });

  // const borderColor = glowAnimation.interpolate({
  //   inputRange: [0, 0.5, 1],
  //   outputRange: ["#0F27BD", "#ffc202", "#3d576c"],
  // });

  // Fetch posts by hashtag
  const fetchPostsByHashtag = async (hashtag: string) => {
    try {
      const response = await apiCall(
        `/api/search/postsTags?hashtag=${removeHashtagSymbol(hashtag)}`,
        "GET"
      );

      console.log(
        "Fetched posts for hashtag:",
        removeHashtagSymbol(hashtag),
        response
      );

      const postsData = response.data.map((post: any) => {
        return {
          id: post.id,
          user_id: post.user_id,
          caption: post.caption,
          createdAt: post.created_at,
          username: post.user?.username || post.username,
          userProfilePic: post.user?.profile_picture || post.userProfilePic,
          postImage: post.media_url,
          aspect_ratio: post.aspect_ratio,
          affiliated: post?.affiliated,
          affiliation: post.PostToPostAffliation
            ? {
                affiliationID: post.PostToPostAffliation?.id,
                brandName: post.PostToPostAffliation?.brand?.brand_name,
                productID: post.PostToPostAffliation?.productID,
                productURL: post.PostToPostAffliation?.productURL,
                productName: post.PostToPostAffliation?.product?.name,
                productImage: post.PostToPostAffliation?.product?.main_image,
                brandLogo: post.PostToPostAffliation?.brand?.brandLogoURL,
                productDescription:
                  post.PostToPostAffliation?.product?.description,
                productRegularPrice:
                  post.PostToPostAffliation?.product?.regular_price,
                productSalePrice:
                  post.PostToPostAffliation?.product?.sale_price,
              }
            : null,
          likes_count:
            post.likes_aggregate?.aggregate?.count || post.likes_count || 0,
          comments_count:
            post.comments_aggregate?.aggregate?.count ||
            post.comments_count ||
            0,
          text_post: post.text_post,
          post_hashtags: post.PostToTagsMultiple
            ? post.PostToTagsMultiple.map((tag: any) => tag.tag.name)
            : post.post_hashtags || [],
          media: post.media,
        };
      });

      setPosts((prevPosts) =>
        prevPosts.length === 0
          ? postsData
          : prevPosts.map((p) => {
              const matchingPost = postsData.find(
                (newP: any) => newP.id === p.id
              );
              return matchingPost ? { ...p, ...matchingPost } : p;
            })
      );
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        fetchPostsByHashtag(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const toggleLike = async (postID: string) => {
    // Implement like functionality
  };

  const toggleChat = async (postID: string) => {
    // Implement chat functionality
  };

  const toggleFollow = async (userID: string) => {
    // Implement follow functionality
  };

  const handleShare = () => {
    // Implement share functionality
  };

  // Create a simple pan gesture for PostCard (required prop)
  const panGesture = Gesture.Pan();

  const renderItem = ({ item }: { item: any }) => {
    if (item.text_post) {
      return (
        <TextPost
          item={item}
          likedPostIDs={likedPostIDs}
          likedPosts={likedPosts}
          followedUsers={followedUsers}
          toggleLike={toggleLike}
          commentBox={() => toggleChat(item.id)}
          toggleFollow={() => toggleFollow(item.user_id)}
          handleShare={handleShare}
          setFocusedPostID={() => {}}
          setPostOptionsVisible={() => {}}
          onPress={() => {}}
        />
      );
    }

    return (
      <PostCard
        item={item}
        isVisible={true}
        onLongPress={() => {}}
        isGestureActive={false}
        panGesture={panGesture}
        onPressComments={() => toggleChat(item.id)}
      />
    );
  };

  return (
    <View className="flex-1">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
        }}
        ListEmptyComponent={
          <View
            className="items-center justify-center"
            style={{ height: height * 0.7 }}
          >
            <Ionicons name="search" size={48} color="#ccc" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2 text-center">
              No results found
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              We couldn&apos;t find any posts matching &quot;{searchQuery}
              &quot;
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default SearchPostsWithTags;
