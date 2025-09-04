export const product = {
    name: "Apple iPhone 16",
    mainImage: require("../assets/images/Product/iphoneM.png"),

    // ✅ Added fields
    originalPrice: 220000,
    discount: 55, // %
    rating: 4.5,
    reviews: 2495,

    variants: [
        {
            color: "Ultramarine",
            swatch: require("../assets/images/Product/iphonec1.png"),
        },
        {
            color: "Green",
            swatch: require("../assets/images/Product/iphonec2.png"),
        },
        {
            color: "White",
            swatch: require("../assets/images/Product/iphonec3.png"),
        },
        {
            color: "Pink",
            swatch: require("../assets/images/Product/iphonec4.png"),
        },
        {
            color: "Black",
            swatch: require("../assets/images/Product/iphonec5.png"),
        },
    ],

    thumbnails: [
        require("../assets/images/Product/iphones1.png"),
        require("../assets/images/Product/iphones2.png"),
        require("../assets/images/Product/iphones5.png"),
        require("../assets/images/Product/iphones4.png"),
        require("../assets/images/Product/iphones5.png"),
    ],

    storages: [
        { size: "128GB", price: 79999 },
        { size: "256GB", price: 99999 },
        { size: "512GB", price: 119999 },
        { size: "1TB", price: 139999 },
    ],
};






/*

export type ProductVariant = {
    color: string;
    swatch: any; // small color circle image
    images: any[]; // thumbnails for this color
};

export type StorageVariant = {
    storage: string;
    price: number;
    oldPrice: number;
    discount: string;
};

export type Product = {
    id: string;
    name: string;
    rating: number;
    reviews: number;
    badge: string;
    variants: ProductVariant[];
    storageVariants: StorageVariant[];
};

export const iPhone16: Product = {
    id: "iphone16",
    name: "Apple iPhone 16",
    rating: 4.5,
    reviews: 2495,
    badge: "Super Fast",

    variants: [
        {
            color: "Ultramarine",
            swatch: require("../assets/images/Product/iphone.png"),
            images: [
                require("../assets/images/Product/iphones2.png"),
                require("../assets/images/Product/iphones3.png"),
                require("../assets/images/Product/iphones4.png"),
                require("../assets/images/Product/iphones5.png"),
            ],
        },
        {
            color: "Green",
            swatch: require("../assets/images/Product/iphonec2.png"),
            images: [
                require("../assets/images/Product/iphones2.png"),
                require("../assets/images/Product/iphones3.png"),
                require("../assets/images/Product/iphones4.png"),
                require("../assets/images/Product/iphones5.png"),
            ],
        },
        {
            color: "White",
            swatch: require("../assets/images/Product/iphonec3.png"),
            images: [
                require("../assets/images/Product/iphones2.png"),
                require("../assets/images/Product/iphones3.png"),
                require("../assets/images/Product/iphones4.png"),
                require("../assets/images/Product/iphones5.png"),
            ],
        },
        {
            color: "Pink",
            swatch: require("../assets/images/Product/iphonec4.png"),
            images: [
                require("../assets/images/Product/iphones2.png"),
                require("../assets/images/Product/iphones3.png"),
                require("../assets/images/Product/iphones4.png"),
                require("../assets/images/Product/iphones5.png"),
            ],
        },
        {
            color: "Black",
            swatch: require("../assets/images/Product/iphonec5.png"),
            images: [
                require("../assets/images/Product/iphones2.png"),
                require("../assets/images/Product/iphones3.png"),
                require("../assets/images/Product/iphones4.png"),
                require("../assets/images/Product/iphones5.png"),
            ],
        },
    ],

    storageVariants: [
        { storage: "128GB", price: 79999, oldPrice: 200000, discount: "50%" },
        { storage: "256GB", price: 99999, oldPrice: 220000, discount: "55%" },
        { storage: "512GB", price: 119999, oldPrice: 240000, discount: "60%" },
        { storage: "1TB", price: 139999, oldPrice: 260000, discount: "65%" },
    ],
};
*/