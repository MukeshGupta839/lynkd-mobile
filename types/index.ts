import { ImageSourcePropType } from "react-native";

export interface Product {
  id: string;
  name: string;
  image: ImageSourcePropType;
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
}
