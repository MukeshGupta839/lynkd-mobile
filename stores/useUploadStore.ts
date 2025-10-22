import { create } from "zustand";

export type UploadStatus = "idle" | "uploading" | "success" | "error";
export type PostType = "video" | "image" | "text";

interface UploadState {
  // Upload state
  status: UploadStatus;
  progress: number; // 0 to 1
  postType: PostType | null;

  // Actions
  startUpload: (postType: PostType) => void;
  updateProgress: (progress: number) => void;
  completeUpload: () => void;
  failUpload: () => void;
  resetUpload: () => void;

  // Refresh triggers for different screens
  shouldRefreshReels: boolean;
  shouldRefreshFeed: boolean;
  triggerReelsRefresh: () => void;
  triggerFeedRefresh: () => void;
  clearRefreshTriggers: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  // Initial state
  status: "idle",
  progress: 0,
  postType: null,
  shouldRefreshReels: false,
  shouldRefreshFeed: false,

  // Start upload
  startUpload: (postType: PostType) => {
    console.log("📤 Starting upload for:", postType);
    set({
      status: "uploading",
      progress: 0,
      postType,
      shouldRefreshReels: false,
      shouldRefreshFeed: false,
    });
  },

  // Update progress
  updateProgress: (progress: number) => {
    set({ progress: Math.min(1, Math.max(0, progress)) });
  },

  // Complete upload successfully
  completeUpload: () => {
    console.log("✅ Upload completed");
    set((state) => ({
      status: "success",
      progress: 1,
      // Trigger appropriate refresh based on post type
      shouldRefreshReels: state.postType === "video",
      shouldRefreshFeed:
        state.postType === "image" || state.postType === "text",
    }));

    // Auto-reset after 2 seconds
    setTimeout(() => {
      set({
        status: "idle",
        progress: 0,
        postType: null,
      });
    }, 2000);
  },

  // Fail upload
  failUpload: () => {
    console.log("❌ Upload failed");
    set({
      status: "error",
    });

    // Auto-reset after 3 seconds
    setTimeout(() => {
      set({
        status: "idle",
        progress: 0,
        postType: null,
      });
    }, 3000);
  },

  // Manual reset
  resetUpload: () => {
    set({
      status: "idle",
      progress: 0,
      postType: null,
      shouldRefreshReels: false,
      shouldRefreshFeed: false,
    });
  },

  // Trigger refreshes
  triggerReelsRefresh: () => {
    set({ shouldRefreshReels: true });
  },

  triggerFeedRefresh: () => {
    set({ shouldRefreshFeed: true });
  },

  // Clear refresh triggers (called after refresh is done)
  clearRefreshTriggers: () => {
    set({
      shouldRefreshReels: false,
      shouldRefreshFeed: false,
    });
  },
}));
