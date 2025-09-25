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
};

export const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

export const USERS: User[] = [
  {
    id: "1",
    username: "alex_harma",
    profile_picture: "https://randomuser.me/api/portraits/men/1.jpg",
    role: "Consumer",
    isOnline: true,
    hasStory: true,
    stories: [
      "https://picsum.photos/900/1600?random=11",
      "https://picsum.photos/900/1600?random=12",
    ],
  },
  {
    id: "2",
    username: "jamie.870",
    profile_picture: "https://randomuser.me/api/portraits/men/2.jpg",
    role: "Consumer",
    isOnline: false,
    hasStory: false,
    stories: [],
  },
  {
    id: "3",
    username: "jane.math",
    profile_picture: "https://randomuser.me/api/portraits/women/3.jpg",
    role: "Creator",
    isOnline: true,
    hasStory: true,
    stories: ["https://picsum.photos/900/1600?random=21"],
  },
  {
    id: "4",
    username: "mad_max",
    profile_picture: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: ["https://picsum.photos/900/1600?random=31"],
  },
  {
    id: "4",
    username: "mad_max",
    profile_picture: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: ["https://picsum.photos/900/1600?random=31"],
  },
  {
    id: "5",
    username: "mad_max",
    profile_picture: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: ["https://picsum.photos/900/1600?random=31"],
  },
  {
    id: "6",
    username: "mad_max",
    profile_picture: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: ["https://picsum.photos/900/1600?random=31"],
  },
  {
    id: "7",
    username: "mad_max",
    profile_picture: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "Creator",
    isOnline: false,
    hasStory: true,
    stories: ["https://picsum.photos/900/1600?random=31"],
  },
];

export const LOGGED_USER: User = {
  id: "me",
  username: "You",
  profile_picture: "https://randomuser.me/api/portraits/men/40.jpg",
  isOnline: true,
};

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
    content: "Sent a link — check it out",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: false,
  },
  {
    id: "c4",
    sender: USERS[6],
    receiver: LOGGED_USER,
    content: "Sent a link — check it out",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: false,
  },
  {
    id: "c5",
    sender: USERS[5],
    receiver: LOGGED_USER,
    content: "Sent a link — check it out",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: false,
  },
  {
    id: "c6",
    sender: USERS[7],
    receiver: LOGGED_USER,
    content: "Sent a link — check it out",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: false,
  },
  {
    id: "c7",
    sender: USERS[1],
    receiver: LOGGED_USER,
    content: "Sent a link — check it out",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread: false,
  },
];
