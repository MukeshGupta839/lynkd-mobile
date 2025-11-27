import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Components
import FeedSkeletonPlaceholder from "@/components/Placeholder/FeedSkeletonPlaceholder";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { fetchComment, fetchUserLikedPosts } from "@/lib/api/api";
import { apiCall } from "@/lib/api/apiService";
import BlockUserPopup from "../../components/BlockUserPopup";
import CommentsSheet, { CommentsSheetHandle } from "../../components/Comment";
import PostOptionsBottomSheet from "../../components/PostOptionsBottomSheet";
import ReportPostBottomSheet from "../../components/ReportPostBottomSheet";

export interface UserProfile {
  username: string;
  profile_picture: string;
}

export interface Product {
  name: string;
  main_image: string;
  description: string;
  sale_price: number;
  regular_price: number;
}

export interface Brand {
  brand_name: string;
  brandLogoURL: string;
}

export interface PostAffiliation {
  id: number;
  brandID: number;
  productID: number;
  productURL: string;
  product: Product;
  brand: Brand;
}

export interface AggregateCount {
  aggregate: {
    count: number;
  };
}

interface Post {
  id: number;
  user_id: number;
  media_url: string;
  caption: string;
  created_at: string;
  text_post: boolean;
  aspect_ratio: string;
  user: UserProfile;
  affiliated: boolean;
  PostToPostAffliation: PostAffiliation;
  likes_aggregate: AggregateCount;
  comments_aggregate: AggregateCount;
  PostToTagsMultiple: any[];
  username: string;
  photoURL: string;
  likesCount: number;
  brandID: number;
  productID: number;
  productURL: string | null;
}

export default function ChatPosts() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const postsParam = typeof params.posts === "string" ? params.posts : "";
  const focusParam =
    params.focusedIndexPost != null ? Number(params.focusedIndexPost) : null;
  const showOnlyPostParam = params.showOnlyPost
    ? String(params.showOnlyPost)
    : null;

  const [reportVisible, setReportVisible] = useState(false);
  const [blockUser, setBlockUser] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [focusedPostID, setFocusedPostID] = useState<string | null>(null);
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [likedPostIDs, setLikedPostIDs] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsPost, setCommentsPost] = useState<any>(null);
  const [postComments, setPostComments] = useState<any[]>([]);

  const commentsRef = useRef<CommentsSheetHandle>(null);

  // simple pan gesture still used by PostCard
  const panGesture = Gesture.Pan();

  const handleLongPress = useCallback((item: Post) => {
    Vibration.vibrate(100);
    setFocusedPostID(String(item.id));
    setPostOptionsVisible(true);
  }, []);

  // Fetch user's liked posts to initialize the liked state
  const fetchUserLikedPostsData = useCallback(async () => {
    try {
      if (!user?.id) return;
      const response: any = await fetchUserLikedPosts(user.id);
      console.log("📋 Fetched liked posts:", response.likedPosts);
      const likedIds = (response.likedPosts || []).map(String);
      setLikedPostIDs(likedIds);
    } catch (error) {
      console.error("❌ Error fetching liked posts:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserLikedPostsData();
    }
  }, [fetchUserLikedPostsData, user?.id]);

  // Fetch single post for notifications / showOnlyPostMode
  const fetchSinglePost = useCallback(async (postId: string) => {
    try {
      const response: any = await apiCall(`/api/posts/${postId}`, "GET");
      console.log("Single Post:", response);

      // handle both { data: post } and direct post object
      const post: Post = response?.data ?? response;
      setPosts(post ? [post] : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching single post:", error);
      setPosts([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If showOnlyPost param exists, fetch only that post
    if (showOnlyPostParam) {
      setLoading(true);
      fetchSinglePost(showOnlyPostParam);
      return;
    }

    // Otherwise, parse posts from params
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
      setPosts([]);
    }
    setLoading(false);
  }, [postsParam, focusParam, showOnlyPostParam, fetchSinglePost]);

  const focusedPost = useMemo(
    () => posts.find((p) => p.id === Number(focusedPostID)) ?? null,
    [posts, focusedPostID]
  );

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

      setFollowedUsers((prev) =>
        isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
      );

      try {
        Vibration.vibrate(100);

        const endpoint = isFollowing
          ? `/api/follows/unfollow/${user.id}/${userId}`
          : `/api/follows/follow/${user.id}/${userId}`;

        await apiCall(endpoint, isFollowing ? "DELETE" : "POST");
      } catch (error) {
        console.error(`❌ Error toggling follow for user ${userId}:`, error);
        // rollback
        setFollowedUsers((prev) =>
          isFollowing ? [...prev, userId] : prev.filter((id) => id !== userId)
        );
      }
    },
    [followedUsers, user?.id]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const pid = String(postId);
      const isLiked = likedPostIDs.includes(pid);
      setFocusedPostID(pid);
      Vibration.vibrate(100);

      try {
        // optimistic
        setLikedPostIDs((prev) =>
          isLiked ? prev.filter((id) => id !== pid) : [...prev, pid]
        );
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === Number(pid)
              ? {
                  ...post,
                  likesCount: (post.likesCount || 0) + (isLiked ? -1 : 1),
                }
              : post
          )
        );

        const endpoint = isLiked
          ? `/api/likes/${pid}/${user?.id}/unlike`
          : `/api/likes/${pid}/${user?.id}/like`;
        await apiCall(endpoint, "POST");
      } catch (error) {
        console.error(`❌ Error toggling like for post ${pid}:`, error);
        // rollback
        setLikedPostIDs((prev) =>
          isLiked ? [...prev, pid] : prev.filter((id) => id !== pid)
        );
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === Number(pid)
              ? {
                  ...post,
                  likesCount: (post.likesCount || 0) + (isLiked ? 1 : -1),
                }
              : post
          )
        );
      }
    },
    [likedPostIDs, user?.id]
  );

  // Fetch comments for a specific post
  const fetchCommentsForPost = useCallback(async (postId: string) => {
    try {
      const response: any = await fetchComment(postId);
      const commentsData = (response.comments || []).map((comment: any) => ({
        id: comment.id,
        userId: comment.user_id,
        comment: comment.content,
        username: comment.user.username,
        userImage: comment.user.profile_picture,
        time: new Date(comment.created_at).toLocaleDateString(),
        likes: 0,
      }));
      setPostComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments for post:", postId, error);
      setPostComments([]);
    }
  }, []);

  const openComments = useCallback(
    async (post: Post) => {
      setCommentsPost(post);
      setPostComments([]);
      await fetchCommentsForPost(String(post.id));
      commentsRef.current?.present();
    },
    [fetchCommentsForPost]
  );

  const addComment = useCallback(
    async (text: string) => {
      try {
        if (!text || text.trim() === "") return;
        if (!commentsPost?.id) return;
        if (!user?.id) return;

        const response = await apiCall(`/api/comments/`, "POST", {
          postID: commentsPost.id,
          content: text,
          userID: user.id,
        });

        console.log("✅ Comment added:", response.comment);

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === commentsPost.id
              ? {
                  ...post,
                  comments_aggregate: {
                    aggregate: {
                      count: (post.comments_aggregate.aggregate.count || 0) + 1,
                    },
                  },
                }
              : post
          )
        );

        await fetchCommentsForPost(String(commentsPost.id));
      } catch (error) {
        console.error("❌ Error adding comment:", error);
      }
    },
    [commentsPost, user?.id, fetchCommentsForPost]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!user?.id) return;

      try {
        Vibration.vibrate(100);
        await apiCall(`/api/posts/${postId}`, "DELETE");

        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== Number(postId))
        );
        setPostOptionsVisible(false);
      } catch (error) {
        console.error("❌ Error deleting post:", error);
      }
    },
    [user?.id]
  );

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

  const singlePost = posts[0] ?? null;

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4"
        style={{ paddingTop: insets.top - 10 }}
      >
        <TouchableOpacity
          className="w-9 h-9 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">Post</Text>

        <View className="w-9 h-9" />
      </View>

      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom:
              Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
            backgroundColor: "#F3F4F8",
          }}
        >
          {singlePost ? (
            <PostCard
              item={singlePost}
              isVisible={true}
              onLongPress={() => handleLongPress(singlePost)}
              panGesture={panGesture}
              onPressComments={openComments}
              toggleLike={toggleLike}
              likedPostIDs={likedPostIDs}
              profilePostsMode={true}
            />
          ) : (
            <>
              <FeedSkeletonPlaceholder />
              <FeedSkeletonPlaceholder />
            </>
          )}
        </ScrollView>
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
        post={focusedPost || undefined}
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

      <CommentsSheet
        ref={commentsRef}
        title="Comments"
        comments={postComments}
        onSendComment={addComment}
        currentUserAvatar={user?.profile_picture || ""}
      />
    </View>
  );
}
