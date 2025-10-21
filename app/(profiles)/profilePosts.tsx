import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";

// Components
import { useAuth } from "@/hooks/useAuth";
import { apiCall } from "@/lib/api/apiService";
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
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const postsParam = typeof params.posts === "string" ? params.posts : "";
  const focusParam =
    params.focusedIndexPost != null ? Number(params.focusedIndexPost) : null;

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
      if (!user?.id || !userId) return;

      const isFollowing = followedUsers.includes(userId);

      // Optimistic update - instant UI response
      setFollowedUsers((prev) =>
        isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
      );

      try {
        Vibration.vibrate(100);
        console.log(
          isFollowing ? "✅ Unfollowing user:" : "✅ Following user:",
          userId
        );

        const endpoint = isFollowing
          ? `/api/follows/unfollow/${user.id}/${userId}`
          : `/api/follows/follow/${user.id}/${userId}`;

        await apiCall(endpoint, isFollowing ? "DELETE" : "POST");
        console.log(
          isFollowing ? "✅ Unfollow successful" : "✅ Follow successful"
        );
      } catch (error) {
        console.error(`❌ Error toggling follow for user ${userId}:`, error);
        // Rollback on error
        setFollowedUsers((prev) =>
          isFollowing ? [...prev, userId] : prev.filter((id) => id !== userId)
        );
      }
    },
    [followedUsers, user?.id]
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

  const deletePost = useCallback(
    async (postId: string) => {
      if (!user?.id) return;

      try {
        Vibration.vibrate(100);
        console.log("🗑️ Deleting post:", postId);

        await apiCall(`/api/posts/${postId}`, "DELETE");

        // Remove from local state
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== Number(postId))
        );
        setPostOptionsVisible(false);

        console.log("✅ Post deleted successfully");
      } catch (error) {
        console.error("❌ Error deleting post:", error);
      }
    },
    [user?.id]
  );

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

            // Render regular post with PostCard component
            const PostCard = ({ item }: { item: Post }) => {
              const [showFullCaption, setShowFullCaption] = useState(false);

              const getHashtagsWithinLimit = (
                hashtags: string[],
                limit = 50
              ) => {
                let totalLength = 0;
                if (!hashtags) return [];

                return hashtags.filter((tag) => {
                  totalLength += tag.length + 1; // +1 for the # symbol
                  return totalLength <= limit;
                });
              };

              const neededHashtags = getHashtagsWithinLimit(
                item.post_hashtags || []
              );

              const openPostOptions = () => {
                Vibration.vibrate(100);
                setFocusedPostID(String(item.id));
                setPostOptionsVisible(true);
              };

              console.log("item.userProfilePic:", item.userProfilePic);

              // Get profile picture with fallback logic
              const getProfilePicture = (post: Post) => {
                if (post.userProfilePic) {
                  return post.userProfilePic;
                }
                // Fallback based on username or default
                return "https://randomuser.me/api/portraits/men/1.jpg";
              };

              return (
                <TouchableOpacity
                  activeOpacity={1}
                  onLongPress={openPostOptions}
                  delayLongPress={500}
                >
                  <View className="bg-gray-100">
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
                          <TouchableOpacity
                            className="flex-row items-center flex-1 mr-2"
                            activeOpacity={0.7}
                          >
                            <Image
                              source={{
                                uri: getProfilePicture(item),
                              }}
                              className="w-10 h-10 rounded-full mr-2"
                              onError={(error) => {
                                console.log(
                                  "Profile image load error:",
                                  error.nativeEvent.error
                                );
                                console.log(
                                  "Profile image URI:",
                                  getProfilePicture(item)
                                );
                              }}
                              onLoad={() => {
                                console.log(
                                  "Profile image loaded successfully:",
                                  getProfilePicture(item)
                                );
                              }}
                            />
                            <View>
                              <View className="flex-row items-center">
                                <Text className="font-semibold text-lg">
                                  {item.username}
                                </Text>
                                {item.user_id === 1 && (
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
                        </View>

                        {/* Media Display */}
                        <TouchableOpacity
                          activeOpacity={1}
                          onLongPress={openPostOptions}
                          delayLongPress={500}
                          className="w-full h-80"
                        >
                          <Image
                            source={{ uri: item.media_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>

                        {/* Caption */}
                        {item.caption && (
                          <View>
                            {(() => {
                              const caption = item.caption || "";
                              const captionLimit = 150;
                              const shouldTruncate =
                                caption.length > captionLimit;
                              const displayCaption =
                                shouldTruncate && !showFullCaption
                                  ? caption.substring(0, captionLimit)
                                  : caption;

                              return (
                                <View>
                                  <Text className="text-sm px-3 text-gray-900">
                                    {displayCaption
                                      .split(
                                        /((?:@|#)[\w.]+|(?:https?:\/\/|www\.)\S+)/gi
                                      )
                                      .map((part: string, index: number) => {
                                        if (part && part.startsWith("@")) {
                                          return (
                                            <Text
                                              key={index}
                                              className="text-blue-600"
                                              suppressHighlighting
                                              onPress={() =>
                                                router.push(
                                                  `/(profiles)?mentionedUsername=${part.slice(1)}`
                                                )
                                              }
                                              onLongPress={openPostOptions}
                                            >
                                              {part}
                                            </Text>
                                          );
                                        } else if (
                                          part &&
                                          part.startsWith("#")
                                        ) {
                                          return (
                                            <Text
                                              key={index}
                                              className="text-blue-600"
                                              suppressHighlighting
                                              onPress={() =>
                                                console.log(
                                                  "Navigate to hashtag:",
                                                  part
                                                )
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
                                              onPress={() =>
                                                Linking.openURL(url)
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
                                      onPress={() => setShowFullCaption(true)}
                                      hitSlop={8}
                                      style={{
                                        marginLeft: 2,
                                        alignSelf: "baseline",
                                      }}
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
                                      onPress={() => setShowFullCaption(false)}
                                      hitSlop={8}
                                      style={{
                                        marginLeft: 2,
                                        alignSelf: "baseline",
                                      }}
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
                                {neededHashtags.map(
                                  (tag: string, i: number) => (
                                    <Text
                                      key={tag}
                                      onPress={() =>
                                        console.log(
                                          "Navigate to hashtag:",
                                          "#" + tag
                                        )
                                      }
                                    >
                                      #{tag}
                                      {i < neededHashtags.length - 1 ? " " : ""}
                                    </Text>
                                  )
                                )}
                              </Text>
                            ) : null}
                          </View>
                        )}

                        {/* Affiliation */}
                        {item.affiliated && item.affiliation && (
                          <TouchableOpacity
                            className="px-3"
                            onLongPress={openPostOptions}
                            delayLongPress={500}
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
                                  source={{
                                    uri: item.affiliation.productImage,
                                  }}
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
                                      source={{
                                        uri: item.affiliation.brandLogo,
                                      }}
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
                                  <TouchableOpacity className="self-start">
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
                        <View className="flex-row items-center justify-between px-3">
                          <View className="flex-row items-center gap-x-4">
                            <TouchableOpacity
                              className="flex-row items-center"
                              onPress={() => toggleLike(String(item.id))}
                            >
                              <Ionicons
                                name={
                                  likedPostIDs.includes(String(item.id))
                                    ? "heart"
                                    : "heart-outline"
                                }
                                size={20}
                                color={
                                  likedPostIDs.includes(String(item.id))
                                    ? "#CE395F"
                                    : "#000"
                                }
                              />
                              <Text className="ml-1 text-sm font-medium">
                                {item.likes_count || 0}
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
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            };

            return <PostCard item={item} />;
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
            paddingBottom: insets.bottom,
          }}
          contentContainerClassName="gap-2.5 px-3"
        />
      </View>

      {/* Modals */}
      <ReportPostBottomSheet
        show={reportVisible}
        setShow={setReportVisible}
        postId={focusedPostID || ""}
        userId={user?.id}
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
        user={user}
      />
    </View>
  );
}
