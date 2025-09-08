// At top of file (or inside `constants/Product.ts` if reused often)
type Product = {
  name: string;
  description?: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  image: any;
  rating?: string;
  reviews?: string;
};

export const products = [
  {
    name: "Sony WH-CH720N, Wireless Active Noise Cancellation Headphones With Mic, Upto 50 Hrs Playtime (Black)",
    description: "Sony s lightest Wireless Noise-cancelling headband ever",
    price: "79,999",
    oldPrice: "89,999",
    image: require("../assets/images/Product/headphone.png"),
    rating: "4.8",
    reviews: "1.2k",
  },
  {
    name: "Apple MacBook Air Apple M4",
    price: "79,999",
    oldPrice: "20,0000",
    image: require("../assets/images/Product/Macbooks.png"),
    rating: "4.4",
    reviews: "1.1k",
  },
  {
    name: "Samsung S25 Ultra",
    description: "Samsung S25 ultra",
    price: "79,999",
    oldPrice: "20,0000",
    image: require("../assets/images/Product/phone.png"),
    rating: "4.4",
    reviews: "1.1k",
  },
  {
    name: "Nikon D3500",
    description: "Nikon D3500 Camera",
    price: "19,999",
    oldPrice: "2,0000",
    image: require("../assets/images/Product/nikoncamera.png"),
    rating: "4.1",
    reviews: "1.1k",
  },
];
