import { apiCall } from "./apiService";

/* =======================
   TYPES
======================= */

export interface Brand {
  brand_name: string;
  brandLogoURL?: string;
}

export interface Product {
  id: string;
  name: string;
  main_image?: string;
  description?: string;
  regular_price?: number;
  sale_price?: number;
}

export interface PostAffiliation {
  id: string;
  brand?: Brand;
  brandID?: string;
  brandName?: string;
  product?: Product;
  productID?: string;
  productURL?: string;
}

export interface PostTag {
  tag: { name: string };
}

export interface PostUser {
  id: string;
  username: string;
  profile_picture?: string;
  is_creator: boolean;
}

export interface RawPost {
  id: string;
  user_id: string;
  caption: string;
  created_at: string;
  media_url?: string;
  aspect_ratio?: number;
  affiliated?: boolean;
  PostToPostAffliation?: PostAffiliation;
  user: PostUser;
  likes_aggregate: { aggregate: { count: number } };
  comments_aggregate: { aggregate: { count: number } };
  text_post?: string;
  PostToTagsMultiple: PostTag[];
}

/* =======================
   REELS TYPES
======================= */

export interface RawReel {
  id: number;
  user_id: number;
  caption: string;
  created_at: string;
  media_url: string;
  thumbnail_url?: string;
  user: {
    username: string;
    profile_picture?: string;
  };
  reels_likes_aggregate: { aggregate: { count: number } };
  reels_comments_aggregate: { aggregate: { count: number } };
  reels_views_aggregate: { aggregate: { count: number } };
  username: string;
  photoURL?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  likes?: number;
  liked?: boolean;
  following?: boolean;
  verified?: boolean;
  shareUrl?: string;
  isProduct?: boolean;
  productCount?: string;
}

export interface APIResponse<T> {
  data: T[];
}

export interface FetchReelResponse {
  message?: string;
  data: RawReel[];
  nextCursor: number;
  hasMore: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalReels?: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FetchPostsResponse {
  userFeed: APIResponse<RawPost>;
  randomPosts: APIResponse<RawPost>;
}

/* =======================
   POSTS + REELS FUNCTIONS
======================= */

export const fetchPostsAPI = async (
  userId: string
): Promise<FetchPostsResponse> => {
  try {
    const [userFeed, randomPosts] = await Promise.all([
      apiCall(`/api/posts/feed/user/${userId}`, "GET") as Promise<
        APIResponse<RawPost>
      >,
      apiCall(`/api/posts/random`, "GET") as Promise<APIResponse<RawPost>>,
    ]);

    return { userFeed, randomPosts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};

export const clearPostsCache = async (userId: string): Promise<void> => {
  try {
    await apiCall(`/api/posts/cache/clearPosts/user/${userId}`, "DELETE");
  } catch (error) {
    console.error("Error clearing posts cache:", error);
    throw error;
  }
};

export const fetchUserLikedPosts = async (
  userId: string
): Promise<APIResponse<RawPost>> => {
  try {
    const likedPosts = (await apiCall(
      `/api/likes/${userId}/likedPosts`,
      "GET"
    )) as Promise<APIResponse<RawPost>>;
    console.log("likedPosts: ", likedPosts);
    return likedPosts;
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    throw error;
  }
};

export const fetchUserFollowings = async (
  userId: string
): Promise<APIResponse<{ following_id: string }>> => {
  try {
    const followings = (await apiCall(
      `/api/follows/following/${userId}`,
      "GET"
    )) as Promise<APIResponse<{ following_id: string }>>;
    return followings;
  } catch (error) {
    console.error("Error fetching user followings:", error);
    throw error;
  }
};

export const fetchMorePosts = async (
  userId: string,
  page: number
): Promise<APIResponse<RawPost>> => {
  try {
    const morePosts = (await apiCall(
      `/api/posts/feed/user/${userId}?page=${page}`,
      "GET"
    )) as Promise<APIResponse<RawPost>>;
    return morePosts;
  } catch (error) {
    console.error("Error fetching more posts:", error);
    throw error;
  }
};

export const fetchComment = async (
  postId: string
): Promise<APIResponse<any>> => {
  try {
    const comments = (await apiCall(
      `/api/comments/post/${postId}`,
      "GET"
    )) as Promise<APIResponse<any>>;
    return comments;
  } catch (error) {
    console.error("Error fetching post comments:", error);
    throw error;
  }
};

export const fetchReelsApi = async (
  userID: string,
  currentCursor: number
): Promise<FetchReelResponse> => {
  try {
    const reels = (await apiCall(
      `/api/posts/reels/feed/user/${userID}?page=${currentCursor}`,
      "GET"
    )) as FetchReelResponse;
    console.log("Fetched reels:", currentCursor, userID, reels);
    return reels;
  } catch (error) {
    console.error("Error fetching reels:", error);
    throw error;
  }
};

// ✅ Fetch a SPECIFIC user's reels (for profile view)
// WORKAROUND: Backend /api/reels/user/{id} returns 404, so we use the feed endpoint
// and filter client-side to show only the target user's reels
export const fetchUserReelsApi = async (
  userID: string,
  currentCursor: number
): Promise<FetchReelResponse> => {
  try {
    const endpoint = `/api/posts/reels/feed/user/${userID}?page=${currentCursor}`;

    console.log(
      `🎯 Fetching reels (will filter for user ${userID}): ${endpoint}`
    );
    const response = (await apiCall(endpoint, "GET")) as FetchReelResponse;

    console.log(
      `📦 Raw response: ${response?.data?.length || 0} reels from users:`,
      [...new Set(response?.data?.map((r) => r.user_id) || [])]
    );

    // ✅ FILTER: Only keep reels from the target user
    const filteredReels =
      response?.data?.filter(
        (reel) => String(reel.user_id) === String(userID)
      ) || [];

    console.log(
      `✅ Filtered to ${filteredReels.length} reels from user ${userID}`
    );

    return {
      ...response,
      data: filteredReels,
      hasMore: filteredReels.length > 0 && response?.hasMore,
    };
  } catch (error) {
    console.error("❌ Error fetching user reels:", error);
    throw error;
  }
};

export const clearReelsCache = async (userID: string): Promise<void> => {
  try {
    console.log("Clearing reels cache for user:", userID);
    const response = await apiCall(
      `/api/posts/cache/clearReels/user/${userID}`,
      "DELETE"
    );
    console.log("Reels cache cleared:", response);
  } catch (error) {
    console.error("Error clearing reels cache:", error);
    throw error;
  }
};

/* =======================
   FOLLOWERS / FOLLOWING API HELPERS
======================= */

// ✅ UI Shape
export interface FollowUser {
  user_id: number | string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_creator?: boolean;
  profile_picture?: string;
}

// ✅ Combined response
export interface FollowListsResponse {
  followers: FollowUser[];
  following: FollowUser[];
}

// ✅ GET both followers & following
export const fetchFollowLists = async (
  userId: number | string
): Promise<FollowListsResponse> => {
  try {
    const res = await apiCall(`/api/follows/followFollowing/${userId}`, "GET");

    const mapUser = (u: any): FollowUser => ({
      user_id: u?.user_id ?? u?.id ?? u?.userId,
      username: u?.username,
      first_name: u?.first_name,
      last_name: u?.last_name,
      is_creator: !!u?.is_creator,
      profile_picture: u?.profile_picture,
    });

    return {
      followers: Array.isArray(res?.followers)
        ? res.followers.map(mapUser)
        : [],
      following: Array.isArray(res?.following)
        ? res.following.map(mapUser)
        : [],
    };
  } catch (error) {
    console.error("Error fetching follow lists:", error);
    return { followers: [], following: [] };
  }
};

// ✅ Follow user
export const followUserApi = async (
  me: number | string,
  target: number | string
): Promise<any> => {
  try {
    return await apiCall(`/api/follows/follow/${me}/${target}`, "POST");
  } catch (error) {
    console.error(`Error following user ${target} by ${me}:`, error);
    throw error;
  }
};

// ✅ Unfollow user
export const unfollowUserApi = async (
  me: number | string,
  target: number | string
): Promise<any> => {
  try {
    return await apiCall(`/api/follows/unfollow/${me}/${target}`, "DELETE");
  } catch (error) {
    console.error(`Error unfollowing user ${target} by ${me}:`, error);
    throw error;
  }
};

// ✅ Check follow status
export const fetchFollowStatus = async (
  me: number | string,
  target: number | string
): Promise<"followed" | "pending" | "" | null> => {
  try {
    const res = await apiCall(
      `/api/follows/isFollowing/${me}/${target}`,
      "GET"
    );
    if (res?.isFollowing === true) return "followed";
    if (res?.isFollowing === false) return "";
    return (res?.isFollowing as any) ?? "";
  } catch (error) {
    console.error(
      `Error fetching follow status for ${me} -> ${target}:`,
      error
    );
    return null;
  }
};

export const reportPostApi = async (
  postId: string,
  userId: string,
  reason: string
): Promise<any> => {
  try {
    const res = await apiCall("/api/postReports", "POST", {
      postID: postId,
      userID: userId,
      reason: reason,
    });
    console.log("reportPostApi res:", res);
  } catch (error) {
    console.error("Error reporting post:", error);
  }
};
