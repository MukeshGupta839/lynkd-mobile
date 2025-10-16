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

export type PostPreview = {
  id: string;
  image: string;
  author: string;
  caption?: string;
  author_avatar?: string;
  videoUrl?: string;
  thumb?: string;
  /** ✅ Must be a real boolean after normalization */
  verified?: boolean;
};

export type ChatUser = {
  id: string;
  username: string;
  profile_picture: string;
  role?: "Creator" | "User";
};

export type ChatItem = {
  id: string;
  sender: User;
  receiver: User;
  content?: string;
  created_at: string;
  unread?: boolean;
  /** Optional badge count for inbox row */
  unreadCount?: number;

  // Support sharing posts directly into chat
  messageType?: "text" | "post";
  postId?: string;

  // preview so the DM/inbox can render and play the post
  postPreview?: PostPreview;
};

export const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* ---------------------------------------------------------------------------
   Normalize a preview so "verified" is ALWAYS a boolean.
   Tolerates upstream keys: verified, isVerified, author_verified, user.verified,
   user.isVerified, is_creator.
--------------------------------------------------------------------------- */
function normalizePreview(
  preview?: PostPreview | (PostPreview & any)
): PostPreview | undefined {
  if (!preview) return undefined;

  const v =
    preview.verified ??
    preview.isVerified ??
    preview.author_verified ??
    preview.user?.verified ??
    preview.user?.isVerified ??
    preview.is_creator;

  return {
    id: String(preview.id),
    image: preview.image,
    author: preview.author,
    caption: preview.caption,
    author_avatar: preview.author_avatar,
    videoUrl:
      typeof preview.videoUrl === "string" ? preview.videoUrl : undefined,
    thumb: typeof preview.thumb === "string" ? preview.thumb : undefined,
    verified: Boolean(v),
  };
}

/** ---------------------------------------------------------
 * Demo post registry (for preview rendering in chat/inbox)
 * - Add the posts from your feed here using the same postId
 * - Or pass a preview object when calling share/send helpers
 * --------------------------------------------------------- */
export const POST_REGISTRY: Record<string, PostPreview> = {
  "100523": {
    id: "100523",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1080",
    author: "tollywoodtide",
    caption:
      "Merry Christmas Everyone! 🎄❤️ Wishing you a season filled with peace, joy, good health, and happiness.",
    // verified: true,
  },
  "100307": {
    id: "100307",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1080",
    author: "nature.snap",
    caption: "Golden hour hits different ✨",
  },
};

/** ✅ Always return a NORMALIZED preview */
export function getPostPreview(postId: string): PostPreview | undefined {
  const p = POST_REGISTRY[String(postId)];
  return normalizePreview(p);
}

/** ✅ Register or overwrite a post preview at runtime (from feed/share) */
export function registerPost(preview: PostPreview & any) {
  if (!preview?.id) return;
  POST_REGISTRY[String(preview.id)] = normalizePreview({
    id: String(preview.id),
    image: preview.image,
    author: preview.author,
    caption: preview.caption,
    author_avatar: preview.author_avatar,
    videoUrl: preview.videoUrl,
    thumb: preview.thumb,
    // pass-through any upstream verified flags; normalizePreview will coerce
    verified:
      preview.verified ??
      preview.isVerified ??
      preview.author_verified ??
      preview.user?.verified ??
      preview.user?.isVerified ??
      preview.is_creator,
  }) as PostPreview;
}

/** Safe getter some components prefer */
export function getPostById(postId?: string): PostPreview | undefined {
  if (!postId) return undefined;
  return getPostPreview(postId);
}

/**
 * Mixed stories with images & short mp4s.
 * Added more users (9–16) to widen the inbox.
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
  // --- New profiles ---
  {
    id: "9",
    username: "sofia.design",
    profile_picture: "https://randomuser.me/api/portraits/women/9.jpg",
    role: "Creator",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=900",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900",
    ],
  },
  {
    id: "10",
    username: "marko.codes",
    profile_picture: "https://randomuser.me/api/portraits/men/10.jpg",
    role: "Consumer",
    isOnline: false,
    hasStory: false,
    stories: [],
  },
  {
    id: "11",
    username: "amy.cook",
    profile_picture: "https://randomuser.me/api/portraits/women/11.jpg",
    role: "Creator",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900",
    ],
  },
  {
    id: "12",
    username: "zack.runner",
    profile_picture: "https://randomuser.me/api/portraits/men/12.jpg",
    role: "Consumer",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=900",
      "https://cdn.pixabay.com/video/2016/08/11/4643-178345972_tiny.mp4",
    ],
  },
  {
    id: "13",
    username: "priya.v",
    profile_picture: "https://randomuser.me/api/portraits/women/13.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: false,
    stories: [],
  },
  {
    id: "14",
    username: "daniel.photo",
    profile_picture: "https://randomuser.me/api/portraits/men/14.jpg",
    role: "Creator",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=900",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900",
    ],
  },
  {
    id: "15",
    username: "meera.music",
    profile_picture: "https://randomuser.me/api/portraits/women/15.jpg",
    role: "Creator",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?q=80&w=900",
    ],
  },
  {
    id: "16",
    username: "tom.travel",
    profile_picture: "https://randomuser.me/api/portraits/men/16.jpg",
    role: "Consumer",
    isOnline: false,
    hasStory: true,
    stories: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=900",
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
 * Added several with unreadCount to render badges.
 */
export const CHAT_LIST_DUMMY: ChatItem[] = [
  {
    id: "c1",
    sender: USERS[0],
    receiver: LOGGED_USER,
    content: "Hey! How are you?",
    created_at: new Date().toISOString(),
    unread: true,
    unreadCount: 3,
  },
  {
    id: "c2",
    sender: USERS[2],
    receiver: LOGGED_USER,
    content: "Sent a link — check it out",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: true,
    unreadCount: 1,
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
    unread: true,
    unreadCount: 5,
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
    unread: true,
    unreadCount: 2,
  },
  {
    id: "c7",
    sender: USERS[1],
    receiver: LOGGED_USER,
    content: "Let’s catch up later",
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    unread: false,
  },
  {
    id: "c8",
    sender: USERS[8],
    receiver: LOGGED_USER,
    content: "Mockups ready. Feedback?",
    created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    unread: true,
    unreadCount: 1,
  },
  {
    id: "c9",
    sender: USERS[9],
    receiver: LOGGED_USER,
    content: "Did you ship the fix?",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread: false,
  },
  {
    id: "c10",
    sender: USERS[10],
    receiver: LOGGED_USER,
    content: "Recipe pics 🔥",
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    unread: true,
    unreadCount: 4,
  },
  {
    id: "c11",
    sender: USERS[11],
    receiver: LOGGED_USER,
    content: "Tempo run done ✅",
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    unread: false,
  },
  {
    id: "c12",
    sender: USERS[12],
    receiver: LOGGED_USER,
    content: "Need your take on this.",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    unread: true,
    unreadCount: 2,
  },
  {
    id: "c13",
    sender: USERS[13],
    receiver: LOGGED_USER,
    content: "Golden hour tonight?",
    created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    unread: false,
  },
  {
    id: "c14",
    sender: USERS[14],
    receiver: LOGGED_USER,
    content: "New track draft 🎧",
    created_at: new Date(Date.now() - 1000 * 30).toISOString(),
    unread: true,
    unreadCount: 1,
  },
  {
    id: "c15",
    sender: USERS[15],
    receiver: LOGGED_USER,
    content: "Tickets booked! 🛫",
    created_at: new Date(Date.now() - 1000 * 20).toISOString(),
    unread: false,
  },
];

/* =========================================================
   A) Inbox helpers: share a post into chat list (no API)
   ========================================================= */

export function getUserById(userId: string): User {
  return USERS.find((u) => u.id === userId) ?? LOGGED_USER;
}

function newChatId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Insert a "post" message into the chat list preview. */
export function sharePostToUser(
  postId: string,
  toUserId: string,
  preview?: PostPreview
): ChatItem {
  const toUser = getUserById(toUserId);
  const resolved = normalizePreview(preview ?? getPostPreview(postId));

  const item: ChatItem = {
    id: newChatId(),
    sender: LOGGED_USER,
    receiver: toUser,
    content: `Shared a post`,
    created_at: new Date().toISOString(),
    unread: true,
    unreadCount: 1,
    messageType: "post",
    postId,
    postPreview: resolved, // ✅ normalized (has verified boolean)
  };

  CHAT_LIST_DUMMY.unshift(item);
  return item;
}

export function sharePostToUsers(
  postId: string,
  userIds: string[],
  preview?: PostPreview
): ChatItem[] {
  const out: ChatItem[] = [];
  userIds.forEach((uid) => out.push(sharePostToUser(postId, uid, preview)));
  return out;
}

/* =========================================================
   B) Per-DM message store (what the chat screen actually renders)
   ========================================================= */

export const MESSAGES_BY_USER: Record<string, ChatItem[]> = {};

function newMsgId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function pushMessage(otherUserId: string, msg: ChatItem) {
  if (!MESSAGES_BY_USER[otherUserId]) MESSAGES_BY_USER[otherUserId] = [];
  MESSAGES_BY_USER[otherUserId].push(msg);
}

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

export function sendPostToChat(
  toUserId: string,
  postId: string,
  preview?: PostPreview
): ChatItem {
  const receiver = getUserById(toUserId);
  const resolved = normalizePreview(preview ?? getPostPreview(postId));

  const msg: ChatItem = {
    id: newMsgId(),
    sender: LOGGED_USER,
    receiver,
    content: "Shared a post",
    created_at: new Date().toISOString(),
    unread: true,
    messageType: "post",
    postId,
    postPreview: resolved, // ✅ normalized (has verified boolean)
  };
  pushMessage(toUserId, msg);
  return msg;
}

export function getMessagesWith(otherUserId: string): ChatItem[] {
  return MESSAGES_BY_USER[otherUserId] ?? [];
}
