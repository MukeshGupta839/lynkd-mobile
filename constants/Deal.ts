// types/deals.ts
import { ImageSourcePropType } from "react-native";

export type DealItem = {
    id?: string | number;
    name: string;
    des: string;
    price: string | number;
    image: ImageSourcePropType;
    colors: [string, string];
    imageBgClass?: string;
    rating?: string | number;
};


export const topDeals: DealItem[] = [
    {
        name: "Nikon Camera's",
        des: "From",
        price: "₹50,999",
        image: require("../assets/images/Product/nikoncamera.png"),
        colors: ["#C5D9FF", "#FFFFFF"],
        imageBgClass: "bg-[#FFFFFF33]",
    },
    {
        name: "Gaming Laptop",
        des: "From",
        price: "₹30,999",
        image: require("../assets/images/Product/gaminglaptop.png"),
        colors: ["#C5FFF1", "#FFFFFF"],
        imageBgClass: "bg-[#FFFFFF33]",
    },
    {
        name: "Smartwatch",
        des: "From",
        price: "₹20,999",
        image: require("../assets/images/Product/smartwatch.png"),
        colors: ["#FFF3C5", "#FFFFFF"],
        imageBgClass: "bg-[#FFFFFF33]",
    },
];

export const popularPhones: DealItem[] = [
    {
        name: "Samsung S25 Ultra",
        des: "#1 Phone",
        price: "",
        image: require("../assets/images/Product/phone.png"),
        colors: ["#8A38F5", "#FFFFFF"],
        imageBgClass: "bg-[#FFFFFF33]",
    },
    {
        name: "iPhone 16 pro",
        des: "From",
        price: "Best Phone",
        image: require("../assets/images/Product/iphone16pro.png"),
        colors: ["#8A38F5", "#FFFFFF"],
        imageBgClass: "bg-[#FFFFFF33]",
    },
    {
        name: "OnePlus Buds 3",
        des: "From",
        price: "₹5,499",
        image: require("../assets/images/Product/gaminglaptop.png"),
        colors: ["#8A38F5", "#FFFFFF"],
        imageBgClass: "bg-[#FFFFFF33]",
    },
];
