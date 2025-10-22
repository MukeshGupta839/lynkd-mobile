import { clearReelsCache, fetchReelsApi, RawReel } from "@/lib/api/api";
import { create } from "zustand";

interface ReelsState {
  // Data
  reels: RawReel[];
  cursor: number;
  hasMore: boolean;

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

  // Reset store
  reset: () => void;
}

const INITIAL_STATE = {
  reels: [],
  cursor: 0,
  hasMore: true,
  isInitialLoading: false,
  isLoadingMore: false,
  isPrefetching: false,
  error: null,
  lastFetchTime: null,
  prefetchedCount: 0,
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

      const response = await fetchReelsApi(userId, 0);

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
    const { isInitialLoading, isLoadingMore, reels } = get();

    // Prevent duplicate fetches
    if (isInitialLoading || isLoadingMore) {
      console.log("⏭️ Already fetching, skipping...");
      return;
    }

    // If we have prefetched data and page is 0, don't fetch again (unless cache busting)
    if (page === 0 && reels.length > 0 && !bustCache) {
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

      const response = await fetchReelsApi(userId, get().cursor);

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

      // ✅ FIX: Reset state completely FIRST including loading flags
      set({
        reels: [],
        cursor: get().cursor,
        hasMore: true,
        error: null,
        isInitialLoading: false, // ✅ Must be false to allow fetchReels to proceed
        isLoadingMore: false,
        lastFetchTime: null,
      });

      console.log("cursor:", get().cursor);

      // Clear cache on backend
      await clearReelsCache(userId);

      // ✅ Add a small delay to ensure cache is cleared on backend
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log("🔄 Fetching fresh data after cache clear...");
      // ✅ Use cache busting to ensure we get new data
      await get().fetchReels(userId, get().cursor);

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

  // Reset store to initial state
  reset: () => {
    set(INITIAL_STATE);
  },
}));
