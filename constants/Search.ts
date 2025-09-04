export type SearchItem = {
    id: string;
    name: string;
    image: any;
    gradient: readonly [string, string];
    category: string;
};

// 🔹 Single source of truth: allProducts
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

// 🔹 Recent searches are just IDs from allProducts
export const recentSearchIds: string[] = ["1", "2", "3", "4", "5"];
