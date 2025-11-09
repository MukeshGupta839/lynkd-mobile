// constants/review.ts
export type Review = {
  id: string;
  name: string;
  avatar?: any;
  verified?: boolean;
  rating: number;
  text: string;
  photos?: any[];
};

export type ReviewsSummary = {
  total: string;
  average: number;
  basedOnText: string;
};

/* ---------- Phone Reviews ---------- */
export const reviewsSummaryPhone: ReviewsSummary = {
  average: 4.6,
  basedOnText: "Based on 18.1K Ratings",
  total: "",
};

export const reviewsDataPhone: Review[] = [
  {
    id: "r1",
    name: "Karthik Kumar",
    avatar: require("../assets/images/Product/profileimage.jpg"),
    verified: true,
    rating: 4.5,
    text: "Battery life is decent, but the camera could be better compared to my older Samsung model.",
    photos: [
      require("../assets/images/Product/review1.png"),
      require("../assets/images/Product/review2.png"),
    ],
  },
  {
    id: "r2",
    name: "Girija",
    avatar: require("../assets/images/Product/profileimage1.jpg"),
    verified: true,
    rating: 4.0,
    text: "Performance is smooth. Slightly overpriced but overall worth it.",
  },
];

/* ---------- Facewash Reviews ---------- */
export const reviewsSummaryFacewash: ReviewsSummary = {
  average: 4.4,
  basedOnText: "Based on 2.3K Ratings",
  total: "",
};

export const reviewsDataFacewash: Review[] = [
  {
    id: "fw1",
    name: "Sneha Reddy",
    avatar: require("../assets/images/Product/profileimage1.jpg"),
    verified: true,
    rating: 5,
    text: "Love this face wash! It brightens my skin instantly and gives a fresh glow. The Vitamin C really works!",
    photos: [
      {
        uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8ZwyGMlZL78AiGufuI-eWt7mQ8Ar7-kW6vp3N6Qd1c3ITaIE5TCGhgpgF03fRxErtIufe30YQ9o3ycqWNN5ekzpdHKeg6Sloz3cer0nmOW5AcqvaLa8jWaaM",
      },
      {
        uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQy4tp-XMwJB7WNqZ6AqwKiIJcFNE1r2GaTgmcZHWdqa5IAu_9b8r0veBIxMDfBB4QelqZ8mG1CUPpaToBElnMHKrlO45ZcFVmWC7a3p9CxpW7ldcpniU-WYQ",
      },
    ],
  },
  {
    id: "fw2",
    name: "Priyanka Jain",
    avatar: require("../assets/images/Product/profileimage2.jpg"),
    verified: true,
    rating: 4,
    text: "Smells amazing and cleans well. My skin feels soft and refreshed after every wash. Slightly on the pricey side, but worth it!",
    photos: [
      {
        uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8ZwyGMlZL78AiGufuI-eWt7mQ8Ar7-kW6vp3N6Qd1c3ITaIE5TCGhgpgF03fRxErtIufe30YQ9o3ycqWNN5ekzpdHKeg6Sloz3cer0nmOW5AcqvaLa8jWaaM",
      },
    ],
  },
];

/* ---------- Clothing Reviews ---------- */
export const reviewsSummaryClothing: ReviewsSummary = {
  average: 4.7,
  basedOnText: "Based on 9.8K Ratings",
  total: "",
};

export const reviewsDataClothing: Review[] = [
  {
    id: "cl1",
    name: "Ravi Teja",
    avatar: require("../assets/images/Product/profileimage.jpg"),
    verified: true,
    rating: 5,
    text: "The material is soft and fits perfectly. I loved the quality!",
    photos: [
      {
        uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcT8GkmTTP5xZ-7VvXeXmWzFtt-qa3GVjWGyUbWX9ZWznOe3U0V-63-uKO1xEOTpWCWAN8CkZqFC_ESUlsYxLwjK7wKbGzYBaw",
      },
      {
        uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcR5nqTQMSBme220qKh2Q72ZV8UtV8k3XBo9MypTo4szD2dEfpeD5ob8N9puDDRGC7rlCzSHZIXs_0-Qd8nuy82jZaHvkCuE",
      },
    ],
  },
  {
    id: "cl2",
    name: "Ananya Sharma",
    avatar: require("../assets/images/Product/profileimage1.jpg"),
    verified: true,
    rating: 4.5,
    text: "Nice T-shirt! Fabric is breathable and comfortable for summer wear.",
  },
];

/* ---------- Map by kind ---------- */
export const reviewsByKind = {
  phone: {
    summary: reviewsSummaryPhone,
    reviews: reviewsDataPhone,
  },
  facewash: {
    summary: reviewsSummaryFacewash,
    reviews: reviewsDataFacewash,
  },
  clothing: {
    summary: reviewsSummaryClothing,
    reviews: reviewsDataClothing,
  },
};
