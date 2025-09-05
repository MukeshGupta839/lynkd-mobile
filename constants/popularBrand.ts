// constants/popularBrand.ts
import { ImageSourcePropType } from "react-native";

export type PopularBrand = {
    name: string;
    logo: ImageSourcePropType;
    // top → bottom gradient stops
    colors: [string, string];
};

export const popularBrands: PopularBrand[] = [
    { name: "Apple", logo: require("../assets/images/Product/apple.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "Samsung", logo: require("../assets/images/Product/samsung_logo.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "Pixel", logo: require("../assets/images/Product/Google.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "Vivo", logo: require("../assets/images/Product/Vivo.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "MI", logo: require("../assets/images/Product/mi.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "Motorola", logo: require("../assets/images/Product/Mortola.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "Infinix", logo: require("../assets/images/Product/infinix.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "Oppo", logo: require("../assets/images/Product/oppo.png"), colors: ["#8A38F5", "#FFFFFF"] },
    { name: "Realme", logo: require("../assets/images/Product/realme.png"), colors: ["#8A38F5", "#FFFFFF"] },
];
