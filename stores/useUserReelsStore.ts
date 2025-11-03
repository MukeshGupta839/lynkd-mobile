import { clearReelsCache, fetchUserReelsApi, RawReel } from "@/lib/api/api";
import { apiCall } from "@/lib/api/apiService";
import { create } from "zustand";

export interface ReelComment {
  id: number;
  userId: number;
  user_id?: number;
  comment: string;
  content?: string;
  username: string;
  userImage: string;
  time: string;
  likes: number;
  created_at?: string;
  createdAt?: string;
  user?: {
    username: string;
    profile_picture?: string;
    photoURL?: string;
  };
}

interface ReelsState {
  // Data
  reels: RawReel[];
  cursor: number;
  hasMore: boolean;
  currentUserId: string | null; // Track which user's reels are currently loaded

  // Likes & Comments data
  likedPostIDs: number[];
  postComments: Record<number, ReelComment[]>; // Map postId to comments
  commentsLoading: Record<number, boolean>; // Track loading state per post

  // Loading states
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isPrefetching: boolean;

  // Error state
  error: string | null;

  // Cache tracking
  lastFetchTime: number | null;
  prefetchedCount: number;

  // Actions
  prefetchReels: (userId: string) => Promise<void>;
  fetchReels: (
    userId: string,
    page?: number,
    bustCache?: boolean
  ) => Promise<void>;
  loadMoreReels: (userId: string) => Promise<void>;
  refreshReels: (userId: string) => Promise<void>;
  clearReels: (userId: string) => Promise<void>;

  // Update individual reel (for likes, comments, etc.)
  updateReel: (reelId: number, updates: Partial<RawReel>) => void;

  // Likes & Comments actions
  fetchUserLikedPosts: (userId: string) => Promise<void>;
  toggleLike: (postId: number, userId: string) => Promise<void>;
  fetchCommentsOfAPost: (postId: number) => Promise<ReelComment[]>;
  addComment: (
    postId: number,
    userId: string,
    content: string
  ) => Promise<void>;

  // Reset store
  reset: () => void;
}

const INITIAL_STATE = {
  reels: [],
  cursor: 0,
  hasMore: true,
  currentUserId: null,
  isInitialLoading: false,
  isLoadingMore: false,
  isPrefetching: false,
  error: null,
  lastFetchTime: null,
  prefetchedCount: 0,
  likedPostIDs: [],
  postComments: {},
  commentsLoading: {},
};

export const useReelsStore = create<ReelsState>((set, get) => ({
  ...INITIAL_STATE,

  // Prefetch reels during splash screen (silent, no loading states)
  prefetchReels: async (userId: string) => {
    const { isPrefetching, reels } = get();

    // Don't prefetch if already prefetching or if we already have reels
    if (isPrefetching || reels.length > 0) {
      console.log("⏭️ Skipping prefetch - already have data");
      return;
    }

    try {
      console.log("🚀 Prefetching reels during splash screen...");
      set({ isPrefetching: true, error: null });

      const response = await fetchUserReelsApi(userId, 0);

      if (response && response.data && Array.isArray(response.data)) {
        // Filter out invalid videos
        const validReels = response.data.filter((reel) => {
          const hasValidUrl =
            reel.media_url &&
            typeof reel.media_url === "string" &&
            reel.media_url.trim().length > 0 &&
            (reel.media_url.startsWith("http://") ||
              reel.media_url.startsWith("https://"));

          if (!hasValidUrl) {
            console.warn(`⚠️ Skipping invalid reel ${reel.id}`);
          }
          return hasValidUrl;
        });

        console.log(`✅ Prefetched ${validReels.length} reels`);

        set({
          reels: validReels,
          cursor: response.nextCursor,
          hasMore: response.hasMore,
          lastFetchTime: Date.now(),
          prefetchedCount: validReels.length,
          isPrefetching: false,
        });
      }
    } catch (error) {
      console.error("❌ Prefetch error:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to prefetch reels",
        isPrefetching: false,
      });
    }
  },

  // Fetch reels (used when prefetch didn't happen or for initial load)
  fetchReels: async (userId: string, page = 0, bustCache = false) => {
    let state = get();

    // ✅ Check if we're switching to a different user - clear store if so
    if (state.currentUserId && state.currentUserId !== userId) {
      console.log(
        `🔄 Switching from user ${state.currentUserId} to ${userId} - clearing store`
      );
      set({
        ...INITIAL_STATE,
        currentUserId: userId,
      });
      // ✅ Get fresh state after clearing
      state = get();
    } else if (!state.currentUserId) {
      // First time loading - set the current user
      set({ currentUserId: userId });
      state = get();
    }

    // Prevent duplicate fetches
    if (state.isInitialLoading || state.isLoadingMore) {
      console.log("⏭️ Already fetching, skipping...");
      return;
    }

    // If we have prefetched data and page is 0, don't fetch again (unless cache busting or switching users)
    if (
      page === 0 &&
      state.reels.length > 0 &&
      !bustCache &&
      state.currentUserId === userId
    ) {
      console.log("✅ Using prefetched data");
      return;
    }

    try {
      console.log(
        `📥 Fetching reels page ${page}... (bustCache: ${bustCache})`
      );
      set({
        isInitialLoading: page === 0,
        isLoadingMore: page > 0,
        error: null,
      });

      const response = await fetchUserReelsApi(userId, get().cursor);

      console.log("cursor response:", response, page);

      if (response && response.data && Array.isArray(response.data)) {
        // Filter out invalid videos
        const validReels = response.data.filter((reel) => {
          const hasValidUrl =
            reel.media_url &&
            typeof reel.media_url === "string" &&
            reel.media_url.trim().length > 0 &&
            (reel.media_url.startsWith("http://") ||
              reel.media_url.startsWith("https://"));

          if (!hasValidUrl) {
            console.warn(`⚠️ Skipping invalid reel ${reel.id}`);
          }
          return hasValidUrl;
        });

        console.log(`✅ Fetched ${validReels.length} reels`);

        set((state) => ({
          reels:
            get().cursor === 0 ? validReels : [...state.reels, ...validReels],
          cursor: response.nextCursor,
          hasMore: response.hasMore,
          lastFetchTime: Date.now(),
          isInitialLoading: false,
          isLoadingMore: false,
        }));

        console.log("fetch reels cursor:", get().cursor, response.nextCursor);
      } else {
        // ✅ FIX: If no data, still clear loading flags
        console.warn("⚠️ No data received from API");
        set({
          isInitialLoading: false,
          isLoadingMore: false,
        });
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      // ✅ FIX: Always clear loading flags on error
      set({
        error: error instanceof Error ? error.message : "Failed to fetch reels",
        isInitialLoading: false,
        isLoadingMore: false,
      });
    }
  },

  // Load more reels (pagination)
  loadMoreReels: async (userId: string) => {
    const { hasMore, isLoadingMore, cursor } = get();

    if (!hasMore || isLoadingMore) {
      console.log("⏭️ No more reels or already loading");
      return;
    }

    await get().fetchReels(userId, cursor);
  },

  // Refresh reels (pull to refresh)
  refreshReels: async (userId: string) => {
    try {
      console.log("🔄 Refreshing reels...");

      // ✅ FIX: Reset state completely FIRST including cursor to 0
      set({
        reels: [],
        cursor: 0, // ✅ CRITICAL: Reset cursor to 0 to fetch from beginning
        hasMore: true,
        currentUserId: userId, // ✅ Maintain the current user ID
        error: null,
        isInitialLoading: false, // ✅ Must be false to allow fetchReels to proceed
        isLoadingMore: false,
        lastFetchTime: null,
      });

      console.log("cursor reset to 0");

      // Clear cache on backend
      await clearReelsCache(userId);

      // ✅ Add a small delay to ensure cache is cleared on backend
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log("🔄 Fetching fresh data after cache clear...");
      // ✅ Use cache busting to ensure we get new data - fetch from page 0
      await get().fetchReels(userId, 0, true);

      console.log("✅ Refresh complete");
    } catch (error) {
      console.error("❌ Refresh error:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to refresh reels",
        isInitialLoading: false,
        isLoadingMore: false,
      });
    }
  },

  // Clear all reels
  clearReels: async (userId: string) => {
    try {
      await clearReelsCache(userId);
      set(INITIAL_STATE);
    } catch (error) {
      console.error("❌ Clear error:", error);
    }
  },

  // Update a single reel (for likes, follows, etc.)
  updateReel: (reelId: number, updates: Partial<RawReel>) => {
    set((state) => ({
      reels: state.reels.map((reel) =>
        reel.id === reelId ? { ...reel, ...updates } : reel
      ),
    }));
  },

  // Fetch user's liked posts
  fetchUserLikedPosts: async (userId: string) => {
    try {
      const response = await apiCall(
        `/api/reelLikes/${userId}/likedPosts`,
        "GET"
      );
      set({ likedPostIDs: response.likedPosts || [] });
      console.log("✅ Fetched liked posts:", response.likedPosts?.length || 0);
    } catch (error) {
      console.error("❌ Error fetching liked posts:", error);
    }
  },

  // Toggle like/unlike on a reel
  toggleLike: async (postId: number, userId: string) => {
    try {
      const { likedPostIDs } = get();
      const isPostLiked = likedPostIDs.includes(postId);

      const endpoint = isPostLiked
        ? `/api/reelLikes/${postId}/${userId}/unlike`
        : `/api/reelLikes/${postId}/${userId}/like`;

      await apiCall(endpoint, "POST");

      // ✅ OPTIMIZED: Only update likedPostIDs array
      // Don't update the reel object to prevent unnecessary re-renders
      // The PostItem calculates isFavorited using useMemo based on likedPostIDs
      set((state) => ({
        likedPostIDs: isPostLiked
          ? state.likedPostIDs.filter((id) => id !== postId)
          : [...state.likedPostIDs, postId],
      }));

      console.log(`✅ ${isPostLiked ? "Unliked" : "Liked"} post ${postId}`);
    } catch (error) {
      console.error("❌ Error toggling like:", error);
      throw error;
    }
  },

  // Fetch comments for a specific post
  fetchCommentsOfAPost: async (postId: number): Promise<ReelComment[]> => {
    try {
      // Set loading state for this post
      set((state) => ({
        commentsLoading: { ...state.commentsLoading, [postId]: true },
      }));

      const response = await apiCall(`/api/reelComments/post/${postId}`, "GET");
      console.log("Comments API Response:", response.comments);

      // Helper function to format comment timestamp
      const formatCommentTime = (timestamp: string) => {
        if (!timestamp) return "Just now";
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
      };

      // Map API response to expected comment format
      const mappedComments: ReelComment[] = (response.comments || []).map(
        (c: any) => ({
          id: c.id,
          userId: c.user_id || c.userId,
          comment: c.content || c.comment,
          username: c.user?.username || c.username || "Unknown",
          userImage:
            c.user?.profile_picture ||
            c.user?.photoURL ||
            c.userImage ||
            "https://via.placeholder.com/150",
          time: formatCommentTime(c.created_at || c.createdAt || c.time),
          likes: c.likes || 0,
        })
      );

      console.log("Mapped comments:", mappedComments);

      // Update store with comments
      set((state) => ({
        postComments: { ...state.postComments, [postId]: mappedComments },
        commentsLoading: { ...state.commentsLoading, [postId]: false },
      }));

      return mappedComments;
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      set((state) => ({
        commentsLoading: { ...state.commentsLoading, [postId]: false },
      }));
      return [];
    }
  },

  // Add a comment to a post
  addComment: async (postId: number, userId: string, content: string) => {
    try {
      const response = await apiCall(`/api/reelComments/`, "POST", {
        postID: postId,
        content: content,
        userID: userId,
      });

      console.log("✅ Comment added:", response.comment);

      // Refetch comments to update the list
      await get().fetchCommentsOfAPost(postId);

      // Update the reel's comment count
      const currentReel = get().reels.find((r) => r.id === postId);
      if (currentReel) {
        get().updateReel(postId, {
          commentsCount: (currentReel.commentsCount ?? 0) + 1,
        });
      }
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      throw error;
    }
  },

  // Reset store to initial state
  reset: () => {
    set(INITIAL_STATE);
  },
}));
