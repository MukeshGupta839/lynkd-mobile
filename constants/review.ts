// ---- types ----
export type Review = {
  id: string;
  name: string;
  avatar?: any; // services + products both can use this
  verified?: boolean;
  rating: number;
  text: string;
  photos?: any[]; // only used for product reviews
};

export type ReviewsSummary = {
  total: string;
  average: number;
  basedOnText: string;
};

// ---- Product Reviews ----
export const reviewsSummary: ReviewsSummary = {
  average: 4.6,
  basedOnText: "Based on 18.1K Ratings",
  total: "",
};

export const reviewsData: Review[] = [
  {
    id: "r1",
    name: "Karthik Kumar",
    avatar: require("../assets/images/Product/profileimage.jpg"),
    verified: true,
    rating: 4.5,
    text: "Bought the phone solely for battery performance and assuming camera of iPhones are always good. A bit of disappointment as I switched from Samsung S22 Plus which offered great screen quality, excellent camera and Galaxy AI did wonders while iPhone 16 is not performing as expected in terms of battery and camera quality.",
    photos: [
      require("../assets/images/Product/review1.png"),
      require("../assets/images/Product/review2.png"),
      require("../assets/images/Product/review3.png"),
    ],
  },
  {
    id: "r2",
    name: "Girija",
    avatar: require("../assets/images/Product/profileimage1.jpg"),
    verified: true,
    rating: 4.5,
    text: "Bought the phone solely for battery performance and assuming camera of iPhones are always good.",
    photos: [
      require("../assets/images/Product/review4.png"),
      require("../assets/images/Product/review5.png"),
      require("../assets/images/Product/review6.png"),
    ],
  },
  {
    id: "r3",
    name: "Srikanth Gudi",
    avatar: require("../assets/images/Product/profileimage2.jpg"),
    verified: true,
    rating: 4.5,
    text: "Bought the phone solely for battery performance and assuming camera of iPhones are always good.",
    photos: [
      require("../assets/images/Product/review2.png"),
      require("../assets/images/Product/review4.png"),
      require("../assets/images/Product/review6.png"),
    ],
  },
];

// ---- Service Reviews ----
export const servicesReviewsSummary: ReviewsSummary = {
  average: 4.5,
  basedOnText: "Based on 2.1K Reviews",
  total: "",
};

export const servicesReviewsData: Review[] = [
  {
    id: "s1",
    name: "Rahul Sharma",
    avatar: require("../assets/images/Product/profileimage.jpg"),
    rating: 4.5,
    verified: true,
    text: "Great ambience and quick service. The food quality was very good and staff were polite.",
  },
  {
    id: "s2",
    name: "Priya Nair",
    avatar: require("../assets/images/Product/profileimage1.jpg"),
    rating: 4.0,
    text: "The restaurant was clean and family-friendly. AC seating was comfortable, but waiting time was a bit long.",
  },
  {
    id: "s3",
    name: "Mohammed Ali",
    avatar: require("../assets/images/Product/profileimage2.jpg"),
    rating: 5.0,
    verified: true,
    text: "Loved the private cabins! Perfect for a family gathering. Highly recommended for anyone looking for privacy.",
  },
];
