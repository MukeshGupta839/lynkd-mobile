// constants/cart.ts

export type CartItemT = {
  id: string;
  name: string;
  image: any;
  price: number;
  mrp: number;
  reviews?: number;
};

export type WishlistItemT = {
  id: string;
  name: string;
  image: any;
  price: number;
  dis: number;
  mrp: number;
};

// INR formatter utility
export const INR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const CART_DATA: CartItemT[] = [
  {
    id: "1",
    name: "Apple iPhone 16 (Ultramarine, 128 GB)",
    image: require("@/assets/images/Product/iphonesmall.png"),
    price: 79999,
    mrp: 10000,
    reviews: 2495,
  },
  {
    id: "2",
    name: "Samsung S25 Ultra Titanium 12/512BG",
    image: require("@/assets/images/Product/iphonec2.png"),
    price: 79999,
    mrp: 1000,
    reviews: 2495,
  },
  {
    id: "3",
    name: "Apple iPhone 16 (Mint, 128 GB)",
    image: require("@/assets/images/Product/iphonec4.png"),
    price: 79999,
    mrp: 24000,
  },
];

export const WISHLIST_DATA: WishlistItemT[] = [
  {
    id: "w1",
    name: "Apple iPhone 16 (Ultramarine, 128 GB)",
    image: require("@/assets/images/Product/iphonec1.png"),
    price: 79999,
    mrp: 2000,
    dis: 50,
  },
  {
    id: "w2",
    name: "Samsung S25 Ultra Titanium 12/512BG",
    image: require("@/assets/images/Product/iphonec2.png"),
    price: 79999,
    mrp: 2000,
    dis: 50,
  },
  {
    id: "w3",
    name: "Apple iPhone 16 (Mint, 128 GB)",
    image: require("@/assets/images/Product/iphonec3.png"),
    price: 79999,
    mrp: 2000,
    dis: 50,
  },
  {
    id: "w4",
    name: "Samsung S25 Ultra Titanium 12/512BG",
    image: require("@/assets/images/Product/iphonec4.png"),
    price: 79999,
    mrp: 2000,
    dis: 50,
  },
  {
    id: "w5",
    name: "Samsung S25 Ultra Titanium 12/512BG",
    image: require("@/assets/images/Product/iphonec4.png"),
    price: 79999,
    mrp: 1000,
    dis: 50,
  },
  {
    id: "w6",
    name: "Samsung S25 Ultra Titanium 12/512GB",
    image: require("@/assets/images/Product/iphonec4.png"),
    price: 79999,
    mrp: 200,
    dis: 50,
  },
];
