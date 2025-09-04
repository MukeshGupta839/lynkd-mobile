// ---- types ----
export type Review = {
    id: string;
    name: string;
    avatar: any;                 // require("../assets/...png")
    verified?: boolean;
    rating: number;              // e.g. 4.6
    text: string;
    photos?: any[];              // <-- NEW: array of require(...) images
};

export type ReviewsSummary = {
    average: number;
    basedOnText: string;
};

// ---- summary ----
export const reviewsSummary: ReviewsSummary = {
    average: 4.6,
    basedOnText: "Based on 18.1K Ratings",
};



export const reviewsData = [
    {
        id: "r1",
        name: "Karthik Kumar",
        avatar: require("../assets/images/Product/profileimage.jpg"),
        verified: true,
        rating: 4.5,
        text:
            "Bought the phone solely for battery performance and assuming camera of iPhones are always good. A bit of disappointment as I switched from Samsung S22 Plus which offered great screen quality, excellent camera and Galaxy AI did wonders while iPhone 16 is not performing as expected in terms of battery and camera quality.",
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
        text:
            "Bought the phone solely for battery performance and assuming camera of iPhones are always good.",
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
        text:
            "Bought the phone solely for battery performance and assuming camera of iPhones are always good.",
        photos: [
            require("../assets/images/Product/review2.png"),
            require("../assets/images/Product/review4.png"),
            require("../assets/images/Product/review6.png"),
        ],
    },
];
