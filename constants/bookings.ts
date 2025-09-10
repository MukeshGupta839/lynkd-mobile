export type EventT = {
  id: string;
  title: string;
  price?: string;
  location?: string;
  dateLabel?: string;
  image?: any;
  category?:
    | "music"
    | "club"
    | "sport"
    | "festival"
    | "movie"
    | "concert"
    | "all";
  latitude: number;
  longitude: number;
  // NEW: mark live only applies/useful for club/music/sport events
  isLive?: boolean;
};

export type CategoryT = {
  key: string;
  label: string;
  icon: "apps" | "musical-notes" | "star" | "basketball";
};

// Adjust asset paths if required
export const event1 = require("@/assets/images/Product/event1.png");
export const event2 = require("@/assets/images/Product/event2.png");
export const event3 = require("@/assets/images/Product/event3.png");
export const event4 = require("@/assets/images/Product/event4.png");
export const event5 = require("@/assets/images/Product/event5.png");

export const UPCOMING_EVENTS: EventT[] = [
  {
    id: "u1",
    title: "Synchronize Fest 2024",
    price: "₹1,499 - ₹4,999",
    location: "Yogyakarta",
    dateLabel: "May 20",
    image: event1,
    category: "festival",
    latitude: -7.8014,
    longitude: 110.364,
    // festival -> not live (omit or false)
  },
  {
    id: "u2",
    title: "WINC #9 : Gatot",
    price: "₹399 - ₹999",
    location: "Yogyakarta",
    dateLabel: "Oct 7",
    image: event2,
    category: "club",
    latitude: -7.7956,
    longitude: 110.3695,
    // example: this club event is live
    isLive: true,
  },
];

export const POPULAR_EVENTS: EventT[] = [
  {
    id: "p1",
    title: "BMTH Tour 2024",
    price: "₹2,999 - ₹7,999",
    location: "Mandala Krida, Yogyakarta",
    image: event3,
    category: "music",
    latitude: -7.7829,
    longitude: 110.3884, // Mandala Krida Stadium
    // example: music event not live currently
    isLive: false,
  },
  {
    id: "p2",
    title: "Moshing Metal Fest 2024",
    price: "₹899 - ₹1,499",
    location: "Sleman, Yogyakarta",
    image: event5,
    category: "music",
    latitude: -7.717,
    longitude: 110.3554, // Sleman area
    // example: make this one live
    isLive: true,
  },
  {
    id: "p3",
    title: "Moshing Metal Fest II 2024",
    price: "₹999 - ₹1,799",
    location: "Maguwo, Yogyakarta",
    image: event4,
    category: "sport",
    latitude: -7.7687,
    longitude: 110.425, // Maguwoharjo Stadium
    // sport event can be live or not; example set false
    isLive: false,
  },
];

export const CATEGORIES: CategoryT[] = [
  { key: "all", label: "All", icon: "apps" },
  { key: "music", label: "Music", icon: "musical-notes" },
  { key: "club", label: "Club", icon: "star" },
  { key: "sport", label: "Sport", icon: "basketball" },
  { key: "festival", label: "Festival", icon: "star" },
  { key: "movie", label: "Movie", icon: "star" },
  { key: "concert", label: "Concert", icon: "star" },
];
