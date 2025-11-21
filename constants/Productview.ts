// constants/Productview.ts

/* ----------------- 1. Defined Types ----------------- */

export type OptionData = {
  size: string;
  price: number;
  mrp: number;
  stock: number;
};

export type ColorData = {
  name: string;
  hex: string;
  swatch: string;
  images: string[]; // Simplified to array of URL strings
  options: OptionData[];
};

export type StoreInfo = {
  id: number;
  name: string;
  logo: string;
};

export type ProductData = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  store: StoreInfo;
  colors: ColorData[];
  sizeGuide?: {
    title: string;
    metaTitle: string;
    metaSubtitle: string;
    datasets: {
      unit: string;
      rowLabels: string[];
      colLabels: string[];
      values: {
        [key: string]: { [key: string]: string | number };
      };
    }[];
  };
};

// Mapping for kind selection (optional, for your app logic)
export type Kind = "phone" | "facewash" | "clothing";

/* =========================================================
   1. PHONE DATA (iPhone 16)
   ========================================================= */
export const product: ProductData = {
  id: "iphone16",
  name: "Apple iPhone 16",
  rating: 4.5,
  reviews: 2495,
  store: {
    id: 1,
    name: "Apple Store",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  },
  colors: [
    {
      name: "Ultramarine",
      hex: "#6B7CFF",
      swatch:
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSq6CHBr4L-6jhp26luCdk6IE6RVgvsfcV0mMtfNnyXLsAdDBkZThzlQcDjOMmNucrLuPiVxTc-u0zbRKqGid1bQflnkySTIyKmcyBnaUDAkIGgjcCcB1DF",
      images: [
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSq6CHBr4L-6jhp26luCdk6IE6RVgvsfcV0mMtfNnyXLsAdDBkZThzlQcDjOMmNucrLuPiVxTc-u0zbRKqGid1bQflnkySTIyKmcyBnaUDAkIGgjcCcB1DF",
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcS0gNruXLo1m55mte39yteDcB4_TaMA6HHR4tkz8N_CXeT_qN-8pWgnoSpUsWkGEjJkRqeUBkaInR6PLUMX1oaBMu-LiBI8Rv3dQlpGKcSRoCnPGWNfxQHabw",
        "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTF7bjS4_jl7SxLITOJLxueHAJ8NGZLcZwtuTutuxSfSQKUkejjPc3MgkVkePhM0FNIjKY_FKrZLHQYlv0Ljgi4MnNMuccxKfdCKtFH13aTe9S4TGIgJHql-w",
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTalMie7afoiQcZCuWyRbaXq-ZJQYiBSlLKXLb2refUctbnzUwdelrPskI4vtnNnWZgnO8RCa3R15H-vr0HdLORvXNyAXz29ylstWz-4l0m54UxN9RQW7pmTQ",
        "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTySgqsREulNOrfybcN7bbtE4s1_QmGtO1axhGi2Q5UajGH2sQADhc0Ku7rpHzm34cIVJkSKu12gfaYFz9Dvu7oidVlTRVIt9JQrO7faE2YVFId8JI_h2AR_A",
        "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_Ultramarine_PDP_Image_Position_5__en-IN_d31cbbb7-ba49-4b60-8f44-a34b24c58349.jpg?v=1727248694&width=823",
      ],
      options: [
        { size: "128GB", price: 80999, mrp: 109999, stock: 12 },
        { size: "256GB", price: 99999, mrp: 129999, stock: 6 },
        { size: "512GB", price: 121999, mrp: 149999, stock: 0 },
        { size: "1TB", price: 141999, mrp: 169999, stock: 3 },
      ],
    },
    {
      name: "Green",
      hex: "#A5D6A7",
      swatch:
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTAbbh6hnu3TEiyorXRmOLYvDJ9mlr_mzBj39jb8Q6MoMH-vTog6MsbZILr6fbWbchwzpvWaA_zZvzmRUuiFxq9jtiPFhk8p3cb9_FyBDKdt2qcZRaxp0mcYXIw",
      images: [
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTAbbh6hnu3TEiyorXRmOLYvDJ9mlr_mzBj39jb8Q6MoMH-vTog6MsbZILr6fbWbchwzpvWaA_zZvzmRUuiFxq9jtiPFhk8p3cb9_FyBDKdt2qcZRaxp0mcYXIw",
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQ1fTmsXnAfeQxJR9_HUkkSolLCI7b8NHSD-NTsg1-qhBB3oJ5K-N5vcsMZVQ3T-qxRAsrj5nWyYTOMUqFwOMoUeZKgJdxbduGtBZ9-nDoA8q8vs9uhV8LivxpA",
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSvPuEaiVu66oGASENIZm5btzoMciXf09fQPEMrtwOrmgLTGKNnsW43HeBFXm2K8_dfEtxYcgUa9s9rqEWoNvTrCvYFhnUZ4GgmBFcGpcjL_MHxQ0fxl4sNXD4",
        "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTZNygTOQznav8QXepoKgVpZl_1vx8tpvFBwOHtJMMMNwd_gDTgG3p6G74zAonuez17Zg_AA68f95ZWeqn90nbdc8e9vGgIvp2KyDqd7BO-Q1cJkZAauFNj7w",
      ],
      options: [
        { size: "128GB", price: 79999, mrp: 104999, stock: 10 },
        { size: "256GB", price: 97999, mrp: 124999, stock: 2 },
        { size: "512GB", price: 119999, mrp: 144999, stock: 0 },
        { size: "1TB", price: 139999, mrp: 164999, stock: 0 },
      ],
    },
    {
      name: "White",
      hex: "#F5F5F5",
      swatch:
        "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_1__en-IN_7bd324a8-0979-488b-bbb5-4ade23c6db29.jpg?v=1727248729&width=823",
      images: [
        "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_1__en-IN_7bd324a8-0979-488b-bbb5-4ade23c6db29.jpg?v=1727248729&width=823",
        "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_2__en-IN_75cf7d00-d748-4d67-aabb-0ea1192a82c6.jpg?v=1727248737&width=823",
        "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_3__en-IN_977b90e4-4ac9-4be4-996f-d54408a1c816.jpg?v=1727248741&width=823",
      ],
      options: [
        { size: "128GB", price: 78999, mrp: 104999, stock: 25 },
        { size: "256GB", price: 97999, mrp: 124999, stock: 14 },
        { size: "512GB", price: 117999, mrp: 144999, stock: 8 },
        { size: "1TB", price: 139499, mrp: 164999, stock: 1 },
      ],
    },
    {
      name: "Red",
      hex: "#FF0000",
      swatch:
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQTBjyQDHscYjoKbqwPocwJwOGOsFwsqEuCt0eLGU07P1qv1Un52B0b-MwwjVW8ZtxTfN1sf-R9-2Rr1q3JFmNp1RwEz97zIAU7NZpmN0QfTWsJuGCfLD99",
      images: [
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQTBjyQDHscYjoKbqwPocwJwOGOsFwsqEuCt0eLGU07P1qv1Un52B0b-MwwjVW8ZtxTfN1sf-R9-2Rr1q3JFmNp1RwEz97zIAU7NZpmN0QfTWsJuGCfLD99",
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRMnYsmnhHx0mTbtKh3JkiCOLbc0zaXOD4VGaDCSDTZJn3FNtdgupZZSH0Y1Ipfo6xjLJoq81Zk8efOdGnin0bfM7acNjkA8zLumBSMDvvZM_Li2M5n3eRy2Ds",
        "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_Teal_PDP_Image_Position_6__en-IN_9cead0e5-95a0-4ca1-864a-c28741739d3b.jpg?v=1727248649&width=823",
      ],
      options: [
        { size: "128GB", price: 81999, mrp: 109999, stock: 0 },
        { size: "256GB", price: 100999, mrp: 129999, stock: 0 },
        { size: "512GB", price: 122999, mrp: 149999, stock: 0 },
        { size: "1TB", price: 144999, mrp: 169999, stock: 0 },
      ],
    },
    {
      name: "Black",
      hex: "#000000",
      swatch:
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ7lj-fzbvJiHrJEUN_PGbfbBGzy-zkM6zzYdvSzWuRU06l7Yytp8d95UizLGo1Cr8IB7Mx9UUavyFpP_V292-0D0VChA9LeO-0n8nEMQ0kCGo0zgLmd8nxhw",
      images: [
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ7lj-fzbvJiHrJEUN_PGbfbBGzy-zkM6zzYdvSzWuRU06l7Yytp8d95UizLGo1Cr8IB7Mx9UUavyFpP_V292-0D0VChA9LeO-0n8nEMQ0kCGo0zgLmd8nxhw",
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSvnBo-APYnzGggRUSphmKNd42XmJ523ZoBN9J7YAT8xEOiCtj-g3UsaEyRaCeZbV-nLe7FT4InojwPU1RmFwtlcesPTUsm8wBSTrRw15PTRJFOUaZyv7SZLzU",
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSGpGfLEsNjUNQwTkGMiX7KjQcIoQTCPUdscqPQuGBJyRL9UgDLLpt3MAeEeodollvUnvxKSiUGtcnhaScSDGO9Qj3mlXoq3DmBc8zVVtwe7_zmmQvTD8ir",
      ],
      options: [
        { size: "128GB", price: 79999, mrp: 104999, stock: 30 },
        { size: "256GB", price: 98999, mrp: 124999, stock: 18 },
        { size: "512GB", price: 118999, mrp: 144999, stock: 9 },
        { size: "1TB", price: 138999, mrp: 164999, stock: 11 },
      ],
    },
  ],
};

/* =========================================================
   2. FACE WASH DATA
   ========================================================= */
export const productFacewash: ProductData = {
  id: "facewash1",
  name: "Mamaearth Vitamin C Face Wash",
  rating: 4.4,
  reviews: 12000,
  store: {
    id: 2,
    name: "Mamaearth Store",
    logo: "https://seeklogo.com/images/M/mamaearth-logo-9D8B2D1A54-seeklogo.com.png",
  },
  colors: [
    {
      name: "Standard", // Dummy color for single-variant items
      hex: "#ffffff",
      swatch:
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRZlIBslEB3Ok6AyzLX6b8JLlxtWK5zFyP7sOYlt71QYXCFvTu__cnJ8JXjcGhTpjUBdHly3U6DK-2aUTXStBAy8fnrJzk91wF8yNdk4h5ttJKwz_7uwRNmwA",
      images: [
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRZlIBslEB3Ok6AyzLX6b8JLlxtWK5zFyP7sOYlt71QYXCFvTu__cnJ8JXjcGhTpjUBdHly3U6DK-2aUTXStBAy8fnrJzk91wF8yNdk4h5ttJKwz_7uwRNmwA",
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8ZwyGMlZL78AiGufuI-eWt7mQ8Ar7-kW6vp3N6Qd1c3ITaIE5TCGhgpgF03fRxErtIufe30YQ9o3ycqWNN5ekzpdHKeg6Sloz3cer0nmOW5AcqvaLa8jWaaM",
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQy4tp-XMwJB7WNqZ6AqwKiIJcFNE1r2GaTgmcZHWdqa5IAu_9b8r0veBIxMDfBB4QelqZ8mG1CUPpaToBElnMHKrlO45ZcFVmWC7a3p9CxpW7ldcpniU-WYQ",
      ],
      options: [
        { size: "150ml", price: 299, mrp: 399, stock: 25 },
        // Add more sizes here if needed (e.g., "250ml")
      ],
    },
  ],
};

/* =========================================================
   3. CLOTHING DATA
   ========================================================= */
export const productClothing: ProductData = {
  id: "shirt1",
  name: "Men's Cotton Casual Shirt",
  rating: 4.3,
  reviews: 9850,
  store: {
    id: 3,
    name: "Roadster Store",
    logo: "https://cdn.iconscout.com/icon/free/png-256/free-roadster-286393.png",
  },
  colors: [
    {
      name: "White",
      hex: "#F8FAFC",
      swatch:
        "https://t4.ftcdn.net/jpg/08/34/74/29/240_F_834742965_skPxOdONnCPccl7wB96aBbYh5lSEdbpD.jpg",
      images: [
        "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/15557590/2022/2/18/a88d594a-0184-4042-baad-01c2d7874cec1645166286136-Roadster-Men-Shirts-4091645166285596-1.jpg",
        "https://t4.ftcdn.net/jpg/07/13/00/17/240_F_713001734_TO5HBxyFXdAnKGHEM80krE3fXSXoVvG3.jpg",
        "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/17050764/2022/5/25/cc0100cd-073a-4af0-96ee-d6e7221d9de21653455576578-Roadster-Men-Shirts-6791653455575877-1.jpg",
        "https://t4.ftcdn.net/jpg/08/34/74/29/240_F_834742965_skPxOdONnCPccl7wB96aBbYh5lSEdbpD.jpg",
        "https://t4.ftcdn.net/jpg/01/89/43/25/240_F_189432591_DLn2r3JyF3srldxjRrXU9m7AlFTImWQp.jpg",
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSkJVjB-d5RAVHrWWkdt4AUDlYIQFWpto2S5XsgtbLbG7uUJBY3SHxyvP_pMEclhvGoyIlmY0Nj8tkD-EkHJ-7VPwPJVYur-FXakbwRPKfwXtQd4U0ReVId",
        "https://png.pngtree.com/recommend-works/png-clipart/20240509/ourmid/pngtree-white-shirt-png-image_12432349.png",
      ],
      options: [
        { size: "S", price: 899, mrp: 1299, stock: 12 },
        { size: "M", price: 999, mrp: 1299, stock: 9 },
        { size: "L", price: 1099, mrp: 1299, stock: 5 },
        { size: "XL", price: 1199, mrp: 1299, stock: 3 },
        { size: "XXL", price: 1299, mrp: 1299, stock: 7 },
      ],
    },
    {
      name: "Green",
      hex: "#15803d",
      swatch:
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRHP7JabZkHsf9FWYJVc-gCCbLJpvShYsIxUg3AIUBX8fj2wFEq0vQeD3QWj3nXI3nqlbPOhXI_PEMufSyoqrcawc-rajSQgdVaOYP-nFFRIr9-zlg1foC3",
      images: [
        "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRHP7JabZkHsf9FWYJVc-gCCbLJpvShYsIxUg3AIUBX8fj2wFEq0vQeD3QWj3nXI3nqlbPOhXI_PEMufSyoqrcawc-rajSQgdVaOYP-nFFRIr9-zlg1foC3",
        "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQsc5MW1bsMxd1yTw0OXd4YRyMgrDlkhji0tJpRXS800ejRY9W7KbY8sVSAlB6Weaz3S69frONzodpTJEN0sgqziNKhIq3dxQTXdQTqhjDsVRv_oAMCMTAo",
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRjy9zg8wgFGdkUTlRLRguHPqFvoQWjWkFNoKNjEjZ8Ma_YT26gLwracan7Pn_KFK0BUW_n0oY_Fcf-ZKy3JzBX3tXZMVbOz4DX8xra4qGgtx0UUftxPFf-",
        "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTqR-lZeJJckGA8tVfh9MvIT-k4viIQbcEsCiP3SXTd0pY-Y5U9QAxC9FjyWFjxgPDsFCBVmK0gB6o7TwVjHG7VFXKHjoq0Vbe9eb3txgs",
        "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQTLkIOUwZMTUzX6K8dBZ4WkU8_zANTYys4ZVRSGjGc4hvc4NdlWkrGaJp4ODH1CG5M0Xa05Lxg7MYGVemZ90-Jg60BETUTmKiU6ATU38c",
        "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRUCtMuO-S4hfoHFK4Y3KpUvjEr68E0jUhvUC-ZA8XjV1y_3Hpyi0tuD8rgyv_YZJwgS7Z0Sl7pC3FbKLNlv2vI2VHpKuiNTc70MKpT0h3y2JtN9Wy1QDiKfA",
      ],
      options: [
        // Prices derived from your previous data logic
        { size: "S", price: 899, mrp: 1299, stock: 0 },
        { size: "M", price: 899, mrp: 1299, stock: 5 },
        { size: "L", price: 899, mrp: 1299, stock: 10 },
        { size: "XL", price: 899, mrp: 1299, stock: 2 },
        { size: "XXL", price: 899, mrp: 1299, stock: 4 },
      ],
    },
  ],
  sizeGuide: {
    title: "Size guide",
    metaTitle: "Veirdo Size Chart",
    metaSubtitle: "IN OVERSIZED T-SHIRT",
    datasets: [
      {
        unit: "in",
        rowLabels: ["Brand Size", "Chest", "Length"],
        colLabels: ["S", "M", "L", "XL", "XXL", "XXXL"],
        values: {
          "Brand Size": {
            S: "S",
            M: "M",
            L: "L",
            XL: "XL",
            XXL: "XXL",
            XXXL: "XXXL",
          },
          Chest: { S: 38, M: 40, L: 42, XL: 44, XXL: 46, XXXL: 48 },
          Length: { S: 28, M: 29, L: 30, XL: 31, XXL: 32, XXXL: 33 },
        },
      },
      {
        unit: "cm",
        rowLabels: ["Brand Size", "Chest", "Length"],
        colLabels: ["S", "M", "L", "XL", "XXL", "XXXL"],
        values: {
          "Brand Size": {
            S: "S",
            M: "M",
            L: "L",
            XL: "XL",
            XXL: "XXL",
            XXXL: "XXXL",
          },
          Chest: { S: 97, M: 102, L: 107, XL: 112, XXL: 117, XXXL: 122 },
          Length: { S: 71, M: 74, L: 76, XL: 79, XXL: 81, XXXL: 84 },
        },
      },
    ],
  },
};

/* Optional helper to pick quickly in UI/dev */
export const productByKind = {
  phone: product,
  facewash: productFacewash,
  clothing: productClothing,
};
