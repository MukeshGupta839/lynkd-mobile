// constants/chat.ts
export type User = {
  id: string;
  username: string;
  profile_picture?: string;
  role?: string;
  isOnline?: boolean;
  hasStory?: boolean;
  stories?: string[];
};

export type ChatItem = {
  id: string;
  sender: User;
  receiver: User;
  content?: string;
  created_at: string;
  unread?: boolean;

  // Support sharing posts directly into chat
  messageType?: "text" | "post";
  postId?: string;
};

export const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/**
 * Mixed stories:
 * - Use both images and .mp4 videos
 * - Some users have 1–2 stories
 * - One user has 6 stories to stress-test
 */
export const USERS: User[] = [
  {
    id: "1",
    username: "alex_harma",
    profile_picture: "https://randomuser.me/api/portraits/men/1.jpg",
    role: "Consumer",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=900",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=900",
      "https://cdn.pixabay.com/video/2022/07/24/125314-733046618_tiny.mp4",
    ],
  },
  {
    id: "2",
    username: "jamie_870",
    profile_picture: "https://randomuser.me/api/portraits/men/2.jpg",
    role: "Consumer",
    isOnline: false,
    hasStory: true,
    stories: [
      "https://cdn.pixabay.com/video/2022/11/07/138173-768820177_large.mp4",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=900",
    ],
  },
  {
    id: "3",
    username: "jane_math",
    profile_picture: "https://randomuser.me/api/portraits/women/3.jpg",
    role: "Creator",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1519817914152-22d216bb9170?q=80&w=900",
    ],
  },
  {
    id: "4",
    username: "mad_max",
    profile_picture: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=900",
      "https://cdn.pixabay.com/video/2022/11/07/138173-768820177_large.mp4",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900",
      "https://cdn.pixabay.com/video/2023/11/19/189692-886572510_tiny.mp4",
    ],
  },
  {
    id: "5",
    username: "nina_modes",
    profile_picture: "https://randomuser.me/api/portraits/women/5.jpg",
    role: "Creator",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=900",
      "https://cdn.pixabay.com/video/2023/02/18/151215-800216770_large.mp4",
    ],
  },
  {
    id: "6",
    username: "rahul.dev",
    profile_picture: "https://randomuser.me/api/portraits/men/6.jpg",
    role: "Consumer",
    isOnline: true,
    hasStory: false,
    stories: [],
  },
  {
    id: "7",
    username: "chloe.art",
    profile_picture: "https://randomuser.me/api/portraits/women/7.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=900",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=900",
    ],
  },
  {
    id: "8",
    username: "liam.tech",
    profile_picture: "https://randomuser.me/api/portraits/men/8.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: [
      "https://cdn.pixabay.com/video/2023/02/18/151215-800216770_large.mp4",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=900",
    ],
  },
];

export const LOGGED_USER: User = {
  id: "me",
  username: "You",
  profile_picture: "https://randomuser.me/api/portraits/men/40.jpg",
  isOnline: true,
};

/**
 * Chat list preview items (like inbox). These are not the per-thread messages.
 */
export const CHAT_LIST_DUMMY: ChatItem[] = [
  {
    id: "c1",
    sender: USERS[0],
    receiver: LOGGED_USER,
    content: "Hey! How are you?",
    created_at: new Date().toISOString(),
    unread: true,
  },
  {
    id: "c2",
    sender: USERS[2],
    receiver: LOGGED_USER,
    content: "Sent a link — check it out",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: false,
  },
  {
    id: "c3",
    sender: USERS[4],
    receiver: LOGGED_USER,
    content: "Ping when free?",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    unread: false,
  },
  {
    id: "c4",
    sender: USERS[6],
    receiver: LOGGED_USER,
    content: "New drop going live!",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: false,
  },
  {
    id: "c5",
    sender: USERS[5],
    receiver: LOGGED_USER,
    content: "No stories here yet 😅",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    unread: false,
  },
  {
    id: "c6",
    sender: USERS[7],
    receiver: LOGGED_USER,
    content: "Check this quick vid",
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    unread: false,
  },
  {
    id: "c7",
    sender: USERS[1],
    receiver: LOGGED_USER,
    content: "Let’s catch up later",
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    unread: false,
  },
];

/* =========================================================
   A) Inbox helpers: share a post into chat list (no API)
   ========================================================= */

/** Find a user by id from USERS (fallback to LOGGED_USER if not found). */
export function getUserById(userId: string): User {
  return USERS.find((u) => u.id === userId) ?? LOGGED_USER;
}

/** Create a ChatItem id. */
function newChatId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Insert a "post" message from LOGGED_USER to a single user (chat list preview).
 * Returns the created ChatItem.
 */
export function sharePostToUser(postId: string, toUserId: string): ChatItem {
  const toUser = getUserById(toUserId);
  const item: ChatItem = {
    id: newChatId(),
    sender: LOGGED_USER,
    receiver: toUser,
    content: `Shared a post`,
    created_at: new Date().toISOString(),
    unread: true,
    messageType: "post",
    postId,
  };

  // Put newest at the top of the list
  CHAT_LIST_DUMMY.unshift(item);
  return item;
}

/** Share the same post to multiple users (UI enforces max 5). */
export function sharePostToUsers(
  postId: string,
  userIds: string[]
): ChatItem[] {
  const out: ChatItem[] = [];
  userIds.forEach((uid) => out.push(sharePostToUser(postId, uid)));
  return out;
}

/* =========================================================
   B) Per-DM message store (what the chat screen actually renders)
   ========================================================= */

/**
 * Map by otherUserId -> messages in that DM (oldest -> newest).
 * We reuse ChatItem as the message shape for simplicity.
 */
export const MESSAGES_BY_USER: Record<string, ChatItem[]> = {};

function newMsgId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function pushMessage(otherUserId: string, msg: ChatItem) {
  if (!MESSAGES_BY_USER[otherUserId]) MESSAGES_BY_USER[otherUserId] = [];
  MESSAGES_BY_USER[otherUserId].push(msg);
}

/** Send a plain text message to a DM (stored in per-thread store). */
export function sendText(toUserId: string, text: string): ChatItem {
  const receiver = getUserById(toUserId);
  const msg: ChatItem = {
    id: newMsgId(),
    sender: LOGGED_USER,
    receiver,
    content: text,
    created_at: new Date().toISOString(),
    unread: true,
    messageType: "text",
  };
  pushMessage(toUserId, msg);
  return msg;
}

/** Send a POST attachment into the DM (used by ShareSectionBottomSheet). */
export function sendPostToChat(toUserId: string, postId: string): ChatItem {
  const receiver = getUserById(toUserId);
  const msg: ChatItem = {
    id: newMsgId(),
    sender: LOGGED_USER,
    receiver,
    content: "Shared a post",
    created_at: new Date().toISOString(),
    unread: true,
    messageType: "post",
    postId,
  };
  pushMessage(toUserId, msg);
  return msg;
}

/** Get all messages in the DM with `otherUserId`. */
export function getMessagesWith(otherUserId: string): ChatItem[] {
  return MESSAGES_BY_USER[otherUserId] ?? [];
}
