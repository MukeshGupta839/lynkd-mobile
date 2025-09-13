// constants/Search.ts
export type SearchItem = {
  id: string;
  name: string;
  image: any;
  gradient: readonly [string, string];
  category: string;
};

// keep your existing products (unchanged shape)
export const allProducts: SearchItem[] = [
  {
    id: "1",
    name: "Google Pixel 9 Pro XL",
    image: require("../assets/images/Product/Pixel9pro.png"),
    gradient: ["#3C3C3D", "#000000"] as const,
    category: "phones",
  },
  {
    id: "2",
    name: "Iphone 16 Pro Max",
    image: require("../assets/images/Product/iphone.png"),
    gradient: ["#000000", "#E6E3DD"] as const,
    category: "phones",
  },
  {
    id: "3",
    name: "Samsung Galaxy 25 Ultra",
    image: require("../assets/images/Product/phone.png"),
    gradient: ["#BBBFCB", "#000000"] as const,
    category: "phones",
  },
  {
    id: "4",
    name: "Sony WH-CH720N..",
    image: require("../assets/images/Product/headphone.png"),
    gradient: ["#030304", "#ebf0f5ff"] as const,
    category: "headphones",
  },
  {
    id: "5",
    name: "Apple MacBook Air Apple M4",
    image: require("../assets/images/Product/Macbooks.png"),
    gradient: ["#54D6D6", "#000000"] as const,
    category: "laptops",
  },
  {
    id: "6",
    name: "Iphone 16 Pro",
    image: require("../assets/images/Product/iphone.png"),
    gradient: ["#000000", "#E6E3DD"] as const,
    category: "phones",
  },
  {
    id: "7",
    name: "Iphone 16",
    image: require("../assets/images/Product/iphone.png"),
    gradient: ["#000000", "#E6E3DD"] as const,
    category: "phones",
  },
  {
    id: "8",
    name: "Iphone 15 Pro",
    image: require("../assets/images/Product/iphone.png"),
    gradient: ["#000000", "#E6E3DD"] as const,
    category: "phones",
  },
];

// Recent searches (product IDs) — keeps your original export name
export const recentSearchIds: string[] = ["1", "2", "3", "4", "5"];

/* ---------------------------
   Services dataset & types
   --------------------------- */
export type ServiceItem = {
  id: string;
  title: string;
  category?: string;
  tag?: string;
  image: any;
  gradient: readonly [string, string];
  duration?: string; // e.g. "30m"
  price?: string; // optional display price
};

export const allServices: ServiceItem[] = [
  {
    id: "s1",
    title: "KFC",
    category: "Restaurant",
    tag: "massage",
    image: require("../assets/images/kfcsmall.png"),
    gradient: ["#FFD7D7", "#FFF8F0"] as const,
  },
  {
    id: "s2",
    title: "Five Star hotel",
    category: "Hotel",
    tag: "physio",
    image: require("../assets/images/hotelsmall.png"),
    gradient: ["#D7FFF2", "#F0FFF9"] as const,
  },
  {
    id: "s3",
    title: "Club",
    category: "Club",
    tag: "consultation",
    image: require("../assets/images/club.png"),
    gradient: ["#E6F0FF", "#FFFFFF"] as const,
  },
  {
    id: "s4",
    title: "KFC AirBypass Road",
    category: "Restaurant",
    tag: "massage",
    image: require("../assets/images/kfcsmall.png"),
    gradient: ["#FFD7D7", "#FFF8F0"] as const,
  },
  {
    id: "s5",
    title: "Dominos",
    category: "Restaurant",
    tag: "massage",
    image: require("../assets/images/dominossmall.png"),
    gradient: ["#FFD7D7", "#FFF8F0"] as const,
  },
  {
    id: "s6",
    title: "Prime Club",
    category: "Club",
    tag: "massage",
    image: require("../assets/images/clubsmall.png"),
    gradient: ["#FFD7D7", "#FFF8F0"] as const,
  },
  {
    id: "s7",
    title: "Three Star Hotel",
    category: "Hotel",
    tag: "massage",
    image: require("../assets/images/hotelsmall.png"),
    gradient: ["#FFD7D7", "#FFF8F0"] as const,
  },
  {
    id: "s8",
    title: "SFC",
    category: "Restaurant",
    tag: "massage",
    image: require("../assets/images/kfcsmall.png"),
    gradient: ["#FFD7D7", "#FFF8F0"] as const,
  },
  {
    id: "s9",
    title: "Home Stay",
    category: "Home",
    tag: "massage",
    image: require("../assets/images/hotelsmall.png"),
    gradient: ["#FFD7D7", "#FFF8F0"] as const,
  },
];

export const recentServiceIds: string[] = ["s1", "s3", "s5", "s5", "s9", "s7"];

/* ---------------------------
   Bookings dataset & types
   --------------------------- */
export type BookingItem = {
  id: string;
  title: string;
  category: string;
  status?: "upcoming" | "completed" | "cancelled";
  image: any;
  gradient: readonly [string, string];
};

export const allBookings: BookingItem[] = [
  {
    id: "b1",
    title: "DSP Music",
    category: "Music",
    status: "completed",
    image: require("../assets/images/musicsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
  {
    id: "b2",
    title: "Night Club",
    category: "Club",
    status: "upcoming",
    image: require("../assets/images/clubsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
  {
    id: "b3",
    title: " IPL Cricket",
    category: "Sport",
    status: "upcoming",
    image: require("../assets/images/sportsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
  {
    id: "b4",
    title: "Devotional Music",
    category: "Music",
    status: "completed",
    image: require("../assets/images/musicsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
  {
    id: "b5",
    title: "Football",
    category: "Sport",
    status: "completed",
    image: require("../assets/images/sportsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
  {
    id: "b6",
    title: "Main Club",
    category: "Club",
    status: "completed",
    image: require("../assets/images/clubsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
  {
    id: "b7",
    title: "Pop Music",
    category: "Music",
    status: "cancelled",
    image: require("../assets/images/musicsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
  {
    id: "b8",
    title: "BPL",
    category: "Sport",
    status: "completed",
    image: require("../assets/images/sportsmall.png"),
    gradient: ["#FFF3D7", "#FFEFE6"] as const,
  },
];

export const recentBookingIds: string[] = ["b2", "b1", "b3", "b6", "b8", "b5"];
