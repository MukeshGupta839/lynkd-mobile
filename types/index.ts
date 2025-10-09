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

export interface Post {
  id: string;
  user_id: string;
  is_creator: boolean;
  caption: string;
  createdAt: string;
  username: string;
  userProfilePic?: string;
  postImage?: string;
  aspect_ratio?: number;
  affiliated?: boolean;
  affiliation?: {
    affiliationID?: string;
    brandName?: string;
    productID?: string;
    productURL?: string;
    productName?: string;
    productImage?: string;
    brandLogo?: string;
    productDescription?: string;
    productRegularPrice?: number;
    productSalePrice?: number;
  };
  likes_count: number;
  comments_count: number;
  text_post?: string;
  post_hashtags: string[];
}
