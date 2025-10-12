// src/lib/api/api.ts
import { apiCall } from "./apiService";

// --- TYPES ---
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

// Reel-specific interface (reels have different aggregate field names)
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
  // Client-side state properties (not from API)
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

// --- FUNCTION ---
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
  currentCursor: number
): Promise<FetchReelResponse> => {
  try {
    const reels = (await apiCall(
      `/api/posts/reels?limit=16&page=${currentCursor}`,
      "GET"
    )) as FetchReelResponse;
    console.log("Fetched reels:", reels);
    return reels;
  } catch (error) {
    console.error("Error fetching reels:", error);
    throw error;
  }
};

export const clearReelsCache = async (): Promise<void> => {
  try {
    await apiCall(`/api/posts/cache/clearReels`, "DELETE");
  } catch (error) {
    console.error("Error clearing reels cache:", error);
    throw error;
  }
};
