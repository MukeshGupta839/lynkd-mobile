// constants/viewshop.ts
export type Product = {
  id: number;
  title: string;
  storage?: string;
  price?: string;
  imageUrl?: string;
};

export type Category = {
  id: number;
  label: string;
  imageUrl?: string;
};

export const BEST_SELLERS: Product[] = [
  {
    id: 101,
    title: "iphone17, Orage Color",
    storage: "256 GB, 8 GB RAM",
    price: "₹120,999",
    imageUrl:
      "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcT6rY8sIsueNTFg8pLhtY2tavgZfjj2r0dlhU4ZDY2dfaayOrfjDZSPPUcVhJ5SuX4_xIaz3rfLGhQO3cJPNrK3QkHqQl073Lxlyd3Hfml-23fVgnsN6USPSrWWTrfT7fiZEz3KQUAq&usqp=CAc",
  },
  {
    id: 102,
    title: "Apple watch Series 9",
    storage: "45mm, Starlight",
    price: "₹ 90,999",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTK0ZjXMNHxa2ZC3jpldY-zXo61rs9OFi9T3vY6H36FwPRLtsG4TbZDbN06TThE0L_CKpTAUJb_4fCs_HAO1qr6FjRnExZl8YYING2pVtAG8bDso7NBzPIeDwUVEEI8Wl1KmM9eY9ba&usqp=CAc",
  },
  {
    id: 103,
    title: "Apple Laptop Air M2",
    storage: "16GB RAM, 512GB",
    price: "₹ 1,29,999",
    imageUrl:
      "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTFtTK3nIw0-y6f-uaDagMN388K7Rn3zCVJi3loqXL1cwXYRYHRRSFYL2ZX_qKrvfMaOSsmsle0av7_H5wNDE4Wx4Ts9aKh3x_3vZMR5FiYCSE3UNRwYvrEMas",
  },
  {
    id: 104,
    title: "Apple earPods Pro",
    storage: "Wireless, Noise Cancelling",
    price: "₹ 24,999",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRD6t4nrNkNqj0PC_rWIDBLwAn3HpYWOuU7EAMuotRdAlgUrvrGEPurFyWVzllPT2Ne4lCBsReI5ZJ7eyKZnc-G7HHaTQywvbM9S1xhp7zSByDSBGXaYNMJHq4",
  },
];

export const CATEGORIES: Category[] = [
  {
    id: 1,
    label: "Mac",
    imageUrl:
      "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSxX2pW1YPQ3UlphPhMqlAYMhkZ94fGk62bljSkznxdM8EmH0nylgiLeRKH8feJCasKKaBGpYeu8SK7xlU0bXyUChlmS0hjO0wXjJlxrBcI",
  },
  {
    id: 2,
    label: "iPhone",
    imageUrl:
      "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTTu8tScYDVWoYrzPOiraHqO8XBY5p3z4IuxgssFcYEuK4ZbYCNGYXVxo9ch-x-QvI9uHZ5F_DH1wHE6oQ4D9SEe72SkRpwVHavGQg9hCaTTDMkpuRhY3T1gqY",
  },
  {
    id: 3,
    label: "iPad",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTxNGJyhDZeduWMTeL5M3umJkfGT1DKGFquiENSYF0u7KKvbz_yQC9bqgusPpS9cQ5JGRW6rkR24dpPpoIHYOvluCccYnCVtP2A9IQObR9Yo_FmI47atbWuDw",
  },
  {
    id: 4,
    label: "Apple Watch",
    imageUrl:
      "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRVep9453sFg0hGUEHbuvhjXqFBs1F4B3hvX6pgBqrvzv9rVEAktagqeGT1ZuEMtIEfGTeqDgkEn3Ks-ob3cKWSCo1n0Qu7kFRxxrizX9suTn31OnJEzw8BDw",
  },
  {
    id: 5,
    label: "AirPods",
    imageUrl:
      "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSJJJpwPHqnXfl8dL5pXCTqz2TqiLvJfkdo8fqcuE5JiUWLl9JcwEQ-NPla12pJgWoESJAMroozoRQcy3rjwG2t-9Vl99PYY57zBU1bT_6UzuwO8E88_oMTSA",
  },
  {
    id: 6,
    label: "AirTag",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSNO-zxDtDYQ0qCdo0gGUEh30k-M-KjbKSxoxb2ze8m3HcMCIVaN3FmXPkUfXwQClNKGq02tNsUMOCgwI7BaQ6LMaKUQYuNwRkFUhKvsEO3lLRMBEtO3K-uFCTpbgUC14RTU_pIjf4w&usqp=CAc",
  },
];

export const PRODUCTS_BY_CATEGORY: Record<number, Product[]> = {
  1: [
    {
      id: 201,
      title: 'MacBook Air M2 13"',
      storage: "8GB RAM, 256GB",
      price: "₹99,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-spacegray-select-202206?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1653563620327",
    },
    {
      id: 202,
      title: 'MacBook Pro 14" M3',
      storage: "16GB RAM, 512GB",
      price: "₹1,99,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-spacegray-select-202301?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1672513437185",
    },
    {
      id: 203,
      title: "Mac Studio",
      storage: "32GB RAM, 1TB",
      price: "₹2,49,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mac-studio-gallery1-202203?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1645055803514",
    },
    {
      id: 204,
      title: "Studio Display",
      storage: "27-inch",
      price: "₹1,29,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/studio-display-select-202203?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1644948245267",
    },
  ],
  2: [
    {
      id: 301,
      title: "iPhone 17 Pro",
      storage: "512GB",
      price: "₹1,49,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-model-unselect-gallery-1-202209?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1662032162018",
    },
    {
      id: 302,
      title: "iPhone 17",
      storage: "256GB",
      price: "₹99,999",
      imageUrl:
        "https://www.apple.com/v/iphone/home/ab/images/overview/hero/hero_static__d1r7ql8qxx6m_large_2x.jpg",
    },
    {
      id: 303,
      title: "iPhone SE",
      storage: "128GB",
      price: "₹39,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-se-red-select-202203?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1645036276227",
    },
    {
      id: 304,
      title: "iPhone Mini",
      storage: "128GB",
      price: "₹59,999",
      imageUrl:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
  ],
  // ... ipad:3, watch:4, airpods:5, airtag:6 (same pattern)
  3: [
    {
      id: 401,
      title: 'iPad Pro 12.9"',
      storage: "16GB, 1TB",
      price: "₹1,29,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-pro-12-9-select-202204?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1653490102840",
    },
    {
      id: 402,
      title: "iPad Air",
      storage: "8GB, 256GB",
      price: "₹69,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-air-select-202203?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1645052846575",
    },
    {
      id: 403,
      title: "iPad 10th Gen",
      storage: "4GB, 64GB",
      price: "₹34,999",
      imageUrl:
        "https://images.unsplash.com/photo-1573497491208-6b1acb260507?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
    {
      id: 404,
      title: "iPad Mini",
      storage: "4GB, 256GB",
      price: "₹49,999",
      imageUrl:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
  ],
  4: [
    {
      id: 501,
      title: "Apple Watch Series 9",
      storage: "45mm",
      price: "₹39,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MY9F2_VW_PF+watch-45-alum-silver-nc-202209_GEO_IN?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1663200727870",
    },
    {
      id: 502,
      title: "Apple Watch Ultra",
      storage: "49mm",
      price: "₹89,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/watch-ultra-select-202209?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1663200722460",
    },
    {
      id: 503,
      title: "Apple Watch SE",
      storage: "40mm",
      price: "₹19,999",
      imageUrl:
        "https://images.unsplash.com/photo-1543898875-7f67b0c257d6?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
    {
      id: 504,
      title: "Hermes Watch",
      storage: "40mm",
      price: "₹1,19,999",
      imageUrl:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
  ],
  5: [
    {
      id: 601,
      title: "AirPods Pro (2nd gen)",
      storage: "Wireless",
      price: "₹24,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/airpods-pro-select-202210?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1661449251353",
    },
    {
      id: 602,
      title: "AirPods Max",
      storage: "Over-ear",
      price: "₹44,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/airpods-max-spacegrey-select-202011?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1604021661000",
    },
    {
      id: 603,
      title: "AirPods 3rd Gen",
      storage: "Wireless",
      price: "₹14,999",
      imageUrl:
        "https://images.unsplash.com/photo-1606813902887-0c6ec27c9b5d?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
    {
      id: 604,
      title: "AirPods (2nd Gen)",
      storage: "Wireless",
      price: "₹9,999",
      imageUrl:
        "https://images.unsplash.com/photo-1518447503058-3b8d7e9f9b3b?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
  ],
  6: [
    {
      id: 701,
      title: "AirTag (single)",
      storage: "1 pack",
      price: "₹2,999",
      imageUrl:
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/airtag-select-202104?wid=400&hei=400&fmt=jpeg&qlt=80&.v=1617761671000",
    },
    {
      id: 702,
      title: "AirTag (4 pack)",
      storage: "4 pack",
      price: "₹9,999",
      imageUrl:
        "https://images.unsplash.com/photo-1612831661250-1a7aa95f2b1c?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
    {
      id: 703,
      title: "AirTag Leather Loop",
      storage: "Accessory",
      price: "₹3,499",
      imageUrl:
        "https://images.unsplash.com/photo-1563720226866-0f02a4f1b4b9?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
    {
      id: 704,
      title: "AirTag Keyring",
      storage: "Accessory",
      price: "₹999",
      imageUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop&crop=entropy",
    },
  ],
};

export const DUMMY_STORE = {
  id: 1,
  name: "Apple",
  location: "Whitefield, Bangulore",
  rating: 3.2,
  reviewsCount: 50,
  deliveryTime: "40 mins",
  deliveryLabel: "FREE",
  logoUrl:
    "https://www.rd.com/wp-content/uploads/2025/09/The-Real-Reason-the-Apple-Logo-Has-a-Bite-Taken-Out-of-It_GettyImages-696091516_FT.jpg",
};
