import { apiCall } from "@/lib/api/apiService";
import { create } from "zustand";

// --- Types (Exported for use in components) ---

export type NotificationType =
  | "Overview"
  | "Users"
  | "Shop"
  | "Orders"
  | "UsersAccepted"
  | "comment"
  | "like";

export interface NotificationItem {
  id: string;
  name: string;
  time: string;
  message: string;
  avatar: any;
  type: NotificationType;
  read: boolean;
  request?: boolean;
  followPending?: boolean;
  userByFollowerId?: string; // ID of the user who sent the request
  postID?: string;
  createdAt?: string; // For sorting
  onPress?: () => void;
}

// --- Store State and Actions ---

interface NotificationState {
  notifications: NotificationItem[];
  followedUsers: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  filter: string;
  error: string | null;
}

interface NotificationActions {
  setFilter: (filter: string) => void;
  fetchFollowings: (userId: string) => Promise<void>;
  loadNotifications: (userId: string, isRefresh?: boolean) => Promise<void>;
  acceptFollowRequest: (requestId: string, userId: string) => Promise<void>;
  rejectFollowRequest: (requestId: string) => Promise<void>;
  followUser: (myId: string, userToFollowId: string) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  setFollowPending: (notificationId: string) => void;
  getFilteredNotifications: () => NotificationItem[];
}

export type NotificationStore = NotificationState & NotificationActions;

// --- Internal Helper Functions ---

const LynkdLogo = require("@/assets/icon.png");

// The static "Welcome" notification
const allNotifications: NotificationItem[] = [
  {
    id: "welcome",
    name: "Welcome to Lynkd App",
    time: "",
    message:
      "Welcome to Lynkd App. We are excited to have you on board. Start exploring now!",
    avatar: LynkdLogo,
    type: "Overview",
    read: false,
    createdAt: new Date().toISOString(), // Add createdAt for sorting
  },
];

// Time formatting helper
const getTimeFromDateObject = (createdAt: Date) => {
  const hours = createdAt.getHours();
  const minutes = createdAt.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const hours12 = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours12}:${formattedMinutes} ${ampm}`;
};

// Fetch follow requests
const fetchFollowRequestsInternal = async (
  userId: string
): Promise<NotificationItem[]> => {
  try {
    if (!userId) return [];

    const response = await apiCall(
      `/api/follows/followRequests/${userId}`,
      "GET"
    );
    const followRequests = response?.followerRequests || [];

    const followRequestNotifications = followRequests
      ?.map((request: any): NotificationItem | null => {
        const createdAt = new Date(request.created_at);
        const now = new Date();
        const localCreatedAt = new Date(
          createdAt.getTime() - createdAt.getTimezoneOffset() * 60000
        );
        const diffInMinutes = Math.floor(
          (now.getTime() - localCreatedAt.getTime()) / 60000
        );

        let time;
        if (diffInMinutes < 60) {
          time = getTimeFromDateObject(localCreatedAt);
        } else if (diffInMinutes < 1440) {
          time = getTimeFromDateObject(localCreatedAt);
        } else if (diffInMinutes < 43200) {
          const days = Math.floor(diffInMinutes / 1440);
          time = days === 1 ? "1 day ago" : `${days} days ago`;
        } else {
          const months = Math.floor(diffInMinutes / 43200);
          time = months === 1 ? "1 month ago" : `${months} months ago`;
        }

        const trimmedName = (
          (request.userByFollowerId?.first_name?.trim() || "") +
          " " +
          (request.userByFollowerId?.last_name?.trim() || "")
        ).trim();

        if (request.status === "pending") {
          return {
            id: request.id,
            name: request.userByFollowerId.username,
            userByFollowerId: request.userByFollowerId.id,
            time: time,
            message: `${trimmedName} has requested to follow you.`,
            avatar: request.userByFollowerId.profile_picture,
            type: "Users",
            request: true,
            read: false,
            createdAt: localCreatedAt.toISOString(),
          };
        } else {
          return {
            id: request.id,
            name: request.userByFollowerId.username,
            userByFollowerId: request.userByFollowerId.id,
            time: time,
            message: `${trimmedName} has followed you.`,
            avatar: request.userByFollowerId.profile_picture,
            type: "UsersAccepted",
            request: false,
            read: false,
            createdAt: localCreatedAt.toISOString(),
          };
        }
      })
      .filter((notif: any) => notif?.message?.length > 0);

    // Fetch followed requests (accepted requests)
    const response2 = await apiCall(
      `/api/follows/followedRequests/${userId}`,
      "GET"
    );
    const followedRequests = response2?.followedRequests || [];

    const followedRequestNotifications = followedRequests
      .map((request: any): NotificationItem | null => {
        const createdAt = new Date(request.created_at);
        const now = new Date();
        const localCreatedAt = new Date(
          createdAt.getTime() - createdAt.getTimezoneOffset() * 60000
        );
        const diffInMinutes = Math.floor(
          (now.getTime() - localCreatedAt.getTime()) / 60000
        );

        let time;
        if (diffInMinutes < 60) {
          time = `${diffInMinutes} min ago`;
        } else if (diffInMinutes < 1440) {
          time = `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else if (diffInMinutes < 43200) {
          time = `${Math.floor(diffInMinutes / 1440)} days ago`;
        } else {
          time = `${Math.floor(diffInMinutes / 43200)} months ago`;
        }

        const trimmedName = (
          (request.user?.first_name?.trim() || "") +
          " " +
          (request.user?.last_name?.trim() || "")
        ).trim();

        if (!request.user.is_creator) {
          return {
            id: request.id,
            name: request.user.username,
            time: time,
            message: `${trimmedName} has accepted your follow request.`,
            avatar: request.user?.profile_picture,
            type: "Users",
            request: false,
            read: false,
            createdAt: localCreatedAt.toISOString(),
            userByFollowerId: request.user.id,
          };
        }
        return null;
      })
      .filter(Boolean);

    return [
      ...followRequestNotifications,
      ...followedRequestNotifications,
    ] as NotificationItem[];
  } catch (error) {
    console.error("Error fetching follow requests:", error);
    return [];
  }
};

// Fetch general notifications
const fetchNotificationsInternal = async (
  userId: string
): Promise<NotificationItem[]> => {
  try {
    if (!userId) return [];

    const response = await apiCall(`/api/notifications/user/${userId}`, "GET");
    const notifications = response?.data?.notifications || [];

    const notificationItems = notifications.map((notification: any) => {
      const createdAt = new Date(notification.created_at);
      const now = new Date();
      const localCreatedAt = new Date(
        createdAt.getTime() - createdAt.getTimezoneOffset() * 60000
      );
      const diffInMinutes = Math.floor(
        (now.getTime() - localCreatedAt.getTime()) / 60000
      );

      let time;
      if (diffInMinutes < 60) {
        time = `${diffInMinutes} min ago`;
      } else if (diffInMinutes < 1440) {
        time = `${Math.floor(diffInMinutes / 60)} hours ago`;
      } else if (diffInMinutes < 43200) {
        time = `${Math.floor(diffInMinutes / 1440)} days ago`;
      } else {
        time = `${Math.floor(diffInMinutes / 43200)} months ago`;
      }

      return {
        id: notification.id,
        name: notification.title,
        time: time,
        message: notification.message,
        avatar: notification?.user?.profile_picture,
        type: notification.type as NotificationType,
        read: false,
        postID: notification.post_id,
        createdAt: localCreatedAt.toISOString(),
      };
    });

    return notificationItems;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

// --- Store Definition ---

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // --- State ---
  notifications: [],
  followedUsers: [],
  isLoading: false,
  isRefreshing: false,
  filter: "Overview",
  error: null,

  // --- Actions ---
  setFilter: (filter: string) => set({ filter }),

  markAsRead: (notificationId: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    })),

  setFollowPending: (notificationId: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, followPending: true } : n
      ),
    })),

  // ✅ --- UPDATED FUNCTION ---
  fetchFollowings: async (userId: string) => {
    try {
      if (!userId) return;
      const response = await apiCall(`/api/follows/following/${userId}`, "GET");
      // Use the mapping logic from your old store
      const followingData = response.following.map((follow: any) => follow.id);
      console.log("Liked Follows:", followingData);
      set({ followedUsers: followingData });
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  },

  loadNotifications: async (userId: string, isRefresh = false) => {
    if (get().isLoading || get().isRefreshing) return; // Prevent re-entry
    try {
      if (isRefresh) {
        set({ isRefreshing: true, error: null });
      } else {
        set({ isLoading: true, error: null });
      }

      // Run fetches in parallel
      const [followNotifs, generalNotifs] = await Promise.all([
        fetchFollowRequestsInternal(userId),
        fetchNotificationsInternal(userId),
        get().fetchFollowings(userId), // Also fetch followings
      ]);

      const allCombinedNotifications = [
        ...followNotifs,
        ...generalNotifs,
        ...allNotifications, // Add the static "Welcome" notification
      ].sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      set({
        notifications: allCombinedNotifications,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error) {
      console.error("Error loading notifications:", error);
      set({
        error: "Failed to load notifications",
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  acceptFollowRequest: async (requestId: string, userId: string) => {
    try {
      const response = await apiCall(
        `/api/follows/acceptRequest/${requestId}`,
        "POST"
      );
      console.log("acceptFollowRequest:", response);
      if (response?.status === "success") {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== requestId),
        }));
        await get().fetchFollowings(userId); // Refresh follow list
      }
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
  },

  rejectFollowRequest: async (requestId: string) => {
    try {
      const response = await apiCall(
        `/api/follows/rejectRequest/${requestId}`,
        "DELETE"
      );

      console.log("rejectFollowRequest:", response);
      if (response?.status === "success") {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== requestId),
        }));
      }
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    }
  },

  followUser: async (myId: string, userToFollowId: string) => {
    try {
      const response = await apiCall(
        `/api/follows/follow/${myId}/${userToFollowId}`,
        "POST"
      );
      console.log("followUser :", response);
      if (response.data) {
        await get().fetchFollowings(myId); // Refresh follow list
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  },

  // --- Getter ---
  getFilteredNotifications: () => {
    const { filter, notifications } = get();
    if (filter === "Overview") {
      return notifications;
    }
    if (filter === "Users") {
      return notifications.filter(
        (n) => n.type === "Users" || n.type === "UsersAccepted"
      );
    }
    return notifications.filter((n) => n.type === filter);
  },
}));
