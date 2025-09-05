import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Components
import BlockUserPopup from "../../components/BlockUserPopup";
import PostOptionsBottomSheet from "../../components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "../../components/ReportPostBottomSheet";
import TextPost from "../../components/TextPost";

interface Post {
  id: number;
  user_id: number;
  caption?: string;
  created_at: string;
  username: string;
  userProfilePic?: string;
  media_url?: string;
  postImage?: string;
  aspect_ratio?: number;
  affiliated?: boolean;
  affiliation?: any;
  likes_count?: number;
  comments_count?: number;
  text_post: boolean;
  post_hashtags?: string[];
}

export default function ProfilePosts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const postsParam = typeof params.posts === "string" ? params.posts : "";
  const focusParam =
    params.focusedIndexPost != null ? Number(params.focusedIndexPost) : null;

  // Mock user data - replace with your actual user context
  const currentUser = {
    id: 1,
    username: "current_user",
    profile_picture: "https://randomuser.me/api/portraits/men/1.jpg",
    is_creator: true,
  };

  const [reportVisible, setReportVisible] = useState(false);
  const [blockUser, setBlockUser] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [focusedPostID, setFocusedPostID] = useState<string | null>(null);
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [commentsClicked, setCommentsClicked] = useState(false);
  const [likedPostIDs, setLikedPostIDs] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList<Post>>(null);

  useEffect(() => {
    if (!postsParam) {
      setLoading(false);
      return;
    }
    try {
      const parsed: Post[] = JSON.parse(postsParam);

      if (focusParam != null) {
        const idx = parsed.findIndex((p) => p.id === focusParam);
        if (idx > -1) {
          const next = [...parsed];
          const [f] = next.splice(idx, 1);
          setPosts([f, ...next]);
        } else {
          setPosts(parsed);
        }
      } else {
        setPosts(parsed);
      }
    } catch (e) {
      console.error("Error parsing posts:", e);
    }
    setLoading(false);
  }, [postsParam, focusParam]); // 👈 stable deps only

  const focusedPost = useMemo(
    () => posts.find((p) => p.id === Number(focusedPostID)) ?? null,
    [posts, focusedPostID]
  );

  // Create setFocusedPost function that works with the current architecture
  const setFocusedPost = useCallback((post: Post | null) => {
    if (post) {
      setFocusedPostID(String(post.id));
    } else {
      setFocusedPostID(null);
    }
  }, []);

  const toggleFollow = useCallback(
    async (userId: string) => {
      const isFollowing = followedUsers.includes(userId);
      try {
        Vibration.vibrate(100);
        // Add your follow/unfollow API logic here

        // Update followedUsers state
        setFollowedUsers((prev) =>
          isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
      } catch (error) {
        console.error(`Error toggling follow for user ${userId}:`, error);
      }
    },
    [followedUsers]
  );

  const handleShare = useCallback(() => {
    // Add your share logic here
    console.log("Sharing post");
  }, []);

  const toggleLike = useCallback(
    async (postId: string) => {
      const isLiked = likedPostIDs.includes(postId);
      setFocusedPostID(postId);
      Vibration.vibrate(100);

      try {
        // Update likedPostIDs state
        setLikedPostIDs((prev) =>
          isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
        );

        // Add your like/unlike API logic here

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === Number(postId)
              ? {
                  ...post,
                  likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1),
                }
              : post
          )
        );
      } catch (error) {
        console.error(`Error toggling like for post ${postId}:`, error);
      }
    },
    [likedPostIDs]
  );

  const commentBox = useCallback(() => {
    setCommentsClicked(!commentsClicked);
    // Add your comment logic here
  }, [commentsClicked]);

  const deletePost = useCallback(async (postId: string) => {
    try {
      // Add your delete API logic here
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== Number(postId))
      );
      setPostOptionsVisible(false);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }, []);

  // Memoized callbacks to prevent re-renders
  const handleToggleFollow = useCallback(() => {
    if (focusedPost?.user_id) {
      toggleFollow(String(focusedPost.user_id));
    }
  }, [focusedPost?.user_id, toggleFollow]);

  const isUserFollowing = useMemo(() => {
    return focusedPost?.user_id
      ? followedUsers.includes(String(focusedPost.user_id))
      : false;
  }, [followedUsers, focusedPost?.user_id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4 py-3"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          className="w-9 h-9 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">Posts</Text>

        <View className="w-9 h-9" />
      </View>

      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={posts}
          nestedScrollEnabled={true}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            if (item.text_post) {
              return (
                <TextPost
                  key={item.id}
                  item={item}
                  onPress={() => {}}
                  likedPosts={[]}
                  likedPostIDs={likedPostIDs}
                  handleShare={handleShare}
                  toggleLike={toggleLike}
                  commentBox={commentBox}
                  toggleFollow={() => toggleFollow(String(item.user_id))}
                  followedUsers={followedUsers}
                  setFocusedPostID={setFocusedPostID}
                  setPostOptionsVisible={setPostOptionsVisible}
                  hideActions={false}
                />
              );
            }

            // Render regular post (you can create a Post component similar to TextPost)
            return (
              <TouchableOpacity
                activeOpacity={1}
                onLongPress={() => {
                  setFocusedPostID(String(item.id));
                  setPostOptionsVisible(true);
                }}
                delayLongPress={500}
                className="bg-white mb-2 mx-2 rounded-2xl overflow-hidden"
                key={item.id}
              >
                {/* Post Header */}
                <View className="flex-row items-center p-3">
                  <TouchableOpacity className="w-13 h-13 rounded-full overflow-hidden mr-3 bg-gray-200">
                    <Image
                      source={{
                        uri:
                          item.userProfilePic ||
                          "https://randomuser.me/api/portraits/men/1.jpg",
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                      onError={(error) =>
                        console.log("Image load error:", error)
                      }
                      onLoad={() => console.log("Image loaded successfully")}
                      defaultSource={require("../../assets/images/icon.png")}
                    />
                  </TouchableOpacity>

                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      {item.username}
                    </Text>
                  </View>

                  <TouchableOpacity
                    className="w-8 h-8 justify-center items-center"
                    onPress={() => {
                      setFocusedPostID(String(item.id));
                      setPostOptionsVisible(true);
                    }}
                  >
                    <Entypo
                      name="dots-three-horizontal"
                      size={16}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Post Image */}
                <TouchableOpacity
                  activeOpacity={1}
                  onLongPress={() => {
                    setFocusedPostID(String(item.id));
                    setPostOptionsVisible(true);
                  }}
                  delayLongPress={500}
                  className="w-full h-80"
                >
                  <Image
                    source={{ uri: item.media_url || item.postImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                {/* Post Actions */}
                <View className="flex-row items-center justify-between p-3">
                  <View className="flex-row items-center space-x-4">
                    <TouchableOpacity
                      className="flex-row items-center space-x-1"
                      onPress={() => toggleLike(String(item.id))}
                    >
                      <MaterialIcons
                        name={
                          likedPostIDs.includes(String(item.id))
                            ? "favorite"
                            : "favorite-border"
                        }
                        size={20}
                        color={
                          likedPostIDs.includes(String(item.id))
                            ? "#ff4757"
                            : "#666"
                        }
                      />
                      <Text className="text-sm text-gray-600">
                        {item.likes_count || 0}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center space-x-1"
                      onPress={commentBox}
                    >
                      <MaterialCommunityIcons
                        name="comment-outline"
                        size={20}
                        color="#666"
                      />
                      <Text className="text-sm text-gray-600">
                        {item.comments_count || 0}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShare}>
                      <Feather name="share" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Caption */}
                {item.caption && (
                  <View className="px-3 pb-3">
                    <Text className="text-sm text-gray-900">
                      <Text className="font-semibold">{item.username}</Text>{" "}
                      {item.caption}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            });
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 50,
            paddingTop: 10,
          }}
        />
      </View>

      {/* Modals */}
      <ReportPostBottomSheet
        show={reportVisible}
        setShow={setReportVisible}
        postId={focusedPostID || ""}
        userId={String(currentUser.id)}
      />

      <BlockUserPopup
        show={blockUser}
        setShow={setBlockUser}
        post={focusedPost}
      />

      <PostOptionsBottomSheet
        show={postOptionsVisible}
        setShow={setPostOptionsVisible}
        setBlockUser={setBlockUser}
        setReportVisible={setReportVisible}
        setFocusedPost={setFocusedPost}
        toggleFollow={handleToggleFollow}
        isFollowing={isUserFollowing}
        focusedPost={focusedPost}
        deleteAction={deletePost}
        user={currentUser}
      />
    </View>
  );
}
